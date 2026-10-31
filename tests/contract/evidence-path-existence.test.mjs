// Evidence path existence has three visible states: a real file, an explicit
// `planned:` gap, and an unmarked missing path that must fail. Archive material
// keeps its existing diagnostic behavior.
import { afterEach, expect, test } from "vitest";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
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

