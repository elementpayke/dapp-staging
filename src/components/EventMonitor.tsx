import { useState } from "react";
import { useWatchContractEvent, useChainId } from "wagmi";
import contractABI from "@/lib/contractABI.json";

// ERC20 Transfer event ABI
const ERC20_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "from", type: "address" },
      { indexed: true, internalType: "address", name: "to", type: "address" },
      { indexed: false, internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "Transfer",
    type: "event",
  },
];

// Token addresses per chain
export const TOKEN_ADDRESSES = {
  lisk: "0xC535E8838730CfE097A0d3b7C6eF565B45DC74e3", // Example, update as needed
  base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  arbitrum: "0x2e6B4d8761dF6e70fa5B6D0A01fAa5081A38ec8B",
};

// Contract address from .env (Base chain)
export const ORDER_MANAGEMENT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_BASE;

export function EventMonitor() {
  const [orderCreatedEvents, setOrderCreatedEvents] = useState([]);
  const [orderSettledEvents, setOrderSettledEvents] = useState([]);
  const [tokenTransfers, setTokenTransfers] = useState([]);
  const chainId = useChainId();

  // Map chainId to token address
  const tokenAddressMap = {
    1135: TOKEN_ADDRESSES.lisk,
    8453: TOKEN_ADDRESSES.base,
    42161: TOKEN_ADDRESSES.arbitrum,
  };
  const tokenAddress = tokenAddressMap[chainId];

  // Listen to OrderCreated events
  useWatchContractEvent({
    address: ORDER_MANAGEMENT_ADDRESS,
    abi: contractABI,
    eventName: "OrderCreated",
    onLogs(logs) {
      const newOrders = logs.map((log) => ({
        orderId: log.args.orderId,
        token: log.args.token,
        requester: log.args.requester,
        amount: log.args.amount?.toString(),
        messageHash: log.args.messageHash,
        rate: log.args.rate?.toString(),
        orderType: log.args.orderType,
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        timestamp: new Date().toISOString(),
      }));
      setOrderCreatedEvents((prev) => [...newOrders, ...prev]);
      console.log("New orders created:", newOrders);
    },
  });

  // Listen to OrderSettled events
  useWatchContractEvent({
    address: ORDER_MANAGEMENT_ADDRESS,
    abi: contractABI,
    eventName: "OrderSettled",
    onLogs(logs) {
      const settledOrders = logs.map((log) => ({
        orderId: log.args.orderId,
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        timestamp: new Date().toISOString(),
      }));
      setOrderSettledEvents((prev) => [...settledOrders, ...prev]);
      console.log("Orders settled:", settledOrders);
    },
  });

  // Listen to Token Transfer events
  useWatchContractEvent({
    address: tokenAddress,
    abi: ERC20_ABI,
    eventName: "Transfer",
    onLogs(logs) {
      const transfers = logs.map((log) => ({
        from: log.args.from,
        to: log.args.to,
        value: log.args.value?.toString(),
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        timestamp: new Date().toISOString(),
      }));
      setTokenTransfers((prev) => [...transfers, ...prev]);
      console.log("Token transfers:", transfers);
    },
  });

  // Listen to OrderRefunded events
  useWatchContractEvent({
    address: ORDER_MANAGEMENT_ADDRESS,
    abi: contractABI,
    eventName: "OrderRefunded",
    onLogs(logs) {
      console.log("Orders refunded:", logs);
    },
  });

  // Listen to EscrowReleased events
  useWatchContractEvent({
    address: ORDER_MANAGEMENT_ADDRESS,
    abi: contractABI,
    eventName: "EscrowReleased",
    onLogs(logs) {
      console.log("Escrow released:", logs);
    },
  });

  return (
    <div className="p-6 space-y-6">
      {/* Orders Created */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Orders Created</h2>
        <div className="space-y-2">
          {orderCreatedEvents.map((event, i) => (
            <div key={i} className="p-4 border rounded-lg">
              <p><strong>Order ID:</strong> {event.orderId}</p>
              <p><strong>Requester:</strong> {event.requester}</p>
              <p><strong>Amount:</strong> {event.amount}</p>
              <p><strong>Token:</strong> {event.token}</p>
              <p><strong>Rate:</strong> {event.rate}</p>
              <p><strong>Message Hash:</strong> {event.messageHash}</p>
              <p><strong>Tx Hash:</strong> {event.transactionHash}</p>
              <p className="text-sm text-gray-500">{event.timestamp}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Orders Settled */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Orders Settled</h2>
        <div className="space-y-2">
          {orderSettledEvents.map((event, i) => (
            <div key={i} className="p-4 border rounded-lg">
              <p><strong>Order ID:</strong> {event.orderId}</p>
              <p><strong>Tx Hash:</strong> {event.transactionHash}</p>
              <p className="text-sm text-gray-500">{event.timestamp}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Token Transfers */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Token Transfers</h2>
        <div className="space-y-2">
          {tokenTransfers.map((event, i) => (
            <div key={i} className="p-4 border rounded-lg">
              <p><strong>From:</strong> {event.from}</p>
              <p><strong>To:</strong> {event.to}</p>
              <p><strong>Amount:</strong> {event.value}</p>
              <p><strong>Tx Hash:</strong> {event.transactionHash}</p>
              <p className="text-sm text-gray-500">{event.timestamp}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
