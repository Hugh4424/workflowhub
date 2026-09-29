# P6/T025 真实受限实施者启动方案（设计，未验收）

## 当前结论

**T025 / AC-17 仍 incomplete。** 目前只实测过 `sandbox-exec` 对临时 shell 样本的文件限制；没有在沙箱内启动真实 Codex 实施者，没有验证模型连接、同用户未隔离服务绕路，也没有合格的真实行为 Task 样本。P10/T021 的 alpha/beta 是测试自产的合成账户夹具，没有认证业务来源，**不能**用作 T025 样本。待 P5/T008 或 P10 出现有当前材料、真实消费者和独立 oracle 的未实施行为后，再选样本。

本机既有 shell 实测原件：`quality/evidence/stage-quality/build-code/P1/AC17-host-isolation-probe-20260927.md`。它记录临时目录下只读/隐藏、改名、chmod、软/硬链接、Git blob、子进程的操作 exit；还记录 `/tmp` 与 `/private/tmp` 路径别名和黑名单导致的绕过。此原件不能升级为真实实施者通过。

## 已核对的 CLI 能力，仅限帮助输出

本机 `codex-cli 0.157.0`；`/Users/Hugh/.npm-global/bin/codex --help` 实报全局 `--no-daemon`、`-C/--cd`、`-s/--sandbox`（包含 `danger-full-access`）、`-a/--ask-for-approval`（包含 `never`）。`codex exec --help` 实报 `--ephemeral`、`--skip-git-repo-check`、`--ignore-user-config`；参数 `-` 可从 stdin 读 prompt。下面只是一条**帮助输出支持的候选 argv**，未实际调用，不能推断组合、授权、模型网络或安全性有效：

```text
/Users/Hugh/.npm-global/bin/codex --no-daemon -C "$SRC" -s danger-full-access -a never exec --ephemeral --skip-git-repo-check --ignore-user-config -
```

`--no-daemon` 的说明是不用共享后台服务，不能据此推断所有 IPC 均被限制。`--ignore-user-config` 明说认证仍使用 `CODEX_HOME`。`-s danger-full-access` 只用于让**外层宿主沙箱**承担边界；若外层沙箱未先建好，绝不能运行此命令。CLI 入口是指向 `/Users/Hugh/.npm-global/lib/node_modules/@openai/codex/bin/codex.js` 的符号链接，脚本经 `/usr/bin/env node` 启动，本机 Node 为 `/usr/local/bin/node`；正式 profile 要按真实物理路径覆盖 CLI、Node 及其 native binary 依赖。CLI 没有被本次核实为提供测试目录隐藏、网络目的地约束或同 UID 服务隔离的参数；这些必须由宿主实现和实测。

## 宿主准备（未来真实样本）

1. 宿主先认证 Task、Phase、材料版本、当前源码 SHA、冻结测试 SHA 和真实消费者。冻结测试必须先由宿主在旧源码上得到**目标行为 RED**；不能用 import/setup 错误充数。
2. 宿主在规范物理路径 `/private/tmp/card04-ac17-<nonce>/` 下布置彼此分离的 `src/`、`oracle/`、`home/`、`scratch/`、`auth/`、`out/`。`src/` 是从认证快照制作的最小源码视图，可写，但不含测试、`.git`、原始证据、Task store 或其他可回读测试的副本。`oracle/` 由宿主持有冻结测试及其私有 Git 对象；宿主的独立 runner 用**同字节**测试引用 `src/` 代码。`auth/` 只给模型认证所需的最小只读资料，不在结果中打印凭据。所有允许路径先解析为物理路径并记录 manifest/hash。
3. 宿主制作并保留两份完整 `sandbox-exec` profile。两者均默认拒绝，只允许实施所需的进程执行、系统/CLI 读取、对 `src/`、`home/`、`scratch/` 的写入。**只读模式**额外允许读 `oracle/`，但不允许写、改权限或改名 `oracle/` 与上层目录。**隐藏模式**不给 `oracle/`、原仓库、Task store、Codex 历史会话及任何含测试 blob 的 Git 对象读取权；不可先 `allow file-read*` 再仅按文件名黑名单排除。`src/` 不含 `.git`，从而不会通过本地 Git 对象回读测试。不要把 `node_modules` 或原仓库整树作为隐藏模式的宽泛读取例外。
4. 用全新、独立的受限进程运行两种模式，不复用已有未隔离 Codex 会话。宿主从 stdin 送入只含真实需求、源码边界和允许写集的任务说明；实施者的 shell、Node、Git 等子进程继承外层沙箱。宿主捕获进程 PID/UID、profile SHA、完整 argv/env 名称（不含认证值）、stdout/stderr、exit 和产生的源码 diff。

## 必须实测的负控与外部判定

- **只读模式内**：读测试内容应成功；append、覆盖、chmod、文件改名、上层目录改名、Git 工作区改写及继承权限的子进程写入都应非零。仅文件 mode `0444` 或同 UID `chmod` 失败一次不足以证明限制。
- **隐藏模式内**：直接读、经软/硬链接或复制、Git `cat-file`、从原仓库 `HEAD:<test>`、通过继承权限的子进程读都应失败。宿主先在外部证明这些测试和 blob 确实存在且可读，防止“路径不存在”假阴性。
- **服务绕路**：宿主设置只读取临时 oracle 哨兵的本地 TCP/Unix helper，检查受限进程不能连接并让 helper 代读；同时核模型连接能正常完成真实实现任务。网络规则只能在真实连接/IPC 探针通过后定版；不能为修通模型而开放任意本机 socket、共享 daemon 或同 UID 未隔离服务。`sandbox-exec` 已弃用，长期宿主机制及维护责任也须登记。
- **宿主外 oracle**：在独立 runner 用原冻结测试对旧源码采有效 RED，对受限进程产物采 GREEN 与故意破坏后的失败负控；保存完整命令、测试身份、exit、原始输出和源码/材料/测试哈希。前后测试字节必须相同。只有审查通过后，宿主才将受限产物中的源码补丁应用至认证 worktree，并重跑当前快照检查。

任一模式的模型连接失败、profile 需放开未经证实的本机服务、测试副本泄露、真实 Task 不合格或外部 oracle 缺失，均停止并保留 `incomplete` / `unavailable` 原件；不以临时 shell 探针、CLI 参数存在或两份合成测试的绿色代替 AC-17 验收。
