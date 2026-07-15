#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildAuditSummaryFromJournalEvents } from "../core/audit-aggregator.mjs";
import { canonicalJson } from "../core/canonical-source.mjs";

function fail(code, message) { process.stderr.write(`${code}: ${message}\n`); process.exitCode = 2; }
function args(argv) { const out = {}; for (let i = 2; i < argv.length; i += 2) { if (!argv[i]?.startsWith("--") || !argv[i + 1]) throw new TypeError("USAGE: --journal <jsonl|json> --manifest <json> --ledger <json> --stage <long-stage> --workflow-run-id <id>"); out[argv[i].slice(2)] = argv[i + 1]; } return out; }
function journalEvents(path) { const bytes = readFileSync(resolve(path), "utf8").trim(); return bytes.startsWith("[") ? JSON.parse(bytes) : (bytes ? bytes.split("\n").map((line) => JSON.parse(line)) : []); }
try {
  const options = args(process.argv);
  for (const key of ["journal", "manifest", "ledger", "stage", "workflow-run-id"]) if (!options[key]) throw new TypeError("USAGE: --journal <jsonl|json> --manifest <json> --ledger <json> --stage <long-stage> --workflow-run-id <id>");
  if (options.output) throw new TypeError("--output is forbidden; the parent stage must persist the summary through TaskHandle");
  const result = buildAuditSummaryFromJournalEvents(journalEvents(options.journal), options.stage, options["workflow-run-id"], { manifest: JSON.parse(readFileSync(resolve(options.manifest), "utf8")), ledger: JSON.parse(readFileSync(resolve(options.ledger), "utf8")) });
  process.stdout.write(`${canonicalJson(result.audit_summary)}\n`);
  if (result.audit_summary.verdict !== "pass") process.exitCode = 1;
} catch (error) { fail("AUDIT_AGGREGATE_ERROR", error.message); }
