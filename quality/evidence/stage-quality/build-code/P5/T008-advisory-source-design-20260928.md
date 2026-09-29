# P5/T008 同次机器判断原件认证：只读设计

日期：2026-09-28。只读核对当前 `P5.md`、`spec.md`、T007 材料独立复核、`stage-runner.mjs` 写侧、`freshness.mjs` 读侧和 P5 定向测试。本文只提出最小补充；未修改代码、材料、Task facts，未运行测试，未发布 CARD-04 的正式 P5 报告。

## 现状与必须守住的边界

`publishVNextStage` 在同一次 build-code 发布中，先调用 `publishStageEndSpecAnalyzeFact`，把它返回的质量事实 ref 加进 `qualityAdvisoryFactRefs`；非通过判决再以 `stage-end-spec-analyze:<原始判决>` 加进 `qualityAdvisories`。前一个数组还可能含别的 advisory 事实，后一个数组也可能含别的字符串，两者的下标不对应。当前 P5 source/certificate 只有普通 `quality_facts` / `quality_fact_refs`，读者也只核这组，因此不能证明 T007 看见的那条机器判断来自本次原件。T007 字段指针只证明其读取了 `stage_result.quality_advisories` 的原数组位置，不能代替 T008 的原件认证。

本补充仍受现有报告关闭条件约束：`p5HumanExceptionFromDecisionLog()` 当前固定返回 `null`，真实 CARD-04 没有经独立确认的人工例外来源；`authenticateP5StageEndReport()` 最后也固定返回 `missing`。**不得**为了测试此链而打开正式 writer、使用通用 `human-confirmation.v3`，或把隔离夹具说成真人许可。确无例外时中途报告的写法还待用户答复。

## 精确原件链

| 层 | 当前生产字段及路径 | 读侧要核的原字节 |
| --- | --- | --- |
| 同次结果 | `source.stage_result.quality_advisory_fact_refs` 是完整 ref 数组；`source.stage_result.quality_advisories` 是原始判断字符串数组 | 两组各自保持原次序；从 `stage-end-spec-analyze:` 字符串取机器原词面，不能用数组下标去猜事实 ref。 |
| 质量事实 | 新增 `source.quality_advisory_facts: [{ref,sha256}]`，`certificate.quality_advisory_fact_refs` 逐项同值；每个 `ref` 是现有 `quality/facts/${qualityFactDigest(fact)}.json` | `ctx.task.readRecord(ref)` 原字节 SHA-256 等于记录的 `sha256`；`validateCanonicalQualityFact`、规范路径与 `fact_id` 均成立，`task_id/stage=build-code/material_revision/snapshot_tree` 属于本次。`source.stage_result.quality_advisory_fact_refs` 必须与新列表的 ref 完全相等，不漏、不多、不重排。按 `fact.subject === "stage_end_spec_analyze"` 选，必须恰好一份，且 `kind=acceptance_criterion`。`fact.status` 还须按下表与原始判决对应；通用 `missing` 本身不是原始判决。 |
| 验收包装 | 所选质量事实的 `fact.evidence` **数组长度恰为 1**，唯一项指向现有 `quality/evidence/acceptance/build-code/stage_end_spec_analyze-${sha256}.json`，并带相同 `sha256` | 重读 wrapper 原字节、核 SHA-256 和规范 ref；`schema_version=acceptance-evidence.v1`、`acceptance_criterion_id=stage_end_spec_analyze`、`snapshot_tree` 与 `freshness.snapshot_tree/material_revision` 同本次。`wrapper.refs` **数组长度恰为 1**。`freshness.status=current`，`freshness.evidence_freshness` **数组长度恰为 1**，其中 `ref/sha256` 与唯一 `wrapper.refs` 项相同、`status=current`。`summary.actual_outcome` 须等于机器原词面；`wrapper.result` 须按下表核，不能只核原词面。 |
| 阶段质量原件 | wrapper 唯一 `refs` 项指向现有 `quality/evidence/stage-quality/build-code/stage_end_spec_analyze-${sha256}.json`，并带相同 `sha256` | 重读原字节、核 SHA-256 和规范 ref；`schema_version=stage-quality-evidence.v1`、`task_id/stage/subject/snapshot_tree/material_revision` 同本次；外层 `status` 与 `subject_fact.status` 都须按下表核；`subject_fact.analysis_result.status` 必须与 wrapper 的 `summary.actual_outcome`、结果字符串的原词面逐字一致。`subject_fact.evidence_state` 有值时也应与原词面一致，但不能靠它独自认证判决。 |

现有生产者 `publishAcceptanceQualityFact` 按上述两条内容寻址路径写 wrapper 和阶段质量原件，质量事实 `evidence` 指向 wrapper，wrapper `refs` 指向阶段质量原件；这是一条可重读的链。`stageResult` 是私有同次对象的确定序列化，**不是** CLI stdout 原字节。原件 ref 由现有生产者给出；不得靠文件名相似或扫描目录挑一份“最近的”。

## writer / reader 的最小顺序

1. **writer**：保持原有 Task、worktree/branch、材料版本、代码树、P5 行、T007 实现/测试输出、独立审查和普通质量事实检查。只在这些检查已过、且正式真人来源另行成立后，按 `stageResult.quality_advisory_fact_refs` 顺序读取每份 advisory 质量事实原字节，计算 SHA-256，先验证列表、身份、唯一主题，再重读 wrapper 和阶段质量原件并核下表全部字段。认证失败就不构造 source/certificate，更不能写五件报告文件。把完整 `{ref,sha256}` 列表分别放在现有 source/certificate 的上述字段；`evidenceIndex` 可增加这些已核 ref，但不能把 T007 的字段指针偷换成未经 T008 核实的来源。新增检查要在写第一件文件之前完成。当前预检的 `catch { return; }` 不得吞掉新读盘的 `EACCES/EPERM/EIO`：这些错误应带原 ref/错误码向官方 run 抛出，保留可见的失败原件且不写完成标记；确实 `ENOENT`、旧版本或内容不符则归“来源未完成/未认证”并记录具体原因，不冒充读取能力故障。
2. **reader**：仍先读固定 `report-facts.json` 完成标记；没有标记，前四件即使存在也返回 `missing`。有标记后，照现有顺序核 delivery/certificate/source/report/facts 原字节、Task/材料/树/阶段行、收据/测试输出/审查及普通质量事实；然后独立重读新列表中的每一份质量事实、wrapper 和阶段质量原件。source、certificate、`stage_result` 三处列表要完全一致；按主题选唯一原件，比较原始判断。**这一步必须在重算 T007 事实和 Markdown、宣布外层来源已核之前。** 当前独立真人确认仍不存在，最后继续返回 `missing`，不能因这条机器链通过就改成 `authenticated: true`。
3. 读侧对坏/缺文件、坏哈希、错主题、错判断、旧树/旧材料、零份或多份同主题事实，返回有具体原因的 `missing`；真实读文件能力故障（现有 `EACCES/EPERM/EIO`）返回 `unavailable`。写侧对同类读取能力故障抛出可见错误，不把它藏进现有宽泛 `catch { return; }`；无论哪类错误都不写完成标记。不新增公共命令、阶段门、进度记录或第二报告路径。

## 判决对应关系与负控

build-code 的四种机器原词面与当前生产者字段必须严格对应：

| `analysis_result.status` / `summary.actual_outcome` | 质量事实 `status` | 阶段质量外层 `status` 与 `subject_fact.status` | wrapper `result` | `quality_advisories` 中该主题 |
| --- | --- | --- | --- | --- |
| `consistent` | `passed` | 都是 `passed` | `pass` | 不出现 |
| `material_incomplete` | `missing` | 都是 `missing` | `incomplete` | 恰一条 `stage-end-spec-analyze:material_incomplete` |
| `inconsistent` | `missing` | 都是 `missing` | `inconsistent` | 恰一条 `stage-end-spec-analyze:inconsistent` |
| `unavailable` | `missing` | 都是 `missing` | `unavailable` | 恰一条 `stage-end-spec-analyze:unavailable` |

生产者对 build-code 的 `consistent` 仍写一份同主题质量事实，却不发非通过字符串；报告也不能出现这条“没做到”。所以“零份同主题质量事实”失败，“零条非通过字符串且原件 consistent”可通过这一局部检查。未知/缺失原词面、`analysis_result` 缺失、或通用 `status=missing` 却没有真实原词面都失败。一次真实 run 的同主题判决不会有三条；T007 合成三条的测试只检转换器，不是 T008 正例。

在现有 `tests/contract/p5-same-run-report-source.test.mjs` 增量冻结目标，保留修改前测试原字节与哈希，先取目标 RED，再取定向 GREEN：

- 一份正确主题、三层 ref/hash 和同词面的隔离夹具为正例；同时核“无非通过字符串 + consistent 原件”正例。夹具只证机械认证，不开放正式报告。
- 零份/重复的同主题质量事实；列表少一份、多一份、重排或与 certificate 不同；其他 advisory 排在前面时不得按位置误取；两条相同或不同的 `stage-end-spec-analyze:` 字符串均拒绝歧义。
- 质量事实、wrapper、阶段质量原件任一缺失或原字节变动；ref 看似同名但 SHA-256 不符；质量事实 `subject/kind` 错、wrapper `acceptance_criterion_id` 错、阶段质量原件 `subject` 错；wrapper `refs` 或质量事实 `evidence` 零条/多条均拒绝。
- `summary.actual_outcome` 与 `analysis_result.status`、`stage_result.quality_advisories` 任两处不同；四种原词面分别设正例或针对性负例，尤其造“原词面相同但质量事实/阶段质量通用状态或 wrapper.result 错”的失败样本；不能只靠三个原词面互等就通过。
- wrapper `freshness.status=stale`、`freshness.evidence_freshness` 空/两条、其 `ref/sha256` 与 wrapper `refs` 不同或 `status` 不是 `current`；旧 Task/材料版本/代码树/阶段行；无完成标记但前四件存在，均不得得到已认证报告。
- 写侧读 advisory 任一层时注入 `EACCES`、`EPERM`、`EIO`：官方 run 必须可见失败/错误码，不写 source/certificate/完成标记；真正 `ENOENT` 作为未完成来源处理并保留具体原因。读侧同一三类能力故障须为 `unavailable`，坏内容或 `ENOENT` 为 `missing`。

只运行 P5 这个合同测试及实际受影响的 T007/P6/P13 定向测试，遵守仓库禁止全量回归的规定。测试中的 content-addressed fixture 必须由原字节重新计算 ref/hash；故意篡改负控则保留坏字节和失败原因，不通过改期望把它洗绿。当前 CARD-04 真正 P5 同次独立审查、真人来源及正式三文件仍缺；本文不构成 T008、P5 或整卡完成事实。
