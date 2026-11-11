import { daysFromNow } from ".";

export type ProjectStatus = "planering" | "pagaende" | "pausad" | "avslutad";

export const PROJECT_STATUS: Record<
  ProjectStatus,
  { label: string; variant: "info" | "success" | "warning" | "secondary" }
> = {
  planering: { label: "Planering", variant: "info" },
  pagaende: { label: "Pågående", variant: "success" },
  pausad: { label: "Pausad", variant: "warning" },
  avslutad: { label: "Avslutad", variant: "secondary" },
};

export type TaskStatus = "att-gora" | "pagar" | "klar";

export interface ProjectTask {
  id: string;
  title: string;
  assigneeId: string;
  status: TaskStatus;
  due: string;
  priority: "hog" | "normal" | "lag";
}

export interface ProjectFile {
  id: string;
  name: string;
  type: "pdf" | "dwg" | "xlsx" | "docx" | "jpg";
  size: string;
  folder: string;
  updatedAt: string;
  updatedBy: string;
}

export interface Project {
  id: string;
  number: string;
  name: string;
  client: string;
  location: string;
  category: string;
  status: ProjectStatus;
  managerId: string;
  teamIds: string[];
  progress: number;
  startDate: string;
  endDate: string;
  description: string;
  lastActivity: { text: string; at: string; userId: string };
  tasks: ProjectTask[];
  files: ProjectFile[];
}

export const DEMO_PROJECTS: Project[] = [
  {
    id: "p-1001",
    number: "DEMO-1001",
    name: "Kv. Lärkan – flerbostadshus",
    client: "Exempelbostäder AB",
    location: "Exempelstad",
    category: "Nyproduktion",
    status: "pagaende",
    managerId: "00000000-0000-4000-8000-000000000002",
    teamIds: ["00000000-0000-4000-8000-000000000002", "00000000-0000-4000-8000-000000000003", "00000000-0000-4000-8000-000000000004"],
    progress: 62,
    startDate: daysFromNow(-180),
    endDate: daysFromNow(150),
    description:
      "Nyproduktion av två flerbostadshus med totalt 48 lägenheter, garage under mark och gemensam gård. Fiktivt exempelprojekt.",
    lastActivity: { text: "Laddade upp reviderad K-ritning", at: daysFromNow(0, -2), userId: "00000000-0000-4000-8000-000000000003" },
    tasks: [
      { id: "t1", title: "Stämma av gjutplan plan 4", assigneeId: "00000000-0000-4000-8000-000000000003", status: "pagar", due: daysFromNow(1), priority: "hog" },
      { id: "t2", title: "Beställa fönster etapp 2", assigneeId: "00000000-0000-4000-8000-000000000002", status: "att-gora", due: daysFromNow(3), priority: "normal" },
      { id: "t3", title: "Uppdatera tidplan efter ÄTA 12", assigneeId: "00000000-0000-4000-8000-000000000002", status: "att-gora", due: daysFromNow(5), priority: "normal" },
      { id: "t5", title: "Godkänna behörigheter för nytt projektteam", assigneeId: "00000000-0000-4000-8000-000000000001", status: "att-gora", due: daysFromNow(0, 7), priority: "hog" },
      { id: "t4", title: "Egenkontroll armering plan 3", assigneeId: "00000000-0000-4000-8000-000000000003", status: "klar", due: daysFromNow(-2), priority: "hog" },
    ],
    files: [
      { id: "f1", name: "K-ritning plan 4 rev C.pdf", type: "pdf", size: "4,2 MB", folder: "Ritningar", updatedAt: daysFromNow(0, -2), updatedBy: "00000000-0000-4000-8000-000000000003" },
      { id: "f2", name: "Tidplan v3.xlsx", type: "xlsx", size: "320 kB", folder: "Planering", updatedAt: daysFromNow(-1), updatedBy: "00000000-0000-4000-8000-000000000002" },
      { id: "f3", name: "Arbetsmiljöplan.docx", type: "docx", size: "1,1 MB", folder: "Arbetsmiljö", updatedAt: daysFromNow(-6), updatedBy: "00000000-0000-4000-8000-000000000002" },
      { id: "f4", name: "Situationsplan.dwg", type: "dwg", size: "8,7 MB", folder: "Ritningar", updatedAt: daysFromNow(-20), updatedBy: "00000000-0000-4000-8000-000000000004" },
      { id: "f5", name: "Foto stomme 2026-11-09.jpg", type: "jpg", size: "2,4 MB", folder: "Foton", updatedAt: daysFromNow(-2), updatedBy: "00000000-0000-4000-8000-000000000003" },
    ],
  },
  {
    id: "p-1002",
    number: "DEMO-1002",
    name: "Ombyggnad Västra skolan",
    client: "Exempelkommunen",
    location: "Exempelby",
    category: "Ombyggnad",
    status: "pagaende",
    managerId: "00000000-0000-4000-8000-000000000005",
    teamIds: ["00000000-0000-4000-8000-000000000005", "00000000-0000-4000-8000-000000000003"],
    progress: 35,
    startDate: daysFromNow(-90),
    endDate: daysFromNow(210),
    description: "Invändig ombyggnad av skolbyggnad med nya ventilationssystem och tillgänglighetsanpassning.",
    lastActivity: { text: "Skapade uppgift: Provtagning asbest", at: daysFromNow(0, -5), userId: "00000000-0000-4000-8000-000000000005" },
    tasks: [
      { id: "t1", title: "Provtagning asbest hus B", assigneeId: "00000000-0000-4000-8000-000000000003", status: "att-gora", due: daysFromNow(2), priority: "hog" },
      { id: "t2", title: "Byggmöte nr 8 – protokoll", assigneeId: "00000000-0000-4000-8000-000000000005", status: "pagar", due: daysFromNow(0, 6), priority: "normal" },
      { id: "t4", title: "Underlag ledningsgrupp – projektuppföljning", assigneeId: "00000000-0000-4000-8000-000000000001", status: "pagar", due: daysFromNow(2), priority: "normal" },
      { id: "t3", title: "Rivningsplan våning 2", assigneeId: "00000000-0000-4000-8000-000000000005", status: "klar", due: daysFromNow(-4), priority: "normal" },
    ],
    files: [
      { id: "f1", name: "Rivningsplan.pdf", type: "pdf", size: "1,8 MB", folder: "Planering", updatedAt: daysFromNow(-4), updatedBy: "00000000-0000-4000-8000-000000000005" },
      { id: "f2", name: "Byggmötesprotokoll 7.docx", type: "docx", size: "210 kB", folder: "Möten", updatedAt: daysFromNow(-7), updatedBy: "00000000-0000-4000-8000-000000000005" },
    ],
  },
  {
    id: "p-1003",
    number: "DEMO-1003",
    name: "Logistiklager Norr",
    client: "Exempellogistik AB",
    location: "Exempelhamn",
    category: "Industri",
    status: "planering",
    managerId: "00000000-0000-4000-8000-000000000002",
    teamIds: ["00000000-0000-4000-8000-000000000002", "00000000-0000-4000-8000-000000000004"],
    progress: 8,
    startDate: daysFromNow(45),
    endDate: daysFromNow(400),
    description: "Lagerbyggnad om 12 000 m² med kontorsdel. Projektet är i kalkyl- och projekteringsfas.",
    lastActivity: { text: "Uppdaterade kalkyl rev B", at: daysFromNow(-1, -3), userId: "00000000-0000-4000-8000-000000000004" },
    tasks: [
      { id: "t1", title: "Kalkyl rev C – mark och grund", assigneeId: "00000000-0000-4000-8000-000000000004", status: "pagar", due: daysFromNow(4), priority: "normal" },
      { id: "t3", title: "Se över licenser för ritningsverktyg", assigneeId: "00000000-0000-4000-8000-000000000001", status: "att-gora", due: daysFromNow(6), priority: "lag" },
      { id: "t2", title: "Förfrågningsunderlag till UE", assigneeId: "00000000-0000-4000-8000-000000000002", status: "att-gora", due: daysFromNow(10), priority: "lag" },
    ],
    files: [
      { id: "f1", name: "Kalkyl rev B.xlsx", type: "xlsx", size: "960 kB", folder: "Kalkyl", updatedAt: daysFromNow(-1, -3), updatedBy: "00000000-0000-4000-8000-000000000004" },
    ],
  },
  {
    id: "p-1004",
    number: "DEMO-1004",
    name: "Kontorshus Kvarnen – hyresgästanpassning",
    client: "Exempelfastigheter AB",
    location: "Exempelstad",
    category: "Hyresgästanpassning",
    status: "pausad",
    managerId: "00000000-0000-4000-8000-000000000005",
    teamIds: ["00000000-0000-4000-8000-000000000005"],
    progress: 48,
    startDate: daysFromNow(-60),
    endDate: daysFromNow(60),
    description: "Anpassning av två kontorsplan. Pausat i väntan på beslut från beställaren.",
    lastActivity: { text: "Satte projektet som pausat", at: daysFromNow(-3), userId: "00000000-0000-4000-8000-000000000005" },
    tasks: [{ id: "t1", title: "Invänta beslut planlösning", assigneeId: "00000000-0000-4000-8000-000000000005", status: "att-gora", due: daysFromNow(7), priority: "normal" }],
    files: [],
  },
  {
    id: "p-1005",
    number: "DEMO-1005",
    name: "Radhusområdet Ängen",
    client: "Exempelbostäder AB",
    location: "Exempelby",
    category: "Nyproduktion",
    status: "avslutad",
    managerId: "00000000-0000-4000-8000-000000000002",
    teamIds: ["00000000-0000-4000-8000-000000000002", "00000000-0000-4000-8000-000000000003"],
    progress: 100,
    startDate: daysFromNow(-500),
    endDate: daysFromNow(-30),
    description: "24 radhus med carport. Slutbesiktigat och överlämnat.",
    lastActivity: { text: "Arkiverade slutdokumentation", at: daysFromNow(-12), userId: "00000000-0000-4000-8000-000000000002" },
    tasks: [],
    files: [
      { id: "f1", name: "Slutbesiktningsprotokoll.pdf", type: "pdf", size: "640 kB", folder: "Besiktning", updatedAt: daysFromNow(-30), updatedBy: "00000000-0000-4000-8000-000000000002" },
    ],
  },
  {
    id: "p-1006",
    number: "DEMO-1006",
    name: "Vårdcentral Söder – tillbyggnad",
    client: "Exempelregionen",
    location: "Exempelstad",
    category: "Tillbyggnad",
    status: "pagaende",
    managerId: "00000000-0000-4000-8000-000000000005",
    teamIds: ["00000000-0000-4000-8000-000000000005", "00000000-0000-4000-8000-000000000003", "00000000-0000-4000-8000-000000000004"],
    progress: 74,
    startDate: daysFromNow(-240),
    endDate: daysFromNow(45),
    description: "Tillbyggnad med sex behandlingsrum och ny entré.",
    lastActivity: { text: "Markerade egenkontroll som klar", at: daysFromNow(-1), userId: "00000000-0000-4000-8000-000000000003" },
    tasks: [
      { id: "t1", title: "Förbesiktning – kallelse", assigneeId: "00000000-0000-4000-8000-000000000005", status: "att-gora", due: daysFromNow(6), priority: "hog" },
      { id: "t2", title: "Montage innerdörrar", assigneeId: "00000000-0000-4000-8000-000000000003", status: "pagar", due: daysFromNow(2), priority: "normal" },
    ],
    files: [
      { id: "f1", name: "A-ritning entré.pdf", type: "pdf", size: "2,9 MB", folder: "Ritningar", updatedAt: daysFromNow(-9), updatedBy: "00000000-0000-4000-8000-000000000005" },
    ],
  },
];

export function getProject(id: string) {
  return DEMO_PROJECTS.find((p) => p.id === id);
}
