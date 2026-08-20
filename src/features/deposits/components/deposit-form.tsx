"use client";

import { useState, useEffect } from "react";
import { Wallet, Loader2, QrCode, Keyboard } from "lucide-react";
import { toast } from "sonner";
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { useDisconnect, useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { useAccount } from 'wagmi';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateDepositMutation, useDepositWalletAddressQuery } from "@/features/deposits/api/deposits-api";
import { normalizeError } from "@/lib/api/errors";
import { CopyButton } from "@/components/common/copy-button";
import Image from "next/image";

const USDT_ABI = [
  {
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" }
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

export function DepositForm() {
  const { address, isConnected } = useAccount();
  const { isConnected: isAppKitConnected } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();
  
  const { writeContractAsync, data: hash, isPending: isWritePending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  
  const [createDeposit, mutation] = useCreateDepositMutation();
  const { data: depositWallet } = useDepositWalletAddressQuery();
  const [amount, setAmount] = useState("");
  const [processedHash, setProcessedHash] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [depositMode, setDepositMode] = useState<"wallet" | "manual">("wallet");
  const [manualTxHash, setManualTxHash] = useState("");
  const [manualSenderAddress, setManualSenderAddress] = useState("");
  const [isPendingPayment, setIsPendingPayment] = useState(false);
  const MIN_DEPOSIT = 50; // Backend requires minimum 50 USDT

  // Prefer admin-configured deposit wallet, fall back to env
  const companyWallet =
    depositWallet?.address ||
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_COMPANY_WALLET) ||
    "";
  const usdtContract = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_USDT_CONTRACT) || "";
  const network =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_DEPOSIT_NETWORK) ||
    "bsc-testnet"; // Default to BSC testnet

  // Debug logging
  useEffect(() => {
    console.log('Current wallet state:', { address, isConnected, companyWallet, usdtContract });
  }, [address, isConnected, companyWallet, usdtContract]);

  const executeWalletPayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    // Validate minimum deposit amount
    if (parseFloat(amount) < MIN_DEPOSIT) {
      toast.error(`Minimum deposit is ${MIN_DEPOSIT} USDT`);
      return;
    }

    // Validate environment variables
    if (!companyWallet) {
      toast.error("Company wallet address not configured. Please check NEXT_PUBLIC_COMPANY_WALLET");
      return;
    }

    if (!usdtContract) {
      toast.error("USDT contract address not configured. Please check NEXT_PUBLIC_USDT_CONTRACT");
      return;
    }

    // Validate addresses
    if (!/^0x[a-fA-F0-9]{40}$/.test(companyWallet)) {
      toast.error("Invalid company wallet address format");
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(usdtContract)) {
      toast.error("Invalid USDT contract address format");
      return;
    }

    try {
      // Use parseUnits with 18 decimals (like ETH) - this matches how the working example handles USDT
      // The smart contract likely expects 18 decimal places regardless of the token's actual decimals
      const amountInSmallestUnit = parseUnits(amount, 18);
      
      console.log('Payment details:', {
        inputAmount: amount,
        convertedAmount: amountInSmallestUnit.toString(),
        decimals: 18,
        contract: usdtContract,
        to: companyWallet,
        network
      });
      
      await writeContractAsync({
        address: usdtContract as `0x${string}`,
        abi: USDT_ABI,
        functionName: 'transfer',
        args: [companyWallet as `0x${string}`, amountInSmallestUnit],
      });
    } catch (error) {
      console.error('Payment initiation error:', error);
      const message =
        error instanceof Error ? error.message : "Failed to initiate payment. Please check console for details.";
      toast.error(message);
    }
  };

  const handleWalletPayment = () => {
    if (!isAppKitConnected) {
      setIsPendingPayment(true);
      open();
      return;
    }
    if (!isConnected) {
      setIsPendingPayment(true);
      return;
    }
    void executeWalletPayment();
  };

  useEffect(() => {
    if (isPendingPayment && isConnected) {
      setIsPendingPayment(false);
      void executeWalletPayment();
    }
  }, [isPendingPayment, isConnected, executeWalletPayment]);

  const handleManualDeposit = async () => {
    if (!manualTxHash) {
      toast.error("Please enter a transaction hash");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    // Validate minimum deposit amount
    if (parseFloat(amount) < MIN_DEPOSIT) {
      toast.error(`Minimum deposit is ${MIN_DEPOSIT} USDT`);
      return;
    }

    // Validate sender address format
    if (!manualSenderAddress || !/^0x[a-fA-F0-9]{40}$/.test(manualSenderAddress)) {
      toast.error("Invalid sender address format");
      return;
    }

    // Validate transaction hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(manualTxHash)) {
      toast.error("Invalid transaction hash format");
      return;
    }

    try {
      const depositData = {
        amount: parseFloat(amount),
        transactionHash: manualTxHash,
        senderAddress: manualSenderAddress,
        receiverAddress: companyWallet,
        tokenContract: usdtContract,
        network,
      };
      
      console.log('Submitting manual deposit to backend:', depositData);
      
      const result = await createDeposit(depositData).unwrap();
      
      console.log('Manual deposit submission result:', result);
      
      toast.success("Manual deposit submitted successfully!");
      setAmount("");
      setManualTxHash("");
      setManualSenderAddress("");
    } catch (error) {
      console.error('Manual deposit submission error:', error);
      toast.dismiss();
      const errorMessage = normalizeError(error as Error)?.message || "Failed to submit manual deposit";
      toast.error(errorMessage, {
        duration: 5000,
        id: 'manual-deposit-error'
      });
    }
  };

  // Submit deposit to backend after successful transaction
  useEffect(() => {
    if (isSuccess && hash && address && hash !== processedHash) {
      const submitDeposit = async () => {
        try {
          const depositData = {
            amount: parseFloat(amount),
            transactionHash: hash,
            senderAddress: address,
            receiverAddress: companyWallet,
            tokenContract: usdtContract,
            network,
          };
          
          console.log('Submitting deposit to backend:', depositData);
          
          const result = await createDeposit(depositData).unwrap();
          
          console.log('Deposit submission result:', result);
          
          // Mark this hash as processed
          setProcessedHash(hash);
          
          toast.success("Deposit submitted successfully!");
          setAmount("");
        } catch (error) {
          console.error('Deposit submission error:', error);
          
          // Mark this hash as processed even on error to prevent retries
          setProcessedHash(hash);
          
          // Clear any existing error toasts to prevent duplicates
          toast.dismiss();
          
          const errorMessage = normalizeError(error as Error)?.message || "Failed to submit deposit";
          toast.error(errorMessage, {
            duration: 5000,
            id: 'deposit-error' // Unique ID to prevent duplicates
          });
        }
      };
      
      submitDeposit();
    }
  }, [isSuccess, hash, address, amount, companyWallet, usdtContract, network, createDeposit, processedHash]);

  const isLoading = isWritePending || isConfirming || mutation.isLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="size-5" />
          Deposit
        </CardTitle>
        <CardDescription>
          Choose your deposit method - wallet wallet payment or manual transaction entry.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Deposit Mode Toggle */}
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <Button
            variant={depositMode === "wallet" ? "default" : "ghost"}
            size="sm"
            onClick={() => setDepositMode("wallet")}
            className="flex-1"
          >
            <Wallet className="mr-2 size-4" />
            Wallet
          </Button>
          <Button
            variant={depositMode === "manual" ? "default" : "ghost"}
            size="sm"
            onClick={() => setDepositMode("manual")}
            className="flex-1"
          >
            <Keyboard className="mr-2 size-4" />
            Manual
          </Button>
        </div>

        {depositMode === "wallet" && !isConnected ? (
          <Button onClick={() => {
            console.log('Opening wallet connection...');
            open();
          }} className="w-full">
            <Wallet className="mr-2 size-4" />
            Connect Wallet
          </Button>
        ) : (
          <>
            {depositMode === "wallet" && isConnected && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="text-sm">
                  <span className="text-muted-foreground">Connected: </span>
                  <span className="font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    console.log('Disconnecting wallet...');
                    disconnect();
                  }}
                >
                  Disconnect
                </Button>
              </div>
            )}
            
            {/* Common Amount Field */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USDT)</Label>
              <Input
                id="amount"
                type="number"
                min={MIN_DEPOSIT}
                step="any"
                placeholder={`Minimum ${MIN_DEPOSIT} USDT`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">Minimum deposit: {MIN_DEPOSIT} USDT</p>
            </div>

            {/* Wallet Mode Fields */}
            {depositMode === "wallet" && (
              <>
                <div className="space-y-2">
                  <Label>From Wallet</Label>
                  <Input
                    value={address || ""}
                    readOnly
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label>To Platform Wallet (Receiver Address)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={companyWallet}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <CopyButton value={companyWallet} label="Copy address" />
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQRCode(!showQRCode)}
                  className="w-full"
                >
                  <QrCode className="mr-2 size-4" />
                  {showQRCode ? 'Hide QR Code' : 'Show QR Code'}
                </Button>

                {showQRCode && companyWallet && (
                  <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-white p-4 rounded-lg shadow-md relative w-48 h-48">
                      <Image 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(companyWallet)}`}
                        alt="Receiver Address QR Code"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <div className="mt-3 flex flex-col items-center gap-2">
                      <p className="text-xs text-muted-foreground text-center">
                        Scan QR code to copy receiver address
                      </p>
                      <CopyButton value={companyWallet} label="Copy address" />
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleWalletPayment}
                  disabled={isLoading || !amount}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Pay with Wallet"
                  )}
                </Button>
              </>
            )}

            {/* Manual Mode Fields */}
            {depositMode === "manual" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="manualSenderAddress">Sender Address</Label>
                  <Input
                    id="manualSenderAddress"
                    placeholder="0x..."
                    value={manualSenderAddress}
                    onChange={(e) => setManualSenderAddress(e.target.value)}
                    disabled={isLoading}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the wallet address that sent the funds
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manualTxHash">Transaction Hash</Label>
                  <Input
                    id="manualTxHash"
                    placeholder="0x..."
                    value={manualTxHash}
                    onChange={(e) => setManualTxHash(e.target.value)}
                    disabled={isLoading}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the transaction hash from your wallet transfer
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>To Platform Wallet (Receiver Address)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={companyWallet}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <CopyButton value={companyWallet} label="Copy address" />
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQRCode(!showQRCode)}
                  className="w-full"
                >
                  <QrCode className="mr-2 size-4" />
                  {showQRCode ? 'Hide QR Code' : 'Show QR Code'}
                </Button>

                {showQRCode && companyWallet && (
                  <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-white p-4 rounded-lg shadow-md relative w-48 h-48">
                      <Image 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(companyWallet)}`}
                        alt="Receiver Address QR Code"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <div className="mt-3 flex flex-col items-center gap-2">
                      <p className="text-xs text-muted-foreground text-center">
                        Scan QR code to copy receiver address
                      </p>
                      <CopyButton value={companyWallet} label="Copy address" />
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleManualDeposit}
                  disabled={isLoading || !amount || !manualTxHash || !manualSenderAddress}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Submit Manual Deposit"
                  )}
                </Button>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}