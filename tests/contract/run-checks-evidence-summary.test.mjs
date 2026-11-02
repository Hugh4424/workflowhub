// The material gate must keep explicit planned evidence visible without turning
// it into a failure, and must not add a line when every declared path is real.
// Missing paths stay errors and remain visible in both the error list and the
// summary line.
import { afterEach, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const TEMPLATE = join(ROOT, "skills/spec-plan/templates/phase-template.md");
const roots = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

function examples() {
  const text = readFileSync(TEMPLATE, "utf8");
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

const PLANNED = ["`planned: quality/tests/p1.json`（未生成）", "`planned: quality/evidence/p2.json`（未生成）"];
const REAL = ["`quality/tests/p1.output`", "`quality/evidence/p2.md`"];
const MISSING = ["`quality/tests/missing-p1.output`", "`quality/evidence/missing-p2.md`"];

function material({ archive = false, evidence, existing = [] } = {}) {
  const container = mkdtempSync(join(tmpdir(), "run-checks-evidence-"));
  roots.push(container);
  const root = archive ? join(container, "specs", "archive", "owned-task") : join(container, "material");
  mkdirSync(join(root, "phases"), { recursive: true });
  const base = examples();
  writeFileSync(join(root, "spec.md"), base.spec);
  writeFileSync(join(root, "phases/index.md"), base.index);
  for (const [path, body] of Object.entries(base.phases)) {
    const value = evidence[path.includes("P1-") ? 0 : 1];
    writeFileSync(join(root, path), body.replace(/(- \*\*evidence_path\*\*：)[^\n]*/, (_line, prefix) => prefix + value));
  }
  for (const path of existing) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), "evidence\n");
  }
  return root;
}

function run(root) {
  const env = { ...process.env };
  delete env.RUN_CHECKS_FORCE_FAIL_CHECKER;
  const result = spawnSync(process.execPath, [join(ROOT, "tools/cli/run-checks.mjs"), "--material-root", root], {
    cwd: ROOT, encoding: "utf8", env, timeout: 30_000,
  });
  return { status: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

describe("run-checks material evidence path summary", () => {
  it("prints planned evidence on its own line without failing the gate", () => {
    const result = run(material({ evidence: PLANNED }));
    expect(result.status, result.stdout + result.stderr).toBe(0);
    expect(result.stdout).toContain("[run-checks][material] PASS");
    expect(result.stdout).toContain("证据路径：0 份已生成，2 份 planned（未生成），0 份缺失");
  });

  it("counts generated and planned evidence together and keeps exit 0", () => {
    const result = run(material({ evidence: [REAL[0], PLANNED[1]], existing: [REAL[0].replaceAll("`", "")] }));
    expect(result.status, result.stdout + result.stderr).toBe(0);
    expect(result.stdout).toContain("证据路径：1 份已生成，1 份 planned（未生成），0 份缺失");
  });

  it("keeps missing evidence visible in the summary and in the exit code", () => {
    const result = run(material({ evidence: MISSING }));
    expect(result.status, result.stdout + result.stderr).toBe(1);
    expect(result.stdout).toContain("evidence_path does not exist: quality/tests/missing-p1.output");
    expect(result.stdout).toContain("证据路径：0 份已生成，0 份 planned（未生成），2 份缺失");
    expect(result.stdout).toContain("[run-checks][material] errors=2");
  });

  it("stays quiet when every declared path is generated", () => {
    const result = run(material({ evidence: REAL, existing: REAL.map((value) => value.replaceAll("`", "")) }));
    expect(result.status, result.stdout + result.stderr).toBe(0);
    expect(result.stdout).toContain("[run-checks][material] PASS");
    expect(result.stdout).not.toContain("[run-checks][material] 证据路径：");
  });

  it("stays quiet for archive material whose historical paths are unverified", () => {
    const result = run(material({ archive: true, evidence: MISSING }));
    expect(result.status, result.stdout + result.stderr).toBe(0);
    expect(result.stdout).toContain("[run-checks][material] PASS");
    expect(result.stdout).not.toContain("[run-checks][material] 证据路径：");
    expect(result.stdout).not.toContain("evidence_path does not exist");
  });

  it("keeps structural input errors as errors instead of a misleading read failure", () => {
    const root = mkdtempSync(join(tmpdir(), "run-checks-structural-"));
    roots.push(root);
    writeFileSync(join(root, "empty.md"), "");
    symlinkSync(join(root, "empty.md"), join(root, "decision-log.md"));
    const result = run(root);
    expect(result.status, result.stdout + result.stderr).toBe(1);
    expect(result.stdout).toContain("[run-checks][material] errors=3");
    expect(result.stderr).not.toContain("cannot read material root");
  });
});
