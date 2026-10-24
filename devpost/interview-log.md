# Interview Log: Can I Park Here

This is the honest record of the planning interviews for `1-start`, `2-scope`, `3-prd`, and `4-spec`.

**How this session ran.** Matt Brady (the learner) was not live. His operations assistant relayed his standing answers in `brief/LEARNER-ANSWERS.md` (dated Sat Oct 24, 2026). Each question below is the one the skill would have asked. Each answer is either:

- **Quoted**: taken word for word from that file.
- **Derived**: a direct restatement or combination of lines in that file, with the source line named.
- **Operator decision (Matt to review)**: not covered by the file; the option most consistent with it was chosen. Matt should confirm or change these.

Approvals recorded here were relayed by Matt's operator, not given live by Matt. Skill prompts that originally contained em dashes are reworded with commas or colons, per the no em dash rule.

---

## 1-start

**Where are we.** `devpost/` did not exist. No `learner-profile.md`, `scope.md`, `prd.md`, `spec.md`, or `checklist.md`. First visit.

**Folder check.** The folder contained only course material (`.git`, `.agents/skills`, `agent/skills`, `skills-lock.json`). No unrelated project. Passed. Created `devpost/`.

**Gitignore.** Added `/devpost/learner-profile.md`, `.env`, `.env.*` (allowing `.env.example`), and `.dev.vars` (Workers local secrets) to `.gitignore`. Note: the profile is ignored, so it is not in commits; this log is committed and contains a short summary of the same background answers. Operator decision (Matt to review): keep this log committed, since the public repo is meant to show the planning process.

**Welcome.** Delivered the standard welcome copy (concise version, since Matt prefers a fast pace).

**Q1. What would you like to build? If you're still looking for an idea, tell me what interests you.**
Quoted: "Problem: stacked parking sign poles are confusing; people get tickets or towed, or circle the block afraid to park." "Core promise: snap the pole, get one clear answer for right now, and see the whole week at a glance." "The AI reads the signs (vision model); a plain, testable rules engine decides. The AI never decides 'yes' by itself."

**Q2. What's your experience with coding and AI coding agents, and have you used a plan-first or spec-driven workflow before?**
Quoted: "Directs coding agents daily; ships Cloudflare Workers. Not a hand coder by habit."
Plan-first experience: not stated. Recorded as "not established". Operator decision (Matt to review): treat as newer to plan-first than to agents, because the learning goal is about learning to plan first.

**Pacing offer (grouped vs one at a time).** Not asked; already stated. Quoted: "Prefers plain language, fast pace, concise batches of questions."

**Q3. What's one thing you'd like to get better at or understand by the end?**
Quoted: "Wants to learn: how to plan with an AI before building so a small app comes out polished and trustworthy, not just 'working'."

**Optional: get to know you better?**
Skipped the invitation, as the skill says to when concise onboarding is preferred. Inspiration was already volunteered. Quoted: "Inspiration: designer Nikki Sylianteng's 'To Park or Not to Park' week-grid sign redesign (credit her as inspiration; do not copy her artwork)."

**Review format.** Volunteered, so recorded now. Quoted: "Review format: markdown."

**Output.** `devpost/learner-profile.md` written (gitignored).

---

## 2-scope

**Where are we.** `learner-profile.md` exists. No `scope.md`. Began fresh, shaping the idea Matt brought (no discovery needed).

**Frame.** Explained scope as the broad overview of what is in and out, sized to a proof of concept. Speech-to-text tip given once. Questions batched two or three at a time, per Matt's preference.

**Q1 (brain dump). Tell me everything. What's the idea? What excites you about it? Who would use it? What does it look like in your head?**
Quoted: "Every city driver has stared at a pole of 4 signs doing mental math." "Who: everyday city drivers, visitors, new drivers, people with low English literacy or dyslexia, anyone in a hurry." "Core promise: snap the pole, get one clear answer for right now, and see the whole week at a glance." Plus the full must-have list (items 1 to 10 in the brief).

**Q2 (sharpen the gaps). Who is the one person you picture using it, and what do they do today instead?**
Derived from the "Problem" and "Who" lines: a driver at a stacked pole who today guesses, risks a ticket or tow, or circles the block afraid to park.

**Q3 (kernel). What's distinctive about your version of this idea?**
Quoted: "The AI reads the signs (vision model); a plain, testable rules engine decides. The AI never decides 'yes' by itself." and must-have 8: "Never a confident wrong YES: when uncertain, say Not sure." The week grid with a draggable time travel line (must-have 5) is the visible half of the kernel.

**Q4 (define done). What does someone open, what do they do, and what do they see that proves it works?**
Derived from must-haves 1 to 5 and 9: tap a sample pole or snap one, see the scan animation, check the sign cards, get a giant verdict, drag the time travel line and watch the verdict change, tap a block to see which sign caused it, and see an honest accuracy card. Reminded that submission needs a short demo video and a public GitHub repo; deployment is optional.

**Q5 (cut).** The boundary was already set, so summarized it instead of asking for more cuts.
Quoted (out of scope): "Accounts, maps/GPS, payments, meter apps, crowdsourcing, native app, multiple languages (maybe later), reminders beyond an optional .ics 'move my car' download (nice-to-have only)."
- .ics download placed in **Later**, consistent with "nice-to-have only". Operator decision (Matt to review): Later rather than now, to protect the 2 to 4 hour target.
- Reasons given for each cut in `scope.md > Explicitly Cut` are derived from the brief's intent (one photo is the input; nothing to save). Operator decision (Matt to review): wording of those reasons.

**Explore more or review.** Readiness criteria met (user, loop, proof, boundary). Drafted `devpost/scope.md` with `status: draft` and saved it.

**Review format.** Already set: markdown. No HTML companion.

**Feedback given at review.**
Sharp: the kernel is a real trust mechanism ("AI reads, rules decide, Not sure beats a wrong YES"), and the user is specific. The cut list is clean.
Soft: the "now" list is ambitious for 2 to 4 hours (ten must-haves, including arrow side and a 20+ photo accuracy test). The build should sequence the kernel first (sample pole, cards, verdict, grid) so arrow side and the accuracy card can shrink if time runs short. "Hand-checked answers" needs an owner for the hand check; carried to the PRD.

**Q. Does this look good, or would you change anything?**
Answer: approved. Relayed by Matt's operator under the brief's instruction to build from these standing answers. Set `status: approved`.
