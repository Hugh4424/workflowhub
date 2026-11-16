import { createHash } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createTrackedTempDir } from "../../runtime/interface/temp-dir.mjs";
import { workflowHubConfigPath } from "../evidence/storage-root.mjs";
import { precheckForAction, precheckForActions } from "./precheck.mjs";
import { PACKET_SOURCE_PREFIX, loadTrustedThirdReviewConfig } from "../../skills/wh-review/scripts/third-review-host-config.mjs";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const dirs = [];
afterEach(() => { for (const dir of dirs.splice(0).reverse()) dir.dispose(); });

function stub(dir, name, output = "fixture 1.0.0\n") {
  const path = join(dir, name);
  writeFileSync(path, `#!/bin/sh\nprintf '%s' '${output}'\nexit 0\n`, { mode: 0o700 });
  return path;
}

function fixture() {
  const dir = createTrackedTempDir("wh-c10-precheck-");
  dirs.push(dir);
  const root = dir.path;
  const home = join(root, "home");
  const bin = join(root, "bin");
  const emptyBin = join(root, "empty-bin");
  for (const path of [home, bin, emptyBin]) mkdirSync(path);
  const env = { HOME: home, XDG_CONFIG_HOME: join(root, "xdg"), PATH: emptyBin };
  const attachmentRoot = join(root, "packets");
  const runtimeRoot = join(root, "broker-runtime");
  mkdirSync(attachmentRoot);
  mkdirSync(runtimeRoot);
  const broker = join(root, "providers.json");
  writeFileSync(broker, JSON.stringify({
    version: 4, tiers: [["codex"]], runtime: { root: runtimeRoot },
    providers: { "codex/luna": { enabled: true, source_id: "fixture-codex", model: "fixture-model", command: process.execPath } },
    attachment_roots: [{ root: attachmentRoot, sources: [PACKET_SOURCE_PREFIX] }],
  }));
  const path = workflowHubConfigPath({ env, home });
  mkdirSync(join(path, ".."), { recursive: true });
  const config = (overrides = {}) => ({
    task_dir: join(root, "tasks"),
    third_review: { command: [process.execPath], config: broker, attachment_root: attachmentRoot },
    wh_review: { version: 2, stages: { "build-code": { initial: ["codex/luna"], mode: "full_only" } }, non_stage: {} },
    ...overrides,
  });
  const writeConfig = (value) => writeFileSync(path, typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`);
  return { dir, root, home, bin, emptyBin, env, path, broker, attachmentRoot, config, writeConfig, stub };
}

function byId(result, id) {
  return result.checks.find((check) => check.id === id);
}

describe("C10 P2 action-scoped precheck", () => {
  it("names an unsupported Node version without claiming anything ran", () => {
    const f = fixture();
    const result = precheckForAction("onboard", { env: f.env, home: f.home, nodeVersion: "20.11.0" });
    const node = byId(result, "node");
    expect(result.status).toBe("blocked");
    expect(node).toMatchObject({ status: "missing", code: "NODE_VERSION_UNSUPPORTED", source: "process.versions.node" });
    expect(node.next_action).toMatch(/Node\.js 24/);
  });

  it("names the missing unique user configuration with its path, source and next step", () => {
    const f = fixture();
    const result = precheckForAction("review", { env: f.env, home: f.home, requestedStage: "build-code" });
    const config = byId(result, "config");
    expect(result.status).toBe("blocked");
    expect(config).toMatchObject({ status: "missing", code: "CONFIG_MISSING", path: f.path, source: "XDG_CONFIG_HOME" });
    expect(config.next_action).toContain("config/workflowhub.config.template.json");
    // Dependent review checks stay honest instead of reporting an available route.
    expect(byId(result, "route")).toMatchObject({ status: "unknown" });
  });

  it("fails explicitly on invalid JSON and never writes the user file", () => {
    const f = fixture();
    const bytes = Buffer.from("{ not json\n");
    writeFileSync(f.path, bytes);
    const result = precheckForAction("review", { env: f.env, home: f.home, requestedStage: "build-code" });
    const config = byId(result, "config");
    expect(config).toMatchObject({ status: "invalid", code: "CONFIG_INVALID_JSON", path: f.path });
    expect(sha(readFileSync(f.path))).toBe(sha(bytes));
  });

  it.each([
    ["retired wh_review profiles", (f) => f.config({ wh_review: { version: 2, stages: { "build-code": { initial: ["codex/luna"], mode: "full_only" } }, profiles: { "codex/luna": {} } } }), "CONFIG_WH_REVIEW_RETIRED_FIELD"],
    ["unsupported wh_review version", (f) => f.config({ wh_review: { version: 1, stages: {} } }), "CONFIG_WH_REVIEW_VERSION_UNSUPPORTED"],
    ["relative task_dir", (f) => f.config({ task_dir: "./tasks" }), "CONFIG_TASK_DIR_INVALID"],
    ["missing third_review", (f) => f.config({ third_review: undefined }), "CONFIG_THIRD_REVIEW_MISSING"],
  ])("reports %s as an explicit configuration failure", (_label, build, code) => {
    const f = fixture();
    f.writeConfig(build(f));
    const result = precheckForAction("review", { env: f.env, home: f.home, requestedStage: "build-code" });
    expect(byId(result, "config")).toMatchObject({ status: expect.stringMatching(/invalid|missing/), code });
  });

  it("names a missing review route and a missing OCR installation from the full review action", () => {
    const f = fixture();
    f.writeConfig(f.config({ wh_review: { version: 2, stages: {}, non_stage: {} } }));
    const noRoute = precheckForAction("review", { env: f.env, home: f.home, requestedStage: "build-code" });
    expect(byId(noRoute, "route")).toMatchObject({ status: "missing", code: "ROUTE_STAGE_ABSENT" });

    f.writeConfig(f.config());
    const noOcr = precheckForAction("review-full", { env: f.env, home: f.home, requestedStage: "build-code" });
    const ocr = byId(noOcr, "ocr");
    expect(ocr).toMatchObject({ status: "missing", code: "OCR_NOT_INSTALLED" });
    expect(ocr.next_action).toMatch(/1\.12\.9/);
    expect(ocr.next_action).toMatch(/no substitute executor/);
  });

  it("names the missing provider executable instead of a generic dispatch error", () => {
    const f = fixture();
    const providers = JSON.parse(readFileSync(f.broker, "utf8"));
    providers.providers["codex/luna"].command = join(f.root, "missing-codex");
    writeFileSync(f.broker, JSON.stringify(providers));
    f.writeConfig(f.config());
    const result = precheckForAction("review-full", { env: f.env, home: f.home, requestedStage: "build-code" });
    expect(byId(result, "provider")).toMatchObject({
      status: "missing", code: "PROVIDER_EXECUTABLE_NOT_FOUND", path: join(f.root, "missing-codex"),
    });
  });

  it("names a missing provider definition and a missing 3rd-review config file", () => {
    const f = fixture();
    const providers = JSON.parse(readFileSync(f.broker, "utf8"));
    providers.providers = {};
    writeFileSync(f.broker, JSON.stringify(providers));
    f.writeConfig(f.config());
    const undefinedProvider = precheckForAction("review-full", { env: f.env, home: f.home, requestedStage: "build-code" });
    expect(byId(undefinedProvider, "provider")).toMatchObject({ status: "missing", code: "PROVIDER_NOT_DEFINED" });

    f.writeConfig(f.config({ third_review: { command: [process.execPath], config: join(f.root, "absent-providers.json"), attachment_root: f.attachmentRoot } }));
    const absentConfig = precheckForAction("review-full", { env: f.env, home: f.home, requestedStage: "build-code" });
    expect(byId(absentConfig, "provider")).toMatchObject({ status: "missing", code: "PROVIDER_CONFIG_NOT_FOUND", path: join(f.root, "absent-providers.json") });
  });

  it("names missing Ego and anysearch inputs and keeps them blocking for their own actions", () => {
    const f = fixture();
    const missing = precheckForActions(["browser", "search"], { env: f.env, home: f.home });
    expect(byId(missing, "ego")).toMatchObject({ status: "missing", code: "EGO_NOT_INSTALLED", source: "PATH (ego-browser)" });
    expect(byId(missing, "ego").next_action).toMatch(/do not fall back/);
    expect(byId(missing, "anysearch")).toMatchObject({ status: "missing", code: "ANYSEARCH_KEY_MISSING", source: "ANYSEARCH_API_KEY" });
    expect(byId(missing, "anysearch").next_action).toMatch(/not used silently/);
    expect(missing.status).toBe("blocked");

    f.stub(f.bin, "ego-browser", "ego-browser 0.6.2.9\n");
    const ready = precheckForActions(["browser", "search"], { env: { ...f.env, PATH: f.bin, ANYSEARCH_API_KEY: "fixture-key" }, home: f.home });
    expect(byId(ready, "ego").status).toBe("ok");
    expect(byId(ready, "anysearch").status).toBe("ok");
    expect(ready.status).toBe("ready");
  });

  it("names missing npm and git only for the action that needs them", () => {
    const f = fixture();
    const missing = precheckForAction("install", { env: f.env, home: f.home });
    expect(byId(missing, "npm")).toMatchObject({ status: "missing", code: "NPM_NOT_INSTALLED" });
    expect(byId(missing, "git")).toMatchObject({ status: "missing", code: "GIT_NOT_INSTALLED" });
    f.stub(f.bin, "npm");
    f.stub(f.bin, "git");
    const ready = precheckForAction("install", { env: { ...f.env, PATH: f.bin }, home: f.home });
    expect(byId(ready, "npm").status).toBe("ok");
    expect(byId(ready, "git").status).toBe("ok");
  });

  it("resolves a PATH command and a symlinked provider executable instead of calling them missing", () => {
    const f = fixture();
    const providers = JSON.parse(readFileSync(f.broker, "utf8"));
    const linked = join(f.bin, "provider-link");
    symlinkSync(process.execPath, linked);
    providers.providers["codex/luna"].command = linked;
    writeFileSync(f.broker, JSON.stringify(providers));
    f.writeConfig(f.config({ third_review: { command: ["node", join(f.root, "broker.mjs")], config: f.broker, attachment_root: f.attachmentRoot } }));
    const result = precheckForAction("review-full", {
      env: { ...f.env, PATH: `${f.bin}:${dirname(process.execPath)}` }, home: f.home, requestedStage: "build-code",
    });
    expect(byId(result, "provider").status).toBe("ok");
    expect(result.missing.map((item) => item.id)).not.toContain("provider");
  });

  it("resolves a PATH-named provider and names it when it is absent", () => {
    const f = fixture();
    const providers = JSON.parse(readFileSync(f.broker, "utf8"));
    providers.providers["codex/luna"].command = "codex";
    writeFileSync(f.broker, JSON.stringify(providers));
    f.writeConfig(f.config());
    const present = precheckForAction("review-full", { env: { ...f.env, PATH: f.bin }, home: f.home, requestedStage: "build-code" });
    expect(byId(present, "provider").status).toBe("missing");
    expect(byId(present, "provider")).toMatchObject({ code: "PROVIDER_EXECUTABLE_NOT_FOUND", path: "codex" });
    f.stub(f.bin, "codex");
    const resolved = precheckForAction("review-full", { env: { ...f.env, PATH: f.bin }, home: f.home, requestedStage: "build-code" });
    expect(byId(resolved, "provider").status).toBe("ok");
  });

  it("blocks dependent actions when a required probe exits nonzero or is unparseable", () => {
    const f = fixture();
    writeFileSync(join(f.bin, "npm"), "#!/bin/sh\nexit 3\n", { mode: 0o700 });
    f.stub(f.bin, "git");
    const install = precheckForAction("install", { env: { ...f.env, PATH: f.bin }, home: f.home });
    const npm = byId(install, "npm");
    expect(npm.status).not.toBe("ok");
    expect(npm).toMatchObject({ status: "unavailable" });
    expect(String(npm.message)).toMatch(/exit|3|PROBE/i);
    expect(install.status).toBe("blocked");
    expect(install.missing.map((item) => item.id)).toContain("npm");

    const node = precheckForAction("onboard", { env: f.env, home: f.home, nodeVersion: "not-a-semver" });
    expect(byId(node, "node").status).toBe("unknown");
    expect(node.status).toBe("blocked");
    expect(node.missing.map((item) => item.id)).toContain("node");
  });

  it("names a missing 3rd-review config as the provider configuration gap", () => {
    const f = fixture();
    f.writeConfig(f.config({ third_review: { command: [process.execPath], config: join(f.root, "absent-providers.json"), attachment_root: f.attachmentRoot } }));
    const result = precheckForAction("review", { env: f.env, home: f.home, requestedStage: "build-code" });
    expect(byId(result, "provider_config")).toMatchObject({ status: "missing", code: "PROVIDER_CONFIG_NOT_FOUND", path: join(f.root, "absent-providers.json") });
    expect(result.status).toBe("blocked");
    expect(String(byId(result, "provider_config").next_action)).toContain("3rd-review");
  });

  it.skipIf(typeof process.getuid === "function" && process.getuid() === 0)("keeps a permission-denied provider config distinct from a missing file", () => {
    const f = fixture();
    const locked = join(f.root, "locked");
    mkdirSync(locked);
    const configPath = join(locked, "providers.json");
    writeFileSync(configPath, "{}");
    f.writeConfig(f.config({ third_review: { command: [process.execPath], config: configPath, attachment_root: f.attachmentRoot } }));
    chmodSync(locked, 0o000);
    try {
      const result = precheckForAction("review-full", { env: f.env, home: f.home, requestedStage: "build-code" });
      expect(byId(result, "provider_config")).toMatchObject({ status: "missing", code: "PROVIDER_CONFIG_PERMISSION_DENIED", path: configPath });
      expect(String(byId(result, "provider_config").next_action)).toMatch(/permission|read|access/i);
    } finally { chmodSync(locked, 0o755); }
  });

  it("does not execute external tools in static probe mode", () => {
    const f = fixture();
    const marker = join(f.root, "spawned.txt");
    for (const name of ["ocr", "ego-browser", "npm", "git"]) {
      writeFileSync(join(f.bin, name), `#!/bin/sh\necho "${name} $@" >> '${marker}'\nexit 0\n`, { mode: 0o700 });
    }
    const result = precheckForActions(["tools"], { env: { ...f.env, PATH: f.bin, ANYSEARCH_API_KEY: "fixture-key" }, home: f.home, probe: "static" });
    expect(existsSync(marker)).toBe(false);
    expect(byId(result, "ocr")).toMatchObject({ status: "unknown" });
    expect(String(byId(result, "ocr").message)).toMatch(/version/i);
    expect(byId(result, "npm").status).toBe("unknown");
    expect(String(byId(result, "npm").message)).toMatch(/not executed|read-only/i);
    expect(result.status).toBe("blocked");
  });

  it("accepts the real host configuration shape, including the passive verify-code route", () => {
    const f = fixture();
    const route = { initial: ["codex/luna"], mode: "single_round" };
    f.writeConfig(f.config({ wh_review: {
      version: 2,
      stages: {
        "make-decision": { direction: { initial: ["codex/luna"], mode: "single_round" }, detail: { initial: ["codex/luna"], mode: "single_round" } },
        "build-plan": route,
        "build-code": { initial: ["codex/luna"], mode: "full_only" },
        "verify-code": { initial: ["codex/luna"], mode: "single_round" },
      },
      non_stage: { build_prd: route },
    } }));
    const review = precheckForActions(["review"], { env: f.env, home: f.home, requestedStage: "build-code" });
    expect(review.status).toBe("ready");
    expect(byId(review, "config").status).toBe("ok");
    const direction = precheckForActions(["review"], { env: f.env, home: f.home, requestedStage: "make-decision", requestedTrack: "direction" });
    expect(byId(direction, "route").status).toBe("ok");
  });

  it("agrees with the trusted loader on whether a configuration is usable", () => {
    const f = fixture();
    const validBuildCode = { initial: ["codex/luna"], mode: "full_only" };
    const cases = [
      ["real shape with passive verify-code", { version: 2, stages: { "build-code": validBuildCode, "verify-code": { initial: ["codex/luna"], mode: "single_round" } } }],
      ["malformed non-requested stage", { version: 2, stages: { "build-plan": { initial: "x" }, "build-code": validBuildCode } }],
      ["malformed requested stage", { version: 2, stages: { "build-code": { initial: "x" } } }],
      ["loadable config", { version: 2, stages: { "build-code": validBuildCode } }],
    ];
    for (const [label, wh_review] of cases) {
      f.writeConfig(f.config({ wh_review }));
      let loaderAccepted = true;
      let loaderError = null;
      try { loadTrustedThirdReviewConfig({ hostConfigPath: f.path, requestedStage: "build-code" }); }
      catch (error) { loaderAccepted = false; loaderError = String(error.message); }
      const precheck = precheckForActions(["review"], { env: f.env, home: f.home, requestedStage: "build-code" });
      expect(precheck.status === "ready", `${label}: loaderAccepted=${loaderAccepted} loaderError=${loaderError} precheck=${JSON.stringify(precheck.missing)}`).toBe(loaderAccepted);
    }
  });

  it.each(["doctor", "status", "draft"])("does not block %s on review, browser or search resources", (action) => {
    const f = fixture();
    const result = precheckForAction(action, { env: f.env, home: f.home });
    expect(result.status).toBe("ready");
    expect(result.missing).toEqual([]);
    expect(result.checks).toEqual([]);
  });
});
