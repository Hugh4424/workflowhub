# 设计宪法检查清单

> 与 `CONSTITUTION.md` 逐条对应的可勾选检查清单，供每个里程碑设计/落地时对照。
> 条目数严格等于宪法条目数（21）。每条勾选项后附判据，并回指宪法对应条款。
> 用法：设计/落地时逐条核对，符合则勾 `[x]`。

## 框架原则（F）

- [ ] **F1 薄核心** — 判据：核心是否只做调度编排、重活下沉技能层（改动牵连面小）。→ [CONSTITUTION.md#f1-薄核心](CONSTITUTION.md#f1-薄核心)
- [ ] **F2 窄契约** — 判据：模块间是否走窄而明确的接口、不暴露内部实现。→ [CONSTITUTION.md#f2-窄契约](CONSTITUTION.md#f2-窄契约)
- [ ] **F3 结构事实强校验质量事实分级处置** — 判据：身份/顺序/hash 等结构错误是否阻止成功发布，一般质量是否只记录，只有正式 `actionable + major|blocking` 才进入可承担风险的严重暂停。→ [CONSTITUTION.md#f3-结构事实强校验质量事实分级处置](CONSTITUTION.md#f3-结构事实强校验质量事实分级处置)
- [ ] **F4 质量靠异源审查与人严重问题窄暂停** — 判据：质量是否由独立来源+人处置，minor/invalid/unavailable 只记录，风险接受不改 verdict、不伪造 pass。→ [CONSTITUTION.md#f4-质量靠异源审查与人严重问题窄暂停](CONSTITUTION.md#f4-质量靠异源审查与人严重问题窄暂停)
- [ ] **F5 gate 谨慎添加出事再补无用则移除** — 判据：关卡是否按需添加、无用即移除，未预先堆砌。→ [CONSTITUTION.md#f5-gate-谨慎添加出事再补无用则移除](CONSTITUTION.md#f5-gate-谨慎添加出事再补无用则移除)
- [ ] **F6 统一外置执行记录** — 判据：是否按调用追加干净已提交的执行身份，且未把 runner 路径/OID 永久绑定进任务身份。→ [CONSTITUTION.md#f6-统一外置执行记录](CONSTITUTION.md#f6-统一外置执行记录)
- [ ] **F7 关键决策与不可逆操作不自动越过人** — 判据：正常确认是否仅 make-decision/build-plan/verify-code；build-spec/build-code 是否正常自动、只在正式严重 finding 时异常暂停；不可逆 close 是否独立授权。→ [CONSTITUTION.md#f7-关键决策与不可逆操作不自动越过人](CONSTITUTION.md#f7-关键决策与不可逆操作不自动越过人)
- [ ] **F8 简单优先** — 判据：正常工具升级是否由每次调用认证解决，未继续复制 runner 或追加 replacement 链。→ [CONSTITUTION.md#f8-简单优先](CONSTITUTION.md#f8-简单优先)
- [ ] **F9 可证伪不假绿** — 判据：dirty runner 或合同变化是否 fail-loud，记录的提交是否确为实际执行来源。→ [CONSTITUTION.md#f9-可证伪不假绿](CONSTITUTION.md#f9-可证伪不假绿)
- [ ] **F10 自动化按真实收益添加，不为"机器可校验"本身堆基建** — 判据：自动化(CI/校验/机器基建)是否真实收益大于长期维护成本、不为"机器可校验"本身预堆基建、能实跑的优先实跑。→ [CONSTITUTION.md#f10-自动化按真实收益添加不为机器可校验本身堆基建](CONSTITUTION.md#f10-自动化按真实收益添加不为机器可校验本身堆基建)

## 质量原则（Q）

- [ ] **Q1 一般质量记事实严重问题先暂停** — 判据：一般质量是否只记录；只有正式 `actionable + major|blocking` 才暂停，invalid/unavailable 不进入风险接受。→ [CONSTITUTION.md#q1-一般质量记事实严重问题先暂停](CONSTITUTION.md#q1-一般质量记事实严重问题先暂停)
- [ ] **Q2 gate 三类划分与严重问题异常处置** — 判据：入口校验/事实采集/人工确认是否仍分开；严重暂停是否只是五阶段窄异常，不把 build-spec/build-code 改成日常确认。→ [CONSTITUTION.md#q2-gate-三类划分与严重问题异常处置](CONSTITUTION.md#q2-gate-三类划分与严重问题异常处置)
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

**条目数**：21（框架 10 + 质量 3 + 技能 8），等于 `CONSTITUTION.md` 宪法条目数。
**勾选说明**：`[ ]` 未核 / `[x]` 已核符合。每条须能跳回宪法对应条款。
