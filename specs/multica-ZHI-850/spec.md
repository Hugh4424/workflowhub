# 同 snapshot Phase 0 recovery hotfix 规格

## 1. 目标

为已经进入 Phase 1、但仍处于同一 snapshot 的 build-code 流程增加一次受控的 Phase 0 重开能力。该能力只修复 Phase 1→Phase 0 的恢复路径，不改变正常 Phase 推进、changed-snapshot 恢复、审查路由或历史记录语义。

成功恢复后，系统必须处于可执行一次全新正式 Phase 0 review 的状态；旧 review、旧阶段记录与旧凭证保持不变且不可作为这次 fresh review 的替代品。

## 2. 用户结果

- 合法恢复请求可把同 snapshot 的 Phase 1 原子地重开为 Phase 0。
- 非法、过期、重复或并发失败的请求不会产生部分成功，也不会改变当前 pointer。
- 重开后仅产生一次新的正式 Phase 0 review，结果按现有流程继续推进。
- changed-snapshot 及其他正常路径保持现有行为。

## 3. 锁定决策

1. 只支持 Phase 1→Phase 0 的同 snapshot 受控恢复。
2. 恢复凭证必须精确包含 `phase_subject.recovery_intent=same-snapshot-phase0-reopen`。
3. 缺少该字段、值不精确匹配，或把该凭证用于 changed-snapshot，都必须拒绝。
4. 成功路径只追加一次新记录，并原子翻转 pointer；旧记录不得修改。
5. 恢复能力受一次性门禁保护；replay 与并发请求不得造成第二次成功。
6. 恢复后只执行一次新的正式 Phase 0 review。
7. changed-snapshot 行为保持不变。

## 4. 范围

### 4.1 包含

- 现有 Phase 转换/恢复入口对上述 `recovery_intent` 的解析与校验。
- 同 snapshot、当前 Phase、历史闭合条件和一次性门禁校验。
- 新恢复记录的追加写与当前 pointer 的原子切换。
- replay、并发与原子失败处理。
- 重开后的 fresh Phase 0 review 调度约束。
- changed-snapshot 和正常 Phase 路径的回归验证。

### 4.2 不包含

- 新增通用回滚、任意 Phase 跳转、跨 snapshot 回退或历史记录改写能力。
- 修改审查 provider、profile、模型、材料协议或判定标准。
- 复用、改写或删除旧 Phase 0 review 结果。
- 改变 changed-snapshot 现有恢复规则。
- 新增公开 endpoint、CLI 命令或新的外部错误码体系；失败沿用现有入口的错误通道，并提供下文规定的可区分语义。

## 5. 术语与状态模型

- **snapshot**：现有 build-code 流程用于绑定阶段记录与审查材料的不可变 snapshot 标识。
- **当前 pointer**：现有系统用于指向当前有效阶段记录的权威引用。
- **来源 Phase 1 记录**：恢复请求发起时，当前 pointer 指向的、与请求 snapshot 相同的有效 Phase 1 记录。
- **恢复记录**：成功恢复时新增的唯一 Phase 0 reopen 记录，绑定来源 Phase 1 记录、同一 snapshot 和恢复 intent。
- **一次性门禁**：对同一 snapshot 的该恢复动作只允许一次成功。是否成功以权威 pointer/正式记录状态为准，不能仅依赖进程内锁。
- **历史闭合条件**：现有 Phase 1 状态成立所依赖的全部正式闭合事实。恢复不得绕过既有闭合校验；任一必需事实缺失、失配、不可读或未正式接受，都视为不满足。
- **fresh Phase 0 review**：重开后基于当前同 snapshot 材料新建的正式 Phase 0 review；不得复用任何旧结果或旧 attempt 充当本次结果。

### 5.1 唯一允许的状态转换

`current Phase 1 + same snapshot + exact recovery intent + complete historical closure + unused recovery gate → one new Phase 0 reopen record + pointer to that record`

其余输入均不得触发该转换。

## 6. 功能要求

### FR-001｜精确凭证

恢复入口必须要求凭证中存在 `phase_subject.recovery_intent`，且值按区分大小写的完整字符串比较，必须等于 `same-snapshot-phase0-reopen`。缺字段、空值、前后空白、大小写变化、别名、额外前后缀或其他值均不匹配。

### FR-002｜用途限制

该 intent 只可用于当前 pointer 为 Phase 1、请求 snapshot 与来源 Phase 1 snapshot 精确相同的 Phase 0 reopen。用于其他 Phase、changed-snapshot、无当前 Phase 1、或来源记录不匹配时必须拒绝。

### FR-003｜权威来源校验

校验必须读取当前权威 pointer 与其指向的正式记录。调用方提供的 Phase、snapshot、来源引用或派生状态不能替代权威状态。来源记录不存在、不可读、类型错误、未正式接受或与 pointer 不一致时必须拒绝。

### FR-004｜历史闭合完整性

恢复前必须通过现有的正式闭合校验，覆盖来源 Phase 1 所依赖的全部必需记录、凭证和接受状态。任何历史闭合项缺失、哈希/引用失配、状态未接受或不可读时必须拒绝。hotfix 不得降低或复制一套更宽松的闭合规则。

### FR-005｜一次性门禁

每个 snapshot 的同 snapshot Phase 0 reopen 最多成功一次。第一次成功后，使用相同或等价请求再次调用，即使流程已继续推进，也必须识别为 replay 并拒绝，不得追加第二条成功恢复记录、不得再次翻转 pointer、不得再触发 Phase 0 review。

### FR-006｜追加写与旧记录不变

成功恢复必须创建且只创建一条新的正式恢复记录。现有 Phase 0、Phase 1、review、receipt、attempt 和其他历史记录的内容、引用与接受事实不得被更新、覆盖或删除。

### FR-007｜原子提交

对外可观察结果必须是以下二选一：

1. 成功：一条新恢复记录已持久化，pointer 已指向该记录，一次性门禁已生效；
2. 失败：pointer 与门禁保持调用前状态，且不存在可被后续流程当作成功恢复使用的新记录。

记录写入、门禁占用与 pointer 翻转不得暴露中间成功状态。pointer 翻转必须以调用开始时读取的来源 Phase 1 pointer 为比较条件；条件不再成立时按冲突失败。

### FR-008｜并发竞争

两个或更多针对同一来源 Phase 1/snapshot 的合法请求并发执行时，最多一个成功。失败者必须返回可区分的 conflict 或 replay 语义；最终只能有一条可达的成功恢复记录、一个生效门禁和一个指向该记录的 pointer。

### FR-009｜故障恢复

在校验、记录准备、持久化、门禁生效或 pointer 翻转任一步发生异常时，不得报告成功。重试必须重新从权威 pointer 和正式记录校验；不得依赖可能陈旧的进程内状态。实现可以保留不可达的内部临时数据，但它不得满足正式记录读取、门禁或后续阶段推进条件。

### FR-010｜fresh review

恢复成功后，流程必须仅调度一次新的正式 Phase 0 review。该 review 必须绑定恢复后的当前记录与同一 snapshot，并生成新的正式 attempt/result 轨迹；旧 Phase 0 review 不得被视为本次完成。若 review 失败或 unavailable，沿用现有 Phase 0 review 失败语义，不得自动重复恢复或绕过 review。

### FR-011｜失败语义

沿用现有入口的错误封装，同时让调用方和测试可区分以下语义：

- intent 缺失或不匹配；
- intent 用途错误或 snapshot 不同；
- 当前状态/来源记录失配；
- 历史闭合不完整；
- replay；
- 并发 pointer 冲突；
- 原子持久化失败。

所有拒绝与失败都不得改变有效 pointer、一次性门禁、历史记录或 review 调度状态。

### FR-012｜回归隔离

未携带该 exact intent 的正常 Phase 流程必须保持现有行为。changed-snapshot 请求必须继续走原有路径；即使携带该 intent 也不得进入本 hotfix 的恢复路径。审查路由、材料、provider/profile 选择和正式判定规则保持不变。

## 7. 接口与数据约束

### 7.1 输入

沿用现有 Phase 转换/恢复入口和凭证结构，只增加对既有嵌套位置的规范校验：

```json
{
  "phase_subject": {
    "recovery_intent": "same-snapshot-phase0-reopen"
  }
}
```

该片段不是完整凭证；其他既有必填字段继续按现有协议校验。不得把 intent 从 query、环境变量、自由文本或其他未认证来源补入凭证。

### 7.2 新恢复记录

新记录必须使用现有正式记录体系，至少可验证地绑定：

- 来源 Phase 1 记录；
- 与来源完全相同的 snapshot；
- 目标 Phase 0 reopen 语义；
- exact recovery intent；
- 一次性门禁所需的稳定身份；
- 既有完整性/接受机制要求的字段。

具体序列化沿用现有记录 schema；本 hotfix 不建立第二套记录或 pointer 存储。

### 7.3 输出

成功返回沿用现有入口格式，并只在原子提交完成后返回。失败沿用现有错误封装，满足 FR-011 的语义可区分性，不要求新增公共错误码。

## 8. 验收标准

### AC-001｜合法恢复

给定当前 pointer 指向已正式接受的 Phase 1、snapshot 相同、历史闭合完整、门禁未使用，且凭证包含 exact intent；执行恢复后：仅新增一条正式恢复记录，pointer 指向它，旧记录逐字节不变，门禁生效。

### AC-002｜缺少 intent

删除 `phase_subject.recovery_intent` 后请求恢复；请求被拒绝，pointer、门禁、历史记录和 review 调度均不变。

### AC-003｜intent 错配矩阵

分别使用空值、大小写变化、首尾空白、相近别名、额外前后缀和任意其他值；每次均被拒绝，且无状态变化。

### AC-004｜错误用途

分别在非 Phase 1、来源记录不匹配、无有效当前 Phase 1 的情况下使用 exact intent；每次均被拒绝，且无状态变化。

### AC-005｜changed-snapshot 隔离

对 changed-snapshot 请求携带 exact intent；不得进入本恢复路径。changed-snapshot 原有成功与失败用例的结果保持基线一致。

### AC-006｜历史闭合缺项矩阵

对现有闭合校验的每类必需事实，至少覆盖缺失、引用/完整性失配、未正式接受和不可读四类代表用例；每次恢复均被拒绝，且无状态变化。

### AC-007｜replay

合法请求成功一次后，原样重放及构造语义等价请求；全部被拒绝。成功恢复记录总数仍为一，pointer 不发生第二次恢复翻转，不产生第二次 Phase 0 review。

### AC-008｜并发

用可重复的同步点让至少两个合法请求竞争同一来源 pointer；断言恰好一个成功，其余返回 conflict 或 replay 语义。最终只有一条可达成功恢复记录和一次 review 调度。

### AC-009｜原子故障注入

分别在正式记录持久化、门禁生效和 pointer 翻转边界注入失败；断言调用不报告成功，pointer 与有效门禁保持调用前状态，不存在可被后续读取为成功恢复的记录。清除故障后可按权威状态安全重试。

### AC-010｜fresh Phase 0 review

合法恢复后断言只创建一次新的正式 Phase 0 review，绑定恢复记录与同一 snapshot，且其 attempt/result 身份不同于旧 review。旧结果不能满足新 review 的完成条件。

### AC-011｜review 失败

让新的 Phase 0 review 返回正式失败或 unavailable；断言沿用现有失败处理，不再次执行恢复、不追加第二条恢复记录、不重用旧 review 作为成功。

### AC-012｜历史不可变

恢复前后对全部既有 Phase、review、receipt 与 attempt 记录做内容摘要比较；断言全部未变，仅出现预期的新恢复记录和 fresh review 轨迹。

### AC-013｜正常路径回归

运行现有正常 Phase 推进、无 intent 请求、changed-snapshot 和审查路由测试；结果与 hotfix 前基线一致。新增测试不得依赖真实外部 provider，应使用既有确定性测试替身或固定夹具。

## 9. 边界与异常

- intent 正确但凭证其他字段无效：按现有凭证校验失败，不进入恢复。
- snapshot 文本相似但身份不完全相同：按 changed/mismatch 处理，不进入恢复。
- pointer 在校验后被其他请求推进：比较并翻转失败，按并发冲突处理，不回退新 pointer。
- 历史数据来自旧版本但不能满足当前既有闭合读取规则：拒绝恢复；不得自动补写、迁移或猜测缺失事实。
- fresh review 已开始但进程中断：由现有 review 幂等/恢复机制处理；不得再次消费 Phase 0 recovery 门禁来制造第二次 review。
- 旧 review 与新材料恰好相同：仍须建立新的正式 review 轨迹，不能把旧结果直接当作本次完成。

## 10. 假设

- 现有系统已有权威 pointer、正式追加写记录、正式接受状态、闭合校验和 Phase 0 review 调度能力。
- 现有持久化层能提供比较式 pointer 更新或等价的原子事务能力。
- 现有错误通道可承载 FR-011 的可区分语义，不需扩展外部协议。

假设不成立时，build-plan 必须把它列为阻塞，不得通过扩大 hotfix 范围自行引入新的存储系统或恢复协议。

## 11. 风险与控制

- **竞态导致双恢复**：以权威 pointer 比较更新和持久化一次性门禁控制；用同步并发测试验证。
- **部分写造成伪成功**：以 FR-007 的原子可观察结果和故障注入验证。
- **旧 review 被错误复用**：用新 attempt/result 身份和一次调度断言验证。
- **旧数据闭合不足**：失败关闭，不自动修补历史。
- **hotfix 污染 changed-snapshot**：以用途校验和回归矩阵隔离。

## 12. 下游实现约束

build-plan 必须逐项映射 FR-001～FR-012 与 AC-001～AC-013，并明确：

1. 复用哪一个现有权威闭合校验；
2. pointer 比较更新与一次性门禁如何形成原子边界；
3. fresh Phase 0 review 如何保证一次调度且不复用旧结果；
4. 并发同步点、故障注入点和 changed-snapshot 回归夹具；
5. 若任一“假设”不成立，先回报阻塞，不扩大本 hotfix 范围。

## 13. 歧义扫描与一致性检查

- `spec-clarify: trigger=false — no material ambiguity`。上游已锁定恢复方向、exact intent、一次性门禁、原子/追加写、fresh review 和 changed-snapshot 边界；剩余实现选择不改变范围或验收。
- 全部功能要求均有稳定 ID；AC 覆盖成功、拒绝、闭合缺项、replay、并发、原子故障、fresh review 与回归。
- 未引入任意回滚、跨 snapshot 回退、历史修复或审查路由变更。
