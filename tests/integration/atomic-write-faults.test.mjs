import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { sha256 } from "../../core/freshness.mjs";
import { MATERIAL_FILES, createMaterialRevision, publishMaterialRevisionRecord } from "../../core/material-revision.mjs";
import { WRITER_FAULT_CONTRACT, publishImmutable, publishPublication } from "../../core/publication.mjs";
import { createQualityFact, publishQualityFact } from "../../core/quality-fact.mjs";
import { createTask, createTaskKernel } from "../../core/task-handle.mjs";

const temporaryDirs = [];
const taskHandleModule = resolve(fileURLToPath(new URL("../../core/task-handle.mjs", import.meta.url)));
const artifactDirModule = resolve(fileURLToPath(new URL("../../core/artifact-dir.mjs", import.meta.url)));
const publicationModule = resolve(fileURLToPath(new URL("../../core/publication.mjs", import.meta.url)));
const materialModule = resolve(fileURLToPath(new URL("../../core/material-revision.mjs", import.meta.url)));
const qualityModule = resolve(fileURLToPath(new URL("../../core/quality-fact.mjs", import.meta.url)));
afterEach(() => {
  while (temporaryDirs.length > 0) rmSync(temporaryDirs.pop(), { recursive: true, force: true });
});

function realTask(id = "phase2") {
  const storageRoot = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-phase2-writer-")));
  temporaryDirs.push(storageRoot);
  const task = createTask({
    storageRoot,
    manifest: {
      schema_version: "1.0.0", task_id: id, project_name: "WorkflowHub",
      created_at: "2026-07-31T00:00:00Z", target_repo_root: "/absolute/workflowhub",
      issue_ids: [], inputs: {},
    },
  });
  return { task, storageRoot };
}

function runChild({ taskPath, raw, family = "publication" }) {
  const source = `
    import { openTask } from ${JSON.stringify(`file://${taskHandleModule}`)};
    import { publishPublication } from ${JSON.stringify(`file://${publicationModule}`)};
    import { createMaterialRevision, publishMaterialRevisionRecord } from ${JSON.stringify(`file://${materialModule}`)};
    import { createQualityFact, publishQualityFact } from ${JSON.stringify(`file://${qualityModule}`)};
    const task = openTask(${JSON.stringify(taskPath)}, {projectName:"WorkflowHub", taskId:"phase2"});
    const raw = ${JSON.stringify(raw)};
    const ref = ${JSON.stringify(`phase2-writer/${family}-race.json`)};
    if (${JSON.stringify(family)} === "material") {
      const created = createMaterialRevision({
        taskId:"phase2",
        materials:{"decision-log.md":raw,"spec.md":"s","plan.md":"p","tasks.md":"t"},
        requirements:{ledger:{ref:"requirements/ledger.json",hash:"1".repeat(64)},coverage:{ref:"requirements/coverage.json",hash:"2".repeat(64)}},
        changeSummary:"race",sourceRefs:[{ref:"task.json",hash:"3".repeat(64)}],
      });
      publishMaterialRevisionRecord({created:{...created,revision_ref:ref},read:task.readRecord,create:task.createRecordAtomic});
    } else if (${JSON.stringify(family)} === "quality") {
      const fact = createQualityFact({
        taskId:"phase2",stage:"build-code",materialRevision:"revision-"+"1".repeat(64),snapshotTree:"a".repeat(40),
        kind:"test",status:"passed",subject:raw,
        evidence:[{ref:"receipts/tests.json",sha256:"2".repeat(64),evidence_type:"test_receipt"}],
        recordedAt:"2026-07-31T00:00:00Z",
      });
      publishQualityFact({fact:{...fact,ref},read:task.readRecord,create:task.createRecordAtomic});
    } else {
      const value={schema_version:"publication.v1",task_id:"phase2",stage:"build-code",material_revision:"revision-"+"1".repeat(64),quality_fact_refs:[],completion:{status:"completed",predicates:{},fact_refs:[],missing:[]},snapshot_tree:raw.padEnd(40,"a").slice(0,40)};
      publishPublication({publication:{value,ref,raw:JSON.stringify(value)+"\\n"},read:task.readRecord,create:task.createRecordAtomic});
    }
  `;
  return new Promise((resolveExit) => {
    const child = spawn(process.execPath, ["--input-type=module", "-e", source], { stdio: "ignore" });
    child.on("exit", (code) => resolveExit(code));
  });
}

function productionMaterialFixture(hooks) {
  const { task, storageRoot } = realTask("phase2");
  const repo = join(storageRoot, "repo");
  mkdirSync(repo);
  execFileSync("git", ["init", "-q"], { cwd: repo });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
  const root = join(repo, "specs", "phase2");
  mkdirSync(root, { recursive: true });
  for (const file of MATERIAL_FILES) writeFileSync(join(root, file), `# ${file}\n`);
  execFileSync("git", ["add", "."], { cwd: repo });
  execFileSync("git", ["commit", "-qm", "fixture"], { cwd: repo });
  const ledgerRaw = "ledger", coverageRaw = "coverage";
  task.createRecordAtomic("requirements/ledger.json", ledgerRaw);
  task.createRecordAtomic("requirements/coverage.json", coverageRaw);
  task.createRecordAtomic("requirements/current.json", `${JSON.stringify({
    schema_version: "requirements-current.v1", task_id: "phase2", generation: 1,
    ledger_ref: "requirements/ledger.json", ledger_hash: sha256(ledgerRaw), content_hash: sha256(ledgerRaw),
    coverage_ref: "requirements/coverage.json", coverage_hash: sha256(coverageRaw), parent_ref: null,
  }, null, 2)}\n`);
  return {
    task, repo, root,
    publish: () => {
      const artifacts = ArtifactDir.open(repo, task);
      const first = createTaskKernel(task, { artifacts }).publishMaterialRevision({
        change_summary: "initial", source_refs: ["task.json"],
      });
      if (hooks?.current) {
        writeFileSync(join(root, "spec.md"), "# changed\n");
        return createTaskKernel(task, { artifacts, materialRevisionTestHooks: hooks }).publishMaterialRevision({
          change_summary: "changed", source_refs: ["task.json"], expected_current_ref: first.revision_ref,
        });
      }
      return first;
    },
  };
}

function initializeMaterialRace() {
  const fixture = productionMaterialFixture();
  const first = fixture.publish();
  return { ...fixture, first };
}

function runProductionMaterialChild({ taskPath, repo, expectedCurrentRef, changeSummary }) {
  const source = `
    import { openTask, createTaskKernel } from ${JSON.stringify(`file://${taskHandleModule}`)};
    import { ArtifactDir } from ${JSON.stringify(`file://${artifactDirModule}`)};
    const task = openTask(${JSON.stringify(taskPath)}, {projectName:"WorkflowHub", taskId:"phase2"});
    try {
      const result = createTaskKernel(task, {artifacts:ArtifactDir.open(${JSON.stringify(repo)}, task)}).publishMaterialRevision({
        change_summary:${JSON.stringify(changeSummary)}, source_refs:["task.json"],
        expected_current_ref:${JSON.stringify(expectedCurrentRef)},
      });
      process.stdout.write(JSON.stringify(result));
    } catch (error) {
      process.stderr.write(String(error?.code ?? "")+" "+String(error?.message ?? error));
      process.exit(error?.code === "MATERIAL_REVISION_CONFLICT" ? 2 : 1);
    }
  `;
  return new Promise((resolveExit) => {
    const child = spawn(process.execPath, ["--input-type=module", "-e", source], { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "", stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("exit", (code) => resolveExit({ code, stdout, stderr }));
  });
}

function legalRecords(family, rawSuffix = "") {
  if (family === "material") {
    return createMaterialRevision({
      taskId: "phase2",
      materials: Object.fromEntries(MATERIAL_FILES.map((name) => [name, `${name}${rawSuffix}`])),
      requirements: {
        ledger: { ref: "requirements/ledger.json", hash: "1".repeat(64) },
        coverage: { ref: "requirements/coverage.json", hash: "2".repeat(64) },
      },
      changeSummary: "atomic", sourceRefs: [{ ref: "task.json", hash: "3".repeat(64) }],
    });
  }
  if (family === "quality") return createQualityFact({
    taskId: "phase2", stage: "build-code", materialRevision: `revision-${"1".repeat(64)}`,
    snapshotTree: "a".repeat(40), kind: "test", status: "passed", subject: "risk_tests_fresh",
    evidence: [{ ref: "receipts/tests.json", sha256: "2".repeat(64), evidence_type: "test_receipt" }],
    recordedAt: `2026-07-31T00:00:0${rawSuffix || "0"}Z`,
  });
  const value = {
    schema_version: "publication.v1", task_id: "phase2", stage: "build-code",
    material_revision: `revision-${"1".repeat(64)}`, quality_fact_refs: [],
    completion: { status: "completed", predicates: {}, fact_refs: [], missing: [] },
    snapshot_tree: `a${rawSuffix}`.padEnd(40, "a"),
  };
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  return { value, raw, ref: `publications/build-code/${sha256(raw)}.json`, sha256: sha256(raw) };
}

describe("atomic formal writers", () => {
  const publishers = {
    material: ({ record, read, create }) => publishMaterialRevisionRecord({ created: record, read, create }),
    quality: ({ record, read, create }) => publishQualityFact({ fact: record, read, create }),
    publication: ({ record, read, create }) => publishPublication({ publication: record, read, create }),
  };
  for (const family of ["material", "quality", "publication"]) {
    for (const [fault, hook] of [
      ["temp", "afterTemporaryWrite"],
      ["fsync", "beforeFileFsync"],
      ["rename", "afterOpenBeforeRename"],
      ["cas", "afterRevalidateBeforeRename"],
      ["current", "beforeDirectoryFsync"],
    ]) {
      it(`${family} declares and exercises its real ${fault} fault contract`, () => {
        const contractKey = fault === "cas" ? "CAS" : fault;
        if (!WRITER_FAULT_CONTRACT[family][contractKey]) {
          expect(["quality", "publication"]).toContain(family);
          expect(["cas", "current"]).toContain(fault);
          return;
        }
        const { task } = realTask(`${family}-${fault}`);
        if (family === "material" && ["cas", "current"].includes(fault)) {
          const fixture = initializeMaterialRace();
          writeFileSync(join(fixture.root, "spec.md"), "# changed\n");
          const oldPointerRaw = fixture.task.readRecord("materials/current.json");
          let hooks;
          if (fault === "cas") {
            const oldPointer = JSON.parse(oldPointerRaw);
            const previous = JSON.parse(fixture.task.readRecord(oldPointer.revision_ref));
            const winner = createMaterialRevision({
              taskId: "phase2",
              materials: Object.fromEntries(MATERIAL_FILES.map((name) => [name, name === "plan.md" ? "# competing winner\n" : `# ${name}\n`])),
              requirements: {
                ledger: { ref: "requirements/ledger.json", hash: sha256("ledger") },
                coverage: { ref: "requirements/coverage.json", hash: sha256("coverage") },
              },
              previous: { ...previous, revision_ref: oldPointer.revision_ref, revision_hash: oldPointer.revision_hash },
              changeSummary: "competing winner", sourceRefs: [{ ref: "task.json", hash: sha256(fixture.task.readRecord("task.json")) }],
            });
            publishMaterialRevisionRecord({ created: winner, read: fixture.task.readRecord, create: fixture.task.createRecordAtomic });
            const winnerPointerRaw = `${JSON.stringify({
              schema_version: "task-material-current.v1", task_id: "phase2", generation: 2,
              revision_id: winner.revision.revision_id, revision_ref: winner.revision_ref,
              revision_hash: winner.revision_hash, previous_ref: oldPointer.revision_ref,
            }, null, 2)}\n`;
            hooks = { current: { [hook]: () => fixture.task.writeRecordAtomic("materials/current.json", winnerPointerRaw, {
              expectedPriorRaw: oldPointerRaw, validator: () => {},
            }) } };
          } else hooks = { current: { [hook]: () => { throw new Error("current fault"); } } };
          const artifacts = ArtifactDir.open(fixture.repo, fixture.task);
          expect(() => createTaskKernel(fixture.task, { artifacts, materialRevisionTestHooks: hooks }).publishMaterialRevision({
            change_summary: "changed", source_refs: ["task.json"], expected_current_ref: fixture.first.revision_ref,
          })).toThrow(fault === "cas" ? /MATERIAL_REVISION_CONFLICT/ : /current fault/);
          const pointer = JSON.parse(fixture.task.readRecord("materials/current.json"));
          expect([1, 2]).toContain(pointer.generation);
          expect(pointer.revision_id).toBe(JSON.parse(fixture.task.readRecord(pointer.revision_ref)).revision_id);
          expect(pointer.revision_hash).toBe(sha256(fixture.task.readRecord(pointer.revision_ref)));
          return;
        }
        const ref = `phase2-writer/${family}.json`;
        if (["cas", "current"].includes(fault)) {
          task.createRecordAtomic(ref, "old");
          expect(() => task.writeRecordAtomic(ref, "new", {
            expectedPriorRaw: "old", validator: () => {},
            testHooks: { [hook]: () => {
              if (fault === "cas") writeFileSync(task.recordPath(ref), "winner");
              else throw new Error("current fault");
            } },
          })).toThrow();
          expect(["old", "new", "winner"]).toContain(task.readRecord(ref));
          return;
        }
        const record = legalRecords(family);
        expect(() => publishers[family]({
          record, read: task.readRecord,
          create: (recordRef, bytes) => task.createRecordAtomic(recordRef, bytes, {
            testHooks: { [hook]: () => { throw new Error(`${fault} fault`); } },
          }),
        })).toThrow(/fault/);
        expect(() => task.readRecord(record.revision_ref ?? record.ref)).toThrow();
      });
    }
  }

  it("same immutable input is idempotent through TaskHandle create-only", () => {
    const { task } = realTask();
    const args = { ref: "phase2-writer/fact.json", raw: "same", read: task.readRecord, create: task.createRecordAtomic };
    expect(publishImmutable(args)).toMatchObject({ idempotent: false });
    expect(publishImmutable(args)).toMatchObject({ idempotent: true });
  });

  it("production MaterialRevision admits one different-input winner from a shared authenticated head", async () => {
    const fixture = initializeMaterialRace();
    writeFileSync(join(fixture.root, "spec.md"), "# changed\n");
    const outcomes = await Promise.all([
      runProductionMaterialChild({ taskPath: fixture.task.taskPath, repo: fixture.repo, expectedCurrentRef: fixture.first.revision_ref, changeSummary: "winner-a" }),
      runProductionMaterialChild({ taskPath: fixture.task.taskPath, repo: fixture.repo, expectedCurrentRef: fixture.first.revision_ref, changeSummary: "winner-b" }),
    ]);
    expect(outcomes.map(({ code }) => code).sort()).toEqual([0, 2]);
    expect(outcomes.find(({ code }) => code === 2).stderr).toMatch(/MATERIAL_REVISION_CONFLICT/);
    const pointer = JSON.parse(fixture.task.readRecord("materials/current.json"));
    expect(pointer.generation).toBe(2);
    const revisionRaw = fixture.task.readRecord(pointer.revision_ref);
    expect(pointer.revision_hash).toBe(sha256(revisionRaw));
    expect(pointer.revision_id).toBe(JSON.parse(revisionRaw).revision_id);
  });

  it("production MaterialRevision converges idempotently for the same concurrent input", async () => {
    const fixture = initializeMaterialRace();
    writeFileSync(join(fixture.root, "spec.md"), "# changed\n");
    const outcomes = await Promise.all([
      runProductionMaterialChild({ taskPath: fixture.task.taskPath, repo: fixture.repo, expectedCurrentRef: fixture.first.revision_ref, changeSummary: "same" }),
      runProductionMaterialChild({ taskPath: fixture.task.taskPath, repo: fixture.repo, expectedCurrentRef: fixture.first.revision_ref, changeSummary: "same" }),
    ]);
    expect(outcomes.map(({ code }) => code)).toEqual([0, 0]);
    const pointer = JSON.parse(fixture.task.readRecord("materials/current.json"));
    expect(pointer.generation).toBe(2);
    const revisionRaw = fixture.task.readRecord(pointer.revision_ref);
    expect(pointer.revision_hash).toBe(sha256(revisionRaw));
    expect(pointer.revision_id).toBe(JSON.parse(revisionRaw).revision_id);
  });

  it.each(["quality", "publication"])("%s publisher admits exactly one winner for different concurrent input", async (family) => {
    const { task } = realTask();
    const exits = await Promise.all([
      runChild({ taskPath: task.taskPath, raw: "winner-a", family }),
      runChild({ taskPath: task.taskPath, raw: "winner-b", family }),
    ]);
    expect(exits.sort()).toEqual([0, 1]);
    const winner = task.readRecord(`phase2-writer/${family}-race.json`);
    if (family === "material") {
      expect([sha256("winner-a"), sha256("winner-b")]).toContain(JSON.parse(winner).hashes["decision-log.md"]);
    } else expect(winner).toMatch(/winner-a|winner-b/);
  });

  it.each(["quality", "publication"])("%s publisher replays the same concurrent input idempotently", async (family) => {
    const { task } = realTask();
    const exits = await Promise.all([
      runChild({ taskPath: task.taskPath, raw: "same", family }),
      runChild({ taskPath: task.taskPath, raw: "same", family }),
    ]);
    expect(exits).toEqual([0, 0]);
    const winner = task.readRecord(`phase2-writer/${family}-race.json`);
    if (family === "material") expect(JSON.parse(winner).hashes["decision-log.md"]).toBe(sha256("same"));
    else expect(winner).toContain("same");
  });
});
