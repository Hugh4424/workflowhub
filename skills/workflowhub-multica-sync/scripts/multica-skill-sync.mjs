#!/usr/bin/env node

import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const STAGES = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
const CORE_AGENTS = {
  "工头": { stage: null },
  "Decision Maker": { stage: "make-decision" },
  "Spec Builder": { stage: "build-spec" },
  "Plan Builder": { stage: "build-plan" },
  "Code Builder": { stage: "build-code" },
  "Code Verifier": { stage: "verify-code" },
  Coder: { stage: "build-code" },
};
const MANAGED_CATALOG_STATUSES = new Set(["native", "adopted", "adapted"]);
const LEGACY_PROMPT_MARKERS = [
  /context\.migration_ref\s*==/i,
  /runner_root_migration/i,
  /git\s+-C\s+["']?\$runner_root/i,
  /必须验证[^\n]*runner_root/i,
  /把已验证的 `runner_root` 设为/i,
];
const CURRENT_PROMPT_MARKERS = [/execution_mode=per_invocation/i, /launcher-owned runtime/i, /执行身份.*记录/i];
const CURRENT_PROMPT_BLOCK = "0. `workflowhub-context.root` 只是存储根。新任务按 `execution_mode=per_invocation` 运行：不要求 `runner_root`、`runner_oid` 或 `migration_ref`，也不把 task 绑定本机目录、固定 commit 或 replacement。每次官方入口由 launcher-owned runtime 独立认证当前代码，并把 commit/tree、合同版本和能力写入审计；执行身份只记录，不决定需求、质量、阶段结果或放行。不要从 root、task_path、cwd 或业务仓猜执行环境，也不要复制宿主文件到目标仓。旧 `legacy_pinned` 字段只读兼容，不能作为新业务门禁。";
const DEFAULT_TIMEOUT_MS = 30_000;

class SyncError extends Error {
  constructor(code, message, cause = null) {
    super(message, { cause });
    this.name = "SyncError";
    this.code = code;
  }
}

function argsOf(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (!item.startsWith("--")) continue;
    const body = item.slice(2);
    const equals = body.indexOf("=");
    if (equals >= 0) out[body.slice(0, equals)] = body.slice(equals + 1);
    else out[body] = argv[i + 1]?.startsWith("--") ? true : (argv[++i] ?? true);
  }
  return out;
}

function positiveInteger(value, fallback, label) {
  if (value === undefined || value === true) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) throw new SyncError("REQUEST_INVALID", `${label} 必须是正整数`);
  return parsed;
}

function run(command, argv, { cwd, input, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  try {
    return execFileSync(command, argv, {
      cwd,
      input,
      encoding: "utf8",
      timeout: timeoutMs,
      maxBuffer: 32 * 1024 * 1024,
      stdio: [input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
    });
  } catch (error) {
    const code = error?.code === "ETIMEDOUT" ? "CLI_TIMEOUT" : (error?.code ?? "COMMAND_FAILED");
    throw new SyncError(code, `${command} ${argv.join(" ")} 未能在 ${timeoutMs}ms 内得到可信结果`, error);
  }
}

function jsonRun(command, argv, options) {
  let text;
  try { text = run(command, argv, options); }
  catch (error) { throw error; }
  try { return JSON.parse(text); }
  catch (error) { throw new SyncError("OUTPUT_INVALID", `${command} 返回的不是有效 JSON`, error); }
}

function git(repo, argv, timeoutMs) { return run("git", argv, { cwd: repo, timeoutMs }); }
function sha(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
function multica(profile, workspace, argv, options = {}) {
  try {
    return jsonRun("multica", ["--profile", profile, "--workspace-id", workspace, ...argv], options);
  } catch (error) {
    if (error instanceof SyncError) throw new SyncError(error.code === "CLI_TIMEOUT" ? "MULTICA_TIMEOUT" : "MULTICA_UNAVAILABLE", `Multica CLI 无法确认：${error.message}`, error);
    throw error;
  }
}
function unwrap(value, key) { return value?.[key] ?? value?.data ?? value; }

function mainBytes(repo, relativePath, timeoutMs) { return Buffer.from(git(repo, ["show", `main:${relativePath}`], timeoutMs)); }
function mainText(repo, relativePath, timeoutMs) { return mainBytes(repo, relativePath, timeoutMs).toString("utf8"); }
function mainPaths(repo, prefix, timeoutMs) {
  return git(repo, ["ls-tree", "-r", "--name-only", "main", "--", prefix], timeoutMs).split("\n").map(value => value.trim()).filter(Boolean);
}
function catalog(repo, timeoutMs) { return yaml.load(mainText(repo, "skills/catalog.yaml", timeoutMs)); }
function catalogEntries(repo, timeoutMs) { return (catalog(repo, timeoutMs).skills ?? []).filter(entry => MANAGED_CATALOG_STATUSES.has(entry.status) && entry.path); }
function catalogEntry(repo, name, timeoutMs) { return catalogEntries(repo, timeoutMs).find(entry => entry.name === name) ?? null; }

function managedSkillNames(repo, timeoutMs) {
  const names = new Set(catalogEntries(repo, timeoutMs).map(entry => entry.name));
  for (const stage of STAGES) for (const dependency of stageDependencies(repo, stage, timeoutMs)) names.add(dependency);
  return [...names].sort();
}

function externalSkillNames(repo, timeoutMs) {
  return new Set(catalogEntries(repo, timeoutMs).filter(entry => entry.status === "adopted").map(entry => entry.name));
}

function bundleFor(repo, name, timeoutMs) {
  const relativePath = `skills/${name}/skill-bundle.json`;
  if (!mainPaths(repo, relativePath, timeoutMs).includes(relativePath)) return null;
  return JSON.parse(mainText(repo, relativePath, timeoutMs));
}

function bundlePaths(bundle) { return new Set((bundle?.files ?? []).map(entry => typeof entry === "string" ? entry : entry.path)); }
function supportPaths(bundle) {
  if (!bundle) return new Set();
  const paths = bundlePaths(bundle);
  paths.delete("SKILL.md");
  paths.add("skill-bundle.json");
  return paths;
}

function localSkillSnapshot(repo, name, timeoutMs) {
  const relativePath = `skills/${name}/SKILL.md`;
  const localPathExists = mainPaths(repo, relativePath, timeoutMs).includes(relativePath);
  if (!localPathExists) return { name, path: relativePath, local_status: "missing_main", primary_sha256: null, bundle: null, files: {} };
  const bundle = bundleFor(repo, name, timeoutMs);
  const files = {};
  for (const file of supportPaths(bundle)) files[file] = sha(mainBytes(repo, `skills/${name}/${file}`, timeoutMs));
  return { name, path: relativePath, local_status: "present", catalog_status: catalogEntry(repo, name, timeoutMs)?.status ?? null, primary_sha256: sha(mainBytes(repo, relativePath, timeoutMs)), bundle, files };
}

function stageSnapshot(repo, stage, timeoutMs) {
  const relativePath = `workflows/${stage}/SKILL.md`;
  return { name: stage, path: relativePath, local_status: "present", primary_sha256: sha(mainBytes(repo, relativePath, timeoutMs)), files: {}, bundle: null };
}

function stageDependencies(repo, stage, timeoutMs) {
  const manifest = yaml.load(mainText(repo, `workflows/${stage}/skill-deps.yaml`, timeoutMs));
  return (manifest.skills ?? []).map(entry => entry.name);
}

function expectedAgentSkills(repo, name, timeoutMs) {
  const role = CORE_AGENTS[name];
  const names = new Set(["workflowhub-host-protocol"]);
  if (role?.stage) {
    names.add(role.stage);
    for (const dependency of stageDependencies(repo, role.stage, timeoutMs)) names.add(dependency);
  }
  return [...names].sort();
}

function promptIssues(instructions) {
  return {
    legacy: LEGACY_PROMPT_MARKERS.filter(pattern => pattern.test(instructions)).map(pattern => pattern.source),
    missing_current: CURRENT_PROMPT_MARKERS.filter(pattern => !pattern.test(instructions)).map(pattern => pattern.source),
  };
}

function bindingIssues(expected, skills) {
  const actual = skills.map(skill => skill.name ?? skill);
  const counts = new Map();
  for (const name of actual) counts.set(name, (counts.get(name) ?? 0) + 1);
  const duplicates = [...counts.entries()].filter(([, count]) => count > 1).map(([name]) => name).sort();
  const unique = [...new Set(actual)].sort();
  return { expected, actual, missing: expected.filter(name => !unique.includes(name)), unexpected: unique.filter(name => !expected.includes(name)), duplicates };
}

function onlineSkillDetail(profile, workspace, skill, timeoutMs) {
  const primary = unwrap(multica(profile, workspace, ["skill", "get", skill.id, "--output", "json"], { timeoutMs }));
  const files = unwrap(multica(profile, workspace, ["skill", "files", "list", skill.id, "--output", "json"], { timeoutMs }), "files");
  return { ...primary, content: primary?.content, files: Array.isArray(files) ? files : [] };
}

function listAgents(profile, workspace, timeoutMs) { return unwrap(multica(profile, workspace, ["agent", "list", "--output", "json"], { timeoutMs }), "agents"); }
function listSkills(profile, workspace, timeoutMs) { return unwrap(multica(profile, workspace, ["skill", "list", "--output", "json"], { timeoutMs }), "skills"); }

function closureCheck(repo, statusText, mainCommit, timeoutMs) {
  const head = git(repo, ["rev-parse", "HEAD"], timeoutMs).trim();
  if (statusText || head !== mainCommit) return { status: "unknown", reason: "工作树不是干净的 main 快照，不能把当前闭包结果冒充 main 闭包" };
  try {
    const output = run(process.execPath, [path.join(repo, "core/check-skill-closure.mjs"), repo], { cwd: repo, timeoutMs });
    return { status: "passed", output: output.trim() };
  } catch (error) {
    return { status: "failed", reason: error.message };
  }
}

function snapshotHash(report) {
  const value = {
    main_commit: report.summary.main_commit,
    origin_main: report.summary.origin_main,
    scope_files: report.scope_files,
    skills: report.skills.map(item => ({
      name: item.name,
      path: item.path,
      local_status: item.local_status,
      primary_sha256: item.primary_sha256,
      files: Object.fromEntries(Object.entries(item.files).sort(([a], [b]) => a.localeCompare(b))),
      online_id: item.online_id ?? null,
      online_primary_sha256: item.online_primary_sha256 ?? null,
      online_files: [...(item.online_files ?? [])].sort((a, b) => a.path.localeCompare(b.path)),
    })),
    agents: report.agents.map(item => ({
      name: item.name,
      id: item.id ?? null,
      prompt_sha256: item.prompt?.sha256 ?? null,
      actual_skills: [...(item.binding?.actual ?? [])].sort(),
    })),
  };
  return sha(canonical(value));
}

function audit({ repo, profile, workspace, timeoutMs }) {
  const statusText = git(repo, ["status", "--porcelain"], timeoutMs);
  const branch = git(repo, ["branch", "--show-current"], timeoutMs).trim();
  const mainCommit = git(repo, ["rev-parse", "main"], timeoutMs).trim();
  let originMain = null;
  try { originMain = git(repo, ["rev-parse", "origin/main"], timeoutMs).trim(); } catch {}
  const closure = closureCheck(repo, statusText, mainCommit, timeoutMs);
  const scopeFiles = ["skills/catalog.yaml", ...STAGES.map(stage => `workflows/${stage}/skill-deps.yaml`)]
    .map(relativePath => ({ path: relativePath, sha256: sha(mainBytes(repo, relativePath, timeoutMs)) }));
  const externalNames = externalSkillNames(repo, timeoutMs);
  const listedSkills = listSkills(profile, workspace, timeoutMs);
  const onlineSkills = new Map(listedSkills.map(item => [item.name, item]));
  const skillReports = [];
  const localNames = new Set([...STAGES, ...managedSkillNames(repo, timeoutMs)]);
  for (const name of [...localNames].sort()) {
    const local = STAGES.includes(name) ? stageSnapshot(repo, name, timeoutMs) : localSkillSnapshot(repo, name, timeoutMs);
    const listed = onlineSkills.get(name);
    if (!listed) {
      skillReports.push({ ...local, status: externalNames.has(name) ? "external_unmanaged" : "missing_online", online_id: null, files: { missing: Object.keys(local.files), mismatched: [], extra: [] }, online_files: [] });
      continue;
    }
    const online = onlineSkillDetail(profile, workspace, listed, timeoutMs);
    const onlineFiles = new Map(online.files.map(file => [file.path, file]));
    const missing = Object.keys(local.files).filter(file => !onlineFiles.has(file));
    const unreadable = Object.keys(local.files).filter(file => onlineFiles.has(file) && typeof onlineFiles.get(file).content !== "string");
    const mismatched = Object.keys(local.files).filter(file => onlineFiles.has(file) && typeof onlineFiles.get(file).content === "string" && sha(Buffer.from(onlineFiles.get(file).content, "utf8")) !== local.files[file]);
    const extra = [...onlineFiles.keys()].filter(file => !Object.prototype.hasOwnProperty.call(local.files, file));
    const primaryAvailable = typeof online.content === "string";
    const primaryMismatch = primaryAvailable && sha(Buffer.from(online.content, "utf8")) !== local.primary_sha256;
    const cannotConfirm = local.local_status !== "present" || !primaryAvailable || unreadable.length > 0;
    const actionable = primaryMismatch || missing.length || mismatched.length || extra.length;
    const status = externalNames.has(name) ? "external_unmanaged" : (cannotConfirm ? "cannot_confirm" : (actionable ? "needs_update" : "match"));
    skillReports.push({
      ...local,
      online_id: listed.id,
      online_updated_at: listed.updated_at,
      online_primary_sha256: primaryAvailable ? sha(Buffer.from(online.content, "utf8")) : null,
      online_files: online.files.map(file => ({ path: file.path, id: file.id ?? null, sha256: typeof file.content === "string" ? sha(Buffer.from(file.content, "utf8")) : null })),
      status,
      primary_mismatch: primaryMismatch,
      files: { missing, unreadable, mismatched, extra },
    });
  }

  const listedAgents = listAgents(profile, workspace, timeoutMs);
  const agentReports = [];
  for (const [name] of Object.entries(CORE_AGENTS)) {
    const agent = listedAgents.find(item => item.name === name);
    const expected = expectedAgentSkills(repo, name, timeoutMs);
    if (!agent) { agentReports.push({ name, status: "cannot_confirm", expected_skills: expected, binding: { expected, actual: [], missing: expected, unexpected: [], duplicates: [] } }); continue; }
    const binding = bindingIssues(expected, agent.skills ?? []);
    const issues = promptIssues(agent.instructions ?? "");
    const actionable = binding.missing.length || issues.legacy.length || issues.missing_current.length;
    const warning = binding.unexpected.length || binding.duplicates.length;
    agentReports.push({ name, id: agent.id, status: actionable ? "needs_update" : (warning ? "needs_review" : "match"), binding, prompt: { sha256: sha(agent.instructions ?? ""), ...issues } });
  }

  const unmanagedOnline = [...onlineSkills.keys()].filter(name => !localNames.has(name)).sort();
  const syncBlockers = [];
  if (statusText) syncBlockers.push("dirty_worktree");
  if (!originMain || originMain !== mainCommit) syncBlockers.push("main_origin_mismatch");
  if (closure.status !== "passed") syncBlockers.push(`closure_${closure.status}`);
  const summary = {
    local_skill_count: localNames.size,
    online_managed_count: skillReports.filter(item => item.status === "match").length,
    skill_changes: skillReports.filter(item => item.status === "needs_update" || item.status === "missing_online").length,
    unconfirmed: skillReports.filter(item => item.status === "cannot_confirm").length + agentReports.filter(item => item.status === "cannot_confirm").length,
    external_differences: skillReports.filter(item => item.status === "external_unmanaged").length,
    agent_changes: agentReports.filter(item => item.status === "needs_update").length,
    agent_warnings: agentReports.filter(item => item.status === "needs_review").length,
    unmanaged_online_skills: unmanagedOnline,
    dirty_worktree: Boolean(statusText),
    branch,
    main_commit: mainCommit,
    origin_main: originMain,
    closure_status: closure.status,
    closure_reason: closure.reason ?? null,
    sync_blockers: syncBlockers,
  };
  const report = { version: "workflowhub-multica-sync.v2", repo, profile, workspace, scope_files: scopeFiles, snapshot: { main_commit: mainCommit, origin_main: originMain }, summary, skills: skillReports, agents: agentReports };
  report.snapshot_hash = snapshotHash(report);
  return report;
}

function printAudit(report) {
  const { summary } = report;
  console.log(`main=${summary.main_commit} origin/main=${summary.origin_main ?? "not-found"} branch=${summary.branch} dirty=${summary.dirty_worktree} snapshot=${report.snapshot_hash}`);
  console.log(`技能：本地闭包 ${summary.local_skill_count}，需处理 ${summary.skill_changes}，无法确认 ${summary.unconfirmed}，外部差异 ${summary.external_differences}，Multica 额外技能 ${summary.unmanaged_online_skills.join(", ") || "无"}`);
  console.log(`Agent：需更新 ${summary.agent_changes}，需人工检查 ${summary.agent_warnings}；闭包=${summary.closure_status}`);
  if (summary.sync_blockers.length) console.log(`同步阻塞：${summary.sync_blockers.join(", ")}`);
  for (const item of report.skills.filter(value => value.status !== "match" || value.files.extra.length)) console.log(`- 技能 ${item.name}: ${item.status}; primary=${item.primary_mismatch ? "不一致" : "一致"}; missing=${item.files.missing.join(",") || "无"}; unreadable=${item.files.unreadable?.join(",") || "无"}; mismatched=${item.files.mismatched.join(",") || "无"}; extra=${item.files.extra.join(",") || "无"}`);
  for (const item of report.agents.filter(value => value.status !== "match")) console.log(`- Agent ${item.name}: ${item.status}; 缺技能=${item.binding?.missing?.join(",") || "无"}; 额外技能=${item.binding?.unexpected?.join(",") || "无"}; 重复=${item.binding?.duplicates?.join(",") || "无"}; 旧提示词=${item.prompt?.legacy?.join(",") || "无"}; 当前规则缺失=${item.prompt?.missing_current?.join(",") || "无"}`);
  if (!summary.skill_changes && !summary.agent_changes && !summary.unconfirmed && !summary.agent_warnings) console.log("未发现需要同步的问题。");
}

function assertSkillReadback(profile, workspace, online, item, expectedFiles, timeoutMs) {
  const detail = onlineSkillDetail(profile, workspace, online, timeoutMs);
  if (typeof detail.content !== "string" || sha(Buffer.from(detail.content, "utf8")) !== item.primary_sha256) throw new SyncError("READBACK_MISMATCH", `技能 ${item.name} 正文回读不一致`);
  const files = new Map(detail.files.map(file => [file.path, file]));
  for (const [file, expected] of Object.entries(expectedFiles)) {
    const actual = files.get(file);
    if (!actual || typeof actual.content !== "string" || sha(Buffer.from(actual.content, "utf8")) !== expected) throw new SyncError("READBACK_MISMATCH", `技能 ${item.name}/${file} 回读不一致`);
  }
  return detail;
}

function rewritePrompt(instructions) {
  const legacyPattern = /0\. `workflowhub-context\.root`[\s\S]*?(?=\n\n1\. )/;
  if (legacyPattern.test(instructions)) return instructions.replace(legacyPattern, CURRENT_PROMPT_BLOCK);
  if (!instructions.trim()) throw new SyncError("MANUAL_REVIEW_REQUIRED", "Agent 提示词为空，不能自动补写角色职责");
  return `${CURRENT_PROMPT_BLOCK}\n\n${instructions}`;
}

function readbackAgent(profile, workspace, id, timeoutMs) {
  const agent = unwrap(multica(profile, workspace, ["agent", "get", id, "--output", "json"], { timeoutMs }));
  if (!agent?.id) throw new SyncError("READBACK_MISMATCH", `Agent ${id} 回读失败`);
  return agent;
}

function apply({ report, cleanupExtra, expectedSnapshot, timeoutMs }) {
  if (!expectedSnapshot) throw new SyncError("CONFIRMATION_REQUIRED", "apply 必须带 --audit-snapshot=<审计报告中的 snapshot>");
  if (report.snapshot_hash !== expectedSnapshot) throw new SyncError("SNAPSHOT_CHANGED", `用户确认后的审计快照已变化：expected=${expectedSnapshot} actual=${report.snapshot_hash}`);
  if (report.summary.sync_blockers.length || report.summary.unconfirmed) throw new SyncError("SYNC_BLOCKED", `同步被阻止：${[...report.summary.sync_blockers, report.summary.unconfirmed ? "unconfirmed" : ""].filter(Boolean).join(",")}`);
  if (report.agents.some(item => item.status === "cannot_confirm")) throw new SyncError("AGENT_UNAVAILABLE", "核心 Agent 无法确认，停止同步");

  const actions = [];
  const externalNames = externalSkillNames(report.repo, timeoutMs);
  const byName = new Map(listSkills(report.profile, report.workspace, timeoutMs).map(item => [item.name, item]));
  for (const item of report.skills) {
    if (externalNames.has(item.name)) continue;
    const content = mainBytes(report.repo, item.path, timeoutMs);
    let online = byName.get(item.name);
    const desiredFiles = Object.fromEntries([...supportPaths(item.bundle)].map(file => [file, true]));
    if (!online) {
      const created = unwrap(multica(report.profile, report.workspace, ["skill", "create", "--name", item.name, "--content-stdin", "--output", "json"], { input: content, timeoutMs }), "skill");
      if (!created?.id) throw new SyncError("MUTATION_UNCONFIRMED", `创建技能 ${item.name} 未返回可信 ID`);
      online = created; byName.set(item.name, online); actions.push(`create skill ${item.name}`);
      assertSkillReadback(report.profile, report.workspace, online, item, {}, timeoutMs);
    } else if (item.primary_mismatch) {
      multica(report.profile, report.workspace, ["skill", "update", online.id, "--content-stdin", "--output", "json"], { input: content, timeoutMs });
      assertSkillReadback(report.profile, report.workspace, online, item, {}, timeoutMs);
      actions.push(`update skill ${item.name}`);
    }
    const needsAllFiles = !item.online_id;
    const filesToUpsert = needsAllFiles ? Object.keys(desiredFiles) : [...new Set([...item.files.missing, ...item.files.mismatched])];
    for (const file of filesToUpsert) {
      const bytes = mainBytes(report.repo, `skills/${item.name}/${file}`, timeoutMs);
      const expected = sha(bytes);
      multica(report.profile, report.workspace, ["skill", "files", "upsert", online.id, "--path", file, "--content-stdin", "--output", "json"], { input: bytes, timeoutMs });
      assertSkillReadback(report.profile, report.workspace, online, item, { [file]: expected }, timeoutMs);
      actions.push(`upsert ${item.name}/${file}`);
    }
    if (cleanupExtra && item.files.extra.length) {
      const detail = onlineSkillDetail(report.profile, report.workspace, online, timeoutMs);
      const files = new Map(detail.files.map(file => [file.path, file]));
      for (const filePath of item.files.extra) {
        const file = files.get(filePath);
        if (!file?.id) throw new SyncError("READBACK_MISMATCH", `技能 ${item.name}/${filePath} 缺少删除 ID`);
        multica(report.profile, report.workspace, ["skill", "files", "delete", online.id, file.id], { timeoutMs });
        const after = onlineSkillDetail(report.profile, report.workspace, online, timeoutMs);
        if (after.files.some(value => value.path === filePath)) throw new SyncError("READBACK_MISMATCH", `技能 ${item.name}/${filePath} 删除后仍存在`);
        actions.push(`delete ${item.name}/${filePath}`);
      }
    }
  }

  const skillIds = new Map(listSkills(report.profile, report.workspace, timeoutMs).map(item => [item.name, item.id]));
  const agents = listAgents(report.profile, report.workspace, timeoutMs);
  for (const item of report.agents) {
    const agent = agents.find(value => value.name === item.name);
    if (!agent) throw new SyncError("AGENT_UNAVAILABLE", `核心 Agent 不存在：${item.name}`);
    if (item.prompt?.legacy?.length || item.prompt?.missing_current?.length) {
      const next = rewritePrompt(agent.instructions ?? "");
      const nextIssues = promptIssues(next);
      if (nextIssues.legacy.length || nextIssues.missing_current.length) throw new SyncError("MANUAL_REVIEW_REQUIRED", `${item.name} 提示词无法安全修复`);
      multica(report.profile, report.workspace, ["agent", "update", agent.id, "--instructions", next, "--output", "json"], { timeoutMs });
      const readback = readbackAgent(report.profile, report.workspace, agent.id, timeoutMs);
      if (promptIssues(readback.instructions ?? "").legacy.length || promptIssues(readback.instructions ?? "").missing_current.length) throw new SyncError("READBACK_MISMATCH", `${item.name} 提示词回读仍不符合当前规则`);
      actions.push(`update agent prompt ${item.name}`);
    }
    const missingIds = item.binding.missing.map(name => skillIds.get(name)).filter(Boolean);
    if (item.binding.missing.length && missingIds.length !== item.binding.missing.length) throw new SyncError("SKILL_UNAVAILABLE", `${item.name} 缺少可绑定的技能 ID`);
    if (missingIds.length) {
      multica(report.profile, report.workspace, ["agent", "skills", "add", agent.id, "--skill-ids", missingIds.join(","), "--output", "json"], { timeoutMs });
      const readback = readbackAgent(report.profile, report.workspace, agent.id, timeoutMs);
      const after = bindingIssues(item.binding.expected, readback.skills ?? []);
      if (after.missing.length) throw new SyncError("READBACK_MISMATCH", `${item.name} 技能绑定回读仍缺少：${after.missing.join(",")}`);
      actions.push(`bind ${item.name}: ${item.binding.missing.join(",")}`);
    }
  }
  return actions;
}

function main() {
  const input = argsOf(process.argv.slice(2));
  const command = process.argv[2];
  const repo = path.resolve(input.repo ?? process.cwd());
  const profile = input.profile ?? process.env.MULTICA_PROFILE ?? "desktop-api.multica.ai";
  const workspace = input["workspace-id"] ?? process.env.MULTICA_WORKSPACE_ID;
  const timeoutMs = positiveInteger(input["timeout-ms"], DEFAULT_TIMEOUT_MS, "--timeout-ms");
  if (!workspace) throw new SyncError("REQUEST_INVALID", "缺少 --workspace-id；不会猜 workspace");
  if (!fs.existsSync(path.join(repo, ".git"))) throw new SyncError("REQUEST_INVALID", `不是 Git 仓库：${repo}`);
  if (command === "audit") {
    const report = audit({ repo, profile, workspace, timeoutMs });
    if (input.format === "json") console.log(JSON.stringify(report, null, 2)); else printAudit(report);
    const exit = report.summary.skill_changes || report.summary.agent_changes || report.summary.unconfirmed || report.summary.agent_warnings || report.summary.sync_blockers.length ? 2 : 0;
    process.exitCode = exit;
    return;
  }
  if (command === "apply") {
    if (input.confirm !== "I_CONFIRM") throw new SyncError("CONFIRMATION_REQUIRED", "apply 必须带 --confirm=I_CONFIRM；先完成审计并取得用户确认");
    const before = audit({ repo, profile, workspace, timeoutMs });
    const actions = apply({ report: before, cleanupExtra: input["cleanup-extra"] === "true" || input["cleanup-extra"] === true, expectedSnapshot: input["audit-snapshot"], timeoutMs });
    const after = audit({ repo, profile, workspace, timeoutMs });
    console.log(JSON.stringify({ actions, before: before.summary, after: after.summary, before_snapshot: before.snapshot_hash, after_snapshot: after.snapshot_hash }, null, 2));
    process.exitCode = after.summary.skill_changes || after.summary.agent_changes || after.summary.unconfirmed || after.summary.agent_warnings || after.summary.sync_blockers.length ? 2 : 0;
    return;
  }
  throw new SyncError("REQUEST_INVALID", "用法：multica-skill-sync.mjs audit|apply --repo=... --profile=... --workspace-id=...");
}

try { main(); }
catch (error) {
  console.error(JSON.stringify({ status: "cannot_confirm", error: { code: error.code ?? "UNAVAILABLE", message: error.message } }, null, 2));
  process.exitCode = 3;
}
