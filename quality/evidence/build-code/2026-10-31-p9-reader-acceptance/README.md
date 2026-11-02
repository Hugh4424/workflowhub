# P9 读者验收原件（2026-10-31）

本目录保存 P9 验收重设计后的新原件：独立读者的三问原答、读者指令与收口记录。
被读的既有材料按路径与 sha256 引用，不复制、不重造。

## 复用的既有原件

| 原件 | 字节 | sha256 | 用途 |
| --- | ---: | --- | --- |
| `quality/evidence/build-code/2026-10-31-p12-writeside-experiment/phase-fragment.md` | 18811 | `a5ab881f4d163b60a7c34bfbe621291dcba2b9782f72d649060624b3c0024afa` | 新作者写的验收节，一条标准加七槽 |
| `quality/evidence/build-code/2026-10-31-p12-writeside-experiment/spec-fragment.md` | 20380 | `40e8748baad0cf3e6bac4cd3281dc1cea1a5464fe906b4e68d83ff456bb762df` | 同一作者的规格片段，作上下文 |
| `quality/evidence/build-code/2026-10-31-p12-writeside-experiment/decision-log-fragment.md` | 12868 | `92cf57331005b31613378dd1a8f856c02f0f261055edcd96a9c223b616292a6c` | 原始需求与实验来源 |
| `quality/evidence/build-code/2026-10-31-p12-blind-judgment/consumer-record.md` | 7062 | `eb0e8e651d0d4d2ce6d491b3535f6b826325384e849c131c54501ac830b15689` | 消费者一次使用，未向作者提问 |
| `quality/evidence/build-code/2026-10-31-p12-blind-judgment/pilot-requirement.md` | 626 | `156b20d7cb8afb8348c556a90b5af9b6851fb2459436b901caa548085641c4f4` | 原始需求 R-001 与 R-PILOT-001 逐字 |
| `quality/evidence/build-code/2026-10-31-p12-blind-judgment/judge-verdict.md` | 10436 | `bba46970fb66a26993ad539fbc9d63a4e71dae50bc1241ccfa79b3983e2e7a21` | 盲判原件，作次要对照 |

## 本次新原件

| 文件 | 说明 |
| --- | --- |
| `reader-instruction.md` | 派给独立读者的原文 |
| `reader-verdict.md` | 第一位独立读者的三问原答 |
| `reader-verdict-2.md` | 第二位独立读者的三问原答 |
| `closeout.json` | 三条结论、档位与缺口 |
| `run-checks.stdout.txt` | 主仓校验器整集的完整输出 |
| `run-checks.stderr.txt` | 主仓校验器的错误输出 |
| `run-checks.exit` | 主仓校验器的真实退出码 |
| `p9-gate-worktree.txt` / `.exit` | 工作树十条门禁的真实输出与退出码（3 红、100 绿） |

## 主仓校验器

命令：

```sh
node /Users/Hugh/Hugh/Project/workflowhub/tools/cli/run-checks.mjs \
  --material-root /Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c07-real-page-verification-20261028/specs/workflowhub-ui-frontend-c07-real-page-verification-20261028
```

退出码 0；关键两行：`[run-checks][material] PASS ... phase_count=12 task_count=36 errors=0`、
`ALL CHECKS PASSED`。原始输出与退出码见本目录 `run-checks.*`。

## 三条结论

两位独立读者各判一次；第 1 位读者 `reader-verdict.md`，第 2 位 `reader-verdict-2.md`。

1. **照着能做事：不能（按较严记）。**
   第 1 位：门禁命令与 A/B 路径未提供，下一步落不了地。
   第 2 位：方法层能说清，但命令与路径 unknown。
   按较严的记不能；分歧保留。
2. **不用回头问作者：能（旁证）。**
   `consumer-record.md` 写明消费者按场景用一次、没向作者提问；
   它用的是代码交付，不是验收节，只作这一条旁证。
3. **不用自己裁断：有。**
   两读者都指「判定器」清单漏项；第 2 位另指「A/B 原件用后删除却又要保留」
   与「判定者只读验收与原需，却要答门禁为何区分不了」。

## 档位与理由

`incomplete`。第一条不过、第三条有三处未裁断矛盾；第二条只作旁证。
缺的是：真实 task-id、试点 Phase 文件与门禁命令；
以及「判定器」清单、原件保全、判定者读门禁输出三处裁断。
下次由原作者或主会话派的材料作者补，约一小时；补齐后用同一三问重读。
只有拿不到人、材料或原件才记 `unavailable`；本轮人和原件都在，所以不记。

## 限制

- 消费者记录来自同一实验的代码交付，只证「没回头问作者」，不证验收节可读。
- 作者片段有污染：作者读过整份写作技能与仓库规则，不是无背景陌生人；按污染记。
- 若两位读者结论不一致，按较严的记并写分歧，不挑对自己有利的一份。
- 本目录不证明其它 Phase、页面验收或长期稳定性，也不外推到「每个 Phase」。
- 本目录是逐件原件，不是目录快照；被复用原件不复制。
