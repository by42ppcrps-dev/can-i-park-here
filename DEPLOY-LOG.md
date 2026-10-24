# Deploy Log

Worker: `can-i-park-here` at https://can-i-park-here.lumegridai.workers.dev

Each deploy lists its version id and the version it replaced. To roll back, run the command on that line from this folder.

| When (UTC) | Version | Previous | What | Rollback |
|---|---|---|---|---|
| 2026-10-24 | be81ae7c-2da3-41f5-8dbb-312a4e080e64 | 5d7e3b45-fc56-4b9d-ba18-814e7e798577 | Slice 1: live sign reader, bare upload page | `npx wrangler rollback 5d7e3b45-fc56-4b9d-ba18-814e7e798577` |
