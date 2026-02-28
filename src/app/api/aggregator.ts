import axios from "axios";

import { KYCRequiredError } from "@/services/kycError";
import type {
  RatePayload,
  RateResponse,
  InstitutionProps,
  PubkeyResponse,
  VerifyAccountPayload,
} from "../../types/types";

const AGGREGATOR_URL = process.env.NEXT_PUBLIC_API_URL;
const PROVIDER_ID = process.env.NEXT_PUBLIC_PROVIDER_ID;


interface CreateOrderResponse {
  status: string;
  message: string;
  data: {
    tx_hash: string;
    status: string;
    rate_used: number;
    amount_sent: number;
    fiat_paid: number;
  };
}

interface OrderQuoteResponse {
  status: string;
  message: string;
  data: {
    required_token_amount: number;
    required_token_amount_raw: number;
    fee_amount: number;
    effective_rate: number;
    fiat_amount: number;
    currency: string;
    token: string;
    order_type: string;
    current_balance?: number;
    current_balance_raw?: number;
    current_allowance?: number;
    current_allowance_raw?: number;
    has_sufficient_balance?: boolean;
    has_sufficient_allowance?: boolean;
    balance_check_error?: string;
  };
}

type KYCSignal = {
  isMatch: boolean;
  message?: string;
  code?: string;
};

const parseKYCSignal = (responseData: any): KYCSignal => {
  if (!responseData || typeof responseData !== "object") {
    return { isMatch: false };
  }

  const messageParts = [
    responseData?.message,
    responseData?.error,
    responseData?.data?.message,
    responseData?.data?.error,
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  const codeParts = [
    responseData?.code,
    responseData?.error_code,
    responseData?.status,
    responseData?.error,
    responseData?.data?.code,
    responseData?.data?.error_code,
    responseData?.data?.error,
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  const hasKycCode = codeParts.some((code) =>
    ["kyc_required", "limit_exceeded"].includes(code),
  );
  const hasKycMessage = messageParts.some((msg) => msg.includes("kyc"));
  const hasLimitMessage = messageParts.some(
    (msg) =>
      msg.includes("limit exceeded") ||
      msg.includes("exceeds transaction limit") ||
      msg.includes("transaction limit"),
  );

  if (!hasKycCode && !hasKycMessage && !hasLimitMessage) {
    return { isMatch: false };
  }

  const selectedCode =
    codeParts.find((code) =>
      ["kyc_required", "limit_exceeded"].includes(code),
    ) || "kyc_required";

  const selectedMessage =
    responseData?.message ||
    responseData?.error ||
    responseData?.data?.message ||
    "You've reached your transaction limit. Please verify your identity to continue.";

  return {
    isMatch: true,
    message: selectedMessage,
    code: selectedCode,
  };
};

export const fetchRate = async ({
  token,
  amount,
  currency,
}: RatePayload): Promise<RateResponse> => {
  try {
    const response = await axios.get<RateResponse>(
      `${AGGREGATOR_URL}/rates/${token}/${amount}/${currency}?provider_id=${PROVIDER_ID}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching rate:", error);
    throw error;
  }
};

// Fetch token to KES conversion rates for offramp approval calculation
export const fetchTokenRates = async (
  currency: string = "usdc"
): Promise<{
  currency: string;
  base_rate: number;
  marked_up_rate: number;
  markup_percentage: number;
}> => {
  try {
    // Call public rates endpoint directly (no API key client-side)
    const response = await axios.get<{
      currency: string;
      base_rate: number;
      marked_up_rate: number;
      markup_percentage: number;
    }>(
      `${AGGREGATOR_URL}/rates?currency=${currency}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching token rates:", error);
    throw error;
  }
};

export const fetchSupportedInstitutions = async (
  currency: string
): Promise<InstitutionProps[]> => {
  try {
    const response = await axios.get<{ data: InstitutionProps[] }>(
      `${AGGREGATOR_URL}/institutions/${currency}`
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching supported institutions:", error);
    throw error;
  }
};

export const fetchAggregatorPublicKey = async (): Promise<PubkeyResponse> => {
  try {
    const response = await axios.get<PubkeyResponse>(
      `${AGGREGATOR_URL}/pubkey`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching aggregator public key:", error);
    throw error;
  }
};

export const fetchAccountName = async (
  payload: VerifyAccountPayload
): Promise<string> => {
  try {
    const response = await axios.post<{ data: string }>(
      `${AGGREGATOR_URL}/verify-account`,
      payload
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching account name:", error);
    throw error;
  }
};

export const fetchOrderStatus = async (
  orderId: string
): Promise<{ status: number; data: any }> => {
  try {
    console.log("Fetching order status for orderId:", orderId);
    console.log("*****************************************");
    // Use internal server route to avoid exposing API key
    const response = await axios.get<{ status: number; data: any }>(
      `/api/element-pay/orders/get`,
      {
        params: { orderId },
      }
    );
    console.log("Order status response:", response.data);
    console.log("*****************************************");
    return response;
  } catch (error: any) {
    console.error("Error fetching order status:", error);
    // If it's a 404 error, return a specific response structure
    if (error.response?.status === 404) {
      return {
        status: 404,
        data: {
          status: "pending",
          message: "Order not found yet, will retry",
          data: null,
        },
      };
    }
    throw error;
  }
};

const clientApi = axios.create({
  baseURL: "/api/element-pay",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// ── Token refresh interceptor ─────────────────────────────────────────────
// If any /api/element-pay request returns 401, attempt a cookie-based
// refresh and retry the original request once.
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/refresh-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    return res.ok;
  } catch {
    return false;
  }
}

clientApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only intercept 401 and only retry once
    if (error.response?.status === 401 && !originalRequest._retried) {
      originalRequest._retried = true;

      // Coalesce concurrent refresh attempts
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = doRefresh().finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });
      }

      const refreshed = await refreshPromise;

      if (refreshed) {
        // Cookies are updated — retry the original request
        return clientApi(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);

// Retry logic for API calls with improved timeout handling
const retryRequest = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 2000
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      console.log(`Attempt ${attempt} failed:`, error?.message || error);

      // Don't retry on client errors (4xx) except 408, 429
      if (
        error.response?.status >= 400 &&
        error.response?.status < 500 &&
        ![408, 429].includes(error.response?.status)
      ) {
        throw error;
      }

      // Don't retry on 5xx errors after max attempts
      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retrying (exponential backoff with jitter)
      const waitTime = delay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      console.log(`Retrying in ${Math.round(waitTime)}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
  throw new Error("Max retries exceeded");
};

// Health check function to test API connectivity
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    console.log("🏥 Checking API health...");
    // Try a simple GET request to the public base URL (no key on client)
    const response = await fetch(`${AGGREGATOR_URL}`, {
      method: "GET",
      signal: AbortSignal.timeout(10000),
    });
    console.log("✅ API health check passed:", response.status);
    return response.ok;
  } catch (error: any) {
    console.error("❌ API health check failed:", {
      status: error?.response?.status,
      message: error?.message,
      url: AGGREGATOR_URL,
    });
    return false;
  }
};

// Simple API status check for debugging
export const checkApiStatus = async (): Promise<{
  isOnline: boolean;
  responseTime: number;
  status: string;
  error?: string;
}> => {
  const startTime = Date.now();
  try {
    const response = await fetch(`${AGGREGATOR_URL}`, {
      method: "GET",
      signal: AbortSignal.timeout(15000),
    });
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    return {
      isOnline: response.ok,
      responseTime,
      status: response.statusText,
    };
  } catch (error: any) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    return {
      isOnline: false,
      responseTime,
      status: "ERROR",
      error: error?.message || "Unknown error",
    };
  }
};

export const createOnRampOrder = async ({
  userAddress,
  tokenAddress,
  amount,
  phoneNumber,
  reason,
  
}: {
  userAddress: string;
  tokenAddress: string;
  amount: number;
  phoneNumber: string;
  reason?: string;
}): Promise<CreateOrderResponse> => {
  const payload: any = {
    user_address: userAddress,
    token: tokenAddress,
    order_type: 0, // Onramp
    fiat_payload: {
      amount_fiat: amount,
      cashout_type: "PHONE",
      phone_number: phoneNumber,
      currency: "KES",
    },
  };

  if (reason) payload.reason = reason;

  console.log("🚀 Creating onramp order with payload:", payload);

  try {
    const startTime = Date.now();
    const response = await retryRequest(async () => {
      const result = await clientApi.post<CreateOrderResponse>(
        "/orders/create",
        payload
      );
      return result;
    });
    const endTime = Date.now();
    console.log(`✅ Order created successfully in ${response}`);
    return response.data;
  } catch (error: any) {
    console.error("❌ Failed to create onramp order after retries:", {
      message: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      code: error?.code,
      config: {
        url: error?.config?.url,
        method: error?.config?.method,
        timeout: error?.config?.timeout,
        headers: error?.config?.headers
          ? Object.keys(error.config.headers)
          : [],
      },
    });

    const kycSignal = parseKYCSignal(error.response?.data);
    if (kycSignal.isMatch) {
      throw new KYCRequiredError(
        kycSignal.message ||
          "You've reached your transaction limit. Please verify your identity to continue.",
        kycSignal.code || "kyc_required",
        error.response?.data,
      );
    }

    // Provide more specific error messages for WXM orders
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      console.error("⏰ Request timeout - API may be down or slow");

      // Check if it's a complete API failure
      if (error.code === "ECONNABORTED" && !error.response) {
        throw new Error(
          "The Element Pay API is currently unreachable. This appears to be a server-side issue. Please try again later or contact Element Pay support for assistance."
        );
      }

      throw new Error(
        "API request timed out after 30 seconds. The Element Pay service may be experiencing high load. Please try again in a few moments or contact support if the issue persists."
      );
    }

    if (
      error.code === "ERR_NETWORK" ||
      error.message?.includes("Network Error")
    ) {
      console.error("🌐 Network error - possible CORS or connectivity issue");
      throw new Error(
        "Network error. Please check your internet connection and try again."
      );
    }

    if (
      error.code === "ERR_INTERNET_DISCONNECTED" ||
      error.message?.includes("Failed to fetch")
    ) {
      console.error("🌐 Internet disconnected or API completely down");
      throw new Error(
        "Unable to reach the Element Pay service. Please check your internet connection and try again."
      );
    }

    if (error.response?.status === 504) {
      throw new Error(
        "Service temporarily unavailable. Please try again in a few moments."
      );
    }

    if (error.response?.status === 429) {
      const serverMsg = error.response?.data?.message || error.response?.data?.error;
      throw new Error(serverMsg || "Too many requests. Please wait a moment and try again.");
    }

    if (error.response?.status === 422) {
      const errorMessage =
        error.response?.data?.message || error.response?.data?.error || "Invalid request data";
      throw new Error(`Validation error: ${errorMessage}`);
    }

    if (error.response?.status === 401) {
      const serverMsg = error.response?.data?.message || error.response?.data?.error;
      throw new Error(serverMsg || "Authentication failed. Please log in again.");
    }

    if (error.response?.status === 403) {
      const serverMsg = error.response?.data?.message || error.response?.data?.error;
      const errorCode = error.response?.data?.code || error.response?.data?.error_code;
      if (
        errorCode === "kyc_required" ||
        errorCode === "limit_exceeded" ||
        serverMsg?.toLowerCase().includes("kyc") ||
        serverMsg?.toLowerCase().includes("limit exceeded") ||
        serverMsg?.toLowerCase().includes("exceeds transaction limit")
      ) {
        throw new KYCRequiredError(
          serverMsg || "You've reached your transaction limit. Please verify your identity to continue.",
          errorCode || "kyc_required",
          error.response?.data,
        );
      }
      throw new Error(serverMsg || "You do not have permission to perform this action.");
    }

    if (error.response?.status === 0) {
      console.error("🚫 CORS or network issue - no response received");
      throw new Error(
        "Network issue. The API may be unavailable or there's a CORS problem."
      );
    }

    // Relay any other server error message as-is
    const serverMessage = error.response?.data?.message || error.response?.data?.error;
    console.error("❌ Unknown error:", error);
    throw new Error(
      serverMessage ||
        error.message ||
        "Failed to create onramp order"
    );
  }
};

export const createOffRampOrder = async ({
  userAddress,
  tokenAddress,
  amount: _amount, // Renamed to indicate it's intentionally unused
  amountFiat,
  phoneNumber,
  messageHash,
  reason,
  cashoutType,
  paybillNumber,
  accountNumber,
  tillNumber,
}: {
  userAddress: string;
  tokenAddress: string;
  amount: number; // Token amount
  amountFiat: number; // KES amount
  phoneNumber: string;
  messageHash: string;
  reason?: string;
  cashoutType: "PHONE" | "PAYBILL" | "TILL";
  paybillNumber?: string;
  accountNumber?: string;
  tillNumber?: string;
}): Promise<CreateOrderResponse> => {
  const payload: any = {
    user_address: userAddress,
    token: tokenAddress,
    order_type: 1, // Offramp
    fiat_payload: {
      amount_fiat: amountFiat,
      cashout_type: cashoutType,
      currency: "KES",
    },
    message_hash: messageHash,
  };

  // Add cashout-specific fields
  if (cashoutType === "PHONE") {
    payload.fiat_payload.phone_number = phoneNumber;
  } else if (cashoutType === "PAYBILL") {
    payload.fiat_payload.paybill_number = paybillNumber;
    payload.fiat_payload.account_number = accountNumber;
  } else if (cashoutType === "TILL") {
    payload.fiat_payload.till_number = tillNumber;
  }

  if (reason) payload.reason = reason;

  console.log("🚀 Creating offramp order with payload:", payload);

  try {
    const startTime = Date.now();
    console.log("🌐 Making API request to:", `${AGGREGATOR_URL}/orders/create`);
    console.log("📤 Request payload:", JSON.stringify(payload, null, 2));

    const response = await retryRequest(async () => {
      const result = await clientApi.post<CreateOrderResponse>(
        "/orders/create",
        payload
      );
      return result;
    });
    const endTime = Date.now();
    console.log(
      `✅ Offramp order created successfully in ${endTime - startTime}ms`
    );
    console.log("📥 Response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Failed to create offramp order after retries:", {
      message: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      code: error?.code,
      config: {
        url: error?.config?.url,
        method: error?.config?.method,
        timeout: error?.config?.timeout,
        headers: error?.config?.headers
          ? Object.keys(error.config.headers)
          : [],
      },
    });

    const kycSignal = parseKYCSignal(error.response?.data);
    if (kycSignal.isMatch) {
      throw new KYCRequiredError(
        kycSignal.message ||
          "You've reached your transaction limit. Please verify your identity to continue.",
        kycSignal.code || "kyc_required",
        error.response?.data,
      );
    }

    // Provide more specific error messages
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      console.error("⏰ Request timeout - API may be down or slow");
      throw new Error(
        "API request timed out. The service may be experiencing high load. Please try again in a few moments."
      );
    }

    if (
      error.code === "ERR_NETWORK" ||
      error.message?.includes("Network Error")
    ) {
      console.error("🌐 Network error - possible CORS or connectivity issue");
      throw new Error(
        "Network error. Please check your connection and try again."
      );
    }

    if (error.response?.status === 504) {
      throw new Error(
        "Service temporarily unavailable. Please try again in a few moments."
      );
    }

    if (error.response?.status === 429) {
      const serverMsg = error.response?.data?.message || error.response?.data?.error;
      throw new Error(serverMsg || "Too many requests. Please wait a moment and try again.");
    }

    if (error.response?.status === 422) {
      const errorMessage =
        error.response?.data?.message || error.response?.data?.error || "Invalid request data";
      throw new Error(`Validation error: ${errorMessage}`);
    }

    if (error.response?.status === 401) {
      const serverMsg = error.response?.data?.message || error.response?.data?.error;
      throw new Error(serverMsg || "Authentication failed. Please log in again.");
    }

    if (error.response?.status === 403) {
      const serverMsg = error.response?.data?.message || error.response?.data?.error;
      const errorCode = error.response?.data?.code || error.response?.data?.error_code;
      if (
        errorCode === "kyc_required" ||
        errorCode === "limit_exceeded" ||
        serverMsg?.toLowerCase().includes("kyc") ||
        serverMsg?.toLowerCase().includes("limit exceeded") ||
        serverMsg?.toLowerCase().includes("exceeds transaction limit")
      ) {
        throw new KYCRequiredError(
          serverMsg || "You've reached your transaction limit. Please verify your identity to continue.",
          errorCode || "kyc_required",
          error.response?.data,
        );
      }
      throw new Error(serverMsg || "You do not have permission to perform this action.");
    }

    if (error.response?.status === 0) {
      console.error("🚫 CORS or network issue - no response received");
      throw new Error(
        "Network issue. The API may be unavailable or there's a CORS problem."
      );
    }

    // Relay any other server error message as-is
    const serverMessage = error.response?.data?.message || error.response?.data?.error;
    console.error("❌ Unknown error:", error);
    throw new Error(
      serverMessage ||
        error.message ||
        "Failed to create offramp order"
    );
  }
};

/**
 * Quote cache for faster validation
 * Cache key: `${amountFiat}-${tokenAddress}-${walletAddress}-${orderType}`
 * TTL: 30 seconds (rates don't change that fast)
 */
const quoteCache = new Map<string, { data: OrderQuoteResponse; timestamp: number }>();
const QUOTE_CACHE_TTL = 30000; // 30 seconds

/**
 * Fetch order quote to get exact approval amount required
 * Results are cached for 30 seconds to speed up repeated validations
 */
export const fetchOrderQuote = async ({
  amountFiat,
  tokenAddress,
  walletAddress,
  orderType = 1, // OffRamp
  currency = "KES",
  skipCache = false,
}: {
  amountFiat: number;
  tokenAddress: string;
  walletAddress: string;
  orderType?: number;
  currency?: string;
  skipCache?: boolean;
}): Promise<OrderQuoteResponse> => {
  const cacheKey = `${amountFiat}-${tokenAddress}-${walletAddress}-${orderType}-${currency}`;
  
  // Check cache first (unless skipCache is true)
  if (!skipCache) {
    const cached = quoteCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < QUOTE_CACHE_TTL) {
      console.log("💰 Using cached quote:", cacheKey);
      return cached.data;
    }
  }

  try {
    const payload = {
      amount_fiat: amountFiat,
      token: tokenAddress,
      order_type: orderType,
      currency: currency,
      wallet_address: walletAddress,
    };

    console.log("💰 Fetching order quote with payload:", payload);
    const response = await clientApi.post<OrderQuoteResponse>(
      "/quote/order",
      payload
    );
    console.log("💰 Order quote response:", response.data);
    
    // Cache the response
    quoteCache.set(cacheKey, { data: response.data, timestamp: Date.now() });
    
    // Clean old cache entries (keep max 50)
    if (quoteCache.size > 50) {
      const oldestKey = quoteCache.keys().next().value;
      if (oldestKey) quoteCache.delete(oldestKey);
    }
    
    return response.data;
  } catch (error: any) {
    console.error("Error fetching order quote:", error);
    throw error;
  }
};
