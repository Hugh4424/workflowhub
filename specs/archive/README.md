# 已归档规划的读取与开发入口

归档是资料位置和任务收口，不代表所有产品能力已实现或验收通过。旧执行、审查、失败和质量限制按原件保留；不以用户所说“任务完成”覆盖具体未完成事实。

## 当前入口

| 母规划 | PRD / 决定 | 使用边界 |
| --- | --- | --- |
| UI / 前端能力：当前九卡规划 | [完整 PRD](workflowhub-ui-frontend-decision-refresh-20261013/prd.md)、[已确认决定](workflowhub-ui-frontend-decision-refresh-20261013/decision-log.md) | 这是新 UI 功能的母规划；九卡尚未启动，不把规划 final 当产品已实现 |
| 薄核心重构母规划 | [PRD](workflowhub-thin-core-rebuild-planning-20260919/prd.md)、[决定](workflowhub-thin-core-rebuild-planning-20260919/decision-log.md) | 保留母需求和历史引用；具体卡完成/质量以其真实材料和执行原件为准 |
| UI / 前端能力：旧版来源 | [旧 PRD](workflowhub-ui-frontend-capability-20260904/prd.md)、[旧决定](workflowhub-ui-frontend-capability-20260904/decision-log.md) | 历史对照与研究来源，不用旧十任务、旧试点和失效指令覆盖当前九卡决定 |
| CARD05 缺陷审计 | [已有归档](workflowhub-card05-stage-defect-audit-20261012/spec.md) | 本轮不重写、不覆盖已归档版本；原 incomplete / unknown / inconclusive 不变 |

领域语义读取 [GLOSSARY.md](../../GLOSSARY.md)。项目专业规范仍按当前决定放在仓库根 `specs/design/` 和 `specs/frontend/`，不放进 archive，也不因母规划归档而预先生成规范或实施文件。

## 从母规划开始开发

1. 从当前检出的仓库打开上述当前九卡 PRD，再读其 NAV 对应卡行、有效母决定和适用共享定义。
2. 归档 PRD 内的 `../../../` 指当前仓库根；两个 UI 母目录同级，旧报告兄弟链接仍从归档目录读取。不使用已删除任务 worktree 或临时目录作为开发依赖。
3. 每张卡建立自己的开发任务，按当前 [make-decision](../../workflows/make-decision/SKILL.md) 和 [build-plan](../../workflows/build-plan/SKILL.md) 承接已确认方向与必要未知项，形成自己的 `spec.md`、具名 `phases/P<n>-<名称>.md` 和纯指针 `phases/index.md`。通过 index 读取物理 Phase 文件，不凭裸编号猜名字。计划得到真实选择后才实施；母规划只读，不恢复旧四材料双写或额外阶段。
4. 外置调研、确认、原始审查和测试仍在 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-decision-refresh-20261013/` 等 PRD 具名原件位置。本地仓库 push 不会同步这些原件；换机器缺源时明确缺失，不能用摘要冒充全文。

## 历史路径的读取边界

本轮把三份母目录从 `specs/<任务名>/` 移至 `specs/archive/<任务名>/`。当前导航、ADR 和历史卡片中用于继续读取的母资料引用按新位置维护；原研究/review/测试输出、内嵌原 JSON、用户原话、原执行命令、工作区身份及形成时 hash 保原文。这些历史路径是 provenance，不是今日开发入口，也不要求原 worktree 继续存在。

历史旧 PRD 中的 Write target、当时的写集和章节定位保形成时含义；当前资料位置以本页及各归档目录为准。新 PRD 的已确认需求、九卡职责、依赖、独立验收和质量目标不因归档改变。本轮仅改位置和导航，不启动任何一张开发卡。

## 交付事实

本次提交、main/远端交付、工作区清理及 remaining worktree 状态以外置任务库中本次实际命令原件、close_action facts 与最新不可变人读交接为准。本页是人读导航，不新增进度权威、状态 reader、永久兼容桥或阶段门。
