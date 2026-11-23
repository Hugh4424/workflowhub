#!/usr/bin/env node

/**
 * Text-only decision-log chain hygiene warnings.
 *
 * Old-shape materials stay advisory: malformed or stale chain fields are
 * printed as facts and the process exits 0. A new-shape material that declares
 * answer source_id/modality/来源身份 is checked against the requirement index;
 * its four named answer-source codes (unverifiable, modality mismatch,
 * inference-as-user, self-reference) make the process exit 1, because a
 * citation that cannot be verified must not look like a pass. A log that writes
 * 承诺 lines is read the same way even without the three source fields: each
 * line carries one state, the whole original reply and one index pointer (or
 * the three 待定 parts), and its seven named commitment codes exit 1 too.
 * The function's result.exit_code carries the same distinction for private
 * callers.
 * Only local text structure, the declared index and explicitly authorized
 * original files are inspected. New-shape 决定 N headings map through the
 * material's 旧编号对照; an unmapped block is reported as a warning, never
 * silently treated as zero entries. A v2 package's numbered 「最终决定」 item
 * (`### 包 N` + `#### 5. 最终决定`) is the other recognized commitment block.
 */

import { lstatSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
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
const INDEX_COLUMNS = ["编号", "来源分级", "答复原文", "语气", "原件ref与行位", "时点", "所属包"];
// P2 commitment contract: a 承诺 line inside a mapped 决定 N block states how
// strongly the user bound the delivery (必须/允许/本次不做) and cites exactly one
// index row whose 答复原文 is the whole original line; 待定 has no reply yet, so
// the unanswered question, its owner and the recovery condition replace the
// pointer. 派生建议 and 被否方案 stay on their own lines and never back a
// commitment. The seven named failures exit non-zero like the P1 answer codes.
// Flat `- 承诺：` lines are the declared shape. Numbered (`1. 承诺：`) and quoted
// (`> 承诺：`) markers are still detected, so neither can pass unread: a numbered
// line at the block's parent level is read like a bullet, a quoted one is named
// as unread (quoted evidence is not a declaration).
const COMMITMENT_LINE = /^([\t ]*)(>([\t ]*))*([-*+][\t ]+|\d+[.)、][\t ]+)?(?:\*\*)?承诺(?:\*\*)?[\t ]*[:：][\t ]*(.*?)[\t ]*$/;
const COMMITMENT_STATES = new Map([["必须", "require"], ["允许", "permit"], ["本次不做", "reject"]]);
const COMMITMENT_STATE_NAMES = [...COMMITMENT_STATES.keys()];
const COMMITMENT_PENDING = "待定";
const COMMITMENT_PENDING_PARTS = ["未答", "负责人", "恢复条件"];
// A commitment sits beside the decision's own parent fields; these labels are
// legitimate siblings, not unexpected parents.
const COMMITMENT_LINE_FIELDS = ["承诺", "派生建议", "被否方案"];
// Exactly one index pointer, nothing else, after the full quote.
const COMMITMENT_POINTER = /^[A-Z][A-Z0-9]*-\d+$/;
const COMMITMENT_FLAGS = [
  "ANSWER_COMMITMENT_STATE_UNDECLARED",
  "ANSWER_COMMITMENT_UNSOURCED",
  "ANSWER_COMMITMENT_PENDING_INCOMPLETE",
  "ANSWER_COMMITMENT_ANCHOR_MISMATCH",
  "ANSWER_COMMITMENT_PARTIAL_QUOTE",
  "ANSWER_COMMITMENT_INFERENCE_AS_USER",
  "ANSWER_COMMITMENT_TONE_RAISED",
];
const ANSWER_FLAGS = [
  "ANSWER_SOURCE_UNVERIFIABLE",
  "ANSWER_MODALITY_MISMATCH",
  "ANSWER_INFERENCE_AS_USER",
  "ANSWER_SOURCE_SELF_REFERENCE",
  ...COMMITMENT_FLAGS,
];
// The requirement index of this repository spells its 语气 column in Chinese.
// Those four words name the same grades as the English ids, so the commitment
// branch compares grades, not glyphs; it never widens what a grade means.
const TONE_SPELLINGS = new Map([["要求", "require"], ["允许", "permit"], ["建议", "recommend"], ["拒绝", "reject"]]);
// Accepted original-position spellings: path#L7-L7, path#L7, path:7, path:7-9.
const SOURCE_REF = /^(.*?)(?:#L|:)(\d+)(?:-(?:L)?(\d+))?$/;
// A confirmation may bind its original to a frozen Git object:
// `commit:path#blob` (optionally `#L7-L7`). The blob is authoritative; the
// working tree can move after the commit, so it is never the fact cited here.
const BLOB_SOURCE_REF = /^([0-9a-f]{7,64}):([^#\s]+)#([0-9a-f]{40,64})(?:#L(\d+)(?:-(?:L)?(\d+))?)?$/;

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
  const commitmentSections = [];
  const unmapped = [];
  const nonCanonical = [];
  const looseCommitments = [];
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
  // The v2 design record keeps each package's decision in its own numbered
  // 「最终决定」 item (`### 包 N：…` then `#### 5. 最终决定`). That section is read
  // as a commitment block; a stray 最终决定 heading outside a package stays
  // unread, so the strict "commitments live in a recognized block" rule holds.
  let packageHeading = null;
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
      if (packageHeading && heading[1].length <= packageHeading.level) packageHeading = null;
      const pkgHeading = /^包\s*(\d+)\s*[：:]/.exec(heading[2]);
      if (pkgHeading) packageHeading = { level: heading[1].length, label: `包 ${pkgHeading[1]}` };
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
      } else if (packageHeading && packageHeading.level < heading[1].length
        && heading[1].length >= 3 && heading[1].length <= 4
        && /^(?:\d+\.\s*)?最终决定$/.test(heading[2].trim())) {
        current = { decision_id: `${packageHeading.label} 最终决定`, level: heading[1].length, lines: [], commitment_only: true };
        commitmentSections.push(current);
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
    // A commitment is read only as a parent line of a recognized decision
    // block. Any other 承诺 line stays visible as unread instead of passing as
    // if the checker had compared it with the index.
    const commitment = heading ? null : COMMITMENT_LINE.exec(line);
    if (!commitment) continue;
    const [, indent = "", , , , pledge = ""] = commitment;
    const quoted = /^[\t ]*>/.test(line);
    if (current && headingLevel === current.level && !indent && !quoted) {
      (current.commitments ??= []).push({ text: pledge, line: index + 1 });
    } else {
      looseCommitments.push({ text: pledge, line: index + 1, quoted });
    }
  }
  return { sections, commitmentSections, unmapped, nonCanonical, headings, sourceIds, looseCommitments };
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
function answerSourceWarnings(sections, requirement_index_markdown, read_source, identity = {}) {
  const warnings = [];
  // A confirmed original may be declared as `commit:path#blob`: the quote is
  // then read from the frozen Git object, not from whatever the working tree
  // holds now. Successful bindings are reported as facts.
  const bindings = [];
  if (requirement_index_markdown === undefined) return { warnings, bindings };
  if (typeof requirement_index_markdown !== "string") {
    warnings.push(warning("invalid_input", "unknown", "requirement_index_markdown", "requirement index content is not text"));
    return { warnings, bindings };
  }
  const index = parseRequirementIndex(requirement_index_markdown);
  if (!index) {
    warnings.push(warning("ANSWER_SOURCE_UNVERIFIABLE", "unknown", "requirement_index_markdown",
      `requirement index must declare the ${INDEX_COLUMNS.join("/")} table; source and tone cannot be checked`));
    return { warnings, bindings };
  }
  if (index.legacyShape) {
    warnings.push(warning("legacy_requirement_index_shape", "unknown", "requirement_index_markdown",
      "requirement index uses the old columns; new source/tone columns are absent, so only a shape difference is reported"));
    return { warnings, bindings };
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
    const blobRef = BLOB_SOURCE_REF.exec(String(row.ref ?? "").trim());
    if (blobRef) {
      const [, commit, path, blob, startRaw, endRaw] = blobRef;
      if (!normalizeQuote(row.quote)) {
        warnings.push(warning("ANSWER_SOURCE_UNVERIFIABLE", decision_id, "答复原文", `${decision_id} reply ${sourceId} has an empty quote`));
        continue;
      }
      const boundStart = Number(startRaw);
      const boundEnd = endRaw === undefined ? boundStart : Number(endRaw);
      if (startRaw === undefined || !Number.isInteger(boundStart) || boundStart < 1 || !Number.isInteger(boundEnd) || boundEnd < boundStart) {
        warnings.push(warning("ANSWER_SOURCE_UNVERIFIABLE", decision_id, "原件ref与行位", `${decision_id} reply ${sourceId} declares a blob but no readable line range ${row.ref}`));
        continue;
      }
      if (typeof identity.read_blob !== "function") {
        warnings.push(warning("ANSWER_SOURCE_UNVERIFIABLE", decision_id, "原件ref与行位",
          `${decision_id} reply ${sourceId} declares ${commit}:${path}#${blob}; the current reader cannot verify a frozen Git object`));
        continue;
      }
      let bound;
      try { bound = identity.read_blob({ commit, path, blob }); }
      catch (error) { bound = { ok: false, code: error.code ?? "BLOB_READ_FAILED", message: error.message }; }
      if (!bound || bound.ok !== true || typeof bound.text !== "string") {
        warnings.push(warning("ANSWER_SOURCE_UNVERIFIABLE", decision_id, "原件ref与行位",
          `${decision_id} reply ${sourceId} blob binding ${commit}:${path}#${blob} is not verifiable: ${bound?.code ?? "NO_RESULT"}: ${bound?.message ?? "no text"}`));
        continue;
      }
      // A frozen object that is the decision log or the derived index is still a
      // self-reference: the bytes match while nothing independent was read.
      const self = bound.real_path && identity.log_path && bound.real_path === identity.log_path;
      const derived = bound.real_path && identity.index_path && bound.real_path === identity.index_path;
      if (self || derived) {
        warnings.push(warning("ANSWER_SOURCE_SELF_REFERENCE", decision_id, "原件ref与行位",
          `${decision_id} reply ${sourceId} cites the frozen blob ${blob} of ${row.ref}, which is ${self ? "the decision log itself" : "the requirement index"}; ${self ? "a log cannot be its own original" : "the index is derived from the original, not the original"}`));
        continue;
      }
      const frozenLine = bound.text.split("\n").slice(boundStart - 1, boundEnd).join("\n");
      if (!quoteMatches(frozenLine, row.quote)) {
        warnings.push(warning("ANSWER_SOURCE_UNVERIFIABLE", decision_id, "答复原文",
          `${decision_id} reply ${sourceId} is not the complete original sentence on the frozen blob ${blob} at ${row.ref}`));
        continue;
      }
      bindings.push({ source_id: sourceId, commit, path, blob, line_start: boundStart, line_end: boundEnd });
      continue;
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
    // A pointer has to name an original. When the reader can also report the
    // real path it resolved, a pointer back into the decision log or into the
    // derived requirement index is a self-reference, not a citation: the bytes
    // would match while nothing independent was ever read.
    if (read_source && typeof read_source.resolve === "function" && (identity.log_path || identity.index_path)) {
      let real = null;
      try { real = read_source.resolve(ref[1]); } catch { real = null; }
      const self = real && identity.log_path && real === identity.log_path;
      const derived = real && identity.index_path && real === identity.index_path;
      if (self || derived) {
        warnings.push(warning("ANSWER_SOURCE_SELF_REFERENCE", decision_id, "原件ref与行位",
          `${decision_id} reply ${sourceId} cites ${row.ref}, which resolves to ${self ? "the decision log itself" : "the requirement index"}; ${self ? "a log cannot be its own original" : "the index is derived from the original, not the original"}`));
        continue;
      }
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
  return { warnings, bindings };
}

// The commitment branch reads one 承诺 line at a time, in the order the frozen
// contract names: state word, pointer or the three 待定 parts, pointer
// resolution and quote comparison, source class, then tone. The cited row's
// 原件ref与行位 is read as bytes too, so an index paraphrase cannot stand in for
// the complete original line.
function commitmentWarnings({ sections = [], commitmentSections = [], looseCommitments = [], requirement_index_markdown, read_source, identity = {} } = {}) {
  const warnings = [];
  const fail = (code, decision_id, field, message) => warnings.push(warning(code, decision_id, field, message));
  const index = typeof requirement_index_markdown === "string" ? parseRequirementIndex(requirement_index_markdown) : null;
  const rows = index && !index.legacyShape ? index.rows : null;
  for (const item of looseCommitments) {
    fail("ANSWER_COMMITMENT_UNSOURCED", "unknown", "承诺",
      `承诺 at line ${item.line} ${item.quoted ? "is inside a quote block" : "is not a parent line of a recognized 决定 N block"}; a commitment is only read as a declaration in a decision block`);
  }
  for (const { decision_id, commitments } of [...sections, ...commitmentSections]) {
    for (const item of commitments ?? []) {
      const segments = item.text.split("｜").map((part) => part.trim());
      const [state = "", quote = "", pointer = "", ...rest] = segments;
      const where = `${decision_id} line ${item.line}`;
      if (state === COMMITMENT_PENDING) {
        const parts = segments.slice(2).join("｜");
        const missing = COMMITMENT_PENDING_PARTS.filter((label) => !new RegExp(`${label}[\\t ]*[:：]`).test(parts));
        const problems = [];
        // 待定 names the question still open; an empty slot is not a question.
        if (!segments[1]) problems.push("names no unanswered question");
        if (segments.length < 3) problems.push("has no 未答/负责人/恢复条件 part");
        else if (missing.length) problems.push(`is missing ${missing.join("、")}`);
        if (problems.length) {
          fail("ANSWER_COMMITMENT_PENDING_INCOMPLETE", decision_id, "承诺",
            `${where}: 待定 ${problems.join("; ")}; 待定 needs the unanswered question plus 未答、负责人 and 恢复条件`);
        }
        continue;
      }
      if (!COMMITMENT_STATES.has(state)) {
        fail("ANSWER_COMMITMENT_STATE_UNDECLARED", decision_id, "承诺",
          `${where}: state ${state || "(empty)"} is not one of ${[...COMMITMENT_STATE_NAMES, COMMITMENT_PENDING].join("/")}`);
        continue;
      }
      if (!COMMITMENT_POINTER.test(pointer) || rest.length) {
        fail("ANSWER_COMMITMENT_UNSOURCED", decision_id, "承诺",
          `${where}: ${state} needs the full quote and exactly one index pointer (承诺：${state}｜<原话>｜<索引编号>)`);
        continue;
      }
      if (!rows) {
        fail("ANSWER_COMMITMENT_ANCHOR_MISMATCH", decision_id, "source_id",
          `${where}: ${pointer} cannot be resolved; no readable requirement index with the ${INDEX_COLUMNS.join("/")} columns was supplied`);
        continue;
      }
      const row = rows.get(pointer);
      if (!row) {
        fail("ANSWER_COMMITMENT_ANCHOR_MISMATCH", decision_id, "source_id", `${where}: ${pointer} is not a row of the requirement index`);
        continue;
      }
      const rowQuote = normalizeQuote(row.quote);
      const lineQuote = normalizeQuote(quote);
      if (!rowQuote) {
        fail("ANSWER_COMMITMENT_ANCHOR_MISMATCH", decision_id, "答复原文", `${where}: reply ${pointer} has no 答复原文 in the index`);
        continue;
      }
      if (!lineQuote) {
        fail("ANSWER_COMMITMENT_ANCHOR_MISMATCH", decision_id, "答复原文", `${where}: the ${state} line quotes nothing, but ${pointer} is ${JSON.stringify(row.quote)}`);
        continue;
      }
      if (lineQuote !== rowQuote) {
        if (rowQuote.includes(lineQuote)) {
          fail("ANSWER_COMMITMENT_PARTIAL_QUOTE", decision_id, "答复原文",
            `${where}: ${JSON.stringify(quote)} is only part of ${pointer}'s reply ${JSON.stringify(row.quote)}; a commitment quotes the whole original line`);
        } else {
          fail("ANSWER_COMMITMENT_ANCHOR_MISMATCH", decision_id, "答复原文",
            `${where}: cites ${pointer}, whose reply is ${JSON.stringify(row.quote)}, not ${JSON.stringify(quote)}`);
        }
        continue;
      }
      if (!SOURCE_GRADES.includes(row.grade)) {
        fail("ANSWER_COMMITMENT_ANCHOR_MISMATCH", decision_id, "来源分级",
          `${where}: reply ${pointer} has unverifiable source class ${row.grade || "(empty)"}, so it cannot back a commitment`);
        continue;
      }
      if (row.grade === "作者推断") {
        fail("ANSWER_COMMITMENT_INFERENCE_AS_USER", decision_id, "来源分级",
          `${where}: ${pointer} is 作者推断, so ${JSON.stringify(quote)} is a derived suggestion, not a user commitment`);
        continue;
      }
      const rowTone = TONE_GRADES.includes(row.tone) ? row.tone : (TONE_SPELLINGS.get(row.tone) ?? null);
      if (rowTone === null) {
        fail("ANSWER_COMMITMENT_TONE_RAISED", decision_id, "语气",
          `${where}: reply ${pointer} has undeclared tone ${row.tone || "(empty)"}, so ${state} cannot be compared`);
        continue;
      }
      if (rowTone !== COMMITMENT_STATES.get(state)) {
        // The code name is kept for existing callers; the message says what is
        // actually wrong, because a weakened commitment is as wrong as a raised
        // one. Both directions exit non-zero.
        fail("ANSWER_COMMITMENT_TONE_RAISED", decision_id, "语气",
          `${where}: the ${state} commitment does not match the original reply's strength (${COMMITMENT_STATES.get(state)} vs ${rowTone}); a commitment may neither raise nor weaken ${pointer}`);
        continue;
      }
      const ref = SOURCE_REF.exec(String(row.ref ?? "").trim());
      if (!ref) {
        fail("ANSWER_COMMITMENT_ANCHOR_MISMATCH", decision_id, "原件ref与行位",
          `${where}: reply ${pointer} has no readable original line reference ${row.ref || "(empty)"}`);
        continue;
      }
      const start = Number(ref[2]);
      const end = ref[3] === undefined ? start : Number(ref[3]);
      if (!Number.isInteger(start) || start < 1 || !Number.isInteger(end) || end < start) {
        fail("ANSWER_COMMITMENT_ANCHOR_MISMATCH", decision_id, "原件ref与行位", `${where}: reply ${pointer} has an invalid line range ${row.ref}`);
        continue;
      }
      if (typeof read_source === "function" && typeof read_source.resolve === "function" && (identity.log_path || identity.index_path)) {
        let real = null;
        try { real = read_source.resolve(ref[1]); } catch { real = null; }
        const self = real && identity.log_path && real === identity.log_path;
        const derived = real && identity.index_path && real === identity.index_path;
        if (self || derived) {
          fail("ANSWER_SOURCE_SELF_REFERENCE", decision_id, "原件ref与行位",
            `${where}: reply ${pointer} cites ${row.ref}, which resolves to ${self ? "the decision log itself" : "the requirement index"}; ${self ? "a log cannot be its own original" : "the index is derived from the original, not the original"}`);
          continue;
        }
      }
      if (typeof read_source !== "function") {
        fail("ANSWER_COMMITMENT_ANCHOR_MISMATCH", decision_id, "read_source", `${where}: reply ${pointer} has no reader to verify the original line`);
        continue;
      }
      let text;
      try {
        text = read_source(ref[1]);
        if (text && typeof text.then === "function") {
          fail("ANSWER_COMMITMENT_ANCHOR_MISMATCH", decision_id, "read_source", `${where}: reply ${pointer} needs a synchronous original read`);
          continue;
        }
      } catch (error) {
        fail("ANSWER_COMMITMENT_ANCHOR_MISMATCH", decision_id, "原件ref与行位", `${where}: reply ${pointer} cannot be read: ${error.code ?? "READ_FAILED"}: ${error.message}`);
        continue;
      }
      if (typeof text !== "string") {
        fail("ANSWER_COMMITMENT_ANCHOR_MISMATCH", decision_id, "原件ref与行位", `${where}: reply ${pointer} reader returned no text`);
        continue;
      }
      const observed = text.split("\n").slice(start - 1, end).join("\n");
      if (!quoteMatches(observed, row.quote)) {
        fail("ANSWER_COMMITMENT_ANCHOR_MISMATCH", decision_id, "答复原文",
          `${where}: reply ${pointer}'s 答复原文 is not the complete original sentence on ${row.ref}`);
      }
    }
  }
  return { warnings };
}

/**
 * Text-only chain warnings for one decision log.
 *
 * `log_path` / `index_path` are the real absolute paths of the decision log and
 * the requirement index being checked. They are optional: a private caller that
 * omits them still gets every other warning, but the self-reference check cannot
 * run, because a pointer can only be compared to an identity the caller supplies.
 * The CLI always passes both (see main), so the unknown-original check is real on
 * the public entry; a direct in-process call without them is not equivalent.
 */

// The v2 design record keeps one block per work package and the ten template
// items as bold labels or numbered headings. This CLI stays self-contained:
// it reports the current bytes, it does not load the portable plan script.
const DESIGN_ITEMS = ['原始需求', '最初方案', '发散与被否', '调研', '最终决定', '完整方案', '验收', '风险/回退', '未决/消费者/证据', '配套与影响'];
function designItemName(value) {
  return String(value ?? '').trim().replace(/[（(][^）)]*[）)]\s*$/, '').trim();
}
// One AC identity has several legal spellings in the materials: the current
// three-digit form (AC-P3-001) and the older unpadded one (AC-P3-1). Reporting
// them side by side invents extra ACs, so the reader normalizes to the padded
// form and de-duplicates before it prints or reconciles anything.
function normalizeAcId(value) {
  const match = /^AC-P(\d+)-(\d+)$/.exec(String(value ?? "").trim());
  return match ? `AC-P${Number(match[1])}-${String(Number(match[2])).padStart(3, "0")}` : null;
}
function designAcs(line) {
  return [...String(line).matchAll(/AC-P\d+-\d+/g)].map((match) => normalizeAcId(match[0])).filter(Boolean);
}
function addAcs(target, acs) {
  for (const ac of acs) if (!target.includes(ac)) target.push(ac);
}
function readDesignBlocks(markdown) {
  const visible = [];
  let fence = null;
  const all = String(markdown).split(/\r?\n/);
  for (let index = 0; index < all.length; index++) {
    const line = all[index];
    const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    if (fence) { if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = null; continue; }
    if (marker) { fence = marker[1]; continue; }
    visible.push({ text: line, line: index + 1 });
  }
  const packages = [];
  let current = null, sectionDepth = null;
  for (const { text: line, line: lineNo } of visible) {
    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      const raw = heading[2].trim();
      const title = raw.replace(/^\d+(?:\.\d+)*[.、]?\s*/, '');
      if (title === '每包设计') { sectionDepth = heading[1].length; current = null; continue; }
      if (sectionDepth === null) continue;
      if (heading[1].length <= sectionDepth) { sectionDepth = null; current = null; continue; }
      if (heading[1].length === sectionDepth + 1) {
        // v2 template shape: `### 包 <N>：<name>` with `#### <n>. <item>` below it.
        const named = /^包\s*`?(\d+)`?\s*[：:]\s*(.+)$/.exec(title);
        // current log shape: `### 4.1 <name>`; template index shape: `### 1. <name>`.
        const numbered = /^(\d+)\.(\d+)\s+(.+)$/.exec(raw);
        const single = /^(\d+)\.\s+(.+)$/.exec(raw);
        const id = named ? Number(named[1]) : numbered ? Number(numbered[2]) : single ? Number(single[1]) : null;
        const name = named ? named[2].trim() : numbered ? numbered[3].trim() : single ? single[2].trim() : null;
        if (name && Number.isSafeInteger(id)) { current = { id, name, line: lineNo, level: heading[1].length, items: new Set(), acs: [] }; packages.push(current); continue; }
      }
      if (!current || heading[1].length <= current.level) continue;
      const itemHeading = /^(\d+)\.\s*(.+)$/.exec(raw);
      if (itemHeading && DESIGN_ITEMS.includes(designItemName(itemHeading[2]))) current.items.add(designItemName(itemHeading[2]));
      addAcs(current.acs, designAcs(line));
      continue;
    }
    if (!current) continue;
    const bold = /^\*\*([^*]+)\*\*\s*[：:]?/.exec(line.trim());
    if (bold && DESIGN_ITEMS.includes(designItemName(bold[1]))) current.items.add(designItemName(bold[1]));
    addAcs(current.acs, designAcs(line));
  }
  return packages.map(pkg => ({ ...pkg, missing: DESIGN_ITEMS.filter(item => !pkg.items.has(item)) }));
}

// The spec declares the authoritative AC list. The log cites the same ACs, and
// the materials use both the current three-digit and the older unpadded
// spelling. Report-only reconciliation of the current bytes: the spec set, the
// log set, ACs the log cites that the spec never declares, and spec ACs no log
// text names. This is a reading, not a new gate; the CLI prints it as facts.
function reconcileAcs(markdown, spec_markdown) {
  if (typeof spec_markdown !== "string" || !spec_markdown.trim()) return null;
  const specAcs = [...new Set(designAcs(spec_markdown))];
  const logAcs = [...new Set(designAcs(markdown))];
  return {
    spec_count: specAcs.length,
    spec_acs: specAcs,
    log_acs: logAcs,
    unresolved: logAcs.filter(ac => !specAcs.includes(ac)),
    uncovered: specAcs.filter(ac => !logAcs.includes(ac)),
  };
}

// P3 bidirectional coverage: one acceptance entry starts with `判据编号：AC-…`
// under a `7. 验收` heading, and the log declares the unique coverage matrix
// with `覆盖核对：<ref>` beside its requirement-index pointer. The checker reads
// three current originals: the log's acceptance entries, the requirement index
// and the coverage matrix. It reports, as facts, which index requirements have
// no coverage landing, which acceptances have no 判定来源, and which new
// acceptances lack both a 替换对象 and the four-part addition basis. The
// unanswered binding only limits the acceptance it is attached to; it does not
// make unrelated acceptances incomplete. Placeholder spellings (`无`, `未取得`,
// `N/A`, `—`, empty) mean the field is absent, never a real answer.
const COVERAGE_FIELD = {
  source: "判定来源",
  replacement: "替换对象",
  commitment: "真实新增承诺",
  approver: "批准者",
  impact: "影响",
  irreplaceable: "不可替代理由",
  unanswered: "未答绑定",
  owner: "未答负责人",
  recovery: "恢复条件",
};
const COVERAGE_ADDITION_BASIS = [
  COVERAGE_FIELD.commitment,
  COVERAGE_FIELD.approver,
  COVERAGE_FIELD.impact,
  COVERAGE_FIELD.irreplaceable,
];
const COVERAGE_ACCEPTANCE_HEADING = /^(?:\d+[.、]\s*)?7[.、]\s*验收\s*$/;

// Same convention as run-checks.mjs `none()`: a placeholder is not a value.
// A placeholder may be followed by its own explanation (`无。本槽位……`); the
// explanation does not turn it into a real answer.
function none(value) {
  const text = String(value ?? "").replace(/[*_`。；;，,\s]/g, "");
  const raw = String(value ?? "").trim();
  return text === ""
    || /^(?:无|没有|none|未取得|未知|n\/a|—|-{1,2})$/i.test(text)
    || /^(?:无|没有|未取得|未知|none|n\/a|—)(?=[。；;，,、：:]|\s|$)/i.test(raw);
}

// `未答绑定` is different: only an explicit `无`/`没有`/`none`/`n/a`/`—`/empty
// says "no unanswered binding". `未取得`/`未知` mean the binding itself is not
// yet known, so the acceptance stays limited and must keep an owner/recovery.
function noBinding(value) {
  const text = String(value ?? "").replace(/[*_`。；;，,\s]/g, "");
  const raw = String(value ?? "").trim();
  return text === ""
    || /^(?:无|没有|none|n\/a|—|-{1,2})$/i.test(text)
    || /^(?:无|没有|none|n\/a|—)(?=[。；;，,、：:]|\s|$)/i.test(raw);
}

// A `7. 验收` section is scoped by its heading depth; entries inside it start
// with 判据编号 and carry labelled lines. Fenced examples are not declarations.
function readAcceptanceEntries(markdown) {
  const entries = [];
  let fence = null;
  let sectionDepth = null;
  let current = null;
  for (const line of String(markdown).split(/\r?\n/)) {
    const nextFence = fenceStep(line, fence);
    if (nextFence !== fence) { fence = nextFence; continue; }
    if (fence) continue;
    const heading = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (heading) {
      if (COVERAGE_ACCEPTANCE_HEADING.test(heading[2].trim())) { sectionDepth = heading[1].length; current = null; continue; }
      if (sectionDepth !== null && heading[1].length <= sectionDepth) { sectionDepth = null; current = null; }
      continue;
    }
    if (sectionDepth === null) continue;
    const id = /^(?:[-*+]\s+)?(?:\*\*)?判据编号(?:\*\*)?\s*[:：]\s*(.*?)\s*$/.exec(line);
    if (id) { current = { id: id[1].trim(), fields: {} }; entries.push(current); continue; }
    if (!current) continue;
    const field = /^(?:[-*+]\s+)?(?:\*\*)?([^:*：\n]+?)(?:\*\*)?\s*[:：]\s*(.*?)\s*$/.exec(line);
    if (field) current.fields[field[1].trim()] = field[2].trim();
  }
  return entries.filter((entry) => entry.id);
}

// Markdown tables are read by header, never by column position: the current
// index and coverage matrix add and drop columns between versions. Fenced
// examples are not tables.
function readTables(markdown) {
  const visible = [];
  let fence = null;
  for (const line of String(markdown ?? "").split(/\r?\n/)) {
    const nextFence = fenceStep(line, fence);
    if (nextFence !== fence) { fence = nextFence; continue; }
    if (fence) continue;
    visible.push(line);
  }
  const tables = [];
  for (let index = 0; index < visible.length - 1; index += 1) {
    if (!/^\s*\|/.test(visible[index])) continue;
    if (!/^\s*\|?\s*:?-{3,}/.test(visible[index + 1])) continue;
    const header = tableCells(visible[index]);
    const rows = [];
    let cursor = index + 2;
    while (cursor < visible.length && /^\s*\|/.test(visible[cursor])) { rows.push(tableCells(visible[cursor])); cursor += 1; }
    tables.push({ header, rows });
    index = cursor - 1;
  }
  return tables;
}

function columnIndex(header, pattern) {
  return header.findIndex((cell) => pattern.test(cell));
}

function readRequirementIds(requirement_index_markdown) {
  const ids = [];
  if (typeof requirement_index_markdown !== "string" || !requirement_index_markdown.trim()) return { ids, readable: false };
  let readable = false;
  for (const { header, rows } of readTables(requirement_index_markdown)) {
    const idColumn = columnIndex(header, /编号/);
    if (idColumn < 0) continue;
    readable = true;
    for (const row of rows) {
      const id = (row[idColumn] ?? "").replace(/[*`]/g, "").trim();
      if (REQUIREMENT_ID.test(id) && !ids.includes(id)) ids.push(id);
    }
  }
  return { ids, readable };
}

function readCoverageLandings(coverage_markdown) {
  const landings = new Map();
  if (typeof coverage_markdown !== "string" || !coverage_markdown.trim()) return landings;
  for (const { header, rows } of readTables(coverage_markdown)) {
    const sourceColumn = columnIndex(header, /来源/);
    if (sourceColumn < 0) continue;
    const landingColumn = columnIndex(header, /落点|去向/);
    for (const row of rows) {
      const id = (row[sourceColumn] ?? "").replace(/[*`]/g, "").trim();
      if (!REQUIREMENT_ID.test(id)) continue;
      landings.set(id, landingColumn >= 0 ? (row[landingColumn] ?? "").trim() : "");
    }
  }
  return landings;
}

function reconcileCoverage({ markdown, requirement_index_markdown, coverage_markdown } = {}) {
  if (typeof coverage_markdown !== "string") return null;
  const requirementKnown = typeof requirement_index_markdown === "string" && Boolean(requirement_index_markdown.trim());
  const { ids: requirements, readable: requirementReadable } = readRequirementIds(requirement_index_markdown);
  const requirementUnavailable = requirementKnown && !requirementReadable
    ? "the declared requirement index has no 编号 column" : null;
  const requirementSet = new Set(requirements);
  const landings = readCoverageLandings(coverage_markdown);
  const warnings = [];
  // One acceptance identity is normalized before it is counted: AC-P3-1 and
  // AC-P3-001 are the same acceptance, and an unreadable id is named instead of
  // silently skipped.
  const entries = [];
  const rawEntries = readAcceptanceEntries(markdown);
  for (const raw of rawEntries) {
    const id = normalizeAcId(raw.id);
    if (!id) {
      warnings.push(warning("coverage_acceptance_id_unreadable", raw.id, "判据编号",
        `${raw.id} is not a readable acceptance id; its coverage cannot be reconciled`));
      continue;
    }
    if (entries.some((entry) => entry.id === id)) continue;
    entries.push({ id, fields: raw.fields });
  }
  // A coverage landing may name any acceptance the log cites, not only one that
  // has its own 「7. 验收」 entry yet.
  const declared = new Set(designAcs(markdown));
  const complete = [];
  const incomplete = [];
  const owners = [];
  const recoveries = [];
  for (const entry of entries) {
    const sourceText = entry.fields[COVERAGE_FIELD.source];
    const sourceIds = [...String(sourceText ?? "").matchAll(/R-\d+[a-z]?/g)].map((match) => match[0]);
    // An unreadable requirement index cannot disprove a cited requirement, so
    // the unknown-source check only runs when the index was actually read.
    const sourceCheckable = requirementKnown && requirementReadable;
    const unknownSources = sourceCheckable ? sourceIds.filter((id) => !requirementSet.has(id)) : [];
    const sourceMissing = none(sourceText);
    const sourceValid = !sourceMissing && sourceIds.length > 0 && unknownSources.length === 0;
    const replacement = entry.fields[COVERAGE_FIELD.replacement];
    const hasReplacement = !none(replacement);
    const unansweredText = entry.fields[COVERAGE_FIELD.unanswered];
    const isBound = !noBinding(unansweredText);
    const missingBasis = isBound ? [] : COVERAGE_ADDITION_BASIS.filter((label) => none(entry.fields[label]));
    if (sourceMissing) {
      warnings.push(warning("coverage_acceptance_without_source", entry.id, COVERAGE_FIELD.source,
        `${entry.id} has no ${COVERAGE_FIELD.source}; this acceptance does not trace back to a requirement`));
    } else if (sourceIds.length === 0) {
      warnings.push(warning("coverage_source_unknown", entry.id, COVERAGE_FIELD.source,
        `${entry.id} names 「${String(sourceText).trim()}」 as ${COVERAGE_FIELD.source}, but it names no requirement id`));
    } else if (unknownSources.length > 0) {
      warnings.push(warning("coverage_source_unknown", entry.id, COVERAGE_FIELD.source,
        `${entry.id} names ${unknownSources.join("、")} as ${COVERAGE_FIELD.source}, but the requirement index does not declare it`));
    }
    if (!isBound && !hasReplacement && missingBasis.length > 0) {
      warnings.push(warning("coverage_addition_basis_missing", entry.id, COVERAGE_FIELD.replacement,
        `${entry.id} has neither ${COVERAGE_FIELD.replacement} nor the full addition basis; missing ${missingBasis.join("、")}`));
    }
    if (sourceValid && !isBound && (hasReplacement || missingBasis.length === 0)) { complete.push(entry.id); continue; }
    incomplete.push(entry.id);
    if (isBound) {
      const owner = none(entry.fields[COVERAGE_FIELD.owner]) ? "未取得" : entry.fields[COVERAGE_FIELD.owner].trim();
      const recovery = none(entry.fields[COVERAGE_FIELD.recovery]) ? "未取得" : entry.fields[COVERAGE_FIELD.recovery].trim();
      if (!owners.includes(owner)) owners.push(owner);
      if (!recoveries.includes(recovery)) recoveries.push(recovery);
    }
  }
  // A declared coverage file that cannot be read as a matrix, and a log with no
  // acceptance entries, have no current basis for a coverage claim: report
  // unavailability instead of an empty set difference.
  const unavailable = !coverage_markdown.trim()
    ? "the declared coverage matrix is empty"
    : entries.length === 0
      ? rawEntries.length > 0
        ? "acceptance entries exist but none carries a readable 判据编号"
        : "no 「7. 验收」 acceptance entries in the decision log"
      : null;
  const requirementCount = requirementKnown && !requirementUnavailable ? requirements.length : null;
  if (unavailable) {
    return { reading: {
      unavailable,
      acceptances: [], complete_ids: [], incomplete_ids: [], owners: [], recoveries: [],
      requirement_count: requirementCount, covered_count: null, requirement_unavailable: requirementUnavailable,
    }, warnings };
  }
  let covered = 0;
  // The index is declared but its 编号 column cannot be located: name the
  // missing reading instead of claiming an empty requirement set.
  if (!requirementUnavailable) {
    for (const id of requirements) {
      const landing = landings.get(id);
      if (landing === undefined || none(landing)) {
        warnings.push(warning("coverage_requirement_missing", id, "覆盖矩阵",
          `${id} is declared by the requirement index but has no coverage landing in the declared coverage matrix`));
        continue;
      }
      covered += 1;
      for (const ac of designAcs(landing)) {
        if (!declared.has(ac)) {
          warnings.push(warning("coverage_landing_unknown", id, "覆盖矩阵",
            `${id} lands on ${ac}, but the decision log declares no such acceptance`));
        }
      }
    }
  }
  return { reading: {
    unavailable: null,
    acceptances: entries.map((entry) => entry.id),
    complete_ids: complete,
    incomplete_ids: incomplete,
    owners,
    recoveries,
    requirement_count: requirementCount,
    covered_count: requirementKnown && !requirementUnavailable ? covered : null,
    requirement_unavailable: requirementUnavailable,
  }, warnings };
}

export function checkDecisionLogChain({ markdown, source_ref = "decision-log.md", requirement_index_markdown, read_source, log_path, index_path, spec_markdown, coverage_markdown, read_blob } = {}) {
  if (typeof markdown !== "string") {
    return {
      schema_version: "decision-log-chain-warning.v1",
      source_ref,
      warnings: [warning("invalid_input", "unknown", "markdown", "decision log content is not text")],
      failures: [],
      design_packages: [],
      exit_code: 0,
    };
  }

  // The v2 record writes one design block per work package with the ten
  // template items. Report each block and every missing item by name; this is
  // an advisory reading of the current bytes, not a new gate.
  const designPackages = readDesignBlocks(markdown).map(pkg => ({ ...pkg, missingItems: pkg.missing }));
  const mappings = decisionIdMappings(markdown);
  const { sections, commitmentSections, unmapped, nonCanonical, headings, sourceIds, looseCommitments } = decisionSections(markdown, mappings);
  // A 「最终决定」 heading with no 承诺 line under it is still a decision entry
  // that carries nothing; it must keep reporting no_decision_entries instead of
  // counting as a read block. Only a section that actually carries a
  // commitment line is recognized.
  const readCommitmentSections = commitmentSections.filter((section) => (section.commitments?.length ?? 0) > 0);
  const knownDecisions = new Set(sections.map(({ decision_id }) => decision_id));
  const warnings = unitWarnings(markdown);
  for (const pkg of designPackages) {
    if (!pkg.missingItems.length) continue;
    warnings.push(warning("package_design_incomplete", `包 ${pkg.id}`, "每包设计", `包 ${pkg.id}（${pkg.name}）缺 ${pkg.missingItems.join("、")}；owner=包 ${pkg.id} 作者`));
  }
  // The AC ids above are normalized per package. Reconcile the whole log
  // against the spec's authoritative list so a missing or invented AC is named
  // instead of being invisible behind a per-package count.
  const acReconciliation = reconcileAcs(markdown, spec_markdown);
  if (acReconciliation) {
    for (const ac of acReconciliation.unresolved) {
      warnings.push(warning("design_ac_unresolved", ac, "验收", `${ac} appears in the log but the spec's AC list does not declare it; the id or the range has to be aligned`));
    }
    for (const ac of acReconciliation.uncovered) {
      warnings.push(warning("spec_ac_uncovered", ac, "验收", `the spec declares ${ac}, but no log text cites it; design and acceptance are not reconciled`));
    }
  }
  // P3 coverage keeps its own reading: requirement -> acceptance -> source and
  // the unanswered binding of each acceptance. It is advisory like the rest of
  // the chain report and never changes the exit code by itself.
  const coverage = reconcileCoverage({ markdown, requirement_index_markdown, coverage_markdown });
  if (coverage) warnings.push(...coverage.warnings);
  const coverageReconciliation = coverage?.reading ?? null;
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
  // A package's 「最终决定」 item is a recognized commitment block only when it
  // carries a commitment line, so a log in the v2 template shape is read
  // instead of collapsing into "no entries" — while an empty section still is
  // no entry at all.
  if (sections.length === 0 && readCommitmentSections.length === 0) {
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
        // A decision block carries several 承诺 lines by design, and the
        // derived/rejected lines repeat per decision too; only the decision's
        // own single-value parent fields are duplicate-checked.
        if (!COMMITMENT_LINE_FIELDS.includes(parent.field) && parents.slice(0, index).some(({ field }) => field === parent.field)) {
          warnings.push(warning("duplicate_chain_field", decision_id, parent.field, `${decision_id} repeats parent ${parent.field} at line ${parent.line}`));
        }
        if (![...CURRENT_FIELDS, ...SOURCE_FIELDS, ...COMMITMENT_LINE_FIELDS].includes(parent.field)) {
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

  const answerSources = answerSourceWarnings(answerSections, requirement_index_markdown, read_source, { log_path, index_path, read_blob });
  warnings.push(...answerSources.warnings);
  const commitmentBranches = commitmentWarnings({
    sections, commitmentSections: readCommitmentSections, looseCommitments, requirement_index_markdown, read_source, identity: { log_path, index_path },
  });
  warnings.push(...commitmentBranches.warnings);

  return {
    schema_version: "decision-log-chain-warning.v1",
    source_ref,
    recognized_blocks: sections.length + readCommitmentSections.length,
    recognized_fields: recognizedFields,
    design_packages: designPackages.map(pkg => ({ id: pkg.id, name: pkg.name, line: pkg.line, acs: pkg.acs, missing_items: pkg.missingItems })),
    ac_reconciliation: acReconciliation,
    coverage_reconciliation: coverageReconciliation,
    blob_bindings: answerSources.bindings,
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

// A missing sibling spec keeps the AC reconciliation unavailable instead of
// inventing an empty authoritative list.
function readSpecSibling(file) {
  try { return readFileSync(join(dirname(resolve(file)), "spec.md"), "utf8"); }
  catch (error) { if (error.code === "ENOENT") return undefined; throw error; }
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

// A 承诺 line is the second way a log declares that the index has to be read.
// It is not the P1 source contract: the pledge keeps its own pointer per line,
// so a log that only writes commitments still gets the index and the original
// bytes read. Fenced examples stay examples.
function declaresCommitment(markdown) {
  let fence = null;
  for (const line of markdown.split("\n")) {
    const nextFence = fenceStep(line, fence);
    if (nextFence !== fence) { fence = nextFence; continue; }
    if (fence) continue;
    if (COMMITMENT_LINE.test(line)) return true;
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

// P3 declares one unique coverage matrix next to the requirement-index pointer.
// A fenced example is not a declaration; two distinct declarations stay an
// input error instead of one being picked.
function coveragePointers(markdown) {
  const found = new Set();
  let fence = null;
  for (const line of String(markdown).split(/\r?\n/)) {
    const nextFence = fenceStep(line, fence);
    if (nextFence !== fence) { fence = nextFence; continue; }
    if (fence) continue;
    if (!/^\s*(?:\|\s*|[-*+]\s+)?(?:\*\*)?覆盖核对(?:\*\*)?\s*[：:]/.test(line)) continue;
    for (const match of line.matchAll(/`([^`\s]+\.md)`/g)) found.add(match[1]);
    const bare = /覆盖核对\s*[：:]\s*([^\s|`]+\.md)/.exec(line)?.[1];
    if (bare) found.add(bare);
  }
  return [...found];
}

function resolveIndexPointer(pointer, base, read, kind = "requirement index") {
  const candidates = isAbsolute(pointer)
    ? [resolve(pointer)]
    : [resolve(base, pointer), resolve(base, "quality/evidence/decision-log-refs", pointer)];
  const readable = [...new Set(candidates)].filter((candidate) => {
    try { read(candidate); return true; }
    catch { return false; }
  });
  if (readable.length === 1) return readable[0];
  if (readable.length === 0) throw Object.assign(new Error(`declared ${kind} ${pointer} is not readable under the task root or decision-log-refs`), { code: "INDEX_NOT_READABLE" });
  throw Object.assign(new Error(`declared ${kind} ${pointer} matches more than one readable file`), { code: "INDEX_AMBIGUOUS" });
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
// `.resolve` exposes that same real path so a caller can tell an original from
// the decision log or the requirement index itself; reading stays text-only.
function createSourceReader({ base, worktree, sourceRoots }) {
  const roots = [...new Set([base, worktree, ...sourceRoots].filter(Boolean).map((path) => realpathSync(path)))];
  const locate = (ref) => {
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
      return real;
    }
    throw lastError;
  };
  const read = (ref) => new TextDecoder("utf-8", { fatal: true }).decode(readFileSync(locate(ref)));
  read.resolve = (ref) => locate(ref);
  return read;
}

// A frozen Git object is the only way to cite a line that cannot drift after
// the commit. `cat-file -e` proves the blob exists, `rev-parse <commit>:<path>`
// proves the declared commit really carries that blob, and `cat-file blob`
// returns the bytes the quote is checked against. Nothing here reads the
// working tree, so a later edit cannot make an old confirmation look current.
function createGitBlobReader({ worktree }) {
  if (!worktree) return null;
  const git = (args, { binary = false } = {}) => execFileSync("git", args, {
    cwd: worktree, encoding: binary ? undefined : "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024,
  });
  return ({ commit, path, blob }) => {
    if (!/^[0-9a-f]{7,64}$/.test(commit) || !/^[0-9a-f]{40,64}$/.test(blob) || !path) {
      throw Object.assign(new Error("blob binding is not a commit:path#blob triple"), { code: "INVALID_BLOB_BINDING" });
    }
    try { git(["cat-file", "-e", `${blob}^{blob}`]); }
    catch { throw Object.assign(new Error(`blob ${blob} does not exist in this repository`), { code: "BLOB_MISSING" }); }
    let actual;
    try { actual = git(["rev-parse", "--verify", `${commit}:${path}`]).trim(); }
    catch { throw Object.assign(new Error(`${commit}:${path} is not a readable Git path`), { code: "COMMIT_PATH_UNREADABLE" }); }
    if (actual !== blob) throw Object.assign(new Error(`${commit}:${path} is blob ${actual}, not the declared ${blob}`), { code: "BLOB_MISMATCH" });
    const bytes = git(["cat-file", "blob", blob], { binary: true });
    // The resolved file is returned so the caller can still refuse a frozen
    // object that is really the decision log or the derived index itself.
    let real_path = null;
    try { real_path = realpathSync(isAbsolute(path) ? resolve(path) : resolve(worktree, path)); } catch { real_path = null; }
    return { ok: true, text: new TextDecoder("utf-8", { fatal: true }).decode(bytes), commit, path, blob, real_path };
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
    // The spec is the authoritative AC list and sits next to the decision log;
    // the blob reader is bound to the worktree this input lives in.
    const side = { spec_markdown: readSpecSibling(input.path), read_blob: createGitBlobReader({ worktree: worktreeRootOf(input.path) }) };
    if (values.file) {
      const sourceDeclared = declaresAnswerSource(markdown) || declaresCommitment(markdown);
      const coverageRefs = coveragePointers(markdown);
      const declared = sourceDeclared || coverageRefs.length > 0;
      const pointers = declared ? requirementIndexPointers(markdown) : [];
      if (!declared) {
        result = checkDecisionLogChain({ markdown, source_ref: input.source_ref, ...side });
      } else if (pointers.length > 1 || coverageRefs.length > 1) {
        console.error(`[check-decision-log-chain] ${input.source_ref} declares ${pointers.length} requirement-index pointer(s) and ${coverageRefs.length} coverage pointer(s); expected at most one each`);
        hadReadError = true; continue;
      } else if (sourceDeclared && pointers.length === 0) {
        console.error(`[check-decision-log-chain] ${input.source_ref} declares source_id or 承诺 but has no requirement-index pointer; source, tone and commitment cannot be checked`);
        hadReadError = true; continue;
      } else {
        let indexText, indexPath, coverageText, read_source;
        try {
          const base = authenticatedTaskBase(declaredTaskBase(markdown));
          read_source = createSourceReader({ base, worktree: worktreeRootOf(input.path), sourceRoots: values.sourceRoots });
          if (pointers.length === 1) {
            const indexRef = resolveIndexPointer(pointers[0], base, read_source);
            indexText = read_source(indexRef);
            indexPath = read_source.resolve(indexRef);
          }
          if (coverageRefs.length === 1) {
            const coverageRef = resolveIndexPointer(coverageRefs[0], base, read_source, "coverage matrix");
            coverageText = read_source(coverageRef);
          }
        } catch (error) {
          console.error(`[check-decision-log-chain] cannot read declared coverage originals in ${input.source_ref}: ${error.code ?? error.message}`);
          hadReadError = true; continue;
        }
        result = checkDecisionLogChain({ markdown, source_ref: input.source_ref, requirement_index_markdown: indexText, coverage_markdown: coverageText, read_source,
          log_path: realpathSync(input.path), index_path: indexPath, ...side });
      }
    } else {
      result = checkDecisionLogChain({ markdown, source_ref: input.source_ref, ...side });
    }
    checkedInputs += 1;
    console.log(`[check-decision-log-chain] scanned ${JSON.stringify({input_path:resolve(input.path),input_sha256:executionHash(inputBytes),checker_sha256:checkerExecutionHash})}`);
    for (const pkg of result.design_packages ?? []) {
      const total = 10;
      const have = total - pkg.missing_items.length;
      console.log(`[check-decision-log-chain] design package ${pkg.id} (${pkg.name}) line ${pkg.line}: ${have}/${total} items${pkg.missing_items.length ? `; missing ${pkg.missing_items.join("、")}` : ""}; AC ${pkg.acs.join("、") || "none"}`);
    }
    if (result.ac_reconciliation) {
      const rec = result.ac_reconciliation;
      console.log(`[check-decision-log-chain] AC reconciliation: spec ${rec.spec_count} distinct, log ${rec.log_acs.length} distinct; unresolved ${rec.unresolved.join("、") || "none"}; uncovered ${rec.uncovered.join("、") || "none"}`);
    } else {
      const reason = side.spec_markdown === undefined
        ? "no spec.md next to the decision log"
        : "spec.md next to the decision log declares no acceptance criteria";
      console.log(`[check-decision-log-chain] AC reconciliation unavailable: ${reason}; no set difference is claimed`);
    }
    if (result.coverage_reconciliation) {
      const cov = result.coverage_reconciliation;
      if (cov.unavailable) {
        console.log(`[check-decision-log-chain] coverage reconciliation unavailable for ${input.source_ref}: ${cov.unavailable}; no coverage claim is made`);
      } else {
        const requirementReading = cov.requirement_unavailable
          ? `unavailable (${cov.requirement_unavailable})`
          : `${cov.covered_count ?? "unknown"}/${cov.requirement_count ?? "unknown"} covered`;
        console.log(`[check-decision-log-chain] coverage reconciliation: requirements ${requirementReading}; acceptances ${cov.acceptances.length}; complete ${cov.complete_ids.join("、") || "none"}; incomplete ${cov.incomplete_ids.join("、") || "none"} (owner=${cov.owners.join("、") || "none"}; recovery=${cov.recoveries.join("、") || "none"})`);
      }
    }
    for (const binding of result.blob_bindings ?? []) {
      console.log(`[check-decision-log-chain] blob binding ${binding.source_id} ${binding.commit}:${binding.path}#${binding.blob}#L${binding.line_start}-L${binding.line_end} verified`);
    }
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
    console.error(`[check-decision-log-chain] ${answerErrors} named source/commitment error(s); new-shape source/tone/commitment evidence is not usable, exit 1`);
    return 1;
  }
  if (checkedInputs > 0) console.log(`[check-decision-log-chain] advisory complete: ${warningCount} warning(s), non-blocking, exit 0`);
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  process.exitCode = main();
}
