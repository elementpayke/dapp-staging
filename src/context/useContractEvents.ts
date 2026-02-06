import { useEffect, useState, useCallback, useRef } from "react";
import { ethers, BigNumberish } from "ethers";
import { CONTRACT_ABI } from "@/app/api/abi";
import { base } from "wagmi/chains";

// RPC URLs from environment variables (matching wagmi-config.ts)
const BASE_RPC_URLS = [
  process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org",
  process.env.NEXT_PUBLIC_FALLBACK_RPC_URL || "https://base-rpc.publicnode.com",
  "https://base.drpc.org",
];

// Create HTTP provider with fallback
const createProvider = (): ethers.JsonRpcProvider => {
  // Try each RPC URL until one works
  for (const url of BASE_RPC_URLS) {
    try {
      const provider = new ethers.JsonRpcProvider(url, {
        chainId: base.id,
        name: base.name,
      });
      console.log(`Connected to RPC: ${url}`);
      return provider;
    } catch (error) {
      console.warn(`Failed to connect to ${url}, trying next...`);
    }
  }
  
  // Fallback to first URL if all fail
  return new ethers.JsonRpcProvider(BASE_RPC_URLS[0], {
    chainId: base.id,
    name: base.name,
  });
};

// Shared provider instance
let provider: ethers.JsonRpcProvider | null = null;

// Get or create provider
const getProvider = (): ethers.JsonRpcProvider => {
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

    const httpProvider = getProvider();
    const contract = new ethers.Contract(
      contractAddress,
      CONTRACT_ABI,
      httpProvider,
    );
    contractRef.current = contract;

    // Event listeners
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

    // Subscribe to events
    contract.on("OrderCreated", orderCreatedListener);
    contract.on("OrderSettled", orderSettledListener);
    contract.on("OrderRefunded", orderRefundedListener);

    return () => {
      // Cleanup listeners
      contract.off("OrderCreated", orderCreatedListener);
      contract.off("OrderSettled", orderSettledListener);
      contract.off("OrderRefunded", orderRefundedListener);
    };
  }, [contractAddress, onOrderCreated, onOrderSettled, onOrderRefunded]);
};

// Hook for Handling Order Status with retry logic
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

      const httpProvider = getProvider();
      const contract = new ethers.Contract(
        contractAddress,
        CONTRACT_ABI,
        httpProvider,
      );

      try {
        let orderStatus = await contract.getOrder(orderId);
        console.log("Initial order status:", orderStatus);
        
        let attempts = 0;
        const maxAttempts = 12; // 12 attempts = 1 minute (5s intervals)
        let intervalResolved = false;

        const checkOrderStatus = async () => {
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
          
          try {
            orderStatus = await contract.getOrder(orderId);
            console.log(`Attempt ${attempts}/${maxAttempts} - Order status:`, orderStatus);
            
            // Check if order is settled (status === 1)
            if (orderStatus && Number(orderStatus[5]) === 1) {
              clearInterval(interval);
              intervalResolved = true;
              console.log("Order settled successfully");
              
              setIsProcessing(false);
              setIsTransactionModalOpen(false);
              setDepositCryptoReciept(true);
              transactionReciept.status = 1;
              transactionReciept.transactionHash = orderStatus[7];
              return { orderId, status: 1 };
            }
          } catch (error) {
            console.error(`Error checking order status (attempt ${attempts}):`, error);
            // Continue polling despite errors
          }
        };

        const interval = setInterval(checkOrderStatus, 5000); // Poll every 5 seconds
        
        // Initial check
        await checkOrderStatus();

        return { orderId, status: 0 };
      } catch (error) {
        console.error("Error fetching order:", error);
        setIsProcessing(false);
        setIsTransactionModalOpen(false);
        return { orderId, status: 0 };
      }
    },
    [contractAddress],
  );

  return { handleOrderStatus, isProcessing };
};

// Utility function for manual order checking
export const checkOrderStatus = async (
  contractAddress: string,
  orderId: string,
): Promise<any> => {
  const httpProvider = getProvider();
  const contract = new ethers.Contract(
    contractAddress,
    CONTRACT_ABI,
    httpProvider,
  );

  try {
    const orderStatus = await contract.getOrder(orderId);
    return {
      orderId,
      token: orderStatus[0],
      requester: orderStatus[1],
      amount: ethers.formatUnits(orderStatus[2], 6),
      messageHash: orderStatus[3],
      rate: orderStatus[4],
      status: Number(orderStatus[5]),
      orderType: Number(orderStatus[6]),
      transactionHash: orderStatus[7],
    };
  } catch (error) {
    console.error("Error checking order status:", error);
    throw error;
  }
};