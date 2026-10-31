# P11 坏输入实验（2026-10-31）

这份目录只证一件事：P11 迁移后的每条断言，在被针对性地弄坏时判红；
真实交付原样跑时判绿。它不证页面效果、真实 provider 或七职责语义齐备。

## 怎么做的

- 在仓外建副本 `/tmp/p11-badinput-20261031`，`node_modules` 软链回仓。
- 每次只改一处（材料或读取器），跑一次目标测试，存 stdout 与退出码。
- 恢复原字节后再做下一处；仓内测试与材料字节全程不动。
- `runbook.sh` 一次重建副本并重放全部用例，输出就落在本目录。

副本忠实性先证：未改字节跑出 94 通过（`00-mirror-baseline`），
与仓内真实交付同结果，所以后面的红可归因到那一处改动。

## 结果

| 用例 | 坏输入（只改一处） | 目标断言 | 退出 | 红在哪 |
| --- | --- | --- | --- | --- |
| M1 | spec 模板证据计划删「成本类别」一段 | acceptance-plan:69 | 1 | `invalid 成本类别` |
| M2 | phase 模板 T001 删 `RED/GREEN gate_cmd` 行 | acceptance-plan:72 | 1 | errors 点名该职责 |
| M2b | 同一行 `Test tier / skill` 值写成 TODO | acceptance-plan:73 | 1 | field_gaps 点名该字段 |
| M3 | 读取器不再把 gate_cmd 缺项写进 field_gaps | n11:35 | 1 | 期望四项、实得 `[]` |
| M4 | 读取器不再把 expected_exit 缺项写进 field_gaps | n11:35 | 1 | 期望四项、实得 `[]` |
| G | 无（仓内原字节） | 两份文件全部 | 0 | 94 通过 |

原件：`0N-*.patch` 是那一处改动，`0N-*-filtered.stdout.txt` 是单点红，
`0N-*-full.stdout.txt` 是整文件跑，`.exit` 是真实退出码。

- M2 的红是主用例的 `expect(result.errors).toEqual([])`，
  消息 `phases/P1-行为结果.md T001 needs one executable RED/GREEN gate_cmd`。
- M2b 的红是同一用例的 `expect(result.facts.field_gaps).toEqual([])`，
  报的是 `{phase_id:'P1', task_id:'T001', path:'phases/P1-行为结果.md',
  field:'Test tier / skill'}`。
- M3、M4 的坏输入在读取器侧：这两条用例自己造材料，
  材料侧改键仍会被读者报缺项（试过，不红），所以只能去掉读取器那一个职责。
  去掉后 errors 仍为空，只有目标断言红，另 18 条 n11 用例全过。

## 影响面

同一次坏输入还会击中依赖同一基线的派生用例，这是共享夹具，不是越界：

- M1：`01-M1-full` 29 失败 / 46 通过，全部来自同一个 spec 模板职责。
- M2：`02-M2-full` 45 失败 / 30 通过，主用例在失败清单最前。
- M2b：`03-M2b-full` 45 失败 / 30 通过，同上。
- M3、M4：各 1 失败 / 18 通过，只击中目标那一条。

## 旁证（都在本目录）

| 文件 | 命令 | 真实结果 |
| --- | --- | --- |
| `06-real-delivery.*` | 仓内两份测试 | 94 通过，退出 0 |
| `07-four-file-gate.*` | 四文件门禁 | 145 通过，退出 0 |
| `08-verify-structure.*` | `node tools/cli/verify-structure.mjs` | 退出 0 |
| `09-run-checks.*` | `node tools/cli/run-checks.mjs` | 退出 0 |

带 `--material-root` 的整集校验退出 1，100 条错误，12 个 Phase 全覆盖：
当前未提交的校验器要求每份卡有 `## L0`、`## L1`、`## L2` 与 `### Tnnn — 标题`，
而本轮全部 Phase 卡还是旧结构。P11 占其中 4 条（缺 L0、L1、L2、任务卡），
与 P2、P3、P6、P8、P12 同类；本次改动未新增这一类错误。

## 输入哈希（跑这一轮时的字节）

| 文件 | sha256 |
| --- | --- |
| `tests/contract/acceptance-plan.test.mjs` | 9716c16b872ce886cc2dbbb42ca628dc733526dcceb0ccacbcaee2663136a7f1 |
| `tests/contract/n11-plan-quality.test.mjs` | 032edfebde229c08b12ce6dfef0ba35c45839c8464b4f27c1ba5cc043d174cb5 |
| `skills/spec-specify/templates/spec-template.md` | 6b46f413c52e601068518a8f32d20a81880b4cc9bffb1d06748d611516a59694 |
| `skills/spec-plan/templates/phase-template.md` | 3f0d74977ee0c118b924f67c5c13871be1d32f99123b7ae93ef03305e433d6fb |
| `runtime/stage/stage-content-contracts.mjs` | f95d0bd5013905c58b980e4472eda9cbd94bd663142fd5dd93a8efc222b2e15e |

vitest 2.1.9，Node 与仓内同一可执行文件。

## 这份目录不证什么

- 不证七职责语义齐备；那要读材料本身。
- 不证页面效果、真实 provider、取得时点、实际成本与 ref 真实性。
- 不等同于正式 OCR 或独立测试；它只是可重放的观察事实。

## 重放

```sh
bash quality/evidence/build-code/2026-10-31-p11-bad-input/runbook.sh
```

脚本会重建 `/tmp/p11-badinput-20261031`，覆盖本目录同名的 stdout 与 exit。
