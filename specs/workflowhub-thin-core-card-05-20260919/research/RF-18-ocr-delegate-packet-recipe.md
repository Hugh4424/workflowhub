# RF-18 — OCR 委托模式 packet 适配配方（一手实测）

> 归属任务：`workflowhub-thin-core-card-05-20260919`（CARD-05 审查链替换）
> 记录时间：2026-09-22
> 性质：**一手实测事实**，非上游文档转述。所有命令均已在本机执行并记录退出码。
> 环境：`ocr` v1.12.8 (5c7b3838) darwin/arm64；`OCR_NO_UPDATE=1` 全程开启；git 2.39.5（低于 OCR 要求的 2.41，仅 warning）。

## 为什么需要这份配方

D-002 已选定适配合同输入形态为 **`packet`**（需求 + 设计 + diff + 相关代码，由 workflowhub 自行组包）。
但 OCR 的委托模式**硬依赖 git**，不存在「传入任意目录」的入口。两者之间存在适配落差，本文件给出已实测的桥接方式。

## 已实测的适配配方（5 步）

```bash
# 1. 把 packet 物化成一个真实目录
mkdir -p /tmp/packet/{requirement,design,diff,code}
#    （内容由 workflowhub 的组包逻辑写入）

# 2. 让该目录成为一个单 commit 的 git 仓库
cd /tmp/packet
git init -q .
git add -A
git -c user.email=workflowhub@local -c user.name=workflowhub commit -qm "<审查背景文本>"
#    注意：commit message 会被 OCR 当作审查背景自动注入（见下「隐蔽行为」）

# 3. 注入 WorkflowHub 自有的审查标准（D-012 的 rubric 四要素）
cat > rule.json <<'JSON'
{"include":["**/*.md","**/*.mjs","**/*.json","**/*.yaml"],
 "rules":[{"path":"**/*.md","rule":"<文档/需求审查 rubric 正文>"},
          {"path":"**/*.mjs","rule":"<代码审查 rubric 正文>"}]}
JSON

# 4. 枚举可审文件 + 排除账
ocr delegate preview --commit HEAD --rule rule.json --format json

# 5. 解析出各组 rubric，交给宿主子代理
ocr delegate rule --rule rule.json --format json <packet 内文件路径...>
```

## 一手实测证据

### 4.1 `ocr delegate preview --commit HEAD`（可用）

```text
# Files (2 reviewable / 4 total)
- mode: commit
- commit: HEAD
- background: init
- total_insertions: 6
- total_deletions: 0

~~- `design/design.md` [added] +2/-0 (excluded: unsupported_ext)~~
  - `design/impl.mjs` [added] +1/-0
~~- `design/requirement.md` [added] +2/-0 (excluded: unsupported_ext)~~
  - `rule.json` [added] +1/-0
```
`EXIT=0`

**要点**：`--commit` 模式能从单 commit 枚举出全部文件，并**逐条给出排除原因**（此处是 `unsupported_ext`，因为本次未传 `--rule`）。
这份 `excluded_files` / `excluded_count` 就是 D-016「丢弃事实如实记账」在委托模式下的**现成载体**——不需要额外读 OCR 内部信号。

### 4.2 `--from <empty-tree>` **不可用**

```text
Error: --from value "4b825dc642cb6eb9a060e54bf8d69288fbee4904" is not a valid commit ref:
error: 4b825dc642cb6eb9a060e54bf8d69288fbee4904^{commit}: expected commit type,
but the object dereferences to tree type
fatal: Needed a single revision
```
`EXIT=1`

**结论**：「用空 tree 当作起点枚举全仓」这条路**走不通**。枚举 packet 只能用 `--commit <sha>` 或 `--from <commit> --to <commit>`。

### 4.3 `--commit` 未传 `--background` 时自动注入 commit message

实测输出含 `background: init`（该仓库的 commit message 即 `init`）。

- 上游 `--help` **未说明**此行为。
- 适配层的两种处置：**利用它**（把审查背景写进 commit message）或**显式覆盖**（传 `--background` / `--background-file`）。
- 若忽略，审查者会拿到一个意料之外的背景串——属**静默语义注入**，须在适配合同里写明选定哪一种。

### 4.4 workspace 模式（未提交改动）

```text
# Files (1 reviewable / 2 total)
- mode: workspace
~~- `design/requirement.md` [modified] +2/-0 (excluded: unsupported_ext)~~
  - `cand.json` [added] +1/-0
```
`EXIT=0`

### 4.5 非 git 目录一律失败

`ocr delegate rule` 在非 git 目录下：`Error: <dir> is not a git repository`，`EXIT=1`。
本机 README 亦确认硬前置：「**Git >= 2.41** — Open Code Review relies on Git for diff generation, code search, and repository operations.」

### 4.6 委托模式**不产出 finding，也不提供 finding schema**

- `ocr delegate preview --format json` 顶层键：`schema_version` / `mode` / `repository` / `total_files` / `reviewable_count` / `excluded_count` / `total_insertions` / `total_deletions` / `reviewable_files[]` / `excluded_files[]`；条目 = `{path, status, insertions, deletions}`。
- `ocr delegate rule --format json` 顶层键：`schema_version` / `groups[]`；group = `{group_id, source, pattern, files[], rule}`。

→ **本卡早前记录的「OCR 提供 finding schema 脚手架」不成立。** finding schema 必须由 workflowhub 自定义（已由 D-019 裁定：以 OCR `LlmComment` 为骨架 + 按 D-012 补强制证据）。

### 4.7 内容级静默丢弃在委托模式下不适用

OCR 的 `too_large` / `max_tokens` 80% 丢弃逻辑属于**自管 LLM 路径**（`ocr review` / `scan`）——那条路径上 OCR 自己读文件内容。
委托模式下 OCR **只做文件筛选与规则解析，不读文件内容**，故该风险**自动消解**；文件级丢弃已由 4.1 的 `excluded_files` 显式记账。

> **2026-09-22 晚校正（CF-6 判定 + D-027）。** 本节「风险**自动消解**」这一结论**不成立，是假闭合**：
> OCR 侧确实不再读文件内容，但**真正读文件的是宿主子代理**——内容级丢弃的风险并没有消失，只是**从 OCR 的内部闸门转移到宿主子代理的上下文边界**（超长文件在宿主侧被截断或跳过时，同样不产生任何 OCR warning）。
> 故：
> 1. 本节的成立范围**收窄为「OCR 自身路径不适用」**，不能读成「该风险在本卡方案下不存在」。
> 2. 新断点（宿主子代理上下文）的**记账面**由 **OI-029 扩项 + D-027** 承接，归 D-017 修复层。
> 3. D-016 的「把丢弃提升为质量事实」义务**依然生效**，只是执行位置在宿主适配层而非 OCR 解析层。
>
> 依据：CF-6（`decision-log.md` 的 CF-6 条目与 D-027）；原「未触碰」清单曾把本处登记为已知不一致，本次就地校正。

## 对适配合同（FR-53 六要素）的直接影响

| 要素 | 本文件提供的结论 |
|---|---|
| 输入形态 | `packet` 可行，但**必须物化为单 commit 的 git 仓库**；`--from <empty-tree>` 路线作废 |
| finding schema | **OCR 不提供**，由 workflowhub 自定义（D-019） |
| 超时语义 | 本文件未涉及；须在 build-plan 定 |
| unavailable 状态集合 | 本文件未涉及；须在 build-plan 定（含 `unsupported_ext`、`is not a git repository`、`rules check` 恒 EXIT=0 等） |
| provider 身份记录 | 委托模式下 provider 身份由**宿主子代理**决定（D-007），不由 OCR 记录 |
| 事实写入位置 | `quality/reviews/` + 不可变命名（D-020） |

## 仍未解决（移交 build-plan）

1. `--batch by-directory` 是否真把 packet 当一个共享上下文单元——**仅从 help 推断，未实测**。
2. packet 的**体积与分组策略**：D-013 已裁定取消一切 fail-closed 上限且不分片，故 packet 体积无闸门；须设计组包规则从源头控体积。
3. rubric 进入 `{{system_rule}}` / `## User-Specific Rules (Mandatory)` 的**端到端验证**：证据止于 `delegate rule` 的 JSON（已确认中文逐字保留），真实 LLM 路径未跑（本机无 provider 配置）。
4. `rule` 多行值与 glob 花括号/排除语法边界未测。
5. **`ocr rules check` 恒 `EXIT=0`**，退出码零信息量，只能断言其输出的 `Source` / `Pattern` 两个字段——适配层的校验必须按此设计。另一处同类事实：`ocr delegate rule` 对畸形规则文件**静默回退**到内建规则而不报错。
6. 本次实测的 `delegate preview` 未传 `--rule`，故 `.md` 被 `unsupported_ext` 排除属预期；**已另行验证**传入含 `include: ["**/*.md"]` 的规则文件可旁路该闸门（reviewable 由 0 变 1 / 由 21 变 30）。
