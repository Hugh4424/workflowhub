# 四处缺口的改前 / 改后原文（2026-10-31）

改前原件：`quality/evidence/build-code/2026-10-31-p12-writeside-experiment/phase-fragment.md`
（18811 字节，`sha256 a5ab881f4d163b60a7c34bfbe621291dcba2b9782f72d649060624b3c0024afa`，未改）。
改后材料：`quality/evidence/build-code/2026-10-31-p9-closeout/phase-fragment.md`
（28902 字节，`sha256 87448f78ac59a113da4f64d7797085c49cd9b2f2f9f3030b23ab9f55c2e5b48e`）。
行号是各文件自己的行号；文字逐字照抄。

## 1. 缺 A/B 原件路径

- 改前：L74「默认本机隔离 worktree，版本与提交号 unknown，owner=build-plan」；
  L79「A/B 各放隔离 worktree」；
  L120–121「放 `quality/evidence/<task-id>/P1-effect/`；真实 task-id 与路径 unknown，owner=build-code 终末」。
  三处都只说「隔离 worktree」或占位，没有可打开的目录。
- 改后：头部 L13–16「**A/B 原件路径**：工作副本 `/tmp/c07-p1-effect-A`（真实交付 A）与 `/tmp/c07-p1-effect-B`（绿而错变体 B）；
  收口原件（sha256 与拆封记录绑定的那一份）另存 `quality/evidence/workflowhub-ui-frontend-c07-real-page-verification-20261028/P1-effect/A/` 与 `…/P1-effect/B/`；两处都保留，不删不覆写，只关闭其中启动的服务。」；
  环境 L89 与构造 L98 给同一对路径与做法（完整交付树、`node_modules` 软链回仓根、门禁 cwd=各自根目录）；
  承接 L143「A/B 原件另存该目录的 `A/` 与 `B/`，与 `/tmp/c07-p1-effect-A`、`/tmp/c07-p1-effect-B` 同字节」。

## 2. 判定器清单漏项

- 改前：L42 判据要求「绿而错变体必须通过该 Phase 已列的全部契约测试、门禁命令、判定器、断言和回归」；
  但反向场景 L62「B 通过全部门禁、契约测试、断言和回归」与用例 1 L89「对 B 跑试点 Phase 的全部门禁、契约测试、断言和回归」
  都没有「判定器」；L187 又写「`<试点 Phase 的门禁命令>` 与 `0`…命令 unknown」。
  照用例 1 跑会漏判定器，且判定器有哪些没写。
- 改后：「怎么验证？」加一张九行判定器表：`ORACLE-C07-TCR`、`ORACLE-PAGE-AUDIT-DOC`、`ORACLE-ACCEPT-PLAN`、
  `ORACLE-N11-CRITERIA-LOCK`、`ORACLE-N11-WRITESET-DIFF`、`ORACLE-N11-ACCEPT-SCOPE`、`ORACLE-N11-ASSET-FIRST`、
  `ORACLE-N11-SKIP-VISIBLE`、`ORACLE-N11-TIER-MINIMAL`，每行给承载文件与具名块；
  并写「按文件是四个、按判定器是九个」「`ORACLE-EFFECT-BLIND` 是本 Phase 判答卷的判定器，不参与 B 全绿」；
  用例 1 改为「对 B 跑 P11 的四文件门禁（命令见「怎么验证？」），并核表列九个判定器全部通过」。

## 3. 「A/B 原件用后删除」与「保留」互斥

- 改前：L79–81 同一段里并列「A/B 各放隔离 worktree；…临时 worktree 用后删除；A/B 原件、失败输出、答卷、消费者记录保留，不删不改。」
  原件是否就是那批 worktree、删前是否另存，没有写。
- 改后：只留一种规则：「A/B 所在目录随原件一并保留，不删除、不覆写；只关闭其中启动的服务」；
  头部「两处都保留，不删不覆写」；「临时 worktree 用后删除」整句已删。

## 4. 判定者要答超出输入的问题

- 改前：L93「判定者只读验收、原始需求与 A/B」，L95 却要求答卷必填「门禁为何区分不了」。
  判定者读不到门禁输出，答不出这一问。
- 改后：判据加「判定者可读门禁命令与原始输出（不含 A/B 标签），答卷必须写出这一问；实验设计者不再另答」；
  用例 2「判定者只读验收、原始需求、A/B、门禁命令与原始输出（不含标签），先写「用户应看到什么」「哪类错必须被拒绝」和「门禁为何区分不了」，再标 A/B 并写理由」；
  边界「只按原判据读真实产出（含门禁命令与原始输出，不含标签）」。
