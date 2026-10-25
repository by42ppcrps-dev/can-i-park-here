// One-time: read candidate sample poles with the live reader, keep the ones whose
// verdicts match the expected answers at every test time, and save them as samples.
// Saved readings are real model output after validateReading(); never hand-edited.
// Usage: node scripts/capture-samples.mjs [base url] [--pick p23,p355,p329]
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { getReading } from "./lib/readings.mjs";
import { expectedVerdicts, actualVerdicts } from "./lib/score.mjs";
import { validateReading } from "../public/js/engine/validate.js";

const base = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "https://can-i-park-here.lumegridai.workers.dev";
const pickArg = process.argv.find((a) => a.startsWith("--pick="));
const CANDIDATES = ["p329.jpg", "p238.jpg", "p23.jpg", "p355.jpg", "p110.jpg", "p241.jpg", "p291.jpg", "p356.jpg"];

const expected = JSON.parse(await readFile("test/accuracy/expected.json", "utf8"));
const credits = JSON.parse(await readFile("test/accuracy/credits.json", "utf8"));

const results = [];
for (const file of CANDIDATES) {
  const photo = expected.photos.find((p) => p.file === file);
  const reading = await getReading(file, `test/accuracy/photos/${file}`, base);
  const want = expectedVerdicts(photo, expected.testTimes, expected.stayMinutes);
  const got = actualVerdicts(reading, photo, expected.testTimes, expected.stayMinutes);
  const match = want.every((v, i) => v === got[i]);
  results.push({ file, match, want, got, reading });
  console.log(`${file.padEnd(9)} ${match ? "MATCH" : "differs"}  want ${want.join(" ")}  got ${got.join(" ")}  (${reading.model || reading.error}, ${reading.ms ?? "?"} ms)`);
  for (const s of reading.signs || []) console.log(`   ${s.id}. [${s.arrow}] ${s.text}${s.readable ? "" : "  NOT SURE: " + s.problem}`);
}

if (pickArg) {
  const picks = pickArg.slice(7).split(",");
  await mkdir("public/samples", { recursive: true });
  const out = [];
  for (const id of picks) {
    const r = results.find((x) => x.file === `${id}.jpg`);
    if (!r || !r.match) throw new Error(`${id} is not a matching candidate`);
    const checked = validateReading({ signs: r.reading.signs });
    await writeFile(`public/samples/${id}.json`, JSON.stringify({ signs: checked.signs, model: r.reading.model, readAt: r.reading.readAt, source: "Saved live reading, not edited" }, null, 1) + "\n");
    const c = credits.find((x) => x.file === r.file);
    out.push({ id, image: `/samples/${id}.jpg`, thumb: `/samples/${id}-thumb.jpg`, reading: `/samples/${id}.json`, signCount: checked.signs.length, ...c });
  }
  await writeFile("public/samples/credits.json.tmp", JSON.stringify(out, null, 1) + "\n");
  console.log(`saved ${picks.join(", ")}; add names and places, then rename credits.json.tmp`);
}
