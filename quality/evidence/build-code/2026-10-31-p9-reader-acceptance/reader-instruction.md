# 独立读者指令（P9 验收重设计，2026-10-31）

执行者：P9 验收重设计子代理。
读者：fresh-context 子代理，未参与写作、改稿、P9 讨论，也没读过本项目其它材料。

---

你是这位新作者材料的独立读者。作者是一位没读过本任务材料的执行者，
只拿十一条写作标准、三份模板与一条原始需求，写出了下面两份片段。
你只判他写的**验收节**：`phase-fragment.md` 的 `## 这一 Phase 怎么验收？` 一节，
包括一条验收标准（七槽之一）与七槽其余各段。

## 只读这三份（其它一律不读）

1. `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c07-real-page-verification-20261028/quality/evidence/build-code/2026-10-31-p12-writeside-experiment/phase-fragment.md`
   —— 被读材料。重点读第 35 行到第 124 行的验收节；其余节只作上下文。
2. `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c07-real-page-verification-20261028/quality/evidence/build-code/2026-10-31-p12-blind-judgment/pilot-requirement.md`
   —— 原始需求 R-001 与试点需求 R-PILOT-001，逐字原文。
3. 本文件。

不要读 `self-assessment.md`、`README.md`、任何 verdict、任何 `specs/` 下的材料、
任何 P9 文件或本目录其它文件；不要读 git 历史；不要问作者。

## 只判三件事

### 1. 能不能说清下一步动作

读完验收节，你能不能说出**下一个具体动作**：做什么、输入是什么、怎么观察结果。
必须给动作、文件或命令、观察方式（退出码/读数/判定器）三者。
只复述标题、栏目名、「按模板写」「照标准做」不算说清。

### 2. 能不能指出第一处改动

如果要按这份验收节开始做事，**第一处要改或要动的文件与位置**是哪里。
给路径与节/符号；若材料没写到能定位的程度，写「指不出」并说明缺哪条信息。
只指「模板」「标准」「某个 Phase」不算指出。

### 3. 有没有需要自己裁断的内部矛盾

验收节（必要时连同被它引用的片段上下文）里有没有两处互相冲突、
材料自己又没有裁断、必须由读者来定的地方。
逐条给原文引文与行号；没有就写「没有」。
如果材料自己已经裁断（例如写明记 `unavailable` / `incomplete`），
算「已裁断」，不算需要你裁断，但要单独列出并说明。

## 输出

写到（UTF-8）：

`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c07-real-page-verification-20261028/quality/evidence/build-code/2026-10-31-p9-reader-acceptance/reader-verdict.md`

格式：

- 第 1 节：三问逐条答，每条先给一句「能/不能」或「有/没有」，再给原文引文与行号。
- 第 2 节：覆盖范围——读了什么、没读什么、为什么。
- 第 3 节：最后一行结论，三选一：
  - 「三件都过」
  - 「有缺口：<哪一件>」并写缺什么
- 全文中文，不超过 1500 字。

## 纪律

只读，不改任何材料；唯一允许写的是上面的 `reader-verdict.md`。
不要替作者改稿，不要补写验收节，不要给自己的判定找台阶。
判的是**这份材料能不能让一个读者做事**，不是作者态度、不是模板是否在场、
不是门禁是否绿、不是文字是否漂亮。
