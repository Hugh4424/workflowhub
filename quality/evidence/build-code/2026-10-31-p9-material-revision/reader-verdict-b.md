# 独立读者判读 B（fresh context，2026-10-31）

## 第 1 节 三问

### 1. 下一步做什么、在哪做、跑什么：不能。

主体动作能说清：
- 在 `<材料根>/phases/P11-去字面断言.md` 的「这一 Phase 怎么验收？」七槽落验收，在 `<材料根>/spec.md` Appendix A 加 AC-EFFECT-001 的 P1 行；owner=build-plan，不改产品代码、测试与断言（L163-170）。
- 环境：本机认证 worktree，HEAD `48a15f02`，开工前核 `git status`；A/B 放仓外隔离 worktree（L13、L84-86）。

能跑的两条命令：
- 材料门禁：`node /Users/Hugh/Hugh/Project/workflowhub/tools/cli/run-checks.mjs --material-root .../specs/workflowhub-ui-frontend-c07-real-page-verification-20261028`；看到退出 0、`phase_count=12 task_count=36 errors=0`、`ALL CHECKS PASSED`（L200-202）。
- 试点 Phase 门禁：`node node_modules/vitest/vitest.mjs run` 四个 contract 测试文件；看到 `Test Files 4 passed (4)`、`Tests 145 passed (145)`（L203-205）。

只能人读的也说清了读什么：用例 2 答卷先写「用户应看到什么」「哪类错必须被拒绝」「门禁为何区分不了」，再标 A/B（L106-108）；用例 3 消费者记录、用例 4 拆封记录（L109-114）。

说不清的：「B 全绿」要求「表列九个判定器各有具名通过项」（L102-104），但 `ORACLE-C07-TCR` 的承载写作「`phases/P11-去字面断言.md` 机器字段 `oracle`」（L211），没有可跑的文件或命令，材料只另给一条四文件门禁。A 由实现者提供、B 由红队造、标签由第三方编号（L90），但建 worktree、造 B、封包都没有步骤，盲包格式与哈希算法未写，退回「手工复制、随机编号、第三方封存」（L227）。要看具名块还得自己补 `--reporter=verbose`（L104，门禁命令 L204 未带）。

### 2. 需要自己裁断的矛盾：有。

- 判定器落点：L211「`ORACLE-C07-TCR`｜`phases/P11-去字面断言.md` 机器字段 `oracle`」与 L221「本表把四个文件里的九个具名判定器块逐条列出」互不相容。材料没写取哪个，而「B 全绿」（L51、L222）依赖它：要么认定四文件跑动已覆盖它，要么另找入口（材料没给）。
- 用户在场：L40「是否需用户在场未定」，L88「盲判本身不需要用户在场」，L87 又留「若该 Phase 依赖真实外部服务或页面，按原条件执行并写明用户是否在场」。盲判不用用户是明的，消费者那一次要不要、谁提供，未写也未给 owner。

已裁断、不算要我自己定罪：P1 是验收行号、P11 是 Phase 编号（L12）；「门禁为何区分不了」由判定者答、实验设计者不另答（L54）；盲包脚本未提供记 unknown、owner=任务 1 执行者（L227）；语义判定只记 `只能人读`（L115、L228-229）；判定者/红队/消费者名字未定、owner=主会话派发时填（L39）；四文件与九具名块的数量差由 L221-222 自解（但与 L211 仍冲突，见上条）。

### 3. 不回头问作者能否做完：不能。

必须问三件：
- `ORACLE-C07-TCR` 在哪跑、看哪段输出算「具名通过项」（L211 与 L221 冲突）；
- 消费者那次是否需要用户在场、由谁提供（L40，无 owner）；
- 试点 Phase 的 A 现在有没有、P11 未实施时由谁先做（材料只写 L90「A 由实现者提供」，无现状与无 A 时的恢复条件）。

人名与盲包脚本虽 unknown，但给了 owner（L39、L227），按指令不算问作者。

## 第 2 节 覆盖范围

读了 `phase-fragment.md` 全文 277 行、`original-need.md`（R-001 逐字）、`reader-instruction.md`。没读 README、旧 verdict、原件目录、`specs/`、git 历史，没跑命令、没问作者：指令限定，且本次判「未参与者能否照做」，不判路径真伪。`R-PILOT-001`（`stageFor`）未拿来判本材料。

## 第 3 节 结论

有缺口：第 1、2、3 件——第 1 件缺 `ORACLE-C07-TCR` 的执行入口与 A/B 构造、A 的取得；第 2 件缺该判定器落点与用户在场的取舍；第 3 件因此必须回头问作者。
