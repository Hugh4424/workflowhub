#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

const VERDICTS = new Set(["pass", "revise_required", "escalate_to_human"]);
const SEVERITIES = new Set(["blocking", "important", "minor"]);
const SUPPLEMENTARY_CONTEXT_MARKER = "\n\n---\n\n## Supplementary context (agent-authored prompt)\n\n";
const DIAGNOSTIC_PREVIEW_CHARS = 2048;
const DEFAULT_MAX_INPUT_CHARS = 2 * 1024 * 1024;

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

function parseClaudeResponse(stdout) {
  const response = { raw: stdout, envelope: null };
  try {
    const wrapped = JSON.parse(stdout);
    if (wrapped && typeof wrapped === "object") {
      response.envelope = wrapped;
      if (typeof wrapped.result === "string") response.raw = wrapped.result;
    }
  } catch {
    // Fall through to raw stdout parsing.
  }
  return response;
}

function isContractFinding(finding) {
  return (
    finding !== null &&
    typeof finding === "object" &&
    SEVERITIES.has(finding.severity) &&
    typeof finding.file === "string" &&
    finding.file.length > 0 &&
    Number.isInteger(finding.line) &&
    finding.line > 0 &&
    typeof finding.issue === "string" &&
    typeof finding.recommendation === "string"
  );
}

function isContractSkillResult(skillResult) {
  return (
    skillResult !== null &&
    typeof skillResult === "object" &&
    typeof skillResult.skill === "string" &&
    skillResult.skill.length > 0 &&
    ["executed", "not_applicable", "unavailable", "failed"].includes(skillResult.status) &&
    typeof skillResult.evidence === "string"
  );
}

function isContractVerdict(value) {
  const allowedTopLevelKeys = new Set(["verdict", "findings", "resolutionSummary", "skillResults"]);
  return (
    value !== null &&
    typeof value === "object" &&
    VERDICTS.has(value.verdict) &&
    Array.isArray(value.findings) &&
    value.findings.every(isContractFinding) &&
    typeof value.resolutionSummary === "string" &&
    Object.keys(value).every((key) => allowedTopLevelKeys.has(key)) &&
    (value.skillResults === undefined ||
      (Array.isArray(value.skillResults) && value.skillResults.every(isContractSkillResult)))
  );
}

function findVerdictJson(text) {
  for (const candidate of findJsonObjects(text).reverse()) {
    try {
      const parsed = JSON.parse(candidate);
      if (isContractVerdict(parsed)) return parsed;
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
    prompt_hash: sha256(prompt),
    contract_char_count: typeof contract === "string" ? contract.length : 0,
    materials_char_count: typeof materials === "string" ? materials.length : 0,
    contract_hash: sha256(contract),
    materials_hash: sha256(materials),
    supplementary_prompt_present: supplementaryPrompt !== null,
    supplementary_prompt_hash: supplementaryPrompt === null ? null : sha256(supplementaryPrompt),
  };
}

function diagnosticText(value) {
  const text = String(value ?? "");
  return {
    sha256: sha256(text),
    char_count: text.length,
    preview: text.slice(0, DIAGNOSTIC_PREVIEW_CHARS),
    truncated: text.length > DIAGNOSTIC_PREVIEW_CHARS,
  };
}

function diagnosticError(error) {
  if (!error) return null;
  return {
    code: typeof error.code === "string" ? error.code : null,
    message: typeof error.message === "string" ? error.message.slice(0, DIAGNOSTIC_PREVIEW_CHARS) : String(error).slice(0, DIAGNOSTIC_PREVIEW_CHARS),
  };
}

function envelopeValue(envelope, ...keys) {
  for (const key of keys) {
    if (typeof envelope?.[key] === "string" && envelope[key].length > 0) return envelope[key];
  }
  return null;
}

function attemptDiagnostic({ attempt, proc, response, cli, inputProvenance, outcome }) {
  return {
    attempt,
    outcome,
    exit_status: proc.status ?? null,
    signal: proc.signal ?? null,
    error: diagnosticError(proc.error),
    stdout: diagnosticText(proc.stdout),
    stderr: diagnosticText(proc.stderr),
    cli,
    prompt_hash: inputProvenance.prompt_hash,
    materials_hash: inputProvenance.materials_hash,
    session_id: envelopeValue(response?.envelope, "session_id", "sessionId"),
    stop_reason: envelopeValue(response?.envelope, "stop_reason", "stopReason"),
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

function failureRecord({ mode, reason, attempts, diagnostics, inputProvenance }) {
  return {
    verdict: "escalate_to_human",
    findings: [],
    resolutionSummary: `${reason}; attempts=${attempts ?? 1}; inspect claudeCodeDiagnostics for exit status and bounded output evidence.`,
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
    claudeCodeAttempts: attempts ?? diagnostics?.length ?? 0,
    claudeCodeDiagnostics: diagnostics ?? [],
    ...inputProvenance,
  };
}

function runClaude({ claudeBin, prompt, schema }) {
  const effort = process.env.CLAUDE_CODE_REVIEW_EFFORT || "low";
  // Claude Code's normal mode preserves the authenticated interactive/OAuth
  // execution path. Some non-interactive deployments explicitly require bare
  // mode; keep that opt-in so a Claude-only review cannot silently lose auth.
  const bareMode = process.env.CLAUDE_CODE_REVIEW_BARE === "true";
  const allowedDirs = (process.env.CLAUDE_CODE_REVIEW_ADD_DIRS || "")
    .split(":")
    .map((dir) => dir.trim())
    .filter(Boolean);
  return spawnSync(
    claudeBin,
    [
      "-p",
      ...(bareMode ? ["--bare"] : []),
      "--safe-mode",
      "--tools",
      "Read",
      ...allowedDirs.flatMap((dir) => ["--add-dir", dir]),
      "--effort",
      effort,
      "--output-format",
      "json",
      "--json-schema",
      JSON.stringify(schema),
      "--no-session-persistence",
    ],
    {
      input: prompt,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      maxBuffer: 30 * 1024 * 1024,
      timeout: Number(process.env.CLAUDE_CODE_REVIEW_TIMEOUT_MS || 300000),
    }
  );
}

function probeClaudeVersion(claudeBin) {
  const proc = spawnSync(claudeBin, ["--version"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 10000,
  });
  if (proc.status !== 0 || proc.signal || proc.error) return null;
  const version = String(proc.stdout ?? "").trim();
  return version.length > 0 ? version.slice(0, 512) : null;
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
    skillResults: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: true,
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

Host agent: ${process.env.WH_REVIEW_HOST_AGENT || "codex"}
Required provider: claude-code.

Use the REVIEW CONTRACT exactly.

Return only a JSON object with these exact top-level keys:
- "verdict": one of "pass", "revise_required", "escalate_to_human"
- "findings": an array
- "resolutionSummary": a string
- "skillResults": an optional array when the REVIEW CONTRACT requires skill execution; each item has "skill", "status", and concrete "evidence".

Do not return {"pass": true}. Do not return markdown. Do not omit "verdict".

If the caller binding says blind review, do not inspect final decision-log claims as direction evidence.
If the caller binding says detail review, apply intake-detail-review / 细节节 rules.
Use Read only for sources explicitly named in the supplied review package. Do not inspect unrelated files.

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
const configuredMaxInputChars = Number(process.env.CLAUDE_CODE_REVIEW_MAX_INPUT_CHARS || DEFAULT_MAX_INPUT_CHARS);
const maxInputChars = Number.isFinite(configuredMaxInputChars) && configuredMaxInputChars > 0
  ? Math.floor(configuredMaxInputChars)
  : DEFAULT_MAX_INPUT_CHARS;
const cli = { bin: claudeBin, version: probeClaudeVersion(claudeBin) };
const diagnostics = [];
let output;
const maxAttempts = Math.max(1, Number(process.env.CLAUDE_CODE_REVIEW_ATTEMPTS || 3));
let lastFailure = null;
if (prompt.length > maxInputChars) {
  lastFailure = { mode, reason: "claude-code-input-too-large", attempts: 0 };
} else for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  const proc = runClaude({ claudeBin, prompt, schema });
  const response = parseClaudeResponse(proc.stdout || "");
  if (proc.signal || proc.error?.code === "ETIMEDOUT") {
    diagnostics.push(attemptDiagnostic({ attempt, proc, response, cli, inputProvenance, outcome: "timeout" }));
    lastFailure = { mode, reason: "claude-code-timeout", attempts: attempt };
    break;
  }
  if (proc.status !== 0) {
    diagnostics.push(attemptDiagnostic({ attempt, proc, response, cli, inputProvenance, outcome: "non-zero-exit" }));
    lastFailure = { mode, reason: "claude-code-non-zero-exit", attempts: attempt };
    break;
  }

  const raw = response.raw;
  const verdict = normalizeVerdict(findVerdictJson(raw), mode);
  if (verdict) {
    diagnostics.push(attemptDiagnostic({ attempt, proc, response, cli, inputProvenance, outcome: "valid-contract-verdict" }));
    output = {
      ...verdict,
      ...inputProvenance,
      claudeCodeAttempts: attempt,
      claudeCodeDiagnostics: diagnostics,
    };
    break;
  }

  const reason = raw.trim().length === 0 ? "claude-code-empty-output" : "claude-code-output-unparseable";
  diagnostics.push(attemptDiagnostic({ attempt, proc, response, cli, inputProvenance, outcome: reason }));
  lastFailure = {
    mode,
    reason,
    attempts: attempt,
  };
}

if (!output) {
  output = {
    ...failureRecord({
      ...(lastFailure ?? { mode, reason: "claude-code-output-unparseable", attempts: maxAttempts }),
      diagnostics,
      inputProvenance,
    }),
    claudeCodePayloadLimit: { prompt_char_count: prompt.length, max_input_chars: maxInputChars },
  };
}

writeFileSync(outputFile, JSON.stringify(output, null, 2));
process.exit(0);
