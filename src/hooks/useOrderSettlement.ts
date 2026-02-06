/**
 * useOrderSettlement - Watch for order settlement events on-chain
 *
 * This hook uses polling with getLogs instead of event filters (eth_getFilterChanges)
 * because many public RPCs (like Lisk) don't support filter-based watching.
 *
 * When a settlement is detected, it triggers a callback to fetch the final
 * receipt details from the API.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { usePublicClient } from "wagmi";
import { decodeEventLog, parseAbiItem } from "viem";
import { gatewayAbi } from "@/app/api/abi";

// Polling interval in ms
const POLL_INTERVAL = 3000;
const MAX_POLL_ATTEMPTS = 100; // ~5 minutes at 3s intervals
const BLOCK_LOOKBACK = BigInt(100); // How many blocks back to start searching

export interface OrderSettlementResult {
  orderId: string;
  splitOrderId?: string;
  liquidityProvider?: string;
  settlePercent?: number;
  transactionHash: string;
  blockNumber: bigint;
}

export interface UseOrderSettlementOptions {
  /** Contract address to watch */
  contractAddress: `0x${string}`;
  /** The order ID to watch for (hex string) */
  orderId: string | null;
  /** Transaction hash to watch from (to get the starting block) */
  txHash?: string | null;
  /** Callback when order is settled */
  onSettled?: (result: OrderSettlementResult) => void;
  /** Callback when order is refunded */
  onRefunded?: (orderId: string) => void;
  /** Whether to enable watching */
  enabled?: boolean;
}

export interface UseOrderSettlementReturn {
  /** Whether the order has been settled */
  isSettled: boolean;
  /** Whether the order was refunded */
  isRefunded: boolean;
  /** Settlement result data */
  settlementResult: OrderSettlementResult | null;
  /** Any error that occurred */
  error: Error | null;
  /** Current poll count */
  pollCount: number;
  /** Reset the settlement state */
  reset: () => void;
}

export function useOrderSettlement({
  contractAddress,
  orderId,
  txHash,
  onSettled,
  onRefunded,
  enabled = true,
}: UseOrderSettlementOptions): UseOrderSettlementReturn {
  const [isSettled, setIsSettled] = useState(false);
  const [isRefunded, setIsRefunded] = useState(false);
  const [settlementResult, setSettlementResult] =
    useState<OrderSettlementResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [pollCount, setPollCount] = useState(0);

  const publicClient = usePublicClient();
  const onSettledRef = useRef(onSettled);
  const onRefundedRef = useRef(onRefunded);
  const startBlockRef = useRef<bigint | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Keep callbacks fresh without causing re-subscriptions
  useEffect(() => {
    onSettledRef.current = onSettled;
    onRefundedRef.current = onRefunded;
  }, [onSettled, onRefunded]);

  // Poll for events using getLogs (more widely supported than filters)
  const pollForEvents = useCallback(async () => {
    if (
      !publicClient ||
      !contractAddress ||
      !orderId ||
      isSettled ||
      isRefunded
    ) {
      return;
    }

    try {
      // Get current block
      const currentBlock = await publicClient.getBlockNumber();

      // Set start block if not set (use transaction block or current - 100)
      if (startBlockRef.current === null) {
        if (txHash) {
          try {
            const receipt = await publicClient.getTransactionReceipt({
              hash: txHash as `0x${string}`,
            });
            startBlockRef.current = receipt.blockNumber;
          } catch {
            startBlockRef.current = currentBlock - BLOCK_LOOKBACK;
          }
        } else {
          startBlockRef.current = currentBlock - BLOCK_LOOKBACK;
        }
      }

      // Query for OrderSettled events
      const settledLogs = await publicClient.getLogs({
        address: contractAddress,
        event: parseAbiItem(
          "event OrderSettled(bytes32 indexed orderId, bytes32 indexed splitOrderId, address indexed liquidityProvider, uint64 settlePercent)",
        ),
        fromBlock: startBlockRef.current,
        toBlock: currentBlock,
      });

      for (const log of settledLogs) {
        try {
          console.log("My Contract logs as ", log);
          const decoded = decodeEventLog({
            abi: gatewayAbi,
            data: log.data,
            topics: log.topics,
            eventName: "OrderSettled",
          });

          const eventOrderId = (decoded.args as any).orderId as string;

          // Check if this event is for our order
          if (eventOrderId?.toLowerCase() === orderId?.toLowerCase()) {
            console.log(
              "✅ [useOrderSettlement] Order settled on-chain:",
              eventOrderId,
              "decoded msg : ",
              decoded
            );

            const result: OrderSettlementResult = {
              orderId: eventOrderId,
              splitOrderId: (decoded.args as any).splitOrderId as string,
              liquidityProvider: (decoded.args as any)
                .liquidityProvider as string,
              settlePercent: Number((decoded.args as any).settlePercent),
              transactionHash: log.transactionHash,
              blockNumber: log.blockNumber,
            };

            setSettlementResult(result);
            setIsSettled(true);
            onSettledRef.current?.(result);
            return; // Stop polling
          }
        } catch (err) {
          console.error(
            "[useOrderSettlement] Error decoding settled event:",
            err,
          );
        }
      }

      // Query for OrderRefunded events
      const refundedLogs = await publicClient.getLogs({
        address: contractAddress,
        event: parseAbiItem("event OrderRefunded(bytes32 indexed orderId)"),
        fromBlock: startBlockRef.current,
        toBlock: currentBlock,
      });

      for (const log of refundedLogs) {
        try {
          const decoded = decodeEventLog({
            abi: gatewayAbi,
            data: log.data,
            topics: log.topics,
            eventName: "OrderRefunded",
          });

          const eventOrderId = (decoded.args as any).orderId as string;

          if (eventOrderId?.toLowerCase() === orderId?.toLowerCase()) {
            console.log(
              "⚠️ [useOrderSettlement] Order refunded:",
              eventOrderId,
            );
            setIsRefunded(true);
            onRefundedRef.current?.(eventOrderId);
            return; // Stop polling
          }
        } catch (err) {
          console.error(
            "[useOrderSettlement] Error decoding refund event:",
            err,
          );
        }
      }

      // Update start block to avoid re-scanning old blocks
      startBlockRef.current = currentBlock;
    } catch (err) {
      console.error("[useOrderSettlement] Poll error:", err);
      // Don't set error state for transient RPC errors, just log and continue
    }
  }, [publicClient, contractAddress, orderId, txHash, isSettled, isRefunded]);

  // Set up polling interval
  useEffect(() => {
    if (!enabled || !orderId || isSettled || isRefunded) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    // Initial poll
    pollForEvents();
    setPollCount(1);

    // Set up interval
    pollIntervalRef.current = setInterval(() => {
      setPollCount((prev) => {
        if (prev >= MAX_POLL_ATTEMPTS) {
          console.log("[useOrderSettlement] Max poll attempts reached");
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          setError(new Error("Settlement timeout - max poll attempts reached"));
          return prev;
        }
        pollForEvents();
        return prev + 1;
      });
    }, POLL_INTERVAL);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [enabled, orderId, isSettled, isRefunded, pollForEvents]);

  const reset = useCallback(() => {
    setIsSettled(false);
    setIsRefunded(false);
    setSettlementResult(null);
    setError(null);
    setPollCount(0);
    startBlockRef.current = null;
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  return {
    isSettled,
    isRefunded,
    settlementResult,
    error,
    pollCount,
    reset,
  };
}

/**
 * Fetch order details from backend after settlement is detected
 */
export async function fetchOrderReceipt(txHash: string): Promise<any> {
  try {
    const res = await fetch(
      `/api/element-pay/orders/status?txHash=${encodeURIComponent(txHash)}`,
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch order receipt: ${res.statusText}`);
    }

    const data = await res.json();
    return data?.data || null;
  } catch (error) {
    console.error("[fetchOrderReceipt] Error:", error);
    throw error;
  }
}
