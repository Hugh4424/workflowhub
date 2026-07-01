# 人工放行摘要：m13c-build-plan-deepening（build-plan 阶段）

> 大白话版，供人工审阅后决定是否放行 build-code 阶段。

---

## 在解决什么问题

build-plan 流程现在有四个明显短板：一、没有 research 步骤，导致技术选型盲区到 plan 阶段才暴露（M13b 执行中出现过这个问题）；二、没有 data-contracts 落盘，tasks.md 分解经常出现契约漂移（接口没定好就开始拆任务）；三、没有复用判断，每次都从头写而不检查有没有现成的可用；四、计划出来后没有独立工程审查，技术风险、时间估算、依赖顺序全靠人自己看，容易漏。

---

## 要做什么东西

1. 新建 `skills/spec-research/SKILL.md`——在 build-plan 开始前跑一次 research，产出 research.md，确保技术选型不是盲区。
2. 在 `workflows/build-plan/SKILL.md` 新增 data-contracts 步骤——在拆任务之前先把 API 契约写成文件（data-contracts.md），后续分解基于已确认的契约。
3. 在 spec-plan 调用前接入 simplicity-guard 四阶梯判断（M13b 已建好，这里是接入）——先判断有没有现成可复用的，有则直接用，不重写。
4. build-plan 产出计划后，调用 3rd-review plan-reviewer 做独立工程审查，产出 plan-eng-review.md（技术风险、时间估算、依赖顺序三维度）。
5. spec-analyze 新增 ambiguity_items[] 字段——歧义项显式列出并标明处理路径（人工确认/下一轮迭代/可接受）。
6. spec-tasks 强化 no-placeholder 铁律——任务清单里不能出现 TODO/TBD/待定等，发现即标记为阻断项并升级人工。
7. 新建 task_dir 解析器（单一函数），消除路径硬编码问题；配套写 vitest 测试。
8. 更新 reuse-registry.md，给 spec-research 加登记行。

---

## 准备怎么做

分 4 个阶段，共 11 个任务：

**阶段一（基础）**：先建 spec-research SKILL.md 和 task_dir 解析器（含测试），这两个是后续改动的前提。

**阶段二（核心改动，可并行）**：同时修订三个文件——build-plan SKILL.md（加 Phase 0/data-contracts/simplicity-guard/plan-reviewer 四处改动）、spec-analyze SKILL.md（加 ambiguity_items[]）、spec-tasks SKILL.md（no-placeholder 铁律 + STOP/Knowledge 约定）。

**阶段三（收尾）**：更新 reuse-registry，确认 simplicity-guard 和 build-spec 接入状态（M13b 已落盘，核实即可）。

**阶段四（验收）**：跑 vitest 测试，逐 AC 扫描确认（AC-01/16/17/19 等），输出通过清单。

所有新机制失败时统一走"记录+升级人工，不硬阻断"口径，不设阻断门。
