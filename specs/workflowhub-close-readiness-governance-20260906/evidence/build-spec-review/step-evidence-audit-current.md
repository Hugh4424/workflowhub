# build-spec 限定步骤证据核查

## 已执行

- 实际取时：2026-09-06T22:56:04+0800（本轮开始，系统 `date`）。实际 cwd：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-close-readiness-governance-20260906`。task：`workflowhub-close-readiness-governance-20260906`。
- 本报告只记录限定读取和内容对照；不是新增 gate、独立质量 verdict、完成声明或四材料以外的工作真相。owner=本次受委派核查子代理；consumer=本任务主会话的事实交接；不替代任何原始证据；保留为本轮静态审计证据，不进入 runtime、不自动更新。
- 已读取范围仅为以下七份原文件。先 glob 实际 packet 名称：仓根 `evidence/...` 无匹配，实际位于任务 `specs/.../evidence/...`。glob 同时显示的 result 文件未读取，不推断其结论。
- `read` 对 JSON 长行有显示截断，因此额外仅对三份已读 JSON 做本地解析、字段/长度/hash 对照与指定步骤名提取；未执行全仓搜索、测试、provider、发布或不可逆操作。没有读取或修改当前四材料，尤其没有把并行修改中的 spec 绑定到本报告。

### 原证据路径代号

所有相对路径基于上述 worktree；`#materials...:L` 为 JSON 解码字符串内的行号，而非物理 JSON 行号。

| 代号 | 原证据路径 |
| --- | --- |
| C | `CONSTITUTION.md` |
| K | `constitution-checklist.md` |
| M | `workflows/build-spec/steps.json` |
| W | `skills/wh-review/SKILL.md` |
| P6 | `specs/workflowhub-close-readiness-governance-20260906/evidence/build-spec-review/build-spec-review-input-v6.json` |
| P61 | `specs/workflowhub-close-readiness-governance-20260906/evidence/build-spec-review/build-spec-review-input-v61.json` |
| P62 | `specs/workflowhub-close-readiness-governance-20260906/evidence/build-spec-review/build-spec-review-input-v62.json` |

### 已执行：输入内容对照，不等于 reviewer 已执行

三份 JSON 的顶层字段均为 `stage, host_provider, materials`；stage 均为 `build-spec`，host_provider 均为 `opencode/v4flash`。materials 只有 `raw_requirement, approved_decision, draft_spec`，没有显式 lens 清单或逐步执行结果。host_provider 是路由输入，不是独立 reviewer 实际身份。

| 原证据 | 文件字节 SHA-256 | draft_spec 字符数 | 内容事实 |
| --- | --- | ---: | --- |
| P6 | `50ef0bf1350b9063ad117baa6a0c7cdc24773a7ab901c06d963c08d8ef239464` | 100651 | 历史草稿正文；标题“功能规格：WorkflowHub 收口准备治理与质量-成本治理” |
| P61 | `8d5f654b4ed1e65d761e278d059aa38207aff18ab178bae2235e730bbdb8b3d0` | 3500 | “build-spec 变更集 v6.1（focused review 范围）”，不是全量正文 |
| P62 | `47b2137bf0c4ea96e1ec3a9e299798a93fdea409fb2ff9ae1745c700d5bef9ac` | 5961 | “build-spec 变更集 v6.2（窄域核销审查范围）”，请求只核六处修复，不是全量正文 |

三包的 raw_requirement 相同（3490 字符；SHA-256 `653ebb9934c79ba5f472441af1c0b02d783da07da965690c85566d78ffb8cd3c`），approved_decision 相同（92612 字符；SHA-256 `5cb16b99e889208e4b30f7eb64dca721c9f4c923a32befa78860b6ee895fd42f`）。draft_spec 三者 hash 不同。因此不是同一字节 packet；同一系列旧输入不等于同一完整 spec 已反复核验。

### 无法证明：同一 review packet 已包括两项实际审查

- `simplicity-guard` 确有文本提及：P6/P61/P62 `materials.approved_decision` 解码 L404、L641、L723、L956；P6 `materials.draft_spec` L478、L1027–1028、L1203；P62 `materials.draft_spec` L32。语义为待改造的 inline 声明、实际路径对齐要求和 DEFERRED-008，不是本轮 simplicity lens 的调用、结果、删除/收窄/复用处置证据。
- `plan-ceo-review` 在三包全部 materials 字符串中没有字面出现。无字面出现不证明从未执行；但限定证据无法证明曾作为该 review packet 的 lens 执行。
- W L15–17、L38、L44–53 只规定 wh-review 审查提交字节、生成 stage 指令并经 broker 返回事实。该技能正文没有明确列出 build-spec 的两个 lens；实际生成指令/实现/结果不在核查范围。不能从 `stage=build-spec` 或 input 文件存在推导第5/6步已执行。
- W L88–102 明确 available/空 findings 不是批准或完成；本轮连实际 result 也未读取，不声称 available、unavailable、PASS 或 review 已完成。P61/P62 内嵌的“4 findings/8 findings/机器验证 PASS”只是输入材料的陈述，未独立核验。

## 当前 manifest 15 步证据映射

“无法证明”指在这七份限定原文件中无法建立该步骤实际执行及完成证据，不等于未执行。manifest 定义是合同，不是执行记录。所有步骤均回指 M 对应物理行。

| 步骤 | 状态 | 限定事实与原证据 |
| --- | --- | --- |
| 1 read-decision-log | 无法证明 | M L5 要求读 portable package/dependencies/current decision；P6/P61/P62 L6 仅有历史 decision 字节，不证明本轮读包和依赖动作 |
| 2 conditional-spec-research | 无法证明 | M L6；三包 approved_decision 包含历史调研引用，不构成当前 build-spec executed/skipped/unavailable 事实 |
| 3 spec-clarify | 不适用 | 仅限 P6 历史 draft_spec 解码 L8、L1220 明写 trigger=false、无规格歧义理由；不能推及正在修改的当前 spec，亦不能替代发生歧义时真实 ask/wait/reply |
| 4 spec-specify | 无法证明 | M L8；P6 的 draft_spec 证明历史草稿内容被装入输入，不能证明当前步骤及完整来源转译已完成 |
| 5 simplicity-guard | 无法证明 | M L9；P6 draft_spec L478/L1203、三包 approved_decision L956 是要求/延期项，未给出本步 lens 执行与具体处置结果 |
| 6 plan-ceo-review | 无法证明 | M L10；三包无该字面标识，无问题/范围/价值/替代/方向的本步实际审查记录 |
| 7 ui-project-init | 不适用 | 仅限 P6 历史 draft_spec 解码 L17、L220 的非 UI 描述；M L11 定义非 UI 记录不适用。当前任务适用性未重新绑定 |
| 8 design-source-readiness | 不适用 | 同上，历史非 UI 范围；M L12。未执行 UI readiness 核查 |
| 9 conditional-plan-design-review | 不适用 | 同上，历史非 UI 范围；M L13。未执行 UI prompt/preview/confirmation |
| 10 freeze-spec | 无法证明 | M L14；P6 为历史草稿、P61/P62 为片段，不能证明当前 spec 已冻结或完整 |
| 11 review-frozen-spec | 无法证明 | M L15；P6/P61/P62 是 input，不是独立 adapter run/result；W L88 禁止把存在/available 当通过 |
| 12 main-agent-disposes-findings | 无法证明 | M L16；P61/P62 draft_spec 陈述修复内容，但未读取原 findings/result/当前 spec，不能认证全部处置或核销 |
| 13 stage-end-spec-analyze | 无法证明 | M L17；approved_decision L822 的 stage-end-spec-analyze 是 make-decision 历史，不是当前 build-spec 终检 |
| 14 publish-spec-result | 无法证明 | M L18；未读取实际通知、stage-outcome 或交接事实 |
| 15 stage-reflection | 无法证明 | M L19；approved_decision L833–835 指 make-decision reflection，不可错配为 build-spec；本步合同 blocking=false |

### 无法证明：12 skill 的完整真证据映射

M 可直接数出 step_id/order 1–15，但没有 12 个 skill 的枚举、依赖绑定或执行结果。固定范围也不包含 `workflows/build-spec/skill-deps.yaml` 正文、build-spec SKILL 正文、各技能执行产物。故“15步”已做结构核对；“12 skill”计数、成员及逐项实际执行无法从限定证据证明。不得把15个 step slug 擅自等同15个或12个 skill，也不得从合同提到技能推断其已调用。

## 宪法逐条合规检查（只检查本次限定审计行为）

不是对当前 spec、实现或全项目颁发合宪结论。C F1–F11/Q1–Q3/S1–S8 与 K L9–36 共22项逐条列出；“已执行”仅表示所述本次动作可核对，不表示条款覆盖的全系统行为通过。

| 条款 | 状态 | 本次边界与原证据 |
| --- | --- | --- |
| F1 | 不适用 | C L12–17、K L9；不修改核心/编排 |
| F2 | 不适用 | C L19–24、K L10；不新增模块契约 |
| F3 | 已执行 | C L26–31、K L11；只读旧 input；不写四材料、不发布、不把审计当推进许可 |
| F4 | 已执行 | C L33–38、K L12、W L88–102；不把 input 或 finding 当 gate，不生成质量通过 |
| F5 | 已执行 | C L40–45、K L13；本报告不新增 gate |
| F6 | 不适用 | C L47–52、K L14；无正式 runtime publication 或执行身份认证，cwd 取值不冒充 clean/commit 证明 |
| F7 | 不适用 | C L54–59、K L15；无阶段确认、UI确认或不可逆动作 |
| F8 | 已执行 | C L61–66、K L16；固定七文件一次性核查，不建 runner/replacement 链 |
| F9 | 已执行 | C L68–73、K L17；区分存在、内容、执行、完成；缺项标无法证明，不绑定当前 spec |
| F10 | 已执行 | C L75–80、K L18；仅临时有界 JSON 分析，无新 CI/schema/自动化基建 |
| F11 | 已执行 | C L82–87、K L19；事实报告非控制面，不阻塞同任务修复；owner/consumer/保留边界见开头 |
| Q1 | 已执行 | C L91–96、K L23；未读取 result/逐 AC/当前交接，故不宣布阶段完成 |
| Q2 | 已执行 | C L98–103、K L24；本报告不合并可工作、发布真实、阶段完成三种命题 |
| Q3 | 已执行 | C L105–110、K L25、W L88；本子代理只给内容核查事实，未冒充异源 reviewer verdict；旧 review 独立来源无法从 input 证明 |
| S1 | 不适用 | C L114–119、K L29；未自研或引入通用技能 |
| S2 | 不适用 | C L121–126、K L30；未改外部技能 |
| S3 | 不适用 | C L128–133、K L31；未迭代外部技能，不调上游/provider |
| S4 | 不适用 | C L135–140、K L32；未自研技能或指标系统 |
| S5 | 已执行 | C L142–147、K L33；本轮在被委派独立上下文核查，主会话接收限定摘要；未据此宣称全项目技能合规 |
| S6 | 不适用 | C L149–154、K L34；未设计新技能 |
| S7 | 不适用 | C L156–161、K L35；未新增阶段/工作流目录 |
| S8 | 不适用 | C L163–168、K L36；未改技能宿主依赖 |

K L49–56 的 CLOSE-F9/Q1/F7/F3 属解释判据，不增加22条数量；本次未运行 close 或其测试，均不适用。旧 packet 内所有历史 completed/pass/确认/核实文本均原样保留，本报告不承接其质量裁决。
