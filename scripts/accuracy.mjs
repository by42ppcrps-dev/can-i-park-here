// Accuracy run: reads every test photo with the live reader (once; readings are cached),
// compares verdicts at fixed test times with the expected answers, and writes
// public/data/accuracy.json (real counts only) and test/accuracy/report.md.
// Usage: node scripts/accuracy.mjs [base url] [--refresh] [--only=p23,p355] [--version=<worker version>]
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { getReading } from "./lib/readings.mjs";
import { expectedVerdicts, actualVerdicts, classify } from "./lib/score.mjs";
import { describeRule } from "../public/js/engine/describe.js";

const args = process.argv.slice(2);
const base = args.find((a) => !a.startsWith("--")) || "https://park.trylumegrid.com";
const refresh = args.includes("--refresh");
const only = (args.find((a) => a.startsWith("--only=")) || "").slice(7).split(",").filter(Boolean);
const version = (args.find((a) => a.startsWith("--version=")) || "").slice(10) || null;

const expected = JSON.parse(await readFile("test/accuracy/expected.json", "utf8"));
const credits = JSON.parse(await readFile("test/accuracy/credits.json", "utf8"));
const { testTimes, stayMinutes, weekOf } = expected;

const counts = { right: 0, unsure: 0, wrongNo: 0, wrongYes: 0 };
const rows = [];
const models = {};
let neurons = 0;
let ms = 0;
let live = 0;

for (const photo of expected.photos) {
  const id = photo.file.replace(/\.jpg$/, "");
  const reading = await getReading(photo.file, `test/accuracy/photos/${photo.file}`, base, { refresh: refresh && (!only.length || only.includes(id)) });
  if (reading.model) models[reading.model] = (models[reading.model] || 0) + 1;
  if (reading.usage && reading.usage.neurons) { neurons += reading.usage.neurons; live++; }
  if (reading.ms) ms += reading.ms;
  const want = expectedVerdicts(photo, testTimes, stayMinutes, weekOf);
  const got = actualVerdicts(reading, photo, testTimes, stayMinutes, weekOf);
  const noRules = Array.isArray(photo.signs) && photo.signs.length === 0;
  const result = want.map((w, i) => classify(w, got[i], noRules));
  result.forEach((r) => counts[r]++);
  rows.push({ photo, reading, want, got, result });
  console.log(`${photo.file.padEnd(9)} want ${want.join(" ").padEnd(24)} got ${got.join(" ").padEnd(30)} ${result.join(" ")}`);
}

const checks = rows.length * testTimes.length;
// The run date is the date of the newest live reading, in local time.
const newest = new Date(Math.max(...rows.map((r) => Date.parse(r.reading.readAt) || 0)));
const date = `${newest.getFullYear()}-${String(newest.getMonth() + 1).padStart(2, "0")}-${String(newest.getDate()).padStart(2, "0")}`;
const summary = {
  date,
  photos: rows.length,
  checks,
  stayMinutes,
  testTimes: testTimes.map((t) => t.label),
  ...counts,
  models,
  workerVersion: version,
  averageNeuronsPerReading: live ? Math.round(neurons / live) : null,
  averageSecondsPerReading: rows.length ? Math.round(ms / rows.length / 100) / 10 : null,
};
await mkdir("public/data", { recursive: true });
await writeFile("public/data/accuracy.json", JSON.stringify(summary, null, 1) + "\n");

const WORD = { right: "right", unsure: "Not sure", wrongNo: "WRONG NO", wrongYes: "WRONG YES" };
const md = [];
md.push("# Accuracy report", "");
md.push(`Run ${date} against ${base}${version ? ` (Worker version ${version})` : ""}.`);
md.push(`${rows.length} photos, ${testTimes.length} test times each (${testTimes.map((t) => t.label).join(", ")}), ${stayMinutes} minute stay: ${checks} checks.`, "");
md.push(`| Right | Not sure | Wrong NO | Wrong YES |`, `|---|---|---|---|`, `| ${counts.right} | ${counts.unsure} | ${counts.wrongNo} | ${counts.wrongYes} |`, "");
md.push("How a check is scored: the expected verdict is the rules engine's answer on a hand-written reading of the photo (`expected.json`); the actual verdict is the same engine on the live reading. Same verdict is right. The app saying Not sure, finding no signs, or failing to read counts as Not sure. Any other YES is a wrong YES; any other NO is a wrong NO. For photos with arrows, the car's side is set as listed in `expected.json`.", "");
md.push("Prompt and validator changes made after reading the ground truth and before this run, all general and all making answers stricter or skipping signs that never restrict an everyday driver: skip angle parking signs and exemption panels; arrows judged by the arrowhead; conditions such as snow, school days, events, months, and \"when\" make a rule Not sure; a sign whose arrow points away from the car is Not sure instead of ignored.", "");
md.push("Revision round 1 (after hands-on feedback): rules may carry printed season dates (checked against the sign text) and a large vehicles only flag (trusted only when the text names big vehicles); signs cut off by the photo edge are reported as unreadable; test times are dated (week of Mon Oct 19, 2026) so season dates are judged on real dates; `expected.json` changed only for p23, whose street cleaning sign prints APRIL 1-OCT 31. The first rerun of all 26 photos had 3 wrong YES on p280 (hours that run to sunset). Two stricter changes followed: sunrise, sunset, dusk, and dawn make a rule Not sure, and a sign that only says when parking is allowed is Not sure at all other times. Only p280 was read again; the second change is in the rules engine, so it needed no new reading.", "");
for (const { photo, reading, want, got, result } of rows) {
  const c = credits.find((x) => x.file === photo.file);
  md.push(`## ${photo.file} (${c.city})`, "");
  md.push(`Photo: [${c.title}](${c.page}) by ${c.artist}, ${c.license}.${photo.side ? ` Car side: ${photo.side}.` : ""}`);
  if (photo.note) md.push(`Note: ${photo.note}`);
  md.push("");
  md.push("| Time | Expected | Live reading | Result |", "|---|---|---|---|");
  testTimes.forEach((t, i) => md.push(`| ${t.label} | ${want[i]} | ${got[i]} | ${WORD[result[i]]} |`));
  md.push("", reading.error ? `Live reading failed: ${reading.error}.` : `Live reading (${reading.model}, ${reading.ms} ms):`);
  for (const s of reading.signs || []) {
    const what = s.readable ? s.rules.map(describeRule).join("; ") : `Not sure: ${s.problem}`;
    md.push(`- ${s.id}. ${s.text}${s.arrow !== "none" ? ` (arrow ${s.arrow})` : ""}: ${what}`);
  }
  if (reading.signs && !reading.signs.length) md.push("- No signs found.");
  md.push("");
}
await writeFile("test/accuracy/report.md", md.join("\n"));
console.log(JSON.stringify(summary, null, 1));
