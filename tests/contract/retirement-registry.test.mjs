import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";

const text = path => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const exists = path => existsSync(new URL(`../../${path}`, import.meta.url));
const moveEntry = destination => {
  const map = JSON.parse(text("docs/architecture/move-map.json"));
  return map.entries.find(entry => entry.destination === destination);
};

describe("ORACLE-RETIREMENT-RECOVERY registry corrections", () => {
  it("binds risk disposition to the real archive decision and current consumer instead of a bare ADR alias", () => {
    const entry = moveEntry("runtime/review/stage-review-disposition.mjs");
    expect(entry).toBeDefined();
    expect(entry.delete_condition).toContain("specs/archive/workflowhub-review-efficiency-20261007/decision-log.md");
    expect(entry.delete_condition).not.toMatch(/ADR-037(?!.*decision-log)/);
    expect(entry.consumer).toContain("terminalAssessmentQuality");
  });

  it("replaces non-existent evidence and false stage consumers with current readable facts", () => {
    const controls = JSON.parse(text("docs/architecture/control-plane-inventory.json"));
    const review = controls.controls.find(entry => entry.id === "review-result-deduplication");
    expect(review.evidence).not.toContain("tests/contract/review-budget-deletion.test.mjs");
    expect(review.evidence).toMatch(/无当前等效测试|original test was removed|原测试已删/);

    const catalog = text("skills/catalog.yaml");
    const decisionMaker = catalog.slice(catalog.indexOf("  - name: decision-maker"), catalog.indexOf("  - name: deep-research"));
    expect(decisionMaker).toContain("used_by_stages: []");
  });
});

describe("ORACLE-RETIREMENT-RECOVERY dead entry retirement and live-chain protection", () => {
  it("retires only the approved dead files and preserves the newly wired change scope", async () => {
    for (const path of ["runtime/evidence/workflow-evolution.mjs", "tools/cli/smoke-local-skill-dispatch.mjs"]) {
      expect(exists(path), `${path} must be retired`).toBe(false);
      await expect(import(`../../${path}`)).rejects.toMatchObject({ code: "ERR_MODULE_NOT_FOUND" });
    }
    for (const path of [
      "workflows/build-code/change-scope.mjs",
      "runtime/interface/runtime-facade.mjs",
      "runtime/interface/config-bootstrap.mjs",
      "runtime/interface/local-skill-resolver.mjs",
      "runtime/review/schemas/result.schema.json",
    ]) expect(exists(path), `${path} is a protected live chain`).toBe(true);

    const research = await import("../../runtime/evidence/research-report.mjs");
    expect(research.RESEARCH_REPORT_REF).toBeUndefined();
    expect(text("runtime/review/ocr-delegation-adapter.mjs")).not.toMatch(/function\s+ocrDiffSourceLine\s*\(/);
    expect(text("tools/cli/onboard-release.mjs")).not.toMatch(/function\s+scopeBase\s*\(/);
  });
});

describe("ORACLE-RETIREMENT-RECOVERY budget declaration retirement", () => {
  it("keeps phase and acceptance totals while making execution policy optional", () => {
    expect(text("workflows/build-plan/steps.json")).toContain("phase_budget");
    expect(text("skills/spec-plan/templates/phase-template.md")).toContain("phase_budget");
    expect(text("skills/spec-plan/templates/phase-template.md")).toContain("acceptance_cost_total");

    for (const path of [
      "workflows/build-code/SKILL.md", "workflows/build-code/steps.json",
      "skills/spec-plan/templates/phase-template.md", "docs/standard-workflow.md",
    ]) {
      const body = text(path);
      expect(body, `${path} still forces execution_budget as a required object`).not.toMatch(/execution_budget\s*=\s*\{/);
      expect(body, `${path} still lists execution_budget and retry_reserve as required records`).not.toMatch(/记 execution_budget、retry_reserve/);
      if (body.includes("execution_budget")) {
        expect(body, `${path} must label execution_budget as optional human guidance`).toMatch(/execution_budget[^\n]{0,100}可选|可选[^\n]{0,100}execution_budget/);
      }
      if (body.includes("retry_reserve")) {
        expect(body, `${path} must merge retry_reserve into optional execution policy`).toMatch(/retry_reserve[^\n]{0,120}(执行策略|可选)|(执行策略|可选)[^\n]{0,120}retry_reserve/);
      }
    }
    expect(text("workflows/build-code/SKILL.md")).toContain("等待");
    expect(text("workflows/build-code/steps.json")).toContain("等待分账");
    expect(text("docs/architecture/move-map.json")).toContain("softBytes");
    expect(text("docs/architecture/move-map.json")).toContain("hardBytes");
  });
});
