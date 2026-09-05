# M17 需求规格：repo-contained skills 运行时适配 + 多 CLI 兼容验证

## 速读卡（30 秒）

本规格把 roadmap M17a（repo-contained skills 运行时适配）与 M17b（多 CLI 兼容验证）落成可验收的产品行为：17 项工作分三条主线——A）技能清单机器真相与最小留证，B）多 CLI 接线深化（死约定清理、显式身份与 Stage Agent outcome、Claude/宿主 outcome 接线、文档对齐），C）技能整理与结构簿记。判据一句话：十条验收逐条有最小留证（一个汇总文档、一个测试文件、一次存档输出），归位类工作零行为变更。Kimi、capability 扩展、F1/F2/F3 延期交接，不在本次范围。

## 1. 问题与紧迫性

workflowhub 的能力面（repo-contained skills、四宿主日常使用）已被用户多次实际验证（F-001/F-002），但缺少仓内可复查的正式证据：没有权威打包清单、没有 CLI 映射文档、没有核实记录，M17 无法宣告完成，M18 打包分发无法启动。同时账面与现实存在漂移：孤儿技能占着登记位、协议文档写着代码从未兑现的死约定、目录真相表不全。紧迫性来自两点：M17 是 M18 的前置；漂移每多留一天，后来读者多被坑一次。

## 2. 背景、目标与范围

背景：M16 完成后盘点 roadmap，确认 M17 实为 M17a+M17b 两个里程碑；两条用户验证事实（干净环境无 superpowers 可跑通、四宿主日常可用）有结构性证据支持（29 个依赖技能全部 repo-local、resolver 硬锁仓内、无 superpowers 运行时引用）。

目标：让 M17 宣告完成成立——干净环境可复现跑通、十条验收逐条有最小留证、多 CLI 接线与账面债务清账，为 M18 解锁。

范围（17 项，decision-log D-002/D-005 定案）：

- 主线 A（验收兑现）：①技能清单生成器（从仓内 catalog 生成权威打包清单）②metrics_enabled 声明与扫描③X2/X3/X4 处置④CLI 映射文档+Codex 核实记录+Claude 端到端样例记录⑤CLI 归一契约测试+Claude 结果包端到端⑥干净安装留档。
- 主线 B（多 CLI 深化）：⑦协议死约定清理⑧显式宿主身份与 Stage Agent outcome 契约⑨Claude/宿主显式 outcome 接线验证⑪文档对齐（⑩ Kimi 摸底已移出）。
- 主线 C（整理与簿记）：⑫孤儿三技能裁定⑬复用登记同步+状态词表+审计⑭死代码删除与解析配置评估⑮审查双副本收敛⑯阶段契约文件纯归位⑰能力清单迁移登记⑱目录真相表全面修复+知识库回写。

Clarify 事实：spec-clarify trigger = false（理由：D-010 已由用户确认，明确采用现有显式 identity/outcome 架构；剩余为工程细节；开放问题：0）。

## 3. 用户场景与状态覆盖

本任务的「用户」是 workflowhub 的使用者：各 CLI 宿主中的开发者与 AI 助手，以及维护者本人。无终端用户页面。

### SCN-001：干净环境从零跑通核心流程

使用者在不安装 superpowers/gstack 的环境里安装 workflowhub，在任一受支持宿主（Claude Code、Codex）中跑通一个五阶段任务样例。系统状态：技能解析全部命中仓内副本；任务身份通过显式 `--project/--task` 或认证 worktree 提供；Stage Agent 结果由宿主显式提交；缺结果如实记 `unavailable`。结束态：任务四份材料与质量记录完整生成。

### SCN-002：维护者改技能目录后检测漂移

维护者修改仓内技能目录登记（新增/改名/改版本）后运行清单生成器。状态：一致（生成物与目录登记逐字段相同）或漂移（diff 非空并逐字段指出）。漂移被现有检查器报告，含 metrics_enabled 未开启的核心技能名单。结束态：维护者按报告修复或重新生成。

### SCN-003：Claude 宿主提交显式阶段结果

使用者在 Claude Code 中执行 workflowhub 任务，宿主以显式任务绑定、阶段、attempt 和已执行结果调用现有 Stage Agent bridge。bridge 校验 task/stage/attempt、snapshot 和 material 绑定，生成 `workflowhub-stage-outcomes.v1`；公共 `stage-runtime run --action=execute` 消费 `outcome_ref`。缺少结果、绑定冲突或验证失败时如实记 `unavailable`/失败，WorkflowHub 不读取、扫描或反查 Claude transcript。

### SCN-004：孤儿技能清理后的指引一致性

使用者触发已删除技能的旧入口或遇到合并冲突。状态：已删技能（qa-only、verify-change）不再出现在任何登记与报错指引中；合并冲突报错路径继续指向保留的 resolving-merge-conflicts 技能。结束态：报错指引不落空，账面与现实一致。

## 4. 产品事实与假设（PFACT）

- **PFACT-01**：29 个依赖技能全部为仓内 repo-local 文件，resolver 硬锁仓内 skills，无 superpowers 运行时引用
  - 状态：verified
  - 来源：decision-log F-001/F-002
- **PFACT-02**：六项既有剩余工作全部必要，其中第二项收窄、第六项扩大
  - 状态：verified
  - 来源：decision-log F-003
- **PFACT-03**：三个追加方向（技能整理、项目简化、多 CLI 深化）候选清单已出，19 个域级契约测试可作归位批兜底
  - 状态：verified
  - 来源：decision-log F-003/F-004
- **PFACT-04**：协议文档两行死约定在全仓无生产消费者；qa-only 与 verify-change 为死契约；resolving-merge-conflicts 有活的报错路径引用
  - 状态：verified
  - 来源：decision-log F-004 + G-002 核查
- **PFACT-05**：历史调研显示 Claude 会话记录为按目录编码的 JSONL，真实用户消息可白名单识别，钩子注入是唯一可靠定位途径，且存在陈旧字段缺陷；该事实仅供历史记录，不作为当前实现输入
  - 状态：verified
  - 来源：decision-log F-005（本机实证+官方文档）
- **PFACT-06**：技能分发生态以 Claude 插件清单为 M18 基准；X3 采用 engines 风格声明；未知顶层字段被忽略；依赖用 npm-semver 区间
  - 状态：verified
  - 来源：decision-log F-006（32 来源调研）
- **PFACT-07**：延期任务文档 F1/F2/F3 已交付用户下载目录，簿记批负责归档进仓并登记目录真相表
  - 状态：verified
  - 来源：decision-log R-004 处理注记（FND-005 修复）
- **PFACT-08**：当前 `main` 已接受 ADR-0024，旧宿主会话绑定三件套不存在；当前接线由显式身份与 Stage Agent outcome bridge 负责
  - 状态：verified
  - 来源：`docs/adr/0024-remove-host-session-binding.md` @ `c835bf43`；`tools/cli/stage-runtime.mjs`；`tools/host/workflowhub-stage-agent-bridge.mjs`

## 5. 功能需求

主线 A（验收兑现）：

- **FR-A-001**：提供技能清单生成器，以仓内技能目录登记为唯一输入，产出权威打包清单；字段固定为 id、path、version、origin_path、origin_framework、local_changes、owner_stage、metrics_enabled，不另设口径；其中 origin_path 与 origin_framework 始终为按 upstream 登记顺序对齐的数组，无 upstream 时为空数组，避免多来源技能静默丢失；生成物与登记不一致时给出逐字段 diff。本规格中「核心技能」的口径：五阶段入口技能及其依赖闭包，以目录登记的 owner_stage 与依赖声明字段为判定依据，清单与扫描的覆盖群体均以此为准。
- **FR-A-002**：目录登记支持 metrics_enabled 声明；扫描挂接现有检查器，报告 metrics_enabled 为 false 的核心技能；不新建控制面。
- **FR-A-003**：X2 委派、X3 3rd-review、X4 debate 保持独立仓库，仅通过仓内薄入口与外部 semver 声明调用；X3 补 engines 风格版本声明，X4 状态改标 adopted，X2 记录为不引入。
- **FR-A-004**：产出 CLI 映射文档（工具名、权限模型、字段映射、缺失时的 unknown/unavailable 语义）、Codex 支持核实记录（能支持/部分支持/暂不支持的具体字段与降级策略）、Claude 端到端样例记录。
- **FR-A-005**：提供两类归一验证：①CLI 归一契约测试，覆盖 Codex 与 DSH 两个同引擎前端的结果等价；②Claude 结果包端到端验证，覆盖 Claude 输出归一进当前任务/阶段/质量/证据契约。两者共同证明不同 CLI 输出归一进当前契约，且入口读取同一份仓内技能清单。
- **FR-A-006**：干净安装过程留档一次，作为干净环境可复现跑通的存档证据。
- **FR-B-007**：删除协议文档中两行从未兑现的死约定（阶段输入路径变量与 rollout 开始时间变量），文档回归只写代码兑现的契约。
- **FR-B-008**：宿主身份显式化：调用方必须同时提供 `--project` 与 `--task`，或运行于认证 task worktree；部分提供、与认证 worktree 冲突或无法解析时 fail-closed。Stage Agent bridge 必须收到显式 `project_name`、`task_id`、`task_path`、`stage`、`attempt_id` 和 `agent_run_id`；不得从宿主 session、旧环境变量或历史记录猜身份。
- **FR-B-009**：Claude/宿主显式提交已执行阶段结果，经现有 Stage Agent bridge 校验并生成 `workflowhub-stage-outcomes.v1`，再由公共 `stage-runtime run --action=execute` 消费 `outcome_ref`。结果必须绑定当前 task、stage、attempt、snapshot 和 material revision；缺结果或绑定失败时记 `unavailable`/失败并保留原因。WorkflowHub 不读取、扫描或反查 Claude transcript，不新增 Claude 专用 dispatch 或第二套控制面。
- **FR-B-010**：文档对齐：协议、使用说明、目录职责文档同步反映显式身份、Stage Agent outcome bridge、Claude/宿主结果责任和本次簿记结论。

主线 C（整理与簿记）：

- **FR-C-011**：孤儿三技能处置：删除 qa-only 与 verify-change 的技能目录与登记条目；保留 resolving-merge-conflicts 并在目录登记中写明消费者为任务关闭流程的合并冲突报错路径。
- **FR-C-012**：复用登记与状态词表同步，并对历史 _spike 目录做一次审计记录。
- **FR-C-013**：删除已无消费者的旧事实索引模块；评估框架配置解析的去留并记录结论。
- **FR-C-014**：审查相关双副本收敛为单一来源，旧位置仅保留薄转发并注明删除条件。
- **FR-C-015**：阶段契约巨头文件按方案三纯归位到 runtime 分区，旧位置留桶式转发；零逻辑变更，不触碰 845 行巨型函数，不清理死导出。
- **FR-C-016**：任务能力清单迁移到现行分区并登记消费者。
- **FR-C-017**：目录真相表全面修复（与实际文件位置一致），把延期任务文档归档进仓并在目录真相表登记，同时把 roadmap 与进度文件回写到知识库。

## 6. 模块划分

本规格只描述职责边界，工程锚点（文件与函数）归 build-plan 的 Code Anchors。

- 技能目录登记（机器真相）：唯一权威来源，承载 id/版本/来源/本地变更/归属阶段/指标开关。
- 清单生成器：从目录登记生成权威打包清单，支持漂移 diff；只做映射，不含业务流程。
- 指标扫描：复用现有检查器报告未开指标的核心技能。
- 宿主适配族（宿主工具区）：Codex、DSH、Claude/宿主显式 outcome producer；只做工具名/权限/字段与结果映射，不复制五段业务流程；全部读取同一份仓内技能清单。
- 身份与阶段结果契约：显式 `--project/--task` 或认证 worktree + Stage Agent outcome bridge；不依赖宿主 session 状态。
- 簿记面：复用登记、状态词表、目录真相表、知识库回写——纯文档与登记同步，不改运行时行为。

## 7. 关键实体

- 技能目录条目：一个技能的权威登记（id、仓内路径、版本、来源路径、来源框架、本地变更、归属阶段、指标开关）。
- 打包清单元件：由目录条目一一生成的清单记录，字段与目录条目同口径。
- Stage Agent outcome：已执行 step/skill 结果及其宿主 provenance，绑定 task、stage、attempt、snapshot、material revision，并由 bridge 生成内容寻址引用。
- CLI 映射条目：某 CLI 的工具名、权限模型、字段映射与缺失语义。
- 核实记录：Codex 支持结论（字段级能/部分/暂不支持+降级策略）。
- 延期任务条目：F1/F2/F3 的背景、分析、目标与交接条件。

## 8. 数据和生命周期

- 目录登记 → 清单生成物：单向生成；漂移检测为只读比对；生成物可重建，登记是真相。
- Stage Agent outcome：宿主显式提交 `session` 或 `unavailable` 结果；bridge 只校验、写入现有 canonical outcome，公共 run 消费 `outcome_ref`；缺失结果保持 `unavailable`。
- 删除项（两个孤儿技能、死约定行、死代码）：经 git 历史可恢复，删除前先证明无消费者并取得用户授权（已满足，G-001/G-003）。
- 未列入目录真相表的文件保持原位；目录真相表是本次目录迁移的唯一事实来源。
- 质量材料：decision-log 拥有需求与决策，本规格拥有行为与验收，plan/tasks 归 build-plan；四份材料单写单改。
- 缺失值语义约定（全规格统一）：无法确定或不可得记 unknown；来源存在但当前取不到记 unavailable；应有而缺记 missing；三者不得互换，禁止编造填充。

## 9. 兼容性预留

- 旧宿主变量、旧 session-state/event/hook 模块与旧会话档案：仅作历史事实，不作为当前运行输入；不恢复、不新增兼容分支。
- Kimi：本次不接，seam 泛化与格式调研并入延期 F1，未来接入时不得要求 runtime 改动。
- capability 扩展（transcript 新能力）：无限期延期，预留位置但不实现。
- Claude transcript 读取、目录探测、历史反查与白名单解析：本任务明确不做；Claude/宿主只提交显式结果。
- 未登记消费者的重复控制面不得新增；新增生产文件必须同时写明唯一消费者、负责人、替代关系与删除条件。

## 10. 明确不做与默认必须成立

### 明确不做

- Kimi 接线与 Kimi 会话格式调研（并入 DEF-001 F1）。
- F1 seam 泛化与 cli_map 兑现、F2 任务关闭/产物目录主体迁移与 facts 双轨合并、F3 函数级拆分与去桶（均已书面延期交接）。
- requirement_message 之外的 transcript 能力扩展（无限期延期）。
- 合并 spec 族或 plan-review 族技能（调研证实分工清晰，合并才违规）。
- 全量补齐 29 个技能的防外部路径合同测试（现有 4 个加守卫已够）。
- 任何 UI/页面工作；任何新建控制面、双写或永久兼容桥。

### 默认必须成立

- 十条验收逐条有最小留证，缺一条即失败。
- 归位/收敛/删除类工作零行为变更：相关契约测试全绿才允许过批。
- 缺字段如实记 unknown/unavailable，禁止编造。
- 盲审与质量事实保留真实失败类别，不得改写为通过。
- 每次公共运行只消费当前四份材料与同任务质量记录。

## 11. 验收标准

AC-A-001 至 AC-B-005 共十条一一对应 roadmap M17a/M17b 的可执行验收（D-001 判据所指「十条验收」即此十条）；AC-C-001 是主线 C 结构批次的附加防线，不计入十条。

- [ ] **AC-A-001**：干净环境跑通核心流程。
  场景：在不安装 superpowers/gstack 的干净环境中，使用者按 SCN-001 跑通一个五阶段任务样例，核心 workflow 所需 SKILL.md 全部从仓内技能目录命中。
  验证：干净安装存档（含环境前置清单、确切命令、退出码、输出摘要），第三人可按存档命令在新环境重跑复现 + 技能解析命中清单逐条核对。
  失败条件：任一核心技能找不到、必须安装 superpowers/gstack 才能跑通、或存档命令无法复现。
- [ ] **AC-A-002**：核心技能清单登记可回溯。
  场景：build-code/verify-code 阶段引用的核心技能在打包清单中登记，且每个字段可回溯到目录登记与复用登记。
  验证：清单生成器重跑后 diff 为空 + 随机抽三条逐字段回溯。
  失败条件：缺字段、字段与登记不一致、或清单口径与目录登记口径不同。
- [ ] **AC-A-003**：外部能力仅薄入口加版本声明。
  场景：X2/X3/X4 不并入业务流程，仅经薄入口加 semver 声明调用。
  验证：三个入口逐个人工核对（无业务逻辑复制）+ X3 的 engines 风格声明存在 + X4 标 adopted + X2 有「不引入」记录。
  失败条件：任一入口内出现大段业务逻辑，或缺版本声明/状态记录。
- [ ] **AC-A-004**：两宿主读取同一份技能清单。
  场景：Claude 与 Codex 入口读取同一份仓内技能清单，宿主适配层只做工具/权限/字段与结果映射。
  验证：Codex/DSH 归一契约测试等价结论 + Claude 显式 outcome 结果包端到端验证记录 + 两宿主入口读取路径核对记录（同一份清单）。
  失败条件：任一宿主读取不同清单来源，或适配层出现流程分叉/transcript 扫描。
- [ ] **AC-A-005**：未开指标的核心技能被报告。
  场景：扫描报告列出 metrics_enabled 为 false 的核心技能。
  验证：现有检查器一次扫描输出存档，名单与目录登记逐条一致。
  失败条件：漏报（登记为 false 而未出现在报告中）。
- [ ] **AC-B-001**：两宿主各跑通一个核心流程样例。
  场景：同一份仓内技能在 Claude 与 Codex 至少各跑通一个核心流程样例。
  验证：两份端到端样例记录（任务/阶段/产物引用齐全）。
  失败条件：任一 CLI 跑不通且记录中没有对应的 unsupported 字段与降级结论。
- [ ] **AC-B-002**：两宿主引用写入当前契约。
  场景：两个 CLI 的 task/stage/attempt/snapshot/material 与产物/证据引用都能写入当前契约；Claude/宿主显式结果经 bridge 生成 outcome，公共 run 消费同一 `outcome_ref` 语义。
  验证：归一契约测试断言两宿主字段等价 + bridge 对显式 identity/outcome 的绑定验证 + 缺结果与冲突身份的 `unavailable`/失败输出。
  失败条件：从 session、旧变量或历史记录猜身份；字段缺失却被填值；outcome 绑定不匹配或缺失却宣称完成。
- [ ] **AC-B-003**：CLI 映射文档覆盖五段所需。
  场景：CLI 映射文档覆盖五段技能所需工具和当前结构化结果字段。
  验证：文档逐项对照五段技能清单核对记录。
  失败条件：任一五段技能所需工具或字段缺映射。
- [ ] **AC-B-004**：适配层无业务流程分叉。
  场景：扫描宿主适配层，无 CLI-specific 的五段业务逻辑分叉，也无 transcript 读取/扫描/历史反查。
  验证：适配层扫描结论记录（只含映射差异与显式 outcome 输入差异）。
  失败条件：发现任一业务流程 fork、隐式 session 身份推断或 transcript 扫描。
- [ ] **AC-B-005**：Codex 支持有核实记录。
  场景：Codex 实际支持有核实记录，逐字段标明能支持/部分支持/暂不支持与降级策略。
  验证：核实记录文档存在且每个五段字段有结论。
  失败条件：无核实记录，或字段结论缺失。
- [ ] **AC-C-001**：簿记与归位零漂移零变更。
  场景：主线 C 全部簿记与归位项完成后，目录真相表与实际文件一致、孤儿技能账面清零、归位类零行为变更。
  验证：逐项核对——孤儿两技能目录与登记条目删除且 resolving-merge-conflicts 消费者已登记（FR-C-011）；复用登记与状态词表同步、审计记录落盘（FR-C-012）；旧事实索引模块删除、解析配置评估结论落盘（FR-C-013）；审查双副本收敛为单一来源且旧位薄转发注明删除条件（FR-C-014）；阶段契约文件纯归位 diff 仅含路径与导出转发、无逻辑变更（FR-C-015）；能力清单迁移并登记消费者（FR-C-016）；目录真相表抽查全中、延期文档归档登记、roadmap/进度回写（FR-C-017）；最后相关契约测试一次全绿输出。
  失败条件：任一登记与实际不符、孤儿条目残留、或归位批引入行为变更。

## 12. 风险、未决与交接

- 风险：「从简」执行中滑向「不做」（防线：失败边界+D-001 判据）；盲审覆盖弱于满员（已接受，D-007）；M18 预热调研可能返工（用户已接受）。
- 未决项：方向性开放问题 0（OPEN-001~005 已关闭，D-010 已确认）；材料同步、公共 status 和质量事实仍待后续阶段实际执行。
- 延期交接：DEF-001（F1 seam 泛化+cli_map，含 Kimi）、DEF-002（F2 任务关闭与 facts 双轨）、DEF-003（F3 函数级拆分）、DEF-004（capability 扩展无限期）；延期任务文档已交付用户下载目录，簿记批负责归档进仓（FR-C-017 同批）。

## 13. 业务影响与回归范围

- 影响面：维护者（登记与清单工作流变化）、各 CLI 宿主使用者（Claude 需显式生成 outcome，身份不再依赖宿主 session）、M18（获得分发基准与打包清单）。
- 回归范围：归位与删除触及的运行时分区以 19 个域级契约测试为回归网；显式 identity/outcome 绑定、缺结果与冲突身份必须有测试覆盖；文档删除（死约定两行）无行为面。
- 本规格不改变任何既有用户可见行为，仅把已验证事实固化成可复查证据并清账。

## 来源与决策映射

| 需求/决定 | 功能需求 | 验收 |
| --- | --- | --- |
| R-001/R-002 + D-001 | FR-A-001、FR-A-002、FR-A-003、FR-A-004、FR-A-005、FR-A-006 | AC-A-001、AC-A-002、AC-A-003、AC-A-004、AC-A-005 |
| R-002/R-004 + D-008/D-010 | FR-B-007、FR-B-008、FR-B-009、FR-B-010 | AC-B-001、AC-B-002、AC-B-003、AC-B-004、AC-B-005 |
| R-003/R-004 + D-009 | FR-C-011、FR-C-012、FR-C-013 | AC-C-001 |
| R-003 + D-002/D-005 | FR-C-014、FR-C-015、FR-C-016、FR-C-017 | AC-C-001 |
| R-005/R-006 + D-007 | 流程约束贯穿全部 FR | 十条验收的最小留证口径 |
