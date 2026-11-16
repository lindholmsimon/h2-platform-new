import assert from "node:assert/strict";
import { test } from "node:test";

import { safeNextPath } from "../../src/lib/auth/safe-redirect.ts";

test("tillåter interna sökvägar", () => {
  assert.equal(safeNextPath("/projekt/p-1001"), "/projekt/p-1001");
  assert.equal(safeNextPath("/administration/anvandare?flik=roller"), "/administration/anvandare?flik=roller");
});

test("avvisar externa och manipulerade adresser", () => {
  for (const bad of [
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "\\\\evil.example",
    "/redirect?to=https://evil.example",
    "javascript:alert(1)",
    "evil.example",
    "/\u0000x",
    "",
    null,
    undefined,
    42,
  ]) {
    assert.equal(safeNextPath(bad), "/", String(bad));
  }
});

test("skickar inte tillbaka till inloggningen", () => {
  assert.equal(safeNextPath("/logga-in"), "/");
  assert.equal(safeNextPath("/auth/callback?code=x"), "/");
});
