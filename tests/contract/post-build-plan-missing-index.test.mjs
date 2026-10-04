import { afterEach, describe, expect, it } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTask } from '../../runtime/task/task-handle.mjs';
import { initializeTaskStore } from '../../runtime/task/task-store.mjs';
import { validatePostPhaseContract } from '../../runtime/stage/stage-content-contracts.mjs';
const roots=[],taskId='post-plan-missing-index',cliPath=fileURLToPath(new URL('../../tools/cli/stage-runtime.mjs',import.meta.url));
const git=(cwd,args)=>execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
afterEach(()=>{while(roots.length)rmSync(roots.pop(),{recursive:true,force:true});});
async function fixture(){const root=realpathSync(mkdtempSync(join(tmpdir(),'workflowhub-post-plan-index-')));roots.push(root);const repo=join(root,'repo'),worktree=join(root,'worktree'),storage=join(root,'storage'),home=join(root,'owned-child-home');for(const p of[repo,storage,home])mkdirSync(p);git(repo,['init','-q','-b','main']);git(repo,['config','user.name','WorkflowHub Tests']);git(repo,['config','user.email','tests@workflowhub.local']);git(repo,['commit','--allow-empty','-qm','baseline']);git(repo,['worktree','add','-q','-b',`task/workflowhub/${taskId}`,worktree,'main']);const task=await createTask({storageRoot:storage,manifest:{schema_version:'1.0.0',project_name:'workflowhub',task_id:taskId,created_at:'2026-09-27T00:00:00.000Z',target_repo_root:repo,workspace_mode:'existing',workspace_root:worktree,activation_cohort:'post',execution_mode:'per_invocation',record_model:'vnext-single-write',issue_ids:[],inputs:{}}});await initializeTaskStore(task.taskPath,{taskId});const materialRoot=join(worktree,'specs',taskId);mkdirSync(materialRoot,{recursive:true});const decision='## 任务身份\n\n- **任务类型**：普通任务\n',spec='# Current post specification\r\n';writeFileSync(join(materialRoot,'decision-log.md'),decision);writeFileSync(join(materialRoot,'spec.md'),spec);const input=join(worktree,'cursor-input.json');writeFileSync(input,JSON.stringify({phase_progress:{phase_id:'P1',task_id:'T001'}})+'\n');return{root,repo,worktree,storage,home,task,materialRoot,input,decision,spec};}
function cli(f,command,stage='build-code',extra=[]){return spawnSync(process.execPath,[cliPath,command,...(command==='status'?['--action=begin']:[]),`--stage=${stage}`,'--project=workflowhub',`--task=${taskId}`,`--task-path=${f.task.taskPath}`,...extra],{cwd:f.worktree,env:{...process.env,HOME:f.home,XDG_CONFIG_HOME:join(f.home,'.config'),WORKFLOWHUB_TASK_DIR:f.storage},encoding:'utf8',timeout:15000});}
const index='## Execution Index\n\n| phase | authority ref |\n| --- | --- |\n| `P1` | `phases/P1.md` |\n';
function originals(f){return{manifest:readFileSync(join(f.task.taskPath,'task.json')),facts:readFileSync(join(f.task.taskPath,'facts.jsonl')),decision:readFileSync(join(f.materialRoot,'decision-log.md')),spec:readFileSync(join(f.materialRoot,'spec.md'))};}
describe('post authored Phase index current public behavior',()=>{
  it('reports the exact missing authored index as material readiness without a completion or quality claim',async()=>{const f=await fixture(),before=originals(f),r=cli(f,'status');expect(r.error).toBeUndefined();expect(r.status).toBe(0);const result=JSON.parse(r.stdout);expect(result.work_status).toBe('not_ready');expect(result.missing_materials).toEqual(['phases/index.md']);expect(result.materials['phases/index.md']).toBe(false);expect(result.quality_status).toBe('unknown');expect(result.facts).toEqual([]);expect(originals(f)).toEqual(before);expect(existsSync(join(f.materialRoot,'phases'))).toBe(false);});
  it('actual public run with an absent index fails with the real missing path before any cursor write',async()=>{const f=await fixture(),before=originals(f),r=cli(f,'run','build-code',['--action=execute',`--input=${f.input}`]);expect(r.error).toBeUndefined();expect(r.status).toBe(1);const failure=JSON.parse(r.stderr);expect(failure.code).toBe('ENOENT');expect(failure.error).toContain(join(f.materialRoot,'phases/index.md'));expect(originals(f)).toEqual(before);expect(existsSync(join(f.materialRoot,'phases'))).toBe(false);});
  it('still lets the build-plan author draft a missing index with exact ordinary bytes',async()=>{const f=await fixture(),before=originals(f),source=join(f.worktree,'draft-index.md');writeFileSync(source,index);const r=cli(f,'run','build-plan',['--action=draft','--name=phases/index.md',`--input=${source}`]);expect(r.error).toBeUndefined();expect(r.status).toBe(0);expect(JSON.parse(r.stdout).artifact_ref).toBe(`specs/${taskId}/phases/index.md`);expect(readFileSync(join(f.materialRoot,'phases/index.md'),'utf8')).toBe(index);expect(originals(f)).toEqual(before);const status=cli(f,'status');expect(status.status).toBe(0);expect(JSON.parse(status.stdout).missing_materials).toEqual(['phases/P1.md']);expect(existsSync(join(f.materialRoot,'phases/P1.md'))).toBe(false);});
  it('reads present index and Phase as ready while retired stage execution cannot manufacture facts',async()=>{const f=await fixture();mkdirSync(join(f.materialRoot,'phases'));writeFileSync(join(f.materialRoot,'phases/index.md'),index);writeFileSync(join(f.materialRoot,'phases/P1.md'),'# Phase P1\n');const before=originals(f),r=cli(f,'status');expect(r.error).toBeUndefined();expect(r.status).toBe(0);const value=JSON.parse(r.stdout);expect(value.work_status).toBe('ready');expect(value.missing_materials).toEqual([]);expect(value.materials['phases/index.md']).toBe(true);expect(value.materials['phases/P1.md']).toBe(true);expect(value.quality_status).toBe('unknown');expect(value.facts).toEqual([]);const old=join(f.worktree,'retired-run-input.json');writeFileSync(old,'{}\n');const retired=cli(f,'run','build-plan',['--action=execute',`--input=${old}`]);expect(retired.error).toBeUndefined();expect(retired.status).toBe(1);expect(retired.stderr).toMatch(/only records the existing build-code phase_progress cursor; official stage execution is retired/);expect(originals(f)).toEqual(before);expect(readFileSync(join(f.materialRoot,'phases/index.md'),'utf8')).toBe(index);expect(readFileSync(join(f.materialRoot,'phases/P1.md'),'utf8')).toBe('# Phase P1\n');});
});

// G2 declaration-only integration of main 44738017; no execution/quality permit.
describe("current G2 Phase declaration and actual author template", () => {
const thinSpec = `# Specification

- **FR-001**：用户能够看见当前结果。
- **FR-002**：错误保持可见。
- **AC-001**：给定有效输入，执行后显示结果；结果可读；空结果判失败。
- **AC-002**：给定失败输入，执行后报告错误；错误可定位；隐藏错误判失败。
`;

const spec = `${thinSpec}
## 实现设计（全局权威）

### Code Anchors

\`src/first.mjs#renderResult\` owns visible results; \`src/second.mjs#reportError\` owns error display.

### Interfaces and Failure Semantics

renderResult(input) returns visible output and rejects empty output; reportError(error) preserves actionable error text.

### Requirement-to-Task Trace

| source | FR | AC | Phase/Task | oracle | evidence |
| --- | --- | --- | --- | --- | --- |
| R-001 | FR-001 | AC-001 | P1/T001 | ORACLE-P1 | \`quality/tests/p1.json\` |
| R-002 | FR-002 | AC-002 | P2/T002 | ORACLE-P2 | \`quality/tests/p2.json\` |

### Global Verification Strategy

Run \`node --test tests/p1.test.mjs\` and \`node --test tests/p2.test.mjs\`; RED must show the target assertion failure; GREEN must exit 0 and preserve evidence.
`;

const thinPhase = (id, dependency, file, fr, ac) => `# Phase ${id} — ${file}

- **Global spec**：\`spec.md\`
- **Write set**：\`${file}\`
- **Dependency**：\`${dependency}\`
- **Consumer**：build-code

## L0 — Outcome

实现 ${fr}，以 ${ac} 判断结果。

## L1 — Contract

- **FR / AC**：${fr} / ${ac}
- **Tasks**：\`T${id.slice(1)}01 RED\` → \`T${id.slice(1)}02 GREEN\`
- **gate_cmd**：\`node --test tests/${id.toLowerCase()}.test.mjs\`
- **expected_exit**：RED nonzero assertion failure；GREEN 0。
- **oracle**：ORACLE-${id}
- **evidence_path**：\`quality/tests/${id.toLowerCase()}.json\`
- **STOP**：输入合同变化则返回 spec owner。
- **Done**：正例和负例可回放。

## L2 — Removable reference

实现参考可删除；删除后 L0/L1 不变。过期条件：验收合同改变。
`;

const phase = (id, dependency, file, fr, ac) => thinPhase(id, dependency, file, fr, ac).replace(
  "## L2 — Removable reference",
  `### T00${id.slice(1)} — deliver ${file}

- **Source / FR / AC**：R-00${id.slice(1)} / ${fr} / ${ac}。
- **Files / symbols**：\`${file}\` symbol: ${id === "P1" ? "renderResult" : "reportError"}.
- **Action**：Implement the observable result and preserve the negative path.
- **Inputs**：A valid input and one failing input with deterministic fixture.
- **Outputs / failure**：Visible result on success; explicit failure when empty or invalid.
- **Dependency**：${dependency}
- **Boundary / DO NOT TOUCH**：Only \`${file}\`; do not edit the adjacent module.
- **Test tier / skill**：feature / backend-testing.
- **Scenario / fixture or service**：Valid result and hidden-output negative case; use local fixture and remove it after test.
- **RED/GREEN gate_cmd**：\`node --test tests/${id.toLowerCase()}.test.mjs\`.
- **expected_exit**：RED target assertion nonzero; GREEN 0.
- **RED target failure**：ORACLE-${id}; the ${ac} assertion fails when the output is hidden.
- **GREEN oracle**：ORACLE-${id}; the ${ac} assertion passes and failure remains visible.
- **Evidence**：\`quality/tests/${id.toLowerCase()}.json\` with command, exit, and assertion.
- **STOP / recovery**：Stop if source contract changes; revise spec and this task card.
- **Coverage limit**：This targeted fixture does not prove historical task migration.
- **Done**：${ac} normal and negative result, test evidence, and readback are present.

## L2 — Removable reference`,
);

const phases = {
  "phases/P1.md": phase("P1", "none", "src/first.mjs", "FR-001", "AC-001"),
  "phases/P2.md": phase("P2", "P1", "src/second.mjs", "FR-002", "AC-002"),
};

const index = `# Phase index

## Execution Index

| phase | authority ref | semantic anchor | write set | dependency | consumer |
| --- | --- | --- | --- | --- | --- |
| \`P1\` | \`phases/P1.md\` | \`phase-p1\` | \`src/first.mjs\` | \`none\` | build-code |
| \`P2\` | \`phases/P2.md\` | \`phase-p2\` | \`src/second.mjs\` | \`P1\` | build-code |
`;

// A legacy natural-language card shape, not a new verification-role schema.
// Runtime/source read anchors deliberately stay outside backticks in Files: only
// the backticked document is owned; reading existing code is not a code write.
const pureDocFixture = () => {
  const docPath = "docs/calendar-refresh.md";
  let body = phases["phases/P1.md"].replaceAll("src/first.mjs", docPath);
  const replaceField = (field, value) => {
    const line = body.split("\n").filter((entry) => entry.startsWith(`- **${field}**：`)).at(-1);
    if (!line) throw new Error(`fixture field missing: ${field}`);
    body = body.replace(line, `- **${field}**：${value}`);
  };
  replaceField("Files / symbols", `owner=documentation; \`${docPath}\`; N/A — 非代码文档；只读锚点 runtime/publish.mjs:20。`);
  replaceField("Action", "仅编写既有 publish 操作说明，不新增生产抓取器或调度器。");
  replaceField("Inputs", "G-2文档无新行为；既有 publish fixture 和逐步命令审查。");
  replaceField("Scenario / fixture or service", "G-2文档无新行为；既有 publish 正例及未确认差异不发布负例；临时目录 finally 清理。");
  replaceField("expected_exit", "G-2文档/既有publish客观检查预期0；不执行RED、不宣称目标RED；原lint false并披露，结构接纳不等于替代已执行或阶段完成。");
  replaceField("RED target failure", "ORACLE-P1；文档的既有publish步骤可在tmp_path复放，未确认差异不会发布的断言。");
  body = body.replace("- **GREEN oracle**", "- **RED 证据**：N/A — G-2纯文档流程无新增运行行为，风险为操作者误把凭据provider当免凭据；客观替代为既有publish用例重放与独立逐步文档审查，不能宣称新增RED。\n- **GREEN oracle**");
  replaceField("GREEN oracle", "ORACLE-P1；同命令退出0，未确认差异不发布；历史不重写。");
  return {
    spec: spec.replaceAll("src/first.mjs", docPath),
    index: index.replaceAll("src/first.mjs", docPath),
    phases: { ...phases, "phases/P1.md": body },
  };
};
const withDocChange = (fixture, from, to) => ({
  ...fixture,
  phases: { ...fixture.phases, "phases/P1.md": fixture.phases["phases/P1.md"].replace(from, to) },
});

describe("post-cohort narrow pure-document G-2", () => {
  it.each([
    ["one-character placeholder", "expected x preserves evidence", false],
    ["named English procedure and outcome", "expected publish procedure preserves credential requirements", true],
  ])("checks the English criterion: %s", (_name, criterion, accepted) => {
    let fixture = withDocChange(pureDocFixture(),
      "ORACLE-P1；文档的既有publish步骤可在tmp_path复放，未确认差异不会发布的断言。",
      `ORACLE-P1；${criterion}。`);
    fixture = withDocChange(fixture,
      "ORACLE-P1；同命令退出0，未确认差异不发布；历史不重写。",
      `ORACLE-P1；${criterion}。`);
    const result = validatePostPhaseContract(fixture);
    expect(result.ok, result.errors.join("; ")).toBe(accepted);
    if (!accepted) expect(result.errors.join("; ")).toMatch(/G-2.*objective alternative/i);
    else expect(result.facts.command_oracle_checks.valid).toBe(true);
  });

  it("accepts a complete legacy pure-doc card without ceremonial RED or new fields", () => {
    const fixture = pureDocFixture();
    const before = JSON.stringify(fixture);
    const result = validatePostPhaseContract(fixture);
    expect(result.ok, result.errors.join("; ")).toBe(true);
    expect(result.facts.command_oracle_checks.valid).toBe(true);
    expect(JSON.stringify(fixture)).toBe(before);
    expect(fixture.phases["phases/P1.md"]).toContain("原lint false并披露");
    expect(fixture.phases["phases/P1.md"]).not.toContain("verification_role");
    expect(fixture.phases["phases/P1.md"]).not.toContain("paired_task");
  });

  it.each([
    ["reason", "G-2纯文档流程无新增运行行为", "G-2"],
    ["risk", "风险为操作者误把凭据provider当免凭据；", ""],
    ["objective alternative", "客观替代为既有publish用例重放与独立逐步文档审查，", ""],
    ["acceptance disclosure", "原lint false并披露，结构接纳不等于替代已执行或阶段完成。", ""],
    ["empty", "N/A — G-2纯文档流程无新增运行行为，风险为操作者误把凭据provider当免凭据；客观替代为既有publish用例重放与独立逐步文档审查，不能宣称新增RED。", ""],
    ["bare N/A", "N/A — G-2纯文档流程无新增运行行为，风险为操作者误把凭据provider当免凭据；客观替代为既有publish用例重放与独立逐步文档审查，不能宣称新增RED。", "N/A"],
  ])("rejects a doc card missing concrete %s", (missing, from, to) => {
    const result = validatePostPhaseContract(withDocChange(pureDocFixture(), from, to));
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(new RegExp(`G-2.*${missing}|${missing}.*G-2`, "i"));
  });

  it("rejects an arbitrary G-2 label on a markdown task", () => {
    let fixture = pureDocFixture();
    fixture = withDocChange(fixture, "G-2文档无新行为", "G-2");
    fixture = withDocChange(fixture, "G-2文档无新行为", "G-2");
    const result = validatePostPhaseContract(fixture);
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(/G-2.*(?:pure|无新|documentation|声明)/i);
  });

  it.each([
    ["vague risk", "风险为操作者误把凭据provider当免凭据", "风险为风险", /G-2.*risk/i],
    ["no risk", "风险为操作者误把凭据provider当免凭据", "无风险", /G-2.*risk/i],
    ["vague alternative", "客观替代为既有publish用例重放与独立逐步文档审查", "客观替代为替代", /G-2.*objective alternative/i],
    ["deferred alternative", "客观替代为既有publish用例重放与独立逐步文档审查", "客观替代为按需验证", /G-2.*objective alternative/i],
    ["vague disclosure", "原lint false并披露，结构接纳不等于替代已执行或阶段完成。", "已披露。", /G-2.*acceptance disclosure/i],
    ["runtime contradiction", "仅编写既有 publish 操作说明，不新增生产抓取器或调度器。", "新增 runtime 运行行为。", /G-2.*contradiction/i],
    ["logic contradiction", "Visible result on success; explicit failure when empty or invalid.", "修改执行逻辑。", /G-2.*contradiction/i],
    ["missing objective exit", "客观检查预期0", "客观检查按需处理", /G-2.*expected_exit/i],
  ])("rejects nonempty but inadequate %s", (_name, from, to, error) => {
    const result = validatePostPhaseContract(withDocChange(pureDocFixture(), from, to));
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(error);
    expect(Array.isArray(result.errors)).toBe(true);
    expect(result.errors.every((entry) => typeof entry === "string")).toBe(true);
  });

  it("keeps the positive behavior control accepted with real RED nonzero and GREEN 0", () => {
    const result = validatePostPhaseContract({ spec, index, phases });
    expect(result.ok, result.errors.join("; ")).toBe(true);
    expect(result.facts.command_oracle_checks.valid).toBe(true);
  });

  it("does not force legal behavior or mixed RED/GREEN to opt into G-2 when it is inapplicable", () => {
    const behavior = { spec, index, phases: { ...phases, "phases/P1.md": phases["phases/P1.md"].replace("A valid input and one failing input with deterministic fixture.", "G-2不适用，本任务新增运行行为；有效及非法输入fixture。") } };
    const behaviorResult = validatePostPhaseContract(behavior);
    expect(behaviorResult.ok, behaviorResult.errors.join("; ")).toBe(true);
    const mixed = {
      ...behavior,
      index: behavior.index.replace("`src/first.mjs`", "`src/first.mjs` `docs/mixed.md`"),
      phases: { ...behavior.phases, "phases/P1.md": behavior.phases["phases/P1.md"]
        .replace("**Write set**：`src/first.mjs`", "**Write set**：`src/first.mjs` `docs/mixed.md`")
        .replace("`src/first.mjs` symbol:", "`src/first.mjs` `docs/mixed.md` symbol:") },
    };
    const mixedResult = validatePostPhaseContract(mixed);
    expect(mixedResult.ok, mixedResult.errors.join("; ")).toBe(true);
  });

  it("rejects a risk phrase that only repeats failure risk without object or consequence", () => {
    const fixture = withDocChange(pureDocFixture(), "风险为操作者误把凭据provider当免凭据", "风险为失败风险");
    const result = validatePostPhaseContract(fixture);
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(/G-2.*risk/i);
  });

  it("allows independent document review when its same oracle supplies a concrete criterion", () => {
    const fixture = withDocChange(pureDocFixture(), "客观替代为既有publish用例重放与独立逐步文档审查", "客观替代为独立文档审查");
    const result = validatePostPhaseContract(fixture);
    expect(result.ok, result.errors.join("; ")).toBe(true);
  });

  it("rejects an independent document review whose only criterion is a bare assertion", () => {
    let fixture = withDocChange(pureDocFixture(), "客观替代为既有publish用例重放与独立逐步文档审查", "客观替代为独立文档审查");
    fixture = withDocChange(fixture, "ORACLE-P1；文档的既有publish步骤可在tmp_path复放，未确认差异不会发布的断言。", "ORACLE-P1；断言。");
    // GREEN still supplies the concrete criterion in this otherwise legal
    // control; remove only that criterion to isolate the missing object.
    const criterionControl = validatePostPhaseContract(fixture);
    expect(criterionControl.ok, criterionControl.errors.join("; ")).toBe(true);
    fixture = withDocChange(fixture, "ORACLE-P1；同命令退出0，未确认差异不发布；历史不重写。", "ORACLE-P1；断言。");
    const result = validatePostPhaseContract(fixture);
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(/G-2.*objective alternative/i);
  });

  it("does not let unrelated Action text supply the missing risk", () => {
    let fixture = withDocChange(pureDocFixture(), "风险为操作者误把凭据provider当免凭据；", "");
    fixture = withDocChange(fixture, "仅编写既有 publish 操作说明", "风险为操作者误把凭据provider当免凭据；仅编写既有 publish 操作说明");
    const result = validatePostPhaseContract(fixture);
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(/G-2.*risk/i);
  });

  it("does not exempt mixed document/code ownership or ordinary behavior from RED", () => {
    const fixture = pureDocFixture();
    const mixed = {
      ...fixture,
      index: fixture.index.replace("`docs/calendar-refresh.md`", "`docs/calendar-refresh.md` `src/mixed.mjs`"),
      phases: { ...fixture.phases, "phases/P1.md": fixture.phases["phases/P1.md"]
        .replace("**Write set**：`docs/calendar-refresh.md`", "**Write set**：`docs/calendar-refresh.md` `src/mixed.mjs`")
        .replace("owner=documentation;", "owner=documentation; `src/mixed.mjs` symbol: run;") },
    };
    const mixedResult = validatePostPhaseContract(mixed);
    expect(mixedResult.ok).toBe(false);
    expect(mixedResult.errors.join("; ")).toMatch(/expected_exit.*RED target failure/);
    const behavior = { spec, index, phases: { ...phases, "phases/P1.md": phases["phases/P1.md"].replace("RED target assertion nonzero; GREEN 0.", "GREEN 0.") } };
    const behaviorResult = validatePostPhaseContract(behavior);
    expect(behaviorResult.ok).toBe(false);
    expect(behaviorResult.errors.join("; ")).toMatch(/expected_exit.*RED target failure/);
    expect(validatePostPhaseContract({ spec, index, phases }).ok).toBe(true);
  });

  it.each([
    ["source", "R-001 / FR-001 / AC-001", "FR-001 / AC-001", /original source/],
    ["owner", "`docs/calendar-refresh.md`; N/A", "`docs/unowned.md`; N/A", /owned write-set/],
    ["dependency", "**Dependency**：none", "**Dependency**：T999", /dependency.*T999/],
    ["oracle", "RED target failure**：ORACLE-P1", "RED target failure**：ORACLE-UNRELATED", /RED.*oracle/],
  ])("retains the %s check for an otherwise legal G-2", (_name, from, to, error) => {
    const result = validatePostPhaseContract(withDocChange(pureDocFixture(), from, to));
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(error);
  });

  it("does not ignore an unclassified backticked write path", () => {
    const fixture = withDocChange(pureDocFixture(), "owner=documentation;", "owner=documentation; `unclassified`;");
    const result = validatePostPhaseContract(fixture);
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(/G-2.*owned write set/);
  });

  it.each([
    ["FR", "R-001 / FR-001 / AC-001", "R-001 / FR-999 / AC-001", /unknown FR/],
    ["AC", "R-001 / FR-001 / AC-001", "R-001 / FR-001 / AC-999", /unknown AC/],
  ])("retains the %s identity check for G-2", (_name, from, to, error) => {
    const result = validatePostPhaseContract(withDocChange(pureDocFixture(), from, to));
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(error);
  });

  it("accepts only supported alternate placement and normalized declaration syntax", () => {
    let fixture = withDocChange(pureDocFixture(), "G-2文档无新行为", "G-2 文档，无新增 runtime");
    fixture = withDocChange(fixture, "客观替代为既有publish用例重放与独立逐步文档审查，", "");
    fixture = withDocChange(fixture, "with command, exit, and assertion.", "客观替代为既有 publish 用例重放与独立逐步文档审查，判定未确认差异不发布；替代未执行，不能当 GREEN。");
    const result = validatePostPhaseContract(fixture);
    expect(result.ok, result.errors.join("; ")).toBe(true);
  });

  it("executes the author template example through the real validator", () => {
    const template = readFileSync(new URL("../../skills/spec-plan/templates/phase-template.md", import.meta.url), "utf8");
    const example = template.split("### G-2 纯文档示例（既有字段，无新增运行行为）")[1]?.split("#### 示例：")[0];
    expect(example).toBeTruthy();
    const fixture = pureDocFixture();
    const labels = {
      "输入": "Inputs", "文件 / 符号": "Files / symbols", "动作": "Action", "场景 / 夹具或服务": "Scenario / fixture or service",
      "RED/GREEN 门禁命令": "RED/GREEN gate_cmd", "预期退出码": "expected_exit", "RED 目标失败": "RED target failure",
      "RED 证据": "RED 证据", "GREEN 判定器": "GREEN oracle", "证据": "Evidence", "覆盖上限": "Coverage limit", "完成": "Done",
    };
    let body = fixture.phases["phases/P1.md"];
    for (const [cn, en] of Object.entries(labels)) {
      const line = example.split("\n").find((entry) => entry.startsWith(`- **${cn}**:`));
      expect(line, cn).toBeTruthy();
      const old = body.split("\n").filter((entry) => entry.startsWith(`- **${en}**：`)).at(-1);
      expect(old, en).toBeTruthy();
      body = body.replace(old, `- **${en}**：${line.split(`**${cn}**:`)[1].trim().replaceAll("ORACLE-PUBLISH-DOC", "ORACLE-P1")}`);
    }
    const result = validatePostPhaseContract({ ...fixture, phases: { ...fixture.phases, "phases/P1.md": body } });
    expect(result.ok, result.errors.join("; ")).toBe(true);
  });

  it("retains index and trace bindings for G-2", () => {
    const fixture = pureDocFixture();
    const driftedIndex = validatePostPhaseContract({ ...fixture, index: fixture.index.replace("`docs/calendar-refresh.md`", "`docs/other.md`") });
    expect(driftedIndex.ok).toBe(false);
    expect(driftedIndex.errors.join("; ")).toMatch(/write set/);
    const driftedTrace = validatePostPhaseContract({ ...fixture, spec: fixture.spec.replace("P1/T001 | ORACLE-P1", "P1/T001 | ORACLE-UNRELATED") });
    expect(driftedTrace.ok).toBe(false);
    expect(driftedTrace.errors.join("; ")).toMatch(/P1\/T001.*oracle/);
  });
});

describe("post-cohort G-2 implementation review regressions", () => {
  it.each([
    ["failure-risk suffix", "风险为失败风险扩大"],
    ["generic failure possibility", "风险是失败的可能"],
  ])("rejects %s without a risk object and consequence", (_name, risk) => {
    const fixture = withDocChange(pureDocFixture(), "风险为操作者误把凭据provider当免凭据", risk);
    const result = validatePostPhaseContract(fixture);
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(/G-2.*risk/i);
  });

  it("does not let a reason mentioning credential risk hide the actual risk placeholder", () => {
    let fixture = withDocChange(pureDocFixture(), "G-2纯文档流程无新增运行行为，风险为操作者误把凭据provider当免凭据", "G-2纯文档流程无新增运行行为，说明凭据风险为操作者误认provider；风险为风险");
    const result = validatePostPhaseContract(fixture);
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(/G-2.*risk/i);
  });

  it("accepts a labeled alternative after an incidental earlier mention in the reason", () => {
    const fixture = withDocChange(pureDocFixture(), "G-2纯文档流程无新增运行行为", "G-2纯文档流程无新增运行行为且描述客观替代背景");
    const result = validatePostPhaseContract(fixture);
    expect(result.ok, result.errors.join("; ")).toBe(true);
  });

  it("rejects expected pass as the sole objective criterion", () => {
    let fixture = withDocChange(pureDocFixture(), "客观替代为既有publish用例重放与独立逐步文档审查", "客观替代为独立文档审查");
    fixture = withDocChange(fixture, "ORACLE-P1；文档的既有publish步骤可在tmp_path复放，未确认差异不会发布的断言。", "ORACLE-P1；expected pass。");
    fixture = withDocChange(fixture, "ORACLE-P1；同命令退出0，未确认差异不发布；历史不重写。", "ORACLE-P1；expected pass。");
    const result = validatePostPhaseContract(fixture);
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(/G-2.*objective alternative/i);
  });
});


});
