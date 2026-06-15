import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App | undefined;
let db: Firestore | undefined;

function serviceAccountPath(): string | null {
  const configured = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!configured) return null;
  return path.isAbsolute(configured)
    ? configured
    : path.join(process.cwd(), configured);
}

export function isFirestoreConfigured(): boolean {
  const saPath = serviceAccountPath();
  if (saPath && existsSync(saPath)) return true;

  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY,
  );
}

function initApp(): App {
  const saPath = serviceAccountPath();
  if (saPath && existsSync(saPath)) {
    const serviceAccount = JSON.parse(readFileSync(saPath, "utf-8"));
    return initializeApp({ credential: cert(serviceAccount) });
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n");
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey,
    }),
  });
}

export function getAdminFirestore(): Firestore {
  if (db) return db;

  if (!isFirestoreConfigured()) {
    throw new Error(
      "Firestore is not configured. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY in .env",
    );
  }

  if (!getApps().length) {
    app = initApp();
  }

  db = getFirestore();
  return db;
}
