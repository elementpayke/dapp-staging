/**
 * useOfframpTransaction - Hook for executing offramp transactions
 *
 * Orchestrates the complete offramp flow:
 * 1. Network switching (if needed)
 * 2. Token approval
 * 3. Message signing
 * 4. Order creation via backend API
 * 5. Settlement monitoring via on-chain events
 */

import { useCallback, useEffect } from "react";
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useWriteContract,
  useWalletClient,
  usePublicClient,
} from "wagmi";
import { parseUnits } from "viem";
import { toast } from "sonner";

import {
  useTransactionStore,
  TransactionError,
  TransactionPhase,
  TransactionDetails,
} from "@/stores/transactionStore";
import {
  useOrderSettlement,
  fetchOrderReceipt,
} from "@/hooks/useOrderSettlement";
import { SupportedToken } from "@/constants/supportedTokens";
import { FeeBand, getTotalCost } from "@/utils/feeStructure";
import { encryptMessageDetailed } from "@/services/encryption";
import { erc20Abi } from "@/app/api/abi";
import { createOffRampOrder, fetchOrderQuote } from "@/app/api/aggregator";
import { KYCRequiredError, extractKYCLimitSnapshot } from "@/services/kycError";
import { useKYCModalStore } from "@/stores/kycModalStore";
import { isSmartWallet, safeChainSwitch } from "@/lib/wallet-utils";
import { getTokenConfig } from "@/constants/tokenConfig";

// Chain ID mapping
const CHAIN_IDS: Record<string, number> = {
  Base: 8453,
  Lisk: 1135,
  Scroll: 534352,
  Arbitrum: 42161,
};

// Contract address mapping
const CONTRACT_ADDRESSES: Record<string, string> = {
  Base: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_BASE!,
  Lisk: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_LISK!,
  Scroll: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_SCROLL!,
  Arbitrum: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ARBITRUM!,
};

export interface OfframpParams {
  token: SupportedToken;
  amountFiat: number;
  exchangeRate: number;
  feeBands: FeeBand[];
  paymentMethod: "PHONE" | "PAYBILL" | "TILL";
  phoneNumber?: string;
  paybillNumber?: string;
  accountNumber?: string;
  tillNumber?: string;
}

export interface UseOfframpTransactionReturn {
  /** Execute the offramp transaction */
  execute: (params: OfframpParams) => Promise<void>;
  /** Cancel/abort the transaction */
  cancel: () => void;
  /** Current transaction phase */
  phase: TransactionPhase;
  /** Transaction details */
  details: TransactionDetails;
  /** Any error that occurred */
  error: TransactionError | null;
  /** Whether a transaction is in progress */
  isProcessing: boolean;
}

export function useOfframpTransaction(): UseOfframpTransactionReturn {
  const account = useAccount();
  const { connector } = account;
  const currentChainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const store = useTransactionStore();
  const {
    phase,
    details,
    error,
    setPhase,
    updateDetails,
    fail,
    complete,
    reset,
  } = store;

  // Watch for settlement events using getLogs polling
  const {
    isSettled,
    settlementResult,
    pollCount,
    reset: resetSettlement,
  } = useOrderSettlement({
    contractAddress: (details.contractAddress || "0x0") as `0x${string}`,
    orderId: details.orderId,
    txHash: details.txHash, // Pass txHash to get starting block
    enabled: phase === "submitted" || phase === "polling",
    onSettled: async (result) => {
      console.log(
        "🎉 [useOfframpTransaction] Order settled via event:",
        result,
      );

      // Fetch receipt details from backend
      try {
        const receipt = await fetchOrderReceipt(result.transactionHash);
        complete({
          txHash: result.transactionHash,
          mpesaReceiptNumber: receipt?.mpesa_receipt_number,
          receiverName: receipt?.receiver_name,
          settledAt: receipt?.settled_at || new Date().toISOString(),
        });
      } catch (err) {
        // Still mark as complete even if receipt fetch fails
        complete({ txHash: result.transactionHash });
      }
    },
    onRefunded: (orderId) => {
      fail({
        code: "ORDER_REFUNDED",
        message: "Order was refunded. Please try again.",
        details: { orderId },
      });
    },
  });

  // Update phase to polling after initial submission
  useEffect(() => {
    if (phase === "submitted" && pollCount > 0) {
      console.log(
        `📊 [useOfframpTransaction] Polling for settlement... (attempt ${pollCount})`,
      );
      setPhase("polling");
    }
  }, [phase, pollCount, setPhase]);

  // Backend API fallback when on-chain events aren't found after many attempts
  useEffect(() => {
    if (phase !== "polling" || !details.txHash || pollCount < 10) return;

    // After 10 on-chain poll attempts (~30s), also check backend
    const checkBackend = async () => {
      try {
        const receipt = await fetchOrderReceipt(details.txHash!);

        if (receipt?.status === "settled" || receipt?.status === "complete") {
          console.log(
            "✅ [useOfframpTransaction] Settlement found via backend",
          );
          complete({
            mpesaReceiptNumber: receipt.mpesa_receipt_number,
            receiverName: receipt.receiver_name,
            settledAt: receipt.settled_at,
          });
        } else if (receipt?.status === "failed") {
          fail({
            code: "ORDER_FAILED",
            message: receipt.failure_reason || "Transaction failed",
          });
        }
      } catch (err) {
        console.warn("[useOfframpTransaction] Backend check error:", err);
      }
    };

    // Check backend every 5th poll attempt
    if (pollCount % 5 === 0) {
      checkBackend();
    }
  }, [phase, details.txHash, pollCount, complete, fail]);

  const execute = useCallback(
    async (params: OfframpParams) => {
      const {
        token,
        amountFiat,
        exchangeRate,
        feeBands,
        paymentMethod,
        phoneNumber,
        paybillNumber,
        accountNumber,
        tillNumber,
      } = params;

      if (!account.address) {
        toast.error("Please connect your wallet first");
        return;
      }

      if (!walletClient) {
        toast.error("Wallet not connected properly. Please reconnect.");
        return;
      }

      const contractAddress = CONTRACT_ADDRESSES[token.chain];
      const targetChainId = CHAIN_IDS[token.chain];

      // Calculate costs
      const costResult = getTotalCost({
        amountFiat,
        tokenBalance: Infinity, // We'll check balance separately
        exchangeRate,
        feeBands,
        orderType: "OffRamp",
      });

      // Determine recipient display
      let recipient = "";
      if (paymentMethod === "PHONE") recipient = phoneNumber || "";
      else if (paymentMethod === "PAYBILL")
        recipient = `${paybillNumber} - ${accountNumber}`;
      else if (paymentMethod === "TILL") recipient = tillNumber || "";

      // Initialize store
      store.start({
        amount: amountFiat.toString(),
        amountFiat,
        amountToken: costResult.totalTokenCost,
        recipient,
        paymentMethod,
        phoneNumber,
        paybillNumber,
        accountNumber,
        tillNumber,
        token,
        contractAddress,
        feeAmount: costResult.feeAmountFiat,
        effectiveRate: exchangeRate,
      });

      try {
        // Step 1: Network switching
        if (currentChainId !== targetChainId) {
          setPhase("switching-network");

          const isSmartWalletConnected = isSmartWallet(connector);

          if (!isSmartWalletConnected) {
            const switchResult = await safeChainSwitch({
              connector,
              currentChainId,
              targetChainId,
              switchChainAsyncFn: switchChainAsync,
              chainName: token.chain,
            });

            if (!switchResult.success) {
              throw new Error(
                switchResult.message || "Failed to switch network",
              );
            }
          }
        }

        // Step 2: Fetch quote to get exact approval amount
        setPhase("validating");

        let requiredApprovalAmount: string;
        let hasSufficientAllowance = false;

        try {
          const quoteResponse = await fetchOrderQuote({
            amountFiat,
            tokenAddress: token.tokenAddress,
            walletAddress: account.address,
            orderType: 1, // OffRamp
            currency: "KES",
          });

          if (quoteResponse.status === "success" && quoteResponse.data) {
            const tokenConfig = getTokenConfig(token.tokenAddress);
            const decimals = tokenConfig?.decimals || 6;
            requiredApprovalAmount = (
              quoteResponse.data.required_token_amount_raw /
              Math.pow(10, decimals)
            ).toFixed(decimals);
            hasSufficientAllowance =
              quoteResponse.data.has_sufficient_allowance ?? false;
          } else {
            throw new Error("Failed to get quote");
          }
        } catch (quoteError) {
          // Fallback to calculated amount
          requiredApprovalAmount = (costResult.totalTokenCost * 1.01).toFixed(
            6,
          );
        }

        // Step 3: Token approval (if needed)
        if (!hasSufficientAllowance) {
          setPhase("approving");

          const approvalAmount = parseUnits(requiredApprovalAmount, 6);

          const approvalTx = await writeContractAsync({
            address: token.tokenAddress as `0x${string}`,
            abi: erc20Abi,
            functionName: "approve",
            args: [contractAddress as `0x${string}`, approvalAmount],
          });

          // Wait for approval confirmation
          if (publicClient) {
            await publicClient.waitForTransactionReceipt({ hash: approvalTx });
          }

          console.log("✅ [useOfframpTransaction] Token approved:", approvalTx);
        }

        // Step 4: Create encrypted message hash
        const messageHash = encryptMessageDetailed({
          cashout_type: paymentMethod,
          amount_fiat: amountFiat,
          currency: "KES",
          rate: exchangeRate,
          phone_number: phoneNumber,
          paybill_number: paybillNumber,
          account_number: accountNumber,
          till_number: tillNumber,
        });

        updateDetails({ messageHash });

        // Step 5: Sign order details
        setPhase("signing");

        const orderDetails = {
          user_address: account.address,
          token: token.tokenAddress,
          order_type: 1,
          fiat_payload: {
            amount_fiat: amountFiat,
            cashout_type: paymentMethod,
            currency: "KES",
            phone_number: paymentMethod === "PHONE" ? phoneNumber : undefined,
            paybill_number:
              paymentMethod === "PAYBILL" ? paybillNumber : undefined,
            account_number:
              paymentMethod === "PAYBILL" ? accountNumber : undefined,
            till_number: paymentMethod === "TILL" ? tillNumber : undefined,
          },
          message_hash: messageHash,
        };

        const signature = await walletClient.signMessage({
          message: JSON.stringify(orderDetails),
          account: account.address as `0x${string}`,
        });

        console.log("✅ [useOfframpTransaction] Message signed");

        // Step 6: Create order via backend API
        setPhase("submitting");

        const apiResponse = await createOffRampOrder({
          userAddress: account.address,
          tokenAddress: token.tokenAddress,
          amount: costResult.totalTokenCost,
          amountFiat,
          phoneNumber: phoneNumber || "",
          messageHash,
          cashoutType: paymentMethod,
          paybillNumber: paybillNumber || "",
          accountNumber: accountNumber || "",
          tillNumber: tillNumber || "",
        });

        if (!apiResponse?.data?.tx_hash) {
          throw new Error("No transaction hash received from API");
        }

        const txHash = apiResponse.data.tx_hash;
        console.log("✅ [useOfframpTransaction] Order created:", txHash);

        updateDetails({
          txHash,
          orderId: txHash, // Use txHash as orderId for now
        });

        setPhase("submitted");

        // From here, the settlement watcher takes over
      } catch (err: any) {
        console.error("[useOfframpTransaction] Error:", err);

        const errorMessage = err?.message || "Transaction failed";

        // Handle KYC required (transaction limit exceeded)
        if (err instanceof KYCRequiredError) {
          console.log("🛡️ [KYC] Transaction limit exceeded — opening KYC modal");
          useKYCModalStore
            .getState()
            .openKYCModal(extractKYCLimitSnapshot(err.details));
          fail({
            code: "KYC_REQUIRED",
            message: err.message || "Transaction limit exceeded. Please verify your identity.",
          });
          return;
        }

        // Handle user rejection
        if (
          errorMessage.includes("rejected") ||
          errorMessage.includes("denied") ||
          err?.code === 4001
        ) {
          fail({
            code: "USER_REJECTED",
            message: "Transaction was rejected in wallet",
          });
          return;
        }

        // Handle timeout
        if (errorMessage.includes("timeout")) {
          fail({
            code: "TIMEOUT",
            message: "Transaction timed out. Please try again.",
          });
          return;
        }

        fail({
          code: "UNKNOWN_ERROR",
          message: errorMessage,
          details: err,
        });
      }
    },
    [
      account.address,
      connector,
      currentChainId,
      switchChainAsync,
      writeContractAsync,
      walletClient,
      publicClient,
      store,
      setPhase,
      updateDetails,
      fail,
    ],
  );

  const cancel = useCallback(() => {
    reset();
    resetSettlement();
  }, [reset, resetSettlement]);

  const isProcessing = !["idle", "settled", "failed"].includes(phase);

  return {
    execute,
    cancel,
    phase,
    details,
    error,
    isProcessing,
  };
}

export default useOfframpTransaction;
