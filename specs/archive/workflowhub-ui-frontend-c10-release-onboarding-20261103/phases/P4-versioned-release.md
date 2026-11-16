# Phase P4 — 完整1.0.0发布物可对账

本段给发布owner、独立来源/安装检查者及README作者。
全局产品与通过/失败只读spec.md Appendix A，本段交完整发布增量。

## 哪些节必须写，哪些可以省？

本文件written的结果、验收、依据、读源、写主、验证、任务卡和机器字段承载本段增量。
下一消费者和唯一末验检查的区别是：前者written，后者不适用，末段为P6。
固定机器标签、精确路径/命令和表格是行宽/标题例外；其余按材料写作标准。

## 这一 Phase 交出什么？

维护者从当前源得到可独立解析的1.0.0使用发布物，并能逐源核版本和清单。

- **本 Phase 结果**：包内包含P2接入、P3终末完整依赖、当前文档/矩阵及两类清单。
- **非目标**：现闭包/分发算法只复用；插件/市场按旧决定不做；远端上线不在本段。
- **改动前**：当前package/lock为0.0.0，新接入与终末接线须先由P2/P3交付。
- **改动后**：版本源1.0.0与包/更新输出相符，清单和矩阵能回源且坏项明确失败。
- **与相邻 Phase 的边界**：本段拿已验接口和方法打完整包；P5独立写README，P6只因最终README再重建一次。
- **主要风险**：适配软链冲撞内层validator；返工仍保现validator，只在外层具名适配层建链并校验包内目标。
- **下一步**：P5消费包/命令与矩阵，P6取最终重建包实装。
- **动手前必读**：publisher/validator及runner当前真实接口；P1至P3交回；package/lock；checkSkillConsistency。
- **未决事实**：外部实际版本/许可上限未取得，按工具owner保unknown，不猜range或grant。

## 这一 Phase 怎么验收？

本段首次独立判断验收1/3/5，不借末段补首判。

成本账：20 + 25 + 25 + 共享准备10 + 重验预留10 = 90活动分钟。
资源账：现完整闭包、catalog/reuse/外部盘点、当前P2/P3交付、固定semver输入及已装工具。
范围账：只证本段完整发布物、版本更新和对账；双宿主接入首判已在P2，业务在P6。
`phase_budget={soft_min:unknown,hard_min:unknown,variance_threshold:unknown,source:provisional proposal}`。
`execution_budget={window_minutes:unknown,command_cap:unknown,wait_cap:unknown,retry_reserve:unknown}`。
没有当前用户预算或S/M/L选择来源；报价不作批准，用户/审查/环境等待分账。
非UI：本段CLI/发布文件与版本事实，不观察页面。

1. 验收标准：引用Appendix A验收1/3/5；判定器与本卡相同，不另写判据。
2. 场景：干净空输出、缺资源并删其清单项、输出预置用户文件、绝对/越界/断链、清单坏行、非法semver和来源不可读。
3. 环境与数据：Node按当前>=24声明实读；真实当前闭包由builder生成，不保存整树证据；固定版本输入只在本次scratch。
4. 用例：下文同一命令，受控坏输入须到达具名assertion；最终组合混入specs/private.md、quality/raw.log或tests/dev-only.mjs，即使外层清单登记也必须失败；P2重复接入不被版本输出改坏。
5. 谁判与承接：未参与实现的独立测试/来源读者读当前完整包、负例原件和矩阵来源，交P5/P6。
6. 失败回修与重验：闭包/适配层不安全、来源分叉、版本不合法或清单无真实源时，只停该构建/检查，回P4原writer；配置/终末接口缺口分别回P2/P3；
保原错误和用户目标，修自己hunk后原独立方定向复验。

## 为什么现在做，依据是什么？

用户已选1.0.0；包必须承接配置接入和完整收尾后才能给新人使用。
源为R-002/005/017/018/020/023、U-001及ADR-001/004，原包1/2/5/6范围保持。
合并依据是同一完整发布物必须一起交付；四项逐条件核见spec附录，
不把不同AC说成共享同一判据。
它们不是三个独立技术层Phase；当前闭包算法也不是新需求。

## 开始前读什么？

先读P2/P3实际交接，再读现分发签名和唯一来源。
2026-11-16作者用read实读：skill-bundle-release:493–621、runner-release:126–240、
package.json:1–29、package-lock.json:1–17、move-map:1944–1976。
逐字签名/字段和禁止底座清单见spec代码锚点，行号只定位。
研究005差异7–12补闭包/当前配置/新文件登记；旧审计只作来源，计数现场派生。

## 每个文件由谁改，先做什么？

本段writer独占下表路径，在登记现职责后实现薄入口。

| 路径 | 分类及唯一writer动作 | 真实consumer/承接条件 |
| --- | --- | --- |
| `tools/cli/build-release.mjs` | new；本段writer：薄编排两现builder/validator，组合交付声明及宿主适配软链，不重写闭包 | 本段声明下游；现输入先读回，不增第二owner |
| `tools/cli/build-skill-manifests.mjs` | new；本段writer：用catalog/reuse真实输入生成仓内清单，校验外部唯一人工源，支持--check | 本段声明下游；现输入先读回，不增第二owner |
| `runtime/distribution/update-check.mjs` | new；本段writer：安装与明确来源的semver比较，输出三态及理由 | 本段声明下游；现输入先读回，不增第二owner |
| `runtime/distribution/update-check.test.mjs` | new；本段writer：就近版本/非法/不可读来源反例 | 本段声明下游；现输入先读回，不增第二owner |
| `tools/cli/onboard-release.mjs` | modify；本段writer：P2接口基础追加明确来源版本检查，不改安全接入语义 | 本段声明下游；现输入先读回，不增第二owner |
| `package.json` | modify；本段writer：version由实施owner落1.0.0，保现依赖和private事实 | 本段声明下游；现输入先读回，不增第二owner |
| `package-lock.json` | modify；本段writer：根version及packages[""]版本与package同源同步，不换依赖 | 本段声明下游；现输入先读回，不增第二owner |
| `repo-skills.manifest.json` | new；本段writer：当前仓内源派生的发布投影，不是第二清单source | 本段声明下游；现输入先读回，不增第二owner |
| `external-skills.manifest.json` | new；本段writer：人工唯一外部工具来源/版本/改造/权利未知条目 | 本段声明下游；现输入先读回，不增第二owner |
| `docs/release-support-matrix.md` | new；本段writer：Claude Code/Codex真实验证状态，其它只文档/未验证；外部字段仅指兼容矩阵 | 本段声明下游；现输入先读回，不增第二owner |
| `docs/external-skills-compat-matrix.md` | new；本段writer：按真实工具/审查路线与provider来源逐项保区间或unknown/正反例 | 本段声明下游；现输入先读回，不增第二owner |
| `tests/contract/release-tree.test.mjs` | new；本段writer：实际builder/validator和适配层，缺资源/删清单/越界链反例 | 本段声明下游；现输入先读回，不增第二owner |
| `tests/contract/skill-manifests.test.mjs` | new；本段writer：真实源对账与坏行拒绝 | 本段声明下游；现输入先读回，不增第二owner |
| `docs/architecture/move-map.json` | modify；本段writer：P2登记基础上追加builder/manifest/update职责与真实consumer/测试/删除条件 | 本段声明下游；现输入先读回，不增第二owner |

共享边界：P2先交onboard-release当前接口及move-map；本段后增版本消费和发布职责。
P3先交catalog当前终末登记，本段清单只读此源；若确需源字段修正，回P3原writer，不在P4条件扩写。
P1先交当前临时范式，本段夹具/中间构建采用其同进程生命周期。
README本段只读并复制当时字节；P5后写，P6再构建且只补受影响文档/包接口检查。
禁止修改现publisher/validator/runner算法、安全拒绝、上游材料、AGENTS及旧原件。
新增生产文件职责/consumer/测试见表和spec接口，move-map原分发记录旁登记。
新入口仅被本段CLI与下游安装使用；全部consumer迁移后才能退役，不留兼容桥。
回滚只退本段hunk及本次具名输出，不覆盖P2/P3交回或用户目标。

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

### 哪些兼容正反例必须冻结？

| 工具/路线 | 兼容固定输入 | 不兼容固定输入与明确拒绝 |
| --- | --- | --- |
| OCR | 探针返回1.12.9且协议可用 | 1.12.8/非法版本/执行失败→incompatible或unavailable，不能supported |
| Ego | 官方具名macOS app0.6.3.6/guide2.2.1样例；本机app0.6.2.9/guide2.2.0仅metadata。现runOwnedEgoTaskSpace合法handle/完整finish回执合同可离线核 | spaceId字符串或finish无法证明关闭p1由现consumer拒绝；仅本地适配合同，不冒任何真实Ego旧release不兼容 |
| anysearch | 官方db3d76e5597aec7261257be5322dd211c9d9bb87原JS，同一search AAPL --domain finance --sub_domain finance.us_stock --sdp ticker=AAPL -m 2；观察真实参数构造及裸JSON text响应 | 真实父commit9b0d9e4b81f2ffa3ffe8d8439e015c9df3b4b4b8原JS同命令Unknown flag: --sdp、exit1且零传输；只不兼容本次别名/KV调用，不扩成semver范围 |
| 每条声明provider | 该路线ID在现owner支持集且CLI/probe成功 | 不支持ID/CLI启动失败/路由无provider→明确不兼容或不可用，不改默认provider |

本段只消费quality/evidence/2026-11-16-007-ego-anysearch-compat-research-final.md末节具源修订，
SHA256=d3c21a3a0b8d57a3ef386602842bc747a46330f9706f4faa6f957c0464f68398。
现Ego consumer源为skills/isolated-browser-qa/scripts/browser-qa-session.mjs:352–407，
不另造兼容判断器；合法handle与坏handle/finish回执只核本地合同，不执行真实browser。
官方doc仅样例测试点，不保证>=范围；本机metadata不能证明页面/TaskSpace/finish效果。
Ego真实具名版本完整生命周期及有源不兼容release仍未取得：owner为原独立浏览器
执行者/工具owner，恢复为在允许环境取真实必要合同与finish原回执；本子面不关闭。

anysearch正例源码SHA256为2f94ff9aa2091234ac225bfe8f16e02a148eba141b49921a8740c2d36ff4e980；
真实父原件为quality/evidence/build-plan/2026-11-16-030-c10-anysearch-official-parent-cli-source.js，
SHA256=b6e736445df5dc3d8a26f3d3db89a17a63c9de45022285bc6cdc7e6308deefe4。
两份完整原JS同一argv，从本次owned隔离fixture执行；只替换https传输，禁真网，
不读源目录.env或真实key。正例实际payload的sub_domain_params必须为
`{ticker:'AAPL'}`且max_results=2，固定裸JSON text输出ok；父commit必须在传输前拒别名。
另核当前JS遇HTTP200的SSE文本报Invalid JSON response；不冒后端真实搜索效果。
父commit其它合法JSON命令可用，不能写成完全不可用或某semver以下全不兼容。

anysearch上游支持匿名，缺key不能作为协议/版本不兼容负例。
保历史D015“脚本+key必须”的本产品配置/安全政策，缺key由预检报配置缺项及下一步；
HTTP401归权限，超时/端点不可达归环境不可用，均不冒版本比较结果。
原JS未严格校验响应jsonrpc/id，计划不额外宣该能力。固定transport只证CLI合同。

本轮增补来源为读者076和主会话同轮授权，变更声明及改前字节见
quality/evidence/build-plan/2026-11-16-029-c10-step8-additive-test-change-source.json。
只补已授权release-tree测试中的现接口断言，不改已有期望方向或生产实现；
新的onboard统一兼容输出尚未实现，真实Ego版本正反仍缺，AC3/5承诺不放宽。

## 怎么验证？

同一命令测试真实builder/validator及用户可见版本输出。

```bash
node node_modules/vitest/vitest.mjs run runtime/distribution/update-check.test.mjs tests/contract/release-tree.test.mjs tests/contract/skill-manifests.test.mjs
```

本轮只补具名预写测试，不实施生产；真实目标RED/原本通过/环境缺项分开记录。
后续build-code先固定目标测试和可证伪正反例；收集/导入/环境错误不算目标RED。
新目标冻结后由独立方保护，物理隔离未建立时如实披露；改断言走同卡TCR。
闭包原来通过就保通过基线；新目标RED是完整包漏P2/P3、适配层越界或版本源不一致。
清单既删文件又删顶层行仍由现重建validator拒绝，不改validator求绿。
发布包是交付，不作为整树证据；原始命令/负例输出外置，staging才回收。
S/M/L提案采用M当前声明完整集加S版本/坏链反例；不跑全仓测试或重新发明文件枚举。

## 每张任务卡怎么写？

一个完整发布结果保在同卡，构建、版本和清单不是横切成三张无消费者票。

### 任务 4：构建并对账完整1.0.0发布物

为什么做：新人要用同一份版本、清单和真实内容，当前尚无本卡完整包。
交付什么：完整包和1.0.0/更新三态/来源清单可独立回读。
不做什么：既有publisher/validator/runner-release算法、PRD/AGENTS/上游材料和旧测试不写；不建插件/市场或版本服务。
前置：P1同进程夹具方法、P2接入CLI/模板、P3完整终末依赖已独立交回；catalog/reuse/外部盘点为当前源。
怎么做：步骤1，在move-map登记builder、manifest与update-check真实职责/consumer/删除条件后，
package及lock根version同步1.0.0作为本版待确认写主提案；U-001仅证明版本选择，原实施授权在计划确认后覆盖该写入。
步骤2，build-release保标准skill-bundle/和runner/两根，外层只补具名说明/清单/适配物；
最终实际子根再调用两validator。安装明确调用原installRunnerRelease，参数为runnerRoot/skillBundleRoot；
只让原installer完成bundle内嵌及npm/Git，不把外层混入strict bundle。
步骤3，宿主适配层.agents/skills和.claude/skills分别指向../runner/skills；outer onboard按--package-root推导runner实际根，只在已安装后建用户链接；目标非空先报错保护；构建输出归交付，失败中间物走P1同进程回收，原始输出外置。
步骤4，build-skill-manifests从catalog/reuse派生仓内投影；外部唯一人工清单保固定来源/版本/改造/权利unknown，
工具兼容矩阵按现路由/探测实写；上表固定正反输入各到明确断言，
Ego若没有真实不兼容release原件，版本正反子面保持未完成；anysearch仅限研究007具名父/子commit及本次--sdp/KV合同，不以availability/unknown代版本结论。
步骤5，update-check用明确安装/来源版本输出有更新/无更新/无法检查；onboard在P2安全接口上追加版本状态，
不变check/dry-run/apply写语义。
步骤6，同命令核完整包和具名坏例，抽源语义由独立来源读者复读；若P5后改README，P6只重建并定向补验文档入包/入口解析。
怎么验收：真实构建与重建校验结果、onboard用户可见版本输出及独立源到清单读回；不能仅目录存在。
证据：原始命令/输出从开始保task库，quality/evidence/p4-versioned-release-effect.md只是计划落点，不冒已执行。
下游（含何时停）：P5拿实测命令/包/矩阵写README，P6从最终包实装；错误回本段原writer。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T004
- **来源 / FR / AC**：R-002、R-005、R-017、R-018、R-020、R-023、U-001；ADR-001/004；FR-C10-001、FR-C10-002、FR-C10-005、FR-C10-006；AC-C10-1、AC-C10-3、AC-C10-5；完整包和1.0.0/更新三态/来源清单可独立回读。
- **输入**：P1同进程夹具方法、P2接入CLI/模板、P3完整终末依赖已独立交回；catalog/reuse/外部盘点为当前源。；producer为原交付owner，独立执行者在本卡实际运行时取得真实当前字节。
- **文件 / 符号**：`tools/cli/build-release.mjs`；`tools/cli/build-skill-manifests.mjs`；`runtime/distribution/update-check.mjs`；`runtime/distribution/update-check.test.mjs`；`tools/cli/onboard-release.mjs`；`package.json`；`package-lock.json`；`repo-skills.manifest.json`；`external-skills.manifest.json`；`docs/release-support-matrix.md`；`docs/external-skills-compat-matrix.md`；`tests/contract/release-tree.test.mjs`；`tests/contract/skill-manifests.test.mjs`；`docs/architecture/move-map.json`；符号：buildSkillBundleRelease/buildRunnerRelease/validateSkillBundleRelease/validateRunnerRelease为只读现接口；本表CLI/update-check为拟新增consumer，先固定行为签名。
- **动作**：步骤1，在move-map登记builder、manifest与update-check真实职责/consumer/删除条件后，；package及lock根version同步1.0.0作为本版待确认写主提案；U-001仅证明版本选择，原实施授权在计划确认后覆盖该写入。；步骤2，build-release保标准skill-bundle/和runner/两根，外层只补具名说明/清单/适配物；；最终实际子根再调用两validator。安装明确调用原installRunnerRelease，参数为runnerRoot/skillBundleRoot；；只让原installer完成bundle内嵌及npm/Git，不把外层混入strict bundle。；步骤3，宿主适配层.agents/skills和.claude/skills分别指向../runner/skills；outer onboard按--package-root推导runner实际根，只在已安装后建用户链接；目标非空先报错保护；构建输出归交付，失败中间物走P1同进程回收，原始输出外置。；步骤4，build-skill-manifests从catalog/reuse派生仓内投影；外部唯一人工清单保固定来源/版本/改造/权利unknown，；工具兼容矩阵按现路由/探测实写；上表固定正反输入各到明确断言，；Ego/anysearch若没有真实版本边界来源，版本兼容子面保持未完成，不能仅凭可用性或unknown算兼容。；步骤5，update-check用明确安装/来源版本输出有更新/无更新/无法检查；onboard在P2安全接口上追加版本状态，；不变check/dry-run/apply写语义。；步骤6，同命令核完整包和具名坏例，抽源语义由独立来源读者复读；若P5后改README，P6只重建并定向补验文档入包/入口解析。
- **输出 / 失败**：完整包和1.0.0/更新三态/来源清单可独立回读。；失败按闭包/适配层不安全、来源分叉、版本不合法或清单无真实源时，只停该构建/检查，回P4原writer；配置/终末接口缺口分别回P2/P3；保原错误和用户目标，修自己hunk后原独立方定向复验
- **边界 / 禁止改动**：既有publisher/validator/runner-release算法、PRD/AGENTS/上游材料和旧测试不写；不建插件/市场或版本服务。
- **依赖**：P1、P2、P3
- **测试层级 / 技能**：完整包/manifest/semver/CLI；backend-testing预判；无UI；只测本卡当前面，不全量回归。
- **场景 / 夹具或服务**：当前完整声明集；spec双根和安装参数；外层/内层开发污染负例；OCR/Ego/anysearch/每条provider正反固定输入；坏清单行；删资源并删清单；非空目标；越界/断链；版本有/无/非法/不可读；固定输入与真机分开。
- **预写测试**：真实底座仍为基线；076现接口缺断言已补，077/080保存闭包、共有冲突、坏链及安装失败/缺caller原件。研究007的具名anysearch父/子CLI同命令正反已在077执行，Ego现consumer回执合同在079执行；只核各自声明范围，不冒真实app或endpoint效果。新最终composer/外层污染、版本/清单及onboard统一兼容输出仍无现seam，目标RED未完成。
- **可观察接缝**：真实构建与重建校验结果、onboard用户可见版本输出及独立源到清单读回；不能仅目录存在。
- **RED/GREEN 门禁命令**：`node node_modules/vitest/vitest.mjs run runtime/distribution/update-check.test.mjs tests/contract/release-tree.test.mjs tests/contract/skill-manifests.test.mjs`
- **预期退出码**：RED nonzero; GREEN 0；目标assertion须到达；缺资源或导入错误单列，不冒目标RED。
- **RED 目标失败**：ORACLE-VERSIONED-RELEASE；完整包缺P2/P3实际入口或适配层越界仍被接受的具名assertion必须失败；当前已通过底座保持基线。
- **RED 证据**：planned: `quality/tests/t004-target-red.output`；当前未执行，目标测试owner在实施前提供真正目标断言和来源。
- **GREEN 判定器**：ORACLE-VERSIONED-RELEASE；按Appendix A验收1/3/5独立核实际包/版本/清单且具名坏例被拒绝。
- **证据**：planned: `quality/evidence/p4-versioned-release-effect.md`；原capture/独立读回与实际输入版本一同引用，固定输入与真实服务分开。
- **覆盖上限**：只证当前声明完整包与真实工具已探测子面；不证明其它宿主/真实业务/未知许可grant/远端上线。
- **停止 / 恢复**：闭包/适配层不安全、来源分叉、版本不合法或清单无真实源时，只停该构建/检查，回P4原writer；配置/终末接口缺口分别回P2/P3；保原错误和用户目标，修自己hunk后原独立方定向复验
- **测试变更请求**：当前未发生测试变更；冻结后任何断言变更回原owner和独立批准者，保原因/影响/原失败/复验，不改判据求绿。
- **完成**：前置（不作完成条件）：命令可执行且真实原件可读。完成条件（只写效果）：独立执行者按Appendix A原判据复放本卡消费者效果、反例及限制；语义未执行记incomplete，判定者为本卡独立测试/读者，协议为本卡场景，计划落点`quality/evidence/p4-versioned-release-effect.md`；机器面未跑不冒通过。

## 下一消费者拿什么继续？

P5取完整包、命令/版本输出和唯一矩阵，P6消费最终README后再构建一次。
真实构建ref/输出目标由本段capture原件提供，不猜“最新目录”或存第二发布状态对象。

## 任务编号怎样对照？

| 正文 | 机器编号 | 交付 |
| --- | --- | --- |
| 任务4 | T004 | 完整1.0.0发布物 |

## 机器字段（校验器用，人可跳过）

- **全局规格**：`spec.md#实现设计（全局权威）`
- **写入集**：`tools/cli/build-release.mjs`；`tools/cli/build-skill-manifests.mjs`；`runtime/distribution/update-check.mjs`；`runtime/distribution/update-check.test.mjs`；`tools/cli/onboard-release.mjs`；`package.json`；`package-lock.json`；`repo-skills.manifest.json`；`external-skills.manifest.json`；`docs/release-support-matrix.md`；`docs/external-skills-compat-matrix.md`；`tests/contract/release-tree.test.mjs`；`tests/contract/skill-manifests.test.mjs`；`docs/architecture/move-map.json`
- **依赖**：P1、P2、P3
- **消费者**：P5 README作者、P6安装验证者与发布维护者
- **gate_cmd**：`node node_modules/vitest/vitest.mjs run runtime/distribution/update-check.test.mjs tests/contract/release-tree.test.mjs tests/contract/skill-manifests.test.mjs`
- **oracle**：ORACLE-VERSIONED-RELEASE
- **evidence_path**：planned: `quality/evidence/p4-versioned-release-effect.md`
- **STOP**：闭包/适配层不安全、来源分叉、版本不合法或清单无真实源时，只停该构建/检查，回P4原writer；配置/终末接口缺口分别回P2/P3；保原错误和用户目标，修自己hunk后原独立方定向复验
- **覆盖 AC**：AC-C10-1、AC-C10-3、AC-C10-5
- **Done**：前置（不作完成条件）：当前原件与范围命令可读。完成条件（只写效果）：逐条按同一Appendix A给AC-C10-1、AC-C10-3、AC-C10-5的消费者效果/反例及原件；语义未执行记incomplete，具体独立判定者/协议在本文件验收节，计划落点为`quality/evidence/p4-versioned-release-effect.md`；当前只规划未实施，机器面未执行不报pass，真实资源缺失给owner和恢复条件。
