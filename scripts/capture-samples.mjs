// Sample poles: reads each candidate in test/samples/poles.json with the live reader
// (once; readings are cached), and keeps the ones whose verdicts match the hand answer
// at every test time. Saved readings are real model output after validateReading();
// never hand-edited. Poles from the accuracy set share the accuracy run's cached reading.
// Usage: node scripts/capture-samples.mjs [base url] [--save]
// Images are resized separately (long side 960 px, 360 by 480 thumbnail).
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { getReading } from "./lib/readings.mjs";
import { expectedVerdicts, actualVerdicts } from "./lib/score.mjs";
import { validateReading } from "../public/js/engine/validate.js";

const base = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "https://can-i-park-here.lumegridai.workers.dev";
const save = process.argv.includes("--save");

const spec = JSON.parse(await readFile("test/samples/poles.json", "utf8"));
const expected = JSON.parse(await readFile("test/accuracy/expected.json", "utf8"));
const credits = JSON.parse(await readFile("test/accuracy/credits.json", "utf8"));
const times = [...expected.testTimes, ...spec.extraTimes];
const stay = expected.stayMinutes;

const results = [];
for (const pole of spec.poles) {
  const file = `${pole.id}.jpg`;
  let hand;
  let reading;
  let credit;
  if (pole.fromAccuracy) {
    hand = expected.photos.find((p) => p.file === file);
    reading = await getReading(file, `test/accuracy/photos/${file}`, base);
    const { file: _f, city: _c, ...c } = credits.find((x) => x.file === file);
    credit = c;
  } else {
    hand = pole;
    reading = await getReading(file, pole.photo, base, { dir: "test/samples/readings" });
    credit = pole.credit;
  }
  const want = expectedVerdicts(hand, times, stay, spec.weekOf);
  const got = actualVerdicts(reading, hand, times, stay, spec.weekOf);
  const match = want.every((v, i) => v === got[i]);
  results.push({ pole, match, reading, credit });
  console.log(`${pole.id.padEnd(5)} ${match ? "MATCH" : "differs"}  want ${want.join(" ")}  got ${got.join(" ")}  (${reading.model || reading.error}, ${reading.ms ?? "?"} ms)`);
  for (const s of reading.signs || []) console.log(`   ${s.id}. [${s.arrow}] ${s.text}${s.readable ? "" : "  NOT SURE: " + s.problem}`);
}

if (save) {
  await mkdir("public/samples", { recursive: true });
  const out = [];
  for (const { pole, match, reading, credit } of results) {
    if (!match) continue;
    const checked = validateReading({ signs: reading.signs });
    await writeFile(`public/samples/${pole.id}.json`, JSON.stringify({ signs: checked.signs, model: reading.model, readAt: reading.readAt, source: "Saved live reading, not edited" }, null, 1) + "\n");
    out.push({
      id: pole.id, image: `/samples/${pole.id}.jpg`, thumb: `/samples/${pole.id}-thumb.jpg`, reading: `/samples/${pole.id}.json`,
      signCount: checked.signs.length, ...credit, name: pole.name, place: pole.place,
    });
  }
  await writeFile("public/samples/credits.json", JSON.stringify(out, null, 1) + "\n");
  console.log(`saved ${out.map((x) => x.id).join(", ")}`);
}
