# wh-review 简单可靠重建设计

日期：2026-07-15

状态：待异源审查

## 1. 目标

把 wh-review 恢复成 WorkflowHub 中最简单、最高效、最好维护的质量节点：

```text
冻结本次改动和必要材料
  → 调用独立 provider
  → 保存结果
  → 最终提交前确认代码未变
```

用户只能看到三类结果：

- `pass`：有效异源审查通过。
- `revise_required`：存在需要修改的问题。
- `unavailable`：本次审查没有形成有效结论，可以直接重跑。

技术失败不得产生 `pass` 或 `revise_required`，也不得控制下一次审查。

## 2. 为什么重建而不是继续修补

现行 wh-review 已经把 Git snapshot、材料构造、provider 调用、session、finding 状态、发布事务和崩溃恢复集中到一个强状态机中。

已确认的失败模式包括：

- 失败 prepare 写入永久 `source-context.json`，正常合并 main 后锁死 task。
- runtime、session、能力快照或材料链变化要求人工 reset。
- WorkflowHub 读取 3rd-review 私有状态和 workspace，形成跨仓重复审计和协议漂移。
- 多套 packet/manifest/delivery/receipt/projection hash 让 provider 已完成的结果在外围被废弃。
- 严格 checklist、skillResults、checked_objects 和 hash 回显让格式问题代替质量判断。
- reset/recover/migration 只是为修复上述永久状态而存在。

继续新增 migration、reset 或兼容字段会扩大同一个错误模型。因此本设计替换运行路径，不在旧 facade 上继续增加 gate。

## 3. 不变的质量底线

必须保留：

1. provider 与 host 来源不同，禁止自审自判。
2. provider 看到真实、完整、冻结的本次改动。
3. provider 不读取真实仓库，不执行 git，不依赖宿主绝对路径。
4. 基础设施失败不能冒充语义结论。
5. provider 原始最终输出必须保存。
6. 有效结果必须绑定本次材料和代码 snapshot。
7. 最终提交或合并前，当前代码必须仍等于通过审查的 snapshot。
8. stage 决定审什么；3rd-review 只负责可靠调用 provider。

## 4. 强制简单性约束

新实现不得违反：

- 核心路径只有四步：`snapshot → materials → provider → result`。
- 持久概念只有两个：`attempt` 和 `result`。
- 正确性身份只有两个：`material_id` 和 `snapshot_tree`。
- 用户命令只有 `run` 和 `verify-final`。
- 不存在 reset、recover、trusted-base migration 或 flow continuation gate。
- 任何非语义失败都不能影响下一次运行。
- 删除某个失败 attempt 后，再次运行的行为必须不变。
- stage 差异只能影响材料、审查问题、review track 和最小有效 reviewer 数，不能分叉执行引擎。
- provider adapter 不保存 WorkflowHub 业务状态。
- 新增第三种正确性 hash、receipt、flow、projection 或 migration 前，必须先证明现有两个身份无法表达真实需求，并获得用户确认。

本文中的 `track` 只是一个 stage 内的审查视角。目前只有 `make-decision/direction` 和 `make-decision/detail` 使用它。`stage-result` 和风险接受记录属于 WorkflowHub 的消费记录，不进入 wh-review 状态机，也不增加新的审查权威。

## 5. 一次审查的数据

### 5.1 material_id

`material_id` 是实际交给 provider 的全部文件 manifest 的 SHA-256。

manifest 每项只有：

```json
{
  "path": "相对附件路径",
  "bytes": 123,
  "sha256": "..."
}
```

canonical manifest 只包含：

- target/base/snapshot 的相对 Git 身份说明。
- `changes.diff`。
- changed-files 清单。
- 当前文件内容。
- stage 审查指令。
- stage 必需材料。
- 本次实际附带的可选材料。

不得包含：

- 宿主绝对路径。
- mtime。
- runtime/session/provider。
- 调用时间。
- raw 输出。
- attempt id。

所有会改变审查语义的 provider-visible 字节都必须作为附件进入同一个 material_id，包括精确的 `review-instructions.md`。固定 adapter 包装、协议名、runtime/session 和 transport 参数不是审查材料，不进入 material_id。模型不负责回显 material_id。

canonical manifest 只有一种序列化：文件按 UTF-8 相对路径字节序排列；路径统一使用 `/`；每项字段顺序固定为 `path,bytes,sha256`；`bytes` 为十进制整数；`sha256` 为小写十六进制；整体使用无空白 UTF-8 JSON。不同平台必须对同一固定样例生成同一个 `material_id`。

### 5.2 snapshot_tree

`snapshot_tree` 是 Git temporary index 写出的不可变 tree object，表示本次被审代码。

它覆盖：

- staged 和 unstaged tracked changes。
- 非 ignored 的 untracked 文件。
- 新增、删除、重命名。
- 文件 mode 和 symlink 目标。

ignored 文件默认不纳入，与普通 Git commit 行为一致。submodule/gitlink、浅克隆缺对象、多个 merge-base 或 sparse checkout 无法保证完整时，本次返回 `unavailable`；修复 Git 状态后直接重跑。

material_id 回答“provider 看到了哪份材料”；snapshot_tree 回答“最终代码是否仍是被审代码”。二者职责不同。

## 6. Git 基线和 snapshot

### 6.1 target

target commit 来自 task `worktree.json` 已登记的 `target_repo_root` 当前分支 HEAD。通常是 main。

如 stage 明确支持 stacked branch，可在创建 worktree 时登记显式 target ref。审查运行时不得猜测、迁移或修改 target。

### 6.2 worktree review base

每次 attempt 读取一次：

```text
target_commit = target_repo_root 当前分支 HEAD
captured_head = source worktree HEAD
base_commit = git merge-base --all target_commit captured_head
```

恰好一个 merge-base 才继续。base 只属于本次 attempt，不写入 task 级永久状态。

feature branch 正常 merge main 后，merge-base 会自然前移到新的 main；不需要 trusted-base migration。

### 6.3 worktree capture

temporary index 从 captured HEAD `read-tree`，再执行等价于 `git add -A` 的完整捕获，生成 snapshot tree。

捕获两次；若 HEAD 变化或两次 tree 不同，返回 `SOURCE_CHANGED_DURING_CAPTURE`。不得截断当前声明的审查对象。

所有 packet 文件都从 immutable snapshot tree 读取，不从仍在变化的 worktree 读取。

### 6.4 worktree diff

生成：

```text
git diff -M --binary --full-index --no-ext-diff --no-textconv base_tree snapshot_tree
```

changed-files 清单记录 old/new path、mode、blob identity、size 和文本/二进制类型。删除记录旧对象；二进制不得假装已经完成文本审查。

### 6.5 build-code phase subject

`build-code` 每个 phase 单独审查。调用方只传 `phase_id`；不得传 path filter、自制 diff 或任意 commit range。

host 从当前 `phase-result.json` 引用的 `phase-diff-scan.v1` 读取 `baseline_commit`、`implementation_commit` 和 `snapshot_tree`，校验 baseline commit 是 implementation commit 的祖先，并校验 implementation tree 等于登记的 snapshot tree。随后 host 自己生成完整的 `base_tree..candidate_tree` diff 和 changed-files。allowed paths 只用于 scope scan，不裁剪审查材料。

phase result 绑定 `phase_id`、`base_tree`、`candidate_tree`。后续 phase 改变 worktree 不会让已完成 phase 失效；同一 phase 产生新的 implementation commit 后，旧 result 因 tree identity 不相等自然失效，不需要 superseded 状态。

### 6.6 内部文件

所有 attempts、results、packet、request 和 raw 必须写在 source repo 外的 task 数据目录或 packet root。

如果 task tracking root 位于 source repo 内，新 runner 直接返回配置错误。禁止维护“工具路径黑名单”，因为 WorkflowHub 的真实业务改动可能就在 `skills/`、`scripts/` 或 `docs/`。

当前遗留 `review-input.json` 等文件需要在切换前一次性移出业务 worktree；新 runner 不再在 worktree 生成它们。

## 7. 材料目录

每次 provider 看到：

```text
bundle/
├── review-instructions.md
├── source.json
├── changes.diff
├── changed-files.json
├── changed/
│   └── 当前非删除文件内容
├── requirements/
├── evidence/
├── skills/
└── manifest.json
```

`source.json` 只记录 target/base/captured-head/snapshot 的 Git identity 和仓库相对信息，不含宿主路径。

仓库源文件中的绝对路径属于被审业务内容，不能静默删除或脱敏。host 自己生成的 metadata、prompt 和 manifest 不得写入宿主绝对路径。

## 8. 各 stage 最小材料

全局必需：

- 当前 track 的完整审查对象；代码 stage 必须是完整 snapshot/diff，不能裁剪。
- 直接需求来源。
- 当前 stage 的短审查指令。

stage 可以声明少量附加必需材料，但必须说明为什么 reviewer 缺少它就无法诚实判断。缺材料只让本次 attempt `unavailable`，不写永久状态；补齐后原命令直接重跑。声明为可选但本次不存在的材料，必须在 `review-instructions.md` 中写明“未提供”和原因，不能静默省略；不为此再增加一类状态文件。

### 8.1 make-decision / direction

必需：

- 原始用户需求。
- 已知客观事实和硬约束。

不得包含拟定方案、decision log 或 detail 结论，保证盲审。

direction 是唯一不交付完整工作树 diff 的 track：它的完整审查对象就是原始需求、客观事实和硬约束。runner 必须按 stage contract 只构造这组材料，不能先打包完整 `changed/` 再靠提示词要求 provider 忽略方案。完整 source `snapshot_tree` 仍记录在 result 中，用于证明审查期间源树是否变化；provider 实际看到的范围由 `material_id` 如实表达。

核心问题：真问题是什么、方向是否对位、是否存在更小更稳路径、关键前提是否成立、范围和时机是否合理。

### 8.2 make-decision / detail

必需：

- 原始需求。
- 已批准方向或 decision log。
- 拟定规格或验收草案。

核心问题：方案是否忠实于批准方向、是否遗漏前提或边界、验收是否可判断、是否扩大范围。

direction/detail 保持两份独立结果，因为二者输入和审查目的不同；但不再建立两个永久 flow。每份结果都有自己的 material_id，共享同一 snapshot_tree。

### 8.3 build-spec

必需：原始需求、已批准决策、待审 spec（范围、非目标、验收）。

核心问题：需求是否完整进入 spec，成功/失败/边界是否清楚，验收能否客观判断，是否出现范围漂移。

### 8.4 build-plan

必需：已批准 spec/验收、待审 plan（phase、任务、依赖、验证）。

核心问题：每项需求是否落到任务和验证，顺序和依赖是否可执行，消费者和失败路径是否遗漏，是否过度实现。

### 8.5 build-code

必需：完整代码 snapshot/diff、批准 spec/验收、与 snapshot 对应的测试结果。

核心问题：行为是否符合验收，错误/状态/原子性/并发是否正确，接口和消费者是否同步，测试是否覆盖关键正反例。

plan、设计背景、静态扫描、性能/安全证据和上轮 findings 可按需附带。

### 8.6 verify-code

必需：验收标准、当前 snapshot、逐项验收证据、尚未关闭的问题或例外。

UI 范围必须附真实浏览器证据。核心问题：每条 AC 是否有新鲜、可定位、一致的证据，失败和边界是否覆盖，例外是否诚实。

### 8.7 reviewer 技能

继续把对应技能放入附件并在审查指令中声明。一个 provider 可以在一次调用内使用多个技能。

删除 host 对这些回显的强制校验：

- skillResults。
- bundle_hash。
- checked_objects。
- 每个 lens 的 pass item。

本次不合并或删除现有技能，避免扩大范围。技能去重另行处理。

## 9. 3rd-review 公开合同

WorkflowHub 只能使用 3rd-review 公开 CLI 结果，不得读取：

- `/tmp/3rd-review/.../state.json`。
- provider private workspace。
- broker 私有 raw 文件。
- broker 内部 inode/link/attestation 结构。

公开结果协议命名为 `workflowhub-result.v1`。它是 3rd-review 现有 `run` 命令的一个稳定公开投影，不新建第二个 CLI，也不要求 WorkflowHub 传 provider 私有 session id。

请求仍只使用：

```text
3rd-review.mjs run --request=... --attachments=... --attachments-root=... --attachment-delivery=file_only
```

首轮 request 声明 `required_result_protocol: "workflowhub-result.v1"`；续跑仍只传公开 `runtime_id`。3rd-review 在 provider 启动前检查能力。公开结果需要的最小字段：

```json
{
  "result_protocol": "workflowhub-result.v1",
  "provider": "opencode",
  "status": "completed | failed | cancelled",
  "material_id": "...",
  "session_id": "诊断和续跑提示，可空",
  "output": "provider 最终原文，可空",
  "error": null
}
```

3rd-review 内部继续负责：

- root/source/regular-file/size/SHA-256 校验。
- file_only 私有附件复制。
- provider cwd、runtime、session。
- structured progress/liveness。
- 原始 CLI event stream 和取消来源。

WorkflowHub 只检查：

- `result_protocol` major 兼容。
- provider status。
- 返回 material_id 等于请求 material_id。
- output 是否能解析成最小 reviewer schema。

`error` 只能是 `null` 或 `{ "code": "...", "message": "..." }`。可选字段增加不得导致 WorkflowHub 拒绝。协议不兼容必须在 provider 启动前返回 `PROTOCOL_INCOMPATIBLE`，且不写任何控制后续运行的状态。

## 10. provider 输出和解析

最小 schema：

```json
{
  "verdict": "pass | revise_required",
  "summary": "简短结论",
  "findings": [
    {
      "severity": "blocking | major | minor",
      "path": "仓库相对路径或材料相对路径",
      "line": 1,
      "issue": "问题",
      "recommendation": "建议"
    }
  ]
}
```

允许：

- 完整纯 JSON。
- 全文唯一一个 fenced JSON object。

不再要求 checklist、pass_items、skillResults、checked_objects、模型回显 hash、finding 状态 ID 或 closure bundle。

格式失败最多同 session 修正一次，只要求重发 JSON，不重传材料。仍失败时 attempt 为 `unavailable` 并保存 output；任何人都不能把不可解析 raw 直接提升为 pass。

合法的 `pass + findings:[]` 是正常结果，不自动升级人工 gate。

## 11. session 和后续轮次

每次 R2/R3 都完整重建当前材料和 snapshot，并附：

- 上轮 findings。
- 本轮修复说明。
- 当前完整 packet。

如果同一 task、stage、track、provider 的原 session 仍可用，优先在该 session 续跑。新材料仍完整交付，不依赖 delta hash 链。

session/runtime 不可用时，自动 fresh run 同一完整材料。session 只影响速度，不进入 material_id，不决定结果有效性，不要求 reset。

WorkflowHub 可以在 attempt 中记录 session/runtime 用于续跑和诊断，但任何 stage gate、聚合或 `verify-final` 都不得依赖它们。

续跑继续使用现有 request 形状：

```json
{
  "version": 4,
  "host_provider": "codex",
  "required_result_protocol": "workflowhub-result.v1",
  "prompt": "检查修复后的完整材料",
  "continuation": { "runtime_id": "上一轮公开 runtime_id" }
}
```

一次用户命令的自动尝试预算：

- 每个 provider 一次正常调用。
- 每个实际启动的 session 最多一次格式修正。
- 只有明确 `NO_CONTINUABLE_SESSION` 或 runtime 已失效时，最多一次 fresh run。

网络、认证和未知 provider 错误不做无界自动重试；返回 unavailable，用户再次运行同一命令即可。

## 12. provider 结果和聚合

单 provider 结果彼此独立，不共享 semantic round。

固定规则：

- 任一有效 `revise_required` → 整体 `revise_required`。
- 达到 stage 静态声明的最小有效 reviewer 数，且全部有效结果为 pass → `pass`。
- 有效 reviewer 数不足 → `unavailable`。

优先级固定为 `revise_required > unavailable > pass`：已有一个有效 revise 时，其他 provider 的 transport 失败不能抹掉该问题；没有 revise 且有效 reviewer 不足时才 unavailable。

默认每个 track 最小有效 reviewer 数为 1。高风险 stage 可以建议第二 reviewer，但不能由运行中状态动态增加 gate。

不做加权投票、置信度算法、finding 自动去重、blocking streak 或 finding 生命周期。各 provider findings 原样保存，展示层只能分组，不能修改原文。

make-decision 的 direction/detail 分别按上述规则产生结果；stage 规则为任一 revise → revise，任一 unavailable → unavailable，全部 pass → pass。

## 13. 持久文件

所有文件位于 source repo 外的 task 数据目录。

```text
reviews/
├── attempts/
│   └── <attempt-id>/
│       ├── attempt.json
│       ├── materials/
│       └── providers/
│           └── <provider>.output.txt
└── results/
    └── <stage>-<track>-<snapshot>-<attempt-id>.json
```

provider 输出文件使用 create-only 写入。所有 provider 调用结束后，才一次性写入
`attempt.json`；它记录本次输入身份、最终执行状态、provider 输出和错误，写成后永不
修改，也不控制后续运行。进程中途崩溃时可以留下未完成 attempt 目录和 provider 原始
输出，但不能留下一个谎称完成的 `attempt.json`，更不能留下 result。下一次运行不读取
该目录作为控制状态。

result 只在产生有效语义结论后，以 create-exclusive + atomic rename 一次写成。正式
result 的 verdict 只允许 `pass` 或 `revise_required`；`unavailable` 只属于 CLI 返回和
attempt 的 terminal status，绝不能写成 result。result 包含：

- task/stage/track。
- target/base/captured-head/snapshot。
- material_id。
- attempt ref。
- provider 原始结果。
- 聚合 verdict 和 findings。

CLI 直接返回 result ref。现有七字段 stage-result 合同继续承载各 stage 的业务事实；
本次只把其 `facts.review` 改为保存 `result_ref` 和 `snapshot_tree`，不复制 verdict 或
material_id。消费者必须读取 result，result 是唯一审查权威。

可选中文 report 从 result 生成，但不是 gate 或第二份权威。

崩溃最多留下无效 attempt；不会留下半个 pass，也不需要 recover。

## 14. 人工决定

wh-review 不再要求每个 finding 做 accept/reject/defer disposition。

人只处理：

- 是否明确接受 `revise_required` 的风险并推进 stage。
- 是否执行最终 commit/merge。

风险接受记录属于 stage execution record，不改变 provider verdict，不写入 wh-review flow。它必须绑定当前 result/material_id/snapshot；代码变化后自动失效。

`unavailable` 永远不能被人工改成 pass。

## 15. verify-final

输入为 stage-result 引用的正式 result。

worktree result 用与审查时完全相同的 temporary-index 算法重新捕获当前 snapshot tree：

- 相等 → finalized。
- 不等 → `WORKTREE_CHANGED_AFTER_REVIEW`，直接重新审查。

phase result 只由 phase-gate 消费。`verify-final` 对它返回 `PHASE_RESULT_NOT_FINAL`，防止局部审查授权最终 commit 或 merge。phase-gate 重新读取当前 phase diff-scan，要求 `phase_id`、`base_tree`、`candidate_tree` 与 result 完全一致；后续 phase 不影响该比较，同一 phase 的新 implementation commit 会让旧 result 自然失效。

不比较旧 flow、session 或 trusted base。不使用“业务文件白名单”。worktree review 后 merge/rebase/main sync 或任何 source tree 变化都必须重审，但不会锁死 task。

commit/merge gate 必须调用 `verify-final` 后才能承认 pass。普通 stage 消费者读取 result 时也必须核对引用的 `snapshot_tree` 是当前 stage 正在推进的 snapshot，不能缓存一个过期 pass。

## 16. 稳定错误

只保留用户可行动的少量错误：

- `SOURCE_UNAVAILABLE`：目标分支、Git 对象或 worktree 无法读取。
- `SOURCE_CHANGED_DURING_CAPTURE`：捕获时仍在变化，直接重跑。
- `MATERIAL_INCOMPLETE`：缺少当前 stage 必需材料。
- `MATERIAL_POLICY_BLOCKED`：明确隐私策略阻止发送原始材料。
- `PROTOCOL_INCOMPATIBLE`：两仓公开协议不兼容，升级后直接重跑。
- `PROVIDER_UNAVAILABLE`：认证、网络、进程或健康失败。
- `OUTPUT_INVALID`：provider 输出无法形成正式结论。
- `WORKTREE_CHANGED_AFTER_REVIEW`：当前代码已经变化，需要重审。

每个错误必须告诉用户：哪里失败、provider 是否已经调用、下一条可执行动作。错误不得要求编辑 JSON、迁移基线、reset 或 recover。

## 17. 旧状态处理

- 已完成或已合并任务不迁移。
- active task 的旧 source-context、flow、receipts、guards 和 core receipt 只作为历史文件保留。
- 新 runner 永远不读取这些旧文件。
- active task 在新路径第一次推进前，对当前 snapshot 重新审查一次。
- 不生成 migration 文件，不把旧 pass 伪装成新 result。

## 18. 代码规模预算

规模是警报，不是质量证明：

- 核心编排目标 ≤ 500 行。
- wh-review 生产代码目标 ≤ 2,500 行。
- 持久文件家族固定为 attempt/result 两类。
- 用户命令固定为 run/verify-final。
- 正常路径零 reset/recover/migration。
- 关键行为测试 20–30 个，加少量真实 provider smoke。

超过预算必须解释真实必要性，不能为了压行数把逻辑塞进巨型函数或删除有价值测试。

## 19. 验收标准

1. provider 连续失败十次，第十一次仍可运行同一命令。
2. session 失效后最多一次自动 fresh full review，无 reset。
3. feature branch merge main 后，base 自动前移，只审 feature 当前差异。
4. staged/unstaged/untracked/add/delete/rename/mode/symlink 全部进入 snapshot。
5. packet、request、attempt 和 result 永不进入 source snapshot。
6. 两次捕获不一致时明确失败，下一次可直接重跑。
7. 缺少 stage 必需材料时无 semantic verdict；补齐后原命令成功。
8. 可选材料缺失不会形成永久 gate。
9. 大材料通过 file_only 完整交付。
10. OpenCode、Kimi、Claude Code 能看到同一 material 的首、中、尾 marker。
11. 说明文字 + 唯一 fenced JSON 可解析；多个或零个候选为 unavailable。
12. 合法 pass + 空 findings 可通过。
13. WorkflowHub 不读取 3rd-review private state/workspace。
14. 两仓协议不兼容在 provider 前失败；升级后无需清状态即可成功。
15. 任一有效 revise 使聚合 revise；有效 reviewer 不足为 unavailable。
16. make-decision direction/detail 互不污染，最终规则固定。
17. R2 优先续 session；session 不可用自动完整重审。
18. phase 审查只包含本 phase 的完整 tree diff；同一 worktree 的累计历史和后续 phase 不进入该 subject。
19. phase implementation commit 更新后，旧 result 因 tree identity 不匹配自然失效，无 superseded 状态。
20. worktree 审查后任意 source tree 变化使 verify-final 失败。
21. 崩溃只留下 attempt，不留下半个 pass，也不需要 recover。
22. 用户永远不编辑内部 JSON、不 reset、不 recover、不迁移 trusted base。

## 20. 明确不做

- 不顺手合并、改名或删除 reviewer 技能。
- 不重写 3rd-review provider health 算法；只消费其公开状态。
- 不迁移旧 V4 flow/receipt。
- 不保留长期双系统。
- 不新增 UI。
- 不在本次修复中改变五个 WorkflowHub stage 的业务职责。

## 21. 取代的旧决策

实现并验收后，本设计取代：

- ADR 0001 中 runtime/session/flow/reset/private receipt/public projection 作为正确性链的部分。
- ADR 0002 中 TTL、delta mismatch、projection pending 需要人工 reset/recover 的部分。

仍保留 ADR 的核心边界：异源 provider、冻结完整材料、transport 与 semantic 分离、基础设施失败不产生 verdict、最终代码一致性。
