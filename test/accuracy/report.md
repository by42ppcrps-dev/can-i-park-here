# Accuracy report

Run 2026-10-24 against the live Worker (version 9cf0320f-7414-4c06-a4d3-93057a48e277), now served at https://park.trylumegrid.com.
26 photos, 4 test times each (Mon 9:00 AM, Tue 8:45 AM, Sat 2:00 PM, Sun 3:00 AM), 60 minute stay: 104 checks.

| Right | Not sure | Wrong NO | Wrong YES |
|---|---|---|---|
| 81 | 19 | 4 | 0 |

How a check is scored: the expected verdict is the rules engine's answer on a hand-written reading of the photo (`expected.json`); the actual verdict is the same engine on the live reading. Same verdict is right. The app saying Not sure, finding no signs, or failing to read counts as Not sure. Any other YES is a wrong YES; any other NO is a wrong NO. For photos with arrows, the car's side is set as listed in `expected.json`.

Prompt and validator changes made after reading the ground truth and before this run, all general and all making answers stricter or skipping signs that never restrict an everyday driver: skip angle parking signs and exemption panels; arrows judged by the arrowhead; conditions such as snow, school days, events, months, and "when" make a rule Not sure; a sign whose arrow points away from the car is Not sure instead of ignored.

Revision round 1 (after hands-on feedback): rules may carry printed season dates (checked against the sign text) and a large vehicles only flag (trusted only when the text names big vehicles); signs cut off by the photo edge are reported as unreadable; test times are dated (week of Mon Oct 19, 2026) so season dates are judged on real dates; `expected.json` changed only for p23, whose street cleaning sign prints APRIL 1-OCT 31. The first rerun of all 26 photos had 3 wrong YES on p280 (hours that run to sunset). Two stricter changes followed: sunrise, sunset, dusk, and dawn make a rule Not sure, and a sign that only says when parking is allowed is Not sure at all other times. Only p280 was read again; the second change is in the rules engine, so it needed no new reading.

## p329.jpg (Quebec City, QC)

Photo: [Stationnement interdit déneigement Québec](https://commons.wikimedia.org/wiki/File:Stationnement_interdit_d%C3%A9neigement_Qu%C3%A9bec.jpg) by Bouchecl, CC BY-SA 3.0.
Note: The signal light and the snow ban are one rule that applies only when the light flashes, so it is Not sure overnight. The zone 22 permit panel only exempts permit holders.

| Time | Expected | Live reading | Result |
|---|---|---|---|
| Mon 9:00 AM | yes | yes | right |
| Tue 8:45 AM | yes | yes | right |
| Sat 2:00 PM | yes | yes | right |
| Sun 3:00 AM | unsure | unsure | right |

Live reading (@cf/meta/llama-4-scout-17b-16e-instruct, 8761 ms):
- 1. INTERDICTION DE STATIONNER DANS CETTE RUE 23H - 6H30 LORSQUE LE FEU CLIGNOTE DENEIGEMENT ET ENTRETIEN REMORQUAGE INFORMATION 641-6566: No parking 11:00 PM to 6:30 AM, tow away, only under a condition on the sign
- 2. P 60 min 9h-12h 13h30-17h LUN A VEN (arrow both): 1 hour parking Mon to Fri 9:00 AM to 5:00 PM; 1 hour parking Mon to Fri 9:00 AM to 12:00 PM

## p238.jpg (Chicago, IL)

Photo: [Parking restriction signs (26199442189)](https://commons.wikimedia.org/wiki/File:Parking_restriction_signs_(26199442189).jpg) by Eric Fischer, CC BY 2.0. Car side: left.
Note: Car on the left of the right-hand pole (the pay box side). No hours are printed, so paid parking all week. The surge pricing notices change prices, not permission.

| Time | Expected | Live reading | Result |
|---|---|---|---|
| Mon 9:00 AM | unsure | unsure | right |
| Tue 8:45 AM | unsure | unsure | right |
| Sat 2:00 PM | unsure | unsure | right |
| Sun 3:00 AM | unsure | unsure | right |

Live reading (@cf/meta/llama-4-scout-17b-16e-instruct, 10987 ms):
- 1. PAY AT PAY BOX OR SIGN UP AT ParkChicago.com FOR MOBILE PAY ZONE 437 218 (arrow right): Paid parking anytime
- 2. PAY TO PARK AT PAY BOX OR SIGN UP AT ParkChicago.com FOR MOBILE PAY ZONE 437 218: Paid parking anytime
- 3. THIS ZONE IS SUBJECT TO SURGE PRICING AND HOURS ON STADIUM EVENT DAYS. FOR INFO: CALL 311 OR VISIT CHICAGOMETERS.COM: Not sure: no parking rule found on this sign
- 4. TOW ZONE (arrow right): No parking anytime, tow away

## p23.jpg (Chicago, IL)

Photo: [Street Cleaning and Two Hour Parking signs (37412426774)](https://commons.wikimedia.org/wiki/File:Street_Cleaning_and_Two_Hour_Parking_signs_(37412426774).jpg) by Eric Fischer, CC BY 2.0. Car side: left.
Note: Car on the left, the side the 2 hour sign covers. Street cleaning runs April 1 to Oct 31, as printed.

| Time | Expected | Live reading | Result |
|---|---|---|---|
| Mon 9:00 AM | yes | unsure | Not sure |
| Tue 8:45 AM | yes | unsure | Not sure |
| Sat 2:00 PM | yes | unsure | Not sure |
| Sun 3:00 AM | yes | yes | right |

Live reading (@cf/meta/llama-4-scout-17b-16e-instruct, 5702 ms):
- 1. STREET CLEANING NO PARKING 7 AM - 9 AM FRIDAYS APRIL 1 - OCT 31 TOW ZONE: No parking Fri 7:00 to 9:00 AM, Apr 1 to Oct 31, street cleaning
- 2. TWO HOUR PARKING 9AM-10PM MON-SAT (arrow right): 2 hour parking Mon to Sat 9:00 AM to 10:00 PM

## p355.jpg (New Orleans, LA)

Photo: [Musician Loading Zone sign, Frenchman Street, New Orleans, Louisiana, USA](https://commons.wikimedia.org/wiki/File:Musician_Loading_Zone_sign,_Frenchman_Street,_New_Orleans,_Louisiana,_USA.jpg) by Cory Doctorow, CC BY-SA 2.0. Car side: left.
Note: Car on the left, the freight zone side.

| Time | Expected | Live reading | Result |
|---|---|---|---|
| Mon 9:00 AM | no | no | right |
| Tue 8:45 AM | no | no | right |
| Sat 2:00 PM | no | no | right |
| Sun 3:00 AM | no | no | right |

Live reading (@cf/meta/llama-4-scout-17b-16e-instruct, 4891 ms):
- 1. NO PARKING FREIGHT ZONE 24 HOURS (arrow right): No parking anytime
- 2. MUSICIAN LOADING ZONE: Restricted anytime

## p110.jpg (New York, NY)

Photo: [New York City (New York, USA), Manhattan, WTC Construction Site -- 2012 -- 6573](https://commons.wikimedia.org/wiki/File:New_York_City_(New_York,_USA),_Manhattan,_WTC_Construction_Site_--_2012_--_6573.jpg) by Dietmar Rabich, CC BY-SA 4.0.
Note: The WTC panel only exempts construction vehicles.

| Time | Expected | Live reading | Result |
|---|---|---|---|
| Mon 9:00 AM | no | no | right |
| Tue 8:45 AM | no | no | right |
| Sat 2:00 PM | no | no | right |
| Sun 3:00 AM | no | no | right |

Live reading (@cf/mistralai/mistral-small-3.1-24b-instruct, 5909 ms):
- 1. NO STANDING ANYTIME (arrow both): No standing anytime, temporary construction regulation

## p241.jpg (Chicago, IL)

Photo: [Two "right lane buses only" signs - Chicago, IL - December 2021](https://commons.wikimedia.org/wiki/File:Two_%22right_lane_buses_only%22_signs_-_Chicago,_IL_-_December_2021.jpg) by AlphaBeta135, CC BY 4.0.
Note: Bus lane signs are not parking rules.

| Time | Expected | Live reading | Result |
|---|---|---|---|
| Mon 9:00 AM | no | no | right |
| Tue 8:45 AM | no | no | right |
| Sat 2:00 PM | no | no | right |
| Sun 3:00 AM | no | no | right |

Live reading (@cf/meta/llama-4-scout-17b-16e-instruct, 2811 ms):
- 1. NO PARKING ANY TIME: No parking anytime

## p356.jpg (Kent, WA)

Photo: [One-way and loading zone signs in Kent, Washington](https://commons.wikimedia.org/wiki/File:One-way_and_loading_zone_signs_in_Kent,_Washington.jpg) by Roc0ast3r, CC0.
Note: One way sign is not a parking rule.

| Time | Expected | Live reading | Result |
|---|---|---|---|
| Mon 9:00 AM | no | no | right |
| Tue 8:45 AM | no | no | right |
| Sat 2:00 PM | no | no | right |
| Sun 3:00 AM | no | no | right |

Live reading (@cf/meta/llama-4-scout-17b-16e-instruct, 2672 ms):
- 1. NO PARKING LOADING ZONE: No parking anytime, loading zone

## p7.jpg (San Jose, CA)

Photo: [Hand-drawn fire lane and no littering sign on North 9th Street, San Jose, California](https://commons.wikimedia.org/wiki/File:Hand-drawn_fire_lane_and_no_littering_sign_on_North_9th_Street,_San_Jose,_California.jpg) by Minh Nguyen, CC BY-SA 4.0.
Note: Homemade sign, read as written.

| Time | Expected | Live reading | Result |
|---|---|---|---|
| Mon 9:00 AM | no | no | right |
| Tue 8:45 AM | no | no | right |
| Sat 2:00 PM | no | no | right |
| Sun 3:00 AM | no | no | right |

Live reading (@cf/meta/llama-4-scout-17b-16e-instruct, 4375 ms):
- 1. NO PARKING FIRE LANE NO STOPPING PUT TRASH IN ITS PLACE CLEAN UP AFTER YOUR DOG PONGA LA BASURA EN SU LUGAR LIMPIEZA TRAS SU PERRO: No parking anytime, fire lane

## p291.jpg (San Francisco, CA)

Photo: [SF parking sign](https://commons.wikimedia.org/wiki/File:SF_parking_sign.jpg) by Mrbeastmodeallday, CC BY-SA 4.0.
Note: Park at 90 degrees is how to park, not a rule.

| Time | Expected | Live reading | Result |
|---|---|---|---|
| Mon 9:00 AM | yes | yes | right |
| Tue 8:45 AM | yes | yes | right |
| Sat 2:00 PM | yes | yes | right |
| Sun 3:00 AM | yes | yes | right |

Live reading (@cf/meta/llama-4-scout-17b-16e-instruct, 2637 ms):
- 1. 2 HOUR PARKING 8A.M. TO 9 P.M. MON THRU SAT EXCEPT VEHICLES WITH AREA A PERMITS: 2 hour parking Mon to Sat 8:00 AM to 9:00 PM

## p53.jpg (Venice (Los Angeles), CA)

Photo: [Have a nice day sign below no public parking sign, Venice California](https://commons.wikimedia.org/wiki/File:Have_a_nice_day_sign_below_no_public_parking_sign,_Venice_California.jpg) by Damian Gadal, CC BY 2.0.

| Time | Expected | Live reading | Result |
|---|---|---|---|
| Mon 9:00 AM | no | no | right |
| Tue 8:45 AM | no | no | right |
| Sat 2:00 PM | no | no | right |
| Sun 3:00 AM | no | no | right |

Live reading (@cf/meta/llama-4-scout-17b-16e-instruct, 2754 ms):
- 1. NO PUBLIC PARKING: No parking anytime

## p167.jpg (Chicago, IL)

Photo: [Cubs Night Games Permit Parking sign (38090282362)](https://commons.wikimedia.org/wiki/File:Cubs_Night_Games_Permit_Parking_sign_(38090282362).jpg) by Eric Fischer, CC BY 2.0.
Note: Only on game nights, so Not sure 5 to 10 PM; none of the test times fall there.

| Time | Expected | Live reading | Result |
|---|---|---|---|
| Mon 9:00 AM | yes | yes | right |
| Tue 8:45 AM | yes | yes | right |
| Sat 2:00 PM | yes | yes | right |
| Sun 3:00 AM | yes | yes | right |

Live reading (@cf/meta/llama-4-scout-17b-16e-instruct, 3866 ms):
- 1. CUBS' NIGHT GAMES PERMIT PARKING 5PM-10PM EXCEPT WITH PERMIT LV2 TOW ZONE: Permit holders only 5:00 to 10:00 PM, tow away

## p239.jpg (Chicago, IL)

Photo: [Pay to Park Sign City of Chicago 3091053547](https://commons.wikimedia.org/wiki/File:Pay_to_Park_Sign_City_of_Chicago_3091053547.jpg) by Tony Webster, CC BY-SA 4.0.
Note: No hours printed, so paid parking all week.

| Time | Expected | Live reading | Result |
|---|---|---|---|
| Mon 9:00 AM | yes | unsure | Not sure |
| Tue 8:45 AM | yes | unsure | Not sure |
| Sat 2:00 PM | yes | unsure | Not sure |
| Sun 3:00 AM | yes | unsure | Not sure |

Live reading (@cf/meta/llama-4-scout-17b-16e-instruct, 3596 ms):
- 1. PAY TO PARK CITY OF CHICAGO (arrow left): Paid parking anytime

## p185.jpg (Pismo Beach, CA)

Photo: [Pismo Beach (California, USA), Sign -- 2012 -- 4](https://commons.wikimedia.org/wiki/File:Pismo_Beach_(California,_USA),_Sign_--_2012_--_4.jpg) by Dietmar Rabich, CC BY-SA 4.0.

| Time | Expected | Live reading | Result |
|---|---|---|---|
| Mon 9:00 AM | yes | yes | right |
| Tue 8:45 AM | yes | yes | right |
| Sat 2:00 PM | yes | yes | right |
| Sun 3:00 AM | yes | yes | right |

Live reading (@cf/meta/llama-4-scout-17b-16e-instruct, 3759 ms):
- 1. WELCOME PISMO BEACH PUBLIC PARKING PAY TO PARK 10AM-6PM DAILY PLEASE PAY AT PAY STATION: Paid parking, 8 hour limit 10:00 AM to 6:00 PM

## p237.jpg (Chicago, IL)

Photo: [No Parking No Dumping (6078301511)](https://commons.wikimedia.org/wiki/File:No_Parking_No_Dumping_(6078301511).jpg) by Jaysin Trevino from Evanston, IL, US, CC BY 2.0.

| Time | Expected | Live reading | Result |
|---|---|---|---|
| Mon 9:00 AM | no | no | right |
| Tue 8:45 AM | no | no | right |
| Sat 2:00 PM | no | no | right |
| Sun 3:00 AM | no | no | right |

Live reading (@cf/meta/llama-4-scout-17b-16e-instruct, 5218 ms):
- 1. NO PARKING NO DUMPING VIOLATORS WILL BE PROSECUTED CITY OF CHICAGO: No parking anytime

## p297.jpg (San Francisco, CA)

Photo: [San Francisco No Parking Graffitist 2081940897 o](https://commons.wikimedia.org/wiki/File:San_Francisco_No_Parking_Graffitist_2081940897_o.jpg) by Tony Webster, CC BY-SA 3.0.

| Time | Expected | Live reading | Result |
|---|---|---|---|
| Mon 9:00 AM | no | no | right |
| Tue 8:45 AM | no | no | right |
| Sat 2:00 PM | no | no | right |
| Sun 3:00 AM | no | no | right |

Live reading (@cf/meta/llama-4-scout-17b-16e-instruct, 3172 ms):
- 1. NO PARKING AT ANY TIME: No parking anytime

## p95.jpg (New York, NY)

Photo: [At New York City 2024 009](https://commons.wikimedia.org/wiki/File:At_New_York_City_2024_009.jpg) by Photograph by Mike Peel (www.mikepeel.net)., CC BY-SA 4.0.

| Time | Expected | Live reading | Result |
|---|---|---|---|
| Mon 9:00 AM | no | unsure | Not sure |
| Tue 8:45 AM | no | unsure | Not sure |
| Sat 2:00 PM | no | unsure | Not sure |
| Sun 3:00 AM | no | unsure | Not sure |

Live reading (@cf/meta/llama-4-scout-17b-16e-instruct, 2848 ms):
- 1. NO STANDING Anytime (arrow both): Not sure: days are missing or unclear

## p134.jpg (unknown (photographer based in Seattle, WA))

Photo: [24 Hour Parking (3822897780)](https://commons.wikimedia.org/wiki/File:24_Hour_Parking_(3822897780).jpg) by Atomic Taco from Seattle, WA, USA, CC BY-SA 2.0.

| Time | Expected | Live reading | Result |
|---|---|---|---|
| Mon 9:00 AM | yes | yes | right |
| Tue 8:45 AM | yes | yes | right |
| Sat 2:00 PM | yes | yes | right |
| Sun 3:00 AM | yes | yes | right |

Live reading (@cf/meta/llama-4-scout-17b-16e-instruct, 3117 ms):
- 1. 24 HOUR PARKING MAXIMUM STRICTLY ENFORCED VEHICLES EXCEEDING THE 24-HOUR LIMIT WILL BE TOWED: 24 hour parking anytime, tow away

## p143.jpg (unknown)

Photo: [Eclipse parking sign - April 2024 - Sarah Stierch](https://commons.wikimedia.org/wiki/File:Eclipse_parking_sign_-_April_2024_-_Sarah_Stierch.jpg) by Missvain, CC BY 4.0.
Note: Applies only on one day the app cannot know, so Not sure.

| Time | Expected | Live reading | Result |
|---|---|---|---|
| Mon 9:00 AM | unsure | unsure | right |
| Tue 8:45 AM | unsure | unsure | right |
| Sat 2:00 PM | unsure | unsure | right |
| Sun 3:00 AM | unsure | unsure | right |

Live reading (@cf/meta/llama-4-scout-17b-16e-instruct, 1874 ms):
- 1. NO PARKING FOR MORE THAN 2 HRS DAY OF ECLIPSE: 2 hour parking anytime, Day of Eclipse

## p289.jpg (San Francisco International Airport (San Mateo County), CA)

Photo: [No TNC Parking or Waiting sign, San Francisco International Airport cell phone lot](https://commons.wikimedia.org/wiki/File:No_TNC_Parking_or_Waiting_sign,_San_Francisco_International_Airport_cell_phone_lot.jpg) by Minh Nguyen, CC BY-SA 4.0.
Note: No TNC parking only restricts ride hail cars, so nothing limits an everyday driver. Best possible app result: YES or no signs found.

| Time | Expected | Live reading | Result |
|---|---|---|---|
| Mon 9:00 AM | yes | no | WRONG NO |
| Tue 8:45 AM | yes | no | WRONG NO |
| Sat 2:00 PM | yes | no | WRONG NO |
| Sun 3:00 AM | yes | no | WRONG NO |

Live reading (@cf/meta/llama-4-scout-17b-16e-instruct, 2993 ms):
- 1. No TNC Parking or Waiting SFIA REG. 4.7(B)(22): No stopping anytime

## p224.jpg (Chicago, IL)

Photo: [20070822 Lincoln Towing Sign w new prices](https://commons.wikimedia.org/wiki/File:20070822_Lincoln_Towing_Sign_w_new_prices.JPG) by User:TonyTheTiger at en.wikipedia, CC BY-SA 3.0.

| Time | Expected | Live reading | Result |
|---|---|---|---|
| Mon 9:00 AM | no | no_signs | Not sure |
| Tue 8:45 AM | no | no_signs | Not sure |
| Sat 2:00 PM | no | no_signs | Not sure |
| Sun 3:00 AM | no | no_signs | Not sure |

Live reading (@cf/meta/llama-4-scout-17b-16e-instruct, 588 ms):
- No signs found.

## p69.jpg (Claremont, CA (inferred from storefront))

Photo: [Virus War Casualty](https://commons.wikimedia.org/wiki/File:Virus_War_Casualty.jpg) by Russ Allison Loar, CC BY-SA 4.0.

| Time | Expected | Live reading | Result |
|---|---|---|---|
| Mon 9:00 AM | yes | yes | right |
| Tue 8:45 AM | yes | yes | right |
| Sat 2:00 PM | yes | yes | right |
| Sun 3:00 AM | yes | yes | right |

Live reading (@cf/meta/llama-4-scout-17b-16e-instruct, 2760 ms):
- 1. 2 HOUR PARKING 9A.M. TO 6 P.M. MONDAY - FRIDAY: 2 hour parking Mon to Fri 9:00 AM to 6:00 PM

## p294.jpg (San Francisco, CA)

Photo: [San Francisco-California3967](https://commons.wikimedia.org/wiki/File:San_Francisco-California3967.JPG) by Diego Delso, CC BY-SA 4.0.
Note: Park at 90 degrees is how to park, not a rule. Best possible app result: YES or no signs found.

| Time | Expected | Live reading | Result |
|---|---|---|---|
| Mon 9:00 AM | yes | no_signs | right |
| Tue 8:45 AM | yes | no_signs | right |
| Sat 2:00 PM | yes | no_signs | right |
| Sun 3:00 AM | yes | no_signs | right |

Live reading (@cf/meta/llama-4-scout-17b-16e-instruct, 565 ms):
- No signs found.

## p288.jpg (likely San Francisco, CA (curb stencil))

Photo: [No Parking 2 (Unsplash)](https://commons.wikimedia.org/wiki/File:No_Parking_2_(Unsplash).jpg) by Adam Griffith aggriffith, CC0.

| Time | Expected | Live reading | Result |
|---|---|---|---|
| Mon 9:00 AM | no | no | right |
| Tue 8:45 AM | no | no | right |
| Sat 2:00 PM | no | no | right |
| Sun 3:00 AM | no | no | right |

Live reading (@cf/meta/llama-4-scout-17b-16e-instruct, 2754 ms):
- 1. NO PARKING: No parking anytime

## p371.jpg (Framingham, MA)

Photo: [MassDOT Park & Ride Parking Notice, Framingham MA, 2025-11-19](https://commons.wikimedia.org/wiki/File:MassDOT_Park_%26_Ride_Parking_Notice,_Framingham_MA,_2025-11-19.jpg) by Peter Cooper Jr., CC0.

| Time | Expected | Live reading | Result |
|---|---|---|---|
| Mon 9:00 AM | no | no | right |
| Tue 8:45 AM | no | no | right |
| Sat 2:00 PM | no | no | right |
| Sun 3:00 AM | no | no | right |

Live reading (@cf/meta/llama-4-scout-17b-16e-instruct, 6692 ms):
- 1. CARPOOLING & BUS PASSENGERS ONLY NO VEHICLE STORAGE NO CAMPERS NO BOX TRUCKS VIOLATORS ASSUME ALL RELATED EXPENSES 21 DAY MAXIMUM PARK & RIDE PARKING NOTICE massDOT: Restricted anytime; No standing anytime; No parking anytime

## p350.jpg (San Jose, CA)

Photo: [Freight Loading Zone sign on sidewalk at Post Street and South San Pedro Street, San Jose, California](https://commons.wikimedia.org/wiki/File:Freight_Loading_Zone_sign_on_sidewalk_at_Post_Street_and_South_San_Pedro_Street,_San_Jose,_California.jpg) by Mxn, CC BY-SA 4.0.

| Time | Expected | Live reading | Result |
|---|---|---|---|
| Mon 9:00 AM | no | no | right |
| Tue 8:45 AM | no | no | right |
| Sat 2:00 PM | no | no | right |
| Sun 3:00 AM | yes | yes | right |

Live reading (@cf/meta/llama-4-scout-17b-16e-instruct, 3726 ms):
- 1. FREIGHT LOADING ZONE 7A.M.-6P.M. EXCEPT SUNDAY & HOLIDAY: Commercial vehicles only Mon to Sat 7:00 AM to 6:00 PM

## p280.jpg (South San Francisco, CA)

Photo: [Genentech HQ parking sign 1](https://commons.wikimedia.org/wiki/File:Genentech_HQ_parking_sign_1.JPG) by BrokenSphere, CC BY-SA 3.0.
Note: Private lot open to the public weekday evenings 5 PM to sunset and weekends sunrise to sunset. Sunset and sunrise are not fixed times, so the expected verdicts are written directly.

| Time | Expected | Live reading | Result |
|---|---|---|---|
| Mon 9:00 AM | no | unsure | Not sure |
| Tue 8:45 AM | no | unsure | Not sure |
| Sat 2:00 PM | yes | unsure | Not sure |
| Sun 3:00 AM | no | unsure | Not sure |

Live reading (@cf/meta/llama-4-scout-17b-16e-instruct, 4323 ms):
- 1. GENENTECH PRIVATE PROPERTY PUBLIC PARKING ALLOWED EVENINGS & WEEKENDS EVENING PARKING (5:00 PM TO SUNSET) WEEKEND PARKING (SUNRISE TO SUNSET): Free parking Mon to Fri 5:00 PM to 12:00 AM, hours set by sunrise or sunset; Free parking Sat, Sun, all day, hours set by sunrise or sunset
