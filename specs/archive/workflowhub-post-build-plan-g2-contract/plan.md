# G-2 窄例外 — mini 实现计划

## 材料导航
| 章节 | 摘要 | 读取时机 |
| --- | --- | --- |
| 接缝与写集 | 单一结果、唯一 owner | 实现前 |
| 顺序与质量 | 真目标测试、审查与交付边界 | 派工/验收前 |

## 接缝与写集
当前方向只见 decision-log 末尾 D-MINI-001；产品/AC 只见 spec；本文不重述 AC，也不生成 phases。
实现接缝：`validatePostPhaseContract({ spec, index, phases } = {})` 的 Task fieldValue 读取与 RED 字段校验；只在 Task 级分开窄纯文档替代与行为 RED，不跳全局通用检查。
文件 owner：主指定的一位实现者独占以下四文件；材料作者不实现、不自审；两个测试文件不交给并行作者。
- runtime/stage/stage-content-contracts.mjs：落实 spec 六步确定性识别：既有 fieldValue、明确 Inputs/Scenario、Task 原 inlinePaths owned .md 写集、具体 reason/risk/具名替代/披露、expected_exit 客观 0/不执行 RED、明显矛盾否定。保留 `{ok, errors, ...}` 输出形状；errors 仍是字符串，逐项精确列缺理由/风险/客观替代/验收披露或矛盾/非文档写集，不引入新诊断 schema。
- skills/spec-plan/templates/phase-template.md：自然中文既有字段示例，客观预期 0/不执行 RED/失败披露；行为仍真实 RED/GREEN。
- tests/contract/post-phase-contract.test.mjs：合法自然中文 G-2 正控；合法行为 RED 目标非零/GREEN 0 仍接纳正控；逐缺理由/风险/替代/披露、空值/裸 N/A/泛 G-2/非空空泛与新增 runtime 矛盾负控；混合伪标签、通用合同不弱化和披露保留 fixture；断言 errors 字符串逐项命名且输出形状不变。
- tests/contract/post-cohort-executable-authoring.test.mjs：模板与作者规则兼容回归。
默认不改 stage-handlers；现有 reader 接缝不足或需扩范围时先报主，不扩大本 mini。

## 顺序与质量
1. 原独立 `mini_task.design` 已恢复，主处置三项 fixed-required，本材料定向补齐；沿用原结果、不重派 design。实现与实现审查复核具体发现，只在本 mini 修复，不补造完整 make-decision 依赖。
2. 单一实现者实际读四写集与相邻 reader；按 spec 六步用既有字段做有限词句检查，不扩读锚点解析；写兼容正控、合法行为 RED/GREEN 正控和全部缺项/占位/非空空泛/矛盾负控，运行聚焦命令记录目标断言 RED。setup/environment 失败不算目标 RED；真实旧卡未实读就只称形状 fixture。
3. 修改 validator/模板令同一目标与命令 GREEN，全部负控保持拒绝；同一 ORACLE 和通用 source/owner/dependency/trace 检查保留。
4. 聚焦命令：`npx vitest run tests/contract/post-phase-contract.test.mjs tests/contract/post-cohort-executable-authoring.test.mjs`。真实用户结果为独立作者构造的现有字段卡片被真实 validator 接受/拒绝，不以静态文本代替调用。
5. 交当前 diff/snapshot、实际输出/exit、AC→改动→测试→证据 trace、coverage limits/skip reasons/remaining risks给独立 `mini_task.implementation`；review 不由作者自签，缺失保持 unavailable。
仅聚焦测试，不称全套/真实 CARD01 execute 或旧阶段质量通过。研究只是有限输入，不镜像 taskstore 记录。

## 风险、停止与恢复
自然语言/后缀不能证明语义无行为；正负控制加独立范围审查。若行为混合放行、合法形状仍拒或通用检查变弱，就在同一四文件内修复并重放，未知归主决定，不静默扩大。
回滚为停止交付、保留原 HEAD/差异与证据；若需逆向补丁仅对本实现 diff 经授权恢复，不 reset/清理旧进度。无数据库/迁移清理。
commit/push/merge/deploy/cleanup 未授权均 pending；本计划不发布事实、不执行 Git 交付。材料 ready 不等于 design/实现/测试/验收已完成。（此句为原材料冻结时边界；当前授权与交付计划见下。）

## 当前本地交付收尾（主转交 m02009/m02050/m02087）
用户要求按 mini-task 交付收尾；本轮明确授权本独立任务的本地 commit、merge 到 workflowhub main、规格归档、非 force worktree/本地 task branch 清理。不授权 push、远端 branch 删除或部署；不恢复已 paused CARD01，不跨仓库 merge 到 PaperBuilder。保留 decision/spec 冻结历史、原失败及 review 原件，不新增 phases、schema、provider 或质量 PASS。
唯一 owner 只显式提交上述四个实现文件与本任务四材料（当前仅 plan/tasks 最小状态追加）；merge 前后核七个无关 dirty 文件的字节与 index entries，禁止 stash/reset/混入提交。必要交付复验仅两个已声明测试，复用 main 既有 Vitest 2.1.9，不安装依赖。归档沿用 `specs/archive/workflowhub-post-build-plan-g2-contract/` 的精确改名，内容 blob 不变；逐项物理读回后才用非 force `git worktree remove` 与 `git branch -d`。
原 implementation 两 finding 已做定向修复，主报告一次 focused re-review 受访问限制；不得自判其 PASS 或声称第三 provider 已复核。当前英文窄修 GREEN 61/61（原始件 `quality/tests/mini-g2-english-green-b8be0aa163fc99f88fb474b7cea9398303554abac2f7468ad43325597a8d3629.log`），逐 AC trace 沿用原修复报告；英文追加 trace/范围只见 `quality/evidence/mini-g2-english-summary-998d5621c1ffd9f08f08d55d0cdeb2c1958f5ad51cdf9443bd6b28c642a1cd1a.json`。主报告正常 CARD01 execute 已过结构，但不是整个阶段/质量完成。
既有 task-close 固定含 push/远端 cleanup，targetPreflight 拒绝任意 dirty source；mini route 另需现有 canonical quality，post status 仍寻找 phases/index.md。现有能力不能表达此次 local-only 四材料交付，不调用会越权的 close，不伪造 confirmation/quality/facts。公共 task-close status 实读仍 not_completed；本地物理交付与官方 close/质量 incomplete 分开报告。唯一原始 Git/物理日志留在外置 taskstore 的 quality/evidence，原质量证据不移动不删除。
