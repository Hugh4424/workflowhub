#!/usr/bin/env node

/**
 * Text-only decision-log chain hygiene warnings.
 *
 * This checker deliberately never becomes a gate: malformed or stale chain
 * fields are printed as advisory facts and the process exits 0.
 * Only local text structure and explicit current references are inspected.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
const executionHash = bytes => createHash("sha256").update(bytes).digest("hex");
const checkerExecutionHash = executionHash(readFileSync(fileURLToPath(import.meta.url)));

const CHAIN_FIELDS = ["决定", "为什么", "否掉了什么", "后果与风险", "影响面"];
const CURRENT_FIELDS = ["做什么", "不做什么", "风险", "改动"];
const LEGACY_CHAIN_FIELDS = ["module", "requirement_ids", "derived_from", "artifacts"];
const DECISION_ID = /^(?:ADR|D)-\d+$/;
const REQUIREMENT_ID = /^R-\d+[a-z]?$/;

function parseList(value) {
  const match = /^\[([^\]]*)\]$/.exec(value.trim().replaceAll("［", "[").replaceAll("］", "]"));
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
  const headings = new Set();
  const sourceIds = new Set();
  let inFence = false;
  let current = null;
  let headingLevel = 0;
  for (const [index, line] of lines.entries()) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const heading = /^(#{1,6})\s+(.+?)(?:\s+#+)?\s*$/.exec(line);
    if (heading) {
      headingLevel = heading[1].length;
      headings.add(heading[2]);
      const match = /^((?:N\d+|(?:ADR|D)-\d+))(?=\s|[—–-]|$)/.exec(heading[2]);
      const decision = match && (heading[1].length === 3 || heading[1].length === 4);
      if (current && (decision || heading[1].length <= current.level)) current = null;
      if (decision) {
        current = { decision_id: match[1], level: heading[1].length, lines: [] };
        sections.push(current);
      }
    }
    // Only declarations in local headings, index rows or list entries are
    // sources. A number merely mentioned by a reference cannot declare itself.
    if ((heading && /^(?:\*\*)?[RU]-\d+\b/.test(heading[2])) || /^\|\s*(?:\*\*)?[RU]-\d+\b/.test(line)
      || /^[-*+]\s+(?:\*\*)?[RU]-\d+\b/.test(line)) {
      const id = /[RU]-\d+\b/.exec(heading?.[2] ?? (line.startsWith("|") ? line.split("|")[1] : line));
      sourceIds.add(id[0]);
    }
    if (current && !heading) current.lines.push({ text: line, line: index + 1, parent: headingLevel === current.level });
  }
  return { sections, headings, sourceIds };
}

// Only explicitly headed unit tables contribute unit warnings; they never
// contribute decision parent-field statistics. Headings mirror the real sources.
function unitWarnings(markdown) {
  const warnings = [];
  let columns = null;
  let fence = null;
  for (const line of markdown.split("\n")) {
    const marker = /^\s*(`{3,}|~{3,})/.exec(line);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null;
      columns = null;
      continue;
    }
    if (fence) continue;
    if (!/^\s*\|/.test(line)) { columns = null; continue; }
    const cells = line.trim().replace(/^\||\|$/g, "").split("|").map(value => value.trim());
    const names = cells.map(value => value.replace(/\*\*/g, "").replace(/（[^）]*）/g, "").trim());
    if (["单元", "派生号", "需求"].includes(names[0])
      && ["谁接", "落在哪", "怎么验"].every(field => names.includes(field))) {
      columns = names;
      continue;
    }
    if (!columns || cells.every(value => /^:?-+:?$/.test(value))) continue;
    const idCell = cells[0].replace(/\*\*/g, "");
    // Current coverage rows carry parent-source type plus an explicit unit.
    // An explicit “无单元” row declares no unit, not a malformed unit.
    if (/·\s*无单元$/.test(idCell)) continue;
    const id = /·\s*单元\s+(R-\d+[a-z])(?=\s|$)/.exec(idCell)?.[1]
      ?? /^(R-\d+[a-z])(?=\s|（|$)/.exec(idCell)?.[1];
    if (!id) {
      warnings.push(warning("invalid_unit_id", idCell || "unknown", "单元", `${idCell || "unknown"} contains an invalid unit id`));
      continue;
    }
    for (const field of ["谁接", "落在哪", "怎么验"]) {
      if (!cells[columns.indexOf(field)]?.trim()) {
        warnings.push(warning("missing_unit_field", id, field, `${id} is missing ${field}`));
      }
    }
  }
  return warnings;
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

  const { sections, headings, sourceIds } = decisionSections(markdown);
  const knownDecisions = new Set(sections.map(({ decision_id }) => decision_id));
  const warnings = unitWarnings(markdown);
  let recognizedFields = 0;

  if (sections.length === 0) {
    warnings.push(warning(
      "no_decision_entries",
      "unknown",
      "decision_entries",
      "no decision entries were recognized; chain coverage is unavailable",
    ));
  }

  for (const { decision_id, lines } of sections) {
    const body = lines.filter(({ parent }) => parent).map(({ text }) => text).join("\n");
    const parents = lines.flatMap(({ text, line, parent }) => {
      // Indented children do not supply parent fields. Legacy ADRs also used
      // semicolon-separated labels on one parent line; retain that spelling.
      if (!parent || /^\s/.test(text)) return [];
      const parts = text.split(/[;；]\s*(?=(?:\*\*)?(?:原)?(?:决定|为什么|否掉了什么|后果与风险|影响面)(?:\*\*)?\s*[:：])/);
      return parts.flatMap((part) => {
        const match = /^(?:[-*+]\s+)?(?:\*\*)?([^:*：\n]+?)(?:\*\*)?\s*[:：]\s*(.*?)\s*$/.exec(part);
        if (!match) return [];
        const field = match[1].replace(/（[^）]*）$/, "").replace(/^原决定$/, "决定").trim();
        if (!/^(?:[-*+]\s+|\*\*)/.test(part)
          && ![...CURRENT_FIELDS, ...CHAIN_FIELDS, ...LEGACY_CHAIN_FIELDS].includes(field)) return [];
        return [{ field, value: match[2], line }];
      });
    });
    const hasCurrent = parents.some(({ field }) => CURRENT_FIELDS.includes(field));
    const hasOld = parents.some(({ field }) => CHAIN_FIELDS.includes(field));
    const hasLegacy = parents.some(({ field }) => LEGACY_CHAIN_FIELDS.includes(field))
      || LEGACY_CHAIN_FIELDS.some(field => new RegExp(`^[\\t ]*(?:[-*+][\\t ]+)?(?:\\*\\*)?${field}(?:\\*\\*)?[\\t ]*[:：]`, "m").test(body));
    const shape = decision_id.startsWith("N") || hasCurrent ? "current"
      : hasOld ? "chain" : hasLegacy ? "legacy" : "unknown";
    const isCurrent = shape === "current";
    const isLegacy = shape === "legacy";
    const requiredFields = isCurrent ? CURRENT_FIELDS : shape === "chain" ? CHAIN_FIELDS : isLegacy ? LEGACY_CHAIN_FIELDS : [];
    if (shape === "unknown") {
      warnings.push(warning("unknown_decision_shape", decision_id, "decision_fields", `${decision_id} has no recognized current or historical parent labels; field coverage is unknown`));
    }
    if (isCurrent) {
      for (const [index, parent] of parents.entries()) {
        if (parents.slice(0, index).some(({ field }) => field === parent.field)) {
          warnings.push(warning("duplicate_chain_field", decision_id, parent.field, `${decision_id} repeats parent ${parent.field} at line ${parent.line}`));
        }
        if (!CURRENT_FIELDS.includes(parent.field)) {
          warnings.push(warning("conflicting_chain_field", decision_id, parent.field, `${decision_id} has unexpected parent ${parent.field} at line ${parent.line}`));
        }
      }
    }
    const fields = isLegacy ? LEGACY_CHAIN_FIELDS : [...new Set([...CURRENT_FIELDS, ...CHAIN_FIELDS, ...LEGACY_CHAIN_FIELDS])];
    const values = Object.fromEntries(fields.map((field) => {
      const label = field === "决定" ? "(?:原)?决定" : field;
      const match = isLegacy ? body.match(new RegExp(`^[\\t ]*(?:[-*+][\\t ]+)?(?:\\*\\*)?${label}(?:（[^）\\n]*）)?(?:\\*\\*)?[\\t ]*[:：][\\t ]*(.+?)[\\t ]*$`, "m")) : null;
      const value = isLegacy ? match?.[1]?.trim() : parents.find((parent) => parent.field === field && parent.value.trim())?.value.trim();
      if (value) recognizedFields += 1;
      return [field, value || null];
    }));

    for (const field of requiredFields) {
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

    if (isCurrent) {
      for (const { text } of lines) {
        for (const sentence of text.split(/[。！？]/)) {
          // Scope each explicit reference by its own preceding clause. A
          // history path elsewhere in this sentence cannot hide current refs.
          const externalDomain = /历史|旧(?:编号|决定|文|记录|来源)|另一(?:个)?文件|其他文件|外部|external|archive\/|[\w./-]+\.md\b/i;
          const isCurrentReference = (index, end) => {
            const prefix = sentence.slice(0, index).split(/[，,；;]/).at(-1);
            if (/本当前文|本块|本文件|当前(?:文|决定|块)?/.test(prefix)) return true;
            const qualifier = /^\s*[（(]([^）)]*)[）)]/.exec(sentence.slice(end));
            return !externalDomain.test(`${prefix} ${qualifier?.[1] ?? ""}`);
          };
          for (const sectionRef of sentence.matchAll(/(?:引用|参见|指向)\s+#{1,6}\s+([^，,；;]+?)(?=[，,；;]|$)/g)) {
            let title = sectionRef[1].trim().replace(/^[`「“'"]|[`」”'"]$/g, "");
            let end = sectionRef.index + sectionRef[0].length;
            const qualifier = /[（(]([^（）()]*)[）)]$/.exec(title);
            // Preserve declared literal headings and ordinary title brackets.
            // Only an identifiable attached source belongs to reference scope.
            if (qualifier && !headings.has(title) && externalDomain.test(qualifier[1])) {
              end = sectionRef.index + sectionRef[0].lastIndexOf(qualifier[0]);
              title = title.slice(0, qualifier.index).trim();
            }
            if (!isCurrentReference(sectionRef.index, end)) continue;
            if (!headings.has(title)) warnings.push(warning("missing_section_reference", decision_id, "references", `${decision_id} references missing current section ${title}`));
          }
          for (const reference of sentence.matchAll(/(?:引用|依赖|参见|指向|关联)[\s`：:]*((?:N\d+|(?:ADR|D)-\d+|[RU]-\d+)\b(?:[\s`、,，与和及]+(?:N\d+|(?:ADR|D)-\d+|[RU]-\d+)\b)*)/g)) {
            if (!isCurrentReference(reference.index, reference.index + reference[0].length)) continue;
            for (const [id] of reference[1].matchAll(/(?:N\d+|(?:ADR|D)-\d+|[RU]-\d+)\b/g)) {
              if (!/^[RU]-/.test(id) && !knownDecisions.has(id)) {
                warnings.push(warning("missing_decision_reference", decision_id, "references", `${decision_id} references missing current ${id}`));
              } else if (/^[RU]-/.test(id) && !sourceIds.has(id)) {
                warnings.push(warning("unknown_source_reference", decision_id, "references", `${decision_id} references ${id}, whose source is unavailable in the current text`));
              }
            }
          }
        }
      }
    }
  }

  return {
    schema_version: "decision-log-chain-warning.v1",
    source_ref,
    recognized_blocks: sections.length,
    recognized_fields: recognizedFields,
    warnings,
    failures: [],
    exit_code: 0,
  };
}

function parseArgs(args) {
  const values = { file: null, root: resolve(".") };
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    if (flag !== "--file" && flag !== "--root") return { error: `unknown argument ${flag}` };
    const value = args[++index];
    if (!value || value.startsWith("--")) return { error: `${flag} requires a value` };
    if (flag === "--file") values.file = value;
    else values.root = resolve(value);
  }
  return values;
}

function inputFiles({ file, root }) {
  if (file) return [{ path: resolve(file), source_ref: file }];
  if (!statSync(root).isDirectory()) throw Object.assign(new Error("not a directory"), { code: "ENOTDIR" });
  const specs = join(root, "specs");
  let entries;
  try { entries = readdirSync(specs, { withFileTypes: true }); }
  catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  return entries
    .filter((entry) => entry.isDirectory() && entry.name !== "archive")
    .map((entry) => ({
      path: join(specs, entry.name, "decision-log.md"),
      source_ref: `specs/${entry.name}/decision-log.md`,
    }))
    .filter(({ path }) => {
      try { statSync(path); return true; }
      catch (error) {
        if (error.code === "ENOENT") return false;
        throw error;
      }
    });
}

export function main(args = process.argv.slice(2)) {
  const values = parseArgs(args);
  if (values.error) {
    console.error(`[check-decision-log-chain] ${values.error}; expected --file <path> or --root <directory>`);
    return 1;
  }
  let files;
  try { files = inputFiles(values); }
  catch (error) {
    console.error(`[check-decision-log-chain] cannot read root ${values.root}: ${error.code ?? error.message}; expected an existing directory`);
    return 1;
  }
  if (files.length === 0) {
    console.log(`[check-decision-log-chain] no input: no decision-log.md found under ${values.root}; nothing checked`);
    return 0;
  }
  let warningCount = 0;
  let checkedInputs = 0;
  let hadReadError = false;
  for (const input of files) {
    let markdown, inputBytes;
    try { inputBytes = readFileSync(input.path); markdown = inputBytes.toString("utf8"); }
    catch (error) {
      console.error(`[check-decision-log-chain] cannot read ${input.source_ref}: ${error.code ?? error.message}`);
      hadReadError = true;
      continue;
    }
    if (!markdown.trim()) {
      console.log(`[check-decision-log-chain] no input: ${input.source_ref} is empty; nothing checked`);
      continue;
    }
    checkedInputs += 1;
    const result = checkDecisionLogChain({ markdown, source_ref: input.source_ref });
    console.log(`[check-decision-log-chain] scanned ${JSON.stringify({input_path:resolve(input.path),input_sha256:executionHash(inputBytes),checker_sha256:checkerExecutionHash})}`);
    for (const item of result.warnings) {
      warningCount += 1;
      console.log(`[check-decision-log-chain] WARNING ${input.source_ref} ${item.decision_id}.${item.field}: ${item.message}`);
    }
  }
  if (hadReadError) {
    console.error(`[check-decision-log-chain] input read failed; check incomplete, exit 1`);
    return 1;
  }
  if (checkedInputs > 0) console.log(`[check-decision-log-chain] advisory complete: ${warningCount} warning(s), non-blocking, exit 0`);
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  process.exitCode = main();
}
