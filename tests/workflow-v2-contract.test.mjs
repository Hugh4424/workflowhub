import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const stages = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
const readStage = (stage) => readFileSync(join(root, "workflows", stage, "SKILL.md"), "utf8");
const readComponent = (component) => readFileSync(join(root, "skills", component, "SKILL.md"), "utf8");

describe("five-stage v2 business contract", () => {
  it.each(stages)("%s has valid identity and one TaskContext bootstrap", (stage) => {
    const skill = readStage(stage);
    expect(skill).toMatch(new RegExp(`^---[\\s\\S]*name: ${stage}[\\s\\S]*version: 2\\.0\\.0[\\s\\S]*---`));
    expect(skill).toContain("core/stage-context.mjs");
    expect(skill).toContain(`bootstrapStage(\"${stage}\"`);
    expect(skill).toContain("StageContext");
    expect(skill).not.toMatch(/parseTaskDir|resolveTaskRecordPaths|task_tracking_root|worktree\.json/);
  });

  it("keeps every Stage Skill self-contained while the launcher owns the runner", () => {
    for (const stage of stages) {
      const skill = readStage(stage);
      const compact = skill.replace(/\s+/g, " ");
      expect(compact).toMatch(/Consume only (?:that launcher-supplied|the branded|`bootstrapStage)[\s\S]{0,120}StageContext|Consume only `bootstrapStage/i);
      expect(compact).toMatch(/Never derive task identity or paths from cwd, a repository, or an (?:issue|external tracker) identifier/i);
      expect(compact).toMatch(/launcher resolves all[\s\S]*`scripts\/`[\s\S]*`core\/`[\s\S]*`metrics\/`[\s\S]*authenticated `runner_root`/i);
      expect(compact).toMatch(/never search for or copy those runner files into the target repository/i);
      expect(skill).not.toMatch(/docs\/contracts\/task-context\.md|config\/workflowhub\.yaml/);
    }
    expect(readStage("verify-code")).not.toMatch(/workflows\/build-code\/SKILL\.md/);
  });

  it("keeps human briefs inline and the verify repair handoff complete", () => {
    for (const stage of ["build-spec", "build-plan", "build-code", "verify-code"]) {
      const skill = readStage(stage);
      const compact = skill.replace(/\s+/g, " ");
      expect(compact).toMatch(/milestone card[\s\S]{0,220}current progress[\s\S]{0,220}next step[\s\S]{0,220}(?:whether user action is required|whether the user must act)/i);
      expect(compact).toMatch(/recommended option[\s\S]{0,180}(?:every option's consequence and risk|consequence[\s\S]*risk)/i);
      expect(skill).not.toMatch(/docs\/human-brief-template\.md/);
    }
    expect(readStage("verify-code")).toMatch(/stage-runtime\.mjs reopen --stage=build-code[\s\S]*--verify-attempt=<failed-verify-attempt-ref>[\s\S]*--failure-evidence=<failed-acceptance-evidence-ref>[\s\S]*immutable reopen\s+ref[\s\S]*upstream Code Builder/i);
  });

  it("maps host-visible interaction, component facts, and concise handoff without host coupling", () => {
    for (const stage of stages) {
      const skill = readStage(stage);
      const compact = skill.replace(/\s+/g, " ");
      expect(compact, stage).toMatch(/ask.*wait.*present.*host-visible conversation surface/i);
      expect(compact, stage).toMatch(/Stage-owned.*always.*executed.*conditional.*trigger=false.*reason/i);
      expect(compact, stage).toMatch(/`skill-deps\.yaml`.*formal artifacts.*`wh-review`.*refs/i);
      expect(compact, stage).toMatch(/stage result.*human-readable artifact names.*test and review conclusions.*downstream dependencies.*unresolved risks.*next owner.*user action/i);
      expect(compact, stage).toMatch(/(?:downstream|close) handoff surface.*parent progress surface/i);
      expect(skill, stage).not.toMatch(/Multica|mention:\/\/|用户 UUID|member mention/i);
    }
  });

  it("keeps make-decision talk and grill outcomes visible without adding confirmation gates", () => {
    const skill = readStage("make-decision").replace(/\s+/g, " ");
    expect(skill).toMatch(/round 1.*host-visible.*round 2.*host-visible.*round 3.*host-visible/i);
    expect(skill).toMatch(/grill-with-docs.*completion.*changed context files.*no file changes/i);
    expect(skill).toMatch(/only.*change direction.*wait for the user/i);
  });

  it("always scans build-spec ambiguity and invokes spec-clarify only when triggered", () => {
    const skill = readStage("build-spec").replace(/\s+/g, " ");
    expect(skill).toMatch(/always perform.*material ambiguity scan/i);
    expect(skill).toMatch(/spec-clarify.*conditional.*clarification/i);
    expect(skill).toMatch(/trigger=false.*no material ambiguity/i);
  });

  it("keeps three stage gates, two automatic stages, and visible quality facts", () => {
    for (const stage of ["make-decision", "build-plan", "verify-code"])
      expect(readStage(stage)).toMatch(/confirm|human|user|用户|人工/i);
    for (const stage of ["build-spec", "build-code"]) {
      expect(readStage(stage)).toMatch(/automatic|automatically/i);
      expect(readStage(stage)).not.toMatch(/wait for human confirmation|human-confirmation-ref/i);
    }
    expect(readStage("make-decision")).toMatch(/Quality facts are recorded, not converted into automatic quality gates/i);
    expect(readStage("build-code")).toMatch(/Start only the current Phase[\s\S]*Start the next Phase only after[\s\S]*gate passes/i);
    expect(readStage("verify-code")).toMatch(/Quality failures remain visible facts/i);
  });

  it("keeps named design artifacts and component isolation", () => {
    expect(readStage("build-spec")).toMatch(/spec\.md[\s\S]*ArtifactDir/i);
    expect(readStage("build-plan")).toMatch(/spec\.md[\s\S]*plan\.md[\s\S]*tasks\.md/i);
    expect(readStage("build-code")).toMatch(/spec\.md[\s\S]*plan\.md[\s\S]*tasks\.md/i);
    for (const stage of ["build-spec", "build-plan", "build-code"]) {
      expect(readStage(stage)).toMatch(/frozen|controlled|ArtifactDir/i);
    }
  });

  it("keeps build-plan research in memory and publishes only plan/tasks artifacts", () => {
    const skill = readStage("build-plan");
    const research = readComponent("spec-research");
    const plan = readComponent("spec-plan");
    expect(skill).toMatch(/Writes: `plan\.md` and `tasks\.md` only/i);
    expect(skill).toMatch(/research notes[\s\S]*in-memory|in-memory[\s\S]*research/i);
    expect(skill).not.toMatch(/Writes:[^\n]*(?:research\.md|data-contracts\.md)/i);
    expect(research).toMatch(/Return one in-memory `spec-research-result\.v1` value/i);
    expect(research).toMatch(/Never write a\s+file or publish a formal artifact/i);
    expect(research).not.toMatch(/controlled writer|research\.md/i);
    expect(plan).toMatch(/optional frozen[\s\S]*`spec-research-result\.v1` content/i);
    expect(plan).not.toMatch(/research\.md/i);
    const steps = JSON.parse(readFileSync(join(root, "workflows", "build-plan", "steps.json"), "utf8"));
    expect(steps.steps.slice(1, 3).flatMap((step) => step.completion_evidence.map((item) => item.uri_or_path)))
      .toEqual(["memory://build-plan/research", "memory://build-plan/data-contracts"]);
  });

  it("keeps independent review, fresh tests, browser QA, and confirmed close", () => {
    expect(readStage("make-decision")).toMatch(/independent direction review/i);
    expect(readStage("build-code")).toMatch(/independent code review[\s\S]*fresh test/i);
    expect(readStage("verify-code")).toMatch(/isolated-browser-qa[\s\S]*reuse[\s\S]*accepted build-code[\s\S]*final review/i);
    const verify = readStage("verify-code");
    expect(verify).toMatch(/plain-language summary[\s\S]*six actions[\s\S]*separate close authorization/i);
    expect(verify).toMatch(/plan hash[\s\S]*internal binding[\s\S]*do not display/i);
    expect(verify).toMatch(/Never reuse the verify-code confirmation ref/i);
  });

  it("keeps pre-accept build-code repair append-only without a verify reopen", () => {
    const skill = readStage("build-code");
    expect(skill).toMatch(/same-Phase repair[\s\S]*--revision=true --recover=<latest-implementation-receipt-ref>/i);
    expect(skill).toMatch(/repaired tests[\s\S]*new receipt\/output refs/i);
    expect(skill).toMatch(/does not require or create a verify-code reopen authorization/i);
    expect(skill).toMatch(/After[\s\S]*accepted[\s\S]*only the controlled verification-failure path/i);
    expect(skill).toMatch(/<final implementation receipt ref>[\s\S]*<final fresh test receipt ref>/i);
    expect(skill).toMatch(/normal[^\n]*default[^\n]*receipts\/implementation\.json[^\n]*receipts\/build-tests\.json/i);
    expect(skill).toMatch(/revision[^\n]*(?:latest|newest)[^\n]*refs/i);
  });

  it("reviews every build-code Phase and then the final worktree", () => {
    const skill = readStage("build-code");
    expect(skill).toMatch(/publish-phase-evidence/);
    expect(skill).toMatch(/current `phase_id`/i);
    expect(skill).toMatch(/Start the next Phase only after the current Phase gate passes/i);
    expect(skill).toMatch(/full-worktree[^\n]*`wh-review`|`wh-review`[^\n]*full-worktree/i);
    expect(skill).toMatch(/final review is separate from the required per-Phase\s+reviews/i);
    expect(skill).toMatch(/canonical implementation[\s\S]{0,180}tests[\s\S]{0,180}same snapshot tree/i);
    expect(skill).toMatch(/revise_required[\s\S]*repair the same Phase[\s\S]*fresh receipts[\s\S]*new identity/i);
    expect(skill).toMatch(/controlled `reopen`[\s\S]*current[\s\S]*PASS Phase[\s\S]*`reopen_ref`/i);
    expect(skill).toMatch(/does not create[\s\S]*(?:Phase registry|Phase history)/i);
    const handlers = readFileSync(join(root, "core", "stage-handlers.mjs"), "utf8");
    expect(handlers).toMatch(/build-code final review must be a full-worktree result/);
  });

  it("keeps the accepted three-talk make-decision flow with one final confirmation", () => {
    const skill = readStage("make-decision");
    const positions = [
      "`talk-with-zhipeng` round 1",
      "`talk-with-zhipeng` round 2",
      "`wh-review` direction track",
      "`talk-with-zhipeng` round 3",
      "complete `grill-with-docs`",
      "`wh-review` detail track",
      "only make-decision confirmation",
    ].map((marker) => skill.indexOf(marker));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(skill).toMatch(/Do not substitute a lite or read-only variant/i);
    expect(skill).toMatch(/round 2[\s\S]*non-blocking conversation checkpoint[\s\S]*not a confirmation gate/i);
    expect(skill).toMatch(/post-grill `snapshot_tree`[\s\S]*recapture the tree/i);

    const steps = JSON.parse(readFileSync(join(root, "workflows", "make-decision", "steps.json"), "utf8"));
    expect(steps.steps.map((step) => step.step_slug)).toEqual([
      "load-context", "triage-scope", "talk-round-1", "research-inputs",
      "talk-round-2", "blind-direction-review", "talk-round-3",
      "grill-with-docs", "write-decision-draft", "review-decision-detail",
      "approve-decision", "publish-decision",
    ]);
  });

  it("uses append-only attempts and accepted lineage instead of mutable stage results", () => {
    for (const stage of stages) expect(readStage(stage)).toMatch(/append-only|attempt/i);
    for (const stage of stages.slice(1)) expect(readStage(stage)).toMatch(/accepted/i);
    for (const stage of stages) expect(readStage(stage)).not.toMatch(/stage-result-[a-z-]+\.json/);
  });
});
