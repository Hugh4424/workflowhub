import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { dispatchStageSkill, preflightStageSkills } from "../stage-skill-runtime.mjs";

const roots = [];
afterEach(() => { for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true }); });

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-dispatch-"));
  roots.push(root);
  fs.mkdirSync(path.join(root, "skills/demo"), { recursive: true });
  fs.mkdirSync(path.join(root, "workflows/stage"), { recursive: true });
  fs.writeFileSync(path.join(root, "skills/demo/SKILL.md"), "# local\n");
  fs.writeFileSync(path.join(root, "skills/demo/skill-bundle.json"), JSON.stringify({ schema_version: 1, skill: "demo", files: ["SKILL.md"] }));
  fs.writeFileSync(path.join(root, "workflows/stage/skill-deps.yaml"), "stage: stage\nskills:\n  - { name: demo, path: skills/demo/SKILL.md, bundle: skills/demo/skill-bundle.json, execution: independent, invocation: conditional, trigger: test }\nruntime_capabilities: []\nexternal_capabilities: []\n");
  return root;
}

describe("stage skill runtime", () => {
  it("preflights and dispatches a complete repository-local payload with a stable content hash", async () => {
    const root = fixture();
    expect(preflightStageSkills({ packageRoot: root, stage: "stage" }).dependencies.has("demo")).toBe(true);
    const second = await dispatchStageSkill({ packageRoot: root, stage: "stage", name: "demo", hostInvoke: payload => payload });
    const again = await dispatchStageSkill({ packageRoot: root, stage: "stage", name: "demo", hostInvoke: payload => payload });
    expect(second).toEqual(again);
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
    expect(invoked).toBe(false);
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
    await expect(dispatchStageSkill({ packageRoot: root, stage: "stage", name: "demo", independentContextAvailable: false, hostInvoke: () => null })).resolves.toMatchObject({ name: "demo", status: "unavailable", reason: "independent_context_unavailable" });
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
        return payload;
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
