# 测试资产与验收事实规则

本文件承接 CARD-04 的 `decision-log.md` D-006、D-007、D-008 和 `spec.md` §5.1；适用于新写的验收标准、测试资产与阶段末事实。owner 是相应 Phase/Task 的实施者；消费者是 build-code、verify-code、P1–P13 的执行者及 CARD-10 的集成验收者。它是写法与核对口径，不新增 stage、阻断门、持久账本或测试依赖。规则文本和关键词检查只证明文档存在；业务通过须另有真实执行与用户可观察结果。

## 验收标准可执行形式（DER-01、DER-11；R-001、FR-16/AC-16）

每条 AC 写出触发条件、系统必须做的可观察行为、可度量成功标准、至少一条应失败或边界场景，以及对应的真实运行入口和预期输出。写不出任一要素，显式标 `incomplete` 并写原因；不能用笼统的「检查通过」补空槽。按 AC 逐条比对实际业务效果；单元测试绿或审查无 finding 不代替结果。来源：`spec.md` FR-16/AC-16，`decision-log.md` R-001、D-007。

**统计口径**：以 `specs/<task>/decision-log.md` 中的验收标准表为样本集，运行 `node tools/cli/check-decision-log-chain.mjs specs/<task>/decision-log.md`，再由独立读者逐条核条件、行为、数值和失败场景。分母是表内全部条目；记录符合条数、明确 `incomplete` 条数及无标记缺项，不把缺项从分母删除。CARD-04 自身的 `decision-log.md` 验收表与 `spec.md` Appendix A 是首个样本。命令只检查其实现覆盖的结构，人工核对负责业务语义。来源：DER-11、AC-16。

## oracle 与实现分离、provenance（DER-01、DER-12；FR-17/AC-17）

验收 oracle 的期望业务结果须在改实现前确定，不能由当前代码输出反推。目标隔离形态只有 `只读` 或 `隐藏`：`只读` 时实现者可看测试但无写权限；`隐藏` 时连测试内容也不可读。验收时应实际观察实现者的读写权限；仅写 `DO NOT TOUCH` 或让另一个上下文起草，不证明物理隔离。若实现者能写测试，或隐藏模式仍能读取，AC-17 失败。

每份 oracle/预置测试记 `provenance`：产出者、产出上下文和时间、源材料与测试版本、实现者可访问面（`只读`/`隐藏`，或明确「未建立」）、独立判定者是否建立、可复核的原件引用。未建立独立判定者或无法证明权限时标 `incomplete`，保留真实访问边界。本卡单 worktree 目前没有物理读写隔离，也没有 AC-17 样例任务；异源上下文和冻结声明只是有限替代，AC-17 仍 `MISSING — not established`。来源：`decision-log.md` OI-005、D-007；`spec.md` DER-12 与 Appendix A AC-17。

## 有效 RED 与 G-2 豁免（DER-01；FR-18/AC-18、FR-19/AC-19）

新行为先固定可失败的目标断言和同一命令，再改生产实现。有效 RED 必须在改动前、正确工作目录和依赖下真正收集目标测试，因预期的业务断言失败而退出非零；记录精确命令、runner/版本、输入或 fixture、源码/测试身份、stdout/stderr、exit、目标失败签名。环境故障、配置错误、导入失败、零测试、空断言、自比对或故意无意义断言均无效。GREEN 用同一目标与命令证明断言转绿，真实失败修复后复跑；旧 RED 不覆盖新快照的结果。旧回归或纯文档检查不为追求 TDD 标签强造行为 RED。

若改动前 RED 无法取得，G-2 豁免只能如实写原因、风险、影响的 AC、替代可失败检查及何时补做；没有替代检查则保留 `incomplete`/`unavailable`，在验收披露。豁免不是通过记录，也不阻止同任务继续修复。来源：`decision-log.md` R-001/R-002、D-004，`spec.md` FR-18/FR-19。

## 机器产物按路线适用（DER-01、DER-04、DER-13；FR-20/AC-20）

每个受影响 AC、每个测试层记录 `route_applicability`：`适用`，或 `不适用 + reason`。N/A 需由真实消费者与差分支持；服务、浏览器、数据、权限或 oracle 缺失写 `unknown`/`unavailable`，不得写 N/A。适用路线的硬证据是**真实命令或步骤 + exit + 原始 output 路径 + 对应 oracle/反例证据**，并绑定测试身份和当前源码快照。trace、JUnit、跳过计数、截图、network/console 等仅在该路线适用时要求；缺不适用产物不判失败，缺适用产物或伪造产物不能判通过。真实测试失败须修复、保留旧失败事实并复验。

覆盖率只诊断：CARD-04 未安装覆盖工具，D-007 要求零新依赖，故本卡覆盖率路线写 `N/A + reason`，不猜百分比、不设覆盖率门。后续任务若具备真实覆盖工具，可报告实际模块、命令、范围和数值，仍不以高覆盖率代替有效 oracle。来源：`spec.md` DER-04/DER-13、FR-20，`decision-log.md` D-007。

## 真实入口联通与资产落点（DER-01、DER-14；FR-21/AC-21）

每个 Phase 至少核一条确实走到目标行为的真实入口；入口可以间接触达，但要点名入口、包裹它的脚本、调用链与原始运行事实。入口清单由 `docs/architecture/real-entry-inventory.md` 单独维护，区分显式入口、间接入口、未跑过入口；未跑过就写未跑过。真实 CLI/子进程、服务或浏览器结果与 AC 的可观察效果对应后，才能声称功能验收；测试与验收技能也须真实调用并留执行事实。来源：`decision-log.md` D-006，`spec.md` FR-21。

模块×层级矩阵按实际消费者填写单元、自动代码检查、接口、完整业务旅程、UI 实机的适用性和原件。`runtime/` 模块行为测试按 CLARIFY-BP-001「甲」**就近共置**，用 `<module>.test.mjs`；`tools/cli/` 的公共入口合同在 `tests/contract/<behavior>.test.mjs`；`docs/` 的纯文档约束用有失败反例的 Node 断言脚本。跨模块业务旅程另选真实入口，不拿局部模块绿代替接口或端到端。**命名规则**：禁止以任务名、卡号或里程碑名命名测试文件；名称描述被测行为，便于后来维护者按模块发现。来源：DER-01/DER-14、D-007；当前仓库已有历史任务名文件，规则作用于新测试，不凭重命名制造完成事实。

## 规模预算只报不拦与负控抽查（DER-01、DER-03；D-007）

新测试文件建议 500 行 `target`、800 行 `limit`，参考 `tools/architecture/complexity-report.mjs` 预算结构。超出时报告实际值、拆分建议及原因；预算只报不拦，不是统一门，也不把历史真实超限数字改小。测试数量和覆盖率均不能代表测试是否抓到业务错误。

每个高风险 oracle 抽查一个有意义的坏输入、错误结果或缺失证据：该负控必须从 `passed` 变为失败/未证实，并保存命令和输出。`expect.hasAssertions()`、`expect.assertions(n)`、`test.fails()` 可帮助发现空断言或预期失败，但无法阻止 `expected = compute(); expect(compute()).toBe(expected)` 一类自比对；负控用独立预期值检验 oracle。来源：`decision-log.md` D-007 的零依赖选择及实测盲区。

## 报告事实层、exceptions 与不对称压缩（DER-01、DER-05、DER-06、DER-13）

阶段末按纯文本路径调用计划中的 `runtime/stage/stage-end-report.mjs` 导出，消费真实阶段结果和证据目录；不改变现有 stage 流程。事实层 `stage-end-report-facts.v1` 应保留 `not_done[]`、`route_applicability[]`、`executions[]`、`coverage_limits[]`、`exceptions[]`、`sources[]`。执行项逐条列命令、exit、output/ref 与来源；逐 AC 列路线适用及不能证明的部分。缺输入标缺失，不凭文件名或概述制造来源。P5/T007 只负责未来事实层；P5/T008 中途检查点目前 blocked/not_done/G2，P13/T024 才负责 P1–P12 的最终聚合与独立聊天叙述；二者不能互相替代。

机器判定类 `not_done` 只用 `missing`、`inconsistent`、`incomplete`、`failed`、`unavailable`，逐条说明源路径和原因。`exceptions` 是人事先声明、验收时披露的非通过项，如 `deferred` 或人工例外；每条写声明者、理由、影响范围、到期阶段和 owner。`coverage_limits` 记录尚未证明的范围及影响。机器判定类与人写声明类不得互相顶替：缺测试不能写成人工豁免而消失，人工延期也不能假称机器判定。`coverage_limits` 与 `exceptions` **空数组不合法**，各至少一条真实披露；没有可确认例外时须由 owner 查清契约如何如实表达，不能编造一个例外凑数组。来源：D-004/DER-05、`spec.md` §5.1/§7。

报告采用**不对称压缩**：没做到、失败、未跑、`unknown`、`unavailable`、`incomplete` 逐项置顶，不总结抹平；已通过项可一行汇总并附可展开步骤。每项结论都带原始来源。机器只生成可追溯的事实与结构；最终简短大白话由未参与实现的独立子代理根据原件写，主会话原样交付给用户。当前规则文档和 T001 关键词 gate 不能证明事实层已实现，也不能证明全卡真实验收。来源：D-005、DER-06、ADR-0033（D-008 当时拟编号 0032，落库时因撞号迁至 0033）。
