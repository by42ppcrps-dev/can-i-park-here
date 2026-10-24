---
doc: checklist
status: approved
---

# Build Checklist

<!-- Approved: relayed by Matt's operator ("carry the whole build through every step in one session", brief/BUILD-NOTES.md). Matt not live; operator decision (Matt to review). -->

Build mode: fast (Matt's standing choice, "every step verified and committed"; relayed by Matt's operator)

## Slices

- [x] **1. A real photo goes in and the signs it read come back, live**
  Becomes usable: The deployed Worker serves a bare page; uploading a pole photo posts it to `/api/read`, Workers AI reads it, the validator checks the reply, and the page lists the signs as raw cards (text, arrow, rule kinds, Not sure).
  Why now: The riskiest unknowns are all here (image input shape, `guided_json` with images, real Neuron cost, Wrangler config keys, the validator as the AI gate). Live AI only works on the deployed Worker, so the deploy path has to work from slice one. Bootstrapping lives inside this slice.
  PRD ref: `prd.md > Getting a Photo In`, `prd.md > Reading the Signs`, `prd.md > Never a Confident Wrong Yes`
  Spec ref: `spec.md > Worker Router`, `spec.md > Sign Reader`, `spec.md > Reading Validator (shared)`, `spec.md > Photo Input`, `spec.md > External Services and Dependencies`, `spec.md > File Structure`, `spec.md > Data Model`
  Build: Rename branch to main. `package.json` (dev, test, deploy; wrangler@4.150.0 devDependency), `wrangler.jsonc`, `src/worker.js`, `src/read-signs.js`, `src/prompt.js`, `public/js/engine/validate.js`, `public/js/photo.js` (shrink to 1280 px JPEG, cancel), a minimal `public/index.html`, `test/validate.test.js`, `DEPLOY-LOG.md`. Deploy.
  Verify (mechanical): `npm test` passes the validator tests; `npx wrangler deploy` succeeds and the version is logged; one real `curl` POST of a pool photo to the deployed `/api/read` returns validated `{ signs, model, ms }`; 405 on GET and 413 on an oversized body.
  Learner check: Open the live URL on your phone, upload a photo of a sign pole, and see a list of the signs it read within about 10 seconds.
  Commit: `Read signs live: worker, Workers AI reader, validator, upload`

- [x] **2. The signs become a giant, trustworthy answer**
  Becomes usable: After reading, the signs show as numbered sign cards with plain-language rules and "Use this sign" switches; "Show my answer" reveals the giant YES / NO / NOT SURE verdict for right now, the stay chips, and the arrow side question. Switching a card or changing a chip updates the answer instantly.
  Why now: This is the unique kernel: the AI reads, the rules engine decides, and it never gives a confident wrong YES. It must exist and be proven by tests before anything is built around it.
  PRD ref: `prd.md > Confirming the Signs`, `prd.md > Which Side of the Pole`, `prd.md > The Verdict`, `prd.md > Never a Confident Wrong Yes`, `prd.md > Stay Length`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > Rules Engine (shared)`, `spec.md > Plain Language Rule Text (shared)`, `spec.md > Sign Cards`, `spec.md > Arrow Side Question`, `spec.md > Verdict`, `spec.md > Stay Chips`, `spec.md > App Shell and State`, `spec.md > Look and Feel`
  Build: `public/js/engine/rules.js`, `public/js/engine/describe.js`, `public/js/app.js`, `public/js/cards.js`, `public/js/verdict.js`, `public/css/app.css` (palette, type, cards, verdict); tests `test/rules.test.js` (precedence, overnight, Sunday wrap, arrows, conflicts, time limits, street cleaning, all-off) and `test/describe.test.js`.
  Verify (mechanical): `npm test` passes all engine and describe tests, including "no uncertain sign in the stay ever gives YES"; `wrangler dev` serves the page and a scripted check of the page modules loads without errors.
  Learner check: Upload a pole photo, switch one card off and on, change the stay chip, and watch the verdict change. Say whether you trust the answer and why.
  Commit: `Rules engine, sign cards, and the giant verdict`

- [ ] **3. See the whole week and time travel through it**
  Becomes usable: Under the verdict, a Mon to Sun week grid in 15-minute blocks (green, teal with labels, red, amber hatched) with a legend and a screen reader summary. A draggable time travel line (pointer and keyboard) with a stay bracket updates the verdict live; "Back to now" resets it. Tapping a block names the sign behind it and highlights its card.
  Why now: The "oh, that's cool" beat; it depends on the engine from slice 2 and is the main design surface.
  PRD ref: `prd.md > The Week Grid`, `prd.md > Time Travel`, `prd.md > Tap a Block to See Why`
  Spec ref: `spec.md > Week Grid`, `spec.md > Time Travel Line`, `spec.md > Look and Feel`
  Build: `public/js/grid.js` (runs-merged grid, legend, caption, line, bracket, keyboard), wiring in `app.js`, grid styles.
  Verify (mechanical): `npm test` passes; a headless browser run at 390 px and 1440 px loads a reading, drags the line, and confirms the verdict text changes and a block tap highlights a card, with no console errors.
  Learner check: Drag the line across the week until the verdict flips, then tap a red block and see which sign lights up.
  Commit: `Week grid with time travel and tap to explain`

- [ ] **4. It feels like a finished product**
  Becomes usable: A strong start view (wordmark logo, hero, promise, big photo buttons), the reading view with the scan animation and the 25 s "Still reading" message, every empty, error, and no-signs state from the PRD, disclaimer and privacy lines, favicon, social preview image, and a layout that works at 390 px and 1440 px.
  Why now: The hackathon is judged first on design. The behaviors exist; now every screen and state gets finished before real content (samples, accuracy) is dropped in.
  PRD ref: `prd.md > Screens and Layout`, `prd.md > Look and Feel`, `prd.md > States and Boundaries`, `prd.md > Disclaimer and Privacy`
  Spec ref: `spec.md > Look and Feel`, `spec.md > Reading View`, `spec.md > Credits and Disclaimer`
  Build: SVG logo (a P sign tile with a check), favicon, `og.png`, start and reading views, state messages, reduced motion, responsive layout; a test that no UI string contains an em dash.
  Verify (mechanical): `npm test` passes including the em dash test; headless screenshots at 390 px and 1440 px of start, reading, answer, and error states, looked at one by one; deploy and log the version.
  Learner check: Open the live URL on your phone and on a laptop; go through start, reading, and answer, and try a non-photo file. Say what feels unfinished.
  Commit: `Finished design: brand, states, responsive layout`

- [ ] **5. Three real sample poles answer instantly**
  Becomes usable: The start view shows three credited Wikimedia Commons sample poles; tapping one shows the scan, then the saved real reading in under 2 seconds with no AI call.
  Why now: Needs the ground truth file to pick poles the model reads correctly, and the finished design to drop into. Makes the demo instant and free.
  PRD ref: `prd.md > Getting a Photo In`
  Spec ref: `spec.md > Sample Poles`, `spec.md > External Services and Dependencies > Wikimedia Commons`
  Build: `scripts/capture-samples.mjs` (posts candidates to the deployed `/api/read`, validates, saves), resized images in `public/samples/`, `credits.json`, credits on the start view.
  Verify (mechanical): Each saved reading passes `validateReading()` and its verdicts match ground truth at the test times; headless run taps each sample and gets cards in under 2 s with no `/api/read` request; deploy and log.
  Learner check: Tap each sample pole and check the cards against the photo.
  Commit: `Three real sample poles with saved readings and credits`

- [ ] **6. An honest accuracy card**
  Becomes usable: The start view shows "Tested on N real sign photos" with real counts (right, Not sure, wrong NO, wrong YES) and the test date.
  Why now: Measures the reading half that tests can't prove; needs the deployed reader and ground truth. Runs once to protect the free AI quota.
  PRD ref: `prd.md > Accuracy Card`
  Spec ref: `spec.md > Accuracy Card`, `spec.md > Accuracy Test Runner`
  Build: `scripts/accuracy.mjs` (about 30 ground truth photos against the deployed `/api/read`, verdicts at Mon 9:00, Tue 8:45, Sat 14:00, Sun 3:00 with a 1 h stay), `test/accuracy/expected.json`, `report.md`, `public/data/accuracy.json`, the card. If wrong YES is above 0, make the validator or prompt stricter and rerun only the failing photos.
  Verify (mechanical): Script output counts add up to photos × times; the card shows exactly the numbers in `accuracy.json`; the card hides when the file is missing.
  Learner check: Look at the accuracy card and at `test/accuracy/report.md`, and decide whether the numbers are fair to show publicly.
  Commit: `Accuracy run on real photos and the accuracy card`

- [ ] **7. Anyone can understand, run, and reuse it**
  Becomes usable: README (what it is, live link, how to run, how it works, credits), MIT LICENSE, final deploy.
  Why now: Last, because it describes what was actually built and the measured numbers.
  PRD ref: `prd.md > Disclaimer and Privacy`, `prd.md > Product Decisions`
  Spec ref: `spec.md > Where It Runs and How Someone Tries It`
  Build: `README.md`, `LICENSE`, final deploy and log.
  Verify (mechanical): `npm test` passes; em dash scan over README and docs copy; live URL returns 200 for the page, samples, and accuracy file.
  Learner check: Read the README as a stranger would and follow "how to run".
  Commit: `README, license, and final deploy`

## Hands-on Checkpoints

- [ ] Early usable behavior explored: shared with the final review session. Matt's operator does the hands-on checks after the first full build pass and feeds one revision round (operator note). Pending.
- [ ] Final kick-the-tires exploration and feedback completed. Pending: hands-on feedback from Matt's operator, not yet given.

## Final Review

- [ ] Final review complete: feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete: guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed: offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: not started
Route and stops: not started
Edit outcome: not started
Reflection: not started
Activity mode: not started

## Revisions

- Workers AI request uses `response_format: { type: "json_schema" }` instead of `guided_json`. The build confirmed the `image_url` data URL message part and JSON schema mode work on Llama 4 Scout (one reading: 2,591 input and 257 output tokens, about 83 neurons, about 7 s), so roughly 120 live readings fit in the free daily quota.
- Mistral fallback not verified live. The local API token cannot call Workers AI, and adding a public switch to force the fallback was not worth it. It uses the same message shape per the model docs.
- Rules gained an optional `condition` field, and the validator adds one when the sign text names snow, school days, events, or months but the model dropped it. The first live reading (Chicago snow and street cleaning sign) showed the model copies conditions into the text but loses them in the rules. The engine treats conditional rules as Not sure.
- `npm test` runs `node --test "test/*.test.js"`. Node 22 does not accept a bare directory.

- Conflicts are judged per sign. Rules on the same sign combine (a 2 hour limit plus "pay at meter" is one 2 hour metered block), and across signs only two different limits, or free versus paid, count as disagreeing. A "PAY AT METER" sign next to a "2 HOUR PARKING" sign is a normal pairing on real poles, and treating it as a conflict would make most metered poles Not sure.
- The week grid draws each day as a column of positioned runs instead of a 7 by 96 CSS grid. Same look, fewer elements, and simpler drag math.
- `compatibility_date` is 2026-10-13, the newest the local Wrangler runtime supports, so `npm run dev` works.
