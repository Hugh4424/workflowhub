# P6/T011 规格窄修

- 修改文件：`specs/workflowhub-thin-core-card-04-20260919/phases/P6.md`；只改 T011 的 Action、Outputs / failure、Evidence、Coverage limit 四行。
- 修前 SHA-256：`35b15b6739106d5f4e2ac8e2e0f69b3c1b365f81ce45bf4efcfd9471b85967c3`（由修后文件反向还原四行，校验等于修前实测 hash）。
- 修后 SHA-256：`8c92d7597e70686145230e3e255daf1cf97c0a38dee55870a3c6d61cbf2491dd`。
- 差异：`diff.patch`。原 oracle、README、冻结测试、Task facts 均未改。
- 原因：当前外置 ORACLE.json 有九个顶层键，旧 T011 文字仅列八个；T012 E2E 消费第九个 `schema_version`。原八键取值约束保留。
- 证据边界：T011 当前定向测试 9/9 与负控只证明局部文件合同；权限位不证明同一 OS 用户不可读、不可 chmod，亦不证明 P6 完成。
