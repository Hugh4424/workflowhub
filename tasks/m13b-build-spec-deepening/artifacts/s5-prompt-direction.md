你是独立盲审员。只看本文件，不知道有其他审查员存在。角度：方向合理性（intake-direction-review）。

## 被审决策（workflowhub 项目，M13b build-spec 深化）

背景：workflowhub 是 AI 开发工作流编排工具，有一套宪法 CONSTITUTION（核心信条：薄核心窄契约、记事实不阻断、质量靠独立审查与人、不写阻断式质量门）。它的立项根因之一就是逃离前身系统 agenthub——agenthub 堆了约 9.5 万行 gate/校验代码，约一半提交在修 gate 死锁，宪法 F10 反例点名此事。

决策：把 agenthub design 阶段的质保体系移植进 workflowhub 的 build-spec 阶段技能。用户拍板「合宪改造版」：
- 5 个机制直接搬（判定为合宪）：强制异源审查、journal/evidence 留痕、Spec 纯净度 grep 扫描、7 条自检清单、摩擦即记。全部「记事实+浮现边界，不阻断推进」。
- 3 道原本是 blocking gate 的机制（stage_exit 退出门、post_review_pass 审查门、stage_advance 推进门）不照搬阻断语义，改成：检查逻辑全保留，失败时记录+浮现+由人确认推进，不卡死。

## 你的任务

只审「方向合理性」一个角度，输出 ≤400 字：
1. 这个「合宪改造版」方向是否真能既保住质量又不违宪？把 blocking 改成 non-blocking 后，质量保障是否实际形同虚设（人会不会直接忽略浮现的警告硬推）？
2. 有没有比「逐机制移植」更优的第三方向？
3. 给 verdict：pass / revise（指出方向上的 blocking 问题）。
列出 0-3 条 findings，每条标 severity（blocking/major/minor）。
