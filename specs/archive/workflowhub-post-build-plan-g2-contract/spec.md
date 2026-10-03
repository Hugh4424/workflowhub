# 窄纯文档 G-2 post 合同修复 — mini 规格

## 材料导航
| 章节 | 摘要 | 读取时机 |
| --- | --- | --- |
| 结果与边界 | 唯一结果、兼容与禁止扩展 | 设计/实现前 |
| 接缝与规则 | 现有字段识别和质量边界 | 写测试/修改 validator 前 |
| 验收 | 可重放正负控制 | 审查/验收前 |

## 结果与边界
来源：decision-log 当前 D-MINI-001/R-MINI-001（主 m01084/m01109/m01138/m01153）；新用户 mini 请求为转述，不伪造逐字或确认 receipt。
唯一结果：post Task 作者无需制造仪式 RED，就能表达合法纯文档 G-2 并获结构接纳；行为与混合任务仍遵守真实 RED/GREEN。
本修复改变 validator 的运行行为，自身不适用纯文档免责。四份 mini 材料各自唯一：decision 方向、本文结果/验收、plan 实现、tasks 执行；不生成 phases 或镜像普通 post 权威。
FR-001：兼容已有自然中文 G-2 文档无新行为卡片，不强制新增 verification_role/paired_task 等字段或新 schema。
FR-002：只有明确无新增运行行为且 Task owned 写集均为 .md，并具备理由、风险、客观替代与验收披露，才进入窄分支；读集代码锚点不是写集。
FR-003：保持行为/混合 Task 的命令、同一 oracle、具名失败断言、RED 非零/GREEN 0；既有来源/FR/AC、所有权、依赖与追溯检查不弱化。
FR-004：结构接受不等于替代检查已执行、GREEN、确认或阶段完成；不改写旧事实，不掩盖 lint false/缺证据。
写集限 runtime/stage/stage-content-contracts.mjs、skills/spec-plan/templates/phase-template.md、tests/contract/post-phase-contract.test.mjs、tests/contract/post-cohort-executable-authoring.test.mjs。默认不改 handler；若真实必要，先回主收窄授权，不自行扩写。
非目标：探索型宽例外、UI/API、新命令/公共选项/schema/持久对象、routing/RED 认证修补、迁移、CARD01 材料/旧 facts；完整测试和 Git 交付另行授权。

## 接缝与规则
实读锚点：runtime/stage/stage-content-contracts.mjs:7295–7335 的 fieldValue/required/expected_exit 逻辑；skills/spec-plan/templates/phase-template.md:155–168 的作者字段说明。
确定性识别只用现有 fieldValue 的 Task 字段，先 trim/归一空白，分号/句号分句；不扫描整份 Phase 的 G-2 字样，不添加必填字段或通用 NLP。以下逐条件满足才接纳，缺项在现有 errors 字符串中逐项命名：
1. Inputs 或 Scenario / fixture or service 同时明确 G-2、文档、无新增运行行为；支持既有“G-2 文档无新行为”及“无新增 runtime/无新增运行行为”写法，不要求新标签。只有 G-2 标签、无文档范围或非空“无风险/按需验证”等泛词不足。
2. Files / symbols 沿用现有 inlinePaths 取得 Task 真实 owned 写路径，非空且每项后缀 .md；保持原 declaredWriteSet 所有权检查。不以 Phase 全写集代替 Task 写集、不忽略其中非 .md，不扩解析把无 backticks 的代码读锚点变成写路径。
3. RED 证据须 N/A 加明确“无新增 runtime/运行行为”理由；理由具体说明只改哪种文档、不改变何种运行逻辑。风险以“风险”子句给出具体对象/后果（如凭据误认、替代未执行被当 GREEN），不接受空、裸 N/A、无风险/风险为风险/待补。
4. 同一 RED 证据或既有 Evidence/GREEN oracle 需“客观替代”子句指名可核检查（publish 重放/独立文档审查等具名检查），并说明判定对象/通过标准；只说“检查/验证/按需处理/客观替代为替代”不足。字段摆放可变，四要素不能用无关字段里的同名词凑数。
5. expected_exit 明确客观检查预期 0（不是伪执行结果）且“不执行 RED”；Evidence、expected_exit 或 Coverage limit 明确披露替代未执行/不能当 GREEN 或原 lint false 等真实限制，裸“已披露/按规则”不足；GREEN oracle 保留同一 ORACLE，命令仍是具名客观检查。
6. 对上述声明字段及 Action/Outputs 中明显相反的肯定子句（新增 runtime/运行行为、修改执行逻辑，排除“无/不/未/不会新增”等否定子句）拒绝例外；保留原行为门禁，不把非空矛盾声明当合法。只识别这些明确支持/反对句法，不声称检测全部语义。
兼容场景（主 m01153 转交实际 CARD01 P2:T005 形状，作者未实读该卡，不宣称真实旧任务重放）：RED 证据含 N/A 理由无新增 runtime、凭据误认风险、客观 publish 重放/独立文档审查；expected_exit 为客观预期 0、不执行 RED、披露原 lint false；GREEN 使用同一 ORACLE。
实现者以该内容形状建立独立 fixture；不复制旧 facts，不要求改旧卡增加新字段。纯 .md 后缀或空泛 G-2 标签独立均不足以准入。
句法检查只能约束声明，不证明 .md 内容语义无行为；独立 design/implementation 审查负责实际写集与内容判断。结构通过时无替代执行凭据仍不能宣称完成。
聚焦命令：`npx vitest run tests/contract/post-phase-contract.test.mjs tests/contract/post-cohort-executable-authoring.test.mjs`；以下全部 AC 由同一命令中的具名断言和当前 diff 审查重放。

## 验收（唯一 AC 权威；当前全部未执行）
### AC-001 合法既有形状接纳
验证：构造全 .md owned 写集、自然中文声明、完整四要素、客观预期 0/不执行 RED/原 lint false 披露与同一 ORACLE 的 post fixture。
通过：不要求新字段、不制造失败测试，validatePostPhaseContract 返回 ok；原 lint false 仍如实保留。
失败：继续因缺 RED 非零拒绝，或要求新字段，或把 false 披露变成通过事实。
证据：目标断言改前真实 RED、改后同命令 GREEN 输出及当前 fixture/diff；记录尚缺。
### AC-002 缺四要素拒绝
验证：逐项移除理由、风险、客观替代、验收披露；另测空值、裸 N/A、泛泛 G-2 标签、非空“风险为风险/无风险/客观替代为替代/按需验证/已披露”，以及无行为声明与“新增 runtime/修改执行逻辑”肯定子句矛盾。
通过：每例拒绝窄分支且现有 errors 字符串精确指出真实缺项或矛盾，不能仅靠 .md、字样或非空占位放行；返回形状仍 `{ok, errors, ...}`，不新增 schema。
失败：任一缺项或占位声明获合法例外。
证据：具名反向断言/输出；记录尚缺。
### AC-003 行为/混合负控
验证：普通行为缺 RED、含代码 owned 写集的混合卡伪装 G-2；以及合法行为 RED/GREEN 控制。
通过：伪标签不能绕过，真实行为必须 RED 目标非零/GREEN 0，既有合法行为保持接纳。
失败：行为/混合卡凭自然中文或 .md 部分写集获例外。
证据：行为/混合负控和既有控制输出；记录尚缺。
### AC-004 原合同不弱化
验证：合法 G-2 fixture 分别破坏来源/FR/AC、owner、依赖、Phase/index 或 oracle/追溯绑定。
通过：原合同负控仍拒绝；同一 ORACLE 对齐保留，不因例外跳过通用校验。
失败：与 RED 不适用无关的约束被豁免。
证据：既有与新增回归断言/输出；记录尚缺。
### AC-005 作者模板一致
验证：重放模板契约测试并独立检查模板示例只使用现有字段，说明四要素、预期 0/不执行 RED 与行为边界。
通过：模板与 validator 一致，既有字段自然中文示例可直接构造兼容 fixture。
失败：仍无条件教 RED 非零，或裸字样即可免验，或加入新必填字段。
证据：模板测试/当前模板 diff；记录尚缺。
### AC-006 质量与历史边界
验证：对结构 ok 但替代未执行/披露 lint false 的 fixture 保留原内容；独立检查 diff 和实现报告。
通过：无新增成功/确认事实，无 CARD01/旧 facts 改动；报告仅声称聚焦合同结果，不称旧阶段全绿。
失败：把结构接受升级为质量成功，改历史，或扩到 UI/API/schema/handler 而未经授权。
证据：fixture 断言、当前 diff、逐 AC trace、独立审查及剩余风险；记录尚缺。

## 风险与当前缺口
自然语言分类误接纳/误拒绝须以正负 fixture 和独立语义审查约束，不能声称证明所有写法。历史 CARD01 未实际运行；聚焦测试不覆盖完整阶段/生产 GUI、provider 或真实替代执行。原 design 结果已恢复，三项 finding 由主处置 fixed-required，指针见 decision mini 段；本次只定向补材料。实现、RED/GREEN、实现审查与人类交付确认未由材料作者执行或验证，不制造 receipts；三项修复仍待真实实现审查复核。