# Task Plan: 移除外部 Stage Agent 阻塞

## Goal

让 WorkflowHub 在没有外部 Stage Agent、bridge 或宿主 session/outcome 的情况下，仍能由当前主会话按宪法完成 build-code/verify-code；外部宿主只能是可选适配，不得成为推进、质量或正式 run 的前置条件。

## Next Step

回到当前任务：保留 `code_review` 缺失事实，按用户授权范围继续 verify-code；不再补外部 Stage Agent/bridge/session/outcome，不执行 commit/push/merge/close。

## Current Phase

Phase 1 — 复现阻塞并核对宪法/当前合同

## Phases

### Phase 1: 复现与根因定位

- [x] 读取 CONSTITUTION、checklist、当前四份材料和 verify-code manifest
- [x] 用最小正式 run 复现“无外部 Stage Agent”后的阻塞
- [x] 沿 producer → schema → canonical writer → facts/index/consumer 画出证据链
- [x] 验证 3–5 个假设并确定最小正确 owner
- **Status:** completed

### Phase 2: 设计修复边界

- [x] 明确主会话执行、质量 review、stage outcome、reflection 的独立语义
- [x] 确定需要删除/降级的 bridge、receipt、manifest、completion 依赖
- [x] 登记唯一 consumer、owner、替代关系和删除条件
- **Status:** completed

### Phase 3: 实施与回归

- [x] 在当前 task worktree 修改生产代码和当前合同测试
- [x] 先写最小 RED，再实现 GREEN
- [x] 运行受影响的定向测试和公共 CLI smoke
- [x] 保留 unavailable/unknown/incomplete 事实，不伪造 Stage Agent outcome
- **Status:** completed

### Phase 4: 回到当前任务

- [x] 重新读取当前 verify-code 状态和 task facts
- [x] 按修复后的主会话路径完成 verify-code 当前事实
- [x] 重新跑必要审查/验证，不重复无疑点的 provider review
- **Status:** completed

### Phase 5: 交付前审计

- [x] 核对 main 未提交改动是否需要合并
- [x] 分离质量、release、Git delivery、physical close
- [x] 在 close 前向用户汇报；未获授权不 commit/push/merge/close
- **Status:** completed

## Ranked Hypotheses

1. `stage-runtime` 将可选 Stage Agent outcome 错当 verify-code 完成前置。
2. `dsh-code-review` 被错误建模为外部宿主 producer，而非当前主会话步骤。
3. `quality_review`、`code_review`、`stage_outcome` 三条事实链被错误合并。
4. bridge/local runner 形成了违宪的第二控制面，并被错误纳入正式 run 输入。

## Errors Encountered

| Error | Attempt | Resolution |
|---|---:|---|
| `quality_status=incomplete`, `code_review=missing`, `stage_outcome_missing` | 1 | 已证明 stage outcome 不是当前推进前置；保留 `code_review=missing`，不把 `unavailable` 改写为完成 |
