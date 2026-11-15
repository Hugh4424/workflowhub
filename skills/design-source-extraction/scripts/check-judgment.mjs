#!/usr/bin/env node
// 有稿判断的唯一私有检查入口。消费者是 build-code 第 1 步的施工前置；
// 本脚本只服务设计源提炼技能的判断面，不进入公共运行时命令面。
//
// 输入是一份 judgment.md，正文给人读，机器块给本脚本读。
// 退出码：0 允许施工；1 判断不完整或不允许施工；2 输入不可读或参数错误。
import {existsSync, readFileSync} from 'node:fs';
import {isAbsolute, posix, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const HARD_CONDITIONS = new Set([
  "source_role_conflict",
  "not_same_page_scope",
  "interaction_unportable",
  "rights_missing",
  "critical_data_mismatch",
]);
const CHAIN_KEYS = ["page", "data", "function"];
const CHECK_KEYS = ["old_page_state", "disposition_basis", "design_source", "availability", "adaptation", "handoff"];
const DISPOSITIONS = new Set(["adapt", "rebuild", "not_applicable"]);
const VERDICTS = new Set(["direct", "adapt", "unusable"]);
const CONFIRMATION_STATUSES = new Set(["none", "awaiting"]);

function text(value) {
  return typeof value === "string" && value.trim() !== "";
}

function reject(code, detail, summary = {}) {
  process.stdout.write(JSON.stringify({judgment_valid: false, allowed_for_construction: false, ...summary}) + "\n");
  process.stderr.write(JSON.stringify({error: {code, detail}}) + "\n");
  process.exitCode = 1;
}

function unreadable(code, detail) {
  process.stderr.write(JSON.stringify({error: {code, detail}}) + "\n");
  process.exitCode = 2;
}

export function readJudgment(path) {
  if (!text(path)) throw Object.assign(new Error("--input is required"), {code: "INPUT_REQUIRED", kind: "usage"});
  const absolute = resolve(path);
  if (!existsSync(absolute)) throw Object.assign(new Error(`judgment not found: ${absolute}`), {code: "JUDGMENT_UNREADABLE", kind: "io"});
  const bytes = readFileSync(absolute, "utf8");
  const match = /```json\r?\n([\s\S]*?)```/.exec(bytes);
  if (!match) throw Object.assign(new Error("judgment.md has no fenced json machine block"), {code: "JUDGMENT_MACHINE_BLOCK_MISSING", kind: "io"});
  let value;
  try {
    value = JSON.parse(match[1]);
  } catch (error) {
    throw Object.assign(new Error(`machine block is not valid JSON: ${error.message}`), {code: "JUDGMENT_MACHINE_BLOCK_INVALID", kind: "io"});
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw Object.assign(new Error("machine block must be an object"), {code: "JUDGMENT_MACHINE_BLOCK_INVALID", kind: "io"});
  return value;
}

export function validateDesignSource(doc) {
  const source = doc.design_source;
  if (!source || typeof source !== "object") return {code: "ROLE_CONFLICT", detail: "design_source is missing"};
  const role = source.role;
  const ref = source.ref;
  if (!text(ref)) return {code: "ROLE_CONFLICT", detail: "design_source.ref is empty"};
  if (isAbsolute(ref)) return {code: "ROLE_CONFLICT", detail: "design_source.ref must be repository-relative"};
  const normalized = posix.normalize(ref.replace(/\\/g, "/"));
  if (normalized === ".." || normalized.startsWith("../")) {
    return {code: "ROLE_CONFLICT", detail: "design_source.ref escapes the repository root"};
  }
  if (role === "implementation_fixture" || role === "current_prototype") {
    return {code: "ROLE_CONFLICT", detail: `${role} cannot pose as a design source`};
  }
  if (role === "real_design_source") {
    if (!/^specs\/design\/prototypes\//.test(normalized)) {
      return {code: "ROLE_CONFLICT", detail: "a real design source must live under specs/design/prototypes/"};
    }
  } else if (role === "sample_design_source") {
    if (!/^tests\/fixtures\//.test(normalized)) {
      return {code: "ROLE_CONFLICT", detail: "a sample design source must live under tests/fixtures/"};
    }
  } else {
    return {code: "ROLE_CONFLICT", detail: `unknown design source role: ${String(role)}`};
  }
  if (source.availability !== "present") {
    return {code: "DESIGN_SOURCE_UNAVAILABLE", detail: `design source availability is ${String(source.availability)}`};
  }
  return null;
}

export function validateJudgment(doc) {
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) return {code: "JUDGMENT_MACHINE_BLOCK_INVALID", detail: "judgment must be an object"};
  if (doc.schema_version !== "1.0.0") return {code: "UNSUPPORTED_SCHEMA", detail: "schema_version must be 1.0.0"};
  const roleIssue = validateDesignSource(doc);
  if (roleIssue) return roleIssue;
  if (!doc.chains || typeof doc.chains !== "object") return {code: "MISSING_CHAIN", detail: "chains are missing"};
  for (const key of CHAIN_KEYS) if (!text(doc.chains[key])) return {code: "MISSING_CHAIN", detail: `chain "${key}" is empty`};
  if (!doc.checks || typeof doc.checks !== "object") return {code: "MISSING_CHECK", detail: "six checks are missing"};
  for (const key of CHECK_KEYS) if (!text(doc.checks[key])) return {code: "MISSING_CHECK", detail: `check "${key}" is empty`};
  if (!Array.isArray(doc.old_pages)) return {code: "MISSING_OLD_PAGE_DISPOSITION", detail: "old_pages must be an array"};
  if (doc.old_pages.length === 0) {
    if (!text(doc.no_old_page_reason)) return {code: "MISSING_OLD_PAGE_DISPOSITION", detail: "no old page needs a written inapplicable reason"};
  } else {
    for (const [index, page] of doc.old_pages.entries()) {
      if (!page || typeof page !== "object") return {code: "MISSING_OLD_PAGE_DISPOSITION", detail: `old_pages[${index}] is not an object`};
      if (!text(page.page)) return {code: "MISSING_OLD_PAGE_DISPOSITION", detail: `old_pages[${index}].page is empty`};
      if (!text(page.disposition)) return {code: "MISSING_OLD_PAGE_DISPOSITION", detail: `old_pages[${index}].disposition is empty`};
      if (!DISPOSITIONS.has(page.disposition)) return {code: "INVALID_OLD_PAGE_DISPOSITION", detail: `old_pages[${index}].disposition is ${page.disposition}`};
      if (!text(page.reason)) return {code: "MISSING_OLD_PAGE_REASON", detail: `old_pages[${index}].reason is empty`};
      if (!text(page.basis)) return {code: "MISSING_OLD_PAGE_BASIS", detail: `old_pages[${index}].basis is empty`};
    }
  }
  if (!Array.isArray(doc.adaptation_items)) return {code: "MISSING_ADAPTATION_ITEMS", detail: "adaptation_items must be an array"};
  if (!VERDICTS.has(doc.verdict)) return {code: "INVALID_VERDICT", detail: `verdict is ${String(doc.verdict)}`};
  if (!Array.isArray(doc.hard_conditions)) return {code: "VERDICT_CONFLICT", detail: "hard_conditions must be an array"};
  for (const condition of doc.hard_conditions) {
    if (!HARD_CONDITIONS.has(condition)) return {code: "UNKNOWN_HARD_CONDITION", detail: `unknown hard condition: ${String(condition)}`};
  }
  if (doc.hard_conditions.length > 0 && doc.verdict !== "unusable") {
    return {code: "VERDICT_CONFLICT", detail: "a hard condition forces the unusable verdict"};
  }
  if (doc.verdict === "direct" && doc.adaptation_items.length > 0) {
    return {code: "VERDICT_CONFLICT", detail: "a direct verdict cannot carry adaptation items"};
  }
  if (doc.verdict === "adapt" && doc.adaptation_items.length === 0) {
    return {code: "MISSING_ADAPTATION_ITEMS", detail: "an adapt verdict needs at least one adaptation item"};
  }
  if (!Array.isArray(doc.destinations)) return {code: "MISSING_DESTINATIONS", detail: "destinations must be an array"};
  if (doc.verdict === "unusable") {
    if (doc.destinations.length < 2) return {code: "MISSING_DESTINATIONS", detail: "an unusable verdict needs two destinations"};
    for (const [index, destination] of doc.destinations.entries()) {
      if (!destination || typeof destination !== "object" || !text(destination.option)) {
        return {code: "MISSING_DESTINATIONS", detail: `destinations[${index}] has no option`};
      }
      if (!text(destination.owner)) return {code: "MISSING_DESTINATION_OWNER", detail: `destinations[${index}] has no owner`};
    }
  }
  if (!text(doc.next)) return {code: "MISSING_NEXT", detail: "next is empty"};
  if (!text(doc.owner)) return {code: "MISSING_OWNER", detail: "owner is empty"};
  const confirmation = doc.pending_confirmation;
  if (!confirmation || typeof confirmation !== "object") return {code: "INVALID_CONFIRMATION_STATUS", detail: "pending_confirmation is missing"};
  if (!CONFIRMATION_STATUSES.has(confirmation.status)) return {code: "INVALID_CONFIRMATION_STATUS", detail: `pending_confirmation.status is ${String(confirmation.status)}`};
  return null;
}

export function main(argv = process.argv.slice(2)) {
  const options = {input: null, confirmationRef: null};
  for (let index = 0; index < argv.length; index += 1) {
    const name = argv[index];
    if (name === "--input" || name === "--confirmation-ref") {
      const value = argv[index + 1];
      if (value === undefined || value.startsWith("--")) return unreadable("ARGUMENT_INVALID", `${name} needs a value`);
      if (name === "--input") {
        if (options.input) return unreadable("ARGUMENT_INVALID", "duplicate --input");
        options.input = value;
      } else {
        if (options.confirmationRef) return unreadable("ARGUMENT_INVALID", "duplicate --confirmation-ref");
        options.confirmationRef = value;
      }
      index += 1;
    } else {
      return unreadable("ARGUMENT_INVALID", `unknown argument: ${name}`);
    }
  }
  let doc;
  try {
    doc = readJudgment(options.input);
  } catch (error) {
    return unreadable(error.code || "JUDGMENT_UNREADABLE", error.message);
  }
  const issue = validateJudgment(doc);
  const summary = {
    verdict: doc.verdict,
    chains: Object.fromEntries(CHAIN_KEYS.map((key) => [key, text(doc.chains?.[key])])),
    checks: CHECK_KEYS.filter((key) => text(doc.checks?.[key])).length,
    old_pages: Array.isArray(doc.old_pages) ? doc.old_pages.length : 0,
    adaptation_count: Array.isArray(doc.adaptation_items) ? doc.adaptation_items.length : 0,
    hard_conditions: Array.isArray(doc.hard_conditions) ? doc.hard_conditions : [],
    destinations: Array.isArray(doc.destinations) ? doc.destinations : [],
    next: text(doc.next) ? doc.next : null,
    owner: text(doc.owner) ? doc.owner : null,
  };
  if (issue) return reject(issue.code, issue.detail, summary);
  const constructible = doc.verdict !== "unusable";
  if (doc.pending_confirmation.status === "awaiting") {
    if (!options.confirmationRef) {
      return reject("AWAITING_CONFIRMATION", "waiting for confirmation; no constructor may run", summary);
    }
    const confirmationPath = resolve(options.confirmationRef);
    if (!existsSync(confirmationPath)) return reject("CONFIRMATION_UNREADABLE", `confirmation original not found: ${confirmationPath}`, summary);
    let bytes;
    try {
      bytes = readFileSync(confirmationPath, "utf8");
    } catch (error) {
      return reject("CONFIRMATION_UNREADABLE", String(error.message), summary);
    }
    if (bytes.trim() === "") return reject("CONFIRMATION_UNREADABLE", "confirmation original is empty", summary);
    process.stdout.write(JSON.stringify({
      judgment_valid: true,
      allowed_for_construction: constructible,
      route: constructible ? "construct" : "stop_construction",
      ...summary,
      confirmation: {status: "confirmed", confirmation_ref: confirmationPath},
    }) + "\n");
    return undefined;
  }
  process.stdout.write(JSON.stringify({
    judgment_valid: true,
    allowed_for_construction: constructible,
    route: constructible ? "construct" : "stop_construction",
    ...summary,
    confirmation: {status: "none", confirmation_ref: null},
  }) + "\n");
  return undefined;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
