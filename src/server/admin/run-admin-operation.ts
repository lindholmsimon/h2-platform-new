import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import type { Permission } from "@/lib/auth/permissions";
import { AuthError, requirePermission } from "@/server/auth/guards";
import type { VerifiedIdentity } from "@/server/auth/identity";
import { isDemoMode } from "@/server/config/app-mode";
import { AUTHENTICATION_IMPLEMENTED, REAL_ADMIN_OPERATIONS_ENABLED } from "@/server/config/security-flags";
import { createSupabaseServerClient } from "@/server/supabase/server-client";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

/** SQLSTATE-koder där databasens (svenska) felmeddelande kan visas för användaren. */
const USER_FACING_SQLSTATES = new Set([
  "42501", // insufficient_privilege – regelbrott/behörighet
  "28000", // invalid_authorization_specification – ej inloggad
  "23514", // check_violation – t.ex. sista systemadministratören
  "23505", // unique_violation – t.ex. rollnamn finns redan
  "22023", // invalid_parameter_value
  "P0002", // no_data_found
]);

function mapDatabaseError(error: PostgrestError) {
  if (error.code === "23505") return "Det finns redan en roll med det namnet eller nyckeln.";
  if (USER_FACING_SQLSTATES.has(error.code)) return error.message;
  console.error("[admin] Databasfel", error.code, error.message);
  return "Ett oväntat fel inträffade. Försök igen.";
}

/**
 * Gemensam ram för riktiga administrativa operationer.
 *
 * Ordning (alla steg måste passera):
 *   1. Inte demoläge, och säkerhetsbrytarna är påslagna.
 *   2. Verifierad identitet med rätt behörighet (förkontroll på servern).
 *   3. Databasfunktionen kontrollerar behörighet och regler IGEN och loggar.
 */
export async function runAdminOperation<T>(
  permission: Permission,
  operation: (supabase: SupabaseServerClient, identity: VerifiedIdentity) => Promise<{ data: T; error: PostgrestError | null }>,
): Promise<ActionResult<T>> {
  if (isDemoMode()) {
    return fail("Riktiga adminoperationer är inte tillgängliga i demoläget.");
  }
  if (!AUTHENTICATION_IMPLEMENTED || !REAL_ADMIN_OPERATIONS_ENABLED) {
    return fail("Riktiga adminoperationer är avstängda tills säker inloggning är implementerad.");
  }

  try {
    const identity = await requirePermission(permission);
    const supabase = await createSupabaseServerClient();
    const { data, error } = await operation(supabase, identity);
    if (error) return fail(mapDatabaseError(error));
    return ok(data);
  } catch (error) {
    if (error instanceof AuthError) return fail(error.message);
    console.error("[admin] Oväntat fel", error);
    return fail("Ett oväntat fel inträffade. Försök igen.");
  }
}
