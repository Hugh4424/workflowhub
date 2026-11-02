# 判定：P1 行的效果判定 available，整条 AC-EFFECT-001 仍 incomplete

2026-10-31，P12 验收第二步。独立判定者读作者标准与原始需求后，判一个「门禁全绿、实质错误」的交付。

## 1. 结论

- **作者标准在这一行识别出了绿而错交付**：独立盲判把 B 标为绿而错、A 标为真实，理由落到具体输入与用户可观察结果，并说明门禁为什么区分不了。B 的同一门禁确实 `exit 0`。
- **P1 行的「效果判定」= available**：证据指向 `judge-verdict.md`（盲判）与 `consumer-record.md`（消费者代理用 A 得结果）。
- **整条 AC-EFFECT-001 = incomplete**：只测了 P1 一行；其余 Phase 行、真实下游 owner、真实环境与隔离 worktree 未满足；作者自己的 P1 行仍是 `unavailable — 试点 Phase 未选定`。这一行通过不等于整条 AC 通过。
- **标准仍有覆盖缺口**：消费者层只使用 A、不检验 B；判定者的「只读」不强制跑门禁未见输入；「全部门禁」只是该 Phase 已列的弱门禁；真实 owner/环境/角色是程序性要求；标准本身是 meta 标准，实质 oracle 来自原始需求。见第 7 节。

## 2. 作者标准（逐字）

来自 `spec-fragment.md` 的 AC-EFFECT-001：

> - [ ] **AC-EFFECT-001**：本任务每个 Phase 的验收都能判出效果。
>   每个 Phase 一行：独立判定者只读该 Phase 的验收和原始需求，
>   在不知道两份交付标签时正确认出真实交付与绿而错变体，并说出用户可观察差异；
>   绿而错变体必须通过该 Phase 已列的全部契约测试、门禁命令、判定器、断言和回归。
>   该 Phase 的真实下游消费者要在真实场景与数据中完成一次使用，得到该 Phase 的原始需求要求的结果，
>   且不需要作者解释；若该 Phase 改变既有行为，要记录改动前基线。
>   两层都过才算该行通过；全部行通过才算本条通过；缺行或任一行判不出效果即失败。
>   关联 FR-EFFECT-001。
>
> 验证：判定者是独立子代理或独立 provider，上下文与作者、实现者都不同。
>   消费者是该 Phase 的真实下游 owner，不是作者、实现者或判定者。
>   具体名字未提供，owner=主会话派发时填；在实现完成、审查问题修完后判。
>   环境为该 Phase 的真实环境与真实数据，版本/提交号未提供（unknown，owner=build-plan）。
>   两份交付各放隔离 worktree，真实原件与失败保留。

来自 `phase-fragment.md` 的「这一 Phase 怎么验收？」：

> 在试点 Phase 上，独立判定者只读验收和原始需求，就能拒绝绿而错、接受做对；真实下游消费者用一次，得到该 Phase 的原始需求要求的结果。
> **判据**：判定者在不知道两份交付标签时正确标出真实交付与绿而错变体，并说出用户可观察差异；绿而错变体必须通过该 Phase 已列的全部契约测试、门禁命令、判定器、断言和回归；消费者在真实场景与数据中得到要求的结果，且不需要作者解释；若改既有行为，有改动前基线。
> **成功信号**：两份都判对，理由具体；控制有效；消费者完成且不求助作者；拆封记录证明判前不知道标签。
> **失败信号**：判错、全收或全拒；理由只写「测试通过」「字段齐全」「退出码 0」；需要作者解释；绿而错变体过不了门禁；判前知道标签；消费者是作者/实现者或只复述命令；缺基线。

**判据、判定者、观察方式、证据要求**（逐项）：

- **判据**：盲判两份都判对；理由引用用户可观察差异；绿而错通过该 Phase 已列全部门禁；消费者真实场景得结果且不求助作者；改既有行为有基线；全部 Phase 行齐。
- **判定者**：独立子代理或独立 provider，上下文与作者、实现者不同；消费者是真实下游 owner；红队造 B、第三方编号拆封。
- **观察方式**：盲包给 A/B（标签隐藏）、该 Phase 验收、原始需求；判定者先写「用户应看到什么」「哪类错必须被拒绝」，再标 A/B；消费者按场景用一次；拆封记录证明判前不知道标签。
- **证据要求**：每 Phase 的判定答卷、两份交付路径与 sha256、红队构造说明、全部门禁原始输出、拆封记录、消费者观察记录（谁/何时/环境/输入/结果/基线），各留原件；失败原件保留。

## 3. 绿而错交付

试点需求 `R-PILOT-001`（`pilot-requirement.md`）：`stageFor(file)` 必须返回 JSONL **最后一条记录**的 `stage`；任意任务文件按自己内容返回；文件缺失、为空或最后一条没有 `stage` 必须明确报错，不得静默返回默认阶段。

- **A 正确**：`delivery-A-stage.mjs`，读最后一行、要求非空 `stage`、空/末条无 stage 抛错。
- **B 绿而错**：`delivery-B-stage.mjs`，返回**第一条**有 stage 的行；没有 stage 时静默返回 `DEFAULT_STAGE='build-code'`。
- **门禁命令与真实输出**：
  - `cd /tmp/p12-greenbutwrong/deliveries/A && node --test gate/stage.test.mjs` → `exit 0`，`1 pass / 0 fail`（`gate-A.txt`）。
  - `cd /tmp/p12-greenbutwrong/deliveries/B && node --test gate/stage.test.mjs` → `exit 0`，`1 pass / 0 fail`（`gate-B.txt`）。
- **为什么错**：门禁只用单行 `fixture-a.jsonl`（首行=末行），从未测多行、空文件或末行无 `stage`。真实多行 `fixture-c.jsonl` 末行 `review`，A 返回 `review`，B 返回 `build-code`；空文件 B 返回 `build-code` 而需求要求报错；首条有 stage、末条无 stage 时 B 回退早期行而不报错。
- **红队独立**：红队只拿需求、门禁测试与 fixtures，不读标准/A；`red-team-note.md` 记录构造与原始输出。

## 4. 盲判

- 标签由 `label.mjs` 随机生成并封存：**X = B（绿而错），Y = A（正确）**；映射 `label-mapping.json` 生成于 2026-10-31T00:04:38.686Z，早于判定。
- 判定者：独立子代理，单独上下文；只读 `blind/` 内的标准、需求、X/Y、门禁输出；未读 `sealed/`、`deliveries/`、`consumer/`；未获作者解释。
- 判定原件 `judge-verdict.md`：**X = green-but-wrong，Y = real**；用户可观察差异为 `fixture-c.jsonl`（X `build-code`，Y `review`）、空文件（X `build-code`，Y 抛错）、末条无 stage（X 回退，Y 抛错）；门禁只用单行 `a`，首行/末行/默认三种规则都返回 `build-code`，所以两者都 `exit 0`。
- 拆封：`unseal.log` / `unsealed.md`；判定者标签与映射一致。
- **包装缺陷**：判定时 `blind/requirement.md` 缺失，判定者从 `../pilot/requirement.md` 读取逐字需求；该文件只含 R-PILOT-001 与 R-001，无标签、无红队说明。判定后已补 `blind/requirement.md`（与 `pilot-requirement.md` 同字节 sha256 `156b20d7...`）。不影响标签盲性，但记入限制。

## 5. 消费者

`consumer-record.md`：独立下游消费代理，cwd `consumer/A`，输入 `fixtures/c.jsonl`（两条记录，末条 `review`），命令

```bash
node --input-type=module -e "import { stageFor } from './src/stage.mjs'; import { resolve } from 'node:path'; console.log(await stageFor(resolve('fixtures/c.jsonl')))"
```

- A 实际输出 `review`，等于期望；`exit 0`；不需要作者解释；未向作者提问。
- B 负控同一输入输出 `build-code`，违反 R-PILOT-001 的末条规则；空文件/末条无 stage 时静默返回 `build-code` 而不报错。
- A、B 自带门禁均 `1 pass / 0 fail`、`exit 0`：再次证明门禁不能判效果。

## 6. 逐条对照

| 标准判据 | 实验事实 | 判定 |
| --- | --- | --- |
| 独立判定者，上下文与作者/实现者不同 | 判定者、红队、消费者为三个独立子代理 | 满足（代理级） |
| 判前不知道标签 | X/Y 随机；映射封存；判定者未读 `sealed/`、`deliveries/` | 满足；有包装缺陷（需求文件缺失，读取了无标签的 `pilot/requirement.md`） |
| 正确标出真实交付与绿而错变体 | 判定者 X=B、Y=A，与映射一致 | 通过 |
| 说出用户可观察差异 | `fixture-c.jsonl`：X `build-code`、Y `review`；空/末条无 stage 的差异 | 通过 |
| 绿而错通过该 Phase 已列全部门禁/契约/断言/回归 | A、B 的同一门禁均 `exit 0`、`1 pass/0 fail`；门禁只测单行 | 控制有效（但门禁弱） |
| 消费者真实场景用一次，得到结果，不需作者解释 | 消费者代理用 A 得 `review`，不需作者；B 负控得 `build-code` | 通过（代理级；非真实 owner） |
| 改既有行为有基线 | 本试点是新增交付，无既有行为 | N/A（附理由） |
| 全部 Phase 行通过 | 只测 P1 试点一行；其余行未测 | 不通过；整条 AC incomplete |
| 真实环境/真实数据/隔离 worktree | `/tmp` 合成试点、隔离目录副本（任务禁止 Git 写，未建 worktree） | 未满足；限制 |
| 红队只拿需求与门禁、第三方编号拆封 | 红队子代理不读标准/A；标签脚本 + 封存 + 判定后拆封；编排者知道映射 | 角色程序上分离；第三方是脚本，非独立人 |

## 7. 标准哪里不够、建议怎么改

1. **消费者层不检验 B，只有判定者检验 B。** 标准说消费者用真实交付 A 一次；A 的结果不能暴露 B 的错。本实验的 B 负控是额外加的，不在标准原文里。若判定者被 B 骗过，消费者用 A 仍会通过，B 就漏了。建议：消费者在同一场景跑 A 与 B，按原需求拒绝 B；或规定消费者场景必须覆盖红队选定的缺陷。
2. **判定者的「只读」不强制跑门禁未见输入。** B 的错（首条 vs 末条、默认 vs 报错）在单行门禁里不可见；本次判定者靠读代码注释并跑 `c`/空/末条无 stage 才抓到。若判定者只读代码、不跑，或 B 的错误只在运行/数据层，可能放过。建议：判定者必须跑至少一个门禁未见输入和一个负例，记录命令/输出；把「只读」定义为不改文件、允许执行。
3. **「全部门禁」只是该 Phase 已列的弱门禁。** B 通过唯一单行测试，标准就算「绿」。标准没有要求门禁覆盖原需求的决定性条款（末条/空/报错）。建议：门禁必须含决定性输入与负例，或「控制有效」定义为「门禁能拒绝一个故意错误的变体」，而不只是「A 通过」。
4. **真实下游 owner、真实环境、隔离 worktree 没有可操作的替代。** 本次消费者是子代理、环境是 `/tmp`、交付是目录副本；作者自己的 P1 行仍 `unavailable — 试点 Phase 未选定`。标准说这些是必需条件，但没有说明最小实验可用什么代理，也没有说明如何证明「真实」。建议：要么要求真实试点，要么明确代理条件并把 `available` 限定为「判定层可用」，不把整行/整条 AC 记通过。
5. **红队/第三方/盲包是程序性要求，没有强制核对。** 任务让一个代理既造 B 又判，违反「红队不看验收、判定者判前不知道标签」；本实验只能拆成子代理 + 标签脚本，编排者仍知道映射。盲包还漏了 `requirement.md`，判定者读了包外的同字节需求。建议：红队独立于 AC；第三方（不是编排者）编号/拆封；盲包附 manifest + 哈希；判定者不得读包外。
6. **标准是 meta 标准，实质 oracle 来自 Phase 原始需求。** AC-EFFECT-001 本身不写交付应有什么行为；它依赖该 Phase 的验收和原始需求。本次 `R-PILOT-001` 明确（末条/报错），B 才可判；若原需求含糊，判定者仍判不出。建议：要么把 AC-EFFECT-001 明确为 meta 过程标准，要么要求 Phase 验收写出精确的用户可观察结果、输入数据与失败反例。
7. **单 B、单消费者场景的覆盖上限。** 标准自己承认只代表红队想到的一种错法、消费者只代表一个真实场景；本次 P1 行也只是样本。不能由一行/一 B 推出「每个 Phase 都能判效果」。建议：保留 `incomplete`，逐 Phase 补行；不要把 P1 行通过写成整条 AC 通过。

## 8. 证据

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

原始件在 `/tmp/p12-greenbutwrong/`；本目录是逐件副本，不是整树快照。作者标准原件 sha256 见 `README.md`。

## 9. 限制

- 试点是合成最小 Phase（`stageFor`），不是生产 Phase；消费者是独立子代理，不是真实下游 owner；环境是 `/tmp`；交付是目录副本，不是 Git worktree（任务禁止 Git 写）。这些使整条 AC 的「真实」条件未满足，本文只把判定层记为 available。
- 判定者的盲包漏了 `requirement.md`；判定者读包外同字节需求，未读标签；不影响本次标签盲性，但说明标准/流程缺盲包 manifest 核对。
- 本文只判 P1 一行；其余 Phase 行与整条 AC 仍 `incomplete`。
