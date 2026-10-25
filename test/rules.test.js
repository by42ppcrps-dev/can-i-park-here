import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildWeek, verdict, ruleBlocks, minuteOfWeek, stayMinutesFor, formatBlockTime, formatClock,
  PER_DAY, WEEK,
} from "../public/js/engine/rules.js";
import { validateReading, DAYS } from "../public/js/engine/validate.js";

// Build signs through the validator, the same way live readings arrive.
function signs(...list) {
  const r = validateReading({ signs: list.map((s) => ({ arrow: "none", readable: true, text: s.text || "SIGN", ...s })) });
  assert.equal(r.ok, true);
  return r.signs;
}
const rule = (kind, days, start, end, extra = {}) => ({ kind, days, start, end, ...extra });
const at = (day, hh, mm = 0) => DAYS.indexOf(day) * PER_DAY + (hh * 60 + mm) / 15;
const ALL = DAYS;

const streetCleaning = { text: "NO PARKING 8:30AM-9AM TUESDAY", rules: [rule("no_parking", ["tue"], "08:30", "09:00", { note: "street cleaning" })] };
const twoHour = { text: "2 HOUR PARKING 8AM-6PM MON-SAT", rules: [rule("time_limit", ["mon", "tue", "wed", "thu", "fri", "sat"], "08:00", "18:00", { limitMinutes: 120 })] };

test("a week has 672 blocks; no rules means free everywhere", () => {
  const w = buildWeek(signs({ text: "FREE PARKING", rules: [rule("free", ALL, "00:00", "24:00")] }));
  assert.equal(w.length, WEEK);
  assert.ok(w.every((b) => b.state === "free"));
});

test("street cleaning: NO inside the window, YES outside it with the right until", () => {
  const s = signs(streetCleaning);
  const w = buildWeek(s);
  assert.equal(w[at("tue", 8, 30)].state, "no");
  assert.equal(w[at("tue", 8, 45)].state, "no");
  assert.equal(w[at("tue", 9, 0)].state, "free");
  assert.equal(w[at("tue", 8, 15)].state, "free");

  assert.equal(verdict(w, at("tue", 8, 45), 60).result, "no");
  const later = verdict(w, at("tue", 8, 0), 60);
  assert.equal(later.result, "no");
  assert.equal(later.why, "blocked_later");
  assert.equal(later.atIndex, at("tue", 8, 30));

  const yes = verdict(w, at("mon", 9, 0), 60);
  assert.equal(yes.result, "yes");
  assert.equal(yes.untilIndex, at("tue", 8, 30));
});

test("overnight rules run past midnight into the next day", () => {
  const w = buildWeek(signs({ rules: [rule("no_parking", ["fri"], "19:00", "07:00")] }));
  assert.equal(w[at("fri", 18, 45)].state, "free");
  assert.equal(w[at("fri", 19, 0)].state, "no");
  assert.equal(w[at("sat", 0, 0)].state, "no");
  assert.equal(w[at("sat", 6, 45)].state, "no");
  assert.equal(w[at("sat", 7, 0)].state, "free");
});

test("Sunday overnight rules wrap into Monday morning", () => {
  const blocks = ruleBlocks({ days: ["sun"], start: "22:00", end: "02:00" });
  assert.ok(blocks.includes(at("sun", 23, 45)));
  assert.ok(blocks.includes(0));
  assert.ok(blocks.includes(at("mon", 1, 45)));
  assert.ok(!blocks.includes(at("mon", 2, 0)));
});

test("a stay that wraps from Sunday into Monday is checked across the wrap", () => {
  const w = buildWeek(signs({ rules: [rule("no_parking", ["mon"], "00:00", "01:00")] }));
  const v = verdict(w, at("sun", 23, 30), 60);
  assert.equal(v.result, "no");
  assert.equal(v.atIndex, 0);
});

test("the stricter sign wins: not allowed beats allowed for the same minute", () => {
  const w = buildWeek(signs(twoHour, streetCleaning));
  assert.equal(w[at("tue", 8, 30)].state, "no");
  assert.equal(w[at("tue", 10, 0)].state, "limited");
  assert.equal(verdict(w, at("tue", 8, 30), 15).result, "no");
});

test("time limits: within the limit is YES with the limit; longer is NO naming the limit", () => {
  const w = buildWeek(signs(twoHour));
  const ok = verdict(w, at("wed", 10, 0), 120);
  assert.equal(ok.result, "yes");
  assert.equal(ok.why, "limited");
  assert.equal(ok.limitMinutes, 120);
  const tooLong = verdict(w, at("wed", 10, 0), 240);
  assert.equal(tooLong.result, "no");
  assert.equal(tooLong.why, "over_limit");
  assert.equal(tooLong.limitMinutes, 120);
  // Starting late in the limited window: only the limited part counts.
  assert.equal(verdict(w, at("wed", 17, 0), 240).result, "yes");
  // Sunday has no limit.
  assert.equal(verdict(w, at("sun", 10, 0), 240).result, "yes");
});

test("a meter and a time limit on the same pole combine into one limited block", () => {
  const w = buildWeek(signs(twoHour, { text: "PAY AT METER", rules: [rule("meter", ["mon", "tue", "wed", "thu", "fri", "sat"], "08:00", "18:00")] }));
  const b = w[at("mon", 9, 0)];
  assert.equal(b.state, "limited");
  assert.equal(b.limitMinutes, 120);
  assert.equal(b.metered, true);
  assert.equal(b.label, "2H Meter");
});

test("conflicts: two different limits for the same hours are Not sure", () => {
  const w = buildWeek(signs(
    { rules: [rule("time_limit", ["mon"], "08:00", "18:00", { limitMinutes: 60 })] },
    { rules: [rule("time_limit", ["mon"], "08:00", "18:00", { limitMinutes: 120 })] },
  ));
  const b = w[at("mon", 9, 0)];
  assert.equal(b.state, "unsure");
  assert.deepEqual(b.reasons, ["conflict"]);
  assert.deepEqual(b.causes, [1, 2]);
  assert.equal(verdict(w, at("mon", 9, 0), 15).result, "unsure");
});

test("conflicts: free versus metered for the same hours is Not sure", () => {
  const w = buildWeek(signs(
    { rules: [rule("free", ["mon"], "00:00", "24:00")] },
    { rules: [rule("meter", ["mon"], "08:00", "18:00", { limitMinutes: 60 })] },
  ));
  assert.equal(w[at("mon", 9, 0)].state, "unsure");
  assert.equal(w[at("mon", 19, 0)].state, "free");
});

test("an unreadable sign makes the whole week Not sure until switched off", () => {
  const s = signs(twoHour, { text: "NO P?RK", readable: false, rules: [] });
  const w = buildWeek(s);
  assert.ok(w.every((b) => b.state === "unsure"));
  const off = buildWeek(s, { enabled: new Set([1]) });
  assert.equal(off[at("mon", 9, 0)].state, "limited");
  assert.equal(off[at("mon", 20, 0)].state, "free");
});

test("NO beats NOT SURE: a clear no-parking rule wins over an unreadable sign", () => {
  const w = buildWeek(signs(streetCleaning, { text: "??", readable: false, rules: [] }));
  assert.equal(w[at("tue", 8, 30)].state, "no");
  assert.equal(w[at("mon", 8, 30)].state, "unsure");
  assert.equal(verdict(w, at("tue", 8, 0), 60).result, "no");
});

test("conditional rules (snow, months, school days) are Not sure, never NO or YES", () => {
  const w = buildWeek(signs({ text: "NO PARKING WHEN SNOW IS OVER 2 INCHES", rules: [rule("no_parking", ALL, "00:00", "24:00")] }));
  assert.ok(w.every((b) => b.state === "unsure" && b.reasons.includes("condition")));
});

test("arrows: unknown side is Not sure; the matching side applies; a sign pointing away is Not sure, never ignored", () => {
  const s = signs(
    { text: "NO PARKING ANYTIME", arrow: "left", rules: [rule("no_parking", ALL, "00:00", "24:00")] },
    { text: "2 HOUR PARKING", arrow: "right", rules: [rule("time_limit", ALL, "08:00", "18:00", { limitMinutes: 120 })] },
  );
  const unknown = buildWeek(s);
  assert.equal(unknown[at("mon", 9, 0)].state, "unsure");
  assert.deepEqual(unknown[at("mon", 9, 0)].reasons, ["side"]);
  assert.equal(verdict(unknown, at("mon", 9, 0), 60).why, "side");

  const left = buildWeek(s, { side: "left" });
  assert.equal(left[at("mon", 9, 0)].state, "no");
  assert.equal(left[at("mon", 20, 0)].state, "no");

  // The no parking sign points left, away from a car on the right: Not sure, not YES.
  const right = buildWeek(s, { side: "right" });
  assert.equal(right[at("mon", 9, 0)].state, "unsure");
  assert.deepEqual(right[at("mon", 9, 0)].reasons, ["away"]);
  assert.equal(verdict(right, at("mon", 20, 0), 60).result, "unsure");

  // After the driver checks the arrow and switches that sign off, the right side is clear.
  const checked = buildWeek(s, { side: "right", enabled: new Set([2]) });
  assert.equal(checked[at("mon", 9, 0)].state, "limited");
  assert.equal(checked[at("mon", 20, 0)].state, "free");
});

test("a misread arrow can never turn a restriction into YES", () => {
  const s = signs({ text: "NO PARKING FREIGHT ZONE 24 HOURS", arrow: "right", rules: [rule("no_parking", ALL, "00:00", "24:00")] });
  for (const side of [null, "left", "right"]) {
    const w = buildWeek(s, { side });
    for (let i = 0; i < WEEK; i += 7) assert.notEqual(verdict(w, i, 60).result, "yes");
  }
});

test("double arrows and no arrow apply to both sides", () => {
  const s = signs({ text: "NO STOPPING", arrow: "both", rules: [rule("no_stopping", ALL, "07:00", "09:00")] });
  for (const side of [null, "left", "right"]) {
    assert.equal(buildWeek(s, { side })[at("thu", 7, 30)].state, "no");
  }
});

test("permit and commercial only rules are not allowed for an everyday driver", () => {
  const w = buildWeek(signs(
    { rules: [rule("permit_only", ["mon"], "00:00", "24:00")] },
    { rules: [rule("commercial_only", ["tue"], "07:00", "10:00")] },
  ));
  assert.equal(w[at("mon", 12, 0)].state, "no");
  assert.equal(w[at("tue", 8, 0)].state, "no");
});

test("all signs switched off gives no blocks with causes", () => {
  const w = buildWeek(signs(streetCleaning), { enabled: new Set() });
  assert.ok(w.every((b) => b.state === "free" && b.causes.length === 0));
});

test("never a confident wrong YES: any uncertain block in the stay blocks YES", () => {
  // Exhaustive over start times and stays for a pole mixing every kind of uncertainty.
  const s = signs(
    twoHour,
    { text: "NO PARKING WHEN SNOW", rules: [rule("no_parking", ["wed"], "10:00", "12:00", { condition: "when it snows" })] },
    { text: "NO PARKING ANYTIME", arrow: "left", rules: [rule("no_parking", ["fri"], "13:00", "14:00")] },
    { text: "1 HOUR PARKING", rules: [rule("time_limit", ["sat"], "09:00", "11:00", { limitMinutes: 60 })] },
  );
  const w = buildWeek(s);
  for (const stay of [15, 60, 120, 240, 900]) {
    for (let start = 0; start < WEEK; start++) {
      const v = verdict(w, start, stay);
      const n = Math.ceil(stay / 15);
      const touchesUnsure = Array.from({ length: n }, (_, k) => w[(start + k) % WEEK]).some((b) => b.state === "unsure");
      if (touchesUnsure) assert.notEqual(v.result, "yes", `start ${start} stay ${stay}`);
      const touchesNo = Array.from({ length: n }, (_, k) => w[(start + k) % WEEK]).some((b) => b.state === "no");
      if (touchesNo) assert.equal(v.result, "no", `start ${start} stay ${stay}`);
    }
  }
});

test("minuteOfWeek uses local time with Monday 00:00 as block 0", () => {
  assert.equal(minuteOfWeek(new Date(2026, 9, 26, 0, 0)), 0); // Mon Oct 26 2026
  assert.equal(minuteOfWeek(new Date(2026, 9, 27, 8, 44)), at("tue", 8, 30));
  assert.equal(minuteOfWeek(new Date(2026, 9, 25, 23, 59)), WEEK - 1); // Sunday
});

test("overnight stay runs until 8:00 AM", () => {
  assert.equal(stayMinutesFor("overnight", at("mon", 20, 0)), 12 * 60);
  assert.equal(stayMinutesFor("overnight", at("mon", 2, 0)), 6 * 60);
  assert.equal(stayMinutesFor("overnight", at("mon", 8, 0)), 24 * 60);
  assert.equal(stayMinutesFor("1h", 0), 60);
  assert.equal(stayMinutesFor("15m", 0), 15);
});

test("time formatting is 12 hour with AM and PM", () => {
  assert.equal(formatClock(0), "12:00 AM");
  assert.equal(formatClock(12 * 60), "12:00 PM");
  assert.equal(formatClock(15 * 60 + 15), "3:15 PM");
  assert.equal(formatBlockTime(at("tue", 15, 15)), "Tue 3:15 PM");
  assert.equal(formatBlockTime(at("tue", 15, 15), false), "3:15 PM");
});
