import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { loadConfig } from "../load-config.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = resolve(here, "../../fixtures");
const fx = (rel) => resolve(fixtures, rel);

// Behaviour-level tests against the spec acceptance criteria (FR-CFG-001..003).
// They drive load-config through fixture files and the public loadConfig(path)
// entry; the parsed object's internal shape is the implementer's choice and is
// deliberately NOT asserted beyond what each FR requires.

// FR-CFG-001: registry (组件清单) is the one required key — missing → throw.
describe("FR-CFG-001 registry required", () => {
  it("throws when the config is missing registry", () => {
    expect(() => loadConfig(fx("config-bad/missing-registry.yaml"))).toThrow(
      /registry|组件清单/i,
    );
  });

  it("parses a config that has registry without throwing", () => {
    expect(() => loadConfig(fx("config-ok/minimal.yaml"))).not.toThrow();
  });
});

// FR-CFG-002: the 4 placeholder keys (external_deps / metrics_path / cli_map /
// path_guard, per decision-log D8) are shape-only —
//   absent → no error (value not consumed); present-but-wrong-shape → error.
describe("FR-CFG-002 placeholder keys shape-only", () => {
  it("does not throw when placeholder keys are absent", () => {
    expect(() => loadConfig(fx("config-ok/minimal.yaml"))).not.toThrow();
  });

  it("throws when external_deps is present with the wrong shape (scalar, not list)", () => {
    // Regex must NOT match the word that is also a runtime-state rejection path:
    // a wrong-key would throw "...is a runtime/current/active state field". We
    // assert the SHAPE branch specifically (the key is whitelisted, value wrong),
    // so the message must mention shape/list — proving FR-CFG-002 shape validation
    // is actually exercised, not a wrong-key rejection masquerading as a shape test.
    expect(() => loadConfig(fx("config-bad/bad-shape-external_deps.yaml"))).toThrow(
      /shape|形状|list|array|列表/i,
    );
  });

  it("throws when cli_map is present with the wrong shape (list, not map)", () => {
    expect(() => loadConfig(fx("config-bad/bad-shape-cli_map.yaml"))).toThrow(
      /shape|形状|map|object|映射/i,
    );
  });
});

// FR-CFG-003: static config only — a runtime-state field is rejected
// (guards the global-single-pointer concurrency cross-talk, decision 8).
describe("FR-CFG-003 runtime-state field rejected", () => {
  it("throws when the config carries a runtime-state field", () => {
    expect(() => loadConfig(fx("config-bad/runtime-state-field.yaml"))).toThrow(
      /runtime|current|active|运行态|static|静态/i,
    );
  });

  it("a config with only static keys is accepted", () => {
    // config-ok/full-static.yaml exercises registry + all 4 placeholders + task_dir,
    // none of which is a runtime-state field.
    expect(() => loadConfig(fx("config-ok/full-static.yaml"))).not.toThrow();
  });
});

// T006 acceptance (tasks.md): `node -e "import('./core/load-config.mjs')
// .then(m=>m.loadConfig())"` must not throw — i.e. a no-arg call defaults to the
// product config config/workflowhub.yaml and parses it. This proves the shipped
// product config is parseable by Phase 1, not just the test fixtures.
describe("T006 default product config", () => {
  it("does not throw when called with no argument (defaults to config/workflowhub.yaml)", () => {
    expect(() => loadConfig()).not.toThrow();
  });
});
