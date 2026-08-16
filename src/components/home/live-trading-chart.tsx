"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion, useReducedMotion } from "framer-motion";
import { Activity, ArrowDownRight, ArrowUpRight, Cpu, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/* ----------------------------------------------------------------------------
 * LiveTradingChart
 * -------------------------------------------------------------------------
 * A self-contained "trading app" mockup: an animated area chart that ticks
 * forward in real time, plus a side panel of live AI trade signals. Purely
 * decorative — no real data — but it reads as a genuine trading surface,
 * which is what makes the marketing page feel like the product.
 * ----------------------------------------------------------------------- */

type Candle = { t: string; v: number };

const START = 1.024;

/** Deterministic-ish random walk so the line looks like a real asset. */
function step(prev: number): number {
  const drift = 0.0008;
  const vol = 0.006;
  const shock = (Math.random() - 0.5) * 2 * vol;
  return Math.max(0.2, prev * (1 + drift + shock));
}

function seed(n: number): Candle[] {
  const out: Candle[] = [];
  let v = START;
  const now = Date.now();
  for (let i = n; i > 0; i--) {
    v = step(v);
    out.push({
      t: new Date(now - i * 2000).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      v: Number(v.toFixed(4)),
    });
  }
  return out;
}

const SIGNALS = [
  { pair: "BTC/USDT", side: "BUY", px: "68,420.50", pct: "+2.34%", win: true },
  { pair: "ETH/USDT", side: "BUY", px: "3,825.10", pct: "+1.82%", win: true },
  { pair: "SOL/USDT", side: "SELL", px: "184.32", pct: "-0.64%", win: false },
  { pair: "D2X/USDT", side: "BUY", px: "1.0240", pct: "+0.41%", win: true },
  { pair: "BNB/USDT", side: "BUY", px: "612.88", pct: "+3.07%", win: true },
  { pair: "XRP/USDT", side: "SELL", px: "0.6234", pct: "-1.12%", win: false },
];

type TooltipProps = {
  active?: boolean;
  payload?: { payload: Candle }[];
};

function ChartTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-white/10 bg-[var(--logo-navy-900)]/90 px-3 py-2 text-xs backdrop-blur-md">
      <div className="text-muted-foreground">{p.t}</div>
      <div className="font-semibold text-[var(--logo-gold-200)]">
        ${p.v.toFixed(4)}
      </div>
    </div>
  );
}

export default function LiveTradingChart({ showHeading = true }: { showHeading?: boolean }) {
  const reduce = useReducedMotion();
  const [data, setData] = useState<Candle[]>(() => seed(40));
  const [pulse, setPulse] = useState(0);
  const [signalIdx, setSignalIdx] = useState(0);
  const mounted = useRef(true);

  // Live tick — append a new point every 2s, drop the oldest.
  useEffect(() => {
    mounted.current = true;
    if (reduce) return;
    const id = setInterval(() => {
      setData((prev) => {
        const last = prev[prev.length - 1];
        const next = Number(step(last.v).toFixed(4));
        const t = new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        const out = [...prev.slice(1), { t, v: next }];
        setPulse((p) => p + 1);
        return out;
      });
    }, 2000);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [reduce]);

  // Rotate the highlighted AI signal.
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(
      () => setSignalIdx((i) => (i + 1) % SIGNALS.length),
      2200,
    );
    return () => clearInterval(id);
  }, [reduce]);

  const last = data[data.length - 1]?.v ?? START;
  const first = data[0]?.v ?? START;
  const change = ((last - first) / first) * 100;
  const up = change >= 0;

  const stats = useMemo(
    () => [
      { label: "24h Volume", value: "$48.2M", icon: Activity },
      { label: "Active Pairs", value: "120+", icon: Zap },
      { label: "AI Signals / min", value: "34", icon: Cpu },
      { label: "Win Rate", value: "99.6%", icon: ArrowUpRight },
    ],
    [],
  );

  const chartContent = (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 32 }}
      whileInView={showHeading ? { opacity: 1, y: 0 } : undefined}
      animate={showHeading ? undefined : { opacity: 1, y: 0 }}
      viewport={showHeading ? { once: true, margin: "-80px" } : undefined}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: showHeading ? 0.1 : 0 }}
      className="gold-ring overflow-hidden rounded-2xl"
    >
      <div className="grid gap-0 rounded-2xl border border-white/5 bg-card/70 backdrop-blur-md lg:grid-cols-[1.6fr_1fr]">
            {/* Chart panel */}
            <div className="relative p-5 md:p-6">
              {/* header row */}
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-(--logo-gold-400)/10 text-(--logo-gold-300) ring-1 ring-(--logo-gold-400)/25">
                    <Activity className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        D2X / USDT
                      </span>
                      <span className="rounded bg-(--logo-gold-400)/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-(--logo-gold-300)">
                        AI Pool
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-mono text-lg font-semibold text-foreground tabular">
                        ${last.toFixed(4)}
                      </span>
                      <span
                        className={cn(
                          "flex items-center gap-0.5 font-medium tabular",
                          up ? "text-profit" : "text-loss",
                        )}
                      >
                        {up ? (
                          <ArrowUpRight className="size-3.5" />
                        ) : (
                          <ArrowDownRight className="size-3.5" />
                        )}
                        {up ? "+" : ""}
                        {change.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1.5 rounded-full bg-profit/10 px-2.5 py-1 font-medium text-profit">
                    <span className="relative flex h-1.5 w-1.5">
                      <span
                        className="absolute inline-flex h-full w-full rounded-full bg-profit opacity-75"
                        style={{
                          animation: reduce
                            ? undefined
                            : "glow-pulse 1.4s ease-in-out infinite",
                        }}
                      />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-profit" />
                    </span>
                    LIVE
                  </span>
                  <span className="text-muted-foreground">2s tick</span>
                </div>
              </div>

              {/* chart */}
              <div className="relative h-64 w-full md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="d2xArea" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="var(--logo-gold-400)"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="100%"
                          stopColor="var(--logo-gold-400)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient id="d2xLine" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="var(--logo-navy-300)" />
                        <stop offset="55%" stopColor="var(--logo-gold-300)" />
                        <stop offset="100%" stopColor="var(--logo-gold-100)" />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="t"
                      tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={48}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      domain={["dataMin - 0.01", "dataMax + 0.01"]}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      width={56}
                      tickFormatter={(v: number) => `$${v.toFixed(3)}`}
                    />
                    <Tooltip
                      content={<ChartTooltip />}
                      cursor={{ stroke: "var(--logo-gold-400)", strokeOpacity: 0.3 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke="url(#d2xLine)"
                      strokeWidth={2}
                      fill="url(#d2xArea)"
                      isAnimationActive={!reduce}
                      animationDuration={600}
                      dot={false}
                      activeDot={{
                        r: 4,
                        fill: "var(--logo-gold-300)",
                        stroke: "var(--logo-navy-900)",
                        strokeWidth: 2,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>

                {/* pulse flash on new tick */}
                <motion.div
                  key={pulse}
                  initial={reduce ? false : { opacity: 0.6 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="pointer-events-none absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--logo-gold-300)]"
                />
              </div>

              {/* mini stats strip */}
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
                  >
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <s.icon className="size-3 text-(--logo-gold-300)" />
                      {s.label}
                    </div>
                    <div className="mt-0.5 font-semibold text-foreground tabular">
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI signals panel */}
            <div className="border-t border-white/5 p-5 md:p-6 lg:border-l lg:border-t-0">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="size-4 text-(--logo-gold-300)" />
                  <span className="text-sm font-semibold text-foreground">
                    AI Trade Signals
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">auto</span>
              </div>

              <div className="space-y-2">
                {SIGNALS.map((s, i) => {
                  const active = i === signalIdx;
                  return (
                    <motion.div
                      key={s.pair}
                      animate={
                        reduce
                          ? undefined
                          : {
                              borderColor: active
                                ? "var(--logo-gold-400)"
                                : "rgba(255,255,255,0.05)",
                              backgroundColor: active
                                ? "rgba(224,176,64,0.07)"
                                : "rgba(255,255,255,0.02)",
                            }
                      }
                      transition={{ duration: 0.4 }}
                      className="flex items-center justify-between rounded-lg border px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                            s.side === "BUY"
                              ? "bg-profit/15 text-profit"
                              : "bg-loss/15 text-loss",
                          )}
                        >
                          {s.side}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {s.pair}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="font-mono text-muted-foreground tabular">
                          {s.px}
                        </span>
                        <span
                          className={cn(
                            "flex items-center gap-0.5 font-medium tabular",
                            s.win ? "text-profit" : "text-loss",
                          )}
                        >
                          {s.win ? (
                            <ArrowUpRight className="size-3" />
                          ) : (
                            <ArrowDownRight className="size-3" />
                          )}
                          {s.pct}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* live PnL meter */}
              <div className="mt-5 rounded-lg border border-(--logo-gold-400)/20 bg-linear-to-br from-(--logo-gold-400)/10 to-transparent p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Session PnL (simulated)</span>
                  <span className="text-(--logo-gold-300)">AI Auto</span>
                </div>
                <motion.div
                  key={Math.floor(pulse / 3)}
                  initial={reduce ? false : { opacity: 0.5 }}
                  animate={{ opacity: 1 }}
                  className="mt-1 font-mono text-2xl font-semibold text-profit tabular"
                >
                  +${(1240.5 + pulse * 3.2).toFixed(2)}
                </motion.div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    initial={{ width: "62%" }}
                    animate={{ width: `${62 + (pulse % 20)}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-full rounded-full bg-linear-to-r from-(--logo-gold-500) to-(--logo-gold-200)"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
  );

  return (
    <>
      {showHeading ? (
        <section className="relative overflow-hidden border-y border-white/5 bg-[var(--logo-navy-900)]/40 py-24">
          {/* ambient glow */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div
              className="absolute left-1/2 top-1/2 h-[26rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
              style={{
                background:
                  "radial-gradient(circle, var(--logo-gold-400)/12, transparent 70%)",
              }}
            />
          </div>

          <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mb-10 text-center"
            >
              <p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-(--logo-gold-300)">
                <span className="h-px w-8 bg-linear-to-r from-transparent to-[var(--logo-gold-400)]" />
                Live Trading Engine
                <span className="h-px w-8 bg-gradient-to-l from-transparent to-[var(--logo-gold-400)]" />
              </p>
              <h2 className="text-3xl font-semibold text-foreground md:text-4xl">
                Real-Time AI Market Execution
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
                Watch the Dollar2X engine scan, signal, and execute across global
                markets — the same technology powering every member account.
              </p>
            </motion.div>
            {chartContent}
          </div>
        </section>
      ) : (
        chartContent
      )}
    </>
  );
}
