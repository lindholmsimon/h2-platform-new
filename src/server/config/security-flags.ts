import "server-only";

/**
 * Säkerhetsbrytare som är KONSTANTER i koden (inte miljövariabler), så att de
 * inte kan slås på av misstag via felkonfiguration. De ändras i en granskad
 * kodändring när Microsoft Entra ID-inloggning är implementerad och testad.
 */

/** Sätts till true när verifierad inloggning (Supabase Auth + Entra ID) finns. */
export const AUTHENTICATION_IMPLEMENTED = false;

/** Riktiga administrativa operationer mot databasen. Kräver AUTHENTICATION_IMPLEMENTED. */
export const REAL_ADMIN_OPERATIONS_ENABLED = false;
