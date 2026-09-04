import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { readCommand, assembleVerifyAttempt } from "../workflows/verify-code/facts-assembly.mjs";
import { createTaskProjection } from "../workflows/verify-code/design-alignment.mjs";
import { publishVerifySummary, validateVerifyLeaves } from "../runtime/evidence/quality-store.mjs";
import { createTask } from "../runtime/task/task-handle.mjs";
import { initializeTaskStore } from "../runtime/task/task-store.mjs";

const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

describe("verify-code accepted-input and append-only attempt facts", () => {
  it("reads the fresh command only from the accepted build-code attempt facts", () => {
    expect(readCommand({ facts: { tests: { command: "npm test" } } })).toBe("npm test");
    expect(() => readCommand({ facts: { tests: {} } })).toThrow(/command/i);
  });

  it("assembles an identity-bound verify-code attempt, not a mutable stage-result", () => {
    const attempt = assembleVerifyAttempt({
      taskId: "demo-task",
      createdAt: "2026-07-16T00:00:00.000Z",
      facts: { tests: { command: "npm test", exit_code: 0 } },
      evidenceRefs: ["evidence/verify/test.json"],
      missingItems: [],
      reason: "fresh verification recorded",
    });
    expect(attempt).toMatchObject({
      task_id: "demo-task",
      stage: "verify-code",
      facts: { tests: { command: "npm test", exit_code: 0 } },
      missing_items: [],
    });
    expect(attempt).not.toHaveProperty("user_decision");
    expect(attempt).not.toHaveProperty("status", "pass");
  });

  it("rejects absolute, traversal, and specs evidence references", () => {
    const base = { taskId: "demo-task", createdAt: "2026-07-16T00:00:00.000Z", facts: {}, missingItems: [] };
    for (const evidenceRef of ["/tmp/x", "../x", "specs/demo/x"]) {
      expect(() => assembleVerifyAttempt({ ...base, evidenceRefs: [evidenceRef] }))
        .toThrow(/evidence|relative|traversal|specs/i);
    }
  });

  it("requires the task projection to use accepted versioned reference bindings", () => {
    const ref = {
      artifact_kind: "spec",
      ref: "specs/demo/spec.md",
      hash: "a".repeat(64),
      id: "AC-15",
    };
    const result = createTaskProjection({
      task: { id: "T008", versioned_refs: [ref] },
      selectedRefs: [ref],
      acceptedRefs: [ref],
    });

    expect(result).toMatchObject({ status: "ready", selected_refs: [ref] });
  });

  it("accepts one source-bound verify leaf per AC and rejects duplicate or incomplete leaves", () => {
    const sourceDigest = "b".repeat(64);
    const leaf = {
      acceptance_criterion_id: "AC-15", result: "pass", source_digest: sourceDigest,
      acceptance_leaf: { ref: "evidence/ac-15.json", sha256: "c".repeat(64) },
      nested_evidence: [{ ref: "quality/tests/ac-15-test.json", sha256: "d".repeat(64) }],
      scenario: "保存后读取", oracle: "值一致", actual_outcome: "值一致",
      evidence_type: "structured_observation", coverage_limits: ["未覆盖断电"], exceptions: ["无"],
      implementation_anchor: { id: "impl-ac-15", path: "src/save.mjs", start_line: 1, end_line: 2, role: "implementation" },
      verification_anchor: { id: "test-ac-15", path: "tests/save.test.mjs", start_line: 1, end_line: 2, role: "verification" },
    };
    expect(validateVerifyLeaves([leaf], { sourceDigest })).toMatchObject([{ status: "passed", acceptance_criterion_id: "AC-15" }]);
    expect(() => validateVerifyLeaves([leaf, leaf], { sourceDigest })).toThrow(/incomplete or duplicated/i);
    expect(() => validateVerifyLeaves([{ ...leaf, source_digest: "e".repeat(64) }], { sourceDigest })).toThrow(/incomplete or duplicated/i);
  });

  it("publishes the validated leaves as one quality/verify.json record", () => {
    const storageRoot = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-verify-leaves-")));
    roots.push(storageRoot);
    const task = createTask({ storageRoot, manifest: {
      schema_version: "1.0.0", project_name: "Demo", task_id: "verify-leaves", created_at: new Date().toISOString(),
      target_repo_root: "/repo", issue_ids: [], inputs: {},
    } });
    initializeTaskStore(task.taskPath, { taskId: task.identity.taskId });
    const sourceDigest = "b".repeat(64);
    const criteria = [{
      acceptance_criterion_id: "AC-15", result: "pass", source_digest: sourceDigest,
      acceptance_leaf: { ref: "evidence/ac-15.json", sha256: "c".repeat(64) },
      nested_evidence: [{ ref: "quality/tests/ac-15-test.json", sha256: "d".repeat(64) }],
      scenario: "保存后读取", oracle: "值一致", actual_outcome: "值一致", evidence_type: "structured_observation",
      coverage_limits: ["未覆盖断电"], exceptions: ["无"],
      implementation_anchor: { id: "impl-ac-15", path: "src/save.mjs", start_line: 1, end_line: 2, role: "implementation" },
      verification_anchor: { id: "test-ac-15", path: "tests/save.test.mjs", start_line: 1, end_line: 2, role: "verification" },
    }];
    const published = publishVerifySummary(task.taskPath, { status: "incomplete", source_digest: sourceDigest, material_digest: "a".repeat(64), criteria });
    expect(published.ref).toBe("quality/verify.json");
    expect(published.value.criteria).toMatchObject([{ acceptance_criterion_id: "AC-15", status: "passed" }]);
    expect(() => publishVerifySummary(task.taskPath, { status: "passed", task_id: "another-task" }))
      .toThrow(/cannot override authenticated identity fields.*task_id/i);
  });

  it("downgrades a pass claim without implementation and test anchors", () => {
    const sourceDigest = "b".repeat(64);
    const leaf = {
      acceptance_criterion_id: "AC-15", result: "pass", source_digest: sourceDigest,
      acceptance_leaf: { ref: "evidence/ac-15.json", sha256: "c".repeat(64) },
      nested_evidence: [{ ref: "evidence/ac-15-test.json", sha256: "d".repeat(64) }],
      scenario: "保存后读取", oracle: "值一致", actual_outcome: "值一致", evidence_type: "structured_observation",
      coverage_limits: ["未覆盖断电"], exceptions: ["无"],
    };
    expect(validateVerifyLeaves([leaf], { sourceDigest })[0].status).toBe("incomplete");
  });

  it("downgrades wrong anchor roles and overlapping physical proof ranges", () => {
    const sourceDigest = "b".repeat(64);
    const base = {
      result: "pass", source_digest: sourceDigest,
      acceptance_leaf: { ref: "evidence/ac.json", sha256: "c".repeat(64) },
      nested_evidence: [{ ref: "evidence/test.json", sha256: "d".repeat(64) }],
      scenario: "执行用户流程", oracle: "得到预期结果", actual_outcome: "得到预期结果",
      evidence_type: "structured_observation", coverage_limits: ["未覆盖异常网络"], exceptions: ["无"],
      implementation_anchor: { id: "impl", path: "src/feature.mjs", start_line: 10, end_line: 20, role: "implementation" },
      verification_anchor: { id: "test", path: "tests/feature.test.mjs", start_line: 10, end_line: 20, role: "verification" },
    };
    const wrongRole = validateVerifyLeaves([{
      ...base, acceptance_criterion_id: "AC-WRONG", implementation_anchor: { ...base.implementation_anchor, role: "verification" },
    }], { sourceDigest });
    expect(wrongRole[0].status).toBe("incomplete");
    const overlapping = validateVerifyLeaves([
      { ...base, acceptance_criterion_id: "AC-1" },
      {
        ...base,
        acceptance_criterion_id: "AC-2",
        acceptance_leaf: { ref: "evidence/ac-2.json", sha256: "e".repeat(64) },
        nested_evidence: [{ ref: "evidence/test-2.json", sha256: "f".repeat(64) }],
        implementation_anchor: { ...base.implementation_anchor, id: "impl-2", start_line: 18, end_line: 25 },
      },
    ], { sourceDigest });
    expect(overlapping.map((item) => item.status)).toEqual(["incomplete", "incomplete"]);
    expect(validateVerifyLeaves(overlapping, { sourceDigest }).map((item) => item.status)).toEqual(["incomplete", "incomplete"]);
  });

  it("downgrades criterion claims that reuse generic semantics or nested proof", () => {
    const sourceDigest = "b".repeat(64);
    const base = {
      result: "pass", source_digest: sourceDigest,
      acceptance_leaf: { ref: "evidence/ac.json", sha256: "c".repeat(64) },
      nested_evidence: [{ ref: "quality/tests/shared.json", sha256: "d".repeat(64) }],
      scenario: "执行当前验收流程", oracle: "结果符合预期", actual_outcome: "测试通过",
      evidence_type: "structured_observation", coverage_limits: ["未覆盖外部宿主"], exceptions: ["无"],
      implementation_anchor: { id: "impl-1", path: "src/feature.mjs", start_line: 10, end_line: 12, role: "implementation" },
      verification_anchor: { id: "test-1", path: "tests/feature.test.mjs", start_line: 10, end_line: 12, role: "verification" },
    };
    const output = validateVerifyLeaves([
      { ...base, acceptance_criterion_id: "AC-1" },
      {
        ...base,
        acceptance_criterion_id: "AC-2",
        acceptance_leaf: { ref: "evidence/ac-2.json", sha256: "e".repeat(64) },
        implementation_anchor: { ...base.implementation_anchor, id: "impl-2", start_line: 20, end_line: 22 },
        verification_anchor: { ...base.verification_anchor, id: "test-2", start_line: 20, end_line: 22 },
      },
    ], { sourceDigest });
    expect(output.map((item) => item.status)).toEqual(["incomplete", "incomplete"]);
    expect(output.every((item) => item.exceptions.some((reason) => /generic semantics|nested evidence/i.test(reason)))).toBe(true);
  });
});
