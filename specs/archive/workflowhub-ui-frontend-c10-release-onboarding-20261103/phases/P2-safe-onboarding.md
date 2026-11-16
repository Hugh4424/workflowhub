# Phase P2 — 新维护者能安全配置和重复接入

本文件给本段唯一开发writer、独立测试/审查者和下游消费者。
Phase是可独立交付验收的一段；当前只写未确认草稿，不保存执行状态。
全局目标和唯一验收见spec.md；本文件只写本段增量与可执行协议。

## 哪些节必须写，哪些可以省？

本段必要章节均written，具体输入和动作在下文；唯一末验收节不适用。
机器标签和精确路径/命令保原字面，属于材料行宽例外。

| 章节组 | 当前安排 |
| --- | --- |
| 结果/验收/依据/读源 | written；当前输入和验收首判在本段 |
| 文件责任/验证/任务卡/机器字段 | written；同一writer和同一判定器 |
| 下一消费者 | written；只列本段实际交付 |
| 验收Phase专属检查 | not-applicable；唯一末段为P6 |

## 这一 Phase 交出什么？

新维护者能安全配置和重复接入，让P4完整发布作者、P5文档作者与新维护者拿真实产物继续。

- **本 Phase 结果**：维护者从已声明根检查、计划或执行接入，唯一配置路径可读；用户冲突和缺项指明下一步。
- **非目标**：受控CLI测试不证明实际宿主发现、外部search或审查服务成功；双宿主结果分别记；本段不做版本三态、不代装外部工具、不触Git安装器。简单优先取现owner复用或窄接线，不加控制面。
- **改动前**：当前没有本卡接入CLI/模板/precheck；storage-root按XDG，审查loader默认HOME但已支持显式hostConfigPath；现v2禁止profiles/priority。
- **改动后**：维护者从已声明根检查、计划或执行接入，唯一配置路径可读；用户冲突和缺项指明下一步。
- **与相邻 Phase 的边界**：输入是已合主线当前源；本段结果可独立验收；共享登记由P1先交，本段随后独占续写；P4消费已交付接口/方法。
- **主要风险**：把配置检测扩成审查provider配置迁移，覆盖用户值；返工收回现loader显式传参和只补非敏感键，坏输入保原字节。
- **下一步**：下游按“下一消费者”节读真实交付和限制。
- **动手前必读**：storage-root:5–29/57–71；third-review-host-config:51、379–507；stage-runtime:1705–1763/1872–1931；config/workflowhub.yaml；runner-release:185–246；研究005配置差异与当前v2 owner。
- **未决事实**：当前计划/预算未确认；真实执行资源在本段开工核，缺项回具名owner。

## 这一 Phase 怎么验收？

本段独立首判spec Appendix A所指验收，不把效果推到最终段。

成本账：验收2活动40 + 验收9活动15 + 共享准备10 + 重验预留15 = 80活动分钟。
逐条七字段及资源来源由spec Appendix A承载，本处只重算本段。
资源账：两家已装宿主、隔离HOME/XDG/PATH与假key；现storage-root及trusted loader；宿主未装只记unavailable，
不用链接存在充数。
范围账：本段只判断新维护者能安全配置和重复接入；最终组合和其余AC只交供件。
`phase_budget={soft_min:unknown,hard_min:unknown,variance_threshold:unknown,source:provisional proposal}`。
`execution_budget={window_minutes:unknown,command_cap:unknown,wait_cap:unknown,retry_reserve:unknown}`。
预算和S/M/L仍提案，未取得真实来源，不能填模板120/240/1.5。
用户等待、审查等待、环境等待各记实际owner/来源/恢复，与活动分钟分账。
本段非UI：只消费CLI/方法/文件和隔离进程，不观察页面或样式。

1. 验收标准：只引用Appendix A的本段首判，判定器见任务卡；不重写第二份通过/失败。
2. 场景：干净目标check/dry-run/apply/apply；用户同名文件；断链；不可写目录；坏JSON/合法缺键/含旧profiles；
XDG与HOME不同；项目级只写显式项目；配置/审查/浏览器/搜索及Node版本/npm/git按动作需求的缺项及无关动作；双宿主真实发现/调用及删链失效再装。
3. 环境与数据：两家已装宿主、隔离HOME/XDG/PATH与假key；现storage-root及trusted loader；
宿主未装只记unavailable，不用链接存在充数。搭建和清理同作用域，原始输出留任务库。
4. 用例与预期：正常及每个具名反例走下文同一范围命令；有效RED须到目标assertion，GREEN后独立按原AC判效果。
5. 谁判与承接：开发通知实现就绪后，主会话才派不同上下文只读测试/审查；P4完整发布作者、P5文档作者与新维护者消费原件。
6. 失败回修与重验：覆盖用户字节、回显敏感值、默认猜provider、未知v2形状或宿主不可用时停止对应写/宿主路径；配置与CLI回P2原writer，
真实资源由宿主/环境owner补，原文件/失败capture保留。同一原writer修，受影响独立方只复验原问题及最小回归。

## 为什么现在做，依据是什么？

当前没有本卡接入CLI/模板/precheck；storage-root按XDG，审查loader默认HOME但已支持显式hostConfigPath；
现v2禁止profiles/priority，因此本段交付有当前消费者。
全局需求与取舍沿decision-log及spec，不在这里重开方向或替用户批准。
来源是R-002、R-003、R-013、R-014、R-015、R-022、R-024；D-002/003/015/018；ADR-001/004，
本段判据指向spec Appendix A。

## 开始前读什么？

先读spec全局设计与本段Appendix A，再按以下真实锚点看首改和反例。
storage-root:5–29/57–71；third-review-host-config:51、379–507；
stage-runtime:1705–1763/1872–1931；config/workflowhub.yaml；
runner-release:185–246；研究005配置差异与当前v2 owner。
这些源由作者2026-11-16用read/grep实读；精确签名/字段逐字清单在spec代码锚点。
任务库两份研究004/005只提供导航，关键接口仍读当前源。
禁止范围的原始合同取当前源，不把历史摘要冒现实现。

## 每个文件由谁改，先做什么？

本段唯一开发writer按下表逐文件交付，审查和测试只读。
路径是未来实施写集，本轮没有修改这些生产/测试/方法文件。

| 路径 | 动作类别与责任 | 真实消费者/输入 |
| --- | --- | --- |
| `runtime/evidence/storage-root.mjs` | modify；把现workflowHubConfigPath按唯一owner供调用方复用；保持resolveStorageRootDetails现优先级与错误 | 本段唯一writer；P4完整发布作者、P5文档作者与新维护者，输入见本段真实源 |
| `runtime/distribution/config-bootstrap.mjs` | new；读取/检测现JSON并最小补非敏感缺键，原子写及备份，provider定义不在此持有 | 本段唯一writer；P4完整发布作者、P5文档作者与新维护者，输入见本段真实源 |
| `runtime/distribution/precheck.mjs` | new；按具体依赖动作汇总配置/工具缺项和下一步，不阻无关命令 | 本段唯一writer；P4完整发布作者、P5文档作者与新维护者，输入见本段真实源 |
| `runtime/distribution/config-bootstrap.test.mjs` | new；就近测试坏JSON/缺键/现v2/权限/原子失败与原字节保全 | 本段唯一writer；P4完整发布作者、P5文档作者与新维护者，输入见本段真实源 |
| `runtime/distribution/precheck.test.mjs` | new；就近测试具名缺项、真实路径传参和无关动作 | 本段唯一writer；P4完整发布作者、P5文档作者与新维护者，输入见本段真实源 |
| `tools/cli/onboard-release.mjs` | new；check/dry-run/apply共用动作计算；两类宿主软链适配、冲突保护、项目目标显式输入 | 本段唯一writer；P4完整发布作者、P5文档作者与新维护者，输入见本段真实源 |
| `tools/cli/stage-runtime.mjs` | modify；在真实依赖动作委托前调用precheck；doctor/status/draft等无关入口保原语义 | 本段唯一writer；P4完整发布作者、P5文档作者与新维护者，输入见本段真实源 |
| `config/workflowhub.config.template.json` | new；合法非敏感模板；task_dir、third_review.command/config/attachment_root与wh_review v2完整非敏感结构；值来源见spec模板段，不猜用户值 | 本段唯一writer；P4完整发布作者、P5文档作者与新维护者，输入见本段真实源 |
| `config/workflowhub.yaml` | modify；写成非生效历史样例并指唯一JSON；不建立第二配置源 | 本段唯一writer；P4完整发布作者、P5文档作者与新维护者，输入见本段真实源 |
| `tests/contract/onboard-release.test.mjs` | new；真实CLI black-box及隔离目标，宿主实际调用原件另留 | 本段唯一writer；P4完整发布作者、P5文档作者与新维护者，输入见本段真实源 |
| `tests/contract/precheck-entry.test.mjs` | new；实际依赖入口的五种缺项与无关动作对照 | 本段唯一writer；P4完整发布作者、P5文档作者与新维护者，输入见本段真实源 |
| `docs/architecture/move-map.json` | modify；先登记新生产文件职责、owner、真实consumer、测试、承接与删除条件 | 本段唯一writer；P4完整发布作者、P5文档作者与新维护者，输入见本段真实源 |

- **新增**：`runtime/distribution/config-bootstrap.mjs`；`runtime/distribution/precheck.mjs`；`runtime/distribution/config-bootstrap.test.mjs`；`runtime/distribution/precheck.test.mjs`；`tools/cli/onboard-release.mjs`；`config/workflowhub.config.template.json`；`tests/contract/onboard-release.test.mjs`；`tests/contract/precheck-entry.test.mjs`。
- **修改**：`runtime/evidence/storage-root.mjs`；`tools/cli/stage-runtime.mjs`；`config/workflowhub.yaml`；`docs/architecture/move-map.json`。
- **退役**：config/workflowhub.yaml只退为非生效样例，不删历史。
- **禁止改动**：spec全局禁止写集；本段尤其不改skills/wh-review/scripts/third-review-host-config.mjs、3rd-review provider配置和installRunnerRelease，已有owner承接。

本段与其它交付的结果独立，但新增测试/生产文件须先登记同一move-map，依真实前后writer串行。
共享边界：本段先交onboard-release和move-map现字节给P4；P4后加版本输出和发布职责，依赖本段已验接口。
冲突回本段原writer修自己hunk；未知状态如实保unknown，禁整树恢复或另建锁账本。
新文件逐项职责/consumer见表；生产新文件先登记move-map再实现。
替代与删除条件：仅当本表实际消费者均已由经独立核验的替代承接后退役，历史原件保留。

新增文件创建前先由本段writer修改`docs/architecture/move-map.json`，
登记上表新增项的职责、实际consumer、测试和全部consumer迁移后的删除条件。
本段写主独占该登记动作；不新增另一份职责账本。

### 前置检查放在什么真实派发点？

Node进程只能检查已启动Node的版本，不能声称Node缺失后仍在Node内继续提示。
无Node由安装shell/宿主启动命令的原始ENOENT及README安装来源承接；
旧Node<24在CLI首个依赖动作前拒绝。npm/git仅在安装/相应Git动作需要，
不是doctor/status/draft的统一前置门。

| 真实动作与符号 | 本动作需要 | 插入/传参位置与无需的项 |
| --- | --- | --- |
| stageRuntimeCliMain→run:draft→stageRuntimeMain artifact:1746–1763 | 已启动Node及task存储/写目标本身合法 | 不加载OCR/provider/Ego/anysearch/npm安装探测，不改变草稿保存 |
| doctor/status:1719/1725 | 当前workspace/task可读；doctor的detectOcr只报告 | 缺OCR/Ego不阻断；doctor/status可报告各缺项，不启动provider |
| verify:execute→capture-tests:1765 | 本次明确argv本身所需工具 | 由被采命令保实际缺工具退出，不对全部verify预先要求浏览器或OCR |
| run:execute→phase_progress/terminal_assessment_ref:1833–1837 | task事实输入 | 不新增OCR/Ego探测，不把记录动作当业务执行 |
| review:record→recordTaskReview→prepareTaskBoundBuildCodeReviewBundle:668–682 | 当前审查配置、OCR与所选provider路径 | 在loadConfig调用显式传hostConfigPath；只在真实dispatch前probe OCR/provider，不要求Ego/anysearch |
| confirm/authorize:1803/1820 | 原答复/授权及该Git操作真实目标 | 不要求OCR/Ego；Git探测归实际stage-close动作，不在写授权时执行Git |
| onboard --check/--dry-run/--apply | Node>=24、布局/宿主目标、所需配置 | 只按计划动作探测；tool缺项给来源/下一步，非全局挡所有入口 |
| installRunnerRelease/未来安装说明 | Node>=24、npm、git、标准runner/bundle和明确隔离目标 | 调现入口前分别探测npm/git；保npm失败/权限/原始启动错误 |
| 本次浏览器场景/搜索动作 | Ego及anysearch只在相应真实动作依赖时 | 不给stage-runtime编造浏览器/搜索public子命令；由已加载技能真实consumer核依赖 |

P2在prepareTaskBoundBuildCodeReviewBundle原`loadConfig({requestedStage,...})`
调用增加hostConfigPath，由storage-root的现路径owner供给，保可注入loadConfig接缝。
新onboard/config-bootstrap可导入宿主runtime；独立可搬的wh-review脚本不反向import宿主。
裸wh-review doctor仍默认HOME/.config/workflowhub/config.json；XDG不同不能说全入口统一。
onboard/precheck/README必须提示该默认限制及从WorkflowHub显式传参入口运行的方法，
不复制两份有效配置；真实caller case核XDG有效、HOME故意无文件时实际loadConfig参数。

### 配置模板至少展示哪些合法非敏感结构？

模板是一份待填的公开结构，路径和provider由真实安装来源提供，不写真实用户值。

```json
{
  "task_dir": "<用户选定的绝对任务根>",
  "third_review": {
    "command": ["<现有3rd-review可执行文件绝对路径>"],
    "config": "<现有3rd-review配置绝对路径>",
    "attachment_root": "<该配置已allowlist的真实packet目录绝对路径>"
  },
  "wh_review": {"version": 2, "stages": {}, "non_stage": {}}
}
```
占位只示范JSON形状，未填不能称loader合法配置。填值来源逐项提示：
command是已装broker CLI的非空string/argv；config是现3rd-review regular file；
attachment_root是real目录且3rd-review.attachment_roots内sources含workflowhub固定packet源。
stages/non_stage路由由现用户已选provider ID补，provider/model定义只归3rd-review配置，
不复制providers或profiles。缺对象/命令/文件/目录/allowlist分别点名下一步，
坏JSON与不支持v2保持原字节；不自动猜路径或把空路由当已配置审查。

## 怎么验证？

先冻结本段目标行为，再用同一命令保存RED/GREEN；独立消费才给效果结论。

```bash
node node_modules/vitest/vitest.mjs run runtime/distribution/config-bootstrap.test.mjs runtime/distribution/precheck.test.mjs tests/contract/onboard-release.test.mjs tests/contract/precheck-entry.test.mjs
```

该命令是计划；具名预写测试按本轮授权补写，实际结果以后附原件为准，其它完整行为测试仍未执行，不冒RED或GREEN。
实施owner先落可收集目标测试，setup/导入/空收集故障只记原失败，不当目标RED。
真实接入CLI在受控用户冲突/坏配置下未给具名结果，或check/dry-run改变用户字节；测试先收集成功并走到该行为assertion，
文件/导入不存在不算RED。
同CLI按Appendix A验收2/9表现可重复接入和具名失败，真正两家宿主能发现并调用安装入口；缺项仅停依赖动作。
自动检查只证其断言覆盖；独立方法/宿主消费者按Appendix A原条件复放。
S/M/L沿spec提案：本段S受控配置加M真实双宿主，不是用户已选数据策略。
正式执行经task.captureCommand/appendRecord保存argv/cwd/exit/signal/time/raw-ref。
目标测试冻结后改断言走同卡TCR与独立批准；只读声明不冒物理隔离已建立。

## 每张任务卡怎么写？

本段只有一个用户可感知增量，同交付的创建、实现、测试与交接留在一张卡内。

### 任务 2：新维护者能安全配置和重复接入

为什么做：当前没有本卡接入CLI/模板/precheck；storage-root按XDG，
审查loader默认HOME但已支持显式hostConfigPath；现v2禁止profiles/priority，本卡按全局验收补消费者拿不到的结果。
交付什么：维护者从已声明根检查、计划或执行接入，唯一配置路径可读；用户冲突和缺项指明下一步；失败保具名原因和原始输出。
不做什么：受控CLI测试不证明实际宿主发现、外部search或审查服务成功；双宿主结果分别记；本段不做版本三态、不代装外部工具、不触Git安装器。
前置：P1先交move-map当前登记和可执行生命周期范式，再从当前源开始；当前草稿仍待计划真实确认。
怎么做：从上表第一条首改路径开始，按下面有序动作切穿真实输入、方法/接口、测试和消费者。
步骤1：先读storage-root的workflowHubConfigPath，明确导出/复用同一路径计算，不新写第二XDG规则；
config-bootstrap以该路径读取，先区别无文件、坏JSON、合法缺键和不支持的审查配置。
步骤2：模板必须包含spec已列third_review三字段和v2路由结构；task_dir需实际绝对根，敏感key由用户已有渠道提供。
在prepareTaskBoundBuildCodeReviewBundle:681调用loadConfig时显式传同一路径hostConfigPath，第三方provider定义仍归3rd-review config；
v2路由保stages/non_stage，不恢复profiles/priority，不重做迁移。
步骤3：最小补齐先计算动作，再用原子写和唯一备份；冲突不覆盖，权限不足/写失败保路径、原始原因与恢复命令，不回显key。yaml只做非生效说明。
步骤4：新增CLI先实现check/dry-run/apply的同一动作计划：package-root/target必须明确绝对路径；默认用户级两类宿主路径，
项目级需显式目标。用户真实文件冲突保字节，坏软链按具名计划替换，二次apply报告no-op；apply只做声明软链/非敏感配置。
步骤5：precheck按动作需求探测配置、OCR、provider、Ego、anysearch；真实入口委托前输出具名缺项/来源/下一步，
无关doctor/status/draft不被审查工具缺失挡住。Ego/anysearch不静默回退，OCR不可用不换执行者。
步骤6：测试安装夹具复用现buildSkillBundleRelease/buildRunnerRelease及必要的installRunnerRelease，
后者只在明确本次隔离目标中搭建并单列npm/Git副作用；接入命令本身禁调用安装器。先定受控行为断言再实施；隔离HOME/XDG/PATH，不动真实配置。
真实宿主调用用其已装CLI和隔离skill位置，从安装路径加载一条工作流入口，记录实际argv/版本/输出；固定输入只证受控失败，不冒宿主或服务通过。
步骤7：新模块/CLI建立前更新move-map，列config-bootstrap→onboard/precheck、
precheck→onboard/stage-runtime的真实调用与测试；只有消费者迁移并无当前调用时退役，历史原件保留。
怎么验收：运行本卡范围命令并由独立上下文消费真实产物；效果按Appendix A，不把exit代效果。
证据：本卡RED/GREEN及独立消费原件放任务quality下，计划位置不冒已产出。
下游（含何时停）：P4完整发布作者、P5文档作者与新维护者读取现交付；覆盖用户字节、回显敏感值、默认猜provider、
未知v2形状或宿主不可用时停止对应写/宿主路径；配置与CLI回P2原writer，真实资源由宿主/环境owner补，原文件/失败capture保留。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T002
- **来源 / FR / AC**：R-002、R-003、R-013、R-014、R-015、R-022、R-024；D-002/003/015/018；ADR-001/004；FR-C10-003、FR-C10-004、FR-C10-007；AC-C10-2、AC-C10-009；结果为新维护者能安全配置和重复接入，失败和保留强度沿Appendix A。
- **输入**：当前spec/decision和已合主线具名源；producer为本段唯一writer，consumer为P4完整发布作者、P5文档作者与新维护者；独立测试在实现就绪后取得当前产物和原始输出。
- **文件 / 符号**：`runtime/evidence/storage-root.mjs`；`runtime/distribution/config-bootstrap.mjs`；`runtime/distribution/precheck.mjs`；`runtime/distribution/config-bootstrap.test.mjs`；`runtime/distribution/precheck.test.mjs`；`tools/cli/onboard-release.mjs`；`tools/cli/stage-runtime.mjs`；`config/workflowhub.config.template.json`；`config/workflowhub.yaml`；`tests/contract/onboard-release.test.mjs`；`tests/contract/precheck-entry.test.mjs`；`docs/architecture/move-map.json`；符号：workflowHubConfigPath/resolveStorageRootDetails；config-bootstrap/precheck/CLI导出为本卡拟新增接口，开工固定真实签名。
- **动作**：从上表第一条首改路径开始，按下面有序动作切穿真实输入、方法/接口、测试和消费者。；步骤1：先读storage-root的workflowHubConfigPath，明确导出/复用同一路径计算，不新写第二XDG规则；；config-bootstrap以该路径读取，先区别无文件、坏JSON、合法缺键和不支持的审查配置。；步骤2：模板必须包含spec已列third_review三字段和v2路由结构；task_dir需实际绝对根，敏感key由用户已有渠道提供。；在prepareTaskBoundBuildCodeReviewBundle:681调用loadConfig时显式传同一路径hostConfigPath，第三方provider定义仍归3rd-review config；；v2路由保stages/non_stage，不恢复profiles/priority，不重做迁移。；步骤3：最小补齐先计算动作，再用原子写和唯一备份；冲突不覆盖，权限不足/写失败保路径、原始原因与恢复命令，不回显key。yaml只做非生效说明。；步骤4：新增CLI先实现check/dry-run/apply的同一动作计划：package-root/target必须明确绝对路径；默认用户级两类宿主路径，；项目级需显式目标。用户真实文件冲突保字节，坏软链按具名计划替换，二次apply报告no-op；apply只做声明软链/非敏感配置。；步骤5：precheck按动作需求探测配置、OCR、provider、Ego、anysearch；真实入口委托前输出具名缺项/来源/下一步，；无关doctor/status/draft不被审查工具缺失挡住。Ego/anysearch不静默回退，OCR不可用不换执行者。；步骤6：测试安装夹具复用现buildSkillBundleRelease/buildRunnerRelease及必要的installRunnerRelease，；后者只在明确本次隔离目标中搭建并单列npm/Git副作用；接入命令本身禁调用安装器。先定受控行为断言再实施；隔离HOME/XDG/PATH，不动真实配置。；真实宿主调用用其已装CLI和隔离skill位置，从安装路径加载一条工作流入口，记录实际argv/版本/输出；固定输入只证受控失败，不冒宿主或服务通过。；步骤7：新模块/CLI建立前更新move-map，列config-bootstrap→onboard/precheck、；precheck→onboard/stage-runtime的真实调用与测试；只有消费者迁移并无当前调用时退役，历史原件保留。
- **输出 / 失败**：维护者从已声明根检查、计划或执行接入，唯一配置路径可读；用户冲突和缺项指明下一步；覆盖用户字节、回显敏感值、默认猜provider、未知v2形状或宿主不可用时停止对应写/宿主路径；配置与CLI回P2原writer，真实资源由宿主/环境owner补，原文件/失败capture保留。
- **边界 / 禁止改动**：本段写集之外只读；全局底座/PRD/上游材料/旧报告不可写，防第二owner和历史漂白。
- **依赖**：P1
- **测试层级 / 技能**：当前spec测试面；配置/CLI接口/双宿主真实接入；主技能backend-testing为build-plan预判，实际build-code按真实diff选；UI本段不适用，真实页面在P6。
- **场景 / 夹具或服务**：干净目标check/dry-run/apply/apply；用户同名文件；断链；不可写目录；坏JSON/合法缺键/含旧profiles；XDG与HOME不同；项目级只写显式项目；五类缺项及无关动作；双宿主真实发现/调用及删链失效再装；搭建/清理同进程，原始输出外置。
- **预写测试**：当前actual caller未向loadConfig传XDG hostConfigPath的断言已到达；loader显式完整结构及坏配置拒绝保基线。新config-bootstrap/precheck/onboard尚无seam，缺补键/原子备份/双宿主/Node/npm/Git动作正反的目标RED。
- **可观察接缝**：onboard/stage-runtime真实CLI输出及宿主从安装路径调用；漏掉的范围见覆盖上限。
- **RED/GREEN 门禁命令**：`node node_modules/vitest/vitest.mjs run runtime/distribution/config-bootstrap.test.mjs runtime/distribution/precheck.test.mjs tests/contract/onboard-release.test.mjs tests/contract/precheck-entry.test.mjs`
- **预期退出码**：RED nonzero; GREEN 0；目标assertion到达前的setup错误不是RED。
- **RED 目标失败**：ORACLE-SAFE-ONBOARD；真实接入CLI在受控用户冲突/坏配置下未给具名结果，或check/dry-run改变用户字节；测试先收集成功并走到该行为assertion，文件/导入不存在不算RED。
- **RED 证据**：actual: `quality/tests/2026-11-16-049-c10-repair-targeted-contract-tests.output`中XDG显式路径断言失败；新配置/预检/接入seam的RED仍未取得。
- **GREEN 判定器**：ORACLE-SAFE-ONBOARD；同CLI按Appendix A验收2/9表现可重复接入和具名失败，真正两家宿主能发现并调用安装入口；缺项仅停依赖动作；具名反例不得被当成功。
- **证据**：planned: `quality/tests/p2-t002-green.output`；planned: `quality/evidence/p2-safe-onboarding-effect.md`；成本类别为命令级/文件级及独立语义读回，具体七字段见Appendix A。
- **覆盖上限**：受控CLI测试不证明实际宿主发现、外部search或审查服务成功；双宿主结果分别记；本段不做版本三态、不代装外部工具、不触Git安装器。
- **停止 / 恢复**：覆盖用户字节、回显敏感值、默认猜provider、未知v2形状或宿主不可用时停止对应写/宿主路径；配置与CLI回P2原writer，真实资源由宿主/环境owner补，原文件/失败capture保留。
- **测试变更请求**：无已发生变更；新目标测试冻结后如需改断言，原writer交独立审查批准并保原oracle。
- **完成**：前置（不作完成条件）：范围命令可收集并留真实exit/raw。完成条件（只写效果）：独立执行者按Appendix A首判AC-C10-2、AC-C10-009的真实效果及反例，读回原件并交下游；语义未执行记incomplete并保判定者/协议/计划落点；当前计划未实施，不把本卡声明填成pass。

裸wh-review默认只看HOME路径；自定义XDG时提示使用WorkflowHub已显式传参caller。
独立技能不import宿主runtime，不自动复制两份配置；README必须披露这一限制。

## 下一消费者拿什么继续？

P4完整发布作者、P5文档作者与新维护者取得本段真实当前字节、适用原件和未完成条件，再做自己的增量。
交接入CLI参数/结果/冲突语义、配置模板及真实双宿主原件；P4只追加版本消费，P5按实测命令写README。
读不到具名产物时保具体owner/影响/恢复，不把来源摘要当执行证明。

## 任务编号怎样对照？

这里只定位本段卡片，不复制执行状态。

| 正文 | 机器编号 | 唯一交付 |
| --- | --- | --- |
| 任务2 | T002 | 新维护者能安全配置和重复接入 |

## 机器字段（校验器用，人可跳过）

- **全局规格**：`spec.md#实现设计（全局权威）`
- **写入集**：`runtime/evidence/storage-root.mjs`；`runtime/distribution/config-bootstrap.mjs`；`runtime/distribution/precheck.mjs`；`runtime/distribution/config-bootstrap.test.mjs`；`runtime/distribution/precheck.test.mjs`；`tools/cli/onboard-release.mjs`；`tools/cli/stage-runtime.mjs`；`config/workflowhub.config.template.json`；`config/workflowhub.yaml`；`tests/contract/onboard-release.test.mjs`；`tests/contract/precheck-entry.test.mjs`；`docs/architecture/move-map.json`
- **依赖**：P1
- **消费者**：P4完整发布作者、P5文档作者与新维护者
- **gate_cmd**：`node node_modules/vitest/vitest.mjs run runtime/distribution/config-bootstrap.test.mjs runtime/distribution/precheck.test.mjs tests/contract/onboard-release.test.mjs tests/contract/precheck-entry.test.mjs`
- **oracle**：ORACLE-SAFE-ONBOARD
- **evidence_path**：planned: `quality/evidence/p2-safe-onboarding-effect.md`
- **STOP**：覆盖用户字节、回显敏感值、默认猜provider、未知v2形状或宿主不可用时停止对应写/宿主路径；配置与CLI回P2原writer，真实资源由宿主/环境owner补，原文件/失败capture保留。
- **覆盖 AC**：AC-C10-2、AC-C10-009
- **Done**：前置（不作完成条件）：目标命令/原件可读。完成条件（只写效果）：AC-C10-2、AC-C10-009在本段由独立执行者按同一判据首次判断，效果/反例和原件引用逐条写任务facts；当前仅计划未执行，机器目标RED/GREEN未取得不报通过；语义判定未执行记incomplete，owner为本段独立测试/审查者，协议见验收节，计划证据为`quality/evidence/p2-safe-onboarding-effect.md`；外部资源不可得须具名原因与恢复。
