/**
 * Upload bird documents from dataset.json → Firestore.
 * Images stay in public/birds/ (no Firebase Storage required).
 *
 * Prerequisites:
 *   1. Firestore enabled in Firebase console (project: nature-colorpalette)
 *   2. Service account key in .env (see .env.example)
 *
 * Run:  npm run seed:firestore
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { getAdminFirestore, isFirestoreConfigured } from "../src/lib/firebase/admin";

function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile();

async function main() {
  if (!isFirestoreConfigured()) {
    console.error(`
Firestore credentials missing.

Add to .env:
  FIREBASE_SERVICE_ACCOUNT_PATH="your-service-account.json"

Images remain at /birds/*.webp in this app — Storage upgrade not required.
`);
    process.exit(1);
  }

  const file = path.join(process.cwd(), "prisma", "seed", "dataset.json");
  const { birds } = JSON.parse(readFileSync(file, "utf-8")) as {
    birds: Record<string, unknown>[];
  };

  const db = getAdminFirestore();
  const batchSize = 400;
  let written = 0;

  console.log(`\nUploading ${birds.length} birds to Firestore…\n`);

  for (let i = 0; i < birds.length; i += batchSize) {
    const batch = db.batch();
    const chunk = birds.slice(i, i + batchSize);
    for (const bird of chunk) {
      const slug = bird.slug as string;
      batch.set(db.collection("birds").doc(slug), bird, { merge: true });
    }
    await batch.commit();
    written += chunk.length;
    console.log(`  ✓ ${written}/${birds.length}`);
  }

  console.log(`\n✓ Firestore seed complete (${written} documents in "birds" collection)\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
