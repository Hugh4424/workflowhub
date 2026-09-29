# P10/T021 材料澄清记录（2026-09-28，第四轮定位补界）

## 本次修改

- `specs/workflowhub-thin-core-card-04-20260919/spec.md`：只在实施设计加 P10 来源合同；FR-32/33、AC-32/33 正文及 D-013 未改。
- `specs/workflowhub-thin-core-card-04-20260919/phases/P10.md`：现有受信 receipt→output→manifest→原始 reporter 链证明指定回执曾真实执行；本次官方 `run` 的输入、质量事实与最终阶段行写入返回证明消费了哪份回执。来源绑定只需一份内容寻址消费原件；不新增 capture 执行观察。列出 owner/consumer/替代删除条件与失败负控。
- `specs/workflowhub-thin-core-card-04-20260919/phases/index.md`：只同步 P10 指针行的职责、窄写面、依赖和消费者，没有写进度事实。

现有 receipt 无 `dispatch_state`，阶段行无测试/逐 AC ref。`dispatch_state=executed` 只可在受信 `verify` 当次内存返回中说明这次新跑；独立 `run` 不声称自己新跑或每次都要重跑同树测试。唯一新增来源原件属于现有 Task `quality/evidence/`，由受信官方 `run` 生产者记录实际输入、当次选用的质量 fact 引用，以及本次 `writeStageRow` 返回的最终行身份。`withStageRow`/`runStageEndReflection`/`runStage` 私有传该身份；写后盲读当前行可能读到并发运行的行。两份同树有效回执按 `run` 实际输入评价；代码、材料、业务目录或测试库存变化后旧回执不能证明当前效果。来源通过仍须另核每例真实业务效果。没有新增公开命令、阶段、进度状态或 P5 证书复用。

## 定向检查

- FR-32/33 与 AC-32/33 正文检查：未改；其中要求当前源码快照真实执行和修复后新快照重跑，没有规定同树每次 `run` 重跑。若后续另有权威 AC 明确相反要求，需先报告冲突，不能从旧回执推断新跑。
- 当前材料结构与空白检查：需求正文、唯一消费原件、现有 receipt 原始链、私有写行返回、源码/目录/库存漂移负控及 P10 index 指针均核到；10 项 true，exit 0。未运行产品测试或正式 build-plan。
- 第三轮 SHA-256：`spec.md=68332ddf6637dcc6816d2a67d3c6230f19772f2cb5ee74ee799d9beedc0bd182`；`P10.md=a3afab898822a67aca43b268aa1d8cc29b92667790bb68c3b26c2ed8fb9c6f2b`；`index.md=fc553b20e768ce84ca14be6cc4fc6398b61431564aae333b8f95fea638309861`；仅为上一轮材料身份。
- 第四轮定位补界：现有 TaskHandle 不提供安全列举，消费原件内容哈希路径也不能从 receipt 反推。限定 P10/T021 成功时在 `stage-runtime-result.vnext` 加可选 `p10_consumption_evidence:{ref,sha256}`，由调用方显式传给私有对账；reader 重新认证原件、当前行、receipt 与质量 facts。没有第二持久对象、可变 latest、目录扫描或新公共命令。P10.md 明列 locator 缺失、错 namespace/hash、别次 run locator、旧消费者兼容及半写负控；字段发布失败显式报错、不返回成功 locator。
- 第四轮结构与空白检查：9 项 true，exit 0。随后只把“P10/T021 成功时”消歧为“消费原件发布及重读成功时”，避免被误读为整个 Phase 已完成；代码、测试、Task facts 未改，没有正式 build-plan 完成或 P10 通过结论。该轮 SHA-256：`spec.md=64cb26404b824a4750f0cafce8d7770cf23677f39506364599d95cbc94a4f863`；`P10.md=36f5212c0209ff5747de1606c008a875c7d5652e3cc9737d34fece6b8c7b8868`；`index.md=9df146d7ea34f668a0bad3d9179b0c103590df77d8c0779439fb73a101974606`。
- 第五轮：外置 Task 的 `P10/T021-acceptance-producer-gap-audit-20260928.md` 与工作树的 `P10/T021-three-seed-real-scenarios-20260928.md` 证明三 seed 尚无可直接填的真实验收入口。只读两步提案 `P10/T021-ac-receipt-spec-clarify-proposal-20260928.md` 先登记逐场景 AC 解析/受信 P10 producer 写面与可失败目标；真实 adapter 与独立 oracle 未找到前不写 `acceptance_role/data`，AC-26/27/33 保持未证明。获主代理限权后，正式材料**只**增加 `runtime/stage/stage-runner.mjs#verifyOfficialEvidence` 结构化字段值比较的精确写面、owner/consumer/删除条件和独立 JSON 正反负控；代码、测试、Task facts 未改。最终结构/空白 7 项 true，exit 0；不代表正式 build-plan 完成或产品通过。当前 SHA-256：`spec.md=ca14640ec1fe6b2b683bc4983b28534be114fd192e052190d938d56b85665663`；`P10.md=cd0b89a093961acad7a3e8cf9139edaeef6691c984d11fb2e857fba3d01994c7`；`index.md=bb517ed53cd6d4e4a7ad71d0a2004fdb4a1705cabd0391b6dfa5d034c89573a0`；提案 SHA-256 `cdb534964f0eb7ace4b4067a13ebc9346ef56d830c884c8b4491b9f412b69d40`。

## 宪法与限制

对照 `constitution-checklist.md`：F1/F2/F8/F10/F11 的窄私有接线和唯一消费者、F3/Q2 的 post 材料及执行事实分离、F4/Q1/Q3 的质量事实不作推进许可且待异源审查、F9 的旧/错/半写证据不假绿均保持。S 条款无技能改动。此文件是修改说明，不是独立质量裁决、正式 build-plan 完成、实际测试或 P10 通过；材料仍需异源复审和正式流程确认，生产实现及负控仍未做。
