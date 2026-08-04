"use client";

import { useMemo, useState } from "react";
import { ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Money } from "@/components/common/money";
import {
  useTransferMutation,
  useWalletSummaryQuery,
} from "@/features/wallet/api/wallet-api";
import { WalletType } from "@/types/enums";

const TRANSFERABLE_WALLETS: WalletType[] = [
  WalletType.DEPOSIT_BONUS,
  WalletType.REFERRAL,
  WalletType.TRADING_PROFIT,
  WalletType.RANK_BONUS,
  // POOL_BONUS removed — requires admin approval via pool bonus request
];

function formatWalletLabel(type: WalletType) {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export function TransferToPrincipal() {
  const { data: wallet } = useWalletSummaryQuery();
  const [transfer, { isLoading }] = useTransferMutation();

  const [fromType, setFromType] = useState<WalletType | "">("");
  const [amount, setAmount] = useState("");

  const selectedBalance = useMemo(
    () =>
      fromType ? Number(wallet?.wallets[fromType]?.balance ?? 0) : 0,
    [fromType, wallet],
  );

  const canTransfer =
    fromType !== "" &&
    amount !== "" &&
    parseFloat(amount) > 0 &&
    parseFloat(amount) <= selectedBalance;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!fromType || !amount) return;

    try {
      await transfer({
        fromWalletType: fromType,
        toWalletType: WalletType.PRINCIPAL,
        amount,
      }).unwrap();

      toast.success("Transfer completed", {
        description: `${amount} USDT moved to Principal wallet.`,
      });

      setAmount("");
      setFromType("");
    } catch (error: any) {
      toast.error(error?.data?.message || "Transfer failed");
    }
  };

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="size-5" />
          Compound to Principal
        </CardTitle>
        <CardDescription>
          Move your bonus wallet balances into your Principal wallet.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 sm:flex-row sm:items-end"
        >
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">From wallet</label>
            <Select
              value={fromType}
              onValueChange={(value) => setFromType(value as WalletType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select bonus wallet" />
              </SelectTrigger>
              <SelectContent>
                {TRANSFERABLE_WALLETS.map((type) => (
                  <SelectItem key={type} value={type}>
                    <span className="flex items-center gap-2">
                      <span>{formatWalletLabel(type)}</span>
                      <span className="text-muted-foreground text-xs">
                        (<Money value={wallet?.wallets[type]?.balance} />)
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">Amount</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={
                fromType
                  ? `Available: ${selectedBalance.toFixed(2)} USDT`
                  : "Select a wallet first"
              }
              disabled={!fromType}
            />
          </div>

          <Button
            type="submit"
            disabled={!canTransfer || isLoading}
            className="shrink-0"
          >
            {isLoading ? "Transferring…" : "Transfer to Principal"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
