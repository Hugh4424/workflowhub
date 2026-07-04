# 3rd-review 独立审查记录

## 元数据

- task_id: worktree-unification
- 审查时间: 2026-07-04
- 审查方式: 异源独立审查（codex，非降级）
- 调用方式: `timeout 280 codex exec -o /tmp/codex-review-worktree-unification.md "<prompt with full spec content>"`，独立会话，model gpt-5.5 bingchaai，审查对象为 specs/worktree-unification/spec.md 全文
- 禁止自审自判（FR-REVIEW-002）: verdict 由 codex 独立上下文产出，本 agent 未参与裁决，仅记录产出

## verdict

patch incorrect（overall_confidence_score: 0.86）

verdict: **revise_required**

## findings（11 项，按严重度排列）

### 严重（5项）

**F-01｜status 字段与"后续 stage 只读"冲突**
位置：§3 FR-WORKTREE-CONTRACT-001、§4 约束
问题：`worktree.json.status` 有 active/cleaned，但 spec 规定 make-decision 写入后后续 stage 只读。close 清理后 cleaned 状态永远无法写回，状态机不可实现。
建议：允许 verify-code close 阶段更新 status=cleaned（唯一可写字段），或删除 status=cleaned 改用实际存在性判断。

**F-02｜build-code 旧创建 worktree fallback 路径未明确废除**
位置：spec.md:66, spec.md:150；仓库事实：workflows/build-code/SKILL.md:313-315
问题：spec 要求 worktree.json 缺失时 fail-loud，但现有 build-code §17 写明文件不存在时由 build-code 自行创建 worktree 并写入。旧 fallback 会绕过 fail-loud 契约。
建议：新增明确要求：修改 build-code §17 删除"File does not exist → create worktree"路径，改为"missing → stop/escalate_to_human"。

**F-03｜commit 策略与现有 build-code 原子提交策略冲突**
问题：spec 要求每 stage 一次 commit，但未说明与现有 build-code 原子提交约定如何衔接；merge 是否 --no-ff 未定义；push 是一条命令还是多个动作不清楚。

**F-04｜重跑逻辑与"分支已存在 fail-loud"冲突**
位置：§4 边界场景
问题：spec 说 worktree.json 已存在时读取现有记录；同时说目标分支已存在时 fail-loud。正常重跑同一 active task 时分支必然已存在，两条规则互斥。
建议：补明确状态表：worktree.json 存在且 status=active → 复用并校验；worktree.json 不存在但分支存在 → fail-loud；status=cleaned → 拒绝或要求新 task-id。

**F-08｜"verify-code gate 通过"与宪法质量门模型冲突**
位置：spec.md:57, :115, :151；宪法：F3/F4/Q1/Q2
问题：spec 多处把 verify-code 描述成 gate，gate 未通过时阻止 close。宪法要求质量裁决靠异源审查与人，不靠阻断式质量门。
建议：改语义：写"verify-code 产生 final verdict 与 coverage facts；不可逆 close 只能人工确认后执行；verdict 非 success 时显眼展示，不自动 close"。

### 中等（5项）

**F-10｜task-dir parser 缺失语义未覆盖 config 文件不存在 vs 字段不存在**
建议：验收标准拆两条：未设 env 且 config 文件不存在 → 抛错；未设 env 且 config 存在但无 task_dir → 抛错。

**F-11｜WORKFLOWHUB_TASK_DIR 边界值未定义**
问题：未定义空字符串、相对路径、~、不存在目录该如何处理。
建议：env var trim 后为空视为缺失；必须是绝对路径；目录不存在由写入阶段自然报错或 parser fail-loud，二选一。

**F-12｜target_repo_root 默认"当前会话工作目录"风险过高**
问题：Multica 多 agent 环境下当前工作目录不一定是目标仓根目录。
建议：默认推导改为 `git rev-parse --show-toplevel`，并校验等于调用方提供的 target repo。

**F-13｜branch 命名规则不足以避免冲突**
问题：只说"task-id 为前缀"，未定义 exact pattern，重跑是否复用同一分支不清楚。
建议：定义精确格式如 `workflowhub/{task-id}`；重跑时 status=active 且 branch 匹配 → 复用；否则 fail-loud。

**F-14｜worktree.json schema 太松**
问题：缺少路径必须绝对、worktree_root 必须存在于 git worktree list、branch 必须匹配 worktree HEAD 等校验。

### 轻微（1项）

**F-24｜Spec-Purity 对 Markdown 表格 | 字符的 warn 无处理规则**
建议：明确结论：本次 | 命中为 Markdown 表格 false positive，不要求改 spec，不处理。

## 总结（codex 原文）

不能 pass。核心问题是状态机、重跑、commit/push/close 的 git 上下文不够一致。修完上述 F-01~F-08 后，spec 才适合进入 build-plan。

修复优先级：
1. 先定契约所有权：make-decision 创建，build-code/verify-code 只读，close 可更新 status=cleaned；或删 status。
2. 再定 git 策略：保留单阶段原子提交，close archive 单独提交；明确 merge 是否 --no-ff；明确 push 次数。
3. 重写 fail-loud 语义：区分入口缺失、质量事实、不可逆操作人工确认，避免把 verify-code 做成阻断式质量门。
4. 同步三份辅助产物：constitution-check.md、requirements.md、spec 附录，清掉假绿和已解决/待确认冲突。
