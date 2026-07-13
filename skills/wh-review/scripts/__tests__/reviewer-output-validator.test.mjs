import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { resolveRequiredSkills } from "../required-skill-resolver.mjs";
import { validateReviewerOutput } from "../reviewer-output-validator.mjs";

const sha = (value) => createHash("sha256").update(value).digest("hex");
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
function fixture({ stage = "build-code", reviewTrack = null, verdict = "pass" } = {}) {
  const resolution = resolveRequiredSkills({ stage, reviewTrack });
  const skillBundleHash = sha(canonical(resolution.definitions.map(({ name, bundle }) => ({ name, sha256: bundle.sha256 }))));
  const hashes = { packet_hash: "1".repeat(64), manifest_hash: "2".repeat(64), diff_sha256: "3".repeat(64), contract_hash: "4".repeat(64), skill_bundle_hash: skillBundleHash };
  const prefix = stage === "make-decision" ? (reviewTrack === "direction" ? "DIR-" : "DET-") : "";
  const checkIds = (stage === "make-decision" || stage === "verify-code" ? ["C1", "C2", "C3", "C4", "C5", "C6"] : ["C1", "C2", "C3"]).map((id) => `${prefix}${id}`);
  const ids = [...checkIds, ...["H1", "H2", "H3"].map((id) => `${prefix}${id}`)];
  const output = {
    ...hashes, packet_status: "complete", verdict, summary: "审查结论基于冻结 packet 的逐项证据。", findings: [],
    checklist: ids.map((id) => ({ id, passed: true, evidence: `unified_diff:a:1 显示 ${id} 的目标行为已实现。` })),
    pass_items: ids.map((id) => ({ rule_id: id, artifact_anchor: `unified_diff:a:1#${id}`, evidence: `新增分支明确返回 ${id} 的预期结果。` })),
    skillResults: resolution.definitions.map(({ name, bundle }) => ({ skill: name, bundle_hash: bundle.sha256, mode: "lens-only", checked_objects: ["planning_artifacts:plan.md#L10"], evidence: "plan.md#L10 显示需求和验证步骤直接关联。", conclusion: "该 lens 未发现违反合同的证据。" })),
  };
  return { output, resolution, packet: { ...hashes }, intent: { contract_hash: hashes.contract_hash, material_manifest_hash: hashes.manifest_hash, skill_bundle_hash: hashes.skill_bundle_hash } };
}
function validate(value) { return validateReviewerOutput({ stage: "build-code", output: value.output, packet: value.packet, intent: value.intent }); }

describe("reviewer-output validator", () => {
  it("requires stable explicit check ids in every selected stage contract", () => {
    const cases = [["make-decision", "direction", 6, 3], ["make-decision", "detail", 6, 3], ["build-spec", null, 3, 3], ["build-plan", null, 3, 3], ["build-code", null, 3, 3], ["verify-code", null, 6, 3]];
    for (const [stage, track, checkCount, hardCount] of cases) {
      const contract = readFileSync(new URL(`../../contracts/${stage}.md`, import.meta.url), "utf8");
      const selected = stage === "make-decision" ? contract.slice(contract.indexOf(`## review_track: ${track}`), track === "direction" ? contract.indexOf("## review_track: detail") : undefined) : contract;
      expect(selected.match(/^- (?:DIR-|DET-)?C\d+:\s+\S/gm) ?? [], `${stage}/${track}`).toHaveLength(checkCount);
      expect(selected.match(/^- (?:DIR-|DET-)?H\d+:\s+\S/gm) ?? [], `${stage}/${track}`).toHaveLength(hardCount);
      expect(validateReviewerOutput({ stage, reviewTrack: track, output: fixture({ stage, reviewTrack: track }).output }).valid).toBe(true);
    }
  });

  it("requires strict pass_items and forbids unknown properties at every level", () => {
    const schema = JSON.parse(readFileSync(new URL("../../schemas/reviewer-output.schema.json", import.meta.url), "utf8"));
    expect(schema.required).toContain("pass_items");
    expect(schema.additionalProperties).toBe(false);
    for (const key of ["findings", "checklist", "pass_items", "skillResults"]) expect(schema.properties[key].items.additionalProperties).toBe(false);
    expect(schema.properties.findings.items.properties.late_finding).toEqual({ type: "boolean" });
    expect(schema.properties.findings.items.properties.rule_id.pattern).toBe("^(?:(?:DIR|DET)-)?[CH][1-9][0-9]*$");

    for (const mutate of [
      (item) => { item.output.extra = true; },
      (item) => { item.output.pass_items[0].extra = true; },
      (item) => { item.output.checklist[0].extra = true; },
    ]) {
      const item = fixture(); mutate(item); expect(validate(item).valid).toBe(false);
    }
  });

  it("enforces verdict/finding rules and rejects hollow evidence", () => {
    const revise = fixture({ verdict: "revise_required" });
    revise.output.checklist.find(({ id }) => id === "H1").passed = false;
    revise.output.pass_items = revise.output.pass_items.filter(({ rule_id }) => rule_id !== "H1");
    revise.output.findings = [{ file: "src/a.mjs", line: 12, rule_id: "H1", severity: "blocking", issue: "错误分支会提交不完整状态", evidence: "src/a.mjs:12 在写入完成前发布状态", suggested_fix: "把发布移动到原子写入成功之后", late_finding: true }];
    expect(validate(revise).errors).toEqual(expect.arrayContaining([expect.stringMatching(/rootCause/), expect.stringMatching(/fixApproach/)]));
    revise.output.rootCause = "状态发布和持久化没有共享提交边界"; revise.output.fixApproach = "先完成原子持久化，再发布成功状态";
    expect(validate(revise).errors).toEqual([]);

    const passBlocking = fixture(); passBlocking.output.findings = revise.output.findings;
    expect(validate(passBlocking).errors).toContain("pass verdict cannot contain a blocking finding");
    for (const field of ["artifact_anchor", "evidence"]) {
      const hollow = fixture(); hollow.output.pass_items[0][field] = "已检查通过"; expect(validate(hollow).valid).toBe(false);
    }
  });

  it("normalizes punctuation and rejects long combinations of hollow evidence without rejecting anchors", () => {
    const hollow = " 已检查通过，全部符合要求。 ";
    for (const mutate of [
      (item) => { item.output.summary = hollow; },
      (item) => { item.output.checklist[0].evidence = hollow; },
      (item) => { item.output.pass_items[0].evidence = hollow; },
    ]) { const item = fixture(); mutate(item); expect(validate(item).valid).toBe(false); }
    for (const mutate of [
      (item) => { item.output.skillResults[0].evidence = hollow; },
      (item) => { item.output.skillResults[0].conclusion = hollow; },
      (item) => { item.output.skillResults[0].checked_objects = [`${hollow}:通过`]; },
    ]) { const skill = fixture({ stage: "build-plan" }); mutate(skill); expect(validateReviewerOutput({ stage: "build-plan", output: skill.output }).valid).toBe(false); }
    const specific = fixture(); specific.output.summary = "src/reviewer.mjs:42 对 hash 9f86d081 的失败分支返回 BUSINESS_INVALID。";
    expect(validate(specific).valid).toBe(true);
  });

  it("rejects repeated English pass boilerplate without treating pass inside real words as boilerplate", () => {
    const hollow = fixture(); hollow.output.summary = "pass pass pass";
    expect(validate(hollow).valid).toBe(false);
    const specific = fixture(); specific.output.summary = "src/auth.mjs:19 preserves compassion mode behavior";
    expect(validate(specific).valid).toBe(true);
  });

  it("requires a duplicate-free checklist covering every stage contract check id", () => {
    const direction = fixture({ stage: "make-decision", reviewTrack: "direction" });
    direction.output.checklist = ["DIR-C1", "DIR-C2", "DIR-C3", "DIR-C4", "DIR-C5", "DIR-H1", "DIR-H2", "DIR-H3"].map((id) => ({ id, passed: true, evidence: `raw_requirement:${id} 有对应审查证据。` }));
    direction.output.pass_items = direction.output.checklist.map(({ id }) => ({ rule_id: id, artifact_anchor: `raw_requirement:${id}`, evidence: `${id} 的需求证据具体且可定位。` }));
    expect(validateReviewerOutput({ stage: "make-decision", reviewTrack: "direction", output: direction.output, packet: direction.packet, intent: direction.intent }).errors).toContain("checklist missing contract rule id: DIR-C6");
    direction.output.checklist.push({ ...direction.output.checklist[0] });
    expect(validateReviewerOutput({ stage: "make-decision", reviewTrack: "direction", output: direction.output, packet: direction.packet, intent: direction.intent }).errors).toContain("duplicate checklist id: DIR-C1");
  });

  it("enforces every selected C/H id and binds failed hard invariants to blocking findings", () => {
    const missingHard = fixture();
    missingHard.output.checklist = missingHard.output.checklist.filter(({ id }) => id !== "H3");
    missingHard.output.pass_items = missingHard.output.pass_items.filter(({ rule_id }) => rule_id !== "H3");
    expect(validate(missingHard).errors).toContain("checklist missing contract rule id: H3");

    const duplicateHard = fixture(); duplicateHard.output.checklist.push(structuredClone(duplicateHard.output.checklist.find(({ id }) => id === "H1")));
    expect(validate(duplicateHard).errors).toContain("duplicate checklist id: H1");

    const failedHard = fixture(); failedHard.output.checklist.find(({ id }) => id === "H1").passed = false;
    failedHard.output.pass_items = failedHard.output.pass_items.filter(({ rule_id }) => rule_id !== "H1");
    expect(validate(failedHard).errors).toContain("failed hard invariant requires blocking finding: H1");
    failedHard.output.findings = [{ file: "src/a.mjs", line: 12, rule_id: "H1", severity: "important", issue: "错误分支会提交不完整状态", evidence: "src/a.mjs:12 在写入完成前发布状态", suggested_fix: "把发布移动到原子写入成功之后" }];
    expect(validate(failedHard).errors).toContain("failed hard invariant requires blocking finding: H1");
    failedHard.output.findings[0].severity = "blocking";
    failedHard.output.verdict = "revise_required";
    failedHard.output.rootCause = "状态发布和持久化没有共享提交边界";
    failedHard.output.fixApproach = "先完成原子持久化，再发布成功状态";
    expect(validate(failedHard).errors).toEqual([]);
  });

  it("rejects finding, checklist, and pass-item rule ids outside the selected contract", () => {
    const finding = fixture(); finding.output.findings = [{ file: "src/a.mjs", line: 12, rule_id: "X1", severity: "minor", issue: "存在合同之外的审查意见", evidence: "src/a.mjs:12 展示该合同外意见", suggested_fix: "删除合同外 finding 并按合同重审" }];
    expect(validate(finding).errors).toContain("finding rule id is not in selected contract: X1");
    const checklist = fixture(); checklist.output.checklist.push({ id: "H99", passed: false, evidence: "unified_diff:a:1 不属于选中合同。" });
    expect(validate(checklist).errors).toContain("checklist id is not in selected contract: H99");
    const passItem = fixture(); passItem.output.pass_items.push({ rule_id: "C99", artifact_anchor: "unified_diff:a:1#C99", evidence: "该条目不属于选中合同规则。" });
    expect(validate(passItem).errors).toContain("pass item rule id is not in selected contract: C99");
  });

  it("accepts only rule ids from the selected make-decision track", () => {
    const direction = fixture({ stage: "make-decision", reviewTrack: "direction" });
    expect(validateReviewerOutput({ stage: "make-decision", reviewTrack: "direction", output: direction.output }).valid).toBe(true);
    const detail = fixture({ stage: "make-decision", reviewTrack: "detail" });
    expect(validateReviewerOutput({ stage: "make-decision", reviewTrack: "direction", output: detail.output }).errors).toEqual(expect.arrayContaining([
      "checklist id is not in selected contract: DET-C1",
      "pass item rule id is not in selected contract: DET-H1",
    ]));
  });

  it("matches required skillResults exactly and binds every attestation hash", () => {
    const item = fixture({ stage: "build-plan" });
    const call = () => validateReviewerOutput({ stage: "build-plan", output: item.output, packet: item.packet, intent: item.intent });
    expect(call().valid).toBe(true);
    item.output.skillResults.push(structuredClone(item.output.skillResults[0]));
    expect(call().errors).toContain(`duplicate skill result: ${item.output.skillResults[0].skill}`);
    item.output.skillResults.pop(); item.output.skillResults.push({ ...item.output.skillResults[0], skill: "unrequested-skill" });
    expect(call().errors).toContain("unexpected skill result: unrequested-skill");
    item.output.skillResults.pop(); item.output.packet_hash = "9".repeat(64);
    expect(call().errors).toContain("packet_hash does not match packet");
  });
});
