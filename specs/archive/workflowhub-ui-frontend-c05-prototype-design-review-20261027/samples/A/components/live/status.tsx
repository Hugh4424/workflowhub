import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { C, Chip, Lamp, type Tone } from "./shared"
import { readbackAge, type Acct } from "./data"
import { effectiveCount, patchLive, setReadback, useLive } from "./store"
import { FP_DEMO, HUB_SCENARIOS, PRESSURE_META, setFootprint, setHubScenario, setPressure, useFootprint, useHubScenario, usePressure, type Pressure } from "../systemState"
import { RESOURCE_DEMO, setResourceState, useResourceState } from "../slotState"

/* 出口 / 读回 / 模式 / 已接出口模拟：驾驶舱顶栏 · 工作台状态条 · 配置状态条 三处同读这一份 */

function useSecondTick(on = true) {
  const [, t] = useState(0)
  useEffect(() => {
    if (!on) return
    const id = setInterval(() => t((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [on])
}

/* ─── 读回状态（逐账户 / 全局同一套词表）· 未知永不显示 0 ─── */
export type ReadbackKind = "unbound" | "missing" | "expired" | "failed" | "lastKnown" | "emptyReal" | "ok"
export const READBACK_META: Record<ReadbackKind, { label: string; tone: Tone; why: string }> = {
  unbound: { label: "未绑定", tone: "muted", why: "读回扩展未绑定该账户" },
  missing: { label: "缺字段", tone: "warn", why: "平台返回了响应，但缺少该字段" },
  expired: { label: "已过期", tone: "warn", why: "最近一次读回早于新鲜度阈值" },
  failed: { label: "失败", tone: "bad", why: "连续读回请求失败" },
  lastKnown: { label: "最后已知", tone: "muted", why: "读回中断 · 数值冻结在失联时刻" },
  emptyReal: { label: "真实空结果", tone: "muted", why: "平台明确返回空 · 不是读失败" },
  ok: { label: "正常", tone: "ok", why: "读回在线且字段齐全" },
}
export function acctReadbackKind(a: Acct, readback: boolean): { kind: ReadbackKind; at?: string } {
  if (a.kind === "unlinked") return { kind: "unbound" }
  if (a.kind === "platformUnknown") return { kind: "failed", at: a.recon?.abs }
  if (!readback || a.kind === "healing") return { kind: "lastKnown", at: a.frozenAt ?? a.recon?.abs }
  if (a.pos === "notProvided") return { kind: "missing", at: a.recon?.abs }
  if (a.recon?.stale) return { kind: "expired", at: a.recon.abs }
  if (a.daily === "noData") return { kind: "emptyReal", at: a.recon?.abs }
  return { kind: "ok", at: a.recon?.abs }
}
export function ReadbackChip({ kind, at }: { kind: ReadbackKind; at?: string }) {
  const m = READBACK_META[kind]
  return <span title={m.why}><Chip tone={m.tone}>读回 {m.label}{at && <span className="font-mono font-normal opacity-80">· {at}</span>}</Chip></span>
}

/* ─── 信号出口 · 统一四态（全站同一词表）：正常运行 / 带伤运行 / 发送已停止 / 状态未知 ─── */
export type ExitKind = "ok" | "hurt" | "stopped" | "unknown"
export const EXIT_WORD: Record<ExitKind, string> = { ok: "正常运行", hurt: "带伤运行", stopped: "发送已停止", unknown: "状态未知" }
export function exitStatus(s: { gate: string; cred: { state: string }; readback?: boolean; hbStalled?: boolean; gateFail?: string | null; antiResend?: boolean; diffs?: { explained?: boolean }[] }): { kind: ExitKind; word: string; tone: Tone; reasons: string[] } {
  const mk = (kind: ExitKind, tone: Tone, reasons: string[] = []) => ({ kind, word: EXIT_WORD[kind], tone, reasons })
  if (s.gate === "closed") return mk("stopped", s.gateFail ? "bad" : "muted", s.gateFail ? [s.gateFail] : [])
  if (s.gate === "opening") return mk("unknown", "primary", ["出口开启中"])
  if (s.hbStalled) return mk("unknown", "warn", ["出口心跳中断"])
  const hurt: string[] = []
  if (s.cred.state === "rotating") hurt.push("凭证轮换 · 发送暂停")
  if (s.readback === false) hurt.push("平台回读降级")
  const open = (s.diffs ?? []).filter((d) => !d.explained).length
  if (open > 0) hurt.push(`${open} 处未解释差异`)
  if (s.antiResend === false) hurt.push("防重发已关闭")
  return hurt.length ? mk("hurt", "warn", hurt) : mk("ok", "ok")
}

/** 出口状态全站只在驾驶舱顶栏「出口」胶囊显示一次；其余页面不再渲染（保留空壳以兼容旧引用） */
export function GateText(_props: { className?: string } = {}) {
  return null
}

/* ─── 健康详情演示场景（只供驾驶舱「读回」胶囊详情读取；读回开关本身仍在全局 store） ─── */
export type RbDemo = "ok" | "failed" | "unknown" | "expired" | "drift"
interface HealthDemo { rb: RbDemo; simsOk: boolean; verMismatch: boolean }
let hd: HealthDemo = { rb: "ok", simsOk: false, verMismatch: false }
const hdSubs = new Set<() => void>()
export const getHealthDemo = () => hd
export function setHealthDemo(p: Partial<HealthDemo>) { hd = { ...hd, ...p }; hdSubs.forEach((f) => f()) }
export const useHealthDemo = () => useSyncExternalStore((f) => (hdSubs.add(f), () => hdSubs.delete(f)), () => hd)
/** 场景落到全局 store：读回标志照常写 store，其余页面（配置 / 台账）同读 */
export function applyRbScenario(kind: RbDemo, simsOk = false) {
  const down = kind === "failed" || kind === "unknown"
  setReadback(!down)
  setHealthDemo({ rb: kind, simsOk: down && simsOk })
}

/** snapshot：台账页只渲染进页快照，不接秒级定时器 */
export function ReadbackText({ snapshot = false, className = "" }: { snapshot?: boolean; className?: string }) {
  const { readback, readbackLostAt, ledgerSnap } = useLive()
  useSecondTick(readback && !snapshot)
  if (!readback) {
    return <span className={`flex items-center gap-2 font-medium text-[#ff8aa1] ${className}`}><Lamp tone="bad" pulse />数据读回 · 未接入<span className="font-mono font-normal text-[#ff8aa1]/80">自 {readbackLostAt}</span></span>
  }
  const age = snapshot ? ledgerSnap.age : readbackAge()
  return (
    <span className={`flex items-center gap-2 text-slate-400 ${className}`}>
      <Lamp tone="ok" />数据读回<span className="font-mono" style={{ color: age > 10 ? C.warn : "#64748b" }}>{age}s 前{snapshot && <span className="text-slate-600"> · 快照</span>}</span>
    </span>
  )
}

export function ModeTag() {
  const { gate } = useLive()
  return gate !== "closed"
    ? <span className="shrink-0 rounded-md bg-[#ff8aa1]/15 px-2 py-0.5 text-[11px] font-semibold text-[#ff8aa1] ring-1 ring-[#ff8aa1]/35">实盘 · 真钱</span>
    : <span className="shrink-0 rounded-md bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-[#aeb1c5] ring-1 ring-white/[0.1]">纯模拟 · 不发单</span>
}

export function OutletSimText() {
  const st = useLive()
  const n = effectiveCount(st)
  if (!n) return null
  return <span className="truncate text-slate-400">已接入 <span className="text-slate-200">{n}/5</span></span>
}

/** 演示区：集中、灰色、可折叠 · 开关保留可用（读回中断 = 验收降级态；快进 = 验收自动加回） */
export function DemoPanel({ extra }: { extra?: ReactNode } = {}) {
  const { readback, accts, hbStalled, demoRerunFail } = useLive()
  const fp = useFootprint()
  const hdemo = useHealthDemo()
  const rs = useResourceState()
  const hub = useHubScenario()
  const pressure = usePressure()
  const chip = (on: boolean) => `rounded border px-1.5 py-[2px] text-[10px] ${on ? "border-slate-400 text-slate-200" : "border-slate-700 text-slate-500 hover:text-slate-300"}`
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [at, setAt] = useState({ left: 8, top: 56 })
  const toggle = () => {
    const r = btnRef.current?.getBoundingClientRect()
    if (r) setAt({ left: Math.max(8, Math.min(r.right - 280, window.innerWidth - 288)), top: r.bottom + 8 })
    setOpen((o) => !o)
  }
  const pending = accts.filter((a) => a.readdAt && !a.readdState)
  return (
    <div className="relative">
      <button ref={btnRef} onClick={toggle} className={`rounded-md border border-dashed px-2 py-0.5 text-[10px] ${open || !readback ? "border-slate-500 text-slate-300" : "border-slate-700 text-slate-600 hover:text-slate-400"}`}>
        演示 {open ? "▴" : "▾"}
      </button>
      {open && createPortal(
        <div className="fixed z-[85] max-h-[70vh] w-[280px] max-w-[calc(100vw-16px)] space-y-2 overflow-y-auto rounded-lg border border-dashed border-slate-700 bg-[#0a0d14] p-3 text-[11px] text-slate-500 shadow-2xl" style={{ left: at.left, top: at.top }}>
          <div className="text-[10px] uppercase tracking-wider text-slate-600">演示开关 · 非正式功能</div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!readback} onChange={(e) => (e.target.checked ? (setReadback(false), setHealthDemo({ rb: "ok", simsOk: false })) : applyRbScenario("ok"))} className="accent-slate-400" />读回中断
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={hbStalled} onChange={(e) => patchLive({ hbStalled: e.target.checked })} className="accent-slate-400" />出口心跳中断（验收 30 秒转黄）
          </label>
          {extra}
          <div className="border-t border-white/[0.05] pt-2">
            <div className="mb-1 text-slate-600">健康详情 · 组合场景</div>
            <div className="flex flex-wrap gap-1">
              <button onClick={() => applyRbScenario("failed", true)} className={chip(hdemo.rb === "failed" && hdemo.simsOk)}>回读失败但五路模拟正常</button>
              <button onClick={() => applyRbScenario("unknown")} className={chip(hdemo.rb === "unknown")}>回读未知</button>
              <button onClick={() => applyRbScenario("expired")} className={chip(hdemo.rb === "expired")}>回读已过期</button>
              <button onClick={() => applyRbScenario("drift")} className={chip(hdemo.rb === "drift")}>回读漂移</button>
              <button onClick={() => setHealthDemo({ verMismatch: !hdemo.verMismatch })} className={chip(hdemo.verMismatch)}>版本不一致</button>
              <button onClick={() => { applyRbScenario("ok"); setHealthDemo({ verMismatch: false }) }} className={chip(false)}>复位</button>
            </div>
          </div>
          <div className="border-t border-white/[0.05] pt-2">
            <div className="mb-1 text-slate-600">模拟 · Footprint 数据状态</div>
            <div className="flex flex-wrap gap-1">{FP_DEMO.map((d) => <button key={d.key} onClick={() => setFootprint(d.key)} className={chip(fp === d.key)}>{d.label}</button>)}</div>
          </div>
          <div className="border-t border-white/[0.05] pt-2">
            <div className="mb-1 text-slate-600">模拟 · 准入状态</div>
            <div className="flex flex-wrap gap-1">{RESOURCE_DEMO.map((d) => <button key={d.key} onClick={() => setResourceState(d.key)} className={chip(rs === d.key)}>{d.label}</button>)}</div>
            <button onClick={() => setResourceState("ok")} className="mt-1 text-slate-400 underline decoration-dotted hover:text-slate-200">释放一个名额（恢复）</button>
          </div>
          <div className="border-t border-white/[0.05] pt-2">
            <div className="mb-1 text-slate-600">磁盘 · 边界态</div>
            <div className="flex flex-wrap gap-1">{HUB_SCENARIOS.map((d) => <button key={d.key} onClick={() => setHubScenario(d.key)} className={chip(hub === d.key)}>{d.label}</button>)}</div>
            <div className="mb-1 mt-1.5 text-slate-600">磁盘 · 压力</div>
            <div className="flex flex-wrap gap-1">{(["normal", "t1", "t2", "t3"] as Pressure[]).map((p) => <button key={p} onClick={() => setPressure(p)} className={chip(pressure === p)}>{PRESSURE_META[p].label}</button>)}</div>
          </div>
          <label className="flex items-center gap-2 border-t border-white/[0.05] pt-2">
            <input type="checkbox" checked={demoRerunFail} onChange={(e) => patchLive({ demoRerunFail: e.target.checked })} className="accent-slate-400" />每日报告重跑 · 让下一次失败
          </label>
          <div className="border-t border-white/[0.05] pt-2">
            <div className="mb-1 text-slate-600">自动加回 · 快进到 3 秒</div>
            {pending.length === 0 && <div className="text-slate-700">无待加回账户</div>}
            {pending.map((a) => (
              <button key={a.tail} onClick={() => patchLive((st) => ({ accts: st.accts.map((x) => (x.tail === a.tail ? { ...x, readdAt: Date.now() + 3000 } : x)) }))} className="mr-2 font-mono text-slate-400 underline decoration-dotted hover:text-slate-200">··{a.tail}</button>
            ))}
          </div>
        </div>
      ,
        document.getElementById("live-cockpit") ?? document.body,
      )}
    </div>
  )
}
