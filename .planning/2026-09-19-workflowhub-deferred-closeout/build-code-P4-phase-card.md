# Build-code Phase P4 Card — cancelManaged 接线

## Goal

完成 T031–T032：仅在已观察到 `REVIEW_SOURCE_DRIFT` 时调用既有 managed cancel；墙钟等待、临时 status error、正常 terminal 和 member failure 不取消。

## Allowed files / symbols

- `skills/wh-review/scripts/simple-review-runner.mjs`：managed lifecycle catch，接既有对象参数 `client.cancelManaged`。
- `tests/review/review-managed-lifecycle.test.mjs`：source-drift positive case；既有 wall-clock/status/terminal no-cancel cases保持。
- 不改 `:526-558` 墙钟块，不改 BR broker public API，不改 WH client signature。

## Test route

- 实际 route：`feature`；具体 skill：`backend-testing`，生命周期 adapter mock 直接验证。
- RED focused cancel test exit 1；GREEN full managed lifecycle 31/31 exit 0。
- P4 review only once; unavailable remains unavailable if provider config unchanged.

## Stop conditions

- 需要在 wall-clock branch 调 cancel、改 broker API、或把 cancel failure 覆写成 source-drift 原错误。
