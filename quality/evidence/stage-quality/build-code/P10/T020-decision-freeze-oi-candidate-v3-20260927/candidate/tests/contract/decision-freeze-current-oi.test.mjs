import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";
import { validateDecisionFreeze } from "../../runtime/stage/stage-content-contracts.mjs";

const identity = { material_revision: `revision-${"a".repeat(64)}`, snapshot_tree: "b".repeat(40) };
const oi = (id, category, status) => `\`\`\`yaml\noi_id: ${id}\ncategory: ${category}\nstatus: ${status}\n\`\`\``;
const authority = (status = "confirmed") => `### OI 记录（解析器权威记录，YAML）
${oi("OI-001", "complete_user_flow", status)}
${oi("OI-002", "data_state", "confirmed")}
${oi("OI-003", "success_failure_boundary", "deferred")}
${oi("OI-004", "non_goals", "confirmed")}

## 历史说明
方向级问题在旧修订中 open，现已裁决。`;

it("uses the current YAML OI authority instead of append-only historical prose", () => {
  const decisionLog = readFileSync(fileURLToPath(new URL("../../specs/archive/workflowhub-thin-core-card-05-20260919/decision-log.md", import.meta.url)), "utf8");
  const fact = validateDecisionFreeze({ decisionLog, ...identity });
  expect(fact.coverage).toEqual(["user_flow", "data_states", "success_failure_boundaries", "non_goals"]);
  expect(fact.errors).not.toContain("direction-level questions remain unresolved");
  expect(fact.ok).toBe(false); // Approval and current identity still require their own authenticated facts.
  expect(fact.errors).toContain("freeze approval is not accepted by all three sources");
});

it("keeps a genuinely open current OI or CF as an unresolved direction", () => {
  const openOi = validateDecisionFreeze({ decisionLog: authority("open"), ...identity });
  expect(openOi.errors).toContain("direction-level questions remain unresolved");
  const openCf = validateDecisionFreeze({ decisionLog: `${authority()}

## 独立替代审查发现的未决冲突（须用户裁决）
### CF-1（方向冲突）
| 字段 | 内容 |
|---|---|
| **状态（当前）** | open，待用户裁决 |
`, ...identity });
  expect(openCf.errors).toContain("direction-level questions remain unresolved");
});

it("does not infer a missing current category from historical prose", () => {
  const decisionLog = authority().replace(oi("OI-002", "data_state", "confirmed"), "");
  const fact = validateDecisionFreeze({ decisionLog, ...identity });
  expect(fact.errors).toContain("freeze packet is missing data_states");
});

it("does not fill a missing current OI from historical prose or YAML", () => {
  const old = `${oi("OI-099", "data_state", "confirmed")}\n数据状态已覆盖。`;
  const decisionLog = authority().replace(oi("OI-002", "data_state", "confirmed"), "") + `\n\n## 旧记录\n${old}`;
  const fact = validateDecisionFreeze({ decisionLog, ...identity });
  expect(fact.coverage).not.toContain("data_states");
  expect(fact.errors).toContain("freeze packet is missing data_states");
});

it("takes current open OI and current CF status over historical resolved prose", () => {
  const openOi = validateDecisionFreeze({ decisionLog: authority("open") + "\n旧版本已经 RESOLVED。", ...identity });
  expect(openOi.errors).toContain("direction-level questions remain unresolved");
  const openCf = validateDecisionFreeze({ decisionLog: `${authority()}\n\n## 独立替代审查发现的未决冲突（须用户裁决）\n### CF-1（当前冲突）\n| 字段 | 内容 |\n|---|---|\n| **状态（当前）** | open，待用户裁决 |\n\n## 历史裁决\nCF-1 RESOLVED by D-001`, ...identity });
  expect(openCf.errors).toContain("direction-level questions remain unresolved");
});

it.each([
  ["broken YAML", authority().replace("category: data_state", "category: [")],
  ["duplicate OI", authority().replace("## 历史说明", `${oi("OI-001", "data_state", "confirmed")}\n## 历史说明`)],
  ["missing category", authority().replace("category: data_state\n", "")],
  ["invalid category", authority().replace("category: data_state", "category: invented")],
  ["missing status", authority().replace("status: confirmed\n", "")],
  ["invalid status", authority().replace("status: confirmed", "status: invented")],
  ["empty authority", authority().replace(/```yaml[\s\S]*?```/g, "")],
  ["duplicate authority heading", `${authority()}\n### OI 记录（解析器权威记录，YAML）\n${oi("OI-099", "data_state", "confirmed")}`],
])("fails closed for %s even when old text claims completion", (_case, decisionLog) => {
  const fact = validateDecisionFreeze({ decisionLog: `${decisionLog}\n\n## 旧状态\n全部类别已确认，方向问题已解决。`, ...identity });
  expect(fact.ok).toBe(false);
  expect(fact.errors.some((error) => error.startsWith("current OI authority "))).toBe(true);
});

it.each([
  ["missing", ""],
  ["ambiguous", "| **状态（当前）** | maybe |"],
])("fails closed when current CF status is %s", (_case, statusRow) => {
  const decisionLog = `${authority()}\n\n## 独立替代审查发现的未决冲突（须用户裁决）\n### CF-1（当前冲突）\n| 字段 | 内容 |\n|---|---|\n${statusRow}\n历史文字写着 RESOLVED by D-001`;
  const fact = validateDecisionFreeze({ decisionLog, ...identity });
  expect(fact.ok).toBe(false);
  expect(fact.errors.some((error) => error.startsWith("current CF "))).toBe(true);
});

it.each([
  ["unsupported fence", "```toml\noi_id = 'OI-099'\n```"],
  ["unclosed fence", "```yaml\noi_id: OI-099"],
  ["stray close", "```"],
])("rejects %s even after four valid current OI categories", (_case, badFence) => {
  const decisionLog = authority().replace("## 历史说明", `${badFence}\n## 历史说明`);
  const fact = validateDecisionFreeze({ decisionLog, ...identity });
  expect(fact.coverage).toEqual(["user_flow", "data_states", "success_failure_boundaries", "non_goals"]);
  expect(fact.errors.some((error) => error.startsWith("current OI authority "))).toBe(true);
});

it.each([
  ["open overrides approval", "| **状态（当前）** | open，待裁决 |", "confirmed", true],
  ["OI still open", "", "open", true],
  ["decision missing", "", "confirmed", false],
])("does not let a CF approval note hide %s", (_case, statusRow, oiStatus, includeDecision) => {
  const currentOi = authority().replace("## 历史说明", `${oi("OI-031", "success_failure_boundary", oiStatus)}\n## 历史说明`);
  const decision = includeDecision ? "\n### D-021\n- decision: 用户已显式批准 OI-031 的处置。" : "";
  const cf = `\n## 独立替代审查发现的未决冲突（须用户裁决）\n### CF-5（已由用户裁决）\n| 字段 | 内容 |\n|---|---|\n${statusRow}\n| **用户裁决（当前）** | 用户已**显式批准** OI-031 的处置。 |\n| 本修复的落地 | D-021 的决定已更新。 |`;
  const fact = validateDecisionFreeze({ decisionLog: `${currentOi}${decision}${cf}`, ...identity });
  expect(fact.ok).toBe(false);
  expect(fact.errors.some((error) => /(?:current CF|direction-level questions remain unresolved)/.test(error))).toBe(true);
});

it.each([
  ["double backtick typo", "``yaml\noi_id: OI-099\n``"],
  ["bare OI record", "oi_id: OI-099\ncategory: data_state\nstatus: confirmed"],
])("rejects %s outside complete fences after all four categories", (_case, malformed) => {
  const decisionLog = authority().replace("## 历史说明", `${malformed}\n## 历史说明`);
  const fact = validateDecisionFreeze({ decisionLog, ...identity });
  expect(fact.coverage).toEqual(["user_flow", "data_states", "success_failure_boundaries", "non_goals"]);
  expect(fact.errors.some((error) => error.startsWith("current OI authority "))).toBe(true);
});

it("requires the named D decision to approve the same OI in one current sentence", () => {
  const currentOi = authority().replace("## 历史说明", `${oi("OI-031", "success_failure_boundary", "confirmed")}\n## 历史说明`);
  const wrongDecision = "\n### D-021\n- decision: 用户已显式批准 OI-999 的处置。\n- note: OI-031 是另一项。\n### D-022\n- decision: 用户已显式批准 OI-031 的处置。";
  const cf = "\n## 独立替代审查发现的未决冲突（须用户裁决）\n### CF-5（已由用户裁决）\n| 字段 | 内容 |\n|---|---|\n| **用户裁决（当前）** | 用户已**显式批准** OI-031 的处置。 |\n| 本修复的落地 | D-021 的决定已更新。 |";
  const fact = validateDecisionFreeze({ decisionLog: `${currentOi}${wrongDecision}${cf}`, ...identity });
  expect(fact.errors).toContain("current CF CF-5 has no verified current disposition");
});

it("retains the legacy M6 freeze packet interpretation", () => {
  const fact = validateDecisionFreeze({ decisionLog: `### M6\n- direction-level open question\n- 用户流程 / 数据状态 / 成败边界 / 非目标`, ...identity });
  expect(fact.errors).toContain("direction-level questions remain unresolved");
  expect(fact.coverage).toEqual(["user_flow", "data_states", "success_failure_boundaries", "non_goals"]);
});
