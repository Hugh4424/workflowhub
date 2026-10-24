# 功能规格：C01 项目规范初始化与迁移（workflowhub-ui-frontend-c01-norm-init-20261024）

读者：本任务实施者、独立验收读者与下游 C02～C10 的规范消费者。
读完要能：定位八类规范的来源与分权、旧条款去向、模板形状、验收对象用法、真实任务准备与唯一验收判据。

> 基于已接受的 PRD（`specs/workflowhub-ui-frontend-release-20261020/prd.md`，C01 卡 L194–213）与本任务 `decision-log.md`。
> 本文件承载产品行为与全局实现设计；每个 `phases/P<n>.md` 只写本包增量，`phases/index.md` 只存指针。
> 可判定验收正文只在 Appendix A；主干只保留稳定指针。

- **功能名**：C01 项目规范初始化与迁移
- **来源**：PRD C01 卡、S1～S6 义务、`decision-log.md`（U-001～U-024 真实答复、八工作包决定）
- **状态**：草稿；方向与范围已确认（`quality/evidence/human-confirmations/2026-10-24-001-make-decision-approved.json`），计划未取得确认

## 速读卡（30 秒）

- **一句话需求**：让八类项目规范有可核的实质来源、可照抄的模板与真实读取入口，旧有效条款逐条有去处，验收对象合同被真实消费者用一次，并真做出一份《真实任务准备》。
- **核心改动点**：
  - 三份外部能力整包复制进 `skills/external/`，按 catalog absorbed 字段登记，许可状态如实写"未声明"，脚本入库不执行。
  - 两个缺指针入口直接写具体路径，与 `skills/ui-project-init/SKILL.md` 的规范职责表逐项对齐。
  - PaperBuilder 九份规范按真实代码修冲突、过期、悬空、重复段与丢失条款；ADR0035 追加更正。
  - 八类各一份可照抄模板，简明语言标准只落成模板形状。
  - 验收对象走真实页面五项；新增最小检查命令接进验证环节；《真实任务准备》一页八项全填。
- **最大影响面**：WorkflowHub 的 skills/workflows/PRD；PaperBuilder 的九份规范与 ADR；C02～C10 对规范口径的消费。
- **验收信号**：两条冻结 oracle 转绿；47 条旧条款逐条有去向；三条起点链可指；模板可照抄；缺 viewport 被点名、owner 缺省显示"用户"。

## 来源与决策映射

| 来源 ID | 决定 ID | FR / AC ID | 状态 / 受影响范围 | 未决 / 交接 |
| --- | --- | --- | --- | --- |
| R-001、R-006、R-010（PRD §S2、C01-F1） | U-008 / U-010 / U-011 | FR-NORM-001 / AC-C01-1 | current；外部能力入库与登记 | OI-007 由 P1 的 ADR-0053 关闭 |
| R-010（PRD L51、L77、L107、L654） | U-009 / U-023 | FR-NORM-002 / AC-C01-1 | current；PRD 许可与复制口径 | 15 组中 1 组差额待核（unknown） |
| R-020（PRD §S3、L107） | U-008 / U-024 | FR-NORM-003 / AC-C01-5 | current；更新检查分支 | 历史 API 不可得，写"部分可判定" |
| R-013（用户 2026-10-24 追加） | U-017 / U-018 | FR-NORM-006 / AC-C01-1 | current；模板形状 | 模板不写死字数 |
| R-003（PRD C01-F2、AC-C01-2） | U-012 / U-014 / U-015 / U-016 | FR-NORM-004、FR-NORM-007 / AC-C01-2 | current；入口、旧账、九份 | 47 条计数来自本任务 decision-log WP3 |
| R-002（PRD C01 范围、D-014） | U-003 / U-013 | FR-NORM-005 / AC-C01-1 | current；三种起点 | 第三种只核可追 |
| R-004（PRD C01-F3、§S5） | U-019 / U-020 | FR-NORM-008 / AC-C01-3 | current；验收对象与最小检查 | OI-006 由 P7 关闭 |
| R-005（PRD AC-C01-4） | U-019 | FR-NORM-009 / AC-C01-4 | current；真实任务准备 | 数据权限字段真实缺失，具名写出 |
| R-008（PRD §C01 判定器） | U-021 / U-022 | FR-NORM-010 / AC-C01-2 | current；负例与检查 | 双 active 用白名单＋独立审查，不新增检查器 |
| R-019、R-021（PRD §S6、§S5） | —（PRD 直接义务） | FR-NORM-011 / AC-C01-2 | current；计量与严重度 | 责任主体按 PRD，不按旧 D-012 |
| R-012（AGENTS 治理边界） | — | FR-NORM-007 / AC-C01-2 | current；archive 只读 | 不改写归档字节 |

## 1. 需求解释：问题与紧迫性

上一轮同名任务（`workflowhub-ui-frontend-c01-norm-init-20261014`）四条验收全部 incomplete：点名的《真实任务准备》原件从未产出，四个仍读旧根文件的人工入口没有退出证明，一份架构决定自相矛盾，正式审查只成功一个 provider。文件数量与材料评分掩盖了"读不到、用不上、追不回"这三类失败。

本次要解决的是可核性：每条规范能指到真实来源，每个入口能真读到新源，每条旧条款有去向，每个模板能照抄，验收对象合同被真实消费者用一次。做不到的部分写清具体名字与影响，不用缺口说明顶替交付。

## 2. 背景、目标与范围

### 背景

PRD C01 卡把范围钉在三种生成起点、六处入口迁移与验收对象接入（L198–213）；§S2 定八类分权与目录拼写（`specs/design/`、`specs/frontend/`，不是 `spec/`）；§S3 要求外部能力核许可、保固定版本、本卡验收一次更新检查及失败分支；§S4 第 7 条要求各卡在真实运行前采集本卡适用的计量；§S5 定验收对象八字段、owner 缺省为用户、三级严重度与三轮回修。上一轮的确权材料（decision-log 八工作包）已由用户逐块选择（U-001～U-024）。

### 目标

- 三份外部能力离线可读并登记；许可状态如实为"未声明／Apache-2.0"。
- 两条缺指针入口能读到八类规范职责；旧条款与旧 caller 有去向；ADR0035 不再有与真实状态相悖的陈述。
- 八类模板可被另一个项目直接照抄；简明语言标准落成可指认的模板形状。
- 验收对象真实可用：缺 viewport 报"viewport"，owner 留空输出"用户"；检查命令接进验证环节并在本任务跑过一次。
- 一份《真实任务准备》原件存在，五类内容不混写，Experience 归档字节未变，生成内容的语义适用性有复核结论。

### 范围内

WorkflowHub：`skills/external/`（三份复制件与索引）、`skills/catalog.yaml`、`skills/reuse-registry.md`、`skills/plan-design-review/SKILL.md`、`workflows/build-code/SKILL.md`、`skills/ui-project-init/SKILL.md` 、`skills/ui-project-init/skill-bundle.json`（P6/T016条件触发的八模板声明）与 `skills/ui-project-init/templates/`、`workflows/verify-code/SKILL.md`、`tools/cli/check-acceptance-object.mjs`、`tests/contract/` 两份冻结 oracle、`docs/adr/0053-*`、`specs/workflowhub-ui-frontend-release-20261020/prd.md` 的许可与复制条款。

PaperBuilder（专用 worktree `PaperBuilder-workflowhub-ui-frontend-c01-norm-init-20261024`，分支 `task/PaperBuilder/workflowhub-ui-frontend-c01-norm-init-20261024`，基线 `de2387af`）：九份规范正文、`docs/adr/0035-project-norm-authority-and-value-source-migration.md`。

任务库：`quality/evidence/build-plan/` 与 `quality/evidence/` 下的过程原件。

> 非目标只在第 10 节维护，避免两份真相。

## 3. 用户场景与状态覆盖

### SCN-001：离线读取外部能力

- **角色**：本仓维护者或下游代理
- **前提**：无网络
- **触发**：读 `skills/external/spec-driven-production/SKILL.md`
- **结果**：读到与固定 commit `000b04a2…` 同字节的方法正文；`skills/external/README.md` 写明上游项目、文件、段落、固定版本、许可状态（未声明）、本地路径、本地改动、更新策略
- **回写**：若复制件缺文件，则回到 P1/T001 补全并在 README 登记缺口，不改写为"已同步"

### SCN-002：入口按类定位规范

- **角色**：build-plan / build-code 的执行者
- **前提**：任务涉及 UI
- **触发**：在 `skills/plan-design-review/SKILL.md` 或 `workflows/build-code/SKILL.md` 找规范来源
- **结果**：两处都直接写 `skills/ui-project-init/SKILL.md` 的「规范职责」与具体路径；读到的路径与职责表逐项一致
- **回写**：路径不一致即按 P2/T005 修正，任何一侧单独改动都视为失败

### SCN-003：第三种起点只核可追

- **角色**：验收读者
- **前提**：PaperBuilder 上一次真实生成段已有材料
- **触发**：核《三种起点链》原件
- **结果**：三种起点各一条"材料原件（路径＋行号）→ 产物（路径＋行号）→ 结论"链；缺环标"未证实"并写影响
- **回写**：缺环补证据或保留"未证实"，不以"事件真实发生过"代替

### SCN-004：缺 viewport 与 owner 缺省

- **角色**：验收者
- **前提**：`spec.md` 的验收对象节填了一份真实页面对象
- **触发**：删掉 viewport 后执行 `node tools/cli/check-acceptance-object.mjs --spec …`；再单独把 owner 置空执行
- **结果**：第一次退出码 1 且输出 `missing_fields: ["viewport"]`；第二次输出 owner 为"用户"，退出码 0
- **回写**：报错模糊或静默通过，回 P7/T017 修检查器

### SCN-005：一次真实任务准备

- **角色**：项目维护者
- **前提**：八类分权与模板已就位
- **触发**：按模板做一次真实准备（PaperBuilder `/simulations` 页面）
- **结果**：一页原件写清设计／工程／任务／知识／facts 各自归哪个文件、真实位置在哪；缺数据权限写具体名字；Experience 归档 sha256 前后一致
- **回写**：做不出时 AC-C01-4 记未通过，不用缺口说明顶替

### SCN-006：新旧两份规范同时存在

- **角色**：独立审查者
- **前提**：受控输入里再造一份"active"规范副本
- **触发**：按允许出现位置白名单核残留
- **结果**：审查记录报出第二处位置；仓库内不存在第二份 active 规范
- **回写**：残留未清则回 P4/T009 处理，不把 grep 零命中当证据

### SCN-007：外部能力更新检查

- **角色**：维护者
- **前提**：三份包已入库
- **触发**：按登记入口查上游
- **结果**：记录写明查了哪些入口（`repo/files` 当前 vs 固定 Revision、`git ls-remote`、六个历史 API 候选）、返回（全树路径/大小/sha256 一致；`/repo/revisions` 等 404）、结论"查询时点未发现更新，提交历史不可判定"；不写"无更新"
- **回写**：若入口失效，记录真实失败并保持 unknown，不换成新控制面

### 状态覆盖清单

- [ ] **默认态**：SCN-002；不带任何特殊条件时两处入口都能读到职责表
- [ ] **空态**：SCN-004；验收对象缺字段时逐项点名，不静默通过
- [ ] **错误态**：SCN-001；复制件缺文件或索引缺字段时报具体名字
- [ ] **加载态**：N/A — 本任务全部为文件与命令，无异步加载视图
- [ ] **取消态**：N/A — 不新增可取消的长任务
- [ ] **边界态**：SCN-003；起点链缺环、SCN-007 历史 API 404 均按缺口处理
- [ ] **权限态**：SCN-007；查询失败或无权限保持 unknown/unavailable，不报"无更新"
- [ ] **竞态**：SCN-006；两个写者可能同时改 `specs/frontend/ui-quality.md`（P4 先、P5 后），按依赖边定序

## 4. 产品事实与假设（PFACT）

- **PFACT-001**：两个入口当前没有可执行指针
  - **状态**：`verified`
  - **证据或来源**：`skills/plan-design-review/SKILL.md:8-9` 与 `workflows/build-code/SKILL.md:35` 全文 0 次 `ui-project-init`（`quality/evidence/build-plan/2026-10-24-102-workflowhub-state.md` §2）
  - **负责人、影响**：P2 作者；影响 FR-NORM-004、AC-C01-2
  - **关联**：FR-NORM-004、AC-C01-2、RISK-01

- **PFACT-002**：`skills/ui-project-init/SKILL.md` 的八类职责表在 `:14-23`，旧两源地位在 `:27`；生产方只有 `unknown` 类写法，`missing`/`stale` 只出现在消费方
  - **状态**：`verified`
  - **证据或来源**：同上 §1；`grep -c missing/stale` 为 0
  - **负责人、影响**：P2 作者；影响 FR-NORM-004 的缺源写法补齐
  - **关联**：FR-NORM-004、AC-C01-2

- **PFACT-003**：`catalog.yaml` 的 absorbed 条目不是七个扁平字段，而是 9 个顶层键，其中 `upstream[]` 嵌套 `github_url/path/commit/license`
  - **状态**：`verified`
  - **证据或来源**：`skills/catalog.yaml:1230-1256`（`quality/evidence/build-plan/2026-10-24-105-external-and-standards.md` §4.2）
  - **负责人、影响**：P1 作者；影响 FR-NORM-001 的登记形态与 ADR-0053
  - **关联**：FR-NORM-001、AC-C01-1、OPEN-02

- **PFACT-004**：三份外部能力固定 commit 均可访问；`spec-driven-production` 与 `material-agent-readiness-eval` 许可未声明，`design-tokens` 为 Apache-2.0
  - **状态**：`verified`
  - **证据或来源**：`2026-10-24-105-external-and-standards.md` §1（固定文件 HTTP 200、元数据 License 空、Apache LICENSE 原文）
  - **负责人、影响**：P1 作者；影响复制范围与许可登记
  - **关联**：FR-NORM-001、FR-NORM-003、AC-C01-1、AC-C01-5、RISK-03

- **PFACT-005**：ModelScope 无提交历史 API（六个候选入口 404），但 `repo/files` 的当前树与固定 Revision 树完全一致
  - **状态**：`verified`
  - **证据或来源**：`2026-10-24-105-external-and-standards.md` §2
  - **负责人、影响**：P1/T003；影响 AC-C01-5 只能给"部分可判定"
  - **关联**：FR-NORM-003、AC-C01-5、RISK-05

- **PFACT-006**：PaperBuilder 九份规范 962 行；6 冲突、4 过期、3 悬空、重复段 3 处、两条无出处条款（精确清单未取得）
  - **状态**：`verified`（两条无出处条款的精确映射为 `unknown`，见 OPEN-03）
  - **证据或来源**：`quality/evidence/build-plan/2026-10-24-103-paperbuilder-state.md` §1–§2
  - **负责人、影响**：P4/P5 作者；影响 FR-NORM-007 的修复范围
  - **关联**：FR-NORM-007、AC-C01-2、OPEN-03

- **PFACT-007**：ADR0035 至少有五处与真实状态不符：`:18`、`:66`（含 hash `699b4b57…`）、`:54`（34 根角色，实际 47）、`:80`（`specs/Design/实盘UI/...` 路径不存在）、`:16/:88/:100` 仍提大写目录
  - **状态**：`verified`
  - **证据或来源**：`2026-10-24-103-paperbuilder-state.md` §3、§7、§8.2、§11
  - **负责人、影响**：P4 作者；影响 FR-NORM-007、AC-C01-2
  - **关联**：FR-NORM-007、AC-C01-2、RISK-02

- **PFACT-008**：四位旧 caller 全部在 `specs/archive/` 下，无 active 文件指向；ADR 自述"仓外人读 caller 未知"
  - **状态**：`verified`；"无活跃读者"为 `unknown`
  - **证据或来源**：`2026-10-24-103-paperbuilder-state.md` §5
  - **负责人、影响**：P4 作者；结案说明必须写"无 active 文件指向，仓外未知"
  - **关联**：FR-NORM-007、AC-C01-2、OPEN-04

- **PFACT-009**：验收对象合同 producer 在 `skills/spec-specify/templates/spec-template.md:270-324`；runtime 与 CLI 零消费者，现有消费者只有冻结测试与两份方法散文
  - **状态**：`verified`
  - **证据或来源**：`2026-10-24-102-workflowhub-state.md` §4；知识图查询同结论
  - **负责人、影响**：P7 作者；影响 FR-NORM-008 的挂载点（OI-006 由此关闭）
  - **关联**：FR-NORM-008、AC-C01-3、RISK-04

- **PFACT-010**：`check-decision-log-chain.mjs` 只告警恒 exit 0；仓库没有双 active 与"验收对象指向不存在文件"的负例
  - **状态**：`verified`
  - **证据或来源**：`2026-10-24-102-workflowhub-state.md` §5
  - **负责人、影响**：P7/P8 作者；影响 FR-NORM-010
  - **关联**：FR-NORM-010、AC-C01-2、AC-C01-3

- **PFACT-011**：PaperBuilder `/simulations` 页面可填满验收对象六项材料，数据权限项仓内无声明
  - **状态**：`verified`（数据权限为真实缺口）
  - **证据或来源**：`2026-10-24-103-paperbuilder-state.md` §9
  - **负责人、影响**：P7 作者；影响 FR-NORM-009 的缺项报名字
  - **关联**：FR-NORM-009、AC-C01-4、RISK-06

- **PFACT-012**：本任务适用计量四项的现状为"尚无交付事件／人工时间 unknown／1 次方向确认"
  - **状态**：`verified`（现状为 unknown 的部分按 unknown 记，不反推）
  - **证据或来源**：`decision-log.md` §S6 效果计量与原始事件
  - **负责人、影响**：各 Phase 作者；影响 FR-NORM-011
  - **关联**：FR-NORM-011、AC-C01-2

> `unknown` 的 PFACT 已关联 OPEN-03／OPEN-04；不能把推断写成已核实事实。

## 5. 功能需求

### 外部能力入库与登记（EXTERNAL）

三份外部能力按用户选择整包复制进仓，以仓内副本为唯一读取权威，上游只用于比新。登记写清上游项目、文件、固定版本、许可状态、本地路径、本地改动与更新策略；许可未声明的如实写未声明，不写"已获许可"。脚本随包入库但不执行。PRD 中与之冲突的许可与复制口径统一改到同一说法。

- **FR-NORM-001**：三份能力在 `skills/external/<包名>/` 下离线可读，并在 `skills/catalog.yaml` 的 `capability_decisions` 以 `absorbed` 登记七项事实；`skills/external/README.md` 逐包给出七字段与人读索引；关联 PFACT-003、PFACT-004、SCN-001、AC-C01-1
  - **范围边界**：只登记三份被采用的能力；`material-agent-readiness-eval` 只复制 markdown 子技能闭包（12 文件），Figma 子技能不属本卡
  - **依据**：U-008、U-010、U-011、U-024；PRD §S3 L107
  - **场景**：SCN-001
  - **验收**：AC-C01-1

- **FR-NORM-002**：PRD 中与复制／引用／许可相关的条款统一改到"整包复制入库、许可状态如实登记"的口径（decision-log 记 15 组；本轮逐行扫描归并 14 组，差额 1 组待核为 unknown），上游表加仓内副本路径列；C10 的插件代码限制保留并加范围限定；关联 PFACT-003、SCN-001、AC-C01-1
  - **范围边界**：只改许可与复制口径与对应上游表；不动"唯一值源／不双写"这类防漂移纪律，不改与本次修订无关的条款
  - **依据**：U-009、U-023；PRD L51、L77、L107、L654
  - **场景**：SCN-001
  - **验收**：AC-C01-1

- **FR-NORM-003**：交付一次可回读的外部能力更新检查记录，写明查询入口、返回与"提交历史不可判定"的原因；`catalog.update_policy` 与该记录一致；关联 PFACT-005、SCN-007、AC-C01-5
  - **范围边界**：只查固定版本可达性与当前树比较；不建后台监控、定时任务或第二控制面；不写"无更新"
  - **依据**：R-020；PRD §S3 L107。检查时机＝build-plan 具名、每次上游变化或维护计划到期时；入口＝`skills/external/README.md` 的更新策略段与 `catalog.update_policy`；维护者＝skills registry 维护者
  - **场景**：SCN-007
  - **验收**：AC-C01-5

### 规范入口与正文治理（ENTRY）

两个缺指针入口直接写具体路径，并在两处与 `skills/ui-project-init/SKILL.md` 的规范职责表逐项对齐；生产方补齐 `missing`/`stale` 的写法，使消费方的口径有对应生产方。旧账按真实材料清理：47 条旧条款逐条去向、四位旧 caller 结案、ADR0035 追加更正、九份正文按真实代码修复。

- **FR-NORM-004**：`skills/plan-design-review/SKILL.md` 与 `workflows/build-code/SKILL.md` 直接写 `skills/ui-project-init/SKILL.md`「规范职责」及本动作适用的具体路径；`skills/ui-project-init/SKILL.md` 补 `missing`/`stale` 缺源写法与模板指针位置；关联 PFACT-001、PFACT-002、SCN-002、AC-C01-2
  - **范围边界**：只改这三份方法正文；不加新校验器，不改六入口之外的调用者
  - **依据**：U-012；PRD §S2、L199「核 plan-design-review、build-code/build-prd 相关 caller」
  - **场景**：SCN-002
  - **验收**：AC-C01-2

- **FR-NORM-007**：PaperBuilder 九份正文按真实代码修 6 处冲突、4 处过期、3 处悬空、重复段只留一处（另两处改指针）、5 条丢失条款补回；ADR0035 以追加更正记录修五处与真实状态相悖的陈述；任务库出一份 47 条旧条款逐条去向表与两份证据（白名单、旧 caller 结案）；关联 PFACT-006、PFACT-007、PFACT-008、SCN-006、AC-C01-2
  - **范围边界**：不改写业务代码、不改写 archive 历史字节、不替原 owner 做设计决定；实现与规范冲突时以可运行事实为准更正规范
  - **依据**：U-004、U-014、U-015、U-016；PRD C01-F2、AC-C01-2、L208
  - **场景**：SCN-006
  - **验收**：AC-C01-2

### 三种起点与模板（TEMPLATE）

三种生成起点各交一条可回读链；八类各一份可照抄模板，标准落成形状。

- **FR-NORM-005**：三种起点各一条"材料原件（路径＋行号）→ 产物（路径＋行号）→ 复核结论"链，缺环标"未证实"并写影响；关联 PFACT-006、SCN-003、AC-C01-1
  - **范围边界**：不新建项目、不采集新设计源；第三种起点只核可追
  - **依据**：U-003、U-013；PRD §C01 范围、AC-C01-1
  - **场景**：SCN-003
  - **验收**：AC-C01-1

- **FR-NORM-006**：`skills/ui-project-init/templates/` 下八份模板，各含固定节序、必填项、填写指引与反例列；两个语言标准只落成模板形状（首句即结论、一句一件事、一词一义、同一事实只出现一次、条件在前、主动语态），不写散文规则、不做字数或词库硬检查；关联 SCN-003、AC-C01-1
  - **范围边界**：模板是写法样张，不是强制八文件；不写死字数；不复制标准原文
  - **依据**：U-017、U-018、R-013、R-014；ADR-055（`specs/archive/workflowhub-review-efficiency-20261007/decision-log.md:1202-1230`）；模板的「负责正文／真实来源／消费边界」三段结构与阶段分责来自仓内副本 `skills/external/spec-driven-production/references/design-spec.md` 与材料评估的 GUIDE/AUDIT（`skills/external/material-agent-readiness-eval-markdown/SKILL.md`），履行 C01-F4「实际采用 SDD／材料评估原能力」
  - **场景**：SCN-003
  - **验收**：AC-C01-1

### 验收对象与真实准备（ACCEPT）

- **FR-NORM-008**：本任务 `spec.md` 的验收对象走真实页面五项＋owner；新增 `tools/cli/check-acceptance-object.mjs` 复用模板 producer，缺字段报具体名字、owner 缺省为"用户"、来源指向不存在文件时报字段与路径；`workflows/verify-code/SKILL.md` 的验证步骤真实调用它；关联 PFACT-009、PFACT-011、SCN-004、AC-C01-3
  - **范围边界**：不复制第二份 checker；不改冻结 oracle `tests/contract/acceptance-object-required-fields.test.mjs`；检查器只核结构与文件存在，不认证业务效果
  - **依据**：R-004、U-019、U-020；PRD C01-F3、§S5 L122/L124
  - **场景**：SCN-004
  - **验收**：AC-C01-3

- **FR-NORM-009**：产出一份《真实任务准备》原件：一页写清设计／工程／任务／知识／facts 五类各自归哪个文件与真实位置，八项字段全填，缺项写具体名字（数据权限为已知缺口）；Experience 归档原字节 sha256 前后一致；生成内容的语义适用性有复核结论；关联 PFACT-011、SCN-005、AC-C01-4
  - **范围边界**：不启动服务或浏览器；不做真实业务 E2E；缺权限如实记 unavailable，不伪造
  - **依据**：R-005、U-019；PRD AC-C01-4
  - **场景**：SCN-005
  - **验收**：AC-C01-4

- **FR-NORM-010**：交付两条定向负例的运行记录：受控输入下"新旧两份规范同时存在"被白名单＋独立审查报出位置；"验收对象指向不存在文件"由检查器报字段与路径；`check-decision-log-chain.mjs` 保持告警语义不变；关联 PFACT-010、SCN-006、AC-C01-2
  - **范围边界**：不新增双 active 检查器；不改冻结测试的既有断言
  - **依据**：U-021、U-022；PRD §C01 判定器
  - **场景**：SCN-006
  - **验收**：AC-C01-2

- **FR-NORM-011**：按 PRD §S6 采集本卡适用四项计量（任务返工、缺陷、人工时间、验收确认）并写明原始事件；按 §S5 三级严重度处置审查发现，局部回修最多三轮；责任主体按 PRD 为各卡自采集，不留给 C09；关联 PFACT-012、AC-C01-2
  - **范围边界**：不填不适用指标（提取覆盖、视觉差异属 C04／C05／C07）；缺记录写 unknown，不反推
  - **依据**：R-019、R-021；PRD L117、L149、L128、L130
  - **场景**：SCN-002
  - **验收**：AC-C01-2

> 每条 FR 至少连接一个 PFACT、场景与 AC；来源只认 R-/U-/PRD-/CARD- 编号。

## 6. 模块划分

| 模块 | 负责什么 | 对外提供什么 | 依赖谁 | 测试边界 |
| --- | --- | --- | --- | --- |
| 外部能力入库与登记 | 复制、登记、许可口径、更新检查 | 离线可读的复制件与可回读登记 | 真实上游固定版本 | 冻结 oracle 断言复制件与登记字段 |
| 规范入口与正文治理 | 指针、缺源写法、旧账、九份修复、ADR 更正 | 能读到新源的入口与逐条去向 | PB 真实代码与归档字节 | 独立文档审查＋受控负例 |
| 三种起点与模板 | 起点链、八份模板与标准形状 | 可回读三条链、可照抄八份模板 | 上一轮真实生成段与 PB 规范 | 独立文档审查 |
| 验收对象与真实准备 | 最小检查命令、真实对象、真实准备 | 可执行检查与准备原件 | 模板 producer、PB 真实页面 | 冻结 oracle＋真实运行记录 |

## 7. 关键实体

- **外部能力登记条目**：
  - **定义**：`skills/catalog.yaml` 的 `capability_decisions` 一条 absorbed 记录
  - **字段和约束**：复用既有 absorbed 字段；`name`、`status: absorbed`、`local_path`、`upstream[].path`、`upstream[].commit`（40 位 hex）、`upstream[].license`（未声明时为 null）、`local_changes`、`update_policy`。GitHub 地址用既有 `upstream[].github_url`；ModelScope 完整 URL 写进 `local_changes` 与 README，不新增键；同一包只能有一条 absorbed 记录。
  - **关系**：一条记录对应一个 `skills/external/<包名>/` 目录与 README 中一行

- **旧条款去向行**：
  - **定义**：47 条旧条款逐条一行
  - **字段和约束**：原文编号、原文出处（路径＋行号）、去向（哪份新正文哪节）、状态（承接／补回／退役）、理由；空行或"同上"视为未完成
  - **关系**：每行可回到九份正文或 archive 原件

- **验收对象**：
  - **定义**：本任务 `spec.md` 验收对象节的对象数据
  - **字段和约束**：`workspace`、`service`、`route`、`state`、`viewport` 必填；`owner` 缺省为"用户"；设计来源与数据权限在相邻节承接
  - **关系**：由 `checkAcceptanceObject` 检查，由 verify-code 步骤调用

## 8. 数据和生命周期

- **数据粒度**：一次外部能力复制对应一个包目录；一次准备对应一份原件；一次更新检查对应一份记录
- **数据时效**：复制件以固定 commit 为准；README 与 catalog 记录的是登记时点的事实
- **缺失或迟到**：缺文件、缺字段、缺权限逐项点名；不补默认值
- **预览与正式**：本任务无预览态；模板与样张不是生产规范
- **当前与历史**：archive 与旧交接只读；ADR 更正以追加方式保留原记录
- **归属与清理**：复制件归 `skills/external/` 维护者；任务证据归任务库；不清理既有原件

## 9. 兼容性预留

- **既有消费方**：`tests/contract/acceptance-object-required-fields.test.mjs` 的 221 条断言、`tests/contract/ui-skill-contract.test.mjs`、`tests/n2-skill-catalog-portability.test.mjs` 与 `check-skill-consistency.mjs` 的既有报告语义保持
- **命名预留**：不新增 catalog 键；ModelScope 上游地址写进既有 `upstream[].path`／`local_changes` 文本与 `skills/external/README.md`，`upstream[].github_url` 只用于 GitHub 源
- **容器预留**：N/A — 不新增持久化容器
- **状态预留**：保持现有材料形态（decision-log + spec + phases），不新增状态机
- **扩展边界**：本期只做 C01 范围内的迁移与生成；未来来源（C04）与持续升级（C08）不在本任务

## 10. 明确不做与默认必须成立

### 明确不做

- 全库迁移与通用 IR；生成八个空文件；C04 的新设计源采集；C08 的持续升级；C09 的业务 E2E；新 stage／gate／第二进度权威
- 恢复旧任务状态或改写归档材料；恢复旧两源（`Design.md`／`Experience.md`）的 active 地位
- 为双 active 新增检查器（U-022 与 WP3 已定用白名单＋独立审查）
- 修改冻结 oracle `tests/contract/acceptance-object-required-fields.test.mjs` 的既有断言
- 覆盖项目原 token／API 值或建立第二值源

### 默认必须成立

- 许可未声明就是未声明，不写"已获许可"或"可自由复制"；风险由项目所有者承担（U-008）
- 有更新不自动追 HEAD；查询失败或无权限保持 unknown，不报"无更新"
- 规范与实现冲突时以真实可运行事实为准；怀疑实现缺陷时记录并交原 owner
- 严重与中等缺陷必须解决；轻微不算绿，逐项容忍清单一批确认
- 局部回修最多三轮，一轮无新增通过项即停止并说明缺口，不改判据换绿
- 每条验收证据指真实原件路径；结构齐全不证明语义适用

## 验收流程

从 `decision-log.md` 的 `## 验收面` 取五条 AC 的可观察边界，按本文件 Appendix A 的判据定位所属 Phase 的命令与证据；每条 AC 的判定方式在 Appendix A 写明（机器可判／只能人读／需真实环境与用户在场）。

## 测试标准

开工前四要素清单：逐条需求与承接 AC 须写明验证层、命令或数据、预期结果、失败条件；四项缺一即未开工。本任务的三个测试面与理由：

| 测试面 | 适用性 | oracle | 证据类型 | 覆盖边界与指向命令 |
| --- | --- | --- | --- | --- |
| 冻结契约测试（新增两条 oracle） | 适用 | ORACLE-P1-INTAKE、ORACLE-P7-ACCEPT | `npx vitest run` 输出原件 | 只证明复制件/登记/检查器的机械事实；命令见 P1、P7 |
| 真实运行记录（检查器与命令） | 适用 | ORACLE-P7-ACCEPT | 命令、退出码、stdout 原件 | 不证明业务页面可用；命令见 P7 |
| 独立文档与语义审查（九份、模板、准备原件） | 适用 | 人工判据（Appendix A） | 审查原件与逐条对照表 | 不能自动化；覆盖 AC-C01-1/2/4 的语义部分 |
| 浏览器端到端 | 不适用 | — | — | 本卡无页面设计、无预览、无视觉验收（`prd.md:30`、`209`；decision-log U-019 只用既有页面只读填字段），由 C05／C07 承接 |

材料作者与独立验收者判定前读 `docs/architecture/test-asset-governance-rules.md#验收标准可执行形式der-01der-11r-001fr-16ac-16` 的真实好坏例与匿名不自判要求；本文件不复制第二标准。

### 验收对象

本节回答：哪个真实对象被检查，缺什么输入，谁提供或执行。

对象数据（真实值，非示例）：

```json
{
  "workspace": "/Users/Hugh/Hugh/Project/PaperBuilder-workflowhub-ui-frontend-c01-norm-init-20261024",
  "service": "frontend vite dev 端口 5175（frontend/vite.config.ts:7）、API 5176（:14）",
  "route": "/simulations（frontend/src/App.tsx:166，组件 simulation-records-page.tsx:1467）",
  "state": "UiAsyncState ready/empty/error（simulation-records-page.tsx:43；业务状态词表 :134）",
  "viewport": "1440x900（specs/design/layouts.md:86；quality.md:39 另列 1280x900、390x844）",
  "owner": null
}
```

- **owner**：留空，按合同由检查器输出"用户"；本任务无项目 owner 声明（`2026-10-24-103-paperbuilder-state.md` §9.3）。
- **设计来源**（S5 第 4 项，相邻节承接）：`specs/design/layouts.md:47` 的 `PB-DES-T05-SIMULATION` 与原型 `specs/design/prototypes/实盘UI/src/components/SimulationBoard.tsx`。
- **数据／权限**（S5 第 5 项）：数据为 `frontend/src/v2-simulation-api.ts:1034` 的 `/api/v2/simulation-cards`；权限仓内无声明，属真实缺口，检查时按缺项写出名字。
- **来源安排**：`workspace` 来自本任务 PB 专用 worktree（`quality/evidence/build-plan/2026-10-24-107-paperbuilder-checkout.md`）；`service`／`route`／`state`／`viewport` 来自上列真实文件；执行 owner 为 verify-code 执行者；时点为 P7 之后、P9 验收前。
- **未观察范围**：未启动服务、未开浏览器、未截图；上述值是材料位置事实，不是已观察到的页面状态。

本节唯一 `checkAcceptanceObject` producer 在 `skills/spec-specify/templates/spec-template.md` 的 marker 之后；本文档不复制该函数。执行记录见 `quality/evidence/build-plan/2026-10-24-110-acceptance-object-run.json`。

## 架构边界

产品边界：八类规范的来源、入口、模板与验收对象；工程边界：WorkflowHub 的方法与工具仓、PaperBuilder 的规范正文仓、任务库的证据目录，三者互不越界。真实消费者：`skills/ui-project-init/SKILL.md` 的职责表、六个入口方法、`workflows/verify-code/SKILL.md` 的验证步骤、`tests/contract/` 的两份 oracle。全局架构方案在下节维护，各 Phase 只承接自身差异。

## 实现设计（全局权威）

> 本节消费 PRD/decision-log，不再决定产品目标。缺项写 `unknown — owner / impact / next action`。

### 代码锚点

- **来源边界**：PRD 与 decision-log 只作来源映射，不在实现设计中创建第二份需求账本。
- **现状与目标差异**：两个入口无指针（`skills/plan-design-review/SKILL.md:8-9`、`workflows/build-code/SKILL.md:35`）；`skills/external/` 与 `skills/ui-project-init/templates/` 不存在；验收对象 producer 无生产消费者；九份正文有 6/4/3 处缺陷。
- **读取顺序**：先读 `skills/ui-project-init/SKILL.md` 的 `:14-23`（职责表）与 `:27`（旧两源），再读 `skills/catalog.yaml:1230-1256`（absorbed 形态）与 `:986-1024`（三包现有散文登记），最后读 `skills/spec-specify/templates/spec-template.md:270-324`（producer）与 `workflows/verify-code/SKILL.md:22,31`（验收对象与 UI 指针）。
- **代码锚点**：`skills/catalog.yaml` 的 `capability_decisions` 列表；`skills/spec-specify/templates/spec-template.md` 的 `checkAcceptanceObject(input, context)`；`tools/cli/check-acceptance-object.mjs`（新增，导出 `main(argv)`）；`workflows/verify-code/SKILL.md` 的验证步骤；`tools/cli/check-decision-log-chain.mjs`（只读，语义不变）。行号是生成时刻快照，会漂移，不作契约。
- **运行条件**：Node ESM；`npx vitest run <file>`（本 worktree 无 node_modules，vitest 2.1.9 由 npx 解析）；PaperBuilder 侧验证用独立 worktree 与只读命令。

### 接口与失败语义

- **选择的架构方案**：优先复用。外部能力按既有 absorbed 形态登记，地址写法沿第 7 节，不新增键；验收对象检查复用模板 producer，新增的只是一个薄 CLI 与 verify-code 的一步调用；双 active 不新增检查器，用白名单＋独立审查。
- **模块职责**：`check-acceptance-object.mjs` 只做三件事——从 spec 抽对象、调用模板 producer、按需核对 sources 引用的文件是否存在；语义适用性由独立读者判。
- **接口与数据流**：`node tools/cli/check-acceptance-object.mjs --spec <spec.md> [--context <json>] [--check-sources] [--root <dir>]` → stdout JSON `{ok, missing_fields, missing_source_files, object}`；退出码 0 通过、1 有缺项或缺失来源、2 用法或抽取失败（stderr 具名）。
- **失败语义**：spec 无验收对象节 → exit 2 并指出节名；缺字段 → 逐项列名；来源文件不存在 → 列 `key:path`；owner 空 → 输出"用户"，不报错。检查器不读业务数据、不认证来源语义。
- **新增控制面**：N/A — 不新增 catalog 键或字段。ModelScope 地址记在既有 `local_changes` 文本与 `skills/external/README.md`；`check-skill-consistency.mjs` 只按既有 `path`／`commit`／`license` 报告，不需要新键。

### 全局文件边界与依赖

- **新增**：`skills/external/**`（29 个文件：28 份上游闭包 + 1 份 README 索引）、`skills/ui-project-init/templates/**`（8 份）、`tools/cli/check-acceptance-object.mjs`、`tests/contract/external-capability-intake.test.mjs`、`tests/contract/acceptance-object-cli.test.mjs`、`docs/adr/0053-external-capability-vendoring.md`；任务库证据新增 `quality/evidence/2026-10-24-022-six-entry-readers.md`、`quality/evidence/2026-10-24-020-eight-class-placement.md`、`quality/evidence/2026-10-24-021-acceptance-results.md`
- **修改**：`skills/catalog.yaml`、`skills/reuse-registry.md`、`skills/plan-design-review/SKILL.md`、`workflows/build-code/SKILL.md`、`skills/ui-project-init/SKILL.md`、`skills/ui-project-init/skill-bundle.json`（仅P6/T016条件触发后files八模板声明）、`workflows/verify-code/SKILL.md`、`specs/workflowhub-ui-frontend-release-20261020/prd.md`；本任务材料自身：`spec.md`（P7 写验收对象、P9 回写 AC 档位）与 `phases/P9-全AC验收.md`（P9 回写本卡结论）
- **PaperBuilder 修改**：`specs/design/{design,components,layouts,interaction,craft,quality,README}.md`、`specs/frontend/{frontend,ui-quality}.md`、`docs/adr/0035-project-norm-authority-and-value-source-migration.md`（以上路径相对 PB worktree 根）
- **禁止改动**：`tests/contract/acceptance-object-required-fields.test.mjs`（C01 冻结 oracle，221 断言）、`tests/contract/external-capability-intake.test.mjs` 与 `tests/contract/acceptance-object-cli.test.mjs`（本轮 build-plan 作者的预写 oracle，owner 为 build-plan 作者；build-code 不改断言，需改走测试变更请求）、`tools/cli/check-decision-log-chain.mjs`（U-022 保持告警）、`specs/archive/**`（历史字节只读）、PaperBuilder `frontend/**`（本卡不改业务代码）、`specs/workflowhub-ui-frontend-release-20261020/prd.md` 中与许可复制无关的条款
- **全局依赖**：真实边只有这些——P3 依赖 P2（消费入口事实）；P4 依赖 P3（消费旧条款材料位置）；P5 依赖 P4（消费已更正的 `specs/frontend/ui-quality.md`）；P6 依赖 P5（消费已对齐的九份正文）；P7 依赖 P6（消费八类可消费事实）；P8 依赖 P7（消费检查器）；P9 依赖 P8（消费全部原件）。P1 与 P2 无依赖边，可并行；二者都不产对方输入。跨批共享路径由这些边定序：P4 先于 P5 写 `specs/frontend/ui-quality.md`；P2 先于 P6 写 `skills/ui-project-init/SKILL.md`；P7 先于 P9 写 `spec.md` 的验收对象与 AC 回写
- **文件归属**：每个路径只有一个写主；共享路径按上条点名先写者与后写者
- **回滚与恢复**：复制件错误按包目录整体重放；登记错误改回原条目；PB 正文错误按单文件回退到上一版并保留失败原件

### 需求到任务追踪




| 来源 / 决定（decision-log 位置；上游 PRD 引用） | 原义行为 / 强度 | FR / AC | Phase / Task | 正例 + 负例判据 / 证据 | 依赖 / 状态 |
| --- | --- | --- | --- | --- | --- |
| R-001／U-008（decision-log WP0） | 三份能力整包入库后可离线读 | FR-NORM-001 / AC-C01-1 | P1/T001 | ORACLE-P1-INTAKE：复制件存在且非空；反例=删任一文件即红 | none；current |
| R-010／U-010、U-011（decision-log WP0） | 按 absorbed 七项事实登记，以仓内副本为准 | FR-NORM-001 / AC-C01-1 | P1/T002 | ORACLE-P1-INTAKE：条目字段齐；反例=缺 commit 即红 | T001；current |
| R-020／U-011、U-024（PRD §S3 L107） | 更新检查交可回读记录，不报无更新 | FR-NORM-003 / AC-C01-5 | P1/T003 | ORACLE-P1-INTAKE：update_policy 与记录一致；反例=写“无更新”即失败 | T002；current |
| R-010／U-009、U-023（PRD L51、L77、L107、L654） | PRD 许可与复制口径统一，旧禁令移除 | FR-NORM-002 / AC-C01-1 | P1/T004 | ORACLE-P1-INTAKE：旧禁令消失且指 skills/external；反例=保留旧禁令即红 | T003；current |
| R-003／U-012（PRD L199、L202） | 两入口直接写具体路径并与职责表一致 | FR-NORM-004 / AC-C01-2 | P2/T005 | ORACLE-P2-ENTRY：路径可解析且与表逐行一致；反例=只写统一入口即失败 | none；current |
| R-007／U-012（PRD §S2、§S4 第 4 条） | 生产方补 missing/stale 缺源写法 | FR-NORM-004 / AC-C01-2 | P2/T006 | ORACLE-P2-ENTRY：三类词与影响齐；反例=只有 unknown 即失败 | T005；current |
| R-002／U-003、U-013（PRD §C01 范围） | 三种起点各一条材料→产物→结论链 | FR-NORM-005 / AC-C01-1 | P3/T007 | ORACLE-P3-CHAIN：每环可打开；反例=只写“事件发生过”即失败 | P2；current |
| R-003／U-014（PRD C01-F2、AC-C01-2） | 47 条旧条款逐条去向 | FR-NORM-007 / AC-C01-2 | P4/T008 | ORACLE-P4-ACCOUNT：47 行无空行；反例=写“同上”即失败 | P3；current |
| R-003／U-014（PRD L208） | ADR0035 五处错误事实追加更正 | FR-NORM-007 / AC-C01-2 | P4/T009 | ORACLE-P4-ACCOUNT：五处可对真实字节；反例=只改一处即失败 | T008；current |
| R-008／U-021、U-022（PRD 判定器 L203） | 四位 caller 结案与双 active 白名单 | FR-NORM-007、FR-NORM-010 / AC-C01-2 | P4/T010 | ORACLE-P4-ACCOUNT：四位逐位有现状与未知；反例=写成“零读者”即失败 | T009；current |
| R-003／U-004（PRD C01-F2） | 6 处冲突与 4 处过期改成当前事实 | FR-NORM-007 / AC-C01-2 | P5/T011 | ORACLE-P5-DOCS：每处可回真实源码；反例=只改措辞即失败 | P4；current |
| R-003／U-016（PRD C01-F2） | 5 条丢失条款补回并写适用条件 | FR-NORM-007 / AC-C01-2 | P5/T012 | ORACLE-P5-DOCS：5 条带条件；反例=只补标题即失败 | T011；current |
| R-003／U-015（PRD C01-F2） | 三处悬空补 archive，重复段只留一处 | FR-NORM-007 / AC-C01-2 | P5/T013 | ORACLE-P5-DOCS：链接可解析且计数为 1；反例=三处并存即失败 | T012；current |
| R-013／U-017（用户 2026-10-24 追加消息） | 八类各一份可照抄模板 | FR-NORM-006 / AC-C01-1 | P6/T014 | ORACLE-P6-TEMPLATE：八份节序与必填项齐；反例=写死 PB 值即失败 | P5；current |
| R-014／U-018（用户 2026-10-24 追加消息） | 标准落成模板形状并给反例 | FR-NORM-006 / AC-C01-1 | P6/T015 | ORACLE-P6-TEMPLATE：六条形状可指到位置；反例=只写“参考 STE”即失败 | T014；current |
| R-013／U-017（decision-log WP5） | T016条件已触发：导航对应八模板须加入既有bundle.files；不宣完整跨技能闭包 | FR-NORM-006、FR-NORM-004 / AC-C01-1 | P6/T016 | ORACLE-P6-TEMPLATE：导航/八模板声明与282源码链可核；反例=漏声明模板或冒实际发布通过即失败 | T015；current |
| R-004／U-020（PRD C01-F3、L122） | 最小检查复用模板 producer | FR-NORM-008 / AC-C01-3 | P7/T017 | ORACLE-P7-ACCEPT：缺 viewport 报 viewport；反例=自造第二份 checker 即红 | P6；current |
| R-004／U-020（PRD §S5 L122、L124） | 真实验收对象进 spec 且接进 verify-code | FR-NORM-008 / AC-C01-3 | P7/T018 | ORACLE-P7-ACCEPT：owner 空输出“用户”、verify-code 含命令；反例=静默空白即红 | T017；current |
| R-005／U-019（PRD AC-C01-4） | 一页真实任务准备、五类分开 | FR-NORM-009 / AC-C01-4 | P7/T019 | ORACLE-P7-ACCEPT：五类落点可指、Experience sha256 一致；反例=混写即失败 | T018；current |
| R-008／U-021（PRD 判定器 L203） | 双 active 受控负例报出第二处 | FR-NORM-010 / AC-C01-2 | P8/T020 | ORACLE-P8-NEGATIVE：第二处可复放；反例=只断言函数存在即失败 | P7；current |
| R-008／U-022（PRD 判定器 L203） | 缺失来源负例与断引用告警语义保持 | FR-NORM-010、FR-NORM-008 / AC-C01-3 | P8/T021 | ORACLE-P8-NEGATIVE：报 key:path 且告警仍 exit 0；反例=静默通过即红 | T020；current |
| R-019、R-021／U-001（PRD L117、L128、L149） | 四项计量与三级严重度贯穿全过程 | FR-NORM-001、FR-NORM-011 / AC-C01-1、AC-C01-2、AC-C01-3、AC-C01-4、AC-C01-5 | P9/T022 | ORACLE-P9-ACCEPT：五条 AC 各有档位与原件的逐条核对；反例=以计数代逐条即失败 | P8；current |

### 全局验证策略

- **验证策略**：两条冻结 oracle 覆盖可执行面（入库登记、检查器行为）；语义面由独立读者按 Appendix A 逐条核真实材料；不声称任何 AC 已通过。
- **RED/GREEN 设计**：`npx vitest run tests/contract/external-capability-intake.test.mjs tests/contract/acceptance-object-cli.test.mjs` 是 P1／P7 的共同判定器；RED 已实际采集（`quality/tests/2026-10-24-120-build-plan-red-v2.txt`，12 条失败、exit 1），GREEN 由 build-code 在同一 oracle 上取得。
- **首判与最终聚合**：各 Phase 在本 Phase 取得其承接 case 的执行原件与独立核对结论：P1 外部能力与更新，P2 入口读取，P3 三起点链，P4 去向与旧 caller，P5 正文修复与八类落点，P6 模板，P7 验收对象与准备的语义适用性，P8 负例。P9 按 Appendix A 聚合并独立复放这些结论；缺少首判原件时记缺口、回原 owner Phase 补证，不替上游首次作结论，不倒填已完成；非 `pass` 一律不计通过。
- **不能证明的内容**：不证明真实页面可用、不证明语义适用性、不证明外部包在宿主中的运行效果；这些由真实读者与后续卡片核。

## Appendix A — 验收判据（唯一权威）

- [ ] **AC-C01-1**：三种起点各一条真实材料→产物链；八类可消费或具名不适用；八份模板可照抄；关联 FR-NORM-001、FR-NORM-002、FR-NORM-005、FR-NORM-006
验证：由 P1、P3、P5、P6 在各自 Phase 交执行原件与首次独立结论，P9 独立读者逐条复核材料与产物：三条链每环可解析且产物是生成的规范内容而不是审计结论；`2026-10-24-020-eight-class-placement.md` 逐类给落点与缺口影响；八份模板换项目名可写；判定方式为只能人读（语义适用性）。
通过：每环路径可打开且行号指向真实字节；八类各有落点或具名不适用且缺源写影响；模板含固定节序、必填项、填写指引与反例且不依赖 PaperBuilder 专有事实；八类表按"首交可用规范／缺源／后续补强"三分标注。
失败：空骨架；默认填业务规则；拿错误实现当标准反推；第三种起点只写"事件真实发生过"或以审计结论代替生成产物；模板只是目录或标题。
证据：三条链原件、`2026-10-24-020-eight-class-placement.md`、八份模板与独立审查原件；复制件的许可例外依据是 `decision-log.md` 的「与来源研究的一处真冲突」段与 `quality/evidence/human-confirmations/2026-10-24-001-make-decision-approved.json`（U-008／U-009 的真实答复）。

- [ ] **AC-C01-2**：47 条旧条款逐项去向；六处入口读新源；无第二 active 副本；关联 FR-NORM-004、FR-NORM-007、FR-NORM-010、FR-NORM-011
验证：P2/P4/P5/P8 在各自 Phase 交原件与首次独立结论，P9 独立读者复核：47 条逐行有去向或具名缺口（三桶相加若与 47 不符，先核真实清单并写明重叠）；`2026-10-24-022-six-entry-readers.md` 逐处给出六处入口的当前行号、可执行读法与该处真实读者；两处补指针入口与职责表逐项一致；白名单与残留清单存在；ADR0035 五处更正可对真实字节；判定方式为只能人读，辅以真实文件读取命令。
通过：每条款有去向无空行；入口路径可解析且与职责表一致；ADR 无与真实状态相悖的陈述；全仓无第二份 active 规范。
失败：只改 ui-project-init；只换文件名；留一旧一新都能读；47 条有空行或"同上"；把"无 active 文件指向"写成"零读者"。
证据：47 条去向表、白名单与残留清单、ADR 更正记录、入口 diff。

- [ ] **AC-C01-3**：验收对象被真实消费者用一次；缺 viewport 报名字；owner 缺省为"用户"；关联 FR-NORM-008、FR-NORM-010
验证：P7 在真实 `spec.md` 上按 `workflows/verify-code/SKILL.md` 验证步骤的原文命令执行一次（逐字取自步骤文本，保留命令与输出），再做两次定向运行（删 viewport、owner 置空）；P8 做缺失来源负例；P9 记录该次 verify-code 步骤调用；判定方式为机器可判（命令与退出码），执行 owner 为 verify-code 执行者。
通过：真实对象可回读；缺 viewport 输出 `missing_fields: ["viewport"]` 且退出码 1；owner 空输出"用户"；检查在 verify-code 步骤被真实调用过一次。
失败：只有 schema 样例；检查没被执行；缺项报"字段校验失败"这类模糊话；owner 静默为空白。
证据：验收对象原件、三次运行输出与退出码原件。

- [ ] **AC-C01-4**：分权后跑一次真实任务准备；五类不混写；Experience 原字节在；语义适用性被复核；关联 FR-NORM-009
验证：P7 交付《真实任务准备》原件（`quality/evidence/2026-10-24-012-real-task-preparation.md`）、五类落点清单与本 Phase 的首次独立语义复核结论；P9 独立读者复核五类位置、八项字段、语义结论与 Experience sha256（`ed15c663a91c…`、`100618fec796…`）；判定方式为只能人读＋可复核的字节比对。
通过：准备原件存在且每节指真实位置；五类不混写；Experience 归档 sha256 前后一致；语义适用性有复核结论。
失败：准备原件不存在；把设计／工程／任务／知识／facts 的权威正文混写或复制成第二权威（同一页准备文档引用五类各自真实位置不属混写）；Experience 被改写或删除；用"缺口说明"顶替准备原件；未验证语义适用性就报规范完成。
证据：准备原件、五类落点清单、sha256 前后比对记录。

- [ ] **AC-C01-5**：外部能力更新检查：一次可复核的查询或失败分支；关联 FR-NORM-003
验证：P1/T003 交付记录（查了 `repo/files` 当前 vs 固定 Revision、`git ls-remote`、六个历史 API 候选；返回树一致；`/repo/revisions` 等 404），核对 `catalog.update_policy` 与该记录一致；判定方式为机器可判（命令与返回可回读）＋只能人读的结论措辞。
通过：入口与返回可回读；不可判定原因具体；状态写"部分可判定（current=pin；history unavailable）"；不出现"无更新"。
失败：报"无更新"；编造版本差异；只写"已检查"不给入口与返回。
证据：查询命令与原始输出原件、catalog 条目。

## 12. 风险、未决与交接

- **RISK-01**：入口指针与实际职责表漂移
  - **受影响 ID**：PFACT-001、FR-NORM-004、AC-C01-2
  - **触发条件**：只改一处入口或职责表先改后入口未跟上
  - **后果**：读者按入口读不到最新分类
  - **缓解或停止**：P2 一处改完立即核另一处与职责表逐项一致；不一致即停
  - **处理阶段**：build-code P2
  - **验证**：两处路径全部可解析且与职责表行一一对应

- **RISK-02**：ADR0035 更正流于表面
  - **受影响 ID**：PFACT-007、FR-NORM-007、AC-C01-2
  - **触发条件**：只加一句"已更正"而不改具体错误陈述
  - **后果**：下一读者仍被旧事实误导
  - **缓解或停止**：五处逐条列出旧句与新句，独立读者按真实字节核对
  - **处理阶段**：build-code P4

- **RISK-03**：复制未声明许可内容的风险
  - **受影响 ID**：PFACT-004、FR-NORM-001、AC-C01-1
  - **触发条件**：对外分发复制件或把未声明写成已获许可
  - **后果**：著作权风险由项目所有者承担（U-008 已选择）
  - **缓解或停止**：登记与 README 明写"未声明"，不写"已获许可"
  - **处理阶段**：build-code P1 与后续

- **RISK-04**：新增检查器变成无人消费的死代码
  - **受影响 ID**：PFACT-009、FR-NORM-008、AC-C01-3
  - **触发条件**：只加 CLI 不接进 verify-code 步骤
  - **后果**：重复历史教训（校验器 0 生产调用者）
  - **缓解或停止**：冻结 oracle 断言 verify-code 点名命令；P7 在本任务真跑一次
  - **处理阶段**：build-code P7

- **RISK-05**：把"部分可判定"写成"无更新"
  - **受影响 ID**：PFACT-005、FR-NORM-003、AC-C01-5
  - **触发条件**：只查当前树未记账，或忽略 404 分支
  - **后果**：给出虚假安心
  - **缓解或停止**：记录三条入口与返回，写"部分可判定"
  - **处理阶段**：build-code P1

- **RISK-06**：真实准备用样例代替真实页面
  - **受影响 ID**：PFACT-011、FR-NORM-009、AC-C01-4
  - **触发条件**：填不到真实页面就拿示例充数
  - **后果**：AC-C01-4 假通过
  - **缓解或停止**：缺项写名字；做不出记未通过
  - **处理阶段**：build-code P7

- **OPEN-02**：新增地址键方案已放弃，沿既有字段登记
  - **受影响 ID**：PFACT-003、FR-NORM-001、AC-C01-1
  - **负责人**：P1 作者
  - **影响**：不新增 `upstream[].source_url`；ModelScope 地址按第 7 节回读。许可未知仍如实保留，不因取消新增键而视为已解决。
  - **处理阶段**：build-code P1；依据 `quality/evidence/build-plan/2026-10-24-121-spec-analyze-dispositions.md` M6。
  - **关闭条件或停止**：架构选择已定；P1 核三条真实 URL、固定版本与既有字段一致，检查输出以实跑为准，不预填 license 提示条数。

- **OPEN-03**：两条无出处旧条款的精确清单未取得
  - **受影响 ID**：PFACT-006、FR-NORM-007、AC-C01-2
  - **负责人**：P5 作者
  - **影响**：可能漏修两条
  - **处理阶段**：build-code P5
  - **关闭条件或停止**：按 `2026-10-24-103-paperbuilder-state.md` §2.4 的候选锁定两条并补出处，或记 unknown＋影响

- **OPEN-04**：四位旧 caller 的仓外/动态读者未知
  - **受影响 ID**：PFACT-008、FR-NORM-007、AC-C01-2
  - **负责人**：P4 作者
  - **影响**：结案说明不能宣"零读者"
  - **处理阶段**：build-code P4
  - **关闭条件或停止**：结案说明写"无 active 文件指向；仓外与动态读取未知"

## 13. 业务影响与回归范围

### 既有规范与测试约定

- **既有行为**：`tests/contract/acceptance-object-required-fields.test.mjs` 221 条断言、`ui-skill-contract.test.mjs`、`n2-skill-catalog-portability.test.mjs` 与 `check-skill-consistency.mjs` 的报告语义
- **本需求影响**：计划复制 28 份上游文件（SDD 17 减 `.gitattributes`／`.gitignore` 为 15，markdown 子技能 12，design-tokens 1），加本地 README 索引共 29；依据固定研究 `2026-10-24-105-external-and-standards.md` §1.2 与冻结测试 `vendoredFiles`，不是实现完成计数。另有 3 条 catalog 记录、8 份模板、1 个 CLI 与 2 份冻结 oracle；登记不新增键。许可声明的保留义务仍按固定源处理，不能用 29 的计数代替核对。
- **回归路径**：受影响测试逐个文件跑，不跑全量；`npx vitest run tests/contract/acceptance-object-required-fields.test.mjs` 必须仍为 221 passed。PaperBuilder 的 `style-token-guard` 需在 PB 侧装依赖后真实运行，本卡不执行也不声称已跑，交 verify-code 的独立核验
- **验收**：AC-C01-1／AC-C01-3 的证据与上述测试原件

- **可能受冲击的业务规则**：PaperBuilder 九份正文的断言与守卫（`style-token-guard.test.ts` 读九份正文）；改动后须由 PB 侧守卫在真实运行中核，不在本卡宣通过
- **明确无影响**：PaperBuilder 业务代码、前端实现、数据库与回测链路；WorkflowHub 公共 runtime 七类分类、命令接口及参数不变，但现已修复 `tools/cli/stage-runtime.mjs::registeredTaskCandidates` 的既有身份发现项目隔离缺陷（跨项目同 task_id 的 deterministic 路径误收外仓 manifest）。这是当前任务必要工具依赖修复，不新增 C01 产品功能；影响原 consumer `deriveIdentityFromAuthenticatedWorktree → resolveWorkflowHubIdentity → thinTaskContext → public stage runtime` 的候选发现，项目/任务/workspace认证、真实重复冲突与坏/缺 manifest 拒绝须验证；范围及授权沿221，实际048/049 RED与对照、050单文件10/10 GREEN、051 diff沿222，局部验证不冒独立质量或整任务验收。

## 补充材料

- PRD 义务提取：`quality/evidence/build-plan/2026-10-24-101-prd-requirements.md`
- WorkflowHub 现状：`quality/evidence/build-plan/2026-10-24-102-workflowhub-state.md`
- PaperBuilder 现状：`quality/evidence/build-plan/2026-10-24-103-paperbuilder-state.md`
- UI 适用性三来源：`quality/evidence/build-plan/2026-10-24-104-ui-applicability.md`
- 外部能力与语言标准：`quality/evidence/build-plan/2026-10-24-105-external-and-standards.md`
- 知识图查询：`quality/evidence/build-plan/2026-10-24-106-knowledge-graph.md`
- PaperBuilder checkout：`quality/evidence/build-plan/2026-10-24-107-paperbuilder-checkout.md`
- 冻结 oracle RED：`quality/tests/2026-10-24-120-build-plan-red-v2.txt`
- 验收对象检查运行：`quality/evidence/build-plan/2026-10-24-122-acceptance-object-run.json`（110 号是 spec 早期版本的同一次检查）
- 未决项关闭与澄清结论：`quality/evidence/build-plan/2026-10-24-116-oi-closures.md`
- 合并审查处置：`quality/evidence/build-plan/2026-10-24-118-review-dispositions.md`
- 一致性分析：`quality/evidence/build-plan/2026-10-24-114-spec-analyze.md` 与其处置 `2026-10-24-121-spec-analyze-dispositions.md`
- 覆盖审计：`quality/evidence/build-plan/2026-10-24-115-coverage-audit.md`
