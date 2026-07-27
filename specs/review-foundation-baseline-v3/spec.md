# 处理组 1：基础口径规格

## 目标

修复和固化问题 1、6、10、12 的基础口径，让监控目标、审查路径配置、审查结果登记和失败分类都能如实工作；不修改 Multica daemon、provider、model 或默认配置，不引入新的审查、部署或指标框架。

## 已锁定决策

1. 监控命令必须显式指定 Multica profile 和 workspace；默认 localhost 失败不能作为远端任务故障证据。
2. 当前审查路径配置错误时立即停止；其他路径错误只显示可定位 warning；独立 doctor 使用同一校验逻辑严格检查全部路径。
3. 审查修复必须验证源仓、每条 active runner、fresh stage-runtime 进程三层事实；缺一层不能宣称部署验证完成。
4. 审查执行失败与审查发现分层统计；原始错误码保留，未知码显示 UNKNOWN warning，失败 attempt 不进入 finding 或质量分母。
5. 已有 review finding 经同一 review flow 的 verified non-gate resolution 完整处置且未接受风险时，正式阶段不得继续根据旧 `revise_required` 结果错误暂停。

## 范围

### 包含

- 监控 SOP：显式 profile、workspace 和实际目标记录。
- wh-review 当前路径与非当前路径的分级配置校验。
- 一个复用相同纯校验逻辑的全量 doctor 入口。
- make-decision 正式登记对 verified non-gate resolution 的正确处理。
- 审查修复三层验证说明和聚焦回归测试。
- 审查执行失败分类、原始错误码保留、UNKNOWN warning、耗时和 retry count 展示。

### 不包含

- 修改 Multica 默认 profile、daemon、provider、model、workspace 或认证。
- 修改审查路由顺序、fallback 或 broker 协议。
- 新增 provider 健康探针、自动重试、人工重发 `--force` 机制或新 finding 枚举。
- 新增 runner 发现、复制、同步或部署框架。
- 桥接 `metrics/collector.mjs`，或新建统一指标平台。
- 修改 TaskKernel 权限模型、review result 内容或把 resolution 伪装成新的 `pass`。
- 扩展到其他处理组。

## 功能要求

### FR-001 监控目标必须明确

监控规程必须要求每次 Multica 读取显式提供 profile 和 workspace，并记录实际请求目标。默认 localhost 连接失败只能记录为本地默认配置不可用，不能推断远端 Issue、run、daemon、provider 或 model 状态。

### FR-002 当前审查路径严格校验

wh-review 必须仅把本次请求的“stage + review track”作为当前审查路径。当前路径配置不合法时必须 fail loud，且错误指出具体 stage、track、profile 和字段。

### FR-003 非当前路径只告警

加载当前审查路径时，其他已配置路径的不合法声明必须形成明确 warning，但不能阻断当前请求。warning 不得静默吞掉，也不得改变当前路径的 provider/model/priority 或 fallback。

### FR-004 全量 doctor 复用同一校验逻辑

独立 doctor 必须严格扫描全部 stage 和 track，并复用 FR-002/FR-003 使用的同一纯校验函数。任一非法路径使 doctor 非零退出；合法全量配置退出 0。

配置语义固定为：priority 相等合法并保持列表顺序；同一路径重复 profile 非法；跨路径复用合法；缺失路径沿用既有 fallback；兼容模式的空 profiles 保持现状。

### FR-005 verified resolution 消除错误暂停

make-decision 读取 review result 时，如果同一 task、stage、track 的当前 authenticated review flow 已记录 `recorded_non_gate_response`，并同时满足下列条件，旧结果的 `revise_required` 不得继续触发 serious-review pause：

- resolution 的 `evidence_state` 为 `verified`；
- previous result ref/hash 与当前读取的 review result 完全一致；
- task、stage、track、workflow run 和 snapshot 绑定通过现有校验；
- response ledger 覆盖全部 actionable finding；
- 每条 actionable finding 的处置为 `fixed` 或 `rejected_invalid`；

该行为只消除过时暂停，不修改原 review result，不生成新 verdict，也不把 `revise_required` 改写为 `pass`。

### FR-006 未验证或接受风险时保持暂停

缺少 resolution、evidence 未验证、ref/hash/snapshot/flow 不匹配、ledger 覆盖不完整，或存在 `accepted_risk` 时，沿用现有 serious-review pause 和人工风险接受行为。伪造或跨 flow resolution 必须 fail loud。

### FR-007 修复登记必须经过真实故障路径

现有官方测试必须增加一个精确用例：review result 含 actionable finding，随后同 flow 发布 verified non-gate resolution；正式 make-decision run 应成功发布 attempt，`missing_items` 不再包含已处置 finding。破坏 resolution 绑定或将 finding 改为 accepted risk 时，该用例必须稳定失败或暂停。

### FR-008 三层部署验证说明

现有 wh-review E2E 文档必须要求在源仓、每条 active runner、fresh stage-runtime 进程三层运行聚焦验证，并记录执行位置、cwd、完整命令、开始/结束时间、退出码、runner commit 或配置路径、NODE_PATH。WorkflowHub 只规定证据格式，不负责发现或同步 active runner。

### FR-009 审查执行失败分类

报告投影层必须按以下固定映射展示 provider attempt；原始 `error.code` 必须逐字保留。

- provider status 为 `completed` 且有有效语义结果 → 完成。
- `OUTPUT_INVALID` 或 `PROVIDER_OUTPUT_INVALID` → 输出格式错误。
- `PROVIDER_UNAVAILABLE` 或 `PROVIDER_HEALTH_FAILED` → 不可用。其他认证、网络、限流、权限等 provider 失败保留原码并归不可用。
- `TIMEOUT` 或 `PROCESS_TIMEOUT` → 超时。
- `SAME_SOURCE` → 同源排除。
- provider status 为 `cancelled` 或 error code 为 `CANCELLED` → 取消。
- 其他未列出的 code → UNKNOWN，并显示 warning。

### FR-010 finding 与 attempt 分层

attempt 未产生有效语义结果时不得进入 finding 统计或模型质量分母。有效 finding 继续使用现有 adjudication 结果，不建立第二套 finding 枚举。

### FR-011 失败耗时口径

失败 attempt 只展示 provider 公共协议提供的总耗时和 retry count，并明确这不是纯模型推理时间。缺失字段显示“未提供”，不得估算；不得把失败耗时混入成功审查耗时或质量分母。

### FR-012 保持系统边界

所有修改必须保持 WorkflowHub 可脱离 Multica 独立运行。问题 1 仅写监控规程；问题 6、10、12 只修改现有 WorkflowHub 校验、stage handler、报告和测试/文档边界。

## 验收标准

### AC-001 监控口径

给出一条显式 profile + workspace 的真实读取记录，能够读取 Issue、run 和评论；同一环境的默认 localhost 失败被标记为本地默认配置问题，没有被报告为远端故障。

### AC-002 当前路径错误

fixture 中当前 stage/track 的 priority 顺序非法时，wh-review 在 provider 调用前非零退出，并指出当前路径。

### AC-003 非当前路径错误

fixture 中当前路径合法、另一路径非法时，当前审查继续，输出包含可定位 warning，provider 路由保持当前路径配置。

### AC-004 doctor 全量校验

同一份非法非当前路径配置交给 doctor 时非零退出；合法全量配置退出 0。相等 priority、跨路径复用、缺失 fallback、兼容空 profiles 分别有固定测试；同一路径重复 profile 必须分别覆盖当前路径 fail、非当前路径 warning、doctor 非零退出。

### AC-005 verified resolution 正常完成

使用含 actionable finding 的真实 review result 和同 flow verified resolution 运行 make-decision：attempt 成功发布，保留原 `revise_required` 事实，绑定 resolution evidence，且 `missing_items` 为空。

### AC-006 resolution 负向边界

分别覆盖缺失 resolution、unverified、result ref/hash 不匹配、snapshot/flow 不匹配、ledger 漏 finding、accepted risk。每种情况必须 fail loud 或保持 serious-review pause，不能发布假完成。

### AC-007 三层验证证据

文档包含源仓、每条 active runner、fresh process 的证据字段模板；一次实际验证能按模板给出三层结果。缺任一层时结论必须写“部署验证未完成”。

### AC-008 失败分类表

表驱动测试覆盖 completed、OUTPUT_INVALID、PROVIDER_OUTPUT_INVALID、PROVIDER_UNAVAILABLE、PROVIDER_HEALTH_FAILED、TIMEOUT、PROCESS_TIMEOUT、SAME_SOURCE、cancelled、CANCELLED 和未知码；每项断言固定展示分类并保留原始码，未知码出现 warning。

### AC-009 统计分母

含 provider 执行失败和有效 finding 的混合 fixture 中，失败 attempt 不进入 finding/质量分母；有效 finding 仍按现有 adjudication 统计。

### AC-010 耗时和重试

有公共 duration/retry count 时按原值展示；缺失时显示未提供；失败耗时不进入成功审查耗时聚合。

### AC-011 回归与边界

相关聚焦测试通过；Skill closure、宪法检查和 diff 检查通过。没有新增依赖、provider/profile、模型配置、后台服务、metrics bridge 或跨系统运行依赖。

## 运行与失败语义

- 当前路径配置错误：立即停止，修正配置后重试同一请求。
- 非当前路径配置错误：显示 warning，当前请求继续；维护者随后运行 doctor 统一修复。
- verified resolution：保留旧 review verdict，只取消已经被可信处置证明覆盖的过时暂停。
- resolution 不可信或含 accepted risk：保持暂停，不自动降级。
- provider/adapter 失败：记录 attempt 分类，不产生 finding，不自动重试。
- 三层验证缺证据：记录为部署验证未完成，不推断 active runner 已同步。

## 可追踪关系

- 问题 1：FR-001、FR-012 → AC-001、AC-011。
- 问题 6：FR-002～FR-004 → AC-002～AC-004、AC-011。
- 问题 10：FR-005～FR-008 → AC-005～AC-007、AC-011。
- 问题 12：FR-009～FR-011 → AC-008～AC-010、AC-011。

## 未决项

无重大未决项。文件位置、函数拆分和测试文件选择属于 build-plan 的可逆实现决定，不改变本规格的范围、接口或验收标准。
