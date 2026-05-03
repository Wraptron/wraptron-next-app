"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePageTitle } from "@/contexts/page-title-context";
import {
  employeeSkillsApi,
  type SkillMatrixEmployee,
  type WorkspaceSkill,
} from "@/lib/api";
import { WORKSPACE_SKILL_LEVELS } from "@/lib/workspace-skill-levels";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Loader2 } from "lucide-react";

function displayEmployeeName(e: SkillMatrixEmployee) {
  const parts = [e.first_name, e.last_name].filter(Boolean);
  return parts.join(" ") || "—";
}

function buildAssignments(
  emp: SkillMatrixEmployee,
  skillId: number,
  newLevel: number | undefined,
): { skill_id: number; level: number }[] {
  const levels = { ...emp.skill_levels };
  const key = String(skillId);
  if (newLevel === undefined) {
    delete levels[key];
  } else {
    levels[key] = newLevel;
  }
  return Object.entries(levels).map(([k, v]) => ({
    skill_id: parseInt(k, 10),
    level: v,
  }));
}

export default function WorkspaceSkillsMatrixPage() {
  const { setTitle } = usePageTitle();
  const [skills, setSkills] = useState<WorkspaceSkill[]>([]);
  const [employees, setEmployees] = useState<SkillMatrixEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await employeeSkillsApi.getMatrix();
      setSkills(data.skills ?? []);
      setEmployees(data.employees ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load skill matrix");
      setSkills([]);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setTitle("Skill matrix");
    return () => setTitle(null);
  }, [setTitle]);

  useEffect(() => {
    load();
  }, [load]);

  const onLevelChange = async (
    emp: SkillMatrixEmployee,
    skillId: number,
    value: string,
  ) => {
    const newLevel = value === "none" ? undefined : parseInt(value, 10);
    const assignments = buildAssignments(emp, skillId, newLevel);
    setSavingId(emp.id);
    setError(null);
    try {
      await employeeSkillsApi.updateEmployee(emp.id, { assignments });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-[100vw] mx-auto space-y-6">
        <div className="flex items-center gap-4 flex-wrap">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/workspace/employees">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Employees
            </Link>
          </Button>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Skill matrix</h1>
          <p className="text-gray-600 mt-1 text-sm">
            Map each employee to proficiency levels per skill. Configure skill names in{" "}
            <Link href="/settings" className="text-blue-600 underline hover:text-blue-800">
              Settings → Workspace skills
            </Link>
            .
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 py-12">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading matrix...
          </div>
        ) : skills.length === 0 ? (
          <Alert>
            <AlertDescription>
              No skills defined yet. Add skills under{" "}
              <Link href="/settings" className="font-medium underline">
                Settings → Workspace skills
              </Link>{" "}
              to use this matrix.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="rounded-md border bg-white overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 z-10 bg-white min-w-[200px] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                    Employee
                  </TableHead>
                  {skills.map((s) => (
                    <TableHead key={s.id} className="min-w-[140px] whitespace-normal">
                      {s.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={skills.length + 1}
                      className="text-center text-gray-500 py-10"
                    >
                      No employees in the directory. Add employees under Workspace → Employees.
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="sticky left-0 z-10 bg-white font-medium shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                        <div className="flex flex-col gap-0.5">
                          <Link
                            href={`/workspace/employees/${emp.id}`}
                            className="text-blue-700 hover:underline"
                          >
                            {displayEmployeeName(emp)}
                          </Link>
                          <span className="text-xs text-gray-500 font-normal">
                            {emp.emp_code}
                            {emp.department ? ` · ${emp.department}` : ""}
                          </span>
                        </div>
                      </TableCell>
                      {skills.map((s) => {
                        const level = emp.skill_levels[String(s.id)];
                        const value =
                          level !== undefined && level >= 1 && level <= 4
                            ? String(level)
                            : "none";
                        const busy = savingId === emp.id;
                        return (
                          <TableCell key={s.id} className="p-2">
                            <Select
                              value={value}
                              disabled={busy}
                              onValueChange={(v) => onLevelChange(emp, s.id, v)}
                            >
                              <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="—" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">—</SelectItem>
                                {WORKSPACE_SKILL_LEVELS.map((l) => (
                                  <SelectItem
                                    key={l.value}
                                    value={String(l.value)}
                                    title={`${l.label} — ${l.description}`}
                                  >
                                    {l.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <p className="text-xs text-gray-500 max-w-3xl">
          <strong>Levels:</strong>{" "}
          {WORKSPACE_SKILL_LEVELS.map((l) => `${l.label} — ${l.description}`).join(" · ")}
        </p>
      </div>
    </div>
  );
}
