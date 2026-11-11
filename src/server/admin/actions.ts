"use server";

import { revalidatePath } from "next/cache";

import { fail, type ActionResult } from "@/lib/action-result";
import { isPermission } from "@/lib/auth/permissions";
import { roleKeyFromName } from "@/lib/auth/policy";
import type { RoleInput, UserStatus } from "@/lib/auth/types";
import { isUuid, runAdminOperation } from "./run-admin-operation";

/**
 * Serveråtgärder för administration (riktigt läge).
 *
 * SÄKERHET
 * - Server Actions är publika POST-endpoints när de används av en
 *   klientkomponent. Därför kontrollerar VARJE åtgärd identitet och
 *   behörighet via runAdminOperation, och databasfunktionen kontrollerar
 *   samma sak igen.
 * - Indata från klienten behandlas som opålitlig och valideras här.
 * - Åtgärderna är avstängda (REAL_ADMIN_OPERATIONS_ENABLED = false) och
 *   importeras ännu inte av någon klientkomponent.
 */

const STATUSES: UserStatus[] = ["invited", "active", "inactive"];

function validRoleInput(input: unknown): input is RoleInput {
  if (!input || typeof input !== "object") return false;
  const i = input as Record<string, unknown>;
  return (
    typeof i.name === "string" &&
    i.name.trim().length > 0 &&
    i.name.length <= 80 &&
    typeof i.description === "string" &&
    i.description.length <= 500 &&
    Array.isArray(i.permissions) &&
    i.permissions.every((p) => typeof p === "string" && isPermission(p))
  );
}

function revalidateAdmin() {
  revalidatePath("/administration", "layout");
}

export async function assignRoleAction(profileId: string, roleId: string): Promise<ActionResult> {
  if (!isUuid(profileId) || !isUuid(roleId)) return fail("Ogiltiga indata.");
  const result = await runAdminOperation("users.manage", async (supabase) => {
    const { error } = await supabase.rpc("admin_assign_role", { p_profile_id: profileId, p_role_id: roleId });
    return { data: undefined, error };
  });
  if (result.ok) revalidateAdmin();
  return result;
}

export async function revokeRoleAction(profileId: string, roleId: string): Promise<ActionResult> {
  if (!isUuid(profileId) || !isUuid(roleId)) return fail("Ogiltiga indata.");
  const result = await runAdminOperation("users.manage", async (supabase) => {
    const { error } = await supabase.rpc("admin_revoke_role", { p_profile_id: profileId, p_role_id: roleId });
    return { data: undefined, error };
  });
  if (result.ok) revalidateAdmin();
  return result;
}

export async function setUserStatusAction(profileId: string, status: UserStatus): Promise<ActionResult> {
  if (!isUuid(profileId) || !STATUSES.includes(status)) return fail("Ogiltiga indata.");
  const result = await runAdminOperation("users.manage", async (supabase) => {
    const { error } = await supabase.rpc("admin_set_profile_status", { p_profile_id: profileId, p_status: status });
    return { data: undefined, error };
  });
  if (result.ok) revalidateAdmin();
  return result;
}

export async function createRoleAction(input: RoleInput): Promise<ActionResult<{ id: string }>> {
  if (!validRoleInput(input)) return fail("Ogiltiga indata.");
  const result = await runAdminOperation("roles.manage", async (supabase) => {
    const { data: existing } = await supabase.from("roles").select("key");
    const key = roleKeyFromName(input.name, (existing ?? []).map((r: { key: string }) => r.key));
    const { data, error } = await supabase.rpc("admin_create_role", {
      p_key: key,
      p_name: input.name,
      p_description: input.description,
      p_permission_keys: input.permissions,
    });
    return { data: { id: data as string }, error };
  });
  if (result.ok) revalidateAdmin();
  return result;
}

export async function updateRoleAction(roleId: string, input: RoleInput): Promise<ActionResult> {
  if (!isUuid(roleId) || !validRoleInput(input)) return fail("Ogiltiga indata.");
  const result = await runAdminOperation("roles.manage", async (supabase) => {
    const { error } = await supabase.rpc("admin_update_role", {
      p_role_id: roleId,
      p_name: input.name,
      p_description: input.description,
      p_permission_keys: input.permissions,
    });
    return { data: undefined, error };
  });
  if (result.ok) revalidateAdmin();
  return result;
}

export async function deleteRoleAction(roleId: string): Promise<ActionResult> {
  if (!isUuid(roleId)) return fail("Ogiltiga indata.");
  const result = await runAdminOperation("roles.manage", async (supabase) => {
    const { error } = await supabase.rpc("admin_delete_role", { p_role_id: roleId });
    return { data: undefined, error };
  });
  if (result.ok) revalidateAdmin();
  return result;
}
