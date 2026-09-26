# 独立替代审查报告 — CARD-05「审查链替换(有证据门槛)」make-decision 材料

任务：`workflowhub-thin-core-card-05-20260919`
被审材料：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-05-20260919/specs/workflowhub-thin-core-card-05-20260919/decision-log.md`（1871 行 / 207,573 B）
审查日期：2026-09-22
审查者身份：替代审查者（SD-08 fallback），未参与本材料任何部分的撰写、调研或实现

---

## (A) 取证与出处（provenance）

### A.1 完整读过的材料

| 材料 | 位置 | 读取方式 |
|---|---|---|
| CARD-05 decision-log 全文 | worktree `specs/workflowhub-thin-core-card-05-20260919/decision-log.md` | 分 7 段逐行读完（1–250 / 251–580 / 581–950 / 951–1280 / 1281–1580 / 1581–1871），含全部 YAML OI 记录、D-001..D-022、RF-01..RF-19、Talk T-001..T-017、G-CK/G-1..G-4、P1–P14、收敛检查、未能满足的解析器字段 |
| 母 PRD | `/Users/Hugh/Hugh/Project/workflowhub/specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md` | L1–120（总览 + SD-01..SD-17）、L330–419（CARD-04 尾 + CARD-05 全节 + CARD-06 头）、L139–179（需求覆盖结论逐条追踪表） |
| 全局审查配置 | `/Users/Hugh/.config/workflowhub/config.json` | 全文 101 行 |
| 3rd-review 配置 | `/Users/Hugh/.config/3rd-review/config.json` | 全文（provider/tier/runtime 定义） |
| worktree `CONTEXT.md` 新节 | `CONTEXT.md` L435–466 | 全文 |
| worktree `docs/adr/0032-…` | `docs/adr/0032-review-chain-delegation-and-layer-contract.md` | 全文 |
| card-02 归档 decision-log | `specs/archive/workflowhub-thin-core-card-02-20260919/decision-log.md`（2181 行） | 命中行上下文（L195/731/1166/1803/1839/1980–1995 等） |
| 既有 ADR-0031（两份） | `docs/adr/0031-hosted-method-toolkit-direction.md`（11 行）、`docs/adr/0031-review-check-downgrade-and-identity-boundary.md`（101 行） | 全文 |
| 被引用代码 | 主检出 `/Users/Hugh/Hugh/Project/workflowhub`（HEAD `642d4fb2` = 材料声明的基线 `642d4fb21c487618bd793acc28fffceaafd521db`，`git status` 干净） | 见 C 节逐条 |

### A.2 无法访问 / 无法判定的部分

- **4 份真实执行会话的原始证据**（s1 `01a0bda2`、s2 `01a0be66`、s3 `01a0c142`、s4 `01a0c378`）：材料称取证材料在 `research/`，但 worktree 内 `specs/…/research/` 只有 1 个子目录，且 13.4 亿 token、`unavailable` ×33、s3 的 455,671B/486,777B 等**原始记录不在仓内可复核范围内**。凡仅依赖 s1–s4 的说法，本审查只能核对"是否与仓内代码机制相容"，不能核对"是否真实发生"。
- **RF-16 / RF-19 两次控制臂运行的原始产出**（attempt.json / report 字节）：不在本审查可见范围。我核对了其引用的代码行号，未核对运行事实本身。
- **OCR（open-code-review）二进制行为**：本机 `ocr` 可执行文件与 `~/.opencodereview/` 不在我的核对范围；RF-01/02/10/15 的一手实测结论我**未复现**，只检查其内部自洽性与与 D-004/D-013/G-CK 的一致性。
- **上游卡（card-01/card-07）材料**：仅按需读取，未做完整对账。

---

## (B) Findings（OCR finding schema；按严重度排序）

> `path` 为 worktree 相对路径；`start_line`/`end_line` 指被审材料中的行号（除注明为代码行号者）。

### H1 — `high` · bug/maintainability
- **path**: `specs/workflowhub-thin-core-card-05-20260919/decision-log.md`
- **start_line**: 1351 · **end_line**: 1351（另见 1325、`docs/adr/0032-review-chain-delegation-and-layer-contract.md` 决定 3）
- **category**: bug
- **content**: P5 把「超时不取消 broker」定为缺陷，D-017 把「超时与取消」列为五大修复面之一；但仓内既有 ADR 已就同一对象作出**相反且仍然生效**的裁定，材料与新建的 ADR-0032 均未提及该 ADR，也未产出它所要求的 ADR 来承担这次反转。
  **证据**（`docs/adr/0031-review-check-downgrade-and-identity-boundary.md`）：
  - `:70` 「**20 分钟墙钟等待维持不变**；只登记「源码注释与归档记录不一致」这一事实。」
  - `:71-73` 「**`cancelManaged` 接通**：把 6 处「绝不取消」守卫…改为「**仅在源漂移事实下调用**」，并**新增**一条禁止因墙钟计时而调用的断言。」
  - `:92`（被否决的替代方案）「**缩短或删除 20 分钟墙钟等待**：与 D-030③ 冲突，**缺 ADR 承担**。」
  - `:85`「跨仓 `3rd-review` 的 commit/push 授权属 OI-22 / step 11，**不由本 ADR 授予**。」
  材料侧原文：`:1351`「宿主等待预算（45/60/65s）远小于 provider 需求（实测 1,200,000ms），且**超时不取消 broker** → 既没审成又付了额度，还留孤儿进程」；`:1325` 修复面含「超时与取消」。仓内 `grep -rn "D-030"` 在 worktree 材料与 ADR-0032 中**零命中**。

### H2 — `high` · bug
- **path**: `specs/workflowhub-thin-core-card-05-20260919/decision-log.md`
- **start_line**: 1016 · **end_line**: 1016（另见 1603 与 ADR-0032 「背景」节）
- **category**: bug
- **content**: P1/RF-09 把 session1 的 11 次零派发死锁归因于 `initial[]`「必须全部可派发」，但材料自己引用的错误串**只能由另一处代码产生**，与该归因无关。这是全卡第一条机制根因，也是 ADR-0032「为什么不是修工具」的首条论据。
  **证据**：
  - 材料 `:1016`：「任一所列 provider 未配置或 `enabled!==true` → 整条 route 抛错 → `ROUTE_UNAVAILABLE`…（`third-review-host-config.mjs:710-720`）。| **直接解释** session1「`host_provider must be a supported 3rd-review provider` ×11 次、零派发」死锁」。
  - `skills/wh-review/scripts/third-review-host-config.mjs` 中该错误串的**唯一生产者**是 `:211`：`if (!SUPPORTED_PROVIDER_IDS.has(adapter)) throw new Error(label + " must be a supported 3rd-review provider");`；`adapterOf` 全部调用点（`:223`、`:233`、`:625`、`:683`、`:701`）中，label 为 `"host_provider"` 的**只有 `:701`** —— 它位于 `:710` 的 `for (const tier of candidates)` 循环**之前**，校验的是 `host_provider`，不是 `initial[]` 成员。
  - `:204-206` 的注册表**已包含 `"dsh"`**（`["claude-code","codex","cursor","dsh","grok","kimi","opencode","antigravity","pi"]`），故 s1 失败的是另一个**未在材料中识别**的 host provider id。
  - `:710-720` 的 `initial[]` 严格性**作为代码行为属实**（`:711-717` 未知 provider 抛错、`:718-720` disabled provider 抛错），但它不是该错误串的来源。

### H3 — `high` · bug
- **path**: `specs/workflowhub-thin-core-card-05-20260919/decision-log.md`
- **start_line**: 1616 · **end_line**: 1617（对照 1408）
- **category**: bug
- **content**: D-006/D-018/「已选方向」把 ② `build-code/phase`、③ `build-code/integration`、④ `verify-code` 定为「3 个代码审查面」并用 OCR 委托替换；但材料自有的 RF-11 与代码事实表明 `build-code/integration` **不是** diff 面，且其合同**禁止**把 diff 投给审查者。OCR 委托模式的文件选择来自 `git diff`（RF-04/`:967`），与该面合同直接冲突，材料未登记该冲突，也未说明该面按什么 ref 取 diff。
  **证据**：
  - 材料 `:1616`「**替换面（3 个代码审查点）**：`build-code/phase`（每 phase 一次）、`build-code/integration`（全 phase 结束一次）、`verify-code` 终末代码审查」。
  - 材料 `:1408`（RF-11）「只有 **3 个是代码 diff**（`build-code/phase`、`verify-code`、`mini_task/implementation`，`source_bundle:"diff"`）；其余 **7 个**（…`build-code/integration`…）都是 `source_bundle:"none"` 的**文档 / JSON 审查**」。
  - 代码事实（`runtime/review/stage-materials.json`，`python3 -c` 遍历 `source_bundle`）：`stages/build-code/profiles/integration: source_bundle='none' forbidden=['changes_diff','cumulative_diff','phase_diff','raw_log','integration_map']`；`build-code/phase: 'diff'`、`verify-code: 'diff'`、`mini_task/implementation: 'diff'`。即"3 个 diff 面"与"3 个被替换面"**不是同一集合**。

### H4 — `high` · documentation/test
- **path**: `specs/workflowhub-thin-core-card-05-20260919/decision-log.md`
- **start_line**: 1271 · **end_line**: 1275（另见 636、846、1352、1359）
- **category**: test
- **content**: D-013/OI-025/P6/P13 的修复对象——「307,200B fail-closed 体积上限」——在基线提交 `642d4fb2` 的代码中**已经不存在**（已由 SD-16 所述过渡基线删除）。因此 D-013 的验收判据「审查派发路径不含任何字节闸门」在基线上恒真、不可能失败，违反本仓「检查须在『实际为假』时真报失败」的硬规则；同时 D-002 引用的「现行 `REVIEW_PACKET_MAX_DELIVERY_BYTES = 2 MiB`」在仓内**无任何定义**（见 C 节 #9、#17）。
  **证据**：
  - `runtime/review/review-input-bounds.mjs`（全 25 行）头注释与其函数体：「Keep the complete diff in the provider input. **Provider capability, rather than a local byte ceiling, decides whether delivery is possible.**」「Preserve the complete caller material… **no longer rewrites or rejects material by local size.**」
  - `tests/contract/review-input-bounds-portability.test.mjs:30`（该文件位于基线 HEAD，且是"RED"契约测试）：`expect(source).not.toContain("TASK_BOUND_PROVIDER_INPUT_MAX_BYTES");`
  - `tests/contract/review-materials-contract.test.mjs:76-82`：`it("RED: removes the dead phase delivery export while keeping the active inline limit")` / `expect(materials).not.toHaveProperty("PHASE_DIFF_MAX_DELIVERY_BYTES");`
  - `grep -rn "307200" --include=*.mjs .`（排除 node_modules）**唯一命中**是测试夹具 `tests/integration/vnext-official-stage-run.test.mjs:2313` 里的字面量 `delivery_limit_bytes: 307200`，不是生产常量。
  - 材料侧：`:1352` P6、`:1359` P13「同一关注点多控制面（307,200B 两处双写）」、`:1271` D-013「取消一切 fail-closed 的体积上限」、`:636` OI-025 验收「审查派发路径不含任何字节闸门…失败判据=出现任一因体积在派发前阻断的路径」。

### H5 — `high` · bug
- **path**: `specs/workflowhub-thin-core-card-05-20260919/decision-log.md`
- **start_line**: 1789 · **end_line**: 1789（另见 384、762、1527、753）
- **category**: bug
- **content**: D-021 规定「**P1–P13 为本卡修复面的闭环清单**；超出即须用户显式追加」。而 RF-19 新增的 P14（审查历史绑定锁死后续审查，**唯一由本卡自身实测新发现、且当前仍成立的缺陷**）被三处明写「尚待用户显式追加」；与此同时 OI-031 已被判 `status: confirmed` 并声明其修复由 AC-58 + D-017「派发语义/启动自检」覆盖。同一事项同时处于"已确认在范围内"与"尚未获准进入闭环清单"两种状态，闭环清单的可判真假性因此被破坏。
  **证据**：`:1789`「7. P14：新增行**超出 D-021 原「P1–P13 闭环清单」**；按 D-021 原文「超出即须用户显式追加」，P14 尚待用户显式追加确认。」；`:384`、`:762` 同旨；`:1527` D-021「**P1–P13 为本卡修复面的闭环清单**；超出即须用户显式追加」；`:753` OI-031 `status: 'confirmed'`，`:759` 其处置「按 D-017，本卡修「审查层」的行为契约，修复面含**派发语义**与**启动自检**」。

### H6 — `high` · test
- **path**: `specs/workflowhub-thin-core-card-05-20260919/decision-log.md`
- **start_line**: 1292 · **end_line**: 1292（另见 739、1776）
- **category**: test
- **content**: D-014 的目的是堵住 D-011 的判别力漏洞（「两臂都差仍判 go」），但它的第二个析取支「**或**有一份明确、可复核的『本材料确无问题』结论」在当时没有、现在仍然没有判定 oracle：判定维度（怎么算"真问题"、"确无问题"由谁认）被整体 deferred。任何零发现结果都可以用该支逃逸，D-014 因此**不可判真假**，与 AC-55「阈值在实验前写死并对照得出 go/no-go」的要求冲突。
  **证据**：`:1292` D-014 原文；`:739` OI-030 `trigger_condition: '实验设计冻结前（D-014：判别力补充条件「须在实验设计阶段与用户确认后冻结」…）'` 而 OI-030 本身 `status: 'deferred'`、`:742` 其完成条件为「三项判定维度成文」（未成文）；`:1776` 依据表「OI-030 | deferred | … 三项判定维度本体未成文」。

### H7 — `high` · maintainability
- **path**: `specs/workflowhub-thin-core-card-05-20260919/decision-log.md`
- **start_line**: 1325 · **end_line**: 1328（另见 38、1356）
- **category**: maintainability
- **content**: D-017 的修复面（派发/聚合/超时与取消/启动自检/成本计量）有一部分实现于**第二个仓库** `/Users/Hugh/Hugh/Project/3rd-review`：材料自己引用的 `broker.mjs:577` 就在那里，取消/孤儿治理/健康裁决也在那里。但材料把工作面限定为本仓（`:38`「工作面为 `runtime/review/`、`skills/wh-review/`、`workflows/`、`tools/cli/`」），全卡**没有任何跨仓交付登记**（接收方 / 接口契约 / 验收判据）与跨仓授权声明，而本仓既有规则明确要求这么做。
  **证据**：
  - `/Users/Hugh/.config/workflowhub/config.json:3-10`：`third_review.command = ["node","/Users/Hugh/Hugh/Project/3rd-review/scripts/3rd-review.mjs"]`、`config = "/Users/Hugh/.config/3rd-review/config.json"`。
  - 材料 `:1356` P10 引用 `broker.mjs:577`；该文件实为 `/Users/Hugh/Hugh/Project/3rd-review/lib/broker.mjs:577`（我已核对逐字为 `if (!input.review_flow) return;`）——即材料自己已经引用到仓外文件，却未登记该仓为写面。
  - `specs/archive/workflowhub-mechanism-simplification-t2-20260911/decision-log.md:332`：「C4 跨仓 | **D-030⑤：跨仓交付项必须登记接收方、接口契约与验收判据**」；`:139` OI-09 亦以此为前置。
  - `docs/adr/0031-review-check-downgrade-and-identity-boundary.md:85`：「跨仓 `3rd-review` 的 commit/push 授权属 OI-22 / step 11，**不由本 ADR 授予**。」
  - 仓外事实：`/Users/Hugh/Hugh/Project/3rd-review/lib/broker.mjs:664,702,725` 调用 `cleanup(config.runtime.root, config.runtime.ttl_hours)`，`lib/runtime.mjs:96,135,155` 实现 ttl 清理与 `orphan_timeout_ms`（配置值 30000）——取消/孤儿治理的控制点在该仓。

### M1 — `medium` · bug
- **path**: `specs/workflowhub-thin-core-card-05-20260919/decision-log.md`
- **start_line**: 1486 · **end_line**: 1486（另见 711、719、1274）
- **category**: bug
- **content**: G-CK 断言「内容级静默丢弃…委托模式下 OCR 不读文件内容，故**不适用** —— D-016 登记的风险在委托模式下**自动消解**」。但按 D-004，委托模式下**实际读文件的是宿主 Agent**（子代理用自身 LLM 审查），因此"内容被丢弃/被截断"的风险只是从 OCR 转移到宿主子代理的上下文边界，并未消解；材料自己的 D-010 风险已承认「「能读仓库」放大上下文成本」。这是**假闭合**：D-013 取消我方闸门后真正的新闸门（子代理上下文）既没有记账面，也没有被任何 OI 覆盖。另：该风险的原始出处声明为 RF-10，但 RF-10 全节（`:1384-1404`）**不含 `too_large` 事实**——该事实在材料中只以 OI-029 问题原文（`:711`）与 D-013 风险（`:1274`）的形式出现。
  **证据**：`:1486` G-CK 行原文；`:719` OI-029 `evidence` 声明来源为「RF-10」；`:1384-1400` RF-10 表格全部行（git 硬依赖 / `.md` 排除 / `include` 旁路 / 规则注入 / 无 markdown 规则 / 模板不可改 / schema 未解 / 静默回退 / 文档不可取）中无 `too_large`。

### M2 — `medium` · documentation
- **path**: `specs/workflowhub-thin-core-card-05-20260919/decision-log.md`
- **start_line**: 879 · **end_line**: 882（另见 810、1317、1709）
- **category**: documentation
- **content**: any-of-N 的用户指令原话明确限定在「ocr 的委托模式审查」，但 D-005/ADR-0032/CONTEXT.md 把它无差别地扩展为全局审查通过判据，并经 D-017「10 个审查面共同受益」施加到仍走旧 provider 链路的 7 个文档面。对那 7 个面而言，这等于在**没有针对它们作出任何决策**的情况下把多源一致性判据降为单源即可通过，而承担"如实标注单源"的机制（`independence: partial`）所在的 OI-027 仍是 `deferred`。材料的"偏离披露"只登记了范围扩大（D-018），未登记这一语义降级的外推。
  **证据**：`:810` T-003 用户逐字答复「我希望使用"/Users/Hugh/.config/workflowhub/config.json"里的配置**进行ocr的委托模式审查**，就是可以同时进行多个异源审查，只要有一个成功了，审查就算通过了」；`:879` D-005「**多路异源审查并发执行，任一成功即视为审查通过**（any-of-N 语义）…**取代现行 `minimum_heterologous` 的 quorum 语义**」（无范围限定）；`:882` D-005 风险「(a) any-of-N 降低独立性强度…必须以 `independence: partial` 类标注如实记录」；`:1317`/`:1709` D-017 修复面「10 个审查面共同受益」；`:1773` OI-027（聚合/quorum 语义契约，含 `independence: partial`）`deferred`、完成条件「可执行契约未成文」。

### M3 — `medium` · bug
- **path**: `specs/workflowhub-thin-core-card-05-20260919/decision-log.md`
- **start_line**: 1023 · **end_line**: 1023
- **category**: bug
- **content**: RF-09 断言 `deriveSeriousReviewPause` 是「**唯一阻断点**」。该谓词（`actionable ∧ major|blocking ∧ direct|corroborated_inference`）在 ≥2 处被直接用于**阻断**而完全不经过 `deriveSeriousReviewPause`。材料以此单一阻断点界定「与 SD-17 冲突面」并支撑「10 个面共同受益 / 永不阻塞」，阻断面被低估。
  **证据**（`isActionableSeriousFinding` 定义于 `runtime/review/stage-review-disposition.mjs:43-47`，我逐字核对与材料引用的条件一致）：
  - `runtime/stage/stage-runner.mjs:665-668`：`const actionableFindings = canonicalReviewFindings(result).filter(isActionableSeriousFinding); if (record.status === "completed" && (result.status === "unavailable" || (actionableFindings.length > 0 && resolution !== "resolved"))) { throw outcomeError("completed verify-code stage requires every actionable finding to be fixed or rejected as invalid"); }`
  - `runtime/task/task-kernel-implementation.mjs:470-477`：`throwResolvedReviewError("resolved review authorization must prove repaired actionable findings", …)`
  - 另有 `runtime/stage/stage-handlers.mjs:4166-4170`（`"code review has N actionable serious finding(s)"` → `:4192` 记 `"missing"`）。

### M4 — `medium` · documentation
- **path**: `specs/workflowhub-thin-core-card-05-20260919/decision-log.md`
- **start_line**: 1680 · **end_line**: 1680（对照 1188、470、257）
- **category**: documentation
- **content**: 需求矩阵把「声明 1」判为 `covered（已覆盖）`，而同一材料在 D-006 风险与 OI-017 反例边界中三处明写该声明「在本卡**不完整满足**」。同一需求不能同时是"已覆盖"与"不完整满足"；且该"须在阶段末遗漏披露中如实列出"的承诺在材料终局的"如实披露"节（`:1730-1800`，只登记解析器字段）中并未兑现。
  **证据**：`:1680`「| 声明 1 | 「对整个 workflowhub 的所有审查…」 | covered（已覆盖） | D-101/D-107；D-018 范围扩大…」；`:1188` D-006 风险「用户声明 1/2「所有审查」「审查需求或技术设计」在本卡**不完整满足**，须在阶段末遗漏披露中如实列出。」；`:470`、`:257` 同旨（对照：声明 2 在同一矩阵判 `accepted_omission`，`:1681`）。

### M5 — `medium` · documentation
- **path**: `specs/workflowhub-thin-core-card-05-20260919/decision-log.md`
- **start_line**: 1593 · **end_line**: 1593（另见 868、951）
- **category**: documentation
- **content**: G-CK 一手核实判定「委托模式**不产出 finding，也不提供 finding schema**」，并把"早前记录的『OCR 提供 finding schema 脚手架』"登记为**术语冲突已解决**、明文要求「CONTEXT.md 不得写入该错误说法」。但该被撤销的说法仍原样留在材料的两个**现行**章节里：D-004 的 decision 正文与「核心需求」节。CONTEXT.md/ADR-0032 已按更正后的口径写，材料本体未同步，造成同一材料内两套互斥事实并存。
  **证据**：`:1485`「| finding schema 从何而来 | **委托模式不产出。** 本卡早前记录的「OCR 提供 finding schema 脚手架」**不成立**…」；`:1572` grill `conflicts.disposition`「…已由 D-019 更正并在 G-CK 留证；**CONTEXT.md 不得写入该错误说法**」；`:868` D-004「OCR 只做确定性工程（文件筛选 + 规则解析 + **finding schema 脚手架**）」；`:1593` 核心需求同句；`:951` RF-02「OCR 委托模式的实际价值 = 文件选择 + 规则解析 + **finding schema 脚手架**」。对照 `docs/adr/0032…` 与 `CONTEXT.md` L438 均已删除该措辞。

### M6 — `medium` · documentation
- **path**: `specs/workflowhub-thin-core-card-05-20260919/decision-log.md`
- **start_line**: 1617 · **end_line**: 1617
- **category**: documentation
- **content**: 「7 个文档审查面」的枚举只列 **6** 项，且用「`build-code/integration` 之外」把该面排除在外；而按 RF-11 与代码事实，`build-code/integration` 恰是那 7 个之一。同一材料对"哪 7 个面"给出两个不相容答案，直接影响 OI-026 映射表（交付物）的输入。
  **证据**：`:1617`「7 个文档审查面（make-decision 方向与细节、build-spec、build-plan、**build-code/integration 之外**、mini_task/design、non_stage/build_prd）」（计数：方向、细节、build-spec、build-plan、mini_task/design、non_stage/build_prd = 6）；`:1408` RF-11 的 7 面清单**含** `build-code/integration`；代码事实同 H3。

### M7 — `medium` · bug
- **path**: `specs/workflowhub-thin-core-card-05-20260919/decision-log.md`
- **start_line**: 1351 · **end_line**: 1351（同一断言见 `docs/adr/0032-review-chain-delegation-and-layer-contract.md` 「背景」第 3 条）
- **category**: bug
- **content**: P5 的量化证据把**宿主自己的总等待上限**当成"provider 需求"：`1,200,000 ms` 是 `DEFAULT_MANAGED_TERMINAL_WAIT_MS`（宿主侧"最多等多久"），不是 provider 的耗时需求；材料自己实测的 provider 最长耗时是 432,004 ms（RF-16，`:1066`）。「45/60/65s」中仓内只能找到 65 s（`DEFAULT_REVIEW_ROUND_TIMEOUT_MS`）。此外「还留孤儿进程」与本仓代码注释及 broker 设计相反。
  **证据**：
  - `skills/wh-review/scripts/simple-review-runner.mjs:41`：`const DEFAULT_MANAGED_TERMINAL_WAIT_MS = 1_200_000;`，其上注释 `:39-40`「**It is a total wait bound, NOT a stall detector**」、`:33-36`「This bound stops *waiting*, NOT the work: the broker is deliberately NOT cancelled… **orphans are reaped by `cleanup(root, ttl_hours)`**」、`:38`「D-030③ forbids WorkflowHub from inventing its own wall-clock stall verdict」。
  - `runtime/review/review-record-route.mjs:26`：`const DEFAULT_REVIEW_ROUND_TIMEOUT_MS = 65_000;`（仓内 `grep` 未找到 45 s / 60 s 的等待预算常量）。
  - `/Users/Hugh/Hugh/Project/3rd-review/lib/broker.mjs:664,702,725` + `lib/runtime.mjs:96,135,155`（`orphan_timeout_ms` 默认 30000、`ttl_hours` 24）证明孤儿治理是既有设计而非缺口。

### M8 — `medium` · documentation
- **path**: `specs/workflowhub-thin-core-card-05-20260919/decision-log.md`
- **start_line**: 596 · **end_line**: 596（对照 1232、1271）
- **category**: documentation
- **content**: OI-023 的完成条件要求「与 **packet 体积规则**一并设计上下文成本」，D-010 风险也写「须与 packet 体积上限一起设计」；但 D-013（在 D-010 之后作出）已「取消一切 fail-closed 的体积上限，不做分片」。一个 deferred 项的完成条件指向一个已被取消的对象，build-plan 无法据以闭合，且这正是 D-010「能读仓库」唯一被承认的成本约束。
  **证据**：`:596` OI-023 `follow_up_acceptance`「…新执行者的身份 / 隔离边界 / 事实写入位置成文，**并与 packet 体积规则一并设计上下文成本**」；`:1232` D-010 风险「「能读仓库」放大上下文成本，**须与 packet 体积上限一起设计**」；`:1271` D-013「**取消一切 fail-closed 的体积上限，不做分片。** 适配层不设任何字节闸门」。

### M9 — `medium` · bug
- **path**: `specs/workflowhub-thin-core-card-05-20260919/decision-log.md`
- **start_line**: 1196 · **end_line**: 1199（对照 1019、`:1207`）
- **category**: bug
- **content**: D-007/D-008 只读 `wh_review.stages.<stage>.initial[]`，但配置里每个 route 还有一个 `mode` 键（`build-code` = `full_only`，其余 = `single_round`），且 `initial[]` 的调用点会**强制校验**该键。新逐路派发路径既不解释 `mode` 语义（RF-09 自己指出这是"语义债务"），也未在材料中登记"忽略/继承/重定义 mode"的处置；同时 `full_only` 语义在代码中没有任何行为分支。这会让 D-008「只读既有键」在 `mode` 上失去确定含义。
  **证据**：`/Users/Hugh/.config/workflowhub/config.json:53-60`：`"build-code": { "initial": ["kimi/coding","codex/luna"], "minimum_heterologous": 1, "mode": "full_only" }`；`skills/wh-review/scripts/third-review-host-config.mjs:335-338`：`const required = stage === "build-code" ? "full_only" : "single_round"; if (configuredRoute.mode !== required) throw new Error(...)`（对每条 stage route 在 `:375`/`:384` 调用）；材料 `:1019` RF-09「`adaptive`/`full_on_structural_rework` 是**死选项**；WorkflowHub 不解释 mode 行为，只校验 + 透传给 broker | 语义债务」；`:1207` D-008「直接读取既有 `wh_review.stages.<stage>.initial[]` 作为 provider 目标」。

### M10 — `medium` · documentation
- **path**: `specs/workflowhub-thin-core-card-05-20260919/decision-log.md`
- **start_line**: 1665 · **end_line**: 1665（另见 1679、1612、985）
- **category**: documentation
- **content**: 母 PRD 把 ① build-plan 合并审查（FR-56/AC-57）与 OI-014 的 owner 明确写成 **CARD-05**，材料却把它判为 `covered（已覆盖）` 并声明「本卡不重做」，唯一依据是 card-02 归档 decision-log 的自述，未核对任何交付物、命令或 exit；而 card-02 材料中用户对该事的纠偏原文恰恰要求"**不得因此缩减该卡的验收范围**"。材料未把"① 的交付物核验"登记为本卡的验收动作或移交项。
  **证据**：
  - `prd.md:161-162`（需求覆盖结论）「| R-020 | U-010#3:build-plan 一次合并审查覆盖 spec+phase 文件 | SD-07;FR-23/56 | **CARD-05** | AC-23/26/57 |」；`:178-179`「| OI-014 | build-plan 合并审查一次覆盖 spec+phase 文件 | SD-07;FR-23/56 | **CARD-05** | AC-23/57 |」。
  - card-02 DL `:195`/`:731`/`:1839`：card-02 **自述**「③CARD-05 **只并入** ①`build-plan 合并审查`（FR-56/AC-57 + AC-23/AC-26 的①子句）+ 适配合同…**不做工具实测**」。
  - card-02 DL `:1983-1991`（用户纠偏）「只是极少一部分需求在 card-02 提前做了而已！…card-02 与其它卡的重叠，只能写成「**card-02 提前完成了 X**（事实登记）；对应卡执行时核对，**但不得因此缩减该卡的验收范围**」」。
  - 材料 `:1665`「| 母 PRD R-020 | … | covered（已覆盖） | ① 由 card-02 提前完成，本卡按 RF-06/D-006 不重做，保留 AC-23/AC-26/AC-57 核对 |」；`:1612`「build-plan 合并审查 ① 由 card-02 提前完成，本卡不重做」。

### L1 — `low` · documentation
- **path**: `specs/workflowhub-thin-core-card-05-20260919/decision-log.md`
- **start_line**: 1021 · **end_line**: 1021
- **category**: documentation
- **content**: RF-09 的「全仓 grep `max_rounds`/`maxRounds`/`round_limit` 在 node_modules 与 archive 外**零命中**」不成立，且"代码层完全没有数字轮次上限"对一个技能不成立。P4 是 D-021 闭环清单的第 4 项，其证据陈述需更正（"审查链代码内无轮次上限"仍成立，但不能再写成全仓零命中）。
  **证据**：`grep -rn "max_rounds" --include=*.ts` → `skills/debate/pk-rules.ts:94 | "max_rounds_reached"`、`:107 reason: "max_rounds_reached",`、`skills/debate/pk-rules.test.ts:94`；同文件 `pk-rules.ts:104` 为真实数字上限：`if (round >= 2) {`（注释 `:97`「D25: hitting the round cap…」）。（我最初的 `--include=*.mjs` 检索也漏掉了 `.ts`，这条由第二轮带 `*.ts` 的复核发现。）

---

## (C) 引用抽查结果（claim → actual）

抽查 22 条 `file:line` 断言（其中 15 条我本人在主检出 `642d4fb2` 上逐字读取核对；7 条由一名独立子代理按同一基线核对，我再对承重条目二次复读）。结论：**3 条错、4 条部分不符/过度解读、15 条相符**。

| # | 材料断言 | 实际 | 判定 |
|---|---|---|---|
| 1 | `third-review-host-config.mjs:710-720`：`initial[]` 任一未配置/未启用即整条抛错 | `:710 for (const tier of candidates)…:711-717` 未知 provider 抛错、`:718-720` `enabled!==true` 抛错；`ROUTE_UNAVAILABLE` 由调用方 `simple-review-runner.mjs:1348-1355` 附加 | **相符**（机制真实） |
| 2 | 同一条断言"直接解释"session1「host_provider must be a supported…」×11 | 该串唯一生产者 `third-review-host-config.mjs:211`，唯一 `host_provider` label 调用点 `:701`，在 `:710` 循环**之前**；注册表 `:205` 已含 `dsh` | **错（误归因）** → H2 |
| 3 | `third-review-host-config.mjs:736-744`：选择期比 distinct 底层 **model** 数 | `:741 const distinctModels = new Set(selectedModels).size; :742-743 throw` | **相符** |
| 4 | `third-review-host-config.mjs:662-674`：`sameSourceProfile` model 为 null 时 fail-open | `:672 if (model === null \|\| hostModel === null) return false;`（代码注释自述为有意） | **相符** |
| 5 | `third-review-host-config.mjs:335-342`：`requireStageReviewMode` 锁死 mode，`adaptive` 等为死选项 | `:335-338` 逐字相符；全仓无 `=== "adaptive"` 行为分支 | **相符** |
| 6 | `simple-review-runner.mjs:1389-1405`：派发前按 preflight 过滤后**重算** minimum_heterologous | `:1381` 过滤、`:1389 validateReviewThreshold(route,{... providers: dispatchProviders ...})` —— 重算的是 distinct eligible model 数，`minimum_heterologous` 本身是 route 固定值 | **部分不符（措辞）** |
| 7 | `canonical-review-result.mjs:211-213`：聚合期比 distinct adapter 数与 distinct `source_id` 数 | `:211`/`:212`/`:213` 逐字相符 | **相符** |
| 8 | RF-09：`minimum_heterologous` 是这三把尺子 | 第三把实际比的是 `minimum_reviewers`（`runtime/review/review-policy.mjs:101-102` ← `stage-materials.json` 的 `"minimum_reviewers": 1`），键名与 `minimum_heterologous` 不同 | **部分不符（精度）** |
| 9 | `REVIEW_PACKET_MAX_DELIVERY_BYTES = 2 MiB`（现行） | 全仓（排除 node_modules）**无此符号、无 2 MiB 常量**；唯一 2 MiB 是测试夹具 `tests/contract/stage-runtime-preflight.test.mjs:43`；仓内仅存 `docs/adr/0031-review-check…:50` 对 `review-materials.mjs:2218` 的**过期指针**（该文件现 2191 行） | **错（幽灵常量）** → H4 |
| 10 | 307,200B fail-closed 上限现行存在（P6/P13/OI-025） | `TASK_BOUND_PROVIDER_INPUT_MAX_BYTES` 已删除，`tests/contract/review-input-bounds-portability.test.mjs:30` 断言其不存在；`PHASE_DIFF_MAX_DELIVERY_BYTES` 亦被 `tests/contract/review-materials-contract.test.mjs:81` 断言不存在；`grep 307200` 仅命中测试夹具 | **错（已过时）** → H4 |
| 11 | `review-materials.mjs:1926`：`review_instructions` 必为 host 固定模板 + provider 只能读 bundle | `:1926` 逐字为固定模板断言；"只能读 bundle"的真实依据在 `review-materials.mjs:1036`（"Do not access the repository, parent directories, Git, shell, network, or host paths"）与 `contracts/provider-protocol.md:7`，不在 `:1926` | **部分不符（半条）** |
| 12 | `stage-materials.json:69-86` = 送审边界（required/forbidden） | `:69 "direction": {`、`:74 "forbidden": ["proposed_solution","decision_log","spec","plan","changes_diff","changed_files"]`、`:78 "detail":`…；由 `runtime/review/review-policy.mjs:1` 消费 | **相符** |
| 13 | `stage-content-contracts.mjs:449` = "needs_human is a pause state, not a terminal disposition" | `:449 if (status === "needs_human") errors.push("needs_human is a pause state, not a terminal disposition");` | **相符**（子代理首轮报"MISMATCH"系其核对任务描述串行所致，我已直接复读纠正；材料无误） |
| 14 | `runtime/task/task-store.mjs:230` = `FINDING_DISPOSITIONS` 五档 | `:230 export const FINDING_DISPOSITIONS = Object.freeze(["fixed","rejected_invalid","accepted_risk","needs_human","user_decided"]);` | **相符**（RF-13 正确） |
| 15 | `provider-material-projection.mjs:73-77`：字符串→`.md`，对象/Buffer→`.json` | `:73-76` 逐字相符（含 `direction_flow.json` 例外，`:74`） | **相符**（RF-12 正确） |
| 16 | `broker.mjs:577`：`if (!input.review_flow) return;` 静默跳过方向校验 | 文件**不在本仓**；逐字存在于 `/Users/Hugh/Hugh/Project/3rd-review/lib/broker.mjs:577`。本仓等价事实：`review-provider-client.mjs:936/1034`（可选）、`simple-review-runner.mjs:1446/1536`，且 `grep review_flow tools/ runtime/ core/ workflows/` **零命中**（无生产调用方） | **相符但跨仓未标注** → H7 |
| 17 | RF-19 根因链 `review-record-route.mjs:1225/:1370-1380/:1173/:1139/:1147/:1382-1397/:1399-1402` | 全部逐字命中；`foreign` 成员丢弃在 `:1198-1199`+`:1203`，pair 成员绑定失败在 `:1225`，`REVIEW_HISTORY_UNAVAILABLE` 在 `:1401` | **相符**（`:1382-1397` 是"命名空间匹配→RECORD_INCOMPLETE"分支，不匹配才落 `:1399-1402`，措辞可再精确） |
| 18 | `stage-review-disposition.mjs:43-47,196-235` = **唯一**阻断点 | 条件逐字相符；"唯一阻断点"为**过度解读**（≥2 处同谓词直接阻断） | **过度解读** → M3 |
| 19 | `contracts/make-decision.md:54-57`：red/blue 各携带 `direction-review.v1` flow | `:54-55` 逐字相符 | **相符** |
| 20 | `docs/adr/0031:15-19`：49 个任务库失败码直方图 | 数字全部命中，但仓内**有两个 `0031-*`**，直方图只在 `0031-review-check-downgrade-and-identity-boundary.md:15-19` | **相符（文件名歧义）** |
| 21 | RF-09：`max_rounds`/`maxRounds`/`round_limit` 仓内零命中、代码层无数字轮次上限 | `.ts` 下 3 处命中，含真实数字上限 `skills/debate/pk-rules.ts:104 if (round >= 2)` | **错** → L1 |
| 22 | 轮次上限只在散文：`dsh-code-review/SKILL.md:39`、`contracts/verify-code.md:6` | `SKILL.md:39` 逐字含「不开启第三轮」；`verify-code.md:6` 逐字含「不重复调用 provider」 | **相符** |

### C.1 我核对过、但**未**据以立案的项（避免误报）

- 材料 `:1024` 的历史失败码列表省略了 `RATE_LIMITED 28 / REVIEW_SOURCE_DRIFT 10 / MATERIAL_TOO_LARGE 7 / REVIEW_WAIT_EXCEEDED 3` 等——属**选择性引用**而非错误，且 `MATERIAL_TOO_LARGE 7` 的存在恰好加重 H4（上限问题已被既有卡处置）。
- P11「路由级拒绝被记为 `REVIEW_EXECUTION_FAILED` 且 `provider_attempts` 为空」：仓内确实存在兜底映射 `runtime/review/review-record-route.mjs:731`（缺 code 时用 `REVIEW_EXECUTION_FAILED`），但既有测试 `tests/review/review-record-route.test.mjs:338,400` 断言同类路径保留 `ROUTE_UNAVAILABLE`；s1 实例不可复核，故**不作为 finding**。
- `initial[]` 会被整组派发（含与 host 同源者）这一事实（`:722-729` `dispatchProfiles = [...tier]`，注释「dispatch every configured profile」）与 RF-09 描述一致，不构成错误。
- `PHASE_DIFF_INLINE_LIMIT_BYTES = 288 * 1024` 仍在（`review-materials.mjs:44`），但它是投递形态选择器（`:1957`、`:2051`），超限走 change-map 归档分支而非 fail-closed，故不推翻 D-013 的"我方不再设闸门"意图。

---

## (D) 独立性依据

1. **无共享上下文**：我在收到本任务前不知道 `workflowhub-thin-core-card-05-20260919` 的存在，未参与该卡的任何 Talk、调研、起草、修订或代码实现；不持有作者的推理链、草稿或未落盘结论。本材料中所有"我的选项/我的错误"式自述对我而言只是待核对的文本。
2. **与实现无关**：我未修改 `workflowhub` 主检出或该 worktree 的任何文件（子代理亦仅只读）。核查命令全部为 `sed/grep/python3 -c read` 类只读操作。
3. **只依据可复核证据**：本报告每条 finding 均给出被审材料的行号引文 + 仓内代码行号引文（或命令输出）。凡不能从仓内材料/代码证实的（s1–s4 原始会话、OCR 二进制行为、RF-16/19 原始产出）我明确标注为不可核对，并**未**据以立案。
4. **本条即 SD-08 要求的"未参与实现者完成的独立替代审查"**：审查工具/异构审查链路不可用时的 fallback，与实现者、与 make-decision 主会话均无上下文继承关系。

## (E) 我的局限（诚实声明）

- **无法复核取证会话**：13.4 亿 token、`unavailable` ×33、"307,200B 两处双写造成 121 分钟返工"等均源自不在仓内的 s1–s4 记录。我能判定的是"材料给出的机制解释与仓内代码是否相容"，不能判定"该事件是否如描述发生"。凡材料把机制与事件强绑定的地方（尤其 H2、H4、M7），我指出的是**绑定不成立/已过时**，而非"事件未发生"。
- **未复现 OCR 一手实测**：RF-01/02/10/15 的 `ocr` 命令输出我未复跑；H6/M1 的判定基于材料内部一致性（RF-10 缺该事实、RF-15 与 G-CK 的边界），不否定其实测结论本身。
- **未评估商业/质量判断**：「OCR 是否真的更好」属实验才能回答的问题；我只审查实验设计与验收判据是否可判真假，不预判结论。
- **未做全量需求对账**：母 PRD CARD-05 的 FR/AC 我逐条读过并与材料对照，但**未**对 10 张卡的交叉影响做全量核对；M10 只覆盖 CARD-05↔CARD-02 的 ① 交接。
- **未运行测试/构建**：按 AGENTS.md 测试纪律，本审查不跑测试；H4 的"已删除"结论来自源码阅读 + 两条既有契约测试的断言原文，未实际执行它们。
- **severity 标定含判断成分**：`critical` 我一条未给——理由见 (F)。

## (F) 结论：是否可进 build-spec

**可进，但须先处置 7 条 high 中的 4 条方向级问题，否则 build-spec 会把错误前提固化。** 材料在"诚实披露"上确有真实投入（自陈未决项、自陈解析器 workaround、自陈证据限制、把 disputed 的 blocking finding 原样保留），方向本身（修审查层而非打补丁、消除整组派发/丢弃已完成审查/审查者看不到代码这三个真实病灶）与仓内代码事实相符且理由充分；引用抽查 22 条中 15 条完全相符，说明取证基线总体可靠。但四处硬伤会直接污染 build-spec：(1) 「超时与取消」这一修复面与仍生效的 ADR-0031 第 14/15 条及被其否决的替代方案正面冲突，材料与 ADR-0032 均未提及，也未产出该 ADR 明确要求的"承担 ADR"（H1）；(2) 全卡第一机制根因 P1 的因果归因与其自引证据不符——session1 的零派发错误只能来自 `host_provider` 校验，与 `initial[]` 无关（H2）；(3) 三个"代码审查面"之一的 `build-code/integration` 在材料自有事实与代码中都不是 diff 面、且其合同禁止投递 diff，OCR 按 git diff 选文件与该面直接冲突（H3）；(4) 体积上限问题在基线上已被删除，OI-025/D-013 的验收判据恒真、D-002 引用的常量根本不存在（H4）。此外 D-021 的闭环清单同时包含已失效项（P6/P13）与排除唯一新增实测缺陷（P14），而其对应 OI-031 已判 confirmed（H5），使"范围可判真假"这一 D-021 的立身之本失效。建议：把这 4+2 条作为 build-spec 的入口条件（先办 H1 的 ADR 承担、就地更正 H2/H4/M7 的事实陈述、把 H3 登记为适配合同的显式冲突项、由用户显式追加或明确排除 P14），其余 medium/low 可作为 build-spec 内的一并修正项，不必重开 make-decision。
