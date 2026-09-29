# T020 当前 OI 冻结候选 v4

v1–v3 原件保留。本目录只含 v4 候选；正式源码、正式测试、材料均未改，未执行 Vitest。

## v4 补充的正例

- 真实 CARD-05 归档材料：四类覆盖齐全，且 `errors` 中没有当前 OI 或当前 CF 的内容错误；三方批准仍独立缺失，整体 `ok:false`。
- 合成材料：无当前状态行的 CF，用户批准行、当前 `confirmed` OI、落地行和同一 D 段裁决句均一致；应无 OI/CF 内容错误及方向未决，整体仍因缺三方批准 `ok:false`。

v3 所有负控与真实 `build-plan` handler 负控保留。实现补丁与 v3 最终版逐字节相同。

| 补丁 | SHA-256 |
|---|---|
| `tests-first.patch` | `af6aa4d68dcfa6b9cd31c20b76adfa8cff3a562a3169ddc6978baa5732ad06d6` |
| `implementation-followup.patch` | `a4687e953ce0a9cbbcfea60e85fc09c82fb35014bdb3c1f2f05e6ef2f826b2ea` |

## 静态检查

在独立临时目录复制四份当前正式文件，按顺序对两补丁分别运行 `git apply --check` 和 `git apply`，四步 exit 0。应用后的四份候选分别运行 `node --check`，全部 exit 0。临时目录已删除。当前正式文件基线 SHA 与 v2 README 一致。

后续应先应用测试补丁并保存定向 RED，再应用实现补丁并保存以下定向 GREEN：

```sh
npx vitest run tests/contract/decision-freeze-current-oi.test.mjs
npx vitest run tests/integration/vnext-official-stage-run.test.mjs -t 'keeps a current OI content failure'
npx vitest run tests/contract/freeze-classification-budget-usage-protocol.test.mjs
```

静态检查不证明测试或完整 build-code 已通过。应用正式源码后，旧快照回执不能证明新快照。
