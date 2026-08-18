"use client";

import Image from "next/image";
import Link from "next/link";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Brain,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock,
  Coins,
  FileText,
  Globe2,
  Handshake,
  Landmark,
  LayoutDashboard,
  LineChart,
  MapPin,
  Scale,
  Shield,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import Container from "@/components/global/container";
import FloatingLines from "@/components/common/floating-lines";
import LiveTradingChart from "@/components/home/live-trading-chart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";

/* ----------------------------------------------------------------------------
 * Motion primitives
 * ------------------------------------------------------------------------- */

const EASE = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

/** Scroll-reveal wrapper. Respects prefers-reduced-motion. */
function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Count-up number that triggers when scrolled into view. */
function CountUp({
  to,
  suffix = "",
  prefix = "",
  decimals = 0,
  duration = 1.8,
}: {
  to: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();
  const [val, setVal] = useState(0);
  const mv = useMotionValue(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setVal(to);
      return;
    }
    const controls = animate(mv, to, {
      duration,
      ease: EASE,
      onUpdate: (v) => setVal(v),
    });
    return () => controls.stop();
  }, [inView, to, duration, reduce, mv]);

  return (
    <span ref={ref}>
      {prefix}
      {val.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

/* ----------------------------------------------------------------------------
 * Shared presentational helpers
 * ------------------------------------------------------------------------- */

function SectionHeading({
  eyebrow,
  title,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  align?: "left" | "center";
}) {
  return (
    <Reveal
      className={cn(
        "mb-12 max-w-3xl",
        align === "center" && "mx-auto text-center",
      )}
    >
      <p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--logo-gold-300)]">
        <span className="h-px w-8 bg-gradient-to-r from-transparent to-[var(--logo-gold-400)]" />
        {eyebrow}
      </p>
      <h2 className="text-3xl font-semibold leading-tight text-foreground md:text-4xl">
        {title}
      </h2>
    </Reveal>
  );
}

function GoldCard({
  children,
  className,
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={cn(
        "gold-ring group relative overflow-hidden rounded-xl",
        glow && "shadow-[0_0_40px_-12px_var(--logo-gold-400)]",
        className,
      )}
    >
      <Card className="h-full border-white/5 bg-card/80 backdrop-blur-sm transition-colors group-hover:bg-card">
        {children}
      </Card>
      {/* hover sheen */}
      <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[var(--logo-gold-200)]/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
    </motion.div>
  );
}

function IconBadge({
  icon: Icon,
  variant = "gold",
}: {
  icon: React.ComponentType<{ className?: string }>;
  variant?: "gold" | "navy";
}) {
  return (
    <div
      className={cn(
        "mb-4 flex h-11 w-11 items-center justify-center rounded-xl ring-1 transition-transform duration-300 group-hover:scale-110",
        variant === "gold"
          ? "bg-[var(--logo-gold-400)]/10 text-[var(--logo-gold-300)] ring-[var(--logo-gold-400)]/25"
          : "bg-[var(--logo-navy-400)]/20 text-[var(--logo-gold-200)] ring-[var(--logo-gold-400)]/15",
      )}
    >
      <Icon className="size-5" />
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Ticker
 * ------------------------------------------------------------------------- */

const TICKER = [
  { sym: "BTC/USDT", val: "68,420.50", up: true, pct: "+2.34%" },
  { sym: "ETH/USDT", val: "3,825.10", up: true, pct: "+1.82%" },
  { sym: "AI-POOL", val: "99.6%", up: true, pct: "accuracy" },
  { sym: "SOL/USDT", val: "184.32", up: false, pct: "-0.64%" },
  { sym: "D2X/USDT", val: "1.0240", up: true, pct: "+0.41%" },
  { sym: "BNB/USDT", val: "612.88", up: true, pct: "+3.07%" },
  { sym: "XRP/USDT", val: "0.6234", up: false, pct: "-1.12%" },
  { sym: "DOGE/USDT", val: "0.1742", up: true, pct: "+4.55%" },
];

function Ticker() {
  const row = [...TICKER, ...TICKER];
  return (
    <div className="relative overflow-hidden border-y border-white/5 bg-[var(--logo-navy-900)]/40 py-3 backdrop-blur-sm">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />
      <div
        className="flex w-max items-center gap-10 whitespace-nowrap"
        style={{ animation: "ticker-scroll 32s linear infinite" }}
      >
        {row.map((t, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-foreground">{t.sym}</span>
            <span className="text-muted-foreground tabular">{t.val}</span>
            <span
              className={cn(
                "flex items-center gap-0.5 font-medium",
                t.up ? "text-profit" : "text-loss",
              )}
            >
              {t.up ? (
                <TrendingUp className="size-3" />
              ) : (
                <ArrowUpRight className="size-3 rotate-90" />
              )}
              {t.pct}
            </span>
            <span className="text-[var(--logo-gold-400)]/40">•</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Hero
 * ------------------------------------------------------------------------- */

function Hero() {
  const reduce = useReducedMotion();
  return (
    <section className="relative overflow-hidden border-b border-white/5">
      {/* Animated navy + gold mesh */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% -10%, var(--logo-navy-400), transparent 60%), radial-gradient(ellipse 50% 50% at 15% 30%, var(--logo-gold-400)/14, transparent 55%), radial-gradient(ellipse 55% 55% at 85% 40%, var(--logo-navy-600)/40, transparent 60%)",
          }}
        />
        <div
          className="absolute -left-32 top-10 h-[28rem] w-[28rem] rounded-full blur-[110px]"
          style={{
            background:
              "radial-gradient(circle, var(--logo-gold-400)/22, transparent 70%)",
            animation: reduce ? undefined : "glow-pulse 7s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -right-24 bottom-0 h-[26rem] w-[26rem] rounded-full blur-[120px]"
          style={{
            background:
              "radial-gradient(circle, var(--logo-navy-300)/35, transparent 70%)",
            animation: reduce
              ? undefined
              : "glow-pulse 9s ease-in-out infinite 1.5s",
          }}
        />
      </div>

      {/* Floating streaks picked from the logo palette */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-70">
        <FloatingLines
          colors={[
            "#003080",
            "#002060",
            "#E0B040",
            "#F0D060",
            "#F0E070",
          ]}
          backgroundColor="transparent"
          speed={0.4}
          density={0.5}
          streakWidth={1.1}
          streakLength={1.2}
          glow={1.3}
          twinkle={1.1}
          zoom={3.2}
          backgroundGlow={0}
          opacity={0.9}
          mouseInteraction
          mouseStrength={0.6}
        />
      </div>

      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(var(--logo-gold-400) 1px, transparent 1px), linear-gradient(90deg, var(--logo-gold-400) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 60% 50% at 50% 35%, #000, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 60% 50% at 50% 35%, #000, transparent 75%)",
        }}
      />

      <Container className="relative flex flex-col items-center py-24 text-center md:py-36">
        {/* Floating logo with golden glow */}
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: EASE }}
          className="relative mb-10"
        >
          <div
            className="absolute inset-0 -z-10 rounded-full blur-2xl"
            style={{
              background:
                "radial-gradient(circle, var(--logo-gold-400)/45, transparent 70%)",
              animation: reduce ? undefined : "glow-pulse 5s ease-in-out infinite",
            }}
          />
          <div
            className="relative h-28 w-56 md:h-36 md:w-72"
            style={
              reduce ? undefined : { animation: "float-y 6s ease-in-out infinite" }
            }
          >
            <Image
              src="/images/home/d2x-logo.png"
              alt="Dollar2X Global Group Ltd"
              fill
              priority
              className="object-contain drop-shadow-[0_8px_30px_rgba(224,176,64,0.35)]"
            />
          </div>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--logo-gold-400)]/25 bg-[var(--logo-gold-400)]/10 px-4 py-1.5 text-sm font-medium text-[var(--logo-gold-200)] backdrop-blur-sm"
        >
          <Sparkles className="size-4 text-[var(--logo-gold-300)]" />
          Complete Investment &amp; Wealth Building Plan
        </motion.div>

        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease: EASE }}
          className="mb-6 max-w-4xl text-4xl font-semibold leading-[1.1] text-foreground md:text-6xl"
        >
          Smarter Wealth Building Through{" "}
          <span className="text-gradient-gold">AI-Powered</span> Trading
        </motion.h1>

        <motion.p
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
          className="mb-10 max-w-2xl text-lg text-muted-foreground"
        >
          Join Dollar2X Global Group Ltd for a transparent, automated, and secure
          approach to modern digital asset investing — no technical skills
          required.
        </motion.p>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.65, ease: EASE }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <Button asChild size="lg" className="btn-gold-shimmer gap-2 text-[var(--logo-navy-900)] hover:opacity-90">
            <Link href={ROUTES.signup}>
              Start Investing Now <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2 border-[var(--logo-gold-400)]/30 hover:border-[var(--logo-gold-400)]/60 hover:bg-[var(--logo-gold-400)]/5">
            <a href="#how-it-works">See How It Works</a>
          </Button>
        </motion.div>

        {/* Stat row */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-20 grid w-full max-w-4xl grid-cols-2 gap-4 md:grid-cols-4"
        >
          {[
            { v: <CountUp to={99.6} decimals={1} suffix="%" />, l: "AI Accuracy" },
            { v: <CountUp to={10000} suffix="+" />, l: "Data Points / sec" },
            { v: <CountUp to={150} suffix="+" />, l: "Countries Served" },
            { v: <CountUp to={10} suffix=" yr" />, l: "Strategic Partnership" },
          ].map((s, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="gold-ring rounded-xl"
            >
              <div className="rounded-xl border border-white/5 bg-card/60 px-4 py-5 backdrop-blur-sm">
                <div className="text-2xl font-semibold text-gradient-gold md:text-3xl">
                  {s.v}
                </div>
                <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                  {s.l}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Scroll cue */}
        <motion.a
          href="#about"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="mt-16 text-muted-foreground/60"
          aria-label="Scroll down"
        >
          <motion.span
            animate={reduce ? undefined : { y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="block"
          >
            <ChevronDown className="size-6" />
          </motion.span>
        </motion.a>
      </Container>
    </section>
  );
}

/* ----------------------------------------------------------------------------
 * Sections
 * ------------------------------------------------------------------------- */

function About() {
  const leaders = [
    { name: "Dr. James Anderson", role: "CEO & Chairman", exp: "25+ Years in FinTech & AI Trading" },
    { name: "Prof. Michael Thornton", role: "Founder & Chief Strategist", exp: "20+ Years in Financial Markets" },
    { name: "Ms. Sarah Williams", role: "Managing Director", exp: "18+ Years in Investment Management" },
  ];
  const offers = [
    ["AI Auto-Trading", "Automated trading without technical skills"],
    ["Real-Time Monitoring", "Complete visibility of account performance"],
    ["Multiple Income Opportunities", "Various earning channels within one ecosystem"],
    ["Secure Platform", "Advanced security and infrastructure support"],
    ["User-Friendly Dashboard", "Easy account management and tracking"],
  ];

  return (
    <section id="about" className="relative py-24">
      <Container>
        <SectionHeading eyebrow="Who We Are" title="Welcome to Dollar2X Global Group Ltd" />
        <div className="grid gap-8 lg:grid-cols-2">
          <Reveal className="space-y-6 text-muted-foreground">
            <p className="text-lg leading-relaxed text-foreground">
              Dollar2X Global Group Ltd is a technology-driven company focused on
              automated digital asset trading solutions. Our objective is to provide
              individuals worldwide with access to advanced trading technology through
              a simple, transparent, and user-friendly platform.
            </p>
            <p className="leading-relaxed">
              <strong className="text-foreground">Our mission</strong> is to make
              modern investment opportunities accessible to everyone by combining
              artificial intelligence, automation, and innovative financial
              technology. We aim to remove the complexity of traditional trading and
              create a platform where members can participate with confidence.
            </p>
            <p className="leading-relaxed">
              <strong className="text-foreground">Our vision</strong> is a world where
              financial growth is available to people from all backgrounds. Through
              continuous innovation, strategic partnerships, and advanced trading
              systems, we strive to build a sustainable ecosystem that supports
              long-term wealth creation.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <GoldCard glow>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="size-5 text-[var(--logo-gold-300)]" />
                  What We Offer
                </CardTitle>
                <CardDescription>
                  Benefits designed around your investment success.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-white/5">
                  {offers.map(([feature, benefit]) => (
                    <li key={feature} className="flex items-start justify-between gap-4 py-3">
                      <span className="font-medium text-foreground">{feature}</span>
                      <span className="text-right text-sm text-muted-foreground">
                        {benefit}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </GoldCard>
          </Reveal>
        </div>

        <div className="mt-16">
          <Reveal className="mb-8 text-center">
            <h3 className="text-2xl font-semibold text-foreground">Leadership Team</h3>
          </Reveal>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {leaders.map((leader) => (
              <GoldCard key={leader.name}>
                <CardHeader className="text-center">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[var(--logo-navy-500)] to-[var(--logo-navy-700)] text-xl font-semibold text-[var(--logo-gold-200)] ring-1 ring-[var(--logo-gold-400)]/30">
                    {leader.name.split(" ").slice(-2).map((n) => n[0]).join("")}
                  </div>
                  <CardTitle>{leader.name}</CardTitle>
                  <CardDescription>{leader.role}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-[var(--logo-gold-300)]">{leader.exp}</p>
                </CardContent>
              </GoldCard>
            ))}
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

function Corporate() {
  return (
    <section className="relative border-y border-white/5 bg-[var(--logo-navy-900)]/30 py-24">
      <Container>
        <SectionHeading
          eyebrow="Corporate Information"
          title="Dollar2X Global Group Ltd"
          align="left"
        />
        <Reveal>
          <GoldCard className="mx-auto max-w-4xl">
            <CardContent className="grid gap-8 p-8 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-foreground">
                  <Building2 className="size-5 text-[var(--logo-gold-300)]" />
                  <span className="font-medium">Colorado Corporation</span>
                </div>
                <div className="flex items-start gap-3 text-muted-foreground">
                  <MapPin className="mt-0.5 size-5 text-[var(--logo-gold-300)]" />
                  <address className="not-italic leading-relaxed">
                    1942 Broadway Street, Suite 314C
                    <br />
                    Boulder, Colorado 80302
                    <br />
                    United States of America
                  </address>
                </div>
              </div>
              <p className="leading-relaxed text-muted-foreground">
                The company operates with a commitment to transparency, innovation,
                and long-term business development while delivering advanced
                technology-driven solutions for its global member community.
              </p>
            </CardContent>
          </GoldCard>
        </Reveal>
      </Container>
    </section>
  );
}

function HowItWorks() {
  const dailyOps = [
    "Analyzes global market conditions",
    "Processes large volumes of trading data",
    "Identifies potential opportunities",
    "Executes trades automatically",
    "Updates member accounts with trading results",
  ];
  const monitoring = [
    ["Current Account Balance", Wallet],
    ["Daily Trading Results", LineChart],
    ["Historical Performance Records", BarChart3],
    ["Growth Tracking", TrendingUp],
    ["Transaction History", FileText],
    ["Team & Referral Information", Users],
  ];

  return (
    <section id="how-it-works" className="relative py-24">
      <Container>
        <SectionHeading eyebrow="How It Works" title="The Dollar2X Auto-Trading System" />

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mb-16 grid gap-8 lg:grid-cols-2"
        >
          <GoldCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="size-5 text-[var(--logo-gold-300)]" />
                The Concept
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Members deposit funds into the platform, and the AI-powered trading
                system automatically identifies market opportunities and executes
                trades. The entire process is designed to minimize manual involvement
                while maximizing operational efficiency.
              </p>
            </CardContent>
          </GoldCard>

          <GoldCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="size-5 text-[var(--logo-gold-300)]" />
                Daily Trading Operation
              </CardTitle>
              <CardDescription>Every day at 9:00 AM (Global Standard Time)</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 text-sm text-muted-foreground">
                {dailyOps.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-profit" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </GoldCard>
        </motion.div>

        <Reveal className="mb-8 text-center">
          <h3 className="text-2xl font-semibold text-foreground">
            Real-Time Portfolio Monitoring
          </h3>
          <p className="mt-2 text-muted-foreground">
            Members can access their dashboard anytime to view:
          </p>
        </Reveal>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {monitoring.map(([label, Icon]) => (
            <GoldCard key={label as string}>
              <CardHeader>
                <IconBadge icon={Icon as React.ComponentType<{ className?: string }>} />
                <CardTitle className="text-lg">{label as string}</CardTitle>
                <CardDescription>Available live on your personal dashboard.</CardDescription>
              </CardHeader>
            </GoldCard>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}

function Partnerships() {
  const cards = [
    {
      icon: Users,
      title: "Investors",
      desc: "Investors form the foundation of the Dollar2X ecosystem.",
      body: "Through participation in the platform, members gain access to automated trading technology without requiring previous market experience.",
      list: null,
      variant: "gold" as const,
    },
    {
      icon: Landmark,
      title: "Dollar2X Global Group Ltd",
      desc: "Platform operations and member services.",
      list: [
        "Proprietary AI Trading Technology",
        "Market Research & Analysis",
        "Platform Operations Management",
        "Member Support Services",
        "Business Development Programs",
      ],
      variant: "navy" as const,
    },
    {
      icon: Handshake,
      title: "AURA Exchange (AURAEX)",
      desc: "Trading infrastructure and data support.",
      list: [
        "Trading Infrastructure",
        "Technology & Data Support",
        "Market Connectivity",
        "Settlement Services",
        "Regulatory Support Framework",
      ],
      variant: "navy" as const,
    },
  ];

  return (
    <section id="partnerships" className="relative border-y border-white/5 bg-[var(--logo-navy-900)]/30 py-24">
      <Container>
        <SectionHeading eyebrow="Our Ecosystem" title="Partnership Ecosystem" />
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid gap-6 lg:grid-cols-3"
        >
          {cards.map((c) => (
            <GoldCard key={c.title} glow={c.variant === "gold"}>
              <CardHeader>
                <IconBadge icon={c.icon} variant={c.variant} />
                <CardTitle>{c.title}</CardTitle>
                <CardDescription>{c.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                {c.list ? (
                  <ul className="grid gap-2 text-sm text-muted-foreground">
                    {c.list.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-[var(--logo-gold-300)]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">{c.body}</p>
                )}
              </CardContent>
            </GoldCard>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}

function Advantages() {
  const items = [
    { icon: Brain, title: "AI-Powered Trading Precision", description: "Advanced AI continuously analyzes market data to identify opportunities and improve execution efficiency." },
    { icon: Scale, title: "Regulatory Compliance", description: "A structured framework designed to support transparency, operational integrity, and business sustainability." },
    { icon: Handshake, title: "Long-Term Strategic Partnership", description: "Dollar2X and AURA Exchange maintain a long-term cooperation agreement focused on technology and ecosystem growth." },
    { icon: ShieldCheck, title: "Fund Security Focus", description: "Strong operational systems, infrastructure management, and GLOBAL resources support platform stability." },
    { icon: Coins, title: "Multiple Income Opportunities", description: "Benefit from trading, referral, and team-development incentives within the platform structure." },
    { icon: LayoutDashboard, title: "Transparent Dashboard", description: "Real-time reporting and easy account management across all devices." },
  ];
  return (
    <section className="relative py-24">
      <Container>
        <SectionHeading eyebrow="Why Dollar2X" title="Key Business Advantages" />
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {items.map((item) => (
            <GoldCard key={item.title}>
              <CardHeader>
                <IconBadge icon={item.icon} />
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </GoldCard>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}

function AiTech() {
  const specs = [
    ["Accuracy Rate", "99.6%"],
    ["Data Processing", "10,000+ Data Points Per Second"],
    ["Trade Execution", "Fully Automated"],
    ["Analysis Frequency", "24/7 Market Monitoring"],
    ["Learning System", "Self-Improving AI Model"],
  ];
  const steps = ["Data Collection", "Market Analysis", "Pattern Recognition", "Risk Assessment", "Trade Execution", "Performance Optimization"];
  const benefits = [
    ["No Trading Experience Required", Shield],
    ["Automated Trading Process", Zap],
    ["Transparent Reporting", FileText],
    ["Professional Technology Access", Sparkles],
    ["Continuous System Improvement", TrendingUp],
    ["24/7 Market Monitoring", Clock],
  ];

  return (
    <section id="ai" className="relative border-y border-white/5 bg-[var(--logo-navy-900)]/30 py-24">
      <Container>
        <SectionHeading eyebrow="The Power Behind Dollar2X" title="AI Technology" />

        <div className="mb-16 grid gap-8 lg:grid-cols-2">
          <Reveal className="space-y-6">
            <p className="text-lg leading-relaxed text-foreground">
              The Dollar2X AI engine combines machine learning, predictive analytics,
              and automated execution technology to support efficient market
              participation.
            </p>
            <GoldCard>
              <CardHeader>
                <CardTitle>Technical Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-white/5">
                    {specs.map(([label, value]) => (
                      <tr key={label}>
                        <td className="py-3 pr-4 font-medium text-foreground">{label}</td>
                        <td className="py-3 text-right text-[var(--logo-gold-200)]">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </GoldCard>
          </Reveal>

          <Reveal delay={0.1} className="space-y-6">
            <h3 className="text-2xl font-semibold text-foreground">How Our AI Works</h3>
            <div className="relative grid gap-5">
              <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-[var(--logo-gold-400)]/60 via-[var(--logo-gold-400)]/20 to-transparent" />
              {steps.map((title, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
                  className="relative flex items-center gap-4"
                >
                  <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--logo-navy-500)] to-[var(--logo-navy-700)] text-sm font-bold text-[var(--logo-gold-200)] ring-1 ring-[var(--logo-gold-400)]/30">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <span className="font-medium text-foreground">{title}</span>
                </motion.div>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal className="mb-8 text-center">
          <h3 className="text-2xl font-semibold text-foreground">Member Benefits</h3>
        </Reveal>
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {benefits.map(([label, Icon]) => (
            <GoldCard key={label as string}>
              <CardHeader>
                <IconBadge icon={Icon as React.ComponentType<{ className?: string }>} />
                <CardTitle className="text-lg">{label as string}</CardTitle>
                <CardDescription>Designed to make investing simple and efficient.</CardDescription>
              </CardHeader>
            </GoldCard>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}

function Cooperation() {
  const rows = [
    ["Technology", "Access to Trading Infrastructure"],
    ["Data", "Real-Time Market Data & Analytics"],
    ["Business Development", "Joint Expansion Initiatives"],
    ["Revenue Structure", "Strategic Cooperation Model"],
    ["Agreement Term", "10 Years with Renewal Options"],
  ];
  return (
    <section className="relative py-24">
      <Container>
        <SectionHeading eyebrow="Long-Term Commitment" title="10-Year Strategic Cooperation" />
        <Reveal>
          <GoldCard className="mx-auto max-w-4xl" glow>
            <CardHeader>
              <CardTitle className="leading-snug">
                Dollar2X Global Group Ltd and AURA Exchange have established a long-term
                strategic partnership focused on technology sharing, infrastructure
                support, business development, and future expansion.
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-white/5">
                  {rows.map(([aspect, details]) => (
                    <tr key={aspect}>
                      <td className="py-3 pr-4 font-medium text-foreground">{aspect}</td>
                      <td className="py-3 text-right text-muted-foreground">{details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-6 rounded-lg border border-[var(--logo-gold-400)]/25 bg-[var(--logo-gold-400)]/10 p-4 text-sm text-[var(--logo-gold-200)]">
                <strong className="font-medium">Authorization Framework:</strong>{" "}
                AURA Exchange provides technology support and trading data
                infrastructure, while Dollar2X Global Group Ltd manages platform
                operations, member services, and business development under the
                cooperation agreement.
              </div>
            </CardContent>
          </GoldCard>
        </Reveal>
      </Container>
    </section>
  );
}

function CTA() {
  const reduce = useReducedMotion();
  return (
    <section className="relative overflow-hidden border-y border-white/5 py-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 80% at 50% 120%, var(--logo-gold-400)/20, transparent 60%), radial-gradient(ellipse 80% 60% at 50% -20%, var(--logo-navy-400)/50, transparent 60%)",
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
          style={{
            background:
              "radial-gradient(circle, var(--logo-gold-400)/18, transparent 70%)",
            animation: reduce ? undefined : "aurora 12s ease-in-out infinite alternate",
          }}
        />
      </div>
      <Container>
        <Reveal className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={reduce ? false : { scale: 0.6, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, damping: 16 }}
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--logo-gold-400)]/10 text-[var(--logo-gold-300)] ring-1 ring-[var(--logo-gold-400)]/30"
          >
            <Globe2 className="size-8" />
          </motion.div>
          <h2 className="mb-4 text-3xl font-semibold text-foreground md:text-4xl">
            Start Building Your{" "}
            <span className="text-gradient-gold">Wealth</span> Today
          </h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Experience automated trading, real-time monitoring, and a secure ecosystem
            built for long-term growth.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="btn-gold-shimmer gap-2 text-[var(--logo-navy-900)] hover:opacity-90">
              <Link href={ROUTES.signup}>
                Create Free Account <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-[var(--logo-gold-400)]/30 hover:border-[var(--logo-gold-400)]/60 hover:bg-[var(--logo-gold-400)]/5">
              <Link href={ROUTES.login}>Member Login</Link>
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 py-12">
      <Container>
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="relative h-10 w-32 rounded-lg p-1">
            <Image
              src="/images/home/d2x-logo.png"
              alt="Dollar2X Global Group Ltd"
              fill
              className="object-contain p-1"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Dollar2X Global Group Ltd. All rights
            reserved.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <a href="#about" className="transition-colors hover:text-[var(--logo-gold-300)]">About</a>
            <a href="#how-it-works" className="transition-colors hover:text-[var(--logo-gold-300)]">How It Works</a>
            <a href="#partnerships" className="transition-colors hover:text-[var(--logo-gold-300)]">Partnerships</a>
            <a href="#ai" className="transition-colors hover:text-[var(--logo-gold-300)]">AI</a>
          </div>
        </div>
      </Container>
    </footer>
  );
}

/* ----------------------------------------------------------------------------
 * Header
 * ------------------------------------------------------------------------- */

function Header() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: EASE }}
      className={cn(
        "sticky top-0 z-30 transition-all duration-300",
        scrolled
          ? "border-b border-white/10 bg-background/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <Container className="flex h-16 items-center justify-between">
        <Link href={ROUTES.home} className="flex items-center gap-3">
          <div className="relative h-9 w-24 rounded-lg p-1">
            <Image
              src="/images/home/d2x-logo.png"
              alt="Dollar2X Global Group Ltd"
              fill
              priority
              className="object-contain"
            />
          </div>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
          {[
            ["About", "#about"],
            ["How It Works", "#how-it-works"],
            ["Partnerships", "#partnerships"],
            ["AI Technology", "#ai"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="relative transition-colors hover:text-foreground after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-[var(--logo-gold-400)] after:transition-all after:duration-300 hover:after:w-full"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={ROUTES.login}>Log in</Link>
          </Button>
          <Button asChild size="sm" className="btn-gold-shimmer text-[var(--logo-navy-900)] hover:opacity-90">
            <Link href={ROUTES.signup}>
              Get Started <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
      </Container>
    </motion.header>
  );
}

/* ----------------------------------------------------------------------------
 * Root
 * ------------------------------------------------------------------------- */

export default function AnimatedHome() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <Header />
      <Hero />
      <Ticker />
      <LiveTradingChart />
      <About />
      <Corporate />
      <HowItWorks />
      <Partnerships />
      <Advantages />
      <AiTech />
      <Cooperation />
      <CTA />
      <Footer />
    </main>
  );
}
