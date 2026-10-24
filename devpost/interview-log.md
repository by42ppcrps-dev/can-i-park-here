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
