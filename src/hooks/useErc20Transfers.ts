import { useCallback, useEffect, useRef, useState } from "react";
import { usePublicClient, useAccount } from "wagmi";
import { decodeEventLog, parseAbiItem } from "viem";

export interface TransferEvent {
  from: string;
  to: string;
  value: bigint;
  transactionHash: string;
  blockNumber: bigint;
}

export interface UseErc20TransfersOptions {
  tokenAddress: `0x${string}`;
  pollInterval?: number;
  enabled?: boolean;
}

export function useErc20Transfers({
  tokenAddress,
  pollInterval = 5000,
  enabled = true,
}: UseErc20TransfersOptions) {
  const { address: walletAddress } = useAccount();
  const publicClient = usePublicClient();
  const [transfers, setTransfers] = useState<TransferEvent[]>([]);
  const [pollCount, setPollCount] = useState(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastBlockRef = useRef<bigint | null>(null);

  const pollTransfers = useCallback(async () => {
    if (!publicClient || !tokenAddress || !walletAddress) return;

    try {
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = lastBlockRef.current
        ? lastBlockRef.current + BigInt(1)
        : currentBlock - BigInt(100);
      lastBlockRef.current = currentBlock;

      // ERC20 Transfer(address indexed from, address indexed to, uint256 value)
      const transferEvent =
        "event Transfer(address indexed from, address indexed to, uint256 value)";
      const logs = await publicClient.getLogs({
        address: tokenAddress,
        event: parseAbiItem(transferEvent),
        fromBlock,
        toBlock: currentBlock,
      });

      const relevant = logs.filter(
        (log) =>
          log.topics.length >= 3 &&
          (log.topics[1]
            ?.toLowerCase()
            .endsWith(walletAddress.slice(2).toLowerCase()) ||
            log.topics[2]
              ?.toLowerCase()
              .endsWith(walletAddress.slice(2).toLowerCase())),
      );

      const decoded = relevant.map((log) => {
        const { args } = decodeEventLog({
          abi: [parseAbiItem(transferEvent)],
          data: log.data,
          topics: log.topics,
          eventName: "Transfer",
        });
        return {
          from: (args as any).from as string,
          to: (args as any).to as string,
          value: (args as any).value as bigint,
          transactionHash: log.transactionHash,
          blockNumber: log.blockNumber,
        };
      });

      if (decoded.length > 0) {
        setTransfers((prev) => [...prev, ...decoded]);
        console.log(
          "[useErc20Transfers] Detected wallet transfer events:",
          decoded,
        );
      }
    } catch (err) {
      console.error("[useErc20Transfers] Poll error:", err);
    }
  }, [publicClient, tokenAddress, walletAddress]);

  useEffect(() => {
    if (!enabled || !tokenAddress || !walletAddress) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }
    pollTransfers();
    setPollCount(1);
    pollIntervalRef.current = setInterval(() => {
      setPollCount((prev) => prev + 1);
      pollTransfers();
    }, pollInterval);
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [enabled, tokenAddress, walletAddress, pollTransfers, pollInterval]);

  return { transfers, pollCount };
}

export default useErc20Transfers;
