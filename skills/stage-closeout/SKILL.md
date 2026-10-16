---
name: stage-closeout
description: 阶段已交付或用户要求独立收尾时，统一提交、PR、合并、推送、归档和工作区清理；先委派图更新，逐动作核已有授权，最终删除前确认一次真实范围。
version: 1.0.0
---

# Stage Closeout

共享收尾方法供verify-code、build-prd及独立宿主直接调用。caller保留方向/稿件确认、质量裁决、正式task facts、reflection和stage-handoff；本方法消费当前真实来源并回实际交付结果，不生成第二套close plan、状态账本、public API或Git执行器。

## 1. 核输入与未完成范围

调用者提供当前task身份和外置task路径、认证worktree/目标repo、当前材料、质量与发现处置原件、真实授权原文/ref、当前分支/HEAD、目标分支/remote、允许写集、PR状态、需交付/归档/保留/清理的精确范围。按实际项目能力读取现有窄工具；缺工具只停相应动作，不能偷偷改用旧close控制面。

先读本项目`docs/standard-workflow.md`的「当前路线」与「stage 结束」及caller现有授权约定。用`runtime/interface/workspace-check.mjs`的`inspectWorkspace({root: targetRepoRoot, target: worktreeRoot, baseline, expectBranch})`核真实工作区，再用Git读分支/HEAD、remote URL、目标分支状态与dirty归属。不能在dirty main替任务树执行，不能stash或覆盖未知改动。以caller提供的真实task上下文核身份，不能从cwd猜task、伪造TaskHandle或修改task.json求通过。

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

项目/环境支持且未明确opt-out时沿caller现有PR路线。先在任务分支核push授权并正常push-task，读回远端同名分支实际OID；再核pr授权，用已配置PR能力创建/复用真实head/base对应PR，不猜URL。描述来自当前task/spec、已验AC与未验项、实际提交diff和原件，保Summary、Evidence、Merge Danger；Door与Blast Radius分别说明真实回退边界与影响域，不把测试绿冒发布。

创建成功后**立即显示真实PR URL**；使用本宿主现有artifact连接能力附到当前聊天，随后读PR/head/base/branch实际状态。`until=pr`只表示同次执行的一个可观察切片：先回URL，再在**同一次执行流**沿已有授权继续合并及剩余收尾，不等待新答复、不新增确认，不创建或消费旧close plan/confirmation执行对象。PR需外部审查或合并保护而不能继续时如实报告那个外部条件，不能制造合并成功。

PR能力不可用/环境不支持时保真实错误，继续可执行的普通五步退路：commit → 归档已交付材料（仅最终范围确认后）→ merge → push → cleanup（仅确认范围内）。如果PR路线已先merge，后续归档在已交付目标分支单独提交/推送，重新按实际HEAD授权；不重做已完成动作，不借五步跳过最终确认。已授权可做动作继续，缺外部条件的路径零重试按本项目规则说明选项，不改换目的地/执行者洗掉失败。

完成：commit、push-task、PR分别有实际结果与原件；真实URL已回传或PR unavailable原因可定位，后续动作没有被内部切片伪装成停等门。

## 5. 合并与目标分支推送

合并前在目标repo重新核目标分支/HEAD、dirty归属、任务HEAD已交付内容和remote。按真实授权record/consume merge，用普通Git或已授权PR合并入口；冲突回原owner处理，图冲突仅交knowledge-graph方法按原件/版本核，不拿两方compose当三方裁定。目标分支有无关dirty时先保范围，不能checkout覆盖或强推。

读回目标分支确含预期任务提交/内容，再对该分支当前HEAD record/consume push，正常推送目标远端。用真实remote OID与预期HEAD比较，不把本地merge当远端已发布。失败/部分成功分开报告；不force、不回滚已发生事实，不用错误默认值补成功。后续若还有归档提交，重复的是该新提交必要push，不重复原合并或旧测试。完成：merge与push各自可回读，实际目标OID和未交付项明确；尚待最终清理与业务质量仍分别保留。

## 6. 最终归档和清理前一次真实范围确认

**归档、删除任务分支/worktree及交付清理前**，caller统一展示：实际交付/PR/图状态与质量限制；待归档的具名材料路径与目标；task-owned worktree路径；本地任务分支；实际存在的同名远端分支；未知/私有/未交付/packet TTL等具名例外及保管位置；main/existing workspace明确保留。取得一次覆盖该实际范围的真实用户答复，不能把稿件确认、阶段事实、旧建议或当前默认策略当删除确认。

先核具名当前消费者是否必须使用材料的现有路径：能在本次授权范围内安全迁接的reader、技能链接和测试依赖，随归档更新到目标路径并读回；确需原路径且不能同批安全迁接的，逐项写明消费者、用途和保留原因。只读历史引用、immutable证据与图中历史source_file保留原文，不单独构成材料必须原位保留的理由；图更新按第3节与knowledge-graph规则执行，未更新如实说明。父规划材料仍被后续子任务消费时，保留其具体路径和用途，不由子任务归档/移动/删除父/兄弟材料；已安全交付也不等于所有执行侧资料可弃。旧worktree备忘逐件核外置唯一原件保管位置或用户明确可弃范围，本次备忘从创建就外置appendRecord，不因目录名当可丢缓存。确认拒绝/缺失只停archive/删除/cleanup，已完成commit/merge/push不改写，保留实际路径和下一步条件。确认只授权列出的物理范围，不接受质量风险或让incomplete变完成。

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

本方法抽取verify-code的授权/安全收口与standard-workflow当前默认安全收口，保build-prd稿件确认不授Git权。原文中的same plan/confirmation仅保其“真实PR先回URL、同流续跑”行为，由当前真实输入和窄工具消费承接，不恢复旧plan/confirmation执行对象。caller的审查点、质量、交接、真实最终选择及阶段正式事实保持原owner；两caller接线由各Phase实施。

修改本方法时读取项目`skills/spec-specify/SKILL.md`的「技能写作规范（WR001）」唯一规范，逐项核任务身份、质量限制、授权/HEAD、图更新、PR、归档、push、worktree/本地远端分支清理和结果读回的保全。方法接收真实项目输入与已有工具能力，不绑定账号/任务绝对路径，不打包第二Git executor；工具不支持保unavailable，回原owner修，不新增控制面。
