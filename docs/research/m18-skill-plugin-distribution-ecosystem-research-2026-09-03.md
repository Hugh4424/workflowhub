# M18 预研：AI 编程助手"技能/插件分发与打包"生态现状

- 日期：2026-09-03
- 目的：为 workflowhub M18 里程碑（打包分发：plugin.json + marketplace.json + 一键接入脚本 + semver + 更新检查 + external skills manifest）做预研。
- 方法：以官方文档与一手仓库资料为主，每个结论标注来源 URL；查不到的明确写"未查到官方资料"。Claude Code 一章经两名调研员独立核实（一人直接抓取官方五页文档全文，一人交叉验证）。
- 同批产出的补充笔记：`docs/research/ai-cli-host-skill-distribution.md`（各宿主细则）、`docs/research/claude-code-plugin-system-research-2026-09-05.md`（Claude Code 交叉核实版）。

## 1. Claude Code 插件体系

来源（均为 Anthropic 官方文档）：

- 插件创建指南：https://code.claude.com/docs/en/plugins
- Marketplace 指南（含 marketplace.json schema）：https://code.claude.com/docs/en/plugin-marketplaces
- 插件技术参考（含 plugin.json 完整 schema、版本管理）：https://code.claude.com/docs/en/plugins-reference
- 插件依赖与 semver 约束：https://code.claude.com/docs/en/plugin-dependencies
- 发现与安装插件（安装/更新机制）：https://code.claude.com/docs/en/discover-plugins

### 1.1 plugin.json schema

位置：插件根目录下 `.claude-plugin/plugin.json`。manifest 本身**可选**——省略时 Claude Code 自动发现默认位置的组件并从目录名派生插件名；需要元数据或自定义组件路径时才提供。

**必需字段**（只要提供 manifest）：仅 `name` 一个（kebab-case，无空格/控制字符/双向格式字符；用作组件命名空间，如 `/plugin-name:skill-name`）。

**元数据字段（可选）**：

| 字段 | 类型 | 说明 |
|---|---|---|
| `$schema` | string | JSON Schema URL，仅供编辑器补全；加载时忽略 |
| `displayName` | string | UI 展示名，可含空格；不参与命名空间/查找 |
| `version` | string | 语义化版本。**设置后即以此字符串 pin 插件**：用户只有在该字段变化时才收到更新（command source 除外）。marketplace 条目里也设置时，plugin.json 优先 |
| `description` / `homepage` / `repository` / `license` / `keywords` | — | 常规元数据；license 为 SPDX 标识 |
| `author` | object | `name` 必需；`email`、`url` 可选 |
| `metadata` | object | 自由字段，Claude Code 不读取 |
| `defaultEnabled` | boolean | 安装后默认是否启用（默认 true）；marketplace 条目中的同名字段优先 |

**组件路径字段（可选）**：`skills`（string|array，向默认 `skills/` 扫描*追加*）、`commands`、`agents`、`workflows`、`outputStyles`（这四类*替换*默认目录）、`hooks`、`mcpServers`、`lspServers`（string|array|object，可内联配置）、`experimental.themes`、`experimental.monitors`、`userConfig`（启用时向用户询问的配置项，sensitive 值进 Keychain）、`channels`（消息注入通道，绑定插件自带 MCP server）、`dependencies`（插件间依赖，见 1.5）。

**未识别字段**：顶层未识别字段被忽略，插件照常加载——官方明确说这使得一份 manifest 可以同时兼任 VS Code/Cursor 扩展 manifest、npm package.json 或 MCPB/DXT bundle manifest。`claude plugin validate` 对未识别字段只报 warning（`--strict` 时视为 error）。

来源：https://code.claude.com/docs/en/plugins-reference#plugin-manifest-schema

### 1.2 插件可以包含什么（目录约定）

全部位于插件根目录（不是 `.claude-plugin/` 内；`.claude-plugin/` 里只放 plugin.json）：

| 目录/文件 | 内容 |
|---|---|
| `skills/` | 技能，`<name>/SKILL.md` 目录形式；单技能插件可把 `SKILL.md` 直接放插件根 |
| `commands/` | 扁平 Markdown 文件形式的技能（旧式，新插件建议用 `skills/`） |
| `agents/` | 子代理定义（Markdown + frontmatter：name/description/model/effort/maxTurns/tools/disallowedTools/skills/memory/background/isolation；plugin 代理不支持 hooks/mcpServers/permissionMode） |
| `hooks/hooks.json` | 事件钩子（SessionStart、PreToolUse、PostToolUse 等约 30 种事件；类型：command/http/mcp_tool/prompt/agent） |
| `.mcp.json` | MCP server 配置 |
| `.lsp.json` | LSP server 配置（不含 server 二进制本身，用户需另行安装） |
| `monitors/monitors.json` | 后台监视器（实验性） |
| `themes/` | 颜色主题（实验性） |
| `bin/` | 可执行文件，插件启用时加入 Bash 工具的 PATH |
| `settings.json` | 插件级默认设置（当前仅支持 `agent`、`subagentStatusLine` 键） |

来源：https://code.claude.com/docs/en/plugins#plugin-structure-overview

### 1.3 marketplace.json schema

位置：marketplace 仓库根的 `.claude-plugin/marketplace.json`。

**必需字段**：
- `name`（kebab-case marketplace 标识；官方保留名如 `claude-plugins-official`、`agent-skills` 等第三方不可用）
- `owner`（object：`name` 必需，`email`/`url` 可选）
- `plugins`（数组）

**可选字段**：`$schema`、`description`、`version`、`metadata.pluginRoot`（裸插件名的解析目录，需 CC v2.1.239+）、`allowCrossMarketplaceDependenciesOn`（允许跨 marketplace 依赖的白名单）、`renames`（插件改名/删除时的迁移映射，v2.1.193+）。

**插件条目（plugins[] 元素）**：必需 `name` + `source`；可选地可带 plugin manifest schema 里的任意字段（description/version/author/commands/hooks 等），外加 marketplace 专有字段 `category`、`tags`、`strict`、`relevance`、`headers`、`headersHelper`、`defaultEnabled`。

`strict` 模式：`true`（默认）时 plugin.json 是组件定义的权威，marketplace 条目可补充；`false` 时 marketplace 条目即插件的全部定义（插件可不带 plugin.json）。

**source 类型**（插件来源；注意与"marketplace 来源"是两个概念）：

| source | 字段 | 说明 |
|---|---|---|
| 相对路径 string | `"./plugins/x"` | marketplace 仓库内目录 |
| `github` | `repo`, `ref?`, `sha?` | GitHub `owner/repo` |
| `url` | `url`, `ref?`, `sha?` | 任意 git URL |
| `git-subdir` | `url`, `path`, `ref?`, `sha?` | monorepo 子目录，稀疏克隆 |
| `npm` | `package`, `version?`, `registry?` | npm 包，version 支持 semver range（如 `^2.0.0`） |
| `archive` | `url`, `sha256?` | HTTPS zip（v2.1.224+）；sha256 做完整性校验，也可充当版本 |
| `command` | `command`, `timeout?`, `mode?` | 本地命令产出插件目录，每会话重跑一次（v2.1.229+）；`mode: copy|link` |

git 系 source 同时给 `ref` 和 `sha` 时以 `sha` 为准。

来源：https://code.claude.com/docs/en/plugin-marketplaces

### 1.4 安装与更新机制

- **添加 marketplace**：`/plugin marketplace add <owner/repo | git URL | 本地路径 | marketplace.json URL>`；可加 `#ref` 指定分支/tag。官方 marketplace `claude-plugins-official` 首次交互启动时自动注册；社区 marketplace `anthropics/claude-plugins-community` 手动添加。
- **安装**：`/plugin install <plugin>@<marketplace>`，选 user / project / local / managed 四种 scope；安装即复制到本地版本化缓存 `~/.claude/plugins/cache`（command source 的 link 模式除外，原地使用）。安装带 `@marketplace` 名时会先刷新该 marketplace 目录。
- **版本解析与更新信号**：版本即缓存键（缓存目录按解析版本命名），解析链按优先级——① plugin.json 的 `version`（优先于 marketplace 条目）→ ② marketplace 条目 `version` → ③ 回退：git 系 source 用 commit SHA（每个 commit 视为新版本）、archive source 用 `sha256`、command copy 模式用目录内容 hash、link 模式用路径+顶层条目派生。设了 `version` 时插件被 pin 在该字符串上，**只有 version 变化才触发更新**。来源：https://code.claude.com/docs/en/plugins-reference#plugin-caching-and-file-resolution 、https://code.claude.com/docs/en/plugin-marketplaces#zip-archives
- **版本锁定手段**：作者设 `version`；marketplace 条目给 git source 设 `ref`/`sha`；用户关 auto-update 或设 `DISABLE_AUTOUPDATER`；依赖方用 semver range 钉区间；社区 marketplace 审核插件 pin commit SHA、CI 自动前移。
- **更新**：`/plugin marketplace update <name>` 刷新目录；`claude plugin update <plugin>@<marketplace>` 更新单个插件。后台自动更新：会话启动后随机延迟（≤10 分钟）检查 marketplace 与已装插件更新；**官方 marketplace 默认开启自动更新，第三方/本地 marketplace 默认关闭**；`DISABLE_AUTOUPDATER` 可全局关闭，`FORCE_AUTOUPDATE_PLUGINS=1` 可只保留插件自动更新。
- **版本固定**：git 系 source 可用 `ref`（branch/tag）和 `sha`（精确 commit）pin；`claude plugin tag --push` 按 `{plugin-name}--v{version}` 约定打 tag 供依赖解析（见 1.5）。
- **社区 marketplace 审核**：提交经 `claude plugin validate` + 自动安全筛查；通过的插件在目录中 pin 到具体 commit SHA，作者推新 commit 时 CI 自动前移 pin。

来源：https://code.claude.com/docs/en/discover-plugins 、https://code.claude.com/docs/en/plugins#submit-your-plugin-to-the-community-marketplace

### 1.5 semver 与依赖声明（plugin 间）

- `plugin.json` 的 `dependencies` 数组：元素可为裸名字符串（跟随 marketplace 提供的最新版）或对象 `{ "name": "...", "version": "~2.1.0", "marketplace": "..." }`。
- `version` 是 **npm node-semver range**（`~2.1.0`、`^2.0`、`>=1.4`、`=2.1.0`；pre-release 需显式 opt-in 如 `^2.0.0-0`）。
- 解析：对 git 系 source，按 `{plugin-name}--v{version}` git tag 约定列出可用版本，取满足 range 的最高版本；多个插件约束同一依赖时取 range 交集，无法满足报 `range-conflict`。npm/archive/command source 的依赖不做 tag 解析，仅在加载时校验已装版本是否满足约束。
- 跨 marketplace 依赖默认拒绝，需根 marketplace 在 `allowCrossMarketplaceDependenciesOn` 中白名单。
- 也支持"bundle 插件"：manifest 只含 `dependencies`，一键安装一整套。

来源：https://code.claude.com/docs/en/plugin-dependencies

### 1.6 Claude Code 侧未查到官方资料的项

- 插件自身 `version` 是否做 semver 格式校验（文档称 "Semantic version"，但更新按字符串变化触发，未见格式校验明文）。
- 用户侧按版本号安装历史版本/回滚的官方命令。
- plugins-reference 页面 "Version management" 小节的逐字原文（页面过长抓取截断；上述解析链由官方页面其他小节明文逐环拼合，顺序有二手来源印证）。

## 2. Codex（OpenAI）的技能/扩展分发

> 详细一手笔记另见 `docs/research/ai-cli-host-skill-distribution.md`（同批调研产出）。

- **有官方技能格式**：Codex 于 2025 年底以 experimental 引入 skills（[OpenAI 官方论坛公告](https://community.openai.com/t/skills-for-codex-experimental-support-starting-today/1369367)），现已正式化。Skill = 含 `SKILL.md`（frontmatter 需 `name`/`description`）的目录 + 可选 `scripts/`、`references/`、`assets/`、`agents/openai.yaml`（UI 元数据、`allow_implicit_invocation`、MCP 依赖），遵循 Agent Skills 开放标准（agentskills.io）。来源：[developers.openai.com/codex/skills](https://developers.openai.com/codex/skills)
- **目录组织**：skills 不在 `~/.codex` 下，而在 `.agents/skills`（repo 各级）、`~/.agents/skills`（user 级）、`/etc/codex/skills`（admin 级）。`~/.codex`（=CODEX_HOME）放 `config.toml`、`auth.json`、`prompts/`（自定义 slash prompt，只扫顶层 .md）。单个技能开关用 config.toml 的 `[[skills.config]]`。来源：[Advanced Config](https://learn.chatgpt.com/docs/config-file/config-advanced)、[Custom Prompts](https://learn.chatgpt.com/docs/custom-prompts)
- **Registry/marketplace**：有。ChatGPT/Codex 共用 universal plugin directory；CLI 内 `/plugins` 浏览器按 marketplace 分组安装；marketplace 来源含 OpenAI 官方、workspace 同步的 GitHub repo marketplace、个人 marketplace。版本元数据在 plugin manifest + marketplace 条目上，**skill 本身无版本字段**。来源：[developers.openai.com/codex/plugins](https://developers.openai.com/codex/plugins)。官方技能仓库 [openai/skills](https://github.com/openai/skills)（已 deprecated，迁移至 openai/plugins）。

## 3. 其他宿主

### 3.1 Kimi Code（Moonshot AI）

- 有官方 CLI：[MoonshotAI/kimi-cli](https://github.com/MoonshotAI/kimi-cli)；文档站 kimi.com/code/docs。
- Plugin manifest：`kimi.plugin.json` 或 `.kimi-plugin/plugin.json`，字段含 name/version/skills/agents/sessionStart.skill/systemPrompt(Path)/mcpServers/hooks/commands；Skill = 标准 `SKILL.md`。
- **有 marketplace**：`/plugins` 四页签（Installed/Official/Curated/Custom）；自定义 marketplace JSON 格式 `{"version":"2","plugins":[{id,displayName,source}]}`，可用环境变量 `KIMI_CODE_PLUGIN_MARKETPLACE_URL` 覆盖；GitHub URL 安装支持 pin branch/tag/commit；安装复制到 `$KIMI_CODE_HOME/plugins/managed/<id>/`。
- 来源：[Plugins | Kimi Code Docs](https://www.kimi.com/code/docs/en/kimi-code-cli/customization/plugins)

### 3.2 Gemini CLI（Google）

- 扩展机制：`gemini-extension.json`（字段：name/version/mcpServers/contextFileName/excludeTools + `${extensionPath}` 等变量）；扩展内 `commands/` 放 TOML 自定义命令，冲突时降级为 `/<ext>.<cmd>`；安装于 `~/.gemini/extensions/`。来源：[Extensions docs](https://google-gemini.github.io/gemini-cli/docs/extensions/)
- 自定义 commands：TOML 文件，`~/.gemini/commands/`（全局）+ `<project>/.gemini/commands/`（项目优先），子目录即命名空间。来源：[Custom Commands](https://google-gemini.github.io/gemini-cli/docs/cli/custom-commands.html)
- **无官方 registry/marketplace**：分发 = git 仓库（`--ref` 指定 branch/tag/commit，HEAD 即最新版）或 GitHub Releases（**明确不支持 semver/预发布**；平台归档命名 `{platform}.{arch}.{name}.{ext}`）。第一方扩展在 GitHub 组织 `gemini-cli-extensions`。来源：[Extension Releasing](https://google-gemini.github.io/gemini-cli/docs/extensions/extension-releasing.html)

### 3.3 opencode（SST）

- Plugin = JS/TS 模块（hooks + 自定义 tool，Zod schema）；加载自 `.opencode/plugins/`、`~/.config/opencode/plugins/` 或 `opencode.json` 的 `plugin` npm 包数组（Bun 自动安装，缓存 `~/.cache/opencode/node_modules/`）。来源：[opencode.ai/docs/plugins](https://opencode.ai/docs/plugins/)
- Agents/Commands = Markdown frontmatter 文件，分别放 `agents/`、`commands/`（全局 `~/.config/opencode/` 或项目 `.opencode/`）。来源：[Agents](https://opencode.ai/docs/agents/)、[Commands](https://opencode.ai/docs/commands/)
- **无官方 registry/marketplace**；ecosystem 页仅社区展示；版本 = npm semver。

### 3.4 DeepSeek Harness（DSH）

**未查到公开官方资料**（内部工具，公开网络无官方文档/仓库/打包机制一手资料）。

## 4. 跨宿主技能分发的既有实践

### 4.1 obra/superpowers（14 宿主的单仓库多 manifest 模式）

来源：[github.com/obra/superpowers](https://github.com/obra/superpowers)（[README](https://raw.githubusercontent.com/obra/superpowers/main/README.md)）

- **分发**：一个 git 仓库内同时携带多种宿主的薄 manifest，各宿主用各自安装机制指向同一个 repo：
  - Claude Code：`.claude-plugin/plugin.json`；经官方 marketplace（`superpowers@claude-plugins-official`）或自建 marketplace（`obra/superpowers-marketplace`）安装。
  - Gemini CLI：`gemini-extension.json` + `gemini extensions install <repo URL>`。
  - Codex：上架 OpenAI 官方 marketplace（openai/plugins）；Kimi：官方 marketplace；Cursor / Copilot CLI / Grok / Devin / Factory Droid / Hermes / Antigravity 各有 plugin 命令；opencode（无插件机制）走 prompt-driven 安装（agent 抓 `.opencode/INSTALL.md` 自行执行）。
- **manifest 原文**：plugin.json 极简（name/description/version/author/homepage/repository/license/keywords，无 dependencies）；gemini-extension.json 仅 4 字段。自建 marketplace.json 含 `owner`、`metadata.version`、plugins[]（name/source/description/version/strict），git source 可带 `ref`。原文：[plugin.json](https://raw.githubusercontent.com/obra/superpowers/main/.claude-plugin/plugin.json)、[marketplace.json](https://raw.githubusercontent.com/obra/superpowers-marketplace/main/.claude-plugin/marketplace.json)、[gemini-extension.json](https://raw.githubusercontent.com/obra/superpowers/main/gemini-extension.json)
- **版本**：同一版本号（如 6.3.0）在多处 manifest 重复声明。
- **更新**：README 只有一句 "updates are somewhat coding-agent dependent, but are often automatic"——完全交给各宿主机制；**无自带跨宿主更新检查器**。
- **适配要点**：宿主差异集中在 hook 支持度（如 Antigravity 有 session-start hook、Hermes 无 post-compaction hook）；要求"任何 skill 更新须在全部支持宿主上工作"，并用 eval harness 测技能行为。

### 4.2 gstack（garrytan/gstack：单源 + 生成器模式）

来源：[github.com/garrytan/gstack](https://github.com/garrytan/gstack)（[README](https://raw.githubusercontent.com/garrytan/gstack/main/README.md)、[package.json](https://raw.githubusercontent.com/garrytan/gstack/main/package.json)）

- **分发**：不用 plugin manifest，走 `git clone --depth 1 ... ~/.claude/skills/gstack && ./setup` 直装 skills 目录；`./setup --host <name>` 适配 10 个宿主（Codex→`${CODEX_HOME}/skills/`、opencode→`~/.config/opencode/skills/`、Cursor、Droid、Kiro 等各有路径）。
- **manifest = package.json + setup 脚本内的宿主配置表**：version 1.79.0，`engines: {"bun": ">=1.0.0"}`，运行依赖用 npm semver range（`^1.62.1` 等）。
- **跨宿主核心机制**：`scripts/gen-skill-docs.ts` 从单源按宿主生成变体（对 Codex 还会读 config.toml 的 model 生成匹配的行为 profile）；新增宿主 = 一个 TypeScript 配置文件（docs/ADDING_A_HOST.md），零代码改动。另有"instruction-only 最低档"：2KB 的 `agents-digest/gstack-AGENTS.md` 追加进任何会读规则文件的 agent。
- **更新检查（对 M18 最有参考价值）**：通过注册到 `~/.claude/settings.json` 的 **SessionStart hook 做自动更新检查，节流 1 次/小时、网络失败静默**；手动更新用 `/gstack-upgrade` 技能（识别全局 vs vendored 安装并同步）。

### 4.3 跨宿主事实标准与安装器生态

- **SKILL.md（Agent Skills 开放规范）已成跨宿主事实标准**：[agentskills.io/specification](https://agentskills.io/specification)（Anthropic 原创、社区共管）。技能 = 目录 + `SKILL.md`（frontmatter 必填仅 `name`/`description`；可选 license/compatibility/metadata/allowed-tools），progressive disclosure 加载，官方校验器 `skills-ref validate`。20+ 宿主采用（Claude Code、Codex、Cursor、Gemini CLI、Goose、opencode 等）。**注意：规范无版本约束/依赖声明字段**——版本只能塞 `metadata.version`，依赖只能写 `compatibility` 自然语言。
- **skills.sh / `npx skills`（Vercel labs）**：最大的跨宿主安装器与 registry，`npx skills add <owner/repo>`；自动检测本机宿主并按 70+ 宿主路径表落盘（symlink 或 copy）；发现时扫描 60+ 约定位置，**还兼容解析 `.claude-plugin/marketplace.json` / `plugin.json` 里声明的 skills**；`npx skills update` 手动更新；**未查到版本 pinning/semver range 语法**。兼容性矩阵：basic skills 全宿主可用，`allowed-tools` 大部分支持，`context: fork` 与 hooks 基本只有 Claude Code。来源：[skills.sh](https://skills.sh/)、[vercel-labs/skills README](https://raw.githubusercontent.com/vercel-labs/skills/main/README.md)
- **vercel-labs/agent-skills**：main 分支每次变更发布 immutable GitHub release（discovery index + 每技能一个 artifact），是"用 GitHub release 做技能工件分发"的范本。来源：[README](https://raw.githubusercontent.com/vercel-labs/agent-skills/main/README.md)
- **AGENTS.md**：项目级指令跨工具标准（60k+ 项目，Linux 基金会 Agentic AI Foundation 托管），无版本/依赖概念。来源：[agents.md](https://agents.md/)
- **官方技能转换器不存在**：Anthropic/OpenAI/Google 均未出品 Claude→Codex/Gemini 转换器，只有社区方案；转换难点不在文本格式而在宿主能力面（hooks、allowed-tools、fork、生命周期）。

## 5. semver 依赖声明的通行做法

1. **机器可解的插件间依赖目前只有 Claude Code 一家做到**：`plugin.json` 的 `dependencies` 数组（裸名或 `{name, version, marketplace}`），version 用 **npm node-semver range**（官方链接 [npm/node-semver#ranges](https://github.com/npm/node-semver#ranges)），git 源按 `{plugin-name}--v{version}` tag 约定解析、多约束取区间交集、预发布需 opt-in。详见 1.5。来源：https://code.claude.com/docs/en/plugin-dependencies
2. **`engines` 类宿主版本约束无先例**：Claude Code plugin.json 无 `engines` 字段；对外部 CLI 工具的依赖，生态现状是写 README 或 SKILL.md 的 `compatibility` 自然语言（如 "Requires git, docker, jq"），或 package.json 的 `engines`（gstack 的 `{"bun": ">=1.0.0"}`）。
3. **SKILL.md 层无机器可解依赖**：Agent Skills 规范无 dependencies/version-range 字段；skills.sh 无版本约束语法；superpowers 实际未用 dependencies 字段。
4. **包管理生态惯例**（可作设计参照）：npm `dependencies` + caret/tilde range + `engines`（[npm semver 文档](https://docs.npmjs.com/cli/v6/using-npm/semver/)）；Cargo version requirement 默认 caret（[The Cargo Book](https://doc.rust-lang.org/cargo/reference/specifying-dependencies.html)）；Homebrew `depends_on` DSL（[Formula Cookbook](https://docs.brew.sh/Formula-Cookbook)）。共性：**manifest 字段 + semver range + lockfile/解析器**。
5. **对"skill 依赖外部 broker 工具"的场景**（如 workflowhub 依赖 3rd-review broker）：生态内无现成的机器可解先例；最接近的做法是 (a) Claude Code plugin.json `dependencies`（若依赖也是插件）、(b) `compatibility` 自然语言 + 安装脚本运行时探测版本、（c) package.json `engines` 风格声明由接入脚本校验。

## 6. 对 workflowhub M18 的启示

### 6.1 Manifest 字段建议

1. **以 Claude Code plugin.json schema 为分发 manifest 基准**。理由：它是生态中字段最完整的格式（1.1），且已被第三方跨宿主工具显式兼容（skills.sh 安装时会解析 `.claude-plugin/plugin.json` / `marketplace.json` 里声明的 skills，见 4.3）。workflowhub 按此格式落 `.claude-plugin/plugin.json`，可同时被 Claude Code 原生 `/plugin install` 和 skills.sh 生态消费，一份投入两处收益。
2. **最小字段集**：`name`（唯一必需，kebab-case，决定命名空间）、`version`（semver 字符串，唯一更新信号）、`description`、`author`、`homepage`/`repository`/`license`、`keywords`；组件路径默认放 `skills/` 即可，不必声明。
3. **workflowhub 自有字段直接塞进同一 manifest 是安全的**：Claude Code 官方明确忽略未识别顶层字段，并鼓励"一份 manifest 兼任多生态 manifest"（1.1，来源：https://code.claude.com/docs/en/plugins-reference#unrecognized-fields ）。建议自有扩展放 `metadata`（官方承诺不读取的自由对象）或带 `x-`/项目前缀的顶层字段，避免与未来官方字段撞名。
4. **external skills manifest（技能层）**：技能目录保持 Agent Skills 开放规范（SKILL.md + frontmatter，必填仅 `name`/`description`）——这是 Codex、Kimi、Gemini、opencode 等 20+ 宿主的共同交集（4.3）。**规范本身没有版本和依赖字段**：版本放 frontmatter `metadata.version`，环境要求写 `compatibility` 自然语言；不要发明与之冲突的顶层 frontmatter 字段。
5. **marketplace.json 采用 Claude Code 格式**（`name`/`owner`/`plugins[]`，条目 `name`+`source`，见 1.3）：Kimi 自定义 marketplace（`{"version":"2","plugins":[...]}`）和 Codex repo marketplace 都是同构轻量 JSON， Claude Code 格式是其中表达力最强且有第三方兼容者的；source 用 `{"source":"github","repo":"...","ref":...}` 或 `git-subdir`（monorepo 场景）即可获得 ref/sha pinning。

### 6.2 更新检查做法

生态里存在三种已验证模式，建议 M18 分层组合：

1. **宿主有 marketplace 的，交给宿主**：Claude Code 后台自动更新（按 marketplace 粒度开关、官方默认开/第三方默认关、`version` 字符串变化为触发条件，见 1.4）；Kimi/Codex 各有 marketplace。workflowhub 只需保证发版时 bump `version`。
2. **宿主无关的兜底：SessionStart hook 节流检查（gstack 模式，4.2）**：向宿主的 settings/hook 注册一个启动钩子，节流（如 1 次/小时）、网络失败静默、只提示不自动替换。这是"记录事实而非阻断"的宪法原则在更新检查上的自然映射——检查到新版只浮现事实，升级动作经人确认。
3. **手动通道**：提供 `update` 命令或技能（gstack 的 `/gstack-upgrade`、skills.sh 的 `npx skills update`），能识别全局安装 vs 项目 vendored 安装并分别同步。
4. **版本号单一事实源**：superpowers 同一版本号在 plugin.json/gemini-extension.json/marketplace.json 多处手写（4.1）是已知痛点；建议版本只维护一处（如 plugin.json 或 package.json），其余 manifest 由生成器/发布脚本同步（gstack 的 gen-skill-docs 单源生成模式）。
5. **发版 tag 遵循 `{plugin-name}--v{version}` 约定**（1.5）：零成本，一旦 workflowhub 插件进入 Claude Code 依赖链即可被 semver range 解析；`claude plugin tag --push` 会校验 tag 与 plugin.json version 一致，可纳入 CI。

### 6.3 多宿主分发的最小可行形态

综合 superpowers（4.1）、gstack（4.2）、skills.sh（4.3）三种模式，MVP 形态：

```
workflowhub 仓库
├── skills/<name>/SKILL.md          # Agent Skills 标准，跨宿主内容层（单一事实源）
├── .claude-plugin/
│   ├── plugin.json                  # Claude Code 原生 + skills.sh 兼容
│   └── marketplace.json             # （或拆独立 marketplace 仓）目录与 source 声明
├── gemini-extension.json            # 可选，4 个字段
└── bin/install 或 setup 脚本         # 一键接入：检测宿主 → 按路径表落盘
```

- **内容层零适配**：SKILL.md 全宿主可读；能力差异（hooks、`allowed-tools`、fork、生命周期事件）按 skills.sh 兼容矩阵降级——只有 Claude Code 全量支持，其余宿主只承诺 basic skills 子集（4.3）。
- **宿主适配收敛为一张配置表**：宿主名 → skills 目录路径（Claude Code→`.claude/skills/`、Codex→`~/.agents/skills/`（注意不是 `~/.codex`，见第 2 章）、Kimi→`$KIMI_CODE_HOME/...`、opencode→`~/.config/opencode/skills/`、Gemini→`~/.gemini/skills/`）；新增宿主 = 加一行配置，不写代码（gstack 的 ADDING_A_HOST 模式）。DSH 未查到公开资料，作为自家宿主自行登记路径即可。
- **安装方式 symlink 优先**（单一事实源、升级即生效），copy 兜底；检测宿主用"该宿主配置目录是否存在"（skills.sh 的自动检测方式）。
- **最低档 instruction-only**：对无插件机制的宿主，提供一段可追加进 AGENTS.md/CLAUDE.md 的 digest（gstack 的 agents-digest 模式，2KB 内、首行标注版本）。
- **一键接入脚本**的职责边界：探测宿主 → 落盘/symlink → 注册更新检查 hook → 探测并校验外部依赖版本（见 6.4）→ 打印事实报告。不可逆动作（覆盖已有文件、写 settings）前经人确认。

### 6.4 semver 与外部依赖声明（3rd-review broker 场景）

1. **机器可解的插件间 semver 依赖目前只有 Claude Code 一家**（plugin.json `dependencies` + node-semver range + git tag 解析，见 1.5/5.1）。若 broker 也被打包为 Claude Code 插件，直接在 plugin.json 里声明 `{"name":"3rd-review-broker","version":"^x.y.z"}` 即可获得解析、区间交集与冲突报错。
2. **broker 不是插件（独立 CLI 工具）时，生态无现成的机器可解先例**（5.2/5.3）。建议组合：
   - manifest 中用 npm `engines` 风格声明，如 `"engines": {"3rd-review-broker": ">=1.2.0"}`（放在 `metadata` 或自有顶层字段，对 Claude Code 无害）；
   - 接入脚本与 SessionStart hook **运行时探测** broker 实际版本（`broker --version`）并对照约束，不满足时报告 `unknown`/`incomplete` 事实而非伪造通过——符合宪法"质量缺失保持 unknown，不能伪造通过"。
3. **版本约束语法直接用 npm node-semver range**（`^`/`~`/`>=`/`=`）：它是本生态（Claude Code dependencies、npm source、opencode 插件）唯一通行的 range 方言，避免自造语法。
4. **预发布版本默认排除、需显式 opt-in**（如 `^2.0.0-0`）是 node-semver 与 Claude Code 共同语义，声明 broker 约束时沿用。

### 6.5 风险与开放问题

- **Gemini CLI 明确不支持 semver**（git ref 即版本，3.2）：对 Gemini 宿主不要承诺版本语义，分发走 git tag ref。
- **插件自身 version 是否被 Claude Code 做 semver 格式校验：未查到官方资料**（1.6）——workflowhub 应自行在 CI 校验 version 为合法 semver，不依赖宿主。
- **跨宿主官方转换器不存在**（4.3）：不要计划"写一次 Claude 插件自动转换到 Codex"的方案；正确姿势是内容层用 Agent Skills 标准 + 每宿主薄 manifest。
- **skills.sh 无版本 pinning**：若经 skills.sh 分发，版本保证只能靠 git tag 与 release artifact（可参考 vercel-labs/agent-skills 的 immutable GitHub release + discovery index 模式，4.3）。
