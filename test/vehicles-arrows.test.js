import { test } from "node:test";
import assert from "node:assert/strict";
import { buildWeek, verdict, withArrows, nextArrow, ARROW_CYCLE, PER_DAY } from "../public/js/engine/rules.js";
import { validateReading, largeVehicleSign, DAYS } from "../public/js/engine/validate.js";
import { describeRule, describeSign, describeVerdict, LARGE_ONLY_TEXT } from "../public/js/engine/describe.js";

function signs(...list) {
  const r = validateReading({ signs: list.map((s) => ({ arrow: "none", readable: true, text: "SIGN", ...s })) });
  assert.equal(r.ok, true);
  return r.signs;
}
const rule = (kind, days, start, end, extra = {}) => ({ kind, days, start, end, ...extra });
const at = (day, hh, mm = 0) => DAYS.indexOf(day) * PER_DAY + (hh * 60 + mm) / 15;
const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri"];

// The Los Angeles County pole (p63).
const weekdayBan = { text: "NO PARKING 9AM-5PM MON.-FRI. EXCEPT HOLIDAYS", rules: [rule("no_parking", WEEKDAYS, "09:00", "17:00")] };
const oversize = {
  text: "NO PARKING 1AM TO 6AM VEHICLES OVER 8' WIDE 7 1/2' HIGH 20' LONG RV PERMITS EXEMPT",
  rules: [rule("no_parking", DAYS, "01:00", "06:00", { largeOnly: true })],
};

test("which sign text counts as large vehicles only", () => {
  assert.equal(largeVehicleSign(oversize.text), true);
  assert.equal(largeVehicleSign("NO TRUCKS OVER 5 TONS"), true);
  assert.equal(largeVehicleSign("NO RV OR TRAILER PARKING"), true);
  assert.equal(largeVehicleSign("NO COMMERCIAL VEHICLES 2AM-6AM"), true);
  // These restrict a regular car.
  assert.equal(largeVehicleSign("NO PARKING OVER 2 HOURS"), false);
  assert.equal(largeVehicleSign("TRUCK LOADING ONLY"), false);
  assert.equal(largeVehicleSign("NO PARKING EXCEPT COMMERCIAL VEHICLES"), false);
  assert.equal(largeVehicleSign("NO PARKING BUS STOP"), false);
  assert.equal(largeVehicleSign("NO PARKING ANYTIME"), false);
});

test("an oversize rule stays on its card but is out of the verdict and the grid", () => {
  const s = signs(weekdayBan, oversize);
  assert.equal(s.length, 2);
  assert.equal(s[1].readable, true);
  assert.equal(s[1].rules[0].largeOnly, true);
  const w = buildWeek(s);
  assert.equal(w[at("sun", 3)].state, "free");
  assert.equal(w[at("sun", 3)].causes.length, 0);
  assert.equal(verdict(w, at("sun", 3), 60).result, "yes");
  assert.equal(verdict(w, at("mon", 9), 60).result, "no");
  assert.equal(describeRule(s[1].rules[0]), LARGE_ONLY_TEXT);
  assert.equal(describeSign(s[1]), "Only for oversized vehicles, not a regular car");
});

test("p63 hand answers at every test time", () => {
  const w = buildWeek(signs(weekdayBan, oversize), { weekStart: "2026-10-19" });
  const got = [at("mon", 9), at("tue", 8, 45), at("sat", 14), at("sun", 3), at("fri", 8), at("mon", 10)].map((i) => verdict(w, i, 60).result);
  assert.deepEqual(got, ["no", "no", "yes", "yes", "yes", "no"]);
});

test("largeOnly is ignored when the sign text doesn't name big vehicles", () => {
  const [s] = signs({ text: "NO PARKING 1AM TO 6AM", rules: [rule("no_parking", DAYS, "01:00", "06:00", { largeOnly: true })] });
  assert.equal(s.rules[0].largeOnly, false);
  assert.equal(verdict(buildWeek([s]), at("sun", 3), 60).result, "no");
  const [loading] = signs({ text: "TRUCK LOADING ONLY 7AM-6PM", rules: [rule("commercial_only", DAYS, "07:00", "18:00", { largeOnly: true })] });
  assert.equal(loading.rules[0].largeOnly, false);
});

test("arrows cycle left, right, both ways, none", () => {
  assert.deepEqual(ARROW_CYCLE, ["left", "right", "both", "none"]);
  assert.equal(nextArrow("left"), "right");
  assert.equal(nextArrow("right"), "both");
  assert.equal(nextArrow("both"), "none");
  assert.equal(nextArrow("none"), "left");
});

// Chicago p23: the reader often gets this arrow backwards.
const cleaning = { text: "STREET CLEANING NO PARKING 7AM-9AM FRIDAYS", rules: [rule("no_parking", ["fri"], "07:00", "09:00")] };
const twoHourRight = { text: "TWO HOUR PARKING 9AM-10PM MON-SAT", arrow: "right", rules: [rule("time_limit", ["mon", "tue", "wed", "thu", "fri", "sat"], "09:00", "22:00", { limitMinutes: 120 })] };

test("withArrows applies the driver's fixes without touching the reading", () => {
  const read = signs(cleaning, twoHourRight);
  const fixed = withArrows(read, new Map([[2, "left"]]));
  assert.equal(read[1].arrow, "right");
  assert.equal(read[1].arrowChecked, undefined);
  assert.equal(fixed[1].arrow, "left");
  assert.equal(fixed[1].arrowChecked, true);
  assert.equal(fixed[0], read[0]);
  assert.equal(withArrows(read, new Map()), read);
});

test("a misread arrow is Not sure; fixing it updates the answer at once", () => {
  const read = signs(cleaning, twoHourRight);
  // Car on the left, sign read as pointing right: Not sure, check the arrow.
  const before = verdict(buildWeek(read, { side: "left" }), at("mon", 10), 60);
  assert.equal(before.result, "unsure");
  assert.equal(describeVerdict(before, read, at("mon", 10)).line, "NOT SURE: check the arrow on sign 2");
  // Fixed to left: the 2 hour limit applies to the car.
  const left = withArrows(read, new Map([[2, "left"]]));
  const after = verdict(buildWeek(left, { side: "left" }), at("mon", 10), 60);
  assert.equal(after.result, "yes");
  assert.equal(after.limitMinutes, 120);
  assert.equal(verdict(buildWeek(left, { side: "left" }), at("mon", 10), 180).result, "no");
});

test("a checked arrow pointing away from the car no longer counts", () => {
  const ban = { text: "NO PARKING ANYTIME", arrow: "left", rules: [rule("no_parking", DAYS, "00:00", "24:00")] };
  const read = signs(ban);
  assert.equal(verdict(buildWeek(read, { side: "right" }), at("mon", 10), 60).result, "unsure");
  const checked = withArrows(read, new Map([[1, "left"]]));
  assert.equal(verdict(buildWeek(checked, { side: "right" }), at("mon", 10), 60).result, "yes");
  assert.equal(verdict(buildWeek(checked, { side: "left" }), at("mon", 10), 60).result, "no");
});

test("fixing an arrow to both ways or none makes the sign apply to either side", () => {
  const ban = { text: "NO PARKING ANYTIME", arrow: "left", rules: [rule("no_parking", DAYS, "00:00", "24:00")] };
  for (const arrow of ["both", "none"]) {
    const s = withArrows(signs(ban), new Map([[1, arrow]]));
    assert.equal(verdict(buildWeek(s, { side: "right" }), at("mon", 10), 60).result, "no");
    assert.equal(verdict(buildWeek(s, { side: null }), at("mon", 10), 60).result, "no");
  }
});

test("a single arrow with no side chosen stays Not sure until the side is set", () => {
  const s = withArrows(signs(cleaning, { ...twoHourRight, arrow: "none" }), new Map([[2, "right"]]));
  assert.equal(verdict(buildWeek(s, { side: null }), at("mon", 10), 60).result, "unsure");
  assert.equal(verdict(buildWeek(s, { side: "right" }), at("mon", 10), 60).result, "yes");
});

test("a cut off sign is Not sure all week until it is switched off", () => {
  const read = signs(
    { text: "NO PARKING 7-9:30 AM", readable: false, problem: "Cut off by the photo edge", rules: [] },
    { text: "2 HOUR PARKING", rules: [rule("time_limit", DAYS, "00:00", "24:00", { limitMinutes: 120 })] },
  );
  assert.equal(read[0].readable, false);
  assert.equal(read[0].problem, "Cut off by the photo edge");
  assert.equal(verdict(buildWeek(read), at("tue", 14), 60).result, "unsure");
  assert.equal(verdict(buildWeek(read, { enabled: [2] }), at("tue", 14), 60).result, "yes");
});

test("a cut off sign with no readable words is kept, an empty entry is not", () => {
  const r = validateReading({ signs: [
    { text: "", arrow: "none", readable: false, problem: "Cut off by the photo edge", rules: [] },
    { text: "", arrow: "none", readable: true, rules: [] },
    { text: "2 HOUR PARKING", arrow: "left", readable: true, rules: [rule("time_limit", DAYS, "00:00", "24:00", { limitMinutes: 120 })] },
  ] });
  assert.equal(r.signs.length, 2);
  assert.equal(r.signs[0].readable, false);
  assert.equal(r.signs[0].problem, "Cut off by the photo edge");
});
