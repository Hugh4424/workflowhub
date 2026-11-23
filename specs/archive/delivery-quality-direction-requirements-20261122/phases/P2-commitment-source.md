# Phase P2 — 原话与承诺

本文件给实施者、独立测试者和首判读者。
首判是本段第一次独立验收；承重承诺指下游据以设计或验收的约定。
其强度沿[承诺四态](../../../GLOSSARY.md#方向与选择)定义。
精确命令、路径、机器标题及标签是写作行宽与标题规则的例外。

## 哪些节必须写，哪些可以省？

保留开工、写入、验收和接手所需各节；末验只在最后一阶段写。

| 节 | 状态 | 理由或实际内容 |
| --- | --- | --- |
| 选节、交付、验收、依据 | `written` | 局部结果、首判和来源 |
| 读什么、文件、验证、消费者 | `written` | 真实入口、定序写主、反例及回修 |
| 任务卡、机器字段 | `written` | 一张可实施的卡及文件约定 |
| 独立验收的写作脚手架、模板示例和补充材料 | `not-applicable` | 不是交付正文 |
| 末验检查 | `not-applicable` | 阶段七引用本阶段首判 |

## 这一 Phase 交出什么？

读者能从当前决定块回到完整原话，分清用户承诺、派生建议和被否方案。

- **本阶段结果**：真正被链检查读取的决定块，每行保留承诺状态和来源。
- **改动前**：包的「最终决定」普通标题不是带映射的决定块。
- **改动后**：缺源、未具名待定、冒名或语气抬高可显名。
- **非目标**：保留原答复索引、历史材料与现有检查入口。
- **相邻边界**：只交可追原话的决定，不交覆盖或真实首卡。
- **风险**：严格分支误伤旧日志；撤本段分支并保原提示路径和失败。
- **下一步**：首判后交回当前模板、检查器、合约和决定块。
- **动手前必读**：依下方读集找决定块、旧编号和既有严格分支。
- **未决事实**：目标用例与真实链复验须在实施时取得；旧回执不顶替。

### 开工就绪表

在全局检查之外，核既有合约和原答复是否可供冻结验证。

| 命令 | 期望 | 证据 | 机器或人判 | 负责人 |
| --- | --- | --- | --- | --- |
| `test -r tests/contract/decision-evidence-consumption.test.mjs` | 0 | quality/tests/p02-readiness-contract.output | 机器 | 阶段二开发 |
| 从日志证据索引解析任务根内的唯一索引并比实算 SHA-256 | 与日志绑定一致，原话锚点可回读；规格冲突回原作者 | quality/tests/p02-real-source.readback.md | 人 | 材料主会话 |

## 这一 Phase 怎么验收？

验收 2 的判据只在[规格附录 A](../spec.md#appendix-a--验收判据唯一权威)，机器和独立读者都要判。

**验收 2。** 用户认得完整原话和承诺强度，派生建议不冒成批准。
先跑下节定向合约，再用公开入口核当前日志、索引和真正答复。
本机 Node、现有测试运行器和夹具足够。
主会话在本任务内组织材料写主、独立测试者与独立读者，查本任务决定块和映射。
缺完整真实原话时，主会话回原始问答与现有索引查证；查不到保缺，不向别的任务转交。
读者以完整问答核语气、时点和适用范围；被否方案仍在原位置。
截半却声明完整行、错锚或与声明范围不匹配，由机器显名。
派生冒用户、错误映射及无决定条目仍须显名。
另用仍连续的截短原句：删限定语、缩窄引文，让语气变强。
机器定位成功也不是通过；独立读者对照完整问题和答复后必须拒绝。
真跑实例保留同一命令的改前目标失败、改后通过与真实链复核。
独立测试执行者留原始输出，另一未参与读者在回修后立即首判。
读回计划落 `quality/tests/p02-real-source.readback.md` 并附原件引用。
失败由原检查器写主或材料主会话修，不能修索引、删负例或改断言求绿。

| 账目 | 规格附录 A 验收 2的来源或读数 |
| --- | --- |
| 成本七字段 | `executor=独立测试执行者与读者; estimate_min=18; hard_cap_min=36; resources=当前索引、决定块、原始答复、目标合约测试; observation=具名机器错误与原句语义对照; retry_cap=0; evidence_tier=命令与语义原件级` |
| 资源 | 材料主会话给原话和决定；测试作者给合约负例；只测字符串会漏语义拔高 |
| 范围 | 仅承诺与来源首判，首卡只收供件 |

任务形状：一条验收，模板、材料和一个命令入口，定向本机运行。
夹具是合成小样，真实问答来自当前任务；无外部服务或完整数据长跑。
测试执行者和语义读者相互独立；真实链复读使用机器原件，不重复运行。
`acceptance_cost_total=18 active_min`；串行预算已含共享准备，原样重跑预留为零。
`phase_budget` 的软上限、硬上限及差异阈值未确认，回计划负责人核对。
`execution_budget={window_minutes:unknown,command_cap:unknown,wait_cap:unknown,retry_reserve:unknown}`。
执行窗口和等待以分钟计，命令与预留以次计；未取得执行策略，不补默认。
真实材料、独立审查、环境纯等待分别记墙钟，不计活动分钟。
无界面验收：不改、不读、不驱动页面、路由、组件或样式。

## 为什么现在做，依据是什么？

先保住来源与强度，下游才能把原话用进覆盖、变更和首卡。
[决策日志](../decision-log.md#包2原话与承诺)记录把承诺写进实际被读的决定块。
用户只确认七包整体方向；包二的逐包原话未取得，不当作包级确认。
阶段一处理问题去向，阶段三接本段决定和检查器做覆盖；本段不替两段验收。

## 开始前读什么？

先区分可核对的用户原话与历史登记，再读决定块入口和合约夹具。

| 材料或锚点 | 本段用法 | 时机 |
| --- | --- | --- |
| [规格](../spec.md#实现设计全局权威) 与附录 A 验收 2 | 核写集、同一判据和给首卡的供件边界 | 开工前 |
| [日志](../decision-log.md#包2具体改什么怎么改怎么验)；任务根 `quality/evidence/decision-maker/p02/card.md:7–17,24–29` | 核真决定块、语气兼容和历史阈值负例；骨架答复不冒包答复 | 开工前 |
| `skills/decision-log/templates/decision-log-template-v2.md:151–155`；`tools/cli/check-decision-log-chain.mjs:137,563–590,1004–1029` | 定位已有区段与来源读取入口 | 改前 |
| `tests/contract/decision-evidence-consumption.test.mjs:38,233–244`；任务根 `quality/evidence/build-plan/testing-blueprint.md:128–157` | 复用夹具和现有具名回归；锁定定向命令 | 冻结测试前 |

## 每个文件由谁改，先做什么？

用最终决定和真实日志做一个最小贯通，不从另造索引开始。

| 精确路径 | 动作、唯一写主 | 消费者及输入 |
| --- | --- | --- |
| `tests/contract/decision-evidence-consumption.test.mjs` | 先由预写测试作者按现有夹具增具名目标组，冻结后开发只读 | 独立测试者；完整答复和受控坏例 |
| `skills/decision-log/templates/decision-log-template-v2.md` | 修改「最终决定」示范真实决定块；阶段二开发 | 材料作者；既有映射与父块约定 |
| `tools/cli/check-decision-log-chain.mjs` | 仅扩 `decisionSections` 及 `checkDecisionLogChain` 对承诺/来源的窄分支；阶段二开发 | 现有公开链检查；决定块与受保护索引 |
| `specs/delivery-quality-direction-requirements-20261122/decision-log.md` | 补真正的决定块和旧编号对照；材料主会话独占 | P3、P4、P6；可回读的原话及其实际适用范围；缺包级原话保缺口，不造空映射 |

本段不新增静态路径；测试和开发二者不能同写测试文件。
先交冻结测试和真实目标失败，再由开发持笔改生产接缝，材料主会话独写日志。
`DO NOT TOUCH` 是边界声明；独立审核须实际核权限和测试字节。
绝不可把声明本身当作物理只读证明。

| 禁止改动或只读路径 | 实读与保护理由（2026-11-23，read/grep/shasum） |
| --- | --- |
| 任务根 `quality/evidence/decision-log-refs/requirement-index.md` | SHA-256 `18d9115eb5e60d59fd567ca2feea12dcf3fc40fa2df8d5b3c169d3630e2d3f5b`；角色是来源，不改字节或列求绿 |
| 任务根 `quality/evidence/decision-maker/p02/card.md` | `source_id：U-004`；保现归档字节，不按卡末骨架答复续写确认 |
| `workflows/make-decision/SKILL.md` | `step-module-convergence` 属阶段一及其后续写序；本段不抢写流程或加步骤 |
| `tests/contract/decision-evidence-consumption.test.mjs` 的冻结断言 | 基线第 233–244 行 `reads mapped 决定 N blocks at h3/h4 and checks their tone`：两种标题层级的许可语气接纳，抬成必须报 `ANSWER_MODALITY_MISMATCH`；新增目标断言尚未预写执行 |

**定序写主。** 阶段一与本段只在实际独立输入、互斥写路径下并行。
本段可用既有真实原话开工，不等待阶段一的新批次。
本段交回模板、检查器、测试原件和日志；阶段三在同批字节上加覆盖。
模板、日志其后由阶段四接手；合约其后由阶段五接手。
每次先交当前可回读文件、改动块及冻结用例边界，再由后写主增量修改。
读回不可得时记未知和影响，回前写主；阶段二开发合并本段差异。
独立审查按真实 `git diff --name-only` 判断是否越界。
游标只读任务事实的 `phase_progress`；不在本文件保存进度。

## 怎么验证？

先冻结独立真相和定向命令，再按「一例、最小实现、下一例」推进。
红测和绿测指同一目标断言改前失败、改后通过，不是两种不同检查。

```sh
npx --no-install vitest run tests/contract/decision-evidence-consumption.test.mjs -t "reads mapped 决定 N blocks at h3/h4 and checks their tone|承重承诺|需索引指针" --no-cache --reporter=verbose
node tools/cli/check-decision-log-chain.mjs --file specs/delivery-quality-direction-requirements-20261122/decision-log.md --source-root /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/delivery-quality-direction-requirements-20261122
```

合约命令在新目标断言失败时应非零，同断言实现后应退出 0。
真实入口对合法材料期望 0，还须读诊断及执行范围，不能只看退出。
从日志「证据索引」解析任务根内唯一路径，原件实算 SHA-256 与该行一致。
若规格仍写旧指纹，材料主会话交实物给规格作者对齐，不改索引或选副本。
冲突时停真实材料复核，独立夹具继续。
入口用 `--file` 选日志，`--source-root` 限定外置原件根。
现役读取交 `log_path`、`index_path` 给同一检查，避免自引。
`read_source` 回原件按声明起止行取文本，`quoteMatches` 比对。
预写样本覆盖四态、错误映射、待定三件、非匹配引用及派生冒用户。
机器冻结错锚或截半却声明完整行；读者冻结仍连续但语气抬高的截短例。
读者从完整问题和答复定位被删限定语，说明承诺为何变强。
既有语气用例只作回归，不冒新增目标红测。
两类都须拒绝，不把字符串匹配写成语气正确。
三件是原未答问题、负责人、恢复条件；建议转承诺还须真实批准。
测试期望取固定手工原话，不从当前实现输出反算。
主接缝是已有链检查，能抓来源边界与具名错误，不能代判完整语境。
独立语义读回补查删限定语、阈值冒批准和同句不同用途。
无匹配、收集、导入、环境或材料绑定失败不是目标红测。
旧回归可以本来就通过；不能人为回退原件造红测。

检查器读失败由原开发修；材料绑定失败由材料主会话修。
严格分支若误伤历史，撤本段严格块，恢复上一版提示与兼容。
保错误和原输入，用同一断言、原坏例和旧回归核恢复。
不同批准语气、改变原判据或新增状态须停对应路径回原决定人。

## 下一消费者拿什么继续？

交首判实际证据、当前决定块及精确共享文件的实读状态。
阶段三拿四态和来源指针增覆盖；阶段四拿原话和旧决定定位失效。
本任务阶段六接收确有原话的批准语境写首卡；阶段七只读本段首判和限制。
当前文章只定义供件，不能作为首卡已接或材料复验已跑的证据。

## 每张任务卡怎么写？

一张卡以完整原话进入决定块、从公开检查及独立读回复现为结果。

### 任务 2：把原话、强度和身份留在实际决定块

为什么做：验收 2 要发现建议阈值冒批准，不能只保存决定标题。
交付什么：读者能逐字定位原话并辨识语气；坏来源会具名失败。
不做什么：不扩索引、不加第五态、不提前做覆盖或首卡。
前置：无前置卡，先读现有决定形状和当前可读真实答复。
怎么做：先冻结两个目标组，再改模板实际决定块和来源分支。
怎么验收：同一合约跑改前与改后；用真实链及语义读回补全。
证据：保目标原输出和完整答复，假映射或零匹配不能充证据。
下游（含何时停）：交当前版本给阶段三；缺来源或冲突回原负责人。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T002
- **来源 / FR / AC**: R-002/R-003/R-008；decision-log.md:344–359 决定 2；U-014 仅确认整体方向，不批准本包或 AC；U-008 缺真实原话，不作有效确认；FR-COMMIT-001、FR-ORIGIN-001；AC-P2-001。四态保持完整原话和强度，派生和被否分列；真实首卡由下游实证。
- **输入**: 无前置卡；现有 `fixture`、当前索引、真实原话和可读决定由材料主会话交独立测试与读者。开工前固定手工预期，回修后查完整语境；旧片段只给出处限制。
- **文件 / 符号**: `skills/decision-log/templates/decision-log-template-v2.md` 最终决定；`tools/cli/check-decision-log-chain.mjs` 的符号 `decisionSections`、`checkDecisionLogChain`；`tests/contract/decision-evidence-consumption.test.mjs` 的 `fixture` 与具名组；`specs/delivery-quality-direction-requirements-20261122/decision-log.md` 的真实决定及旧编号对照。
- **动作**: 先加「承重承诺」「需索引指针」目标组；模板及日志写可被读取的「决定 N」标题、旧编号对照、父块既有字段和逐行状态。必须、允许、本次不做有用户接受原话；待定保原未答、负责人、恢复条件。派生单列；转承诺限定真实用户原话、批准者和时点。保被否原位，只窄扩原入口识读；不改参数、索引字节或历史。
- **输出 / 失败**: 只写承诺行仍须唯一索引指针；写全来源三字段沿既有英文语气合同，卡末中文语气不混用。按声明定位连续原文、身份、映射和语气；严格形状仅新任务/明确升级，进行中旧件缺四态只提示。决定日志无条目具名失败；索引/覆盖件无决定为不适用，`no_decision_entries` 不计通过。未支持的原文锚点或旧转录不猜，记录补件人和恢复条件。
- **边界 / 禁止改动**: 保护需求索引、卡和历史原件、现有参数与冻结断言；下游存在性不在本段。`DO NOT TOUCH`：预写提交后冻结该合约测试的断言及本卡原判据；实施写窗口不含该测试。
- **依赖**: none
- **测试层级 / 技能**: `feature`；主 `skills/backend-testing/SKILL.md` 的公开入口与证伪方法。合约定向命令证机器诊断，实际链命令证当前入口，独立读回补语境；不扩页面、数据迁移、网络、持久 schema。
- **场景 / 夹具或服务**: 现有 `fixture` 给可复跑决定及索引，保实际文本；同时覆盖无来源、错误映射、错锚、截半却声明完整行、派生冒用户及旧合法回归。读者另验仍连续的截短语气变强。夹具留在测试进程，失败也由同进程清理；证据经外部 capture 保留，见共同验证方法。
- **RED/GREEN 门禁命令**: `npx --no-install vitest run tests/contract/decision-evidence-consumption.test.mjs -t "reads mapped 决定 N blocks at h3/h4 and checks their tone|承重承诺|需索引指针" --no-cache --reporter=verbose`
- **预期退出码**: RED nonzero; GREEN 0；目标是新增具名断言，收集、导入、配置失败、零匹配或旧例本来就过均非目标 RED；真实合法链复核期望 0。
- **RED 目标失败**: ORACLE-COMMITMENT-SOURCE；错锚、截半却声明完整行、派生冒用户及缺唯一指针仍未显名时，新增机器断言先失败；环境或原材料失败另记。
- **GREEN 判定器**: ORACLE-COMMITMENT-SOURCE；同断言确认合法四态、边界和来源，坏例具名拒绝；独立读者核语气与身份，必须拒绝仍连续却删限定语的截短例。语义两面都成立才按附录 A 判定。
- **证据**: 目标 RED/GREEN 原件 unavailable — 本轮只规划；计划 `quality/tests/p02-commitment.red.output`、`quality/tests/p02-commitment.green.output`、实际链 capture 及 `quality/tests/p02-real-source.readback.md`。测试变更请求：none；改冻结断言须同卡记旧新断言、理由、影响、旧失败原件与独立审查；AC 或冻结测试变化保用户真实答复 ref 和原文，不改判定器编号。
- **覆盖上限**: 包二原话与四态；不证阶段六真实首卡或所有历史材料兼容，不以连续片段单证语气。
- **停止 / 恢复**: 来源或绑定失败回材料主会话；机器错误回本段开发；误伤撤本段严格分支，保原失败与来源并定向复验；需改原判据停该路径回原决定人。
- **完成**: 前置（不作完成条件）：公开入口和原命令输出可读。完成条件（只写效果）：同一目标断言与独立原话读回皆支持 AC-P2-001，负例拒绝且原件可定位；未执行保持 incomplete，阶段三接当前共享字节。

## 本 Phase 自带判据小结

自己验了什么：gate 命令原件 `quality/tests/p02-commitment.green3.output`（16 passed）；真实链 exit 0（`quality/tests/p02-real-chain.output`）；负例具名——引用块、有序列表、待定空段、错锚各报 `ANSWER_COMMITMENT_*`（`p02-commitment.n1-probe.output`、`p02-commitment.template-shape.output`、`p02-commitment.real-material-negative.output`）。

没验什么：语义首判 incomplete，包 2 无真实逐包原话；索引续段 U-007–U-015 incomplete，答复登记表被空行截断读不到，是材料结构缺口。

未验项条件与 owner：真实逐包答复由用户产生；登记带行位与语气的索引行由材料主会话补；语义首判由未参与写作的读者做，回修后立即首判。

## 机器字段（校验器用，人可跳过）

- **全局规格**: `spec.md#实现设计全局权威`
- **写入集**: `skills/decision-log/templates/decision-log-template-v2.md`；`tools/cli/check-decision-log-chain.mjs`；`tests/contract/decision-evidence-consumption.test.mjs`；`specs/delivery-quality-direction-requirements-20261122/decision-log.md`
- **依赖**: none
- **消费者**: P3、P4、P6、P7
- **gate_cmd**: `npx --no-install vitest run tests/contract/decision-evidence-consumption.test.mjs -t "reads mapped 决定 N blocks at h3/h4 and checks their tone|承重承诺|需索引指针" --no-cache --reporter=verbose`
- **oracle**: ORACLE-COMMITMENT-SOURCE
- **evidence_path**: planned: `quality/tests/p02-real-source.readback.md`
- **STOP**: 源和映射失败回材料主会话；机器误伤回本段开发撤受影响严格块，保旧例与原失败并定向复验；改原判据回原决定人，其它路径继续。
- **覆盖 AC**: AC-P2-001
- **Done**: 前置（不作完成条件）：定向与真实材料入口的输出可读。完成条件（只写效果）：AC-P2-001 须同一目标断言和完整原话语义都成立、负例拒绝且独立审查后可回读，未执行保持 incomplete；计划 `quality/tests/p02-real-source.readback.md` 及其捕获引用；AC-P2-001：incomplete；证据 quality/tests/p02-real-source.readback.md（真实链读回）、p02-commitment.green3.output（gate 全绿）、quality/tests/2026-11-23-305-p2-review.md（独立审查，无阻塞 finding）；未通过原因：包 2 四条承诺全为待定，无真实逐包原话，独立语义首判未做。
