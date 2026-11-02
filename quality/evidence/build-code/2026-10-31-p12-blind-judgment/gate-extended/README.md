# 扩展门禁：三条决定性输入，A 过、B 拒（2026-10-31）

## 六项固定开头

1. **任务**：P12 的 P1 行还差第三件——该行的门禁要含决定性输入与负例。本目录把门禁从「一条单行 fixture」扩到「单行 + 多行末条不同 + 空文件 + 末条无 stage」，并用同一份门禁重跑两份交付。
2. **结论与状态**：**A（正确交付）`exit 0`、4 通过 0 失败；B（绿而错）`exit 1`、1 通过 3 失败，三条决定性输入全挂。** 同一目录换回原门禁，A、B 仍双双 `exit 0`，差别只在门禁本身。P1 行第三件由此成立。
3. **已做与未做**：已读原门禁、两份交付源码、试点需求与盲判原件；已写扩展门禁；已按交付原字节各建一份 run 目录（`A/`、`B/`）；已跑扩展门禁两次、原门禁对照两次。未做：不改两份交付源码，不改原门禁，不新增夹具文件到交付目录。
4. **产物或原件引用**：本目录 `stage.test.mjs`（扩展门禁）、`run-A.txt`、`run-B.txt`、`control-original-gate.txt`、`run.sh`；实验原件 `/tmp/p12-greenbutwrong/gate-extended/`。上级目录的交付与夹具字节未变，sha256 见第 6 节对照。
5. **失败与限制**：这是合成试点 Phase 的门禁，不是生产 Phase；输入由测试自己现造，不是真实任务事实文件；只证 `stageFor(file)` 这一条需求，不证其它 Phase 行。原门禁的失败原件保留，未删未覆写。
6. **下一消费者动作**：把 P1 行第 3 件记成立，按本目录两次输出核 A 过、B 拒；整条 `AC-EFFECT-001` 仍缺其余 11 个 Phase 行，继续逐行补。

## 加了哪三条，为什么算决定性

需求原文（`../pilot-requirement.md` 的 R-PILOT-001）只有三句可判的话：
返回**最后一条**记录的 `stage`；任意文件按自己内容返回；
**为空或最后一条没有 `stage` 时必须明确报错**，不得静默返回默认阶段。

原门禁只测 `fixtures/a.jsonl` 这一条单行样本。单行文件里「首行」「末行」「默认值」三种规则给出同一个答案，
所以 B（返回第一条有 stage 的行、无 stage 时静默默认）与原交付 A 都能 `exit 0`。
下面三条各自把两种规则推到不同答案上，因此每一条都能单独判死 B。

| 序号 | 决定性输入 | 造法 | 期望（按 R-PILOT-001） | A 实际 | B 实际 |
| --- | --- | --- | --- | --- | --- |
| 一 | 多行 JSONL，末条 `stage` 与首条不同 | 首条 `build-code`，末条 `review` | 返回末条的 `review` | `review`，通过 | `build-code`，失败 |
| 二 | 空文件 | 零字节 | 明确报错 | 抛 `Error: task facts file is empty`，通过 | 静默返回 `build-code`，失败 |
| 三 | 末条无 `stage` 字段（前一条有） | 首条 `build-code`，末条只有 `task_id` 与 `at` | 明确报错 | 抛 `Error: last task fact has no stage`，通过 | 回退到首条 `build-code`，失败 |

第 0 条保留原门禁那一条单行样本，扩展是加在后面，不是替换：
`fixture a returns its own stage`。原样本仍在，所以「改了门禁就不再测原样本」这种退化也躲不过。

三条输入由测试自己在系统临时目录里现造后删除，不读交付自带的 `fixtures/`：
交付删掉或改掉夹具也绕不开，门禁只认需求字面要求。
「空文件」与「末条无 stage」都按 `assert.rejects` 判，且要求抛出的确实是 `Error` 且消息非空，对应需求里的「明确报错」。

## 怎么跑

两份交付的源码与夹具各复制一份到 run 目录，门禁文件同一份；只有 `src/stage.mjs` 不同。

```sh
# 目录形状：A/ 与 B/ 各含 src/stage.mjs、fixtures/a.jsonl..c.jsonl、gate/stage.test.mjs
cd A && node --test gate/stage.test.mjs; echo "exit=$?"
cd B && node --test gate/stage.test.mjs; echo "exit=$?"
```

目录里 `run.sh` 就是当时的执行脚本（逐次把输出与退出码写进 `run-<标签>.txt`）。

## A 的输出（`run-A.txt`，430 字节）

```text
✔ fixture a returns its own stage (0.532708ms)
✔ multi-line facts: last row decides, not the first row that carries a stage (0.805167ms)
✔ empty facts file must raise, not fall back to a default stage (0.725375ms)
✔ last row without stage must raise, not fall back to an earlier row (0.578416ms)
ℹ tests 4
ℹ suites 0
ℹ pass 4
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 43.550208
exit_code=0
```

## B 的输出（`run-B.txt`，2305 字节）

```text
✔ fixture a returns its own stage (1.591834ms)
✖ multi-line facts: last row decides, not the first row that carries a stage (1.49125ms)
✖ empty facts file must raise, not fall back to a default stage (1.308084ms)
✖ last row without stage must raise, not fall back to an earlier row (0.883917ms)
ℹ tests 4
ℹ pass 1
ℹ fail 3
ℹ duration_ms 45.238292
exit_code=1
```

它挂在哪三条，逐条对照：

1. `multi-line facts: last row decides…` —— `AssertionError [ERR_ASSERTION]`，`actual 'build-code'`、`expected 'review'`：B 返回首条，需求要末条。
2. `empty facts file must raise…` —— `Missing expected rejection (isExplicitError)`：B 静默返回默认阶段，需求要报错。
3. `last row without stage must raise…` —— `Missing expected rejection (isExplicitError)`：B 回退到早期行，需求要报错。

原门禁下 B 是 `exit 0`、`1 pass / 0 fail`（`../gate-B.txt`）。两相对照：
**B 的唯一差别是门禁变严，不是源码变了**——两份 run 目录的 `src/stage.mjs` 与交付逐字节相同（sha256 见下）。

## 对照：同一目录，换回原门禁（`control-original-gate.txt`，506 字节）

```text
=== A: node --test gate-orig/stage.test.mjs (原门禁，同一 run 目录) ===
ℹ tests 1
ℹ pass 1
ℹ fail 0
exit_code=0
=== B: node --test gate-orig/stage.test.mjs (原门禁，同一 run 目录) ===
ℹ tests 1
ℹ pass 1
ℹ fail 0
exit_code=0
```

这一条不是新证据，只是把「差别在门禁」这件事钉在同一批字节上：
同两个目录、同一份 src，原门禁双双绿，扩展门禁 A 绿 B 红。

## 结论

- **P1 行第三件成立**：该行的门禁现在含决定性输入与负例，A 过（`exit 0`，4/4）、B 拒（`exit 1`，3 条失败）。
- **这不是新造一条旁路**：跑的仍是该行声明的同一条门禁命令 `node --test gate/stage.test.mjs`，只是测试文件从 1 条扩到 4 条。
- **范围**：只证 `stageFor(file)` 这一行的门禁能拒绝 B。它不证其它 Phase 行，也不证整条 `AC-EFFECT-001`。
  判定原件（`../judge-verdict.md`）与消费原件（`../consumer-record.md`）是另外两件，三件合起来才让 P1 行记 `available`。

## 字节与 sha256

| 文件 | 字节 | sha256 |
| --- | ---: | --- |
| `stage.test.mjs`（扩展门禁） | 2160 | `8c084217e6bce876f51026855af2e0f957963e134420978501faadddaec1754b` |
| `run-A.txt` | 430 | `252f836356e2d94ece82fd56d48b54d7d0d3b7e834ea237c61940500036dd48b` |
| `run-B.txt` | 2305 | `b23569d5fc8340368fb58d7fa3d10912f6dcf53ee586704d9eed324bdb495da4` |
| `control-original-gate.txt` | 506 | `18385c2d226272405f641573105d8baec2d1065b93b86220e2a53b14d6b4f7ff` |
| `run.sh` | 541 | `b566086c8638e96f14fd9026ae1a3d7b0a30fa1dd6057f1be92a7b6b90da115b` |

跑之前核过：run 目录里的输入与交付原件逐字节相同。

| 输入 | 交付与 run 目录的 sha256（两处相同） |
| --- | --- |
| A `src/stage.mjs` = `../delivery-A-stage.mjs` | `28b3ff4b80ef19e35fb52ff1d814711e7de9350085f9825cf0bb9d9c9da99e15` |
| B `src/stage.mjs` = `../delivery-B-stage.mjs` | `2477d90b715008fb536efbc0f61371dc5a06149e33fc84b2040acb6fef8777e8` |
| `fixtures/a.jsonl` = `../fixture-a.jsonl` | `43e3b364003082b4d040a32453fa894ac169e1c1c68c70d7980178c252b7d1aa` |
| `fixtures/b.jsonl` = `../fixture-b.jsonl` | `da9aa1fb6dc0f2d7fb079e5e85f97bf72b8444cdf2bfb586f345a42184c937ae` |
| `fixtures/c.jsonl` = `../fixture-c.jsonl` | `7d729ca67f3b47c505e649b3a5168b64a8e9b60b78bf2b03fdb73983603bd0aa` |

## 限制

- 合成试点，不是生产 Phase；输入由测试现造，不是真实任务事实文件。
- 只证 `stageFor(file)` 一行；其余 11 个 Phase 行仍 `incomplete`。
- 原门禁与两份交付的旧记录（含 B 的 `exit 0`）保留不改，作为「门禁弱在哪」的失败原件。
- 不主张这次扩展能覆盖所有错法；它只覆盖需求里那三句可判的话，加上原有单行样本。
