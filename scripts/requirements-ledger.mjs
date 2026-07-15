#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { canonicalJson } from "../core/canonical-source.mjs";
import { createRequirementLedger, createRequirementsCoverage } from "../core/requirement-ledger.mjs";

function fail(code, message) { process.stderr.write(`${code}: ${message}\n`); process.exitCode = 2; }
function args(argv) { const out = {}; for (let i = 2; i < argv.length; i += 2) { if (!argv[i]?.startsWith("--") || !argv[i + 1]) throw new TypeError("USAGE: --source-manifest <json> --mappings <json> --ledger-out <json> --coverage-out <json>"); out[argv[i].slice(2)] = argv[i + 1]; } return out; }
try {
  const options = args(process.argv);
  for (const key of ["source-manifest", "mappings", "ledger-out", "coverage-out"]) if (!options[key]) throw new TypeError("USAGE: --source-manifest <json> --mappings <json> --ledger-out <json> --coverage-out <json>");
  const source_manifest = JSON.parse(readFileSync(resolve(options["source-manifest"]), "utf8"));
  const mappingInput = JSON.parse(readFileSync(resolve(options.mappings), "utf8"));
  const result = createRequirementLedger({ source_manifest, mappings: mappingInput.mappings ?? mappingInput });
  if (!result.ok) fail(result.code ?? "REQUIREMENT_LEDGER_INVALID", result.errors?.join("; ") ?? "invalid ledger");
  else {
    const coverage = createRequirementsCoverage(result.ledger);
    for (const [key, value] of [["ledger-out", result.ledger], ["coverage-out", coverage]]) { const target = resolve(options[key]); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, `${canonicalJson(value)}\n`, "utf8"); }
    process.stdout.write(`${resolve(options["ledger-out"])}\n${resolve(options["coverage-out"])}\n`);
  }
} catch (error) { fail("REQUIREMENT_LEDGER_ERROR", error.message); }
