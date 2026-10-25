---
doc: spec
status: approved
---
<!-- Approved: relayed by Matt's operator (Matt not live). See devpost/interview-log.md > 4-spec. -->

# Can I Park Here: Technical Spec

Items marked **(operator decision, Matt to review)** were not covered by Matt's answers. See `devpost/interview-log.md > 4-spec`.

## How This Works, In Plain Language

There are three pieces, and one rule: **the AI reads, the rules engine decides.**

1. **The web page** (plain HTML, CSS, and JavaScript, no framework). It takes the photo, shows the scan animation, the sign cards, the verdict, and the week grid. It runs on the phone.
2. **The Worker** (one small Cloudflare Worker). It serves the page and has one job of its own: take a photo, ask the Workers AI vision model to read the signs, and check the model's answer before passing it back. It never stores the photo.
3. **The rules engine** (one plain JavaScript module, shared). It turns the checked sign readings into a week of 15-minute blocks (free, limited, not allowed, not sure) and answers "can I park from this time for this long?". The Worker uses its checking half; the page uses its deciding half, which is why dragging the time travel line is instant: no server trip.

Sample poles skip the AI completely: their readings were captured once and saved as files next to the photos, so the demo is instant and costs no AI quota.

Why this shape: one Worker on the free tier, no database, no storage, no accounts. The only moving part outside the code is the Workers AI call, and it is only on the path for live photos. The engine is plain functions with unit tests, so "never a confident wrong YES" is something we can prove with `npm test`, not just hope for.

## The Core Journey Through the System
PRD ref: `prd.md > The Core Journey`.

1. **Arrive.** The phone loads `/` → the Worker's static assets serve `public/index.html`, CSS, JS, sample thumbnails, and `public/data/accuracy.json` for the accuracy card. (`prd.md > Screens and Layout`)
2. **Give it a pole.**
   - **Sample:** the page fetches `public/samples/<id>.json` (a saved reading) → step 4 with no AI call.
   - **Live photo:** the page shrinks the photo on the phone to a JPEG, longest side 1280 px, and POSTs it as a data URL to `/api/read`. (`prd.md > Getting a Photo In`)
3. **Reading signs.** The page shows the reading view while waiting. The Worker sends the photo and the reading prompt to `@cf/meta/llama-4-scout-17b-16e-instruct`. If that fails, times out, or returns something that fails the check, it tries `@cf/mistralai/mistral-small-3.1-24b-instruct` once. The Worker runs the engine's `validateReading()` on the reply: anything malformed becomes a "not sure" sign instead of being dropped or trusted. It returns `{ signs, model }`. The photo is gone when the request ends. (`prd.md > Reading the Signs`)
4. **Confirm.** The page draws one card per sign. Each card's plain-language rule is written by the engine's `describeRule()` from the structured rule, not by the AI, so the card always says exactly what the engine will use. (`prd.md > Confirming the Signs`)
5. **Result.** The page calls `buildWeek(signs, { enabled, side })` to get 672 blocks (7 days × 96 quarter hours), then `verdict(week, start, stayMinutes)` for the giant answer. (`prd.md > The Verdict`, `prd.md > Never a Confident Wrong Yes`)
6. **Check the week.** The grid draws the 672 blocks. Dragging the line changes `start` and calls `verdict()` again on every move. Tapping a block reads that block's `causes` and highlights those cards. (`prd.md > The Week Grid`, `prd.md > Time Travel`, `prd.md > Tap a Block to See Why`)
7. **Adjust.** A chip changes `stayMinutes`; a card switch or the side question changes `enabled` or `side` and reruns `buildWeek()`. (`prd.md > Stay Length`, `prd.md > Which Side of the Pole`)
8. **Done.** "Check another pole" clears everything in memory and returns to the start view.

```
 phone (public/)                         Worker (src/)                  Workers AI
 ┌──────────────────────┐  POST photo   ┌──────────────────────┐  run  ┌──────────────┐
 │ start → reading      │──────────────→│ /api/read            │──────→│ Llama 4 Scout│
 │                      │               │ validateReading()    │←──────│ (or Mistral) │
 │ cards, verdict, grid │←──────────────│ returns { signs }    │       └──────────────┘
 │ buildWeek, verdict() │  checked JSON └──────────────────────┘
 └──────────────────────┘
        ↑ samples/<id>.json (saved readings, no AI call)
        shared: public/js/engine/*.js (imported by both sides)
```

## Stack

- **Cloudflare Workers with static assets**, free tier. Matt's standing choice; he ships Workers already. Docs: https://developers.cloudflare.com/workers/static-assets/
- **Wrangler** (Workers CLI), v4 or newer, via `npx`. Docs: https://developers.cloudflare.com/workers/wrangler/ . Exact version not verified; use the current one at build time.
- **Workers AI binding** named `AI`. Docs: https://developers.cloudflare.com/workers-ai/configuration/bindings/
  - Primary model `@cf/meta/llama-4-scout-17b-16e-instruct` (vision, 131k context, supports `guided_json`). Docs: https://developers.cloudflare.com/workers-ai/models/llama-4-scout-17b-16e-instruct/ . Matt reports good transcriptions in about 10 s.
  - Fallback `@cf/mistralai/mistral-small-3.1-24b-instruct` (vision, 128k context, supports `guided_json`). Docs: https://developers.cloudflare.com/workers-ai/models/mistral-small-3.1-24b-instruct/
  - Checked 2026-10-24 on the model pages: both IDs exist, both list vision and `guided_json`. **Not verified:** the exact shape for sending an image (neither page shows an image example). Check this first in the build (see `spec.md > Decisions and Open Issues`).
- **Front end:** plain HTML, CSS, and JavaScript ES modules, no framework, no build step. Matt's standing choice. Pointer Events for dragging (https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events); `<input type="file" accept="image/*" capture="environment">` for the camera (https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/capture).
- **Rules engine:** plain JavaScript ES module shared by Worker and browser. Matt's standing choice.
- **Tests:** `node:test` and `node:assert`, Node 20 or newer. Docs: https://nodejs.org/api/test.html . No test libraries.
- **No other dependencies.** `wrangler` is the only dev dependency.

## Where It Runs and How Someone Tries It

- **Needs:** Node 20+, a Cloudflare account logged in with `npx wrangler login` (Workers AI calls go to Cloudflare even in local dev). No API keys or secrets files.
- **Install:** `npm install`
- **Run locally:** `npm run dev` (runs `wrangler dev`), then open http://localhost:8787 . For a phone on the same network, open the laptop's address on port 8787, or use the deployed URL.
- **Tests:** `npm test` (runs `node --test test/`).
- **Demo recording:** open the deployed URL (or localhost) in a phone-sized window. Show: tap a sample pole, scan, cards, switch a card off and back on, verdict, drag the time travel line until the verdict flips, tap a red block, change a stay chip, then one live photo, then the accuracy card.
- **Deploy:** `npm run deploy` (runs `wrangler deploy`) to the reserved Worker `can-i-park-here` at https://can-i-park-here.lumegridai.workers.dev . Free tier.
- **Public steps belong to Matt** (operator decision, Matt to review): the build can deploy for testing, but the public announcement, publishing the GitHub repo under `by42ppcrps-dev` (MIT), and the Devpost text wait for Matt, since he owns anything public. Submission still needs the demo video and public repo; the deployed URL is extra.

## Look and Feel
Carried from `prd.md > Look and Feel` and `scope.md > Inspiration & Identity`.

- **Palette** (CSS custom properties in `public/css/app.css`; operator decision, Matt to review, values to be contrast-checked in the build):
  - `--ink: #111111` text, `--paper: #F7F5F0` page background, `--card: #FFFFFF` sign cards.
  - `--free: #1E7B45` green, white text. Icon: check.
  - `--limited: #0F6E8C` teal, white text, labeled "2H", "1H", "Meter". Icon: clock.
  - `--no: #B3261E` red, white text. Icon: X.
  - `--unsure: #F2B705` amber with black diagonal hatching (`repeating-linear-gradient`), black text. Icon: question mark.
  - All text and colored blocks must meet WCAG AA contrast (4.5:1 for body text, 3:1 for the giant verdict and grid labels).
- **Type:** system sans serif stack (`system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`), no web fonts, so it loads instantly and works offline. Verdict: weight 900, `clamp(3rem, 14vw, 6rem)`. Body at least 18 px. Sign card text uppercase and bold, like the signs.
- **Density:** spacious and calm. One column on phones; on wide screens the grid and cards sit side by side.
- **Sign cards:** white, 2 px black border, small rounded corners, the sign number in a black circle; switched off means 40% opacity with a "Not used" tag.
- **Week grid:** CSS grid, 7 columns × 96 rows. Today's column header says "Today". Legend underneath with icon, color, and word for each state.
- **Motion:** the scan line sweeps the photo in a loop; the verdict cross-fades on change. Respect `prefers-reduced-motion` (no sweep; a static "Reading signs..." message).
- **Light theme only** for daylight readability (operator decision, Matt to review).
- **Copy:** short, plain words. No em dashes anywhere. Never say who or what reviews or checks the work. Credit: "Inspired by Nikki Sylianteng's To Park or Not to Park" linking to https://www.nikkisylianteng.com/parking . Her artwork is not copied.

## Components

### Worker Router
`src/worker.js`. `POST /api/read` goes to the Sign Reader. Requests that match a file in `public/` are served as static assets before Worker code runs; any other path reaching the Worker gets a plain 404. Rejects bodies over 4 MB with 413 and non-POST to `/api/read` with 405.
PRD ref: `prd.md > Getting a Photo In`, `prd.md > Disclaimer and Privacy`.

### Sign Reader
`src/read-signs.js` and `src/prompt.js`. Builds the request to Workers AI, calls the primary model with a 25 s timeout, retries once on the fallback model if the call fails, times out, or the reply fails validation as a whole. Runs `validateReading()` on the reply. Never logs or stores the image. Returns `{ signs, model, ms }` or `{ error: "read_failed" }` (HTTP 502).
The prompt asks the model to: list every sign on the pole from top to bottom; copy the exact text; give the arrow direction; turn each sign into rules from a fixed list of kinds; set `readable: false` instead of guessing when it can't read something; and return only JSON matching the schema in `src/prompt.js` (passed as `guided_json` where the model accepts it).
PRD ref: `prd.md > Reading the Signs`.

### Reading Validator (shared)
`public/js/engine/validate.js`, exported `validateReading(raw)`. Checks the AI's JSON against the Data Model: known `kind`, valid days, `HH:MM` times, sensible limits. A sign that fails any check is kept with `readable: false` and `problem` set, so it shows as a Not sure card. A reply with no `signs` array fails as a whole. Signs with no text and no rules are dropped. Rounds restrictive start times down and end times up to the quarter hour, so rounding can only make the answer stricter.
PRD ref: `prd.md > Never a Confident Wrong Yes`, `prd.md > Confirming the Signs`.

### Rules Engine (shared)
`public/js/engine/rules.js`. Pure functions, no DOM, no clock reads (time is always passed in).
- `buildWeek(signs, { enabled, side })` → 672 blocks. For each block, collect the rules from switched-on signs that cover that quarter hour. A rule **definitely applies** if its sign has no arrow or a double arrow, or its arrow matches `side`. A rule on a left or right arrowed sign while `side` is unknown **might apply**, and so does a rule on a sign pointing away from `side` (arrow direction is often misread, so it is never silently dropped; revised in 5-build). Then decide:
  1. Any clearly read not-allowed rule that definitely applies (`no_parking`, `no_standing`, `no_stopping`, `permit_only`, `commercial_only`, `other_restricted`) → `no`.
  2. Else any unreadable sign, or any rule that only might apply (arrowed, side unknown) → `unsure`, matching `prd.md > Which Side of the Pole`. A sign with unknown times covers every block.
  3. Else two definitely applying allowed rules that disagree (different `limitMinutes`, or metered versus free) → `unsure`.
  4. Else a `time_limit` or `meter` rule → `limited` (with `limitMinutes`, `metered`).
  5. Else → `free`.
  Each block carries `causes` (sign ids behind it) and a short `label`.
- `verdict(week, startIndex, stayMinutes)` → `{ result: "yes" | "no" | "unsure", reason, untilIndex, causes }`. Walks every block of the stay, wrapping past Sunday into Monday. Any `no` → NO. Else any `unsure` → NOT SURE. Else, if a `limited` stretch inside the stay is longer than its limit → NO with the limit named. Else YES, with `untilIndex` set to the first block after the start that is `no` or `unsure` (or none this week).
- `minuteOfWeek(date)` and `formatBlockTime(index)` helpers; Monday 00:00 is index 0. Overnight rules (end before start, like 7 PM to 7 AM) run past midnight into the next day.
- `stayMinutesFor(chip, startIndex)` for "overnight" (until 8:00 AM, per `prd.md > Stay Length`).
PRD ref: `prd.md > The Verdict`, `prd.md > Never a Confident Wrong Yes`, `prd.md > The Week Grid`, `prd.md > Stay Length`.

### Plain Language Rule Text (shared)
`public/js/engine/describe.js`, `describeRule(rule)` and `describeVerdict(v, blocks)`. Turns structured rules into "No parking Tue 8:30 to 9:00 AM, street cleaning" and verdicts into "YES, until 4:00 PM", "NO, 1 hour limit here", "NOT SURE: check sign 3". All UI wording for rules lives here so cards, captions, and the verdict always agree.
PRD ref: `prd.md > Confirming the Signs`, `prd.md > The Verdict`, `prd.md > Tap a Block to See Why`.

### App Shell and State
`public/index.html`, `public/js/app.js`. One page with three `<section>` views (start, reading, answer); only one is visible. Holds the in-memory state (see Data Model), wires the components together, and reruns `buildWeek()`/`verdict()` when state changes.
PRD ref: `prd.md > Screens and Layout`, `prd.md > States and Boundaries`.

### Photo Input
`public/js/photo.js`. Camera and upload inputs, a non-image check, and shrinking on a `<canvas>` to JPEG (longest side 1280 px, quality 0.8). Posts `{ image: "data:image/jpeg;base64,..." }` to `/api/read`. A Cancel uses `AbortController`.
PRD ref: `prd.md > Getting a Photo In`.

### Sample Poles
`public/samples/` holds 3 photos and their saved readings. The page loads the JSON instead of calling `/api/read`. Each saved reading is the real model output captured once with `scripts/capture-samples.mjs`, then passed through `validateReading()`; it is **not** hand-edited (operator decision, Matt to review). If the model misreads a candidate, pick a different photo rather than fixing the JSON. Credits live in `public/samples/credits.json` and show on the start view.
PRD ref: `prd.md > Getting a Photo In`.

### Reading View
Part of `public/index.html` and `public/css/app.css`. The photo with a CSS scan line animation and "Reading signs..."; after 25 s the text changes to "Still reading... this one is taking a while."; Cancel.
PRD ref: `prd.md > Reading the Signs`, `prd.md > States and Boundaries`.

### Sign Cards
`public/js/cards.js`. Renders one card per sign with number, text, plain rule, arrow icon, "Use this sign" switch (a real `<input type="checkbox" role="switch">`), and the amber "Couldn't read this one" state. Exposes `highlight(signIds)`.
PRD ref: `prd.md > Confirming the Signs`.

### Arrow Side Question
In `public/js/app.js` and `public/index.html`. Shown only when a switched-on sign has `arrow` `left` or `right`. Two big buttons; sets `side`.
PRD ref: `prd.md > Which Side of the Pole`.

### Verdict
`public/js/verdict.js`. Renders the giant result (color, icon, word, reason line) in an `aria-live="polite"` region, the chosen time label, and "Back to now". Shows "Switch on at least one sign to get an answer." when nothing is switched on.
PRD ref: `prd.md > The Verdict`, `prd.md > States and Boundaries`.

### Week Grid
`public/js/grid.js`. Draws 672 blocks as runs (neighbouring blocks with the same state and causes merge into one element, so it stays light). Legend. Tap or Enter on a block shows the caption and calls `cards.highlight()`. A visually hidden text summary of the week for screen readers.
PRD ref: `prd.md > The Week Grid`, `prd.md > Tap a Block to See Why`.

### Time Travel Line
In `public/js/grid.js`. A focusable line with a handle. Pointer Events snap to 15-minute steps vertically and to day columns horizontally; arrow keys do the same. Draws the stay bracket, continuing into the next column past midnight. Calls back to the app on every move.
PRD ref: `prd.md > Time Travel`.

### Stay Chips
In `public/index.html` and `public/js/app.js`. Five toggle buttons (`aria-pressed`), default 1 h.
PRD ref: `prd.md > Stay Length`.

### Accuracy Card
In `public/index.html` and `public/js/app.js`. Reads `public/data/accuracy.json` and shows the true counts and test date. If the file is missing, the card is hidden (never shown with made-up numbers).
PRD ref: `prd.md > Accuracy Card`.

### Accuracy Test Runner
`scripts/accuracy.mjs`, run by hand: `node scripts/accuracy.mjs http://localhost:8787`. For each photo in `test/accuracy/photos/`, posts it to `/api/read`, then for each of its 3 test times compares the engine's verdict on the AI reading with the engine's verdict on the hand-written expected rules in `test/accuracy/expected.json` (1 h stay, side as recorded). Counts right, said Not sure, wrong NO, wrong YES, and writes `public/data/accuracy.json`. Also writes a per-photo report to `test/accuracy/report.md` so any wrong YES can be looked at.
PRD ref: `prd.md > Accuracy Card`.

### Credits and Disclaimer
In `public/index.html`. Disclaimer on start and answer views, "Photos are not stored." by the photo buttons, photo credits (author, license, link) from `public/samples/credits.json`, and the Nikki Sylianteng inspiration credit.
PRD ref: `prd.md > Disclaimer and Privacy`, `prd.md > Look and Feel`.

## Data Model

**Sign** (from `validateReading()`; the same shape in saved sample files):
```json
{
  "id": 2,
  "text": "NO PARKING 8:30AM-9AM TUESDAY",
  "readable": true,
  "arrow": "none",
  "problem": null,
  "rules": [
    { "kind": "no_parking", "days": ["tue"], "start": "08:30", "end": "09:00",
      "limitMinutes": null, "metered": false, "note": "street cleaning" }
  ]
}
```
- `arrow`: `none` | `left` | `right` | `both`.
- `kind`: `no_parking` | `no_standing` | `no_stopping` | `time_limit` | `meter` | `free` | `permit_only` | `commercial_only` | `other_restricted`.
- `days`: any of `mon`..`sun`. "Anytime" is all seven days, `00:00` to `24:00`.
- `readable: false` means Not sure; `rules` may then be empty (unknown times cover the whole week).
- `id` is the position on the pole, 1 at the top.

**Block** (from `buildWeek()`, never stored): `{ state: "free" | "limited" | "no" | "unsure", limitMinutes, metered, causes: [signId], label }`, 672 per week.

**Page state** (in memory in `public/js/app.js`, gone on refresh):
`{ view, photoUrl, signs, enabled: Set<signId>, side: "left" | "right" | null, startIndex, chip, selectedBlock }`.
- Updated by: photo or sample choice (`signs`), card switches (`enabled`), side buttons (`side`), dragging and "Back to now" (`startIndex`), chips (`chip`), grid taps (`selectedBlock`).
- When the user leaves and comes back: nothing is kept. The start view shows again. (`prd.md > States and Boundaries`)

**Files on disk** (read-only at runtime): `public/samples/<id>.jpg`, `public/samples/<id>.json`, `public/samples/credits.json`, `public/data/accuracy.json`.

**Photos:** live only in the phone's memory and in the single `/api/read` request. No KV, R2, D1, or logs of image data.

## File Structure

```
can-i-park-here/
├── public/                      # everything the browser loads (Workers static assets)
│   ├── index.html               # the one page: start, reading, answer views; credits; disclaimer
│   ├── css/
│   │   └── app.css              # palette, type, cards, grid, scan animation
│   ├── js/
│   │   ├── app.js               # page state, view switching, wiring, chips, side question, accuracy card
│   │   ├── photo.js             # camera/upload, shrink to JPEG, POST /api/read, cancel
│   │   ├── cards.js             # sign cards, switches, highlight
│   │   ├── verdict.js           # giant verdict, reason line, time label, Back to now
│   │   ├── grid.js              # week grid, legend, tap to explain, time travel line
│   │   └── engine/              # shared with the Worker; no DOM in here
│   │       ├── validate.js      # validateReading(): checks AI JSON, marks Not sure
│   │       ├── rules.js         # buildWeek(), verdict(), time helpers
│   │       └── describe.js      # plain-language rule and verdict text
│   ├── samples/
│   │   ├── <id>.jpg             # 3 Wikimedia Commons sample poles
│   │   ├── <id>.json            # saved real readings for each sample
│   │   └── credits.json         # author, license, source URL per photo
│   └── data/
│       └── accuracy.json        # true counts from the last accuracy run
├── src/
│   ├── worker.js                # router: /api/read, else static assets
│   ├── read-signs.js            # Workers AI call, timeout, fallback, validation
│   └── prompt.js                # reading prompt and JSON schema
├── test/
│   ├── rules.test.js            # engine: precedence, arrows, overnight, limits, wrap, all-off
│   ├── validate.test.js         # validator: bad JSON, unknown kinds, rounding
│   ├── describe.test.js         # plain-language text
│   └── accuracy/
│       ├── photos/              # 20+ Commons test photos
│       ├── expected.json        # hand-written expected rules, side, and 3 test times per photo
│       ├── credits.json         # author, license, source URL per test photo
│       └── report.md            # per-photo results from the last run
├── scripts/
│   ├── capture-samples.mjs      # one-time: read the 3 sample photos and save their JSON
│   └── accuracy.mjs             # run the accuracy test, write public/data/accuracy.json
├── wrangler.jsonc               # name can-i-park-here, main src/worker.js, assets ./public, ai binding AI
├── package.json                 # scripts: dev, test, deploy; devDependency wrangler
├── LICENSE                      # MIT
├── README.md                    # what it is, how to run, credits, disclaimer
└── devpost/                     # Devpost learning workspace
```

`wrangler.jsonc` outline (check key names against current Wrangler docs in the build):
```jsonc
{
  "name": "can-i-park-here",
  "main": "src/worker.js",
  "compatibility_date": "<today at build time>",
  "assets": { "directory": "./public" },
  "ai": { "binding": "AI" }
}
```

## External Services and Dependencies

### Workers AI
- **Call:** `await env.AI.run(model, input)` inside the Worker. No HTTP endpoint or key in code; the binding handles auth.
- **Input (planned, image shape not verified):**
  ```js
  {
    messages: [
      { role: "system", content: READING_PROMPT },
      { role: "user", content: [
        { type: "text", text: "Read every parking sign on this pole, top to bottom." },
        { type: "image_url", image_url: { url: "data:image/jpeg;base64,..." } }
      ] }
    ],
    guided_json: SIGNS_SCHEMA,
    temperature: 0,
    max_tokens: 1500
  }
  ```
- **Response:** `{ response: <string or object> }`; parse JSON if it is a string, then `validateReading()`.
- **Docs:** https://developers.cloudflare.com/workers-ai/ , model pages linked in `spec.md > Stack`.
- **Cost and limits** (pricing page checked 2026-10-24, https://developers.cloudflare.com/workers-ai/platform/pricing/): free allocation 10,000 Neurons per day, reset 00:00 UTC. Llama 4 Scout: 24,545 Neurons per million input tokens, 77,273 per million output tokens. Mistral Small 3.1: 31,876 and 50,488. **Estimate, not verified:** if one photo is about 2,000 input tokens and the reply about 800 output tokens, a reading is about 110 Neurons, roughly 90 live readings per day free. Measure the real cost of one reading in the build. Samples cost nothing.
- **Privacy:** this app does not store photos. Any claim about what Cloudflare does with inputs must be checked against Cloudflare's own docs before going in public copy.

### Wikimedia Commons
- Source of sample and test photos, from `brief/commons-candidates.tsv` (file name, URL, license). Photos are downloaded once into the repo; no runtime calls.
- Each use needs author, license, and source link. CC BY-SA photos are used unmodified (resizing only) and credited. Reuse guide: https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia
- The TSV has license but not author; get the author from each file page.

### Cloudflare Workers hosting
- Free tier, reserved name `can-i-park-here`. Docs: https://developers.cloudflare.com/workers/platform/limits/ . Free plan request limits are far above PoC needs (not re-verified).

## Important Failure Modes

- **The model invents or garbles signs, or returns broken JSON** → `validateReading()` turns bad signs into Not sure cards; a fully broken reply triggers the fallback model, then "Couldn't read this photo right now. Try again, or try a sample pole." The engine never treats a bad sign as permission. The accuracy run counts wrong YES on its own line so this stays visible.
- **Live reading is slow, down, or out of free quota** → 25 s timeout per model, one fallback, then the same friendly error. Sample poles never depend on the AI, so the demo always works.
- **Week and time math off by one** (midnight, Sunday into Monday, overnight rules, the stay bracket crossing days) → unit tests in `test/rules.test.js` cover each before the grid is built.
- **Phone photo won't decode** (for example HEIC on some browsers) → canvas decode fails → "That file isn't a photo. Try a JPG or PNG." Check on an iPhone early.

## What Was Simplified and Why

- **Saved readings for the 3 samples** instead of live calls every time. Instant demo, no quota burn. Labeled as saved readings in the code and README; live photos still run the real AI.
- **One generic week of 15-minute blocks** instead of a real calendar. Parking signs repeat weekly; holidays are out (`prd.md > Deferred From the POC`). A calendar would need per-city holiday data.
- **Shrink on the phone, no storage** instead of uploading to cloud storage. Smaller, faster, and nothing to delete.
- **Switch off a card** instead of editing it. A rule editor would double the confirm step (`prd.md > Deferred From the POC`).
- **Accuracy test run by hand and saved as JSON** instead of computed live. The numbers are real and dated; a live dashboard proves nothing more.
- **No framework, no build step.** Matt's choice; it also means the files in `public/` are exactly what the browser runs.

## Decisions and Open Issues

**Matt's choices (from his standing answers):**
- Cloudflare Workers free tier with static assets and a Workers AI binding. Tradeoff accepted: depends on Cloudflare's model availability and free quota.
- Llama 4 Scout primary, Mistral Small 3.1 fallback; strict JSON from the model, validated on the server.
- Plain HTML/CSS/JS, mobile-first, big type, high contrast, never color alone.
- Rules engine in plain JS, shared by Worker and browser, unit tested with `node:test`.
- Saved results for the 3 sample poles; uploads run live.
- Worker `can-i-park-here`; public MIT repo under `by42ppcrps-dev`.
- Build in fast mode, every step verified and committed (to be confirmed in `5-build`).

**Implementation details derived from those choices (agent):**
- Engine split into `validate.js`, `rules.js`, `describe.js` under `public/js/engine/` so the browser can load it and the Worker bundles the same files.
- 672 quarter-hour blocks; restrictive times rounded outward.
- Card wording comes from `describeRule()`, never from the AI.
- Photo shrink to 1280 px JPEG; 4 MB request cap; 25 s timeout.

**Operator decisions (Matt to review):**
- Saved sample readings are real model output, never hand-edited.
- Accuracy method: AI reading versus hand-written expected rules at 3 fixed times per photo, 1 h stay.
- Public deploy announcement and repo publishing wait for Matt.
- Palette hex values and light theme only.

**One useful unknown.** Matt did not raise a technical uncertainty in his answers. Taken from his learning goal instead: *"How do we know the app is trustworthy, not just 'working'?"* (operator decision, Matt to review, on using this as the unknown). What clarifies it:
- Trust in the **deciding** half is proven by unit tests: every precedence rule in `prd.md > Never a Confident Wrong Yes` gets a test, including "no input with an uncertain sign in the stay ever gives YES".
- Trust in the **reading** half can't be proven by tests, only measured: the accuracy run on 20+ real photos, with wrong YES counted separately.
- Evidence needed during the build: `npm test` passing with those cases, and `test/accuracy/report.md` with the real counts.

**To verify early in the build:**
1. The image input shape for both models on Workers AI (the `image_url` message part is assumed). Make one real call with a sample photo before building the Sign Reader around it.
2. Whether `guided_json` works with image input on both models; if not, rely on the prompt plus `validateReading()`.
3. Real Neuron cost of one reading.
4. Current Wrangler config key names for assets and AI.

**Carried from `prd.md > Open Questions`:**
- Which 3 sample poles and which 20+ test photos (from `brief/commons-candidates.tsv`; build time).
- Any public ticket statistic must be checked against a citable source (`6-ship`).
