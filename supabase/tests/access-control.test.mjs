// Databastester för behörighetssystemet. Kör: npm run test:db
// Använder PGlite (Postgres i WebAssembly) – ingen Docker eller molntjänst krävs.
import { PGlite } from "@electric-sql/pglite";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { before, describe, test } from "node:test";

import { PERMISSION_KEYS } from "../../src/lib/auth/permissions.ts";

const dir = new URL("..", import.meta.url).pathname;
const read = (p) => readFileSync(join(dir, p), "utf8");

const ID = {
  anna: "00000000-0000-4000-8000-000000000001", // system_admin
  johan: "00000000-0000-4000-8000-000000000002", // project_manager
  sara: "00000000-0000-4000-8000-000000000003", // employee
  omar: "00000000-0000-4000-8000-000000000004", // read_only
};
const AUTH = Object.fromEntries(Object.entries(ID).map(([k, v]) => [k, v.replace("00000000-0000-4000-8000", "aaaaaaaa-0000-4000-8000")]));

let db;

/** Kör SQL som en API-roll (anon/authenticated) i en transaktion som alltid rullas tillbaka. */
async function as(who, sql, params = []) {
  return db.transaction(async (tx) => {
    if (who === "anon" || who === "service_role") {
      await tx.exec(`set local role ${who}`);
    } else {
      await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [AUTH[who]]);
      await tx.exec("set local role authenticated");
    }
    const res = await tx.query(sql, params);
    await tx.rollback();
    return res;
  });
}

/** Kör SQL som en API-roll och behåller ändringen. */
async function asCommit(who, sql, params = []) {
  return db.transaction(async (tx) => {
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [AUTH[who]]);
    await tx.exec("set local role authenticated");
    return tx.query(sql, params);
  });
}

const roleId = async (key) => (await db.query("select id from public.roles where key = $1", [key])).rows[0].id;

before(async () => {
  db = new PGlite();
  await db.exec(read("tests/supabase-stub.sql"));
  for (const file of readdirSync(join(dir, "migrations")).sort()) {
    await db.exec(read(join("migrations", file)));
  }
  await db.exec(read("seed.sql"));
  for (const who of Object.keys(ID)) {
    await db.query("insert into auth.users (id) values ($1)", [AUTH[who]]);
    await db.query("update public.profiles set auth_user_id = $1 where id = $2", [AUTH[who], ID[who]]);
  }
});

describe("katalog", () => {
  test("behörigheterna i databasen matchar src/lib/auth/permissions.ts", async () => {
    const { rows } = await db.query("select key from public.permissions order by key");
    assert.deepEqual(rows.map((r) => r.key), [...PERMISSION_KEYS].sort());
  });

  test("Systemadministratör har alla behörigheter", async () => {
    const { rows } = await db.query(
      "select count(*)::int as n from public.role_permissions rp join public.roles r on r.id = rp.role_id where r.key = 'system_admin'",
    );
    assert.equal(rows[0].n, PERMISSION_KEYS.length);
  });
});

describe("anonyma användare", () => {
  for (const table of ["profiles", "roles", "permissions", "role_permissions", "user_roles", "audit_log"]) {
    test(`kan inte läsa ${table}`, async () => {
      await assert.rejects(as("anon", `select * from public.${table}`), /permission denied/);
    });
  }

  test("kan inte anropa RPC-funktioner", async () => {
    await assert.rejects(as("anon", "select public.my_access()"), /permission denied/);
    await assert.rejects(as("anon", "select public.admin_assign_role($1, $2)", [ID.omar, ID.omar]), /permission denied/);
  });

  test("kan inte anropa bootstrap", async () => {
    await assert.rejects(as("anon", "select private.bootstrap_system_admin('x@demo.example', 'X')"), /permission denied/);
  });
});

describe("service_role", () => {
  for (const table of ["profiles", "roles", "permissions", "role_permissions", "user_roles", "audit_log"]) {
    test(`kan inte läsa eller skriva ${table}`, async () => {
      await assert.rejects(as("service_role", `select * from public.${table}`), /permission denied/);
      await assert.rejects(as("service_role", `delete from public.${table}`), /permission denied/);
    });
  }

  test("kan inte göra någon till systemadministratör direkt i tabellen", async () => {
    await assert.rejects(
      as("service_role", "insert into public.user_roles (profile_id, role_id) values ($1, $2)", [ID.omar, await roleId("system_admin")]),
      /permission denied/,
    );
  });

  test("kan inte skriva falska poster i aktivitetsloggen", async () => {
    await assert.rejects(
      as("service_role", "insert into public.audit_log (action, target_type, summary) values ('x', 'system', 'falsk')"),
      /permission denied/,
    );
  });

  test("kan inte anropa admin-funktionerna eller my_access", async () => {
    await assert.rejects(as("service_role", "select public.my_access()"), /permission denied/);
    for (const call of [
      "public.admin_assign_role($1, $1)",
      "public.admin_revoke_role($1, $1)",
      "public.admin_set_profile_status($1, 'inactive')",
      "public.admin_delete_role($1)",
    ]) {
      await assert.rejects(as("service_role", `select ${call}`, [ID.omar]), /permission denied/);
    }
    await assert.rejects(as("service_role", "select public.admin_create_role('x_role', 'X', '', array[]::text[])"), /permission denied/);
    await assert.rejects(
      as("service_role", "select public.admin_update_role($1, 'X', '', array[]::text[])", [ID.omar]),
      /permission denied/,
    );
  });

  test("kan inte anropa bootstrap", async () => {
    await assert.rejects(as("service_role", "select private.bootstrap_system_admin('x@demo.example', 'X')"), /permission denied/);
  });
});

describe("inloggade användare", () => {
  test("kan inte skriva direkt i tabellerna", async () => {
    await assert.rejects(
      as("anna", "insert into public.user_roles (profile_id, role_id) select $1, id from public.roles where key = 'system_admin'", [ID.omar]),
      /permission denied/,
    );
    await assert.rejects(as("anna", "update public.profiles set status = 'inactive'"), /permission denied/);
    await assert.rejects(as("anna", "delete from public.audit_log"), /permission denied/);
  });

  test("kan inte anropa bootstrap", async () => {
    await assert.rejects(as("anna", "select private.bootstrap_system_admin('x@demo.example', 'X')"), /permission denied/);
  });

  test("läsbehörig ser bara sin egen profil och ingen logg", async () => {
    const profiles = await as("omar", "select id from public.profiles");
    assert.deepEqual(profiles.rows.map((r) => r.id), [ID.omar]);
    const roles = await as("omar", "select id from public.roles");
    assert.equal(roles.rows.length, 0);
    const log = await as("omar", "select id from public.audit_log");
    assert.equal(log.rows.length, 0);
  });

  test("my_access returnerar egna behörigheter", async () => {
    const { rows } = await as("omar", "select public.my_access() as a");
    assert.deepEqual(rows[0].a.permissions, ["dashboard.view", "projects.view"]);
  });

  test("inaktiv användare har inga behörigheter", async () => {
    await db.query("update public.profiles set status = 'inactive' where id = $1", [ID.omar]);
    const { rows } = await as("omar", "select public.my_access() as a");
    assert.equal(rows[0].a, null);
    await db.query("update public.profiles set status = 'active' where id = $1", [ID.omar]);
  });
});

describe("rolltilldelning", () => {
  test("administratör kan tilldela roll och det loggas", async () => {
    const before = (await db.query("select count(*)::int as n from public.audit_log")).rows[0].n;
    await asCommit("anna", "select public.admin_assign_role($1, $2)", [ID.omar, await roleId("employee")]);
    const has = await db.query("select 1 from public.user_roles where profile_id = $1 and role_id = $2", [ID.omar, await roleId("employee")]);
    assert.equal(has.rows.length, 1);
    const log = await db.query("select action, actor_profile_id from public.audit_log order by occurred_at desc limit 1");
    assert.equal(log.rows[0].action, "user.role_assigned");
    assert.equal(log.rows[0].actor_profile_id, ID.anna);
    assert.equal((await db.query("select count(*)::int as n from public.audit_log")).rows[0].n, before + 1);
    await asCommit("anna", "select public.admin_revoke_role($1, $2)", [ID.omar, await roleId("employee")]);
  });

  test("ingen kan ändra sina egna roller", async () => {
    await assert.rejects(
      as("anna", "select public.admin_revoke_role($1, $2)", [ID.anna, await roleId("system_admin")]),
      /egna roller/,
    );
  });

  test("användare utan users.manage nekas", async () => {
    await assert.rejects(
      as("johan", "select public.admin_assign_role($1, $2)", [ID.omar, await roleId("employee")]),
      /Behörighet saknas: users.manage/,
    );
  });

  test("kan inte dela ut behörigheter man själv saknar", async () => {
    // Egen roll med bara users.view + users.manage ges till Sara.
    const helper = await asCommit(
      "anna",
      "select public.admin_create_role('user_helper', 'Användarhjälp', '', array['users.view','users.manage']) as id",
    );
    await asCommit("anna", "select public.admin_assign_role($1, $2)", [ID.sara, helper.rows[0].id]);
    // Sara har nu users.manage men inte projects.create → får inte dela ut Projektledare.
    await assert.rejects(
      as("sara", "select public.admin_assign_role($1, $2)", [ID.omar, await roleId("project_manager")]),
      /behörigheter som du själv saknar/,
    );
    // Och får inte ändra en användare som har mer behörighet än hon själv.
    await assert.rejects(
      as("sara", "select public.admin_set_profile_status($1, 'inactive')", [ID.johan]),
      /behörigheter som du själv saknar/,
    );
  });

  test("endast systemadministratör kan dela ut Systemadministratör", async () => {
    await assert.rejects(
      as("sara", "select public.admin_assign_role($1, $2)", [ID.omar, await roleId("system_admin")]),
      /Endast en systemadministratör/,
    );
  });

  test("sista systemadministratören kan inte inaktiveras eller tas bort", async () => {
    await assert.rejects(as("anna", "select public.admin_set_profile_status($1, 'inactive')", [ID.anna]), /egna/);
    // Johan blir admin, Anna tar bort Johans admin → Anna finns kvar (tillåtet).
    await asCommit("anna", "select public.admin_assign_role($1, $2)", [ID.johan, await roleId("system_admin")]);
    await asCommit("anna", "select public.admin_revoke_role($1, $2)", [ID.johan, await roleId("system_admin")]);
    const { rows } = await db.query("select private.active_system_admin_count() as n");
    assert.equal(rows[0].n, 1);
  });

  test("bootstrap fungerar inte när en administratör redan finns", async () => {
    await assert.rejects(db.query("select private.bootstrap_system_admin('ny@demo.example', 'Ny')"), /redan en aktiv/);
  });
});

describe("rollhantering", () => {
  test("Systemadministratör-rollen är låst", async () => {
    await assert.rejects(
      as("anna", "select public.admin_update_role($1, 'Systemadministratör', '', array['dashboard.view'])", [await roleId("system_admin")]),
      /låst/,
    );
  });

  test("standardroller kan inte tas bort", async () => {
    await assert.rejects(as("anna", "select public.admin_delete_role($1)", [await roleId("read_only")]), /Standardrollen/);
  });

  test("tilldelad roll kan inte tas bort", async () => {
    await assert.rejects(as("anna", "select public.admin_delete_role($1)", [await roleId("user_helper")]), /tilldelad/);
  });

  test("kan inte utöka en roll man själv har", async () => {
    // Sara har rollen user_helper. Ge henne roles.manage via en separat roll.
    const rm = await asCommit("anna", "select public.admin_create_role('role_helper', 'Rollhjälp', '', array['roles.view','roles.manage']) as id");
    await asCommit("anna", "select public.admin_assign_role($1, $2)", [ID.sara, rm.rows[0].id]);
    await assert.rejects(
      as("sara", "select public.admin_update_role($1, 'Användarhjälp', '', array['users.view','users.manage','roles.view'])", [await roleId("user_helper")]),
      /roll som du själv har/,
    );
  });

  test("okända behörigheter avvisas", async () => {
    await assert.rejects(as("anna", "select public.admin_create_role('x_role', 'X', '', array['foo.bar'])"), /Okända behörigheter/);
  });

  test("egen roll kan skapas, ändras och tas bort med loggning", async () => {
    const { rows } = await asCommit("anna", "select public.admin_create_role('site_lead', 'Platschef', 'Test', array['dashboard.view']) as id");
    await asCommit("anna", "select public.admin_update_role($1, 'Platschef', 'Test', array['dashboard.view','projects.view'])", [rows[0].id]);
    const perms = await db.query("select private.role_permission_keys($1) as k", [rows[0].id]);
    assert.deepEqual(perms.rows[0].k, ["dashboard.view", "projects.view"]);
    await asCommit("anna", "select public.admin_delete_role($1)", [rows[0].id]);
    const actions = await db.query("select action from public.audit_log where target_id = $1 order by occurred_at", [rows[0].id]);
    assert.deepEqual(actions.rows.map((r) => r.action), ["role.created", "role.updated", "role.deleted"]);
  });
});

describe("aktivitetslogg", () => {
  test("kan inte ändras eller raderas, inte ens av databasägaren", async () => {
    await assert.rejects(db.query("update public.audit_log set summary = 'x'"), /kan inte ändras/);
    await assert.rejects(db.query("delete from public.audit_log"), /kan inte ändras/);
  });

  test("synlig för användare med audit.view", async () => {
    const { rows } = await as("anna", "select count(*)::int as n from public.audit_log");
    assert.ok(rows[0].n > 0);
  });
});
