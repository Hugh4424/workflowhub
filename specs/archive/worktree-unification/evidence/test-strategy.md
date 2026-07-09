---
ac_routes:
  AC-01: skip
  AC-02: skip
  AC-03: skip
  AC-04: skip
---

# Test Strategy: worktree-unification

## 豁免声明

本次 build-code 变更为纯文档/skill定义变更，涉及文件：
- `workflows/build-spec/SKILL.md`
- `workflows/build-plan/SKILL.md`
- `workflows/verify-code/SKILL.md`
- `checklists/acceptance.md`

无可执行测试命令（`facts.tests.command` 缺失）。人工裁定豁免 fresh 测试执行。

## AC 路由表

| AC ID | 路由  | 原因 |
|-------|-------|------|
| AC-01 | skip  | doc-only change, no executable test command, human-approved skip (决策见 [ZHI-88](mention://issue/69fe45c2-ce97-49df-8f08-8a0d995f2891) comment cb3945ac) |
| AC-02 | skip  | doc-only change, no executable test command, human-approved skip (决策见 [ZHI-88](mention://issue/69fe45c2-ce97-49df-8f08-8a0d995f2891) comment cb3945ac) |
| AC-03 | skip  | doc-only change, no executable test command, human-approved skip (决策见 [ZHI-88](mention://issue/69fe45c2-ce97-49df-8f08-8a0d995f2891) comment cb3945ac) |
| AC-04 | skip  | doc-only change, no executable test command, human-approved skip (决策见 [ZHI-88](mention://issue/69fe45c2-ce97-49df-8f08-8a0d995f2891) comment cb3945ac) |

## 机器核查结果

spec AC 列表（匹配 `^AC-\d+$`）：AC-01, AC-02, AC-03, AC-04

核查规则：
1. 每条 spec AC 必须在 ac_routes 中出现 -> 全部出现，PASS
2. 路由值必须是 P0/P1/P2/P3/skip 之一 -> 全部为 skip，PASS
3. ac_routes 中的 key 必须都在 spec AC 列表中 -> 全部匹配，PASS

机器核查：全部通过，无 MISSING_ROUTE / UNKNOWN_AC 错误。
