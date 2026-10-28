'use client';
import {SIMS,SIM_DATA,MOCK_NQ_QUOTE,MOCK_NQ_TICK_SIZE,MOCK_NQ_POSITION_ENTRY,type SimInfo} from '../lib/fixtures';
import {parseState as parseDemoState} from '../lib/mock-state';
import {MockControls,Scenario} from './SimulationBoard';
import {mountSampleMock,scheduleSampleTimer} from './live/store';
import { useEffect, useId, useRef, useState, type ReactNode } from "react"
import EquityCurve from "./EquityCurve"
import { effectiveLink, getLive, goCockpitConfig, logEvent, setOutlet, useOutlet } from "./live/store"
import { simById, simName } from "./live/demoUniverse"
import { DemoPanel } from "./live/status"
import CandleChart, { type FootprintOverlay } from "./CandleChart"
import RunTimeline, { TIMELINE_SIM001, TIMELINE_SIM005, type TimelineEvent } from "./RunTimeline"
import { MACHINE, PRESSURE_META, FP_META, FP_DEMO, usePressure, useFootprint, setFootprint } from "./systemState"

/* ─── Sim data registry ───────────────────────────────────────────── */

const RUN_KIND_LABEL: Record<SimInfo["runKind"], { label: string; cls: string }> = {
  live_sim: { label: "实时模拟", cls: "bg-emerald-500/10 text-emerald-300" },
  replay_exec: { label: "历史回放 / 非实时", cls: "bg-violet-500/10 text-violet-300" },
  data_only: { label: "仅行情 / 不计策略表现", cls: "bg-slate-500/10 text-slate-400" },
  historical_replay: { label: "遗留回放 / 仅输入验证", cls: "bg-slate-500/10 text-slate-400" },
}

/* ─── Mock order data (trade-level) ───────────────────────────────── */

interface LogicPt { text: string; ok: boolean }

interface SimOrder {
  dir: "多" | "空"
  title: string                    // 入场决策作为标题
  entryKind: "市价" | "限价"
  entryPrice: string
  limitReason?: string             // 限价挂单的位置理由
  holdTime: string                 // 持仓时间
  exitTime: string                 // 出场时间
  exitLogic: string                // 出场逻辑
  amount: string                   // 成交金额
  status: "持仓中" | "已止盈" | "已止损" | "已撤销" | "风控拒绝"
  pnl: string | null
  floating: boolean
  dirPoints: LogicPt[]             // 方向判断逻辑点
  entryPoints: LogicPt[]           // 入场逻辑点
  slTicks: string; slLogic: string
  tpTicks: string; tpLogic: string
  rr: string                       // 盈亏比
}

const ORDERS: SimOrder[] = [
  {
    dir: "多",
    title: "吸收反转 · 市价多头",
    entryKind: "市价",
    entryPrice: "21,430.25",
    holdTime: "进行中 · 3 分 20 秒",
    exitTime: "—",
    exitLogic: "受止盈止损保护，未出场",
    amount: "$21,430.25",
    status: "持仓中",
    pnl: "+$87.50",
    floating: true,
    dirPoints: [
      { text: "买盘吸收确认", ok: true },
      { text: "Delta +180 偏多", ok: true },
      { text: "POC 价位支撑", ok: true },
      { text: "订单流失衡", ok: true },
    ],
    entryPoints: [
      { text: "信号强度满格", ok: true },
      { text: "点差正常可市价", ok: true },
      { text: "无需等待回踩", ok: true },
    ],
    slTicks: "-36 tick",
    slLogic: "空头博弈位（信号K底）后方 5 tick",
    tpTicks: "+54 tick",
    tpLogic: "以损定盈 · 1.5 倍盈亏比",
    rr: "1.5 : 1",
  },
  {
    dir: "多",
    title: "回踩 FVG · 限价多头",
    entryKind: "限价",
    entryPrice: "21,388.00",
    limitReason: "挂在未回补 FVG 上沿，等待回踩确认",
    holdTime: "42 分 10 秒",
    exitTime: "13:58:40",
    exitLogic: "触及止盈目标全平",
    amount: "$21,388.00",
    status: "已止盈",
    pnl: "+$312.50",
    floating: false,
    dirPoints: [
      { text: "FVG 未回补", ok: true },
      { text: "上升结构成立", ok: true },
      { text: "回踩买盘吸收", ok: true },
      { text: "Delta 回正", ok: true },
    ],
    entryPoints: [
      { text: "价格未到位，改限价", ok: true },
      { text: "挂单在 FVG 上沿", ok: true },
      { text: "等待回踩成交", ok: true },
    ],
    slTicks: "-40 tick",
    slLogic: "FVG 下沿后方 4 tick",
    tpTicks: "+60 tick",
    tpLogic: "以损定盈 · 1.5 倍盈亏比",
    rr: "1.5 : 1",
  },
  {
    dir: "空",
    title: "未完成拍卖 · 市价空头",
    entryKind: "市价",
    entryPrice: "21,502.50",
    holdTime: "18 分 05 秒",
    exitTime: "11:20:12",
    exitLogic: "触及止损离场",
    amount: "$21,502.50",
    status: "已止损",
    pnl: "-$156.25",
    floating: false,
    dirPoints: [
      { text: "上方拍卖未完成", ok: true },
      { text: "卖盘吸收确认", ok: true },
      { text: "Delta 转负", ok: true },
      { text: "跌破微观结构", ok: false },
    ],
    entryPoints: [
      { text: "信号强度 3/4", ok: true },
      { text: "点差正常可市价", ok: true },
      { text: "结构确认偏弱", ok: false },
    ],
    slTicks: "-25 tick",
    slLogic: "多头博弈位（信号K顶）后方 5 tick",
    tpTicks: "+38 tick",
    tpLogic: "以损定盈 · 1.5 倍盈亏比",
    rr: "1.5 : 1",
  },
  {
    dir: "空",
    title: "Delta 翻转 · 市价空头",
    entryKind: "市价",
    entryPrice: "21,388.00",
    holdTime: "—",
    exitTime: "—",
    exitLogic: "意图被风控拒绝，未成交",
    amount: "—",
    status: "风控拒绝",
    pnl: null,
    floating: false,
    dirPoints: [
      { text: "Delta 翻转 -95", ok: true },
      { text: "连续失衡收窄", ok: true },
      { text: "结构未破位", ok: false },
    ],
    entryPoints: [
      { text: "拟市价空头入场", ok: true },
      { text: "当日回撤接近上限", ok: false },
      { text: "风控阻断新意图", ok: false },
    ],
    slTicks: "-30 tick",
    slLogic: "多头博弈位后方 5 tick",
    tpTicks: "+45 tick",
    tpLogic: "以损定盈 · 1.5 倍盈亏比",
    rr: "1.5 : 1",
  },
]

/* ─── 由模拟订单推导的数字（无数据一律「未提供」） ─────────────────── */

const NA = "未提供"
const SIM_INITIAL = 100000
const DAILY_LIMIT = 2000
const pnNum = (s: string | null): number | null => {
  if (!s) return null
  const n = Number(s.replace(/[+$,]/g, ""))
  return Number.isNaN(n) ? null : n
}
const fmtUsd = (n: number, sign = true) =>
  `${sign ? (n >= 0 ? "+" : "-") : n < 0 ? "-" : ""}$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function deriveSimStats() {
  const closed = ORDERS.filter((o) => !o.floating).map((o) => pnNum(o.pnl)).filter((n): n is number => n !== null)
  const floatPts = ORDERS.filter((o) => o.floating).map((o) => pnNum(o.pnl)).filter((n): n is number => n !== null)
  const realized = closed.reduce((a, b) => a + b, 0)
  const floating = floatPts.reduce((a, b) => a + b, 0)
  const wins = closed.filter((n) => n > 0), losses = closed.filter((n) => n < 0)
  const avgW = wins.length ? wins.reduce((a, b) => a + b, 0) / wins.length : null
  const avgL = losses.length ? Math.abs(losses.reduce((a, b) => a + b, 0) / losses.length) : null
  return {
    realized, floating, net: realized + floating,
    equity: SIM_INITIAL + realized + floating,
    dailyLoss: Math.abs(losses.reduce((a, b) => a + b, 0)),
    winRate: closed.length ? `${((wins.length / closed.length) * 100).toFixed(1)}%` : NA,
    pf: avgW !== null && avgL ? (avgW / avgL).toFixed(1) : NA,
    orders: ORDERS.filter((o) => o.status !== "风控拒绝" && o.status !== "已撤销").length,
    fills: ORDERS.filter((o) => o.pnl !== null).length,
  }
}
const SIM_STATS = deriveSimStats()

/* ─── Price constants (NQ, tick = 0.25) ───────────────────────────── */

const CURR_P = MOCK_NQ_QUOTE

// Controlled NQ overlay shares the quote domain and original position/tick intent.
const SIM_OVERLAY: FootprintOverlay = {
  entry: MOCK_NQ_POSITION_ENTRY,
  tp: MOCK_NQ_POSITION_ENTRY + 54 * MOCK_NQ_TICK_SIZE,
  sl: MOCK_NQ_POSITION_ENTRY - 36 * MOCK_NQ_TICK_SIZE,
  qty: 1,
  pnl: "+$87.50",
  pnlPos: true,
  tpTicks: "+54.00 T",
  slTicks: "-36.00 T",
}

/* ─── Performance cell ────────────────────────────────────────────── */

type EvKind = "confirmed" | "partial" | "unavailable"
const EV_META: Record<EvKind, { dot: string; text: string; label: string }> = {
  confirmed: { dot: "bg-emerald-400", text: "text-slate-500", label: "已确认" },
  partial: { dot: "bg-amber-400", text: "text-amber-300/80", label: "不完整" },
  unavailable: { dot: "bg-slate-600", text: "text-slate-600", label: "不可用" },
}

function PerfCell({ label, value, green, red, ev, tip }: {
  label: string; value: string; green?: boolean; red?: boolean; ev?: EvKind; tip?: ReactNode
}) {
  const m = ev ? EV_META[ev] : null
  return (
    <div>
      <div className="group relative flex items-center gap-1.5">
        <span className="text-[11px] text-slate-500">{label}</span>
        {m && (
          <span className={`flex items-center gap-1 text-[10px] ${m.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />{m.label}
          </span>
        )}
        {tip && (
          <div className="pointer-events-none absolute left-0 top-full z-50 hidden w-[300px] rounded-xl border border-white/[0.08] bg-[#0a0d14] p-3 shadow-[0_16px_42px_rgba(0,0,0,.46)] group-hover:block">
            {tip}
          </div>
        )}
      </div>
      <div className={`mt-1 text-[16px] font-semibold tabular-nums ${ev === "unavailable" ? "text-slate-600" : green ? "text-emerald-400" : red ? "text-rose-400" : "text-slate-100"}`}>
        {value}
      </div>
    </div>
  )
}

/* ─── Shared logic sub-cards ──────────────────────────────────────── */

function CardShell({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-[#0a0e16] p-3">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-wide text-slate-500">{title}</span>
        {right}
      </div>
      {children}
    </div>
  )
}

function LogicPoints({ points }: { points: LogicPt[] }) {
  return (
    <div className="space-y-1.5">
      {points.map((p) => (
        <div key={p.text} className="flex items-center gap-2 text-[11px]">
          {p.ok ? (
            <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="m20 6-11 11L4 12" /></svg>
            </span>
          ) : (
            <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/15 bg-white/[0.03]" />
          )}
          <span className={p.ok ? "text-slate-300" : "text-slate-600"}>{p.text}</span>
        </div>
      ))}
    </div>
  )
}

function DirectionCard({ dir, points }: { dir: "多" | "空"; points: LogicPt[] }) {
  const long = dir === "多"
  const allOk = points.every((p) => p.ok)
  const tone = !allOk ? "text-slate-400" : long ? "text-emerald-300" : "text-rose-300"
  const iconBg = !allOk ? "bg-white/[0.05] text-slate-400" : long ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
  return (
    <CardShell title="方向判断">
      <div className="mb-3 flex items-center gap-2.5">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {long ? <path d="M12 19V5M5 12l7-7 7 7" /> : <path d="M12 5v14M5 12l7 7 7-7" />}
          </svg>
        </span>
        <div className="text-[13px] font-semibold">
          <span className={tone}>{long ? "多头" : "空头"} · {allOk ? "已确认" : "条件未满足"}</span>
        </div>
      </div>
      <LogicPoints points={points} />
    </CardShell>
  )
}

function EntryCard({ kind, price, pnl, floating, limitReason, points }: {
  kind: "市价" | "限价"; price: string; pnl?: string | null; floating?: boolean; limitReason?: string; points: LogicPt[]
}) {
  const isMarket = kind === "市价"
  return (
    <CardShell title="入场逻辑">
      {/* 醒目决策 */}
      <div className="mb-3 flex items-center justify-between rounded-md bg-white/[0.03] px-3 py-2">
        <div className="flex items-center gap-2">
          <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${isMarket ? "bg-sky-500/15 text-sky-300" : "bg-amber-500/15 text-amber-300"}`}>
            {kind}
          </span>
          <span className="font-mono text-[14px] font-semibold text-slate-100">@ {price}</span>
        </div>
        {pnl && (
          <span className={`font-mono text-[13px] font-semibold ${floating ? "text-emerald-400" : pnl.startsWith("-") ? "text-rose-400" : "text-emerald-400"}`}>
            {pnl}
          </span>
        )}
      </div>
      {!isMarket && limitReason && (
        <div className="mb-2.5 rounded-md bg-amber-500/[0.06] px-2.5 py-1.5 text-[11px] text-amber-200/90 ring-1 ring-amber-500/15">
          限价位置 · {limitReason}
        </div>
      )}
      <LogicPoints points={points} />
    </CardShell>
  )
}

function TpSlCard({ slTicks, slLogic, tpTicks, tpLogic, rr }: {
  slTicks: string; slLogic: string; tpTicks: string; tpLogic: string; rr: string
}) {
  return (
    <CardShell title="止盈止损逻辑" right={<span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] text-sky-300">以损定盈</span>}>
      <div className="space-y-2">
        {/* 止损 - 先定 */}
        <div className="rounded-md bg-rose-500/[0.07] p-2.5 ring-1 ring-rose-500/15">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] text-rose-300">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />止损（先定）
            </span>
            <span className="font-mono text-[13px] font-semibold text-rose-300">{slTicks}</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{slLogic}</p>
        </div>
        {/* 止盈 - 由损推出 */}
        <div className="rounded-md bg-emerald-500/[0.07] p-2.5 ring-1 ring-emerald-500/15">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />止盈（{rr}）
            </span>
            <span className="font-mono text-[13px] font-semibold text-emerald-300">{tpTicks}</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{tpLogic}</p>
        </div>
      </div>
    </CardShell>
  )
}

/* ─── Strategy logic card (right panel — live position) ──────────── */

function StrategyLogicCard({ record, order, stopping }: { record: (typeof SIMS)[number] | undefined; order: SimOrder | undefined; stopping: boolean }) {
  const position = record?.position
  if (!order) return <section className="space-y-3 p-4" aria-label="策略与仓位读回">
    <h2 className="text-[14px] font-semibold text-slate-100">策略实时逻辑</h2>
    <p className="text-[12px] text-slate-300">仓位读回：{position?.text ?? "证据未提供，仓位未知"}</p>
    <p className="text-[12px] text-slate-500">{position?.state === "confirmed_empty" ? "本记录已确认空仓 fixture；不因此补造订单终态。" : "本记录持仓逻辑明细未提供；不推断空仓，不借用其他记录订单。"}</p>
    {record && <p className="text-[12px] text-slate-400">今日已亏损：{record.todayLoss.text}；当日剩余额度：{record.dailyLimitLeft.text}</p>}
  </section>
  const dailyLoss = SIM_STATS.dailyLoss
  const dailyLimit = DAILY_LIMIT
  const pct = dailyLoss / dailyLimit
  const live = order  // Position evidence is independent of the strategy stopping request.

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <h3 className="text-[14px] font-semibold text-slate-100">策略实时逻辑</h3>
      </div>

      <p className="text-[12px] text-slate-300">仓位读回：{position?.text ?? "未提供"}。{stopping ? "策略停止中；尚无新的平仓读回，已知持仓与保护单保留。" : "本地合成持仓，不是实际账户。"}</p>
      <>
          <DirectionCard dir={live.dir} points={live.dirPoints} />
          <EntryCard kind={live.entryKind} price={live.entryPrice} pnl={live.pnl} floating={live.floating} limitReason={live.limitReason} points={live.entryPoints} />
          <TpSlCard slTicks={live.slTicks} slLogic={live.slLogic} tpTicks={live.tpTicks} tpLogic={live.tpLogic} rr={live.rr} />
      </>

      {/* 风控状态 */}
      <div className="rounded-lg border border-white/[0.06] bg-[#0a0e16] p-3">
        <div className="mb-2 text-[11px] font-semibold tracking-wide text-slate-500">风控状态</div>
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-slate-400">今日已亏损</span>
          <span className="font-mono text-slate-200">${dailyLoss.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-slate-400">今日上限</span>
          <span className="font-mono text-slate-300">${dailyLimit.toFixed(2)}</span>
        </div>
        {/* Progress */}
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={`h-full rounded-full transition-all ${pct > 0.8 ? "bg-rose-500" : pct > 0.5 ? "bg-amber-400" : "bg-emerald-400"}`}
            style={{ width: `${Math.max(pct * 100, 2)}%` }}
          />
        </div>
        <div className="mt-2 text-[11px] text-slate-500">
          还可亏损 <span className="text-slate-300">${(dailyLimit - dailyLoss).toFixed(2)}</span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-emerald-300">风控允许继续下单 · 今日成交 {SIM_STATS.fills} 次</span>
        </div>
      </div>
    </div>
  )
}

/* ─── Order detail panel ──────────────────────────────────────────── */

const ORDER_STATUS_CLS: Record<SimOrder["status"], string> = {
  "持仓中": "text-emerald-400",
  "已止盈": "text-emerald-400",
  "已止损": "text-rose-400",
  "已撤销": "text-slate-500",
  "风控拒绝": "text-rose-400",
}

function InfoRow({ label, value, cls }: { label: string; value: string; cls?: string }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-slate-500">{label}</span>
      <span className={`font-mono ${cls ?? "text-slate-300"}`}>{value}</span>
    </div>
  )
}

/* ─── Run-health toolbar (top-right) ──────────────────────────────── */

function TBtn({ children, tone = "default", onClick }: { children: ReactNode; tone?: "default" | "amber" | "rose"; onClick?: () => void }) {
  const cls = tone === "amber"
    ? "border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20"
    : tone === "rose"
    ? "border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
    : "border-white/[0.08] bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]"
  return (
    <button onClick={onClick} className={`whitespace-nowrap rounded-md border px-3 py-1.5 text-[12px] font-medium ${cls}`}>
      {children}
    </button>
  )
}

/* 运行监控浮窗（Task 2）：数据面 / 数据状态 / 策略执行 / 本机资源 四分区。
   不显示当前持仓与操作（页面其他位置已有）。 */
function MonZone({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-t border-white/[0.06] pt-2.5 first:border-t-0 first:pt-0">
      <div className="mb-1.5 text-[11px] font-semibold text-slate-300">{title}</div>
      {children}
    </div>
  )
}
function MonRow({ k, v, tone }: { k: string; v: ReactNode; tone?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-[3px] text-[11px]">
      <span className="shrink-0 text-slate-500">{k}</span>
      <span className={`min-w-0 truncate text-right ${tone ?? "text-slate-300"}`}>{v}</span>
    </div>
  )
}

/* 休市判断：按交易时段（如 "RTH 09:30–16:00 ET"）与最新 tick 时刻推导，休市不是故障 */
function marketState(session: string): { closed: boolean; open: string; close: string } {
  const m = session.match(/(\d{2}:\d{2})[–-](\d{2}:\d{2})/)
  if (!m) return { closed: false, open: NA, close: NA }
  const min = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5))
  const now = min(MACHINE.lastTick.slice(0, 5)), o = min(m[1]), c = min(m[2])
  const inside = o <= c ? now >= o && now < c : now >= o || now < c
  return { closed: !inside, open: m[1], close: m[2] }
}

/** 最近一根已收盘 bar：5 分钟向下取整（休市时取收盘时刻） */
function lastClosedBar(mk: ReturnType<typeof marketState>) {
  if (mk.closed) return mk.close === NA ? NA : mk.close
  const t = Number(MACHINE.lastTick.slice(0, 2)) * 60 + Number(MACHINE.lastTick.slice(3, 5))
  const f = t - (t % 5)
  return `${String(Math.floor(f / 60)).padStart(2, "0")}:${String(f % 60).padStart(2, "0")}`
}

type RunPhase = "running" | "delayed" | "recovering" | "closed"
const PHASE_STEPS: { k: RunPhase; label: string }[] = [
  { k: "delayed", label: "数据延迟" }, { k: "recovering", label: "恢复中" }, { k: "running", label: "运行中" },
]

const PHASE_LABEL: Record<RunPhase, string> = { running: "运行中", delayed: "行情延迟", recovering: "恢复中", closed: "休市等待" }
const PHASE_CHIP: Record<RunPhase, { chip: string; dot: string }> = {
  running: { chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300", dot: "animate-pulse bg-emerald-400" },
  delayed: { chip: "border-amber-500/30 bg-amber-500/10 text-amber-200", dot: "bg-amber-400" },
  recovering: { chip: "border-sky-500/30 bg-sky-500/10 text-sky-300", dot: "bg-sky-400" },
  closed: { chip: "border-white/[0.1] bg-white/[0.04] text-slate-300", dot: "bg-slate-500" },
}
/** 共享演示口径：品种宇宙里标注为休市/延迟/恢复的模拟，工作台状态芯片与浮窗随之 */
function forcedPhase(simId: string | undefined): RunPhase | undefined {
  const st = simById(simId)?.state
  return st === "closed" || st === "delayed" || st === "recovering" ? st : undefined
}
function computePhase(session: string, fp: string, forced?: RunPhase): RunPhase {
  if (forced) return forced
  return marketState(session).closed ? "closed" : fp === "backfill" || fp === "rebuilding" ? "recovering" : MACHINE.latencySec > 15 ? "delayed" : "running"
}
const PHASE_REASON: Record<RunPhase, string> = {
  running: "行情与求值正常",
  delayed: `行情延迟 ${MACHINE.latencySec}s，仍在接收，无需处理`,
  recovering: "断线缺口回补中，完成后自动恢复",
  closed: "非交易时段，属正常等待，开盘后自动继续",
}

/* 回看态状态浮窗：原因 + 时间 */
function ReplayStatusPopover({ id, label, tone, reason }: { id: string; label: string; tone: string; reason: string }) {
  return (
    <div id={id} role="dialog" aria-label="运行状态"
      className="fixed inset-x-4 top-16 z-50 max-h-[76vh] overflow-y-auto rounded-xl border border-white/[0.1] bg-[#0a0d14] p-3.5 shadow-2xl sm:absolute sm:inset-x-auto sm:left-0 sm:top-full sm:mt-2 sm:w-[360px]">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[12px] font-semibold text-slate-200">运行状态</span>
        <span className={`whitespace-nowrap rounded px-2 py-0.5 text-[11px] ${tone}`}>{label}</span>
      </div>
      <MonRow k="原因" v={<span className="whitespace-normal">{reason}</span>} />
      <MonRow k="运行区间" v={<span className="font-mono">2024-03-12 14:00 → 18:30 UTC</span>} />
    </div>
  )
}

function HealthPopover({ id, statusLabel, statusTone, isLive, session, forced }: { id: string; statusLabel: string; statusTone: string; isLive: boolean; session: string; forced?: RunPhase }) {
  const pressure = usePressure()
  const pm = PRESSURE_META[pressure]
  const fp = useFootprint()
  const fpm = FP_META[fp]
  const e = MACHINE.exec
  const lateWarn = MACHINE.latencySec > 15
  const phase: RunPhase = computePhase(session, fp, forced)
  const mk0 = marketState(session)
  const mk = { ...mk0, closed: mk0.closed || phase === "closed" }
  const today = DAY_DATA["2026-09-04"]
  const saveText = today.base === "已生成" ? `已保存${today.version ? ` · ${today.version}` : ""}` : "运行中 · 日终收尾后保存"

  return (
    <div id={id} role="dialog" aria-label="运行监控"
      className="fixed inset-x-4 top-16 z-50 max-h-[76vh] overflow-y-auto rounded-xl border border-white/[0.1] bg-[#0a0d14] p-3.5 shadow-2xl sm:absolute sm:inset-x-auto sm:left-0 sm:top-full sm:mt-2 sm:w-[420px]">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[12px] font-semibold text-slate-200">运行监控</span>
        <span className={`whitespace-nowrap rounded px-2 py-0.5 text-[11px] ${statusTone}`}>{statusLabel}</span>
      </div>
      {isLive && (
        <div className="mb-2.5 rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[11px]">
          <MonRow k="原因" v={<span className="whitespace-normal">{PHASE_REASON[phase]}</span>} />
          <MonRow k="时间" v={<span className="font-mono">最新 tick {MACHINE.lastTick} · 已运行 {MACHINE.uptime}</span>} />
        </div>
      )}

      <div className="space-y-2.5">
        {/* 分项状态：行情连接 / 闭 bar 求值 / 策略信号 / 保存状态 */}
        <MonZone title="分项状态">
          <MonRow k="行情连接"
            tone={phase === "delayed" ? "text-amber-300" : phase === "recovering" ? "text-sky-300" : phase === "closed" ? "text-slate-400" : "text-emerald-300"}
            v={phase === "closed" ? `休市等待 · 下次开盘 ${mk.open} ET`
              : phase === "delayed" ? `数据延迟 ${MACHINE.latencySec}s`
              : phase === "recovering" ? (fp === "rebuilding" ? "恢复中 · 重建 52 / 78" : "恢复中 · 缺口回补 41 / 78")
              : `已连接 · 最新 tick ${MACHINE.lastTick}`} />
          <MonRow k="闭 bar 求值" v={<span className="font-mono">{lastClosedBar(mk)} {lastClosedBar(mk) === NA ? "" : mk.closed ? "收盘 · 已求值" : "已收盘 · 已求值"}</span>} />
          <MonRow k="策略信号" tone={e.signalDay > 0 ? "text-slate-300" : "text-slate-500"}
            v={e.signalDay > 0 ? <span className="font-mono">{ORDER_CMP[0].eventTime} · {ORDERS[0].dir}</span> : NA} />
          <MonRow k="保存状态" v={saveText} tone={today.base === "已生成" ? "text-emerald-300" : "text-slate-400"} />
          {phase !== "closed" && (
            <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-600">
              {PHASE_STEPS.map((s, i) => (
                <span key={s.k} className="flex items-center gap-1">
                  {i > 0 && <span>→</span>}
                  <span className={s.k === phase ? "text-slate-200" : ""}>{s.label}</span>
                </span>
              ))}
              <span className="ml-auto">同一次运行</span>
            </div>
          )}
        </MonZone>

        {/* 分区 1 · 数据状态（与详情页同源） */}
        <MonZone title="数据状态 · 与详情页同步">
          <div className="flex items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[11px]">
            {fpm.spin
              ? <svg className="h-3.5 w-3.5 shrink-0 animate-spin text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.2-8.5" /></svg>
              : <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${fpm.dot}`} />}
            <span className={fpm.text}>{fpm.label}</span>
            {fp === "normal" && <span className="ml-auto text-slate-500">正常渲染</span>}
            {(fp === "rebuilding" || fp === "backfill") && <span className="ml-auto font-mono text-slate-500">bar 52 / 78</span>}
          </div>
          <MonRow k="断线缺口回补" v={fp === "backfill" ? "回补中 41 / 78" : "无缺口"} tone={fp === "backfill" ? "text-sky-300" : "text-slate-400"} />
        </MonZone>

        {/* 分区 2 · 数据面 */}
        <MonZone title="数据面 · 用的什么数据">
          <MonRow k="当前数据源" tone={isLive ? "text-emerald-300" : "text-sky-300"}
            v={<span className="inline-flex items-center gap-1"><span className={`h-1.5 w-1.5 rounded-full ${isLive ? "bg-emerald-400" : "bg-sky-400"}`} />{isLive ? `实时 · ${MACHINE.realtime.feed}` : "共享历史重建"}</span>} />
          <MonRow k="消费段" v={<span className="font-mono">{MACHINE.segment}</span>} />
          <MonRow k="最新 tick" v={<span className="font-mono">{MACHINE.lastTick}</span>} />
          <MonRow k="行情延迟" tone={lateWarn ? "text-amber-300" : "text-slate-300"}
            v={<span className="inline-flex items-center gap-1 font-mono">{lateWarn && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}{MACHINE.latencySec}s</span>} />
        </MonZone>

        {/* 分区 3 · 策略执行 */}
        <MonZone title="策略执行 · 跑得怎样">
          <MonRow k="信号 / 订单 / 成交（近 1 分钟）" v={<span className="font-mono">{e.signal1m} / {e.order1m} / {e.fill1m}</span>} />
          <MonRow k="信号 / 订单 / 成交（今日）" v={<span className="font-mono">{e.signalDay} / {e.orderDay} / {e.fillDay}</span>} />
          <MonRow k="最近事件" v={<span className="font-mono">{e.lastEvent}</span>} />
          <MonRow k="错误 / 拒绝" tone={e.errors > 0 ? "text-rose-300" : e.rejects > 0 ? "text-amber-300" : "text-emerald-300"}
            v={e.errors === 0 && e.rejects === 0 ? "无异常" : <span className="font-mono">{e.errors} / {e.rejects}</span>} />
          {(e.errors > 0 || e.rejects > 0) && <div className="mt-0.5 text-[10px] text-slate-500">最近：{e.lastReject}</div>}
        </MonZone>

        {/* 分区 4 · 本机资源 */}
        <MonZone title="本机资源 · 能否长期健康跑">
          <MonRow k="项目占用 / 额度" v={<span className="font-mono">{MACHINE.disk.used} / {MACHINE.disk.quota}</span>} />
          <MonRow k="磁盘压力" tone={pm.text}
            v={<span className="inline-flex items-center gap-1"><span className={`h-1.5 w-1.5 rounded-full ${pm.dot}`} />{pressure === "normal" ? "正常" : `${pm.label} · ${pm.action}`}</span>} />
          <MonRow k="系统盘兜底" v={<span className="font-mono">{MACHINE.disk.sysDisk}</span>} />
          <MonRow k="下次清理窗口" v={<span className="font-mono">{MACHINE.nextCleanWindow}</span>} />
          <MonRow k="CPU / 内存" v={<span className="font-mono">{MACHINE.cpu} / {MACHINE.mem}</span>} tone="text-slate-400" />
        </MonZone>

      </div>
    </div>
  )
}

/* ─── 回测对照 (replay compare tab) ───────────────────────────────── */

const ATTR_CLS: Record<string, string> = {
  撮合模型: "border-sky-400/50 text-sky-300",
  费用口径: "border-violet-400/50 text-violet-300",
}
function AttrPill({ name }: { name: string }) {
  return <span className={`rounded border px-1.5 py-[1px] text-[10px] ${ATTR_CLS[name] ?? "border-slate-500/40 text-slate-400"}`}>{name}</span>
}

interface CmpField { name: string; sim: string; bt: string; diff?: "amber" | "violet"; ok?: boolean }

const CMP_017_FIELDS: CmpField[] = [
  { name: "信号时间", sim: "15:42:08.412", bt: "15:42:08.412" },
  { name: "订单意图", sim: "买入开仓 2 手", bt: "买入开仓 2 手", ok: true },
  { name: "限价", sim: "18245.50", bt: "18245.50" },
  { name: "成交均价", sim: "18245.50", bt: "18245.75", diff: "amber" },
  { name: "单边费用", sim: "$40.00", bt: "$0.05", diff: "violet" },
  { name: "保护单", sim: "OCO 止损 18240.00 / 止盈 18255.00", bt: "同左", ok: true },
  { name: "离场原因", sim: "止损触发 16:05:22", bt: "止损触发 16:05:22", ok: true },
]
/* ─── 单一 run / 交易日 / 报告 fixture（驱动所有相关数字） ─────────── */

type ReportStatus = "已生成" | "等待收尾" | "无报告" | "排队中" | "生成中" | "生成失败"

interface OvRow { k: string; sim: string; bt: string; simCls?: string; btCls?: string; diff?: boolean }
interface Metric { k: string; v: string; cls?: string }

interface DayData {
  day: string
  base: ReportStatus            // 初始报告状态（可被重跑状态机覆盖）
  version: string | null        // 已生成报告版本
  netLabel: string              // 当日净盈亏（展示口径）
  counted: boolean              // 是否计入累计口径
  diffCount: number
  metrics: Metric[] | null      // 六项指标；null = 无报告不展示
  cmp: OvRow[] | null           // 模拟 vs 回测；null = 无对照
}

// 会话账户口径（真实余额含缺报日；报告口径仅计已生成日）
const ACCOUNT = {
  initial: "$100,000.00",
  realEquity: "$99,950.00",     // 100000 +100 −200 +50
  reportedCum: "+$150.00",      // 仅计已生成日 09-01 +100 / 09-03 +50
  missingImpact: "-$200.00",    // 09-02 缺报，未计入报告口径
}

// 侧栏绩效 —— 与报告口径 / 账户口径保持一致（UI-02）
// live：当日运行进行中（浮动）；replay：报告口径累计（已生成日）
interface PerfItem { label: string; value: string; green?: boolean; red?: boolean }
interface AcctRow { label: string; value: string; mono?: boolean; bright?: boolean; green?: boolean; red?: boolean }
interface PerfSet { perf: PerfItem[]; curveNote: string; curvePnl: string; account: AcctRow[] }
const PERF: { live: PerfSet; replay: PerfSet } = {
  live: {
    perf: [
      { label: "模拟净利润（含浮动）", value: fmtUsd(SIM_STATS.net), green: SIM_STATS.net >= 0, red: SIM_STATS.net < 0 },
      { label: "胜率", value: SIM_STATS.winRate },
      { label: "夏普", value: "不可计算" },
      { label: "最大回撤", value: NA },
      { label: "订单数量", value: String(SIM_STATS.orders) },
      { label: "盈亏比", value: SIM_STATS.pf },
    ],
    curveNote: "当日进行中 · 浮动未结算",
    curvePnl: `${fmtUsd(SIM_STATS.floating)} · 浮动`,
    account: [
      { label: "初始资金（模拟）", value: fmtUsd(SIM_INITIAL, false), mono: true },
      { label: "模拟权益（含浮动）", value: fmtUsd(SIM_STATS.equity, false), mono: true, bright: true },
      { label: "模拟盈亏 · 已实现", value: fmtUsd(SIM_STATS.realized), mono: true, green: SIM_STATS.realized > 0, red: SIM_STATS.realized < 0 },
      { label: "模拟盈亏 · 浮动", value: fmtUsd(SIM_STATS.floating), mono: true, green: SIM_STATS.floating > 0, red: SIM_STATS.floating < 0 },
      { label: "模拟费用", value: NA, mono: false },
      { label: "今日成交", value: `${SIM_STATS.fills} 次`, mono: false },
    ],
  },
  replay: {
    perf: [
      { label: "净利润", value: "+$150.00", green: true },
      { label: "胜率", value: "66.7%" },
      { label: "夏普", value: "1.8" },
      { label: "最大回撤", value: "-$210.00", red: true },
      { label: "订单数量", value: "3" },
      { label: "盈亏比", value: "2.1" },
    ],
    curveNote: "已生成日 09-01 / 09-03 · 缺 09-02",
    curvePnl: "+$150.00 · 报告口径",
    account: [
      { label: "初始资金（模拟）", value: "$100,000.00", mono: true },
      { label: "模拟权益（账户余额）", value: "$99,950.00", mono: true, bright: true },
      { label: "模拟盈亏 · 报告口径累计", value: "+$150.00", mono: true, green: true },
      { label: "缺报日影响（09-02）", value: "-$200.00", mono: true, red: true },
      { label: "模拟费用", value: NA, mono: false },
      { label: "已生成交易日", value: "2 / 3", mono: false },
    ],
  },
}

const DAY_DATA: Record<string, DayData> = {
  "2026-09-04": {
    day: "2026-09-04", base: "等待收尾", version: null, netLabel: "进行中", counted: false, diffCount: 0,
    metrics: null, cmp: null,
  },
  "2026-09-03": {
    day: "2026-09-03", base: "已生成", version: "v2", netLabel: "+$50", counted: true, diffCount: 1,
    metrics: [
      { k: "净盈亏", v: "+$50", cls: "text-emerald-400" }, { k: "胜率", v: "50.0%" }, { k: "夏普", v: "不可计算" },
      { k: "日终最大回撤", v: "-$180", cls: "text-rose-400" }, { k: "订单数量", v: "2" }, { k: "盈亏比", v: "1.6" },
    ],
    cmp: [
      { k: "净盈亏", sim: "+$50", bt: "+$70", simCls: "text-emerald-400", btCls: "text-emerald-400", diff: true },
      { k: "胜率", sim: "50.0%", bt: "50.0%" },
      { k: "夏普", sim: "不可计算", bt: "不可计算" },
      { k: "日终最大回撤", sim: "-$180", bt: "-$150", simCls: "text-rose-400", btCls: "text-rose-400", diff: true },
      { k: "订单数量", sim: "2", bt: "2" },
      { k: "盈亏比", sim: "1.6", bt: "1.9", diff: true },
    ],
  },
  "2026-09-02": {
    // 初始缺报；手动重跑成功后展示以下已生成内容（净 −$200）
    day: "2026-09-02", base: "无报告", version: "v1", netLabel: "-$200", counted: false, diffCount: 0,
    metrics: [
      { k: "净盈亏", v: "-$200", cls: "text-rose-400" }, { k: "胜率", v: "33.3%" }, { k: "夏普", v: "不可计算" },
      { k: "日终最大回撤", v: "-$260", cls: "text-rose-400" }, { k: "订单数量", v: "3" }, { k: "盈亏比", v: "0.7" },
    ],
    cmp: [
      { k: "净盈亏", sim: "-$200", bt: "-$200", simCls: "text-rose-400", btCls: "text-rose-400" },
      { k: "胜率", sim: "33.3%", bt: "33.3%" },
      { k: "夏普", sim: "不可计算", bt: "不可计算" },
      { k: "日终最大回撤", sim: "-$260", bt: "-$260", simCls: "text-rose-400", btCls: "text-rose-400" },
      { k: "订单数量", sim: "3", bt: "3" },
      { k: "盈亏比", sim: "0.7", bt: "0.7" },
    ],
  },
  "2026-09-01": {
    day: "2026-09-01", base: "已生成", version: "v1", netLabel: "+$100", counted: true, diffCount: 0,
    metrics: [
      { k: "净盈亏", v: "+$100", cls: "text-emerald-400" }, { k: "胜率", v: "66.7%" }, { k: "夏普", v: "不可计算" },
      { k: "日终最大回撤", v: "-$90", cls: "text-rose-400" }, { k: "订单数量", v: "3" }, { k: "盈亏比", v: "2.1" },
    ],
    cmp: [
      { k: "净盈亏", sim: "+$100", bt: "+$100", simCls: "text-emerald-400", btCls: "text-emerald-400" },
      { k: "胜率", sim: "66.7%", bt: "66.7%" },
      { k: "夏普", sim: "不可计算", bt: "不可计算" },
      { k: "日终最大回撤", sim: "-$90", bt: "-$90", simCls: "text-rose-400", btCls: "text-rose-400" },
      { k: "订单数量", sim: "3", bt: "3" },
      { k: "盈亏比", sim: "2.1", bt: "2.1" },
    ],
  },
}

// 「全部」聚合：仅计入已生成日（09-01 + 09-03）；缺 09-02 不计入
const ALL_DATA: DayData = {
  day: "全部", base: "已生成", version: "汇总", netLabel: "+$150", counted: true, diffCount: 1,
  metrics: [
    { k: "净盈亏（报告口径）", v: "+$150", cls: "text-emerald-400" }, { k: "胜率", v: "60.0%" }, { k: "夏普", v: "1.8" },
    { k: "日终最大回撤", v: "-$180", cls: "text-rose-400" }, { k: "订单数量", v: "5" }, { k: "盈亏比", v: "1.9" },
  ],
  cmp: [
    { k: "净盈亏", sim: "+$150", bt: "+$170", simCls: "text-emerald-400", btCls: "text-emerald-400", diff: true },
    { k: "胜率", sim: "60.0%", bt: "60.0%" },
    { k: "夏普", sim: "1.8", bt: "2.0", diff: true },
    { k: "日终最大回撤", sim: "-$180", bt: "-$150", simCls: "text-rose-400", btCls: "text-rose-400", diff: true },
    { k: "订单数量", sim: "5", bt: "5" },
    { k: "盈亏比", sim: "1.9", bt: "2.2", diff: true },
  ],
}

const REPORT_STATUS_META: Record<ReportStatus, { label: string; cls: string; dot: string }> = {
  "已生成": { label: "报告已生成", cls: "border-emerald-400/30 text-emerald-300", dot: "bg-emerald-400" },
  "等待收尾": { label: "等待日终收尾", cls: "border-sky-400/30 text-sky-300", dot: "bg-sky-400" },
  "无报告": { label: "报告缺失 · 待补", cls: "border-amber-400/30 text-amber-300", dot: "bg-amber-400" },
  "排队中": { label: "已排队 · 等待生成", cls: "border-sky-400/30 text-sky-300", dot: "bg-sky-400" },
  "生成中": { label: "生成中…", cls: "border-sky-400/30 text-sky-300", dot: "bg-sky-400" },
  "生成失败": { label: "生成失败 · 保留旧报告", cls: "border-rose-400/30 text-rose-300", dot: "bg-rose-400" },
}

// 权益曲线对照（同一时间轴，累计净值 $）
const CURVE_PTS: Record<string, { t: string; sim: number; bt: number }[]> = {
  all: [
    { t: "09-01", sim: 0, bt: 0 }, { t: "", sim: 60, bt: 55 }, { t: "", sim: 30, bt: 35 }, { t: "", sim: 100, bt: 100 },
    { t: "09-03", sim: 100, bt: 100 }, { t: "", sim: 20, bt: 40 }, { t: "", sim: -80, bt: -50 }, { t: "", sim: 90, bt: 120 }, { t: "09-03 收", sim: 150, bt: 170 },
  ],
  "2026-09-03": [
    { t: "22:00", sim: 0, bt: 0 }, { t: "", sim: -60, bt: -40 }, { t: "", sim: -180, bt: -150 }, { t: "", sim: -90, bt: -70 }, { t: "", sim: 10, bt: 30 }, { t: "21:59", sim: 50, bt: 70 },
  ],
  "2026-09-02": [
    { t: "22:00", sim: 0, bt: 0 }, { t: "", sim: 40, bt: 40 }, { t: "", sim: -120, bt: -120 }, { t: "", sim: -260, bt: -260 }, { t: "", sim: -150, bt: -150 }, { t: "21:59", sim: -200, bt: -200 },
  ],
  "2026-09-01": [
    { t: "22:00", sim: 0, bt: 0 }, { t: "", sim: 50, bt: 50 }, { t: "", sim: -40, bt: -40 }, { t: "", sim: 30, bt: 30 }, { t: "", sim: 80, bt: 80 }, { t: "21:59", sim: 100, bt: 100 },
  ],
}

function CmpEquityChart({ pts }: { pts: { t: string; sim: number; bt: number }[] }) {
  const W = 560, H = 150, L = 40, R = 8, T = 10, B = 20
  const vals = pts.flatMap((p) => [p.sim, p.bt])
  const lo = Math.min(0, ...vals), hi = Math.max(0, ...vals)
  const pad = (hi - lo) * 0.1 || 10
  const y = (v: number) => T + (H - T - B) * (1 - (v - lo + pad) / (hi - lo + 2 * pad))
  const x = (i: number) => L + ((W - L - R) * i) / (pts.length - 1)
  const path = (k: "sim" | "bt") => pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p[k]).toFixed(1)}`).join(" ")
  const ticks = [lo, 0, hi].filter((v, i, a) => a.indexOf(v) === i)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[150px] w-full">
      <defs>
        <linearGradient id="cmpSimFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.18" /><stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,0.06)" strokeDasharray={v === 0 ? "0" : "3 4"} />
          <text x={L - 6} y={y(v) + 3} textAnchor="end" className="fill-slate-600 font-mono text-[9px]">{v > 0 ? `+${v}` : v}</text>
        </g>
      ))}
      {pts.map((p, i) => p.t && (
        <g key={i}>
          <line x1={x(i)} x2={x(i)} y1={T} y2={H - B} stroke="rgba(255,255,255,0.04)" />
          <text x={x(i)} y={H - 6} textAnchor={i === 0 ? "start" : i === pts.length - 1 ? "end" : "middle"} className="fill-slate-600 font-mono text-[9px]">{p.t}</text>
        </g>
      ))}
      <path d={`${path("sim")} L${x(pts.length - 1)},${y(lo - pad)} L${x(0)},${y(lo - pad)} Z`} fill="url(#cmpSimFill)" />
      <path d={path("bt")} fill="none" stroke="#7dd3fc" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.85" />
      <path d={path("sim")} fill="none" stroke="#34d399" strokeWidth="1.8" />
      <circle cx={x(pts.length - 1)} cy={y(pts[pts.length - 1].sim)} r="3" fill="#34d399" />
      <circle cx={x(pts.length - 1)} cy={y(pts[pts.length - 1].bt)} r="3" fill="#7dd3fc" />
    </svg>
  )
}

// 统一六项指标：净利润/最大回撤 · 胜率/订单数量 · 夏普/盈亏比，每项「模拟 | 回测」双值
const SIX_ORDER: { k: string; label: string }[] = [
  { k: "净盈亏", label: "净利润" }, { k: "胜率", label: "胜率" }, { k: "夏普", label: "夏普" },
  { k: "日终最大回撤", label: "最大回撤" }, { k: "订单数量", label: "订单数量" }, { k: "盈亏比", label: "盈亏比" },
]

function DualMetric({ label, row }: { label: string; row: OvRow }) {
  return (
    <div className="rounded-lg border border-white/[0.05] bg-white/[0.015] px-3 py-2.5">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="mt-1.5 flex items-end gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-[9px] text-slate-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />模拟</div>
          <div className="mt-0.5 truncate font-mono text-[15px] font-semibold tabular-nums text-emerald-400">{row.sim}</div>
        </div>
        <div className="mb-1 h-6 w-px bg-white/[0.06]" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-[9px] text-slate-600"><span className="h-1.5 w-1.5 rounded-full bg-sky-300" />回测</div>
          <div className="mt-0.5 truncate font-mono text-[15px] font-semibold tabular-nums text-sky-300">{row.bt}</div>
        </div>
      </div>
    </div>
  )
}

function OverviewCmpTable({ data }: { data: DayData }) {
  if (!data.cmp) return null
  const byK = Object.fromEntries(data.cmp.map((r) => [r.k, r]))
  const pts = CURVE_PTS[data.day === "全部" ? "all" : data.day] ?? CURVE_PTS.all
  const last = pts[pts.length - 1]
  return (
    <>
      <div className="rounded-xl border border-white/[0.06] bg-[#0a0e16] p-4">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-slate-100">模拟 vs 回测 · 六项指标</span>
          <span className={`text-[11px] ${data.diffCount > 0 ? "text-amber-300" : "text-emerald-300"}`}>
            {data.cmp.filter((r) => r.diff).length > 0 ? `${data.cmp.filter((r) => r.diff).length} 项指标存在执行层差异` : "全部一致"}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {SIX_ORDER.map((m) => byK[m.k] && <DualMetric key={m.k} label={m.label} row={byK[m.k]} />)}
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-[#0a0e16] p-4">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-slate-100">权益曲线对照</span>
          <div className="flex items-center gap-3 text-[10px] text-slate-500">
            <span className="flex items-center gap-1.5"><span className="h-[2px] w-4 rounded bg-emerald-400" />模拟 <span className="font-mono text-emerald-400">{last.sim >= 0 ? "+" : ""}${last.sim}</span></span>
            <span className="flex items-center gap-1.5"><span className="h-0 w-4 border-t border-dashed border-sky-300" />回测 <span className="font-mono text-sky-300">{last.bt >= 0 ? "+" : ""}${last.bt}</span></span>
            {last.sim !== last.bt && <span className="rounded bg-amber-500/10 px-1.5 py-0.5 font-mono text-amber-300">Δ {last.sim - last.bt}</span>}
          </div>
        </div>
        <div className="mt-2"><CmpEquityChart pts={pts} /></div>
        <div className="mt-1 text-[10px] text-slate-500">同一时间轴 · 意图层一致，差异来自撮合模型与费用口径。</div>
      </div>
    </>
  )
}

function OverviewPanel({ header, data, status }: { header?: ReactNode; data: DayData; status: ReportStatus }) {
  // 无已生成报告的状态：不展示成功指标 / 结论
  const showReport = status === "已生成" || status === "生成失败"
  return (
    <div className="space-y-4 overflow-y-auto px-5 py-4">
      {header}

      {!showReport ? (
        <div className="rounded-xl border border-white/[0.08] bg-[#0a0e16] p-5 text-center">
          <div className={`mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full border ${REPORT_STATUS_META[status].cls}`}>
            <span className={`h-2 w-2 rounded-full ${REPORT_STATUS_META[status].dot} ${status === "生成中" || status === "排队中" ? "animate-pulse" : ""}`} />
          </div>
          <div className="text-[13px] font-semibold text-slate-200">{REPORT_STATUS_META[status].label}</div>
          <p className="mx-auto mt-1.5 max-w-[360px] text-[11px] leading-relaxed text-slate-500">
            {status === "等待收尾" ? "今日尚未收尾；收尾与数据封存完成后进入每日报告队列，届时生成指标与对照——现在不展示已生成结论。"
              : status === "无报告" ? "该交易日报告缺失，未计入累计口径；下方可手动重跑以补齐报告。"
              : status === "排队中" ? "重跑任务已进入串行队列，等待前序任务完成后开始生成。"
              : "正在读取已封存的运行时事件并重新计算指标与对照，请稍候。"}
          </p>
        </div>
      ) : (
        <>
          {status === "生成失败" && (
            <div className="rounded-lg border border-rose-400/25 bg-rose-500/[0.06] px-3.5 py-2.5 text-[11px] text-rose-200">
              本次重跑生成失败，已保留上一版报告（{data.version}）继续可读；可再次重跑。
            </div>
          )}
          <OverviewCmpTable data={data} />

          <div className="rounded-xl border border-white/[0.06] bg-[#0a0e16] p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-slate-100">回测改进清单</span>
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-300">{data.diffCount > 0 ? "3 项建议" : "暂无建议"}</span>
            </div>
            {data.diffCount > 0 ? (
              <div className="mt-3 space-y-2 text-[12px] text-slate-300">
                <div className="flex gap-2"><span className="text-amber-400">①</span>统一模拟与回测费用口径（当前约 $40/边 vs $0.05/边）</div>
                <div className="flex gap-2"><span className="text-amber-400">②</span>V2 桥 cum_delta 改按会话交易日（22:00Z）重置</div>
                <div className="flex gap-2"><span className="text-amber-400">③</span>模拟侧撮合改用 bar OHLC 判定，减少 tick 级偏差</div>
              </div>
            ) : (
              <p className="mt-2 text-[12px] text-slate-500">该范围内模拟侧与回测侧执行层一致，无改进项。</p>
            )}
          </div>

          <div className="space-y-3 rounded-xl border border-white/[0.05] bg-white/[0.01] p-3.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">辅助信息</div>
            <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-[11px]">
              {[
                { k: "行情事件", v: "12,847" }, { k: "重复 / 乱序", v: "0 / 3" }, { k: "缺口", v: "1 处", amber: true },
                { k: "写入失败", v: "0" }, { k: "P95 延迟", v: "180ms" }, { k: "报告版本", v: data.version ?? "—" },
              ].map((m) => (
                <div key={m.k}>
                  <div className="text-slate-600">{m.k}</div>
                  <div className={`mt-0.5 font-mono text-[12px] ${m.amber ? "text-amber-300" : "text-slate-400"}`}>{m.v}</div>
                </div>
              ))}
            </div>
            <p className="border-t border-white/[0.05] pt-2 text-[10px] leading-relaxed text-slate-600">
              夏普按会话交易日收益年化；单一交易日样本 &lt; 2 日记为「不可计算」。判等仅在可比区间内进行，输入边界差异不计入策略失配。
            </p>
          </div>
        </>
      )}
    </div>
  )
}

/* ─── 统一订单列表：对照状态 + 逐单合并详情 ───────────────────────── */

type CmpStatus = "有差异" | "一致" | "尚未对照" | "回测独有"

const CMP_STATUS_META: Record<CmpStatus, { cls: string; dot: string }> = {
  "有差异": { cls: "border-amber-400/45 text-amber-300", dot: "bg-amber-400" },
  "一致": { cls: "border-emerald-400/40 text-emerald-300", dot: "bg-emerald-400" },
  "尚未对照": { cls: "border-slate-500/40 text-slate-400", dot: "bg-slate-500" },
  "回测独有": { cls: "border-sky-400/45 text-sky-300", dot: "bg-sky-400" },
}

function CmpStatusTag({ status, attrs, label }: { status: CmpStatus; attrs?: string[]; label?: string }) {
  const m = CMP_STATUS_META[status]
  const causes = status === "有差异" && attrs && attrs.length > 0 ? attrs : null
  return (
    <span title={causes ? `差异来源：${causes.join("、")}` : undefined}
      className={`inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-[1px] text-[10px] ${m.cls}`}>
      <span className={`h-1 w-1 rounded-full ${m.dot}`} />{label ?? status}
      {causes && (
        <>
          <span className="mx-0.5 h-2.5 w-px bg-amber-400/30" />
          <span className="text-amber-200/70">{causes.join(" / ")}</span>
        </>
      )}
    </span>
  )
}

interface OrderCmp {
  status: CmpStatus
  tradingDay: string
  eventTime: string
  attrs: string[]
  fields: CmpField[]
  note?: string        // 尚未对照 / 单边订单说明
}

function consistentOrderFields(dir: "多" | "空", qty: string, time: string): CmpField[] {
  const intent = `${dir === "多" ? "买入" : "卖出"}开仓 ${qty}`
  return [
    { name: "信号时间", sim: time + ".000", bt: time + ".000" },
    { name: "订单意图", sim: intent, bt: intent, ok: true },
    { name: "成交均价", sim: "已一致", bt: "已一致", ok: true },
    { name: "单边费用", sim: "已一致", bt: "已一致", ok: true },
    { name: "保护单", sim: "OCO 已一致", bt: "同左", ok: true },
    { name: "离场原因", sim: "已一致", bt: "已一致", ok: true },
  ]
}

// 与 ORDERS 一一对应的对照元数据
const ORDER_CMP: OrderCmp[] = [
  { status: "尚未对照", tradingDay: "2026-09-04", eventTime: "14:52:03", attrs: [], fields: [],
    note: "今日尚未收尾；收尾与数据封存完成后进入每日报告队列，届时生成对照。" },
  { status: "有差异", tradingDay: "2026-09-03", eventTime: "13:16:30", attrs: ["费用口径", "撮合模型"], fields: CMP_017_FIELDS },
  { status: "一致", tradingDay: "2026-09-03", eventTime: "11:02:07", attrs: [], fields: consistentOrderFields("空", "1 手", "11:02:07") },
  { status: "尚未对照", tradingDay: "2026-09-04", eventTime: "10:41:55", attrs: [], fields: [],
    note: "该意图被风控拒绝，未产生成交，无回测对照对象。" },
]

// 回测独有：无对应模拟订单（模拟侧当时被风控冷却拦截，回测侧仍成交）
interface SoloOrder { dir: "多" | "空"; title: string; qty: string; status: SimOrder["status"]; pnl: string; cmp: OrderCmp }
const SOLO_ORDERS: SoloOrder[] = [
  { dir: "多", title: "二次突破 · 回测独有成交", qty: "1 手", status: "已止盈", pnl: "+$100",
    cmp: { status: "回测独有", tradingDay: "2026-09-01", eventTime: "15:48:20", attrs: [], fields: [],
      note: "回测侧于该信号成交并止盈；模拟侧当时处于风控冷却窗口，未产生对应订单。仅展示回测侧，不虚构模拟侧。" } },
]

interface UnifiedRow {
  key: string
  order?: SimOrder
  solo?: SoloOrder
  cmp: OrderCmp
  pnl: string | null
}

function buildUnifiedRows(): UnifiedRow[] {
  const rows: UnifiedRow[] = [
    ...ORDERS.map((o, i) => ({ key: `o${i}`, order: o, cmp: ORDER_CMP[i], pnl: o.pnl })),
    ...SOLO_ORDERS.map((s, i) => ({ key: `s${i}`, solo: s, cmp: s.cmp, pnl: s.pnl })),
  ]
  // 按交易日 + 事件时间倒序
  return rows.sort((a, b) => (b.cmp.tradingDay + b.cmp.eventTime).localeCompare(a.cmp.tradingDay + a.cmp.eventTime))
}

const UNIFIED_ROWS = buildUnifiedRows()

/* 逐单对照区块（合并进订单详情） */
function OrderCmpSection({ cmp }: { cmp: OrderCmp }) {
  // 尚未对照 / 单边：只给说明与进度，不做对比表
  if (cmp.status === "尚未对照" || cmp.status === "回测独有" || cmp.fields.length === 0) {
    return (
      <div className="rounded-lg border border-white/[0.06] bg-[#0a0e16] p-3.5">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-slate-100">该订单的回测对照</span>
          <CmpStatusTag status={cmp.status} />
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-slate-400">{cmp.note}</p>
      </div>
    )
  }
  const fields = cmp.fields
  return (
    <div className="rounded-lg border border-white/[0.06] bg-[#0a0e16] p-3.5">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[13px] font-semibold text-slate-100">该订单的回测对照</span>
        <CmpStatusTag status={cmp.status} />
        {cmp.attrs.map((a) => <AttrPill key={a} name={a} />)}
      </div>

      <div className="grid grid-cols-[84px_1fr_1fr] gap-x-4 pb-2">
        <span />
        <span className="text-[12px] font-medium text-slate-200">模拟侧<span className="ml-1.5 text-[10px] font-normal text-slate-500">tick 级撮合</span></span>
        <span className="text-[12px] font-medium text-slate-200">回测侧<span className="ml-1.5 text-[10px] font-normal text-slate-500">5 分钟 bar</span></span>
      </div>
      <div className="space-y-px">
        {fields.map((f) => (
          <div key={f.name} className={`grid grid-cols-[84px_1fr_1fr] items-center gap-x-4 rounded-r py-1.5 pl-2 ${f.diff ? "border-l-2 border-amber-400 bg-amber-500/[0.08]" : "border-l-2 border-transparent"}`}>
            <span className="text-[12px] text-slate-500">{f.name}</span>
            <span className="font-mono text-[13px] text-slate-200">{f.sim}</span>
            <span className="flex items-center gap-2 font-mono text-[13px]">
              <span className={f.diff ? "text-amber-300" : "text-slate-200"}>{f.bt}</span>
              {f.ok && <span className="text-emerald-400">✓</span>}
              {f.diff && <AttrPill name={f.diff === "amber" ? "撮合模型" : "费用口径"} />}
            </span>
          </div>
        ))}
      </div>

      {cmp.status === "有差异" && (
        <div className="mt-3 rounded-md border border-amber-500/15 bg-amber-500/[0.05] p-3">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-amber-200">为什么有差异？</span>
            {cmp.attrs.map((a) => <AttrPill key={a} name={a} />)}
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
            回测按 5 分钟 bar 的 OHLC 判定成交且不收滑点；模拟按 tick 级撮合。费用口径不同（回测 $0.05/边 vs 模拟约 $40/边）。均属执行层已知口径差异，不代表策略意图失配。
          </p>
        </div>
      )}

      {/* 当时行情足迹 */}
      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[12px] font-medium text-slate-300">当时行情足迹</span>
          <span className="font-mono text-[10px] text-slate-500">{cmp.eventTime} · 成交点已冻结</span>
        </div>
        <div className="h-[220px] rounded-md border border-white/[0.06] bg-[#06080d] p-2">
          <CandleChart overlay={SIM_OVERLAY} />
        </div>
      </div>

      <div className="mt-2.5 border-t border-white/[0.05] pt-2 text-[10px] text-slate-600">
        证据状态：已确认 · {cmp.status === "有差异" ? "差异属执行层已知口径差异，不代表策略意图失配" : "意图层与执行层均一致，无差异明细"}
      </div>
    </div>
  )
}

/* 合并详情：订单信息 + 逻辑卡 + 逐单对照 */
function MergedOrderDetail({ row }: { row: UnifiedRow }) {
  const { cmp } = row
  if (row.solo) {
    const s = row.solo
    const dirBg = s.dir === "多" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
    return (
      <div className="space-y-4 overflow-y-auto px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${dirBg}`}>{s.dir}</span>
          <span className="text-[14px] font-semibold text-slate-100">{s.title}</span>
          <CmpStatusTag status={cmp.status} />
          <span className="ml-auto font-mono text-[11px] text-slate-500">{cmp.tradingDay} · {cmp.eventTime}</span>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-[#0a0e16] p-3 text-[12px] text-slate-400">
          该订单为回测独有，无对应模拟订单，因此没有模拟侧的订单信息与执行逻辑。
        </div>
        <OrderCmpSection cmp={cmp} />
      </div>
    )
  }
  const order = row.order!
  const dirBg = order.dir === "多" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
  const pnlCls = order.pnl ? (order.pnl.startsWith("-") ? "text-rose-400" : "text-emerald-400") : "text-slate-500"
  return (
    <div className="space-y-4 overflow-y-auto px-5 py-4">
      {/* 合并标题：方向 / 业务状态 / 交易日时间 / 对照状态 */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${dirBg}`}>{order.dir}</span>
        <span className="text-[14px] font-semibold text-slate-100">{order.title}</span>
        <span className={`text-[12px] font-medium ${ORDER_STATUS_CLS[order.status]}`}>{order.status}</span>
        <CmpStatusTag status={cmp.status} />
        <span className="ml-auto font-mono text-[11px] text-slate-500">{cmp.tradingDay} · {cmp.eventTime}</span>
      </div>

      {/* 订单信息 */}
      <div className="rounded-lg border border-white/[0.06] bg-[#0a0e16] p-3">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wide text-slate-500">订单信息</span>
          {order.pnl && <span className={`font-mono text-[13px] font-semibold ${pnlCls}`}>{order.pnl}{order.floating ? " 浮动" : ""}</span>}
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          <InfoRow label="成交金额" value={order.amount} />
          <InfoRow label="入场方式" value={order.entryKind} />
          <InfoRow label="持仓时间" value={order.holdTime} />
          <InfoRow label="出场时间" value={order.exitTime} />
        </div>
        <div className="mt-2 border-t border-white/[0.05] pt-2">
          <InfoRow label="出场逻辑" value={order.exitLogic} cls="text-slate-400" />
        </div>
      </div>

      <DirectionCard dir={order.dir} points={order.dirPoints} />
      <EntryCard kind={order.entryKind} price={order.entryPrice} pnl={order.pnl} floating={order.floating} limitReason={order.limitReason} points={order.entryPoints} />
      <TpSlCard slTicks={order.slTicks} slLogic={order.slLogic} tpTicks={order.tpTicks} tpLogic={order.tpLogic} rr={order.rr} />

      {/* 逐单对照 */}
      <OrderCmpSection cmp={cmp} />
    </div>
  )
}

/* 统一列表行 */
function UnifiedRowItem({ row, selected, onSelect }: { row: UnifiedRow; selected: boolean; onSelect: () => void }) {
  const dir = row.order?.dir ?? row.solo!.dir
  const title = row.order?.title ?? row.solo!.title
  const status = row.order?.status ?? row.solo!.status
  const holdTime = row.order?.holdTime ?? "—"
  const exitLogic = row.order?.exitLogic ?? "回测独有成交"
  const dirCls = dir === "多" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
  const pnlCls = row.pnl ? (row.pnl.startsWith("-") ? "text-rose-400" : "text-emerald-400") : "text-slate-600"
  return (
    <button onClick={onSelect}
      className={`flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-white/[0.03] ${selected ? "bg-white/[0.04]" : ""}`}>
      <span className={`flex h-5 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold ${dirCls}`}>{dir}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[12px] font-medium text-slate-100">{title}</span>
          {status !== "已止盈" && status !== "已止损" && <span className={`shrink-0 text-[10px] ${ORDER_STATUS_CLS[status]}`}>{status}</span>}
          <CmpStatusTag status={row.cmp.status} attrs={row.cmp.attrs} />
        </div>
        <div className="mt-1 flex items-center gap-1.5 truncate text-[10px] text-slate-500">
          <span className="font-mono text-slate-600">{row.cmp.tradingDay} {row.cmp.eventTime}</span>
          <span className="text-slate-700">·</span>
          <span>持仓 {holdTime}</span>
          <span className="text-slate-700">·</span>
          <span className="truncate">{exitLogic}</span>
        </div>
      </div>
      <span className={`shrink-0 font-mono text-[12px] font-semibold ${pnlCls}`}>{row.pnl ?? "—"}</span>
    </button>
  )
}

const CMP_FILTERS: { key: "all" | CmpStatus; label: string }[] = [
  { key: "all", label: "所有订单" },
  { key: "有差异", label: "有差异" },
  { key: "一致", label: "一致" },
  { key: "尚未对照", label: "尚未对照" },
]

// 交易日（倒序）
const TRADING_DAYS = ["2026-09-04", "2026-09-03", "2026-09-02", "2026-09-01"]

/* 统一订单模块：左列（范围 + 筛选 + 概览 + 列表），右列（概览 / 合并详情） */
function UnifiedOrderTab({ replay }: { replay: boolean }) {
  const DAYS = replay ? ["2026-09-04", "2026-09-03", "2026-09-02"] : TRADING_DAYS
  const [selected, setSelected] = useState<string>("overview")
  const [scope, setScope] = useState<"all" | "day">("all")
  const [day, setDay] = useState("2026-09-03")
  const [filter, setFilter] = useState<"all" | CmpStatus>("all")
  // 每日报告状态机（重跑演示）
  const [reportState, setReportState] = useState<Record<string, ReportStatus>>({})
  // 窄屏：列表 / 详情二选一
  const [mobilePane, setMobilePane] = useState<"list" | "detail">("list")

  const statusOf = (d: string) => reportState[d] ?? DAY_DATA[d].base
  function rerun(d: string, fail = false) {
    const cur = statusOf(d)
    if (cur === "排队中" || cur === "生成中") return // 同日执行中禁重复提交
    setReportState((s) => ({ ...s, [d]: "排队中" }))
    scheduleSampleTimer(() => setReportState((s) => ({ ...s, [d]: "生成中" })), 900)
    scheduleSampleTimer(() => setReportState((s) => ({ ...s, [d]: fail ? "生成失败" : "已生成" })), 2000)
  }

  // 终态不复用运行中持仓订单
  const source = replay ? UNIFIED_ROWS.filter((r) => r.order?.status !== "持仓中") : UNIFIED_ROWS
  const scoped = scope === "all" ? source : source.filter((r) => r.cmp.tradingDay === day)
  const rows = filter === "all" ? scoped : scoped.filter((r) => r.cmp.status === filter)
  // UI-01：所选订单不属于当前范围则回退到概览
  const active = rows.find((r) => r.key === selected)
  const overviewMode = !active

  const curData = scope === "all" ? ALL_DATA : DAY_DATA[day]
  const curStatus = scope === "all" ? "已生成" : statusOf(day)
  const dayIdx = TRADING_DAYS.indexOf(day)
  const busy = curStatus === "排队中" || curStatus === "生成中"
  const meta = REPORT_STATUS_META[curStatus]
  const ovShow = curStatus === "已生成" || curStatus === "生成失败"

  const overviewHeader = (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12px] font-semibold text-slate-200">{scope === "all" ? "全部" : day}</span>
        <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-[1px] text-[10px] ${meta.cls}`}>
          <span className={`h-1 w-1 rounded-full ${meta.dot} ${busy ? "animate-pulse" : ""}`} />
          {meta.label}{curStatus === "已生成" && curData.version ? ` · ${curData.version}` : ""}
        </span>
        <span className="ml-auto font-mono text-[11px] text-slate-400">
          {scope === "all" ? `累计 ${curData.netLabel}` : `当日 ${curData.netLabel}`}
        </span>
      </div>
      {scope === "all" ? (
        <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
          报告口径累计 +$150（仅计已生成日 09-01 / 09-03）· 缺 09-02（报告缺失，未计入）。真实账户 $99,950 含缺报日影响 −$200，与报告口径不同，不做直接相减。
        </p>
      ) : null}

      {/* UI-03：按日重跑操作（全部范围不提供） */}
      {scope === "day" && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-white/[0.05] pt-2">
          {curStatus === "等待收尾" ? (
            <span className="text-[10px] text-slate-500">今日收尾后自动入队生成，无需手动重跑。</span>
          ) : (
            <>
              <button disabled={busy} onClick={() => rerun(day, getLive().demoRerunFail)}
                className="rounded-md border border-sky-400/40 bg-sky-500/10 px-2.5 py-1 text-[11px] text-sky-200 hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-40">
                {curStatus === "无报告" ? "生成报告" : "重跑该日"}
              </button>
              {busy && <span className="text-[10px] text-slate-500">{meta.label} · 同日重复提交已禁用</span>}
            </>
          )}
        </div>
      )}
    </div>
  )

  const listCol = (
    <div className="flex min-h-0 flex-col border-r border-white/[0.06]">
      <div className="shrink-0 space-y-2 border-b border-white/[0.06] px-4 py-2.5">
        <div className="flex items-center gap-1">
          {(["all", "day"] as const).map((s) => (
            <button key={s} onClick={() => { setScope(s); setSelected("overview") }}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${scope === s ? "bg-sky-500/15 text-sky-300" : "text-slate-500 hover:text-slate-300"}`}>
              {s === "all" ? "全部" : "按交易日"}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-slate-600">共 {rows.length} 单</span>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {CMP_FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`rounded border px-2 py-[3px] text-[10px] transition-colors ${filter === f.key ? "border-slate-400/60 bg-white/[0.06] text-slate-200" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* 交易日切换（仅按交易日范围时显示） */}
        {scope === "day" && (
          <div className="flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.02] p-1">
            <button disabled={dayIdx >= TRADING_DAYS.length - 1} onClick={() => { setDay(TRADING_DAYS[dayIdx + 1]); setSelected("overview") }}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 disabled:opacity-30 disabled:hover:bg-transparent">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
              {TRADING_DAYS.map((d) => {
                const st = statusOf(d)
                const dotCls = st === "无报告" ? "bg-amber-400" : st === "生成失败" ? "bg-rose-400" : st === "已生成" ? "bg-emerald-400" : "bg-sky-400"
                return (
                  <button key={d} onClick={() => { setDay(d); setSelected("overview") }}
                    className={`flex shrink-0 items-center gap-1 rounded px-2 py-1 font-mono text-[11px] transition-colors ${d === day ? "bg-sky-500/15 text-sky-300" : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"}`}>
                    <span className={`h-1 w-1 rounded-full ${dotCls}`} />
                    {d.slice(5)}
                  </button>
                )
              })}
            </div>
            <button disabled={dayIdx <= 0} onClick={() => { setDay(TRADING_DAYS[dayIdx - 1]); setSelected("overview") }}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 disabled:opacity-30 disabled:hover:bg-transparent">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
            </button>
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* 概览固定首项 */}
        <button onClick={() => { setSelected("overview"); setMobilePane("detail") }}
          className={`flex w-full items-center gap-3 border-b border-white/[0.06] px-5 py-2.5 text-left transition-colors hover:bg-white/[0.03] ${overviewMode ? "bg-white/[0.04]" : ""}`}>
          <span className="flex h-5 w-6 shrink-0 items-center justify-center rounded bg-sky-500/15 text-sky-300">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-[12px] font-medium text-slate-100">概览 · {scope === "all" ? "全部交易日" : day.slice(5)}</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 truncate text-[10px] text-slate-500">
              <span className="font-mono text-slate-600">{scope === "all" ? `${DAYS[DAYS.length - 1].slice(5)} → ${DAYS[0].slice(5)}` : `${day.slice(5)} 22:00Z 会话`}</span>
              <span className="text-slate-700">·</span>
              <span>{rows.length} 笔订单</span>
              {scope === "all" && <><span className="text-slate-700">·</span><span>仅计已生成日</span></>}
            </div>
          </div>
          <span className={`shrink-0 font-mono text-[12px] font-semibold ${!ovShow ? "text-slate-600" : curData.netLabel.startsWith("-") ? "text-rose-400" : "text-emerald-400"}`}>{ovShow ? curData.netLabel : "—"}</span>
        </button>

        {rows.length === 0 ? (
          filter !== "all" ? (
            <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
              <span className="text-[12px] text-slate-500">无匹配订单</span>
              <button onClick={() => setFilter("all")} className="rounded-md border border-white/[0.1] px-2.5 py-1 text-[11px] text-slate-300 hover:bg-white/[0.05]">清除筛选</button>
            </div>
          ) : (
            <div className="px-5 py-10 text-center text-[12px] text-slate-500">
              {curStatus === "已生成" ? "该交易日报告已生成，暂无订单。" : "该交易日暂无订单记录。"}
            </div>
          )
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {rows.map((r) => (
              <UnifiedRowItem key={r.key} row={r} selected={selected === r.key} onSelect={() => { setSelected(r.key); setMobilePane("detail") }} />
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const detailCol = (
    <div className="flex min-h-0 flex-col overflow-hidden bg-[#080b11]">
      {/* 窄屏返回入口（保留日期与筛选） */}
      <button onClick={() => setMobilePane("list")}
        className="flex shrink-0 items-center gap-1.5 border-b border-white/[0.06] px-4 py-2 text-[12px] text-slate-300 hover:bg-white/[0.03] lg:hidden">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
        返回列表
      </button>
      <div className="min-h-0 flex-1 overflow-y-auto" role="region" aria-label="订单详情与概览" tabIndex={0}>
        {active ? <MergedOrderDetail row={active} /> : <OverviewPanel header={overviewHeader} data={curData} status={curStatus} />}
      </div>
    </div>
  )

  return (
    <>
      {/* 宽屏：左右分栏 */}
      <div className="hidden min-h-0 flex-1 grid-cols-[2fr_3fr] overflow-hidden lg:grid">
        {listCol}
        {detailCol}
      </div>
      {/* 窄屏：列表 / 详情二选一 */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:hidden">
        {mobilePane === "list" ? listCol : detailCol}
      </div>
    </>
  )
}

/* ─── Main component ──────────────────────────────────────────────── */

const DETAIL_TABS = ["订单列表", "最新事件", "风控事件"]
const TF = ["1m", "5m", "15m", "1h"]

/** 有工作台数据的模拟（唯一来源）· 模拟列表据此禁用「打开工作台」 */
export const hasWorkbench = (id: string) => id in SIM_DATA

/* 点击展开的说明（替代常驻小字） */
function InfoTip({ children, label = "说明", align = "left" }: { children: ReactNode; label?: string; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    const c = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("keydown", k); document.addEventListener("mousedown", c)
    return () => { document.removeEventListener("keydown", k); document.removeEventListener("mousedown", c) }
  }, [open])
  return (
    <span ref={ref} className="relative inline-block">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className="whitespace-nowrap rounded border border-white/[0.08] px-1.5 py-0.5 text-[10px] text-slate-500 outline-none hover:text-slate-300 focus-visible:ring-2 focus-visible:ring-sky-500/50">{label}</button>
      {open && (
        <div role="dialog" className={`absolute top-full z-50 mt-1.5 w-[260px] max-w-[calc(100vw-2rem)] rounded-xl border border-white/[0.1] bg-[#0a0d14] p-3 text-[11px] font-normal leading-relaxed text-slate-300 shadow-xl ${align === "right" ? "right-0" : "left-0"}`}>
          {children}
        </div>
      )}
    </span>
  )
}

function useNarrow() {
  const q = "(max-width: 1024px)"
  const [n, setN] = useState(() => typeof window !== "undefined" && window.matchMedia(q).matches)
  useEffect(() => {
    const m = window.matchMedia(q)
    const f = () => setN(m.matches)
    m.addEventListener("change", f)
    return () => m.removeEventListener("change", f)
  }, [])
  return n
}

function NoWorkbench({ simId, onBack }: { simId: string; onBack: () => void }) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-[#06080d] text-slate-300">
      <div className="text-[15px] font-semibold">该模拟暂无工作台数据</div>
      <div className="font-mono text-[12px] text-slate-500">{simId}</div>
      <button onClick={onBack} className="mt-2 rounded-md border border-white/[0.1] px-3 py-1.5 text-[12px] hover:bg-white/[0.05]">返回模拟列表</button>
    </div>
  )
}

function SourceSimWorkbench(p: { simId: string; onBack: () => void }) {
  return hasWorkbench(p.simId) ? <SimWorkbenchInner {...p} /> : <NoWorkbench {...p} />
}

function SimWorkbenchInner({ simId, onBack }: { simId: string; onBack: () => void }) {
  const outlet = useOutlet()
  const sim = SIM_DATA[simId]
  const record = SIMS.find(item => item.id === simId)
  // Only sim-001 has the sourced detailed order/market/curve illustration below.
  const hasDetailedWorkbench = simId === "sim-001"
  const position = record?.position
  const positionOrder = hasDetailedWorkbench && position?.state === "confirmed"
    ? ORDERS.find(order => order.status === "持仓中") : undefined
  const metricRows: PerfItem[] = [
    ["模拟净利润（含浮动）", record?.metrics?.netPnl], ["胜率", record?.metrics?.winRate],
    ["夏普", record?.metrics?.sharpe], ["最大回撤", record?.metrics?.maxDrawdown],
    ["订单数量", record?.metrics?.orders], ["盈亏比", record?.metrics?.profitFactor],
  ].map(([label, value]) => ({ label: label!, value: value ?? "不可计算" }))

  const replay = sim.status === "completed" || sim.status === "failed" || sim.status === "incomplete"

  const [tf, setTf] = useState("5m")
  const [detailOpen, setDetailOpen] = useState(true)
  const narrow = useNarrow()
  const [pane, setPane] = useState<"chart" | "orders" | "detail">("chart")
  const fp = useFootprint()
  const [detailTab, setDetailTab] = useState(DETAIL_TABS[0])
  const [stopConfirm, setStopConfirm] = useState<"normal" | "emergency" | null>(null)
  const stopTrigger = useRef<HTMLElement | null>(null)
  const [stopped, setStopped] = useState(false)

  // 足迹图 / 下方分页之间的可拖动分隔
  const leftColRef = useRef<HTMLDivElement>(null)
  const [detailH, setDetailH] = useState(360)
  function onSplitDrag(e: React.MouseEvent) {
    e.preventDefault()
    const onMove = (ev: MouseEvent) => {
      const rect = leftColRef.current?.getBoundingClientRect()
      if (!rect) return
      const h = rect.bottom - ev.clientY
      setDetailH(Math.max(160, Math.min(rect.height - 180, h)))
    }
    const onUp = () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      document.body.style.userSelect = ""
    }
    document.body.style.userSelect = "none"
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }

  const isLive = sim.status === "live" && !stopped
  const detailTabs = DETAIL_TABS
  const [monOpen, setMonOpen] = useState(false)
  const monRef = useRef<HTMLDivElement>(null)
  const monBtnRef = useRef<HTMLButtonElement>(null)
  const monId = useId()
  useEffect(() => {
    if (!monOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setMonOpen(false); monBtnRef.current?.focus() } }
    const onClick = (e: MouseEvent) => { if (monRef.current && !monRef.current.contains(e.target as Node)) setMonOpen(false) }
    document.addEventListener("keydown", onKey)
    document.addEventListener("mousedown", onClick)
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onClick) }
  }, [monOpen])
  const timelineEvents: TimelineEvent[] = hasDetailedWorkbench ? TIMELINE_SIM001 : simId === "sim-005" ? TIMELINE_SIM005 : []
  const runtime = "3 天 12 小时"
  const displayStatus = stopped ? "停止中" : {
    live: `实时运行（${runtime}）`, "live-lag": "实时落后", isolated: "隔离", stopping: "停止中",
    ready: "待启动 · 已就绪", draft: "待启动 · 草稿", preflight: "预检中",
    "needs-fix": "待启动 · 需修复", completed: "运行完成", failed: "运行失败", incomplete: "未完成收尾",
  }[sim.status as string] ?? "—"

  // UI-02：同一套 fixture 驱动侧栏所有数字，终态口径与「累计口径 +$150 / 真实结余 -$50」一致
  const perf = replay
    ? {
        net: "+$150", netGreen: true, win: "60.0%", sharpe: "1.8", dd: "-$300", orders: "4", pf: "1.4",
        equity: "$99,950.00", realized: "-$50.00", realizedGreen: false,
        fills: "报告口径 4 笔 / 2 日", curveNote: "累计 +$150 · 2 交易日报告口径", curveEnd: "+$150 · 报告口径",
        realNote: "报告口径累计 +$150（09-03 / 09-04）；真实账户结余 -$50（含缺报的 09-02 当日 -$200）。两者口径不同。",
      }
    : {
        net: "+$1,820", netGreen: true, win: "66.7%", sharpe: "4.2", dd: "-$340", orders: "3", pf: "2.8",
        equity: "$101,820.00", realized: "+$1,732.50", realizedGreen: true,
        fills: "3 次", curveNote: "3 次模型成交 · 盈亏比 2.8", curveEnd: "+$1,820 · 3 笔",
        realNote: "含浮动盈亏的当前权益；模拟保证金，不是券商真实保证金。",
      }
  const open = narrow || detailOpen
  const forced = forcedPhase(sim.id)
  const phase = computePhase(sim.session, fp, forced)
  const chipLabel = isLive && hasDetailedWorkbench ? PHASE_LABEL[phase] : (displayStatus.split("（")[0])
  const chipCls = isLive && hasDetailedWorkbench ? PHASE_CHIP[phase].chip
    : sim.status === "failed" ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
    : sim.status === "incomplete" ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
    : replay ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
    : "border-white/[0.1] bg-white/[0.04] text-slate-300"
  const chipDot = isLive && hasDetailedWorkbench ? PHASE_CHIP[phase].dot
    : sim.status === "failed" ? "bg-rose-400" : sim.status === "incomplete" ? "bg-amber-400" : replay ? "bg-emerald-400" : "bg-slate-500"
  const replayReason = sim.status === "failed" ? "运行中途中断，未能完成收尾，需要查看原因后重新运行"
    : sim.status === "incomplete" ? "保护单未能闭合，需人工核对持仓后再收尾"
    : "运行已结束，页面为只读历史视图"
  const needsAction = sim.status === "failed" || sim.status === "incomplete"
  const orderCount = replay ? UNIFIED_ROWS.filter((r) => r.order?.status !== "持仓中").length : UNIFIED_ROWS.length

  return (
    <main aria-labelledby="workbench-title" className="flex h-screen flex-col overflow-hidden bg-[#06080d] text-slate-200">
      <Scenario state={parseDemoState(new URLSearchParams(location.search).get('state') ?? undefined)}/>

      {/* ─── Header (mirrors Workbench exactly) ──────────────────── */}
      <header className="flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-white/[0.06] bg-[#080b11] px-4 py-2 sm:px-5 min-[1025px]:h-14 min-[1025px]:flex-nowrap min-[1025px]:py-0">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onBack}
            aria-label="返回"
            className="shrink-0 rounded-md border border-white/[0.08] bg-white/[0.02] p-1.5 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-slate-200"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h1 id="workbench-title" tabIndex={-1} className="m-0 min-w-0 break-words text-[15px] font-semibold text-slate-100">{sim.name}</h1>
              <span className="whitespace-nowrap rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 font-mono text-[12px] text-sky-400">
                {sim.strategy}:{sim.version}
              </span>
              {/* 唯一的运行状态：点击展开原因与时间 */}
              <div ref={monRef} className="relative">
                <button
                  ref={monBtnRef}
                  onClick={() => setMonOpen((v) => !v)}
                  aria-expanded={monOpen}
                  aria-controls={monId}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 py-0.5 text-[12px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 ${chipCls}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${chipDot}`} />
                  <span>{chipLabel}</span>
                  <svg className={`h-3 w-3 opacity-60 transition-transform ${monOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
                </button>
                {monOpen && (!hasDetailedWorkbench ? <div id={monId} className="absolute z-40 rounded-lg border border-white/10 bg-[#0a0d14] p-3 text-[12px] text-slate-300">{record?.anomaly ?? "该记录运行明细未提供；不借其他记录补值。"}</div> : replay ? (
                  <ReplayStatusPopover id={monId} label={chipLabel} reason={replayReason}
                    tone={sim.status === "failed" ? "bg-rose-500/15 text-rose-300" : sim.status === "incomplete" ? "bg-amber-500/15 text-amber-200" : "bg-emerald-500/15 text-emerald-300"} />
                ) : (
                  <HealthPopover
                    id={monId}
                    isLive={isLive}
                    session={sim.session}
                    forced={forced}
                    statusLabel={chipLabel}
                    statusTone="bg-white/[0.06] text-slate-300"
                  />
                ))}
              </div>
              {!replay && sim.runKind !== "live_sim" && (
                <span className={`whitespace-nowrap rounded px-2 py-0.5 text-[11px] ${RUN_KIND_LABEL[sim.runKind].cls}`}>
                  {RUN_KIND_LABEL[sim.runKind].label}
                </span>
              )}
              {replay && <span className="whitespace-nowrap rounded border border-violet-400/60 px-2 py-0.5 text-[11px] text-violet-300">历史回放</span>}
            </div>
            <div className="mt-0.5 truncate text-[11px] text-slate-500">
              {`${sim.contract} · ${sim.session}${hasDetailedWorkbench ? " · 固定 1 手" : ""}${sim.runId ? ` · ${sim.runId}` : ""}`}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {replay ? (
            <button className="flex items-center gap-1.5 whitespace-nowrap rounded-md border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-[12px] text-slate-300 hover:bg-white/[0.07]">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg>
              导出证据包
            </button>
          ) : (
          <>
          {hasDetailedWorkbench && <DemoPanel />}
          <TBtn>刷新</TBtn>
          <TBtn>业务日志</TBtn>
          {isLive && (
            <>
              <TBtn tone="amber" onClick={() => { stopTrigger.current = document.activeElement as HTMLElement; setStopConfirm("normal") }}>正常停止</TBtn>
              <TBtn tone="rose" onClick={() => { stopTrigger.current = document.activeElement as HTMLElement; setStopConfirm("emergency") }}>紧急停止</TBtn>
            </>
          )}
          </>
          )}
        </div>
      </header>

      {/* 仅需用户处理的错误：一行原因 + 一个动作 */}
      {replay && needsAction && (
        <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-white/[0.06] bg-rose-500/[0.05] px-4 py-1.5 text-[12px] text-rose-200 sm:px-5">
          <span className="min-w-0">{replayReason}</span>
          <button onClick={() => setMonOpen(true)} className="whitespace-nowrap rounded border border-rose-400/40 px-2 py-0.5 text-[11px] text-rose-200 hover:bg-rose-500/10">查看原因</button>
        </div>
      )}

      {/* ─── Main body ───────────────────────────────────────────── */}
      <div className={`min-h-0 flex-1 overflow-hidden ${narrow ? "flex flex-col" : "grid grid-cols-[1fr_360px]"}`}>

        {/* 窄屏：图表 / 订单 / 详情 分段切换，一次只显示一个面板 */}
        {narrow && (
          <div role="tablist" aria-label="工作台面板" className="flex shrink-0 gap-1 border-b border-white/[0.06] bg-[#080b11] p-2">
            {([["chart", "图表"], ["orders", "订单"], ["detail", "详情"]] as const).map(([k, l]) => (
              <button key={k} role="tab" aria-selected={pane === k} onClick={() => setPane(k)}
                className={`flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-[12px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 ${pane === k ? "bg-sky-500/15 text-sky-300" : "text-slate-400 hover:text-slate-200"}`}>{l}</button>
            ))}
          </div>
        )}

        {/* ─── Left: chart + order panel ───────────────────────── */}
        {(!narrow || pane !== "detail") && (
        <div ref={leftColRef} className={`flex min-h-0 flex-col overflow-hidden ${narrow ? "flex-1" : "border-r border-white/[0.06]"}`}>

          {(!narrow || pane === "chart") && (<>
          {/* Chart toolbar */}
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-2.5">
            <div className="flex gap-1">
              {TF.map((t) => (
                <button key={t} onClick={() => setTf(t)}
                  className={`rounded px-2.5 py-1 text-[12px] font-medium ${tf === t ? "bg-sky-500/15 text-sky-300" : "text-slate-400 hover:text-slate-200"}`}>
                  {t}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 whitespace-nowrap text-[11px] text-slate-500">
              <span>Footprint · {sim.contract}</span>
              <span className="font-mono text-slate-300">{hasDetailedWorkbench ? `最新 ${CURR_P.toFixed(2)}` : "行情报价未提供"}</span>
              {isLive && hasDetailedWorkbench && <span className="font-mono text-emerald-400">+1.75</span>}
            </div>
          </div>

          {/* Footprint chart */}
          <div className="relative min-h-[280px] flex-1 px-4 py-3">
            {hasDetailedWorkbench ? <CandleChart overlay={positionOrder ? SIM_OVERLAY : undefined} /> : <p className="flex h-full items-center justify-center text-[12px] text-slate-500">该记录行情与图表序列未提供，不借用 NQ 示意数据。</p>}
          </div>

          {/* 复盘态 · 覆盖区间迷你时间轴（非播放器，不可拖动） */}
          {replay && hasDetailedWorkbench && (
            <div className="shrink-0 border-t border-white/[0.06] px-4 py-2.5">
              <div className="relative h-6">
                {/* 旗标：暂停段 */}
                <span className="absolute -top-0.5 text-[9px] text-slate-500" style={{ left: "37.8%" }}>暂停 · 已排除</span>
                {/* 横条 14:00—18:30 */}
                <div className="absolute left-0 right-0 top-3.5 h-2 overflow-hidden rounded-full bg-white/[0.05]">
                  {/* 暂停段 15:40—16:00 斜纹 */}
                  <div className="absolute top-0 h-full bg-[repeating-linear-gradient(45deg,rgba(148,163,184,.35)_0,rgba(148,163,184,.35)_3px,transparent_3px,transparent_6px)]"
                    style={{ left: "37.8%", width: "7.4%" }} />
                </div>
                {/* 运行停止竖线 */}
                <div className="absolute top-2 h-4 w-px bg-slate-400" style={{ right: 0 }} />
                <span className="absolute -bottom-0.5 right-0 text-[9px] text-slate-500">运行停止 18:30</span>
                <span className="absolute -bottom-0.5 left-0 text-[9px] text-slate-600 font-mono">14:00</span>
              </div>
            </div>
          )}
          </>)}

          {/* 可拖动分隔条：调整足迹图与下方分页的高度比例 */}
          {!narrow && detailOpen && (
            <div onMouseDown={onSplitDrag}
              className="group flex h-2.5 shrink-0 cursor-row-resize items-center justify-center border-t border-white/[0.06] bg-white/[0.01] hover:bg-sky-500/10">
              <div className="h-[3px] w-9 rounded-full bg-white/15 transition-colors group-hover:bg-sky-400/70" />
            </div>
          )}

          {/* ─── Collapsible bottom: order panel ───────────────── */}
          {(!narrow || pane === "orders") && (
          <div
            className={`flex min-h-0 flex-col ${narrow ? "flex-1" : open ? "shrink-0" : "shrink-0 border-t border-white/[0.06]"}`}
            style={!narrow && open ? { height: detailH } : undefined}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-4">
              <div className="flex overflow-x-auto">
                {detailTabs.map((t) => (
                  <button key={t} onClick={() => setDetailTab(t)}
                    className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-[12px] font-medium transition-colors ${
                      detailTab === t ? "border-sky-500 text-sky-300" : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}>
                    {t}
                    {t === "订单列表" && hasDetailedWorkbench && <span className="flex items-center gap-1 text-[11px] text-amber-400"><span className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_0_2px_rgba(245,158,11,.12)]" />2 处差异</span>}
                  </button>
                ))}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="whitespace-nowrap text-[11px] text-slate-600">
                  {detailTab === "订单列表" ? (hasDetailedWorkbench ? `${orderCount} 单` : "逐单证据未提供")
                    : detailTab === "最新事件" ? `${timelineEvents.length} 条`
                    : !hasDetailedWorkbench ? "风控事件未提供" : MACHINE.exec.rejects > 0 ? `${MACHINE.exec.rejects} 条风控拒绝` : "暂无风险事件"}
                </span>
                {!narrow && <button
                  onClick={() => setDetailOpen((v) => !v)}
                  aria-label={detailOpen ? "收起" : "展开"}
                  className="text-slate-500 transition-colors hover:text-slate-300"
                >
                  <svg className={`h-4 w-4 transition-transform ${detailOpen ? "" : "rotate-180"}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m18 15-6-6-6 6" />
                  </svg>
                </button>}
              </div>
            </div>

            {open && detailTab === "订单列表" && (hasDetailedWorkbench ? <UnifiedOrderTab replay={replay} /> : <p className="p-5 text-[12px] text-slate-500">该记录逐单明细未提供；汇总订单数量不等于可借用其他记录的订单。</p>)}

            {open && detailTab === "最新事件" && (
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-2">
                {timelineEvents.length ? <RunTimeline events={timelineEvents} /> : <p className="text-[12px] text-slate-500">该记录时间线未提供。</p>}
              </div>
            )}

            {open && detailTab === "风控事件" && (
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
                {!hasDetailedWorkbench ? <p className="text-[12px] text-slate-500">该记录风控事件未提供。</p> : MACHINE.exec.rejects > 0 ? (
                  <div className="flex items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[12px]">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                    <span className="text-slate-300">{MACHINE.exec.lastReject}</span>
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
                    <span className="text-[13px] text-slate-400">暂无风险事件</span>
                  </div>
                )}
              </div>
            )}

          </div>
          )}
        </div>
        )}

        {/* ─── Right sidebar (mirrors Workbench) ───────────────── */}
        {(!narrow || pane === "detail") && (
        <aside aria-label="模拟表现与账户信息" className={`flex flex-col bg-[#080b11] min-h-0 overflow-y-auto ${narrow ? "flex-1" : ""}`}>

          {/* 模拟表现 */}
          <div className="shrink-0 border-b border-white/[0.06] p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-slate-100">模拟表现</h2>
              {replay && hasDetailedWorkbench && (
                <InfoTip label="证据状态" align="right">
                  <div>
                    <div className="text-[12px] font-semibold text-slate-100">证据状态 · 部分已确认</div>
                    <div className="mt-2 space-y-1.5">
                      {[
                        { k: "净 PnL / 胜率 / 最大回撤", ev: "confirmed" as EvKind },
                        { k: "执行意图判等", ev: "confirmed" as EvKind },
                        { k: "夏普（按 5m 收益年化）", ev: "partial" as EvKind },
                        { k: "盈亏比", ev: "unavailable" as EvKind },
                      ].map((r) => (
                        <div key={r.k} className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-400">{r.k}</span>
                          <span className={`flex shrink-0 items-center gap-1 text-[10px] ${EV_META[r.ev].text}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${EV_META[r.ev].dot}`} />{EV_META[r.ev].label}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 border-t border-white/[0.06] pt-2 text-[10px] leading-relaxed text-slate-500">
                      排除暂停段 15:40—16:00（无行情）；夏普证据不完整，结论仅供参考。数据回放（replay）运行仅验证输入、不计绩效。
                    </p>
                  </div>
                </InfoTip>
              )}
            </div>
            {/* 与模拟记录 / 回测工作台一致：净利润/最大回撤 · 胜率/订单数量 · 夏普/盈亏比 */}
            <div className="mt-4 grid grid-cols-3 gap-x-3 gap-y-4">
              {metricRows.map((c) => (
                <PerfCell key={c.label} label={c.label} value={c.value} green={c.green} red={c.red} />
              ))}
            </div>
            <div className="mt-3">
              <InfoTip label="口径说明">
                {record?.metricsNote ?? (record?.metrics ? "本记录 fixture 汇总指标；明细、账户和曲线各自按实际证据提供。" : "该记录六项指标未提供，不能从运行状态补值。 ")}
              </InfoTip>
            </div>
          </div>

          {/* 模拟权益曲线 */}
          <div className="shrink-0 border-b border-white/[0.06] p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-slate-100">模拟权益曲线</h2>
              <span className="text-[10px] text-slate-500">{hasDetailedWorkbench ? PERF.live.curveNote : "本记录序列未提供"}</span>
            </div>
            <div className="mt-3 h-[108px] rounded-lg border border-white/[0.06] bg-[#0a0d14] p-2">
              {hasDetailedWorkbench ? <EquityCurve seed={5} width={320} height={92} className="w-full" /> : <p className="flex h-full items-center justify-center text-[11px] text-slate-500">权益曲线序列未提供；不由汇总值或 seed 造曲线。</p>}
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] text-slate-500">
              <span>{hasDetailedWorkbench ? "2026-09-01" : record?.startDate ?? "未提供"}</span>
              <span className="text-emerald-400">{hasDetailedWorkbench ? PERF.live.curvePnl : "未提供"}</span>
              <span>{hasDetailedWorkbench ? "2026-09-04" : record?.endDate ?? "未提供"}</span>
            </div>
          </div>

          {/* 账户信息 */}
          <div className="shrink-0 border-b border-white/[0.06] p-4">
            <h2 className="mb-3 text-[14px] font-semibold text-slate-100">账户信息</h2>

            {/* Account data */}
            <div className="space-y-1.5 text-[12px]">
              {(hasDetailedWorkbench ? PERF.live.account : [{ label: "本记录账户读回", value: "未提供" }]).map((r: AcctRow) => (
                <div key={r.label} className="flex items-center justify-between">
                  <span className="text-slate-500">{r.label}</span>
                  <span className={`${r.mono ? "font-mono" : ""} ${r.green ? "text-emerald-400" : r.red ? "text-rose-400" : r.bright ? "text-slate-100" : "text-slate-300"}`}>
                    {r.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 实盘信号接入（独立卡片） */}
          {!replay && (
            <div className="shrink-0 border-b border-white/[0.06] p-4">
              <OutletCard sim={sim} isLive={isLive} onManage={() => { goCockpitConfig(); onBack() }} />
            </div>
          )}

          {/* 策略实时逻辑 */}
          <div className="shrink-0">
            <StrategyLogicCard record={record} order={positionOrder} stopping={stopped} />
          </div>
        </aside>
        )}
      </div>

      {/* ─── Stop confirm modals ─────────────────────────────────── */}
      {stopConfirm && <StopConfirmDialog mode={stopConfirm} trigger={stopTrigger.current}
        onCancel={() => setStopConfirm(null)} onConfirm={() => { setStopped(true); setStopConfirm(null) }} /> }
    </main>
  )
}


function StopConfirmDialog({ mode, trigger, onCancel, onConfirm }: {
  mode: "normal" | "emergency"; trigger: HTMLElement | null; onCancel: () => void; onConfirm: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null), cancel = useRef<HTMLButtonElement>(null), titleId = useId()
  useEffect(() => {
    const node = dialog.current
    if (node && !node.open) node.showModal()
    cancel.current?.focus()
    return () => {
      node?.close()
      queueMicrotask(() => {
        if (trigger?.isConnected) trigger.focus()
        else document.getElementById("workbench-title")?.focus()
      })
    }
  }, [trigger])
  return <dialog ref={dialog} aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); onCancel() }}
    className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[460px] overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#0a0d14] p-6 text-slate-200 shadow-2xl backdrop:bg-black/60">
            <h3 id={titleId} className={`text-[18px] font-bold ${mode === "emergency" ? "text-rose-300" : "text-amber-200"}`}>
              {mode === "normal" ? "确认正常停止" : "确认紧急停止"}
            </h3>
            <div className="mt-3 space-y-2 text-[13px] text-slate-400">
              {mode === "normal" ? (
                <>
                  <p>将停止产生新模拟意图，撤销普通挂单，保留并核对止盈止损保护订单。</p>
                  <p>有可靠价格时安全收尾。只有 Position Flat 且订单终态才显示「运行完成」。</p>
                </>
              ) : (
                <>
                  <p>立即停止新意图，尽快撤普通单。<strong className="text-rose-300">不创建平仓意图，不伪造 Flat。</strong></p>
                  <div className="mt-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 space-y-1 text-[12px]">
                    <div className="flex justify-between"><span className="text-slate-500">当前持仓</span><span className="text-emerald-400 font-mono">多 1手 @ 21,430.25</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">止损保护</span><span className="text-rose-300 font-mono">21,421.25 · 挂单中</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">止盈保护</span><span className="text-emerald-300 font-mono">21,443.75 · 挂单中</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">最后可靠价格</span><span className="font-mono text-slate-200">{CURR_P.toFixed(2)}</span></div>
                  </div>
                  <p className="text-amber-300">若保护无法闭合，将进入「未完成收尾」状态。</p>
                </>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                ref={cancel} onClick={() => onCancel()}
                className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-[13px] text-slate-300 hover:bg-white/[0.06]"
              >
                取消
              </button>
              <button
                onClick={() => { onConfirm() }}
                className={`rounded-lg px-5 py-2 text-[13px] font-semibold ${
                  mode === "emergency" ? "bg-[#9f1239] text-white hover:bg-[#881337]" : "bg-[#92400e] text-white hover:bg-[#78350f]"
                }`}
              >
                {mode === "normal" ? "确认正常停止" : "确认紧急停止"}
              </button>
            </div>
  </dialog>
}

// 实盘信号接入卡片 —— 与模拟列表「接入 / 断开信号出口」同读同写 store.outlets（按品种）
// 精简：连接状态 + 目标；未接入时「接入」为主按钮；「配置」链接；「断开」收进「更多」。关闭出口永远不会停止模拟。
function OutletCard({ sim, isLive, onManage }: { sim: SimInfo; isLive: boolean; onManage: () => void }) {
  const outlet = useOutlet()
  const [confirmOff, setConfirmOff] = useState(false)
  const disconnectDialog = useRef<HTMLDialogElement>(null)
  const outletCard = useRef<HTMLDivElement>(null)
  const moreTrigger = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const node = disconnectDialog.current
    if (!node) return
    node.showModal()
    node.querySelector<HTMLButtonElement>('button[data-dialog-cancel]')?.focus()
    return () => {
      node.close()
      queueMicrotask(() => {
        if (moreTrigger.current?.isConnected) moreTrigger.current.focus()
        else outletCard.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus()
      })
    }
  }, [confirmOff])
  const [menu, setMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const sym = sim.contract.slice(0, 2)
  const linkedId = effectiveLink(outlet, sym)
  const linked = linkedId === sim.id
  const otherSim = !linked && linkedId ? simById(linkedId) : undefined
  const other = !linked && linkedId ? { id: linkedId, name: otherSim ? simName(otherSim) : linkedId } : null
  const retained = !linked && outlet.gate !== "open" && outlet.outlets[sym as keyof typeof outlet.outlets] === sim.id
  const rot = outlet.gate === "open" && outlet.cred.state === "rotating"

  useEffect(() => {
    if (!menu) return
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setMenu(false) }
    const c = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false) }
    document.addEventListener("keydown", k); document.addEventListener("mousedown", c)
    return () => { document.removeEventListener("keydown", k); document.removeEventListener("mousedown", c) }
  }, [menu])

  // 接入资格：可接入时为 null，否则为具体缺失原因
  const why = !isLive || sim.runKind !== "live_sim" ? "仅运行中的实时模拟可接入"
    : outlet.gate === "closed" ? "信号出口发送已停止"
    : outlet.gate === "opening" ? "信号出口开启中"
    : outlet.cred.state === "invalid" ? "凭证已失效"
    : !outlet.readback ? "数据读回未接入"
    : other ? `${sym} 已由「${other.name}」接入，需先在原模拟断开`
    : null

  const leader = outlet.accts.find((a) => a.role === "leader")
  const followers = outlet.accts.filter((a) => a.role === "follower").length
  const target = leader ? `信号账户 ··${leader.tail} · 跟随 ${followers}` : NA

  const connect = () => {
    setOutlet(sym, sim.id)
    logEvent({ kind: "state", type: "接出口", obj: `模拟 ${sim.name}`, change: "接入信号出口", result: "已生效", tone: "muted" })
  }
  const disconnect = () => {
    setOutlet(sym, null)
    logEvent({ kind: "state", type: "断出口", obj: `模拟 ${sim.name}`, change: "断开信号出口", result: "已生效 · 模拟照常运行", tone: "muted" })
    setConfirmOff(false)
  }

  const ring = "outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50"
  const hint = linked ? (rot ? "凭证轮换中 · 这段时间的信号不补发" : null) : retained ? "信号出口发送已停止 · 接入参数已保留，模拟照常运行" : why

  return (
    <div ref={outletCard} className="rounded-lg border border-white/[0.06] bg-[#0a0e16] p-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="whitespace-nowrap text-[14px] font-semibold text-slate-100">实盘信号接入</h2>
        <span className={`flex items-center gap-1.5 whitespace-nowrap text-[11px] ${linked ? "text-emerald-400" : "text-slate-500"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${linked ? (rot ? "bg-amber-400" : "animate-pulse bg-emerald-400") : "bg-slate-600"}`} />{linked ? "已接入" : "未接入"}
        </span>
      </div>

      {linked && <div className="mt-2 truncate text-[12px] text-slate-300" title={target}>{target}</div>}
      {hint && <div className="mt-2 text-[11px] leading-snug text-amber-300/90">{hint}</div>}

      <div className="mt-3 flex items-center gap-2">
        {!linked && (
          <button disabled={!!why} onClick={connect}
            className={`whitespace-nowrap rounded-md bg-sky-600 px-3 py-1 text-[12px] font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-white/[0.05] disabled:text-slate-600 ${ring}`}>接入</button>
        )}
        <button onClick={onManage} className={`whitespace-nowrap rounded px-1.5 py-1 text-[12px] text-sky-300 underline-offset-2 hover:underline ${ring}`}>配置</button>
        {linked && (
          <div ref={menuRef} className="relative ml-auto">
            <button ref={moreTrigger} onClick={() => setMenu((v) => !v)} aria-expanded={menu} aria-haspopup="menu"
              className={`whitespace-nowrap rounded-md border border-white/[0.08] px-2.5 py-1 text-[12px] text-slate-300 hover:bg-white/[0.06] ${ring}`}>更多</button>
            {menu && (
              <div role="menu" className="absolute right-0 top-full z-40 mt-1 min-w-[96px] rounded-lg border border-white/[0.1] bg-[#0a0d14] p-1 shadow-xl">
                <button role="menuitem" onClick={() => { setMenu(false); setConfirmOff(true) }}
                  className={`block w-full whitespace-nowrap rounded px-3 py-1.5 text-left text-[12px] text-rose-300 hover:bg-rose-500/10 ${ring}`}>断开</button>
              </div>
            )}
          </div>
        )}
      </div>

      {confirmOff && (
        <dialog ref={disconnectDialog} aria-label="确认断开实盘信号接入" onCancel={event => { event.preventDefault(); setConfirmOff(false) }} className="m-auto w-[calc(100%-2rem)] max-w-[420px] border-0 bg-transparent p-0 text-slate-200 backdrop:bg-black/60">
          <div className="relative max-h-[calc(100vh-2rem)] w-full max-w-[420px] overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#0a0d14] p-6 shadow-2xl">
            <h2 className="text-[16px] font-bold text-slate-100">确认断开实盘信号接入</h2>
            <div className="mt-3 space-y-2 text-[13px] text-slate-400">
              <p>将断开 <span className="font-mono text-slate-200">{sym}</span> 的信号接入，之后不再向实盘账户同步信号。</p>
              <p className="text-slate-300">关闭出口不会停止模拟，模拟照常运行；已发出的订单不受影响。</p>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button data-dialog-cancel="" onClick={() => setConfirmOff(false)} className={`whitespace-nowrap rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-[13px] text-slate-300 hover:bg-white/[0.06] ${ring}`}>取消</button>
              <button onClick={disconnect} className={`whitespace-nowrap rounded-lg bg-rose-600 px-5 py-2 text-[13px] font-semibold text-white hover:bg-rose-500 ${ring}`}>确认断开</button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  )
}


export default function SampleSimWorkbench() {
  const query = new URLSearchParams(location.search), inner = new URLSearchParams(location.hash.split('?')[1] ?? '');
  const ids = inner.getAll('simId'), valid = !query.has('simId') && ids.length === 1 && Boolean(ids[0]);
  const state = parseDemoState(query.get('state') ?? undefined);
  useEffect(() => valid ? mountSampleMock() : undefined, [valid]);
  return <div className="source-prototype" data-sample-view="workbench"><MockControls state={state}/>
    {!valid ? <main><h1>模拟工作台</h1><p role="alert">记录参数缺失或冲突，未选择工作台。</p><a href="#simulation">返回模拟记录</a></main>
      : ['loading','empty'].includes(state) ? <main><h1>模拟工作台</h1><p>{state==='loading'?'正在加载模拟工作台…':'暂无工作台数据'}</p></main>
      : <SourceSimWorkbench simId={ids[0]} onBack={() => { location.hash='simulation' }}/>}</div>;
}
