# 设计移植反模式

本清单只收本次任务真实发生、且能被现有检查器抓住的坑。读者是后续实施者与独立审查者。
每条四列：现象、根因、对应检查、正确做法。检查列给可执行命令，或「暂无门禁」加 owner。
本文不写死条数、比例或行号；读数由命令输出产生，锚点用标题或稳定名。

| 现象 | 根因 | 对应检查 | 正确做法 |
| --- | --- | --- | --- |
| 页面换壳后旧接口没收到参数，看起来却“已接回” | 只核了引用文字，没有真实回执与断开反例 | `node skills/design-source-extraction/scripts/check-wiring.mjs --map tests/fixtures/design-port-sample/wiring/wiring.md` | 三链逐项给已接回或具名缺口；断开处理器或接错接口必须让检查失败 |
| 机器检查全绿就宣布视觉通过 | 把功能测试当视觉验收，跳过独立目视 | `node skills/design-source-extraction/scripts/check-visual-review.mjs --dir tests/fixtures/design-port-sample/visual` | 固定视口重截、逐条差异只写已修复或审查者接受及理由；未解决即失败 |
| 有跳过项仍写“全部通过” | 跳过被当成通过，缺口没进报告 | `node skills/design-source-extraction/scripts/check-geometry.mjs --config tests/fixtures/design-port-sample/verification/geometry.json` | 报告显式列未验证项；带缺口收口，由独立审查者确认接受或补验 |
| 页面显示正常，但值来自样例却被当成真实读数 | 没有把页面值分成真实、样例、缺失三档 | `node skills/design-source-extraction/scripts/check-data-discipline.mjs --fixture tests/fixtures/design-port-sample/data` | 显式数据档案与默认源；读失败只报缺，不填样例；真实接通后样例残留必须为零 |
| 手改直接写进自动生成的样式，重跑后被冲掉 | 生成物与手改没有分文件、没有登记 | `node skills/design-source-extraction/scripts/check-port-manifest.mjs --manifest tests/fixtures/design-port-sample/port/manifest.json --design-root tests/fixtures/design-port-sample/prototype` | 手改只写单独文件并登记；未登记改动、未用样式或缺样式都让检查失败 |
| 写者记录写着单写者，实际两个进程同时改 | 用记录代替真实互斥，没让进程进同一把锁 | `node skills/design-source-extraction/scripts/check-write-set.mjs --dir tests/fixtures/design-port-sample/write-set` | 两个真实进程走同一 `withLock`；不等待争用收到 `LOCK_HELD` 且字节不变 |
| 收敛台账写“已收敛”，冷读只有标题或换了卡没复读 | 只找裸标记，没有回读卡片摘要、五问与修订 | `npx --no-install vitest run tests/contract/check-stage-steps.test.mjs` | 逐包回读卡片节摘要、冷读原件摘要和五问；修订后由新读者复读 |
| 反模式只写进文档，没有真实消费者 | 接线靠口头约定，没登记入口和读的人 | 暂无门禁；owner=技能维护者；原因=需人工读真实入口，后续完整合同复核 | 每条反模式要么绑定可执行检查，要么写明 owner 与缺口；新文件先登记职责与消费者 |
