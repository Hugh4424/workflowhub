# M14–M17 影响说明

## 当前事实

- M14a、M14b、M15 的历史材料仍在 `specs/archive/`，并由 retention/history 工具只读核对。
- M16、M17a、M17b 当前没有匹配目录；该未知事实保持 `unknown`，不伪造为已恢复或已删除，也不进入普通推进 gate。
- 质量、review、test、verify、confirm、authorize 和 provenance 资料继续保留；本轮只删除已登记的重复控制面和无消费者技能。

## 可回查来源

- `docs/architecture/retention-manifest.json` — sha256 `7c4b979eb26e2fe03f2522db1aff88814150cd1f19d2d5d1ab50dbf20b106c00`
- `docs/architecture/history-inventory.json` — sha256 `e036e8e31c646bb576824a06ec0e46f1f7c0de178bc875aca2546730cd966830`
- `evidence/phase-5/deletion-consumer-audit.json` — sha256 `0a127d63b6fa1a2fb2feaaf54ad7e4df956967a84ac94582db0db3a3e409b3da`

## 影响边界

本轮不修改历史 task、历史 bytes 或外部 evidence；不新增 provider、复审链或推进许可证。未决的 reference-clean、schema 预算和 `npm run check` 文档 lint 事实继续交给最终验证记录，不在本说明中提前宣称完成。
