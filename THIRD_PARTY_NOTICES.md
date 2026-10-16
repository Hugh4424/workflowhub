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

- **Addy Osmani Agent Skills**, Copyright (c) 2025 Addy Osmani. Source: [addyosmani/agent-skills@aeac41d4d005999432bb7312f7ff06383a91d59d](https://github.com/addyosmani/agent-skills/tree/aeac41d4d005999432bb7312f7ff06383a91d59d). N1吸收 `skills/observability-and-instrumentation/SKILL.md` 与 `skills/performance-optimization/SKILL.md` 的问题/原数自验、同条件复跑纪律；不引入遥测平台或收益判断。
- **pstack**, Copyright (c) 2026 Lauren Tan. Source: [backnotprop/pstack](https://github.com/backnotprop/pstack). 固定实际读取包 SHA256 `f08746cbd6067834e095332d0a25bdec65529dcfc436809c2cb419717d0363b8`、`skills/principle-explain-the-number/SKILL.md` SHA256 `cd5a25f9e7cf023627ccb470dc5faa97542f29b4319496a32b839a8e1e988047`；commit未证实，不能以API短HEAD冒包绑定。N1吸收数字的范围/缺项解释，不引入profiler或收益打分。

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

## Apache-2.0 source

- **AnySearch Skill**, copyright © 2026 AnySearch. Source: [anysearch-ai/anysearch-skill@db3d76e](https://github.com/anysearch-ai/anysearch-skill/commit/db3d76e5597aec7261257be5322dd211c9d9bb87). 历史登记声称Apache-2.0；本次固定commit完整tree无LICENSE/NOTICE，README亦未找到grant，故版本绑定与授权依据unknown。不得把本地后补文件当该版本已核许可。完整许可见 [`skills/anysearch/LICENSE`](skills/anysearch/LICENSE)，notice 见 [`skills/anysearch/NOTICE`](skills/anysearch/NOTICE)。

本 notice 不表示 workflowhub 引入了上述完整框架。gstack runtime、Superpowers bootstrap 等明确拒绝项不在发布闭包中；列出它们是为了记录被吸收的思想和后续更新裁决。

UI delivery governance（`frontend-testing`、`isolated-browser-qa`、计划模板和 browser-qa evidence）是
workflowhub 对现有技能的本地合同扩展，不引入新的第三方执行器；owner、consumer 和删除条件见
[`skills/catalog.yaml`](skills/catalog.yaml) 与 [`skills/reuse-registry.md`](skills/reuse-registry.md)。
The browser QA contract is owned by the existing `isolated-browser-qa` consumer path.

## 许可更正与待核边界

AgentHub固定commit `258f5a2548fa8cc15325c6aa18dd107c1fc497b9` 的 [LICENSE](https://github.com/Hugh4424/AgentHub/blob/258f5a2548fa8cc15325c6aa18dd107c1fc497b9/LICENSE) 实际声明modified Apache-2.0，并附加第三方hosted/embedded商业服务需书面授权/商业许可、frontend logo及copyright不得移除等条件；旧MIT登记不实。五项测试技能的具体采用章节见catalog。抽取技能文字对这些条件的适用性仍unknown；来源维护者需权利owner确认具体grant。本次仅更正事实，没有接受附加条款或扩大既有采用/分发范围。

AnySearch固定版本Apache-2.0 grant、pstack历史包与commit绑定、本地用户来源缺snapshot各自保持具体unknown；来源维护者取回权利依据/原件后再核，不能用其他版本或文件名补证。Vercel固定README声明MIT，本地保留MIT文本但其与固定原文字节的绑定未证；该19行摘要不建立vendored指纹。N2的 `content_sha256` 仅适用于真正vendored对象；默认复算、漂移检测和回填仍由N10接线，本次未生效。
