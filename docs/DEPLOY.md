# Deploy to Firebase Hosting

Live URL: [https://birdpalette.web.app](https://birdpalette.web.app)

Every push to `main` builds a static site and deploys to Firebase Hosting via GitHub Actions.

## One-time setup (you do this once)

### 1. GitHub secret for Firebase deploy

The workflow needs your **birdpalette** service account JSON as a GitHub secret.

1. Open [GitHub → bird-palette → Settings → Secrets and variables → Actions](https://github.com/heymachineni/bird-palette/settings/secrets/actions)
2. Click **New repository secret**
3. Name: `FIREBASE_SERVICE_ACCOUNT_NATURE_COLORPALETTE` (same secret name as before)
4. Value: paste the **entire contents** of the **birdpalette** service account JSON from  
   Firebase Console → **birdpalette** → Project settings → Service accounts → **Generate new private key**  
   (Replace the old nature-colorpalette JSON — the name stays the same, the value must be for **birdpalette**.)
5. Click **Add secret** (or **Update** if it already exists)

You do **not** need a new secret name. Just update the existing secret’s value to the new project’s key.

### 2. Firebase Hosting (first deploy)

If Hosting isn’t enabled yet:

1. [Firebase Console](https://console.firebase.google.com) → **birdpalette**
2. **Build** → **Hosting** → **Get started**
3. You can skip the CLI wizard — GitHub Actions deploys for you

The default site URL is **birdpalette.web.app**.

### 3. Local `.env` (optional)

Copy `.env.example` → `.env` and set:

```bash
NEXT_PUBLIC_APP_URL="https://birdpalette.web.app"
FIREBASE_SERVICE_ACCOUNT_PATH="birdpalette-firebase-adminsdk.json"
```

Save the service account JSON in the project root (gitignored).

### 4. Trigger first deploy

Push to `main` (or re-run the workflow in GitHub → Actions):

```bash
git push origin main
```

Watch progress: GitHub → **Actions** → **Deploy to Firebase Hosting**

---

## How it works

```
git push origin main
       ↓
GitHub Actions
  npm ci
  npm run build:hosting   ← static export from dataset.json
       ↓
firebase deploy --only hosting --project birdpalette
       ↓
https://birdpalette.web.app
```

- **GitHub** = source code
- **Firestore** = optional bird database (`npm run seed:firestore`)
- **Static site** = built from `prisma/seed/dataset.json` at deploy time
- **Images** = BirdNET / iNaturalist URLs (no Storage needed for hosting)

After updating palettes locally:

```bash
npm run build:birds              # rebuild dataset + index
git add prisma/seed/dataset.json public/data/index.json
git commit -m "Update bird palettes"
git push origin main           # auto-deploys
```

---

## Manual deploy (optional)

```bash
npm install -g firebase-tools
firebase login
npm run deploy:hosting
```

Requires Firebase CLI logged in with access to **birdpalette**, or a service account JSON at `birdpalette-firebase-adminsdk.json`.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Action fails: missing secret | Update `FIREBASE_SERVICE_ACCOUNT_NATURE_COLORPALETTE` with birdpalette service account JSON |
| Action fails: permission denied | Service account needs **Firebase Hosting Admin** role in Google Cloud IAM |
| Site loads but no birds | Re-run build; ensure `dataset.json` is committed |
| Old content after push | Check Actions tab — rollout must finish with green check |
| Wrong project / URL | Confirm `.firebaserc` default is `birdpalette` and `firebase.json` site is `birdpalette` |
