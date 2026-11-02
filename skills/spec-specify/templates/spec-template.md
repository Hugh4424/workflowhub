# 功能规格：配置读取错误定位（示例：照抄形状，勿照抄文字；下列来源、路径与结果须按真实任务替换）

本文件写给产品规格作者、实施者与独立验收读者；读完要能定位用户目标、场景、来源与唯一验收判据。

> 写作标准：`skills/material-writing/SKILL.md` 的「材料写作标准（唯一）」是本文件唯一标准。
> 本文件不复述标准，只说明自己的例外。
> 例外：`## 实现设计（全局权威）` 与四个小节名是逐字读取的，保留原词。
> 验收标准与档位不自造：写法见 `docs/architecture/test-asset-governance-rules.md`；
> 八值档位只引 `runtime/evidence/acceptance-evidence-validator.mjs` 的词表。

本文件承载产品行为与全局实现设计，Phase 文件只写各包差异，索引只存指针。
引用 PRD 或 decision-log 的稳定目标与裁决时给指针，不在本文件重写第二份产品目标。
叙事主干连续说明问题、目标、取舍和机制；可判定验收正文只在 Appendix A。

## 这是什么，给谁用？

给命令行使用者一个有位置的配置读取错误，并保留合法配置的既有读取。

- **功能名**：配置读取错误定位
- **来源**：示例来源 R-001 与 decision-log.md 的 ADR-001；不是当前任务确认事实
- **状态**：草稿；示例未取得真实确认

## 一页看懂：谁要什么结果，怎么算通过？

使用者读取非法配置时得到带文件位置的错误，合法配置仍被读取。

- **需求 1**：非法配置不能静默回退默认值，要显示文件位置并以非零退出。
- **需求 2**：合法配置按既有路径返回同样的字段。
- **最大影响面**：配置加载与命令行错误输出。
- **验收信号**：判据见 Appendix A 的 AC-DOMAIN-001 与 AC-DOMAIN-002。
- **非目标**：不新增配置格式，不做热更新，不改认证与权限。

## 为什么做，给谁用？

默认值掩盖配置错误时，使用者找不到要修的那一行。

### 需求 1：使用者要看到非法配置的出错位置

错误被默认值掩盖时，使用者无法找到需要修复的行。
需求 1 要求错误定位与非零退出，让人在继续操作前看清失败。
来源是示例需求 1；真实入口与裁决由任务作者核实。

### 需求 2：合法配置仍按既有路径读取

合法配置的字段形状与读取路径保持不变。
需求 2 只约束失败传播，不扩大配置格式。
来源是示例需求 2；真实消费者由 build-plan 核实。

### 背景是什么？

示例命令行接口已有配置加载入口；已接受决定 1 选择显式错误而非回退默认值。
真实入口与裁决由任务作者核实。

## 做成什么样？

两条验收分别判失败路径和合法路径；正文只写场景与落点，判据见 Appendix A。
每条验收都要能指向落点：真实 task-id，加承载它的 Phase 文件路径或门禁入口。
落点让读者知道去哪做；只写「应当验证」而不给落点，这条验收不算写完。
验收按 Phase 与工作包设计；每条原始需求是否都被覆盖，由收口时的覆盖核对判；成本、资源来源、为什么不能再简写进 Appendix A。
覆盖核对判据见 `skills/spec-analyze/SKILL.md` 的「原始需求覆盖核对」。
最小充分验收：能用既有样本就不新造；能抽检就不全量；能一次就不做两次；能用一条命令判就不写人工流程。
**只要判真伪的能力不降，就必须选更便宜的那种。**
因标准本身不可判而长期停在 `incomplete`／`unavailable` 的，算标准缺陷，先改标准；档位规则见 Phase 模板「档位使用规则」。

### 验收 1：非法配置的失败路径

场景 1：使用者执行 `cli --config config/broken.json`，文件第 7 行缺少 name。
落点：P1/T001 与 `phases/P1-配置错误定位.md`；门禁命令由该 Phase 卡给出。
判据：见 Appendix A 的 AC-DOMAIN-001；通过、失败与证据只在那里写。

### 验收 2：合法配置的读取保持

场景 2：使用者用同一命令行读取合法配置。
落点：P2/T002 与 `phases/P2-配置错误定位.md`；门禁命令由该 Phase 卡给出。
判据：见 Appendix A 的 AC-DOMAIN-002；通过、失败与证据只在那里写。

## 打算怎么做？

复用加载与命令行模块，只改错误传播，放弃默认值兜底。

### 方案 1：复用加载与错误传播

做什么：加载模块消费配置路径，返回对象或带位置的错误；命令行把错误写到 stderr。
为什么这样：默认值兜底会掩盖失败，显式错误让使用者看见需要修的行。
怎么验：同一命令行在非法配置上非零退出，在合法配置上退出 0。
失败怎样：位置无法确定时明确 unknown，不编造行号，不回退默认值。

## 谁先谁后？

Phase 1 交付加载与错误传播，Phase 2 是唯一末验收并读回 Phase 1 原件。

- Phase 1：改加载与命令行错误传播，交真实命令和原始输出。
- Phase 2：一次读回 Phase 1 原件，完成合法与非法配置的独立复放，覆盖全部验收。

## 还有什么没定？

真实加载入口与来源尚未核实，由 build-plan 作者承担。

- 未决 1：真实加载入口、符号与消费者未核实；影响写集与命令；由 build-plan 核实后才形成实施范围。

## 实现设计（全局权威）

用既有加载与命令行模块实现错误传播，不新增状态、schema 或公共命令。

本节消费 PRD 与 decision-log，不再决定产品目标。
每项缺失写 `unknown — owner / impact / next action`，不以猜测填空。

### 代码锚点

实施者先读加载分支，再读命令行错误输出分支。

- **来源边界**：原始 PRD 与 decision-log 只作来源映射，不在实现设计中创建第二份需求账本。
- **现状与目标差异**：示例现状是解析错误回退默认值，目标是位置错误；真实源码证据待未决 1 核实。
- **读取顺序**：先读 `src/config/load.ts` 的加载分支，再读 `src/cli/main.ts` 的错误输出分支。
- **代码锚点**：示例 `src/config/load.ts` 的 `loadConfig(path)` 与 `src/cli/main.ts` 顶层错误处理；真实符号待 build-plan 核实。
  锚点写符号或签名与所在文件；行号只作定位辅助，标注为生成时刻快照、会漂移、不作契约。
- **运行条件**：示例采用 Node ESM 与单文件测试；实际版本、依赖和入口按仓库查证。

### 接口与失败语义

输入是配置路径，输出是对象或带位置的错误，失败不回退默认值。

- **选择的架构方案**：复用加载与命令行模块，只改错误传播；放弃默认值兜底，因为它掩盖失败。
- **模块职责**：加载模块消费文件并产出对象或错误；命令行消费错误并输出位置；两者均不裁决质量。
- **接口与数据流**：配置路径 → 读取、解析、校验 → 对象或错误 → stderr 与退出码；无新持久化，合法对象形状保持。
- **失败语义**：缺文件、非法内容与缺字段明确失败；位置 unknown 如实呈现，不重试、不回退默认值。
- **新增控制面**：`N/A — 使用既有命令行与错误类型，无新控制面`。

### 需求到任务追踪

两条来源各绑一条功能需求、一条验收、一个任务与一个判定器。

| Source | FR | AC | Phase/Task | oracle |
| --- | --- | --- | --- | --- |
| R-001 / ADR-001（示例来源；真实原件待未决 1 核实） | FR-DOMAIN-001 | AC-DOMAIN-001 | P1/T001 | ORACLE-CONFIG-ERROR |
| R-002（示例来源；真实原件待未决 1 核实） | FR-DOMAIN-002 | AC-DOMAIN-002 | P2/T002 | ORACLE-CONFIG-ERROR |

正文中文编号与机器编号的完整对照见 Appendix B。
追踪只引用真实原件或明确缺口；ID 出现但没有具体行为与反例，不算覆盖。

### 全局验证策略

用非法配置第 7 行与合法配置对照，检查位置、退出码和原始输出。

- **验证策略**：一个命令行配置功能域的错误传播；实际任务按 Phase 重判。
- **RED 与 GREEN 设计**：同一判定器；RED 为具名目标失败，GREEN 退出 0；未执行不宣称 RED 或 GREEN。
- **最终聚合**：由验收 Phase 逐条消费加载与命令行证据核对 AC-DOMAIN-001 与 AC-DOMAIN-002；本模板不宣称执行结果。
- **不能证明的内容**：不证明真实仓库路径存在、完整生产流程或当前质量通过。

## 怎么算通过？

按 Appendix A 的同一判定器逐条核，命令留所属 Phase，证据计划写七项。
每条验收的环境与数据、谁判、承接也写在 Appendix A，不另建第二份判据。

### 验收判据在哪里？

验收判据只在 Appendix A：通过条件、失败条件与证据都写在那里。
正文和 decision-log 的交接索引只给指针，例如「判据见 Appendix A 的 AC-DOMAIN-001」。
同一份判据写两处必然漂移，读者不知道听哪个。
Appendix A 的每条验收写落点、验证、环境与数据、谁判、承接。
还要写成本、资源来源、为什么不能再简、通过、失败与证据；不能为缩短省掉必要条件。

### 判定对象怎么与需求对齐？

每条验收的判定对象，默认保留需求的业务目标与原 AC 规定的验证环境。
这里的判定对象指被验的业务行为；环境对象见下一节。
不要求同一物理库或文件；降级到副本或替身时，按原 AC 已确定的等价隔离边界使用。
边界未确定时，副本或替身的证据不能冒充运行目标达成；合法隔离环境不逐项新增 owner 批准。
只有改原 AC 的对象、判法或验证环境，才交原 owner；不要求每个任务触生产。
需求说 A、验收在 B 上判，B 通过不代表 A 达成。

### 验收对象是什么？

验收对象按本任务真实待验目标填写下方JSON，并说明每项来源与未观察范围。
生成spec.md时保留本节内的“验收对象”机器标题和json数据块，不能只交散文。
该子标题由现有CLI逐字定位，按写作标准的机器标题例外保留；原问句标题供人阅读。

以下JSON只示范形状；null表示真实输入尚缺，生成时按当前目标替换，保留真实缺项。
示例、占位文字与unknown填充不能冒充可用对象。
页面目标或调用来源不完整时，仍按workspace、service、route、state、viewport五项检查。
纯CLI目标仅按下方唯一生产函数的分支合同填写cli数据，并随调用交三类真实来源上下文。
不能因交付的是脚本或文档，就把其中被验的页面目标声明为无UI。
workspace来自认证工作区；service、route来自真实服务配置或入口；state来自实际待验状态。
viewport来自规定尺寸或真实观察；规定目标不等于已认证的运行观察。
owner未给、null或空白时，执行结果仍为“用户”；已有非空owner原值保留。

机器区供校验器读取，人可跳过；实例数据与下方唯一生产函数分开维护。

#### 验收对象

```json
{
  "workspace": null,
  "service": null,
  "route": null,
  "state": null,
  "viewport": null,
  "owner": null
}
```

下方代码是唯一 `checkAcceptanceObject(input, context={})` producer。
生成 `spec.md` 只填对象数据和来源安排，不复制此 JS。
消费者读取唯一 marker 后立即跟随的完整 js 代码块。
仅移除具名函数 export，在 Node VM 空上下文取得函数并传真实对象与调用内 context。
`ok` 仅表示最小字段已提供，不验证来源事实真值、URL 或尺寸语义、权限、完整设计来源、环境健康或业务效果。
缺项按固定顺序点名；undefined、null、空串与全空白均不能静默通过，非对象或数组输入明确抛错。
返回仍仅有 ok、missing_fields、object，保原输入与 context 不变。

<!-- c01-acceptance-object-check -->
```javascript
export function checkAcceptanceObject(input, context = {}) {
  // 本模板“验收对象”合同：调用者先核实三种真实来源；本函数仅核结构/引用，不认证适用性事实。
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("acceptance input must be an object, not null or an array");
  }
  const object = { ...input };
  const empty = value => value === undefined || value === null
    || (typeof value === "string" && value.trim() === "");
  const record = value => value !== null && typeof value === "object" && !Array.isArray(value);
  const presentSource = value => typeof value === "string" ? value.trim() !== ""
    : value !== null && typeof value === "object" && Object.keys(value).length > 0;
  const sources = record(context) && record(context.sources) ? context.sources : null;
  const resolves = ref => {
    if (!sources || typeof ref !== "string" || ref.trim() === "") return false;
    const hash = ref.indexOf("#");
    const key = hash < 0 ? ref : ref.slice(0, hash);
    if (!key || !Object.hasOwn(sources, key)) return false;
    let value = sources[key];
    if (hash >= 0) {
      const pointer = ref.slice(hash + 1);
      if (!pointer.startsWith("/")) return false;
      for (const token of pointer.slice(1).split("/")) {
        if (/~(?:[^01]|$)/.test(token)) return false;
        const part = token.replace(/~1/g, "/").replace(/~0/g, "~");
        if (value === null || typeof value !== "object" || !Object.hasOwn(value, part)) return false;
        value = value[part];
      }
    }
    return presentSource(value);
  };
  const applicability = record(context) && record(context.ui_applicability) ? context.ui_applicability : null;
  const cliScope = applicability && ["raw_requirement", "project_inventory", "planned_or_changed_frontend_fact"].every(key => {
    if (!Object.hasOwn(applicability, key)) return false;
    const source = applicability[key];
    return record(source) && source.ui_scope === false
      && typeof source.reason === "string" && source.reason.trim() !== "" && resolves(source.source_ref);
  });
  let missing_fields;
  if (cliScope) {
    const cli = record(input.cli) ? input.cli : {};
    missing_fields = ["workspace", "state"].filter(field => !Object.hasOwn(input, field) || empty(input[field]));
    if (typeof cli.command !== "string" || cli.command.trim() === "") missing_fields.push("cli.command");
    for (const field of ["entry_ref", "sample_ref", "oracle_ref"]) {
      if (!resolves(cli[field])) missing_fields.push("cli." + field);
    }
  } else {
    const fields = ["workspace", "service", "route", "state", "viewport"];
    missing_fields = fields.filter(field => !Object.hasOwn(input, field) || empty(input[field]));
  }
  if (empty(object.owner)) object.owner = "用户";
  return { ok: missing_fields.length === 0, missing_fields, object };
}
```

### 证据计划怎么写？

证据计划把判定义务分到已有 Task 字段，不另建验收计划。
七项是判什么、怎么判、证据从哪来、谁提供、何时能拿到、成本类别、拿不到怎么办；缺一项不得开工。
拿不到证据时写真实尝试、卡点、提供者与恢复条件，不把缺口记为完成。

证据计划：判什么=非法配置报出文件路径并以退出码2结束；怎么判=ORACLE-CONFIG-ERROR 核文件路径、行号与退出码；证据从哪来=quality/tests/config-error.output 单份原件；谁提供=配置加载器测试作者；何时能拿到=P1命令退出后；成本类别=命令级；拿不到怎么办=按验收流程记 incomplete 或 unavailable

未达成项按真实尝试记录：incomplete：AC-…；试过=<命令与原 ref>；卡在=<真实条件>；谁提供=<真实对象>；恢复条件=<可观察条件>。
机器判据无真实尝试原 ref 不得记 incomplete；语义判定未执行可记 incomplete。
语义判定的 incomplete 写判定者、观察协议、证据落点与约定时点；`unavailable` 须给原因与恢复条件。
可带缺口进 stage-close；最终报告逐条列缺口，不宣称完成。

## 测试计划是什么？

逐条需求与承接验收先写验证层、命令或数据、预期结果、失败条件，四项齐才开工。

开工前四要素清单：逐条需求与承接验收写明验证层、命令或数据、预期结果、失败条件。
四项缺一即未开工，不得用占位句补齐。
开工后发现缺项，保留缺项事实，补齐后再实施依赖部分。

按项目当前任务自行声明测试面，逐面写适用或具名不适用理由、判定器、证据类型和覆盖边界。
浏览器可见面没有浏览器端到端时写具名理由。
每个要测的面与覆盖验收指向所属 Phase 的一条可执行命令，保配对判定器。
`Appendix A` 只指同一判定器与预期证据，精确命令留给各 Phase。

材料作者与独立验收者在判定前读取
`docs/architecture/test-asset-governance-rules.md`
的「验收标准可执行形式（DER-01、DER-11；R-001、FR-16/AC-16）」节的好坏例、同尺、独立判定与匿名不自判要求。
样本与判定身份留本任务原件，本节不复制第二标准。

填写验收对象与输入安排时读 `skills/spec-plan/SKILL.md#Test design and quality`。
保留原 source ID、每条功能需求与验收到实际 Task 或判定器的关系。
核 reader 接纳与错误投影时，读
`skills/spec-plan/templates/phase-template.md#完整作者材料示例` 的四个精简兼容块。
核新版模板的完整作者消费时，独立作者按本文件正文、Phase 模板与 index 模板实际试写。
适用输入、验收对象、风险与未决、材料导航、逐文件责任与写主或并行均须有落点；不适用给真实来源与理由。

## 有什么风险和未决？

最可能损害结果的是位置丢失，未核实的是真实加载入口。

- **风险 1**：错误位置被丢失；触发条件是命令行只打印通用文本；后果是使用者不知道修哪一行。
  缓解是保留位置；位置不可确定时显示 unknown 并保留失败事实；由原 owner 在对应 Phase 处理。
  验证是检查缺字段与缺失文件的原始输出：路径必有，确定行号必须保留，不确定行号明确 unknown。
- **未决 1**：真实加载入口与来源尚未核实；影响写集与命令选择；由 build-plan 作者核实后才形成实施范围。
  关闭条件是取得真实来源、符号与消费者；本模板不冒核实完成。

### 补充材料与术语在哪里？

推导、原始输出与被否方案只放具名原件，正文按路径与节锚点回读。

引用具名原件路径与节锚点；正文只保留当前规则和依据，不复制长段原文。
新术语引用项目现有术语表；不存在的新概念先给本需求中的具体含义。
交接写明下游消费者、输入原件、触发条件和未完成项的恢复动作，执行结果保留在任务事实。

## Appendix A — 验收判据（唯一权威）

每条承诺如何验证、通过、失败并留下证据。

验收判定方式标注的唯一权威在 `spec.md` 的 Appendix A，只用三个固定自然语言词。
三个词都不要求用户在场：判定者是实现上下文之外的独立执行单元。
`机器可判`：本任务内一条命令可重放真假。
`只能人读`：判据是语义可用性，命令输出不构成结论；由独立执行单元按协议复读。
`需真实环境，可用自动化采集判`：真实外部环境产生判据，执行单元自动取回并留原件。
采集物是命令输出、截图或真实数据比对结果之一，不需要用户在场。
原验收同处写判定时点、执行 owner、所需条件与成功失败信号。
成本按下列两个示例写七字段；分钟是活动执行估算，硬上限与重试上限也须有值。
资源来源与能否就地构造另写在本条；缺字段先回原作者补齐，不带缺项进入 Phase。
Phase 汇总只引用本处成本，公式、等待分账和预算处置归 Phase 模板的验收节。
Phase 卡只引用原词，不改写或另写第二份权威。

- [ ] **AC-DOMAIN-001**：非法配置报文件路径并以退出码2结束。
  行号可确定时提供否则明确unknown。
  关联FR-DOMAIN-001。
判定方式：机器可判；判定时点：P1 实现与独立审查改完后。
落点：P1/T001 与 `phases/P1-配置错误定位.md`；门禁命令由该 Phase 卡给出。
验证：示例由测试作者在本次任务内提供第7行缺字段和缺失文件两种输入。
独立执行者经真实加载模块与命令行读取位置与退出码。
ORACLE-CONFIG-ERROR 核文件路径、行号7、缺失文件的路径与 unknown、退出码2。
真实入口与运行环境由未决 1 的 owner 核实，缺哪项输入即逐项保未知；精确命令留所属 Phase。
环境与数据：本机 Node 与仓库自带非法、缺失两份配置；由测试作者提供并在临时目录构造。
谁判：未参与实现的独立执行者，开发完成后判定，只读真实命令与原始输出。
承接：结论写 P1/T001 的「完成」及 `quality/tests/config-error-green.output`。
成本： executor=独立测试作者；estimate_min=10；hard_cap_min=30；
  resources=仓库自带非法与缺失配置、已核实的 Node 加载入口；
  observation=真实命令输出的路径、行号与退出码；retry_cap=1；evidence_tier=命令级。
资源来源：复用仓库自带的两份配置夹具，运行前拷进临时目录；不新造样张。
为什么不能再简：一条命令判两份配置；再简只剩「不报错」，判不出位置。
未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
通过：非法配置呈现文件路径和退出码2，行号可确定时提供否则明确unknown；缺失文件不编行号；所需来源和证据齐备。
失败：错误被默认值掩盖、文件路径或可确定的行号被丢失、不可确定的行号被编造或未标unknown，或退出码0。
证据：示例 quality/tests/config-error-green.output；实际单份原件路径由执行者发布，此处不是执行结果。

- [ ] **AC-DOMAIN-002**：合法配置仍按既有路径读取并以退出码 0 结束。
  关联FR-DOMAIN-002。
判定方式：机器可判；判定时点：P2 实现与独立审查改完后。
落点：P2/T002 与 `phases/P2-配置错误定位.md`；门禁命令由该 Phase 卡给出。
验证：示例由测试作者提供仓库自带合法配置；独立执行者用同一命令行读取字段与退出码。
ORACLE-CONFIG-ERROR 核合法配置字段与退出码0。
环境与数据：本机 Node 与仓库自带合法配置；由测试作者提供并在临时目录构造。
谁判：未参与实现的独立执行者，开发完成后判定，只读真实命令与原始输出。
承接：结论写 P2/T002 的「完成」及示例 `quality/tests/config-valid-green.output`。
成本： executor=独立测试作者；estimate_min=5；hard_cap_min=15；
  resources=仓库自带合法配置、已核实的 Node 加载入口；
  observation=真实命令输出的字段与退出码；retry_cap=1；evidence_tier=命令级。
资源来源：复用仓库自带合法配置夹具，不新造样张。
为什么不能再简：一条命令读合法配置；再简只剩「不报错」，判不出字段保持。
未执行记 `incomplete`，写判定者、观察协议与证据落点；`unavailable` 须给原因与恢复条件。
通过：合法配置返回既有字段，退出码 0，所需来源与证据齐备。
失败：合法字段形状改变、读取被新增错误拒绝，或退出码非 0。
证据：示例 quality/tests/config-valid-green.output；实际单份原件路径由执行者发布，此处不是执行结果。

> 验收判据停留在产品层；全局判定器映射见「需求到任务追踪」，精确命令留给所属 Phase。

## Appendix B — 需求与编号对照

正文中文编号与机器编号在这里一一对应。

| 正文编号 | 机器编号 | 说明 |
| --- | --- | --- |
| 需求 1 | R-001 | 非法配置要报出位置 |
| 需求 2 | R-002 | 合法配置保持可读 |
| 场景 1 | SCN-001 | 读取缺字段配置 |
| 场景 2 | SCN-002 | 读取合法配置 |
| 事实 1 | PFACT-001 | 非法配置当前可能回退默认值 |
| 功能需求 1 | FR-DOMAIN-001 | 配置错误定位行为 |
| 功能需求 2 | FR-DOMAIN-002 | 合法配置读取保持 |
| 验收 1 | AC-DOMAIN-001 | 非法配置的判定 |
| 验收 2 | AC-DOMAIN-002 | 合法配置的判定 |
| 风险 1 | RISK-01 | 错误位置被丢失 |
| 未决 1 | OPEN-01 | 真实加载入口未核实 |

- **FR-DOMAIN-001**：配置错误定位行为；关联 PFACT-001、SCN-001、AC-DOMAIN-001。
  包括读取、解析与缺字段错误；不增加配置格式。
- **FR-DOMAIN-002**：合法配置读取保持；关联 PFACT-001、SCN-002、AC-DOMAIN-002。
  只改错误传播，合法字段形状不变。

## 样本与读数

照下面的 good 样板仿写正文；bad 样板逐条标出编号重复、单行超长与常量字段三类病灶。

以下为独立可读的写作样板，命令与输入仅示例，尚未执行。
坏例按既有材料观察到的编号重复、单行超长和常量字段原创构造，不复制任务材料。

<!-- authoring-sample:good -->
```markdown
非法配置显示文件位置，并使命令行接口以退出码2结束。
合法配置继续由既有读取路径返回。
失败位置未知时明写未知，不返回默认对象。

- **FR-SAMPLE-001**：上述配置读取行为；依据是调用者提供的错误定位需求。
```

<!-- authoring-sample:bad -->
```markdown
- **FR-BAD-001**：FR-BAD-001 FR-BAD-001 FR-BAD-001 FR-BAD-001 FR-BAD-001 黑话字段堆叠重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明重复的内部说明。
- **证据计划**：固定常量
- **测试变更请求**：none
```

前后读数（仅上面两份样例，同一读数函数；不是整个模板的改善声明）：
改前坏例：编号重复率 6；单行最长 429 字；常量字段 2 行；每千字编号 12.959。
改后好例：编号重复率 1；单行最长 45 字；常量字段 0 行；每千字编号 9.009。
