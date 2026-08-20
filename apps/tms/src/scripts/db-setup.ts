import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function loadDotEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function main() {
  loadDotEnv();
  const { ensureReady } = await import("../lib/init");
  const { getDatabaseUrl, pool } = await import("../lib/db");
  await ensureReady();
  await pool().end();
  console.log(`MySQL ready at ${getDatabaseUrl()}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
