# Implementation Plan: M2 微内核核心

**Feature**: [spec.md](./spec.md) | **Decision source**: [decision-log.md](../../../Knowledge/Projects/multica-agenthub/tasks/m2-microkernel/artifacts/decision-log.md)
**交付仓**: `/Users/Hugh/Hugh/Project/workflowhub`（M1 已交付骨架，本计划在其内建核心代码）
**Created**: 2026-06-22

> 本计划只引用 spec.md（20 FR）与 decision-log.md（14 决策）已定的概念，不引入新核心概念。
> 每条改动可逐条回指 FR 编号；项目文件结构覆盖 spec 第 11 章影响范围每一项。

---

## Technical Context

| 项 | 值 | 来源 |
|----|----|----|
| 语言/运行时 | Node.js ESM（`.mjs`，无 TS 编译步） | 决策 2（最小依赖）；intake 最小假设 |
| 配置格式 | YAML（`config/workflowhub.yaml`） | 决策 3、12 |
| 运行时依赖 | `js-yaml`（解析 YAML） | 决策 12（dependencies 非 devDeps） |
| 测试框架 | `vitest`（devDependency） | intake 最小假设（与核心同栈） |
| 统一检查入口 | `npm run check`（M1 已建，串 markdownlint + verify-structure） | M1 现状；spec 第 11 章 |
| 核心边界锚点 | `core/**/*.mjs` | 决策 4；FR-CI-001（diff/反宿主/漏扫自检共用唯一锚点） |
| 平台无关 | 禁硬编码 host 路径 / 禁 REPO_ROOT 上溯 / 禁 source-derived 布局假设 / 禁 Claude hook 硬绑 | 决策 21；FR-GUARD-001 |
| NEEDS CLARIFICATION | 无（需求源经两轮异源审查 + 两次五方辩论 + design-review pass 收敛） | — |

**项目结构基线（workflowhub M1 现状，本计划在此之上新增）**：

```text
workflowhub/                  # 交付仓（M1 已交付，下列为现状）
├── package.json              # scripts.check = markdownlint-cli2 + verify-structure.mjs；devDeps 仅 markdownlint
├── scripts/verify-structure.mjs   # M1 结构校验（F9 可证伪范式，M2 checker 照此范式）
├── config/.gitkeep           # 空，M2 在此放 workflowhub.yaml
├── skills/.gitkeep           # 空骨架
├── workflows/.gitkeep        # 空骨架
├── CONSTITUTION.md           # F1-F9/Q1-Q3/S1-S8
└── .github/workflows/ci.yml  # CI 骨架（跑 npm run check）
```

---

## Constitution Check（workflowhub CONSTITUTION.md 逐项）

> 平台约束交叉比对（design 阶段已过）：14 决策 vs workflowhub 宪法/CONTEXT/CLAUDE/AGENTS 无冲突。

| 宪法条 | 含义 | 本计划是否满足 | 说明 |
|--------|------|:----:|------|
| F1 薄核心 | 核心只编排不懂业务 | YES | 调度核心无业务分支（FR-CORE-003），决策 1 |
| F8/F9 可证伪 | 每条检查有变异自测，故意改坏必红 | YES | 反宿主/禁改/扩展性均带坏样本自检（FR-CI-001/002），决策 9、10 |
| Q2 机器入口校验 | 硬门/exit≠0 属客观结构校验非主观质量门 | YES | M2 全部"必红/exit非0"属此类（design 已澄清） |
| S8 可搬运 | 检查脚本可脱宿主跑 | YES | 反宿主 lint 强制 core 不耦合 host（决策 21、FR-GUARD-001） |
| 禁改保护 | 不碰 forbidden 文件 | YES | M2 全在 workflowhub 仓新增，零触碰 multica forbidden 清单 |

**Gate 结论**：无违反，无需豁免说明。

---

## Research Decisions（技术选型，替代独立 research.md）

| 决策点 | 选择 | 理由 | 备选（未选） |
|--------|------|------|------|
| 核心语言 | Node ESM `.mjs` | 决策 2 最小依赖：免 TS 编译步，克隆即跑 | TS（引入编译/类型依赖，违最小依赖） |
| 配置格式 | YAML + js-yaml | 决策 3/12：人读友好；js-yaml 进 dependencies（运行时解析） | JSON（无注释、配置可读性差） |
| 组件契约 | 黑盒（合法 JSON 结果 + 退出码 + component_id） | 决策 14（第二次 debate 丁队第三路）：不锁传输形态，留 M3 | command-runner 四件套（被 debate 戳破绑死 M3 传输形态，弃） |
| core 边界表达 | glob `core/**/*.mjs` | 决策 4：单一机器可读锚点，diff/反宿主/漏扫共用，防漂移 | 手维清单（易漏，新增文件不进清单则漏扫假绿） |
| 测试框架 | vitest | 与核心 ESM 同栈，零额外 runner 配置 | node:test（断言/快照能力弱于 vitest） |

---

## 三个 plan 留定点（spec 第 10 章未决问题 → 本计划落定，最小级）

> design 阶段明确留 plan 的三点，此处落到"够测够实现"的最小具体度，不外溢 M3。

### 留定点 1 — core 边界 `core/**/*.mjs` 扫描器机制（FR-CI-001）

- **实现**：`scripts/scan-core-files.mjs` 导出函数，用 glob 匹配 `core/**/*.mjs`（相对仓根），返回文件路径数组。
- **唯一锚点共用**：反宿主检查、扩展性验收的核心 diff 锚定、漏扫自检三处都调此扫描器，不各写一份 glob（防三处漂移）。
- **可证伪**：漏扫自检 = 在 `core/` 下放一个故意含 host 耦合的样本文件，断言扫描器把它列入清单（若 glob 写错漏掉它 → 自检红）。

### 留定点 2 — 反宿主第 4 类 hook 硬绑匹配 pattern（FR-GUARD-001）

- **四类宿主耦合扫描**（只扫 `core/**/*.mjs` 本体，守卫脚本自身不扫，避免误报——见 spec Clarifications）：
  1. 硬编码 host 绝对路径：正则 `/Users/` `/home/` 等绝对路径字面量
  2. REPO_ROOT 上溯：`\.\./\.\.` 多级上溯定位仓根的模式
  3. source-derived 布局假设：硬编码 `.machine/source` `.agenthub` 路径字面量
  4. **Claude hook 硬绑**：硬编码 `PostToolUse` / `PreToolUse` / `SessionStart` / `.claude/` hook 注册名字面量的正则匹配
- **known-gap 诚实标注**：grep pattern 不可能穷尽所有 hook 硬绑写法，第 4 类在脚本注释里诚实标注"覆盖已知字面量模式，非完备"（决策 21 不伪装完备）。
- **可证伪**：每类配一个坏样本（含该类耦合的 `.mjs`），断言 lint 命中非零退出（决策 9）。

### 留定点 3 — 组件清单最小结构（FR-CORE-001/002）

- **registry 条目最小字段**：`component_id`（组件身份标识）+ 定位键（工作流标识 → 组件的映射键）。仅此两项为"核心定位 + 黑盒契约"所需最小集。
- **shape-only**：核心只校验"条目有 component_id、能按工作流标识定位"，不钉死 M3 的完整字段表（决策 14：窄契约 schema 留 M3）。
- **可换性/扩展性验收用它**：替换组件 = 改 registry 指向另一 component_id，核心代码零改；新增 = registry 加一条 + 目录加组件，核心零改（FR-EXT-001/002，决策 4）。

---

## 项目文件结构（覆盖 spec 第 11 章影响范围每一项）

> 全部 workflowhub 仓路径。spec 第 11 章影响范围：全新仓新增（无删除/合并已有功能）+ 向 M1 统一检查入口与 CI 新增挂载 + 回归判据=M1 结构校验仍过。逐项落成文件如下。

### 新增文件

```text
workflowhub/
├── config/
│   └── workflowhub.yaml              # [FR-CFG-001] [FR-CFG-004] 全局配置：registry 必备 + 4 占位键 shape-only + task_dir 静态声明
├── core/                             # 薄核心（边界锚点 core/**/*.mjs 唯一真相）
│   ├── load-config.mjs               # [FR-CFG-001] [FR-CFG-002] [FR-CFG-003] 读 YAML→解析约定键集；必备键缺失报错，占位键 shape-only；静态配置允许键白名单，运行态字段(current/active/runtime)即报错(003 防全局单指针串台)
│   ├── parse-framework-config.mjs    # [FR-CFG-004] 取 task_dir 调 resolvePath() 经单一入口解析，不当普通字符串绕过，不读写目录内容
│   ├── resolve-component.mjs         # [FR-CORE-001] 按工作流标识从 registry 定位组件
│   ├── dispatch-component.mjs        # [FR-CORE-002] [FR-CORE-004] 黑盒调起：收 JSON 结果+退出码+读 component_id+判成败；非法结果/非零状态判失败不静默(004)
│   ├── kernel.mjs                    # [FR-CORE-003] 编排串联，无业务分支（不按阶段名/业务类型分流）
│   └── resolve-path.mjs              # [FR-PATHG-004] 路径取值单一入口，拒绝宿主推断
├── scripts/
│   ├── scan-core-files.mjs           # [FR-CI-001] 边界扫描器（glob core/**/*.mjs，三处共用）
│   ├── check-anti-host.mjs           # [FR-GUARD-001] [FR-GUARD-002] 反宿主四类 lint 命中非零退出(001)+坏样本自检证明命中报红(002)
│   ├── check-path-guard.mjs          # [FR-PATHG-001/002/003] 禁改保护：扫改动命中报错(001)、幂等不写回(002)、known-gap 声明(003)
│   ├── check-extensibility.mjs       # [FR-EXT-001] [FR-EXT-002] [FR-EXT-003] 可换性(001)+扩展性(002)两件独立验收(003)
│   └── run-checks.mjs                # [FR-CI-001] [FR-CI-002] [FR-CI-003] M2 校验聚合入口(001)串进 npm run check 纳统一入口由 CI 跑(003)；自带漏扫+变异自检(002)
└── fixtures/                         # [FR-CI-002] 坏样本（变异自测用，故意改坏必红）
    ├── anti-host-bad/*.mjs           # 四类宿主耦合各一坏样本
    ├── path-guard-bad/               # 越界改动样本
    └── config-bad/                   # 缺必备键样本 + 运行态字段样本(runtime-state-field.yaml, FR-CFG-003)
```

### 测试文件

```text
workflowhub/core/__tests__/ 或 tests/
├── kernel.test.mjs            # [FR-CORE-001/002/003] 调起/换/失败/非法输出 行为测试（P0）
├── load-config.test.mjs       # [FR-CFG-001] [FR-CFG-002] [FR-CFG-003] [FR-CFG-004] 缺必备键红、占位键缺失绿（P1）
├── resolve-path.test.mjs      # [FR-PATHG-004] 宿主推断方式被拒（P1）
├── check-anti-host.test.mjs   # [FR-GUARD-001/FR-CI-002] 四类坏样本必红 + 漏扫自检（P0）
├── check-path-guard.test.mjs  # [FR-PATHG-001/002/003] 越界改动必红、幂等、known-gap 声明（P1）
└── check-extensibility.test.mjs # [FR-EXT-001/002] 替换/新增核心零改（P0）
```

### 修改文件（向 M1 挂载，spec 第 11 章"新增挂载"项）

```text
workflowhub/
├── package.json              # 改：scripts.check 串接 node scripts/run-checks.mjs；
│                             #     devDeps 加 vitest + scripts.test=vitest run；deps 加 js-yaml
└── .github/workflows/ci.yml  # 改：CI 增跑 npm test（vitest），保留 npm run check
```

**回归判据**（spec 第 11 章）：改 `package.json` check 串接 M2 校验后，M1 的 `verify-structure.mjs`（宪法 20 条/checklist）仍在 check 里跑且仍绿 = M1 结构校验未被破坏。

---

## 数据流向

```text
npm run check / CI
  → markdownlint-cli2（M1）
  → node scripts/verify-structure.mjs（M1，回归保护）
  → node scripts/run-checks.mjs（M2 新增聚合）
        ├→ scan-core-files.mjs   列 core/**/*.mjs
        ├→ check-anti-host.mjs   扫四类宿主耦合 → 命中 exit≠0
        ├→ check-path-guard.mjs  扫越界改动 → 命中 exit≠0
        ├→ check-extensibility.mjs 替换/新增验收 → 不满足 exit≠0
        └→ 漏扫+变异自检         坏样本必红（父子进程语义：父跑坏样本确认子非零，父返 0）

核心运行时（被组件调用方驱动，M2 只到骨架）：
  kernel.mjs → load-config.mjs（读 YAML）→ resolve-component.mjs（registry 定位）
            → dispatch-component.mjs（黑盒调起，收 JSON+退出码+component_id）→ 判成败
  所有路径取值 → resolve-path.mjs（单一入口，拒宿主推断）
  task_dir（框架配置）→ parse-framework-config.mjs → resolve-path.mjs（经单一入口解析，不绕过）
```

---

## 依赖情况

- **新增 npm 包**：`js-yaml`（dependencies，运行时解析 YAML，决策 12）；`vitest`（devDependencies，测试）。
- **依赖已有模块**：M1 的 `npm run check` 入口（向其串接，不替换）；M1 `verify-structure.mjs` 范式（F9 可证伪，M2 checker 照此）。
- **零依赖**：不引入 adapter / state-machine / plugin-registry / 任何框架（decision-log 无此概念，advisor 校准砍）。

---

## 与现有功能集成（逐项对照 spec 第 11 章影响范围）

| spec 第 11 章受影响项 | 怎么改 | 回归测 |
|----------------------|--------|--------|
| 统一检查入口 `npm run check` | package.json 串接 `node scripts/run-checks.mjs` | M1 markdownlint + verify-structure 仍在 check 内、仍绿 |
| CI 工作流 | ci.yml 增 `npm test`，保留 `npm run check` | CI 仍跑 M1 检查 |
| config 空目录 | 落 `workflowhub.yaml`（此前仅 .gitkeep） | verify-structure 不校验 config 内容，不受影响 |

无"删除/合并/重命名"类改动（全新仓新增）→ 无需反向引用扫描牵连文件。

---

## 实现风险点

| Phase | 风险 | 缓解 |
|-------|------|------|
| 反宿主 lint | grep pattern 漏判真实耦合（假绿） | 第 4 类标 known-gap；每类配坏样本变异自测，坏样本必红才算 checker 有效 |
| 漏扫自检 | 自检让 `npm run check` 永久红 | 父子进程语义：父进程跑坏样本、确认子进程退出≠0、父进程返回 0（决策 9/10，F8/F9） |
| 扩展性验收 | "核心零改"判据写成存在性检查（假绿） | 锚定 `core/**/*.mjs` diff：替换/新增操作后核心文件 diff 必须为空才算零改 |
| 边界扫描器 | glob 写错漏掉新增核心文件 | 漏扫自检放坏样本进 core/，断言被扫到（写错则自检红） |

---

## 复用优先矩阵

| 类别 | 项 |
|------|----|
| 可复用已有 | M1 `npm run check` 入口、verify-structure.mjs 的 F9 可证伪范式 |
| 需适配已有 | package.json scripts（串接而非替换）、ci.yml（增项而非重写） |
| 必须新增 | core/ 全部、scripts/ 全部 M2 checker、config/workflowhub.yaml、fixtures、tests |

---

## 验证策略（§13 四类标准，内联可逐条勾）

| 类 | 硬条目 |
|----|--------|
| 交付（Goal 可勾完成定义） | 6 模块全部落文件；`npm run check` 串入 M2 校验且绿；核心能读配置→定位→黑盒调起→判成败（骨架级） |
| 异常（失败/边界路径） | 缺必备键报错；组件返回非法 JSON 判失败；越界改动命中报错；四类宿主耦合命中非零 |
| 测试（双栏可跑命令） | gate_cmd: `npx vitest run`（仓根）；display_cmd: `npm run check`。坏样本变异自测全部红→修后绿 |
| 代码（仅引用宪法/lint） | 遵 workflowhub CONSTITUTION + CLAUDE.md；反宿主 lint error 是硬门非 warn |

---

## 证据契约预声明（每改动一条，机器可解析 ```evidence-contract``` 块）

> 每个改动一条 `evidence-contract` JSON 块，字段对齐 plan-evidence-contract.schema.json（red/green 各 7 字段 command/cwd/git_sha/exit_code/timestamp/phase/mode + evidenceSink + affectedTests）。
> RED 命令带 `--passWithNoTests=false`：测试文件不存在/匹配 0 文件时 vitest 非零退出（防路径过滤匹配空集假绿，见 apply 阶段防伪）。
> git_sha 为 plan 阶段占位（apply 真跑时回填真实 HEAD）。M2 deliverable 多为 checker，验收即变异自测（坏样本 RED，修后 GREEN）。

改动 1 — 配置解析 load-config（FR-CFG-001/002/003/004）：

```evidence-contract
{"red":{"command":"cd workflowhub && npx vitest run load-config --passWithNoTests=false","cwd":"workflowhub","git_sha":"PENDING","exit_code":1,"timestamp":"2026-06-22T12:00:00+08:00","phase":1,"mode":"RED"},"green":{"command":"cd workflowhub && npx vitest run load-config --passWithNoTests=false","cwd":"workflowhub","git_sha":"PENDING","exit_code":0,"timestamp":"2026-06-22T12:00:00+08:00","phase":1,"mode":"GREEN"},"evidenceSink":"apply/evidence/p1-backend-testing-test-report.json","affectedTests":["core/__tests__/load-config.test.mjs"]}
```

改动 2 — 调度核心 kernel/resolve-component/dispatch-component（FR-CORE-001/002/003/004）：

```evidence-contract
{"red":{"command":"cd workflowhub && npx vitest run kernel --passWithNoTests=false","cwd":"workflowhub","git_sha":"PENDING","exit_code":1,"timestamp":"2026-06-22T12:00:00+08:00","phase":2,"mode":"RED"},"green":{"command":"cd workflowhub && npx vitest run kernel --passWithNoTests=false","cwd":"workflowhub","git_sha":"PENDING","exit_code":0,"timestamp":"2026-06-22T12:00:00+08:00","phase":2,"mode":"GREEN"},"evidenceSink":"apply/evidence/p2-backend-testing-test-report.json","affectedTests":["core/__tests__/kernel.test.mjs"]}
```

改动 3 — 路径解析 resolve-path（FR-PATHG-004）：

```evidence-contract
{"red":{"command":"cd workflowhub && npx vitest run resolve-path --passWithNoTests=false","cwd":"workflowhub","git_sha":"PENDING","exit_code":1,"timestamp":"2026-06-22T12:00:00+08:00","phase":3,"mode":"RED"},"green":{"command":"cd workflowhub && npx vitest run resolve-path --passWithNoTests=false","cwd":"workflowhub","git_sha":"PENDING","exit_code":0,"timestamp":"2026-06-22T12:00:00+08:00","phase":3,"mode":"GREEN"},"evidenceSink":"apply/evidence/p3-backend-testing-test-report.json","affectedTests":["core/__tests__/resolve-path.test.mjs"]}
```

改动 3b — task_dir 框架配置解析 parse-framework-config（FR-CFG-004）：

```evidence-contract
{"red":{"command":"cd workflowhub && npx vitest run parse-framework-config --passWithNoTests=false","cwd":"workflowhub","git_sha":"PENDING","exit_code":1,"timestamp":"2026-06-22T12:00:00+08:00","phase":3,"mode":"RED"},"green":{"command":"cd workflowhub && npx vitest run parse-framework-config --passWithNoTests=false","cwd":"workflowhub","git_sha":"PENDING","exit_code":0,"timestamp":"2026-06-22T12:00:00+08:00","phase":3,"mode":"GREEN"},"evidenceSink":"apply/evidence/p3-backend-testing-test-report.json","affectedTests":["core/__tests__/parse-framework-config.test.mjs"]}
```

改动 4 — 反宿主 lint check-anti-host（FR-GUARD-001/002, FR-CI-001）：

```evidence-contract
{"red":{"command":"cd workflowhub && npx vitest run check-anti-host --passWithNoTests=false","cwd":"workflowhub","git_sha":"PENDING","exit_code":1,"timestamp":"2026-06-22T12:00:00+08:00","phase":4,"mode":"RED"},"green":{"command":"cd workflowhub && npx vitest run check-anti-host --passWithNoTests=false","cwd":"workflowhub","git_sha":"PENDING","exit_code":0,"timestamp":"2026-06-22T12:00:00+08:00","phase":4,"mode":"GREEN"},"evidenceSink":"apply/evidence/p4-backend-testing-test-report.json","affectedTests":["core/__tests__/check-anti-host.test.mjs"]}
```

改动 5 — 禁改保护 check-path-guard（FR-PATHG-001/002/003）：

```evidence-contract
{"red":{"command":"cd workflowhub && npx vitest run check-path-guard --passWithNoTests=false","cwd":"workflowhub","git_sha":"PENDING","exit_code":1,"timestamp":"2026-06-22T12:00:00+08:00","phase":5,"mode":"RED"},"green":{"command":"cd workflowhub && npx vitest run check-path-guard --passWithNoTests=false","cwd":"workflowhub","git_sha":"PENDING","exit_code":0,"timestamp":"2026-06-22T12:00:00+08:00","phase":5,"mode":"GREEN"},"evidenceSink":"apply/evidence/p5-backend-testing-test-report.json","affectedTests":["core/__tests__/check-path-guard.test.mjs"]}
```

改动 6 — 扩展性验收 check-extensibility（FR-EXT-001/002/003）：

```evidence-contract
{"red":{"command":"cd workflowhub && npx vitest run check-extensibility --passWithNoTests=false","cwd":"workflowhub","git_sha":"PENDING","exit_code":1,"timestamp":"2026-06-22T12:00:00+08:00","phase":6,"mode":"RED"},"green":{"command":"cd workflowhub && npx vitest run check-extensibility --passWithNoTests=false","cwd":"workflowhub","git_sha":"PENDING","exit_code":0,"timestamp":"2026-06-22T12:00:00+08:00","phase":6,"mode":"GREEN"},"evidenceSink":"apply/evidence/p6-backend-testing-test-report.json","affectedTests":["core/__tests__/check-extensibility.test.mjs"]}
```

改动 7 — 挂载 run-checks 进 npm check + CI（FR-CI-001/002/003）：

```evidence-contract
{"red":{"command":"cd workflowhub && npx vitest run run-checks --passWithNoTests=false","cwd":"workflowhub","git_sha":"PENDING","exit_code":1,"timestamp":"2026-06-22T12:00:00+08:00","phase":7,"mode":"RED"},"green":{"command":"cd workflowhub && npm run check","cwd":"workflowhub","git_sha":"PENDING","exit_code":0,"timestamp":"2026-06-22T12:00:00+08:00","phase":7,"mode":"GREEN"},"evidenceSink":"apply/evidence/p7-backend-testing-test-report.json","affectedTests":["core/__tests__/run-checks.test.mjs"]}
```

---

## 开关二阶预检

本 change 无 feature flag 类改动（不新增/翻转任何开关）→ 不适用（N/A）。

---

## UI Implementation Contract

本 change 零 UI（全部为核心代码 + checker 脚本 + 配置 + 测试）→ 不适用（N/A）。所有 phase `ui_change: false`。

---

## per-phase 测试设计（三要素：executorType + RED/GREEN + evidenceSink）

> 经 test-routing-advisor 判类：M2 全部为 Node 后端逻辑/checker → `backend-testing`（无前端、无 fullstack 切片）。方法论遵 testing-system-blueprint。

| Phase | executorType | RED（改前必败） | GREEN（改后必过） | evidenceSink |
|-------|-------------|-----------------|-------------------|--------------|
| P1 配置解析 | backend-testing | `npx vitest run load-config` | `npx vitest run load-config` | `apply/evidence/p1-backend-testing-test-report.json` |
| P2 调度核心 | backend-testing | `npx vitest run kernel` | `npx vitest run kernel` | `apply/evidence/p2-backend-testing-test-report.json` |
| P3 路径解析 | backend-testing | `npx vitest run resolve-path` | `npx vitest run resolve-path` | `apply/evidence/p3-backend-testing-test-report.json` |
| P4 反宿主 lint | backend-testing | `npx vitest run check-anti-host` | `npx vitest run check-anti-host` | `apply/evidence/p4-backend-testing-test-report.json` |
| P5 禁改保护 | backend-testing | `npx vitest run check-path-guard` | `npx vitest run check-path-guard` | `apply/evidence/p5-backend-testing-test-report.json` |
| P6 扩展性验收 | backend-testing | `npx vitest run check-extensibility` | `npx vitest run check-extensibility` | `apply/evidence/p6-backend-testing-test-report.json` |
| P7 挂载+CI | backend-testing | `npm run check`（M2 未串入） | `npm run check`（M2 串入且绿，M1 回归绿） | `apply/evidence/p7-backend-testing-test-report.json` |

---

## 自检 5 条（plan stage 退出前必填，结果勾选）

- [x] 宪法门禁逐条勾选（含 CLAUDE.md 工程硬规则）— 见上「Constitution Check」，无违反
- [x] 每个 task 引用了至少一个 FR 编号 — 见 tasks.md（每 task 带 [FR-XXX]）
- [x] tasks.md 每个 phase 有 Goal/Files/Tasks/Verify/Knowledge/STOP 六节 — 见 tasks.md
- [x] 上游合并安全评估完成 — 全在 workflowhub 仓新增，零触碰 multica 高风险文件/forbidden 清单
- [x] 不适用段已标注 N/A 并写理由 — 开关二阶预检 N/A（无 flag）、UI Contract N/A（零 UI）
