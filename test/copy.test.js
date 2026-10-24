import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const TEXT = new Set([".html", ".js", ".css", ".json", ".md", ".svg", ".mjs"]);
function files(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p) : TEXT.has(extname(p)) ? [p] : [];
  });
}

test("no UI string or doc contains an em dash", () => {
  const targets = [
    ...files("public"), ...files("src"), ...files("scripts"),
    ...["README.md", "DEPLOY-LOG.md", "LICENSE"].filter(existsSync),
  ];
  assert.ok(targets.length > 10);
  const hits = targets.filter((f) => readFileSync(f, "utf8").includes("—"));
  assert.deepEqual(hits, []);
});
