import type { NextConfig } from "next";

/**
 * Stoppa bygget om en hemlig nyckel har hamnat i en NEXT_PUBLIC_-variabel.
 * Sådana variabler bäddas in i JavaScript som skickas till webbläsaren.
 */
function assertNoSecretsInPublicEnv() {
  for (const [name, value] of Object.entries(process.env)) {
    if (!name.startsWith("NEXT_PUBLIC_") || !value) continue;
    const looksSecretByName = /SERVICE_ROLE|SECRET|PRIVATE/i.test(name);
    const looksSecretByValue = value.startsWith("sb_secret_") || isServiceRoleJwt(value);
    if (looksSecretByName || looksSecretByValue) {
      throw new Error(
        `Säkerhetsstopp: ${name} ser ut att innehålla en hemlig nyckel. ` +
          "Hemliga nycklar får aldrig ha prefixet NEXT_PUBLIC_.",
      );
    }
  }
}

function isServiceRoleJwt(value: string) {
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return payload?.role === "service_role";
  } catch {
    return false;
  }
}

assertNoSecretsInPublicEnv();

const nextConfig: NextConfig = {
  poweredByHeader: false,
};

export default nextConfig;
