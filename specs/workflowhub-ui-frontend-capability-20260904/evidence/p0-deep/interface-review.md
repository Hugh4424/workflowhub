# P0 深读笔记：interface-review（Website-skills 镜像仓）

- 来源：`/Users/Hugh/Hugh/Project/Website-skills/interface-review/`（license: MIT；frontmatter 有 `disable-model-invocation: true`——只能由用户显式调用）
- 体量：SKILL.md 143 行 + scope-resolution.md 181 行 + removed-signals.md 38 行 + agents/openai.yaml（harness 适配，无规则内容）
- 精读范围：全部 3 个 md 全文。
- 定位：评审**变更**（diff）而非评审**屏幕**；只拥有"变更范围"（scope）这一层：解析目标 → 把变更文件扩展为受影响表面 → 读 diff 两侧 → 给每个发现分类。领域规则归 `better-*` 技能；模式/严重度/合并/上限/输出格式/裁决归 `better-interface`。正确性/测试/安全/性能归项目通用 code review（点名一次就放手）。

## ① 核心机制（一句话）

把"UI 评审"从"看一个屏幕"重构为"审一个变更"：先用 git 命令把评审目标解析成精确的文件集合（merge-base 优先于工作区、排除清单、PR ref fetch 不 checkout），再把变更文件按"爆炸半径"扩展到消费它的表面（默认一跳、token 两跳、最多 5 个消费者），强制读 diff 的 `-` 侧捕捉回归信号，最后给每个发现打上 **Introduced / Regression / Pre-existing** 三态之一并连同 scope block 移交上层评审编排。

## ② 完整可执行规则表（逐条，含命令与数值）

### SKILL.md 八条核心原则

- **IR1 先解析变更范围**：模式词之后全是目标（`/interface-review quick pr 482` = quick 模式审 PR 482）。无目标时按序解析、首个命中即停：
  1. `HEAD` 领先于 `git merge-base origin/<default-branch> HEAD` → 评审该范围 **+** 未提交变更，commit 数与未提交文件数分开报告；
  2. 工作区脏 → 评审未提交变更；
  3. 都不满足 → 无变更可审，停下问（见 IR2）。
  顺序是硬规则：先查工作区会让一个游荡的格式化编辑遮蔽 12 个 commit 的分支。
  排除 lockfile/快照/生成物/vendor/二进制并**点名排除内容**；排除后范围为空 = 换路径到达 IR2。
- **IR2 无变更时问而非发明**：干净树 + 未领先 merge-base = 用户要审的变更不存在。**禁止自行退回 `HEAD~1..HEAD`**（最后一个 commit 常是 merge 或别人的工作）。陈述仓库事实后提供三条路线并等待：(a) 最后一个 commit（带短 SHA 和 subject 让用户认出它）；(b) 用户命名的目标（pr n/分支/ref/范围）；(c) 全仓界面审计（**不是变更评审**——直接交 better-interface 做 repo-scope，丢弃 scope block/状态/pre-existing 段，因为无变更时一切发现都是 pre-existing，分类不携带信息）。问之前先查当前分支有无 open PR（`gh pr status`），有则优先提供——分支 commit 已合入 base 时范围为空但 PR 正是用户所指。
- **IR3 Diff 不是表面**：变更文件是证据不是评审主体；其**爆炸半径**（渲染它的表面集合）才是。**默认扩展一跳**（直接 importer/调用者）；**仅对 design token、theme 值、共享原语扩第二跳**（一行波及全产品）。**最多审 5 个消费者**，按 scope-resolution 的排序规则，并**声明未扩展的数量**——无界扫描产出无法支撑的覆盖声明，不报截止数则报告看似完整实则不然。
- **IR4 读被删除的行**：回归在变更后状态中不可见；每个 hunk 的 `-` 侧对照 removed-signals.md。**信号是线索不是发现**：删除只有在变更中无替代时才是回归，判断归领域技能；路由每个无匹配删除给其 owner，只报告该技能确认的；确认后标 `Regression`（告诉作者他弄坏了原本工作的东⻄，而非犯了新错误）。
- **IR5 每个发现分类**（三态）：
  - `Introduced`：本变更创造的；
  - `Regression`：本变更削弱了原本正确的东西；
  - `Pre-existing`：存在于被触及代码但非本变更造成。
  **按 diff 触及的行分类，不按所在文件**：变更未触及的行即使离 hunk 三行也是 Pre-existing；重要时用 `git blame -L <line>,<line> "$BASE" -- path/to/file` 对 base ref 确认。每个发现带状态上交，cap 与裁决归 better-interface。
- **IR6 用声明的意图约束变更**：读 PR 标题/正文、链接 issue、commit message，评审界面是否交付了其所声称的。这能暴露**不完整变更**（表面评审看不到，因为状态缺席）：(a) 新 variant/尺寸/主题只应用于部分状态（hover/focus/active/disabled/loading/selected）；(b) 新用户可见字符串无翻译目录条目；(c) 新组件无 empty/loading/error/disabled/窄宽态；(d) 控件加到一个表面却没加到已携带其同类控件的兄弟表面。**不报告 scope creep**（做太多是流程问题不是界面问题）。
- **IR7 移交 better-interface**：带着 scope、受影响表面、diff 两侧移交，由其路由领域技能、定严重度、合并、执行 cap、发裁决。**better-interface 不可用时**：报告已解析范围与文件清单，点名缺失技能，**停**——不发明严重度尺度、cap 或裁决。
- **IR8 永不改工作树**：变更评审全程只读，含 checkout。PR ref 只 fetch 不 checkout；`git fetch` 只写 `.git` 被允许；`gh pr checkout`/`git checkout`/`git switch`/`git stash` **任何模式下永不许**。渲染验证 opt-in：视觉与运行时声明默认标 **Not verified**，除非项目有廉价 preview 或用户要求渲染评审；需要时用隔离 worktree（`git worktree add /tmp/review-<n> refs/remotes/pr/<n>`），用完删除。

### scope-resolution.md（目标→文件清单的精确命令）

- SR1 默认分支解析按序：`git symbolic-ref --quiet --short refs/remotes/origin/HEAD` → `gh repo view --json defaultBranchRef -q .defaultBranchRef.name` → `git config --get init.defaultBranch`；origin/HEAD 缺失时用 `git remote set-head origin --auto` 问远端（须网络、写 `.git`，允许但要记 Verification）；无远端退回本地 main/master 并声明假设。
- SR2 merge-base：`BASE=$(git merge-base origin/main HEAD)`；`git rev-list --count "$BASE"..HEAD`；`git diff --name-status "$BASE"...HEAD`。**用三点**（对 merge-base diff 而非对 base 分支现状）；两点会把所有上游 commit 报进变更。base 过期先 `git fetch origin main --no-tags`。
- SR3 目标命令表：`working`=`git diff --name-status HEAD` **+** `git ls-files --others --exclude-standard`（diff HEAD 只报 tracked，不配 untracked 会静默丢新建组件/样式表）；`staged`=`--cached`；`branch`=三点 diff；branch+未提交=两者都跑、计数分开；`pr <n>`=见 SR4；`<ref>`=对 `merge-base(<ref> HEAD)` 三点；`<a>..<b>` 两点按用户所写、`<a>...<b>` 三点按用户所写——**不改写用户写的点数**（两点比端点，三点比 merge-base；把两点改三点会丢掉 base 与 merge-base 之间的部分，那常正是被要求的）。
- SR4 PR：`gh pr view <n> --json title,body,headRefName,headRefOid,baseRefName`；`git fetch origin "pull/<n>/head:refs/remotes/pr/<n>" --no-tags`（fork 可用，`origin/<branch>` 不可用）；对 baseRefName 求 merge-base 后三点 diff。读文件用 `git show refs/remotes/pr/<n>:path`（**不开工作区副本**，fork PR 上是不同文件）；`gh pr diff` 只适合看 patch 文本（无法读未改上下文/扩消费者），仍须 fetch ref。**引用**：行号对被 fetch 的 ref 引用，scope block 声明 head ref 及 SHA 使行号可解析。**意图**：title/body 即 IR6 的声明意图，body 空时补 `git log --format='%s%n%b' "$BASE".."refs/remotes/pr/<n>"`。
- SR5 尴尬仓库状态：detached HEAD（`git symbolic-ref --quiet HEAD` 失败→对默认分支求 merge-base，scope block 写 SHA 不写分支名）；shallow clone（`git rev-parse --is-shallow-repository` 或 merge-base 空→`git fetch --deepen=50 origin` 重试，再 `--deepen=200`，仍不行报 unresolvable）；**mid-rebase/mid-merge**（git diff 成功但返回的不是变更——最危险）：用 `git rev-parse --git-path` 探测 `rebase-merge/rebase-apply/MERGE_HEAD/CHERRY_PICK_HEAD`（不直接测 `.git/` 路径，linked worktree 里不是目录），停下说明树在操作中途。其他失败（无远端/无关历史/空仓/submodule 指针移动）在 merge-base 处响亮失败：报 base 不可解析并停。
- SR6 无可审：先取事实（当前分支/是否默认分支/树干净/PR 是否打开/最后 commit 的 SHA+subject），`gh pr status` 无 PR 时省略 `currentBranch` 是答案不是错误；`gh` 缺失/未认证/无 GitHub remote 的失败一律按"未找到 PR"处理并继续提供其余路线。全仓审计是另一种评审：直接交 better-interface，不带 scope block/状态/pre-existing 段。
- SR7 重命名：`--name-status` 默认开 rename 检测（`R100 old new`）；移动+编辑同变更时提相似度窗口 `git diff --find-renames=40% --find-copies-harder`；**把重命名当移动审**，不当 delete+add——存活内容全是未变更代码，只有真编辑在范围内。
- SR8 排除清单（排除并点名）：lockfile（package-lock/pnpm-lock/yarn.lock/bun.lock(b)/Cargo/composer/Gemfile/poetry/uv）；快照与 fixture（`__snapshots__/`、`*.snap`、`*.approved.*`、test-results、playwright-report）；生成输出（dist/build/out/.next/.turbo/.svelte-kit/coverage/storybook-static/`*.min.*`/`*.map`）；生成源（`*.gen.ts`、`*.generated.*`、构建产 `*.d.ts`、GraphQL/Prisma client）；vendor/third_party/node_modules；二进制与媒体（png/jpg/webp/avif/woff2/mp4/pdf）。**两个例外留在范围内**：字体文件增换=better-typography 变更；组件新增图片=better-ui+better-accessibility 变更（经 alt 与 outline）——审引用它们的代码而非字节。排除用 pathspec（`:(exclude,glob)`）使计数=实审数；两个陷阱：`*.lock` 漏 package-lock.json/pnpm-lock.yaml（每个后缀都要覆盖）；`**` 须配 `glob` magic 否则 `*` 跨 `/`。跑带/不带 pathspec 两次 diff，确认计数恰好下降所点名的文件数。
- SR9 消费者扩展：用项目自身 resolver，否则 import 路径；**git grep 必须传被审 ref**（`git grep -l "from ['\"].*<module>" "$REV" -- '*.ts' ...`；组件名 `git grep -ln "<ComponentName>" "$REV"`），否则在 PR 上搜了不同 revision 漏掉变更新增的 importer；结果 `<rev>:path`，读用 `git show "$REV":path`。token/theme 值变更搜 token 名而非文件（消费者引用名字不 import）；pattern 以 `-` 开头用 `-e`。消费者排序规则（可复现）：1) 路由/布局入口优先（`app/**/page.*`、`app/**/layout.*`、`pages/**`、`routes/**`、`src/views/**`、`*.astro`）；2) 按 importer 计数（`git grep -l ... | wc -l`）；3) 平手按邻近度（同包/同 feature 目录先）。**审前 5 个**，声明未扩展数，排序在某点之后是任意的要明说。

### removed-signals.md（`-` 侧信号→owner 路由表）

- RS1 信号路由表（信号=线索，owner 确认才成发现）：
  | 被删内容 | Owner | 检查点 |
  |---|---|---|
  | `aria-label/labelledby/describedby/live`、`role=` | better-accessibility | 控件/区域丢了可访问名、描述或播报 |
  | `alt=`、`<label`、`for=`、`scope=` | better-accessibility | 图片/字段/表格单元丢了程序化关联 |
  | `<button>/<a>/<nav>/<main>/<ul>` 被 div/span 替换 | better-accessibility | 键盘与 AT 行为被换成样式 |
  | `:focus-visible`、`:focus`、`outline`、`tabindex` | better-accessibility | 键盘用户丢焦点指示或元素出 tab 序 |
  | `prefers-reduced-motion`、`prefers-contrast` | better-accessibility | 动效/对比度无视系统偏好 |
  | 逻辑属性被换回 `left`/`right` | better-layout | 方向感知布局被丢 |
  | `lang=`、`dir=` | better-typography | 语言元数据/文本方向被丢 |
  | `text-wrap`、`line-clamp`、`overflow-wrap`、`tabular-nums`、`font-feature-settings` | better-typography | 文本渲染/换行/数字对齐静默变化 |
  | 色 token 换成字面量，或换成更浅 token | better-colors | 渲染对比对可能失败，须实测 |
  | 用户可见字符串被删/缩短 | better-writing | 标签/错误/空态丢了它承载的信息 |
- RS2 等价替换清单（路由前先查，否则报告装满实为重构的"回归"）：`aria-label`→指向可见文本的 `aria-labelledby`；显式 `role` 因元素变为原生等价物而消失（div→`<button>` 时 `role="button"` 消失）；`outline` 换成仍满足焦点指示规则的 `box-shadow` 焦点环；元素变原生可聚焦后 `tabindex="0"` 消失；色字面量换成实测同渲染对的 token；物理属性换成逻辑对应物（这是修复不是回归）；字符串移入翻译目录而非删除。
- RS3 搜索命令：`git diff -U0 "$BASE"...HEAD -- '*.tsx' '*.css' | grep -E '^-[^-]' | grep -E 'aria-|role=|alt=|focus|tabindex|prefers-'`；**决定前读周边 hunk**（`-U0` 故意隐藏上下文，单个被删属性脱离其元素无意义）。

### 输出契约（interface-review 提供给 better-interface 的部分）

- OC1 scope block 七字段表：Target（branch/working/staged/pr 482/原样范围）/ Base ref（含 SHA）/ Head ref（含 SHA）/ Commits（已提交数+未提交文件数分开）/ Files in scope（排除后计数）/ Excluded（点名）/ Surfaces expanded（扩展了谁+几个消费者未扩展）。
- OC2 每个发现带三态状态（IR5）。
- OC3 Verification 段列出跑过的每条 git/gh 命令及结果，**包括每一次对 `.git` 的写**（fetch/deepen/set-head/worktree），使"只读"声明可审计。

**规则条数合计：约 22 条（IR1–IR8 + SR1–SR9 + RS1–RS3 + OC1–OC3；RS1 为 10 行路由子表）。**

## ③ 对"工程质量四维度"的支撑点

- **组件化**：IR3 爆炸半径扩展（组件→渲染它的表面）与 SR9 的 importer 计数排序，直接以组件依赖图为评审单位；IR6(d) "控件加到兄弟表面"检查组件族一致性。
- **统一性**：IR6(a) 新 variant 未铺满全部状态、IR6(b) 字符串未入翻译目录，都是统一性回归的探测器；RS1 色 token→字面量路由到 better-colors。
- **可维护性**：三态分类让"本次变更引入的债"与"历史债"分离（Pre-existing 不背锅）；IR2 防止把别人的 commit 当评审对象；OC3 要求所有 `.git` 写可审计——与 workflowhub"记录事实、provenance 保留"完全同构。
- **性能**：本技能不直接覆盖性能（明确划给通用 code review）；间接支撑在于只读评审零副作用、shallow clone deepen 有界（50→200 即报 unresolvable 不死磕）。

## ④ 与 workflowhub 的精确集成点

| interface-review 机制 | 集成点 |
|---|---|
| 三态发现分类（Introduced/Regression/Pre-existing，按 diff 触及行判定 + git blame 确认） | **verify-change** 的发现分类层：每个质量/视觉发现必须带三态之一；也入 **review 链**（runtime/review/）作为 finding schema 字段 |
| IR1 范围解析顺序（merge-base 先于工作区）+ SR1–SR6 全部 git 命令集 | **verify-change**："变更范围解析"子流程原样搬入（默认分支解析、三点 diff、untracked 配对、shallow deepen 50/200、mid-rebase 探测） |
| IR8 永不改工作树 + worktree 隔离渲染验证 + 默认 Not verified | **isolated-browser-qa**：渲染验证默认 opt-in、用 `git worktree add /tmp/...` 隔离、verification 段审计 `.git` 写——直接成为该技能的只读约束 |
| IR4 + removed-signals 路由表（RS1 10 行 + RS2 等价替换清单 + RS3 搜索命令） | **frontend-component-quality**：变更评审时的"删除侧回归扫描"步骤；`-U0 | grep '^-[^-]'` 命令可直接落地 |
| IR6 声明意图对照（PR 标题/issue/commit message → 界面是否交付）+ 不完整变更四信号 | **verify-change** / **fullstack-slice-testing**：slice 完成度检查——状态覆盖（empty/loading/error/disabled/窄宽）、翻译条目、兄弟表面一致性 |
| IR3/SR9 消费者扩展（一跳/两跳/5 个上限/排序规则/声明未扩展数） | **verify-change** 的影响面评估：改动组件后确定要 QA 哪些表面；排序规则可复制 |
| IR7 "编排者不可用则停，不发明裁决" | **review 链治理**：质量裁决由独立来源产出、缺失时降级并点名（合 workflowhub 宪法"禁止自审自判"+ `unavailable` 不伪造通过） |
| OC1 scope block 七字段 | **verify-change** 的报告头格式 |
| SR8 排除清单 + 两个例外（字体/图片留在范围） | **verify-change** / **design-source-readiness** 的范围过滤规则 |

（ui-project-init / design-extractor / frontend-prototype-render / ui-parity-checklist / ui-visual-fidelity 与 interface-review 无直接对应环节——它是纯评审期技能。）

## ⑤ 移植风险

- **许可证**：MIT，可自由移植。
- **依赖**：零脚本；依赖 `git` + 可选 `gh` CLI（PR 目标需要；失败一律降级为"未找到 PR"继续）；命令全部只读（唯一写是 fetch/deepen/set-head/worktree 到 `.git`）。**移植成本为三者中最低的之一**（纯规则 + 命令清单）。
- **上游漂移**：低——git 命令稳定；但需注意它引用的 owner 技能族（better-accessibility/better-layout/better-typography/better-colors/better-writing/better-interface）是外部依赖：路由表中的 owner 在 workflowhub 里要重定向到对应内部技能（frontend-component-quality、ui-visual-fidelity 等），否则 RS1 路由悬空。
- **冲突**：(1) `disable-model-invocation: true` 表明其设计为"人显式发起"，与 workflowhub 自动 review 链的触发模型需显式调和（建议移植时去掉该 frontmatter 语义，改为工作流节点触发）；(2) 裁决词/严重度/cap 全部上交了 `better-interface`——**移植时 workflowhub 必须自己补这层**（可借 better-ui 的 HIGH/MEDIUM/LOW + Block/Needs changes/Approve，或 impeccable 的 P0–P3 + 四态 disposition，但只能选一套）；(3) "不报告 correctness/tests/security/performance"与 fullstack-slice-testing 的覆盖面需在任务分工文档里划清，避免双评审或漏评审。

## ⑥ 验证或推翻之前结论

**之前结论**："interface-review = 三态分类概念，并入 review 链"。

**判定：验证成立，但严重低估——它是一份完整的变更评审操作规程。**
- ✅ 三态分类（Introduced/Regression/Pre-existing）确认是核心概念之一（IR5），且带精确判定规则（按 diff 触及行而非文件、git blame 对 base 确认）——并入 review 链成立。
- ⚠️ 须扩展：除三态外至少还有四份同等价值的可移植资产——(a) **范围解析规程**（IR1/IR2 + SR1–SR6：merge-base 优先、无变更不发明、PR fetch-in-place、shallow deepen 有界、mid-rebase 探测）是 verify-change 的现成前置流程；(b) **爆炸半径扩展规则**（一跳/两跳/5 个上限/可复现排序/声明未扩展数）解决"改了一个组件该 QA 哪些页面"；(c) **removed-signals 删除侧扫描**（10 行路由表 + 等价替换白名单 + 一行 grep 命令）是低成本高价值的回归探测器；(d) **只读纪律**（IR8 + OC3：fetch 不 checkout、worktree 隔离渲染、`.git` 写可审计）直接呼应 workflowhub 的 evidence/provenance 治理。
- 建议结论修正为："interface-review = 三态分类 + 变更范围解析规程 + 爆炸半径扩展规则 + 删除侧回归扫描 + 只读纪律，整体并入 verify-change 与 review 链；三态字段进 finding schema"。
