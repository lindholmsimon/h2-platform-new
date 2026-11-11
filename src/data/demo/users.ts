import type { AccessUser } from "@/lib/auth/types";
import { DEMO_ROLE_IDS } from "./access";

/** FIKTIVA demoanvändare. Samma UUID som i supabase/seed.sql. */
export const DEMO_USER_IDS = {
  anna: "00000000-0000-4000-8000-000000000001",
  johan: "00000000-0000-4000-8000-000000000002",
  sara: "00000000-0000-4000-8000-000000000003",
  omar: "00000000-0000-4000-8000-000000000004",
  lena: "00000000-0000-4000-8000-000000000005",
  maja: "00000000-0000-4000-8000-000000000006",
} as const;

export const DEMO_USERS: AccessUser[] = [
  {
    id: DEMO_USER_IDS.anna,
    name: "Anna Bergström",
    email: "anna.bergstrom@demo.example",
    title: "IT- och verksamhetsansvarig",
    department: "Ledning",
    phone: "070-000 00 01",
    status: "active",
    roleIds: [DEMO_ROLE_IDS.systemAdmin],
  },
  {
    id: DEMO_USER_IDS.johan,
    name: "Johan Ekdahl",
    email: "johan.ekdahl@demo.example",
    title: "Projektledare",
    department: "Produktion",
    phone: "070-000 00 02",
    status: "active",
    roleIds: [DEMO_ROLE_IDS.projectManager],
  },
  {
    id: DEMO_USER_IDS.sara,
    name: "Sara Nyqvist",
    email: "sara.nyqvist@demo.example",
    title: "Arbetsledare",
    department: "Produktion",
    phone: "070-000 00 03",
    status: "active",
    roleIds: [DEMO_ROLE_IDS.employee],
  },
  {
    id: DEMO_USER_IDS.omar,
    name: "Omar Haddad",
    email: "omar.haddad@demo.example",
    title: "Kalkylator",
    department: "Kalkyl",
    phone: "070-000 00 04",
    status: "active",
    roleIds: [DEMO_ROLE_IDS.readOnly],
  },
  {
    id: DEMO_USER_IDS.lena,
    name: "Lena Forsberg",
    email: "lena.forsberg@demo.example",
    title: "Projektledare",
    department: "Produktion",
    phone: "070-000 00 05",
    status: "active",
    roleIds: [DEMO_ROLE_IDS.projectManager],
  },
  {
    id: DEMO_USER_IDS.maja,
    name: "Maja Ström",
    email: "maja.strom@demo.example",
    title: "Inköpare",
    department: "Inköp",
    phone: "070-000 00 06",
    status: "invited",
    roleIds: [DEMO_ROLE_IDS.employee],
  },
];

/** Statisk uppslagning för projektdata (namn, titel). Påverkas inte av ändringar i adminpanelen. */
export function getUser(id: string) {
  return DEMO_USERS.find((u) => u.id === id);
}
