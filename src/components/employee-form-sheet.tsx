"use client";

import React, { useState, useEffect } from "react";
import { useSheetPush } from "@/contexts/sheet-push-context";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { employeesApi, type CreateEmployeeInput, type Employee } from "@/lib/api";

const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];
const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const MARITAL_OPTIONS = ["Single", "Married", "Divorced", "Widowed"];
const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "intern", label: "Intern" },
  { value: "temporary", label: "Temporary" },
];
const EMPLOYMENT_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "on_leave", label: "On Leave" },
  { value: "terminated", label: "Terminated" },
  { value: "resigned", label: "Resigned" },
];

export interface EmployeeFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  employee?: Employee | null;
}

const getInitialFormState = (employee?: Employee | null): CreateEmployeeInput & { emp_code: string } => ({
  emp_code: employee?.emp_code ?? "",
  first_name: employee?.first_name ?? "",
  middle_name: employee?.middle_name ?? "",
  last_name: employee?.last_name ?? "",
  date_of_birth: employee?.date_of_birth?.slice(0, 10) ?? "",
  gender: employee?.gender ?? "",
  bloodgroup: employee?.bloodgroup ?? "",
  marital_status: employee?.marital_status ?? "",
  phone: employee?.phone ?? "",
  email: employee?.email ?? "",
  personal_email: employee?.personal_email ?? "",
  present_address: employee?.present_address ?? "",
  permanent_address: employee?.permanent_address ?? "",
  e_contact: employee?.e_contact ?? "",
  employment_status: (employee?.employment_status as CreateEmployeeInput["employment_status"]) ?? "active",
  employment_type: employee?.employment_type ?? undefined,
  join_date: employee?.join_date?.slice(0, 10) ?? "",
  exit_date: employee?.exit_date?.slice(0, 10) ?? "",
  education_institution: employee?.education_institution ?? "",
  education_year_passing: employee?.education_year_passing ?? "",
  education_grade: employee?.education_grade ?? "",
  pan: employee?.pan ?? "",
  aadhar_number: employee?.aadhar_number ?? "",
  bank_account_name: employee?.bank_account_name ?? "",
  bank_name: employee?.bank_name ?? "",
  bank_ifsc: employee?.bank_ifsc ?? "",
  bank_account_number: employee?.bank_account_number ?? "",
  salary_basic: employee?.salary_basic ?? undefined,
  father_name: employee?.father_name ?? "",
  role: employee?.role ?? "",
  department: employee?.department ?? "",
  designation: employee?.designation ?? "",
});

const MAIN_CONTENT_PORTAL_ID = "main-content-portal";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground border-b pb-1">
        {title}
      </h4>
      {children}
    </div>
  );
}

export function EmployeeFormSheet({
  open,
  onOpenChange,
  onSuccess,
  employee,
}: EmployeeFormSheetProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(getInitialFormState(employee));
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const setSheetOpen = useSheetPush()?.setSheetOpen;

  useEffect(() => {
    setContainer(document.getElementById(MAIN_CONTENT_PORTAL_ID));
  }, []);

  // Report actual sheet width so layout only pushes by required width
  useEffect(() => {
    if (!open) {
      setSheetOpen?.(false);
      return;
    }
    const portal = document.getElementById(MAIN_CONTENT_PORTAL_ID);
    const sheetEl = portal?.querySelector("[data-slot='sheet-content']");
    if (!sheetEl) {
      const t = setTimeout(() => {
        const el = document.getElementById(MAIN_CONTENT_PORTAL_ID)?.querySelector("[data-slot='sheet-content']");
        if (el) setSheetOpen?.(true, Math.ceil((el as HTMLElement).getBoundingClientRect().width));
      }, 350);
      return () => {
        clearTimeout(t);
        setSheetOpen?.(false);
      };
    }
    const updateWidth = () => setSheetOpen?.(true, Math.ceil((sheetEl as HTMLElement).getBoundingClientRect().width));
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(sheetEl);
    return () => {
      ro.disconnect();
      setSheetOpen?.(false);
    };
  }, [open, setSheetOpen]);

  useEffect(() => {
    if (open) setFormData(getInitialFormState(employee));
  }, [open, employee]);

  const resetForm = () => {
    setFormData(getInitialFormState(null));
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm();
    onOpenChange(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: CreateEmployeeInput = {
        emp_code: formData.emp_code.trim(),
        first_name: formData.first_name.trim(),
        middle_name: formData.middle_name?.trim() || undefined,
        last_name: formData.last_name.trim(),
        date_of_birth: formData.date_of_birth || undefined,
        gender: formData.gender || undefined,
        bloodgroup: formData.bloodgroup || undefined,
        marital_status: formData.marital_status || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        personal_email: formData.personal_email || undefined,
        present_address: formData.present_address || undefined,
        permanent_address: formData.permanent_address || undefined,
        e_contact: formData.e_contact || undefined,
        employment_status: formData.employment_status,
        employment_type: formData.employment_type,
        join_date: formData.join_date || undefined,
        exit_date: formData.exit_date || undefined,
        education_institution: formData.education_institution || undefined,
        education_year_passing: formData.education_year_passing || undefined,
        education_grade: formData.education_grade || undefined,
        pan: formData.pan || undefined,
        aadhar_number: formData.aadhar_number || undefined,
        bank_account_name: formData.bank_account_name || undefined,
        bank_name: formData.bank_name || undefined,
        bank_ifsc: formData.bank_ifsc || undefined,
        bank_account_number: formData.bank_account_number || undefined,
        salary_basic: formData.salary_basic,
        father_name: formData.father_name || undefined,
        role: formData.role || undefined,
        department: formData.department || undefined,
        designation: formData.designation || undefined,
      };
      if (employee) {
        await employeesApi.update(employee.id, payload);
      } else {
        await employeesApi.create(payload);
      }
      handleOpenChange(false);
      onSuccess();
    } catch (err) {
      console.error("Error saving employee:", err);
      alert("Failed to save employee. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange} container={container}>
      <SheetContent
        side="right"
        className="flex flex-col w-[33.333vw] min-w-[280px] max-w-[100vw] overflow-hidden"
      >
        <SheetHeader>
          <SheetTitle>{employee ? "Edit Employee" : "Add Employee"}</SheetTitle>
          <SheetDescription>
            {employee
              ? "Update employee details."
              : "Add a new employee with personal, contact, and employment details."}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0 overflow-y-auto"
        >
          <div className="space-y-6 p-4">
            <Section title="Name & Identity">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-3 sm:col-span-1">
                  <Label>First Name *</Label>
                  <Input
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData({ ...formData, first_name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="col-span-3 sm:col-span-1">
                  <Label>Middle Name</Label>
                  <Input
                    value={formData.middle_name ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, middle_name: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-3 sm:col-span-1">
                  <Label>Last Name *</Label>
                  <Input
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData({ ...formData, last_name: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Employee Code *</Label>
                <Input
                  value={formData.emp_code}
                  onChange={(e) =>
                    setFormData({ ...formData, emp_code: e.target.value })
                  }
                  required
                  disabled={!!employee}
                />
              </div>
              <div>
                <Label>Father Name</Label>
                <Input
                  value={formData.father_name ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, father_name: e.target.value })
                  }
                />
              </div>
            </Section>

            <Section title="Personal">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={formData.date_of_birth ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, date_of_birth: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Gender</Label>
                  <Select
                    value={formData.gender || ""}
                    onValueChange={(v) =>
                      setFormData({ ...formData, gender: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Blood Group</Label>
                  <Select
                    value={formData.bloodgroup || ""}
                    onValueChange={(v) =>
                      setFormData({ ...formData, bloodgroup: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOOD_GROUP_OPTIONS.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Marital Status</Label>
                  <Select
                    value={formData.marital_status || ""}
                    onValueChange={(v) =>
                      setFormData({ ...formData, marital_status: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {MARITAL_OPTIONS.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Section>

            <Section title="Contact">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  type="tel"
                  value={formData.phone ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Email (Work)</Label>
                <Input
                  type="email"
                  value={formData.email ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Personal Email</Label>
                <Input
                  type="email"
                  value={formData.personal_email ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, personal_email: e.target.value })
                  }
                />
              </div>
            </Section>

            <Section title="Address">
              <div className="space-y-2">
                <Label>Current Address</Label>
                <Input
                  value={formData.present_address ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      present_address: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Permanent Address</Label>
                <Input
                  value={formData.permanent_address ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      permanent_address: e.target.value,
                    })
                  }
                />
              </div>
            </Section>

            <Section title="Emergency Contact">
              <Input
                value={formData.e_contact ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, e_contact: e.target.value })
                }
                placeholder="Name and phone"
              />
            </Section>

            <Section title="Employment">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Employee Status</Label>
                  <Select
                    value={formData.employment_status ?? "active"}
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        employment_status: v as CreateEmployeeInput["employment_status"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYMENT_STATUS_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Employment Type</Label>
                  <Select
                    value={formData.employment_type ?? ""}
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        employment_type: v as CreateEmployeeInput["employment_type"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYMENT_TYPE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={formData.join_date ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, join_date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Exit Date</Label>
                  <Input
                    type="date"
                    value={formData.exit_date ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, exit_date: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Department</Label>
                  <Input
                    value={formData.department ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Designation / Role</Label>
                  <Input
                    value={formData.designation ?? formData.role ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        designation: e.target.value,
                        role: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </Section>

            <Section title="Educational Details">
              <div className="space-y-2">
                <Label>Institution</Label>
                <Input
                  value={formData.education_institution ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      education_institution: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Year of Passing</Label>
                  <Input
                    value={formData.education_year_passing ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        education_year_passing: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Grade</Label>
                  <Input
                    value={formData.education_grade ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        education_grade: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </Section>

            <Section title="Identity">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>PAN</Label>
                  <Input
                    value={formData.pan ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, pan: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Aadhar Number</Label>
                  <Input
                    value={formData.aadhar_number ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        aadhar_number: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </Section>

            <Section title="Banking Details">
              <div className="space-y-2">
                <Label>Account Name</Label>
                <Input
                  value={formData.bank_account_name ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bank_account_name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input
                  value={formData.bank_name ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, bank_name: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>IFSC</Label>
                  <Input
                    value={formData.bank_ifsc ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, bank_ifsc: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Account Number</Label>
                  <Input
                    value={formData.bank_account_number ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bank_account_number: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </Section>

            <Section title="Salary">
              <div>
                <Label>Salary (Basic)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.salary_basic ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      salary_basic: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>
            </Section>
          </div>

          <SheetFooter className="mt-auto border-t p-4 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : employee ? (
                "Update Employee"
              ) : (
                "Add Employee"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
