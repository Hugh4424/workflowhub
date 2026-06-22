import { describe, it, expect, beforeAll } from "vitest";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { writeFileSync, mkdtempSync } from "node:fs";
import os from "node:os";
import { runKernel } from "../kernel.mjs"; // does not exist yet — RED
import { loadConfig } from "../load-config.mjs";
import { resolveComponent } from "../resolve-component.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../..");
const fixturesDir = resolve(repo, "fixtures");
const componentsDir = resolve(fixturesDir, "components");

// Build a temporary config YAML with absolute paths at test setup time.
// Written to os.tmpdir() so fixtures/ in the repo is never polluted.
let configPath;

function makeKernelConfig(entries) {
  const lines = ["registry:"];
  for (const e of entries) {
    lines.push(`  - component_id: ${e.component_id}`);
    lines.push(`    workflow: ${e.workflow}`);
    lines.push(`    path: ${e.path}`);
  }
  return lines.join("\n") + "\n";
}

beforeAll(() => {
  const tmpConfigDir = mkdtempSync(join(os.tmpdir(), "wfh-kernel-"));
  configPath = join(tmpConfigDir, "kernel-runtime-abs.yaml");
  writeFileSync(
    configPath,
    makeKernelConfig([
      {
        component_id: "dummy-ok",
        workflow: "test-ok",
        path: resolve(componentsDir, "dummy-ok.mjs"),
      },
      {
        component_id: "dummy-other",
        workflow: "test-other",
        path: resolve(componentsDir, "dummy-other.mjs"),
      },
      {
        component_id: "dummy-fail",
        workflow: "test-fail",
        path: resolve(componentsDir, "dummy-fail.mjs"),
      },
      {
        component_id: "dummy-badjson",
        workflow: "test-badjson",
        path: resolve(componentsDir, "dummy-badjson.mjs"),
      },
      {
        component_id: "dummy-missing-id",
        workflow: "test-missing-id",
        path: resolve(componentsDir, "dummy-missing-id.mjs"),
      },
      {
        component_id: "expect-X",
        workflow: "test-wrong-id",
        path: resolve(componentsDir, "dummy-wrong-id.mjs"),
      },
    ]),
    "utf8",
  );
});

// Scenario 1: invoke a valid component, read back component_id.
describe("kernel scenario 1: valid component returns component_id", () => {
  it("returns a result containing component_id matching the invoked component", async () => {
    const result = await runKernel(configPath, "test-ok");
    expect(result).toHaveProperty("component_id", "dummy-ok");
  });
});

// Scenario 2: swap component via config — kernel code is unchanged, component_id changes.
describe("kernel scenario 2: swapping component changes component_id (no kernel code change)", () => {
  it("returns component_id of the second component when workflowId resolves to it", async () => {
    const result = await runKernel(configPath, "test-other");
    expect(result).toHaveProperty("component_id", "dummy-other");
  });

  it("the two component_ids are distinct — proves swap is real, not a fixed value", async () => {
    const r1 = await runKernel(configPath, "test-ok");
    const r2 = await runKernel(configPath, "test-other");
    expect(r1.component_id).not.toBe(r2.component_id);
  });
});

// Scenario 3: FR-CORE-004 — component exits non-zero → kernel reports failure.
describe("kernel scenario 3: non-zero exit code → failure (FR-CORE-004)", () => {
  it("rejects or returns a failure indicator when the component exits non-zero", async () => {
    // runKernel may throw or return an object with a failure flag — either is valid
    // as long as it does NOT silently succeed.
    await expect(runKernel(configPath, "test-fail")).rejects.toThrow();
  });
});

// Scenario 4: FR-CORE-004 — component writes invalid JSON → kernel reports failure.
describe("kernel scenario 4: invalid JSON output → failure (FR-CORE-004)", () => {
  it("rejects or returns a failure indicator when the component writes non-JSON output", async () => {
    await expect(runKernel(configPath, "test-badjson")).rejects.toThrow();
  });
});

// Scenario 5: FR-CORE-002 / D14 — component output missing component_id → kernel reports failure.
describe("kernel scenario 5: output missing component_id → failure (FR-CORE-002 / D14)", () => {
  it("rejects when component exits 0 but output has no component_id field", async () => {
    await expect(runKernel(configPath, "test-missing-id")).rejects.toThrow();
  });
});

// Scenario 6: FR-CORE-002 / D14 — component output has wrong component_id → kernel reports failure.
describe("kernel scenario 6: output component_id mismatch → failure (FR-CORE-002 / D14)", () => {
  it("rejects when component exits 0 but output component_id does not match registry entry", async () => {
    await expect(runKernel(configPath, "test-wrong-id")).rejects.toThrow();
  });
});

// Scenario 7: Shipped default config shape-only contract (M2 / AC1 evidence).
// config/workflowhub.yaml is a shape-only skeleton — it has component_id + workflow
// (the M2-minimum registry fields per plan.md lines 90-91 / decision 14) but no
// runtime path, because M2 forbids host-inferred paths (AC8 / FR-CORE-003) and ships
// no component scripts. "定位" (locate) succeeds; dispatch fails as expected.
describe("kernel scenario 7: shipped config shape-only — locate PASS, dispatch fails (M2 contract)", () => {
  const shippedConfigPath = resolve(dirname(fileURLToPath(import.meta.url)), "../../config/workflowhub.yaml");

  it("shipped config resolves noop entry with component_id and workflow (shape-only locate)", () => {
    const config = loadConfig(shippedConfigPath);
    const entry = resolveComponent(config, "demo");
    expect(entry.component_id).toBe("noop");
    expect(entry.workflow).toBe("demo");
  });

  it("shipped config dispatch fails (no runtime path — M2 defers dispatch wiring to M3+)", async () => {
    await expect(runKernel(shippedConfigPath, "demo")).rejects.toThrow();
  });
});
