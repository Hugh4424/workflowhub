# 主仓校验器整集 — 用对路径之后的真实结果

## 结论

**用主仓的校验器跑当前材料是 exit 0、`errors=0`，材料能过校验。**
先前报的 exit 1 / `errors=100` 是我用了工作树自带的旧版同名文件，
它比主仓落后，会假报 100 条；那份输出留作反例，不当作材料结论。

## 两条命令（差别只在用哪份校验器）

```sh
# 对：主仓校验器（HEAD 87517cc1），跑本工作树的材料
cd /Users/Hugh/Hugh/Project/workflowhub
node tools/cli/run-checks.mjs --material-root <工作树根>/specs/workflowhub-ui-frontend-c07-real-page-verification-20261028

# 错：工作树自带的同名旧版（HEAD 48a15f02 之前），会假报
cd <工作树根>
node tools/cli/run-checks.mjs --material-root <工作树根>/specs/workflowhub-ui-frontend-c07-real-page-verification-20261028
```

| 用的哪份 | 退出码 | 末段 | 原件 |
| --- | --- | --- | --- |
| 主仓 `87517cc1` | **0** | `ALL CHECKS PASSED`，`phase_count=12 task_count=36 errors=0` | `13-run-checks-main-repo.txt` |
| 工作树旧版 | 1 | `material-contract` 失败，`errors=100` | `00-run-checks-worktree-copy-stale.txt` |

- 主仓那份 sha256 `36bbadf502ede59009bce4db23a39d6c11801b0dfc68a88b49edc3168609e052`。
- 旧版那份六次复跑逐字节相同，sha256
  `39a1218e2e5abf5187a37e0ecd88f7eb4afbb8b5e345f680ef55c185c03be079`。
  同字节即同一事实，只留一份。
- 两份的差别不在材料：同一份材料、同一条命令，只是校验器版本不同。

## 旧版为什么假报 100 条（反例说明，不是材料缺陷）

旧版要求 Phase 任务卡写成独立的 `### Tnnn` 并检查 L0/L1/L2，
而 12 个 Phase 卡都用 `### 任务 1：…`；旧版还因此读不到 `覆盖 AC`，
于是连带报 `AC has no executable Phase task coverage: AC-C07-010`。
主仓 `87517cc1` 已改口径，同一份材料 exit 0，所以这批错误不成立。

## 对后面提交的影响

材料按主仓校验器能过。若 CI 用的是工作树那份旧版，会看到 100 条假错，
那是版本问题，不是材料问题；提交前请按主仓路径复核一次。

## 同一类版本差：`check-stage-steps.mjs` 也一样

工作树自带的 `tools/cli/check-stage-steps.mjs`（12136 B）是旧版，
只认 `WPn` 包标题；主仓那份（17304 B，HEAD `87517cc1`）已认中文包标题。
所以 W2 台账改用主仓那份，并显式给 `--material-root` 与 `--repo-root`：

```sh
node /Users/Hugh/Hugh/Project/workflowhub/tools/cli/check-stage-steps.mjs \
  --stage=make-decision --task-path=<任务目录> \
  --material-root=<工作树根>/specs/workflowhub-ui-frontend-c07-real-page-verification-20261028 \
  --repo-root=<工作树根>
```

不给 `--material-root` 时，主仓那份会按 `task.json` 的 target_repo_root
去主仓找本任务的 specs，找不到就报「权威模块集合未取得」。
两条命令的分工：校验器用主仓那份，材料与 steps.json 仍取本工作树。
