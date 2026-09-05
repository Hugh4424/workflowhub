# AI 编程 CLI 宿主的技能/插件/扩展分发机制调研

> 调研时间：2026-02（以官方一手资料为准：官方文档站、官方 GitHub 仓库）。每条事实标注来源 URL；查不到的明确标注。

## 总览速查

| 宿主 | 打包格式 | 分发/Registry | 版本机制 |
|---|---|---|---|
| Codex CLI (OpenAI) | Skill = `SKILL.md` 目录（Agent Skills 开放标准）；Plugin = marketplace JSON + 插件目录 | 有：ChatGPT/Codex 通用插件目录（universal plugin directory）+ GitHub repo marketplace + `openai/skills` 目录仓库 | manifest/config 中声明；marketplace 条目管理 |
| Kimi Code (Moonshot) | Plugin = `kimi.plugin.json`（或 `.kimi-plugin/plugin.json`）目录/zip；Skill = `SKILL.md` | 有：内置 marketplace（Official/Curated/Custom 四页签）+ 自定义 marketplace JSON（`KIMI_CODE_PLUGIN_MARKETPLACE_URL`） | manifest `version` 字段；marketplace JSON `"version":"2"` |
| Gemini CLI (Google) | Extension = `gemini-extension.json` 目录（+ `commands/` TOML） | 无官方 registry；Git 仓库/GitHub Releases 直接安装；`gemini-cli-extensions` 官方组织 + 社区画廊 geminicli.com（非官方） | manifest `version` 字段 + git ref/branch/tag 发布通道 |
| opencode (SST) | Plugin = JS/TS 模块（npm 包或本地文件）；agent/command = Markdown frontmatter 文件 | 无官方 registry；npm 即分发渠道；官网 ecosystem 页为社区展示 | npm 版本语义 |
| DeepSeek Harness (DSH) | 未查到公开官方资料 | 未查到公开官方资料 | 未查到公开官方资料 |

---

## 1. Codex CLI（OpenAI）

### 1.1 有没有官方技能/插件打包格式？—— 有，两套

**核实结论：Codex 已在 2025 年底引入 skills 支持（最初为 experimental），现已正式化，且进一步推出 plugins 作为分发层。**

- OpenAI 官方论坛公告："Skills for Codex: Experimental support starting today"（实验性 skills 支持）。来源：[community.openai.com/t/1369367](https://community.openai.com/t/skills-for-codex-experimental-support-starting-today/1369367)
- 现行官方文档将 skills 定义为正式能力："A skill is a directory with a `SKILL.md` file plus optional scripts and references"，遵循 [Agent Skills 开放标准](https://agentskills.io)（与 Claude Code 同源格式）。来源：[developers.openai.com/codex/skills](https://developers.openai.com/codex/skills)（页面重定向至 learn.chatgpt.com/docs/build-skills）
- Skill 目录结构（官方文档原文）：
  ```
  my-skill/
    SKILL.md        # 必需：frontmatter 含 name + description + 指令正文
    scripts/        # 可选：可执行脚本
    references/     # 可选：文档
    assets/         # 可选：模板、资源
    agents/openai.yaml  # 可选：UI 元数据、调用策略（allow_implicit_invocation）、MCP 依赖声明
  ```
  来源：[developers.openai.com/codex/skills](https://developers.openai.com/codex/skills)
- 插件（plugin）是分发层："Plugins can include one or more skills… optionally bundle registered MCP server connections, bundled MCP server configuration, and presentation assets in a single package." 构建指南见 [Build plugins](https://developers.openai.com/plugins/build/plugins)。来源：[developers.openai.com/codex/skills](https://developers.openai.com/codex/skills)、[developers.openai.com/codex/plugins](https://developers.openai.com/codex/plugins)
- 官方示例仓库：
  - [openai/skills](https://github.com/openai/skills)：Skills 目录仓库（分 `.system` / `.curated` / `.experimental` 三档；**README 标注该仓库已 deprecated**，示例迁移到 openai/plugins）。安装方式：Codex 内 `$skill-installer <name>` 或给 GitHub 目录 URL。
  - [openai/plugins](https://github.com/openai/plugins)：现行官方插件示例仓库。
- AGENTS.md：是 Codex 的 agent 配置/指令文件机制（[Agent configuration → AGENTS.md](https://learn.chatgpt.com/codex/agent-configuration/agents-md)），与 skills 是不同机制。

### 1.2 ~/.codex 目录组织

- 本地状态根目录为 `CODEX_HOME`（默认 `~/.codex`），常见文件：`config.toml`（本地配置）、`auth.json`（凭证）等。来源：[Advanced Configuration](https://learn.chatgpt.com/docs/config-file/config-advanced)
- **注意：skills 不在 `~/.codex` 下**。官方文档的加载位置表：
  - `REPO`：`$CWD/.agents/skills`、上级目录 `.agents/skills`、`$REPO_ROOT/.agents/skills`
  - `USER`：`$HOME/.agents/skills`
  - `ADMIN`：`/etc/codex/skills`
  - `SYSTEM`：Codex 内置
  支持符号链接。来源：[developers.openai.com/codex/skills](https://developers.openai.com/codex/skills)
- `~/.codex/prompts/`：自定义 prompt（slash command）目录，只扫描顶层 `.md` 文件。来源：[Custom Prompts](https://learn.chatgpt.com/docs/custom-prompts)
- 单技能开关：`~/.codex/config.toml` 中 `[[skills.config]]` 条目（`path` + `enabled = false`）。来源：[developers.openai.com/codex/skills](https://developers.openai.com/codex/skills)

### 1.3 Registry / Marketplace / 版本声明

- **有 registry**：ChatGPT 与 Codex 共用"universal plugin directory"（公共插件目录），桌面端/web 的 Plugins 页与 Codex CLI 的 `/plugins` 浏览器（按 marketplace 分组、Space 开关、Enter 详情）都从 marketplace 安装。来源：[developers.openai.com/codex/plugins](https://developers.openai.com/codex/plugins)
- marketplace 来源多样：OpenAI 官方、workspace 管理员同步的 GitHub marketplace、个人 marketplace（Created by me / Shared with me）。"You can share plugins by publishing them through a marketplace source, such as a repo marketplace for a project or team." 来源：[developers.openai.com/codex/plugins](https://developers.openai.com/codex/plugins)
- 版本声明：skills 本身无独立版本字段（`SKILL.md` 仅需 `name`/`description`）；版本与分发元数据在插件 manifest 与 marketplace 条目中（详见 [Build plugins](https://developers.openai.com/plugins/build/plugins) 的 marketplace setup/packaging，本次未逐字抓取该页，细节以该页为准）。企业侧另有 plugin management / skill controls。来源：[developers.openai.com/codex/plugins](https://developers.openai.com/codex/plugins)

---

## 2. Kimi Code（Moonshot AI）

### 2.1 有没有官方 CLI？—— 有

- 开源仓库：[MoonshotAI/kimi-cli](https://github.com/MoonshotAI/kimi-cli)（"Kimi CLI is an AI agent that runs in the terminal"）。
- 官方文档站：`https://www.kimi.com/code/docs/en/kimi-code-cli/`（下称 Kimi Code Docs）。

### 2.2 技能/插件机制 —— 有，且相当完整

来源：[Plugins | Kimi Code Docs](https://www.kimi.com/code/docs/en/kimi-code-cli/customization/plugins)

- **Plugin 打包格式**：一个目录或 zip，manifest 放在 `<root>/kimi.plugin.json` 或 `<root>/.kimi-plugin/plugin.json`（前者优先）。字段：
  - `name`（必需，插件 id，`[a-z0-9][a-z0-9_-]{0,63}`）
  - `version`、`description`、`keywords`、`author`、`homepage`、`license`
  - `interface`（displayName/shortDescription/longDescription/developerName/websiteURL）
  - `skills`（`./` 路径；缺省则根 `SKILL.md` 为单一 Skill）
  - `agents`（自定义 agent 文件；缺省自动发现 `agents/`）
  - `sessionStart.skill`（会话开始自动加载指定 Skill）
  - `skillInstructions`、`systemPrompt`、`systemPromptPath`（各 ≤32KB；全部插件合计注入预算 64KB）
  - `mcpServers`（stdio/HTTP；`command`/`cwd` 的 `./` 路径必须在插件根内）
  - `hooks`（生命周期钩子，工作目录=插件根，注入 `KIMI_CODE_HOME`、`KIMI_PLUGIN_ROOT`）
  - `commands`（Markdown slash command，命名空间 `<plugin>:<command>`，支持 `$ARGUMENTS`）
- **Skill 格式**：`SKILL.md`（与普通 Agent Skills 同格式），见 [Agent Skills](https://www.kimi.com/code/docs/en/kimi-code-cli/customization/skills.html)。
- **安装来源**：本地目录、zip URL、GitHub 仓库 URL（支持 `/tree/<ref>`、`/releases/tag/<tag>`、`/commit/<sha>` 四种形态；只走 `github.com`/`codeload.github.com`）。
- **Registry/Marketplace**：**有**。TUI `/plugins` 四页签：Installed / Official（Kimi 官方维护）/ Curated（合作第三方）/ Custom（URL 安装）；`/plugins marketplace [source]` 可用自定义 marketplace JSON（格式：`{"version":"2","plugins":[{"id","displayName","source"}]}`），亦可用环境变量 `KIMI_CODE_PLUGIN_MARKETPLACE_URL` 覆盖默认目录。官方插件三个：Kimi Datasource、Kimi WebBridge、Kimi Computer Use。
- **版本管理**：manifest `version` 字段；官方插件页显示版本号（如 Kimi Datasource v3.4.0）；GitHub 安装可 pin tag/commit。本地安装会复制到 `$KIMI_CODE_HOME/plugins/managed/<id>/`，改源目录无效需重装。
- 安装作用域：目前仅 per-user，不支持项目级安装。

---

## 3. Gemini CLI（Google）

官方文档：[Gemini CLI Extensions](https://google-gemini.github.io/gemini-cli/docs/extensions/)（google-gemini/gemini-cli 仓库 docs）。

### 3.1 Extensions 机制

- 打包格式：目录内含 `gemini-extension.json`，安装位置 `<home>/.gemini/extensions/<name>/gemini-extension.json`。schema 字段（官方原文）：
  - `name`（小写+数字+连字符，需与目录名一致）、`version`
  - `mcpServers`（与 settings.json 同 schema；除 `trust` 外全部支持；同名时 settings.json 优先）
  - `contextFileName`（上下文文件，缺省加载目录下 `GEMINI.md`）
  - `excludeTools`（支持 `run_shell_command(rm -rf)` 这类命令级限制）
  - 变量替换：`${extensionPath}`、`${workspacePath}`、`${/}`/`${pathSeparator}`
- 管理命令：`gemini extensions install|uninstall|disable|enable|update [--all]|new|link`（`/extensions list` 在 CLI 内可用）。安装做拷贝，更新以 `gemini-extension.json` 的 `version` 为准。

### 3.2 自定义 commands 分发

- 位置：用户级 `~/.gemini/commands/`、项目级 `<project>/.gemini/commands/`（项目覆盖用户同名命令）。来源：[Custom Commands](https://google-gemini.github.io/gemini-cli/docs/cli/custom-commands.html)
- 格式：TOML（`prompt` 必需、`description` 可选）；子目录形成命名空间（`git/commit.toml` → `/git:commit`）；支持 `{{args}}`、`!{shell}`、`@{file}` 注入。
- 扩展内 commands：扩展目录下 `commands/` 中的 TOML 随扩展分发；命名冲突时扩展命令降级为 `/<ext>.<cmd>` 并标注 `[ext]` 前缀，扩展命令优先级最低。来源：[Extensions](https://google-gemini.github.io/gemini-cli/docs/extensions/)

### 3.3 Marketplace / Registry / 版本管理

- **无官方集中 registry**。发布渠道两种（[Extension Releasing](https://google-gemini.github.io/gemini-cli/docs/extensions/extension-releasing.html)）：
  1. **Git 仓库**：`gemini extensions install <repo-uri>` 或 `<org>/<repo>`，`--ref` 可指定 branch/tag/commit；ref 有新提交即提示更新；"HEAD commit is always treated as the latest version regardless of the actual version in the gemini-extension.json file"。可用 stable/preview/dev 分支做发布通道。
  2. **GitHub Releases**：release 归档安装；更新检查只看最新 release，**"We do not at this time support opting in to pre-release releases or semver"**。预建归档命名约定 `{platform}.{arch}.{name}.{ext}`（darwin/linux/win32 × x64/arm64），`gemini-extension.json` 必须在归档根。
- 官方第一方扩展在 GitHub 组织 `gemini-cli-extensions`（如文档示例 `gemini-cli-extensions/security`）。第三方画廊 [geminicli.com/extensions](https://geminicli.com/extensions/) 为社区站点，非官方 registry。

---

## 4. opencode（sst/opencode）

官方文档：[opencode.ai/docs](https://opencode.ai/docs)。

### 4.1 Plugin 机制

来源：[Plugins | opencode](https://opencode.ai/docs/plugins/)

- 打包格式：**JS/TS 模块**，导出一个或多个 plugin 函数（接收 `{project, client, $, directory, worktree}`，返回 hooks 对象）；可注册自定义 tool（Zod schema）。事件钩子覆盖 command/file/session/tool/permission/tui 等（如 `tool.execute.before`、`session.idle`、`experimental.session.compacting`）。
- 加载方式两种：
  1. 本地文件：项目级 `.opencode/plugins/`、全局 `~/.config/opencode/plugins/`（启动自动加载）；
  2. **npm 包**：`opencode.json` 的 `plugin` 数组（支持 scoped 包），启动时用 Bun 自动安装，缓存于 `~/.cache/opencode/node_modules/`。
- 本地插件依赖：在 config 目录放 `package.json`，启动时 `bun install`。
- 加载顺序：全局 config → 项目 config → 全局插件目录 → 项目插件目录。

### 4.2 Agent / Command 机制

- **Agents**：Markdown frontmatter 文件（`description`/`mode`/`model`/`temperature`/`permission` 等），放 `~/.config/opencode/agents/`（全局）或 `.opencode/agents/`（项目）；也可在 `opencode.json` 的 `agent` 字段配置。内置 Build/Plan（primary）与 General/Explore/Scout（subagent）。来源：[Agents | opencode](https://opencode.ai/docs/agents/)
- **Commands**：Markdown frontmatter 文件（`description`/`agent`/`model`），放 `~/.config/opencode/commands/` 或 `.opencode/commands/`；支持 `$ARGUMENTS`、`$1..$N`、`` !`cmd` `` shell 注入、`@file` 引用；同名可覆盖内置命令。来源：[Commands | opencode](https://opencode.ai/docs/commands/)

### 4.3 分发/Registry

- **无官方 registry/marketplace**。npm 就是插件分发渠道；agents/commands 靠把 Markdown 文件检入项目仓库（`.opencode/`）共享。官网 [ecosystem 页](https://opencode.ai/docs/ecosystem#plugins) 仅作社区插件展示。版本管理 = npm 语义版本。

---

## 5. DeepSeek Harness（DSH）

- **未查到公开官方资料**。DSH 是内部工具，公开网络上没有官方文档、官方仓库页面或打包/registry 机制的一手资料；本节不作任何推测性描述。（本地 checkout 属于内部源码，不构成"公开官方资料"。）

---

## 附：对 workflowhub 技能分发的可参考点（调研者注）

1. **SKILL.md（Agent Skills 标准）已成跨宿主事实标准**：Codex 与 Kimi Code 都采用 `SKILL.md` + frontmatter（name/description）+ 可选 scripts/references/assets，且都兼容/遵循 agentskills.io——workflowhub 技能若要可搬运，对齐该格式收益最大。
2. **分发层与 authoring 层分离**是共同趋势：skill 本地目录用于创作，plugin/marketplace JSON 用于分发（Codex、Kimi 均如此；Gemini 用 gemini-extension.json + git ref；opencode 用 npm）。
3. **marketplace JSON 清单**（Kimi 的 `{"version":"2","plugins":[{id,source}]}`、Codex 的 repo marketplace）是自托管 registry 的轻量范本。
4. **版本语义普遍薄弱**：Gemini 明确不支持 semver，git ref 即版本；Kimi/Codex 依赖 manifest version + marketplace 条目。若 workflowhub 需要严格版本，需要自行设计。
