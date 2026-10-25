// Posts one photo to a running /api/read and prints the checked reading.
// Usage: node scripts/lib/post-photo.mjs <photo.jpg> [base url]
import { readFile } from "node:fs/promises";

export async function postPhoto(path, base = "https://can-i-park-here.lumegridai.workers.dev") {
  const bytes = await readFile(path);
  const type = path.toLowerCase().endsWith(".png") ? "png" : "jpeg";
  const image = `data:image/${type};base64,${bytes.toString("base64")}`;
  const t0 = Date.now();
  const res = await fetch(`${base}/api/read`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ image }),
  });
  const body = await res.json().catch(() => ({ error: "not json" }));
  return { status: res.status, wallMs: Date.now() - t0, ...body };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = await postPhoto(process.argv[2], process.argv[3]);
  console.log(JSON.stringify(out, null, 2));
}
