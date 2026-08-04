"use client";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ChartCandlestick,
  CircleDollarSign,
  Clock3,
  Network,
  Percent,
  Users,
  WalletCards,
} from "lucide-react";

import { AnimatedNumber } from "@/components/common/animated-number";
import { ErrorState } from "@/components/common/error-state";
import { Money } from "@/components/common/money";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { useAdminDashboardQuery } from "@/lib/api/admin-api";
import { normalizeError } from "@/lib/api/errors";

export default function AdminOverviewPage() {
  const { data, error, isLoading, refetch } = useAdminDashboardQuery();
  const normalizedError = normalizeError(error);

  return (
    <>
      <PageHeader
        title="Admin overview"
        description="Live platform activity, operational queues, and financial totals."
        breadcrumbs={[{ label: "Admin" }, { label: "Overview" }]}
      />

      {normalizedError ? (
        <ErrorState error={normalizedError} onRetry={refetch} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total users"
            value={<AnimatedNumber value={data?.totalUsers} />}
            hint={data ? `${data.activeUsers.toLocaleString()} active` : undefined}
            icon={Users}
            accent="brand"
            loading={isLoading}
            index={0}
          />
          <StatCard
            label="Active users"
            value={<AnimatedNumber value={data?.activeUsers} />}
            icon={Users}
            accent="profit"
            loading={isLoading}
            index={1}
          />
          <StatCard
            label="Total deposits"
            value={<AnimatedNumber value={data?.totalDeposits} />}
            icon={ArrowDownToLine}
            accent="profit"
            loading={isLoading}
            index={2}
          />
          <StatCard
            label="Pending deposits"
            value={<AnimatedNumber value={data?.pendingDeposits} />}
            icon={Clock3}
            accent="pending"
            loading={isLoading}
            index={3}
          />
          <StatCard
            label="Total withdrawals"
            value={<AnimatedNumber value={data?.totalWithdrawals} />}
            icon={ArrowUpFromLine}
            accent="loss"
            loading={isLoading}
            index={4}
          />
          <StatCard
            label="Pending withdrawals"
            value={<AnimatedNumber value={data?.pendingWithdrawals} />}
            icon={Clock3}
            accent="pending"
            loading={isLoading}
            index={5}
          />
          <StatCard
            label="Trades"
            value={<AnimatedNumber value={data?.totalTrades} />}
            icon={ChartCandlestick}
            accent="info"
            loading={isLoading}
            index={6}
          />
          <StatCard
            label="Trading volume"
            value={<Money value={data?.totalVolume} compact showCurrency />}
            icon={WalletCards}
            accent="brand"
            loading={isLoading}
            index={7}
          />
          <StatCard
            label="Referral bonuses"
            value={<AnimatedNumber value={data?.totalReferralBonuses} />}
            icon={Network}
            accent="profit"
            loading={isLoading}
            index={8}
          />
          <StatCard
            label="Ranks achieved"
            value={<AnimatedNumber value={data?.totalRankBonuses} />}
            icon={CircleDollarSign}
            accent="profit"
            loading={isLoading}
            index={9}
          />
          <StatCard
            label="Cycle bonuses"
            value={<AnimatedNumber value={data?.totalCycleBonuses} />}
            icon={Percent}
            accent="profit"
            loading={isLoading}
            index={10}
          />
          <StatCard
            label="Commission entries"
            value={<AnimatedNumber value={data?.totalAdminCommission} />}
            icon={CircleDollarSign}
            accent="info"
            loading={isLoading}
            index={11}
          />
        </div>
      )}
    </>
  );
}
