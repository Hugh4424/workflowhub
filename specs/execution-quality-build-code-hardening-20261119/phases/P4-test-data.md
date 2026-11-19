# Phase P4 — 交出可重复准备、检查和清理的隔离测试数据

交付可独立验收的结果，供实施者、独立判定者和下游沿同一原件复跑。
机器标题和字段保留现行合同字面写法。

## 哪些节必须写，哪些可以省？

本段给出可独立交付、观察、回退的单个结果。
| 段落 | 状态 | 本段用法 |
| --- | --- | --- |
| 交付、依据、开工材料 | written | 定位可观察结果、来源及上游输入。 |
| 验收、写集、验证 | written | 找判据、实际写主和反例。 |
| 消费者、任务与机器字段 | written | 交已知输入及执行边界。 |
| 末验收 | not-applicable | 完整验收归第 10 段。 |

## 这一 Phase 交出什么？

测试者只用本仓可复跑的隔离小样本检查版本，缺配置立即具名失败，清理有负责人和完成信号。
改动前：已有测试标准和临时目录工具。计划没有稳定给下一段指出可执行输入、版本失败和可清理边界。
改动后：独立读者可从真实入口对照正常与失败，原件留本段既有证据路径。
非目标：复用 testing-system-blueprint 与现临时目录职责。跨项目建库、迁移、实库、真实资源处置和固定配额均按上游边界处理；本段不建 `P0.md`、不设第二数据 owner、不写固定配额，这三项随决策日志退役。
主要风险：样本路径解析或环境缺省让测试访问产品库。所有读写在显式隔离根内；使用本地合成错配验证拒绝，不接生产端点。
相邻阶段：交 P5 已验的准备/版本 probe 输入、命令和缺资源回执。P4 的测试数据段先结束，P5 再写同一 workflow 的开工检查段。
**配套与影响**：配套调整＝`skills/testing-system-blueprint/SKILL.md` 的测试数据指向、`workflows/build-plan/SKILL.md` 统一准备段、`tests/fixtures/execution-quality/prepare-test-data.mjs`；配套迁移＝旧测试库与数据保留、版本与清理约定迁入现 owner 的段；配套移除＝`P0.md`、固定配额与第二数据 owner；影响范围＝P5 开工探测、本仓测试磁盘占用、build-plan 数据段写法。
未决事实见验收和停止条件。未知信号由原负责人提供恢复条件。

## 这一 Phase 怎么验收？

完成本段需要约 34 活动分钟。两条验收各自保留，后段只消费实际原件。
本段涉及命令、材料或宿主读取；没有页面、路由和组件触碰。

| 判据 | 执行者 | 活动分钟 | 硬估算分钟 | 重验预留次数 | 证据档位 | 所需资源 | 可观察量 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AC-P8-001 | 独立执行者 | 12 | 20 | 1 | 命令与独立读回级 | 同一合成 seed、合法与落后版本、测试清理样本 | 独立执行者复跑准备命令，读现四项、版本诊断和清理读数。 |
| AC-P8-002 | 独立执行者 | 8 | 13 | 1 | 命令级 | 缺隔离变量、受控假目标、隔离根登记 | 独立执行者经现认证 `verify --action=execute` 实际启动定向 Vitest。
读回原捕获的 cwd、argv、退出和子进程输出，观察候选连接目标。
比对授权临时根和外侧只读哨兵的字节与路径差分。 |

活动总量为 12 + 8 + 8 共享准备 + 6 一次受影响重验 = 34 分钟。
共享准备涵盖冷启动读源与夹具准备。执行时记录实际分项，重验预留只计一次。
硬估算为各条硬估算与准备、重验相加，共 47 分钟。以上均 provisional。
估算逐项按当前正常与坏例复跑、独立读回、原件核对的操作量；不是实测活动账。
CLI 亚秒基线详见任务库测试蓝图。当前无可比活动账，实施预算仍待按已知窗口确认。
等待：本仓合成数据无产品库等待。冷装依赖的等待单列，有环境问题由测试数据负责人提供恢复条件。

### 怎么判验收 7？

隔离数据可重跑，版本落后给出具名错误。
独立执行者复跑准备命令，读现四项、版本诊断和清理读数。
条件：同一合成 seed、合法与落后版本、测试清理样本。
故意破坏：只改旧样本版本。必须抓到实际落后的版本且具名失败。
证据：数据负责人在本段交付前交正常、落后命令与隔离/清理原件。
实跑边界：incomplete；夹具目标行为未实施。同段命令和独立观察的实际判定分开保存。
失败由本段原负责人查因。修后由独立执行者按同一输入重验。

### 怎么判验收 8？

fixture 级隔离路径不回退产品库。
独立执行者读受控夹具真正解析的路径及运行前后副作用；不触真实端点。
条件：缺隔离变量、受控假目标、隔离根登记。
故意破坏：仅删除隔离参数并保留无网络的假备选目标，断言夹具入口没有访问或创建副本。
证据：数据负责人在正常版本复跑后交夹具命令与受控路径差分。
实跑边界：incomplete；正常与负例尚未执行。同段命令和独立观察的实际判定分开保存。
真实入口边界：真实测试入口与配置解析者不在本段写集，故本条只判 fixture 级隔离，
真实入口的解析路径记具名缺口：owner=测试数据负责人，命令=`node tools/cli/run-checks.mjs --task-path <认证任务根>` 之外的测试入口解析，时点=该入口纳入写集的后续任务。
本段不声称真实入口已证，也不把夹具结论外推到产品库访问。
失败由本段原负责人查因。修后由独立执行者按同一输入重验。

## 为什么现在做，依据是什么？

测试者只用本仓可复跑的隔离小样本检查版本，缺配置立即具名失败，清理有负责人和完成信号。
当前包的设计、回退与配套沿决策日志，唯一验收在规格附录 A。
这段效果能独立用一个可回读的消费者、真实结果和具名坏例判断。

## 开始前读什么？

先读包内决定与附录 A，再核首改符号和当次执行输入。

| 原件 | 开工前核什么 |
| --- | --- |
| `decision-log.md:512–548` | 四项数据约定、资源边界和失败条件 |
| `spec.md#appendix-a--验收判据唯一权威` · AC-P8-001、AC-P8-002 | 验收 7、8 定义 |
| `skills/testing-system-blueprint/SKILL.md:8–16` | 现数据、测试和原件职责 |
| `runtime/interface/temp-dir.mjs:45–88` | createTrackedTempDir 与具名回收的复用入口 |
| `tests/contract/temp-dir.test.mjs` | 现进程隔离、残留与清理对照 |
| `tools/cli/run-checks.mjs:272–332` | 现规划材料检查；不能证明真实数据隔离 |
| `tools/cli/stage-runtime.mjs:1798–1817`、`runtime/interface/run-command.mjs:272–313` | 现 verify 实际运行任务工作树命令并捕获 cwd、argv 和原输出 |
| `package.json`、`tests/contract/temp-dir.test.mjs:1–25,58–94` | 现定向 Vitest 和 Node 子进程隔离入口 |

P3 提供决策和前置模板。同一测试数据负责人提供独立确定的版本、合法隔离根，校准只需覆盖当前任务 fixture 的输入大小。

## 每个文件由谁改，先做什么？

产品文件由本段实施者独占。标出的测试路径由独立作者先冻结具名断言。
实施者消费测试，在提交的阶段范围内对账，未经裁决不改冻结测试。

| 路径 | 具体锚点 | 变更与消费者 |
| --- | --- | --- |
| `skills/testing-system-blueprint/SKILL.md` | 测试数据准备指向 | 由现 owner 放四项，只有调用示例和责任指针。 |
| `workflows/build-plan/SKILL.md` | 现统一测试准备段 | 让当前正式规划产出消费已核数据准备约定。 |
| `tests/fixtures/execution-quality/prepare-test-data.mjs` | 脚本 main（新增受控 fixture） | 实际生成、检查、读回本仓最小合成数据。供本段隔离测试和下一段 probe 使用。 |
| `tests/contract/temp-dir.test.mjs` | 追加 ORACLE-P4-ISOLATED-TEST-DATA 用例 | 独立夹具复跑、过期、缺配置和清理观察。 |
| `docs/architecture/move-map.json` | 新验收 fixture 登记 | 登记唯一测试数据 owner、P4/P5 消费者、替代与删除条件。 |

本段沿 P2 交回的规划入口写测试数据段，并把已验指针交给 P5。P5 接开工段。
写集故意不含真实测试入口与它的配置解析者：本段只证 fixture 级隔离，真实入口按 AC-P8-002 记具名缺口（owner/命令/时点），不靠扩写集冒已证。
P4 和 P5 同路径依真实数据准备先供给的顺序串行。
隔离证据和真实旧材料按其既有写主发布或只读，均不扩为仓库写集。
回退只撤销本段实际产品改动，保失败与已有原件，复核同一消费入口。

## 怎么验证？

用现有真入口观察实际行为，再用独立样本把一处条件弄坏并复跑。
真实消费者是本仓现有定向测试入口。先认证任务，交以下 Vitest argv 给现
`verify --action=execute`。验证入口通过 `task.captureCommand` 启动并记录工作树 cwd。
在现 `tests/contract/temp-dir.test.mjs` 的具名用例里从外层分别启动两次 Node 子进程。
一份传显式隔离参数 `--data-root`，另一份仅省略该参数；实际运行脚本入口。
计划新增的测试侧脚本只识别显式隔离根与样本版本。缺根须在产生样本前具名报错。
子进程仅用受控 PATH、TMPDIR 等最小环境构造，真实连接配置与凭据不注入。

保现捕获回执中的 argv、cwd、退出和原输出，核子进程确实到解析边界。
外层比对运行前后实际路径差分，确认受控根以外的只读哨兵未被创建、读取或覆盖。
读取观察用外层只读记录，对连接尝试用隔离运行的回环哨兵或宿主连接记录取证。
若连接面或读路径不可观察，按具名缺口交环境负责人，不能仅凭命令退出证明隔离。
本轮实读本仓包依赖、采集调用链和临时目录测试，未见该链路读取业务库配置或连接器。
覆盖本仓这个实际入口。跨项目库和任何真实产品库不参与测试。
本轮目标工作树缺 runner，沿 P1 的同一依赖准备恢复。

`node node_modules/vitest/vitest.mjs run tests/contract/temp-dir.test.mjs -t ORACLE-P4-ISOLATED-TEST-DATA`

命令选择受影响用例。新窄用例尚未在本轮写入、冻结或执行。
冻结目标断言应抓实际配置缺失仍企图读出准备结果、或过期未具名。现夹具未实现，不存在/模块未装只算装置失败，不冒称已取得 RED。
写入实施前由独立作者持有和实跑。若没到目标断言，记录环境或装置失败。
临时输入与受控任务经既有清理职责回收。保原件及真实退出码、命令、cwd、来源。

## 下一消费者拿什么继续？

交 P5 已验的准备/版本 probe 输入、命令和缺资源回执。P4 的测试数据段先结束，P5 再写同一 workflow 的开工检查段。
下一位消费者核可读与当前版本后使用。若读回失败，回原负责人处理同一源。

## 每张任务卡怎么写？

唯一任务是切穿当前入口、实际结果和独立验收，不独立拆出准备或单纯测试。

### 任务 1：交出可重复准备、检查和清理的隔离测试数据

为什么做：已有测试标准和临时目录工具。计划没有稳定给下一段指出可执行输入、版本失败和可清理边界。
交付什么：测试者只用本仓可复跑的隔离小样本检查版本，缺配置立即具名失败，清理有负责人和完成信号。
不做什么：复用 testing-system-blueprint 与现临时目录职责。跨项目建库、迁移、实库、真实资源处置和固定配额均按上游边界处理。
前置：P3 提供决策和前置模板。同一测试数据负责人提供独立确定的版本、合法隔离根，校准只需覆盖当前任务 fixture 的输入大小。
怎么做：先核 createTrackedTempDir 的隔离入口，再在现 testing-system-blueprint 数据准备职责下固定唯一受控夹具。
怎么验收：先到目标断言，再用同一命令重放；实际现象和证据不靠退出码推定。
证据：实施前保目标失败原件，实施后保同命令和独立判定。
下游（含何时停）：交 P5 已验的准备/版本 probe 输入、命令和缺资源回执。P4 的测试数据段先结束，P5 再写同一 workflow 的开工检查段。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T004
- **Source / FR / AC**：R-017、R-020；decision-log.md:512–548；FR-WH-008；AC-P8-001、AC-P8-002。测试者只用本仓可复跑的隔离小样本检查版本，缺配置立即具名失败，清理有负责人和完成信号。
- **Inputs**：P3 提供决策和前置模板。同一测试数据负责人提供独立确定的版本、合法隔离根，校准只需覆盖当前任务 fixture 的输入大小。
- **Files / symbols**：`skills/testing-system-blueprint/SKILL.md`；symbol: 测试数据准备指向；`workflows/build-plan/SKILL.md`；symbol: 现统一测试准备段；`tests/fixtures/execution-quality/prepare-test-data.mjs`；symbol: 脚本 main（新增受控 fixture）；`tests/contract/temp-dir.test.mjs`；symbol: 追加 ORACLE-P4-ISOLATED-TEST-DATA 用例；`docs/architecture/move-map.json`；symbol: 新验收 fixture 登记
- **Action**：先登记 fixture 的现消费者和删除条件。保守按真正测试所需的最小样本确定每任务上限依据。
  夹具只接受显式 --data-root 与样本版本；缺根、越界和落后具名失败。
  经现认证 verify/capture 路径运行定向 Vitest，在现用例内启动子进程。
  以原 argv/cwd、输出和受控根内外路径差分判两案；本仓范围无产品库解析器可调用。
  真实测试入口的配置解析者不在本段写集，按 AC-P8-002 的具名缺口交测试数据负责人，不用夹具结论外推。
  复用现临时目录能力在任务拥有的目录中生成合成数据。可复跑不扩大对象；同一进程 finally 回收。
  在既有 build-plan 统一准备段引用可重跑命令、数据来源/上限和清理四问。下一段复用此输入做 probe。
- **Outputs / failure**：测试者只用本仓可复跑的隔离小样本检查版本，缺配置立即具名失败，清理有负责人和完成信号。 隔离设置缺失或改指路径外，合法目录中另种入落后版本。放一个禁止接触的受控哨兵目录，核无读取或副本。
- **Boundary / DO NOT TOUCH**：真实产品库、真实环境凭据、任何历史备份和跨项目命令都在任务外。runtime/interface/temp-dir.mjs、runtime/evidence/disk-budget.mjs 只读复用；不改既有测试断言。
- **Dependency**：P3/T003
- **Test tier / skill**：feature / backend-testing；本段核命令、集成和真实消费者。UI、真实产品库和生产网络在本段范围外。每条判据另按正文档位实际取证。
- **Scenario / fixture or service**：隔离设置缺失或改指路径外，合法目录中另种入落后版本。放一个禁止接触的受控哨兵目录，核无读取或副本。 临时任务在同进程内创建和清理；原始输入不覆盖。
- **RED/GREEN gate_cmd**：`node node_modules/vitest/vitest.mjs run tests/contract/temp-dir.test.mjs -t ORACLE-P4-ISOLATED-TEST-DATA`
- **expected_exit**：RED nonzero; GREEN 0。只以抵达 ORACLE-P4-ISOLATED-TEST-DATA 的目标断言判 RED。
- **RED target failure**：ORACLE-P4-ISOLATED-TEST-DATA 冻结目标断言应抓实际配置缺失仍企图读出准备结果、或过期未具名。现夹具未实现，不存在/模块未装只算装置失败，不冒称已取得 RED。 本轮无目标 RED 原件。
- **GREEN oracle**：ORACLE-P4-ISOLATED-TEST-DATA 经现 verify/capture 复跑受控夹具，过期和省略 --data-root 都给具名拒绝。
  读原回执的 cwd/argv 与受控根内外路径差分。只有具备这项证据才判 fixture 级隔离通过。
  真实测试入口未纳入写集时记具名缺口（owner/命令/时点），不声称已证。
  正常、失败和取消只清自己拥有的对象；样本纯函数单测不代夹具入口。
- **Evidence**：预写目标失败拟记 `quality/tests/p4-isolated-test-data-red.output`，同命令绿色与具名坏例拟记 `quality/tests/p4-isolated-test-data-green.output`。当前均未执行。实际证据身份、退出码和读回由既有 task facts 发布。
- **Coverage limit**：S 层合成数据证明本仓测试隔离。实际跨项目迁移/产品库访问完全超出范围；真实备份保留数字和水位无既定值。
- **STOP / recovery**：路径或归属无法验证时停数据动作并保原错误。测试数据负责人提供合法隔离根或修版本输入后原命令重跑；禁止试真库恢复。
- **Done**：前置（不作完成条件）：同一目标命令实际跑过，保 cwd、退出与原始输出。完成条件（只写效果）：AC-P8-001：incomplete，隔离数据可重跑，版本落后给出具名错误；实跑/原始观察待实施，证据拟归 `quality/tests/p4-isolated-test-data-green.output`；AC-P8-002：incomplete，fixture 级隔离路径不回退产品库（真实入口记具名缺口）；实跑/原始观察待实施，证据拟归 `quality/tests/p4-isolated-test-data-green.output`。独立执行者按验收原判据观察。

## 机器字段（校验器用，人可跳过）

- **全局规格**：`spec.md#实现设计全局权威`
- **Write set**：`skills/testing-system-blueprint/SKILL.md`；`workflows/build-plan/SKILL.md`；`tests/fixtures/execution-quality/prepare-test-data.mjs`；`tests/contract/temp-dir.test.mjs`；`docs/architecture/move-map.json`
- **Dependency**：P3
- **消费者**：P5 的开工检查入口
- **gate_cmd**：`node node_modules/vitest/vitest.mjs run tests/contract/temp-dir.test.mjs -t ORACLE-P4-ISOLATED-TEST-DATA`
- **oracle**：ORACLE-P4-ISOLATED-TEST-DATA
- **evidence_path**： planned: `quality/tests/p4-isolated-test-data-green.output`
- **STOP**：路径或归属无法验证时停数据动作并保原错误。测试数据负责人提供合法隔离根或修版本输入后原命令重跑；禁止试真库恢复。
- **覆盖 AC**：AC-P8-001、AC-P8-002
- **Done**：前置（不作完成条件）：实施前冻结目标断言并实跑；当前未执行。完成条件（只写效果）：AC-P8-001：incomplete，隔离数据可重跑，版本落后给出具名错误；实跑/原始观察待实施，证据拟归 `quality/tests/p4-isolated-test-data-green.output`；AC-P8-002：incomplete，fixture 级隔离路径不回退产品库（真实入口记具名缺口）；实跑/原始观察待实施，证据拟归 `quality/tests/p4-isolated-test-data-green.output`。交接引用使用实际字节与未验边界。

