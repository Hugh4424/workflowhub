# spec — m13e-verify-code-deepening

> **速读卡**
> verify-code 阶段打 7 个补丁（D1-D7），提升证据可信度和放行判断可靠性。
> 核心变化：新增查痕步骤（trace-check）、独立 test-strategy skill、freshness 四段校验、
> L3 直接复用 isolated-browser-qa、stage-summary 开始/结束双调用、L3 fresh 重跑铁律、
> stage-result 二色升三色。影响范围：仅 verify-code 阶段及其调用的子技能。

---

## 档位 & spec-ladder 判断

**档位：C**（跨模块 + 破坏性 schema 变更）

判据：
- 7 个补丁跨越 verify-code 主技能、freshness.mjs、新建 test-strategy skill、stage-result schema；
- stage-result status 从 green/red 二色改为 green/yellow/red 三色，是破坏性 schema 变更；
- 新引入 test-strategy skill 作独立子代理，是新机制引入。

需要：完整三层 spec（FR/AC/场景）+ 额外影响范围分析。

**F10 反过度工程四问（档位判断时执行，结论见附录 E）**

---

## 一、功能需求（FR）

### FR-TRACE-001 查痕步骤（D1）

**描述**：在 verify-code 阶段，test-strategy 步骤完成之后、L3 E2E 之前，插入 trace-check 查痕步骤。

**范围**：扫描 `evidence/` 目录下各 phase 报告，核对：
1. 报告文件存在
2. `exit_code == 0`
3. 通过 `git_sha + content_hash` 交叉验证（不单纯依赖 mtime）

**输出**：`trace-check-report.json`，含字段 `missing_ac_coverage[]`（列出未覆盖的 AC ID）。

**跳过留痕机制**：不涉及界面的任务，spec 的 `meta` 段须含字段 `no_browser_test: true`；查痕读到该字段则不对"缺少 L3 报告"报警；无该字段且无对应 L3 报告，才计入 `missing_ac_coverage[]`。字段名固定为 `no_browser_test`（snake_case，与现有 spec meta 字段风格一致）。

**验收场景**：

Given 一次 verify-code 运行，evidence/ 下有 phase-1.md、phase-2.md 且均含有效 git_sha+content_hash
When trace-check 步骤执行
Then trace-check-report.json 存在，missing_ac_coverage[] 为空

Given evidence/ 下 phase-2.md 缺失，且无 skip_ui_test 标记
When trace-check 步骤执行
Then trace-check-report.json 存在，missing_ac_coverage[] 含对应 AC ID，且 stage-result 触发相应颜色门

Given 不涉及界面的任务，spec 中含 skip_ui_test: true
When trace-check 步骤执行
Then 查痕不报警，missing_ac_coverage[] 为空

---

### FR-TRACE-002 关联比对可验证（D1 补充）

trace-check 关联比对必须机器可查：能检查 evidence 是否被本次 journal 引用，或由本次 capture.mjs 调用链产生。具体验证字段/命令由实现阶段定义，但机器可查是硬要求。

**验收场景**：

Given trace-check-report.json 已产出
When 执行关联比对检查命令
Then 可得到 pass/fail 结论，不依赖人工判断

---

### FR-STRATEGY-001 test-strategy skill（D2）

**描述**：新建独立 skill `skills/test-strategy/SKILL.md`，作为独立子代理调用，不在 verify-code 主进程内执行。

**输入**：
- `ui_change`（boolean，本次是否有 UI 变更）
- `risk_level`（string：low / medium / high）
- L2 测试报告摘要

**输出**：`test-strategy.md`，包含：
- P0（单元/集成）- P3（E2E）三层节奏路由表
- 每条 AC ID 对应的 route 字段（P0/P1/P2/P3 或 skip）

**机器可查**：后续步骤读取 spec 里的 AC ID 列表，逐一核对 test-strategy.md 是否有对应 route 字段；未知 AC ID 或缺 route 视为检查失败。

**test-strategy.md 解析规则（机器可查定义，spec 阶段拍板）**：
- 文件格式：YAML front-matter + Markdown 正文；front-matter 含 `ac_routes` 字段，类型为对象，key 为 AC ID，value 为路由层级。
- AC ID 格式：匹配正则 `^AC-\d+$`（如 `AC-001`、`AC-12`）。
- 路由值合法集合：`P0` / `P1` / `P2` / `P3` / `skip`。
- 缺 route 报错格式：`MISSING_ROUTE: {AC_ID} has no route in test-strategy.md`
- 未知 AC ID 报错格式：`UNKNOWN_AC: {AC_ID} not found in spec AC list`
- 检查入口契约：读 spec AC 列表 → 逐一在 `ac_routes` 中查找 → 输出 pass 或逐条 MISSING_ROUTE 错误行。

**验收场景**：

Given ui_change=true, risk_level=high, L2报告包含 5 条 AC ID
When test-strategy skill 以子代理方式执行
Then test-strategy.md 存在，包含 P0-P3 路由，每条 AC ID 有对应 route 字段

Given test-strategy.md 产出后，机器核查发现 AC-003 缺少 route 字段
When 机器核查步骤执行
Then 核查失败，报告 AC-003 缺失 route，进入 D7 定义的颜色门逻辑

Given ui_change=false, risk_level=low
When test-strategy skill 执行
Then test-strategy.md 产出，P3 route 可标记为 skip，机器核查通过

---

### FR-FRESH-001 freshness.mjs 四段校验（D3）

**描述**：扩展 `freshness.mjs`，从当前校验扩展至完整四段：
1. `phase-N.md` 存在且 git_sha+content_hash 匹配
2. RED 测试报告存在且 git_sha+content_hash 匹配
3. GREEN 测试报告存在且 git_sha+content_hash 匹配
4. L2 报告存在且 git_sha+content_hash 匹配

> 注：L3 报告（`l3-e2e-report.json`）的 freshness 校验由 **FR-L3IRON-001** 独立定义（git_sha 铁律），不纳入本四段列表，避免与第 4 段 L2 混淆。

违反任一段：记录到 `mtime_violations[]` 并 escalate（触发 D7 red 条件）。

**注意**：git_sha+content_hash 交叉验证取代纯 mtime 校验，与 D1 用同一套验证逻辑。

**验收场景**：

Given 四段报告均存在且 git_sha+content_hash 与当前 HEAD 一致
When freshness.mjs 四段校验执行
Then mtime_violations[] 为空，校验 pass

Given GREEN 报告的 content_hash 与当前 HEAD 不符（旧跑结果）
When freshness.mjs 执行
Then mtime_violations[] 含 GREEN 段违反记录，触发 D7 red 条件

---

### FR-L3-001 L3 执行器复用 isolated-browser-qa（D4）

**描述**：L3 E2E 阶段直接调用现有 `isolated-browser-qa` 技能，不重新设计 L3 执行器。

**输出**：
- 截图归 `evidence/screenshots/`
- 报告写入 `l3-e2e-report.json`

**验收场景**：

Given UI 变更任务触发 L3 执行
When isolated-browser-qa 技能被调用
Then l3-e2e-report.json 存在，evidence/screenshots/ 下有截图文件

Given l3-e2e-report.json 存在
When 机器检查字段契约
Then 字段结构符合 isolated-browser-qa 既有输出契约，pass

---

### FR-SUMMARY-001 stage-summary 双调用（D5）

**描述**：在 verify-code 阶段开始和结束各插入一次 stage-summary 调用。两次调用均须可验证（能证明确实调用了两次）。

**具体输出位置和字段契约**：由实现阶段定义，但"机器能证明两次调用"是硬要求。

**stage-summary 输出契约（spec 阶段拍板）**：
- 输出文件：`evidence/stage-summary.jsonl`（追加写，每次调用 append 一行）
- 每行 JSON 格式：`{"event":"stage_summary","phase":"start"|"end","ts":"<ISO8601>"}`
- 机器验证方式：统计文件中 `"event":"stage_summary"` 的行数，必须等于 2；第一行 `phase` 为 `"start"`，第二行 `phase` 为 `"end"`。行数不等于 2 或顺序不符，视为 stage-summary 验证失败，记入质量事实契约第 4 项未解风险。

**验收场景**：

Given verify-code 阶段完整执行一次
When 检查 stage-summary 调用记录
Then 能从可机器检查的输出（文件或 journal）中找到 2 条 stage-summary 记录，分别对应开始和结束

---

### FR-L3IRON-001 L3 fresh 重跑铁律（D6）

**描述**：L3 必须 fresh 重跑，git_sha 必须与当前 HEAD 匹配。不得复用历史 L3 报告。

**偶发失败降级路径**：若 L3 偶发失败（非代码逻辑错误特征），允许按 D7 yellow 路径处理（不阻断，escalate 后等人确认），具体硬指标判定见 FR-COLOR-001。

**验收场景**：

Given L3 报告 git_sha 与当前 HEAD 一致
When freshness.mjs L3 铁律校验执行（独立于 FR-FRESH-001 四段，专门针对 l3-e2e-report.json）
Then 铁律满足，通过

Given L3 报告 git_sha 与当前 HEAD 不一致（旧报告）
When freshness.mjs L3 铁律校验执行
Then 判定违反铁律，mtime_violations[] 记录，触发 D7 red 条件

---

### FR-COLOR-001 stage-result 三色门（D7）

**描述**：将 stage-result `status` 字段从 green/red 二色扩展为 green/yellow/red 三色。

**触发条件（均为机器硬条件，非 LLM 主观打分）**：

| 颜色 | 触发条件 | 行为 |
|---|---|---|
| green | 所有检查通过，mtime_violations[] 为空，missing_ac_coverage[] 为空，L3 git_sha 匹配 | 正常放行 |
| yellow | 存在偶发失败特征（非代码逻辑错误）或非关键 AC 缺失，但不触发 red 条件 | 不阻断，escalate 后等人确认 |
| red | freshness 任一段 content_hash 不符 / L3 git_sha 不匹配 / missing_ac_coverage[] 含关键 AC / test-strategy 机器核查失败 | escalate 后等人，不自动放行 |

**注意**：yellow 不阻断推进，red 仅 escalate 后等人，不自动阻断。

**验收场景**：

Given 所有 FR 均通过，violations 为空
When stage-result 产出
Then status = "green"

Given freshness.mjs 第 3 段（GREEN）content_hash 不符
When stage-result 产出
Then status = "red"，escalate 触发

Given L3 偶发失败（isolated-browser-qa 返回 flaky_failure=true），其余通过
When stage-result 产出
Then status = "yellow"，不阻断，escalate 记录

---

## 二、不做（Out of Scope）

- 不修改 L1（单元）、L2（集成）测试逻辑本身
- 不引入新的签名基建或密钥管理
- 不修改 build-code、build-plan 阶段
- 不改变 isolated-browser-qa 技能本身的实现（D4 是复用，不是改造）
- 不修改 make-decision、build-spec 阶段
- trace-check 关联比对的极端攻击场景失效条件不在本次量化（decision-log 第6节开放问题）

---

## 三、验收标准（可度量）

1. `trace-check-report.json` 存在且字段契约可机器检查（`missing_ac_coverage[]` 字段存在）
2. `test-strategy.md` 存在，所有 spec AC ID 均有对应 `route` 字段，机器核查 pass
3. `freshness.mjs` 四段校验均执行，`mtime_violations[]` 字段存在
4. `l3-e2e-report.json` 存在，`evidence/screenshots/` 下有截图
5. stage-summary 调用可验证出现 2 次
6. stage-result `status` 字段取值只能为 green / yellow / red（不再接受其他值）
7. red/yellow 触发条件均可机器复现（非 LLM 主观），文档化在本 spec FR-COLOR-001

---

## 四、影响范围分析（C 档必填）

| 受影响模块 | 变更类型 | 说明 |
|---|---|---|
| `workflows/verify-code/SKILL.md` | 新增步骤 | 插入 trace-check、stage-summary 双调用 |
| `workflows/verify-code/freshness.mjs` | 扩展 | 二段→四段，新增 mtime_violations[] |
| `workflows/test-strategy/SKILL.md`（新建） | 新建 | D2 新建 test-strategy skill |
| stage-result schema | 破坏性变更 | status 二色→三色 |
| `isolated-browser-qa`（现有技能） | 复用（不修改） | L3 执行器直接调用 |

**下游消费方影响**：任何读取 stage-result `status` 的组件须兼容新的 yellow 值，否则解析失败。

---

## 附录 A — 假设与依赖

- A1：`isolated-browser-qa` 技能当前版本支持截图输出到 `evidence/screenshots/` 及 `l3-e2e-report.json` 格式。
- A2：capture.mjs 调用链产生的 evidence 可被 journal 引用查询。
- A3：git_sha 在每次运行时可从 HEAD 获取，content_hash 算法沿用现有实现。
- A4：L3 偶发失败特征（flaky_failure）可由 isolated-browser-qa 返回字段标识。

---

## 附录 B — 原 NC 项定义（spec 阶段已自行拍板，不再待澄清）

decision-log 将 NC-01/02/03 的定义权交给 spec 阶段（原文："具体字段/命令留给 spec 阶段定义，但必须机器可查是硬要求"），均已在本 spec 正文 FR 段落中拍板定义。

**NC-01（已定义）**：字段名 `no_browser_test: true`，位于 spec `meta` 段。→ 见 FR-TRACE-001 跳过留痕机制段。

**NC-02（已定义）**：YAML front-matter `ac_routes` 字段；AC ID 正则 `^AC-\d+$`；缺 route 报错 `MISSING_ROUTE: {AC_ID} has no route in test-strategy.md`。→ 见 FR-STRATEGY-001 解析规则段。

**NC-03（已定义）**：写入 `evidence/stage-summary.jsonl`，每行 `{"event":"stage_summary","phase":"start"|"end","ts":"<ISO8601>"}`，行数必须等于 2。→ 见 FR-SUMMARY-001 输出契约段。

---

## 附录 C — 质量事实契约

| # | 项目 | 值 |
|---|---|---|
| 1 | spec-specify 完成时间 | 2026-07-02 |
| 2 | spec-clarify 歧义扫描结论 | 扫描完成，原 NC-01/02/03 均由 spec 阶段自行定义，无待人工澄清项 |
| 3 | 3rd-review 独立审查摘要路径 | `specs/m13e-verify-code-deepening/evidence/3rd-review-verdict.md`（见附录 D） |
| 4 | 未解风险 / scope-triage / F10 findings | 见附录 E |
| 5 | constitution-check 结论 | 见 `specs/m13e-verify-code-deepening/constitution-check.md` |

**附录 C 字段说明**：所有字段已填，值如实记录，禁止字段缺失。

---

## 附录 D — 3rd-review 独立审查

3rd-review 调用结果见：`specs/m13e-verify-code-deepening/evidence/3rd-review-verdict.md`

（调用状态：见该文件内容；降级原因如有亦记录于此文件。）

---

## 附录 E — F10 反过度工程四问 + scope-triage + 未解风险

### F10 四问分析

**机制 1：trace-check 查痕步骤（D1）**
1. 真实威胁：evidence 报告可能是旧跑产物或伪造，当前无校验，曾出现放行了失效证据的情况。
2. 现有覆盖：freshness.mjs 原版只校验部分报告，未覆盖 AC 追溯，无 missing_ac_coverage。现有无覆盖。
3. 可绕过？：跳过留痕字段 `no_browser_test` 若实现不当可被绕过。字段名已在 spec 中固定，实现阶段须严格读取 spec meta 段，不接受其他位置的该字段。
4. 维护成本：中等。新增一个步骤和一个 JSON 报告，格式契约需与实现阶段同步维护。
**结论**：真实威胁，现有无覆盖，维护成本中等。保留。

**机制 2：test-strategy skill（D2）**
1. 真实威胁：test-strategy 逻辑当前内嵌于主进程，缺少独立 AC ID 路由表，AC 覆盖无机器核查。
2. 现有覆盖：无独立 test-strategy skill，无 P0-P3 路由机器核查机制。
3. 可绕过？：AC ID 核查解析规则已在 spec FR-STRATEGY-001 中定义（`ac_routes` 字段、`^AC-\d+$` 正则），实现须严格遵守，不得自行发明格式。
4. 维护成本：中等。新建一个 skill 文件，解析规则需与 spec AC ID 格式同步。
**结论**：真实威胁，无现有覆盖，维护成本中等。保留。

**机制 3：freshness.mjs 四段校验（D3）**
1. 真实威胁：当前 freshness 校验段数不全，GREEN/RED 报告可用旧版通过。曾出现过期报告未被检出。
2. 现有覆盖：freshness.mjs 已存在，本次是扩展（P1: 复用改造），非新建。
3. 可绕过？：content_hash 若算法不一致可能误判。需确保 hash 算法与 capture.mjs 一致。
4. 维护成本：低。在现有文件内扩展，不引入新依赖。
**结论**：真实威胁，现有部分覆盖（扩展复用），维护成本低。保留。

**机制 4：stage-summary 双调用（D5）**
1. 真实威胁：当前无法证明 stage-summary 实际执行，只有结果无调用链证明。
2. 现有覆盖：stage-summary 本身已存在，只是缺少双调用可验证机制。
3. 可绕过？：stage-summary 输出契约已在 spec FR-SUMMARY-001 中定义（`evidence/stage-summary.jsonl`，行数必须等于 2），实现须严格遵守；若写入其他路径或格式则验证失败。
4. 维护成本：低。两处调用插入点 + 一个可验证字段。
**结论**：真实威胁（调用链可证明），维护成本低。保留。（字段契约已在 FR-SUMMARY-001 定义。）

**机制 5：stage-result 三色门（D7）**
1. 真实威胁：二色无法区分"有风险但可放行（yellow）"和"必须拦（red）"，导致过于激进或过于宽松。
2. 现有覆盖：当前 status 只有 green/red，yellow 语义不存在。
3. 可绕过？：yellow 不阻断，若条件太宽松所有问题都 yellow 则等同于不报。触发条件须机器硬判定（FR-COLOR-001）。
4. 维护成本：中等。破坏性 schema 变更，下游消费方须适配 yellow 值。
**结论**：真实威胁，无现有覆盖，维护成本中等（schema 变更需下游适配）。保留，下游消费方影响需在影响范围分析中告知。

### scope-triage 高危词扫描

（在 spec.md 正文中搜索高危词：`阻断|blocking|不能进|BLOCK|强制门|必须停止|强制完整流程`）

已在 FR-COLOR-001 中使用了"不阻断"描述 yellow 行为，属于正面描述（说明 yellow 不阻断），非执行语义阻断指令。未发现执行语义高危词。

**结论：pass**（未发现阻断语义词）

### 未解风险

- [FRICTION resolved] NC-01/02/03 三项字段契约已由 spec 阶段自行定义，不再需要人工澄清。
- [FRICTION] 三色门下游消费方适配（FR-COLOR-001 影响范围）：任何读取 stage-result status 的组件须兼容 yellow，若未提前通知可能引发解析错误。
- [FRICTION] 3rd-review：codex exec 执行状态见 evidence/3rd-review-verdict.md，若降级则质量事实契约第 3 项为 unknown + 原因。

---

## 附录 F — spec-ladder 档位确认

档位：**C**
- 跨模块：verify-code + freshness.mjs + 新建 test-strategy skill
- 破坏性 schema 变更：stage-result status 二色→三色
- 新引入外部依赖：复用 isolated-browser-qa（本身已存在，无新外部依赖）
- 额外影响范围分析：已在"四、影响范围分析"章节完成
