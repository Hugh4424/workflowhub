你是独立审查员，一次性给三个角度的审查意见。只看本文件。

## 背景
workflowhub：AI 工作流编排工具，宪法核心=薄核心、记事实不阻断、质量靠独立审查与人、不写阻断式质量门。立项为逃离前身 agenthub（堆 9.5 万行 gate 代码、半数提交修 gate 死锁，宪法 F10 反例点名）。
任务 M13b：把 agenthub design 阶段的质保能力深化进 `workflows/build-spec/SKILL.md`。

## 最终方向（已与用户三轮确认锁定）
1. 目标=定义 build-spec 必须产出的「质量事实契约」（scope 边界/自检结果/异源审查摘要/未解风险/handoff required_reads），机制只做候选实现、反选最少。不照搬 agenthub 机制清单。
2. 保留（薄质量本体）：spec 构建本体（speckit-specify/clarify+平台约束交叉比对+扎根 decision-log）、最简 spec 阶梯（反过度工程）、spec 三档章节、7 条自检+Spec-Purity grep、异源审查、行为验证规则、摩擦即记、--task-dir 机制、Known Gaps。
3. 删：agenthub 那 3 道门（退出门/审查门/推进门）整层删（检查内容已被 7 自检+纯净度扫描+异源审查覆盖）；TodoWrite 待办模板仪式、[DECOMP] 遥测、绑门自动写、重复行。
4. 审查机制省钱版：不再要三个不同 source_family，改成一个 AI 一次出三角度建议。
5. 新增全局 TASK_TRACKING_ROOT 环境变量（任务跟踪文件不存 repo，默认 Knowledge 目录），本任务一起做。
6. 5 框架外部调研移出本任务，另立。
7. 沟通需求：与人交互用大白话+给选项说后果；勤报进度。

## 你的任务（≤500 字）
给三个角度各一段：
- **方向**：质量事实契约这个方向能否既保质量又不违宪？有无硬伤？
- **框架**：删掉 3 道门、只留薄自检+异源审查，质量是否会塌？有无漏掉的真痛点？
- **范围**：本批（质量能力 + TASK_TRACKING_ROOT，5框架已移出）边界是否合理？
每角度给 verdict（pass/revise）+ 标 severity 的 findings（blocking/major/minor）。没问题就直说 pass。
