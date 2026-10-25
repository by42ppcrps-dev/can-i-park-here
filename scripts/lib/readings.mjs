// One live reading per photo, saved to test/accuracy/readings/ so the free AI quota
// is spent once. Both capture-samples.mjs and accuracy.mjs read from this cache.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { postPhoto } from "./post-photo.mjs";

export const READINGS_DIR = "test/accuracy/readings";

export async function getReading(file, photoPath, base, { refresh = false } = {}) {
  const cache = `${READINGS_DIR}/${file.replace(/\.jpg$/i, ".json")}`;
  if (!refresh && existsSync(cache)) return JSON.parse(await readFile(cache, "utf8"));
  await mkdir(READINGS_DIR, { recursive: true });
  const out = await postPhoto(photoPath, base);
  const saved = { ...out, readAt: new Date().toISOString() };
  await writeFile(cache, JSON.stringify(saved, null, 1) + "\n");
  return saved;
}
