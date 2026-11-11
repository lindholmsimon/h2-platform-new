# H2 Plattform

Intern företagsplattform för H2 Entreprenad. Byggd med Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Lucide Icons och Supabase (Postgres).

> **Status:** Gränssnittet och behörighetssystemet är på plats. **Inloggning med Microsoft är inte implementerad ännu.** Tills den är det körs plattformen antingen i **demoläge** (fiktiva data) eller i **säkert läge** (allt låst). Använd inga riktiga H2-uppgifter förrän inloggning och behörighetskontroller är aktiverade och testade.

## Innehåll

- [Kom igång](#kom-igång)
- [Lägen: demo och säkert](#lägen-demo-och-säkert)
- [Miljövariabler](#miljövariabler)
- [Ansluta Supabase](#ansluta-supabase)
- [Databasstruktur](#databasstruktur)
- [Roller och behörigheter](#roller-och-behörigheter)
- [Säkerhetsmodell](#säkerhetsmodell)
- [Framtida Microsoft-inloggning](#framtida-microsoft-inloggning)
- [Vad som fortfarande bara är demo](#vad-som-fortfarande-bara-är-demo)
- [Projektstruktur](#projektstruktur)

## Kom igång

Krav: Node.js 20.9 eller senare.

```bash
npm install
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000). Utvecklingsservern startar i demoläge utan någon konfiguration.

| Kommando            | Beskrivning                                                  |
| ------------------- | ------------------------------------------------------------ |
| `npm run dev`       | Utvecklingsserver (demoläge som standard)                    |
| `npm run build`     | Produktionsbygge                                             |
| `npm run start`     | Kör produktionsbygget lokalt                                 |
| `npm run lint`      | ESLint                                                       |
| `npm run typecheck` | TypeScript-kontroll                                          |
| `npm run test:db`   | Kör databasmigrationerna och testar RLS och skyddsregler     |

`npm run test:db` kör alla migrationer i [PGlite](https://pglite.dev) (Postgres i WebAssembly), alltså utan Docker eller molntjänst. Testerna kontrollerar bland annat att anonyma användare saknar åtkomst, att ingen kan ändra sina egna roller, att behörigheter inte kan delas ut "uppåt", att den sista systemadministratören skyddas och att aktivitetsloggen inte kan ändras.

## Lägen: demo och säkert

Läget avgörs **på servern**, vid bygge och rendering. Webbläsaren kan inte påverka det.

| Miljö                              | Inställning                                                  | Resultat                 |
| ---------------------------------- | ------------------------------------------------------------ | ------------------------ |
| Lokalt, `npm run dev`              | –                                                            | Demoläge                 |
| Lokalt, `npm run dev`              | `H2_DEMO_MODE=false`                                         | Säkert läge              |
| Vercel Preview / `next build`      | `H2_DEMO_MODE=true`                                          | Demoläge                 |
| Vercel Preview / `next build`      | ej satt                                                      | Säkert läge              |
| Vercel Production                  | `H2_DEMO_MODE=true`                                          | **Säkert läge**          |
| Vercel Production                  | `H2_DEMO_MODE=true` + `H2_ALLOW_DEMO_IN_PRODUCTION=true`     | Demoläge                 |

**Demoläge**

- Använder enbart fiktiva användare, roller och projekt (`src/data/demo/`).
- Adminpanelen fungerar fullt ut: du kan tilldela roller, skapa och redigera egna roller, ändra status och se aktivitetsloggen. Ändringarna sparas bara i webbläsarens `localStorage`. *Återställ demodata* återställer allt.
- Samma regler som databasen tillämpas (`src/lib/auth/policy.ts`), så att man kan testa till exempel att ingen kan ändra sina egna roller.
- Byt demoanvändare via profilmenyn för att se plattformen med olika behörigheter.
- **Är helt separerat från databasen.** I demoläget skapas aldrig någon Supabase-klient (`createSupabaseServerClient()` kastar fel), servern litar aldrig på en demoidentitet (`getVerifiedIdentity()` returnerar alltid `null`) och de riktiga adminfunktionerna vägrar köra.

**Säkert läge**

- Visar bara sidan *Inloggning krävs*. Inget innehåll renderas förrän verifierad inloggning finns.

> **Viktigt för befintlig Vercel-driftsättning:** Utan miljövariabler visar produktionsmiljön nu den låsta sidan. Vill du fortsätta visa demot där sätter du `H2_DEMO_MODE=true` och `H2_ALLOW_DEMO_IN_PRODUCTION=true`. Det rekommenderade är att bara aktivera demot i **Preview** med Vercel Deployment Protection påslaget.

## Miljövariabler

Se `.env.example`. För lokal utveckling kopierar du den till `.env.local`.

| Variabel                               | Var             | Beskrivning                                                                        |
| -------------------------------------- | --------------- | ---------------------------------------------------------------------------------- |
| `H2_DEMO_MODE`                         | Server          | `true` aktiverar demoläget (se tabellen ovan).                                     |
| `H2_ALLOW_DEMO_IN_PRODUCTION`          | Server          | Krävs för demoläge i Vercel Production.                                            |
| `NEXT_PUBLIC_SUPABASE_URL`             | Publik          | Supabase-projektets URL.                                                           |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publik          | Publishable-nyckel (eller legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Skyddas av RLS. |

**Används inte:** `SUPABASE_SERVICE_ROLE_KEY` eller secret-nycklar. Applikationen behöver ingen privilegierad nyckel, så lägg inte in någon i Vercel. Bygget stoppas om en hemlig nyckel hamnar i en `NEXT_PUBLIC_`-variabel (`next.config.ts`).

## Ansluta Supabase

Gratisplanen räcker för det här steget och kostar inget.

1. **Skapa projektet** på [supabase.com](https://supabase.com) i en EU-region, till exempel *North EU (Stockholm)* eller *Central EU (Frankfurt)*. Spara databaslösenordet i en lösenordshanterare.
2. **Kör migrationerna** med Supabase CLI (`npx` räcker, ingen global installation behövs):

   ```bash
   npx supabase login
   ```

   ```bash
   npx supabase link --project-ref <projekt-ref>
   ```

   ```bash
   npx supabase db push
   ```

   Alternativt kan du klistra in filerna i `supabase/migrations/` i SQL-editorn i Supabase, **en i taget och i nummerordning**.

   Kör **inte** `supabase/seed.sql` mot det riktiga projektet. Den innehåller fiktiva testanvändare och används bara lokalt med `npx supabase start` / `npx supabase db reset` (som kräver Docker).
3. **Kontrollera säkerheten:** gå igenom *Advisors → Security Advisor* och åtgärda eventuella varningar. RLS ska vara aktiverat på alla tabeller (*Table Editor* visar det).
4. **Lägg in miljövariablerna** `NEXT_PUBLIC_SUPABASE_URL` och `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (från *Project Settings → API*) i Vercel. De används först när inloggningen är aktiverad.
5. **Utse första systemadministratören.** Det görs bara när inloggningen är klar, i SQL-editorn i Supabase (kan inte göras via API eller webbplatsen):

   ```sql
   select private.bootstrap_system_admin(
     'fornamn.efternamn@h2entreprenad.se',  -- e-post
     'Förnamn Efternamn',                    -- namn
     '<tenant-id>'::uuid,                    -- Entra ID tenant (tid)
     '<object-id>'::uuid                     -- användarens object-ID (oid)
   );
   ```

   Funktionen fungerar bara när det inte finns någon aktiv systemadministratör. Därefter hanteras alla roller via adminpanelen.

**Nya migrationer** skapas med `npx supabase migration new <namn>`. Kör sedan `npm run test:db` och `npx supabase db push`. Ändras behörighetskatalogen måste `src/lib/auth/permissions.ts` uppdateras också, och testet kontrollerar att de stämmer överens.

## Databasstruktur

```
auth.users (Supabase Auth)
     │ 1:1 (auth_user_id, sätts vid första inloggning)
     ▼
profiles ──< user_roles >── roles ──< role_permissions >── permissions
     │                         │
     └──── audit_log ──────────┘   (actor_profile_id, target_type + target_id)
```

Alla tabeller har UUID som primärnyckel (`gen_random_uuid()`).

| Tabell             | Innehåll                                                                                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profiles`         | Användare: e-post, namn, titel, avdelning, status (`invited`/`active`/`inactive`). `auth_user_id` kopplar till Supabase Auth. `entra_tenant_id` + `entra_object_id` förbereder Microsoft Entra ID (unikt par). |
| `permissions`      | Behörighetskatalog (`key`, kategori, etikett). Ändras bara via migrationer.                                                                                                                       |
| `roles`            | Standardroller (`is_system`) och egna roller. `is_locked` = behörigheterna kan inte ändras (Systemadministratör).                                                                                 |
| `role_permissions` | Roll ↔ behörighet (många-till-många).                                                                                                                                                             |
| `user_roles`       | Användare ↔ roll (många-till-många). En användare kan ha flera roller, och de effektiva behörigheterna är summan av rollerna.                                                                      |
| `audit_log`        | Aktivitetslogg: tid, utförare, händelse, mål, sammanfattning och detaljer (`jsonb`). Kan bara fyllas på; triggers stoppar `UPDATE`, `DELETE` och `TRUNCATE`.                                     |

**Index:** unik e-post (skiftlägesokänslig), unikt Entra-ID-par, status, `user_roles(role_id)`, `role_permissions(permission_id)`, `audit_log` på tid, utförare, mål och händelse.

**Funktioner** (`supabase/migrations/…_access_control_functions.sql`):

| Funktion                                       | Beskrivning                                                                  |
| ---------------------------------------------- | ---------------------------------------------------------------------------- |
| `public.my_access()`                           | Den inloggades profil, roller och behörigheter.                              |
| `public.admin_assign_role` / `admin_revoke_role` | Tilldela/ta bort roll (kräver `users.manage`).                             |
| `public.admin_set_profile_status`              | Aktivera/inaktivera användare (kräver `users.manage`).                       |
| `public.admin_create_role` / `admin_update_role` / `admin_delete_role` | Hantera roller (kräver `roles.manage`).               |
| `private.has_permission(key)`                  | Används av RLS-policies. Schemat `private` exponeras inte via API.           |
| `private.bootstrap_system_admin(...)`          | Första administratören. Kan bara köras i SQL-editorn.                        |

## Roller och behörigheter

| Behörighet            | Systemadministratör | Projektledare | Medarbetare | Läsbehörig |
| --------------------- | :-----------------: | :-----------: | :---------: | :--------: |
| `dashboard.view`      | ✓ | ✓ | ✓ | ✓ |
| `projects.view`       | ✓ | ✓ | ✓ | ✓ |
| `projects.create`     | ✓ | ✓ |   |   |
| `projects.edit`       | ✓ | ✓ | ✓ |   |
| `projects.delete`     | ✓ |   |   |   |
| `projects.ai`         | ✓ | ✓ |   |   |
| `users.view`          | ✓ | ✓ |   |   |
| `users.manage`        | ✓ |   |   |   |
| `roles.view`          | ✓ |   |   |   |
| `roles.manage`        | ✓ |   |   |   |
| `integrations.view`   | ✓ | ✓ |   |   |
| `integrations.manage` | ✓ |   |   |   |
| `settings.view`       | ✓ |   |   |   |
| `settings.manage`     | ✓ |   |   |   |
| `audit.view`          | ✓ |   |   |   |

- **Systemadministratör** är låst och får automatiskt alla nya behörigheter. Rollen gäller **bara denna plattform**. Den ger inga rättigheter i Microsoft 365 och kopplas inte till några administratörsroller i Entra ID.
- Standardrollernas behörigheter (utom Systemadministratörs) kan ändras, men rollerna kan inte tas bort.
- Egna roller skapas under *Administration → Användare & roller → Roller*.

**Återanvändbara kontroller:**

| Var                         | Hur                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| Klient (vad som visas)      | `useSession().can("projects.edit")`, `<RequirePermission permission="audit.view">`          |
| Navigation                  | `permission` i `src/config/modules.ts` (en eller flera behörigheter)                        |
| Server                      | `requirePermission("users.manage")` i `src/server/auth/guards.ts`                           |
| Databas                     | RLS-policies och `private.has_permission()` i varje admin-funktion                          |

## Säkerhetsmodell

Behörigheter kontrolleras i tre lager. Gränssnittet döljer bara knappar. Det är servern och databasen som skyddar.

1. **Gränssnitt:** döljer och inaktiverar det användaren saknar behörighet till.
2. **Server** (`src/server/`, alla filer är `server-only`): `getVerifiedIdentity()` verifierar sessionen mot Supabase Auth (`auth.getUser()`) och hämtar behörigheterna från databasen vid varje förfrågan. Varje serveråtgärd kör `requirePermission()` och validerar indata.
3. **Databas** (auktoritativ): RLS på alla tabeller. Anonyma användare har inga rättigheter, och inloggade får bara läsa det policies tillåter. Alla ändringar sker via `SECURITY DEFINER`-funktioner som kontrollerar behörigheten igen, tillämpar reglerna och loggar i samma transaktion.

**Skyddsregler** (i databasen och i `src/lib/auth/policy.ts`):

- Ingen kan ändra sina egna roller eller sin egen status. Ändringar kräver en annan administratör.
- Man kan bara tilldela, ta bort eller redigera roller vars behörigheter man själv har, och bara hantera användare som inte har mer behörighet än man själv.
- Bara en systemadministratör kan tilldela eller ta bort rollen Systemadministratör.
- Den sista aktiva systemadministratören kan inte tas bort eller inaktiveras. Ändringar serialiseras med ett transaktionslås, så detta kan inte kringgås med samtidiga anrop.
- Man kan inte utöka behörigheterna för en roll man själv har.
- Profiler kan inte raderas, bara inaktiveras. Inaktiva användare har inga behörigheter.

**Avstängt tills inloggning finns:** `AUTHENTICATION_IMPLEMENTED` och `REAL_ADMIN_OPERATIONS_ENABLED` i `src/server/config/security-flags.ts` är konstanter i koden, inte miljövariabler, och står på `false`. Serveråtgärderna i `src/server/admin/actions.ts` är dessutom inte kopplade till gränssnittet ännu. Det finns ingen endpoint som kan ge administratörsbehörighet.

## Framtida Microsoft-inloggning

Planen använder **Supabase Auth med Azure-providern**. Det är inbyggt, kostar inget extra och ger en verifierad JWT som RLS kan använda via `auth.uid()`.

1. **Appregistrering i Entra ID** (single tenant, H2:s tenant). Begär bara delegerade grundbehörigheter: `openid`, `profile`, `email` och `User.Read`. Inga administratörsroller i Microsoft 365 och ingen admin-consent för katalogändringar.
2. **Supabase:** *Authentication → Providers → Azure.* Ange Client ID och secret samt tenant-URL `https://login.microsoftonline.com/<tenant-id>`, så att bara H2:s tenant kan logga in. Lägg till Vercel-domänen under *URL Configuration*.
3. **Next.js:**
   - Lägg till `middleware.ts` som förnyar sessionen med `@supabase/ssr`.
   - Skapa en inloggningssida och en callback-route (`/auth/callback`) som byter koden mot en session.
   - Låt `src/app/(platform)/layout.tsx` rendera plattformen för verifierade användare, och skicka icke inloggade till inloggningssidan i stället för `SecureModeGate`.
   - Skapa en klientprovider som levererar `SessionContext` och `AccessContext` (`src/lib/auth/session.ts`, `src/lib/access/access-context.ts`) från `getVerifiedIdentity()` och `src/server/admin/`. Komponenterna behöver inte ändras.
4. **Koppla profil till inloggning:** vid första inloggningen matchas profilen på **`tid` + `oid`** från Microsofts verifierade token, och `profiles.auth_user_id` sätts. Använd aldrig `user_metadata` eller e-post som enda identifierare. `user_metadata` kan ändras av användaren själv. Kopplingen görs i en `SECURITY DEFINER`-funktion som läser identitetsdata från `auth.identities`. Kontrollera vid implementationen vilka Microsoft-claims Supabase faktiskt sparar där (`oid`/`tid`), och lägg in dem via en server-side hook om de saknas.
5. **Utse första systemadministratören** med `private.bootstrap_system_admin` (se ovan).
6. **Slå på brytarna** `AUTHENTICATION_IMPLEMENTED` och `REAL_ADMIN_OPERATIONS_ENABLED` i en granskad kodändring, testa och ta sedan bort demoläget från produktion.

## Vad som fortfarande bara är demo

- **Inloggning:** finns inte. Demoläget har fiktiva användare med fritt byte mellan dem.
- **Adminpanelen:** fungerar mot fiktiv data i webbläsaren. Databasfunktionerna och serveråtgärderna är klara men avstängda.
- **Bjuda in användare:** knappen är inaktiverad. Användare kommer att skapas via Entra ID.
- **Projekt, dashboard, kalender och notiser:** fiktiva exempeldata (`src/data/demo/`). De är inte flyttade till databasen.
- **Integrationer (Microsoft 365, Dropbox, Claude) och plattformsinställningar:** bara gränssnitt.

## Projektstruktur

```
supabase/
├── migrations/               # SQL-migrationer (schema, funktioner, RLS, grunddata)
├── seed.sql                  # FIKTIVA testanvändare – endast lokalt
└── tests/                    # Databastester (npm run test:db)
src/
├── app/(platform)/           # Routes. layout.tsx väljer demoläge eller säkert läge
│   └── administration/       # anvandare, historik, integrationer, installningar
├── components/
│   ├── admin/                # Adminvyer + access/ (användarpanel, rollredigerare, behörigheter)
│   ├── layout/               # Skal, navigation, SecureModeGate
│   └── ui/                   # shadcn/ui
├── config/modules.ts         # Modulregister → navigation (med behörigheter)
├── data/demo/                # FIKTIVA demodata (användare, roller, logg, projekt)
├── lib/
│   ├── auth/                 # permissions.ts (katalog), policy.ts (regler), session.ts, types.ts
│   └── access/               # AccessContext + DemoAccessProvider
├── server/                   # Endast server (server-only)
│   ├── config/               # app-mode.ts, security-flags.ts, env.ts
│   ├── supabase/             # Supabase-klient med användarens session
│   ├── auth/                 # getVerifiedIdentity, requirePermission
│   └── admin/                # Serveråtgärder och frågor (avstängda)
└── integrations/             # Förberedda integrationer
```

### Lägga till en modul eller behörighet

1. Skapa en route under `src/app/(platform)/<modul>/`.
2. Lägg till modulen i `src/config/modules.ts` med behörighet.
3. Ny behörighet: skapa en migration som lägger till den i `public.permissions` (Systemadministratör får den automatiskt) och lägg till den i `src/lib/auth/permissions.ts`. Kör `npm run test:db`.
