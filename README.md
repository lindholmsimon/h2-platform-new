# H2 Plattform

Intern företagsplattform för H2 Entreprenad – byggd med Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui och Lucide Icons.

> **Demoläge (fas 1):** Plattformen innehåller endast gränssnitt och **fiktiva exempeldata**. Det finns ingen inloggning, inga externa API-anrop och ingen databas. Använd inte demoläget för riktiga H2-uppgifter.

## Kom igång

Krav: Node.js 20.9 eller senare.

```bash
npm install
npm run dev
```

Öppna sedan [http://localhost:3000](http://localhost:3000).

| Kommando            | Beskrivning                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Startar utvecklingsserver            |
| `npm run build`     | Bygger produktionsversion            |
| `npm run start`     | Kör produktionsbygget lokalt         |
| `npm run lint`      | Kör ESLint                           |
| `npm run typecheck` | Kontrollerar TypeScript-typer        |

## Driftsättning på Vercel

Projektet är förberett för Vercel och behöver ingen extra konfiguration:

1. Importera repositoryt i Vercel.
2. Ramverk: **Next.js** (identifieras automatiskt). Build-kommando `npm run build`.
3. Inga miljövariabler behövs i fas 1.

## Innehåll i fas 1

- **Dashboard** – personlig startsida med widgets (Mina uppgifter, Kalender, Senaste projekt, Notiser, AI-assistent m.fl.). Klicka på *Anpassa* för att lägga till, ta bort och flytta widgets. Layouten sparas per demoanvändare i webbläsarens `localStorage`.
- **Projekt** – översikt med sökning och filter (status, ansvarig), projektkort och projektsidor med flikarna Översikt, Filer, Uppgifter och AI-analys.
- **Administration** – användare, roller och behörighetsmatris; integrationer (Microsoft 365, Dropbox, Claude – alla *ej anslutna*); plattformsinställningar. Endast gränssnitt.
- **Profil** – demoanvändarens uppgifter, preferenser och växling mellan demoanvändare.
- Ljust/mörkt tema, hopfällbar sidomeny, mobilmeny och bottennavigation för mobil.

Byt demoanvändare via profilmenyn (uppe till höger eller längst ned i sidomenyn) för att se hur menyer och sidor anpassas efter roll – t.ex. har rollen *Medarbetare* inte tillgång till Administration.

## Struktur

```
src/
├── app/                       # Routes (App Router)
│   ├── layout.tsx             # Rot: tema + session
│   └── (platform)/            # Allt som visas i plattformens skal
│       ├── page.tsx           # Dashboard  (/)
│       ├── projekt/           # /projekt, /projekt/[id]
│       ├── administration/    # /administration/{anvandare,integrationer,installningar}
│       └── profil/            # /profil
├── components/
│   ├── ui/                    # shadcn/ui-komponenter (generiska)
│   ├── layout/                # Skal: sidomeny, toppfält, mobilnavigation, tema
│   ├── shared/                # Återanvändbara byggstenar (PageHeader, EmptyState, …)
│   ├── dashboard/             # Widgetsystem + widgets
│   ├── projects/              # Projektkomponenter och flikar
│   ├── admin/                 # Administrationsvyer
│   └── profile/
├── config/modules.ts          # Modulregister → bygger all navigation
├── data/demo/                 # FIKTIVA exempeldata (enda datakällan i fas 1)
├── integrations/              # Definitioner/gränssnitt för M365, Dropbox, Claude
├── lib/auth/                  # Roller, behörigheter och sessionslager
├── hooks/
└── lib/utils.ts
```

### Lägga till en ny modul

1. Skapa en route under `src/app/(platform)/<modul>/page.tsx`.
2. Lägg till modulen i `src/config/modules.ts` med ikon och behörighet. Sidomeny, mobilmeny och bottennavigation uppdateras automatiskt.
3. Behövs en ny behörighet? Lägg till den i `src/lib/auth/types.ts` och koppla den till roller i `src/lib/auth/roles.ts`.

### Lägga till en dashboard-widget

Skapa komponenten i `src/components/dashboard/widgets/` och registrera den i `src/components/dashboard/widget-registry.tsx`.

### shadcn/ui

`components.json` är konfigurerad, så nya komponenter kan läggas till med `npx shadcn@latest add <komponent>`.

## Förberett för kommande faser

- **Microsoft Entra ID-inloggning:** Alla komponenter hämtar användare och behörigheter via `useSession()` i `src/lib/auth/session-provider.tsx`. Byt demoimplementationen där mot riktig inloggning; gränssnittet frågar bara `can(permission)` och behöver inte ändras. Behörighetskontroller måste då även göras server-side (middleware / Supabase RLS).
- **Rollbaserade behörigheter:** Roller och behörigheter finns i `src/lib/auth/`. Rollerna kan mappas mot grupper eller app roles i Entra ID.
- **Supabase:** Ersätt `src/data/demo/` med datalager mot Supabase. Dashboard-layouten sparas i dag via `useDashboardLayout` och kan flyttas till en tabell utan att komponenterna ändras.
- **Integrationer:** `src/integrations/` innehåller definitioner och planerade klientgränssnitt. Anrop till Microsoft Graph, Dropbox och Claude ska göras server-side (Route Handlers / Server Actions) – API-nycklar får aldrig hamna i klientkoden.
