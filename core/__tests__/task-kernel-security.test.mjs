import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

import { bootstrapStage } from "../stage-context.mjs";
import { createTask } from "../task-handle.mjs";
import { createTaskKernel } from "../task-kernel.mjs";
import { assertTaskKernel } from "../task-kernel.mjs";
import { buildTaskKernel } from "../task-kernel-implementation.mjs";

const temporaryDirs = [];

function fixture() {
  const storageRoot = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-kernel-")));
  temporaryDirs.push(storageRoot);
  const taskId = "task-one";
  const taskPath = join(storageRoot, "Projects", "PaperBuilder", "tasks", taskId);
  const task = createTask({
    storageRoot,
    taskPath,
    manifest: {
      schema_version: "1.0.0",
      project_name: "PaperBuilder",
      task_id: taskId,
      created_at: "2026-07-16T00:00:00.000Z",
      target_repo_root: join(storageRoot, "PaperBuilder"),
      issue_ids: [],
      inputs: {},
    },
  });
  return { task, taskPath, taskId };
}

afterEach(() => {
  while (temporaryDirs.length > 0) {
    rmSync(temporaryDirs.pop(), { recursive: true, force: true });
  }
});

describe("TaskKernel trust boundary", () => {
  it("does not export any low-level canonical writer or authority installer", async () => {
    const publicApi = await import("../task-handle.mjs");
    expect(publicApi.installTaskKernelAuthority).toBeUndefined();
    expect(publicApi.requestTaskKernelRecordWriter).toBeUndefined();
    expect(Object.keys(publicApi).filter((name) => /authority|recordwriter/i.test(name))).toEqual([]);
  });

  it("does not brand kernels assembled through the authority-free implementation", () => {
    const fakeTask = { identity: { taskId: "fake", projectName: "Demo" }, manifest: { inputs: {} } };
    const fake = buildTaskKernel(fakeTask, {}, {
      assertTaskHandle: (value) => value,
      openTask: () => fakeTask,
      createKernelRecordFor: () => () => {},
    });
    expect(() => assertTaskKernel(fake)).toThrow(/TaskKernel capability/i);
  });

  it("cannot preinstall a forged authority from an independent process", () => {
    const root=realpathSync(mkdtempSync(join(tmpdir(),"workflowhub-forged-authority-")));temporaryDirs.push(root);
    const module=pathToFileURL(join(process.cwd(),"core/task-handle.mjs")).href;
    const script=`import {installTaskKernelAuthority,requestTaskKernelRecordWriter,createTask} from ${JSON.stringify(module)};const issuer=()=>{};installTaskKernelAuthority(issuer);const task=createTask({storageRoot:${JSON.stringify(root)},manifest:{schema_version:"1.0.0",project_name:"Demo",task_id:"forged",created_at:new Date().toISOString(),target_repo_root:${JSON.stringify(join(root,"repo"))},issue_ids:[],inputs:{}}});const write=requestTaskKernelRecordWriter(task,issuer);write("results/make-decision/attempt-0001.json","{}\\n");write("receipts/forged.json","{}\\n");`;
    const child=spawnSync(process.execPath,["--input-type=module","-e",script],{encoding:"utf8"});
    expect(child.status,child.stdout+child.stderr).not.toBe(0);
    expect(child.stderr).toMatch(/authority|forbidden|authentic|not exported/i);
  });
  it("does not expose kernel-only record writers through TaskHandle reflection", () => {
    const { task } = fixture();
    const reflected = Reflect.ownKeys(task).map(String);
    expect(reflected).not.toContain("_createKernelRecordAtomic");
    expect(reflected.filter((key) => /kernel.*(?:write|create)|(?:write|create).*kernel/i.test(key))).toEqual([]);
  });
  it("rejects the public readAccepted adapter injection seam", () => {
    expect(() =>
      bootstrapStage("build-spec", {
        mode: "sidecar",
        taskPath: "/tmp/Projects/PaperBuilder/tasks/task-one",
        projectName: "PaperBuilder",
        taskId: "task-one",
        readAccepted: () => ({
          facts: { worktree_root: "/tmp/fake", baseline_commit: "fake" },
        }),
      }),
    ).toThrow(/TaskKernel|adapter.*forbidden|readAccepted.*forbidden/i);
  });

  it("requires a branded TaskKernel instead of a structurally similar object", () => {
    const fakeKernel = {
      readAccepted: () => ({ facts: {} }),
      task: { identity: { projectName: "PaperBuilder", taskId: "task-one" } },
    };
    expect(() =>
      bootstrapStage("build-spec", {
        mode: "sidecar",
        taskPath: "/tmp/Projects/PaperBuilder/tasks/task-one",
        projectName: "PaperBuilder",
        taskId: "task-one",
        kernel: fakeKernel,
      }),
    ).toThrow(/brand|authentic|TaskKernel/i);
  });

  it.each(["task identity", "stage identity", "attempt reference", "integrity hash"])(
    "branded kernel fails closed on invalid accepted %s",
    (variant) => {
    const { task, taskId } = fixture();
    const attempt = { task_id: taskId, stage: "make-decision", facts: {} };
    const attemptRaw = `${JSON.stringify(attempt)}\n`;
    mkdirSync(join(task.taskPath, "results", "make-decision"), { recursive: true });
    writeFileSync(join(task.taskPath, "results", "make-decision", "attempt-0001.json"), attemptRaw);
    const accepted = {
      task_id: taskId,
      stage: "make-decision",
      attempt_ref: "attempt-0001.json",
      integrity_hash: createHash("sha256").update(attemptRaw).digest("hex"),
    };
    if (variant === "task identity") accepted.task_id = "other-task";
    if (variant === "stage identity") accepted.stage = "build-spec";
    if (variant === "attempt reference") accepted.attempt_ref = "../escape.json";
    if (variant === "integrity hash") accepted.integrity_hash = "bad";
    writeFileSync(join(task.taskPath, "results", "make-decision", "accepted.json"), `${JSON.stringify(accepted)}\n`);
    const kernel = createTaskKernel(task);
    expect(() => kernel.readAccepted("make-decision")).toThrow(
      /identity|task|stage|attempt|hash|integrity/i,
    );
  });
});
