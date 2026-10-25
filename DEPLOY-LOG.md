# Deploy Log

Worker: `can-i-park-here` at https://can-i-park-here.lumegridai.workers.dev

Each deploy lists its version id and the version it replaced. To roll back, run the command on that line from this folder.

| When (UTC) | Version | Previous | What | Rollback |
|---|---|---|---|---|
| 2026-10-24 | be81ae7c-2da3-41f5-8dbb-312a4e080e64 | 5d7e3b45-fc56-4b9d-ba18-814e7e798577 | Slice 1: live sign reader, bare upload page | `npx wrangler rollback 5d7e3b45-fc56-4b9d-ba18-814e7e798577` |
| 2026-10-24 | 88ece2bf-6449-4cc5-ac63-96c6876d2b27 | be81ae7c-2da3-41f5-8dbb-312a4e080e64 | Slices 2 to 4: engine, cards, verdict, week grid, finished design | `npx wrangler rollback be81ae7c-2da3-41f5-8dbb-312a4e080e64` |
| 2026-10-24 | 7ab2489d-1ec0-4fa8-b226-fe4164c84048 | 88ece2bf-6449-4cc5-ac63-96c6876d2b27 | Prompt: skip angle parking and exemption panels; condition words | `npx wrangler rollback 88ece2bf-6449-4cc5-ac63-96c6876d2b27` |
| 2026-10-24 | c59fff6e-5707-4283-bca9-ab6083c001e9 | 7ab2489d-1ec0-4fa8-b226-fe4164c84048 | Prompt: arrows judged by arrowhead; validator drops exemption panels | `npx wrangler rollback 7ab2489d-1ec0-4fa8-b226-fe4164c84048` |
| 2026-10-24 | e32f842d-24a8-4757-8ba2-c09fa972f7b5 | c59fff6e-5707-4283-bca9-ab6083c001e9 | Slices 5 and 6: sample poles, arrow safety rule, accuracy card | `npx wrangler rollback c59fff6e-5707-4283-bca9-ab6083c001e9` |
