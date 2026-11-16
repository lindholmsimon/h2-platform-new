// Tester för kopplingen mellan Microsoft-inloggning och profiler (migration 6).
// Kör: npm run test:db
import { PGlite } from "@electric-sql/pglite";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { before, describe, test } from "node:test";

const dir = new URL("..", import.meta.url).pathname;
const read = (p) => readFileSync(join(dir, p), "utf8");

const H2_TENANT = "11111111-1111-4111-8111-111111111111";
const OTHER_TENANT = "22222222-2222-4222-8222-222222222222";

let db;

/** Skapar en Supabase Auth-användare med en Microsoft-identitet (som Supabase Auth gör vid inloggning). */
async function microsoftUser({ email, name = "Test Person", tenant = H2_TENANT, oid = randomUUID(), confirmed = true, viaCustomClaims = false, provider = "azure" }) {
  const id = randomUUID();
  await db.query("insert into auth.users (id, email, email_confirmed_at) values ($1, $2, $3)", [
    id,
    email,
    confirmed ? new Date().toISOString() : null,
  ]);
  const identity = viaCustomClaims
    ? { email, name, custom_claims: { tid: tenant, oid } }
    : { email, name, iss: `https://login.microsoftonline.com/${tenant}/v2.0`, oid };
  await db.query(
    "insert into auth.identities (user_id, provider, provider_id, identity_data, email) values ($1, $2, $3, $4, $5)",
    [id, provider, randomUUID(), JSON.stringify(identity), email],
  );
  return { id, oid };
}

/** Kör SQL som inloggad användare (authenticated) och behåller ändringen. */
async function asUser(userId, sql, params = []) {
  return db.transaction(async (tx) => {
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [userId]);
    await tx.exec("set local role authenticated");
    return tx.query(sql, params);
  });
}

async function asRole(role, sql, params = []) {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${role}`);
    const res = await tx.query(sql, params);
    await tx.rollback();
    return res;
  });
}

const link = (userId) => asUser(userId, "select public.link_my_profile() as r").then((r) => r.rows[0].r);
const auditActions = async (profileId) =>
  (await db.query("select action from public.audit_log where target_id = $1 order by occurred_at", [profileId])).rows.map((r) => r.action);

before(async () => {
  db = new PGlite();
  await db.exec(read("tests/supabase-stub.sql"));
  for (const file of readdirSync(join(dir, "migrations")).sort()) {
    await db.exec(read(join("migrations", file)));
  }
});

describe("tillåten tenant", () => {
  test("ingen kan koppla en profil innan tenant är satt", async () => {
    const u = await microsoftUser({ email: "tidig@h2.example" });
    await assert.rejects(link(u.id), /inte konfigurerad/);
    const { rows } = await db.query("select count(*)::int as n from public.profiles");
    assert.equal(rows[0].n, 0);
  });

  test("API-rollerna kan inte sätta tenant eller läsa inställningen", async () => {
    for (const role of ["anon", "authenticated", "service_role"]) {
      await assert.rejects(asRole(role, `select private.set_allowed_entra_tenant('${OTHER_TENANT}')`), /permission denied/);
      await assert.rejects(asRole(role, "select * from private.auth_settings"), /permission denied/);
    }
  });

  test("databasägaren (SQL-editorn) sätter tenant och det loggas", async () => {
    await db.query("select private.set_allowed_entra_tenant($1)", [H2_TENANT]);
    const { rows } = await db.query("select action from public.audit_log where action = 'system.allowed_tenant_set'");
    assert.equal(rows.length, 1);
  });
});

describe("första inloggningen", () => {
  test("ny användare i H2:s tenant får en aktiv profil utan roller", async () => {
    const u = await microsoftUser({ email: "Ny.Person@H2.example", name: "Ny Person" });
    const r = await link(u.id);
    assert.equal(r.created, true);
    assert.equal(r.status, "active");
    const p = (await db.query("select * from public.profiles where id = $1", [r.profile_id])).rows[0];
    assert.equal(p.email, "ny.person@h2.example");
    assert.equal(p.display_name, "Ny Person");
    assert.equal(p.auth_user_id, u.id);
    assert.equal(p.entra_tenant_id, H2_TENANT);
    assert.equal(p.entra_object_id, u.oid);
    assert.equal((await db.query("select count(*)::int as n from public.user_roles where profile_id = $1", [p.id])).rows[0].n, 0);
    const access = await asUser(u.id, "select public.my_access() as a");
    assert.deepEqual(access.rows[0].a.permissions, []);
    assert.deepEqual(await auditActions(p.id), ["user.created"]);
  });

  test("nästa inloggning återanvänder profilen", async () => {
    const u = await microsoftUser({ email: "aterkommande@h2.example" });
    const first = await link(u.id);
    const second = await link(u.id);
    assert.equal(second.created, false);
    assert.equal(second.profile_id, first.profile_id);
    assert.deepEqual(await auditActions(first.profile_id), ["user.created"]);
  });

  test("tid och oid läses även från custom_claims", async () => {
    const u = await microsoftUser({ email: "claims@h2.example", viaCustomClaims: true });
    const r = await link(u.id);
    const p = (await db.query("select entra_tenant_id, entra_object_id from public.profiles where id = $1", [r.profile_id])).rows[0];
    assert.equal(p.entra_tenant_id, H2_TENANT);
    assert.equal(p.entra_object_id, u.oid);
  });
});

describe("nekade inloggningar", () => {
  test("konto från en annan tenant nekas och får ingen profil", async () => {
    const u = await microsoftUser({ email: "extern@annat.example", tenant: OTHER_TENANT });
    await assert.rejects(link(u.id), /tillhör inte H2:s organisation/);
    const { rows } = await db.query("select count(*)::int as n from public.profiles where email = 'extern@annat.example'");
    assert.equal(rows[0].n, 0);
  });

  test("inloggning utan Microsoft-identitet nekas", async () => {
    const u = await microsoftUser({ email: "losenord@h2.example", provider: "email" });
    await assert.rejects(link(u.id), /Endast inloggning med Microsoft-konto/);
  });

  test("ej inloggad och service_role kan inte anropa funktionen", async () => {
    await assert.rejects(asRole("anon", "select public.link_my_profile()"), /permission denied/);
    await assert.rejects(asRole("service_role", "select public.link_my_profile()"), /permission denied/);
  });
});

describe("koppling till förskapad profil", () => {
  test("första systemadministratören (bootstrap via e-post) kopplas vid inloggning och behåller rollen", async () => {
    const adminId = (await db.query("select private.bootstrap_system_admin('eric@h2.example', 'Eric Testsson') as id")).rows[0].id;
    const u = await microsoftUser({ email: "Eric@h2.example", name: "Eric Testsson" });
    const r = await link(u.id);
    assert.equal(r.profile_id, adminId);
    assert.equal(r.created, false);
    const access = await asUser(u.id, "select public.my_access() as a");
    assert.ok(access.rows[0].a.permissions.includes("users.manage"));
    assert.deepEqual(await auditActions(adminId), ["system.bootstrap_admin", "user.linked"]);
    const p = (await db.query("select entra_object_id from public.profiles where id = $1", [adminId])).rows[0];
    assert.equal(p.entra_object_id, u.oid);
  });

  test("profil med samma e-post kopplas inte om e-posten inte är bekräftad", async () => {
    await db.query("insert into public.profiles (email, display_name, status) values ('obekraftad@h2.example', 'Obekräftad', 'active')");
    const u = await microsoftUser({ email: "obekraftad@h2.example", confirmed: false });
    await assert.rejects(link(u.id), /inte bekräftad/);
  });

  test("en profil som redan tillhör en annan inloggning kan inte tas över", async () => {
    const first = await microsoftUser({ email: "upptagen@h2.example" });
    await link(first.id);
    const second = await microsoftUser({ email: "upptagen@h2.example" });
    await assert.rejects(link(second.id), /redan kopplad till en annan inloggning/);
  });

  test("en profil med en annan Microsoft-identitet kan inte tas över via e-post", async () => {
    await db.query(
      "insert into public.profiles (email, display_name, status, entra_tenant_id, entra_object_id) values ('fel-identitet@h2.example', 'X', 'active', $1, $2)",
      [H2_TENANT, randomUUID()],
    );
    const u = await microsoftUser({ email: "fel-identitet@h2.example" });
    await assert.rejects(link(u.id), /annan Microsoft-identitet/);
  });

  test("förskapad profil med samma tenant och object-ID kopplas", async () => {
    const oid = randomUUID();
    const pid = (
      await db.query(
        "insert into public.profiles (email, display_name, status, entra_tenant_id, entra_object_id) values ('ny-adress@h2.example', 'Byter Adress', 'invited', $1, $2) returning id",
        [H2_TENANT, oid],
      )
    ).rows[0].id;
    const u = await microsoftUser({ email: "annan-adress@h2.example", oid });
    const r = await link(u.id);
    assert.equal(r.profile_id, pid);
    assert.equal(r.status, "active");
  });

  test("inaktiverad profil kopplas men får inga behörigheter", async () => {
    const u = await microsoftUser({ email: "slutat@h2.example" });
    const r = await link(u.id);
    await db.query("update public.profiles set status = 'inactive' where id = $1", [r.profile_id]);
    const again = await link(u.id);
    assert.equal(again.status, "inactive");
    const access = await asUser(u.id, "select public.my_access() as a");
    assert.equal(access.rows[0].a, null);
  });
});

describe("my_roles", () => {
  test("returnerar bara den inloggades egna roller med behörigheter", async () => {
    const u = await microsoftUser({ email: "lasare@h2.example" });
    const r = await link(u.id);
    await db.query(
      "insert into public.user_roles (profile_id, role_id) select $1, id from public.roles where key = 'read_only'",
      [r.profile_id],
    );
    const { rows } = await asUser(u.id, "select public.my_roles() as roles");
    assert.equal(rows[0].roles.length, 1);
    assert.equal(rows[0].roles[0].key, "read_only");
    assert.deepEqual(rows[0].roles[0].permissions, ["dashboard.view", "projects.view"]);
  });

  test("anon och service_role kan inte anropa den", async () => {
    await assert.rejects(asRole("anon", "select public.my_roles()"), /permission denied/);
    await assert.rejects(asRole("service_role", "select public.my_roles()"), /permission denied/);
  });
});
