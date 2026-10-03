import {mkdtempSync,realpathSync,readFileSync,writeFileSync,rmSync} from "node:fs";import {tmpdir} from "node:os";import {join} from "node:path";
import {afterEach,describe,expect,it} from "vitest";
import {buildReviewMaterials,canonicalMaterialManifest,validateAuthorityMap,validateBuildCodeAcceptanceMap,validateVerifyAcceptanceSummary,classifyReviewableCodePath,selectVerifyCodeDiffPaths,verifyCodeDiffDeliveryForPath,reviewInstructionsFor,materialAllowlistForRule,redactProviderHostPaths} from "../../skills/wh-review/scripts/review-materials.mjs";
const roots=[];afterEach(()=>{for(const root of roots.splice(0))rmSync(root,{recursive:true,force:true});});
function root(){const r=realpathSync(mkdtempSync(join(tmpdir(),"review-material-current-")));roots.push(r);return r;}
const verify=()=>({changed_files:"src/app.mjs",implementation_assessment:"actual code",test_context:"owned test",open_risks:"unknown"});
function packet(input){const r=root();return buildReviewMaterials({attachmentRoot:r,reviewDataRoot:r,...input});}
describe("current packet material contracts",()=>{
 it("delivers complete implementation material, actual diff and AC bytes",()=>{const r=root(),bytes="x".repeat(600*1024),diff="diff --git a/src/app.mjs b/src/app.mjs\n@@ -1 +1 @@\n+ACTUAL_DIFF\n";writeFileSync(join(r,"owned.diff"),diff);const b=buildReviewMaterials({attachmentRoot:r,stage:"verify-code",materials:{...verify(),implementation_assessment:bytes,acceptance_criteria:"AC-1: actual behavior"},source:{diffPath:join(r,"owned.diff"),capturedHead:"a".repeat(40),baseCommit:"b".repeat(40)}});try{expect(readFileSync(join(b.bundleRoot,"changes.diff"),"utf8")).toBe(diff);expect(readFileSync(join(b.bundleRoot,"requirements/acceptance_criteria.md"),"utf8")).toBe("AC-1: actual behavior");const entry=b.deliveryManifest.find(e=>e.path.includes("implementation_assessment"));expect(readFileSync(join(b.bundleRoot,entry.path),"utf8")).toBe(bytes);expect(b.deliveryManifest.some(e=>e.path==="skills/review/SKILL.md")).toBe(true);expect(b.deliveryManifest.some(e=>e.path==="contracts/provider-protocol.md")).toBe(true);}finally{b.dispose();}});
 it("drops unknown keys visibly but rejects retired inputs",()=>{const b=packet({stage:"verify-code",materials:{...verify(),acceptance_criterias:"near miss"}});try{expect(b.discarded_facts).toEqual([expect.objectContaining({dropped_key:"acceptance_criterias",reason:"not_in_stage_material_allowlist"})]);}finally{b.dispose();}expect(()=>packet({stage:"build-code",reviewScope:"phase",materials:{phase_coverage:"retired"}})).toThrow(/MATERIAL_FORBIDDEN/);expect(()=>packet({stage:"verify-code",materials:Object.create({changed_files:"inherited"})})).toThrow(/plain object/);});
 it("assembles the real post Phase body and pointer index",()=>{const materials={raw_requirement:"R-1: current behavior",acceptance_criteria:"AC-1: actual",draft_spec:"AC-1: actual",phase_authorities:{"phases/P1.md":"# Phase P1\nphysical write set: src/app.mjs\n"},phase_index:"## Execution Index\n| phase | authority ref | semantic anchor | write set | dependency | consumer |\n| --- | --- | --- | --- | --- | --- |\n| P1 | phases/P1.md | phase-p1 | src/app.mjs | none | build-code |\n"};const b=packet({stage:"build-plan",activationCohort:"post",materials});try{const text=b.deliveryManifest.map(e=>readFileSync(join(b.bundleRoot,e.path),"utf8")).join("\n");expect(text).toContain("physical write set: src/app.mjs");expect(text).toContain("## Execution Index");expect(text).toContain("AC-1: actual");}finally{b.dispose();}});
 it("keeps paired direction prompts and actual declared reviewer lenses",()=>{const red=reviewInstructionsFor("make-decision","direction",false,null,null,"reconstruct","red"),blue=reviewInstructionsFor("make-decision","direction",false,null,null,"reconstruct","blue");expect(red).not.toBe(blue);expect(red).toContain("red");expect(blue).toContain("blue");expect(red).toContain("skills/intake-decision-review/SKILL.md");expect(red).toContain("no proposed solution");});
 it("redacts host paths only in the provider view",()=>{const original={path:"/Users/owned/private/a.mjs",text:"original"};expect(redactProviderHostPaths(original).path).not.toContain("/Users/owned/private");expect(original.path).toBe("/Users/owned/private/a.mjs");});
  it("keeps canonical manifests deterministic and rejects generic AC maps", () => {
    expect(canonicalMaterialManifest([
      { path: "b.json", bytes: 2, sha256: "b" },
      { path: "a.json", bytes: 1, sha256: "a" },
    ])).toBe(JSON.stringify([
      { path: "a.json", bytes: 1, sha256: "a" },
      { path: "b.json", bytes: 2, sha256: "b" },
    ]));
    const valid = {
      acceptance_ids: ["AC-1", "AC-2"],
      entries: [
        { id: "AC-1", change_ids: ["C-1"], implementation: "implementation for AC-1", verification: "test for AC-1", implementation_anchor_ids: ["impl-1"], verification_anchor_ids: ["test-1"] },
        { id: "AC-2", change_ids: ["C-2"], implementation: "implementation for AC-2", verification: "test for AC-2", implementation_anchor_ids: ["impl-2"], verification_anchor_ids: ["test-2"] },
      ],
    };
    expect(() => validateBuildCodeAcceptanceMap(valid)).not.toThrow();
    expect(() => validateBuildCodeAcceptanceMap({
      ...valid,
      entries: valid.entries.map((entry) => ({ ...entry, implementation: "same", verification: "same", change_ids: [] })),
    })).toThrow(/generic mapping is not allowed/);
  });

  it("rejects one shared proving anchor across multiple AC evidence entries", () => {
    const anchor = { id: "shared", path: "runtime/interface/run-command.mjs", start_line: 220, end_line: 235, role: "implementation", reason: "shared fixture anchor" };
    const map = {
      state: "complete",
      summary: "fixture evidence map",
      entries: [
        { id: "AC-002", subject: "first", rationale: "first", disposition: "complete", anchors: [anchor] },
        { id: "AC-009", subject: "second", rationale: "second", disposition: "complete", anchors: [{ ...anchor, id: "shared-again" }] },
      ],
    };
    expect(() => validateAuthorityMap("evidence_map", map)).toThrow(/(?:share|overlap) one proving anchor/i);
  });

  it("rejects an empty verify acceptance summary before provider dispatch", () => {
    expect(() => validateVerifyAcceptanceSummary(JSON.stringify({ criteria: [] })))
      .toThrow(/empty criteria list/);
    expect(() => validateVerifyAcceptanceSummary("当前验收材料已准备"))
      .toThrow(/must name current ACs/);
    expect(validateVerifyAcceptanceSummary(JSON.stringify({ criteria: [
      { acceptance_criterion_id: "AC-01", status: "incomplete", actual_outcome: "证据不足" },
    ] }))).toBe(true);
  });

  it("rejects a verify summary copied from an older AC set", () => {
    const oldIds = Array.from({ length: 26 }, (_, index) => `AC-${String(index + 1).padStart(2, "0")}`);
    const currentIds = Array.from({ length: 32 }, (_, index) => `AC-${String(index + 1).padStart(2, "0")}`);
    expect(() => validateVerifyAcceptanceSummary(oldIds.join("\n"), { expectedCriterionIds: currentIds }))
      .toThrow(/does not match current spec AC set/);
    expect(validateVerifyAcceptanceSummary(currentIds.join("\n"), { expectedCriterionIds: currentIds })).toBe(true);
  });

  it("does not treat AC range prose as a canonical criterion id", () => {
    expect(() => validateVerifyAcceptanceSummary(JSON.stringify({ criteria: [
      { id: "AC-01..32", status: "incomplete" },
    ] }))).toThrow(/must identify ACs/);
    expect(() => validateVerifyAcceptanceSummary("AC-01..32", {
      expectedCriterionIds: ["AC-01", "AC-02"],
    })).toThrow(/must name current ACs/);
  });

  it("accepts the same typed AC identifiers used by integration review", () => {
    expect(validateVerifyAcceptanceSummary(JSON.stringify({ criteria: [
      { acceptance_criterion_id: "AC-E2E-001", status: "incomplete", actual_outcome: "证据不足" },
    ] }))).toBe(true);
  });

  it("keeps verify-code implementation and test source provider-visible across project roots", () => {
    expect(verifyCodeDiffDeliveryForPath("frontend/src/workbench-screen.tsx")).toBe("included");
    expect(verifyCodeDiffDeliveryForPath("paperbuilder/application/position_comments.py")).toBe("included");
    expect(verifyCodeDiffDeliveryForPath("tests/test_position_comments_application.py")).toBe("included");
    expect(verifyCodeDiffDeliveryForPath("specs/task/plan.md")).toBe("summary");
  });

  it("classifies external implementation and test paths while excluding generated sources", () => {
    expect(classifyReviewableCodePath("frontend/src/workbench-screen.tsx")).toBe("implementation");
    expect(classifyReviewableCodePath("tests/test_position_comments_application.py")).toBe("test");
    expect(classifyReviewableCodePath("vendor/adapter.py")).toBeNull();
    expect(classifyReviewableCodePath("frontend/dist/app.min.js")).toBeNull();
    expect(classifyReviewableCodePath("generated/client.generated.ts")).toBeNull();
    expect(verifyCodeDiffDeliveryForPath("vendor/adapter.py")).toBe("summary");
    expect(verifyCodeDiffDeliveryForPath("frontend/dist/app.min.js")).toBe("summary");
  });

  it("selects every reviewable implementation and test diff above 486777B", () => {
    const sections = [
      { path: "tests/z.test.ts", bytes: Buffer.alloc(260 * 1024) },
      { path: "paperbuilder/application/core.py", bytes: Buffer.alloc(260 * 1024) },
      { path: "frontend/src/secondary.ts", bytes: Buffer.alloc(80 * 1024) },
      { path: "vendor/generated.py", bytes: Buffer.alloc(1) },
      { path: "README.md", bytes: Buffer.alloc(1) },
    ];
    expect(sections.reduce((total, section) => total + section.bytes.length, 0)).toBeGreaterThan(486777);
    expect([...selectVerifyCodeDiffPaths(sections, "verify-code")]).toEqual([
      "tests/z.test.ts",
      "paperbuilder/application/core.py",
      "frontend/src/secondary.ts",
    ]);
    expect(selectVerifyCodeDiffPaths(sections, "build-code")).toBeNull();
  });

});
