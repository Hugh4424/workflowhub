# PaperBuilder live-simulation 会话取证：时间都花在哪

> 来源·产出：card-03 落地流程派发的只读取证子代理（事故取证 / 根因分析；未改仓库任何文件）
> 来源·时间：2026-09-29 18:36（本机 CST，文件 mtime）
> 来源·支撑：支撑 decision-log §17 全部机制的事故基线（101.9 h 会话时间分布）

素材（只读，未改动任何仓库文件）
- 转录: `/Users/Hugh/.codex/sessions/2026/09/25/rollout-2026-09-25T12-36-51-01a0d6da-1328-7873-9acf-cbf439afd194.jsonl`（903,956,394 B，`wc -l` = 159,794）
- 规格: `/Users/Hugh/Hugh/Project/PaperBuilder-paperbuilder-live-simulation-durability-post-20260925/specs/paperbuilder-live-simulation-durability-post-20260925/`（spec.md / decision-log.md / phases/P1–P6 + index.md）
- 任务库: `/Users/Hugh/Hugh/Knowledge/Projects/PaperBuilder/tasks/paperbuilder-live-simulation-durability-post-20260925/`（task.json / facts.jsonl / quality/）
- 中间产物（可复跑）: `/tmp/pb-forensics/{index.py,exec2.py,pass3.py,pass4.py}` + `{lines,toolcalls,tooloutputs,messages,exec,errors,stage}.tsv`

## 核心结论（数字）
1. 会话 2026-09-25T04:36:55.403Z → 2026-09-29T10:30:47.443Z，**墙钟 366,832 s = 101.9 h**（4 天 5 h 54 m）。转录非空记录 **159,818** 条（`wc -l` 159,794；题目给的 159,765 差 53 条，属计数口径差异）。
2. 记录构成: event_msg 70,725 / response_item 68,514 / token_usage_record 18,830 / inter_agent_communication_metadata 1,174 / world_state 280 / turn_context 182 / compacted 112 / session_meta 1。
   message 类只有 response_item.message：assistant 1,445、agent_message 1,174、**user 110**、developer 44；工具不是 message，而是 custom_tool_call 16,739 + function_call 1,919 = **18,658 次调用**（调用与输出各 18,658 条，一一配对）。
3. **user 110 条里真人只有 43 条**，另外 67 条是系统注入（`<codex_internal_context source="goal">` 自动续跑 28+31 条、environment_context、request_user_input_async 回执）。
4. 模型调用 **18,830 次**，累计 **input 4,694,664,041 tokens**（cached 4,639,869,440 = 98.8%）、output 10,582,755（含 reasoning 6,459,011），平均每次输入 ≈ 249k tokens，上下文压缩 **compacted 112 次**。
5. 时间构成（总计 101.9 h）：**模型自身生成 79.6 h (78.1%)**、工具真执行 18.2 h (17.8%)、等待/轮询 4.07 h (4.0%)、>120 s 空档 3.8 h。等待类 666 次调用烧 14,636 s，其中 **wait_agent 418/537 次 (77.8%) 直接返回 `timed_out:true`（白等）**。
6. 阶段：95 个有阶段标记的小时桶里 **build-code 主导 92 个 (96.8%)**；整个 101.9 h 实质是 build-code 单阶段长跑，build-plan/make-decision/verify-code 只是插曲。
7. 返工量：**apply_patch 1,738 次**，同一文件最多被改 **163 次**（`v2_execution_store.py`）；工具输出含 error/failed/timeout/retry 等失败标记的 **8,298 条 = 全部输出的 44.5%**。
8. 重读量：只读型 exec（`sed -n` 4,849 + `grep` 100 + `python3` 726）≈ **5,585 次 = exec 的 33%**；工具输出文本合计 **112.5 MB** 全部灌回上下文（均值 6,031 B/次）。
9. 重派/协调：send_message 617 + list_agents 305 + followup_task 150 + spawn_agent 132 = 1,204 次（6.5%），但墙钟只 297 s —— 协调不是瓶颈，串行“读-想-改”循环才是。
10. 人类输入缺口极大：真人消息间隔 **中位数 26.7 min，总和 102 h**，最大 3 段为 50.05 h / 15.32 h / 10.85 h；前两段内共 **59 条 goal 自动续跑提示，无人确认**（确认存在连续自动推进）。
11. 未在转录中发现针对本次取证代理的指令注入内容；所有转录文本仅作数据使用。

## 阶段耗时表
判定依据（三条独立证据，任一可复跑）：
- (a) task store facts.jsonl 的 stage 行 `created_at`：build-plan `2026-09-25T04:32:06Z`、verify-code `2026-09-26T03:52:12Z`、build-code `2026-09-27T22:39:20Z`（其 `phase_progress` = P6/T017，recorded_at `2026-09-27T04:02:13Z`）；**无 make-decision 行**。
- (b) 转录内 `stage[:=]<name>` 标记 2,324 行：build-code 2,152 / build-plan 99 / verify-code 44 / make-decision 29。
- (c) 按小时取主导阶段：95 桶中 build-code 92、build-plan 2、make-decision 1。

| 阶段 | 标记时间窗（UTC） | 标记数 | 主导小时 | 墙钟占比 | 证据 |
| --- | --- | --- | --- | --- | --- |
| make-decision | 09-26T01:44 → 09-29T09:04 | 29 | 1 | ≈1% | 仅转录标记，facts 无行 |
| build-plan | 09-25T04:46 → 09-27T13:44 | 99 | 2 | ≈2% | facts row0 + stage-reflection/build-plan |
| build-code | 09-25T04:36 → 09-29T10:24 | 2,152 | 92 | ≈97% | facts row1(P6/T017) + evidence/build-code 144 文件 |
| verify-code | 09-25T16:43 → 09-29T08:31 | 44 | 0 | <1% | facts row2 + stage-reflection/verify-code |

注：阶段标记在整段会话里“共现”（每次上下文注入都带全套 workflow 文档），所以单看关键词出现位置不能切阶段；上表用的是“事实行 + 主导小时”判定，明确标注该方法。

## 三个最浪费环节（附判定命令与数字）
1. **单阶段 build-code 长跑 + 模型串行“读-想-改”循环**：模型延迟合计 **286,433 s = 79.6 h（78.1% 墙钟）**，18,657 段平均 15.4 s；exec 每天 2,904–4,844 次、每小时 130–220 次调用；95 个阶段小时桶 92 个是 build-code。
   `python3`（配对 output→next call 时间差）+ `cut -f3 toolcalls.tsv | sort | uniq -c` + `stage.tsv` 小时桶。
2. **反复重写同一批文件（返工）**：apply_patch 1,738 次，Top 文件 `v2_execution_store.py` 163、`v2_execution_worker.py` 146、`v2_current_market.py` 94、`scripts/serve_f6.py` 71、`v2_live_ingress.py` 69、`v2_execution.py` 53；7 个文件吃掉 1,173 次（67%）。失败标记输出 8,298 条（44.5%）。
   `awk -F'\t' '$6 ~ /apply_patch/{print $5}' exec.tsv | tr ',' '\n' | sort | uniq -c | sort -rn`。
3. **白等 + 重复读取同一批材料**：wait 类 666 次共 14,636 s，其中 wait_agent 537 次里 418 次超时返回；只读型 exec 5,585 次，反复读 `.paperbuilder-live-owner-ready.json` 216 次、`MEMORY.md` 116 次、`.codex/skills/build-code/SKILL.md` 99 次、`runtime-authority.json` 63 次，输出 112.5 MB 反复入上下文（伴随 112 次 compacted）。
   `python3`（wait 声明/实测时长与 timed_out 计数）+ `cut -f5 exec.tsv` 路径计数。

## 可直接复跑的统计命令
```bash
F=/Users/Hugh/.codex/sessions/2026/09/25/rollout-2026-09-25T12-36-51-01a0d6da-1328-7873-9acf-cbf439afd194.jsonl
mkdir -p /tmp/pb-forensics
# 0) 首末时间戳 / 行数
head -1 "$F" | cut -c1-60 ; tail -1 "$F" | cut -c1-60 ; wc -l "$F"
# 1) 单遍建索引（约 2 分钟，之后所有统计都只读小 TSV）
python3 /tmp/pb-forensics/index.py "$F"     # -> lines/toolcalls/tooloutputs/messages.tsv
python3 /tmp/pb-forensics/exec2.py "$F"     # -> exec.tsv（exec 的路径/命令 flag）
python3 /tmp/pb-forensics/pass3.py "$F"     # -> stage.tsv / errors.tsv
python3 /tmp/pb-forensics/pass4.py "$F"     # -> stage_skill.tsv + token 合计
# 2) 记录类型 / 工具 Top10
cut -f3 /tmp/pb-forensics/lines.tsv | sort | uniq -c | sort -rn
cut -f3 /tmp/pb-forensics/toolcalls.tsv | sort | uniq -c | sort -rn | head
# 3) 等待类声明时长与超时
awk -F'\t' '$3=="wait_agent"{n++; s+=$6}END{print n,s}' /tmp/pb-forensics/toolcalls.tsv
awk -F'\t' '$6 ~ /timed_out/ {c++}END{print c}' /tmp/pb-forensics/tooloutputs.tsv
# 4) 重复写入 Top
awk -F'\t' '$6 ~ /apply_patch/{print $5}' /tmp/pb-forensics/exec.tsv | tr ',' '\n' | sort | uniq -c | sort -rn | head
# 5) 阶段主导小时
python3 -c "import collections;d=collections.defaultdict(collections.Counter)
for l in open('/tmp/pb-forensics/stage.tsv'):
 t,s=l.rstrip().split('\t');d[t.strip(chr(34))[:13]][s]+=1
print(collections.Counter(c.most_common(1)[0][0] for c in d.values()))"
# 6) 任务库阶段事实行
python3 -c "import json;[print(json.loads(l).get('stage'),json.loads(l).get('created_at')) for l in open('/Users/Hugh/Hugh/Knowledge/Projects/PaperBuilder/tasks/paperbuilder-live-simulation-durability-post-20260925/facts.jsonl')]"
```
