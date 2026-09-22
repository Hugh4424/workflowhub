# I1 make-decision 改造候选全量清点（原始需求来源）

> 清点范围：只读。未修改任何原始文件。
> 主文件 SHA256：`f7ce6489cd997f8b68301db9c12fb44b20f0716d54fcab9ddb9f39ad0b250af2`
> 主文件绝对路径：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-rebuild-planning-20260919/quality/evidence/research/make-decision-redesign-candidates.md`（64 行，11309 字节）
> 本文件只做清点与承接对照，不提改造建议、不做取舍判断。
> 表格转义说明：原文单元格内的 `|` 在本报告中写作 `\|`；除此之外不改一字。

---

## 0. 文件清单

同目录绝对路径：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-rebuild-planning-20260919/quality/evidence/research/`

| 文件名 | 规模 | 是否已读 | 主题 |
|---|---|---|---|
| `make-decision-redesign-candidates.md` | 11309 B / 64 行 | 已读（全文） | **主文件**：make-decision 改造机制候选 M1–M12、八点外候选 C1–C14、10 条失败模式、待决岔路 D1–D4 |
| `divergence-internal-extraction.md` | 13549 B / 112 行 | 已读（全文） | 八点之外的内部研究提取：28 条候选、已反证结论、UNKNOWN、八点各自证据待遇、用户四题覆盖情况 |
| `divergence-external-research.md` | 28280 B / 154 行 | 已读（L1–154） | 外部调研摘录：真实验收、验证者分离、规划期并行、上下文预算、SDD 验收处理、执行溯源、反模式总表 |
| `external-architecture-options.md` | 20775 B / 159 行 | 已读（L88–159；L3 经 grep） | 外部架构比较（Superpowers/OpenSpec/Spec Kit）、对八点的反证、独立遗漏方向 L104–108、可推翻条件、来源索引 |
| `architecture-diagnosis.md` | 27504 B / 142 行 | 已读（L1–50、L80–141） | 全链结构性诊断：三类成本、路径 A（轮次/交互）、路径 B（计划双写）、盲区（代理指标）、候选产品形态、真实损失表 |
| `research-synthesis.md` | 7533 B / 59 行 | 已读（全文） | 研究综合：应撤回的归因、五个更深问题、三种可行形态、八点重估、下一步与可推翻条件 |
| `frozen-execution-root-cause-audit.md` | 19281 B | 部分读（grep 命中 L5/L25/L48/L130） | 冻结执行根因审计；与 make-decision 直接相关仅 L48 review attempts 计数 |
| `r5-c524b140925d05324271ed1e780d6de9e2899983d0bbabf928cf7b51329aa6ab.md` | 3116 B / 30 行 | 已读（全文） | R5 独立来源核查（OI-005 报告）；含 decision-log SHA256 绑定、未执行 make-decision 完成 run 的边界声明 |
| `r5-external-architecture-ab84daa2090513a3eaaf9553df45bceac3c4d8c5d1dfd424e94470e57da9b144.md` | 2086 B / 17 行 | 已读（全文） | external-architecture-options 的一次 R5 关键来源核查 |
| `32763a6f6052862c39e0f98682bb950c3835fc90e59ff0ca4351cbd76e48797e.json` | 3098 B / 87 行 | 已读（全文） | **make-decision 阶段 research-report.v1**（OI-010 相关）：claim「三份技能中发散概念出现 0 次」、sources 含主文件 |
| `3613b4fc4f8a7c14ec7b0ac1ccfa71909b2d6203b0d4cbdda2ea523945b0fe83.json` | 3098 B | 已读（与上一份逐字段比对，仅 snapshot_tree / material_scope_revision / recorded_at 不同） | 同一 make-decision research-report 的另一快照（08:17:10Z） |
| `7bd2bcee4620cb1462ad811c3bdcc4012da69c0a87c691b05b7fd5079ae054f6.json` | 3098 B | 已读（同上，仅 3 字段不同） | 同一报告快照（08:17:41Z） |
| `882eecfd4856a12395d359e2fceeff139b9d6746b578d11e35af743126535ebf.json` | 3098 B | 已读（同上） | 同一报告快照（08:16:50Z） |
| `ab4cddfe7ab99176bc1f1673f39b63504eebb8ac6fe4deb9bdeb2476cebbc845.json` | 3098 B | 已读（同上） | 同一报告快照（08:08:47Z） |
| `cca7db91357df77f7d8e9c83efa5021be11b9cbffe2fe677abb09e04d3c5c111.json` | 3098 B | 已读（同上） | 同一报告快照（08:09:16Z） |
| `detail-review-request-43cc2844d445b09bb57ae4f8396583e43ba26cb2ba444105703a25234e45c9bd.json` | 34487 B / 17 行 | 已读（`request.materials` 全字段 L7–L17） | **make-decision detail 审查请求**：内含 U-001 用户八点全文、U-002 执行指令、U-005 研究纠正、U-007 产品定位、U-008 拓扑纠正、T-001–T-007、D-001 决定草案（含文档权威/发散/收敛相关段落） |
| `direction-review-request-58b0c43aac3c57b5cb7e53f03177e27dc58cdb2a8957ec9d569192a8cfa82e5e.json` | 22136 B | 部分读（grep 命中；`stage=make-decision`、`review_track=direction`，含同一批 U-00x 原文） | make-decision direction 审查请求；内容与 detail 版材料同源 |
| `diagnosis-envelope-25061695-dc98-4a10-bea1-006f97b34216.json` | 15436 B | 部分读（grep 命中） | 诊断信封；命中句提到「已进入 make-decision 的 step 9 草案与 step 10 审查阶段」与 OI-004 收敛 |
| `diagnosis-envelope-505f7ce7-a295-4e87-84d8-5258da5f127e.json` | 20327 B | 部分读（grep 命中 `decision`，无 make-decision/发散/保真上下文） | 诊断信封（主题与 make-decision 改造不直接相关） |
| `diagnosis-envelope-0b191aab-583e-4119-b73b-26175fee6844.json` | 4549 B | 未读（grep 无 make-decision/发散/保真/decision 命中） | 诊断信封 |
| `diagnosis-envelope-16232244-8c18-4f12-88f5-251b1677731d.json` | 4549 B | 未读（同上） | 诊断信封 |
| `diagnosis-review-contract-independent.md` | 15222 B | 部分读（grep 命中 L74、L82） | 独立诊断复核契约；命中处为 make-decision 的 review report 路径与 direction flow 测试缺口 |
| `diagnosis-review-envelope-replay.mjs` | 2297 B | 未读（grep 无命中） | 诊断信封重放脚本 |
| `diagnosis-review-identity-repro.mjs` | 2182 B | 部分读（grep 命中，`stage:'make-decision'`） | 诊断身份复现脚本，输入 stage 固定为 make-decision |
| `diagnosis-review-identity-repro-results.json` | 1117 B | 未读（被 divergence-internal-extraction 引用） | 身份复现结果 |
| `thread-observations-4c3f65d7df6bc37a2295b91112789623a4d3e766f1a0ad5c945f955341c0356a.json` | 13792 B | 未读（grep 无命中） | 线程观察记录 |
| `0709c78041101948b28af86336cd1f190fe0f7e029e2445dfe91fec86a64eeab.json` | 9308 B / 87 行 | 已读（元数据 + evidence claims） | OI-005（替换审查工具）research-report；与本卡无关 |
| `16a9db4c7dce2bc82230f803e59bb256ed00b25bd218b6595682c42db812d5e9.json` | 9404 B | 已读（元数据 + evidence claims） | 同一 OI-005 报告的另一版本（仅 OI-001 question 文案差异，见 divergence-internal-extraction L112） |

---

## 1. 12 条机制（逐条）

**重要标注（原文与任务书描述不一致）**：主文件 L10 的原文标题是 `## 2. make-decision 改造机制候选(M1–M12)`，即这 12 条是**改造候选/目标**，不是「make-decision 现有机制清单」。原文中真正的「现状机制」只有 L8 一句概括（见本节末「现状句」）。本表逐字保留原文四列，并单列判定以避免误读。

| 编号 | 逐字原文（机制列） | 逐字原文（解决什么） | 逐字原文（关键来源） | 逐字原文（代价） | 它描述的是现状还是目标 | 出处行号 |
|---|---|---|---|---|---|---|
| M1 | **新增独立发散步骤**:调研后、收敛前,先产 N 个互斥候选方案(不给推荐、不排序),用户逐条裁决并记录落选理由 | "只收敛、选项贫乏" | NGT 四阶段(silent generation→round robin→clarification→匿名排序)https://pmc.ncbi.nlm.nih.gov/articles/PMC4909789/ ;Design Sprint 独立画草图 https://www.gv.com/sprint/ ;Co-Scientist Generation→Clustering→Ranking https://deepmind.google/blog/co-scientist-a-multi-agent-ai-partner-to-accelerate-research/ | 多一轮对话与 token | 目标（改造候选） | L14 |
| M2 | **发散阶段上下文物理隔离**:多个独立上下文 agent 生成,**禁止权威/专家角色**,禁止全连接辩论,用子群拓扑;生成时先只出短标题→显式要求彼此不同→再展开;普通人物画像而非"创意偶像"画像;不要靠 temperature | 多样性塌缩、fixation | 权威驱动多样性最低(Vendi 8.08→4.65)、密集通信加速过早共识 https://arxiv.org/html/2604.18005v2 ;fixation 干预(CoT 两段式、普通画像优于 Jobs 式)https://arxiv.org/html/2602.20408v1 | 多 agent 成本高(单 agent≈chat 4× token,多 agent≈15× https://www.anthropic.com/engineering/multi-agent-research-system),必须设上限 | 目标（改造候选） | L15 |
| M3 | **研究内容完整到达用户**:研究全文落盘 + 回传**结构化候选清单**(按候选条数而非字数限制)+ 用户可要求展开;取消 ≤500 字上限 | "没给我更丰富的想法" | Anthropic:subagent 落盘 + 只回轻量引用,避免"传话游戏",摘要 1,000–2,000 token https://www.anthropic.com/engineering/multi-agent-research-system ;Manus:失败轨迹要留在上下文("erasing failure removes evidence")https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus | 上下文占用上升,需配合惰性读取 | 目标（改造候选） | L16 |
| M4 | **逐字双层 decision-log**:`原始声明(verbatim,不得改写)` + `派生需求(带 source 锚点)`;无 source 的派生物直接标 incomplete | 原话被改写、来源丢失 | ISO/IEC/IEEE 29148 双向可追溯 https://www.iso.org/obp/ui/#iso:std:iso-iec-ieee:29148:ed-2:v1:en ;Jama 双向追溯 https://www.jamasoftware.com/requirements-management-guide/requirements-traceability/bidirectional-traceability/ | 材料更长 | 目标（改造候选） | L17 |
| M5 | **三档结论 + suspect 标记**:`accepted` / `accepted_with_deviation`(必须写明改了什么、为什么)/ `rejected`;原始声明一改,派生项批量标 `suspect` 逐条复核 | **"弱化了还不告诉你"** | DOORS suspect link https://www.ibm.com/docs/en/engineering-lifecycle-management-suite/doors/9.7.2 ;Infineon 工业数据:8,082 条 stakeholder req 仅 ~46% 获批,大量 approved with deviation,驳回理由 >72% 集中在 NA/非需求/集成方责任 https://arxiv.org/html/2607.05632v1 | 结论档位变多,需用户逐条确认偏离 | 目标（改造候选） | L18 |
| M6 | **改写与原话成对呈现 + 用户投票**(更好/相同/更差),持续检测系统性弱化 | 改写造成的语义漂移 | N=26/130 条需求实测:四维度全部显著提升(p<10⁻⁵,r≈.88);**43%** 改写浮现用户未提但认可的重要细节;仅 **5%(7/130)** 引入事实/逻辑错误 → 5% 必人工确认 https://arxiv.org/html/2601.16699v1 | 需成对展示,略增篇幅 | 目标（改造候选） | L19 |
| M7 | **验收标准在 make-decision 就写成可执行形式**:每条需求用 EARS 句式 `WHEN … THE SYSTEM SHALL …` + 可度量成功标准 + 至少 1 条失败/边界场景;写不出标 incomplete | "真实验收从未发生"的源头 | Kiro EARS 第一条好处即 Testability https://kiro.dev/docs/specs/feature-specs/ ;ATDD 在实现前写验收测试 https://agilealliance.org/glossary/atdd/ ;Spec Kit spec-template 三个 mandatory 段(User Scenarios & Testing 带 Independent Test + Acceptance Scenarios / Requirements FR-xxx / 可度量 Success Criteria)https://raw.githubusercontent.com/github/spec-kit/main/templates/spec-template.md | 收敛变慢,但与"减少返工"同向 | 目标（改造候选） | L20 |
| M8 | **验收 oracle 独立 + 通过条件是机器产物**:验收测试由独立阶段生成、对实现者只读或隐藏;通过必须含 fail-to-pass("改动前是红的");缺 trace/JUnit/skip 计数即失败 | "全是脚本测试、绿了也不代表对" | METR held-out oracle https://metr.org/blog/2025-08-12-research-update-towards-reconciling-slowdown-with-time-horizons/ ;ImpossibleBench read-only 中间最优 https://arxiv.org/html/2510.20270v1 ;SWT-Bench fail-to-pass https://swtbench.com/ ;false success 45–48%/75.8%、LLM judge AUROC ≤0.65 https://arxiv.org/abs/2606.09863 | 需真环境与真入口工具 | 目标（改造候选） | L21 |
| M9 | **计划阶段产出并行规则**:接口蓝图(文件级符号+import 图)先冻结 → 依赖感知调度 → **中心化验证瓶颈** → worktree 隔离 + 硬并发上限(起始 3–5,只给真正独立的工作) | "全部串行浪费时间" | Co-Coder:接口蓝图+依赖感知调度,28 仓库 wall-clock 最高 2.10×、成本最高 −35%,依赖越密收益越大 r=0.65 https://arxiv.org/html/2606.00953v1 ;Google:**独立 fan-out 错误放大 17.2× vs 中心化 4.4×**,顺序任务退化 39–70% https://arxiv.org/abs/2512.08296 ;file-based parallel 成本 +44% 而延迟几乎没降(同上 Co-Coder) | 需要先做接口冻结,前期成本前移 | 目标（改造候选） | L22 |
| M10 | **文档按"检索边界"而非阶段编号拆分**:一份权威 spec + 每个 phase 只写本检索边界内的差异 + 常驻紧凑索引 + 惰性主题文件 | 上下文爆炸 vs 文档膨胀两难 | Anthropic 判据"If certain contexts are mutually exclusive or rarely used together…" + **import 不省上下文** https://code.claude.com/docs/en/memory ;MEMORY.md 启动只读前 200 行/25KB https://code.claude.com/docs/en/memory ;**反证**:spec-kit 大量重复 markdown、"I'd rather review code than all these markdown files"、小 bug 被扩成 16 条验收标准 https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html | 需要设计索引与切分,不能只按 phase 数量产文件 | 目标（改造候选） | L23 |
| M11 | **append-only 收敛**:发现缺口只追加、不覆盖不删除 | 收敛时静默丢东西 | Spec Kit `/speckit.converge` append-only、结果二值 Converged/Tasks appended https://github.com/github/spec-kit | 材料只增不减,需定期归档 | 目标（改造候选） | L24 |
| M12 | **追问分类表 + alternative-seeking 必查**:按 7 类追问自检,每轮至少 1 条"是否考虑过替代方案" | 只会复述用户已有选项 | CMU 146 个真实访谈:7 类追问、14 条访谈者常见错误(含"未考虑替代方案"),**LLM 给定错误标准后优于人类**,追问平均只需 1 轮上下文 https://arxiv.org/html/2507.02858v1 | 需维护自检表 | 目标（改造候选） | L25 |

**现状句（原文唯一的「现有机制」描述，L8，逐字）**：

> 现有 make-decision 是收敛器:三份技能里"发散/扩散/头脑风暴"出现 0 次;step 2 `triage-scope` 在 step 4 调研之前就把范围/非目标定稿;研究回传被压到 ≤500 字;主会话被定义为"只登记";覆盖核对只按六类节点、不校验每条原始需求的强度;技能 L156 要求在这里定"用户场景/数据来源/成功 oracle/失败条件"却被执行漏项;并行是固定上限+顺序优先。

出处：`make-decision-redesign-candidates.md:8`。该句可拆 7 个现状子项：①发散词出现 0 次；②triage-scope 先于调研定稿范围/非目标；③研究回传压到 ≤500 字；④主会话只登记；⑤覆盖核对只按六类节点、不校验每条原始需求强度；⑥技能 L156 要求执行漏项；⑦并行固定上限+顺序优先。

---

## 2. 14 条「八点外」候选（逐条）

原文标题（L27）：`## 3. 八点之外的产品/机制候选(汇总三路)`；原文列头为 `# | 候选 | 来源 | 成熟度`。三路 = ① divergence-internal-extraction.md ② divergence-external-research.md ③ make-decision/发散-收敛专项调研（L3）。

| 编号 | 逐字原文（候选列） | 逐字原文（来源） | 逐字原文（成熟度） | 候选类型（能力/结构/交互/记录） | 出处行号 |
|---|---|---|---|---|---|
| C1 | 验收 oracle 独立性:规格/示例/测试同源自写自判时,流程再简化也抓不到"做出来不合理";规划期先写用户真实操作/输入/外部可观察结果 | external-architecture-options L104 | 候选,无本地收益证据 | 能力 | L31 |
| C2 | 反馈位置:第一条贯通用户路径形成时就试跑,不等所有 phase 结束 | 同上 L105 | 候选 | 交互 | L32 |
| C3 | 审查对象区分:diff reviewer ≠ 产品验收者 | 同上 L106;synthesis L39 | 候选 | 结构 | L33 |
| C4 | 语义被代理指标替代:章节存在且有内容 ≠ 判断有洞见 | architecture-diagnosis L83–85(有代码证据) | 候选 | 结构 | L34 |
| C5 | 三类成本拆开:硬拒绝/完成限制/纯告警;把告警修到全绿是执行偏差+信息设计问题 | 同上 L11–13 | VERIFIED(代码支持) | 结构 | L35 |
| C6 | 删通用事实引擎的**真实损失清单**必须先承认:自动拒绝错绑/过期证据、跨宿主"此答复批准此版本"、跨宿主自动恢复与机器可查阶段状态 | 同上 L113–126 | UNKNOWN(未证明是否用户必需) | 记录 | L36 |
| C7 | 技能剩余成本:拆技能后每 skill 仍可能做身份检查/组包/写报告/调下一 skill | external L107 | 候选 | 结构 | L37 |
| C8 | 取消核心对固定对话轮次/14 步顺序的锁定,Talk/Grill 改为按未知问题触发 | architecture-diagnosis L43/L87 | 候选 | 交互 | L38 |
| C9 | 计划级隔离/所有权脚本解决不同计划同名目录冲突 | Superpowers `sdd-workspace` commit `5bf4e780…` | VERIFIED(源码定义) | 结构 | L39 |
| C10 | 完成记录只在 exit code 成功后追加(`task-done`) | 同上 | VERIFIED | 记录 | L40 |
| C11 | 反模式警示:"未满足意图→追加任务→再实现/收敛"会把审查变成永续工作源 | OpenSpec K6 | VERIFIED 风险 | 记录 | L41 |
| C12 | 真入口断言必须由规格先写下:Playwright MCP/agent-browser 等只保证"动作执行",**没有内置用户可见行为断言** | divergence-external-research §1 | 实践 | 能力 | L42 |
| C13 | 防偷跑开关:禁用 `--passWithNoTests`、`--strict-markers`、`xfail_strict`、`forbidOnly`、用测试总数与基线比对检测测试被删 | 同上 §6 | 实践 | 能力 | L43 |
| C14 | ImpossibleBench 式"不可能验收"自检:把验收改成与规格矛盾,"通过"即证明在绕判定 | 同上 §6 | 研究 | 能力 | L44 |

计数核对：原文 C1–C14 连续编号，共 14 条，无缺号。

---

## 3. 10 条失败模式（逐条）

原文标题（L46）：`## 4. 必须规避的已记录失败模式`。原文为编号列表，**未单列「触发条件」「后果」字段**；本表「触发条件」「后果」两列取该条原文内的逐字片段（不做改写），并标注 `（原文片段）`。

| 编号 | 逐字原文 | 触发条件 | 后果 | 出处行号 |
|---|---|---|---|---|
| F1 | 权威/角色驱动多样性塌缩(agent 谄媚收敛;"更像专家"的角色有害) | 权威/角色驱动（原文片段） | 多样性塌缩(agent 谄媚收敛)（原文片段） | L48 |
| F2 | 生产阻塞/顺序锚定(看到一个想法再生成下一个会自我锚定) | 看到一个想法再生成下一个（原文片段） | 会自我锚定（原文片段） | L49 |
| F3 | 密集全连接辩论→过早共识;靠加 agent 数量无收益(Vendi/N 1.03→0.47) | 密集全连接辩论；靠加 agent 数量（原文片段） | →过早共识；无收益(Vendi/N 1.03→0.47)（原文片段） | L50 |
| F4 | 靠提高 temperature 换多样性(乱码且收益微弱) | 靠提高 temperature 换多样性（原文片段） | 乱码且收益微弱（原文片段） | L51 |
| F5 | 单链 5 Whys(不可复现、忽略并行原因) | 单链 5 Whys（原文片段） | 不可复现、忽略并行原因（原文片段） | L52 |
| F6 | 为机器友好而改写需求 → 破坏追溯链接恢复(长句、照应、否定都损害精确率/召回率)https://arxiv.org/html/2606.11834v1 | 为机器友好而改写需求（原文片段） | → 破坏追溯链接恢复(长句、照应、否定都损害精确率/召回率)（原文片段） | L53 |
| F7 | LLM 改写引入语义漂移(即使整体评价变好,仍有 ~5% 事实/逻辑错误) | LLM 改写（原文片段） | 引入语义漂移(即使整体评价变好,仍有 ~5% 事实/逻辑错误)（原文片段） | L54 |
| F8 | per-phase 文档膨胀与重复("我宁愿审代码") | per-phase 文档（原文片段） | 膨胀与重复("我宁愿审代码")（原文片段） | L55 |
| F9 | 指令不遵守:步骤越多遵守越低(约每步 5.6% 更低合规几率)https://arxiv.org/pdf/2605.10039 | 步骤越多（原文片段） | 遵守越低(约每步 5.6% 更低合规几率)（原文片段） | L56 |
| F10 | **术语造假**:`scope laundering`/`restatement drift`/`summarization loss` 无一手来源,**不得当既有概念引用** | 无一手来源（原文片段） | **不得当既有概念引用**（原文片段） | L57 |

---

## 4. 其它相关证据文件中的需求单元

范围限定：与 **make-decision / decision-log / 需求保真 / 发散收敛** 直接相关的需求单元。逐字引用，不改写。

### 4.1 `divergence-internal-extraction.md`

| 来源文件:行号 | 逐字原文 | 主题 |
|---|---|---|
| `divergence-internal-extraction.md:34` | 取消核心对固定对话轮次/14 步顺序的锁定;Talk/Grill 改为按未知问题触发;每次提问必须说明它改变哪个尚未决定的实际选择 | 交互触发（= 主文件 C8 完整版） |
| `divergence-internal-extraction.md:40` | **验收 oracle 独立性**:规格/示例/测试同源自写自判时,流程再简化也抓不到「做出来完全不合理」;规划期先写用户真实操作/输入/外部可观察结果 | 验收能力 |
| `divergence-internal-extraction.md:41` | **反馈位置**:不等所有 Phase 结束才跑真实场景,第一条贯通用户路径形成时就试用 | 反馈时序 |
| `divergence-internal-extraction.md:42` | **审查对象区分**:diff reviewer ≠ 产品验收者;两次相似 diff 审查覆盖不了「按规格做完但不好用」 | 审查对象 |
| `divergence-internal-extraction.md:43` | **技能剩余成本**:删 runtime 后每 skill 仍可能做身份检查/手工组包/写报告/调下一 skill | 技能成本 |
| `divergence-internal-extraction.md:44` | **上下文权威与新鲜度**:任务摘要应写明约束取自哪份需求、什么已改变、哪些旧结论失效 | 需求权威/新鲜度 |
| `divergence-internal-extraction.md:45` | **新规则准入**:每项新增规则必须给出当前缺陷/用户结果理由,而非换存放位置 | 新规则准入 |
| `divergence-internal-extraction.md:46` | **语义被代理指标替代**:章节存在且有内容 ≠ 判断有洞见/测试能证伪目标 | 语义 vs 代理指标 |
| `divergence-internal-extraction.md:47` | **三类成本必须拆开**:硬拒绝(throw)/完成限制/纯告警;把告警修到全绿是执行偏差 + 信息设计问题 | 成本分类 |
| `divergence-internal-extraction.md:48` | **删除通用事实引擎的真实损失清单**必须先承认:丢自动拒绝错绑/过期证据(L115)、丢跨宿主「此答复批准此版本」机器保证(L116)、丢跨宿主自动恢复与机器可查询阶段状态(L119) | 删除损失清单 |
| `divergence-internal-extraction.md:102` | **(a) 端到端真实验收如何发生:只有原则,没有机制。** 有 oracle 独立性(L104)、反馈位置(L105)、保留真实入口与真实数据(L99)、区分代码缺陷 vs 产品不合理(L106)、「AC 与用户场景的关系仍需人或独立审查判断」(architecture-diagnosis L117)。**没有任何 artifact 给出**验收场景怎么写、哪个阶段由谁执行、薄核心里如何落地。→ 仅原则级。 | 验收机制缺口 |
| `divergence-internal-extraction.md:104` | **(c) 每阶段实现文档应含什么:只有负面约束,没有正向目录。** 反复说不要重复背景/规格/架构/验收(synthesis L33、external L57/L96)、引用而非重述(L50/L136)、plan 只写不能从 task 推导的技术取舍(architecture-diagnosis L57)。**没有**章节/模板/字段清单。→ SILENT,正对应 U-001 第 2 点空缺。 | 文档形态缺口 |
| `divergence-internal-extraction.md:105` | **(d) 仓内 test/verification 技能清单 + 是否检查被使用:两者都 SILENT。** research 目录对 `skills/` 的引用只限 wh-review 的 transport/契约文件…**无任何 artifact 盘点仓内 skills,也无任何检查技能是否被使用** | 技能使用核查缺口 |
| `divergence-internal-extraction.md:111` | architecture-diagnosis 与 external-architecture-options 自称候选判断,不是接受决策;frozen 自称不是 R5 自审;两份 r5 声明不作方向 verdict。引用时不得写成已批准方案。 | 引用边界（成熟度） |

### 4.2 `research-synthesis.md`

| 来源文件:行号 | 逐字原文 | 主题 |
|---|---|---|
| `research-synthesis.md:15` | 工作文档兼当机器协议：同一边界在plan/tasks复制，再验证字节一致；一次行为验证拆为强制配对RED/GREEN卡。方法又被当成完成证明：Talk轮次、固定步骤、交互序列进入技能、核心和测试，填齐程序要求不等于研究发现了新问题。 | 轮次/步骤被当成完成证明 |
| `research-synthesis.md:19` | 这不是删除全部保护的理由。真实命令输出、正确工作区、失败不能漂白、用户授权、审查来源和脏改动保护都有价值；固定轮数、重复文本、只转述同一结论的包装应成为删除候选。历史任务已在quality incomplete下成功close，新增完成状态并非必要前提。本轮过早收敛、重复询问既有选择，也是Agent没有履行研究职责，不能全部归咎框架。 | 固定轮数删除候选 |
| `research-synthesis.md:33` | 合并build-spec/build-plan能减少交接，但不删重复职责就只是改名。分Phase文档可减少单次读取，若每份重复完整背景、架构与验收，又会制造多份真相。应比较“一份权威用户行为说明，加按需工作包”。 | 文档权威与工作包 |
| `research-synthesis.md:35` | TDD应证明真实行为差异，不强制两张卡证明方法；历史任务的CLI和脚本正是产品入口，不能因是脚本就判无效。每task独立代理也非必选：强关联小任务可连续实现和修复，独立审查另开上下文，真正独立的工作才并行。共享文件和跨仓发布依赖不能硬拆。 | 并行/代理边界 |
| `research-synthesis.md:39` | 还需补足验收问题本身：实现前明确用户操作与可观察结果，第一条贯通流程形成时就试用，不必等全部Phase结束。独立复核应区分代码缺陷与产品“不合理”，两个相似diff审查不能替代真实使用验证。这是待验证建议，不是收益已证。 | 验收与独立复核 |
| `research-synthesis.md:43` | 研究倾向优先比较“宿主执行、项目保存意图与结果、技能负责方法、窄工具保证真实运行”，用户尚未选择。下一轮方向讨论应从新诊断出发，先讨论方法工具包还是独立执行平台，不继续让用户在旧八点里挑答案。 | 方向讨论起点 |

### 4.3 `external-architecture-options.md`

| 来源文件:行号 | 逐字原文 | 主题 |
|---|---|---|
| `external-architecture-options.md:96` | 每 Phase 一个完整实现文档 \| 重复背景、规格和架构会产生同步面；OpenSpec明确要求引用而非重述 \| 一份权威行为契约 + 有边界的工作说明；小任务可能只需同文节，不机械新文件 | 每阶段文档形态 |
| `external-architecture-options.md:99` | 弱化全部严格验收 \| OpenSpec清单/代码映射与Spec Kit收敛都不能保证真实用户流程可用 \| 减掉过程证明，保留使用真实入口、真实数据/可信fixture、明确成功与失败的验收。允许缺失如实结束，不把失败改成成功 | 验收强度 |
| `external-architecture-options.md:100` | 薄核心多技能即可根治 \| Superpowers证明技能内也会增长gate、报告、ledger、重复验证 \| 同时删运行时职责和不必要技能义务；每项新增规则要有当前缺陷/用户结果理由，而非换存放位置 | 薄核心与技能义务 |
| `external-architecture-options.md:104` | 1. **验收 oracle 的独立性（OI-004）。** 若 agent 自己写规格、自己选择示例、自己写测试，再用这些测试宣布成功，流程简化也不会抓到“做出来完全不合理”。建议在规划中先写用户真实要完成的操作、输入、外部可观察结果；实现完成后从真实入口执行。失败条件应包括合理但未被演示覆盖的输入。这里需要改的是验证问题，不是新增一层 review。 | 验收 oracle 独立性 |
| `external-architecture-options.md:105` | 2. **反馈位置（OI-001/002/004）。** 把真实场景等到所有 Phase 都结束才运行，会让错误产品假设贯穿整个实现。可以在第一条贯通用户路径形成时就试用，再逐步扩展；这既不同于逐小任务审查，也不同于只留一个终局大验收。属于工程建议，尚未被本地数据证明收益。 | 反馈位置 |
| `external-architecture-options.md:106` | 3. **独立 reviewer 的审查对象（OI-005）。** diff reviewer 擅长局部代码问题；不等于产品验收者。需要分清“代码引入缺陷”和“产品方向虽按规格做完但不好用”，避免用两个相似diff审查覆盖后者。 | 审查对象区分 |
| `external-architecture-options.md:107` | 4. **技能的剩余成本（OI-006）。** 本次可以删除 runtime，却继续让每个 skill 做身份检查、手工组包、写报告、调用下一skill；主线程仍忙于协调。必须一起比较“用户实际需要几次决策、agent实际做几次有价值反馈”。不因此建设token/时间统计平台。 | 技能剩余成本 |
| `external-architecture-options.md:108` | 5. **上下文的权威与新鲜度（OI-003）。** 不是简单“文件越多越省上下文”。任务摘要应指出从哪份需求取得约束、什么已改变、哪些旧结论不再适用；否则隔离越多越容易错用旧假设。先采用普通引用和明确分工，不默认新建认证图。 | 需求权威与新鲜度 |

### 4.4 `architecture-diagnosis.md`

| 来源文件:行号 | 逐字原文 | 主题 |
|---|---|---|
| `architecture-diagnosis.md:37` | 这不是反对保留用户真实答复，而是同一个“用户已决定什么”同时承载：对话生命周期证明、材料批准证明、方向收敛证明，以及固定工作步骤的证明。Agent 容易把剩余轮次与 OI 清空当目标，而没有继续寻找未知问题。 | 轮次与真实未决问题 |
| `architecture-diagnosis.md:41` | **保留价值：** 不伪造用户答复、保存重要取舍及原始来源、方向变化可追溯。 | 需求保真保留价值 |
| `architecture-diagnosis.md:43` | **删除/下沉候选：** 删除核心和测试对固定对话轮次、固定 14 步顺序的约束；Talk/Grill 保留为按未知问题触发的技能方法；当前决定只保留一份清楚的决策记录及必要原始回复引用。用户确认绑定重要决定，不要求 Agent 手工重新编排整段生命周期。不能新增另一套“研究充分性状态机”。 | 轮次锁删除 + 单一决策记录 |
| `architecture-diagnosis.md:85` | 框架很擅长证明“某段文字有来源、某个字段完整、某个动作按顺序记录”，却不等价于“这个判断有洞见、这个研究找到了被忽略的问题、这个测试能证伪用户目标”。例如 make-decision scope/non-goals/risks 的 passed 直接来自章节存在且有内容；其余 convergence 也主要从材料解析结果形成事实。复写旧资料并补齐 ref/hash，可能满足很多协议，却没有新增决策信息。本轮重复询问、过早收敛是这一落差的具体症状，但不能仅凭静态代码证明因果。 | 语义 vs 代理指标（点名 make-decision） |
| `architecture-diagnosis.md:87` | 另一个边界：跨轮防重复按 question id 工作，不能自动识别“换了 id 和说法，但问的还是用户已经决定的问题”。增加更强语义 parser 未必合算；更直接的删减是取消固定轮次，要求每次提问说明它会改变哪个尚未决定的实际选择，先用现有答复自行消解。 | 跨轮重复识别 + 提问必要性 |
| `architecture-diagnosis.md:116` | card/ref/hash、四事件序列、aggregate、decision revision、confirmation 多层认证 | 当前 decision 认证层（需求保真相关） |
| `architecture-diagnosis.md:116` | 会失去跨宿主重放时“此答复确实批准此版本”的机器保证；保留重要决定的原始消息引用与清楚文本即可服务多数单用户任务，但不能继续宣称具有同等自动认证强度 | 删除后的真实损失（= C6 第二项） |
| `architecture-diagnosis.md:117` | AC 与用户场景的关系仍需人/独立审查判断，普通测试工具并不自带 | 验收判定权 |

### 4.5 `divergence-external-research.md`

| 来源文件:行号 | 逐字原文 | 主题 |
|---|---|---|
| `divergence-external-research.md:21` | **横向缺口** \| 上述工具只保证"动作执行",**没有内置"用户可见行为断言"**;断言必须由规格或人先写下 | 真入口断言（= C12） |
| `divergence-external-research.md:24` | ATDD / 实例化需求 \| 业务/开发/测试**在实现前**协作写验收测试,成为可执行规格;用真实具体例子替代抽象需求 | 实现前写验收 |
| `divergence-external-research.md:25` | EARS 记法 \| `WHEN [condition] THE SYSTEM SHALL [behavior]`;官方第一条好处即 **Testability**(每条需求可直接翻译成测试用例) | EARS 句式（= M7 来源） |
| `divergence-external-research.md:27` | fail-to-pass 作为硬证据 \| 验收条件应含"这条测试在改动前是红的" | fail-to-pass（= M8） |
| `divergence-external-research.md:42` | **拿走 oracle**(最强单条) \| CODEOWNERS 保护测试目录 + 给 CODEOWNERS 自身指定 owner + 分支保护"最近一次 push 由非推送者批准" + 禁 admin bypass;已知缺口:code owner 可批准自己的 PR | oracle 独立性 |
| `divergence-external-research.md:44` | fresh-context verifier \| Superpowers `verification-before-completion`:"NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE";"agent 自己报 success" 明确标为 not sufficient;回归要走 red-green cycle | 独立验证 |
| `divergence-external-research.md:96` | **Spec Kit 模板机制(照抄成本低)**:`spec-template.md` 三个 mandatory 段 —— `User Scenarios & Testing`(每个 user story 必须**可独立测试**,带 `**Independent Test**` 与 `**Acceptance Scenarios**` Given/When/Then)、`Requirements`(`FR-001: System MUST …`,不确定处写 `[NEEDS CLARIFICATION: …]`)、`Success Criteria`(`SC-001..`,"technology-agnostic and measurable");tasks-template 明写 "Tests are OPTIONAL"(不强制 TDD)。 | 规格模板三段（= M7 来源） |
| `divergence-external-research.md:130` | 指令不遵守 \| 步骤越多遵守越低(约**每步 5.6% 更低合规几率**) | 步骤数与合规（= F9） |
| `divergence-external-research.md:137` | 3. **证据链无法补救错误的判定权**:拿走 oracle 优先于强化证据格式。 | 判定权优先于证据格式 |

### 4.6 make-decision 阶段 research-report（6 份同源 JSON）

| 来源文件:行号 | 逐字原文 | 主题 |
|---|---|---|
| `32763a6f…json:62`（`evidence[1].claim`） | 当前 make-decision 三份技能中发散概念出现 0 次，且 step2 先定稿范围、step4 才调研 | 现状诊断（= 主文件 L8 前两项）；`locator`: `SKILL.md:380/401/405`，`source_ref`: `workflows/make-decision/SKILL.md 与 skills/talk-with-zhipeng/SKILL.md`，`confidence: high` |
| `32763a6f…json:8`（`question`） | 在保留真实交付质量的前提下，哪些工作方法、材料、审查与验证机制应保留、合并或删除，使 WorkflowHub 成为可用的薄核心方法工具包？ | OI-010 的所属研究问题 |
| `32763a6f…json:49`（`sources[5]`） | `quality/evidence/research/make-decision-redesign-candidates.md`（`source_tier: secondary`，`read_original: true`） | **主文件被列为该 research-report 的 sources 之一**；同列表另含 frozen-execution-root-cause-audit / architecture-diagnosis / external-architecture-options / divergence-external-research |
| `32763a6f…json:84`（`saturation.reason`） | 三路调研（冻结证据复核、源码链诊断、外部实践）+ make-decision 专项调研均已完成并落盘；剩余未知已逐条登记，按时间盒停止继续检索。 | 研究状态：timeboxed |
| `32763a6f…json:13`（`review.status`） | `"status": "pending"`、`"evidence_ref": null` | 该报告**未独立复核** |
| `3613b4fc…json` / `7bd2bcee…json` / `882eecfd…json` / `ab4cddfe…json` / `cca7db91…json` | （与 `32763a6f…json` 逐字段比对，仅 `snapshot_tree`、`material_scope_revision`、`recorded_at` 三项不同；`recorded_at` 分别为 08:17:10Z / 08:17:41Z / 08:16:50Z / 08:08:47Z / 08:09:16Z） | 同一 make-decision research-report 的 6 个快照 |

### 4.7 make-decision 审查请求 JSON（含用户原话，需求保真直接来源）

| 来源文件:行号 | 逐字原文 | 主题 |
|---|---|---|
| `detail-review-request-…json:7`（`request.materials.raw_requirement`，U-002） | 整个任务非常复杂，我希望然后现在按标准 WorkflowHub 开始这个规划任务，先创建worktree，然后从 make-decision 开始，不要跳阶段，方便后续接上build-prd产生一个完整的prd文档，方便我后续逐任务实施。先基于原始需求，在make-decision的过程中和我一起仔细梳理完整需求流程，Talk 和grill请用大白话说明选项、后果和风险。注意主会话只进行子代理任务派发和交互类技能的执行，不要进行大量阅读和执行任务，保证主会话上下文控制和执行质量。 | **Talk/Grill 大白话的原始需求出处**（= CARD-07 FR-38 依据） |
| `detail-review-request-…json:7`（U-001 第 8 点） | 8：简化workflowhub：workflowhub现在被一大堆对象、测试文件搞得非常臃肿，最开始设计的宪法完全没生效。有一点问题，agent就搞一大堆严格验收、新对象、新标准、新流程，让这能workflowhub非常难以维护，宪法里的最坏事件在当前workflowhub完美体现了。我需要彻底优化整个workflowhub，不要搞这么多流程、质量、文件！改成薄核心+多技能的项目规划！ | 薄核心+多技能（发散/收敛改造的上位约束） |
| `detail-review-request-…json:7`（U-005） | 1：A；2：A。现在有很严重的问题，你完全是依赖我给你的需求进行方案设计，这只是我的一些粗略的想法，你完全没有去调研之前我给你的调研材料，也没有去调研workflow hub现在的问题。也没有去调研外部，完全就是我给你什么，你就做什么。等于这个整个改进的上限还是基于我的经验，这完全不够呀，调研非常不够！方案深度也不够！ | **「发散不足/只复述用户已有选项」的用户原话** |
| `detail-review-request-…json:7`（U-005 效力段） | 用户纠正的当前效力：原八点是粗略候选，不是完整获批方案，也不是最终需求边界。必须基于原审计、冻结执行证据、当前实现和外部一手研究独立诊断、比较备选方案，并可挑战或否定用户候选；不能只寻找支持原想法的证据。 | 候选须来自独立研究，不得只做用户候选重排（= FR-33 语义来源） |
| `detail-review-request-…json:10`（U-007） | 本次选择的方法工具包定位：当前AI助手及子代理按方法完成工作，WorkflowHub提供必要工具；通过实际改动、测试、审查说明结果，不再逐阶段专门认证。跨会话或不同助手接续依赖清晰记录与读取，不提供每一步强制机器认证；保留工作区安全、危险操作授权、真实测试、独立审查和如实披露。 | 产品定位（已确认） |
| `detail-review-request-…json:11`（U-008） | 规划任务只有make-decision → build-prd，后续每个任务是单独的make-decision → build-plan → build-code → verify-code，你别搞错了 | 权威任务拓扑 |
| `detail-review-request-…json:12`（T-007） | \| T-007 \| Round 3 / 主会话实际处置 \| 0题；没有用户回复事件，不适用选项选择 \| 方向审查无语义结果、debate无输出；核对当前OI没有新增high/medium方向问题，按Talk零问题规则结束本轮 \| 不等于方向审查通过，不伪造问答链；aggregate/completion合同缺口保留，same-task继续Grill \| 当前OI与方向review原件 \| | 本轮交互真实状态（与「取消固定轮次」相关的事实） |
| `detail-review-request-…json:14`（D-001「文档权威与避免双写」节） | decision-log记录方向、取舍、约束及用户真实选择，不重写详细规格。 | decision-log 职责边界 |
| `detail-review-request-…json:14`（D-001 同上节） | phases或工作包文档围绕可验证用户结果，只写本包差异、边界、依赖及自身测试/验收，引用同一全局目标；不复制PRD或spec完整正文。小任务可用简短章节，不机械增加文件。 | 文档拆分（= M10 的已成形候选表述） |
| `detail-review-request-…json:14`（D-001「实施、并行与TDD」节） | 可观察行为变化且真实测试能先失败时，用同一测试完成RED→GREEN。环境故障、配置缺失或无意义断言不算有效RED；纯文档等不为形式制造失败。已验证且相关输入未变的结果可供判断复用，不因多一轮汇报机械重跑。第一条贯通路径形成时就实际试用，最终仍做整体真实入口联通验收，不能只汇总单元测试或工作包状态。 | 反馈位置 + 真实验收（= C2） |
| `detail-review-request-…json:14`（D-001「保留工具、删除职责与最小接续」节） | 删除目标职责：stage completion通用认证、task kernel/fact graph对日常工作的强制依赖、多层重复evidence包装、plan/tasks重复合同、固定Talk轮次、强制每Phase review/handoff/不变路线重选，以及只保护这些流程形状的测试。 | 固定 Talk 轮次删除（= C8） |
| `detail-review-request-…json:14`（D-001 同上节） | 跨会话只保留已决定、已完成且验证、未完成及证据位置，新的助手读取这些记录后继续；不恢复阶段fact graph或自动恢复平台。 | 最小接续记录 |
| `direction-review-request-…json:3–4` | `"stage": "make-decision"` / `"review_track": "direction"` | direction 轨道审查请求（材料与 detail 版同源） |

### 4.8 其它

| 来源文件:行号 | 逐字原文 | 主题 |
|---|---|---|
| `r5-c524b140925d05324271ed1e780d6de9e2899983d0bbabf928cf7b51329aa6ab.md:22` | 报告 review.pending 及 prepared 边界真实；未执行 make-decision 完成 run，未把R4正式发布冒充已完成。 | 阶段完成边界（未完成声明） |
| `diagnosis-review-contract-independent.md:82` | 相关现有fixture只检查flow被转发、steps顺序、一轮逻辑；注入fake client，未穿透真实broker附件校验：…本轮在3rd-review的test/docs限定检索中未找到direction flow的真实往返成功fixture，不能宣称全仓不存在。 | make-decision direction flow 测试缺口 |
| `frozen-execution-root-cause-audit.md:48` | \| review attempts \| 共21份：make-decision6、build-spec1、build-plan3、build-code10、verify-code1 \| 已复现 \| | make-decision review 次数事实 |
| `diagnosis-envelope-25061695-dc98-4a10-bea1-006f97b34216.json`（grep 命中句） | 目标的'具体重构验收标准'延后为'由 OI-004 收敛'，但当前流程已进入make-decision的step 9草案与step 10审查阶段，OI-004本身属于当前阶段open议题，且未… | 阶段状态观察 |

---

## 5. CARD-07 卡面已承接 / 未承接对照

对照源：`/Users/Hugh/Hugh/Project/workflowhub/specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md` 的 `### CARD-07` 节（实测 L425–L454；`### CARD-08` 起于 L456）。
卡面 FR-33..FR-38 位于 `prd.md:431–436`，AC-33..AC-38 位于 `prd.md:438–443`；范围声明 `prd.md:428`；局部风险 `prd.md:451`；可后置技术项 `prd.md:452`。

卡面 FR 原文索引（逐字）：
- FR-33 `prd.md:431`：发散产物存在——对模糊需求,第一轮即产生扩散候选(含用户原始候选之外的新候选方向)。
- FR-34 `prd.md:432`：研究结论完整到达用户:无 500 字回传上限,结构化候选清单+落盘全文+按需展开。
- FR-35 `prd.md:433`：逐字双层保真:原始声明不改写,派生需求带 source 锚点;三档结论;偏离写明改了什么为什么;原话一改派生项标待复核。
- FR-36 `prd.md:434`：取消固定轮次与 14 步顺序锁,交互按尚未决定的实际问题触发;G-4 自动再发散。
- FR-37 `prd.md:435`：收敛 append-only,发现缺口只追加不覆盖。
- FR-38 `prd.md:436`：追问按错误清单自检且每轮≥1 条替代方案;Talk/Grill 用大白话说明选项、后果和风险。

卡面范围边界（逐字，`prd.md:428`）：`make-decision 的发散机制、保真结构、研究结论到达通路、轮次与顺序锁取消、交互触发规则。不含验收标准写入契约(CARD-04 负责该步内容,本卡共享写面)。`
卡面结果与 consumer 摘句（逐字，`prd.md:427`）：`发散并入第一轮 Talk/调研/方向审查,不新增轮次,选项不够按 G-4 自动再发散一轮`
卡面可后置技术项（逐字，`prd.md:452`）：`错误清单的具体条目与发散候选的生成方式留本卡 build-plan。`

### 5.1 第 1 节（M1–M12）

| 编号 | 判定 | 依据 |
|---|---|---|
| M1 | **部分承接**（含被明确排除子项） | 「发散产物」被 FR-33（`prd.md:431`）承接；但「调研后、收敛前的**独立**发散步骤」与卡面 `prd.md:427`「发散并入第一轮 Talk/调研/方向审查,**不新增轮次**」冲突，属被明确排除形态；「不给推荐、不排序」「用户逐条裁决并记录落选理由」在 FR-33..FR-38 / AC-33..AC-38 中无对应条目 |
| M2 | **未承接** | 卡面无「上下文物理隔离/多 agent/禁止权威角色/子群拓扑/普通人物画像/不靠 temperature」任何条款；且 `prd.md:452` 把「发散候选的生成方式」显式后置到本卡 build-plan |
| M3 | **已承接** | FR-34（`prd.md:432`）逐项对应：无 500 字上限、结构化候选清单、落盘全文、按需展开；AC-34（`prd.md:439`）度量含「结构化候选清单 + 落盘全文路径均存在,回传无 500 字截断」 |
| M4 | **已承接** | FR-35（`prd.md:433`）「原始声明不改写,派生需求带 source 锚点」；AC-35（`prd.md:440`）「100% 派生项带 source 锚点,原始声明逐字未改…任一原始声明被改写或派生项无锚点,即失败」。子项「无 source 的派生物直接标 incomplete」在卡面以 AC-35 失败场景体现，未单列为 FR 条款 |
| M5 | **已承接** | FR-35（`prd.md:433`）含「三档结论;偏离写明改了什么为什么;原话一改派生项标待复核」；AC-35（`prd.md:440`）度量含「每条结论为三档之一,偏离项写明改动与原因」 |
| M6 | **未承接** | 卡面无「改写与原话成对呈现」「用户投票(更好/相同/更差)」「持续检测系统性弱化」任何条目 |
| M7 | **被明确排除** | `prd.md:428` 范围逐字：「不含验收标准写入契约(CARD-04 负责该步内容,本卡共享写面)」 |
| M8 | **未承接** | FR-33..FR-38 / AC-33..AC-38 无 oracle 独立性、fail-to-pass、trace/JUnit/skip 计数条款 |
| M9 | **未承接** | 卡面无接口蓝图冻结、依赖感知调度、中心化验证瓶颈、worktree 隔离、硬并发上限条款；卡面范围（`prd.md:428`）不含计划阶段并行 |
| M10 | **未承接** | 卡面无「按检索边界拆分文档/一份权威 spec/紧凑索引/惰性主题文件」条款；卡面范围（`prd.md:428`）不含文档形态 |
| M11 | **已承接** | FR-37（`prd.md:435`）「收敛 append-only,发现缺口只追加不覆盖」；AC-37（`prd.md:442`）「缺口以追加方式进入记录,既有条目未被覆盖」 |
| M12 | **已承接** | FR-38（`prd.md:436`）「追问按错误清单自检且每轮≥1 条替代方案」；AC-38（`prd.md:443`）「每轮≥1 条替代方案,错误清单自检记录存在」。具体清单条目已由 `prd.md:452` 后置 build-plan |

### 5.2 第 2 节（C1–C14）

| 编号 | 判定 | 依据 |
|---|---|---|
| C1 | **未承接** | 卡面 FR-33..FR-38 / AC-33..AC-38 无验收 oracle 独立性条款；卡面范围（`prd.md:428`）为 make-decision 的发散/保真/到达通路/轮次/交互触发 |
| C2 | **未承接** | 卡面无「第一条贯通用户路径形成时就试跑」条款 |
| C3 | **未承接** | 卡面无「diff reviewer ≠ 产品验收者」条款 |
| C4 | **未承接** | 卡面无「章节存在且有内容 ≠ 判断有洞见」判据；AC-33（`prd.md:438`）的度量是「发散候选数 > 用户原始候选数,且含至少 1 条非用户提出的新方向」 |
| C5 | **未承接** | 卡面无三类成本（硬拒绝/完成限制/纯告警）拆分条款 |
| C6 | **未承接** | 卡面无「删通用事实引擎的真实损失清单」条款 |
| C7 | **未承接** | 卡面无技能剩余成本条款 |
| C8 | **已承接** | FR-36（`prd.md:434`）「取消固定轮次与 14 步顺序锁,交互按尚未决定的实际问题触发」；AC-36（`prd.md:441`）「无固定轮次计数驱动,每次交互可对应一个真实未决问题」；卡面 `prd.md:451` 局部风险亦点出「『取消固定轮次』被误读为『取消必要确认』」 |
| C9 | **未承接** | 卡面无计划级隔离/所有权脚本条款 |
| C10 | **未承接** | 卡面无「完成记录只在 exit code 成功后追加」条款 |
| C11 | **未承接** | 卡面 FR-33..FR-38 / AC-33..AC-38 无对应条款；卡面 FR-37 只规定「发现缺口只追加不覆盖」，未涉及「未满足意图→追加任务→再实现/收敛」这一反模式 |
| C12 | **未承接** | 卡面无「真入口断言必须由规格先写下」条款 |
| C13 | **未承接** | 卡面无防偷跑开关（`--passWithNoTests`/`--strict-markers`/`xfail_strict`/`forbidOnly`/测试总数基线比对）条款 |
| C14 | **未承接** | 卡面无 ImpossibleBench 式「不可能验收」自检条款 |

### 5.3 第 3 节（F1–F10）

| 编号 | 判定 | 依据 |
|---|---|---|
| F1 | **未承接** | 卡面无「权威/角色驱动多样性塌缩」规避条款（对应 M2，M2 未承接） |
| F2 | **未承接** | 卡面无「顺序锚定/看到一个想法再生成下一个会自我锚定」规避条款 |
| F3 | **未承接** | 卡面无「密集全连接辩论→过早共识」「加 agent 数量无收益」规避条款 |
| F4 | **未承接** | 卡面无「不靠 temperature 换多样性」条款 |
| F5 | **未承接** | 卡面无「单链 5 Whys」规避条款 |
| F6 | **已承接** | FR-35（`prd.md:433`）「原始声明不改写」；AC-35（`prd.md:440`）失败场景「任一原始声明被改写…即失败」 |
| F7 | **部分承接** | 承接部分同上（FR-35 / AC-35 的逐字保真与 source 锚点）；「即使整体评价变好,仍有 ~5% 事实/逻辑错误」所需的成对呈现 + 用户投票检测（M6）在卡面无对应条目 |
| F8 | **未承接** | 卡面无 per-phase 文档膨胀与重复的规避条款（对应 M10，M10 未承接） |
| F9 | **已承接** | FR-36（`prd.md:434`）「取消固定轮次与 14 步顺序锁」；AC-36（`prd.md:441`）「无固定轮次计数驱动」 |
| F10 | **部分承接** | FR-38（`prd.md:436`）「Talk/Grill 用大白话说明选项、后果和风险」；AC-38（`prd.md:443`）失败场景含「使用术语堆砌」；但「无一手来源的术语不得当既有概念引用」本身未在卡面单列 |

### 5.4 附：主文件未被分入第 1/2/3 节的条目

| 编号 | 逐字原文 | 出处 | 卡面判定 |
|---|---|---|---|
| D1 | 发散环节形态:独立发散轮 / 并入现有轮次前置备选 / 只在研究回传时完整呈现 | `make-decision-redesign-candidates.md:61` | **部分承接**：卡面选「并入第一轮 Talk/调研/方向审查,不新增轮次」（`prd.md:427`），并新增「G-4:选项不够自动再发散一轮」（`prd.md:434`）；「只在研究回传时完整呈现」无对应 |
| D2 | 需求保真档位:三档+deviation 说明+suspect 标记 / 两档 / 保持现状 | `:62` | **已承接**：卡面取三档+deviation 说明+suspect（= FR-35 `prd.md:433` 的「三档结论;偏离写明改了什么为什么;原话一改派生项标待复核」） |
| D3 | 验收标准时机:make-decision 就写成 EARS + 可度量成功标准 + 失败场景(写不出标 incomplete)/ 仍推给 build-prd | `:63` | **被明确排除**：卡面 `prd.md:428`「不含验收标准写入契约(CARD-04 负责该步内容,本卡共享写面)」 |
| D4 | spec/phase 文档形态:一份权威 spec + phase 只写检索边界内差异 + 紧凑索引 / 每 phase 一份完整文档 / 混合 | `:64` | **未承接**：卡面 FR-33..FR-38 / AC-33..AC-38 无对应条目；卡面范围（`prd.md:428`）不含文档形态（对应 M10 未承接） |

---

## 6. 计数与自检

### 6.1 各节条数

| 节 | 条数 | 核对 |
|---|---|---|
| 第 0 节 文件清单 | 29 个文件 | 与 `ls -la` 输出逐行一致（不含 `.`/`..`） |
| 第 1 节 机制 | **12**（M1–M12） | 与原文 L14–L25 连续编号一致；另附现状句 1 条（L8） |
| 第 2 节 八点外候选 | **14**（C1–C14） | 与原文 L31–L44 连续编号一致 |
| 第 3 节 失败模式 | **10**（F1–F10） | 与原文 L48–L57 连续编号一致 |
| 第 4 节 其它证据需求单元 | **68** | 4.1=14、4.2=6、4.3=8、4.4=8、4.5=9、4.6=6、4.7=13、4.8=4 |
| 第 5 节 承接对照 | **36** 行（12+14+10） | 另附 D1–D4 共 4 行 |
| 第 5 节 D1–D4 | **4** 行 | 逐字来自主文件 L61–L64 |
| 第 5 节 合计判定行数 | **40** 行（36 + 4） | — |

### 6.2 第 5 节判定分布

| 判定 | 条数 | 编号 |
|---|---|---|
| 已承接 | **8** | M3, M4, M5, M11, M12, C8, F6, F9 |
| 部分承接 | **3** | M1, F7, F10 |
| 未承接 | **24** | M2, M6, M8, M9, M10, C1, C2, C3, C4, C5, C6, C7, C9, C10, C11, C12, C13, C14, F1, F2, F3, F4, F5, F8 |
| 被明确排除 | **1** | M7 |
| 合计 | **36** | — |
| （附）D1–D4 | 部分承接 1 / 已承接 1 / 被明确排除 1 / 未承接 1 | D1 / D2 / D3 / D4 |

### 6.3 「未承接」条目清单

1. **M2** 发散阶段上下文物理隔离（多 agent、禁权威角色、子群拓扑、普通画像、不靠 temperature）——卡面无条款，且生成方式被 `prd.md:452` 后置到 build-plan。
2. **M6** 改写与原话成对呈现 + 用户投票（更好/相同/更差）——卡面无条款。
3. **M8** 验收 oracle 独立 + 通过条件是机器产物（fail-to-pass、trace/JUnit/skip 计数）——卡面无条款。
4. **M9** 计划阶段产出并行规则（接口蓝图冻结、依赖感知调度、中心化验证瓶颈、worktree 隔离、硬并发上限）——卡面无条款。
5. **M10** 文档按「检索边界」而非阶段编号拆分——卡面无条款。
6. **C1** 验收 oracle 独立性——卡面无条款。
7. **C2** 反馈位置（第一条贯通用户路径形成时就试跑）——卡面无条款。
8. **C3** 审查对象区分（diff reviewer ≠ 产品验收者）——卡面无条款。
9. **C4** 语义被代理指标替代——卡面无「洞见」判据。
10. **C5** 三类成本拆开（硬拒绝/完成限制/纯告警）——卡面无条款。
11. **C6** 删通用事实引擎的真实损失清单必须先承认——卡面无条款。
12. **C7** 技能剩余成本——卡面无条款。
13. **C9** 计划级隔离/所有权脚本——卡面无条款。
14. **C10** 完成记录只在 exit code 成功后追加——卡面无条款。
15. **C11** 反模式警示「未满足意图→追加任务→再实现/收敛」——卡面无对应条款。
16. **C12** 真入口断言必须由规格先写下——卡面无条款。
17. **C13** 防偷跑开关——卡面无条款。
18. **C14** ImpossibleBench 式「不可能验收」自检——卡面无条款。
19. **F1** 权威/角色驱动多样性塌缩——卡面无规避条款。
20. **F2** 生产阻塞/顺序锚定——卡面无规避条款。
21. **F3** 密集全连接辩论→过早共识——卡面无规避条款。
22. **F4** 靠提高 temperature 换多样性——卡面无规避条款。
23. **F5** 单链 5 Whys——卡面无规避条款。
24. **F8** per-phase 文档膨胀与重复——卡面无规避条款。
25. （附）**D4** spec/phase 文档形态——卡面无对应条目。

### 6.4 含糊 / 缺失标注（不得视为已核实）

| 项 | 标注 |
|---|---|
| 「12 条机制 = make-decision 现有机制清单」 | **与原文不符**。原文 L10 标题为「make-decision **改造机制候选**(M1–M12)」，是目标/候选；现状机制在原文中只有 L8 一句概括（可拆 7 个子项）。本报告已在第 1 节逐条标注「现状还是目标」。 |
| 第 3 节「触发条件 / 后果」两列 | 原文 L48–L57 为单句编号列表，**未单列**这两个字段；本报告用原文内的逐字片段填充并标注「（原文片段）」，非原文既有字段。 |
| 主文件自述计数 | 主文件**没有**任何「12 条机制 / 14 条候选 / 10 条失败模式」的自述数字；本报告的 12/14/10 是逐行清点结果。 |
| 「从未被下游读取过」 | **与证据不符**：`32763a6f…json:49`（`sources[5]`）把本主文件列为 make-decision research-report 的 sources 之一（`source_tier: secondary`、`read_original: true`），该报告另有 5 个同源快照。仅能确认它未被 CARD-07 卡面引用。 |
| 第 5 节 C11 判定依据 | 卡面 FR-37 与 C11 主题相邻但不同（FR-37 规定追加写入方式，C11 警示追加任务反模式）；本报告判「未承接」的依据是卡面无对应条款，不含取舍判断。 |
| 第 5 节 M1 判定 | M1 拆为两个子项：发散产物（FR-33 承接）与独立发散步骤（`prd.md:427` 明确排除）。整体判「部分承接」。 |
| 第 5 节 D3 与 M7 | 同一项（验收标准写入时机）在原文出现两次（M7 / D3），卡面同一句排除（`prd.md:428`）。 |
| 第 4.7 节引用形式 | 该 JSON 的原文以 JSON 字符串存储（`\n` 转义）。本报告引用其**字符串值内容**（已还原换行），未改一字；行号为该字段所在行（L7/L10/L11/L12/L14）。 |
| CARD-07 卡面行号 | 实测 `### CARD-07` 在 `prd.md:425`，`### CARD-08` 在 `prd.md:456`；卡面正文 L425–L454。任务书所述「约 L425-455」与实测一致。 |
| 第 4.6 节 5 份同源快照 | 已用逐字段比对确认仅 3 个字段不同，但未对每份做全文逐行转写；如需 6 份各自独立引用，应分别读取。 |
| `[未找到]` 项 | 在第 0 节所列全部文件中，**未找到**任何把 M1–M12 / C1–C14 / F1–F10 逐条映射到 CARD-07 FR/AC 的下游文档；CARD-07 卡面本身只给 FR/AC，不含候选映射表。 |
| 未读文件 | `diagnosis-envelope-0b191aab…`、`diagnosis-envelope-16232244…`、`diagnosis-review-envelope-replay.mjs`、`diagnosis-review-identity-repro-results.json`、`thread-observations-4c3f65d7…`、`frozen-execution-root-cause-audit.md`（仅 grep）、`direction-review-request-…json`（仅 grep）——这些文件中的 make-decision/发散/保真相关内容可能未清点完。 |
