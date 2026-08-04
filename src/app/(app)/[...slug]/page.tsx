"use client";

import { use, useState, type FormEvent, type ReactNode } from "react";
import { notFound } from "next/navigation";
import { ArrowRight, Bell, ChartCandlestick, Clock, Copy, Check, Gift, Network, ShieldCheck, Trophy, TrendingUp, Users, Wallet, AlertTriangle, MessageSquare, Send, LifeBuoy, ChevronRight, HelpCircle, Mail, FileText } from "lucide-react";
import { toast } from "sonner";
import { NetworkTree } from "@/components/network/network-tree";


import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { Money } from "@/components/common/money";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { RankBadge, StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeError } from "@/lib/api/errors";
import { useChangePasswordMutation, useProfileQuery } from "@/features/auth/api/auth-api";
import { useDepositsQuery } from "@/features/deposits/api/deposits-api";
import { DepositForm } from "@/features/deposits/components/deposit-form";
import { useLedgersQuery } from "@/features/ledger/api/ledger-api";
import {
  useCurrentRankQuery, useCycleBonusesQuery, useDirectReferralsQuery, useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation, useNotificationsQuery, useRecentTradesQuery, useReferralBonusesQuery,
  useReferralStatisticsQuery, useReferralTreeQuery, useTradeStatisticsQuery, useTradesQuery,
} from "@/features/portal/api/portal-api";
import { useToggleAutoTradeMutation, useUserDashboardQuery } from "@/features/users/api/users-api";
import { useWalletSummaryQuery } from "@/features/wallet/api/wallet-api";
import { useCreateWithdrawalMutation, useWithdrawalsQuery } from "@/features/withdrawals/api/withdrawals-api";
import {
  useCreatePoolBonusRequestMutation,
  usePoolBonusRequestsQuery,
  useCancelPoolBonusRequestMutation,
} from "@/features/poolBonus/api/poolBonus-api";
import {
  useMyTicketsQuery,
  useMyTicketQuery,
  useCreateTicketMutation,
  useReplyToTicketMutation,
} from "@/features/ticket/api/ticket-api";
import {
  useAdminPostsQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useAdminNewsQuery,
  useCreateNewsMutation,
  useUpdateNewsMutation,
  useDeleteNewsMutation,
  postImageUrl,
} from "@/features/content/api/content-api";
import type { Post, NewsItem } from "@/types/models";
import { WithdrawalWalletType, PoolBonusRequestType } from "@/types/enums";
import type { AppNotification, CycleBonus, Deposit, Ledger, PoolBonusRequest, RankHistoryEntry, RecentTrade, Referral, ReferralBonus, ReferralTreeNode, Ticket, TicketMessage, Trade, Withdrawal } from "@/types/models";
import { ROUTES } from "@/config/routes";

const date = (value: string | null | undefined) => value ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
const title = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
const pageArgs = (page: number) => ({ page, limit: 20 });

function MobileCard({ children }: { children: ReactNode }) { return <div className="space-y-2 p-4 text-sm">{children}</div>; }
function Row({ label, children }: { label: string; children: ReactNode }) { return <div className="flex items-start justify-between gap-4"><span className="text-muted-foreground">{label}</span><span className="text-right">{children}</span></div>; }
function ErrorText({ error }: { error: unknown }) { const value = normalizeError(error as Parameters<typeof normalizeError>[0]); return value ? <p className="text-loss text-sm">{value.message}</p> : null; }

export default function UserPortalPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = use(params);
  const route = slug.join("/");
  if (route === "wallet") return <WalletPage />;
  if (route === "wallet/deposit") return <DepositPage />;
  if (route === "wallet/withdraw") return <WithdrawPage />;
  if (route === "transactions") return <TransactionsPage />;
  if (route === "trading") return <TradingPage />;
  if (route === "trading/history") return <TradeHistoryPage />;
  if (route === "referral") return <ReferralPage />;
  if (route === "referral/tree") return <ReferralTreePage />;
  if (route === "referral/earnings") return <ReferralEarningsPage />;
  if (route === "ranks") return <RanksPage />;
  if (route === "rewards/cycle-bonus") return <CycleBonusPage />;
  if (route === "rewards/pool-bonus") return <PoolBonusPage />;
  if (route === "rewards/deposit-bonus") return <DepositBonusPage />;
  if (route === "notifications") return <NotificationsPage />;
  if (route === "settings") return <SettingsPage />;
  if (route === "tickets") return <SupportTicketsPage />;
  if (route === "my-posts") return <MyPostsPage />;
  if (route === "my-news") return <MyNewsPage />;
  notFound();
}

function WalletPage() {
  const query = useWalletSummaryQuery();
  const entries = Object.entries(query.data?.wallets ?? {});
  return <><PageHeader title="Wallet" description="Balances and lifetime movement for each wallet." /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><StatCard label="Total balance" value={<Money value={query.data?.totalBalance} showCurrency />} icon={Wallet} loading={query.isLoading} />{entries.map(([type, wallet], i) => <StatCard key={type} label={title(type)} value={<Money value={wallet?.balance} showCurrency />} hint={<>Credits <Money value={wallet?.totalCredit} size="xs" /> · Debits <Money value={wallet?.totalDebit} size="xs" /></>} index={i + 1} />)}</div><ErrorText error={query.error} /></>;
}

const depositColumns: DataTableColumn<Deposit>[] = [
  { id: "date", header: "Date", cell: (r) => date(r.createdAt), nowrap: true },
  { id: "amount", header: "Amount", cell: (r) => <Money value={r.amount} showCurrency />, nowrap: true },
  { id: "bonus", header: "Bonus", cell: (r) => <Money value={r.bonusAmount} showCurrency variant="positive" />, nowrap: true },
  { id: "network", header: "Network", cell: (r) => r.network },
  { id: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
];
function DepositMobile({ row }: { row: Deposit }) { return <MobileCard><Row label="Amount"><Money value={row.amount} showCurrency /></Row><Row label="Bonus"><Money value={row.bonusAmount} showCurrency /></Row><Row label="Status"><StatusBadge status={row.status} /></Row><Row label="Date">{date(row.createdAt)}</Row></MobileCard>; }

function DepositPage() {
  const [page, setPage] = useState(1); const query = useDepositsQuery(pageArgs(page));
  return <><PageHeader title="Deposit" description="Submit an on-chain token transfer for verification." />
    <div className="mb-6 grid gap-4 lg:grid-cols-2">
      <DepositForm />
      <Card>
        <CardHeader>
          <CardTitle>Deposit History</CardTitle>
          <CardDescription>Your recent deposit transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={depositColumns} 
            page={query.data} 
            loading={query.isLoading} 
            fetching={query.isFetching} 
            error={normalizeError(query.error)} 
            onRetry={query.refetch} 
            getRowId={(r) => r.id} 
            renderMobileCard={(r) => <DepositMobile row={r} />} 
            onPageChange={setPage} 
          />
        </CardContent>
      </Card>
    </div>
  </>;
}

const withdrawalColumns: DataTableColumn<Withdrawal>[] = [
  { id: "date", header: "Date", cell: (r) => date(r.createdAt), nowrap: true }, { id: "wallet", header: "Wallet", cell: (r) => title(r.walletType) },
  { id: "amount", header: "Amount", cell: (r) => <Money value={r.amount} showCurrency />, nowrap: true }, { id: "net", header: "Net", cell: (r) => <Money value={r.netAmount} showCurrency />, nowrap: true },
  { id: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
];
function WithdrawalMobile({ row }: { row: Withdrawal }) { return <MobileCard><Row label="Wallet">{title(row.walletType)}</Row><Row label="Amount"><Money value={row.amount} showCurrency /></Row><Row label="Net"><Money value={row.netAmount} showCurrency /></Row><Row label="Status"><StatusBadge status={row.status} /></Row><Row label="Date">{date(row.createdAt)}</Row></MobileCard>; }
function WithdrawPage() {
  const [page, setPage] = useState(1); const query = useWithdrawalsQuery(pageArgs(page)); const [create, mutation] = useCreateWithdrawalMutation();
  const [amount, setAmount] = useState(""); const [walletAddress, setWalletAddress] = useState(""); const [walletType, setWalletType] = useState<keyof typeof WithdrawalWalletType>("PRINCIPAL");
  const isPrincipal = walletType === "PRINCIPAL";
  async function submit(e: FormEvent) { e.preventDefault(); if (!(Number(amount) > 0) || !walletAddress.trim()) return toast.error("Enter a positive amount and destination address."); try { await create({ amount: Number(amount), walletAddress, walletType: WithdrawalWalletType[walletType] }).unwrap(); toast.success("Withdrawal request submitted."); setAmount(""); } catch (error) { toast.error(normalizeError(error as Parameters<typeof normalizeError>[0])?.message); } }
  return <><PageHeader title="Withdraw" description="Request a withdrawal from an eligible wallet." /><Card className="mb-6"><CardHeader><CardTitle>New withdrawal</CardTitle><CardDescription>The backend calculates fees, penalties, and the final net amount.</CardDescription></CardHeader><CardContent><form onSubmit={submit} className="grid gap-4 md:grid-cols-3"><div className="space-y-2"><Label htmlFor="withdraw-wallet">Source wallet</Label><select id="withdraw-wallet" className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm" value={walletType} onChange={(e) => setWalletType(e.target.value as keyof typeof WithdrawalWalletType)}>{Object.keys(WithdrawalWalletType).map((v) => <option key={v}>{v}</option>)}</select></div><div className="space-y-2"><Label htmlFor="withdraw-amount">Amount</Label><Input id="withdraw-amount" type="number" min="0.00000001" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} required /></div><div className="space-y-2"><Label htmlFor="withdraw-address">Destination address</Label><Input id="withdraw-address" value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} required /></div>{isPrincipal && <div className="md:col-span-3 flex items-start gap-3 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4"><AlertTriangle className="size-5 shrink-0 text-amber-600" /><div className="space-y-1 text-sm"><p className="font-semibold text-amber-700">90-day lock on Principal wallet</p><p className="text-muted-foreground">Withdrawing from Principal before 90 days (counted from your first deposit) incurs a <strong>30% penalty</strong> plus the standard 2% fee. After 90 days, only the 2% fee applies.</p></div></div>}<div className="md:col-span-3"><Button type="submit" disabled={mutation.isLoading}>{mutation.isLoading ? "Submitting…" : "Request withdrawal"}</Button></div></form><ErrorText error={mutation.error} /></CardContent></Card><PageHeader title="Withdrawal history" /><DataTable columns={withdrawalColumns} page={query.data} loading={query.isLoading} fetching={query.isFetching} error={normalizeError(query.error)} onRetry={query.refetch} getRowId={(r) => r.id} renderMobileCard={(r) => <WithdrawalMobile row={r} />} onPageChange={setPage} /></>;
}

function TransactionsPage() { const [page, setPage] = useState(1); const q = useLedgersQuery(pageArgs(page)); const columns: DataTableColumn<Ledger>[] = [{ id: "date", header: "Date", cell: (r) => date(r.createdAt) }, { id: "type", header: "Type", cell: (r) => title(r.type) }, { id: "description", header: "Description", cell: (r) => r.description ?? "—" }, { id: "credit", header: "Credit", cell: (r) => <Money value={r.credit} variant="positive" /> }, { id: "debit", header: "Debit", cell: (r) => <Money value={r.debit} variant="negative" /> }, { id: "balance", header: "Balance", cell: (r) => <Money value={r.afterBalance} /> }]; return <><PageHeader title="Transactions" description="Your append-only wallet ledger." /><DataTable columns={columns} page={q.data} loading={q.isLoading} fetching={q.isFetching} error={normalizeError(q.error)} onRetry={q.refetch} getRowId={(r) => r.id} renderMobileCard={(r) => <MobileCard><Row label="Type">{title(r.type)}</Row><Row label="Credit"><Money value={r.credit} /></Row><Row label="Debit"><Money value={r.debit} /></Row><Row label="Balance"><Money value={r.afterBalance} /></Row><Row label="Date">{date(r.createdAt)}</Row></MobileCard>} onPageChange={setPage} /></>; }

function ProfitFlow() {
  const steps = [
    { label: "1% of your Principal", value: "USDT", hint: "Daily auto-trade amount" },
    { label: "Deployed to market", value: "185%", hint: "Gross return" },
    { label: "Profit split", value: "60% You / 40% Admin", hint: "Net distribution" },
  ];
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><TrendingUp className="size-5" /> How auto trading works</CardTitle>
        <CardDescription>One daily session uses 1% of your Principal to generate profit and shares it 60/40. Your Principal doubles in ~90 days.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-stretch gap-4 md:flex-row md:items-center md:justify-between">
          {steps.map((step, i) => (
            <div key={step.label} className="flex flex-1 items-center gap-3">
              <div className="flex-1 space-y-1 rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">{step.hint}</p>
                <p className="text-base font-semibold">{step.label}</p>
                <p className="text-sm text-profit">{step.value}</p>
              </div>
              {i < steps.length - 1 && <ArrowRight className="hidden size-5 shrink-0 text-muted-foreground md:block" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RecentActivityItem({ trade }: { trade: RecentTrade }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div>
        <p className="text-sm font-medium">{title(trade.tradeType)} Session</p>
        <p className="text-xs text-muted-foreground">{date(trade.exitTime)}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium"><Money value={trade.tradeAmount} /></p>
        <p className="text-xs"><Money value={trade.profit} variant="positive" /></p>
      </div>
    </div>
  );
}

function RecentActivity() {
  const { data, isLoading } = useRecentTradesQuery({ limit: 10 });
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="size-5" /> Live platform activity</CardTitle>
        <CardDescription>Recently completed trades across the platform.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? <p className="text-muted-foreground text-sm">Loading activity…</p> : data?.items?.length ? data.items.map((t) => <RecentActivityItem key={t.id} trade={t} />) : <p className="text-muted-foreground text-sm">No completed trades yet.</p>}
      </CardContent>
    </Card>
  );
}

function RecentTradesList() {
  const { data, isLoading } = useTradesQuery({ limit: 5 });
  const trades = data?.items ?? [];
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Clock className="size-5" /> Your recent trades</CardTitle>
        <CardDescription>Your last automated sessions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? <p className="text-muted-foreground text-sm">Loading trades…</p> : trades.length ? trades.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Trade</p>
              <p className="text-xs text-muted-foreground">{date(t.entryTime)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium"><Money value={t.tradeAmount} /></p>
              <p className="text-xs"><Money value={t.profit} variant="positive" /></p>
            </div>
          </div>
        )) : <p className="text-muted-foreground text-sm">No trades yet.</p>}
      </CardContent>
    </Card>
  );
}

function TradingPage() { const dashboard = useUserDashboardQuery(); const stats = useTradeStatisticsQuery(); const [toggle, mutation] = useToggleAutoTradeMutation(); const enabled = dashboard.data?.profile.autoTradeStatus; async function change() { try { const result = await toggle().unwrap(); toast.success(`Auto trading ${result.autoTradeStatus ? "enabled" : "disabled"}.`); } catch (e) { toast.error(normalizeError(e as Parameters<typeof normalizeError>[0])?.message); } } return <><PageHeader title="Auto Trading" description="Control eligibility for future automated trade sessions." /><Card className="mb-6"><CardHeader><CardTitle className="flex items-center gap-2"><ChartCandlestick className="size-5" /> Auto-trade status</CardTitle><CardDescription>Toggling does not create a trade; it changes eligibility for the next session.</CardDescription></CardHeader><CardContent className="flex items-center justify-between gap-4"><StatusBadge status={enabled ? "ACTIVE" : "INACTIVE"} /><Button onClick={change} disabled={mutation.isLoading}>{enabled ? "Disable auto trading" : "Enable auto trading"}</Button></CardContent></Card><ProfitFlow /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><StatCard label="Total trades" value={stats.data?.totalTrades ?? 0} icon={ChartCandlestick} loading={stats.isLoading} /><StatCard label="Trade volume" value={<Money value={String(stats.data?.totalVolume ?? 0)} showCurrency />} loading={stats.isLoading} /><StatCard label="Your profit" value={<Money value={String(stats.data?.totalUserProfit ?? 0)} showCurrency variant="positive" />} accent="profit" loading={stats.isLoading} /></div><div className="mt-6 grid gap-4 lg:grid-cols-2"><RecentActivity /><RecentTradesList /></div><ErrorText error={stats.error ?? dashboard.error ?? mutation.error} /></>; }

const tradeColumns: DataTableColumn<Trade>[] = [{ id: "date", header: "Entry", cell: (r) => date(r.entryTime) }, { id: "type", header: "Session", cell: (r) => title(r.tradeType) }, { id: "amount", header: "Amount", cell: (r) => <Money value={r.tradeAmount} /> }, { id: "profit", header: "Profit", cell: (r) => <Money value={r.profit} variant="signed" /> }, { id: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> }];
function TradeHistoryPage() { const [page, setPage] = useState(1); const q = useTradesQuery(pageArgs(page)); return <><PageHeader title="Trade History" description="Executed and pending automated trades." /><DataTable columns={tradeColumns} page={q.data} loading={q.isLoading} fetching={q.isFetching} error={normalizeError(q.error)} onRetry={q.refetch} getRowId={(r) => r.id} renderMobileCard={(r) => <MobileCard><Row label="Session">{title(r.tradeType)}</Row><Row label="Amount"><Money value={r.tradeAmount} /></Row><Row label="Profit"><Money value={r.profit} variant="signed" /></Row><Row label="Status"><StatusBadge status={r.status} /></Row><Row label="Entry">{date(r.entryTime)}</Row></MobileCard>} onPageChange={setPage} /></>; }

function ReferralPage() {
  const { data: profile } = useProfileQuery();
  const stats = useReferralStatisticsQuery();
  const refs = useDirectReferralsQuery();
  const [copiedRef, setCopiedRef] = useState(false);
  const referralLink = typeof window !== "undefined" ? `${window.location.origin}${ROUTES.referralLanding(profile?.referralCode ?? "")}` : "";
  const columns: DataTableColumn<Referral>[] = [
    { id: "member", header: "Member", cell: (r) => r.user?.name ?? r.user?.email ?? r.userId },
    { id: "joined", header: "Joined", cell: (r) => date(r.createdAt) },
    { id: "team", header: "Team size", cell: (r) => r.teamSize },
    { id: "deposits", header: "Direct deposits", cell: (r) => <Money value={r.directDepositAmount} /> }
  ];
  async function copy() {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedRef(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopiedRef(false), 1500);
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  }
  return (
    <>
      <PageHeader title="Referrals" description="Share your link and track your direct network." />
      <Card className="mb-6">
        <CardHeader><CardTitle>Your referral link</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          <Input value={referralLink} readOnly aria-label="Referral link" />
          <Button onClick={copy} disabled={!referralLink} variant={copiedRef ? "secondary" : "default"}>
            {copiedRef ? (
              <>
                <Check className="mr-2 size-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="mr-2 size-4" />
                Copy
              </>
            )}
          </Button>
        </CardContent>
      </Card>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total referrals" value={stats.data?.totalReferrals ?? 0} icon={Users} loading={stats.isLoading} />
        <StatCard label="Direct referrals" value={stats.data?.directReferrals ?? 0} loading={stats.isLoading} />
        <StatCard label="Bonuses" value={stats.data?.totalBonuses ?? 0} loading={stats.isLoading} />
        <StatCard label="Bonus earned" value={<Money value={String(stats.data?.totalBonusAmount ?? 0)} />} accent="profit" loading={stats.isLoading} />
      </div>
      <PageHeader title="Direct network" />
      <DataTable
        columns={columns}
        page={refs.data}
        loading={refs.isLoading}
        error={normalizeError(refs.error)}
        onRetry={refs.refetch}
        getRowId={(r) => r.id}
        renderMobileCard={(r) => (
          <MobileCard>
            <Row label="Member">{r.user?.name ?? r.user?.email ?? r.userId}</Row>
            <Row label="Team">{r.teamSize}</Row>
            <Row label="Joined">{date(r.createdAt)}</Row>
          </MobileCard>
        )}
        hidePagination
      />
    </>
  );
}

function ReferralTreePage() { 
  const q = useReferralTreeQuery(5); 
  return (
    <>
      <PageHeader title="Referral Tree" description="Your network structure through five levels." />
      {q.isLoading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Loading network…</p>
          </CardContent>
        </Card>
      ) : q.data ? (
        <NetworkTree data={q.data} />
      ) : (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">No network members yet.</p>
          </CardContent>
        </Card>
      )}
      <ErrorText error={q.error} />
    </>
  );
}

const bonusColumns: DataTableColumn<ReferralBonus>[] = [{ id: "date", header: "Date", cell: (r) => date(r.createdAt) }, { id: "level", header: "Level", cell: (r) => r.level }, { id: "deposit", header: "Deposit", cell: (r) => <Money value={r.depositAmount} /> }, { id: "rate", header: "Rate", cell: (r) => `${r.bonusPercentage}%` }, { id: "bonus", header: "Bonus", cell: (r) => <Money value={r.bonusAmount} variant="positive" /> }, { id: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> }];
function ReferralEarningsPage() { const [page, setPage] = useState(1); const q = useReferralBonusesQuery(pageArgs(page)); return <><PageHeader title="Referral Earnings" description="Bonuses generated by qualifying network deposits." /><DataTable columns={bonusColumns} page={q.data} loading={q.isLoading} fetching={q.isFetching} error={normalizeError(q.error)} onRetry={q.refetch} getRowId={(r) => r.id} renderMobileCard={(r) => <MobileCard><Row label="Level">{r.level}</Row><Row label="Deposit"><Money value={r.depositAmount} /></Row><Row label="Bonus"><Money value={r.bonusAmount} /></Row><Row label="Status"><StatusBadge status={r.status} /></Row><Row label="Date">{date(r.createdAt)}</Row></MobileCard>} onPageChange={setPage} /></>; }

function RanksPage() { const q = useCurrentRankQuery(); const history = q.data?.history ?? []; const page = { items: history, page: 1, limit: history.length, total: history.length, totalPages: history.length ? 1 : 0 }; const columns: DataTableColumn<RankHistoryEntry>[] = [{ id: "date", header: "Changed", cell: (r) => date(r.changedAt) }, { id: "from", header: "Previous", cell: (r) => <RankBadge rank={r.previousLevel} /> }, { id: "to", header: "New rank", cell: (r) => <RankBadge rank={r.newLevel} /> }, { id: "reason", header: "Reason", cell: (r) => r.changeReason ?? "—" }]; return <><PageHeader title="Ranks" description="Current achievement and promotion history." /><div className="mb-6 grid gap-4 sm:grid-cols-3"><StatCard label="Current rank" value={<RankBadge rank={q.data?.currentRank} size="md" />} icon={Trophy} loading={q.isLoading} /><StatCard label="Direct referrals" value={q.data?.rankDetails?.directReferrals ?? 0} loading={q.isLoading} /><StatCard label="Team size" value={q.data?.rankDetails?.teamSize ?? 0} loading={q.isLoading} /></div><PageHeader title="Rank history" /><DataTable columns={columns} page={page} loading={q.isLoading} error={normalizeError(q.error)} onRetry={q.refetch} getRowId={(r) => r.id} renderMobileCard={(r) => <MobileCard><Row label="Previous"><RankBadge rank={r.previousLevel} /></Row><Row label="New"><RankBadge rank={r.newLevel} /></Row><Row label="Date">{date(r.changedAt)}</Row></MobileCard>} hidePagination /></>; }

function CycleBonusPage() { const [page, setPage] = useState(1); const q = useCycleBonusesQuery(pageArgs(page)); const columns: DataTableColumn<CycleBonus>[] = [{ id: "cycle", header: "Cycle", cell: (r) => `#${r.cycleNumber}` }, { id: "rank", header: "Rank", cell: (r) => <RankBadge rank={r.rankLevel} /> }, { id: "period", header: "Period", cell: (r) => `${date(r.cycleStartDate)} – ${date(r.cycleEndDate)}` }, { id: "amount", header: "Total", cell: (r) => <Money value={r.totalAmount} variant="positive" /> }, { id: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> }]; return <><PageHeader title="Cycle Bonus" description="Rank and cycle rewards from completed eligibility periods." /><DataTable columns={columns} page={q.data} loading={q.isLoading} fetching={q.isFetching} error={normalizeError(q.error)} onRetry={q.refetch} getRowId={(r) => r.id} renderMobileCard={(r) => <MobileCard><Row label="Cycle">#{r.cycleNumber}</Row><Row label="Rank"><RankBadge rank={r.rankLevel} /></Row><Row label="Total"><Money value={r.totalAmount} /></Row><Row label="Status"><StatusBadge status={r.status} /></Row></MobileCard>} onPageChange={setPage} /></>; }

function PoolBonusPage() {
  const [page, setPage] = useState(1);
  const query = usePoolBonusRequestsQuery(pageArgs(page));
  const [create, createMutation] = useCreatePoolBonusRequestMutation();
  const [cancel, cancelMutation] = useCancelPoolBonusRequestMutation();
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [requestType, setRequestType] = useState<keyof typeof PoolBonusRequestType>("TRANSFER_TO_PRINCIPAL");
  const isWithdraw = requestType === "WITHDRAW";

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!(Number(amount) > 0)) return toast.error("Enter a positive amount.");
    if (isWithdraw && !walletAddress.trim()) return toast.error("Destination address is required for withdrawal.");
    try {
      await create({
        requestType: PoolBonusRequestType[requestType],
        requestedAmount: Number(amount),
        destinationAddress: isWithdraw ? walletAddress : undefined,
      }).unwrap();
      toast.success("Pool bonus request submitted. Pending admin approval.");
      setAmount("");
      setWalletAddress("");
    } catch (error) {
      toast.error(normalizeError(error as Parameters<typeof normalizeError>[0])?.message);
    }
  }

  async function handleCancel(id: PoolBonusRequest["id"]) {
    try {
      await cancel(id).unwrap();
      toast.success("Request cancelled.");
    } catch (error) {
      toast.error(normalizeError(error as Parameters<typeof normalizeError>[0])?.message);
    }
  }

  const columns: DataTableColumn<PoolBonusRequest>[] = [
    { id: "date", header: "Date", cell: (r) => date(r.createdAt), nowrap: true },
    { id: "type", header: "Type", cell: (r) => title(r.requestType) },
    { id: "requested", header: "Requested", cell: (r) => <Money value={r.requestedAmount} showCurrency />, nowrap: true },
    { id: "approved", header: "Approved", cell: (r) => r.approvedAmount ? <Money value={r.approvedAmount} showCurrency /> : "—", nowrap: true },
    { id: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    { id: "action", header: "Action", cell: (r) => r.status === "PENDING" ? <Button variant="ghost" size="sm" onClick={() => handleCancel(r.id)} disabled={cancelMutation.isLoading}>Cancel</Button> : "—" },
  ];

  return (
    <>
      <PageHeader title="Pool Bonus" description="Request to transfer or withdraw your pool bonus. Admin approval required." />
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>New pool bonus request</CardTitle>
          <CardDescription>Submit a request to transfer pool bonus to your Principal wallet or withdraw it. An admin will review and approve, reject, or update the amount.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="pool-request-type">Request type</Label>
              <select id="pool-request-type" className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm" value={requestType} onChange={(e) => setRequestType(e.target.value as keyof typeof PoolBonusRequestType)}>
                <option value="TRANSFER_TO_PRINCIPAL">Transfer to Principal</option>
                <option value="WITHDRAW">Withdraw</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pool-request-amount">Amount</Label>
              <Input id="pool-request-amount" type="number" min="0.00000001" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            {isWithdraw && (
              <div className="space-y-2">
                <Label htmlFor="pool-request-address">Destination address</Label>
                <Input id="pool-request-address" value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} required />
              </div>
            )}
            <div className="md:col-span-3 flex items-start gap-3 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
              <AlertTriangle className="size-5 shrink-0 text-amber-600" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-amber-700">Admin approval required</p>
                <p className="text-muted-foreground">Your request will be reviewed by an admin. The admin may approve, reject, or update the amount before processing.</p>
              </div>
            </div>
            <div className="md:col-span-3">
              <Button type="submit" disabled={createMutation.isLoading}>{createMutation.isLoading ? "Submitting…" : "Submit request"}</Button>
            </div>
          </form>
          <ErrorText error={createMutation.error} />
        </CardContent>
      </Card>
      <PageHeader title="Request history" />
      <DataTable columns={columns} page={query.data} loading={query.isLoading} fetching={query.isFetching} error={normalizeError(query.error)} onRetry={query.refetch} getRowId={(r) => r.id} renderMobileCard={(r) => <MobileCard><Row label="Type">{title(r.requestType)}</Row><Row label="Requested"><Money value={r.requestedAmount} showCurrency /></Row><Row label="Approved">{r.approvedAmount ? <Money value={r.approvedAmount} showCurrency /> : "—"}</Row><Row label="Status"><StatusBadge status={r.status} /></Row><Row label="Date">{date(r.createdAt)}</Row>{r.status === "PENDING" && <Row label="Action"><Button variant="ghost" size="sm" onClick={() => handleCancel(r.id)} disabled={cancelMutation.isLoading}>Cancel</Button></Row>}</MobileCard>} onPageChange={setPage} />
    </>
  );
}

function DepositBonusPage() { const [page, setPage] = useState(1); const q = useDepositsQuery(pageArgs(page)); const bonuses = q.data ? { ...q.data, items: q.data.items.filter((r) => Number(r.bonusAmount) > 0) } : undefined; const shown = bonuses?.items.reduce((sum, r) => sum + Number(r.bonusAmount), 0) ?? 0; return <><PageHeader title="Deposit Bonus" description="Actual bonuses recorded on your deposit history." /><div className="mb-6"><StatCard label="Bonuses on this page" value={<Money value={String(shown)} showCurrency />} hint="Derived from the loaded deposit records" icon={Gift} loading={q.isLoading} /></div><DataTable columns={depositColumns} page={bonuses} loading={q.isLoading} fetching={q.isFetching} error={normalizeError(q.error)} onRetry={q.refetch} getRowId={(r) => r.id} renderMobileCard={(r) => <DepositMobile row={r} />} onPageChange={setPage} emptyState={{ title: "No deposit bonuses on this page" }} /></>; }

function NotificationsPage() { const [page, setPage] = useState(1); const q = useNotificationsQuery(pageArgs(page)); const [mark, marking] = useMarkNotificationReadMutation(); const [markAll, markingAll] = useMarkAllNotificationsReadMutation(); const columns: DataTableColumn<AppNotification>[] = [{ id: "status", header: "Status", cell: (r) => <StatusBadge status={r.read ? "READ" : "UNREAD"} /> }, { id: "notification", header: "Notification", cell: (r) => <div><p className="font-medium">{r.title}</p><p className="text-muted-foreground max-w-xl text-sm">{r.message}</p></div> }, { id: "date", header: "Received", cell: (r) => date(r.createdAt) }, { id: "action", header: "", cell: (r) => !r.read ? <Button size="sm" variant="outline" disabled={marking.isLoading} onClick={() => mark(r.id)}>Mark read</Button> : null }]; return <><PageHeader title="Notifications" description="Account, transaction, trading, and reward alerts." actions={<Button variant="outline" disabled={markingAll.isLoading} onClick={() => markAll()}><Bell className="size-4" /> Mark all read</Button>} /><DataTable columns={columns} page={q.data} loading={q.isLoading} fetching={q.isFetching} error={normalizeError(q.error ?? marking.error ?? markingAll.error)} onRetry={q.refetch} getRowId={(r) => r.id} renderMobileCard={(r) => <MobileCard><Row label="Status"><StatusBadge status={r.read ? "READ" : "UNREAD"} /></Row><p className="font-medium">{r.title}</p><p className="text-muted-foreground">{r.message}</p><Row label="Received">{date(r.createdAt)}</Row>{!r.read && <Button size="sm" variant="outline" onClick={() => mark(r.id)}>Mark read</Button>}</MobileCard>} onPageChange={setPage} /></>; }

function SettingsPage() { const [change, mutation] = useChangePasswordMutation(); const [oldPassword, setOld] = useState(""); const [newPassword, setNew] = useState(""); const [confirm, setConfirm] = useState(""); async function submit(e: FormEvent) { e.preventDefault(); if (newPassword.length < 8) return toast.error("New password must be at least 8 characters."); if (newPassword !== confirm) return toast.error("New passwords do not match."); try { await change({ oldPassword, newPassword }).unwrap(); toast.success("Password changed. Sign in again on other sessions."); setOld(""); setNew(""); setConfirm(""); } catch (error) { toast.error(normalizeError(error as Parameters<typeof normalizeError>[0])?.message); } } return <><PageHeader title="Settings" description="Security controls supported by your account." /><Card className="max-w-2xl"><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5" /> Change password</CardTitle><CardDescription>Changing your password revokes all existing refresh tokens.</CardDescription></CardHeader><CardContent><form onSubmit={submit} className="space-y-4"><div className="space-y-2"><Label htmlFor="old-password">Current password</Label><Input id="old-password" type="password" value={oldPassword} onChange={(e) => setOld(e.target.value)} required /></div><div className="space-y-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" minLength={8} value={newPassword} onChange={(e) => setNew(e.target.value)} required /></div><div className="space-y-2"><Label htmlFor="confirm-password">Confirm new password</Label><Input id="confirm-password" type="password" minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} required /></div><Button type="submit" disabled={mutation.isLoading}>{mutation.isLoading ? "Changing…" : "Change password"}</Button><ErrorText error={mutation.error} /></form></CardContent></Card></>; }

/* -------------------------------------------------------------------------- */
/* Support Tickets                                                             */
/* -------------------------------------------------------------------------- */

function SupportTicketsPage() {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [helpType, setHelpType] = useState<"GENERAL_INQUIRY" | "TECHNICAL_SUPPORT" | "ACCOUNT_HELP" | "FEEDBACK">("GENERAL_INQUIRY");
  const { data, isLoading } = useMyTicketsQuery({ page, limit: 20 });
  const [create, createMut] = useCreateTicketMutation();

  const helpTypeToPriority: Record<string, "LOW" | "MEDIUM" | "HIGH"> = {
    "GENERAL_INQUIRY": "LOW",
    "TECHNICAL_SUPPORT": "MEDIUM",
    "ACCOUNT_HELP": "HIGH",
    "FEEDBACK": "LOW"
  };

  const priorityToHelpType: Record<string, string> = {
    "LOW": "General Inquiry",
    "MEDIUM": "Technical Support",
    "HIGH": "Account Help"
  };

  const helpTypeOptions = [
    { value: "GENERAL_INQUIRY", label: "General Inquiry", icon: HelpCircle, description: "General questions and information" },
    { value: "TECHNICAL_SUPPORT", label: "Technical Support", icon: LifeBuoy, description: "Technical issues and troubleshooting" },
    { value: "ACCOUNT_HELP", label: "Account Help", icon: ShieldCheck, description: "Account-related assistance" },
    { value: "FEEDBACK", label: "Feedback", icon: MessageSquare, description: "Share your feedback and suggestions" }
  ];

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return toast.error("Subject and message are required.");
    try {
      const ticket = await create({ subject, message, priority: helpTypeToPriority[helpType] }).unwrap();
      toast.success("Ticket created successfully.");
      setSubject(""); setMessage(""); setHelpType("GENERAL_INQUIRY"); setShowForm(false);
      setSelectedId(ticket.id);
    } catch (error) {
      toast.error(normalizeError(error as Parameters<typeof normalizeError>[0])?.message);
    }
  }

  if (selectedId) return <TicketDetailPage ticketId={selectedId} onBack={() => setSelectedId(null)} />;

  const ticketColumns: DataTableColumn<Ticket>[] = [
    { id: "subject", header: "Subject", cell: (r) => <div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"><FileText className="h-4 w-4 text-primary" /></div><div><p className="font-medium">{r.subject}</p><p className="text-muted-foreground text-xs">{priorityToHelpType[r.priority] || r.priority}</p></div></div> },
    { id: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    { id: "date", header: "Created", cell: (r) => <span className="text-muted-foreground text-sm">{date(r.createdAt)}</span>, nowrap: true },
    { id: "action", header: "", cell: (r) => <Button size="sm" variant="ghost" className="gap-2" onClick={() => setSelectedId(r.id as string)}>View <ChevronRight className="h-4 w-4" /></Button> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Support Center" 
        description="Get help with your account, report issues, or share feedback with our team." 
        actions={
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <MessageSquare className="h-4 w-4" />
            {showForm ? "Cancel" : "New Ticket"}
          </Button>
        } 
      />
      
      {showForm && (
        <Card className="border-primary/20 shadow-lg pt-0">
          <CardHeader className="bg-linear-to-r from-primary/5 to-primary/10 border-b pt-2">
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
              Create Support Ticket
            </CardTitle>
            <CardDescription>Fill out the form below and our team will get back to you as soon as possible.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="ticket-subject" className="text-sm font-medium">Subject</Label>
                <Input 
                  id="ticket-subject" 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)} 
                  placeholder="Brief summary of your question or issue" 
                  className="h-11"
                  required 
                />
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-medium">What type of help do you need?</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {helpTypeOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = helpType === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setHelpType(option.value as any)}
                        className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-all ${
                          isSelected 
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        }`}
                      >
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                          isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{option.label}</p>
                          <p className="text-muted-foreground text-xs">{option.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ticket-message" className="text-sm font-medium">Message</Label>
                <textarea 
                  id="ticket-message" 
                  className="flex min-h-37.5 w-full rounded-md border border-input bg-transparent px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                  placeholder="Please provide detailed information about your question or issue. The more details you provide, the better we can assist you."
                  required 
                />
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" disabled={createMut.isLoading} className="gap-2 min-w-30">
                  {createMut.isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Ticket
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            Your Tickets
          </CardTitle>
          <CardDescription>Track and manage all your support requests in one place.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={ticketColumns} 
            page={data} 
            loading={isLoading} 
            getRowId={(r) => r.id} 
            onPageChange={setPage} 
            emptyState={{
              title: "No support tickets yet",
              description: "Create your first ticket to get help from our support team.",
              icon: MessageSquare
            }} 
          />
        </CardContent>
      </Card>
    </div>
  );
}

function TicketDetailPage({ ticketId, onBack }: { ticketId: string; onBack: () => void }) {
  const { data: ticket, isLoading } = useMyTicketQuery(ticketId);
  const [reply, setReply] = useState("");
  const [sendReply, replyMut] = useReplyToTicketMutation();

  const priorityToHelpType: Record<string, string> = {
    "LOW": "General Inquiry",
    "MEDIUM": "Technical Support",
    "HIGH": "Account Help"
  };

  async function handleReply(e: FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    try {
      await sendReply({ id: ticketId, body: { message: reply } }).unwrap();
      setReply("");
      toast.success("Reply sent successfully.");
    } catch (error) {
      toast.error(normalizeError(error as Parameters<typeof normalizeError>[0])?.message);
    }
  }

  if (isLoading || !ticket) return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ChevronRight className="h-4 w-4 rotate-180" />
        Back to tickets
      </Button>
      <Card>
        <CardContent className="flex min-h-50 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Loading ticket details...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ChevronRight className="h-4 w-4 rotate-180" />
          Back to tickets
        </Button>
      </div>
      
      <Card className="border-primary/20 shadow-lg py-0">
        <CardHeader className="bg-linear-to-r from-primary/5 to-primary/10 border-b pt-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-xl">{ticket.subject}</CardTitle>
              <CardDescription className="mt-2">
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5">
                    <StatusBadge status={ticket.status} />
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <HelpCircle className="h-3.5 w-3.5" />
                    {priorityToHelpType[ticket.priority] || ticket.priority}
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {date(ticket.createdAt)}
                  </span>
                </div>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Conversation</h3>
              <p className="text-muted-foreground text-sm">{(ticket.messages ?? []).length} messages</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          {(ticket.messages ?? []).map((msg: TicketMessage, index: number) => {
            const isFirst = index === 0;
            const showDateDivider = isFirst || (index > 0 && ticket.messages && new Date(msg.createdAt).toDateString() !== new Date(ticket.messages[index - 1].createdAt).toDateString());
            
            return (
              <div key={msg.id}>
                {showDateDivider && (
                  <div className="mb-4 flex items-center justify-center">
                    <div className="flex items-center gap-4">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                        {new Date(msg.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                  </div>
                )}
                
                <div className={`flex gap-4 ${msg.isAdmin ? "flex-row" : "flex-row-reverse"}`}>
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                    msg.isAdmin 
                      ? "bg-linear-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20" 
                      : "bg-linear-to-br from-muted to-muted/80 text-muted-foreground shadow-md"
                  }`}>
                    {msg.isAdmin ? (
                      <ShieldCheck className="h-6 w-6" />
                    ) : (
                      <Users className="h-6 w-6" />
                    )}
                  </div>
                  
                  <div className={`flex max-w-[75%] flex-col gap-1.5 ${msg.isAdmin ? "items-start" : "items-end"}`}>
                    <div className={`flex items-center gap-2 px-1 ${
                      msg.isAdmin ? "text-primary font-semibold text-sm" : "text-muted-foreground font-medium text-sm"
                    }`}>
                      <span>{msg.isAdmin ? "Support Team" : "You"}</span>
                      <span className="text-muted-foreground/70 text-xs">•</span>
                      <span className="text-muted-foreground/70 text-xs">
                        {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <div className={`relative group ${
                      msg.isAdmin 
                        ? "bg-linear-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl rounded-tl-sm" 
                        : "bg-linear-to-br from-muted/50 to-muted/30 border border-border rounded-2xl rounded-tr-sm"
                    }`}>
                      <div className={`absolute -z-10 inset-0 rounded-2xl blur-xl transition-opacity duration-300 ${
                        msg.isAdmin 
                          ? "bg-primary/10 opacity-0 group-hover:opacity-100" 
                          : "bg-muted/50 opacity-0 group-hover:opacity-100"
                      }`} />
                      
                      <div className="relative p-5">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {ticket.status !== "CLOSED" && (
        <Card className="border-primary/20 shadow-lg pt-0">
          <CardHeader className="bg-linear-to-r from-primary/5 to-primary/10 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                <Send className="h-4 w-4 text-primary" />
              </div>
              Send a Reply
            </CardTitle>
            <CardDescription>Continue the conversation with our support team</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleReply} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <textarea 
                    className="flex min-h-32 w-full rounded-xl border border-input bg-transparent px-4 py-4 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    value={reply} 
                    onChange={(e) => setReply(e.target.value)} 
                    placeholder="Type your message here..."
                    required 
                  />
                  <div className="absolute bottom-3 right-3 text-muted-foreground text-xs">
                    {reply.length} characters
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-xs">
                  Our team typically responds within 24 hours
                </p>
                <Button type="submit" disabled={replyMut.isLoading || !reply.trim()} className="gap-2 min-w-32">
                  {replyMut.isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Reply
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      
      {ticket.status === "CLOSED" && (
        <Card className="border-muted bg-muted/30">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Check className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">This ticket has been closed.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Content Creator — My Posts & My News                                        */
/* -------------------------------------------------------------------------- */

function MyPostsPage() {
  const { data, isLoading } = useAdminPostsQuery({ limit: 50 });
  const [create, createMut] = useCreatePostMutation();
  const [update, updateMut] = useUpdatePostMutation();
  const [del, deleteMut] = useDeletePostMutation();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<Post["id"] | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isActive, setIsActive] = useState(true);

  function resetForm() { setTitle(""); setDescription(""); setImageFile(null); setIsActive(true); setEditId(null); setShowForm(false); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return toast.error("Title and description are required.");
    if (!editId && !imageFile) return toast.error("Image is required for new posts.");
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("isActive", String(isActive));
      if (imageFile) formData.append("image", imageFile);
      if (editId) { await update({ id: editId, body: formData }).unwrap(); toast.success("Post updated."); }
      else { await create(formData).unwrap(); toast.success("Post created."); }
      resetForm();
    } catch (error) { toast.error(normalizeError(error as Parameters<typeof normalizeError>[0])?.message); }
  }

  async function handleDelete(id: Post["id"]) {
    if (!confirm("Delete this post?")) return;
    try { await del(id).unwrap(); toast.success("Post deleted."); }
    catch (error) { toast.error(normalizeError(error as Parameters<typeof normalizeError>[0])?.message); }
  }

  function handleEdit(post: Post) { setEditId(post.id); setTitle(post.title); setDescription(post.description); setIsActive(post.isActive); setImageFile(null); setShowForm(true); }

  const posts = data?.items ?? [];

  return <><PageHeader title="My Posts" description="Create and manage dashboard slider posts." actions={<Button onClick={() => { resetForm(); setShowForm(!showForm); }}>{showForm ? "Cancel" : "New Post"}</Button>} />
    {showForm && <Card className="mb-6"><CardHeader><CardTitle>{editId ? "Edit post" : "Create post"}</CardTitle></CardHeader><CardContent><form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2"><Label htmlFor="mp-title">Title</Label><Input id="mp-title" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
      <div className="space-y-2"><Label htmlFor="mp-desc">Description</Label><Input id="mp-desc" value={description} onChange={(e) => setDescription(e.target.value)} required /></div>
      <div className="space-y-2"><Label htmlFor="mp-image">{editId ? "New image (optional)" : "Image (required)"}</Label><Input id="mp-image" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} required={!editId} /></div>
      <div className="flex items-center gap-2"><input id="mp-active" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /><Label htmlFor="mp-active">Active (show on dashboard)</Label></div>
      <Button type="submit" disabled={createMut.isLoading || updateMut.isLoading}>{createMut.isLoading || updateMut.isLoading ? "Saving…" : editId ? "Update" : "Create"}</Button>
    </form></CardContent></Card>}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {isLoading ? <p className="text-muted-foreground">Loading…</p>
      : posts.length === 0 ? <p className="text-muted-foreground">No posts yet.</p>
      : posts.map((post) => (
        <Card key={post.id}>
          <div className="relative aspect-video overflow-hidden rounded-t-xl">
            {post.imageUrl && <img src={postImageUrl(post.imageUrl)} alt={post.title} className="size-full object-cover" />}
            <div className="absolute top-2 right-2"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${post.isActive ? "bg-green-500 text-white" : "bg-gray-500 text-white"}`}>{post.isActive ? "Active" : "Inactive"}</span></div>
          </div>
          <CardContent className="p-4"><h3 className="font-semibold">{post.title}</h3><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.description}</p>
          <div className="mt-3 flex gap-2"><Button size="sm" variant="outline" onClick={() => handleEdit(post)}>Edit</Button><Button size="sm" variant="destructive" onClick={() => handleDelete(post.id)} disabled={deleteMut.isLoading}>Delete</Button></div></CardContent>
        </Card>
      ))}
    </div>
  </>;
}

function MyNewsPage() {
  const { data, isLoading } = useAdminNewsQuery({ limit: 50 });
  const [create, createMut] = useCreateNewsMutation();
  const [update, updateMut] = useUpdateNewsMutation();
  const [del, deleteMut] = useDeleteNewsMutation();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [editId, setEditId] = useState<NewsItem["id"] | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return toast.error("Title and message are required.");
    try {
      if (editId) { await update({ id: editId, title, message }).unwrap(); toast.success("News updated."); }
      else { await create({ title, message }).unwrap(); toast.success("News created."); }
      setTitle(""); setMessage(""); setEditId(null);
    } catch (error) { toast.error(normalizeError(error as Parameters<typeof normalizeError>[0])?.message); }
  }

  async function handleDelete(id: NewsItem["id"]) {
    if (!confirm("Delete this news item?")) return;
    try { await del(id).unwrap(); toast.success("News deleted."); }
    catch (error) { toast.error(normalizeError(error as Parameters<typeof normalizeError>[0])?.message); }
  }

  function handleEdit(item: NewsItem) { setEditId(item.id); setTitle(item.title); setMessage(item.message); }

  async function toggleActive(item: NewsItem) {
    try { await update({ id: item.id, isActive: !item.isActive }).unwrap(); }
    catch (error) { toast.error(normalizeError(error as Parameters<typeof normalizeError>[0])?.message); }
  }

  const news = data?.items ?? [];

  return <><PageHeader title="My News" description="Create and manage dashboard news ticker announcements." />
    <Card className="mb-6"><CardHeader><CardTitle>{editId ? "Edit news" : "Create news"}</CardTitle></CardHeader><CardContent><form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2"><Label htmlFor="mn-title">Title</Label><Input id="mn-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Platform Update" required /></div>
      <div className="space-y-2"><Label htmlFor="mn-message">Message</Label><Input id="mn-message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g., 500 users joined today!" required /></div>
      <div className="flex gap-2"><Button type="submit" disabled={createMut.isLoading || updateMut.isLoading}>{createMut.isLoading || updateMut.isLoading ? "Saving…" : editId ? "Update" : "Create"}</Button>
      {editId && <Button type="button" variant="ghost" onClick={() => { setEditId(null); setTitle(""); setMessage(""); }}>Cancel</Button>}</div>
    </form></CardContent></Card>
    <div className="space-y-3">
      {isLoading ? <p className="text-muted-foreground">Loading…</p>
      : news.length === 0 ? <p className="text-muted-foreground">No news items yet.</p>
      : news.map((item) => (
        <Card key={item.id}><CardContent className="flex items-center justify-between p-4">
          <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className="font-semibold">{item.title}</h3><span className={`rounded-full px-2 py-0.5 text-xs ${item.isActive ? "bg-green-500 text-white" : "bg-gray-500 text-white"}`}>{item.isActive ? "Active" : "Inactive"}</span></div><p className="mt-1 text-sm text-muted-foreground">{item.message}</p></div>
          <div className="flex shrink-0 gap-2"><Button size="sm" variant="outline" onClick={() => handleEdit(item)}>Edit</Button><Button size="sm" variant="ghost" onClick={() => toggleActive(item)}>{item.isActive ? "Deactivate" : "Activate"}</Button><Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)} disabled={deleteMut.isLoading}>Delete</Button></div>
        </CardContent></Card>
      ))}
    </div>
  </>;
}
