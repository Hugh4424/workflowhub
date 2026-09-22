import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { captureGitWorktreeSnapshot, isStageMaterialOnlySnapshotDelta } from "../../runtime/task/git-worktree-snapshot.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { handoffDeclaration, readCurrentE2eAcceptanceEvidence, validateAnalyzerBindings } from "../../runtime/stage/stage-runner.mjs";
import { captureWorkspaceSnapshot } from "../../runtime/evidence/canonical-receipt-writer.mjs";
import { deriveNamedStatusRefs, deriveStatusRootCauses, stageRuntimeMain } from "../../tools/cli/stage-runtime.mjs";

const roots = [];
const taskId = "post-binding";
const git = (cwd, args) => execFileSync("git", args, { cwd, encoding: "utf8" });

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("post-cohort runtime material binding", () => {
  it("requires current indexed Phase bytes in post spec-analyze bindings without plan/tasks", () => {
    const sha = (value) => createHash("sha256").update(value).digest("hex");
    const tree = "a".repeat(40);
    const index = "## Execution Index\n\n| phase | authority ref |\n| --- | --- |\n| `P1` | `phases/P1.md` |\n";
    const values = [
      ["decision-log.md", "decision"], ["spec.md", "spec"],
      ["phases/index.md", index], ["phases/P1.md", "Phase P1 current"],
    ];
    const materials = { values };
    const packet = { materials: {
      original_requirement: "decision", decision_log: "decision", spec: "spec",
      phase_index: index, phases: { "phases/P1.md": "Phase P1 current" },
    } };
    const bound = (source_ref, content) => ({ source_ref, sha256: sha(content), snapshot_tree: tree });
    const analyzer = { material_bindings: {
      original_requirement: bound("decision-log.md", "decision"),
      decision_log: bound("decision-log.md", "decision"),
      spec: bound("spec.md", "spec"),
      phase_index: bound("phases/index.md", index),
      phases: { "phases/P1.md": bound("phases/P1.md", "Phase P1 current") },
    }, evidence_bindings: {} };
    const profile = { required_materials: ["original_requirement", "decision_log", "spec", "phase_index"], required_evidence: [] };
    expect(() => validateAnalyzerBindings({}, analyzer, packet, profile, materials, { tree }, "build-plan"))
      .not.toThrow();
    packet.materials.phases["phases/P1.md"] = "Phase P1 stale";
    expect(() => validateAnalyzerBindings({}, analyzer, packet, profile, materials, { tree }, "build-plan"))
      .toThrow(/phases\/P1\.md|Phase/i);
  });

  it("attributes post slice advisory to the indexed Phase set, never plan.md", () => {
    const materials = {
      "phases/index.md": "## Execution Index\n\n| phase | authority ref |\n| --- | --- |\n| `P1` | `phases/P1.md` |\n",
      "phases/P1.md": "phase",
    };
    const causes = deriveStatusRootCauses({
      sliceAdvisory: { status: "unexplained_overage", diagnostics: ["SIG-FILES"] },
      activationCohort: "post", materials,
    });
    expect(causes.find((cause) => cause.root_cause_id === "slice_advisory")).toMatchObject({
      source: "phases/index.md", refs: ["phases/index.md", "phases/P1.md"],
    });
  });

  it("keeps post E2E applicability unavailable when the native Phase acceptance contract is invalid", () => {
    const materials = {
      "decision-log.md": "decision", "spec.md": "spec",
      "phases/index.md": "## Execution Index\n\n| phase | authority ref |\n| --- | --- |\n| `P1` | `phases/P1.md` |\n",
      "phases/P1.md": "Phase P1 acceptance",
    };
    const ctx = { task: { manifest: { activation_cohort: "post" } }, artifacts: { read: (file) => materials[file] } };
    const evidence = readCurrentE2eAcceptanceEvidence(ctx);
    expect(evidence.required).toBe(true);
    expect(evidence.execution.status).toBe("missing");
    expect(evidence.reason).toMatch(/post Phase acceptance contract/i);
  });

  it("projects post E2E applicability from the indexed native acceptance card", () => {
    const nativeAcceptance = JSON.stringify([{
      source: "fixture",
      sample: "current",
      scenario: "native service",
      tier: "service",
      execution: {
        module_ref: "tests/acceptance/card-07-current.mjs",
        export_name: "produceCard07Current",
        input: { command: ["node", "--version"] },
        timeout_ms: 1000,
      },
    }]);
    const materials = {
      "decision-log.md": "decision", "spec.md": "spec",
      "phases/index.md": "## Execution Index\n\n| phase | authority ref |\n| --- | --- |\n| `P1` | `phases/P1.md` |\n",
      "phases/P1.md": [
        "# Phase P1 — native acceptance",
        "",
        "## L1 — Delivery",
        "",
        "### T001 — current acceptance",
        "- **Source / FR / AC**：AC-001",
        "- **acceptance_role**：acceptance",
        `- **acceptance_data**：\`${nativeAcceptance}\``,
      ].join("\n"),
    };
    const ctx = { task: { manifest: { activation_cohort: "post" } }, artifacts: { read: (file) => materials[file] } };
    const evidence = readCurrentE2eAcceptanceEvidence(ctx);
    expect(evidence).toMatchObject({ required: true, execution: { status: "missing" } });
    expect(evidence.reason).toBeUndefined();
  });

  it("reads handoff declarations only from indexed post Phase authorities", () => {
    const table = (id) => `| 未决/交接 | owner | trigger | handoff / consumer | close / retain condition |\n| --- | --- | --- | --- | --- |\n| ${id} | next owner | when started | next consumer | after acceptance |\n`;
    const materials = {
      "phases/index.md": "## Execution Index\n\n| phase | authority ref |\n| --- | --- |\n| `P1` | `phases/P1.md` |\n| `P2` | `phases/P2.md` |\n",
      "phases/P1.md": table("HANDOFF-001"),
      "phases/P2.md": table("HANDOFF-002"),
      "plan.md": table("HANDOFF-LEGACY"),
    };
    expect(handoffDeclaration(materials, "post").value.map((item) => item.id))
      .toEqual(["HANDOFF-001", "HANDOFF-002"]);
    expect(() => handoffDeclaration({ ...materials, "phases/P2.md": undefined }, "post"))
      .toThrow(/phases\/P2\.md/);
    expect(handoffDeclaration(materials).value.map((item) => item.id)).toEqual(["HANDOFF-LEGACY"]);
  });

  it("lists indexed Phase files as current materials and material diff inputs", () => {
    const materials = {
      "decision-log.md": "decision",
      "spec.md": "spec",
      "phases/index.md": "## Execution Index\n\n| phase | authority ref |\n| --- | --- |\n| `P1` | `phases/P1.md` |\n| `P2` | `phases/P2.md` |\n",
      "phases/P1.md": "one",
      "phases/P2.md": "two",
    };
    const refs = deriveNamedStatusRefs({ facts: [], activationCohort: "post", materials });
    expect(refs.find((row) => row.class === "K3").refs).toEqual(Object.keys(materials));
    expect(refs.find((row) => row.class === "K6").refs).toEqual(Object.keys(materials).map((file) => `${file}:HEAD-diff`));
  });

  it("excludes post Phase material changes from implementation source digest", () => {
    const repo = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-post-source-")));
    roots.push(repo);
    git(repo, ["init", "-q"]);
    git(repo, ["config", "user.name", "WorkflowHub Tests"]);
    git(repo, ["config", "user.email", "tests@workflowhub.local"]);
    const materialRoot = join(repo, "specs", taskId);
    mkdirSync(join(materialRoot, "phases"), { recursive: true });
    writeFileSync(join(repo, "app.mjs"), "export const answer = 42;\n");
    writeFileSync(join(materialRoot, "decision-log.md"), "decision\n");
    writeFileSync(join(materialRoot, "spec.md"), "spec\n");
    writeFileSync(join(materialRoot, "phases", "index.md"), "- `phases/P1.md`\n");
    writeFileSync(join(materialRoot, "phases", "P1.md"), "one\n");
    git(repo, ["add", "."]);
    git(repo, ["commit", "-qm", "baseline"]);
    const before = captureGitWorktreeSnapshot(repo, taskId, "post");
    const preBefore = captureGitWorktreeSnapshot(repo, taskId, "pre");
    writeFileSync(join(materialRoot, "phases", "P1.md"), "two\n");
    const after = captureGitWorktreeSnapshot(repo, taskId, "post");
    const preAfter = captureGitWorktreeSnapshot(repo, taskId, "pre");
    expect(after.tree).not.toBe(before.tree);
    expect(after.source_digest).toBe(before.source_digest);
    expect(preAfter.source_digest).not.toBe(preBefore.source_digest);
    expect(isStageMaterialOnlySnapshotDelta(repo, before.tree, after.tree, {
      taskId, downstreamMaterials: [], allowNonMaterialChanges: true, activationCohort: "pre",
    })).toBe(true);
    expect(isStageMaterialOnlySnapshotDelta(repo, before.tree, after.tree, {
      taskId, downstreamMaterials: [], allowNonMaterialChanges: true, activationCohort: "post",
    })).toBe(false);
  });

  it("binds the kernel and public status identities to each indexed Phase", async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-post-kernel-")));
    roots.push(root);
    const repo = join(root, "repo");
    const worktree = join(root, "worktree");
    mkdirSync(repo);
    git(repo, ["init", "-q", "-b", "main"]);
    git(repo, ["config", "user.name", "WorkflowHub Tests"]);
    git(repo, ["config", "user.email", "tests@workflowhub.local"]);
    git(repo, ["commit", "--allow-empty", "-qm", "baseline"]);
    git(repo, ["worktree", "add", "-q", "-b", `task/workflowhub/${taskId}`, worktree, "main"]);
    const task = createTask({
      storageRoot: root,
      manifest: {
        schema_version: "1.0.0", project_name: "workflowhub", task_id: taskId,
        created_at: "2026-09-22T00:00:00.000Z", target_repo_root: repo,
        workspace_mode: "existing", workspace_root: worktree, activation_cohort: "post",
        issue_ids: [], inputs: {},
      },
    });
    const materialRoot = join(worktree, "specs", taskId);
    mkdirSync(join(materialRoot, "phases"), { recursive: true });
    writeFileSync(join(materialRoot, "decision-log.md"), "## 任务身份\n\n- **任务类型**：普通任务\n");
    writeFileSync(join(materialRoot, "spec.md"), "spec\n");
    writeFileSync(join(materialRoot, "phases", "index.md"), "## Execution Index\n\n| phase | authority ref |\n| --- | --- |\n| `P1` | `phases/P1.md` |\n");
    writeFileSync(join(materialRoot, "phases", "P1.md"), "first\n");
    const workspace = openCurrentTaskWorkspace(task);
    const kernel = createTaskKernel(task, { workspace });
    const before = kernel.currentVNextMaterialRevision();
    const beforeScope = kernel.currentVNextMaterialScopeRevision("build-plan");
    const beforeSource = kernel.currentVNextSnapshot().source_digest;
    const beforeReceiptSource = captureWorkspaceSnapshot(workspace, taskId, "post").source_digest;
    const environmentBefore = Object.fromEntries(["HOME", "XDG_CONFIG_HOME", "WORKFLOWHUB_TASK_DIR"].map((key) => [key, process.env[key]]));
    const home = join(root, "home");
    mkdirSync(home);
    process.env.HOME = home;
    process.env.XDG_CONFIG_HOME = join(home, ".config");
    process.env.WORKFLOWHUB_TASK_DIR = root;
    try {
      const status = await stageRuntimeMain([
        "status", "--stage=build-plan", "--project=workflowhub", `--task=${taskId}`, `--task-path=${task.taskPath}`,
      ], { cwd: worktree });
      expect(status.identity.material_revision).toBe(before);
      expect(status.source_completeness.materials).toBe(true);
      expect(status.named_refs.find((row) => row.class === "K3").refs).toEqual([
        "decision-log.md", "spec.md", "phases/index.md", "phases/P1.md",
      ]);
      expect(status.root_causes.find((cause) => cause.root_cause_id === "slice_advisory")?.source)
        .toBe("phases/index.md");
      const inputPath = join(root, "artifact-input.md");
      writeFileSync(inputPath, "first\n");
      const artifactArgs = (name) => [
        "artifact", "--stage=build-plan", "--project=workflowhub", `--task=${taskId}`,
        `--task-path=${task.taskPath}`, `--name=${name}`, `--input=${inputPath}`,
      ];
      expect((await stageRuntimeMain(artifactArgs("phases/P1.md"), { cwd: worktree })).artifact_ref)
        .toBe(`specs/${taskId}/phases/P1.md`);
      await expect(stageRuntimeMain(artifactArgs("plan.md"), { cwd: worktree }))
        .rejects.toThrow(/unsupported build-plan artifact/);
    } finally {
      for (const [key, value] of Object.entries(environmentBefore)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
    writeFileSync(join(materialRoot, "phases", "P1.md"), "changed\n");
    expect(kernel.currentVNextMaterialRevision()).not.toBe(before);
    expect(kernel.currentVNextMaterialScopeRevision("build-plan")).not.toBe(beforeScope);
    expect(kernel.currentVNextSnapshot().source_digest).toBe(beforeSource);
    expect(captureWorkspaceSnapshot(workspace, taskId, "post").source_digest).toBe(beforeReceiptSource);
    const withoutLegacy = kernel.currentVNextMaterialRevision();
    writeFileSync(join(materialRoot, "plan.md"), "legacy placeholder\n");
    writeFileSync(join(materialRoot, "tasks.md"), "legacy placeholder\n");
    expect(withoutLegacy).toBe(kernel.currentVNextMaterialRevision());
  });
});
