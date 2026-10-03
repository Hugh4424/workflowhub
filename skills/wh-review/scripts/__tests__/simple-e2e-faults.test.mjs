import { mkdtempSync, realpathSync, rmSync, mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {providerMaterialEntries,providerMaterialPath} from "../../../../runtime/review/provider-material-projection.mjs";
import { runSimpleReview } from "../simple-review-runner.mjs";
import { createFileOnce } from "../../../../runtime/interface/safe-write.mjs";

const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function input() {
  const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "wh-review-simple-e2e-")));
  roots.push(attachmentRoot);
  return { stage: "build-plan", materials: { raw_requirement:"owned requirement",approved_spec:"current bytes",acceptance_criteria:"AC-1: behavior",draft_plan:"owned implementation",draft_tasks:"T001: behavior" } };
}

describe("simple review transport and recovery facts", () => {
  it("awaits immutable evidence writes and exposes failures", async () => {
    const root=realpathSync(mkdtempSync(join(tmpdir(),"audit-evidence-current-")));roots.push(root);
    await createFileOnce(root,"audit.json","{}\n");expect(readFileSync(join(root,"audit.json"),"utf8")).toBe("{}\n");
    await expect(createFileOnce(root,"audit.json","changed\n")).rejects.toMatchObject({code:"RECORD_CONFLICT"});
    await expect(createFileOnce(join(root,"missing"),"audit.json","{}\n")).rejects.toMatchObject({code:"ENOENT"});
  });

  it("records malformed provider output as a provider failure while retaining valid sibling findings", async () => {
    const request=input();
    const entries=providerMaterialEntries(request);const index=entries.findIndex(([key])=>key==="approved_spec");const findingPath=providerMaterialPath("approved_spec",index,request.materials.approved_spec);
    const result = await runSimpleReview(request, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot: roots.at(-1), command: ["unused"] }),
      resolveRoute: () => ({ initial: ["model-a", "model-b"], mode: "single_round" }),
      selectProviders: () => ({ providers: ["model-a", "model-b"] }),
      client: { async runGroup() {
        return { runtimeId: "runtime", outcome: "partial", providers: [
          { provider: "model-a", status: "completed", identity: { provider: "model-a" }, error: null, output: "not-json", timing: null, usage: null },
          { provider: "model-b", status: "completed", identity: { provider: "model-b" }, error: null, output: JSON.stringify({ findings: [{ severity: "minor", path: findingPath, line: 1, issue: "gap", root_cause:"current bytes omit behavior", recommendation: "fix", evidence_kind:"direct", evidence:"current bytes" }] }), timing: null, usage: null },
        ] };
      } },
    });
    expect(result).toMatchObject({ status: "available", provider_results: [{ status: "failed", error: { code: "OUTPUT_INVALID" } }, { status: "completed" }] });
    expect(result.findings).toHaveLength(1);
  });

  it("returns an honest unavailable result when the review route cannot load", async () => {
    const result = await runSimpleReview(input(), { loadConfig: () => { throw new Error("route unavailable"); } });
    expect(result).toMatchObject({ status: "unavailable", error: { code: "ROUTE_UNAVAILABLE" }, provider_results: [], findings: [] });
  });
});
