#!/usr/bin/env node

/**
 * Text-only decision-log chain hygiene warnings.
 *
 * This checker deliberately never becomes a gate: malformed or stale chain
 * fields are printed as advisory facts and the process exits 0. The runtime
 * decision-entry.v1 schema remains the machine contract.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const CHAIN_FIELDS = ["module", "requirement_ids", "derived_from", "artifacts"];
const DECISION_ID = /^D-\d+$/;
const REQUIREMENT_ID = /^R-\d+$/;

function parseList(value) {
  const match = /^\[([^\]]*)\]$/.exec(value.trim());
  if (!match) return null;
  if (!match[1].trim()) return [];
  return match[1].split(",").map((item) => item.trim().replace(/^['"]|['"]$/g, ""));
}

function warning(code, decision_id, field, message) {
  return { code, decision_id, field, message };
}

function decisionSections(markdown) {
  const lines = markdown.split("\n");
  const sections = [];
  let inFence = false;
  let offset = 0;
  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      offset += line.length + 1;
      continue;
    }
    if (!inFence) {
      const match = /^#{3,4}\s+(D-\d+)\b[^\n]*$/.exec(line);
      if (match) sections.push({ decision_id: match[1], heading_start: offset, body_start: offset + line.length + 1 });
    }
    offset += line.length + 1;
  }
  return sections.map((section, index) => ({
    decision_id: section.decision_id,
    body: markdown.slice(section.body_start, sections[index + 1]?.heading_start ?? markdown.length),
  }));
}

export function checkDecisionLogChain({ markdown, source_ref = "decision-log.md" } = {}) {
  if (typeof markdown !== "string") {
    return {
      schema_version: "decision-log-chain-warning.v1",
      source_ref,
      warnings: [warning("invalid_input", "unknown", "markdown", "decision log content is not text")],
      failures: [],
      exit_code: 0,
    };
  }

  const sections = decisionSections(markdown);
  const knownDecisions = new Set(sections.map(({ decision_id }) => decision_id));
  const warnings = [];

  if (sections.length === 0) {
    warnings.push(warning(
      "no_decision_entries",
      "unknown",
      "decision_entries",
      "no decision entries were recognized; chain coverage is unavailable",
    ));
  }

  for (const { decision_id, body } of sections) {
    const values = Object.fromEntries(CHAIN_FIELDS.map((field) => {
      const match = body.match(new RegExp(`^${field}:\\s*(.+)$`, "m"));
      return [field, match?.[1]?.trim() ?? null];
    }));

    for (const field of CHAIN_FIELDS) {
      if (values[field] === null) {
        warnings.push(warning("missing_chain_field", decision_id, field, `${decision_id} is missing ${field}`));
      }
    }

    if (values.module !== null && values.module.trim() === "") {
      warnings.push(warning("invalid_chain_field", decision_id, "module", `${decision_id} module is empty`));
    }

    for (const field of ["requirement_ids", "derived_from", "artifacts"]) {
      if (values[field] === null) continue;
      const list = parseList(values[field]);
      if (!list) {
        warnings.push(warning("invalid_chain_field", decision_id, field, `${decision_id} ${field} must be a bracketed list`));
        continue;
      }
      if (field === "requirement_ids" && list.some((item) => !REQUIREMENT_ID.test(item))) {
        warnings.push(warning("invalid_chain_field", decision_id, field, `${decision_id} contains an invalid requirement id`));
      }
      if (field === "derived_from") {
        for (const item of list) {
          if (!DECISION_ID.test(item)) {
            warnings.push(warning("invalid_chain_field", decision_id, field, `${decision_id} contains an invalid decision id`));
          } else if (!knownDecisions.has(item)) {
            warnings.push(warning("missing_decision_reference", decision_id, field, `${decision_id} references missing ${item}`));
          }
        }
      }
      if (field === "artifacts" && list.some((item) => item.length === 0)) {
        warnings.push(warning("invalid_chain_field", decision_id, field, `${decision_id} contains an empty artifact reference`));
      }
    }
  }

  return {
    schema_version: "decision-log-chain-warning.v1",
    source_ref,
    warnings,
    failures: [],
    exit_code: 0,
  };
}

function parseArgs(args) {
  const values = { file: null, root: resolve(".") };
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--file") values.file = args[++index];
    else if (args[index] === "--root") values.root = resolve(args[++index]);
  }
  return values;
}

function inputFiles({ file, root }) {
  if (file) return [{ path: resolve(file), source_ref: file }];
  const specs = join(root, "specs");
  if (!existsSync(specs)) return [];
  return readdirSync(specs, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "archive")
    .map((entry) => ({
      path: join(specs, entry.name, "decision-log.md"),
      source_ref: `specs/${entry.name}/decision-log.md`,
    }))
    .filter(({ path }) => existsSync(path));
}

export function main(args = process.argv.slice(2)) {
  const files = inputFiles(parseArgs(args));
  let warningCount = 0;
  for (const input of files) {
    const result = checkDecisionLogChain({ markdown: readFileSync(input.path, "utf8"), source_ref: input.source_ref });
    for (const item of result.warnings) {
      warningCount += 1;
      console.log(`[check-decision-log-chain] WARNING ${input.source_ref} ${item.decision_id}.${item.field}: ${item.message}`);
    }
  }
  console.log(`[check-decision-log-chain] advisory complete: ${warningCount} warning(s), non-blocking, exit 0`);
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  process.exitCode = main();
}
