# AGENTS.md

本文件给通用 AI 助手（任意命令行 agent）提供 workflowhub 仓库的身份与规则信息。

## 项目身份

- 名称：workflowhub
- 定位：面向 AI 开发工作流的编排工具，可被多种命令行 AI 助手复用。
- 构建基准：本仓库的设计宪法 [CONSTITUTION.md](CONSTITUTION.md)。

## 给 agent 的规则

- 任何改动须符合宪法，并用 [constitution-checklist.md](constitution-checklist.md) 逐条对照。
- 重活放进子代理上下文执行，主上下文只收摘要（减少主上下文占用）。
- 重读量动作点默认派子代理：grep 全仓扫描、跑测试/采集 RED/GREEN 证据、读多文件对标、反向引用扫描——这些由子代理在其上下文执行，主上下文（工头）只收结论摘要（路径+exit_code+清单），不自己跑。真正一两行能讲清的微动作除外。
- 技能应可独立调用、可搬运，不绑死单一宿主环境。
- 质量裁决由独立来源独立上下文产出，禁止自审自判。

## 入口文件

- 项目说明：[README.md](README.md)
- 设计宪法：[CONSTITUTION.md](CONSTITUTION.md)
- 检查清单：[constitution-checklist.md](constitution-checklist.md)
- 术语表：[CONTEXT.md](CONTEXT.md)

## 当前目录职责（Phase 8）

- `runtime/`：生产运行时；按 `interface/`、`stage/`、`task/`、`evidence/`、`review/`、`adapters/`、`distribution/`、`schemas/` 分区。
- `tools/cli/`：人工或 CI 调用的命令行工具，不承载运行时状态。
- `skills/`：可搬运技能；`workflows/`：五阶段入口；`config/`：配置；`tests/`：跨模块和集成测试。
- `core/`、`scripts/`、顶层 `schemas/`：历史兼容区。未列入 move-map 的文件保持原位，未经证明不得新增能力。
- `docs/architecture/move-map.json` 是本次目录迁移的唯一事实；新增文件必须先登记职责和消费者。
- `tools/architecture/`：只读架构诊断与最终证据校验，不进入 Runner/Skill Bundle，也不作为普通推进许可证。
- `node_modules/` 仅为本地/CI 安装产物，不提交、不作为运行时来源。

## 当前治理边界

- 当前工作真相只有认证 worktree `specs/<task-id>/` 下的 `decision-log.md`、`spec.md`、`plan.md`、`tasks.md` 四份材料；外置任务追踪目录只放 `task.json`、`facts.jsonl`、`quality/`、`index.json` 等执行文件，不新增 gate。旧 task、旧 receipt、旧 review、历史 snapshot 只读保留。`m15-retirement` 材料迁移及仓外 `~/Knowledge/Projects/workflowhub/tasks/Projects/` 清理不属于本任务范围。
- 测试、审查、历史和 inventory/complexity 只产生事实证据，不是推进许可证；质量缺失保持 `unknown`/`unavailable`/`incomplete`，不能伪造通过。
- provenance、原始 review 事实和失败事实必须保留，不能用摘要覆盖来源，也不能把 provider 失败改写为质量通过。
- 新机制或新控制面必须先登记职责、真实 consumer、owner、测试和删除/保留条件；没有当前消费者的重复控制面不新增。
- 外部 Stage Agent 只能通过现有 bridge 提交显式 `project_name/task_id/task_path/stage/attempt_id/agent_run_id` 与 `session` 或 `unavailable`；不读取旧 session/env、不扫描 transcript、不提交质量 receipt。

## vNext 永久实施边界

- `make-decision` 只创建并维护四份当前材料；`build-spec`、`build-plan` 只细化同一份材料；`build-code`、`verify-code` 只消费同一份材料和 task facts。
- vNext task 目录只保留 `task.json`、`facts.jsonl`、`quality/reviews/`、`quality/tests/`、`quality/verify.json`、`index.json` 及必要的 `quality/evidence/`；不创建旧 accepted、run、receipt、review-flow 或 current projection。
- 禁止 successor/predecessor、selector、snapshot lineage、phase trace、historical correction、replacement review、reopen、rebind、continuation、recovery、checkpoint permit；旧记录只读，不作为新 task writer。
- review、test、evidence、history、inventory、complexity 都是事实，不是继续工作的许可证；`unknown`、`unavailable`、`incomplete` 不能阻止同 task 修复，但缺失质量事实不能被宣称为完成。
- public runtime 只有 `doctor`、`status`、`run`、`review`、`verify`、`confirm`、`authorize` 七类；`prepare`、`start-run`、`publish-*`、`record-*`、`recover-*`、`rebind-*`、`phase-*` 只能是私有实现，不能成为公共流程节点。
- reports immutable；M14–M17 只读保留/归档。新增生产文件、命令、schema 或持久对象必须同时写明唯一 consumer、owner、替代关系和删除条件；不得新增双写、永久 compatibility bridge 或 history runtime branch。
