"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { projectsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";

const SERVICE_OPTIONS = [
  "AI Development",
  "Business Website",
  "E-Commerce Website",
  "Mobile App",
  "Portfolio/Casestudy Website",
  "Web App",
  "Support and Maintenance",
  "Other",
] as const;

type ServiceOption = (typeof SERVICE_OPTIONS)[number];

const SERVICE_DESCRIPTIONS: Record<ServiceOption, string> = {
  "Business Website":
    "Professional website for your business with company information, services, and contact details",
  "E-Commerce Website":
    "Online store with product catalog, shopping cart, and payment integration",
  "Mobile App":
    "Native and cross-platform mobile applications to serve business needs for iOS and Android",
  "Portfolio/Casestudy Website":
    "Showcase your work, projects, and achievements with case studies and testimonials for your customers to experience your service or proudct",
  "Web App":
    "Tailored software solutions built to meet your specific business needs",
  "Support and Maintenance":
    "Ongoing website maintenance, updates, and hosting services",
  "AI Development":
    "Develop and integrate AI-driven solutions to automate processes, enhance decision-making, improve efficiency, and unlock data-driven business intelligence.",
  Other: "Specify a custom service not listed above",
};

const OBJECTIVE_OPTIONS = [
  "Brand Presence",
  "Lead Generation",
  "Digital Transformation",
  "Automation",
  "E-Commerce",
  "Analytics",
  "Customer Engagement",
  "Revenue Generation",
  "Cost Reduction",
  "Risk Mitigation",
  "Compliance",
  "Scalability",
  "Security",
  "Data Management",
  "Data Accuracy",
  "Data Collection",
  "Data Security",
  "Data Privacy",
  "Data Protection",
  "Customer Satisfaction",
  "Customer Retention",
  "Customer Loyalty",
  "Customer Acquisition",
  "Customer Relationship Management",
  "Customer Experience",
  "Customer Support",
  "Customer Feedback",
  "Customer Insights",
  "Customer Satisfaction",
  "Operational Excellence",
  "Operational Efficiency",
  "Operational Effectiveness",
  "Productivity Improvement",
  "Quality Improvement",
  "Cost Reduction",
  "Team Collaboration",
  "Team Communication",
  "Team Productivity",
  "Team Efficiency",
  "Team Effectiveness",
  "Availability Improvement",
  "Process Optimization",
  "Delivery Improvement",
  "Sustainability",
] as const;

type ObjectiveOption = (typeof OBJECTIVE_OPTIONS)[number];

interface ProjectFormData {
  project_name: string;
  services_offered: ServiceOption | null;
  other_service_description: string;
  planned_date: string;
  target_date: string;
  ux_preference: string;
  pages_views: string[];
  target_audience: string;
  functional_requirements: string;
  non_functional_requirements: string;
  technology_stack: string;
  business_objectives: string[];
  kpi: string;
  target_users: string;
  references: string;
  support_coverage: string;
  support_engagement_model: string[];
  support_channels: string[];
  scheduled_review_calls: string;
  backup_frequency: string;
  backup_retention_period: string;
  reports_required: string[];
  incident_alerts: string[];
}

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [objectiveSearch, setObjectiveSearch] = useState("");
  const [showObjectiveDropdown, setShowObjectiveDropdown] = useState(false);
  const [availableObjectives, setAvailableObjectives] = useState<string[]>([
    ...OBJECTIVE_OPTIONS,
  ]);
  const [pageViewSearch, setPageViewSearch] = useState("");
  const [showPageViewDropdown, setShowPageViewDropdown] = useState(false);

  // Fetch objectives from API on component mount
  useEffect(() => {
    const fetchObjectives = async () => {
      try {
        const response = await projectsApi.getObjectives();
        if (response.objectives && response.objectives.length > 0) {
          setAvailableObjectives(response.objectives);
        } else {
          // Fallback to hardcoded list if API returns empty
          setAvailableObjectives([...OBJECTIVE_OPTIONS]);
        }
      } catch (err) {
        console.error(
          "Failed to fetch objectives from API, using fallback:",
          err,
        );
        // Fallback to hardcoded list on error
        setAvailableObjectives([...OBJECTIVE_OPTIONS]);
      }
    };

    fetchObjectives();
  }, []);

  const [formData, setFormData] = useState<ProjectFormData>({
    project_name: "",
    services_offered: null,
    other_service_description: "",
    planned_date: new Date().toISOString().split("T")[0],
    target_date: "",
    ux_preference: "",
    pages_views: [],
    target_audience: "",
    functional_requirements: "",
    non_functional_requirements: "",
    technology_stack: "",
    business_objectives: [],
    kpi: "",
    target_users: "",
    references: "",
    support_coverage: "",
    support_engagement_model: [],
    support_channels: [],
    scheduled_review_calls: "",
    backup_frequency: "",
    backup_retention_period: "",
    reports_required: [],
    incident_alerts: [],
  });

  const validatePage1 = (): boolean => {
    if (!formData.project_name.trim()) {
      setError("Project name is required");
      return false;
    }
    if (!formData.services_offered) {
      setError("Please select a service");
      return false;
    }
    if (
      formData.services_offered === "Other" &&
      !formData.other_service_description.trim()
    ) {
      setError("Please provide a description for the 'Other' service");
      return false;
    }

    return true;
  };

  const validatePage3 = (): boolean => {
    if (!formData.support_coverage) {
      setError("Please select a Preferred Support Coverage option");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError(null);
    if (currentPage === 1 && !validatePage1()) {
      return;
    }
    if (currentPage < 3) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only submit if we're on the last page (page 3)
    if (currentPage !== 3) {
      // If not on last page, just go to next page and prevent any submission
      handleNext();
      return;
    }

    // Double check we're on page 3 before proceeding
    if (currentPage !== 3) {
      return;
    }

    setError(null);
    setLoading(true);

    // Final validation
    if (!validatePage1()) {
      setLoading(false);
      return;
    }
    if (!validatePage3()) {
      setLoading(false);
      return;
    }

    try {
      // Prepare project data for REST API
      const projectData = {
        project_name: formData.project_name,
        services_offered: formData.services_offered
          ? [formData.services_offered]
          : [],
        other_service_description:
          formData.other_service_description || undefined,
        start_date: formData.planned_date,
        target_date: formData.target_date,
        ux_preference: formData.ux_preference,
        pages_views: formData.pages_views,
        target_audience: formData.target_audience,
        functional_requirements: formData.functional_requirements,
        non_functional_requirements: formData.non_functional_requirements,
        technology_stack: formData.technology_stack,
        business_objectives: formData.business_objectives,
        kpi: formData.kpi,
        target_users: formData.target_users,
        project_references: formData.references,
        support_coverage: formData.support_coverage,
        support_engagement_model: formData.support_engagement_model,
        support_channels: formData.support_channels,
        scheduled_review_calls: formData.scheduled_review_calls,
        backup_frequency: formData.backup_frequency,
        backup_retention_period: formData.backup_retention_period,
        reports_required: formData.reports_required,
        incident_alerts: formData.incident_alerts,
      };

      // Create project using REST API
      await projectsApi.create(projectData);

      // Redirect to projects page on success
      router.push("/projects");
    } catch (err) {
      console.error("Error creating project:", err);
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/projects">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Create New Project</h1>
          <p className="text-gray-600 mt-2">
            Fill in the details to create a new project
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Page Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-center space-x-4">
            <div
              className={`flex items-center ${
                currentPage >= 1 ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  currentPage >= 1
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "border-gray-300"
                }`}
              >
                1
              </div>
              <span className="ml-2 font-medium">Basic Info</span>
            </div>
            <div
              className={`h-0.5 w-16 ${
                currentPage >= 2 ? "bg-blue-600" : "bg-gray-300"
              }`}
            />
            <div
              className={`flex items-center ${
                currentPage >= 2 ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  currentPage >= 2
                    ? "bg-blue-600 border-blue-600 text-white"
                    : currentPage > 2
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-gray-300"
                }`}
              >
                2
              </div>
              <span className="ml-2 font-medium">Requirements</span>
            </div>
            <div
              className={`h-0.5 w-16 ${
                currentPage >= 3 ? "bg-blue-600" : "bg-gray-300"
              }`}
            />
            <div
              className={`flex items-center ${
                currentPage >= 3 ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  currentPage >= 3
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "border-gray-300"
                }`}
              >
                3
              </div>
              <span className="ml-2 font-medium">Support</span>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            // Prevent form submission on Enter key unless we're on page 3
            if (e.key === "Enter" && currentPage !== 3) {
              e.preventDefault();
              // If on page 2, navigate to page 3 instead
              if (currentPage === 2) {
                handleNext();
              }
            }
          }}
        >
          {/* Page 1: Basic Information */}
          {currentPage === 1 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="project_name">
                      Project Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="project_name"
                      value={formData.project_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          project_name: e.target.value,
                        })
                      }
                      placeholder="Enter project name"
                      required
                    />
                  </div>

                  <div>
                    <Label>Scope of Work</Label>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {SERVICE_OPTIONS.map((service) => {
                        const isSelected =
                          formData.services_offered === service;
                        return (
                          <button
                            key={service}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setFormData({
                                  ...formData,
                                  services_offered: null,
                                  ...(service === "Other" && {
                                    other_service_description: "",
                                  }),
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  services_offered: service,
                                  ...(service !== "Other" && {
                                    other_service_description: "",
                                  }),
                                });
                              }
                            }}
                            className={`
                              relative p-4 rounded-lg border-2 transition-all duration-200
                              text-left cursor-pointer
                              ${
                                isSelected
                                  ? "border-blue-600 bg-blue-50 shadow-md"
                                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                              }
                              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                            `}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span
                                    className={`text-sm font-medium capitalize ${
                                      isSelected
                                        ? "text-blue-900"
                                        : "text-gray-700"
                                    }`}
                                  >
                                    {service}
                                  </span>
                                  {isSelected && (
                                    <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                      <svg
                                        className="h-3 w-3 text-white"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path d="M5 13l4 4L19 7"></path>
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                <p
                                  className={`text-xs mt-1 ${
                                    isSelected
                                      ? "text-blue-700"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {SERVICE_DESCRIPTIONS[service]}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {!formData.services_offered && (
                      <p className="text-sm text-gray-500 mt-2">
                        Select a service
                      </p>
                    )}
                    {formData.services_offered === "Other" && (
                      <div className="mt-4">
                        <Label htmlFor="other_service_description">
                          Please describe the "Other" service{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="other_service_description"
                          value={formData.other_service_description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              other_service_description: e.target.value,
                            })
                          }
                          placeholder="Enter description of the custom service"
                          className="mt-2"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Provide details about the custom service you need
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="planned_date">Planned Date</Label>
                      <Input
                        id="planned_date"
                        type="date"
                        value={formData.planned_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            planned_date: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="target_date">Target Date</Label>
                      <Input
                        id="target_date"
                        type="date"
                        value={formData.target_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            target_date: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Project Objectives</Label>
                    <p className="text-xs text-gray-500 mt-1 mb-3">
                      Search and select all applicable business objectives for
                      this project
                    </p>

                    {/* Selected Objectives as Badges */}
                    {formData.business_objectives.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {formData.business_objectives.map((objective) => (
                          <Badge
                            key={objective}
                            variant="secondary"
                            className="px-3 py-1 text-sm flex items-center gap-2"
                          >
                            {objective}
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  business_objectives:
                                    formData.business_objectives.filter(
                                      (obj) => obj !== objective,
                                    ),
                                });
                              }}
                              className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                              aria-label={`Remove ${objective}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Search Input and Dropdown */}
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="text"
                          placeholder="Add objectives..."
                          value={objectiveSearch}
                          onChange={(e) => {
                            setObjectiveSearch(e.target.value);
                            setShowObjectiveDropdown(true);
                          }}
                          onFocus={() => setShowObjectiveDropdown(true)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && objectiveSearch.trim()) {
                              e.preventDefault();
                              const trimmed = objectiveSearch.trim();
                              const isExisting = availableObjectives.some(
                                (opt) =>
                                  opt.toLowerCase() === trimmed.toLowerCase(),
                              );
                              const isAlreadySelected =
                                formData.business_objectives.some(
                                  (obj) =>
                                    obj.toLowerCase() === trimmed.toLowerCase(),
                                );

                              if (!isExisting && !isAlreadySelected) {
                                setFormData({
                                  ...formData,
                                  business_objectives: [
                                    ...formData.business_objectives,
                                    trimmed,
                                  ],
                                });
                                setObjectiveSearch("");
                                setShowObjectiveDropdown(false);
                              } else if (isExisting && !isAlreadySelected) {
                                setFormData({
                                  ...formData,
                                  business_objectives: [
                                    ...formData.business_objectives,
                                    availableObjectives.find(
                                      (opt) =>
                                        opt.toLowerCase() ===
                                        trimmed.toLowerCase(),
                                    )!,
                                  ],
                                });
                                setObjectiveSearch("");
                                setShowObjectiveDropdown(false);
                              }
                            }
                          }}
                          className="pl-10"
                        />
                      </div>

                      {/* Dropdown List */}
                      {showObjectiveDropdown && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => {
                              setShowObjectiveDropdown(false);
                              setObjectiveSearch("");
                            }}
                          />
                          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                            {(() => {
                              const filteredOptions =
                                availableObjectives.filter(
                                  (objective) =>
                                    !formData.business_objectives.includes(
                                      objective,
                                    ) &&
                                    objective
                                      .toLowerCase()
                                      .includes(objectiveSearch.toLowerCase()),
                                );

                              const canAddCustom =
                                objectiveSearch.trim() &&
                                !availableObjectives.some(
                                  (opt) =>
                                    opt.toLowerCase() ===
                                    objectiveSearch.trim().toLowerCase(),
                                ) &&
                                !formData.business_objectives.some(
                                  (obj) =>
                                    obj.toLowerCase() ===
                                    objectiveSearch.trim().toLowerCase(),
                                );

                              if (
                                filteredOptions.length === 0 &&
                                !canAddCustom
                              ) {
                                return (
                                  <div className="px-4 py-3 text-sm text-gray-500">
                                    {objectiveSearch
                                      ? "No matching objectives found"
                                      : "All objectives selected"}
                                  </div>
                                );
                              }

                              return (
                                <>
                                  {filteredOptions.map((objective) => (
                                    <button
                                      key={objective}
                                      type="button"
                                      onClick={() => {
                                        setFormData({
                                          ...formData,
                                          business_objectives: [
                                            ...formData.business_objectives,
                                            objective,
                                          ],
                                        });
                                        setObjectiveSearch("");
                                        setShowObjectiveDropdown(false);
                                      }}
                                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm transition-colors"
                                    >
                                      {objective}
                                    </button>
                                  ))}
                                  {canAddCustom && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFormData({
                                          ...formData,
                                          business_objectives: [
                                            ...formData.business_objectives,
                                            objectiveSearch.trim(),
                                          ],
                                        });
                                        setObjectiveSearch("");
                                        setShowObjectiveDropdown(false);
                                      }}
                                      className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm transition-colors border-t border-gray-200 flex items-center gap-2"
                                    >
                                      <span className="text-blue-600">
                                        Add "{objectiveSearch.trim()}"
                                      </span>
                                    </button>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="kpi">Goals</Label>
                    <Textarea
                      id="kpi"
                      value={formData.kpi}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          kpi: e.target.value,
                        })
                      }
                      placeholder="# SMART Goals and KPIs&#10;&#10;## Specific&#10;- Increase monthly sign-ups by 25%&#10;&#10;## Measurable&#10;- Track conversion rate (target: 5%)&#10;&#10;## Achievable&#10;- Improve page load time to &lt; 2 seconds&#10;&#10;## Relevant&#10;- Align with Q4 business targets&#10;&#10;## Time-bound&#10;- Achieve goals within 6 months&#10;&#10;## Key Performance Indicators&#10;- User engagement rate&#10;- Conversion rate&#10;- Customer satisfaction score"
                      rows={12}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Define Specific, Measurable, Achievable, Relevant, and
                      Time-bound goals along with Key Performance Indicators
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="target_users">Target Users</Label>
                    <Textarea
                      id="target_users"
                      value={formData.target_users}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          target_users: e.target.value,
                        })
                      }
                      placeholder="# Target Users&#10;&#10;## Primary Audience&#10;- Age: 25-45&#10;- Occupation: Small business owners&#10;- Location: Urban areas&#10;- Tech-savviness: Moderate&#10;&#10;## User Personas&#10;&#10;### Persona 1: The Entrepreneur&#10;- Demographics: 30-40 years old, business owner&#10;- Goals: Grow online presence, attract customers&#10;- Pain points: Limited time, budget constraints&#10;&#10;### Persona 2: The Marketing Manager&#10;- Demographics: 28-35 years old, marketing professional&#10;- Goals: Generate leads, track performance&#10;- Pain points: Need data-driven insights"
                      rows={12}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Describe your target users, including demographics,
                      personas, goals, and pain points
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="references">References</Label>
                    <Textarea
                      id="references"
                      value={formData.references}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          references: e.target.value,
                        })
                      }
                      placeholder="# References&#10;&#10;## Design Inspiration&#10;- Website: https://example.com/design&#10;- App: https://example.com/app&#10;&#10;## Competitor Analysis&#10;- Competitor 1: https://competitor1.com&#10;- Competitor 2: https://competitor2.com&#10;&#10;## Brand Guidelines&#10;- Brand colors: #FF5733, #33C3F0&#10;- Typography: Inter, Roboto&#10;&#10;## Additional Resources&#10;- Documentation: https://docs.example.com&#10;- Style guide: https://style.example.com"
                      rows={10}
                      className="font-mono text-sm h-80"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Add links to design inspirations, competitor websites,
                      brand guidelines, or any other relevant references
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Page 2: Requirements */}
          {currentPage === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Use Markdown format to document your requirements
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="ux_preference">UX Design Preference</Label>
                  <Textarea
                    id="ux_preference"
                    value={formData.ux_preference}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ux_preference: e.target.value,
                      })
                    }
                    placeholder="#UX Design Preferences  ## 1. Describe the design choices for this project..."
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supports Markdown formatting (headers, lists, bold, italic,
                    etc.)
                  </p>
                </div>

                <div>
                  <Label>Pages/Views</Label>
                  <p className="text-xs text-gray-500 mt-1 mb-3">
                    Search and add all pages or views required for this project
                  </p>

                  {/* Selected Pages/Views as Badges */}
                  {formData.pages_views.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.pages_views.map((pageView) => (
                        <Badge
                          key={pageView}
                          variant="secondary"
                          className="px-3 py-1 text-sm flex items-center gap-2"
                        >
                          {pageView}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                pages_views: formData.pages_views.filter(
                                  (pv) => pv !== pageView,
                                ),
                              });
                            }}
                            className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                            aria-label={`Remove ${pageView}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Search Input and Dropdown */}
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Add pages/views..."
                        value={pageViewSearch}
                        onChange={(e) => {
                          setPageViewSearch(e.target.value);
                          setShowPageViewDropdown(true);
                        }}
                        onFocus={() => setShowPageViewDropdown(true)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && pageViewSearch.trim()) {
                            e.preventDefault();
                            const trimmed = pageViewSearch.trim();
                            const isAlreadySelected = formData.pages_views.some(
                              (pv) =>
                                pv.toLowerCase() === trimmed.toLowerCase(),
                            );

                            if (!isAlreadySelected) {
                              setFormData({
                                ...formData,
                                pages_views: [...formData.pages_views, trimmed],
                              });
                              setPageViewSearch("");
                              setShowPageViewDropdown(false);
                            }
                          }
                        }}
                        className="pl-10"
                      />
                    </div>

                    {/* Dropdown List */}
                    {showPageViewDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => {
                            setShowPageViewDropdown(false);
                            setPageViewSearch("");
                          }}
                        />
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                          {(() => {
                            const canAddCustom =
                              pageViewSearch.trim() &&
                              !formData.pages_views.some(
                                (pv) =>
                                  pv.toLowerCase() ===
                                  pageViewSearch.trim().toLowerCase(),
                              );

                            if (!canAddCustom) {
                              return (
                                <div className="px-4 py-3 text-sm text-gray-500">
                                  {pageViewSearch
                                    ? "This page/view is already added"
                                    : "Type to add a new page/view"}
                                </div>
                              );
                            }

                            return (
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    pages_views: [
                                      ...formData.pages_views,
                                      pageViewSearch.trim(),
                                    ],
                                  });
                                  setPageViewSearch("");
                                  setShowPageViewDropdown(false);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm transition-colors flex items-center gap-2"
                              >
                                <span className="text-blue-600">
                                  Add "{pageViewSearch.trim()}"
                                </span>
                              </button>
                            );
                          })()}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="functional_requirements">
                    Business Requirements
                  </Label>
                  <Textarea
                    id="functional_requirements"
                    value={formData.functional_requirements}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        functional_requirements: e.target.value,
                      })
                    }
                    placeholder="# Business Requirements&#10;&#10;## Feature 1&#10;- Requirement 1&#10;- Requirement 2&#10;&#10;## Feature 2&#10;- Requirement 1"
                    rows={12}
                    className="font-mono text-sm h-80"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use Markdown to structure your functional requirements
                  </p>
                </div>

                <div>
                  <Label htmlFor="non_functional_requirements">
                    Non-Functional Requirements
                  </Label>
                  <Textarea
                    id="non_functional_requirements"
                    value={formData.non_functional_requirements}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        non_functional_requirements: e.target.value,
                      })
                    }
                    placeholder="# Non-Functional Requirements&#10;&#10;## Performance&#10;- Response time &lt; 2 seconds&#10;&#10;## Security&#10;- SSL/TLS encryption required&#10;&#10;## Scalability&#10;- Support 10,000+ concurrent users"
                    rows={12}
                    className="font-mono text-sm h-80"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Document performance, security, scalability, and other
                    non-functional requirements
                  </p>
                </div>

                <div>
                  <Label htmlFor="technology_stack">Technology Stack</Label>
                  <Textarea
                    id="technology_stack"
                    value={formData.technology_stack}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        technology_stack: e.target.value,
                      })
                    }
                    placeholder="# Technology Stack&#10;&#10;## Frontend&#10;- Framework: React, Next.js&#10;- UI Library: Tailwind CSS, shadcn/ui&#10;- State Management: Zustand, Redux&#10;&#10;## Backend&#10;- Runtime: Node.js, Deno&#10;- Framework: Express, Hono&#10;- Database: PostgreSQL, Supabase&#10;&#10;## Infrastructure&#10;- Hosting: Vercel, AWS&#10;- CI/CD: GitHub Actions&#10;- Monitoring: Sentry&#10;&#10;## Third-party Services&#10;- Authentication: Auth0, Clerk&#10;- Payments: Stripe&#10;- Analytics: PostHog"
                    rows={12}
                    className="font-mono text-sm h-80"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Specify the technologies, frameworks, libraries, and tools
                    to be used in this project
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Page 3: Support */}
          {currentPage === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Support Configuration</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Configure support coverage, engagement models, and
                  communication preferences
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 1. Preferred Support Coverage */}
                <div>
                  <Label>
                    Preferred Support Coverage{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="mt-2 space-y-2">
                    {[
                      "Standard Support (Mon–Fri, 9:00 AM – 6:00 PM IST)",
                      "Premium Support (7 days a week, 9:00 AM – 9:00 PM IST)",
                      "Hypercare (24/7 Critical Support For mission-critical systems)",
                    ].map((option) => (
                      <label
                        key={option}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="support_coverage"
                          value={option}
                          checked={formData.support_coverage === option}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              support_coverage: e.target.value,
                            })
                          }
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 4. Scheduled Review Calls */}
                <div>
                  <Label htmlFor="scheduled_review_calls">
                    Scheduled Review Calls
                  </Label>
                  <Select
                    value={formData.scheduled_review_calls}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        scheduled_review_calls: value,
                      })
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select review call frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="BiWeekly">BiWeekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Quarterly">Quarterly</SelectItem>
                      <SelectItem value="Annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 6. Backup & Disaster Recovery */}
                <div className="space-y-4">
                  <div>
                    <Label>Backup & Disaster Recovery</Label>
                  </div>
                  <div>
                    <Label htmlFor="backup_frequency" className="text-sm">
                      Frequency
                    </Label>
                    <Select
                      value={formData.backup_frequency}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          backup_frequency: value,
                        })
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select backup frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Daily">Daily</SelectItem>
                        <SelectItem value="Weekly">Weekly</SelectItem>
                        <SelectItem value="Custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label
                      htmlFor="backup_retention_period"
                      className="text-sm"
                    >
                      Retention Period
                    </Label>
                    <Select
                      value={formData.backup_retention_period}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          backup_retention_period: value,
                        })
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select retention period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7 Days">7 Days</SelectItem>
                        <SelectItem value="30 Days">30 Days</SelectItem>
                        <SelectItem value="90 Days">90 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 7. Reports Required */}
                <div>
                  <Label>Reports Required</Label>
                  <div className="mt-2 space-y-2">
                    {[
                      "SLA compliance report",
                      "Ticket resolution report",
                      "KPI Performance metrics",
                      "Improvement recommendations",
                    ].map((option) => (
                      <label
                        key={option}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.reports_required.includes(option)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                reports_required: [
                                  ...formData.reports_required,
                                  option,
                                ],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                reports_required:
                                  formData.reports_required.filter(
                                    (item) => item !== option,
                                  ),
                              });
                            }
                          }}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {/* 3. Support Channels Required */}
                <div>
                  <Label>Support Channels Required</Label>
                  <div className="mt-2 space-y-2">
                    {[
                      "Email Support",
                      "Ticketing System (Zoho Desk / Freshdesk / Jira)",
                      "WhatsApp / Phone",
                      "Wraptron Studio",
                    ].map((option) => (
                      <label
                        key={option}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.support_channels.includes(option)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                support_channels: [
                                  ...formData.support_channels,
                                  option,
                                ],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                support_channels:
                                  formData.support_channels.filter(
                                    (item) => item !== option,
                                  ),
                              });
                            }
                          }}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 8. Incident Alerts & Notifications */}
                <div>
                  <Label>Incident Alerts & Notifications</Label>
                  <div className="mt-2 space-y-2">
                    {["Email", "Whatsapp", "Dashboard", "SMS"].map((option) => (
                      <label
                        key={option}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.incident_alerts.includes(option)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                incident_alerts: [
                                  ...formData.incident_alerts,
                                  option,
                                ],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                incident_alerts:
                                  formData.incident_alerts.filter(
                                    (item) => item !== option,
                                  ),
                              });
                            }
                          }}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <div>
              {currentPage > 1 && (
                <Button
                  type="button"
                  onClick={handlePrevious}
                  variant="outline"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>
            <div className="flex gap-4">
              <Link href="/projects">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              {currentPage < 3 ? (
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleNext();
                  }}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading || currentPage !== 3}
                  onClick={(e) => {
                    if (currentPage !== 3) {
                      e.preventDefault();
                      e.stopPropagation();
                      return;
                    }
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Project"
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
