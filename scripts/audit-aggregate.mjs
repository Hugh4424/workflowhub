#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { buildAuditSummaryFromJournalEvents } from "../core/audit-aggregator.mjs";
import { canonicalJson } from "../core/canonical-source.mjs";

function fail(code, message) { process.stderr.write(`${code}: ${message}\n`); process.exitCode = 2; }
function args(argv) { const out = {}; for (let i = 2; i < argv.length; i += 2) { if (!argv[i]?.startsWith("--") || !argv[i + 1]) throw new TypeError("USAGE: --journal <jsonl|json> --manifest <json> --ledger <json> --stage <long-stage> --workflow-run-id <id> --output <json>"); out[argv[i].slice(2)] = argv[i + 1]; } return out; }
function journalEvents(path) { const bytes = readFileSync(resolve(path), "utf8").trim(); return bytes.startsWith("[") ? JSON.parse(bytes) : (bytes ? bytes.split("\n").map((line) => JSON.parse(line)) : []); }
try {
  const options = args(process.argv);
  for (const key of ["journal", "manifest", "ledger", "stage", "workflow-run-id", "output"]) if (!options[key]) throw new TypeError("USAGE: --journal <jsonl|json> --manifest <json> --ledger <json> --stage <long-stage> --workflow-run-id <id> --output <json>");
  const result = buildAuditSummaryFromJournalEvents(journalEvents(options.journal), options.stage, options["workflow-run-id"], { manifest: JSON.parse(readFileSync(resolve(options.manifest), "utf8")), ledger: JSON.parse(readFileSync(resolve(options.ledger), "utf8")) });
  const target = resolve(options.output); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, `${canonicalJson(result.audit_summary)}\n`, "utf8");
  process.stdout.write(`${target}\n${result.audit_summary.verdict}\n`);
  if (result.audit_summary.verdict !== "pass") process.exitCode = 1;
} catch (error) { fail("AUDIT_AGGREGATE_ERROR", error.message); }
