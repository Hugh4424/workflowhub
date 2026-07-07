# wh-review-rebuild 端到端测试方案

> **状态说明**：本文件对应 FR-TEST-001"build-plan 阶段须设计可执行测试方案"的要求，分两部分：
> 第一部分是**文档结构自检**（build-plan 阶段本次落地，现在执行即可拿到 `exitCode===0` 的真实结果，
> 见下方"文档结构自检"；round22 修复：此前误称为"当前可执行冒烟基线"，但该检查只校验本文件自身是否
> 含两个标题，不触发任何 stage、不调用 wh-review/3rd-review、不生成 `tasks/{task-id}` 产物，与
> AC11-2 要求的端到端能力验证并非一回事，予以降级更名，避免把文档自检误当成能力已验证）；第二部分是
> AC11-2 要求的**最小可执行冒烟用例验收标准定义**（见下方"冒烟用例"一节，本节是 build-plan 阶段的
> 交付门槛：确定性地定义验收标准，具体可跑通的执行版本留待 T010-T023〈wh-review/3rd-review 实现 +
> 5 stage 迁移〉在 build-code 阶段落地后，由 T025 接入 `test-plan-smoke.test.mjs` 真正执行、断言
> `exitCode===0`）。两部分均为确定性描述：第一部分现在就真实可跑通，第二部分现在给出确定的验收动作
> 定义、执行时机明确移交 build-code/verify-code 阶段，均不是模糊的"占位"表述。

## 文档结构自检（build-plan 阶段产出，现在就能跑通；round22 修复：此前称"冒烟基线"，实际只做文档自校验，予以更名）

- **前置条件**：
  - 仓库已 checkout 到本地（`workflowhub` 仓库根目录）；
  - 已执行过一次 `npm install`（或 `package.json` 声明的等价安装命令），`vitest` 可通过 `npx vitest` 调用；
  - 不需要设置任何环境变量（`THIRD_REVIEW_RUNNER`/`THIRD_REVIEW_REPO_ROOT` 等仅下方"冒烟用例"一节需要，本项文档结构自检不依赖）；
  - 依赖文件 `specs/wh-review-rebuild/__tests__/test-plan-smoke.test.mjs` 与本文件 `specs/wh-review-rebuild/test-plan.md` 均已存在于仓库中（两者均已提交，非待生成产物）。
- **可执行命令**：
  ```
  npx vitest run specs/wh-review-rebuild/__tests__/test-plan-smoke.test.mjs
  ```
- **stub/fixture 说明**：无需外部 mock 或假数据。该测试文件直接读取本文件（`test-plan.md`）自身的文本内容作为唯一输入，属于"文档自校验"类测试，不依赖 wh-review/3rd-review 任何尚未实现的脚本。
- **预期产物路径**：无文件产物——这是一个纯断言测试，不落盘任何中间或最终文件；验证结果体现在 vitest 的进程退出码与终端断言输出上，不产出 `tasks/{task-id}/...` 下的任何 artifact。round22 修复：正因为不触发任何 stage、不生成 `tasks/{task-id}` 产物，本项检查不构成 AC11-2 要求的端到端能力验证，真正满足 AC11-2 的用例定义见下方"冒烟用例"一节。
- **通过/失败判定标准**：进程 `exitCode===0` 且以下 3 个断言全部通过，任一不满足即判为 fail：
  1. `specs/wh-review-rebuild/test-plan.md` 文件存在；
  2. 该文件内容匹配 `/^## 冒烟用例/m`（即含"文档结构自检"之后的、AC11-2 最小可执行冒烟用例验收标准定义小节标题，见下方）；
  3. 该文件内容匹配 `/^## 未覆盖 stage/m`。

## 冒烟用例（AC11-2 最小可执行验收标准定义——build-plan 阶段交付门槛，T010-T023 落地后由 T025 接入执行）

**交付门槛说明（round22 修复）**：本节由 build-plan 阶段当场定案，是 AC11-2"至少1个完整端到端冒烟用例可在本地实际跑通"要求的确定性验收标准定义——覆盖 stage 真实调用步骤、真实 exit code 断言（`exitCode===0`）、真实落盘产物路径断言（`tasks/{task-id}/reviews/`、`tasks/{task-id}/reports/` 下具体文件存在性）三要素，均为确定描述，不是空泛占位。因 T002-T006（5 套合同搬迁）等 wh-review 实现契约尚未落地，本节定义的调用链目前无法真实执行；具体可跑通的执行动作留待 build-code 阶段完成 T010-T023 后，由 T025 把下方断言接入 `test-plan-smoke.test.mjs` 实际执行并验证 `exitCode===0`，作为 verify-code 阶段的验收依据。本阶段（build-plan）的交付边界到此为止：产出确定的验收标准定义，不产出可跑通的执行代码。

**用例 1：build-spec stage 全链路（wh-review + 精简后 3rd-review 组合，round29 修复：主线由 make-decision 改为
build-spec——build-spec 的 pass 路径 `post_review_action=auto_advance` 自动推进、不受 D2 人工确认门阻塞，确保本用例
`exitCode===0` 路径可自动、可重复复现，不依赖任何人工确认步骤）**

- 前置：`workflows/build-spec/SKILL.md` 已完成 T022 迁移，收尾调用点改为调用
  `skills/wh-review/scripts/invoke-review-engine.mjs`，透传 `stage=build-spec` 与 `task_id`。
- 步骤：
  1. 触发 build-spec stage 收尾流程，进入 wh-review 调度。
  2. wh-review 通过 `route-decision-writer.mjs` 写入 `route-decision-{stage}-{review_flow_id}.json`（`contract_path` 命中
     build-spec 专属合同）。
  3. wh-review 经 `invoke-review-engine.mjs` 调用精简后的 3rd-review 引擎（`{mode, contract,
     materials}` 三元组）：`THIRD_REVIEW_RUNNER` 指向确定性 stub runner，固定返回 `verdict=pass`、`findings=[]`，
     不调用真实审查 agent，确保结果确定、可重复；取得 `{verdict: "pass", findings: [], actual_mode}`。
  4. `round-state.mjs` 落盘轮次状态至 `round-state-{stage}-{review_flow_id}.json`（round21 修复：路径按
     stage+review_flow_id 隔离，见 data-contracts.md Contract 4），`render-review-report.mjs` 渲染 6 章报告。
  5. build-spec 不属于 D2 门 stage，裁决为 `pass` 时校验 `post_review_action=auto_advance` 正确写入并自动推进；
     全程不产生任何等待人工确认的中间态，不依赖任何人工介入即可完整跑通。
- 断言：全链路 `exitCode===0`，`tasks/{task-id}/reviews/route-decision-{stage}-{review_flow_id}.json`、
  `verdict-build-spec-{review_flow_id}-round-1.raw.json`（此前修复：文件名加入 `{review_flow_id}` 维度，测试需先按 data-contracts.md Contract 4 附属"活跃审查流程指针文件"定义的发现规则——读取 `tasks/{task-id}/reviews/active-flow-{stage}.json` 取得 `review_flow_id`（round22 修复：不再用 mtime 通配排序作为默认发现路径，mtime 仅作指针文件丢失/损坏时的人工兜底排障手段）——再定位该证据文件，权威路径见 spec.md FR-THIRDREVIEW-001"evidence/report 落盘路径规则"）、渲染报告三类产物均落盘且字段齐全。
- T025 落地时，本用例对应的可执行命令预期为 `npx vitest run specs/wh-review-rebuild/__tests__/test-plan-smoke.test.mjs`（同一测试文件扩写后的版本）；预期产物路径为上述 `tasks/{task-id}/reviews/` 与 `tasks/{task-id}/reports/` 下的具体文件；通过标准为 `exitCode===0` 且上述产物文件全部存在、字段齐全，全程无需任何人工确认步骤。

## 未覆盖 stage

除上述用例主线覆盖的 build-spec 外，其余 4 个迁移 stage——make-decision、build-plan、build-code、
verify-code——不在本冒烟用例的直接执行路径内。这 4 个 stage 由 T025a 补一条独立最小验证：断言其
wh-review 调用点在默认输入下 `exitCode===0` 且正常落盘 `route-decision-{stage}-{review_flow_id}.json`，不因本次接口迁移
（直接调用 3rd-review → 调用 wh-review）而报错或阻塞；其中 make-decision/build-plan/verify-code 三个 D2 门 stage 的
独立验证同样以 stub runner 固定返回 `verdict=pass` 驱动，断言 `post_review_action=await_human_confirmation` 被正确
写入、流程实际停在人工确认门，该断言只检查落盘状态文件字段，不等待真实人工输入，不会导致测试进程挂起。
