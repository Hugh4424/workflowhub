// ORACLE-P6-DELIVERY-READSIDE (delivery + reuse half) / ORACLE-P6-CLOSE-COMMITS
// A boolean "delivered: yes" is not a commit; the target commit comes from a
// completed merge, never from a commit action's pre-merge target head. Reuse is
// keyed by command/input/scope and bounded by the verification version; a
// record without typed inputs or without a full version is `unknown`.
import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as claims from "../../runtime/task/delivery-claims.mjs";
import { inspectDeliveryCloseState } from "../../core/task-close.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const T4 = process.env.P6_T4_TASK_ROOT ?? "/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/delivery-quality-code-20261124";
const CLOSE = join(T4, "quality/evidence/close");
const GATES = join(T4, "quality/evidence/gate-results");
const HEX64 = /^[a-f0-9]{64}$/;
const C08 = "/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c08-controlled-upgrade-20261102/quality/evidence/2026-11-03-288-c08-terminal-independent-raw.json";

function gateOriginals() {
  return readdirSync(GATES).filter((name) => name.endsWith(".json")).sort()
    .map((name) => JSON.parse(readFileSync(join(GATES, name), "utf8")));
}

function closeActions() {
  return readdirSync(CLOSE).filter((name) => /-close-action\.json$/.test(name)).sort()
    .map((name) => JSON.parse(readFileSync(join(CLOSE, name), "utf8")));
}

describe("deliveryCommit reads a commit, never a boolean", () => {
  it("takes source_commit from the completed commit and leaves target null without a completed merge", () => {
    const commit = claims.deliveryCommit({ actions: closeActions() });
    expect(commit.source_commit).toBe("91e607b8099ded31eb9d0f0ac1d6a41051992993");
    expect(commit.target_commit).toBeNull();
    expect(commit.target_commit_reason).toBe("no-completed-merge");
    expect(commit.delivered).toBe(true);
  });

  it("takes target_commit from the completed merge, not from the commit action's target head", () => {
    const merge = "1".repeat(40), preMerge = "2".repeat(40), source = "3".repeat(40);
    const commit = claims.deliveryCommit({ actions: [
      { operation: "commit", status: "completed", source_head: source, target_head: preMerge },
      { operation: "merge", status: "completed", source_head: source, target_head: merge },
    ] });
    expect(commit.source_commit).toBe(source);
    expect(commit.target_commit).toBe(merge);
    expect(commit.target_commit_reason).toBeNull();
  });

  it("keeps a boolean-only record as an un-obtained commit", () => {
    const commit = claims.deliveryCommit({ actions: [{ delivery_committed: true }] });
    expect(commit.source_commit).toBeNull();
    expect(commit.target_commit).toBeNull();
    expect(commit.delivered).toBe(false);
    expect(commit.target_commit_reason).toBe("no-commit-action");
  });
});

describe("evidenceReuseKey bounds reuse by command, inputs and version", () => {
  it("cannot reuse any task-4 gate original: none carries typed inputs", () => {
    const originals = gateOriginals();
    expect(originals.length).toBe(114);
    let withCwd = 0;
    for (const original of originals) {
      if (typeof original.cwd === "string" && original.cwd !== "") withCwd += 1;
      const reuse = claims.evidenceReuseKey({
        argv: original.argv, cwd: original.cwd, inputs: original.inputs,
        scope: original.material_files, tool: original.capture_route ?? "verify", observed_at: original.started_at,
      });
      expect(reuse.key, "key").toBeNull();
      expect(reuse.reuse, "reuse").toBe("unknown");
      expect(reuse.reasons, "reasons").toContain("missing:inputs");
      expect(reuse.reasons.join(" "), "no false cwd claim").not.toContain("missing:cwd");
    }
    expect(withCwd).toBe(114);
  });

  it("excludes started_at/ended_at from the key", () => {
    const base = { argv: ["node", "x.mjs"], cwd: "/tmp", inputs: [{ path: "a.md", sha256: "a".repeat(64) }], scope: ["a.md"], tool: "verify" };
    const first = claims.evidenceReuseKey({ ...base, observed_at: "2026-01-01T00:00:00Z" });
    const second = claims.evidenceReuseKey({ ...base, observed_at: "2026-06-01T00:00:00Z" });
    expect(first.key).toMatch(HEX64);
    expect(first.key).toBe(second.key);
    expect(first.observed_at).toBe("2026-01-01T00:00:00Z");
  });

  it("reuses only same key and same full verification version", () => {
    const version = { material_sha256: "b".repeat(64), source_commit: "c".repeat(40), target_commit: null, environment_sha256: "d".repeat(64) };
    const record = { argv: ["node", "x.mjs"], cwd: "/tmp", inputs: [{ path: "a.md", sha256: "a".repeat(64) }], scope: ["a.md"], tool: "verify", version };
    const first = claims.evidenceReuseKey(record);
    const again = claims.evidenceReuseKey({ ...record, previous: first });
    expect(again.reuse).toBe("true");
    expect(again.still_applicable).toBe(true);
    const moved = claims.evidenceReuseKey({ ...record, version: { ...version, material_sha256: "e".repeat(64) }, previous: first });
    expect(moved.reuse).toBe("false");
    expect(moved.reasons.join(" ")).toContain("material");
    // The prior record covered two inputs; the current one covers only one, so
    // the untouched item is a named partial, not a silent reuse.
    const wider = claims.evidenceReuseKey({ ...record, scope: ["a.md", "b.md"] });
    const narrowed = claims.evidenceReuseKey({ ...record, scope: ["a.md"], previous: wider });
    expect(narrowed.reuse).toBe("partial");
    expect(narrowed.affected).toEqual(expect.arrayContaining(["b.md"]));
  });

  it("keeps the c08 terminal original unreusable: three of four version fields are absent", () => {
    const raw = JSON.parse(readFileSync(C08, "utf8"));
    const proof = raw.business_effect.proofs[0];
    const reuse = claims.evidenceReuseKey({
      argv: null, cwd: null, inputs: proof.inputs, scope: proof.inputs.map((item) => item.path), tool: "terminal-independent",
      version: { material_sha256: null, source_commit: null, target_commit: null, environment_sha256: null },
    });
    expect(reuse.key).toBeNull();
    expect(reuse.verification_version).toBeNull();
    expect(reuse.reuse).toBe("unknown");
  });
});

describe("close facts carry the two commits", () => {
  it("writes source_commit / target_commit / reason / delivered for task-4", async () => {
    const state = await inspectDeliveryCloseState({ taskDir: T4, planRef: join(CLOSE, "2026-11-26-001-close-plan.json") });
    expect(state.facts.source_commit).toBe("91e607b8099ded31eb9d0f0ac1d6a41051992993");
    expect(state.facts.target_commit).toBeNull();
    expect(state.facts.target_commit_reason).toBe("no-completed-merge");
    expect(state.facts.delivered).toBe(true);
    expect(state.facts.delivery_committed).toBe(true);
  });
});
