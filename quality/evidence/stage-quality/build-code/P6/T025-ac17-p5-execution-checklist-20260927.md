# AC-17 / P5-T008 受限实施准备（未运行）

状态：**脚本和挂载方案待独立审查；未启动 Docker 或 Codex，未修改 P5 生产代码。** 样例是当前 CARD-04 的 P5/T008 私有同次来源生产者，允许修改的生产文件仅 `runtime/stage/stage-runner.mjs`。本方案不把夹具测试绿当作真实 CARD-04 P5 阶段完成、独立审查或 CLI stdout 原字节证明。

## 冻结与宿主准备

P5 owner 的 v3 冻结原件位于外置 CARD-04 Task store 的 `quality/evidence/stage-quality/build-code/P5/T008-same-run-source-red-v3-20260927/`：`meta.json` 的 `source_files_sha256_after_red` 记录测试 SHA-256 `02401cec5c2c7c288f8e33d72369b80c5749dd152b21e6f151e8c6935b88259b`、P5 材料 SHA-256 `ef796c575da42099d224ef05bc485f0a92fbb2aadcedfd4863f2efc4cc014004`、另外三个关键源码/材料 SHA，另有 HEAD/tree、完整 `git status --short` 原件与原始 `2 pass / 1 target fail`。RED 是真实 `runOfficialStage` 夹具运行后的 `report-facts.json` 缺失；不是 import/setup 失败。新版测试还要求本次分析器看到的逐条验收链与落盘原件相同、最终阶段结果逐字对象相同、Task/worktree/branch/快照及三个收据原始哈希匹配。它仍用模拟的 P5 审查，未测真实 CARD-04 同版审查、写入中断和被改坏的原件读回。

执行准备脚本前，独立核对 v3 `meta.json`、`frozen-target.test.mjs`、当前测试三者同字节，生产 `stage-runner.mjs` 尚是 RED 前 SHA `defe0343739b1df8182a0fba3d281eb98f11d545fb74742ccd87f04935b52e74`。准备入口只从认证 worktree CWD 调用：

```sh
node quality/evidence/stage-quality/build-code/P6/T025-ac17-host-prep-20260927.mjs prepare /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-04-20260919/quality/evidence/stage-quality/build-code/P5/T008-same-run-source-red-v3-20260927/meta.json
```

脚本只读原 worktree/Task，复制到唯一 `/private/tmp/card04-ac17-p5-*/src`；保留准备清单于同一临时根的 `out/prepared.json` 和 `out/source-before.json`，不自动删除。它排除所有 `.git` 文件/目录、`tests`/`*.test.*`、`quality`、`node_modules`、历史归档、隐藏会话目录及 symlink；冻结测试另放 `oracle/` 并生成私有 Git blob（直接写 Git 对象格式，**无 `git init/add/commit`**）。复制前后核当前 `git status --short` 与冻结记录完全相同，核五个已列文件的 SHA；复制时从同一份读取的字节写入并重新读取校验，完整源码视图清单逐文件比对。冻结 RED **只提供五个文件的字节哈希**，未认证当时每个其他 dirty/untracked 文件的字节；当前完整清单是准备时快照，不冒充 RED 时完整快照。宿主 `test ... before` 在这份确切清单上重新取得有效 RED；此后只允许 `stage-runner.mjs` 改变。若源变动，停止并保留失败临时树，不沿用旧 RED。

宿主在容器启动**之前**用准备清单对复制源码跑同一冻结目标：

```sh
node quality/evidence/stage-quality/build-code/P6/T025-ac17-host-prep-20260927.mjs test /private/tmp/card04-ac17-p5-<实际随机值>/out/prepared.json before
```

脚本暂时把冻结测试原字节与依赖链接放入 `src/` 供宿主 Vitest 运行，`finally` 移除；然后复核 `src/` 没有测试、`.git`、`quality` 或依赖链接。before 必须是 3 项中 2 pass、同次来源目标断言 RED，原始 stdout/stderr、exit、测试 SHA、材料/源码 SHA 留在 P6/T025 证据目录。缺文件/导入/0 tests/错身份不能算 RED。**宿主跑测试时不能有任何实施容器挂着这份 `src/`。**

## 容器挂载与固定 argv 草案

以下 `<src>`、`<oracle>` 均取准备清单里的真实绝对路径；`<auth-file>` 是宿主单独准备的最小只读认证文件，**不属于**源码、oracle、临时 `out/` 或 Task store，不写进清单、不输出内容。两个模式各自从同一冻结源另跑一次 `prepare`，用新容器、新 `CODEX_HOME`、新 Codex 临时会话；不能让隐藏模式继承只读模式看到的测试、对话或已改源码。容器镜像固定 ID `sha256:38c8b386e738307326e9371c83d0948f3574613b34d67d75c1a50ddd3e923b54`，网络只能 `card04-ac17-inner`，代理须已按 v4 原件启动；**不用普通 bridge**。

生命周期固定为 **`docker create` → 宿主脚本 `audit ... before` 核真实 inspect → `docker start -ai` 的 stdout/stderr 只落权限 0600 本地文件 → 宿主脚本 `audit ... after` 核这两份输出及 Docker logs、退出状态、inspect → 独立审查后才 `docker rm`**。不要用 `docker run --rm`，否则退出即丢失可核容器身份。绝不把 `docker start -ai` 的原始输出直接显示在对话或终端；`after` 检查通过后才显示审计单路径与安全摘要。`audit` 只调用 Docker 只读 `inspect`/`logs`，会机器核内部网络 `Internal=true` 且实施容器实际只连 `card04-ac17-inner`、`Privileged=false`、无 `CapAdd`/设备、v4 网关正在运行且位于 bridge+内部网、网关实际挂载脚本 SHA、镜像 ID、容器 argv/挂载/隔离参数、认证文件不在源码/输出/Task 根、认证值不在源码、宿主输出及 Docker logs；审计文件只保存核验结果和输出 hash，不打印认证值。若认证值出现在输出则不发布原始日志，立即停用该认证，保留受限临时文件供事故审查。

只读模式（源码可写，oracle 单独只读挂载）：

```text
docker create -i --name <unique-ac17-ro> --network card04-ac17-inner --read-only --cap-drop ALL --security-opt no-new-privileges --tmpfs /tmp:rw,exec,nosuid,size=64m --tmpfs /home/node:rw,nosuid,size=64m --mount type=bind,source=<src>,target=/workspace --mount type=bind,source=<oracle>,target=/oracle,readonly --mount type=bind,source=<auth-file>,target=/tmp/auth.json,readonly --env CODEX_HOME=/tmp --env HOME=/home/node --env HTTPS_PROXY=http://card04-ac17-gateway-v4:8080 --env HTTP_PROXY=http://card04-ac17-gateway-v4:8080 --env ALL_PROXY=http://card04-ac17-gateway-v4:8080 --env NO_PROXY= sha256:38c8b386e738307326e9371c83d0948f3574613b34d67d75c1a50ddd3e923b54 codex --no-daemon -C /workspace -s danger-full-access -a never exec --ephemeral --skip-git-repo-check --ignore-user-config -
```

隐藏模式：**整条 argv 只删除 `--mount type=bind,source=<oracle>,target=/oracle,readonly` 这组参数，另用唯一 `<unique-ac17-hidden>` 名称**。`/workspace` 没有冻结测试、Git 对象、Task store、原 worktree、历史会话或认证原件；不挂 Docker socket、宿主项目根、HOME、`node_modules`。实施提示只含 P5 需求和允许改 `stage-runner.mjs`，不含测试源码、断言原文或 oracle 路径内容。标准输出/错误与退出码由宿主独立保存；不得在日志写 auth 值。

`create` 返回后，宿主先在准备清单的 `out/` 建 `<container-name>.prompt.txt`（0600，只写 P5 任务、允许写文件、禁止测试内容）。执行 `node .../T025-ac17-host-prep-20260927.mjs audit <prepared.json> <container-name> ro|hidden before`，机器核提示字节不含完整测试和认证值、真实挂载/网卡/权限，失败不准启动。之后用以下形式启动，`<out>` 是准备清单的私有 `out/`；不要用 `tee`、终端直连输出或把原始日志贴到对话：

```sh
umask 077
docker start -ai "$AC17_NAME" < "$AC17_OUT/$AC17_NAME.prompt.txt" > "$AC17_OUT/$AC17_NAME.stdout.raw" 2> "$AC17_OUT/$AC17_NAME.stderr.raw"
code=$?
printf '%s\n' "$code" > "$AC17_OUT/$AC17_NAME.docker-start.exit"
```

**容器退出后先不删除**，执行同一 `audit` 命令但末尾为 `after`。它要求三个输出文件均为独立常规文件、mode 0600，核 Docker CLI exit 与 inspect 中容器 exit 一致，逐字扫描认证值，最后才把安全原始 Docker logs 保存到 Task T025 证据目录并输出审计路径。独立复核前保留容器、重定向原件与临时目录。

## 必须由真实 Codex 进程及其子进程验证

- **只读**：`cat /oracle/p5-same-run-report-source.test.mjs` 成功；对其 append/覆盖、`chmod`、文件及上层目录改名、经 symlink 改写均非零。宿主同时读回测试 SHA 不变。`git --git-dir=/oracle/private-git cat-file -p <oracle_blob_oid>` 应能读到同字节；Git 写负控须用 `printf 'AC17_NEW_GIT_BLOB_<本轮随机值>' | git --git-dir=/oracle/private-git hash-object -w --stdin` 写**全新** blob 并失败，不能对已存在的测试 blob 重写来冒充写入验证。这也是隐藏模式 Git 不可读负控的宿主正控。
- **隐藏**：直接路径、`/oracle` 别名、预置复制/软硬链接、`git --git-dir=/oracle/private-git cat-file -p <oracle_blob_oid>` 及原 worktree 的 Git 对象路径均读不到冻结测试。宿主事先证明 oracle 文件和私有 blob 实在存在。子进程重复读写负控。若 `src` 出现测试副本，立即失败。
- **网络**：宿主哨兵服务在容器前后均读得到 oracle；实施容器直连宿主、借代理访问宿主与探测本机服务均拿不到哨兵；真实模型请求能完成。v4 的既有负控只覆盖已测路由：CONNECT 放行后 TLS 预检和实际隧道是两条连接，不能声称所有 SNI/明文绕路已被封死。若真实容器出现新绕路或必须改用 bridge 才可用，停止。

Codex 退出后先验证 `src/` 中唯一变化为 `runtime/stage/stage-runner.mjs`，测试/材料 SHA 仍同冻结原件；再在**无容器挂载时**调用上述 `test ... after`。后测必须同字节 3/3 GREEN，且另作故意坏来源/错 Task/错快照/原件篡改的独立负控与 T007/P6 相邻测试。两种模式的结果分别保留，不能把只读模式的 GREEN 借给隐藏模式。

独立审查须读原始容器 argv/inspect、进程身份和挂载、代理日志、读写/隐藏/Git/网络负控、前后源码清单和 diff、冻结测试 SHA、before/after runner 全身份/原始输出/exit/hash、实际 Task/材料/快照，以及真实 P5 独立审查原件。其后才由宿主决定是否将受限源码补丁应用回 CARD-04 工作树；这份脚本不会自动应用，也不会给 AC-17/18、T008 或全卡签通过。
