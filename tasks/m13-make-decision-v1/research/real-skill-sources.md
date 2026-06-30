# real-skill-sources — M13 make-decision

## 1. 双路调研 sources

### muyu-search-mcp
- **Path**: no standalone file found; lives as a memory note at `/Users/Hugh/.claude/projects/-Users-Hugh-Hugh-Project-multica-agenthub/memory/muyu-search-empty-root-cause.md`
- **What it is**: LOCAL MCP plugin backed by qwen via dmxapi. True search comes ONLY from `extra_sources` (Tavily/Firecrawl); model path has `enable_search=false`. Default `extra_sources=0` → zero real retrieval, LLM fabricates citations. Fix: always pass `extra_sources>=3`.
- **Capability**: 联网搜索（需显式开启 extra_sources），否则纯幻觉输出
- **Reuse-class**: 优化（必须修复参数才可用）

### anysearch
- **Path**: `/Users/Hugh/.claude/skills/anysearch/SKILL.md`
- **What it is**: Open-source skill (v2.1.0). Unified real-time search via JSON-RPC 2.0: general web search, vertical domain search (finance/academic/health/legal/etc.), parallel batch search, URL content extraction. CLI scripts at `scripts/anysearch_cli.{py,js,sh,ps1}`. Anonymous access available; API key optional for higher rate limits.
- **Capability**: 通用+垂直域搜索+批量并行+URL提取，真实联网，无需MCP服务器
- **Reuse-class**: 照搬

---

## 2. talk-with-zhipeng sources

### gstack office-hours
- **Path**: `/Users/Hugh/.claude/skills/gstack/office-hours/SKILL.md`
- **What it is**: YC Office Hours skill (v2.0.0). Two modes — Startup mode asks six forcing questions one at a time (Q1 Demand Reality, Q2 Status Quo, Q3 Desperate Specificity, Q4 Narrowest Wedge, Q5 Observation, Q6 Future-fit); Builder mode for brainstorming/hackathons. Smart routing: not all six needed, depends on product stage (pre-product→Q1-Q3; paying customers→Q4-Q6). Saves design doc to gbrain.
- **Capability**: 逐题追问的 YC 式创业拷问，六个强迫性问题逐一深挖
- **Reuse-class**: 优化

### superpowers brainstorming
- **Path**: `/Users/Hugh/.claude/skills/superpowers-repo/skills/brainstorming/SKILL.md`
- **What it is**: Pre-implementation design gate. Explores intent → asks clarifying questions once → proposes 2-3 approaches with trade-offs → presents design for approval → writes design doc → spec self-review → user review → transitions to writing-plans. Hard gate: no code until design approved.
- **Capability**: 创意转设计规格的协作对话，强制设计优先、禁止跳过评审
- **Reuse-class**: 优化

### What "question weight + impact ordering" adds on top
- office-hours 的六问是固定顺序，superpowers brainstorming 是一次性澄清问题。talk-with-zhipeng 在此基础上新增：**按问题影响力加权排序**（高影响问题先问）+ 针对志鹏具体场景的问题定制，属于自研逻辑叠加在两个现有 skill 的问法框架之上。
- **Reuse-class for added logic**: 自研
