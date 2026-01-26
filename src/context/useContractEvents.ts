import { useEffect, useState, useCallback, useRef } from "react";
import { ethers, BigNumberish } from "ethers";
import { CONTRACT_ABI } from "@/app/api/abi";

const NODE_URL =
  process.env.NEXT_PUBLIC_BASE_WS_URL ||
  "wss://base-mainnet.infura.io/ws/v3/079a8513fe4e46829490d949e078e4c1";

// WebSocket provider with auto-reconnection
let provider: ethers.WebSocketProvider | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_BASE = 2000; // 2 seconds base delay

const createProvider = (): ethers.WebSocketProvider => {
  const newProvider = new ethers.WebSocketProvider(NODE_URL);

  // Listen for WebSocket close events to trigger reconnection
  newProvider.websocket.addEventListener("close", () => {
    console.warn("WebSocket connection closed, attempting to reconnect...");
    handleReconnect();
  });

  newProvider.websocket.addEventListener("error", (error) => {
    console.error("WebSocket error:", error);
  });

  newProvider.websocket.addEventListener("open", () => {
    console.log("WebSocket connected successfully");
    reconnectAttempts = 0; // Reset attempts on successful connection
  });

  return newProvider;
};

const handleReconnect = () => {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error(
      "Max reconnection attempts reached. Please refresh the page.",
    );
    return;
  }

  reconnectAttempts++;
  const delay = RECONNECT_DELAY_BASE * Math.pow(2, reconnectAttempts - 1); // Exponential backoff

  console.log(
    `Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`,
  );

  setTimeout(() => {
    try {
      provider = createProvider();
    } catch (error) {
      console.error("Failed to reconnect:", error);
      handleReconnect();
    }
  }, delay);
};

// Initialize provider
const getProvider = (): ethers.WebSocketProvider => {
  if (!provider) {
    provider = createProvider();
  }
  return provider;
};

// Hook for Listening to Contract Events
export const useContractEvents = (
  contractAddress: string,
  onOrderCreated: (order: any) => void,
  onOrderSettled: (order: any) => void,
  onOrderRefunded: (orderId: any) => void,
) => {
  const contractRef = useRef<ethers.Contract | null>(null);

  useEffect(() => {
    if (!contractAddress) return;

    const wsProvider = getProvider();
    const contract = new ethers.Contract(
      contractAddress,
      CONTRACT_ABI,
      wsProvider,
    );
    contractRef.current = contract;
    const orderCreatedListener = (
      orderId: string,
      token: string,
      requester: string,
      amount: BigNumberish,
      messageHash: string,
      rate: BigNumberish,
      orderType: number,
    ) => {
      const hexOrderId = ethers.hexlify(orderId);
      const event = {
        orderId: hexOrderId,
        token,
        requester,
        amount: ethers.formatUnits(amount, 6),
        messageHash,
        rate,
        orderType,
      };
      console.log("Order created:", event);
      onOrderCreated(event);
    };

    const orderSettledListener = (orderId: string) => {
      console.log("Order settled:", orderId);
      const event = { orderId };
      onOrderSettled(event);
    };

    const orderRefundedListener = (orderId: string) => {
      console.log("Order refunded:", orderId);
      onOrderRefunded(orderId);
    };

    contract.on("OrderCreated", orderCreatedListener);
    contract.on("OrderSettled", orderSettledListener);
    contract.on("OrderRefunded", orderRefundedListener);

    return () => {
      contract.off("OrderCreated", orderCreatedListener);
      contract.off("OrderSettled", orderSettledListener);
      contract.off("OrderRefunded", orderRefundedListener);
    };
  }, [contractAddress, onOrderCreated, onOrderSettled, onOrderRefunded]);
};

// Hook for Handling Order Status
export const useContractHandleOrderStatus = (contractAddress: string) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleOrderStatus = useCallback(
    async (
      orderId: string,
      setIsTransactionModalOpen: any,
      setDepositCryptoReciept: any,
      transactionReciept: any,
    ) => {
      if (!orderId || !contractAddress) return;

      setIsProcessing(true);

      // Use the managed provider with auto-reconnection
      const wsProvider = getProvider();
      const contract = new ethers.Contract(
        contractAddress,
        CONTRACT_ABI,
        wsProvider,
      );

      try {
        let orderStatus = await contract.getOrder(orderId);
        console.log("Initial order status:", orderStatus);
        let attempts = 0;
        const maxAttempts = 12; // Stop checking after 12 attempts (1 min)
        let intervalResolved = false; // To track interval resolution

        const interval = setInterval(async () => {
          if (attempts >= maxAttempts || intervalResolved) {
            clearInterval(interval);
            setIsProcessing(false);
            setIsTransactionModalOpen(false);
            setDepositCryptoReciept(true);
            transactionReciept.status = 0;
            transactionReciept.transactionHash = orderStatus[7];
            return;
          }

          attempts++;
          orderStatus = await contract.getOrder(orderId);
          console.log(`Attempt ${attempts} Order status: ${orderStatus}`);
          if (orderStatus && Number(orderStatus[5]) === 1) {
            clearInterval(interval);
            console.log("Order settled successfully");
            setIsProcessing(false);
            setIsTransactionModalOpen(false);
            setDepositCryptoReciept(true);
            intervalResolved = true; // Mark as resolved
            transactionReciept.status = 1;
            transactionReciept.transactionHash = orderStatus[7];
            return; // Return success status
          }
        }, 5000); // Poll every 5 seconds

        // Just in case, handle when the interval is cleared early
        await new Promise((resolve) => setTimeout(resolve, maxAttempts * 5000));

        return { orderId, status: 0 }; // Fallback return in case polling ends without resolution
      } catch (error) {
        console.error("Error fetching order:", error);
        setIsProcessing(false);
        return { orderId, status: 0 };
      }
    },
    [contractAddress],
  );

  return { handleOrderStatus, isProcessing };
};
