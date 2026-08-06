import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { dispatchStageSkill, preflightStageSkills } from "../../runtime/stage/stage-skill-runtime.mjs";

const roots = [];
const outcome = Object.freeze({
  outcome_ref: "evidence/outcome.json",
  outcome_hash: "a".repeat(64),
  snapshot_tree: "b".repeat(40),
});
afterEach(() => { for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true }); });

function fixture({ invocation = "conditional" } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-dispatch-"));
  roots.push(root);
  fs.mkdirSync(path.join(root, "skills/demo"), { recursive: true });
  fs.mkdirSync(path.join(root, "workflows/stage"), { recursive: true });
  fs.writeFileSync(path.join(root, "skills/demo/SKILL.md"), "# local\n");
  fs.writeFileSync(path.join(root, "skills/demo/skill-bundle.json"), JSON.stringify({ schema_version: 1, skill: "demo", files: ["SKILL.md"] }));
  fs.writeFileSync(path.join(root, "workflows/stage/skill-deps.yaml"), `stage: stage
skills:
  - { name: demo, path: skills/demo/SKILL.md, bundle: skills/demo/skill-bundle.json, execution: independent, invocation: ${invocation}, trigger: test, owner: stage, dispatch: stage }
runtime_capabilities: []
external_capabilities: []
`);
  return root;
}

describe("stage skill runtime", () => {
  it("records an always dependency as executed only after hostInvoke returns an outcome", async () => {
    const root = fixture({ invocation: "always" });
    let calls = 0;
    const result = await dispatchStageSkill({
      packageRoot: root,
      stage: "stage",
      name: "demo",
      hostInvoke: () => {
        calls += 1;
        return { outcome: "done", ...outcome };
      },
    });
    expect(calls).toBe(1);
    expect(result, "ORACLE-INV: a real hostInvoke result must become a runtime-owned executed fact").toMatchObject({
      schema_version: "stage-skill-invocation.v1",
      name: "demo",
      status: "executed",
    });
  });

  it("rejects a triggered conditional dependency when hostInvoke returns no outcome", async () => {
    const root = fixture();
    await expect(dispatchStageSkill({
      packageRoot: root,
      stage: "stage",
      name: "demo",
      triggered: true,
      hostInvoke: () => undefined,
    }), "ORACLE-INV: trigger=true without a host outcome cannot count as executed").rejects.toThrow(/outcome|result/i);
  });

  it("preflights and dispatches a complete repository-local payload with a stable content hash", async () => {
    const root = fixture();
    expect(preflightStageSkills({ packageRoot: root, stage: "stage" }).dependencies.has("demo")).toBe(true);
    const second = await dispatchStageSkill({ packageRoot: root, stage: "stage", name: "demo", hostInvoke: payload => ({ ...payload, ...outcome }) });
    const again = await dispatchStageSkill({ packageRoot: root, stage: "stage", name: "demo", hostInvoke: payload => ({ ...payload, ...outcome }) });
    expect({ ...second, created_at: null }).toEqual({ ...again, created_at: null });
    expect(second).toMatchObject({ name: "demo", package_root: fs.realpathSync(root) });
    expect(second.resolved_skill_path).toBe(fs.realpathSync(path.join(root, "skills/demo/SKILL.md")));
    expect(second.resolved_bundle_paths).toContain(second.resolved_skill_path);
    expect(second.bundle_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("records an untriggered conditional skill without invoking the host", async () => {
    const root = fixture();
    let invoked = false;
    const result = await dispatchStageSkill({ packageRoot: root, stage: "stage", name: "demo", triggered: false, hostInvoke: () => { invoked = true; } });
    expect(result.status).toBe("not_invoked");
    expect(result.reason).toBe("trigger_false");
    expect(invoked).toBe(false);
  });

  it("preserves a concrete trigger-false reason in the runtime-owned fact", async () => {
    const root = fixture();
    const result = await dispatchStageSkill({
      packageRoot: root,
      stage: "stage",
      name: "demo",
      triggered: false,
      notInvokedReason: "No material ambiguity after the six-dimension check.",
      hostInvoke: () => { throw new Error("conditional host must not run"); },
    });
    expect(result).toMatchObject({
      status: "not_invoked",
      reason: "No material ambiguity after the six-dimension check.",
    });
  });

  it("validates conditional bundle assets during stage preflight", () => {
    const root = fixture();
    fs.rmSync(path.join(root, "skills/demo/SKILL.md"));
    let failure;
    try {
      preflightStageSkills({ packageRoot: root, stage: "stage" });
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(Error);
    expect(failure.code).not.toBe("ENOENT");
    expect(failure.diagnostic).toMatchObject({
      schema_version: "workflowhub-skill-diagnostic.v1",
      source: "resolver",
      skill: "demo",
      status: "blocked",
      code: "SKILL_RESOLUTION_FAILED",
    });
  });

  it("records an unavailable independent context without a human gate", async () => {
    const root = fixture();
    await expect(dispatchStageSkill({ packageRoot: root, stage: "stage", name: "demo", independentContextAvailable: false, hostInvoke: () => null })).resolves.toMatchObject({
      schema_version: "stage-skill-invocation.v1",
      name: "demo",
      status: "unavailable",
      reason: "independent_context_unavailable",
    });
  });

  it("records a truthful unavailable fact before propagating a hostInvoke failure", async () => {
    const root = fixture({ invocation: "always" });
    const published = [];
    const kernel = {
      task: { identity: { taskId: "task-1" } },
      deriveStageWorkflowRunId: () => "stage:0001:test",
      publishStageSkillInvocation: (fact) => published.push(fact),
    };
    const failure = new Error("host exploded");
    await expect(dispatchStageSkill({
      packageRoot: root, stage: "stage", name: "demo", kernel,
      hostInvoke: () => { throw failure; },
    }), "AC-16: host failure remains visible after truthful invocation recording").rejects.toBe(failure);
    expect(published).toHaveLength(1);
    expect(published[0]).toMatchObject({
      schema_version: "stage-skill-invocation.v1",
      status: "unavailable",
      reason: "host_invoke_failed:Error",
    });
  });

  it("records a blocked doctor diagnostic without blocking stage startup", () => {
    const root = fixture();
    fs.appendFileSync(path.join(root, "workflows/stage/skill-deps.yaml"), "");
    const manifestPath = path.join(root, "workflows/stage/skill-deps.yaml");
    fs.writeFileSync(manifestPath, fs.readFileSync(manifestPath, "utf8").replace("runtime_capabilities: []", "runtime_capabilities:\n  - { id: missing, kind: cli, required_when: always, doctor: [missing-cli], absence_semantics: blocked }"));
    const prepared = preflightStageSkills({ packageRoot: root, stage: "stage", run: () => ({ status: 127, error: new Error("missing") }) });
    expect(prepared.payloads.has("demo")).toBe(true);
    expect(prepared.capabilityResults).toContainEqual(expect.objectContaining({
      schema_version: "workflowhub-skill-diagnostic.v1",
      source: "doctor",
      skill: "missing",
      status: "blocked",
    }));
  });

  it.each(["blocked", "human_required"])("keeps a %s doctor result advisory through host invocation", async (absenceSemantics) => {
    const root = fixture();
    const manifestPath = path.join(root, "workflows/stage/skill-deps.yaml");
    fs.writeFileSync(manifestPath, fs.readFileSync(manifestPath, "utf8").replace(
      "runtime_capabilities: []",
      `runtime_capabilities:\n  - { id: missing, kind: cli, required_when: always, doctor: [missing-cli], absence_semantics: ${absenceSemantics} }`,
    ));
    const hostCalls = [];
    const result = await dispatchStageSkill({
      packageRoot: root,
      stage: "stage",
      name: "demo",
      run: () => ({ status: 127, error: new Error("missing") }),
      hostInvoke: (payload) => {
        hostCalls.push(payload);
        return { ...payload, ...outcome };
      },
    });
    expect(hostCalls).toHaveLength(1);
    expect(result.doctor_diagnostics).toContainEqual(expect.objectContaining({
      schema_version: "workflowhub-skill-diagnostic.v1",
      skill: "missing",
      status: absenceSemantics,
      enforcement: "advisory",
    }));
  });

});
