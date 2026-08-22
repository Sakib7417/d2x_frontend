"use client";

import { useState, useEffect } from "react";
import { Wallet, Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { useAppKit, useAppKitAccount, useDisconnect } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { normalizeError } from "@/lib/api/errors";
import {
  useProcessWithdrawalMutation,
  useRejectWithdrawalMutation,
} from "@/features/withdrawals/api/withdrawals-api";
import type { Withdrawal } from "@/types/models";

const USDT_ABI = [
  {
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

function isValidAddress(value: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

export function AdminWithdrawalActions({ withdrawal }: { withdrawal: Withdrawal }) {
  const { address: appKitAddress, isConnected: isAppKitConnected } = useAppKitAccount();
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();
  const { writeContractAsync, data: hash, isPending: isWritePending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const [processWithdrawal, processMutation] = useProcessWithdrawalMutation();
  const [reject, rejectMutation] = useRejectWithdrawalMutation();

  const [mode, setMode] = useState<"idle" | "reject" | "process">("idle");
  const [rejectionReason, setRejectionReason] = useState("");
  const [processedHash, setProcessedHash] = useState<string | null>(null);
  const [isPendingSend, setIsPendingSend] = useState(false);
  const [manualTxHash, setManualTxHash] = useState("");

  const usdtContract =
    (typeof process !== "undefined" && process.env && process.env.NEXT_PUBLIC_USDT_CONTRACT) ||
    "0x55d398326f99059fF775485246999027B3197955";

  const isPending = withdrawal.status === "PENDING";
  const isProcessing = withdrawal.status === "PROCESSING";
  const canAct = isPending || isProcessing;

  useEffect(() => {
    if (isSuccess && hash && hash !== processedHash) {
      setProcessedHash(hash);
      const complete = async () => {
        try {
          await processWithdrawal({ id: withdrawal.id, transactionHash: hash }).unwrap();
          toast.success("Withdrawal approved and marked as completed.");
          setMode("idle");
        } catch (error) {
          const message =
            normalizeError(error as Parameters<typeof normalizeError>[0])?.message ||
            "Transaction succeeded but backend update failed";
          toast.error(message);
        }
      };
      complete();
    }
  }, [isSuccess, hash, withdrawal.id, processWithdrawal, processedHash]);

  const executeSend = async () => {
    if (!isValidAddress(usdtContract)) {
      toast.error("USDT contract is not configured");
      return;
    }
    if (!isValidAddress(withdrawal.destinationAddress)) {
      toast.error("Invalid user destination address");
      return;
    }
    if (!withdrawal.netAmount || Number(withdrawal.netAmount) <= 0) {
      toast.error("Invalid withdrawal net amount");
      return;
    }

    try {
      const amountInSmallestUnit = parseUnits(String(withdrawal.netAmount), 18);
      await writeContractAsync({
        address: usdtContract,
        abi: USDT_ABI,
        functionName: "transfer",
        args: [withdrawal.destinationAddress, amountInSmallestUnit],
      });
    } catch (error) {
      console.error("Withdrawal send error:", error);
      const message =
      error instanceof Error ? error.message : "Failed to initiate USDT transfer";
      toast.error(message);
    }
  };

  const handleSend = () => {
    if (!isAppKitConnected) {
      setIsPendingSend(true);
      open();
      return;
    }
    if (!isConnected) {
      setIsPendingSend(true);
      return;
    }
    void executeSend();
  };

  useEffect(() => {
    if (isPendingSend && isConnected) {
      setIsPendingSend(false);
      void executeSend();
    }
  }, [isPendingSend, isConnected, executeSend]);

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }
    try {
      await reject({ id: withdrawal.id, rejectionReason: rejectionReason.trim() }).unwrap();
      toast.success("Withdrawal rejected.");
      setMode("idle");
      setRejectionReason("");
    } catch (error) {
      const message =
        normalizeError(error as Parameters<typeof normalizeError>[0])?.message ||
        "Failed to reject withdrawal";
      toast.error(message);
    }
  };

  const handleManualProcess = async () => {
    if (!manualTxHash || !/^0x[a-fA-F0-9]{64}$/.test(manualTxHash)) {
      toast.error("Enter a valid transaction hash");
      return;
    }
    try {
      await processWithdrawal({ id: withdrawal.id, transactionHash: manualTxHash }).unwrap();
      toast.success("Withdrawal approved and marked as completed.");
      setMode("idle");
      setManualTxHash("");
    } catch (error) {
      const message =
        normalizeError(error as Parameters<typeof normalizeError>[0])?.message ||
        "Failed to process withdrawal";
      toast.error(message);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {canAct && (
          <>
            <Button
              size="sm"
              onClick={() => setMode("process")}
              disabled={processMutation.isLoading || rejectMutation.isLoading}
            >
              <Wallet className="mr-1.5 size-3.5" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive border-destructive/50 hover:bg-destructive/10"
              onClick={() => setMode("reject")}
              disabled={processMutation.isLoading || rejectMutation.isLoading}
            >
              <XCircle className="mr-1.5 size-3.5" />
              Reject
            </Button>
          </>
        )}
        {withdrawal.status === "COMPLETED" && (
          <span className="text-muted-foreground text-xs">
            <CheckCircle className="mr-1 inline size-3.5 text-green-500" />
            Completed
          </span>
        )}
        {withdrawal.status === "REJECTED" && (
          <span className="text-muted-foreground text-xs">Rejected</span>
        )}
      </div>

      <Dialog open={mode === "process"} onOpenChange={(open) => !open && setMode("idle")}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve withdrawal</DialogTitle>
            <DialogDescription>
              Connect an admin wallet and send the requested net USDT amount to the user.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg border p-3 text-sm">
              <div className="text-muted-foreground">Destination address</div>
              <div className="mt-0.5 font-mono text-xs break-all">
                {withdrawal.destinationAddress}
              </div>
              <div className="mt-2 text-muted-foreground">Amount to send</div>
              <div className="mt-0.5 font-medium">{withdrawal.netAmount} USDT</div>
              {Number(withdrawal.penalty) > 0 && (
                <div className="mt-2 flex items-start gap-2 text-amber-500 text-xs">
                  <AlertTriangle className="mt-0.5 size-3.5" />
                  <span>
                    Includes {withdrawal.penalty} early-withdrawal penalty (user requested {withdrawal.amount} USDT)
                  </span>
                </div>
              )}
            </div>

            {!isAppKitConnected ? (
              <Button onClick={() => open()} className="w-full">
                <Wallet className="mr-2 size-4" />
                Connect wallet
              </Button>
            ) : (
              <>
                <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">Connected</div>
                    <div className="font-mono text-xs">{truncateHex(appKitAddress ?? "")}</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => disconnect()}>
                    Disconnect
                  </Button>
                </div>

                <Button
                  onClick={handleSend}
                  disabled={isWritePending || isConfirming}
                  className="w-full"
                >
                  {isWritePending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : isConfirming ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : null}
                  {isWritePending
                    ? "Confirm in wallet…"
                    : isConfirming
                    ? "Confirming on-chain…"
                    : `Send ${withdrawal.netAmount} USDT`}
                </Button>

                {hash && (
                  <div className="text-muted-foreground text-xs">
                    Tx: {truncateHex(hash)}
                  </div>
                )}
              </>
            )}

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">OR</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`manual-tx-${withdrawal.id}`}>
                Already sent? Paste transaction hash
              </Label>
              <Input
                id={`manual-tx-${withdrawal.id}`}
                value={manualTxHash}
                onChange={(e) => setManualTxHash(e.target.value)}
                placeholder="0x..."
              />
              <Button
                onClick={handleManualProcess}
                disabled={processMutation.isLoading || !manualTxHash}
                variant="outline"
                className="w-full"
              >
                {processMutation.isLoading && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                Submit transaction hash
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={mode === "reject"} onOpenChange={(open) => !open && setMode("idle")}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject withdrawal</DialogTitle>
            <DialogDescription>
              The requested amount will be refunded to the user&apos;s source wallet.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor={`reject-reason-${withdrawal.id}`}>Reason</Label>
              <Input
                id={`reject-reason-${withdrawal.id}`}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason for rejection"
              />
            </div>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isLoading}
              className="w-full"
            >
              {rejectMutation.isLoading && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Reject withdrawal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function truncateHex(value: string) {
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}
