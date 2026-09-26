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
  const decisionLog = readFileSync(fileURLToPath(new URL("../../specs/workflowhub-thin-core-card-05-20260919/decision-log.md", import.meta.url)), "utf8");
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

it("retains the legacy M6 freeze packet interpretation", () => {
  const fact = validateDecisionFreeze({ decisionLog: `### M6\n- direction-level open question\n- 用户流程 / 数据状态 / 成败边界 / 非目标`, ...identity });
  expect(fact.errors).toContain("direction-level questions remain unresolved");
  expect(fact.coverage).toEqual(["user_flow", "data_states", "success_failure_boundaries", "non_goals"]);
});
