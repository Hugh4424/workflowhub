import { useSyncExternalStore } from "react"
import { DEMO_SIMS, SIM_STATE_WORD, simName, type DemoSim } from "./live/demoUniverse"

/* ── 共享的运行准入 mock 状态源 ──────────────────────────────────
   同时驱动：模拟记录页的「运行名额」浮层、创建向导的资源检查与
   「开始运行」按钮。切换此处状态，三处 UI 同步变化（UI-04）。 */

export type ResourceState =
  | "ok"                    // 名额未满、风险范围空闲、内存充足
  | "pool-full"             // 3 / 3 名额已满
  | "risk-conflict"         // 风险范围被其它运行占用
  | "memory-insufficient"   // 可用内存低于最低要求
  | "unknown"               // 暂时无法确认内存

export interface Occupant { name: string; state: string; cls: string }

export const SLOT_CAP = 5

const STATE_CLS: Record<string, string> = { running: "text-emerald-300", closed: "text-sky-300", delayed: "text-amber-300", recovering: "text-amber-300" }
const toOccupant = (x: DemoSim): Occupant => ({ name: `${simName(x)} ${x.ver}`, state: SIM_STATE_WORD[x.state], cls: STATE_CLS[x.state] ?? "text-slate-300" })

/* 占用者由模拟记录页按列表实时同步（setOccupants），名额数 = 占用者数 */
let occupantList: Occupant[] = DEMO_SIMS.slice(0, 5).map(toOccupant)
export function setOccupants(list: Occupant[]) {
  if (list.length === occupantList.length && list.every((o, i) => o.name === occupantList[i].name && o.state === occupantList[i].state)) return
  occupantList = list
  emit()
}

let state: ResourceState = "ok"
const listeners = new Set<() => void>()

function emit() { listeners.forEach((l) => l()) }

export function setResourceState(s: ResourceState) {
  state = s
  emit()
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}
function snapshot() { return state }
function occSnapshot() { return occupantList }

export function useResourceState() {
  useSyncExternalStore(subscribe, occSnapshot, occSnapshot) // 占用列表变化时一并刷新
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}

/* 派生显示信息（占用者 / 名额数 / 是否可启动 / 拦截原因） */
export interface ResourceInfo {
  state: ResourceState
  occupants: Occupant[]
  used: number
  full: boolean
  canStart: boolean
  label: string          // 名额徽标文案
  dot: string            // 名额徽标圆点色
  checkStatus: "pass" | "fail" | "warn"
  checkReason: string    // 向导资源检查说明
}

export function resourceInfo(st: ResourceState): ResourceInfo {
  const occupants = occupantList
  const used = occupants.length
  const s: ResourceState = st === "ok" && used >= SLOT_CAP ? "pool-full" : st
  const base = {
    state: s,
    occupants,
    used,
    full: s === "pool-full",
  }
  switch (s) {
    case "pool-full":
      return { ...base, canStart: false, label: `名额已满 ${used} / ${SLOT_CAP}`, dot: "bg-rose-400", checkStatus: "fail",
        checkReason: `运行名额 ${used} / ${SLOT_CAP} 已满。需先停止一个正在运行的模拟以释放名额；释放后本项恢复通过。` }
    case "risk-conflict":
      return { ...base, canStart: false, label: `风险范围冲突 ${used} / ${SLOT_CAP}`, dot: "bg-rose-400", checkStatus: "fail",
        checkReason: "该风险范围（合约 + 时段）已被另一运行占用，禁止重复下单口径。请更换合约/时段或停止占用运行。" }
    case "memory-insufficient":
      return { ...base, canStart: false, label: `内存不足 ${used} / ${SLOT_CAP}`, dot: "bg-rose-400", checkStatus: "fail",
        checkReason: "可用内存 5.8 GiB < 最低 8 GiB。关闭其它进程或释放内存后重新检查。" }
    case "unknown":
      return { ...base, canStart: false, label: `内存待确认 ${used} / ${SLOT_CAP}`, dot: "bg-amber-400", checkStatus: "warn",
        checkReason: "暂时无法确认可用内存（采集超时）。保守起见暂不放行，请稍后「重新检查资源」。" }
    default:
      return { ...base, canStart: true, label: `${used} / ${SLOT_CAP}`, dot: "bg-emerald-400", checkStatus: "pass",
        checkReason: `运行名额 ${used} / ${SLOT_CAP} 未满 · 该风险范围未被其它运行占用 · 可用内存 12.4 GiB ≥ 最低 8 GiB。` }
  }
}

/* 演示态循环：ok → 名额满 → 风险冲突 → 内存不足 → 未知 → ok */
export const RESOURCE_DEMO: { key: ResourceState; label: string }[] = [
  { key: "ok", label: "名额空闲" },
  { key: "pool-full", label: "名额已满" },
  { key: "risk-conflict", label: "风险范围冲突" },
  { key: "memory-insufficient", label: "内存不足" },
  { key: "unknown", label: "内存待确认" },
]
