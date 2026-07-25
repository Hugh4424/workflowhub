import { afterEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";

import { createTask } from "../task-handle.mjs";
import { createTaskKernel, validateAccepted } from "../task-kernel.mjs";
import { openAcceptedWorkspace, prepareTaskWorkspace } from "../workspace.mjs";
import { ArtifactDir } from "../artifact-dir.mjs";
import { verifyGitCheckpoint } from "../git-checkpoint.mjs";

const temporary = [];
const execFileAsync = promisify(execFile);
function confirmation(kernel, stage, attemptRef) {
  return kernel.confirmAttempt(stage, attemptRef, "accepted", stage === "make-decision" ? "comment:test-confirmation" : undefined).ref;
}
function fixture(inputs = {}) {
  const storageRoot = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-kernel-publish-")));
  temporary.push(storageRoot);
  const repo = join(storageRoot, "repo");
  mkdirSync(repo);
  execFileSync("git", ["init", "-q"], { cwd: repo });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
  writeFileSync(join(repo, "README.md"), "fixture\n");
  execFileSync("git", ["add", "README.md"], { cwd: repo });
  execFileSync("git", ["commit", "-qm", "fixture"], { cwd: repo });
  const taskPath = join(storageRoot, "Projects", "Demo", "tasks", "task-one");
  const task = createTask({ storageRoot, taskPath, manifest: {
    schema_version: "1.0.0", project_name: "Demo", task_id: "task-one",
    created_at: "2026-07-16T00:00:00.000Z", target_repo_root: repo,
    issue_ids: [], inputs,
  } });
  return { repo, task, kernel: createTaskKernel(task) };
}
afterEach(() => { while (temporary.length) rmSync(temporary.pop(), { recursive: true, force: true }); });

describe("TaskKernel append-only publication", () => {
  it("rejects an upstream reference whose task identity is forged", () => {
    const { kernel } = fixture();
    const cp = { ref: "refs/checkpoint", commit_oid: "a".repeat(40), tree_oid: "b".repeat(40), artifacts: [] };
    expect(() => kernel.publishAttempt("build-spec", {
      facts: { spec_ref: "specs/task-one/spec.md", checkpoint: cp }, checkpoint: cp,
      upstream_refs: [{ task_id: "other-task", stage: "make-decision", accepted_ref: "results/make-decision/accepted.json" }],
    })).toThrow(/task|identity|upstream/i);
  });
  it("rejects a syntactically valid upstream ref when no authentic accepted record exists", () => {
    const { kernel } = fixture();
    const cp = { ref: "refs/checkpoint", commit_oid: "a".repeat(40), tree_oid: "b".repeat(40), artifacts: [] };
    expect(() => kernel.publishAttempt("build-spec", {
      facts: { spec_ref: "specs/task-one/spec.md", checkpoint: cp }, checkpoint: cp,
      upstream_refs: [{ task_id: "task-one", stage: "make-decision", accepted_ref: "results/make-decision/accepted.json" }],
    })).toThrow(/accepted|upstream|not found|ENOENT/i);
  });
  it("publishes monotonically numbered attempts without overwrite", () => {
    const { task, kernel } = fixture();
    const first = kernel.publishAttempt("make-decision", { facts: { worktree_root: "/repo", baseline_commit: "a".repeat(40), decision: "go" } });
    const second = kernel.publishAttempt("make-decision", { facts: { worktree_root: "/repo", baseline_commit: "a".repeat(40), decision: "revise" } });
    expect(first.attempt_ref).toBe("attempt-0001.json");
    expect(second.attempt_ref).toBe("attempt-0002.json");
    expect(JSON.parse(task.readRecord(`results/make-decision/${first.attempt_ref}`)).facts.decision).toBe("go");
  });

  it("accepts create-only with human confirmation and exact attempt hash", () => {
    const { kernel } = fixture();
    const attempt = kernel.publishAttempt("make-decision", { facts: { worktree_root: "/repo", baseline_commit: "a".repeat(40), decision: "go" } });
    const accepted = kernel.acceptAttempt("make-decision", attempt.attempt_ref, confirmation(kernel, "make-decision", attempt.attempt_ref));
    expect(accepted).toMatchObject({ task_id: "task-one", stage: "make-decision", attempt_ref: attempt.attempt_ref,
      human_confirmation_ref: `confirmations/make-decision/${attempt.attempt_ref}`, integrity_hash: attempt.integrity_hash });
    expect(() => kernel.acceptAttempt("make-decision", attempt.attempt_ref, "journal:2")).toThrow();
    expect(() => kernel.publishAttempt("make-decision", { facts: { worktree_root: "/repo", baseline_commit: "a".repeat(40) } }))
      .toThrow(/accepted|closed/i);
  });

  it("requires checkpoint provenance for accepted design stages", () => {
    const { task, kernel } = fixture();
    const candidate = prepareTaskWorkspace(task);
    const decision = kernel.publishAttempt("make-decision", { facts: { worktree_root: candidate.worktreeRoot, baseline_commit: candidate.baselineCommit } });
    kernel.acceptAttempt("make-decision", decision.attempt_ref, confirmation(kernel, "make-decision", decision.attempt_ref));
    const upstream_refs = [{ task_id: "task-one", stage: "make-decision", accepted_ref: "results/make-decision/accepted.json" }];
    expect(() => kernel.publishAttempt("build-spec", { facts: { spec_ref: "specs/task-one/spec.md", checkpoint: {} }, upstream_refs }))
      .toThrow(/checkpoint/i);
    const workspace = openAcceptedWorkspace(task, kernel.readAccepted("make-decision"));
    const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
    artifacts.writeAtomic("spec.md", "# Spec\n");
    const boundKernel = createTaskKernel(task, { workspace, artifacts });
    const checkpoint = boundKernel.createCheckpoint("build-spec");
    expect(checkpoint).toMatchObject({ schema_version: "git-checkpoint-plan.v1",
      artifacts: [{ path: "specs/task-one/spec.md" }],
    });
    expect(() => execFileSync("git", ["show-ref", "--verify", checkpoint.ref], { cwd: task.manifest.target_repo_root, stdio: "ignore" })).toThrow();
    expect(() => boundKernel.publishAttempt("build-spec", {
      facts: { spec_ref: "specs/task-one/spec.md", checkpoint: structuredClone(checkpoint) }, upstream_refs,
    })).toThrow(/authentic GitCheckpoint/i);
    artifacts.writeAtomic("spec.md", "tampered\n");
    expect(() => boundKernel.publishAttempt("build-spec", {
      facts: { spec_ref: "specs/task-one/spec.md", checkpoint }, upstream_refs,
    })).toThrow(/differs|checkpoint|artifact/i);
    const revisedCheckpoint = boundKernel.createCheckpoint("build-spec");
    expect(revisedCheckpoint).not.toHaveProperty("ref");
    const attempt = boundKernel.publishAttempt("build-spec", { facts: { spec_ref: "specs/task-one/spec.md", checkpoint: revisedCheckpoint }, upstream_refs });
    expect(String(execFileSync("git", ["for-each-ref", "--format=%(refname)", "refs/workflowhub/checkpoints/"], { cwd: task.manifest.target_repo_root }))).toBe("");
    expect(() => boundKernel.confirmAttempt("build-spec", attempt.attempt_ref, "accepted")).toThrow(/automatic acceptance/i);
    expect(() => boundKernel.acceptAttempt("build-spec", attempt.attempt_ref, "human:forged")).toThrow(/automatic acceptance/i);
    const acceptedSpec = boundKernel.acceptAttempt("build-spec", attempt.attempt_ref);
    expect(acceptedSpec).toMatchObject({ acceptance_mode: "automatic" });
    expect(acceptedSpec).not.toHaveProperty("human_confirmation_ref");
    expect(acceptedSpec.checkpoint.ref).toMatch(/^refs\/workflowhub\/checkpoints\/Demo\/task-one\/build-spec\//);
    expect(() => verifyGitCheckpoint({ repoRoot: workspace.worktreeRoot, checkpoint: acceptedSpec.checkpoint, projectName: "Demo", taskId: "task-one", stage: "build-spec" })).not.toThrow();
    artifacts.writeAtomic("plan.md", "# Plan\n");
    artifacts.writeAtomic("tasks.md", "# Tasks\n");
    const planCheckpoint = boundKernel.createCheckpoint("build-plan");
    const planUpstream = [{ task_id: "task-one", stage: "build-spec", accepted_ref: "results/build-spec/accepted.json" }];
    const planAttempt = boundKernel.publishAttempt("build-plan", {
      facts: { plan_ref: "specs/task-one/plan.md", tasks_ref: "specs/task-one/tasks.md", checkpoint: planCheckpoint },
      upstream_refs: planUpstream,
    });
    const acceptedPlan = boundKernel.acceptAttempt("build-plan", planAttempt.attempt_ref, confirmation(boundKernel, "build-plan", planAttempt.attempt_ref));
    expect(acceptedPlan).toMatchObject({ acceptance_mode: "human" });
    expect(() => execFileSync("git", ["merge-base", "--is-ancestor", acceptedSpec.checkpoint.commit_oid, acceptedPlan.checkpoint.commit_oid], { cwd: task.manifest.target_repo_root })).not.toThrow();
  });

  it("rebinds an accepted build-plan to the current integration baseline without changing design bytes", () => {
    const { task, kernel } = fixture();
    const candidate = prepareTaskWorkspace(task);
    const decision = kernel.publishAttempt("make-decision", { facts: { worktree_root: candidate.worktreeRoot, baseline_commit: candidate.baselineCommit } });
    kernel.acceptAttempt("make-decision", decision.attempt_ref, confirmation(kernel, "make-decision", decision.attempt_ref));
    const workspace = openAcceptedWorkspace(task, kernel.readAccepted("make-decision"));
    const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
    const bound = createTaskKernel(task, { workspace, artifacts });
    artifacts.writeAtomic("spec.md", "# Spec\n");
    const specAttempt = bound.publishAttempt("build-spec", {
      facts: { spec_ref: artifacts.reference("spec.md"), checkpoint: bound.createCheckpoint("build-spec") },
      upstream_refs: [{ task_id: "task-one", stage: "make-decision", accepted_ref: "results/make-decision/accepted.json" }],
    });
    bound.acceptAttempt("build-spec", specAttempt.attempt_ref);
    artifacts.writeAtomic("plan.md", "# Plan\n");
    artifacts.writeAtomic("tasks.md", "# Tasks\n");
    const planAttempt = bound.publishAttempt("build-plan", {
      facts: { plan_ref: artifacts.reference("plan.md"), tasks_ref: artifacts.reference("tasks.md"), checkpoint: bound.createCheckpoint("build-plan") },
      upstream_refs: [{ task_id: "task-one", stage: "build-spec", accepted_ref: "results/build-spec/accepted.json" }],
    });
    bound.acceptAttempt("build-plan", planAttempt.attempt_ref, confirmation(bound, "build-plan", planAttempt.attempt_ref));
    const bytes = ["spec.md", "plan.md", "tasks.md"].map((name) => artifacts.read(name));
    writeFileSync(join(workspace.worktreeRoot, "README.md"), "integrated\n");
    execFileSync("git", ["add", "README.md"], { cwd: workspace.worktreeRoot });
    execFileSync("git", ["commit", "-qm", "integration"], { cwd: workspace.worktreeRoot });

    writeFileSync(join(workspace.worktreeRoot, "unexpected.txt"), "drift\n");
    expect(() => bound.authorizeBuildPlanBaselineRebind()).toThrow(/unrelated Workspace drift/i);
    rmSync(join(workspace.worktreeRoot, "unexpected.txt"));
    artifacts.writeAtomic("plan.md", "# changed\n");
    expect(() => bound.authorizeBuildPlanBaselineRebind()).toThrow(/artifact differs|design bytes|drift/i);
    artifacts.writeAtomic("plan.md", bytes[1]);
    const authorization = bound.authorizeBuildPlanBaselineRebind();
    expect(() => bound.authorizeBuildPlanBaselineRebind("build-spec")).toThrow(/build-plan/i);
    expect(() => bound.createCheckpoint("build-plan", { baselineRebindRef: "results/build-plan/revisions/baseline-rebind-9999.json" })).toThrow(/ENOENT|not found/i);
    const authorizationRaw = task.readRecord(authorization.ref);
    const wrongTreeAuthorization = JSON.parse(authorizationRaw);
    wrongTreeAuthorization.base_tree = "0".repeat(40);
    writeFileSync(task.recordPath(authorization.ref), `${JSON.stringify(wrongTreeAuthorization, null, 2)}\n`);
    expect(() => bound.createCheckpoint("build-plan", { baselineRebindRef: authorization.ref })).toThrow(/Git checkpoint|tree|authorization/i);
    writeFileSync(task.recordPath(authorization.ref), authorizationRaw);
    const checkpoint = bound.createCheckpoint("build-plan", { baselineRebindRef: authorization.ref });
    expect(bound.createCheckpoint("build-plan", { baselineRebindRef: authorization.ref })).toEqual(checkpoint);
    expect(checkpoint.baseline_rebind_hash).toBe(authorization.hash);
    const revised = bound.publishAttempt("build-plan", {
      facts: { plan_ref: artifacts.reference("plan.md"), tasks_ref: artifacts.reference("tasks.md"), checkpoint },
      upstream_refs: [{ task_id: "task-one", stage: "build-spec", accepted_ref: "results/build-spec/accepted.json" }],
      baseline_rebind_ref: authorization.ref,
    });
    const revisedRaw = task.readRecord(`results/build-plan/${revised.attempt_ref}`);
    const badProvenance = JSON.parse(revisedRaw);
    badProvenance.baseline_rebind_provenance.authorization_hash = "0".repeat(64);
    writeFileSync(task.recordPath(`results/build-plan/${revised.attempt_ref}`), `${JSON.stringify(badProvenance, null, 2)}\n`);
    expect(() => bound.acceptAttempt("build-plan", revised.attempt_ref, "confirmations/build-plan/missing.json")).toThrow(/provenance|authorization|confirmation|hash/i);
    writeFileSync(task.recordPath(`results/build-plan/${revised.attempt_ref}`), revisedRaw);
    expect(() => bound.acceptAttempt("build-plan", revised.attempt_ref, confirmation(bound, "build-plan", planAttempt.attempt_ref))).toThrow(/confirmation/i);
    const freshConfirmation = confirmation(bound, "build-plan", revised.attempt_ref);
    const conflictingRef = `refs/workflowhub/checkpoints/Demo/task-one/build-plan/plan-${checkpoint.plan_hash}`;
    execFileSync("git", ["update-ref", conflictingRef, "HEAD"], { cwd: workspace.worktreeRoot });
    expect(() => bound.acceptAttempt("build-plan", revised.attempt_ref, freshConfirmation)).toThrow(/checkpoint ref conflicts/i);
    execFileSync("git", ["update-ref", "-d", conflictingRef], { cwd: workspace.worktreeRoot });
    const accepted = bound.acceptAttempt("build-plan", revised.attempt_ref, freshConfirmation);
    expect(bound.acceptAttempt("build-plan", revised.attempt_ref, freshConfirmation)).toEqual(accepted);
    expect(accepted.baseline_rebind_provenance.authorization_ref).toBe(authorization.ref);
    expect(accepted.checkpoint.ref).toContain(checkpoint.plan_hash);
    expect(["spec.md", "plan.md", "tasks.md"].map((name) => artifacts.read(name))).toEqual(bytes);
    const sameTreeNewPriorAuthorization = bound.authorizeBuildPlanBaselineRebind();
    const sameTreeNewPriorCheckpoint = bound.createCheckpoint("build-plan", { baselineRebindRef: sameTreeNewPriorAuthorization.ref });
    expect(sameTreeNewPriorAuthorization.ref).not.toBe(authorization.ref);
    expect(sameTreeNewPriorCheckpoint.parent_commit).toBe(checkpoint.parent_commit);
    expect(sameTreeNewPriorCheckpoint.plan_hash).not.toBe(checkpoint.plan_hash);

    writeFileSync(join(workspace.worktreeRoot, "README.md"), "integrated again\n");
    execFileSync("git", ["add", "README.md"], { cwd: workspace.worktreeRoot });
    execFileSync("git", ["commit", "-qm", "second integration"], { cwd: workspace.worktreeRoot });
    const secondAuthorization = bound.authorizeBuildPlanBaselineRebind();
    const secondCheckpoint = bound.createCheckpoint("build-plan", { baselineRebindRef: secondAuthorization.ref });
    expect(secondCheckpoint.plan_hash).not.toBe(checkpoint.plan_hash);
    const secondAttempt = bound.publishAttempt("build-plan", {
      facts: { plan_ref: artifacts.reference("plan.md"), tasks_ref: artifacts.reference("tasks.md"), checkpoint: secondCheckpoint },
      upstream_refs: [{ task_id: "task-one", stage: "build-spec", accepted_ref: "results/build-spec/accepted.json" }],
      baseline_rebind_ref: secondAuthorization.ref,
    });
    const secondAccepted = bound.acceptAttempt("build-plan", secondAttempt.attempt_ref, confirmation(bound, "build-plan", secondAttempt.attempt_ref));
    expect(secondAccepted.checkpoint.ref).not.toBe(accepted.checkpoint.ref);

    writeFileSync(join(workspace.worktreeRoot, "README.md"), "third integration\n");
    execFileSync("git", ["add", "README.md"], { cwd: workspace.worktreeRoot });
    execFileSync("git", ["commit", "-qm", "third integration"], { cwd: workspace.worktreeRoot });
    const raceAuthorization = bound.authorizeBuildPlanBaselineRebind();
    const raceCheckpoint = bound.createCheckpoint("build-plan", { baselineRebindRef: raceAuthorization.ref });
    const raceAttempt = bound.publishAttempt("build-plan", {
      facts: { plan_ref: artifacts.reference("plan.md"), tasks_ref: artifacts.reference("tasks.md"), checkpoint: raceCheckpoint },
      upstream_refs: [{ task_id: "task-one", stage: "build-spec", accepted_ref: "results/build-spec/accepted.json" }],
      baseline_rebind_ref: raceAuthorization.ref,
    });
    const raceConfirmation = confirmation(bound, "build-plan", raceAttempt.attempt_ref);
    const concurrentRaw = "concurrent accepted writer\n";
    const racing = createTaskKernel(task, { workspace, artifacts, acceptedReplacementTestHooks: {
      afterRevalidateBeforeRename() { writeFileSync(task.recordPath("results/build-plan/accepted.json"), concurrentRaw); },
    } });
    expect(() => racing.acceptAttempt("build-plan", raceAttempt.attempt_ref, raceConfirmation)).toThrow(/compare-and-swap|changed/i);
    expect(task.readRecord("results/build-plan/accepted.json")).toBe(concurrentRaw);
  });

  it("rejects build-plan baseline rebind when design bytes or unrelated workspace paths drift", () => {
    const { kernel } = fixture();
    expect(() => kernel.authorizeBuildPlanBaselineRebind()).toThrow(/accepted|Workspace|capabilit/i);
  });

  it("accepts a checkpoint when the controlled artifact already matches its parent", () => {
    const { repo, task, kernel } = fixture();
    const artifactRoot = join(repo, "specs", "task-one");
    mkdirSync(artifactRoot, { recursive: true });
    writeFileSync(join(artifactRoot, "spec.md"), "# Existing Spec\n");
    execFileSync("git", ["add", "specs/task-one/spec.md"], { cwd: repo });
    execFileSync("git", ["commit", "-qm", "existing spec"], { cwd: repo });

    const candidate = prepareTaskWorkspace(task);
    const decision = kernel.publishAttempt("make-decision", {
      facts: { worktree_root: candidate.worktreeRoot, baseline_commit: candidate.baselineCommit },
    });
    kernel.acceptAttempt("make-decision", decision.attempt_ref, confirmation(kernel, "make-decision", decision.attempt_ref));
    const workspace = openAcceptedWorkspace(task, kernel.readAccepted("make-decision"));
    const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
    const boundKernel = createTaskKernel(task, { workspace, artifacts });
    const checkpoint = boundKernel.createCheckpoint("build-spec");
    const upstream_refs = [{ task_id: "task-one", stage: "make-decision", accepted_ref: "results/make-decision/accepted.json" }];
    const attempt = boundKernel.publishAttempt("build-spec", {
      facts: { spec_ref: "specs/task-one/spec.md", checkpoint },
      upstream_refs,
    });

    const accepted = boundKernel.acceptAttempt("build-spec", attempt.attempt_ref);
    expect(accepted).toMatchObject({ acceptance_mode: "automatic" });
    expect(accepted.checkpoint.artifacts).toEqual([
      expect.objectContaining({ path: "specs/task-one/spec.md" }),
    ]);
    expect(() => verifyGitCheckpoint({
      repoRoot: workspace.worktreeRoot,
      checkpoint: accepted.checkpoint,
      projectName: "Demo",
      taskId: "task-one",
      stage: "build-spec",
      artifacts,
    })).not.toThrow();
  });

  it.each(["tracked", "untracked"])("rejects a no-diff checkpoint when the Workspace also contains an unexpected %s path", (kind) => {
    const { repo, task, kernel } = fixture();
    const artifactRoot = join(repo, "specs", "task-one");
    mkdirSync(artifactRoot, { recursive: true });
    writeFileSync(join(artifactRoot, "spec.md"), "# Existing Spec\n");
    execFileSync("git", ["add", "specs/task-one/spec.md"], { cwd: repo });
    execFileSync("git", ["commit", "-qm", "existing spec"], { cwd: repo });
    const candidate = prepareTaskWorkspace(task);
    const decision = kernel.publishAttempt("make-decision", { facts: { worktree_root: candidate.worktreeRoot, baseline_commit: candidate.baselineCommit } });
    kernel.acceptAttempt("make-decision", decision.attempt_ref, confirmation(kernel, "make-decision", decision.attempt_ref));
    const workspace = openAcceptedWorkspace(task, kernel.readAccepted("make-decision"));
    const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
    const boundKernel = createTaskKernel(task, { workspace, artifacts });
    const checkpoint = boundKernel.createCheckpoint("build-spec");
    const unexpected = kind === "tracked" ? "README.md" : "unexpected.txt";
    writeFileSync(join(workspace.worktreeRoot, unexpected), "must not enter the checkpoint\n");
    const upstream_refs = [{ task_id: "task-one", stage: "make-decision", accepted_ref: "results/make-decision/accepted.json" }];

    expect(() => boundKernel.publishAttempt("build-spec", {
      facts: { spec_ref: "specs/task-one/spec.md", checkpoint }, upstream_refs,
    })).toThrow(/unexpected|changed path|checkpoint/i);
    expect(String(execFileSync("git", ["for-each-ref", "--format=%(refname)", "refs/workflowhub/checkpoints/"], { cwd: repo }))).toBe("");
  });

  it("derives checkpoint trees from authenticated upstream facts and rejects upstream drift", () => {
    const { task, kernel } = fixture();
    const candidate = prepareTaskWorkspace(task);
    writeFileSync(join(candidate.worktreeRoot, "decision-context.txt"), "accepted context\n");
    const decision = kernel.publishAttempt("make-decision", { facts: {
      worktree_root: candidate.worktreeRoot,
      baseline_commit: candidate.baselineCommit,
      snapshot_tree: candidate.captureSnapshot().tree,
    } });
    kernel.acceptAttempt("make-decision", decision.attempt_ref, confirmation(kernel, "make-decision", decision.attempt_ref));
    const workspace = openAcceptedWorkspace(task, kernel.readAccepted("make-decision"));
    const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
    const boundKernel = createTaskKernel(task, { workspace, artifacts });
    artifacts.writeAtomic("spec.md", "# Spec\n");
    const specAttempt = boundKernel.publishAttempt("build-spec", {
      facts: { spec_ref: artifacts.reference("spec.md"), checkpoint: boundKernel.createCheckpoint("build-spec") },
      upstream_refs: [{ task_id: "task-one", stage: "make-decision", accepted_ref: "results/make-decision/accepted.json" }],
    });
    const acceptedSpec = boundKernel.acceptAttempt("build-spec", specAttempt.attempt_ref);
    expect(String(execFileSync("git", ["show", `${acceptedSpec.checkpoint.commit_oid}:decision-context.txt`], { cwd: workspace.worktreeRoot }))).toBe("accepted context\n");

    writeFileSync(join(workspace.worktreeRoot, "decision-context.txt"), "drifted context\n");
    artifacts.writeAtomic("plan.md", "# Plan\n");
    artifacts.writeAtomic("tasks.md", "# Tasks\n");
    expect(() => boundKernel.publishAttempt("build-plan", {
      facts: { plan_ref: artifacts.reference("plan.md"), tasks_ref: artifacts.reference("tasks.md"), checkpoint: boundKernel.createCheckpoint("build-plan") },
      upstream_refs: [{ task_id: "task-one", stage: "build-spec", accepted_ref: "results/build-spec/accepted.json" }],
    })).toThrow(/upstream|checkpoint|changed|drift/i);
  });

  it("reads legacy automatic-stage accepted records that have a human ref and no acceptance mode", () => {
    const { kernel } = fixture();
    const decision = kernel.publishAttempt("make-decision", { facts: { worktree_root: "/repo", baseline_commit: "a".repeat(40), decision: "go" } });
    const accepted = kernel.acceptAttempt("make-decision", decision.attempt_ref, confirmation(kernel, "make-decision", decision.attempt_ref));
    const legacy = { ...accepted, stage: "build-code", human_confirmation_ref: "confirmations/build-code/attempt-0001.json" };
    delete legacy.acceptance_mode;
    expect(() => validateAccepted(legacy, { taskId: "task-one", stage: "build-code" })).not.toThrow();
  });

  it("resolves only declared upstream slots and keeps source read-only", () => {
    const source = fixture();
    const published = source.kernel.publishAttempt("make-decision", { facts: { worktree_root: "/repo", baseline_commit: "a".repeat(40), decision: "go" } });
    source.kernel.acceptAttempt("make-decision", published.attempt_ref, confirmation(source.kernel, "make-decision", published.attempt_ref));
    const consumer = fixture({ decision: `${source.task.taskPath}/results/make-decision/accepted.json` });
    expect(consumer.kernel.readInput("decision").facts.decision).toBe("go");
    expect(() => consumer.kernel.readInput("unknown")).toThrow(/slot|input/i);
    expect(() => consumer.kernel.publishInput("decision", {})).toThrow(/read-only|unsupported/i);
  });

  it("linearizes publish and accept across processes", async () => {
    const { task, kernel } = fixture();
    const initial = kernel.publishAttempt("make-decision", { facts: { worktree_root: "/repo", baseline_commit: "a".repeat(40) } });
    const confirmationRef = confirmation(kernel, "make-decision", initial.attempt_ref);
    const handleModule = pathToFileURL(join(process.cwd(), "core/task-handle.mjs")).href;
    const kernelModule = pathToFileURL(join(process.cwd(), "core/task-kernel.mjs")).href;
    const worker = async (operation) => execFileAsync(process.execPath, ["--input-type=module", "-e", `
      import { openTask } from ${JSON.stringify(handleModule)};
      import { createTaskKernel } from ${JSON.stringify(kernelModule)};
      const task = openTask(${JSON.stringify(task.taskPath)}, { projectName: "Demo", taskId: "task-one" });
      const kernel = createTaskKernel(task);
      try {
        if (${JSON.stringify(operation)} === "accept") kernel.acceptAttempt("make-decision", ${JSON.stringify(initial.attempt_ref)}, ${JSON.stringify(confirmationRef)});
        else kernel.publishAttempt("make-decision", { facts: { worktree_root: "/repo", baseline_commit: "b".repeat(40) } });
        process.stdout.write("ok");
      } catch (error) {
        process.stdout.write("blocked:" + error.message);
      }
    `]);
    const [accept, publish] = await Promise.all([worker("accept"), worker("publish")]);
    expect(accept.stdout).toBe("ok");
    expect(publish.stdout === "ok" || /accepted|closed/i.test(publish.stdout)).toBe(true);
    expect(() => kernel.publishAttempt("make-decision", { facts: { worktree_root: "/repo", baseline_commit: "c".repeat(40) } }))
      .toThrow(/accepted|closed/i);
  });
});
