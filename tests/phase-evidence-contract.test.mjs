import { describe, expect, it } from "vitest";
import { validatePhaseEvidence } from "../core/phase-evidence-contract.mjs";
import { admitPhaseCommand } from "../core/public-cli.mjs";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const hash = "a".repeat(64); const oid = "b".repeat(40);
const snapshot = { ref: "evidence/snapshots/x.json", hash, tree_oid: oid };
const subject = { schema_version: "1.0.0", phase_id: "phase-0", task_id: "task", release: { ref: "releases/x.json", hash }, baseline: snapshot, implementation: snapshot, allowed_files: ["core/a.mjs"], upstream: null };
describe("phase evidence closed contracts", () => {
  it("validates independent positive and malicious JSON fixtures", () => {
    const root = new URL("./fixtures/phase-evidence-v1/", import.meta.url); const load = (name) => JSON.parse(readFileSync(new URL(name, root)));
    expect(() => validatePhaseEvidence("subject", load("subject.valid.json"))).not.toThrow();
    expect(() => validatePhaseEvidence("diff", load("diff.valid.json"))).not.toThrow();
    expect(() => validatePhaseEvidence("result", load("result.valid.json"))).not.toThrow();
    expect(() => validatePhaseEvidence("subject", load("subject.malicious-selector.json"))).toThrow(/contract invalid/);
    expect(() => validatePhaseEvidence("diff", load("diff.malicious-path.json"))).toThrow(/contract invalid/);
    expect(() => validatePhaseEvidence("result", load("result.malicious-latest.json"))).toThrow(/contract invalid/);
  });
  it("binds every independent fixture by exact byte hash in the contract set", () => {
    const registry = JSON.parse(readFileSync(new URL("../contracts/contract-set.2026-07-16.1.json", import.meta.url)));
    for (const contract of registry.contracts) for (const fixture of contract.fixtures) {
      const raw = readFileSync(new URL(`../${fixture.path}`, import.meta.url));
      expect(createHash("sha256").update(raw).digest("hex"), fixture.path).toBe(fixture.sha256);
    }
  });
  it("accepts exact subject and rejects selectors/unknown fields", () => {
    expect(validatePhaseEvidence("subject", subject)).toBe(subject);
    expect(() => validatePhaseEvidence("subject", { ...subject, commit: oid })).toThrow(/additional properties|contract invalid/i);
    expect(() => validatePhaseEvidence("subject", { ...subject, allowed_files: ["/tmp/a"] })).toThrow(/contract invalid/i);
  });
  it("admits only stdin public input before runtime bootstrap", () => {
    expect(admitPhaseCommand(["phase", "subject", "--project=p", "--task=t", "--phase-id=phase-0", "--input=@-"]).input).toBe("@-");
    expect(() => admitPhaseCommand(["phase", "diff", "--project=p", "--task=t", "--phase-id=phase-0", "--input=/tmp/payload"])).toThrow(/required/);
    expect(() => admitPhaseCommand(["phase", "diff", "--cwd=/tmp"])).toThrow(/forbidden/);
  });
});
