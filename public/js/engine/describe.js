// Plain-language text for rules, verdicts, blocks, and the week.
// All rule wording in the UI comes from here, so the cards, the grid caption, and
// the verdict always say exactly what the engine uses. No DOM in here.
import { DAYS, parseTime } from "./validate.js";
import { PER_DAY, STEP, WEEK, DAY_SHORT, formatClock, formatBlockTime } from "./rules.js";

const KIND_TEXT = {
  no_parking: "No parking",
  no_standing: "No standing",
  no_stopping: "No stopping",
  permit_only: "Permit holders only",
  commercial_only: "Commercial vehicles only",
  other_restricted: "Restricted",
  free: "Free parking",
};

export function formatLimit(minutes) {
  if (minutes % 60 === 0) return `${minutes / 60} hour`;
  return `${minutes} minute`;
}

export function formatDays(days) {
  if (days.length === 7) return "every day";
  const idx = days.map((d) => DAYS.indexOf(d)).sort((a, b) => a - b);
  const contiguous = idx.every((v, k) => k === 0 || v === idx[k - 1] + 1);
  if (idx.length === 1) return DAY_SHORT[idx[0]];
  if (contiguous && idx.length >= 3) return `${DAY_SHORT[idx[0]]} to ${DAY_SHORT[idx[idx.length - 1]]}`;
  return idx.map((i) => DAY_SHORT[i]).join(", ");
}

// "8:30 to 9:00 AM", "7:00 PM to 7:00 AM", or "" for all day.
export function formatSpan(start, end) {
  const s = parseTime(start);
  const e = parseTime(end);
  if (s === 0 && e === 24 * 60) return "";
  const a = formatClock(s);
  const b = formatClock(e);
  const sameHalf = s < e && a.slice(-2) === b.slice(-2) && e !== 24 * 60;
  return sameHalf ? `${a.slice(0, -3)} to ${b}` : `${a} to ${b}`;
}

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// { from: "04-01", to: "10-31" } -> "Apr 1 to Oct 31"
export function formatSeason(season) {
  const md = (v) => {
    const [m, d] = v.split("-").map(Number);
    return `${MONTH_SHORT[m - 1]} ${d}`;
  };
  return `${md(season.from)} to ${md(season.to)}`;
}

export const LARGE_ONLY_TEXT = "Only for oversized vehicles, not a regular car";

function ruleHead(rule) {
  if (rule.kind === "time_limit") return `${formatLimit(rule.limitMinutes)} parking${rule.metered ? ", pay the meter" : ""}`;
  if (rule.kind === "meter") return rule.limitMinutes ? `Paid parking, ${formatLimit(rule.limitMinutes)} limit` : "Paid parking";
  return KIND_TEXT[rule.kind];
}

// "No parking Tue 8:30 to 9:00 AM, Apr 1 to Oct 31, street cleaning"
export function describeRule(rule) {
  if (rule.largeOnly) return LARGE_ONLY_TEXT;
  const span = formatSpan(rule.start, rule.end);
  const days = formatDays(rule.days);
  let when;
  if (!span) when = days === "every day" ? "anytime" : `${days}, all day`;
  else when = days === "every day" ? span : `${days} ${span}`;
  let text = `${ruleHead(rule)} ${when}`;
  if (rule.season) text += `, ${formatSeason(rule.season)}`;
  const note = rule.note && !ruleHead(rule).toLowerCase().includes(rule.note.toLowerCase()) ? rule.note : null;
  if (note) text += `, ${note}`;
  if (rule.condition) text += `, ${rule.condition}`;
  return text;
}

export function describeSign(sign) {
  if (!sign.readable) return "Couldn't read this one";
  return [...new Set(sign.rules.map(describeRule))].join(". ");
}

function signList(ids) {
  const sorted = [...ids].sort((a, b) => a - b);
  if (sorted.length === 1) return `sign ${sorted[0]}`;
  if (sorted.length === 2) return `signs ${sorted[0]} and ${sorted[1]}`;
  return `signs ${sorted.slice(0, -1).join(", ")} and ${sorted[sorted.length - 1]}`;
}

// A time relative to the start: same day shows just the clock.
function when(index, startIndex) {
  const sameDay = Math.floor(index / PER_DAY) === Math.floor(startIndex / PER_DAY) && index >= startIndex;
  return formatBlockTime(index, !sameDay);
}

function phraseFor(block, signs) {
  const ref = block.refs && block.refs[0];
  const sign = ref && signs ? signs.find((s) => s.id === ref[0]) : null;
  const rule = sign ? sign.rules[ref[1]] : null;
  if (rule && rule.note && /clean|sweep/i.test(rule.note)) return "street cleaning";
  if (rule) return KIND_TEXT[rule.kind].toLowerCase();
  return (block.label || "no parking").toLowerCase();
}

// { word, line, tone } for the giant verdict.
// line examples: "YES, until 4:00 PM", "NO, street cleaning starts 8:30 AM", "NOT SURE: check sign 3".
export function describeVerdict(v, signs, startIndex) {
  if (v.result === "no") {
    let line;
    if (v.why === "over_limit") line = `NO, ${formatLimit(v.limitMinutes)} limit here`;
    else {
      const phrase = phraseFor(v.block, signs);
      if (v.why === "blocked_later") line = `NO, ${phrase} starts ${when(v.atIndex, startIndex)}`;
      else if (v.untilIndex === null) line = `NO, ${phrase} anytime`;
      else line = `NO, ${phrase} until ${when(v.untilIndex, startIndex)}`;
    }
    return { word: "NO", line, tone: "no" };
  }
  if (v.result === "unsure") {
    let line;
    if (v.reasons.includes("side") && v.reasons.length === 1) line = "NOT SURE: which side is your car on?";
    else if (v.reasons.includes("away") && v.reasons.length === 1) line = `NOT SURE: check the arrow on ${signList(v.causes)}`;
    else if (v.reasons.includes("conflict") && v.causes.length > 1) line = `NOT SURE: ${signList(v.causes)} disagree`;
    else line = `NOT SURE: check ${signList(v.causes)}`;
    return { word: "NOT SURE", line, tone: "unsure" };
  }
  let line;
  if (v.why === "limited") {
    const parts = [];
    if (v.limitMinutes) parts.push(`${formatLimit(v.limitMinutes)} limit`);
    if (v.metered) parts.push("pay the meter");
    line = `YES, ${parts.join(", ")}`;
  } else if (v.why === "until") line = `YES, until ${when(v.untilIndex, startIndex)}`;
  else if (v.nextLimit) {
    const what = v.nextLimit.limitMinutes ? `${formatLimit(v.nextLimit.limitMinutes)} limit` : "paid parking";
    line = `YES, ${what} from ${when(v.nextLimitIndex, startIndex)}`;
  } else line = "YES, no limits found this week";
  return { word: "YES", line, tone: "yes" };
}

// Caption for a tapped grid block.
export function describeBlock(block, signs) {
  if (block.state === "free" && !block.causes.length) return "No sign limits parking here at this time.";
  const byId = (id) => signs.find((s) => s.id === id);
  if (block.state === "unsure") {
    if (block.reasons.includes("conflict")) {
      return `Not sure: ${signList(block.causes)} disagree. ` +
        block.causes.map((id) => `Sign ${id}: ${describeSign(byId(id))}`).join(". ");
    }
    return block.causes.map((id) => {
      const s = byId(id);
      if (!s.readable) return `Sign ${id}: Couldn't read this one. Switch it off if it doesn't apply.`;
      if (block.reasons.includes("outside") && !block.refs.some((r) => r[0] === id)) {
        return `Sign ${id} only says when parking is allowed, not what applies at other times.`;
      }
      const ref = block.refs.find((r) => r[0] === id);
      const rule = describeRule(s.rules[ref ? ref[1] : 0]);
      if (block.reasons.includes("side") && (s.arrow === "left" || s.arrow === "right")) {
        return `Sign ${id}: ${rule}. It points ${s.arrow}, so it depends on which side your car is on.`;
      }
      if (block.reasons.includes("away") && (s.arrow === "left" || s.arrow === "right")) {
        return `Sign ${id}: ${rule}. We read its arrow as pointing ${s.arrow}, away from your car, but arrows are easy to misread. Check the arrow on the sign and tap the arrow on its card to fix it.`;
      }
      return `Sign ${id}: ${rule}. The app can't tell if that applies right now.`;
    }).join(" ");
  }
  const seen = new Set();
  return block.refs
    .filter(([id, ri]) => !seen.has(`${id}:${ri}`) && seen.add(`${id}:${ri}`))
    .map(([id, ri]) => `Sign ${id}: ${describeRule(byId(id).rules[ri])}`)
    .join(". ");
}

const STATE_TEXT = (b) => {
  if (b.state === "no") return b.label.toLowerCase();
  if (b.state === "unsure") return "not sure";
  if (b.state === "limited") {
    const parts = [];
    if (b.limitMinutes) parts.push(`${formatLimit(b.limitMinutes)} limit`);
    if (b.metered) parts.push("meter");
    return parts.join(", ");
  }
  return "free";
};

// Text version of the week for screen readers.
// "Mon: free all day. Tue: no parking 8:30 to 9:00 AM, free otherwise."
export function describeWeek(week) {
  const days = [];
  for (let d = 0; d < 7; d++) {
    const runs = [];
    for (let k = 0; k < PER_DAY; k++) {
      const b = week[d * PER_DAY + k];
      const text = STATE_TEXT(b);
      const last = runs[runs.length - 1];
      if (last && last.text === text) last.end = k + 1;
      else runs.push({ text, start: k, end: k + 1 });
    }
    let line;
    if (runs.length === 1) line = `${runs[0].text} all day`;
    else {
      const parts = runs.filter((r) => r.text !== "free").map((r) =>
        `${r.text} ${formatClock(r.start * STEP)} to ${formatClock(r.end * STEP)}`);
      line = parts.join("; ") + (runs.some((r) => r.text === "free") ? "; free otherwise" : "");
    }
    days.push(`${DAY_SHORT[d]}: ${line}.`);
  }
  return days.join(" ");
}

export { WEEK };
