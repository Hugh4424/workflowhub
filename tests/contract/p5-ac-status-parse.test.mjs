// ORACLE-P6-CARD-STATUS-PARSE
// The card status is parsed once (`acCardStatuses`) and the evidence-existence
// verdicts are merged in exactly one place (`applyRefVerdicts`). This test fixes
// the readings on the read-only task-4 material and the traps a "scan every
// status word on the line" reader would fall into.
import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as contracts from "../../runtime/stage/stage-content-contracts.mjs";
import { phaseFilesFromIndex } from "../../runtime/task/material-workspace.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const materialRoot = join(repoRoot, "specs/archive/delivery-quality-code-20261124");

function loadMaterial() {
  const spec = readFileSync(join(materialRoot, "spec.md"), "utf8");
  const index = readFileSync(join(materialRoot, "phases/index.md"), "utf8");
  const phases = {};
  for (const ref of phaseFilesFromIndex(index)) phases[ref] = readFileSync(join(materialRoot, ref), "utf8");
  return { spec, phases };
}

const HEX64 = /^[a-f0-9]{64}$/;
const contractsSha = (value) => createHash("sha256").update(value).digest("hex");
const PROSE_NEGATIVES = ["AC-P4-007", "AC-P11-002", "AC-P12-001", "AC-P13-003"];

describe("acCardStatuses / applyRefVerdicts exports", () => {
  it("exports both single-source functions", () => {
    expect(typeof contracts.acCardStatuses).toBe("function");
    expect(typeof contracts.applyRefVerdicts).toBe("function");
  });
});

describe("task-4 card status readings", () => {
  const { spec, phases } = loadMaterial();
  const status = contracts.acCardStatuses({ spec, phases });

  it("reads 78 declared criteria from 13 cards", () => {
    expect(status.total_declared).toBe(78);
    expect(status.resolved).toBe(78);
    expect(status.cards.read).toBe(13);
    expect(status.cards.missing).toEqual([]);
    expect(status.cards.unreadable).toEqual([]);
  });

  it("counts 61/11/2/1/1/2 and the parts add back to the declared total", () => {
    expect(status.counts).toMatchObject({ pass: 61, incomplete: 11, partial: 2, inconclusive: 1, unavailable: 1, inconsistent: 2 });
    // Every legal verdict word has a key; the parts still add back to the total.
    expect(status.counts).toMatchObject({ fail: 0, deferred: 0, missing: 0 });
    const sum = Object.values(status.counts).reduce((left, right) => left + right, 0);
    expect(sum).toBe(status.total_declared);
    expect(status.uncounted).toEqual([]);
  });

  it("names both cross-shape conflicts with their path:line and both original values", () => {
    const conflicts = status.conflicts.map((item) => item.id).sort();
    expect(conflicts).toEqual(["AC-P3-009", "AC-P4-005"]);
    const p3 = status.conflicts.find((item) => item.id === "AC-P3-009");
    expect(p3.sources.map((source) => source.raw_status)).toEqual(["inconsistent", "pass"]);
    expect(p3.sources.map((source) => `${source.path}:${source.line}`).join(" "))
      .toMatch(/P3-.{0,40}\.md:1177 phases\/P3-.{0,40}\.md:1200/);
    const p4 = status.conflicts.find((item) => item.id === "AC-P4-005");
    expect(p4.sources.map((source) => source.raw_status)).toEqual(["incomplete", "pass"]);
    expect(p4.sources.map((source) => `${source.path}:${source.line}`).join(" "))
      .toMatch(/P4-.{0,40}\.md:972 phases\/P4-.{0,40}\.md:985/);
  });

  it("keeps the one-cell-two-status variant and takes the worst value", () => {
    const entry = status.entries.find((item) => item.id === "AC-P9-005");
    expect(entry.variants).toEqual(["pass", "incomplete"]);
    expect(entry.status).toBe("incomplete");
    expect(status.variants.map((item) => item.id)).toEqual(["AC-P9-005"]);
  });

  it("downgrades the subitem entry instead of counting it as a pass", () => {
    const entry = status.entries.find((item) => item.id === "AC-P5-006");
    expect(entry.subitems).toEqual(["incomplete"]);
    expect(entry.status).toBe("incomplete");
    expect(status.counts.pass).not.toBe(status.total_declared);
  });

  it("keeps the four prose negative controls out of conflicts and variants", () => {
    for (const id of PROSE_NEGATIVES) {
      const entry = status.entries.find((item) => item.id === id);
      expect(entry, id).toBeTruthy();
      expect(entry.status, id).toBe("pass");
      expect(status.conflicts.some((item) => item.id === id), id).toBe(false);
      expect(status.variants.some((item) => item.id === id), id).toBe(false);
    }
  });

  it("reports clean_pass 55 and the six pass-without-reference ids", () => {
    expect(status.clean_pass).toBe(55);
    expect([...status.pass_without_ref].sort()).toEqual([
      "AC-P12-002", "AC-P7-009", "AC-P7-010", "AC-P8-002", "AC-P8-006", "AC-P8-008",
    ]);
  });

  it("fingerprints the card bytes only: 64 hex, stable across calls", () => {
    expect(status.fingerprint).toMatch(HEX64);
    const again = contracts.acCardStatuses({ spec, phases });
    expect(again.fingerprint).toBe(status.fingerprint);
  });
});

describe("applyRefVerdicts is the only place clean/clean_pass is computed", () => {
  const { spec, phases } = loadMaterial();
  const status = contracts.acCardStatuses({ spec, phases });

  it("merges the existence verdicts without moving the card fingerprint", () => {
    const verdicts = {};
    for (const entry of status.entries) {
      for (const [index, ref] of entry.refs.entries()) {
        verdicts[`${entry.id}#${index}`] = ref.kind === "task-relative"
          ? { status: "verified" } : { status: "unjudged", reason: "not-task-relative" };
      }
    }
    const merged = contracts.applyRefVerdicts(status, verdicts);
    expect(merged.fingerprint).toBe(status.fingerprint);
    expect(merged.clean_pass).toBe(55);
    expect(merged.pass_without_ref).toEqual(status.pass_without_ref);
    // Every task-relative reference now carries the merged verdict; a pass
    // entry with such a reference stays clean and shows the verdict word.
    const withRef = merged.entries.filter((item) => item.status === "pass" && item.refs.some((ref) => ref.kind === "task-relative"));
    expect(withRef.length).toBeGreaterThan(0);
    for (const entry of withRef) {
      expect(entry.clean, entry.id).toBe(true);
      expect(entry.refs.every((ref) => ref.kind !== "task-relative" || ref.status === "verified"), entry.id).toBe(true);
    }
  });

  it("turns one missing referenced original into a named non-clean pass", () => {
    const target = status.entries.find((item) => item.id === "AC-P9-003");
    expect(target.status).toBe("pass");
    const verdicts = {};
    for (const entry of status.entries) {
      for (const [index, ref] of entry.refs.entries()) {
        verdicts[`${entry.id}#${index}`] = ref.kind === "task-relative" ? { status: "verified" } : { status: "unjudged" };
      }
    }
    for (const [index, ref] of target.refs.entries()) {
      if (ref.kind === "task-relative") verdicts[`${target.id}#${index}`] = { status: "missing", reason: "not found" };
    }
    const merged = contracts.applyRefVerdicts(status, verdicts);
    expect(merged.clean_pass).toBe(54);
    expect(merged.pass_without_ref).toContain("AC-P9-003");
    expect(merged.fingerprint).toBe(status.fingerprint);
  });

  it("keeps an unverified reference out of `clean=false`", () => {
    const entry = status.entries.find((item) => item.refs.some((ref) => ref.kind === "task-relative"));
    const verdicts = {};
    for (const item of status.entries) {
      for (const [index, ref] of item.refs.entries()) {
        verdicts[`${item.id}#${index}`] = ref.kind === "task-relative"
          ? { status: "unverified", reason: "no-run-binding" } : { status: "unjudged" };
      }
    }
    const merged = contracts.applyRefVerdicts(status, verdicts);
    expect(merged.entries.find((item) => item.id === entry.id).clean).toBe(true);
  });
});

describe("F2: a legal non-pass verdict is counted, never dropped", () => {
  const miniSpec = [
    "- [ ] **AC-100 失败**", "- [ ] **AC-101 缺件**", "- [ ] **AC-102 缓期**", "",
  ].join("\n");
  const miniPhases = {
    "phases/P1-示例.md": ["- AC-100：fail — 反例一。", "- AC-101：missing — 反例二。", "- AC-102：deferred — 反例三。"].join("\n"),
  };

  it("gives fail/missing/deferred their own keys and keeps parts == resolved", () => {
    const status = contracts.acCardStatuses({ spec: miniSpec, phases: miniPhases });
    expect(status.counts).toMatchObject({ pass: 0, incomplete: 0, fail: 1, missing: 1, deferred: 1 });
    expect(status.resolved).toBe(3);
    expect(Object.values(status.counts).reduce((left, right) => left + right, 0)).toBe(status.resolved);
    expect(status.uncounted).toEqual([]);
    expect(status.entries.map((entry) => entry.status).sort()).toEqual(["deferred", "fail", "missing"]);
  });
});

// F4: a facts anchor may only verify evidence bound to THIS task and THIS run.
// A row from another task (or a bare {ref, sha256} with no run identity) whose
// bytes happen to match must stay unverified, never attest the current run.
describe("F4: facts anchors are bound to this task and this run", () => {
  const tpl = fileURLToPath(new URL("../../skills/spec-plan/templates/phase-template.md", import.meta.url));
  const blockOf = (name) => readFileSync(tpl, "utf8").split(`<!-- card05-author-example:${name} -->`)[1].match(/```markdown\n([\s\S]*?)\n```/)[1];

  function materialWithAnchor({ factsRow }) {
    const bytes = "actual evidence\n";
    const sha = contractsSha(bytes);
    const spec = blockOf("spec"), index = blockOf("index");
    const phases = {
      "phases/P1-行为结果.md": blockOf("phase-behavior").replace(/(- \*\*evidence_path\*\*：)[^\n]*/, (_m, p) => `${p}\`quality/tests/owned.output\``),
      "phases/P2-文档核对.md": blockOf("phase-document"),
    };
    const container = realpathSync(mkdtempSync(join(tmpdir(), "p6-anchor-")));
    const root = join(container, "material"), taskRoot = join(container, "task");
    mkdirSync(join(root, "phases"), { recursive: true });
    mkdirSync(join(taskRoot, "quality", "tests"), { recursive: true });
    writeFileSync(join(root, "spec.md"), spec);
    writeFileSync(join(root, "phases/index.md"), index);
    for (const [path, body] of Object.entries(phases)) writeFileSync(join(root, path), body);
    writeFileSync(join(taskRoot, "quality/tests/owned.output"), bytes);
    writeFileSync(join(taskRoot, "task.json"), JSON.stringify({ task_id: "owned-task", target_repo_root: taskRoot }));
    writeFileSync(join(taskRoot, "facts.jsonl"), `${JSON.stringify(factsRow(sha))}\n`);
    return { container, root, taskRoot };
  }

  it("rejects an anchor left by another task even when the bytes match", () => {
    const fixture = materialWithAnchor({ factsRow: (sha) => ({
      record_kind: "stage", task_id: "another-task", stage: "build-code",
      evidence: { value: [{ kind: "quality_evidence", ref: "quality/tests/owned.output", sha256: sha }] },
    }) });
    try {
      const result = contracts.validatePostPhaseContract({
        spec: readFileSync(join(fixture.root, "spec.md"), "utf8"),
        index: readFileSync(join(fixture.root, "phases/index.md"), "utf8"),
        phases: {
          "phases/P1-行为结果.md": readFileSync(join(fixture.root, "phases/P1-行为结果.md"), "utf8"),
          "phases/P2-文档核对.md": readFileSync(join(fixture.root, "phases/P2-文档核对.md"), "utf8"),
        },
        material_path: fixture.root, task_record_root: fixture.taskRoot,
      });
      expect(result.facts.evidence_paths.verified_count).toBe(0);
      expect(result.facts.evidence_paths.unverified_count).toBe(1);
    } finally { rmSync(fixture.container, { recursive: true, force: true }); }
  });

  it("accepts the same bytes when the facts row is this task's bound run", () => {
    const fixture = materialWithAnchor({ factsRow: (sha) => ({
      record_kind: "stage", task_id: "owned-task", stage: "build-code",
      evidence: { value: [{ kind: "quality_evidence", ref: "quality/tests/owned.output", sha256: sha, step_slug: "implement-change", command: "node x.mjs", exit_code: 0 }] },
    }) });
    try {
      const result = contracts.validatePostPhaseContract({
        spec: readFileSync(join(fixture.root, "spec.md"), "utf8"),
        index: readFileSync(join(fixture.root, "phases/index.md"), "utf8"),
        phases: {
          "phases/P1-行为结果.md": readFileSync(join(fixture.root, "phases/P1-行为结果.md"), "utf8"),
          "phases/P2-文档核对.md": readFileSync(join(fixture.root, "phases/P2-文档核对.md"), "utf8"),
        },
        material_path: fixture.root, task_record_root: fixture.taskRoot,
      });
      expect(result.facts.evidence_paths.verified_count).toBe(1);
      expect(result.facts.evidence_paths.unverified_count).toBe(0);
    } finally { rmSync(fixture.container, { recursive: true, force: true }); }
  });

  it("rejects a bare {ref, sha256} anchor that names no run identity", () => {
    const fixture = materialWithAnchor({ factsRow: (sha) => ({
      record_kind: "stage", task_id: "owned-task", stage: "build-code",
      evidence: { value: [{ kind: "quality_evidence", ref: "quality/tests/owned.output", sha256: sha }] },
    }) });
    try {
      const result = contracts.validatePostPhaseContract({
        spec: readFileSync(join(fixture.root, "spec.md"), "utf8"),
        index: readFileSync(join(fixture.root, "phases/index.md"), "utf8"),
        phases: {
          "phases/P1-行为结果.md": readFileSync(join(fixture.root, "phases/P1-行为结果.md"), "utf8"),
          "phases/P2-文档核对.md": readFileSync(join(fixture.root, "phases/P2-文档核对.md"), "utf8"),
        },
        material_path: fixture.root, task_record_root: fixture.taskRoot,
      });
      expect(result.facts.evidence_paths.verified_count).toBe(0);
      expect(result.facts.evidence_paths.unverified_count).toBe(1);
    } finally { rmSync(fixture.container, { recursive: true, force: true }); }
  });
});
