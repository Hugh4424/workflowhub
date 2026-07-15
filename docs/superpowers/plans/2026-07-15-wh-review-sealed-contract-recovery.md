[[31mERROR[0m] - (starship::print): Under a 'dumb' terminal (TERM=dumb).
# wh-review × 3rd-review sealed contract 修复方案

状态：异源审查通过，待实施

## 1. 目标

恢复一条简单、稳定、可提前判定兼容性的审查链：

```text
wh-review: scan → optional sanitize → seal
3rd-review: validate → exact copy → verify → run → capture
wh-review: audit exact-copy receipt → normalize semantic result
```

本次只修跨仓材料交付协议回归。不得借机改 reviewer 合同、packet 结构、stage 流程或 provider 策略。

## 2. 已确认根因

- WorkflowHub `60063da` 与 3rd-review `e46b4fe` 原本共同采用 material protocol v5 / sealed exact-copy。
- WorkflowHub 后续 merge `e435cc9` 把 sealed consumer 的整组冲突文件选回旧 redaction consumer，形成混合版本。
- 当前 3rd-review 正确返回 `sealed_manifest_hash`、`provider_visible_manifest_hash`、`byte_identity: "verified"`；当前 WorkflowHub 却要求已废弃的 raw/derived/redaction receipt。
- OpenCode、Kimi 已实际完成；结果在 provider 返回后的 host attestation 审计被拒绝。
- 普通 `npm test` 默认跳过依赖 `THIRD_REVIEW_SOURCE_ROOT` 的真实跨仓测试；doctor 又没有声明 material protocol，因此未能提前发现。

## 3. 必须保留的边界

1. wh-review 冻结完整 packet、diff、合同、技能与测试证据。
2. provider 不读取真实 repo、不执行 git、不接触宿主绝对路径。
3. 3rd-review 逐字节复制 sealed bundle，复制后按文件 size/SHA-256 复验。
4. provider completed 不等于 semantic pass。
5. public/private delivery 必须一致；raw stdout/stderr 必须按 hash 保存。
6. transport/material/protocol/format 失败不得发布 semantic verdict，不得推进 semantic flow。
7. 同一 business flow 修复基础设施后可重试；不得要求人工 reset/new flow。未发布 attempt 可使用新 broker runtime，不做旧 runtime replay。

## 4. 明确删除的复杂度

- 不恢复 `lib/material-redaction.mjs`。
- 不恢复 raw/derived 双 workspace。
- 不恢复 `raw_material_manifest_hash`、`material_manifest_hash`、`material_representation` 或 redaction receipt。
- wh-review 不重演 3rd-review 内部脱敏算法，不读取 `redaction_roots`。
- 不维护长期双协议兼容层，不从 delivery 字段猜协议。
- 不恢复 `60063da` 的整组文件；其中混有已被后续修正的 packet/schema/模型 hash 需求。
- 不修改用户当前业务 spec、task evidence、旧 runtime 或 `~/.workflowhub/config.json`。

## 5. 唯一稳定交付合同

doctor 顶层新增：

```json
{
  "material_protocol": {
    "version": 5,
    "delivery_attestation": "sealed-exact-copy.v1"
  }
}
```

wh-review 在 provider 启动前精确要求这两个值；缺失或不匹配返回 `MATERIAL_PROTOCOL_MISMATCH`。该失败：

- 不启动 provider；
- 不创建 semantic round；
- 不 fallback；
- 不污染 active flow；
- 给出 expected/actual，不要求 reset。

`material_protocol` 单独校验，不纳入 provider capability snapshot hash。这样不会因为新增声明而让现有 V5 flow 被误判为 provider 能力变化；continuation 仍由 runtime 内 `attachments.protocol_version === 5` 和 sealed hash 链校验。

delivery receipt 固定为现有字段：

- `delivery_mode`
- `sealed_manifest_hash`
- `provider_visible_manifest_hash`，必须等于 sealed hash
- `byte_identity: "verified"`
- `material_total_bytes`
- 可选 `rendered_prompt_bytes`
- `provider_visible_attachment_manifest[]`：destination、size、SHA-256

raw stdout/stderr ref 继续只存 private runtime；其 SHA-256 可进入调用方私有证据，但不属于材料 attestation。

## 6. 文件范围

### WorkflowHub production：只改 2 个文件

1. `skills/wh-review/scripts/broker-client.mjs`
   - 人工移植 `31fd051` 的 exact-copy 审计语义。
   - 校验 public/private delivery 完全一致。
   - 校验 sealed hash、visible hash、byte identity、文件集合、total bytes 和真实 workspace bytes。
   - 删除 raw/derived/redaction 重算。
   - 保留当前 raw stream 复制、稳定错误分类、无外层 timeout。
   - 保留 `auditedMaterialBindings`，供无附件 `reuse_frozen_material` 格式纠正使用；binding 只能由 public/private 相同、workspace bytes 复验通过的 exact-copy receipt 建立。缺失、损坏或未完成审计的 binding 一律 fail closed。
   - doctor preflight 增加 material protocol 精确校验。

2. `skills/wh-review/scripts/review-round-facade.mjs`
   - expected delivery 改为 sealed/provider-visible/byte-identity。
   - initial、R2、格式纠正都绑定同一 sealed hash 链。
   - 删除 redaction、derived attestation、previous provider delivery 的旧语义。
   - 保留当前唯一 fenced JSON、同 session 最多两次格式纠正、provider-visible anchor、host-owned hash、合同校验、失败不污染 semantic flow、仅 aggregate 推进 flow。

### WorkflowHub tests/fixture

- `skills/wh-review/scripts/__tests__/broker-client.test.mjs`
- `skills/wh-review/scripts/__tests__/review-round-facade.test.mjs`
- `skills/wh-review/scripts/__tests__/wh-review-cli-continuation.test.mjs`
- `tests/wh-review-v4-workflow-wiring.test.mjs`
- `tests/wh-review-third-review-derived.integration.test.mjs`（保留文件名，本次不做无价值改名）
- `tests/fixtures/derived-review-provider.mjs`

### 3rd-review production

- 负责 doctor 输出的现有实现位置：新增 `material_protocol` 声明。
- `docs/adr/0001-v4-cli-contract.md`：补 doctor 协商和 mismatch 行为。
- `lib/broker.mjs` 的 exact-copy delivery 行为不改。

### 3rd-review tests

- doctor/CLI 输出字段。
- public/private delivery canonical equality。
- file_only、always_embed 都满足 sealed == visible、byte identity、逐文件 hash/size、total bytes。
- R2 delta 与 `reuse_frozen_material` 保持 protocol v5、同 session、同 exact-copy 语义。
- 明确断言不存在旧 redaction 字段。

## 7. 实施 phases

### Phase 0：隔离与基线

- 两仓分别从当前 main 新建平行 worktree。
- 不在 `workflowhub-audit-contract-layer`、`PaperBuilder-paperbuilder-phase-foundation` 的脏业务 worktree 改基础设施代码。
- 记录两仓 HEAD、实际 command realpath 和 doctor material protocol；不新增配置 hash 体系。
- 保存当前失败 runtime `992973b5-d2a0-45f9-9b4c-ed9ab26f9634` 为只读证据，不迁移、不修补。

完成条件：两开发 worktree clean；范围清单固定。

### Phase 1：恢复 exact-copy consumer

- 只改 WorkflowHub 两个 production 文件及四个 unit/wiring tests。
- 先用 fixture 证明当前 sealed receipt 可通过。
- 篡改 public delivery、private delivery、workspace 任一 byte/hash/size 时必须 fail closed。
- 格式纠正复用 binding，同 runtime/session，无附件重传。
- 格式纠正的 binding 缺失、delivery 被篡改或 workspace 复验失败时，与普通 tamper 相同 fail closed；不得退回 fresh provider、不得产生 semantic verdict。
- 对 `31fd051` 只做逐项语义移植：每个移植块记录 `source hunk → current target → kept current behavior`。禁止整文件 checkout，禁止带回模型 hash 回显、旧 packet schema 或已废弃字段。

完成条件：targeted tests 全绿；旧 redaction 字段在 production consumer 中归零。

回滚：单独回滚 Phase 1 commit。

### Phase 2：增加 fail-fast 协议声明

- 3rd-review doctor 声明 material protocol v5 / sealed-exact-copy.v1。
- wh-review preflight 精确校验；不加入 capability snapshot hash。
- 两仓各一个独立 commit，作为一个发布单元落地。
- 增加“doctor 宣称 v5/exact-copy，但 run 仍返回旧字段或缺 byte identity”的伪 producer fixture；host 必须在首次 receipt 审计拒绝，且不发布 semantic result。doctor 是兼容性预检，不替代运行时证据校验。

完成条件：旧/缺失 doctor 在 provider spawn 前稳定返回 `MATERIAL_PROTOCOL_MISMATCH`；新 doctor 正常进入 prepare/run。

回滚：两仓 Phase 2 commit 一起回滚；不保留半套声明。

### Phase 3：跨仓 deterministic E2E

- 显式使用 `THIRD_REVIEW_SOURCE_ROOT=/Users/Hugh/Hugh/Project/3rd-review`。
- R1 → 一次格式纠正 → R2。
- 断言同 runtime/session、完整 packet/diff/manifest、首中尾 marker、public/private receipt、workspace bytes、raw hash。
- fault injection：改一个 workspace byte、一个 public hash；两次均不得产生 semantic verdict/aggregate/pass，不得改变 active flow。
- 追加 correction binding 缺失/损坏 fault；不得 fresh fallback，不得换 session。
- 跨仓测试不得继续由普通 `npm test` 静默 skip：提供固定必跑命令，缺 source root 时明确标记“未执行”，发布清单不得把它算通过。

完成条件：deterministic E2E 全绿；没有 provider 成本。该命令是本次发布的人工 merge hard gate，不为所有日常提交新增重型 CI。

### Phase 4：两个真实业务 canary

只跑两条真实链，避免再次堆大矩阵：

- Audit canary 不直接修改当前 dirty worktree；从 `workflowhub/audit-contract-layer` 建临时平行 worktree，并只移植本修复 commits。
- PaperBuilder canary 不修改其业务 worktree；host/package root 显式指向已修复的 WorkflowHub 开发 worktree。
- canary 通过前不把修复合入任何业务分支。

1. WorkflowHub audit canary：真实 OpenCode，隔离 flow/task id，不覆盖当前 active flow。
2. PaperBuilder spec canary：真实 Kimi，隔离 flow/task id，不覆盖当前 active flow。

两条都验证：

- preflight protocol 匹配；
- provider completed；
- provider 看见完整材料 marker；
- public/private exact-copy receipt 与 workspace bytes 一致；
- business-valid semantic result 已发布；
- verify-final 绑定同一 snapshot tree/material chain。

完成条件：2/2 PASS。失败时保留 raw/receipt，禁止宣称修复完成。

### Phase 5：最终测试、异源审查、合并

- 3rd-review 全套测试。
- WorkflowHub 全套测试。
- 固定跨仓 E2E。
- 3rd-review 异源审查完整双仓 diff；只合并实际 completed 的意见。
- 建立一次协调发布窗口：先确认两仓 commits、测试和回滚点均已冻结；再合并 3rd-review Phase 2（新增字段对旧 consumer 是 additive），随后立即合并 WorkflowHub。任一仓不能在同一窗口完成时，两边 commits 都 hold，不发布半套组合。
- 两边 main 落地后立刻重跑 fail-fast preflight 和 deterministic E2E。失败则停止业务分支传播：优先修 forward；若不能当场恢复，两个协议 commits 按相反顺序一起回滚。
- 需要本地 wh-review 文件的长期业务分支再显式合并 WorkflowHub main；不得假设 main 修复会自动改变已存在 worktree。
- 业务分支传播 checklist：确认未把旧 `broker-client/review-round-facade` 冲突版本选回、运行 doctor preflight、运行固定跨仓 E2E、再跑该业务 canary。缺一项不宣称兼容。
- 删除临时 worktree；保留 canary summary、raw hash、runtime/session、测试报告。

raw stdout/stderr ref、绝对路径和 provider session 只进入私有证据目录；公开 summary 只记录 hash、状态和相对证据引用。

## 8. 最少验收矩阵

1. `protocol mismatch`：provider PID/runtime 数不增加，flow 不变。
2. `exact-copy happy`：sealed == visible；逐文件 bytes/hash/size 一致。
3. `R1/correction/R2`：同 runtime/session；只发布有效 semantic round。
4. `tamper`：稳定拒绝；semantic_verdict=null；无 aggregate/pass。
5. `lying doctor`：声明 v5 但返回旧 receipt，运行时审计拒绝且不发布结果。
6. `correction binding invalid`：不 fallback、不换 session、不推进 flow。
7. `audit OpenCode canary`：发布业务结果。
8. `PaperBuilder Kimi canary`：发布业务结果。

不新增三 provider × 两 delivery × 多 stage 的 live 矩阵。provider 差异由 adapter tests 覆盖，live 只证明两条真实业务链。

## 9. 完成标准

- 两个真实业务场景不再出现 `delivery attestation is incomplete`。
- 协议不匹配在 provider 启动前失败。
- 3rd-review 不修改 sealed bytes，不出现 raw/derived/redaction 双状态。
- wh-review 不依赖 3rd-review 私有 redaction 实现。
- 基础设施失败可在同 business flow 重试，不要求 reset/new flow。
- 测试不会再把“跨仓 E2E 未执行”显示成完整绿色。
- 当前用户业务 spec、active flow、旧 runtime 未被修补或伪造。

## 10. 异源审查处置

OpenCode 与 Kimi 首轮均认可根因、sealed exact-copy 方向和“不恢复 redaction”；均要求修订后再确认。已采纳：

- 两仓协调发布与成对回滚。
- `31fd051` 逐项语义移植记录，禁止整文件恢复。
- binding 只能来自完整 exact-copy 审计。
- lying doctor、correction binding fault 回归。
- 固定跨仓 E2E 作为本次发布 hard gate。
- raw/session 只留私有证据。

未采纳 OpenCode 的 runtime 监控/告警建议：它不影响本次协议兼容修复，会扩大产品与运维范围。Phase 0 保留但已压缩；Phase 3/4 保持独立，因为 deterministic contract 和真实业务可用性证明不同事实。

R2 使用首轮相同 runtime 与原生 sessions 续跑；OpenCode、Kimi 均 `approve`，无 blocking，均确认修订已落实且方案未过度设计。审查证据：

- runtime：`7fe8fa73-d50a-4e3c-8db0-204fce9ac493`
- OpenCode session：`ses_09af0bb05ffec3d1bNDIs3TkD4`
- Kimi session：`b92e2365-dbff-42ba-bbbe-92cef2201306`
- R2 packet：`/tmp/wh-review-sealed-contract-plan-review-r2/`
