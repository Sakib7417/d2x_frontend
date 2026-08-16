"use client";

import { Check, Copy, Network, Wallet } from "lucide-react";
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
import { ShareReferralButton } from "@/components/common/share-referral-button";
import { SponsorTradeBonus } from "@/components/common/sponsor-trade-bonus";
import { StatCard } from "@/components/common/stat-card";
import { TransferToPrincipal } from "@/components/common/transfer-to-principal";
import { DashboardSlider, NewsTicker } from "@/components/common/dashboard-slider";
import LiveTradingChart from "@/components/home/live-trading-chart";

import { useDepositWalletAddressQuery } from "@/features/deposits/api/deposits-api";
import { useUserDashboardQuery } from "@/features/users/api/users-api";
import { useWalletSummaryQuery } from "@/features/wallet/api/wallet-api";

import { normalizeError } from "@/lib/api/errors";
import { ROUTES } from "@/config/routes";
import shortenString from "@/lib/shortenString";

import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/auth-slice";

export default function DashboardPage() {
  const user = useAppSelector(selectCurrentUser);

  const dashboard = useUserDashboardQuery();
  const wallet = useWalletSummaryQuery();
  const depositWallet = useDepositWalletAddressQuery();

  const loading = dashboard.isLoading || wallet.isLoading || depositWallet.isLoading;

  const error = normalizeError(
    dashboard.error ?? wallet.error ?? depositWallet.error
  );

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
      {error && <ErrorState error={error} />}

      {/* 1. User name + total balance */}
      <Card className="mb-6">
        <CardContent className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {user?.name ? `Hello, ${user.name}` : "Welcome"}
            </h2>
            <p className="text-muted-foreground mt-1">
              Here is your account overview.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-muted-foreground text-sm">Total balance</p>
            <div className="text-3xl font-bold">
              {wallet.isLoading ? (
                <span className="text-muted-foreground">Loading…</span>
              ) : (
                <Money value={wallet.data?.totalBalance} showCurrency />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. News section */}
      <section className="mb-6">
        <NewsTicker />
      </section>

      {/* 2b. Live trading chart from home page */}
      <LiveTradingChart minimal />

      {/* 3. Referral + deposit address */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
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
            <div className="flex gap-2">
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
              <ShareReferralButton referralLink={referralLink} />
            </div>
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

      {/* 4. Transfer to compound */}
      <section className="mb-6">
        <TransferToPrincipal />
      </section>

      {/* 5. Slider at the very bottom */}
      <DashboardSlider />
    </>
  );
}
