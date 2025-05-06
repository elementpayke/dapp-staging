import { useEffect, useState, useCallback } from "react";
import { ethers, BigNumberish } from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/app/api/abi";

const NODE_URL = "wss://base-sepolia.infura.io/ws/v3/ea4427e7b72e4fc3b6ac7b3ca31353c2";
const provider = new ethers.WebSocketProvider(NODE_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

// Hook for Listening to Contract Events
export const useContractEvents = (
    onOrderCreated: (order: any) => void,
    onOrderSettled: (order: any) => void,
    onOrderRefunded: (orderId: any) => void
) => {
    useEffect(() => {
        const orderCreatedListener = (
            orderId: string,
            token: string,
            requester: string,
            amount: BigNumberish,
            messageHash: string,
            rate: BigNumberish,
            orderType: number
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
    }, [onOrderCreated, onOrderSettled, onOrderRefunded]);
};

// Hook for Handling Order Status
export const useContractHandleOrderStatus = () => {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleOrderStatus = useCallback(async (orderId: string, setIsTransactionModalOpen: any, setDepositCryptoReciept: any, transactionReciept: any) => {
        if (!orderId) return;

        setIsProcessing(true);

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
            await new Promise(resolve => setTimeout(resolve, maxAttempts * 5000));

            return { orderId, status: 0 }; // Fallback return in case polling ends without resolution
        } catch (error) {
            console.error("Error fetching order:", error);
            setIsProcessing(false);
            return { orderId, status: 0 };
        }
    }, []);

    return { handleOrderStatus, isProcessing };
};
