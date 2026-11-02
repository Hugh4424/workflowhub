# P12 盲判：绿而错交付与作者标准（2026-10-31）

## 六项固定开头

1. **任务**：P12 验收第二步——按作者写出的 `AC-EFFECT-001`，判一个通过全部门禁、测试、断言与回归但实质错误的交付该不该被拒绝。
2. **结论与状态**：**P1 行的效果判定 = available；整条 AC-EFFECT-001 = incomplete。** 独立盲判正确地把 X（=B）标为绿而错、Y（=A）标为真实，理由落到 `fixture-c.jsonl` 的用户可观察差异；B 的同一门禁 `exit 0`。消费者代理用 A 得 `review`、不需作者解释；B 负控得 `build-code`。标准在这一行识别出了 B；整条 AC 仍缺其余 Phase 行、真实下游 owner、真实环境/隔离 worktree。
3. **已做与未做**：已读作者标准与原始需求（未读作者方案/自评）；已做 A、B；已跑真实门禁两件均 `exit 0`；已随机编号、封存、独立盲判、拆封、消费者使用一次。未做：真实生产 Phase、真实下游 owner、Git worktree（任务禁止 Git 写，用隔离目录）、其余 Phase 行。
4. **产物或原件引用**：本目录（`quality/evidence/build-code/2026-10-31-p12-blind-judgment/`）；实验原件 `/tmp/p12-greenbutwrong/`；关键原件与 sha256 见第 6 节及 `verdict.md`。
5. **失败与限制**：试点是合成最小 Phase；消费者是独立子代理不是真实 owner；环境是 `/tmp`；作者标准本身缺真实试点与消费者；盲包漏了 `requirement.md`，判定者读包外同字节需求（无标签）。详见 `verdict.md` 第 9 节。
6. **下一消费者动作**：接受「P1 行判定层 available、整条 AC incomplete」；按 `verdict.md` 第 7 节改标准（消费者跑 A/B、判定者强制跑门禁未见输入与负例、门禁覆盖末条/空/报错、真实 owner/环境、盲包 manifest），补其余 Phase 行；第三步另一读者接「接手一节」。

## 来源

- 作者标准：`quality/evidence/build-code/2026-10-31-p12-writeside-experiment/spec-fragment.md`，sha256 `40e8748baad0cf3e6bac4cd3281dc1cea1a5464fe906b4e68d83ff456bb762df`；`phase-fragment.md`，sha256 `a5ab881f4d163b60a7c34bfbe621291dcba2b9782f72d649060624b3c0024afa`。
- 原始需求：同目录 `decision-log-fragment.md`（sha256 `92cf57331005b31613378dd1a8f856c02f0f261055edcd96a9c223b616292a6c`）的「原始需求」节；用户原话见该节。
- 本实验只读上述标准与原始需求；未读作者 `self-assessment.md` 与方案结论。
- 本目录保存 `/tmp/p12-greenbutwrong/` 的关键原件副本，逐件是真实事实原件，不是整树/整目录快照。

## 作者标准（判据、判定者、观察方式、证据要求）

**判据**：每个 Phase 一行；独立判定者只读该 Phase 的验收和原始需求，在不知道两份交付标签时正确认出真实交付与绿而错变体，并说出用户可观察差异；绿而错变体必须通过该 Phase 已列的全部契约测试、门禁命令、判定器、断言和回归；真实下游消费者在真实场景与数据中完成一次使用，得到该 Phase 的原始需求要求的结果，且不需要作者解释；改既有行为要有改动前基线；两层都过才算该行通过，全部行通过才算本条通过。

**判定者**：独立子代理或独立 provider，上下文与作者、实现者不同；消费者是真实下游 owner，不是作者、实现者或判定者；红队造 B，第三方编号与拆封。

**观察方式**：盲包（A/B 标签隐藏）+ 该 Phase 验收 + 原始需求给判定者；判定者先写「用户应看到什么」「哪类错必须被拒绝」，再标 A/B 并写理由；消费者按场景用一次；拆封记录证明判前不知道标签。

**证据要求**：每 Phase 的判定答卷、两份交付路径与 sha256、红队构造说明、全部门禁原始输出、拆封记录、消费者观察记录（谁/何时/环境/输入/结果/基线），各留原件；失败原件保留。

逐字全文见 `author-standard-extract.md`（从上述两文件逐字抽取，sha256 `222997064be7f5aed916ef37669bb035fe38e8e12daa39f7280936ad43d5d96f`）。

## 绿而错交付

- 试点需求 `R-PILOT-001`（`pilot-requirement.md`）：`stageFor(file)` 返回 JSONL **最后一条记录**的 `stage`；任意任务文件按自己内容返回；缺失、为空或最后一条无 `stage` 必须明确报错，不得静默默认。
- A 正确：`delivery-A-stage.mjs`（读末条、非空、空/末条无 stage 抛错）。
- B 绿而错：`delivery-B-stage.mjs`（返回**第一条**有 stage 的行；无 stage 时静默返回 `DEFAULT_STAGE='build-code'`）。
- 门禁命令与真实输出：
  - `cd /tmp/p12-greenbutwrong/deliveries/A && node --test gate/stage.test.mjs` → `exit 0`，`1 pass / 0 fail`（`gate-A.txt`）。
  - `cd /tmp/p12-greenbutwrong/deliveries/B && node --test gate/stage.test.mjs` → `exit 0`，`1 pass / 0 fail`（`gate-B.txt`）。
- 为什么错：门禁只用单行 `fixture-a.jsonl`（首行=末行），从不测多行/空/末条无 stage。`fixture-c.jsonl` 末条 `review`，A 返回 `review`，B 返回 `build-code`；空文件 B 返回 `build-code` 而需求要求报错；首条有 stage、末条无 stage 时 B 回退早期行而不报错。
- 红队独立构造 B：只拿需求、门禁测试与 fixtures，不读标准/A；见 `red-team-note.md`。

## 盲判与消费者

- 标签随机：**X = B（绿而错），Y = A（正确）**；映射 `label-mapping.json`，生成于 2026-10-31T00:04:38.686Z，早于判定；拆封 `unseal.log` / `unsealed.md`。
- 判定者：独立子代理，只读 `blind/` 内标准、需求、X/Y、门禁输出；未读 `sealed/`、`deliveries/`、`consumer/`；未获作者解释。判定原件 `judge-verdict.md`：X = green-but-wrong，Y = real；用户可观察差异为 `fixture-c.jsonl`（X `build-code`，Y `review`）、空文件（X 默认，Y 抛错）、末条无 stage（X 回退，Y 抛错）；门禁单行让首行/末行/默认三种规则都返回 `build-code`，故两者都 `exit 0`。
- 包装缺陷：判定时 `blind/requirement.md` 缺失；判定者从 `../pilot/requirement.md` 读逐字需求（只含 R-PILOT-001 与 R-001，无标签、无红队说明）；判定后已补 `blind/requirement.md`，与 `pilot-requirement.md` 同字节（sha256 `156b20d7...`）。不影响标签盲性，但记入限制。
- 消费者：独立子代理，cwd `consumer/A`，输入 `fixtures/c.jsonl`，命令 `node --input-type=module -e "import { stageFor } from './src/stage.mjs'; import { resolve } from 'node:path'; console.log(await stageFor(resolve('fixtures/c.jsonl')))"` → A `review`（=期望，`exit 0`，不需作者）；B 负控同输入 `build-code`（错）。记录 `consumer-record.md`。

## 逐条对照（摘要）

| 标准判据 | 实验事实 | 判定 |
| --- | --- | --- |
| 独立判定者、上下文不同 | 判定/红队/消费者三个独立子代理 | 满足（代理级） |
| 判前不知道标签 | X/Y 随机、映射封存；判定者未读 `sealed/`、`deliveries/` | 满足；有包装缺陷 |
| 正确标出真实/绿而错 | X=B、Y=A，与映射一致 | 通过 |
| 说出用户可观察差异 | `fixture-c.jsonl`、空文件、末条无 stage 的具体差异 | 通过 |
| 绿而错通过该 Phase 全部门禁 | A、B 均 `exit 0`；门禁只测单行 | 控制有效但门禁弱 |
| 消费者真实场景用一次、不需作者 | A 得 `review`；B 负控 `build-code` | 通过（代理级） |
| 改既有行为有基线 | 新增交付，无既有行为 | N/A（附理由） |
| 全部 Phase 行 | 只测 P1 试点一行 | 整条 AC incomplete |

完整对照与限制见 `verdict.md` 第 6、7、9 节。

## 结论

- **识别结果**：作者标准在这一行**成功识别**了绿而错 B——判定者独立、标签未知、理由是对 `fixture-c.jsonl` 的用户可观察差异（B `build-code` vs A `review`），并说明单行门禁为何区分不了；B 的门禁确实 `exit 0`。消费者代理用 A 得到 `review`，不需作者解释。**P1 行的效果判定 = available。**
- **但整条 AC-EFFECT-001 = incomplete**：只测 P1 一行；真实下游 owner、真实环境/数据、隔离 worktree 未满足；作者自己的 P1 行仍 `unavailable — 试点 Phase 未选定`。这一行通过不等于整条 AC 通过。
- **标准的主要不足**（详见 `verdict.md` 第 7 节）：① 消费者层只使用 A，不检验 B，B 的错只有判定者看；② 判定者的「只读」不强制跑门禁未见输入/负例；③「全部门禁」只是该 Phase 已列的弱门禁，没有要求覆盖末条/空/报错；④ 真实 owner/环境/worktree 没有可操作的代理条件；⑤ 红队/第三方/盲包是程序性要求，盲包漏文件说明缺 manifest 核对；⑥ 标准是 meta 标准，实质 oracle 来自 Phase 原始需求；⑦ 单 B/单消费者场景的覆盖上限，不能由一行推出「每个 Phase」。
- **建议改法**：消费者在同一场景跑 A 与 B 并拒绝 B；判定者必须跑门禁未见输入 + 负例并记录命令/输出；门禁必须含决定性输入与负例，把「控制有效」定义为「门禁能拒绝故意错误的变体」；明确最小实验可用的真实 owner/环境代理，或要求真实试点；红队独立于 AC、第三方编号/拆封、盲包附 manifest+哈希；AC 明确为 meta 标准或要求 Phase 验收写出精确用户可观察结果/数据/失败反例；保留 `incomplete` 逐 Phase 补行。

## 关键原件与 sha256

| 文件 | 字节 | sha256 |
| --- | ---: | --- |
| `author-standard-extract.md` | 11005 | `222997064be7f5aed916ef37669bb035fe38e8e12daa39f7280936ad43d5d96f` |
| `judge-verdict.md` | 10436 | `bba46970fb66a26993ad539fbc9d63a4e71dae50bc1241ccfa79b3983e2e7a21` |
| `consumer-record.md` | 7062 | `eb0e8e651d0d4d2ce6d491b3535f6b826325384e849c131c54501ac830b15689` |
| `delivery-A-stage.mjs` | 464 | `28b3ff4b80ef19e35fb52ff1d814711e7de9350085f9825cf0bb9d9c9da99e15` |
| `delivery-B-stage.mjs` | 1304 | `2477d90b715008fb536efbc0f61371dc5a06149e33fc84b2040acb6fef8777e8` |
| `gate-A.txt` | 175 | `c608492f89c4558a82c42980b13ed22fae3d4dff2ef19079d9e033f7068ac326` |
| `gate-B.txt` | 176 | `4d228f48ad5d80a2afd7f473d0bd01a153de0adf1a37ced962c83ea76db8eb52` |
| `red-team-note.md` | 4275 | `ad9f498d301865a0fbc26965a105472170eaa4dab37d0fa2288c030dd09e3fbd` |
| `label-mapping.json` | 450 | `e4f23c4616313af7e2f840718b6d2bb2c5ca9bc9b3f712a85ffc795eba611f32` |
| `unseal.log` | 542 | `ca01f05962ac7470be4b9c17202c744e6b1d1c39dc4b0b8bc61e227334b3bf85` |
| `unsealed.md` | 985 | `c4df920e1669fe662e88ed5d5546a395af60ac284c6e7c5595683aa1e2ecb280` |
| `pilot-requirement.md` | 626 | `156b20d7cb8afb8348c556a90b5af9b6851fb2459436b901caa548085641c4f4` |
| `fixture-c.jsonl` | 136 | `7d729ca67f3b47c505e649b3a5168b64a8e9b60b78bf2b03fdb73983603bd0aa` |
| `gate-stage.test.mjs` | 281 | `8e582758c7bb64ba3e14b228533dbfb1bafa52776574ac2bac03d262ca5b559f` |
| `verdict.md` | 14468 | `c4be0cb6954c3b7e91c367caaa7821c7e7f1b36c28d1f004e937907b93186004` |

原始件在 `/tmp/p12-greenbutwrong/`；本目录是逐件副本，不是整树/整目录快照。作者标准原件 sha256 见「来源」。

## 限制

- 合成试点、子代理消费者、`/tmp` 环境、目录副本（非 Git worktree）：这些使整条 AC 的「真实」条件未满足；本文只把判定层记为 available，整条 AC 保持 incomplete。
- 盲包漏 `requirement.md`；判定者读包外同字节需求，未读标签；不影响本次标签盲性，但说明缺 manifest 核对。
- 本文只判 P1 一行；其余 Phase 行与整条 AC 仍 incomplete。
