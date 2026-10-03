# G-2 窄例外 — mini 任务清单

## 材料导航
| 章节 | 摘要 | 读取时机 |
| --- | --- | --- |
| 顺序与 owner | 一位实现者、独立审查、单一结果 | 派工前 |
| 完成边界 | 证据与未授权交付 | 结果交接前 |

## 顺序与 owner
| Task | owner | 依赖 | 输入→动作→输出 | AC |
| --- | --- | --- | --- | --- |
| M001 | 主代理/独立 design reviewer | none | 冻结四材料；只用 mini_task.design 审范围和风险；真实 findings 回主 | AC-001…006 |
| M002 | 主指定单一实现者 | M001 的真实意见已处置 | 实读四写集；落实 spec 六步既有字段算法；编自然中文 G-2/合法行为 RED非零GREEN0 正控，逐缺四要素/空值/裸N/A/泛G2/非空空泛/矛盾新增runtime/混合/通用负控；断言 errors 字符串具体缺项及原形状；真实目标 RED→同命令 GREEN | AC-001…005 |
| M003 | 同一实现者交证据；独立 implementation reviewer | M002 | 当前 snapshot/diff、实际结果、逐 AC trace/限制/剩余风险；mini_task.implementation 后在原四写集修复有效 finding | AC-001…006 |
| M004 | 主代理/用户 | M003 的真实结果 | 报唯一结果与缺口；获得必要交付确认才使用现有交付能力，不代签授权 | AC-006 |
M002 独占 plan 所列四文件，两个 targettests 也归同一 owner；材料作者与 reviewer 不写实现。无并行共享写集、无新增 phases。

## 完成边界
聚焦命令与 oracle 以 spec/plan 为准；本任务改变 validator 行为，目标 RED 必须是真实具名断言失败，GREEN 同命令 exit 0；fixture 不是旧 CARD01 execute。
材料作者只交四材料 ready；原 design 三项 finding 已由主处置 fixed-required，指针见 decision mini 段，真实实现审查仍须复核。材料作者未执行或验证实现测试/真实结果/实现审查/验收，无状态账本或伪 receipt。若需 handler/新字段/API/schema/迁移或行为负控放松，停下报主，不擅自扩展。
完成需实际聚焦结果、逐 AC trace、独立审查与真实用户结果；结构 ok 不等于质量通过。Git commit/push/merge/deploy/cleanup 仍 pending 未授权，不执行。（此句为冻结时历史；当前授权状态如下。）

## 当前交付状态（主转交 m02009/m02050/m02087；不改原 review）
- M002：四实现文件的窄修已实际完成，英文 probe 增补后同聚焦命令 GREEN 61/61，sourcehash 与英文 summary MATCH；不是全套测试。
- M003：原 kimi/coding#1 minor 与 codex/luna#1 major 两 finding 定向修复，RED/GREEN 与六 AC trace 原件保留；主报告一次 focused implementation re-review 访问 limitation 真实保留，质量/独立复核仍 incomplete，不由 owner 宣称 PASS/关闭 finding，不启动第三 provider。
- M004：用户新明确授权本地 commit/merge/archive/cleanup。push、远端 branch 操作、deploy skipped（未授权）；CARD01 paused 保留，所有其材料不变。正常 execute structural pass 不作其阶段/验收通过。
- 历史 cutoff：spec 中“当前全部未执行”“记录尚缺”“历史 CARD01 未实际运行”和 decision 的旧草稿/未授权段均为材料作者冻结时状态，不是本次归档现状；原验收标准与历史原文保持不变。当前结果以本节及下列 sole 原件为准。
- 六 AC 实测 trace：见 [修复报告](</Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-post-build-plan-g2-contract/quality/evidence/mini-g2-review-repair-report-4370d92ea468dec29bc693ec4d9bba26a0cee420381ecec302552b0a63956380.json>) 的 acceptance_trace（六项原始结果/测试定位）。AC-001 合法自然字段接纳；AC-002 缺项/空泛/矛盾拒绝；AC-003 行为/混合 RED 保留；AC-004 原来源/owner/dependency/index/oracle 控制保留；AC-005 模板实构 validator；AC-006 仅结构声明、不创造质量/确认/历史成功。该报告当时 GREEN 59/59；英文修复在 [英文 summary](</Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-post-build-plan-g2-contract/quality/evidence/mini-g2-english-summary-998d5621c1ffd9f08f08d55d0cdeb2c1958f5ad51cdf9443bd6b28c642a1cd1a.json>) 追加 AC-002 单字母 x 拒绝与 AC-001 publish procedure 接纳，最新 [GREEN 原件](</Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-post-build-plan-g2-contract/quality/tests/mini-g2-english-green-b8be0aa163fc99f88fb474b7cea9398303554abac2f7468ad43325597a8d3629.log>) 61/61。全部仅为针对性实测，独立复核访问限制仍 incomplete。
- 本轮物理步骤：显式 add 四实现+四 mini 材料 → 提交 → 安全 merge workflowhub main → 两 target tests 交付复验 → 精确 archive rename 提交 → 非 force worktree remove/local branch -d。动作仅按物理读回确认，最终 OID/路径/退出值见外置唯一原始日志；此材料不提前宣称动作已完成。
- 七个无关 main dirty 文件与原 index entries 必须全程不改；冲突正常 abort/报停，不清理未交付工作。taskstore/原 RED/GREEN/review/evidence 原件留存，不随 worktree 删除。
- 公共 task-close status 实读 not_completed；现有 close 硬含 push、拒绝 dirty target 且 post reader 要 phases，无法表达 local-only mini 四材料。按主授权直接本地 Git，官方治理 close 保持 incomplete/unavailable，不补假 facts 或质量确认。最终物理 readback 与其工具能力缺口分开交接。
