import { afterEach, describe, expect, it } from "vitest";
import { lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import yaml from "js-yaml";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask } from "../../runtime/task/task-handle.mjs";

const root = process.cwd();
const read = (file) => readFileSync(join(root, file), "utf8");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const temporaryDirs = [];

const allowedFacts = new Set([
  "decision-log",
  "spec",
  "spec-research",
  "constitution",
  "referenced-repository-fact",
]);

function qualifiesFinding(finding) {
  return Boolean(
    finding
      && finding.current_snapshot === true
      && finding.id
      && finding.disposition === "actionable"
      && ["major", "blocking"].includes(finding.severity)
      && ["direct", "corroborated_inference"].includes(finding.evidence_status)
      && finding.finding_disposition?.finding_id === finding.id
      && finding.finding_disposition.status === "needs_human"
      && /plan row|binding/i.test(finding.finding_disposition.next_action ?? ""),
  );
}

function retryPlan({ existingBytes, candidateBytes, changedFacts = [], finding = null }) {
  const allowedChange = changedFacts.some((fact) => allowedFacts.has(fact)) || qualifiesFinding(finding);
  if (!allowedChange || candidateBytes === existingBytes) {
    return { action: "reuse", changed: false, hash: sha256(existingBytes) };
  }
  return { action: "rewrite", changed: true, hash: sha256(candidateBytes) };
}

describe("spec-plan retry and artifact idempotence contract", () => {
  afterEach(() => {
    while (temporaryDirs.length > 0) rmSync(temporaryDirs.pop(), { recursive: true, force: true });
  });

  it("declares one owner, one consumer, and a retained migration condition", () => {
    const catalog = yaml.load(read("skills/catalog.yaml"));
    const entry = catalog.skills.find((item) => item.name === "spec-plan");
    expect(entry.retry_contract).toEqual({
      owner: "spec-plan Stage Agent",
      consumer: "same TaskHandle current build-plan stage",
      contract_test: "tests/contract/spec-plan-retry-contract.test.mjs",
      retain_or_delete: expect.stringContaining("formal stage-runtime plan writer"),
    });
  });

  it("reuses the exact artifact when no allowed input or finding changed", () => {
    const plan = "# plan\nsource: spec@abc\n";
    const result = retryPlan({ existingBytes: plan, candidateBytes: `${plan}\n`, changedFacts: [] });
    expect(result).toEqual({ action: "reuse", changed: false, hash: sha256(plan) });
  });

  it("proves the real ArtifactDir writer leaves identical plan bytes untouched", () => {
    const rootDir = realpathSync(mkdtempSync(join("/tmp", "workflowhub-spec-plan-retry-")));
    temporaryDirs.push(rootDir);
    const worktreeRoot = join(rootDir, "worktree");
    const taskId = "spec-plan-retry-contract";
    mkdirSync(join(worktreeRoot, "specs", taskId), { recursive: true });
    const task = createTask({
      storageRoot: rootDir,
      taskPath: join(rootDir, "Projects", "workflowhub", "tasks", taskId),
      manifest: {
        schema_version: "1.0.0",
        project_name: "workflowhub",
        task_id: taskId,
        created_at: "2026-07-16T00:00:00.000Z",
        target_repo_root: worktreeRoot,
        issue_ids: [],
        inputs: {},
      },
    });
    const artifacts = ArtifactDir.open(worktreeRoot, task);
    artifacts.writeAtomic("plan.md", "# plan\nsource: spec@abc\n");
    const before = lstatSync(artifacts.path("plan.md"));
    artifacts.writeAtomic("plan.md", "# plan\nsource: spec@abc\n");
    const after = lstatSync(artifacts.path("plan.md"));
    expect(after.ino).toBe(before.ino);
    expect(after.mtimeNs).toBe(before.mtimeNs);
  });

  it("does not rewrite for tasks-only drift or invalid review facts", () => {
    const plan = "# plan\nsource: spec@abc\n";
    const result = retryPlan({
      existingBytes: plan,
      candidateBytes: "# plan\nsource: spec@abc\ntasks: refreshed\n",
      changedFacts: ["tasks"],
      finding: { current_snapshot: false, id: "F-1", disposition: "actionable", severity: "major", evidence_status: "direct", finding_disposition: { finding_id: "F-1", status: "needs_human", next_action: "repair plan row P-1" } },
    });
    expect(result.action).toBe("reuse");
    expect(result.changed).toBe(false);
    expect(result.hash).toBe(sha256(plan));
  });

  it("allows only an allowed fact or a qualifying finding to rewrite", () => {
    const plan = "# plan\nsource: spec@abc\n";
    const changed = "# plan\nsource: spec@def\n";
    expect(retryPlan({ existingBytes: plan, candidateBytes: changed, changedFacts: ["spec"] }).action).toBe("rewrite");
    expect(retryPlan({
      existingBytes: plan,
      candidateBytes: changed,
      finding: { current_snapshot: true, id: "F-2", disposition: "actionable", severity: "major", evidence_status: "direct", finding_disposition: { finding_id: "F-2", status: "needs_human", next_action: "repair binding P-2" } },
    }).action).toBe("rewrite");
    expect(retryPlan({
      existingBytes: plan,
      candidateBytes: changed,
      finding: { current_snapshot: true, id: "F-3", disposition: "actionable", severity: "major", evidence_status: "direct", finding_disposition: { finding_id: "F-3", status: "accepted_risk", next_action: "accept risk for plan row P-3" } },
    }).action).toBe("reuse");
  });

  it("keeps runtime retry state out of the plan authoring prompt", () => {
    const skill = read("skills/spec-plan/SKILL.md");
    expect(skill).toMatch(/implementation solution/i);
    expect(skill).toMatch(/test plan/i);
    expect(skill).toMatch(/task mapping/i);
    expect(skill).not.toMatch(/TaskKernel|\breceipts?\b|\bsnapshot\b|\binvocation\b|user_handoff|WorkflowHub Stage Progress|process index|comment projection/i);
  });
});
