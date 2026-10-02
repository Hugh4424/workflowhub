import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import yaml from "js-yaml";
import { validateStageInvocation } from "../../runtime/stage/stage-handlers.mjs";
import { prepareTaskBoundBuildCodeReviewBundle, stageRuntimeProcessExitCode } from "../../tools/cli/stage-runtime.mjs";

const root = path.resolve(import.meta.dirname, "../..");
const stages = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

describe("current stage execution has no external Stage Agent gate", () => {
  it("keeps external stage outcomes out of active step and skill contracts", () => {
    for (const stage of stages) {
      const steps = JSON.parse(read(`workflows/${stage}/steps.json`));
      expect(JSON.stringify(steps), `${stage} step manifest`).not.toContain("stage_outcome");
      expect(JSON.stringify(steps), `${stage} step manifest`).not.toMatch(/Stage Agent.{0,80}(?:bridge|提交|提供|required|requires)|(?:bridge|提交|提供|required|requires).{0,80}Stage Agent/);
      const dependencies = yaml.load(read(`workflows/${stage}/skill-deps.yaml`));
      expect(JSON.stringify(dependencies), `${stage} skill manifest`).not.toContain("stage_outcome");
      expect(read(`workflows/${stage}/SKILL.md`), `${stage} active skill`).not.toMatch(/canonical stage outcome|quality\/evidence\/stage-outcomes/);
    }
  });

  it("rejects a stage outcome receipt at the current invocation boundary", () => {
    for (const stage of stages) {
      expect(() => validateStageInvocation(stage, {
        receipts: { stage_outcomes: `quality/evidence/stage-outcomes/${stage}/${"a".repeat(64)}.json` },
      })).toThrow(/unexpected receipt fields|stage_outcomes/);
    }
  });

  it("documents and implements the current-session path as the official producer", () => {
    const protocol = read("skills/workflowhub-host-protocol/SKILL.md");
    const verifySkill = read("workflows/verify-code/SKILL.md");
    const packetLens = read("skills/spec-analyze/packet-lens.md");
    const runner = read("runtime/stage/stage-runner.mjs");
    const cli = read("tools/cli/stage-runtime.mjs");
    const whReview = read("skills/wh-review/scripts/wh-review-cli.mjs");
    expect(protocol).toContain("当前 WorkflowHub 会话是正式阶段执行者");
    expect(protocol).toMatch(/任何“先补外部 Stage Agent outcome\s+再正式 run”的恢复建议都是错误归因/);
    expect(verifySkill).toContain("阶段 outcome 不是必需输入");
    expect(verifySkill).not.toContain("quality/evidence/stage-outcomes/<stage>/<sha256>.json");
    expect(packetLens).toContain("no external Stage Agent, bridge, session or");
    expect(packetLens).not.toContain("The Stage Agent supplies the current packet");
    expect(runner).toContain("official ${stage} stage executed by the current WorkflowHub session");
    expect(runner).not.toContain("requires receipts.stage_outcomes from the current WorkflowHub session");
    expect(cli).not.toContain("Stage outcomes must be supplied explicitly by the caller");
    expect(cli).toContain("current stage run does not accept receipts.stage_outcomes");
    expect(cli.indexOf("current stage run does not accept receipts.stage_outcomes"))
      .toBeLessThan(cli.indexOf("completeMakeDecisionResearch"));
    expect(whReview).not.toContain("current completed build-code outcome");
    expect(whReview).toContain("current passed build-code acceptance execution");
    expect(read("runtime/review/review-record-route.mjs")).toContain("reviewed_execution must bind a current WorkflowHub session execution");
    expect(fs.existsSync(path.join(root, "tools/host/workflowhub-local-stage-runner.mjs"))).toBe(false);
  });

  it("captures verify-code review input from the authenticated worktree", () => {
    const bundleRoot = fs.mkdtempSync(path.join("/tmp", "workflowhub-verify-review-"));
    let captured;
    const source = { dispose() {} };
    const bundle = prepareTaskBoundBuildCodeReviewBundle({
      workspace: { worktreeRoot: "/tmp/workflowhub-task" },
      task: { identity: { taskId: "task-current-review" } },
    }, {
      stage: "verify-code",
      host_provider: "dsh",
      subject_kind: "worktree",
      materials: {
        changed_files: "current worktree",
        implementation_assessment: "current session owns the active producer",
        test_context: "targeted tests passed",
        open_risks: "legacy compatibility is read-only",
      },
    }, {
      loadConfig: () => ({ attachmentRoot: "/tmp" }),
      captureSource: (options) => {
        expect(options.includeDiff).toBe(true);
        return source;
      },
      buildMaterials: (options) => {
        captured = options;
        return { bundleRoot, materialId: "a".repeat(64) };
      },
    });
    try {
      expect(captured.materials.review_instructions).toContain("Review stage verify-code");
      expect(captured.source).toBe(source);
      expect(captured.stage).toBe("verify-code");
    } finally {
      bundle.dispose();
    }
  });

  it("returns a non-zero process exit when the stage row write failed", () => {
    expect(stageRuntimeProcessExitCode({ status: "in_progress" })).toBe(0);
    expect(stageRuntimeProcessExitCode({ status: "in_progress", stage_row_error: "facts.jsonl unavailable" })).toBe(1);
    expect(stageRuntimeProcessExitCode({ status: "in_progress", stage_reflection: { stage_row_error: "row write failed" } })).toBe(1);
    expect(stageRuntimeProcessExitCode({ status: "protocol_invalid", stage_row_error: "row write failed" })).toBe(2);
  });
});
