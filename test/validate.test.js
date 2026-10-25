import { test } from "node:test";
import assert from "node:assert/strict";
import { validateReading, parseTime } from "../public/js/engine/validate.js";

const good = {
  signs: [
    {
      text: "NO PARKING 8:30AM-9AM TUESDAY",
      arrow: "none",
      readable: true,
      rules: [{ kind: "no_parking", days: ["tue"], start: "08:30", end: "09:00", note: "street cleaning" }],
    },
  ],
};

test("a clean reply passes and gets ids from the top of the pole", () => {
  const r = validateReading(good);
  assert.equal(r.ok, true);
  assert.equal(r.signs.length, 1);
  assert.equal(r.signs[0].id, 1);
  assert.equal(r.signs[0].readable, true);
  assert.deepEqual(r.signs[0].rules[0].days, ["tue"]);
  assert.equal(r.signs[0].rules[0].note, "street cleaning");
});

test("a JSON string, even wrapped in a code fence, is parsed", () => {
  const r = validateReading("Here you go:\n```json\n" + JSON.stringify(good) + "\n```");
  assert.equal(r.ok, true);
  assert.equal(r.signs[0].text, "NO PARKING 8:30AM-9AM TUESDAY");
});

test("broken JSON or no signs list fails as a whole", () => {
  assert.equal(validateReading("not json at all").ok, false);
  assert.equal(validateReading("{ broken").ok, false);
  assert.equal(validateReading({ nope: [] }).ok, false);
  assert.equal(validateReading(null).ok, false);
});

test("an empty signs list is valid (no signs found)", () => {
  const r = validateReading({ signs: [] });
  assert.equal(r.ok, true);
  assert.equal(r.signs.length, 0);
});

test("an unknown rule kind makes the sign Not sure instead of dropping it", () => {
  const r = validateReading({
    signs: [{ text: "TOW ZONE", arrow: "none", readable: true, rules: [{ kind: "tow", days: ["mon"], start: "08:00", end: "09:00" }] }],
  });
  assert.equal(r.signs.length, 1);
  assert.equal(r.signs[0].readable, false);
  assert.match(r.signs[0].problem, /unknown rule kind/);
});

test("bad days, bad times, and missing limits make the sign Not sure", () => {
  const cases = [
    { kind: "no_parking", days: ["someday"], start: "08:00", end: "09:00" },
    { kind: "no_parking", days: [], start: "08:00", end: "09:00" },
    { kind: "no_parking", days: ["mon"], start: "8am", end: "09:00" },
    { kind: "no_parking", days: ["mon"], start: "25:00", end: "09:00" },
    { kind: "no_parking", days: ["mon"], start: "09:00", end: "09:00" },
    { kind: "time_limit", days: ["mon"], start: "08:00", end: "18:00", limitMinutes: null },
    { kind: "time_limit", days: ["mon"], start: "08:00", end: "18:00", limitMinutes: 0 },
    { kind: "meter", days: ["mon"], start: "08:00", end: "18:00", limitMinutes: 100000 },
  ];
  for (const rule of cases) {
    const r = validateReading({ signs: [{ text: "X", arrow: "none", readable: true, rules: [rule] }] });
    assert.equal(r.signs[0].readable, false, JSON.stringify(rule));
    assert.ok(r.signs[0].problem, JSON.stringify(rule));
  }
});

test("day names and aliases are normalised and kept in week order", () => {
  const r = validateReading({
    signs: [{ text: "X", arrow: "none", readable: true, rules: [{ kind: "no_parking", days: ["Friday", "mon", "Wed."], start: "08:00", end: "09:00" }] }],
  });
  assert.deepEqual(r.signs[0].rules[0].days, ["mon", "wed", "fri"]);
});

test("restrictive times are rounded outward to the quarter hour", () => {
  const r = validateReading({
    signs: [{ text: "X", arrow: "none", readable: true, rules: [{ kind: "no_parking", days: ["mon"], start: "08:40", end: "09:05" }] }],
  });
  assert.equal(r.signs[0].rules[0].start, "08:30");
  assert.equal(r.signs[0].rules[0].end, "09:15");
});

test("00:00 to 00:00 means all day; 24:00 is a valid end", () => {
  const r = validateReading({
    signs: [{ text: "X", arrow: "none", readable: true, rules: [
      { kind: "no_stopping", days: ["mon"], start: "00:00", end: "00:00" },
      { kind: "no_stopping", days: ["tue"], start: "00:00", end: "24:00" },
    ] }],
  });
  assert.equal(r.signs[0].rules[0].end, "24:00");
  assert.equal(r.signs[0].rules[1].end, "24:00");
  assert.equal(parseTime("24:30"), null);
});

test("the model saying unreadable is respected even with rules", () => {
  const r = validateReading({
    signs: [{ text: "NO P?RKING", arrow: "none", readable: false, problem: "blurry times", rules: [{ kind: "no_parking", days: ["mon"], start: "08:00", end: "09:00" }] }],
  });
  assert.equal(r.signs[0].readable, false);
  assert.equal(r.signs[0].problem, "blurry times");
});

test("a readable sign with no rules is Not sure", () => {
  const r = validateReading({ signs: [{ text: "TOW AWAY ZONE", arrow: "none", readable: true, rules: [] }] });
  assert.equal(r.signs[0].readable, false);
});

test("an unclear arrow is Not sure and treated as covering both sides", () => {
  const r = validateReading({ signs: [{ text: "X", arrow: "up", readable: true, rules: [{ kind: "no_parking", days: ["mon"], start: "08:00", end: "09:00" }] }] });
  assert.equal(r.signs[0].arrow, "both");
  assert.equal(r.signs[0].readable, false);
});

test("signs with no text and no rules are dropped; ids stay in pole order", () => {
  const r = validateReading({
    signs: [
      { text: "", arrow: "none", readable: false, rules: [] },
      good.signs[0],
      { text: "2 HOUR PARKING 8AM-6PM", arrow: "none", readable: true, rules: [{ kind: "time_limit", days: ["mon"], start: "08:00", end: "18:00", limitMinutes: 120 }] },
    ],
  });
  assert.equal(r.signs.length, 2);
  assert.deepEqual(r.signs.map((s) => s.id), [1, 2]);
  assert.equal(r.signs[1].rules[0].limitMinutes, 120);
});

test("a condition in the text is added when the model dropped it", () => {
  const r = validateReading({
    signs: [
      { text: "NO PARKING WHEN SNOW IS OVER 2 INCHES", arrow: "none", readable: true, rules: [{ kind: "no_parking", days: ["mon"], start: "00:00", end: "24:00" }] },
      { text: "STREET CLEANING 7AM - 9AM WEDNESDAYS APR - OCT 31", arrow: "none", readable: true, rules: [{ kind: "no_parking", days: ["wed"], start: "07:00", end: "09:00" }] },
      { text: "NO PARKING 8AM-9AM MON", arrow: "none", readable: true, rules: [{ kind: "no_parking", days: ["mon"], start: "08:00", end: "09:00" }] },
    ],
  });
  assert.equal(r.signs[0].rules[0].condition, "when it snows");
  assert.equal(r.signs[1].rules[0].condition, "only some months of the year");
  assert.equal(r.signs[2].rules[0].condition, null);
  // Temporary construction rules are in force, so they stay certain.
  const c = validateReading({ signs: [{ text: "NO STANDING ANYTIME TEMPORARY CONSTRUCTION REGULATION", arrow: "both", readable: true, rules: [{ kind: "no_standing", days: ["mon"], start: "00:00", end: "24:00" }] }] });
  assert.equal(c.signs[0].rules[0].condition, null);
});

test("conditions are kept so the engine can treat them as Not sure", () => {
  const r = validateReading({
    signs: [{ text: "NO PARKING WHEN SNOW", arrow: "none", readable: true, rules: [{ kind: "no_parking", days: ["mon"], start: "00:00", end: "24:00", condition: "when snow is over 2 inches" }] }],
  });
  assert.equal(r.signs[0].rules[0].condition, "when snow is over 2 inches");
});

test("ruleless exemption panels are left out; other ruleless signs stay Not sure", () => {
  const r = validateReading({
    signs: [
      { text: "NO STANDING ANYTIME", arrow: "both", readable: true, rules: [{ kind: "no_standing", days: ["mon"], start: "00:00", end: "24:00" }] },
      { text: "EXCEPT WTC CONSTRUCTION VEHICLES", arrow: "none", readable: true, rules: [] },
      { text: "EXCEPTÉ VÉHICULES MUNIS D'UN PERMIS", arrow: "none", readable: true, rules: [] },
      { text: "SUBJECT TO SURGE PRICING", arrow: "none", readable: true, rules: [] },
    ],
  });
  assert.deepEqual(r.signs.map((s) => s.text), ["NO STANDING ANYTIME", "SUBJECT TO SURGE PRICING"]);
  assert.deepEqual(r.signs.map((s) => s.id), [1, 2]);
  assert.equal(r.signs[1].readable, false);
});

test("hours that run to sunset or from sunrise are not fixed times, so they are Not sure", () => {
  const r = validateReading({ signs: [{
    text: "PUBLIC PARKING ALLOWED EVENINGS (5:00 PM TO SUNSET) WEEKENDS (SUNRISE TO SUNSET)", arrow: "none", readable: true,
    rules: [{ kind: "free", days: ["sat", "sun"], start: "00:00", end: "24:00" }],
  }] });
  assert.equal(r.signs[0].rules[0].condition, "hours set by sunrise or sunset");
});
