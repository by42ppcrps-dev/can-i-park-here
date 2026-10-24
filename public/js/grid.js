// Week Grid and Time Travel Line.
// Each day is a column of runs (neighbouring blocks with the same state and signs merge).
// The line marks the chosen time; dragging it or using arrow keys moves it in 15-minute steps.
import { PER_DAY, WEEK, STEP, DAY_SHORT, formatClock, formatBlockTime } from "./engine/rules.js";

const ICON = { free: "i-check", limited: "i-clock", no: "i-x", unsure: "i-q" };
const STATE_WORD = { free: "Free", limited: "Time limit", no: "Not allowed", unsure: "Not sure" };

function h(tag, cls, attrs = {}) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
}
function svgIcon(id) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", `#${id}`);
  svg.append(use);
  return svg;
}

// Merge a day's 96 blocks into runs.
export function dayRuns(week, day) {
  const runs = [];
  for (let k = 0; k < PER_DAY; k++) {
    const i = day * PER_DAY + k;
    const b = week[i];
    const key = `${b.state}|${b.label}|${b.causes.join(",")}|${b.reasons.join(",")}`;
    const last = runs[runs.length - 1];
    if (last && last.key === key) last.end = k + 1;
    else runs.push({ key, start: k, end: k + 1, block: b, index: i });
  }
  return runs;
}

export function createGrid(wrap, { onMove, onSelect }) {
  const grid = h("div", "grid");
  const corner = h("div", "grid-day");
  corner.setAttribute("aria-hidden", "true");
  grid.append(corner);
  const heads = DAY_SHORT.map((d) => {
    const head = h("div", "grid-day");
    head.textContent = d;
    grid.append(head);
    return head;
  });

  const hours = h("div", "grid-hours");
  hours.setAttribute("aria-hidden", "true");
  for (let hr = 0; hr <= 24; hr += 2) {
    const s = h("span");
    s.textContent = formatClock(hr * 60).replace(":00", "");
    s.style.top = `${(hr / 24) * 100}%`;
    if (hr === 0) s.style.transform = "translateY(0)";
    if (hr === 24) s.style.transform = "translateY(-100%)";
    hours.append(s);
  }
  grid.append(hours);

  const cols = DAY_SHORT.map((d, day) => {
    const col = h("div", "grid-col", { role: "group", "aria-label": DAY_SHORT[day] });
    col.dataset.day = day;
    grid.append(col);
    return col;
  });

  // The line, its handle, and the stay bracket live inside whichever column they need.
  const line = h("div", "tline");
  const handle = h("div", "tline-handle", { role: "slider", tabindex: "0", "aria-label": "Time travel: the time you would park", "aria-valuemin": "0", "aria-valuemax": String(WEEK - 1) });
  line.append(handle);
  const stays = DAY_SHORT.map(() => h("div", "stay"));

  wrap.replaceChildren(grid);

  let current = { week: null, startIndex: 0, stay: 60, selected: null };

  function drawRuns(week) {
    cols.forEach((col, day) => {
      col.replaceChildren();
      for (const run of dayRuns(week, day)) {
        const b = run.block;
        const btn = h("button", `run ${b.state}`, { type: "button" });
        btn.style.top = `${(run.start / PER_DAY) * 100}%`;
        btn.style.height = `${((run.end - run.start) / PER_DAY) * 100}%`;
        btn.dataset.index = run.index;
        btn.dataset.end = day * PER_DAY + run.end;
        const what = b.state === "no" ? b.label : b.state === "limited" ? `${STATE_WORD.limited} ${b.label}` : STATE_WORD[b.state];
        btn.setAttribute("aria-label", `${DAY_SHORT[day]} ${formatClock(run.start * STEP)} to ${formatClock(run.end * STEP)}: ${what}`);
        const tall = run.end - run.start >= 4;
        if (tall && b.state !== "free") {
          if (b.state === "limited" && b.label) {
            const lab = h("span", "run-label");
            lab.textContent = b.label.replace(" Meter", " $").replace("Meter", "$");
            btn.append(lab);
          } else btn.append(svgIcon(ICON[b.state]));
        }
        col.append(btn);
      }
    });
  }

  function place() {
    const { startIndex, stay } = current;
    const day = Math.floor(startIndex / PER_DAY);
    const row = startIndex % PER_DAY;
    line.style.top = `${(row / PER_DAY) * 100}%`;
    if (line.parentNode !== cols[day]) {
      // Moving a focused element out of the DOM blurs it, so keep keyboard focus.
      const hadFocus = document.activeElement === handle;
      cols[day].append(line);
      if (hadFocus) handle.focus({ preventScroll: true });
    }
    handle.setAttribute("aria-valuenow", String(startIndex));
    handle.setAttribute("aria-valuetext", formatBlockTime(startIndex));

    // Stay bracket, continuing into the next columns past midnight.
    stays.forEach((s) => s.remove());
    let left = Math.max(1, Math.ceil(stay / STEP));
    let d = day;
    let r = row;
    let used = 0;
    while (left > 0 && used < 7) {
      const take = Math.min(left, PER_DAY - r);
      const s = stays[used];
      s.style.top = `${(r / PER_DAY) * 100}%`;
      s.style.height = `${(take / PER_DAY) * 100}%`;
      s.style.borderTop = used === 0 ? "0" : "";
      cols[d].append(s);
      left -= take;
      d = (d + 1) % 7;
      r = 0;
      used++;
    }
    cols.forEach((c) => c.querySelectorAll(".run.selected").forEach((x) => x.classList.remove("selected")));
    if (current.selected !== null) {
      const sday = Math.floor(current.selected / PER_DAY);
      for (const btn of cols[sday].querySelectorAll(".run")) {
        if (current.selected >= Number(btn.dataset.index) && current.selected < Number(btn.dataset.end)) btn.classList.add("selected");
      }
    }
  }

  function render({ week, startIndex, stay, todayIndex, none, selected }) {
    grid.classList.toggle("empty", !!none);
    const today = Math.floor(todayIndex / PER_DAY);
    heads.forEach((head, d) => {
      head.classList.toggle("today", d === today);
      head.replaceChildren();
      if (d === today) {
        const s = h("small");
        s.textContent = "Today";
        head.append(s);
      }
      head.append(document.createTextNode(DAY_SHORT[d]));
    });
    cols.forEach((c, d) => c.classList.toggle("today", d === today));
    if (week !== current.week) drawRuns(week);
    current = { week, startIndex, stay, selected };
    place();
  }

  // Pointer position -> block index.
  function indexAt(x, y) {
    let day = 0;
    let best = Infinity;
    cols.forEach((c, d) => {
      const r = c.getBoundingClientRect();
      const dist = x < r.left ? r.left - x : x > r.right ? x - r.right : 0;
      if (dist < best) { best = dist; day = d; }
    });
    const r = cols[day].getBoundingClientRect();
    const row = Math.min(PER_DAY - 1, Math.max(0, Math.floor(((y - r.top) / r.height) * PER_DAY)));
    return day * PER_DAY + row;
  }

  // Dragging: from the handle with any pointer; from anywhere on the grid with a mouse.
  let drag = null;
  function startDrag(e) {
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, fromHandle: e.target === handle };
    if (drag.fromHandle) {
      e.preventDefault();
      drag.moved = true;
      grid.classList.add("dragging");
    }
    grid.setPointerCapture(e.pointerId);
  }
  grid.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    if (e.target === handle || e.pointerType === "mouse") startDrag(e);
  });
  grid.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
    drag.moved = true;
    grid.classList.add("dragging");
    const i = indexAt(e.clientX, e.clientY);
    if (i !== current.startIndex) onMove(i);
  });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const wasDrag = drag.moved;
    drag = null;
    grid.classList.remove("dragging");
    if (wasDrag) handle.focus({ preventScroll: true });
    else if (e.type === "pointerup" && e.target !== handle) onSelect(indexAt(e.clientX, e.clientY));
    // A mouse press is fully handled here; ignore the click that follows.
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 0);
  };
  let suppressClick = false;
  grid.addEventListener("pointerup", endDrag);
  grid.addEventListener("pointercancel", endDrag);

  // Tap (or Enter) on a block explains it.
  grid.addEventListener("click", (e) => {
    if (suppressClick) return;
    const run = e.target.closest(".run");
    if (!run) return;
    const i = e.detail === 0 ? Number(run.dataset.index) : indexAt(e.clientX, e.clientY);
    onSelect(i);
  });

  handle.addEventListener("keydown", (e) => {
    const steps = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -PER_DAY, ArrowRight: PER_DAY, PageUp: -4, PageDown: 4 }[e.key];
    if (steps === undefined) return;
    e.preventDefault();
    onMove((((current.startIndex + steps) % WEEK) + WEEK) % WEEK);
  });

  return { render };
}
