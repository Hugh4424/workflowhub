# P13 多命令 gate 合同：只读修复提案

本文件是提案，未改 `tests/contract/card04-final-aggregate.test.mjs`、P8/P9/P11/P13 材料、最终三文件或 Task facts，未运行测试。

## 眼前的硬失败

`card04-final-aggregate.test.mjs:87-96` 的 `authoritative()` 只接受 `- **gate_cmd**: ` 后紧接一段反引号命令。当前 P8.md:13 有两条实际目标命令；P9.md:12 先列一条**旧合同**，后列当前 T018/T019 两条；P11.md:18 分第一步、第二步。因此三个相位的 `gate` 现在都为 `undefined`，最终 JSON 无论怎样填写都不能使第一项测试真实 GREEN。

当前正式 Task 回执分别是 P8 两条（2/2、10/10）、P9 当前两对（12/12、11/11）；P11 第一条 5/5，第二条是带 `-t` 的受影响子集（24 通过、56 未选），另有 `node --test` 22/22 邻接检查。**P11 第二条回执的命令不等于卡面未筛选的第二条**；两者不得混称完整 gate。原始 ref/hash 可从 `P13/source-ledger-readonly-20260927/index.json` 按 P8/P9/P11 读回。

## 建议的最小合同形状

只在 P13 最终 JSON 的现有 `card04-final-aggregate.v1` 内补多命令相位字段，不新增 runtime、schema 文件或第二套状态对象。单命令 P1、P2–P7、P10、P12 的字段和断言保持原样。

```json
{
  "phase_id": "P8",
  "gate_cmd": "<当前卡面第一条必需命令，逐字>",
  "additional_gate_cmds": ["<当前卡面第二条必需命令，逐字>"],
  "gate_status": "passed 或 unknown",
  "gate_evidence": {
    "commands": [
      {
        "receipt_ref": {"path": "<同一 Task quality/tests 的绝对路径>", "sha256": "<实算>"},
        "output_ref": {"path": "<同一 Task quality/tests/output 的绝对路径>", "sha256": "<实算>"},
        "test_ids": ["<真实 runner 收集到的完整身份>"]
      }
    ]
  }
}
```

`gate_evidence.commands` 只在 `gate_status=passed` 时必须按 `gate_cmd`、`additional_gate_cmds` 的顺序**齐全**；非通过可另列已核的部分 ref 和 `gate_status_reason`/`gate_status_owner`，但不能把部分项塞进通过数组。`phase.status` 可仍为 `not_done`，`overall_status` 可为 `incomplete`。任务是否 `passed` 继续由其完整 Done 条件和外置 Task 当前质量来源决定，不能仅由相位测试退出码决定。

### 解析候选（仅示意，未应用）

```diff
- const gate = text.match(/^- \*\*gate_cmd\*\*: `([^`]+)`/m)?.[1];
+ const line = text.match(/^- \*\*gate_cmd\*\*: (.+)$/m)?.[1];
+ const quoted = [...line.matchAll(/`([^`]+)`/g)].map(m => m[1]);
+ // P8: 恰两条，须分别位于“旧目录结构目标”“来源/未来观察合同目标”之后。
+ // P9: 恰三条，第一条仅“旧定向合同”历史；第二/三条分别须位于“当前 T018”“T019”之后。
+ // P11: 恰两条，须分别位于“第一步”“第二步”之后；第二条仍为卡面未筛选原命令。
+ // 其余 Phase: 恰一条，沿用原 gate_cmd 和 gate_evidence 对象。
+ const currentCommands = selectByExactPhaseLabels(phaseId, line, quoted);
+ if (!currentCommands) throw new Error(`${phaseId} gate_cmd source ambiguous`);
+ return { gate: currentCommands[0], additional: currentCommands.slice(1), tasks };
```

`selectByExactPhaseLabels` 须对数量、标签顺序和每段命令作完整匹配；卡面文字变了就报来源歧义，不能简单 `slice(1)`、取第一个通过回执或用拼接出的 `cmd1 && cmd2` 冒充原命令。P9 旧合同保留在材料中，但不算当前必需两条。P11 `node --test` 是邻接补充，不在卡面两步 gate 中。

### 每条正式回执的独立绑定候选

对每个 `commands[i]`，从已认证本 Task 根重读两份原始字节，实算 SHA；receipt 必须是当前 Task 的 `build-code` 测试记录，`command === currentCommands[i]`、`exit_code===0`、`snapshot_tree` 与当前工作树、`source_digest` 与当前工作树一致，`output_ref`/`output_hash` 必须指向该条提供的原始 output。两个命令不得引用同一旧回执/输出或别的 Task。原始 runner 输出还须有非零收集、完整可归因的测试身份和零失败；若原输出只有文件名/总数而无逐测试身份，先标来源不足，不能在 JSON 自填 `test_ids` 求绿。当前树可复用现有只读 `openTask` + `openCurrentTaskWorkspace` + `captureWorkspaceSnapshot` 取得，而不能拿 JSON 自报的 `snapshot` 自证。所有这些是 P13 测试/异源审查读取，不新增正式 writer。

任一命令缺失、非零、错 Task/命令/树、ref/hash/输出错绑、零测试、跳过或身份来源不够，`gate_status` 不得为 `passed`，并保留已跑子集及缺口。尤其 P11 只能称第一步已跑、第二步受影响子集已跑，当前完整 gate 仍 `unknown/not_done`；真实浏览器效果另为 `unknown/unavailable`。

## 实施与验证顺序

1. 先保存当前 P13 测试及 P13.md 字节/SHA、原始单文件 RED。`P13.md:9` 目前只许可对 P5/T008 做窄测试修订；多命令合同涉及写面变更，须由材料 owner 明确修订。改 P13.md 会改变全局材料版本，现有正式回执不能无声沿用；优先审定**仅 P13 测试内的读取合同**与现有材料的解释，若必须改材料，应预先安排同版回执重采与 P8/P9/P11 来源重绑。
2. 在现有第三项内存负控先加入 P8/P9/P11 当前卡面解析正控，旧 parser 应目标 RED；加入缺第二条、旧 P9 命令误算当前、P11 筛选命令冒充全命令、错序/重复命令的反例。然后最小实现解析，得到同测试字节 GREEN。
3. 对多条 canonical receipt/output 的读者补正控及负控：正确两条/同 Task 同树/各自 output hash；删一条、任一 exit 非零、错命令/旧树/错 Task、重用同 receipt、坏 ref/hash、零收集/伪 `test_ids` 必须拒绝 `gate_status=passed`。仅跑 P13 单文件定向，不扩大全量。
4. 真实最终三文件存在、独立叙述**实际贴出**后再运行 P13 结构 gate；它可在 `overall_status=incomplete` 时 GREEN，含义只是“坏消息如实逐项交付”，并非 CARD04 业务验收通过。交付记录的 `posted_at_utc` 必须取真实贴出后时间，不能预填。

若暂只让多命令相位一律 `unknown/not_done` 并让结构测试 GREEN，报告可以诚实交付，但 **P8/P9 两组已跑的当前正式回执未获多命令正向对账**，读者不能发现漏一条、错顺序或借旧回执冒充当前；P11 第二条命令与材料的差异也容易埋在文字里。应保留上述正反例和后续当前来源核验，而不是为了结构绿把实际可证的局部结果删掉或写成整体通过。
