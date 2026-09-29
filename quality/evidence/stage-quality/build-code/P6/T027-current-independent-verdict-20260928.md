# T027 / AC-19 独立样例核验（2026-09-28）

**结论：AC-19 的纯文档样例层成立；P6、CARD-04 整体及样例 Task 的交付和关闭均未因此完成。** 本次是独立只读复核，未修改样例工作树、测试、正式 Task facts 或历史原件，也未重跑检查。独立样例是完整 Task `workflowhub-readme-post-materials-20260927`，不是 CARD-04 内的一项文档子工作。

## 身份与用户授权

- 样例 Task 外置根目录：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-readme-post-materials-20260927`；工作树：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-readme-post-materials-20260927`。`task.json` 中的 task_id、post cohort 与工作树分支 `task/workflowhub/workflowhub-readme-post-materials-20260927` 相符；当前 HEAD 为 `ef920f1fbd415fe87d50930359059b661e141acd`。
- 当前四份 Task Markdown 材料为 `decision-log.md`、`spec.md`、`phases/P1.md`、`phases/index.md`，SHA-256 分别为 `719e610dfb0b820172503b058cdf981a8d7a7db04006f388407c155bb5512b00`、`94b3c2f7d57e521d1485cb29a0219e5841792bcd6211725d6d07939b0a5e3187`、`e19ea2b5c875f4987701d08c0cc0f8e9d7b6c324ccc7efe0f1180f20d1a2c1d1`、`ef673471b84fc3a03d4659e7a23b7658d231ab10745060a2ad8385dfe26f0fb5`；索引和正式事实记录的当前材料版本均为 `revision-d43f7d604df67472eb43b8785214dc004458d482c5193f659da2f3b59e10a5bb`，工作树快照为 `1a9ecaba6730ef0c0ed83f66bb3e6034651ae0d7`。
- 用户答复「可以，就改这一行」只授权 README post 一行。样例 Task `decision-log.md` 的 R-005、D-001/D-002 没有把外置检查办法冒称为用户逐字批准；检查是为满足 CARD-04 AC-19 的实施选择。

## 文档差分与语义

- `git status` 只有 `README.md` 修改和本 Task `specs/workflowhub-readme-post-materials-20260927/` 新材料；材料目录实有四份 Markdown。`git diff --numstat -- README.md` 为 `1 1`，前后 `README.md` 完整 SHA-256 分别为 `674c41729729ebc4aaa3152a1daf6ded76107a4069224cf41e29e73655c138a6`、`37279127d7b8a02bc65a512c7f9838eff1a36b40cc9417e84e199db7b470d173`。仓库产品差分只改 post 一行；pre 一行不变；没有 runtime、工具或仓库测试改动。外置 `.mjs` 是检查原件，不属于仓库产品差分。
- 旧行错误声称 post 的 build-plan 写 `spec.md`、`plan.md`、`tasks.md`；新行写 `spec.md`、独立 `phases/P<n>.md`、纯指针 `phases/index.md`。独立读回 `runtime/task/material-workspace.mjs` 的 `POST_BASE_MATERIAL_FILES` 与 `materialFilesForCohort("post")`，以及 `docs/standard-workflow.md:14-15,35,245,251`，均支持新行。外置检查脚本不仅比对字面，还检查这两处来源和 pre 旧路线；语义核对范围只到这一行及这两个当前来源。

## 可失败检查及正式事实

- 外置索引 `quality/evidence/card04-ac19-readme-evidence-index.json` 的 SHA-256 为 `1c1a214dc6580e2112d0dc47296516c00eeaef4ea99393076e87408af6a2c05b`。本次把其中 22 个带 ref/hash 的文件逐一重算，全部存在且哈希相符。
- 同一外置检查脚本 `quality/evidence/readme-post-materials-check.mjs` SHA-256 `704274831658937bd3f89a42207a4177ecdf55e71c05f8a4507304a71064e225`。正式元数据 `quality/evidence/readme-post-materials-formal-stage-runs.json` 记录相同命令：旧 README 目标断言失败、其余五项通过、exit 1；修后六项通过、exit 0。两份原始输出分别为 `quality/evidence/readme-post-materials-build-plan-red.txt`（SHA-256 `29943d233a4c8a4016fda38e6a6bdd776c8e59a0f5ccceaedf7c993db5315782`）和 `quality/evidence/readme-post-materials-build-code-green.txt`（SHA-256 `844848bc1bcf068092d9f4eb71eedc5b34e31acb78fb908d7717f4aab64a23b7`），内容确为上述一项目标 FAIL→六项 PASS。正式历史命令数组仍是同一作者记录，不能单独证明当时实际命令身份；当前官方验收另实际调用同一 checker 对保存旧 README 和当前 README 取 RED/GREEN，并核 checker 前、中、后哈希及输出。此项见 `phases/P1.md` 的 `acceptance_data`、外置 `quality/facts/b692b0898646b6f715573e09849efafdfe9f22d2b7c7814bd8a340002e723d6e.json` / `e597138d6083d55dfe8e7f2f9e4b4c6d4b8778fb8f44a7cd0f3436f5c5797a8b.json`，两项状态 `passed`。
- 样例 Task 的正式 `build-code` 和 `verify-code` 最近一次 run 各为 `completed/passed`；独立审查结果分别为 `quality/reviews/results/build-code-simple-abff84c4-47e4-509c-a75e-937466b07e07.json`、`quality/reviews/results/verify-code-simple-67da33ef-fa45-5f5a-ad97-8aba87ef180a.json`。build-code findings 均有处置记录，原 findings 未删。审查指出脚本缺参数时可能误用当前目录，这是真实限制；本样例正式调用均显式给出 Task 工作树路径，该缺陷不推翻本次一行文档的目标 RED/GREEN。审查还指出历史 RED 未现场钉住两份生产来源文件哈希；外置 `quality/evidence/readme-source-byte-reconciliation.json` 明说这一限制，当前官方验收用当前来源重跑旧/新 README，不能把后补核对冒充历史身份。

## 风险与边界

- 样例选择了 AC-19 允许的**可失败检查**路线，不需要另造这项样例的 G-2 豁免。CARD-04 make-decision 期间已有另一项真实 G-2 豁免（`decision-log.md` 的 `### G-2 豁免记录`）；不得因本样例成立而把那项历史豁免或风险写成“没有例外”。本 Task `spec.md` 的「风险和证据界限」与 `decision-log.md` 的「风险与延期交接」已披露字符串检查的范围、缺审查/复盘时不冒称整 Task 完成、无交付/关闭授权。
- 外置索引显示样例 Task 的 make-decision 和 build-plan run quality 仍 `incomplete`；build-code 留 `stage-end-spec-analyze:material_incomplete`、`phase_review:missing` 建议，四阶段 delivery/close 均 `unavailable`，复盘执行也有不可用项。这些不能写成完整工作流或已交付，但 AC-19 原判据是**一个真实纯文档 Task 有可失败检查或有披露的豁免**；它没有把交付、关闭或四阶段全绿设为样例前置。故只认可 AC-19 样例层，不认可样例 Task 总体关闭，更不认可 CARD-04 P6/整卡完成。
- 本次没有重跑 checker；当前源码若再变化，应重新核 Task 与来源身份。P13 汇总如需引用外置 Task 证据，必须用可认证的 task-owned 引用/摘要，不能把跨 Task 路径伪装成当前 CARD-04 原件。旧 P13 只读候选因 `outside_authenticated_roots` 拒绝外置索引，仍是事实；本裁决不会自动消除该校验限制。
