"use client";

import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Money } from "@/components/common/money";

function Result({
  label,
  value,
  variant = "plain",
}: {
  label: string;
  value: number;
  variant?: "plain" | "positive" | "negative" | "signed";
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <Money value={Math.abs(value).toFixed(2)} variant={variant} showCurrency size="lg" />
    </div>
  );
}

export default function CalculatorPage() {
  const [amount, setAmount] = useState("300");
  const [rate, setRate] = useState("1.111111");
  const [days, setDays] = useState("90");

  const result = useMemo(() => {
    const principal = Number(amount) || 0;
    const dailyRate = Number(rate) / 100 || 0;
    const period = Number(days) || 0;
    const daily = principal * dailyRate;
    const profit = daily * period;
    return { daily, profit, total: principal + profit };
  }, [amount, rate, days]);

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-2xl font-bold">Profit Calculator</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calculator className="size-5 text-primary" />
            Simple Profit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label className="mb-2 block">Amount</Label>
              <Input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            {/* <div>
              <Label className="mb-2 block">Daily rate (%)</Label>
              <Input
                type="number"
                min="0"
                step="any"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
            </div> */}
            <div>
              <Label className="mb-2 block">Days</Label>
              <Input
                type="number"
                min="0"
                step="1"
                value={days}
                onChange={(e) => setDays(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Result label="Daily profit" value={result.daily} variant="positive" />
            <Result label="Total profit" value={result.profit} variant="positive" />
            <Result label="Total return" value={result.total} />
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setAmount("300");
                setRate("1");
                setDays("100");
              }}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
