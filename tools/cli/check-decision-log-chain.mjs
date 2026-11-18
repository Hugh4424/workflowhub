#!/usr/bin/env node

/**
 * Text-only decision-log chain hygiene warnings.
 *
 * Old-shape materials stay advisory: malformed or stale chain fields are
 * printed as facts and the process exits 0. A new-shape material that declares
 * answer source_id/modality/来源身份 is checked against the requirement index;
 * its three named answer-source codes make the process exit 1, because a
 * citation that cannot be verified must not look like a pass. The function's
 * result.exit_code carries the same distinction for private callers.
 * Only local text structure, the declared index and explicitly authorized
 * original files are inspected. New-shape 决定 N headings map through the
 * material's 旧编号对照; an unmapped block is reported as a warning, never
 * silently treated as zero entries.
 */

import { lstatSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { basename, dirname, isAbsolute, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
const executionHash = bytes => createHash("sha256").update(bytes).digest("hex");
const checkerExecutionHash = executionHash(readFileSync(fileURLToPath(import.meta.url)));

const CHAIN_FIELDS = ["决定", "为什么", "否掉了什么", "后果与风险", "影响面"];
const CURRENT_FIELDS = ["做什么", "不做什么", "风险", "改动"];
const LEGACY_CHAIN_FIELDS = ["module", "requirement_ids", "derived_from", "artifacts"];
const DECISION_ID = /^(?:ADR|D)-\d+$/;
const REQUIREMENT_ID = /^R-\d+[a-z]?$/;
const CURRENT_DECISION_HEADING = /^决定\s*(\d+)(?=\s|[:：—–-]|$)/;
const DECISION_ID_MAPPING_HEADING = /旧编号对照/;
// P1 source contract: the index answers "who wrote it" (four source classes)
// and "allow/require/suggest/refuse" (four tone grades). They are separate.
const SOURCE_FIELDS = ["source_id", "modality", "来源身份"];
const SOURCE_GRADES = ["自由手写", "明确选项采纳", "保存转录", "作者推断"];
const SOURCE_IDENTITIES = ["用户答复", "作者推断"];
const TONE_GRADES = ["permit", "require", "recommend", "reject"];
const ANSWER_FLAGS = ["ANSWER_SOURCE_UNVERIFIABLE", "ANSWER_MODALITY_MISMATCH", "ANSWER_INFERENCE_AS_USER"];
const INDEX_COLUMNS = ["编号", "来源分级", "答复原文", "语气", "原件ref与行位", "时点", "所属包"];
// Accepted original-position spellings: path#L7-L7, path#L7, path:7, path:7-9.
const SOURCE_REF = /^(.*?)(?:#L|:)(\d+)(?:-(?:L)?(\d+))?$/;

function parseList(value) {
  const match = /^\[([^\]]*)\]$/.exec(value.trim().replaceAll("［", "[").replaceAll("］", "]"));
  if (!match) return null;
  if (!match[1].trim()) return [];
  return match[1].split(",").map((item) => item.trim().replace(/^['"]|['"]$/g, ""));
}

function warning(code, decision_id, field, message) {
  return { code, decision_id, field, message };
}

// Markdown table cells keep an escaped pipe (`\|`) inside the cell; splitting
// on every `|` would shift the tone and original-position columns.
function tableCells(line) {
  const text = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  const cells = [];
  let value = "";
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === "\\" && text[index + 1] === "|") { value += "|"; index += 1; continue; }
    if (text[index] === "|") { cells.push(value); value = ""; continue; }
    value += text[index];
  }
  cells.push(value);
  return cells.map((cell) => cell.trim());
}

// New-shape bodies use 决定 N headings and keep the legacy ADR-/D- identity in
// the material's 旧编号对照 table. Only that named section can establish the
// mapping; a missing row stays visible instead of silently counting as zero.
function decisionIdMappings(markdown) {  const mappings = new Map();
  const lines = markdown.split("\n");
  let fence = null;
  let inSection = false;
  let sectionLevel = 0;
  for (const line of lines) {
    const nextFence = fenceStep(line, fence);
    if (nextFence !== fence) { fence = nextFence; continue; }
    if (fence) continue;
    const heading = /^(#{1,6})\s+(.+?)(?:\s+#+)?\s*$/.exec(line);
    if (heading) {
      if (inSection && heading[1].length <= sectionLevel) inSection = false;
      if (!inSection && DECISION_ID_MAPPING_HEADING.test(heading[2])) {
        inSection = true;
        sectionLevel = heading[1].length;
      }
      continue;
    }
    if (!inSection) continue;
    if (/^\s*\|/.test(line)) {
      const cells = tableCells(line).map((cell) => cell.replace(/\*\*|`/g, "").trim());
      const label = cells.find((cell) => /^决定\s*\d+$/.test(cell));
      const legacy = cells.find((cell) => DECISION_ID.test(cell));
      if (label && legacy) {
        mappings.set(label.replace(/\s+/g, " "), legacy);
        continue;
      }
    }
    const label = /决定\s*(\d+)/.exec(line);
    const legacy = /(?:ADR|D)-\d+/.exec(line);
    if (label && legacy) mappings.set(`决定 ${label[1]}`, legacy[0]);
  }
  return mappings;
}

function mappingSectionDeclared(markdown) {
  let fence = null;
  for (const line of markdown.split("\n")) {
    const nextFence = fenceStep(line, fence);
    if (nextFence !== fence) { fence = nextFence; continue; }
    if (fence) continue;
    if (/^#{1,6}[ \t]+.*旧编号对照/.test(line)) return true;
  }
  return false;
}

function fenceMarker(line) {
  const match = /^( {0,3})(`{3,}|~{3,})([^`~]*)$/.exec(line);
  return match ? { char: match[2][0], length: match[2].length, rest: match[3] } : null;
}

export function fenceStep(line, fence) {
  const marker = fenceMarker(line);
  if (!marker) return fence;
  if (!fence) return { char: marker.char, length: marker.length };
  if (marker.char === fence.char && marker.length >= fence.length && marker.rest.trim() === '') return null;
  return fence;
}

function decisionSections(markdown, mappings = new Map()) {
  const lines = markdown.split("\n");
  const sections = [];
  const unmapped = [];
  const nonCanonical = [];
  const headings = new Set();
  const sourceIds = new Set();
  // A material that carries 旧编号对照 declares the current decision shape.
  // Its unmapped 决定 N blocks are still read (with a named mapping warning)
  // instead of collapsing the whole file into "no decision entries". Fenced
  // examples are not declarations.
  const mappingDeclared = mappingSectionDeclared(markdown);
  let fence = null;
  let current = null;
  let headingLevel = 0;
  for (const [index, line] of lines.entries()) {
    const nextFence = fenceStep(line, fence);
    if (nextFence !== fence) { fence = nextFence; continue; }
    if (fence) continue;
    const heading = /^(#{1,6})\s+(.+?)(?:\s+#+)?\s*$/.exec(line);
    if (heading) {
      headingLevel = heading[1].length;
      headings.add(heading[2]);
      const h2Decision = headingLevel === 2 ? CURRENT_DECISION_HEADING.exec(heading[2]) : null;
      if (h2Decision) nonCanonical.push({ label: `决定 ${h2Decision[1]}`, line: index + 1, level: headingLevel });
      const match = /^((?:N\d+|(?:ADR|D)-\d+))(?=\s|[—–-]|$)/.exec(heading[2]);
      const currentShape = !match && CURRENT_DECISION_HEADING.exec(heading[2]);
      const decision = (match || currentShape) && (heading[1].length === 3 || heading[1].length === 4);
      if (current && (decision || heading[1].length <= current.level)) current = null;
      if (decision) {
        if (match) {
          current = { decision_id: match[1], level: heading[1].length, lines: [] };
          sections.push(current);
        } else {
          const label = `决定 ${currentShape[1]}`;
          const mapped = mappings.get(label);
          if (mapped) {
            current = { decision_id: mapped, level: heading[1].length, lines: [] };
            sections.push(current);
          } else if (mappingDeclared) {
            current = { decision_id: label, level: heading[1].length, lines: [], unmapped_label: true };
            sections.push(current);
            unmapped.push({ label, line: index + 1 });
          } else {
            unmapped.push({ label, line: index + 1 });
          }
        }
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
  return { sections, unmapped, nonCanonical, headings, sourceIds };
}

// Only explicitly headed unit tables contribute unit warnings; they never
// contribute decision parent-field statistics. Headings mirror the real sources.
function unitWarnings(markdown) {
  const warnings = [];
  let columns = null;
  let fence = null;
  for (const line of markdown.split("\n")) {
    const nextFence = fenceStep(line, fence);
    if (nextFence !== fence) { fence = nextFence; columns = null; continue; }
    if (fence) continue;
    if (!/^\s*\|/.test(line)) { columns = null; continue; }
    const cells = tableCells(line);
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

// The requirement index is the only current place a reply's source class and
// tone are declared. Unknown tables stay out; a missing named table must not be
// read as "no replies" because that would silently accept every decision.
function parseRequirementIndex(markdown) {
  const rows = new Map();
  let columns = null;
  let fence = null;
  let newShape = false;
  let legacyShape = false;
  for (const line of markdown.split("\n")) {
    const nextFence = fenceStep(line, fence);
    if (nextFence !== fence) { fence = nextFence; columns = null; continue; }
    if (fence) continue;
    if (!/^\s*\|/.test(line)) { columns = null; continue; }
    const cells = tableCells(line).map((value) => value.replace(/\*\*|`/g, ""));
    if (!columns) {
      if (INDEX_COLUMNS.every((name) => cells.includes(name))) { columns = cells; newShape = true; }
      else if (cells.includes("编号") && cells.some((name) => ["类型", "逐字原话", "来源", "工作包落点"].includes(name))) legacyShape = true;
      continue;
    }
    if (cells.every((value) => /^:?-+:?$/.test(value))) continue;
    const field = (name) => cells[columns.indexOf(name)] ?? "";
    const id = field("编号");
    if (!id) continue;
    rows.set(id, {
      grade: field("来源分级"),
      quote: field("答复原文"),
      tone: field("语气"),
      ref: field("原件ref与行位"),
      time: field("时点"),
      package: field("所属包"),
    });
  }
  if (newShape) return { rows, legacyShape: false };
  if (legacyShape) return { rows: null, legacyShape: true };
  return null;
}

export function normalizeQuote(value) {
  // Keep literal *, backticks and command syntax; only normalize whitespace.
  return String(value).replace(/\s+/g, " ").trim();
}

export function stripLeadingMarker(value) {
  // Only one leading list number/bullet is removed: 3. / 3、 / 3) / 3） /
  // （3） / (3) / - / * / +. Parenthesized numbers inside the reply stay.
  return value.replace(/^\s*(?:[-*+]\s+|\d+\s*[.、)）](?!\d)\s*|[（(]\d+[）)]\s*)/, "");
}

// 答复原文 must be the reply payload of the cited line, not a fragment of it.
// Accepted payloads: the whole line (a leading list number/bullet is allowed),
// or one backticked span on that line. A comma-truncated sentence is neither,
// so "允许X，后续…" cannot be cited as just "允许X".
function quoteMatches(observed, quote) {
  const normalized = normalizeQuote(quote);
  if (!normalized) return false;
  if (normalizeQuote(observed) === normalized) return true;
  if (normalizeQuote(stripLeadingMarker(observed)) === normalized) return true;
  for (const match of observed.matchAll(/`([^`]+)`/g)) {
    if (normalizeQuote(match[1]) === normalized) return true;
  }
  return false;
}

// Only declarations made by a decision and a matching index row participate.
// A log or index without the new fields keeps its old shape (shape note only).
function answerSourceWarnings(sections, requirement_index_markdown, read_source) {
  const warnings = [];
  if (requirement_index_markdown === undefined) return warnings;
  if (typeof requirement_index_markdown !== "string") {
    warnings.push(warning("invalid_input", "unknown", "requirement_index_markdown", "requirement index content is not text"));
    return warnings;
  }
  const index = parseRequirementIndex(requirement_index_markdown);
  if (!index) {
    warnings.push(warning("ANSWER_SOURCE_UNVERIFIABLE", "unknown", "requirement_index_markdown",
      `requirement index must declare the ${INDEX_COLUMNS.join("/")} table; source and tone cannot be checked`));
    return warnings;
  }
  if (index.legacyShape) {
    warnings.push(warning("legacy_requirement_index_shape", "unknown", "requirement_index_markdown",
      "requirement index uses the old columns; new source/tone columns are absent, so only a shape difference is reported"));
    return warnings;
  }
  const rows = index.rows;
  for (const { decision_id, sources, counts } of sections) {
    const duplicated = SOURCE_FIELDS.filter((field) => (counts?.[field] ?? 0) > 1);
    if (duplicated.length) {
      warnings.push(warning("ANSWER_SOURCE_UNVERIFIABLE", decision_id, duplicated[0], `${decision_id} declares ${duplicated.join("/")} more than once; one decision must cite one reply group (split the extra replies into their own decisions)`));
      continue;
    }
    const missing = SOURCE_FIELDS.filter((field) => !sources[field]);
    if (missing.length) {
      warnings.push(warning("ANSWER_SOURCE_UNVERIFIABLE", decision_id, missing[0], `${decision_id} declares ${SOURCE_FIELDS.filter((field) => sources[field]).join("/")} but is missing ${missing.join("/")}; a partial source contract cannot be verified`));
      continue;
    }
    const sourceId = sources.source_id;
    const row = rows.get(sourceId);
    if (!row) {
      warnings.push(warning("ANSWER_SOURCE_UNVERIFIABLE", decision_id, "source_id", `${decision_id} cites ${sourceId}, which the requirement index does not declare`));
      continue;
    }
    const missingIndexFields = ["来源分级", "答复原文", "语气", "原件ref与行位", "时点", "所属包"].filter((field) => !String(row[field === "来源分级" ? "grade" : field === "答复原文" ? "quote" : field === "语气" ? "tone" : field === "原件ref与行位" ? "ref" : field === "时点" ? "time" : "package"] ?? "").trim());
    if (missingIndexFields.length) {
      warnings.push(warning("ANSWER_SOURCE_UNVERIFIABLE", decision_id, missingIndexFields[0], `${decision_id} reply ${sourceId} is missing ${missingIndexFields.join("/")} in the requirement index`));
      continue;
    }
    if (!SOURCE_GRADES.includes(row.grade)) {
      warnings.push(warning("ANSWER_SOURCE_UNVERIFIABLE", decision_id, "来源分级", `${decision_id} reply ${sourceId} has undeclared source class ${row.grade || "(empty)"}`));
      continue;
    }
    if (!SOURCE_IDENTITIES.includes(sources["来源身份"])) {
      warnings.push(warning("ANSWER_SOURCE_UNVERIFIABLE", decision_id, "来源身份", `${decision_id} 来源身份 ${sources["来源身份"]} is not one of ${SOURCE_IDENTITIES.join("/")}`));
      continue;
    }
    if (row.grade === "作者推断" && sources["来源身份"] !== "作者推断") {
      warnings.push(warning("ANSWER_INFERENCE_AS_USER", decision_id, "来源身份", `${decision_id} presents ${sourceId} author inference as ${sources["来源身份"]}`));
    } else if (row.grade !== "作者推断" && sources["来源身份"] !== "用户答复") {
      warnings.push(warning("ANSWER_SOURCE_UNVERIFIABLE", decision_id, "来源身份", `${decision_id} reply ${sourceId} is ${row.grade}, but 来源身份 is ${sources["来源身份"]}`));
    }
    if (!TONE_GRADES.includes(row.tone)) {
      warnings.push(warning("ANSWER_MODALITY_MISMATCH", decision_id, "语气", `${decision_id} reply ${sourceId} has undeclared tone ${row.tone || "(empty)"}; expected one of ${TONE_GRADES.join("/")}`));
    } else if (!TONE_GRADES.includes(sources.modality)) {
      warnings.push(warning("ANSWER_MODALITY_MISMATCH", decision_id, "modality", `${decision_id} modality ${sources.modality || "(empty)"} is not one of ${TONE_GRADES.join("/")}`));
    } else if (sources.modality !== row.tone) {
      warnings.push(warning("ANSWER_MODALITY_MISMATCH", decision_id, "modality", `${decision_id} cites ${sourceId} as ${sources.modality}, but the original reply is ${row.tone}`));
    }
    const ref = SOURCE_REF.exec(row.ref);
    if (!ref || !row.ref.trim()) {
      warnings.push(warning("ANSWER_SOURCE_UNVERIFIABLE", decision_id, "原件ref与行位", `${decision_id} reply ${sourceId} has no readable original line reference`));
      continue;
    }
    const start = Number(ref[2]);
    const end = ref[3] === undefined ? start : Number(ref[3]);
    if (!Number.isInteger(start) || start < 1 || !Number.isInteger(end) || end < start) {
      warnings.push(warning("ANSWER_SOURCE_UNVERIFIABLE", decision_id, "原件ref与行位", `${decision_id} reply ${sourceId} has an invalid line range ${row.ref}`));
      continue;
    }
    if (!normalizeQuote(row.quote)) {
      warnings.push(warning("ANSWER_SOURCE_UNVERIFIABLE", decision_id, "答复原文", `${decision_id} reply ${sourceId} has an empty quote`));
      continue;
    }
    if (typeof read_source !== "function") {
      warnings.push(warning("ANSWER_SOURCE_UNVERIFIABLE", decision_id, "read_source", `${decision_id} reply ${sourceId} has no reader to verify the original line`));
      continue;
    }
    let text;
    try {
      text = read_source(ref[1]);
      if (text && typeof text.then === "function") {
        warnings.push(warning("ANSWER_SOURCE_UNVERIFIABLE", decision_id, "read_source", `${decision_id} reply ${sourceId} needs a synchronous original read`));
        continue;
      }
    } catch (error) {
      warnings.push(warning("ANSWER_SOURCE_UNVERIFIABLE", decision_id, "原件ref与行位", `${decision_id} reply ${sourceId} cannot be read: ${error.code ?? "READ_FAILED"}: ${error.message}`));
      continue;
    }
    if (typeof text !== "string") {
      warnings.push(warning("ANSWER_SOURCE_UNVERIFIABLE", decision_id, "原件ref与行位", `${decision_id} reply ${sourceId} reader returned no text`));
      continue;
    }
    const observed = text.split("\n").slice(start - 1, end).join("\n");
    if (!quoteMatches(observed, row.quote)) {
      warnings.push(warning("ANSWER_SOURCE_UNVERIFIABLE", decision_id, "答复原文", `${decision_id} reply ${sourceId} is not the complete original sentence on ${row.ref}; cite the full reply with its line position`));
    }
  }
  return warnings;
}

export function checkDecisionLogChain({ markdown, source_ref = "decision-log.md", requirement_index_markdown, read_source } = {}) {
  if (typeof markdown !== "string") {
    return {
      schema_version: "decision-log-chain-warning.v1",
      source_ref,
      warnings: [warning("invalid_input", "unknown", "markdown", "decision log content is not text")],
      failures: [],
      exit_code: 0,
    };
  }

  const mappings = decisionIdMappings(markdown);
  const { sections, unmapped, nonCanonical, headings, sourceIds } = decisionSections(markdown, mappings);
  const knownDecisions = new Set(sections.map(({ decision_id }) => decision_id));
  const warnings = unitWarnings(markdown);
  let recognizedFields = 0;

  for (const { label, line } of unmapped) {
    warnings.push(warning(
      "missing_decision_id_mapping",
      label,
      "旧编号对照",
      `${label} at line ${line} has no ADR-/D- mapping in 旧编号对照; chain coverage for this block is unavailable`,
    ));
  }
  for (const { label, line, level } of nonCanonical) {
    warnings.push(warning(
      "non_canonical_decision_heading",
      label,
      "heading_level",
      `${label} at line ${line} uses ${"#".repeat(level)}; decisions are read at ### or ####, so this heading is reported instead of silently skipped`,
    ));
  }
  if (sections.length === 0) {
    warnings.push(warning(
      "no_decision_entries",
      "unknown",
      "decision_entries",
      "no decision entries were recognized; chain coverage is unavailable",
    ));
  }

  const answerSections = [];
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
    const sources = Object.fromEntries(SOURCE_FIELDS.map((field) => [
      field,
      parents.find((parent) => parent.field === field && parent.value.trim())?.value.trim() ?? null,
    ]));
    const counts = Object.fromEntries(SOURCE_FIELDS.map((field) => [field, parents.filter((parent) => parent.field === field && parent.value.trim()).length]));
    if (SOURCE_FIELDS.some((field) => sources[field] !== null)) answerSections.push({ decision_id, sources, counts });
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
        if (![...CURRENT_FIELDS, ...SOURCE_FIELDS].includes(parent.field)) {
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

  warnings.push(...answerSourceWarnings(answerSections, requirement_index_markdown, read_source));

  return {
    schema_version: "decision-log-chain-warning.v1",
    source_ref,
    recognized_blocks: sections.length,
    recognized_fields: recognizedFields,
    warnings,
    failures: [],
    // Old-shape materials keep the advisory exit. A named new-shape source
    // failure is a real incomplete result, so private callers see it too.
    exit_code: warnings.some((item) => ANSWER_FLAGS.includes(item.code)) ? 1 : 0,
  };
}

function parseArgs(args) {
  const values = { file: null, root: resolve("."), sourceRoots: [] };
  let rootGiven = false;
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    if (flag !== "--file" && flag !== "--root" && flag !== "--source-root") return { error: `unknown argument ${flag}` };
    const value = args[++index];
    if (!value || value.startsWith("--")) return { error: `${flag} requires a value` };
    if (flag === "--file") values.file = value;
    else if (flag === "--root") { values.root = resolve(value); rootGiven = true; }
    else {
      if (!isAbsolute(value)) return { error: `--source-root requires an absolute path` };
      values.sourceRoots.push(resolve(value));
    }
  }
  if (values.sourceRoots.length && rootGiven) return { error: "--root scans the repository and cannot be combined with --source-root; use --file for an authorized external original" };
  if (values.sourceRoots.length && !values.file) return { error: "--source-root requires --file <path>; it authorizes originals cited by one decision log" };
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

function declaredTaskBase(markdown) {
  for (const line of markdown.split("\n")) {
    if (!/基准目录/.test(line)) continue;
    const token = /`([^`]+)`/.exec(line)?.[1] ?? line.slice(line.search(/[：:]/) + 1).trim();
    if (token && isAbsolute(token)) return token;
  }
  return null;
}

// Answer source fields are parent lines. Fenced examples and prose mentions
// never declare the new contract. This mirrors the field parser: the list
// marker is optional and a bold `**source_id**：` label is the same field.
function declaresAnswerSource(markdown) {
  let fence = null;
  for (const line of markdown.split("\n")) {
    const nextFence = fenceStep(line, fence);
    if (nextFence !== fence) { fence = nextFence; continue; }
    if (fence) continue;
    if (/^(?:[-*+]\s+)?(?:\*\*)?(?:source_id|modality|来源身份)(?:\*\*)?\s*[:：]/.test(line)) return true;
  }
  return false;
}

// The log declares one external index. The template lets it be named by date
// and topic, so discovery accepts a `需求索引：<ref>` declaration or a name
// ending in requirement-index.md. Fenced examples are not declarations. Two
// distinct declarations are an input error, not a reason to pick one.
export function requirementIndexPointers(markdown) {
  const found = new Set();
  let fence = null;
  for (const line of markdown.split("\n")) {
    const nextFence = fenceStep(line, fence);
    if (nextFence !== fence) { fence = nextFence; continue; }
    if (fence) continue;
    if (!/^\s*(?:\|\s*|[-*+]\s+)需求索引/.test(line)) continue;
    for (const match of line.matchAll(/`([^`\s]+\.md)`/g)) found.add(match[1]);
    const bare = /需求索引\s*[：:]\s*([^\s|`]+\.md)/.exec(line)?.[1];
    if (bare) found.add(bare);
  }
  return [...found];
}

function resolveIndexPointer(pointer, base, read) {
  const candidates = isAbsolute(pointer)
    ? [resolve(pointer)]
    : [resolve(base, pointer), resolve(base, "quality/evidence/decision-log-refs", pointer)];
  const readable = [...new Set(candidates)].filter((candidate) => {
    try { read(candidate); return true; }
    catch { return false; }
  });
  if (readable.length === 1) return readable[0];
  if (readable.length === 0) throw Object.assign(new Error(`declared requirement index ${pointer} is not readable under the task root or decision-log-refs`), { code: "INDEX_NOT_READABLE" });
  throw Object.assign(new Error(`declared requirement index ${pointer} matches more than one readable file`), { code: "INDEX_AMBIGUOUS" });
}

function authenticatedTaskBase(value) {
  if (typeof value !== "string" || !isAbsolute(value)) throw Object.assign(new Error("declared 基准目录 must be an absolute task root"), { code: "INVALID_TASK_ROOT" });
  const root = realpathSync(value);
  const manifest = JSON.parse(readFileSync(join(root, "task.json"), "utf8"));
  if (manifest.activation_cohort !== "post" || manifest.task_id !== basename(root)) {
    throw Object.assign(new Error("declared 基准目录 is not a current post task root"), { code: "UNAUTHENTICATED_TASK_ROOT" });
  }
  return root;
}

// A log outside a Git worktree has no authenticated worktree root. Falling
// back to its own directory would authorize unrelated siblings.
function worktreeRootOf(file) {
  let cursor = realpathSync(dirname(resolve(file)));
  for (;;) {
    try { lstatSync(join(cursor, ".git")); return cursor; }
    catch (error) { if (error.code !== "ENOENT") throw error; }
    const parent = dirname(cursor);
    if (parent === cursor) return null;
    cursor = parent;
  }
}

// Named originals outside the task/worktree are readable only when the current
// input authorizes their root with --source-root. Everything is resolved to its
// real path before the containment check, so a symlink cannot escape a declared
// root and a relative `..` segment is refused before touching the filesystem.
function createSourceReader({ base, worktree, sourceRoots }) {
  const roots = [...new Set([base, worktree, ...sourceRoots].filter(Boolean).map((path) => realpathSync(path)))];
  return (ref) => {
    if (typeof ref !== "string" || !ref) throw Object.assign(new Error("source reference is not a path"), { code: "INVALID_SOURCE_REF" });
    if (ref.split(/[\\/]/).includes("..")) throw Object.assign(new Error(`source reference ${ref} uses directory traversal`), { code: "TRAVERSAL" });
    const candidates = isAbsolute(ref)
      ? [resolve(ref)]
      : [resolve(base ?? worktree, ref), resolve(base ?? worktree, "quality/evidence/decision-log-refs", ref)];
    let lastError = Object.assign(new Error(`source ${ref} is not readable`), { code: "SOURCE_NOT_READABLE" });
    for (const candidate of [...new Set(candidates)]) {
      let real;
      try { real = realpathSync(candidate); }
      catch (error) { lastError = error; continue; }
      if (!roots.some((root) => real === root || real.startsWith(`${root}${sep}`))) {
        lastError = Object.assign(new Error(`source ${real} is outside authorized roots`), { code: "OUTSIDE_AUTHORIZED_ROOT" });
        continue;
      }
      const stat = lstatSync(real);
      if (stat.isSymbolicLink() || !stat.isFile() || stat.nlink !== 1) {
        lastError = Object.assign(new Error(`source ${real} is not a regular single-link file`), { code: "INVALID_SOURCE_FILE" });
        continue;
      }
      return new TextDecoder("utf-8", { fatal: true }).decode(readFileSync(real));
    }
    throw lastError;
  };
}

export function main(args = process.argv.slice(2)) {
  const values = parseArgs(args);
  if (values.error) {
    console.error(`[check-decision-log-chain] ${values.error}; expected --file <path> or --root <directory> [--source-root <absolute directory>]`);
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
  let answerErrors = 0;
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
    let result;
    if (values.file) {
      const declared = declaresAnswerSource(markdown);
      const pointers = declared ? requirementIndexPointers(markdown) : [];
      if (!declared) {
        result = checkDecisionLogChain({ markdown, source_ref: input.source_ref });
      } else if (pointers.length > 1) {
        console.error(`[check-decision-log-chain] ${input.source_ref} declares ${pointers.length} requirement-index pointers; expected one`);
        hadReadError = true; continue;
      } else if (pointers.length === 1) {
        let base, indexText, read_source;
        try {
          base = authenticatedTaskBase(declaredTaskBase(markdown));
          read_source = createSourceReader({ base, worktree: worktreeRootOf(input.path), sourceRoots: values.sourceRoots });
          indexText = read_source(resolveIndexPointer(pointers[0], base, read_source));
        } catch (error) {
          console.error(`[check-decision-log-chain] cannot read declared requirement index in ${input.source_ref}: ${error.code ?? error.message}`);
          hadReadError = true; continue;
        }
        result = checkDecisionLogChain({ markdown, source_ref: input.source_ref, requirement_index_markdown: indexText, read_source });
      } else {
        console.error(`[check-decision-log-chain] ${input.source_ref} declares source_id but has no requirement-index pointer; source and tone cannot be checked`);
        hadReadError = true; continue;
      }
    } else {
      result = checkDecisionLogChain({ markdown, source_ref: input.source_ref });
    }
    checkedInputs += 1;
    console.log(`[check-decision-log-chain] scanned ${JSON.stringify({input_path:resolve(input.path),input_sha256:executionHash(inputBytes),checker_sha256:checkerExecutionHash})}`);
    for (const item of result.warnings) {
      warningCount += 1;
      if (ANSWER_FLAGS.includes(item.code)) answerErrors += 1;
      console.log(`[check-decision-log-chain] WARNING ${input.source_ref} ${item.decision_id}.${item.field} [${item.code}]: ${item.message}`);
    }
  }
  if (hadReadError) {
    console.error(`[check-decision-log-chain] input read failed; check incomplete, exit 1`);
    return 1;
  }
  if (answerErrors > 0) {
    console.error(`[check-decision-log-chain] ${answerErrors} named answer-source error(s); new-shape source/tone evidence is not usable, exit 1`);
    return 1;
  }
  if (checkedInputs > 0) console.log(`[check-decision-log-chain] advisory complete: ${warningCount} warning(s), non-blocking, exit 0`);
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  process.exitCode = main();
}
