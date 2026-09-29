# P10/T021 真实业务 oracle 接线设计（只读调研）

状态：设计建议，**未实施、未跑 gate、未取得新的产品写面授权**。CARD-04 当前 task-store 只有 P1 doc-gate canonical receipt；下述链路不能被现有 P10 单元夹具或本文件认定已发生。

## 当前可复用边界与断点

- P8 `docs/quality/business-case-catalog.json` 有三个 active case。各有 `source.path/revision`、`rule.id/revision/statement`、`ac_ids`、`task_ids`、`phase_ids`、四类文字场景、`execution.target/machine_command/registered_test_ids`。本次只读比对三个 `source.revision` 均等于当前源文件 SHA-256；目录版本本身仍须在每次执行时重新哈希。目录尚无机器可执行的业务效果谓词或独立效果读取器。
- P9 `captureTaskChangeScope({task,workspace,receipt})` 从认证 TaskHandle 的 bootstrap 身份、Git 快照和**已有** canonical 测试 receipt 推出变更范围；`collectTestInventory({task,workspace,receipt,registeredTestIds})` 从同一 Task 的 receipt/output 解析 Node TAP 或 Vitest JSON，返回 `task_id/snapshot_tree/source_digest/receipt_ref/output_ref/output_hash/command/exit_code/tests/registered_test_ids/missing/unmatched/skipped`。这些是可复用的来源检查，不是业务 oracle。
- P10 `runTargetedCases` 能以 `shell:false` 启动 Node/Vitest，返回逐叶 `case_id/test_file/full_id/status/exit_code/raw_report_sha256`，以及合并 `execution.raw_output/raw_output_sha256/argv`；返回值明确 `canonical_receipt:false`，**没有逐例 report_ref，也没有 task/phase/AC 绑定**。
- 当前 `reconcileCases({selection,observations,oracleEvidence,task})` 只从调用者对象取规则身份、AC、路径和散列；`readFileSync` 读取任意绝对 ref。`expected_test_identity` 以 `cancellation preserves account balance ` 开头的特判仅能发现测试夹具的余额/取消矛盾；匹配后也返回 `observed/unauthenticated_business_oracle`，不能成为通用业务通过。真实 P8 case 的叶身份为 6/28/15 条，`ac_ids` 与夹具的 `acceptance_criterion_ids`、Vitest 多叶与当前 T021 单观察/TAP 假设均未对齐。

## 最小可信链（目标接口，不新增公共 stage/gate）

1. **锁定来源。** build-code 当前 Task 调用方用 `openTask` 和 `openCurrentTaskWorkspace` 取得真实身份，读取当前 post Phase 材料；核 P8 目录字节 hash、每个 `source.revision` 对应真实源文件、`rule.id/revision`、case→`ac_ids/task_ids/phase_ids`。保存所读目录 hash、材料 revision、Task id 和当前源码 `snapshot_tree/source_digest`。`phase_ids` 是规则原所属 P6/P7；本次执行相位是 P10/T021，两者分别记录，不能互相改名。
2. **认证运行范围。** 从认证 bootstrap 起点取得当前差分，选中 case 与相关回归，并对每个 target 取 P9 同快照的 `recorded` 库存；逐叶核 `registered_test_ids` 全集、额外/缺失/skip/fail、命令和 `exit_code`。P10 selector 的纯对象结果只能标 `supplied_unverified`；实际消费方须自己重新读取 Task/P9 原件，核 receipt hash、output hash、task/workspace、snapshot 和目录版本，不能信调用者转述。
3. **固定命令与原件。** build-code agent 启动一个已审查的固定 launcher；动态 case 只在 launcher 内变成经校验的 argv。现有 canonical writer 可在 `captureTests` 中绑定整次命令、合并输出、退出和快照，但它用 `/bin/sh -c`，所以外层只能是字面量固定命令。launcher 应把每例 raw reporter、argv、child exit、完整 leaf ID 和观察 ref 以可解析边界输出；canonical output 读取器核外层 receipt/output hash 后再核内层每例 raw hash。若需要独立逐例文件，写入必须走现有 Task `quality/tests|evidence/` 的认证 writer/reader，不能直接把内存 `raw_output` 或任意绝对路径当 receipt。
4. **独立业务观察。** 为每个 case 从 P8 规则 owner 确认一个**版本化谓词**及最小输入/效果读取器，写在既有目录 case 的受控字段或该 owner 已有材料中，绑定 `rule.id/revision` 和 `ac_ids`。P10 只实现有限、可枚举的谓词操作（例如集合成员、相等、下界、缺错、状态转移）并按规则版本读取效果；不从测试名、TAP pass、夹具自报的 `balance_*`/`cancelled` 字段推导期望。效果应由与测试断言不同的受控读取路径在同一快照/服务实例上读取，给 before/after 原始字节或 canonical 记录 ref/hash；读者需有明确 owner 和失败语义。缺规则、错版本、无效果、读者与 runner 共用可伪造输入、或环境不一致时输出 `unknown/unavailable`，不产 `passed`。
5. **逐 AC 对账与发布。** 对每个选中 case 的**全部**登记 leaf 求证 runner 身份/状态/退出/原件，按 `case_id + rule.id/revision + source SHA + AC + execution task_id/phase_id + snapshot_tree/source_digest + receipt_ref/output_ref/hash + effect refs/hash` 对账。一个 case 可有多个 leaf；重复、零叶、缺叶、额外叶或 skip/todo/fail 均不得 pass。把结果写入现有 build-code task quality facts，记录证据局限、结构偏差与 owner；同 Task 修复追加新快照、新 receipt 和旧失败 ref 的处置引用，保留旧字节，不建第二台账。

**时间次序缺口：** 当前 P9 可信 scope 要求一个**已完成** receipt；若固定 launcher 本身正在被 `captureTests` 执行，它拿不到这次运行结束后才生成的 receipt，也不能在该 writer 锁内嵌套 capture。可行的最小产品变更须由 P9/Task owner 提供认证 bootstrap+当前快照的只读预执行入口，或复用确实同快照的先前 canonical receipt；随后固定 launcher 的最终 receipt 再与预执行 `snapshot_tree/source_digest` 逐项比对。不能把临时 `HEAD`、测试拥有的 capture 或事后自报对象填入此空位。

## 三个现有 case 的 oracle 落地边界

| P8 case | 独立输入与候选效果谓词 | 当前欠缺 |
| --- | --- | --- |
| `CARD04-DECISION-LOG-CENSUS` / AC-26 | 认证当前 `decision-log.md` 字节及其 source revision；独立结构读取 U/V/R，断言 U/V 分母、`errors=[]`、`R-001..R-008` 与删除整节负控。谓词版本绑定 P8 `rule.revision`。 | 目录只有自然语言场景；若仅再调用被测 `deriveDecisionLogOriginalSourceCensus`，只证明同一实现重算，不能叫独立 oracle。需 P6 材料 owner 确认独立读取方法及原始观察格式。 |
| `CARD04-ACCEPTANCE-MACHINE-CLASSES` / AC-27 | 在受控当前 runtime 上向八个合法值与一个非法值输入相同具体 payload，独立读 `quality-store`/freshness 的结果；合法机器类均应 incomplete，非法应拒绝，保留逐值原始结果。 | 需 P7 规则 owner 给出版本化输入/结果表与效果读取器；现有 28 条 Vitest 叶与 runner pass 本身不能当业务观察。历史 123-record 兼容性仍未知。 |
| `CARD04-DEFERRED-ACCEPTANCE-REGRESSION` / AC-27 | 受控输入 inconclusive/deferred/unknown，读当前映射与 quality fact 的不可变前后记录，验证 deferred 不变成 pass 或假 fail。 | 当前 `source.path`/`rule.revision` 指向**测试文件**；测试不能独立授权其自身的业务规则。先由 P7 决策/规格 owner 绑定独立的材料规则版本，再定义读取器与修复前后原件。 |

冻结 T021 夹具的账户取消 case **不在这三个 P8 case 中**。它没有经业务 owner 定义的 `case_id/rule.revision/AC`、受控账户服务/账本读取器或 canonical Task effect ref。要做真实取消/余额 oracle，须先由产品 owner 建立案例、正反谓词（例如同账户余额保持、取消状态转为 true）及独立读写环境；当前测试名和临时 JSON 文件不能代替。因此两个夹具正例不能获得官方 `reconciled/passed`，其 RED 应保留到来源和合同纠正。

## 所有权与最小授权请求

- **P8/业务规则 owner：** 在现有 catalog/材料上确定三个 case 的谓词、版本、可观察效果和读取器；尤其修正 deferred case 的自证来源。目录改动归 P8，P10 无权暗改。
- **P9/Task 与 capture owner：** 提供预执行认证 scope 或可证同快照的先前 receipt；指定固定 launcher 如何拿到 TaskHandle/Workspace；让 canonical output 中逐例 reporter 与效果 refs 可只读回验。涉及 `change-scope.mjs`、`capture.mjs`、`runtime/task/**`、`runtime/evidence/**` 或 CLI 的改动需精确写面和消费者授权；本设计不默认获准。
- **P10/build-code owner：** 在来源接通后，将 T021 从单观察/TAP+绝对文件路径改为多叶、TaskHandle 受控 ref 与版本化谓词核对；删除 fixture-title 特判。由现有 build-code 调用方消费并发布当前 Task facts，不能用自述对象直接签 AC-33。
- **P11/服务 owner：** 若 case 涉及真实页面或账户服务，提供隔离服务/DTO、权限及效果读取器，浏览器路径走既有 isolated-browser-qa；无服务时保持 `unavailable/unknown`。

完成判据：能用同一个真实 Task 的认证起点、P8 规则版本、P9 库存、固定命令 canonical receipt 与独立效果原件逐 case/AC 重放；故意换 task、source、rule revision、snapshot、leaf、output hash 或业务 after 状态时各有专属拒绝，失败旧原件仍可达。之后才由独立 review 与人判断 AC-33；结构性测试 GREEN 或本设计文件均不授予业务通过。
