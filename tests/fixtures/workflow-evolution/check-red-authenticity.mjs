#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync, mkdirSync, renameSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createHash } from "node:crypto";

const [suite, phase = "red", exitText = "1"] = process.argv.slice(2);
if (!suite) process.exit(24);
const gate = { schema_version: "workflow-evolution-gate.v1", suite, phase, exit_code: Number(exitText), status: Number(exitText) === 0 ? "green" : "red" };
const out = resolve(process.cwd(), {
  "pool-tax": "quality/tests/m16-p1-pool-tax/gate.json",
  "ledger-brief": "quality/tests/m16-p1-ledger-brief/gate.json",
  monitor: "quality/tests/m16-p2-monitor/gate.json",
  governance: "quality/tests/m16-p3-governance/gate.json",
}[suite] ?? `quality/tests/${suite}/gate.json`);
mkdirSync(dirname(out), { recursive: true });
const tmp = `${out}.tmp-${process.pid}`;
const raw = `${JSON.stringify({ ...gate, content_sha256: createHash("sha256").update(JSON.stringify(gate)).digest("hex") }, null, 2)}\n`;
writeFileSync(tmp, raw, "utf8");
renameSync(tmp, out);
if (!existsSync(out) || !readFileSync(out, "utf8")) process.exit(25);
process.exit(Number(exitText));
