// validateReading(): the gate between the AI and the rules engine.
// Anything the model returns passes through here. A sign that fails a check is
// kept as a Not sure sign (readable: false, problem set), never dropped and never trusted.
// Shared by the Worker (src/read-signs.js) and the browser. No DOM in here.

export const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
export const ARROWS = ["none", "left", "right", "both"];
export const RESTRICTIVE_KINDS = [
  "no_parking", "no_standing", "no_stopping",
  "permit_only", "commercial_only", "other_restricted",
];
export const ALLOWED_KINDS = ["time_limit", "meter", "free"];
export const KINDS = [...RESTRICTIVE_KINDS, ...ALLOWED_KINDS];

const DAY_ALIASES = {
  mon: "mon", monday: "mon", tue: "tue", tues: "tue", tuesday: "tue",
  wed: "wed", wednesday: "wed", thu: "thu", thur: "thu", thurs: "thu", thursday: "thu",
  fri: "fri", friday: "fri", sat: "sat", saturday: "sat", sun: "sun", sunday: "sun",
};

const MAX_SIGNS = 12;
const MAX_RULES = 8;

// "08:30" -> 510. Accepts 24:00 as end of day. Returns null when invalid.
export function parseTime(value) {
  if (typeof value !== "string") return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (min > 59 || h > 24 || (h === 24 && min !== 0)) return null;
  return h * 60 + min;
}

export function formatHHMM(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Rounding only ever widens a rule, so it can only make the answer stricter.
const floorQuarter = (m) => Math.floor(m / 15) * 15;
const ceilQuarter = (m) => Math.ceil(m / 15) * 15;

function parseRaw(raw) {
  if (raw && typeof raw === "object") return raw;
  if (typeof raw !== "string") return null;
  let text = raw.trim();
  const fence = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  if (fence) text = fence[1].trim();
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last <= first) return null;
  try {
    return JSON.parse(text.slice(first, last + 1));
  } catch {
    return null;
  }
}

function cleanText(value, max) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function validateDays(days) {
  if (typeof days === "string") days = [days];
  if (!Array.isArray(days) || days.length === 0) return null;
  const out = new Set();
  for (const d of days) {
    if (typeof d !== "string") return null;
    const key = d.trim().toLowerCase().replace(/\.$/, "");
    if (key === "all" || key === "daily" || key === "everyday" || key === "anytime") {
      DAYS.forEach((x) => out.add(x));
      continue;
    }
    const day = DAY_ALIASES[key];
    if (!day) return null;
    out.add(day);
  }
  return DAYS.filter((d) => out.has(d));
}

// Returns { rule } or { problem }.
function validateRule(r) {
  if (!r || typeof r !== "object") return { problem: "rule is not an object" };
  const kind = typeof r.kind === "string" ? r.kind.trim().toLowerCase() : "";
  if (!KINDS.includes(kind)) return { problem: `unknown rule kind "${cleanText(r.kind, 40)}"` };

  const days = validateDays(r.days);
  if (!days) return { problem: "days are missing or unclear" };

  const start = parseTime(r.start);
  const end = parseTime(r.end);
  if (start === null || end === null) return { problem: "times are missing or unclear" };
  if (start === end && !(start === 0 && end === 0)) return { problem: "start and end are the same" };
  if (start === 24 * 60) return { problem: "start time is 24:00" };

  let limitMinutes = null;
  if (kind === "time_limit" || kind === "meter") {
    const n = Number(r.limitMinutes);
    if (r.limitMinutes !== null && r.limitMinutes !== undefined && r.limitMinutes !== "") {
      if (!Number.isFinite(n) || n < 5 || n > 24 * 60) return { problem: "time limit is not sensible" };
      limitMinutes = Math.round(n);
    }
    if (kind === "time_limit" && limitMinutes === null) return { problem: "time limit is missing" };
  }

  // 00:00 to 00:00 is read as all day.
  const s = floorQuarter(start);
  let e = end === 0 && start === 0 ? 24 * 60 : ceilQuarter(end);
  if (e === s) e = s + 15;

  const condition = cleanText(r.condition, 80) || null;
  return {
    rule: {
      kind,
      days,
      start: formatHHMM(s),
      end: formatHHMM(e),
      limitMinutes,
      metered: kind === "meter" || r.metered === true,
      note: cleanText(r.note, 80) || null,
      condition,
    },
  };
}

function validateSign(s, index) {
  const sign = {
    id: index + 1,
    text: "",
    readable: true,
    arrow: "none",
    problem: null,
    rules: [],
  };
  if (!s || typeof s !== "object") {
    return { ...sign, readable: false, problem: "sign is not an object" };
  }
  sign.text = cleanText(s.text, 300);

  const arrow = typeof s.arrow === "string" ? s.arrow.trim().toLowerCase() : "none";
  if (ARROWS.includes(arrow)) sign.arrow = arrow;
  else {
    sign.arrow = "both";
    sign.problem = "arrow direction is unclear";
    sign.readable = false;
  }

  if (s.readable === false) {
    sign.readable = false;
    sign.problem = sign.problem || cleanText(s.problem, 120) || "could not read this sign";
  }

  const rawRules = Array.isArray(s.rules) ? s.rules.slice(0, MAX_RULES) : [];
  for (const r of rawRules) {
    const { rule, problem } = validateRule(r);
    if (rule) sign.rules.push(rule);
    else {
      sign.readable = false;
      sign.problem = sign.problem || problem;
    }
  }
  if (!Array.isArray(s.rules) && s.rules !== undefined) {
    sign.readable = false;
    sign.problem = sign.problem || "rules are not a list";
  }
  if (sign.readable && sign.rules.length === 0) {
    sign.readable = false;
    sign.problem = "no parking rule found on this sign";
  }
  // The model sometimes drops a condition it did copy into the text. If the text
  // says "when snow", "school days", or names months, nothing on the sign is
  // treated as certain. This can only make the answer stricter.
  const hint = conditionHint(sign.text);
  if (hint && sign.rules.length && sign.rules.every((r) => !r.condition)) {
    sign.rules = sign.rules.map((r) => ({ ...r, condition: hint }));
  }
  return sign;
}

const MONTHS = /\b(JAN|JANUARY|FEB|FEBRUARY|MAR|MARCH|APR|APRIL|MAY|JUN|JUNE|JUL|JULY|AUG|AUGUST|SEPT?|SEPTEMBER|OCT|OCTOBER|NOV|NOVEMBER|DEC|DECEMBER)\b\.?\s*\d{0,2}\s*(-|TO|THRU|THROUGH)/i;
const CONDITIONS = [
  [/\bSNOW/i, "when it snows"],
  [/\bSCHOOL/i, "on school days"],
  [/\b(EVENTS?|GAME DAYS?|STADIUM)\b/i, "during events"],
  [/\bEMERGENC/i, "during emergencies"],
  [/\bCONSTRUCTION\b/i, "during construction"],
  [/\bSEASONAL\b/i, "only some months of the year"],
  [/\bWHEN\b/i, "only under a condition on the sign"],
];

export function conditionHint(text) {
  if (!text) return null;
  if (MONTHS.test(text)) return "only some months of the year";
  for (const [re, label] of CONDITIONS) if (re.test(text)) return label;
  return null;
}

// Returns { ok: true, signs } or { ok: false, error }.
export function validateReading(raw) {
  const data = parseRaw(raw);
  if (!data || typeof data !== "object") return { ok: false, error: "reply is not JSON" };
  if (!Array.isArray(data.signs)) return { ok: false, error: "reply has no signs list" };

  const kept = data.signs
    .slice(0, MAX_SIGNS)
    .filter((s) => !(s && typeof s === "object" && !cleanText(s.text, 300) && !(Array.isArray(s.rules) && s.rules.length)));
  const signs = kept.map((s, i) => validateSign(s, i));
  return { ok: true, signs };
}
