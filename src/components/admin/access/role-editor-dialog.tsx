"use client";

import * as React from "react";
import { Lock, Trash2 } from "lucide-react";

import { InlineAlert } from "@/components/shared/inline-alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAccess } from "@/lib/access/access-context";
import type { Permission } from "@/lib/auth/permissions";
import { useSession } from "@/lib/auth/session";
import type { AccessRole } from "@/lib/auth/types";
import { PERMISSION_GROUPS } from "./permission-groups";

interface RoleEditorDialogProps {
  /** null = stängd, "new" = ny roll, annars rollen som redigeras. */
  role: AccessRole | "new" | null;
  onOpenChange: (open: boolean) => void;
}

export function RoleEditorDialog({ role, onOpenChange }: RoleEditorDialogProps) {
  const { actions, snapshot } = useAccess();
  const { can, permissions: actorPermissions } = useSession();
  const existing = role && role !== "new" ? role : null;

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [selected, setSelected] = React.useState<Set<Permission>>(new Set());
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  React.useEffect(() => {
    setName(existing?.name ?? "");
    setDescription(existing?.description ?? "");
    setSelected(new Set(existing?.permissions ?? ["dashboard.view"]));
    setError(null);
    setConfirmDelete(false);
  }, [role, existing]);

  const canManage = can("roles.manage");
  const readOnly = !canManage || !!existing?.isLocked;
  const assignedCount = existing ? snapshot.users.filter((u) => u.roleIds.includes(existing.id)).length : 0;

  const toggle = (key: Permission, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    const input = { name, description, permissions: [...selected] };
    const result = existing ? await actions.updateRole(existing.id, input) : await actions.createRole(input);
    setPending(false);
    if (result.ok) onOpenChange(false);
    else setError(result.error);
  };

  const remove = async () => {
    if (!existing) return;
    if (!confirmDelete) return setConfirmDelete(true);
    setPending(true);
    const result = await actions.deleteRole(existing.id);
    setPending(false);
    if (result.ok) onOpenChange(false);
    else setError(result.error);
  };

  return (
    <Dialog open={!!role} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100svh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="border-b p-5">
            <DialogTitle className="flex items-center gap-2">
              {existing ? (readOnly ? existing.name : `Redigera ${existing.name}`) : "Ny roll"}
              {existing?.isLocked && <Lock className="text-muted-foreground size-4" />}
            </DialogTitle>
            <DialogDescription>
              {existing?.isLocked
                ? "Rollen är låst och har alltid alla behörigheter."
                : "Välj vilka behörigheter rollen ska ge. Användare kan ha flera roller."}
            </DialogDescription>
          </DialogHeader>

          <div className="relative flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5">
            {error && <InlineAlert variant="error">{error}</InlineAlert>}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="role-name">Namn</Label>
                <Input
                  id="role-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80}
                  required
                  disabled={readOnly}
                  placeholder="t.ex. Platschef"
                />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="role-description">Beskrivning</Label>
                <Textarea
                  id="role-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  disabled={readOnly}
                  rows={2}
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium">Behörigheter</span>
                <span className="text-muted-foreground text-xs">{selected.size} valda</span>
              </div>
              {!readOnly && (
                <p className="text-muted-foreground -mt-2 text-xs">
                  Du kan bara välja behörigheter som du själv har.
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                {PERMISSION_GROUPS.map((group) => (
                  <fieldset key={group.category} className="flex flex-col gap-2 rounded-xl border p-3">
                    <legend className="text-muted-foreground px-1 text-[11px] font-medium tracking-wider uppercase">
                      {group.category}
                    </legend>
                    {group.permissions.map((p) => {
                      const id = `perm-${p.key}`;
                      const lacks = !actorPermissions.has(p.key);
                      return (
                        <div key={p.key} className="flex items-start gap-2.5">
                          <Checkbox
                            id={id}
                            checked={selected.has(p.key)}
                            onCheckedChange={(v) => toggle(p.key, v === true)}
                            disabled={readOnly || lacks}
                            className="mt-0.5"
                          />
                          <label htmlFor={id} className="flex min-w-0 flex-col gap-0.5 text-sm leading-tight">
                            <span>{p.label}</span>
                            <span className="text-muted-foreground font-mono text-[11px]">{p.key}</span>
                          </label>
                        </div>
                      );
                    })}
                  </fieldset>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="items-center border-t p-4 sm:justify-between">
            <div className="text-muted-foreground text-xs">
              {existing && `Tilldelad ${assignedCount} ${assignedCount === 1 ? "användare" : "användare"}`}
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              {existing && !existing.isSystem && canManage && (
                <Button type="button" variant={confirmDelete ? "destructive" : "ghost"} onClick={remove} disabled={pending}>
                  <Trash2 /> {confirmDelete ? "Bekräfta borttagning" : "Ta bort roll"}
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {readOnly ? "Stäng" : "Avbryt"}
              </Button>
              {!readOnly && (
                <Button type="submit" disabled={pending || !name.trim()}>
                  {existing ? "Spara ändringar" : "Skapa roll"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
