// Sign Cards: one card per sign with its plain rule and a "Use this sign" switch.
import { describeRule, LARGE_ONLY_TEXT } from "./engine/describe.js";
import { RESTRICTIVE_KINDS } from "./engine/validate.js";

const ARROW_TEXT = { left: "Points left", right: "Points right", both: "Points both ways", none: "No arrow" };
const ARROW_ICON = { left: "i-left", right: "i-right", both: "i-both", none: "i-noarrow" };

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}
function icon(id) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", `#${id}`);
  svg.append(use);
  return svg;
}

function accent(sign) {
  if (sign.readable && sign.rules.length && sign.rules.every((r) => r.largeOnly)) return "k-other";
  if (!sign.readable || sign.rules.some((r) => r.condition)) return "k-unsure";
  if (sign.rules.some((r) => RESTRICTIVE_KINDS.includes(r.kind))) return "k-no";
  if (sign.rules.some((r) => r.kind === "time_limit" || r.kind === "meter")) return "k-limited";
  return "k-free";
}

export function createCards(list, { onToggle, onArrow }) {
  let highlighted = [];
  let lastSigns = null;
  let lastKey = "";

  // signs here already carry the driver's arrow fixes, so a fix makes a new list.
  function render(signs, enabled) {
    const key = [...enabled].sort().join(",");
    if (signs === lastSigns && key === lastKey) return;
    lastSigns = signs;
    lastKey = key;
    const active = document.activeElement;
    const focused = active && active.closest && active.closest(".card");
    const focusId = focused ? focused.dataset.sign : null;
    const focusArrow = !!(active && active.classList && active.classList.contains("card-arrow"));
    list.replaceChildren();
    for (const sign of signs) {
      const on = enabled.has(sign.id);
      const li = el("li", `card ${accent(sign)}${on ? "" : " off"}`);
      li.id = `sign-${sign.id}`;
      li.dataset.sign = sign.id;

      const top = el("div", "card-top");
      const num = el("span", "card-num", String(sign.id));
      num.setAttribute("aria-label", `Sign ${sign.id}`);
      const body = el("div", "card-body");
      body.append(el("p", "card-text", sign.text || "(no text)"));

      if (!sign.readable) {
        const u = el("p", "card-unsure");
        const q = el("span", "q");
        q.append(icon("i-q"));
        u.append(q, document.createTextNode("Couldn't read this one"));
        body.append(u);
        if (sign.problem) body.append(el("p", "card-problem", `Reason: ${sign.problem}.`));
      } else {
        for (const text of new Set(sign.rules.map(describeRule))) {
          body.append(el("p", `card-rule${text === LARGE_ONLY_TEXT ? " large" : ""}`, text));
        }
      }
      // The arrow is easy to misread, so the driver can fix it: each tap moves to the next direction.
      const a = el("button", `card-arrow${sign.arrowChecked ? " fixed" : ""}`);
      a.type = "button";
      a.append(icon(ARROW_ICON[sign.arrow]), el("span", null, ARROW_TEXT[sign.arrow]), el("span", "card-arrow-change", sign.arrowChecked ? "Checked" : "Change"));
      a.setAttribute("aria-label", `Sign ${sign.id} arrow: ${ARROW_TEXT[sign.arrow].toLowerCase()}${sign.arrowChecked ? ", set by you" : ""}. Change`);
      a.addEventListener("click", () => onArrow(sign.id));
      body.append(a);
      top.append(num, body);

      const foot = el("div", "card-foot");
      const label = el("label", "switch");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.setAttribute("role", "switch");
      input.checked = on;
      input.setAttribute("aria-label", `Use sign ${sign.id}`);
      input.addEventListener("change", () => onToggle(sign.id, input.checked));
      label.append(input, document.createTextNode("Use this sign"));
      foot.append(label);
      if (!on) foot.append(el("span", "tag tag-off", "Not used"));

      li.append(top, foot);
      list.append(li);
      if (focusId && Number(focusId) === sign.id) (focusArrow ? a : input).focus({ preventScroll: true });
    }
    applyHighlight(false);
  }

  function applyHighlight(scroll) {
    list.querySelectorAll(".card").forEach((c) => {
      const hit = highlighted.includes(Number(c.dataset.sign));
      c.classList.toggle("hl", hit);
      const tag = c.querySelector(".tag-this");
      if (hit && !tag) c.append(el("span", "tag tag-this", "This one"));
      if (!hit && tag) tag.remove();
    });
    if (scroll && highlighted.length) {
      const first = list.querySelector(`#sign-${highlighted[0]}`);
      if (first) {
        const r = first.getBoundingClientRect();
        const box = first.closest(".answer-side");
        const boxR = box ? box.getBoundingClientRect() : { top: 0, bottom: innerHeight };
        const visible = r.top >= Math.max(0, boxR.top) && r.bottom <= Math.min(innerHeight, boxR.bottom);
        if (!visible) first.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
      }
    }
  }

  function highlight(ids, scroll = true) {
    highlighted = ids || [];
    applyHighlight(scroll);
  }

  return { render, highlight };
}
