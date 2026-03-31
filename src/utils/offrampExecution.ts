import { createOffRampOrder, fetchOrderQuote } from "@/app/api/aggregator";
import type { SupportedToken } from "@/constants/supportedTokens";
import { getTokenConfig } from "@/constants/tokenConfig";
import { KYCRequiredError } from "@/services/kycError";
import { InsufficientAllowanceError } from "@/services/allowanceError";
import { isSmartWallet, safeChainSwitch } from "@/lib/wallet-utils";
import { formatUnits } from "viem";

export type OfframpCashoutType = "PHONE" | "PAYBILL" | "TILL";
export type PaymentMethodLabel = "Send Money" | "Pay Bill" | "Buy Goods";

export interface OfframpReceipt {
  amount: string;
  amountUSDC: number;
  phoneNumber: string;
  address: string;
  status: number;
  transactionHash: string;
}

export interface OfframpSummary {
  canAfford: boolean;
  totalUSDC: number;
  usdcAmount: number;
}

export interface SponsoredApprovalParams {
  amount: string;
  chainId: number;
  spender: `0x${string}`;
  tokenAddress: `0x${string}`;
}

export interface OfframpNotifier {
  info: (message: string, options?: Record<string, unknown>) => void;
  success: (message: string) => void;
  warning: (message: string) => void;
  error: (message: string) => void;
}

export interface ExecuteOfframpOrderOptions {
  selectedToken: SupportedToken;
  currentChainId: number;
  connector: any;
  switchChainAsync?: (args: { chainId: number }) => Promise<unknown>;
  isMobileWalletFlow: boolean;
  accountAddress?: string;
  amountFiat: string;
  messageHash: string;
  reason: string;
  mobileNumber: string;
  paybillNumber: string;
  accountNumber: string;
  tillNumber: string;
  contractAddress: string;
  transactionSummary: OfframpSummary;
  selectedTokenBalance: number;
  cashoutType: OfframpCashoutType;
  approveTokenIfNeeded: (
    spender: string,
    amount: string,
  ) => Promise<string | null>;
  sponsoredApproval?: {
    enabled: boolean;
    spenderAddress: `0x${string}`;
    execute: (params: SponsoredApprovalParams) => Promise<string | null>;
  };
  setApproving: (value: boolean) => void;
  setProcessing: (value: boolean) => void;
  setShowProcessingPopup: (value: boolean) => void;
  setOrderId: (orderId: string) => void;
  setFinalTransactionData: (data: any) => void;
  setPollingComplete: (value: boolean) => void;
  setTransactionReceipt: (
    updater: (prev: OfframpReceipt) => OfframpReceipt,
  ) => void;
  refreshTransactionList: () => void;
  onKycRequired: (err: KYCRequiredError) => void;
  /** Called on early exit (cancel, validation failure, etc.) so the caller can reset stale state. */
  onEarlyExit?: () => void;
  notify: OfframpNotifier;
  showNetworkSwitchNotification?: (
    networkName: string,
    status: "switching" | "success" | "error",
  ) => void;
  /** AbortSignal to cancel the long-running flow when the user exits early. */
  signal?: AbortSignal;
}

const CHAIN_ID_MAP: Record<string, number> = {
  Base: 8453,
  Lisk: 1135,
  Scroll: 534352,
  Arbitrum: 42161,
  Polygon: 137,
};

const CONTRACT_ADDRESS_MAP: Record<string, string | undefined> = {
  Base: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_BASE,
  Lisk: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_LISK,
  Scroll: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_SCROLL,
  Arbitrum: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ARBITRUM,
  Polygon: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_POLYGON,
  Ethereum:
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ETHEREUM ??
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET,
};

export const getOfframpContractAddress = (chain: string): string => {
  const address = Object.prototype.hasOwnProperty.call(CONTRACT_ADDRESS_MAP, chain)
    ? (CONTRACT_ADDRESS_MAP[chain] ?? "")
    : (CONTRACT_ADDRESS_MAP.Base ?? "");
  console.log("[getOfframpContractAddress]", { chain, address, envPolygon: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_POLYGON });
  return address;
};

export const getTargetChainIdForToken = (token: SupportedToken): number =>
  CHAIN_ID_MAP[token.chain] || CHAIN_ID_MAP.Base;

export const mapOffRampMethodToPaymentMethod = (
  method: OfframpCashoutType,
): PaymentMethodLabel => {
  if (method === "PAYBILL") return "Pay Bill";
  if (method === "TILL") return "Buy Goods";
  return "Send Money";
};

export const buildRecipientLabel = (params: {
  cashoutType: OfframpCashoutType;
  mobileNumber: string;
  paybillNumber: string;
  accountNumber: string;
  tillNumber: string;
}): string => {
  const {
    cashoutType,
    mobileNumber,
    paybillNumber,
    accountNumber,
    tillNumber,
  } = params;
  if (cashoutType === "PHONE") return mobileNumber;
  if (cashoutType === "PAYBILL") return `${paybillNumber} - ${accountNumber}`;
  return tillNumber;
};

export const pollOfframpOrderStatus = async (
  txHash: string,
  signal?: AbortSignal,
): Promise<any | null> => {
  let attempts = 0;
  const maxAttempts = 30;
  const delay = 2000;

  while (attempts < maxAttempts) {
    if (signal?.aborted) return null;
    try {
      const res = await fetch(
        `/api/element-pay/orders/status?txHash=${encodeURIComponent(txHash)}`,
      );
      const data = await res.json();

      if (data?.data) {
        const orderData = data.data;
        const statusUpper = orderData.status?.toUpperCase() || "";

        const isFinalState = [
          "SETTLED",
          "FAILED",
          "SETTLED_UNVERIFIED",
          "COMPLETED",
          "REFUNDED",
        ].includes(statusUpper);

        const hasMpesaReceipt = !!orderData.mpesa_receipt_number;
        const hasSettlementHash = !!orderData.transaction_hashes?.settlement;

        if (isFinalState || hasMpesaReceipt || hasSettlementHash) {
          let normalizedStatus = "SETTLED";
          if (["FAILED", "REJECTED", "CANCELLED"].includes(statusUpper)) {
            normalizedStatus = "FAILED";
          }

          return {
            ...orderData,
            status: normalizedStatus,
            transaction_hash:
              orderData.transaction_hashes?.settlement ||
              orderData.transaction_hashes?.creation ||
              txHash,
            receipt_number:
              orderData.mpesa_receipt_number ||
              orderData.receipt_number ||
              orderData.file_id ||
              "",
            receiver_name: orderData.receiver_name || "",
            mpesa_receipt_number: orderData.mpesa_receipt_number || "",
            created_at: orderData.created_at || new Date().toISOString(),
            amount_fiat: orderData.amount_fiat,
          };
        }
      }
    } catch {
      // Continue polling on transient failures.
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
    attempts++;
    if (signal?.aborted) return null;
  }

  return null;
};

export const executeOfframpOrder = async (
  opts: ExecuteOfframpOrderOptions,
): Promise<void> => {
  const {
    selectedToken,
    currentChainId,
    connector,
    switchChainAsync,
    isMobileWalletFlow,
    accountAddress,
    amountFiat,
    messageHash,
    reason,
    mobileNumber,
    paybillNumber,
    accountNumber,
    tillNumber,
    contractAddress,
    transactionSummary,
    selectedTokenBalance,
    cashoutType,
    approveTokenIfNeeded,
    sponsoredApproval,
    setApproving,
    setProcessing,
    setShowProcessingPopup,
    setOrderId,
    setFinalTransactionData,
    setPollingComplete,
    setTransactionReceipt,
    refreshTransactionList,
    onKycRequired,
    onEarlyExit,
    notify,
    showNetworkSwitchNotification,
    signal,
  } = opts;

  const targetChainId = getTargetChainIdForToken(selectedToken);

  if (currentChainId !== targetChainId && switchChainAsync) {
    const smartWallet = isSmartWallet(connector);

    if (smartWallet) {
      notify.info(
        `Smart wallet detected. Proceeding with ${selectedToken.chain} transaction.`,
      );
    } else {
      if (isMobileWalletFlow) {
        notify.info(
          `Switching to ${selectedToken.chain}. Please approve in your wallet app.`,
          { autoClose: 5000 },
        );
      }

      showNetworkSwitchNotification?.(selectedToken.chain, "switching");

      try {
        const switchResult = await safeChainSwitch({
          connector,
          currentChainId,
          targetChainId,
          switchChainAsyncFn: switchChainAsync,
          chainName: selectedToken.chain,
        });

        if (!switchResult.success) {
          showNetworkSwitchNotification?.(selectedToken.chain, "error");
          notify.error(switchResult.message);
          onEarlyExit?.();
          return;
        }

        if (switchResult.method === "switched") {
          const waitTime = isMobileWalletFlow ? 3000 : 1000;
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          showNetworkSwitchNotification?.(selectedToken.chain, "success");

          if (!isMobileWalletFlow) {
            notify.success(
              `Switched to ${selectedToken.chain}. Please try again.`,
            );
            onEarlyExit?.();
            return;
          }
        } else if (switchResult.method === "manual-required") {
          showNetworkSwitchNotification?.(selectedToken.chain, "error");
          notify.warning(switchResult.message);
          onEarlyExit?.();
          return;
        }
      } catch {
        showNetworkSwitchNotification?.(selectedToken.chain, "error");
        notify.error(`Please switch to ${selectedToken.chain} to continue.`);
        onEarlyExit?.();
        return;
      }
    }
  }

  try {
    setApproving(true);

    if (!contractAddress) {
      notify.error(
        `Offramp is not configured for ${selectedToken.chain} yet. Add the chain contract address before retrying.`,
      );
      setApproving(false);
      setProcessing(false);
      onEarlyExit?.();
      return;
    }

    if (!transactionSummary.canAfford) {
      notify.error(
        `Insufficient balance. You need ${transactionSummary.totalUSDC.toFixed(6)} ${selectedToken.symbol} but only have ${selectedTokenBalance.toFixed(6)} ${selectedToken.symbol}`,
      );
      setApproving(false);
      setProcessing(false);
      onEarlyExit?.();
      return;
    }

    let validationError = "";
    if (!accountAddress || !selectedToken.tokenAddress || !amountFiat || !messageHash) {
      validationError =
        "Missing required order details. Please fill all fields and connect your wallet.";
    } else if (cashoutType === "PHONE" && !mobileNumber) {
      validationError = "Phone number is required for Send Money.";
    } else if (
      cashoutType === "PAYBILL" &&
      (!paybillNumber || !accountNumber)
    ) {
      validationError =
        "Business number and account number are required for Pay Bill.";
    } else if (cashoutType === "TILL" && !tillNumber) {
      validationError = "Till number is required for Buy Goods.";
    }

    if (validationError) {
      notify.error(validationError);
      setApproving(false);
      setProcessing(false);
      onEarlyExit?.();
      return;
    }

    setShowProcessingPopup(true);

    if (isMobileWalletFlow) {
      notify.info("Please check your wallet app to approve the transaction.", {
        autoClose: 10000,
      });
    }

    const recipientLabel = buildRecipientLabel({
      cashoutType,
      mobileNumber,
      paybillNumber,
      accountNumber,
      tillNumber,
    });

    setTransactionReceipt((prev) => ({
      ...prev,
      amount: amountFiat,
      amountUSDC: transactionSummary.totalUSDC,
      phoneNumber: recipientLabel,
      address: accountAddress || "",
      transactionHash: "",
      status: 0,
    }));

    if (!accountAddress) {
      notify.error("Wallet address not found. Please connect your wallet.");
      setApproving(false);
      setProcessing(false);
      setShowProcessingPopup(false);
      onEarlyExit?.();
      return;
    }

    let requiredApprovalAmount = "";
    let requiredTransferAmount = "";
    let requiredTransferAmountNumber = 0;
    let hasSufficientAllowance = false;

    try {
      const quoteResponse = await fetchOrderQuote({
        amountFiat: Number(amountFiat),
        tokenAddress: selectedToken.tokenAddress,
        walletAddress: accountAddress,
        orderType: 1,
        currency: "KES",
        skipCache: true,
      });

      if (quoteResponse.status !== "success" || !quoteResponse.data) {
        throw new Error("Failed to get quote from API");
      }

      const tokenConfig = getTokenConfig(selectedToken.tokenAddress);
      const decimals = tokenConfig?.decimals || 6;
      const requiredTokenAmountRaw = BigInt(
        quoteResponse.data.required_token_amount_raw,
      );
      const baseAmount =
        quoteResponse.data.required_token_amount_raw / Math.pow(10, decimals);
      requiredTransferAmount = formatUnits(requiredTokenAmountRaw, decimals);
      requiredTransferAmountNumber = Number(requiredTransferAmount);
      const bufferedAmount = baseAmount * 1.005;
      requiredApprovalAmount = bufferedAmount.toFixed(decimals);
      hasSufficientAllowance =
        quoteResponse.data.has_sufficient_allowance ?? false;

      if (Number.isFinite(requiredTransferAmountNumber) && requiredTransferAmountNumber > 0) {
        setTransactionReceipt((prev) => ({
          ...prev,
          amountUSDC: requiredTransferAmountNumber,
        }));
      }
    } catch (quoteError: any) {
      setShowProcessingPopup(false);
      setApproving(false);
      setProcessing(false);
      notify.error(
        quoteError?.response?.data?.message ||
          quoteError?.message ||
          "Failed to calculate required approval amount. Please try again.",
      );
      onEarlyExit?.();
      return;
    }

    if (sponsoredApproval?.enabled) {
      if (!requiredApprovalAmount) {
        setShowProcessingPopup(false);
        setApproving(false);
        setProcessing(false);
        notify.error("Failed to prepare the sponsored approval amount. Please try again.");
        onEarlyExit?.();
        return;
      }

      notify.info("Please confirm the sponsored approval to continue.", {
        autoClose: 15000,
      });

      const approvalTxHash = await sponsoredApproval.execute({
        amount: requiredApprovalAmount,
        chainId: targetChainId,
        spender: sponsoredApproval.spenderAddress,
        tokenAddress: selectedToken.tokenAddress as `0x${string}`,
      });

      if (!approvalTxHash) {
        setShowProcessingPopup(false);
        setApproving(false);
        setProcessing(false);
        notify.error("Sponsored approval failed. Cannot proceed with order creation.");
        onEarlyExit?.();
        return;
      }

      notify.info("Approval confirmed. Creating your payout order...", {
        autoClose: 8000,
      });
    } else if (!hasSufficientAllowance) {
      if (isMobileWalletFlow) {
        notify.info("Approval needed. Please approve in your wallet app.", {
          autoClose: 15000,
        });
      }

      const approveTxHash = await approveTokenIfNeeded(
        contractAddress,
        requiredApprovalAmount,
      );

      if (!approveTxHash) {
        setShowProcessingPopup(false);
        setApproving(false);
        setProcessing(false);
        notify.error("Token approval failed. Cannot proceed with order creation.");
        onEarlyExit?.();
        return;
      }

      if (isMobileWalletFlow) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        notify.info("Approval successful! Now signing the transaction...", {
          autoClose: 10000,
        });
      }
    }

    if (!messageHash) {
      setShowProcessingPopup(false);
      setApproving(false);
      setProcessing(false);
      notify.error("Order details are incomplete. Please try again.");
      onEarlyExit?.();
      return;
    }

    let apiResponse: any;
    const createOrderPayload = {
      userAddress: accountAddress,
      tokenAddress: selectedToken.tokenAddress,
      amount:
        Number.isFinite(requiredTransferAmountNumber) &&
        requiredTransferAmountNumber > 0
          ? requiredTransferAmountNumber
          : transactionSummary.totalUSDC,
      amountFiat: Number(amountFiat),
      phoneNumber: cashoutType === "PHONE" ? mobileNumber : "",
      messageHash,
      reason: reason || "",
      cashoutType,
      paybillNumber: cashoutType === "PAYBILL" ? paybillNumber : "",
      accountNumber: cashoutType === "PAYBILL" ? accountNumber : "",
      tillNumber: cashoutType === "TILL" ? tillNumber : "",
    };

    const callCreateOrder = () =>
      Promise.race([
        createOffRampOrder(createOrderPayload),
        new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  "API request timed out after 45 seconds. The Element Pay service may be experiencing high load. Please try again in a few moments or contact support if the issue persists.",
                ),
              ),
            45000,
          ),
        ),
      ]);

    try {
      apiResponse = await callCreateOrder();
    } catch (apiError: any) {
      // ── Insufficient allowance → force re-approve + retry once ──
      if (apiError instanceof InsufficientAllowanceError) {
        console.warn(
          "[Offramp] Insufficient allowance detected, forcing re-approval...",
          { current: apiError.currentAllowance, required: apiError.requiredAllowance },
        );

        notify.info(
          "Approval is syncing on-chain. Retrying automatically...",
          { autoClose: 10000 },
        );

        // Wait for RPC propagation before re-approving
        await new Promise((resolve) => setTimeout(resolve, 3000));

        let retryApprovalOk = false;
        if (sponsoredApproval?.enabled) {
          const retryHash = await sponsoredApproval.execute({
            amount: requiredApprovalAmount,
            chainId: targetChainId,
            spender: sponsoredApproval.spenderAddress,
            tokenAddress: selectedToken.tokenAddress as `0x${string}`,
          });
          retryApprovalOk = !!retryHash;
        } else {
          const retryHash = await approveTokenIfNeeded(
            contractAddress,
            requiredApprovalAmount,
          );
          retryApprovalOk = !!retryHash;
        }

        if (!retryApprovalOk) {
          setShowProcessingPopup(false);
          setApproving(false);
          setProcessing(false);
          notify.error("Re-approval failed. Please try the transaction again.");
          onEarlyExit?.();
          return;
        }

        // Extra delay after approval confirmation to let backend RPC catch up
        await new Promise((resolve) => setTimeout(resolve, 4000));

        try {
          apiResponse = await callCreateOrder();
          notify.success("Order created successfully on retry!");
        } catch (retryError: any) {
          setShowProcessingPopup(false);

          if (retryError instanceof KYCRequiredError) {
            onKycRequired(retryError);
            setApproving(false);
            setProcessing(false);
            onEarlyExit?.();
            return;
          }

          const retryMsg =
            retryError instanceof InsufficientAllowanceError
              ? "Approval is still syncing on-chain. Please wait a moment and try again."
              : retryError?.message || "Payment processing failed. Please try again.";
          notify.error(retryMsg);
          setApproving(false);
          setProcessing(false);
          onEarlyExit?.();
          return;
        }
      } else {
        setShowProcessingPopup(false);

        if (apiError instanceof KYCRequiredError) {
          onKycRequired(apiError);
          setApproving(false);
          setProcessing(false);
          onEarlyExit?.();
          return;
        }

        const errorMessage =
          apiError?.message || "Payment processing failed. Please try again.";
        notify.error(errorMessage);
        setApproving(false);
        setProcessing(false);
        onEarlyExit?.();
        return;
      }
    }

    const orderId = apiResponse?.data?.tx_hash || "";
    if (!orderId) {
      notify.error(
        "Order created but no transaction hash returned. Please check your transaction history.",
      );
      setShowProcessingPopup(false);
      setApproving(false);
      setProcessing(false);
      onEarlyExit?.();
      return;
    }

    setOrderId(orderId);
    setTransactionReceipt((prev) => ({
      ...prev,
      transactionHash: orderId,
    }));

    // If the user cancelled while the API call was in flight, bail out now
    // so we don't overwrite state that belongs to a new transaction.
    if (signal?.aborted) return;

    const statusData = await pollOfframpOrderStatus(orderId, signal);

    // Guard: user may have cancelled during polling
    if (signal?.aborted) return;

    if (statusData) {
      const isSettled = statusData.status === "SETTLED";
      const isFailed = statusData.status === "FAILED";

      setFinalTransactionData(statusData);
      setPollingComplete(true);

      setTransactionReceipt((prev) => ({
        ...prev,
        status: isSettled ? 1 : isFailed ? 2 : 0,
        transactionHash: statusData.transaction_hash || orderId,
      }));

      refreshTransactionList();

      if (signal?.aborted) return;

      if (isSettled) {
        notify.success(
          `Payment completed! ${
            statusData.mpesa_receipt_number
              ? `M-Pesa Receipt: ${statusData.mpesa_receipt_number}`
              : ""
          }`,
        );
      } else if (isFailed) {
        notify.error(
          `Payment failed: ${
            statusData.failure_reason ||
            "Transaction was not completed successfully"
          }`,
        );
      }
    } else {
      // polling returned null — either timed out or was aborted
      if (signal?.aborted) return;

      setPollingComplete(true);
      setTransactionReceipt((prev) => ({
        ...prev,
        status: 2,
      }));
      refreshTransactionList();
      notify.error(
        "Payment is taking longer than expected. Please check your transaction history or contact support.",
      );
    }
  } catch (err: any) {
    setShowProcessingPopup(false);
    refreshTransactionList();
    notify.error(err?.message || "Transaction failed. Please try again.");
    onEarlyExit?.();
  } finally {
    setApproving(false);
    setProcessing(false);
  }
};
