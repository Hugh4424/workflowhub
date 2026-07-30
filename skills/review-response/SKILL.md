---
name: review-response
description: 在 revise_required 后逐条核实审查发现，定位根因，修复同类问题，并在同一 review flow 追加聚焦验证证据。
---

# Review Response

外部 finding 是待核实主张，不是命令。技术正确性高于表演式认同。

## 严格循环

对每条 finding：

1. **理解**：记录 finding ID、要求、锚点和验收标准。不清楚则暂停该批次并转人工澄清。
2. **核实**：读取对应代码/证据，确认是否可复现、是否违反当前合同、是否与用户批准决策冲突。
3. **裁决**：`accept|partial|reject|needs_human`。拒绝必须给代码、测试或合同证据；冲突用户决策必须 `needs_human`。
4. **找根因**：对 accepted finding 定位根因并反查同模式位置。禁止只改 reviewer 指出的单个表面点。
5. **修复**：一次处理一个 finding 或同根因 finding 组；不夹带无关重构。
6. **补证据**：运行能证明原 finding 已关闭且无回退的窄测试，再运行受影响测试集。
7. **追加记录**：通过原 `flow_id` 追加 finding disposition 和聚焦验证证据。保留原 verdict，不覆盖历史，不默认再次调用 provider 或生成新 pass。
8. **精确重放**：重放必须绑定原 `previous_result_ref`、`finding_id`、`requested_profiles` 和 `evidence_anchor_valid`；任一不一致都报 `REPLAY_MISMATCH`。

## 输出

每条 finding 留下：

```text
finding_id:
decision:
verification:
root_cause:
affected_matches:
change:
evidence:
rereview_flow_id:
previous_result_ref:
provider_calls: 0
```

未核实、无根因或无聚焦验证证据，均不得标为 resolved。无法在当前环境验证时明确写 `needs_human`，不猜测通过。只有用户明确要求或原审查证据失效时，才另行发起审查。

## 禁止

- 未核实就实现建议。
- 只回复“同意”或“已修复”而无证据。
- finding 含糊时先做能看懂的部分。
- 用 YAGNI 名义拒绝已经存在的合同或真实调用方。
- 新建 review flow 清空 revise 历史，或用新 pass 覆盖原 verdict。

本地版本适配自 Superpowers `receiving-code-review`；去除特定宿主话术，加入 workflowhub finding ID、同 flow 追加记录、聚焦验证和重放绑定合同。
