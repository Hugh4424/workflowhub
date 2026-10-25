# Third-Party Notices

workflowhub 包含或改编下列第三方项目的部分技能文字、规则或设计思想。完整逐技能映射、固定 commit、路径和本地修改见 [`skills/catalog.yaml`](skills/catalog.yaml)；索引仅供选择，不另存完整登记。

## MIT-licensed sources

- **Superpowers**, copyright © 2025 Jesse Vincent. Source: [obra/superpowers@d884ae0](https://github.com/obra/superpowers/tree/d884ae04edebef577e82ff7c4e143debd0bbec99).
- **Matt Pocock Skills**, copyright © 2026 Matt Pocock. Source: [mattpocock/skills@b0618bc](https://github.com/mattpocock/skills/tree/b0618bc436ad893b3c5e84e55fba86586d34a404/skills).
- **gstack**, copyright © 2026 Garry Tan. Source: [garrytan/gstack@7c9df1c](https://github.com/garrytan/gstack/tree/7c9df1c568a9ea745508f679a329332b2c338063).
- **debate**, copyright © 2026 Zhipeng. Source: [Hugh4424/debate@af121a1](https://github.com/Hugh4424/debate/tree/af121a1e24ae3af48f5e132d3de1342d16eccf31).
- **Spec Kit**, source: [github/spec-kit@b7e67f5](https://github.com/github/spec-kit/commit/b7e67f55bf7a937aaa57dbe0a8198774e285de3a). 该固定版本是首次 workflowhub 改造提交之前可验证的上游版本。
- **DeepSeek Harness**, source: [deepseek-ai/deepseek-harness@99f6f02](https://github.com/deepseek-ai/deepseek-harness/tree/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/.agents/skills). WorkflowHub 将 `dsh-code-review` 与 `dsh-find-simplifications`、`dsh-doc-standards`、`dsh-prose-standard`、`dsh-trim-cot-leakage` 的规则合并为一次 verify-code 代码审查调用；未引入 push、merge、翻译、归档或 GIF 运行时。
- **Vercel React Best Practices**, source: [vercel-labs/agent-skills@dd089a8](https://github.com/vercel-labs/agent-skills/tree/dd089a8c752c966dee8bf0f27cb625ba193ffd9e/skills/react-best-practices). 本地 AGENTS.md 为19行compiled改编摘要，未核为上游原字节vendored；WorkflowHub 只读保存该本地摘要，作为 React/Next 的内部组件质量 lens；保留本地 `skills/frontend-component-quality/upstream/react-best-practices/LICENSE` 与 `UPSTREAM.md`，不创建第二执行器或 gate。

- **Addy Osmani Agent Skills**, Copyright (c) 2025 Addy Osmani. Source: [addyosmani/agent-skills@aeac41d4d005999432bb7312f7ff06383a91d59d](https://github.com/addyosmani/agent-skills/tree/aeac41d4d005999432bb7312f7ff06383a91d59d). N6采用 `skills/idea-refine/SKILL.md` 的按问题选透镜与 `skills/interview-me/SKILL.md` 的模糊答复识别、原意追问及地板规则，具体采用与本地偏离见catalog。N1吸收 `skills/observability-and-instrumentation/SKILL.md` 与 `skills/performance-optimization/SKILL.md` 的问题/原数自验、同条件复跑纪律；不引入遥测平台或收益判断。
- **pstack**, Copyright (c) 2026 Lauren Tan. Source: [backnotprop/pstack](https://github.com/backnotprop/pstack). 固定实际读取包 SHA256 `f08746cbd6067834e095332d0a25bdec65529dcfc436809c2cb419717d0363b8`、`skills/principle-explain-the-number/SKILL.md` SHA256 `cd5a25f9e7cf023627ccb470dc5faa97542f29b4319496a32b839a8e1e988047`；commit未证实，不能以API短HEAD冒包绑定。N1吸收数字的范围/缺项解释，不引入profiler或收益打分。

- **figure-it-out / correct / encode-lessons-in-structure**, pstack，Copyright (c) 2026 Lauren Tan，MIT（本地 LICENSE 文本）。figure-it-out 文件 SHA256 `d9574cc24929773d5c23f40626ae1e09660afddd7de48e08dd6494d9fff9bbf0`、记录包 SHA256 `f08746cbd6067834e095332d0a25bdec65529dcfc436809c2cb419717d0363b8`（未复现，不作内容坐标），Git commit unknown；correct 与 encode 采用 `1f0f9c3bac03c4297f6fc8f7644fa412eda57085` 快照，文件 SHA256 分别为 `bf482bacc972b3f124a4af8bf9364b4b3e280cb5845e44c326ea4f4565e5c904`、`228963799189f481827d6f28065f278bc2008ffa37030b1234cbd5814d36b9e9`，非 HEAD。main 仅为取回坐标；上游许可链与记录包/Git 绑定未独立核实。逐项采用及本地落点以 catalog 为准；figure-it-out 正文接线与首验归 P5，登记不证明生效。

- **context-engineering**, Addy Osmani Agent Skills，Copyright (c) 2025 Addy Osmani，MIT；固定 commit `aeac41d4d005999432bb7312f7ff06383a91d59d`，文件 SHA256 `8b736cb9e55b82b265ab6ff78349c0e826e8a6df550deddf665b7fb3ff858b63`。N5只吸收任务重点靠后、保护字段与进入面指针纪律到 `AGENTS.md`；拒绝75%触发与宿主自剪；完整来源/落点见catalog `n5-dispatch-and-return`。
- **orchestrate.md**, pstack，Copyright (c) 2026 Lauren Tan，MIT；实际包 SHA256 `f08746cbd6067834e095332d0a25bdec65529dcfc436809c2cb419717d0363b8`，文件 SHA256 `d42b4375f1bd4ce23da0b575a198571a2117df7eea10c3c9fc6d92ae1053f7be`，commit未证实，上游许可链未独立核实。N5采用brief缩放、指针中继、事实回传到 `AGENTS.md` 与 `skills/deep-research/SKILL.md`；拒绝常驻寄存器/store、默认重开、全文粘贴、TIMEBOX/tick，沿现有完整MIT文本保留，不声称未知许可链已核。

- **Answer me with HTML**. Source: [QingYunA/answer-me-with-html@7acea240](https://github.com/QingYunA/answer-me-with-html/tree/7acea24024923eaae8647f5988e826062456dc86). MIT；仅适配技能方法/组件词汇/回灌，不搬renderer、字体或其它许可层。完整MIT许可见下文通用文本。

Copyright (c) 2026 Answer me with HTML contributors

上列已核MIT来源保留以下完整MIT许可，固定源及本地差异/owner/验证在catalog登记。

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

N3 P2 在现 wh-review/protocol/review 方法吸收 addyosmani/agent-skills 的 `skills/doubt-driven-development/SKILL.md`（MIT，固定 commit `aeac41d4d005999432bb7312f7ff06383a91d59d`）的 ARTIFACT + CONTRACT 与去 CLAIM；pstack（MIT，Copyright (c) 2026 Lauren Tan，实际包 SHA256 `f08746cbd6067834e095332d0a25bdec65529dcfc436809c2cb419717d0363b8`，git commit未知）的 `skills/interrogate/SKILL.md`、`skills/principle-attack-the-premise/SKILL.md`、`skills/blast-radius/SKILL.md`、`skills/architect/SKILL.md` 及 `references/design-red-flags.md`、`skills/arena/SKILL.md`、`skills/show-me-your-work/SKILL.md`。采用章节与本地偏离见catalog的n3 absorbed条目；不采用默认模型表、固定轮次、TSV新账本或候选框架。arena无真实consumer只落文字/未生效；来源登记不证明方法效果。

N3 P4测试与检查方法吸收：Addy固定 `aeac41d4d005999432bb7312f7ff06383a91d59d` 的 `skills/test-driven-development/SKILL.md`、`skills/constraint-driven-development/SKILL.md`、`skills/code-review-and-quality/SKILL.md`；Matt固定 `b0618bc436ad893b3c5e84e55fba86586d34a404` 的 `skills/engineering/tdd/SKILL.md` 与 `tests.md`、`skills/in-progress/setup-ts-deep-modules/SKILL.md`；pstack同上实际包SHA256（git commit未知）的 `skills/principle-test-behavior-not-implementation/SKILL.md` 与 `skills/tdd/SKILL.md`。采用源章节、本地正文/consumer和偏离见catalog七条n3 P4 absorbed登记；不引入TS安装、mutation平台、默认阈值或新质量gate。三来源MIT版权及完整许可沿本节原文保留。

N3 P5诊断吸收Addy上述固定commit的 `skills/debugging-and-error-recovery/SKILL.md#Treating Error Output as Untrusted Data`，及pstack上述实际包（git commit未知）的 `skills/poteto-mode/playbooks/perf-issue.md`。只采用输出/页面信任边界及实测先行、便宜方案顺序，落于diagnosing-bugs并由build-code失败分支消费；拒绝Safe Fallback、全量回归、指定模型/control-skill与自动PR。版权/MIT许可沿上文，完整采用/偏离见catalog两条P5 absorbed登记；登记不证明实际效果。

## Apache-2.0 source

- **AnySearch Skill**, copyright © 2026 AnySearch. Source: [anysearch-ai/anysearch-skill@db3d76e](https://github.com/anysearch-ai/anysearch-skill/commit/db3d76e5597aec7261257be5322dd211c9d9bb87). 历史登记声称Apache-2.0；本次固定commit完整tree无LICENSE/NOTICE，README亦未找到grant，故版本绑定与授权依据unknown。不得把本地后补文件当该版本已核许可。完整许可见 [`skills/anysearch/LICENSE`](skills/anysearch/LICENSE)，notice 见 [`skills/anysearch/NOTICE`](skills/anysearch/NOTICE)。

本 notice 不表示 workflowhub 引入了上述完整框架。gstack runtime、Superpowers bootstrap 等明确拒绝项不在发布闭包中；列出它们是为了记录被吸收的思想和后续更新裁决。

UI delivery governance（`frontend-testing`、`isolated-browser-qa`、计划模板和 browser-qa evidence）是
workflowhub 对现有技能的本地合同扩展，不引入新的第三方执行器；owner、consumer 和删除条件见
[`skills/catalog.yaml`](skills/catalog.yaml) 与 [`skills/reuse-registry.md`](skills/reuse-registry.md)。
The browser QA contract is owned by the existing `isolated-browser-qa` consumer path.

## 许可更正与待核边界

Design-wiki（WenjiaWang / ModelScope），固定版本 `0aaa9f649d90281009d08663b0f1a177ab3b7e8c`，许可 **unknown**；公开可读不是复制或分发授权。C02仅原创改写任务咨询、比较/抽模式/推荐及来源适用性方法，落在 `skills/knowledge-graph/references/knowledge-reuse.md`，不复制上游原文、源码或运行时。来源与五个采用参考文件、当前/固定比较、维护owner和排除范围唯一见catalog的knowledge-graph条目；真实consumer为make-decision开工及build-plan设计依据准备。design-experience-analysis只参考，grammar-ai/A6/动态GenUI不引入；仓内方法继续复用。本条不把未知许可列作MIT或已获grant。

AgentHub固定commit `258f5a2548fa8cc15325c6aa18dd107c1fc497b9` 的 [LICENSE](https://github.com/Hugh4424/AgentHub/blob/258f5a2548fa8cc15325c6aa18dd107c1fc497b9/LICENSE) 实际声明modified Apache-2.0，并附加第三方hosted/embedded商业服务需书面授权/商业许可、frontend logo及copyright不得移除等条件；旧MIT登记不实。五项测试技能的具体采用章节见catalog。抽取技能文字对这些条件的适用性仍unknown；来源维护者需权利owner确认具体grant。本次仅更正事实，没有接受附加条款或扩大既有采用/分发范围。

唯一原字节 vendored 项 anysearch 的 `scripts/anysearch_cli.js` 已回填 `content_sha256`；consistency 对其本地字节复算并只报告漂移。hash 相等不证明上游许可或包绑定，固定版本授权依据仍 unknown。

N3 P6在既有simplicity-guard吸收 addyosmani/agent-skills 的 `skills/code-simplification/SKILL.md`（MIT，commit `aeac41d4d005999432bb7312f7ff06383a91d59d`）及 pstack 的 `skills/principle-laziness-protocol/SKILL.md`、`skills/interrogate/SKILL.md` 与 `references/rubric.md` / `references/code-quality-review.md`、`skills/principle-subtract-before-you-add/SKILL.md`、`skills/principle-foundational-thinking/SKILL.md`（MIT，Copyright (c) 2026 Lauren Tan，包SHA256 `f08746cbd6067834e095332d0a25bdec65529dcfc436809c2cb419717d0363b8`，git commit未知）。仅采用catalog具名子集；subtract/foundational合入P0/P1，不重复计机制，不搬上游模型/裁决/脚手架。来源登记不证明方法效果。

N3 P7浏览器QA在既有网关吸收Addy上述固定commit的 `skills/browser-testing-with-devtools/SKILL.md` 的真实console/ready/a11y与信任边界指针，以及pstack上述实际包SHA256（git commit未知）的 `skills/create-verification-skill/SKILL.md`、`skills/maintain-verification-skill/SKILL.md` 的完整实跑/证据存活、dry-run实观、健康与可用分开、owned reset及doc drift/product gap分诊。各采用/拒绝章节与本地consumer归catalog三条P7 absorbed；不采用DevTools MCP引擎、live profile、第三方cookie同步、独立Doctor/feature-map或周期任务。MIT版权及完整许可沿本节原文。

## agent-browser runtime dependency

agent-browser 0.36.0，Copyright 2025 Vercel Inc.，Apache License 2.0；本机只读许可来源为安装包 `agent-browser/LICENSE`，固定版本来源 [vercel-labs/agent-browser v0.36.0](https://github.com/vercel-labs/agent-browser/tree/v0.36.0)。本包调用已安装CLI，不vendoring其二进制/源码，不伪造内容指纹。Apache-2.0许可文本见上述LICENSE及 [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)。Lightpanda为研究后未采用候选，不进入本交付依赖闭包。

## N4写作、规划与评测方法

addyosmani/agent-skills 固定commit `aeac41d4d005999432bb7312f7ff06383a91d59d`，MIT，Copyright (c) 2025 Addy Osmani；pstack本地固定包SHA256 `f08746cbd6067834e095332d0a25bdec65529dcfc436809c2cb419717d0363b8`，plugin声明0.15.23、Git revision unknown，MIT，Copyright (c) 2026 Lauren Tan。现有MIT完整许可声明及上述版权保留；逐文件固定hash/采用内容由catalog唯一登记。当前镜像/上游LICENSE均与本地许可同字节，不证明历史包绑定当前Git revision或法律充分性；本次仅在授权内改写方法子集，不复制整套原文。

| 条目 | 来源与既有落点（非权威导航） |
| --- | --- |
| documentation-and-adrs | <https://github.com/addyosmani/agent-skills>；`skills/decision-log/SKILL.md`；具体pin/许可范围回catalog |
| incremental-implementation | <https://github.com/addyosmani/agent-skills>；`skills/spec-plan/SKILL.md`；具体pin/许可范围回catalog |
| planning-and-task-breakdown | <https://github.com/addyosmani/agent-skills>；`skills/spec-plan/SKILL.md`；具体pin/许可范围回catalog |
| shipping-and-launch | <https://github.com/addyosmani/agent-skills>；`skills/spec-plan/templates/phase-template.md`；具体pin/许可范围回catalog |
| source-driven-development | <https://github.com/addyosmani/agent-skills>；`skills/deep-research/SKILL.md`；具体pin/许可范围回catalog |
| spec-driven-development | <https://github.com/addyosmani/agent-skills>；`skills/spec-specify/templates/spec-template.md`；具体pin/许可范围回catalog |
| technical-writing | <https://github.com/backnotprop/pstack>；`skills/spec-specify/SKILL.md`；`skills/decision-log/templates/decision-log-template.md`；`skills/spec-specify/templates/spec-template.md`；`skills/spec-plan/templates/phase-template.md`；`skills/spec-prd/templates/prd-template.md`；具体pin/许可范围回catalog |
| unslop | <https://github.com/backnotprop/pstack>；`skills/spec-specify/SKILL.md`；具体pin/许可范围回catalog |
| build-the-lever | <https://github.com/backnotprop/pstack>；`workflows/build-plan/SKILL.md`；具体pin/许可范围回catalog |
| minimize-reader-load | <https://github.com/backnotprop/pstack>；`skills/spec-plan/SKILL.md`；具体pin/许可范围回catalog |
| why | <https://github.com/backnotprop/pstack>；`skills/decision-log/SKILL.md`；`skills/spec-analyze/SKILL.md`；`workflows/verify-code/SKILL.md`；具体pin/许可范围回catalog |
| multi-phase-plan.md | <https://github.com/backnotprop/pstack>；`skills/spec-plan/templates/phase-template.md`；具体pin/许可范围回catalog |
| refactoring.md | <https://github.com/backnotprop/pstack>；`skills/spec-plan/SKILL.md`；具体pin/许可范围回catalog |
| hillclimb.md | <https://github.com/backnotprop/pstack>；`skills/spec-plan/templates/phase-template.md`；具体pin/许可范围回catalog |
| eval.md | <https://github.com/backnotprop/pstack>；`skills/wh-review/contracts/provider-protocol.md`；`docs/architecture/test-asset-governance-rules.md`；具体pin/许可范围回catalog |

## N6技术分歧草图方法

`skills/poteto-mode/playbooks/prototype.md` 来自 [backnotprop/pstack](https://github.com/backnotprop/pstack)，本地 LICENSE 为 MIT、Copyright (c) 2026 Lauren Tan；沿本文件既有完整 MIT 许可保留。固定原件、归档指纹和采用范围唯一回 catalog 的 `n6-technical-sketch`。提交未证实，镜像带自行改动，不称已绑定上游版本；上游许可链未独立核实。只采用该单文件的隔离观察方法；Feature、exhaust-the-design-space、the control skill及宿主调度器四项未保存，不声称吸收。拒绝代理代选产品偏好和一般免测试；实际消费者读 `AGENTS.md`「卡住与升级」。

## N7交接、收口与交付说明方法

既有方法吸收 addyosmani/agent-skills 的 `skills/git-workflow-and-versioning/SKILL.md`（MIT，Copyright (c) 2025 Addy Osmani，固定commit `aeac41d4d005999432bb7312f7ff06383a91d59d`），以及 backnotprop/pstack 的 `skills/no-comments/SKILL.md`、`skills/ketchup/SKILL.md`、`skills/reflect/SKILL.md`（接受判据另读其 `references/synthesizer.md`）、`skills/recall/SKILL.md`、`skills/poteto-mode/playbooks/opening-a-pr.md`（本地LICENSE为MIT，Copyright (c) 2026 Lauren Tan）。沿本文件既有完整MIT许可与版权声明保留。

pstack固定包SHA256为 `f08746cbd6067834e095332d0a25bdec65529dcfc436809c2cb419717d0363b8`；Git commit unknown，main URL只是取回坐标，镜像上游许可链未独立核实。六项固定文件字节与采用/排除、本地偏离、实际消费者、首验限制唯一回 `skills/catalog.yaml` 的 `n7-*` 条目；`skills/reuse-registry.md`仅导航。本次只补已有采用登记，不新增外部采用、执行依赖或授权，不证明历史首验或N8最终验收通过。
