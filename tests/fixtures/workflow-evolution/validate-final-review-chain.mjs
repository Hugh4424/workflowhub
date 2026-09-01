#!/usr/bin/env node
import { readFileSync } from "node:fs";
const path = process.argv[2] ?? "quality/reviews/m16-final-review-chain.json";
const value = JSON.parse(readFileSync(path, "utf8"));
if (value.schema_version !== "workflowhub-review-chain.v1" || !["clean", "findings", "unavailable"].includes(value.status) || !Array.isArray(value.findings)) process.exit(32);
console.log(JSON.stringify({ status: "ok", review_status: value.status, findings: value.findings.length }));
