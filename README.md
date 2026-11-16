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
- [Microsoft-inloggning](#microsoft-inloggning)
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
| `npm run test:unit` | Enhetstester (t.ex. skydd mot öppen omdirigering)            |
| `npm test`          | Alla tester                                                  |

`npm run test:db` kör alla migrationer i [PGlite](https://pglite.dev) (Postgres i WebAssembly), alltså utan Docker eller molntjänst. Testerna kontrollerar bland annat att anonyma användare och `service_role` saknar åtkomst, att ingen kan ändra sina egna roller, att behörigheter inte kan delas ut "uppåt", att den sista systemadministratören skyddas och att aktivitetsloggen inte kan ändras.

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

Produktionsprojektet är **h2-platform-new** (`yaoxvulxifmlxgfgerew`, North EU / Stockholm). Gratisplanen räcker för det här steget.

### Migrationer via GitHub-integrationen (rekommenderat)

GitHub är källan till sanningen: Supabase kör nya filer i `supabase/migrations/` när de mergas till `main`. Inga lösenord eller nycklar behövs i GitHub eller i koden.

1. I Supabase: *Project Settings → Integrations → GitHub → Connect*.
   - Repository: `lindholmsimon/h2-platform-new`
   - Supabase-katalog: `.` (repots rot, där mappen `supabase/` ligger)
   - Produktionsbranch: `main`
   - Slå på *Deploy to production*. Lämna *Automatic branching* avstängt (preview-databaser kostar extra).
2. Granska och merga pull requesten. Migrationerna körs i nummerordning, och resultatet syns under *Integrations → GitHub*.
3. **Kontrollera säkerheten:** gå igenom *Advisors → Security Advisor* och åtgärda eventuella varningar. RLS ska vara aktiverat på alla tabeller.
4. **Lägg in miljövariablerna** `NEXT_PUBLIC_SUPABASE_URL` och `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (från *Project Settings → API*) i Vercel. De används först när inloggningen är aktiverad.

Kör inte migrationerna på något annat sätt vid sidan av integrationen, till exempel genom att klistra in dem i SQL-editorn. Då stämmer inte migrationshistoriken med filerna längre, och integrationen försöker köra dem igen.

### Alternativ: Supabase CLI från egen dator

Databaslösenordet anges bara i din egen terminal.

```bash
npx supabase login
```

```bash
npx supabase link --project-ref yaoxvulxifmlxgfgerew
```

```bash
npx supabase db push --dry-run
```

```bash
npx supabase db push
```

### Seed-data (`supabase/seed.sql`)

`seed.sql` innehåller **fiktiva** testanvändare och är bara till för lokal utveckling. Den körs aldrig mot produktion:

- `supabase/config.toml` stänger av seed för produktionsprojektet (`[remotes.production.db.seed] enabled = false`).
- `supabase db push` kör inte seed-filen (kräver flaggan `--include-seed`, som aldrig ska användas här).
- GitHub-integrationen kör inte seed-filen mot produktionsdatabasen.

Lokalt (kräver Docker) körs den automatiskt efter migrationerna:

```bash
npx supabase start
```

```bash
npx supabase db reset
```

### Första systemadministratören

Görs i SQL-editorn i Supabase. Det kan inte göras via API eller webbplatsen:

```sql
select private.bootstrap_system_admin(
  'fornamn.efternamn@h2entreprenad.se',  -- e-post (samma som Microsoft-kontot)
  'Förnamn Efternamn'                     -- namn
);
```

Funktionen fungerar bara när det inte finns någon aktiv systemadministratör. Den kan köras före eller efter personens första inloggning. Profilen kopplas till Microsoft-kontot via den bekräftade e-postadressen. Därefter hanteras alla roller i adminpanelen.

### Nya migrationer

Skapa filen med `npx supabase migration new <namn>`, kör `npm run test:db` och öppna en pull request. Integrationen kör den när PR:en mergas.

- Ändras behörighetskatalogen måste `src/lib/auth/permissions.ts` uppdateras också. Testet kontrollerar att de stämmer överens.
- **Nya tabeller och funktioner i `public`** får som standard alla rättigheter för `anon`, `authenticated` och `service_role`. Lägg alltid till `revoke` och en avgränsad `grant` i samma migration, på samma sätt som i migration 3 och 5.

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
| `public.link_my_profile()`                     | Kopplar Microsoft-inloggningen till en profil (migration 6).                  |
| `public.my_roles()`                            | Den inloggades egna roller med behörigheter.                                  |
| `private.set_allowed_entra_tenant(uuid)`       | Sätter H2:s tillåtna Microsoft-tenant. Kan bara köras i SQL-editorn.          |

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
- **`service_role` har inga rättigheter** till tabellerna eller admin-funktionerna (migration 5). Supabase ger annars rollen fulla rättigheter som standard, och den går förbi RLS. Utan begränsningen skulle den som har service_role-nyckeln kunna ändra roller förbi reglerna och skriva falska poster i loggen. Supabase Dashboard och Auth påverkas inte.

**Avstängt tills inloggning finns:** `AUTHENTICATION_IMPLEMENTED` och `REAL_ADMIN_OPERATIONS_ENABLED` i `src/server/config/security-flags.ts` är konstanter i koden, inte miljövariabler, och står på `false`. Serveråtgärderna i `src/server/admin/actions.ts` är dessutom inte kopplade till gränssnittet ännu. Det finns ingen endpoint som kan ge administratörsbehörighet.

## Microsoft-inloggning

Inloggningen använder **Supabase Auth med Azure-providern**. Det är inbyggt, kostar inget extra och ger en verifierad session som RLS använder via `auth.uid()`. **Koden är klar men avstängd** (`AUTHENTICATION_IMPLEMENTED = false` i `src/server/config/security-flags.ts`) tills den har testats med riktiga konton.

### Så fungerar det

1. `/logga-in` startar inloggningen med Microsoft (PKCE). Den begär bara `email` utöver grundbehörigheterna.
2. `/auth/callback` byter engångskoden mot en session. Sessionen sparas i cookies med `httpOnly` och `secure`.
3. `public.link_my_profile()` (migration 6) kopplar inloggningen till en profil:
   - **Tenant:** tenant-ID läses från den verifierade identiteten i `auth.identities`, aldrig från `user_metadata`. Bara den tenant som satts med `private.set_allowed_entra_tenant()` släpps in. Är ingen satt nekas alla.
   - **Profil:** befintlig profil matchas på kopplad inloggning, sedan tenant-ID + object-ID, sedan bekräftad e-post. Annars skapas en ny profil, aktiv men **utan roller**.
   - **Misslyckas kopplingen** loggas personen ut direkt. Nya användare och kopplingar loggas i aktivitetsloggen.
4. `middleware.ts` förnyar sessionen och skickar icke inloggade till `/logga-in`. Varje sida och serveråtgärd kontrollerar ändå inloggningen igen på servern (`getAuthState`, `requirePermission`), och databasen gör det med RLS.
5. Inloggade utan roll ser *Väntar på behörighet*. Inaktiva konton ser *Kontot har ingen åtkomst*.

Gäster i H2:s tenant, till exempel en extern utvecklare, kan logga in på samma sätt och får en roll av en systemadministratör.

### Checklista för att slå på inloggningen

1. **Entra ID:** appregistrering enligt manualen till IT (single tenant, `openid`, `profile`, `email`, `User.Read`, `xms_edov`).
2. **Supabase → Authentication → Providers → Azure:** slå på och ange Client ID, klienthemlighetens *Value* och *Azure Tenant URL* `https://login.microsoftonline.com/<tenant-id>`.
3. **Supabase → Authentication → URL Configuration:** *Site URL* = produktionsadressen. *Redirect URLs* = `https://<produktionsdomän>/auth/callback`, Vercels preview-adresser (t.ex. `https://*-<team>.vercel.app/auth/callback`) och `http://localhost:3000/auth/callback`.
4. **Supabase → SQL-editorn:** `select private.set_allowed_entra_tenant('<tenant-id>');`
5. **Vercel:** `NEXT_PUBLIC_SUPABASE_URL` och `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` för Production och Preview. `H2_DEMO_MODE` ska inte vara satt i miljön där inloggningen testas.
6. **Kodändring:** sätt `AUTHENTICATION_IMPLEMENTED = true` i en egen PR och testa i dess preview.
7. **Första systemadministratören** (se ovan). Personen loggar in och tilldelar sedan roller i adminpanelen.
8. **När rolländringar är testade:** sätt `REAL_ADMIN_OPERATIONS_ENABLED = true` i en egen PR.

## Vad som fortfarande bara är demo

- **Inloggning:** byggd men avstängd tills den är testad med riktiga konton (se *Microsoft-inloggning*). Demoläget har fiktiva användare med fritt byte mellan dem.
- **Adminpanelen:** fungerar mot fiktiv data i demoläget. Vid riktig inloggning visar den riktiga användare och roller, men ändringar är avstängda (`REAL_ADMIN_OPERATIONS_ENABLED`) tills de är testade.
- **Bjuda in användare:** knappen är inaktiverad. Användare skapas automatiskt vid första inloggningen, utan roller.
- **Projekt, dashboard, kalender och notiser:** fiktiva exempeldata (`src/data/demo/`). De är inte flyttade till databasen.
- **Integrationer (Microsoft 365, Dropbox, Claude) och plattformsinställningar:** bara gränssnitt.

## Projektstruktur

```
supabase/
├── migrations/               # SQL-migrationer (schema, funktioner, RLS, grunddata)
├── seed.sql                  # FIKTIVA testanvändare – endast lokalt
└── tests/                    # Databastester (npm run test:db)
src/
├── middleware.ts             # Förnyar Supabase-sessionen, skickar icke inloggade till /logga-in
├── app/logga-in/             # Inloggningssidan
├── app/auth/callback/        # Mottagning efter Microsoft-inloggning
├── app/(platform)/           # Routes. layout.tsx väljer demoläge eller säkert läge
├── assets/brand/             # Logotyp (ljus/mörk variant + märke). Favicon/ikoner i src/app/
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
