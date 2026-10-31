# C07 真实审查 finding 回修报告（2026-10-31）

对象：`specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/`。
输入：`quality/evidence/build-code/2026-10-30-p10-real-review/findings-classification.md`。
方法：逐条读原文与锚点，只做局部替换/插入；每份改完核
`^## `、`^### 任务 `、`^## 机器字段` 与字节变化，未整篇重写。

## 一、13 个真根因

| # | 原文（修前） | 锚点 | 修法 | 修后为什么不再成立 |
| --- | --- | --- | --- | --- |
| 1 | P5「采集器从五个同名环境变量取值填入 `object`」；P2「五身份是…原样声明，没有 URL-only」 | P5:464、P2:458 | P5 任务 2 加「采集前身份比对」：route、service、viewport、engine、engine_session 有观察源就逐项比对；不符 `E_COLLECT_IDENTITY_MISMATCH`、退出 2、零调用、错误同时留声明值与观察值；workspace/state/object_version 无源记 `unknown`，AC-2 不通过。P2:458 改为指向该比对。T013 加 `compareIdentity` 与反向例 | P5:485-506 有比对表与三条判据；P2:462-466 不再说原样声明；T013 动作/场景/GREEN/完成含比对与零调用 |
| 2 | 「成功：…并能指出一处「全绿但漏原需」的漏洞」「失败：…说不出任何漏洞」「读不出漏洞时记未取得」 | P12:508/509/511 | 场景 3 改为完整作者消费加下游读者：成功＝能说首步、输入、失败回谁，实际执行无生产副作用动作，能拒绝预置错误候选；零发现合法但要写覆盖。正例三、正例四、三层、失败表、用例同步 | P12 场景 3 成功条件已换；全文件无「说不出任何漏洞／读不出漏洞」 |
| 3 | 「照契约自己写一份 decision-log、spec 与 phase 片段」「算通过：他的片段原件」；301「写出片段」 | P12:93、301 | 正例三改完整四类候选（决定、规格、P12、纯指针索引）＋原规划 owner 合稿＋另一独立下游读者原答与实际首步；用例三同步；片段只记局部范围 | 正例三 91-99 的通过物是四类候选与合稿；301 改为完整四类；「片段」只作局部证明 |
| 4 | 「八份写入件里七份被这条命令读到；build-code 方法正文的契约测试现有红项，不列入」 | P12:523 | 门禁加 `tests/contract/phase-team.test.mjs`；删「不列入」；写红项保留、归阶段契约 owner、修复前 P12 不完成、同命令重跑为恢复条件 | 三处 gate 命令均含 phase-team；全文件无「不列入」；红项说明在 538-545 |
| 5 | 「本阶段新增一个验收测试文件；…只额外改两个既有浏览器网关文件」 | P8:463 | 文件表后补首改点（session `:461`/`:497`、facts 四名；SKILL 边界句）、首改组 `-t "registered facts"`、受影响回归 `page-audit-collectors`＋`page-audit-runner`、独立核退出码；T023 动作⑪/GREEN/完成加两份回归 | P8:474-483 有首改与回归命令；T023 完成含两份回归；两文件实跑 120 tests、exit 0 |
| 6 | Phase 9 重签命令只列 7 个测试文件 | P11:463 | 换成 P9 当前 `gate_cmd` 的 10 文件命令；加「按十个文件跑、旧七文件回执不能支持重签」 | P11 Phase 9 命令含 light-material-set、material-workspace、zero-machine-gate-advancement；7 文件命令已无 |
| 7 | 任务 2 声称重放验收 1、2、6，过滤只有 `-t "AC-C07-1"` | P8:653 | 四处改 `-t "AC-C07-[126]"`；看到与 GREEN 改为三块各列实际通过项 | 全文件无 `-t "AC-C07-1"`；4 处 `[126]` |
| 8 | 网关两文件在写入集，T021-T024 无首改路径/命令/oracle | P8:470 | T023 文件/符号加两网关与符号；动作①加 facts 四名与 `-t "registered facts"`；文件表后补首改位置与命令 | T023 有首改路径；P8 有首改位置与命令 |
| 9 | P4 依赖只写 P1，却从 P3 取 controlled-page；P8 跑后回 P4 改源 | P4:292、284 | index 与 P4 machine 依赖改 `P1、P3`；六条链改 P4 内检出→最小修源→独立复验，P8 只读重放修前/修后；P8 T023⑨/说明同步；P4 Done 改未完成 | index P4 依赖 `P1、P3`；P4 六链无「等 P8／回本 Phase 修源」；P8 T023 读 P4 交付 |
| 10 | `file://`「按适用性记录；未测不写已验」 | P8:321 | P8 表/步骤/T023 行/动作/输出改为直接打开样本页、原始输出作 AC-3 直接证据；spec 验收 3 通过加 `file://` 实测输出，失败改「未跑却写已验」 | P8 三处直接证据；spec:785、797 同口径 |
| 11 | 回退输入只有假 agent-browser、没有 ego-browser；用例四同 | P2:74、101 | 加正常三（装了没开）：假 ego-browser 可执行件、无调试端点，仍回退，reason 逐字 `ego-lite not running before launch`；用例四布两输入；附录列两 reason | P2:74-81 三例；用例四两例；「装了没开」有具名判据 |
| 12 | 版本绑定只做五字段白名单与三差异，缺批准/交付双绑定与界面变更同意 | P7:304 | 加「版本三件套」与「界面变更」两行：41eae967 与 9efb7e57 各写 commit/sha256/时点；变更登记并取得同意，缺同意判 2；动作/输出/场景/GREEN/完成/表同步 | P7 表有两行；T019 各字段含两版本与同意；41eae967/9efb7e57 在 P7 出现 |
| 13 | 判据正文 11 节表无「取值口径与属性清单」 | P1:191 | 表后加：取值口径不单列二级节，写在九维映射末尾，含 property/declared/rendered/comparison 四项与间距、阴影、边框、圆角、图标五项及各状态视口；T001 动作/输出/完成/覆盖同步 | P1:205-209 有该段；实际 `page-audit.md:40-42` 已有四项与五项；节数仍 11 |

## 二、条件真与部分真

### 条件真：spec:1507 UI 三源

修前：只用一句「三个来源都为 false」，依据指向包外 `2026-10-29-002-ui-applicability-and-norms.md` §1.1；该原件未随包投递。
修法：改成三源表，逐项写「读了什么／判定／包内可复核处」：
原始需求看 43 条与验收全文；项目清单看 `package.json`（只有 `ajv`、`js-yaml`）；
计划改动看本任务写集。包外判定表只作索引，不当包内依据；任一源读不到记 `unknown`，
保留 Web 五项，恢复条件是补该源并重跑三源判定。
修后：spec:1505-1520 的判定不再依赖包外原件；「三个来源都为 false」的无依据句已无。

### 部分真：P8:655 `c.raw` 真值

成立的一半：`NINE.every(d=>criteria.some(c=>c.subitem===d&&c.raw))` 会把真实数值 0 误杀。
修法：改成 `c.raw!==undefined&&c.raw!==null&&c.raw!==""`，
并写明「数值 0 与 `false` 是合法值；未知写成 0 才判红」；动作、覆盖上限、负例同改。
不成立的一半：「排除未测／不适用」与 P8 自己的合同冲突——
T022 动作②与「九项各有子项、各带原始值与采集引用」要求九个可测子项都有 raw；
未测与不适用在八维与覆盖层用 `untested_reason` 表达，不是删九维子项。
所以这一半不改，避免把「九维实测」降成可空。

## 三、判断不改或只改一半的条目

1. **P8:470「验收阶段是生产写者」**：未采纳「把两网关移出 P8 写入集」。
   当前字节已含 `runRegisteredScript` 的 facts 扩展，且 P8 的 `registered facts` 组直接覆盖该路径；
   移出会让机器写入集与真实 diff 不符，并丢掉已验证的采集能力。
   改为限定两个首改点、补首改组与 P2/P5 受影响回归、由独立测试者核退出码。
   所以「无首改路径」「无回归」两半已消；「验收阶段仍改生产文件」这一设计判断保留，但已收口。
2. **P8:655「未测／不适用被排除」**：见上，判据与 P8 合同冲突，不改。
3. **P1 仍为 11 个二级节**：决定 13 要求四项取值口径与五项属性清单「落判据正文」，
   没有要求新增二级节；实际 `page-audit.md:40-42` 已在九维映射节内落地。
   补成第 12 节会与当前实现、P1 的 Done 与 11 节证据冲突，故用「正文必含项」固定。
4. **P12 验收 8 行**：原「指出一处全实现仍漏原需」已改为「拒绝预置的错误完成候选」，
   与规格 AC-C07-008 的「通过」对齐；这是顺手修掉同型问题，不是新增判据。

## 四、改动文件与字节／SHA256

| 文件 | 字节（修前→修后） | SHA256（修后） |
| --- | --- | --- |
| `spec.md` | 173283→174385 | `0c88eb68e233ddfcd575d3d16eb08b240fdf585639761750c00be02b405bad5c` |
| `phases/P1-判据与共用契约.md` | 37645→38121 | `ded7b22878ed5286587b526649f053690ae9cd73a9ccd03d13213d1f9ebad2ed` |
| `phases/P2-真实采集与失败语义.md` | 72583→73234 | `4cb2fab5f8b8360889f3ea012565160648ae1c8cc974f70afa1f7e75700252f9` |
| `phases/P4-报告接入与回修闭环.md` | 60718→61199 | `7d40d8b3de8800f715ee48a5710b44e65eeb6ec1a9664a82ac3d7a0eee110dd8` |
| `phases/P5-审计编排入口与规范消费证明.md` | 91910→94042 | `c648faea86f1f6ee447daea7ca5e4665b86c537a984c200b2c892e34c16a7b92` |
| `phases/P7-交付证据与防假绿实现.md` | 43922→44811 | `d364b44073edbffc81a2dbdfb45e658427380e01cdd2539346b7463c074e6e79` |
| `phases/P8-全AC终验.md` | 89572→91621 | `c2ee60798e127e585ff321a599f1373c7f554845081ccc5a8f9bf1e29b64b1cd` |
| `phases/P11-去字面断言.md` | 41294→41678 | `b07d100b429646f7f464926bef25ef2511331af48f5604603d4c93f867c5eb55` |
| `phases/P12-逐需验收与真实完成.md` | 52114→54042 | `7dea4ec7a8693dc48bd5b8be151977a730e6c08cf9e6f336e368db8916e1d6df` |
| `phases/index.md` | 10935→10945 | `a97b83b524544fb847ab6988d975715e4b8004c3abb85a9200ab604245e67c96` |

结构核对：各 Phase 的 `^## `、`^### 任务 `、`^## 机器字段` 与修前一致；
`P12` 15／1／1，`P8` 18／4／1，`P5` 12／3／1，`P4` 16／3／1，
`P2` 15／3／1，`P7` 14／3／1，`P11` 17／1／1，`P1` 13／3／1，`index` 5／0／0；
`spec.md` 24 个二级标题。

## 五、校验器真实退出码

命令：

```
node /Users/Hugh/Hugh/Project/workflowhub/tools/cli/run-checks.mjs \
  --material-root /Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c07-real-page-verification-20261028/specs/workflowhub-ui-frontend-c07-real-page-verification-20261028
```

结果：exit 0。
`[run-checks][material] PASS … phase_count=12 task_count=36 errors=0`；`ALL CHECKS PASSED`。

另有实跑：`page-audit-collectors.test.mjs` 与 `page-audit-runner.test.mjs`
共 120 tests、exit 0，作为 P8 网关改动的受影响回归事实。
