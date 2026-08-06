---
name: workflowhub-multica-sync
description: 检查本机 workflowhub main 的阶段技能、依赖技能、Multica 技能和 WorkflowHub agent 提示词是否一致；只在用户明确确认后同步 Multica。
disable-model-invocation: true
---

# WorkflowHub / Multica 同步审计

这是一个“先审计、生成完整计划、一次确认、一次执行”的技能。默认只读；用户确认后，按计划自动完成所有安全动作，不再逐项询问。不能修改运行时或本地 main。

## 入口

先确认：

- 当前仓库是 `/Users/Hugh/Hugh/Project/workflowhub`，或用户明确给出另一个仓库。
- 比较对象是 Git 的 `main`，不是当前工作树里的未提交文件。
- Multica 使用正式 profile 和 workspace：优先读取用户提供的参数；没有参数时使用 `desktop-api.multica.ai`，并要求明确的 `--workspace-id`。
- 所有 Multica 操作只能通过 `multica` CLI。

运行辅助脚本：

```bash
node skills/workflowhub-multica-sync/scripts/multica-skill-sync.mjs audit \
  --repo=/Users/Hugh/Hugh/Project/workflowhub \
  --profile=desktop-api.multica.ai \
  --workspace-id=<workspace-id> \
  --format=text
```

脚本也支持 `--format=json`，用于保存完整动作计划、审计快照和二次校验。
审计输出中的 `snapshot` 是用户确认的唯一版本；同步时必须原样传入
`--audit-snapshot=<snapshot>`。命令还支持 `--timeout-ms=<正整数>`，默认 30 秒；大技能同步可使用 120 秒，但必须仍有明确超时。

审计开始前还会验证本地 `main` 的当前 tree 可以完整读取：递归读取 `main` 的
文件树并做当前可达历史的 Git connectivity 检查。发现缺失 tree/blob/commit、当前
`main` 不可读或工作区不是干净的 `main` 快照时，只能报告“无法确认”，不能同步。

JSON 报告中的 `plans.A` 是只同步计划，`plans.B` 是同步加清理计划；用户确认的
选项必须和实际传给 `apply` 的 `--cleanup-extra` 一致。旧字段 `plan` 仅为兼容，
不作为新的确认依据。

## 审计范围

脚本必须从 `main` 读取以下内容：

1. 五个正式阶段：`make-decision`、`build-spec`、`build-plan`、`build-code`、`verify-code` 的 `workflows/*/SKILL.md`。
2. 五个阶段 `skill-deps.yaml` 声明的全部 WorkflowHub 依赖技能。
3. `skills/catalog.yaml` 中状态为 `native`、`adopted`、`adapted` 的全部技能，以及五个阶段依赖到但未列入目录的技能；每个技能的 `SKILL.md` 和 `skill-bundle.json` 配套文件都要核对。状态为 `absorbed` 的远程同名技能要单独列为可清理旧资源，不能混入外部技能。
4. 七个核心 agent：工头、Decision Maker、Spec Builder、Plan Builder、Code Builder、Code Verifier、Coder 的 Multica 提示词和技能绑定。

外部技能（例如 `anysearch`、`caveman`）只检查是否被使用或绑定，不从网络或不固定的 `main/latest` 自动覆盖；默认保留，不因 B 被删除。目录中标为 `adopted` 的技能只报告差异，不能由本技能写入或删除。

提示词检查边界：本机没有七个核心 agent 的独立 canonical 提示词文件，因此不能把 Multica 提示词声称为“逐字一致”。脚本检查角色是否存在、阶段技能绑定是否完整、旧 runner 门禁是否残留、当前按次执行规则、七个公共入口和路径猜测禁令是否出现；语义质量和角色职责变化仍要列为“无法由本机基准确认”，交给用户决定。

## 必须列出的差异

审计结果要用大白话列出：

- 本地技能缺失、Multica 缺失、主文件 hash 不一致。
- bundle 中声明但 Multica 缺失的配套文件。
- Multica 额外保留的配套文件；这类文件不能静默删除。
- 阶段 agent 缺少的依赖技能、错误绑定的技能、重复绑定。
- agent 提示词中的旧 runner 门禁、旧迁移要求、与当前 `per_invocation` 协议不一致的内容。
- agent 额外技能、重复技能和不属于本阶段的错误绑定；这些只报告，不能自动删除。
- 工作树未提交修改、`main` 与 `origin/main` 是否一致、闭包校验是否通过。
- B 模式将清理的已吸收旧技能、旧 agent 绑定和托管技能额外文件；外部技能保留清单。

每条差异都要带：名称、路径或 agent、期望值、实际值、影响、建议动作。没有差异时明确写“未发现问题”。

仅有额外技能、重复绑定或外部技能差异时，保留警告但不把它们冒充为同步阻塞；只有真实变更、无法确认或同步阻塞才返回非零。

Multica CLI 无法连接、workspace 不明确、读取超时或配套文件读取不完整时，状态必须是“无法确认”，立即停止；不能把未读取到的数据当成一致，也不能自动换 workspace、profile 或 provider。CLI 错误必须保留结构化错误码。

工作树未提交、`main` 与 `origin/main` 不一致、或者技能闭包检查不能在当前 `main` 快照上通过时，也必须停止同步。它们是审计阻塞，不是“提醒”。

## 用户确认门禁

审计结束后只停一次，给用户一张确认卡。确认卡必须展示本次 `snapshot`、动作计划、后果和风险：

- **A：只同步本地 WorkflowHub 管理的技能和 7 个核心 agent 提示词**。
- **B：同步 A，并清理已吸收旧技能、旧 agent 绑定，以及本地 bundle 未声明的额外配套文件（推荐）**。
- **C：只保留审计报告，不做任何更新**。

每个选项都写清后果和风险。用户明确选择 A 或 B 后，不再为单个技能、单个文件或单个 agent 追加确认。没有用户明确选择 A 或 B，不能执行任何 mutation。

## 用户确认后

收到 A 或 B 后：

1. 重新执行一次审计并重建动作计划；必须要求 `--audit-snapshot=<用户确认的 snapshot>`，如果 `main`、目录范围、依赖声明、本地技能 bytes、agent 当前版本或 Multica skill IDs 已变化，停止并报告快照变化，不重新让用户逐项判断。
2. 只同步本地 `catalog.yaml` 管理的技能；保留 Multica skill ID 和已有 agent 绑定。
3. 本地技能缺失于 Multica 时创建；创建后立即回读正文，再按 bundle 声明逐个上传配套文件。已有技能只更新正文和 bundle 声明的配套文件。
4. 同一个 Multica skill 的正文和配套文件必须串行写入；不能并发 upsert，避免后写覆盖先写。
5. A 不删除额外配套文件；B 删除动作计划中明确列出的额外配套文件。
6. B 只清理目录中标记为 `absorbed` 且当前没有需要保留理由的远程技能；先从所有 agent 解绑，再删除技能并回读。外部技能（包括 `caveman`）不删除。
7. 为七个核心 agent 添加缺失的阶段依赖技能；A 不替换已有绑定，B 只移除动作计划列出的已吸收旧绑定，不修改外部绑定。
8. 更新提示词时保留角色职责；有旧 runner 门禁就替换，没有可识别旧块但缺新版协议时才在前面补入当前协议块。新版协议必须包含 `execution_mode=per_invocation`、`launcher-owned runtime`、七个公共入口、路径不猜测和执行身份只作审计记录，不决定业务结果。
9. 每次 mutation 后立即回读；每次 CLI 调用必须有超时；删除命令即使返回纯文本，也以退出码加回读确认，不把纯文本误报成失败。失败立即停止并保留已完成动作，不自动换 profile、workspace、runtime 或 provider。
10. 最后重新运行 audit，必须报告：主文件 hash、配套文件、agent 提示词、技能绑定、已吸收旧技能和清理结果。

## 完成标准

只有同时满足以下条件才报告同步完成：

- 审计快照和更新后快照对应同一个 `main` commit。
- `main` 的递归 tree 和当前可达 Git 历史能完整读取；不能只凭 `rev-parse` 成功就认为快照可用。
- 所有本地托管技能正文 hash 与 Multica 一致。
- bundle 声明的配套文件全部存在且内容一致。
- 七个核心 agent 的必需绑定齐全。
- 核心 agent 不再含旧 runner 强制门禁。
- Multica 未托管的外部技能没有被覆盖。
- 所有 mutation 有 CLI 回读证据。
- 外部技能均未被覆盖或删除；A 模式的额外文件和旧绑定已保留并报告，B 模式的动作计划均已完成并回读。
- 用户确认的 `snapshot` 与实际写入前后快照一致；不能只依赖 `--confirm=I_CONFIRM` 这个固定字符串。

不要跑全量测试。只运行与本技能直接相关的闭包校验、技能合同测试和 `git diff --check`；把命令、退出码和结果写入报告。

## 依赖

脚本使用 WorkflowHub 已声明的 `js-yaml@4.1.0`。`skill-bundle.json` 必须保留这项运行依赖；独立搬运时先安装或提供同版本依赖，不能静默改用其他 YAML 解析器。Multica 服务超时可通过 `MULTICA_HTTP_TIMEOUT` 放宽，但仍必须同时保留脚本级 `--timeout-ms`。
