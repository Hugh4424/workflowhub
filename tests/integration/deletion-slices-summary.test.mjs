import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const planPath = resolve(root, "docs/architecture/deletion-plan.json");
const auditPath = resolve(root, "evidence/phase-5/deletion-consumer-audit.json");

describe("Phase 5 deletion disposition", () => {
  it("keeps every candidate with an active consumer or incomplete proof", () => {
    const plan = JSON.parse(readFileSync(planPath, "utf8"));
    const audit = JSON.parse(readFileSync(auditPath, "utf8"));
    expect(plan.candidates).toHaveLength(12);
    expect(audit.candidates).toHaveLength(12);
    for (const card of plan.candidates) {
      const audited = audit.candidates.find((item) => item.id === card.id);
      expect(audited?.decision).toBe("KEEP");
      expect(card.decision).toBe("KEEP");
      expect(card.agentDecision?.status).toBe("recorded_keep");
      expect(card.userConfirmation).toBeUndefined();
      expect(card.candidatePaths.every((path) => existsSync(resolve(root, path)))).toBe(true);
      expect(audited.consumer_refs.length).toBeGreaterThan(0);
      expect(audited.consumer_refs.every((path) => existsSync(resolve(root, path)))).toBe(true);
    }
  });

  it("runs the explicit confirmation gate without performing deletion", () => {
    const output = execFileSync("node", ["tools/architecture/deletion-proof.mjs", "--all", "--require-user-confirmation"], { cwd: root }).toString();
    expect(output).toMatch(/12 KEEP, 0 DELETE/);
  });
});
