"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { usePageTitle } from "@/contexts/page-title-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Phone,
  Building2,
  User,
  Briefcase,
  Edit,
  Trash2,
  GraduationCap,
} from "lucide-react";
import { employeesApi, employeeSkillsApi, type Employee, type EmployeeSkillAssignment } from "@/lib/api";
import { workspaceSkillLevelDescription } from "@/lib/workspace-skill-levels";
import { EmployeeFormSheet } from "@/components/employee-form-sheet";
import { useAuth } from "@/contexts/auth-context";

function displayName(e: Employee) {
  const parts = [e.first_name, e.middle_name, e.last_name].filter(Boolean);
  return parts.join(" ") || "—";
}

function statusLabel(status?: string) {
  const s = (status ?? "").toLowerCase();
  const map: Record<string, string> = {
    candidate: "Candidate",
    offered: "Offered",
    pre_onboarding: "Pre-Onboarding",
    active: "Active",
    notice_period: "Notice Period",
    exited: "Exited",
  };
  return map[s] ?? status ?? "—";
}

function statusClass(status?: string) {
  const s = (status ?? "").toLowerCase();
  if (s === "active") return "bg-green-100 text-green-800";
  if (s === "candidate" || s === "offered") return "bg-blue-100 text-blue-800";
  if (s === "pre_onboarding") return "bg-indigo-100 text-indigo-800";
  if (s === "notice_period") return "bg-amber-100 text-amber-800";
  if (s === "exited") return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-800";
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium text-right">{value}</span>
    </div>
  );
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === "admin";
  const { setTitle } = usePageTitle();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [skillAssignments, setSkillAssignments] = useState<EmployeeSkillAssignment[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      setError("Invalid employee ID");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await employeesApi.getById(numId);
        if (!cancelled) setEmployee(data);
      } catch (err) {
        if (!cancelled) setError("Failed to load employee");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return;
    let cancelled = false;
    setSkillsLoading(true);
    (async () => {
      try {
        const res = await employeeSkillsApi.getForEmployee(numId);
        if (!cancelled) setSkillAssignments(res.assignments ?? []);
      } catch {
        if (!cancelled) setSkillAssignments([]);
      } finally {
        if (!cancelled) setSkillsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (employee) setTitle(displayName(employee));
    return () => setTitle(null);
  }, [employee, setTitle]);

  const refresh = () => {
    if (!id) return;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return;
    employeesApi.getById(numId).then(setEmployee);
    employeeSkillsApi.getForEmployee(numId).then((r) => setSkillAssignments(r.assignments ?? []));
  };

  const handleDelete = async () => {
    if (!employee) return;
    if (
      !confirm(
        `Remove ${displayName(employee)} from the directory? They will be hidden from all employee lists.`,
      )
    ) {
      return;
    }
    try {
      await employeesApi.delete(employee.id);
      router.push("/workspace/employees");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete employee";
      alert(message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-red-600">{error ?? "Employee not found."}</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/workspace/employees">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Employees
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/workspace/employees">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Employees
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                variant="outline"
                className="text-destructive border-destructive/60 hover:bg-destructive/10"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <Button onClick={() => setSheetOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-start gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName(employee))}&background=random`}
                />
                <AvatarFallback className="text-xl">
                  {employee.first_name?.charAt(0) ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900">
                  {displayName(employee)}
                </h1>
                <p className="text-gray-600 mt-0.5">
                  {employee.designation || employee.role || "—"}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {employee.department && (
                    <span className="inline-flex items-center gap-1 text-sm px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      <Building2 className="h-3.5 w-3.5" />
                      {employee.department}
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center text-sm px-2.5 py-0.5 rounded-full ${statusClass(employee.employment_status)}`}
                  >
                    {statusLabel(employee.employment_status)}
                  </span>
                  {employee.emp_code && (
                    <span className="text-sm text-gray-500">
                      Code: {employee.emp_code}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Skills
            </CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/workspace/skills">Skill matrix</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {skillsLoading ? (
              <p className="text-sm text-gray-500">Loading skills...</p>
            ) : skillAssignments.length === 0 ? (
              <p className="text-sm text-gray-500">
                No skill levels recorded. Assign skills on the{" "}
                <Link href="/workspace/skills" className="text-blue-600 underline">
                  skill matrix
                </Link>
                .
              </p>
            ) : (
              <ul className="divide-y rounded-md border bg-white">
                {skillAssignments.map((a) => (
                  <li
                    key={a.skill_id}
                    className="flex flex-wrap justify-between gap-2 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-gray-900">{a.skill_name}</span>
                    <span className="text-gray-600">{workspaceSkillLevelDescription(a.level)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <DetailRow label="Email" value={employee.email} />
              <DetailRow label="Personal email" value={employee.personal_email} />
              <DetailRow label="Phone" value={employee.phone} />
              <DetailRow label="Work phone" value={employee.work_phone} />
              <DetailRow label="Location" value={employee.location} />
              {!employee.email && !employee.phone && !employee.personal_email && !employee.work_phone && !employee.location && (
                <p className="text-sm text-gray-500 py-2">No contact details</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Employment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <DetailRow label="Status" value={statusLabel(employee.employment_status)} />
              <DetailRow
                label="Type"
                value={
                  employee.employment_type
                    ? employee.employment_type.replace("_", " ")
                    : undefined
                }
              />
              <DetailRow
                label="Join date"
                value={employee.join_date ? new Date(employee.join_date).toLocaleDateString() : undefined}
              />
              {(employee.employment_status === "notice_period" ||
                employee.employment_status === "exited") && (
                <DetailRow
                  label="Exit date"
                  value={employee.exit_date ? new Date(employee.exit_date).toLocaleDateString() : undefined}
                />
              )}
              <DetailRow label="Department" value={employee.department} />
              <DetailRow label="Designation" value={employee.designation} />
              <DetailRow label="Role" value={employee.role} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal & other</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailRow
                label="Date of birth"
                value={
                  employee.date_of_birth
                    ? new Date(employee.date_of_birth).toLocaleDateString()
                    : undefined
                }
              />
              <DetailRow label="Gender" value={employee.gender} />
              <DetailRow label="Blood group" value={employee.bloodgroup} />
              <DetailRow label="Marital status" value={employee.marital_status} />
              <DetailRow label="Father name" value={employee.father_name} />
            </div>
            {(employee.present_address || employee.permanent_address) && (
              <div className="space-y-1 pt-2 border-t">
                <DetailRow label="Present address" value={employee.present_address} />
                <DetailRow label="Permanent address" value={employee.permanent_address} />
              </div>
            )}
            {(employee.e_contact || employee.qualification) && (
              <div className="space-y-1 pt-2 border-t">
                <DetailRow label="Emergency contact" value={employee.e_contact} />
                <DetailRow label="Qualification" value={employee.qualification} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <EmployeeFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSuccess={refresh}
        employee={employee}
      />
    </div>
  );
}
