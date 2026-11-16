# C10 发布与接入规格：主线同步后的可审草稿

给开发、独立验收者与用户一份能定位首改、输入、判定和失败恢复的规格。
Phase 是可独立交付验收的一段，scratch 是用完回收的临时工作目录。
结构图描述代码关系，语义图描述文档内容含义。
本稿未获当前计划确认；本轮写材料并补具名预写测试，没有生产实现或Git交付；未取得目标RED逐卡保未完成。

> 材料导航（非权威）：先读一页结果与六段大纲；实施读全局设计及所属Phase；
> 验收只读Appendix A原判据；追源读Appendix B与decision-log原ref。
> 固定例外：实现设计及机器标题、精确路径/命令/表格保原字面。

## 这是什么，给谁用？

让拿到 workflowhub 文件夹的新维护者能接入宿主、补配置、查缺项并从包运行。
产品目标归当前PRD C10卡/US10，已选取舍归decision-log历史决定。
本规格把已合主线的新事实和两项新需翻成可审实现提案。

## 一页看懂：谁要什么结果，怎么算通过？

使用者拿到的是可对账版本包和一条可重跑的接入路。
维护者还得到可回收临时工作命令及自动到达既有收尾的方法。

- 需求1：支持矩阵按真实宿主/工具事实说明边界。
- 需求2：完整发布物从既有闭包构建，只有声明使用内容。
- 需求3：接入可检查、可试运行、可执行，重复执行保护用户字节。
- 需求4：唯一用户JSON配置按现v2 owner读取，坏/缺/不支持各有提示。
- 需求5：用户已选1.0.0，由当前P4写主提案在计划确认后落盘，更新结论对应真实来源。
- 需求6：两类清单与来源/兼容矩阵逐项可回读。
- 需求7：陌生维护者只凭一份README使用和排障。
- 需求8：最终安装包加载真实入口并完成实际业务链。
- 需求9：沿途边做边验，末段给六层事实与缺口。
- 需求10：临时资源从创建即有owner、回收和原件保留边界。
- 需求11：终末真实调用完整stage-close，含文档语义图及条件Git链。
- 需求12：C10自身读回C12新版两页计算值，历史缺口仍保留。

验收1至13只有Appendix A定义；正文只定位场景和消费者。

## 为什么做，给谁用？

当前有分发和临时资源底座，但没有本卡的接入命令及完整终末调用接线。
新维护者不能靠“源码里有方法”知道如何开始。
旧稿又把已交上游、已选版本和旧接口写成等待项，必须更新。

### 当前真实输入是什么？

当前源码及具名上游报告是设计输入，不是C10已验收证据。

- 事实1：主线已合入，八材料逐字恢复，见任务原件003及本次HEAD。
- 事实2：现publisher复制前后核源码稳定，validator从声明重建闭包。
- 事实3：现runner安装有npm ci和git init/add/commit副作用；软链接入另行编排。
- 事实4：storage-root按XDG读取task_dir；wh_review v2拒绝profiles/priority。
- 事实5：package及锁文件仍0.0.0，用户已选1.0.0，尚未实施落盘。
- 事实6：现temp-dir有dispose、退出信号及marker/死PID受控回收。
- 事实7：stage-close已有完整链，build-code终末依赖/末步/catalog漏接。
- 事实8：C09报告/交接已交，产品前十项未过；旧全等待事实过时。
- 事实9：C11七项关闭保G8等残留；C12报告加057/058/059支持005/006/009。
- 事实10：C12的004、业务链及页面部分质量仍未测/失败，不能泛称全绿。
- 事实11：本卡生产是CLI/方法；末段实际观察两页，所以该段适用UI验收。
- 事实12：真实宿主、业务live服务、外部版本与当前费用条件尚未执行核验。

事实状态、来源和受影响项见Appendix B；旧数字不作当前事实。

## 做成什么样？

每个旅程有真实对象与失败回原owner的位置，成功判据留在Appendix A。

| 场景 | 角色和输入 | 可观察结果与失败归属 | 判据/首判 |
| --- | --- | --- | --- |
| 场景1 | 新维护者拿到文件夹和受控用户目录 | 发现安装位置入口；冲突/坏配置回接入owner | 验收2、9；阶段2 |
| 场景2 | 发布维护者读catalog/reuse/现版本及外工具 | 当前包能按源对账；缺闭包/版本冲突回发布owner | 验收1、3、5；阶段4 |
| 场景3 | 独立冷读者只看成稿README | 找到下一命令和失败恢复；需提示回文档owner | 验收4；阶段5 |
| 场景4 | 规划作者为本卡夹具写临时命令 | 可再生物回收、原始失败保留；泄漏回方法owner | 验收11；阶段1 |
| 场景5 | build-code终末交真实final-report及授权来源 | 无逐步提醒继续可做收尾；失败回caller或既有owner | 验收12；阶段3 |
| 场景6 | 安装后调用真实方法和T018A/P06-7所指服务 | 请求处理、必要持久结果和UI读回；环境缺失回服务owner | 验收6；阶段6 |
| 场景7 | C10用C12重建入口读新版两页 | 自身计算gap与版本可回读；不抹旧board改前缺口 | 验收13；阶段6 |
| 场景8 | 独立读者消费沿途原件与最终包 | 质量/六层事实逐条可追，缺证据回原producer | 验收7、8、10；沿途及阶段6 |

默认、空输入、加载/执行、错误、取消、权限、并发和重入均在所属卡列正常/反例。
CLI不设假loading页面；页面瞬时pending沿真实两页原件保未测边界。

## 打算怎么做？

直接复用现owner，新增的只是本卡真实消费者需要的薄编排。

### 发布和接入怎样分工？

接入脚本检查/计划/执行共用一次动作计算，命令行仅负责参数和输出。
用户默认软链到.claude/skills和.agents/skills，项目级须显式目标。
既有publisher/validator保持原安全规则；新增软链只在其外的宿主适配层。
完整发布入口保两个标准内层根，调用真实builder/validator；外层适配物独立。
清单/矩阵、README和新增CLI进入最外层交付声明，不改内部闭包算法。
现installer只把bundle按已核同字节规则复制进runner；外层物不混进strict bundle。
构建输出是交付包，staging才是可删中间物，正式证据从开始外置。

### 最终发布根和安装参数怎样对应？

保留两个标准内层根，外层适配物不喂给严格bundle validator。

| 角色/真实参数 | 相对最终releaseRoot的路径 | 内容与动作边界 |
| --- | --- | --- |
| releaseRoot | 构建--output指定的绝对空目标 | 外层交付根，不能作为skillBundleRoot |
| skillBundleRoot | skill-bundle/ | buildSkillBundleRelease原产物，保持标准文件集；strict validator只收此根 |
| runnerRoot/安装后packageRoot | runner/ | buildRunnerRelease原产物；installRunnerRelease在此npm ci并复制bundle文件/manifest；之后真实caller从此根加载 |
| 外层接入入口 | tools/cli/onboard-release.mjs | 只用Node内建模块和明确runtimeRoot加载runner内配置/预检owner；不把宿主runtime反向import进wh-review技能 |
| 外层版本模块 | runtime/distribution/update-check.mjs | Node内建模块薄比较；供外层onboard入口，不复制配置owner |
| 外层说明/清单 | README.md、repo-skills.manifest.json、external-skills.manifest.json、docs/release-support-matrix.md、docs/external-skills-compat-matrix.md | 构建白名单，不放入两个标准内层根 |
| 包内宿主适配链接 | .agents/skills、.claude/skills | 相对目标均为../runner/skills；安装后runner/skills才可消费；链接不进入标准bundle根 |
| 用户/项目宿主目标 | 用户或显式项目的.agents/skills、.claude/skills | onboard算path.relative后的已授权链接到runner/skills，保用户冲突 |

构建先对最终布局的skill-bundle/和runner/实际调用原validator。
安装明确调用`installRunnerRelease({releaseRoot:runnerRoot,skillBundleRoot})`，
不是`installRunnerRelease({releaseRoot,skillBundleRoot:releaseRoot})`。
该现入口先校验标准bundle，复制每个bundle文件及skill-bundle.json到runner，
再npm ci --ignore-scripts --omit=dev，重新校验runner并写.gitignore、git init/add/commit。
这次内嵌是现安装器行为，不能再拿已安装runner当strict skillBundleRoot。
接入命令本身只建链/补配置，不调用安装器；缺安装依赖给上述明确入口和副作用说明。
安装器需要的npm/Git和隔离目标授权由实际执行方核，当前未执行，测试只记录这些边界。
标准bundle保持不变，不放宽现validator、不移植第二安装算法。

允许来源是当前publisher重建的运行闭包，加上表外层具名使用物。
最终组合中混入开发态文件即失败，包括specs/、quality/、任意测试报告/历史任务包、
coverage/、开发用tests/、无使用声明的.git/或本仓私人工作目录。
不是盲禁目录名：被真实运行声明依赖的技能参考、模板、方法或脚本必须保留；
若必要闭包与开发排除冲突，保原文件/失败/来源交原owner判断，不删闭包求绿。
负例要在最终组合物外层及内层各故意放入一个开发spec、quality日志、测试产物，
即使把它写进外层清单也必须拒绝，不能仅测清单集合相等。

### 配置和版本怎样复用？

WorkflowHub新增caller按现XDG owner显式传路径；裸wh-review默认HOME限制必须披露。
模板满足task_dir绝对路径及wh_review v2/third_review现合同。
provider定义归3rd-review配置，WorkflowHub只持路由，不恢复profiles双写。
坏JSON保原文件，缺非敏感键才最小合并，冲突不覆盖，原子写前保备份。
旧格式只报不支持及原owner现迁移说明，不重做v1→v2迁移。
用户U-001只选择1.0.0。P4实施者同步package/lock是本版可审写主提案，
待当前计划确认并由原实施授权覆盖，不把该分工误归用户原话或另加独占手改任务。
更新比较安装与明确来源目录/版本事实，无法取得来源就报告无法检查。

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

### 临时资源怎样保护原件？

生命周期规则只在原spec-plan/Phase模板承接，build-plan只导航消费。
Node使用现createTrackedTempDir并在同进程finally dispose。
取消先等应用drain及provider settle，SIGKILL不承诺trap运行。
下次受控清理只核本任务/用途精确prefix、marker、UID、PID和目录身份。
普通失败原输出从一开始capture到task库，保留后再dispose可再生scratch。
provider原件按自有TTL保留，未知唯一字节不归scratch清理。

### 自动收尾怎样到达最终字节？

终末caller在原reflection/最终报告之后实际加载并调用stage-close。
依赖与catalog同次对齐；步数、公共七类命令和正式fact owner不变。
规范写入结束后委派知识owner，结构图与新增/变更文档语义分别读回。
收费文档miss沿原合同取精确范围许可；未批时保文档未更新并继续其它安全交付。
图allowlist随实际最终提交及PR/merge/push；归档再产新字节只补相关图核查和提交。
排除图产物自身再抽取，终止条件是实际源集合已消费且交付字节已读回。
PR可用走唯一精确open PR或创建，先回URL同流继续；无PR保失败走既有退路。
持续Git授权按当前分支/HEAD/目标record/consume，最终物理范围仍统一确认一次。
失败不切写路由、不强推、不删main/existing或未知字节，重入不重复PR/merge。

### 外部工具按什么范围检查？

工具档位沿历史用户原选，实际能力来源仍由各工具owner维护。

| 档位 | 工具 | 当前检查及缺项语义 |
| --- | --- | --- |
| 必须 | Node/npm/git | 当前build-code声明Node>=24，实测版本留原件；不假定24.4 disposable |
| 必须 | OCR/provider CLI | OCR>=1.12.9；可用路由按现3rd-review，缺失如实unavailable，不换执行者 |
| 必须 | Ego/anysearch | Ego来源citrolabs/ego-lite；anysearch端点/key；缺项提示先配，停依赖动作 |
| 可选 | agent-browser/browser-use legacy | 按现网关条件，agent-browser仅允许人工诊断/规定回退；不冒已测 |
| 只提示 | graphify/multica/gh | 一般使用可缺；进入知识更新/PR实际动作时沿该方法核所需资源 |

许可unknown沿个人研究已选边界保来源/notice，不凭相邻LICENSE补grant。

## 阶段大纲：几个阶段，各交什么？

建议六段，大纲和预算尚未确认；本轮草稿授权允许完整写完后交审。

| 阶段与文件 | 独立交付 | 首判导航 | 真实依赖 | 下游/活动报价 |
| --- | --- | --- | --- | --- |
| 阶段1：phases/P1-scratch-lifecycle.md | 临时资源有生命周期 | AC-C10-011、AC-C10-010（沿途首判） | none | 后续对应Phase；35分钟provisional |
| 阶段2：phases/P2-safe-onboarding.md | 配置与接入安全可重复 | AC-C10-2、AC-C10-009 | P1 | 后续对应Phase；80分钟provisional |
| 阶段3：phases/P3-terminal-close.md | 终末自动承接完整收尾 | AC-C10-012 | P2 | 后续对应Phase；75分钟provisional |
| 阶段4：phases/P4-versioned-release.md | 完整1.0.0发布物可对账 | AC-C10-1、AC-C10-3、AC-C10-5 | P1、P2、P3 | 后续对应Phase；90分钟provisional |
| 阶段5：phases/P5-readme-coldread.md | 陌生维护者能照README使用 | AC-C10-4 | P4 | 后续对应Phase；45分钟provisional |
| 阶段6：phases/P6-installed-acceptance.md | 安装后真实验证与分层结论 | AC-C10-6、AC-C10-7、AC-C10-8、AC-C10-013；全AC汇总 | P1、P2、P3、P4、P5 | 用户与维护者；135分钟provisional |

阶段2把配置与接入合并，因为同一维护者必须同时取得才有安全接入结果。
阶段4把包、清单、版本合并，因为它们共同判一个完整可对账发布物。
阶段1/3各有独立消费者效果，阶段5消费固定接口独立冷读，符合拆分条件。
阶段6真实旅程与六层结论共同交给发布读者；只读汇总不冒端到端执行。
这按模板S1–S4核实际判据/产物/消费者，不按文件或原九包机械拆分。
第0阶段只复用测试环境准备，不单列Phase或称交付。

## 谁先谁后？

临时资源、接入、终末方法可各自交付，完整包消费这三项后再交README与安装验证。

- 阶段1、2、3各有独立结果；新增文件均须先登记同一move-map，实际写入按1→2→3串行。
- 阶段4等阶段2接入入口、阶段3实际依赖和阶段1可执行夹具规则。
- 阶段5等完整包和命令成为固定输入；阶段6等最终README并重建一次最终包。
- onboard-release先由阶段2建，阶段4只追加版本检查；其接口是明确真实依赖。
- move-map先由阶段2登记配置/接入，再由阶段4登记打包/更新，按边串行。
- catalog只由阶段3修stage-close登记；阶段4清单只读，源字段确需修改回阶段3原writer。
- README只由阶段5写；builder在阶段4从实际当前README复制，阶段6只重建不改builder。

每次共享边界由先写者交回现字节/原件，后写者核身份后只改自己增量。
冲突回原writer，无法读回保unknown，不建协调状态。

## 还有什么没定？

待决定的是当前计划及预算/数据策略，版本值已经选定。

- 未决1：当前六段大纲/计划、S/M/L与预算来源未确认；owner为主会话/用户。
- 未决2：真实宿主和业务live输入当时可用性未核；owner为阶段2/6执行者与服务owner。
- 未决3：收费语义抽取精确范围许可未发生；owner为知识owner，未批只停新增抽取。
- 未决4：PRD业务已验表述冲突；owner为原PRD作者，C10真实链不降为报告读取。

这些缺项只限制对应承诺；授权内草稿、自查和审查回修继续。

## 实现设计（全局权威）

现owner保持唯一权威，新增入口和模块必须先登记职责及真实消费者。

### 代码锚点

以下签名/字段于2026-11-16用read实读；行号是定位快照。

| 原能力 | 逐字接口/字段 | 当前consumer与本卡用法 |
| --- | --- | --- |
| `runtime/distribution/skill-bundle-release.mjs:493` | `buildSkillBundleRelease({ packageRoot, outputDir, runnerContractMajor = 1, runnerContractMinMinor = 0, } = {})` | 真实publisher/validator；薄builder直接消费，不改算法 |
| 同源:570 | `validateSkillBundleRelease({ releaseRoot })` | 删除文件及清单项仍重建声明；内部文件拒绝不安全软链 |
| `runtime/distribution/runner-release.mjs:126/149` | `buildRunnerRelease({ packageRoot, outputDir, runnerContractMajor = 1, runnerContractMinor = 0, } = {})；validateRunnerRelease({ releaseRoot, skillBundleManifest } = {})` | 当前联合安装；阶段4复用构建与校验 |
| 同源:185 | `installRunnerRelease({ releaseRoot, skillBundleRoot, env, run = spawnSync } = {})` | 带npm/Git副作用，接入路径禁调用，隔离安装单独说明授权 |
| `runtime/evidence/storage-root.mjs:57` | `resolveStorageRootDetails({ env = process.env, home = homedir() } = {})` | 现XDG/task_dir源；阶段2只窄扩配置接入 |
| `skills/wh-review/scripts/third-review-host-config.mjs:483` | `loadTrustedThirdReviewConfig({ hostConfigPath: configuredPath = hostConfigPath(), requestedStage = null, requestedTrack = null, requestedReviewKind = null } = {})` | 显式传同一路径；wh_review.version=2；profiles/priority不支持 |
| `runtime/interface/temp-dir.mjs:45/88` | `createTrackedTempDir(prefix, { root = realpathSync(tmpdir()) } = {})；cleanupStaleTempDirs({ root = realpathSync(tmpdir()), prefixes = [], olderThanMs = 24 * 60 * 60 * 1000, pidAlive = isPidAlive } = {})` | 本进程返回`{path,dispose}`；只复用，未证缺口不扩大写集 |
| `runtime/task/task-handle.mjs:81/107/108` | `openTask(taskPath, expected, expectedTaskId)；appendRecord({dir,slug,ext,bytes}={})；captureCommand({cwd,slug,argv,shell,timeoutMs,signal,resolveOutputRef}={})` | 认证事实/命令唯一producer，历史immutable |
| `tools/cli/stage-runtime.mjs:1872/1930` | `stageRuntimeCliMain；run:draft→artifact` | 原公开保存及依赖动作入口；不新增public命令 |
| `workflows/build-code/SKILL.md:253、skill-deps.yaml、steps.json:202` | `closeout末步和终末final-report→关闭reader` | 阶段3补实际调用stage-close，不只写指针 |
| `tests/integration/runner-clean-install.test.mjs:79–119` | `installed draft/doctor/checker真实既有调用` | 技术基线复用，不冒双宿主/业务已通过 |
| `docs/architecture/move-map.json:1944–1976` | `runner/skill-bundle现owner与consumer登记` | 阶段2/4增量登记，不新建职责账本 |

### 接口与失败语义

命令参数及输出是设计提案，实施者先固定目标断言再写对应能力。

| 提议接口 | 输入/结果 | 失败与边界 |
| --- | --- | --- |
| node tools/cli/onboard-release.mjs --check/--dry-run/--apply --package-root=<绝对根> --target=<绝对根> | 宿主适配、配置和依赖逐项状态/下一步；可选项目目标 | 检查/试运行不写；冲突/权限/部分失败具名非零；不调Git安装器 |
| runtime/distribution/config-bootstrap.mjs | 解析路径/读取现配置/最小补齐，调用方显式传同路径 | 坏JSON保原字节；缺敏感值只提示；现v2/profile所有权不变 |
| runtime/distribution/precheck.mjs | 实际动作与环境→缺项及依赖范围 | doctor/status/draft等无关动作不受审查资源缺项阻断 |
| node tools/cli/build-release.mjs --output=<绝对空目录> | 当前根→真实bundle/runner校验后组合的交付包 | 非空目标保护；内层validator不豁免软链；同名异字节拒绝 |
| node tools/cli/build-skill-manifests.mjs --check | catalog/reuse/外部唯一人工源→生成/对账 | 解析/差异失败点名，清单不是第二source |
| runtime/distribution/update-check.mjs | 安装版本+明确来源版本→有/无/无法检查 | 非法/不可读不冒无更新，不额外做网络更新服务 |
| build-code终末方法 | 真实报告/授权/ref及目标→stage-close既有方法结果 | 未确认只停对应破坏动作；各Git/图/清理结果分别真实 |

#### 全局文件边界

下面是未来实施写集；本轮实际仅改本任务四类正式材料。
所有新增生产/测试文件在创建前，由所属Phase writer在同一move-map登记职责、owner、consumer、测试及替代/删除条件。

新增：
- `tests/contract/phase-scratch-lifecycle.test.mjs`
- `runtime/distribution/config-bootstrap.mjs`
- `runtime/distribution/precheck.mjs`
- `runtime/distribution/config-bootstrap.test.mjs`
- `runtime/distribution/precheck.test.mjs`
- `tools/cli/onboard-release.mjs`
- `config/workflowhub.config.template.json`
- `tests/contract/onboard-release.test.mjs`
- `tests/contract/precheck-entry.test.mjs`
- `tests/contract/terminal-close-consumption.test.mjs`
- `tools/cli/build-release.mjs`
- `tools/cli/build-skill-manifests.mjs`
- `runtime/distribution/update-check.mjs`
- `runtime/distribution/update-check.test.mjs`
- `repo-skills.manifest.json`
- `external-skills.manifest.json`
- `docs/release-support-matrix.md`
- `docs/external-skills-compat-matrix.md`
- `tests/contract/release-tree.test.mjs`
- `tests/contract/skill-manifests.test.mjs`
- `tests/acceptance/installed-release-flow.test.mjs`

修改：
- `skills/spec-plan/SKILL.md`
- `skills/spec-plan/templates/phase-template.md`
- `workflows/build-plan/SKILL.md`
- `runtime/evidence/storage-root.mjs`
- `tools/cli/stage-runtime.mjs`
- `config/workflowhub.yaml`
- `docs/architecture/move-map.json`
- `workflows/build-code/SKILL.md`
- `workflows/build-code/skill-deps.yaml`
- `workflows/build-code/steps.json`
- `skills/catalog.yaml`
- `tests/contract/knowledge-graph-stage-wiring.test.mjs`
- `tests/contract/stage-closeout-step-contract.test.mjs`
- `tests/contract/stage-closeout-skill.test.mjs`
- `package.json`
- `package-lock.json`
- `README.md`
- `tests/acceptance/c12-update-chain.mjs`

退役：阶段2只把config/workflowhub.yaml改为非生效样例说明；不物理删历史。
DO NOT TOUCH精确底座：

- `runtime/distribution/skill-bundle-release.mjs`
- `runtime/distribution/runner-release.mjs`
- `runtime/interface/runner-contract.mjs`
- `runtime/interface/temp-dir.mjs`
- `runtime/task/task-handle.mjs`
- `runtime/interface/run-command.mjs`
- `runtime/interface/git-authorize.mjs`
- `skills/wh-review/scripts/third-review-host-config.mjs`
- `skills/stage-close/SKILL.md`
- `skills/knowledge-graph/SKILL.md`
- `CONSTITUTION.md`
- `AGENTS.md`

上游PRD/spec、provider broker/runtime、LICENSE/notice及旧review/report同属只读来源。
上表未逐字列出的保护内容不宣字节未变，状态unknown；由其原owner在确需改变前实读。
以上受保护签名/字段的本次实读记录见代码锚点；不宣未读字节相同。
除明确列入修改的三份旧接线测试，其它旧测试只读；新目标冻结后按现TCR回原owner。
现生产底座默认只复用，若真实反例证明不满足，先修材料范围再窄改，不静默扩写。

### 需求到任务追踪

原需经功能需求、唯一验收、独立任务和判定器双向定位。

| Source | FR | AC | Phase/Task | oracle |
| --- | --- | --- | --- | --- |
| R-027、R-004 | FR-C10-010、FR-C10-009 | AC-C10-011、AC-C10-010 | P1/T001 | ORACLE-SCRATCH-LIFECYCLE |
| R-002、R-003、R-013、R-014、R-015、R-022、R-024 | FR-C10-003、FR-C10-004、FR-C10-007 | AC-C10-2、AC-C10-009 | P2/T002 | ORACLE-SAFE-ONBOARD |
| R-028 | FR-C10-011 | AC-C10-012 | P3/T003 | ORACLE-TERMINAL-CLOSE |
| R-002、R-005、R-017、R-018、R-020、R-023、U-001 | FR-C10-001、FR-C10-002、FR-C10-005、FR-C10-006 | AC-C10-1、AC-C10-3、AC-C10-5 | P4/T004 | ORACLE-VERSIONED-RELEASE |
| R-002、R-003、R-013、R-015、R-018、R-022、R-024 | FR-C10-007 | AC-C10-4 | P5/T005 | ORACLE-README-COLDREAD |
| CARD-C12-004、R-026 | FR-C10-012 | AC-C10-013 | P6/T006 | ORACLE-CROSS-TASK-READBACK |
| R-002、R-017、R-018、R-020、R-026 | FR-C10-008 | AC-C10-6 | P6/T007 | ORACLE-INSTALLED-FLOW |
| R-004、R-011、R-012、R-018、R-019、R-020、R-026、R-028 | FR-C10-009、FR-C10-011 | AC-C10-7、AC-C10-8、AC-C10-010 | P6/T008 | ORACLE-LAYERED-CONCLUSION |

过程/已完成/已声明不做项逐条去向在Appendix B，不用ID出现冒覆盖。

### 全局验证策略

各交付在本段首判，唯一末段汇总原件并补最终组合及真实旅程。
行为目标先冻结断言，RED须命中业务断言，导入/收集/环境失败另记。
本轮正式修复brief已允许必要预写测试；只写下述五份具名测试，不实施生产或改旧冻结测试。
现seam先真实运行；原本通过仅记基线，具名目标assertion失败才是RED。
尚无生产seam或缺真实环境的部分逐卡写未完成及所需夹具，不用空骨架/导入错误造RED。
纯README卡按G-2给可证伪冷读，不把混合方法/代码卡豁免。
全局共用来源对账命令为`node tools/cli/check-skill-consistency.mjs`；
各Phase的范围命令沿其唯一任务卡，不以此替真实效果。

| 测试面 | 所属首判 | 主技能/判定器 | 数据提案与覆盖上限 |
| --- | --- | --- | --- |
| 临时生命周期/方法消费 | 阶段1 | backend-testing预判；ORACLE-SCRATCH-LIFECYCLE | S：真实helper+本次sandbox；不扫历史/tmp、不证明空间节省 |
| 配置/CLI/双宿主接入 | 阶段2 | backend-testing预判；ORACLE-SAFE-ONBOARD | S配置/坏链+M真实宿主；替身不代宿主调用 |
| 终末caller/图/授权分路 | 阶段3 | backend-testing预判；ORACLE-TERMINAL-CLOSE | S隔离Git/PR与缓存+M安装方法；模拟不代远端 |
| 完整包/manifest/semver | 阶段4 | backend-testing预判；ORACLE-VERSIONED-RELEASE | M当前完整声明集；既有算法不重测无关面 |
| README语义 | 阶段5 | 独立冷读；ORACLE-README-COLDREAD | M真实包；只检查锚点不能代效果 |
| 新版页面读回/实际业务 | 阶段6 | frontend-testing/isolated-browser-qa；ORACLE-CROSS-TASK-READBACK/INSTALLED-FLOW | L为本卡声明完整最终旅程一次，不是全仓回归 |
| 独立质量/结论 | 沿途及阶段6 | 现wh-review/OCR合同；ORACLE-LAYERED-CONCLUSION | 原件一次读回；不重跑上游238/六指标 |

#### 成本从哪里来，哪些还未确认？

报价取研究005:210–220与研究004六组反例，按当前切分重算。
阶段1：验收11活动20+本段验收10首读5+准备5+重验5=35。
阶段2：验收2活动40+验收9活动15+准备10+重验15=80。
阶段3：验收12活动50+准备10+重验15=75。
阶段4：验收1活动20+验收3活动25+验收5活动25+准备10+重验10=90。
阶段5：验收4活动30+准备5+重验10=45；未重复要求现成工具重装。
阶段6：验收13活动20+验收6活动45+验收7活动15+验收8活动10+原件读回15+准备10+重验20=135。
活动操作计分钟；纯用户/审查/环境等待各记原owner及恢复条件，不混墙钟。
各段登记共享文件按真实writer串行；活动报价共35+80+75+90+45+135=460分钟，非用户预算。
`phase_budget={soft_min:unknown,hard_min:unknown,variance_threshold:unknown,source:provisional proposal}`。
`execution_budget={window_minutes:unknown,command_cap:unknown,wait_cap:unknown,retry_reserve:unknown}`。
真实来源缺失不填模板120/240/1.5；本稿不是已获批准长跑。
任务形状提案：S为配置/版本/坏链/受控进程，M为当前声明包与双宿主，
L仅最终安装真实旅程；数据字节/最长真实流程时长尚未测，由原owner补来源。
分类暂为可直接做的有界技术项与需补真实环境条件的末段，不伪定规模。

## 怎么算通过？

按Appendix A原判据逐条给当前原件和现有档位，作者不自判独立质量。

### 验收对象是什么？

本轮写的是CLI/方法规划；被验对象包含未来末段真实两页，不能全卡免UI。
原要求新增两项本身非UI；当前PRD真实流程/C12读回仍包含页面观察。
库存包括本仓CLI/方法和只读外部两页源；已接受前端新改动没有，计划观察两页。
阶段1至5不用页面/样式测试；阶段6按模板六项补UI观察与缺口。

#### 验收对象

```json
{
  "workspace": "/Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c10-release-onboarding-20261103",
  "service": "C12报告重建的隔离两页服务；实际端口由阶段6探测，非本轮已启动",
  "route": ["/simulation-board", "/sim-workbench"],
  "state": ["board empty的.inlineactions", "workbench正常显示", "安装后真实流程结果/失败"],
  "viewport": ["1440x900", "390x844"],
  "owner": "C10阶段6独立执行者及真实服务owner"
}
```

上述是可审目标对象，不证明服务健康；唯一模板函数VM检查的输入/来源/hash/结果
保存本次普通原件，不复制checker或使用旧独立checker冒当前规范。

### 证据计划怎么承接？

每卡把producer、consumer、输入提供者/时点、命令、原件与恢复写入现字段。
正式原始输出从开始经openTask.captureCommand或appendRecord进任务库。
scratch仅放可再生数据；发布最终输出保交付根；provider原件沿自有TTL。
缺件记真实尝试、卡点、owner和恢复，不靠目录快照或第二进度账本补齐。

## 测试计划是什么？

精确有界命令只在各Phase；这里定义面与证据类型，不复制另一套判据。
两独立面由不同只读执行单元核；单一README语义面一个冷读者即可，
受提示者可定位回修，最终结论由未见提示者给出，不固定要求重复全程。
末段读取一次沿途原件，只有包字节/组合/真实旅程未闭环项补验。
当前授权只含五份预写测试及针对性运行；其它计划命令仍未执行，禁止全量。

## 有什么风险和未决？

最需防止的是把上游或模拟结果当成安装后真实成功。

- 风险1：PRD业务已验冲突误导；阶段6保原report边界，服务缺失回真实owner。
- 风险2：scratch归属误判删原件；阶段1反例核marker/PID/符号链，未知保留。
- 风险3：方法仅登记未调用；阶段3独立消费者从终末复放，不用字符串充效果。
- 风险4：后置图字节未交付；阶段3核源集合与最终tree，阶段4/6安装后复读。
- 风险5：配置profiles回潮/敏感值回显；阶段2用真实v2 loader与假key反例。
- 风险6：包/软链安全冲突；阶段4保持内层validator，适配层负例拒绝越界。
- 风险7：未知预算/资源被默认同意；未决1至4保owner和恢复，不阻草稿修正。

回滚只由原writer撤自己受影响hunk，保其它改动、用户配置、原始失败和已发生事实。
既有底座反例失败先判断目标/环境/本来通过，不改validator或放宽oracle求绿。

### 本轮预写测试具体允许写什么？

修复brief授权如下五份新测试，先在本任务材料登记后创建；生产仍零实施。
此范围是本轮特定授权，不要求为此改生产move-map；未来实现新文件仍按原登记。

| 路径 | 原Phase/真实consumer与冻结对象 | 本轮可取得与暂不可取得 |
| --- | --- | --- |
| tests/contract/phase-scratch-lifecycle.test.mjs | P1/T001；现temp-dir调用者；冻结正常/异常/信号/崩溃/保留预期 | 现helper行为可实跑；独立作者按方法产命令尚需真实消费 |
| tests/contract/precheck-entry.test.mjs | P2/T002；prepareTaskBoundBuildCodeReviewBundle→loadConfig边界；冻结XDG显式参数 | 当前caller漏参数可测；新precheck/config/onboard接口尚不存在，未取这些目标RED |
| tests/contract/terminal-close-consumption.test.mjs | P3/T003；实际resolvePortableStageFiles(build-code)；冻结stage-close必须可达 | 当前声明闭包是否含stage-close可测；真实终末host与Git/图效果未取 |
| tests/contract/release-tree.test.mjs | P4/T004；真实两个builder/validator/installer；冻结标准根/污染拒绝/安装调用 | 当前内层接口可实跑；新最终composer/semver/兼容探测seam未取，不能全算GREEN |
| tests/acceptance/installed-release-flow.test.mjs | P6/T006与T007；现prepare复制根及真实HTTP/外部SQLite；冻结owned/foreign边界和具体取消恢复断言 | 先证明现guard拒绝C10 root；T007真实协议预写但缺两就绪件跳过；不实现guard、不跑browser/业务 |

这些断言的唯一冻结来源为本卡预写测试及DO NOT TOUCH声明；
未来实施writer不能改测试表达式/期望方向求绿，真实改动先走同卡TCR及独立批准。
当前新AC仍是可审草稿，测试冻结不伪造用户已批准AC。
逐卡实际命令/exit/raw与未完成step8随后追加普通执行原件，不重写旧review。

## Appendix A — 验收判据（唯一权威）

所有通过、失败和证据判据只在本附录；Phase按同一判定器给操作协议。
原八编号及009/010保持；011/012是本轮两项新需，013是有源跨任务消费。

- [ ] **AC-C10-1**：发布包包含当前声明使用内容并可独立加载。

关联：FR-C10-001、FR-C10-002、FR-C10-006；来源：R-002、R-005、R-017、R-023；ADR-001/004；
source_status=current。
首判：P4/T004；判定方式：机器可判。
验证：调用真实publisher/validator与薄入口，在空目标构建；按已核闭包检查接入、方法、文档、两类清单、矩阵与相对链接层。
通过：已声明内容可被安装端解析，包内引用不依赖旧worktree/临时根/归档/源码外缓存；软链层只在明确宿主适配层且目标在包内；插件形式继续按D-016不做。
失败：最终组合物出现未获使用声明的开发spec/quality/测试产物即失败，写进外层清单也不救；删资源同时删顶层清单项仍被既有闭包重建拒绝；绝对/越界/断链、非空输出覆盖或插件文件出现不能成功。
证据：真实构建/解析/负例原输出，不保存整目录快照。
成本：executor=阶段4独立测试；estimate_min=20；hard_cap_min=40；
resources=当前分发闭包、P2接入入口、P3终末方法；observation=发布树与负例输出；
retry_cap=1（仅可重试本地故障预留，外部不可重试仍零重试）；evidence_tier=文件级。
资源来源：复用当前源码、具名上游或隔离种子；真实资源缺失由本条执行owner核条件，
未取得不伪造。以上分钟为作者provisional报价，非用户预算或实测。
为什么不能再简：该观察已使用当前最高接缝，纯文件存在或退出码不能替代本条效果。

- [ ] **AC-C10-2**：声明支持的干净隔离目标能接入并由宿主调用。

关联：FR-C10-003、FR-C10-004；来源：R-002、R-003、R-013、R-014、R-024；ADR-001/004；
source_status=current。
首判：P2/T002；判定方式：需真实环境，可用自动化采集判。
验证：独立执行者分别运行check、dry-run、apply再apply；Claude Code与Codex各真实发现并调用安装位置入口；删链失效再装。
通过：检查及试运行前后用户字节相同；执行只改具名授权目标，第二次报告no-op；用户级默认及项目级可选均可定位；冲突不覆盖，断链替换，权限/部分失败逐项可见；
接入不调用Git安装器。
失败：链接存在但不能发现/调用、二次改用户字节、覆盖用户文件、错误链指源码或偷偷触发Git写均失败。
证据：双宿主命令与原始输出、前后字节事实和失败路径。
成本：executor=阶段2独立宿主执行者；estimate_min=40；hard_cap_min=80；
resources=Claude Code/Codex、本地隔离用户及项目目标；observation=宿主真实调用、前后字节和二次动作结果；
retry_cap=1（仅可重试本地故障预留，外部不可重试仍零重试）；evidence_tier=真机级。
资源来源：复用当前源码、具名上游或隔离种子；真实资源缺失由本条执行owner核条件，
未取得不伪造。以上分钟为作者provisional报价，非用户预算或实测。
为什么不能再简：该观察已使用当前最高接缝，纯文件存在或退出码不能替代本条效果。

- [ ] **AC-C10-3**：1.0.0版本源与更新/兼容结论对应真实输入。

关联：FR-C10-005、FR-C10-006；来源：R-005、R-015、R-018、U-001；ADR-001/004；
source_status=current。
首判：P4/T004；判定方式：机器可判。
验证：实施者将package与锁文件同源落为1.0.0；比较安装与明确来源版本；有更新/无更新/无法检查分别验证，按实际工具读数核矩阵。
通过：输出分三态并给理由/来源；OCR下限>=1.12.9，未知版本保unknown；Ego/anysearch/provider缺项按各真实检测语义报告；
矩阵不伪造范围；OCR、Ego、anysearch和每条声明provider路线各至少一兼容/一不兼容固定输入有明确断言，unknown只限定真实探测上限，不能代替这些正反承诺。
anysearch采用P4具名官方父/子commit同一--sdp/KV命令的真实CLI正反，
不把缺key/401/不可达当版本负例；保D015 key配置/安全政策。
Ego官方仅app0.6.3.6/guide2.2.1样例点，本机0.6.2.9/guide2.2.0只读metadata；
现handle/finish固定回执仅证本地适配合同，真实版本效果和有源不兼容release未取，
仍须原独立工具/浏览器owner补原回执，不连接为>=区间、不宣AC已闭合。
失败：来源失败被写无更新、非法semver被判兼容、版本分叉、旧profiles误入配置或未探测写兼容均失败。
证据：固定输入与真实探测分别留原输出，受控输入不冒真机。本次精确来源为
quality/evidence/2026-11-16-007-ego-anysearch-compat-research-final.md末节，
SHA256=d3c21a3a0b8d57a3ef386602842bc747a46330f9706f4faa6f957c0464f68398；
anysearch原JS SHA、相同argv和禁真网传输接缝见P4，真实服务效果另判。
成本：executor=阶段4独立测试；estimate_min=25；hard_cap_min=50；
resources=1.0.0来源、固定版本输入与实际外部工具；observation=更新三态及兼容矩阵对应原输出；
retry_cap=1（仅可重试本地故障预留，外部不可重试仍零重试）；evidence_tier=命令级。
资源来源：复用当前源码、具名上游或隔离种子；真实资源缺失由本条执行owner核条件，
未取得不伪造。以上分钟为作者provisional报价，非用户预算或实测。
为什么不能再简：该观察已使用当前最高接缝，纯文件存在或退出码不能替代本条效果。

- [ ] **AC-C10-4**：陌生维护者只凭README找到接入和排障。

关联：FR-C10-007；来源：R-002、R-003、R-013、R-015、R-018、R-022；ADR-001/004；
source_status=current。
首判：P5/T005；判定方式：只能人读。
验证：独立冷读者用固定发布物按成稿完成建链、配置、外部必需项引导和一条真实命令，复述下一步与错误恢复；修影响段后由未受提示者终读。
通过：所需来源/命令/位置可从成稿取得，成功和失败能解释；五段流程只导航当前材料；未验证命令显式标注；保README-only。
失败：需要作者补路径、猜provider、死链、遗漏工具安装来源、拿静态锚点检查代冷读或写不存在能力均失败。
证据：冷读五问原答与实际命令原件；现成工具不强制重装。
成本：executor=阶段5独立冷读者；estimate_min=30；hard_cap_min=60；
resources=P4发布物和最终README，隔离目标；observation=冷读原答、命令及缺输入恢复；
retry_cap=1（仅可重试本地故障预留，外部不可重试仍零重试）；evidence_tier=人读级。
资源来源：复用当前源码、具名上游或隔离种子；真实资源缺失由本条执行owner核条件，
未取得不伪造。以上分钟为作者provisional报价，非用户预算或实测。
为什么不能再简：该观察已使用当前最高接缝，纯文件存在或退出码不能替代本条效果。

- [ ] **AC-C10-5**：两类清单逐源可对账且坏项会被拒绝。

关联：FR-C10-006；来源：R-005、R-017、R-020、R-023；ADR-001/004；source_status=current。
首判：P4/T004；判定方式：机器可判。
验证：用现checkSkillConsistency与真实catalog/reuse盘点生成仓内清单；外部清单人工维护来源指针，同命令校验；
改坏具名版本/来源行重放。
通过：字段与唯一源一致，OCR/Ego/anysearch及各声明provider兼容正反固定输入按P4表断言；
版本边界无真实来源就保对应未完成，不能凭已安装或unknown判兼容。
本地技能登记版本不冒上游commit/app/guide；anysearch只对具名父/子原JS及该命令判，
Ego回调合同不冒真实不兼容release；配置key政策与上游匿名能力分列。
来源/版本/改造/权利未知逐条显露；嵌入third-review不冒外部X3；不把旧计数或历史标签当当前数据。
失败：改坏仍接受、另建清单真相、许可unknown被写成grant、X2/X4伪当前依赖或兼容正反固定输入未判均失败。
证据：当前源、差异与受控负例原输出；权利沿个人研究已选边界。
成本：executor=阶段4独立来源读者；estimate_min=25；hard_cap_min=50；
resources=当前catalog/reuse与外部盘点；observation=源到清单和坏行拒绝；
retry_cap=1（仅可重试本地故障预留，外部不可重试仍零重试）；evidence_tier=文件级。
资源来源：复用当前源码、具名上游或隔离种子；真实资源缺失由本条执行owner核条件，
未取得不伪造。以上分钟为作者provisional报价，非用户预算或实测。
为什么不能再简：该观察已使用当前最高接缝，纯文件存在或退出码不能替代本条效果。

- [ ] **AC-C10-6**：从最终安装包真实加载caller/skill并完成一条业务流程。

关联：FR-C10-008；来源：R-002、R-017、R-018、R-020、R-026；ADR-001/004；
source_status=current。
首判：P6/T007；判定方式：需真实环境，可用自动化采集判。
验证：独立执行者只装spec双根最终包，以P6任务7所列原三卡协议运行：
list/detail、pending discard/外部只读SQLite/同根重启持久、重复200、restore200/409、
running409、未知404，以及真实live页面终态/离线恢复；采当前安装、业务和UI原件。
通过：证据能对应安装位置与当前真实输入；业务结果和失败段可独立复读；当前服务缺失只保该条件未取得及owner，安装技术面单列。
失败：源码checkout、fixture、HTTP200、toast、单测、审查回执或C12能力报告替代实际业务均失败；业务未测不能写通过。
证据：真实加载位置、命令、浏览器及服务/持久结果原件；未执行面逐项披露。
成本：executor=阶段6独立真实流程执行者；estimate_min=45；hard_cap_min=90；
resources=最终包、真实宿主、T018A/P06-7所指业务服务/数据；observation=安装加载、请求处理、必要持久结果、UI读回；
retry_cap=1（仅可重试本地故障预留，外部不可重试仍零重试）；evidence_tier=真机级。
资源来源：复用当前源码、具名上游或隔离种子；真实资源缺失由本条执行owner核条件，
未取得不伪造。以上分钟为作者provisional报价，非用户预算或实测。
为什么不能再简：该观察已使用当前最高接缝，纯文件存在或退出码不能替代本条效果。

- [ ] **AC-C10-7**：质量结论由独立来源依据真实产物形成。

关联：FR-C10-009；来源：R-004、R-011、R-018、R-020；ADR-004；source_status=current。
首判：P6/T008（各段本地独立质量沿途提供）；判定方式：只能人读。
验证：逐段消费真实diff/产物与审查原件，终末按现build-code整份范围；读命令、原输出、exit/信号、版本/时间和受控负例。
通过：独立身份/上下文和原始发现可定位；有效finding修复回原作者并由受影响独立方复验；provider失败不漂白。
失败：作者自签、手填verdict、空findings冒通过、丢原失败或用结构检查代效果失败。
证据：原canonical审查、执行/负控原件与具名处置；不覆写旧报告。
成本：executor=阶段6独立质量读者；estimate_min=15；hard_cap_min=30；
resources=沿途独立审查与终末整份diff/最终包；observation=来源独立、原始失败和负控可回读；
retry_cap=1（仅可重试本地故障预留，外部不可重试仍零重试）；evidence_tier=人读级。
资源来源：复用当前源码、具名上游或隔离种子；真实资源缺失由本条执行owner核条件，
未取得不伪造。以上分钟为作者provisional报价，非用户预算或实测。
为什么不能再简：该观察已使用当前最高接缝，纯文件存在或退出码不能替代本条效果。

- [ ] **AC-C10-8**：发布结论分开呈现真实完成和缺口。

关联：FR-C10-009；来源：R-018、R-019、R-020、R-026、R-028；ADR-001/003/004；
source_status=current。
首判：P6/T008；判定方式：只能人读。
验证：独立读者逐层对照能力、质量、用户验收、包安装/兼容、Git/远端发布、物理清理，并核已声明PRD偏离和上游限制。
通过：每层有实际事实或具名缺口/owner/恢复；C01/C03/C04/C07/C08按当前C11修复和仍未覆盖项，逐项分诊为阻断首次使用、阻断核心流程、
不阻断；C08未证能力保限制；插件不做、未验证宿主、C11/C12残余及PRD业务冲突显露；未授权或未执行动作保持not_released/unknown。
失败：合并层次、未测写通过、本地merge冒远端push、C12全绿替安装验证或自动收尾冒删除授权均失败。
证据：唯一最终报告及沿途原ref；用户独占最终范围答复与质量结论分开。
成本：executor=阶段6独立结论读者；estimate_min=10；hard_cap_min=25；
resources=真实逐AC/逐动作结果；observation=六层结论及未完成owner；
retry_cap=1（仅可重试本地故障预留，外部不可重试仍零重试）；evidence_tier=人读级。
资源来源：复用当前源码、具名上游或隔离种子；真实资源缺失由本条执行owner核条件，
未取得不伪造。以上分钟为作者provisional报价，非用户预算或实测。
为什么不能再简：该观察已使用当前最高接缝，纯文件存在或退出码不能替代本条效果。

- [ ] **AC-C10-009**：缺配置、工具或key时使用者获得可执行下一步。

关联：FR-C10-003、FR-C10-004、FR-C10-007；来源：R-003、R-015；D-018历史原话；ADR-001/004；
source_status=current。
首判：P2/T002；判定方式：机器可判。
验证：隔离环境分别制造缺配置、OCR、provider、Ego、anysearch key、Node<24、npm/git缺失；从接入和实际依赖入口调用，同时对照无关动作。
通过：提示点名缺项/路径/来源/下一步；依赖动作停止、无关动作继续；Node缺失由shell/宿主启动原错误和安装说明承接，不伪称Node内可继续；坏JSON/缺键/现v2不合法各显式失败且原配置保全。
失败：通用错误、敏感值回显、坏输入默认覆盖、缺OCR换执行者、缺Ego/anysearch静默回退均失败。
证据：各缺失输入与对照的真实CLI输出；模拟缺失不证明外部服务健康。
成本：executor=阶段2独立接口测试；estimate_min=15；hard_cap_min=30；
resources=隔离XDG、受控PATH和假key；observation=具名缺项与下一步、仅依赖动作停止；
retry_cap=1（仅可重试本地故障预留，外部不可重试仍零重试）；evidence_tier=命令级。
资源来源：复用当前源码、具名上游或隔离种子；真实资源缺失由本条执行owner核条件，
未取得不伪造。以上分钟为作者provisional报价，非用户预算或实测。
为什么不能再简：该观察已使用当前最高接缝，纯文件存在或退出码不能替代本条效果。

- [ ] **AC-C10-010**：交付当次的验证和失败能回读。

关联：FR-C10-009；来源：R-004；ADR-004；source_status=current。
首判：P1/T001首判本段；各段同次首判，P6/T008汇总；判定方式：机器可判。
验证：每个重组交付在实际命令后用现capture/append保存命令/输出/退出/时间，末段只引用原件对账旧九包来源。
通过：原件对应实际交付时点与当前对象，缺件如实报缺；跨段引用不重写历史执行。
失败：事后编命令/时间、把planned当原件、用九包计数或已完成自述代结果均失败。
证据：每段唯一capture/普通原件与最终引用。
成本：executor=阶段1首判及各段独立读者；estimate_min=5；hard_cap_min=10；
resources=每交付当次capture/append原件；observation=命令、输出、退出、时间与源对应；
retry_cap=1（仅可重试本地故障预留，外部不可重试仍零重试）；evidence_tier=文件级。
资源来源：复用当前源码、具名上游或隔离种子；真实资源缺失由本条执行owner核条件，
未取得不伪造。以上分钟为作者provisional报价，非用户预算或实测。
为什么不能再简：该观察已使用当前最高接缝，纯文件存在或退出码不能替代本条效果。

- [ ] **AC-C10-011**：作者产出的临时工作命令自动回收且保护不可删原件。

关联：FR-C10-010；来源：R-027；ADR-002；source_status=current。
首判：P1/T001；判定方式：机器可判。
验证：独立作者用新版方法消费本任务真实夹具需求，产出并运行同进程Node命令；正常、目标断言失败、SIGINT/TERM、SIGKILL后下次受控回收分别观察。
通过：具名可再生scratch在可捕获结束后消失且原退出语义保真；
SIGKILL残留仅在marker/UID/目录身份/本任务精确前缀/足龄/死PID均满足时受控回收；交付包、历史/失败原始证据、provider 
TTL原件仍可读。
失败：承诺trap捕获SIGKILL、早退Node再消费路径、扫其它任务/未知目录、删除活PID/权限不明/符号链接/换inode对象、
清理失败冒成功或覆盖业务失败均失败。
证据：真实Node/TMPDIR/并发活PID/死PID/符号链接正反原输出及独立方法消费；不声明节省磁盘量。
成本：executor=阶段1独立方法消费者；estimate_min=20；hard_cap_min=40；
resources=现temp-dir、受控sandbox与原始capture；observation=正常/失败/信号/崩溃回收与保留边界；
retry_cap=1（仅可重试本地故障预留，外部不可重试仍零重试）；evidence_tier=命令级。
资源来源：复用当前源码、具名上游或隔离种子；真实资源缺失由本条执行owner核条件，
未取得不伪造。以上分钟为作者provisional报价，非用户预算或实测。
为什么不能再简：该观察已使用当前最高接缝，纯文件存在或退出码不能替代本条效果。

- [ ] **AC-C10-012**：build-code终末自动到达既有完整收尾并如实交付。

关联：FR-C10-011；来源：R-028；ADR-003；source_status=current。
首判：P3/T003；判定方式：机器可判。
验证：独立执行者从installed build-code终末与真实final-report ref进入，分别消费PR/无PR受控路线、
图内容变化/缓存命中/prompt-miss、归档后新字节和失败中断；真实远端另列。
通过：子结果A：实际加载stage-close及依赖且无需逐步提示；B：代码/新增变更文档语义分别核贡献，免费重放优先，未批准新抽取保持文档未更新；
C：图allowlist及后置新交付字节进入最终提交/所选PR/merge/push读回，授权与一次精确最终范围确认有效，重入不重复PR/merge/删除。
失败：只改正文/含字符串、AST成功冒文档语义完成、漏图commit、递归图自身无限更新、权限失败切写路由、无确认归档删除、dirty 
main强推或未执行冒成功均失败。
证据：真实方法消费/隔离路由输出、图原件与授权记录、逐动作结果；模拟只证接线，不证真实外部发布。
成本：executor=阶段3独立收尾消费者；estimate_min=50；hard_cap_min=100；
resources=installed方法、隔离Git/PR受控路由、现图/语义缓存；observation=真实调用、图贡献、授权、顺序、幂等和分项失败；
retry_cap=1（仅可重试本地故障预留，外部不可重试仍零重试）；evidence_tier=人读级。
资源来源：复用当前源码、具名上游或隔离种子；真实资源缺失由本条执行owner核条件，
未取得不伪造。以上分钟为作者provisional报价，非用户预算或实测。
为什么不能再简：该观察已使用当前最高接缝，纯文件存在或退出码不能替代本条效果。

- [ ] **AC-C10-013**：C10自身读取新版两页计算结果并承接上游限制。

关联：FR-C10-012；来源：CARD-C12-004、R-026；ADR-001/004；source_status=current。
首判：P6/T006；判定方式：需真实环境，可用自动化采集判。
验证：按C12报告重建入口在本任务scratch重建be3160版本，board切empty、workbench正常显示，
读取.inlineactions计算gap。
通过：当前任务原件有两页16px计算值、对象版本、时间/执行者；读回与安装方法来源对应，保board改前未测，不能宣布C12整条004通过。
失败：只提hash/token源码、复用C12同任务重放、缺页面计算值、把本条读回替真实业务或抹历史缺口均失败。
证据：C10自己的浏览器计算值与对象来源原件；不更新C12历史报告。
成本：executor=阶段6独立跨任务读者；estimate_min=20；hard_cap_min=40；
resources=C12重建源和be3160版本两页；observation=当前任务两页计算gap及时间/版本原件；
retry_cap=1（仅可重试本地故障预留，外部不可重试仍零重试）；evidence_tier=真机级。
资源来源：复用当前源码、具名上游或隔离种子；真实资源缺失由本条执行owner核条件，
未取得不伪造。以上分钟为作者provisional报价，非用户预算或实测。
为什么不能再简：该观察已使用当前最高接缝，纯文件存在或退出码不能替代本条效果。

### 用户独占确认落在哪一步？

当前计划尚未确认；这不等于版本未定，也不影响本轮已授权草稿与回修。
正式实施前由主会话展示当前计划、S/M/L及成本缺口取得真实选择。
最终关闭由stage-close按实际归档/删除/远端任务分支范围统一确认一次。
只拦该方法规定的破坏动作，答复后原caller继续；质量缺口不因确认变通过。
已有同范围真实答复直接引用，不让日常验收等用户本人到场。

## Appendix B — 需求与编号对照

编号对照只在这一张表；下面是来源覆盖与功能定义。

| 正文 | 机器编号 | 对象 |
| --- | --- | --- |
| 需求1至12 | FR-C10-001至FR-C10-012 | 支持、包、接入、配置、版本、清单、文档、真实流、结论、临时资源、收尾、跨任务读回 |
| 场景1至8 | SCN-C10-001至SCN-C10-008 | 上文旅程 |
| 事实1至12 | PFACT-C10-001至PFACT-C10-012 | 当前输入事实 |
| 验收1至8 | AC-C10-1至AC-C10-8 | 保PRD原编号与已选偏离 |
| 验收9至13 | AC-C10-009至AC-C10-013 | 缺项、边做边验、生命周期、完整收尾、跨任务读回 |
| 风险1至7 | RISK-C10-001至RISK-C10-007 | 全局风险 |
| 未决1至4 | OPEN-C10-001至OPEN-C10-004 | 缺来源/需真实决定项 |

### 事实各由什么支持？

每条状态互斥，源码事实只证明当前实现，不冒业务已跑。

| 事实 | 状态 | 对应来源/限制 | 影响 |
| --- | --- | --- | --- |
| PFACT-C10-001 | verified | task evidence003合主线，原字节恢复；本次HEAD | 全FR/AC基线 |
| PFACT-C10-002 | verified | skill-bundle-release:493–621、本次read | FR-C10-002/006；AC-C10-1/5 |
| PFACT-C10-003 | verified | runner-release:185–240、本次read | FR-C10-003/008；AC-C10-2/6 |
| PFACT-C10-004 | verified | storage-root:5–29/57–71、host-config:379–507 | FR-C10-004；AC-C10-009 |
| PFACT-C10-005 | verified | package/lock当前0.0.0；版本原件008用户选1.0.0 | FR-C10-005；AC-C10-3 |
| PFACT-C10-006 | verified | temp-dir:45–127 | FR-C10-010；AC-C10-011 |
| PFACT-C10-007 | verified | build-code实际依赖/步骤/catalog，本次read与研究004 | FR-C10-011；AC-C10-012 |
| PFACT-C10-008 | verified | 研究005所引C09 041/042，逐项范围沿原件 | FR-C10-008/009；AC-C10-6/8 |
| PFACT-C10-009 | verified | 研究005所引C11 closeout-index-v2、C12 057/058/059 | FR-C10-008/012；AC-C10-6/13 |
| PFACT-C10-010 | verified | 当前归档C12报告:116/150–159/184/318与最终057–059 | FR-C10-008/012；AC-C10-6/13 |
| PFACT-C10-011 | verified | 当前PRD:393–401、C12路由与本稿实际测试范围 | FR-C10-008/012；AC-C10-6/13 |
| PFACT-C10-012 | unknown | owner阶段2/6/知识owner；OPEN-C10-002/003；影响真实运行与费用判断 | FR-C10-003/008/011；AC-C10-2/6/12 |

### 每条原需现在由谁承接？

交付有AC，过程或已声明不做有原话来源和实际owner，不留无主项。

| 来源 | 方案/AC/Phase | 范围与owner |
| --- | --- | --- |
| R-001 | 过程已完成：原始PRD读取→当前来源映射 | 作者；非产品AC，原话是读材料动作 |
| R-002 | FR-C10-002/003/007/008→AC-C10-1/2/4/6→P2/4/5/6 | 发布/接入/真实旅程，不能泛称全部能力 |
| R-003 | FR-C10-003/004/007→AC-C10-2/4/009→P2/5 | D-006/015限定检测提示，外部不代装 |
| R-004 | FR-C10-009→AC-C10-010→P1沿途/P6汇总 | 各交付当次producer |
| R-005 | FR-C10-002/005/006→AC-C10-1/3/5→P4 | 当前外部来源，原X口径已更正 |
| R-006 | 过程已完成：worktree绑定→原evidence003 | Git执行者原件，非产品AC |
| R-007 | 过程已完成：入口/todo/旧15步原ref | 主会话；不把旧步骤当新版确认 |
| R-008 | 沟通约定：本轮中文短回复 | 主会话；非产品AC |
| R-009 | FR-C10-007→AC-C10-4→P5 | 文档可读，用户沟通约定持续 |
| R-010 | 过程：独立研究与唯一作者委派 | 主会话；非产品AC |
| R-011 | FR-C10-009→AC-C10-7→P6及沿途 | 旧方向审查原件保留；本轮新需按U-003复审 |
| R-012 | FR-C10-009→AC-C10-8→P6 | 交接当前草稿状态，主会话 |
| R-013 | FR-C10-003/007→AC-C10-2/4→P2/5 | 拿到后接入，非安装器UI |
| R-014 | FR-C10-003→AC-C10-2→P2 | 两类宿主实际发现/调用 |
| R-015 | FR-C10-004/007→AC-C10-009/4→P2/5 | 具名提示和外部来源引导 |
| R-016 | 过程已完成：两份外部研究原ref | 旧单源限制保留，非产品AC |
| R-017 | FR-C10-002/005/006/007/008→AC-C10-1/3/4/5/6/8→P4/5/6 | D-016明确不做插件/市场，结论单列 |
| R-018 | FR全集→AC-C10-1至8→P2/4/5/6 | 原八条保编号，偏离按原决定 |
| R-019 | 已声明不做：未声明宿主/上线/部署/回滚；AC-C10-8→P6 | 原卡14及D-008；新增收尾只按授权条件，不扩上线 |
| R-020 | FR-C10-006/009→AC-C10-5/8→P4/6 | 按实际能力与限制 |
| R-021 | 范围约束：一张C10全做 | 用户原选不拆卡；九包来源不丢 |
| R-022 | FR-C10-003/007→AC-C10-2/4→P2/5 | 通用软链，Codex一等 |
| R-023 | FR-C10-002/006/009→AC-C10-1/5/8→P4/6 | 只证干净使用发布物；不清公开仓历史 |
| R-024 | FR-C10-003/007→AC-C10-2/4→P2/5 | 用户级默认、项目级可选 |
| R-025 | 原九包范围保持；U-003允许按新拆并重组Phase | 当前六段是提案，原批准不扩成新版确认 |
| R-026 | 全材料修订/审查/源映射，FR-C10-009→AC-C10-8→P6 | 本轮作者与主会话 |
| R-027 | FR-C10-010→AC-C10-011→P1 | 生命周期效果与保原件 |
| R-028 | FR-C10-011→AC-C10-012→P3 | 完整条件收尾及文档语义 |
| CARD-C12-004 | FR-C10-012→AC-C10-013→P6 | C10自身读回，不代原004整条通过 |
| U-001/002/003 | 版本落盘/未确认/新草稿授权→AC-C10-3/8→P4/6 | 三轴分开，用户无手改任务 |

### 功能需求怎样绑定事实和场景？

每条功能沿真实源、当前ADR提案、事实、场景与验收串接。

- **FR-C10-001**：发布边界与支持矩阵；source=R-002/R-020；source_status=current；
  ADR-001/ADR-004；PFACT=001/007；SCN=2；AC-C10-1/8。
- **FR-C10-002**：完整包与适配层；source=R-002/R-005/R-023；source_status=current；
  ADR-001/ADR-004；PFACT=002/003；SCN=2；AC-C10-1。
- **FR-C10-003**：可重复接入；source=R-002/R-003/R-014；source_status=current；
  ADR-001/ADR-004；PFACT=003/004；SCN=1；AC-C10-2/009。
- **FR-C10-004**：现配置检测与最小补齐；source=R-003/R-015；source_status=current；
  ADR-001/ADR-004；PFACT=004；SCN=1；AC-C10-009。
- **FR-C10-005**：1.0.0和更新三态；source=R-018/U-001；source_status=current；
  ADR-001/ADR-004；PFACT=005；SCN=2；AC-C10-3。
- **FR-C10-006**：清单/来源/兼容对账；source=R-005/R-017；source_status=current；
  ADR-001/ADR-004；PFACT=002/009；SCN=2；AC-C10-5。
- **FR-C10-007**：README冷读；source=R-013/R-015/R-022；source_status=current；
  ADR-001/ADR-004；PFACT=003/011；SCN=3；AC-C10-4。
- **FR-C10-008**：安装后真实业务；source=R-002/R-017/R-026；source_status=current；
  ADR-001/ADR-004；PFACT=008/010/012；SCN=6；AC-C10-6。
- **FR-C10-009**：沿途原件与分层结论；source=R-004/R-018/R-020；source_status=current；
  ADR-001/ADR-004；PFACT=001/008/009；SCN=8；AC-C10-7/8/010。
- **FR-C10-010**：临时资源生命周期；source=R-027；source_status=current；
  ADR-002/ADR-004；PFACT=006；SCN=4；AC-C10-011。
- **FR-C10-011**：终末条件收尾；source=R-028；source_status=current；
  ADR-003/ADR-004；PFACT=007/012；SCN=5；AC-C10-012。
- **FR-C10-012**：跨任务新版读回；source=CARD-C12-004/R-026；source_status=current；
  ADR-001/ADR-004；PFACT=009/010/011；SCN=7；AC-C10-013。

### 六段边界怎样逐条件核？

本表按当前模板四条件逐项核，任一满足须合并，仍保证每段有外部效果。
仅开工需已验输入不是条件2；同领域、同作者或共用文件都不是合并理由。

| 边界 | S1：同判据 | S2：判B必须见A产物 | S3：必须一起交同消费者 | S4：拆后无独立外部变化 | 本次提案 |
| --- | --- | --- | --- | --- | --- |
| 临时方法与消费验证 | 是；验收11同一生命周期效果 | 是；方法效果必须由实际命令及保留结果判断 | 是；作者要同时拿可用范式与回收语义 | 是；只有泛称清理没有可执行消费不形成交付 | 留阶段1一段 |
| 配置与接入 | 部分；验收2共用安全接入，9有独立缺项判据 | 是；安全接入判定必须读到实际生效配置，非仅等配置开工 | 是；新人正常接入必须同时有配置与宿主加载路径 | 否；配置检测本身也有外部结果 | 满足2/3，合为阶段2 |
| 终末调用/依赖/图与Git返回 | 是；验收12判断完整真实调用链 | 是；终末返回需见真实图贡献和逐动作结果 | 是；caller必须取得各动作及失败原件才可交事实 | 是；只有登记或字符串指针不能形成自动调用效果 | 留阶段3一段 |
| 包/版本/清单 | 否；验收1/3/5各有原判据 | 部分；包清单判定须见实际当前发布字节，不是仅前置输入 | 是；按原交付同一版本发布物必须带内容、版本与清单一起交维护者 | 否；单项有外部结果，仍受完整物交付约束 | 按3合为阶段4 |
| README与技术实现 | 否；验收4独立语义判据 | 否；已验包是固定开工输入，README可独立冷读 | 否；完整包可先交技术消费者，成稿再给新人 | 否；成稿可独立改变可用性 | 独立阶段5 |
| 最终旅程/跨任务读回/结论 | 否；验收6/13与7/8保持各判据 | 是；最终结论判定须见两个真实子面结果，不能只等开工或读技术回执 | 是；本卡最终验收交付必须把真实子面及六层限制一起交同一发布读者 | 部分；廉价原件聚合本身不另构成新能力 | 同一末验多场景，合为阶段6，不给廉价聚合另立阶段 |

阶段1/2/3各结果可以独立验收；共享登记只决定写主串行，不决定交付边界。

### 相比旧稿具体改了什么？

变化有用户来源或当前规范理由，不把主线变更算本轮修改。

| 原稿 | 新草稿 | 来源/理由 |
| --- | --- | --- |
| 等C09 P6且真链已验 | 已交历史供件；消费C11/C12现限制；C10自己验安装业务 | U-003、研究005差异1–6、当前PRD/报告冲突 |
| 版本未定/用户手改 | 用户仅选1.0.0；P4实施者同步版本为本版待确认分工提案 | U-001原件008:14–17；本轮作者提案，旧:21不是用户原话 |
| 空骨架/清单版本拆层 | 完整发布物同Phase独立首判 | 最新模板S1/S2/S3/S4及ADR-004 |
| 裸临时目录/全树导出 | 现owner同作用域回收，原件从开始外置 | R-027、研究004、证据纪律 |
| 收尾仅reader指针 | 终末实际调用+语义图/后置字节/条件授权分路 | R-028、研究004 |
| 所有AC等末段 | 每交付首判；唯一末段读回及必要未闭环 | 当前build-plan/spec-plan |
| 旧测试任务名前缀 | 新测试按行为命名，runtime测试就近 | 当前测试资产规则:37 |
| 120/240/1.5当默认 | unknown来源+provisional活动报价；不补同意 | 当前模板与研究005 |
| 全卡非UI/旧checker | CLI方法分面，P6真实观察适用UI；唯一模板VM消费 | 当前spec模板三源合同 |
