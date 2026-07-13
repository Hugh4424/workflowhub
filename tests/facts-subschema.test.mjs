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
import { execSync } from "node:child_process";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
        flow_profile: "full_vibecoding",
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
    const artifact = { ...base(), facts: { scope: "full rewrite", flow_profile: "full_vibecoding" } };
    const result = validateStageResult("make-decision", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/decision/);
  });

  it("negative: missing 'scope' key → fails", () => {
    const artifact = { ...base(), facts: { decision: "proceed", flow_profile: "full_vibecoding" } };
    const result = validateStageResult("make-decision", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/scope/);
  });

  it("negative: 'decision' present but empty string → fails", () => {
    const artifact = { ...base(), facts: { decision: "", scope: "something", flow_profile: "full_vibecoding" } };
    const result = validateStageResult("make-decision", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/decision/);
  });

  it("negative: 'scope' present but empty string → fails", () => {
    const artifact = { ...base(), facts: { decision: "go", scope: "", flow_profile: "full_vibecoding" } };
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
        flow_profile: "full_vibecoding",
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
        flow_profile: "fast_make_decision_to_code",
      },
    };
    const result = validateStageResult("make-decision", artifact);
    expect(result.ok, result.errors?.join("; ")).toBe(true);
  });

  it("negative: missing 'decision_log_path' key → fails", () => {
    // Literal: only decision + scope, decision_log_path key absent
    const artifact = {
      ...base(),
      facts: { decision: "ship now", scope: "backend only", flow_profile: "full_vibecoding" },
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
        flow_profile: "full_vibecoding",
      },
    };
    const result = validateStageResult("make-decision", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/decision_log_path/);
  });

  // ── flow_profile (FR-FLOWPROFILE-001) ──

  it("positive: flow_profile in facts → ok", () => {
    const artifact = {
      ...base(),
      facts: {
        decision: "ship now",
        scope: "backend only",
        decision_log_path: "tasks/m7-intake-v1/decision-log.md",
        flow_profile: "full_vibecoding",
      },
    };
    const result = validateStageResult("make-decision", artifact);
    expect(result.ok, result.errors?.join("; ")).toBe(true);
  });

  it("negative: missing 'flow_profile' key → fails", () => {
    const artifact = {
      ...base(),
      facts: {
        decision: "ship now",
        scope: "backend only",
        decision_log_path: "tasks/m7-intake-v1/decision-log.md",
      },
    };
    const result = validateStageResult("make-decision", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/flow_profile/);
  });

  it("negative: 'flow_profile' present but empty string → fails", () => {
    const artifact = {
      ...base(),
      facts: {
        decision: "ship now",
        scope: "backend only",
        decision_log_path: "tasks/m7-intake-v1/decision-log.md",
        flow_profile: "",
      },
    };
    const result = validateStageResult("make-decision", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/flow_profile/);
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
  function buildCodeFacts(overrides = {}) {
    return {
      changed: ["f.ts"],
      tests: "ok",
      review: { core_receipt_hash: "a".repeat(64), semantic_verdict: "pass", needs_human: false },
      worktree_root: "/repo/workflowhub-task",
      task_tracking_root: "/repo/tasks",
      phase_completion: {
        commit_records: [],
        no_change_records: [{ phase_id: "phase-1", no_change_reason: "no file changes" }],
      },
      ...overrides,
    };
  }

  function sh(cmd, cwd) {
    return execSync(cmd, { cwd, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
  }

  function withGitFixture(callback) {
    const root = mkdtempSync(join(tmpdir(), "stage-result-build-code-"));
    const repo = join(root, "repo");
    try {
      mkdirSync(repo, { recursive: true });
      sh("git init", repo);
      sh('git config user.email "stage-result@example.invalid"', repo);
      sh('git config user.name "Stage Result Test"', repo);
      writeFileSync(join(repo, "README.md"), "# fixture\n", "utf8");
      sh("git add README.md", repo);
      sh('git commit -m "init"', repo);
      return callback(repo);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }

  function commitFile(repo, relativePath, content, message) {
    const path = join(repo, relativePath);
    mkdirSync(join(path, ".."), { recursive: true });
    writeFileSync(path, content, "utf8");
    sh(`git add ${relativePath}`, repo);
    sh(`git commit -m "${message}"`, repo);
    return sh("git rev-parse HEAD", repo).trim();
  }

  it("positive: changed + tests + handoff roots non-empty -> ok", () => {
    const artifact = {
      ...base(),
      facts: buildCodeFacts({
        changed: ["src/foo.ts", "src/bar.ts"],
        tests: "12 passed, 0 failed",
      }),
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
    const artifact = {
      ...base(),
      facts: buildCodeFacts({ changed: undefined, tests: "5 passed" }),
    };
    delete artifact.facts.changed;
    const result = validateStageResult("build-code", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/changed/);
  });

  it("negative: missing 'tests' → fails", () => {
    const artifact = {
      ...base(),
      facts: buildCodeFacts({ changed: ["file.ts"], tests: undefined }),
    };
    delete artifact.facts.tests;
    const result = validateStageResult("build-code", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/tests/);
  });

  it("negative: 'changed' empty array → fails", () => {
    const artifact = {
      ...base(),
      facts: buildCodeFacts({ changed: [] }),
    };
    const result = validateStageResult("build-code", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/changed/);
  });

  it("negative: 'changed' empty string → fails", () => {
    const artifact = {
      ...base(),
      facts: buildCodeFacts({ changed: "" }),
    };
    const result = validateStageResult("build-code", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/changed/);
  });

  it("negative: 'tests' empty string → fails", () => {
    const artifact = {
      ...base(),
      facts: buildCodeFacts({ tests: "" }),
    };
    const result = validateStageResult("build-code", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/tests/);
  });

  it("negative: missing 'worktree_root' -> fails", () => {
    const artifact = {
      ...base(),
      facts: buildCodeFacts({ worktree_root: undefined }),
    };
    delete artifact.facts.worktree_root;
    const result = validateStageResult("build-code", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/worktree_root/);
  });

  it("negative: missing 'task_tracking_root' -> fails", () => {
    const artifact = {
      ...base(),
      facts: buildCodeFacts({ task_tracking_root: undefined }),
    };
    delete artifact.facts.task_tracking_root;
    const result = validateStageResult("build-code", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/task_tracking_root/);
  });

  it("negative: missing 'phase_completion' -> fails", () => {
    const artifact = {
      ...base(),
      facts: buildCodeFacts({ phase_completion: undefined }),
    };
    delete artifact.facts.phase_completion;
    const result = validateStageResult("build-code", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/phase_completion/);
  });

  it("negative: relative handoff roots -> fails", () => {
    const artifact = {
      ...base(),
      facts: buildCodeFacts({
        worktree_root: ".",
        task_tracking_root: "tasks",
      }),
    };
    const result = validateStageResult("build-code", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/worktree_root/);
    expect(result.errors.join(" ")).toMatch(/task_tracking_root/);
  });

  it("negative: non-string handoff roots -> fails", () => {
    const artifact = {
      ...base(),
      facts: buildCodeFacts({
        worktree_root: 123,
        task_tracking_root: true,
      }),
    };
    const result = validateStageResult("build-code", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/worktree_root/);
    expect(result.errors.join(" ")).toMatch(/task_tracking_root/);
  });

  it("negative: missing 'review' -> fails", () => {
    const artifact = { ...base(), facts: buildCodeFacts({ review: undefined }) };
    delete artifact.facts.review;
    const result = validateStageResult("build-code", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/review/);
  });

  it("negative: review without the published decision tuple -> fails", () => {
    const artifact = { ...base(), facts: buildCodeFacts({ review: { verdict: "pass" } }) };
    const result = validateStageResult("build-code", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/core_receipt_hash|semantic_verdict|needs_human/);
  });

  it("negative: review scalar -> fails", () => {
    const artifact = { ...base(), facts: buildCodeFacts({ review: "pass" }) };
    const result = validateStageResult("build-code", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/review.*object/);
  });

  it("negative: review array -> fails", () => {
    const artifact = { ...base(), facts: buildCodeFacts({ review: [] }) };
    const result = validateStageResult("build-code", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/review.*object/);
  });

  it("negative: review number -> fails", () => {
    const artifact = { ...base(), facts: buildCodeFacts({ review: 1 }) };
    const result = validateStageResult("build-code", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/review.*object/);
  });

  it("negative: raw review artifact references are rejected", () => {
    const artifact = {
      ...base(),
      facts: buildCodeFacts({ review: { verdict: "pass", artifact_path: "reviews/build-code-phase-1.md" } }),
    };
    const result = validateStageResult("build-code", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/core_receipt_hash|semantic_verdict|needs_human/);
  });

  it("accepts only the published core receipt decision tuple, not a raw review artifact path", () => {
    const artifact = {
      ...base(),
      facts: buildCodeFacts({ review: { core_receipt_hash: "a".repeat(64), semantic_verdict: "pass", needs_human: false } }),
    };
    expect(validateStageResult("build-code", artifact).ok).toBe(true);
    const raw = { ...artifact, facts: { ...artifact.facts, review: { artifact_path: "reviews/private/raw.json", verdict: "pass" } } };
    expect(validateStageResult("build-code", raw).errors.join(" ")).toMatch(/core_receipt_hash|semantic_verdict|needs_human/);
  });

  it("negative: phase_completion must include at least one commit or no-change record -> fails", () => {
    const artifact = {
      ...base(),
      facts: buildCodeFacts({
        phase_completion: { commit_records: [], no_change_records: [] },
      }),
    };
    const result = validateStageResult("build-code", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/phase_completion/);
  });

  it("negative: commit_records require phase_id and 40-hex commit_sha -> fails", () => {
    const artifact = {
      ...base(),
      facts: buildCodeFacts({
        phase_completion: {
          commit_records: [{ phase_id: "phase-1", commit_sha: "not-a-sha" }],
          no_change_records: [],
        },
      }),
    };
    const result = validateStageResult("build-code", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/commit_records/);
  });

  it("positive: no-change phase completion records are accepted", () => {
    const artifact = {
      ...base(),
      facts: buildCodeFacts({
        phase_completion: {
          commit_records: [],
          no_change_records: [{ phase_id: "phase-docs", no_change_reason: "documentation-only verification phase" }],
        },
      }),
    };
    const result = validateStageResult("build-code", artifact);
    expect(result.ok, result.errors?.join("; ")).toBe(true);
  });

  it("positive: commit_records are accepted only when they match worktree HEAD implementation commit", () => {
    withGitFixture((repo) => {
      const commitSha = commitFile(repo, "src/implementation.txt", "phase work\n", "phase implementation");
      const artifact = {
        ...base(),
        facts: buildCodeFacts({
          worktree_root: repo,
          task_tracking_root: join(repo, "tasks"),
          phase_completion: {
            commit_records: [{ phase_id: "phase-1", commit_sha: commitSha }],
            no_change_records: [],
          },
        }),
      };
      const result = validateStageResult("build-code", artifact);
      expect(result.ok, result.errors?.join("; ")).toBe(true);
    });
  });

  it("positive: multi-phase commit_records accept earlier implementation commits before final HEAD", () => {
    withGitFixture((repo) => {
      const phaseOneCommit = commitFile(repo, "src/phase-one.txt", "phase one\n", "phase one implementation");
      const phaseTwoCommit = commitFile(repo, "src/phase-two.txt", "phase two\n", "phase two implementation");
      const artifact = {
        ...base(),
        facts: buildCodeFacts({
          worktree_root: repo,
          task_tracking_root: join(repo, "tasks"),
          phase_completion: {
            commit_records: [
              { phase_id: "phase-1", commit_sha: phaseOneCommit },
              { phase_id: "phase-2", commit_sha: phaseTwoCommit },
            ],
            no_change_records: [],
          },
        }),
      };
      const result = validateStageResult("build-code", artifact);
      expect(result.ok, result.errors?.join("; ")).toBe(true);
    });
  });

  it("negative: commit_records fail when implementation commit is behind HEAD", () => {
    withGitFixture((repo) => {
      const implementationCommit = commitFile(repo, "src/implementation.txt", "phase work\n", "phase implementation");
      commitFile(repo, "phase-result.json", "{}\n", "tracking artifact");
      const artifact = {
        ...base(),
        facts: buildCodeFacts({
          worktree_root: repo,
          task_tracking_root: join(repo, "tasks"),
          phase_completion: {
            commit_records: [{ phase_id: "phase-1", commit_sha: implementationCommit }],
            no_change_records: [],
          },
        }),
      };
      const result = validateStageResult("build-code", artifact);
      expect(result.ok).toBe(false);
      expect(result.errors.join(" ")).toMatch(/final implementation commit.*must match worktree HEAD/);
    });
  });

  it("negative: commit_records fail when HEAD only changes tracking artifacts", () => {
    withGitFixture((repo) => {
      const trackingCommit = commitFile(repo, "phase-result.json", "{}\n", "tracking artifact");
      const artifact = {
        ...base(),
        facts: buildCodeFacts({
          worktree_root: repo,
          task_tracking_root: join(repo, "tasks"),
          phase_completion: {
            commit_records: [{ phase_id: "phase-1", commit_sha: trackingCommit }],
            no_change_records: [],
          },
        }),
      };
      const result = validateStageResult("build-code", artifact);
      expect(result.ok).toBe(false);
      expect(result.errors.join(" ")).toMatch(/non-tracking implementation\/test file/);
    });
  });
});

// ── verify-code ───────────────────────────────────────────────────────────────

describe("verify-code facts sub-schema (FR-CONTRACT-002 D11)", () => {
  it("positive: verdict + evidence_ref non-empty → ok", () => {
    const artifact = {
      ...base(),
      facts: {
        verdict: "pass",
        evidence_ref: "evidence/verify-code-2026-06-24.json",
        audit_summary_ref: "evidence/audit-summary.json",
        audit_verdict: "pass",
        audit_summary_hash: "a".repeat(64),
      },
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

  it("rejects a consumer verdict when its canonical summary reference, hash, and verdict are absent", () => {
    const artifact = {
      ...base(),
      facts: { verdict: "pass", evidence_ref: "evidence/verify-code-2026-06-24.json" },
    };
    const result = validateStageResult("verify-code", artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/audit_summary_ref|audit_verdict|audit_summary_hash/);
  });

  it("accepts a consumer that exposes the canonical aggregator verdict and hash unchanged", () => {
    const artifact = {
      ...base(),
      facts: {
        verdict: "pass",
        evidence_ref: "evidence/verify-code-2026-06-24.json",
        audit_summary_ref: "evidence/audit-summary.json",
        audit_verdict: "pass",
        audit_summary_hash: "a".repeat(64),
      },
    };
    const result = validateStageResult("verify-code", artifact);
    expect(result.ok, result.errors?.join("; ")).toBe(true);
  });

  it.each(["revise_required", "escalate_to_human"])(
    "rejects non-canonical audit_verdict %s",
    (audit_verdict) => {
      const artifact = {
        ...base(),
        facts: {
          verdict: "pass",
          evidence_ref: "evidence/verify-code-2026-06-24.json",
          audit_summary_ref: "evidence/audit-summary.json",
          audit_verdict,
          audit_summary_hash: "a".repeat(64),
        },
      };
      const result = validateStageResult("verify-code", artifact);
      expect(result.ok).toBe(false);
      expect(result.errors.join(" ")).toMatch(/audit_verdict/);
    },
  );

  it.each(["pass", "fail"])("accepts canonical audit_verdict %s", (audit_verdict) => {
    const artifact = {
      ...base(),
      facts: {
        verdict: "pass",
        evidence_ref: "evidence/verify-code-2026-06-24.json",
        audit_summary_ref: "evidence/audit-summary.json",
        audit_verdict,
        audit_summary_hash: "a".repeat(64),
      },
    };
    const result = validateStageResult("verify-code", artifact);
    expect(result.ok, result.errors?.join("; ")).toBe(true);
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
