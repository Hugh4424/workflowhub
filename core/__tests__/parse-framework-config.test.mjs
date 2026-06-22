/**
 * RED tests for core/parse-framework-config.mjs (FR-CFG-004, decision 13).
 * Module does NOT exist yet — all tests must fail with import error or assertion error.
 *
 * Key contract:
 *  - parseFrameworkConfig(config) reads task_dir from the config object,
 *    passes it through resolvePath (single resolver entry point), returns result.
 *  - task_dir absent → skip resolution, return undefined (shape-only, no runtime semantics).
 *  - task_dir must NOT be treated as a plain string bypassing resolvePath.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resolve } from "node:path";

// ── Dynamic import of the module under test ────────────────────────────────────
let parseFrameworkConfig;
try {
  const mod = await import("../parse-framework-config.mjs");
  parseFrameworkConfig = mod.parseFrameworkConfig;
} catch {
  parseFrameworkConfig = undefined;
}

function ensureModule() {
  if (typeof parseFrameworkConfig !== "function") {
    throw new Error(
      "core/parse-framework-config.mjs does not export parseFrameworkConfig — module missing (expected RED)"
    );
  }
}

// ── Scenario 1: task_dir present → runs through resolvePath ───────────────────
//
// Approach: we spy on the *real* resolvePath from core/resolve-path.mjs.
// Since parse-framework-config must import and call resolvePath (not inline
// its own resolution), we can verify the call via vi.spyOn on the module
// namespace — but ESM live bindings make this tricky without mocking at module
// level. Instead we use an observable contract:
//
//   resolvePath(p) returns `resolve(p)` (Node path.resolve).
//   A plain string treatment would just return p unchanged.
//   So: if task_dir is a relative path, parseFrameworkConfig's return value
//   must equal resolve(task_dir) — which only holds if resolvePath was called.
//
// Additionally we test with vi.mock so the spy approach is also exercised.

describe("parseFrameworkConfig — task_dir goes through resolvePath", () => {
  it("returns resolved (absolute) task_dir when config has a relative task_dir", () => {
    ensureModule();
    const relativeTaskDir = "tasks/";
    const config = { registry: [], task_dir: relativeTaskDir };
    const result = parseFrameworkConfig(config);
    // If task_dir were treated as a plain string, result.task_dir would be "tasks/".
    // resolvePath must call path.resolve, so result must be an absolute path.
    expect(typeof result.task_dir).toBe("string");
    expect(result.task_dir).toBe(resolve(relativeTaskDir));
    // Fails if parse-framework-config just does `return { task_dir: config.task_dir }`.
    expect(result.task_dir).not.toBe(relativeTaskDir);
  });

  it("returns resolved (absolute) task_dir for an already-absolute task_dir", () => {
    ensureModule();
    const absTaskDir = "/var/run/tasks";
    const config = { registry: [], task_dir: absTaskDir };
    const result = parseFrameworkConfig(config);
    expect(result.task_dir).toBe(resolve(absTaskDir));
  });

  it("result task_dir differs from raw string when relative (proves resolver called)", () => {
    ensureModule();
    const raw = "relative/path";
    const config = { task_dir: raw };
    const result = parseFrameworkConfig(config);
    // Raw relative path would equal itself; resolved form is absolute.
    // This assertion is false if task_dir is treated as plain string.
    expect(result.task_dir.startsWith("/")).toBe(true);
    // The resolved value must end with the leaf.
    expect(result.task_dir.endsWith("relative/path")).toBe(true);
  });
});

// ── Scenario 2: task_dir absent → no throw, return undefined task_dir ─────────
//
// Decision 13 / shape-only: absent key = skip resolution, not an error.
describe("parseFrameworkConfig — task_dir absent is not an error", () => {
  it("does not throw when config has no task_dir key", () => {
    ensureModule();
    const config = { registry: [] };
    expect(() => parseFrameworkConfig(config)).not.toThrow();
  });

  it("returns undefined task_dir when key absent", () => {
    ensureModule();
    const config = { registry: [] };
    const result = parseFrameworkConfig(config);
    expect(result.task_dir).toBeUndefined();
  });

  it("does not infer task_dir from cwd when key absent", () => {
    ensureModule();
    // If parseFrameworkConfig tried to call resolvePath() with no arg,
    // resolvePath would throw — and we'd see it here. But the contract says:
    // absent task_dir → skip resolution. So no throw and no cwd-derived value.
    const config = {};
    let result;
    expect(() => {
      result = parseFrameworkConfig(config);
    }).not.toThrow();
    // Must not have silently derived task_dir from cwd.
    if (result && result.task_dir !== undefined) {
      expect(result.task_dir).not.toBe(process.cwd());
    }
  });
});

// ── Anti-bypass: confirm resolvePath is the single entry point ────────────────
//
// We use vi.mock to intercept the resolvePath import inside parse-framework-config.
// If parse-framework-config bypasses resolvePath and uses path.resolve directly,
// the spy will not record a call.
//
// Note: vi.mock hoisting requires a static string — mocking '../resolve-path.mjs'
// which is the path parse-framework-config imports from.
vi.mock("../resolve-path.mjs", () => {
  return {
    resolvePath: vi.fn((p) => {
      if (!p) throw new Error("resolvePath: explicit path required");
      return resolve(p);
    }),
  };
});

describe("parseFrameworkConfig — task_dir routes through resolvePath (spy)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("calls resolvePath exactly once with task_dir value", async () => {
    ensureModule();
    // Re-import after mock is set up to get the mocked version.
    // (In ESM with vi.mock hoisting, the mock is already active.)
    const { resolvePath: spied } = await import("../resolve-path.mjs");
    const taskDir = "/tmp/tasks";
    const config = { task_dir: taskDir };
    parseFrameworkConfig(config);
    expect(spied).toHaveBeenCalledOnce();
    expect(spied).toHaveBeenCalledWith(taskDir);
  });

  it("does not call resolvePath when task_dir is absent", async () => {
    ensureModule();
    const { resolvePath: spied } = await import("../resolve-path.mjs");
    const config = { registry: [] };
    parseFrameworkConfig(config);
    expect(spied).not.toHaveBeenCalled();
  });
});
