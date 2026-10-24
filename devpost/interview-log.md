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

---

## 3-prd

**Where are we.** `learner-profile.md`, and `scope.md` with `status: approved`. No `prd.md`. Began fresh.

**Frame.** Explained a PRD as the non-technical description of what the project does: what someone sees, does, and gets back. Still the smallest proof of concept.

**Q1 (core journey, batch). In `scope.md > The Core Loop` you described snap, read, confirm, verdict, week. What should someone see first when they open it? And after the photo is read, what do they see before they get an answer?**
Quoted (must-haves 1 to 3): "Take or upload a photo of a sign pole, or tap one of 3 sample poles (real CC-licensed photos from Wikimedia Commons, credited)." "'Reading signs' state with a scan animation over the photo." "Confirm step: show the signs the AI read as plain cards (sign text + rule it means). The user can switch off a card that's wrong before trusting the answer."
Operator decision (Matt to review): one page with three views (start, reading, answer); the confirm step lives on the answer view so cards stay visible for tap-to-highlight and live switch changes. Start view layout and copy ("Snap the sign pole. Get one clear answer.") are operator decisions.

**Q2 (design beat). If we leave visuals unspecified, the build tends toward generic AI-app styling. What should it look and feel like: type, colors, references?**
Quoted: "Plain HTML/CSS/JS front end, no framework, mobile-first, big type, high contrast, accessible colors (do not rely on color alone: icons/labels too)." Week grid colors from must-have 5: "green (free), blue/teal (allowed with a time limit or meter, labeled), red (not allowed)." Reference: Nikki Sylianteng, credited, artwork not copied.
Operator decision (Matt to review): amber hatched blocks for Not sure in the grid; sign-like white cards; a plain heavy sans serif; no gradients.

**Q3 (behaviors and proof, batch). What does the answer say, exactly, and how would you know it's right? What does a stay length change?**
Quoted (must-haves 4, 6, 8): "a giant verdict for the chosen time and stay length (e.g. green 'YES, until 4:00 PM' / red 'NO, street cleaning starts 8:30 AM' / amber 'NOT SURE: check sign 3')." "Stay length chips (15 min, 1 h, 2 h, 4 h, overnight). Verdict checks the whole stay." "Never a confident wrong YES: when uncertain, say Not sure."
Operator decisions (Matt to review): stricter sign wins (allowed versus not allowed is a NO, not a Not sure, otherwise the brief's own "NO, street cleaning starts 8:30 AM" example could never happen on a metered block); NO beats NOT SURE; NOT SURE beats YES; "rules conflict" means two allowed rules disagreeing for the same hours; permit and commercial-only rules count as not allowed for an everyday driver; default stay 1 h; overnight ends 8:00 AM.

**Q4 (week grid and time travel). When someone drags the line or taps a block, what exactly happens?**
Quoted (must-have 5): "A draggable 'time travel' line; dragging updates the verdict live. Tapping a grid block shows which sign caused it (highlight that sign card)."
Operator decisions (Matt to review): 15-minute drag steps, sideways drag changes day, stay bracket below the line, keyboard arrows, "Back to now", one generic week (dragging to Monday means the next Monday), hour labels every 2 hours.

**Q5 (what-ifs, batch). What happens with an arrow sign, an unreadable sign, no signs at all, or a failed reading?**
Quoted (must-have 7): "if signs have arrows, the user says which side of the pole the car is on; rules apply accordingly." (must-have 3): "Show 'Not sure' instead of guessing if a sign is unreadable or rules conflict."
Operator decisions (Matt to review): left/right question wording and arrow meaning; until answered, arrowed hours are Not sure; "No parking signs found" state; failure message pointing to sample poles; all cards switched off shows no answer (not YES); 25 second "Still reading" message; nothing persists after refresh.

**Q6 (accuracy card). What does "honest" look like on the accuracy card?**
Quoted (must-have 9): "test on 20+ real sign photos with hand-checked answers; show true counts only." Plus: "No mention of who or what reviews or checks the work in public copy."
Operator decision (Matt to review): 3 fixed test times per photo; counts shown as right, Not sure, wrong NO, wrong YES; test date shown; expected answers listed in the repo for Matt to look over before publishing.

**Q7 (boundary).** No new scope surfaced. Card editing was the one tempting addition (implied by "switch off a card that's wrong"); deferred because switching off covers it. Operator decision (Matt to review). .ics stays deferred per the brief.

**Explore more or review.** Readiness criteria met. Drafted `devpost/prd.md` with `status: draft` and saved it. Review format: markdown.

**Feedback given at review.**
Scope said "the verdict checks the whole stay"; now it is defined minute by minute, with exact precedence between YES, NO, and NOT SURE. The journey closes and every behavior has checkable criteria. The now/deferred split is firm. The biggest soft spot is how many product calls were operator decisions, especially the precedence rules in `prd.md > Never a Confident Wrong Yes`; those deserve Matt's eye first.

**Q. Does this look good, or would you change anything?**
Answer: approved. Relayed by Matt's operator. Set `status: approved`.

---

## 4-spec

**Where are we.** `learner-profile.md`; `scope.md` and `prd.md` both `status: approved`. No `spec.md`. Began fresh.

**Frame.** Explained a technical spec as the blueprint for how the PRD gets built: tools, pieces, and how data moves. Matt owns the important choices; recommendations need his agreement.

**Calibration.** Matt ships Workers and directs agents daily, so his established stack was honored, not re-litigated. Focus went to the unresolved parts.

**Q1 (preferences and learning goal). What do you want out of the build technically: a familiar tool, a new one, or just working code?**
Quoted: "Cloudflare Workers (free tier) with static assets and a Workers AI binding." "Plain HTML/CSS/JS front end, no framework." "Rules engine in plain JS shared by worker and browser, unit tested with node:test." Learning goal carried from the profile: "plan with an AI before building so a small app comes out polished and trustworthy, not just 'working'."

**Q2 (where it runs). Submission needs a short demo video and a public GitHub repo; deployment is optional. Do you want people to try a live link too?**
Quoted: "Worker name: can-i-park-here (already reserved, URL https://can-i-park-here.lumegridai.workers.dev). Repo: public on GitHub under by42ppcrps-dev, MIT license." So yes, deployed.
Operator decision (Matt to review): the build may deploy for testing, but publishing the repo and anything public waits for Matt, per "Matt owns product direction and anything public."

**Q3 (architecture, batch). In `prd.md > Reading the Signs` the AI reads the photo. Which models, and how do we keep the AI from deciding? In `prd.md > Getting a Photo In` the samples must be instant. Where does their reading come from?**
Quoted: "Primary model @cf/meta/llama-4-scout-17b-16e-instruct (vision, returns good transcriptions in ~10 s); fallback @cf/mistralai/mistral-small-3.1-24b-instruct. Ask the model for strict JSON; validate on the server." "Cache the AI result for the 3 sample poles (precomputed JSON) so the demo is instant and does not burn the free AI quota; uploads run live."
Checked on Cloudflare's docs (2026-10-24): both model IDs exist and list vision and `guided_json`; free tier is 10,000 Neurons per day. The image input format is not shown on either model page, so it is flagged to verify first in the build.
Derived (agent implementation detail, follows from the above): validator and engine live in `public/js/engine/` so both sides import the same files; card wording is generated by the engine, not the AI.
Operator decision (Matt to review): saved sample readings are real model output, never hand-edited.

**Q4 (where data lives). In `prd.md > States and Boundaries` nothing persists. Is there anything that should survive a refresh?**
Derived from "Photos are not stored" and the cut list (no accounts): no. All state lives in page memory; no KV, R2, D1, or image logs.

**Design carry-forward.** No new design questions; `prd.md > Look and Feel` translated to CSS variables and type rules. Operator decision (Matt to review): exact hex values, light theme only.

**One useful unknown.** Matt raised no technical uncertainty in his answers. Operator decision (Matt to review): used his learning goal as the unknown, "How do we know the app is trustworthy, not just 'working'?". Clarified as: the deciding half is proven by unit tests on every precedence rule; the reading half can only be measured, by the 20+ photo accuracy run with wrong YES counted separately. Recorded in `spec.md > Decisions and Open Issues`.

**Q5 (simplify).** No new complexity appeared, so no new cuts were asked for. Agreed simplifications (saved sample readings, one generic week, shrink on phone, switch instead of edit, offline accuracy run, no framework) are recorded in `spec.md > What Was Simplified and Why`.

**Self-review (agent).** Fixed: arrowed signs with unknown side now give Not sure rather than NO, matching `prd.md > Which Side of the Pole`; router wording for unmatched paths; reduced-motion wording. Every PRD behavior heading has a component.

**Explore more or review.** Readiness criteria met. Drafted `devpost/spec.md` with `status: draft` and saved it. Review format: markdown.

**Feedback given at review.**
Every PRD behavior has a home, and the stack is the one Matt already ships, which keeps the build risk on the product rather than the tools. It is sized right: one Worker, no storage, one external call. The biggest risk is the unverified image input shape for Workers AI; it is first on the verify list. The accuracy test is the most work outside the app itself and could shrink toward 20 photos if time runs short.

**Q. Does this look good, or would you change anything?**
Answer: approved. Relayed by Matt's operator. Set `status: approved`.

**Not run:** `5-build` (no app code written), per the session instructions.
