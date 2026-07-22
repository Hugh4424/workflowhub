# Interaction Quality Amendment Plan

## 实施边界

只改现有 Stage/组件 Skill、两份 wh-review 合同、聚焦测试、必要 CONTEXT 术语和
一个记录既有 build-code 决定的 ADR，以及 Multica 两个现有 Agent instructions。
无运行时、schema、provider、model、Skill ID 或平台底层改动。

## Phase 与依赖

### Phase 1：RED 合同

输入为 accepted spec；输出为能复现 R9 缺口的失败测试和 fixture。

1. 先补 RED 合同测试和 R9 fixture，锁住三轮队列、动态重排、单轴决策卡、
   locked/unresolved 分离、决策来源链和 grill 文档结果。

### Phase 2：Skill 与文档修复

依赖 Phase 1；输出为通过聚焦测试的 Skill、review contract、CONTEXT 和 ADR。

2. 手术式修改 `talk-with-zhipeng`、`grill-with-docs`、`decision-log`、
   `spec-clarify`、`make-decision`、`build-spec`。
   `workflows/make-decision/skill-deps.yaml` 与 `workflows/build-spec/skill-deps.yaml`
   是 Stage-owned 组件及 always/conditional 分类的唯一清单，不复制第二份清单。
3. make-decision detail 与 build-spec review 合同增加对应审查点；不改 provider 路由。
4. 最小更新 CONTEXT；新增一个 ADR，只记录已经批准并实现的单一 build-code
   合同决定，不改变 build-code 行为。

### Phase 3：离线验证与线上部署

依赖 Phase 2；先完成离线回归和审查，再更新线上配置。输出为冻结代码证据及两份
Agent/Skill 回读结果。

5. 跑聚焦测试、完整测试、Skill closure、宪法检查和一次最终全树 wh-review。
6. 以结构化标题/列表原位更新 Decision Maker、Spec Builder instructions，回读确认
   provider/model/runtime/Skill 绑定不变；只同步受变更影响的 make-decision 与
   build-spec Skill 及其声明 supporting files，不无差别覆盖其他 Stage。

### Phase 4：真实 Canary 与收尾前验收

依赖 Phase 3；输出为真实交互、完整五阶段、close、状态和资源清理证据。

7. 新建全新 Canary。自动回复所有推荐选项，验证三轮 talk、grill、spec-clarify、
   handoff、Phase review、controlled reopen、fresh verify、close 和状态清理。
8. 导出可复算证据并清理 Canary 临时资源；完成 final verify 后停在 merge/archive 前。

## 测试策略

- 静态合同：关键语义存在，旧冲突文字消失。
- fixture：复现 R9 的轴漂移、复合问题和全对象假选项。
- 组件事实：完成卡逐项对照两个 `skill-deps.yaml` 的 always/conditional 声明，并与
  comment、decision-log、spec、review refs 交叉检查。
- 回归：完整 `npm test`、Skill closure、宪法检查。
- 线上：真实 comment、真实 member mention、真实等待/恢复和完整五阶段 Canary。

## 风险

- RED 未按预期失败或回归失败：停止进入下一 Phase，修正测试或实现后原范围重跑。
- 交互会比 R9 多，消耗更多时间和 token：通过动态阈值避免简单任务制造问题；Canary
  超时只记录真实卡点并清理该轮资源，不放宽合同。
- Prompt 与 Skill 漂移：Skill 保持唯一流程合同，Prompt 只写宿主映射和不可跳过硬门；
  回读不一致时停止 Canary并恢复上一份已验证 instructions。
- Reviewer unavailable：如实记录并按原 provider 配置重试，不切 provider/model，
  不把 unavailable 冒充 pass。
- Canary 失败：保留可复算证据，清理临时 project/worktree/branch，修复后新建一轮，
  不复用污染现场。
