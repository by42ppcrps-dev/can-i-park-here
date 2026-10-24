---
doc: scope
status: approved
---
<!-- Approved: relayed by Matt's operator (Matt not live). See devpost/interview-log.md > 2-scope. -->

# Can I Park Here

Snap a parking sign pole, get one clear answer for right now, and see the whole week at a glance.

## The Unique Kernel
**The AI reads the signs; a plain, testable rules engine decides.** The AI never decides "yes" by itself, and the app never gives a confident wrong YES: when a sign is unreadable or rules conflict, it says Not sure.
That trust split is shown, not hidden: the user sees the signs as plain cards, can switch off a wrong one, and sees the answer as a week grid with a draggable "time travel" line, so the verdict is something they can check with their own eyes.

## Who It's For
An everyday city driver standing at a pole of four stacked signs, doing mental math, afraid of a ticket or a tow. Also visitors, new drivers, people with low English literacy or dyslexia, and anyone in a hurry.
Today they read every sign, guess, and either risk it or circle the block.

## The Core Loop
1. Take or upload a photo of the pole (or tap a sample pole).
2. Watch it read the signs.
3. Glance at the sign cards; switch off any that are wrong.
4. Get a giant verdict for now and the chosen stay length.
5. Drag through the week grid to see when it changes.

They come back every time they park somewhere unfamiliar.

## Inspiration & Identity
- Nikki Sylianteng's "To Park or Not to Park" week-grid sign redesign: https://www.nikkisylianteng.com/parking. Credit her as inspiration; do not copy her artwork.
- Feel: one glance, one answer. Big type, high contrast, mobile-first, colors that never stand alone (icons and labels too).
- Tone: plain and honest. "A reading aid. Always double-check the sign."

## Why This Matters to the Learner
Matt wants to learn "how to plan with an AI before building so a small app comes out polished and trustworthy, not just 'working'." This app is a test of that: trust is the product.

## What "Working" Looks Like
Someone opens the app on a phone, taps a sample pole (or snaps a real one), sees the scan animation, checks the sign cards, and gets a giant verdict such as green "YES, until 4:00 PM", red "NO, street cleaning starts 8:30 AM", or amber "NOT SURE: check sign 3".
**The "oh, that's cool" beat:** they drag the time travel line across the week grid and the verdict changes live; they tap a red block and the sign that caused it lights up.
A small accuracy card shows true counts from 20+ real sign photos with hand-checked answers.

## The POC Boundary
In:
- Photo capture or upload, plus 3 sample poles (real CC-licensed Wikimedia Commons photos, credited).
- Reading signs state with a scan animation.
- Confirm step: sign cards (sign text plus the rule it means), each can be switched off; Not sure for unreadable signs or conflicts.
- Giant verdict for the chosen time and stay length.
- Week grid (Mon to Sun, hours down the side): green free, blue/teal allowed with a time limit or meter (labeled), red not allowed. Draggable time travel line updates the verdict live. Tap a block to highlight the sign that caused it.
- Stay length chips: 15 min, 1 h, 2 h, 4 h, overnight. The verdict checks the whole stay.
- Arrow side: if signs have arrows, the user says which side of the pole the car is on.
- Honest accuracy card (20+ real photos, true counts only).
- Disclaimer; photos not stored.

## Later
- Optional .ics "move my car" download (nice-to-have only).
- Multiple languages.

## Explicitly Cut
- **Accounts:** nothing to save between visits; a login proves nothing about reading signs.
- **Maps and GPS:** the pole in front of you is the input; location data adds privacy cost and no proof.
- **Payments and meter apps:** the app tells you the rule, not how to pay it.
- **Crowdsourcing:** needs users, moderation, and storage; the kernel works from one photo.
- **Native app:** a mobile-first web page works on any phone with a camera.
- **Reminders beyond the optional .ics:** notifications add infrastructure for a side benefit.
