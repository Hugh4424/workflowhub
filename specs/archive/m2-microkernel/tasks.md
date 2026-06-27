# Tasks: M2 微内核核心

**Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)
**交付仓**: `/Users/Hugh/Hugh/Project/workflowhub`（路径均相对仓根）
**TDD**: 每 phase 先写失败测试（RED），再实现到绿（GREEN）。M2 deliverable 多为 checker，验收即变异自测（坏样本必红）。

> 路径约定：`apply/evidence/` 与 `apply/phase-N.md` 落在 task 跟踪目录
> `/Users/Hugh/Hugh/Knowledge/Projects/multica-agenthub/tasks/m2-microkernel/`；
> 其余 `core/` `scripts/` `config/` `fixtures/` `tests/` 均在 workflowhub 仓根。

---

## Phase 0: 测试基建 + 核心骨架就位

- ui_change: false

### Goal
装好 vitest + js-yaml，建空 `core/` 目录与第一个失败测试，让后续 phase 的 RED/GREEN 有 runner 可跑。

### Files
- `workflowhub/package.json`（改：devDeps 加 vitest、deps 加 js-yaml、scripts.test=`vitest run`）
- `workflowhub/core/.gitkeep`（新增占位，使 `core/**/*.mjs` 锚点目录存在）
- `workflowhub/vitest.config.mjs`（新增，最小配置）

### Tasks
- [x] T001 装依赖：`workflowhub/package.json` devDeps 加 `vitest`、deps 加 `js-yaml`、`scripts.test` 设为 `vitest run`，运行 `npm install`
  - 入参：现有 package.json
  - 出参：package.json + package-lock.json 更新，node_modules 含 vitest/js-yaml
  - 文件：`workflowhub/package.json`
  - 验证：`cd workflowhub && npx vitest --version` 输出版本号
- [x] T002 建 vitest 最小配置 + core 目录占位
  - 入参：无
  - 出参：`vitest.config.mjs`、`core/.gitkeep`
  - 文件：`workflowhub/vitest.config.mjs`、`workflowhub/core/.gitkeep`
  - 验证：`cd workflowhub && npx vitest run` 退出 0（无测试也算就绪）
- [x] T003 Knowledge 维护：写 `apply/phase-0.md`（Files Touched + 依赖版本），原始 `npm install` 输出落 `apply/evidence/p0-install.stdout`，同步 state.json
  - 文件：`tasks/m2-microkernel/apply/phase-0.md`、`apply/evidence/p0-install.stdout`
  - 验证：`ls apply/phase-0.md apply/evidence/p0-install.stdout`

### Verify
`cd workflowhub && npx vitest run` 退出 0；`npx vitest --version` 有输出。

### Knowledge
`apply/phase-0.md` 记依赖版本与 core 目录就位；evidence 落 install 输出。

### STOP
依赖装好、runner 可跑、core 目录存在后停，进 Phase 1。

---

## Phase 1: 配置解析（load-config）

- ui_change: false

### Goal
读 `config/workflowhub.yaml`，解析成约定键集合：registry 必备（缺则报错），其余 4 占位键 shape-only（存在则查形状，缺失不报错不消费值）。

### Files
- `workflowhub/core/load-config.mjs`（新增）[FR-CFG-001] [FR-CFG-002] [FR-CFG-003]
- `workflowhub/config/workflowhub.yaml`（新增）[FR-CFG-001] [FR-CFG-004]
- `workflowhub/core/__tests__/load-config.test.mjs`（新增）
- `workflowhub/fixtures/config-bad/missing-registry.yaml`（新增坏样本）
- `workflowhub/fixtures/config-bad/runtime-state-field.yaml`（新增坏样本：含运行态字段，FR-CFG-003）

### Tasks
- [x] T004 [FR-CFG-001] [FR-CFG-003] RED：写 `load-config.test.mjs`——断言「缺 registry 必备键→抛错」「占位键缺失→不抛错」「占位键存在但形状错→抛错」「**含运行态字段（current/active/runtime 等运行时当前状态键）的配置→抛错或被明确排除（FR-CFG-003，防全局单指针并发串台）**」，此时无实现，测试红
  - 入参：spec FR-CFG-001/002/003 验收（缺必备键红、占位键缺失绿、运行态字段必拒）+ decision-log 决策 8（运行态绝不混入全局配置）
  - 出参：失败测试文件 + 运行态坏样本 fixture
  - 文件：`workflowhub/core/__tests__/load-config.test.mjs`、`workflowhub/fixtures/config-bad/runtime-state-field.yaml`
  - 验证：`cd workflowhub && npx vitest run load-config --passWithNoTests=false`（红）
- [x] T005 [FR-CFG-001] [FR-CFG-002] [FR-CFG-003] GREEN：实现 `load-config.mjs`——用 js-yaml 读 YAML，校验 registry 必备，4 占位键 shape-only；**定义静态配置允许键白名单（registry + 4 占位键 + task_dir），出现允许集之外的运行态字段（current/active/runtime 等）即抛错（FR-CFG-003）**
  - 入参：`config/workflowhub.yaml` + 两类坏样本（缺 registry / 运行态字段）
  - 出参：`load-config.mjs` 导出 loadConfig()，含运行态字段拒绝
  - 文件：`workflowhub/core/load-config.mjs`
  - 验证：`cd workflowhub && npx vitest run load-config --passWithNoTests=false`（绿，运行态坏样本必红）
- [x] T006 [FR-CFG-001] [FR-CFG-004] 写最小 `config/workflowhub.yaml`：registry 含至少一条组件清单条目 + task_dir 轻量声明（静态配置，**其经 resolve-path 解析的接线与断言在 Phase 3 落地**）+ 4 占位键示意
  - 入参：plan 组件清单最小结构（component_id + 定位键）
  - 出参：合法 YAML 配置
  - 文件：`workflowhub/config/workflowhub.yaml`
  - 验证：`cd workflowhub && node -e "import('./core/load-config.mjs').then(m=>m.loadConfig())"` 不抛错
- [x] T007 Knowledge 维护：写 `apply/phase-1.md`（Files Touched + RED/GREEN 摘要），evidence 落 `apply/evidence/p1-backend-testing-test-report.json`
  - 文件：`tasks/m2-microkernel/apply/phase-1.md`
  - 验证：`ls apply/phase-1.md apply/evidence/p1-backend-testing-test-report.json`

### Verify
RED→GREEN：`npx vitest run load-config` 改前红、实现后绿；缺 registry 样本红、占位键缺失绿。

### Knowledge
`apply/phase-1.md` 记配置约定键集与 shape-only 规则。

### STOP
配置能解析、必备/占位键行为正确后停，进 Phase 2。

---

## Phase 2: 调度核心（kernel + resolve-component + dispatch-component）

- ui_change: false

### Goal
核心读配置→按工作流标识从 registry 定位组件→黑盒调起（收 JSON 结果+退出码+读 component_id+判成败）；核心无业务分支。

### Files
- `workflowhub/core/resolve-component.mjs`（新增）[FR-CORE-001]
- `workflowhub/core/dispatch-component.mjs`（新增）[FR-CORE-002]
- `workflowhub/core/kernel.mjs`（新增）[FR-CORE-003]
- `workflowhub/core/__tests__/kernel.test.mjs`（新增）

### Tasks
- [x] T008 [FR-CORE-001] [FR-CORE-002] [FR-CORE-003] [FR-CORE-004] RED：写 `kernel.test.mjs`——四场景：①调起合法组件读出 component_id ②换组件（改 registry 指向另一 id，核心代码不变）③组件返回失败状态→判失败（FR-CORE-004）④组件返回非法 JSON→判失败（FR-CORE-004）。无实现，红
  - 入参：spec 域 CORE 验收 + 黑盒契约
  - 出参：失败测试
  - 文件：`workflowhub/core/__tests__/kernel.test.mjs`
  - 验证：`cd workflowhub && npx vitest run kernel`（红）
- [x] T009 [FR-CORE-001] GREEN：实现 `resolve-component.mjs`——按工作流标识从 registry 定位组件条目，返回 component_id + 定位信息
  - 出参：`resolve-component.mjs` 导出 resolveComponent()
  - 文件：`workflowhub/core/resolve-component.mjs`
  - 验证：`cd workflowhub && npx vitest run kernel`（部分绿）
- [x] T010 [FR-CORE-002] GREEN：实现 `dispatch-component.mjs`——黑盒调起组件，收回结构化 JSON 结果，读 component_id，据退出码/状态判成败；不规定传输形态
  - 出参：`dispatch-component.mjs` 导出 dispatchComponent()
  - 文件：`workflowhub/core/dispatch-component.mjs`
  - 验证：`cd workflowhub && npx vitest run kernel`（更多绿）
- [x] T011 [FR-CORE-003] GREEN：实现 `kernel.mjs`——串联 load-config→resolve→dispatch，零业务分支（不按阶段名/业务类型 if/switch）
  - 出参：`kernel.mjs` 导出 runKernel()
  - 文件：`workflowhub/core/kernel.mjs`
  - 验证：`cd workflowhub && npx vitest run kernel`（全绿）
- [x] T012 Knowledge 维护：写 `apply/phase-2.md`，evidence 落 `apply/evidence/p2-backend-testing-test-report.json`
  - 文件：`tasks/m2-microkernel/apply/phase-2.md`
  - 验证：`ls apply/phase-2.md apply/evidence/p2-backend-testing-test-report.json`

### Verify
`npx vitest run kernel` 四场景全绿；换组件场景核心 `.mjs` diff 为空。

### Knowledge
`apply/phase-2.md` 记黑盒契约落法与无业务分支证据。

### STOP
四场景全绿、核心无业务分支后停，进 Phase 3。

---

## Phase 3: 路径解析入口（resolve-path）

- ui_change: false

### Goal
所有路径取值走单一入口 `resolve-path.mjs`，拒绝宿主推断（不 REPO_ROOT 上溯、不硬编码 host 路径）；并把配置里的 task_dir（FR-CFG-004 框架配置）接到此单一入口解析，证明它经 resolver、不被当普通字符串绕过。

### Files
- `workflowhub/core/resolve-path.mjs`（新增）[FR-PATHG-004]
- `workflowhub/core/parse-framework-config.mjs`（新增）[FR-CFG-004]
- `workflowhub/core/__tests__/resolve-path.test.mjs`（新增）
- `workflowhub/core/__tests__/parse-framework-config.test.mjs`（新增）

### Tasks
- [x] T013 [FR-PATHG-004] RED：写 `resolve-path.test.mjs`——断言「显式传入路径→正常解析」「试图用宿主推断（从 cwd 推断/向上找宿主根/依赖外部宿主派生布局）→被拒/抛错」，无实现，红
  - 入参：spec FR-PATHG-004 验收 + 决策 7/13
  - 出参：失败测试
  - 文件：`workflowhub/core/__tests__/resolve-path.test.mjs`
  - 验证：`cd workflowhub && npx vitest run resolve-path --passWithNoTests=false`（红）
- [x] T014 [FR-PATHG-004] GREEN：实现 `resolve-path.mjs`——单一入口，只接受显式传入的路径配置，拒绝宿主推断
  - 出参：`resolve-path.mjs` 导出 resolvePath()
  - 文件：`workflowhub/core/resolve-path.mjs`
  - 验证：`cd workflowhub && npx vitest run resolve-path --passWithNoTests=false`（绿）
- [x] T014b [FR-CFG-004] RED：写 `parse-framework-config.test.mjs`——断言「task_dir 经 resolvePath() 单一入口解析、返回解析后路径」「task_dir 用宿主推断写法（cwd 推断/上溯）→被 resolver 拒/抛错」「M2 不读写 task_dir 目录内容（只解析路径，不触碰运行态语义）」，无实现，红
  - 入参：spec FR-CFG-004 验收（经路径解析单一入口解析、不消费运行态语义）+ 决策 3、13
  - 出参：失败测试
  - 文件：`workflowhub/core/__tests__/parse-framework-config.test.mjs`
  - 验证：`cd workflowhub && npx vitest run parse-framework-config --passWithNoTests=false`（红）
- [x] T014c [FR-CFG-004] GREEN：实现 `parse-framework-config.mjs`——从已 load 的配置取 task_dir，调 resolvePath() 解析（解析责任落此模块，task_dir 不被当普通字符串绕过 resolver）；只解析不读写目录内容
  - 出参：`parse-framework-config.mjs` 导出 parseFrameworkConfig()
  - 文件：`workflowhub/core/parse-framework-config.mjs`
  - 验证：`cd workflowhub && npx vitest run parse-framework-config --passWithNoTests=false`（绿，宿主推断 task_dir 被拒）
- [x] T015 Knowledge 维护：写 `apply/phase-3.md`，evidence 落 `apply/evidence/p3-backend-testing-test-report.json`
  - 文件：`tasks/m2-microkernel/apply/phase-3.md`
  - 验证：`ls apply/phase-3.md apply/evidence/p3-backend-testing-test-report.json`

### Verify
`npx vitest run resolve-path` 绿、宿主推断被拒；`npx vitest run parse-framework-config` 绿、task_dir 经 resolver 解析、宿主推断 task_dir 被拒、核心不读写该目录。

### Knowledge
`apply/phase-3.md` 记路径单一入口、拒推断、task_dir 经 resolver 解析证据。

### STOP
路径入口拒宿主推断后停，进 Phase 4。

---

## Phase 4: 反宿主依赖 lint（check-anti-host + scan-core-files）

- ui_change: false

### Goal
建边界扫描器 `scan-core-files.mjs`（glob `core/**/*.mjs`），反宿主 lint 扫核心本体四类宿主耦合，命中非零退出；漏扫自检 + 四类坏样本变异自测。

### Files
- `workflowhub/scripts/scan-core-files.mjs`（新增）[FR-CI-001]
- `workflowhub/scripts/check-anti-host.mjs`（新增）[FR-GUARD-001]
- `workflowhub/core/__tests__/check-anti-host.test.mjs`（新增）
- `workflowhub/fixtures/anti-host-bad/{hardcoded-path,repo-root-climb,source-derived,claude-hook}.mjs`（4 坏样本）

### Tasks
- [x] T016 [FR-CI-001] GREEN：实现 `scan-core-files.mjs`——glob 匹配 `core/**/*.mjs` 返回路径数组（反宿主/扩展性/漏扫三处共用此唯一锚点）
  - 出参：`scan-core-files.mjs` 导出 scanCoreFiles()
  - 文件：`workflowhub/scripts/scan-core-files.mjs`
  - 验证：`cd workflowhub && node -e "import('./scripts/scan-core-files.mjs').then(m=>console.log(m.scanCoreFiles()))"` 列出现有 core/*.mjs
- [x] T017 [FR-GUARD-001] [FR-GUARD-002] RED：写 `check-anti-host.test.mjs` + 4 坏样本——断言「4 类坏样本各自命中、lint 非零退出（FR-GUARD-001）」「已知坏样本自检证明实际命中时报红、非空跑通过（FR-GUARD-002）」「漏扫自检：core 下故意含耦合的样本被 scan 列入」，无 checker，红
  - 入参：plan 留定点 2（四类 pattern + 第4类 known-gap）
  - 出参：失败测试 + 4 坏样本 fixture
  - 文件：`workflowhub/core/__tests__/check-anti-host.test.mjs`、`workflowhub/fixtures/anti-host-bad/*.mjs`
  - 验证：`cd workflowhub && npx vitest run check-anti-host`（红）
- [x] T018 [FR-GUARD-001] [FR-GUARD-002] GREEN：实现 `check-anti-host.mjs`——调 scan-core-files 取清单，扫四类耦合（host 绝对路径/REPO_ROOT 上溯/source-derived/Claude hook 硬绑），命中非零退出（001）；自带坏样本自检证明实际命中报红（002）；第4类注释标 known-gap
  - 出参：`check-anti-host.mjs`（CLI 可跑，命中 exit≠0）
  - 文件：`workflowhub/scripts/check-anti-host.mjs`
  - 验证：`cd workflowhub && npx vitest run check-anti-host`（绿，4 坏样本必红+漏扫自检绿）
- [x] T019 Knowledge 维护：写 `apply/phase-4.md`，evidence 落 `apply/evidence/p4-backend-testing-test-report.json`
  - 文件：`tasks/m2-microkernel/apply/phase-4.md`
  - 验证：`ls apply/phase-4.md apply/evidence/p4-backend-testing-test-report.json`

### Verify
`npx vitest run check-anti-host` 绿；4 类坏样本各自触发非零退出；漏扫自检证明 scan 不漏新核心文件。

### Knowledge
`apply/phase-4.md` 记四类 pattern + 第4类 known-gap 诚实标注。

### STOP
四类坏样本必红、漏扫自检绿后停，进 Phase 5。

---

## Phase 5: 禁改保护（check-path-guard）

- ui_change: false

### Goal
按禁改清单扫改动，命中报错（非零退出），幂等不写回。变异自测：越界改动必红 + 重复运行结果一致。

### Files
- `workflowhub/scripts/check-path-guard.mjs`（新增）[FR-PATHG-001] [FR-PATHG-002] [FR-PATHG-003]
- `workflowhub/core/__tests__/check-path-guard.test.mjs`（新增）
- `workflowhub/fixtures/path-guard-bad/`（越界改动样本）

### Tasks
- [x] T020 [FR-PATHG-001] [FR-PATHG-002] [FR-PATHG-003] RED：写 `check-path-guard.test.mjs` + 越界样本——断言「命中禁改清单的改动→非零退出，清单外→放过（FR-PATHG-001）」「幂等：连跑两次不写回、结果一致（FR-PATHG-002）」「能力声明列出已知不覆盖的旁路方式（FR-PATHG-003）」，无 checker，红
  - 入参：spec FR-PATHG-001/002/003 验收
  - 出参：失败测试 + 越界 fixture
  - 文件：`workflowhub/core/__tests__/check-path-guard.test.mjs`、`workflowhub/fixtures/path-guard-bad/`
  - 验证：`cd workflowhub && npx vitest run check-path-guard`（红）
- [x] T021 [FR-PATHG-001] [FR-PATHG-002] [FR-PATHG-003] GREEN：实现 `check-path-guard.mjs`——按声明式禁改清单扫改动，命中报错非零退出、清单外放过（001）；纯读不写回幂等（002）；脚本含"已知不覆盖旁路方式"诚实声明（003）
  - 出参：`check-path-guard.mjs`
  - 文件：`workflowhub/scripts/check-path-guard.mjs`
  - 验证：`cd workflowhub && npx vitest run check-path-guard`（绿，越界必红+幂等绿）
- [x] T022 Knowledge 维护：写 `apply/phase-5.md`，evidence 落 `apply/evidence/p5-backend-testing-test-report.json`
  - 文件：`tasks/m2-microkernel/apply/phase-5.md`
  - 验证：`ls apply/phase-5.md apply/evidence/p5-backend-testing-test-report.json`

### Verify
`npx vitest run check-path-guard` 绿；越界改动非零退出；连跑两次幂等。

### Knowledge
`apply/phase-5.md` 记禁改清单与幂等证据。

### STOP
越界必红、幂等绿后停，进 Phase 6。

---

## Phase 6: 可换性/扩展性验收（check-extensibility）

- ui_change: false

### Goal
替换、新增两件独立验收：替换组件 = 改 registry 指向另一 component_id，核心 `core/**/*.mjs` diff 为空；新增 = registry 加条目 + 目录加组件，核心零改。锚定边界规则 diff 判"核心零改"，非存在性检查。

### Files
- `workflowhub/scripts/check-extensibility.mjs`（新增）[FR-EXT-001] [FR-EXT-002] [FR-EXT-003]
- `workflowhub/core/__tests__/check-extensibility.test.mjs`（新增）

### Tasks
- [x] T023 [FR-EXT-001] [FR-EXT-002] [FR-EXT-003] RED：写 `check-extensibility.test.mjs`——断言「可换性：组件指向替身后核心零改即调起替身、结果含替身身份，核心被改则失败（FR-EXT-001）」「扩展性：新增占位组件仅以工作流标识触发、核心零改即发现调起，核心被改则失败（FR-EXT-002）」「两件验收彼此独立可单跑（FR-EXT-003）」，无 checker，红
  - 入参：plan 留定点 1（diff 锚定 core/**/*.mjs）+ 决策 4、11
  - 出参：失败测试
  - 文件：`workflowhub/core/__tests__/check-extensibility.test.mjs`
  - 验证：`cd workflowhub && npx vitest run check-extensibility`（红）
- [x] T024 [FR-EXT-001] [FR-EXT-002] [FR-EXT-003] GREEN：实现 `check-extensibility.mjs`——可换性+扩展性两件独立验收，调 scan-core-files 取核心清单，比对操作前后核心 diff，非空即非零退出
  - 出参：`check-extensibility.mjs`
  - 文件：`workflowhub/scripts/check-extensibility.mjs`
  - 验证：`cd workflowhub && npx vitest run check-extensibility`（绿）
- [x] T025 Knowledge 维护：写 `apply/phase-6.md`，evidence 落 `apply/evidence/p6-backend-testing-test-report.json`
  - 文件：`tasks/m2-microkernel/apply/phase-6.md`
  - 验证：`ls apply/phase-6.md apply/evidence/p6-backend-testing-test-report.json`

### Verify
`npx vitest run check-extensibility` 绿；替换/新增后核心 diff 为空判零改，diff 非空判红。

### Knowledge
`apply/phase-6.md` 记 diff 锚定法（防存在性假绿）。

### STOP
替换/新增验收锚定 diff 判零改后停，进 Phase 7。

---

## Phase 7: 挂载统一检查入口 + CI（run-checks）

- ui_change: false

### Goal
建 M2 校验聚合 `run-checks.mjs`，串进 `npm run check`（保留 M1 markdownlint + verify-structure），CI 增跑 `npm test`。回归：M1 结构校验仍在 check 内、仍绿。

### Files
- `workflowhub/scripts/run-checks.mjs`（新增）[FR-CI-001/002]
- `workflowhub/package.json`（改：scripts.check 串接 run-checks）
- `workflowhub/.github/workflows/ci.yml`（改：增 npm test）
- `workflowhub/core/__tests__/run-checks.test.mjs`（新增，集成）

### Tasks
- [x] T026 [FR-CI-001] [FR-CI-002] RED：写 `run-checks.test.mjs`——断言「run-checks 聚合调起反宿主/path-guard/扩展性三 checker（FR-CI-001）」「任一 checker 报红→run-checks 非零退出」「每项变异自检：坏样本让被测检查报红、整体流程对正常样本仍绿，父子进程语义父跑坏样本确认子非零、父返 0（FR-CI-002）」，无聚合，红
  - 入参：plan 数据流向 + 父子进程语义
  - 出参：失败测试
  - 文件：`workflowhub/core/__tests__/run-checks.test.mjs`
  - 验证：`cd workflowhub && npx vitest run run-checks`（红）
- [x] T027 [FR-CI-001] [FR-CI-002] GREEN：实现 `run-checks.mjs`——顺序调 check-anti-host/check-path-guard/check-extensibility，任一非零则聚合非零退出（CI-001）；含漏扫+变异自检（父子进程语义，坏样本子过程验证、主流程正常样本仍绿，不让 npm check 永久红，CI-002）
  - 出参：`run-checks.mjs`
  - 文件：`workflowhub/scripts/run-checks.mjs`
  - 验证：`cd workflowhub && npx vitest run run-checks`（绿）
- [x] T028 [FR-CI-001] [FR-CI-003] 挂载：`package.json` scripts.check 末尾串 `&& node scripts/run-checks.mjs`；`ci.yml` 增 `npm test` 步骤（保留 npm run check）。完成标准=正常样本全绿+各检查坏样本自检证明能报红，全部纳入统一入口由 CI 跑（FR-CI-003）
  - 入参：M1 package.json check / ci.yml
  - 出参：check 串入 M2 校验，CI 跑 vitest
  - 文件：`workflowhub/package.json`、`workflowhub/.github/workflows/ci.yml`
  - 验证：`cd workflowhub && npm run check`（M2 校验执行且绿，M1 markdownlint+verify-structure 仍绿）
- [x] T029 Knowledge 维护：写 `apply/phase-7.md`，evidence 落 `apply/evidence/p7-backend-testing-test-report.json`；同步 workflow-issues.jsonl 与 state.json
  - 文件：`tasks/m2-microkernel/apply/phase-7.md`
  - 验证：`ls apply/phase-7.md apply/evidence/p7-backend-testing-test-report.json`

### Verify
`npm run check` 一条命令跑全（M1 markdownlint + verify-structure + M2 run-checks），全绿；CI 增跑 npm test。回归：故意删 M1 一条宪法→verify-structure 红（证明 M1 校验仍在闭环内）。

### Knowledge
`apply/phase-7.md` 记挂载点与回归判据（M1 结构校验未被破坏）。

### STOP
一条命令全检通过、M1 回归绿后停，整个 apply 主体完成，进 test-acceptance。

---

## Dependencies（phase 完成顺序）

```text
Phase 0（基建）→ Phase 1（配置）→ Phase 2（核心，依赖配置）
                              → Phase 3（路径，独立）
Phase 4（反宿主，依赖 core 有文件可扫，即 P2 后）
Phase 5（禁改，独立于核心逻辑）
Phase 6（扩展性，依赖 scan-core-files 即 P4 后）
Phase 7（挂载，依赖 P4/P5/P6 三 checker 都在）
```

串行为主（P2 依赖 P1，P6 依赖 P4 的 scan-core-files，P7 依赖 P4/5/6）。P3、P5 相对独立。

## 任务总数

31 个 task，7 个实现 phase + 1 个基建 phase（Phase 0）。每 phase 末为 Knowledge 维护 task。每实现 task 带 [FR-XXX] 编号。ui_change 全 false。
