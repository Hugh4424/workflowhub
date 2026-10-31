// Evidence path existence has three visible states: a real file, an explicit
// `planned:` gap, and an unmarked missing path that must fail. Archive material
// keeps its existing diagnostic behavior.
import { afterEach, expect, test } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validatePostPhaseContract } from "../../runtime/stage/stage-content-contracts.mjs";

const template = fileURLToPath(new URL("../../skills/spec-plan/templates/phase-template.md", import.meta.url));
const roots = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

function examples() {
  const text = readFileSync(template, "utf8");
  const block = (name) => text.split(`<!-- card05-author-example:${name} -->`)[1].match(/```markdown\n([\s\S]*?)\n```/)[1];
  return {
    spec: block("spec"),
    index: block("index"),
    phases: {
      "phases/P1-行为结果.md": block("phase-behavior"),
      "phases/P2-文档核对.md": block("phase-document"),
    },
  };
}

function withEvidence(materials, valueFor) {
  const phases = {};
  for (const [path, body] of Object.entries(materials.phases)) {
    phases[path] = body.replace(/(- \*\*evidence_path\*\*：)[^\n]*/, (_line, prefix) =>
      prefix + (typeof valueFor === "function" ? valueFor(path) : valueFor));
  }
  return { ...materials, phases };
}

function material(materials, { archive = false } = {}) {
  const container = realpathSync(mkdtempSync(join(tmpdir(), "evidence-path-existence-")));
  roots.push(container);
  const root = archive ? join(container, "specs", "archive", "owned-task") : join(container, "material");
  mkdirSync(join(root, "phases"), { recursive: true });
  writeFileSync(join(root, "spec.md"), materials.spec);
  writeFileSync(join(root, "phases/index.md"), materials.index);
  for (const [path, body] of Object.entries(materials.phases)) writeFileSync(join(root, path), body);
  return root;
}

function putFile(root, path) {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), "actual evidence\n");
}

function validate(materials, root) {
  return validatePostPhaseContract({ spec: materials.spec, index: materials.index, phases: materials.phases, material_path: root });
}

const phaseEvidence = (path) => path.includes("P1-行为结果")
  ? "`quality/tests/owned-behavior.output`"
  : "`quality/evidence/owned-document-readback.md`";

test("a real evidence file under the material root passes and is counted", () => {
  const materials = withEvidence(examples(), phaseEvidence);
  const root = material(materials);
  putFile(root, "quality/tests/owned-behavior.output");
  putFile(root, "quality/evidence/owned-document-readback.md");

  const result = validate(materials, root);
  expect(result.errors).toEqual([]);
  expect(result.ok).toBe(true);
  expect(result.facts.evidence_paths).toMatchObject({
    verified_count: 2, planned_count: 0, missing_count: 0, all_verified: true,
  });
  expect(result.facts.evidence_paths.verified.map(({ phase_id }) => phase_id)).toEqual(["P1", "P2"]);
});

test("planned evidence is counted as a known gap even when the file exists", () => {
  const materials = withEvidence(examples(), (path) =>
    path.includes("P1-行为结果")
      ? "`planned: quality/tests/p1.json`（未生成，Phase 完成前补齐）"
      : "`planned: quality/evidence/p2.md`（未生成，Phase 完成前补齐）");
  const root = material(materials);
  // A pre-existing file must not silently promote a planned declaration.
  putFile(root, "quality/tests/p1.json");
  putFile(root, "quality/evidence/p2.md");

  const result = validate(materials, root);
  expect(result.errors).toEqual([]);
  expect(result.ok).toBe(true);
  expect(result.facts.evidence_paths).toMatchObject({
    verified_count: 0, planned_count: 2, missing_count: 0, all_verified: false,
  });
  expect(result.facts.evidence_paths.planned.map(({ path }) => path))
    .toEqual(["quality/tests/p1.json", "quality/evidence/p2.md"]);
  expect(result.facts.evidence_path_summary).toContain("2 planned");
});

test("a path without planned that does not exist fails and names the roots searched", () => {
  const materials = withEvidence(examples(), (path) =>
    path.includes("P1-行为结果")
      ? "`quality/tests/missing-p1.output`"
      : "`quality/evidence/missing-p2.md`");
  const root = material(materials);

  const result = validate(materials, root);
  expect(result.ok).toBe(false);
  expect(result.facts.evidence_paths).toMatchObject({
    verified_count: 0, planned_count: 0, missing_count: 2,
  });
  const first = result.errors.find((error) => error.includes("missing-p1.output"));
  expect(first).toContain("phases/P1-行为结果.md evidence_path does not exist: quality/tests/missing-p1.output");
  expect(first).toContain(`searched roots: ${root}`);
});

test("an unmarked missing path still fails when another phase is planned", () => {
  const materials = withEvidence(examples(), (path) =>
    path.includes("P1-行为结果")
      ? "`planned: quality/tests/p1.json`（未生成，Phase 完成前补齐）"
      : "`quality/tests/p2-missing.output`");
  const root = material(materials);

  const result = validate(materials, root);
  expect(result.ok).toBe(false);
  expect(result.facts.evidence_paths).toMatchObject({
    verified_count: 0, planned_count: 1, missing_count: 1, all_verified: false,
  });
  expect(result.facts.evidence_paths.planned.map(({ phase_id }) => phase_id)).toEqual(["P1"]);
  expect(result.facts.evidence_paths.missing.map(({ phase_id }) => phase_id)).toEqual(["P2"]);
  expect(result.errors.filter((error) => error.includes("evidence_path does not exist"))).toHaveLength(1);
  expect(result.errors.join("\n")).toContain("p2-missing.output");
});

test("archive material keeps missing historical paths diagnostic and visible", () => {
  const materials = withEvidence(examples(), (path) =>
    path.includes("P1-行为结果")
      ? "`quality/tests/legacy-p1.output`"
      : "`quality/evidence/legacy-p2.md`");
  const root = material(materials, { archive: true });

  const result = validate(materials, root);
  expect(result.errors).toEqual([]);
  expect(result.ok).toBe(true);
  expect(result.facts.evidence_paths).toMatchObject({
    verified_count: 0, planned_count: 0, missing_count: 0, unverified_count: 2,
    all_verified: false, archive_diagnostic: true,
  });
});

test("relative evidence resolves through the authenticated worktree and task roots", () => {
  const materials = withEvidence(examples(), (path) =>
    path.includes("P1-行为结果")
      ? "`quality/evidence/task-only.md`"
      : "`quality/evidence/repo-only.md`");
  const container = realpathSync(mkdtempSync(join(tmpdir(), "evidence-path-existence-")));
  roots.push(container);
  const taskRoot = join(container, "task");
  const worktreeRoot = join(container, "worktree");
  putFile(taskRoot, "quality/evidence/task-only.md");
  putFile(worktreeRoot, "quality/evidence/repo-only.md");

  const result = validatePostPhaseContract({
    spec: materials.spec, index: materials.index, phases: materials.phases,
    reviewReadScope: {
      taskRoot,
      repositories: [{ id: "wh", sourceRoot: worktreeRoot }],
    },
  });
  expect(result.errors).toEqual([]);
  expect(result.facts.evidence_paths).toMatchObject({ verified_count: 2, all_verified: true });
  expect(result.facts.evidence_paths.verified.map(({ resolved }) => resolved).sort()).toEqual([
    join(taskRoot, "quality/evidence/task-only.md"),
    join(worktreeRoot, "quality/evidence/repo-only.md"),
  ].sort());
});


// The extra root comes from the actual task record; it is not a replacement for
// reviewReadScope.taskRoot and cannot reorder existing repository/material roots.
test('task-record fallback: quality path only in task record passes and records its source',()=>{
  const materials=withEvidence(examples(),phaseEvidence),root=material(materials),taskRoot=join(dirname(root),'task');
  putFile(taskRoot,'quality/tests/owned-behavior.output');putFile(taskRoot,'quality/evidence/owned-document-readback.md');
  const input={...materials,material_path:root,task_record_root:taskRoot},result=validatePostPhaseContract(input);
  expect(result.errors).toEqual([]);expect(result.facts.evidence_paths.verified).toHaveLength(2);
  expect(result.facts.evidence_paths.verified.every(v=>v.resolution_source==='task_root')).toBe(true);
  expect(result.facts.evidence_paths.verified[0].resolved).toBe(join(taskRoot,'quality/tests/owned-behavior.output'));
  putFile(root,'quality/tests/owned-behavior.output');
  const primary=validatePostPhaseContract(input).facts.evidence_paths.verified.find(v=>v.phase_id==='P1');
  expect(primary.resolved).toBe(join(root,'quality/tests/owned-behavior.output'));expect(primary.resolution_source).toBeUndefined();
});
test('task-record fallback: missing in both roots remains the original named missing error',()=>{
  const materials=withEvidence(examples(),phaseEvidence),root=material(materials),taskRoot=join(dirname(root),'task');mkdirSync(taskRoot);
  const result=validatePostPhaseContract({...materials,material_path:root,task_record_root:taskRoot});
  expect(result.ok).toBe(false);expect(result.facts.evidence_paths.missing_count).toBe(2);
  expect(result.errors.join('\n')).toContain('evidence_path does not exist: quality/tests/owned-behavior.output');
  expect(result.errors.join('\n')).toContain(taskRoot);
});
test('task-record fallback: non-quality and ../../Knowledge paths keep byte-identical old results',()=>{
  const container=realpathSync(mkdtempSync(join(tmpdir(),'evidence-path-old-roots-')));roots.push(container);
  const worktree=join(container,'Project','repo'),root=join(worktree,'specs','owned-task'),taskRoot=join(container,'Knowledge','Projects','demo','tasks','owned-task');
  mkdirSync(root,{recursive:true});putFile(worktree,'docs/repo-only.md');putFile(taskRoot,'docs/repo-only.md');putFile(taskRoot,'docs/task-only.md');putFile(taskRoot,'quality/legacy.md');
  const legacy='../../Knowledge/Projects/demo/tasks/owned-task/quality/legacy.md',quote=String.fromCharCode(96);
  for(const first of ['docs/repo-only.md','docs/task-only.md']){
    const materials=withEvidence(examples(),p=>quote+(p.includes('P1-')?first:legacy)+quote),input={...materials,material_path:root};
    const before=validatePostPhaseContract(input),after=validatePostPhaseContract({...input,task_record_root:taskRoot});
    expect(JSON.stringify(after)).toBe(JSON.stringify(before));
    expect(after.facts.evidence_paths.verified.find(v=>v.phase_id==='P2').resolved).toBe(join(taskRoot,'quality/legacy.md'));
    expect(after.facts.evidence_paths.missing_count).toBe(first==='docs/task-only.md'?1:0);
  }
});
test('task-record fallback: actual CLI discovers only its canonical manifest and registered worktree',()=>{
  const container=realpathSync(mkdtempSync(join(tmpdir(),'evidence-path-task-cli-')));roots.push(container);
  const repo=join(container,'repo'),worktree=join(container,'repo-owned-task'),storage=join(container,'storage'),taskRoot=join(storage,'Projects','demo','tasks','owned-task');
  const env={...process.env,WORKFLOWHUB_TASK_DIR:storage,XDG_CONFIG_HOME:join(container,'config')};delete env.RUN_CHECKS_FORCE_FAIL_CHECKER;for(const key of Object.keys(env))if(key.startsWith('GIT_'))delete env[key];
  const git=(cwd,args)=>{const r=spawnSync('git',args,{cwd,env,encoding:'utf8'});expect(r.status,r.stderr).toBe(0);return r.stdout.trim();};
  git(container,['init',repo]);git(repo,['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','--allow-empty','-m','fixture']);
  const baseline=git(repo,['rev-parse','HEAD']);git(repo,['worktree','add','-b','task/demo/owned-task',worktree,'HEAD']);
  const root=join(worktree,'specs','owned-task'),materials=withEvidence(examples(),phaseEvidence);mkdirSync(join(root,'phases'),{recursive:true});
  writeFileSync(join(root,'spec.md'),materials.spec);writeFileSync(join(root,'phases/index.md'),materials.index);for(const [path,body]of Object.entries(materials.phases))writeFileSync(join(root,path),body);
  putFile(taskRoot,'quality/tests/owned-behavior.output');putFile(taskRoot,'quality/evidence/owned-document-readback.md');
  writeFileSync(join(taskRoot,'task.json'),JSON.stringify({schema_version:'1.0.0',project_name:'demo',task_id:'owned-task',target_repo_root:repo,activation_cohort:'post',baseline_commit:baseline}));
  const cli=fileURLToPath(new URL('../../tools/cli/run-checks.mjs',import.meta.url)),r=spawnSync(process.execPath,[cli,'--material-root',root],{cwd:worktree,env,encoding:'utf8',timeout:30000});
  expect(r.status,r.stdout+r.stderr).toBe(0);expect(r.stdout).toContain('resolution_source=task_root');expect(r.stdout).toContain(taskRoot);
});

for(const kind of ['file','directory'])test('task-root containment: '+kind+' symlink outside the task root is rejected',()=>{
  const materials=withEvidence(examples(),phaseEvidence),root=material(materials),taskRoot=join(dirname(root),'task'),outside=join(dirname(root),'outside');
  putFile(outside,'owned-behavior.output');putFile(taskRoot,'quality/evidence/owned-document-readback.md');
  if(kind==='file'){mkdirSync(join(taskRoot,'quality/tests'),{recursive:true});symlinkSync(join(outside,'owned-behavior.output'),join(taskRoot,'quality/tests/owned-behavior.output'));}
  else symlinkSync(outside,join(taskRoot,'quality/tests'),'dir');
  const candidate=join(taskRoot,'quality/tests/owned-behavior.output');expect(realpathSync(candidate)).toBe(join(outside,'owned-behavior.output'));
  const result=validatePostPhaseContract({...materials,material_path:root,task_record_root:taskRoot});expect(result.ok).toBe(false);expect(result.errors.join('\n')).toContain('evidence_path does not exist: quality/tests/owned-behavior.output');
});
test('task-root containment: a symlink resolving inside the task root remains valid',()=>{
  const materials=withEvidence(examples(),phaseEvidence),root=material(materials),taskRoot=join(dirname(root),'task');putFile(taskRoot,'safe/inside.output');putFile(taskRoot,'quality/evidence/owned-document-readback.md');mkdirSync(join(taskRoot,'quality/tests'),{recursive:true});symlinkSync(join(taskRoot,'safe/inside.output'),join(taskRoot,'quality/tests/owned-behavior.output'));
  const result=validatePostPhaseContract({...materials,material_path:root,task_record_root:taskRoot});expect(result.errors).toEqual([]);expect(result.facts.evidence_paths.verified.find(v=>v.phase_id==='P1')).toMatchObject({resolved:join(taskRoot,'quality/tests/owned-behavior.output'),resolution_source:'task_root'});
});
test('task-root containment: existing roots retain their original priority and link behavior',()=>{
  const materials=withEvidence(examples(),phaseEvidence),root=material(materials),outside=join(dirname(root),'outside'),taskRoot=join(dirname(root),'task');putFile(outside,'owned-behavior.output');putFile(root,'quality/evidence/owned-document-readback.md');mkdirSync(join(root,'quality/tests'),{recursive:true});symlinkSync(join(outside,'owned-behavior.output'),join(root,'quality/tests/owned-behavior.output'));putFile(taskRoot,'quality/tests/owned-behavior.output');
  const input={...materials,material_path:root},before=validatePostPhaseContract(input),after=validatePostPhaseContract({...input,task_record_root:taskRoot});expect(after.errors).toEqual([]);expect(JSON.stringify(after)).toBe(JSON.stringify(before));expect(after.facts.evidence_paths.verified[0].resolution_source).toBeUndefined();
});
