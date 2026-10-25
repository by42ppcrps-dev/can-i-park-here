import { test } from "node:test";
import assert from "node:assert/strict";
import { buildWeek, verdict, inSeason, mondayOf, weekMonthDays, addDays, stayMinutesFor, PER_DAY } from "../public/js/engine/rules.js";
import { validateReading, seasonFromText, conditionHint, DAYS } from "../public/js/engine/validate.js";
import { describeRule, describeSign } from "../public/js/engine/describe.js";

function signs(...list) {
  const r = validateReading({ signs: list.map((s) => ({ arrow: "none", readable: true, text: "SIGN", ...s })) });
  assert.equal(r.ok, true);
  return r.signs;
}
const rule = (kind, days, start, end, extra = {}) => ({ kind, days, start, end, ...extra });
const at = (day, hh, mm = 0) => DAYS.indexOf(day) * PER_DAY + (hh * 60 + mm) / 15;

// Chicago street cleaning, as printed on p23.
const cleaning = {
  text: "STREET CLEANING NO PARKING 7AM-9AM FRIDAYS APRIL 1-OCT 31 TOW ZONE",
  rules: [rule("no_parking", ["fri"], "07:00", "09:00", { note: "street cleaning", season: { from: "04-01", to: "10-31" } })],
};
// A winter overnight ban that wraps over New Year.
const winter = {
  text: "NO PARKING 3AM-7AM NOV 1 - MAR 31",
  rules: [rule("no_parking", DAYS, "03:00", "07:00", { season: { from: "11-01", to: "03-31" } })],
};

test("season dates are read from sign text", () => {
  assert.deepEqual(seasonFromText("STREET CLEANING 7AM-9AM FRIDAYS APRIL 1-OCT 31"), { from: "04-01", to: "10-31" });
  assert.deepEqual(seasonFromText("NO PARKING DEC. 1 TO APR. 1"), { from: "12-01", to: "04-01" });
  assert.deepEqual(seasonFromText("SEASONAL APR - NOV"), { from: "04-01", to: "11-30" });
  assert.deepEqual(seasonFromText("TUESDAY 4/1 - 11/30"), { from: "04-01", to: "11-30" });
  assert.equal(seasonFromText("NO PARKING MON-SAT 9AM-5PM"), null);
  assert.equal(seasonFromText("TRUCKS MAY BE TOWED"), null);
});

test("validator keeps a season that matches the sign and drops the months hint", () => {
  const [s] = signs(cleaning);
  assert.equal(s.readable, true);
  assert.deepEqual(s.rules[0].season, { from: "04-01", to: "10-31" });
  assert.equal(s.rules[0].condition, null);
});

test("validator: printed months with no season stay Not sure", () => {
  const [s] = signs({ text: cleaning.text, rules: [rule("no_parking", ["fri"], "07:00", "09:00")] });
  assert.equal(s.rules[0].condition, "only some months of the year");
  assert.equal(conditionHint("NO PARKING TUESDAY 4/1 - 11/30"), "only some months of the year");
  assert.equal(conditionHint(cleaning.text, { seasonRead: true }), null);
  assert.equal(conditionHint("SNOW ROUTE APRIL 1-OCT 31", { seasonRead: true }), "when it snows");
});

test("validator: a season that is malformed, invented, or different from the sign is Not sure", () => {
  const bad = signs({ text: cleaning.text, rules: [rule("no_parking", ["fri"], "07:00", "09:00", { season: { from: "13-01", to: "10-31" } })] })[0];
  assert.equal(bad.readable, false);
  assert.match(bad.problem, /season/);
  const invented = signs({ text: "NO PARKING 7AM-9AM FRIDAYS", rules: [rule("no_parking", ["fri"], "07:00", "09:00", { season: { from: "04-01", to: "10-31" } })] })[0];
  assert.equal(invented.readable, false);
  assert.equal(invented.problem, "season dates not found on the sign");
  const wrong = signs({ text: cleaning.text, rules: [rule("no_parking", ["fri"], "07:00", "09:00", { season: { from: "04-01", to: "11-30" } })] })[0];
  assert.equal(wrong.readable, false);
  assert.equal(wrong.problem, "season dates don't match the sign");
  // Not read at all: the model said so.
  const blurry = signs({ text: "STREET CLEANING ... 1-OCT 31", readable: false, problem: "Season dates too blurry", rules: [] })[0];
  assert.equal(blurry.readable, false);
});

test("inSeason is inclusive and wraps over New Year", () => {
  const summer = { from: "04-01", to: "10-31" };
  assert.equal(inSeason("04-01", summer), true);
  assert.equal(inSeason("10-31", summer), true);
  assert.equal(inSeason("11-01", summer), false);
  assert.equal(inSeason("03-31", summer), false);
  const w = { from: "11-01", to: "03-31" };
  assert.equal(inSeason("11-01", w), true);
  assert.equal(inSeason("01-15", w), true);
  assert.equal(inSeason("03-31", w), true);
  assert.equal(inSeason("04-01", w), false);
  assert.equal(inSeason("07-01", w), false);
  assert.equal(inSeason("07-01", null), true);
});

test("weeks start on Monday and carry real dates", () => {
  assert.equal(mondayOf(new Date(2026, 9, 24, 15, 0)).getDate(), 19);
  assert.equal(mondayOf(new Date(2026, 9, 25, 23, 0)).getDate(), 19);
  assert.equal(mondayOf(new Date(2026, 9, 26, 0, 5)).getDate(), 26);
  assert.deepEqual(weekMonthDays("2026-10-26"), ["10-26", "10-27", "10-28", "10-29", "10-30", "10-31", "11-01"]);
  assert.deepEqual(weekMonthDays(addDays("2026-12-28", 0)), ["12-28", "12-29", "12-30", "12-31", "01-01", "01-02", "01-03"]);
});

test("in season: the rule applies on its days", () => {
  const w = buildWeek(signs(cleaning), { weekStart: "2026-10-19" });
  assert.equal(w[at("fri", 8)].state, "no");
  assert.equal(verdict(w, at("fri", 8), 60).result, "no");
  assert.equal(verdict(w, at("thu", 8), 60).result, "yes");
});

test("out of season: the rule is off and the answer is YES", () => {
  const w = buildWeek(signs(cleaning), { weekStart: "2026-11-02" });
  assert.equal(w[at("fri", 8)].state, "free");
  assert.equal(verdict(w, at("fri", 8), 60).result, "yes");
  // Winter: the same week of March is in, April is out.
  const march = buildWeek(signs(cleaning), { weekStart: "2026-03-23" });
  assert.equal(march[at("fri", 8)].state, "free");
  const april = buildWeek(signs(cleaning), { weekStart: "2026-03-30" });
  assert.equal(april[at("fri", 8)].state, "no"); // Fri Apr 3
});

test("a season that wraps over New Year applies in January, not in July", () => {
  const jan = buildWeek(signs(winter), { weekStart: "2027-01-11" });
  assert.equal(jan[at("wed", 4)].state, "no");
  const jul = buildWeek(signs(winter), { weekStart: "2026-07-06" });
  assert.equal(jul[at("wed", 4)].state, "free");
  // The week of New Year is in season on both sides.
  const ny = buildWeek(signs(winter), { weekStart: "2026-12-28" });
  assert.ok([at("mon", 4), at("thu", 4), at("sun", 4)].every((i) => ny[i].state === "no"));
});

test("each grid day uses its own date: a week that crosses the season start", () => {
  // Mon Oct 26 to Sun Nov 1, 2026: only Sunday is in the winter season.
  const w = buildWeek(signs(winter), { weekStart: "2026-10-26" });
  assert.equal(w[at("sat", 4)].state, "free");
  assert.equal(w[at("sun", 4)].state, "no");
});

test("a stay that crosses the season boundary uses the dates it covers", () => {
  // Sat Oct 31 10 PM overnight: the stay runs into Sun Nov 1, the first day of the ban.
  const w = buildWeek(signs(winter), { weekStart: "2026-10-26" });
  const start = at("sat", 22);
  const v = verdict(w, start, stayMinutesFor("overnight", start));
  assert.equal(v.result, "no");
  assert.equal(v.why, "blocked_later");
  // The other way: Fri Oct 30 street cleaning is in force, the next Friday is not.
  const c = buildWeek(signs(cleaning), { weekStart: "2026-10-26" });
  assert.equal(verdict(c, at("fri", 8), 60).result, "no");
  const after = buildWeek(signs(cleaning), { weekStart: "2026-11-02" });
  assert.equal(verdict(after, at("fri", 8), 60).result, "yes");
});

test("a stay past Sunday night reads next week's dates", () => {
  // Season starts Mon Nov 30. Week of Mon Nov 23: a Sunday night stay ends in season.
  const ban = { text: "NO PARKING 3AM-7AM NOV 30 - MAR 31", rules: [rule("no_parking", DAYS, "03:00", "07:00", { season: { from: "11-30", to: "03-31" } })] };
  const s = signs(ban);
  const week = buildWeek(s, { weekStart: "2026-11-23" });
  const next = buildWeek(s, { weekStart: "2026-11-30" });
  const start = at("sun", 22);
  const stay = stayMinutesFor("overnight", start);
  assert.equal(verdict(week, start, stay).result, "yes"); // without dates it would wrap to Mon Nov 23
  const v = verdict(week, start, stay, { next });
  assert.equal(v.result, "no");
  assert.equal(v.atIndex, at("mon", 3));
});

test("without dates a seasonal rule is Not sure, never ignored", () => {
  const w = buildWeek(signs(cleaning));
  assert.equal(w[at("fri", 8)].state, "unsure");
  assert.equal(w[at("thu", 8)].state, "free");
});

test("season text on cards", () => {
  const [s] = signs(cleaning);
  assert.equal(describeRule(s.rules[0]), "No parking Fri 7:00 to 9:00 AM, Apr 1 to Oct 31, street cleaning");
  assert.equal(describeRule(rule("no_parking", DAYS, "03:00", "07:00", { season: { from: "11-01", to: "03-31" } })), "No parking 3:00 to 7:00 AM, Nov 1 to Mar 31");
  assert.equal(describeSign(s), "No parking Fri 7:00 to 9:00 AM, Apr 1 to Oct 31, street cleaning");
});
