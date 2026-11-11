import { PERMISSION_CATALOG, type PermissionDefinition } from "@/lib/auth/permissions";

/** Behörighetskatalogen grupperad per kategori, i katalogens ordning. */
export const PERMISSION_GROUPS: { category: string; permissions: PermissionDefinition[] }[] = PERMISSION_CATALOG.reduce(
  (groups, def) => {
    const group = groups.find((g) => g.category === def.category);
    if (group) group.permissions.push(def);
    else groups.push({ category: def.category, permissions: [def] });
    return groups;
  },
  [] as { category: string; permissions: PermissionDefinition[] }[],
);
