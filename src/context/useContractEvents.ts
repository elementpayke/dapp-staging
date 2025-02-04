import { useEffect } from "react";
import { ethers, BigNumberish } from 'ethers';

const CONTRACT_ADDRESS = "0x10af11060bC238670520Af7ca15E86a34bC68fe4"

const CONTRACT_ABI = [
{
  "anonymous": false,
  "inputs": [
    { "indexed": true, "name": "orderId", "type": "bytes32" },
    { "indexed": true, "name": "token", "type": "address" },
    { "indexed": true, "name": "requester", "type": "address" },
    { "indexed": false, "name": "amount", "type": "uint256" },
    { "indexed": false, "name": "messageHash", "type": "string" },
    { "indexed": false, "name": "rate", "type": "uint256" },
    { "indexed": false, "name": "orderType", "type": "uint8" }
  ],
  "name": "OrderCreated",
  "type": "event"
},
{
  "anonymous": false,
  "inputs": [
    { "indexed": true, "name": "orderId", "type": "bytes32" }
  ],
  "name": "OrderSettled",
  "type": "event"
},
{
  "inputs": [
    { "name": "_orderId", "type": "bytes32" }
  ],
  "name": "settleOrder",
  "outputs": [],
  "stateMutability": "nonpayable",
  "type": "function"
},
{
  "inputs": [
    { "internalType": "address", "name": "_userAddress", "type": "address" },
    { "internalType": "uint256", "name": "_amount", "type": "uint256" },
    { "internalType": "address", "name": "_token", "type": "address" },
    { "internalType": "enum IOrderManagement.OrderType", "name": "_orderType", "type": "uint8" },
    { "internalType": "string", "name": "messageHash", "type": "string" }
  ],
  "name": "createOrder",
  "outputs": [
    { "internalType": "bytes32", "name": "orderId", "type": "bytes32" }
  ],
  "stateMutability": "nonpayable",
  "type": "function"
}
];

const NODE_URL = "wss://base-sepolia.infura.io/ws/v3/ea4427e7b72e4fc3b6ac7b3ca31353c2";

const useContractEvents = (
    onOrderCreated: (order: any) => void,
    onOrderSettled: (order: any) => void
  ) => {
    useEffect(() => {
      const provider = new ethers.WebSocketProvider(NODE_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  
      const orderCreatedListener = (
        orderId: string,
        token: string,
        requester: string,
        amount: BigNumberish,
        messageHash: string,
        rate: BigNumberish,
        orderType: number
      ) => {
        const event = {
          orderId,
          token,
          requester,
          amount: ethers.formatUnits(amount, 6),
          messageHash,
          rate,
          orderType,
        };
        console.log('OrderCreated Event:', event);
        onOrderCreated(event);
      };
  
      const orderSettledListener = (orderId: string) => {
        const event = { orderId };
        console.log('OrderSettled Event:', event);
        onOrderSettled(event);
      };
  
      contract.on('OrderCreated', orderCreatedListener);
      contract.on('OrderSettled', orderSettledListener);
  
      return () => {
        contract.off('OrderCreated', orderCreatedListener);
        contract.off('OrderSettled', orderSettledListener);
        provider.destroy(); // Close the WebSocket connection
      };
    }, [onOrderCreated, onOrderSettled]);
  };
  
  export default useContractEvents;
  