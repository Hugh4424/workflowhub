import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
// The retirement oracle is what a real Node process does on the old path, not how the
// bundler rewrites the failed import, so the module-not-found proof runs out of process.
const nodeImport = path => spawnSync(process.execPath, ["--input-type=module", "-e", `import(${JSON.stringify(`./${path}`)})`], { cwd: repoRoot, encoding: "utf8" });

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
    // TCR: tcr-retirement-registry-consumer.md — the consumer is the real named wiring,
    // not a neighbouring function that only builds the terminal assessment row.
    const stageRuntime = text("tools/cli/stage-runtime.mjs");
    for (const symbol of ["deriveSeriousReviewPause", "validateRiskAcceptance"]) {
      expect(entry.consumer, `${symbol} must be the registered consumer`).toContain(symbol);
      expect(stageRuntime, `${symbol} named import`).toMatch(new RegExp(`import\\s*\\{[^}]*\\b${symbol}\\b[^}]*\\}\\s*from\\s*["']\\.\\./\\.\\./runtime/review/stage-review-disposition\\.mjs["']`));
    }
    expect(stageRuntime, "deriveSeriousReviewPause call site").toMatch(/const pause=deriveSeriousReviewPause\(/);
    expect(stageRuntime, "validateRiskAcceptance call site").toMatch(/validateRiskAcceptance\(\{acceptance,pause\}\)/);
    expect(entry.module_consumers).toEqual(["tools/cli/stage-runtime.mjs"]);
  });

  it("replaces non-existent evidence and false stage consumers with current readable facts", () => {
    const controls = JSON.parse(text("docs/architecture/control-plane-inventory.json"));
    const review = controls.controls.find(entry => entry.id === "review-result-deduplication");
    expect(review.evidence).not.toContain("tests/contract/review-budget-deletion.test.mjs");
    expect(review.evidence).toMatch(/无当前等效测试|original test was removed|原测试已删/);

    const catalog = text("skills/catalog.yaml");
    const decisionMaker = catalog.slice(catalog.indexOf("  - name: decision-maker"), catalog.indexOf("  - name: deep-research"));
    // P3/5f192573 wired decision-maker into make-decision's stage skill deps, so the
    // truthful registration is [make-decision]; an empty list would contradict that
    // manifest and re-create the drift this card removes.
    expect(decisionMaker).toContain("used_by_stages: [make-decision]");
    expect(text("workflows/make-decision/skill-deps.yaml"))
      .toMatch(/- name: decision-maker\s*\n\s*path: skills\/decision-maker\/SKILL\.md/);
  });
});

describe("ORACLE-RETIREMENT-RECOVERY dead entry retirement and live-chain protection", () => {
  it("retires only the approved dead files and preserves the newly wired change scope", async () => {
    for (const path of ["runtime/evidence/workflow-evolution.mjs", "tools/cli/smoke-local-skill-dispatch.mjs"]) {
      expect(exists(path), `${path} must be retired`).toBe(false);
      const probe = nodeImport(path);
      expect(probe.status, `${path} must fail on the old path: ${probe.stderr}`).not.toBe(0);
      expect(probe.stderr, `${path} must report ERR_MODULE_NOT_FOUND`).toContain("ERR_MODULE_NOT_FOUND");
    }
    for (const path of [
      "workflows/build-code/change-scope.mjs",
      "runtime/interface/runtime-facade.mjs",
      "runtime/distribution/config-bootstrap.mjs",
      "runtime/adapters/local-skill-resolver.mjs",
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
    // The disk upper bound is code, not registry prose: the protected tokens live in
    // runtime/evidence/disk-budget.mjs, and the registry must keep its real consumers.
    const diskBudget = text("runtime/evidence/disk-budget.mjs");
    for (const token of ["softBytes", "hardBytes", "hardFiles"]) expect(diskBudget, token).toContain(token);
    const diskEntry = moveEntry("runtime/evidence/disk-budget.mjs");
    expect(diskEntry.status).toBe("retain");
    expect(diskEntry.module_consumers).toEqual(expect.arrayContaining(["runtime/task/task-handle.mjs"]));
  });
});
