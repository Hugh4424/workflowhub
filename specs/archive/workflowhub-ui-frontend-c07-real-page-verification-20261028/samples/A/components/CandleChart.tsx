import { useMemo } from "react"
import { MOCK_NQ_QUOTE } from "../lib/fixtures"

// Translate the original synthetic domain without changing its shape.
const sourcePrice = (value: number) => MOCK_NQ_QUOTE + value - 30040

interface Row {
  price: number
  bid: number // left cluster (green)
  ask: number // right cluster (blue)
}
interface Candle {
  o: number
  h: number
  l: number
  c: number
  vol: number
  poc: number
  rows: Row[]
}

function makeRand(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function buildCandles(count: number): Candle[] {
  const rand = makeRand(24680)
  const candles: Candle[] = []
  let price = sourcePrice(30015)
  const tick = 1.25
  for (let i = 0; i < count; i++) {
    const wave = Math.sin(i / 8) * 26 + Math.sin(i / 3.2) * 8
    const target = sourcePrice(30025) + wave
    const drift = (target - price) * 0.28
    const o = price
    const move = drift + (rand() - 0.5) * 16
    const c = o + move
    const h = Math.max(o, c) + rand() * 10 + 2
    const l = Math.min(o, c) - rand() * 10 - 2
    const vol = 40 + rand() * 120 + (i > count * 0.9 ? 220 : 0)

    const rows: Row[] = []
    const nRows = Math.max(3, Math.round((h - l) / tick))
    let pocVol = -1
    let poc = c
    for (let r = 0; r <= nRows; r++) {
      const rp = l + (r / nRows) * (h - l)
      const dist = Math.abs(rp - (o + c) / 2) / ((h - l) / 2 || 1)
      const base = (1 - dist * 0.8) * (0.5 + rand() * 0.9)
      const ask = base * (0.5 + rand()) // right / blue (volume)
      const bid = base * (0.5 + rand()) // left / green (delta)
      rows.push({ price: rp, bid, ask })
      if (ask + bid > pocVol) {
        pocVol = ask + bid
        poc = rp
      }
    }
    candles.push({ o, h, l, c, vol, poc, rows })
    price = c
  }
  return candles
}

function movingAvg(data: number[], period: number): number[] {
  return data.map((_, i) => {
    const start = Math.max(0, i - period + 1)
    const slice = data.slice(start, i + 1)
    return slice.reduce((a, b) => a + b, 0) / slice.length
  })
}

const TIMES = ["17:10", "17:20", "17:30", "17:40", "17:50", "18:00", "18:10", "18:20", "18:30", "18:40", "18:50", "19:00", "19:10", "19:20", "19:30", "19:40", "19:50", "20:00"]

export interface FootprintOverlay {
  entry: number
  tp: number
  sl: number
  qty: number
  pnl: string
  pnlPos: boolean
  tpTicks: string
  slTicks: string
}

export default function CandleChart({ overlay }: { overlay?: FootprintOverlay } = {}) {
  const count = 54
  const { candles, ma50, upper, lower, min, max, maxRowVol } = useMemo(() => {
    const candles = buildCandles(count)
    const closes = candles.map((c) => c.c)
    const ma20 = movingAvg(closes, 18)
    const ma50 = movingAvg(closes, 40)
    const upper = ma20.map((m, i) => m + 34 + Math.sin(i / 7) * 8)
    const lower = ma20.map((m, i) => m - 34 - Math.sin(i / 5) * 8)
    const allHi = Math.max(...candles.map((c) => c.h), ...upper)
    const allLo = Math.min(...candles.map((c) => c.l), ...lower)
    let maxRowVol = 0
    candles.forEach((c) => c.rows.forEach((r) => (maxRowVol = Math.max(maxRowVol, r.bid, r.ask))))
    return { candles, ma20, ma50, upper, lower, min: allLo - 8, max: allHi + 8, maxRowVol }
  }, [])

  const W = 1200
  const H = 620
  const priceRange = max - min
  const plotRight = W - 62
  const plotW = plotRight

  const x = (i: number) => (i / (count - 1)) * plotW
  const y = (p: number) => ((max - p) / priceRange) * H
  const slot = plotW / count
  const cw = slot * 0.82
  const bodyW = Math.max(2, slot * 0.16)
  const wickW = Math.max(1, slot * 0.05)

  const path = (arr: number[]) => arr.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")
  const priceLabels = [29990, 30005.75, 30010, 30020, 30040, 30050, 30060, 30070].map(sourcePrice)
  const maxVol = Math.max(...candles.map((c) => c.vol))
  const last = candles[count - 1]
  const quoteY = y(sourcePrice(30040))
  const quoteTagY = overlay && Math.abs(quoteY - y(overlay.entry)) < 18 ? y(overlay.entry) - 18 : quoteY
  const tagCenters = [y(sourcePrice(30005.75)), quoteTagY, ...(overlay ? [y(overlay.tp), y(overlay.entry), y(overlay.sl)] : [])]

  return (
    <div className="flex h-full min-h-0 flex-col">
      <svg viewBox={`0 0 ${W} ${H}`} className="min-h-0 w-full flex-1" preserveAspectRatio="none">
        {/* horizontal gridlines + price axis */}
        {priceLabels.map((p, gi) => (
          <g key={gi}>
            <line x1={0} x2={plotRight} y1={y(p)} y2={y(p)} stroke="rgba(255,255,255,0.028)" />
            <text x={plotRight + 6} y={y(p) + 3} visibility={tagCenters.some(center => Math.abs(y(p) - center) < 16) ? "hidden" : undefined} fill="#94a3b8" fontSize="8.5" fontFamily="JetBrains Mono">{p.toFixed(2)}</text>
          </g>
        ))}

        {/* session volume profile on far left */}
        {candles.slice(0, 40).map((c, i) => {
          const py = y(min + (priceRange * i) / 40)
          const isBuy = i % 3 !== 0
          const len = 14 + ((i * 41) % 74)
          return <rect key={i} x={0} y={py} width={len} height={(priceRange / 40 / priceRange) * H * 0.8} fill={isBuy ? "rgba(34,197,94,0.4)" : "rgba(244,63,94,0.4)"} />
        })}

        {/* trade zones */}
        <rect x={x(9)} y={y(sourcePrice(30020))} width={x(15) - x(9)} height={y(sourcePrice(29988)) - y(sourcePrice(30020))} fill="rgba(244,63,94,0.09)" stroke="rgba(244,63,94,0.28)" strokeWidth="0.8" />
        <rect x={x(27)} y={y(sourcePrice(30058))} width={x(30) - x(27)} height={y(sourcePrice(30032)) - y(sourcePrice(30058))} fill="rgba(244,63,94,0.09)" stroke="rgba(244,63,94,0.28)" strokeWidth="0.8" />

        {/* MA / bands */}
        <path d={path(upper)} fill="none" stroke="rgba(239,68,68,0.65)" strokeWidth="1.2" />
        <path d={path(lower)} fill="none" stroke="rgba(34,197,94,0.65)" strokeWidth="1.2" />
        <path d={path(ma50)} fill="none" stroke="rgba(148,163,184,0.5)" strokeWidth="1" strokeDasharray="4 3" />

        {/* footprint candles */}
        {candles.map((c, i) => {
          const cx = x(i)
          const up = c.c >= c.o
          const half = cw / 2
          const nRows = c.rows.length
          const rh = Math.max(1.4, ((y(c.l) - y(c.h)) / nRows) * 0.82)
          return (
            <g key={i}>
              {/* per-bar background box */}
              <rect x={cx - half} y={y(c.h)} width={cw} height={Math.max(1, y(c.l) - y(c.h))} fill="rgba(148,163,184,0.05)" />
              {/* wick */}

              {/* footprint clusters: left = green delta, right = blue volume */}
              {c.rows.map((r, ri) => {
                const ry = y(r.price) - rh / 2
                const bidW = (r.bid / maxRowVol) * half
                const askW = (r.ask / maxRowVol) * half
                return (
                  <g key={ri}>
                    <rect x={cx - bidW} y={ry} width={bidW} height={rh} fill="rgba(34,197,94,0.5)" />
                    <rect x={cx} y={ry} width={askW} height={rh} fill="rgba(96,165,250,0.45)" />
                  </g>
                )
              })}
              {/* Keep the high/low wick above translucent footprint cells. */}
              <rect x={cx - wickW / 2} y={y(c.h)} width={wickW} height={Math.max(1, y(c.l) - y(c.h))} fill={up ? "#64df95" : "#ff8aa1"} />
              {/* candle body */}
              <rect
                x={cx - bodyW / 2}
                y={y(Math.max(c.o, c.c))}
                width={bodyW}
                height={Math.max(1.5, Math.abs(y(c.o) - y(c.c)))}
                fill={up ? "#22c55e" : "#ef4444"}
                stroke={up ? "#64df95" : "#fda4af"} strokeWidth="1"
              />
              {/* POC orange line */}
              <line x1={cx - half} x2={cx + half} y1={y(c.poc)} y2={y(c.poc)} stroke="#f59e0b" strokeWidth={Math.max(2.5, rh * 0.7)} strokeLinecap="butt" />
            </g>
          )
        })}

        {/* white marker lines on a couple bars */}
        <line x1={x(9) - cw / 2} x2={x(11)} y1={y(sourcePrice(30016))} y2={y(sourcePrice(30016))} stroke="rgba(255,255,255,0.85)" strokeWidth="1" />
        <line x1={x(27) - cw / 2} x2={x(28)} y1={y(sourcePrice(30057))} y2={y(sourcePrice(30057))} stroke="rgba(255,255,255,0.85)" strokeWidth="1" />

        {/* trade markers + dashed paths */}
        <g>
          <path d={`M${x(9)},${y(sourcePrice(30015))} L${x(15)},${y(sourcePrice(29989))}`} stroke="#eab308" strokeWidth="1" strokeDasharray="4 3" fill="none" />
          <polygon points={`${x(9)},${y(sourcePrice(30012))} ${x(9) - 5},${y(sourcePrice(30012)) + 9} ${x(9) + 5},${y(sourcePrice(30012)) + 9}`} fill="#22c55e" />
          <polygon points={`${x(15)},${y(sourcePrice(29992))} ${x(15) - 5},${y(sourcePrice(29992)) - 9} ${x(15) + 5},${y(sourcePrice(29992)) - 9}`} fill="#ef4444" />
          <path d={`M${x(27)},${y(sourcePrice(30056))} L${x(30)},${y(sourcePrice(30036))}`} stroke="#eab308" strokeWidth="1" strokeDasharray="4 3" fill="none" />
          <polygon points={`${x(27)},${y(sourcePrice(30058))} ${x(27) - 5},${y(sourcePrice(30058)) - 9} ${x(27) + 5},${y(sourcePrice(30058)) - 9}`} fill="#22c55e" />
          <polygon points={`${x(30)},${y(sourcePrice(30033))} ${x(30) - 5},${y(sourcePrice(30033)) + 9} ${x(30) + 5},${y(sourcePrice(30033)) + 9}`} fill="#ef4444" />
        </g>

        {/* current price line */}
        <line x1={0} x2={plotRight} y1={y(sourcePrice(30040))} y2={y(sourcePrice(30040))} stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="4 4" />
        <rect x={plotRight} y={y(sourcePrice(30005.75)) - 8} width={62} height={16} fill="#3b4252" />
        <text x={plotRight + 31} y={y(sourcePrice(30005.75)) + 3} fill="#e5e9f0" fontSize="8.5" fontFamily="JetBrains Mono" textAnchor="middle">{sourcePrice(30005.75).toFixed(2)}</text>
        {quoteTagY !== quoteY && <path d={`M${plotRight - 4},${quoteY} H${plotRight} V${quoteTagY}`} fill="none" stroke="#f59e0b" strokeWidth="1" />}
        <rect x={plotRight} y={quoteTagY - 8} width={62} height={16} fill="#f59e0b" />
        <text x={plotRight + 31} y={quoteTagY + 3} fill="#0a0e16" fontSize="8.5" fontFamily="JetBrains Mono" textAnchor="middle" fontWeight="600">{MOCK_NQ_QUOTE.toFixed(2)}</text>

        {/* ─── Live position / TP / SL overlay (right-side tags only) ── */}
        {overlay && (
          <g fontFamily="JetBrains Mono">
            {/* TP tag */}
            <rect x={plotRight - 96} y={y(overlay.tp) - 9} width={158} height={18} rx={2} fill="#00c9a0" />
            <text x={plotRight - 88} y={y(overlay.tp) + 4} fontSize="9.5" fill="#021a14" fontWeight="700">
              × {overlay.qty} TP {overlay.tpTicks}
            </text>
            <text x={plotRight + 31} y={y(overlay.tp) + 4} textAnchor="middle" fontSize="9.5" fill="#021a14" fontWeight="700">
              {overlay.tp.toFixed(2)}
            </text>

            {/* Entry / floating P&L tag */}
            <rect x={plotRight - 96} y={y(overlay.entry) - 9} width={158} height={18} rx={2}
              fill={overlay.pnlPos ? "#064020" : "#400606"} stroke={overlay.pnlPos ? "#64df95" : "#ff8aa1"} strokeWidth="0.8" />
            <text x={plotRight - 88} y={y(overlay.entry) + 4} fontSize="9.5" fill={overlay.pnlPos ? "#64df95" : "#ff8aa1"} fontWeight="700">
              {overlay.qty}手 {overlay.pnl}
            </text>
            <text x={plotRight + 31} y={y(overlay.entry) + 4} textAnchor="middle" fontSize="9.5" fill={overlay.pnlPos ? "#64df95" : "#ff8aa1"} fontWeight="700">
              {overlay.entry.toFixed(2)}
            </text>

            {/* SL tag */}
            <rect x={plotRight - 96} y={y(overlay.sl) - 9} width={158} height={18} rx={2} fill="#ff4060" />
            <text x={plotRight - 88} y={y(overlay.sl) + 4} fontSize="9.5" fill="#17080d" fontWeight="700">
              × {overlay.qty} SL {overlay.slTicks}
            </text>
            <text x={plotRight + 31} y={y(overlay.sl) + 4} textAnchor="middle" fontSize="9.5" fill="#17080d" fontWeight="700">
              {overlay.sl.toFixed(2)}
            </text>
          </g>
        )}
      </svg>

      {/* volume histogram */}
      <div className="mt-1.5 shrink-0">
        <div className="mb-1 text-[9.5px] text-slate-500">成交量</div>
        <svg viewBox={`0 0 ${W} 48`} className="w-full" style={{ height: 44 }} preserveAspectRatio="none">
          {candles.map((c, i) => {
            const up = c.c >= c.o
            const h = (c.vol / maxVol) * 42
            return <rect key={i} x={x(i) - cw / 2} y={46 - h} width={cw} height={h} fill={up ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)"} />
          })}
        </svg>
      </div>

      {/* time axis */}
      <div className="mt-1 flex shrink-0 justify-between px-1 font-mono text-[9.5px] text-slate-500">
        {TIMES.map((t, i) => (
          <span key={i} className={i === 5 || i === 11 || i === 17 ? "font-semibold text-slate-300" : ""}>{t}</span>
        ))}
      </div>
    </div>
  )
}
