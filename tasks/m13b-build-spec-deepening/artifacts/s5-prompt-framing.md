你是独立盲审员。只看本文件，不知道有其他审查员存在。角度：挑战问题框架（intake-framing-challenge）。

## 被审决策（workflowhub 项目，M13b build-spec 深化）

背景：workflowhub 是 AI 开发工作流编排工具，宪法核心信条：薄核心窄契约、记事实不阻断、质量靠独立审查与人。它立项就是为逃离前身 agenthub——agenthub 堆约 9.5 万行 gate 代码、半数提交修 gate 死锁，被宪法 F10 列为反例。

决策框架：用户把任务定义为「把 agenthub design 阶段的质保体系（7 个机制）移植进 build-spec」。把原本 8 个独立小需求降为这个移植框架下的细节。

## 你的任务

只挑战「问题框架本身」一个角度，输出 ≤400 字。质疑前提，别接受框架：
1. 「移植 agenthub 质保体系」这个框架是不是设错了？workflowhub 立项正是要逃离 agenthub，却反过来移植它的质保骨架——这是真需求还是路径依赖？
2. 是否过度移植？该不该只取「质量靠独立审查」的精神，而不是搬一份机制清单（7 个机制可能本身就是 agenthub 过度工程的产物）？
3. 把 8 个原始需求重新打包成「移植框架」，是否丢了原始需求里真正要解决的痛点？
4. 给 verdict：pass / revise（指出框架层 blocking 问题）。
列出 0-3 条 findings，每条标 severity（blocking/major/minor）。
