# Third-Party Notices

workflowhub 包含或改编下列第三方项目的部分技能文字、规则或设计思想。完整逐技能映射、固定 commit、路径和本地修改见 [`skills/catalog.yaml`](skills/catalog.yaml) 与 [`skills/reuse-registry.md`](skills/reuse-registry.md)。

## MIT-licensed sources

- **Superpowers**, copyright © 2025 Jesse Vincent. Source: [obra/superpowers@d884ae0](https://github.com/obra/superpowers/tree/d884ae04edebef577e82ff7c4e143debd0bbec99).
- **Matt Pocock Skills**, copyright © 2026 Matt Pocock. Source: [mattpocock/skills@66898f6](https://github.com/mattpocock/skills/tree/66898f60e8c744e269f8ce06c2b2b99ce7660d5f/skills).
- **gstack**, copyright © 2026 Garry Tan. Source: [garrytan/gstack@7c9df1c](https://github.com/garrytan/gstack/tree/7c9df1c568a9ea745508f679a329332b2c338063).
- **debate**, copyright © 2026 Zhipeng. Source: [Hugh4424/debate@af121a1](https://github.com/Hugh4424/debate/tree/af121a1e24ae3af48f5e132d3de1342d16eccf31).
- **AgentHub**, source: [Hugh4424/AgentHub@258f5a2](https://github.com/Hugh4424/AgentHub/tree/258f5a2548fa8cc15325c6aa18dd107c1fc497b9).
- **Spec Kit**, source: [github/spec-kit@b7e67f5](https://github.com/github/spec-kit/commit/b7e67f55bf7a937aaa57dbe0a8198774e285de3a). 该固定版本是首次 workflowhub 改造提交之前可验证的上游版本。
- **DeepSeek Harness**, source: [deepseek-ai/deepseek-harness@99f6f02](https://github.com/deepseek-ai/deepseek-harness/tree/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/.agents/skills). WorkflowHub 将 `dsh-code-review` 与 `dsh-find-simplifications`、`dsh-doc-standards`、`dsh-prose-standard`、`dsh-trim-cot-leakage` 的规则合并为一次 verify-code 代码审查调用；未引入 push、merge、翻译、归档或 GIF 运行时。
- **Vercel React Best Practices**, source: [vercel-labs/agent-skills@dd089a8](https://github.com/vercel-labs/agent-skills/tree/dd089a8c752c966dee8bf0f27cb625ba193ffd9e/skills/react-best-practices). WorkflowHub 只读保存 compiled guide，作为 React/Next 的内部组件质量 lens；保留本地 `skills/frontend-component-quality/upstream/react-best-practices/LICENSE` 与 `UPSTREAM.md`，不创建第二执行器或 gate。

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

## Apache-2.0 source

- **AnySearch Skill**, copyright © 2026 AnySearch. Source: [anysearch-ai/anysearch-skill@db3d76e](https://github.com/anysearch-ai/anysearch-skill/commit/db3d76e5597aec7261257be5322dd211c9d9bb87). 仓内首次导入的 `SKILL.md` 与运行脚本已逐 blob 对上该版本；随后补入上游许可证文件。完整许可见 [`skills/anysearch/LICENSE`](skills/anysearch/LICENSE)，notice 见 [`skills/anysearch/NOTICE`](skills/anysearch/NOTICE)。

本 notice 不表示 workflowhub 引入了上述完整框架。gstack runtime、Superpowers bootstrap 等明确拒绝项不在发布闭包中；列出它们是为了记录被吸收的思想和后续更新裁决。

UI delivery governance（`frontend-testing`、`isolated-browser-qa`、计划模板和 browser-qa evidence）是
workflowhub 对现有技能的本地合同扩展，不引入新的第三方执行器；owner、consumer 和删除条件见
[`skills/catalog.yaml`](skills/catalog.yaml) 与 [`skills/reuse-registry.md`](skills/reuse-registry.md)。
The browser QA contract is owned by the existing `isolated-browser-qa` consumer path.
