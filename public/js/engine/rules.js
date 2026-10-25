// Rules engine: turns checked sign readings into a week of 15-minute blocks and
// answers "can I park from this time for this long?".
// Pure functions. No DOM and no clock reads: time is always passed in.
// Monday 00:00 is block 0; Sunday 23:45 is block 671.
import { DAYS, RESTRICTIVE_KINDS, parseTime } from "./validate.js";

export const STEP = 15;
export const PER_DAY = 96;
export const WEEK = 7 * PER_DAY;
export const STAY_CHIPS = { "15m": 15, "1h": 60, "2h": 120, "4h": 240, overnight: null };
const OVERNIGHT_END = 8 * 60; // overnight stays end at 8:00 AM

const wrap = (i) => ((i % WEEK) + WEEK) % WEEK;

// Every block a rule covers. Overnight rules (end before start) run into the next day.
export function ruleBlocks(rule) {
  const s = parseTime(rule.start) / STEP;
  const e = parseTime(rule.end) / STEP;
  const out = [];
  for (const day of rule.days) {
    const base = DAYS.indexOf(day) * PER_DAY;
    const len = e > s ? e - s : PER_DAY - s + e;
    for (let k = 0; k < len; k++) out.push(wrap(base + s + k));
  }
  return out;
}

// "yes" | "maybe" | "no": does this sign cover the side the car is on?
export function appliesToSide(sign, side) {
  if (sign.arrow !== "left" && sign.arrow !== "right") return "yes";
  if (!side) return "maybe";
  return sign.arrow === side ? "yes" : "no";
}

// Arrow fixes. The driver taps a card's arrow to cycle through these.
export const ARROW_CYCLE = ["left", "right", "both", "none"];
export function nextArrow(arrow) {
  return ARROW_CYCLE[(ARROW_CYCLE.indexOf(arrow) + 1) % ARROW_CYCLE.length];
}

// Signs with the driver's arrow fixes applied. A fixed arrow is marked arrowChecked:
// the driver looked at the sign, so a sign pointing away from the car no longer counts.
export function withArrows(signs, fixes) {
  if (!fixes || !fixes.size) return signs;
  return signs.map((s) => (fixes.has(s.id) ? { ...s, arrow: fixes.get(s.id), arrowChecked: true } : s));
}

// Dates. The grid is a real week, Monday first, so seasonal rules use real dates.
export function mondayOf(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}
function toDate(value) {
  if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const [y, m, d] = String(value).split("-").map(Number);
  return new Date(y, m - 1, d);
}
export function addDays(date, n) {
  const d = toDate(date);
  d.setDate(d.getDate() + n);
  return d;
}
// "MM-DD" for each day of the week starting at weekStart (a Monday).
export function weekMonthDays(weekStart) {
  return Array.from({ length: 7 }, (_, k) => {
    const d = addDays(weekStart, k);
    return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
}
// Inclusive; wraps over New Year when from is later than to.
export function inSeason(monthDay, season) {
  if (!season) return true;
  return season.from <= season.to
    ? monthDay >= season.from && monthDay <= season.to
    : monthDay >= season.from || monthDay <= season.to;
}

const isEnabled = (enabled, id) =>
  !enabled ? true : enabled instanceof Set ? enabled.has(id) : enabled.includes(id);

// Returns 672 blocks: { state, limitMinutes, metered, causes, refs, reasons, label }.
// state is "free" | "limited" | "no" | "unsure". causes are sign ids; refs are [signId, ruleIndex].
// weekStart is the Monday of the week shown (a Date or "YYYY-MM-DD"). Without it, a
// rule with a season can't be placed in the year, so it is Not sure.
export function buildWeek(signs, { enabled, side = null, weekStart = null } = {}) {
  const cells = Array.from({ length: WEEK }, () => ({ no: [], unsure: [], allowed: [] }));
  const monthDays = weekStart ? weekMonthDays(weekStart) : null;

  for (const sign of signs) {
    if (!isEnabled(enabled, sign.id)) continue;
    // Arrows are easy to misread, so a sign pointing away from the car's side is
    // Not sure, never silently ignored. The driver can switch it off after checking.
    const applies = appliesToSide(sign, side);

    if (!sign.readable) {
      if (applies === "no" && sign.arrowChecked) continue;
      // Unknown times cover the whole week until the sign is switched off.
      for (const c of cells) c.unsure.push({ id: sign.id, ref: null, reason: "unreadable" });
      continue;
    }
    // A sign that only says when parking is allowed ("PUBLIC PARKING ALLOWED EVENINGS")
    // implies it is not allowed at other times, so the rest of the week is Not sure.
    const counted = sign.rules.filter((r) => !r.largeOnly);
    if (applies !== "no" && counted.length && counted.every((r) => r.kind === "free")) {
      const covered = new Set(counted.flatMap(ruleBlocks));
      cells.forEach((c, b) => {
        if (!covered.has(b)) c.unsure.push({ id: sign.id, ref: null, reason: "outside" });
      });
    }
    sign.rules.forEach((rule, ri) => {
      // Rules for oversized vehicles only never restrict a regular car.
      if (rule.largeOnly) return;
      // The driver checked this arrow and it points away from the car.
      if (applies === "no" && sign.arrowChecked) return;
      const ref = [sign.id, ri];
      let bucket;
      let reason = null;
      if (applies === "maybe") {
        bucket = "unsure";
        reason = "side";
      } else if (applies === "no") {
        bucket = "unsure";
        reason = "away";
      } else if (rule.condition || (rule.season && !monthDays)) {
        bucket = "unsure";
        reason = "condition";
      } else if (RESTRICTIVE_KINDS.includes(rule.kind)) {
        bucket = "no";
      } else {
        bucket = "allowed";
      }
      for (const b of ruleBlocks(rule)) {
        if (rule.season && monthDays && !inSeason(monthDays[Math.floor(b / PER_DAY)], rule.season)) continue;
        cells[b][bucket].push({ id: sign.id, ref, reason, rule });
      }
    });
  }

  return cells.map(decideBlock);
}

const uniq = (xs) => [...new Set(xs)];

const NO_LABELS = {
  no_parking: "No parking", no_standing: "No standing", no_stopping: "No stopping",
  permit_only: "Permit", commercial_only: "Commercial", other_restricted: "Restricted",
};

function limitLabel(limitMinutes, metered) {
  const parts = [];
  if (limitMinutes) parts.push(limitMinutes % 60 === 0 ? `${limitMinutes / 60}H` : `${limitMinutes}M`);
  if (metered) parts.push("Meter");
  return parts.join(" ");
}

function decideBlock(c) {
  // 1. A clearly read not-allowed rule that definitely applies wins.
  if (c.no.length) {
    return {
      state: "no", limitMinutes: null, metered: false,
      causes: uniq(c.no.map((x) => x.id)), refs: c.no.map((x) => x.ref), reasons: [],
      label: NO_LABELS[c.no[0].rule.kind],
    };
  }
  // 2. Anything uncertain touching this block.
  if (c.unsure.length) {
    return {
      state: "unsure", limitMinutes: null, metered: false,
      causes: uniq(c.unsure.map((x) => x.id)), refs: c.unsure.map((x) => x.ref).filter(Boolean),
      reasons: uniq(c.unsure.map((x) => x.reason)), label: "?",
    };
  }
  if (!c.allowed.length) {
    return { state: "free", limitMinutes: null, metered: false, causes: [], refs: [], reasons: [], label: "" };
  }
  // 3. Allowed rules: combine within a sign, then compare across signs.
  const perSign = new Map();
  for (const x of c.allowed) {
    const s = perSign.get(x.id) || { free: false, paid: false, limit: null, metered: false };
    if (x.rule.kind === "free") s.free = true;
    else {
      s.paid = true;
      if (x.rule.limitMinutes) s.limit = s.limit ? Math.min(s.limit, x.rule.limitMinutes) : x.rule.limitMinutes;
      if (x.rule.metered || x.rule.kind === "meter") s.metered = true;
    }
    perSign.set(x.id, s);
  }
  const all = [...perSign.values()];
  const limits = uniq(all.map((s) => s.limit).filter(Boolean));
  const anyFree = all.some((s) => s.free && !s.paid);
  const anyPaid = all.some((s) => s.paid);
  const causes = [...perSign.keys()];
  const refs = c.allowed.map((x) => x.ref);
  if (limits.length > 1 || (anyFree && anyPaid)) {
    return { state: "unsure", limitMinutes: null, metered: false, causes, refs, reasons: ["conflict"], label: "?" };
  }
  // 4. A time limit or a meter.
  if (anyPaid) {
    const limitMinutes = limits[0] || null;
    const metered = all.some((s) => s.metered);
    return { state: "limited", limitMinutes, metered, causes, refs, reasons: [], label: limitLabel(limitMinutes, metered) };
  }
  // 5. Free.
  return { state: "free", limitMinutes: null, metered: false, causes, refs, reasons: [], label: "" };
}

// Finds the first block from `from` (inclusive) for `count` blocks matching test.
// at(j) reads block j, where j may run past Sunday into the following week.
function scan(at, from, count, test) {
  for (let k = 0; k < count; k++) {
    const j = from + k;
    if (test(at(j))) return { k, i: wrap(j) };
  }
  return null;
}

// The answer for a stay starting at startIndex.
// { result: "yes" | "no" | "unsure", why, atIndex, untilIndex, causes, reasons, limitMinutes, metered, block }
// next is the following week; a stay or a search that runs past Sunday reads from it.
// Without it the week repeats.
export function verdict(week, startIndex, stayMinutes, { next = null } = {}) {
  const start = wrap(startIndex);
  const at = (j) => (j < WEEK ? week[j] : (next || week)[wrap(j)]);
  const n = Math.max(1, Math.ceil(stayMinutes / STEP));
  const stay = Array.from({ length: Math.min(n, WEEK) }, (_, k) => start + k);

  // Any NO in the stay.
  const firstNo = stay.find((j) => at(j).state === "no");
  if (firstNo !== undefined) {
    const b = at(firstNo);
    const end = scan(at, firstNo, WEEK, (x) => x.state !== "no");
    return {
      result: "no", why: firstNo === start ? "blocked_now" : "blocked_later",
      atIndex: wrap(firstNo), untilIndex: end ? end.i : null, causes: b.causes, refs: b.refs, reasons: [], block: b,
    };
  }

  // Any NOT SURE in the stay.
  const unsureIdx = stay.filter((j) => at(j).state === "unsure");
  if (unsureIdx.length) {
    const causes = uniq(unsureIdx.flatMap((j) => at(j).causes));
    const reasons = uniq(unsureIdx.flatMap((j) => at(j).reasons));
    return { result: "unsure", why: reasons[0], atIndex: wrap(unsureIdx[0]), untilIndex: null, causes, reasons, refs: [], block: at(unsureIdx[0]) };
  }

  // A stay longer than a time limit. Each limited stretch is counted from when it starts in the stay.
  let k = 0;
  let touchedLimit = null;
  while (k < stay.length) {
    const b = at(stay[k]);
    if (b.state === "limited") {
      let len = 0;
      while (k + len < stay.length && at(stay[k + len]).state === "limited" && at(stay[k + len]).limitMinutes === b.limitMinutes) len++;
      if (b.limitMinutes && len * STEP > b.limitMinutes) {
        return {
          result: "no", why: "over_limit", atIndex: wrap(stay[k]), untilIndex: null,
          causes: b.causes, refs: b.refs, reasons: [], limitMinutes: b.limitMinutes, metered: b.metered, block: b,
        };
      }
      if (!touchedLimit) touchedLimit = b;
      k += len;
    } else k++;
  }

  // YES. Until the next block that is not allowed or not sure.
  const next1 = scan(at, start + 1, WEEK - 1, (x) => x.state === "no" || x.state === "unsure");
  // Nothing stops you all week, but a time limit may start later: name it.
  const nextLimit = !touchedLimit && !next1 ? scan(at, start + 1, WEEK - 1, (x) => x.state === "limited") : null;
  const causes = touchedLimit ? touchedLimit.causes : [];
  const limitBlock = nextLimit ? at(start + 1 + nextLimit.k) : null;
  return {
    result: "yes", why: touchedLimit ? "limited" : next1 ? "until" : "all_week",
    atIndex: start, untilIndex: next1 ? next1.i : null, causes, refs: touchedLimit ? touchedLimit.refs : [], reasons: [],
    limitMinutes: touchedLimit ? touchedLimit.limitMinutes : null, metered: touchedLimit ? touchedLimit.metered : false,
    nextLimitIndex: nextLimit ? nextLimit.i : null,
    nextLimit: limitBlock ? { limitMinutes: limitBlock.limitMinutes, metered: limitBlock.metered } : null,
    block: week[start],
  };
}

// Block index for a Date in its own local time.
export function minuteOfWeek(date) {
  const day = (date.getDay() + 6) % 7;
  return day * PER_DAY + Math.floor((date.getHours() * 60 + date.getMinutes()) / STEP);
}

// Minutes for a stay chip. "overnight" runs until 8:00 AM.
export function stayMinutesFor(chip, startIndex) {
  if (chip !== "overnight") return STAY_CHIPS[chip] ?? 60;
  const m = (wrap(startIndex) % PER_DAY) * STEP;
  return m < OVERNIGHT_END ? OVERNIGHT_END - m : 24 * 60 - m + OVERNIGHT_END;
}

export const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// 510 -> "8:30 AM"; 0 and 1440 -> "12:00 AM".
export function formatClock(minutes) {
  const m = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, "0");
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mm} ${h < 12 ? "AM" : "PM"}`;
}

// Block index -> "Tue 3:15 PM" (or "3:15 PM" without the day).
export function formatBlockTime(index, withDay = true) {
  const i = wrap(index);
  const clock = formatClock((i % PER_DAY) * STEP);
  return withDay ? `${DAY_SHORT[Math.floor(i / PER_DAY)]} ${clock}` : clock;
}
