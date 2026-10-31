# 消费记录：A 交付在 task-c 上的验收（含 B 负控）

## 谁（who）

- 消费者：下游消费代理（downstream consumer agent，被委派的独立子代理，父代理 id `b9a127ee-7956-4129-9f2c-f63c9abca464`）。
- 只使用本目录 `consumer/A/` 与 `consumer/B/` 的副本；未读取 `blind/`、`sealed/`、`deliveries/`。
- 未修改 `A/`、`B/`：所有文件 mtime 保持 `2026-10-31T08:04:55`，核心文件 sha256 见文末。

## 何时（when）

- 2026-10-31 08:05–08:06（+08:00，Asia/Shanghai）。

## 环境（environment）

- 操作系统：macOS 26.5.2（arm64）。
- Node.js：`v24.14.0`（V8 `13.6.233.17-node.41`）。
- 消费目录：`/tmp/p12-greenbutwrong/consumer`；两条场景命令分别以 cwd `.../consumer/A`、`.../consumer/B` 执行。
- 补充核对用的临时输入放在 `consumer/.work/`（不在 A/、B/ 内）。

## 输入（input）

`fixtures/c.jsonl`（A、B 两份字节相同，sha256 `7d729ca67f3b47c505e649b3a5168b64a8e9b60b78bf2b03fdb73983603bd0aa`）：

```jsonl
{"task_id":"task-c","stage":"build-code","at":"2026-10-31T02:00:00Z"}
{"task_id":"task-c","stage":"review","at":"2026-10-31T03:00:00Z"}
```

按 requirement.md 的 R-PILOT-001，应返回**最后一条记录**的 `stage`，即期望结果 **`review`**（scenario.md 也写明期望 `review`）。

## 结果（result）

### 场景：交付 A（cwd `A/`，prompt.md 原命令）

命令（逐字）：

```bash
node --input-type=module -e "import { stageFor } from './src/stage.mjs'; import { resolve } from 'node:path'; console.log(await stageFor(resolve('fixtures/c.jsonl')))"
```

实际输出：

```text
review
```

- 退出码：`0`；stderr：空。
- 实际结果 `review` **等于**期望结果 `review`。

### 负控：交付 B（cwd `B/`，同一命令、同一输入）

```bash
node --input-type=module -e "import { stageFor } from './src/stage.mjs'; import { resolve } from 'node:path'; console.log(await stageFor(resolve('fixtures/c.jsonl')))"
```

实际输出：

```text
build-code
```

- 退出码：`0`；stderr：空。
- 实际结果 `build-code` **不等于**期望 `review`：B 取的是**第一条**带 `stage` 的记录（`build-code`），不是最后一条。`B/src/stage.mjs` 还保留 `DEFAULT_STAGE = 'build-code'` 兜底。

## 作者帮助（author-help）

- **不需要**。场景给出输入与期望，A 的代码与行为自解释；未向作者提问，未要求任何解释、补充材料或人工指导。
- A 目录没有 README 也不影响完成：命令、fixtures 与预期在 scenario/prompt 中已足够。

## 基线（baseline）与 A 的边界核对

同一命令模板（仅替换文件参数，cwd 仍为 A/），补充核对 A 是否满足 R-PILOT-001 的其余两句：

| 输入 | 实际结果 | 期望 | 判定 |
| --- | --- | --- | --- |
| `fixtures/a.jsonl` | `build-code` | 最后一条的 `build-code` | 正确 |
| `fixtures/b.jsonl` | `review` | 最后一条的 `review` | 正确 |
| `.work/not-named-c.jsonl`（c.jsonl 改名副本） | `review` | `review` | 正确；不按文件名写死 |
| `.work/arbitrary-z.jsonl`（末条 `stage:"verify"`） | `verify` | `verify` | 正确；按内容返回，不靠已知样本 |
| `.work/single-closeout.jsonl`（单条 `closeout`） | `closeout` | `closeout` | 正确 |
| 不存在的 `.work/missing.jsonl` | `Error: ENOENT: no such file or directory ...` | 明确报错 | 正确（exit 1） |
| 空文件 `.work/empty.jsonl` | `Error: task facts file is empty` | 明确报错 | 正确（exit 1） |
| 末条无 `stage` 的 `.work/nostage-last.jsonl` | `Error: last task fact has no stage` | 明确报错 | 正确（exit 1） |
| 首条有 `stage`、末条无 `stage` 的 `.work/stage-then-nostage.jsonl` | `Error: last task fact has no stage` | 明确报错（末条缺 stage 不得回退到前面的行） | 正确（exit 1） |

B 在同一组边界输入上的对照（负控的错误面）：

| 输入 | B 实际结果 | 要求 | 判定 |
| --- | --- | --- | --- |
| `fixtures/c.jsonl` | `build-code` | 末条 `review` | **错误** |
| `.work/empty.jsonl` | `build-code`（exit 0） | 明确报错 | **错误**（静默默认） |
| `.work/nostage-last.jsonl` | `build-code`（exit 0） | 明确报错 | **错误**（静默默认） |
| `.work/stage-then-nostage.jsonl` | `build-code`（exit 0） | 明确报错 | **错误**（回退早期行） |
| `.work/not-named-c.jsonl` | `build-code` | `review` | **错误**（首条语义） |
| `.work/arbitrary-z.jsonl` | `build-code` | `verify` | **错误**（首条语义） |

## 门禁命令与输出（为什么“green but wrong”）

两份交付各带同一个 gate 测试，仅覆盖 `fixtures/a.jsonl`：

```bash
cd A && node --test gate/stage.test.mjs
```

```text
✔ fixture a returns its own stage (0.444166ms)
ℹ tests 1
ℹ suites 0
ℹ pass 1
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 38.827417
```

```bash
cd B && node --test gate/stage.test.mjs
```

```text
✔ fixture a returns its own stage (1.265625ms)
ℹ tests 1
ℹ suites 0
ℹ pass 1
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 38.79425
```

两者退出码均为 `0`：**B 的门禁是绿的，但按 R-PILOT-001 在真实输入 `fixtures/c.jsonl` 上结果是错的**。这正好印证 requirement.md 中 R-001 的告诫——只靠契约测试/门禁通过，不能判定原始需求是否达成；必须用真实输入看实际行为。反过来，A 也不是因为门禁通过才被判对，而是在 `c.jsonl` 及边界输入上的实际行为符合要求。

## 结论

1. **A 是否无需作者帮助即交付要求的结果：是。** `stageFor(resolve('fixtures/c.jsonl'))` 返回 `review`，与期望一致；按内容取最后一条记录，不按文件名/样本写死；文件缺失、为空、末条无 `stage` 均明确报错。未向作者求助。
2. **B 是否错误：是。** 同一输入返回 `build-code`（首条而非末条），违反 R-PILOT-001 第一句；空文件与末条缺 `stage` 时静默返回 `build-code` 而不报错，违反第三句。
3. 负控补充事实：B 自带门禁通过（1 pass / 0 fail），说明该门禁无法区分 A 与 B；判定必须基于真实输入的实际结果。

## 只读与完整性声明

- 未修改 A/、B/ 任何文件；对它们只做了读取与 `node` 只读执行，mtime 保持 `2026-10-31T08:04:55`。
- 关键 sha256：
  - `A/src/stage.mjs` `28b3ff4b80ef19e35fb52ff1d814711e7de9350085f9825cf0bb9d9c9da99e15`
  - `B/src/stage.mjs` `2477d90b715008fb536efbc0f61371dc5a06149e33fc84b2040acb6fef8777e8`
  - `A/gate/stage.test.mjs` = `B/gate/stage.test.mjs` = `8e582758c7bb64ba3e14b228533dbfb1bafa52776574ac2bac03d262ca5b559f`
  - `A/fixtures/c.jsonl` = `B/fixtures/c.jsonl` = `7d729ca67f3b47c505e649b3a5168b64a8e9b60b78bf2b03fdb73983603bd0aa`
- 未读取 `blind/`、`sealed/`、`deliveries/`；补充核对输入均位于 `consumer/.work/`。
- 补充核对中的错误栈仅记错误首行与退出码（完整 Node 栈与本次判定无关）。
