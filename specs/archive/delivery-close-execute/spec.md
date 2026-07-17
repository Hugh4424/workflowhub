# Delivery Close Execute

## 目标

把 verify-code 已确认后的六个固定交付动作，从 Agent 手写 Git 命令改为现有 `task-close` 的受控 `execute` 入口，避免忘记提交、归档、合并、push 或清理。

## 证据

- `scripts/task-close.mjs` 目前只有 `prepare|confirm|complete|status`。
- `workflows/verify-code/SKILL.md` 仍要求 Code Verifier 手工执行六步。
- `core/task-close.mjs` 已有不可变 plan、plan-hash 确认、执行锁、step record、物理状态检查和 `executeClosePlan`，应直接复用。
- 当前 archive 校验只支持单个 `spec.md` 的 R100 rename，不能证明整个 task spec 文件夹已归档。

## 范围

1. 给 `scripts/task-close.mjs` 增加唯一新命令 `execute`，输入仅为任务身份、已准备的 plan hash 和绑定该 hash 的 close confirmation ref。
2. 固定执行现有六个动作：发布已验证 snapshot commit、归档整个 task spec 文件夹并提交、合并 task branch、non-force push target branch、删除 task worktree、删除已合并的本地 task branch。
3. 复用 `executeClosePlan` 的锁、逐步物理探测、create-only step record 和崩溃后 reconcile；不新增第二套状态机。
4. `prepare` 冻结本地 target baseline 和远端 target baseline；二者在准备时必须相同。target repo 必须正检出 target branch 且 clean。
5. merge 策略固定为 `--no-ff --no-edit`，不开放参数；push 固定为 non-force。
6. archive 从单文件改为整个目录纯移动：archive tree 与 source tree 完全相同，archive commit 只允许对应路径的 R100 rename，不得篡改或夹带文件。
7. `execute` 成功后用现有 delivery state 再核实六项事实，只有全部 ready 才写现有 completed record；`status` 保持诊断入口。
8. 更新 verify-code Skill：`prepare → 独立确认 → execute → status`；不再让 Agent 手写六步。

## 失败与恢复

- confirmation 为 rejected/timeout：零 Git 写操作。
- plan hash、target baseline、remote baseline、target checkout、clean 状态任一变化：在首个写操作前失败。
- merge conflict、remote 前进或 push 失败：立即停止，不执行后续动作，不自动 rebase、force、rollback 或吞错。
- 物理动作完成但 step record 尚未写入时，重跑以物理事实 reconcile，不重复提交、合并、push 或删除。
- 特别覆盖 `update-ref` 后但 worktree reset 前、`git mv` 后但 archive commit 前两种微中断。

## 非目标

- 不做通用 Git 发布框架、插件系统、任意 shell executor 或新 launcher。
- 不增加 PR、rebase、force push、自动解冲突、自动 rollback、远端 task branch 清理。
- 不修改 make-decision、build-spec、build-plan、build-code 的接受机制。
- 不修改 Multica Agent Prompt、Squad 或 runtime discovery；它们属于独立外部工作。
- 不增加新生产文件、新依赖、新 schema 或第二套 completed/恢复记录。

## 允许修改的文件

- `core/task-close.mjs`
- `scripts/task-close.mjs`
- `workflows/verify-code/SKILL.md`
- `tests/task-close-delivery.test.mjs`

只有旧通用 executor 回归测试确实需要适配时，才允许最小修改现有对应测试；不得扩大生产文件范围。

## 验收标准

1. `prepare` 对同一事实产生相同 plan hash；拒绝 dirty/wrong target checkout、本地与远端 baseline 不同、spec source 非目录或 archive 已存在。
2. rejected/timeout 的 `execute` 不改变任何 Git ref、worktree、文件或远端。
3. confirmed CLI 端到端完成固定六步：产生 no-ff merge、远端与本地 target OID 相同、完整 spec 目录无损归档、task worktree 与本地 task branch 均消失、completed 唯一。
4. 六个步骤各自发生“物理完成但记录未写”后重跑，均 reconcile 且不重复副作用；两种微中断可恢复。
5. archive 任一文件被修改、遗漏或夹带无关文件时，不能 complete。
6. merge conflict、remote 前进、push 失败、target dirty 均停止在失败点，后续动作未执行，`status` 能显示剩余事实。
7. 现有 delivery close 和 generic `executeClosePlan` 测试全部通过。
8. 生产代码净增超过 350 行时停止实施并回到计划审查；新依赖为 0。

## 宪法对照

- F1/F2：只扩展现有 close 窄入口与 executor seam。
- F7：六个不可逆动作继续由独立、plan-hash 绑定的 close confirmation 授权。
- F8/F10：固定六步，无插件、策略框架或第二套恢复系统。
- F9：所有物理事实可证伪，失败明确暴露。
- Q3：spec、plan 和代码均使用独立 3rd-review。
