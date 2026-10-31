# P10 第二步与第三步原件（2026-10-31）

对象：`specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/`。
范围：只做 P10 验收的 ② 改稿收件与 ③ 两卡复验；不改 ① 原件，不跑全量审查，不改第二处。
读者：P10 写主、独立读者、下一次 build-plan 审查。

先写一个会改变判断的事实。

## 一、三条 finding 在本次开工前已被 writer 改过

`quality/evidence/build-code/2026-10-31-c07-findings-repair/report.md`（2026-10-31 00:36）
第 9、11 行记录了同一批 finding 的回修；当前字节已含这些改动：

| 条 | finding | 当前字节证据 | 状态 |
| --- | --- | --- | --- |
| 甲 | P2 回退只测「没装 ego」 | `phases/P2-真实采集与失败语义.md:78-82` 有「正常三（回退·装了没开）」；`:106-109` 用例四布两种输入；`:675-677` 列两个 reason 逐字值 | 已改，本步未再动 |
| 乙 | P4 受控九类未修、跨批回环 | `phases/P4-报告接入与回修闭环.md:288-311` 六条链改成 P4 内检出→最小修源→独立复验、P8 只读重放；`:915` Done 改「本 Phase 当前交付未完成…尚未执行」 | 链与 Done 已改；九类实际仍未跑，属已声明的 incomplete |
| 丙 | P4 依赖只写 P1，漏 P3 | `phases/P4-报告接入与回修闭环.md:908` 依赖为 `P1、P3`；`phases/index.md:24` 与 P4 行依赖列同步 | 已改 |

因此本步没有重改甲、乙、丙已经改过的那几处：P10 ② 原文写「改由该卡写主做，本阶段只派回、
收 diff 与回执，不代改别人的卡」，再改一遍会变成重复改。
例外只有一处：③ 第一轮复验判「原 finding 仍在」后，按失败表「该卡写主、确认同一处再重验」，
由本步持笔补了同一 finding 漏掉的一行（P4:294，见第三节），不是重开甲/乙/丙。

## 二、第二步：选丙，收 writer 的 diff 与回执

选丙的理由：三处里改动最小（机器字段一行）、证据最明确（依赖字段与正文来源同指 P3）、
改完能原地复验（下游 P8 的只读声明不受影响）。甲是多行用例，乙的核心是执行缺口而非措辞。

改稿执行者：2026-10-31 00:22–00:33 的 finding 回修会话（writer），回执见
`2026-10-31-c07-findings-repair/report.md` 第 9 行；本步只收 diff 与字节对照。
改前字节取自 2026-10-30 真实审查实际投递的 `request.json`（`before/`，与包内材料同字节）。

### diff 摘要（只列丙这处）

```diff
-#  P4 机器字段（改前 :903）
-- **依赖**：`P1`；报告形状、四态与身份块先由 P1 落，无更早 Task。
+#  P4 机器字段（改后 :908）
+- **依赖**：`P1、P3`；报告形状、四态与身份块先由 P1 落，受控页来源由 P3 交。
```

```diff
-#  phases/index.md:24
-第四批开 P4（接 P1）。
+第四批开 P4（接 P1、P3）。
-#  phases/index.md:79 P4 行依赖列
-| … | P1 | P5、P8（…） |
+| … | P1、P3 | P5、P8（…） |
```

字节增量：P4 依赖行 +16 B，index 两处合计 +10 B（`P1`→`P1、P3` 各 5 B）。
P4 整体 60,697→61,199 B 的其余增量属同轮回修的其它 finding（六条链、Done 等），不是丙这一处；
61,199→61,205 B 是 ③ 第一轮失败后补的一行（见第三节）。
完整前后对照：`diff/P4-packet-vs-current.diff`、`diff/index.md-packet-vs-current.diff`；
零上下文版 `diff/p4-zero-context.diff`（丙那处为 `@@ -903 +908 @@`）。

### 范围

- ② 的改稿没有材料文件由本步写；`before/` 是从审查请求件里抽出的改前原件，`diff/` 是前后对照。
- 丙的改动在 P4 与 index；P8 的同步属乙那一半（只读重放），本步只核它没有改口。
- 未动 spec、decision-log、其它 Phase、验收判据。唯一由本步写的一行见第三节。

## 三、第三步：两张卡复验

### 投了什么

| 项 | 值 |
| --- | --- |
| 第一张卡 | `phases/P4-报告接入与回修闭环.md`（改稿那张） |
| 第二张卡 | `phases/P8-全AC终验.md`（P4 正文「下一消费者」点名：P8 只读重放受控演练的检出与修后结论） |
| 参考件 | 决定基线 91,395 B（与 2026-10-30 同一份字节） |
| 判据 | 原 finding 消失；无新同类问题；两张卡能按原文执行（四轴 + finding 五项） |

为什么是 P8 不是 P5：丙改的是 P3→P4 的受控页来源与依赖，P8 是这条链的下游读者；
P5 消费的是接线措辞，不读受控副本的检出与修后结论。

### 入口实测：两卡包被拒

`node skills/wh-review/scripts/wh-review-cli.mjs run request.json` 退出 1，
`MATERIAL_INCOMPLETE: post phase index and physical files differ`，
`dispatch_state=blocked_before_dispatch`、`provider_attempts=0`（原件 `review-result.json`、
`review-result.exit`）。原因在 `runtime/review/provider-material-projection.mjs:205`：
post 剖面强制 index 每行都要有实体 Phase 文件，等于不能只投部分卡。
按验收标准「只投两张卡」，没有为迁就入口改投 12 卡；这条限制按事实记录，不在本次修。

### 谁判、看到什么、结论

**第一轮**：判者 = 独立读者子代理 `7b2b648c-6bfb-48f2-b05a-2c6dacecbac0`（fresh context）；
结论原件 `verdict-independent-reader.md`（读者自写，本步未改一字）。结果 **不通过**：

- A 原 finding 仍在：依赖已含 P3（P4:908），但 `P4:294` 仍写「后续工作源按 P8 的真实发现改动。」，
  与 `P4:133/142/309–310` 的「P8 不反向写源」互斥。
- B 新问题：`P8:704/700` 是本轮新写句，对上 `P8:382/723/753/352` 的改前旧文（读者未读改前字节，标「新旧无法判」）。
- C 不能按原文执行：P4:294 与 P8:704 两处无唯一读法。

**补稿（同一处，按失败表）**：`P4:294`「后续工作源按 P8 的真实发现改动。」→「后续工作源按本 Phase 的九类检出改动。」
P4 61,199→61,205 B，SHA256 `7d37dd68cb6a55d993f8896728d6247be7cdd894bf651b725b381010bb3b8914`；
diff `diff/p4-step2-fix.diff`；结构 16／3／1 不变；主仓 run-checks 复跑 exit 0。
这一步只动同一 finding 漏掉的一行；P8 的三处张力未动，表给 P8 写主：
`p8-tensions-for-owner.md`。

**第二轮**：判者 = 新独立读者 `122c7b21-65d9-480e-a03a-6386a359526a`，
读改前原件、当前 P4/P8 与两份 packet-vs-current diff，按三问判。结论原件
`verdict-independent-reader-round2.md`（读者自写）。结果 **通过**：

- 原 finding 那处已改：`P4:294` 现为「后续工作源按本 Phase 的九类检出改动。」，与改前只差这一句。
- P4 全文（915 行）逐处回读，没有别处再把工作源/修源挂给 P8；P8 只出现在只读、下游消费与终末取证。
- 这处改动没有引出新矛盾：改后与 P4:36、288–289、300–303、908、915 一致，改前那句反而是最后的互斥残留。

**P8 三处张力（单列，不属本步判定）**：第一轮读者把 P8:704/700 的新写句与 P8:382/723/753/352 的旧文
列为同根问题（它没读改前字节，标「新旧无法判」）；第二轮对照 diff 后把 P8:700（计划时点）与
P8:352（旧表行）记为「非本步」，并说明 P4:293 已限定首次复制时相等。P8:704 与 P8:382/723/753 的措辞张力
第二轮不在三问内、未复判；两轮结论不同，按「新结论优先、旧原件保留」处理。
表与归属见 `p8-tensions-for-owner.md`：三处都在 P8（不在本步写集），交 P8 写主定；
若 P8 写主判定其中一处与 #16 同根，③ 需按新字节重判。

## 四、三步状态

| 步 | 状态 | 依据 |
| --- | --- | --- |
| ① 就地已知缺陷被检出 | done | `2026-10-30-p10-real-review/anchor-check.json` 17 条记录（14 个唯一位置）全 `resolved=true`，其中 n=16 命中 P4:292（#16）；S2（P2:74）与 S4（P4:284）属入口丢弃后回读救回的 5 条，逐字锚点在 `findings-classification.md` 救回表，**不在** `anchor-check.json` 里 |
| ② 挑一条真 finding 回 writer 改稿 | done | 丙的 writer diff（P4 +16 B、index +10 B）与回执（`report.md` 第 9 行）；diff 只动该处，同行无旧措辞；本步未代改 ② 的任何一处（③ 补的一行在下行） |
| ③ 只投两张卡复验 | done（附 P8 单列项） | 第一轮不通过（卡在 P4:294）→ 补同一处一行 → 第二轮通过（`verdict-independent-reader-round2.md`）；入口拒收两卡包记为限制；P8 三处张力交 P8 写主（`p8-tensions-for-owner.md`） |

## 五、改动文件字节与 SHA256

| 文件 | 改前字节 | 改后字节 | 改后 SHA256 |
| --- | --- | --- | --- |
| `phases/P4-报告接入与回修闭环.md` | 60,697（包内）→61,199（writer） | 61,205（③ 补一行） | `7d37dd68cb6a55d993f8896728d6247be7cdd894bf651b725b381010bb3b8914` |
| `phases/index.md` | 10,935 | 10,945 | `a97b83b524544fb847ab6988d975715e4b8004c3abb85a9200ab604245e67c96` |
| `phases/P8-全AC终验.md`（下游同步，含同轮其它 finding） | 89,572 | 91,621 | `c2ee60798e127e585ff321a599f1373c7f554845081ccc5a8f9bf1e29b64b1cd` |

P4 的两个中间态：writer 改后 61,199 B（`7d40d8b3de8800f715ee48a5710b44e65eeb6ec1a9664a82ac3d7a0eee110dd8`，
原件 `before/P4-before-step2-fix.md`）→ ③ 补一行后 61,205 B（上表）。
改前字节的 SHA256：P4 `6e0d4279ea74f2286bd6260e38099b8577b83925dd0b0bee89b9437752e33abe`、
index `2ac8ff48896d87904385be069e58a40f1304b4a51916281b43effd97651cbe58`、
P8 `9ebf084e3feb01b0a0518a4bf8958dfb65bc0eaf2674c5418d5bf00f64bbe26b`（= 审查包内材料同字节）。

结构核对（改前→改后，`^## `／`^### 任务 `／`^## 机器字段`）：P4 16／3／1 → 16／3／1；
P8 18／4／1 → 18／4／1；index 5／0／0 → 5／0／0。除 P4:294 一行外，本步未改任何材料。

注：`2026-10-31-c07-findings-repair/report.md` 记 P4 改前 60,718 B，与审查包实际投递的
60,697 B 差 21 B；本节以包内同字节原件为准，回执只取它的改后值（61,199 B，与当前字节一致）。

## 六、主仓校验器真实退出码

```
node /Users/Hugh/Hugh/Project/workflowhub/tools/cli/run-checks.mjs \
  --material-root /Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c07-real-page-verification-20261028/specs/workflowhub-ui-frontend-c07-real-page-verification-20261028
```

退出码 0（`run-checks.exit`），关键两行：
`[run-checks][material] PASS … phase_count=12 task_count=36 errors=0`、`ALL CHECKS PASSED`。
命令与完整输出：`run-checks.stdout.txt`、`run-checks.stderr.txt`。
P4:294 补一行后用同一命令复跑，退出码仍 0（`run-checks-after-step2-fix.exit` 与同名输出）。

## 七、本目录清单

| 文件 | 说明 |
| --- | --- |
| `before/` | 改前 P4、P8、index（从 2026-10-30 审查请求件抽取，与包内材料同字节）；另 `P4-before-step2-fix.md` 是 ③ 补行前的当前字节 |
| `diff/` | 前后对照：完整 P4／P8／index、零上下文 P4，以及 ③ 补行的 `p4-step2-fix.diff` |
| `request.json` | ③ 的两卡复验请求（441,513 B 文件字节）；入口在此步拒收 |
| `review-result.json`／`.exit` | 入口拒收原件（status `unavailable`，0 次 provider 尝试） |
| `verdict-independent-reader.md` | 第一轮独立读者判定原件（不通过，卡在 P4:294） |
| `verdict-independent-reader-round2.md` | 第二轮独立读者判定原件（补行后重验） |
| `reader-instruction.md`／`-round2.md` | 两轮派给读者的原文（含三问与读集） |
| `p8-tensions-for-owner.md` | P8 三处张力表：旧文行、新写行、冲突原文、谁定 |
| `build-request.mjs` | 组本请求件的脚本（只读材料） |
| `run-checks.*`／`-after-step2-fix.*` | 主仓校验器命令、退出码与输出（两次） |

未取得：provider 侧的两卡复验结果（入口结构上不支持，见第三节）；本次没有用 provider 结论替代读者结论。
P8 三处张力不在本步写集，未修；P10 的 Done 与档位由 P10 写主按本节结论落。
