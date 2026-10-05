# 决策日志（decision-log）

## 任务身份

- **任务类型**：普通任务

判断依据：本卡是实施卡——母 PRD 的 CARD-09 五阶段开工说明写明「以本卡创建独立实施 task:①make-decision 读取本卡/R-021/OI-011 及最小读取集,继承已授权增补,只确认本 task 边界,不重问全局方向」（`prd.md:522`）；母 PRD 实施旅程定义为「每个实施 task 独立执行 make-decision→build-plan→build-code→verify-code,只确认本任务方向与边界,继承本 PRD,不重问或改写全局产品决定」（`prd.md:20`）。故本任务只确认本 task 方向与边界、继承已确认母 PRD，不重问全局方向，按实施类任务登记。

## 原始需求

人读摘要：本卡承接两组需求。**资源组四项**（FR-43..FR-46）来自母 decision-log 的 OI-011 实测定位「高基线 + 高峰值」，指产品层四项修复：①broker 回收孤儿 manager/provider（须先解除 broker 自写的只读目录）；②限制单次审查并发 provider 数（峰值主因、收益最大）；③减少材料与证据写入量（索引抖动根因是文件数）；④主会话只派发与回收（由 CARD-03 承接实现，本卡验证效果）（`prd.md:486-495`、`decision-log.md:405`）。**效率组四项**（FR-58..FR-61）来自 2026-10-04 用户真实授权（母 PRD 记为 R-021，`prd.md:163`、`prd.md:688-692`），指：耗时分账、失败来源定向处理与最小复验、完整材料的小导航、无进展升级与受控取消（`prd.md:496-499`）。两组都由本卡负责新增验收事实，CARD-10 只沿既有存在性输入与用户抽验权消费，不增总体套件用例（`prd.md:163`、`prd.md:510`）。

编号说明（避免与母 PRD 编号混淆）：本文件的 `R-001..R-008` 是**本卡局部** source_id，与 `prd.md:139-163` 全局追踪表的 R-001..R-021 不是同一套编号。对应关系：本卡资源四项 = 母 `R-017` 行（`prd.md:159`）；本卡效率四项 = 母 `R-021` 行（`prd.md:163`）。本文件保留母全局编号 `R-021` 原样，因母 PRD 各处均以该编号引用本轮授权。 **关联列口径**：下表的「关联 D/处理状态」列保持收件时原样（R-001..R-008 多数仍写「D 编号待 make-decision」），**处置状态与撤销以 `## 原始需求索引` 为准**——R-002（FR-44/AC-44）已在索引中标「已推翻（D-001/D-022）：撤销限并发、删除 FR-44/AC-44、AC-51 收窄只挂 FR-46」，R-004 已标「已裁定（D-031）」。

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
| R-001 | U-002、V-003、V-004；母 OI-011 | **已裁定（D-002/D-038）** | FR-43（`prd.md:492`）/ AC-43（`prd.md:501`）；落点随整仓迁入变为 `skills/third-review/lib/runtime.mjs`、`lib/attachments.mjs`（D-002）；实现已存在（`unlockForRemoval` 早于基线），本卡收窄为**补覆盖测试 + 确定性计数验证**（D-038） |
| R-002 | U-002、V-003、V-004；母 OI-011；U-003 第 1 条 | **已推翻（D-001/D-022）**：撤销「限制单次审查并发 provider 数」，删除 FR-44/AC-44；AC-51 收窄只挂 FR-46 | FR-44（`prd.md:493`）/ AC-44（`prd.md:502`）两条整条删除；AC-51（`prd.md:505`）改挂 FR-46 并改确定性计数 |
| R-003 | U-002、V-003、V-004；母 OI-011 | **已裁定（D-039）** | FR-45（`prd.md:494`）/ AC-45（`prd.md:503`）；验收口径＝只合并同一位置重复写的真冗余，保留 provider 只读隔离那份（`lib/attachments.mjs:146 lockTree` 冻结的 `work/<key>/bundle/materials/`），以修前/修后文件数与字节数对比为准 |
| R-004 | U-002、V-003、V-004；母 OI-011 | **已裁定（D-031）** | FR-46（`prd.md:495`）/ AC-46（`prd.md:504`）；验证对象改为真实派发行为（D-031） |
| R-005 | U-001、V-001、V-002；增补草案 E01 | **已裁定（D-013/D-024/D-035）** | FR-58（`prd.md:496`）/ AC-59（`prd.md:506`）；口径去「报告」化，用已有原件现场可复算（D-013、D-020）；验收证据＝验收时真算一次并当场展示计算过程与结果，不落派生报告文件（D-035）；母 PRD 口径改写随 M8 落笔（D-042） |
| R-006 | U-001、V-001、V-002；增补草案 E02 | **已裁定（D-016/D-028）** | FR-59（`prd.md:497`）/ AC-60（`prd.md:507`）；失败来源定向处理与最小复验，不改审查点数量（D-016）；本轮三阶段审查材料须一次给全，否则只算材料核对（D-028） |
| R-007 | U-001、V-001、V-002；增补草案 E03 | **已裁定（D-014/D-015/D-040）** | FR-60（`prd.md:498`）/ AC-61（`prd.md:508`）；短导航不替代真实阅读、不截断正文（D-014）；大规模日志独立上下文流式提取、主会话只收摘要与 ref（D-015）；本卡验收读会话日志只读元数据（D-040） |
| R-008 | U-001、V-001、V-002；增补草案 E04 | **已裁定（D-012/D-021/D-041）** | FR-61（`prd.md:499`）/ AC-62（`prd.md:509`）；按可独立交付工作包派发/回收、修复回原会话（D-012）；等待不高频轮询、wait timeout 不等于 reviewer 失败（D-021）；工作包划分已收敛为 7 包 → 2 个实施 Phase（资源组 / 效率组）（D-041） |
| R-021 | U-001、V-001、V-002 | **已裁定（D-005..D-008、D-041、D-042）** | 母追踪行（`prd.md:163`）、地图行（`prd.md:117`）、总览条目（`prd.md:25`）、变更说明（`prd.md:688-692`）；覆盖 FR-58..FR-61 / AC-59..AC-62，并保留 FR-43..FR-46 / AC-43..AC-46/51 |

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
| 并发 provider 实测落点（已核实，只作历史记录） | 主仓 `skills/wh-review/scripts/review-provider-client.mjs`、`skills/wh-review/scripts/simple-review-runner.mjs` | `review-provider-client.mjs:983`（`const members = await Promise.all(providers.map(async provider => {`）、`simple-review-runner.mjs:1752`（`const roleResults = await Promise.all(["red", "blue"].map((role) => runSimpleReviewSingle(`） | 本步骤只读 grep 核实行号；「全 provider 一次性扇出、无并发上限常量」的判断**待 make-decision 核实**，本文件不预先断言 |
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
| N-001 | 背景 / 问题 | closed | verified | CARD-09 make-decision 主会话；来源 owner＝母 OI-011 诊断原件（`decision-log.md:890-937`）与 CARD-06 耗时原件（归档 `attachments/card06-duration-rootcause.md`，125 行/12978 B） | make-decision 收敛时（已完成：D-038 收窄 FR-43 为补覆盖，D-039 定 FR-45 口径） | OI-011 诊断与 CARD-06 耗时原件核对完成时（`decision-log.md:890-937`、`prd.md:690`） |
| N-002 | 目标 / 论断 | closed | verified | CARD-09 make-decision 主会话；效率四项目标来源 owner＝用户 2026-10-04 授权原件（母 R-021，`prd.md:163`、`prd.md:688-692`）；资源目标已由 D-001/D-022 收敛 | make-decision 收敛时（已完成：D-031 裁定 FR-46 验证对象，D-042 定母 PRD 改动时机） | Talk 收敛与资源/耗时目标量化后（`prd.md:488`、`prd.md:496`） |
| N-003 | 方案 / 证据 / 裁决 | closed | verified | CARD-09 make-decision 主会话 + 后续 build-plan（待指派） | 已满足：工作包划分由 D-041 落定为 7 包 → 2 个实施 Phase，母 PRD 改动时机由 D-042 定为 build-plan 先做（`prd.md:517`、`prd.md:520`） |
| N-004 | 验收 / 扩展 | closed | verified | CARD-09 报告/测量责任人（`prd.md:517`） | 已满足：验收口径由 D-039（FR-45 只合并真冗余）、D-040（FR-46 只读会话日志元数据）、D-043（FR-43 收窄为补覆盖）、D-035（AC-59 现场复算）逐条落定并写入 `acceptance-draft.md`；同负载可复现性仍由 OPEN-002/OPEN-010 在 build-plan 定采样命令（`prd.md:517`） |

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
| complete_user_flow |  | false | 无界面用户流程（`ui_applicability=non_ui`），但**运行流程确有可处置内容**，不以非界面为由置空（F-24 已回填）：FR-58..FR-61 对应五段运行流程——①基线测量（同口径耗时分账，AC-59）；②短导航与完整材料可达（AC-61）；③按包派发与停滞升级（AC-60、AC-62）；④受控取消与既有 owner 回收（AC-62）；⑤现场复算并当场展示（AC-59，D-035）。流程中的「失败来源定向处理与最小复验」（AC-60）与「`wait timeout` 不等于 reviewer 失败」（AC-62）为显式分支。消费者＝用户、build-code/verify-code 主会话、实际 reviewer 与工作子代理（`prd.md:488`）；落点写集留 build-plan |
| page_scope |  | true | 同上，`non_ui`，无页面范围；本卡明确不新增页面/仪表盘/前端组件（母 PRD 非目标 `prd.md:21`）。**有源的具体置空，非占位**：母 `prd.md:22` 另有三源 UI 适用性判断（原始需求、当前项目、计划中的实际前端范围），本卡三项均不含前端范围，故按 `non_ui` 置空并登记理由，不用 caller 标签降级 |
| data_state |  | false | **不新增** public command、stage、持久对象、永久遥测、调度器、progress trace 或 checkpoint permit（`prd.md:489`、`card09-duration-amendment.md:22`、`:32`、`:52`），但**既有状态确有转换需登记**，不以「无新增」为由置空（F-24 已回填）：①材料/证据写入——写包（`review-materials.mjs:651-653`）→ 复制进 provider 工作区 → `lib/attachments.mjs:146 lockTree` 冻结为只读树（`0o500`/`0o400`）→ 主包 `dispose()` 删除，只读副本留存；②runtime 目录——创建 → 过期 → 孤儿检测（`lib/runtime.mjs:149`）→ 回收（`:153 reapRuntimeIfOwnerDead`）→ 只读目录先解除（`:119 unlockForRemoval`）再删（`:130 removeDirectory`）；③派发状态——派发 → 停滞/有进展 → 升级或受控取消（SIGTERM→SIGKILL，`:60-69`）→ 既有 owner 回收并保留已返回发现。三者均为既有状态的转换，不是新增持久对象 |
| success_failure_boundary | OI-011 | false | OI-011 的 `category` 原文即 `success_failure_boundary`（`decision-log.md:401`）；本卡失败边界为「无前后对比数据却宣称热改善」「inconclusive 被写成改善」「并发时长相加」「wait timeout 当 reviewer 失败」「取消后自建后代残留」（`prd.md:505`、`prd.md:506`、`prd.md:509`）。**已消解**：其中「限制并发 provider 数」一项已被用户撤销（U-003 第 1 条、D-001/D-022）；其余三项保留，且度量一律改确定性计数（D-004/D-023） |
| non_goals |  | true | 非目标已在母材料写明：不新增 public command/stage/持久对象/永久遥测/调度器/progress trace/checkpoint permit，不改 CARD-08 接续职责、既有审查点与 CARD-10 套件主体（`prd.md:489`）；环境层四项排除出卡（`prd.md:489`、`prd.md:159`）。尚未形成独立 OI 记录，待后续步骤按需登记 |
| deferred |  | false | 可后置技术项集中在 `prd.md:520`（并发 provider 具体上限、时间/成本假设、采样方案、来源重试细节、私有准备实现、工作包划分及段落写集），母材料明确「留本卡 build-plan 按现有消费者与实测定，不预猜固定时间预算或新增控制面」。**已回填**：本文件 `## 风险与延期交接` 已列五条真实风险，owner 与触发条件见该节；`prd.md:520` 的「工作包划分及段落写集」已由 D-041 收敛（7 包 → 2 个实施 Phase（资源组 / 效率组）），段落写集留 build-plan |

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

## 问题（本卡要解决的具体问题）

背景＝母 OI-011 的资源诊断（母 `decision-log.md:397-416` 原问、`:890-937` 诊断节、`:905-909` 已执行缓解）＋CARD-06 两会话超过 48 小时的耗时根因调查（归档 `specs/archive/workflowhub-thin-core-card-08-20260919/attachments/card06-duration-rootcause.md`，125 行/12978 B，与 `:70` 同一原件）；问题来源 ref＝用户 m00699（要求查清超时根因并恢复被破坏的审查链）。

| 问题 | 具体表现（实测或原件） | 本卡处置 |
| --- | --- | --- |
| ① 资源高基线 | 母 OI-011 诊断记录的常驻资源占用与 11GB / 23 万文件 / 5493 个历史包的旁证 | 只保留孤儿 manager/provider 回收与写入量下降（D-005；热指标不做验收 D-023） |
| ② 审查期资源峰值 | 母 OI-011 把审查期 CPU 峰值列为并发 provider 主因 | 母要求的「限制并发」已被用户撤销（D-001、D-022）——峰值只影响审查期，降质换峰值下降不划算 |
| ③ 交付耗时长且不可解释 | CARD-06 根因调查：两会话超过 48 小时，缺同口径耗时分账 | 效率四项（FR-58..61）＋开工前对齐（D-008），耗时分账验收时真算一次并当场展示（D-035） |
| ④ 审查链的孤儿与重复写入 | 只读目录冻结后 cleanup 删不掉、过期 runtime 残留；同一 provider 输出重复落盘 | 孤儿回收（实现已在、缺覆盖，D-038/D-043）与真冗余合并（D-039、D-046） |
| ⑤ 主会话与子代理的派发占比无据 | 母要求「主会话只派发与回收」但承接方 CARD-03 落点已被 CARD-06 删除 | 改为记录真实派发行为的事件计数，原论断不设验收阈值（D-031、D-047） |
| ⑥ 交付时长的口径本身不可复算 | 时间分账没有既有原件可复算，且不得落派生报告文件 | 只读既有原件现场复算，不落报告（D-013、D-024、D-040） |

## 目标

一句话目标：让「开发一个改进任务的时间花在哪、为什么反复返工」变得可现场复算、可验证；顺手收掉审查链里的孤儿进程与重复读写。

- 可现场复算：耗时结论只用已有命令/审查/会话原件，需要时从原件现场复算并当场展示，不落派生报告文件（D-013、D-024）。
- 可验证：效率四项（含「开工前对齐」）各有可核对的原件与复算路径，耗时分账验收时真算一次并当场展示（D-004、D-008、D-035）；资源三项各有确定性计数证据，其中「主会话只派发与回收」验证的是真实派发行为（D-031）。
- 顺手收掉：孤儿 manager/provider 回收（含先解除只读目录）与同一 provider 输出重复落盘的合并（D-006、D-010）。
- 边界：本卡不以限制审查并发 provider 数为目标，也不以 CPU%/温度/风扇读数为验收目标（D-001、D-023）。

## 方案（实施面）

本卡的实施方案＝**7 个工作包 → 2 个实施 Phase（资源组 / 效率组）**，逐包落点、依赖与验收对照如下（工作包划分依据 D-041，母 PRD 同步项依据 D-042）。落点路径为实测确认的当前仓内位置。

| 包 | 内容 | 落点 | 依赖 | 验收 |
| --- | --- | --- | --- | --- |
| M1 整仓迁入 | 外仓 `3rd-review`（v4.0.0，基线 `97132960d7dab9145cbd0bdf610e09bf422e2ec0`）搬进主仓，含代码、测试、`docs/**`、`SKILL.md`、`package.json`、`LICENSE`；不搬外仓 `specs/`、`references/`；必建 `skill-bundle.json`；版本来源记在 `SKILL.md` 来源行 | `skills/third-review/**`（**新建**） | 无 | AC-T2（D-002、D-032、D-036、D-045） |
| M2 宿主配置改指 | 主仓引用外仓路径处改指新位置 | `skills/wh-review/scripts/third-review-host-config.mjs`、`runtime/review/ocr-delegation-adapter.mjs`、`runtime/review/review-packet-identity.mjs` | M1（串行） | AC-T2（D-002；改动面与回滚见「## 风险与延期交接」） |
| M3 救活两个检查 | 两个本来就红的检查改为从归档位置读迁移表；补 D-017 的技能豁免 | `tests/contract/thin-core-residue.test.mjs`、`tests/contract/card06-migration-ledger.test.mjs` | 无（完全独立） | AC-T2、M3 检查项（D-033、D-017） |
| M4 32 测试改造 | 外仓 32 个 `node:test` 测试改写为主仓 Vitest 写法并挂进全量回归，同时保留一条专用命令 | `skills/third-review/test/**`、`vitest.config.mjs`、`package.json` | M1（串行） | AC-T3（D-034、D-037） |
| M5 孤儿回收补覆盖 | 实现已存在（只读目录解除、孤儿 manager/provider 回收、SIGTERM→SIGKILL 升级），缺覆盖测试 | `skills/third-review/lib/runtime.mjs`、`lib/attachments.mjs`、`lib/broker.mjs` ＋ 新测试 | M1（串行） | AC-43（D-038、D-043） |
| M6 写入量下降 | 只合并真冗余：审查入口支持材料按仓库内路径引用，请求文件不再内嵌整份材料；保留 provider 只读隔离那份 | `skills/wh-review/scripts/review-materials.mjs`、`runtime/review/review-record-route.mjs`、审查请求入口 | 无 | AC-45（D-039、D-046） |
| M7 效率四项 | 同口径耗时分账、失败来源定向处理与最小复验、完整材料的小导航、无进展升级与受控取消 | 既有报告方法与 review caller 窄改 | 无 | AC-59..AC-62（D-004、D-008、D-016、D-020、D-035、D-040、D-047）＋**AC-46 真实派发行为、AC-51 收窄后只挂 FR-46**（母 `prd.md:522` 要求 verify-code 同时执行原资源 AC-43..46/51 与新增 AC-59..62） |
| M8 母 PRD 同步 | 六组改动一次性落笔并提交 main | `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md` | make-decision 收敛 | AC-T4（D-007、D-029、D-042） |

- **资源组 Phase**＝M1+M2+M3+M4+M5+M6；**效率组 Phase**＝M7。M8 是母材料同步项、不占 Phase，按 D-042 在 build-plan 阶段先落笔并提交 main。
- 段落级写集与串行合并点（含与 CARD-08 的段落 owner 关系）留 build-plan 按实测冻结；本卡不得与 CARD-08 已交付的 `skills/stage-handoff/SKILL.md` 与五份 `workflows/*/SKILL.md` 交接句争夺写权（只对齐、不改写）。
- 未采纳的替代方向与其可证伪条件见「## 发散候选与可证伪大纲」；逐条决定原文与理由见「## 决定」。

## 验收面（make-decision 决策稿的验收标准）

> 本节由 detail 轨第三、四轮的实际审阅对象演化而来（第三轮送审 14136 B、第四轮送审 22689 B），已按两轮 56 条发现的处置结果全部改写；作为决策稿的验收面，与母 `prd.md` 的 AC-43..46/51、AC-59..62 逐条对应。

### 验收面总述

本草案把母 PRD 的 AC-43..46 / AC-51 / AC-59..62 与本卡 Talk 新增的五项效率要求落成「能跑出通过/失败」的形式：每条给出条件、行为、度量、判定阈值、失败场景与复验命令。它是 decision-log 的验收面，不是 spec.md；spec.md 由 build-plan 产出。

本版已按 `quality/reviews/2026-10-04-035-make-decision-detail.json` 的 29 条发现逐条处置（详见 decision-log.md「审查处置 / detail-advice 第三轮」）。

母 PRD 已确认的口径修正（本草案按修正后口径写，不按母 PRD 原文字面）：①FR-44 与 AC-44 整条删除（D-001/D-022，用户撤销限并发）；②AC-51 收窄为只挂 FR-46，度量改确定性计数，不再采 CPU%/thermal pressure/风扇转速（D-001/D-004/D-023）；③FR-46 的验证对象改为「真实派发行为」，不再验已被 CARD-06 删除的 CARD-03 派发方法落点（D-031）；④FR-45 只合并真冗余，保留 provider 只读隔离那份（D-039）；⑤FR-46 验收读会话日志只读元数据（D-040）；⑥FR-58 去「报告」化，改为用已有原件现场可复算（D-013/D-020/D-035）；⑦FR-43 收窄为「补覆盖测试 + 确定性计数验证」（D-038 经 D-043 确认）。

**两条通用口径（先立规矩，再逐条引用）**

- **口径 A（度量来源不得混装）**：会话日志元数据只能证明「调用次数、派发次数、各阶段时长、人工等待时长」这类事件计数（D-040 的授权边界）；**进程数、文件数、写入字节量必须另有原件**——进程表（`ps` 等系统命令输出）与文件系统统计命令的输出，按 D-004 的确定性计数口径保存为证据原件。任何一条验收都不得把这两类指标说成「都从会话日志复算」。
- **口径 B（采样范围必须标注）**：任何「修前/修后」对比数字都必须写明采样范围——轮次 + 目录 + 时间窗。同一落点的数字若口径不同（目录累计 vs 单轮审查），必须分别标注，不得当作同一事实陈述。

---

#### AC-43（FR-43 孤儿回收）

- **条件**：构造孤儿 manager/provider 进程 + 过期 runtime 目录；该目录内含 broker 自写的只读子树（目录 `0o500`、文件 `0o400`，由 `lib/attachments.mjs:146 lockTree` 产生）。
- **行为**：调用真实回收路径 `cleanup(root, ttl_hours)`（`lib/broker.mjs:756`）与 `discardManagedAttachments`（`lib/attachments.mjs:188`）。
- **度量（确定性计数，可复算）**：①回收后 `work/` 下该 key 的 runtime 目录 `fs.existsSync` 为 false；②`unlockForRemoval`（`lib/runtime.mjs:119`）被调用且未抛错；③回收返回的被清理 runtime 标识列表与构造数量一致；④**进程残留独立断言**——回收后按 pid 列表核对，不再存在该 runtime 对应的 broker/manager/provider 进程；⑤**附件路径独立断言**——单独构造只读附件目录，验证 `discardManagedAttachments` → `unlockTree` 这条删除路径各自成功（不与 runtime 路径合并成一条断言）。
- **判定阈值**：五项全为真 → pass；任一项为假 → fail。
- **失败场景**：`cleanup` 删不掉只读目录（如 `EACCES`/`ENOTEMPTY`）；孤儿进程残留；返回列表数量与构造数量不符；只验 runtime 路径而附件路径蒙混过关。
- **复验命令**：`npx vitest run skills/third-review/test/<回收针对性测试>.test.mjs`（M5 新增测试路径），以及一条确定性计数命令（口径 A 的进程表原件）。
- **事实前提（实测）**：回收实现**已存在**——只读目录解除见 `lib/runtime.mjs:119 unlockForRemoval`（先递归 chmod 0o700/0o600 再删）、`lib/runtime.mjs:130 removeDirectory`（`unlockForRemoval(target); fs.rmSync(target,{recursive:true,force:true})`）、`lib/attachments.mjs:188 discardManagedAttachments`（`unlockTree(directory); fs.rmSync(...)`）；`unlockForRemoval` 早于基线存在（`cc2ef1f17d17c1cec55034fdb8650fc28566a88c`，2026-07-23）。**孤儿 manager/provider 回收也已存在**：`lib/runtime.mjs:149` `const orphaned = Object.values(state.providers ?? {}).some((item) => item.status === "running" || item.cleanup_status === "cleanup_pending");`、`:153` `if (orphaned && ownerConfirmedDead(state.owner) && /^[0-9a-f-]{36}$/i.test(entry.name)) reapRuntimeIfOwnerDead(root, entry.name);`，SIGTERM→SIGKILL 升级在 `:60-69`（`if (!terminateProcessTree(pid, "SIGTERM")) return false;` … `escalation.phase = "sigkill"; terminateProcessTree(pid, "SIGKILL");`），broker 侧取消见 `lib/broker.mjs:954` `if (terminateProcessTree(pid, "SIGTERM")) cancelled.push({ runtime_id, provider });` 与 `:1220`。实测构造只读 `work/k/bundle`（`0o500`）后调用 `cleanup(root, 24)`，返回 `["11111111-2222-3333-4444-555555555555"]`，runtime 目录与只读树全部删除。**外仓 32 个测试中无一条测过只读树回收，也无一条测过孤儿进程回收**，故本条的缺口是覆盖测试，不是回收逻辑（D-038 经 D-043 确认）。

#### AC-44

**整条删除**（D-001/D-022）。不产出本条的任何验收事实。

#### AC-45（FR-45 写入量下降）

- **条件**：同一审查任务，修前/修后各跑一次；统计 **四处**的文件数与字节数——①`quality/evidence/execution-inputs/`；②`quality/tests/`；③`quality/reviews/`（含 `*.output`）；④provider 只读工作区 `work/<key>/bundle/materials/`。**另记 `.wh-review-packets/` 的每轮 `dispose()` 行为**：它每轮删除，**不属同一位置重复写**，按 D-039/D-046 不计入可合并冗余。**采样范围必须写明（口径 B）**：轮次 + 目录 + 时间窗。
- **行为**：按 D-039 只合并「同一份内容在同一位置被重复写」的真冗余；**保留** provider 只读隔离那份复制（安全机制，不计入可合并冗余）。
- **度量**：**四处**的「文件数、总字节数」修前/修后各一组数字，逐项对比，各自标注采样范围（轮次 + 目录 + 时间窗）。
- **判定阈值**：至少一处**已证明内容重复**的写入被消除，且文件数或字节数有可测下降；只读隔离副本字节数不变 → pass。写入量不降、无测量、或未证明重复就当冗余删 → fail。**无可合并真冗余时记 `inconclusive`（不记 fail、不写成改善）**：D-046 已把真冗余落点收窄为「请求文件内嵌整份材料与已落盘交付件重复」一处，若该落点被判定不可改（例如审查入口必须内嵌材料），按本条记 `inconclusive` 并如实写明原因。
- **失败场景**：写入量不降；无测量数据；为降写入量破坏只读隔离（视为 fail，不得以降低写入量破坏 D-006/D-010 的只读隔离）；把未证明重复的写入当冗余删除。
- **已实测的写入落点与 D-039 归类（事实前提）**：
  - **保留（不是冗余）**：`.wh-review-packets/review-*/` 是 provider 只读副本的**来源**——`skills/wh-review/scripts/review-materials.mjs:651-653` 写入（`const bundleRoot=mkdtempSync(join(packetParent,"review-"))`），随后复制进 provider 的 `work/<key>/bundle/materials/` 并经 `lib/attachments.mjs:146 lockTree` 冻结为只读树（实测 `bundle` 为 `dr-x------`、材料 `-r--------`）。这是**跨目录复制**（不同位置），按 D-039 **保留**，不算可合并冗余。实测单轮 bundle 内 3 个材料各 1 份：`01-raw_requirement.md` 15167 B、`02-objective_facts.md` 10529 B（对原件 10518 B 差 11 B 因 `redactProviderHostPaths` 脱敏）、`03-convergence_outline.md` 15070 B。**采样范围：单轮审查 + 该轮 provider bundle 目录。**
  - **真冗余候选（唯一已定位、需先证明内容重复）**：`skills/wh-review/scripts/simple-review-runner.mjs:1451` 对多步 provider 结果逐条调用 `onProviderOutput`，而 `:1453 item.raw_output_ref = refs[0] ?? null` 只保留第一个引用——多步路径下会产生**无引用的孤儿写入**。须先证明该多步输出与已有文件内容重复，才可当冗余删除；**未证明重复前不得删**。
  - **参考口径（不是修前基线）**：`runtime/review/review-record-route.mjs:70` 的 `onProviderOutput` 每次调用写一个新文件，实为单次调用：

```js
appendRecord(dir, `${tuple.stage}-${tuple.review_scope ?? "document"}-provider-${++rawCount}`, "output", output)
```

。实测 `quality/reviews/` 目录**累计**共 24 个 `.output`、573340 B；而**单轮**审查（`2026-10-04-021..026`）为每 provider 各 1 个 `.output`、6 个、3246–4314 B。**两处数字口径不同（目录累计 vs 单轮），修前基线固定为「单轮审查 + `quality/reviews/` + 该轮时间窗」的文件数与字节数。**

#### AC-46（FR-46 真实派发行为）

- **条件**：本卡与后续阶段实际发生的派发事实。原件分两类（口径 A）：**会话日志元数据**与**进程/文件系统确定性计数**。
- **行为**：按 D-031 记录**真实派发行为**，不再验 CARD-03 的派发方法落点。
- **度量（逐项标明原件）**：
  - ①主会话工具调用总数 —— 原件：会话日志元数据。
  - ②`subagent` 派发次数 —— 原件：会话日志元数据。
  - ③`ask_user_question` 次数与人工等待累计时长 —— 原件：会话日志元数据。
  - ④**主会话自行执行次数**（不派发、直接自己做的次数）—— 原件：会话日志元数据（按 `tool/call` 的 `name` 分类计数）。
  - ⑤进程数 —— 原件：进程表系统命令输出（如 `ps`），按 D-004 确定性计数口径存为证据原件。
  - ⑥文件数与材料/证据写入字节量 —— 原件：文件系统统计命令输出，按 D-004 口径存为证据原件。
- **判定阈值**：六项均有原件可复算、且每项附实测数字 → pass；任一项缺原件或只有估计值 → fail。**不得把⑤⑥说成从会话日志复算。**
- **失败场景**：任一结论缺实测数据支撑；用采样外推冒充确定性计数；把非热源说成热源；把⑤⑥归到会话日志。
- **原件路径与复算方式（已实测）**：会话日志在 `/Users/Hugh/.dsh/sessions/--Users-Hugh-Hugh-Project-workflowhub--/<会话>/session.v4.jsonl.zstd`，`zstd -dc` 解压后为 JSONL，每行含 `type`（`tool/call`/`tool/result`/`step/start`/`step/end`/`assistant/message`/`agent/inbox/spliced`）、`seq`、`time`（epoch ms）、`data`（`tool/call` 的 `data` 含 `turn`/`step`/`callId`/`name`/`arguments`）。CARD-09 主会话（`session-1d132d33-02a2-4656-870e-27b9dd3812c3`）实测：工具调用 462 次、`subagent` 派发 14 次、`ask_user_question` 20 次、人工等待累计 1.13 h（占总时长 2.1%）；分项 `bash` 329、`read` 29、`compress` 27、`ask_user_question` 20、`edit` 16、`subagent` 14。

#### AC-51（收窄后只挂 FR-46）

- **条件**：同一工作负载（同一审查任务、相同输入规模）修前/修后各一次。
- **行为**：对比量化指标——主会话工具调用数、`subagent` 派发次数、主会话自行执行次数、人工等待时长、进程数、材料与证据写入文件数与字节数。
- **共享采集口径（回应 F-04）**：AC-51 与 AC-46 **共享同一次修前/修后确定性计数采集**，不各采一遍；AC-46 用它证明「有原件可复算」，AC-51 用它做前后对比。
- **度量**：修前/修后各一组确定性计数，逐项对比，各自标注采样范围（口径 B）。
- **判定阈值**：指标可测下降或持平且理由说明 → pass；无法复现同负载时如实记 `inconclusive` 并写明原因 → 记为 inconclusive（不算 fail，但不得写成改善）。
- **失败场景**：无前后对比数据却宣称改善；`inconclusive` 被写成改善；拿采样外推冒充确定性计数。
- **不采**：CPU% / thermal pressure / 风扇转速（D-001/D-023 撤销）。

#### AC-59（FR-58 耗时分账）

- **条件**：**于既有阶段人读对账时点执行**（回应 F-05；D-020 只去掉「报告」作为交付物的含义，不取消对账时点）+ CARD-06 同类原始时间戳 + 一组重叠的工具/provider 样本。**分类清单（含 D-015 新增的独立类别）**：总跨度、工作/工具与子代理区间、provider 活动、**平台/安全策略中断**、明确人工等待、暂停、未归因时间。**平台/安全策略中断必须单列，不得并入人工等待或未归因时间**（D-015、U-005）。
- **行为**：现场复算一次，并把计算过程与结果当场展示（D-035）；重叠区间**取并集**，分类不重复计时；前后比较固定除被评估改动外的任务范围、输入、路由、provider/依赖版本及硬件，分别记录修前修后提交、配置和目标改动差异。
- **度量**：分类合计 ≤ 观察总跨度；等待单列；未知明确标 `unknown`；条件不匹配记 `inconclusive`。
- **判定阈值（含比较要求，回应 F-13/F-26）**：①分类合计不超过总跨度；②等待与平台中断各自单列；③未知明确；④**实际完成两次条件可比的分账、并记录固定变量与目标改动差异**；⑤**每个区间恰好归属一次**（按固定归属顺序核对，不得重复计入两类、也不得静默漏项） → pass。只做一次分账、用累计时长代替区间计算、或存在未归属/重复归属区间 → fail。
- **归属顺序（回应 F-26，固定且可核对）**：平台/安全策略中断 → 明确人工等待 → provider 活动 → 工具/子代理区间 → 未归因时间。同一区间命中多类时按此顺序归第一类，并在展示时写明命中依据。
- **失败场景**：并发时长相加；chat 时长全算 verify；选材/文件/token 估值或完成灯代替耗时；缺数据宣称改善；把平台中断混进人工等待。
- **可复算原件（已实测，含起止时刻）**：`quality/reviews/2026-10-04-027-make-decision-direction.json` 的 `provider_results[].timing` **含 `started_at_ms` 与 `completed_at_ms`**，不只是 `duration_ms`：kimi/coding red `1791115328895`→`1791115606762`（277867 ms）、antigravity/flash red 149093 ms、codex/luna red 454985 ms、kimi/coding blue 160940 ms、antigravity/flash blue 147662 ms、codex/luna blue 555203 ms。**六者并发，区间并集须按 `started_at_ms`/`completed_at_ms` 计算，累计值 29.10 min 不可直接相加进总跨度。** 若某类别的起止时刻原件缺失，该类记 `unknown`，不报改善。
- **另一类原件（工具/子代理与人工等待，回应 F-10）**：会话日志元数据路径 `<DSH>/sessions/--Users-Hugh-Hugh-Project-workflowhub--/<会话>/session.v4.jsonl.zstd`，用 `zstd -dc` 解压后为 JSONL；**解析字段**＝每行的 `type`（`tool/call`、`tool/result`、`step/start`、`step/end`、`assistant/message`、`agent/inbox/spliced`）、`seq`、`time`（epoch ms），`tool/call` 的 `data` 含 `turn`/`step`/`callId`/`name`/`arguments`。按 `name` 与 `time` 统计工具/子代理区间与人工等待区间；**只读元数据，不读对话正文**（D-040）。
- **不落派生报告文件**（D-013/D-024 不变）。

#### AC-60（FR-59 失败来源定向处理与最小复验）

- **条件**：四个真实场景样本——A 启动失败、B 超时、C 已返回语义发现、**D 原失败被删除/写为空 findings**（回应 F-06）。
- **行为**：修 A 的配置只派 A；C 的原件/发现不变；B 不因 A 修复而无依据重派；修一个 finding 只复验明确受影响的 file/case，共享接口真实变化时凭影响证据验证该集合。
- **度量**：来源请求与受影响复验范围可核对（每次派发记明「为什么派这个来源」，每次复验记明「为什么只验这些 file/case」）。
- **判定阈值**：三个场景的来源请求与复验范围均可核对 → pass。
- **失败场景**：未变化来源反复耗尽同预算；成功语义结果重发；全量重复测试；原失败被删除/写为空 findings；旧结果反绑新材料。
- **复验命令（回应 F-20/F-25，**调度分支与代码复验分支各一条独立命令**）**：
  - 调度分支 A（启动失败）：`npx vitest run tests/review/<定向来源重派>.test.mjs`（样本＝启动失败来源 + 另一健康来源，断言只重派失败来源）；
  - 调度分支 B（超时）：`npx vitest run tests/review/<超时最小复验>.test.mjs`（样本＝超时来源，断言**调度层**只为失败来源重派，不改动已返回结果）；
  - 调度分支 C（已返回语义发现 / 空 findings）：`npx vitest run tests/review/<已返回结果不复用>.test.mjs`（样本＝已返回语义发现的来源 + **空 findings 反例**，断言原件与发现未被重写、也未把空 findings 当成功）；
  - **代码复验分支 D**：`npx vitest run tests/review/<受影响 file-case 集合>.test.mjs`（样本＝修一个 finding 后的代码改动，断言复验范围**等于受影响 file/case 集合**，共享接口真实变化时才凭影响证据扩大）。
  具体文件名与样本构造在 build-plan 落定，但**命令形态与反例样本必须在本卡内闭环**，不得推迟到本卡之外。
- **不新增或恢复审查点**（D-016）。

#### AC-61（FR-60 短导航与完整材料可达）

- **条件**：路径/后缀缺失、来源配置冲突、错误 lifecycle、解析不匹配，以及一个完整大 diff 样本。**准备检查时序样本已移除**（回应 F-08）：该时序要求源自已被判 `rejected_invalid` 的 F-14，不作为本卡验收条件；相关准备检查的时序与断言后置到 build-plan 按现有 producer 实测定。
- **行为**：由**现有** producer 暴露可控错误；提供短入口与风险/真实消费者导航；完整 diff、合同、AC 和必要源正文保持可达且不截断；大规模会话日志在独立上下文流式提取，主会话只收必要摘要与原件 ref。
- **度量**：同一审查范围修前/修后记录——入口 bytes、需读索引量、实际阅读范围、真实完成时间；保留相同风险/AC/消费者覆盖。
- **判定阈值**：入口 bytes 或需读索引量有可测下降，且完整原字节仍可达、AC 与消费者覆盖不变 → pass。不能复现则不报改善。
- **失败场景**：索引指不存在字节；索引与实际复制字节不一致；入口无差别膨胀；正文截断/漏 AC；以 `selected_files` 冒充全部阅读；以命令存在冒充真实能力。
- **复验命令（回应 F-25）**：`npx vitest run tests/review/<短导航与完整材料可达>.test.mjs`，样本覆盖四类可控错误，并断言完整原字节仍可达。
- **不新建**准备命令、认证包装或 parser 平台（改引母 FR-60 / 本卡 R-007 与母 `prd.md:489`、D-024；原引 D-014/D-015 与本题无关，已更正）。

#### AC-62（FR-61 按包派发、停滞升级与受控取消）

- **条件**：已停滞请求与仍有进展请求，含延迟返回及**用户暂停与用户取消两条路径**（暂停与取消各自可观察，回应 F-06）。
- **行为**：按可独立交付工作包派发（**7 个工作包 → 2 个实施 Phase：资源组 / 效率组**，D-041）；无新事实时停止同一自动重发并说清选项；有进展的工作继续等待（`wait timeout` 不等于 reviewer 失败）；取消沿既有 owner 回收，确认自建后代与临时包回收并保留已返回发现。
- **度量**：同一工作包修前/修后比较——细粒度协调次数、重复读取、材料量、交付耗时；延迟事实/取消/自建后代与临时包清理分别可观察；结果与失败边界独立检查。
- **判定阈值**：四类度量各有前后数字，且取消后自建后代与临时包清理可观察 → pass。**另须逐包核对五项字段**（回应 F-25）：①工作包输入；②写集；③owner；④完成证据；⑤成本假设。停滞分支的「说清选项」必须**带成本**（说明继续等待与改派各要花什么），且**降低未变化轮询**（无新事实时不得按原频率重复询问）。五项字段缺任一项即 fail。
- **失败场景**：无新事实自动整轮续跑；过度消息链；`wait timeout` 当失败；误杀健康请求；跳质量检查；假完成；取消后自建后代残留；已返回发现丢失。
- **复验命令（回应 F-25）**：`npx vitest run tests/review/<按包派发与受控取消>.test.mjs`，样本＝已停滞来源 + 仍有进展来源 + 延迟返回 + 用户取消，断言不自动续跑、不误杀、取消后清理可观察。

---

#### 本卡 Talk 新增要求的验收（回应 F-10 / F-17）

母 PRD 的 AC 编号未覆盖本卡 Talk 新增、已写进决策稿「范围」与「成功/失败边界」的要求，故单独列一条可执行验收。

#### AC-T1（阶段开工前对齐，D-008/D-012）

- **条件**：每个阶段（含本卡 build-plan / build-code / verify-code）开工前。
- **行为**：把阶段计划里声明的**文件消费者、owner、要跑的命令**与**真实代码**逐项核对；对不上即停下问人，不带着错假设开工。
- **度量**：核对记录（计划声明 vs 真实代码的对照，含对不上的处置）。
- **判定阈值**：三个阶段各有核对记录，且对不上的项均已停下问人或已改正 → pass。
- **失败场景**：无核对记录；声明与真实代码不符仍照计划开工。
- **落点**：`specs/workflowhub-thin-core-card-09-20260919/decision-log.md` 的 `## 风险与延期交接` 与 build-plan 的阶段说明。

#### AC-T2（3rd-review 迁入与宿主配置切换，D-002/D-032/D-036）

- **条件**：M1 迁入完成、M2 宿主配置改指完成。
- **行为**：核对迁入文件范围与排除项；核对版本来源记录；核对宿主配置解析结果。
- **度量**：①`skills/third-review/` 下存在 `SKILL.md`、`lib/**`、`scripts/**`、`test/**`、`docs/**`（**8 项**：`2026-07-22-antigravity-pi-runtime-support-design.md`、`2026-07-23-workflowhub-managed-session-design.md`、`adr/`、`archive/`、`cursor-adapter.md`、`exceptions.md`、`workflowhub-result-v2.md`、`workflowhub-result-v3.md`）、`config.example.json`、`package.json`、`LICENSE`；②**不存在** `specs/rewrite-universal-review`、`specs/zhi66`、`references/ac1-inconclusive-token.log`；③`skills/third-review/SKILL.md` 的来源行记有 `v4.0.0` 与基线 `97132960d7dab9145cbd0bdf610e09bf422e2ec0`；④宿主配置解析指向新位置且能解析成功（无 `wh_review.profiles`/`priority` 旧键迁移报错）；⑤**必建** `skills/third-review/skill-bundle.json`（D-045；`tools/cli/run-checks.mjs:107` 逐技能校验），且其内容与实际迁入文件一致。
- **判定阈值**：五项全为真 → pass。
- **失败场景**：排除项被搬入；版本来源缺失；宿主配置仍指旧外仓路径。

#### AC-T3（32 个转换后测试挂全量回归，D-034/D-037）

- **条件**：M4 完成（外仓 32 个 `node:test` 测试已改写为主仓 Vitest 写法）。
- **行为**：改写后的测试能被主仓既有测试体系扫到并跑通；不新增既有回归的红。
- **度量**：①`skills/third-review/test/**` 下 32 个测试全部由 `node:test` + `node:assert/strict` 改写为 Vitest 写法；②`pnpm test:skills` 与 `npx vitest run` **两条命令均能扫到并跑通**同一批测试；③保留一条专用命令便于单独跑（D-037）；④既有回归**不新增失败**（以改动前基线为参照，逐条列出新增红项，无新增红才为真）。
- **判定阈值**：①②③④ 全为真 → pass。专用命令能跑但全量回归扫不到、或既有回归新增红 → fail。
- **失败场景**：只保留专用命令而未挂全量回归（D-019 旧口径，已被 D-037 取代）；改写后测试被 `vitest.config.mjs` 的 `exclude` 排除而静默不跑；既有回归新增红未如实登记。
- **复验命令**：`pnpm test:skills`；`npx vitest run`；专用命令（build-plan 落定具体形态，D-037 要求保留）。

#### AC-T4（母 PRD 六组改动与 `provider-protocol.md` 去固定截止，D-007/D-029/D-042/D-044）

- **条件**：M8（母 PRD 同步）与 D-044（`provider-protocol.md` 去 `600000` 固定截止）均已完成。
- **行为**：核对母 PRD 六组改动已落笔并提交 main；核对 `provider-protocol.md` 已无 `600000` 固定截止，且替代的收场边界已写明。
- **度量**：①母 `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md` 的六组改动（A–F，含 D-029 范围句同步）已落笔并提交 main；②`skills/wh-review/contracts/provider-protocol.md` 中**已无 `600000` 固定截止**（实测基线含 `600000`，D-044 裁定删除）；③替代收场边界已写明：**显式取消**（不靠固定截止兜底）与 **ownerloss guardian** 两条路径各有文字与落点；④改后契约与 D-027 保留清单一致（`LATE_SUPPLEMENT_WINDOW_MS=600000`、`DEFAULT_MANAGED_STATUS_POLL_MS=5000`、`REVIEW_BROKER_TIMEOUT_FROM_ENV`、`DEFAULT_EXECUTOR_CANCELLATION_GRACE_MS=30_000`、supervisor `Date.now()+5000` 均**未**被误删）。
- **判定阈值**：①②③④ 全为真 → pass。只删固定截止而未定义替代收场边界（存在永久挂起风险，回应 F-22）→ fail。
- **失败场景**：母 PRD 六组改动未落笔或未提交 main；`600000` 仍留在 `provider-protocol.md`；删了固定截止但无替代收场边界；误删 D-027 保留清单中的项。
- **复验命令**：`grep -n "600000" skills/wh-review/contracts/provider-protocol.md`（应无匹配）；`git log --oneline -1 -- specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md`（应指向 M8 提交）。

#### 检查项修正的验收（M3，非母 PRD 的 AC）

- **条件**：`tests/contract/thin-core-residue.test.mjs` 与 `tests/contract/card06-migration-ledger.test.mjs`。
- **行为**：把写死的 `TABLE_REL` 改为从归档位置读取；沿用既有忽略表（两文件的忽略表已含 `[/^specs\/archive\//, 'specs/archive 只读保留旧任务过程文件']`）；**并按 D-017 处理 `thin-core-residue.test.mjs` 对新增未登记技能的豁免**，使迁入 `skills/third-review` 后不触发已删模块复活断言。
- **度量**：两文件在 `npx vitest run` 下从 FAIL 变为 PASS；迁入 `skills/third-review` 后仍 PASS；且仍能真实检出残留（不是靠放宽检查变绿）。
- **失败场景**：靠删检查或放宽忽略表变绿；表格读不到仍报绿；迁入新技能目录后误报已删模块复活。
- **事实前提（实测）**：两文件 `:13`/`:14` 均为 `const TABLE_REL = 'specs/workflowhub-thin-core-card-06-20260919/attachments/migration-table.md';`（CARD-06 归档前位置），`findRepoRoot` 上溯失败，实跑报 `Error: 无法从 …/tests/contract 上溯找到含 specs/workflowhub-thin-core-card-06-20260919/attachments/migration-table.md 的仓库根`。表格实际在 `specs/archive/workflowhub-thin-core-card-06-20260919/attachments/migration-table.md`（368176 B）。两文件 import vitest，**不能**用 `node --test` 直接跑（会报 `Error: Vitest failed to access its internal state.`）。

#### 验收命令草案

- `npx vitest run tests/contract/thin-core-residue.test.mjs tests/contract/card06-migration-ledger.test.mjs`（M3）
- `pnpm test:skills`（M4 后应扫到 `skills/third-review/test/**` 的转换后测试）
- `npx vitest run`（全量回归，M4 后应扫到同一批测试）
- 一条专用命令便于单独跑 3rd-review 的测试（D-037 要求保留）
- 回收针对性测试（M5）：`npx vitest run skills/third-review/test/<回收测试>.test.mjs`
- 写入量前后统计（M6）：文件数与字节数统计命令，修前/修后各一次，各自标注采样范围
- 耗时分账现场复算（M7/AC-59）：从 `quality/reviews/*.json` 的 `provider_results[].timing` 的 `started_at_ms`/`completed_at_ms` 复算区间并集并展示
- 派发行为计数（M7/AC-46）：会话日志元数据（调用数、派发数、人工等待）+ 进程表与文件系统统计命令（进程数、文件数、字节量）
- 效率三项反例样本（M7/AC-60/61/62）：三条 `npx vitest run tests/review/<…>.test.mjs`
- 开工前对齐与迁入核对（AC-T1/AC-T2）：对照记录 + 迁入范围与版本来源核对命令

## 成功/失败边界

**成功**

- 效率四项（耗时分账、失败来源定向处理与最小复验、完整材料的小导航、无进展升级与受控取消）加「阶段开工前对齐」，各有可核对的原件与复算路径（D-008、D-012）；耗时分账的验收证据为**验收时真算一次并当场展示计算过程与结果**（D-035）。
- 资源三项（孤儿 manager/provider 回收含先解除只读目录、材料与证据写入量下降、主会话只派发与回收的真实派发行为）各有确定性计数证据：进程数 / 文件数 / 写入字节量（D-004、D-031）。
- 外挂工具在仓内可运行，且自带 32 个测试改写后可在主仓测试体系内跑通（D-002、D-034、D-037）。
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
- 外挂工具整仓迁入 `skills/third-review/`：搬 `SKILL.md`、`lib/**`、`scripts/**`、`test/**`、`docs/**`（含 `adr/` 与 `archive/`）、`config.example.json`、`package.json`、`LICENSE`；**不搬** `specs/rewrite-universal-review`、`specs/zhi66` 与 `references/ac1-inconclusive-token.log`（D-036）。新建 `skill-bundle.json`，改宿主配置 `third_review.command[1]` 一行，版本来源与基线 `97132960` / v4.0.0 记在 `skills/third-review/SKILL.md` 来源行（D-002、D-003、D-032）。
- 主仓检查维护：修 `tests/contract/thin-core-residue.test.mjs` 的新增文件豁免；救活 `thin-core-residue` 与 `card06-migration-ledger` 两个检查（改检查从归档位置 `specs/archive/workflowhub-thin-core-card-06-20260919/attachments/migration-table.md` 读取，不新增副本，D-017、D-018、D-033）；外仓 32 个测试搬入、改写为主仓 Vitest 写法并挂进全量回归，同时保留一条专用命令（D-019、D-034、D-037）。
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
| D-001 | 撤销「限制单次审查并发 provider 数」这项产品层要求，本卡不再限并发。连带：删除 FR-44 与 AC-44 两条整条；AC-51 收窄为只挂 FR-46，度量改为确定性计数（进程数/文件数/写入字节量），失败场景增加「拿采样外推冒充确定性计数」；FR-46 保留但验收改为确定性指标，不再采 CPU%/thermal pressure/风扇转速 | 用户原话：「原始需求是限制并发吗？并发再高，也就是审查的时候 cpu 高点，根本不影响全局。你把原始需求完全搞错了！我根本不像限制审查的 provider 数量并发！纯粹是降质，没有任何收益！」（「我根本不像」为口语笔误，意为「我根本不想」）。事实依据：母 `prd.md:493` 确实写有该要求；母 `decision-log.md:405` 登记的产品层第②项原句为「限制单次审查并发 provider 数（峰值主因，收益最大）」；母 `decision-log.md:899` 诊断原句「一次审查 2 角色 × 3 provider = 6 个 agent CLI 并发（kimi / agy / codex），每个自身还会起子进程；另加每角色 1 个 broker/manager 与 2 个 stage-runtime 进程」。该要求的目的是压掉审查期约 6 分钟的 CPU 峰值以降温，从不是提速。用户判断：降质换 6 分钟峰值下降不划算 来源 ref：该答复对应本会话消息 m01057（范围撤销），逐字原文另见本文件「### U-003」节。 | 限并发（母产品层第②项） | 已确认 |
| D-002 | 把外部仓库 `/Users/Hugh/Hugh/Project/3rd-review` 整仓迁入 workflowhub，作为仓内技能存在。落点 `skills/third-review/` | 用户原话：「可以把 3rd-review 整仓迁移到 workflowhub 内部 skill 文件夹内，作为 workflowhub 的内部技能存在，这样就没有外仓问题了」。不能叫 `3rd-review`：主仓 `runtime/distribution/skill-bundle-release.mjs:330` 的 `^[a-z][a-z0-9-]*$` 与 `:28` 的 `promptSkillReferences` 两条正则硬拒数字开头的名字 | 继续留在外仓 | 已确认 |
| D-003 | 搬家只搬代码，不搬 Git 历史；记录外仓基线；原仓保留归档 | 用户选择「只搬代码，记录基线 commit，原仓保留归档」。外仓基线（实测）：`HEAD 97132960d7dab9145cbd0bdf610e09bf422e2ec0`，branch `main`，origin `https://github.com/Hugh4424/3rd-review.git`，version `4.0.0`，工作树干净，`git ls-files` 110 项 | 搬 Git 历史 | 已确认 |
| D-004 | 保持「主会话只派发与回收」这条要求，但验收改为确定性指标（进程数/文件数/写入字节量），不再采 CPU%/thermal pressure/风扇转速 | 与 D-001 的度量口径一致；热采样非确定性 | 热采样验收（D-023） | 已确认 |
| D-005 | 本卡重心：以效率四项为主，资源只保留「孤儿回收」与「写入量下降」 | 用户原话：「以效率四项为主，资源只留 FR-43 回收 + FR-45 写入量」 | 资源四项全保留 | 已确认 |
| D-006 | 顺手治重复读写（合并同一 provider 输出被写两份的重复落盘） | 用户选择「效率为主，顺手治重复读写」 | 只做效率、不碰重复落盘 | 已确认 |
| D-007 | 母需求文档等 make-decision 收敛后一次性修改并提交 main | 用户选择「等 make-decision 收敛后一次性改并提交」。说明：母 `prd.md:690` 已有用户原话「增补需求草案请直接更新到prd里的card-09任务，prd的更新请直接提交到main，因为我会在当前任务进行中同步开始card-09任务。」→ 改母 PRD 不需再次取得授权 | 边谈边改、逐条提交 | 已确认 |
| D-008 | 效率范围＝现有四项再加一条「开工前对齐」 | 用户选择「四件 + 开工前对齐」。新条内容：阶段开工前，把计划里声明的「谁消费这个文件、要跑什么命令」与真实代码核对一遍，对不上就停下来问人 | 只做原四项 | 已确认 |
| D-009 | 搬家与本卡效率改进放在同一个任务里，搬家作为第一个阶段 | 用户选择「同任务，搬家作为第一个阶段（推荐）」 来源＝本会话 Talk 第 2 轮结构化问答的答复；**该轮答复未留消息 ref**，属引用缺口，已如实登记（可回读落点＝「## 动态 Talk 批次」第 2 轮与 D-009 行本身）。 | 拆成两个任务 | 已确认 |
| D-010 | 资源侧两件事都保留 | 用户选择「两件都保留（推荐）」 | 只保留一件 | 已确认 |
| D-011 | 写入量「修前基线」先真实采一次 | 用户选择「先采一次真基线（推荐）」 | 用现有旁证当基线 | 已确认 |
| D-012 | 「开工前对齐」只管阶段开工前（不含每次派活前，也不限于只改本任务） | 用户选择「只管阶段开工前（推荐）」 | 每次派活前都对齐 / 只对齐本任务改动 | 已确认 |
| D-013 | 时间分账不落任何文件；需要时从已有原件现场复算并当场展示 | 用户原话：「我不需要这份报告！这种报告属于违反workflowhub核心宪法的垃圾文件！请仔细检查」。用户选择「不落文件，需要时现场算给你看（推荐）」。宪法依据（原文）：`CONSTITUTION.md:174`「报告只留原始件，不保存整棵目录/工作树快照或镜像。」；S4「自研技能按实际评估需要采集必要指标，复用统一事实底座；指标缺失如实未知，不为计量单独建设控制系统。」；F10「自动化按真实收益添加，不为"机器可校验"本身堆基建」 | ①写进阶段交接说明（用户判定为违反宪法的垃圾文件）②另写一份独立的「时间分账报告」文件（同罪） | 已确认 |
| D-014 | 量测基线（修前/修后各一次）的原始命令输出存成任务证据，跟其它命令原件同等待遇 | 用户选择「存成命令证据（推荐）」 | 只在对话里报数、不留原件 | 已确认 |
| D-015 | 时间分账的分类里，为「平台/安全策略中断」单独开一类 | 用户选择「单独开一类（推荐）」。事实依据：CARD-06 耗时调查原件 `card06-duration-rootcause.md:93` 逐字「最后因宿主 `This content was flagged for possible cybersecurity risk` 终止」；`:95` 逐字「V 明确 5h28m 人工停顿是外发审批未被平台接受后的等待」 | 并入「明确人工等待」/ 落进「未归因时间」 | 已确认 |
| D-016 | 审查包的「短入口/导航」主要给审查模型读（不是给人看的抽查入口） | 用户选择「主要给审查模型（推荐）」 | 给人看的抽查入口 | 已确认 |
| D-017 | 外挂工具搬进正式技能目录，并修改主仓的安全检查（加一条「新增技能文件不算复活」的修正） | 用户选择「A：正式技能目录 + 修检查（推荐）」。事实依据（实测）：主仓 `tests/contract/thin-core-residue.test.mjs` 按文件名比对，任何 `SKILL.md` 都归为模块名 `SKILL`，与迁移表 `MT-3-143 workflows/build-spec/SKILL.md` 的 DELETE 行碰撞；实测放一个 `skills/third-review/SKILL.md` 探针即报 `AssertionError: 已删模块 SKILL 以新路径复活：skills/third-review/SKILL.md`（该测试 805 个断言中 1 个失败，其余 804 个通过）；根因是该检查没有为「真正新增且未登记的文件」留任何豁免 | 方案 B：放技能目录但不登记；方案 C：改放 `runtime/third-review/` | 已确认 |
| D-018 | 救活两个已失效的检查（`tests/contract/thin-core-residue.test.mjs` 与 `tests/contract/card06-migration-ledger.test.mjs`） | 用户选择「救活它（推荐）」。事实依据（实测）：两个检查都从 `tests/contract` 上溯找 `specs/workflowhub-thin-core-card-06-20260919/attachments/migration-table.md`，找不到就在 import 期抛 `无法从 … 上溯找到含 … 的仓库根`；该目录在 12 个 worktree 中全部不存在，只剩 `specs/archive/workflowhub-thin-core-card-06-20260919/` 归档副本；主仓无 CI（无 `.github`/`.gitlab-ci.yml`/`.circleci`） | 只救一个 / 移除两个检查 | 已确认 |
| D-019 | 外挂工具自带的 32 个测试搬进主仓，单独接一条命令跑，不挂进全量回归（**隔离口径已被 D-037 取代**；「搬进主仓」与「改写成主仓写法见 D-034」仍然有效） | 用户选择「搬进来，单独接一条命令跑（推荐）」。事实依据：外仓 32 个 `*.test.mjs` 全部用 `node:test` + `node:assert/strict`，0 个 vitest；主仓 `vitest.config.mjs` 的 `include` 含 `skills/**/*.test.mjs`，直接搬会让 `pnpm test:skills` 变红 | 不搬测试 / 挂进全量回归 | 已确认 |
| D-020 | 需求口径修正：母 `prd.md:496` FR-58 原文以「在既有阶段人读报告一次性区分…」表述时间分账，与 D-013 冲突，须改为「用已有原件现场可复算」口径（去掉「报告」作为交付物的含义） | 用户选择：D-013 | 保留「报告」口径 | 已确认（具体改写文字留待母 PRD 一次性修改时落笔） |
| D-021 | 拒绝「在交接说明里加一节时间分账」与「另写独立时间分账报告文件」两个方案 | 违反 `CONSTITUTION.md:174` | 两个方案本身 | 已拒绝 |
| D-022 | 拒绝「限制审查并发 provider 数」原要求，并连带删除其验收条目 | 见 D-001（同一授权来源；缺口同 D-001/D-009：该轮答复未留消息 ref，已在 D-001 行登记缺口原因。） | 限并发要求本身 | 已拒绝 |
| D-023 | 拒绝「用 CPU%/thermal pressure/风扇转速实测对比」作为资源效果的验收方式（改确定性计数） | 非确定性、不可复现即 inconclusive；用户已撤销该要求 | 热采样验收本身 | 已拒绝 |
| D-024 | 本卡不新增 public command、stage、持久对象、永久遥测、调度器、progress trace 或 checkpoint permit（沿用母 `prd.md:489` 范围句）；也不新增任何「时间分账报告」类派生文件（本决定由 D-013 强化） | 母 `prd.md:489` 范围句 + D-013 | 新增控制面 / 新增派生报告 | 已确认 |
| D-025 | 沟通硬约束：本阶段与后续所有面向用户的沟通，不再说黑话、术语和内部 ID | 用户原话：「我选1，另外不要再说黑话、术语和内部ID了，我完全看不懂，你根本没在说人话」 | 继续用内部缩写/编号向用户解释 | 已确认 |
| D-026 | 修掉 CARD-08 交付后遗留的三处技能元数据漂移（`skills/reuse-registry.md:56`、`skills/catalog.yaml:88-100`、`repo-skills.manifest.json:21-34`）：按已交付的交接方法改写，改为「由当前 stage owner 用现有 safe-write 的 appendRecord 一次 create-only 发布并回读实际不可变路径、五阶段（含 verify-code）使用」，并把 catalog 的 `metrics_enabled` 与清单的 `false` 对齐 | 用户原话（m00843）：「B」；随后对本卡两个选项逐字答复：「现在提交（推荐）」与「一起修（推荐）」——授权把三处过时描述改正并提交 main。事实依据：CARD-08 交付把交接从「固定名 + 原子覆盖 + 四阶段」改成「create-only 不可变发布 + 五阶段」，但三处元数据仍描述旧设计；CARD-08 写集只覆盖那六份文件，其验收也未覆盖这三个元数据文件。`skills/catalog.yaml` 在 CARD-08 的 DO NOT TOUCH 列表**之外**（列表见 `specs/archive/workflowhub-thin-core-card-08-20260919/spec.md:391`），`skills/reuse-registry.md` 与 `repo-skills.manifest.json` 同样不在其写集内 | 只修 `skills/reuse-registry.md` 一处 / 只登记不修（留 build-plan） | 已实施：提交 `9a033b81 docs: align stage-handoff registry metadata with CARD-08 delivery`（main，3 文件 11+/10-）；授权原件 `quality/evidence/human-confirmations/2026-10-04-001-make-decision-reuse-registry-drift-fix.json` 与 `quality/evidence/git-authorizations/2026-10-04-001-authorize-commit.json`。验证：JSON 解析通过；YAML 解析该条目通过；`node --test tests/contract/ui-skill-contract.test.mjs` 5/5 通过；`tests/contract/thin-core-residue.test.mjs` 与 `tests/host-independence.test.mjs` 的失败经 `git stash` 对照确认在改动前即为红（`host-independence.test.mjs:50` 既有 `TypeError: The "path" argument must be of type string. Received undefined`），非本次改动引入 |

| D-027 | 修复审查链两处运输缺陷并删除固定时间上限：①native 文档审查路径对「没有已验证 packet 文件系统边界」的 provider 启动前即拒；②`skills/wh-review/scripts/review-provider-client.mjs` 的固定 600000 ms 主机期限（非配置项）。改为：packet boundary 预检只在真的会走本机 native 兜底时生效，其余情况走托管路径；全部 deadline 机制删除，provider 只由终止或显式取消结束 | 用户原话要点（m00699）：「彻底删除时间上限」「用 third-review 会话健康判断决定是否继续等待」「查清『文档审查启动前被拒』是谁改坏的并改回来」。事实依据（实测）：首轮方向审查得 `status=unavailable`、`dispatch_state=blocked_before_dispatch`、0 findings，顶层 `error.code=REVIEW_EXECUTION_TIMEOUT`（`provider exceeded the fixed 600000 ms host deadline`）；kimi 与 antigravity 报 `PROVIDER_PACKET_BOUNDARY_UNAVAILABLE`（「Kimi broker Read has no verified packet filesystem boundary」「Selected native provider has no verified packet filesystem boundary」），二者在本地启动前即被拒（`skills/wh-review/scripts/simple-review-runner.mjs:1257-1260`、`skills/wh-review/scripts/review-provider-client.mjs:988`）；codex 侧两角色各跑满 600024/600084 ms 后被砍断，3 个 thread 已读完 packet 并在写 `independent_reconstruction` 时中断 | 保留可配置超时 / 只把 600s 调大 | 已实施并**已提交**：提交 `cf51f5d3 fix(review): remove fixed host deadline and restore managed document review`（父提交 `e78c0e41`，main 之外的本卡分支，5 文件 56+/90−）——原状态列误写「未提交」，经 detail 第四轮 F-04 指出后更正，见「## Append-only 更正」：`runtime/review/ocr-delegation-adapter.mjs`（删 `REVIEW_PROVIDER_HOST_DEADLINE_MS`、`OCR_PROVIDER_DEADLINE_MS` 及 `runOcrProviderProcess`/`runPacketBoundCodexReview` 的全部 deadline 机制）、`skills/wh-review/scripts/review-provider-client.mjs`（删 `#runNativeGroup` 的 `documentBudget`/组级超时/abort 监听，native 提前返回改由新显式参数 `nativePacketFallback === true`（默认 false）门控，`startManaged` 与 `runGroup` 各加该参数）、`skills/wh-review/scripts/simple-review-runner.mjs`（packet boundary 预检改为只在 `dependencies.nativePacketFallback === true` 且客户端非注入且不支持 packet boundary 且 provider 未被 block 时才生效，并把该参数透传两处）、`tools/cli/stage-runtime.mjs`（`detection.status==="not_installed"` 的 OCR 回落分支显式传 `nativePacketFallback: true`）、`tests/contract/ocr-ac006-011-experiments.test.mjs`（该用例补该参数）。验证：`npx vitest run tests/contract/ocr-delegation-adapter.test.mjs` 与 `simple-review-runner.test.mjs` 与改动前基线逐条同名同数（新增红 0、修好绿 0；前者 3 failed/43 passed 为 macOS realpath 伪红，非符号链接 TMPDIR 下 46/46 全绿；后者 38 failed 为既有红）。真跑验证：重跑方向审查得 `2026-10-04-027`，6 provider 全 `completed`，耗时 9 分 17 秒，记录内 `deadline_ms` 全为 `null`，无超时。**保留项**（非等待上限，不动）：`review-provider-client.mjs:265` `LATE_SUPPLEMENT_WINDOW_MS=600000`（晚到补充窗口，契约 `workflowhub-result.v3.json:150` 明令不动）、`simple-review-runner.mjs:32` `DEFAULT_MANAGED_STATUS_POLL_MS=5000`（轮询间隔，可被 `dependencies.managedStatusPollMs` 覆盖）、`review-provider-client.mjs:17-22` `REVIEW_BROKER_TIMEOUT_FROM_ENV`（读 `WH_REVIEW_BROKER_TIMEOUT_MS`，未设置即为无时限）、`ocr-delegation-adapter.mjs:12` `DEFAULT_EXECUTOR_CANCELLATION_GRACE_MS=30_000`（取消后确认进程终止的宽限）。3rd-review 侧未改（`runtime.orphan_timeout_ms=30000`、`runtime.ttl_hours=24` 保持） |
| D-028 | make-decision 方向审查的协议口径：direction 轨道是**一次请求内**的 `reconstruct → reveal → challenge` 三阶段，三阶段材料必须在同一请求内全部提供；只给问题大纲会让 reveal 与 challenge 空转，该轮不构成对候选方向的独立挑战 | 事实依据（实测）：`skills/wh-review/scripts/review-provider-client.mjs:995` 在 `reviewFlow` 非 null 时走 `["reconstruct","reveal","challenge"]`；`:1008-1011` 的 reconstruct 步只可见 `raw_requirement` 与 `objective_facts`，reveal 与 challenge 步才见全量材料；`:1019-1021` 的三步指令原文要求 reveal 步「Read the submitted selection/alternatives/rationale/assumptions」。本轮只送 3 个必需件、未送 `current_selection`/`alternatives`/`selection_rationale`/`key_assumptions`，故 `2026-10-04-027` 的 challenge 步挑战的是空包（`blue | codex/luna` 第 18 条命中）。契约原文见 `skills/wh-review/contracts/make-decision.md`：「reconstruct 阶段不交付 OI 答案、方案结论、确认回复、decision log、detail 结果、spec、plan、代码或测试。答案与选择只能在 reveal 后可见。」 | 把 `current_selection` 等可选件当成可省项 | 已确认：用户 m01178 选择「不再重跑，就地处置这 22 条」，故本轮缺口如实登记（见审查处置 F-18）；**后续任何一轮方向审查必须同时提供候选方向、替代方案、取舍理由与关键假设，否则该轮只作材料核对，不得作为方向收敛依据** |
| D-029 | 母卡范围句与本卡已授权范围存在口径差，须在母 PRD 一次性修改时同步：①范围句「只窄改现有报告方法、review caller/组包/parser、host 委派方法及 owned-process 取消路径」须补入 D-002 授权的「3rd-review 整仓迁入 `skills/third-review/`」及其连带项（修主仓安全检查、救活两个失效检查、32 测试独立入口、宿主配置一行）；②FR-43 的落点随整仓迁入由外仓变为仓内技能目录 | 事实依据：母 `prd.md:489` 范围句原文如左，未含整仓搬迁；而 D-002/D-017/D-018/D-019 已由用户逐条确认该范围。本轮 5 个独立审查方（red/blue × kimi/antigravity/codex 中的 5 条）一致判「Q4/Q5/Q15 超出已授权范围」，命中的正是这处口径差。FR-43 原文「broker 回收孤儿 manager/provider」的 broker 实现位于第二仓，主仓 provider 侧自 `457299b3` 起 native-only，但 broker 仍在 `/tmp/3rd-review` 建 runtime 并派生泄漏 manager | 不改母范围句、让审查方持续误判 / 把搬迁降级为卡外工作 | 已确认：随 D-007 的母 PRD 一次性修改落笔（用户 m00799 已授权合并 main 改动；母 PRD 修改时机为 make-decision 收敛后） |
| D-030 | 方向审查的本轮结论：不把 `2026-10-04-027` 的 22 条当作方向收敛依据，只把其中可核对的事实项并入本日志；方向收敛仍以本卡 Talk 各轮的真实用户答复与 D-001..D-026 为准 | 用户 m01178 选择「不再重跑，就地处置这 22 条」；本轮 reveal 步缺候选方向（D-028），且母卡原始需求本身含方案（审查处置 F-07），独立重建在信息上不干净 | 把 22 条当作独立方向建议直接改方向 | 已确认 |

| D-031 | FR-46 保留，验证对象由「CARD-03 承接实现的派发方法」改为**真实派发行为**：本卡与后续阶段实际发生的派发事实（审查会话真实发起的子代理次数、主会话自行执行次数、进程数与文件数、材料与证据写入字节量），按确定性计数验证 | 用户 m01230 在「FR-46 验证对象」三选中逐字答复「改成验『真实的派发行为』」。事实依据（实测）：CARD-03 的派发方法落点已被 CARD-06 按迁移表删除——`specs/archive/workflowhub-thin-core-card-06-20260919/attachments/migration-table.md:745` `MT-6-368 | tests/contract/card03-dispatch-method.test.mjs | AGENTS.md 文本 | DELETE | B7/P8`、`:812` `MT-6-441 … runtime/stage/stage-runner.mjs（MT-1-070）DELETE B4/P5`；现仓 `git ls-files` 无 `runtime/stage/stage-runner.mjs`、`runtime/stage/stage-handlers.mjs`、`tests/contract/card03-dispatch-method.test.mjs`；仍在的只有 `AGENTS.md:14-19` 派发治理文字与 `tools/cli/stage-runtime.mjs`。故「实现 owner=CARD-03」只作历史来源记录 | 从卡里拿掉该条（资源侧缩为两项）/ 推到 build-plan 再定 | 已确认：`fixed`（审查处置 F-01）；FR-46 与 AC-46 保留，度量沿用 D-004 的确定性计数 |

| D-032 | 外挂工具的版本来源记录写在技能自己的说明文件里（`skills/third-review/SKILL.md` 的来源行），记 v4.0.0 与基线提交 `97132960d7dab9145cbd0bdf610e09bf422e2ec0` | 用户 m01240 在「外仓版本记录落点」四选中逐字答复「A 写在技能自己的说明文件里（推荐）」。事实依据（实测）：外仓 `git ls-files` 110 项、`package.json` 为 `3rd-review` v4.0.0、HEAD `97132960`、工作树干净；只搬代码不搬 Git 历史（D-003） | 写在 `skills/catalog.yaml` 条目 / 写在 `docs/architecture/move-map.json` 条目 / 三处都写 | 已确认；连带关闭 OPEN-008（原留 build-plan，现落点已定） |
| D-033 | 两个失效检查（`tests/contract/thin-core-residue.test.mjs`、`tests/contract/card06-migration-ledger.test.mjs`）的救活方式：**改检查，让它从归档位置 `specs/archive/workflowhub-thin-core-card-06-20260919/attachments/migration-table.md` 读取**，不在归档区之外新增对照表副本 | 用户 m01240 在「失效检查怎么救」二选中逐字答复「A 改检查，从归档位置读（推荐）」。事实依据（实测）：两个检查都从 `tests/contract` 上溯找 `specs/workflowhub-thin-core-card-06-20260919/attachments/migration-table.md`，找不到即在 import 期抛 `无法从 … 上溯找到含 … 的仓库根`；该目录在 12 个 worktree 中全部不存在，只剩归档副本；主仓无 CI。宪法 `CONSTITUTION.md:174` 要求只留原始件 | 复制一份对照表到检查要找的位置 | 已确认；连带关闭 OPEN-009（原留 build-plan 与用户最终确认，现做法已定） |
| D-034 | 外挂工具自带的 32 个测试搬入后**改写为主仓的 Vitest 写法**（现在 32 个文件全部是 `import { test } from "node:test"` + `import assert from "node:assert/strict"`），并按 D-019「单独接一条命令跑、不挂全量回归」执行：放进 `vitest.config.mjs` 的 `exclude`（与既有 `tests/contract/ui-skill-contract.test.mjs` 同款先例），另加一条专用脚本命令 | 用户 m01240 在「32 个测试写法」二选中逐字答复「B 顺手改成主仓的测试写法」。事实依据（实测）：外仓 32 个 `test/*.test.mjs` 全部用 `node:test`（32/32）与 `node:assert/strict`（32/32），0 个用 vitest，合计 5966 行；外仓 `package.json` 的 `scripts.test` 为 `node --test test/*.test.mjs`。主仓 `vitest.config.mjs` 的 `include` 含 `skills/**/*.test.mjs`，若不排除则直接进入 `pnpm test:skills` | 原样搬只加运行命令（省事但两种写法并存） | 已确认：本决定**取代 D-019 中「原样搬入」的隐含做法**，D-019 的「单独一条命令、不挂全量回归」仍然有效；改动量约 5966 行、32 文件 |
| D-035 | 时间账「现场复算」的验收证据：**验收时真算一次并把计算过程与结果当场展示**，作为该条的验收证据；仍不落派生报告文件（D-013、D-024 不变） | 用户 m01240 在「时间账验收证据」二选中逐字答复「A 验收时真算一次，当场展示过程和结果（推荐）」。事实依据：母 `prd.md:496` FR-58 原以「在既有阶段人读报告一次性区分…」表述，与 D-013 冲突，须改为「用已有原件现场可复算」口径（D-020） | 只要求底层原始记录齐全、验收时不真算 | 已确认；给 AC-59 提供可执行验收步骤 |

| D-036 | 3rd-review 整仓搬迁的**非代码范围**：搬 `lib/`、`scripts/`、`test/`、`docs/`（7 项：`workflowhub-result-v2.md`、`workflowhub-result-v3.md`、`2026-07-23-workflowhub-managed-session-design.md`、`2026-07-22-antigravity-pi-runtime-support-design.md`、`cursor-adapter.md`、`exceptions.md`、`adr/` 与 `archive/` 两个目录）、`SKILL.md`、`config.example.json`、`package.json`、`LICENSE`；**不搬** `specs/rewrite-universal-review`、`specs/zhi66`（外仓自身旧开发规格）与 `references/ac1-inconclusive-token.log` | 用户 m01290 在「文档搬不搬」三选中逐字答复「A 搬代码 + 测试 + docs（推荐）」。事实依据（实测）：外仓 `git ls-files` 110 项；`docs/` 7 项、`specs/` 2 个目录、`references/` 1 个日志文件；`node_modules` 为空、无第三方运行时依赖（`package.json` 无 `dependencies`，`engines.node >=20`） | 只搬代码和测试 / 整仓 110 文件全搬 | 已确认：外仓保留归档（D-003），搬入后版本来源记在 `skills/third-review/SKILL.md` 来源行（D-032） |
| D-037 | 32 个转换后的测试**挂进全量回归**（`pnpm test:skills` 与 `npx vitest run` 均可扫到），同时保留一条专用命令便于单独跑；原 D-019「不挂全量回归」与 D-034 中同一口径的做法**被本决定取代** | 用户 m01290 在「测试怎么隔离」二选中逐字答复「B 干脆就挂进全量回归」。事实依据（主会话实测）：①这些测试不写仓库内文件（无 `writeFile*` 指向仓库路径）；②临时目录 49 处为 `mkdtempSync(path.join(os.tmpdir(), …))` 随机路径，仅 1 处固定前缀 `/tmp/opencode-canonical-cwd-`；③主仓 `vitest.config.mjs` 的 `pool: "forks"` + `maxForks: 2` 本身限制并发，干扰风险有限。主会话已如实披露原风险（真启 broker 子进程、往 `/tmp` 建运行目录） | 加进 `exclude` + 另开一条命令（D-019 原做法） | 已确认：**取代 D-019 的隔离口径**；D-034 的「改写成主仓 Vitest 写法」仍然有效（挂进全量回归的前提就是写法统一） |

| D-038 | FR-43 的「先解除 broker 自写只读目录」**在当前代码里已经实现**，本卡的工作因此从「实现」收窄为「覆盖测试 + 确定性计数验证」：只读树由 `lib/attachments.mjs:146 lockTree`（目录 `0o500`、文件 `0o400`）创建；解除由 `lib/runtime.mjs:119 unlockForRemoval`（先递归 chmod 再 `rmSync`）与 `lib/attachments.mjs` 的 `unlockTree` 完成，两条删除路径（`lib/runtime.mjs:130 removeDirectory`、`lib/attachments.mjs:188 discardManagedAttachments`）都已接上解除动作 | 主会话实测：①外仓 32 个测试中**没有任何一条**测过只读树的回收（`grep -rln "0o500\|lockTree" test/` 命中的 5 个文件均为别名）；②构造只读 `work/k/bundle`（`0o500`）后调用真实 `cleanup(root, 24)`，返回 `["1111…"]`、runtime 目录与 bundle 全部删除；③构造只读树后调用复刻的 `unlockForRemoval` 亦删除成功；④`/tmp/3rd-review` 现有 4 个 runtime 全部 `work=drwx------`，未过期（`expires_at_ms` 均在 2026-10-05），此前 9 个过期目录是被 `lib/broker.mjs:756/794` 的 `cleanup(root, ttl_hours)` 清掉的 | 把 FR-43 当作「新增解除只读目录的实现」（母 PRD 字面口径） | **已确认（D-043）**：本条的验收证据＝只读树回收的确定性计数 + 新增测试，而非新增实现。补充实测（本轮补测，回应细节审查 F-01/F-08/F-19）：FR-43 的两半在代码里都已实现——①只读目录解除见上文；②**孤儿 manager/provider 回收**见 `lib/runtime.mjs:149` `const orphaned = Object.values(state.providers ?? {}).some((item) => item.status === "running" || item.cleanup_status === "cleanup_pending");` 与 `:153` `if (orphaned && ownerConfirmedDead(state.owner) && /^[0-9a-f-]{36}$/i.test(entry.name)) reapRuntimeIfOwnerDead(root, entry.name);`，其 SIGTERM→SIGKILL 升级在 `lib/runtime.mjs:60-69`（`if (!terminateProcessTree(pid, "SIGTERM")) return false;` … `escalation.phase = "sigkill"; terminateProcessTree(pid, "SIGKILL");`）；broker 侧取消见 `lib/broker.mjs:954` `if (terminateProcessTree(pid, "SIGTERM")) cancelled.push({ runtime_id, provider });` 与 `:1220`。故本卡缺的确实是**覆盖测试**，不是实现 |

| D-039 | FR-45「材料与证据写入量下降」的验收口径＝**只合并真正的冗余写入**（同一份内容在同一位置被重复写），**保留 provider 只读工作区那份复制**；验收以修前/修后的**文件数与字节数**对比为准 | 用户 m01430 在「写入量怎么验收」三选中逐字答复「A 只合并真冗余，保留隔离那份（推荐）」。事实依据（主会话实测）：材料确被写两遍——`skills/wh-review/scripts/review-materials.mjs:651-653` 写入 `.wh-review-packets/review-*/`，再复制进 `work/<key>/bundle/materials/`；后者经 `lib/attachments.mjs:146 lockTree` 冻结为 `0o500`/`0o400` 只读树，是 provider 不可篡改材料的安全机制，不是纯浪费 | 只测量不优化 / 连只读隔离那份一起去掉 | 已确认：不得为降低写入量破坏只读隔离（与 D-006、D-010 一致） |
| D-040 | FR-46 验「主会话真实派发行为」时**允许读会话日志，但只读元数据**（调用次数、派发次数、各阶段时长、人工等待时长），**不读对话正文**；会话日志路径 `<DSH>/sessions/--Users-Hugh-Hugh-Project-workflowhub--/<会话>/session.v4.jsonl.zstd`，用 `zstd -dc` 解压后按 `tool/call` 记录的 `name`/`time`/`turn`/`step` 统计 | 用户 m01430 在「验收原件读不读日志」二选中逐字答复「A 读会话日志，但只读元数据（推荐）」。事实依据（主会话实测）：CARD-09 主会话工具调用 462 次、`subagent` 派发 14 次、`ask_user_question` 20 次、人工等待累计 1.13 h，均可从日志元数据复算；会话日志在仓库外、单会话压缩后 3.2 MB，只读元数据可避免体量与内容边界问题 | 只读仓库内原件（无法数出派发次数与人工等待） | 已确认：不新增任何控制面（D-024 不变）；日志是既有原件，不是新建的持久对象 |

| D-041 | 模块收敛为 **7 个工作包 → 2 个实施 Phase（资源组 / 效率组）**：M1 整仓迁入（`skills/third-review/**`，新建）→ M2 宿主配置改指（`skills/wh-review/scripts/third-review-host-config.mjs`、`runtime/review/ocr-delegation-adapter.mjs`、`runtime/review/review-packet-identity.mjs`）+ M4 32 测试改写挂全量回归（`skills/third-review/test/**`、`vitest.config.mjs`、`package.json`）+ M5 孤儿回收补覆盖（`skills/third-review/lib/runtime.mjs`、`lib/attachments.mjs` + 新测试）合成 **Phase「资源组」**；M7 效率四项（既有报告方法与 review caller 窄改）单独成 **Phase「效率组」**；M3 救活两个检查（`tests/contract/thin-core-residue.test.mjs`、`tests/contract/card06-migration-ledger.test.mjs`）与 M6 写入量下降（`skills/wh-review/scripts/review-materials.mjs`、`runtime/review/review-record-route.mjs`、`skills/wh-review/scripts/simple-review-runner.mjs`）按母 PRD 资源组归属并入资源 Phase | 用户 m01515 在「三个包怎么划 Phase」三选中逐字答复「C 拆两个：资源组一个、效率组一个（推荐）」。理由：按母 PRD 天然的「资源组（FR-43..46）/效率组（FR-58..61）」分界走，两个 Phase 各审一次、体量均衡，避免「一个 Phase 塞三个包」的审查过载，也避免三个 Phase 的交接与 OCR 次数上涨 | A 合成一个 Phase（审查过载）/ B 拆成三个 Phase（交接与 OCR 次数上涨） | 已确认：Phase 边界与母 PRD 的 FR 分组一致，便于 AC 追溯 |
| D-042 | 母 PRD 六组改动（含 D-029 范围句同步、D-020 FR-58 口径改写、D-007 一次性落笔）**在 build-plan 阶段先改完并提交 main**，先于本卡 build-code；本卡 spec.md 从第一步起与母 PRD 口径一致 | 用户 m01515 在「母 PRD 改动时机」二选中逐字答复「A build-plan 阶段先改完提交 main（推荐）」。理由：避免实施到一半才发现母卡范围句仍是旧口径（D-029 已记录 5 个独立审查方因这处口径差一致误判 Q4/Q5/Q15 超范围）；改母 PRD 不需再次取得授权（母 `prd.md:690` 已有用户原话「增补需求草案请直接更新到prd里的card-09任务，prd的更新请直接提交到main」） | B verify-code 通过后再改（中间期母卡口径与本卡实际范围不一致，审查方可能继续误判超范围） | 已确认：D-007 的「make-decision 收敛后」时机细化为「build-plan 阶段」，仍属一次性落笔 |

| D-043 | **确认 D-038 的范围收窄**：FR-43 定为「回收逻辑已存在（只读目录解除 + 孤儿 manager/provider 回收两半均在代码里），本卡只补覆盖测试 + 确定性计数验证」；验收证据＝只读树回收的确定性计数 + 新增针对性测试，不是新增实现 | 用户 m01610 在「D-038 收窄要不要确认」三选中逐字答复「A 确认收窄（推荐）」，用于收口细节审查 F-01/F-08/F-19。补测事实见 D-038 行（`lib/runtime.mjs:149/153/60-69`、`lib/broker.mjs:954/1220`） | B 按母 PRD 字面做完整实现（重做已能跑的东西）/ C 确认收窄但额外加一条进程残留验收 | 已确认：build-code 不得按母 PRD 字面把 FR-43 当新增实现重做 |
| D-044 | **审查契约的 600000 ms 固定截止改为「不得设固定墙钟截止」**：`skills/wh-review/contracts/provider-protocol.md:25` 现写「文档原生三段请求共用既有显式 600000 ms host 截止，内部步骤及 health/output 观测不得续期」，与 D-027 删掉固定截止后的真实代码不一致；裁定改契约文字，把「等 provider 自己报终态、不设固定墙钟截止」写进去，与同句后半「OCR direct code provider 不额外设置 elapsed-time host kill」口径统一。契约改写与 D-027 代码改动一起构成一个交付项，落点 `skills/wh-review/contracts/provider-protocol.md`，由 build-code 实施 | 用户 m01610 在「契约里的 600 秒截止怎么办」三选中逐字答复「A 改契约文字，把『不得设固定截止』写进去（推荐）」，用于收口细节审查 F-22。事实：D-027（提交 `cf51f5d3`）删掉了原生三段请求的固定 host 截止，`grep` 现存 `600000` 仅 `review-provider-client.mjs:265 LATE_SUPPLEMENT_WINDOW_MS`（保留不动） | B 恢复 600 秒截止（上一张卡修好的问题会回来）/ C 本卡不动、单独记待办 | 已确认：极端情况下卡住的 provider 靠 ownerloss guardian 与显式取消收场，不靠固定墙钟截止；`LATE_SUPPLEMENT_WINDOW_MS=600000` 不在本次改动范围 |
| D-045 | 整仓迁入时**必须同时新建 `skills/third-review/skill-bundle.json`**（`{"schema_version":1,"skill":"third-review","files":[...]}`），并入 AC-T2 的核对度量；理由：`tools/cli/run-checks.mjs:107` 对每个含 `SKILL.md` 的技能都校验同名 `skill-bundle.json`（`validateSkillBundle`），主仓 38 个技能目录**全部**有该文件（38/38），缺它会让 `pnpm check` 变红 | 主会话实测（回应 detail 第四轮 F-12/F-18/F-24）：`ls skills/*/skill-bundle.json | wc -l` ＝ 38，`ls -d skills/*/` ＝ 38；样例 `skills/stage-handoff/skill-bundle.json` 为 `{"schema_version": 1, "skill": "stage-handoff", "files": ["SKILL.md"]}`；外仓 `3rd-review` 无该文件（它是外仓不是主仓技能）。原「范围」节已写「新建 `skill-bundle.json`」但决定表无对应决定，属范围句挂空 | 只搬文件、不建 `skill-bundle.json`（`pnpm check` 会红） | 已确认 |
| D-046 | FR-45「材料与证据写入量下降」的**真冗余落点收窄**：多步审查输出**不是**可删冗余——`skills/wh-review/contracts/provider-protocol.md:39` 逐字要求「内部重建/揭示输出保存为原始过程事实」，删它违反契约；`.wh-review-packets/review-*` 是 provider 只读副本的来源且每轮 `dispose()` 删除，不算「同一位置重复写」。**本卡范围内可合并的真冗余＝审查请求文件里重复内嵌的整份材料**：`quality/evidence/execution-inputs/` 的 `*-review-request.json` 把 `approved_direction`（即 `decision-log.md` 全文）逐字内嵌，而同一份内容已作为交付件落在 `specs/<task>/decision-log.md`——实测本卡 5 个请求文件合计 458 KB，其中内嵌材料约 550 KB（单个最大 176798 B，其 `approved_direction` 占 137665 B）。判据：修前/修后对比**同一位置**的文件数与字节数，只合并这一处真冗余 | 主会话实测（回应 detail 第四轮 F-02/F-09/F-13/F-19 与 F-03/F-12 同一根因）：①`provider-protocol.md:39` 原文「内部重建/揭示输出保存为原始过程事实，只有最后挑战的 findings 是该请求的一个语义结果」；②`review-record-route.mjs:70` 每 provider 写一个 `.output`，实测单轮 6 个、3246–4314 B，属过程事实必须保留；③`quality/evidence/execution-inputs/` 实测 10 个文件，5 个是请求文件（46285 / 41185 / 149588 / 176798 B …）；④CLI 的 `readTaskBoundInput`（`tools/cli/stage-runtime.mjs:595-597`）只读不搬，故请求文件长期留存 | 把多步过程事实输出当冗余删除（违反 `provider-protocol.md:39`）／把 `.wh-review-packets` 当冗余删除（破坏只读副本来源）／只加一步「审查完成后清掉请求文件」（用户已否：会丢「当时提交了什么」的原始凭据） | **已确认**：用户 m01668 在「写入量真冗余怎么处置」三选中逐字答复「A 认下这处，改成『材料按路径引用』而不是抄一遍（推荐）」。**做法**：审查入口支持材料按仓库内路径引用（请求文件只记路径与校验信息，不再内嵌整份内容），取件仍读全部材料；属本卡已授权的「窄改 review caller/组包」范围，旧请求文件格式保持兼容可读 |
| D-047 | FR-46 的原始论断「主会话只派发与回收（的资源占用效果）」**不作为本卡的验收通过条件**，只在材料中如实登记为「已由 D-031 收窄为真实派发行为的事件计数，论断本身不设阈值」 | 回应 detail 第四轮 F-01：D-031 把验证对象改为真实派发行为后，AC-46 只剩事件计数，没有任何阈值能回答「是否真的只派发与回收」。事实依据：①母 `prd.md:488` 原句该条为「主会话只派发与回收（由 CARD-03 承接,本卡验证其效果）」，承接方已被 CARD-06 删除（D-031 已记录）；②D-004/D-031 的裁定链未登记该覆盖缺口，本决定补登记 | 补一条可判定口径（用户已否：母需求没给依据，自定比例容易变成为了通过而设的门槛）／从卡里拿掉该论断（用户已否：不如如实登记收窄） | **已确认**：用户 m01668 在「FR-46 论断怎么收」三选中逐字答复「A 不设阈值，如实登记『已收窄为事件计数』（推荐）」 |
| D-048 | **审查次数约束（用户纠正，本阶段流程约束）**：同一阶段的同一轨审查**一般只做一次**，最多只允许一次针对超大改动的聚焦复审；**不得为重复 finding 或空 findings 机械重试**。因此 detail 轨在第三、四轮之后**不再重交复审**：第五轮请求 `2026-10-04-006-card09-detail-review-request.json` 已按该约束**主动中止**（provider 输出 `2026-10-04-043..045` 为中止前的过程事实，无最终结果文件），其材料不构成新一轮判断依据 | 用户 m01954 逐字指出：「『复审』就是绝对的违反规定！workflowhub说过了，不要浪费时间复审！每次审查一般进行一次就够了，最多再进行一次超大改动的focus复审，你现在已经审查到第五轮了！」。规则原文见 `skills/wh-review/contracts/mini-task-implementation.md:11`「一次 implementation review；确实修复或主题变化后才做必要聚焦复审，**不为重复 finding 或空 findings 机械重试**」与 `skills/wh-review/contracts/provider-protocol.md:36`「WorkflowHub 不额外发起换 provider、格式纠正、continuation、同源兜底或**重复审查**」。事实：本阶段 direction 轨 2 轮（第一轮材料污染不计干净盲审，D-028）、detail 轨 4 轮（第三、四轮为有效判断依据），第五轮已中止 | 继续重交复审（违反规定、浪费用户时间） | **已确认**：用户 m01954 当面纠正；此后同轨审查不再重交 |

### 模块收敛实跑核实（2026-10-04）

| 事实 | 实测结果 | 对模块划法的影响 |
|---|---|---|
| 两个失效检查的失效原因 | 非搬家导致：`tests/contract/thin-core-residue.test.mjs:13` 与 `tests/contract/card06-migration-ledger.test.mjs:14` 的 `TABLE_REL` 写死为 `specs/workflowhub-thin-core-card-06-20260919/attachments/migration-table.md`（CARD-06 归档前位置），`findRepoRoot` 上溯失败。实跑 `npx vitest run` 两条均 FAIL（`Tests no tests`），报错 `Error: 无法从 …/tests/contract 上溯找到含 specs/workflowhub-thin-core-card-06-20260919/attachments/migration-table.md 的仓库根` | M3 定性为「顺手捡起两个本来就红的检查」，不是「搬家搞坏了要修回来」；表格实际在 `specs/archive/workflowhub-thin-core-card-06-20260919/attachments/migration-table.md`（368176 B） |
| 两个检查不能独立跑 | 两文件均 import vitest，`node --test` 直接跑报 `Error: Vitest failed to access its internal state.` | M3 的验收命令必须是 `npx vitest run <两文件>` |
| M1 落点是新建 | `skills/third-review` 当前不存在；`skills/` 下现有 30+ 技能目录（含 `review`、`spec-analyze`、`grill-with-docs` 等） | M1 是纯新增目录，与既有技能无写集重叠 |
| M2 改造点 | `skills/wh-review/scripts/third-review-host-config.mjs:171/177`（engine_version 检测）、`:211`（provider 白名单）、`:405-406`（拒绝 `wh_review.profiles`/`priority` 旧键）、`:492-506`（读 3rd-review config 并校验 profiles）、`:613-630`（brokerConfig） | M2 需等 M1，属串行 |
| M5 实现已在、覆盖为零 | 外仓 32 个测试**无一条**测过只读树回收（`grep -rln "0o500\|lockTree" test/` 命中的 5 个文件均为别名/无关） | M5 定位为「补覆盖测试 + 确定性计数验证」，不是新写回收逻辑（D-038） |

## 动态 Talk 批次

每轮记录：提出的问题、用户真实答复（逐字或明确选择）、产生的决定编号、未答/被推翻项。

**第 1 轮（4 问：外仓边界 / 写入量落点 / 并发限制形态 / 与 CARD-06 的时序）**（本卡早期轮次；**该批答复未留消息 ref**，属引用缺口，如实登记——可回读落点＝本轮次正文与对应 D-0xx 决定行。）

- 答复：外仓「两边一起改」；写入量「存量回收+新增上限」；并发限制「按 provider 扇出加硬上限」（**该答复后被 D-001 推翻**）；时序题未选，指出 card-06 已完成收口提交。
- 产生决定：本轮答复中的限并发部分被 D-001 推翻；其余进入后续轮次重问。
- 未答/被推翻：并发限制形态（被推翻）；与 CARD-06 的时序（用户未选，改为按实测确认 CARD-06 已收口，见 OPEN-004）。

**第 2 轮（4 问：热指标测法 / 托管路径范围 / 失败来源做法 / 耗时数据源）**（本卡早期轮次；**该批答复未留消息 ref**，属引用缺口，如实登记——可回读落点＝本轮次正文与对应 D-0xx 决定行。）

- 答复：热指标「真跑一次同任务前后对比」（**该答复后被 D-023 推翻**）；托管路径「先确认活路径再决定范围」（已由调研判定：外仓 broker 已不在活路径，自 `457299b3` 起 native-only）；失败来源「复用外仓已有的失败分类与取消语义」；耗时数据源「已有原件 + 独立上下文提取子代理区间」。
- 产生决定：后三项进入 D-004、D-006、D-013 等；热采样验收被 D-023 推翻。
- 未答/被推翻：热指标测法（被推翻）。

**第 3 轮（3 问：范围撤销确认 / 搬家落点 / 重心收敛）**（本卡早期轮次；**该批答复未留消息 ref**，属引用缺口，如实登记——可回读落点＝本轮次正文与对应 D-0xx 决定行。）

- 答复：见 U-003 三条逐字原文（U-003 即用户 m01057 的范围撤销答复，逐字原文见本文件「### U-003」节，不再回指 Talk 轮次）。
- 产生决定：D-001、D-002、D-005、D-022。
- 未答/被推翻：无。

**第 4 轮（3 问：效率够不够 / 搬家放哪一轮 / 资源两件怎么定）**（本卡早期轮次；**该批答复未留消息 ref**，属引用缺口，如实登记——可回读落点＝本轮次正文与对应 D-0xx 决定行。）

- 答复：效率「四件+开工前对齐」；搬家「同任务、搬家作为第一个阶段」；资源「两件都保留」。
- 产生决定：D-008、D-009、D-010。
- 未答/被推翻：无。

**第 5 轮（3 问：时间报告写哪 / 写入量基线 / 开工前对齐管多宽）**（本卡早期轮次；**该批答复未留消息 ref**，属引用缺口，如实登记——可回读落点＝本轮次正文与对应 D-0xx 决定行。）

- 答复：时间报告题**未选任何选项**，写了自定义答复（见 U-004）；写入量「先采一次真基线」；开工前对齐「只管阶段开工前」。
- 产生决定：D-011、D-012、D-013、D-021。
- 未答/被推翻：选择题选项全部未采纳。

**第 6 轮（2 问：时间分账怎么交 / 基线怎么存）**（本卡早期轮次；**该批答复未留消息 ref**，属引用缺口，如实登记——可回读落点＝本轮次正文与对应 D-0xx 决定行。）

- 答复：时间分账「不落文件、需要时现场算」；基线「存成命令证据」。
- 产生决定：D-013、D-014。
- 未答/被推翻：无。

**第 7 轮（2 问：平台中断算哪类 / 导航给谁看）**（本卡早期轮次；**该批答复未留消息 ref**，属引用缺口，如实登记——可回读落点＝本轮次正文与对应 D-0xx 决定行。）

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

**第 10 轮（4 问：外仓版本记录落点 / 两个失效检查的救活方式 / 32 个测试的写法 / 时间账验收证据）**（本卡早期轮次；**该批答复未留消息 ref**，属引用缺口，如实登记——可回读落点＝本轮次正文与对应 D-0xx 决定行。）

- 答复 1（版本记录落点）→「A 写在技能自己的说明文件里（推荐）」→ **D-032**。
- 答复 2（失效检查救活）→「A 改检查，从归档位置读（推荐）」→ **D-033**。
- 答复 3（32 个测试写法）→「B 顺手改成主仓的测试写法」→ **D-034**（与 D-019 的「单独接一条命令、不挂全量回归」合并执行）。
- 答复 4（时间账验收证据）→「A 验收时真算一次，当场展示过程和结果（推荐）」→ **D-035**。
- 未答/被推翻：无。

**第 11 轮（2 问：搬迁范围含哪些非代码文件 / 32 个测试是否挂进全量回归）**

- 答复 1（搬迁范围）→「A 搬代码 + 测试 + docs（推荐）」→ **D-036**。
- 答复 2（测试隔离）→「B 干脆就挂进全量回归」→ **D-037**。此答复**改变了 D-019 与 D-034 中「不挂全量回归」的做法**：主会话随后实测确认这些测试不写仓库内文件（无一处 `writeFile*` 指向仓库路径），临时目录用 `mkdtempSync(path.join(os.tmpdir(), …))` 共 49 处随机路径，仅 1 处固定前缀 `/tmp/opencode-canonical-cwd-`；主仓 `vitest.config.mjs` 的 `pool: "forks"` 且 `maxForks: 2` 本身就限制并发，故挂进全量回归的干扰风险有限。据此把改动后的做法与理由一并登记。
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

## grill

**执行方式更正（2026-10-04）**：本轮 grill 起初被派给子代理执行，用户指出「grill 类的交互技能应该使用主会话进行，否则如何和我交互」。子代理已中断（未产出报告），grill 改由主会话执行。**教训：交互类技能（talk-with-zhipeng、grill-with-docs）必须在主会话执行，不得委派。**

### 全需求覆盖矩阵（五类）

| 消息类 | 原始消息定位 | 决策轴 | 绑定 | 覆盖状态 |
| --- | --- | --- | --- | --- |
| goal | 母 `prd.md:488` 资源四项 + 效率四项；`:518-521` 增补五阶段说明；R-017/`prd.md:159` | 效率四项（FR-58..61）+ 开工前对齐 / 资源三项 / 母 PRD 同步 | D-001..D-010、D-012、D-020、D-031、D-038 | 完整 |
| flow_or_surface | 母 `prd.md:489` 窄范围语言；五阶段开工说明③④；CARD-08 冻结的 shared stage-handoff 与五 workflow 保存句 | 迁移与检查维护 / 效率四项落点 / 资源四项落点 | D-002、D-017、D-018、D-032..D-037；五 workflow 保存句由 CARD-08 冻结、本卡不改 | 完整（交接句部分已由 CARD-08 交付并进入 main，实测未回退） |
| data_or_state | 审查链 runtime 目录、`/tmp/3rd-review`、冻结只读树、`state.json`、`quality/reviews/*.output`、`.wh-review-packets`、会话日志 | 回收与写入量 / 验收原件 | D-006、D-010、D-024、D-031、D-038、D-040 | 完整（原缺口「会话日志作为验收原件的边界未定」已由 D-040 消解：只读元数据、不读正文） |
| success_failure_acceptance | 母 AC-43..46/51；AC-59..62；`:519` 四种不得制造收益情形 | 验收判据 | D-004、D-008、D-023、D-031、D-035、D-038、D-039、D-043、D-045、D-046 | 完整（原缺口「FR-45 写入量下降的验收口径未定」已由 D-039 消解；D-045/D-046 补 skill-bundle.json 与真冗余落点） |
| constraint_non_goal_defer | 母 `prd.md:489` 非目标；`prd.md:512` 已修缺陷只作反例；`CONSTITUTION.md:174`；R-017 环境层排除 | 范围与非目标 | D-001、D-013、D-022..D-024 | 完整 |

### 逐决策轴的仓库事实核实（实跑）

| 轴 | 核实结果 | 依据 |
| --- | --- | --- |
| 孤儿回收（FR-43） | **能力已在**：只读树由 `lib/attachments.mjs:146 lockTree`（目录 `0o500`、文件 `0o400`）创建；解除由 `lib/runtime.mjs:119 unlockForRemoval` 与 `lib/attachments.mjs` 的 `unlockTree` 完成；两条删除路径（`lib/runtime.mjs:130 removeDirectory`、`lib/attachments.mjs:188 discardManagedAttachments`）都已接上解除动作。构造只读 `work/k/bundle` 后调用真实 `cleanup(root, 24)`，返回 `["1111…"]`、目录与只读树全部删除。`/tmp/3rd-review` 现有 4 个 runtime 未过期（`expires_at_ms` 在 2026-10-05），此前 9 个过期目录由 `lib/broker.mjs:756/794` 的 `cleanup` 清掉 | D-038 |
| 写入量（FR-45） | 同一份材料确被写两遍：`skills/wh-review/scripts/review-materials.mjs:651-653` 写入 `.wh-review-packets/review-*/`，再复制进 provider 的 `work/<key>/bundle/materials/`（实测 3 个材料各 1 份，`01-raw_requirement.md` 15167 B 与原件 sha256 前 16 位一致，`02-objective_facts.md` 10529 B 因宿主路径脱敏比原件多 11 B）。`runtime/review/review-record-route.mjs:70` 的 `onProviderOutput` 每次调用写一个新 `.output` 文件（实测每 provider 各 1 个，共 6 个 3.2–4.3 KB） | D-006、D-010 |
| 主会话派发行为（FR-46） | **可复算**：会话日志 `<DSH>/sessions/--Users-Hugh-Hugh-Project-workflowhub--/<session>/session.v4.jsonl.zstd`（`zstd -dc` 后可解析）记录每条 `tool/call` 的 `name`/`time`/`turn`/`step`。CARD-09 主会话实测：工具调用 462 次、`subagent` 派发 14 次、`ask_user_question` 20 次、人工等待累计 1.13 h | D-031 |
| 同口径耗时（FR-58） | **可复算**：`quality/reviews/2026-10-04-027-make-decision-direction.json` 的 `provider_results[].timing` 给出逐 provider 耗时（kimi/coding red 277867 ms、antigravity/flash red 149093 ms、codex/luna red 454985 ms、kimi/coding blue 160940 ms、antigravity/flash blue 147662 ms、codex/luna blue 555203 ms，累计 29.10 min） | D-035 |
| 两个失效检查（D-033） | `specs/archive/workflowhub-thin-core-card-06-20260919/attachments/migration-table.md` 存在；`tests/contract/thin-core-residue.test.mjs` 与 `card06-migration-ledger.test.mjs` 为 CARD-09 待改点 | D-033 |
| 32 个测试改写（D-034/D-037） | 外仓 32/32 用 `node:test` + `node:assert/strict`，0 个 vitest；主仓 `vitest.config.mjs` 的 `include` 含 `skills/**/*.test.mjs`，`pool: "forks"` + `maxForks: 2` | D-034、D-037 |
| 五 workflow 交接句 | 实测 5 份 `workflows/*/SKILL.md` 与 `skills/stage-handoff/SKILL.md` 均为 CARD-08 交付后的句子（如 `workflows/make-decision/SKILL.md:42`），未回退 | CARD-08 |

### 四项退出条件

| 退出检查 | 结果 | 依据 |
| --- | --- | --- |
| 外部依赖接口已核实真实定义 | pass | broker 的 `cleanup`/`removeRuntimeDirectory` 行为经实跑确认；审查结果 JSON 的 `provider_results[].timing` 字段经实读确认 |
| 字段/路径命名有唯一权威定义 | pass | `runtime/review/stage-materials.json`（`wh-review-stage-materials.v2`）、`skills/wh-review/contracts/workflowhub-result.v3.json`、`docs/architecture/move-map.json` 分别为材料面、结果格式、搬移映射的唯一权威 |
| 失败路径/异常语义明确 | pass | 已知码 `PROVIDER_PACKET_BOUNDARY_UNAVAILABLE`、`REVIEW_EXECUTION_TIMEOUT`、`PROCESS_TIMEOUT`、`MATERIAL_FORBIDDEN`、`MATERIAL_INCOMPLETE`、`ATTACHMENT_IMMUTABLE`、`NATIVE_DIRECTION_STEP_OUTPUT_INVALID`；`status=unavailable` 与 `outcome=partial` 的语义已实测 |
| 范围边界写死、无隐性扩大 | pass | 见「待问」1、2 |

### 待问与答复（两条，均已由用户裁定）

1. FR-45「写入量下降」的验收口径 → 用户逐字答复「A 只合并真冗余，保留隔离那份（推荐）」→ **D-039**。
2. FR-46 验收原件是否读会话日志 → 用户逐字答复「A 读会话日志，但只读元数据（推荐）」→ **D-040**。

两条答复后，四项退出条件中的「范围边界写死、无隐性扩大」由 unresolved 转为 **pass**。

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

### detail-advice 第三轮（`quality/reviews/2026-10-04-035-make-decision-detail.json`，29 findings）

- 运行事实：`status=available`、`dispatch_state=dispatched`、`outcome=completed`、`pair_status=complete`、`authoritative=false`；`review_track=detail`、`subject_kind=document`、`surface` 按 detail 轨；6 个 provider 全部 `completed`（kimi/coding red 118007 ms、antigravity/flash red 136567 ms、codex/luna red 715986 ms、kimi/coding blue 307192 ms、antigravity/flash blue 155204 ms、codex/luna blue 319556 ms），累计 1752.5 s。
- 送审材料（detail 轨，**与 direction 轨材料集不同**）：`raw_requirement`（`prd.md:486-522` 逐字 + `:159` R-017 + `:163` R-021）、`approved_direction`（当前 `decision-log.md` 逐字）、`draft_spec_or_acceptance`（验收标准草案，107 行）。请求原件 `<TASK_DIR>/quality/evidence/execution-inputs/2026-10-04-004-card09-detail-review-request.json`（149588 B）。
- 第一次提交因材料键错误失败：按 direction 轨材料集提交时 CLI 报 `MATERIAL_UNKNOWN_KEY_DROPPED: objective_facts is not in the stage material allowlist` 与同键 `convergence_outline`，结果 `unavailable`。**detail 轨契约见 `runtime/review/stage-materials.json`：required＝`raw_requirement`/`approved_direction`/`draft_spec_or_acceptance`/`review_instructions`，optional＝`context_map`/`evidence_map`，forbidden＝`[]`。** 且 `runtime/review/review-materials.mjs:233` 要求 `approved_direction` 与当前 `decision-log.md` 字节完全一致，故决策稿必须先落盘再送审。
- 发现分布：major 21 / minor 8；按 provider＝antigravity/flash 11、codex/luna 8、kimi/coding 10；按材料＝`03-draft_spec_or_acceptance.md` 23 条、`02-approved_direction.md` 6 条。
- 处置口径同前：`fixed`＝本轮已在 decision-log 或验收草案内落定；`rejected_invalid`＝发现本身不成立（事实错误、与已确认决定冲突、或与其它发现重复计数）；`accepted_risk`＝成立但本轮不处理。

| 编号 | severity | 来源 | 发现摘要 | 处置 | 依据 |
| --- | --- | --- | --- | --- | --- |
| F-01 | major | red / kimi | D-038 状态仍为「待确认」，但 Exit checks 声称无遗留 needs_human，且验收草案 AC-43 已建立在该未确认收窄之上 | `fixed` | 成立且是本轮最实质的一条。用户 m01610 裁定「A 确认收窄」→ **D-043**；D-038 状态列已改为「已确认（D-043）」，并补孤儿回收实测证据 |
| F-02 | major | red / kimi | AC-46 声称五项度量「全部从会话日志元数据复算」，但④进程数与文件数、⑤写入字节量无法从日志元数据得出 | `fixed` | 成立。已按 D-040 边界改写 AC-46：①②③原件＝会话日志元数据；④⑤原件＝进程表与文件系统确定性计数命令，不再声称来自日志 |
| F-03 | minor | red / kimi | AC-43 复验命令括注「（M4 改写后路径）」与草案 line 104 及 D-041 的 M5 归属不一致 | `fixed` | 成立；括注改为 M5 |
| F-04 | minor | red / kimi | AC-51 与 AC-46 的指标集几乎完全重复，同一次量测要采两遍 | `fixed` | 成立；已注明两条 AC 共享同一次修前/修后确定性计数采集，不各采一遍 |
| F-05 | major | red / antigravity | AC-59 时间分账分类遗漏已批准的「平台/安全策略中断」独立类别 | `fixed` | 成立；与 F-23 同根因，分类清单已补该独立类别并写明不得并入人工等待或未归因 |
| F-06 | major | red / antigravity | 同 F-02（AC-46 度量来源冲突） | `rejected_invalid` | 与 F-02 同一发现，重复计数 |
| F-07 | major | red / antigravity | M3 验收只含路径修正，遗漏 D-017 要求的 thin-core-residue 技能豁免，迁入后会失败 | `fixed` | 成立；M3 验收已补「迁入 `skills/third-review` 后不触发已删模块复活断言、且仍能检出真正残留」 |
| F-08 | major | red / antigravity | AC-43 把 FR-43 收窄为仅缺覆盖测试，遗漏孤儿进程终止机制的验证 | `fixed` | 成立（部分）。实测证明孤儿回收**已实现**（`lib/runtime.mjs:149/153`、`:60-69` SIGTERM→SIGKILL、`lib/broker.mjs:954/1220`），故仍属补覆盖测试；AC-43 已把「进程表中不再存在该 runtime 对应进程」列为独立断言 |
| F-09 | minor | red / antigravity | AC-62 沿用「7 包 → 5 Phase」，与 D-041 的 2 个实施 Phase 冲突 | `fixed` | 成立；D-041 标题与正文、R-008、R-005 引用均已改为「2 个实施 Phase（资源组 / 效率组）」 |
| F-10 | major | red / codex | 已批准方向新增的 D-008 开工前核对、D-002/D-032/D-036 迁入与版本来源记录，草案没有可判定验收条件 | `fixed` | 成立；已补一条「开工前对齐」验收（计划声明的消费者与命令 vs 真实代码，对不上即停下问人）与迁入范围/排除项/版本来源的可核对验收 |
| F-11 | major | red / codex | AC-45 候选未证明符合 D-039「同一份内容在同一位置被重复写」的定义：跨目录复制不同位置、无引用输出未证明内容重复 | `fixed` | 成立。已核：`.wh-review-packets/review-*/` 是 provider 只读副本的来源（`review-materials.mjs:651-653` 写、随后复制进 `work/<key>/bundle/materials/` 并经 `lockTree` 冻结为 `0o500`/`0o400`），按 D-039 **保留**；真冗余候选收窄为「多步路径下的无引用孤儿输出」（`simple-review-runner.mjs:1451` 逐条写、`:1453` 只留 `refs[0]`）。未证明重复前不得当冗余删 |
| F-12 | major | red / codex | AC-46 未给进程数/文件数/字节量的日志字段或其它原件，也未单列 D-031 要求的主会话自行执行次数 | `fixed` | 同 F-02；并已单列「主会话自行执行次数」 |
| F-13 | major | red / codex | AC-59 只有各 provider `duration_ms`，不足以恢复区间边界；通过阈值也未要求实际完成可比的前后两次分账 | `fixed` | 部分成立：027 结果的 `timing` **实际含 `started_at_ms` 与 `completed_at_ms`**（实测 kimi/coding red `1791115328895`→`1791115606762`），故并集可算；已改为引用起止时刻，并把「修前修后条件可比 + 记录固定变量 + 区间并集」写入通过条件，缺时刻记 unknown/inconclusive |
| F-14 | major | red / codex | AC-61 未覆盖索引与实际复制字节核对、实际 argv/tool/trust 边界检查及调用前时序 | `rejected_invalid` | 发现与 F-25 重复计数；且 FR-60 的这三项核对属「现有 producer 暴露可控错误」范畴，AC-61 的条件已列路径/后缀缺失、来源配置冲突、错误 lifecycle、解析不匹配四类样本，build-plan 再落具体样本与命令（母 PRD `:520` 已授权后置） |
| F-15 | minor | red / codex | AC-43 只验 runtime 目录消失与 `unlockForRemoval` 调用，`unlockTree` 附件删除路径可能蒙混过关 | `rejected_invalid` | 发现重复计数（与 F-08 同点，AC-43 已含独立断言）；且 AC-43 已分别点名 `discardManagedAttachments`（附件路径）与 `removeDirectory`（runtime 路径）两条删除路径 |
| F-16 | major | blue / kimi | 同 F-02（AC-46 度量来源冲突） | `rejected_invalid` | 与 F-02 同一发现，重复计数 |
| F-17 | major | blue / kimi | 已授权新增的 D-008/D-012「阶段开工前对齐」在草案中没有任何验收节 | `fixed` | 与 F-10 同根因；已补「开工前对齐」验收节 |
| F-18 | major | blue / kimi | 同一写入落点在两份材料中的实测数字互相矛盾（24 个 `.output`/573340 B vs 每 provider 各 1 个/6 个），且均未标采样范围 | `fixed` | 成立。两处口径不同且未标注：`03` 是 `quality/reviews/` 目录累计口径，`02` 是单轮审查口径；已补采样范围标注，并把 AC-45 修前基线固定为单一明确口径（轮次 + 目录 + 时间窗） |
| F-19 | minor | blue / kimi | D-038 状态「待确认」但 AC-43 已把该收窄当既定事实前提 | `fixed` | 与 F-01 同根因；已由 D-043 关闭 |
| F-20 | minor | blue / kimi | AC-59 只引 `duration_ms`，无法计算六个并发 provider 的并集 | `fixed` | 与 F-13 同根因；已改引 `timing.started_at_ms`/`completed_at_ms` |
| F-21 | minor | blue / kimi | 同 F-03（AC-43 的 M4/M5 标注不一致） | `rejected_invalid` | 与 F-03 同一发现，重复计数 |
| F-22 | major | blue / antigravity | D-027 删除全部 deadline，违反 `contracts/provider-protocol.md:25` 关于文档原生三段请求共用 600000 ms host 截止的契约约束 | `fixed` | 成立。已核契约原文确实写「文档原生三段请求共用既有显式 600000 ms host 截止」；用户 m01610 裁定「A 改契约文字」→ **D-044**：契约改为「等 provider 自己报终态、不设固定墙钟截止」，与同句后半 OCR 口径统一，契约改写由 build-code 落地 |
| F-23 | major | blue / antigravity | 同 F-05（AC-59 遗漏平台/安全策略中断类别） | `rejected_invalid` | 与 F-05 同一发现，重复计数 |
| F-24 | major | blue / antigravity | `complete_user_flow` 与 `data_state` 以 non_ui 为由标 `empty: true`，遗漏 FR-58..FR-61 的派发/拉长间隔/防重试/受控取消运行流程与状态边界 | `fixed` | 成立。已回填 OI 大纲固定类别两行：`complete_user_flow` 由 `empty: true` 改为 `false`，登记五段运行流程（基线测量 → 短导航 → 按包派发 → 受控取消 → 现场复算）与两个显式分支；`data_state` 由 `empty: true` 改为 `false`，登记三类既有状态转换（材料/证据写入与只读冻结、runtime 目录回收、派发状态与受控取消），均非新增持久对象 |
| F-25 | major | blue / antigravity | 验收命令草案未给 AC-60/AC-61/AC-62 任何可执行验证命令或测试脚本 | `fixed` | 成立。已补三条反例样本构造与自动化测试命令（不再推迟到 build-plan 之后） |
| F-26 | major | blue / antigravity | D-034 把 32 个测试从 `node:test` 改写为 Vitest，违反 simplicity-guard P1 直接复用原则（可用 `node --test`） | `rejected_invalid` | 发现与已确认决定冲突：用户 m01240 在「32 个测试怎么写」三选中逐字答复「B 顺手改成主仓的测试写法」，m01290 又裁定「B 干脆就挂进全量回归」→ D-034/D-037。simplicity-guard 阶梯的 P1 是「直接复用**现有能力**」，而主仓全量回归的 harness 是 Vitest（`skills/**/*.test.mjs` 在 `vitest.config.mjs` 的 `include` 内），`node:test` 文件被 Vitest 收集会报 `Vitest failed to access its internal state.`（实测两个失效检查即此现象），故不适用 |
| F-27 | minor | blue / antigravity | D-041 标题写「7 个工作包 → 5 个实施 Phase」，但正文只收敛为 2 个 Phase | `fixed` | 成立（部分）：D-041 标题与两处引用已改为「2 个实施 Phase（资源组 / 效率组）」；`M8` 是母 PRD 同步项而非实施工作包，已注明按 D-042 在 build-plan 阶段先做、不占 Phase |
| F-28 | major | blue / codex | 同 F-02/F-06/F-12/F-16（AC-46 度量来源冲突） | `rejected_invalid` | 与 F-02 同一发现，重复计数 |
| F-29 | major | blue / codex | 同 F-13/F-20（AC-59 只有 duration_ms，不足以算并集） | `rejected_invalid` | 与 F-13 同一发现，重复计数 |

**计数**（经 detail 第四轮 F-16 指出后更正）：`fixed` 20 / `rejected_invalid` 9（F-06、F-14、F-15、F-16、F-21、F-23、F-26、F-28、F-29 九条为纯重复计数或与已确认决定冲突——F-06、F-16、F-28、F-29 与 F-02/F-13 同源，F-15、F-21、F-23 与 F-08/F-03/F-05 同源，F-26 与用户已裁定的 D-034/D-037 冲突；其中 F-14 为重复计数加母 PRD `:520` 已授权后置）/ `accepted_risk` 0 / `needs_human` 0。原计数行误写 `fixed` 21 / `rejected_invalid` 7（合计 28，与表中 29 行不符），括注列了 8 个编号却称 7 条且漏 F-26。

**F-01 详述（detail 第三轮唯一需要用户拍板的真问题，已裁决）**

细节审查指出：D-038 把 FR-43 从「实现」收窄为「补覆盖测试 + 确定性计数验证」，理由是主会话实测只读目录解除与过期 runtime 删除都成功；但该收窄的状态列一直写「待确认」，没有取得用户确认，而同一份 decision-log 的 Exit checks 却写「审查处置明确：已通过……无遗留 needs_human 项」，验收草案 AC-43 的全部判定阈值也已建立在这条未确认收窄之上——「方向既未确认又已被当作确认口径落入验收」。

- 该判断成立，是本轮最实质的一条：D-038 是基于主会话实测作出的范围收窄，漏走了确认步骤。
- 本轮补测把收窄的实证补全：FR-43 的两半（只读目录解除、孤儿 manager/provider 回收）在代码里**都已实现**，见 `lib/runtime.mjs:149`（`const orphaned = Object.values(state.providers ?? {}).some((item) => item.status === "running" || item.cleanup_status === "cleanup_pending");`）、`:153`（`if (orphaned && ownerConfirmedDead(state.owner) && /^[0-9a-f-]{36}$/i.test(entry.name)) reapRuntimeIfOwnerDead(root, entry.name);`）、`:60-69`（`if (!terminateProcessTree(pid, "SIGTERM")) return false;` … `escalation.phase = "sigkill"; terminateProcessTree(pid, "SIGKILL");`），以及 broker 侧 `lib/broker.mjs:954`、`:1220`。
- 用户 m01610 裁定（选项「A 确认收窄」）：**确认 D-038 的范围收窄** → D-043。build-code 不得按母 PRD 字面把 FR-43 当新增实现重做。

**F-22 详述（detail 第三轮；已裁决：改契约文字，见 D-044）**

审查方指出 D-027（提交 `cf51f5d3`）删掉了审查链中的固定 host 截止，而 `skills/wh-review/contracts/provider-protocol.md:25` 明确写着「文档原生三段请求共用既有显式 600000 ms host 截止，内部步骤及 health/output 观测不得续期」——代码与契约文字不一致。

- 该判断成立，且是本轮唯一牵出已提交代码的一条。`grep` 现存 `600000` 仅 `skills/wh-review/scripts/review-provider-client.mjs:265` 的 `LATE_SUPPLEMENT_WINDOW_MS = 600000`（保留不动）。
- 用户 m01610 裁定（选项「A 改契约文字，把『不得设固定截止』写进去」）：**契约改写为「等 provider 自己报终态、不设固定墙钟截止」** → D-044，与同句后半「OCR direct code provider 不额外设置 elapsed-time host kill」口径统一；契约改写由 build-code 落地。

**F-01 详述（direction 第二轮；已裁决：验证对象改为真实派发行为，见 D-031）**

FR-46 原文为「主会话只派发与回收的资源占用效果被实测验证(CARD-03 承接实现,本卡验证)」，其验证对象是 CARD-03 交付的「主会话只派发与回收」。实测核查（本卡工作树与 main）：

- CARD-03 已 close（外置 facts 尾行 `close` @2026-10-01T11:27:31Z），其验收文件 `tests/acceptance/card-03-current.mjs`、`card-03-current.test.mjs` 在 main 中存在。
- 但 CARD-03 的派发方法落点已被 CARD-06 按迁移表删除：`tests/contract/card03-dispatch-method.test.mjs` 记 `DELETE | B7/P8`（`migration-table.md:745`、`migration-table-part5-tests.md:388`）；`tests/contract/card03-projection-root-causes.test.mjs` 的被测对象 `runtime/stage/stage-runner.mjs` 记 `DELETE B4/P5`（`migration-table.md:812`）；`card03-runtime-binding`、`card03-skill-bundle-closure`、`card03-completion-separation`、`card03-conditional-acceptance-contract` 同样 DELETE。
- 现仓实测：`runtime/stage/stage-runner.mjs`、`runtime/stage/stage-handlers.mjs`、`tests/contract/card03-dispatch-method.test.mjs` **均不存在**（`git ls-files` 无匹配）。
- 仍然存在的：`AGENTS.md:14-19` 的派发治理文字（「重活放进子代理上下文执行，主上下文只收摘要」「派发按工作类型，回传结论与清单，修复回原实施子代理同一会话」「五阶段共用并发区间为 2–5」「不空转轮询」「不整份继承父代理上下文」）与 `tools/cli/stage-runtime.mjs`（阶段运行入口）。
- 结论：**FR-46 原文所指「CARD-03 承接实现」的具体落点已不存在，只剩治理文字与真实派发行为。**该条按确定性计数验证仍可做（数进程数/文件数/写入字节量），但「验证什么对象」需要用户裁定。

- 用户 m01230 裁定（选项「改成验『真实的派发行为』」）：**FR-46 保留，验证对象由已删的 CARD-03 实现改为真实派发行为**——即本卡与后续阶段实际发生的派发事实：审查会话真实发起的子代理次数、主会话自行执行的次数、进程数与文件数、材料与证据的写入字节量。故本条的「实现 owner=CARD-03」只作历史来源记录，不再作为验证前提。

**F-07 详述（direction 第二轮；accepted_risk）**

审查方指出送审的「原始需求」本身已写死四项产品干预、四项效率交付与排除项，使独立重建在信息上不可能干净。该判断成立：`2026-10-04-001-card09-raw-requirement.md` 是母 `prd.md:486-522` 卡正文的逐字摘录，而母卡正文本身即含 FR/AC 与「产品层四项」表述。按 `skills/wh-review/contracts/make-decision.md`，干净重建需要一份不含方案的原始问题件，但本卡的原始需求就是这份带方案的卡正文（且母材料只读、本卡不改写）。**接受该结构性限制并如实登记**：本卡的方向审查在「重建」环节天然带污染，其独立挑战价值主要来自 reveal→challenge 两步与对材料的交叉核对，而非纯净重建。

### detail-advice 第四轮（`quality/reviews/2026-10-04-042-make-decision-detail.json`，27 findings）

**运行事实**：第三轮 20 条 `fixed` 全部落到 `acceptance-draft.md` 后重交复核（请求 `<TASK_DIR>/quality/evidence/execution-inputs/2026-10-04-005-card09-detail-review-request.json`，176798 B）。材料＝`raw_requirement`（15167 B）、`approved_direction`（当时 `decision-log.md` 逐字 137665 B）、`draft_spec_or_acceptance`（22689 B）。结果 `status=available`、`dispatch_state=dispatched`、`outcome=completed`、`pair_status=complete`、`authoritative=false`；6 provider 全 `completed`（red：kimi/coding 383108、antigravity/flash 171283、codex/luna 247015 ms；blue：kimi/coding 444349、antigravity/flash 227007、codex/luna 1118393 ms）。分布：27 条（major 20 / minor 7），`materials/02-approved_direction.md` 9 条、`materials/03-draft_spec_or_acceptance.md` 18 条。

| # | 严重度 | 来源 | 问题摘要 | 处置 | 依据 |
| --- | --- | --- | --- | --- | --- |
| F-01 | major | red / kimi | FR-46 改「真实派发行为」后只剩事件计数，「主会话只派发与回收」论断不再被任何验收验证，缺口未登记 | `needs_human` → 已裁决 | 成立。补 D-047：该论断不设验收阈值、只如实登记为「已收窄为事件计数」；已确认（用户 m01668，见 D-047） |
| F-02 | major | red / kimi | FR-45 测量面不含 `.wh-review-packets/`，与「索引抖动根因是文件数」的诊断脱节 | `fixed` | 成立。AC-45 改为**四处**统计（含请求文件与主交付件），并写明 `.wh-review-packets` 每轮 `dispose()` 删除、不属同位置重复写（D-039/D-046） |
| F-03 | major | red / kimi | AC-45 通过阈值要求「已证明重复的写入被消除」，但唯一候选是多步无引用孤儿输出且重复未证明，无可达标对象 | `fixed` | 成立。D-046 更换真冗余落点（请求文件内嵌整份材料）；AC-45 补「无可合并冗余时记 `inconclusive`，不记 fail、不写成改善」 |
| F-04 | major | red / kimi | D-027 状态栏写「未提交」，D-044 与 F-22 处置却引提交 `cf51f5d3`，两处不能同真 | `fixed` | 成立。D-027 状态列改为「已实施并已提交 `cf51f5d3`（父提交 `e78c0e41`）」，并写入「## Append-only 更正」 |
| F-05 | minor | red / kimi | FR-58 原句「在既有阶段」的时点约束在 AC-59 中消失 | `fixed` | 成立。AC-59 条件补「于既有阶段人读对账时点执行」，并注明 D-020 只去掉「报告」作为交付物的含义 |
| F-06 | minor | red / kimi | 草案失败场景没有全覆盖：AC-60「原失败被删除/写为空 findings」与 AC-62「用户暂停」无反例样本 | `fixed` | 成立。AC-60 增调度分支 C（空 findings 反例）；AC-62 样本补「用户暂停」并要求暂停与取消两条路径各自可观察 |
| F-07 | major | red / antigravity | D-044 裁定的契约修改未纳入验收草案，无标准、无阈值、无命令 | `fixed` | 成立。新增 AC-T4 断言 `provider-protocol.md` 已无 `600000` 固定截止且写明替代收场边界 |
| F-08 | major | red / antigravity | AC-61 采纳了已判 `rejected_invalid` 的 F-14 准备检查时序，两份材料处置冲突 | `fixed` | 成立。AC-61 移除准备检查时序要求与相应失败场景/命令，明确后置到 build-plan |
| F-09 | major | red / antigravity | AC-45 唯一候选真冗余与 provider-protocol 多步输出保留要求冲突，导致验收不可能或破坏协议 | `fixed` | 成立（与 F-03 同根因）。`provider-protocol.md:39` 逐字要求保留内部重建/揭示输出，故该候选**不是**可删冗余；D-046 更换落点 |
| F-10 | major | red / antigravity | AC-59 复算命令只依赖审查结果 JSON，无法恢复总跨度、工具区间与平台中断 | `fixed` | 成立。AC-59 原件清单补会话日志元数据路径与解析字段（只读元数据，D-040） |
| F-11 | minor | red / antigravity | M2 实现范围与风险节「只改一行」描述不一致，低估改动面与回滚复杂度 | `fixed` | 成立。风险节改为如实陈述 M2 涉及三个运行时文件与宿主配置，回滚按该行与文件清单 |
| F-12 | major | red / codex | AC-T2 可被不完整迁入通过：未核对 `skill-bundle.json`，且把 docs 说成 7 项而实际是 6 文件 + `adr/` + `archive/` | `fixed` | 成立。新增 D-045（必建 `skill-bundle.json`，`run-checks.mjs:107` 逐技能校验）；AC-T2 逐项列出 8 项 docs 与 `skill-bundle.json`，判定阈值改五项 |
| F-13 | major | red / codex | AC-45 要求删已证明重复才通过，但材料未确立任何合格重复，写入量下降无达标路径 | `fixed` | 成立（与 F-03/F-09 同根因）。D-046 确立真冗余落点；AC-45 补 `inconclusive` 出口 |
| F-14 | major | blue / kimi | AC-45 三处目录都要求修前/修后数字，但基线只固定在 `quality/reviews/` 一处，另两处无法判定 | `fixed` | 成立。AC-45 度量扩为四处并逐处标注「轮次 + 目录 + 时间窗」 |
| F-15 | major | blue / kimi | 母 PRD 六组改动与 D-044 契约改写都无验收节与命令 | `fixed` | 成立（与 F-07/F-23 同根因）。新增 AC-T4 覆盖两者 |
| F-16 | minor | blue / kimi | detail 第三轮处置计数与表不符：写 `fixed` 21/`rejected_invalid` 7（合计 28），表中 29 行实为 20/9，括注漏 F-26 | `fixed` | 成立。计数行更正为 `fixed` 20 / `rejected_invalid` 9 并补 F-26 |
| F-17 | minor | blue / kimi | 追溯链 N-003/N-004 仍标 open/pending，grill 矩阵两行仍挂「待问 1/2」缺口，均已在同节被裁定 | `fixed` | 成立。N-003/N-004 置 `closed`/`verified`；grill 矩阵 `data_or_state` 与 `success_failure_acceptance` 两行改为完整并注明消解依据 |
| F-18 | minor | blue / kimi | 「范围」列出新建 `skill-bundle.json`，但无决定、无验收、无 M 归属 | `fixed` | 成立（与 F-12/F-24 同根因）。D-045 补决定来源与验收，归属 M1 |
| F-19 | major | blue / antigravity | AC-45 把多步审查输出列为待删冗余，与 provider-protocol 保留过程事实的要求冲突 | `fixed` | 成立（与 F-03/F-09/F-13 同根因）。同 F-09 处置 |
| F-20 | major | blue / antigravity | AC-60 把 provider 超时样本映射为「复验范围等于受影响 file/case 集合」，混淆调度定向重派与代码修复影响范围两个分支 | `fixed` | 成立。AC-60 复验命令拆为调度分支 A/B/C 与代码复验分支各一条独立命令 |
| F-21 | major | blue / antigravity | M4（32 测试改写挂全量回归）缺独立验收准则与量化门槛 | `fixed` | 成立。新增 AC-T3：专用命令 32 全通、`pnpm test:skills` 与 `npx vitest run` 均扫到、既有回归不新增红 |
| F-22 | major | blue / antigravity | D-044 删掉 600000 ms 固定截止后未定义替代的防卡死与清理边界，存在永久挂起风险 | `fixed` | 成立。AC-T4 要求契约写明替代收场边界（显式取消 + ownerloss guardian）；D-044 已注明不靠固定墙钟截止 |
| F-23 | major | blue / codex | 清单漏两项已批准文档交付：母 PRD 同步（D-042）与 `provider-protocol.md` 去固定截止（D-044） | `fixed` | 成立（与 F-07/F-15 同根因）。同 F-15 处置 |
| F-24 | major | blue / codex | AC-T2 漏 `skill-bundle.json` 且 docs 项数与 D-036 不符，部分迁入可通过 | `fixed` | 成立（与 F-12 同根因）。同 F-12 处置 |
| F-25 | major | blue / codex | AC-62 可通过而不核对工作包输入/写集/owner/完成证据/成本假设，停滞分支也缺带成本选项与降低未变化轮询 | `fixed` | 成立。AC-62 行为、度量、阈值、命令四处补齐五项字段与停滞/进展两分支 |
| F-26 | major | blue / codex | AC-59 只要求「分类合计不超过总跨度」，遗漏区间可静默通过，且无重叠归属规则 | `fixed` | 成立。AC-59 补归属顺序（平台中断 → 人工等待 → provider → 工具/子代理 → 未归因）与「每区间恰好一次」的核对方式 |
| F-27 | minor | blue / codex | 「不新建准备命令」约束引 D-014/D-015，二者与本题无关 | `fixed` | 成立。改引母 FR-60 / 本卡 R-007 与母 `prd.md:489`、D-024，并注明原引有误 |

**计数**：`fixed` 26 / `rejected_invalid` 0 / `accepted_risk` 0 / `needs_human` 0（唯一一项 F-01 已由 D-047 处置并经用户 m01668 确认）。本轮**无重复计数**——27 条虽集中在两个同根因（FR-45 冗余落点、两份文档交付项验收），但每条各自指出不同的缺失面，故不判重复。

**F-01 详述（detail 第四轮；已裁决为 D-047，用户 m01668 已确认）**

细节审查指出：D-031 把 FR-46 的验证对象改成「真实派发行为」后，AC-46 只剩「调用次数/派发次数/人工等待/进程数/文件数/字节量」这类事件计数，**没有任何阈值能回答母 PRD 的原论断「主会话只派发与回收」是否成立**，而 D-004/D-031 的裁定链里也没有登记这处覆盖缺口。该判断成立：母 `prd.md:488` 原句写「④主会话只派发与回收(由 CARD-03 承接,本卡验证其效果)」，而承接方已被 CARD-06 删除（D-031 已记录），论断的「效果」在 CARD-03 落点消失后本就无可比对象。处置＝D-047（用户 m01668 逐字答复「A 不设阈值，如实登记『已收窄为事件计数』」）：该论断**不作为验收通过条件**，只在材料中如实登记为「已收窄为真实派发行为的事件计数，论断本身不设阈值」。

**F-03/F-09/F-13/F-19 详述（detail 第四轮；同一根因，已裁决为 D-046）**

四条独立审查方从不同角度指向同一处：AC-45 把「多步路径的无引用孤儿输出」当作唯一可删真冗余。实测推翻该前提——`skills/wh-review/contracts/provider-protocol.md:39` 逐字写「内部重建/揭示输出保存为原始过程事实，只有最后挑战的 findings 是该请求的一个语义结果」，故各步输出**内容不同且契约要求保留**；`simple-review-runner.mjs:1453 item.raw_output_ref = refs[0] ?? null` 只保留第一个引用是**引用不完整**（可作改进项登记），不是可删冗余。D-046 因此把真冗余落点改为「审查请求文件里逐字内嵌的整份 `approved_direction`（＝`decision-log.md` 全文）与已落盘交付件重复」——同一内容写两处，实测本卡 5 个请求文件合计 458 KB、内嵌材料约 550 KB；处置方式已由用户 m01668 选定为「材料按路径引用、不再抄一遍」。

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
- 修前/修后两次量测的原件与复算路径（D-014、D-035）：**已收口**——原件为会话日志与 `quality/reviews/*.json`，复算路径为 `zstd -dc` 解析会话日志与读取结果 JSON 的 `provider_results[].timing`。
- 迁移表来源的救活方式（见 OPEN-009）：**已收口**——D-033 裁定改检查从归档位置读。
- 外挂工具 32 个测试的测试入口命令（D-019）：**已收口**——D-034 改写为主仓 Vitest 写法、D-037 挂进全量回归并保留一条专用命令。

## 最终确认

### 给用户看的确认页（approve-decision 展示内容）

**一句话**：这张卡要做的事是——把外挂审查工具正式搬进本仓技能目录，顺手修好两个本来就红的检查、补上孤儿进程回收的测试覆盖、把审查材料重复写一遍的地方改成按路径引用；同时把「一个改进任务的时间到底花在哪」做成可现场复算的四项证据。**不做**限制并发、不测温度/风扇、不新增报告文件。

#### 1. 要解决的问题（`## 问题`）

六条，逐条对原件：①资源高基线（只留孤儿回收与写入量下降）；②审查期资源峰值（母要求的「限制并发」已被用户撤销）；③交付耗时长且不可解释（缺同口径耗时分账）；④审查链的孤儿进程与重复写入；⑤「主会话只派发与回收」无据（承接方已被 CARD-06 删除）；⑥耗时分账口径本身不可复算（且不得落派生报告）。

#### 2. 目标与边界（`## 目标`、`## 成功/失败边界`）

- 目标：让「时间花在哪、为什么反复返工」**可现场复算、可验证**；顺手收掉孤儿进程与重复读写。
- 不做：限制审查并发 provider 数；CPU%/温度/风扇读数验收；环境层四项（Spotlight、重启、后台守护、worktree 清理，依赖用户动作）；不新增 public command/stage/持久对象/永久遥测/调度器/progress trace/checkpoint permit；不新增「时间分账报告」类派生文件。

#### 3. 怎么做（`## 方案（实施面）`）

7 个工作包 → 2 个实施 Phase：**资源组**＝M1 整仓迁入（外仓 v4.0.0 / 基线 `97132960` 搬进 `skills/third-review/`，含测试与 docs，必建 `skill-bundle.json`）→ M2 宿主配置改指 → M3 救活两个本来就红的检查 → M4 外仓 32 个测试改写为主仓 Vitest 写法并挂全量回归 → M5 补孤儿回收覆盖测试（实现已在）→ M6 写入量真冗余合并（材料按路径引用）；**效率组**＝M7 效率四项（耗时分账、失败来源定向处理、短导航、受控取消）。M8 母 PRD 六组改动按 D-042 在 build-plan 阶段先落笔并提交 main。

#### 4. 怎么算通过（`## 验收面`）

- 母 AC-43（孤儿回收，五项度量含进程残留与附件路径独立断言）、AC-45（写入量，四处统计 + 无可合并冗余记 `inconclusive`）、AC-46（六项度量逐项标原件）、AC-51（与 AC-46 共享同一次采集）、AC-59（耗时分账，真算一次并当场展示，含平台/安全中断独立分类与区间并集核对）、AC-60/61/62（三条反例样本命令）。
- 本卡新增 AC-T1（开工前对齐）、AC-T2（迁入范围/版本来源/宿主配置解析/skill-bundle.json）、AC-T3（32 测试全通且零回归）、AC-T4（两份文档交付项：母 PRD 六组改动 + `provider-protocol.md` 去固定截止）。
- 已删除：AC-44（随 FR-44 撤销）。AC-51 收窄为只挂 FR-46 的确定性计数。

#### 5. 风险与未决（`## 风险与延期交接`、`## 未决项`）

- 11 条风险逐条有 owner 与触发条件（如：写入量落点若不可改则按 AC-45 记 `inconclusive`，不记 fail、不写成改善；M2 回滚按三文件清单整体回退）。
- 11 条 OPEN：已消解 6 条（D-002、close 证据已核、以母 PRD 为准、D-032、D-033、D-026），保持 open 5 条（段落级写集与采样口径留 build-plan，母材料缺口只登记不代编，行号漂移改按标题定位）。

#### 6. 审查怎么处置的（`## 审查处置`）

四轮审查共 **97 条**发现；其中 **78 条有逐条处置表**并已落到本文件与验收面，**第一轮 19 条无逐条处置表**（该轮不是干净盲审，按 `## 审查处置` 自身声明只作过程记录、不作方向收敛依据）：

| 轮次 | 原件 | 发现数 | 逐条计数 |
| --- | --- | --- | --- |
| direction 第一轮（非干净盲审，D-028；**已作废**） | `quality/reviews/2026-10-04-020-make-decision-direction.json` | 19 | 未逐条处置（该轮作废，只作过程记录） |
| direction 第二轮（干净重跑） | `quality/reviews/2026-10-04-027-make-decision-direction.json` | 22 | `fixed` 14 / `rejected_invalid` 6 / `accepted_risk` 2 |
| detail 第三轮 | `quality/reviews/2026-10-04-035-make-decision-detail.json` | 29 | `fixed` 20 / `rejected_invalid` 9 |
| detail 第四轮 | `quality/reviews/2026-10-04-042-make-decision-detail.json` | 27 | `fixed` 26 / `needs_human` 1（该 1 项已由用户 m01668 裁定 → D-047，故终态无 `needs_human`） |
| **合计** | 四轮 | **97** | **有处置表 78 条：`fixed` 60 / `rejected_invalid` 15 / `accepted_risk` 2 / `needs_human` 1（已由 D-047 裁定 → 终态 0）；另 19 条无逐条处置表（第一轮已作废）** |

需用户拍板的真问题已由用户裁定为 D-031、D-043、D-044、D-046、D-047。**按 D-048 不再重交复审**（第五轮请求 `2026-10-04-006` 已主动中止，其 provider 输出只是过程事实）。

#### 7. 本阶段决定一览

48 条（D-001..D-048），按轴分组：范围撤销与收敛（D-001、D-022、D-023）、验收口径（D-004、D-011、D-014、D-023、D-035、D-039、D-040、D-046、D-047）、落地与归属（D-002、D-003、D-006、D-010、D-017、D-018、D-032..D-037、D-041、D-045）、非目标与克制（D-013、D-024、D-025）、审查链运输修复（D-027、D-028、D-030、D-044、D-048）、一致性准备（D-007、D-008、D-012、D-026、D-029、D-031、D-038、D-042、D-043）。

### 确认状态

**已确认（用户 m01988）**。用户逐字答复：「确认，继续，收口当前阶段，不要开build-plan」——即：确认本决策稿（方向、范围、方案、验收面、风险与未决项、审查处置）成立，继续收口 make-decision 阶段（stage-end-spec-analyze 与 stage-handoff），**但不要开 build-plan**。

确认原件：`quality/evidence/human-confirmations/2026-10-04-005-make-decision-card09-make-decision-approve.json`（`confirm --action=decision` 已记录，HEAD 读 Git＝`cf51f5d3fbad8d553c802b543bef67ae827a8f79`）。本节的展示内容与「## 目标」「## 验收面」「## 方案（实施面）」「## 风险与延期交接」「## 未决项」「## 审查处置」逐条对应。

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

- 与 CARD-05 的审查基建共享写面与集成责任（母 `prd.md:515`/`:516`，SD-14＝先冻结接口一方为集成责任方）：母卡要求与 CARD-05 **错时或分面合并**，仅独立文件可同时写。**已核**：CARD-05 已 `close`（@2026-09-26T05:05:37.721Z，见兄弟卡状态表），本卡开工时该卡已结束，故**实际并行写冲突风险已消解**；SD-14 的归属规则仍登记在此，若 build-code 期间出现与 CARD-05 遗留文件的重叠写面，按 SD-14 由先冻结接口一方承担集成。 **owner**＝build-plan（冻结写集时核对）；**触发条件**＝写集与 CARD-05 遗留文件重叠；**处置**＝错时合并或由本卡承担集成，并在 spec.md 写明。

- 外挂工具搬迁可能打断主仓现有审查链：宿主配置只改一行（`third_review.command[1]`），必要时按该行回滚（D-002、D-003）。 **owner**＝build-code 资源组（M1/M2 实施者）；**触发条件**＝迁入后 `node tools/cli/run-checks.mjs` 或既有审查回归出现新红；**处置**＝按宿主配置行 `third_review.command[1]` 与文件清单回滚。
- 两个失效检查的救活方式已定（D-033）：改检查从归档位置读；连带影响 12 个 worktree 中全部缺失该目录的现状，需在 build-plan 定改动范围与回归方式。 **owner**＝build-plan（定改动范围与回归方式）→ build-code（M3 实施）；**触发条件**＝build-plan 冻结写集时发现影响面超出两个测试文件；**处置**＝只改这两个检查的读路径，不复制归档表。
- 写入量基线的可复现条件待定：采样命令、采样时长、判定阈值留 build-plan（OPEN-010）。 **owner**＝build-plan（定采样口径）→ verify-code（执行并出数）；**触发条件**＝build-plan 结束时仍无可用采样命令；**处置**＝按 D-011/D-014 现场采一次并把原始输出存成任务证据，采不到即记 `inconclusive`。
- CARD-08 与 CARD-03 已 close，六份文件（`skills/stage-handoff/SKILL.md` 与五份 `workflows/*/SKILL.md`）现为已冻结既有内容，不再是「在途写集」：本卡只承担「不要改这六份」的约束，仍须在 build-plan 冻结本卡自身写集与段落 owner（OPEN-003）。 **owner**＝build-plan（冻结本卡自身段落级写集）；**触发条件**＝本卡工作包写集与这六份文件相交；**处置**＝改为只对齐不改写，相交部分让给既有 owner。
- FR-46 的验证对象已裁定为真实派发行为（D-031）：CARD-03 的派发方法落点已被 CARD-06 按迁移表删除，只剩 `AGENTS.md:14-19` 治理文字与真实派发行为（审查处置 F-01）。 **owner**＝verify-code（出事件计数）；**触发条件**＝会话日志元数据不可得或口径与既有原件冲突；**处置**＝按 D-040 只读元数据，取不到就如实记 `inconclusive`。
- 本轮方向审查的 reveal 步无候选方向可揭示，challenge 步挑战空包：22 条只作材料核对，不作方向收敛依据（D-028、D-030；审查处置 F-18）。 **owner**＝本卡主会话（已在「## 审查处置」登记）；**触发条件**＝后续阶段以该轮结论作为方向依据；**处置**＝按 D-030 不作为方向收敛依据。
- 母卡原始需求本身含方案（四项产品干预与验收），独立重建在信息上不干净：结构性限制，接受并登记（审查处置 F-07）。 **owner**＝本卡主会话（已登记）；**触发条件**＝以「重建」环节单独证明方向独立性；**处置**＝只以 reveal→challenge 两步与材料交叉核对作证据。
- 母卡范围句与本卡已授权范围口径差：须随 D-007 的母 PRD 一次性修改同步补入整仓搬迁范围（D-029）；按 D-042 改为在 build-plan 阶段先落笔并提交 main。 **owner**＝build-plan（母 PRD 修改者，D-042）；**触发条件**＝build-plan 阶段末母 `prd.md` 仍未同步；**处置**＝按 AC-T4 断言并补改后提交 main。
- 写入量验收的可达标性风险（detail 第四轮 F-03/F-09/F-13/F-19）：第三轮设定的唯一真冗余候选（多步路径无引用孤儿输出）经实测**不成立**——`provider-protocol.md:39` 要求保留内部重建/揭示输出，各步内容不同。D-046 已改指「请求文件内嵌整份材料与已落盘交付件重复」这一处真冗余；若该落点最终被判定不可改（例如审查入口必须内嵌材料），AC-45 按「无可合并冗余」记 `inconclusive`，不记 fail、也不写成改善。 **owner**＝build-code 资源组（M6 实施者）→ verify-code（出修前/修后文件数与字节数）；**触发条件**＝该落点被判定不可改（例如审查入口必须内嵌材料）；**处置**＝按 AC-45 记 `inconclusive`，不记 fail、也不写成改善。
- M2 宿主配置改指的改动面风险（detail 第四轮 F-11）：不是「只改一行」——涉及 `skills/wh-review/scripts/third-review-host-config.mjs`、`runtime/review/ocr-delegation-adapter.mjs`、`runtime/review/review-packet-identity.mjs` 三个运行时文件与宿主配置；回滚需按文件清单回退，不能只回退配置行。 **owner**＝build-code 资源组（M2 实施者）；**触发条件**＝改指后宿主配置解析或 provider 白名单报错；**处置**＝按 `skills/wh-review/scripts/third-review-host-config.mjs`、`runtime/review/ocr-delegation-adapter.mjs`、`runtime/review/review-packet-identity.mjs` 三文件清单整体回退。

### 质量边界

CARD-09 负责新增验收事实，CARD-10 仅沿既有存在性输入与用户抽验通路消费，不增总体套件用例（`prd.md:163`、`prd.md:510`）。可靠前后基线不足时，收益为 inconclusive，不编造改善数字（`prd.md:505`、`prd.md:510`）。

## 未决项

| item_id | 未决内容 | 原因 | 谁在何时解决 | 状态 |
| --- | --- | --- | --- | --- |
| OPEN-001 | FR-43「broker 回收孤儿 manager/provider（含先解除 broker 自写只读目录）」的落点未定：broker/manager 实现不在主仓，位于第二仓 `/Users/Hugh/Hugh/Project/3rd-review`（package `3rd-review` 4.0.0），而主仓 provider 侧已走 native transport | 本步骤只读核实主仓无 `3rd-review/` 目录；孤儿回收应落在哪个真实路径，需先确认 3rd-review 是否仍被生产调用（`prd.md:492`、`decision-log.md:897`、`decision-log.md:907`） | 本卡主会话（已登记）：**已消解**：用户决定整仓迁入 `skills/third-review/`（D-002），落点不再待定 | **已消解（D-002）** |
| OPEN-002 | 修复前「同口径资源/耗时基线」是否可复现：AC-51 要求同一工作负载（同一审查任务、相同输入规模）前后对比 CPU% 与 thermal pressure（或风扇转速），AC-59 要求 CARD-06 同类原始时间戳及一组重叠工具/provider 样本可复算 | 母材料只留 2026-09-19 的一次性实测数字（`decision-log.md:896-919`），未见可重放的固定负载或采样脚本；母材料自述「无法复现同负载时如实记 inconclusive 并写明原因,不编造改善数字」（`prd.md:505`、`prd.md:510`）。**保持 open**：写入量基线已决定先采真基线（D-011），但热指标基线已随 D-001/D-023 撤销，剩下写入量与进程数两类基线的可复现条件留 build-plan | 需 build-plan 在开工前确定采样命令、采样时长与判定阈值；不可复现时由 CARD-09 报告/测量责任人按 inconclusive 登记（`prd.md:517`） | **保持 open** |
| OPEN-003 | CARD-09 段落级写集尚未冻结：CARD-08 侧明确要求本卡 build-plan 补段落 owner/读集/写集与串行合并责任（`prd.md:515`、`prd.md:522`、`card09-duration-amendment.md:57`）；重叠面为五份 `workflows/{make-decision,build-prd,build-plan,build-code,verify-code}/SKILL.md`，与 CARD-03 已完成写集、CARD-08 P2 在途写集三方同名 | 本步骤只读核实 CARD-08 未来实施写集含 `skills/stage-handoff/SKILL.md` 与上述五份 workflow SKILL.md（归档 `specs/archive/workflowhub-thin-core-card-08-20260919/spec.md:390`），且其 `spec.md:393` 明写「CARD-09 当前没有已冻结实施写集，不声称已可安全并行」 | build-plan 冻结本卡段落级写集、owner 与串行合并责任（本卡写集，不含那六份已冻结文件）；同文件禁止两个 agent 同时写（`prd.md:515`） | **保持 open（已降级）** |
| OPEN-004 | CARD-06 仍在途（外置 facts 尾行 `stage=verify-code`，2026-10-04T05:12:35.283Z）：其删除面若再次变动，AC-45 的「材料与证据写入量」前后对比基线可能失效 | 本步骤只读核实 CARD-06 facts 尾行为 verify-code；其代码删除已合入 main 提交 `457299b3`、`e4da5664`（git log 核实）。CARD-09 与 CARD-06 共享「材料证据写入面」（`prd.md:516`） | 本卡主会话（已核实）：**已消解**：实测确认 CARD-06 已按标准 close 收口（close 证据 `2026-10-04-001-close-plan.json` 与 `002..005-close-action.json`，`git-authorizations` 有 `026-authorize-archive`→`031-consumed-cleanup`，`head: e4da5664d1e59780e79b8e9deb98aa213b6d2c2d`），删除面已冻结 | **已消解（close 证据已核）** |
| OPEN-005 | 母 decision-log「仍待实施的优化（属产品改动）」一节正文为空：`decision-log.md:936` 为标题行 `**仍待实施的优化**（属产品改动）：`，其后至 `decision-log.md:938` 无内容 | 本步骤逐行只读核实，属材料缺口 | 本卡主会话（只登记不代编内容）：母 decision-log 该节正文为空是母材料缺口，本卡不补写、不代编，留 build-plan 按需引用 | **保持 open** |
| OPEN-006 | 母材料行号漂移：`prd.md:518` 引用「decision-log OI-011(L380-399)」与「L811-859(CPU 与温度诊断)」，`prd.md:521` 引用「L826-830(已执行缓解)」；当前 `decision-log.md` 的实际位置是 OI-011 在 `decision-log.md:397-416`、CPU 与温度诊断节在 `decision-log.md:890-937`、已执行三项缓解在 `decision-log.md:905-909` | 本步骤逐节只读比对；漂移原因未查（母材料只读，本卡不改写） | 本卡主会话（已实测并登记）：引用一律按标题定位，不按行号；母材料只读，本卡不改写 | **保持 open** |
| OPEN-007 | 增补草案自述状态与母 PRD 已内联授权不一致：`card09-duration-amendment.md:3` 写「尚非已确认产品决定」，而 `prd.md:25`、`prd.md:688-692` 已按用户授权把增补内联进 CARD-09 并记为 R-021 | 本步骤只读核实两处文本均在；授权原话见 V-001/V-002 | 本卡主会话（已登记）：**已消解**：以母 PRD 为准 | **已消解（以母 PRD 为准）** |
| OPEN-008 | （新）外仓搬迁后的版本可追溯性：只搬代码不搬 Git 历史，基线为 `97132960` / v4.0.0 | 搬迁后如何在仓内记录该基线（`SKILL.md` 来源行 / `skills/catalog.yaml` 条目 / `docs/architecture/move-map.json` 条目）留 build-plan | 已由用户 m01240 选定并落为 D-032（build-code M1 实施：写在 `skills/third-review/SKILL.md` 来源行，记 v4.0.0 与基线 `97132960`） | **已消解（D-032）** |
| OPEN-009 | （新）两个失效检查的迁移表来源：救活方式（把归档表复制到检查要找的位置 vs 改检查从归档位置读）留 build-plan | 归档区是只读保留区，需要用户对「是否在归档区之外新增一份表副本」做最终确认 | 已由用户 m01240 选定并落为 D-033（build-code M3 实施：改检查从归档位置读，不在归档区之外新增副本） | **已消解（D-033）** |
| OPEN-010 | （新）写入量与进程数的真基线采集时机：已定「开工前先采一次」，具体采样命令、采样时长、判定阈值留 build-plan | 采样口径会决定基线是否可复现 | 需 build-plan 定采样命令与阈值（D-011、D-014）；本卡阶段内不新增采样口径决定 | **保持 open** |
| OPEN-011 | （新）CARD-08 交付后的技能元数据漂移：`skills/reuse-registry.md:56`、`skills/catalog.yaml:88-100`、`repo-skills.manifest.json:21-34` 仍写「固定名 + 原子覆盖 + 四个 authoring stage / 不挂载 verify-code」，与已交付的 `skills/stage-handoff/SKILL.md`（create-only 不可变发布、五阶段含 verify-code）矛盾 | 2026-10-04 用户 m00799 告知 CARD-08 已完成后复核发现；CARD-08 写集与验收均未覆盖这三个元数据文件。`tests/contract/ui-skill-contract.test.mjs:188-199` 只断言条目与名字存在、**不校验描述内容**，故漂移静默不报错 | 本卡主会话（已完成）：三处已按交付方法改写并提交 main `9a033b81`；`skills/catalog.yaml` 的 `metrics_enabled` 一并由 `true` 对齐为 `false`（与 `repo-skills.manifest.json` 一致）。本卡不把该修正当需求承接，只登记「已修」 | **已消解（D-026）** |

## 退役登记（retirement）

本阶段无退役事项。

- D-001/D-022 撤销的是母材料中的要求（FR-44/AC-44 与产品层第②项），不修改母材料本体，只在本卡登记。
- D-023 撤销的是母 AC-51 的热采样验收写法。
- 已退役的「全 Phase 集成审查」不在本卡重跑或恢复（非目标）。

## Supersedes（被替代记录）

本阶段无对既有记录或文件的 Supersedes 事项。

- D-001/D-022 的撤销在本文件内登记，不重写母材料、不复制成第二份方向正文；母材料保留原句只作历史记录。

## Append-only 更正（只追加）

本阶段有五条更正（append-only 语义下追记，不重写历史行）。

- D-001/D-022 的撤销已在「## 决定」「## 拒绝方案」登记，此处不重复记录。
- **更正 1（2026-10-04，detail 第四轮 F-04）**：D-027 的状态列原写「已实施（未提交，本卡工作树内 5 文件 56+/90−）」，与 D-044 行、F-22 处置引用的提交 `cf51f5d3` 矛盾。实际状态为**已实施并已提交**：`cf51f5d3 fix(review): remove fixed host deadline and restore managed document review`，父提交 `e78c0e41`，5 文件 56+/90−（`runtime/review/ocr-delegation-adapter.mjs`、`skills/wh-review/scripts/review-provider-client.mjs`、`skills/wh-review/scripts/simple-review-runner.mjs`、`tools/cli/stage-runtime.mjs`、`tests/contract/ocr-ac006-011-experiments.test.mjs`）＋新增 `specs/workflowhub-thin-core-card-09-20260919/decision-log.md`。D-027 状态列已同步改正。
- **更正 2（2026-10-04，detail 第四轮 F-16）**：detail 第三轮的计数行原写 `fixed` 21 / `rejected_invalid` 7（合计 28，与表中 29 行不符），括注列 8 个编号却称「7 条」且漏 F-26。已更正为 `fixed` 20 / `rejected_invalid` 9（补入 F-26）。
- **更正 3（2026-10-04，make-decision 步骤 11 `stage-end-spec-analyze` 的只读一致性核对，9 条发现）**：用户 m01988 确认后，只读核对发现「`## 审查处置` 处置行声称已改的文字有 10 处未落到 `## 验收面` 正文」，另 8 条为定义节缺失、计数口径与路径错误。已全部修复，**未改变任何决定**（D-001..D-048 一条未动）：AC-45 条件/度量改四处统计并补 `inconclusive` 出口；AC-59 补「于既有阶段人读对账时点执行」、会话日志元数据路径与解析字段、归属顺序与「每区间恰好归属一次」；AC-60 复验命令拆为调度分支 A/B/C 与代码复验分支 D，样本扩为四个（含空 findings 反例）；AC-61 移除准备检查时序要求（源自已判 `rejected_invalid` 的 F-14）并改引母 FR-60 / 本卡 R-007 与母 `prd.md:489`、D-024；AC-62 补逐包五项字段（输入/写集/owner/完成证据/成本假设）与暂停-取消两条路径；AC-T2 改为 8 项 docs + 必建 `skill-bundle.json`、阈值五项；**新增 `#### AC-T3`、`#### AC-T4` 两节**（原被 8 处引用却无定义）；四轮计数表按实算更正为「有处置表 78 条：`fixed` 60 / `rejected_invalid` 15 / `accepted_risk` 2 / `needs_human` 1（已裁定），另第一轮 19 条无逐条处置表（该轮作废）」；`:232` 的 `card06-duration-rootcause.md` 路径改为主仓 card-08 归档（与 `:70` 一致）；AC-45 损坏的代码引文改为 fenced block；M7 验收列补挂 AC-46/AC-51；风险节补 CARD-05 写面与 SD-14 集成责任一条（风险 10 → 11 条）；`## 原始需求` 表关联列补口径说明。**用户确认仍成立**：修复只是把处置行已声称的验收文字落到正文，方向、范围、验收标准与风险边界均未变化；未开 build-plan（用户 m01988）。
- 本文件第 1–180 行的既有内容（任务身份、原始需求、需求变更记录、原始需求索引、逐字声明层、原始声明层、三级追溯链、唯一 OI 大纲）除新增 U-003/U-004/U-005 与已标注的 OI 消解外，未作改写。
- **更正 4（2026-10-04，build-plan spec-clarify）**：build-plan 两份调研（`quality/evidence/execution-inputs/2026-10-04-007-card09-build-plan-research-efficiency.md`、`2026-10-04-008-card09-build-plan-research-resource.md`）与实读发现三处事实陈述需更正，**未改变任何决定**（D-001..D-048 一条未动），旧文字原样保留：①计数分母（C-01）：`:335` 的「人工等待 1.13 h（占总时长 2.1%）」分母是会话创建以来约 54.78 h；按实际工作时段（seed 之后 2026-10-04T08:57:17Z 至 14:45:49Z，共 5.809 h，来源会话 `session-1d132d33-02a2-4656-870e-27b9dd3812c3`）人工等待为 1.217 h，占 20.94%。两种分母都登记，不设阈值（D-047），后续计数一律写明时间窗起止与来源会话。②M2 落点（C-04）：主仓代码零处写死外仓路径，`third-review-host-config.mjs`、`ocr-delegation-adapter.mjs` 不需改，`runtime/review/review-packet-identity.mjs:155` 只是注释；真正需改指的是仓外 `~/.config/workflowhub/config.json` 的 `third_review.command[1]`（执行点 `skills/wh-review/scripts/review-provider-client.mjs:1266`），在本卡合入 main 后经用户明确确认再改；`:951` 风险 ⑪ 的三文件回滚清单据此只剩注释与两份 ADR 文字。③M6 落点（C-07）：真冗余为 `quality/evidence/execution-inputs/` 下审查请求 JSON 内嵌同目录 `.md` 原件（sha256 已比对；5 个请求文件共 637204 B，`:847` 的「458 KB / 约 550 KB」为旧估计）；`approved_direction` 是提交时快照，与当前 decision-log 不同位置，不算真冗余；改点在 `tools/cli/stage-runtime.mjs` 的请求输入解析（`:595-607`、`:896-900`），材料可写 `{ "ref": "<路径>" }` 并读回原字节，provider 只读隔离副本与多步过程输出保留。
- **更正 5（2026-10-04，build-plan final-spec-analyze）**：核对原件 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-09-20260919/quality/tests/2026-10-04-002-card09-build-plan-final-spec-analyze.md` 的 m4、m9 两处事实陈述需更正，**未改变任何决定**（D-001..D-048 一条未动），旧文字原样保留：①M4 写集（m4）：`## 方案（实施面）` M4 行落点列仍列 `vitest.config.mjs`；D-037 已取代 D-034 的 exclude 做法，`spec.md` PFACT-004 实读确认 Vitest 默认 include 已覆盖 `skills/**/*.test.mjs`，无需改配置，`phases/P1.md` 契约头写入集不含 `vitest.config.mjs` 且禁止改动段明列该文件。M4 写集以 `spec.md` 与 `phases/P1.md` 为准：`skills/third-review/test/**`、`package.json`（根只加 `test:third-review`）与 `skills/third-review/package.json`，不改 `vitest.config.mjs`。②D-036 计数（m9）：D-036 方案列与事实依据列写 `docs/`「7 项」，但所列名称为 8 个（6 个文件 + `adr/`、`archive/` 两个目录）；外仓 `docs/` 实测 8 项，以 8 项为准，与 `spec.md` AC-T2 ①、`phases/P1.md` T001 一致。

## 文档结果

本文件由 make-decision 步骤 1（load-context）落笔，后续 Talk/Grill/调研/审查/确认按阶段回填。

- CONTEXT.md：本阶段不需要更新术语。理由：本轮决定全部落在既有材料与既有术语内（资源三项、效率四项、技能目录、审查并发），未引入新概念；且 D-013/D-024 明确禁止新增派生文件与报告类产物，无新增术语需要登记。
- ADR：本阶段不需要新增 ADR。理由：本阶段 48 条决定（D-001..D-048）全部是需求范围撤销/收敛、验收口径修正、审查链运输缺陷修复与母卡口径同步，已在本文件「## 决定」逐条登记；未触及需要独立 ADR 的架构选型（不新增 public command、stage、持久对象、永久遥测、调度器、progress trace 或 checkpoint permit，见 D-024）。
- ADR 判据：母 `prd.md:489` 的窄范围句已限定只窄改现有报告方法、review caller/组包/parser、host 委派方法及 owned-process 取消路径，未达 ADR 触发条件。
- 术语/ADR 冲突及处理：无冲突。本文件 `R-001..R-008` 是本卡局部 source_id，与母 `prd.md:139-163` 全局追踪表的 R-001..R-021 不是同一套编号，已在「## 原始需求」说明；本轮不新增编号体系。
- 不复制 spec 的边界：本文件只登记需求与决定，不复制 spec 正文；原始用户声明、调研原文与已确认事实只在「## 原始声明层」保留可回读引用。
- 六面结构就位（工作流步骤 2 要求「在同一决策日志整理背景、问题、目标、方案、验收、扩展」）：背景＝「## 原始需求」「## 原始声明层」「## 调研」；问题＝「## 问题」（新增，六个具体问题逐条对原件与处置）；目标＝「## 目标」；方案＝「## 方案（实施面）」（新增，7 包 → 2 Phase 表）；验收＝「## 验收面」（新增）；扩展＝「## 风险与延期交接」「## 未决项」「## 非目标」。每项均可沿「原始用户故事/初始需求 → 原始需求或调研 → ADR 决定」回读。
- 验收面落点：验收标准不再另立文件，直接并入本文件「## 验收面」一节（原工作件 `acceptance-draft.md` 已删除）——工作流步骤 2 要求「在同一决策日志整理背景、问题、目标、方案、验收、扩展」，且本文件就是 detail 轨送审的 `approved_direction`，验收面必须在同一份正文内可读。

### Exit checks（退出检查）

- 上下文一致：已通过。本轮所有决定都能沿「原始用户故事/初始需求 → 原始需求或调研 → ADR 决定」回读；新增 U-003/U-004/U-005 与 D-001..D-048 相互引用一致，R-002 的推翻状态已在「## 原始需求索引」与「### 唯一 OI 大纲」同步标注；F-24 回填后 `complete_user_flow` 与 `data_state` 两类由 `empty: true` 改为 `false`，不再以 `non_ui` 为由置空。
- owner/接口一致：已通过。孤儿回收 owner 随整仓迁入落到本卡技能目录（D-002）；FR-46 保留并由本卡做确定性计数验证（D-004），验证对象已裁定为真实派发行为（D-031；CARD-03 的派发方法落点已被 CARD-06 删除，只作历史来源）；母 PRD 修改 owner 改为 build-plan 阶段先落笔并提交 main（D-007、D-029、D-042）。
- 失败语义明确：已通过。失败边界见「## 成功/失败边界」；热采样不可复现即 inconclusive，不编造改善数字；AC-51 新增失败场景「拿采样外推冒充确定性计数」；审查链失败语义见 D-027（provider 只由终止或显式取消结束，不再有固定主机期限）。
- 审查处置明确：已通过。**审查不重交**（D-048，用户 m01954 当面纠正）：direction 轨 2 轮、detail 轨 4 轮已构成全部判断依据，第五轮请求 `2026-10-04-006-card09-detail-review-request.json` 已主动中止（provider 输出 `2026-10-04-043..045` 只是中止前的过程事实，无最终结果文件，不作判断依据）。四轮审查的原始记录、严重度分布与逐条处置见「## 审查处置」，无遗留 needs_human 项（direction 轮唯一一项 F-01 已由用户 m01230 裁定为 D-031；detail 轮唯一一项 F-01 已由用户 m01610 裁定为 D-043）；第一轮 direction 因材料含已定方向不计为干净盲审，第二轮因 reveal 步缺候选方向不计为方向收敛依据（D-028、D-030）；detail 第三轮的 20 条 `fixed` 与第四轮的 26 条 `fixed` 已全部落到「## 验收面」；两轮共 56 条发现的逐条处置见「## 审查处置」（`2026-10-04-035-…` 与 `2026-10-04-042-make-decision-detail.json`）。
- 范围与延期明确：已通过。范围与非目标见「## 范围」「## 非目标」；环境层四项仍在卡外；未决与延期见「## 未决项」OPEN-001..OPEN-011 与「## 风险与延期交接」。

## 2026-10-05 执行政策决定（追加）

| 决定编号 | 决定内容 | 选择依据 | 被拒替代 | 状态 |
| --- | --- | --- | --- | --- |
| D-049 | 已授权任务的 build-code、verify-code 尽可能全自动：实施、针对性验证、独立审查、修复与交付必要的 commit/push/merge 自动执行，不再要求本地提交授权、日常确认、技术验收确认或中间风险承担确认；只最终 close（含归档、任务分支/工作区删除及交付清理）前展示实际结果、质量限制与动作范围，确认一次。真实授权来源、范围、分支、当前 HEAD 与既有 record/consume 工具检查保留。既有方向和实施计划确认不重做，本次原话就是政策选择来源；不能据持续实施授权自行接受严重风险或伪造质量通过。 | 用户逐字原话：「我希望彻底删除总是找我要“授权本地提交”的申请，我希望build-code和verify-code是一个尽可能全自动的流程，除了最终close需要确认，中间不要找我确认！」。原件 ref：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-09-20260919/quality/evidence/sources/2026-10-05-001-automatic-execution-user-request.txt`；sha256：`518e1435f23709db148d074e2a4e677733b51acf1393f29389b614ab9f0b1319`。本次持续授权覆盖本卡合入 main、稳定 checkout 存在后的既定仓外 `~/.config/workflowhub/config.json` `third_review.command[1]` 路径切换：先备份，自动改为 `/Users/Hugh/Hugh/Project/workflowhub/skills/third-review/scripts/3rd-review.mjs`，真实 doctor 失败即恢复备份；AC-T2「改仓外配置未经用户确认」仍失败，本次已有真实授权不要求逐次重复确认。外仓 `/Users/Hugh/Hugh/Project/3rd-review` 原样保留，GitHub archive 本卡不执行。 | 将 authorize 记录工具当提问门，逐次申请本地提交或合入后的既定配置切换；将持续实施授权扩大为风险接受、强推、整树丢弃、任务外配置或 GitHub archive 授权 | 已确认：2026-10-05 用户真实原话；材料定点同步，质量事实另行保留，不宣称本次审查通过 |

本次限定写集（治理路径 8 份 + 当前材料 2 份）：`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`skills/stage-handoff/SKILL.md`、`skills/wh-review/SKILL.md`、`AGENTS.md`、`CONSTITUTION.md`、`constitution-checklist.md`、`docs/standard-workflow.md`；以及 `specs/workflowhub-thin-core-card-09-20260919/spec.md`、本文件 `specs/workflowhub-thin-core-card-09-20260919/decision-log.md`。前 8 份承担自动实施与接续政策；spec 只同步既定配置切换与授权来源；本文件只追加决定。此次政策更正不改 `phases/**`、AC/测试 oracle、旧决定或历史审查原文，不新增 stage、gate、schema、持久对象或第二套进度权威。

## 2026-10-05 文档审查定点修正（追加）

| 决定编号 | 决定内容 | 选择依据 | 被拒替代 | 状态 |
| --- | --- | --- | --- | --- |
| D-050 | 按一次文档审查的有效发现，统一 spec 目标与 P1 T004 的自动改指表述、真实章节链接；合入后切换第 1 步补明主仓稳定 checkout 的 `main` 分支、干净工作树、当前 HEAD 等于已核对的本卡交付提交及实际脚本存在核对。复用既定切换、备份与 doctor 失败回滚方法，不新增 AC、配置 Git grant、stage 或 gate，不改变任务方向与持续授权，不重派审查。 | 文档审查原件 ref：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-09-20260919/quality/reviews/2026-10-05-024-build-plan-document.json`；sha256：`cdd244792b7f58ec476909e7d87aed5b51d9513027d5f2e9168da5125b61a879`。采纳 `pi/v4flash` 对 spec :59/:496 与 P1 :192/:206 的旧人工表述、失效链接发现，以及 `kimi/coding` 对 spec :536 稳定 checkout 核对缺项的有效部分；不采纳新增 AC 的建议。授权沿用 D-049 同一真实用户原话，原件 ref：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-09-20260919/quality/evidence/sources/2026-10-05-001-automatic-execution-user-request.txt`；sha256：`518e1435f23709db148d074e2a4e677733b51acf1393f29389b614ab9f0b1319`，不是新方向确认。 | 恢复中间确认；为旧标题新增 HTML 兼容 alias；扩大到新 AC、测试 oracle、其它 Phase、代码或控制面 | 已落实定点修文；D-049 及旧决定原文保留，审查原件及覆盖限制保留，不推导为全任务验收通过 |

本次限定写集共 4 份：`specs/workflowhub-thin-core-card-09-20260919/spec.md`（目标表述、两处章节链接、第 1 步只读核对与历史 F13/资源结果的当前事实澄清）、`specs/workflowhub-thin-core-card-09-20260919/phases/P1.md`（T004 两处标签/章节链接）、本文件 `specs/workflowhub-thin-core-card-09-20260919/decision-log.md`（只追加 D-050，D-049 及之前 1025 行字节保留）、`workflows/verify-code/SKILL.md`（既有方法第 1 步明确实际 worktree、branch、HEAD、write_set、材料来源核对及通过已有 run-command 保存 quality/tests 原件）。历史 F13 accepted_risk 的真实回复在有限原件内未证实，旧标签保留但当前不用它代填风险接受或质量通过；AC-45/AC-51 资源结果仍 inconclusive，不用目录增量宣称下降。不改 Task 的动作逻辑、AC、测试 oracle、代码边界、其它 Phase 或 index；不新增方向决定、机器 gate 或中间授权确认。
