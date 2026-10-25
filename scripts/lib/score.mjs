// Scoring for the accuracy run. Compares the engine's verdict on the AI reading with
// the engine's verdict on the hand-written expected reading, at fixed test times.
import { validateReading, DAYS, parseTime } from "../../public/js/engine/validate.js";
import { buildWeek, verdict, addDays, PER_DAY } from "../../public/js/engine/rules.js";

export function testIndex(t) {
  return DAYS.indexOf(t.day) * PER_DAY + parseTime(t.time) / 15;
}

// weekOf is the Monday ("YYYY-MM-DD") of the week the test times fall in, so
// rules with printed season dates are judged on real dates.
function verdictsFor(signs, side, times, stay, weekOf) {
  const week = buildWeek(signs, { side, weekStart: weekOf });
  const next = weekOf ? buildWeek(signs, { side, weekStart: addDays(weekOf, 7) }) : null;
  return times.map((t) => verdict(week, testIndex(t), stay, { next }).result);
}

// Expected verdicts: written directly, or the engine on the expected signs.
export function expectedVerdicts(photo, times, stay, weekOf = null) {
  if (photo.verdicts) return photo.verdicts;
  const checked = validateReading({ signs: photo.signs });
  return verdictsFor(checked.signs, photo.side, times, stay, weekOf);
}

// Actual verdicts from a saved reading: "yes" | "no" | "unsure" | "no_signs" | "failed".
export function actualVerdicts(reading, photo, times, stay, weekOf = null) {
  if (!reading || reading.error || !Array.isArray(reading.signs)) return times.map(() => "failed");
  if (!reading.signs.length) return times.map(() => "no_signs");
  return verdictsFor(reading.signs, photo.side, times, stay, weekOf);
}

// One check -> "right" | "unsure" | "wrongNo" | "wrongYes".
// A photo with no expected signs is right when the app says YES or finds no signs.
// When the app declines (no signs found, or the reading failed) it counts as Not sure.
export function classify(expected, actual, noRulesExpected = false) {
  if (actual === "no_signs") return noRulesExpected ? "right" : "unsure";
  if (actual === "failed") return "unsure";
  if (actual === expected) return "right";
  if (actual === "unsure") return "unsure";
  if (actual === "yes") return "wrongYes";
  return "wrongNo";
}
