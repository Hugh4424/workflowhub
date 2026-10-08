---
name: spec-plan
description: Author implementation design in spec.md and independent Phase files for post-cohort build-plan.
---

# Spec Plan

读者：build-plan 的工程设计与 Phase 作者。
读完要能：定位本文件的责任、写作动作、来源与失败边界。

## Post-cohort authoring contract

本节回答：How to write independent Phase deltas against one global spec.

Read the confirmed `decision-log.md`, current `spec.md`, and verified current code facts. `spec.md` owns the global product contract **and implementation design**: code anchors, chosen solution, interfaces, global file boundary, dependency graph, source → FR → AC → Phase → oracle trace, risks, rollback, and testing strategy. Extend its implementation design section in place; preserve its product narrative and acceptance criteria.

This skill is the sole Phase engineering author. Write one independent `phases/P<n>.md` file per Phase using `templates/phase-template.md`. A Phase contains only its implementation delta and a stable pointer to the global goal in `spec.md`, not a copy of the global design or another Phase.

A superseded full-text body does not stay in this file either; the superseded text is carried by git and the existing archives, not by rewriting the live file in place. This skill also renders the pure pointer index after authoring the independent Phases; use the index method below. Existing callers of `spec-tasks` remain readable until their owning migration moves them; this responsibility absorption alone does not authorize their deletion. No post-cohort `plan.md` or `tasks.md` writer exists; pre-cohort and archived files are read-only.

Each Phase owns L0 outcome, executable human-readable L1 contract, removable L2 reference, exact write set, dependency, test design and oracle, coverage limit, STOP condition, done evidence, and rollback.

Within L1, write an executable card for **every** Task using `templates/phase-template.md`. One Task is one user-perceivable delivery increment: consecutive steps of the same deliverable belong in one card's step sequence, not in separate cards. A one-line task list or Phase-level command is not a substitute for task inputs, exact code anchors/actions, outputs, paired RED/GREEN, failure oracle, evidence, and recovery. Keep actual execution status in task facts; authored cards describe intent, not invented completion.

Task IDs are unique across the entire task, not per Phase. Assign `T001`, `T002`, … in `phases/index.md` Phase order and within-Phase execution order; the next Phase continues after the previous Phase's last ID. A Task dependency may name only an earlier Phase or already-defined Task. Continue the global sequence in every Phase.

## Task graph 与 tracer bullet

Task 卡描述 task graph：每张卡在现有依赖字段明确写 `blocked_by` 的含义——哪些较早 Phase/Task 必须完成后才能开始；无阻塞写明「无，可立即开始」。阻塞边必须对应真实输入或交付依赖，不因编号相邻就制造依赖。frontier 是阻塞已满足的 Task；共享写集仍串行，不新增机器字段或调度器。

- **tracer bullet**：一张卡切穿本交付实际涉及的 schema / API / UI / tests，形成窄但完整、可独立演示或验证的用户可见增量。不存在的层说明不适用，方法文档也沿真实输入→产物→消费者切片。规模以新独立上下文能完成为准，不按层横切；同一交付的连续步骤不拆成假独立票。
- **prefactor**：真实代码事实证明某准备改动能让实施更简单时，先交付这项准备；给明确输出、消费者与阻塞边，不为未来假设加基础设施。
- **expand–contract**：机械宽重构无法逐纵切独立落绿时，先并存新旧形态，再按 blast radius 分批迁真实调用者；各迁移依赖 expand，最后 contract 依赖全部迁移，仅零当前调用后删除。若连批次也不能各自落绿，写清同一 integration 分支及最终整合验证的实际范围，不能把中间态说成全绿；保现 Phase/Task 形态，不建 tracker 或第二工件根。

在既有计划确认展示 Task 标题、blocked_by、用户可见结果、粒度与真实接缝；已接受的计划不重复询问。每候选 seam 一行说明能抓到什么、漏掉什么；先复用现有最高行为接缝，确认记录可读后才写其测试。接口仍存疑才交现确认澄清，不自答。期望值来自独立真相源，禁从实施重算期望；执行一条纵切 test → 最小实现 → 下一条，horizontal slicing 不替行为循环。refactor 属于 review 阶段，不属于 red–green 循环。

## Design and boundary

本节回答：How to choose reuse and declare verified file/interface ownership.

Choose reuse, then narrow extension, then new mechanism with stated consumer, owner, test, and removal condition. Record verified interfaces and failure behavior. Unknown facts stay `unknown` with owner and next action. Declare global NEW, MODIFY, and DO NOT TOUCH exact paths in `spec.md`. Every Phase write set is a subset of that boundary; each implementation path has one Phase owner. Order producers before consumers. Parallel work requires independent inputs, dependencies, and file ownership. Declare individual paths, not directory-wide or glob write sets.

When authoring each Phase's scope and write set, run the same self-check with `simplicity-guard`'s core questions — has this layer earned its place, and can an existing capability carry it — record any shrink, retire, or reuse decision in that Phase's existing 非目标 line, and let the existing `plan-eng-review` reading report the deletion-class count (count only; no quota).

凡写入 DO NOT TOUCH、或依赖「外部尚未改动」的受保护文件，计划里必须留下核实那一刻的实读结果：文件路径、读到的字段/签名/版本项**逐字清单**、读取所用的命令或工具、日期。字段个数、必填项、版本项这类断言只能来自实读，不能来自记忆、推断或上游摘要——上游摘要是线索，不是证据。实读结果与已有断言不一致时，先改断言再继续；本轮无法实读就写 `unknown`，并写明 owner 与下次核实动作。计划里出现「恰含 N 个字段」「签名未变」「只依赖既有接口」这类句子而没有实读记录时，按未核实处理。

Trace every current source requirement, FR, and AC to a Phase, Task, and objective oracle. Read the original requirement as well as the decision: a compact decision summary is not proof that every requested behavior reached the plan. Check both directions: every in-scope source has implementation and a failure oracle, and every task has an authorized source. A mere ID occurrence is not coverage. Resolve an omitted source before calling the plan executable. A direction-changing gap returns to `make-decision`; a product-detail gap returns to the owning `spec-specify`/`spec-clarify` step. Continue unaffected planning and same-task repair.

## Test design and quality

本节回答：How to preserve target RED, paired GREEN and independent review facts.

For each applicable behavior change, build-plan authors a real executable test before implementation, runs its scoped `gate_cmd`, and preserves actual RED evidence. RED is valid only when the named target assertion fails, not setup/environment/configuration; a planned command or unrelated nonzero is not RED. Freeze that test and any scoring logic in DO NOT TOUCH. A later test change needs an explicit change request, reason, previous evidence, and independent review; build-code changes implementation to make the same test/oracle GREEN without silently relaxing assertions.

Every behavior Task records tier, concrete testing skill, scenario/input, fixture or service, command, expected exit, oracle, test path, actual RED ref or honest unavailable, GREEN evidence path, coverage limit, and STOP.

G-2 for pure documentation or exploratory work permits N/A only with a concrete reason, risk, objective alternative (prefer a falsifiable check), and acceptance disclosure; do not manufacture a failure. The final aggregate is an ordinary Phase task, not a new gate.

计划里每一条红测都必须同时写下归因：目标行为失败 / 夹具或环境失败 / 本来就通过；只写命令与期望退出码不算写完。

Cross-check the original requirement, decision, `spec.md`, every `phases/P<n>.md`, and generated `phases/index.md` for omissions, contradictions, cycles, duplicated bodies, boundary widening, and two-way traceability. Perform an execution dry-run on each Task card: can an implementer using only current spec, index, and that Phase identify the first symbol to inspect, the first edit, target RED, GREEN, negative case, and recovery without inventing a product choice? Repair any no. Independent findings review and final `spec-analyze` are quality facts, not work permits. Preserve partial and unavailable facts honestly; repair valid findings in this task.

Return the actual spec/Phase paths and the design/verification limits. Read current required materials directly; missing input is unavailable with impact and next action, not empty content. No packet hash, snapshot or actual independent review receipt is a prerequisite.

## Pure pointer index

独立 Phase 写完后，读取当前 decision-log、spec 与每个 `phases/P<n>.md` 的实际契约头，渲染 `phases/index.md`。模板使用一次预置的条件指针：`templates/index-template.md` 已实际存在且已登记在本技能 `skill-bundle.json` 时使用该附件；否则读取现有 `skills/spec-tasks/templates/index-template.md` 的形状。迁移后自然走前一分支，不需再改本正文。两附件均不可读时报告 unavailable、具名 owner 与下一动作，不凭未来路径捏模板。

每个连续有序的 Phase 恰一行；保 `## Execution Index` 与现行 `阶段` / `权威引用` 列，引用形如 `P1` → `phases/P1.md`。每行只从契约头取 stable authority path、semantic anchor、exact write set、Phase dependency 与真实 downstream consumer，并与物理 Phase 对齐。它是可再生导航，不承载 L0/L1/L2、命令、oracle、证据路径、Task 程序、执行状态或完成权威；这些留原 owner。

完成时核 index 与独立 Phase 一一对应、连续顺序、依赖可解析无环、各写集与其头一致，并返回行数和缺权威清单。缺失或歧义报 unavailable 与原 Phase owner，保现历史 pre/tasks 只读；不生成 fallback 正文或双写 tasks.md。

## Writing rules

本节回答：How each Phase stays complete without repeating the global contract. 这是写作指引，不是质量门。

1. Each Task card writes only its own increment; reference shared definitions and global design by anchor.
2. For agent-document writing, read the sole 「技能写作规范（WR001）」 section in `skills/spec-specify/SKILL.md` when present. Until that section is available, retain the current writing rules and supplied sources. Write the conclusion, then evidence, then exceptions and risks; use one topic per paragraph and name actions directly.
3. Preserve conditions, quantifiers, negations and failure meaning; concise writing never replaces a full executable Task card.
4. Use original evidence paths instead of copying output; keep actual execution facts in task facts.
5. Treat literal lists as exceptions only for DO NOT TOUCH or dependencies on external files that are still unchanged, as required by the verified boundary paragraph above; keep locked wording and machine-read headings/labels unchanged.

## 补充材料

本节回答：Where to locate the shared specification and authoring examples. Read the current spec and the existing phase template; use only verified source anchors.

## 固定来源与本地偏离

参考 [mattpocock/skills](https://github.com/mattpocock/skills) 固定 commit `b0618bc436ad893b3c5e84e55fba86586d34a404`：`skills/engineering/to-tickets/SKILL.md` 的 tracer bullet/blocking/prefactor/expand–contract、`skills/engineering/tdd/SKILL.md` 的先确认接缝与独立期望/纵切循环、`skills/engineering/codebase-design/SKILL.md` 的窄接口与可测试接缝；写作源为 `skills/productivity/writing-for-agents/SKILL.md` 与 `SKILL-MECHANICS.md`。

本地保全独立 Phase、全局递增 Task、单 spec 设计、冻结 RED/GREEN、逐字边界实读与全部失败/覆盖/回退条件；只吸收方法，不采用外部 tracker、ready-for-agent 标签、.scratch 票文件或宿主 setup/Skill 硬依赖。索引原职责由本技能承接，旧调用与附件按各自 owner 迁完再删。迭代时核上述固定子文件的更新与更优候选，记录源差和本地偏离后决定采用，不自动追 HEAD。输入是实际项目材料和允许写目标，缺宿主能力返回 unavailable，不绑定本任务路径/账号。
