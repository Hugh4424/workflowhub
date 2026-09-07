# 补救审查记录结构笔记（remedial review record notes）

> 生成时间：2026-09-06T15:13:43Z（UTC）
> 来源：精读 `skills/wh-review/scripts/wh-review-cli.mjs`、`simple-review-runner.mjs`、`review-runner.mjs`、`review-result.mjs`；`tools/cli/stage-runtime.mjs` review-record 分支；`runtime/review/review-record-route.mjs` recordSimpleReviewResult。
> 只读准备：未调用 provider/CLI execute/review/record/publish，未改四材料。

## 1. 最小正式命令（一次补救审查，build-spec）

运行（纯 broker 派发，不绑定 task；输入即 `remedial-review-input.json` 形状）：

```bash
node skills/wh-review/scripts/wh-review-cli.mjs run <remedial-review-input.json>
# 或 stdin：node skills/wh-review/scripts/wh-review-cli.mjs run < <file>（argv[3] 缺省读 fd 0）
```

stdin/文件顶层字段（run 只要求这三个）：`stage`（"build-spec"）、`host_provider`（"dsh/gpt-6-astra"，必填非空）、`materials`（非空对象，key→内容）。`review_track`/`review_kind` 可省（缺省 null）。已核对该输入文件恰好是这三个键。宿主路由 `~/.config/workflowhub/config.json`（config.json 现位于 /Users/Hugh/.config/workflowhub/config.json）：build-spec initial=[kimi/coding, grok/grok, antigravity/flash, codex/luna]，minimum_heterologous=1，mode=single_round；host "dsh/gpt-6-astra" 与四 profile 均非同源，全部 eligible。

记录（必须绑定认证身份，从认证 worktree 内执行或显式 --project/--task）：

```bash
node tools/cli/stage-runtime.mjs review-record --stage=build-spec --input=<record-input.json>
```

`record-input.json` 顶层只有 `"result"` 一个字段，其值为上面 `run` 命令 stdout 的整份 JSON（原样透传，勿改字段）。

## 2. canonical 结果形状（run stdout）与 review-record 期望

run stdout（simple-review-runner.mjs runSimpleReviewSingle 返回）：

```json
{
  "status": "available|unavailable",
  "stage": "build-spec",
  "review_track": null, "review_kind": null,
  "material_id": "<64-hex sha256（provider 可见 redacted bundle 身份）>",
  "runtime_id": "...", "outcome": "...", "minimum_heterologous": 1,
  "provider_selection": {"providers": [...], "provider_identities": {...}},
  "provider_results": [
    {"provider": "kimi/coding", "status": "completed|failed|cancelled",
     "identity": {"provider","adapter","source_id","config_id","model"},
     "session_id": null, "error": null|{code,message}, "timing": {...}, "usage": null|{...},
     "evidence_anchor_valid": [true|false, ...]}
  ],
  "findings": [
    {"severity": "blocking|major|minor", "path": "<bundle 相对路径>", "line": 42,
     "issue": "...", "recommendation": "...",
     "evidence_kind": "direct|machine|inferred", "evidence": "...", "root_cause": "...",
     "provider": "<该 finding 的 provider>"}
  ]
}
```

unavailable 时多一个 `error: {code, message}`；findings 可为空。severity/evidence_kind 枚举与必填规则见 runtime/review/review-output.mjs。

review-record 期望（recordSimpleReviewResult 校验）：
- `result.status` ∈ {available, unavailable}；`result.stage` ∈ 五 stage；`result.material_id` 必须 64-hex；`provider_results` 数组、provider 非空且不重复。
- **禁止** result 携带 `source/base_tree/candidate_tree/snapshot_tree/material_revision`（由认证当前上下文注入；带了直接 TypeError）。
- available 时：每条 status=completed 且 error=null 的 provider_results 必须带 `evidence_anchor_valid`，长度等于该 provider 在 findings 中的条数（否则 TypeError 拒录）；聚合（quorum=minimum_heterologous）不满足同样拒录。
- unavailable 时：`error` 必须含非空 code+message；provider_results 原样记录为 provider_attempts（failed/cancelled/completed），terminal_status=unavailable。

## 3. review-record 返回字段名

```json
{ "status": "recorded", "attempt_ref": "quality/reviews/attempts/<uuid>/attempt.json",
  "result_ref": "quality/reviews/results/build-spec-simple-<uuid>.json" | null }
```

- attempt_ref 恒有；available → result_ref 非 null；unavailable → `result_ref: null`。
- 需要 hash 身份时用 run 输出的 `result.material_id`（64-hex sha256）；recorded 结果/attempt 的内容 sha256 不在返回值中，需自行对记录文件计算。
- stage-runtime 返回即 `{status:"recorded", ...refs}`（field 名 snake_case）。

## 4. 全部 provider unavailable 时的记录路径

不伪造执行：仍然执行 review-record，把 run 输出的 unavailable 结果**原样**提交（status="unavailable"、带 error、provider_results 保留失败事实）。recordSimpleReviewResult 写 attempt（terminal_status=unavailable），返回 attempt_ref + result_ref=null，不写 result 记录；quality 保持 unavailable，status/close 见到的就是诚实的不完整事实。若 run 本身异常无 JSON 输出：不可凭空虚造 material_id/error 记录，应如实上报传输失败并重跑。

## 5. 现状核验（只读）

- 回执已存在：quality/confirmations/fda42d1424234a09b67bde9e7af0528edbb1639329eb33b53b8494043384dc41.json（human-confirmation.v3，accepted，material revision-1199d179…）。
- 此前已完成 10 份 build-spec-simple 记录（结果 wh-review-result.v1 含 adjudication，attempt v1 含 review_policy/policy_snapshot_hash），latest material 示例见 quality/reviews/results/build-spec-simple-7bb88438…。