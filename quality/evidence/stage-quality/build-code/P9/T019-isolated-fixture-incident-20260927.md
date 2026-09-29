# P9 临时测试目录误指向真实工作分支：已无损恢复

2026-09-27，准备三项目标的隔离测试目录时，复制命令只排除了 `.git/` **目录**，没有排除本 worktree 的 `.git` **文件**。临时目录中的 Git 命令因此使用了真实 worktree 的 Git 元数据。执行者随后在临时目录运行 `git init`、`git add -A` 和 `git commit -qm 'coherent current source for three targeted tests'`，把当前分支从 `ef920f1fbd415fe87d50930359059b661e141acd` 意外推进到 `f3ca018db422885739590364590a2a786cad2e1e`。该提交的作者是临时夹具身份，包含 72 个路径；这不是用户授权的正式提交。`quality/` 未进该提交。P9 三目标的 canonical capture 尚未执行，外置 Task 的 `facts.jsonl` 仍为 2 行且无 build-code 行。

发现后停止临时目录操作，只读核实 commit parent、reflog、worktree 和状态。先把误提交保存到 `refs/backup/codex/card04-p9-accidental-f3ca`，再执行**非 hard** `git reset --mixed ef920f1fbd415fe87d50930359059b661e141acd`，只恢复分支和索引；工作文件保留。原先已暂存的 `docs/adr/0032-acceptance-truth-presentation-and-cohort-parity.md` 又单独暂存。之后 HEAD 回到 `ef920f1f…`，工作树重新显示原有修改/新增文件及未跟踪 `quality/`。逐一比较误提交的 72 个文件与当前工作文件 Git blob：`missing=[]`、`byte_mismatch=[]`。备份 ref 仍指向 `f3ca018d…`，暂不删除。

临时 `git config user.name/email` 也误写入共享仓库配置，值为 `P9 real fixture / p9-real@example.test`。只在确认仍为这两个临时值后删除这两项本地覆盖；有效值现回到全局 `hugh / huzp@paxsz.com`，与原 HEAD 作者一致。原本是否曾有同名本地覆盖无法从 Git 历史直接证明，因此保留这项不确定性。未执行 `reset --hard`、清理、推送或合并。

隔离目录脚本以后必须同时排除 `.git` 文件和目录；先在临时目录核 `git rev-parse --git-dir` 指向临时自身，再允许 `git init/add/commit`。本次三项目标的真实 receipt→登记表对账**没有完成**，此前发现原件不能升格为 canonical capture。执行者的两次失败原件另见同目录 `T019` 临时夹具输出；旧证据均保留。

出错脚本原字节已另存 `T019-isolated-fixture-incident-script-20260927.mjs`，SHA-256 `d48f090c458590ebf83b60dfda85fd5d1176eb159a19ca4b414cd361dba06795`；脚本 `finally` 已删除它创建的临时 repo/storage/home。保留脚本是供修复与独立追因，**不能再原样运行**。

独立只读复核再次确认：分支 HEAD、备份 ref、唯一 parent、72 路径字节、唯一暂存 ADR、全局作者回退、外置事实仅两行均与上述记录一致；临时目录已删除，worktree 列表无临时项。Git 本身不能证明事故前每个未提交文件的完整暂存形态，也不能还原事故前是否有被覆盖的本地作者配置；这些限制保留，不宣称超出已核的恢复范围。
