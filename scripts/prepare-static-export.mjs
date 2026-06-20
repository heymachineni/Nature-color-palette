/**
 * Next.js static export cannot include App Router API routes.
 * Temporarily move src/app/api aside for hosting builds, restore after.
 */
import { existsSync, renameSync } from "node:fs";
import path from "node:path";

const apiDir = path.join(process.cwd(), "src", "app", "api");
const backupDir = path.join(process.cwd(), "src", "app", "_api_static_export_bak");

const action = process.argv[2];

if (action === "hide") {
  if (existsSync(apiDir) && !existsSync(backupDir)) {
    renameSync(apiDir, backupDir);
    console.log("→ Moved src/app/api aside for static export");
  }
} else if (action === "restore") {
  if (existsSync(backupDir) && !existsSync(apiDir)) {
    renameSync(backupDir, apiDir);
    console.log("→ Restored src/app/api after static export");
  }
} else {
  console.error("Usage: node scripts/prepare-static-export.mjs hide|restore");
  process.exit(1);
}
