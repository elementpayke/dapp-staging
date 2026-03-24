import type { Address } from "viem";

export type SponsoredWithdrawChainKey =
  | "base"
  | "arbitrum"
  | "polygon"
  | "ethereum";

export interface PrivySponsoredWithdrawTokenSummary {
  address: Address;
  decimals: number;
  explorerUrl: string;
  name: string;
  symbol: string;
  tokenLogo: string;
}

export interface PrivySponsoredWithdrawConfigResponse {
  chainId: number;
  chainKey: SponsoredWithdrawChainKey;
  chainName: string;
  liquidationWalletAddress: Address;
  supportedTokens: PrivySponsoredWithdrawTokenSummary[];
}

export interface PrivySponsoredWithdrawValidationRequest {
  amount: string;
  chainKey?: SponsoredWithdrawChainKey;
  recipient?: Address;
  tokenAddress: Address;
}

export interface PrivySponsoredWithdrawValidationResponse
  extends PrivySponsoredWithdrawConfigResponse {
  token: PrivySponsoredWithdrawTokenSummary;
  transfer: {
    amount: string;
    amountRaw: string;
    recipient: Address;
  };
}

export interface PrivySponsoredTransferGasEstimate {
  transferGasLimit: string;
}

export interface PrivySponsoredTransferExecutionResult {
  chainId: number;
  embeddedWalletAddress: Address;
  gasEstimate: PrivySponsoredTransferGasEstimate;
  transactionHash: `0x${string}`;
}

export type PrivySponsoredTransferErrorCode =
  | "AUTH_REQUIRED"
  | "CONFIG_ERROR"
  | "INSUFFICIENT_BALANCE"
  | "INVALID_AMOUNT"
  | "INVALID_RECIPIENT"
  | "INVALID_TOKEN"
  | "NETWORK_ERROR"
  | "UNSUPPORTED_WALLET"
  | "USER_REJECTED"
  | "VALIDATION_ERROR"
  | "UNKNOWN_ERROR";

export interface PrivySponsoredTransferError {
  cause?: unknown;
  code: PrivySponsoredTransferErrorCode;
  message: string;
}
