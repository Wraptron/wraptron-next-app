"use client";

import React, { useEffect, useState } from "react";
import {
  interfaceTypesApi,
  featureTypesApi,
  type InterfaceType,
  type FeatureType,
} from "@/lib/api";
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
import { Plus, Trash2, LayoutTemplate, Sparkles } from "lucide-react";

export function SettingsProductCatalogTypes() {
  const [ifaceTypes, setIfaceTypes] = useState<InterfaceType[]>([]);
  const [featTypes, setFeatTypes] = useState<FeatureType[]>([]);
  const [loadingI, setLoadingI] = useState(true);
  const [loadingF, setLoadingF] = useState(true);

  const [ifaceAddOpen, setIfaceAddOpen] = useState(false);
  const [ifaceEditOpen, setIfaceEditOpen] = useState(false);
  const [ifaceDeleteOpen, setIfaceDeleteOpen] = useState(false);
  const [ifaceName, setIfaceName] = useState("");
  const [selectedIface, setSelectedIface] = useState<InterfaceType | null>(null);
  const [ifaceBusy, setIfaceBusy] = useState(false);

  const [featAddOpen, setFeatAddOpen] = useState(false);
  const [featEditOpen, setFeatEditOpen] = useState(false);
  const [featDeleteOpen, setFeatDeleteOpen] = useState(false);
  const [featName, setFeatName] = useState("");
  const [selectedFeat, setSelectedFeat] = useState<FeatureType | null>(null);
  const [featBusy, setFeatBusy] = useState(false);

  const loadIface = async () => {
    setLoadingI(true);
    try {
      const res = await interfaceTypesApi.getAll();
      setIfaceTypes(res.data ?? []);
    } catch {
      setIfaceTypes([]);
    } finally {
      setLoadingI(false);
    }
  };

  const loadFeat = async () => {
    setLoadingF(true);
    try {
      const res = await featureTypesApi.getAll();
      setFeatTypes(res.data ?? []);
    } catch {
      setFeatTypes([]);
    } finally {
      setLoadingF(false);
    }
  };

  useEffect(() => {
    loadIface();
    loadFeat();
  }, []);

  const handleIfaceAdd = async () => {
    if (!ifaceName.trim()) return;
    setIfaceBusy(true);
    try {
      await interfaceTypesApi.create({ name: ifaceName.trim(), sort_order: ifaceTypes.length });
      setIfaceAddOpen(false);
      setIfaceName("");
      loadIface();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setIfaceBusy(false);
    }
  };

  const handleIfaceEdit = async () => {
    if (!selectedIface || !ifaceName.trim()) return;
    setIfaceBusy(true);
    try {
      await interfaceTypesApi.update(selectedIface.id, { name: ifaceName.trim() });
      setIfaceEditOpen(false);
      setIfaceName("");
      setSelectedIface(null);
      loadIface();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setIfaceBusy(false);
    }
  };

  const handleIfaceDelete = async () => {
    if (!selectedIface) return;
    setIfaceBusy(true);
    try {
      await interfaceTypesApi.delete(selectedIface.id);
      setIfaceDeleteOpen(false);
      setSelectedIface(null);
      loadIface();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setIfaceBusy(false);
    }
  };

  const handleFeatAdd = async () => {
    if (!featName.trim()) return;
    setFeatBusy(true);
    try {
      await featureTypesApi.create({ name: featName.trim(), sort_order: featTypes.length });
      setFeatAddOpen(false);
      setFeatName("");
      loadFeat();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setFeatBusy(false);
    }
  };

  const handleFeatEdit = async () => {
    if (!selectedFeat || !featName.trim()) return;
    setFeatBusy(true);
    try {
      await featureTypesApi.update(selectedFeat.id, { name: featName.trim() });
      setFeatEditOpen(false);
      setFeatName("");
      setSelectedFeat(null);
      loadFeat();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setFeatBusy(false);
    }
  };

  const handleFeatDelete = async () => {
    if (!selectedFeat) return;
    setFeatBusy(true);
    try {
      await featureTypesApi.delete(selectedFeat.id);
      setFeatDeleteOpen(false);
      setSelectedFeat(null);
      loadFeat();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setFeatBusy(false);
    }
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <LayoutTemplate className="h-5 w-5" />
                Interface types
              </CardTitle>
              <CardDescription className="mt-2">
                Types used when cataloging interfaces (e.g. page, component, layout). Remove only
                if no catalog items use them.
              </CardDescription>
            </div>
            <Button type="button" size="sm" onClick={() => { setIfaceName(""); setIfaceAddOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" />
              Add type
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingI ? (
            <p className="text-sm text-muted-foreground py-4">Loading…</p>
          ) : ifaceTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No types yet.</p>
          ) : (
            <div className="rounded-md border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-[140px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ifaceTypes.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-sm">{t.name}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedIface(t);
                              setIfaceName(t.name);
                              setIfaceEditOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive"
                            onClick={() => {
                              setSelectedIface(t);
                              setIfaceDeleteOpen(true);
                            }}
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

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Feature types
              </CardTitle>
              <CardDescription className="mt-2">
                Categories for features (e.g. UI, Analytics, SEO). Remove only if unused by
                catalog features.
              </CardDescription>
            </div>
            <Button type="button" size="sm" onClick={() => { setFeatName(""); setFeatAddOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" />
              Add type
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingF ? (
            <p className="text-sm text-muted-foreground py-4">Loading…</p>
          ) : featTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No types yet.</p>
          ) : (
            <div className="rounded-md border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-[140px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {featTypes.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedFeat(t);
                              setFeatName(t.name);
                              setFeatEditOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive"
                            onClick={() => {
                              setSelectedFeat(t);
                              setFeatDeleteOpen(true);
                            }}
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

      <Dialog open={ifaceAddOpen} onOpenChange={setIfaceAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add interface type</DialogTitle>
            <DialogDescription>e.g. page, component, layout</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="iface-type-name">Name</Label>
            <Input
              id="iface-type-name"
              value={ifaceName}
              onChange={(e) => setIfaceName(e.target.value)}
              placeholder="page"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIfaceAddOpen(false)} disabled={ifaceBusy}>
              Cancel
            </Button>
            <Button onClick={handleIfaceAdd} disabled={ifaceBusy || !ifaceName.trim()}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={ifaceEditOpen} onOpenChange={setIfaceEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit interface type</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="iface-type-edit">Name</Label>
            <Input
              id="iface-type-edit"
              value={ifaceName}
              onChange={(e) => setIfaceName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIfaceEditOpen(false);
                setSelectedIface(null);
              }}
              disabled={ifaceBusy}
            >
              Cancel
            </Button>
            <Button onClick={handleIfaceEdit} disabled={ifaceBusy || !ifaceName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={ifaceDeleteOpen} onOpenChange={setIfaceDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete interface type?</DialogTitle>
            <DialogDescription>
              Delete &quot;{selectedIface?.name}&quot;? This fails if any catalog interface uses it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIfaceDeleteOpen(false)} disabled={ifaceBusy}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleIfaceDelete} disabled={ifaceBusy}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={featAddOpen} onOpenChange={setFeatAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add feature type</DialogTitle>
            <DialogDescription>e.g. UI, Analytics, SEO</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="feat-type-name">Name</Label>
            <Input
              id="feat-type-name"
              value={featName}
              onChange={(e) => setFeatName(e.target.value)}
              placeholder="UI"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeatAddOpen(false)} disabled={featBusy}>
              Cancel
            </Button>
            <Button onClick={handleFeatAdd} disabled={featBusy || !featName.trim()}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={featEditOpen} onOpenChange={setFeatEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit feature type</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="feat-type-edit">Name</Label>
            <Input
              id="feat-type-edit"
              value={featName}
              onChange={(e) => setFeatName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setFeatEditOpen(false);
                setSelectedFeat(null);
              }}
              disabled={featBusy}
            >
              Cancel
            </Button>
            <Button onClick={handleFeatEdit} disabled={featBusy || !featName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={featDeleteOpen} onOpenChange={setFeatDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete feature type?</DialogTitle>
            <DialogDescription>
              Delete &quot;{selectedFeat?.name}&quot;? This fails if any catalog feature uses it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeatDeleteOpen(false)} disabled={featBusy}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleFeatDelete} disabled={featBusy}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
