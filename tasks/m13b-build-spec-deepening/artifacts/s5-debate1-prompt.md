你是中立裁决员，做单人三档 debate 裁决（CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS 未设置，五方法庭降级为单人三档）。中立权衡两侧，别预设立场。

## 背景
workflowhub 是 AI 工作流编排工具，宪法核心：薄核心窄契约、记事实不阻断、质量靠独立审查与人、不写阻断式质量门。立项是为逃离前身 agenthub（堆 9.5 万行 gate 代码、半数提交修 gate 死锁，被宪法 F10 点名反例）。
任务：M13b 把 agenthub design 阶段质保体系深化进 workflowhub build-spec 阶段。

## 甲方：用户（Hugh）已拍板的方向
合宪改造版移植：5 机制（异源审查/journal-evidence/spec-purity/7自检/摩擦即记）合宪直搬；3 道原 blocking gate（退出门/审查门/推进门）保留检查逻辑但改成「记录+浮现+人确认推进，不阻断」。并入 TASK_TRACKING_ROOT 全局 env + 现在做 5 框架外部调研。

## 乙方：三源异源盲审的 blocking 反对意见
- B1（框架挑战）：把任务定义成「移植 agenthub 质保体系」本身是路径依赖、违立项初衷；应剥离移植外壳，回到原始需求实质痛点，最轻记事实就地解决。
- B2（范围）：5 框架调研是跨系列独立大任务，与 build-spec 单 stage 深化零依赖，捆绑违反最小可交付，应切出。
- 收敛 major：从「移植机制清单」转向「定义 build-spec 必须产出的质量事实契约（scope边界/自检/异源审查摘要/未解风险/handoff required_reads），机制可替换反选最少」。

## 裁决要求（≤350 字）
给三档之一：
- **强烈建议改**（乙方 blocking 成立，甲方方向需实质修正）
- **建议改**（部分采纳，甲方主干保留但须调整）
- **维持**（甲方方向成立，乙方意见降级为非阻断备注）
给出理由，并明确：哪些 blocking 该让位、哪些该坚持。这是给 Hugh 的 S9 决策参考，不替他做决定。
