import { afterEach, describe, expect, it } from "vitest";
import { lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";

import { createTask } from "../task-handle.mjs";
import { assertWorkspace, createTaskWorktreeRemoval, openAcceptedWorkspace, openCurrentTaskWorkspace, prepareTaskWorkspace, recoverTaskWorkspace, validateTaskWorkspaceAttempt } from "../workspace.mjs";
import { canonical, sha256 } from "../task-recovery.mjs";
import { runRecovery } from "../../scripts/task-recovery.mjs";

const roots = [];

function git(cwd, args) {
  return String(execFileSync("git", args, { cwd, encoding: "utf8" })).trim();
}

function registeredWorktrees(repo) {
  return git(repo, ["worktree", "list", "--porcelain"])
    .split("\n")
    .filter((line) => line.startsWith("worktree "))
    .map((line) => realpathSync(line.slice("worktree ".length)));
}

function writeFixtureRecord(task, ref, raw) {
  const path = join(task.taskPath, ref);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, raw);
}

function workspaceIdentity(worktreeRoot) {
  const root = realpathSync(worktreeRoot);
  const common = git(root, ["rev-parse", "--git-common-dir"]);
  return {
    worktree_root: root,
    git_common_dir: realpathSync(isAbsolute(common) ? common : resolve(root, common)),
    branch: git(root, ["symbolic-ref", "--quiet", "--short", "HEAD"]),
    head: git(root, ["rev-parse", "HEAD"]),
    snapshot_tree: git(root, ["rev-parse", "HEAD^{tree}"]),
  };
}

function installDirtyRebindAuthorization(task, {
  previousWorkspace,
  cleanWorkspace,
  retainedArtifactRefs,
  nonce = "formal-dirty-rebind",
  decision = "accepted",
} = {}) {
  const authorizedSubject = {
    previous_workspace: previousWorkspace,
    clean_workspace: cleanWorkspace,
    retained_artifact_refs: retainedArtifactRefs,
    next_stage: "task-close",
  };
  const authorization = {
    schema_version: "workflowhub-dirty-cleanup-rebind-authorization.v1",
    project_name: task.identity.projectName,
    task_id: task.identity.taskId,
    purpose: "dirty-cleanup-rebind",
    recovery_kind: "dirty-cleanup-rebind",
    decision,
    credential_nonce: nonce,
    single_use: true,
    accepted_business_snapshot: {
      ref: "results/make-decision/accepted.json",
      hash: sha256(task.readRecord("results/make-decision/accepted.json")),
    },
    credential_subject_hash: sha256(canonical(authorizedSubject)),
    ...authorizedSubject,
    authorized_at: "2026-07-29T00:00:00.000Z",
  };
  const raw = canonical(authorization);
  const hash = sha256(raw);
  const ref = `evidence/authorizations/dirty-cleanup-rebind/${hash}.json`;
  writeFixtureRecord(task, ref, raw);
  return { ref, hash, nonce, authorization };
}

function formalDirtyRebindArgs(task, runnerRoot, authorization) {
  return [
    "dirty-cleanup-rebind",
    `--task-path=${task.taskPath}`,
    `--project=${task.identity.projectName}`,
    `--task=${task.identity.taskId}`,
    `--runner-root=${runnerRoot}`,
    `--authorization-ref=${authorization.ref}`,
    `--authorization-hash=${authorization.hash}`,
    `--previous-workspace-root=${authorization.authorization.previous_workspace.worktree_root}`,
    `--clean-workspace-root=${authorization.authorization.clean_workspace.worktree_root}`,
    `--retained-artifact-refs=${authorization.authorization.retained_artifact_refs.map(({ ref }) => ref).join(",")}`,
    `--retained-artifact-hashes=${authorization.authorization.retained_artifact_refs.map(({ hash }) => hash).join(",")}`,
    `--nonce=${authorization.nonce}`,
  ];
}

function fixture(taskId = "task-one") {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-worktree-manager-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  execFileSync("git", ["init", "-q"], { cwd: repo });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
  execFileSync("git", ["commit", "--allow-empty", "-qm", "baseline"], { cwd: repo });
  const baseline = String(execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo })).trim();
  const runnerRoot = join(root, "runner");
  mkdirSync(join(runnerRoot, "workflows", "build-code"), { recursive: true });
  execFileSync("git", ["init", "-q"], { cwd: runnerRoot });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: runnerRoot });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: runnerRoot });
  writeFileSync(join(runnerRoot, "AGENTS.md"), "# Runner\n");
  writeFileSync(join(runnerRoot, "CONSTITUTION.md"), "# Constitution\n");
  writeFileSync(join(runnerRoot, "workflows", "build-code", "SKILL.md"), "# build-code\n");
  execFileSync("git", ["add", "."], { cwd: runnerRoot });
  execFileSync("git", ["commit", "-qm", "runner"], { cwd: runnerRoot });
  const task = createTask({ storageRoot: root, manifest: {
    schema_version: "1.0.0", project_name: "Demo", task_id: taskId,
    created_at: "2026-07-16T00:00:00.000Z", target_repo_root: repo,
    issue_ids: [], inputs: {},
  } });
  return { root, repo, runnerRoot: realpathSync(runnerRoot), baseline, task, expectedRoot: `${repo}-${taskId}` };
}

function installAcceptedAndDirtyRebind(task, candidate, repo, runnerRoot, { authorization = "accepted", distinctClean = false } = {}) {
  const previousWorktreeRoot = candidate.worktreeRoot;
  const oldTree = git(previousWorktreeRoot, ["rev-parse", "HEAD^{tree}"]);
  const accepted = { facts: { worktree_root: previousWorktreeRoot, baseline_commit: candidate.baselineCommit, snapshot_tree: oldTree } };
  const acceptedRaw = canonical(accepted);
  writeFixtureRecord(task, "results/make-decision/accepted.json", acceptedRaw);
  let worktreeRoot = previousWorktreeRoot;
  if (distinctClean) {
    writeFileSync(join(previousWorktreeRoot, "old-dirty-user.txt"), "old dirty user bytes\n");
    worktreeRoot = join(dirname(repo), `${task.identity.taskId}-clean-worktree`);
    execFileSync("git", ["worktree", "add", "--force", "-q", worktreeRoot, `task/${task.identity.projectName}/${task.identity.taskId}`], { cwd: repo });
  }
  writeFileSync(join(worktreeRoot, "retained-user.txt"), "retained user bytes\n");
  execFileSync("git", ["add", "retained-user.txt"], { cwd: worktreeRoot });
  execFileSync("git", ["commit", "-qm", "user makes workspace clean"], { cwd: worktreeRoot });
  const cleanTree = git(worktreeRoot, ["rev-parse", "HEAD^{tree}"]);
  const retained = [];
  for (const [index, ref] of ["receipts/decision-log.json", "receipts/spec.json", "receipts/plan.json", "receipts/tasks.json"].entries()) {
    const raw = `retained-${index}`;
    writeFixtureRecord(task, ref, raw);
    retained.push({ ref, hash: sha256(raw) });
  }
  const authorizationRecord = installDirtyRebindAuthorization(task, {
    previousWorkspace: workspaceIdentity(previousWorktreeRoot),
    cleanWorkspace: workspaceIdentity(worktreeRoot),
    retainedArtifactRefs: retained,
    nonce: `rebind-${authorization}`,
    decision: authorization,
  });
  const argv = formalDirtyRebindArgs(task, runnerRoot, authorizationRecord);
  return {
    accepted, acceptedRaw, authorizationRef: authorizationRecord.ref,
    authorizationRaw: task.readRecord(authorizationRecord.ref), authorizationRecord,
    cleanTree, retained, argv, previousWorktreeRoot, worktreeRoot,
  };
}

afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

describe("deterministic WorktreeManager", () => {
  it("creates and safely reuses the exact task worktree", () => {
    const { task, repo, baseline, expectedRoot } = fixture();
    const mainStatus = git(repo, ["status", "--porcelain", "--untracked-files=all"]);
    expect(registeredWorktrees(repo)).toEqual([realpathSync(repo)]);
    const first = prepareTaskWorkspace(task);
    expect(first).toMatchObject({
      worktreeRoot: realpathSync(expectedRoot),
      baselineCommit: baseline,
      branch: "task/Demo/task-one",
    });
    const firstIdentity = lstatSync(first.worktreeRoot);
    expect(registeredWorktrees(repo)).toEqual([realpathSync(repo), first.worktreeRoot]);
    expect(git(repo, ["rev-parse", "HEAD"])).toBe(baseline);
    expect(git(repo, ["status", "--porcelain", "--untracked-files=all"])).toBe(mainStatus);
    const retry = prepareTaskWorkspace(task);
    expect(retry).toMatchObject({ worktreeRoot: first.worktreeRoot, baselineCommit: baseline });
    const retryIdentity = lstatSync(retry.worktreeRoot);
    expect({ dev: retryIdentity.dev, ino: retryIdentity.ino }).toEqual({ dev: firstIdentity.dev, ino: firstIdentity.ino });
    expect(registeredWorktrees(repo)).toEqual([realpathSync(repo), first.worktreeRoot]);
    expect(git(repo, ["rev-parse", "HEAD"])).toBe(baseline);
    expect(git(repo, ["status", "--porcelain", "--untracked-files=all"])).toBe(mainStatus);
  });

  it("reuses the existing task worktree after main advances and becomes dirty", () => {
    const { task, repo, baseline } = fixture("retry-after-main-change");
    const first = prepareTaskWorkspace(task);
    execFileSync("git", ["commit", "--allow-empty", "-qm", "main advanced"], { cwd: repo });
    const advancedMain = git(repo, ["rev-parse", "HEAD"]);
    writeFileSync(join(repo, "dirty.txt"), "dirty");

    const retry = prepareTaskWorkspace(task);

    expect(retry).toMatchObject({ worktreeRoot: first.worktreeRoot, baselineCommit: baseline });
    expect(git(repo, ["rev-parse", "HEAD"])).toBe(advancedMain);
    expect(git(repo, ["status", "--porcelain", "--untracked-files=all"])).toContain("dirty.txt");
  });

  it("fails loud instead of rebinding baseline after a task-only commit", () => {
    const { task, repo, baseline, expectedRoot } = fixture("retry-after-task-commit");
    const first = prepareTaskWorkspace(task);
    const firstIdentity = lstatSync(first.worktreeRoot);
    execFileSync("git", ["commit", "--allow-empty", "-qm", "task-only commit"], { cwd: expectedRoot });
    const taskOnlyHead = git(expectedRoot, ["rev-parse", "HEAD"]);

    expect(() => prepareTaskWorkspace(task)).toThrow(/not an ancestor|fallback|baseline rebinding/i);

    const currentIdentity = lstatSync(expectedRoot);
    expect(git(expectedRoot, ["rev-parse", "HEAD"])).toBe(taskOnlyHead);
    expect(git(repo, ["rev-parse", "HEAD"])).toBe(baseline);
    expect({ dev: currentIdentity.dev, ino: currentIdentity.ino }).toEqual({ dev: firstIdentity.dev, ino: firstIdentity.ino });
    expect(registeredWorktrees(repo)).toEqual([realpathSync(repo), realpathSync(expectedRoot)]);
  });

  it("exposes a dedicated recovery API without weakening ordinary prepare", async () => {
    const { task, expectedRoot } = fixture("dedicated-recovery-api");
    const first = prepareTaskWorkspace(task);
    const firstWorktreeRoot = first.worktreeRoot;
    execFileSync("git", ["commit", "--allow-empty", "-qm", "task-only commit"], { cwd: expectedRoot });

    expect(() => prepareTaskWorkspace(task)).toThrow(/not an ancestor|fallback|baseline rebinding/i);

    const workspaceApi = await import("../workspace.mjs");
    expect(workspaceApi.recoverTaskWorkspace).toBeTypeOf("function");
    const recovered = workspaceApi.recoverTaskWorkspace(task);
    expect(recovered).toMatchObject({
      worktreeRoot: firstWorktreeRoot,
      baselineCommit: git(expectedRoot, ["rev-parse", "HEAD"]),
      branch: "task/Demo/dedicated-recovery-api",
    });
  });

  it("rejects recovery after the deterministic branch was orphaned or force-rewound from its reflog origin", () => {
    const orphaned = fixture("recovery-orphaned");
    const orphanedCandidate = prepareTaskWorkspace(orphaned.task);
    const orphanedWorktreeRoot = orphanedCandidate.worktreeRoot;
    const emptyTree = git(orphanedWorktreeRoot, ["mktree"]);
    const orphan = String(execFileSync("git", ["commit-tree", emptyTree], {
      cwd: orphanedWorktreeRoot,
      encoding: "utf8",
      input: "orphan replacement\n",
    })).trim();
    execFileSync("git", ["reset", "--hard", "-q", orphan], { cwd: orphanedWorktreeRoot });
    expect(() => recoverTaskWorkspace(orphaned.task)).toThrow(/reflog|origin|ancestor|force/i);

    const rewound = fixture("recovery-force-rewound");
    const rewoundCandidate = prepareTaskWorkspace(rewound.task);
    const rewoundWorktreeRoot = rewoundCandidate.worktreeRoot;
    execFileSync("git", ["commit", "--allow-empty", "-qm", "legitimate task work"], { cwd: rewoundWorktreeRoot });
    execFileSync("git", ["reset", "--hard", "-q", rewound.baseline], { cwd: rewoundWorktreeRoot });
    expect(() => recoverTaskWorkspace(rewound.task)).toThrow(/reflog|origin|ancestor|force/i);
  });

  it("rechecks cleanliness when a recovered workspace candidate is consumed", () => {
    const { task } = fixture("recovery-dirtied-after-open");
    const candidate = prepareTaskWorkspace(task);
    const recovered = recoverTaskWorkspace(task);
    writeFileSync(join(candidate.worktreeRoot, "late-dirty.txt"), "late user bytes\n");

    expect(() => recovered.assertValid()).toThrow(/clean|dirty|status/i);
  });

  it.each([
    ["another branch", ["switch", "-q", "-c", "other"]],
    ["detached HEAD", ["checkout", "-q", "--detach"]],
  ])("invalidates an accepted Workspace immediately after switching to %s", (_label, args) => {
    const { task } = fixture(`accepted-${args[0] === "switch" ? "branch" : "detached"}`);
    const candidate = prepareTaskWorkspace(task);
    const worktreeRoot = candidate.worktreeRoot;
    const workspace = openAcceptedWorkspace(task, { facts: {
      worktree_root: worktreeRoot,
      baseline_commit: candidate.baselineCommit,
    } });
    execFileSync("git", ["commit", "--allow-empty", "-qm", "implementation checkpoint"], { cwd: worktreeRoot });
    expect(() => workspace.worktreeRoot).not.toThrow();

    execFileSync("git", args, { cwd: worktreeRoot });

    expect(() => workspace.worktreeRoot).toThrow(/branch|deterministic|registration/i);
    expect(() => assertWorkspace(workspace)).toThrow(/branch|deterministic|registration/i);
  });

  it("rejects caller workspace arguments and mismatched attempt facts", () => {
    const { task } = fixture();
    const candidate = prepareTaskWorkspace(task);
    expect(() => prepareTaskWorkspace(task, { worktreeRoot: "/tmp/other" })).toThrow(/only a TaskHandle|caller-supplied/i);
    expect(() => validateTaskWorkspaceAttempt(task, {
      worktree_root: candidate.worktreeRoot,
      baseline_commit: "a".repeat(40),
    })).toThrow(/baseline/i);
  });

  it("fails loud on path/branch conflicts and dirty repositories", () => {
    const first = fixture("path-conflict");
    mkdirSync(first.expectedRoot);
    expect(() => prepareTaskWorkspace(first.task)).toThrow(/path\/branch conflict/i);

    const second = fixture("dirty-target");
    writeFileSync(join(second.repo, "dirty.txt"), "dirty");
    expect(() => prepareTaskWorkspace(second.task)).toThrow(/must be clean/i);
  });

  it("rebinds through the latest generation, preserves user bytes and third-party pointers, and replays exactly", () => {
    const { task, repo, runnerRoot } = fixture("dirty-rebind");
    const candidate = prepareTaskWorkspace(task);
    const setup = installAcceptedAndDirtyRebind(task, candidate, repo, runnerRoot);
    const thirdPartyRaw = canonical({ phase_id: "third-party", status: "done" });
    task.writeRecordAtomic("phase-result.json", thirdPartyRaw);

    const first = runRecovery(setup.argv);
    const generationRaw = task.readRecord(first.recovery_ref);
    const replay = runRecovery(setup.argv);

    expect(first).toMatchObject({ generation: 1, next_entry: "normal task-close", replayed: false });
    expect(replay).toMatchObject({ recovery_ref: first.recovery_ref, recovery_hash: first.recovery_hash, generation: 1, replayed: true });
    expect(task.listRecoveryGenerationRefs("dirty-cleanup-rebind")).toEqual([first.recovery_ref]);
    expect(task.readRecord(first.recovery_ref)).toBe(generationRaw);
    expect(task.readRecord("phase-result.json")).toBe(thirdPartyRaw);
    expect(task.readRecord("results/make-decision/accepted.json")).toBe(setup.acceptedRaw);
    expect(readFileSync(join(setup.worktreeRoot, "retained-user.txt"), "utf8")).toBe("retained user bytes\n");
    for (const retained of setup.retained) expect(sha256(task.readRecord(retained.ref))).toBe(retained.hash);
    expect(openAcceptedWorkspace(task, setup.accepted).worktreeRoot).toBe(setup.worktreeRoot);
    expect(openCurrentTaskWorkspace(task).worktreeRoot).toBe(setup.worktreeRoot);

    const secondAuthorization = installDirtyRebindAuthorization(task, {
      previousWorkspace: workspaceIdentity(setup.worktreeRoot),
      cleanWorkspace: workspaceIdentity(setup.worktreeRoot),
      retainedArtifactRefs: setup.retained,
      nonce: "rebind-second",
    });
    const secondArgv = formalDirtyRebindArgs(task, runnerRoot, secondAuthorization);
    const second = runRecovery(secondArgv);
    expect(second).toMatchObject({ generation: 2, replayed: false, next_entry: "normal task-close" });
    expect(task.listRecoveryGenerationRefs("dirty-cleanup-rebind")).toEqual([first.recovery_ref, second.recovery_ref]);
    expect(JSON.parse(task.readRecord(second.recovery_ref))).toMatchObject({
      previous_generation_ref: first.recovery_ref,
      previous_generation_hash: first.recovery_hash,
    });
    expect(readFileSync(join(setup.worktreeRoot, "retained-user.txt"), "utf8")).toBe("retained user bytes\n");
    expect(openCurrentTaskWorkspace(task).worktreeRoot).toBe(setup.worktreeRoot);
  });

  it("rejects missing human authorization without publishing or changing user and pointer bytes", () => {
    const { task, repo, runnerRoot } = fixture("dirty-rebind-denied");
    const candidate = prepareTaskWorkspace(task);
    const setup = installAcceptedAndDirtyRebind(task, candidate, repo, runnerRoot, { authorization: "denied" });
    const thirdPartyRaw = canonical({ phase_id: "third-party", status: "done" });
    task.writeRecordAtomic("phase-result.json", thirdPartyRaw);

    expect(() => runRecovery(setup.argv)).toThrow(/RECOVERY_AUTHORIZATION_INVALID/);
    expect(task.listRecoveryGenerationRefs("dirty-cleanup-rebind")).toEqual([]);
    expect(task.readRecord("phase-result.json")).toBe(thirdPartyRaw);
    expect(readFileSync(join(setup.worktreeRoot, "retained-user.txt"), "utf8")).toBe("retained user bytes\n");
  });

  it("runs the shared write-boundary preflight before dirty rebind and leaves all business bytes unchanged on failure", () => {
    const { task, repo, runnerRoot } = fixture("dirty-rebind-preflight");
    const candidate = prepareTaskWorkspace(task);
    const setup = installAcceptedAndDirtyRebind(task, candidate, repo, runnerRoot);
    const thirdPartyRaw = canonical({ phase_id: "third-party", status: "done" });
    task.writeRecordAtomic("phase-result.json", thirdPartyRaw);
    writeFileSync(join(runnerRoot, "dirty-runtime.txt"), "uncommitted runner bytes\n");

    expect(() => runRecovery(setup.argv)).toThrow(/clean|WRITE_BOUNDARY_PREFLIGHT_FAILED/i);
    expect(task.listRecoveryGenerationRefs("dirty-cleanup-rebind")).toEqual([]);
    expect(task.readRecord("results/make-decision/accepted.json")).toBe(setup.acceptedRaw);
    expect(task.readRecord("phase-result.json")).toBe(thirdPartyRaw);
    expect(readFileSync(join(setup.worktreeRoot, "retained-user.txt"), "utf8")).toBe("retained user bytes\n");
  });

  it.each([
    [{ decision: "accepted" }, "missing schema and task"],
    [{ schema_version: "human-authorization.v1", task_id: "wrong-task", decision: "accepted" }, "wrong task"],
    [{ schema_version: "human-authorization.v1", task_id: "dirty-rebind-auth-alias", status: "accepted" }, "status alias"],
    [{ schema_version: "human-authorization.v1", task_id: "dirty-rebind-auth-alias", decision: "approved" }, "decision alias"],
  ])("rejects %s authorization aliases with zero generation writes", (authorization, _label) => {
    const { task, repo, runnerRoot } = fixture("dirty-rebind-auth-alias");
    const candidate = prepareTaskWorkspace(task);
    const setup = installAcceptedAndDirtyRebind(task, candidate, repo, runnerRoot);
    const raw = canonical(authorization);
    writeFixtureRecord(task, setup.authorizationRef, raw);
    expect(() => runRecovery(setup.argv)).toThrow(/RECOVERY_AUTHORIZATION_INVALID/);
    expect(task.listRecoveryGenerationRefs("dirty-cleanup-rebind")).toEqual([]);
    expect(readFileSync(join(setup.worktreeRoot, "retained-user.txt"), "utf8")).toBe("retained user bytes\n");
  });

  it("detects accepted-record CAS drift before generation publish and keeps the concurrent bytes", () => {
    const { task, repo, runnerRoot } = fixture("dirty-rebind-cas");
    const candidate = prepareTaskWorkspace(task);
    const setup = installAcceptedAndDirtyRebind(task, candidate, repo, runnerRoot);
    const concurrentRaw = canonical({ facts: { concurrent: true } });

    expect(() => runRecovery(setup.argv, {
      beforeGenerationCreate() { writeFileSync(join(task.taskPath, "results/make-decision/accepted.json"), concurrentRaw); },
    })).toThrow(/RECOVERY_CONCURRENT_CHANGE/);
    expect(task.listRecoveryGenerationRefs("dirty-cleanup-rebind")).toEqual([]);
    expect(task.readRecord("results/make-decision/accepted.json")).toBe(concurrentRaw);
    expect(readFileSync(join(setup.worktreeRoot, "retained-user.txt"), "utf8")).toBe("retained user bytes\n");
  });

  it("rejects a dirty clean-workspace postcondition with zero generation and pointer writes", () => {
    const { task, repo, runnerRoot } = fixture("dirty-rebind-postcondition");
    const candidate = prepareTaskWorkspace(task);
    const setup = installAcceptedAndDirtyRebind(task, candidate, repo, runnerRoot);
    const thirdPartyRaw = canonical({ phase_id: "third-party", status: "done" });
    task.writeRecordAtomic("phase-result.json", thirdPartyRaw);
    writeFileSync(join(setup.worktreeRoot, "postcondition-drift.txt"), "third-party drift\n");

    expect(() => runRecovery(setup.argv)).toThrow(/clean workspace postcondition is not clean/);
    expect(task.listRecoveryGenerationRefs("dirty-cleanup-rebind")).toEqual([]);
    expect(task.readRecord("phase-result.json")).toBe(thirdPartyRaw);
    expect(readFileSync(join(setup.worktreeRoot, "postcondition-drift.txt"), "utf8")).toBe("third-party drift\n");
  });

  it("selects a distinct authenticated clean root for normal close removal and leaves the old dirty root untouched", () => {
    const { task, repo, runnerRoot } = fixture("dirty-rebind-distinct");
    const candidate = prepareTaskWorkspace(task);
    const setup = installAcceptedAndDirtyRebind(task, candidate, repo, runnerRoot, { distinctClean: true });

    runRecovery(setup.argv);
    const acceptedWorkspace = openAcceptedWorkspace(task, setup.accepted);
    const currentWorkspace = openCurrentTaskWorkspace(task);
    const removal = createTaskWorktreeRemoval(task, {
      taskId: task.identity.taskId,
      stage: "make-decision",
      worktreeRoot: acceptedWorkspace.worktreeRoot,
      baselineCommit: setup.accepted.facts.baseline_commit,
    });

    expect(acceptedWorkspace.worktreeRoot).toBe(realpathSync(setup.worktreeRoot));
    expect(currentWorkspace.worktreeRoot).toBe(realpathSync(setup.worktreeRoot));
    expect(removal.probe()).toEqual({ satisfied: false, worktree_root: realpathSync(setup.worktreeRoot) });
    expect(readFileSync(join(setup.previousWorktreeRoot, "old-dirty-user.txt"), "utf8")).toBe("old dirty user bytes\n");
    expect(git(setup.previousWorktreeRoot, ["status", "--porcelain", "--untracked-files=all"])).toContain("old-dirty-user.txt");
  });

  it("issues and consumes a dirty rebind credential through the formal registry-driven CLI path", () => {
    const { task, repo, runnerRoot } = fixture("dirty-rebind-formal-producer");
    const candidate = prepareTaskWorkspace(task);
    const setup = installAcceptedAndDirtyRebind(task, candidate, repo, runnerRoot);
    const authorization = installDirtyRebindAuthorization(task, {
      previousWorkspace: workspaceIdentity(setup.previousWorktreeRoot),
      cleanWorkspace: workspaceIdentity(setup.worktreeRoot),
      retainedArtifactRefs: setup.retained,
    });

    const issued = runRecovery(formalDirtyRebindArgs(task, runnerRoot, authorization));
    const replayed = runRecovery(formalDirtyRebindArgs(task, runnerRoot, authorization));

    expect(issued).toMatchObject({
      credential_ref: `identity/recovery-credentials/dirty-cleanup-rebind/${authorization.nonce}.json`,
      credential_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
      generation: 1,
      replayed: false,
      next_entry: "normal task-close",
    });
    expect(JSON.parse(task.readRecord(issued.credential_ref)).workspace_subject).toMatchObject({
      previous_workspace: authorization.authorization.previous_workspace,
      clean_workspace: authorization.authorization.clean_workspace,
      authorization: { ref: authorization.ref, hash: authorization.hash },
      retained_artifact_refs: setup.retained,
      next_stage: "task-close",
    });
    expect(replayed).toMatchObject({
      credential_ref: issued.credential_ref,
      credential_hash: issued.credential_hash,
      recovery_ref: issued.recovery_ref,
      recovery_hash: issued.recovery_hash,
      generation: 1,
      replayed: true,
      next_entry: "normal task-close",
    });
  });

  it("rejects authorization whose bound subject differs from the real previous workspace", () => {
    const { task, repo, runnerRoot } = fixture("dirty-rebind-formal-subject");
    const candidate = prepareTaskWorkspace(task);
    const setup = installAcceptedAndDirtyRebind(task, candidate, repo, runnerRoot);
    const forgedPrevious = { ...workspaceIdentity(setup.previousWorktreeRoot), head: "f".repeat(40) };
    const authorization = installDirtyRebindAuthorization(task, {
      previousWorkspace: forgedPrevious,
      cleanWorkspace: workspaceIdentity(setup.worktreeRoot),
      retainedArtifactRefs: setup.retained,
      nonce: "forged-previous",
    });

    expect(() => runRecovery(formalDirtyRebindArgs(task, runnerRoot, authorization)))
      .toThrow(/RECOVERY_(AUTHORIZATION|CREDENTIAL)_INVALID|previous workspace/i);
    expect(() => task.readRecord(`identity/recovery-credentials/dirty-cleanup-rebind/${authorization.nonce}.json`))
      .toThrow();
    expect(task.listRecoveryGenerationRefs("dirty-cleanup-rebind")).toEqual([]);
  });

  it("rejects retained artifact refs that differ from the authorized credential subject", () => {
    const { task, repo, runnerRoot } = fixture("dirty-rebind-formal-artifacts");
    const candidate = prepareTaskWorkspace(task);
    const setup = installAcceptedAndDirtyRebind(task, candidate, repo, runnerRoot);
    const authorization = installDirtyRebindAuthorization(task, {
      previousWorkspace: workspaceIdentity(setup.previousWorktreeRoot),
      cleanWorkspace: workspaceIdentity(setup.worktreeRoot),
      retainedArtifactRefs: setup.retained,
      nonce: "forged-artifacts",
    });
    const replacementRef = "receipts/replacement-retained.json";
    const replacementRaw = "different retained bytes";
    writeFixtureRecord(task, replacementRef, replacementRaw);
    const argv = formalDirtyRebindArgs(task, runnerRoot, authorization).map((arg) => (
      arg.startsWith("--retained-artifact-refs=") ? `--retained-artifact-refs=${replacementRef}`
        : arg.startsWith("--retained-artifact-hashes=") ? `--retained-artifact-hashes=${sha256(replacementRaw)}`
          : arg
    ));

    expect(() => runRecovery(argv)).toThrow(/RECOVERY_AUTHORIZATION_INVALID|subject binding/i);
    expect(() => task.readRecord(`identity/recovery-credentials/dirty-cleanup-rebind/${authorization.nonce}.json`))
      .toThrow();
    expect(task.listRecoveryGenerationRefs("dirty-cleanup-rebind")).toEqual([]);
  });
});
