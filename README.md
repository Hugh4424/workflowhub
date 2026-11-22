# workflowhub

给命令行 AI 助手（Claude Code、Codex CLI）复用的开发工作流编排工具：把需求收敛、计划、实施和独立审查按阶段固定下来，并把方法、技能和运行时一起打包。版本以发布根 `release.json` 的 `version` 为准。

支持到哪、哪些还没验证，权威一直在[发布支持矩阵](docs/release-support-matrix.md)和[外部工具兼容矩阵](docs/external-skills-compat-matrix.md)。本文件只**为"能不能开始"列一份关键数字**（版本下限、本机读数、许可状态），不另写一套版本结论，也不与矩阵分叉。

这份文件写给**第一次拿到本项目的人**：照它做能装上、完成宿主接入、跑通一条真实命令；出错时能看懂提示并知道下一步。它同时服务两种入手方式——**源码检出**（能自己构建）和**别人给的发布文件夹**（只能装和接），两种位置的文件差集会逐处写明。

## 这是什么，给谁用

- **谁用**：用 Claude Code 或 Codex CLI 干活的人，想让助手按固定阶段推进一项开发任务。
- **装什么**：两项东西组成一套——**方法**（`workflows/`、`skills/`，Markdown 和脚本）与**运行时**（`runtime/`、`tools/cli/`，Node 模块）。
- **目录职责的唯一事实**是 move-map：源码检出 `docs/architecture/move-map.json`，发布包 `runner/docs/architecture/move-map.json`。

## 前置条件

下面表里的数字只为让你能开始（最低要求、是否满足）；**版本事实、本机读数和边界一律以[发布支持矩阵](docs/release-support-matrix.md)与[外部工具兼容矩阵](docs/external-skills-compat-matrix.md)为准**，本文件不复制它们。

| 项目 | 要求 | 说明 |
| --- | --- | --- |
| Node.js | **≥ 24** | 低于 24 会被前置检查直接拒绝（见[排障](#排障)）；本机读数与其它 24.x 边界见矩阵。 |
| git | 未声明版本下限 | 只有安装 runner 时用到（`git init/add/commit`），接入命令本身不需要。缺它时步骤 2 会在 Git 初始化那步失败：`runner Git identity setup failed: spawnSync git ENOENT`（实测）。 |
| npm | 随 Node 安装，未声明版本下限 | 只有安装 runner 时用到（`npm ci`），接入命令本身不需要。缺它时步骤 2 会在依赖安装步失败：`runner clean install failed: spawnSync npm ENOENT`（实测）。 |
| open-code-review（`ocr`） | **≥ 1.12.9** | 代码审查必需；低于下限或探针失败按 `not_installed`/`unavailable` 报告，不换替代执行者。读数与正反例见矩阵。 |
| ego-browser | 未声明支持区间 | 浏览器动作必需；版本子面仍是 unknown，三个来源的取值与边界在矩阵里分列，**不构成 `>=` 区间**。 |
| anysearch | 需要 key | 搜索动作必需；缺 `ANYSEARCH_API_KEY` 按缺失报告，不静默走匿名。 |
| 3rd-review broker | 见[配置](#3rd-review-从哪来) | 审查路由真正调用它；**不随发布包分发**，只有源码检出的 `skills/third-review/` 是全的。 |
| 平台 | macOS 已实测 | Windows 与其它宿主未声明，不在当前发布的支持范围。 |

Node ≥ 24 的安装来源（两条都可用，选一条）：

- 官方安装包：<https://nodejs.org/en/download> 下载当前 LTS 的 24 或更新版本，装完新开一个终端。
- 版本管理器：按 <https://github.com/nvm-sh/nvm> 的说明装好 nvm 后执行 `nvm install 24 && nvm use 24`。

装完自己确认一次：

```bash
node --version
```

看到 `v24.` 或更高即可。**这一步是外部安装，本任务没有在本机执行**；能不装就别装——已经 ≥ 24 就直接往下走。

其他工具从哪装（都是外部来源，本机未执行安装，只核了名称/地址可解析）：

| 工具 | 安装来源 | 自检 |
| --- | --- | --- |
| open-code-review（`ocr`） | `npm install -g @alibaba-group/open-code-review`（要求 ≥ 1.12.9，实际装到的版本以 npm 与你机器为准） | `ocr --version` |
| git | 官方安装页 <https://git-scm.com/downloads>，或用你系统上的包管理器装；装完新开终端 | `git --version` |
| npm | 随 Node 一起装（见上面的 Node 来源）；不需要单独装 | `npm --version` |
| ego lite | <https://github.com/citrolabs/ego-lite>（MIT），装好后 `ego-browser` 应在 PATH；已装在别处就用 `EGO_BROWSER_BIN` 指到 helper | `--check` 的 `tools.ego` 不再是 missing |
| anysearch | 不用装：CLI 随包在 `<release-root>/runner/skills/anysearch/scripts/anysearch_cli.js`；只需要在执行搜索动作的 shell 里设 `ANYSEARCH_API_KEY` | `--check` 的 `tools.anysearch` 变成 ok |

## 怎么装

### 先认清两个位置

发布物是一个文件夹（下称 `<release-root>`），里面按下面分工，不要手动搬动：

| 路径 | 角色 | 说明 |
| --- | --- | --- |
| `<release-root>/` | 外层发布根 | 放 README、两份清单、两份矩阵、`release.json` 和接入入口 `tools/cli/onboard-release.mjs`。 |
| `<release-root>/skill-bundle/` | 标准技能包 | 全部方法与技能，含 `skill-bundle/skill-bundle.json`。 |
| `<release-root>/runner/` | 运行器根 | 运行时、`package.json`、配置模板；安装时把 `skill-bundle` 内嵌进来，并做 npm/Git 副作用。它是**包内目录**，不是任何命令的参数值。 |
| `<home>/.claude/skills`、`<home>/.agents/skills` | 宿主链接 | 指向 `<release-root>/runner/skills` 的相对符号链接，由接入命令创建。 |

两个名字不要混：

- **`--package-root`（接入命令的参数）** = 发布根，即含 `runner/` 与 `skill-bundle/` 的那一层。传成 `<release-root>/runner` 会去找 `runner/runner`，以 `LAYOUT_MISSING: runner does not exist: <release-root>/runner/runner` 失败。
- **安装器的 `releaseRoot` 参数** = `<release-root>/runner`（运行器根），同时还要给 `skillBundleRoot` = `<release-root>/skill-bundle`。参数名不同、收的目录也不同，别照名字类推。

先判断自己在哪一边（在候选目录里执行）：

```bash
test -f release.json && echo "发布文件夹" || echo "源码检出"
```

判据只有一条：**发布文件夹带 `release.json`、`runner/`、`skill-bundle/`；源码检出带 `runtime/`、`tests/`、`specs/`，没有 `release.json` 也没有 `runner/`。**

- **你有源码检出**：自己构建并安装，步骤 1、2、3 全走。
- **你只拿到别人给的发布文件夹**：确认对方已经执行过步骤 2。这是**人工确认项，不是自动门**——技能不全时 `--check` 照样 exit 0（实测只剩 1 个技能时也是 exit 0），别拿 exit code 当"装好了"的证据。自己数：`ls -A <release-root>/runner/skills | wc -l` 得到条目数，再看这些条目里有几个是含 `SKILL.md` 的技能目录；装前只会有 `resolving-merge-conflicts` 一个完整技能，装后 `--check` 的 `skills` 数组会明显变长。准确数以你自己那次的输出为准。确认完直接做步骤 3。

另外，发布根里本来就有 `.claude/skills`、`.agents/skills` 两条符号链接（指向 `../runner/skills`），是打包时建给"直接把发布包当技能目录加载"的宿主用的：装之前它们指向的目录只有本包自带的少量支撑文件，装着之后才是完整的技能集。它们**不是**你 HOME 下那两条接入链接，不需要你创建，也不要用去替换 HOME 里的。

### 步骤 1：构建发布包（有源码时）

输出目录必须是**绝对路径的空目录**，且不能在包根内部：

```bash
node tools/cli/build-release.mjs --output=<绝对路径的空目录>
```

成功时打印 JSON，字段是：`release_root`、`version`、`outer_files`、`installed_support_files`、`skill_bundle_files`、`runner_files`。其中 `installed_support_files` 是安装态会实际读取、但不属于两个标准内层根的文件（例如 `runner/skills/catalog.yaml`），不是多余输出。`version` 的具体值以同一次构建产出的 `release.json` 为准，本文不复制版本号。放错位置会直接失败：目录非空是 `--output must be empty before building a release`，放在包根内部是 `--output must be outside the package root`。

### 步骤 2：把技能包装进 runner（每个 runner 目录只做一次）

这一步是**安装器**的工作，`onboard-release` 永远不碰它。在**源码仓根目录**执行（发布包里不含安装器模块）。注意两个参数收的都是运行器相关的目录，命令要把结果打印出来，否则它会安静地什么都不显示：

```bash
node --input-type=module -e 'import { installRunnerRelease } from "./runtime/distribution/runner-release.mjs"; const r = installRunnerRelease({ releaseRoot: "<release-root>/runner", skillBundleRoot: "<release-root>/skill-bundle" }); console.log(JSON.stringify({ status: r.status, npm: r.stdout.trim() }));'
```

它会依次：把 `skill-bundle` 的文件复制进 `runner/`，在 `runner/` 里执行 `npm ci --ignore-scripts --omit=dev`，再执行 `git init/add/commit`。需要 npm、git 和能取到依赖的网络。

预期输出形如 `{"status":0,"npm":"added 7 packages ..."}`，exit 0。`npm` 那段文本随 npm 版本与依赖缓存变化（可能很长、含换行），**判据是 `status` 为 0**。装没装成看两个数：`ls -A <release-root>/runner/skills | wc -l` 的条目数（装前是个位数，装后会明显变大），以及 `--check` 输出里 `skills` 数组的长度；本文件不复制这两个数，以你自己那次的输出为准。

同一个 `runner/` 不要装第二次：会以 `EEXIST: ... runner/.gitignore` 失败。**如果安装中途失败**（例如缺 git，失败点在 "Git identity setup" 那步——此时 bundle 已复制、`npm ci` 已跑完、`.gitignore` 也已写入），重跑同一个目录会撞同样的 `EEXIST: ... .gitignore`（实测）。别在那里反复重试：按步骤 1 重建一个新的发布目录，再装一次。

### 步骤 3：接入宿主（check → dry-run → apply）

在**发布根目录**执行，`--package-root` 必须是绝对路径、且指发布根（不是 `runner/`）：

```bash
node tools/cli/onboard-release.mjs --check --package-root=<release-root>
node tools/cli/onboard-release.mjs --dry-run --package-root=<release-root>
node tools/cli/onboard-release.mjs --apply --package-root=<release-root>
```

（这里写的是**在发布根目录**、用包里那份入口的形式；如果你在源码检出根目录，同一条命令换成 `node tools/cli/onboard-release.mjs …` 即可，两个位置的相对路径相同。）

链接是**相对符号链接**，建链时两侧会被归一化成真实路径：macOS 上 `/tmp` 是指向 `private/tmp` 的符号链接，**当前源码**的接入命令实测在 `/tmp/...` 与 `/private/tmp/...` 混用时也能建出能解析的链接。如果你看到悬空链接，先确认手里那个发布包是不是更早构建的（旧构建对别名路径会算出错位的相对路径）——重建发布包、或两边统一写法（都用 `/tmp` 或都用 `/private/tmp`）即可。

三条命令看同一份计划，只读程度依次递减：

- `--check`：只读。打印 JSON，`skills` 是可用技能、`config` 是配置状态、`actions` 是两条宿主链接的计划状态。**就绪才 exit 0**（`"required": {"status": "ready"}` 且没有 blocking 动作），否则 exit 1 并在 `next_action` 给出下一步。
- `--dry-run`：打印将要发生的改动（`would-create` / `noop` / `skipped` / `would-merge` / `blocked`），**不写任何字节**（实测跑完 `<home>` 下没有新建目录，配置 sha256 不变）。
- `--apply`：只动三处被点名的目标——两条宿主链接，以及（仅当显式加 `--write-config` 且用户作用域时才动）唯一配置。用户作用域成功时输出 `"summary": {"created": 2, "noop": 1}`、exit 0。

`--apply` 的验证是"再跑一次"：

```bash
node tools/cli/onboard-release.mjs --apply --package-root=<release-root>
```

第二次应输出 `"summary": {"noop": 3}`、exit 0，且配置文件字节不变（实测 sha256 前后一致）。**为什么不该被它改字节**：链接已经是同一个目标，配置结构也已完整，计划里没有任何要写的项，所以它只报告 no-op；配置只有在 `--write-config` 且确实缺非敏感骨架时才会被重写，写之前一定会先留备份。

**什么算"接入完成"**——分作用域看：

- **用户作用域**（不带 `--target`）四条：① `--apply` exit 0；② `summary` 里只有 `created` 和 `noop`；③ `readlink -f <home>/.claude/skills <home>/.agents/skills` 两条都解析到同一个 `<release-root>/runner/skills`；④ 再跑一次 `--apply` 得到 `noop 3`。
- **项目作用域**（带 `--target`）：三条可自动判——① `--apply` exit 0；② `summary` 只有 `created`/`noop`/`report-only`，没有 `conflict`/`failed`/`blocked`；③ 再跑一次得到 **`noop 2` + `report-only 1`**（项目级不会像用户作用域那样出现 `noop 3`，因为全局配置那项恒为 `report-only`）。链接自检同样用 `readlink -f <target>/.claude/skills <target>/.agents/skills`。前提是先有一份**通过配置校验**的用户配置；否则第①条就过不了（`blocked 3`）。这里同样只是"接好了"，不是"能跑审查"。

**四层状态别读混**：输出里同时有 `required`、`tools`、`review_readiness`、`blocking`，各自的含义不同：

| 字段 | 说明 | 会不会让命令失败 |
| --- | --- | --- |
| `required` | 接入必需的检查：只有 `node` 和 `config` 两项 | 它是 exit 0 的两个条件之一（另一个是 `blocking` 为空） |
| `tools` | 工具可用性（ocr/ego/anysearch/npm/git），接入的参考信息 | 不会 |
| `review_readiness` | 审查前置（配置、provider、路由、ocr） | 不会 |
| `config.status` | 这次配置动作的结果（`noop`/`blocked`/…） | `blocked` 会进 `blocking`，于是 exit 1 |
| `blocking` + `exit_code` | 真正的门：布局问题、链接冲突/失败、配置阻塞 | 有任意一条就 exit 1 |

所以：`tools` 是 blocked（例如没设 `ANYSEARCH_API_KEY`）、`review_readiness` 是 blocked（静态模式不探测版本，`ocr` 恒为 `unknown`），接入仍然可以 exit 0；反过来，`--package-root` 指错时 `required` 仍是 `ready`（它只看 node 和 config），但 `blocking` 里有 `LAYOUT_MISSING`，所以 exit 1。**判断以 `blocking` 和 exit code 为准，不要只看 `required`**；配置本身有问题时也一样——`required` 可能还是 `ready`，但 `config.status` 是 `blocked` 且进了 `blocking`。

**接入完成 ≠ 能跑审查**：先把两个说法定死——**通过配置校验** = `required.config` 为 ok（WorkflowHub 配置存在、路径与形状合格）；**能跑审查** = `review_readiness` 里 `provider_config`/`provider`/`route`/`ocr` 都不缺（broker 配置真实存在、provider 可执行、路由已配、ocr 版本达标）。`--check` **不校验 3rd-review broker 配置是否存在**：实测把 `third_review.config` 指向一个不存在的文件，`--check` 照样 exit 0（配置"通过校验"），问题只出现在 `review_readiness` 里（`provider_config`、`provider` 变 `missing`，code `PROVIDER_CONFIG_NOT_FOUND`）。

而且 `review_readiness` **也不校验 broker 脚本本体是否存在**：实测把 `third_review.command` 指向一个不存在的 `3rd-review.mjs`、同时配好 `build-code` 路由，`provider_config`/`provider`/`route` 仍然全是 `ok`（只有 `ocr` 是静态 `unknown`），`--check` 依旧 exit 0 —— 这种"检查全绿、派发才失败"的情况只能自己挡。自检办法：确认 `third_review.command` 里那个脚本真实存在且可执行，例如 `test -x <broker 脚本> && echo ok`（不存在就按[3rd-review 从哪来](#3rd-review-从哪来)取得）。

所以"接入完成"只说明宿主链接和 WorkflowHub 配置就位；要判断审查能不能跑，看 `review_readiness.checks` 里的 `provider_config`/`provider`/`route`，并且自己确认 broker 脚本在。

还有一条别误读：`--check` 只校验**接入布局与配置**（发布根结构、两条宿主链接的计划、配置形状），**不校验声明闭包完整性**——技能是否齐全归发布物的 builder/validator。所以它的 exit 0 **不是**"这个包是完整的"的证据。

可选作用域与选项：

- `--target=<绝对路径项目目录>`：项目内接入，只在该目录下写 `.claude/skills`、`.agents/skills`；全局配置只报告不修改（`"status": "report-only"`）。目标目录不存在会以 `LAYOUT_MISSING` 失败，先建好目录。**项目级仍然需要一份"通过配置校验"的用户配置**（HOME 或 `XDG_CONFIG_HOME` 下那一份）：没有它，`--apply --target=…` 直接 exit 1、`"summary": {"blocked": 3}`（两条链接 + 配置，`CONFIG_MISSING`）。"通过配置校验"只表示结构合格（`required.config` 为 ok），**不等于能跑审查**——后者要另外看 `review_readiness`（见下文）。
- `--write-config`：允许补全配置里缺失的非敏感骨架（见[配置](#配置)）。
- `--source-version=<semver>` 或 `--source-package=<绝对路径>`：报告版本三态（有更新 / 无更新 / 无法检查）。两个不能同时给。

三条命令都接受 `--help`，会原样打印用法与注意事项。

### 已经有 `~/.claude/skills` 或 `~/.agents/skills` 时

这是最常见的一次卡点：这两个位置里已经有你自己的技能目录（不是符号链接），`--check` 会判 `conflict` 并 exit 1。这是**保护**，不是故障——它不会覆盖你的目录。

先读懂冲突（`--check` 输出里就这几处）：

| 位置 | 取值 | 含义 |
| --- | --- | --- |
| `actions[].state` / `actions[].status` | `conflict` | 该路径已存在且不是符号链接 |
| `actions[].reason` | `<path> exists and is not a symlink; the user value is preserved` | 你的值被保留，命令没有写 |
| `summary` | `{"conflict": 1}` 或 2 | 有几处冲突（两个宿主各算一处） |
| `exit_code` | `1` | 有 blocking 项 |
| `config` | 可能仍是 `noop` | 配置没问题，只有链接冲突 |

**一个宿主只从一个路径读技能**，所以"保留旧目录同时装上本包"在同一路径上做不到，只能换一个位置。三条路，按你的意图选：

1. **让这个包接管 HOME（先备份旧目录再换链）**——适合"我以后就用这个包"的人：

   ```bash
   ls ~/.claude/skills          # 先确认里面是你自己的技能
   mv ~/.claude/skills ~/.claude/skills.bak-20261117
   node tools/cli/onboard-release.mjs --apply --package-root=<release-root>
   ```

   第二个宿主同理（`~/.agents/skills` 各自独立，一个改名不影响另一个）。旧技能仍在 `skills.bak-20261117` 里，随时可以取回。
2. **不想动 HOME：走项目级**——只在指定项目的 `.claude/skills`、`.agents/skills` 建链接，HOME 下已有的技能目录和链接都不会被碰：

   ```bash
   node tools/cli/onboard-release.mjs --apply --package-root=<release-root> --target=<项目根>          # 在源码检出根目录
   node <release-root>/tools/cli/onboard-release.mjs --apply --package-root=<release-root> --target=<项目根>   # 在发布包内
   ```

   但**项目级仍然需要一份通过配置校验的用户配置**（就是[配置](#配置)那一份）：HOME 下没有配置时，`--apply --target=…` 会 exit 1、`"summary": {"blocked": 3}`（两条链接 + 配置，`CONFIG_MISSING`）。所以先用配置节把配置建好（或设好 `XDG_CONFIG_HOME`），再做项目级——注意"通过配置校验"只表示结构合格，不等于能跑审查。项目里若已有同名目录，同样会判 conflict，处理方式同上。
3. **维持现状**：保留现有目录、不接入这个包。这样没有冲突，但这个包也不会被宿主加载。

自检：`readlink -f ~/.claude/skills` 应打印以 `<release-root>/runner/skills` 结尾的真实路径（前面怎么绕无关，落到 `runner/skills` 就对）。要退回原状：删掉新链接，把备份目录改名回 `skills`。

## 跑一条真实命令

接入做完后，用下面任意一条确认"我这边是通的"。

**在发布根目录**，看接入入口本身是否可用：

```bash
node tools/cli/onboard-release.mjs --help
```

预期：打印 `usage` 与 `notes`，exit 0。

**在源码仓根目录**，校验两份清单与目录是否彼此对得上（离线、秒级）：

```bash
node tools/cli/build-skill-manifests.mjs --check
```

预期输出形如 `[build-skill-manifests] manifest check passed: <N> repository skills, <M> external entries`，exit 0。N/M **以本次输出为准**，别把某个数字当固定值。

注意这条只能在源码仓根目录跑：发布包的 `tools/cli/` 只带 `onboard-release.mjs`，没有这个脚本；如果从源码仓用 `--root=` 指向发布文件夹，也会因为没有清单源 `skills/catalog.yaml` 而失败 `MANIFEST_INVALID: manifest source is missing or unsafe: skills/catalog.yaml`。

## 配置

### 唯一的那份配置

配置只有一份 JSON，路径由环境决定，命令输出里的 `config.path` 就是它：

| 环境 | 路径 | 输出里的 `source` |
| --- | --- | --- |
| 设了 `XDG_CONFIG_HOME` | `$XDG_CONFIG_HOME/workflowhub/config.json` | `XDG_CONFIG_HOME` |
| 没设（或为空） | `$HOME/.config/workflowhub/config.json` | `HOME` |

模板有两个位置，内容相同：

- 源码检出：`config/workflowhub.config.template.json`
- **发布包：`runner/config/workflowhub.config.template.json`**（发布根没有 `config/`，别去找）

注意：缺配置时 CLI 的 `next_action` 写的是 `create <path> from config/workflowhub.config.template.json, ...`。**这段 CLI 文案没有随包改**——它写的是**源码检出**的相对路径，而发布包里那个位置不存在。只拿发布包的人请用 `runner/config/workflowhub.config.template.json`，或者直接用下面这份内联模板；别照 `next_action` 去包里找一个不存在的 `config/`。

只拿到发布包的人直接用下面这份，复制到上面那个路径，把 `<...>` 换成你自己的绝对路径：

```json
{
  "task_dir": "<你选的绝对任务存储根>",
  "third_review": {
    "command": ["<node 绝对路径或 PATH 名>", "<3rd-review 入口绝对路径>"],
    "config": "<现有 3rd-review 配置的绝对路径>",
    "attachment_root": "<该配置已允许的绝对档案目录>"
  },
  "wh_review": { "version": 2, "stages": {}, "non_stage": {} }
}
```

字段要求：

- **必须是绝对路径**的三项：`task_dir`、`third_review.config`、`third_review.attachment_root`。
- **`third_review.command`** 只要求"非空字符串或非空 argv 数组"，**不要求绝对路径**：写 `["node", "<...>/3rd-review.mjs"]` 或 `["/绝对/node", "<...>/3rd-review.mjs"]` 都行（实测两种都能通过 provider 检查）。
- `wh_review` 必须是 `version: 2`。`stages` 的键是阶段名（`make-decision` 下再分 `direction`/`detail`，另有 `build-plan`、`build-code`、`verify-code`），`non_stage` 目前只接受 `build_prd`；每条路由形如 `{"initial": ["<provider-id>", ...], "mode": "single_round"}`。
- `mode` 不能随手写：`make-decision`（按 `direction`/`detail` 分轨）、`build-plan` 必须是 `single_round`；`build-code` 必须是 `full_only`。不写 `mode` 时默认 `adaptive`，这几个阶段就会报 `mode must be ...`。
- **provider 和 model 的定义不在这个文件里**，归你的 3rd-review 配置；这里只写 provider ID。

### 给单个任务提高测试记录上限

默认 `quality/tests` 硬上限仍为 256 MiB。遇到 `DISK_BUDGET_EXCEEDED` 且必须保留已有原件时，操作者可在现有用户配置中加入一个 `task_tests_disk_budget`，保留其它配置项不动：

```json
"task_tests_disk_budget": {
  "project_name": "ExampleProject",
  "task_id": "example-task",
  "task_root": "/absolute/storage/Projects/ExampleProject/tasks/example-task",
  "hard_bytes": 335544320
}
```

- 填写已认证任务的精确身份与物理绝对路径；它必须是同一配置中 `task_dir` 下该项目/任务的标准位置。文件须归当前用户所有、为单链接普通文件、不经符号链接、不可由组或其他用户写入，并在该存储根的 `Projects` 之外。建议权限 `0600`。
- `hard_bytes` 必须为大于 `268435456` 且不超过 `536870912` 的整数。只提高该当前任务 `quality/tests` 的硬字节线；软线、文件数、审查和其它证据的配额保持不变。选中任务的配置绑定无效时，报告 `TASK_TESTS_DISK_BUDGET_INVALID`；其他任务仍按默认值。
- 不改验证命令：原 `verify --action=execute` 仍经认证 task handle 保存输出与回执。任务材料、事实和 verify 输入不能设置这个值。配置归本机操作者维护，现有 task handle 消费；不再需要时删除该键并重新运行命令（长驻 API 使用者重新打开 handle）。若占用仍高于默认线，撤回后只拒绝新写入，不删除、迁移或改写原件及其引用。

### 3rd-review 从哪来

`third_review` 三处值不是占位符能蒙过去的：

| 值 | 从哪来 |
| --- | --- |
| `command` | 指向 **broker 目录**里的 `scripts/3rd-review.mjs`，写成 `["node", "<broker 目录>/scripts/3rd-review.mjs"]`；只写目录名不行。broker 目录怎么来见下一小节；版本与来源以 `skills/catalog.yaml`（发布包内为 `runner/skills/catalog.yaml`）的 `third-review` 条目为准。 |
| `config` | 3rd-review 自己的配置（例如 `$HOME/.config/3rd-review/config.json`）。从源码检出 `skills/third-review/config.example.json` 复制起步，至少填 `runtime.root`、`attachment_roots`、`providers`、`tiers`；每个 provider 的 `command` 必须是存在且可执行的 CLI。 |
| `attachment_root` | 必须是上面那份 3rd-review 配置里 `attachment_roots[].root` 之一，且该条目的 `sources` 要包含 `.wh-review-packets`，否则 `--check` 的 `review_readiness.provider` 会报 `fixed packet source .wh-review-packets is not allowlisted`。 |

**发布包里的 `runner/skills/third-review/` 只有支撑库**（`lib/`），没有 `scripts/3rd-review.mjs`，也没有 `config.example.json`——它只够别的运行时校验 provider ID，不能当 broker 用。

#### 没有源码检出时怎么拿到 broker

**当前没有公开下载地址或 tag 可给**：catalog 的 `third-review` 条目只记了 `local_version` 和来源 commit，没有记录可访问的仓库地址；发布包也不带它。所以唯一的取得方式是**向持有源码检出的交付方索取 `skills/third-review/` 整目录**（整目录，别只拿 `lib/`）。

**如果对方给不了**：那就没法启用审查。具体会怎样，分清两类：

| 还能用 | 会失败或只能记不可用 |
| --- | --- |
| 接入三命令 `--check`/`--dry-run`/`--apply`（实测 broker 配置缺失时三者都 exit 0）；安装 runner 与技能加载；`doctor`、`status`（实测 `ready`，它们不要求审查） | 需要审查的动作：审查派发 `<入口> review --action=record …`（实测 `review` 维度 blocked：`PROVIDER_CONFIG_NOT_FOUND`、`ROUTE_STAGE_ABSENT`；完整审查前置还多一条 `ocr: unknown`）；以审查结论为前提的收尾，见下 |

`doctor` 与 `status` 在这里就能查，两条都要在**任务 worktree 里**跑，`<入口>` 在源码检出是 `tools/cli/stage-runtime.mjs`、在发布包内是 `<release-root>/runner/tools/cli/stage-runtime.mjs`：

```bash
<入口> doctor --action=workspace --stage=build-code --project=<项目名> --task=<任务 id>
<入口> status --action=begin  --stage=build-code --project=<项目名> --task=<任务 id>
```

看哪些字段：

- `doctor`：`workspace.registered`（是否已注册）、`workspace.branch`（应是本任务分支）、`baseline_commit`、`workspace.counts`（tracked/staged/unstaged/untracked 各几项）与 `workspace.dirty_paths`。判断依据是"注册在、分支对、干净程度与你实际改动一致"。
- `status`：`work_status`（`ready` 才算可继续）、`missing_materials`（应为空）、`quality_status` 与 `quality.review_origin`/`quality.review_result_ref`（审查事实在这里，缺审查时不会是 `pass`）、`phase_progress.freshness`（`current` 才表示游标没过期）。

注意一个坑：用**发布包内**那份入口时要用真实路径调用。它判断"是否直接执行"用的是字面路径比较，`/tmp` 这类符号别名（真实路径 `/private/tmp`）会让它**静默 exit 0、什么都不做**（实测：`/tmp/...` 调用输出 0 字节，`/private/tmp/...` 调用正常出 JSON）。

**以审查结论为前提的收尾**，具体是这几处：① 审查派发本身 `<入口> review --action=record …`（缺 broker 直接失败）；② 交付收口 `node tools/cli/task-close.mjs status|prepare|confirm|execute|complete|close --project=<项目名> --task=<任务 id> …`——命令本身不校验审查（实测 `status` 只读可用，返回 `status`、`quality_status`、`facts`），但它的 `quality_status` 会停在 `unknown`/`incomplete`，不能拿来宣称完成；③ build-code 的终末判断同样以本次审查事实为前提。

所以缺审查时的替代做法是：**如实记"审查暂不可用 + 交付方待提供"**，把 `quality_status` 留在不通过的状态继续做别的安全工作；**不要**用跳过审查、伪造 review 记录或换默认 provider 来把收口"凑绿"。

收到的目录应包含：`package.json`、`scripts/3rd-review.mjs`、`config.example.json`、`lib/`、`LICENSE`，以及 `skill-bundle.json`（它列了该技能应当包含的文件清单，可拿来点数核对）。拿到后先自检，exit 0 才算可用：

```bash
node <broker 目录>/scripts/3rd-review.mjs doctor --config=<你的 3rd-review 配置> --attachments-root=<attachment_root>
```

看到 `"attachment_root": {"status": "ready"}` 和 provider 的 `"status": "ready"` 就算这一层通了。注意它自己的说明：`doctor does not verify model authentication or a real review` —— provider 只证"可执行文件在"，不证模型能跑通。

### wh_review 最小可用示例

下面这份只保留真跑审查要用的三个阶段（`build-code` 是 `--check` 默认检查的那个）：

```json
"wh_review": {
  "version": 2,
  "stages": {
    "make-decision": {
      "direction": { "initial": ["<provider-id>"], "mode": "single_round" },
      "detail": { "initial": ["<provider-id>"], "mode": "single_round" }
    },
    "build-plan": { "initial": ["<provider-id>"], "mode": "single_round" },
    "build-code": { "initial": ["<provider-id>"], "mode": "full_only" }
  },
  "non_stage": {}
}
```

哪些能空、哪些不能：

- **能空**：`stages` 和 `non_stage` 整体写成 `{}`，接入 `--check` 仍然能过（`required` 只看 node 和 config）。但这样没有任何审查路由，`review_readiness.route` 会是 missing（`ROUTE_STAGE_ABSENT`: `no wh_review.stages.build-code route with providers is configured`），真跑审查不会有执行者。
- **不能空**：每条路由的 `initial` 必须是非空的 provider ID 列表（空列表等于没配）；`mode` 必须按阶段对上（见上）；`make-decision` 必须嵌套 `direction`/`detail`，写成扁平会被判 `CONFIG_WH_REVIEW_ROUTE_INVALID`（消息里出现 `wh_review.stages.make-decision.initial is unsupported`）并 block 接入。
- **provider ID 白名单**：`claude-code`、`codex`、`cursor`、`grok`、`kimi`、`opencode`、`antigravity`、`pi`，可带 `/<profile>` 实例名。`dsh` 也在 ID 表里，但它是**宿主身份**，不能当审查 provider —— 用它会 `UNSUPPORTED_PROVIDER`（`dsh is a host identity for same-source exclusion, not a review provider`）。ID 还必须在 `third_review.config` 的 `providers` 里定义、可执行。
- **真跑审查还要**：`ocr` ≥ 1.12.9；provider 对应的模型与账号在 3rd-review 侧配好。`--check` 的 `review_readiness` 只证明结构、路径与可执行文件在，不证明一次真实审查能出结果（见[已知限制](#已知限制)）。

### 坏配置会怎样

配置**永远不会被覆盖**。看输出时别把两个字段搞混：

- **`config.status`** 是"这次动作的结果"，`--check`/`--dry-run` 可能是 `noop`（无需处理）、`skipped`（缺骨架但没加 `--write-config`）、`would-merge`（加了 `--write-config`，将要补骨架）、`blocked`（配置不可用）、`report-only`（项目作用域只报告）；`--apply` 可能是 `noop`、`applied`、`conflict`、`blocked`、`report-only`、`failed`。
- **`config.state`** 只在 `--check`/`--dry-run` 出现，只有三个值：`none`（配置有效，不用补）、`merge`（缺非敏感骨架）、`blocked`（配置不可用）。`--apply` 的输出里没有这个字段。
- **到底哪里坏了看 `config.problems[].code`**，`message` 是给人读的原文，`next_action` 是下一步。

常见 `code` 与你会看到的原文：

| code | 你会看到 |
| --- | --- |
| `CONFIG_MISSING` | `WorkflowHub user config is missing: <path>` + `create <path> from config/workflowhub.config.template.json, ...` |
| `CONFIG_INVALID_JSON` | `WorkflowHub user config is not valid JSON and was left untouched: <path> (line 1, column 60); parser content is not echoed` |
| `CONFIG_NOT_OBJECT` | `WorkflowHub user config must be a JSON object and was left untouched: <path>` |
| `CONFIG_TASK_DIR_MISSING` / `CONFIG_TASK_DIR_INVALID` | `workflowhub host config requires an absolute task_dir: <path>` 一类提示 |
| `CONFIG_THIRD_REVIEW_*` | `third_review` 段缺失/不是对象/`command` 或 `config` 或 `attachment_root` 不合法，逐项点名 |
| `CONFIG_WH_REVIEW_VERSION_UNSUPPORTED` | 顶层 `wh_review` 不是 version 2：`... must be version 2; the original file is preserved and no migration is performed` |
| `CONFIG_WH_REVIEW_RETIRED_FIELD` / `CONFIG_WH_REVIEW_UNKNOWN_KEY` | **只在顶层 `wh_review`**：用了退役字段（`profiles`、`priority`）或未知键 |
| `CONFIG_WH_REVIEW_ROUTE_INVALID` | 路由形状不对：单条路由、阶段键、`mode`，以及 `stages`/`non_stage` 本身不是对象（实测消息 `workflowhub host wh_review.stages must be an object`）都用这个 code |
| `CONFIG_SYMLINK_DANGLING` | 配置文件是一条指向不存在目标的符号链接 |

v1 不会被自动迁移；任何一项不合格都保持 exit 1，你的字节原样保留。

### 补全、备份与回滚

`--write-config` 只补**非敏感骨架**，两种情形：

1. `wh_review` 整段缺失 → 加入 `{"version": 2, "stages": {}, "non_stage": {}}`；
2. `wh_review` 在、但缺 `stages` 或 `non_stage` → 只补缺的那一两个键，其它值不动。

它从不替你填 `task_dir` 或 `third_review` 的任何值，也不会改你已有的值；在项目作用域（`--target`）下**永不写配置**。

真要写之前，它先在旁边留一份备份：`<config>.bak-<UTC 时间戳>-<8 位随机>`（权限 600），然后原子替换；替换前若发现字节被别的进程改过，判为 `conflict` 并保留你的版本，不覆盖。

**备份什么时候才存在**：只有 `--apply --write-config` 真的动了配置的那一次才会生成 `.bak-*`。`--check`、`--dry-run` 从不生成；你自己手抄模板写下的配置、以及之后被写坏的 JSON，旁边都不会有备份。

所以恢复分两种情况：

- **你手上没有备份**（手写配置 → 改坏）：备份这条退路不存在，只能按报错修。JSON 坏了用消息里的 `line X, column Y` 改；缺字段按提示逐项补。要留退路就自己先复制一份，或把配置放进版本控制。
- **有备份**（`--write-config` 写过）：把备份复制回去，再跑 `--check` 确认：

```bash
cp "<config>.bak-<UTC 时间戳>-<8 位随机>" "<config>"
```

实测：回滚后 `--check` 能回到可用状态（`"required": {"status": "ready"}`、exit 0）。

## 更新与卸载

**用户作用域**（链接在 HOME 下）：

- **更新**：在新空目录重建发布包（步骤 1）→ 安装 runner（步骤 2）→ 重新接入。旧链接还指向旧目录时是"目标仍然存在的不同链接"，接入会判 `conflict` 并保留你的值。确认旧链接是要替换的那条（`readlink -f` 看目标）后先删掉旧链接，再跑 `--apply`。
- **链接断了**（发布目录被移动、删除）：接入会识别为断链并自动重建，不必手动处理。
- **卸载**：先 `readlink -f <home>/.claude/skills <home>/.agents/skills` 确认目标确实是本包 `runner/skills`，再删这两条链接。配置文件按需自行删除；备份文件不受影响。删错链接会丢掉你自己的技能目录。

**项目作用域**（`--target` 建的链接）：

- **更新**：重建发布包后，**带着同一个 `--target`** 重跑 `--apply`（命令形式同上一节，加上 `--target=<项目根>`；包的入口在 `<release-root>/tools/cli/onboard-release.mjs`）。旧链接仍指向旧目录，会判 `conflict`（`already links to a different live target`），先删掉 `<target>/.claude/skills`、`<target>/.agents/skills` 再跑。
- **卸载**：删 `<target>/.claude/skills`、`<target>/.agents/skills` 两条链接即可；HOME 下的链接不受影响（如果之前没建过，本来也没有）。全局配置不属于项目作用域，不会因此改动。

## 排障

先跑 `--check`，看 `next_action`：它写的就是下一步该执行的命令或该修的文件。常见情形：

| 你会看到 | 含义 | 下一步 |
| --- | --- | --- |
| `LAYOUT_MISSING: runner does not exist: <path>/runner` | `--package-root` 指错了（常见是传了 `<release-root>/runner`，于是去找 `runner/runner`），或发布包还没构建 | 改指发布根（含 `runner/` 和 `skill-bundle/` 的那层），先做步骤 1。 |
| `package root must be an explicit absolute path: ./relative` | 用了相对路径 | 换成绝对路径。 |
| `Node.js <当前版本> is below the required >=24` | Node 太旧 | 按[前置条件](#前置条件)装 24 或更新，开新终端，重跑。 |
| `WorkflowHub user config is missing: <path>` | 还没建配置 | 用[配置](#配置)里的内联模板或在包内 `runner/config/workflowhub.config.template.json` 复制，填四类路径。 |
| `CONFIG_INVALID_JSON ... (line 1, column 60)` | JSON 语法坏了，原文已保留 | 按行号修；手写的配置旁边没有备份，只能手改（见[补全、备份与回滚](#补全备份与回滚)）。 |
| `third_review.config is missing or is not a regular file: <path>` | 3rd-review 配置路径不对 | 改 `third_review.config` 指到真实文件；provider/allowlist 归那份配置。 |
| `ROUTE_STAGE_ABSENT ... no wh_review.stages.build-code route with providers is configured` | 这个阶段没配审查路由（`stages` 还是 `{}`） | 按[配置](#配置)的示例补一条路由；只做接入可以先不管，那样不会有审查执行者。 |
| `wh_review.stages.build-code.mode must be full_only` | `mode` 写错或没写（默认 adaptive） | `build-code` 写 `full_only`，`build-plan` 与 `make-decision` 写 `single_round`。 |
| `wh_review.stages.make-decision.initial is unsupported` | `make-decision` 写成扁平路由 | 改成 `direction`/`detail` 两条嵌套路由。 |
| `fixed packet source .wh-review-packets is not allowlisted` | 3rd-review 的 `attachment_roots` 没允许这个固定来源 | 在那条 `attachment_roots[].sources` 里加 `.wh-review-packets`。 |
| `required` 是 `ready` 但命令 exit 1 | 失败在 `blocking`（布局、链接、配置），不是 `required` | 看 `blocking`、`config.status` 与 `problems[].code`；`required` 只覆盖 node 与 config 两项。 |
| `--check` exit 0 但审查跑不起来 | `--check` 不校验 broker 配置；`review_readiness` 才是依据（可能是 `PROVIDER_CONFIG_NOT_FOUND` 或 `ROUTE_STAGE_ABSENT`） | 看 `review_readiness.checks` 里的 `provider_config`/`provider`/`route`，按[配置](#配置)补齐。 |
| `review_readiness` 全 ok，派发时才失败 | 它也不校验 broker 脚本本体是否存在 | `test -x <third_review.command 指向的脚本>`；不存在就按[3rd-review 从哪来](#3rd-review-从哪来)取得 broker。 |
| `open-code-review: ocr is not on PATH` | 没装代码审查工具 | 装 `ocr` ≥ 1.12.9 并放进 PATH，用 `ocr --version` 自证；不换替代执行者。 |
| `ego-browser helper: ego-browser is not on PATH` | 浏览器动作缺工具 | 装 ego lite 让 `ego-browser` 上 PATH，或用 `EGO_BROWSER_BIN` 指到已装的 helper；不回退到别的浏览器。 |
| `ANYSEARCH_API_KEY is not set in the current environment` | 搜索动作缺 key | 在执行该动作的 shell 里设好 key；不会静默用匿名。 |
| `npm: npm is not on PATH` / `git is not on PATH` | 安装 runner 的前置缺了（缺 git 时失败点在 "Git identity setup"，此时 bundle 与 npm 已完成） | 装好放进 PATH；然后**先按步骤 1 重建一个新的发布目录，再走步骤 2**——直接在同目录重跑会立刻撞 `EEXIST: ... .gitignore`。 |
| `<home>/.claude/skills exists and is not a symlink; the user value is preserved` | 目标位置已有你自己的目录 | 命令拒绝覆盖（exit 1）。按[已有技能目录](#已经有-claudeskills-或-agentsskills-时)那节处理。 |
| `conflict ... configuration bytes changed after planning` | 有人同时在改配置 | 重读配置文件，重新规划后再写；你的字节没有被覆盖。 |

原则：提示里的路径和 `next_action` 是唯一权威，不要凭猜改配置；一次只改一处，改完重跑 `--check`。

## 已知限制

1. **真实远端发布未验证**。版本检查只比"已装 `runner` 版本"和"你显式给的来源版本"，三态是：有更新、无更新、无法检查；不联网、不猜。不给 `--source-version`/`--source-package` 就是"无法检查"（`status: unavailable`）。
2. **Ego 的版本支持子面仍是 unknown**。本机读数、catalog 旧值与官方样例三个来源在矩阵里按各自出处分列，不连接成 `>=` 区间，也不互相覆盖；真实支持区间与不兼容版本未取得（取值见[外部工具兼容矩阵](docs/external-skills-compat-matrix.md)）。
3. **provider 缺 key / 401 / 额度不足属于权限或环境事实**，不是版本或协议负例；矩阵里对应的"未知"保持 unknown，不改写成兼容结论。
4. **裸 wh-review 脚本默认读 `$HOME/.config/workflowhub/config.json`，忽略 `XDG_CONFIG_HOME`**。自定义 XDG 时请走 WorkflowHub 入口，它会用 `workflowHubConfigPath()` 解析（尊重 XDG）并把真实路径显式传给审查配置加载器。入口在两种位置各有一份：

   - 源码检出根：`tools/cli/stage-runtime.mjs`
   - 发布包内：`<release-root>/runner/tools/cli/stage-runtime.mjs`（**发布根的 `tools/cli/` 只有 `onboard-release.mjs`**，没有这个文件）

   ```bash
   <入口> --help     # 列出 behaviors 与各自允许的 --action=
   <入口> doctor --action=workspace --stage=build-code --project=<项目名> --task=<任务 id>
   <入口> review --action=record --stage=build-code --project=<项目名> --task=<任务 id> --input=<review request.json>
   ```

   `doctor --action=workspace` 是只读自检（实测 exit 0）；`review --action=record` 会**真的派发一次审查并落记录**（本任务没有执行，别拿它当试跑）。`--input` 指向一份 review request JSON，是必填项（缺了会报 `review-record requires --input`）。这两条要在**任务 worktree 里**跑：当前目录和任务声明的 workspace 不一致会报 `CURRENT_WORKTREE_MISMATCH: declared task workspace differs from cwd`（实测）。其余行为同形（`status`/`run`/`verify`/`confirm`/`authorize`，每个必须带且只带一个 `--action=`）。注意 `--project` 要的是**项目名**（单个路径段，例如 `workflowhub`），不是项目路径——传绝对路径会报 `project_name must be a safe single path segment`。裸脚本 `skills/wh-review/scripts/*.mjs` 仍是读 HOME 的那条路。
5. **宿主发现与真实调用未验证**。链接、check/dry-run/apply、二次 no-op、冲突与断链保护都已验证；但真实 Claude Code / Codex CLI 的发现与调用、多 24.x Node 行为、Windows 都留给最终安装验证，本文件不声称通过。
6. **安装器和 3rd-review broker 都只在源码检出里**：发布文件夹不含 `runtime/distribution/runner-release.mjs`；也不含完整的 `skills/third-review/`，包内 `runner/skills/third-review/` 只有 `lib/` 支撑库，没有 `scripts/3rd-review.mjs`、没有 `config.example.json`。只拿到发布文件夹时，让交付方先完成步骤 2，broker 须自己从源码检出取。
7. **审查就绪不等于审查可用**：`--check` 的 `review_readiness` 只证明结构、路径与可执行文件在；它**不校验 broker 脚本本体是否存在**（`third_review.command` 指向不存在的文件、路由配好时，`provider_config`/`provider`/`route` 仍全是 `ok`，实测 exit 0），也不校验真实派发；`doctor` 同样明说 `does not verify model authentication or a real review`。**本发布没有任何一个 provider/model 被验证过可用**：矩阵里列出的路由是当前使用者的配置事实，不是产品默认值，也不是可用性承诺；provider 的账号、额度、登录状态归 3rd-review owner，缺 key/401/额度不足属于权限与环境事实，本文件与矩阵都不声称通过。
8. **Node < 24 的拒绝行为只在模块级复放过**：本机只装了 24 线的一个版本（读数见矩阵），`Node.js <版本> is below the required >=24` 这条消息是用 `precheckForActions({nodeVersion})` 在旧版本号下复现的，**没有在真实 Node 22 下启动过 CLI**。其余命令都是在本任务内实跑的。

## 五段流程

「五段」是历史标签（旧映射 make-decision/intake、build-spec/design、build-plan/plan、build-code/apply、verify-code/test-acceptance）；**当前 post 开发路线是三阶段**，`build-prd` 是独立的规划工作流，`build-spec` 属 pre/history 只读留存。术语原文在源码检出 `GLOSSARY.md`（发布包不带该文件）。

| 当前阶段 | 使用方式 |
| --- | --- |
| make-decision | 用户目标与方向收敛，写 decision-log.md |
| build-plan | post 全局 spec 设计与独立 Phase 计划 |
| build-code | 当前 Phase 实施、受影响测试和独立审查；最后 Phase 做终末独立核对和逐 AC 判断 |

`build-prd`：独立规划工作流，消费已确认方向并形成任务地图与产品需求，不新增正式开发阶段。`build-spec`：pre/history 的设计方法，只读留存。

post 日常路线 make-decision → build-plan → build-code。两道人为门是方向与计划选择；三审查点为 build-plan 合并、build-code 每 Phase、build-code 终末。文档审查 wh-review，代码审查 OCR：OCR 不可用（命令不存在，或版本低于 1.12.9）如实记 `unavailable`/`unknown`，不换执行者，保留检测输出与原始失败；`architect-code-review` 是同源补充轴，独立执行，与 OCR 可用性无关。

段规则原文：源码检出 `docs/standard-workflow.md`（发布包 `runner/docs/standard-workflow.md`）。入口技能在 `workflows/`，可搬运技能在 `skills/`，生产代码在 `runtime/`，命令行工具在 `tools/cli/`。

## 术语与依据

按入手方式给位置，两边都在的文件才写成链接：

| 材料 | 源码检出 | 发布包 |
| --- | --- | --- |
| 发布支持矩阵 | [docs/release-support-matrix.md](docs/release-support-matrix.md) | [docs/release-support-matrix.md](docs/release-support-matrix.md) |
| 外部工具兼容矩阵 | [docs/external-skills-compat-matrix.md](docs/external-skills-compat-matrix.md) | [docs/external-skills-compat-matrix.md](docs/external-skills-compat-matrix.md) |
| 外部清单 | [external-skills.manifest.json](external-skills.manifest.json) | [external-skills.manifest.json](external-skills.manifest.json) |
| 仓内清单 | [repo-skills.manifest.json](repo-skills.manifest.json) | [repo-skills.manifest.json](repo-skills.manifest.json) |
| 版本事实 | `release.json`（构建产物） | `release.json` |
| 数字与许可 | `skills/catalog.yaml` | `runner/skills/catalog.yaml` |
| 术语表 | `GLOSSARY.md` | 只在源码检出 |
| 设计宪法 / 逐条核对 | `CONSTITUTION.md` / `constitution-checklist.md` | `runner/CONSTITUTION.md` / 只在源码检出 |
| 目录职责 | `docs/architecture/move-map.json` | `runner/docs/architecture/move-map.json` |
| 许可 | `LICENSE` | 只在源码检出 |

- 技能清单由 `skills/catalog.yaml` 派生，**不要手改**；计数、版本号一律以命令输出与 `release.json` 为准，本文件不复制数字。
- 许可：全部外部条目权利状态为 unknown，按个人研究范围处理；catalog 里的许可声明不是本次发布的授权。
- 历史说明归档在源码检出 `docs/archive/`，旧任务原件不改写。
