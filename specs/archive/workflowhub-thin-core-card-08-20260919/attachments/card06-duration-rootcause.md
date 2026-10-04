# CARD-06 长跑根因与 CARD-08/09 承接（2026-10-04）

## 结论

这次慢，核心是工程契约在正式执行时才暴露、审查调用/材料交付缺陷反复返工、协调者把局部失败扩大成整轮，以及材料和上下文导航成本。人工等待与平台中断也占时间。不能把所有跨度归为模型计算，不能把必要缺陷修复全叫浪费。

CARD-06 删除旧引擎降低了控制面复杂度，但没有自动证明实际任务更快或整体质量达标。CARD-08 只能解决接续信息与回读的一部分；CARD-09 原需求主要针对资源/温度，需要补开发耗时和无效返工验收。本轮已合 main 入 CARD-08、形成方案刷新与 CARD-09 草案，没有开始实现或取得新的性能改善。

## 来源与取证边界

当前用户原请求：`quality/evidence/sources/2026-10-04-001-post-card06-request.txt`，sha256 `3c6be81f614bf37833ccbaabe6e0010cf92cd7882b1c3b8ae507e70f1bdb5227`。

两聊天均已通过 `read_thread` 读取，随后独立上下文流式分析实际 rollout 和任务原件，主会话收摘要。以下 JSON 是本次调查的唯一分账/来源核对原件，不复制原始会话、审查或测试输出：

- [B 审计原件](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-08-20260919/quality/evidence/diagnostics/2026-10-04-002-card06-build-duration-audit.json)，sha256 `03e37b4ccb4f8882cfa44055498d9921e59d423423be172ef061eee2c060b92b`。
- [V 审计原件](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-08-20260919/quality/evidence/diagnostics/2026-10-04-004-card06-verify-duration-audit.json)，sha256 `efa03209943b8de65fe997ae59b9fc2c9ccea8ccb5b726838a159c948d2a2d11`。
- [合入后范围核对](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-08-20260919/quality/evidence/diagnostics/2026-10-04-003-card08-postmerge-scope-audit.json)，sha256 `6cfd75d46499024a7a000fbc09ef7b68248e58cd9dc4f7e5d7cadf1853bf2c36`。
- [审查节奏来源核对](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-08-20260919/quality/evidence/diagnostics/2026-10-04-005-review-rhythm-source-readback.json)，sha256 `a4d0be0dd155371ccdbb3453a6c1af93bfd96168bd985c23bf93ed61a71b725f`。

原件 JSON 保留原 path、line/timestamp/hash、计数分母和测量限制。会话日志可能继续追加；hash 标识取证时点，不宣称宿主日志永久静止。未重新调用 provider、跑全量测试、采 CPU/温度或修改宿主权限；未量出精确“浪费了多少小时”、收费 token 或修后速度改善。

## 先把耗时分清

下表按上海时间理解日期，持续时间按原 UTC 时间戳相减。B 的首事件为 10-01 22:25:23，最后 task 事件为 10-03 00:55:17；之后还有少量子代理通知和设置事件，不当成持续开发。V 从 10-03 接续，聊天中还包含交付/close 活动。

| 范围 | 实测 | 含义和限制 |
| --- | --- | --- |
| B 会话首末记录 | 32h32m50s | 不是纯工作时长；末6h03m主要是失败后尾部记录 |
| B 首至最后 task 事件 | 26h29m54s | 包含人工停顿及异步工作 |
| B 15个 turn 包络 | 18h42m29s | 包含采样/思考/工具等待/子代理，不是 CPU 或有效编码时间 |
| V 全聊天跨度 | 32h27m41s | 前17h41m仍在接着做 build-code，不是全程 verify |
| V 正式 verify 请求到收口 | 12h29m19s | 其中人工等待、实际调用和残余需继续分开 |

两个会话记录跨度合看约65小时，超过两天属实；不是两次各有48小时的 provider 运行。V 接续未完成 build-code 的事实很关键：B 是被平台安全策略终止，非交付完成后主动交接。V 后续先完成 P5–P8，才进入终末验证。

V 正式 verify 的互斥分账（优先人工等待，其次 provider 活动，再工具区间）可复算为：

| 类别 | 秒 | 约时长 |
| --- | ---: | --- |
| 明确人工/审批停顿 | 19689.210 | 5h28m09s |
| provider 活动区间并集 | 3418.993 | 56m59s |
| 排除 provider 后的 root 工具区间 | 1780.233 | 29m40s |
| 未归因残余 | 20070.266 | 5h34m30s |
| 合计 | 44958.702 | 12h29m19s |

残余包含未完整计时的子代理工作、采样/思考、协调、嵌套调用与小间隙，不能擅自归为推理或浪费。provider 并发耗时取并集，不把各路相加再叠到工具/turn。B 的审批和 wait 也与子代理工作重叠，因此不把它们加到18h42m之上。

## 可证实的根因

### 1. 冻结计划与真实消费者没有在开工前对齐

B 的冻结 fixture、幸存接口/删除顺序、实际命令和消费者存在错配，实施中反复补计划缺口与 test change request。证据见 B 原件 `root_causes[0]`，对应原 rollout 行418/570/790/1549/3147/6521。修改必要，但在执行时才发现属于准备缺口，不能以“每轮都发现了新问题”掩盖前置设计没有接到真实入口。

P5 又把 producer、schema、普通记录 writer、reader、取消和审查桥接分小步迁移。T019 从12:50:52Z到15:26:34Z约2h35m，其中正式双 provider 文档审查仅21m15s；这个窗口不是全在等模型，也不能与整个 P5 turn 再相加。它包含真实契约修复和验证。

### 2. 审查链的运输/生命周期缺陷把局部问题放大

V 有6份终末代码审查回执：010包冲突未派发；003/006/009/012四次三路整轮；017只补 Kimi/AG。合计14个 provider leaf，7个本地启动前即拒绝。初步摘要里的15/8已在最终去重统计中纠正，最终以14/7为准。

实际故障包括：

- lens/control 与 source 请求冲突，首包在派发前失败。
- 原始 diff 的 `/dev/null` 被错误投影；完整字节与可读呈现/索引引用不一致。
- 实际复制把 `.diff` 改成 `.md`，索引仍指 `.diff`，另有不存在的 change-map。006 原 raw 有6条真实 `ENOENT`。
- code 调用误继承 document 600秒预算。Codex 三次约600秒被终止，012纠正后18m22s正常终末并发现两项问题；fallback 另一入口还残留同类预算，随后又补修。
- Kimi 的工具名筛选被误当路径边界，trust/agent配置假设不符合实际能力，四路在启动前拒绝。
- AG 的 plan/disable-slash 参数冲突、实际只读边界与 `stream-json SUCCESS` 解析不匹配。

证据见 V 原件 V02/V04/V05/V06/V07 的 producer→参数→raw→parser/writer 链，原 `.output`、006诊断、025能力根因、026/027探针及当前源码均有指针。

相关修复已进入 main：`9a603a1e`、`4fcbdfe4`、`cb25df0c` 等。此处只核已有原件和源码，不重新宣称所有能力/业务全覆盖。解除误杀不等于执行变快；当前原生 code lifecycle 不再另设错误文档墙钟，仍需停滞诊断和明确取消，不能恢复同类硬门。

### 3. 执行纪律写了，但协调者没有稳定落实

“一次终末、按受影响集合复验”并非这次才出现。V 审计证明 `77de3608` 的规则早于 V，会话中用户两次纠正审查过多；协调者仍在运输纠正中反复整轮处理，后续承认问题。

需要准确区分：003/006/009没有 Codex 语义终末；012是首次返回两条有效发现。成功后没有再整轮重发 Codex，017只补缺失两源。证据不支持“成功 finding 后又重审同一个 Codex”，支持“局部失败纠正期间反复扩大为整轮、未充分隔离失败面”。

因此再写一遍“不重复审查”不够，必须用可复现的混合成功/失败场景验证真实调用集合和来源保留。这是 CARD-09 应补的可验收行为。

### 4. 大包和细粒度协调挤占上下文，没得到同等覆盖证明

V 物理审查包约17.8MB，1034个物理文件/1033个选材，693个差量中398个删除、723个 shard。导航 index约590KB，prompt约150KB。成功 Codex 有103条 completed command；Kimi实际34个唯一 path、AG35个，原件也保留 `read_confirmed=false`。不能把1033个选材说成1033项都已读或全部业务已覆盖。

B root 有612次 send/followup、260次 wait（1329次配对工具调用的65.6%），7次 compaction；V 有488次 send、114次 followup、352次 wait、640次 exec，也有7次 compaction。这证明协调密度和上下文回收成本很高，不证明这些时长全无效。B 112次无更新 wait共约86分钟，孩子可能正在工作，浪费份额未知。

保留完整材料是质量要求，默认先读大量重复说明/大索引却不是必要条件。应提供短导航和真实消费者/风险定位，让完整正文可达，再按实际读范围报告覆盖；主会话按工作包回收实证，避免细碎消息链和重复读回。

### 5. 真实代码缺陷、人工等待和平台限制不能混成一类

B T021确实遇到1MiB连续文本使脱敏正则卡住、16MiB Buffer结构断言 OOM、晚取消丢掉已settled结果、Git环境继承与OCR版本banner错判。这些修复和必要负例有质量价值；main保留对应代码修复。不能为加速跳过它们，也不能把它们说成平台等待。

B 最后约6h05m turn横跨 T017..T021，不是一个 regex 跑6小时。最后因宿主 `This content was flagged for possible cybersecurity risk` 终止，剩完整两文件复验/环境边界/真实OCR及后续 Phase由 V 接续。WorkflowHub/CARD-08不能保证解决平台安全判定，不能绕过它。

V 明确5h28m人工停顿是外发审批未被平台接受后的等待。报告不把它归为计算，也不将用户等待当作工程返工的替罪理由。

## 为什么重构接近完成仍没有达到效率目标

| 已做的改善 | 没有自动解决的事 |
| --- | --- |
| 删除旧阶段引擎、状态/认证控制面 | 真实 adapter/材料/取消契约是否第一次就正确 |
| 方法写了定向测试、一次审查、不空转 | 协调者是否照做，以及异常组合下调用集合是否可验证 |
| 修复接口缺陷和误杀 | 大包导航、重复协调、无进展升级与总任务成本 |
| 各卡交付、review能正常返回 | 同口径用户任务速度、实际覆盖和总体业务验收 |

当前 CARD-09 原 FR-43..46/AC-43..46、51主要测孤儿回收、并发、文件数、CPU/温度，不验开发总耗时与失败后的重复工作。因此不能用“多数卡完成”“进程下降”“删了很多代码”证明本轮产品效率目标已达成。也没有本次可复现的修前/修后同负载时间与质量对比；改善比例保持未测，不编数字。

## CARD-08 计划必须更新的部分

已按授权把 `7619db8e` 快进到 main `e4da5664`，五份未提交材料原字节保留；合并原件为 `quality/evidence/diagnostics/2026-10-04-001-card08-main-merge-readback.json`。只合入本分支，未提交/推送本轮规划改动。

- C6已经交付全部stage交接/verify覆盖、去13块与机器绑定，本卡不重做。
- 固定名覆盖仍在共享Skill和五个workflow；未来写集应从3扩成6个现有Markdown。新增 make-decision/build-prd/build-plan 只同步保存句，职责不扩为作者重写。
- appendRecord返回绝对路径字符串，root须既存，日期/序号按现有实现，不加命名helper/latest/manifest。
- 旧run/reflect正式发布包退役；旧4条G2错误是历史，不再列为当前流程门。当前材料仍须按真实G-2方法和幸存结构reader如实检查，不能因handler退役就说全通过。
- 保留七值、四类信息、先回读存原件再不可变写、失败后同task合法修复、旧任务写入负控、合入后实际入口矩阵与无上下文演练。
- 当前方法三审查点与母 PRD SD-07旧额外集成点存在来源差异。CARD05 D-044/CARD06 ADR-019有明确来源，但C6声明不改母原文。本轮把差异显式展示在草案与最终计划确认，不静默改母决定，不借优化跳独立审查。

CARD-08仍不改review/provider运行时，也不承诺消除所有长跑。其接续演练只能证明记录可用，不代替真实修复/资源/整体效率验收。

## CARD-09 增补与下一步

需求已写成 [CARD-09 开发效率增补草案](../../workflowhub-thin-core-rebuild-planning-20260919/card09-duration-amendment.md)，母 PRD只添加待确认指针，未重写原FR/AC。四项为耗时分账、失败来源定向处理、提前暴露可控失败面与小导航、无进展升级/窄委派/受控取消。均复用现有owner/producer，不新建runtime、永久遥测、账本、checkpoint或48小时强杀门。

先完成当前CARD-08草案的独立差异检查和针对性材料检查，展示真实未决取舍；用户确认后再开始CARD-08实现。CARD-09由其作者阶段承接增补，与CARD-08共享文件按段落owner和串行合并协调。CARD-10仍执行原总体套件，不由本轮偷偷增删。效果要以同任务范围/输入/路由的真实前后对比证明；不能复现时仍为 `inconclusive`。
