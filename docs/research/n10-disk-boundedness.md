# N10 磁盘有界性重放说明

P8实施材料；行为结论看外置原件，独立质量及stage完成由后续审查记录。task根为 /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n10-finite-check-wiring-20261020。历史报告不覆盖。

## 使用与预算

普通task保存使用现openTask后createRecord、writeRecordAtomic、appendRecord；执行用captureCommand；确认及Git record/consume使用同handle方法。实际入口为standard-workflow、build-code、verify-code、stage-closeout。通用safe-write/run-command独立node:*工具保留，无task上下文不猜task策略。

三组默认值（MiB=1048576bytes）：evidence软384/硬512/文件20000；reviews软192/硬256/文件5000；tests软128/硬256/文件10000。软线只警告，硬线相等允许。已存历史照真实usage计入，超线禁止新增，不删件。bytes同组dev/ino去重，files逐regular pathname，目录不计文件；create/link瞬间两个pathname同inode，overwrite保旧与新临时inode峰值。各实际write的usage/check/write同leaf锁，task根锁文件不占quality预算；不持锁等待provider/child。

已知完全相同bytes的create/覆盖复用原件先于预算；provider按同identity同bytes跨调用复用。fresh stream事前不知道全部bytes，按实际chunk排队背压，取消立即reap。已写真实prefix保留；预算拒写receipt时execution/receipt_saved=false明确返回，绝不制造保存成功ref，原错误不被budget错误冒替。

## 只读审计

运行 node tools/cli/audit-disk-usage.mjs --task-root ABSOLUTE_TASK_ROOT。无cleanup参数或删除能力。172-p8-real-task-readonly-disk-audit.{json,output}为真实N10根原件；167-p8-disk-contract-current为fixture分类/bytes/inode不变及拒绝cleanup实证。目录归属仅按现owner可证范围，unknown保留，不按文件名推断其业务事实。禁止删历史review、PaperBuilder或未知目录。

## 临时目录与恢复边界

真实provider-public消费temp-dir；marker为.workflowhub-temp.json，现uid/dev/ino/pid/prefix/age共同限定stale，活/未知pid及未知目录不删。OCR仅修两次分配同try根因。12producer动态对账在264-p8-t037-producer-dynamic-readback.md，266追加OCR直接packet/rule成功/失败/确认取消/未settle取消观测；169/170目标与140case完整结果，取代仅finally静态推断。同步无取消点或无signal API逐项明确，不称通过。

SIGKILL无即时cleanup保证。task创建在现parent锁内复用tracked wrapper+inner完整manifest，rename后fsync父目录。下次同task只清认证死pid wrapper；marker写成前kill留下未知目录保留。Node rename不承诺非合作外部actor最后指令窗口的OS级RENAME_EXCL。record-lock保旧samehost语义；单label/.local alias仅valid相同physicalMAC digest可回收，缺绑定拒绝。不称跨主机共享盘安全认证。

## 原件与失败保全

T037原132/136/140及145/147；Codex156/158；producer160失败注入未命中、161正确故障、163真实取消；OCR166语法fixture错误与168pending无活句柄均保，169/170修fixture通过。T038131/134原失败、独立252与148/167；T039151原provider fixture和真实Git wrapper错误、257与155修复；native135/142、143/146；C/D/H152/154。旧task安全门159/162/164保原失败，259/265具体TCR不豁免安全断言。P7原130独立75与248交付保留；新writer149为P5四+P7七十五共79，150另核预算拒写/恢复，不能混作同一执行。最终40聚合为新增原件，原051partial/P8pending不覆写。

本说明不新增账本/命令/运行状态。最终写集、命令退出、四AC及56源复核由owner最终原件逐项绑定；未取结果仍未完成。

## 同次独立审查修复

086 Standards与272 Spec对native契约判断分别保留；273批准保已收有限queue，立即kill/reap，真实write成功才计数，183目标RED/184十五caseGREEN。088审计错归属由181RED/182GREEN与191真实task只读审计承接：仅quality/evidence/review-materials精确历史路径；reviews未知子目录、其它位置同名及根同名皆unknown。

Codex091逐目录清理错误由277批准，185真实RED→187十一场景→188完整141case。EACCES目录保真实失败残留；另一目录仍清且主executor事实不被覆盖，诊断不冒清理成功；deferred不提前删、链末拒绝被处理。并发同bytes186三个真实RED→189三个GREEN：现组leaf锁内先同步安全resolveExisting，再预算/actual，新bytes不借复用旁路。190联合门旧descriptor断言遗漏新增可选字段而失败；280独立批准仅first-create descriptor增加函数字段，保strict toEqual，并在首次真实missing、actual前核无副作用；190原失败保留。Kimi093 async describe finding据279真实Vitest2.1.9 await factory与175实际四case执行判invalid，原provider输出保留。

成本原需按276纠正：本卡复用N1真实消费并披露incomplete/缺报，收益未验证；不将原义务整体转N11。阶段末成本记录由root唯一触发，P8不造收益结论。
