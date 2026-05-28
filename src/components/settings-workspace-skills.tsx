"use client";

import React, { useEffect, useState } from "react";
import {
  workspaceSkillsApi,
  type WorkspaceSkill,
} from "@/lib/api";
import { WORKSPACE_SKILL_LEVELS } from "@/lib/workspace-skill-levels";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, GraduationCap } from "lucide-react";

export function SettingsWorkspaceSkills() {
  const [skills, setSkills] = useState<WorkspaceSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<WorkspaceSkill | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await workspaceSkillsApi.getAll();
      setSkills(res.data ?? []);
    } catch {
      setSkills([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await workspaceSkillsApi.create({ name: name.trim(), sort_order: skills.length });
      setAddOpen(false);
      setName("");
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to add skill");
    } finally {
      setBusy(false);
    }
  };

  const handleEdit = async () => {
    if (!selected || !name.trim()) return;
    setBusy(true);
    try {
      await workspaceSkillsApi.update(selected.id, { name: name.trim() });
      setEditOpen(false);
      setName("");
      setSelected(null);
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to update skill");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await workspaceSkillsApi.delete(selected.id);
      setDeleteOpen(false);
      setSelected(null);
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to delete skill");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Workspace skills
              </CardTitle>
              <CardDescription className="mt-2 space-y-1">
                <span className="block">
                  Define skill names (e.g. Frontend, UX, CMS) used in the employee skill matrix under
                  Human resources.
                </span>
                <span className="block text-xs text-muted-foreground">
                  Levels (fixed):{" "}
                  {WORKSPACE_SKILL_LEVELS.map((l) => `${l.label} ${l.description}`).join(" · ")}
                </span>
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setName("");
                setAddOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add skill
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading skills...</div>
          ) : skills.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No skills yet. Add skills to build your team matrix under Human resources → Skill matrix.
            </div>
          ) : (
            <div className="rounded-md border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {skills.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.sort_order}</TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelected(s);
                              setName(s.name);
                              setEditOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelected(s);
                              setDeleteOpen(true);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add workspace skill</DialogTitle>
            <DialogDescription>
              e.g. Frontend, UX, CMS — used as columns on the skill matrix.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ws-skill-name">Name</Label>
              <Input
                id="ws-skill-name"
                placeholder="e.g. Frontend"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={busy || !name.trim()}>
              {busy ? "Adding..." : "Add skill"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit workspace skill</DialogTitle>
            <DialogDescription>Renaming updates the matrix column label.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ws-skill-edit-name">Name</Label>
              <Input
                id="ws-skill-edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditOpen(false);
                setSelected(null);
              }}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={busy || !name.trim()}>
              {busy ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete workspace skill</DialogTitle>
            <DialogDescription>
              Remove &quot;{selected?.name}&quot;? Assignments for this skill will be deleted from the
              matrix.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={busy}>
              {busy ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
