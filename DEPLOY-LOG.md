# Deploy Log

Worker: `can-i-park-here` at https://park.trylumegrid.com

Each deploy lists its version id and the version it replaced. To roll back, run the command on that line from this folder.

| When (UTC) | Version | Previous | What | Rollback |
|---|---|---|---|---|
| 2026-10-24 | be81ae7c-2da3-41f5-8dbb-312a4e080e64 | 5d7e3b45-fc56-4b9d-ba18-814e7e798577 | Slice 1: live sign reader, bare upload page | `npx wrangler rollback 5d7e3b45-fc56-4b9d-ba18-814e7e798577` |
| 2026-10-24 | 88ece2bf-6449-4cc5-ac63-96c6876d2b27 | be81ae7c-2da3-41f5-8dbb-312a4e080e64 | Slices 2 to 4: engine, cards, verdict, week grid, finished design | `npx wrangler rollback be81ae7c-2da3-41f5-8dbb-312a4e080e64` |
| 2026-10-24 | 7ab2489d-1ec0-4fa8-b226-fe4164c84048 | 88ece2bf-6449-4cc5-ac63-96c6876d2b27 | Prompt: skip angle parking and exemption panels; condition words | `npx wrangler rollback 88ece2bf-6449-4cc5-ac63-96c6876d2b27` |
| 2026-10-24 | c59fff6e-5707-4283-bca9-ab6083c001e9 | 7ab2489d-1ec0-4fa8-b226-fe4164c84048 | Prompt: arrows judged by arrowhead; validator drops exemption panels | `npx wrangler rollback 7ab2489d-1ec0-4fa8-b226-fe4164c84048` |
| 2026-10-24 | e32f842d-24a8-4757-8ba2-c09fa972f7b5 | c59fff6e-5707-4283-bca9-ab6083c001e9 | Slices 5 and 6: sample poles, arrow safety rule, accuracy card | `npx wrangler rollback c59fff6e-5707-4283-bca9-ab6083c001e9` |
| 2026-10-24 | fa3e26fe-456e-4d72-9257-0be395e51885 | e32f842d-24a8-4757-8ba2-c09fa972f7b5 | Slice 7: final deploy with README and license in the repo | `npx wrangler rollback e32f842d-24a8-4757-8ba2-c09fa972f7b5` |
| 2026-10-24 | 620f7c11-dccd-4f78-8cae-701ed846573c | fa3e26fe-456e-4d72-9257-0be395e51885 | Fix: YES line names a time limit that starts later instead of "no limits found" | `npx wrangler rollback fa3e26fe-456e-4d72-9257-0be395e51885` |
| 2026-10-25 | 49d516e6-add1-43da-8d4c-d2845ef6ddcb | 620f7c11-dccd-4f78-8cae-701ed846573c | Revision 1: seasons, oversize rules, arrow fixes, cut off prompt, deep links | `npx wrangler rollback 620f7c11-dccd-4f78-8cae-701ed846573c` |
| 2026-10-25 | 660a5b73-a6a7-43c3-aa91-1b6c01dfc668 | 49d516e6-add1-43da-8d4c-d2845ef6ddcb | Prompt: look at the photo edges for cut off signs | `npx wrangler rollback 49d516e6-add1-43da-8d4c-d2845ef6ddcb` |
| 2026-10-25 | 38b2e690-3fc9-4ef3-9e75-fa1002bcbb5b | 660a5b73-a6a7-43c3-aa91-1b6c01dfc668 | Validator keeps unreadable signs that have no words | `npx wrangler rollback 660a5b73-a6a7-43c3-aa91-1b6c01dfc668` |
| 2026-10-25 | 9bb3066c-d108-47d9-b2d9-c4fa00f579b5 | 38b2e690-3fc9-4ef3-9e75-fa1002bcbb5b | Validator: sunrise and sunset hours are Not sure | `npx wrangler rollback 38b2e690-3fc9-4ef3-9e75-fa1002bcbb5b` |
| 2026-10-25 | 9cf0320f-7414-4c06-a4d3-93057a48e277 | 9bb3066c-d108-47d9-b2d9-c4fa00f579b5 | Engine: allowed-only signs Not sure at other times; new samples; demo card | `npx wrangler rollback 9bb3066c-d108-47d9-b2d9-c4fa00f579b5` |
| 2026-10-25 | a0113948-bf34-4c53-b5b5-71b38090885b | 9cf0320f-7414-4c06-a4d3-93057a48e277 | Accuracy file with the final version id (same counts) | `npx wrangler rollback 9cf0320f-7414-4c06-a4d3-93057a48e277` |
| 2026-10-26 | e196f8ba-22c8-4b54-80fc-9b0af3077df2 | a0113948-bf34-4c53-b5b5-71b38090885b | Custom domain park.trylumegrid.com; og meta points to it | `npx wrangler rollback a0113948-bf34-4c53-b5b5-71b38090885b` |
