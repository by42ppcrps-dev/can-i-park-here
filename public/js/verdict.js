// Verdict: the giant answer, its reason line, and the chosen time.
const ICONS = { yes: "#i-check", no: "#i-x", unsure: "#i-q" };

export function createVerdict(root) {
  const word = root.querySelector("#verdict-word");
  const line = root.querySelector("#verdict-line");
  const use = root.querySelector(".verdict-ico use");
  let last = "";

  function show({ tone, word: w, line: l }) {
    const key = `${tone}|${w}|${l}`;
    if (key === last) return;
    const toneChanged = !last.startsWith(`${tone}|`);
    last = key;
    root.classList.remove("yes", "no", "unsure", "empty");
    root.classList.add(tone);
    if (ICONS[tone]) use.setAttribute("href", ICONS[tone]);
    word.textContent = w;
    // The reason line repeats the word, so screen readers hear one clear sentence.
    const rest = l.replace(/^(YES|NO|NOT SURE)(, |: )/, "");
    line.textContent = rest ? rest[0].toUpperCase() + rest.slice(1) : "";
    if (toneChanged) {
      root.classList.remove("fade");
      void root.offsetWidth;
      root.classList.add("fade");
    }
  }

  function empty() {
    show({ tone: "empty", word: "Switch on at least one sign to get an answer.", line: "" });
  }

  return { show, empty };
}
