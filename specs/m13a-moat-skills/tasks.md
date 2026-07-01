---
task_id: m13a-moat-skills
stage: build-plan
plan_ref: specs/m13a-moat-skills/plan.md
spec_ref: specs/m13a-moat-skills/spec.md
stages: 3
---

# 任务列表：护城河能力内置化（M13a）

> 依赖排序。每条任务标注对应 FR、阶段、依赖关系。
> 分组依据：skill 文件新建（Stage 1）→ make-decision 更新（Stage 2）→ 测试+registry 收尾（Stage 3）。
> 选择 N=3 的理由：Stage 1 新建三个独立 skill 文件互不依赖，可并行；Stage 2 依赖 Stage 1 的 skill 文件路径确定后才能正确写入引用；Stage 3 的测试需要 Stage 1/2 产物均存在才能断言，registry 无依赖但归入同批收尾更干净。三层真实依赖链，不制造虚假阶段。

---

## Stage 1：新建护城河 skill 文件

> Stage 1 内三个任务互不依赖，可并行执行。

- [x] **T001** 新建 `skills/talk-with-zhipeng/SKILL.md` (stage:1, depends:无)
  - 来源：multica-agenthub talk-with-zhipeng skill 搬运
  - adapter 改写：宿主路径 → workflowhub in-repo 路径；删除 gbrain/office-hours context 查询逻辑
  - 必须保留：`输入` 或等义章节、`步骤`/`执行协议` 或等义章节、`talk` 关键词、`影响排序`/`impact` 声明
  - frontmatter 含 `name: talk-with-zhipeng`
  - 验证：grep `/Users/\|~/.claude\|multica-agenthub\|gbrain\|office-hours` 结果为空
  - FR：FR-MOAT-001, FR-MOAT-002, FR-MOAT-003, FR-TALK-001, FR-TALK-002, FR-TALK-003
  - AC：AC-01, AC-06, AC-07, AC-08, AC-09, AC-22, AC-26

- [x] **T002** 新建 `skills/grill-with-docs/SKILL.md` + CONTEXT-FORMAT.md + ADR-FORMAT.md (stage:1, depends:无)
  - 来源：~/.claude/skills/grill-with-docs/ 全量搬运（含附属格式文件）
  - adapter 改写：宿主路径 → workflowhub in-repo 路径
  - SKILL.md 必须保留：`输入`/`输出`/`步骤` 或等义章节、`grill` 关键词
  - 三个文件均不含 `/Users/`、`~/.claude`、`multica-agenthub`、`gbrain`、`office-hours`
  - SKILL.md frontmatter 含 `name: grill-with-docs`
  - FR：FR-MOAT-001, FR-MOAT-002, FR-MOAT-003, FR-GRILL-001, FR-GRILL-002, FR-GRILL-003
  - AC：AC-02, AC-04, AC-05, AC-06, AC-07, AC-08, AC-27

- [x] **T003** 新建 `skills/intake-decision-review/SKILL.md` (stage:1, depends:无)
  - 定义三角度审查结构：每次产出恰好 3 条 findings，标注 direction/framing/scope，三类全覆盖
  - 单次拼装调用模式（拼装后调用一次 3rd-review）
  - fallback_used=true 时立即停止报错，不采用该结果，不继续主流程
  - findings 不足 3 条或缺角度时要求重跑，不得自行编造
  - 语义硬证据（grep 可验证）：`不足\|缺角度`、`重跑\|rerun\|重新调用`、`不得编造\|不自行编造\|不得补齐`
  - frontmatter 含 `name: intake-decision-review`
  - FR：FR-MOAT-001, FR-MOAT-002, FR-MOAT-003, FR-REVIEW-001, FR-REVIEW-002, FR-REVIEW-003, FR-REVIEW-004
  - AC：AC-03, AC-06, AC-07, AC-08, AC-28(2)

---

## Stage 2：更新 make-decision SKILL.md

> Stage 2 依赖 Stage 1 完成（skill 文件路径确定后才能写入正确引用）。
> Stage 2 内三个任务均作用于同一文件，建议串行执行（或一次性完成三项改动），避免合并冲突。

- [x] **T004** 更新 `workflows/make-decision/SKILL.md`——引用路径切换 (stage:2, depends:T001,T002,T003)
  - S5 段落：盲审引用 → `skills/intake-decision-review/`
  - S7 段落：grill 引用 → `skills/grill-with-docs/`
  - S2、S4、S7 talk 轮次：均改为 `skills/talk-with-zhipeng/`
  - 清除旧外部 talk 路径：`multica-agenthub.*talk`、`~/.claude.*talk` 结果为空
  - FR：FR-MAKEDEC-001, FR-MAKEDEC-002, FR-MAKEDEC-003
  - AC：AC-10, AC-11, AC-12

- [x] **T005** 更新 `workflows/make-decision/SKILL.md`——TASK_TRACKING_ROOT 环境变量声明 (stage:2, depends:T004)
  - Environment Variables 表新增 `TASK_TRACKING_ROOT` 条目（含义、默认值、使用说明与 build-spec 对齐）
  - S10 落盘步骤：读取 TASK_TRACKING_ROOT 确定写入路径；未设置时降级到默认路径，记录 `tracking_root_fallback` 事件，warn 不报错
  - FR：FR-TRACKING-001, FR-TRACKING-002
  - AC：AC-17, AC-18

- [x] **T006** 更新 `workflows/make-decision/SKILL.md`——S2/S4/S9 大白话改写 (stage:2, depends:T005)
  - S2：无英文术语直接暴露，每选项含推荐标记和中文后果说明，grep `推荐` 在 S2 段落命中
  - S4：遇到问题时给出选项，含推荐标记和中文后果说明，grep `推荐` 在 S4 段落命中
  - S9：含"不确认就不继续"或等义，grep `不确认\|等待确认` 在 S9 段落命中
  - framing/scope 不作为独立英文术语直接暴露给用户
  - FR：FR-COMM-001, FR-COMM-002, FR-COMM-003
  - AC：AC-21, AC-23

---

## Stage 3：测试 + registry 收尾

> Stage 3 依赖 Stage 1/2 全部完成（测试需断言 Stage 1 的 skill 文件和 Stage 2 的引用路径均已就位）。
> T007 和 T008 互不依赖，可并行执行。

- [x] **T007** 更新/新建 `tests/moat-skills.test.mjs` (stage:3, depends:T001,T002,T003,T004,T005,T006,T009,T010)
  - 文件存在性断言：三个护城河 SKILL.md + `skills/anysearch/SKILL.md` + `.mcp.json` 均存在，缺失即报红（AC-20 可证伪）
  - frontmatter 合规断言：四个 skill 的 `name` 字段存在且非空（含 anysearch）
  - 引用路径断言：make-decision SKILL.md 的 S5/S7 分别命中 in-repo 路径，S2/S4/S7 均含 `talk-with-zhipeng`，S3 路径 A/B 均切换为 in-repo 引用
  - 三角度结构契约断言：direction/framing/scope 全覆盖（grep 可验证，缺角度报红）
  - "恰好 3 条"负例断言：文本含 `恰好.*3\|exactly.*3\|findings.*length.*3\|3.*findings`
  - fallback_used 停止断言：文本含 `fallback_used`
  - 单次调用断言：文本含 `单次\|single.*call\|once\|calledOnce`
  - 宿主依赖扫描断言：multica-agenthub/gbrain/office-hours 在四个 skill 文件中结果为空
  - 不得编造/重跑断言：文本含 `不得编造\|不自行编造\|缺角度\|重跑\|rerun`
  - .mcp.json muyu 条目断言：grep `muyu-search-mcp` 在 `.mcp.json` 命中
  - anysearch 绝对路径扫描断言：grep `/Users/\|/home/` 在 `skills/anysearch/` 为空
  - FR：FR-TEST-001, FR-TEST-002, FR-TEST-003, FR-TEST-004, FR-TEST-005, FR-MCP-001, FR-SEARCH-001
  - AC：AC-13, AC-14, AC-15, AC-16, AC-19, AC-20, AC-28(1), AC-29, AC-31

---

## Stage 4：MCP 声明 + anysearch 内置化

- [x] **T009** 新建/更新 `.mcp.json`——声明 muyu-search-mcp (stage:4, depends:none)
  - 从用户级 Claude MCP 配置提取 muyu-search-mcp 真实 command/args 写入 `.mcp.json`
  - 鉴权秘密走 env 引用（如 `$MUYU_API_KEY`），不直接入库
  - `.env.example` 占位入库（无真实值），`.env` 不入库（`.gitignore` 覆盖）
  - FR：FR-MCP-001, FR-MCP-002
  - AC：AC-29, AC-30

- [x] **T010** 新建 `skills/anysearch/`——搬入 in-repo (stage:4, depends:none)
  - 从 `~/.claude/skills/anysearch/` 全量搬入 `SKILL.md`（frontmatter 含非空 `name` 字段）
  - 清除本机绝对路径残留（`/Users/`、`/home/`），替换为 in-repo 相对路径或 env 引用
  - `.env.example` 占位入库，`.env` 不入库，`.gitignore` 覆盖
  - FR：FR-SEARCH-001, FR-SEARCH-002
  - AC：AC-31, AC-32

- [x] **T008** 更新 `config/reuse-registry.md` (stage:3, depends:T001,T002,T003)
  - 新增 3 行登记，各行含名称和 in-repo 路径（同行，相对路径不以 / 开头）：
    - talk-with-zhipeng → `skills/talk-with-zhipeng/`
    - grill-with-docs → `skills/grill-with-docs/`
    - intake-decision-review → `skills/intake-decision-review/`
  - 清除 ghost 绝对路径（/Users/、/home/）和宿主环境引用（~/.claude、multica-agenthub、gbrain、office-hours）
  - FR：FR-REGISTRY-001, FR-REGISTRY-002
  - AC：AC-24, AC-25

---

## 汇总

| 阶段 | 任务 | 并行 | 主要产物 |
|---|---|---|---|
| Stage 1 | T001, T002, T003 | 可并行 | 三个 skill SKILL.md（+格式文件） |
| Stage 2 | T004, T005, T006 | 建议串行（同文件） | workflows/make-decision/SKILL.md 更新 |
| Stage 3 | T007, T008 | 可并行 | tests/moat-skills.test.mjs, config/reuse-registry.md |
| Stage 4 | T009, T010 | 可并行 | .mcp.json, skills/anysearch/SKILL.md |

**任务总数**：10 条
**阶段总数**：4 阶段（Stage 1: 新建 skill、Stage 2: make-decision 更新、Stage 3: 测试+registry、Stage 4: MCP 声明+anysearch 内置化）

