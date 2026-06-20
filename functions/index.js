const { onRequest } = require("firebase-functions/v2/https");

const ALLOWED_HOSTS = new Set([
  "birdnet.cornell.edu",
  "cdn.download.ams.birds.cornell.edu",
  "inaturalist-open-data.s3.amazonaws.com",
  "static.inaturalist.org",
  "upload.wikimedia.org",
  "commons.wikimedia.org",
]);

/** Proxies remote bird photos so the client canvas can sample pixels in production. */
exports.photoSample = onRequest(
  {
    region: "us-central1",
    cors: true,
    invoker: "public",
    maxInstances: 10,
    memory: "256MiB",
  },
  async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "GET") {
      res.status(405).send("Method not allowed");
      return;
    }

    const raw = req.query.url;
    const url = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";
    if (!url) {
      res.status(400).json({ error: "missing url" });
      return;
    }

    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      res.status(400).json({ error: "invalid url" });
      return;
    }

    if (parsed.protocol !== "https:" || !ALLOWED_HOSTS.has(parsed.hostname)) {
      res.status(403).json({ error: "host not allowed" });
      return;
    }

    try {
      const upstream = await fetch(parsed.toString(), {
        headers: { Accept: "image/*" },
      });
      if (!upstream.ok) {
        res.status(upstream.status).send("");
        return;
      }

      const body = Buffer.from(await upstream.arrayBuffer());
      const contentType = upstream.headers.get("content-type") ?? "image/jpeg";

      res.set("Content-Type", contentType);
      res.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
      res.status(200).send(body);
    } catch {
      res.status(502).send("");
    }
  },
);
