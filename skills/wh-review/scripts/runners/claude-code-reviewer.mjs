#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

const VERDICTS = new Set(["pass", "revise_required", "escalate_to_human"]);
const SEVERITIES = new Set(["blocking", "important", "minor"]);
const SUPPLEMENTARY_CONTEXT_MARKER = "\n\n---\n\n## Supplementary context (agent-authored prompt)\n\n";

function arg(name) {
  const prefix = `--${name}=`;
  const found = process.argv.slice(2).find((item) => item.startsWith(prefix));
  return found ? found.slice(prefix.length) : "";
}

function findJsonObjects(text) {
  const spans = [];
  let start = -1;
  let depth = 0;
  let inString = false;
  let esc = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (depth === 0) {
      if (ch === "{") {
        start = i;
        depth = 1;
        inString = false;
        esc = false;
      }
      continue;
    }
    if (esc) {
      esc = false;
      continue;
    }
    if (ch === "\\" && inString) {
      esc = true;
      continue;
    }
    if (ch === "\"") {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) spans.push(text.slice(start, i + 1));
    }
  }
  return spans;
}

function parseClaudeResult(stdout) {
  try {
    const wrapped = JSON.parse(stdout);
    if (typeof wrapped.result === "string") return wrapped.result;
  } catch {
    // Fall through to raw stdout parsing.
  }
  return stdout;
}

function findVerdictJson(text) {
  for (const candidate of findJsonObjects(text).reverse()) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && VERDICTS.has(parsed.verdict)) return parsed;
      if (parsed && parsed.pass === true && !parsed.verdict) {
        return {
          ...parsed,
          verdict: "pass",
          resolutionSummary:
            typeof parsed.resolutionSummary === "string"
              ? parsed.resolutionSummary
              : "Claude Code returned pass=true; normalized to verdict=pass.",
        };
      }
    } catch {
      // Try the next balanced object.
    }
  }
  return null;
}

function sha256(text) {
  return createHash("sha256").update(String(text ?? "")).digest("hex");
}

function extractSupplementaryPrompt(materials) {
  if (typeof materials !== "string") return null;
  const index = materials.indexOf(SUPPLEMENTARY_CONTEXT_MARKER);
  if (index === -1) return null;
  return materials.slice(index + SUPPLEMENTARY_CONTEXT_MARKER.length);
}

function reviewInputProvenance({ contract, materials, prompt }) {
  const supplementaryPrompt = extractSupplementaryPrompt(materials);
  return {
    prompt_char_count: prompt.length,
    contract_char_count: typeof contract === "string" ? contract.length : 0,
    materials_char_count: typeof materials === "string" ? materials.length : 0,
    contract_hash: sha256(contract),
    materials_hash: sha256(materials),
    supplementary_prompt_present: supplementaryPrompt !== null,
    supplementary_prompt_hash: supplementaryPrompt === null ? null : sha256(supplementaryPrompt),
  };
}

function normalizeFinding(finding) {
  const item = finding && typeof finding === "object" ? { ...finding } : {};
  if (!SEVERITIES.has(item.severity)) item.severity = "minor";
  if (typeof item.file !== "string" || item.file.length === 0) item.file = "REVIEW_CONTRACT";
  if (!Number.isInteger(item.line) || item.line <= 0) item.line = 1;
  if (typeof item.issue !== "string" || item.issue.length === 0) item.issue = "review finding missing issue text";
  if (typeof item.recommendation !== "string") item.recommendation = "";
  return item;
}

function normalizeVerdict(result, mode) {
  if (!result || typeof result !== "object" || !VERDICTS.has(result.verdict)) return null;
  return {
    ...result,
    findings: Array.isArray(result.findings) ? result.findings.map(normalizeFinding) : [],
    resolutionSummary:
      typeof result.resolutionSummary === "string" ? result.resolutionSummary : "",
    actual_mode: mode,
    provider: "claude-code",
    provider_cli: "claude",
    host: process.env.WH_REVIEW_HOST_AGENT || "codex",
    trueCrossEngine: true,
    reviewMode: "claude-code-cli",
    reviewSnapshot: result.reviewSnapshot ?? [],
    riskDisposition: result.riskDisposition ?? [],
    worktreeInventory: result.worktreeInventory ?? { included: [], unrelated: [], excluded: [] },
  };
}

function failureRecord({ mode, reason, status, stderr, raw, attempts }) {
  return {
    verdict: "escalate_to_human",
    findings: [],
    resolutionSummary: `${reason}; attempts=${attempts ?? 1}; status=${status}; stderr=${String(stderr || "").slice(0, 500)}; raw=${String(raw || "").slice(0, 500)}`,
    actual_mode: "not_executed",
    provider: "claude-code",
    provider_cli: "claude",
    host: process.env.WH_REVIEW_HOST_AGENT || "codex",
    trueCrossEngine: false,
    reviewMode: "claude-code-cli",
    failure_reason: reason,
    requested_mode: mode,
    reviewSnapshot: [],
    riskDisposition: [],
    worktreeInventory: { included: [], unrelated: [], excluded: [] },
  };
}

function runClaude({ claudeBin, prompt, schema }) {
  return spawnSync(
    claudeBin,
    ["-p", "--bare", "--output-format", "json", "--json-schema", JSON.stringify(schema), "--no-session-persistence"],
    {
      input: prompt,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      maxBuffer: 30 * 1024 * 1024,
      timeout: Number(process.env.CLAUDE_CODE_REVIEW_TIMEOUT_MS || 300000),
    }
  );
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
        additionalProperties: true,
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
  },
  required: ["verdict", "findings", "resolutionSummary"],
};

const prompt = `You are Claude Code acting as a heterologous reviewer.

Host agent: ${process.env.WH_REVIEW_HOST_AGENT || "codex"}
Required provider: claude-code.

Use the REVIEW CONTRACT exactly.

Return only a JSON object with these exact top-level keys:
- "verdict": one of "pass", "revise_required", "escalate_to_human"
- "findings": an array
- "resolutionSummary": a string

Do not return {"pass": true}. Do not return markdown. Do not omit "verdict".

If the caller binding says blind review, do not inspect final decision-log claims as direction evidence.
If the caller binding says detail review, apply intake-detail-review / 细节节 rules.

## REVIEW CONTRACT

${payload.contract}

## MATERIALS

${payload.materials}`;
const inputProvenance = reviewInputProvenance({
  contract: payload.contract,
  materials: payload.materials,
  prompt,
});

const claudeBin = process.env.CLAUDE_CODE_BIN || "claude";
let output;
const maxAttempts = Math.max(1, Number(process.env.CLAUDE_CODE_REVIEW_ATTEMPTS || 3));
let lastFailure = null;
for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  const proc = runClaude({ claudeBin, prompt, schema });
  if (proc.signal || proc.error?.code === "ETIMEDOUT") {
    lastFailure = { mode, reason: "claude-code-timeout", status: proc.status, stderr: proc.stderr, raw: proc.stdout, attempts: attempt };
    break;
  }
  if (proc.status !== 0) {
    lastFailure = { mode, reason: "claude-code-non-zero-exit", status: proc.status, stderr: proc.stderr, raw: proc.stdout, attempts: attempt };
    break;
  }

  const raw = parseClaudeResult(proc.stdout || "");
  const verdict = normalizeVerdict(findVerdictJson(raw), mode);
  if (verdict) {
    output = {
      ...verdict,
      ...inputProvenance,
      claudeCodeAttempts: attempt,
    };
    break;
  }

  lastFailure = {
    mode,
    reason: raw.trim().length === 0 ? "claude-code-empty-output" : "claude-code-output-unparseable",
    status: proc.status,
    stderr: proc.stderr,
    raw,
    attempts: attempt,
  };
}

if (!output) {
  output = {
    ...failureRecord(lastFailure ?? { mode, reason: "claude-code-output-unparseable", attempts: maxAttempts }),
    ...inputProvenance,
  };
}

writeFileSync(outputFile, JSON.stringify(output, null, 2));
process.exit(0);
