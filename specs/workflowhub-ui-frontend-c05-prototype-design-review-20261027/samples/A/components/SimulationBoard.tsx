'use client';
import {SIMS,type SimStatus,type RunKind,type FactState,type Evidence,type LampState,type Fact,type Lamp,type Metrics,type Simulation,type RunRec,type Period} from '../lib/fixtures';
import {parseState as parseDemoState,states as demoStates,messages as demoMessages,type MockState as DemoState} from '../lib/mock-state';
import {mountSampleMock,scheduleSampleTimer} from './live/store';
import { useEffect, useMemo, useRef, useState } from "react"
import { SLOT_CAP, resourceInfo, setOccupants, useResourceState } from "./slotState"
import { FP_DEMO, useFootprint, setFootprint } from "./systemState"
import { EquityBlock, MetricsBlock } from "./PerfBlocks"
import { effectiveLink, logEvent, setOutlet, useLive } from "./live/store"
import { simById } from "./live/demoUniverse"
import { DemoPanel } from "./live/status"
import { hasWorkbench } from "./SimWorkbench"
import RunTimeline, { TIMELINE_SIM001, TIMELINE_SIM005, type TimelineEvent } from "./RunTimeline"

/* ─── Business status & run_kind (per T08 spec) ───────────────────── */

/* ─── Meta tables ─────────────────────────────────────────────────── */

const STATUS_META: Record<SimStatus, { label: string; dot: string; text: string; bg: string; ring: string; pulse?: boolean }> = {
  draft:            { label: "草稿",       dot: "bg-slate-500",   text: "text-slate-300",   bg: "bg-slate-500/10",   ring: "ring-slate-500/20" },
  preparing:        { label: "准备就绪",   dot: "bg-sky-400",     text: "text-sky-300",     bg: "bg-sky-500/10",     ring: "ring-sky-500/25" },
  running:          { label: "运行中",       dot: "bg-emerald-400", text: "text-emerald-300", bg: "bg-emerald-500/10", ring: "ring-emerald-500/20", pulse: true },
  lagging:          { label: "落后",       dot: "bg-amber-400",   text: "text-amber-300",   bg: "bg-amber-500/10",   ring: "ring-amber-500/20" },
  isolated:         { label: "隔离",       dot: "bg-rose-500",    text: "text-rose-400",    bg: "bg-rose-500/10",    ring: "ring-rose-500/25" },
  stopping:         { label: "停止中",     dot: "bg-amber-400",   text: "text-amber-300",   bg: "bg-amber-500/10",   ring: "ring-amber-500/20" },
  completed:        { label: "运行完成",   dot: "bg-sky-400",     text: "text-sky-300",     bg: "bg-sky-500/10",     ring: "ring-sky-500/20" },
  failed:           { label: "运行失败",   dot: "bg-rose-500",    text: "text-rose-400",    bg: "bg-rose-500/10",    ring: "ring-rose-500/20" },
  incomplete_close: { label: "未完成收尾", dot: "bg-amber-400",   text: "text-amber-300",   bg: "bg-amber-500/10",   ring: "ring-amber-500/20" },
  market_closed:    { label: "休市等待",   dot: "bg-blue-400",    text: "text-blue-300",    bg: "bg-blue-500/10",    ring: "ring-blue-500/20" },
  delayed:          { label: "行情延迟",   dot: "bg-amber-400",   text: "text-amber-300",   bg: "bg-amber-500/10",   ring: "ring-amber-500/20" },
  recovering:       { label: "恢复中",     dot: "bg-amber-400",   text: "text-amber-300",   bg: "bg-amber-500/10",   ring: "ring-amber-500/20", pulse: true },
  manual_stopped:   { label: "已停止",     dot: "bg-slate-500",   text: "text-slate-300",   bg: "bg-slate-500/10",   ring: "ring-slate-500/20" },
}

const RUN_KIND_META: Record<RunKind, { label: string; cls: string; countsPerf: boolean }> = {
  live_sim:          { label: "实时模拟",              cls: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20", countsPerf: true },
  replay_exec:       { label: "历史回放 / 非实时",     cls: "bg-violet-500/10 text-violet-300 ring-violet-500/20",   countsPerf: false },
  data_only:         { label: "仅行情 / 不计策略表现", cls: "bg-slate-500/10 text-slate-400 ring-slate-500/20",      countsPerf: false },
  historical_replay: { label: "遗留回放 / 仅输入验证", cls: "bg-slate-500/10 text-slate-400 ring-slate-500/20",      countsPerf: false },
}

const EVIDENCE_META: Record<Evidence, { label: string; text: string }> = {
  confirmed:   { label: "证据完整",                text: "text-emerald-400" },
  partial:     { label: "部分已确认 / 证据不完整", text: "text-amber-300" },
  unavailable: { label: "证据不可用",              text: "text-rose-400" },
}

const lampCls: Record<LampState, string> = { ok: "bg-emerald-400", warn: "bg-amber-400", error: "bg-rose-500", na: "bg-slate-600" }

/* ─── Mock data (示例数据) ────────────────────────────────────────── */

/* ─── 策略正式名称 + 周期表现（今日 / 本周 / 本月） ───────────────── */

const STRATEGY_CN: Record<string, string> = {
  footprint_absorption_reversal: "足迹吸收反转", footprint_imbalance_range: "足迹区间失衡", trend_pullback_ema: "EMA 趋势回踩",
  footprint_delta_flip: "足迹 Delta 翻转", smc_breakout_retest: "SMC 突破回踩", ict_liquidity_fvg: "ICT 流动性扫单",
  unfinished_auction: "未完成拍卖", footprint_poc_revert: "足迹 POC 回归",
}


const PERIODS: Period[] = ["今日", "本周", "本月"]
// CT_DATE 2026-09-30（周三）：本周 09-28 起，本月 09-01 起
const PERIOD_RANGE: Record<Period, { from: string; to: string }> = {
  今日: { from: "09-30 09:30", to: "现在" }, 本周: { from: "09-28", to: "09-30" }, 本月: { from: "09-01", to: "09-30" },
}
const money = (n: number) => `${n < 0 ? "-" : "+"}$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** 示例：每条记录每个区间唯一数据源 —— 数字、曲线 seed、起止窗口都从这里取；未提供返回 null */
function rangeData(sim: Simulation, p: Period) {
  if (!sim.metrics || !RUNNING.includes(sim.status) || sim.noData?.includes(p)) return null
  const total = Number(sim.metrics.netPnl.replace(/[^0-9.-]/g, ""))
  const orders = Number(sim.metrics.orders)
  const share = { 今日: 0.05 + (sim.seed % 5) * 0.01, 本周: 0.3 + (sim.seed % 3) * 0.05, 本月: 0.75 }[p]
  const n = Math.max(1, Math.round(orders * share))
  const pnl = Math.round(total * share / 2.5) * 2.5
  const j = (base: string, d: number) => (Number(base.replace(/[^0-9.]/g, "")) + d).toFixed(1)
  const k = PERIODS.indexOf(p) - 1
  return {
    pnl: money(pnl), from: PERIOD_RANGE[p].from, to: PERIOD_RANGE[p].to, orders: n,
    seed: sim.seed + PERIODS.indexOf(p) * 7,
    m: {
      netPnl: money(pnl), maxDrawdown: money(-Math.round(Math.abs(Number(sim.metrics.maxDrawdown.replace(/[^0-9.]/g, ""))) * (0.4 + share * 0.6))),
      winRate: `${j(sim.metrics.winRate, k * 2.3)}%`, orders: String(n),
      sharpe: j(sim.metrics.sharpe, k * 0.3), profitFactor: j(sim.metrics.profitFactor, k * 0.2),
    },
  }
}

const UNKNOWN_METRICS = { netProfit: "未提供", maxDrawdown: "未提供", winRate: "未提供", orderCount: "未提供", sharpe: "未提供", profitFactor: "未提供" }

/** 同一记录 = 不可变策略版本 + 品种；历史 run 初始数据 */
const END_REASON: Partial<Record<SimStatus, string>> = { completed: "正常收尾", failed: "行情连接中断", incomplete_close: "未完成收尾", manual_stopped: "手动停止" }
function initRuns(): Record<string, RunRec[]> {
  const m: Record<string, RunRec[]> = {}
  for (const s of SIMS) {
    if (!s.runId) continue
    const term = STOPPED.includes(s.status)
    m[s.id] = [{
      n: 1, start: s.startDate === "—" ? "未提供" : `${s.startDate.slice(5)} 09:30`,
      end: term ? (s.endedAt?.slice(5, 16) ?? "未提供") : null, reason: term ? (END_REASON[s.status] ?? "未提供") : "进行中",
    }]
  }
  m["sim-001"] = [
    { n: 1, start: "07-01 09:30", end: "07-18 16:00", reason: "手动停止" },
    { n: 2, start: "08-24 09:30", end: null, reason: "进行中" },
  ]
  return m
}
const ARCHIVED_IDS = ["sim-004", "sim-005"]
const nowStr = () => {
  const d = new Date(), p = (x: number) => String(x).padStart(2, "0")
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/* ─── Section grouping ────────────────────────────────────────────── */

const PENDING: SimStatus[] = ["draft", "preparing"]
const RUNNING: SimStatus[] = ["running", "lagging", "isolated", "stopping", "market_closed", "delayed", "recovering"]
const STOPPED: SimStatus[] = ["completed", "failed", "incomplete_close", "manual_stopped"]
const simSym = (s: Simulation) => s.contract.slice(0, 2)
/** 接出口只能基于「运行中 + 实时模拟」 */
const outletEligible = (s: Simulation) => s.status === "running" && s.runKind === "live_sim"

/* ─── Small presentational helpers ────────────────────────────────── */

function StatusBadge({ status }: { status: SimStatus }) {
  const m = STATUS_META[status]
  return (
    <span className={`inline-flex h-6 shrink-0 items-center gap-1.5 rounded-md px-2 text-[12px] font-medium ring-1 ${m.bg} ${m.text} ${m.ring}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot} ${m.pulse ? "animate-pulse" : ""}`} />
      {m.label}
    </span>
  )
}

// 标题前的类型标签：实时 / 回放 / 行情（已完成记录追加「/ 复盘」）
function RunTypeTag({ kind, replay }: { kind: RunKind; replay?: boolean }) {
  const short = kind === "live_sim" ? "实时" : kind === "data_only" ? "行情" : "回放"
  const m = RUN_KIND_META[kind]
  return (
    <span className={`shrink-0 rounded-md px-2 py-[3px] text-[11px] font-medium ring-1 ${m.cls}`}>
      {short}{replay ? " / 复盘" : ""}
    </span>
  )
}

// 六项 → 3 组 top/bottom 指标（对齐策略列表）
function FactRow({ k, fact }: { k: string; fact: Fact }) {
  const cls = fact.state === "unavailable" ? "text-rose-400/90" : fact.state === "confirmed_empty" ? "text-slate-500"
    : fact.text.startsWith("多") || fact.text.startsWith("+") ? "text-emerald-400"
    : fact.text.startsWith("空") || fact.text.startsWith("-") ? "text-rose-400" : "text-slate-200"
  return (
    <div className="flex items-start justify-between gap-4 py-1 text-[12px]">
      <span className="shrink-0 text-slate-500">{k}</span>
      <span className={`text-right font-mono ${cls}`}>{fact.text}</span>
    </div>
  )
}

function usePopover() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("mousedown", h); document.addEventListener("keydown", k)
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", k) }
  }, [open])
  return { open, setOpen, ref }
}

const STATUS_REASON: Partial<Record<SimStatus, string>> = {
  running: "运行正常", delayed: "行情延迟，策略暂停推进，不会产生新信号", recovering: "连接已恢复，正在补齐缺口数据",
  market_closed: "当前休市，开市后自动继续", lagging: "策略推进落后于行情", stopping: "正在平仓并收尾",
  isolated: "可靠价格无法确认，已隔离", manual_stopped: "手动停止", completed: "正常收尾", failed: "行情连接中断", incomplete_close: "未完成收尾，保护状态未知",
}

// 唯一主状态：点击展开原因 / 最后数据时间 / 恢复进度
function StatusPopover({ sim, recoveredRun }: { sim: Simulation; recoveredRun?: number }) {
  const { open, setOpen, ref } = usePopover()
  const m = STATUS_META[sim.status]
  const reason = sim.anomaly ?? STATUS_REASON[sim.status] ?? "—"
  const progress = sim.status === "recovering" ? 62 : null
  return (
    <span ref={ref} className="relative flex shrink-0" onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={`${m.label}，查看状态详情`}
        className={`inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2 text-[12px] font-medium ring-1 ${m.bg} ${m.text} ${m.ring}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${m.dot} ${m.pulse ? "animate-pulse" : ""}`} />
        {m.label}
        <svg className={`h-3 w-3 opacity-60 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 mt-1.5 w-[260px] max-w-[calc(100vw-3rem)] whitespace-normal rounded-lg border border-white/[0.08] bg-[#0a0d14] p-3 shadow-2xl">
          <KV k="原因" v={reason} mono={false} />
          {recoveredRun != null && sim.status === "running" && <KV k="恢复" v={`已恢复 · 继续 run #${recoveredRun}`} mono={false} cls="text-emerald-400" />}
          <KV k="最后数据时间" v={sim.lastMarketTime.text} />
          {progress != null && (
            <div className="py-1 text-[12px]">
              <div className="flex justify-between"><span className="text-slate-500">恢复进度</span><span className="font-mono text-slate-300">{progress}%</span></div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-amber-400" style={{ width: `${progress}%` }} /></div>
            </div>
          )}
          <div className="mt-1.5 border-t border-white/[0.06] pt-1.5">
            <FactRow k="当前 Position" fact={sim.position} />
            <FactRow k="本卡当日已亏损" fact={sim.todayLoss} />
            <FactRow k="剩余日限额" fact={sim.dailyLimitLeft} />
          </div>
        </div>
      )}
    </span>
  )
}

function Btn({ children, onClick, kind = "ghost", disabled }: {
  children: React.ReactNode; onClick?: () => void; kind?: "primary" | "ghost" | "danger"; disabled?: boolean
}) {
  const cls =
    kind === "primary" ? "bg-sky-500 text-white hover:bg-sky-400" :
    kind === "danger" ? "border border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20" :
    "border border-white/[0.08] bg-white/[0.03] text-slate-200 hover:bg-white/[0.07]"
  return (
    <button onClick={onClick} disabled={disabled}
      className={`rounded-md px-4 py-1.5 text-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${cls}`}>
      {children}
    </button>
  )
}

/* ─── Cards ───────────────────────────────────────────────────────── */

function MoreMenu({ items }: { items: { label: string; onClick?: () => void; danger?: boolean }[] }) {
  const { open, setOpen, ref } = usePopover()
  return (
    <span ref={ref} className="relative flex shrink-0">
      <button aria-expanded={open} onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 whitespace-nowrap rounded-md border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-[12px] text-slate-300 hover:bg-white/[0.07]">
        更多
        <svg className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-30 mt-2 w-[160px] rounded-lg border border-white/[0.1] bg-[#121826] p-1 shadow-xl shadow-black/50">
          {items.map((it) => (
            <button key={it.label} role="menuitem" disabled={!it.onClick} title={!it.onClick ? "样本未接入此业务操作" : undefined} onClick={() => { it.onClick?.(); setOpen(false) }}
              className={`flex w-full whitespace-nowrap rounded-md px-3 py-2 text-left text-[12px] hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50 ${it.danger ? "text-rose-300" : "text-slate-200"}`}>{it.label}{!it.onClick ? "（未接业务）" : null}</button>
          ))}
        </div>
      )}
    </span>
  )
}

// 待启动卡：极简，仅身份 + 状态 + 基础信息 + 操作
function PendingCard({ sim, onViewDetail }: { sim: Simulation; onViewDetail: (s: Simulation) => void }) {
  return (
    <div data-simulation-id={sim.id} className="rounded-xl border border-white/[0.06] bg-[#0d111a] px-5 py-3.5 transition-colors hover:border-white/[0.12] hover:bg-[#0f141f]">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="min-w-[220px] flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <RunTypeTag kind={sim.runKind} replay={STOPPED.includes(sim.status)} />
            <h3 className="text-[15px] font-semibold text-slate-100">{sim.name}</h3>
            <StatusBadge status={sim.status} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 text-[12px] text-slate-500">
            <span className="text-slate-300">{STRATEGY_CN[sim.strategy] ?? sim.strategy}</span>
            <span className="font-mono text-sky-400/90">{sim.version}</span>
            <span className="font-mono text-slate-400">{sim.contract}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Btn kind="primary" disabled>开始（未接业务）</Btn>
          <span className="max-w-[180px] text-[11px] text-slate-400">启动/取消服务未接入；当前仅验证记录与工作台。</span>
          <MoreMenu items={[{ label: "查看配置", onClick: () => onViewDetail(sim) }, { label: "取消本次启动", danger: true }]} />
        </div>
      </div>
    </div>
  )
}

// 运行中 / 已停止卡：左信息 · 中指标+曲线 · 右操作
function SimRow({ sim, uncomputable, flash, runs, recoveredRun, onOutlet, onOpenWorkbench, onViewDetail, onStop, onNewRun, onDemo }: {
  sim: Simulation; uncomputable?: boolean; flash?: boolean; runs: RunRec[]; recoveredRun?: number; onOutlet: (s: Simulation) => void
  onOpenWorkbench: (id: string) => void; onViewDetail: (s: Simulation) => void; onStop: (s: Simulation) => void
  onNewRun: (s: Simulation) => void; onDemo: (s: Simulation, to: "running" | "delayed" | "recovering") => void
}) {
  const isRunning = RUNNING.includes(sim.status)
  const live = useLive()
  const sym = simSym(sim)
  const linked = live.outlets[sym as keyof typeof live.outlets] === sim.id // 已配置接入该品种
  const effective = effectiveLink(live, sym) === sim.id // 出口开闸时才算「已接入」
  const eligible = outletEligible(sim)
  const showMetrics = sim.metrics && RUN_KIND_META[sim.runKind].countsPerf
  const border =
    sim.status === "isolated" || sim.status === "failed" ? "border-rose-500/20 hover:border-rose-500/30" :
    sim.status === "incomplete_close" || sim.status === "lagging" || sim.status === "stopping" || sim.status === "delayed" || sim.status === "recovering" ? "border-amber-500/15 hover:border-amber-500/25" :
    sim.status === "running" ? "border-emerald-500/15 hover:border-emerald-500/25" :
    "border-white/[0.06] hover:border-white/[0.12]"

  const wb = hasWorkbench(sim.id)
  const [period, setPeriod] = useState<Period>("本周")
  const [histOpen, setHistOpen] = useState(false)
  const pd = showMetrics ? rangeData(sim, period) : null
  const stop = (e: React.MouseEvent) => e.stopPropagation()
  const sep = <span className="px-1 text-slate-700">/</span>

  return (
    <div data-simulation-id={sim.id} id={`sim-row-${sim.id}`} onClick={() => wb && onOpenWorkbench(sim.id)}
      className={`scroll-mt-24 rounded-xl border bg-[#0d111a] px-5 py-4 transition-colors hover:bg-[#121826] ${wb ? "cursor-pointer" : ""} ${border} ${flash ? "ring-2 ring-sky-400/60" : ""}`}>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      {/* 左：标题 / 策略副标题 / 周期盈亏 */}
      <div className="min-w-[240px] flex-1">
        <div className="flex items-center gap-2.5 whitespace-nowrap">
          <h3 className="min-w-0 truncate text-[16px] font-semibold text-slate-100">{sim.name}</h3>
          <StatusPopover sim={sim} recoveredRun={recoveredRun} />
          {linked && (effective
            ? <span className="inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-md bg-rose-400/10 px-2 text-[12px] font-medium text-rose-300 ring-1 ring-rose-400/30">已接入</span>
            : <span className="inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-md px-2 text-[12px] text-slate-500 ring-1 ring-white/[0.08]">未接入</span>)}
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-[12px] text-slate-500">
          <span className="text-slate-300">{STRATEGY_CN[sim.strategy] ?? sim.strategy}</span>
          <span className="font-mono text-sky-400/90">{sim.version}</span>
          <span className="px-1 text-slate-700">/</span>
          <span className="font-mono">{sim.contract.replace(/-.*/, "")}</span>
          <span className="px-1 text-slate-700">/</span>
          <span className="truncate">{isRunning ? (sim.runDuration ? `已运行 ${sim.runDuration}` : "run 执行中") : sim.endedAt ? `终止于 ${sim.endedAt.slice(5, 16)}` : "未提供"}</span>
          {runs.length > 0 && <>{sep}
            <button aria-expanded={histOpen} onClick={(e) => { e.stopPropagation(); setHistOpen((v) => !v) }}
              className="flex shrink-0 items-center gap-1 text-slate-400 hover:text-slate-200">
              run 历史 · {runs.length}
              <svg className={`h-3 w-3 transition-transform ${histOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
            </button></>}
        </div>
        <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2" onClick={stop}>
          <div className="flex shrink-0 rounded-lg bg-white/[0.03] p-0.5 ring-1 ring-white/[0.06]">
            {PERIODS.map((p) => {
              const d = showMetrics ? rangeData(sim, p) : null
              const on = p === period
              const tone = !d ? "text-slate-600" : d.pnl.startsWith("-") ? "text-rose-400" : "text-emerald-400"
              return (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`flex items-baseline gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 transition-colors ${on ? "bg-white/[0.08] shadow-sm" : "hover:bg-white/[0.04]"}`}>
                  <span className={`text-[11px] ${on ? "text-slate-200" : "text-slate-500"}`}>{p}</span>
                  <span className={`font-mono text-[12px] font-medium tabular-nums ${tone}`}>{d ? d.pnl : "未提供"}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Metrics · 与策略列表共用；窄屏先收起次要指标，再挤压标题 */}
      <div className="hidden min-[1280px]:contents">
      <MetricsBlock m={pd ? { netProfit: pd.m.netPnl, maxDrawdown: pd.m.maxDrawdown, winRate: pd.m.winRate, orderCount: pd.m.orders, sharpe: pd.m.sharpe, profitFactor: pd.m.profitFactor } : showMetrics ? UNKNOWN_METRICS : null}
        empty={sim.metricsNote ?? "未提供 · 六项表现不可计算"} />

      {/* Sparkline · 与策略列表共用 */}
      <EquityBlock title={RUN_KIND_META[sim.runKind].countsPerf ? `权益曲线 · ${period}` : "非表现运行"} right={pd ? `${pd.m.orders} 单` : "未提供"}
        seed={pd ? pd.seed : null} startDate={pd ? pd.from : "未提供"} endDate={pd ? pd.to : "未提供"}
        maxDrawdown={pd?.m.maxDrawdown} empty={showMetrics ? `${period}无数据 · 未提供` : "证据不足，无法绘制"} />
      </div>

      {/* Action buttons */}
      <div className="flex shrink-0 items-center" onClick={stop}>
        <RowMenu sim={sim} isRunning={isRunning} wb={wb} linked={linked} eligible={eligible}
          onOutlet={onOutlet} onOpenWorkbench={onOpenWorkbench} onViewDetail={onViewDetail} onStop={onStop} onNewRun={onNewRun} onDemo={onDemo} />
      </div>
      </div>
      {histOpen && (
        <div onClick={stop} className="mt-3 border-t border-white/[0.05] pt-2.5 text-[12px]">
          <div className="grid grid-cols-[56px_1fr_1fr_1.5fr] gap-x-4 pb-1 text-[11px] text-slate-500">
            <span>run</span><span>开始</span><span>结束</span><span>结束原因</span>
          </div>
          {runs.map((r) => (
            <div key={r.n} className="grid grid-cols-[56px_1fr_1fr_1.5fr] gap-x-4 py-0.5">
              <span className="font-mono text-slate-300">#{r.n}</span>
              <span className="font-mono text-slate-400">{r.start}</span>
              <span className="font-mono text-slate-400">{r.end ?? "进行中"}</span>
              <span className="text-slate-400">{r.reason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RowMenu({ sim, isRunning, wb, linked, eligible, onOutlet, onOpenWorkbench, onViewDetail, onStop, onNewRun, onDemo }: {
  sim: Simulation; isRunning: boolean; wb: boolean; linked: boolean; eligible: boolean
  onOutlet: (s: Simulation) => void; onOpenWorkbench: (id: string) => void; onViewDetail: (s: Simulation) => void
  onStop: (s: Simulation) => void; onNewRun: (s: Simulation) => void; onDemo: (s: Simulation, to: "running" | "delayed" | "recovering") => void
}) {
  const [open, setOpen] = useState(false)
  const [confirmStop, setConfirmStop] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) { setOpen(false); setConfirmStop(false) } }
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); setConfirmStop(false) } }
    document.addEventListener("mousedown", h); document.addEventListener("keydown", k)
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", k) }
  }, [open])
  const close = () => { setOpen(false); setConfirmStop(false) }
  const item = "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-[12px] text-slate-200 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:text-slate-600 disabled:hover:bg-transparent"

  return (
    <div ref={ref} className="relative flex items-center gap-2">
      {isRunning ? (
        <button disabled={!wb} title={wb ? undefined : "该模拟暂无工作台数据"} onClick={() => onOpenWorkbench(sim.id)}
          className="whitespace-nowrap rounded-md bg-sky-500 px-4 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-white/[0.04] disabled:text-slate-600">打开工作台</button>
      ) : (
        <button onClick={() => onNewRun(sim)}
          className="whitespace-nowrap rounded-md bg-sky-500 px-4 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-sky-400">重新启动</button>
      )}
      <button aria-expanded={open} onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 whitespace-nowrap rounded-md border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-[12px] text-slate-300 transition-colors hover:bg-white/[0.07]">
        更多
        <svg className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-30 mt-2 w-[200px] max-w-[calc(100vw-2rem)] rounded-lg border border-white/[0.1] bg-[#121826] p-1 shadow-xl shadow-black/50">
          {confirmStop ? (
            <div className="p-2">
              <div className="text-[12px] font-medium text-rose-300">确认正常停止？</div>
              <div className="mt-1 text-[11px] leading-snug text-slate-500">{sim.name} 将平仓后终止本次运行{linked ? "，并断开信号出口" : ""}。</div>
              <div className="mt-2.5 flex gap-2">
                <button onClick={() => setConfirmStop(false)} className="flex-1 rounded-md border border-white/[0.1] py-1.5 text-[12px] text-slate-300 hover:bg-white/[0.05]">取消</button>
                <button onClick={() => { onStop(sim); close() }} className="flex-1 rounded-md bg-rose-500/90 py-1.5 text-[12px] font-medium text-white hover:bg-rose-500">停止</button>
              </div>
            </div>
          ) : (
            <>
              <button role="menuitem" onClick={() => { ref.current?.querySelector<HTMLButtonElement>("button[aria-expanded]")?.focus(); onViewDetail(sim); close() }} className={item}>查看详情</button>
              {!isRunning && wb && <button role="menuitem" onClick={() => { onOpenWorkbench(sim.id); close() }} className={item}>打开工作台</button>}
              {linked ? (
                <button role="menuitem" onClick={() => { setOutlet(sim.contract.slice(0, 2), null); close() }} className={item}>断开信号出口</button>
              ) : eligible && (
                <button role="menuitem" onClick={() => { onOutlet(sim); close() }} className={item}>接入信号出口</button>
              )}
              {(sim.status === "running" || sim.status === "delayed" || sim.status === "recovering") && (
                <button role="menuitem" onClick={() => { onDemo(sim, sim.status === "running" ? "delayed" : sim.status === "delayed" ? "recovering" : "running"); close() }} className={`${item} text-slate-400`}>
                  {sim.status === "running" ? "模拟数据延迟" : sim.status === "delayed" ? "模拟开始恢复" : "模拟恢复完成"}
                  <span className="text-[10px] text-slate-600">演示</span>
                </button>
              )}
              {isRunning && (
                <>
                  <div className="my-1 h-px bg-white/[0.06]" />
                  <button role="menuitem" disabled={sim.status === "stopping"} onClick={() => setConfirmStop(true)} className={`${item} text-rose-300 hover:bg-rose-500/10`}>
                    {sim.status === "stopping" ? "停止中…" : "正常停止"}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

const LAMP_TEXT: Record<LampState, string> = { ok: "正常", warn: "降级", error: "失败", na: "未知" }

function KV({ k, v, mono = true, cls = "text-slate-300" }: { k: string; v: string; mono?: boolean; cls?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1 text-[12px]">
      <span className="shrink-0 text-slate-500">{k}</span>
      <span className={`min-w-0 truncate text-right ${mono ? "font-mono" : ""} ${cls}`} title={v}>{v}</span>
    </div>
  )
}

// 紧凑双列字段
function Field({ label, value, mono = false, cls = "text-slate-200" }: { label: string; value: string; mono?: boolean; cls?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className={`mt-0.5 truncate text-[12px] ${mono ? "font-mono" : ""} ${cls}`} title={value}>{value}</div>
    </div>
  )
}

// 悬浮 tips（次要信息）
function Tip({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button onClick={() => setOpen((v) => !v)}
        className="text-[11px] text-slate-400 underline decoration-dotted underline-offset-2 hover:text-slate-200">
        {label}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-[280px] rounded-lg border border-white/[0.08] bg-[#0a0d14] p-3 text-left shadow-2xl">
          {children}
        </div>
      )}
    </span>
  )
}

// 折叠子块（次要明细默认收起）
function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-2 border-t border-white/[0.05] pt-2">
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className="flex w-full items-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-slate-200">
        <svg className={`h-3 w-3 text-slate-500 transition-transform ${open ? "rotate-90" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 6 6 6-6 6" /></svg>
        {title}
      </button>
      {open && <div className="mt-1.5">{children}</div>}
    </div>
  )
}

// 可独立折叠 / 独立状态的证据分区
function EvSection({ title, defaultOpen = true, state = "ready", children }: {
  title: string; defaultOpen?: boolean
  state?: "ready" | "loading" | "unavailable" | "na"
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="border-t border-white/[0.06] first:border-t-0">
      <h3>
        <button onClick={() => setOpen((v) => !v)} aria-expanded={open}
          className="flex w-full items-center justify-between gap-2 px-5 py-3 text-left hover:bg-white/[0.02]">
          <span className="flex items-center gap-2 text-[12px] font-semibold text-slate-200">
            {title}
            {state === "na" && <span className="rounded bg-slate-500/10 px-1.5 py-[1px] text-[10px] font-normal text-slate-400 ring-1 ring-slate-500/20">不适用</span>}
            {state === "unavailable" && <span className="rounded bg-rose-500/10 px-1.5 py-[1px] text-[10px] font-normal text-rose-300 ring-1 ring-rose-500/20">证据不可用</span>}
          </span>
          <svg className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform ${open ? "" : "-rotate-90"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
        </button>
      </h3>
      {open && (
        <div className="px-5 pb-4">
          {state === "loading" ? (
            <div className="space-y-2 py-1">
              <div className="h-3 w-3/4 animate-pulse rounded bg-white/[0.05]" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-white/[0.05]" />
            </div>
          ) : children}
        </div>
      )}
    </section>
  )
}

/* ─── Lineage (执行 分区核心交互) ─────────────────────────────────── */

interface LineNode {
  type: "持仓" | "成交" | "意图" | "订单" | "信号" | "风控" | "行情"
  source?: "策略" | "系统收尾" | "保护" | "策略声明" | "系统固定"
  time: string
  detail: string
  status?: string
  reason?: string
  id?: string
  up?: LineNode[]
  down?: LineNode[]
  upUnavail?: string     // 直接上游缺失时的如实说明
  downUnavail?: string   // 直接下游缺失时的如实说明
}

const NODE_CLS: Record<LineNode["type"], string> = {
  持仓: "bg-sky-500/10 text-sky-300 ring-sky-500/20",
  成交: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20",
  意图: "bg-violet-500/10 text-violet-300 ring-violet-500/20",
  订单: "bg-sky-500/10 text-sky-300 ring-sky-500/20",
  信号: "bg-violet-500/10 text-violet-300 ring-violet-500/20",
  风控: "bg-amber-500/10 text-amber-300 ring-amber-500/20",
  行情: "bg-slate-500/10 text-slate-300 ring-slate-500/20",
}

function LineageNode({ node, depth = 0 }: { node: LineNode; depth?: number }) {
  const [open, setOpen] = useState(false)
  const expandable = !!(node.up || node.down || node.upUnavail || node.downUnavail)
  return (
    <li>
      <button onClick={() => expandable && setOpen((v) => !v)} aria-expanded={expandable ? open : undefined}
        className={`flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left ${expandable ? "hover:bg-white/[0.03]" : "cursor-default"}`}>
        {expandable ? (
          <svg className={`mt-[3px] h-3 w-3 shrink-0 text-slate-500 transition-transform ${open ? "rotate-90" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 6 6 6-6 6" /></svg>
        ) : <span className="mt-[3px] h-3 w-3 shrink-0" />}
        <span className={`mt-[1px] shrink-0 rounded px-1.5 py-[1px] text-[10px] font-medium ring-1 ${NODE_CLS[node.type]}`}>{node.type}</span>
        {node.source && (
          <span className="mt-[1px] shrink-0 rounded bg-white/[0.04] px-1.5 py-[1px] text-[10px] text-slate-400 ring-1 ring-white/[0.06]">{node.source}</span>
        )}
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-mono text-[11px] text-slate-500">{node.time}</span>
            <span className="text-[12px] text-slate-200">{node.detail}</span>
            {node.status && <span className="text-[11px] text-slate-400">· {node.status}</span>}
          </span>
          {node.reason && <span className="block text-[11px] text-rose-300/90">{node.reason}</span>}
          {node.id && <span className="block truncate font-mono text-[10px] text-slate-600">{node.id}</span>}
        </span>
      </button>

      {open && (
        <div className="ml-4 border-l border-white/[0.06] pl-3">
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">直接上游</div>
          {node.up ? (
            <ul className="mt-0.5">{node.up.map((n, i) => <LineageNode key={i} node={n} depth={depth + 1} />)}</ul>
          ) : (
            <div className="py-1 text-[11px] text-slate-500">{node.upUnavail ?? "不可用"}</div>
          )}
          <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">直接下游</div>
          {node.down ? (
            <ul className="mt-0.5">{node.down.map((n, i) => <LineageNode key={i} node={n} depth={depth + 1} />)}</ul>
          ) : (
            <div className="py-1 text-[11px] text-slate-500">{node.downUnavail ?? "不可用"}</div>
          )}
        </div>
      )}
    </li>
  )
}

// 示例执行链（占位结构）—— 一次完成的实时模拟
const EXEC_SIM001: LineNode[] = [
  {
    type: "持仓", source: "策略", time: "11:02:47", detail: "已平仓 · 净 +$270.00", status: "已确认平仓", id: "pos-1a2b",
    downUnavail: "无下游 · 已确认平仓",
    up: [
      {
        type: "成交", source: "策略", time: "10:14:31", detail: "买 1 手 @ 21,430.25", status: "已成交", id: "fill-9de1",
        downUnavail: "无下游 · 已并入持仓",
        up: [
          {
            type: "意图", source: "策略", time: "10:14:23", detail: "限价买 1 手 @ 21,430.25", status: "已成交", id: "oi-3f7c · coid-0f2c",
            down: [{ type: "订单", source: "策略", time: "10:14:23", detail: "限价单已提交 → 已成交", status: "terminal", id: "coid-0f2c" }],
            up: [
              { type: "信号", source: "策略", time: "10:14:22", detail: "吸收反转 · 多", id: "sig-4b19", upUnavail: "源行情引用 · 不可用（示例未接入）", downUnavail: "已生成意图（见同级）" },
              { type: "风控", source: "策略声明", time: "10:14:22", detail: "放行 · 日限额充足", status: "规则 v12", id: "rd-77a1" },
            ],
          },
        ],
      },
      {
        type: "成交", source: "保护", time: "11:02:47", detail: "止盈成交 1 手 @ 21,443.75", status: "已成交", id: "fill-a034",
        downUnavail: "无下游 · 平仓成交",
        up: [
          {
            type: "意图", source: "保护", time: "10:14:31", detail: "止盈保护 @ 21,443.75", status: "已成交", id: "oi-4a90",
            up: [{ type: "信号", time: "—", detail: "无 Signal（保护）", status: "系统固定保护，属正常情况" }],
            down: [{ type: "订单", source: "保护", time: "10:14:31", detail: "止盈挂单 → 已成交", status: "terminal", id: "coid-5b1e" }],
          },
        ],
      },
    ],
  },
  {
    type: "意图", source: "策略", time: "13:37:10", detail: "限价买 1 手 @ 21,455.00", status: "被拒绝", reason: "拒绝原因：超出当日剩余日限额", id: "oi-8c22",
    downUnavail: "无下游 · 意图被拒绝，未生成订单",
    up: [
      { type: "信号", source: "策略", time: "13:37:09", detail: "二次吸收 · 多", id: "sig-9f03", upUnavail: "源行情引用 · 不可用（示例未接入）" },
      { type: "风控", source: "策略声明", time: "13:37:10", detail: "拒绝 · 剩余额度不足", status: "规则 v12", reason: "RiskDecision：daily_loss_budget_exceeded", id: "rd-8d55" },
    ],
  },
]

/* ─── Run-detail drawer (T11 完整证据视图) ────────────────────────── */

function RunDrawer({ sim, onClose, onOpenWorkbench }: { sim: Simulation; onClose: () => void; onOpenWorkbench: (id: string) => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const dialog = dialogRef.current
    dialog?.showModal()
    const containTab = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Tab" || !dialog) return
      const controls = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'))
        .filter(control => control.getClientRects().length > 0)
      const first = controls[0], last = controls[controls.length - 1]
      if (!first || !last) return
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    dialog?.addEventListener("keydown", containTab)
    closeRef.current?.focus()
    return () => {
      dialog?.removeEventListener("keydown", containTab)
      dialog?.close()
      if (trigger?.isConnected) trigger.focus()
    }
  }, [])

  // Footprint 重建 / 保留窗口状态（Task 2）—— 全部内联进现有区块
  // Footprint / 保留窗口状态 —— 与工作台监控浮窗「分区 2」同一状态源
  const fpState = useFootprint()

  const ev = EVIDENCE_META[sim.evidence]
  const kind = sim.runKind
  const terminal = STOPPED.includes(sim.status)
  const running = RUNNING.includes(sim.status)
  const exportable = terminal && kind !== "historical_replay"
  const bannerKind = kind === "replay_exec" || kind === "historical_replay"

  const endReason =
    sim.status === "completed" ? "正常收尾 · Position Flat 且订单终态" :
    sim.status === "failed" ? "运行失败 · 行情连接中断" :
    sim.status === "incomplete_close" ? "未完成收尾 · 保护状态未知" :
    sim.status === "isolated" ? "隔离 · 可靠价格无法确认" :
    sim.status === "manual_stopped" ? "手动停止" : "—"

  const timelineEvents: TimelineEvent[] = sim.status === "failed" ? TIMELINE_SIM005 : TIMELINE_SIM001

  // 执行 / 账户 分区在部分 run_kind 下不适用
  const execNa = kind === "data_only"
  const execLegacy = kind === "historical_replay"

  const okN = sim.health.filter((l) => l.state === "ok").length
  const warnN = sim.health.filter((l) => l.state === "warn").length
  const errN = sim.health.filter((l) => l.state === "error").length
  const naAll = sim.health.every((l) => l.state === "na")
  const healthSummary = naAll ? "尚未运行" : errN > 0 ? `${errN} 项失败` : warnN > 0 ? `${warnN} 项降级` : "全部正常"

  const protectionFact: Fact =
    sim.status === "isolated" || sim.status === "incomplete_close" ? { state: "unavailable", text: "保护未知" } :
    sim.status === "completed" ? { state: "confirmed_empty", text: "无（已平仓）" } :
    { state: "confirmed", text: "止盈止损挂单中" }

  return (
    <dialog ref={dialogRef} className="fixed inset-0 z-50 flex justify-end backdrop:bg-black/60" role="dialog" aria-label="运行详情"
      style={{ margin: 0, padding: 0, border: 0, maxWidth: "none", maxHeight: "none", width: "100vw", height: "100dvh", background: "transparent" }}
      onCancel={event => { event.preventDefault(); onClose() }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-[520px] flex-col border-l border-white/[0.08] bg-[#0a0d14] shadow-2xl">

        {/* ── Header (always visible) ── */}
        <div className="shrink-0 border-b border-white/[0.08] px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-slate-100">运行详情</span>
                <StatusBadge status={sim.status} />
              </div>
              <p className="mt-1 text-[12px] text-slate-200" style={{ overflowWrap: "anywhere" }}>{sim.name}</p>
              <div className="mt-1 truncate font-mono text-[12px] text-slate-400" title={sim.runId ?? undefined}>
                {sim.runId ?? "尚未产生 run"}
                {terminal && <span className="text-slate-600"> · {endReason}</span>}
              </div>
            </div>
            <button ref={closeRef} onClick={onClose} aria-label="关闭运行详情"
              className="shrink-0 rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[12px] text-slate-300 hover:bg-white/[0.07]">关闭</button>
          </div>

          {bannerKind && (
            <div className="mt-3 rounded-md bg-violet-500/10 px-3 py-1.5 text-[11px] text-violet-200 ring-1 ring-violet-500/20">
              {RUN_KIND_META[kind].label} · 任何数字不进绩效汇总口径
            </div>
          )}
          {!terminal && (
            <div className="mt-3 rounded-md bg-amber-500/10 px-3 py-1.5 text-[11px] text-amber-200 ring-1 ring-amber-500/20" role="status">
              进行中 · 截至最后确认事件
            </div>
          )}

          {/* 动作区 —— 打开工作台在最上面且不带 run 信息 */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {sim.runId && (
              fpState === "out-of-window" ? (
                // 工作台入口卡就地替换：超出保留窗口·无法重建（其余记录照常可读）
                <div className="rounded-md border border-amber-500/25 bg-amber-500/[0.06] px-3 py-1.5 text-[12px] text-amber-200">
                  超出保留窗口·无法重建
                  <span className="ml-1 text-[11px] text-amber-300/70">· 该运行的窗口内记录已过期，无法打开真实 5m Footprint</span>
                </div>
              ) : (
                <Btn kind="primary" disabled={!hasWorkbench(sim.id)} onClick={() => onOpenWorkbench(sim.id)}>
                  {terminal ? "打开工作台：复盘记录" : "打开工作台"}
                </Btn>
              )
            )}
            <button disabled={!exportable} aria-label="导出运行事实" title={exportable ? undefined : "运行结束后可导出"}
              className={`rounded-md px-3.5 py-1.5 text-[12px] font-medium ${exportable ? "border border-white/[0.08] bg-white/[0.03] text-slate-200 hover:bg-white/[0.07]" : "cursor-not-allowed border border-white/[0.08] bg-white/[0.02] text-slate-600"}`}>
              导出
            </button>
            {running && sim.status !== "stopping" && (
              <>
                <button disabled={!hasWorkbench(sim.id)} onClick={() => onOpenWorkbench(sim.id)}
                  title={hasWorkbench(sim.id) ? undefined : "该模拟暂无工作台数据"}
                  className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3.5 py-1.5 text-[12px] font-medium text-amber-200 hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50">前往工作台正常停止</button>
                {!hasWorkbench(sim.id) && <span className="text-[11px] text-amber-200">该模拟暂无工作台数据，无法前往工作台正常停止</span>}
              </>
            )}
          </div>
          {terminal && !exportable && <div className="mt-1.5 text-[11px] text-slate-600">该 run_kind 导出禁用</div>}

        </div>

        {/* ── Scrollable evidence sections ── */}
        <div className="min-h-0 flex-1 overflow-y-auto">

          {/* 概览 —— 紧凑 */}
          <EvSection title="概览">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              <Field label="状态" value={STATUS_META[sim.status].label} cls={STATUS_META[sim.status].text} />
              <Field label="run_kind" value={RUN_KIND_META[kind].label} />
              <Field label="策略 / 版本" value={`${sim.strategy}:${sim.version}`} mono cls="text-sky-400" />
              <Field label="合约" value={sim.contract} mono />
              <Field label="session" value={sim.session} />
              <Field label="运行时长" value={sim.runDuration ?? (running ? "进行中" : "不可用")} />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-white/[0.05] pt-2.5">
              <span className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  {sim.health.map((l) => <span key={l.label} className={`h-1.5 w-1.5 rounded-full ${lampCls[l.state]}`} />)}
                </span>
                健康 · {healthSummary}
              </span>
              <Tip label="标识与快照">
                <div className="mb-1 text-[11px] font-semibold text-slate-400">标识与快照</div>
                <KV k="RunSpec" v={sim.runId ? "rs-8f2c…a417" : "不可用"} />
                <KV k="策略内容" v={sim.runId ? "st-3b90…7de1" : "不可用"} />
                <KV k="runtime" v={sim.runId ? "rt-51aa…0c22" : "不可用"} />
                <div className="mt-1.5 border-t border-white/[0.06] pt-1.5">
                  {sim.health.map((l) => (
                    <div key={l.label} className="flex items-center justify-between py-0.5 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1.5"><span className={`h-1.5 w-1.5 rounded-full ${lampCls[l.state]}`} />{l.label}</span>
                      <span className="text-slate-500">{LAMP_TEXT[l.state]}</span>
                    </div>
                  ))}
                </div>
              </Tip>
            </div>

            {/* Footprint 行内状态（重建渲染中 / 历史回补中）—— 完成后自动消失 */}
            {(fpState === "rebuilding" || fpState === "backfill") && (
              <div className="mt-2.5 flex items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[11px]">
                <svg className="h-3.5 w-3.5 shrink-0 animate-spin text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.2-8.5" /></svg>
                <span className="text-slate-300">Footprint</span>
                <span className="text-sky-300">{fpState === "rebuilding" ? "重建渲染中" : "历史回补中"}</span>
                <span className="ml-auto font-mono text-slate-500">
                  {fpState === "rebuilding" ? "bar 52 / 78 · 记录 #1,203,884" : "回补 41 / 78 · 计算 #984,120"}
                </span>
              </div>
            )}
          </EvSection>

          {/* 执行 */}
          <EvSection title="执行" defaultOpen={false} state={execNa ? "na" : sim.evidence === "unavailable" ? "unavailable" : "ready"}>
            {execNa ? (
              <p className="text-[12px] text-slate-500">不适用 · data_only 运行不产生执行事实</p>
            ) : execLegacy ? (
              <p className="text-[12px] text-slate-500">无 V2 执行事实 · 仅输入验证</p>
            ) : sim.status === "failed" ? (
              <div className="space-y-1.5">
                <p className="text-[12px] text-amber-300">部分已确认 · 证据不完整</p>
                <p className="text-[12px] text-slate-400">该运行没有产生 Signal（首个阻断：行情连接中断）</p>
              </div>
            ) : sim.evidence === "unavailable" ? (
              <p className="text-[12px] text-rose-400/90">证据不可用</p>
            ) : sim.status === "completed" ? (
              <ul className="space-y-0.5">{EXEC_SIM001.map((n, i) => <LineageNode key={i} node={n} />)}</ul>
            ) : (
              <div className="space-y-2">
                {!terminal && <p className="text-[11px] text-slate-500">进行中 · 仅显示截至最后确认事件的执行事实</p>}
                <ul className="space-y-0.5">{EXEC_SIM001.slice(0, 1).map((n, i) => <LineageNode key={i} node={n} />)}</ul>
              </div>
            )}
          </EvSection>

          {/* 账户与风险 —— 紧凑 */}
          <EvSection title="账户与风险" defaultOpen={false} state={execNa ? "na" : "ready"}>
            {execNa ? (
              <p className="text-[12px] text-slate-500">不适用 · data_only 运行不计策略表现</p>
            ) : execLegacy ? (
              <p className="text-[12px] text-slate-500">无 V2 执行事实 · 仅输入验证</p>
            ) : sim.metrics && kind === "live_sim" ? (
              <>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  <Field label="当前权益" value={sim.status === "completed" ? "$99,950.00" : "$100,037.50"} mono cls="text-slate-100" />
                  <Field label="已实现 PnL" value={sim.status === "completed" ? "+$150.00" : "-$50.00"} mono cls={sim.status === "completed" ? "text-emerald-400" : "text-rose-400"} />
                  <Field label="未实现 PnL" value={sim.position.state === "unavailable" ? "证据不可用" : sim.status === "completed" ? "$0.00（已平仓）" : "+$87.50"} mono cls={sim.position.state === "unavailable" ? "text-rose-400/90" : "text-slate-300"} />
                  <Field label="费用" value="-$12.60" mono cls="text-rose-400" />
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-white/[0.05] pt-2.5">
                  <FactRow k="Position" fact={sim.position} />
                  <FactRow k="保护状态" fact={protectionFact} />
                  <FactRow k="今日损失" fact={sim.todayLoss} />
                  <FactRow k="日限额" fact={sim.dailyLimitLeft} />
                </div>
                <Sub title="Nautilus 诊断值">
                  <KV k="诊断 · 净敞口" v="1 手（诊断）" />
                  <KV k="诊断 · 保证金" v="$4,180.00（诊断）" />
                </Sub>
                <Sub title="风控触发记录（RiskDecision）">
                  {sim.status === "completed" ? (
                    <div className="space-y-1 text-[11px]">
                      <div className="flex items-center gap-2"><span className="rounded bg-emerald-500/10 px-1.5 py-[1px] text-emerald-300 ring-1 ring-emerald-500/20">放行</span><span className="text-slate-400">日限额充足 · 规则 v12</span></div>
                      <div className="flex items-center gap-2"><span className="rounded bg-rose-500/10 px-1.5 py-[1px] text-rose-300 ring-1 ring-rose-500/20">拒绝</span><span className="text-slate-400">剩余额度不足 · 规则 v12</span></div>
                    </div>
                  ) : <p className="text-[11px] text-slate-500">无风控事件</p>}
                </Sub>
              </>
            ) : sim.status === "failed" ? (
              <p className="text-[12px] text-amber-300">有运行、无成交 · 已实现 PnL $0.00</p>
            ) : (
              <p className="text-[12px] text-slate-500">{sim.metricsNote ?? "证据不完整"}</p>
            )}
          </EvSection>

          {/* 数据与证据 —— 紧凑 */}
          <EvSection title="数据与证据" defaultOpen={false} state={sim.evidence === "unavailable" || fpState === "ref-mismatch" ? "unavailable" : "ready"}>
            {fpState === "ref-mismatch" ? (
              // 记录引用对不上：直接显示未提供，不渲染看似正确的行情
              <div className="rounded-md border border-rose-500/20 bg-rose-500/[0.05] px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">行情</span>
                  <span className="font-mono text-[12px] text-slate-600">未提供</span>
                </div>
                <p className="mt-1 text-[11px] text-rose-300/90">引用与指纹不一致</p>
              </div>
            ) : (
            <>
            <div className="mb-2.5 rounded-md bg-white/[0.02] px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">证据边界</span>
                <span className={`text-[12px] ${ev.text}`}>{ev.label}</span>
              </div>
              {sim.evidence !== "confirmed" && sim.lastMarketTime.state === "confirmed" && (
                <div className="mt-0.5 text-[11px] text-slate-500">最后确认时刻 · {sim.lastMarketTime.text}</div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              <Field label="行情来源" value="Databento Live" />
              <Field label="写入完整性"
                value={sim.evidence === "confirmed" ? "完整" : sim.evidence === "partial" ? "部分已确认" : "证据不可用"}
                cls={sim.evidence === "confirmed" ? "text-emerald-400" : sim.evidence === "partial" ? "text-amber-300" : "text-rose-400/90"} />
              <Field label="事件范围" value={sim.evidence === "confirmed" ? "09:30 – 16:00 ET" : `09:30 – ${sim.lastMarketTime.state === "unavailable" ? "不可用" : sim.lastMarketTime.text}`} mono />
              <Field label="缺口" value={sim.evidence === "confirmed" ? "无缺口" : "1 处 · 心跳超时"} cls={sim.evidence === "confirmed" ? "text-slate-200" : "text-amber-300"} />
            </div>
            <Sub title="质量与 Footprint 明细">
              <KV k="行情段引用" v="seg-20260827-nqu25" />
              <KV k="事件数" v={sim.evidence === "confirmed" ? "1,284,900" : "部分已确认"} />
              <KV k="重复 / 乱序" v={sim.evidence === "confirmed" ? "0 / 0" : "不可用"} />
              <KV k="最终 bar 区间" v={sim.evidence === "confirmed" ? "09:30 – 16:00 · 5m" : "封存于 10:56"} />
              <KV k="bar 数" v={sim.evidence === "confirmed" ? "78" : "部分已确认"} />
            </Sub>
            <Sub title="Failure 事实">
              {sim.status === "failed" ? (
                <p className="text-[11px] text-rose-300">行情连接中断 · 10:56:40 · 心跳超时</p>
              ) : (
                <p className="text-[11px] text-slate-500">断线 / 恢复类 · 不可用 · 能力尚未接入</p>
              )}
            </Sub>
            </>
            )}
          </EvSection>

          {/* 时间线 */}
          <EvSection title="时间线" defaultOpen={false}>
            <RunTimeline events={terminal || running ? timelineEvents : []} />
          </EvSection>
        </div>
      </div>
    </dialog>
  )
}

/* ─── Main component ──────────────────────────────────────────────── */

const ANOMALY_FILTERS = ["全部", "隔离", "未完成", "部分已确认"] as const
const SORT_OPTIONS = ["最近活动", "名称", "按表现排序"] as const

function isUncomputable(s: Simulation) {
  return !s.metrics || !RUN_KIND_META[s.runKind].countsPerf
}

/* 运行名额：读取共享准入状态源（与向导资源检查同步，UI-04） */
function SlotSummary() {
  const [open, setOpen] = useState(false)
  const rs = useResourceState()
  const info = resourceInfo(rs)
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} aria-label={`运行名额 ${info.used}/${SLOT_CAP}，展开占用列表`} aria-expanded={open}
        className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-[11px] text-slate-300 hover:bg-white/[0.05]">
        <span className={`h-1.5 w-1.5 rounded-full ${info.dot}`} />
        <span className="font-mono text-slate-100" title="运行名额">{info.used}/{SLOT_CAP}</span>
        <svg className={`h-3 w-3 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 mt-1.5 w-[300px] max-w-[calc(100vw-2rem)] rounded-xl border border-white/[0.1] bg-[#0a0d14] p-3 shadow-2xl">
          <div className="mb-2 text-[11px] text-slate-500">运行名额 · 占用 {info.used}/{SLOT_CAP}</div>
          <div className="space-y-1.5">
            {info.occupants.map((o) => (
              <div key={o.name} className="flex items-center gap-2 text-[11px]">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${o.state === "休市等待" ? "bg-sky-400" : "bg-emerald-400"}`} />
                <span className="min-w-0 flex-1 truncate text-slate-300">{o.name}</span>
                <span className={`shrink-0 ${o.cls}`}>{o.state}</span>
              </div>
            ))}
            {Array.from({ length: Math.max(0, SLOT_CAP - info.used) }).map((_, i) => (
              <div key={`free${i}`} className="flex items-center gap-2 text-[11px]">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-600" />
                <span className="flex-1 text-slate-600">空闲名额</span>
              </div>
            ))}
          </div>
          {!info.canStart && (
            <div className={`mt-2 rounded-md border px-2.5 py-1.5 text-[10px] leading-relaxed ${info.checkStatus === "warn" ? "border-amber-400/25 bg-amber-500/[0.06] text-amber-200" : "border-rose-400/25 bg-rose-500/[0.06] text-rose-200"}`}>
              {info.checkReason}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SourceSimulationBoard({ onOpen, demoState = "default", demoStress = false }: { onOpen: (simId: string) => void; demoState?: DemoState; demoStress?: boolean }) {
  const [query, setQuery] = useState("")
  const [anomaly, setAnomaly] = useState<string>("全部")
  const [sort, setSort] = useState<string>("最近活动")
  const [sortOpen, setSortOpen] = useState(false)
  const [drawer, setDrawer] = useState<Simulation | null>(null)
  const [blocked, setBlocked] = useState<{ want: Simulation; other: Simulation } | null>(null)
  const [confirmRestart, setConfirmRestart] = useState<Simulation | null>(null)
  const [confirmConn, setConfirmConn] = useState<Simulation | null>(null)
  const confirmation = useRef<HTMLDialogElement>(null)
  const confirmationTrigger = useRef<HTMLElement | null>(null)
  const captureConfirmationTrigger = () => {
    const active = document.activeElement as HTMLElement | null
    confirmationTrigger.current = active?.getAttribute("role") === "menuitem"
      ? active.closest('[data-simulation-id]')?.querySelector<HTMLButtonElement>('button[aria-expanded]') ?? active
      : active
  }
  useEffect(() => {
    const node = confirmation.current
    if (!node) return
    node.showModal()
    node.querySelector<HTMLButtonElement>('button[data-dialog-cancel]')?.focus()
    return () => {
      node.close()
      queueMicrotask(() => {
        if (confirmationTrigger.current?.isConnected) confirmationTrigger.current.focus()
        else document.getElementById("simulation-title")?.focus()
      })
    }
  }, [confirmRestart, confirmConn, blocked])
  const [flash, setFlash] = useState<string | null>(null)
  const [archOpen, setArchOpen] = useState(false)
  const [ov, setOv] = useState<Record<string, Partial<Simulation>>>({})
  const [runs, setRuns] = useState<Record<string, RunRec[]>>(initRuns)
  const [recovered, setRecovered] = useState<Record<string, number>>({})
  const live = useLive()
  const view = useMemo(() => SIMS.map((s) => { const value = ov[s.id] ? { ...s, ...ov[s.id] } : s; return demoStress ? {...value, name: value.name + " · 超长样本压力说明".repeat(12)} : value }), [ov, demoStress])
  // 运行名额：占用者 = 列表中「当前运行中」的记录，数量随列表变化
  useEffect(() => {
    const word: Partial<Record<SimStatus, [string, string]>> = {
      running: ["运行中", "text-emerald-300"], market_closed: ["休市等待", "text-sky-300"], delayed: ["行情延迟", "text-amber-300"],
      recovering: ["恢复中", "text-amber-300"], stopping: ["停止中", "text-amber-300"], isolated: ["已隔离", "text-rose-300"], lagging: ["推进落后", "text-amber-300"],
    }
    setOccupants(view.filter((x) => RUNNING.includes(x.status)).map((x) => ({ name: `${x.name} ${x.version}`, state: word[x.status]?.[0] ?? "运行中", cls: word[x.status]?.[1] ?? "text-slate-300" })))
  }, [view])
  const lastRun = (id: string) => runs[id]?.[runs[id].length - 1]
  const clearRecovered = (id: string) => setRecovered((r) => { const n = { ...r }; delete n[id]; return n })

  // 同一品种同时只允许一个模拟接出口（防重复下单）· 不提供强制；接入前需确认
  const connectOutlet = (s: Simulation) => {
    captureConfirmationTrigger()
    const cur = live.outlets[simSym(s) as keyof typeof live.outlets]
    const other = cur && cur !== s.id ? view.find((x) => x.id === cur) : undefined
    if (other) { setBlocked({ want: s, other }); return }
    setConfirmConn(s)
  }
  const doConnect = (s: Simulation) => {
    const prev = simById(live.outlets[simSym(s) as keyof typeof live.outlets])
    setOutlet(simSym(s), s.id)
    logEvent({ kind: "state", type: "接出口", obj: `模拟 ${s.name}`, change: prev ? `${prev.sym} ${prev.strategy} → ${s.name}` : `${simSym(s)} 接入信号出口`, result: "已生效", tone: "muted" })
    setConfirmConn(null)
  }
  const goSee = (id: string) => {
    setBlocked(null); setQuery(""); setAnomaly("全部")
    if (ARCHIVED_IDS.includes(id)) setArchOpen(true)
    scheduleSampleTimer(() => document.getElementById(`sim-row-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 60)
    setFlash(id); scheduleSampleTimer(() => setFlash(null), 2400)
  }
  // 重新开始：仍在同一条记录上，追加一次 run
  const restart = (s: Simulation) => {
    const n = (lastRun(s.id)?.n ?? 0) + 1
    setRuns((r) => ({ ...r, [s.id]: [...(r[s.id] ?? []), { n, start: nowStr(), end: null, reason: "进行中" }] }))
    setOv((o) => ({ ...o, [s.id]: { status: "running", runDuration: "刚刚开始", endedAt: null, runId: `RUN-20260930-${s.id.slice(4)}-${n}`, metrics: null, metricsNote: "新 run 刚开始 · 未提供", anomaly: null } }))
    clearRecovered(s.id)
  }
  const stopRun = (s: Simulation) => {
    setOv((o) => ({ ...o, [s.id]: { ...o[s.id], status: "stopping" } }))
    if (live.outlets[simSym(s) as keyof typeof live.outlets] === s.id) setOutlet(simSym(s), null)
    scheduleSampleTimer(() => {
      setRuns((r) => ({ ...r, [s.id]: (r[s.id] ?? []).map((x, i, arr) => (i === arr.length - 1 && !x.end ? { ...x, end: nowStr(), reason: "手动停止" } : x)) }))
      setOv((o) => ({ ...o, [s.id]: { ...o[s.id], status: "manual_stopped", runDuration: null, endedAt: `2026-09-30 ${nowStr().slice(6)} ET` } }))
    }, 1500)
  }
  // 演示：数据延迟 -> 恢复中 -> 运行中（同一 run，不新增 run）
  const demo = (s: Simulation, to: "running" | "delayed" | "recovering") => {
    setOv((o) => ({ ...o, [s.id]: { ...o[s.id], status: to } }))
    if (to === "running" && s.status === "recovering") setRecovered((r) => ({ ...r, [s.id]: lastRun(s.id)?.n ?? 1 }))
    if (to === "delayed") clearRecovered(s.id)
  }

  const filtered = useMemo(() => {
    return view.filter((s) => {
      const q = query.trim().toLowerCase()
      const matchQ = q ? [s.name, s.strategy, s.contract].join(" ").toLowerCase().includes(q) : true
      if (!matchQ) return false
      if (anomaly === "全部") return true
      if (anomaly === "隔离") return s.status === "isolated"
      if (anomaly === "未完成") return s.status === "incomplete_close"
      if (anomaly === "部分已确认") return s.evidence === "partial"
      return true
    })
  }, [query, anomaly, view])
  const active = filtered.filter((s) => !ARCHIVED_IDS.includes(s.id))
  const archived = filtered.filter((s) => ARCHIVED_IDS.includes(s.id))

  const sortSims = (arr: Simulation[]) => {
    const a = [...arr]
    if (sort === "名称") a.sort((x, y) => x.name.localeCompare(y.name, "zh"))
    else if (sort === "按表现排序") {
      a.sort((x, y) => {
        const ux = isUncomputable(x), uy = isUncomputable(y)
        if (ux !== uy) return ux ? 1 : -1
        const px = parseFloat((x.metrics?.netPnl ?? "0").replace(/[^0-9.-]/g, "")) || 0
        const py = parseFloat((y.metrics?.netPnl ?? "0").replace(/[^0-9.-]/g, "")) || 0
        return py - px
      })
    }
    return a
  }

  const groups = [
    { key: "pending", title: "待启动",   sims: sortSims(active.filter((s) => PENDING.includes(s.status))) },
    { key: "running", title: "当前运行中", sims: sortSims(active.filter((s) => RUNNING.includes(s.status))) },
    { key: "stopped", title: "已停止",   sims: sortSims(active.filter((s) => STOPPED.includes(s.status))) },
  ]
  const total = active.length

  return (
    <main className="mx-auto max-w-[1760px] px-4 py-8 sm:px-8">
      <Scenario state={demoState}/>
      {/* Heading + controls (mirrors strategy list) */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 id="simulation-title" tabIndex={-1} className="whitespace-nowrap text-[28px] font-bold text-slate-100">模拟记录</h1>
            <SlotSummary />
          </div>
          <div className="mt-1 text-[10px] font-semibold tracking-[0.06em] text-sky-500/80">SIMULATION RECORDS</div>
        </div>
        <div className="flex flex-wrap items-center gap-3 [&_button]:whitespace-nowrap">
          <div className="flex shrink-0 rounded-lg border border-white/[0.07] bg-white/[0.02] p-0.5">
            <span className="flex items-center whitespace-nowrap px-2 text-[11px] text-slate-600">异常筛选</span>
            {ANOMALY_FILTERS.map((f) => (
              <button key={f} onClick={() => setAnomaly(f)}
                className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${anomaly === f ? "bg-sky-500/15 text-sky-300" : "text-slate-400 hover:text-slate-200"}`}>
                {f}
              </button>
            ))}
          </div>
          <DemoPanel />
          <div className="relative shrink-0">
            <svg className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="搜索模拟、策略或合约" placeholder="搜索模拟、策略或合约"
              className="w-[200px] max-w-full rounded-lg border border-white/[0.07] bg-white/[0.02] py-2 pl-9 pr-3 text-[12px] text-slate-200 placeholder:text-slate-600 focus:border-sky-500/40 focus:outline-none" />
          </div>
          <div className="flex shrink-0 items-center gap-2 whitespace-nowrap text-[12px] text-slate-500">
            <span>排序</span>
            <div className="relative">
              <button onClick={() => setSortOpen((v) => !v)} className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-slate-300">
                {sort}
                <svg className={`h-3 w-3 text-slate-500 transition-transform ${sortOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
              </button>
              {sortOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setSortOpen(false)} />
                  <div className="absolute right-0 top-full z-40 mt-2 w-[160px] max-w-[calc(100vw-2rem)] rounded-lg border border-white/[0.08] bg-[#0a0d14] p-1 shadow-2xl">
                    {SORT_OPTIONS.map((o) => (
                      <button key={o} onClick={() => { setSort(o); setSortOpen(false) }}
                        className={`flex w-full rounded-md px-3 py-2 text-left text-[12px] hover:bg-white/[0.05] ${o === sort ? "text-sky-300" : "text-slate-300"}`}>{o}</button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sections */}
      {total === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.06] py-20 text-center">
          <div className="text-[15px] text-slate-500">没有符合条件的模拟</div>
          <div className="mt-2 text-[13px] text-slate-600">调整搜索或异常筛选条件</div>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((g) => (
            <section key={g.key} aria-label={g.title}>
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-[14px] font-semibold text-slate-200">{g.title}</h2>
                <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[11px] text-slate-400">{g.sims.length}</span>
              </div>
              {g.sims.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/[0.06] px-5 py-6 text-[12px] text-slate-600">
                  {g.key === "pending" ? "没有待启动的模拟" : g.key === "running" ? "当前没有运行中的模拟" : "还没有已停止的模拟"}
                </div>
              ) : (
                <div className="space-y-3">
                  {g.sims.map((s) =>
                    g.key === "pending" ? (
                      <PendingCard key={s.id} sim={s} onViewDetail={setDrawer} />
                    ) : (
                      <SimRow key={s.id} sim={s} uncomputable={sort === "按表现排序" && isUncomputable(s)} flash={flash === s.id} onOutlet={connectOutlet}
                        runs={runs[s.id] ?? []} recoveredRun={recovered[s.id]} onDemo={demo}
                        onOpenWorkbench={onOpen} onViewDetail={setDrawer} onStop={stopRun} onNewRun={sim => { captureConfirmationTrigger(); setConfirmRestart(sim) }} />
                    )
                  )}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      {/* 历史 / 归档：默认折叠，仅保留旧记录与重复记录，不提供删除 */}
      <section aria-label="历史/归档" className="mt-8">
        <button onClick={() => setArchOpen((v) => !v)} aria-expanded={archOpen} className="mb-3 flex items-center gap-2">
          <svg className={`h-3.5 w-3.5 text-slate-500 transition-transform ${archOpen ? "" : "-rotate-90"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
          <h2 className="text-[14px] font-semibold text-slate-200">历史/归档</h2>
          <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[11px] text-slate-400">{archived.length}</span>
        </button>
        {archOpen && (
          archived.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/[0.06] px-5 py-6 text-[12px] text-slate-600">没有归档的记录</div>
          ) : (
            <div className="space-y-3">
              {archived.map((s) => (
                <SimRow key={s.id} sim={s} flash={flash === s.id} onOutlet={connectOutlet}
                  runs={runs[s.id] ?? []} recoveredRun={recovered[s.id]} onDemo={demo}
                  onOpenWorkbench={onOpen} onViewDetail={setDrawer} onStop={stopRun} onNewRun={sim => { captureConfirmationTrigger(); setConfirmRestart(sim) }} />
              ))}
            </div>
          )
        )}
      </section>

      <div className="mt-10 text-center text-[11px] text-slate-700">示例数据，仅用于设计评审 · 不代表真实 PaperBuilder 业务数据</div>

      {drawer && <RunDrawer sim={drawer} onClose={() => setDrawer(null)} onOpenWorkbench={(id) => { setDrawer(null); onOpen(id) }} />}
      {confirmRestart && (
        <dialog ref={confirmation} aria-label="重新启动" onCancel={event => { event.preventDefault(); setConfirmRestart(null) }} className="m-auto w-[calc(100%-2rem)] max-w-[440px] border-0 bg-transparent p-0 text-slate-200 backdrop:bg-black/60">
          <div onClick={(e) => e.stopPropagation()} className="flex max-h-[calc(100dvh-2rem)] w-full max-w-[440px] flex-col rounded-xl border border-white/[0.08] bg-[#0d111a] shadow-2xl">
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <h2 className="text-[15px] font-semibold text-slate-100">重新启动 {confirmRestart.name}</h2>
              <p className="mt-3 text-[13px] leading-relaxed text-slate-300">将继续使用同一条记录，并追加一次运行。历史运行保留在「run 历史」中，不会新建记录卡。</p>
            </div>
            <div className="flex shrink-0 justify-end gap-2 border-t border-white/[0.06] px-5 py-3">
              <button data-dialog-cancel="" onClick={() => setConfirmRestart(null)} className="whitespace-nowrap rounded-md border border-white/[0.1] px-3 py-1.5 text-[12px] text-slate-300 hover:bg-white/[0.05]">取消</button>
              <button onClick={() => { restart(confirmRestart); setConfirmRestart(null) }} className="whitespace-nowrap rounded-md bg-sky-500 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-sky-400">确认重新启动</button>
            </div>
          </div>
        </dialog>
      )}
      {confirmConn && (
        <dialog ref={confirmation} aria-label="确认接入信号出口" onCancel={event => { event.preventDefault(); setConfirmConn(null) }} className="m-auto w-[calc(100%-2rem)] max-w-[440px] border-0 bg-transparent p-0 text-slate-200 backdrop:bg-black/60">
          <div onClick={(e) => e.stopPropagation()} className="max-h-[calc(100dvh-2rem)] w-full max-w-[440px] overflow-y-auto rounded-xl border border-white/[0.08] bg-[#0d111a] p-5 shadow-2xl">
            <h2 className="text-[15px] font-semibold text-slate-100">确认接入信号出口</h2>
            <div className="mt-3 space-y-1.5 rounded-md bg-white/[0.03] px-3 py-2 text-[12px]">
              <div className="flex justify-between gap-4"><span className="text-slate-500">策略版本</span><span className="text-slate-200">{STRATEGY_CN[confirmConn.strategy] ?? confirmConn.strategy} <span className="font-mono text-sky-400/90">{confirmConn.version}</span></span></div>
              <div className="flex justify-between gap-4"><span className="text-slate-500">品种</span><span className="font-mono text-slate-200">{simSym(confirmConn)}</span></div>
              <div className="flex justify-between gap-4"><span className="text-slate-500">合约</span><span className="font-mono text-slate-200">{confirmConn.contract}</span></div>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-slate-300">接入后该品种的信号会送往出口。关闭信号出口不会停止模拟运行。</p>
            <div className="mt-5 flex justify-end gap-2">
              <button data-dialog-cancel="" onClick={() => setConfirmConn(null)} className="rounded-md border border-white/[0.1] px-3 py-1.5 text-[12px] text-slate-300 hover:bg-white/[0.05]">取消</button>
              <button onClick={() => doConnect(confirmConn)} className="rounded-md bg-sky-500 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-sky-400">确认接入</button>
            </div>
          </div>
        </dialog>
      )}
      {blocked && (
        <dialog ref={confirmation} aria-label="不能接入信号出口" onCancel={event => { event.preventDefault(); setBlocked(null) }} className="m-auto w-[calc(100%-2rem)] max-w-[440px] border-0 bg-transparent p-0 text-slate-200 backdrop:bg-black/60">
          <div onClick={(e) => e.stopPropagation()} className="max-h-[calc(100dvh-2rem)] w-full max-w-[440px] overflow-y-auto rounded-xl border border-white/[0.08] bg-[#0d111a] p-5 shadow-2xl">
            <h2 className="text-[15px] font-semibold text-slate-100">不能接入信号出口</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-300">{simSym(blocked.want)} 已有运行中的模拟接出口，同一品种同时只允许一个，防重复下单</p>
            <div className="mt-3 rounded-md bg-white/[0.03] px-3 py-2 text-[12px] text-slate-400">当前占用出口的记录：<span className="text-slate-200">{blocked.other.name}</span></div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => goSee(blocked.other.id)} className="rounded-md px-3 py-1.5 text-[12px] text-sky-300 hover:bg-sky-400/10">定位</button>
              <button data-dialog-cancel="" onClick={() => setBlocked(null)} className="rounded-md border border-white/[0.1] px-3 py-1.5 text-[12px] text-slate-300 hover:bg-white/[0.05]">知道了</button>
            </div>
          </div>
        </dialog>
      )}
    </main>
  )
}


export function MockControls({state}:{state:DemoState}) {return <aside aria-label="样本状态控制" className="prototype-controls"><label>Mock 状态<select aria-label="Mock状态" value={state} onChange={e=>{const u=new URL(location.href);u.searchParams.set('state',e.target.value);location.assign(u.href)}}>{demoStates.map(s=><option key={s}>{s}</option>)}</select></label><button onClick={()=>{const u=new URL(location.href);u.searchParams.set('state','default');location.assign(u.href)}}>重置样本</button></aside>}
export function Scenario({state}:{state:DemoState}){return demoMessages[state]?<section className="demo-scenario" role={state==='error'?'alert':'status'}><p>{demoMessages[state]}</p><button onClick={()=>{const u=new URL(location.href);u.searchParams.set('state','default');location.assign(u.href)}}>返回默认状态</button></section>:null}
export default function SampleSimulationBoard(){const q=new URLSearchParams(location.search),state=parseDemoState(q.get('state')??undefined);useEffect(()=>mountSampleMock(),[]);return <div className="source-prototype"><MockControls state={state}/>{['loading','empty'].includes(state)?<main><p>{state==='loading'?'正在加载模拟记录…':'暂无模拟记录'}</p></main>:<SourceSimulationBoard demoState={state} demoStress={q.get('stress')==='1'} onOpen={id=>{location.hash='workbench?simId='+encodeURIComponent(id)}}/>}</div>}
