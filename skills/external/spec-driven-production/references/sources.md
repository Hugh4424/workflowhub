# 参考依据与定制边界

核对日期：2026-09-16。

## 用户指定文章

[What is Spec-Driven Development and How to Implement it with Kiro](https://aws.plainenglish.io/what-is-spec-driven-development-and-how-to-implement-it-with-kiro-b5846bd55869?gi=96d54e838cc7)

读取状态：网页读取未取得正文，直接请求未取得可用文章内容，浏览器加载超时。没有完成全文阅读；本版本不把任何具体观点归因于该文章，也未绕过访问限制。后续取得可读正文时，可比对其流程和示例，再做有依据的调整。

## 已核对的官方补充资料

- [Kiro Specs](https://kiro.dev/docs/specs/)：以需求、设计和任务三类文件组织规格与实现计划。
- [Kiro Feature Specs](https://kiro.dev/docs/specs/feature-specs/)：需求优先流程，以及用户故事、EARS 验收描述和技术设计的关联。
- [Kiro Best practices](https://kiro.dev/docs/specs/best-practices/)：规格按功能组织，并在需求或设计变化后同步关联文件。

上述资料提供基础思路。本 skill 的双模板、评审记录、前后端契约核对及具体交付路径属于面向用户模板的定制，不声称是 Kiro 原生规范；使用时不要求 Kiro 工具。

## 两个用户模板的映射

| 模板 | 保留的信息 | 在流程中的职责 |
| --- | --- | --- |
| SDD 首轮需求输入文档 | 0–8 节；包含目标/非目标、用户故事、模块关系、FR、依赖和 Given/When/Then 验收 | 形成 `requirements-spec.md` 需求基线 |
| Spec 评审文档 | 0–6 节；包含 EARS 需求回溯、界面状态、技术方案、接口契约、检查清单和评审结论 | 形成 `spec-review.md`，分别引用需求、设计师的体验规格和研发实现规格，记录团队评审 |

原模板原样保存于 `assets/templates/`。首轮模板允许改变表格形式，但不得丢失信息点；模板没有独立的“进入设计前缺口”章节，因此技能以按需附录补齐该用途，不改写原始模板。

按用户要求将设计师与研发的约束分开：`requirements-spec.md → {design-spec.md + engineering-spec.md} → spec-review.md → tasks.md → verification.md`。`design-spec.md` 承载视觉、交互和体验正文；`engineering-spec.md` 承载架构、代码实现规范、数据模型、接口契约和工程测试策略。二者基于共同需求相互核对。六类产出文档的命名、划分及章节组织是本 skill 的定制，不直接沿用 Kiro 的文件命名与职责，也不是额外的用户输入模板。

三份约束性规格统一采用 `-spec.md` 后缀，评审、任务和验证文档按用途命名。两个用户输入模板的原始文件名与内容不随产出文件命名调整而改变。

`spec-review.md` 同时核对需求、体验设计和研发规格；保留三份基线的适用版本、摘要、核对表和真实结论。模板第 2 节引用体验设计，第 3 节引用研发方案，第 4 节核对两者的接口衔接。`verification.md` 补充业务验收、体验走查和工程约束的证据，可合并到任务文档。评审摘要不成为另一份规格正文，修改应先落回对应规格，再同步评审材料。

Given/When/Then 和 EARS 是同一验收行为的两种表达；保留 FR / AC 标识及条件，不因改写形式改变需求。追踪编号、执行状态和验证证据是本 skill 为连接两个模板与开发过程补充的工作规则。

## 面向团队协作的增强

在现有文档中补充体验行为、按角色组织的评审问题和变更影响分析，原始模板保持不变：

- 体验行为落在 `design-spec.md` 的交互章节和体验验收中，实现机制与工程验证落在 `engineering-spec.md`，见[体验行为规格指南](experience-spec.md)。
- 角色关注点、分歧与决策落在 `spec-review.md` 的检查清单和评审记录中，见[角色评审指南](collaborative-review.md)。
- 变更范围、关联证据及未知项写在对应需求、体验设计或研发规格的变更说明中，并同步评审、任务与验收，见[执行与变更指南](execution.md)。

这些增强是本 skill 的工作约定，不声称是 Kiro 缺失的能力。当前提供按文件与证据分析的 Agent 工作流程，没有独立的依赖扫描引擎、mock 生成器或自动化体验评测工具。
