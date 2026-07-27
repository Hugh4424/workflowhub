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
const HOST_SKILL = "workflowhub-host-protocol";
const EXTERNAL_ONLY = new Set(["anysearch", "caveman"]);
const LEGACY_PROMPT_MARKERS = [
  /context\.migration_ref\s*==/i,
  /runner_root_migration/i,
  /git\s+-C\s+["']?\$runner_root/i,
  /必须验证[^\n]*runner_root/i,
  /把已验证的 `runner_root` 设为/i,
];
const CURRENT_PROMPT_MARKERS = [/execution_mode=per_invocation/i, /launcher-owned runtime/i, /执行身份.*记录/i];

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

function run(command, argv, { cwd, input } = {}) {
  return execFileSync(command, argv, {
    cwd,
    input,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    stdio: [input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
  });
}

function jsonRun(command, argv, options) {
  return JSON.parse(run(command, argv, options));
}

function git(repo, argv) { return run("git", argv, { cwd: repo }); }
function sha(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
function multica(profile, workspace, argv, options) {
  return jsonRun("multica", ["--profile", profile, "--workspace-id", workspace, ...argv], options);
}
function unwrap(value, key) { return value?.[key] ?? value?.data ?? value; }

function mainBytes(repo, relativePath) {
  return Buffer.from(git(repo, ["show", `main:${relativePath}`]));
}

function mainText(repo, relativePath) { return mainBytes(repo, relativePath).toString("utf8"); }

function mainPaths(repo, prefix) {
  return git(repo, ["ls-tree", "-r", "--name-only", "main", "--", prefix])
    .split("\n").map(value => value.trim()).filter(Boolean);
}

function catalog(repo) { return yaml.load(mainText(repo, "skills/catalog.yaml")); }

function managedSkillNames(repo) {
  const names = new Set([HOST_SKILL]);
  for (const stage of STAGES) for (const dependency of stageDependencies(repo, stage)) names.add(dependency);
  return [...names].sort();
}

function bundleFor(repo, name) {
  const relativePath = `skills/${name}/skill-bundle.json`;
  if (!mainPaths(repo, relativePath).includes(relativePath)) return null;
  return JSON.parse(mainText(repo, relativePath));
}

function bundlePaths(bundle) {
  return new Set((bundle?.files ?? []).map(entry => typeof entry === "string" ? entry : entry.path));
}

function supportPaths(bundle) {
  if (!bundle) return new Set();
  const paths = bundlePaths(bundle);
  paths.delete("SKILL.md");
  paths.add("skill-bundle.json");
  return paths;
}

function normalizeOnlineSkill(value) {
  const item = unwrap(value, "skill");
  return { ...item, content: item.content ?? "", files: item.files ?? [] };
}

function onlineSkillDetail(profile, workspace, skill) {
  const primary = normalizeOnlineSkill(multica(profile, workspace, ["skill", "get", skill.id, "--output", "json"]));
  const files = unwrap(multica(profile, workspace, ["skill", "files", "list", skill.id, "--output", "json"]), "files");
  return { ...primary, files: Array.isArray(files) ? files : [] };
}

function localSkillSnapshot(repo, name) {
  const relativePath = `skills/${name}/SKILL.md`;
  const bundle = bundleFor(repo, name);
  const files = {};
  for (const file of supportPaths(bundle)) files[file] = sha(mainBytes(repo, `skills/${name}/${file}`));
  return { name, path: relativePath, primary_sha256: sha(mainBytes(repo, relativePath)), bundle, files };
}

function stageSnapshot(repo, stage) {
  const relativePath = `workflows/${stage}/SKILL.md`;
  return { name: stage, path: relativePath, primary_sha256: sha(mainBytes(repo, relativePath)), files: {}, bundle: null };
}

function stageDependencies(repo, stage) {
  const manifest = yaml.load(mainText(repo, `workflows/${stage}/skill-deps.yaml`));
  return (manifest.skills ?? []).map(entry => entry.name);
}

function expectedAgentSkills(repo, name) {
  const role = CORE_AGENTS[name];
  const names = new Set([HOST_SKILL]);
  if (role?.stage) {
    names.add(role.stage);
    for (const dependency of stageDependencies(repo, role.stage)) names.add(dependency);
  }
  return [...names].sort();
}

function promptIssues(instructions) {
  return {
    legacy: LEGACY_PROMPT_MARKERS.filter(pattern => pattern.test(instructions)).map(pattern => pattern.source),
    missing_current: CURRENT_PROMPT_MARKERS.filter(pattern => !pattern.test(instructions)).map(pattern => pattern.source),
  };
}

function audit({ repo, profile, workspace }) {
  const status = git(repo, ["status", "--porcelain"]);
  const branch = git(repo, ["branch", "--show-current"]).trim();
  const mainCommit = git(repo, ["rev-parse", "main"]).trim();
  let originMain = null;
  try { originMain = git(repo, ["rev-parse", "origin/main"]).trim(); } catch {}

  const listedSkills = unwrap(multica(profile, workspace, ["skill", "list", "--output", "json"]), "skills");
  const onlineSkills = new Map(listedSkills.map(item => [item.name, item]));
  const skillReports = [];
  const localNames = new Set([...STAGES, ...managedSkillNames(repo)]);
  for (const name of [...localNames].sort()) {
    const local = STAGES.includes(name) ? stageSnapshot(repo, name) : localSkillSnapshot(repo, name);
    const listed = onlineSkills.get(name);
    if (!listed) {
      skillReports.push({ ...local, status: EXTERNAL_ONLY.has(name) ? "external_unmanaged" : "missing_online", online_id: null, files: { missing: Object.keys(local.files), extra: [] } });
      continue;
    }
    const online = onlineSkillDetail(profile, workspace, listed);
    const onlineFiles = new Map(online.files.map(file => [file.path, file]));
    const missing = Object.keys(local.files).filter(file => !onlineFiles.has(file));
    const mismatched = Object.keys(local.files).filter(file => onlineFiles.has(file) && sha(Buffer.from(onlineFiles.get(file).content ?? "")) !== local.files[file]);
    const extra = local.bundle
      ? [...onlineFiles.keys()].filter(file => !Object.prototype.hasOwnProperty.call(local.files, file))
      : [];
    const primaryMismatch = sha(Buffer.from(online.content)) !== local.primary_sha256;
    skillReports.push({
      ...local,
      online_id: listed.id,
      online_updated_at: listed.updated_at,
      online_primary_sha256: sha(Buffer.from(online.content)),
      status: EXTERNAL_ONLY.has(name) ? "external_unmanaged" : (primaryMismatch || missing.length || mismatched.length ? "needs_update" : "match"),
      primary_mismatch: primaryMismatch,
      files: { missing, mismatched, extra },
    });
  }

  const listedAgents = unwrap(multica(profile, workspace, ["agent", "list", "--output", "json"]), "agents");
  const agentReports = [];
  for (const [name] of Object.entries(CORE_AGENTS)) {
    const agent = listedAgents.find(item => item.name === name);
    const expected = expectedAgentSkills(repo, name);
    if (!agent) { agentReports.push({ name, status: "missing_online", expected_skills: expected }); continue; }
    const actual = (agent.skills ?? []).map(skill => skill.name ?? skill).sort();
    const missingSkills = expected.filter(skill => !actual.includes(skill));
    const issues = promptIssues(agent.instructions ?? "");
    agentReports.push({ name, id: agent.id, status: missingSkills.length || issues.legacy.length || issues.missing_current.length ? "needs_update" : "match", expected_skills: expected, actual_skills: actual, missing_skills: missingSkills, prompt: { sha256: sha(agent.instructions ?? ""), ...issues } });
  }

  const unmanagedOnline = [...onlineSkills.keys()].filter(name => !localNames.has(name)).sort();
  const summary = {
    local_skill_count: localNames.size,
    online_managed_count: skillReports.filter(item => item.status === "match").length,
    skill_changes: skillReports.filter(item => item.status === "needs_update" || item.status === "missing_online").length,
    external_differences: skillReports.filter(item => item.status === "external_unmanaged").length,
    agent_changes: agentReports.filter(item => item.status !== "match").length,
    unmanaged_online_skills: unmanagedOnline,
    dirty_worktree: Boolean(status),
    branch,
    main_commit: mainCommit,
    origin_main: originMain,
  };
  return { version: "workflowhub-multica-sync.v1", repo, profile, workspace, snapshot: { main_commit: mainCommit, origin_main: originMain }, summary, skills: skillReports, agents: agentReports };
}

function printAudit(report) {
  const { summary } = report;
  console.log(`main=${summary.main_commit} origin/main=${summary.origin_main ?? "not-found"} branch=${summary.branch} dirty=${summary.dirty_worktree}`);
  console.log(`技能：本地运行闭包 ${summary.local_skill_count}，需处理 ${summary.skill_changes}，外部技能差异 ${summary.external_differences}，Multica 额外技能 ${summary.unmanaged_online_skills.join(", ") || "无"}`);
  for (const item of report.skills.filter(value => value.status !== "match")) console.log(`- 技能 ${item.name}: ${item.status}; primary=${item.primary_mismatch ? "不一致" : "一致"}; missing=${item.files.missing.join(",") || "无"}; mismatched=${item.files.mismatched.join(",") || "无"}; extra=${item.files.extra.join(",") || "无"}`);
  for (const item of report.agents.filter(value => value.status !== "match")) console.log(`- Agent ${item.name}: ${item.status}; 缺技能=${item.missing_skills?.join(",") || "无"}; 旧提示词=${item.prompt?.legacy?.join(",") || "无"}; 当前规则缺失=${item.prompt?.missing_current?.join(",") || "无"}`);
  if (!summary.skill_changes && !summary.agent_changes) console.log("未发现需要同步的问题。");
}

function writeTemp(content, suffix) {
  const directory = fs.mkdtempSync(path.join(process.env.TMPDIR ?? "/tmp", "workflowhub-multica-sync-"));
  const file = path.join(directory, suffix.replaceAll("/", "_"));
  fs.writeFileSync(file, content);
  return file;
}

function apply({ report, cleanupExtra }) {
  const actions = [];
  const byName = new Map(unwrap(multica(report.profile, report.workspace, ["skill", "list", "--output", "json"]), "skills").map(item => [item.name, item]));
  for (const item of report.skills) {
    if (EXTERNAL_ONLY.has(item.name)) continue;
    const content = mainBytes(report.repo, item.path);
    let online = byName.get(item.name);
    if (!online) {
      const created = unwrap(multica(report.profile, report.workspace, ["skill", "create", "--name", item.name, "--content-stdin", "--output", "json"], { input: content }), "skill");
      online = created; byName.set(item.name, online); actions.push(`create skill ${item.name}`);
    } else if (item.primary_mismatch || item.status === "missing_online") {
      multica(report.profile, report.workspace, ["skill", "update", online.id, "--content-stdin", "--output", "json"], { input: content });
      actions.push(`update skill ${item.name}`);
    }
    const bundle = item.bundle;
    for (const file of supportPaths(bundle)) {
      const bytes = mainBytes(report.repo, `skills/${item.name}/${file}`);
      multica(report.profile, report.workspace, ["skill", "files", "upsert", online.id, "--path", file, "--content-stdin", "--output", "json"], { input: bytes });
      actions.push(`upsert ${item.name}/${file}`);
    }
    if (cleanupExtra && bundle) {
      const onlineDetail = onlineSkillDetail(report.profile, report.workspace, online);
      const allowed = supportPaths(bundle);
      for (const file of onlineDetail.files.filter(value => !allowed.has(value.path))) {
        multica(report.profile, report.workspace, ["skill", "files", "delete", online.id, file.id]);
        actions.push(`delete ${item.name}/${file.path}`);
      }
    }
  }
  const skillIds = new Map(unwrap(multica(report.profile, report.workspace, ["skill", "list", "--output", "json"]), "skills").map(item => [item.name, item.id]));
  const agents = unwrap(multica(report.profile, report.workspace, ["agent", "list", "--output", "json"]), "agents");
  for (const item of report.agents) {
    const agent = agents.find(value => value.name === item.name);
    if (!agent) continue;
    if (item.prompt?.legacy?.length) {
      const next = (agent.instructions ?? "").replace(/0\. `workflowhub-context\.root`[\s\S]*?(?=\n\n1\. )/, "0. `workflowhub-context.root` 只是存储根。新任务按 `execution_mode=per_invocation` 运行：不要求 `runner_root`、`runner_oid` 或 `migration_ref`，也不把 task 绑定本机目录、固定 commit 或 replacement。每次官方入口由 launcher-owned runtime 独立认证当前代码，并把 commit/tree、合同版本和能力写入审计；执行身份只记录，不决定需求、质量、阶段结果或放行。不要从 root、task_path、cwd 或业务仓猜执行环境，也不要复制宿主文件到目标仓。旧 `legacy_pinned` 字段只读兼容，不能作为新业务门禁。");
      if (next === agent.instructions) throw new Error(`无法安全改写 ${item.name} 提示词`);
      multica(report.profile, report.workspace, ["agent", "update", agent.id, "--instructions", next, "--output", "json"]);
      actions.push(`update agent prompt ${item.name}`);
    }
    const missingIds = item.missing_skills.map(name => skillIds.get(name)).filter(Boolean);
    if (missingIds.length) { multica(report.profile, report.workspace, ["agent", "skills", "add", agent.id, "--skill-ids", missingIds.join(","), "--output", "json"]); actions.push(`bind ${item.name}: ${item.missing_skills.join(",")}`); }
  }
  return actions;
}

const input = argsOf(process.argv.slice(2));
const command = process.argv[2];
const repo = path.resolve(input.repo ?? process.cwd());
const profile = input.profile ?? process.env.MULTICA_PROFILE ?? "desktop-api.multica.ai";
const workspace = input["workspace-id"] ?? process.env.MULTICA_WORKSPACE_ID;
if (!workspace) throw new Error("缺少 --workspace-id；不会猜 workspace");
if (!fs.existsSync(path.join(repo, ".git"))) throw new Error(`不是 Git 仓库：${repo}`);

if (command === "audit") {
  const report = audit({ repo, profile, workspace });
  if (input.format === "json") console.log(JSON.stringify(report, null, 2)); else printAudit(report);
  process.exit(report.summary.skill_changes || report.summary.agent_changes ? 2 : 0);
}

if (command === "apply") {
  if (input.confirm !== "I_CONFIRM") throw new Error("apply 必须带 --confirm=I_CONFIRM；先完成审计并取得用户确认");
  const before = audit({ repo, profile, workspace });
  const actions = apply({ report: before, cleanupExtra: input["cleanup-extra"] === "true" || input["cleanup-extra"] === true });
  const after = audit({ repo, profile, workspace });
  console.log(JSON.stringify({ actions, before: before.summary, after: after.summary }, null, 2));
  process.exit(after.summary.skill_changes || after.summary.agent_changes ? 2 : 0);
} else if (command !== "audit") {
  throw new Error("用法：multica-skill-sync.mjs audit|apply --repo=... --profile=... --workspace-id=...");
}
