import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { inspectWorkspace, assertCleanTarget } from "../runtime/interface/workspace-check.mjs";
import { withLock } from "../runtime/interface/record-lock.mjs";
import { appendRecord } from "../runtime/interface/safe-write.mjs";
import { recordConfirmation } from "../runtime/interface/human-confirm.mjs";
import { readTaskFacts } from "../runtime/task/task-store.mjs";
import { openTask } from "../runtime/task/task-handle.mjs";

const OPERATIONS = new Set(["commit", "merge", "archive", "push", "cleanup"]);
const AUTH = fileURLToPath(new URL("../runtime/interface/git-authorize.mjs", import.meta.url));
const SIDECARS = ["quality/", "evidence/", ".multica/", "qa-artifacts/"];
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function failure(code, message) { return Object.assign(new Error(message), { code }); }
function gitEnv() {
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (key.startsWith("GIT_")) delete env[key];
  env.GIT_OPTIONAL_LOCKS = "0";
  return env;
}
function git(root, argv, { optional = false } = {}) {
  const result = spawnSync("git", argv, { cwd: root, env: gitEnv(), encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0 && !optional) throw failure("GIT_COMMAND_FAILED", `git ${argv.join(" ")} failed: ${result.stderr}`);
  return optional ? result : result.stdout.trimEnd();
}
function safeRelative(value, label) {
  if (typeof value !== "string" || !value || isAbsolute(value) || value.includes("\0") || value.split(/[\\/]/).some((p) => p === ".." || p === "")) throw failure("UNSAFE_PATH", `${label} must be a relative path`);
  return value;
}
function realDirectory(path) {
  const absolute = resolve(path); let cursor = sep;
  for (const part of absolute.slice(1).split(sep)) {
    cursor = join(cursor, part);
    const stat = lstatSync(cursor);
    if (!stat.isDirectory() || stat.isSymbolicLink() || realpathSync(cursor) !== cursor) throw failure("PATH_ALIAS", `not a canonical real directory: ${cursor}`);
  }
  return absolute;
}
function readFile(root, rel) {
  safeRelative(rel, "file"); const path = join(root, rel); let cursor = root;
  for (const part of rel.split(/[\\/]/)) {
    cursor = join(cursor, part);
    if (lstatSync(cursor).isSymbolicLink() || realpathSync(cursor) !== cursor) throw failure("PATH_ALIAS", `aliased file path: ${cursor}`);
  }
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.nlink !== 1) throw failure("UNSAFE_FILE", `a singly linked regular file is required: ${path}`);
  return readFileSync(path);
}
function closeEvidencePath(taskDir) {
  return realDirectory(join(realDirectory(taskDir), "quality", "evidence", "close"));
}
function assertPostWriter(taskDir) {
  const directory = realDirectory(taskDir);
  const pathIdentity = directory.split(sep).slice(-4);
  const task = openTask(directory, { projectName: pathIdentity[1], taskId: pathIdentity[3] });
  if (task.manifest.activation_cohort !== "post") throw failure("TASK_HISTORY_READ_ONLY", "pre/history or unknown task metadata is read-only");
}
function evidenceDirectory(taskDir) {
  let cursor = realDirectory(taskDir);
  for (const part of ["quality", "evidence", "close"]) {
    cursor = join(cursor, part);
    if (!existsSync(cursor)) mkdirSync(cursor);
    realDirectory(cursor);
  }
  return cursor;
}
function authorizationDirectory(taskDir) {
  let cursor = realDirectory(taskDir);
  for (const part of ["quality", "evidence", "git-authorizations"]) {
    cursor = join(cursor, part); if (!existsSync(cursor)) mkdirSync(cursor); realDirectory(cursor);
  }
  return cursor;
}
function context(taskDir, { worktreeRequired = true, targetBranch = "main" } = {}) {
  const directory = realDirectory(taskDir);
  const manifest = JSON.parse(readFile(directory, "task.json"));
  if (!manifest || typeof manifest !== "object" || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(manifest.task_id ?? "") || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(manifest.project_name ?? "")) throw failure("TASK_IDENTITY_INVALID", "task.json identity is invalid");
  if (directory.split(sep).slice(-4).join("/") !== `Projects/${manifest.project_name}/tasks/${manifest.task_id}`) throw failure("TASK_PATH_MISMATCH", "task directory does not match task.json identity");
  const declaredRoot = realDirectory(manifest.target_repo_root);
  if (git(declaredRoot, ["rev-parse", "--show-toplevel"]) !== declaredRoot) throw failure("TARGET_ROOT_INVALID", "declared repository must be a Git toplevel");
  const common = realpathSync(resolve(declaredRoot, git(declaredRoot, ["rev-parse", "--git-common-dir"])));
  const registrations = git(declaredRoot, ["worktree", "list", "--porcelain", "-z"]).split("\0\0").map((block) => Object.fromEntries(block.split("\0").filter(Boolean).map((line) => [line.slice(0, line.indexOf(" ")), line.slice(line.indexOf(" ") + 1)])));
  const targets = registrations.filter((entry) => entry.branch === `refs/heads/${targetBranch}`);
  if (targets.length !== 1) throw failure("TARGET_CHECKOUT_UNAVAILABLE", "the requested target branch must have exactly one registered checkout");
  const root = realDirectory(targets[0].worktree);
  if (git(root, ["rev-parse", "--show-toplevel"]) !== root || realpathSync(resolve(root, git(root, ["rev-parse", "--git-common-dir"]))) !== common || git(root, ["branch", "--show-current"]) !== targetBranch) throw failure("TARGET_IDENTITY", "target checkout/common directory/branch differs from registration");
  const explicit = manifest.workspace_mode === "existing";
  const branch = `task/${manifest.project_name}/${manifest.task_id}`;
  const worktree = explicit ? resolve(manifest.workspace_root) : resolve(dirname(root), `${basename(root)}-${manifest.task_id}`);
  if (worktreeRequired || existsSync(worktree)) {
    if (!registrations.some((entry) => entry.worktree === worktree && (explicit || entry.branch === `refs/heads/${branch}`))) throw failure("WORKTREE_NOT_REGISTERED", "task worktree is not registered at its declared or deterministic owned path");
    realDirectory(worktree);
    if (git(worktree, ["rev-parse", "--show-toplevel"]) !== worktree || realpathSync(resolve(worktree, git(worktree, ["rev-parse", "--git-common-dir"]))) !== common) throw failure("WORKTREE_ROOT_INVALID", "task worktree must share the authenticated Git common directory");
    if (!explicit && git(worktree, ["branch", "--show-current"]) !== branch) throw failure("WORKTREE_BRANCH_MISMATCH", "task branch does not match task.json");
  }
  const facts = readTaskFacts(directory);
  return { taskDir: directory, manifest, root, worktree, explicit, facts };
}
function contextForPlan(taskDir, planRef) {
  const dir = realDirectory(taskDir), base = closeEvidencePath(dir), path = resolve(planRef);
  if (dirname(path) !== base || !/^\d{4}-\d{2}-\d{2}-\d{3}-close-plan\.json$/.test(basename(path))) throw failure("CLOSE_PLAN_REFERENCE", "an explicit task-owned ordinary plan reference is required");
  const preview = JSON.parse(readFile(base, basename(path)));
  return context(dir, { worktreeRequired: false, targetBranch: preview.target_branch });
}
function declaredTaskType(markdown) {
  const lines = String(markdown).split(/\r?\n/), heads = lines.map((line,index) => ({line,index})).filter(({line}) => /^#{1,3}\s+(?:任务身份|task identity)\s*$/i.test(line));
  if (heads.length !== 1) return "unknown";
  const start = heads[0].index + 1, end = lines.findIndex((line,index) => index >= start && /^#{1,3}\s/.test(line));
  const values = []; let fenced = false;
  const clean = text => String(text).trim().replace(/^\*+|\*+$/g, "").replace(/^`+|`+$/g, "").trim();
  for (const line of lines.slice(start, end < 0 ? undefined : end)) {
    if (/^\s*```/.test(line)) { fenced = !fenced; continue; } if (fenced) continue;
    const bullet = line.match(/^\s*[-*]\s+\*\*任务类型\*\*\s*[:：]\s*(.*?)\s*$/);
    if (bullet) values.push(clean(bullet[1]));
    else if (/^\s*\|/.test(line)) { const cells = line.split("|").slice(1,-1).map(clean); if (cells[0] === "任务类型") values.push(cells[1]); }
  }
  return values.length === 1 && ["规划任务", "普通任务"].includes(values[0]) ? values[0] : "unknown";
}
function actionFacts(c, planRef) {
  const base = closeEvidencePath(c.taskDir);
  return readdirSync(base).filter(name => /^\d{4}-\d{2}-\d{2}-\d{3}-close-action\.json$/.test(name)).sort().map(name => JSON.parse(readFile(base,name))).filter(row => row.plan_ref === planRef);
}
function entries(root) {
  const fields = git(root, ["status", "--porcelain=v1", "-z", "--untracked-files=all"]).split("\0");
  const rows = [];
  for (let i = 0; i < fields.length; i++) {
    const text = fields[i]; if (!text) continue;
    const status = text.slice(0, 2), path = safeRelative(text.slice(3), "Git status path");
    const row = { status, path };
    if (/[RC]/.test(status)) row.source_path = safeRelative(fields[++i], "rename source");
    rows.push(row);
  }
  return rows;
}
function assertNoSidecars(root, taskId) {
  const listed = git(root, ["ls-files", "--cached", "--others", "--exclude-standard", "-z"]).split("\0").filter(Boolean);
  const ignored = git(root, ["ls-files", "--others", "--ignored", "--exclude-standard", "-z"]).split("\0").filter(Boolean);
  const all = [...new Set([...listed, ...ignored, ...entries(root).map((r) => r.path)])];
  const unsafe = all.filter((p) => SIDECARS.some((prefix) => p.startsWith(prefix) || p.startsWith(`specs/${taskId}/${prefix}`)));
  if (unsafe.length) throw failure("CLOSE_EXECUTION_SIDECARS", `publish task-owned execution sidecars before close: ${unsafe.join(", ")}`);
}
function sourceState(root, taskId) {
  assertNoSidecars(root, taskId);
  const changes = entries(root).map((entry) => {
    let sha256 = null;
    if (existsSync(join(root, entry.path))) sha256 = digest(readFile(root, entry.path));
    return { ...entry, sha256 };
  });
  return { head: git(root, ["rev-parse", "HEAD"]), branch: git(root, ["branch", "--show-current"]), changes,
    index_patch: git(root, ["diff", "--cached", "--binary"]) };
}
function branchOid(root, branch) { const r = git(root, ["rev-parse", "--verify", `refs/heads/${branch}^{commit}`], { optional: true }); return r.status === 0 ? r.stdout.trim() : null; }
function remoteOid(root, remote, branch) {
  const r = git(root, ["ls-remote", "--heads", remote, `refs/heads/${branch}`], { optional: true });
  if (r.status !== 0) return { status: "unavailable", reason: r.stderr.trim() || "remote probe failed", oid: null };
  return { status: r.stdout.trim() ? "available" : "absent", reason: r.stdout.trim() ? null : "remote target ref is absent", oid: r.stdout.trim().split(/\s/)[0] || null };
}
function within(root, path) { const r = relative(root, path); return r !== "" && !r.startsWith(`..${sep}`) && r !== ".." && !isAbsolute(r); }
function prCommand(root, argv) {
  return spawnSync("gh", argv, { cwd: root, env: { ...gitEnv(), GH_PROMPT_DISABLED: "1" }, encoding: "utf8", timeout: 15000, maxBuffer: 1024 * 1024 });
}
function probePrSupport(c, { remote, head, base, baseline, sourceHead }) {
  const unavailable = (reason) => ({ status: "unavailable", reason });
  const url = git(c.worktree, ["remote", "get-url", remote]);
  const match = url.match(/^(?:https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+?)(?:\.git)?$/);
  if (!match) return unavailable("PR creation is unsupported for this remote: a GitHub repository remote is required");
  if (head === base) return unavailable("PR head and base are the same branch");
  const ahead = git(c.worktree, ["rev-list", "--count", `${baseline}..${sourceHead}`]);
  if (!/^\d+$/.test(ahead) || Number(ahead) === 0) return unavailable("task HEAD has no commits ahead of the PR base");
  const checked = (argv, label) => {
    const result = prCommand(c.worktree, argv);
    // Do not copy authentication stderr, tokens, or credential configuration
    // into a plan. Preserve the actual failure kind/exit/signal instead.
    const reason = result.error ? `${label}: ${result.error.code ?? "process error"}`
      : result.status !== 0 ? `${label}: exit ${result.status ?? "unknown"}${result.signal ? ` (${result.signal})` : ""}` : null;
    return { result, reason };
  };
  for (const [argv, label] of [[["--version"], "gh is unavailable"], [["auth", "status", "--hostname", "github.com"], "GitHub authentication probe failed"]]) {
    const { reason } = checked(argv, label); if (reason) return unavailable(reason);
  }
  const { result, reason } = checked(["repo", "view", match[1], "--json", "nameWithOwner,defaultBranchRef,viewerPermission"], "GitHub repository probe failed");
  if (reason) return unavailable(reason);
  let repository;
  try { repository = JSON.parse(result.stdout); }
  catch { return unavailable("GitHub repository probe returned invalid JSON"); }
  if (!repository || repository.nameWithOwner?.toLowerCase() !== match[1].toLowerCase() || !repository.defaultBranchRef?.name) return unavailable("GitHub repository identity or default branch could not be read");
  if (repository.viewerPermission !== undefined && !["ADMIN", "MAINTAIN", "WRITE"].includes(repository.viewerPermission)) return unavailable(`GitHub repository permission does not allow PR delivery: ${repository.viewerPermission}`);
  return { status: "available", reason: null };
}
function buildDefaultPrDescription(c, { baseline, source, head, base }) {
  const spec = readFile(c.worktree, `specs/${c.manifest.task_id}/spec.md`).toString("utf8");
  if (!spec.trim()) throw failure("PR_DESCRIPTION_INCOMPLETE", "task spec is empty; a source-defined PR description is unavailable");
  const titles = git(c.worktree, ["log", "--format=%s", `${baseline}..${source.head}`]).split("\n").filter(Boolean);
  const title = titles[0] ?? `Deliver ${c.manifest.task_id}`;
  const changes = git(c.worktree, ["diff", "--no-ext-diff", "--no-textconv", "--name-status", baseline, "--"]);
  const patch = git(c.worktree, ["diff", "--no-ext-diff", "--no-textconv", "--unified=3", baseline, "--"]);
  const summary = spec.split(/\r?\n/).find(line => /^#\s+\S/.test(line))?.replace(/^#\s+/, "") ?? c.manifest.task_id;
  const before = patch.split("\n").filter(line => line.startsWith("-") && !line.startsWith("---")).join("\n");
  const after = patch.split("\n").filter(line => line.startsWith("+") && !line.startsWith("+++")).join("\n");
  const tests = c.facts.flatMap(row => Array.isArray(row.evidence?.value) ? row.evidence.value : []);
  const evidence = tests.length ? tests.map(row => `- ${JSON.stringify(row.command)}: exit ${row.exit_code}; ${JSON.stringify(row.failure_signature)}`).join("\n")
    : "Tests: unavailable — no executed command evidence is recorded in task facts.";
  const pending = source.changes.length ? `\nPending source paths: ${source.changes.map(row => row.path).join(", ")}.` : "";
  const body = `## Summary\n${summary}\nTask: ${c.manifest.task_id}.\n${titles.map(value => `- ${value}`).join("\n")}\n\n## Evidence\nBefore (${baseline}):\n${before || "unavailable — no removed text in the actual diff"}\nAfter (${source.head} plus current worktree):\n${after || "unavailable — no added text in the actual diff"}\n${evidence}${pending}\n\n## Merge Danger\nDoor: publish ${head} and open a PR into ${base} before the displayed merge/archive/push/owned-cleanup actions; each irreversible action still requires native authorization.\nBlast Radius: actual changed paths below; runtime/remote effects outside this diff remain unverified.\n${changes || "unavailable — no tracked changes against the actual base"}\n`;
  return { title, body };
}
function validatePrDescription(body) {
  if (typeof body !== "string" || !/^[ \t]*(?:\*\*)?Door(?:\*\*)?[ \t]*:[ \t]*[^ \t\r\n][^\r\n]*$/mi.test(body) || !/^[ \t]*(?:\*\*)?Blast Radius(?:\*\*)?[ \t]*:[ \t]*[^ \t\r\n][^\r\n]*$/mi.test(body)) throw failure("PR_DESCRIPTION_INCOMPLETE", "explicit PR body requires separate nonempty Door and Blast Radius fields");
}
function preparePr(c, input, fields) {
  if (input !== undefined && (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).some(key => !["enabled", "title", "body"].includes(key))
    || input.enabled !== undefined && typeof input.enabled !== "boolean" || input.title !== undefined && (typeof input.title !== "string" || !input.title.trim()) || input.body !== undefined && typeof input.body !== "string")) throw failure("PR_DESCRIPTION_INCOMPLETE", "delivery.pr must contain only optional enabled, nonempty title and text body");
  if (input?.enabled === false) return null;
  if (input?.body !== undefined) validatePrDescription(input.body);
  const defaults = input?.title !== undefined && input?.body !== undefined ? null : buildDefaultPrDescription(c, fields);
  return { ...probePrSupport(c, { ...fields, sourceHead: fields.source.head }), head: fields.head, base: fields.base, title: input?.title ?? defaults.title, body: input?.body ?? defaults.body };
}
function validatePlan(plan, c) {
  if (!plan || typeof plan !== "object" || plan.task_id !== c.manifest.task_id || plan.project_name !== c.manifest.project_name || plan.target_repo_root !== c.root) throw failure("CLOSE_PLAN_IDENTITY", "close plan identity mismatch");
  const expected = plan.mode === "planning" ? ["commit", "merge", "push", "cleanup"] : plan.mode === "post-cleanup-archive" ? ["archive", "push"]
    : plan.mode === "ordinary" && plan.pr?.status === "available" ? ["commit", "push-task", "pr", "merge", "archive", "push", "cleanup"] : ["commit", "merge", "archive", "push", "cleanup"];
  if (!same(plan.steps, expected)) throw failure("CLOSE_PLAN_ACTIONS", "close action set was changed");
  if (!/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(plan.task_branch) || !/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(plan.target_branch) || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(plan.remote)) throw failure("CLOSE_PLAN_REFS", "unsafe branch or remote");
  if (plan.worktree_root !== (plan.mode === "post-cleanup-archive" ? c.root : c.worktree) && existsSync(plan.worktree_root)) throw failure("CLOSE_PLAN_WORKTREE", "close plan worktree differs from the registered task");
  safeRelative(plan.spec_source_path, "source"); safeRelative(plan.spec_archive_path, "archive");
  if (plan.spec_source_path !== `specs/${plan.task_id}` || plan.spec_archive_path !== `specs/archive/${plan.task_id}`) throw failure("ARCHIVE_SCOPE", "archive scope must be this task's materials");
  return plan;
}
function readPlan(c, planRef) {
  const absolute = resolve(planRef);
  const base = closeEvidencePath(c.taskDir);
  if (dirname(absolute) !== base || !/^\d{4}-\d{2}-\d{2}-\d{3}-close-plan\.json$/.test(absolute.slice(base.length + 1))) throw failure("CLOSE_PLAN_REFERENCE", "an explicit ordinary close plan evidence reference is required");
  return validatePlan(JSON.parse(readFile(base, absolute.slice(base.length + 1))), c);
}
async function writeEvidence(c, slug, value) { return appendRecord(evidenceDirectory(c.taskDir), slug, "json", `${JSON.stringify(value, null, 2)}\n`); }
function authorizationForPlan(c, operation, confirmationRef) {
  const dir = authorizationDirectory(c.taskDir);
  const files = readdirSync(dir).filter((name) => new RegExp(`^\\d{4}-\\d{2}-\\d{2}-\\d{3}-authorize-${operation}\\.json$`).test(name)).sort();
  const grants = files.map((name) => ({ path: join(dir, name), value: JSON.parse(readFile(dir, name)) }));
  const grant = grants.filter((row) => row.value.confirmation_ref === confirmationRef).at(-1);
  if (!grant) throw failure("IRREVERSIBLE_AUTHORIZATION_REQUIRED", `no recorded authorization for ${operation} under this user-confirmed plan`);
  return grant;
}
function authorize(c, operation, action, input) {
  if (!OPERATIONS.has(operation)) throw failure("AUTH_OPERATION", "unsupported Git operation");
  const cwd = operation === "commit" || (operation === "archive" && !input.targetArchive) ? input.worktree ?? c.worktree : c.root;
  const args = [AUTH, action, "--operation", operation, "--dir", authorizationDirectory(c.taskDir), action === "record" ? "--confirmation-ref" : "--step-id", action === "record" ? input.confirmationRef : input.stepId];
  try {
    const pointer = JSON.parse(execFileSync(process.execPath, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }));
    const dir = authorizationDirectory(c.taskDir);
    if (typeof pointer.path !== "string" || !isAbsolute(pointer.path) || resolve(pointer.path) !== pointer.path || dirname(pointer.path) !== dir) throw failure("AUTHORIZATION_RECORD_PATH", "native authorization pointer is not inside this task's actual authorization directory");
    const expectedSlug = action === "consume" ? "consumed" : "authorize";
    if (!new RegExp(`^\\d{4}-\\d{2}-\\d{2}-\\d{3}-${expectedSlug}-${operation}\\.json$`).test(basename(pointer.path))) throw failure("AUTHORIZATION_RECORD_PATH", "native authorization record filename differs from operation");
    if (action === "record") return pointer;
    // The CLI publishes only a real path. Read the actual immutable consume
    // bytes; do not invent wrapper fields or change the standalone protocol.
    return { ...JSON.parse(readFile(dir, basename(pointer.path))), path: pointer.path };
  }
  catch (error) { let native; try { native = JSON.parse(String(error.stderr)); } catch { throw error; } throw failure(native.code ?? "AUTHORIZATION_FAILED", native.message ?? String(error.stderr)); }
}
export async function prepareDeliveryClosePlan({ taskDir, delivery = {}, closeMode, priorPlanRef, archiveDeclarationRef } = {}) {
  assertPostWriter(taskDir);
  if (priorPlanRef !== undefined || archiveDeclarationRef !== undefined) {
    if (!priorPlanRef || !archiveDeclarationRef) throw failure("ARCHIVE_DECLARATION", "post-cleanup archive requires explicit prior plan and human-readable declaration references");
    const c = contextForPlan(taskDir, priorPlanRef);
    const prior = readPlan(c, priorPlanRef);
    if (prior.mode !== "planning") throw failure("ARCHIVE_MODE", "post-cleanup archive requires a planning task's four-action close");
    realDirectory(dirname(resolve(archiveDeclarationRef)));
    const declaration = JSON.parse(readFile(dirname(resolve(archiveDeclarationRef)), basename(resolve(archiveDeclarationRef))));
    if (declaration.task_id !== c.manifest.task_id || declaration.workflow !== "build-prd" || typeof declaration.reply_text !== "string" || !/归档|\barchive\b/i.test(declaration.reply_text) || /不(?:要|得|能|应)?归档|禁止\s*归档|拒绝\s*归档|暂缓\s*归档|别\s*归档|暂不|do not|not yet/i.test(declaration.reply_text)) throw failure("ARCHIVE_DECLARATION", "a real explicit archive instruction for this planning task is required");
    if (Array.isArray(declaration.step_results) && declaration.step_results.some(row => ["incomplete", "unavailable", "failed", "error", "in_progress", "unknown", "blocked", "cancelled", "pending", "running", "not_started"].includes(row.status))) throw failure("ARCHIVE_DECLARATION_INCOMPLETE", "the declared planning result still reports unfinished work");
    const physical = await inspectDeliveryCloseState({ taskDir, planRef: priorPlanRef });
    if (!physical.facts.merge || !physical.facts.push || !physical.facts.cleanup?.removed) throw failure("ARCHIVE_PHYSICAL_STATE", "planning delivery and owned cleanup must actually precede post-cleanup archive");
    const head = branchOid(c.root, prior.target_branch);
    await assertCleanTarget({ root: c.root, target: c.root, baseline: head, expectBranch: prior.target_branch });
    realDirectory(join(c.root, prior.spec_source_path));
    if (existsSync(join(c.root, prior.spec_archive_path))) throw failure("ARCHIVE_SCOPE", "archive target already exists");
    const source = sourceState(c.root, prior.task_id);
    const plan = { ...prior, mode: "post-cleanup-archive", worktree_root: c.root, task_branch: prior.target_branch, target_head: head,
      remote_target_head: remoteOid(c.root, prior.remote, prior.target_branch).oid, remote_task_head: null,
      source, preserve_existing_workspace: true, steps: ["archive", "push"], archive_declaration_ref: archiveDeclarationRef, created_at: new Date().toISOString() };
    validatePlan(plan, c);
    return { plan, plan_ref: await writeEvidence(c, "close-plan", plan), quality_status: "unknown" };
  }
  const c = context(taskDir, { targetBranch: delivery.target_branch ?? "main" }); const source = sourceState(c.worktree, c.manifest.task_id);
  let taskType = "unknown";
  try { taskType = declaredTaskType(readFile(c.worktree, `specs/${c.manifest.task_id}/decision-log.md`).toString("utf8")); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  const mode = taskType === "规划任务" ? "planning" : closeMode ?? delivery.close_mode ?? "ordinary";
  if (!["ordinary", "mini-task", "planning"].includes(mode)) throw failure("CLOSE_MODE", "unsupported close mode");
  const taskBranch = git(c.worktree, ["branch", "--show-current"]), targetBranch = delivery.target_branch ?? "main", remote = delivery.remote ?? "origin";
  if (delivery.task_branch !== undefined && delivery.task_branch !== taskBranch) throw failure("CLOSE_TASK_BRANCH", "declared task branch differs from actual Git");
  const baseline = branchOid(c.root, targetBranch); if (!baseline) throw failure("TARGET_UNAVAILABLE", "target branch is absent");
  const remoteTarget = remoteOid(c.root, remote, targetBranch);
  if (remoteTarget.status !== "available") throw failure("REMOTE_TARGET_UNAVAILABLE", remoteTarget.reason);
  if (remoteTarget.oid !== baseline) throw failure("TARGET_REMOTE_HEAD_MISMATCH", "target branch differs from its remote before planning");
  await assertCleanTarget({ root: c.root, target: c.root, baseline, expectBranch: targetBranch });
  const pr = mode === "ordinary" ? preparePr(c, delivery.pr, { baseline, source, head: taskBranch, base: targetBranch, remote }) : null;
  const plan = { task_id: c.manifest.task_id, project_name: c.manifest.project_name, mode, target_repo_root: c.root,
    worktree_root: c.worktree, task_branch: taskBranch, target_branch: targetBranch, target_head: baseline,
    remote, remote_target_head: remoteTarget.oid, remote_task_head: remoteOid(c.root, remote, taskBranch).oid,
    spec_source_path: delivery.spec_source_path ?? `specs/${c.manifest.task_id}`, spec_archive_path: delivery.spec_archive_path ?? `specs/archive/${c.manifest.task_id}`,
    preserve_existing_workspace: c.explicit, source, steps: mode === "planning" ? ["commit", "merge", "push", "cleanup"]
      : pr?.status === "available" ? ["commit", "push-task", "pr", "merge", "archive", "push", "cleanup"] : ["commit", "merge", "archive", "push", "cleanup"],
    ...(pr ? { pr } : {}), known_gaps: delivery.known_gaps ?? [], created_at: new Date().toISOString() };
  validatePlan(plan, c);
  realDirectory(join(c.worktree, plan.spec_source_path));
  const planRef = await writeEvidence(c, "close-plan", plan);
  return { plan, plan_ref: planRef, quality_status: "unknown" };
}
export async function confirmClosePlan({ taskDir, planRef, outcome = "confirmed", replyText } = {}) {
  assertPostWriter(taskDir);
  const c = contextForPlan(taskDir, planRef); const plan = readPlan(c, planRef);
  if (plan.mode === "post-cleanup-archive") c.worktree = c.root;
  else realDirectory(c.worktree);
  if (!["confirmed", "rejected", "timeout"].includes(outcome)) throw failure("CONFIRMATION_OUTCOME", "unsupported close decision");
  if (outcome === "timeout") {
    if (replyText !== undefined && replyText !== "") throw failure("CONFIRMATION_REPLY", "timeout must not invent a human reply");
    return { status: "blocked", outcome, confirmation_ref: await writeEvidence(c, "close-timeout", { plan_ref: planRef, outcome, recorded_at: new Date().toISOString() }) };
  }
  const value = await recordConfirmation({ stage: "verify-code", decision: outcome, reply: replyText, materialRefs: [planRef] }, { cwd: c.worktree, dir: join(c.taskDir, "quality", "evidence", "human-confirmations") });
  return { status: outcome === "confirmed" ? "confirmed" : "blocked", outcome, confirmation_ref: value.path, record: value };
}
function acceptedConfirmation(c, planRef, confirmationRef) {
  const root = dirname(resolve(confirmationRef));
  const roots = [join(c.taskDir, "quality", "evidence", "human-confirmations"), join(c.taskDir, "quality", "confirmations")];
  if (!roots.includes(root)) throw failure("CONFIRMATION_REFERENCE", "confirmation must be this task's explicit native record");
  // Old confirmation originals are read in place; new writes use evidence only.
  const value = JSON.parse(readFile(root, resolve(confirmationRef).slice(root.length + 1)));
  if (value.decision !== "confirmed" || value.stage !== "verify-code" || !value.reply || !value.material_refs?.includes(planRef)) throw failure("CONFIRMATION_REJECTED", "confirmed verbatim user reply for this plan is required");
  return value;
}
export async function authorizeClosePlan({ taskDir, planRef, confirmationRef, operations } = {}) {
  assertPostWriter(taskDir);
  const c = contextForPlan(taskDir, planRef); const plan = readPlan(c, planRef);
  if (plan.mode === "post-cleanup-archive") c.worktree = c.root; else realDirectory(c.worktree);
  acceptedConfirmation(c, planRef, confirmationRef);
  const chosen = operations ?? plan.steps;
  if (!Array.isArray(chosen) || chosen.some((op) => !plan.steps.includes(op))) throw failure("AUTH_SCOPE", "authorization exceeds the displayed close plan");
  return [...new Set(chosen)].map((operation) => authorize(c, operation, "record", { confirmationRef, targetArchive: true }));
}
export async function inspectDeliveryCloseState({ taskDir, planRef } = {}) {
  const c = planRef ? contextForPlan(taskDir, planRef) : context(taskDir, { worktreeRequired: false });
  if (!planRef) return { status: "not_started", task_id: c.manifest.task_id, quality_status: "unknown", facts: {} };
  const plan = readPlan(c, planRef); const target = branchOid(c.root, plan.target_branch); const task = branchOid(c.root, plan.task_branch);
  const remote = remoteOid(c.root, plan.remote, plan.target_branch);
  const actions = actionFacts(c, planRef);
  const commitAction = actions.find(row => row.operation === "commit" && row.status === "completed");
  const sourceCommit = task ?? commitAction?.source_head ?? plan.source.head;
  const sourceAvailable = git(c.root, ["cat-file", "-e", `${sourceCommit}^{commit}`], { optional: true }).status === 0;
  const merged = Boolean(target && sourceAvailable && git(c.root, ["merge-base", "--is-ancestor", sourceCommit, target], { optional: true }).status === 0);
  const archive = git(c.root, ["cat-file", "-e", `${target}:${plan.spec_archive_path}`], { optional: true }).status === 0;
  const existing = existsSync(plan.worktree_root);
  const scan = existing ? entries(plan.worktree_root) : [];
  const facts = { delivery_committed: sourceAvailable && Boolean(commitAction || task) && (plan.source.changes.length === 0 || sourceCommit !== plan.source.head), merge: Boolean(merged), archive,
    push: remote.status === "available" && remote.oid === target, worktree_cleanup: plan.preserve_existing_workspace ? false : !existing,
    formal_cleanup_safe: !existing || scan.length === 0, branch_cleanup: plan.preserve_existing_workspace ? false : task === null,
    remote_branch_cleanup: plan.preserve_existing_workspace ? false : remoteOid(c.root, plan.remote, plan.task_branch).status === "absent",
    cleanup: plan.preserve_existing_workspace ? { skipped: true, reason: "existing workspace is not task-owned" } : { removed: !existing && task === null } };
  return { task_id: plan.task_id, plan_ref: planRef, facts, remote, step_records: actions, quality_status: "unknown", known_gaps: plan.known_gaps };
}
export async function executeClosePlan({ taskDir, planRef, confirmationRef, signal } = {}) {
  assertPostWriter(taskDir);
  const c = contextForPlan(taskDir, planRef); const plan = readPlan(c, planRef);
  if (plan.mode === "post-cleanup-archive") c.worktree = c.root; else realDirectory(c.worktree);
  acceptedConfirmation(c, planRef, confirmationRef);
  const directory = evidenceDirectory(c.taskDir);
  return withLock(dirname(directory), "close.execution", async () => {
    await assertCleanTarget({ root: c.root, target: c.root, baseline: plan.target_head, expectBranch: plan.target_branch });
    let sourceHead = plan.source.head, targetHead = plan.target_head;
    const records = [];
    const consume = (operation, targetArchive = false) => {
      let grant = authorizationForPlan(c, operation, confirmationRef);
      const cwd = operation === "commit" ? c.worktree : c.root;
      const expectedInitial = operation === "commit" ? plan.source.head : plan.target_head;
      const current = git(cwd, ["rev-parse", "HEAD"]);
      const expectedCurrent = operation === "commit" ? sourceHead : targetHead;
      if (current !== expectedCurrent) throw failure("AUTHORIZATION_HEAD_MISMATCH", "HEAD moved outside this close transaction");
      // Earlier actions performed by this invocation can move target HEAD.
      // A recorded grant for this explicit plan covers the same operation;
      // refresh its native record only after checking the exact known HEAD.
      // Arbitrary user or sibling HEAD drift never reaches this path.
      if (grant.value.head !== current) {
        if (grant.value.head !== expectedInitial || current === expectedInitial) throw failure("AUTHORIZATION_HEAD_MISMATCH", "recorded authorization does not cover the planned HEAD");
        const refreshed = authorize(c, operation, "record", { confirmationRef, targetArchive });
        grant = { path: refreshed.path, value: JSON.parse(readFile(authorizationDirectory(c.taskDir), basename(refreshed.path))) };
      }
      const branch = git(cwd, ["branch", "--show-current"]);
      if (grant.value.operation !== operation || grant.value.confirmation_ref !== confirmationRef || grant.value.head !== current || grant.value.branch !== branch) throw failure("AUTH_SCOPE", "native grant does not cover the actual operation/confirmation/HEAD/branch");
      const consumed = authorize(c, operation, "consume", { stepId: `${planRef}:${operation}`, targetArchive });
      if (consumed.authorization_ref !== grant.path || consumed.operation !== operation || consumed.step_id !== `${planRef}:${operation}`) throw failure("AUTH_SCOPE_CONSUMPTION", "native consumer selected a different grant; no Git action performed");
      const actual = JSON.parse(readFile(authorizationDirectory(c.taskDir), basename(consumed.authorization_ref)));
      if (actual.operation !== operation || actual.confirmation_ref !== confirmationRef || actual.head !== current || actual.branch !== branch) throw failure("AUTH_SCOPE_CONSUMPTION", "consumed authorization does not cover this plan's operation");
      return consumed;
    };
    for (const operation of plan.steps) {
      if (signal?.aborted) return { status: "cancelled", records, physical: await inspectDeliveryCloseState({ taskDir, planRef }) };
      try {
        if (existsSync(plan.worktree_root)) {
          assertNoSidecars(plan.worktree_root, plan.task_id);
          if (git(plan.worktree_root, ["branch", "--show-current"]) !== plan.task_branch || git(plan.worktree_root, ["rev-parse", "HEAD"]) !== sourceHead) throw failure("SOURCE_HEAD_DRIFT", "task branch or HEAD changed after close planning");
        }
        if (git(c.root, ["branch", "--show-current"]) !== plan.target_branch || branchOid(c.root, plan.target_branch) !== targetHead) throw failure("TARGET_HEAD_DRIFT", "target branch or HEAD changed after close planning");
        if (operation === "commit") {
          if (!same(sourceState(c.worktree, plan.task_id), plan.source)) throw failure("SOURCE_BYTES_DRIFT", "task source bytes changed after close planning");
          consume("commit");
          if (plan.source.changes.length) {
            const paths = [...new Set(plan.source.changes.flatMap((row) => [row.path, ...(row.source_path ? [row.source_path] : [])]))];
            git(c.worktree, ["add", "--", ...paths]);
            assertNoSidecars(c.worktree, plan.task_id);
            git(c.worktree, ["commit", "-m", `close ${plan.task_id}: publish task source`]);
            sourceHead = git(c.worktree, ["rev-parse", "HEAD"]);
          }
        } else if (operation === "merge") {
          await assertCleanTarget({ root: c.root, target: c.root, baseline: targetHead, expectBranch: plan.target_branch });
          if (entries(c.worktree).length) throw failure("SOURCE_DIRTY_AFTER_COMMIT", "source must be clean before merge");
          consume("merge");
          try { git(c.root, ["merge", "--no-ff", "--no-edit", plan.task_branch]); }
          catch (error) {
            if (git(c.root, ["rev-parse", "--verify", "MERGE_HEAD"], { optional: true }).status === 0) {
              try { git(c.root, ["merge", "--abort"]); }
              catch (abortError) { throw new AggregateError([error, abortError], "close merge and abort failed"); }
            }
            throw error;
          }
          targetHead = branchOid(c.root, plan.target_branch);
        } else if (operation === "archive") {
          await assertCleanTarget({ root: c.root, target: c.root, baseline: targetHead, expectBranch: plan.target_branch });
          if (!within(c.root, join(c.root, plan.spec_source_path)) || existsSync(join(c.root, plan.spec_archive_path))) throw failure("ARCHIVE_SCOPE", "archive source/target is unsafe");
          realDirectory(join(c.root, plan.spec_source_path));
          consume("archive", true);
          const parent = join(c.root, "specs", "archive"); if (!existsSync(parent)) mkdirSync(parent); realDirectory(parent);
          git(c.root, ["mv", "--", plan.spec_source_path, plan.spec_archive_path]);
          git(c.root, ["commit", "-m", `archive ${plan.spec_source_path}`]); targetHead = branchOid(c.root, plan.target_branch);
          if (plan.mode === "post-cleanup-archive") sourceHead = targetHead;
        } else if (operation === "push") {
          await assertCleanTarget({ root: c.root, target: c.root, baseline: targetHead, expectBranch: plan.target_branch });
          const remote = remoteOid(c.root, plan.remote, plan.target_branch);
          if (remote.status !== "available" || remote.oid !== plan.remote_target_head) throw failure("REMOTE_HEAD_DRIFT", "remote target changed since close planning");
          consume("push");
          git(c.root, ["push", plan.remote, `${plan.target_branch}:${plan.target_branch}`]);
          if (remoteOid(c.root, plan.remote, plan.target_branch).oid !== targetHead) throw failure("PUSH_READBACK", "remote target differs after push");
        } else if (operation === "cleanup") {
          if (plan.preserve_existing_workspace) {
            records.push({ operation, status: "skipped", reason: "existing workspace is not task-owned" }); continue;
          }
          await assertCleanTarget({ root: c.root, target: c.root, baseline: targetHead, expectBranch: plan.target_branch });
          assertNoSidecars(c.worktree, plan.task_id);
          if (entries(c.worktree).length) throw failure("CLEANUP_UNSAFE", "task worktree has uncommitted files");
          const ignored = git(c.worktree, ["ls-files", "--others", "--ignored", "--exclude-standard", "-z"]).split("\0").filter(Boolean);
          if (ignored.length) throw failure("CLEANUP_UNSAFE", `ignored files must be preserved before removal: ${ignored.join(", ")}`);
          if (branchOid(c.root, plan.task_branch) !== sourceHead) throw failure("SOURCE_HEAD_DRIFT", "task branch moved before cleanup");
          const remoteTask = remoteOid(c.root, plan.remote, plan.task_branch);
          if (remoteTask.status === "unavailable") throw failure("REMOTE_UNAVAILABLE", remoteTask.reason);
          if (remoteTask.oid !== plan.remote_task_head) throw failure("REMOTE_TASK_DRIFT", "remote task branch changed since planning");
          if (remoteTask.oid && (git(c.root, ["cat-file", "-e", `${remoteTask.oid}^{commit}`], { optional: true }).status !== 0 || git(c.root, ["merge-base", "--is-ancestor", remoteTask.oid, sourceHead], { optional: true }).status !== 0 || git(c.root, ["merge-base", "--is-ancestor", remoteTask.oid, targetHead], { optional: true }).status !== 0)) throw failure("REMOTE_TASK_UNMERGED", "remote task tip is unavailable or contains work not merged into the delivered source/target; refusing deletion");
          consume("cleanup");
          if (remoteTask.oid) git(c.root, ["push", plan.remote, "--delete", plan.task_branch]);
          assertNoSidecars(c.worktree, plan.task_id);
          if (entries(c.worktree).length || git(c.worktree, ["ls-files", "--others", "--ignored", "--exclude-standard", "-z"]).length) throw failure("CLEANUP_UNSAFE", "task worktree changed immediately before removal");
          git(c.root, ["worktree", "remove", "--", c.worktree]);
          git(c.root, ["branch", "-d", "--", plan.task_branch]);
        }
        const record = { operation, status: "completed", source_head: sourceHead, target_head: targetHead, recorded_at: new Date().toISOString() };
        record.ref = await writeEvidence(c, "close-action", { ...record, plan_ref: planRef }); records.push(record);
      } catch (error) {
        const ref = await writeEvidence(c, "close-action", { operation, status: "failed", plan_ref: planRef, error: { code: error.code ?? null, message: error.message }, recorded_at: new Date().toISOString() });
        return { status: "failed", operation, error: { code: error.code ?? null, message: error.message }, failure_ref: ref, records, physical: await inspectDeliveryCloseState({ taskDir, planRef }) };
      }
    }
    return { status: plan.mode === "planning" ? "executed" : "completed", records, physical: await inspectDeliveryCloseState({ taskDir, planRef }) };
  });
}
// The supplied real user reply covers the displayed action set. Record each
// native operation grant explicitly, then run its physical transaction. Later
// known HEAD changes still require a fresh native record under that scope.
export async function closeDelivery({ taskDir, delivery, closeMode, replyText, priorPlanRef, archiveDeclarationRef, signal } = {}) {
  const prepared = await prepareDeliveryClosePlan({ taskDir, delivery, closeMode, priorPlanRef, archiveDeclarationRef });
  const confirmed = await confirmClosePlan({ taskDir, planRef: prepared.plan_ref, replyText });
  await authorizeClosePlan({ taskDir, planRef: prepared.plan_ref, confirmationRef: confirmed.confirmation_ref });
  const result = await executeClosePlan({ taskDir, planRef: prepared.plan_ref, confirmationRef: confirmed.confirmation_ref, signal });
  return { ...result, plan_ref: prepared.plan_ref, confirmation_ref: confirmed.confirmation_ref };
}
