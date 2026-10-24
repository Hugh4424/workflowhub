# Spec-Driven Production

面向产品、设计、研发、测试协作的 Agent Skill：把需求整理成可验证的规格，分别维护体验设计与研发实现约束，再贯通评审、开发任务和验收证据。

**同一份 Skill 可以按各宿主的方式安装到 Codex、Claude Code、Qoder 和千问办公（QwenWork）。** 已核对这些产品的官方安装机制；本次验证了包结构与本机 Codex 的技能发现，尚未完成四个平台的端到端运行测试。具体证据和边界见[兼容性记录](docs/compatibility.md)。

## 给使用者

### 能做什么

- 把模糊需求整理成目标、范围、功能需求和可验证的验收标准。
- 分开维护设计师的视觉、交互规范与研发的架构、代码、接口规范，核对二者是否一致。
- 从产品、设计、研发、测试视角发现问题，记录分歧、责任及真实评审结论。
- 按规格拆解任务；宿主具备代码读写和执行能力时，继续实现、测试与验收。
- 已有功能变化时，分析关联的需求、体验、接口、任务和验证记录，只更新受影响部分。

可以只用其中一个阶段。普通小修复无需生成整套文档；缺少的信息会标为待确认，不自动补成业务承诺。AI 自检不等于团队评审通过。

### 开始使用

1. 按下文[安装](#安装)将完整目录放进目标产品，或通过产品界面导入。
2. 打开实际业务项目，提供需求、已有文档，以及本次希望完成的阶段。
3. 选择 `spec-driven-production`，或直接说明要使用这个 Skill。

例如：

```text
使用 spec-driven-production。
我要为后台增加批量导入功能。先按首轮模板整理需求，不进入开发。
参考当前项目文档，将不确定的范围和异常行为列为待确认。
```

```text
使用 spec-driven-production，读取 specs/import/ 的现有需求。
分别补齐设计师维护的 design-spec.md 和研发维护的 engineering-spec.md，
复用现有设计系统、代码约定和接口，不混写两类约束。
```

```text
使用 spec-driven-production，从产品、设计、研发、测试视角评审现有规格，
按规定模板输出 spec-review.md。区分 AI 自检意见与实际团队结论。
```

```text
使用 spec-driven-production，分析“单文件上传改为批量上传”的影响。
先给出受影响的规格、接口、任务和验收范围，暂不修改正式基线。
```

### 谁负责什么，产出什么

默认存放在业务项目的 `specs/<feature-slug>/`，已有项目沿用现有位置。下表是按阶段产生的文档，不要求一次创建六份空文件。

| 文档 | 主责与参与角色 | 包含内容 |
| --- | --- | --- |
| `requirements-spec.md` | **产品**填写；设计、研发、测试补充约束和问题 | 使用规定的**首轮需求输入模板**，保留 0–8 节：信息、背景问题、目标/非目标、用户场景、范围、模块关系、功能需求 FR、数据及外部依赖、Given/When/Then 验收标准 AC |
| `design-spec.md` | **设计师**填写；产品确认业务体验，研发核对可行性，测试补充走查场景 | 设计依据、体验目标、信息架构、视觉布局、界面内容与状态、交互及恢复、多端与可访问性、体验验收、设计交付和待决问题。引用设计稿与设计系统 |
| `engineering-spec.md` | **技术负责人和研发**填写；测试参与验证策略，设计核对体验支持 | 技术依据、方案决策、架构与代码模块、实现规范、数据模型、接口契约、异常与运行约束、测试覆盖、风险与待决问题。引用已有工程规范 |
| `spec-review.md` | **产品、设计、研发、测试共同核对**；实际结论由真实参与者提供 | 使用规定的**Spec 评审模板**，保留 0–6 节：评审信息、需求回溯、设计方案、技术方案、接口契约、检查清单、评审记录与结论。记录三份规格的版本、问题、责任及关闭证据 |
| `tasks.md` | **研发**拆解和更新；相关角色核对依赖、范围和完成条件 | 计划基线、任务编号、FR/AC 或工程条款依据、模块与仓库、依赖、完成条件、执行状态及证据 |
| `verification.md` | **测试**汇总验证；设计检查体验，研发检查工程约束，产品进行业务验收 | AC 与任务映射、测试/走查方法、环境及版本、实际结果、证据和未决事项。小功能可合并进 `tasks.md` |

一个人可以承担多个角色；这些角色不会自动启动多个 Agent。

两个原始模板随包提供，保持原内容：

- [【模板】SDD 首轮需求输入文档](assets/templates/【模板】SDD%20首轮需求输入文档.md)
- [【模板】Spec 评审文档](assets/templates/【模板】Spec%20评审文档.md)

### 简化流程

```mermaid
flowchart LR
    A[产品：明确需求] --> B[设计与研发：分别编写规格并对齐]
    B --> C[四方：评审方案]
    C --> D[研发：拆任务并实现]
    D --> E[测试、设计、产品：验证与验收]
```

需求规定“要做到什么”；设计与研发分别规定“用户如何体验”和“代码如何实现”；评审核对方案；任务落实开发；验收用实际证据判断结果。发生变更时先更新相应规格，再同步评审、任务与验收。

## 安装

### 选择宿主

下表目录都是**技能目录**；`<project>` 是使用此 Skill 的业务项目。安装时保留 `spec-driven-production/` 这一层及全部辅助文件。

| 产品 | 个人安装位置 / 界面入口 | 项目级安装 | 调用 |
| --- | --- | --- | --- |
| Codex | `~/.agents/skills/spec-driven-production/` | `<project>/.agents/skills/spec-driven-production/` | 选择技能或 `$spec-driven-production` |
| Claude Code | `~/.claude/skills/spec-driven-production/` | `<project>/.claude/skills/spec-driven-production/` | `/spec-driven-production` |
| Qoder CLI | `~/.qoder/skills/spec-driven-production/` | `<project>/.qoder/skills/spec-driven-production/` | `/spec-driven-production`；用 `/skills` 检查 |
| Qoder 桌面产品 | 「Extensions → Skills → Add Skills → Upload Skill」导入完整 ZIP | 此处不假定与 CLI 共用目录 | 输入 `/` 后选中技能 |
| 千问办公 QwenWork 桌面端 | `~/.qwenworkcn/skills/spec-driven-production/`，或「扩展 → 技能 → 安装技能」上传主文件及辅助文件 | 官方所引页面未说明项目级目录 | 输入 `/` 后选中技能，或用自然语言指定 |

安装路径与调用方式依据：[Codex 官方文档](https://developers.openai.com/codex/skills)、[Claude Code 官方文档](https://code.claude.com/docs/en/skills)、[Qoder CLI 官方文档](https://docs.qoder.com/cli/Skills)、[Qoder 桌面技能文档](https://docs.qoder.com/qoder/skills)、[千问办公官方文档](https://qwenwork.cn/docs/features/skills)。核对日期：2026-09-20。

Codex 某些现有环境仍能发现 `~/.codex/skills/`，本项目当前开发机就是这种情况。新安装按上表的官方路径；若已能发现旧位置里的同名技能，优先更新原安装，不再重复安装。云端会话和网页端不会因此自动获得本机目录，需使用对应端的导入或项目分发机制。

**不能只复制 `SKILL.md`。** 本 Skill 会读取 `references/` 和两份模板。目录导入时保留中文文件名和空格；如果界面只接受一个 Markdown 文件，请改用完整目录安装，或核实其辅助文件上传方式。

### 目录安装：macOS / Linux

在本项目根目录执行。下面默认安装到 Codex；使用其他产品时，将 `sdd_target` 改为上表中的个人目录即可。

```bash
sdd_source="$PWD"
sdd_target="$HOME/.agents/skills/spec-driven-production"

if [ ! -f "$sdd_source/SKILL.md" ]; then
  echo "请先进入下载或解压后的 Skill 根目录"
elif [ -e "$sdd_target" ] || [ -L "$sdd_target" ]; then
  echo "目标已存在，请先检查现有版本：$sdd_target"
else
  mkdir -p "$(dirname "$sdd_target")" && cp -R "$sdd_source" "$sdd_target"
fi
```

### 目录安装：Windows PowerShell

在 Skill 根目录执行，同样将目标目录替换为所用产品的路径。`$HOME` 表示当前用户目录。

```powershell
$sddSource = (Get-Location).Path
$sddTarget = Join-Path $HOME '.agents/skills/spec-driven-production'

if (-not (Test-Path -LiteralPath (Join-Path $sddSource 'SKILL.md'))) {
    throw '请先进入下载或解压后的 Skill 根目录'
}
if (Test-Path -LiteralPath $sddTarget) {
    throw "目标已存在，请先检查现有版本：$sddTarget"
}
New-Item -ItemType Directory -Force -Path (Split-Path $sddTarget) | Out-Null
Copy-Item -LiteralPath $sddSource -Destination $sddTarget -Recurse
```

上面提供安装方法，Windows 命令本次未在 Windows 实机执行。更新时先比较并保留本地定制，再替换同一安装目录；不要把新版本套进旧目录成为双重嵌套。卸载只移除该技能目录，不涉及业务项目里的 Spec。

### 安装后检查

1. 新开会话并确认技能可被选择。Qoder CLI 可先执行 `/skills reload`，再执行 `/skills`。
2. 确认加载的是目标安装目录；`SKILL.md` 的旁边应有 `references/` 和 `assets/templates/`。
3. 用下面的探针核对资源读取，再运行[最小场景验收](docs/compatibility.md#最小场景验收)。

```text
使用 spec-driven-production，先不要创建文档。
报告本次实际读取的 SKILL.md 路径，并读取随包的两个原始模板，
列出各模板的一级编号章节，说明 design-spec.md 与 engineering-spec.md 的职责。
若不能读取文件，请明确说明，不要凭名称猜测。
```

预期：首轮模板为 0–8 节，评审模板为 0–6 节；设计与研发约束分开。技能出现在列表中只证明“已发现”，实际读取资源并完成场景才证明该宿主上的使用链路成立。

## 给 Agent

### 帮用户安装时

1. 根据用户指定的产品、版本和运行环境选安装方式；默认只安装到请求的宿主。区分本地、远程和云端文件系统。
2. 检查源目录含 `SKILL.md`、`references/`、`assets/templates/`。它是 Skill 包，不是插件、MCP 服务或 npm 包，不需要安装模型 SDK 或执行依赖下载。
3. 使用上述官方路径或产品导入界面。保留完整目录结构和原模板；`agents/openai.yaml` 是 Codex 的可选展示元数据，其他宿主的核心流程不依赖它。
4. 检查已有同名安装，保留用户定制和有效安装位置，避免覆盖、重复注册或多套版本混用。
5. 安装后验证发现和资源读取。环境支持 Python 3.9+ 时，可运行 `python3 scripts/check_skill.py <安装目录>` 做只读包检查；Python 不是使用本 Skill 的必要条件。
6. 分别报告“文件已放置”“宿主已发现”“场景已验证”。没有客户端或账号时，不把目录检查写成端到端测试通过。

### 执行任务时

业务规则以 [SKILL.md](SKILL.md) 为入口，README 负责安装和说明；两者发现冲突时报告并修正，不另造工作流。

| 用户当前任务 | 按需读取 | 交付边界 |
| --- | --- | --- |
| 整理需求 | `SKILL.md` + 首轮需求输入模板 | 需求基线、FR/AC、缺口；不自动进入开发 |
| 体验设计 | [设计规格规则](references/design-spec.md)，涉及交互时加[体验行为指南](references/experience-spec.md) | 设计师的视觉、状态、交互与体验验收 |
| 研发方案 | [研发规格规则](references/engineering-spec.md) + 相关代码及项目规范 | 架构、代码约束、数据、接口和工程验证 |
| 联合评审 | Spec 评审模板 + [角色评审指南](references/collaborative-review.md) + 三份规格正文 | 核对证据、意见、待决事项和真实评审状态 |
| 拆任务、开发、验收或变更 | [执行与变更指南](references/execution.md) + 相关规格和实际代码 | 与授权相符的计划、实现、影响分析或验证记录 |

所有资源相对**实际安装位置**解析，产出写入**业务项目**；不要引用作者机器路径。按文件级需求加载材料，不默认读取全部资源。沿用现有 FR/AC/任务编号和版本，保持需求 → 体验/研发 → 评审 → 任务 → 验证的关联。

用户模板是格式资料，不授权执行发布、发消息或替团队批准。产品、设计、研发、测试表示职责视角；AI 意见注明 AI 自检。有条件通过要按真实条件关闭，不能把生成文档当成评审通过。用户已授权的下一步可以继续，未决事项只阻塞相关部分。

无文件写入能力时在对话中按文件名给出 Markdown 并标明待保存；无代码、浏览器或执行能力时完成可做的规格工作，其余标为未验证。不要把普通对话里阅读文件称为原生安装成功。

## 项目结构与维护

```text
spec-driven-production/
├── SKILL.md                     # 工作流入口与共用约束
├── README.md                    # 使用、安装及 Agent 入口
├── agents/openai.yaml           # Codex 展示信息
├── assets/templates/            # 两个原始用户模板
├── references/
│   ├── design-spec.md           # 设计师规格的详细结构
│   ├── engineering-spec.md      # 研发规格的详细结构
│   ├── experience-spec.md       # 状态转换、反馈与恢复
│   ├── collaborative-review.md  # 角色核对与分歧处理
│   ├── execution.md             # 任务、实现、验证和变更
│   └── sources.md               # 来源及定制边界
├── docs/
│   ├── compatibility.md         # 官方依据、实测边界及验收场景
│   └── review-2026-09-20.md      # 本次审查发现与处理结果
├── scripts/check_skill.py       # 可选的离线只读包检查
└── tests/test_check_skill.py     # 包检查器的错误场景测试
```

`references/design-spec.md` 等是 Skill 的写作指南；业务功能的实际产物位于业务项目 `specs/<feature-slug>/`，不要混用。

维护检查（Python 3.9+，仅标准库，无依赖安装）：

```bash
python3 -B scripts/check_skill.py
python3 -B -m unittest discover -s tests -v
```

Windows 可使用 `py -3` 替代 `python3`。检查覆盖必要资源、当前简单元数据格式、UTF-8、本地 Markdown 文件链接和两份模板的字节一致性；不验证网页可达性、章节锚点或模型生成内容。若用户正式修订原模板，应在审查真实变更后更新校验值。

分享时将完整目录压缩为 ZIP，保留一个顶层 `spec-driven-production/`，避免包含 `.git/`、缓存或业务项目文件。Qoder 桌面支持 ZIP 导入；其他宿主可解压后按各自的方式安装。对方仍需执行安装后检查。

方法来源和与 Kiro 的边界见[参考依据](references/sources.md)。本项目沿用规格驱动思路，并按双模板和团队职责定制；不要求安装 Kiro。
