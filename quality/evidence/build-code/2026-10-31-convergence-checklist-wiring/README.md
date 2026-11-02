# C07 收敛清单接线证据（2026-10-31，A 选项）

任务：workflowhub-ui-frontend-c07-real-page-verification-20261028；阶段 make-decision。
结论：按 A 选项收口——只保留两处接线（decision-log 指针、清单首列数字），不重排 5 格清单。
读者：C07 后续收口、独立审查、build-code 消费者。

## 1. 做了什么

| 文件 | 改动 | 改前 | 改后 |
| --- | --- | --- | --- |
| `specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md` | 第 274 行后加 1 行指针（另带 1 个空行） | 无 convergence-checklist 指针 | `收敛清单唯一原件：` + 反引号路径 `quality/evidence/decision-log-refs/convergence-checklist.md` |
| 任务库 `quality/evidence/decision-log-refs/convergence-checklist.md` | 10 行首列 `M1…M10` → `1…10` | `| M1 定位与形态 | 收敛 | … |` | `| 1 定位与形态 | 收敛 | … |` |

约束核对：清单其余单元格逐字节未动（diff 只 10 行，删除 10 个 `M`）；checker 未改；其它材料未动。
decision-log 全篇 `convergence-checklist` 只出现 1 次，满足“唯一指针”。

## 2. 机读契约（主仓 `tools/cli/check-stage-steps.mjs`，工作树版，sha256 `ce8bba87526f3c26fd920b46111bab0b86127ceeaf4b3e660e7fa992001c29d0`，17304 B）

- L126：decision-log 里取反引号路径 `` `quality/evidence/…convergence-checklist….md` ``；L206 恰好 1 个才算指针；L210-213 realpath 必须落在 `<task-path>/quality/evidence` 内（相对 task-path，不是 material-root）。
- L215：`filter(line => /^\|\s*\d+\s/.test(line))`，行首列必须是数字+空白。
- L217/L222：每行按 10 格读——`编号、目标、边界、方案与取舍、验收、风险、依赖、消费者、未决/无、状态`；`state = cells[9]`。
- L238：`row.state !== '已收敛' || row.fields.some(field => !field.present)` 即 gap；L243 才可能 `complete=true`。
- L164-205：格内还要有可解引用（D-xxx、决定 N、AC-/OI-、details§N、WPn、“无”或逐词消费者），非空不算。

## 3. 材料格式（5 格，人类可读）

清单列：`包 | 状态 | 五段表位置 | 证据 | 未决/缺口`。按 10 格读时错位如下：

| 代码期望 | 实际读到 |
| --- | --- |
| 编号 | `1 定位与形态`（正确） |
| 目标 | 人类“状态”列 |
| 边界 | 人类“五段表位置”列 |
| 方案与取舍 | 人类“证据”列 |
| 验收 | 人类“未决/缺口”列 |
| 风险、依赖、消费者、未决/无 | 空（第 6-9 格不存在） |
| 状态 cells[9] | 空（第 10 格不存在） |

## 4. 机读结果（真实命令与输出）

命令（`--task-path` 必须是任务库，含 `task.json/quality`）：

```
node tools/cli/check-stage-steps.mjs --stage=make-decision --json \
  --task-path=<任务库 C07> \
  --material-root=<worktree specs/workflowhub-ui-frontend-c07-real-page-verification-20261028>
```

改前（本目录 `2026-10-31-c07-check-before.json`）：`modules=0`、`source=null`、`errors=1`
（`收敛清单: 未取得唯一当前任务收敛清单指针`）、`gaps` 12 条（缺模块 WP1..WP11 + 指针未取得）。

改后（`2026-10-31-c07-check-after.json` / `.txt`）：`modules=10`、
`source=quality/evidence/decision-log-refs/convergence-checklist.md`、`errors=80`、`state` 全 `""`、
`fields` 0/8 × 10、`gaps` 11 条、`complete=false`。文本末行：

```
收敛 complete=false；gaps=["1 定位与形态",…,"10 交付证据与防假绿","缺模块 WP11"]
```

两次 checker 调用均 exit 0（report-only，不拦截）。

## 5. 80 条缺口的事实

- 数量与形状：10 行 × 8 项 = 80 条，全部是 `${包名}/${字段}: 未取得可回读的当前证据：${单元格原文或“缺项”}`。
- 每行前 4 项带人类单元格原文，后 4 项为“缺项”。样例：
  - `1 定位与形态/目标: 未取得可回读的当前证据：收敛`
  - `1 定位与形态/边界: 未取得可回读的当前证据：「工作包 ①」五段表`
  - `1 定位与形态/方案与取舍: 未取得可回读的当前证据：Talk H/L/N/O/Q/U；D-001/006/020/021/031/032/040`
  - `5 判定与分级/风险: 未取得可回读的当前证据：缺项`
- 原因：5 格表被按 10 格解析，状态列不存在、8 项错位或为空；不是材料缺内容，也不是包真的未收敛。
- 工具契约（10 格）与材料格式（5 格人类可读）的差异；按 A 选项不为此改清单内容。
- 若要机核 8 项：属材料格式改造（11 行 × 10 格 + decision-log 锚点），需单独决定，不在本次范围。

## 6. 11 条 gap 与“停点信号”判断

| # | gap | 来源 | 清单人类状态 | 机读 gap 原因 | 判定 |
| --- | --- | --- | --- | --- | --- |
| 1 | 1 定位与形态 | 行级 | 收敛 | state 空 + 8 项全 false | 假阳性（格式） |
| 2 | 2 共用契约 | 行级 | 收敛 | 同上 | 假阳性（格式） |
| 3 | 3 判据矩阵 | 行级 | 收敛 | 同上 | 假阳性（格式） |
| 4 | 4 真实采集 | 行级 | 收敛 | 同上 | 假阳性（格式） |
| 5 | 5 判定与分级 | 行级 | 收敛 | 同上 | 假阳性（格式） |
| 6 | 6 回修闭环 | 行级 | 收敛 | 同上 | 假阳性（格式） |
| 7 | 7 报告与接入 | 行级 | 收敛 | 同上 | 假阳性（格式） |
| 8 | 8 规范复用与能力自验 | 行级 | 收敛 | 同上 | 假阳性（格式） |
| 9 | 9 make-decision 流程修复 | 行级 | 收敛（规划） | 同上 | 结果偶然对齐；机读未读该状态，原因仍是格式 |
| 10 | 10 交付证据与防假绿 | 行级 | **partial**（r3…R1 仍开） | 同上 | 结果偶然对齐；机读未读该状态，原因仍是格式 |
| 11 | 缺模块 WP11 | 集合差 | 无此行 | decision-log 11 包、清单 10 行 | 真缺口（缺台账行） |

判断：

- 行级 gap 条件见 L238；C07 每行 `state=""` 且 8 项全 false，所以 10 行**恒为 gap**，与包是否真收敛无关。把 5 格人类状态全改成“已收敛”也不会减少一条。
- 因此这 10 条**不能当“有包未收敛”的停点信号**：它恒真、不判别；8/10 是纯假阳性，另外 2 条只是结果偶然对齐（人类状态本身也非“已收敛”，格式修好后仍应是 gap）。
- 只有第 11 条 `缺模块 WP11` 有判别力：它来自权威 11 包（decision-log 标题）与清单 10 行的集合差；补上 WP11 行后“缺模块”即消失（该行能否标已收敛另判），可当“缺台账行”的停点信号。
- 结论：这条输出只能当“格式不可机核 + 缺一行”的报警；作为细节审查前的“未收敛即停”，机读层面**不可用**，需要人读 5 格清单（8 收敛、1 收敛（规划）、1 partial）。checker 本身 exit 0，停不停是读输出的人/agent 决定。

## 7. 为什么选 A（不选 B）

- 判真伪的能力没降：5 格清单仍是人读的收敛结论，8 个包“收敛”、1 个“收敛（规划）”、1 个 partial。
- B 要为只报告、不拦截的 checker 大改材料：11 行 × 10 格、44 条决定补 `#### D-xxx` 标题、补 AC/OI 表行；不符合“最小充分验收”。
- 保留的两处接线是真正必要的：指针可定位、清单 10 行可列出；缺口如实记录，不冒完成。

## 8. 复现

```
node /Users/Hugh/Hugh/Project/workflowhub/tools/cli/check-stage-steps.mjs --stage=make-decision --json \
  --task-path=/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c07-real-page-verification-20261028 \
  --material-root=/Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c07-real-page-verification-20261028/specs/workflowhub-ui-frontend-c07-real-page-verification-20261028

node /Users/Hugh/Hugh/Project/workflowhub/tools/cli/run-checks.mjs \
  --material-root /Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c07-real-page-verification-20261028/specs/workflowhub-ui-frontend-c07-real-page-verification-20261028
```

run-checks：exit 0，`ALL CHECKS PASSED`，`[run-checks][material] PASS … phase_count=12 task_count=36 errors=0`
（另有别任务 decision-log 的 D-015 advisory 警告；`level basis` 仍“未读到级别事实”，改前即如此）。

## 9. 文件清单

| 文件 | 字节 | sha256 |
| --- | --- | --- |
| `2026-10-31-c07-check-before.json` | 15115 | `adbf66762c3b3ff1876a576bcf29bbbf7acccb2a47da257361e423fe97b36718` |
| `2026-10-31-c07-check-after.json` | 33905 | `0da7a51462e016977cb8b6ba246a36ac593d4bdd33f0baf0ff6615277f37db52` |
| `2026-10-31-c07-check-after.txt` | 20980 | `dc4f67d412513c90bfe2b12586ba702c0028c0a83b74e1cfda47770f1bb41ba1` |
| `2026-10-31-c07-run-checks.txt` | 9892 | `fe9daa346c6acaad4c8df954ad35bc8e1ceba303228ef1a288bebd225ecd9015` |
| `2026-10-31-c07-convergence-gap-report.md` | 5985 | `2578f269b092552142a667468f8d9d502645454d4b5bb1499c2ed05e57fbc2ea` |

材料（本次定稿）：
- decision-log.md：166934 B，sha256 `b1e7f8d4b0d6a192b1c63b570faee743eb5abd1f6356ba3f4172f0443efb4068`
- convergence-checklist.md：2518 B，sha256 `7e69e16fd8577d8e062646239e037558d40f65cdb44848eff6081c08a4aa0e62`
