# P10 真实审查执行原件（2026-10-30）

对象：用 C07 自己的材料（spec.md + phases/*.md + decision-log 派生的决定基线）走一次真实
build-plan/post 审查，判定产出的 finding 是真是假。只读材料，未改 spec／phases／decision-log／index。

## 入口与实际命令

```
cd <认证 worktree>
node skills/wh-review/scripts/wh-review-cli.mjs run \
  quality/evidence/build-code/2026-10-30-p10-real-review/request.json
```

- 入口：裸 `wh-review-cli.mjs run`（SKILL 登记的既有接口）。未用 `stage-runtime review --action=record`，
  因为那会把审查记录写进任务事实库，超出本轮只读边界。
- 退出码 0，stderr 0 字节（见 review-result.exit / review-result.stderr.txt）。
- 时长：2026-10-30 23:34:06 → 23:42:10（+08）。传输入口 `~/.config/workflowhub/config.json`
  的 build-plan 路线 kimi/pro、antigravity/flash、codex/sol、antigravity/sonnet；成对 red/blue。

## 材料与一个必须披露的适配

| 材料 | 来源 | 字节 |
| --- | --- | --- |
| decision_baseline | 由 `skills/spec-plan/scripts/build-decision-baseline.mjs` 从 decision-log.md 生成 | 91,395 |
| draft_spec | spec.md 原文 | 173,131 |
| acceptance_criteria | spec.md 的 `## Appendix A — 验收判据（唯一权威）` 节 | 5,832 |
| phase_authorities | phases/P1..P12 全文 | 742,359 |
| phase_index | phases/index.md 原文 | 10,935 |

**适配披露**：当前字节的基线生成器直接跑 C07 的 decision-log.md 会失败
（`BASELINE_SOURCE_INVALID: no recognized 答复 source records in the supplied source section`，
原件 runA-baseline.stderr.txt）。原因是它只认 `需求变更记录`／`用户后来改了什么` 两个二级标题，
而 decision-log.md 第 184 行写的是 `## 后来改了什么，原件在哪里？`。
为让真实审查能跑起来，生成基线时用了一份副本，**只改这一行标题**（diff 仅 2 行，见
decision-log.heading-renamed.md），并且不传 `--spec`（spec 的主题分组表写「答复 n」而不是
「用户答复 n」，同一解析器要求后者）。基线正文全部来自 C07 原件，未改写任何需求／答复／决定。
另一条路（直接跑 HEAD 版本生成器）失败于 `duplicate 需求 44`（原件 baseline-from-HEAD.err）。

## 结果

- status `available-with-failures`，pair_status `partial`，dispatch_state `dispatched`。
- material_id `579bce7f...`；合并后 finding 17 条（red 7 + blue 10）。
- 另有一个来源（red antigravity/flash，parse_outcome=ok）的 5 条真发现被
  `PUBLIC_RESULT_INVALID: provider output omitted because it contained a private absolute path`
  丢弃；按 wh-review「回读原始输出并只救回真实发现」的既有口径，已从原始输出救回并单列。
- antigravity/sonnet 两侧都失败：packet 边界 pre-tool hook 拒绝一切读取
  （"The packet boundary permits only exact current regular-file reads"），provider 自述没读到任何材料。

## 文件

| 文件 | 说明 |
| --- | --- |
| request.json | 实际派发的请求（1,038,889 B） |
| review-result.json | 审查入口 stdout 原件（66,514 B） |
| review-result.exit / .stderr.txt | 退出码与 stderr |
| review-run-record.json | 机器可读运行记录（角色、来源、覆盖、状态） |
| findings-merged.txt | 17 条 findings 全文与来源归属 |
| anchor-check.json | 17 条锚点逐条回核真实文件的结果 |
| raw-provider-output/ | 各来源原始输出与抽出的 findings（含救回的 5 条） |
| runA-baseline.stderr.txt | 基线生成器对 C07 原件失败的原始错误 |
| dry-run-packet.json | 组包成功事实与 24 个包内文件清单 |

## 一个抽取器的假阳性（已标注，未当结果用）

`raw-provider-output/red-antigravity-sonnet.findings.json` 不是 provider 输出：
抽取脚本匹配到了该 provider 拒答正文里作为行内代码出现的 `{"findings": []}`。
该来源实际终态是 failed / parse_outcome=invalid，两侧都 0 读。文件已改写为说明件。
