import { randomBytes } from "crypto";

function generateSecret(bytes = 32): string {
    return randomBytes(bytes).toString("base64");
}

const shouldWrite = process.argv.includes("--write");
const secret = generateSecret(32);

const line = `BETTER_AUTH_SECRET=${secret}`;

if (!shouldWrite) {
    console.log(line);
    console.log("Tip: run with `--write` to append to `packages/backend/.env` (local only).");
    process.exit(0);
}

const envPath = new URL("../.env", import.meta.url);
let existing = "";
try {
    existing = await Bun.file(envPath).text();
} catch {
    existing = "";
}

if (existing.includes("BETTER_AUTH_SECRET=") || existing.includes("AUTH_SECRET=")) {
    console.error("Refusing to write: `BETTER_AUTH_SECRET`/`AUTH_SECRET` already present in `packages/backend/.env`.");
    process.exit(1);
}

const next = (existing.trimEnd() ? existing.trimEnd() + "\n" : "") + line + "\n";
await Bun.write(envPath, next);
console.log(`Wrote ${line.split("=")[0]} to packages/backend/.env`);

