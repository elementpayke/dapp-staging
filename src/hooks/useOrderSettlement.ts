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
import { parseAbiItem, decodeEventLog } from "viem";
import contractABI from "@/lib/contractABI.json";

// Polling configuration
const POLL_INTERVAL = 5000; // 5 seconds between polls
const MAX_POLL_ATTEMPTS = 60; // ~5 minutes total
const BLOCK_LOOKBACK = BigInt(50); // How many blocks back to start searching

/**
 * Normalize a hash to lowercase with 0x prefix
 */
function normalizeHash(hash: string | null | undefined): string | null {
  if (!hash) return null;
  const cleaned = hash.toLowerCase().trim();
  return cleaned.startsWith("0x") ? cleaned : `0x${cleaned}`;
}

/**
 * Compare two hashes for equality
 * Handles the case where orderId from API might be tx hash format
 * and event orderId is bytes32 format
 */
function hashesMatch(hash1: string | null, hash2: string | null): boolean {
  if (!hash1 || !hash2) return false;
  const n1 = normalizeHash(hash1);
  const n2 = normalizeHash(hash2);
  if (!n1 || !n2) return false;

  // Direct match
  if (n1 === n2) return true;

  // Handle potential padding differences (bytes32 is 66 chars with 0x)
  // If one is shorter, check if the longer one ends with the shorter one's hex part
  const hex1 = n1.slice(2);
  const hex2 = n2.slice(2);
  return hex1.endsWith(hex2) || hex2.endsWith(hex1);
}

// OrderCreated event ABI for parsing
const ORDER_CREATED_EVENT = parseAbiItem(
  "event OrderCreated(bytes32 indexed orderId, address indexed token, address indexed requester, uint256 amount, string messageHash, uint256 rate, uint8 orderType)"
);

export interface OrderSettlementResult {
  /** The order ID (bytes32 hex string) */
  orderId: string;
  /** The transaction hash where settlement occurred */
  transactionHash: string;
  /** The block number where settlement occurred */
  blockNumber: bigint;
}

export interface UseOrderSettlementOptions {
  /** Contract address to watch */
  contractAddress: `0x${string}`;
  /** The order ID to watch for (hex string) - this is the tx_hash from createOffRampOrder API */
  orderId: string | null;
  /** Transaction hash of the order creation (same as orderId in your case) */
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
  /** The real orderId extracted from OrderCreated event (for debugging) */
  realOrderId: string | null;
}

export function useOrderSettlement({
  contractAddress,
  orderId,
  txHash,
  onSettled,
  onRefunded,
  enabled = true,
}: UseOrderSettlementOptions): UseOrderSettlementReturn {
  // State
  const [isSettled, setIsSettled] = useState(false);
  const [isRefunded, setIsRefunded] = useState(false);
  const [settlementResult, setSettlementResult] =
    useState<OrderSettlementResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [pollCount, setPollCount] = useState(0);
  
  // The REAL orderId extracted from the OrderCreated event (different from txHash!)
  const [realOrderId, setRealOrderId] = useState<string | null>(null);

  // Refs for stable values across renders
  const publicClient = usePublicClient();
  const isSettledRef = useRef(false);
  const isRefundedRef = useRef(false);
  const realOrderIdRef = useRef<string | null>(null);
  const startBlockRef = useRef<bigint | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingStopped = useRef(false);
  const hasExtractedOrderId = useRef(false);

  // Keep callbacks in refs to avoid recreating pollForEvents
  const onSettledRef = useRef(onSettled);
  const onRefundedRef = useRef(onRefunded);

  useEffect(() => {
    onSettledRef.current = onSettled;
    onRefundedRef.current = onRefunded;
  }, [onSettled, onRefunded]);

  // Sync refs with state
  useEffect(() => {
    isSettledRef.current = isSettled;
    isRefundedRef.current = isRefunded;
  }, [isSettled, isRefunded]);
  
  // Sync realOrderId ref
  useEffect(() => {
    realOrderIdRef.current = realOrderId;
  }, [realOrderId]);

  // Stop polling helper
  const stopPolling = useCallback(() => {
    isPollingStopped.current = true;
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Extract the REAL orderId from the OrderCreated event in the creation transaction
  // This is critical: the API returns txHash, but we need the orderId from the event!
  const extractOrderIdFromTx = useCallback(async () => {
    if (!publicClient || !txHash || hasExtractedOrderId.current) {
      return null;
    }
    
    try {
      const normalizedTxHash = normalizeHash(txHash) as `0x${string}`;
      console.log(`[useOrderSettlement] 📦 Extracting orderId from tx: ${normalizedTxHash}`);
      
      const receipt = await publicClient.getTransactionReceipt({
        hash: normalizedTxHash,
      });
      
      if (!receipt) {
        console.error("[useOrderSettlement] No receipt found for tx:", txHash);
        return null;
      }
      
      console.log(`[useOrderSettlement] Receipt has ${receipt.logs.length} logs`);
      
      // Find the OrderCreated event in the logs
      for (const log of receipt.logs) {
        try {
          // OrderCreated event signature hash
          const orderCreatedSignature = "0x" + "OrderCreated(bytes32,address,address,uint256,string,uint256,uint8)"
            .split("")
            .reduce((hash, char) => hash, ""); // We'll match by topics instead
          
          // The first topic is the event signature, orderId is the second topic (first indexed param)
          if (log.topics.length >= 2) {
            const decoded = decodeEventLog({
              abi: contractABI,
              data: log.data,
              topics: log.topics,
              eventName: "OrderCreated",
            });
            
            const extractedOrderId = (decoded.args as any).orderId as string;
            console.log(`✅ [useOrderSettlement] Extracted REAL orderId: ${extractedOrderId}`);
            
            hasExtractedOrderId.current = true;
            setRealOrderId(extractedOrderId);
            realOrderIdRef.current = extractedOrderId;
            return extractedOrderId;
          }
        } catch (e) {
          // Not an OrderCreated event, continue
          continue;
        }
      }
      
      console.error("[useOrderSettlement] No OrderCreated event found in tx logs");
      return null;
    } catch (err) {
      console.error("[useOrderSettlement] Error extracting orderId:", err);
      return null;
    }
  }, [publicClient, txHash]);

  // Main polling function - uses refs to avoid dependency changes
  const pollForEvents = useCallback(async () => {
    // Early exit checks using refs (stable across renders)
    if (isPollingStopped.current || isSettledRef.current || isRefundedRef.current) {
      console.log("[useOrderSettlement] Polling stopped - already settled/refunded");
      stopPolling();
      return;
    }

    if (!publicClient || !contractAddress) {
      console.log("[useOrderSettlement] Missing required params");
      return;
    }
    
    // First, try to get the real orderId from the creation tx
    let searchOrderId = realOrderIdRef.current;
    if (!searchOrderId && txHash) {
      searchOrderId = await extractOrderIdFromTx();
    }
    
    if (!searchOrderId) {
      console.log("[useOrderSettlement] ⏳ Waiting for orderId extraction...");
      return;
    }

    console.log(`[useOrderSettlement] 🔍 Polling for REAL orderId: ${searchOrderId}`);

    try {
      // Get current block
      const currentBlock = await publicClient.getBlockNumber();

      // Initialize start block from the creation tx
      if (startBlockRef.current === null) {
        if (txHash) {
          try {
            const receipt = await publicClient.getTransactionReceipt({
              hash: normalizeHash(txHash) as `0x${string}`,
            });
            startBlockRef.current = receipt.blockNumber;
            console.log(`[useOrderSettlement] Start block from tx receipt: ${startBlockRef.current}`);
          } catch (e) {
            console.log("[useOrderSettlement] Could not get tx receipt, using lookback");
            startBlockRef.current = currentBlock - BLOCK_LOOKBACK;
          }
        } else {
          startBlockRef.current = currentBlock - BLOCK_LOOKBACK;
        }
      }

      // Ensure valid block range
      if (startBlockRef.current > currentBlock) {
        console.log("[useOrderSettlement] Waiting for blocks...");
        return;
      }

      console.log(
        `[useOrderSettlement] Querying blocks ${startBlockRef.current} to ${currentBlock}`
      );

      // Query for OrderSettled events
      const settledLogs = await publicClient.getLogs({
        address: contractAddress,
        event: parseAbiItem("event OrderSettled(bytes32 indexed orderId)"),
        fromBlock: startBlockRef.current,
        toBlock: currentBlock,
      });

      console.log(`[useOrderSettlement] Found ${settledLogs.length} OrderSettled events`);

      // Check each settled log
      for (const log of settledLogs) {
        // Double-check we haven't already processed settlement
        if (isSettledRef.current) {
          console.log("[useOrderSettlement] Already settled, skipping...");
          return;
        }
        
        const eventOrderId = log.topics[1]; // bytes32 indexed orderId
        console.log(`[useOrderSettlement] Comparing: event=${eventOrderId} vs search=${searchOrderId}`);

        if (hashesMatch(eventOrderId, searchOrderId)) {
          console.log("✅ [useOrderSettlement] ORDER SETTLED!", {
            eventOrderId,
            searchOrderId,
            txHash: log.transactionHash,
          });

          const result: OrderSettlementResult = {
            orderId: eventOrderId as string,
            transactionHash: log.transactionHash,
            blockNumber: log.blockNumber,
          };

          // Update state and stop polling
          setSettlementResult(result);
          setIsSettled(true);
          isSettledRef.current = true;
          stopPolling();
          onSettledRef.current?.(result);
          return;
        }
      }

      // Query for OrderRefunded events
      const refundedLogs = await publicClient.getLogs({
        address: contractAddress,
        event: parseAbiItem("event OrderRefunded(bytes32 indexed orderId)"),
        fromBlock: startBlockRef.current,
        toBlock: currentBlock,
      });

      console.log(`[useOrderSettlement] Found ${refundedLogs.length} OrderRefunded events`);

      // Check each refunded log
      for (const log of refundedLogs) {
        const eventOrderId = log.topics[1];
        
        if (hashesMatch(eventOrderId, searchOrderId)) {
          console.log("⚠️ [useOrderSettlement] ORDER REFUNDED!", {
            eventOrderId,
            searchOrderId,
          });

          setIsRefunded(true);
          isRefundedRef.current = true;
          stopPolling();
          onRefundedRef.current?.(eventOrderId as string);
          return;
        }
      }

      // Move start block forward to avoid re-scanning
      startBlockRef.current = currentBlock + BigInt(1);
      console.log(`[useOrderSettlement] Poll complete. Next start: ${startBlockRef.current}`);
    } catch (err) {
      console.error("[useOrderSettlement] Poll error:", err);
      // Continue polling despite errors
    }
  }, [publicClient, contractAddress, txHash, stopPolling, extractOrderIdFromTx]);

  // Set up polling interval - only depends on stable values
  useEffect(() => {
    // Reset refs when txHash changes
    isPollingStopped.current = false;
    startBlockRef.current = null;
    hasExtractedOrderId.current = false;
    setRealOrderId(null);
    realOrderIdRef.current = null;

    if (!enabled || !txHash) {
      console.log("[useOrderSettlement] Polling disabled or no txHash");
      stopPolling();
      return;
    }

    if (isSettled || isRefunded) {
      console.log("[useOrderSettlement] Already settled/refunded, not starting poll");
      stopPolling();
      return;
    }

    console.log(`[useOrderSettlement] 🚀 Starting polling for txHash: ${txHash}`);

    // Do initial poll immediately
    pollForEvents();
    setPollCount(1);

    // Set up interval for subsequent polls
    pollIntervalRef.current = setInterval(() => {
      setPollCount((prev) => {
        const newCount = prev + 1;
        
        if (newCount > MAX_POLL_ATTEMPTS) {
          console.log("[useOrderSettlement] ⏰ Max poll attempts reached");
          stopPolling();
          setError(new Error("Settlement timeout - max poll attempts reached"));
          return prev;
        }

        // Check if we should still poll (using refs for latest values)
        if (!isPollingStopped.current && !isSettledRef.current && !isRefundedRef.current) {
          pollForEvents();
        }
        
        return newCount;
      });
    }, POLL_INTERVAL);

    // Cleanup on unmount or when dependencies change
    return () => {
      console.log("[useOrderSettlement] Cleanup - stopping polling");
      stopPolling();
    };
  }, [enabled, txHash, isSettled, isRefunded]); // Now depends on txHash, not orderId

  // Reset function
  const reset = useCallback(() => {
    console.log("[useOrderSettlement] 🔄 Reset called");
    stopPolling();
    setIsSettled(false);
    setIsRefunded(false);
    setSettlementResult(null);
    setRealOrderId(null);
    setError(null);
    setPollCount(0);
    isSettledRef.current = false;
    isRefundedRef.current = false;
    realOrderIdRef.current = null;
    startBlockRef.current = null;
    isPollingStopped.current = false;
    hasExtractedOrderId.current = false;
  }, [stopPolling]);

  return {
    isSettled,
    isRefunded,
    settlementResult,
    error,
    pollCount,
    reset,
    // Also expose the extracted orderId for debugging
    realOrderId,
  };
}

/**
 * Fetch order details from backend after settlement is detected
 */
export async function fetchOrderReceipt(txHash: string): Promise<any> {
  try {
    const res = await fetch(
      `/api/element-pay/orders/status?txHash=${encodeURIComponent(txHash)}`
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
