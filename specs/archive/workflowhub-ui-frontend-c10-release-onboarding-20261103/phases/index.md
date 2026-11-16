# C10 六段独立规划索引

本文件只指向当前六份独立Phase，完成权威仍在各Phase及原任务facts。
Phase是可独立交付验收的一段；本轮草稿未确认、生产未实施。
写集、依赖和消费者从各Phase契约头重建，不保存命令/判据/状态。

## Execution Index

| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |
| --- | --- | --- | --- | --- | --- |
| `P1` | `phases/P1-scratch-lifecycle.md` | `这一 Phase 交出什么？` | `skills/spec-plan/SKILL.md`；`skills/spec-plan/templates/phase-template.md`；`workflows/build-plan/SKILL.md`；`tests/contract/phase-scratch-lifecycle.test.mjs`；`docs/architecture/move-map.json` | none | 所有后续临时夹具作者、P4发布作者与独立验收者 |
| `P2` | `phases/P2-safe-onboarding.md` | `这一 Phase 交出什么？` | `runtime/evidence/storage-root.mjs`；`runtime/distribution/config-bootstrap.mjs`；`runtime/distribution/precheck.mjs`；`runtime/distribution/config-bootstrap.test.mjs`；`runtime/distribution/precheck.test.mjs`；`tools/cli/onboard-release.mjs`；`tools/cli/stage-runtime.mjs`；`config/workflowhub.config.template.json`；`config/workflowhub.yaml`；`tests/contract/onboard-release.test.mjs`；`tests/contract/precheck-entry.test.mjs`；`docs/architecture/move-map.json` | P1 | P4完整发布作者、P5文档作者与新维护者 |
| `P3` | `phases/P3-terminal-close.md` | `这一 Phase 交出什么？` | `workflows/build-code/SKILL.md`；`workflows/build-code/skill-deps.yaml`；`workflows/build-code/steps.json`；`skills/catalog.yaml`；`tests/contract/knowledge-graph-stage-wiring.test.mjs`；`tests/contract/stage-closeout-step-contract.test.mjs`；`tests/contract/stage-closeout-skill.test.mjs`；`tests/contract/terminal-close-consumption.test.mjs`；`docs/architecture/move-map.json` | P2 | P4发布闭包作者、build-code终末caller与独立关闭读者 |
| `P4` | `phases/P4-versioned-release.md` | `这一 Phase 交出什么？` | `tools/cli/build-release.mjs`；`tools/cli/build-skill-manifests.mjs`；`runtime/distribution/update-check.mjs`；`runtime/distribution/update-check.test.mjs`；`tools/cli/onboard-release.mjs`；`package.json`；`package-lock.json`；`repo-skills.manifest.json`；`external-skills.manifest.json`；`docs/release-support-matrix.md`；`docs/external-skills-compat-matrix.md`；`tests/contract/release-tree.test.mjs`；`tests/contract/skill-manifests.test.mjs`；`docs/architecture/move-map.json` | P1、P2、P3 | P5 README作者、P6安装验证者与发布维护者 |
| `P5` | `phases/P5-readme-coldread.md` | `这一 Phase 交出什么？` | `README.md` | P4 | 新维护者与P6最终安装验证者 |
| `P6` | `phases/P6-installed-acceptance.md` | `这一 Phase 交出什么？` | `tests/acceptance/c12-update-chain.mjs`；`tests/acceptance/installed-release-flow.test.mjs`；`docs/architecture/move-map.json` | P1、P2、P3、P4、P5 | 用户、原终末caller与后续发布维护者 |

## 并行与合并从哪里读？

阶段1/2/3各自独立交付；新增文件先登记共用move-map，按1→2→3真实writer串行。
第二批阶段4消费前三段交付，接口和共享路径顺序见其文件责任节。
第三批阶段5消费完整包；第四批阶段6消费成稿和全部首判，只补必要未闭环。
共享onboard-release/move-map由阶段2先、阶段4后；catalog由阶段3先、阶段4消费。
README阶段4只读、阶段5独占写，阶段6只重建最终包；不另存第二判断。
首判归属与预算只指向spec Appendix A及各Phase验收节。

## 旧编号怎样对照？

表内阶段1至6对应P1至P6；原九工作包来源在spec需求追踪，不是九Phase配额。
旧五份被本任务新版规划替代，原字节保在已存在的stash和合主线原件，不进入当前索引。
