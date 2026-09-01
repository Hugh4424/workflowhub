#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
const input = process.argv[2] ? resolve(process.argv[2]) : null;
const material = input && readFileSync(input, "utf8");
const requestPath = process.env.WORKFLOWHUB_WH_REVIEW_REQUEST;
if (!requestPath) throw new Error("WORKFLOWHUB_WH_REVIEW_REQUEST is required");
const publicResult = JSON.parse(execFileSync(process.execPath, ["skills/wh-review/scripts/wh-review-cli.mjs", "run", resolve(requestPath)], { encoding: "utf8" }));
const findings = publicResult.findings ?? publicResult.result?.findings;
if (!Array.isArray(findings)) throw new Error("wh-review public result has no findings array");
const result = { schema_version: "workflowhub-review-chain.v1", status: findings.length ? "findings" : "clean", findings, material_sha256: material ? createHash("sha256").update(material).digest("hex") : null, provider: "wh-review", public_result: publicResult };
const out = resolve(process.argv[3] ?? "quality/reviews/m16-final-review-chain.json"); mkdirSync(dirname(out), { recursive: true }); writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`); console.log(JSON.stringify(result));
