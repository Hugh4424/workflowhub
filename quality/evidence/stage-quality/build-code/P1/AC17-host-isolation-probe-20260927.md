# AC-17 本机隔离探针（未验收）

## 结论

本机 `/usr/bin/sandbox-exec` 对**事先启动的临时子进程**可限制文件读写。只读样本能读独立测试目录，但写、`chmod`、改名失败；隐藏样本能读写工作目录，但直接读独立测试目录、经 Git blob 读取、改名测试目录和子进程再读均失败。**这不是 AC-17 通过**：当前实现者已在未隔离会话内运行，没有受控实现者启动器、测试目录分离、正式任务样本或宿主执行记录。

`sandbox-exec` 的系统手册明确标记为 `DEPRECATED`。本探针只能说明这台 Mac 的受限子进程有候选机制，不能保证长期可用，亦未证明真实 Codex/Claude 实现者可在此 profile 下运行或不能借外部未隔离服务取数。宿主/执行器负责人须解决启动、环境与证据绑定；不能用文件 `0444`、同一 worktree 或本 shell 探针代替。

## 环境与样本

- macOS Darwin 25.5.0，arm64；用户 `Hugh`，UID 502；`sandbox-exec=/usr/bin/sandbox-exec`；真实 Git 二进制 `/Library/Developer/CommandLineTools/usr/bin/git`。
- 仅在 `/tmp/card04-ac17-sandbox.3WTn76` 自建样本；物理路径 `/private/tmp/card04-ac17-sandbox.3WTn76`。`vault/hidden-repo` 内为自建 `secret-test.txt` 和自建 Git blob，`workspace/source.txt` 为可编辑样本。未读取项目机密、未改仓库代码或 Task store。
- 先在宿主（沙箱外）确认 Git 正控：`git --git-dir="$R/vault/hidden-repo/.git" cat-file -p "$BLOB"` 输出 `hidden-test-sample-AC17`，exit 0。`BLOB` 是该自建样本 `HEAD:secret-test.txt` 的哈希。

## 实测命令与结果

以下 `$R=/private/tmp/card04-ac17-sandbox.3WTn76`，调用形式均为 `sandbox-exec -p "$PROFILE" /bin/bash -c '<操作>'`。被测操作逐条打印自身 exit code；包装 shell 为收集全部结果而最终 exit 0，不把包装 exit 当作操作通过。

| 模式 | `PROFILE` | 样本操作与实际结果 |
|---|---|---|
| 只读 | `(version 1)(deny default)(allow process*)(allow file-read*)(allow file-write* (subpath "$R/workspace"))(allow file-write* (literal "/dev/null"))` | `cat vault/.../secret-test.txt` exit 0；`printf altered >>` 测试文件 exit 1；`chmod 600` exit 1；`mv` 测试文件到 workspace exit 1；`mv vault vault-renamed` exit 1；写 workspace exit 0；测试文件事后大小仍 24 字节、权限仍 `-rw-r--r--`。符号链接指向测试文件后，写与 `chmod` 均 exit 1；创建指向测试文件的硬链接 exit 1。 |
| 隐藏 | `(version 1)(deny default)(allow process*)(allow file-read* (require-not (subpath "$R/vault")))(allow file-write* (subpath "$R/workspace"))(allow file-write* (literal "/dev/null"))` | 读、写 workspace 均 exit 0；`cat vault/.../secret-test.txt` exit 1 `Operation not permitted`；`/Library/Developer/CommandLineTools/usr/bin/git --git-dir="$R/vault/hidden-repo/.git" cat-file -p "$BLOB"` exit 128 `not a git repository`（宿主正控 exit 0）；`mv vault vault-renamed` exit 1；受限子 `bash` 再 `cat` 测试文件 exit 1；受限进程内再执行 `sandbox-exec -p '(version 1)(allow default)'` 放宽规则，`sandbox_apply` exit 71 `Operation not permitted`。 |

两次失败尝试保留为设计警示：用 `/tmp/...` 而非解析后的 `/private/tmp/...` 写 path filter 时，所谓禁止写入实际允许 `write/chmod/rename`（均 exit 0）；仅 deny 原测试文件和 `.git` 的路径黑名单时，受限进程 `mv repo repo-renamed` exit 0，随后读改名后的测试文件 exit 0。因此必须以规范物理路径、独立测试根目录、默认禁止再精确放行为起点；同一可编辑仓库中的隐藏测试不能只靠文件名黑名单。独立测试目录内的 Git 对象亦须同样隔离；不能让实现者通过原仓库 `.git` 取回隐藏测试。

## 宿主负责人待办

1. 在实现者进程**启动前**，创建与可编辑源码分离的独立测试目录；隐藏模式交付不含测试及其 Git 对象的源码视图；只读模式允许读测试但拒绝更改测试目录及上层目录。独立宿主进程持有测试、执行判定与原件。
2. 对真实实现者做先启动再验证的样本任务，核准模型连接、必要工具、可编辑目录和子进程继承；检查是否能经未隔离服务、别名路径、Git 对象或同 UID 外部进程绕过。`sandbox-exec` 已弃用，长期机制须由宿主负责人选定并维护。
3. 保存启动命令、profile、真实路径、进程/用户身份、正控与负控命令及退出码、测试文件前后哈希、独立判定者输出；再把这些证据绑定到真实任务与材料版本。没有这些事实，AC-17 保持 `incomplete`。
