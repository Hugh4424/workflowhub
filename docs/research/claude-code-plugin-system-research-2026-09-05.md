# Claude Code 插件体系调研笔记（官方一手资料）

> 调研日期：2026-09-05。资料以 code.claude.com / docs.claude.com 官方文档为准，GitHub `anthropics/claude-code` 仓库为辅。每条事实后标注来源 URL。
> 说明：plugins-reference 页面较长，web 抓取在该页尾部（"Node.js package dependencies" 小节之后，含 Version management 小节正文、CLI 命令逐条参考、file locations reference 等）被截断。Version management 的完整解析链未抓到原文逐字内容，但其每个环节均在官方页面其它位置有明文表述（下文逐条标注），解析顺序另有一个二手来源交叉印证，已注明。

## 0. 官方文档页面索引

- 创建插件：<https://code.claude.com/docs/en/plugins>
- 插件技术参考（plugin.json schema、组件、缓存、版本管理）：<https://code.claude.com/docs/en/plugins-reference>
- 创建/分发 marketplace（marketplace.json schema）：<https://code.claude.com/docs/en/plugin-marketplaces>
- 发现与安装插件（安装/更新机制）：<https://code.claude.com/docs/en/discover-plugins>
- 插件依赖与版本约束（git tag 解析）：<https://code.claude.com/docs/en/plugin-dependencies>
- 官方示例插件与目录结构：<https://github.com/anthropics/claude-code/blob/main/plugins/README.md>

---

## 1. plugin.json 官方 schema

**位置**：`<插件根>/.claude-plugin/plugin.json`。**manifest 本身是可选的**：省略时 Claude Code 按默认目录自动发现组件，并从目录名推导插件名。（来源：<https://code.claude.com/docs/en/plugins-reference#plugin-manifest-schema>）

**必需字段**：写了 manifest 时，`name` 是唯一必需字段。`name` 为 kebab-case 唯一标识，不允许空格、控制字符、双向格式字符；用于组件命名空间（如 `plugin-dev:agent-creator`）。若 marketplace 条目里用不同名字列出该插件，则以 marketplace 条目名为准。（来源：<https://code.claude.com/docs/en/plugins-reference#required-fields>）

**元数据字段（全部可选）**（来源：<https://code.claude.com/docs/en/plugins-reference#metadata-fields>）：

| 字段 | 类型 | 含义 |
|---|---|---|
| `$schema` | string | 编辑器自动补全用的 JSON Schema URL，Claude Code 加载时忽略 |
| `displayName` | string | UI 展示名；省略时回退到 `name`；可含空格，不参与命名空间 |
| `version` | string | 语义化版本；设置后插件被"钉"在该字符串上，只有 bump 它用户才收到更新（`command` source 除外）；marketplace 条目也设置时 **plugin.json 优先**；省略则走版本管理解析链的下一来源 |
| `description` | string | 插件用途简述 |
| `author` | object | `{name, email, url}` |
| `homepage` | string | 文档 URL |
| `repository` | string | 源码 URL |
| `license` | string | 许可证标识（如 MIT、Apache-2.0） |
| `keywords` | array | 发现/分类标签 |
| `metadata` | object | 自由格式对象，Claude Code 不读取；非对象值被忽略并告警 |
| `defaultEnabled` | boolean | 安装后默认是否启用，默认 `true`；用户的 `enabledPlugins` 设置和依赖要求优先于它 |

**组件路径字段（全部可选）**（来源：<https://code.claude.com/docs/en/plugins-reference#component-path-fields>）：

| 字段 | 类型 | 含义 |
|---|---|---|
| `skills` | string\|array | 自定义 skill 目录（含 `<name>/SKILL.md`）；**追加**到默认 `skills/` 扫描 |
| `commands` | string\|array | 扁平 `.md` skill 文件/目录；**替换**默认 `commands/` |
| `agents` | string\|array | 自定义 agent 文件；**替换**默认 `agents/` |
| `workflows` | string\|array | 自定义 workflow 脚本文件/目录；**替换**默认 `workflows/` |
| `hooks` | string\|array\|object | hook 配置路径或内联配置 |
| `mcpServers` | string\|array\|object | MCP 配置路径或内联配置 |
| `outputStyles` | string\|array | output style 文件/目录；**替换**默认 `output-styles/` |
| `lspServers` | string\|array\|object | LSP 配置 |
| `experimental.themes` | string\|array | 颜色主题（experimental） |
| `experimental.monitors` | string\|array | 后台 monitor 配置（experimental） |
| `userConfig` | object | 启用插件时向用户提示收集的配置值 |
| `channels` | array | 消息通道声明（绑定插件自带 MCP server） |
| `dependencies` | array | 依赖的其它插件，可带 semver 约束，如 `[{"name":"secrets-vault","version":"~2.1.0"}]` |

路径规则：所有路径必须相对于插件根且以 `./` 开头（`skills` 也接受 `"."`）；`commands`/`agents`/`workflows`/`outputStyles`/`experimental.*` 为替换语义，`skills` 为追加语义；hooks/MCP/LSP 有各自合并规则。（来源：<https://code.claude.com/docs/en/plugins-reference#path-behavior-rules>）

**未识别字段**：顶层未识别字段被忽略，`claude plugin validate` 报 warning 不报 error（`--strict` 可把 warning 升为 error）；已识别字段类型错误时大多数字段导致插件加载失败，`experimental`/`metadata` 仅告警。（来源：<https://code.claude.com/docs/en/plugins-reference#unrecognized-fields>）

官方完整 schema 示例：

```json
{
  "name": "plugin-name",
  "displayName": "Plugin Name",
  "version": "1.2.0",
  "description": "Brief plugin description",
  "author": {"name": "Author Name", "email": "author@example.com", "url": "https://github.com/author"},
  "homepage": "https://docs.example.com/plugin",
  "repository": "https://github.com/author/plugin",
  "license": "MIT",
  "keywords": ["keyword1", "keyword2"],
  "metadata": {"catalogId": "cat-123", "tier": "pro"},
  "skills": "./custom/skills/",
  "commands": ["./custom/commands/special.md"],
  "agents": ["./custom/agents/reviewer.md"],
  "hooks": "./config/hooks.json",
  "mcpServers": "./mcp-config.json",
  "outputStyles": "./styles/",
  "lspServers": "./.lsp.json",
  "experimental": {"themes": "./themes/", "monitors": "./monitors.json"},
  "dependencies": ["helper-lib", {"name": "secrets-vault", "version": "~2.1.0"}]
}
```

（来源：<https://code.claude.com/docs/en/plugins-reference#complete-schema>）

---

## 2. marketplace.json 官方 schema

**位置**：仓库根的 `.claude-plugin/marketplace.json`。（来源：<https://code.claude.com/docs/en/plugin-marketplaces#create-the-marketplace-file>）

**必需字段**（来源：<https://code.claude.com/docs/en/plugin-marketplaces#required-fields>）：

| 字段 | 类型 | 含义 |
|---|---|---|
| `name` | string | marketplace 标识，kebab-case；用户侧可见（`/plugin install my-tool@your-marketplace`）；同名再 add 会替换前者。有一组官方保留名（`claude-plugins-official`、`claude-community` 等）第三方不可用 |
| `owner` | object | 维护者信息：`name` 必需，`email`、`url` 可选 |
| `plugins` | array | 插件条目列表 |

**可选字段**（来源：<https://code.claude.com/docs/en/plugin-marketplaces#optional-fields>）：`$schema`、`description`、`version`（marketplace 清单版本）、`metadata.pluginRoot`（裸插件名的解析根目录，需 v2.1.239+）、`allowCrossMarketplaceDependenciesOn`（允许跨 marketplace 依赖的白名单）、`renames`（插件改名/移除迁移表，需 v2.1.193+）。`description`/`version` 也接受放在 `metadata` 下（向后兼容）。

**插件条目（plugins[]）**（来源：<https://code.claude.com/docs/en/plugin-marketplaces#plugin-entries>）：

- 必需：`name`（kebab-case）、`source`。
- 可带 plugin.json 的任意字段（`description`、`version`、`author`、`commands`、`hooks` 等），外加 marketplace 专属字段：`category`、`tags`、`strict`（默认 true：plugin.json 是组件定义的权威来源，marketplace 条目只补充；false：marketplace 条目即完整定义）、`relevance`、`defaultEnabled`、`headers`、`headersHelper`（archive 下载鉴权）。

**source 的类型**（来源：<https://code.claude.com/docs/en/plugin-marketplaces#plugin-sources>）：

| source | 形式 | 字段 | 说明 |
|---|---|---|---|
| 相对路径 | string，如 `"./plugins/my-plugin"` | — | marketplace 仓库内本地目录；必须以 `./` 开头（或配 `metadata.pluginRoot` 后用裸名）；相对 marketplace 根解析 |
| `github` | object | `repo`（必需，owner/repo）、`ref?`（branch/tag）、`sha?`（40 位 commit） | GitHub 仓库 |
| `url` | object | `url`（必需，https:// 或 git@）、`ref?`、`sha?` | 任意 git 仓库 URL |
| `git-subdir` | object | `url`、`path`（必需）、`ref?`、`sha?` | git 仓库内子目录，稀疏克隆；url 也接受 owner/repo 简写 |
| `npm` | object | `package`（必需）、`version?`（版本或范围如 `^2.0.0`）、`registry?` | 经 `npm install` 安装 |
| `archive` | object | `url`（必需，HTTPS zip）、`sha256?` | 无需 git/npm；≤256 MiB；需 v2.1.224+；`sha256` 在无 version 声明时兼任版本号 |
| `command` | object | `command`（必需）、`timeout?`、`mode?`（copy/link） | 本地命令输出插件目录，每会话重跑一次；需 v2.1.229+ |

git 系 source（`github`/`url`/`git-subdir`）：`ref` 与 `sha` 同设时 **`sha` 生效**，直接 fetch 该 commit。

**marketplace 自身（marketplace.json 目录）的添加方式**（区别于插件 source）：GitHub `owner/repo`、git URL（可 `#ref` 指定 branch/tag，但不支持 sha）、本地目录或 marketplace.json 文件路径、远程 marketplace.json 直链 URL。（来源：<https://code.claude.com/docs/en/discover-plugins#add-marketplaces>）

---

## 3. 插件可包含的组件及目录约定

插件 = 一个自包含目录；除 `.claude-plugin/plugin.json` 外所有组件目录都在**插件根**（不要放进 `.claude-plugin/`）。（来源：<https://code.claude.com/docs/en/plugins#plugin-structure-overview>）

| 组件 | 默认位置（插件根下） | 格式 | 来源 |
|---|---|---|---|
| Skills | `skills/<name>/SKILL.md`（多 skill）；或插件根单个 `SKILL.md`（单 skill 插件） | 目录 + SKILL.md（YAML frontmatter + Markdown） | <https://code.claude.com/docs/en/plugins-reference#skills> |
| Commands | `commands/` | 扁平 `.md` 文件（也注册为 skill；新插件建议用 `skills/`） | 同上 |
| Agents（subagents） | `agents/*.md` | Markdown + frontmatter（`name`/`description`/`model`/`effort`/`maxTurns`/`tools`/`disallowedTools`/`skills`/`memory`/`background`/`isolation:"worktree"`；不支持 `hooks`/`mcpServers`/`permissionMode`） | <https://code.claude.com/docs/en/plugins-reference#agents> |
| Hooks | `hooks/hooks.json` 或内联于 plugin.json | 与用户 hooks 同格式的事件匹配配置；hook 类型：`command`/`http`/`mcp_tool`/`prompt`/`agent` | <https://code.claude.com/docs/en/plugins-reference#hooks> |
| MCP servers | `.mcp.json` 或内联于 plugin.json | 标准 MCP 配置；插件启用时自动启动 | <https://code.claude.com/docs/en/plugins-reference#mcp-servers> |
| LSP servers | `.lsp.json` 或内联 plugin.json `lspServers` | `{command, extensionToLanguage, ...}`；二进制需用户另装 | <https://code.claude.com/docs/en/plugins-reference#lsp-servers> |
| Output styles | `output-styles/`（manifest 字段 `outputStyles`） | output style 文件 | <https://code.claude.com/docs/en/plugins-reference#component-path-fields>（output-styles 默认目录亦见于 <https://code.claude.com/docs/en/plugins-reference#edit-reload-and-disable-a-skills-directory-plugin>） |
| Monitors（实验性） | `monitors/monitors.json` 或 `experimental.monitors` | JSON 数组：`name`/`command`/`description` 必需，`when` 可选 | <https://code.claude.com/docs/en/plugins-reference#monitors> |
| Themes（实验性） | `themes/*.json` 或 `experimental.themes` | `{name, base, overrides}` | <https://code.claude.com/docs/en/plugins-reference#themes> |
| Workflows | `workflows/`（manifest 字段 `workflows`） | workflow 脚本 | <https://code.claude.com/docs/en/plugins-reference#component-path-fields> |
| Channels | plugin.json `channels` | 绑定插件自带 MCP server 的消息注入通道 | <https://code.claude.com/docs/en/plugins-reference#channels> |
| 可执行文件 | `bin/` | 插件启用期间加入 Bash 工具 PATH | <https://code.claude.com/docs/en/plugins#plugin-structure-overview> |
| 默认设置 | `settings.json`（插件根） | 目前仅支持 `agent` 与 `subagentStatusLine` 键 | <https://code.claude.com/docs/en/plugins#ship-default-settings-with-your-plugin> |

组件命名空间：skill 为 `/plugin-name:skill-name`；agent 为 `plugin-name:agent-name`。（来源：<https://code.claude.com/docs/en/plugins>）

官方仓库示例结构（commands/agents/skills/hooks/.mcp.json）：<https://github.com/anthropics/claude-code/blob/main/plugins/README.md#plugin-structure>

---

## 4. 安装与更新机制

### 4.1 marketplace 的添加与刷新

- `/plugin marketplace add <源>`（可缩写 `/plugin market`）：注册目录，不装插件。源形式见 §2 末。（来源：<https://code.claude.com/docs/en/discover-plugins#add-marketplaces>）
- `/plugin marketplace update <name>` / `claude plugin marketplace update <name>`：刷新该 marketplace 的插件清单。（来源：<https://code.claude.com/docs/en/discover-plugins#use-cli-commands>）
- `/plugin marketplace remove <name>`：移除 marketplace，并卸载从它安装的所有插件。（来源：同上）
- 安装时若以 `plugin@marketplace` 全名指定，Claude Code 会先刷新该 marketplace 再查找（v2.1.232+；跳过条件：本地/seed marketplace、30 秒内刚刷新过、设了 `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`、被 managed settings 阻止）。只写插件名时不保证刷新。（来源：<https://code.claude.com/docs/en/discover-plugins#install-plugins>）

### 4.2 安装行为与安装位置

- `/plugin install <name>@<marketplace>`：打开详情视图选安装 scope；`claude plugin install` 非交互，默认 user scope，可 `--scope project|local`。（来源：<https://code.claude.com/docs/en/discover-plugins#install-plugins>）
- **scope**：`user`（`~/.claude/settings.json`，默认）、`project`（`.claude/settings.json`，随 git 共享）、`local`（`.claude/settings.local.json`）、`managed`（管理员下发，只读）。（来源：<https://code.claude.com/docs/en/plugins-reference#plugin-installation-scopes>）
- **安装到哪**：marketplace 插件被**复制**到本地版本化缓存 `~/.claude/plugins/cache`（按 marketplace/插件/版本分目录；`command` source 的 link 模式例外，原地使用）。每个已装版本是独立目录，目录名为解析出的版本号（tag 解析的依赖带 commit-SHA 后缀）。缓存时自动安装插件的 Node.js 依赖。（来源：<https://code.claude.com/docs/en/plugins-reference#plugin-caching-and-file-resolution>）
- 持久数据目录：`~/.claude/plugins/data/{id}/`（`${CLAUDE_PLUGIN_DATA}`），跨更新存活；最后一个 scope 卸载时删除（CLI 可 `--keep-data` 保留）。（来源：<https://code.claude.com/docs/en/plugins-reference#persistent-data-directory>）
- 更新/卸载后旧版本目录标记为 orphan，约 14 天后后台清扫。（来源：<https://code.claude.com/docs/en/plugins-reference#plugin-caching-and-file-resolution>）
- 其它加载途径（不进缓存）：`--plugin-dir` / `--plugin-url`（仅当次会话）；skills 目录插件（`~/.claude/skills/` 或 `<cwd>/.claude/skills/` 下含 plugin.json 的目录，记为 `<name>@skills-dir`）；claude.ai 同步插件（Cowork/cloud 会话下载到 `~/.claude/plugins/synced/`，记为 `<name>@synced`）。（来源：<https://code.claude.com/docs/en/plugins-reference#skills-directory-plugins>、<https://code.claude.com/docs/en/plugins-reference#synced-plugins>）

### 4.3 更新机制

- **手动**：`claude plugin update <plugin>@<marketplace>`；先 `/plugin marketplace update` 刷新清单再 install 也会拿到新版本。（来源：<https://code.claude.com/docs/en/plugin-marketplaces#how-users-accept-the-command>、<https://code.claude.com/docs/en/discover-plugins#install-plugins>）
- **自动更新**：可按 marketplace 开关（`/plugin` → Marketplaces → Enable/Disable auto-update）。官方 marketplace 默认开，第三方/本地默认关。会话启动后随机延迟至多 10 分钟在后台检查并更新已装插件；当前会话仍用启动时加载的版本，更新后提示 `/reload-plugins` 或下次启动生效。（来源：<https://code.claude.com/docs/en/discover-plugins#configure-auto-updates>）
- `DISABLE_AUTOUPDATER` 同时禁用 Claude Code 本体与插件自动更新；`FORCE_AUTOUPDATE_PLUGINS=1` 可只保留插件自动更新。（来源：同上）
- `command` source 走独立节奏：每会话重跑一次命令，输出内容 hash 变了就装为新版本，不受 marketplace auto-update 设置与 `DISABLE_AUTOUPDATER` 影响。（来源：<https://code.claude.com/docs/en/plugin-marketplaces#when-claude-code-re-runs-the-command>）
- **version 字段与 git ref/tag 的关系**：`version`（plugin.json 或 marketplace 条目）是**更新信号**：设置后插件被钉在该字符串上，只有作者 bump 它用户才收到更新；它与 git `ref`/`sha` 是两套独立机制——`ref`（branch/tag）/`sha` 决定**取哪份代码**，`version` 字符串决定**是否触发更新**。（来源：<https://code.claude.com/docs/en/plugin-marketplaces#optional-plugin-fields>、<https://code.claude.com/docs/en/plugins-reference#metadata-fields>）
- 依赖解析场景下 version 与 tag 强绑定：release tag 命名约定 `{plugin-name}--v{version}`，`{version}` 须等于该 commit 的 plugin.json `version`；`claude plugin tag --push` 会校验两者一致。解析出的 tag semver 单独记录，即使该 commit 的 plugin.json 值过期也按实际拉取的 tag 检查约束。（来源：<https://code.claude.com/docs/en/plugin-dependencies#tag-plugin-releases-for-version-resolution>）

### 4.4 semver 是否强制

- 对**插件自身版本**：文档称 `version` 为 "Semantic version"，但更新触发机制是字符串变化（"users only receive updates when you bump it"），官方文档未见对插件自身版本做 semver 排序/校验强制的表述；省略 `version` 时走解析链回退（git commit SHA / 内容 hash 等，见 §5）。
- 对**依赖版本约束**：必须使用 node-semver 范围语法（`~2.1.0`、`^2.0`、`>=1.4`、`=2.1.0`）；release tag 必须是 `{name}--v{semver}`；pre-release 默认排除，除非范围带 prerelease 后缀（如 `^2.0.0-0`）。多个插件约束同一依赖时取交集，无满足版本则 `range-conflict`。

（来源：<https://code.claude.com/docs/en/plugin-dependencies#declare-a-dependency-with-a-version-constraint>、<https://code.claude.com/docs/en/plugin-dependencies#how-constraints-interact>）

---

## 5. 版本管理

**版本号解析链**（"Version management"，<https://code.claude.com/docs/en/plugins-reference#version-management>；该节正文未抓到原文，以下每一环节均有官方页面明文，顺序由二手来源 <https://getknack.ai/blog/claude-plugins-explained> 印证）：

1. `plugin.json` 的 `version`（与 marketplace 条目同设时 plugin.json 优先）——官方：<https://code.claude.com/docs/en/plugins-reference#metadata-fields>
2. marketplace 条目的 `version`——官方：<https://code.claude.com/docs/en/plugin-marketplaces#optional-plugin-fields>
3. 两者都没有时的回退：
   - git 系 source：用 **git commit SHA**，每个 commit 视为一个新版本（官方印尼语版页面同文："SHA commit git, sehingga setiap commit diperlakukan sebagai versi baru"，<https://code.claude.com/docs/id/plugins-reference>；二手印证顺序：plugin.json → marketplace → git commit SHA）
   - `archive` source：`sha256` 摘要兼任版本号——官方：<https://code.claude.com/docs/en/plugin-marketplaces#zip-archives>
   - `command` source：copy 模式取目录内容 hash；link 模式取目录真实路径+顶层条目派生——官方：<https://code.claude.com/docs/en/plugin-marketplaces#copy-mode-and-link-mode>

**版本号的作用**：是缓存键——缓存目录按解析出的版本命名，版本字符串变化 = 触发更新/新缓存目录。（来源：<https://code.claude.com/docs/en/plugins-reference#plugin-caching-and-file-resolution>）

**用户如何锁定版本**：

- 插件作者设了 `version`：用户自动被钉在该版本，只有作者 bump 才更新；想停更可不 bump，想强更须 bump。（作者侧控制，<https://code.claude.com/docs/en/plugins-reference#metadata-fields>）
- marketplace 维护者可在条目里给 git 系 source 设 `ref`（branch/tag）或 `sha`（精确 commit，`sha` 优先）钉住代码。（<https://code.claude.com/docs/en/plugin-marketplaces#plugin-sources>）
- 用户侧：关闭该 marketplace 的 auto-update（第三方默认即关）；或设 `DISABLE_AUTOUPDATER`。（<https://code.claude.com/docs/en/discover-plugins#configure-auto-updates>）
- 依赖约束：插件作者用 `dependencies` 的 semver 范围把依赖钉在已测试区间（如 `~2.1.0`），auto-update 只会在满足所有约束的最高 tag 内移动该依赖。（<https://code.claude.com/docs/en/plugin-dependencies#how-constraints-interact>）
- 官方社区 marketplace 的审核插件在目录中被钉到具体 commit SHA，CI 随上游推送自动 bump。（<https://code.claude.com/docs/en/plugins#submit-your-plugin-to-the-community-marketplace>）

**自动更新检查**：有——见 §4.3（后台随机延迟 ≤10 分钟检查；按 marketplace 粒度开关；官方 marketplace 默认开启）。

**未查到官方资料的点**：

- 插件自身 `version` 是否有 semver 格式校验（文档只称其为 "Semantic version"，未见校验/排序规则的明文）。
- 用户侧按版本号安装历史版本/回滚的官方命令（plugins-reference 尾部的 CLI 参考小节未抓到；GitHub issue [#33302](https://github.com/anthropics/claude-code/issues/33302) 显示社区在请求该能力，非官方资料，仅供参考）。
- Version management 小节的逐字原文（页面抓取截断）；上文解析链各环节均来自官方页面其它小节的明文交叉拼合。
