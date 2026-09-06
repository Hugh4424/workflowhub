# 丁队（影响评估+搅局）立场书

裁决对象：direction-card.md 五项改造（A+B/D/E/F，C/G 并入）及 23 条 findings。总体判断：**方向骨架正确（只读、聚焦、不违宪），但"聚焦"名不副实**——单任务横跨 5 处 + 每 AC 9 字段合同 + 六状态矩阵 + gap_id 生命周期，正是 F8/F10 警告的形状；收益最高的恰是最便宜的两项，最贵的两项收益未经真实场景验证。

## 一、方向卡采纳成本与收益表

| 项 | 改动半径 | 收益 | 成本 | 触碰 forbidden | 奥卡姆 |
|---|---|---|---|---|---|
| **A+B** 收口预检链（9 字段合同 + build-plan 末端只读预检） | 最大：build-spec/build-plan 技能、stage-content-contracts/stage-content-evidence、schemas、CLI/JSON 展示、测试（方向卡自认 5 处） | 缺口前置暴露，但仅覆盖 build-plan 时已存在缺口；后期新缺口预检结论过期（#2）；只读则收益仅是"看见" | 极高：9 字段合同要写进技能/契约/schema 并长期维护；bootstrap：本任务自身 build-spec/plan 执行时工具不存在（#17） | 必删 blocked 态：核查已证"blocked 标记与 task store 不符"（#8/#19），保留即触发方向卡自己的失败边界；只读 advisory 则与"状态可信"目标脱钩（#3/#9） | **低**（4 合 1 里最重） |
| **C+G** 并入阶段要求 | C：build-code 首 phase smoke；G：review findings:[] 须带 provenance/live_unavailable（review 侧小改） | G 收益高（堵 review 绕过，成本小）；C 收益未证实（无已核查根因支撑） | 低 | 无，但 C/G 对应根因（静态验收卡、aggregate 太晚、命名误解）**未经独立核查**（#14），方向卡第 30 行"未核实论断当事实"自己触发 | G：**高**；C：中 |
| **D** 唯一缺口源（显式化 + 稳定 gap_id） | 投影/展示层现有 selector、schema、CLI/JSON；若含 gap 生命周期则扩至 task 层 | 去重显示；但"同一缺口只显示一次"以本任务产生缺口为前提，顺利执行即不可验证（#4）；且 D 未含"确认事实消除缺口"（#6/#18）——框架性根因对不上 | 中：等价判定/去重边界/schema 皆未定（#21）；确认消除逻辑是必做的隐藏成本 | **内部矛盾**：稳定 id ⇔ 不新增持久对象（#1）；内容哈希→事实追加即漂移，位置派生→同缺口多 id 无法去重 | **低** |
| **E** 边界校验（bridge agent_run_id===attempt_id、收据绑 snapshot） | 最小：adapters/bridge、canonical-receipt-writer、evidence/、review/schemas | **高**：直接修复两条已核查框架性根因，正向负向都可证伪 | 低：失败语义未定（#5）——建议"写入按结构错误拒绝 + 记缺口事实不阻断"（F9/F11 允许边界 fail-loud） | 不触碰（若记事实不阻断）；硬拒写=触碰，需明确 | **高**（全场性价比最高） |
| **F** 六状态分层 | 展示层 CLI/JSON + quality_status 独立来源声明；若含状态矩阵契约则扩至 runtime | 状态可信目标的主要承担者；六态可能已有生产者（close 三义/quality facts），纯展示则便宜 | 中：无生产者/值域/优先级/过期定义（#11/#22）→ 实现者可能造第二状态机 | 高风险：quality_status 若被 readiness 投影推导即重建耦合判定（#11）；禁第二状态机 | 若纯展示：**高**；若成契约矩阵：中 |

**结论**：按"收益/成本"排序应采纳 E+G＞F（展示层）＞D（砍 gap_id）＞A+B（改道或延期）。

## 二、搅局

**D-01 第三路：预检不做新 runtime 链，扩展现有 `spec-analyze` lens。** 本仓已有成熟模式：spec-analyze 是唯一 stage-end 语义检查，lens-only、不写四材料、不建第二 store/gate，经现有 stage-outcome publication 写 quality/facts；verify-code 被刻意排除（dsh-code-review 独立负责）。把"收口预检"做成它新增的 close-readiness profile（挂在 build-plan/build-code 末端、verify-code 仍排除），半径就从"5 处"缩为"一个 skill 的 profile + 展示引用"，且天然满足 F11（复用现有 owner/consumer=stage-outcome 事实）与 F10（不为可校验堆新闸）。代价：lens 只报告，去重仍归展示层——这正好把 D 也带向更简形态。simplicity-guard/design-source-readiness 证明"只读 advisory lens 挂 packet"是本仓正宗做法，预检应是同类物，不是新控制面。

**D-02 质疑"明确不做"：条件就是"不做唯一缺口源"最优。** 用户痛点原文是"同一缺口看到好几遍"——这是**展示问题**，不需要"唯一源"，只需要"同快照展示层按规范化内容聚合"。若真做"单写源"，唯一合规路径是"派生层显式化"，而派生层的收益上限就是展示聚合；再做 schema/等价判定/生命周期就是为"唯一"二字堆基建（F10 反例）。因此建议：D 删掉"稳定 gap_id"与"缺口记录契约/生命周期"（价值最低、风险最高、与 forbidden 矛盾最深的件），只保留①显示聚合去重 ②消费 human-confirmation 消除（#6/#18，按已核查根因必做）。若用户坚持 id，则明确 **id 域=单个渲染快照**、漂移是预期（缺口随事实消失是好事），放弃"跨投影/跨时间稳定"叙事。

**D-03 戳隐藏前提：**"不新增持久对象"与"稳定 gap_id"不是可协商约束而是**内在矛盾**——要稳定得登记（新持久对象），不登记就只能重算；重算的"稳定"只存在于内容不变的瞬间，而缺口恰以"事实追加后消失"为生命周期。方向卡从未定义稳定性的**定义域**，等于把矛盾留给 build-spec 解决——这正是原始需求明令禁止的"依赖 build-spec 补需求"（#20）。此外"同一缺口"的等价判定必须人到场（语义等价不可机器判定），任何人想做机器判定都是 F10 堆基建。

**D-04 戳隐藏前提："一个任务多 phase"与"不依赖 build-spec 补需求"是否自洽。** 不。收口合同 9 字段明确延后 build-spec（#20），原始需求第 3/4 条"不依赖 build-spec 补需求 / 梳理完整用户流程、页面范围、数据状态"已被违反（#15）；多 phase 不是解药，反而把"补需求"合法化——phase 边界划分判据、每 phase 交付物、切换条件方向卡均未给，届时由实现者在 build-code 内任意划分，等于未登记控制面后门。且 #17 bootstrap 未解决：多 phase 只能让后期 phase 的 build-code 之后 dogfood，成功标准"观察到去重"仍发生在改造完成后，对 A+B/D 的前置覆盖仍为零。

**D-05 防虚假共识：第 4/7/17 条 dogfood 类被三方圆过去。** 甲说"用户已确认 dogfood"、乙建议"补合成夹具"、用户接受"不做历史重放"——三方合谋的后果：①合成夹具只证明"新机制对样例工作"，改用**逐根因负向 oracle**（#12/#23：bridge 不匹配、收据过期、unknown/unavailable、findings:[] 无 provenance、六态独立变化）才是真实证伪；②"确认事实断裂"根因在 D 中缺失，则本任务对该根因**零验证**——方向卡成功/失败边界里"把未核实论断当事实"未被任何一方用于自身；③dogfood 自证风险（#16）未列入方向卡风险节（只有 3 条风险），三方无一提。防法：成功标准改为"每条已核查根因至少一条可过负向夹具+该根因改造项显式对应"。

## 三、致命缺陷自述（1 条）

我未读 Talk Round 1/2 用户确认原文（仅见方向卡转述）与 spec-analyze 的 packet-lens 实现全文，因此：对"用户意图是否偏离"的判断全部经甲转述，若 Talk 记录明确接受"blocked 为第四态/phase 由实现者定"，D-03/D-04 部分批评落空；D-01"spec-analyze 可扩展为 close-readiness lens"是"接口看适配"而非已验证，若不兼容（其职责限定为阶段语义一致性），第三路退化为"需新 lens 框架"，收益估计需下修。

## 四、建议裁决（一行）

E+G 采纳；F 仅展示层采纳（quality_status 独立来源，禁第二状态机）；D 砍稳定 gap_id 与生命周期、保留展示聚合+确认消除；A+B 改 spec-analyze lens 形式并移除 blocked，否则整体延期另立任务；C 标注"未核查根因"降级可裁剪。
