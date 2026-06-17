import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "data", "hbw");
const DATASET_URL =
  "https://datadryad.org/dataset/doi:10.5061/dryad.70rxwdc6s";

async function tryFetch(label, url, page) {
  const resp = await page.request.get(url, { timeout: 600_000 });
  const ct = resp.headers()["content-type"] ?? "";
  const buf = await resp.body();
  console.log(`${label}: ${resp.status()} ${ct} ${(buf.length / 1024 / 1024).toFixed(2)} MB`);
  return { resp, buf };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(DATASET_URL, { waitUntil: "networkidle", timeout: 120_000 });
  await page.waitForTimeout(8000);

  const token = await page
    .locator('#zip_download input[name="authenticity_token"]')
    .getAttribute("value");

  const urls = [
    "https://datadryad.org/downloads/file_stream/4616501",
    "https://datadryad.org/api/v2/datasets/doi%3A10.5061/dryad.70rxwdc6s/download",
    "https://datadryad.org/downloads/zip_assembly_info/426674",
  ];

  for (const url of urls) {
    await tryFetch(url, url, page);
  }

  if (token) {
    console.log("POST zip download with token…");
    const resp = await page.request.post(
      "https://datadryad.org/dataset/downloadZip/doi_10_5061_dryad_70rxwdc6s__v20251210.zip",
      {
        form: { authenticity_token: token },
        timeout: 600_000,
      },
    );
    const buf = await resp.body();
    console.log(
      `POST zip: ${resp.status()} ${resp.headers()["content-type"]} ${(buf.length / 1024 / 1024).toFixed(2)} MB`,
    );
    if (buf.length > 1_000_000 && buf[0] === 0x50) {
      await writeFile(path.join(OUT_DIR, "Data_S1.zip"), buf);
      console.log("Saved zip from POST");
    }
  }

  await browser.close();
}

main().catch(console.error);
