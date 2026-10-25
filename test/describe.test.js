import { test } from "node:test";
import assert from "node:assert/strict";
import { describeRule, describeVerdict, describeBlock, describeWeek, describeSign, formatDays } from "../public/js/engine/describe.js";
import { buildWeek, verdict, PER_DAY } from "../public/js/engine/rules.js";
import { validateReading, DAYS } from "../public/js/engine/validate.js";

const at = (day, hh, mm = 0) => DAYS.indexOf(day) * PER_DAY + (hh * 60 + mm) / 15;
const rule = (kind, days, start, end, extra = {}) => ({ kind, days, start, end, limitMinutes: null, metered: false, note: null, condition: null, ...extra });
function signs(...list) {
  return validateReading({ signs: list.map((s) => ({ arrow: "none", readable: true, text: "SIGN", ...s })) }).signs;
}

test("rules read like the PRD examples", () => {
  assert.equal(describeRule(rule("no_parking", ["tue"], "08:30", "09:00", { note: "street cleaning" })), "No parking Tue 8:30 to 9:00 AM, street cleaning");
  assert.equal(describeRule(rule("no_parking", DAYS, "00:00", "24:00")), "No parking anytime");
  assert.equal(describeRule(rule("time_limit", ["mon", "tue", "wed", "thu", "fri", "sat"], "08:00", "18:00", { limitMinutes: 120 })), "2 hour parking Mon to Sat 8:00 AM to 6:00 PM");
  assert.equal(describeRule(rule("meter", ["mon", "tue", "wed", "thu", "fri"], "09:00", "18:00", { limitMinutes: 60 })), "Paid parking, 1 hour limit Mon to Fri 9:00 AM to 6:00 PM");
  assert.equal(describeRule(rule("no_parking", ["fri"], "19:00", "07:00")), "No parking Fri 7:00 PM to 7:00 AM");
  assert.equal(describeRule(rule("no_stopping", ["mon", "wed"], "00:00", "24:00")), "No stopping Mon, Wed, all day");
  assert.equal(describeRule(rule("no_parking", DAYS, "00:00", "24:00", { condition: "when it snows" })), "No parking anytime, when it snows");
  assert.equal(describeRule(rule("time_limit", DAYS, "08:00", "20:00", { limitMinutes: 30 })), "30 minute parking 8:00 AM to 8:00 PM");
});

test("day lists read naturally", () => {
  assert.equal(formatDays(DAYS), "every day");
  assert.equal(formatDays(["mon", "tue", "wed", "thu", "fri"]), "Mon to Fri");
  assert.equal(formatDays(["sat", "sun"]), "Sat, Sun");
  assert.equal(formatDays(["tue"]), "Tue");
});

test("verdict lines match the PRD wording", () => {
  const s = signs({ rules: [rule("no_parking", ["tue"], "08:30", "09:00", { note: "street cleaning" })] });
  const w = buildWeek(s);
  assert.equal(describeVerdict(verdict(w, at("tue", 8, 0), 60), s, at("tue", 8, 0)).line, "NO, street cleaning starts 8:30 AM");
  assert.equal(describeVerdict(verdict(w, at("tue", 8, 30), 15), s, at("tue", 8, 30)).line, "NO, street cleaning until 9:00 AM");
  assert.equal(describeVerdict(verdict(w, at("mon", 15, 0), 60), s, at("mon", 15, 0)).line, "YES, until Tue 8:30 AM");
  assert.equal(describeVerdict(verdict(w, at("tue", 6, 0), 60), s, at("tue", 6, 0)).line, "YES, until 8:30 AM");

  const free = signs({ rules: [rule("free", DAYS, "00:00", "24:00")] });
  assert.equal(describeVerdict(verdict(buildWeek(free), 0, 60), free, 0).line, "YES, no limits found this week");

  const weekdays = signs({ rules: [rule("time_limit", ["mon", "tue", "wed", "thu", "fri"], "09:00", "18:00", { limitMinutes: 120 })] });
  const sat = at("sat", 18, 0);
  assert.equal(describeVerdict(verdict(buildWeek(weekdays), sat, 60), weekdays, sat).line, "YES, 2 hour limit from Mon 9:00 AM");
  const paid = signs({ rules: [rule("meter", ["mon"], "09:00", "18:00")] });
  assert.equal(describeVerdict(verdict(buildWeek(paid), sat, 60), paid, sat).line, "YES, paid parking from Mon 9:00 AM");

  const anytime = signs({ rules: [rule("no_parking", DAYS, "00:00", "24:00")] });
  assert.equal(describeVerdict(verdict(buildWeek(anytime), 0, 60), anytime, 0).line, "NO, no parking anytime");

  const limited = signs({ rules: [rule("meter", DAYS, "08:00", "18:00", { limitMinutes: 120 })] });
  const lw = buildWeek(limited);
  assert.equal(describeVerdict(verdict(lw, at("mon", 9, 0), 60), limited, at("mon", 9, 0)).line, "YES, 2 hour limit, pay the meter");
  const one = signs({ rules: [rule("time_limit", DAYS, "08:00", "18:00", { limitMinutes: 60 })] });
  assert.equal(describeVerdict(verdict(buildWeek(one), at("mon", 9, 0), 120), one, at("mon", 9, 0)).line, "NO, 1 hour limit here");
});

test("NOT SURE lines name the sign, the side, or the disagreement", () => {
  const unreadable = signs({ rules: [rule("free", DAYS, "00:00", "24:00")] }, { text: "??", readable: false, rules: [] }, { text: "X", readable: false, rules: [] });
  assert.equal(describeVerdict(verdict(buildWeek(unreadable), 0, 60), unreadable, 0).line, "NOT SURE: check signs 2 and 3");

  const arrowed = signs({ arrow: "left", rules: [rule("no_parking", DAYS, "00:00", "24:00")] });
  assert.equal(describeVerdict(verdict(buildWeek(arrowed), 0, 60), arrowed, 0).line, "NOT SURE: which side is your car on?");
  assert.equal(describeVerdict(verdict(buildWeek(arrowed, { side: "right" }), 0, 60), arrowed, 0).line, "NOT SURE: check the arrow on sign 1");

  const clash = signs(
    { rules: [rule("time_limit", ["mon"], "08:00", "18:00", { limitMinutes: 60 })] },
    { rules: [rule("time_limit", ["mon"], "08:00", "18:00", { limitMinutes: 120 })] },
  );
  assert.equal(describeVerdict(verdict(buildWeek(clash), at("mon", 9, 0), 60), clash, at("mon", 9, 0)).line, "NOT SURE: signs 1 and 2 disagree");
});

test("block captions name the sign behind the block", () => {
  const s = signs(
    { rules: [rule("free", DAYS, "00:00", "24:00")] },
    { rules: [rule("no_parking", ["tue"], "08:30", "09:00", { note: "street cleaning" })] },
  );
  const w = buildWeek(s);
  assert.equal(describeBlock(w[at("tue", 8, 30)], s), "Sign 2: No parking Tue 8:30 to 9:00 AM, street cleaning");
  const bare = signs({ rules: [rule("no_parking", ["tue"], "08:30", "09:00")] });
  assert.equal(describeBlock(buildWeek(bare)[at("mon", 1, 0)], bare), "No sign limits parking here at this time.");
  const u = signs({ text: "??", readable: false, rules: [] });
  assert.match(describeBlock(buildWeek(u)[0], u), /^Sign 1: Couldn't read this one/);
});

test("the week reads as text for screen readers", () => {
  const s = signs({ rules: [rule("no_parking", ["tue"], "08:30", "09:00")] });
  const text = describeWeek(buildWeek(s));
  assert.match(text, /^Mon: free all day\. Tue: no parking 8:30 AM to 9:00 AM; free otherwise\./);
  assert.equal(describeSign(signs({ text: "?", readable: false, rules: [] })[0]), "Couldn't read this one");
});

test("blocks outside an allowed-only sign explain themselves", () => {
  const s = signs({ text: "PUBLIC PARKING ALLOWED WEEKENDS", rules: [rule("free", ["sat", "sun"], "00:00", "24:00")] });
  const w = buildWeek(s);
  assert.equal(describeBlock(w[at("mon", 9)], s), "Sign 1 only says when parking is allowed, not what applies at other times.");
});
