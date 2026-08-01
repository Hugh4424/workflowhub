import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  evaluateDeletionProof,
  validateDeletionPlan,
} from "../../tools/architecture/deletion-proof.mjs";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function proofFixture() {
  const root = mkdtempSync(join(tmpdir(), "workflowhub-proof-tree-"));
  const evidenceRoot = mkdtempSync(join(tmpdir(), "workflowhub-proof-evidence-"));
  const currentTree = "a".repeat(40);
  for (const path of ["candidate.mjs", "replacement.mjs", "oracle.test.mjs"]) {
    writeFileSync(join(root, path), `${path}\n`, "utf8");
  }
  const binding = (name, subjectPaths) => {
    const ref = `${name}.json`;
    const raw = `${JSON.stringify({
      schema_version: "proof-evidence.v1",
      snapshot_tree: currentTree,
      kind: name,
      subject_paths: subjectPaths,
    })}\n`;
    writeFileSync(join(evidenceRoot, ref), raw, "utf8");
    return { ref, sha256: sha256(raw), snapshot_tree: currentTree };
  };
  const card = {
    id: "DEL-99",
    title: "example removable mechanism",
    candidatePaths: ["candidate.mjs"],
    consumers: [],
    consumerAudit: binding("consumer-audit", ["candidate.mjs"]),
    retainedQualitySemantics: ["example failure remains fail-loud"],
    replacementPath: "replacement.mjs",
    replacementAudit: binding("replacement-audit", ["replacement.mjs"]),
    negativeOracle: {
      path: "oracle.test.mjs",
      evidence: binding("negative-oracle", ["oracle.test.mjs"]),
    },
    faultInjection: ["temp-write", "fsync", "rename", "CAS", "current-pointer"],
    multicaCompatibility: "verified by clean-install fixture",
    legacyTaskImpact: "no active legacy consumer",
    rollbackEvidence: binding("rollback", ["candidate.mjs"]),
    userConfirmation: {
      status: "confirmed",
      evidence: binding("confirmation", ["candidate.mjs"]),
    },
  };
  return {
    card,
    options: { root, evidenceRoot, currentTree },
    cleanup() {
      rmSync(root, { recursive: true, force: true });
      rmSync(evidenceRoot, { recursive: true, force: true });
    },
  };
}

describe("deletion proof contract", () => {
  it("keeps a candidate when any required proof field is missing", () => {
    const fixture = proofFixture();
    try {
      const proof = { ...fixture.card };
      delete proof.rollbackEvidence;
      expect(evaluateDeletionProof(proof, fixture.options)).toMatchObject({
        decision: "KEEP",
        missing: ["rollbackEvidence"],
      });
    } finally {
      fixture.cleanup();
    }
  });

  it("keeps complete technical proof until the user confirms that deletion", () => {
    const fixture = proofFixture();
    try {
      const proof = {
        ...fixture.card,
        userConfirmation: { status: "pending", evidence: null },
      };
      expect(evaluateDeletionProof(proof, fixture.options)).toMatchObject({
        decision: "KEEP",
        missing: ["userConfirmation"],
      });
    } finally {
      fixture.cleanup();
    }
  });

  it("permits DELETE only with complete proof and explicit confirmation", () => {
    const fixture = proofFixture();
    try {
      expect(evaluateDeletionProof(fixture.card, fixture.options)).toEqual({
        decision: "DELETE",
        missing: [],
      });
    } finally {
      fixture.cleanup();
    }
  });

  it("rejects nonexistent paths and stale or forged evidence bindings", () => {
    const fixture = proofFixture();
    try {
      const nonexistent = {
        ...fixture.card,
        candidatePaths: ["missing.mjs"],
      };
      const nonexistentResult = evaluateDeletionProof(nonexistent, fixture.options);
      expect(nonexistentResult.decision).toBe("KEEP");
      expect(nonexistentResult.missing).toContain("candidatePaths");
      const forged = {
        ...fixture.card,
        consumerAudit: { ...fixture.card.consumerAudit, sha256: "0".repeat(64) },
      };
      expect(evaluateDeletionProof(forged, fixture.options)).toMatchObject({
        decision: "KEEP",
        missing: ["consumerAudit"],
      });
      const stale = {
        ...fixture.card,
        replacementAudit: { ...fixture.card.replacementAudit, snapshot_tree: "b".repeat(40) },
      };
      expect(evaluateDeletionProof(stale, fixture.options)).toMatchObject({
        decision: "KEEP",
        missing: ["replacementAudit"],
      });
    } finally {
      fixture.cleanup();
    }
  });

  it("publishes exactly twelve candidate classes and keeps all in Phase 0", () => {
    const plan = JSON.parse(readFileSync("docs/architecture/deletion-plan.json", "utf8"));
    expect(validateDeletionPlan(plan)).toEqual([]);
    expect(plan.candidates).toHaveLength(12);
    expect(plan.candidates.map(({ id }) => id)).toEqual(
      Array.from({ length: 12 }, (_, index) => `DEL-${String(index + 1).padStart(2, "0")}`),
    );
    expect(plan.candidates.every(({ decision }) => decision === "KEEP")).toBe(true);
  });
});
