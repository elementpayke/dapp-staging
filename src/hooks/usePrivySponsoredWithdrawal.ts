"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePrivy, useSendTransaction, useWallets } from "@privy-io/react-auth";
import {
  createPublicClient,
  encodeFunctionData,
  erc20Abi,
  formatUnits,
  http,
  parseUnits,
  type Address,
} from "viem";

import {
  DEFAULT_SPONSORED_WITHDRAW_CHAIN_KEY,
  getPrivySponsoredWithdrawChainConfig,
} from "@/lib/privy-sponsorship/chains";
import type {
  PrivySponsoredTransferError,
  PrivySponsoredTransferErrorCode,
  PrivySponsoredTransferExecutionResult,
  PrivySponsoredTransferGasEstimate,
  PrivySponsoredWithdrawConfigResponse,
  PrivySponsoredWithdrawValidationRequest,
  PrivySponsoredWithdrawValidationResponse,
  SponsoredWithdrawChainKey,
} from "@/lib/privy-sponsorship/types";
import { sameWalletAddress } from "@/lib/privy-wallet-selection";
import { useWallet } from "@/hooks/useWallet";
import { useAuthStore } from "@/stores/authStore";

type SponsoredTransferStatus =
  | "idle"
  | "initializing"
  | "estimating"
  | "submitting"
  | "success"
  | "error";

type SponsoredWithdrawPublicClient = ReturnType<typeof createPublicClient>;

const isPrivyEmbeddedWallet = (wallet: { walletClientType?: string | null }) =>
  wallet.walletClientType === "privy";

const toSponsoredError = (
  error: unknown,
  fallbackCode: PrivySponsoredTransferErrorCode = "UNKNOWN_ERROR",
): PrivySponsoredTransferError => {
  const message =
    error instanceof Error ? error.message : "Sponsored transfer failed";
  const normalized = message.toLowerCase();

  if (
    normalized.includes("rejected") ||
    normalized.includes("denied") ||
    normalized.includes("user rejected")
  ) {
    return {
      code: "USER_REJECTED",
      message: "The sponsored withdrawal was rejected in Privy.",
      cause: error,
    };
  }

  if (normalized.includes("insufficient")) {
    return {
      code: "INSUFFICIENT_BALANCE",
      message,
      cause: error,
    };
  }

  if (normalized.includes("embedded wallet")) {
    return {
      code: "UNSUPPORTED_WALLET",
      message,
      cause: error,
    };
  }

  if (normalized.includes("authenticated")) {
    return {
      code: "AUTH_REQUIRED",
      message,
      cause: error,
    };
  }

  if (normalized.includes("network") || normalized.includes("rpc")) {
    return {
      code: "NETWORK_ERROR",
      message,
      cause: error,
    };
  }

  if (normalized.includes("amount")) {
    return {
      code: "INVALID_AMOUNT",
      message,
      cause: error,
    };
  }

  return {
    code: fallbackCode,
    message,
    cause: error,
  };
};

export interface SendPrivySponsoredTransferParams {
  amount: string;
  chainKey?: SponsoredWithdrawChainKey;
  tokenAddress: Address;
}

export interface SendPrivySponsoredApprovalParams {
  amount: string;
  chainKey?: SponsoredWithdrawChainKey;
  spenderAddress: Address;
  tokenAddress: Address;
}

export interface UsePrivySponsoredWithdrawalReturn {
  config: PrivySponsoredWithdrawConfigResponse | null;
  embeddedWalletAddress: Address | null;
  embeddedWalletBalance: string | null;
  error: PrivySponsoredTransferError | null;
  estimateSponsoredTransfer: (
    params: SendPrivySponsoredTransferParams,
  ) => Promise<{
    gasEstimate: PrivySponsoredTransferGasEstimate;
    validation: PrivySponsoredWithdrawValidationResponse;
  }>;
  estimateSponsoredApproval: (
    params: SendPrivySponsoredApprovalParams,
  ) => Promise<{
    amountRaw: bigint;
    gasEstimate: PrivySponsoredTransferGasEstimate;
  }>;
  gasEstimate: PrivySponsoredTransferGasEstimate | null;
  initialize: (
    chainKey?: SponsoredWithdrawChainKey,
  ) => Promise<PrivySponsoredWithdrawConfigResponse>;
  isEmbeddedWalletActive: boolean;
  isReady: boolean;
  isWorking: boolean;
  refreshEmbeddedWalletState: (params?: {
    chainKey?: SponsoredWithdrawChainKey;
    tokenAddress?: Address;
  }) => Promise<{
    embeddedWalletAddress: Address;
    embeddedWalletBalance?: string;
  }>;
  reset: () => void;
  result: PrivySponsoredTransferExecutionResult | null;
  sendSponsoredTransfer: (
    params: SendPrivySponsoredTransferParams,
  ) => Promise<PrivySponsoredTransferExecutionResult>;
  sendSponsoredApproval: (
    params: SendPrivySponsoredApprovalParams,
  ) => Promise<PrivySponsoredTransferExecutionResult>;
  status: SponsoredTransferStatus;
  supportedModeWarning: string | null;
  userAddress: Address | null;
}

export function usePrivySponsoredWithdrawal(
  defaultChainKey: SponsoredWithdrawChainKey = DEFAULT_SPONSORED_WITHDRAW_CHAIN_KEY,
): UsePrivySponsoredWithdrawalReturn {
  const { authenticated, ready: privyReady } = usePrivy();
  const { sendTransaction } = useSendTransaction();
  const { wallets } = useWallets();
  const walletPreference = useAuthStore((state) => state.walletPreference);
  const { address: activeAddress } = useWallet();

  const embeddedWallet = useMemo(
    () => wallets.find(isPrivyEmbeddedWallet) ?? null,
    [wallets],
  );

  const isEmbeddedWalletActive = Boolean(
    embeddedWallet &&
      walletPreference === "embedded" &&
      sameWalletAddress(activeAddress, embeddedWallet.address),
  );

  const isReady = privyReady && authenticated && isEmbeddedWalletActive;

  const [config, setConfig] =
    useState<PrivySponsoredWithdrawConfigResponse | null>(null);
  const [embeddedWalletAddress, setEmbeddedWalletAddress] =
    useState<Address | null>(null);
  const [embeddedWalletBalance, setEmbeddedWalletBalance] = useState<
    string | null
  >(null);
  const [error, setError] = useState<PrivySponsoredTransferError | null>(null);
  const [gasEstimate, setGasEstimate] =
    useState<PrivySponsoredTransferGasEstimate | null>(null);
  const [result, setResult] =
    useState<PrivySponsoredTransferExecutionResult | null>(null);
  const [status, setStatus] = useState<SponsoredTransferStatus>("idle");

  const runtimeConfigRef = useRef<
    Partial<Record<SponsoredWithdrawChainKey, PrivySponsoredWithdrawConfigResponse>>
  >({});
  const publicClientRef = useRef<
    Partial<Record<SponsoredWithdrawChainKey, SponsoredWithdrawPublicClient>>
  >({});

  useEffect(() => {
    runtimeConfigRef.current = {};
    publicClientRef.current = {};
    setConfig(null);
    setEmbeddedWalletAddress(null);
    setEmbeddedWalletBalance(null);
    setError(null);
    setGasEstimate(null);
    setResult(null);
    setStatus("idle");
  }, [activeAddress, embeddedWallet?.address, walletPreference]);

  const getRuntimeConfig = useCallback(
    async (
      chainKey: SponsoredWithdrawChainKey,
    ): Promise<PrivySponsoredWithdrawConfigResponse> => {
      const cached = runtimeConfigRef.current[chainKey];

      if (cached) {
        setConfig(cached);
        return cached;
      }

      const response = await fetch(
        `/api/privy/offramp/config?chainKey=${chainKey}`,
        { cache: "no-store" },
      );
      const data =
        (await response.json().catch(() => ({}))) as Partial<PrivySponsoredWithdrawConfigResponse> & {
          message?: string;
        };

      if (!response.ok) {
        throw new Error(data.message ?? "Failed to load sponsored config.");
      }

      const runtimeConfig = data as PrivySponsoredWithdrawConfigResponse;
      runtimeConfigRef.current[chainKey] = runtimeConfig;
      setConfig(runtimeConfig);

      return runtimeConfig;
    },
    [],
  );

  const getPublicClientForChain = useCallback(
    (chainKey: SponsoredWithdrawChainKey) => {
      const cached = publicClientRef.current[chainKey];

      if (cached) {
        return cached;
      }

      const chainConfig = getPrivySponsoredWithdrawChainConfig(chainKey);
      const publicClient = createPublicClient({
        chain: chainConfig.chain,
        transport: http(chainConfig.rpcUrl),
      }) as SponsoredWithdrawPublicClient;

      publicClientRef.current[chainKey] = publicClient;

      return publicClient;
    },
    [],
  );

  const resolveSupportedToken = useCallback(
    (
      chainKey: SponsoredWithdrawChainKey,
      tokenAddress: Address,
    ) => {
      const token = getPrivySponsoredWithdrawChainConfig(chainKey).supportedTokens.find(
        (item) => item.address.toLowerCase() === tokenAddress.toLowerCase(),
      );

      if (!token) {
        throw new Error("This token is not enabled for sponsored approvals.");
      }

      return token;
    },
    [],
  );

  const initialize = useCallback(
    async (
      chainKey: SponsoredWithdrawChainKey = defaultChainKey,
    ): Promise<PrivySponsoredWithdrawConfigResponse> => {
      if (!privyReady || !authenticated) {
        throw new Error(
          "You must be authenticated before using sponsored withdrawals.",
        );
      }

      if (!embeddedWallet || !isEmbeddedWalletActive) {
        throw new Error(
          "Sponsored withdrawals currently require your Privy embedded wallet to be the active wallet.",
        );
      }

      setStatus("initializing");

      try {
        const runtimeConfig = await getRuntimeConfig(chainKey);
        setEmbeddedWalletAddress(embeddedWallet.address as Address);
        setStatus("idle");
        return runtimeConfig;
      } catch (initError) {
        const normalized = toSponsoredError(initError, "CONFIG_ERROR");
        setError(normalized);
        setStatus("error");
        throw normalized;
      }
    },
    [
      authenticated,
      defaultChainKey,
      embeddedWallet,
      getRuntimeConfig,
      isEmbeddedWalletActive,
      privyReady,
    ],
  );

  const refreshEmbeddedWalletState = useCallback(
    async ({
      chainKey = defaultChainKey,
      tokenAddress,
    }: {
      chainKey?: SponsoredWithdrawChainKey;
      tokenAddress?: Address;
    } = {}) => {
      if (!privyReady || !authenticated) {
        throw new Error(
          "You must be authenticated before using sponsored withdrawals.",
        );
      }

      if (!embeddedWallet || !isEmbeddedWalletActive) {
        throw new Error("Embedded wallet not available.");
      }

      if (!tokenAddress) {
        await initialize(chainKey);
      }

      const nextEmbeddedWalletAddress = embeddedWallet.address as Address;
      setEmbeddedWalletAddress(nextEmbeddedWalletAddress);

      if (!tokenAddress) {
        return { embeddedWalletAddress: nextEmbeddedWalletAddress };
      }

      const token = getPrivySponsoredWithdrawChainConfig(chainKey).supportedTokens.find(
        (item) => item.address.toLowerCase() === tokenAddress.toLowerCase(),
      );

      if (!token) {
        return { embeddedWalletAddress: nextEmbeddedWalletAddress };
      }

      const publicClient = getPublicClientForChain(chainKey);
      const balance = await publicClient.readContract({
        address: token.address,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [nextEmbeddedWalletAddress],
      });
      const formattedBalance = formatUnits(balance, token.decimals);

      setEmbeddedWalletBalance(formattedBalance);

      return {
        embeddedWalletAddress: nextEmbeddedWalletAddress,
        embeddedWalletBalance: formattedBalance,
      };
    },
    [
      authenticated,
      defaultChainKey,
      embeddedWallet,
      getPublicClientForChain,
      initialize,
      isEmbeddedWalletActive,
      privyReady,
    ],
  );

  const validateTransfer = useCallback(
    async (
      params: SendPrivySponsoredTransferParams,
    ): Promise<PrivySponsoredWithdrawValidationResponse> => {
      const runtimeConfig = await getRuntimeConfig(
        params.chainKey ?? defaultChainKey,
      );

      const response = await fetch("/api/privy/offramp/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: params.amount,
          chainKey: params.chainKey ?? defaultChainKey,
          recipient: runtimeConfig.liquidationWalletAddress,
          tokenAddress: params.tokenAddress,
        } satisfies PrivySponsoredWithdrawValidationRequest),
      });
      const data =
        (await response.json().catch(() => ({}))) as Partial<PrivySponsoredWithdrawValidationResponse> & {
          message?: string;
        };

      if (!response.ok) {
        throw new Error(data.message ?? "Transfer validation failed.");
      }

      return data as PrivySponsoredWithdrawValidationResponse;
    },
    [defaultChainKey, getRuntimeConfig],
  );

  const estimateSponsoredTransfer = useCallback(
    async (params: SendPrivySponsoredTransferParams) => {
      if (!params.amount || Number(params.amount) <= 0) {
        throw toSponsoredError(
          new Error("Amount must be greater than zero."),
          "INVALID_AMOUNT",
        );
      }

      if (!embeddedWallet) {
        throw toSponsoredError(
          new Error("Embedded wallet not available."),
          "UNSUPPORTED_WALLET",
        );
      }

      try {
        const validation = await validateTransfer(params);
        const publicClient = getPublicClientForChain(validation.chainKey);
        const balance = await publicClient.readContract({
          address: validation.token.address,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [embeddedWallet.address as Address],
        });
        const amountRaw = BigInt(validation.transfer.amountRaw);

        if (balance < amountRaw) {
          throw new Error(
            `Insufficient balance. Wallet has ${formatUnits(
              balance,
              validation.token.decimals,
            )} ${validation.token.symbol}.`,
          );
        }

        const transferGasLimit = await publicClient.estimateContractGas({
          abi: erc20Abi,
          account: embeddedWallet.address as Address,
          address: validation.token.address,
          functionName: "transfer",
          args: [validation.transfer.recipient, amountRaw],
        });
        const nextGasEstimate: PrivySponsoredTransferGasEstimate = {
          transferGasLimit: transferGasLimit.toString(),
        };

        setEmbeddedWalletAddress(embeddedWallet.address as Address);
        setEmbeddedWalletBalance(formatUnits(balance, validation.token.decimals));
        setGasEstimate(nextGasEstimate);

        return {
          gasEstimate: nextGasEstimate,
          validation,
        };
      } catch (estimateError) {
        throw toSponsoredError(estimateError, "VALIDATION_ERROR");
      }
    },
    [embeddedWallet, getPublicClientForChain, validateTransfer],
  );

  const estimateSponsoredApproval = useCallback(
    async (params: SendPrivySponsoredApprovalParams) => {
      if (!params.amount || Number(params.amount) <= 0) {
        throw toSponsoredError(
          new Error("Amount must be greater than zero."),
          "INVALID_AMOUNT",
        );
      }

      if (!embeddedWallet) {
        throw toSponsoredError(
          new Error("Embedded wallet not available."),
          "UNSUPPORTED_WALLET",
        );
      }

      try {
        const chainKey = params.chainKey ?? defaultChainKey;
        const token = resolveSupportedToken(chainKey, params.tokenAddress);
        const amountRaw = parseUnits(params.amount, token.decimals);
        const publicClient = getPublicClientForChain(chainKey);
        const balance = await publicClient.readContract({
          address: token.address,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [embeddedWallet.address as Address],
        });

        if (balance < amountRaw) {
          throw new Error(
            `Insufficient balance. Wallet has ${formatUnits(
              balance,
              token.decimals,
            )} ${token.symbol}.`,
          );
        }

        const approvalGasLimit = await publicClient.estimateContractGas({
          abi: erc20Abi,
          account: embeddedWallet.address as Address,
          address: token.address,
          functionName: "approve",
          args: [params.spenderAddress, amountRaw],
        });
        const nextGasEstimate: PrivySponsoredTransferGasEstimate = {
          transferGasLimit: approvalGasLimit.toString(),
        };

        setEmbeddedWalletAddress(embeddedWallet.address as Address);
        setEmbeddedWalletBalance(formatUnits(balance, token.decimals));
        setGasEstimate(nextGasEstimate);

        return {
          amountRaw,
          gasEstimate: nextGasEstimate,
        };
      } catch (estimateError) {
        throw toSponsoredError(estimateError, "VALIDATION_ERROR");
      }
    },
    [
      defaultChainKey,
      embeddedWallet,
      getPublicClientForChain,
      resolveSupportedToken,
    ],
  );

  const sendSponsoredTransfer = useCallback(
    async (
      params: SendPrivySponsoredTransferParams,
    ): Promise<PrivySponsoredTransferExecutionResult> => {
      setError(null);
      setResult(null);

      try {
        setStatus("estimating");

        const { gasEstimate: nextGasEstimate, validation } =
          await estimateSponsoredTransfer(params);

        if (!embeddedWallet) {
          throw new Error("Embedded wallet not available.");
        }

        const callData = encodeFunctionData({
          abi: erc20Abi,
          functionName: "transfer",
          args: [
            validation.transfer.recipient,
            BigInt(validation.transfer.amountRaw),
          ],
        });
        const publicClient = getPublicClientForChain(validation.chainKey);

        setStatus("submitting");

        const { hash } = await sendTransaction(
          {
            chainId: validation.chainId,
            data: callData,
            from: embeddedWallet.address,
            to: validation.token.address,
            value: 0,
          },
          {
            address: embeddedWallet.address,
            sponsor: true,
            uiOptions: { showWalletUIs: false },
          },
        );
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        if (receipt.status !== "success") {
          throw new Error("Sponsored transfer failed before confirmation.");
        }
        const executionResult: PrivySponsoredTransferExecutionResult = {
          chainId: validation.chainId,
          embeddedWalletAddress: embeddedWallet.address as Address,
          gasEstimate: nextGasEstimate,
          transactionHash: hash,
        };

        setResult(executionResult);
        setStatus("success");

        await refreshEmbeddedWalletState({
          chainKey: validation.chainKey,
          tokenAddress: validation.token.address,
        });

        return executionResult;
      } catch (sendError) {
        const normalized = toSponsoredError(sendError);
        setError(normalized);
        setStatus("error");
        throw normalized;
      }
    },
    [
      embeddedWallet,
      estimateSponsoredTransfer,
      getPublicClientForChain,
      refreshEmbeddedWalletState,
      sendTransaction,
    ],
  );

  const sendSponsoredApproval = useCallback(
    async (
      params: SendPrivySponsoredApprovalParams,
    ): Promise<PrivySponsoredTransferExecutionResult> => {
      setError(null);
      setResult(null);

      try {
        setStatus("estimating");

        const { amountRaw, gasEstimate: nextGasEstimate } =
          await estimateSponsoredApproval(params);

        if (!embeddedWallet) {
          throw new Error("Embedded wallet not available.");
        }

        const chainKey = params.chainKey ?? defaultChainKey;
        const chainConfig = getPrivySponsoredWithdrawChainConfig(chainKey);
        const token = resolveSupportedToken(chainKey, params.tokenAddress);
        const callData = encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [params.spenderAddress, amountRaw],
        });
        const publicClient = getPublicClientForChain(chainKey);

        setStatus("submitting");

        const { hash } = await sendTransaction(
          {
            chainId: chainConfig.chainId,
            data: callData,
            from: embeddedWallet.address,
            to: token.address,
            value: 0,
          },
          {
            address: embeddedWallet.address,
            sponsor: true,
            uiOptions: { showWalletUIs: false },
          },
        );
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        if (receipt.status !== "success") {
          throw new Error("Sponsored approval failed before confirmation.");
        }

        const executionResult: PrivySponsoredTransferExecutionResult = {
          chainId: chainConfig.chainId,
          embeddedWalletAddress: embeddedWallet.address as Address,
          gasEstimate: nextGasEstimate,
          transactionHash: hash,
        };

        setResult(executionResult);
        setStatus("success");

        await refreshEmbeddedWalletState({
          chainKey,
          tokenAddress: token.address,
        });

        return executionResult;
      } catch (sendError) {
        const normalized = toSponsoredError(sendError);
        setError(normalized);
        setStatus("error");
        throw normalized;
      }
    },
    [
      defaultChainKey,
      embeddedWallet,
      estimateSponsoredApproval,
      getPublicClientForChain,
      refreshEmbeddedWalletState,
      resolveSupportedToken,
      sendTransaction,
    ],
  );

  const reset = useCallback(() => {
    setError(null);
    setGasEstimate(null);
    setResult(null);
    setStatus("idle");
  }, []);

  return {
    config,
    embeddedWalletAddress,
    embeddedWalletBalance,
    error,
    estimateSponsoredApproval,
    estimateSponsoredTransfer,
    gasEstimate,
    initialize,
    isEmbeddedWalletActive,
    isReady,
    isWorking:
      status === "initializing" ||
      status === "estimating" ||
      status === "submitting",
    refreshEmbeddedWalletState,
    reset,
    result,
    sendSponsoredApproval,
    sendSponsoredTransfer,
    status,
    supportedModeWarning: isEmbeddedWalletActive
      ? null
      : "Sponsored withdrawals only work when your active wallet is the Privy embedded wallet.",
    userAddress: (activeAddress as Address | null) ?? null,
  };
}

export default usePrivySponsoredWithdrawal;
