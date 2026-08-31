# 设计宪法检查清单

> 与 `CONSTITUTION.md` 逐条对应的可勾选检查清单，供每个里程碑设计/落地时对照。
> 条目数严格等于宪法条目数（22）。每条勾选项后附判据，并回指宪法对应条款。
> 用法：设计/落地时逐条核对，符合则勾 `[x]`。

## 框架原则（F）

- [ ] **F1 薄核心** — 判据：核心是否只做调度编排、重活下沉技能层（改动牵连面小）。→ [CONSTITUTION.md#f1-薄核心](CONSTITUTION.md#f1-薄核心)
- [ ] **F2 窄契约** — 判据：模块间是否走窄而明确的接口、不暴露内部实现。→ [CONSTITUTION.md#f2-窄契约](CONSTITUTION.md#f2-窄契约)
- [ ] **F3 四材料决定推进正式发布保持结构真实** — 判据：四材料是否只决定进入/继续；task/worktree/runtime 写边界、hash、顺序和核心 publication 错误是否在写成功前 fail-loud。→ [CONSTITUTION.md#f3-四材料决定推进正式发布保持结构真实](CONSTITUTION.md#f3-四材料决定推进正式发布保持结构真实)
- [ ] **F4 质量靠异源审查与人，finding 不锁死修复** — 判据：review 是否不作阶段 pass gate；serious finding 是否保留 repair-or-risk 且不阻止同任务修复。→ [CONSTITUTION.md#f4-质量靠异源审查与人finding-不锁死修复](CONSTITUTION.md#f4-质量靠异源审查与人finding-不锁死修复)
- [ ] **F5 gate 谨慎添加出事再补无用则移除** — 判据：关卡是否按需添加、无用即移除，未预先堆砌。→ [CONSTITUTION.md#f5-gate-谨慎添加出事再补无用则移除](CONSTITUTION.md#f5-gate-谨慎添加出事再补无用则移除)
- [ ] **F6 统一外置执行记录** — 判据：正式写入是否认证当次干净已提交内容，且未把 runner 永久绑定任务或把旧身份记录当准入 gate。→ [CONSTITUTION.md#f6-统一外置执行记录](CONSTITUTION.md#f6-统一外置执行记录)
- [ ] **F7 三处正常确认与 UI 限定设计确认；不可逆操作独立授权** — 判据：make-decision/build-plan/verify-code 是否各自确认且不作进入许可证；`ui_applicability=ui` 时 build-spec 是否展示原型并取得第四处限定确认（UI 设计确认事实须含 `display_before_reply` 与 `human_approved`）；非 UI/build-code 是否不新增日常确认；commit/push/merge/archive/cleanup 是否另行授权。→ [CONSTITUTION.md#f7-三处正常确认与-ui-限定设计确认不可逆操作独立授权](CONSTITUTION.md#f7-三处正常确认与-ui-限定设计确认不可逆操作独立授权)
- [ ] **F8 简单优先** — 判据：正常工具升级是否由每次调用认证解决，未继续复制 runner 或追加 replacement 链。→ [CONSTITUTION.md#f8-简单优先](CONSTITUTION.md#f8-简单优先)
- [ ] **F9 可证伪不假绿** — 判据：推进资格、publication 真实性和完成判据是否分别证伪，dirty 内容是否拒绝伪装成 HEAD，缺质量工作是否保持进行中。→ [CONSTITUTION.md#f9-可证伪不假绿](CONSTITUTION.md#f9-可证伪不假绿)
- [ ] **F10 自动化按真实收益添加，不为"机器可校验"本身堆基建** — 判据：自动化(CI/校验/机器基建)是否真实收益大于长期维护成本、不为"机器可校验"本身预堆基建、能实跑的优先实跑。→ [CONSTITUTION.md#f10-自动化按真实收益添加不为机器可校验本身堆基建](CONSTITUTION.md#f10-自动化按真实收益添加不为机器可校验本身堆基建)
- [ ] **F11 正常执行优先、控制面受限** — 判据：合法普通任务是否能顺畅执行；会阻塞、持久化、写事实或改变 public 行为的控制面是否有已证明边界、唯一 owner、真实 consumer、完成 oracle 和失败语义；复杂度判断是否没有另造运行时计数器或 gate；辅助事实缺失是否未被擅自升级成工作阻塞。→ [CONSTITUTION.md#f11-正常执行优先控制面受限](CONSTITUTION.md#f11-正常执行优先控制面受限)

## 质量原则（Q）

- [ ] **Q1 质量事实不作准入证完成质量不降级** — 判据：finding 是否不阻止继续修复；测试、逐 AC、独立 review/真实 unavailable 和交接缺失时是否禁止报完成。→ [CONSTITUTION.md#q1-质量事实不作准入证完成质量不降级](CONSTITUTION.md#q1-质量事实不作准入证完成质量不降级)
- [ ] **Q2 推进资格发布结构与完成判据分离** — 判据：四材料是否只证明可工作；结构错误是否拒绝 publication；完整质量工作是否才证明完成；不可逆操作是否独立授权。→ [CONSTITUTION.md#q2-推进资格发布结构与完成判据分离](CONSTITUTION.md#q2-推进资格发布结构与完成判据分离)
- [ ] **Q3 异源审查加人工把关** — 判据：质量裁决是否异源独立；本地执行身份是否只证明结构事实、未冒充质量 verdict。→ [CONSTITUTION.md#q3-异源审查加人工把关](CONSTITUTION.md#q3-异源审查加人工把关)

## 技能原则（S）

- [ ] **S1 能用外部就不造轮子** — 判据：通用能力是否优先复用外部、文件直放项目内。（含原 S2"外部技能文件直接放项目内"，已并入本条作为落地手法。）→ [CONSTITUTION.md#s1-能用外部就不造轮子](CONSTITUTION.md#s1-能用外部就不造轮子)
- [ ] **S2 外部技能可针对项目改造合宪** — 判据：采用的外部技能是否按需改造至合宪。→ [CONSTITUTION.md#s2-外部技能可针对项目改造合宪](CONSTITUTION.md#s2-外部技能可针对项目改造合宪)
- [ ] **S3 迭代时保持最新并就地检查** — 判据：迭代时是否查更新/更优、来源路径写进技能文件。→ [CONSTITUTION.md#s3-迭代时保持最新并就地检查](CONSTITUTION.md#s3-迭代时保持最新并就地检查)
- [ ] **S4 自定义技能必须有指标系统** — 判据：自研技能是否配套指标、纳入统一执行记录。→ [CONSTITUTION.md#s4-自定义技能必须有指标系统](CONSTITUTION.md#s4-自定义技能必须有指标系统)
- [ ] **S5 自定义技能方便子代理调用省主上下文** — 判据：自研技能是否便于子代理调用、减少主上下文占用。→ [CONSTITUTION.md#s5-自定义技能方便子代理调用省主上下文](CONSTITUTION.md#s5-自定义技能方便子代理调用省主上下文)
- [ ] **S6 自定义技能参考市面方案不闭门造车** — 判据：自研技能是否参考成熟方案优化。→ [CONSTITUTION.md#s6-自定义技能参考市面方案不闭门造车](CONSTITUTION.md#s6-自定义技能参考市面方案不闭门造车)
- [ ] **S7 一阶段一技能一工作流一文件夹** — 判据：阶段/工作流是否一一对应独立、按目录约定、核心零改可加。→ [CONSTITUTION.md#s7-一阶段一技能一工作流一文件夹](CONSTITUTION.md#s7-一阶段一技能一工作流一文件夹)
- [ ] **S8 自定义技能可独立调用可搬运** — 判据：自研技能是否可独立调用、可跨宿主搬运、不绑死环境。→ [CONSTITUTION.md#s8-自定义技能可独立调用可搬运](CONSTITUTION.md#s8-自定义技能可独立调用可搬运)

---

**条目数**：22（框架 11 + 质量 3 + 技能 8），等于 `CONSTITUTION.md` 宪法条目数。
**勾选说明**：`[ ]` 未核 / `[x]` 已核符合。每条须能跳回宪法对应条款。

**治理同步记录（2026-08-03）**：本轮只同步执行边界和交接材料，未新增、改写、拆分或合并宪法条款；条目数和逐条映射保持不变。

**治理同步记录（2026-08-25）**：新增 F11“正常执行优先、控制面受限”；F1-F10、Q1-Q3、S1-S8 原编号保持不变；条目数由 21 增至 22。

**治理同步记录（2026-08-30）**：F7 修订为三处正常确认加第四处限定确认（UI 设计确认）：仅 `ui_applicability=ui` 由 build-spec 展示原型后取得 `display_before_reply` 与 `human_approved` 确认事实；非 UI 和 build-code 不增加日常确认。条目数仍为 22，未新增条款。

## close 三义判据（非宪法新增条款，仅作可复核解释清单）

以下四项判据不新增宪法条款，也不作为阶段推进或完成 gate；仅用于本次任务落地时复核宪法既有条款是否被正确解释。每条回指 `CONSTITUTION.md` 治理边界节中的"close 三义"解释。

- [ ] **F9 可证伪不假绿** — 判据：五个交付动作是否只在真实执行成功后才落账；失败/缺项时是否保持"未成功"状态，而不是把 risk/人为动作改写成正常完成。→ [CONSTITUTION.md#f9-可证伪不假绿](CONSTITUTION.md#f9-可证伪不假绿)
- [ ] **Q1 质量事实不作准入证，完成质量不降级** — 判据：质量事实（测试、审查、AC）是否独立记录；completed.json 等物理交付记录是否不写 quality_status/product_release_status；质量缺口是否诚实地用缺失/风险接受事实承接，不漂白。→ [CONSTITUTION.md#q1-质量事实不作准入证完成质量不降级](CONSTITUTION.md#q1-质量事实不作准入证完成质量不降级)
- [ ] **F7 三处正常确认与 UI 限定设计确认** — 判据：UI 原型确认是否不等于 cleanup 等不可逆动作授权；不可逆动作是否在任一阶段确认之外再经独立 authorize 授权。→ [CONSTITUTION.md#f7-三处正常确认与-ui-限定设计确认不可逆操作独立授权](CONSTITUTION.md#f7-三处正常确认与-ui-限定设计确认不可逆操作独立授权)
- [ ] **F3 四材料决定推进，正式发布保持结构真实** — 判据：close 相关的 preflight（task/worktree/runtime 身份、hash、写集合）是否在正式写成功前 fail-loud，而不是到了清理阶段才报身份错误。→ [CONSTITUTION.md#f3-四材料决定推进正式发布保持结构真实](CONSTITUTION.md#f3-四材料决定推进正式发布保持结构真实)

- **CLOSE-F9**：close 动作测试中不得伪造通过或把未完成状态漂白为完成；所有 GREEN 必须来自真实实现修复，completed.json 不写入 quality_status/product_release_status。
- **CLOSE-Q1**：close 阶段收口只负责把物理交付事实落账，不把质量通过作为 close 前提；质量判定保留在 verify-code/quality facts 中。
- **CLOSE-F7**：cleanup 等不可逆动作执行前必须有一次独立的人工确认绑定，确认范围覆盖本次 close 整批五个动作。
- **CLOSE-F3**：写 close 完成记录前必须断言任务身份、runner 身份与当前 cwd 一致；cwd 不在任务 worktree 内时 fail-loud。
