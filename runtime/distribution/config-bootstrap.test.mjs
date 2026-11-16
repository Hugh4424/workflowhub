import { createHash } from "node:crypto";
import { chmodSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createTrackedTempDir } from "../../runtime/interface/temp-dir.mjs";
import { workflowHubConfigPath } from "../evidence/storage-root.mjs";
import { applyHostConfigBootstrap, inspectHostConfig, planHostConfigBootstrap } from "./config-bootstrap.mjs";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const dirs = [];
afterEach(() => { for (const dir of dirs.splice(0).reverse()) dir.dispose(); });

function fixture() {
  const dir = createTrackedTempDir("wh-c10-config-");
  dirs.push(dir);
  const home = join(dir.path, "home");
  const env = { HOME: home, XDG_CONFIG_HOME: join(dir.path, "xdg") };
  mkdirSync(home);
  const path = workflowHubConfigPath({ env, home });
  mkdirSync(join(path, ".."), { recursive: true });
  return { dir, home, env, path };
}

function validConfig(root) {
  return {
    task_dir: join(root, "tasks"),
    third_review: { command: [process.execPath], config: join(root, "providers.json"), attachment_root: join(root, "packets") },
  };
}

function writeConfig(path, value) {
  const bytes = Buffer.from(typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`);
  writeFileSync(path, bytes);
  return bytes;
}

describe("C10 P2 unique user configuration", () => {
  it("reports a missing file and a concrete next step without creating it", async () => {
    const f = fixture();
    const inspection = inspectHostConfig({ env: f.env, home: f.home });
    expect(inspection.state).toBe("missing");
    expect(inspection.path).toBe(f.path);
    expect(inspection.source).toBe("XDG_CONFIG_HOME");
    const plan = planHostConfigBootstrap(inspection);
    expect(plan.action).toBe("blocked");
    expect(plan.next_action).toContain("config/workflowhub.config.template.json");
    const applied = await applyHostConfigBootstrap(plan);
    expect(applied.status).toBe("blocked");
    expect(existsSync(f.path)).toBe(false);
  });

  it("keeps invalid JSON bytes and names the bad file without echoing content", async () => {
    const f = fixture();
    const original = writeConfig(f.path, "{\"task_dir\": \"../secret-placeholder\"");
    const inspection = inspectHostConfig({ env: f.env, home: f.home });
    expect(inspection.state).toBe("invalid_json");
    expect(inspection.problems[0].code).toBe("CONFIG_INVALID_JSON");
    expect(inspection.problems[0].message).not.toContain("secret-placeholder");
    const plan = planHostConfigBootstrap(inspection);
    expect(plan.action).toBe("blocked");
    const applied = await applyHostConfigBootstrap(plan);
    expect(applied.status).toBe("blocked");
    expect(sha(readFileSync(f.path))).toBe(sha(original));
  });

  it.each([
    ["version 1", { task_dir: "/tmp/tasks", third_review: { command: [process.execPath], config: "/tmp/p.json", attachment_root: "/tmp/packets" }, wh_review: { version: 1, stages: {} } }, "CONFIG_WH_REVIEW_VERSION_UNSUPPORTED"],
    ["retired profiles", { task_dir: "/tmp/tasks", third_review: { command: [process.execPath], config: "/tmp/p.json", attachment_root: "/tmp/packets" }, wh_review: { version: 2, stages: {}, profiles: { a: {} } } }, "CONFIG_WH_REVIEW_RETIRED_FIELD"],
    ["retired priority", { task_dir: "/tmp/tasks", third_review: { command: [process.execPath], config: "/tmp/p.json", attachment_root: "/tmp/packets" }, wh_review: { version: 2, stages: {}, priority: [] } }, "CONFIG_WH_REVIEW_RETIRED_FIELD"],
    ["relative task_dir", { task_dir: "./tasks", third_review: { command: [process.execPath], config: "/tmp/p.json", attachment_root: "/tmp/packets" } }, "CONFIG_TASK_DIR_INVALID"],
    ["missing third_review", { task_dir: "/tmp/tasks" }, "CONFIG_THIRD_REVIEW_MISSING"],
    ["incomplete third_review", { task_dir: "/tmp/tasks", third_review: { command: [process.execPath] }, wh_review: { version: 2, stages: {} } }, "CONFIG_THIRD_REVIEW_CONFIG_MISSING"],
  ])("fails explicitly on %s and preserves the user bytes", async (_label, config, code) => {
    const f = fixture();
    const original = writeConfig(f.path, config);
    const inspection = inspectHostConfig({ env: f.env, home: f.home });
    expect(inspection.state === "unsupported" || inspection.state === "invalid").toBe(true);
    expect(inspection.problems.map((problem) => problem.code)).toContain(code);
    const applied = await applyHostConfigBootstrap(planHostConfigBootstrap(inspection));
    expect(applied.status).toBe("blocked");
    expect(sha(readFileSync(f.path))).toBe(sha(original));
  });

  it("merges only the documented empty wh_review structure with one unique backup and an atomic write", async () => {
    const f = fixture();
    const original = writeConfig(f.path, validConfig(f.dir.path));
    const inspection = inspectHostConfig({ env: f.env, home: f.home });
    expect(inspection.state).toBe("present");
    const plan = planHostConfigBootstrap(inspection);
    expect(plan.action).toBe("merge");
    expect(plan.patch).toEqual({ wh_review: { version: 2, stages: {}, non_stage: {} } });
    const before = JSON.parse(original.toString("utf8"));
    const applied = await applyHostConfigBootstrap(plan);
    expect(applied.status).toBe("applied");
    const after = JSON.parse(readFileSync(f.path, "utf8"));
    expect(after.task_dir).toBe(before.task_dir);
    expect(after.third_review).toEqual(before.third_review);
    expect(after.wh_review).toEqual({ version: 2, stages: {}, non_stage: {} });
    expect(sha(readFileSync(applied.backup_path))).toBe(sha(original));
    expect(applied.backup_path).not.toBe(f.path);
    expect(applied.backup_path.startsWith(`${f.path}.bak-`)).toBe(true);
    expect(readdirSync(join(f.path, "..")).filter((name) => name.startsWith(".workflowhub-config-"))).toEqual([]);
    expect(statSync(f.path).mode & 0o777).toBe(0o600);
    const reapplied = planHostConfigBootstrap(inspectHostConfig({ env: f.env, home: f.home }));
    expect(reapplied.action).toBe("none");
    expect((await applyHostConfigBootstrap(reapplied)).status).toBe("noop");
  });

  it("adds a missing non_stage object without changing existing routes", async () => {
    const f = fixture();
    const config = { ...validConfig(f.dir.path), wh_review: { version: 2, stages: { "build-code": { initial: ["codex"], mode: "full_only" } } } };
    writeConfig(f.path, config);
    const plan = planHostConfigBootstrap(inspectHostConfig({ env: f.env, home: f.home }));
    expect(plan.action).toBe("merge");
    expect(plan.patch).toEqual({ wh_review: { version: 2, stages: { "build-code": { initial: ["codex"], mode: "full_only" } }, non_stage: {} } });
    const applied = await applyHostConfigBootstrap(plan);
    expect(applied.status).toBe("applied");
    expect(JSON.parse(readFileSync(f.path, "utf8")).wh_review.stages).toEqual(config.wh_review.stages);
  });

  it("refuses to overwrite bytes that changed after planning", async () => {
    const f = fixture();
    writeConfig(f.path, validConfig(f.dir.path));
    const plan = planHostConfigBootstrap(inspectHostConfig({ env: f.env, home: f.home }));
    const concurrent = writeConfig(f.path, { ...validConfig(f.dir.path), note: "user changed this" });
    const applied = await applyHostConfigBootstrap(plan);
    expect(applied.status).toBe("conflict");
    expect(applied.preserved).toBe(true);
    expect(sha(readFileSync(f.path))).toBe(sha(concurrent));
    expect(readdirSync(join(f.path, "..")).some((name) => name.includes(".bak-"))).toBe(false);
  });

  it("never reuses a backup name across two merges", async () => {
    const f = fixture();
    writeConfig(f.path, validConfig(f.dir.path));
    const first = await applyHostConfigBootstrap(planHostConfigBootstrap(inspectHostConfig({ env: f.env, home: f.home })));
    const parsed = JSON.parse(readFileSync(f.path, "utf8"));
    delete parsed.wh_review.non_stage;
    writeConfig(f.path, parsed);
    const second = await applyHostConfigBootstrap(planHostConfigBootstrap(inspectHostConfig({ env: f.env, home: f.home })));
    expect(first.status).toBe("applied");
    expect(second.status).toBe("applied");
    expect(first.backup_path).not.toBe(second.backup_path);
    expect(existsSync(first.backup_path)).toBe(true);
    expect(existsSync(second.backup_path)).toBe(true);
  });

  it("never echoes configuration content from an invalid JSON token", async () => {
    const f = fixture();
    const original = writeConfig(f.path, "sk-live-SECRET-do-not-echo\n");
    const inspection = inspectHostConfig({ env: f.env, home: f.home });
    const visible = JSON.stringify({ state: inspection.state, problems: inspection.problems, plan: planHostConfigBootstrap(inspection) });
    expect(inspection.state).toBe("invalid_json");
    expect(visible).not.toContain("sk-live");
    expect(visible).not.toContain("SECRET");
    expect(visible).not.toContain("api_key");
    expect(inspection.problems[0].message).toContain(f.path);
    expect(inspection.problems[0].message).toMatch(/line|column|position/i);
    expect(sha(readFileSync(f.path))).toBe(sha(original));
  });

  it("completes a missing wh_review.stages structure without touching existing routes", async () => {
    const f = fixture();
    writeConfig(f.path, { ...validConfig(f.dir.path), wh_review: { version: 2 } });
    const inspection = inspectHostConfig({ env: f.env, home: f.home });
    expect(inspection.state).toBe("present");
    const plan = planHostConfigBootstrap(inspection);
    expect(plan.action).toBe("merge");
    expect(plan.patch).toEqual({ wh_review: { version: 2, stages: {}, non_stage: {} } });
    const applied = await applyHostConfigBootstrap(plan);
    expect(applied.status).toBe("applied");
    expect(JSON.parse(readFileSync(f.path, "utf8")).wh_review).toEqual({ version: 2, stages: {}, non_stage: {} });
  });

  it.each([
    ["stage route initial is not an argv list", { version: 2, stages: { "build-code": { initial: "codex", mode: "full_only" } } }, "CONFIG_WH_REVIEW_ROUTE_INVALID"],
    ["stage route is not an object", { version: 2, stages: { "build-code": "codex" } }, "CONFIG_WH_REVIEW_ROUTE_INVALID"],
    ["non_stage route initial is empty", { version: 2, stages: {}, non_stage: { build_prd: { initial: [] } } }, "CONFIG_WH_REVIEW_ROUTE_INVALID"],
    ["nested make-decision track is not an object", { version: 2, stages: { "make-decision": { direction: "codex" } } }, "CONFIG_WH_REVIEW_ROUTE_INVALID"],
  ])("keeps an unusable inner route unrepaired (%s) and preserves the bytes", async (_label, wh_review, code) => {
    const f = fixture();
    const original = writeConfig(f.path, { ...validConfig(f.dir.path), wh_review });
    const inspection = inspectHostConfig({ env: f.env, home: f.home });
    // The loader tolerates a bad route for a non-requested stage, so the
    // configuration itself stays readable; only an automatic rewrite is blocked.
    expect(inspection.state).toBe("present");
    expect(inspection.route_problems.map((problem) => problem.code)).toContain(code);
    const plan = planHostConfigBootstrap(inspection);
    expect(plan.action).toBe("blocked");
    const applied = await applyHostConfigBootstrap(plan);
    expect(applied.status).toBe("blocked");
    expect(sha(readFileSync(f.path))).toBe(sha(original));
  });

  it("accepts the real configuration shape including the passive verify-code route", async () => {
    const f = fixture();
    writeConfig(f.path, { ...validConfig(f.dir.path), wh_review: {
      version: 2,
      stages: {
        "make-decision": {
          direction: { initial: ["codex/luna"], mode: "single_round" },
          detail: { initial: ["codex/luna"], mode: "single_round" },
        },
        "build-plan": { initial: ["codex/luna"], mode: "single_round" },
        "build-code": { initial: ["codex/luna"], mode: "full_only" },
        "verify-code": { initial: ["codex/luna"], mode: "single_round" },
      },
      non_stage: { build_prd: { initial: ["codex/luna"], mode: "single_round" } },
    } });
    const inspection = inspectHostConfig({ env: f.env, home: f.home });
    expect(inspection.state).toBe("present");
    expect(inspection.route_problems).toEqual([]);
    expect(planHostConfigBootstrap(inspection).action).toBe("none");
  });

  it("writes through a symlinked configuration path and keeps the symlink", async () => {
    const f = fixture();
    const real = join(f.dir.path, "real-config.json");
    const original = writeConfig(real, validConfig(f.dir.path));
    symlinkSync(real, f.path);
    const inspection = inspectHostConfig({ env: f.env, home: f.home });
    expect(inspection.state).toBe("present");
    const plan = planHostConfigBootstrap(inspection);
    expect(plan.action).toBe("merge");
    const applied = await applyHostConfigBootstrap(plan);
    expect(applied.status).toBe("applied");
    expect(lstatSync(f.path).isSymbolicLink()).toBe(true);
    expect(JSON.parse(readFileSync(real, "utf8")).wh_review).toEqual({ version: 2, stages: {}, non_stage: {} });
    expect(sha(readFileSync(applied.backup_path))).toBe(sha(original));
    expect(applied.backup_path.startsWith(`${real}.bak-`)).toBe(true);
  });

  it("refuses to replace a dangling configuration symlink", async () => {
    const f = fixture();
    symlinkSync(join(f.dir.path, "absent-config.json"), f.path);
    const inspection = inspectHostConfig({ env: f.env, home: f.home });
    expect(inspection.state).toBe("invalid");
    expect(inspection.problems.map((problem) => problem.code)).toContain("CONFIG_SYMLINK_DANGLING");
    const plan = planHostConfigBootstrap(inspection);
    expect(plan.action).toBe("blocked");
    const applied = await applyHostConfigBootstrap(plan);
    expect(applied.status).toBe("blocked");
    expect(lstatSync(f.path).isSymbolicLink()).toBe(true);
  });

  it.skipIf(typeof process.getuid === "function" && process.getuid() === 0)("reports a permission failure with its path and keeps the original bytes", async () => {
    const f = fixture();
    const original = writeConfig(f.path, validConfig(f.dir.path));
    const plan = planHostConfigBootstrap(inspectHostConfig({ env: f.env, home: f.home }));
    const directory = join(f.path, "..");
    chmodSync(directory, 0o555);
    try {
      await expect(applyHostConfigBootstrap(plan)).rejects.toMatchObject({ path: expect.stringContaining("workflowhub") });
    } finally {
      chmodSync(directory, 0o700);
    }
    expect(sha(readFileSync(f.path))).toBe(sha(original));
  });
});
