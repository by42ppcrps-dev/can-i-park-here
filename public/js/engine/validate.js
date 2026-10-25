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

  let season = null;
  if (r.season !== null && r.season !== undefined) {
    season = validateSeason(r.season);
    if (!season) return { problem: "season dates are unclear" };
  }

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
      season,
      largeOnly: r.largeOnly === true,
    },
  };
}

// Seasons are "MM-DD" pairs, inclusive, and may wrap over New Year (11-01 to 03-31).
const MONTH_DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function validMonthDay(value) {
  if (typeof value !== "string") return null;
  const m = /^(\d{1,2})-(\d{1,2})$/.exec(value.trim());
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  if (month < 1 || month > 12 || day < 1 || day > MONTH_DAYS[month - 1]) return null;
  return `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function validateSeason(season) {
  if (!season || typeof season !== "object") return null;
  const from = validMonthDay(season.from);
  const to = validMonthDay(season.to);
  return from && to ? { from, to } : null;
}

const MONTH_NUM = {
  JAN: 1, JANUARY: 1, FEB: 2, FEBRUARY: 2, MAR: 3, MARCH: 3, APR: 4, APRIL: 4, MAY: 5,
  JUN: 6, JUNE: 6, JUL: 7, JULY: 7, AUG: 8, AUGUST: 8, SEP: 9, SEPT: 9, SEPTEMBER: 9,
  OCT: 10, OCTOBER: 10, NOV: 11, NOVEMBER: 11, DEC: 12, DECEMBER: 12,
};
const MONTH_WORD = "(JAN(?:UARY)?|FEB(?:RUARY)?|MAR(?:CH)?|APR(?:IL)?|MAY|JUNE?|JULY?|AUG(?:UST)?|SEPT?(?:EMBER)?|OCT(?:OBER)?|NOV(?:EMBER)?|DEC(?:EMBER)?)";
const SEASON_WORDS = new RegExp(`\\b${MONTH_WORD}\\.?\\s*(\\d{1,2})?(?:ST|ND|RD|TH)?\\s*(?:-|TO|THRU|THROUGH)\\s*${MONTH_WORD}\\.?\\s*(\\d{1,2})?(?:ST|ND|RD|TH)?\\b`, "i");
const SEASON_NUMBERS = /\b(\d{1,2})\/(\d{1,2})\s*(?:-|TO|THRU|THROUGH)\s*(\d{1,2})\/(\d{1,2})\b/i;

// The date range printed on a sign, or null. "APRIL 1-OCT 31" -> { from: "04-01", to: "10-31" }.
// A month with no day runs from its first to its last day ("APR - NOV").
export function seasonFromText(text) {
  if (!text) return null;
  let m = SEASON_WORDS.exec(text);
  if (m) {
    const fm = MONTH_NUM[m[1].toUpperCase()];
    const tm = MONTH_NUM[m[3].toUpperCase()];
    const fd = m[2] ? Number(m[2]) : 1;
    const td = m[4] ? Number(m[4]) : MONTH_DAYS[tm - 1];
    return validateSeason({ from: `${fm}-${fd}`, to: `${tm}-${td}` });
  }
  m = SEASON_NUMBERS.exec(text);
  if (m) return validateSeason({ from: `${m[1]}-${m[2]}`, to: `${m[3]}-${m[4]}` });
  return null;
}

// Words that show a rule only binds big vehicles (LA's "VEHICLES OVER 8' WIDE").
const LARGE_WORDS = /\bVEHICLES?\b[^.]{0,20}\b(OVER|EXCEEDING|MORE THAN|ABOVE|LONGER|HIGHER|WIDER)\b|\b(OVER|EXCEEDING)\s*\d+\s*(FT|FEET|'|TONS?|LBS|POUNDS)|\bOVER-?SIZED?\b|\bTRUCKS?\b|\bRVS?\b|\bMOTOR ?HOMES?\b|\bCAMPERS?\b|\bTRAILERS?\b|\bBUS(ES)? PARKING\b|\bNO BUS(ES)?\b|\bCOMMERCIAL VEHICLES?\b|\bTONS?\b|\bLBS\b|\bGROSS WEIGHT\b/i;
// Wording that turns it around: only big vehicles may park, so a regular car may not.
const LARGE_REVERSED = /\b(EXCEPT|ONLY|LOADING)\b|\bBUS (STOP|ZONE|LANE)\b/i;

export function largeVehicleSign(text) {
  return !!text && LARGE_WORDS.test(text) && !LARGE_REVERSED.test(text);
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
  // A season must be the one printed on the sign. A season the text doesn't show,
  // or one that differs from it, makes the sign Not sure: a made up season would
  // switch a rule off on days it is really in force.
  const printed = seasonFromText(sign.text);
  if (sign.rules.some((r) => r.season)) {
    const wrong = sign.rules.some((r) => r.season && (!printed || r.season.from !== printed.from || r.season.to !== printed.to));
    if (wrong) {
      sign.readable = false;
      sign.problem = sign.problem || (printed ? "season dates don't match the sign" : "season dates not found on the sign");
    }
  }
  // "Only big vehicles" is trusted only when the sign text says so. Otherwise the
  // rule applies to every car, which can only make the answer stricter.
  if (!largeVehicleSign(sign.text)) {
    sign.rules = sign.rules.map((r) => (r.largeOnly ? { ...r, largeOnly: false } : r));
  }
  // The model sometimes drops a condition it did copy into the text. If the text
  // says "when snow", "school days", or names months it didn't turn into a season,
  // nothing on the sign is treated as certain. This can only make the answer stricter.
  const hint = conditionHint(sign.text, { seasonRead: sign.rules.some((r) => r.season) });
  if (hint && sign.rules.length && sign.rules.every((r) => !r.condition)) {
    sign.rules = sign.rules.map((r) => (r.largeOnly ? r : { ...r, condition: hint }));
  }
  return sign;
}

const MONTHS = /\b(JAN|JANUARY|FEB|FEBRUARY|MAR|MARCH|APR|APRIL|MAY|JUN|JUNE|JUL|JULY|AUG|AUGUST|SEPT?|SEPTEMBER|OCT|OCTOBER|NOV|NOVEMBER|DEC|DECEMBER)\b\.?\s*\d{0,2}\s*(-|TO|THRU|THROUGH)/i;
const SEASONAL = /\bSEASONAL\b/i;
const CONDITIONS = [
  [/\bSNOW/i, "when it snows"],
  [/\bSCHOOL/i, "on school days"],
  [/\b(EVENTS?|GAME DAYS?|STADIUM)\b/i, "during events"],
  [/\bEMERGENC/i, "during emergencies"],
  [SEASONAL, "only some months of the year"],
  [/\b(WHEN|LORSQUE)\b/i, "only under a condition on the sign"],
  [/\b(SUNSET|SUNRISE|DUSK|DAWN)\b/i, "hours set by sunrise or sunset"],
];

export function conditionHint(text, { seasonRead = false } = {}) {
  if (!text) return null;
  if (!seasonRead && (MONTHS.test(text) || seasonFromText(text))) return "only some months of the year";
  for (const [re, label] of CONDITIONS) {
    if (seasonRead && re === SEASONAL) continue;
    if (re.test(text)) return label;
  }
  return null;
}

// Returns { ok: true, signs } or { ok: false, error }.
export function validateReading(raw) {
  const data = parseRaw(raw);
  if (!data || typeof data !== "object") return { ok: false, error: "reply is not JSON" };
  if (!Array.isArray(data.signs)) return { ok: false, error: "reply has no signs list" };

  // Empty entries are dropped, but a sign the model says it couldn't read (cut off by
  // the photo edge, too blurry) is kept even with no words: it makes the answer Not sure.
  const reported = (s) => s.readable === false && cleanText(s.problem, 120);
  const kept = data.signs
    .slice(0, MAX_SIGNS)
    .filter((s) => !(s && typeof s === "object" && !cleanText(s.text, 300) && !(Array.isArray(s.rules) && s.rules.length) && !reported(s)));
  // Exemption panels ("EXCEPT VEHICLES WITH PERMITS") only loosen a rule for some
  // vehicles, never for an everyday driver, so a ruleless one is safe to leave out.
  const signs = kept
    .filter((s) => !(s && typeof s === "object" && /^\s*EXCEPT/i.test(cleanText(s.text, 300)) && !(Array.isArray(s.rules) && s.rules.length)))
    .map((s, i) => validateSign(s, i));
  return { ok: true, signs };
}
