// App shell: page state, view switching, and wiring.
// Everything lives in memory and is gone on refresh. Photos are never stored.
import { shrinkPhoto, readPhoto, PhotoError } from "./photo.js";
import { createCards } from "./cards.js";
import { createVerdict } from "./verdict.js";
import { buildWeek, verdict, minuteOfWeek, stayMinutesFor, formatBlockTime, withArrows, nextArrow, mondayOf, addDays } from "./engine/rules.js";
import { describeVerdict, describeBlock, describeWeek } from "./engine/describe.js";
import { createGrid } from "./grid.js";

const $ = (s) => document.querySelector(s);
const SLOW_MS = 25000;
const SAMPLE_MIN_MS = 1100;

const state = {
  view: "start",
  photoUrl: null,
  signs: [],
  enabled: new Set(),
  arrows: new Map(), // the driver's arrow fixes: sign id -> arrow
  side: null,
  weekStart: mondayOf(new Date()), // the grid is this real week, Monday first
  startIndex: 0,
  nowIndex: 0,
  chip: "1h",
  selectedBlock: null,
  confirming: true,
  retry: null,
};

let controller = null;
let slowTimer = null;
const hooks = { afterRender: [], onAnswer: [] };
export const app = { state, hooks, render: () => render(), setStart: (i) => setStart(i), select: (i) => select(i) };

const cards = createCards($("#cards"), {
  onToggle(id, on) {
    if (on) state.enabled.add(id);
    else state.enabled.delete(id);
    render();
  },
  onArrow(id) {
    const sign = viewSigns().find((s) => s.id === id);
    const arrow = nextArrow(sign.arrow);
    state.arrows.set(id, arrow);
    render();
    const words = { left: "points left", right: "points right", both: "points both ways", none: "has no arrow" };
    $("#cards-live").textContent = `Sign ${id} ${words[arrow]}. The answer is updated.`;
  },
});
const verdictView = createVerdict($("#verdict"));
const grid = createGrid($("#grid-wrap"), {
  onMove: (i) => setStart(i),
  onSelect: (i) => select(state.selectedBlock === i ? null : i),
});

// Views
function showView(name) {
  state.view = name;
  document.querySelectorAll(".view").forEach((v) => { v.hidden = v.dataset.view !== name; });
  window.scrollTo({ top: 0 });
}

function clearTimers() {
  clearTimeout(slowTimer);
  slowTimer = null;
}

function showReading(photoUrl) {
  state.photoUrl = photoUrl;
  $("#reading-photo").src = photoUrl;
  $("#scan-frame").classList.remove("stopped");
  $("#reading-problem").hidden = true;
  document.querySelector(".reading-status").hidden = false;
  $("#reading-title").textContent = "Reading signs...";
  $("#reading-sub").textContent = "This usually takes about 10 seconds.";
  showView("reading");
  clearTimers();
  slowTimer = setTimeout(() => {
    $("#reading-title").textContent = "Still reading...";
    $("#reading-sub").textContent = "This one is taking a while.";
  }, SLOW_MS);
}

const PROBLEMS = {
  no_signs: ["No signs found", "No parking signs found in this photo. Try again closer to the pole, or try a sample pole."],
  read_failed: ["That didn't work", "Couldn't read this photo right now. Try again, or try a sample pole."],
  too_large: ["That photo is too large", "Try a smaller photo, or try a sample pole."],
};

function showProblem(code) {
  clearTimers();
  const [title, text] = PROBLEMS[code] || PROBLEMS.read_failed;
  $("#scan-frame").classList.add("stopped");
  document.querySelector(".reading-status").hidden = true;
  $("#problem-title").textContent = title;
  $("#problem-text").textContent = text;
  $("#reading-problem").hidden = false;
  $("#retry-btn").focus();
}

function startError(message) {
  const box = $("#start-error");
  box.textContent = message;
  box.hidden = !message;
}

// Getting a pole in
async function startFromFile(file) {
  startError("");
  if (!file) return;
  let shrunk;
  try {
    shrunk = await shrinkPhoto(file);
  } catch {
    startError("That file isn't a photo. Try a JPG or PNG.");
    return;
  }
  state.retry = () => runLive(shrunk);
  runLive(shrunk);
}

async function runLive({ dataUrl, previewUrl }) {
  controller?.abort();
  controller = new AbortController();
  const mine = controller;
  showReading(previewUrl);
  try {
    const result = await readPhoto(dataUrl, mine.signal);
    if (mine.signal.aborted) return;
    clearTimers();
    if (!result.signs.length) return showProblem("no_signs");
    showAnswer(result.signs, previewUrl);
  } catch (err) {
    if (mine.signal.aborted || err.name === "AbortError") return;
    showProblem(err instanceof PhotoError ? err.code : "read_failed");
  }
}

export async function startFromSample(sample, { instant = false } = {}) {
  startError("");
  controller?.abort();
  controller = new AbortController();
  const mine = controller;
  state.retry = () => startFromSample(sample);
  setSampleUrl(sample.id);
  showReading(sample.image);
  try {
    const [reading] = await Promise.all([
      fetch(sample.reading, { signal: mine.signal }).then((r) => {
        if (!r.ok) throw new Error("missing");
        return r.json();
      }),
      new Promise((r) => setTimeout(r, instant ? 0 : SAMPLE_MIN_MS)),
    ]);
    if (mine.signal.aborted) return;
    clearTimers();
    showAnswer(reading.signs, sample.image);
  } catch (err) {
    if (mine.signal.aborted) return;
    showProblem("read_failed");
  }
}

// A sample pole has its own link (/?sample=p63) for sharing; any other view drops it.
function setSampleUrl(id) {
  const url = new URL(location.href);
  if (id) url.searchParams.set("sample", id);
  else url.searchParams.delete("sample");
  if (url.href !== location.href) history.replaceState(null, "", url);
}

function showAnswer(signs, photoUrl) {
  state.signs = signs;
  state.photoUrl = photoUrl;
  state.enabled = new Set(signs.map((s) => s.id));
  state.arrows = new Map();
  $("#cards-live").textContent = "";
  state.side = null;
  const now = new Date();
  state.weekStart = mondayOf(now);
  state.nowIndex = minuteOfWeek(now);
  state.startIndex = state.nowIndex;
  state.chip = "1h";
  state.selectedBlock = null;
  state.confirming = true;
  $("#answer-photo").src = photoUrl;
  const unreadable = signs.filter((s) => !s.readable).length;
  $("#confirm-lead").textContent =
    `We read ${signs.length} sign${signs.length === 1 ? "" : "s"} on this pole` +
    (unreadable ? `, ${unreadable} we couldn't make out. ` : ". ") +
    "Check them below: tap an arrow to fix it, and switch off any sign that looks wrong. " +
    "If a sign is cut off at the edge of your photo, take a new one with the whole pole.";
  $(".answer-layout").classList.add("confirming");
  showView("answer");
  hooks.onAnswer.forEach((f) => f());
  render();
  $("#show-answer-btn").focus();
}

// The answer
function setStart(i) {
  state.startIndex = i;
  render();
}
let highlightScroll = false;
function select(i) {
  state.selectedBlock = i;
  highlightScroll = i !== null;
  render();
}

// The signs as the driver sees them: the reading plus their arrow fixes.
let viewFor = { signs: null, key: "", out: [] };
function viewSigns() {
  const key = [...state.arrows].map((x) => x.join(":")).join(",");
  if (state.signs !== viewFor.signs || key !== viewFor.key) {
    viewFor = { signs: state.signs, key, out: withArrows(state.signs, state.arrows) };
  }
  return viewFor.out;
}

function needsSide() {
  return viewSigns().some((s) => state.enabled.has(s.id) && (s.arrow === "left" || s.arrow === "right"));
}

let lastWeek = null;
let weekFor = { signs: null, key: "", week: null, next: null };
function render() {
  if (state.view !== "answer") return;
  const signs = viewSigns();
  const side = needsSide() ? state.side : null;
  // The week only changes with the signs, the switches, the side, or the dates; reuse it while dragging.
  const key = `${[...state.enabled].sort().join(",")}|${side}|${state.weekStart.getTime()}`;
  if (signs !== weekFor.signs || key !== weekFor.key) {
    const opts = { enabled: state.enabled, side };
    weekFor = {
      signs, key,
      week: buildWeek(signs, { ...opts, weekStart: state.weekStart }),
      // A stay that runs past Sunday night continues into next week's dates.
      next: buildWeek(signs, { ...opts, weekStart: addDays(state.weekStart, 7) }),
    };
  }
  const week = weekFor.week;
  lastWeek = week;
  const none = state.enabled.size === 0;
  const stay = stayMinutesFor(state.chip, state.startIndex);

  let v = null;
  if (none) verdictView.empty();
  else {
    v = verdict(week, state.startIndex, stay, { next: weekFor.next });
    verdictView.show(describeVerdict(v, signs, state.startIndex));
  }

  $("#when-time").textContent = state.startIndex === state.nowIndex
    ? `now (${formatBlockTime(state.startIndex)})`
    : formatBlockTime(state.startIndex);
  $("#now-btn").hidden = state.startIndex === state.nowIndex;

  document.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.chip === state.chip)));

  $("#side-q").hidden = !needsSide();
  document.querySelectorAll(".side-btn").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.side === state.side)));

  cards.render(signs, state.enabled);
  const selected = state.selectedBlock !== null ? week[state.selectedBlock] : null;
  cards.highlight(selected ? selected.causes : [], highlightScroll);
  highlightScroll = false;

  grid.render({ week, startIndex: state.startIndex, stay, todayIndex: state.nowIndex, none, selected: state.selectedBlock });
  $("#grid-caption").textContent = selected && !none ? describeBlock(selected, signs) : none ? "No signs switched on." : "";
  const weekText = none ? "No signs switched on." : describeWeek(week);
  if ($("#week-text").textContent !== weekText) $("#week-text").textContent = weekText;

  hooks.afterRender.forEach((f) => f({ week, verdict: v, stay, none, side }));
}

export function currentWeek() {
  return lastWeek;
}

// Events
$("#camera-input").addEventListener("change", (e) => { startFromFile(e.target.files[0]); e.target.value = ""; });
$("#upload-input").addEventListener("change", (e) => { startFromFile(e.target.files[0]); e.target.value = ""; });
$("#cancel-btn").addEventListener("click", () => { controller?.abort(); clearTimers(); setSampleUrl(null); showView("start"); });
$("#problem-back-btn").addEventListener("click", () => { setSampleUrl(null); showView("start"); });
$("#retry-btn").addEventListener("click", () => state.retry ? state.retry() : showView("start"));
$("#again-btn").addEventListener("click", () => {
  setSampleUrl(null);
  state.signs = [];
  state.enabled = new Set();
  state.photoUrl = null;
  showView("start");
});
$("#show-answer-btn").addEventListener("click", () => {
  state.confirming = false;
  $(".answer-layout").classList.remove("confirming");
  render();
  $("#verdict").scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
});
$("#now-btn").addEventListener("click", () => {
  const now = new Date();
  state.weekStart = mondayOf(now);
  state.nowIndex = minuteOfWeek(now);
  setStart(state.nowIndex);
});
document.querySelectorAll(".chip").forEach((c) => c.addEventListener("click", () => { state.chip = c.dataset.chip; render(); }));
document.querySelectorAll(".side-btn").forEach((b) => b.addEventListener("click", () => { state.side = b.dataset.side; render(); }));

// Start view: example week, sample poles, accuracy card, credits.
function drawDemo() {
  const host = $("#demo-grid");
  if (!host) return;
  // Decorative, shaped like the Los Angeles County sample pole: no parking weekdays
  // 9 to 5; its oversize vehicle sign leaves a regular car's week alone.
  const example = [
    { id: 1, readable: true, arrow: "none", rules: [{ kind: "no_parking", days: ["mon", "tue", "wed", "thu", "fri"], start: "09:00", end: "17:00", limitMinutes: null, metered: false, note: null, condition: null }] },
    { id: 2, readable: true, arrow: "none", rules: [{ kind: "no_parking", days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], start: "01:00", end: "06:00", limitMinutes: null, metered: false, note: null, condition: null, largeOnly: true }] },
  ];
  const week = buildWeek(example, {});
  const colors = { free: "var(--free)", limited: "var(--limited)", no: "var(--no)", unsure: "var(--unsure)" };
  for (let d = 0; d < 7; d++) {
    const col = document.createElement("div");
    col.className = "demo-col";
    let k = 0;
    while (k < 96) {
      const st = week[d * 96 + k].state;
      let e = k;
      while (e < 96 && week[d * 96 + e].state === st) e++;
      if (st !== "free") {
        const s = document.createElement("span");
        s.style.top = `${(k / 96) * 100}%`;
        s.style.height = `${((e - k) / 96) * 100}%`;
        s.style.background = colors[st];
        col.append(s);
      }
      k = e;
    }
    host.append(col);
  }
}

function creditLine(c) {
  const li = document.createElement("li");
  const a = document.createElement("a");
  a.href = c.page;
  a.rel = "noopener";
  a.textContent = c.title;
  li.append(a, document.createTextNode(` by ${c.artist}, `));
  const l = document.createElement("a");
  l.href = c.licenseUrl;
  l.rel = "noopener license";
  l.textContent = c.license;
  li.append(l, document.createTextNode(". Resized."));
  return li;
}

async function loadSamples() {
  const section = $(".samples");
  let samples = [];
  try {
    const r = await fetch("/samples/credits.json");
    if (r.ok) samples = await r.json();
  } catch { /* no samples */ }
  section.hidden = !samples.length;
  const list = $("#sample-list");
  list.replaceChildren();
  for (const s of samples) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sample";
    btn.setAttribute("aria-label", `Sample pole: ${s.name}, ${s.place}`);
    const img = document.createElement("img");
    img.src = s.thumb || s.image;
    img.alt = "";
    img.loading = "lazy";
    img.width = 300;
    img.height = 400;
    const body = document.createElement("span");
    body.className = "sample-body";
    const t = document.createElement("span");
    t.className = "sample-title";
    t.textContent = s.name;
    const m = document.createElement("span");
    m.className = "sample-meta";
    m.textContent = `${s.place} · ${s.signCount} sign${s.signCount === 1 ? "" : "s"}`;
    body.append(t, document.createElement("br"), m);
    btn.append(img, body);
    btn.addEventListener("click", () => startFromSample(s));
    const credit = document.createElement("p");
    credit.className = "sample-credit";
    const a = document.createElement("a");
    a.href = s.page;
    a.rel = "noopener";
    a.textContent = `Photo: ${s.artist}`;
    credit.append(a, document.createTextNode(`, ${s.license}`));
    li.append(btn, credit);
    list.append(li);
    $("#credit-list").append(creditLine(s));
  }
  return samples;
}

async function loadAccuracy() {
  try {
    const r = await fetch("/data/accuracy.json");
    if (!r.ok) return;
    const a = await r.json();
    const set = (k, v) => document.querySelectorAll(`[data-acc="${k}"]`).forEach((n) => { n.textContent = String(v); });
    set("photos", a.photos);
    set("checks", a.checks);
    set("right", a.right);
    set("unsure", a.unsure);
    set("wrongNo", a.wrongNo);
    set("wrongYes", a.wrongYes);
    set("date", new Date(`${a.date}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }));
    $("#accuracy").hidden = false;
  } catch { /* the card stays hidden, never shown with made-up numbers */ }
}

$("#home-link").addEventListener("click", (e) => {
  if (state.view === "start") return;
  e.preventDefault();
  controller?.abort();
  clearTimers();
  setSampleUrl(null);
  showView("start");
});

// /?sample=<id> opens that sample pole straight to the confirm step.
async function openDeepLink(samples) {
  const id = new URL(location.href).searchParams.get("sample");
  if (!id) return;
  const sample = samples.find((s) => s.id === id);
  if (sample) startFromSample(sample, { instant: true });
  else setSampleUrl(null);
}

drawDemo();
loadSamples().then(openDeepLink);
loadAccuracy();
