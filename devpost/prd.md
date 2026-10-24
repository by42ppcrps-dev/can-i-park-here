---
doc: prd
status: approved
---
<!-- Approved: relayed by Matt's operator (Matt not live). See devpost/interview-log.md > 3-prd. -->

# Can I Park Here: Product Requirements

A mobile-first web app for city drivers standing at a confusing parking sign pole: snap the pole, check what was read, and get one clear answer for right now plus the whole week at a glance.
Source: `scope.md > The Unique Kernel`, `scope.md > Who It's For`, `scope.md > The Core Loop`.

Items marked **(operator decision, Matt to review)** were not covered by Matt's answers and were chosen to fit them. See `devpost/interview-log.md > 3-prd`.

## The Core Journey
Source: `scope.md > The Core Loop`, `scope.md > What "Working" Looks Like`.

1. **Arrive.** The driver opens the app on their phone. They see the name, one line of promise, a big "Take a photo" button, an "Upload a photo" link, three sample pole thumbnails, and the disclaimer.
2. **Give it a pole.** They take or upload a photo, or tap a sample pole.
3. **Reading signs.** The photo fills the screen with a scan animation sweeping over it and the words "Reading signs...". Sample poles finish almost instantly; live photos take about 10 seconds. A Cancel button returns to the start.
4. **Confirm.** The signs appear as numbered cards, top to bottom as they sit on the pole. Each card shows what the sign says and the rule it means in plain words. Each card has a switch, on by default. Unreadable signs show "Couldn't read this one" in amber. If any sign has an arrow, the app asks which side of the pole the car is on. The driver switches off anything wrong and taps "Show my answer".
5. **Result.** A giant verdict for right now and the selected stay length (default 1 h): green YES, red NO, or amber NOT SURE, with one plain line saying why and until when.
6. **Check the week.** Below the verdict, the week grid shows Mon to Sun with hours down the side, colored by what is allowed. A time travel line marks the chosen moment. Dragging it moves the chosen day and time, and the verdict updates live. Tapping any colored block names the sign behind it and highlights that card.
7. **Adjust.** Tapping a stay chip (15 min, 1 h, 2 h, 4 h, overnight) rechecks the whole stay. Switching a card off or on rechecks everything.
8. **Done.** The driver parks (or doesn't). "Check another pole" returns to the start. Success is the driver trusting the answer because they can see where it came from.

## Screens and Layout
One page with three views that replace each other in place. **(operator decision, Matt to review: single page, three views, no separate routes.)**

- **Start view.** Top to bottom: app name, promise line ("Snap the sign pole. Get one clear answer."), big "Take a photo" button, "Upload a photo" link, "Or try a sample pole" with three tappable photo thumbnails (each with a short credit line), the accuracy card, the disclaimer, and a credits footer (photo credits and "Inspired by Nikki Sylianteng's To Park or Not to Park").
- **Reading view.** The photo, full width, with the scan animation over it, "Reading signs..." status text, and Cancel.
- **Answer view.** Top to bottom:
  1. The giant verdict and its reason line.
  2. Chosen time label ("Tue 3:15 PM") with a "Back to now" button.
  3. Stay length chips.
  4. Arrow side question (only when needed).
  5. The week grid with its legend.
  6. Sign cards, each with its switch, next to a small copy of the photo.
  7. "Check another pole" button and the disclaimer.

The confirm step (journey step 4) is the answer view with the verdict area collapsed and a "Show my answer" button above the cards; tapping it reveals the verdict, chips, and grid and scrolls to the verdict. The cards stay on the answer view so a grid tap can highlight them and a switch change updates the answer live. **(operator decision, Matt to review.)**

## Look and Feel
Source: `scope.md > Inspiration & Identity`.

- **One glance, one answer.** The verdict is the biggest thing on the screen, readable at arm's length.
- **Big type, high contrast, mobile-first.** Works one-handed on a phone in daylight.
- **Never color alone.** Every color has an icon and a word: YES with a check, NO with an X, NOT SURE with a question mark; grid blocks carry short labels or patterns, and a legend explains them.
- **Grid colors.** Green: free parking. Blue/teal: allowed with a time limit or meter, labeled (for example "2H", "Meter"). Red: not allowed. Amber with diagonal hatching: not sure. (Amber in the grid is an operator decision, Matt to review; the brief lists three colors, and Not sure needs a visible home.)
- **Reference:** Nikki Sylianteng's "To Park or Not to Park" week-grid sign redesign (https://www.nikkisylianteng.com/parking). Credit her as inspiration; do not copy her artwork.
- **Sign cards feel like signs** (operator decision, Matt to review): white cards with strong black text and the sign's own red or green accents, so the card visibly matches the photo.
- **Type** (operator decision, Matt to review): a plain, sturdy sans serif with a very heavy weight for the verdict. No decorative fonts, no gradients, no generic AI-app styling.
- **Copy tone:** short, plain words. No em dashes anywhere in UI text. Public copy never says who or what reviews or checks the work.

## Features and Behavior

### Getting a Photo In
Source: `scope.md > The POC Boundary`.

- As a driver at a pole, I want to snap the pole or pick a sample so that I can get an answer in one tap.
  - [ ] "Take a photo" opens the phone's camera (rear camera where available); on a laptop it opens a file picker.
  - [ ] "Upload a photo" accepts an image from the device.
  - [ ] Each of the three sample poles shows a real CC-licensed Wikimedia Commons photo with its author and license credited on the start view.
  - [ ] Tapping a sample pole goes straight to the reading view and shows cards in under 2 seconds.
  - [ ] Choosing a non-image file shows "That file isn't a photo. Try a JPG or PNG." and stays on the start view.

### Reading the Signs
Source: `scope.md > The Unique Kernel`.

- As a driver, I want to see that it is working while it reads so that I don't give up during the wait.
  - [ ] The reading view shows the photo with a scan line sweeping over it and "Reading signs...".
  - [ ] Cancel returns to the start view and discards the result.
  - [ ] When reading finishes, the confirm step appears with one card per sign found.
- The AI only reads. It produces sign text and a structured rule for each sign; it never produces the verdict.

### Confirming the Signs
Source: `scope.md > The Unique Kernel`, `scope.md > The POC Boundary`.

- As a driver who doesn't fully trust a robot, I want to see what it read and switch off anything wrong so that the answer is based on signs I agree with.
  - [ ] Each card shows: sign number (1 is the top of the pole), the sign text as read, the rule in plain words (for example "No parking Tue 8:30 to 9:00 AM, street cleaning"), an arrow icon if the sign has one, and an on/off switch labeled "Use this sign".
  - [ ] A sign the reader couldn't make out shows "Couldn't read this one" in amber with a question mark icon, and counts as Not sure while switched on.
  - [ ] Switching a card off greys it out and removes its rule from the verdict and grid immediately.
  - [ ] Cards can be switched off and on again at any time on the answer view.
  - [ ] Cards cannot be edited in the proof of concept (see Deferred).

### Which Side of the Pole
Source: `scope.md > The POC Boundary` (arrow side).

- As a driver parked next to a pole with arrows, I want to say which side my car is on so that only the signs for my side apply.
  - [ ] When any switched-on sign has a left or right arrow, the question "Facing the signs, is your car to the left or right of the pole?" appears with two big buttons (Left, Right), each with an arrow icon.
  - [ ] Until answered, any time covered by an arrowed sign shows Not sure, and the verdict says "NOT SURE: which side is your car on?" if it matters for the stay.
  - [ ] Once answered, a sign pointing left applies only to the left side, a sign pointing right only to the right; double arrows and no arrow apply to both sides.
  - [ ] The answer can be changed at any time and the result updates immediately.
  - Arrow meaning (operator decision, Matt to review): the arrow points along the curb to the stretch of street the sign covers, as seen when facing the sign.

### The Verdict
Source: `scope.md > What "Working" Looks Like`.

- As a driver in a hurry, I want one giant answer for my whole stay so that I don't do mental math.
  - [ ] The verdict checks every minute from the chosen time to the chosen time plus the stay length.
  - [ ] **YES** (green, check icon) only when every minute of the stay is allowed by switched-on, clearly read signs. Reason line examples: "YES, until 4:00 PM" (parking stops being allowed at 4:00 PM), "YES, 2 hour limit, pay the meter", "YES, no limits found this week".
  - [ ] **NO** (red, X icon) when any minute of the stay is not allowed by a clearly read sign, or the stay is longer than a time limit. Reason line examples: "NO, street cleaning starts 8:30 AM", "NO, no parking until 7:00 PM", "NO, 1 hour limit here".
  - [ ] **NOT SURE** (amber, question mark icon) when nothing clearly says NO but anything uncertain touches the stay. Reason line names the sign: "NOT SURE: check sign 3", or "NOT SURE: signs 2 and 4 disagree", or "NOT SURE: which side is your car on?".
  - [ ] The verdict text is announced to screen readers when it changes.
  - [ ] Times show in the device's local time, 12-hour format with AM/PM.

### Never a Confident Wrong Yes
Source: `scope.md > The Unique Kernel`.

The rules that decide between YES, NO, and NOT SURE:
  - [ ] A clearly read "not allowed" rule always beats an "allowed" rule for the same minute on the same side (the stricter sign wins). This is a NO, not a Not sure.
  - [ ] NO beats NOT SURE: if a clearly read sign forbids part of the stay, the verdict is NO even if another sign is unreadable. (operator decision, Matt to review; NO is never a dangerous mistake for the driver.)
  - [ ] NOT SURE beats YES: any switched-on sign that is unreadable, low confidence, or whose rule is incomplete makes every minute it might cover Not sure. If its times are unknown, that is the whole week until it is switched off.
  - [ ] Two switched-on signs that disagree about the same allowed time on the same side (for example a 1 hour limit and a 2 hour limit for the same hours) are Not sure. (operator decision, Matt to review: this is what "rules conflict" means here, since stricter-sign-wins already settles allowed versus not allowed.)
  - [ ] Rules for other vehicles or permits ("Commercial vehicles only", "Permit holders only", bus stops, taxi stands) count as not allowed for an everyday driver, labeled with the reason. (operator decision, Matt to review.)
  - [ ] Signs the app does not understand are never ignored silently: they show as a Not sure card the driver can switch off.
  - [ ] No combination of inputs produces YES while any switched-on sign covering the stay is uncertain.

### The Week Grid
Source: `scope.md > What "Working" Looks Like` (the "oh, that's cool" beat).

- As a driver, I want to see the whole week at a glance so that I know when to move my car.
  - [ ] Seven columns, Mon to Sun, with today's column marked "Today". Hours run down the side, 12 AM at the top to 12 AM at the bottom, with labels every 2 hours (operator decision, Matt to review).
  - [ ] Blocks start and end at the true sign times (to the quarter hour), not rounded to the hour.
  - [ ] Colors and labels follow `prd.md > Look and Feel`; a legend sits under the grid.
  - [ ] The grid reflects the current switches and arrow side.
  - [ ] A text version of the week ("Mon: free all day. Tue: no parking 8:30 to 9:00 AM ...") is available to screen readers.

### Time Travel
Source: `scope.md > What "Working" Looks Like`.

- As a driver planning ahead, I want to drag to any time this week and see the answer for then so that I can plan when I'll come back.
  - [ ] A bold horizontal line sits in the chosen day's column at the chosen time, with a handle. It starts at right now.
  - [ ] Dragging it up or down changes the time in 15-minute steps; dragging it sideways changes the day.
  - [ ] A shaded bracket below the line shows the stay length, continuing into the next day's column if the stay passes midnight.
  - [ ] The verdict, the reason line, and the chosen time label update live while dragging, with no lag a person would notice.
  - [ ] Keyboard: with the line focused, Up/Down move 15 minutes, Left/Right move a day.
  - [ ] "Back to now" returns the line to the current time.
  - The grid covers one generic week, so dragging to "Monday" means the next occurrence of Monday. (operator decision, Matt to review.)

### Tap a Block to See Why
Source: `scope.md > The Core Loop` (glance at the sign cards).

- As a skeptical driver, I want to tap a red block and see which sign made it red so that I can check that sign myself.
  - [ ] Tapping any colored block shows a caption under the grid: "Sign 3: No parking Tue 8:30 to 9:00 AM, street cleaning".
  - [ ] The matching card is highlighted (outline and a "This one" tag) and scrolled into view if it is off screen.
  - [ ] Tapping a green block with no rule says "No sign limits parking here at this time."
  - [ ] Tapping a Not sure block names the uncertain sign(s).

### Stay Length
Source: `scope.md > The POC Boundary`.

- As a driver, I want to say how long I'm staying so that the answer covers my whole stay, not just this minute.
  - [ ] Chips: 15 min, 1 h, 2 h, 4 h, overnight. One is always selected; default 1 h (operator decision, Matt to review).
  - [ ] Overnight means from the chosen time until 8:00 AM the next morning (or 8:00 AM the same day if the chosen time is before 8:00 AM). (operator decision, Matt to review.)
  - [ ] Changing the chip updates the verdict and the bracket immediately.
  - [ ] A stay longer than a time limit gives NO with the limit named.

### Accuracy Card
Source: `scope.md > What "Working" Looks Like`.

- As a cautious driver, I want to see how often it gets things right so that I know how much to trust it.
  - [ ] A small card on the start view: "Tested on N real sign photos" with true counts at fixed test times: right answers, Not sure answers, wrong NO answers, and wrong YES answers, each as a plain number.
  - [ ] N is at least 20. The numbers are whatever the test produced, good or bad; never rounded up or hidden.
  - [ ] The card shows the date the test was run.
  - [ ] The card does not say who or what checked the answers.
  - Method (operator decision, Matt to review): each test photo gets hand-written expected rules, and each photo is checked at 3 fixed times. The expected answers are listed in the repo for Matt to look over before the numbers go public.

### Disclaimer and Privacy
Source: `scope.md > Inspiration & Identity`.

  - [ ] "A reading aid. Always double-check the sign." appears on the start view and the answer view.
  - [ ] "Photos are not stored." appears next to the photo buttons.
  - [ ] Uploaded photos are used only to read the signs and are not kept after the answer comes back.

## States and Boundaries

- **First use.** Start view with sample poles and the accuracy card. No setup, no sign-in.
- **Reading.** Scan animation and status text. Live photos take about 10 seconds; after 25 seconds the text changes to "Still reading... this one is taking a while." (operator decision, Matt to review).
- **No signs found.** "No parking signs found in this photo. Try again closer to the pole, or try a sample pole." with Try again and Back buttons.
- **Some signs unreadable.** Normal cards plus amber "Couldn't read this one" cards; the verdict follows `prd.md > Never a Confident Wrong Yes`.
- **Every card switched off.** Verdict area says "Switch on at least one sign to get an answer." The grid shows empty, not green. (operator decision, Matt to review: no signs is not the same as free parking.)
- **Reading failed** (network, timeout, or live reading unavailable). "Couldn't read this photo right now. Try again, or try a sample pole." Nothing half-finished is shown.
- **Not a photo / too large.** Non-images are refused with a message; large photos are shrunk on the phone before sending.
- **Nothing persists.** Closing or refreshing the page returns to the start view. No history, no saved poles. Photos are not stored anywhere.
- **Time zone.** The chosen time uses the phone's clock and time zone; the app assumes you are standing at the pole.
- **Holidays and suspensions.** Not known to the app. The disclaimer covers this.

## Product Decisions

From Matt's answers:
- The AI reads; the rules engine decides; the AI never decides yes. Reason: trust.
- Never a confident wrong YES; Not sure instead. Reason: a wrong YES costs a ticket or a tow.
- Confirm step with switches before trusting the answer. Reason: the driver stays in control of what counts.
- Week grid with draggable time travel and tap-to-explain. Reason: see the whole week at a glance, and see why.
- Stay length chips; the verdict checks the whole stay.
- Three real, credited sample poles; demo is instant.
- Honest accuracy card with true counts only, 20+ photos.
- Photos not stored; disclaimer always visible.
- Inspired by Nikki Sylianteng, credited, artwork not copied.
- No em dashes in UI text; no mention of who checks the work in public copy.

Operator decisions (Matt to review), each marked inline above:
- Single page with three views; confirm step lives on the answer view.
- Stricter sign wins; NO beats NOT SURE; NOT SURE beats YES; "conflict" means two allowed rules disagreeing about the same hours.
- Other-vehicle and permit rules count as not allowed for an everyday driver.
- Arrow meaning and the left/right question wording.
- Amber hatched Not sure blocks in the grid.
- Default stay 1 h; overnight ends at 8:00 AM.
- Grid hour labels every 2 hours, 15-minute precision; one generic week.
- Sign card styling and type character.
- All switched off shows no answer, not YES.
- Accuracy test method (3 fixed times per photo, expected answers listed in the repo).

## What We're Building
Everything in `prd.md > Features and Behavior` and `prd.md > States and Boundaries`:
photo in (camera, upload, 3 samples), reading view, sign cards with switches and Not sure, arrow side, giant verdict for the whole stay, week grid, time travel line, tap a block to see why, stay chips, accuracy card, disclaimer and credits.

## Deferred From the POC
- **Editing a card's text or rule.** Switching off covers the wrong-card case; editing needs a rule editor. Later if testing shows switches aren't enough.
- **.ics "move my car" download.** Nice-to-have only (`scope.md > Later`). Build only if the core is done and time remains.
- **Multiple languages.** `scope.md > Later`.
- **Holiday and suspension calendars.** Needs a per-city data source; the disclaimer covers it.

## Possible Later Enhancements
- Highlight each sign's box on the photo itself when its card or grid block is tapped.
- Share an answer as a link or image.
- Per-city rule hints (for example NYC alternate side parking suspensions).

## Non-Goals
- **Accounts.** Nothing to save; see `scope.md > Explicitly Cut`.
- **Maps or GPS.** The pole is the input.
- **Payments or meter apps.** The app explains the rule; it doesn't pay it.
- **Crowdsourcing.** Needs users, moderation, and storage.
- **Native app.** A mobile web page works on any phone.
- **Reminders beyond the optional .ics.**
- **Guaranteeing legality.** It is a reading aid; the driver still checks the sign.

## Open Questions
- **Which 3 sample poles?** Choose from `brief/commons-candidates.tsv` after looking at the photos. Ideally one YES case, one NO case, and one with arrows or a Not sure. Can wait for the build.
- **Which 20+ test photos?** Also from the candidates list, only photos that clearly show parking signs. Can wait for the build.
- **Public ticket statistic.** Any NYC ticket number used in public copy must be checked against a real, citable source first. Can wait for `6-ship`.
- Nothing above blocks `4-spec`.
