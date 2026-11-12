# Phase P5 — 完整前后差异与四维独立代码审查

本文件写给独立审查者与整任务验收者；读完要能拿两份清单比出完整差异，并按四维逐维给结论。

## 这一 Phase 交出什么？

交付 v15 与载体两处的完整前后差异、四维审查结论与发现处置，供 P6 判“改动是否真的发生、质量是否有结论”。

- **本 Phase 结果**：两份改动清单（新增、修改、删除）可回读；变更文件有内容差异；组件化、统一性、可维护性、性能四维各有结论与证据；发现逐条有处置与复验。
- **非目标**：不改代码、不重采页面、不替 P3/P4 重判；发现要修时回原实施 Phase，不回本 Phase 改文件。
- **改动前**：v15 无 Git、载体只有只读基线，没有“完整前后差异”这一事实。
- **改动后**：P1 的 `c11-baseline/v15.sha256` 与 `c11-final-v15.sha256`、P2 的 `c11-baseline/carrier/SHA256SUMS.txt` 与 `c11-final-carrier.sha256` 四份清单并列，比出新增/修改/删除三类。
- **与相邻 Phase 的边界**：P1、P2 交出改动与清单；本 Phase 只读并判质量；修复归 P1/P2。
- **主要风险**：只审新增不审删除；没有两侧清单却说“完整”；把清单外文件说成已审。
- **下一步**：P6 读本 Phase 原件登记关闭。
- **动手前必读**：`spec.md` 的 AC-C11-005、P1/P2 的四份清单、台账 G5。
- **未决事实**：`unknown` — 载体 live 数据源不可用，页面层只证 frozen 源；这限制四维中“性能”的现场代表性，不阻止其余三维结论。

## 这一 Phase 怎么验收？

假设 P1、P2 已改完，本 Phase 仍可能漏删除侧与质量判断；漏掉时整项记未修。
本 Phase 承接验收 5，按「一条验收一小段」写。

**验收 5：完整前后对照与四维代码审查（AC-C11-005）**

目标：读者能按两份起点清单与两份终点清单复算出新增、修改、删除三类，并看到四维各自的结论与证据。
怎么操作：读 P1、P2 的四份清单；用本 Phase 的门禁脚本对 v15 与载体分别比出三类并落 `c11-p5-diff-v15.txt`、`c11-p5-diff-carrier.txt`；对每个修改文件跑一次内容差异；再按四维逐维读真实代码与调用点。
什么条件：起点清单必须在改动前摘取且只读；终点清单由 P1/P2 收口发布；两处都不需要 Git 历史；只读，不写源码。
怎样算通过：门禁退出 0，且两份差异文件各自非空、各含新增与修改；删除类按真实集合差记录（本任务为 0 条，不补造）；删除侧必须被判得出，判据是门禁自检加一次受控变异（从终点清单删掉一行后同一门禁必须非零并点名该文件）；每个“修改”文件的内容差异可读；四维各有结论、依据与反例；发现逐条有处置与复验。
故意弄坏一处：从 `c11-final-v15.sha256` 里删掉一行后再跑门禁，必须非零并点名该文件（删除类）；把一份起点清单改名后再跑，必须以「起点清单不可读」非零。
真跑还是替代：真跑，差异由清单与真实字节算出；四维结论是语义判断，命令退出 0 不构成结论。
谁判与证据：未参与实施的独立审查者（先用 `ocr delegate preview` 取审查范围与规则的尝试记一笔；对非 Git 对象会失败，见 `c11-p5-findings.md` F07。实际来源用本任务 `c11-p5-review-*` 独立记录与 `c11-p5-review-four-dim.md`），在 P1、P2 完成后判定；读四份清单、两份差异、内容差异与真实源码；结论记本卡「完成」与 `quality/evidence/c11-p5-diff.md`。
失败回修与停止：清单缺失回 P1/P2 补；质量发现回原实施 Phase 修，修后由本 Phase 复核并通知 P3、P4 在最终字节上重采；同一原因两次失败停手报主会话。

## 为什么现在做，依据是什么？

改动已经落地，才有“前后”可比；再晚就分不清哪些字节是本次改的。

- **结果**：三类差异与四维结论可读。
- **非目标**：不重新实现，不重复采集。
- **与其它 Phase 的区别**：P3、P4 判页面事实，本 Phase 判代码质量与改动完整性。
- **依据**：台账 G5；`spec.md` 的 AC-C11-005。

## 开始前读什么？

| 材料或锚点 | 本 Phase 用它做什么 | 读取时机 |
| --- | --- | --- |
| `quality/evidence/c11-baseline/v15.sha256`、`c11-final-v15.sha256` | 比 v15 的三类差异 | 开工前 |
| `quality/evidence/c11-baseline/carrier/SHA256SUMS.txt`、`c11-final-carrier.sha256` | 比载体的三类差异 | 开工前 |
| v15 与载体最终字节 | 读真实代码与调用点 | 开工时 |
| `spec.md` 的 AC-C11-005 与台账 G5 | 判据与反例 | 写卡前 |

## 每个文件由谁改，先做什么？

- **新增**：`quality/evidence/c11-p5-diff.md`、`c11-p5-diff-v15.txt`、`c11-p5-diff-carrier.txt`、`c11-p5-findings.md`、`c11-p5-fix-verify.output`、`c11-p5-review-*`（本任务实际独立来源；`ocr delegate preview/rule` 仅先作取范围尝试，对非 Git 对象失败、无原件，见 `c11-p5-findings.md` F07）；差异由实施者产出，四维审查与处置复验必须由未参与实施的独立执行者完成。
- **修改**：无；本 Phase 不改 v15、不改载体、不改起点清单。
- **禁止改动**：v15 与载体源码、P3/P4 的报告、四份清单。

本 Phase 是只读审查 Phase，写集只有证据文件；源码修复回 P1/P2。

## 怎么验证？

差异是机器可取的，四维结论只能人读；两者分开写结论。

开工前四要素：验证层是清单比对加独立审查；命令是本文件机器字段的 `gate_cmd`；预期是两份差异文件各自非空、各含新增与修改、删除侧可判出；失败条件是清单缺失、某侧无差异或删除侧判不出。
G-2 不适用：本 Phase 有可读的差异事实，仍需真实清单命令。
覆盖上限：只比清单覆盖的文件；清单外的文件不审，也不用“整树都在”暗示已审。
显式不覆盖：不证明 C12 的能力可用性，不证明发布可用。

## 下一消费者拿什么继续？

P6 读本 Phase 的两份差异与发现处置，登记 AC-C11-005 的关闭或未修。

- 交回两份差异、发现表、复验输出、四份清单与 `c11-p5-review-*` 独立记录（`ocr delegate preview/rule` 仅先作取范围尝试，对非 Git 对象失败、无原件，见 `c11-p5-findings.md` F07）。
- 未完成项：发现未修时如实记未修与 owner，不登记关闭。

## 每张任务卡怎么写？

### 任务 1：让完整前后差异与四维结论可读

为什么做：本轮修复之后需要一份能复算的“改了什么”，对应 R-005 与 AC-C11-005。
交付什么：v15 与载体各自的三类差异、四维结论、发现处置与复验回执。
不做什么：不改源码、不改清单、不重采页面、不扩到全仓历史。
前置：P1、P2 完成并交出四份清单。
怎么做：用门禁脚本比 v15 与载体；对修改文件取内容差异；先跑 `ocr delegate preview` 取审查范围与规则作尝试（对非 Git 对象会失败、无原件，见 `c11-p5-findings.md` F07），实际来源改用本任务 `c11-p5-review-*` 独立记录与 `c11-p5-review-four-dim.md`；按四维读真实代码与调用点；发现回原 Phase 修，修后复核。
怎么验收：门禁退出 0；两份差异各自非空、各含新增与修改；删除类按真实集合差记录（本任务为 0 条）；删清单一行必须非零并点名；四维结论齐。
证据：`c11-p5-diff-v15.txt`、`c11-p5-diff-carrier.txt`、`c11-p5-diff.md`、`c11-p5-findings.md`、`c11-p5-fix-verify.output`、`c11-p5-review-inputs-sha256.txt`、`c11-p5-review-four-dim.md`（`ocr delegate preview/rule` 仅为取范围尝试，对非 Git 对象失败、无原件，见 F07）。
下游（含何时停）：P6 读本节登记；清单缺失或某侧无差异就停手，不登记关闭。

**校验器用，人可跳过**

- **任务编号**：T001
- **Source / FR / AC**：R-005 / FR-C11-005 / AC-C11-005；差异须含新增与修改、删除侧须判得出（本任务真实为 0 条），四维须有反例。
- **Files / symbols**：只读 v15 与载体；写 `quality/evidence/c11-p5-*`；symbol: N/A — 只读审查
- **Action**：用清单比对两处三类差异；对修改文件取内容差异；`ocr delegate preview/rule` 对非 Git 对象不可用（见 `c11-p5-findings.md` F07），四维审查由未参与实施的独立执行者用 `c11-p5-review-*` 独立记录完成；按四维读真实代码；发现逐条处置并复验。
- **Inputs**：P1、P2 的四份清单；v15 与载体最终字节；台账 G5。
- **Outputs / failure**：两份差异与四维结论；清单缺失、某侧无差异、发现无处置均保留为缺口，不发布关闭。
- **Boundary / DO NOT TOUCH**：不改 v15、不改载体、不改清单、不改 P3/P4 报告。
- **Dependency**：P1、P2。
- **Test tier / skill**：simple / backend-testing 的独立审查面；清单命令加语义复读。
- **Scenario / fixture or service**：本机 sha256 与 diff；v15 副本与载体当前目录；无需服务、无需账号。
- **RED/GREEN gate_cmd**：`node /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c11-gap-repair-20261112/quality/evidence/c11-p5-diff.mjs`
- **expected_exit**：GREEN 0（两份差异各自非空、各含新增与修改，删除侧可判出）；清单缺失为 2，某侧无差异为 3，删清单一行后为 4。
- **RED target failure**：ORACLE-C11-REVIEW 断言“起点与终点的清单能比出三类差异”；删掉终点清单一行后必须判出删除类并点名，照旧通过即失败。
- **RED evidence**：改前无差异事实；风险是只看新增就报完整；客观替代是四份清单加三类差异。
- **GREEN oracle**：ORACLE-C11-REVIEW 两份差异各自非空、各含新增与修改、删除类按真实集合差记录（本任务 0 条）且删除侧可由受控变异判出、四维各有结论与反例、发现逐条处置并复验。
- **Evidence**：两份差异、发现表、复验输出、`c11-p5-review-*` 独立记录（`ocr delegate preview/rule` 仅先作取范围尝试，对非 Git 对象失败、无原件，见 F07）；命令退出 0 不证明质量。
- **STOP / recovery**：清单缺失回 P1/P2 补；质量发现回原实施 Phase；修后在最终字节上复验并通知 P3/P4 重采；两次失败停手报主会话。
- **Coverage limit**：只比清单覆盖的文件；不证明清单外文件、不证明 live 数据下的性能。
- **Done**：前置（不作完成条件）：四份清单可读。完成条件（只写效果）：读者能按清单复算三类差异，四维各有结论，删除侧能被判出。

## 机器字段（校验器用，人可跳过）

- **全局规格**：`spec.md#实现设计（全局权威）`
- **Write set**：`quality/evidence/c11-p5-diff.md`、`quality/evidence/c11-p5-diff-v15.txt`、`quality/evidence/c11-p5-diff-carrier.txt`、`quality/evidence/c11-p5-findings.md`、`quality/evidence/c11-p5-fix-verify.output`、`quality/evidence/c11-p5-review-*`、`quality/evidence/c11-p5-diff.mjs`
- **Dependency**：P1、P2
- **消费者**：P6 与 C12
- **gate_cmd**：`node /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c11-gap-repair-20261112/quality/evidence/c11-p5-diff.mjs`
- **oracle**：ORACLE-C11-REVIEW
- **evidence_path**：`quality/evidence/c11-p5-diff.md`
- **STOP**：清单缺失时逐条留缺口并交 P1/P2；不把差异非空当质量通过。
- **覆盖 AC**：AC-C11-005
- **Done**：前置（不作完成条件）：四份清单可读，差异命令有真实输出。完成条件（只写效果）：三类差异齐、四维结论齐、删除侧可判出。
