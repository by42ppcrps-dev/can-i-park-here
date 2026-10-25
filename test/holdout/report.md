# Holdout accuracy report

Run 2026-10-24 against https://can-i-park-here.lumegridai.workers.dev (Worker version a0113948-bf34-4c53-b5b5-71b38090885b).
10 photos, 4 test times each (Mon 9:00 AM, Tue 8:45 AM, Sat 2:00 PM, Sun 3:00 AM), 60 minute stay: 40 checks.

| Right | Not sure | Wrong NO | Wrong YES |
|---|---|---|---|
| 33 | 4 | 3 | 0 |

How a check is scored: the expected verdict is the rules engine's answer on a hand-written reading of the photo (`expected.json`); the actual verdict is the same engine on the live reading. Same verdict is right. The app saying Not sure, finding no signs, or failing to read counts as Not sure. Any other YES is a wrong YES; any other NO is a wrong NO. For photos with arrows, the car's side is set as listed in `expected.json`.

This is the frozen holdout: 10 stacked-sign photos from Wikimedia Commons that were never used while building or tuning the app. Photos were picked and expected answers hand-written by me before the first live reading (see `FROZEN.txt` for the commit and file hashes taken at that moment). No prompt, validator, or rules engine change was made for this run; it used the same live Worker version as the main accuracy test. Nothing was rerun. The run used a copy of the repo with these files in `test/accuracy/`, so `FROZEN.txt` lists them under that path; they were then copied here unchanged and the hashes still match.

## q01.jpg (Cambridge, MA)

Photo: [Parking signs - Cambridge, MA - IMG 3992](https://commons.wikimedia.org/wiki/File:Parking_signs_-_Cambridge,_MA_-_IMG_3992.JPG) by Daderot, Public domain.
Note: Permit only Mon to Sat (both directions). The snow emergency ban and second Monday street cleaning only apply on days the app cannot know, so Sunday 3 AM is Not sure.

| Time | Expected | Live reading | Result |
|---|---|---|---|
| Mon 9:00 AM | no | no | right |
| Tue 8:45 AM | no | no | right |
| Sat 2:00 PM | no | no | right |
| Sun 3:00 AM | unsure | unsure | right |

Live reading (@cf/meta/llama-4-scout-17b-16e-instruct, 13538 ms):
- 1. PARKING BY PERMIT ONLY EXCEPT SUNDAYS CITY OF CAMBRIDGE: Permit holders only Mon to Sat, all day
- 2. TOW ZONE NO PARKING STREET CLEANING 8 AM TO 2 PM SECOND MONDAY EACH MONTH APRIL 1ST TO DEC 31ST EXCEPT HOLIDAYS: No parking Mon 8:00 AM to 2:00 PM, Apr 1 to Dec 31, street cleaning
- 3. TOW ZONE NO PARKING DURING SNOW EMERGENCY: No parking anytime, when it snows

## q02.jpg (Washington, DC)

Photo: [Washington, D.C., parking signs 01](https://commons.wikimedia.org/wiki/File:Washington,_D.C.,_parking_signs_01.jpg) by Dada1960, CC BY-SA 3.0. Car side: left.
Note: Car on the left, the 2 hour side; the no parking sign points right. The rush hour ban points both ways.

| Time | Expected | Live reading | Result |
|---|---|---|---|
| Mon 9:00 AM | no | no | right |
| Tue 8:45 AM | no | no | right |
| Sat 2:00 PM | unsure | unsure | right |
| Sun 3:00 AM | unsure | unsure | right |

Live reading (@cf/meta/llama-4-scout-17b-16e-instruct, 9944 ms):
- 1. TOW AWAY NO STANDING OR PARKING 7AM-9:30AM 4PM-6:30PM MONDAY-FRIDAY IF TOWED 727-5000 (arrow both): No standing Mon to Fri 7:00 to 9:30 AM, tow away; No standing Mon to Fri 4:00 to 6:30 PM, tow away
- 2. NO PARKING (arrow right): No parking anytime
- 3. 2 HOUR PARKING 9:30 AM-4 PM MONDAY-FRIDAY 7:00 AM-6:30 PM SATURDAY NO TIME LIMIT PARKING 6:30 PM-10 PM MON-SAT PAY TO PARK (arrow right): 2 hour parking Mon to Fri 9:30 AM to 4:00 PM; 6 hour parking Sat 7:00 AM to 6:30 PM; Free parking Mon to Sat 6:30 to 10:00 PM

## q03.jpg (New Orleans, LA)

Photo: [Street cleaning sign with hand-cut letters - New Orleans, January 2015](https://commons.wikimedia.org/wiki/File:Street_cleaning_sign_with_hand-cut_letters_-_New_Orleans,_January_2015.jpg) by Erica _ Fischer, CC BY 2.0.
Note: The down arrow points at the street below, not a side. No hours printed on the 2 hour pay sign, so all week. 12:01 AM is taken as midnight.

| Time | Expected | Live reading | Result |
|---|---|---|---|
| Mon 9:00 AM | yes | unsure | Not sure |
| Tue 8:45 AM | yes | unsure | Not sure |
| Sat 2:00 PM | yes | unsure | Not sure |
| Sun 3:00 AM | yes | unsure | Not sure |

Live reading (@cf/meta/llama-4-scout-17b-16e-instruct, 6949 ms):
- 1. PAY TO PARK 2 HOUR (arrow right): 2 hour parking anytime
- 2. NO PARKING STREET CLEANING 12:01AM - 6:AM TUE - THUR - SAT MORNINGS: No parking Tue, Thu, Sat 12:00 to 6:00 AM, street cleaning

## q04.jpg (St. Johnsbury, VT)

Photo: [Street signs Church and Main Streets downtown Saint Johnsbury VT September 2017](https://commons.wikimedia.org/wiki/File:Street_signs_Church_and_Main_Streets_downtown_Saint_Johnsbury_VT_September_2017.jpg) by Artaxerxes, CC BY-SA 4.0.
Note: No arrow on the corner sign, so it covers this spot all the time.

| Time | Expected | Live reading | Result |
|---|---|---|---|
| Mon 9:00 AM | no | no | right |
| Tue 8:45 AM | no | no | right |
| Sat 2:00 PM | no | no | right |
| Sun 3:00 AM | no | no | right |

Live reading (@cf/meta/llama-4-scout-17b-16e-instruct, 8212 ms):
- 1. NO PARKING HERE TO CORNER: No parking anytime
- 2. WINTER PARKING BAN NO PARKING 12 AM TO 6 AM NOV 15TH TO APRIL 15 TH: No parking 12:00 to 6:00 AM, Nov 15 to Apr 15

## q05.jpg (Hilo, HI)

Photo: [2013.11.01.104926 Parking sign Kilauea Avenue Hilo Hawaii](https://commons.wikimedia.org/wiki/File:2013.11.01.104926_Parking_sign_Kilauea_Avenue_Hilo_Hawaii.jpg) by Hermann Luyken, CC0. Car side: right.
Note: Car on the right, the 8 hour side. No holidays fall on the test days.

| Time | Expected | Live reading | Result |
|---|---|---|---|
| Mon 9:00 AM | unsure | unsure | right |
| Tue 8:45 AM | unsure | unsure | right |
| Sat 2:00 PM | unsure | unsure | right |
| Sun 3:00 AM | unsure | unsure | right |

Live reading (@cf/meta/llama-4-scout-17b-16e-instruct, 5537 ms):
- 1. NO PARKING ANY TIME (arrow left): No parking anytime
- 2. 8 HR PARKING 8AM-4PM EXCEPT SUNDAYS AND HOLIDAYS (arrow right): 8 hour parking Mon to Sat 8:00 AM to 4:00 PM

## q06.jpg (Ewing, NJ)

Photo: [2014-08-30 09 42 32 "No Parking When Road Is Snow Covered" and "No Parking Here To Corner" signs on Brenwal Avenue in Ewing, New Jersey](https://commons.wikimedia.org/wiki/File:2014-08-30_09_42_32_%22No_Parking_When_Road_Is_Snow_Covered%22_and_%22No_Parking_Here_To_Corner%22_signs_on_Brenwal_Avenue_in_Ewing,_New_Jersey.JPG) by Famartin, CC BY-SA 4.0. Car side: right.
Note: Car on the right, the side the corner sign covers.

| Time | Expected | Live reading | Result |
|---|---|---|---|
| Mon 9:00 AM | no | no | right |
| Tue 8:45 AM | no | no | right |
| Sat 2:00 PM | no | no | right |
| Sun 3:00 AM | no | no | right |

Live reading (@cf/meta/llama-4-scout-17b-16e-instruct, 10341 ms):
- 1. NO PARKING WHEN ROAD IS SNOW COVERED: No parking anytime, when road is snow covered
- 2. NO PARKING HERE TO CORNER (arrow right): No parking anytime

## q07.jpg (Rochelle Park, NJ)

Photo: [2021-07-20 19 08 29 "Entering Rochelle Park" and "No Parking" signs along southbound Bergen County Route 62 (Passaic Street) just south of New Jersey State Route 444 (Garden State Parkway) in Rochelle Park Township, Bergen County, New Jersey](https://commons.wikimedia.org/wiki/File:2021-07-20_19_08_29_%22Entering_Rochelle_Park%22_and_%22No_Parking%22_signs_along_southbound_Bergen_County_Route_62_(Passaic_Street)_just_south_of_New_Jersey_State_Route_444_(Garden_State_Parkway)_in_Rochelle_Park_Township,_Bergen_County,_New_Jersey.jpg) by Famartin, CC BY-SA 4.0.
Note: The town name sign and the soliciting rule are not parking rules.

| Time | Expected | Live reading | Result |
|---|---|---|---|
| Mon 9:00 AM | yes | yes | right |
| Tue 8:45 AM | yes | yes | right |
| Sat 2:00 PM | yes | yes | right |
| Sun 3:00 AM | no | no | right |

Live reading (@cf/meta/llama-4-scout-17b-16e-instruct, 3559 ms):
- 1. NO PARKING ON ANY STREET IN ROCHELLE PARK 3 AM TO 6 AM: No parking 3:00 to 6:00 AM

## q08.jpg (Chicago, IL)

Photo: [Street cleaning and Park Chicago signs (24269657648)](https://commons.wikimedia.org/wiki/File:Street_cleaning_and_Park_Chicago_signs_(24269657648).jpg) by Eric Fischer, CC BY 2.0. Car side: right.
Note: Car on the right, the pay box side. No hours printed, so paid parking all week.

| Time | Expected | Live reading | Result |
|---|---|---|---|
| Mon 9:00 AM | yes | yes | right |
| Tue 8:45 AM | yes | yes | right |
| Sat 2:00 PM | yes | yes | right |
| Sun 3:00 AM | yes | yes | right |

Live reading (@cf/meta/llama-4-scout-17b-16e-instruct, 7262 ms):
- 1. STREET CLEANING NO PARKING 7AM - 9AM WEDNESDAY APRIL 1 - OCT 31 TOW ZONE: No parking Wed 7:00 to 9:00 AM, Apr 1 to Oct 31, street cleaning tow away
- 2. P PAY AT PAY BOX OR SIGN UP AT ParkChicago.com FOR MOBILE PAY ZONE 465 113 (arrow right): Paid parking anytime

## q09.jpg (San Diego, CA)

Photo: [Mission Heights Neighborhood Park regulations signs](https://commons.wikimedia.org/wiki/File:Mission_Heights_Neighborhood_Park_regulations_signs.jpg) by RightCowLeftCoast, CC BY-SA 4.0.
Note: Park lot closed sunset to 8 AM. Sunset is not a fixed time, so the expected verdicts are written directly: open on the daytime test times, closed at Sunday 3 AM. The regulations panel also bans overnight parking.

| Time | Expected | Live reading | Result |
|---|---|---|---|
| Mon 9:00 AM | yes | no | WRONG NO |
| Tue 8:45 AM | yes | no | WRONG NO |
| Sat 2:00 PM | yes | no | WRONG NO |
| Sun 3:00 AM | no | no | right |

Live reading (@cf/meta/llama-4-scout-17b-16e-instruct, 7147 ms):
- 1. PARKING LOT CLOSED SUNSET TO 8:00 AM S.D.M.C./ 84.02: No parking 12:00 to 8:00 AM, hours set by sunrise or sunset
- 2. THE CITY OF SAN DIEGO REGULATIONS For Walkways, Park Areas and Adjacent Parking Lots: No parking anytime

## q10.jpg (Fern Ridge, near Eugene, OR)

Photo: [No Horses and No Parking Signs](https://commons.wikimedia.org/wiki/File:No_Horses_and_No_Parking_Signs.jpg) by Rick Obst, CC BY 2.0.
Note: No horses and no off-road vehicles are not parking rules.

| Time | Expected | Live reading | Result |
|---|---|---|---|
| Mon 9:00 AM | no | no | right |
| Tue 8:45 AM | no | no | right |
| Sat 2:00 PM | no | no | right |
| Sun 3:00 AM | no | no | right |

Live reading (@cf/meta/llama-4-scout-17b-16e-instruct, 7019 ms):
- 1. Anytime No Parking: No parking anytime
- 2. No Off-Road Vehicles: Restricted anytime
- 3. No Horses: Restricted anytime
