/**
 * facts-subschema.test.mjs — M6 Phase 2 (FR-CONTRACT-002 / D11).
 *
 * Validates that validateStageResult enforces per-stage facts sub-schema:
 *   - positive: agreed keys present and non-empty → passes
 *   - negative: facts={} → fails; missing key → fails; empty value → fails
 *
 * Five stages: make-decision, build-spec, build-plan, build-code, verify-code.
 * All five stages covered with falsifiable assertions.
 */

import { describe, it, expect } from "vitest";
import { validateStageResult } from "../scripts/validate-stage-result.mjs";

// Base valid stage-result that satisfies the top-level stage-result.contract.json
function base() {
  return {
    status: "success",
    error_code: "",
    retryable: false,
    facts: {},
    missing_items: [],
    user_decision: false,
    reason: "stage completed normally",
  };
}

// ── make-decision ─────────────────────────────────────────────────────────────

describe("make-decision facts sub-schema (FR-CONTRACT-002 D11)", () => {
  it("positive: decision + scope + decision_log_path non-empty → ok", () => {
    const artifact = {
      ...base(),
      facts: {
        decision: "ship now",
        scope: "backend only",
        decision_log_path: "tasks/m7-intake-v1/decision-log.md",
      },
    };
    const result = validateStageResult("make-decision", artifact);
    expect(result.ok, result.errors?.join("; ")).toBe(true);
  });

  it("negative: facts={} → fails (empty object false-green prevention)", () => {
    const artifact = { ...base(), facts: {} };
    const result = validateStageResult("make-decision", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("negative: missing 'decision' key → fails", () => {
    // Only scope present — decision is missing (literal, so removing decision key makes this red)
    const artifact = { ...base(), facts: { scope: "full rewrite" } };
    const result = validateStageResult("make-decision", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/decision/);
  });

  it("negative: missing 'scope' key → fails", () => {
    const artifact = { ...base(), facts: { decision: "proceed" } };
    const result = validateStageResult("make-decision", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/scope/);
  });

  it("negative: 'decision' present but empty string → fails", () => {
    const artifact = { ...base(), facts: { decision: "", scope: "something" } };
    const result = validateStageResult("make-decision", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/decision/);
  });

  it("negative: 'scope' present but empty string → fails", () => {
    const artifact = { ...base(), facts: { decision: "go", scope: "" } };
    const result = validateStageResult("make-decision", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/scope/);
  });

  it("positive: extra keys in facts are allowed (additionalProperties)", () => {
    const artifact = {
      ...base(),
      facts: {
        decision: "go",
        scope: "minimal",
        decision_log_path: "tasks/t1/decision-log.md",
        extra_note: "fyi",
      },
    };
    const result = validateStageResult("make-decision", artifact);
    expect(result.ok, result.errors?.join("; ")).toBe(true);
  });

  it("positive: decision + scope + decision_log_path all non-empty → ok", () => {
    const artifact = {
      ...base(),
      facts: {
        decision: "ship now",
        scope: "backend only",
        decision_log_path: "tasks/m7-intake-v1/decision-log.md",
      },
    };
    const result = validateStageResult("make-decision", artifact);
    expect(result.ok, result.errors?.join("; ")).toBe(true);
  });

  it("negative: missing 'decision_log_path' key → fails", () => {
    // Literal: only decision + scope, decision_log_path key absent
    const artifact = {
      ...base(),
      facts: { decision: "ship now", scope: "backend only" },
    };
    const result = validateStageResult("make-decision", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/decision_log_path/);
  });

  it("negative: 'decision_log_path' present but empty string → fails", () => {
    const artifact = {
      ...base(),
      facts: {
        decision: "ship now",
        scope: "backend only",
        decision_log_path: "",
      },
    };
    const result = validateStageResult("make-decision", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/decision_log_path/);
  });
});

// ── build-spec ────────────────────────────────────────────────────────────────

describe("build-spec facts sub-schema (FR-CONTRACT-002 D11)", () => {
  it("positive: spec_ref + requirements non-empty → ok", () => {
    const artifact = {
      ...base(),
      facts: { spec_ref: "specs/my-feature.md", requirements: "12 requirements" },
    };
    const result = validateStageResult("build-spec", artifact);
    expect(result.ok, result.errors?.join("; ")).toBe(true);
  });

  it("negative: facts={} → fails", () => {
    const artifact = { ...base(), facts: {} };
    const result = validateStageResult("build-spec", artifact);
    expect(result.ok).toBe(false);
  });

  it("negative: missing 'spec_ref' → fails", () => {
    const artifact = { ...base(), facts: { requirements: "3 items" } };
    const result = validateStageResult("build-spec", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/spec_ref/);
  });

  it("negative: missing 'requirements' → fails", () => {
    const artifact = { ...base(), facts: { spec_ref: "specs/foo.md" } };
    const result = validateStageResult("build-spec", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/requirements/);
  });

  it("negative: 'spec_ref' empty string → fails", () => {
    const artifact = { ...base(), facts: { spec_ref: "", requirements: "some" } };
    const result = validateStageResult("build-spec", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/spec_ref/);
  });

  it("negative: 'requirements' empty string → fails", () => {
    const artifact = { ...base(), facts: { spec_ref: "specs/f.md", requirements: "" } };
    const result = validateStageResult("build-spec", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/requirements/);
  });
});

// ── build-plan ────────────────────────────────────────────────────────────────

describe("build-plan facts sub-schema (FR-CONTRACT-002 D11)", () => {
  it("positive: plan_ref + tasks non-empty → ok", () => {
    const artifact = {
      ...base(),
      facts: { plan_ref: "plans/feature-plan.md", tasks: "4 tasks" },
    };
    const result = validateStageResult("build-plan", artifact);
    expect(result.ok, result.errors?.join("; ")).toBe(true);
  });

  it("negative: facts={} → fails", () => {
    const artifact = { ...base(), facts: {} };
    const result = validateStageResult("build-plan", artifact);
    expect(result.ok).toBe(false);
  });

  it("negative: missing 'plan_ref' → fails", () => {
    const artifact = { ...base(), facts: { tasks: "2 tasks" } };
    const result = validateStageResult("build-plan", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/plan_ref/);
  });

  it("negative: missing 'tasks' → fails", () => {
    const artifact = { ...base(), facts: { plan_ref: "plans/foo.md" } };
    const result = validateStageResult("build-plan", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/tasks/);
  });

  it("negative: 'plan_ref' empty string → fails", () => {
    const artifact = { ...base(), facts: { plan_ref: "", tasks: "some" } };
    const result = validateStageResult("build-plan", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/plan_ref/);
  });

  it("negative: 'tasks' empty string → fails", () => {
    const artifact = { ...base(), facts: { plan_ref: "plans/p.md", tasks: "" } };
    const result = validateStageResult("build-plan", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/tasks/);
  });
});

// ── build-code ────────────────────────────────────────────────────────────────

describe("build-code facts sub-schema (FR-CONTRACT-002 D11)", () => {
  it("positive: changed + tests non-empty → ok", () => {
    const artifact = {
      ...base(),
      facts: { changed: ["src/foo.ts", "src/bar.ts"], tests: "12 passed, 0 failed" },
    };
    const result = validateStageResult("build-code", artifact);
    expect(result.ok, result.errors?.join("; ")).toBe(true);
  });

  it("negative: facts={} → fails", () => {
    const artifact = { ...base(), facts: {} };
    const result = validateStageResult("build-code", artifact);
    expect(result.ok).toBe(false);
  });

  it("negative: missing 'changed' → fails", () => {
    const artifact = { ...base(), facts: { tests: "5 passed" } };
    const result = validateStageResult("build-code", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/changed/);
  });

  it("negative: missing 'tests' → fails", () => {
    const artifact = { ...base(), facts: { changed: ["file.ts"] } };
    const result = validateStageResult("build-code", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/tests/);
  });

  it("negative: 'changed' empty array → fails", () => {
    const artifact = { ...base(), facts: { changed: [], tests: "ok" } };
    const result = validateStageResult("build-code", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/changed/);
  });

  it("negative: 'changed' empty string → fails", () => {
    const artifact = { ...base(), facts: { changed: "", tests: "ok" } };
    const result = validateStageResult("build-code", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/changed/);
  });

  it("negative: 'tests' empty string → fails", () => {
    const artifact = { ...base(), facts: { changed: ["f.ts"], tests: "" } };
    const result = validateStageResult("build-code", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/tests/);
  });
});

// ── verify-code ───────────────────────────────────────────────────────────────

describe("verify-code facts sub-schema (FR-CONTRACT-002 D11)", () => {
  it("positive: verdict + evidence_ref non-empty → ok", () => {
    const artifact = {
      ...base(),
      facts: { verdict: "pass", evidence_ref: "evidence/verify-code-2026-06-24.json" },
    };
    const result = validateStageResult("verify-code", artifact);
    expect(result.ok, result.errors?.join("; ")).toBe(true);
  });

  it("negative: facts={} → fails", () => {
    const artifact = { ...base(), facts: {} };
    const result = validateStageResult("verify-code", artifact);
    expect(result.ok).toBe(false);
  });

  it("negative: missing 'verdict' → fails", () => {
    const artifact = {
      ...base(),
      facts: { evidence_ref: "evidence/foo.json" },
    };
    const result = validateStageResult("verify-code", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/verdict/);
  });

  it("negative: missing 'evidence_ref' → fails", () => {
    const artifact = { ...base(), facts: { verdict: "pass" } };
    const result = validateStageResult("verify-code", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/evidence_ref/);
  });

  it("negative: 'verdict' empty string → fails", () => {
    const artifact = {
      ...base(),
      facts: { verdict: "", evidence_ref: "evidence/e.json" },
    };
    const result = validateStageResult("verify-code", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/verdict/);
  });

  it("negative: 'evidence_ref' empty string → fails", () => {
    const artifact = {
      ...base(),
      facts: { verdict: "pass", evidence_ref: "" },
    };
    const result = validateStageResult("verify-code", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/evidence_ref/);
  });
});

// ── Cross-cutting: top-level contract validation before facts sub-schema ──────

describe("top-level stage-result contract validated first", () => {
  it("artifact missing 'status' field fails even with correct facts", () => {
    const artifact = {
      // status missing
      error_code: "",
      retryable: false,
      facts: { decision: "go", scope: "all" },
      missing_items: [],
      user_decision: false,
      reason: "ok",
    };
    const result = validateStageResult("make-decision", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/status/);
  });

  it("unknown stage name returns error", () => {
    const artifact = { ...base(), facts: { decision: "go", scope: "x" } };
    const result = validateStageResult("unknown-stage", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/unknown/i);
  });
});
