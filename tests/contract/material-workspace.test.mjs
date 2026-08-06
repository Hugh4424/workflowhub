import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CURRENT_MATERIAL_FILES,
  inspectMaterialWorkspace,
  replaceMaterialAtomic,
} from "../../runtime/task/material-workspace.mjs";
import * as completionPredicates from "../../runtime/stage/completion-predicates.mjs";

function workspace() {
  const root = mkdtempSync(join(tmpdir(), "workflowhub-materials-"));
  mkdirSync(root, { recursive: true });
  return root;
}

describe("material workspace contract", () => {
  it("keeps the decision log in the same four current material names", () => {
    expect(CURRENT_MATERIAL_FILES).toEqual([
      "decision-log.md",
      "spec.md",
      "plan.md",
      "tasks.md",
    ]);
  });

  it("derives not_ready from missing or empty current materials", () => {
    const root = workspace();
    writeFileSync(join(root, "decision-log.md"), "direction\n");

    const result = inspectMaterialWorkspace(root);

    expect(result.status).toBe("not_ready");
    expect(result.missing).toEqual(["spec.md", "plan.md", "tasks.md"]);
    expect(result.files).toEqual({ "decision-log.md": "direction\n" });
  });

  it("derives working from exactly four readable materials without a current pointer", () => {
    const root = workspace();
    for (const file of CURRENT_MATERIAL_FILES) writeFileSync(join(root, file), `# ${file}\n`);
    writeFileSync(join(root, "materials-current.json"), "legacy pointer must be ignored\n");

    const result = inspectMaterialWorkspace(root);

    expect(result.status).toBe("working");
    expect(result.missing).toEqual([]);
    expect(result.material_digest).toMatch(/^[a-f0-9]{64}$/);
    expect(result.files).not.toHaveProperty("materials-current.json");
  });

  it("replaces only one of the four materials atomically", () => {
    const root = workspace();
    for (const file of CURRENT_MATERIAL_FILES) writeFileSync(join(root, file), `old ${file}\n`);

    const publication = replaceMaterialAtomic(root, "spec.md", "new spec\n");

    expect(publication.file).toBe("spec.md");
    expect(publication.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(readFileSync(join(root, "spec.md"), "utf8")).toBe("new spec\n");
    expect(inspectMaterialWorkspace(root).status).toBe("working");
  });

  it("rejects path traversal and non-material files", () => {
    const root = workspace();

    expect(() => replaceMaterialAtomic(root, "../outside.md", "x")).toThrow(/material file/);
    expect(() => replaceMaterialAtomic(root, "materials-current.json", "x")).toThrow(/material file/);
  });

  it('export:no-consumer removes the obsolete material status projection', () => {
    expect(completionPredicates.deriveMaterialWorkStatus).toBeUndefined();
  });
});
