---
name: build-spec
version: 2.0.0
description: Turn the agreed direction into a structured spec that is the single source of truth for requirements. Orchestrates spec-specify → spec-clarify → constitution check → baseline comparison → auto-advance on 3rd-review pass (auto-advance stage, no human pause).
---

# build-spec

## Goal

Translate the decision log from `make-decision` into a full spec via an orchestrated pipeline. The spec becomes the sole authority that later stages (plan, code, verify) refer to.

## 全局参数与产出约定

### 环境变量与参数约定（FR-TRACKING-001/002，FR-TASKDIR-001）

#### WORKFLOWHUB_TASK_DIR

全局环境变量 `WORKFLOWHUB_TASK_DIR` 约定所有阶段跟踪文件的存储根目录（即 task_tracking_root）。实际路径解析通过 `core/task-dir-parser.mjs` 完成（优先级：`WORKFLOWHUB_TASK_DIR` 环境变量 → `config/workflowhub.yaml` 的 `task_dir` 字段 → 两者均缺失则 fail-loud 非零退出）：

- **优先级 1**：`WORKFLOWHUB_TASK_DIR` 环境变量（已设置且非空时直接使用）
- **优先级 2**：`config/workflowhub.yaml` 的 `task_dir` 字段（yaml fallback）
- **两者均缺失**：fail-loud，非零退出，明确报错；无默认路径，不静默降级
- **禁止绕过（FR-TRACKING-002）**：所有 stage（包括 spec-specify、spec-clarify 等）必须通过 `core/task-dir-parser.mjs` 获取跟踪文件路径，禁止硬编码绝对跟踪路径

#### --task-dir 参数约定（FR-TASKDIR-001）

`--task-dir` 控制本次运行的任务目录，所有输入/产物路径均基于它推导：

- **路径推导**：`{task-dir}/decision-log.md` 为输入；`specs/{task-id}/` 为产物目录
- **参数缺失时**：回退到 `tasks/{task-id}/` 默认路径并记录 warn（不依赖 cwd 猜测）
- **严禁 cwd 猜测**：路径推导不得依赖当前工作目录

**task_dir parser (AC-16)**: 在读取或写入任何任务跟踪文件前，必须通过 `core/task-dir-parser.mjs` 获取基础路径，禁止硬编码 `tasks/{task-id}/` 或 `specs/{task-id}/`。

```javascript
// AC-16 consumable call — grep: parseTaskDir
import { parseTaskDir } from "./core/task-dir-parser.mjs";
const taskDir = parseTaskDir(); // priority: WORKFLOWHUB_TASK_DIR env var → config/workflowhub.yaml task_dir; both absent → fail-loud
```

本 skill 中所有 `specs/{task-id}/` 路径均为速记写法，运行时必须使用 `path.join(taskDir, taskId, ...)` 构造实际路径。

---

### Spec 三层结构要求（FR-STRUCTURE-001/002）

build-spec 产出的 spec.md 必须按以下三层结构组织：

- **层 1 — 速读卡**（文件顶部 30 行内）：一句话需求 + 核心改动，让读者 30 秒看懂
- **层 2 — 正文**：问题陈述 / 背景 / FR / AC / 影响范围
- **层 3 — 附录**：质量事实契约 / Known Gaps / 设计决策

**Known Gaps 段（FR-STRUCTURE-002）**：spec.md 中 Known Gaps 段必须存在（可为空列表），记录本次有意留白、未覆盖或留待后续的事项。

---

### FR-{DOMAIN}-NNN 编号格式（FR-NUMBERING-001）

build-spec 产出的所有功能需求必须使用 `FR-{DOMAIN}-NNN` 格式：

- **DOMAIN**：大写领域缩写（BUILD/CONTRACT/LADDER/STRUCTURE/SELFCHECK/REVIEW/BEHAV/FRICTION/TASKDIR/TRACKING/NUMBERING/ACCOUNT/ARTIFACT/COMM/SCOPETRIAGE/ALIGN）
- **NNN**：3 位数字（001 起）
- **示例**：`FR-BUILD-001`，`FR-SELFCHECK-002`

---

### AC 计数与 spec-acceptance-count.json 产出（FR-ACCOUNT-001）

build-spec 完成后必须产出 `specs/{task-id}/spec-acceptance-count.json`，内容：

```json
{
  "ac_count": <int>,
  "fr_count": <int>,
  "counted_at": "<ISO8601 string>"
}
```

- 三字段（`ac_count`、`fr_count`、`counted_at`）不可为 null
- `counted_at` 为产出时刻 ISO8601 时间戳
- 计数方法：grep spec.md 统计 AC- 和 FR- 条目数

---

## What to do

### 0. Pre-read: decision-log

Read `{--task-dir}/decision-log.md` — the upstream `make-decision` output (default path when `--task-dir` absent: `tasks/{task-id}/decision-log.md`, per FR-TASKDIR-001). Extract the functional description, recorded decisions, and constraints. If the file is missing or the description is empty, stop and report "decision-log missing or empty for {task-id}" before any further work.

### 0.5. Worktree context 读取 (FR-WORKTREE-SCOPE-008)

build-spec **不新增 worktree 条目**（不调用 git 的 worktree-创建子命令）——worktree 仅在 `make-decision` 阶段创建（R4/R5）。build-spec 只消费已创建的 worktree 上下文：

```bash
# worktree.json 路径构造规则（与 build-code §17 一致）：
# taskDir 通过 parseTaskDir() 获取（WORKFLOWHUB_TASK_DIR env var 优先，yaml fallback，两者缺失 fail-loud）
node core/worktree-context.mjs {taskDir}/{task-id}/worktree.json
```

调用上述命令读取 `worktree.json`：两字段（`target_repo_root`/`worktree_root`）任一缺失时该脚本以非零退出码 fail-loud，build-spec 须据此立即停止推进并 `escalate_to_human`，不得静默回退或自行猜测路径。

**status=cleaned 拒绝逻辑**：读取 `worktree.json` 后，build-spec 须额外检查 `status` 字段——若 `status="cleaned"`，说明 worktree 已归档，须立即 `escalate_to_human` 并停止推进，不得复用已归档的 worktree 上下文（与 spec FR-WORKTREE-CONTRACT-001 cleaned-only 校验一致）。

### 1. Metrics: stage start

At stage start, call `metrics/collector.mjs` `recordSkeleton` with stage `build-spec`. Pass the M4 10 core fields as seed: `execution_id`, `skill_or_stage`, `stage`, `skill_version`, `executed`, `tokens`, `duration_ms`, `rework_rounds`, `human_intervention`, `friction_ref`. If metrics write fails, warn but do not block.

### 1.5. spec-ladder 档位判断（FR-LADDER-001/002）

在调用 spec-specify 前，基于 decision-log 描述的功能复杂度做档位判断，输出档位选择依据记入 spec 序言：

- **A 档**（小改动）：单文件或配置调整，影响面窄；速读卡足够，正文后三章可豁免
- **B 档**（中等）：跨模块改动或新增机制；需完整三层 spec
- **C 档**（大改动）：跨系统边界、新引入外部依赖或破坏性变更；完整三层 spec + 额外影响范围分析

F10 反过度工程四问（FR-LADDER-002）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件：
1. What real threat does this defend against?
2. Does any existing mechanism already cover it?
3. Can it be bypassed, making it security-theatre?
4. What is the long-term maintenance cost?

---

### 2. spec-specify: first-draft spec

Invoke `skills/spec-specify/SKILL.md` (spec-specify):

- **Input**: task-id (from the current stage context) and the functional description text extracted from the decision-log.
- **Expected output**: `specs/{task-id}/spec.md` (first draft) and `specs/{task-id}/checklists/requirements.md` (quality checklist).
- If spec-specify reports failure or the output files are missing, stop and surface the error — do not proceed to spec-clarify.

### 3. spec-clarify: ambiguity scan and interactive refinement

Invoke `skills/spec-clarify/SKILL.md` (spec-clarify):

- **Input**: task-id (or the explicit spec path `specs/{task-id}/spec.md`).
- **Expected behaviour**: 10-dimension ambiguity scan, up to 5 interactive clarification questions (one at a time), incremental spec updates after each accepted answer, and a coverage summary at completion.
- If spec-clarify reports the spec file is not found, stop — run spec-specify first.

### 3.5. scope-triage 高危词浮现（FR-SCOPETRIAGE-001）

spec-specify 产出初稿后，对 `specs/{task-id}/spec.md` 执行高危词 grep，检测阻断语义词：

**高危词黑名单**：`阻断` / `blocking` / `不能进` / `BLOCK` / `强制门` / `必须停止` / `强制完整流程`

命中时：
- 浮现命中位置 + 建议修改（供人工确认是文档示例还是执行语义）
- 记录进质量事实契约第 4 项（未解风险）
- **不构成阻断条件**（CONSTITUTION F4/F5，记录+浮现+人判断）

---

### 3.6. 7 条自检 + Spec-Purity grep（FR-SELFCHECK-001/002）

spec 产出后运行以下 7 条自检，结论（pass/warn/unknown）写入质量事实契约第 2 项（自检结果）：

1. spec-ladder 档位已声明且有依据
2. 所有 FR 使用 `FR-{DOMAIN}-NNN` 格式
3. 每个 FR 至少有一条 Given/When/Then 场景
4. 五章硬门完整（速读卡 / FR / 不做 / 验收 / 影响范围）——A 档可豁免后三章
5. spec↔decision-log 覆盖率（FR-ALIGN-001）：decision-log 每条 KEEP 决策在 spec FR 中有对应；差异记入质量事实契约第 4 项（未解风险），不阻断
6. 无 `[NEEDS CLARIFICATION]` 残留（或全部标明已解决/延后理由）
7. Known Gaps 段存在

**Spec-Purity grep（FR-SELFCHECK-002）**：对 spec.md 运行 grep，检测代码片段（``` 包围块）、具体文件路径（`/Users/` 或 `./` 前缀）、shell 命令（`$`、`&&`、`|` 特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。文档示例块命中即记 warn + 列出行，由人工确认；不对示例块做自动豁免。

---

### 3.7. 异源 3rd-review 独立审查（FR-REVIEW-001/002）

spec 初稿完成后，调用异源 3rd-review 独立审查（复用现有 3rd-review 基础设施，单一异源引擎如 codex），在独立上下文产出 verdict + findings：

- 结论记入质量事实契约第 3 项（独立审查摘要路径）
- 审查失败/不可用时降级记录 unknown + 原因——**这里的"不阻断"仅指记录该事实本身不阻断**（F3/Q1：物理事实机器采集浮现到边界，记录动作不卡死推进）。stage 是否继续推进是另一个独立决策，由第 7 节 auto-advance 判断点裁定：`unknown` 在那里必须停下，不产出 stage-result，转人工确认（needs_human=true）。见第 7 节。
- **禁止自审自判（FR-REVIEW-002）**：不得使用单一 AI 切换视角替代异源独立审查
- 可 grep 到 `3rd-review` 或 `异源独立审查`

**调用命令模板：**

调用前必须先 `cd` 到 workflowhub worktree 根目录（或显式传 `--output-root=<workflowhub worktree 绝对路径>`），确保 standalone.sh 按文件名搜索 decision-log.md 等文件时命中的是本任务目录，不是 3rd-review 仓库自己的残留任务。

```bash
cd /path/to/workflowhub-worktree  # 或用 --output-root= 显式指定，见下
bash /path/to/3rd-review/standalone.sh \
  --checkpoint=build-spec \
  --input=specs/{task-id}/spec.md \
  --output-root=/path/to/workflowhub-worktree \
  --task-name=build-spec-{task-id} \
  --review-runner=<review-runner-cmd>
```

参数均为 `--flag=value` 形式（standalone.sh 不接受空格分隔的参数）。standalone.sh 不产出固定路径的输出文件，裁决与报告写在 `<output-root>/tasks/<task-name>-<timestamp>-<rand>/reviews/verdict.json` 与 `report.md`，由 stdout 的"任务目录"提示获取实际路径。可用参数全集（见 standalone.sh 脚本头注释与参数解析）：`--input=`、`--output-root=`、`--task-name=`、`--review-runner=`、`--max-revise-rounds=`、`--checkpoint=`、`--foreground-only`、`--skip-manifest`；未列出的参数（如 `--engine`、`--output`）不受支持，传入会直接触发 `unknown argument` 报错（exit 3）。

---

### 3.8. 质量事实契约产出（FR-CONTRACT-001/002）

完成自检和审查后，在 spec.md 末尾附录或独立文件中产出"质量事实契约"段落，包含以下 5 项（字段必须存在，值可为空字符串或 unknown，禁止字段缺失）：

1. **scope 边界**：本次 spec 的 IN/OUT scope 及裁剪机制列表
2. **自检结果**：7 条自检 + Spec-Purity grep 的 pass/warn/unknown 汇总
3. **独立审查摘要**：异源 3rd-review 的 verdict + findings 摘要路径
4. **未解风险**：已知缺口、摩擦记录（`[FRICTION]` 格式，见下节）、scope-triage 高危词命中、spec↔decision-log 差异
5. **handoff required_reads**：下游阶段必读文件清单

**约束（FR-CONTRACT-002）**：所有 5 项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。任何质量检查失败均不阻断推进（CONSTITUTION F4/F5）。

---

### 3.9. 交互规范（FR-COMM-001/002）

build-spec 产出过程中必须遵守以下交互规范：

**REQ-COMM-01（FR-COMM-001）**：对编排者的所有提问或选项，必须使用大白话说明选项后果，不让编排者猜。格式：列出选项 A/B/C + 每个选项的后果一句话。禁止含糊带过选项差异。

**REQ-COMM-02（FR-COMM-002）**：每完成主要步骤后，主动汇报进度：做了什么 / 下一步是什么 / 需要编排者做什么。不等对方追问。

---

### 3.10. 摩擦捕获、Artifact-First 与行为验证要求（FR-FRICTION-001，FR-ARTIFACT-001，FR-BEHAV-001/002）

#### [FRICTION] 摩擦捕获（FR-FRICTION-001）

发现任何流程卡点时，立即记录 `[FRICTION]` 条目：

```
[FRICTION] <触发时机简述>: <卡点描述> | 建议: <可选>
```

条目写入质量事实契约第 4 项（未解风险），不阻断推进。

#### Artifact-First 只传路径（FR-ARTIFACT-001）

长报告（> 500 字）、完整日志、大段引用：**写入文件后只传路径**（artifact-first），不内联到回报正文。回报格式：`结论 + 文件路径`。违规时记录为 warn，写入质量事实契约第 2 项（自检结果），浮现给人工；不自动停止 stage（非阻断）。

#### FR 场景行为验证（FR-BEHAV-001/002）

- **FR-BEHAV-001**：spec.md 中每个 FR 至少须有一条 Given/When/Then 格式场景，覆盖正常路径
- **FR-BEHAV-002**：FR 场景不得含实现细节（框架名、函数名、协议名），只描述用户/系统级行为；meta 场景（描述 build-spec 机制本身的）豁免此要求

以上两项缺失或不符时，记录为 warn 写入质量事实契约第 2 项（自检结果），浮现给人工；不自动停止 stage（非阻断）。

---

### 4. Constitution compliance check

Read `constitution-checklist.md`. Check all 21 items (F1–F10, Q1–Q3, S1–S8) against the spec produced so far. For every item write `[x]` (compliant) or `[ ]` (non-compliant) with a concrete rationale sentence. No item may be left unmarked or without a rationale — all 21 must be present.

The 21 items are:

**Framework (F1–F10)**:
- [ ] **F1 薄核心** — 判据：核心是否只做调度编排、重活下沉技能层（改动牵连面小）。
- [ ] **F2 窄契约** — 判据：模块间是否走窄而明确的接口、不暴露内部实现。
- [ ] **F3 物理事实靠机器校验但不阻断** — 判据：物理事实是否机器客观采集且不阻断推进。
- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
- [ ] **F5 gate 谨慎添加出事再补无用则移除** — 判据：关卡是否按需添加、无用即移除，未预先堆砌。
- [ ] **F6 统一外置执行记录** — 判据：进度/指标/回溯是否统一记录、可回溯。
- [ ] **F7 推进与不可逆操作不自动越过人** — 判据：推进/不可逆操作是否经人边界确认。
- [ ] **F8 简单优先** — 判据：是否选更简单依赖更少的方案、不写掩盖问题的兜底。执行四阶梯判断时调用 `skills/simplicity-guard/SKILL.md`，产物写入 `minimal-path` 字段。
- [ ] **F9 可证伪不假绿** — 判据：检查是否在"实际为假"时真报失败、缺数据标未知。
- [ ] **F10 自动化按真实收益添加，不为"机器可校验"本身堆基建** — 判据：自动化(CI/校验/机器基建)是否真实收益大于长期维护成本、不为"机器可校验"本身预堆基建、能实跑的优先实跑。

**Quality (Q1–Q3)**:
- [ ] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
- [ ] **Q2 gate 三类划分** — 判据：关卡是否分入口校验/记录采集/人工确认三类、未把记录型做成阻断门。
- [ ] **Q3 异源审查加人工把关** — 判据：质量裁决是否由独立来源独立上下文产出、无自审自判。

**Skills (S1–S8)**:
- [ ] **S1 能用外部就不造轮子** — 判据：通用能力是否优先复用外部、文件直放项目内。
- [ ] **S2 外部技能可针对项目改造合宪** — 判据：采用的外部技能是否按需改造至合宪。
- [ ] **S3 迭代时保持最新并就地检查** — 判据：迭代时是否查更新/更优、来源路径写进技能文件。
- [ ] **S4 自定义技能必须有指标系统** — 判据：自研技能是否配套指标、纳入统一执行记录。
- [ ] **S5 自定义技能方便子代理调用省主上下文** — 判据：自研技能是否便于子代理调用、减少主上下文占用。
- [ ] **S6 自定义技能参考市面方案不闭门造车** — 判据：自研技能是否参考成熟方案优化。
- [ ] **S7 一阶段一技能一工作流一文件夹** — 判据：阶段/工作流是否一一对应独立、按目录约定、核心零改可加。
- [ ] **S8 自定义技能可独立调用可搬运** — 判据：自研技能是否可独立调用、可跨宿主搬运、不绑死环境。

**Rule**: non-compliance does NOT block build-spec progression. Any `[ ]` marks are recorded transparently and surfaced in the stage-result facts, but the pipeline continues. The constitution check is a factual recording step, not a gate — per constitution principle Q1 (记录事实而非阻断).

Write the completed checklist as an appendix to the spec or as a standalone file `specs/{task-id}/constitution-check.md`.

### 5. Baseline comparison

Compare the current M11 task execution against the M10 baseline using 5 metrics from `specs/archive/m10-baseline-switch/baseline-report.md`. Produce a 4-column table:

| Metric | M11 Actual | M10 Baseline | Direction Delta |
| ------ | ---------- | ------------ | --------------- |
| missed_step_rate | <M11 actual> | 0.05 | <delta> |
| test_execution_rate | <M11 actual> | 0.8295 | <delta> |
| review_execution_rate | <M11 actual> | 1 | <delta> |
| rework_rounds | <M11 actual> | 6.075 | <delta> |
| rework_proxy_count | <M11 actual> | 25.25 | <delta> |

- Compute each M11 actual from the metrics data that actually exists for this task — the global metrics store (`~/.workflowhub/metrics/global-metrics.jsonl`) plus this task's stage records. Only `rework_rounds` is directly present in the M4 core fields; the other four (`missed_step_rate`, `test_execution_rate`, `review_execution_rate`, `rework_proxy_count`) are derived from the broader metrics corpus, the same way the M10 baseline-report computed them.
- **If a metric cannot be computed from available data, write `unknown` in the M11 Actual cell and state the missing-data reason in a note below the table. Never fabricate a value.** A fabricated actual is a false-green (violates F9); a real `unknown` is honest.
- An `unknown` cell does NOT block the stage — record it and continue (F3 物理事实不阻断推进, Q1 记事实而非阻断).
- The direction delta indicates whether the metric moved favourably (e.g. fewer rework rounds is better, higher test execution rate is better). For an `unknown` actual, the delta is also `unknown`.
- **Thresholds are set by humans, not by this stage.** The M10 baseline values are reference points only — non-compliance with any of them does NOT block progression (F3, Q1).
- The fifth metric must be named `rework_proxy_count` — do NOT use any previous naming for this metric.

Append the baseline comparison table to `specs/{task-id}/spec.md` or write it as a standalone file `specs/{task-id}/baseline-report.md`.

### 6. F10 anti-over-engineering gate (apply while the spec can still be revised, before the 3rd-review pass in step 7)

This step runs on the spec produced by spec-specify → spec-clarify, **before** the auto-advance step (step 7). It records F10 findings (non-blocking) so they are carried into the 3rd-review pass and the plain-language brief. No automatic changes are made to the spec content itself (F7) — findings are recorded, not auto-applied.

Before any new mechanism, validation, CI check, gate, schema, dependency, or automation remains in the spec, answer all four questions. If you cannot answer all four for a given mechanism, **record a warning and surface the finding for human review** — do not auto-remove (non-blocking, FR-LADDER-002).

1. **What real threat does this defend against?** — Name a specific, observed failure mode (not "it could happen"). Hypothetical threats do not justify new infrastructure.
2. **Does any existing mechanism already cover it?** — Check what is already in the codebase, config, or workflow before keeping something new. Duplication is waste.
3. **Can it be bypassed, making it security-theatre?** — If yes and the bypass is trivial, the mechanism blocks only honest actors and costs more than it protects.
4. **What is the long-term maintenance cost?** — Every mechanism kept here must be maintained across all future changes. High ongoing cost is a signal worth surfacing.

If the answer to Q1 is "none in particular" or the answer to Q4 is "high and ongoing", **record the finding in the quality contract (item 4: 未解风险) and surface it in the plain-language brief** — do not automatically remove the mechanism. Whether to prune is decided downstream (by a later review pass or by whoever reads the surfaced finding), not by this stage auto-pruning.

This gate reflects constitution rule F10: automation and validation are added for real benefit, not to make things machine-checkable for its own sake. Cautionary example: a predecessor system accumulated ~95,000 lines of gate code with over a dozen deadlocks by chasing "everything machine-verifiable". Do not repeat that pattern.

### 7. Auto-advance on independent review pass

build-spec is an **auto-advance stage** (自动放行阶段，见 `docs/plain-language-mechanism-design.md` 一/2.3): once spec-specify output, spec-clarify refinement, F10 analysis (findings recorded), constitution check, and baseline comparison are all complete, quality gating is the 3rd-review 异源独立审查 from step 3.7 — not a human pause.

Only a clean `pass` verdict may auto-advance. `revise_required` loops back internally as before. `unknown` does **not** auto-advance — it stops once and escalates to a human (see below).

- If the 3rd-review verdict is `revise_required`, loop back to the relevant step and fix, same as before (no change to this path).
- If the 3rd-review verdict is `pass`, do **not** stop for human confirmation. Instead:
  1. Produce a plain-language progress brief using `docs/human-brief-template.md`'s 七要素 (seven elements), ending with template 结尾 B（自动放行结尾）: state that the stage **passed independent review** and is auto-advancing to build-plan — nothing more is needed from the human. Do not append a "请确认" section.
  2. In the brief, translate internal artifact names into plain language rather than naming them directly — e.g. describe "spec.md 经过澄清后的完整需求" instead of saying `spec.md`, describe the constitution checklist and M11/M10 baseline comparison as "跑了几项内部合规和对比检查，结果都记录了" inside the "审了几次、结论是什么" element, rather than listing `constitution-checklist.md` or "M11 vs M10 baseline" verbatim.
  3. Produce the stage-result immediately after the brief (see below) and proceed to build-plan.
- If the 3rd-review verdict degrades to `unknown` per 3.7's non-blocking fallback (review failed/unavailable), do **not** auto-advance. This is a one-time stop for a human decision, not a quality gate on the spec content itself. Instead:
  1. Produce the plain-language brief stating plainly that the independent review could not be completed this time (异源审查未完成/结果不可用) and record the reason — do not claim "已通过异源审查" or otherwise imply the review passed (that would be a fabricated result, F9).
  2. Record `unknown` + reason in the quality contract's 独立审查摘要 (item 3), same as 3.7's existing non-blocking fallback convention for facts recording.
  3. **Do not produce the auto-advance stage-result and do not proceed to build-plan.** Instead, halt the stage and report `needs_human=true` to the orchestrator/leader along with the pending decision (reuse the same halt-and-report pattern used elsewhere in this pipeline for a one-time human checkpoint, e.g. build-plan's Step 9 "无限等待人工明确回应" convention) — the pending decision is: continue anyway (re-run build-spec's auto-advance path once review becomes available, or accept the current state and proceed manually), or wait for the review tooling to be fixed and re-run 3.7. No stage-result is written until the human responds; this is not a new mechanism, it is the existing "record unknown, do not silently claim pass, stop for a human call" convention applied at the auto-advance boundary instead of being absorbed into it.
  4. Once the human responds, act on their explicit choice (continue now / wait and retry 3.7) and only then produce the stage-result reflecting the outcome actually reached.

The spec is not silently altered by this step — what spec-specify/spec-clarify produced (plus recorded F10/constitution/baseline findings) is exactly what gets carried into the brief and the stage-result.

### 7.5. Commit 触发点 (FR-WORKTREE-COMMIT-004)

当本阶段对目标仓库产生文件变更时，须 `git add` + `git commit`，message 含 `workflowhub(build-spec)` 前缀（例如 `workflowhub(build-spec): <description>`）。所有 `git add`/`git commit` 必须在 `worktree_root`（本任务的 linked worktree，当前 task branch）中执行；严禁在 `target_repo_root` 的主工作树上执行提交。若本阶段无文件变更，禁止空提交，须在 stage-result 或 journal 记录 no-change reason；字段路径固定为 stage-result 的 `facts.no_change_reason`（string），仅在本阶段无文件变更时写入该字段（例如 `"facts": {"no_change_reason": "build-spec stage produced no file changes", ...}`），有文件变更时该字段不出现；no-change 记录为必填项，不得两者皆无地静默结束本阶段。

## Produce a stage-result

When the stage is complete (all steps above done and 3rd-review verdict is `pass`, plain-language brief produced per step 7), write a `stage-result` record with:

```json
{
  "status": "success",
  "error_code": "",
  "retryable": false,
  "facts": {
    "spec_ref": "<relative path to spec.md>",
    "requirements": "<comma-separated list of FR identifiers or one-line summary>"
  },
  "missing_items": [],
  "user_decision": false,
  "reason": "Spec written via spec-specify → spec-clarify → constitution check → baseline comparison, auto-advanced after 3rd-review pass (build-spec is an auto-advance stage). If the 3rd-review verdict is unknown, this stage-result is not written — the stage halts and reports needs_human=true instead."
}
```

Also record a metrics entry via the collector. Call `recordSkeleton` at stage start and `updateOwnResult` at stage end, passing at minimum:

```json
{
  "execution_id": "<uuid>",
  "skill_or_stage": "build-spec",
  "stage": "build-spec",
  "skill_version": "2.0.0",
  "executed": true,
  "tokens": null,
  "duration_ms": null,
  "rework_rounds": 0,
  "human_intervention": false,
  "friction_ref": null
}
```

These are the M4 record-schema core fields (`execution_id`, `skill_or_stage`, `stage`, `skill_version`, `executed`, `tokens`, `duration_ms`, `rework_rounds`, `human_intervention`, `friction_ref`). Use `metrics/collector.mjs` — do not hand-write a raw jsonl line with only `skill/stage/event/ts`.

At stage end call `updateOwnResult` on `metrics/collector.mjs` with actual values for executed, tokens, duration_ms, rework_rounds, human_intervention, and friction_ref. If `updateOwnResult` write fails, warn but do not throw — a metrics write failure must not undo a successful stage completion.
