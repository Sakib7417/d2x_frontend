"use client";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ChartCandlestick,
  Check,
  Copy,
  Network,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { ErrorState } from "@/components/common/error-state";
import { Money } from "@/components/common/money";
import { PageHeader } from "@/components/common/page-header";
import { SponsorTradeBonus } from "@/components/common/sponsor-trade-bonus";
import { StatCard } from "@/components/common/stat-card";
import { TransferToPrincipal } from "@/components/common/transfer-to-principal";
import { DashboardSlider, NewsTicker } from "@/components/common/dashboard-slider";

import {
  useDepositStatisticsQuery,
  useDepositWalletAddressQuery,
} from "@/features/deposits/api/deposits-api";
import {
  useReferralStatisticsQuery,
  useTradeStatisticsQuery,
} from "@/features/portal/api/portal-api";
import { useUserDashboardQuery } from "@/features/users/api/users-api";
import { useWalletSummaryQuery } from "@/features/wallet/api/wallet-api";
import { useWithdrawalStatisticsQuery } from "@/features/withdrawals/api/withdrawals-api";

import { normalizeError } from "@/lib/api/errors";
import { ROUTES } from "@/config/routes";
import shortenString from "@/lib/shortenString";

import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/auth-slice";

export default function DashboardPage() {
  const user = useAppSelector(selectCurrentUser);

  const dashboard = useUserDashboardQuery();
  const wallet = useWalletSummaryQuery();
  const deposits = useDepositStatisticsQuery();
  const withdrawals = useWithdrawalStatisticsQuery();
  const trades = useTradeStatisticsQuery();
  const referrals = useReferralStatisticsQuery();
  const depositWallet = useDepositWalletAddressQuery();

  const loading =
    dashboard.isLoading ||
    wallet.isLoading ||
    deposits.isLoading ||
    withdrawals.isLoading ||
    trades.isLoading ||
    referrals.isLoading;

  const error = normalizeError(
    dashboard.error ??
      wallet.error ??
      deposits.error ??
      withdrawals.error ??
      trades.error ??
      referrals.error
  );

  const firstName = user?.name?.split(" ")[0];

  const referralLink =
    typeof window !== "undefined"
      ? `${window.location.origin}${ROUTES.referralLanding(dashboard.data?.profile?.referralCode ?? user?.referralCode ?? "")}`
      : "";

  const depositAddress = depositWallet.data?.address ?? null;

  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState(false);

  const copyReferral = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedRef(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopiedRef(false), 1500);
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  };

  const copyAddress = async () => {
    if (!depositAddress) return;
    try {
      await navigator.clipboard.writeText(depositAddress);
      setCopiedAddr(true);
      toast.success("Deposit address copied!");
      setTimeout(() => setCopiedAddr(false), 1500);
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  };

  return (
    <>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : "Dashboard"}
        description="A live overview of your balances, activity, trading, and network."
      />

      <DashboardSlider />
      <NewsTicker />

      {error && <ErrorState error={error} />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SponsorTradeBonus
          expiry={dashboard.data?.profile.sponsorTradeBonusExpiry}
          rate={dashboard.data?.profile.sponsorTradeBonusRate}
        />

        <StatCard
          label="Total balance"
          value={<Money value={wallet.data?.totalBalance} showCurrency compact />}
          icon={Wallet}
          loading={loading}
        />

        <StatCard
          label="Approved deposits"
          value={
            <Money
              value={String(deposits.data?.totalAmount ?? 0)}
              showCurrency
              compact
            />
          }
          hint={`${deposits.data?.approvedDeposits ?? 0} approved`}
          icon={ArrowDownToLine}
          accent="profit"
          loading={loading}
        />

        <StatCard
          label="Withdrawals"
          value={
            <Money
              value={String(withdrawals.data?.totalAmount ?? 0)}
              showCurrency
              compact
            />
          }
          hint={`${withdrawals.data?.pendingWithdrawals ?? 0} pending`}
          icon={ArrowUpFromLine}
          accent="pending"
          loading={loading}
        />

        <StatCard
          label="Trading profit"
          value={
            <Money
              value={String(trades.data?.totalUserProfit ?? 0)}
              showCurrency
              compact
              variant="positive"
            />
          }
          hint={`${trades.data?.totalTrades ?? 0} trades`}
          icon={ChartCandlestick}
          accent="profit"
          loading={loading}
        />

        <StatCard
          label="Direct referrals"
          value={
            referrals.data?.directReferrals ??
            dashboard.data?.directReferrals ??
            0
          }
          hint={`${dashboard.data?.teamSize ?? 0} team members`}
          icon={Users}
          accent="info"
          loading={loading}
        />

        <StatCard
          label="Referral earnings"
          value={
            <Money
              value={String(referrals.data?.totalBonusAmount ?? 0)}
              showCurrency
              compact
              variant="positive"
            />
          }
          hint={`${referrals.data?.totalBonuses ?? 0} bonuses`}
          icon={Network}
          accent="brand"
          loading={loading}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="size-5 text-(--logo-gold-300)" />
              Your Referral Link
            </CardTitle>
            <CardDescription>
              Share this link to invite new members. They land on signup with
              your code pre-filled.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              value={referralLink}
              readOnly
              aria-label="Referral link"
              className="font-mono text-sm"
            />
            <Button
              onClick={copyReferral}
              variant={copiedRef ? "secondary" : "default"}
              className="shrink-0"
            >
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="size-5 text-(--logo-gold-300)" />
              Deposit Wallet Address
            </CardTitle>
            <CardDescription>
              Send USDT to this platform address, then submit the transaction in
              the deposit form.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              value={
                depositAddress
                  ? shortenString(depositAddress, 10, 8)
                  : depositWallet.isLoading
                    ? "Loading address…"
                    : "Not configured yet"
              }
              readOnly
              aria-label="Deposit wallet address"
              className="font-mono text-sm"
            />
            <Button
              onClick={copyAddress}
              disabled={!depositAddress}
              variant={copiedAddr ? "secondary" : "default"}
              className="shrink-0"
            >
              {copiedAddr ? (
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
      </div>

      <TransferToPrincipal />
    </>
  );
}