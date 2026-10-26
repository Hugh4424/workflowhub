# 功能规格：配置读取错误定位（示例：照抄形状，勿照抄文字；下列来源、路径与结果须按真实任务替换）

读者：产品规格作者、实施者与独立验收读者。
读完要能：定位用户目标、场景、来源与唯一验收判据。

这是写作指引，不是质量门；机器读取的标题与标签、被锁定文字、真实逐字声明是允许的例外，照原样保留。

> 基于已接受的 PRD / decision-log。本文件承载产品行为与全局实现设计；
> Phase 文件只写各包差异，索引只存指针。引用 PRD/decision 的稳定目标与裁决，
> 不在本文件重写一份产品目标。
>
> **叙事主干**连续说明问题、目标、取舍和机制。所有可判定验收正文只在 `Appendix A`；
> 主干只保留稳定指针，避免双写。

- **功能名**：配置读取错误定位
- **来源**：示例来源 R-001 与 decision-log.md 的 ADR-001；不是当前任务确认事实
- **状态**：草稿；示例未取得真实确认

本类 P0 必留内容如下。该声明属于当前模板的人读选节指引，不是全仓固定清单，也不新增 runtime 标题、字段或质量门。

| 必留内容（P0） | 本模板已有落点 |
| --- | --- |
| 目标场景/需求 | 3. 用户场景与状态覆盖；5. 功能需求 |
| 全局实现设计与边界 | 实现设计（全局权威）；10. 明确不做与默认必须成立 |
| 唯一 Appendix A 的成功失败/证据 | Appendix A — 验收判据（唯一权威） |
| 真实验收表面与排除 | 验收流程；测试标准；验收对象 |
| 关键依赖/风险/来源 | 来源与决策映射；全局文件边界与依赖；12. 风险、未决与交接 |

生成时逐项在上述既有落点标状态，声明与实际内容一致才算在场：`written` 指向已写的必要内容；`not-applicable` 必须写不适用理由和依据，不能用它掩盖缺失设计；`deferred` 必须写责任卡、触发条件、受影响结果。P0 标题保留，deferred 只声明缺口和承接，不删除必要标题，也不冒已完成。P0/P1/P2 决定是否选节，三态决定在场内容的状态，两者不互相代替。

P1 由实际跨模块接口、数据迁移、UI 或部署约束触发，只展开对应设计；没有对象时在必要边界内写不适用理由及依据，不强填专节、不删全局设计。P2 只为具名读者确需的推导提供补充材料指针；验收判据仍只在 Appendix A 维护。

## 速读卡（30 秒）

本节回答：谁需要什么结果，最主要改动与验收信号是什么。

> 让读者 30 秒抓住需求；速读卡不超过 10 行是写作参考，不是字数门。每项只写短句。

- **一句话需求**：CLI 使用者读取非法配置时，得到带文件位置的错误而非默认值
- **核心改动点**：
  - 配置失败时抛出包含文件路径的错误；行号可确定时提供，否则明确unknown
  - CLI 将错误打印到 stderr，并以退出码2结束
- **最大影响面**：配置加载与 CLI 错误输出
- **验收信号**：非法配置显示位置且非零退出；合法配置仍被读取

## 来源与决策映射

本节回答：每项需求如何回到原始来源和已确认决定。

> 本节只保存 ID 关系，不复制 decision-log 正文；没有来源的新增需求必须回到 make-decision。来源必须明确标注原始 PRD/用户要求、decision-log 或已接受裁决。

| 来源 ID | 决定 ID | FR / AC ID | 状态 / 受影响范围 | 未决 / 交接 |
| --- | --- | --- | --- | --- |
| `R-001（示例需求编号）` | `ADR-001（示例决定编号）` | `FR-DOMAIN-001 / AC-DOMAIN-001` | `current；配置读取` | `build-plan 核实真实消费者与命令` |

每条 FR/AC 都必须能回到本表；范围修订只追加受影响映射与修订说明，
不另建需求账本。

## 1. 需求解释：问题与紧迫性

本节回答：用户遇到什么问题，为什么现在处理。

配置错误被默认值掩盖时，使用者无法找到需要修复的行。本例要求错误定位与非零退出，让使用者在继续操作前看清失败。

## 2. 背景、目标与范围

本节回答：当前产品基础、交付目标与范围是什么。

### 背景

本节回答：哪些既有能力与决定影响本需求。

示例 CLI 已有配置加载入口；ADR-001 选择显式错误而非回退。真实入口与裁决由任务作者核实。

### 目标

本节回答：用户能获得哪些可验证结果。

- 非法配置显示文件路径并以退出码2结束；行号可确定时提供，否则明确unknown
- 减少使用者在默认值与真实配置之间猜测的步骤

### 范围内

本节回答：本期具体交付哪些业务能力。

- 配置解析错误与 CLI 输出；合法配置读取保持

> 非目标只在第 10 节维护，避免两份真相。

## 3. 用户场景与状态覆盖

本节回答：谁在什么条件下触发动作，正常与异常结果是什么。

> 场景覆盖正常、边界、失败和权限路径，并说清“谁、在什么条件下、做什么、看到什么”。

### SCN-001：读取缺少必填字段的配置

本节回答：该场景的角色、前提、触发与可观察结果是什么。

- **角色**：CLI 使用者
- **前提**：示例配置 config/broken.json 第7行缺少 name
- **触发**：执行 cli --config config/broken.json
- **结果**：stderr 显示 config/broken.json:7，退出码2；不返回默认值
- **回写**：[修复后写哪条 case 改了、为什么改、改后判定，并同步本节与 Appendix A 的 AC]

### 状态覆盖清单

本节回答：默认、空、错误、加载、取消、边界、权限与竞态分别如何处理。

- [ ] **默认态**：SCN-001 的合法配置对照用例
- [ ] **空态**：SCN-001；空文件显式报配置错误
- [ ] **错误态**：SCN-001；缺必填字段返回定位错误
- [ ] **加载态**：N/A — 本例为同步CLI，无加载视图
- [ ] **取消态**：N/A — 本例不新增取消机制
- [ ] **边界态**：SCN-001；第7行缺少字段
- [ ] **权限态**：N/A — 不改变既有权限与认证
- [ ] **竞态**：N/A — 本例单进程只读配置，无共享写入

## 4. 产品事实与假设（PFACT）

本节回答：哪些事实已核实，哪些推断或未知影响需求。

> 这是 WorkflowHub 在 AgentHub 正文上的事实层。每条只选择一种状态，其他状态字段删除。

- **PFACT-001**：示例配置入口存在错误回退的待核假设，尚无真实源码证据
  - **状态**：`unknown`
  - **证据或来源**：示例 R-001；源码与执行证据 unknown，不宣称 verified
  - **负责人、影响**：build-plan 作者核实加载入口；影响 FR-DOMAIN-001 与 OPEN-01
  - **关联**：FR-DOMAIN-001、AC-DOMAIN-001、RISK-01、OPEN-01

> `unknown` 必须关联 RISK 或 OPEN；不能把推断写成已核实事实。

生成约束：本模板的 PFACT、FR、AC、场景、来源映射、验证方法、oracle 和失败条件必须直接满足
本节明确的来源、场景与验收内容。作者逐项补齐真实状态和失败条件；spec-analyze 只报告实际结构/引用缺口，独立审查判断语义质量。旧格式只读保留。

## 5. 功能需求

本节回答：产品必须具备哪些独立行为与失败边界。

> 沿用 AgentHub 的“叙述层 + 编号字段层”：先讲清完整行为，再做来源追溯。

### 配置错误定位（DOMAIN）

本节回答：本功能域如何把各项用户行为串起来。

使用者指定配置文件后，加载模块解析并校验；失败携带文件位置，CLI呈现错误。合法配置按既有路径返回，不以默认值掩盖非法内容。

- **FR-DOMAIN-001**：非法配置必须报出文件路径，并使CLI以退出码2结束；行号可确定时必须提供，否则明确标为unknown且不编造行号，关联 PFACT-001、SCN-001、AC-DOMAIN-001
  - **范围边界**：包括读取、解析与缺字段错误；不增加配置格式
  - **依据**：ADR-001、PFACT-001（示例；真实来源待OPEN-01核实）
  - **场景**：SCN-001
  - **验收**：AC-DOMAIN-001

> 新需求使用 `FR-DOMAIN-NNN`；FR 与 AC 的 DOMAIN 只写单段大写 `[A-Z][A-Z0-9]*`，序号正好三位。来源只认 R-、U-、PRD-、CARD- 开头的编号；每条 FR 至少连接一个 PFACT、SCN 和 AC。

## 6. 模块划分

本节回答：哪些产品职责可独立交付与验收。

需求同时捆绑多个可独立测试能力时，先用本节现有模块表标清稳定称谓、职责、依赖和实施顺序，再分别展开规格；依赖应单向无环，两个模块互相必需时先核是否本为一个模块，不以新增运行时 ID 或第二追踪索引解决。

> 只写产品职责，不写实现类名。整节不适用时写 `N/A — 具体理由`。

### 配置加载与错误呈现

本节回答：本模块负责什么、对外提供什么、依赖谁。

- **负责什么**：把非法配置转为可定位的错误
- **对外提供什么**：合法配置对象或带文件位置的配置错误
- **依赖谁**：既有文件读取与 CLI 入口
- **测试边界**：非法配置失败与合法配置读取各有具名对照

## 7. 关键实体

本节回答：哪些字段、约束和关系改变用户行为。

> 只写影响行为的字段和关系。整节不适用时写 `N/A — 具体理由`。

- **配置错误**：
  - **定义**：加载失败时交给CLI呈现的错误
  - **字段和约束**：file为读取路径；line在可确定时为对应行号，否则明确unknown，不编造行号
  - **关系**：一个加载请求至多返回一个对象或一个错误

## 8. 数据和生命周期

本节回答：数据如何产生、更新、迟到、保留与清理。

> 数据驱动需求必须填写；不涉及时写 `N/A — 具体理由`。

- **数据粒度**：一次CLI读取对应一个配置请求
- **数据时效**：每次调用读当前文件；不新增缓存
- **缺失或迟到**：文件缺失直接报读取失败；不补默认配置
- **预览与正式**：CLI只显示本次结果，无预览状态
- **当前与历史**：本次结果不持久化；既有历史不改写
- **归属与清理**：使用者持有配置；加载模块只读，不清理文件

## 9. 兼容性预留

本节回答：既有消费者如何保持，扩展承诺止于哪里。

> 分阶段交付时必须填写；不涉及时写 `N/A — 具体理由`。

- **既有消费方**：合法配置读取与字段形状保持
- **命名预留**：复用既有配置错误类型，不承诺新增public入口
- **容器预留**：N/A — 不新增持久化容器
- **状态预留**：保持成功/失败结果，不新增状态机
- **扩展边界**：本期只改错误传播；不承诺热更新或配置迁移

## 10. 明确不做与默认必须成立

本节回答：哪些范围被明确排除，哪些约束始终成立。

### 明确不做

本节回答：什么本次不选，来源与理由是什么。

- 不新增配置格式或热更新；示例 ADR-001 的本期范围

> 这是唯一权威非目标列表；上游批准的 out-of-scope 必须逐条继承或说明废弃理由。

### 默认必须成立

本节回答：哪些产品不变量不用用户重复提出。

- 合法配置保持可读，非法配置不回退默认值；关联FR-DOMAIN-001/AC-DOMAIN-001

## 验收流程

本节回答：从场景入口如何找到唯一AC与可回读证据。

从当前 decision-log 主文的 `## 验收面` 交接索引取可观察接口和成功失败边界，再从场景入口依次定位 FR、`Appendix A` 的同号 AC、所属 Phase 命令和可回读证据；按其外置事实索引的到达条件读唯一原 ref。本节只描述流程，不复制 AC 的通过或失败判据。

未达成项按真实尝试记录：`incomplete：AC-…；试过=<命令与原 ref>；卡在=<真实条件>；谁提供=<真实对象>；恢复条件=<可观察条件>`。无真实尝试原 ref 不得记 incomplete，未取得尝试时明确 unavailable 与原因。可带缺口进 stage-close；build-code 结束统一提醒，最终报告逐条列缺口，不宣称完成。

## 测试标准

开工前四要素清单：逐条需求与承接 AC 写明验证层（静态、定向测试、一次端到端、人工）、命令或数据、预期结果、失败条件；四项缺一即未开工。不得用占位句补齐；开工后发现缺项，保留缺项事实，补齐后再实施依赖部分。

本节回答：行为切片使用什么oracle、证据类型与覆盖边界。

按项目当前任务自行声明测试面，逐面写适用或具名不适用理由、oracle、证据类型和覆盖边界；浏览器可见面没有浏览器端到端时写具名理由。每个要测的面与覆盖 AC 指向所属 Phase 的一条可执行命令，保配对 oracle；路由档位不是项目测试面。`Appendix A` 只指同一 oracle 与预期证据，精确命令留给各 Phase，实现设计节承接全局验证策略。

材料作者与独立验收者在判定前读取 `docs/architecture/test-asset-governance-rules.md#验收标准可执行形式der-01der-11r-001fr-16ac-16` 的真实好坏例、同尺、独立判定与匿名不自判要求；样本与判定身份留本任务原件，本节不复制第二标准。

填写验收对象与输入安排时读 `skills/spec-plan/SKILL.md#Test design and quality`；保留原 source ID、每条 FR/AC 到实际 Task/oracle 的关系。需要核完整作者产物能否被生产 reader 消费时，读 `skills/spec-plan/templates/phase-template.md#完整作者材料示例` 的四个完整块；那里给一条行为和一条纯文档 G-2 的完整组合，本文件不另造第二份样例。

### 验收对象

本节回答：哪个真实对象被检查，缺什么输入，谁提供或执行。

当前 `spec.md` 在本节填写实际验收对象数据、每项来源与未观察范围；它属于现有规格，不另建验收对象文件。以下 JSON 只示范数据形状，null 表示仍缺真实输入，不能把示例、占位文字或 unknown 填充冒可用对象。缺省或来源不完整时，最小五项仍为 workspace、service、route、state、viewport，依此顺序检查；只有下述真实三源已核非 UI 的分支检查 CLI 对象，不按 UI/non_UI 标签跳过；其余适用 S5 设计来源、代码/URL、数据、权限由真实任务合同补齐，具名不适用与未知分别说明。

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

workspace 来自认证工作区；service、route 来自真实服务配置/入口；state 来自实际待验状态，viewport 来自规定的验收尺寸或真实观察。配置入口、状态定义和规定尺寸不证明服务已启动或页面已观察。owner 未给、null 或空白时，执行结果明确为“用户”；已有非空 owner 原值保留。缺任一最小项时保 null/缺失及提供者、影响和下一动作，不编默认服务、路径或尺寸。

下方代码是唯一 `checkAcceptanceObject(input, context={})` producer；生成 `spec.md` 只填对象数据和来源安排，不复制此 JS。消费者实际读原始要求、当前项目库存、已接受计划或实际前端改动，核三来源的角色、理由与范围矛盾，再把已读内容放入本次调用的 `context.sources` 材料映射；复用已有 `context.ui_applicability` 的 `raw_requirement/project_inventory/planned_or_changed_frontend_fact`，每项为 `{ui_scope,source_ref,reason}`。三项都明确为 false、理由为非空文本且引用可解析时才选 CLI；缺源、未知、冲突或任一 UI 事实沿原 Web 五项，并保存具体缺口。kind/non_UI、自选标签或字段可读均不能认证非 UI 事实。

引用只用 `sources` 自有材料 key 或 `key#/RFC6901-pointer`；整份材料用裸 key，出现 # 时后面必须以 / 开始，`key#` 不属于本合同语法。逐层自有属性，转义只认 ~0/~1；目标须为非空文本、对象或数组。允许三角色引用同一已读材料，但消费者仍核实其确有三个角色的事实，不能用同一标签冒充来源。CLI 对象使用 `input.workspace/state` 和 `input.cli.command/entry_ref/sample_ref/oracle_ref`；缺项依次报 `workspace,state,cli.command,cli.entry_ref,cli.sample_ref,cli.oracle_ref`。command 为非空文本；后三项引用同一 sources 中的入口权威、真实样本、oracle。规划入口可引用已有 spec/Phase 的明确计划文字，保 `state.execution=not_run`；不要求尚未实施的文件存在，也不冒命令已执行。workspace/state 仍沿原空值判据。

消费者读取唯一 marker 后立即跟随的完整 js/javascript 代码块，仅移除具名函数 export，在 Node VM 空上下文取得函数并传真实对象与上述调用内 context；保存对象输入、三来源引用/实际读取范围与内容 hash、返回结果和原始执行事实，既有原字节以 ref 复用，不把已读大材料再复制为证据。context 不持久化为新对象；函数只核结构、引用和缺项，不读文件、不执行命令、不认证来源语义。缺 marker、重复块、导出/执行失败显露 source/producer 错误，交原 owner 修复。

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

`ok` 仅表示最小字段已提供：合法对象保全部原输入与已有 owner，不修改调用者对象；缺项按固定顺序点名。undefined/null/空串/全空白均不能静默通过，非对象/数组输入明确抛错。返回仍仅有 ok/missing_fields/object，保原输入与 context 不变；坏 context 或 CLI 容器以原 Web 分支或具名 CLI 缺项处理，不新增异常。返回结果不验证来源事实真值、URL/尺寸语义、权限、完整 S5、环境健康或业务效果，不能作为阶段推进许可证；这些效果仍由各真实验收者独立观察。

## 架构边界

本节回答：产品接口与工程职责如何划分。

区分产品边界与工程边界：写明真实消费者、接口及兼容责任；
全局架构方案在下方「实现设计」维护，各 Phase 只承接自身差异。

## 实现设计（全局权威）

本节回答：用什么架构、接口、代码与验证策略实现已确认产品行为。

> `spec-plan` 在同一份 `spec.md` 内补齐已核实工程事实和方案。
> 本节消费 PRD/decision-log，不再决定产品目标。每项缺失写
> `unknown — owner / impact / next action`；不以猜测填空。

### 代码锚点

本节回答：实现者先读哪些真实路径、符号与消费者。

- **来源边界**：原始 PRD/用户要求与 decision-log 只作为来源映射，不在实现设计中创建第二份需求账本。
- **现状与目标差异**：示例现状为解析错误回退默认值，目标为位置错误；消费者CLI，真实源码证据待OPEN-01核实
- **读取顺序**：先读 `src/config/load.ts` 的加载分支，再读 `src/cli/main.ts` 的错误输出分支；这些是示例路径
- **代码锚点**：示例 `src/config/load.ts` 的 `loadConfig(path)` 与 `src/cli/main.ts` 顶层错误处理；真实符号待build-plan核实。锚点写符号／签名与所在文件；行号只作定位辅助，标注为生成时刻快照、会漂移、不作契约。契约面由点名的符号与行为语义构成；坐标、判定阈值与字段级方案归本实现设计，逐 Task 的坐标与常量名归 Phase 卡，数值唯一来源为生产代码内的既有具名常量。
- **运行条件**：示例采用Node ESM与单文件测试；实际版本、依赖和入口按仓库查证

### 接口与失败语义

本节回答：输入如何变成输出，非法或缺失输入怎样失败。

- **选择的架构方案**：复用加载与CLI模块，只改错误传播；放弃默认值兜底，因为它掩盖失败
- **模块职责**：加载模块消费文件产出对象或错误 → CLI消费错误输出位置；两者均不裁决质量
- **接口与数据流**：配置路径 → 读取/解析/校验 → 对象或错误 → CLI stderr和退出码；无新持久化，合法对象形状保持
- **失败语义**：缺文件、非法内容与缺字段明确失败；位置unknown如实呈现，不重试、不回退默认值；无共享写入竞态
- **新增控制面**：N/A — 使用既有CLI与错误类型，无新控制面

### 全局文件边界与依赖

本节回答：各Phase如何分工、依赖、并行与回滚。

- **新增**：N/A — 示例复用已有文件，实际文件存在性待OPEN-01核实
- **修改**：示例 `src/config/load.ts` 与 `src/cli/main.ts`；实际允许写集由Phase确定
- **禁止改动**：配置schema字段与默认值定义保持；真实保护路径由build-plan核实
- **全局依赖**：P1/T001加载和CLI错误传播串行交付，无跨Phase依赖；不重复持笔
- **文件归属**：P1唯一owner负责两个示例文件，不允许第二写者同时修改
- **回滚与恢复**：错误缺位置或合法输入回归时，原owner局部恢复该分支；不丢弃其它改动、不改历史

### 需求到任务追踪

本节回答：每个原始行为如何对应FR、AC、Task与正反oracle。

从当前 `decision-log.md` 的 `## 验收面` 交接索引与 R-、U-、PRD-、CARD- 编号逐条核对已确认 decision；
上游 PRD 原件在适用时另作只读对照。不能只复述 decision 摘要，也不能由本规格
或 analyzer 请求自报需求分母。先定位每个独立可验收的原始行为、量词、否定、
先后、边界和失败条件，在本表给可回读 source ID/位置；原始来源直接引用当前原件/节位置，不在 spec 复制认证身份或第二份需求账本。
缺原件标 `unknown — owner / impact / next action`，不得猜补。每个 in-scope source 必须连到
FR、AC、物理 Phase 的 Task、同义正反 oracle；反向检查每个 Task 有来源、验收和
真实消费者。标为 deferred/non-goal 的来源保留决策理由，不伪装成已实现。
ID、文件名或绿色测试名出现但没有具体行为、负例与原文强度对照，不算覆盖。

| 来源 / 决定（decision-log ID/位置；适用时附上游引用） | 原义行为/强度 | FR / AC | Phase / Task | 正例 + 负例判据 / 证据 | 依赖 / 状态 |
| --- | --- | --- | --- | --- | --- |
| R-001 / ADR-001（示例来源；真实原件待OPEN-01核实） | 非法配置必须报位置，不得回退默认值 | FR-DOMAIN-001 / AC-DOMAIN-001 | P1/T001 | ORACLE-CONFIG-ERROR：非法配置报错、合法配置返回；单份执行原件 | none；来源与入口待build-plan核实 |

### 全局验证策略

本节回答：各风险如何被目标检查与最终逐AC验收覆盖。

- **验证策略**：feature行为示例：一个CLI配置功能域的错误传播；实际任务按Phase重判。用非法配置第7行与合法配置对照，检查错误位置、退出码和原始输出；不证明外部环境
- **RED/GREEN 设计**：示例命令 `node --test tests/config-load.test.mjs`：同一ORACLE-CONFIG-ERROR，RED为具名目标失败、GREEN退出0；未执行不宣称RED/GREEN，实际命令由Phase核实
- **最终聚合**：由验收Phase逐条消费加载/CLI证据核对AC-DOMAIN-001；本模板不宣称执行结果
- **不能证明的内容**：不证明真实仓库路径存在、完整生产流程或当前质量通过；build-plan核实入口，verify-code独立核对效果

每个 Phase `phases/P<n>.md` 指向本节和全局目标的稳定锚点，不复制全局设计；
每个 Task 再写自己的第一步代码动作、同命令 RED/GREEN 和失败 oracle。

## Appendix A — 验收判据（唯一权威）

本节回答：每条承诺如何验证、通过、失败并留下证据。decision-log 主文的 `## 验收面` 只交接可观察接口与成功失败边界，条件原 ref 按其外置事实索引回读；判据以本节为准，AC 编号同号。每条 AC 用四行式，不超过一段说明加四条判据是写作参考；不能为缩短省掉必要条件。修复回写哪条 case 改、为什么改、改后判定，不在其他节双写判据。

- [ ] **AC-DOMAIN-001**：非法配置报文件路径并以退出码2结束，行号可确定时提供否则明确unknown；合法配置仍可读取；关联FR-DOMAIN-001
验证：示例由测试作者在本次任务内提供第7行缺字段、缺失文件和合法配置三种输入，独立执行者经真实加载模块→CLI读取位置与退出码；ORACLE-CONFIG-ERROR核文件路径/行号7、缺失文件的路径/行号unknown、退出码2及合法配置对照。真实入口与运行环境由OPEN-01 owner核实，缺哪项输入即逐项保未知；精确命令留所属Phase
通过：非法配置呈现文件路径和退出码2，行号可确定时提供否则明确unknown；缺失文件不编行号；合法配置返回既有字段；所需来源和证据齐备
失败：错误被默认值掩盖、文件路径或可确定的行号被丢失、不可确定的行号被编造或未标unknown、退出码0或合法配置不可读
证据：示例 quality/tests/config-error-green.output；实际单份原件路径由执行者发布，此处不是执行结果
证据计划：判什么=本条首句的非法与合法配置结果；怎么判=验证中的ORACLE-CONFIG-ERROR；证据从哪来=本条证据行的唯一命令原件；谁提供=验证中具名测试作者与执行owner；何时能拿到=验证所定Phase执行时点；成本类别=测试标准中本条测试面所需的命令级成本；拿不到怎么办=本条失败条件与验收流程的incomplete记录

> 验收判据停留在产品层；全局 oracle 映射见「验证策略与追溯」，精确命令留给所属 Phase。

## 12. 风险、未决与交接

本节回答：哪些触发可能损害结果，由谁在哪个阶段处理。

- **RISK-01**：错误位置被丢失
  - **受影响 ID**：PFACT-001、FR-DOMAIN-001、AC-DOMAIN-001
  - **触发条件**：CLI捕获错误后只打印通用文本
  - **后果**：使用者不知道需要修复哪一行
  - **缓解或停止**：原owner保留位置；若位置确实不可确定则显示unknown并保留失败事实
  - **处理阶段**：按本风险的真实 owner 填当前适用阶段；旧 `build-spec` 仅作 pre/history 来源，不用于当前处理。
  - **验证**：检查缺字段和缺失文件的原始输出：文件路径必有，确定行号必须保留，不确定行号明确unknown；缺路径、丢确定行号或编行号为未达成

- **OPEN-01**：真实加载入口与来源尚未核实
  - **受影响 ID**：PFACT-001、FR-DOMAIN-001、AC-DOMAIN-001
  - **负责人**：build-plan作者
  - **影响**：可能选错写入文件或把示例当真实来源
  - **处理阶段**：build-plan
  - **关闭条件或停止**：核实真实来源、符号与消费者后才形成实施范围；本模板不冒核实完成

## 13. 业务影响与回归范围

本节回答：改动影响哪些既有行为，哪些路径须保持。

### 合法配置读取

本节回答：该功能的既有行为、变化与回归路径是什么。

- **既有行为**：合法输入返回既有配置对象
- **本需求影响**：错误传播只改变非法输入；合法字段保持
- **回归路径**：合法配置夹具仍返回相同字段；由所属Phase具名对照检查
- **验收**：AC-DOMAIN-001 的合法配置对照

- **可能受冲击的业务规则**：配置schema字段与合法输入语义保持
- **明确无影响**：本例无共享写、迁移、认证或外部服务变更；实际任务须自行核实

## 补充材料

本节回答：推导、原始输出与被否方案到哪里查。引用具名原件路径与 anchor；正文只保留当前规则和依据，不复制长段原文。
