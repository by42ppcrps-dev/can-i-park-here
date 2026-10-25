import { test } from "node:test";
import assert from "node:assert/strict";
import { classify, expectedVerdicts, actualVerdicts } from "../scripts/lib/score.mjs";

const times = [{ day: "tue", time: "08:45" }, { day: "sat", time: "14:00" }];

test("verdicts are compared, not text", () => {
  assert.equal(classify("no", "no"), "right");
  assert.equal(classify("yes", "unsure"), "unsure");
  assert.equal(classify("no", "unsure"), "unsure");
  assert.equal(classify("yes", "no"), "wrongNo");
  assert.equal(classify("unsure", "no"), "wrongNo");
  assert.equal(classify("no", "yes"), "wrongYes");
  assert.equal(classify("unsure", "yes"), "wrongYes");
});

test("declining to answer counts as Not sure, unless no rules were expected", () => {
  assert.equal(classify("no", "failed"), "unsure");
  assert.equal(classify("no", "no_signs"), "unsure");
  assert.equal(classify("yes", "no_signs", true), "right");
});

test("expected and actual verdicts come from the same engine", () => {
  const photo = { side: null, signs: [{ text: "NO PARKING TUE 8-9", arrow: "none", readable: true, rules: [{ kind: "no_parking", days: ["tue"], start: "08:00", end: "09:00" }] }] };
  assert.deepEqual(expectedVerdicts(photo, times, 60), ["no", "yes"]);
  assert.deepEqual(actualVerdicts({ signs: [] }, photo, times, 60), ["no_signs", "no_signs"]);
  assert.deepEqual(actualVerdicts({ error: "read_failed" }, photo, times, 60), ["failed", "failed"]);
  assert.deepEqual(expectedVerdicts({ verdicts: ["no", "yes"] }, times, 60), ["no", "yes"]);
});

test("season dates are judged in the dated test week", () => {
  const photo = {
    side: null,
    signs: [{
      text: "STREET CLEANING NO PARKING 7AM-9AM FRIDAYS APRIL 1-OCT 31", arrow: "none", readable: true,
      rules: [{ kind: "no_parking", days: ["fri"], start: "07:00", end: "09:00", season: { from: "04-01", to: "10-31" } }],
    }],
  };
  const fri = [{ day: "fri", time: "08:00" }];
  assert.deepEqual(expectedVerdicts(photo, fri, 60, "2026-10-19"), ["no"]);
  assert.deepEqual(expectedVerdicts(photo, fri, 60, "2026-11-02"), ["yes"]);
  assert.deepEqual(expectedVerdicts(photo, fri, 60), ["unsure"]);
});
