// m13d-build-code-deepening Phase 3 verification tests (T009 + T010).
// Asserts build-code SKILL.md field naming aligns with data-contracts.md and that
// the evidence five-piece set under the task dir carries the required fields and
// legal enum values.
import { describe, it } from "vitest";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

import { parseTaskDir } from "../core/task-dir-parser.mjs";

const REPO_ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const SKILL_PATH = join(REPO_ROOT, "workflows", "build-code", "SKILL.md");
const CONTRACTS_PATH = join(REPO_ROOT, "specs", "m13d-build-code-deepening", "data-contracts.md");

const TASK_DIR = parseTaskDir();
const EVIDENCE_DIR = join(TASK_DIR, "m13d-build-code-deepening", "evidence");

const RISK_LEVELS = new Set(["P0", "P1", "P2", "P3"]);
const ROUTING_TIERS = new Set(["simple", "feature", "fullstack"]);
const L2_RESULTS = new Set(["pass", "fail"]);
const VERDICTS = new Set(["pass", "revise_required"]);

function readText(path) {
  return readFileSync(path, "utf8");
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function evidenceFiles() {
  if (!existsSync(EVIDENCE_DIR)) return [];
  return readdirSync(EVIDENCE_DIR).map((name) => join(EVIDENCE_DIR, name));
}

function parseFrontmatterLike(text) {
  const map = new Map();
  // Match lines like "key: value" outside code blocks; tolerate YAML frontmatter fences.
  for (const line of text.split("\n")) {
    const m = line.match(/^([^#\s][^:]*?)\s*:\s*(.+)$/);
    if (m) {
      map.set(m[1].trim(), m[2].trim());
    }
  }
  return map;
}

// ─── T009: document/field naming consistency ────────────────────────────────

describe("T009: build-code SKILL.md aligns with data-contracts.md field naming", () => {
  const skill = readText(SKILL_PATH);
  const contracts = readText(CONTRACTS_PATH);

  it("names all five evidence artifacts from the data contract", () => {
    const artifacts = [
      "phase-N-RED.json",
      "phase-N-GREEN.json",
      "l2-integration-test-report.json",
      "spec-compliance-verdict.md",
      "code-quality-verdict.md",
    ];
    for (const name of artifacts) {
      assert.ok(
        skill.includes(name),
        `workflows/build-code/SKILL.md must reference evidence artifact "${name}"`
      );
    }
  });

  it("uses the exact evidence field names declared in data-contracts.md", () => {
    const fields = [
      "routing_tier",
      "routing_rationale",
      "result",
      "risk_level",
      "commit_sha",
      "base_sha",
      "head_sha",
      "verdict",
      "findings",
    ];
    for (const f of fields) {
      assert.ok(
        skill.includes(f),
        `workflows/build-code/SKILL.md must reference field "${f}"`
      );
    }
  });

  it("data-contracts.md declares the l2 report fields including routing_rationale", () => {
    // Locate the l2 row in the evidence table and assert the three fields + rationale.
    const l2Line = contracts
      .split("\n")
      .find((l) => l.includes("l2-integration-test-report.json"));
    assert.ok(l2Line, "data-contracts.md must mention l2-integration-test-report.json");
    assert.ok(l2Line.includes("routing_tier"), "l2 row must include routing_tier");
    assert.ok(l2Line.includes("routing_rationale"), "l2 row must include routing_rationale");
    assert.ok(l2Line.includes("result"), "l2 row must include result");
  });

  it("does not use banned aliases for rework_proxy_count", () => {
    // If the exact metric name is ever used, standalone aliases must not appear.
    const aliases = ["rework_proxy", "proxy_count", "rework_count"];
    for (const alias of aliases) {
      const re = new RegExp(`\\b${alias}\\b`, "g");
      const count = (skill.match(re) || []).length;
      assert.strictEqual(
        count,
        0,
        `SKILL.md must not use alias "${alias}" for rework_proxy_count`
      );
    }
  });
});

// ─── T010: evidence five-piece set field existence + enum validity ───────────

describe("T010(a): phase-N-RED.json risk_level exists and is legal when present", () => {
  const reds = evidenceFiles().filter((p) => /^phase-\d+-RED\.json$/.test(basename(p)));

  it("discovers at least one phase-N-RED.json evidence file", () => {
    assert.ok(reds.length > 0, `no phase-N-RED.json files found in ${EVIDENCE_DIR}`);
  });

  it("current phase-3-RED.json contains the risk_level field", () => {
    const path = join(EVIDENCE_DIR, "phase-3-RED.json");
    assert.ok(existsSync(path), `missing ${path}`);
    const data = readJson(path);
    assert.ok(
      Object.prototype.hasOwnProperty.call(data, "risk_level"),
      "phase-3-RED.json must contain field \"risk_level\""
    );
  });

  for (const path of reds) {
    it(`${basename(path)} has a legal risk_level value when the field is present`, () => {
      const data = readJson(path);
      if (Object.prototype.hasOwnProperty.call(data, "risk_level") && data.risk_level != null) {
        assert.ok(
          RISK_LEVELS.has(data.risk_level),
          `${basename(path)}.risk_level must be one of P0/P1/P2/P3, got ${data.risk_level}`
        );
      }
    });
  }
});

describe("T010(b): phase-N-GREEN.json carries risk_level + commit/base/head sha", () => {
  const greens = evidenceFiles().filter((p) => /^phase-\d+-GREEN\.json$/.test(basename(p)));

  it("discovers at least one phase-N-GREEN.json evidence file", () => {
    assert.ok(greens.length > 0, `no phase-N-GREEN.json files found in ${EVIDENCE_DIR}`);
  });

  for (const path of greens) {
    it(`${basename(path)} contains risk_level, commit_sha, base_sha, head_sha`, () => {
      const data = readJson(path);
      for (const field of ["risk_level", "commit_sha", "base_sha", "head_sha"]) {
        assert.ok(
          Object.prototype.hasOwnProperty.call(data, field),
          `${basename(path)} must contain field "${field}"`
        );
      }
      if (data.risk_level != null) {
        assert.ok(
          RISK_LEVELS.has(data.risk_level),
          `${basename(path)}.risk_level must be one of P0/P1/P2/P3, got ${data.risk_level}`
        );
      }
    });
  }
});

describe("T010(c): l2-integration-test-report.json fields and enums", () => {
  const path = join(EVIDENCE_DIR, "l2-integration-test-report.json");

  it("file exists", () => {
    assert.ok(existsSync(path), `missing ${path}`);
  });

  it("has legal routing_tier, non-empty routing_rationale, and legal result", () => {
    const data = readJson(path);
    assert.ok(
      ROUTING_TIERS.has(data.routing_tier),
      `routing_tier must be one of simple/feature/fullstack, got ${data.routing_tier}`
    );
    assert.ok(
      typeof data.routing_rationale === "string" && data.routing_rationale.trim().length > 0,
      "routing_rationale must be a non-empty string"
    );
    assert.ok(
      L2_RESULTS.has(data.result),
      `result must be one of pass/fail, got ${data.result}`
    );
    assert.ok(
      typeof data.ts === "string" && data.ts.length > 0,
      "ts must be a non-empty ISO-8601 timestamp string"
    );
  });
});

describe("T010(d): spec-compliance-verdict.md verdict and findings", () => {
  const path = join(EVIDENCE_DIR, "spec-compliance-verdict.md");

  it("file exists", () => {
    assert.ok(existsSync(path), `missing ${path}`);
  });

  it("contains a legal verdict and a findings field", () => {
    const text = readText(path);
    const front = parseFrontmatterLike(text);
    assert.ok(front.has("verdict"), "spec-compliance-verdict.md must declare a verdict");
    assert.ok(
      VERDICTS.has(front.get("verdict")),
      `verdict must be pass/revise_required, got ${front.get("verdict")}`
    );
    assert.ok(front.has("findings"), "spec-compliance-verdict.md must declare findings");
  });
});

describe("T010(e): code-quality-verdict.md verdict and findings", () => {
  const path = join(EVIDENCE_DIR, "code-quality-verdict.md");

  it("file exists", () => {
    assert.ok(existsSync(path), `missing ${path}`);
  });

  it("contains a legal verdict and a findings field", () => {
    const text = readText(path);
    const front = parseFrontmatterLike(text);
    assert.ok(front.has("verdict"), "code-quality-verdict.md must declare a verdict");
    assert.ok(
      VERDICTS.has(front.get("verdict")),
      `verdict must be pass/revise_required, got ${front.get("verdict")}`
    );
    assert.ok(front.has("findings"), "code-quality-verdict.md must declare findings");
  });
});
