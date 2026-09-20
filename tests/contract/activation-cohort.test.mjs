import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { activationManifestFields, resolveCard01Activation } from "../../tools/cli/task-bootstrap.mjs";
import { readActivationCohort, resolveTopology } from "../../runtime/task/task-topology.mjs";

const roots = [];
const commit = "a".repeat(40);

function root() {
  const value = mkdtempSync(join(tmpdir(), "workflowhub-activation-"));
  roots.push(value);
  return value;
}

function writeMarker(storageRoot, value) {
  const directory = join(storageRoot, "activation");
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, "card-01.json"), typeof value === "string" ? value : `${JSON.stringify(value)}\n`);
}

const active = () => ({
  schema_version: "card-01-activation.v1",
  capability_acceptance: { ref: "quality/evidence/capability.json", sha256: "b".repeat(64) },
  release_marker: { commit, channel: "main" },
  entry_consumption: { evidence_ref: "quality/evidence/entry.json", observed_at: "2026-09-20T00:00:00.000Z" },
  activated_at: "2026-09-20T00:00:00.000Z",
});

afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

describe("CARD-01 activation cohort", () => {
  it("requires all three activation facts before selecting post", () => {
    const storageRoot = root();
    expect(resolveCard01Activation({ storageRoot, fallbackCommit: commit })).toMatchObject({ cohort: "pre", diagnostic: null });
    writeMarker(storageRoot, active());
    expect(resolveCard01Activation({ storageRoot, fallbackCommit: "c".repeat(40) })).toMatchObject({ cohort: "post", entry_release_commit: commit, diagnostic: null });
  });

  it.each([
    ["empty", ""],
    ["invalid-json", "{"],
    ["partial", { ...active(), entry_consumption: {} }],
    ["empty-capability-ref", { ...active(), capability_acceptance: { ...active().capability_acceptance, ref: " " } }],
  ])("fails safe to pre for %s markers", (_label, marker) => {
    const storageRoot = root();
    writeMarker(storageRoot, marker);
    expect(resolveCard01Activation({ storageRoot, fallbackCommit: commit })).toMatchObject({ cohort: "pre", diagnostic: expect.any(String) });
  });

  it("freezes exactly three cohort fields and preserves in-flight pre topology", () => {
    const storageRoot = root();
    writeMarker(storageRoot, active());
    expect(activationManifestFields({ storageRoot, fallbackCommit: commit, now: () => new Date("2026-09-20T00:00:00.000Z") }))
      .toEqual({ activation_cohort: "post", activation_cohort_frozen_at: "2026-09-20T00:00:00.000Z", entry_release_commit: commit });
    expect(readActivationCohort({})).toBe("pre");
    expect(resolveTopology({ task_type: "普通任务", activation_cohort: "pre" }))
      .toEqual(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
    expect(resolveTopology({ task_type: "普通任务", activation_cohort: "post" }))
      .toEqual(["make-decision", "build-plan", "build-code", "verify-code"]);
  });
});
