# P2/T004 冻结复杂度断言的定向修订提案（未实施）

**问题：**当前 `tests/contract/repository-inventory.test.mjs:172-181` 将 `formal_test_lines.within_limit` 永久断言为 `false`，却撤掉了该 JSON 其它字段对 HEAD 公布基线的字节守卫。未来正式测试行数真的回落到 limit 内时会错误变红；其它字段在未提交工作树中漂移也不会被此门发现。这与决策日志的“预算只报不拦、未来漂移再测、不硬编码测试预期”不符。当前 P2 卡把此测试列为 build-plan 冻结输入，P2 仅获准改 JSON；因此下述代码只作材料 owner 可审查候选，**没有修改冻结测试**。

**当前只读可行性探针：**把当前 JSON 与 `git show HEAD:docs/architecture/complexity-baseline.json` 的原始文本各自仅替换唯一 `formal_test_lines` 块后逐字比较，非该块字节完全相等；当前块字段正好是 `actual,caliber,delta_from_target,limit,target,within_limit`，`target/limit` 与 HEAD 相同。`actual=83996`、`limit=12000`；`delta_from_target=actual-target`、`within_limit=(actual<=limit)` 和 caliber 中当前倍数 7.0 的关系检查均为 true（字段值 `within_limit=false`）。这不是运行冻结测试，也不批准改它。

建议最小修订（owner 核准后）：

```diff
--- a/tests/contract/repository-inventory.test.mjs
+++ b/tests/contract/repository-inventory.test.mjs
@@
-  it("keeps the published complexity baseline immutable and diagnoses the current tree in memory", () => {
+  it("keeps bytes outside the measured formal-test budget unchanged", () => {
+    const raw = readFileSync("docs/architecture/complexity-baseline.json", "utf8");
+    const oldRaw = historicalBytes("docs/architecture/complexity-baseline.json");
+    const withoutMeasuredBlock = (bytes) => {
+      const block = /^    "formal_test_lines": \{[\s\S]*?^    \},$/gm;
+      expect([...bytes.matchAll(block)]).toHaveLength(1);
+      return bytes.replace(block, '    "formal_test_lines": "<measured>"');
+    };
+    expect(withoutMeasuredBlock(raw)).toBe(withoutMeasuredBlock(oldRaw));
+    const actual = JSON.parse(raw);
+    const oldFormal = JSON.parse(oldRaw).budgets.formal_test_lines;
+    const formal = actual.budgets.formal_test_lines;
+    expect(Object.keys(formal).sort()).toEqual(
+      ["actual", "caliber", "delta_from_target", "limit", "target", "within_limit"].sort(),
+    );
+    expect(formal.target).toBe(oldFormal.target);
+    expect(formal.limit).toBe(oldFormal.limit);
     const current = buildReport();
     expect(actual.budgets.formal_test_lines.actual).toBe(current.budgets.formal_test_lines.actual);
-    expect(actual.budgets.formal_test_lines.within_limit).toBe(false);
+    expect(formal.delta_from_target).toBe(formal.actual - formal.target);
+    expect(formal.within_limit).toBe(formal.actual <= formal.limit);
+    expect(formal.caliber).toContain(
+      `约为 ${formal.limit} 行上限的 ${(formal.actual / formal.limit).toFixed(1)} 倍`,
+    );
```

这个候选在当前固定 JSON 形状下，只放开正式测试预算块；块外原始字节必须与 HEAD 一致，块内字段集合固定，`target/limit` 不变，`actual/delta/within_limit/倍数文字` 与当次测量相符。它不是对更早发布版本的不可变签名：HEAD 随提交移动，只能发现相对当前 HEAD 的未提交漂移；若 owner 要锚定绝对历史版本，应提供认证旧快照。定向负控：临时副本改块外任一字节、块内增加字段、改 target/limit、保留旧倍数文字时必须失败；构造低于 limit 的真实行数并同步 caliber 时 `within_limit=true` 不应被固定 false 卡住。当前精确 `-t` 门与 P2 复合门仍按真实结果运行，不跑全量回归。旧 OCR finding、原 RED 和旧测试字节保留。
