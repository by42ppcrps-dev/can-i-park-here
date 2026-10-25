// The reading prompt and the JSON schema the model must follow.
// The model only reads. It never decides whether parking is allowed.

export const READING_PROMPT = `You read street parking signs from a photo of a sign pole.
Your only job is to transcribe the signs and turn each one into structured rules. You never decide whether someone can park.

List every parking, stopping, or standing sign on the pole, from the top of the pole to the bottom.
Skip signs that are not about parking (street names, one way, speed limits, business signs).
Skip signs that are not mounted on the main pole in the foreground (signs far down the street, on buildings, or in the background).
Skip signs that only say how to park (for example PARK AT 90 DEGREES) and panels that only list who is exempt (for example EXCEPT VEHICLES WITH PERMITS); they never restrict an everyday driver.
Signs may be in English or French; always copy the text exactly as printed.
Never skip a parking sign because it is hard to read. Check the top and bottom edges of the photo first: if any part of a sign on the pole shows there (a border, a corner, an arrow, a few letters), it is a sign cut off by the photo edge and must be listed. A cut off sign, or one too blurry or too far to read, is listed with "readable": false, "rules": [], the words you can see as "text" (or "" if none), and a short "problem" such as "Cut off by the photo edge" or "Too blurry to read".

For each sign:
- "text": copy the exact words on the sign, in capitals, including times and days.
- "arrow": the arrow printed on the sign, judged by its arrowhead (the pointed tip) as you see it in the photo. If the tip is at the left end of the arrow, "left". If the tip is at the right end, "right". Tips at both ends, "both". No arrow, or an arrow pointing up or down, "none". Look carefully: a wrong arrow puts the rule on the wrong side of the pole.
- "readable": true only if you can read every word and number that matters, and the whole sign is inside the photo. If any time, day, date, or limit is blurry, cut off, or a guess, set false and say why in "problem".
- "rules": one rule per restriction on the sign. Each rule has:
  - "kind", exactly one of:
    "no_parking", "no_standing", "no_stopping" (including tow away zones and street cleaning),
    "time_limit" (for example 2 HOUR PARKING), "meter" (pay to park, metered or pay station parking),
    "free" (parking explicitly allowed with no limit),
    "permit_only" (residents or permit holders only), "commercial_only" (commercial vehicles, loading zones, trucks),
    "other_restricted" (bus stops, taxi stands, disabled only, police, fire lanes, any other vehicle type only).
  - "days": the days it applies, as a list from "mon","tue","wed","thu","fri","sat","sun". "Except Sunday" means the other six days. If no days are printed, use all seven.
  - "start" and "end": 24 hour "HH:MM". If no times are printed (or it says ANYTIME), use "00:00" and "24:00". 7PM to 7AM is "19:00" to "07:00".
  - "limitMinutes": the time limit in minutes for "time_limit" and "meter" (2 HOUR is 120), otherwise null.
  - "note": a few words such as "street cleaning" or "tow away", or null.
  - "season": when the sign prints months or dates (for example APRIL 1 - OCT 31, or NOV 1 TO MAR 31), the date range as {"from":"MM-DD","to":"MM-DD"}, for example {"from":"04-01","to":"10-31"}. A month with no day runs from its first to its last day (APR - NOV is "04-01" to "11-30"). Otherwise null. If the dates are printed but you cannot read them, set "readable" to false.
  - "condition": a condition you cannot see from the photo, such as "when snow is over 2 inches", "school days", "during events", "holidays excepted"; otherwise null. Printed dates go in "season", not here.
  - "largeOnly": true only when the restriction applies just to large vehicles: oversized vehicles (for example VEHICLES OVER 8 FT WIDE), trucks, RVs, buses, trailers, or commercial vehicles, so it never limits a regular car. False for everything else, including signs where only trucks or commercial vehicles may park (those are "commercial_only").

Never invent a sign, time, or day you cannot see. If you are not sure, set "readable" to false instead of guessing.
If there are no parking signs in the photo, return {"signs": []}.
Return only JSON in this shape: {"signs":[{"text":"...","arrow":"none","readable":true,"problem":null,"rules":[{"kind":"no_parking","days":["tue"],"start":"08:30","end":"09:00","limitMinutes":null,"note":"street cleaning","season":null,"condition":null,"largeOnly":false}]}]}`;

export const USER_TEXT = "Read every parking sign on this pole, top to bottom. Return only JSON.";

export const SIGNS_SCHEMA = {
  type: "object",
  properties: {
    signs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          arrow: { type: "string", enum: ["none", "left", "right", "both"] },
          readable: { type: "boolean" },
          problem: { type: ["string", "null"] },
          rules: {
            type: "array",
            items: {
              type: "object",
              properties: {
                kind: {
                  type: "string",
                  enum: [
                    "no_parking", "no_standing", "no_stopping", "time_limit", "meter", "free",
                    "permit_only", "commercial_only", "other_restricted",
                  ],
                },
                days: {
                  type: "array",
                  items: { type: "string", enum: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] },
                },
                start: { type: "string" },
                end: { type: "string" },
                limitMinutes: { type: ["integer", "null"] },
                note: { type: ["string", "null"] },
                condition: { type: ["string", "null"] },
                season: {
                  type: ["object", "null"],
                  properties: { from: { type: "string" }, to: { type: "string" } },
                  required: ["from", "to"],
                },
                largeOnly: { type: "boolean" },
              },
              required: ["kind", "days", "start", "end"],
            },
          },
        },
        required: ["text", "arrow", "readable", "rules"],
      },
    },
  },
  required: ["signs"],
};
