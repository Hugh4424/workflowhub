// CARD-03 P3/T006 预写测试：质量事实与证据校验只绑本 Phase 声明写集，
// business-case-catalog 用稳定锚点，不再做跨 Phase 全量快照绑定。
// 本文件不新增哈希门、回执或材料身份门（card-04 B-06），只断言收缩后的行为。
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import * as validators from "../../runtime/evidence/canonical-evidence-validators.mjs";
import { listCurrentResearchReports } from "../../runtime/evidence/research-report.mjs";
import * as reconciliation from "../../workflows/build-code/case-reconciliation.mjs";
import { handoffDeclaration } from "../../runtime/stage/stage-runner.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const temps = [];
afterEach(() => { while (temps.length) rmSync(temps.pop(), { recursive: true, force: true }); });

// 三棵树：A 基线；B 只改本 Phase 写集外的文件；C 改了写集内的文件。
function trees() {
  const repo = mkdtempSync(join(tmpdir(), "card03-p3-"));
  temps.push(repo);
  const git = (...args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  git("init", "-q");
  const put = (path, text) => {
    mkdirSync(dirname(join(repo, path)), { recursive: true });
    writeFileSync(join(repo, path), text);
    git("add", path);
  };
  put("src/owned.mjs", "export const owned = 1;\n");
  put("other/unrelated.mjs", "export const unrelated = 1;\n");
  const A = git("write-tree");
  put("other/unrelated.mjs", "export const unrelated = 2;\n");
  const B = git("write-tree");
  put("src/owned.mjs", "export const owned = 2;\n");
  const C = git("write-tree");
  return { repo, A, B, C, writeSet: ["src/owned.mjs"] };
}

function testReceipt(tree) {
  const command = "npx vitest run tests/owned.test.mjs";
  return {
    schema_version: "workflowhub-receipt.v1", task_id: "card03-p3", stage: "build-code",
    producer: { stage: "build-code", component: "build-code-test-capture" },
    snapshot_tree: tree, command, command_hash: sha256(command), exit_code: 0,
    output_hash: "e".repeat(64), output_ref: "quality/tests/output/owned.txt",
  };
}

function implementationReceipt(tree) {
  const diffHash = "d".repeat(64);
  return {
    schema_version: "workflowhub-receipt.v1", task_id: "card03-p3", stage: "build-code",
    producer: { stage: "build-code", component: "implementation", version: "1" },
    changed: ["src/owned.mjs"], snapshot_head: "1".repeat(40), snapshot_tree: tree, snapshot_commit: "1".repeat(40),
    diff_ref: `quality/evidence/implementation/${diffHash}.diff`, diff_hash: diffHash,
  };
}

describe("CARD-03 P3 runtime binding: phase write set instead of whole-tree snapshot", () => {
  it("ORACLE-RT-001 phaseWriteSetChanges reports only declared write-set paths", () => {
    const { repo, A, B, C, writeSet } = trees();
    expect(typeof validators.phaseWriteSetChanges).toBe("function");
    expect(validators.phaseWriteSetChanges({ root: repo, fromTree: A, toTree: B, writeSet })).toEqual([]);
    expect(validators.phaseWriteSetChanges({ root: repo, fromTree: A, toTree: C, writeSet })).toEqual(["src/owned.mjs"]);
  });

  it("ORACLE-RT-001 a test receipt survives an unrelated-file change but not a write-set change", () => {
    const { repo, A, B, C, writeSet } = trees();
    const options = (tree) => ({ taskId: "card03-p3", stage: "build-code",
      currentSnapshot: { root: repo, tree, writeSet } });
    expect(() => validators.validateCanonicalTestReceipt(testReceipt(A), options(B))).not.toThrow();
    expect(() => validators.validateCanonicalTestReceipt(testReceipt(A), options(C)))
      .toThrow(/write set changed.*src\/owned\.mjs/);
  });

  it("ORACLE-RT-001 an implementation receipt survives an unrelated-file change but not a write-set change", () => {
    const { repo, A, B, C, writeSet } = trees();
    const options = (tree) => ({ taskId: "card03-p3", currentSnapshot: { root: repo, tree, writeSet } });
    expect(() => validators.validateCanonicalImplementationReceipt(implementationReceipt(A), options(B))).not.toThrow();
    expect(() => validators.validateCanonicalImplementationReceipt(implementationReceipt(A), options(C)))
      .toThrow(/write set changed.*src\/owned\.mjs/);
  });

  it("ORACLE-RT-001 a research report stays current when only the code tree moved", () => {
    const identity = { task_id: "research-task", stage: "make-decision", snapshot_tree: "a".repeat(40),
      material_scope_revision: `revision-${"b".repeat(64)}` };
    const report = {
      schema_version: "research-report.v1", ...identity, status: "skipped",
      question: "Which route is safe?", decision_axis: "fallback route",
      tool_usage: [{ tool: "anysearch", attempts: [{ route: "anysearch", attempt: 1, status: "ok", elapsed_ms: 12, http_status: 200, error_code: null, message: null }] }],
      open_items: [{ question_id: "Q-1", code: "open", reason: "needs user choice", next_action: "ask user" }],
      review: { status: "pending", evidence_ref: null },
      fallback: { approval_status: "not_requested", requested_route: null, used_routes: [] },
      reason: "existing facts settle the axis", non_impact_basis: "no direction-changing question remains",
      evidence_refs: ["decision-log.md#facts"],
    };
    const raw = `${JSON.stringify(report)}\n`;
    const ref = `quality/evidence/research/${sha256(raw)}.json`;
    const records = listCurrentResearchReports({
      task: { listCanonicalResearchReportRefs: () => [ref], readRecord: () => raw },
      taskId: identity.task_id, stage: identity.stage,
      materialScopeRevision: identity.material_scope_revision, snapshotTree: "d".repeat(40),
    });
    expect(records).toHaveLength(1);
  });

  it("ORACLE-RT-001 business-case-catalog binds stable anchors, not whole-file sha256", () => {
    const catalog = JSON.parse(readFileSync(join(root, "docs/quality/business-case-catalog.json"), "utf8"));
    for (const entry of catalog.cases) {
      for (const revision of [entry.source?.revision, entry.rule?.revision, entry.effect_observation?.rule_revision]) {
        expect(revision, entry.id).toMatch(/^anchor:#{2,3} \S/);
      }
    }
    for (const consumer of ["workflows/build-code/case-reconciliation.mjs", "workflows/build-code/targeted-capture.mjs"]) {
      const text = readFileSync(join(root, consumer), "utf8");
      expect(text, consumer).not.toMatch(/revision !== `sha256:\$\{/);
      expect(text, consumer).not.toMatch(/SHA_REVISION/);
    }
  });

  it("ORACLE-RT-001 a one-word edit outside the anchored section keeps the case bound; losing the anchor does not", () => {
    expect(typeof reconciliation.businessCaseAnchorErrors).toBe("function");
    const texts = {
      "spec/source.md": "## 需求变更记录\n原文 A\n## 其他章节\n旧词\n",
      "spec/rule.md": "### T009\n规则\n### T010\n别的卡\n",
    };
    const entry = {
      id: "FIXTURE", source: { path: "spec/source.md", revision: "anchor:## 需求变更记录" },
      rule: { path: "spec/rule.md", revision: "anchor:### T009" },
      effect_observation: { rule_revision: "anchor:### T009" },
    };
    const read = (edits = {}) => (path) => ({ ...texts, ...edits })[path];
    expect(reconciliation.businessCaseAnchorErrors(entry, read())).toEqual([]);
    expect(reconciliation.businessCaseAnchorErrors(entry, read({
      "spec/source.md": "## 需求变更记录\n原文 A\n## 其他章节\n新词\n",
      "spec/rule.md": "### T009\n规则\n### T010\n别的卡改了一个词\n",
    }))).toEqual([]);
    expect(reconciliation.businessCaseAnchorErrors(entry, read({ "spec/rule.md": "### T010\n别的卡\n" })))
      .toContain("stale rule.revision");
    expect(reconciliation.businessCaseAnchorErrors(entry, read({ "spec/source.md": "## 其他章节\n" })))
      .toContain("stale source.revision");
  });

  it("ORACLE-RT-001 handoffDeclaration takes the current stage for P5/T012", () => {
    const decisionOnly = { "decision-log.md": "# d\n", "spec.md": "# s\n" };
    let declaration;
    expect(() => { declaration = handoffDeclaration(decisionOnly, "post", { stage: "make-decision" }); }).not.toThrow();
    expect(declaration.value).toBeNull();
    expect(() => handoffDeclaration(decisionOnly, "post", { stage: "build-code" })).toThrow(/post Phase index is missing/);
  });
});
