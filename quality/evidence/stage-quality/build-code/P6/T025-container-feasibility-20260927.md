# T025 容器隔离可行性（尚未验收真实任务）

macOS `sandbox-exec` 的真实 Codex CLI 不能初始化；本轮改用本机已安装的 Docker Desktop。镜像 `workflowhub-ac17-codex:local` ID 为 `sha256:38c8b386e738307326e9371c83d0948f3574613b34d67d75c1a50ddd3e923b54`，由同目录 `T025-container-Dockerfile-20260927.txt` 构建，含 Linux Node 与 `codex-cli 0.157.0`。容器以普通 `node` 用户、只读根文件系统、全部 Linux capabilities 移除、`no-new-privileges` 运行；认证文件仅只读挂载在临时 `/tmp/auth.json`，未打印、未复制进镜像，任务源码和测试均未挂载于模型连通性探针。

先用普通 Docker bridge 测本机只读哨兵服务，容器确实能读到 `AC17_ORACLE_SENTINEL`；因此普通 bridge **不合格**。随后创建 `card04-ac17-inner` 内部网络（`Internal=true`），让模型容器只在该网内；另有一个不挂载任务文件的双网代理，仅允许到 `chatgpt.com`、`api.openai.com`、`auth.openai.com` 的 443 CONNECT。代理脚本原件为 `T025-container-proxy-20260927.mjs`（SHA-256 `7d00a8b5a288992df1d49f8a68255534ded1e4a3a314e040408c79bef72fb490`）。内网容器直接读本机哨兵域名失败 `EAI_AGAIN`，直接读已知本机网关 `172.29.0.254:48173` 失败 `ENETUNREACH`；借代理请求 `host.docker.internal:48173` 返回 `403`。代理日志 `T025-container-gateway-20260927.log` 保留放行/拒绝的主机名，不含认证值。

同一内网+代理下，真实 Codex CLI 收到简单 `READY` 请求并返回 `READY`，exit 0；原始 stdout/stderr、起止时间、脱敏 argv、哈希在 `T025-container-proxy-probe-20260927.*`。stderr 有模型列表刷新超时和部分非必要域名被代理拒绝，不能据此说所有模型功能已验证。普通 bridge 的连通性探针原件在 `T025-container-cli-probe-20260927.*`，只说明模型能连，不证明隔离。

文件限制另在临时 synthetic oracle 验证：**隐藏模式**只挂可写源码，不挂 oracle、原仓库或 Task store；直接读测试/原仓库为 `ENOENT`，经 oracle Git blob 读为 exit 128，本机哨兵服务为 `ENETUNREACH`，源码可写。**只读模式**把独立 oracle 目录只读挂载：可读文件和 Git blob；append、chmod、改名目录/文件、经源码软链接写入分别为 `EROFS`/`EXDEV` 等非零，宿主哨兵内容未变。容器不挂 Docker socket；两个模式的子进程继承容器边界。

**结论：这只是宿主可行性。** 尚未在容器内启动真实实施者修改认证 Task 的源码，也没有冻结测试的改前 RED、改后 GREEN、源码/材料/测试同版绑定和独立审查；AC-17/T025 仍 `incomplete`。后续真实样例必须在源码镜像中排除 `.git` 文件和目录、测试、外置 Task store 与历史会话，先核镜像真实路径和哈希；实施者只接触允许目录，宿主外独立 runner 持有冻结测试。普通 bridge 的本机服务绕路已证明可用，**绝不能**用于正式样例。

### 后续网络规则试验（仍不是验收）

独立复核指出第一版代理只看 CONNECT 域名，未核最终 IP。第三版加入公网 IP 过滤后，这台主机的 Clash DNS 把 `chatgpt.com` 解析为 `198.18.0.14`，规则将其拒绝，真实模型调用 exit 1；原件在 `T025-container-proxy-v3-probe-20260927.*`。第四版仅接受精确允许域名解析到本机使用的 `198.18/15` 假地址，并先对同一数值地址以该域名做独立 TLS 证书核验；模型再次答 `READY`、exit 0，原件在 `T025-container-proxy-v4-probe-20260927.*`，代理源码 `T025-container-proxy-v4-20260927.mjs` SHA-256 `357da154a4f55a210073d54e091ed7a27c737341ab7e52d0919eb3bd3185c627`，日志 `T025-container-gateway-v4-20260927.log`。第三版 DNS 改为受控私网地址的独立反例返回 403。第四版的证书预检与真实隧道是两条连接，隧道仍可发送非 TLS/不同 SNI；DNS 与出口路线是否由 Clash 强制代理也未独立证明，不能称本机服务绕路已全面封死，更不能称 AC-17 通过。独立审查仅同意继续限界探针。

第四版又保存四个逐命令负控原件 `T025-container-v4-{direct-host-negative,blocked-host-proxy-negative,plaintext-negative,wrong-sni-negative}-20260927.*`：容器直连本机网关为 `ENETUNREACH`，向代理申请本机服务返回 403；借已放行的 `chatgpt.com:443` 隧道发送明文 HTTP 没读到 oracle 哨兵且连接被关闭，改用错误 SNI 的 TLS 连接收到 `ECONNRESET`。四个脚本、stdout/stderr、exit、起止时间和 SHA-256 均保留。它们是已测路径的失败控制，不覆盖所有宿主公网接口或 Clash 出口策略，也不构成真实实施 Task 的证据。

独立复核又指出上述四份 meta 没绑定完整 Docker argv/网络/挂载，也未在同一时段记录宿主哨兵正控。补跑同四个**限界探针**的 `T025-container-v4-bound-negatives-20260927.json` 记录每项完整 argv、镜像 ID、内部网络及代理双网配置、脚本/输出 hash、时间，并在四项前后从宿主读取同一哨兵（两次 HTTP 200 且内容确实存在）；四项结果与前次相同，代理当次日志存 `T025-container-gateway-v4-bound-20260927.log`。错误 SNI 是代理先允许 CONNECT、随后 TLS 连接被重置，**不是**代理自己拒绝了 SNI；明文也是上游关闭、未拿到哨兵，不可扩大为代理对所有非 TLS 字节有校验。
