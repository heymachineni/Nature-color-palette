import { access, mkdir, readFile } from "node:fs/promises";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = path.join(process.cwd(), "data", "hbw");
export const HBW_ZIP = path.join(ROOT, "Data_S1.zip");
export const EXTRACT_DIR = path.join(ROOT, "extracted");

export const FILES = {
  proportions:
    "Information_for_Illustrations_and_proportion_of_24_colors.csv",
  colorGroups: "RGB_values_for_color_classification.csv",
} as const;

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

function isValidZip(p: string): boolean {
  if (!existsSync(p)) return false;
  const head = readFileSync(p).slice(0, 4);
  return head[0] === 0x50 && head[1] === 0x4b; // PK..
}

/** Walk data/hbw for an extracted Dryad folder or Data_S1 contents. */
function findExtractedCsvPair(): { root: string } | null {
  if (!existsSync(ROOT)) return null;

  const candidates: string[] = [];

  const tryDir = (dir: string) => {
    const props = path.join(dir, FILES.proportions);
    const groups = path.join(dir, FILES.colorGroups);
    if (existsSync(props) && existsSync(groups)) {
      candidates.push(dir);
    }
  };

  // Direct paths (user download layout)
  for (const name of readdirSync(ROOT)) {
    const p = path.join(ROOT, name);
    if (!existsSync(p)) continue;
    tryDir(p);
    tryDir(path.join(p, "Data_S1"));
    if (name.startsWith("doi_")) {
      tryDir(path.join(p, "Data_S1"));
    }
  }

  tryDir(EXTRACT_DIR);

  if (candidates.length === 0) return null;

  // Prefer the largest proportions file (full dataset over fixture)
  let best = candidates[0];
  let bestSize = 0;
  for (const dir of candidates) {
    const size = readFileSync(path.join(dir, FILES.proportions)).length;
    if (size > bestSize) {
      bestSize = size;
      best = dir;
    }
  }

  return { root: best };
}

export async function ensureHbwExtracted(opts?: {
  useFixture?: boolean;
}): Promise<{
  root: string;
  proportionsPath: string;
  colorGroupsPath: string;
}> {
  const useFixture =
    opts?.useFixture ?? process.env.HBW_USE_FIXTURE === "true";

  if (useFixture) {
    const fixtureRoot = path.join(ROOT, "fixture");
    const fixtureProps = path.join(fixtureRoot, FILES.proportions);
    if (await exists(fixtureProps)) {
      return {
        root: fixtureRoot,
        proportionsPath: fixtureProps,
        colorGroupsPath: path.join(fixtureRoot, FILES.colorGroups),
      };
    }
  }

  const envDir = process.env.HBW_DATA_DIR?.trim();
  if (envDir) {
    const props = path.join(envDir, FILES.proportions);
    const groups = path.join(envDir, FILES.colorGroups);
    if (await exists(props) && await exists(groups)) {
      return { root: envDir, proportionsPath: props, colorGroupsPath: groups };
    }
    const nested = path.join(envDir, "Data_S1");
    const nestedProps = path.join(nested, FILES.proportions);
    if (await exists(nestedProps)) {
      return {
        root: nested,
        proportionsPath: nestedProps,
        colorGroupsPath: path.join(nested, FILES.colorGroups),
      };
    }
  }

  const found = findExtractedCsvPair();
  if (found) {
    return {
      root: found.root,
      proportionsPath: path.join(found.root, FILES.proportions),
      colorGroupsPath: path.join(found.root, FILES.colorGroups),
    };
  }

  if (!isValidZip(HBW_ZIP)) {
    throw new Error(
      `HBW dataset not found.\n\n` +
        `Place the Dryad download under data/hbw/ (e.g.\n` +
        `  data/hbw/doi_10_5061_dryad_70rxwdc6s__v20251210/Data_S1/)\n` +
        `or set HBW_DATA_DIR to that folder.\n\n` +
        `Download: https://doi.org/10.5061/dryad.70rxwdc6s`,
    );
  }

  const propsPath = path.join(EXTRACT_DIR, FILES.proportions);
  if (await exists(propsPath)) {
    return {
      root: EXTRACT_DIR,
      proportionsPath: propsPath,
      colorGroupsPath: path.join(EXTRACT_DIR, FILES.colorGroups),
    };
  }

  await mkdir(EXTRACT_DIR, { recursive: true });
  console.log(`Extracting ${HBW_ZIP}…`);
  execFileSync(`unzip -o -q "${HBW_ZIP}" -d "${EXTRACT_DIR}"`, {
    stdio: "inherit",
  });

  if (!(await exists(propsPath))) {
    throw new Error(`Expected CSV missing after extract: ${propsPath}`);
  }

  return {
    root: EXTRACT_DIR,
    proportionsPath: propsPath,
    colorGroupsPath: path.join(EXTRACT_DIR, FILES.colorGroups),
  };
}

export async function readText(p: string): Promise<string> {
  return readFile(p, "utf-8");
}
