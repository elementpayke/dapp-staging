import axios from "axios";

import type {
  RatePayload,
  RateResponse,
  InstitutionProps,
  PubkeyResponse,
  VerifyAccountPayload,
  OrderStatusResponse,
} from "../../types/types";

const AGGREGATOR_URL = process.env.NEXT_PUBLIC_API_URL;
const PROVIDER_ID = process.env.NEXT_PUBLIC_PROVIDER_ID;

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

export const fetchSupportedInstitutions = async (
  currency: string,
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
    const response = await axios.get<PubkeyResponse>(`${AGGREGATOR_URL}/pubkey`);
    return response.data;
  } catch (error) {
    console.error("Error fetching aggregator public key:", error);
    throw error;
  }
};

export const fetchAccountName = async (
  payload: VerifyAccountPayload,
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
          data: null
        }
      };
    }
    throw error;
  }
};
