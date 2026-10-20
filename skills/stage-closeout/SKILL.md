---
name: stage-closeout
description: 阶段已交付或用户要求独立收尾时，统一提交、PR、合并、推送、归档和工作区清理；先委派图更新，逐动作核已有授权，最终删除前确认一次真实范围。
---

# Stage Closeout

共享收尾方法供verify-code、build-prd、make-decision及独立宿主直接调用。make-decision 的轻档在实施与适用审查完成后触发物理交付；小改动按其已确认路线无独立审查轴。反思收口在前、物理交付在后。caller保留方向/稿件确认、质量裁决、正式task facts、reflection和stage-handoff；本方法消费当前真实来源并回实际交付结果，不生成第二套close plan、状态账本、public API或Git执行器。

## 1. 核输入与未完成范围

写PR/交付说明前，先读取 `skills/spec-specify/SKILL.md` 的「技能写作规范（WR001）」唯一正文，再执行本方法的写作动作；消费者是PR 读者与交付验收者。缺源如实 `unavailable`，此处只落实到达条件，不复制规范或改变原授权、失败与收口步骤。

收口前读当前决策记录的「级别与路线」，读不到按复杂路线处理并记缺口，不静默降档。四级每次收口都写业务仓 `Improvements`；无发现写具名依据，越界记不可用，不回落工具仓。反思与经验先由 caller 收口，物理交付随后消费其真实原件。

调用者提供当前task身份和外置task路径、认证worktree/目标repo、当前材料、质量与发现处置原件、真实授权原文/ref、当前分支/HEAD、目标分支/remote、允许写集、PR状态、需交付/归档/保留/清理的精确范围。按实际项目能力读取现有窄工具；缺工具只停相应动作，不能偷偷改用旧close控制面。

先读本项目`docs/standard-workflow.md`的「当前路线」与「stage 结束」及caller现有授权约定。用`runtime/interface/workspace-check.mjs`的`inspectWorkspace({root: targetRepoRoot, target: worktreeRoot, baseline, expectBranch})`核真实工作区，再用Git读分支/HEAD、remote URL、目标分支状态与dirty归属。不能在dirty main替任务树执行，不能stash或覆盖未知改动。以caller提供的真实task上下文核身份，不能从cwd猜task、伪造TaskHandle或修改task.json求通过。

主线同步预检：在PR及任务合并前，以caller声明的实际目标分支（通常`main`）、任务分支和remote为准；有remote时用`git ls-remote --heads <remote> refs/heads/<target-branch>`核具名目标分支tip。tracking ref OID与该tip不同时只fetch该具名分支并读回；后续`<target>`统一使用已核实同OID的tracking ref或OID。远端不可读或ref仍不一致就标unavailable，不拿旧ref冒充当前。用`git merge-base <target> <task>`、`git rev-list --left-right --count <target>...<task>`和`git log --left-right --oneline <target>...<task>`找双方独有提交；用`git diff --name-status <merge-base>..<target>`只看目标分支独有路径，再结合当前task材料和真实consumer判断是否影响本任务依赖的契约、同一消费者或集成基线。支持时用`git merge-tree --write-tree <target> <task>`预演冲突并保留退出和冲突路径；不要用两端tip的tree diff冒充一方独有变化，也不要只按ahead/behind计数决定合并。目标独有变更确实影响本任务或集成要求同步时，确认任务worktree干净后把目标分支普通merge进任务分支，并按`skills/resolving-merge-conflicts/SKILL.md`逐项保留双方行为、跑受影响检查及独立复核；无关变更且无依赖时记录独有提交/路径、预演结果和无需同步理由，不为分叉强行merge。冲突无法解释或超出授权写集时停该merge并交原owner。目标tip变化时重新核差异；该预检是事实判断，不新增gate或状态对象。

实现、质量/验收、发布、Git交付、物理清理各自说明。有效finding按caller合同处置，无法修复/未验证保持incomplete；不自行accepted_risk，也不把质量缺失单独当停止安全交付的许可证门。只读历史证据不改。完成：每个待执行动作有当前身份、实际目标、已授权范围或具体缺口，未完成质量/保留材料可定位。

## 2. 逐动作核授权，复用现有record/consume

build-prd最终稿确认只批准内容，**不授权commit/push/merge/archive/cleanup**；先查是否另有对应动作/范围真实授权。build-code/verify-code已有任务授权持续覆盖范围内必要commit/push/merge，不因阶段/新会话/HEAD变化重复提问。授权未含新增动作、目标或范围时只停该动作并向执行主会话说明所缺决定，其余安全工作继续。审查结果、fixture回复与机器默认值不能冒用户授权。

每次实际Git动作前，在**将执行该动作的仓库cwd**重新读branch/HEAD，核真实授权原文/ref和本次路径/远端范围，随后调用已有 `runtime/interface/git-authorize.mjs`。CLI形状如下，变量均来自上述真实输入，作为参数传入，不拼入待执行shell代码：

```bash
node "$AUTH_TOOL" record --operation "$OPERATION" --confirmation-ref "$USER_SOURCE_REF" --dir "$AUTH_DIR"
node "$AUTH_TOOL" consume --operation "$OPERATION" --step-id "$ACTUAL_STEP_ID" --authorization-ref "$EXACT_GRANT_REF" --dir "$AUTH_DIR"
```

`AUTH_TOOL`为已定位包内git-authorize工具绝对路径；`AUTH_DIR`为当前task外置证据中的既有授权目录，存储在可能删除的worktree之外。`EXACT_GRANT_REF`使用record实际返回的原件路径，不猜名字；同一次实际步骤消费其唯一step-id，不能借重复消费跳过新动作核对。动作只有现有commit/push/merge/pr/archive/cleanup六类，push-task仍是push的具名步骤，不造新operation。

普通非scoped授权绑定当前branch/HEAD；消费旧HEAD记录必须失败。实际HEAD/分支变化后，已有用户授权仍覆盖时自动重新record/consume，无需再问用户；不修改原grant，也不把新HEAD写回旧件。只在**build-code的commit**沿现实现同传`--phase build-code` record/consume，以同task/分支/阶段复用授权，实际每次HEAD仍记在consumed原件；其它stage、旧无phase记录和push/merge/pr保持原HEAD严格匹配。混合/不明记录用准确authorization-ref，不凭最新文件名选择。

动作命令用已有`runtime/interface/run-command.mjs`的`captureCommand({cwd, recordDir, slug, argv, timeoutMs})`或caller现有公共capture路径保存真实argv/cwd/exit/signal/超时取消/output_ref；优先argv，外置recordDir在worktree清理后仍可读。每次失败保原件，不填exit0，不复制raw镜像。完成：实际动作前授权范围、人读来源、当时branch/HEAD和consume原件能对应；拒绝时没有发生该动作。

## 3. 提交前委派知识owner更新

在任务worktree、功能写入结束且提交前，读取并调用 `skills/knowledge-graph/SKILL.md` 的更新分支。只把本任务真实改动路径和已有图/缓存/授权交知识owner；不是另一个图writer，不把全部repo交去重抽。代码图与文档图分别读回真实状态、原件/退出和未覆盖；exit1只有工具输出与空差异确证无工作时才解释为无变化，exit0不能证明文档更新。

文档先核本次变化与当前prompt/mode缓存miss，优先免费正常重放。新增抽取先给精确文档/份数、当前缓存、成本依据/区间与不确定性，取得本次真实范围许可；拒绝/未答保文档未更新，不冒代码命令成功为全图完成。图不可用/保存保护拒绝时保原始失败与影响，不绕过、不手改graph/manifest/cache，其它授权内交付继续。P1这类当前质量报告限制随图消费，不能靠收尾清掉未定事实。

图变化按knowledge-graph规则单列“非源码已知改动”的精确路径和文件数；图外越界仍按功能写集核。语义cache递归namespace按真实allowlist核，machine/未知ignored不盲目stage或删除。知识owner列本次创建且具名可再生的临时物与清理结果；不把整个graphify-out视为缓存。完成：代码/文档各自更新/未更新、费用事实、图payload写集及仍会生成的交付字节已读回；图事实不是质量pass。

## 4. 提交、推送任务分支与PR

对照当前材料、真实diff和允许写集，按具名路径stage，再读回索引。提交授权record/consume后执行普通commit；若无改动保真实no-change原因，不造空提交冒实施。读回commit/tree、branch/HEAD和clean状态。提交后任何新字节回本步骤核，不漏掉当前材料或本次图变化。

交付说明只在真正执行关闭的阶段生成。据真实task/spec、已验AC与未验项、base到task HEAD提交/diff、facts及测试原ref成稿。

- **Default**：普通 PR 正文读当前 task 的 `spec.md`；未传`delivery.pr`或body时复用close owner的`buildDefaultPrDescription`；来源、helper或环境probe缺失/不可读写明缺口，不编内容或宣称已生成。默认稿同按下列合同读回补缺。
- **Explicit**：body须有`Door`、`Blast Radius`两个独立非空行；缺项报`PR_DESCRIPTION_INCOMPLETE`，交producer补齐。
- **Environment**：支持时默认PR，仅明确`enabled: false`主动退出；不支持保原因与描述退commit。旧stored plan缺pr沿旧序兼容；生成描述不证明push、PR或读回，动作沿第2节授权。

沿Summary／Evidence／Merge Danger承载：

- **范围（Scope）**：Summary写关键变化和故意不做什么；title来自真实任务与提交语义。
- **影响面**：Merge Danger保`Door:`独立非空行，说明commit可回退及merge／远端／销毁的不可逆边界；`Blast Radius:`另行说明diff影响域、消费者、相关已知红及代价，明说其余不在本卡范围，未核风险写unknown；测试绿不冒发布。
- **验证（Verification）**：Evidence的Before／After引原内容、输出或失败／通过原ref，没有写未知。每条验证给真实路径与结果；未执行、unavailable和覆盖上限分明，facts空不编GREEN，模拟不冒外部效果。

完成：内容逐项可回源、字段完整；稿件、未验与实际PR分列，缺项保缺口。

先确定唯一PR写入路由。caller明确给出已有路由时沿用；否则，对GitHub remote优先用本机已有`gh` CLI。按已核的remote URL确定host和owner/repo，通过`runtime/interface/run-command.mjs`记录`gh auth status --hostname <host>`，确认活动账号与caller声明一致，不读取或输出token。没有可用的`gh`登录时，只使用caller明确声明、且写前已核实可访问目标仓库及PR写权限的替代路由；不能只因MCP/connector出现在工具列表就选它，也不安装或扩大应用权限。没有已配置可用路由时，保留实际读回并记`PR unavailable`，沿本节退路继续。

使用`gh`时，先完成本节前述`push-task`并读回远端同名分支OID；本地`HEAD`须与该OID一致。然后用`gh pr list --repo <owner/repo> --head <task branch> --base <target branch> --state all --json number,url,state,headRefName,baseRefName,headRefOid,baseRefOid`查找精确repo/head/base的现有PR。只复用唯一的open匹配项；把该项的`number`或`url`明确传给`gh pr view <number-or-URL> --repo <owner/repo> --json number,url,state,headRefName,baseRefName,headRefOid,baseRefOid`。只有读回仍为open、repo/head/base完全匹配，且`headRefOid`等于已读回的远端分支OID时才复用。若读回命令失败、状态变化、字段不符或OID不符，报告具体差异并停止PR路径，不转而新建或合并。存在多个open匹配项，或只有closed匹配项时，也停止并报告具体PR，不猜测或创建重复PR。没有匹配项时，按当前branch/HEAD核pr授权，通过`runtime/interface/run-command.mjs`执行`gh pr create --repo <owner/repo> --head <task branch> --base <target branch> --title <title> --body-file <prepared body>`。正文按本节内容合同生成并读回。保留原始命令、退出码和输出。

GitHub API/MCP返回`Resource not accessible by integration`时，保留原始失败并认定该integration的权限不足；它不说明本机`gh`账号无权，也不构成安装或扩大App权限的理由。已选定的写入路由遇到权限失败后不重试、不切换执行者；按`PR unavailable`处理并继续本节规定的退路。

创建成功后**立即显示真实PR URL**；使用本宿主现有artifact连接能力附到当前聊天，随后读PR/head/base/branch实际状态。`until=pr`只表示同次执行的一个可观察切片：先回URL，再在**同一次执行流**沿已有授权继续合并及剩余收尾，不创建或消费旧close plan/confirmation执行对象。只有第6节规定的最终物理范围确认尚未取得、且合并可能删除源任务分支时，才在合并前暂停；收到答复后沿同一任务流继续。这是唯一一次最终范围确认，不另加普通PR确认。PR需外部审查或合并保护而不能继续时如实报告那个外部条件，不能制造合并成功。

PR合并前读取PR宿主的“合并后自动删除源分支”设置。已开启时，合并会删除具名远端任务分支：先按第6节展示范围并取得那一次最终范围确认，再合并；该答复也覆盖后续清理，不重复询问。已关闭时沿同流继续；若设置无法读取或没有等价字段，不假定关闭，先把“合并可能删除该远端分支”列进第6节范围，在取得同一次确认前不合并。合并后仍读回实际分支状态，已自动删除就不再发起删除。

PR能力不可用/环境不支持时保真实错误，继续可执行的普通五步退路：commit → 归档已交付材料（仅最终范围确认后）→ merge → push → cleanup（仅确认范围内）。如果PR路线已先merge，后续归档在已交付目标分支单独提交/推送，重新按实际HEAD授权；不重做已完成动作，不借五步跳过最终确认。已授权可做动作继续，缺外部条件的路径零重试按本项目规则说明选项，不改换目的地/执行者洗掉失败。

完成：commit、push-task、PR分别有实际结果与原件；真实URL已回传或PR unavailable原因可定位，后续动作没有被内部切片伪装成停等门。

## 5. 合并与目标分支推送

合并前在目标repo重新核目标分支/HEAD、dirty归属、任务HEAD已交付内容和remote。按真实授权record/consume merge，用普通Git或已授权PR合并入口；冲突回原owner处理，图冲突仅交knowledge-graph方法按原件/版本核，不拿两方compose当三方裁定。目标分支有无关dirty时先保范围，不能checkout覆盖或强推。

本节是任务分支交付到目标分支；第1节判断的是目标分支是否需要先同步进任务分支，方向不同、分别读回，不以其中一个合并替代另一个。

读回目标分支确含预期任务提交/内容，再对该分支当前HEAD record/consume push，正常推送目标远端。用真实remote OID与预期HEAD比较，不把本地merge当远端已发布。失败/部分成功分开报告；不force、不回滚已发生事实，不用错误默认值补成功。后续若还有归档提交，重复的是该新提交必要push，不重复原合并或旧测试。完成：merge与push各自可回读，实际目标OID和未交付项明确；尚待最终清理与业务质量仍分别保留。

## 6. 最终归档和清理前一次真实范围确认

**归档、删除任务分支/worktree及交付清理前**，caller统一展示：实际交付/PR/图状态与质量限制；待归档的具名材料路径与目标；task-owned worktree路径；本地任务分支；实际存在的同名远端分支及PR合并是否会自动删除它；未知/私有/未交付/packet TTL等具名例外及保管位置；main/existing workspace明确保留。取得一次覆盖该实际范围的真实用户答复，不能把稿件确认、阶段事实、旧建议或当前默认策略当删除确认。

先核具名当前消费者是否必须使用材料的现有路径：能在本次授权范围内安全迁接的reader、技能链接和测试依赖，随归档更新到目标路径并读回；确需原路径且不能同批安全迁接的，逐项写明消费者、用途和保留原因。只读历史引用、immutable证据与图中历史source_file保留原文，不单独构成材料必须原位保留的理由；图更新按第3节与knowledge-graph规则执行，未更新如实说明。父规划材料仍被后续子任务消费时，保留其具体路径和用途，不由子任务归档/移动/删除父/兄弟材料；已安全交付也不等于所有执行侧资料可弃。旧worktree备忘逐件核外置唯一原件保管位置或用户明确可弃范围，本次备忘从创建就外置appendRecord，不因目录名当可丢缓存。确认拒绝/缺失时，若因PR合并可能自动删除源任务分支（包括宿主设置未知）而在merge前请求确认，则停该merge以及archive/删除/cleanup；其它场景只停archive/删除/cleanup。已完成commit/merge/push事实不改写，保留实际路径和下一步条件。确认只授权列出的物理范围，不接受质量风险或让incomplete变完成。

获确认后，对无需留当前路径的已交付材料普通`git mv`归档；仅保留前述确需原路径且不能安全迁接的具名例外。在实际执行分支按archive授权record/consume，归档新字节另核commit授权、提交并正常merge/push到目标；不使用旧task-close计划/恢复状态。若路径/HEAD/保留需求变化超原确认范围，先重新展示变化并取得新增范围答复；不靠时间或先前机器记录扩大授权。

完成：最终scope和真实答复原ref可读，归档/保留逐项实际结果可定位；拒绝或未答无对应副作用。

## 7. 安全移除、分支删除与逐项读回

先证明任务交付已在目标分支，工作区是本task-owned、已交付且无未交付或未知独有字节。已合入提交用真实Git ancestry/内容读回；未合入、目标漂移、同名远端包含独有提交时保留并报告，不能强删。读取 `runtime/task/workspace.mjs` 的 `inspectWorktreeCleanup(worktreeRoot)` 分类tracked/untracked、execution_sidecars、ignored_generated、ignored_unknown。**ignored不等于可丢**；graphify-out不在该自动生成白名单内，按knowledge-graph已知创建事实处理具名临时物；未知项逐件保管或在最终确认中明确可弃，未解决就保留该worktree。

复用caller已有认证TaskHandle；独立宿主可用现 `runtime/task/task-handle.mjs` 的 `openTask(absoluteTaskPath, projectName, taskId)`重新打开当前post任务，再由 `openCurrentTaskWorkspace`核真实绑定。不能手工brand或改immutable metadata。main与`workspace_mode=existing`保留，不能因为其路径碰巧叫任务名就删除。删除动作在**worktree之外、已核目标repo cwd**授权/采集，以免删掉正在执行的cwd和原件。

在最终cleanup范围内record/consume后，使用现owner而非新删除器：

```javascript
const removal = createTaskWorktreeRemoval(taskHandle);
const before = await removal.probe();
if (!before.satisfied) await removal.execute();
const after = await removal.probe();
if (!await removal.verify(after)) throw new Error('worktree removal not verified');
```

函数来自已读`runtime/task/workspace.mjs`，实际API需按调用项目现版本窄核。`FORMAL_CLEANUP_UNSAFE`、身份/注册不匹配或未知字节时停止该删除，不扩白名单求绿；existing返回skipped照实保留。执行前后分别读worktree列表、路径是否仍存在、错误和保留例外；仅方法返回不证明物理移除。

worktree确认已移除后，在目标repo按独立cleanup步骤授权，普通`git branch -d -- <实际任务分支>`删除已合入本地任务分支，禁止`-D`。删除同名远端任务分支前用`git ls-remote --heads`核真实存在/OID和已交付范围，再按本次远端删除授权record/consume后普通`git push <remote> --delete <实际任务分支>`；不存在记不存在，不造失败或删除成功。清理授权必须明确覆盖远端同名分支删除；范围不含则保留，不借push授权扩大。不得force/强推、整树丢弃或删除main/existing workspace。

交回caller逐项清单：实施/质量/业务验收/发布的真实状态；代码图、文档图；commit/push-task/PR/merge/push；归档/具名保留；worktree/本地分支/远端同名分支清理；每项实际命令/退出/原件及未完成owner/条件。caller据此保存已有正式事实与stage-handoff，报告实际不可变handoff绝对路径，本方法不另写第二进度对象。动作失败、unknown或skipped保原样，不用总计绿填平。

完成：每项声明都与实际效果及原件对应，本次自建临时物只清具名且确定可再生项；历史raw/review、未知/私有/未交付字节和父材料例外仍可读。真实PR服务、用户选择或外部平台未执行时明确未覆盖。

## 保全来源与迭代

来源权威：[catalog](../catalog.yaml#skills.stage-closeout)；本便携小卡非权威；单技能副本缺catalog时向来源维护者取登记。
交付内容取backnotprop/pstack的`skills/poteto-mode/playbooks/opening-a-pr.md`，2026-10-14固定研究成员SHA256 `931070f5674e81a191277253d4e02b1c45d091b223f93bf506d3896a428a5967`，commit unknown；只取三项含义，不搬强制ready、提交格式、六段模板、自动盯PR及上游reset/forge策略。

本方法抽取verify-code的授权/安全收口与standard-workflow当前默认安全收口，保build-prd稿件确认不授Git权；主线差异预检按本地用户要求补入，冲突处理复用`skills/resolving-merge-conflicts/SKILL.md`已有方法。原文中的same plan/confirmation仅保其“真实PR先回URL、同流续跑”行为，由当前真实输入和窄工具消费承接，不恢复旧plan/confirmation执行对象。caller的审查点、质量、交接、真实最终选择及阶段正式事实保持原owner；两caller接线由各Phase实施。

修改本方法时读取项目`skills/spec-specify/SKILL.md`的「技能写作规范（WR001）」唯一规范，逐项核任务身份、质量限制、授权/HEAD、目标分支独有改动与同步决策、冲突处理、图更新、PR、归档、push、worktree/本地远端分支清理和结果读回的保全。方法接收真实项目输入与已有工具能力，不绑定账号/任务绝对路径，不打包第二Git executor；工具不支持保unavailable，回原owner修，不新增控制面。

## 同仓方法依赖

`skills/knowledge-graph/SKILL.md`、`skills/spec-specify/SKILL.md`、`skills/resolving-merge-conflicts/SKILL.md`；按上文实际条件读取，搬运时需同时提供或由调用者提供可读原件。
