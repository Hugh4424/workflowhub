---
user_decision: true
---

# Decision Log — M13b build-spec 深化

> task-id: m13b-build-spec-deepening ｜ stage: make-decision ｜ skill: make-decision v2.0.0
> execution_id: 1DCFFB01-3F60-426B-A232-5F71CC31852C ｜ 落盘日期: 2026-06-30
> 核查来源：`artifacts/make-decision-blind-review-merged.md`、`artifacts/make-decision-debate1-verdict.md`、`artifacts/agenthub-design-keep-cut-modify.md`、`artifacts/s5-economy-review-prompt.md`（make-decision 阶段盲审产物，非 build-spec FR-REVIEW 审查产物）

## 1. 原始需求（原文）

把 agenthub design 阶段的质量保障体系移植进 workflowhub `workflows/build-spec/SKILL.md`。后续用户三轮纠正：接受方向修正为质量事实契约；agenthub design 不全保留，逐块评估留/删/改；审查机制砍三 source_family 硬要求改省钱版；5 框架外部调研暂不做；TASK_TRACKING_ROOT 放本任务做（一直没做导致没正确留存任务执行记录）；交互要大白话+给选项、勤报进度。

## 2. 问题与目标

build-spec 当前 M11 v1，缺：范围分档、spec 自检、spec↔decision-log 对齐、独立审查视角、跨 stage handoff 契约。
目标：给 build-spec 加一套**薄质量能力**，定义它必须产出的「质量事实契约」，机制反选最少；不引入任何阻断式门（宪法 F4/F5/F7/F10）。

## 3. 决策记录

- **D1（目标重定义）**：build-spec 必须产出「质量事实契约」=｛scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads｝。机制只做候选实现、反选最少，不照搬 agenthub 机制清单。
  来源：debate#1 裁决=建议改；economy 审查方向角=pass。
- **D2（保留薄质量本体）**：spec 构建本体（speckit-specify/clarify + 平台约束交叉比对 + 扎根 decision-log）、最简 spec 阶梯（反过度工程）、spec 三档章节、7 条自检 + Spec-Purity grep、独立审查、行为验证规则、摩擦即记、`--task-dir` 机制、Known Gaps。**这些检查必须落到产物里**（economy 框架角前提）。
  来源：逐块评估 keep 清单；economy 框架角。
- **D3（删除）**：agenthub 3 道门（退出门/审查门/推进门）整层删（检查内容已被 D2 的 7 自检+纯净度扫描+独立审查覆盖，重复）；TodoWrite 待办模板仪式、`[DECOMP]` 遥测、绑门自动写、Exit Conditions 重复行。
  来源：Hugh 选 option A；逐块评估 cut 清单。
- **D4（审查恢复修正）**【修正 2026-06-30，Hugh 授权】：原降级基于错误前提——将「异源独立审查」误当成「3 个不同 source_family 各审一角度」的高成本机制。事实是 agenthub design 原审查 = 单一异源引擎（如 codex）的 3rd-review 独立审查，workflowhub 现有 3rd-review 基础设施可直接复用，成本仅一次异源调用。**恢复为 B=真·异源独立审查：复用现有 3rd-review（单一异源引擎），产出 verdict+findings，记入质量事实契约第 3 项，非阻断（记录+浮现+人判断）。不做 3 source_family 多重审查（过度工程，Hugh 从未要求）。单一异源满足宪法独立裁决最小要求。**
  来源：Hugh 修正 turn-5：B，decision-log 搞错了；宪法独立裁决要求（禁止自审自判）。
- **D5（移出 5 框架调研）**：cursor/ECC/compound-engineering/skills/superpowers 五框架外部调研移出本任务，另立。
  来源：scope 盲审 B2（blocking）；Hugh「暂时不做」。
- **D6（TASK_TRACKING_ROOT）**：新增全局环境变量，任务跟踪文件不存 repo（默认 Knowledge 目录）。**Hugh 定 OQ-1=B：本批一次性完整落地全局变量 + 所有 stage 读取约定，验收面随之扩大并接受。**
  来源：Hugh「放本任务一起做」+ OQ-1 选 B；economy 范围角（major：曾建议本批只写读取约定，Hugh 否决，取完整落地）。
- **D8（8 项纳入裁定）**：Hugh 提的 8 件事全部纳入本任务，无新增阻断门。映射：①handoff.json→D1 required_reads（已在）；②范围判断+高危词→scope-triage（D2，已在，"强制完整流程"改为高危词浮现+建议，不卡推进）；③需求自检 4 类→7 条自检（D2，已在，记录不卡）；④前后一致性→spec↔decision-log 对齐（D1，已在）；⑤独立审查→异源3rd-review独立审查（D4修正，复用现有基础设施）；⑥FR-{DOMAIN}-NNN 编号格式→新增小项（便宜）；⑦AC 条数计数存文件→新增小项（便宜）；⑧长报告只存路径→REQ-COMM/artifact-first（已在）。结论：6 项已在 D1/D2/D4，2 项（⑥⑦）为低成本新增，0 项引入阻断门。
  来源：Hugh turn-5 列举 8 项；逐项对照 D1/D2 keep 清单。
- **D7（沟通需求纳入）**：REQ-COMM-01 交互用大白话+给选项说后果；REQ-COMM-02 勤报进度（做了啥/下一步/需要你啥）。作为 build-spec 正式需求。
  来源：Hugh 明确需求。

## 4. 假设

- 实现时 D2 所有质量检查均为「记录事实 + 浮现 + 人判断」，无任何自动卡推进（economy 方向角 minor）。
- workflowhub 现有 3rd-review / journal / collector 可被 build-spec 直接复用，无需重写。

## 5. 明确不做

- 不做任何阻断式 gate（gate.sh stage_exit / post_review_pass / stage_advance 的阻断语义）。理由：违宪 F4/F5/F7/F10，F10 反例点名 agenthub。
- 不做 3 source_family 多重异源审查（过度工程）；采用单一异源 3rd-review 独立审查，复用现有基础设施，满足宪法独立裁决最小要求。
- 不做 5 框架外部调研。理由：移出本任务，另立。
- 不搬 agenthub TodoWrite 待办模板、`[DECOMP]` 遥测、绑门自动写。理由：纯 token 开销、workflowhub 无对应。

## 6. 开放问题

- **OQ-1（TASK_TRACKING_ROOT 落地深度）—— 已解决=B**：Hugh 选 B，本批一次性完整落地全局变量 + 所有 stage 读取约定。验收面扩大并接受。无剩余开放问题。

## 7. 验收标准

- build-spec SKILL.md 含「质量事实契约」5 项产出定义（scope 边界/自检/独立审查摘要/未解风险/handoff required_reads），可逐项核对。
- D2 保留项均在 SKILL.md 有对应落点，且检查表述为「记录+人判断」，「阻断/不能进/BLOCK」等词不被用作审查/检查触发的执行门语义（作黑名单举例、引用、说明文字出现不违规，见 AC-16）。
- D3 删除项在 SKILL.md 中不出现。
- 审查机制为真·异源独立审查（复用现有 3rd-review，单一异源引擎），结论记入质量事实契约第 3 项，非阻断；不做 3 source_family 多重审查。
- TASK_TRACKING_ROOT 按 OQ-1=B 完整落地：全局环境变量定义 + 所有 stage 读取约定，验收面覆盖全局。
- D8 的 8 项均有落点：⑥FR-{DOMAIN}-NNN 编号格式、⑦AC 条数计数存文件可在 build-spec SKILL.md 逐项核对；其余 6 项归入 D1/D2/D4 既有落点。高危词（item②）为浮现+建议，grep 不到强制阻断。
- REQ-COMM-01/02 写入 build-spec 交互规则。

## 执行环境（6 env var 检测结果）

| env var | 是否设置 | 实际值 | 降级事件 |
|---|---|---|---|
| `MAKE_DECISION_DEBATE_PATH` | 未设置 | 使用默认值 `/Users/Hugh/Hugh/Project/debate` | 无（debate 因 no_blocking_findings 跳过，非 path_invalid） |
| `MAKE_DECISION_SKIP_DEBATE` | 未设置 | 使用默认值 `0` | 无 |
| `MAKE_DECISION_SKIP_BLIND_REVIEW` | 未设置 | 使用默认值 `0` | 无（盲审正常执行；注：此处"独立三角度审查 1-AI-3-angle"是 make-decision 本阶段盲审的执行记录，与 D4 修正后 build-spec 的异源 3rd-review 审查机制无关） |
| `THIRD_REVIEW_RUNNER` | 未设置 | 使用默认值 `run-heterologous-review.mjs` | 无 |
| `REVIEW_DISPATCH_CONFIG` | 未设置 | 空（走内置默认调度） | 无 `dispatch_config_invalid` |
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | 已设置 | `1`（来源 `~/.claude/settings.json` 权威值；五方法庭模式可用，但本次 debate 因 0 blocking 跳过未实际进场） | 无 |

无 `debate_path_invalid` / `runner_invalid` / `dispatch_config_invalid` 降级事件触发。
