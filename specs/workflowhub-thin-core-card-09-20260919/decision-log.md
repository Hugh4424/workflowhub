# 决策日志（decision-log）

## 任务身份

- **任务类型**：普通任务

判断依据：本卡是实施卡——母 PRD 的 CARD-09 五阶段开工说明写明「以本卡创建独立实施 task:①make-decision 读取本卡/R-021/OI-011 及最小读取集,继承已授权增补,只确认本 task 边界,不重问全局方向」（`prd.md:522`）；母 PRD 实施旅程定义为「每个实施 task 独立执行 make-decision→build-plan→build-code→verify-code,只确认本任务方向与边界,继承本 PRD,不重问或改写全局产品决定」（`prd.md:20`）。故本任务只确认本 task 方向与边界、继承已确认母 PRD，不重问全局方向，按实施类任务登记。

## 原始需求

人读摘要：本卡承接两组需求。**资源组四项**（FR-43..FR-46）来自母 decision-log 的 OI-011 实测定位「高基线 + 高峰值」，指产品层四项修复：①broker 回收孤儿 manager/provider（须先解除 broker 自写的只读目录）；②限制单次审查并发 provider 数（峰值主因、收益最大）；③减少材料与证据写入量（索引抖动根因是文件数）；④主会话只派发与回收（由 CARD-03 承接实现，本卡验证效果）（`prd.md:486-495`、`decision-log.md:405`）。**效率组四项**（FR-58..FR-61）来自 2026-10-04 用户真实授权（母 PRD 记为 R-021，`prd.md:163`、`prd.md:688-692`），指：耗时分账、失败来源定向处理与最小复验、完整材料的小导航、无进展升级与受控取消（`prd.md:496-499`）。两组都由本卡负责新增验收事实，CARD-10 只沿既有存在性输入与用户抽验权消费，不增总体套件用例（`prd.md:163`、`prd.md:510`）。

编号说明（避免与母 PRD 编号混淆）：本文件的 `R-001..R-008` 是**本卡局部** source_id，与 `prd.md:139-163` 全局追踪表的 R-001..R-021 不是同一套编号。对应关系：本卡资源四项 = 母 `R-017` 行（`prd.md:159`）；本卡效率四项 = 母 `R-021` 行（`prd.md:163`）。本文件保留母全局编号 `R-021` 原样，因母 PRD 各处均以该编号引用本轮授权。

| source_id | 原始需求/约束 | 来源引用/原文摘录 | 关联 D/处理状态 |
| --- | --- | --- | --- |
| R-001 | broker 回收孤儿 manager/provider，含先解除 broker 自写只读目录，使 cleanup 能删除过期 runtime | FR-43 原文（`prd.md:492`）；OI-011 resolution 产品层第①项「broker 回收孤儿 manager/provider（必须先解除 broker 自己写入的只读目录，否则 cleanup 删不掉）」（`decision-log.md:405`）；诊断证据「材料目录被 broker 写成只读（`dr-x`）…broker 自身的 `cleanup()` 也很可能删不掉过期 runtime」（`decision-log.md:907`） | 来源已确认（OI-011 status=confirmed），D 编号待 make-decision |
| R-002 | 单次审查的并发 provider 数被限制（峰值主因、收益最大）；资源效果以同一工作负载前后 CPU% 与 thermal pressure（或风扇转速）实测对比验证，无法复现同负载时如实记 inconclusive | FR-44 原文（`prd.md:493`）；OI-011 产品层第②项（`decision-log.md:405`）；峰值量化「一次审查 = 2 角色 × 3 provider = 6 个 agent CLI 同时运行约 5.6–6.0 分钟」（`decision-log.md:918`） | 来源已确认（OI-011），D 编号待 make-decision；基线可复现性见 OPEN-002 |
| R-003 | 材料与证据写入量下降（文件数为索引抖动根因） | FR-45 原文（`prd.md:494`）；OI-011 产品层第③项（`decision-log.md:405`）；诊断「索引抖动的根因是文件数量」（`decision-log.md:919`） | 来源已确认（OI-011），D 编号待 make-decision；与 CARD-06 删除面的关系见 OPEN-004 |
| R-004 | 主会话只派发与回收的资源占用效果被实测验证（CARD-03 承接实现，本卡验证） | FR-46 原文（`prd.md:495`）；OI-011 产品层第④项（`decision-log.md:405`）；实现依赖「FR-46「主会话只派发与回收」由 CARD-03 承接实现,本卡验证其效果」（`prd.md:513`） | **已裁定（D-031）**：FR-46 保留，但「CARD-03 承接实现」的具体落点已被 CARD-06 按迁移表删除（`migration-table.md:745` MT-6-368 `DELETE B7/P8`、`:812` MT-6-441 `DELETE B4/P5`），故验证对象改为真实派发行为；实现 owner 记录只作历史来源 |
| R-005 | 在既有阶段人读报告一次性区分总跨度、工作/工具与子代理区间、provider 活动、明确人工等待、暂停和未归因时间；引用现有命令/审查/会话原件，重叠区间取并集，分类不得重复计时；没有原件不能把剩余时间命名为推理、有效开发或浪费 | FR-58 原文（`prd.md:496`）；增补草案 E01（`card09-duration-amendment.md:16`） | 已授权（R-021 内联，`prd.md:25`），D 编号待 make-decision |
| R-006 | 既定审查按真实来源保留成功、失败及语义发现；调用/运输故障先定位具体失败来源和本次变化，仅补该来源或验证有影响证据的集合；局部配置修复不自动重发所有 provider；修复 finding 只复验明确受影响的 file/case | FR-59 原文（`prd.md:497`）；增补草案 E02（`card09-duration-amendment.md:26`） | 已授权（R-021 内联），D 编号待 make-decision |
| R-007 | 昂贵调用前由现有 producer 的私有准备路径核对请求/来源配置冲突、索引与实际复制字节、code/document lifecycle、实际 argv/tool/trust 边界和终态解析；提供短入口与风险/真实消费者导航，完整 diff、合同、AC 和必要源正文保持可达且不截断 | FR-60 原文（`prd.md:498`）；增补草案 E03（`card09-duration-amendment.md:36`） | 已授权（R-021 内联），D 编号待 make-decision |
| R-008 | Task 按可独立交付工作包给出输入、写集、owner、完成证据与成本假设，主会话按包派发/回收，修复回原会话；等待不高频无变化轮询，wait timeout 不等于 reviewer 失败；同因无新事实的连续重试停止自动重发并给人清楚选项；用户暂停/取消沿既有 owned-process 路径处理 | FR-61 原文（`prd.md:499`）；增补草案 E04（`card09-duration-amendment.md:46`） | 已授权（R-021 内联），D 编号待 make-decision |
| R-021 | 2026-10-04 用户授权：将开发效率增补内联 CARD-09 并提交 main，支持与在途 CARD-08 同步开工 | 追踪行原文「2026-10-04 用户授权:将开发效率增补内联 CARD-09 并提交 main,支持与在途 CARD-08 同步开工」（`prd.md:163`）；总览条目（`prd.md:25`）；变更说明条目（`prd.md:688-692`） | 用户已授权并已内联母 PRD；D 编号待 make-decision |

## 需求变更记录

### U-001 — 2026-10-04 CARD-09 开发效率增补授权（母 R-021）

> 增补需求草案请直接更新到prd里的card-09任务，prd的更新请直接提交到main，因为我会在当前任务进行中同步开始card-09任务。

- 来源：用户 2026-10-04 消息原件 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-08-20260919/quality/evidence/sources/2026-10-04-003-card09-prd-main-commit-request.txt`（全文 1 行，逐字如上，本步骤已只读核对）。母 PRD 在「变更说明」节内联同一句话并标注「用户原话」（`prd.md:689`），两处逐字一致。
- 变更与处置：**新增**。母 PRD 记为 R-021 并明确「不补造旧 decision-log 的 U/OI 或改写 2026-09-19 确认与 revision/hash 事实」（`prd.md:25`、`prd.md:689`）。据此新增效率四项 FR-58..FR-61 / AC-59..AC-62，同时**保留**原资源 FR-43..FR-46、AC-43..AC-46/51（`prd.md:691`）。本卡不新增 U/OI 到母材料；本文件的 U-001/U-002 只作本卡内登记。
- 关联：R-005、R-006、R-007、R-008、R-021。

### U-002 — 2026-10-04 CARD-06 两会话超过 48 小时的根因调查要求（R-021 的上游动因）

> 另外 WH｜Card-06 ｜B 和 WH｜Card-06 ｜V 两个card-06的build-code和verify-code的会话执行了超过48小时！请仔细检查为什么会这么离谱？当前workflowhub已经优化了很多版本了，怎么还是这么垃圾？
> 需要你仔细调研根本原因，看看到底是为什么？然后再看看当前card-08任务能否解决这个问题？如果不行的话，那么card-09能否增加一下需求来解决这种超时开发的问题？
> 当前的“/Users/Hugh/Hugh/Project/workflowhub/specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md”任务就是专门用来提高workflowhub执行效率和质量的，但是几乎所有任务都做完了，但是执行效率和质量还是非常差啊！

- 来源：用户 2026-10-04 消息原件 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-08-20260919/quality/evidence/sources/2026-10-04-001-post-card06-request.txt` 第 2、3、4 行（本步骤已只读核对，逐字如上）。同一文件另有第 1 行（合并与计划更新要求）、第 5 行（空行）、第 6 行（系统追加的 `Referenced thread IDs: B=…; V=…` 定位元数据，非用户行文）。
- 变更与处置：**新增**。本要求是 R-021 授权增补的上游动因：先要求根因调查与「CARD-08 能否解决」的判断，再授权把增补内联进 CARD-09（`card09-duration-amendment.md:5`、`prd.md:690`）。本卡承接其产品层可修部分；环境层四项属用户侧动作、已显式排除出卡（`prd.md:489`、`prd.md:159`）。
- 关联：R-005、R-006、R-007、R-008、R-021。

### U-003 — 2026-10-04 CARD-09 范围撤销与重心收敛（三项）

> 原始需求是限制并发吗？并发再高，也就是审查的时候 cpu 高点，根本不影响全局。你把原始需求完全搞错了！我根本不像限制审查的 provider 数量并发！纯粹是降质，没有任何收益！
> 可以把 3rd-review 整仓迁移到 workflowhub 内部 skill 文件夹内，作为 workflowhub 的内部技能存在，这样就没有外仓问题了
> 以效率四项为主，资源只留 FR-43 回收 + FR-45 写入量

- 来源定位：本次 make-decision 阶段的真实交互（Talk 轮次第 3 轮），用户直接答复；三条为同一轮内的三处逐字原文（「我根本不像」为口语笔误，意为「我根本不想」）。
- 变更与处置：**范围撤销 + 范围新增 + 重心收敛**。①**撤销**「限制单次审查并发 provider 数」这项产品层要求：删除 FR-44 与 AC-44 两条整条；AC-51 收窄为只挂 FR-46，度量改为确定性计数（进程数/文件数/写入字节量），失败场景增加「拿采样外推冒充确定性计数」；FR-46 保留但验收改确定性计数，不再采 CPU%/thermal pressure/风扇转速（D-001、D-004、D-022、D-023）。②**新增**「3rd-review 整仓迁入 `skills/third-review/`」范围，含修主仓安全检查、救活两个失效检查、搬入自带 32 个测试、改宿主配置一行（D-002、D-003、D-017、D-018、D-019）。③本卡重心收敛为效率四项 + FR-43 / FR-45 / FR-46（D-005、D-006、D-008）。
- 关联：R-002、R-001、R-003、R-004、R-005、R-006、R-007、R-008；D-001..D-006、D-008、D-017..D-019、D-022、D-023。

### U-004 — 2026-10-04 时间分账不得落成派生文件（宪法修正）

> 我不需要这份报告！这种报告属于违反workflowhub核心宪法的垃圾文件！请仔细检查

- 来源定位：本次 make-decision 阶段用户对「时间分账报告放哪」选择题的直接答复（未选任何选项，写了自定义答复，见 Talk 第 5 轮）。
- 变更与处置：**口径修正**。FR-58 的交付口径从「在既有阶段人读报告一次性区分…时间」改为「用已有原件现场可复算、当场展示、不落文件」；本卡不得新增任何时间分账派生文件；阶段交接说明一个字都不动（那是 CARD-08 的地盘）。宪法依据：`CONSTITUTION.md:174`「报告只留原始件，不保存整棵目录/工作树快照或镜像。」；S4「自研技能按实际评估需要采集必要指标，复用统一事实底座；指标缺失如实未知，不为计量单独建设控制系统。」；F10「自动化按真实收益添加，不为"机器可校验"本身堆基建」。
- 关联：R-005；D-013、D-020、D-021、D-024。

### U-005 — 2026-10-04 平台/安全策略中断单列为一类时间

> 最后因宿主 `This content was flagged for possible cybersecurity risk` 终止
> V 明确 5h28m 人工停顿是外发审批未被平台接受后的等待

- 来源定位：CARD-06 耗时调查原件（非本次交互）`card06-duration-rootcause.md:93` 与 `:95` 两行逐字如上；原件路径 `specs/archive/workflowhub-thin-core-card-08-20260919/attachments/card06-duration-rootcause.md`（main 内归档，125 行/12978 B；只读引用，禁改）。原引用的是已清理的 CARD-08 工作树路径，2026-10-04 复核后改指归档位置。
- 变更与处置：**新增分类**。时间分账分类新增「平台/安全策略中断」独立一类，不并入「明确人工等待」，也不落在「未归因时间」。用户已确认（D-015）。
- 关联：R-005；D-015。

## 原始需求索引

| R 编号 | U/V 原文锚点 | 决策 | 落点 |
| --- | --- | --- | --- |
| R-001 | U-002、V-003、V-004；母 OI-011 | 待 make-decision 决定 | FR-43（`prd.md:492`）/ AC-43（`prd.md:501`）；落点未定见 OPEN-001 |
| R-002 | U-002、V-003、V-004；母 OI-011；U-003 第 1 条 | **已推翻（D-001/D-022）**：撤销「限制单次审查并发 provider 数」，删除 FR-44/AC-44；AC-51 收窄只挂 FR-46 | FR-44（`prd.md:493`）/ AC-44（`prd.md:502`）两条整条删除；AC-51（`prd.md:505`）改挂 FR-46 并改确定性计数 |
| R-003 | U-002、V-003、V-004；母 OI-011 | 待 make-decision 决定 | FR-45（`prd.md:494`）/ AC-45（`prd.md:503`） |
| R-004 | U-002、V-003、V-004；母 OI-011 | **已裁定（D-031）** | FR-46（`prd.md:495`）/ AC-46（`prd.md:504`）；验证对象改为真实派发行为（D-031） |
| R-005 | U-001、V-001、V-002；增补草案 E01 | 待 make-decision 决定 | FR-58（`prd.md:496`）/ AC-59（`prd.md:506`） |
| R-006 | U-001、V-001、V-002；增补草案 E02 | 待 make-decision 决定 | FR-59（`prd.md:497`）/ AC-60（`prd.md:507`） |
| R-007 | U-001、V-001、V-002；增补草案 E03 | 待 make-decision 决定 | FR-60（`prd.md:498`）/ AC-61（`prd.md:508`） |
| R-008 | U-001、V-001、V-002；增补草案 E04 | 待 make-decision 决定 | FR-61（`prd.md:499`）/ AC-62（`prd.md:509`） |
| R-021 | U-001、V-001、V-002 | 待 make-decision 决定 | 母追踪行（`prd.md:163`）、地图行（`prd.md:117`）、总览条目（`prd.md:25`）、变更说明（`prd.md:688-692`）；覆盖 FR-58..FR-61 / AC-59..AC-62，并保留 FR-43..FR-46 / AC-43..AC-46/51 |

## 逐字声明层（verbatim）

| V 编号 | 说话人 | 上下文/来源 | 逐字文本 |
| --- | --- | --- | --- |
| V-001 | 用户 | 2026-10-04 消息原件 `…/tasks/workflowhub-thin-core-card-08-20260919/quality/evidence/sources/2026-10-04-003-card09-prd-main-commit-request.txt` 第 1 行（全文） | 增补需求草案请直接更新到prd里的card-09任务，prd的更新请直接提交到main，因为我会在当前任务进行中同步开始card-09任务。 |
| V-002 | 用户 | 母 PRD「变更说明」本轮条目内联引用同一句话（`prd.md:689`，原文标注「用户原话」）——同一句的第二处落点，非不同来源 | 增补需求草案请直接更新到prd里的card-09任务，prd的更新请直接提交到main，因为我会在当前任务进行中同步开始card-09任务。 |
| V-003 | 用户 | 2026-10-04 消息原件 `…/sources/2026-10-04-001-post-card06-request.txt` 第 2 行 | 另外 WH｜Card-06 ｜B 和 WH｜Card-06 ｜V 两个card-06的build-code和verify-code的会话执行了超过48小时！请仔细检查为什么会这么离谱？当前workflowhub已经优化了很多版本了，怎么还是这么垃圾？ |
| V-004 | 用户 | 同上文件第 3 行 | 需要你仔细调研根本原因，看看到底是为什么？然后再看看当前card-08任务能否解决这个问题？如果不行的话，那么card-09能否增加一下需求来解决这种超时开发的问题？ |
| V-005 | 用户 | 同上文件第 4 行 | 当前的“/Users/Hugh/Hugh/Project/workflowhub/specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md”任务就是专门用来提高workflowhub执行效率和质量的，但是几乎所有任务都做完了，但是执行效率和质量还是非常差啊！ |

## 原始声明层

原始用户声明、调研原文和已确认事实只在此处保留可回读引用；后续 ADR 只引用它们，不得用摘要替换原文，也不得复制成第二份方向正文。

| 声明/事实 | 路径 | 定位 | 一句话说明 |
| --- | --- | --- | --- |
| 用户逐字请求（授权增补内联） | `…/tasks/workflowhub-thin-core-card-08-20260919/quality/evidence/sources/2026-10-04-003-card09-prd-main-commit-request.txt` | 第 1 行（全文） | R-021 授权原话，V-001/V-002 的来源 |
| 用户逐字请求（CARD-06 长跑根因调查） | `…/tasks/workflowhub-thin-core-card-08-20260919/quality/evidence/sources/2026-10-04-001-post-card06-request.txt` | 第 1–6 行（第 2–4 行为 V-003/V-004/V-005） | 效率四项的上游动因原件 |
| 母 PRD · CARD-09 卡片整节 | `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md`（CARD-09 worktree） | `prd.md:486-522`（标题在 `prd.md:486`） | 本卡主要原始需求：结果与 consumer、范围、流程/状态、FR-43..46/58..61、AC-43..46/51/59..62、oracle、依赖、共享资源冲突、producer/consumer/owner 边界、来源/设计、风险、可后置项、最小读取集、五阶段开工说明 |
| 母 PRD · 2026-10-04 增补授权总览条目 | 同上 | `prd.md:25` | 记 R-021、不补造旧 U/OI、CARD-08 冻结材料保留 |
| 母 PRD · 变更说明本轮条目 | 同上 | `prd.md:688-692` | 依据与授权、调查定位、前后承诺与影响、在途影响（含 CARD-08 职责边界与「同文件禁止同时写」） |
| 母 PRD · R-021 追踪行 | 同上 | `prd.md:163`（R-001..R-021 表在 `prd.md:139-163`） | 「新增来源独立登记,不伪造旧 U/OI;保留资源 FR-43..46、AC-43..46/51;CARD-10 仅按既有存在性输入消费新增事实,不增总体套件用例」 |
| 母 PRD · CARD-09 地图行 | 同上 | `prd.md:117` | 保留四项资源修复 + 新增四项效率要求，来源列 R-017/R-021、OI-011（产品层） |
| 母 PRD · R-017 追踪行（资源组母编号） | 同上 | `prd.md:159` | 资源四项归 CARD-09（产品层），环境层显式排除出卡 |
| 母 decision-log · OI-011 记录 | `specs/workflowhub-thin-core-rebuild-planning-20260919/decision-log.md`（CARD-09 worktree） | `decision-log.md:397-416`（`oi_id` 在 `:400`，`question` 在 `:403`，`resolution` 在 `:405`，`evidence` 在 `:411`，`acceptance` 在 `:412`，`counterexample` 在 `:413`） | 资源四项与「高基线 + 高峰值」实测定位的已确认来源（status=confirmed） |
| 母 decision-log · CPU 与温度诊断节 | 同上 | `decision-log.md:890-937` | 实测表格（`:896-901`）、已执行清理（`:903`）、已执行三项缓解（`:905-909`）、彻底调研结果（`:911-919`）、结论（`:921`）、环境层（`:923-928`）、产品层四项（`:930-934`）、`仍待实施的优化`（`:936`，正文为空，见 OPEN-005） |
| 增补草案（只读；**原件已不存在**） | 原 `…/workflowhub-workflowhub-thin-core-card-08-20260919/specs/workflowhub-thin-core-rebuild-planning-20260919/card09-duration-amendment.md` | E01 `:14-22`、E02 `:24-32`、E03 `:34-42`、E04 `:44-52`、共享写面与承接 `:54-62`、状态自述 `:3` | E01–E04 的需求/consumer/owner/验收/失败/替代删除边界原文；开头自述「尚非已确认产品决定」（见 OPEN-007）。**2026-10-04 复核**：CARD-08 工作树已清理，该草案**未随卡归档**（归档内只有 `decision-log.md`/`spec.md`/`phases/`/`attachments/card06-duration-rootcause.md`），全仓已无此文件；其内容已由 R-021 内联进母 PRD，故本卡一律以母 PRD 为准，不再依赖该草案路径 |
| 调查原件（4 份诊断 JSON） | `…/tasks/workflowhub-thin-core-card-08-20260919/quality/evidence/diagnostics/` | `2026-10-04-002-card06-build-duration-audit.json`、`2026-10-04-004-card06-verify-duration-audit.json`、`2026-10-04-003-card08-postmerge-scope-audit.json`（另同目录尚有 001/005–011 等本轮调查件） | 母 PRD 与草案共同引用的原始调查事实（`prd.md:690`、`card09-duration-amendment.md:7-10`）；本步骤只核对存在，未读取内容 |
| CARD-08 写集与并行结论（只读） | `specs/archive/workflowhub-thin-core-card-08-20260919/spec.md`（main 内归档；原在已清理的 CARD-08 worktree） | `spec.md:390`（六份未来实施写集：`skills/stage-handoff/SKILL.md` 与五份 `workflows/{make-decision,build-prd,build-plan,build-code,verify-code}/SKILL.md`）、`spec.md:391`（DO NOT TOUCH 列表）、`spec.md:393`（「CARD-09 当前没有已冻结实施写集，不声称已可安全并行」） | CARD-09 段落级写集与三方重叠的事实来源（见 OPEN-003）。**2026-10-04 复核**：CARD-08 已收口（交付 `ca4095c7`、合入 `24b6e1e6`、归档 `a41843b0`），那六份文件已成冻结既有内容，本卡不碰 |
| 本任务身份 | `…/tasks/workflowhub-thin-core-card-09-20260919/task.json` | 全文（14 行） | `task_id=workflowhub-thin-core-card-09-20260919`、`baseline_commit=e78c0e417d58de06d3ed590358f010211be4c8a9`、`target_repo_root=/Users/Hugh/Hugh/Project/workflowhub`、`activation_cohort=post`、`created_at=2026-10-04T09:01:08.843Z` |
| CARD-09 worktree / 分支 / HEAD | `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-09-20260919` | `git rev-parse --abbrev-ref HEAD` = `task/workflowhub/workflowhub-thin-core-card-09-20260919`；`git rev-parse --short HEAD` = `e78c0e41` | 本步骤只读核实：HEAD `e78c0e417d58de06d3ed590358f010211be4c8a9`，提交信息 `docs: add CARD-09 execution efficiency requirements`（2026-10-04），与 task.json 的 baseline_commit 一致 |
| 外置任务目录现状 | `…/tasks/workflowhub-thin-core-card-09-20260919/` | 目录清单：`task.json`、`facts.jsonl`（0 字节）、`quality/reviews`、`quality/tests` | 本步骤只读核实：已 bootstrap，facts 为空（0 行） |
| 已执行缓解 · 轮询间隔现值 | 主仓 `skills/wh-review/scripts/simple-review-runner.mjs` | `simple-review-runner.mjs:32`（`const DEFAULT_MANAGED_STATUS_POLL_MS = 5000;`）、`:461`（读取点） | 本步骤只读核实：现值 5000ms；改动属提交 `5a4ddf54`（提交信息含「poll interval 5s」），该提交同时承载 F1–F7 调用缺陷修复基线。**只作回归反例，不重写**（`prd.md:512`、`decision-log.md:909`） |
| 并发 provider 实测落点（待 make-decision 核实判断） | 主仓 `skills/wh-review/scripts/review-provider-client.mjs`、`skills/wh-review/scripts/simple-review-runner.mjs` | `review-provider-client.mjs:983`（`const members = await Promise.all(providers.map(async provider => {`）、`simple-review-runner.mjs:1752`（`const roleResults = await Promise.all(["red", "blue"].map((role) => runSimpleReviewSingle(`） | 本步骤只读 grep 核实行号；「全 provider 一次性扇出、无并发上限常量」的判断**待 make-decision 核实**，本文件不预先断言 |
| broker/manager 代码位置（第二仓） | `/Users/Hugh/Hugh/Project/3rd-review` | `package.json` 中 `"version": "4.0.0"` | 本步骤只读核实：主仓不含 `3rd-review/` 目录，broker/manager（含 `lib/broker.mjs`、`lib/managed-session-manager.mjs`）位于第二仓，FR-43 落点待定（见 OPEN-001） |
| CARD-06 删除面已合入 main | 主仓 git 历史 | `457299b3`（`refactor: complete Card-06 core retirement and migration`，2026-10-04）、`e4da5664`（`archive specs/workflowhub-thin-core-card-06-20260919`，2026-10-04） | 本步骤只读核实；CARD-06 仍在途，见 OPEN-004 |
| 兄弟卡当前状态 | 各卡外置任务 `facts.jsonl` 尾行 | CARD-03 `close` @2026-10-01T11:27:31.082Z；CARD-05 `close` @2026-09-26T05:05:37.721Z；CARD-06 `verify-code` @2026-10-04T05:12:35.283Z（共 3 行：make-decision 2026-09-30T11:02:32.503Z、build-code 2026-10-03T16:43:59.336Z、verify-code）；CARD-07 `close` @2026-09-22T11:24:41.615Z；CARD-08 `build-plan` @2026-10-02T11:31:57.467Z（仅 1 行） | 本步骤只读核实：CARD-03/05/07 已 close；CARD-06 在途于 verify-code；CARD-08 停在 build-plan（P1/P2 未开工）。**与派发记录所述「CARD-06 facts 尾行 stage=build-code @2026-10-03T16:40:14Z」不符，见返回说明** |

## 三级追溯链

`原始用户故事/初始需求 → 原始需求或调研 → ADR 决定`。每个 ADR 都必须能沿此链回读。

### 需求框架（先选一类，再逐步回填）

- **framework（框架）**：`functional`（背景→问题→目标→方案→验收→扩展）
- **选择理由**：本卡是实施卡，需求已由母 PRD 的 FR-43..46/58..61 与 AC-43..46/51/59..62 成型，要沿「背景（实测诊断）→问题（高基线+高峰值、超时开发）→目标（不牺牲能力的资源与效率修复）→方案（产品层四项 + 效率四项）→验收（同负载前后实测与真实记录）→扩展（可后置技术项）」回填，属产品功能型追溯；本卡无独立研究型主链（调研只作节点下挂证据），故外层选 `functional`。依据：`prd.md:488-499`、`prd.md:501-510`。
- **回填规则**：调研、Talk、审查、Grill 只能扩展已有节点；混合任务以 `functional` 为外层，在受影响节点下挂 `research` 子树。

| node_id | 节点 | status | evidence_status | evidence_owner | next_review_trigger |
| --- | --- | --- | --- | --- | --- |
| N-001 | 背景 / 问题 | open | pending | CARD-09 make-decision 主会话（待后续步骤指派具体 owner） | OI-011 诊断与 CARD-06 耗时原件核对完成时（`decision-log.md:890-937`、`prd.md:690`） |
| N-002 | 目标 / 论断 | open | pending | CARD-09 make-decision 主会话（待后续步骤指派） | Talk 收敛与资源/耗时目标量化后（`prd.md:488`、`prd.md:496`） |
| N-003 | 方案 / 证据 / 裁决 | open | pending | CARD-09 make-decision 主会话 + 后续 build-plan（待指派） | ADR 编号与工作包划分落定后（`prd.md:517`、`prd.md:520`） |
| N-004 | 验收 / 扩展 | open | pending | CARD-09 报告/测量责任人（`prd.md:517`） | AC-43..46/51 与 AC-59..62 实测口径（同负载可复现性）确认后（见 OPEN-002） |

### 唯一 OI 大纲（current authority）

大纲只存在于本份 `decision-log.md`；不得另建需求账本、状态机或第五份材料。
在调研前先建立下表，之后只在这里回填 OI。每个 framework node 和固定类别必须有 OI 引用，或明确写 `empty: true` 与具体理由。

#### 框架节点

| node_id | framework_node | oi_ids | empty | reason |
| --- | --- | --- | --- | --- |
| N-background | background | OI-011 | false | 背景即 OI-011 实测定位的「高基线 + 高峰值」：稳态基线约 15–17%（WindowServer 34.8%、DSH 渲染器 19.2%、kernel_task 17.6%、DSH GPU 9.9%），峰值来自 6 个并发 agent CLI 约 5.6–6.0 分钟（`decision-log.md:405`、`decision-log.md:915-921`） |
| N-problem | problem | OI-011 | false | OI-011 的 `question` 原文即本卡问题句：「WorkflowHub 任务为何造成不可接受的 CPU 占用与温度（超过 80 度、风扇超过 5000 转），是哪个进程导致，如何在不牺牲必要能力的前提下优化？」（`decision-log.md:403`）；效率侧问题句见 V-003/V-004 |
| N-goal | goal |  | true | OI-011 只覆盖资源侧目标；效率四项目标（FR-58..61）来自 2026-10-04 新增授权 R-021，而母材料明确「不补造旧 decision-log 的 U/OI」（`prd.md:25`、`prd.md:689`），故本节点在效率目标上确无 OI 可引用。节点整体保持 `empty: true`，待后续 Talk/调研新增 OI 或按已授权约束登记。**已消解**：资源侧目标中的「限制并发 provider 数」一项已被撤销（D-001/D-022），资源目标收敛为孤儿回收、写入量下降与主会话只派发与回收的确定性计数 |
| N-solution | solution | OI-011 | false | OI-011 `resolution` 的产品层四项即 FR-43..46 方案来源：①broker 回收孤儿；②限制并发 provider 数；③减少材料与证据写入量；④主会话只派发与回收（`decision-log.md:405`、`prd.md:492-495`）；效率四项方案来源为 R-021 内联的 FR-58..61（`prd.md:496-499`）。**已消解**：产品层第②项「限制单次审查并发 provider 数」已被用户撤销（U-003 第 1 条、D-001/D-022），本行引用的母材料原句只作历史记录，不修改母材料本体 |
| N-acceptance | acceptance | OI-011 | false | OI-011 `acceptance` 原文「实测数据、已执行缓解与待实施项写入材料」（`decision-log.md:412`），`counterexample` 原文「把非热源说成热源或不做实测」（`decision-log.md:413`），与 AC-43..46/51、AC-59..62 的「实测数据/不编造改善/inconclusive」同源（`prd.md:501-510`） |
| N-extension | extension |  | true | 扩展与可后置项集中在 `prd.md:520`（并发 provider 具体上限、时间/成本假设、采样方案、来源重试细节、私有准备实现、工作包划分及段落写集），母材料明确「留本卡 build-plan 按现有消费者与实测定,不预猜固定时间预算或新增控制面」，尚无 OI 可引用 |

#### 固定类别

| category | oi_ids | empty | reason |
| --- | --- | --- | --- |
| complete_user_flow |  | true | 本卡 `ui_applicability=non_ui`（`prd.md:518`），无界面用户流程；效率侧的「既有阶段人读报告一次性对账」流程属 FR-58 的验收内容，尚无独立可处置 OI，落点在 build-plan 的工作包划分 |
| page_scope |  | true | 同上，`non_ui`，无页面范围；本卡明确不新增页面/仪表盘/前端组件（母 PRD 非目标，`prd.md:21`） |
| data_state |  | true | 本卡明确不新增 public command、stage、持久对象、永久遥测、调度器、progress trace 或 checkpoint permit（`prd.md:489`、`card09-duration-amendment.md:22`、`:32`、`:52`），故无新增数据状态需登记；既有状态（材料/证据写入量、并发进程数）属诊断证据而非新持久对象 |
| success_failure_boundary | OI-011 | false | OI-011 的 `category` 原文即 `success_failure_boundary`（`decision-log.md:401`）；本卡失败边界为「无前后对比数据却宣称热改善」「inconclusive 被写成改善」「并发时长相加」「wait timeout 当 reviewer 失败」「取消后自建后代残留」（`prd.md:505`、`prd.md:506`、`prd.md:509`）。**已消解**：其中「限制并发 provider 数」一项已被用户撤销（U-003 第 1 条、D-001/D-022）；其余三项保留，且度量一律改确定性计数（D-004/D-023） |
| non_goals |  | true | 非目标已在母材料写明：不新增 public command/stage/持久对象/永久遥测/调度器/progress trace/checkpoint permit，不改 CARD-08 接续职责、既有审查点与 CARD-10 套件主体（`prd.md:489`）；环境层四项排除出卡（`prd.md:489`、`prd.md:159`）。尚未形成独立 OI 记录，待后续步骤按需登记 |
| deferred |  | true | 可后置技术项与延期项集中在 `prd.md:520` 与增补草案的替代/删除边界（`card09-duration-amendment.md:22`、`:32`、`:42`、`:52`），均无带 owner/触发的独立延期 OI；本文件 `## 风险与延期交接` 留占位，待后续步骤回填 |

#### OI 记录与消费者

```yaml
task_id: workflowhub-thin-core-card-09-20260919
outline_version: outline-r2-group2-20260919   # 母材料记录版本，本卡原样沿用（decision-log.md:399）
oi_id: OI-011
category: success_failure_boundary
source: 当前会话用户新增要求 U-009 第 3 条；本轮实测进程与采样证据（decision-log.md:402）
question: >-
  WorkflowHub 任务为何造成不可接受的 CPU 占用与温度（超过 80 度、风扇超过 5000 转），
  是哪个进程导致，如何在不牺牲必要能力的前提下优化？（decision-log.md:403）
status: confirmed
selected_disposition: CPU/温度问题按实测定位为高基线+高峰值；环境层与产品层修复分开（decision-log.md:410）
resolution: >-
  已收敛（实测定位 + 用户决定）：原因不是 kernel，而是「高基线 + 高峰值」。高基线（无任务时）为 WindowServer 约 35%、
  DSH 渲染器约 19%、kernel_task 约 18%（温控征兆）、DSH GPU 约 10%，合计约一个整核；系统已在近 30 分钟记录
  thermal-pressure Heavy 与 Moderate。高峰值为一次审查 2 角色 × 3 provider = 6 个 agent CLI 并发约 5.6–6.0 分钟
  （今日实测 codex 单角色 333s 与 360s）。环境层修复项与用户决定：重启=用户选择暂不重启；Spotlight 排除 ~/Project=用户同意
  但 macOS 无受支持命令行接口，需用户在已打开的系统设置面板中拖入一次（待用户动作）；清理陈旧 worktree=用户未授权；
  关闭不必要的常驻重后台（ToDesk 远控抓屏、极空间、微信、Adobe CC、CodexBar、VS Code、Agents Anywhere）=用户可自行处置。
  产品层修复项交后续实施任务与 build-plan：①broker 回收孤儿 manager/provider（必须先解除 broker 自己写入的只读目录，
  否则 cleanup 删不掉）；②限制单次审查并发 provider 数（峰值主因，收益最大）；③减少材料与证据写入量以降低索引抖动；
  ④主会话只派发与回收以降低常驻进程与 GUI 渲染。已更正先前误判：每次轮询 spawn 一个 3rd-review 进程的成本实测仅 0.03s，
  不是热源；1000ms→5000ms 属边际优化。（decision-log.md:405）
# 注：上述 resolution 引文为母材料原句，按只读保留。其中产品层第②项「限制单次审查并发 provider 数」已被用户撤销，
# 见 U-003 第 1 条与 D-001/D-022；母材料本体不修改，撤销只在本卡登记。
evidence: OI-011 resolution 与 CPU 诊断节（decision-log.md:411）
acceptance: 实测数据、已执行缓解与待实施项写入材料（decision-log.md:412）
counterexample: 把非热源说成热源或不做实测（decision-log.md:413）
impact_dimensions: [scope, acceptance]（decision-log.md:406-409）
requires_user_decision: true（decision-log.md:414）
visible_group_id: talk-round-4-group-2（decision-log.md:415）
consumer: >-
  CARD-09 资源四项（FR-43..46）的实施与实测；用户（机器温度/风扇与可解释的交付耗时）、build-code/verify-code 主会话、
  实际 reviewer 与工作子代理（prd.md:488）；资源四项的实测验证责任在 CARD-09 报告/测量责任人（prd.md:517）
# 核心 OI 的当前确认通过本文件的直接处置字段与用户实际答复对应。
# 不创建或消费 interaction aggregate；旧记录里的 interaction_ref / interaction_hash
# 只读保留，不再是当前凭证来源或完成依赖。
```

## 发散候选与可证伪大纲

本阶段只登记「被考虑但未采纳」的方向与其可证伪条件；不宣称任何改善已完成。

| 发散候选 | 考虑过的理由 | 未采纳原因 | 关联决定 |
| --- | --- | --- | --- |
| 限制单次审查并发 provider 数 | 母 OI-011 把它列为审查期 CPU 峰值主因、收益最大 | 峰值只影响审查期 CPU，不影响全局；降质换约 6 分钟峰值下降不划算 | D-001、D-022 |
| 用 CPU% / thermal pressure / 风扇转速实测做资源效果验收 | 母 AC-51 原写法 | 非确定性、不可复现即 inconclusive，且该要求已随 D-001 撤销 | D-004、D-023 |
| 把时间分账写进阶段交接说明，或另写独立报告文件 | 便于人读对账 | 违反 `CONSTITUTION.md:174`「报告只留原始件」 | D-013、D-021 |
| 外挂工具放技能目录但不登记，或改放 `runtime/third-review/` | 少改主仓检查 / 不占技能目录 | 未采纳；用户选 A：正式技能目录 + 修检查 | D-017 |
| 用现有旁证（11GB / 23 万文件 / 5493 个历史包）当写入量修前基线 | 省一次采样 | 未采纳；用户选先采一次真基线 | D-011 |

| 可证伪条件 | 说明 |
| --- | --- |
| 若限制并发 provider 数后，审查结论质量与不限制时完全一致，且总耗时不变 | 则「纯粹是降质、没有任何收益」不成立（本卡已撤销该要求，此条件只作反例留档） |
| 若同一负载下前后两次热采样得出方向相反的结论 | 则热采样不能作为资源效果验收 |
| 若阶段交接说明里加一节时间分账后，原件之外不再需要任何新文件即可对账 | 则该做法不违反「报告只留原始件」（用户已判定其违规，本卡按用户判定执行） |
| 若新增技能文件后主仓残留检查仍然通过 | 则「检查没有为真正新增文件留豁免」不成立 |
| 若既有旁证能被原样复算并与真基线一致 | 则不必另采真基线 |

## 目标

一句话目标：让「开发一个改进任务的时间花在哪、为什么反复返工」变得可现场复算、可验证；顺手收掉审查链里的孤儿进程与重复读写。

- 可现场复算：耗时结论只用已有命令/审查/会话原件，需要时从原件现场复算并当场展示，不落派生报告文件（D-013、D-024）。
- 可验证：效率四项（含「开工前对齐」）各有可核对的原件与复算路径；资源三项各有确定性计数证据（D-004、D-008）。
- 顺手收掉：孤儿 manager/provider 回收（含先解除只读目录）与同一 provider 输出重复落盘的合并（D-006、D-010）。
- 边界：本卡不以限制审查并发 provider 数为目标，也不以 CPU%/温度/风扇读数为验收目标（D-001、D-023）。

## 成功/失败边界

**成功**

- 效率四项（耗时分账、失败来源定向处理与最小复验、完整材料的小导航、无进展升级与受控取消）加「阶段开工前对齐」，各有可核对的原件与复算路径（D-008、D-012）。
- 资源三项（孤儿 manager/provider 回收含先解除只读目录、材料与证据写入量下降、主会话只派发与回收）各有确定性计数证据：进程数 / 文件数 / 写入字节量（D-004）。
- 外挂工具在仓内可运行，且自带 32 个测试可跑（D-002、D-019）。
- 母需求文档同步完成：FR-44/AC-44 删除、AC-51 收窄、FR-46 验收改确定性、FR-58 口径修正、追踪表与验收标准同步（D-007、D-020）。

**失败**

- 用采样外推或估值代替原件；缺数据却宣称改善。
- 新增任何时间分账派生文件或报告文件（D-013、D-024）。
- 孤儿或过期目录残留；写入量不降或无测量。
- 把平台/安全策略中断混进「明确人工等待」，或落进「未归因时间」（D-015）。
- 拿采样外推冒充确定性计数（AC-51 新增失败场景，D-001）。

## 范围

沿用母 `prd.md:489` 的窄范围语言（只窄改现有报告方法、review caller/组包/parser、host 委派方法及 owned-process 取消路径），加本轮新增：

- 效率四项（母 FR-58..FR-61）加「阶段开工前对齐」一条：开工前把计划里声明的「谁消费这个文件、要跑什么命令」与真实代码核对一遍，对不上就停下来问人（D-008、D-012）。
- 资源三项：孤儿 manager/provider 回收（含先解除只读目录）、材料与证据写入量下降、主会话只派发与回收的确定性计数验证（D-004、D-005、D-010）。
- 外挂工具整仓迁入 `skills/third-review/`：搬 `SKILL.md + lib/** + scripts/**`（+ 可选 `LICENSE`、`config.example.json`、`docs/exceptions.md`），新建 `skill-bundle.json`，改宿主配置 `third_review.command[1]` 一行，记录基线 `97132960` / v4.0.0（D-002、D-003）。
- 主仓检查维护：修 `tests/contract/thin-core-residue.test.mjs` 的新增文件豁免；救活 `thin-core-residue` 与 `card06-migration-ledger` 两个检查；外仓 32 个测试搬入并加独立测试入口（D-017、D-018、D-019）。
- 母需求文档一次性修改（FR-44/AC-44 删除、AC-51 收窄、FR-46 验收改确定性、FR-58 口径修正、追踪表与验收标准同步）并提交 main（D-007、D-020）。

## 非目标

- 不限制审查并发 provider 数（D-001、D-022）。
- 不采 CPU% / thermal pressure / 风扇转速做验收（D-004、D-023）。
- 不新增 public command、stage、持久对象、永久遥测、调度器、progress trace、checkpoint permit（沿用母 `prd.md:489`；D-024）。
- 不新增任何时间分账派生文件或报告文件（D-013、D-024）。
- 不重写 CARD-06 已修调用缺陷（只作回归反例，`prd.md:512`）。
- 不改变 CARD-08 接续职责、既有审查点或 CARD-10 套件主体；不增删 CARD-10 用例（`prd.md:489`）。
- 不重跑或恢复已退役的全 Phase 集成审查。
- 环境层四项（用户侧动作）仍在卡外（`prd.md:489`、`prd.md:159`）。
- 不做「精确浪费小时数」「收费 token」这类无法从原件复算的宣称（D-013）。

## 决定

| 决定编号 | 决定内容 | 选择依据 | 被拒替代 | 状态 |
| --- | --- | --- | --- | --- |
| D-001 | 撤销「限制单次审查并发 provider 数」这项产品层要求，本卡不再限并发。连带：删除 FR-44 与 AC-44 两条整条；AC-51 收窄为只挂 FR-46，度量改为确定性计数（进程数/文件数/写入字节量），失败场景增加「拿采样外推冒充确定性计数」；FR-46 保留但验收改为确定性指标，不再采 CPU%/thermal pressure/风扇转速 | 用户原话：「原始需求是限制并发吗？并发再高，也就是审查的时候 cpu 高点，根本不影响全局。你把原始需求完全搞错了！我根本不像限制审查的 provider 数量并发！纯粹是降质，没有任何收益！」（「我根本不像」为口语笔误，意为「我根本不想」）。事实依据：母 `prd.md:493` 确实写有该要求；母 `decision-log.md:405` 登记的产品层第②项原句为「限制单次审查并发 provider 数（峰值主因，收益最大）」；母 `decision-log.md:899` 诊断原句「一次审查 2 角色 × 3 provider = 6 个 agent CLI 并发（kimi / agy / codex），每个自身还会起子进程；另加每角色 1 个 broker/manager 与 2 个 stage-runtime 进程」。该要求的目的是压掉审查期约 6 分钟的 CPU 峰值以降温，从不是提速。用户判断：降质换 6 分钟峰值下降不划算 | 限并发（母产品层第②项） | 已确认 |
| D-002 | 把外部仓库 `/Users/Hugh/Hugh/Project/3rd-review` 整仓迁入 workflowhub，作为仓内技能存在。落点 `skills/third-review/` | 用户原话：「可以把 3rd-review 整仓迁移到 workflowhub 内部 skill 文件夹内，作为 workflowhub 的内部技能存在，这样就没有外仓问题了」。不能叫 `3rd-review`：主仓 `runtime/distribution/skill-bundle-release.mjs:330` 的 `^[a-z][a-z0-9-]*$` 与 `:28` 的 `promptSkillReferences` 两条正则硬拒数字开头的名字 | 继续留在外仓 | 已确认 |
| D-003 | 搬家只搬代码，不搬 Git 历史；记录外仓基线；原仓保留归档 | 用户选择「只搬代码，记录基线 commit，原仓保留归档」。外仓基线（实测）：`HEAD 97132960d7dab9145cbd0bdf610e09bf422e2ec0`，branch `main`，origin `https://github.com/Hugh4424/3rd-review.git`，version `4.0.0`，工作树干净，`git ls-files` 110 项 | 搬 Git 历史 | 已确认 |
| D-004 | 保持「主会话只派发与回收」这条要求，但验收改为确定性指标（进程数/文件数/写入字节量），不再采 CPU%/thermal pressure/风扇转速 | 与 D-001 的度量口径一致；热采样非确定性 | 热采样验收（D-023） | 已确认 |
| D-005 | 本卡重心：以效率四项为主，资源只保留「孤儿回收」与「写入量下降」 | 用户原话：「以效率四项为主，资源只留 FR-43 回收 + FR-45 写入量」 | 资源四项全保留 | 已确认 |
| D-006 | 顺手治重复读写（合并同一 provider 输出被写两份的重复落盘） | 用户选择「效率为主，顺手治重复读写」 | 只做效率、不碰重复落盘 | 已确认 |
| D-007 | 母需求文档等 make-decision 收敛后一次性修改并提交 main | 用户选择「等 make-decision 收敛后一次性改并提交」。说明：母 `prd.md:690` 已有用户原话「增补需求草案请直接更新到prd里的card-09任务，prd的更新请直接提交到main，因为我会在当前任务进行中同步开始card-09任务。」→ 改母 PRD 不需再次取得授权 | 边谈边改、逐条提交 | 已确认 |
| D-008 | 效率范围＝现有四项再加一条「开工前对齐」 | 用户选择「四件 + 开工前对齐」。新条内容：阶段开工前，把计划里声明的「谁消费这个文件、要跑什么命令」与真实代码核对一遍，对不上就停下来问人 | 只做原四项 | 已确认 |
| D-009 | 搬家与本卡效率改进放在同一个任务里，搬家作为第一个阶段 | 用户选择「同任务，搬家作为第一个阶段（推荐）」 | 拆成两个任务 | 已确认 |
| D-010 | 资源侧两件事都保留 | 用户选择「两件都保留（推荐）」 | 只保留一件 | 已确认 |
| D-011 | 写入量「修前基线」先真实采一次 | 用户选择「先采一次真基线（推荐）」 | 用现有旁证当基线 | 已确认 |
| D-012 | 「开工前对齐」只管阶段开工前（不含每次派活前，也不限于只改本任务） | 用户选择「只管阶段开工前（推荐）」 | 每次派活前都对齐 / 只对齐本任务改动 | 已确认 |
| D-013 | 时间分账不落任何文件；需要时从已有原件现场复算并当场展示 | 用户原话：「我不需要这份报告！这种报告属于违反workflowhub核心宪法的垃圾文件！请仔细检查」。用户选择「不落文件，需要时现场算给你看（推荐）」。宪法依据（原文）：`CONSTITUTION.md:174`「报告只留原始件，不保存整棵目录/工作树快照或镜像。」；S4「自研技能按实际评估需要采集必要指标，复用统一事实底座；指标缺失如实未知，不为计量单独建设控制系统。」；F10「自动化按真实收益添加，不为"机器可校验"本身堆基建」 | ①写进阶段交接说明（用户判定为违反宪法的垃圾文件）②另写一份独立的「时间分账报告」文件（同罪） | 已确认 |
| D-014 | 量测基线（修前/修后各一次）的原始命令输出存成任务证据，跟其它命令原件同等待遇 | 用户选择「存成命令证据（推荐）」 | 只在对话里报数、不留原件 | 已确认 |
| D-015 | 时间分账的分类里，为「平台/安全策略中断」单独开一类 | 用户选择「单独开一类（推荐）」。事实依据：CARD-06 耗时调查原件 `card06-duration-rootcause.md:93` 逐字「最后因宿主 `This content was flagged for possible cybersecurity risk` 终止」；`:95` 逐字「V 明确 5h28m 人工停顿是外发审批未被平台接受后的等待」 | 并入「明确人工等待」/ 落进「未归因时间」 | 已确认 |
| D-016 | 审查包的「短入口/导航」主要给审查模型读（不是给人看的抽查入口） | 用户选择「主要给审查模型（推荐）」 | 给人看的抽查入口 | 已确认 |
| D-017 | 外挂工具搬进正式技能目录，并修改主仓的安全检查（加一条「新增技能文件不算复活」的修正） | 用户选择「A：正式技能目录 + 修检查（推荐）」。事实依据（实测）：主仓 `tests/contract/thin-core-residue.test.mjs` 按文件名比对，任何 `SKILL.md` 都归为模块名 `SKILL`，与迁移表 `MT-3-143 workflows/build-spec/SKILL.md` 的 DELETE 行碰撞；实测放一个 `skills/third-review/SKILL.md` 探针即报 `AssertionError: 已删模块 SKILL 以新路径复活：skills/third-review/SKILL.md`（该测试 805 个断言中 1 个失败，其余 804 个通过）；根因是该检查没有为「真正新增且未登记的文件」留任何豁免 | 方案 B：放技能目录但不登记；方案 C：改放 `runtime/third-review/` | 已确认 |
| D-018 | 救活两个已失效的检查（`tests/contract/thin-core-residue.test.mjs` 与 `tests/contract/card06-migration-ledger.test.mjs`） | 用户选择「救活它（推荐）」。事实依据（实测）：两个检查都从 `tests/contract` 上溯找 `specs/workflowhub-thin-core-card-06-20260919/attachments/migration-table.md`，找不到就在 import 期抛 `无法从 … 上溯找到含 … 的仓库根`；该目录在 12 个 worktree 中全部不存在，只剩 `specs/archive/workflowhub-thin-core-card-06-20260919/` 归档副本；主仓无 CI（无 `.github`/`.gitlab-ci.yml`/`.circleci`） | 只救一个 / 移除两个检查 | 已确认 |
| D-019 | 外挂工具自带的 32 个测试搬进主仓，单独接一条命令跑，不挂进全量回归 | 用户选择「搬进来，单独接一条命令跑（推荐）」。事实依据：外仓 32 个 `*.test.mjs` 全部用 `node:test` + `node:assert/strict`，0 个 vitest；主仓 `vitest.config.mjs` 的 `include` 含 `skills/**/*.test.mjs`，直接搬会让 `pnpm test:skills` 变红 | 不搬测试 / 挂进全量回归 | 已确认 |
| D-020 | 需求口径修正：母 `prd.md:496` FR-58 原文以「在既有阶段人读报告一次性区分…」表述时间分账，与 D-013 冲突，须改为「用已有原件现场可复算」口径（去掉「报告」作为交付物的含义） | 用户选择：D-013 | 保留「报告」口径 | 已确认（具体改写文字留待母 PRD 一次性修改时落笔） |
| D-021 | 拒绝「在交接说明里加一节时间分账」与「另写独立时间分账报告文件」两个方案 | 违反 `CONSTITUTION.md:174` | 两个方案本身 | 已拒绝 |
| D-022 | 拒绝「限制审查并发 provider 数」原要求，并连带删除其验收条目 | 见 D-001 | 限并发要求本身 | 已拒绝 |
| D-023 | 拒绝「用 CPU%/thermal pressure/风扇转速实测对比」作为资源效果的验收方式（改确定性计数） | 非确定性、不可复现即 inconclusive；用户已撤销该要求 | 热采样验收本身 | 已拒绝 |
| D-024 | 本卡不新增 public command、stage、持久对象、永久遥测、调度器、progress trace 或 checkpoint permit（沿用母 `prd.md:489` 范围句）；也不新增任何「时间分账报告」类派生文件（本决定由 D-013 强化） | 母 `prd.md:489` 范围句 + D-013 | 新增控制面 / 新增派生报告 | 已确认 |
| D-025 | 沟通硬约束：本阶段与后续所有面向用户的沟通，不再说黑话、术语和内部 ID | 用户原话：「我选1，另外不要再说黑话、术语和内部ID了，我完全看不懂，你根本没在说人话」 | 继续用内部缩写/编号向用户解释 | 已确认 |
| D-026 | 修掉 CARD-08 交付后遗留的三处技能元数据漂移（`skills/reuse-registry.md:56`、`skills/catalog.yaml:88-100`、`repo-skills.manifest.json:21-34`）：按已交付的交接方法改写，改为「由当前 stage owner 用现有 safe-write 的 appendRecord 一次 create-only 发布并回读实际不可变路径、五阶段（含 verify-code）使用」，并把 catalog 的 `metrics_enabled` 与清单的 `false` 对齐 | 用户原话（m00843）：「B」；随后对本卡两个选项逐字答复：「现在提交（推荐）」与「一起修（推荐）」——授权把三处过时描述改正并提交 main。事实依据：CARD-08 交付把交接从「固定名 + 原子覆盖 + 四阶段」改成「create-only 不可变发布 + 五阶段」，但三处元数据仍描述旧设计；CARD-08 写集只覆盖那六份文件，其验收也未覆盖这三个元数据文件。`skills/catalog.yaml` 在 CARD-08 的 DO NOT TOUCH 列表**之外**（列表见 `specs/archive/workflowhub-thin-core-card-08-20260919/spec.md:391`），`skills/reuse-registry.md` 与 `repo-skills.manifest.json` 同样不在其写集内 | 只修 `skills/reuse-registry.md` 一处 / 只登记不修（留 build-plan） | 已实施：提交 `9a033b81 docs: align stage-handoff registry metadata with CARD-08 delivery`（main，3 文件 11+/10-）；授权原件 `quality/evidence/human-confirmations/2026-10-04-001-make-decision-reuse-registry-drift-fix.json` 与 `quality/evidence/git-authorizations/2026-10-04-001-authorize-commit.json`。验证：JSON 解析通过；YAML 解析该条目通过；`node --test tests/contract/ui-skill-contract.test.mjs` 5/5 通过；`tests/contract/thin-core-residue.test.mjs` 与 `tests/host-independence.test.mjs` 的失败经 `git stash` 对照确认在改动前即为红（`host-independence.test.mjs:50` 既有 `TypeError: The "path" argument must be of type string. Received undefined`），非本次改动引入 |

| D-027 | 修复审查链两处运输缺陷并删除固定时间上限：①native 文档审查路径对「没有已验证 packet 文件系统边界」的 provider 启动前即拒；②`skills/wh-review/scripts/review-provider-client.mjs` 的固定 600000 ms 主机期限（非配置项）。改为：packet boundary 预检只在真的会走本机 native 兜底时生效，其余情况走托管路径；全部 deadline 机制删除，provider 只由终止或显式取消结束 | 用户原话要点（m00699）：「彻底删除时间上限」「用 third-review 会话健康判断决定是否继续等待」「查清『文档审查启动前被拒』是谁改坏的并改回来」。事实依据（实测）：首轮方向审查得 `status=unavailable`、`dispatch_state=blocked_before_dispatch`、0 findings，顶层 `error.code=REVIEW_EXECUTION_TIMEOUT`（`provider exceeded the fixed 600000 ms host deadline`）；kimi 与 antigravity 报 `PROVIDER_PACKET_BOUNDARY_UNAVAILABLE`（「Kimi broker Read has no verified packet filesystem boundary」「Selected native provider has no verified packet filesystem boundary」），二者在本地启动前即被拒（`skills/wh-review/scripts/simple-review-runner.mjs:1257-1260`、`skills/wh-review/scripts/review-provider-client.mjs:988`）；codex 侧两角色各跑满 600024/600084 ms 后被砍断，3 个 thread 已读完 packet 并在写 `independent_reconstruction` 时中断 | 保留可配置超时 / 只把 600s 调大 | 已实施（未提交，本卡工作树内 5 文件 56+/90−）：`runtime/review/ocr-delegation-adapter.mjs`（删 `REVIEW_PROVIDER_HOST_DEADLINE_MS`、`OCR_PROVIDER_DEADLINE_MS` 及 `runOcrProviderProcess`/`runPacketBoundCodexReview` 的全部 deadline 机制）、`skills/wh-review/scripts/review-provider-client.mjs`（删 `#runNativeGroup` 的 `documentBudget`/组级超时/abort 监听，native 提前返回改由新显式参数 `nativePacketFallback === true`（默认 false）门控，`startManaged` 与 `runGroup` 各加该参数）、`skills/wh-review/scripts/simple-review-runner.mjs`（packet boundary 预检改为只在 `dependencies.nativePacketFallback === true` 且客户端非注入且不支持 packet boundary 且 provider 未被 block 时才生效，并把该参数透传两处）、`tools/cli/stage-runtime.mjs`（`detection.status==="not_installed"` 的 OCR 回落分支显式传 `nativePacketFallback: true`）、`tests/contract/ocr-ac006-011-experiments.test.mjs`（该用例补该参数）。验证：`npx vitest run tests/contract/ocr-delegation-adapter.test.mjs` 与 `simple-review-runner.test.mjs` 与改动前基线逐条同名同数（新增红 0、修好绿 0；前者 3 failed/43 passed 为 macOS realpath 伪红，非符号链接 TMPDIR 下 46/46 全绿；后者 38 failed 为既有红）。真跑验证：重跑方向审查得 `2026-10-04-027`，6 provider 全 `completed`，耗时 9 分 17 秒，记录内 `deadline_ms` 全为 `null`，无超时。**保留项**（非等待上限，不动）：`review-provider-client.mjs:265` `LATE_SUPPLEMENT_WINDOW_MS=600000`（晚到补充窗口，契约 `workflowhub-result.v3.json:150` 明令不动）、`simple-review-runner.mjs:32` `DEFAULT_MANAGED_STATUS_POLL_MS=5000`（轮询间隔，可被 `dependencies.managedStatusPollMs` 覆盖）、`review-provider-client.mjs:17-22` `REVIEW_BROKER_TIMEOUT_FROM_ENV`（读 `WH_REVIEW_BROKER_TIMEOUT_MS`，未设置即为无时限）、`ocr-delegation-adapter.mjs:12` `DEFAULT_EXECUTOR_CANCELLATION_GRACE_MS=30_000`（取消后确认进程终止的宽限）。3rd-review 侧未改（`runtime.orphan_timeout_ms=30000`、`runtime.ttl_hours=24` 保持） |
| D-028 | make-decision 方向审查的协议口径：direction 轨道是**一次请求内**的 `reconstruct → reveal → challenge` 三阶段，三阶段材料必须在同一请求内全部提供；只给问题大纲会让 reveal 与 challenge 空转，该轮不构成对候选方向的独立挑战 | 事实依据（实测）：`skills/wh-review/scripts/review-provider-client.mjs:995` 在 `reviewFlow` 非 null 时走 `["reconstruct","reveal","challenge"]`；`:1008-1011` 的 reconstruct 步只可见 `raw_requirement` 与 `objective_facts`，reveal 与 challenge 步才见全量材料；`:1019-1021` 的三步指令原文要求 reveal 步「Read the submitted selection/alternatives/rationale/assumptions」。本轮只送 3 个必需件、未送 `current_selection`/`alternatives`/`selection_rationale`/`key_assumptions`，故 `2026-10-04-027` 的 challenge 步挑战的是空包（`blue | codex/luna` 第 18 条命中）。契约原文见 `skills/wh-review/contracts/make-decision.md`：「reconstruct 阶段不交付 OI 答案、方案结论、确认回复、decision log、detail 结果、spec、plan、代码或测试。答案与选择只能在 reveal 后可见。」 | 把 `current_selection` 等可选件当成可省项 | 已确认：用户 m01178 选择「不再重跑，就地处置这 22 条」，故本轮缺口如实登记（见审查处置 F-18）；**后续任何一轮方向审查必须同时提供候选方向、替代方案、取舍理由与关键假设，否则该轮只作材料核对，不得作为方向收敛依据** |
| D-029 | 母卡范围句与本卡已授权范围存在口径差，须在母 PRD 一次性修改时同步：①范围句「只窄改现有报告方法、review caller/组包/parser、host 委派方法及 owned-process 取消路径」须补入 D-002 授权的「3rd-review 整仓迁入 `skills/third-review/`」及其连带项（修主仓安全检查、救活两个失效检查、32 测试独立入口、宿主配置一行）；②FR-43 的落点随整仓迁入由外仓变为仓内技能目录 | 事实依据：母 `prd.md:489` 范围句原文如左，未含整仓搬迁；而 D-002/D-017/D-018/D-019 已由用户逐条确认该范围。本轮 5 个独立审查方（red/blue × kimi/antigravity/codex 中的 5 条）一致判「Q4/Q5/Q15 超出已授权范围」，命中的正是这处口径差。FR-43 原文「broker 回收孤儿 manager/provider」的 broker 实现位于第二仓，主仓 provider 侧自 `457299b3` 起 native-only，但 broker 仍在 `/tmp/3rd-review` 建 runtime 并派生泄漏 manager | 不改母范围句、让审查方持续误判 / 把搬迁降级为卡外工作 | 已确认：随 D-007 的母 PRD 一次性修改落笔（用户 m00799 已授权合并 main 改动；母 PRD 修改时机为 make-decision 收敛后） |
| D-030 | 方向审查的本轮结论：不把 `2026-10-04-027` 的 22 条当作方向收敛依据，只把其中可核对的事实项并入本日志；方向收敛仍以本卡 Talk 各轮的真实用户答复与 D-001..D-026 为准 | 用户 m01178 选择「不再重跑，就地处置这 22 条」；本轮 reveal 步缺候选方向（D-028），且母卡原始需求本身含方案（审查处置 F-07），独立重建在信息上不干净 | 把 22 条当作独立方向建议直接改方向 | 已确认 |

| D-031 | FR-46 保留，验证对象由「CARD-03 承接实现的派发方法」改为**真实派发行为**：本卡与后续阶段实际发生的派发事实（审查会话真实发起的子代理次数、主会话自行执行次数、进程数与文件数、材料与证据写入字节量），按确定性计数验证 | 用户 m01230 在「FR-46 验证对象」三选中逐字答复「改成验『真实的派发行为』」。事实依据（实测）：CARD-03 的派发方法落点已被 CARD-06 按迁移表删除——`specs/archive/workflowhub-thin-core-card-06-20260919/attachments/migration-table.md:745` `MT-6-368 | tests/contract/card03-dispatch-method.test.mjs | AGENTS.md 文本 | DELETE | B7/P8`、`:812` `MT-6-441 … runtime/stage/stage-runner.mjs（MT-1-070）DELETE B4/P5`；现仓 `git ls-files` 无 `runtime/stage/stage-runner.mjs`、`runtime/stage/stage-handlers.mjs`、`tests/contract/card03-dispatch-method.test.mjs`；仍在的只有 `AGENTS.md:14-19` 派发治理文字与 `tools/cli/stage-runtime.mjs`。故「实现 owner=CARD-03」只作历史来源记录 | 从卡里拿掉该条（资源侧缩为两项）/ 推到 build-plan 再定 | 已确认：`fixed`（审查处置 F-01）；FR-46 与 AC-46 保留，度量沿用 D-004 的确定性计数 |

## 动态 Talk 批次

每轮记录：提出的问题、用户真实答复（逐字或明确选择）、产生的决定编号、未答/被推翻项。

**第 1 轮（4 问：外仓边界 / 写入量落点 / 并发限制形态 / 与 CARD-06 的时序）**

- 答复：外仓「两边一起改」；写入量「存量回收+新增上限」；并发限制「按 provider 扇出加硬上限」（**该答复后被 D-001 推翻**）；时序题未选，指出 card-06 已完成收口提交。
- 产生决定：本轮答复中的限并发部分被 D-001 推翻；其余进入后续轮次重问。
- 未答/被推翻：并发限制形态（被推翻）；与 CARD-06 的时序（用户未选，改为按实测确认 CARD-06 已收口，见 OPEN-004）。

**第 2 轮（4 问：热指标测法 / 托管路径范围 / 失败来源做法 / 耗时数据源）**

- 答复：热指标「真跑一次同任务前后对比」（**该答复后被 D-023 推翻**）；托管路径「先确认活路径再决定范围」（已由调研判定：外仓 broker 已不在活路径，自 `457299b3` 起 native-only）；失败来源「复用外仓已有的失败分类与取消语义」；耗时数据源「已有原件 + 独立上下文提取子代理区间」。
- 产生决定：后三项进入 D-004、D-006、D-013 等；热采样验收被 D-023 推翻。
- 未答/被推翻：热指标测法（被推翻）。

**第 3 轮（3 问：范围撤销确认 / 搬家落点 / 重心收敛）**

- 答复：见 U-003 三条逐字原文。
- 产生决定：D-001、D-002、D-005、D-022。
- 未答/被推翻：无。

**第 4 轮（3 问：效率够不够 / 搬家放哪一轮 / 资源两件怎么定）**

- 答复：效率「四件+开工前对齐」；搬家「同任务、搬家作为第一个阶段」；资源「两件都保留」。
- 产生决定：D-008、D-009、D-010。
- 未答/被推翻：无。

**第 5 轮（3 问：时间报告写哪 / 写入量基线 / 开工前对齐管多宽）**

- 答复：时间报告题**未选任何选项**，写了自定义答复（见 U-004）；写入量「先采一次真基线」；开工前对齐「只管阶段开工前」。
- 产生决定：D-011、D-012、D-013、D-021。
- 未答/被推翻：选择题选项全部未采纳。

**第 6 轮（2 问：时间分账怎么交 / 基线怎么存）**

- 答复：时间分账「不落文件、需要时现场算」；基线「存成命令证据」。
- 产生决定：D-013、D-014。
- 未答/被推翻：无。

**第 7 轮（2 问：平台中断算哪类 / 导航给谁看）**

- 答复：平台中断「单独开一类」；导航「主要给审查模型」。
- 产生决定：D-015、D-016。
- 未答/被推翻：无。

**第 8 轮（2 问：三处元数据漂移修不修 / 改完是否现在提交 main；触发＝用户 m00799 告知 CARD-08 已完成）**

- 用户 m00799 原话：「注意，card-08任务已开发完成提交到main，你可以把main的改动合并进来，再看看当前任务是否需要更新或变化」。
- 主会话复核结论（供本轮决策）：CARD-08 已收口并合入 main；那六份文件与本卡已定方案零重叠，故 OPEN-003 的「在途冲突」前提消失；另发现三处技能元数据仍描述旧交接设计（`skills/reuse-registry.md:56`、`skills/catalog.yaml:88-100`、`repo-skills.manifest.json:21-34`），CARD-08 写集与验收均未覆盖。
- 答复 1（修不修）→ 用户先答「B」（＝现在就单独修掉 `skills/reuse-registry.md:56` 这一句），随后在「另两处是否一起修」的选项上答「一起修（推荐）」→ **D-026**。
- 答复 2（是否现在提交 main）→ 「现在提交（推荐）」→ 已按 `runtime/interface/git-authorize.mjs` 记录授权并提交 `9a033b81`。
- 产生决定：D-026。
- 未答/被推翻：无。

**非选择题的真实答复（逐条）**

- 外挂工具自带的 32 个测试怎么处理 → 「搬进来，单独接一条命令跑」→ D-019。
- 认证环境情况 → 「不确定，你先去查」→ 主会话查完：无 CI，12 个 worktree 全无该目录，该检查永久失效 → D-018。
- 外挂工具放哪 → 「A：正式技能目录 + 修检查」→ D-017。
- 失效的检查怎么办 → 「救活它」→ D-018。
- 外仓 git 历史 → 「只搬代码，记录基线 commit，原仓保留归档」→ D-003。
- 改母 PRD 时机 → 「等 make-decision 收敛后一次性改并提交」→ D-007。
- 沟通方式（用户明确要求）→ 「我选1，另外不要再说黑话、术语和内部ID了，我完全看不懂，你根本没在说人话」→ **D-025（本阶段与后续所有面向用户沟通的硬约束）**。

**第 9 轮（0 问：审查链缺陷排查与修复的授权确认；触发＝用户 m00699）**

- 用户 m00699 原话要点（逐字摘录）：「彻底删除时间上限」「用 third-review 会话健康判断决定是否继续等待」「查清『文档审查启动前被拒』是谁改坏的并改回来」「修好后重跑 make-decision 方向审查」「把本次缺陷与修复如实登记进 decision-log」。
- 主会话查实的两条机制（非重跑可绕过）：①native 文档审查路径对 kimi/antigravity 没有「已验证的 packet 文件系统边界」，启动前即被拒（`skills/wh-review/scripts/simple-review-runner.mjs:1257-1260`、`skills/wh-review/scripts/review-provider-client.mjs:988`）；②`skills/wh-review/scripts/review-provider-client.mjs:14` 注释与实现均为固定 600000 ms 主机期限，非配置项。首轮方向审查因此得到 `status=unavailable`、`dispatch_state=blocked_before_dispatch`、0 findings。
- 产生决定：D-027、D-028。
- 后续裁定（用户 m01230）：FR-46 验证对象改为真实派发行为 → D-031；审查链修复与决策日志现在提交（授权原件见 `quality/evidence/git-authorizations/`）。
- 未答/被推翻：无（用户直接下达修复要求）。
- 后续：修复未提交时先真跑一次，得 `2026-10-04-020`（19 findings）；用户 m01057 逐字答「A」→ 重做洁净材料后重跑得 `2026-10-04-027`（22 findings）。

## 审查处置

### direction-advice 第一轮（`quality/reviews/2026-10-04-020-make-decision-direction.json`，19 findings）

该轮**不是干净盲审**：送出的 `objective_facts` 逐字含已定方向（撤销限并发、资源只留部分项、拒绝报告文件、拒绝热指标、平台中断单列、不新增控制面），违反 `skills/wh-review/contracts/make-decision.md` 的「reconstruct 阶段不交付 OI 答案、方案结论、确认回复、decision log」。审查方自己在 `2026-10-04-020` 的 `blue | codex/luna | materials/02-objective_facts.md:57` 命中该问题。用户 m01057 逐字答「A」＝重做材料后重跑。**故本轮 19 条只作过程记录，不作为方向收敛依据。**

### direction-advice 第二轮（`quality/reviews/2026-10-04-027-make-decision-direction.json`，22 findings）

- 运行事实：`status=available`、`dispatch_state=dispatched`、`outcome=completed`、`pair_status=complete`、`authoritative=false`；6 个 provider（kimi/coding、antigravity/flash、codex/luna × red/blue）全部 `completed`；`started_at=2026-10-04T12:02:08.736Z`、`completed_at=12:11:25.852Z`（约 9 分 17 秒）；严重度 `major 16 / minor 6`，无 blocking。红队 runtime `a0245409-ad1f-4f34-baef-b192e3d52174`（11 条），蓝队 runtime `f50129de-ddb0-4e0e-9487-13e29668db40`（11 条）。记录内 12 处 `deadline_ms` 全为 `null`，无超时触发。
- 三阶段协议确实执行：`review-provider-client.mjs:995` 在 `reviewFlow` 非 null 时走 `["reconstruct","reveal","challenge"]`；kimi 单 provider 耗时 277867 ms 即为三阶段之和。**但本轮 `reveal` 步没有可揭示的候选方向**（caller 未提供 `current_selection`/`alternatives`/`selection_rationale`/`key_assumptions`），故 challenge 步挑战的是空包——`blue | codex/luna` 第 18 条即命中该缺口。**用户 m01178 选择「不再重跑，就地处置这 22 条」**，本缺口如实登记为 F-18。
- 处置口径：`fixed`＝本轮已在 decision-log 内落定答案或改写；`rejected_invalid`＝发现本身不成立（事实错误或与已确认决定重复）；`accepted_risk`＝成立但接受，如实登记不修。计数：`fixed` 14 / `rejected_invalid` 6 / `accepted_risk` 2 / `needs_human` 0（F-01 由用户 m01230 裁定后转 `fixed`）。

| 编号 | severity | 来源 | 发现摘要 | 处置 | 依据 |
| --- | --- | --- | --- | --- | --- |
| F-01 | major | red / kimi | FR-46 是纯验证项，其可验收性取决于 CARD-03「主会话只派发与回收」是否已交付；全包无该交付状态事实 | `fixed` | 已查实：CARD-03 的派发方法测试与运行时承接方已被 CARD-06 删除；用户 m01230 裁定验证对象改为真实派发行为，见 D-031 与 F-01 详述 |
| F-02 | major | red / kimi | Q4/Q5/Q15（外挂仓搬迁、救活失效检查、32 测试入口）超出本卡已授权范围 | `fixed` | 由 D-002/D-017/D-018/D-019 明确授权；母卡范围句未同步，见 D-029 |
| F-03 | minor | red / kimi | 大纲「已知证据」引用了不在本次审查包内的材料（Q6 的两项/三项说法、Q15 的非目标句） | `fixed` | 材料层缺陷，已在本表 F-09/F-12/F-19 合并处置 |
| F-04 | major | red / antigravity | 同 F-02（scope 视角） | `rejected_invalid` | 与 F-02 同一发现，重复计数 |
| F-05 | major | red / antigravity | FR-43 把治理目标设为「broker 回收孤儿 manager/provider」，与主仓 provider 已 native-only 不符 | `fixed` | 部分成立：broker 确实仍在 `/tmp/3rd-review` 建 runtime 且泄漏 manager 仍由它派生；落点随 D-002 整仓迁入 `skills/third-review/` 后不再是外仓，见 D-029 |
| F-06 | major | red / antigravity | AC-51 以整机 CPU%/热压力作卡级硬性验收，但构成高基线的主要热源已排除出卡，度量无法闭合 | `fixed` | 已由 D-001/D-004/D-023 撤销热指标验收并改确定性计数 |
| F-07 | major | red / codex | 所谓「原始需求」已写死四项产品干预与验收，在重建阶段暴露了候选方向，使盲审不成立 | `accepted_risk` | 成立且不可修：卡正文本身就是母 PRD 的逐字摘录，见 F-07 详述 |
| F-08 | major | red / codex | 同 F-02（scope 视角） | `rejected_invalid` | 与 F-02 同一发现，重复计数 |
| F-09 | minor | red / codex | Q6 声称材料在两项/三项/四项之间不一致，但包内材料只有四项 | `fixed` | 事实成立：Q6 前提无来源，资源侧项数已由 D-005/D-008 定为三项 |
| F-10 | major | red / codex | Q13 把「禁止保存整目录/快照」误引成「不落文件」的冲突要求 | `fixed` | 引述不精确；实质冲突已由 D-013/D-024 落定（不落派生文件、需要时现场复算） |
| F-11 | major | red / codex | Q14 把「三节未回填」当作方向未冻结的未决问题，而该事实本身已说明未获批准 | `fixed` | 成立；三节（grill / 审查处置 / 最终确认）本阶段尚未执行，属步骤时序而非方向问题 |
| F-12 | major | blue / kimi | Q2/Q6/Q13 的跨材料主张缺包内逐字来源，补件前无法证实或证伪 | `fixed` | 材料层缺陷，与 F-03 同根因 |
| F-13 | major | blue / kimi | Q4/Q5/Q15 未经确认即扩范围，会改变交付边界与写集承诺 | `fixed` | 同 F-02；写集由本卡 build-plan 冻结 |
| F-14 | major | blue / antigravity | 同 F-02（scope 视角） | `rejected_invalid` | 与 F-02 同一发现，重复计数 |
| F-15 | major | blue / antigravity | Q2 把段落级写集与文件合并归属当作方向阻塞问题，混淆了实施规划与方向接收 | `fixed` | 成立；段落级写集按五阶段分工属 build-plan（母 `prd.md:522`），已在 OPEN-003 归类 |
| F-16 | major | blue / antigravity | Q14 颠倒 make-decision 的步骤顺序（grill 处置与人工确认是方向审查之后的事） | `rejected_invalid` | 与 F-11 同一发现，重复计数 |
| F-17 | minor | blue / antigravity | Q7 把约一核的稳态高基线当作未分配交付责任，重开了已排除的非目标 | `fixed` | 成立；环境层已由 R-017 排除出卡，Q7 应关闭 |
| F-18 | major | blue / codex | 审查包只有问题大纲，未提供当前选择、替代、理由、假设或独立重建，无法按要求挑战 | `accepted_risk` | 成立；用户 m01178 选择不再重跑，如实登记 |
| F-19 | major | blue / codex | 同 F-09（Q6 项数不一致无来源） | `rejected_invalid` | 与 F-09 同一发现，重复计数 |
| F-20 | minor | blue / codex | Q9/Q13 把「不落文件、现场复算」当作与 FR-58 冲突的权威要求，但所引来源并未禁止产出报告 | `rejected_invalid` | 事实不成立：包内 `objective_facts` 已含 `CONSTITUTION.md:174` 与快照禁令原文，且不落文件是用户 D-013 的真实选择 |
| F-21 | minor | blue / codex | Q10 问「哪些变量必须固定」而 FR-58 已写明固定项 | `fixed` | 成立；Q10 应收窄为「该固定集能否在可复现样本中保持」 |
| F-22 | minor | blue / codex | Q15 以 `AGENTS.md` 测试规则为前提，但该来源不在包内清单 | `fixed` | 成立；材料层缺陷，与 F-03 同根因 |

**F-01 详述（已裁决：验证对象改为真实派发行为，见 D-031）**

FR-46 原文为「主会话只派发与回收的资源占用效果被实测验证(CARD-03 承接实现,本卡验证)」，其验证对象是 CARD-03 交付的「主会话只派发与回收」。实测核查（本卡工作树与 main）：

- CARD-03 已 close（外置 facts 尾行 `close` @2026-10-01T11:27:31Z），其验收文件 `tests/acceptance/card-03-current.mjs`、`card-03-current.test.mjs` 在 main 中存在。
- 但 CARD-03 的派发方法落点已被 CARD-06 按迁移表删除：`tests/contract/card03-dispatch-method.test.mjs` 记 `DELETE | B7/P8`（`migration-table.md:745`、`migration-table-part5-tests.md:388`）；`tests/contract/card03-projection-root-causes.test.mjs` 的被测对象 `runtime/stage/stage-runner.mjs` 记 `DELETE B4/P5`（`migration-table.md:812`）；`card03-runtime-binding`、`card03-skill-bundle-closure`、`card03-completion-separation`、`card03-conditional-acceptance-contract` 同样 DELETE。
- 现仓实测：`runtime/stage/stage-runner.mjs`、`runtime/stage/stage-handlers.mjs`、`tests/contract/card03-dispatch-method.test.mjs` **均不存在**（`git ls-files` 无匹配）。
- 仍然存在的：`AGENTS.md:14-19` 的派发治理文字（「重活放进子代理上下文执行，主上下文只收摘要」「派发按工作类型，回传结论与清单，修复回原实施子代理同一会话」「五阶段共用并发区间为 2–5」「不空转轮询」「不整份继承父代理上下文」）与 `tools/cli/stage-runtime.mjs`（阶段运行入口）。
- 结论：**FR-46 原文所指「CARD-03 承接实现」的具体落点已不存在，只剩治理文字与真实派发行为。**该条按确定性计数验证仍可做（数进程数/文件数/写入字节量），但「验证什么对象」需要用户裁定。

- 用户 m01230 裁定（选项「改成验『真实的派发行为』」）：**FR-46 保留，验证对象由已删的 CARD-03 实现改为真实派发行为**——即本卡与后续阶段实际发生的派发事实：审查会话真实发起的子代理次数、主会话自行执行的次数、进程数与文件数、材料与证据的写入字节量。故本条的「实现 owner=CARD-03」只作历史来源记录，不再作为验证前提。

**F-07 详述（accepted_risk）**

审查方指出送审的「原始需求」本身已写死四项产品干预、四项效率交付与排除项，使独立重建在信息上不可能干净。该判断成立：`2026-10-04-001-card09-raw-requirement.md` 是母 `prd.md:486-522` 卡正文的逐字摘录，而母卡正文本身即含 FR/AC 与「产品层四项」表述。按 `skills/wh-review/contracts/make-decision.md`，干净重建需要一份不含方案的原始问题件，但本卡的原始需求就是这份带方案的卡正文（且母材料只读、本卡不改写）。**接受该结构性限制并如实登记**：本卡的方向审查在「重建」环节天然带污染，其独立挑战价值主要来自 reveal→challenge 两步与对材料的交叉核对，而非纯净重建。

## 调研

本轮已完成的只读调研（每条一句结论 + 关键实测数字）：

- 外仓形态与活路径判定：主仓不含 `3rd-review/`，broker/manager（含 `lib/broker.mjs`、`lib/managed-session-manager.mjs`）位于第二仓 `/Users/Hugh/Hugh/Project/3rd-review`（package `3rd-review` 4.0.0）；外仓 broker 已不在活路径，主仓 provider 侧自 `457299b3` 起 native-only。外仓 HEAD `97132960`。
- 并发扇出真实落点：`skills/wh-review/scripts/review-provider-client.mjs:983`（`const members = await Promise.all(providers.map(async provider => {`）、`skills/wh-review/scripts/simple-review-runner.mjs:1752`（`const roleResults = await Promise.all(["red", "blue"].map((role) => runSimpleReviewSingle(`），即全 provider 一次性扇出、无并发上限常量。
- 写入量实测：11GB / 232428 文件 / 5592 子目录 / 5493 个 manifest；`/tmp/3rd-review` 有 9 个过期 runtime 共 23M。
- 耗时原件盘点：CARD-06 耗时调查原件 `card06-duration-rootcause.md`（`:93`、`:95` 为 U-005 来源）；CARD-08 侧诊断 JSON 若干（只核对存在）。
- 失败来源与取消语义：复用外仓已有的失败分类与取消语义（Talk 第 2 轮答复）。
- 导航与流式先例：短入口/导航面向审查模型，完整 diff、合同、AC 与必要源正文保持可达且不截断（母 FR-60）。
- 迁移可行性实测：放一个 `skills/third-review/SKILL.md` 探针触发 `AssertionError: 已删模块 SKILL 以新路径复活：skills/third-review/SKILL.md`（805 个断言中 1 个失败、804 个通过），证明必须修检查豁免（D-017）；两个检查因迁移表目录在 12 个 worktree 全不存在而永久失效（D-018）。

## 调研候选交付

本轮调研只产出上述结论，未产出独立交付文件；候选交付（留 build-plan 定落点与 owner）：

- 外仓基线记录：`97132960` / v4.0.0（落 `SKILL.md` 来源行 / `skills/catalog.yaml` 条目 / `docs/architecture/move-map.json` 条目三选一或并用，见 OPEN-008）。
- 写入量与进程数的真基线原件（命令输出存任务证据，D-011、D-014）。
- 修前/修后两次量测的原件与复算路径（D-014）。
- 迁移表来源的救活方式（复制到检查要找的位置 vs 改检查从归档位置读，见 OPEN-009）。
- 外挂工具 32 个测试的独立测试入口命令（D-019）。

## grill（质询）

待 grill-with-docs 步骤回填。本阶段尚未执行质询。

## 最终确认

待 approve-decision 步骤回填。

## 拒绝方案

| 被拒方案 | 拒绝理由 | 关联决定 |
| --- | --- | --- |
| 限制单次审查并发 provider 数（原产品层第②项） | 峰值只影响审查期 CPU，不影响全局；降质换约 6 分钟峰值下降不划算；用户判定「纯粹是降质，没有任何收益」 | D-001、D-022 |
| 用 CPU% / thermal pressure / 风扇转速做资源效果验收 | 非确定性、不可复现即 inconclusive，且用户已撤销该要求 | D-004、D-023 |
| 把时间分账写进阶段交接说明，或另写独立的时间分账报告文件 | 违反 `CONSTITUTION.md:174`「报告只留原始件」 | D-013、D-021 |
| 把外挂工具放技能目录但不登记（方案 B） | 未采纳，用户选 A：正式技能目录 + 修检查 | D-017 |
| 把外挂工具改放 `runtime/third-review/`（方案 C） | 未采纳，用户选 A | D-017 |
| 只救活检查或干脆移除两个检查 | 未采纳，用户选「救活它」 | D-018 |
| 用现有旁证（11GB / 23 万文件 / 5493 个历史包）当写入量修前基线 | 未采纳，用户选先采真基线 | D-011 |
| 时间分账不落文件但也不要求现成结论（只要底层数据齐） | 未采纳，用户选「需要时现场算给你看」 | D-013 |

## 风险与延期交接

- 外挂工具搬迁可能打断主仓现有审查链：宿主配置只改一行（`third_review.command[1]`），必要时按该行回滚（D-002、D-003）。
- 两个失效检查的救活方式待定：复制归档表到检查要找的位置，或改检查从归档位置读，留 build-plan（OPEN-009）。
- 写入量基线的可复现条件待定：采样命令、采样时长、判定阈值留 build-plan（OPEN-010）。
- CARD-08 与 CARD-03 已 close，六份文件（`skills/stage-handoff/SKILL.md` 与五份 `workflows/*/SKILL.md`）现为已冻结既有内容，不再是「在途写集」：本卡只承担「不要改这六份」的约束，仍须在 build-plan 冻结本卡自身写集与段落 owner（OPEN-003）。
- FR-46 的验证对象已裁定为真实派发行为（D-031）：CARD-03 的派发方法落点已被 CARD-06 按迁移表删除，只剩 `AGENTS.md:14-19` 治理文字与真实派发行为（审查处置 F-01）。
- 本轮方向审查的 reveal 步无候选方向可揭示，challenge 步挑战空包：22 条只作材料核对，不作方向收敛依据（D-028、D-030；审查处置 F-18）。
- 母卡原始需求本身含方案（四项产品干预与验收），独立重建在信息上不干净：结构性限制，接受并登记（审查处置 F-07）。
- 母卡范围句与本卡已授权范围口径差：须随 D-007 的母 PRD 一次性修改同步补入整仓搬迁范围（D-029）。

### 质量边界

CARD-09 负责新增验收事实，CARD-10 仅沿既有存在性输入与用户抽验通路消费，不增总体套件用例（`prd.md:163`、`prd.md:510`）。可靠前后基线不足时，收益为 inconclusive，不编造改善数字（`prd.md:505`、`prd.md:510`）。

## 未决项

| item_id | 未决内容 | 原因 | 谁在何时解决 |
| --- | --- | --- | --- |
| OPEN-001 | FR-43「broker 回收孤儿 manager/provider（含先解除 broker 自写只读目录）」的落点未定：broker/manager 实现不在主仓，位于第二仓 `/Users/Hugh/Hugh/Project/3rd-review`（package `3rd-review` 4.0.0），而主仓 provider 侧已走 native transport | 本步骤只读核实主仓无 `3rd-review/` 目录；孤儿回收应落在哪个真实路径，需先确认 3rd-review 是否仍被生产调用（`prd.md:492`、`decision-log.md:897`、`decision-log.md:907`） | **已消解**：用户决定整仓迁入 `skills/third-review/`（D-002），落点不再待定 |
| OPEN-002 | 修复前「同口径资源/耗时基线」是否可复现：AC-51 要求同一工作负载（同一审查任务、相同输入规模）前后对比 CPU% 与 thermal pressure（或风扇转速），AC-59 要求 CARD-06 同类原始时间戳及一组重叠工具/provider 样本可复算 | 母材料只留 2026-09-19 的一次性实测数字（`decision-log.md:896-919`），未见可重放的固定负载或采样脚本；母材料自述「无法复现同负载时如实记 inconclusive 并写明原因,不编造改善数字」（`prd.md:505`、`prd.md:510`）。**保持 open**：写入量基线已决定先采真基线（D-011），但热指标基线已随 D-001/D-023 撤销，剩下写入量与进程数两类基线的可复现条件留 build-plan | 需 build-plan 在开工前确定采样命令、采样时长与判定阈值；不可复现时由 CARD-09 报告/测量责任人按 inconclusive 登记（`prd.md:517`） |
| OPEN-003 | CARD-09 段落级写集尚未冻结：CARD-08 侧明确要求本卡 build-plan 补段落 owner/读集/写集与串行合并责任（`prd.md:515`、`prd.md:522`、`card09-duration-amendment.md:57`）；重叠面为五份 `workflows/{make-decision,build-prd,build-plan,build-code,verify-code}/SKILL.md`，与 CARD-03 已完成写集、CARD-08 P2 在途写集三方同名 | 本步骤只读核实 CARD-08 未来实施写集含 `skills/stage-handoff/SKILL.md` 与上述五份 workflow SKILL.md（归档 `specs/archive/workflowhub-thin-core-card-08-20260919/spec.md:390`），且其 `spec.md:393` 明写「CARD-09 当前没有已冻结实施写集，不声称已可安全并行」 | **已降级（2026-10-04 复核）**：CARD-08 已按标准 close 收口并合入 main（`ca4095c7` 交付、`24b6e1e6` 合入、`a41843b0` 归档，工作树已清理），CARD-03 亦已 close。那六份文件现为**已冻结的既有内容**，不再是「在途写集」。CARD-09 的已定方案（D-002 整仓迁入 `skills/third-review/`、D-017/D-018 检查修复）与其**零重叠**，故三方段落级冲突面消失；剩余约束仅为「不要改这六份文件」，并仍须在 build-plan 冻结本卡自身写集与段落 owner | 需 build-plan 冻结本卡段落 owner/读写集与串行合并责任（本卡写集，不含那六份）；同文件禁止两个 agent 同时写（`prd.md:515`、`prd.md:692`） |
| OPEN-004 | CARD-06 仍在途（外置 facts 尾行 `stage=verify-code`，2026-10-04T05:12:35.283Z）：其删除面若再次变动，AC-45 的「材料与证据写入量」前后对比基线可能失效 | 本步骤只读核实 CARD-06 facts 尾行为 verify-code；其代码删除已合入 main 提交 `457299b3`、`e4da5664`（git log 核实）。CARD-09 与 CARD-06 共享「材料证据写入面」（`prd.md:516`） | **已消解**：实测确认 CARD-06 已按标准 close 收口（close 证据 `2026-10-04-001-close-plan.json` 与 `002..005-close-action.json`，`git-authorizations` 有 `026-authorize-archive`→`031-consumed-cleanup`，`head: e4da5664d1e59780e79b8e9deb98aa213b6d2c2d`），删除面已冻结 |
| OPEN-005 | 母 decision-log「仍待实施的优化（属产品改动）」一节正文为空：`decision-log.md:936` 为标题行 `**仍待实施的优化**（属产品改动）：`，其后至 `decision-log.md:938` 无内容 | 本步骤逐行只读核实，属材料缺口 | **保持 open**：记为材料缺口，不代编内容 |
| OPEN-006 | 母材料行号漂移：`prd.md:518` 引用「decision-log OI-011(L380-399)」与「L811-859(CPU 与温度诊断)」，`prd.md:521` 引用「L826-830(已执行缓解)」；当前 `decision-log.md` 的实际位置是 OI-011 在 `decision-log.md:397-416`、CPU 与温度诊断节在 `decision-log.md:890-937`、已执行三项缓解在 `decision-log.md:905-909` | 本步骤逐节只读比对；漂移原因未查（母材料只读，本卡不改写） | **保持 open**：实测 OI-011 在 `decision-log.md:397-416`、诊断节 `:890-937`、已执行缓解 `:905-909`；引用一律按标题定位，不按行号 |
| OPEN-007 | 增补草案自述状态与母 PRD 已内联授权不一致：`card09-duration-amendment.md:3` 写「尚非已确认产品决定」，而 `prd.md:25`、`prd.md:688-692` 已按用户授权把增补内联进 CARD-09 并记为 R-021 | 本步骤只读核实两处文本均在；授权原话见 V-001/V-002 | **已消解**：以母 PRD 为准 |
| OPEN-008 | （新）外仓搬迁后的版本可追溯性：只搬代码不搬 Git 历史，基线为 `97132960` / v4.0.0 | 搬迁后如何在仓内记录该基线（`SKILL.md` 来源行 / `skills/catalog.yaml` 条目 / `docs/architecture/move-map.json` 条目）留 build-plan | 需 build-plan 定记录落点与 owner（D-003） |
| OPEN-009 | （新）两个失效检查的迁移表来源：救活方式（把归档表复制到检查要找的位置 vs 改检查从归档位置读）留 build-plan | 归档区是只读保留区，需要用户对「是否在归档区之外新增一份表副本」做最终确认 | 需用户最终确认 + build-plan 定做法（D-018） |
| OPEN-010 | （新）写入量与进程数的真基线采集时机：已定「开工前先采一次」，具体采样命令、采样时长、判定阈值留 build-plan | 采样口径会决定基线是否可复现 | 需 build-plan 定采样命令与阈值（D-011、D-014） |
| OPEN-011 | （新）CARD-08 交付后的技能元数据漂移：`skills/reuse-registry.md:56`、`skills/catalog.yaml:88-100`、`repo-skills.manifest.json:21-34` 仍写「固定名 + 原子覆盖 + 四个 authoring stage / 不挂载 verify-code」，与已交付的 `skills/stage-handoff/SKILL.md`（create-only 不可变发布、五阶段含 verify-code）矛盾 | 2026-10-04 用户 m00799 告知 CARD-08 已完成后复核发现；CARD-08 写集与验收均未覆盖这三个元数据文件。`tests/contract/ui-skill-contract.test.mjs:188-199` 只断言条目与名字存在、**不校验描述内容**，故漂移静默不报错 | **已消解（D-026）**：三处已按交付方法改写并提交 main `9a033b81`；`skills/catalog.yaml` 的 `metrics_enabled` 一并由 `true` 对齐为 `false`（与 `repo-skills.manifest.json` 一致）。本卡不把该修正当需求承接，只登记「已修」 |

## 退役登记（retirement）

本阶段无退役事项。

- D-001/D-022 撤销的是母材料中的要求（FR-44/AC-44 与产品层第②项），不修改母材料本体，只在本卡登记。
- D-023 撤销的是母 AC-51 的热采样验收写法。
- 已退役的「全 Phase 集成审查」不在本卡重跑或恢复（非目标）。

## Supersedes（被替代记录）

本阶段无对既有记录或文件的 Supersedes 事项。

- D-001/D-022 的撤销在本文件内登记，不重写母材料、不复制成第二份方向正文；母材料保留原句只作历史记录。

## Append-only 更正（只追加）

本阶段无更正事项（append-only 语义下不追记新增更正）。

- D-001/D-022 的撤销已在「## 决定」「## 拒绝方案」登记，此处不重复记录。
- 本文件第 1–180 行的既有内容（任务身份、原始需求、需求变更记录、原始需求索引、逐字声明层、原始声明层、三级追溯链、唯一 OI 大纲）除新增 U-003/U-004/U-005 与已标注的 OI 消解外，未作改写。

## 文档结果

本文件由 make-decision 步骤 1（load-context）落笔，后续 Talk/Grill/调研/审查/确认按阶段回填。

- CONTEXT.md：本阶段不需要更新术语。理由：本轮决定全部落在既有材料与既有术语内（资源三项、效率四项、技能目录、审查并发），未引入新概念；且 D-013/D-024 明确禁止新增派生文件与报告类产物，无新增术语需要登记。
- ADR：本阶段不需要新增 ADR。理由：本阶段 31 条决定（D-001..D-031）全部是需求范围撤销/收敛、验收口径修正、审查链运输缺陷修复与母卡口径同步，已在本文件「## 决定」逐条登记；未触及需要独立 ADR 的架构选型（不新增 public command、stage、持久对象、永久遥测、调度器、progress trace 或 checkpoint permit，见 D-024）。
- ADR 判据：母 `prd.md:489` 的窄范围句已限定只窄改现有报告方法、review caller/组包/parser、host 委派方法及 owned-process 取消路径，未达 ADR 触发条件。
- 术语/ADR 冲突及处理：无冲突。本文件 `R-001..R-008` 是本卡局部 source_id，与母 `prd.md:139-163` 全局追踪表的 R-001..R-021 不是同一套编号，已在「## 原始需求」说明；本轮不新增编号体系。
- 不复制 spec 的边界：本文件只登记需求与决定，不复制 spec 正文；原始用户声明、调研原文与已确认事实只在「## 原始声明层」保留可回读引用。

### Exit checks（退出检查）

- 上下文一致：已通过。本轮所有决定都能沿「原始用户故事/初始需求 → 原始需求或调研 → ADR 决定」回读；新增 U-003/U-004/U-005 与 D-001..D-031 相互引用一致，R-002 的推翻状态已在「## 原始需求索引」与「### 唯一 OI 大纲」同步标注。
- owner/接口一致：已通过。孤儿回收 owner 随整仓迁入落到本卡技能目录（D-002）；FR-46 保留并由本卡做确定性计数验证（D-004），验证对象已裁定为真实派发行为（D-031；CARD-03 的派发方法落点已被 CARD-06 删除，只作历史来源）；母 PRD 修改 owner 为本卡 make-decision 收敛后一次性提交 main（D-007、D-029）。
- 失败语义明确：已通过。失败边界见「## 成功/失败边界」；热采样不可复现即 inconclusive，不编造改善数字；AC-51 新增失败场景「拿采样外推冒充确定性计数」；审查链失败语义见 D-027（provider 只由终止或显式取消结束，不再有固定主机期限）。
- 审查处置明确：已通过。两轮 direction 审查的原始记录、严重度分布与逐条处置见「## 审查处置」，无遗留 needs_human 项（唯一一项 F-01 已由用户 m01230 裁定为 D-031）；第一轮因材料含已定方向不计为干净盲审，第二轮因 reveal 步缺候选方向不计为方向收敛依据（D-028、D-030）。
- 范围与延期明确：已通过。范围与非目标见「## 范围」「## 非目标」；环境层四项仍在卡外；未决与延期见「## 未决项」OPEN-001..OPEN-011 与「## 风险与延期交接」。
