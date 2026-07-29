import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import yaml from "js-yaml";
import { certifyBuildCodeQualityBasis } from "../core/stage-handlers.mjs";

const root = resolve(new URL("..", import.meta.url).pathname);
const read = (...parts) => readFileSync(join(root, ...parts), "utf8");
const compact = (value) => value.replace(/\s+/g, " ");
const component = (name) => read("skills", name, "SKILL.md");
const stage = (name) => read("workflows", name, "SKILL.md");

function stageDependencies(name) {
  return yaml.load(read("workflows", name, "skill-deps.yaml")).skills;
}

function stageOwned(dependency) {
  return !String(dependency.trigger).startsWith("wh_review_");
}

describe("interaction quality amendment contracts", () => {
  it("AC-001 gives every talk round its own dynamically re-ranked convergence queue", () => {
    const makeDecision = compact(stage("make-decision"));
    const talk = compact(component("talk-with-zhipeng"));

    expect(makeDecision).toMatch(/round 1[\s\S]*real (?:problem|pain)[\s\S]*success criteria[\s\S]*research/i);
    expect(makeDecision).toMatch(/round 2[\s\S]*direction[\s\S]*scope[\s\S]*non-goals[\s\S]*(?:trade-offs|tradeoffs)[\s\S]*risks/i);
    expect(makeDecision).toMatch(/round 3[\s\S]*contradictions[\s\S]*assumptions[\s\S]*(?:unresolved findings|blind findings)[\s\S]*(?:remaining|residual) risks/i);
    expect(makeDecision).toMatch(/Start internally by enumerating known facts[\s\S]{0,160}every candidate question/i);
    expect(makeDecision).not.toMatch(/presenting known facts and[\s\S]{0,40}every candidate question/i);
    expect(talk).toMatch(/(?:each|every|每个) Round[^。.;]{0,80}(?:own|independent|独立)/i);
    expect(talk).toMatch(/(?:question queue|候选队列)/i);
    expect(talk).toMatch(/(?:完整候选队列|full candidate queue)[\s\S]{0,160}(?:内部|internal)/i);
    expect(talk).toMatch(/(?:当前状态|current status)[\s\S]{0,180}Round[\s\S]{0,180}(?:当前总数|current total)/i);
    expect(talk).toMatch(/(?:answered|已(?:由事实)?回答)[\s\S]*(?:not applicable|不适用)/i);
    expect(talk).toMatch(/(?:零、一个或多个|zero, one, or several)/i);
    expect(talk).toMatch(/(?:不得设置固定最少或最多|no fixed minimum or maximum)/i);
    expect(talk).toMatch(/(?:不得为了凑数量制造问题|never manufacture questions)/i);
    expect(talk).toMatch(/(?:actual|real|真实)[^。.;]{0,40}(?:answer|reply|回答|回复)[\s\S]{0,160}(?:re-rank|rerank|重新排序|重排)/i);
    expect(talk).toMatch(/(?:direction-changing|改变方向)[\s\S]{0,160}(?:must not end|不得结束|不能提前结束)/i);
  });

  it.each(["talk-with-zhipeng", "grill-with-docs", "spec-clarify"])(
    "AC-002 %s uses one-axis plain-language decision cards",
    (name) => {
      const skill = compact(component(name));
      expect(skill).toMatch(/(?:plain[- ]language|大白话)/i);
      expect(skill).toMatch(/(?:one|single|一个|单一)[^。.;]{0,30}(?:decision axis|决策轴)/i);
      expect(skill).toMatch(/(?:2\s*[–—-]\s*3|2\s*to\s*3|2～3|2至3|两到三个)[^。.;]{0,35}(?:mutually exclusive|互斥)[^。.;]{0,30}(?:options|选项)/i);
      expect(skill).toMatch(/(?:recommended option|推荐项|推荐选项)[\s\S]{0,100}(?:reason|理由)/i);
      expect(skill).toMatch(/(?:each|every|每项|每个选项)[^。.;]{0,50}(?:consequence|后果)[^。.;]{0,50}(?:risk|风险)/i);
      expect(skill).toMatch(/(?:no open-ended|禁止开放式|不得[^。.;]{0,15}开放式)[^。.;]{0,30}(?:fill|question|填空|问题)/i);
      expect(skill).toMatch(/(?:do not (?:show|display)|keep[^。.;]{0,40}out|不展示|不得展示)[^。.;]{0,80}(?:internal ID|内部 ID)[^。.;]{0,100}(?:hash|receipt|attempt|runner)/i);
    },
  );

  it("AC-003 records CONTEXT, ADR, conflict, and all four grill exit judgments", () => {
    const grill = compact(component("grill-with-docs"));
    const decisionLog = compact(component("decision-log"));
    for (const contract of [grill, decisionLog]) {
      expect(contract).toMatch(/CONTEXT\.md[\s\S]{0,160}(?:changed|no[- ]change)[\s\S]{0,120}(?:reason|理由)[\s\S]{0,120}(?:file|ref|文件|引用)/i);
      expect(contract).toMatch(/ADR[\s\S]{0,160}(?:created|not[- ]needed)[\s\S]{0,220}(?:hard to reverse|reversibility|难以反转)[\s\S]{0,220}(?:surprising|surprise|意外)[\s\S]{0,220}(?:trade-off|取舍)/i);
      expect(contract).toMatch(/(?:terminology|术语|ADR)[^。.;]{0,60}(?:conflict|冲突)[\s\S]{0,120}(?:result|resolution|disposition|结果|处理)/i);
    }
    expect(grill).toMatch(/(?:external interface|外部接口)[\s\S]{0,240}(?:unique authority|authoritative|唯一权威)/i);
    expect(grill).toMatch(/(?:failure path|failure semantics|失败路径)[\s\S]{0,240}(?:scope\/non-goals|scope boundar|做什么|不做什么)/i);
    expect(decisionLog).toMatch(/(?:all four|四项)[^。.;]{0,50}(?:objective )?exit checks|(?:objective )?exit checks[^。.;]{0,50}(?:all four|四项)/i);
    expect(grill).toMatch(/(?:自行诊断|diagnos)[\s\S]{0,100}(?:安全重试|safe retry)/i);
    expect(grill).toMatch(/(?:普通工具错误|ordinary tool error)[\s\S]{0,140}(?:不让用户|do not ask the user)/i);
    expect(grill).toMatch(/(?:完整 grill 未完成|full grill is incomplete)[\s\S]{0,100}(?:保持阻塞|remain blocked)/i);
  });

  it("AC-004 keeps a per-decision source and reasoning lineage including supersedes", () => {
    const decisionLog = compact(component("decision-log"));
    for (const field of [
      /(?:\bdecision\b|决定内容)/i,
      /(?:source|来源)[\s\S]{0,180}(?:original requirement|user reply|research|code fact|grill|review|原始要求|用户回答|调研|代码事实|独立审查)/i,
      /(?:facts and constraints|事实与约束)/i,
      /(?:choice|选择)[^。.;]{0,50}(?:reason|理由)/i,
      /(?:\bimpact\b|影响范围)/i,
      /(?:consequence|后果)[^。.;]{0,50}(?:risk|风险)/i,
      /(?:rejected alternative|被拒方案)[^。.;]{0,60}(?:reason|理由)/i,
      /(?:unresolved|未解决)/i,
      /supersedes/i,
    ]) expect(decisionLog).toMatch(field);
    expect(decisionLog).toMatch(/(?:each|every|每个|逐项)[^。.;]{0,40}(?:load-bearing decision|关键决定)/i);
    expect(decisionLog).not.toMatch(/(?:source|来源)\s*[:：]?\s*(?:confirmed|已确认|根据讨论)(?:\s|[。.;,，]){0,4}$/im);
    expect(decisionLog).toMatch(/(?:stable source reference|稳定来源引用)[\s\S]{0,120}(?:exact answer excerpt|准确答案摘录)/i);
    expect(decisionLog).toMatch(/(?:every[\s\S]{0,100}actual user answer|每个实际用户答案)[\s\S]{0,240}(?:(?:decision entry|main document|omission|决定条目|正文|遗漏)[\s\S]{0,160}(?:non-decision fact|exactly once|非决定事实|恰好一次)|(?:exactly once|恰好一次)[\s\S]{0,120}(?:main document|omission|正文|遗漏))/i);
  });

  it("AC-005 preserves locked decisions and separates unresolved from new ambiguity", () => {
    const fixture = JSON.parse(read("tests", "fixtures", "interaction-quality", "r9-spec-clarify.json"));
    const clarify = compact(component("spec-clarify"));

    expect(typeof fixture.locked_decisions[0].value).toBe("string");
    expect(fixture.new_ambiguities[0].axes).toHaveLength(2);
    expect(fixture.paired_behaviors.axes).toHaveLength(2);
    expect(fixture.paired_behaviors.must_split).toBe(true);
    expect(fixture.upstream_choice.options).toEqual(["stop", "continue"]);
    expect(fixture.conflicting_candidates[0].value).toMatch(/Multica API/i);
    expect(clarify).toMatch(/locked upstream decision[\s\S]{0,500}upstream unresolved item[\s\S]{0,500}new ambiguity/i);
    expect(clarify).toMatch(/locked upstream decision[\s\S]{0,220}inherit[\s\S]{0,180}wording[\s\S]{0,180}ordering[\s\S]{0,180}semantics[\s\S]{0,120}without renaming/i);
    expect(clarify).toMatch(/one decision axis[\s\S]{0,160}multiple axes[\s\S]{0,100}dependency/i);
    expect(clarify).toMatch(/independent[- ]variation[\s\S]{0,220}independently variable[\s\S]{0,180}(?:forbidden|split)/i);
    expect(clarify).toMatch(/publishing a card[\s\S]{0,100}ends the current invocation/i);
    expect(clarify).toMatch(/multiple unresolved axes[\s\S]{0,180}ask[^\n]{0,20}wait[^\n]{0,20}resume/i);
    expect(compact(stage("build-spec"))).toMatch(/ask[^。.;]{0,20}suspension point[\s\S]{0,160}corresponding real answer/i);
    expect(clarify).toMatch(/upstream already supplied choices or a recommendation[\s\S]{0,100}preserve them exactly/i);
    expect(clarify).toMatch(/discard candidates[\s\S]{0,100}conflict[\s\S]{0,160}all candidates[\s\S]{0,100}report[\s\S]{0,120}contradiction[\s\S]{0,120}repair/i);
  });

  it.each(["make-decision", "build-spec"])(
    "AC-006 %s completion card accounts for every stage-owned dependency",
    (name) => {
      const skill = compact(stage(name));
      const dependencies = stageDependencies(name);
      const owned = dependencies.filter(stageOwned);
      const reviewerOwned = dependencies.filter((item) => !stageOwned(item));

      expect(owned.some((item) => item.invocation === "always")).toBe(true);
      expect(owned.some((item) => item.invocation === "conditional")).toBe(true);
      expect(reviewerOwned.every((item) => item.invocation === "conditional")).toBe(true);
      expect(skill).toMatch(/`skill-deps\.yaml`[\s\S]{0,160}(?:only|sole|唯一)[^。.;]{0,50}(?:list|authority|清单|权威)/i);
      expect(skill).toMatch(/(?:completion card|完成卡)[\s\S]{0,180}(?:every|each|逐项)[^。.;]{0,60}(?:Stage-owned|阶段所有)/i);
      expect(skill).toMatch(/always[^。.;]{0,60}executed[\s\S]{0,120}conditional[^。.;]{0,100}(?:executed|trigger=false)[\s\S]{0,60}(?:reason|理由)/i);
      expect(skill).toMatch(/(?:formal artifacts|正式产物)[\s\S]{0,100}(?:review refs|审查引用)[\s\S]{0,100}(?:cross-check|交叉核对|一致)/i);
      expect(skill).toMatch(/(?:reviewer-owned|审查方所有)[\s\S]{0,120}(?:review refs|review evidence|审查引用|审查证据)[\s\S]{0,120}(?:never|不得|不)[^。.;]{0,50}(?:second|again|重复)/i);
    },
  );

  it("AC-007 build-spec reconciles review findings and coverage references before acceptance", () => {
    const buildSpec = compact(stage("build-spec"));
    expect(buildSpec).toMatch(/exact final `spec\.md` bytes[\s\S]{0,180}every review finding/i);
    expect(buildSpec).toMatch(/internal contradiction[\s\S]{0,180}cross-reference[\s\S]{0,180}acceptance criterion/i);
    expect(buildSpec).toMatch(/enumerate the actual FR[\s\S]{0,120}AC identifiers[\s\S]{0,180}stated range/i);
    expect(buildSpec).toMatch(/stop before acceptance[\s\S]{0,160}never publish a completion card/i);
  });

  it("all five stages separate questions, milestones, and review briefs", () => {
    for (const name of ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]) {
      const skill = compact(stage(name));
      expect(skill).toMatch(/one card type only/i);
      expect(skill).toMatch(/question card|decision question card|confirmation question card|clarification question card|verification or close question card/i);
      expect(skill).toMatch(/milestone card/i);
      expect(skill).toMatch(/review card/i);
      expect(skill).toMatch(name === "build-code" ? /actual reviewer sources/i : /actual providers/i);
      expect(skill).toMatch(/duration[\s\S]{0,120}token usage[\s\S]{0,180}(?:not provided|formal review\/runtime facts)/i);
      expect(skill).toMatch(/unchanged milestone or reused review result[\s\S]{0,100}not published again/i);
      expect(skill).toMatch(/high-school student/i);
      expect(skill).toMatch(/Raw paths[\s\S]{0,160}hashes[\s\S]{0,160}receipt or attempt refs[\s\S]{0,160}formal records/i);
      expect(skill).toMatch(name === "verify-code"
        ? /host must deliver[\s\S]{0,180}close handoff[\s\S]{0,180}parent/i
        : /host must deliver[\s\S]{0,180}downstream[\s\S]{0,180}parent/i);
      expect(skill).toMatch(/upstream owner/i);
    }
  });

  it("question components keep user cards short and queue-aware", () => {
    const talk = compact(component("talk-with-zhipeng"));
    const grill = compact(component("grill-with-docs"));
    const clarify = compact(component("spec-clarify"));

    expect(talk).toMatch(/(?:当前状态|current status)[\s\S]{0,180}Round[\s\S]{0,180}(?:当前总数|current total)/i);
    expect(talk).toMatch(/不得再写“刚完成”“下一步”“需要你处理吗”/i);
    expect(talk).toMatch(/不展示完整重排表/i);
    expect(grill).toMatch(/当前状态[\s\S]{0,120}`grill-with-docs`[\s\S]{0,160}问题序号[\s\S]{0,120}当前总数/i);
    expect(clarify).toMatch(/current status[\s\S]{0,120}`spec-clarify`[\s\S]{0,140}current ambiguity count/i);
  });

  it("stage-specific final briefs expose the decisions needed at each boundary", () => {
    const makeDecision = compact(stage("make-decision"));
    const buildPlan = compact(stage("build-plan"));
    const verifyCode = compact(stage("verify-code"));

    expect(makeDecision).toMatch(/load-bearing decision's source[\s\S]{0,160}affected scope[\s\S]{0,120}consequence[\s\S]{0,80}risk/i);
    expect(buildPlan).toMatch(/accepted specification[\s\S]{0,160}implementation plan[\s\S]{0,160}phases[\s\S]{0,120}tests[\s\S]{0,120}risks/i);
    expect(buildPlan).not.toMatch(/exactly four items/i);
    expect(compact(stage("build-code"))).not.toMatch(/exactly four items/i);
    expect(verifyCode).toMatch(/overall solution[\s\S]{0,120}implemented[\s\S]{0,120}observed behavior[\s\S]{0,120}fresh tests[\s\S]{0,160}remaining risks/i);
  });

  it("make-decision and close keep internal bindings out of public decision cards", () => {
    const makeDecision = compact(stage("make-decision"));
    const verifyCode = compact(stage("verify-code"));
    expect(makeDecision).toMatch(/worktree, baseline, snapshot, hashes[\s\S]{0,120}internal record[\s\S]{0,80}not in the decision card/i);
    expect(verifyCode).toMatch(/plain-language summary[\s\S]{0,180}six actions[\s\S]{0,180}plan hash[\s\S]{0,120}internal binding[\s\S]{0,120}do not display/i);
  });

  it("build-code keeps Phase surfaces readable and returns host configuration faults without stale chatter", () => {
    const buildCode = compact(stage("build-code"));
    expect(buildCode).toMatch(/user-visible surface[\s\S]{0,180}plain-language Phase brief[\s\S]{0,180}goal[\s\S]{0,180}completion standard[\s\S]{0,180}allowed change area/i);
    expect(buildCode).toMatch(/Raw Workspace paths[\s\S]{0,160}baselines[\s\S]{0,160}formal card record[\s\S]{0,160}must not appear in the user-visible description/i);
    expect(buildCode).toMatch(/missing host resource mapping[\s\S]{0,180}host configuration failure[\s\S]{0,180}host coordinator[\s\S]{0,180}do not ask the user/i);
    expect(buildCode).toMatch(/no state change[\s\S]{0,120}no action to take[\s\S]{0,120}publish no public message/i);
    expect(buildCode).toMatch(/latest completed Phase results[\s\S]{0,180}Later facts supersede earlier provisional skips[\s\S]{0,180}never reuse a stale Phase summary/i);
  });

  it("all five stages use current materials, real review facts, and no synthetic pass", () => {
    for (const name of ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]) {
      const skill = compact(stage(name));
      expect(skill).toMatch(/(?:real|actual|真实|正式)[\s\S]{0,120}(?:review|审查)/i);
      expect(skill).toMatch(/unavailable/i);
      expect(skill).toMatch(/unavailable[\s\S]{0,180}(?:never|不得|不能)[\s\S]{0,80}pass/i);
    }
    const buildCode = compact(stage("build-code"));
    const verifyCode = compact(stage("verify-code"));
    expect(buildCode).toMatch(/decision-log\.md[\s\S]{0,100}spec\.md[\s\S]{0,100}plan\.md[\s\S]{0,100}tasks\.md/i);
    expect(buildCode).toMatch(/tasks\.md[\s\S]{0,220}(?:unique|唯一)[\s\S]{0,120}(?:completion|完成)/i);
    expect(buildCode).toMatch(/(?:after|每个)[^。.;]{0,100}Phase[\s\S]{0,180}tasks-only/i);
    expect(buildCode).toMatch(/final[^。.;]{0,100}(?:certif|认证)[\s\S]{0,180}tasks\.md/i);
    expect(buildCode).not.toMatch(/\{"phase_completion":true\}/);
    expect(verifyCode).toMatch(/independent(?:ly)?[\s\S]{0,180}(?:recheck|复查)[\s\S]{0,180}tasks\.md/i);
  });

  it("stage step manifests treat accepted history as audit context instead of an entry gate", () => {
    for (const name of ["build-spec", "build-plan", "build-code", "verify-code"]) {
      const manifest = compact(read("workflows", name, "steps.json"));
      expect(manifest).not.toMatch(/(?:spec|plan|build):\/\/approved/i);
      expect(manifest).not.toMatch(/automatically accepted/i);
    }
    expect(compact(read("workflows", "build-code", "steps.json"))).toMatch(
      /decision-log\.md[\s\S]{0,120}spec\.md[\s\S]{0,120}plan\.md[\s\S]{0,120}tasks\.md/i,
    );
  });

  it("completion evidence: build-code authenticates current tasks before publishing completion", () => {
    const manifest = JSON.parse(read("workflows", "build-code", "steps.json"));
    const authenticate = manifest.steps.find(({ step_slug: slug }) => slug === "authenticate-current-task-completion");
    const publish = manifest.steps.find(({ step_slug: slug }) => slug === "publish-code-result");
    expect(authenticate).toBeDefined();
    expect(authenticate.order).toBeLessThan(publish.order);
    expect(publish.depends_on).toContain(authenticate.step_id);
  });

  it("completion evidence: final integration review stays separate from Phase task review facts", () => {
    const handler = read("core", "stage-handlers.mjs");
    expect(handler).not.toMatch(
      /for \(const task of completion\.tasks\)[\s\S]{0,320}review_fact does not bind the current review/i,
    );
    expect(handler).toMatch(
      /final integration review[\s\S]{0,320}tasks\.md completion evidence/i,
    );
    expect(handler).toMatch(
      /integration_review:\s*\{\s*ref:\s*reviewRef,\s*sha256:\s*reviewHash\s*\}/i,
    );
    expect(handler).not.toMatch(
      /\{\s*ref:\s*reviewRef,\s*sha256:\s*reviewHash\s*\},[\s\S]{0,80}\.\.\.requiredEvidence/i,
    );
  });

  it("completion evidence: missing formal history remains audit-only when current quality facts are complete", () => {
    const result = certifyBuildCodeQualityBasis({
      changedFiles: ["core/owned.mjs"],
      claimedChanges: ["core/owned.mjs"],
      tests: { exit_code: 0 },
      review: {
        result_ref: "reviews/results/final.json",
        result_hash: "a".repeat(64),
        verdict: "revise_required",
      },
      expectedAc: ["AC-001"],
      coveredAc: ["AC-001"],
      formalRecordStatus: {
        status: "unavailable",
        reason: "no accepted checkpoint or canonical Phase trace exists",
      },
    });

    expect(result.formal_record_status.status).toBe("unavailable");
    expect(result.review.verdict).toBe("revise_required");
    expect(result.changed).toEqual(["core/owned.mjs"]);
  });

  it("completion evidence: an actual unowned implementation path fails exact diff certification", () => {
    expect(() => certifyBuildCodeQualityBasis({
      changedFiles: ["core/owned.mjs", "core/hidden.mjs"],
      claimedChanges: ["core/owned.mjs"],
      tests: { exit_code: 0 },
      review: {
        result_ref: "reviews/results/final.json",
        result_hash: "b".repeat(64),
        verdict: "revise_required",
      },
      expectedAc: ["AC-001"],
      coveredAc: ["AC-001"],
      formalRecordStatus: {
        status: "unavailable",
        reason: "no canonical Phase trace exists",
      },
    })).toThrow(/core\/hidden\.mjs/);
  });
});
