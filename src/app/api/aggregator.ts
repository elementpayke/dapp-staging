import axios from "axios";

import type {
  RatePayload,
  RateResponse,
  InstitutionProps,
  PubkeyResponse,
  VerifyAccountPayload,
} from "../../types/types";

const AGGREGATOR_URL = process.env.NEXT_PUBLIC_API_URL;
const PROVIDER_ID = process.env.NEXT_PUBLIC_PROVIDER_ID;
const API_KEY = process.env.NEXT_PUBLIC_AGGR_API_KEY;

interface CreateOrderResponse {
  tx_hash: string;
  status: string; // optional: "submitted"
}

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
export const fetchTokenRates = async (currency: string = 'usdc'): Promise<{
  currency: string;
  base_rate: number;
  marked_up_rate: number;
  markup_percentage: number;
}> => {
  try {
    const response = await axios.get<{
      currency: string;
      base_rate: number;
      marked_up_rate: number;
      markup_percentage: number;
    }>(
      `${AGGREGATOR_URL}/rates?currency=${currency}`,
      {
        headers: {
          'x-api-key': API_KEY || '',
          'Content-Type': 'application/json',
        },
      }
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

export const 


fetchOrderStatus = async (
  orderId: string
): Promise<{ status: number; data: any }> => {
  try {
    console.log("Fetching order status for orderId:", orderId);
    console.log("*****************************************");
    const response = await axios.get<{ status: number; data: any }>(
      `${AGGREGATOR_URL}/orders/${orderId}`,
      {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_AGGR_API_KEY,
          "Content-Type": "application/json",
        },
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


const api = axios.create({
  baseURL: AGGREGATOR_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY || '',
  },
  timeout: 10000, // 10 seconds timeout
});

// Retry logic for API calls
const retryRequest = async <T>(fn: () => Promise<T>, maxRetries = 2, delay = 1000): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      console.log(`Attempt ${attempt} failed:`, error?.message || error);
      
      // Don't retry on client errors (4xx) except 408, 429
      if (error.response?.status >= 400 && error.response?.status < 500 && 
          ![408, 429].includes(error.response?.status)) {
        throw error;
      }
      
      // Don't retry on 5xx errors after max attempts
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const waitTime = delay * Math.pow(2, attempt - 1);
      console.log(`Retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  throw new Error("Max retries exceeded");
};

// Health check function to test API connectivity
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    console.log("🏥 Checking API health...");
    // Try the pubkey endpoint instead since health endpoint doesn't exist
    const response = await retryRequest(async () => {
      return await api.get('/pubkey', { timeout: 10000 });
    }, 2, 1000); // 2 retries with 1s delay
    console.log("✅ API health check passed:", response.status);
    return true;
  } catch (error: any) {
    console.error("❌ API health check failed:", {
      status: error?.response?.status,
      message: error?.message,
      url: `${AGGREGATOR_URL}/pubkey`
    });
    return false;
  }
};

export const createOnRampOrder = async ({
  userAddress,
  tokenAddress,
  amount,
  phoneNumber,
  reason
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
      currency: "KES"
    }
  };
  
  if (reason) payload.reason = reason;
  
  console.log("🚀 Creating onramp order with payload:", payload);
  console.log("🌐 API URL:", AGGREGATOR_URL);
  console.log("🔑 API Key present:", !!API_KEY);
  
  try {
    const startTime = Date.now();
    const response = await retryRequest(async () => {
      const result = await api.post<CreateOrderResponse>('/orders/create', payload);
      return result;
    });
    const endTime = Date.now();
    console.log(`✅ Order created successfully in ${endTime - startTime}ms`);
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
        headers: error?.config?.headers ? Object.keys(error.config.headers) : []
      }
    });
    
    // Provide more specific error messages
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new Error("API request timed out. The service may be experiencing high load. Please try again in a few moments.");
    }
    
    if (error.response?.status === 504) {
      throw new Error("Service temporarily unavailable. Please try again in a few moments.");
    }
    
    if (error.response?.status === 429) {
      throw new Error("Too many requests. Please wait a moment and try again.");
    }
    
    if (error.response?.status === 422) {
      const errorMessage = error.response?.data?.message || "Invalid request data";
      throw new Error(`Validation error: ${errorMessage}`);
    }
    
    if (error.response?.status === 401) {
      throw new Error("Authentication failed. Please check your API key.");
    }
    
    throw new Error(error.response?.data?.message || error.message || "Failed to create order");
  }
};

export const createOffRampOrder = async ({
  userAddress,
  tokenAddress,
  amount,
  amountFiat,
  phoneNumber,
  messageHash,
  reason,
  cashoutType,
  paybillNumber,
  accountNumber,
  tillNumber
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
      currency: "KES"
    },
    message_hash: messageHash
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
  console.log("🌐 API URL:", AGGREGATOR_URL);
  console.log("🔑 API Key present:", !!API_KEY);
  
  try {
    const startTime = Date.now();
    console.log("🌐 Making API request to:", `${AGGREGATOR_URL}/orders/create`);
    console.log("📤 Request payload:", JSON.stringify(payload, null, 2));
    
    const response = await retryRequest(async () => {
      const result = await api.post<CreateOrderResponse>('/orders/create', payload);
      return result;
    });
    const endTime = Date.now();
    console.log(`✅ Offramp order created successfully in ${endTime - startTime}ms`);
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
        headers: error?.config?.headers ? Object.keys(error.config.headers) : []
      }
    });
    
    // Provide more specific error messages
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      console.error("⏰ Request timeout - API may be down or slow");
      throw new Error("API request timed out. The service may be experiencing high load. Please try again in a few moments.");
    }
    
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      console.error("🌐 Network error - possible CORS or connectivity issue");
      throw new Error("Network error. Please check your connection and try again.");
    }
    
    if (error.response?.status === 504) {
      throw new Error("Service temporarily unavailable. Please try again in a few moments.");
    }
    
    if (error.response?.status === 429) {
      throw new Error("Too many requests. Please wait a moment and try again.");
    }
    
    if (error.response?.status === 422) {
      const errorMessage = error.response?.data?.message || "Invalid request data";
      throw new Error(`Validation error: ${errorMessage}`);
    }
    
    if (error.response?.status === 401) {
      throw new Error("Authentication failed. Please check your API key.");
    }
    
    if (error.response?.status === 0) {
      console.error("🚫 CORS or network issue - no response received");
      throw new Error("Network issue. The API may be unavailable or there's a CORS problem.");
    }
    
    console.error("❌ Unknown error:", error);
    throw new Error(error.response?.data?.message || error.message || "Failed to create offramp order");
  }
};



