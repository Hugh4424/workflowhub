---
name: testing-system-blueprint
description: 在 build-plan 为每个 Task/Phase 生成分层测试和证据策略。
---

# Testing System Blueprint

build-plan advisory设计，非通过/开始/继续/完成gate。post把风险/场景/oracle/证据/限制写spec全局策略和物理Phase逐Task卡；pre/history保plan/tasks。先读本技能再用test-routing-advisor选路线；build-code按真实changed files调用具体testing skill消费既有设计，不重跑蓝图/建第二ledger。

检查行为/状态数据流、错误取消恢复、权限安全、并发原子性、跨模块seam、可观测性/来源，UI适用时含加载/空/错误/边界/a11y；每维不适用给理由，不能只写单测通过。按真实改动选simple|feature|fullstack，不凭规划标签。

每Task设计按backend「执行事实」字段，另列scope、风险维度/层级、执行器；正常/负例、同gate_cmd目标RED/GREEN、具名失败断言、STOP/恢复属Task，Phase摘要不代。post只本Phase写集/受影响来源，旧snapshot只读，不建跨Phase绑定。实际结果/跳过原因/ref归build-code task facts，不回写作者Phase；缺失unknown/incomplete，不造pass或要求无关全量回归。

## 行为测试设计

设计oracle/替身/缺RED时，读[backend-testing「行为测试与证伪」](../backend-testing/SKILL.md#行为测试与证伪)及「执行事实」设计字段，填原Task，不提前执行build-code/造入口。

## 测试数据准备

测试数据内容与下列四项约定归本技能（唯一测试数据 owner）。build-plan 在统一准备段写这四项，build-code 按它准备并留原件；不建第二 owner、不写固定配额、不建 `P0.md`，跨项目建库、迁移和实库处置记具名缺口。

- 数据来源与每 Task 上限依据：先复用既有标准数据集，否则用同一合成 seed；上限写「为什么需要这么多」的依据（按真实消费入口的实际输入量算），不抄固定配额。
- 一条可重复跑的命令：`node tests/fixtures/execution-quality/prepare-test-data.mjs --data-root <显式隔离根> --sample-version 1.0.0`；同一 seed 复跑得到同一字节，回执给数据来源、样本量与读回结果。
- 版本/账本落后即失败：请求版本或现有样本版本落后于命令要求的版本时非零退出，点名请求版本与要求版本；缺 `--data-root` 或 `--sample-version` 在产生样本前具名失败。退出码 2＝缺配置/根越界/锁，3＝版本落后或不符，1＝读回或清理未完成。
- 清理四问：谁拥有（隔离根归创建它的调用者，夹具只清清单内自有对象）、何时清（同一进程 finally、测试 afterEach 或 `--clean`）、清什么（`manifest.json` 列出的文件）、完成信号（`--clean` 回执 `complete:true` 且隔离根为空）。

隔离边界：所有读写在 `--data-root` 内，该根须为绝对路径、已存在、不是当前工作目录、不是符号链接、不在本仓内；缺根不回退 cwd、TMPDIR 或产品库。根与根内路径组件不得是符号链接，写删前都重核真实路径；写入走同目录临时文件加 rename，陈旧锁用 rename-claim 原子接管、其余并发写者拒绝；`--clean` 与显式恢复先按固定前缀回收自有临时文件与 claim，再处理清单；清单损坏或缺失、归属不可证时，普通 `--clean` 先具名失败，确认根内只有本夹具对象后用 `--clean --discard-invalid-manifest` 按固定自有路径显式恢复。限制：删前二次核与删除之间仍有同权限并发换链的 TOCTOU 窗口，路径 API 无法完全消除；夹具靠根内单写者锁与符号链接拒绝收窄，不声称已消除。真实测试入口与它的配置解析者不在夹具写集，属具名缺口：owner=测试数据负责人，命令=`node tools/cli/run-checks.mjs --task-path <认证任务根>` 之外的测试入口解析，时点=该入口纳入写集的后续任务。fixture 结论不外推到真实入口或产品库访问。

为什么不直接复用 `runtime/interface/temp-dir.mjs`：它建随机子目录并负责进程级回收；本夹具要在调用者给定的稳定根上按同一 seed 复跑同一路径、只清清单内自有对象，所以隔离根由调用者的临时根或测试 afterEach 拥有，夹具不建第二临时根。

## 写作规范

创建/编辑方法读`skills/spec-specify/SKILL.md`的WR001唯一规范，不复制。

来源权威[catalog](../catalog.yaml#skills.testing-system-blueprint)；正文/小卡非权威，缺登记找维护者。AgentHub路径/采用及许可适用性unknown见登记。

## 同仓方法依赖

`skills/backend-testing/SKILL.md`、`skills/spec-specify/SKILL.md`；按条件读，搬运带可读原件。
