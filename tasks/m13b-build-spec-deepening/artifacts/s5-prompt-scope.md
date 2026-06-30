你是独立盲审员。只看本文件，不知道有其他审查员存在。角度：范围边界合理性（intake-scope-review）。

## 被审决策（workflowhub 项目，M13b build-spec 深化）

背景：workflowhub 是 AI 工作流编排工具，宪法核心：薄核心窄契约、最小可交付、记事实不阻断。本任务是单个 stage（make-decision → build-spec）的深化。

决策范围，本批要一起做：
1. 移植 7 个质保机制进 build-spec SKILL.md（异源审查、journal/evidence、spec-purity 扫描、7 自检、退出门、推进门、摩擦即记，全部合宪改造为非阻断）。
2. 新增 TASK_TRACKING_ROOT 全局环境变量（任务跟踪文件不存 repo，默认放 Knowledge 目录）。
3. 现在就做 5 个外部框架调研（cursor/plugins、affaan-m/ECC、EveryInc/compound-engineering、mattpocock/skills、obra/superpowers），给 M13b/c/d/e 做技能地图。

## 你的任务

只审「范围边界」一个角度，输出 ≤400 字：
1. 这批范围是否过宽？7 机制 + 全局 env + 5 框架调研 塞进同一个 build-spec 深化里，是否违反最小可交付？
2. 哪些该切出去单列？（特别是「5 框架外部调研」——它是独立大调研，产出给 M13b/c/d/e 整个系列用，和 build-spec 单 stage 深化是一回事吗？）
3. 最小可交付边界应该划在哪？
4. 给 verdict：pass / revise（指出范围层 blocking 问题）。
列出 0-3 条 findings，每条标 severity（blocking/major/minor）。
