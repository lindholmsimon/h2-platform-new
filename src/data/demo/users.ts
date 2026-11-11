import type { PlatformUser } from "@/lib/auth/types";

export const DEMO_USERS: PlatformUser[] = [
  {
    id: "u-anna",
    name: "Anna Bergström",
    email: "anna.bergstrom@demo.example",
    title: "IT- och verksamhetsansvarig",
    department: "Ledning",
    phone: "070-000 00 01",
    roleId: "admin",
  },
  {
    id: "u-johan",
    name: "Johan Ekdahl",
    email: "johan.ekdahl@demo.example",
    title: "Projektledare",
    department: "Produktion",
    phone: "070-000 00 02",
    roleId: "projektledare",
  },
  {
    id: "u-sara",
    name: "Sara Nyqvist",
    email: "sara.nyqvist@demo.example",
    title: "Arbetsledare",
    department: "Produktion",
    phone: "070-000 00 03",
    roleId: "arbetsledare",
  },
  {
    id: "u-omar",
    name: "Omar Haddad",
    email: "omar.haddad@demo.example",
    title: "Kalkylator",
    department: "Kalkyl",
    phone: "070-000 00 04",
    roleId: "medarbetare",
  },
  {
    id: "u-lena",
    name: "Lena Forsberg",
    email: "lena.forsberg@demo.example",
    title: "Projektledare",
    department: "Produktion",
    phone: "070-000 00 05",
    roleId: "projektledare",
  },
];

export function getUser(id: string) {
  return DEMO_USERS.find((u) => u.id === id);
}
