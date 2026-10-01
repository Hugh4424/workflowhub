# Card-06 迁移表 · 片段 3：skills 与 workflows 面

- 任务：`workflowhub-thin-core-card-06-20260919`（build-plan 文档编制子代理产出；本文件是 `attachments/migration-table.md` 的片段，聚合时按 id 顺序合并）
- 认证 worktree / HEAD：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-06-20260919`（HEAD `054d66c3`）
- 主来源：`quality/evidence/research/2026-09-30-04-skills-workflows-review-chain.md`（§1 skills、§2 wh-review、§3 workflows、§4 R2 清单、§5 G-3）
- 次来源：`2026-09-30-07-ocr-vs-wh-review.md`（OCR 与 wh-review 关系、OI-013 校验机器落点）
- 决策：`decision-log.md` ADR-002/004/013/016/018/019/021（+ ADR-020）
- 执行权威：`phases/P1.md`~`P8.md`（批次内容、write set、DO NOT TOUCH）
- 只读纪律：本片段编制未修改仓库任何文件、未做 git 写操作

## 行格式与约定

| 列 | 约定 |
|---|---|
| id | `MT-3-NNN`（补记行用 `MT-3-A<NNN>`，append-only） |
| path | 仓库相对 POSIX 路径；目录级行以 `/` 结尾 |
| 现有消费者 | 当前真实消费者（非测试优先） |
| 目标消费者 | 删除/收窄后的消费者；DELETE 写「无」 |
| 处置 | `DELETE` / `NARROW` / `SURVIVOR` / `MOVE→新路径` / `NEW`（本片段无 MOVE/NEW） |
| 批次 | `B0/P1`…`B7/P8`；一个 path 只一行一批次（`B<n>/P<n+1>`） |
| 回滚方式 | DELETE → `git checkout backup/card-06-b<n> -- <path>`；有改动的行 → `git revert <B<n> 提交>`；未改动 → `—（未改动）` |
| G-3 | 引用 `G3-NN`（build-plan 合并去重编号）或 `—` |
| card03 | `git diff --name-status main...task/workflowhub/workflowhub-thin-core-card-03-20260919` 命中 = 是 |
| 备注 | 一句话理由/改动要点 |

**关键约定（解析本片段前必读）**

1. **部分改动目录只列被改文件**：同一技能目录下未列出的文件 = 未改动（SURVIVOR），随该目录所属批次的面扫描核对。整目录删除或整目录未改动时用目录级行。
2. **批次含义**：`B2/P3` workflows/steps + skill-deps 去门禁、build-spec/_spike 退役；`B3/P4` 技能文本去 kernel/receipts/hash、wh-review 孤儿删除、stage-handoff 删除；`B4/P5` OCR 合同与回退、审查链剥哈希、公共入口改接（wh-review 脚本哈希机器在此剥离）；`B5/P6` catalog/bundle 双层 hash 与旧 CLI/schema；`B6/P7` runtime 归位与 move-map；`B7/P8` 治理文档与聚合。本片段**无 `B0/P1`、`B1/P2`、`B7/P8` 行**（B0 只新增 runtime/interface；B1 是测试夹具面；B7 是治理文档面）。
3. **ADR-018 裁定**：wh-review 保留为文档审查面（make-decision 方向/细节、build-plan 合并审查、build-prd）正式执行者，并作为「OCR 未安装」时代码审查面的回退执行者。因此 wh-review 只 DELETE 纯转发/重复/孤儿文件（§2.1 已判 5 个）；其余为 SURVIVOR（含只读历史模块）或 NARROW（B4/P5 剥离材料身份哈希/快照绑定/回执 readback/请求锁哈希）。
4. **跨面去重提示**（聚合时按 path 唯一裁定，勿双登）：
   - `workflows/**` 下非 step 的运行模块（`build-code/{capture,targeted-capture,targeted-runner,change-scope,case-reconciliation,case-selection,test-asset-inventory,diff-scanner}.mjs`、`verify-code/{capture,freshness,facts-assembly,metrics-writer,design-alignment}.mjs`）与 `workflows/verify-code/phase-1-contract.test.mjs` 归属存在歧义：前者更贴近 runtime/窄工具面（research 02），后者属测试夹具面（research 05）。本片段按「workflows/** 逐文件」收录前者并加 `跨面候选` 标记；已核对片段 1（runtime）**未**登记这些路径，故此处是唯一登记（删除时需与片段 1 的窄工具②/① 行保持语义一致）。后者已让给片段 5，不占行（§D-4）。
   - `skills/*/skill-bundle.json` 的 hash 字段与 `skills/catalog.yaml` 同属 manifest/schema 面边界，本片段按「skills/**」收录了 bundle 行；若 manifest 面片段另有一行，聚合时保留一行。
5. **结构化问答卡**：`spec-clarify` / `talk-with-zhipeng` / `grill-with-docs` 的 `reply_ref/reply_hash` 属 G3-12（机器校验 DELETE，IO 契约文本保留）。

## A. skills 根文件与各技能

| id | path | 现有消费者 | 目标消费者 | 处置 | 批次 | 回滚方式 | G-3 | card03 | 备注 |
|---|---|---|---|---|---|---|---|---|---|
| MT-3-001 | skills/catalog.yaml | check-skill-closure、workflow-evolution、build-reflection-page、local-skill-resolver | local-skill-resolver、技能登记读者 | NARROW | B5/P6 | `git revert <B5 提交>` | G3-22 | 是 | 删 `local_bundle_hash`/`snapshot_sha256`（45 处）并清理 B3 删除技能的悬空登记；B3~B6 期间悬空属已知中间态（ADR-013）。**与片段 5 重复登记**（MT-6-437 落 B1/P2）：按 spec.md「文件归属」节须合并为一行——hash 字段必须在 `check-skill-closure` 消费链拆除之后删（P6 T024 顺序、片段 1 MT-1-014），故建议合并到 B5/P6 并把 L1008 测试登记一并去掉；见 §D-5 |
| MT-3-002 | skills/reuse-registry.md | 文档消费者（无代码） | 同左 | NARROW | B5/P6 | `git revert <B5 提交>` | G3-22 | 否 | L13/29/53/62-100/158 以 wh-review/3rd-review/skill-deps 为前提，按分工与去 hash 改文 |
| MT-3-003 | skills/.gitkeep | 无 | 无 | SURVIVOR | B3/P4 | `—（未改动）` | — | 否 | 目录占位，无改动 |
| MT-3-004 | skills/anysearch/ | make-decision/skill-deps.yaml | 同左 | SURVIVOR | B3/P4 | `—（未改动）` | — | 否 | 纯可搬运检索 CLI，无 kernel 依赖，bundle 无 hash |
| MT-3-005 | skills/architect-code-review/SKILL.md | 宿主读；verify-code OCR 回退执行者 | 同左 | SURVIVOR | B3/P4 | `git revert <B3 提交>` | — | 否 | R2 §4：L23-24 的 `receipts.review`/`receipts.quality_review` 改纯文本；SD-08 fallback 合同保留 |
| MT-3-006 | skills/architect-code-review/skill-bundle.json | check-skill-closure、skill-bundle-release | 技能加载 | NARROW | B5/P6 | `git revert <B5 提交>` | G3-22 | 否 | 去 sha256/digest 字段（1 处） |
| MT-3-007 | skills/backend-testing/skill-bundle.json | check-skill-closure、skill-bundle-release | 技能加载 | NARROW | B5/P6 | `git revert <B5 提交>` | G3-22 | 否 | 去 hash 字段（1 处）；SKILL.md 未改动 |
| MT-3-008 | skills/debate/skill-bundle.json | check-skill-closure、skill-bundle-release | 技能加载 | NARROW | B5/P6 | `git revert <B5 提交>` | G3-22 | 否 | 去 hash 字段（9 处）；SKILL.md/references 未改动 |
| MT-3-009 | skills/decision-log/SKILL.md | 5 个 stage 的 SK/SJ/SD | 宿主读、阶段材料作者 | SURVIVOR | B3/P4 | `git revert <B3 提交>` | — | 是 | R2 §4：L177/226/241/255 删 `report_ref/report_sha256` 与 decision hash；改普通文件名（SD-17） |
| MT-3-010 | skills/decision-log/templates/decision-log-template.md | decision-log/SKILL.md | 同上 | SURVIVOR | B3/P4 | `git revert <B3 提交>` | — | 是 | L247-257 `<sha256>` 文件名改普通命名 |
| MT-3-011 | skills/decision-log/skill-bundle.json | check-skill-closure、skill-bundle-release | 技能加载 | NARROW | B5/P6 | `git revert <B5 提交>` | G3-22 | 是 | 去 hash 字段（2 处） |
| MT-3-012 | skills/deep-research/SKILL.md | make-decision SK/SD | 宿主读、规划期调研 | SURVIVOR | B3/P4 | `git revert <B3 提交>` | — | 否 | R2 §4：L47-53 内容寻址 `<sha256>.json`、回读校验、`run --action=execute`、`receipts.research` 改普通文件名+纯路径 |
| MT-3-013 | skills/deep-research/skill-bundle.json | check-skill-closure、skill-bundle-release | 技能加载 | NARROW | B5/P6 | `git revert <B5 提交>` | G3-22 | 否 | 去 hash 字段（1 处） |
| MT-3-014 | skills/design-source-readiness/SKILL.md | （原）build-spec SJ/SK/SD | 宿主读（UI 组，B2 后挂 build-plan step 5） | SURVIVOR | B3/P4 | `git revert <B3 提交>` | — | 否 | L14 `content_sha256` anchor 改文；build-spec 退役后需在 build-plan step 5 显式挂接（§1.2） |
| MT-3-015 | skills/diagnosing-bugs/skill-bundle.json | check-skill-closure、skill-bundle-release | 技能加载 | NARROW | B5/P6 | `git revert <B5 提交>` | G3-22 | 否 | 去 hash 字段（4 处） |
| MT-3-016 | skills/frontend-component-quality/ | build-code/build-plan/verify-code SK+SD | 同左 | SURVIVOR | B3/P4 | `—（未改动）` | — | 否 | 脚本与上游材料独立，只需改 skill-deps 绑定（B2/P3） |
| MT-3-017 | skills/frontend-prototype-render/SKILL.md | （原）build-spec SK/SD | 宿主读（UI 组） | SURVIVOR | B3/P4 | `git revert <B3 提交>` | — | 否 | R2 §4：L28-53 `preview_hash/screenshot_hash/material_revision/snapshot_tree/confirmation_hash`、`quality/confirmations/<sha256>.json` 改纯文本；按 ADR-018 组规则不删技能（**争议**：报告倾向 NARROW，见 §D-2） |
| MT-3-018 | skills/frontend-prototype-render/skill-bundle.json | check-skill-closure、skill-bundle-release | 技能加载 | NARROW | B5/P6 | `git revert <B5 提交>` | G3-22 | 否 | 去 hash 字段（1 处） |
| MT-3-019 | skills/frontend-testing/skill-bundle.json | check-skill-closure、skill-bundle-release | 技能加载 | NARROW | B5/P6 | `git revert <B5 提交>` | G3-22 | 否 | 去 hash 字段（1 处） |
| MT-3-020 | skills/fullstack-slice-testing/skill-bundle.json | check-skill-closure、skill-bundle-release | 技能加载 | NARROW | B5/P6 | `git revert <B5 提交>` | G3-22 | 否 | 去 hash 字段（1 处） |
| MT-3-021 | skills/grill-with-docs/SKILL.md | make-decision SJ/SK/SD、build-spec SK | 宿主读、交互技能 | SURVIVOR | B3/P4 | `git revert <B3 提交>` | G3-12 | 否 | L24 `reply_ref/reply_hash`、L70 已认证原始消息 → 去机器校验，保留 IO 契约文本 |
| MT-3-022 | skills/grill-with-docs/skill-bundle.json | check-skill-closure、skill-bundle-release | 技能加载 | NARROW | B5/P6 | `git revert <B5 提交>` | G3-22 | 否 | 去 hash 字段（3 处） |
| MT-3-023 | skills/intake-decision-review/SKILL.md | wh-review `stage-skill-plan.json` 选入 packet | 文档审查面 lens（ADR-018 保留） | SURVIVOR | B3/P4 | `git revert <B3 提交>` | — | 否 | L8-9「only used by wh-review direction track」改文；随 wh-review 文档面保留 |
| MT-3-024 | skills/isolated-browser-qa/SKILL.md | build-code SK | 同左（可搬运 QA 网关） | SURVIVOR | B3/P4 | `git revert <B3 提交>` | — | 否 | R2 §4：L241 `{ref,sha256}` 证据改纯路径；清理脚本只杀自有 pid，保留 |
| MT-3-025 | skills/isolated-browser-qa/skill-bundle.json | check-skill-closure、skill-bundle-release | 技能加载 | NARROW | B5/P6 | `git revert <B5 提交>` | G3-22 | 否 | 去 hash 字段（11 处） |
| MT-3-026 | skills/mini-task/SKILL.md | 宿主读；`task-close execute` 配套 | 宿主读（纯方法 + 窄工具④⑤） | NARROW | B3/P4 | `git revert <B3 提交>` | G3-25 | 否 | L23-31 wh-review 调用与 task-close 读回改窄工具表述；命令动作集合不变 |
| MT-3-027 | skills/mini-task/scripts/mini-task-runner.mjs | SKILL.md、授权/锁调用点 | 窄工具①④⑤ | NARROW | B4/P5 | `git revert <B4 提交>` | G3-25、G3-01 | 是 | 改接 ④ 授权（HEAD 核对/一次性消费）与 ⑤ 锁、① 脏源预检；删除 kernel 快照/stale 绑定，安全检查语义全保留（P5 T018） |
| MT-3-028 | skills/mini-task/skill-bundle.json | check-skill-closure、skill-bundle-release | 技能加载 | NARROW | B5/P6 | `git revert <B5 提交>` | G3-22 | 是 | 去 hash 字段（2 处） |
| MT-3-029 | skills/plan-ceo-review/SKILL.md | （原）build-spec SJ/SK/SD | 文档审查面 lens | SURVIVOR | B3/P4 | `git revert <B3 提交>` | — | 否 | L9「由 wh-review 放进同一 packet」改文（§2.3 lens 文本清单） |
| MT-3-030 | skills/plan-design-review/SKILL.md | （原）build-spec SJ/SK/SD | 文档审查面 lens（UI 组） | SURVIVOR | B3/P4 | `git revert <B3 提交>` | — | 否 | L10「before the final wh-review」改文 |
| MT-3-031 | skills/plan-eng-review/SKILL.md | build-plan SK/SD | 文档审查面 lens | SURVIVOR | B3/P4 | `git revert <B3 提交>` | — | 是 | L11/L47 wh-review 描述改文；Card-03 已改过此文件，改文需叠加 |
| MT-3-032 | skills/requirement-lineage/ | config/workflowhub.yaml:32 登记，无代码消费者 | 无 | DELETE | B3/P4 | `git checkout backup/card-06-b3 -- skills/requirement-lineage/` | — | 否 | 报告 §1.2 建议 DELETE（无真实 consumer）；随附登记删除在 config 面同批（**待裁定**，见 §D-1） |
| MT-3-033 | skills/resolving-merge-conflicts/SKILL.md | core/task-close.mjs、宿主读 | 宿主读（窄工具④配套） | SURVIVOR | B3/P4 | `git revert <B3 提交>` | G3-01 | 否 | L9/L22 `task-close execute` 表述随 ④ 改写同步改文；不可逆 Git 授权语义保留 |
| MT-3-034 | skills/review/ | 5 个 stage 的 SJ/SK/SD、OCR packet `required_skills` | 同左（审查点必留 lens） | SURVIVOR | B3/P4 | `—（未改动）` | — | 否 | 纯 lens，无 kernel/hash 绑定；ADR-014/019 审查点必留 |
| MT-3-035 | skills/simplicity-guard/SKILL.md | build-spec SJ/SK/SD、build-plan SK/SD、OCR packet | 同左（审查点必留 lens） | SURVIVOR | B3/P4 | `git revert <B3 提交>` | — | 是 | L10「放入 wh-review 冻结 packet」改文 |
| MT-3-036 | skills/spec-analyze/SKILL.md | 5 个 stage | 宿主读、阶段末一致性分析 | SURVIVOR | B3/P4 | `git revert <B3 提交>` | — | 否 | R2 §4：L39/58/63-64/105-107/115/134/151 去「atomically writes authenticated result」与快照/材料 revision 绑定 |
| MT-3-037 | skills/spec-analyze/packet-lens.md | spec-analyze/SKILL.md、wh-review packet | 同左 | SURVIVOR | B3/P4 | `git revert <B3 提交>` | — | 否 | 去 packet hash/receipt 措辞，分析要求保留 |
| MT-3-038 | skills/spec-analyze/skill-bundle.json | check-skill-closure、skill-bundle-release | 技能加载 | NARROW | B5/P6 | `git revert <B5 提交>` | G3-22 | 否 | 去 hash 字段（2 处） |
| MT-3-039 | skills/spec-clarify/SKILL.md | build-spec/build-plan/make-decision 等 | 宿主读、交互技能 | SURVIVOR | B3/P4 | `git revert <B3 提交>` | G3-12 | 否 | R2 §4：L16 `reply_ref/reply_hash`、L73「Only the registered transcript may authenticate」改文；IO 契约文本保留 |
| MT-3-040 | skills/spec-clarify/skill-bundle.json | check-skill-closure、skill-bundle-release | 技能加载 | NARROW | B5/P6 | `git revert <B5 提交>` | G3-22 | 否 | 去 hash 字段（1 处） |
| MT-3-041 | skills/spec-plan/SKILL.md | build-plan SJ/SK/SD | 宿主读、spec/phases 作者 | SURVIVOR | B3/P4 | `git revert <B3 提交>` | — | 是 | L144 ref/hash 认证 review 改文；post 主作者保留 |
| MT-3-042 | skills/spec-plan/templates/phase-template.md | spec-plan/SKILL.md | 同左 | SURVIVOR | B3/P4 | `git revert <B3 提交>` | — | 是 | L48 evidence/readback 表述改文（若指 Card-08 回读检查则保留语义） |
| MT-3-043 | skills/spec-plan/templates/plan-template.md | 无（pre 模板，无引用） | 无 | DELETE | B3/P4 | `git checkout backup/card-06-b3 -- skills/spec-plan/templates/plan-template.md` | — | 是 | 报告标 ARCHIVE（pre plan/tasks 双写模板，post 不再生成 plan.md）→ 按本卡归档口径落为删除；**待裁定**，见 §D-1 |
| MT-3-044 | skills/spec-plan/skill-bundle.json | check-skill-closure、skill-bundle-release | 技能加载 | NARROW | B5/P6 | `git revert <B5 提交>` | G3-22 | 是 | 去 hash 字段（2 处） |
| MT-3-045 | skills/spec-prd/SKILL.md | build-prd SJ/SK/SD | 宿主读、PRD 作者 | NARROW | B3/P4 | `git revert <B3 提交>` | G3-18 | 否 | L30-116 四 revision + `displayed_draft_hash` 绑定改为「展示稿 + confirm 人为门」；SD-12 ② 损失在损失清单承认 |
| MT-3-046 | skills/spec-prd/templates/prd-template.md | spec-prd/SKILL.md | 同左 | NARROW | B3/P4 | `git revert <B3 提交>` | G3-18 | 是 | 去 revision/hash 字段（11 处），保留模板结构 |
| MT-3-047 | skills/spec-prd/skill-bundle.json | check-skill-closure、skill-bundle-release | 技能加载 | NARROW | B5/P6 | `git revert <B5 提交>` | G3-22 | 是 | 去 hash 字段（2 处） |
| MT-3-048 | skills/spec-research/skill-bundle.json | check-skill-closure、skill-bundle-release | 技能加载 | NARROW | B5/P6 | `git revert <B5 提交>` | G3-22 | 否 | 去 hash 字段（1 处）；SKILL.md 未改动 |
| MT-3-049 | skills/spec-specify/SKILL.md | build-spec/build-plan | 宿主读、spec.md 作者 | SURVIVOR | B3/P4 | `git revert <B3 提交>` | — | 是 | R2 §4：L26/31-32 `material_revision/snapshot_tree/packet hash` 改文 |
| MT-3-050 | skills/spec-specify/templates/spec-template.md | spec-specify/SKILL.md | 同左 | SURVIVOR | B3/P4 | `git revert <B3 提交>` | — | 是 | 去 hash/revision 字段（6 处），模板结构保留 |
| MT-3-051 | skills/spec-specify/skill-bundle.json | check-skill-closure、skill-bundle-release | 技能加载 | NARROW | B5/P6 | `git revert <B5 提交>` | G3-22 | 是 | 去 hash 字段（2 处） |
| MT-3-052 | skills/spec-tasks/templates/tasks-template.md | 无（pre 模板，无引用） | 无 | DELETE | B3/P4 | `git checkout backup/card-06-b3 -- skills/spec-tasks/templates/tasks-template.md` | — | 是 | 报告标 ARCHIVE（pre tasks 双写模板）→ 归档口径落为删除；**待裁定**，见 §D-1 |
| MT-3-053 | skills/spec-tasks/templates/index-template.md | spec-tasks/SKILL.md | 同左（phases/index.md 指针索引） | SURVIVOR | B3/P4 | `git revert <B3 提交>` | — | 是 | 去 hash/readback 措辞（1 处），指针索引职责保留 |
| MT-3-054 | skills/spec-tasks/skill-bundle.json | check-skill-closure、skill-bundle-release | 技能加载 | NARROW | B5/P6 | `git revert <B5 提交>` | G3-22 | 是 | 去 hash 字段（2 处） |
| MT-3-055 | skills/stage-handoff/ | 4 个 workflow skill-deps（`stage-runner#runStageEndReflection`） | 无 | DELETE | B3/P4 | `git checkout backup/card-06-b3 -- skills/stage-handoff/` | — | 否 | 母 PRD 要求删除「强制 handoff」；跨会话续跑由 Card-08 窄状态集+回读检查承接（P4 T014） |
| MT-3-056 | skills/stage-reflection/SKILL.md | 5 个 SJ 末步 + 5 个 SD | 宿主读（可选方法） | NARROW | B3/P4 | `git revert <B3 提交>` | — | 否 | L95-129/177 删 v2 schema、identity 快照、`run --action=reflect`；改为可选、阶段末写一份普通 md（P4） |
| MT-3-057 | skills/stage-reflection/skill-bundle.json | check-skill-closure、skill-bundle-release | 技能加载 | NARROW | B5/P6 | `git revert <B5 提交>` | G3-22 | 否 | 去 hash 字段（1 处） |
| MT-3-058 | skills/talk-with-zhipeng/SKILL.md | make-decision SK/SD、build-spec/build-plan SK | 宿主读、交互技能 | SURVIVOR | B3/P4 | `git revert <B3 提交>` | G3-12 | 否 | R2 §4：L33/97-98 `reply_ref/reply_hash`、round 生命周期改文；「不预设轮数」保留 |
| MT-3-059 | skills/talk-with-zhipeng/skill-bundle.json | check-skill-closure、skill-bundle-release | 技能加载 | NARROW | B5/P6 | `git revert <B5 提交>` | G3-22 | 否 | 去 hash 字段（1 处） |
| MT-3-060 | skills/test-routing-advisor/skill-bundle.json | check-skill-closure、skill-bundle-release | 技能加载 | NARROW | B5/P6 | `git revert <B5 提交>` | G3-22 | 否 | 去 hash 字段（2 处）；`scripts/route.mjs` 纯函数保留 |
| MT-3-061 | skills/testing-system-blueprint/skill-bundle.json | check-skill-closure、skill-bundle-release | 技能加载 | NARROW | B5/P6 | `git revert <B5 提交>` | G3-22 | 否 | 去 hash 字段（1 处）；SKILL.md 未改动 |
| MT-3-062 | skills/ui-project-init/SKILL.md | （原）build-spec SJ/SK/SD | 宿主读（UI 组） | SURVIVOR | B3/P4 | `git revert <B3 提交>` | — | 否 | L18 `content_sha256` anchor 改文；B2 后需在 build-plan step 5 显式挂接 |
| MT-3-063 | skills/workflowhub-host-protocol/SKILL.md | repo-skills.manifest、stage-runner 注释 | 宿主读（协议说明） | NARROW | B3/P4 | `git revert <B3 提交>` | — | 否 | R2 §4：L10-16/58-64 的 `stage-runtime run --action=execute` 发布与 status 读回改写为「两道人为门 + 5 窄工具 + 纯文本路径」 |
| MT-3-064 | skills/workflowhub-multica-sync/SKILL.md | check-task-record-paths | 宿主读、同步审计 | NARROW | B3/P4 | `git revert <B3 提交>` | G3-17 | 否 | L45/58/92/99/107 主文件 hash/steps.json 三件套描述随 B2/P3 形态改文；同步阻断语义保留 |
| MT-3-065 | skills/workflowhub-multica-sync/scripts/multica-skill-sync.mjs | SKILL.md、check-task-record-paths | 宿主读 | NARROW | B3/P4 | `git revert <B3 提交>` | G3-17 | 否 | L33 7 个 public 命令正则与 L37 提示词块随 B4 公共入口语义复核；**必须保留** `dirty_worktree`/`main_origin_mismatch` 阻断（L368-370）与确认后才改外部 Multica |
| MT-3-066 | skills/workflowhub-multica-sync/skill-bundle.json | check-skill-closure、skill-bundle-release | 技能加载 | NARROW | B5/P6 | `git revert <B5 提交>` | G3-22 | 否 | 去 hash 字段（2 处） |

## B. skills/wh-review/**（逐文件，52 个）

「现有消费者」为 wh-review 目录外的非测试 consumer（research 04 §2.1）。

| id | path | 现有消费者 | 目标消费者 | 处置 | 批次 | 回滚方式 | G-3 | card03 | 备注 |
|---|---|---|---|---|---|---|---|---|---|
| MT-3-067 | skills/wh-review/SKILL.md | 3 个 workflow skill-deps、catalog.yaml、repo-skills.manifest | 宿主读、OCR 回退执行者 | NARROW | B3/P4 | `git revert <B3 提交>` | — | 是 | 按 ADR-018 改写为「文档审查面执行者 + OCR 未装时代码面回退者」，删「过渡基线」表述（P4 T015） |
| MT-3-068 | skills/wh-review/manifest.json | 无（登记） | 技能登记读者 | NARROW | B3/P4 | `git revert <B3 提交>` | — | 否 | 去 build-spec 合同登记与旧 CLI 命令描述，与 ADR-018 分工一致 |
| MT-3-069 | skills/wh-review/skill-bundle.json | 3 个 skill-deps（bundle 字段）、check-skill-closure | 技能加载 | NARROW | B5/P6 | `git revert <B5 提交>` | G3-22 | 是 | 去 sha256/digest 字段（30 处，ADR-013） |
| MT-3-070 | skills/wh-review/stage-skill-plan.json | review-materials.mjs:15、check-skill-closure、material-workspace | 文档面 + OCR packet 的 lens 选择 | NARROW | B3/P4 | `git revert <B3 提交>` | — | 否 | 删 build-spec track（B2/P3 已退役）；**consumer 显式改为 OCR 适配 + 文档面，禁止换名搬进 runtime/review**（R1/AC-32 风险） |
| MT-3-071 | skills/wh-review/contracts/build-code.md | review-materials.mjs:2198（写入 packet） | OCR reviewer 合同（ADR-021） | NARROW | B4/P5 | `git revert <B4 提交>` | — | 否 | 现正文是「当前普通流程」描述（L17-20 `receipts.review`/`quality_review`、`review --action=record`）而非审查合同；ADR-021 要求补进 OCR 包 → 需在 B4 改写为 reviewer 合同（**与 P5 T020「合同文件本身不改」冲突**，见 §D-2） |
| MT-3-072 | skills/wh-review/contracts/build-plan.md | review-materials | 文档面合并审查合同 | NARROW | B4/P5 | `git revert <B4 提交>` | G3-11 | 否 | L13/22/38-39 manifest SHA-256/`material_id`/snapshot 绑定与 accepted_risk 机器绑定文本剥离；审查指令保留 |
| MT-3-073 | skills/wh-review/contracts/build-prd.md | review-materials | 文档面 build-prd 审查合同 | SURVIVOR | B4/P5 | `—（未改动）` | — | 否 | 无 hash/receipt 命中；随 build-prd 文档面保留（ADR-018） |
| MT-3-074 | skills/wh-review/contracts/build-spec.md | review-materials | 无（build-spec 已退役） | SURVIVOR | B5/P6 | `—（未改动）` | G3-11 | 否 | pre build-spec 审查合同，B2/P3 后无 consumer；报告标 ARCHIVE → 只读保留。**建议改 DELETE（待裁定）**，见 §D-1 |
| MT-3-075 | skills/wh-review/contracts/make-decision.md | review-materials、CONTEXT.md | 文档面方向/细节审查合同 | NARROW | B4/P5 | `git revert <B4 提交>` | — | 否 | L3/13/16-17/46 `snapshot_tree`/`material_id`/`semantic hash`/`interaction_hash` 文本剥离；方向/细节两 track 指令保留 |
| MT-3-076 | skills/wh-review/contracts/mini-task-design.md | review-materials | mini-task 审查合同 | NARROW | B4/P5 | `git revert <B4 提交>` | G3-11 | 否 | L15-16 accepted_risk「真实用户风险确认」绑定随机器删除改文；finding 处置语义保留 |
| MT-3-077 | skills/wh-review/contracts/mini-task-implementation.md | review-materials | mini-task 审查合同 | NARROW | B4/P5 | `git revert <B4 提交>` | G3-11 | 否 | L7/12-13/27/31 snapshot/review/hash 绑定文本剥离 |
| MT-3-078 | skills/wh-review/contracts/provider-protocol.md | review-materials.mjs:2204（写入 packet） | OCR + 文档面 reviewer 输出协议 | SURVIVOR | B4/P5 | `—（未改动）` | — | 否 | T020 原路径读入 OCR 包、不复制不改名；正文含 material_id 定义（L9/50-55/65）——若 B4 剥哈希则须同步改文（见 §D-2） |
| MT-3-079 | skills/wh-review/contracts/verify-code.md | review-materials | OCR reviewer 合同（ADR-021） | NARROW | B4/P5 | `git revert <B4 提交>` | G3-11 | 否 | L17-22 `material_revision`/`material_id`/字节哈希/stage-runtime 校验与 `dsh-code-review` canonical 表述须改；审查重点 7 条与固定顺序保留；**含 ADR-021 fallback 语义，与 T020「不改」冲突**（§D-2） |
| MT-3-080 | skills/wh-review/contracts/workflowhub-result.v1.json | review-provider-client（legacy） | 同左（broker 协议只读） | SURVIVOR | B4/P5 | `—（未改动）` | — | 否 | v1 legacy 协议，manifest 未登记为当前契约；只读保留 |
| MT-3-081 | skills/wh-review/contracts/workflowhub-result.v2.json | review-provider-client、manifest legacy | 3rd-review broker 协议 | NARROW | B4/P5 | `git revert <B4 提交>` | — | 否 | L7 `material_id` 64-hex 必填属材料身份哈希；去必填需与跨仓 3rd-review broker 同步（T019 coverage limit 之外）→ 见 §D-3 |
| MT-3-082 | skills/wh-review/contracts/workflowhub-result.v3.json | review-provider-client、manifest `provider_result_contract` | 3rd-review broker 协议 | NARROW | B4/P5 | `git revert <B4 提交>` | — | 否 | 同 v2；当前 provider 结果契约，去 material_id 哈希需 broker 同步（§D-3） |
| MT-3-083 | skills/wh-review/scripts/ac-evidence-summary.mjs | review-materials | verify-code OCR 的 AC 摘要校验 | NARROW | B4/P5 | `git revert <B4 提交>` | — | 否 | 去 `task-kernel-implementation#validateAcceptanceEvidence` 依赖（kernel 在 B4 删除）；AC 摘要事实逻辑保留 |
| MT-3-084 | skills/wh-review/scripts/integration-review-subject.mjs | check-task-record-paths | 无 | DELETE | B3/P4 | `git checkout backup/card-06-b3 -- skills/wh-review/scripts/integration-review-subject.mjs` | — | 否 | 19 行纯转发 shim（runtime 同名模块）；ADR-019 集成审查已停派 |
| MT-3-085 | skills/wh-review/scripts/lib/safe-id.mjs | 仅 skill-bundle.json:69 登记 | 无 | DELETE | B3/P4 | `git checkout backup/card-06-b3 -- skills/wh-review/scripts/lib/safe-id.mjs` | — | 否 | 孤儿：全仓无 importer |
| MT-3-086 | skills/wh-review/scripts/review-input-bounds.mjs | 无 | 无 | DELETE | B3/P4 | `git checkout backup/card-06-b3 -- skills/wh-review/scripts/review-input-bounds.mjs` | — | 否 | 与 `runtime/review/review-input-bounds.mjs` 逐字节相同（重复） |
| MT-3-087 | skills/wh-review/scripts/review-materials.mjs | stage-runtime.mjs:74（`buildReviewMaterials`/`validateVerifyAcceptanceSummary`，OCR 使用） | 文档面 + OCR packet 组装 | NARROW | B4/P5 | `git revert <B4 提交>` | G3-15 | 否 | 保留 realpath/symlink/nlink 校验（L1119）、原子写（L1184）与 `redactProviderHostPaths`（L2151）；删 manifest 字节/hash 绑定（L1426-1452）与 `freezeCanonicalEvidence` 回执 readback 前置（L2283-2294） |
| MT-3-088 | skills/wh-review/scripts/review-output.mjs | wh-review 内部 | 无 | DELETE | B3/P4 | `git checkout backup/card-06-b3 -- skills/wh-review/scripts/review-output.mjs` | — | 否 | 1 行 re-export（runtime/review/review-output.mjs） |
| MT-3-089 | skills/wh-review/scripts/review-provider-client.mjs | simple-review-runner、wh-review-cli、provider-smoke | 文档面 broker 客户端 | NARROW | B4/P5 | `git revert <B4 提交>` | G3-15 | 是 | 保留 spawn 与私有路径/secret 脱敏（L55-58、L174-180、L897）；去 material_id/route hash 校验（L474/602/1769 对应机器在 T019 剥离） |
| MT-3-090 | skills/wh-review/scripts/review-result.mjs | wh-review 内部 | 只读历史 | SURVIVOR | B4/P5 | `—（未改动）` | G3-11 | 否 | 旧结果写入（canonical-receipt-writer）+ accepted_risk；转只读、无新写者（报告标 ARCHIVE） |
| MT-3-091 | skills/wh-review/scripts/review-runner.mjs | wh-review-cli | 只读历史 | SURVIVOR | B4/P5 | `—（未改动）` | — | 否 | 旧 runner；随 wh-review-cli 保留入口只读（报告标 ARCHIVE） |
| MT-3-092 | skills/wh-review/scripts/review-semantic-projection.mjs | wh-review 内部 | 只读历史 | SURVIVOR | B4/P5 | `—（未改动）` | — | 否 | 语义投影；转只读（报告标 ARCHIVE） |
| MT-3-093 | skills/wh-review/scripts/review-source.mjs | stage-runtime.mjs:73（`captureReviewSource`，OCR 使用） | 同左（工作区 diff 采集） | NARROW | B4/P5 | `git revert <B4 提交>` | G3-15 | 否 | 保留 source/target realpath 边界（L69/206/220）；删 `captureExecutionSnapshot`/`snapshotTree`（L105-181）与 git-worktree-snapshot 依赖 |
| MT-3-094 | skills/wh-review/scripts/schema-validator.mjs | wh-review 内部 | 无 | DELETE | B3/P4 | `git checkout backup/card-06-b3 -- skills/wh-review/scripts/schema-validator.mjs` | — | 否 | 1 行 re-export（runtime/review/schema-validator.mjs） |
| MT-3-095 | skills/wh-review/scripts/simple-review-runner.mjs | stage-runtime.mjs:66（`runSimpleReview`，L1865/1951 非 OCR 默认 runRound）、run-wh-review-audit-e2e | 文档审查面执行者（ADR-018） | NARROW | B4/P5 | `git revert <B4 提交>` | G3-13、G3-15 | 是 | 保留文档面派发与脱敏；删 material_id 重建/比对（L474/602/1769）、managed status identity、脱敏以外 hash；信号/中断处理保留（G3-13） |
| MT-3-096 | skills/wh-review/scripts/third-review-host-config.mjs | stage-runtime.mjs:75（`loadTrustedThirdReviewConfig`，OCR 与旧链都用）、simple-review-runner | 同左（可信宿主配置加载） | NARROW | B4/P5 | `git revert <B4 提交>` | G3-16 | 是 | **保留** `atomicReplace`（L75-78）与预期 hash 守卫的用户 `~/.config` 配置迁移/恢复（L26-151）、realpath/symlink 校验；只删其余 route/config hash |
| MT-3-097 | skills/wh-review/scripts/wh-review-cli.mjs | runtime/distribution/runner-release.mjs、mini-task-runner | mini_task 改接后仅保留必要分支 | NARROW | B4/P5 | `git revert <B4 提交>` | G3-25 | 是 | 旧 CLI 入口；mini-task 改接窄工具④⑤后删 `mini_task.*` 分支，`build_prd` 分支随文档面保留（是否整体转只读待 P5 裁定） |
| MT-3-098 | skills/wh-review/__tests__/human-brief-behavioral.test.mjs | — | 同左 | NARROW | B4/P5 | `git revert <B4 提交>` | — | 否 | 文档审查面行为测试；去哈希/快照断言（保留人类简报语义断言） |
| MT-3-099 | skills/wh-review/scripts/__tests__/ac-evidence-summary.test.mjs | — | 同左 | NARROW | B4/P5 | `git revert <B4 提交>` | — | 否 | 随 ac-evidence-summary 去 kernel 依赖改断言 |
| MT-3-100 | skills/wh-review/scripts/__tests__/channel-fixtures.test.mjs | — | 同左 | NARROW | B4/P5 | `git revert <B4 提交>` | — | 否 | provider channel 夹具；去 hash/回执断言 |
| MT-3-101 | skills/wh-review/scripts/__tests__/detail-minimum-input.test.mjs | — | 同左 | NARROW | B4/P5 | `git revert <B4 提交>` | — | 否 | make-decision detail track（文档面保留）；去 material_id 断言 |
| MT-3-102 | skills/wh-review/scripts/__tests__/integration-review-subject.test.mjs | — | 无 | DELETE | B3/P4 | `git checkout backup/card-06-b3 -- skills/wh-review/scripts/__tests__/integration-review-subject.test.mjs` | — | 否 | 随 DELETE 的 shim（084）与 ADR-019 集成审查停派一并删除；**非**「功能测试」，不属规则 2 保护范围 |
| MT-3-103 | skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs | — | 同左 | NARROW | B4/P5 | `git revert <B4 提交>` | — | 否 | 方向审查（文档面保留）；去 hash/pair 身份断言 |
| MT-3-104 | skills/wh-review/scripts/__tests__/material-redaction.test.mjs | — | 同左（**守护脱敏**） | NARROW | B4/P5 | `git revert <B4 提交>` | G3-15 | 是 | 脱敏职责保留，只删哈希/材料身份断言；若脱敏迁位须随迁（G3-15） |
| MT-3-105 | skills/wh-review/scripts/__tests__/provider-output-contract.test.mjs | — | 同左 | NARROW | B4/P5 | `git revert <B4 提交>` | — | 否 | reviewer 输出协议（finding schema/严重级）保留；去 v3 material_id 断言 |
| MT-3-106 | skills/wh-review/scripts/__tests__/review-provider-client-timeout.test.mjs | — | 同左 | NARROW | B4/P5 | `git revert <B4 提交>` | — | 是 | 客户端超时语义保留；去 hash/route 断言 |
| MT-3-107 | skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs | — | 同左 | NARROW | B4/P5 | `git revert <B4 提交>` | — | 是 | v3 协议组快照断言保留；material_id 必填断言随 v2/v3 处置调整（§D-3） |
| MT-3-108 | skills/wh-review/scripts/__tests__/review-runner.test.mjs | — | 同左 | NARROW | B4/P5 | `git revert <B4 提交>` | — | 否 | 旧 runner 只读；去 hash/回执写断言 |
| MT-3-109 | skills/wh-review/scripts/__tests__/review-semantic-projection.test.mjs | — | 同左 | NARROW | B4/P5 | `git revert <B4 提交>` | — | 否 | 语义投影只读；去 hash 断言 |
| MT-3-110 | skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs | — | 同左 | NARROW | B4/P5 | `git revert <B4 提交>` | G3-11 | 否 | 旧 receipt writer + accepted_risk；去 task-handle/kernel 绑定断言，保留 accepted_risk 语义断言 |
| MT-3-111 | skills/wh-review/scripts/__tests__/schema-validator.test.mjs | — | 同左 | NARROW | B4/P5 | `git revert <B4 提交>` | — | 否 | shim（094）删除后改 import 指 `runtime/review/schema-validator.mjs`（P6 DO NOT TOUCH：runtime/review/schemas 保留） |
| MT-3-112 | skills/wh-review/scripts/__tests__/simple-contracts.test.mjs | — | 同左 | NARROW | B4/P5 | `git revert <B4 提交>` | — | 是 | 文档面简单合同测试保留；去 hash/回执断言 |
| MT-3-113 | skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs | — | 同左 | NARROW | B4/P5 | `git revert <B4 提交>` | — | 否 | simple-review-runner（保留）端到端故障语义；去 material_id/route hash 断言 |
| MT-3-114 | skills/wh-review/scripts/__tests__/simple-reliability.red.test.mjs | — | 同左 | NARROW | B4/P5 | `git revert <B4 提交>` | — | 否 | 可靠性 RED 断言保留；删哈希断言 |
| MT-3-115 | skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs | — | 同左 | NARROW | B4/P5 | `git revert <B4 提交>` | — | 是 | 文档面执行者功能测试（规则 2：SURVIVOR/NARROW，不删）；去哈希断言 |
| MT-3-116 | skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs | — | 同左 | NARROW | B4/P5 | `git revert <B4 提交>` | G3-16 | 是 | 宿主配置原子写/预期 hash/realpath 负例**保留**；只删已剥离的 route hash 断言 |
| MT-3-117 | skills/wh-review/scripts/__tests__/wh-review-cli-bounds.test.mjs | — | 同左 | NARROW | B4/P5 | `git revert <B4 提交>` | — | 否 | bounds 断言改指 `runtime/review/review-input-bounds.mjs`（086 删除后） |
| MT-3-118 | skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs | — | 同左 | NARROW | B4/P5 | `git revert <B4 提交>` | G3-25 | 是 | CLI 入口保留分支（build_prd/文档面）断言保留；删 mini_task 旧 wh-review 调用断言 |

## C. workflows/**（逐文件）

仓库 `git ls-files workflows` 共 37 个文件，本表登记 36 个；`workflows/verify-code/phase-1-contract.test.mjs` 属测试夹具面（research 05），见 §D-4。

| id | path | 现有消费者 | 目标消费者 | 处置 | 批次 | 回滚方式 | G-3 | card03 | 备注 |
|---|---|---|---|---|---|---|---|---|---|
| MT-3-119 | workflows/.gitkeep | 无 | 无 | DELETE | B2/P3 | `git checkout backup/card-06-b2 -- workflows/.gitkeep` | — | 否 | 目录非空（报告标「可选删除」） |
| MT-3-120 | workflows/_spike/intake.mjs | 仅 check-task-record-paths:133 白名单 | 无 | DELETE | B2/P3 | `git checkout backup/card-06-b2 -- workflows/_spike/intake.mjs` | — | 否 | archived spike fixture，无真实 consumer；git 历史可追溯 |
| MT-3-121 | workflows/_spike/design.mjs | 同上 | 无 | DELETE | B2/P3 | `git checkout backup/card-06-b2 -- workflows/_spike/design.mjs` | — | 否 | 同上 |
| MT-3-122 | workflows/_spike/design-variant.mjs | 同上 | 无 | DELETE | B2/P3 | `git checkout backup/card-06-b2 -- workflows/_spike/design-variant.mjs` | — | 否 | 同上 |
| MT-3-123 | workflows/make-decision/SKILL.md | 宿主读 | 宿主读（纯方法说明） | NARROW | B2/P3 | `git revert <B2 提交>` | — | 否 | R2 §4（L116/123-127/140/170-172/272/366/408）；写明 confirm 仅在本 stage 收口、三审查点位置；删 reflect/sha256/`stage-handlers#researchFacts`/`ref+sha` |
| MT-3-124 | workflows/make-decision/steps.json | step-manifest、stage-runner、stage-skill-runtime、stage-content-contracts、stage-agent-outcome-adapter、portable-workflow-run、check-skill-closure、skill-bundle-release、multica-sync、44 测试 | 宿主读（极简清单） | NARROW | B2/P3 | `git revert <B2 提交>` | — | 否 | 只留 `step_id`/`step_slug`/`observable_result`；删 `entry_conditions`/`completion_evidence`（step 3 `<sha256>.json`、step 8 `source/hash`）/线性 `depends_on`、step 13 stage-reflection |
| MT-3-125 | workflows/make-decision/skill-deps.yaml | stage-skill-runtime、stage-runner、stage-agent-outcome-adapter、check-skill-closure、runner-release、skill-bundle-release、clean-install、host-protocol、29 测试 | doctor（capability）+ 宿主读 | NARROW | B2/P3 | `git revert <B2 提交>` | — | 否 | 删 `consumer.target/inputs/identity/result`、`bundle`、`owner`；保留 `{name,path,trigger}`；`runtime_capabilities`/`external_capabilities` 保留并加 `ocr-cli`（ADR-021）；`wh-review-provider` 按 ADR-018 保留；删 6 处 `receipts.*` 与 reflection/handoff 绑定 |
| MT-3-126 | workflows/build-plan/SKILL.md | 宿主读 | 宿主读（纯方法说明） | NARROW | B2/P3 | `git revert <B2 提交>` | — | 是 | R2 §4（L52/64/71-73/138/217/232-246/303）；删 broker request/`wh-review` adapter 派发描述，保留合并审查点位置（wh-review 执行）；已认证 worktree/`quality/confirmations/<sha256>.json` 改纯文本 |
| MT-3-127 | workflows/build-plan/steps.json | 同 124 各组 | 同 124 | NARROW | B2/P3 | `git revert <B2 提交>` | G3-11 | 否 | 去 step 2 `<sha256>.json`、step 9 `attempts/<attempt_id>/attempt.json` 与 owner=wh-review 机器字段、step 10 accepted_risk 机器校验（语义保留）、step 11 `oracle-provenance-prewritten-irreversible` 认证名、step 12 `quality/confirmations/<sha256>.json`、step 13 reflection |
| MT-3-128 | workflows/build-plan/skill-deps.yaml | 同 125 各组 | 同 125 | NARROW | B2/P3 | `git revert <B2 提交>` | — | 否 | 同 125 规则；5 处 receipts 删；`stage-content-contracts#validateComponentQualityMap` 等 consumer target 删；wh-review 条目按 ADR-018 保留 |
| MT-3-129 | workflows/build-code/SKILL.md | 宿主读 | 宿主读（纯方法说明） | NARROW | B2/P3 | `git revert <B2 提交>` | — | 是 | R2 §4（L28/35-39/56/103-122/158-179/186-192/204/217/222-229）；写明 build-code 每 phase 审查走 OCR、未装回退 wh-review（ADR-021，取代「禁止把 wh-review 当 fallback」表述）；删逐项读回/`run --action=reflect`/sha256/`status --action=begin`/`receipts.review` |
| MT-3-130 | workflows/build-code/steps.json | 同 124 各组 | 同 124 | NARROW | B2/P3 | `git revert <B2 提交>` | — | 是 | 去 step 11 `authenticate-current-task-completion`、step 6「official handler/private runner」、step 8 `run receipts.review`、step 15 reflection；card03 只改了 steps 9/11 文案，此处需叠加 |
| MT-3-131 | workflows/build-code/skill-deps.yaml | 同 125 各组 | 同 125 | NARROW | B2/P3 | `git revert <B2 提交>` | — | 否 | 同 125 规则；3 处 `receipts.tests` 删；consumer target 删；OCR 相关 capability 加 `ocr-cli` |
| MT-3-132 | workflows/build-code/capture.mjs | stage-runner、stage-runtime、case-reconciliation | 窄工具② | NARROW | B4/P5 | `git revert <B4 提交>` | G3-14 | 否 | 多层 manifest/case/raw 哈希链改②事实回执；真实 exit/output 与失败归因语义保留（跨面候选：runtime/窄工具面） |
| MT-3-133 | workflows/build-code/targeted-capture.mjs | capture.mjs | 窄工具② | NARROW | B4/P5 | `git revert <B4 提交>` | G3-14 | 否 | 去 stage-runtime 与 receipt 包装，改接②（跨面候选） |
| MT-3-134 | workflows/build-code/targeted-runner.mjs | targeted-capture.mjs | 窄工具②执行核心 | NARROW | B4/P5 | `git revert <B4 提交>` | G3-14 | 否 | **保留** spawn 前 safeTarget 路径包含校验、拒 `..`/绝对路径、8MiB 输出上限；去哈希（跨面候选） |
| MT-3-135 | workflows/build-code/change-scope.mjs | stage-runtime、stage-runner、capture | 窄工具① | NARROW | B4/P5 | `git revert <B4 提交>` | G3-08 | 否 | 去 task-handle/kernel 依赖与 `execution_manifest_hash` 自校验；范围改为 `git diff --name-status <baseline>` + untracked（跨面候选） |
| MT-3-136 | workflows/build-code/case-reconciliation.mjs | stage-runner、stage-runtime、capture | 无 | DELETE | B4/P5 | `git checkout backup/card-06-b4 -- workflows/build-code/case-reconciliation.mjs` | — | 否 | acceptance-evidence-validator/哈希链/快照树绑定（跨面候选） |
| MT-3-137 | workflows/build-code/case-selection.mjs | 多个 | 窄工具②（选 case） | NARROW | B4/P5 | `git revert <B4 提交>` | — | 否 | 纯函数；是否保留取决于②是否需要 case 选择（**PENDING**，见 §D-1；跨面候选） |
| MT-3-138 | workflows/build-code/test-asset-inventory.mjs | 多个 | 窄工具② | NARROW | B4/P5 | `git revert <B4 提交>` | — | 否 | 去 git-worktree-snapshot 依赖（**PENDING**；跨面候选） |
| MT-3-139 | workflows/build-code/diff-scanner.mjs | 仅 check-task-record-paths 白名单（B1 删） | 无 | DELETE | B4/P5 | `git checkout backup/card-06-b4 -- workflows/build-code/diff-scanner.mjs` | — | 否 | 唯一引用随 B1/P2 删除；若 build-code scan-diff 步骤实际使用则改 SURVIVOR（**待裁定**，见 §D-1；跨面候选） |
| MT-3-140 | workflows/build-prd/SKILL.md | 宿主读 | 宿主读（纯方法说明） | NARROW | B2/P3 | `git revert <B2 提交>` | G3-18 | 否 | 删 L81-110 `kernel.publishCanonicalRecord` 代码片段与 readback hash 校验整段；step 5 确认改为「展示稿 + confirm 人为门」；四 revision 与展示稿 hash 绑定 DELETE（G3-18，SD-12 ② 损失在损失清单承认） |
| MT-3-141 | workflows/build-prd/steps.json | 同 124；另有 `portable-workflow-run.mjs:10-41` 6 slug 硬编码 | 同 124 | NARROW | B2/P3 | `git revert <B2 提交>` | G3-18 | 否 | 6/6 步 `portable-workflow-outcomes/build-prd/<sha256>.json`、step 5 四 revision+`displayed_draft_hash`+`human_approved`、step 6 raw-byte SHA/validated readback、step 6 handoff 全删；`portable-workflow-run` 硬编码随 runtime 删（B4） |
| MT-3-142 | workflows/build-prd/skill-deps.yaml | 同 125 各组 | 同 125 | NARROW | B2/P3 | `git revert <B2 提交>` | — | 否 | 最轻：删 `consumer.target=build-prd#orchestrate` 等字段 |
| MT-3-143 | workflows/build-spec/SKILL.md | 宿主读（pre） | 无 | DELETE | B2/P3 | `git checkout backup/card-06-b2 -- workflows/build-spec/SKILL.md` | — | 是 | pre 整体退役（ADR-002）；git 历史 + `backup/card-06-b2` 即只读归档；AGENTS.md 中 accepted_risk owner=build-spec 属 G3-11，文本由 B7 改 |
| MT-3-144 | workflows/build-spec/steps.json | 同 124 各组（pre） | 无 | DELETE | B2/P3 | `git checkout backup/card-06-b2 -- workflows/build-spec/steps.json` | — | 否 | 同上；其 15 步锁随文件消失 |
| MT-3-145 | workflows/build-spec/skill-deps.yaml | 同 125 各组（pre） | 无 | DELETE | B2/P3 | `git checkout backup/card-06-b2 -- workflows/build-spec/skill-deps.yaml` | — | 否 | 同上；含 wh-review 条目与 8×`stage-handlers#` |
| MT-3-146 | workflows/verify-code/SKILL.md | 宿主读 | 宿主读（纯方法说明） | NARROW | B2/P3 | `git revert <B2 提交>` | — | 否 | R2 §4（L26/33-37/82/135/158-160/170-189/204/217）；删 reflect/sha256/canonical 读回/`receipts.quality_review`/`receipts.confirmation`/`run --action=preflight`；fallback 表述改 ADR-021（未装 OCR 回退 wh-review） |
| MT-3-147 | workflows/verify-code/steps.json | 同 124 各组 | 同 124 | NARROW | B2/P3 | `git revert <B2 提交>` | G3-11 | 否 | 去 steps 2/3/9/10 canonical result_ref/读回、2 处 receipts、step 7 accepted_risk 机器校验（语义保留）、step 12 reflection |
| MT-3-148 | workflows/verify-code/skill-deps.yaml | 同 125 各组 | 同 125 | NARROW | B2/P3 | `git revert <B2 提交>` | — | 否 | 同 125 规则；reflection→stage-runner 绑定删；`ocr-cli` capability 加（ADR-021） |
| MT-3-149 | workflows/verify-code/capture.mjs | stage-runtime、case-reconciliation | 窄工具② | NARROW | B4/P5 | `git revert <B4 提交>` | G3-14 | 否 | receipt writer 薄包装改②（跨面候选） |
| MT-3-150 | workflows/verify-code/freshness.mjs | 无（此前命中的是 runtime/evidence/freshness.mjs） | 无 | DELETE | B4/P5 | `git checkout backup/card-06-b4 -- workflows/verify-code/freshness.mjs` | — | 否 | freshness 属校验机器，无生产 consumer（跨面候选） |
| MT-3-151 | workflows/verify-code/facts-assembly.mjs | 无 | 无 | DELETE | B4/P5 | `git checkout backup/card-06-b4 -- workflows/verify-code/facts-assembly.mjs` | — | 否 | 孤儿（跨面候选） |
| MT-3-152 | workflows/verify-code/metrics-writer.mjs | 无（导入 metrics/collector.mjs） | Card-09 写入量（待确认） | SURVIVOR | B6/P7 | `—（未改动）` | — | 否 | 与 Card-09 写入量有关，先确认 Card-09 是否需要（**PENDING**，见 §D-1；跨面候选） |
| MT-3-153 | workflows/verify-code/design-alignment.mjs | verify-code/SKILL.md | 同左（UI 组） | NARROW | B4/P5 | `git revert <B4 提交>` | — | 否 | 去 `stage-content-contracts` kernel 依赖；UI 设计对齐方法保留（跨面候选） |
| MT-3-154 | workflows/verify-code/isolated-browser-qa.md | verify-code/SKILL.md | 同左 | SURVIVOR | B3/P4 | `—（未改动）` | — | 否 | 方法文档；QA 网关仍可搬运 |

## D. 未裁定 / 需 append-only 补记的行

| 编号 | 行 | 争点 | 建议 |
|---|---|---|---|
| D-1 | MT-3-032、MT-3-043、MT-3-052、MT-3-074、MT-3-137、MT-3-138、MT-3-139、MT-3-152 | 报告标签为 PENDING/ARCHIVE（无 ARCHIVE 取值） | 032/043/052 已按「无 consumer 即删」落 DELETE；074 保守落 SURVIVOR（建议改 DELETE）；137/138/139/152 按 PENDING 落 NARROW/SURVIVOR，批前须 grep 复核后再定 |
| D-2 | MT-3-017、MT-3-071、MT-3-078、MT-3-079 | `frontend-prototype-render` 报告倾向 NARROW 而 ADR-018 组规则落 SURVIVOR；`build-code.md`/`verify-code.md` 需按 ADR-021 改为 reviewer 合同，但 P5 T020 写明「wh-review 合同文件本身不改」 | 保持 SURVIVOR/NARROW 现状并**扩入 P5 T019/T020 的 write set**，否则 ADR-021 的合同补齐只搬进一份「流程描述」而非审查合同 |
| D-3 | MT-3-081、MT-3-082、MT-3-107 | `contracts/workflowhub-result.v2/v3.json` 的 `material_id` 64-hex 是外部 3rd-review broker 协议字段，跨仓；T019 coverage limit 明示不含 broker 内部 | 需用户/broker 侧确认后再执行；若不能同步则降级为 SURVIVOR 并 append-only 补记 |
| D-4 | `workflows/verify-code/phase-1-contract.test.mjs` | 位于 `workflows/**` 但属测试夹具面（research 05 §测试面）；`workflows/build-code/__tests__` 目录不存在（package.json `test:root` 引用了它） | 由测试夹具面片段登记；本片段不重复占行（避免 ledger 路径唯一冲突）。`package.json test:root` 的悬空目录引用归 CLI/测试入口面 |
| D-5 | MT-3-001 vs 片段 5 MT-6-437 `skills/catalog.yaml` | 同 path 双登：本片段 NARROW **B5/P6**（hash 字段），片段 5 NARROW **B1/P2**（L1008 测试登记 + hash 字段） | 按 `spec.md` 关键实体「文件归属：批次列唯一，多批次共享文件合并到一批次，会打断存活消费者则推后」→ 合并为一行落 **B5/P6**（片段 1 MT-1-014 与 P6 T024 都要求先拆 check-skill-closure 消费链再删 hash 字段），L1008 登记一并去掉；若保留 B1/P2，则该行**不得**含 hash 字段删除 |
| D-6 | MT-3-098~118 的 21 个 `skills/wh-review/**/__tests__/*` | 与片段 5 重复登记（MT-6-052~077 区段），两片段处置与批次完全一致（integration-review-subject DELETE B3/P4，其余 NARROW B4/P5） | 聚合时保留片段 5 的行（测试夹具面主登、备注更全）并删除本片段这 21 行；本片段保留的 wh-review 行 = 非测试 31 个文件 |

### G-3 引用索引（本片段用到的编号）

- G3-01 不可逆授权核对 HEAD/一次性消费（窄工具④）；G3-08 工作区核对（窄工具①）；G3-11 accepted_risk 机器部分 DELETE（语义保留）；G3-12 结构化问答卡机器校验 DELETE（IO 契约文本保留）；G3-13 审查信号/中断与派发去重；G3-14 真实命令 exit/output 采集（窄工具②）；G3-15 review 路径脱敏/symlink/nlink/realpath 保留（只删哈希）；G3-16 third-review-host-config 原子写+预期 hash 保留；G3-17 multica-sync 同步阻断保留；G3-18 build-prd revision/hash 绑定 DELETE；G3-22 catalog/bundle 双层 hash；G3-25 mini-task-runner NARROW 改接。
- 其余行无安全职责，记 `—`。

### 计数（154 行）

| 处置 | A. skills | B. wh-review | C. workflows | 合计 |
|---|---|---|---|---|
| DELETE | 4 | 6 | 11 | 21 |
| NARROW | 34 | 39 | 23 | 96 |
| SURVIVOR | 28 | 7 | 2 | 37 |
| 合计 | 66 | 52 | 36 | 154 |

- 本片段无 `NEW`、无 `MOVE→` 行。
- 未逐列文件的说明见文首约定 1：部分改动技能目录只列被改文件，其余文件未改动（SURVIVOR），共 51 个此类文件（如 `skills/debate/{SKILL.md,pk-rules.ts,…}`、`skills/isolated-browser-qa/scripts/*`）。
- 冻结前提：本片段随 `attachments/migration-table.md` 合并后由用户确认提交，该提交即冻结点；首个删除提交必须晚于它（FR-51/FR-52）。
