#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const VERDICTS = new Set(["pass", "revise_required", "escalate_to_human"]);
const SEVERITIES = new Set(["blocking", "important", "minor"]);

function arg(name) {
  const prefix = `--${name}=`;
  const found = process.argv.slice(2).find((item) => item.startsWith(prefix));
  return found ? found.slice(prefix.length) : "";
}

function isFinding(value) {
  return value && typeof value === "object" &&
    SEVERITIES.has(value.severity) &&
    typeof value.file === "string" && value.file.length > 0 &&
    Number.isInteger(value.line) && value.line > 0 &&
    typeof value.issue === "string" &&
    typeof value.recommendation === "string";
}

function isSkillResult(value) {
  return value && typeof value === "object" &&
    typeof value.skill === "string" && value.skill.length > 0 &&
    ["executed", "not_applicable", "unavailable", "failed"].includes(value.status) &&
    typeof value.evidence === "string";
}

function isVerdict(value) {
  const keys = new Set(["verdict", "findings", "resolutionSummary", "skillResults"]);
  return value && typeof value === "object" &&
    VERDICTS.has(value.verdict) &&
    Array.isArray(value.findings) && value.findings.every(isFinding) &&
    typeof value.resolutionSummary === "string" &&
    Object.keys(value).every((key) => keys.has(key)) &&
    (value.skillResults === undefined || (Array.isArray(value.skillResults) && value.skillResults.every(isSkillResult)));
}

function parseVerdict(stdout) {
  try {
    const envelope = JSON.parse(stdout);
    const value = typeof envelope?.result === "string" ? JSON.parse(envelope.result) : envelope;
    return isVerdict(value) ? value : null;
  } catch {
    return null;
  }
}

function failure({ mode, reason, proc }) {
  return {
    verdict: "escalate_to_human",
    findings: [],
    resolutionSummary: reason,
    actual_mode: "not_executed",
    provider: "claude-code",
    provider_cli: "claude",
    host: process.env.WH_REVIEW_HOST_AGENT || "codex",
    trueCrossEngine: false,
    reviewMode: "claude-code-cli",
    failure_reason: reason,
    requested_mode: mode,
    exit_status: proc.status ?? null,
  };
}

const diffFile = arg("diff");
const outputFile = arg("output");
if (!diffFile || !outputFile) {
  process.stderr.write("Usage: claude-code-reviewer.mjs --diff=<file> --output=<file>\n");
  process.exit(2);
}

const payload = JSON.parse(readFileSync(diffFile, "utf8"));
const mode = typeof payload.mode === "string" && payload.mode.length > 0 ? payload.mode : "full";
const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    verdict: { enum: ["pass", "revise_required", "escalate_to_human"] },
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          severity: { enum: ["blocking", "important", "minor"] },
          file: { type: "string" },
          line: { type: "integer", minimum: 1 },
          issue: { type: "string" },
          recommendation: { type: "string" },
        },
        required: ["severity", "file", "line", "issue", "recommendation"],
      },
    },
    resolutionSummary: { type: "string" },
    skillResults: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          skill: { type: "string" },
          status: { enum: ["executed", "not_applicable", "unavailable", "failed"] },
          evidence: { type: "string" },
        },
        required: ["skill", "status", "evidence"],
      },
    },
  },
  required: ["verdict", "findings", "resolutionSummary"],
};

const prompt = `You are Claude Code acting as a heterologous reviewer.

Use the REVIEW CONTRACT exactly. Review only the supplied MATERIALS.
Return the required JSON verdict; do not return markdown.

## REVIEW CONTRACT

${payload.contract}

## MATERIALS

${payload.materials}`;
const claudeBin = process.env.CLAUDE_CODE_BIN || "claude";
const proc = spawnSync(
  claudeBin,
  ["-p", "--bare", "--output-format", "json", "--json-schema", JSON.stringify(schema)],
  {
    input: prompt,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    timeout: Number(process.env.CLAUDE_CODE_REVIEW_TIMEOUT_MS || 300000),
  }
);

let output;
if (proc.signal || proc.error?.code === "ETIMEDOUT") {
  output = failure({ mode, reason: "claude-code-timeout", proc });
} else if (proc.status !== 0) {
  output = failure({ mode, reason: "claude-code-non-zero-exit", proc });
} else {
  const verdict = parseVerdict(proc.stdout || "");
  output = verdict
    ? {
        ...verdict,
        actual_mode: mode,
        provider: "claude-code",
        provider_cli: "claude",
        host: process.env.WH_REVIEW_HOST_AGENT || "codex",
        trueCrossEngine: true,
        reviewMode: "claude-code-cli",
      }
    : failure({
        mode,
        reason: String(proc.stdout || "").trim() ? "claude-code-output-unparseable" : "claude-code-empty-output",
        proc,
      });
}

writeFileSync(outputFile, JSON.stringify(output, null, 2));
