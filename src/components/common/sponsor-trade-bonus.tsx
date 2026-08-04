"use client";

import { useMemo } from "react";
import { Zap } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SponsorTradeBonusProps {
  expiry: string | null | undefined;
  rate: number | null | undefined;
  className?: string;
}

export function SponsorTradeBonus({
  expiry,
  rate,
  className,
}: SponsorTradeBonusProps) {
  const bonus = useMemo(() => {
    if (!expiry || !rate) return null;

    const end = new Date(expiry).getTime();
    const now = Date.now();
    const diff = end - now;

    if (diff <= 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );

    return {
      ratePercent: Math.round(rate * 100),
      days,
      hours,
    };
  }, [expiry, rate]);

  if (!bonus) return null;

  return (
    <Card
      className={cn(
        "col-span-full border-profit/30 bg-profit/5",
        className,
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-profit flex items-center gap-2">
          <Zap className="size-5 fill-current" />
          Sponsor Trade Bonus Active
        </CardTitle>
        <CardDescription>
          One of your referrals made a qualifying deposit. You earn boosted
          profit on every trade for the next {bonus.days} days.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-4">
          <div className="text-3xl font-bold text-profit">
            {bonus.ratePercent}%
          </div>
          <div className="text-muted-foreground text-sm">
            profit per trade · Expires in {bonus.days}d {bonus.hours}h
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
