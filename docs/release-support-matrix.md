# 发布支持矩阵（WorkflowHub 1.0.0）

本文件给发布维护者、独立安装检查者和 README 作者。它只回答“当前 1.0.0 发布物支持什么、验证到哪”，不复制外部工具的固定输入；外部工具/路线的版本、正反例与未知一律读[外部工具兼容矩阵](external-skills-compat-matrix.md)与[external-skills.manifest.json](../external-skills.manifest.json)。

## 发布形状

| 角色 | 相对 releaseRoot | 事实 |
| --- | --- | --- |
| releaseRoot | `.` | `node tools/cli/build-release.mjs --output=<绝对空目录>` 的组合交付根；不是 strict skillBundleRoot |
| 标准技能包 | `skill-bundle/` | 现 `buildSkillBundleRelease` 原产物；由 `validateSkillBundleRelease` 只读校验，含 `skill-bundle/skill-bundle.json` |
| Runner/安装后 packageRoot | `runner/` | 现 `buildRunnerRelease` 原产物；`installRunnerRelease({releaseRoot: runner, skillBundleRoot: skill-bundle})` 内嵌 bundle 并做 npm/Git 副作用 |
| 外层使用物 | `README.md`、两类清单、两份矩阵 | 固定白名单；不进两个标准内层根 |
| 外层接入入口 | `tools/cli/onboard-release.mjs` | 只建宿主技能链接和按需补配置；不调用安装器、不跑 npm/Git |
| 外层版本模块 | `runner/runtime/distribution/update-check.mjs` | Node 内建模块薄比较；由外层接入入口经声明的 runtime 根加载 |
| 宿主适配链接 | `.claude/skills`、`.agents/skills` | 均为 `../runner/skills`；只在本包内，安装后才可被宿主消费 |
| 安装态支持文件 | `release.json` 的 `installed_support_files` | 便携阶段解析实际读取、但不在两个标准根声明内的文件（含 `runner/skills/catalog.yaml`） |

版本 1.0.0 同源落盘于源码仓 `package.json`、`package-lock.json`（根与 `packages[""]`，不随包分发）与发布包 `release.json`、`runner/package.json`、`runner/runner-release.json`。更新检查只有三态：有更新、无更新、无法检查；无明确来源就报无法检查，不联网、不猜。

安装与卸载边界：安装会执行 `npm ci --ignore-scripts --omit=dev` 与 Git init/add/commit，需要 npm、git 和隔离目标授权。P5 已在隔离临时根真实执行一次安装（本地 npm 缓存离线）并复跑安装态自检；其它机器、npm 源与离线缓存状态不在本次结论内。发布包不是整树证据，原始命令与负例输出在任务库。

## 安装态覆盖域

| 项 | 当前事实 |
| --- | --- |
| 无参聚合自检 | 裸 `runner` + `skill-bundle` 安装根实测 exit 0（任务库 447）；完整 `buildRelease` 根实测 exit 0，`skill-static-deps` 通过（任务库 448） |
| 随包门禁检查器 | `check-anti-host`、`check-stage-quality` 进失败清单；删除任一后同一命令 exit 1 并点名，恢复同字节后 exit 0（本机实测 `check-anti-host`） |
| 源码登记检查 | 裸安装根不带 `skills/catalog.yaml`，两项打印具名 `NOT RUN`，不计失败；完整 `buildRelease` 把 catalog 复制进 `runner/`，且发布构建按 catalog 收齐非 retired 技能，两项真实运行并通过（任务库 448）。`check-skill-consistency` 保留报告级警告，不作为派发授权 |
| advisory | `check-decision-log-chain` 只打印 advisory 警告，失败不进聚合失败清单 |
| 数据依赖 | `runtime/review/schemas/result.schema.json`、`stage-materials.schema.json`、`runtime/schemas/skill-bundle.schema.json` 等显式数据依赖随包；`attempt.schema.json` 不在包内 |
| 四个文档命令 | `check-delivery-claims`、`check-specs-archive`、`check-replay`、`measure-main-agent-cost` 在运行器根可调用；正常例需要任务或案例输入，缺输入时命令自行报缺并保持原退出码，不以清单存在代替调用 |
| 七类公共入口 | 完整发布根实测：doctor/status/verify/confirm/authorize 正常例 exit 0；review 无 provider 时正常命令 exit 0 且结果为 unavailable；run 的 phase_progress 夹具未形成合法 Phase 任务卡（具名夹具缺口，非命令缺口）。七个非法 action 均 exit 1 并报 `unknown public runtime action`（任务库 439） |
| 计划卡命令表缺口 | P5 表里 `doctor` 缺 `--stage`、`run --stage=build-plan` 不受支持（run:execute 只接 build-code 游标）、`authorize` 缺 `--subject-ref`；owner=计划卡，按真实参数复跑，不照抄错命令 |

## 宿主支持

| 宿主/入口 | 当前声明 | 已验证 | 未验证 |
| --- | --- | --- | --- |
| Node | `>=24`（`engines` 未声明，按 build-code 合同与 `precheck` 的 node 检查） | 本机 `process.versions.node` 24.14.0 | 其它 24.x 行为 |
| Claude Code | `.claude/skills` → `runner/skills`；`claude --version` 2.1.322 | P2 接入合同（check/dry-run/apply/二次 no-op、冲突/断链保护） | 真实宿主发现与调用、字体/页面；P6 观察 |
| Codex CLI | `.agents/skills` → `runner/skills`；`codex --version` codex-cli 0.166.0 | 同上 | 同上 |
| 其它宿主 | 未声明 | — | 不在 1.0.0 支持范围 |
| Windows | 未声明 | — | 不在 1.0.0 支持范围 |

## 工具支持

| 工具 | 档位 | 1.0.0 声明 |
| --- | --- | --- |
| open-code-review (`ocr`) | 审查必须 | 下限 1.12.9；本机 1.13.10 实读；低于下限或探针失败按 `not_installed`/`unavailable` 报告 |
| 3rd-review provider 路由 | 审查必须（所选路线） | provider 定义与账号归 3rd-review 配置；路由缺 provider ID/可执行即明确缺失；不换默认 provider |
| Ego (`ego-browser`) | 浏览器动作必须 | 本机只读元数据 0.6.2.9/guide 2.2.0；catalog 记 0.6.0.16（旧，owner=catalog 维护者，不改）；官方样例 0.6.3.6 只作来源。三者分列不合并，真实支持区间/真实不兼容 release 未取得，保 unknown |
| anysearch | 搜索动作必须 | 固定 commit 的 CLI 合同正反已判；真实服务效果与 key/权限/环境分别报告 |
| npm / git | 安装动作必须 | 只在真实安装时探测；接入命令本身不需要 |
| agent-browser / browser-use | 可选 | 按现网关条件，仅人工诊断/规定回退，不冒已测 |

## 版本与兼容结论边界

- 1.0.0 只表示本仓当前发布版本；不表示外部工具的支持区间。
- 外部工具矩阵不含“官方样例推广成 `>=`”，也不含缺 key/401/不可达冒充的版本负例；未知项逐条保留，owner 与恢复条件见矩阵。
- 真实 Ego 版本完整生命周期、真实 finish 原回执、付费文档抽取与真实远端发布均未取得；本段不声明这些通过。
- 权利沿个人研究范围，全部外部条目 rights=unknown；catalog 中的许可声明不是本次版本的 grant。

## 消费者

- README 作者（P5）：从本文件取安装/接入/工具前置与限制，从兼容矩阵取外部工具事实，不另写第二套。
- 最终安装验证者（P6）：按本文件的双根、安装参数与宿主链接复核最终包；现实装与真实业务结果仍由 P6 取得。
