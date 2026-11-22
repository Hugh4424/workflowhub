# Lauren Tan 的演讲真正主张改变什么？

2026-11-20。
逐段核对 AI Engineer 的独立剪辑转写、直播转写与官方发布的幻灯转录，并回读讲者的个人文章和 pstack 上游技能。
下文时间指 17:31 的独立剪辑 O_zcc6Xl12g。
直播是另一条录制，官方标记的入口是 1:01:02，正文相同语句通常比剪辑晚约 1:01:24，不能直接用直播入口加剪辑时长。
自动字幕里 Grok Bot、TLA+、Lean 等名称以官方幻灯核正。
本笔记依据转写、幻灯转录与公开代码，未播放整段音视频。
[官方剪辑转写和幻灯][s1] · [配时 JSON][s2] · [官方直播阅读版][s3]

## 为什么要把信任放在工程环境里？

主题 1。把反复需要人纠正的事放到代码结构、静态约束和可复跑的验证里。

- 低信任循环里 Agent 先交代码，人逐次找错，问题再回给 Agent。
  高信任循环把可复现的错误交给 Agent 在本轮自行发现、修正和重跑。
  倒金字塔从代码库、静态分析，到运行或形式验证、文字说明、人审。
  前两层能复用确定性判断：API、架构和重构使错误路径难以表达，lint、类型、编译、测试和 CI 对仍能表达的错误给出可重跑的失败。
  文字承接仍需判断的要求，人保留对高影响设计及行为证据的判断。
  图中“cost”往人审端增加，是讲者的投入顺序，并无量化成本曲线。
  [两种反馈循环 1:50][s4] · [倒金字塔 2:07][s5]
- 代码既是产品，下一轮也是模型的示例。
  每合入一份临时方案，下一轮找到同类示例的机会就会增加，反复复制最终让例外看上去像惯例。
  因此，阻止新错误与清除旧误导示例解决的是两个不同环节。
  讲者专门留了一张“有时仍应该读代码”的幻灯，原因就是今天保留的代码会指导明天的 Agent。
  [代码即记忆 2:57][s6] · [复制扩散 4:24][s7] · [保留读代码 4:49][s8]

## Dune 的三个例子揭示了怎样的因果？

主题 2。代码入口、依赖边界和会扩散的快捷写法，对后续代理的结果都有影响。

- **案例 1。Dune 收口 useEffect。** React effect 的正确使用依赖场景。
  Grok Bot 的产品代码禁止直接使用，Dune 选定的框架 API 内保留。
  团队把依赖与生命周期的判断收回到框架内，产品 PR 因此少一个重复判断。
  演讲没有公开具体封装函数、合法例外列表和 lint 实现。
  直接移植禁令前需先确认有覆盖合法操作的入口。
  [Dune 5:00][s9] · [产品代码限制 5:53][s10]
- **案例 2。目录名指导生成，依赖分析守实际边界。** Cursor 曾发生 Agent 将 Electron main 代码 import 到
  renderer，渲染过程出现长任务、界面卡顿。
  Grok Bot 的 Dune 明确划出 electron-renderer/ 和 electron-main/，依赖图分析器和 lint 禁止二者互相
  import。
  幻灯特写连 type import 都禁止，共用类型放 shared/。
  这形成“从目录就能看懂、违反时会失败、合法依赖有位置”的完整边界。
  旁例 tibo.dog 用 tick.hot.ts 传达每 tick 调用且应避免分配，幻灯没有说这个命名例子也由 lint 执行。
  [目录边界幻灯 6:28][s11] · [原幻灯帧][s12]
- **案例 3。Cursor 的 timer 把暂时成功变成全局成本。** VS Code 的命令式生命周期与 React 的声明式渲染之间有时序冲突。
  9 月 9 日，一段零延迟 setTimeout 推迟 release，制止了一处闪烁，注释留下当时的合理化解释。
  10 月 3 日同类做法进了共享模块，10 月 17 日幻灯已写 183 个 timer。
  讲者把集合层面快速创建和销毁 timer 与 major GC、用户感知卡顿联系起来，点到 setTimeout、
  requestAnimationFrame、requestIdleCallback 三类 API。
  单处 workaround 能通过局部观察，注释让后续复制显得合理，分散修复的累积成本最终落到整个客户端。
  公开材料没有 GC profile、各类调用分布或对照复现，这是一段具体的团队归因。
  Grok Bot 的反应是把指导放到触发时的 lint 诊断，并在可行时把根因从 API 或架构中消除。
  [时序与 GC 7:22][s13] · [定时器扩散幻灯 7:27][s14] · [原幻灯帧][s15]
- **案例 4。谨慎看注释与规则数。** 讲者口述禁约 99% 注释，幻灯标 7 月 31 日 65,824，到演讲时 1,227，两端直接算下降约
  98.1%。
  这只是注释数量和团队做法，无注释减少对缺陷的独立估计。
  另有一张与 lint 或根除错误相关的台阶图，7 月起从 7 升到 11 月初的 167，转录未明确计数单位及采集方式。
  讲者也明确把规则、技能和 AGENTS.md 留在金字塔里，供确实需要判断的内容使用。
  [注释幻灯 8:18][s16] · [台阶图与诊断 9:28][s17] · [文字判断 2:48][s18]

## 不同验证手段分别能回答什么？

主题 3。实跑、模型检查和证明分别覆盖不同的对象和失败方式。

| 方法 | 实物或行为 | 能回答的问题与边界 |
| --- | --- | --- |
| 运行验证 | 功能地图写清用户能做什么、从哪里进、何种可见结果算成功。Settings 演示用 CLI 按 ARIA 可访问名称点击，再取 snapshot，保存 proof.png。驱动复用 CDP 等人也能用的调试能力。 | 视频能给动作和结果，截屏给某个时点，可访问性快照给结构。它们覆盖这次真实走过的入口、数据和环境。pstack 的公开技能另要求检查外部副作用、保留证据、验证启动和清理，不能由单图推全路径。[示例 10:36](https://www.youtube.com/watch?v=O_zcc6Xl12g&t=636s) · [上游运行验证技能](https://github.com/cursor/plugins/blob/e58dd043600587dbaf58ba315e7f2b38373eeb43/pstack/skills/create-verification-skill/SKILL.md) |
| TLA+ 模型检查 | 为跨设备、跨平台的通知流程建状态机，在给定模型中探索交错与状态。 | 给出所定义性质在模型与边界内的结果或反例。实现与模型是否吻合、真实集成是否正确，另需检查。官方公开材料未列出该通知模型的变量、性质、设备数量和探索上限。[形式验证 10:56](https://www.youtube.com/watch?v=O_zcc6Xl12g&t=656s) · [形式验证技能](https://github.com/cursor/plugins/blob/e58dd043600587dbaf58ba315e7f2b38373eeb43/pstack/skills/create-formal-verification-skill/SKILL.md) |
| Lean 算法证明 | Grok Bot 自写虚拟列表库，讲者提到检查会带来闪烁或抖动的算法性质。 | 结论受写出的定理、假设和证明覆盖的实现约束。现场未公开该定理或实现映射，不能外推到整套 UI 任意情境下没有抖动。[虚拟列表 11:04](https://www.youtube.com/watch?v=O_zcc6Xl12g&t=664s) |
| Bombadil UI 性质测试 | 在真实界面探索输入序列，检查预先定义的性质。讲者说已抓到几个 UI bug，仍在尝试。 | 可补手选用例未枚举的交互序列，结果受输入生成、观察信号、性质和预算限制。公开材料未列出团队规则及覆盖率。发布 fuzz 另由 Cursor Project 编排，未说明是否直接使用 Bombadil。[尝试 11:39](https://www.youtube.com/watch?v=O_zcc6Xl12g&t=699s) · [Bombadil 上游](https://github.com/antithesishq/bombadil) |
| pstack statechart | 将状态机按用户可见的状态与动作投影成图，同视频和截图一起审查意图。当前公开技能用 TLA+/TLC，能给违反已定义规则的最短路径。 | 读图看状态转移是否合乎约定，回看实跑证据再看某条转移是否实现。现版工具有边界、未检查规则和图规模限制，不能用视觉上无红点代替完整结果。[状态图 13:04](https://www.youtube.com/watch?v=O_zcc6Xl12g&t=784s) · [pstack statechart 原件](https://github.com/cursor/plugins/blob/e58dd043600587dbaf58ba315e7f2b38373eeb43/pstack/skills/statechart/SKILL.md) |

公开的形式验证技能对迁移给出比演讲更具体的条件：用真实代码中的术语和原子操作建模，用故意打破性质的变体验证规则会失败，写出假设、边界和覆盖代码版本。
运行验证技能也要求实跑生成的流程，并核实清理后证据仍在。
这里引用的是开源技能的要求，无法据此推定 Grok Bot 私有仓对每个 PR 均执行了这些步骤。
[形式验证技能原文][s19] · [运行验证技能原文][s20]

## 产量、回退率和性能数据能说明什么？

主题 4。数字说明该团队的观察，不能单独估计各个方法的贡献。

| 信号 | 原件读数 | 推断限制 |
| --- | --- | --- |
| 个人 PR | 口述上月约 3,000 PR 进生产。个人幻灯 3–10 月 68、254、352、685、1,113、2,401、2,732、3,127，合计 10,732。讲者另称到能大量交付用了六个月。 [个人图 0:47](https://www.youtube.com/watch?v=O_zcc6Xl12g&t=47s) · [六个月 1:45](https://www.youtube.com/watch?v=O_zcc6Xl12g&t=105s) | 未列变更复杂度、PR 粒度、实际自动化比例或个人投入时数。六个月是她的经验。 |
| 团队 PR 与交付频率 | 口述约 11,000 PR 进生产。团队图标题用“merged”，6–10 月分别 809、1,784、4,203、5,648、10,926，合计 23,370。10 月约 227 人至少贡献一个 PR，稳定客户端约日更。 [团队图 13:30](https://www.youtube.com/watch?v=O_zcc6Xl12g&t=810s) · [原幻灯帧](https://assets.ai.engineer/sites/aiecode2025/sha256/afda811b8e19a7af2a3e301bbd551fa378a1eec832632e281c56d4100e25990e.webp) · [口述 13:36](https://www.youtube.com/watch?v=O_zcc6Xl12g&t=816s) | 团队图计合并，口述说进生产，未公开两者逐条对账。227 人有核心和偶尔贡献者，无法用作等效全职工时。 |
| 回退率 | 口述相对回退率随迭代提速下降，后来约 0.5%。 [14:21](https://www.youtube.com/watch?v=O_zcc6Xl12g&t=861s) | 回退是重做成本的一部分。后续修复、未报道错误、非回退上线问题均可能漏计。未披露计量周期、分母和回退观察窗口，不宜拿 10,926 乘 0.5% 反算实际回退数。 |
| 用户侧性能 | 口述相较首发，启动、输入、新开会话、切换会话四项更快。 [14:38](https://www.youtube.com/watch?v=O_zcc6Xl12g&t=878s) | 所检官方原件无各项毫秒、百分位、机型、数据规模或同工作量基线。产量和指标并行改善是团队自报观察，无法识别 Dune、静态检查、验证、人员、模型或产品本身迭代各自的贡献。 |
| 验证成本 | Cindy Sridharan 的帖子说约 70% 的日 token 用于验补丁，约 20–30% 用于写补丁。Tan 只说自己的 token 大多用于验证。她主张 Agent 降低创建和维护既有验证方法的人工门槛。 [引用幻灯 12:05](https://www.youtube.com/watch?v=O_zcc6Xl12g&t=725s) · [成本陈述 12:30](https://www.youtube.com/watch?v=O_zcc6Xl12g&t=750s) | 个人 token 分配，用于说明投资方向。没有团队成本账、费用总额、前后工时或同行对照。 |

## 什么时候适合扩大自动化？

主题 5。先让代理能在日常开发中证明结果，再让外部事件触发更多工作。

- 先给内圈可复现标准与真实运行环境。
  对已经发生的错误，先阻新并清理会被复制的旧路径，再让 Agent 能复测和回读失败。
  扩并行时，若每轮仍把猜测交给人或缺少可靠的验证目标，返工和 token 会随吞吐一起增多。
  讲者声称 Grok Bot 发版触发新的 Cursor Project，让 Agent 跑新构建、像用户一样探索、开修复 PR 并自动合并。
  她的理由是已有局部架构约束、可运转的验证工具，而且大部分产品代码已不需深度人审。
  演讲没有公开发布分支规则、写权限、回退条件、数据隔离或生产故障统计。
  [内圈先行 15:11][s21] · [发版自动化 16:21][s22]
- 讲者 5 月的第一手文章提供了另一个实操链条。
  Cursor 内部的 Benny 先从员工报告、附件、代码、Git、Slack、Notion 区分事实和预期，缺重现信息就追问。
  接力 worker 先通过电脑操作证明能稳定复现，再尝试修复。
  性能问题收前后 CPU trace 和 heap snapshot，其他 worker 对照票据验证并录前后视频，最后开 PR 供审。
  作者当时把 Benny 称为进行中的工程。
  该案例和 11 月的 Grok Bot 发版流程属于不同项目和时间，不把前者视为后者自动合并控制的证据。
  X 原页访问返回 403，以下镜像呈现讲者原文，可按标题、作者及 ID 对照。
  [作者原帖][s23] · [作者全文镜像][s24]
- 迁移推论。
  先挑当前代码里确实重现过的一类错误，选唯一权威入口提供合法路径，把错误变成可预测的失败，再用日常入口采一次正常和失败路径的证据。
  能结构化排除的错误适合交给 API、类型或依赖规则。
  涉及跨模块产品意图或高影响权限时，适合让人判断待决定的行为与证据。
  工具可换用现有 runner、失败原件和读回路径。
  Dune、禁注释比例、特定模型、PR 数和自动合并权限由各自代码与组织环境决定。
  [演讲的投入顺序 15:11][s21] · [上游复用现有驱动原则][s25]

## 怎样回查原件？

| 正文编号 | 追踪标识 | 对应正文 |
| --- | --- | --- |
| 主题 1 | trust-in-environment | 为什么要把信任放在工程环境里？ |
| 主题 2 | dune-and-timer-cases | Dune 的三个例子揭示了怎样的因果？ |
| 主题 3 | verification-surfaces | 不同验证手段分别能回答什么？ |
| 主题 4 | numbers-and-denominators | 产量、回退率和性能数据能说明什么？ |
| 主题 5 | automation-after-proof | 什么时候适合扩大自动化？ |
| 案例 1 | talk-case-1 | Dune 的 effect 入口 |
| 案例 2 | talk-case-2 | Electron 目录依赖 |
| 案例 3 | talk-case-3 | Cursor 定时器扩散 |
| 案例 4 | talk-case-4 | 注释与约束图表 |

[s1]: <https://ai.engineer/talks/O_zcc6Xl12g-all-code-is-slop-except-mine.md>
[s2]: <https://ai.engineer/api/data/transcript?format=json&slug=youtube-87dd31e7fa6155e8455b>
[s3]: <https://ai.engineer/code/2026/talks/lauren-tan>
[s4]: <https://www.youtube.com/watch?v=O_zcc6Xl12g&t=110s>
[s5]: <https://www.youtube.com/watch?v=O_zcc6Xl12g&t=127s>
[s6]: <https://www.youtube.com/watch?v=O_zcc6Xl12g&t=177s>
[s7]: <https://www.youtube.com/watch?v=O_zcc6Xl12g&t=264s>
[s8]: <https://www.youtube.com/watch?v=O_zcc6Xl12g&t=289s>
[s9]: <https://www.youtube.com/watch?v=O_zcc6Xl12g&t=300s>
[s10]: <https://www.youtube.com/watch?v=O_zcc6Xl12g&t=353s>
[s11]: <https://www.youtube.com/watch?v=O_zcc6Xl12g&t=388s>
[s12]: <https://assets.ai.engineer/sites/aiecode2025/sha256/ceab9ab439a292dbcf979f75d1343f1584e0d101f36bb7acace5462be78ca01b.webp>
[s13]: <https://www.youtube.com/watch?v=O_zcc6Xl12g&t=442s>
[s14]: <https://www.youtube.com/watch?v=O_zcc6Xl12g&t=447s>
[s15]: <https://assets.ai.engineer/sites/aiecode2025/sha256/bd4de2c97eceb48fa03a6448b52f83a1303014095cd7b9f5001fe86ce67f3329.webp>
[s16]: <https://www.youtube.com/watch?v=O_zcc6Xl12g&t=498s>
[s17]: <https://www.youtube.com/watch?v=O_zcc6Xl12g&t=568s>
[s18]: <https://www.youtube.com/watch?v=O_zcc6Xl12g&t=168s>
[s19]: <https://raw.githubusercontent.com/cursor/plugins/e58dd043600587dbaf58ba315e7f2b38373eeb43/pstack/skills/create-formal-verification-skill/SKILL.md>
[s20]: <https://raw.githubusercontent.com/cursor/plugins/e58dd043600587dbaf58ba315e7f2b38373eeb43/pstack/skills/create-verification-skill/SKILL.md>
[s21]: <https://www.youtube.com/watch?v=O_zcc6Xl12g&t=911s>
[s22]: <https://www.youtube.com/watch?v=O_zcc6Xl12g&t=981s>
[s23]: <https://x.com/poteto/status/2058975157503570132>
[s24]: <https://x.noodl3.net/i/article/2058975157503570132>
[s25]: <https://github.com/cursor/plugins/blob/e58dd043600587dbaf58ba315e7f2b38373eeb43/pstack/skills/create-verification-skill/SKILL.md>
