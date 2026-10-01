# 落地清单：build-plan 防臃肿 + 执行层防跑偏 + simplicity-guard 进写作流程

> 来源·产出：card-03 落地轮编制的施工清单（派发给落地子代理执行；即提交 8b452fc0 那批改动的逐条清单）
> 来源·时间：2026-09-29 20:35（本机 CST，文件 mtime）
> 来源·支撑：支撑 decision-log §18 与提交 8b452fc0 的逐条落点（E1–E16 ＋ 硬约束 ＋ 验证与交付要求）

工作目录：`W = /Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-03-20260919`
（**只改 W**；主检出 `/Users/Hugh/Hugh/Project/workflowhub` 不要动。）

## 0. 硬约束（违反即返工）
1. **不新增**门禁／字段／schema／确认点／阈值／CLI 动词；**不新增任何需要用户回答的问题**。
2. 不改 `runtime/**`、`tools/**`、`CONSTITUTION.md`、`specs/archive/**`。
3. `docs/standard-workflow.md:88-92` 是用户声明的**禁改区**（尤其 `:91`「不设统一预算 gate」）——一字不动。
4. 每个被改的技能目录，**同批刷新** `skills/<skill>/skill-bundle.json` 与 `skills/catalog.yaml` 对应项；哈希必须用**机器自身实现**重算（`runtime/adapters/local-skill-resolver.mjs#validateSkillBundle`，canonical + `localeCompare` 排序），**禁止手改哈希字面量**。
5. 除 E 项指定的行**就地改文字**外，不得重排文件、不得改动行数结构（很多既有锚点依赖行号；能净行数 0 就净 0，必须加行时在报告里说明）。
6. **英文文件写英文，中文文件写中文**（`skills/spec-plan/templates/phase-template.md` 是中文；`workflows/**` 与 `skills/*/SKILL.md` 按各自现有语言）。
7. 每条改动**先 `read` 到原文再改**，不许凭本清单猜原文。

## 1. 计划层防臃肿
- **E1** `skills/spec-plan/SKILL.md`（在「write an executable card for **every** Task」那句所在段，主检出对应 `:14`，以 W 实际行号为准）：补一句 —— 一个 Task = **一个用户可感知的交付增量**；同一交付物的连续步骤写进**同一张卡的分步序列**，不拆成多张卡。
  理由：今天没有「一个 Task 有多大」的定义，只禁止"压成一行"，导致每条风险/每条未核实项都升格成一张独立卡。
- **E2** `skills/spec-plan/SKILL.md`（主检出 `:12`「not a copy of the global design or another Phase」处）：补一句 —— **被取代的旧全文不留在同一文件内**；历史由 git 与既有归档承担。
  理由：今天只禁止"抄别人"，没禁止"留住自己被取代的旧全文"。
- **E3** `skills/decision-log/SKILL.md`（主检出 `:24-25`）：**删掉** `; there is no shorter appendix-only decision shape` 这半句（保留前半句）。
  理由：明令"不存在更短的形态"使 154 条登记全部等重。
- **E4** `skills/decision-log/SKILL.md`（主检出 `:147-148`「one compact row per … review finding …」）：把 `review finding` 限定为 **`load-bearing` review finding**。
- **E5** `workflows/build-plan/SKILL.md`：在它装配输入的既有位置（读 decision-log confirmed bindings 处）补 1–2 句 —— 同时读三种**既有的"减"载体**：`decision-omission-acceptance.v1`（已接受的"不做"）、`retain_or_delete`（删除决定）、`not_applicable`（不适用）。说明「不做」是合法登记、不是缺口。
  理由：这三个载体今天都存在，但 build-plan 一个都读不到。
- **E6** `workflows/build-plan/SKILL.md:281-288` 附近：补一句**切片纪律** —— 切片要过两条检验：①存在**能整片丢弃**的那一片（低价值/可后置）；②各片**大致等大**。另补半句：材料或范围**超出可读上限时，动作是把问题拆小**，不是继续往里写。（不设任何数字阈值。）
  理由：仓库今天对"切片"与"体量"0 命中，正对"白做 55%"与材料臃肿。
- **E7** `skills/spec-plan/templates/phase-template.md:39`（现文 `- **非目标**：[本 Phase 明确不做的事，防止范围膨胀]`）：改成 —— 非目标写「**本来可以是要做的目标、但明确不选**」的项（写清不选的理由），不写否定句。
- **E8** `skills/spec-plan/templates/phase-template.md:43`（现文 `- **主要风险**：[最可能让本 Phase 返工的一件事]`）：补「**若因它返工，替代走法是什么**」。
- **E9** `skills/spec-plan/templates/phase-template.md` 的 `Done` 行（约 `:23`、`:48`）：补「**没参与实现的人能用一条命令重放**；写不出可重放判据的验收项直接算未达成，不得记为达成」。

## 2. 执行层防跑偏（`workflows/build-code/SKILL.md`）
- **E10** 在既有 `read-current-task-documents` 步骤旁：补「续跑第一步**先对现实**：跑 `git status --short` 与本 Phase **自己写的** `gate_cmd` 当前输出；材料与代码不一致时**以代码为准**」。
- **E11** 六段摘要的 `remaining risks` 段：补「必须对本期**失败信号**给一句成句解读；唯一允许的空态写法是『这一轮没有失败信号』」。
- **E12** `workflows/build-code/SKILL.md:352-357`（本卡已落的 M2 收尾三件事旁）：补「**进展 = 交付锚**（新提交/新证据），不是动作次数；拿不出外部锚时按 `:272-275` 既有判据自述一行，写不出即报告给人」。（**不设次数/时长阈值**。）

## 3. 完成声明的上限
- **E13** `docs/standard-workflow.md`（约 `:304-307`，先读原文）：补「完成声明的上限 = **独立来源**的结论；结论为 adverse/unavailable 时，只能声明到该结论允许的程度」（不阻断修复，`docs/standard-workflow.md:88-92` 禁改区不得触碰）。

## 4. simplicity-guard 进写作流程（用户本轮新增要求）
- **E14** `skills/simplicity-guard/SKILL.md`：补一小节（不新建文件、不加字段），写清三件事：
  ① **调用点**：`spec-specify` 写 `spec.md` 的方案取舍与**非目标**时；`spec-plan` 写每个 Phase 的范围、写集与**非目标**时；以及既有 `plan-eng-review` 复核时。
  ② **输出形态**：结论写进**既有文本字段**（`spec.md` 的取舍/非目标段、Phase 的 `非目标`/`主要风险`、审查的删除类 finding 文案），**不新建产物**。
  ③ **空集写法**：`已读，无可删内容` 是**合法**写法（配合现有"没有这类问题时，不制造 finding"）。同时补一句：出现缩小/退役/删除决定却**没有**引用 lens 结论时，按既有合同记一条普通 finding（非拦截）。
- **E15** `skills/spec-specify/SKILL.md`：在写作流程里补 **1 句** —— 选定或保留方案形态前，用 simplicity-guard 的核心问题自查（「这一层挣得自己的位置了吗？」「能不能由已有能力承担？」），结论写进既有的取舍/非目标文本。
- **E16** `skills/spec-plan/SKILL.md`：在 Phase 写作流程里补 **1 句** —— 每个 Phase 的范围与写集按同一自查；缩小/退役/复用写进既有 `非目标`，删除类条数由既有 `plan-eng-review` 读数报告（只报数，不设配额）。

## 5. 懒改清单（明确不做）
- 不删 `skills/spec-plan/templates/plan-template.md`、不删 `skills/spec-tasks/templates/tasks-template.md`（**已弃用残留**，非本轮范围）。
- 不改 `skills/wh-review/stage-skill-plan.json` 的 `required_skills`（`tests/contract/stage-routing-and-concrete-testing.test.mjs:92-93` 冻结断言 `toEqual(["review"])`）—— 该不一致只登记为事实。
- 不新增复杂度预算/配额（规模读数复用既有 `tools/architecture/complexity-report.mjs` 与 `tests/contract/repository-inventory.test.mjs`）。

## 6. 验证与交付
1. `npx --no-install vitest run <前三批涉及的全部相关测试文件>`：必须**新增红 0**（与改动前逐条对比；基线 worktree 必须建在 `/Users/Hugh/Hugh/Project/` 下，**不能建在 `/tmp`**，否则 `Cannot find package 'js-yaml'` 假红）。
2. `validateSkillBundle` 对全部 skill 必须 `fail=0`。
3. 提交**分两笔**：一笔"机制文字 + 哈希链"，一笔"登记"。
4. 登记（append-only，不改既有编号）：
   - `specs/workflowhub-thin-core-card-03-20260919/decision-log.md`：在 `## 收敛检查` 之前新增 `### 十八、build-plan 防臃肿与执行层防跑偏的落地（2026-09-29）`，逐条列 E1–E16 的落点 file:line 与理由；
   - `specs/workflowhub-thin-core-card-03-20260919/design.md`：新增 `## §16`，写机制、写面、哈希、未落地项与残余风险。
5. **不要 push**；工作区必须干净。
6. 报告 ≤40 行：改了哪些文件（file:line）、哈希新旧值、测试结果（新增红 0 的证据）、未落地项与理由、4 条以内需要裁决的问题。
