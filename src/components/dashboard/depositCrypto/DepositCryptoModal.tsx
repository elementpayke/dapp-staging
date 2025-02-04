import React, { use, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import { ethers, parseUnits } from 'ethers';
import { getUSDCAddress } from '../../../services/tokens';
import { useContract } from "@/services/useContract";
import { encryptMessage } from "@/services/encryption";
import { useWallet } from "@/context/WalletContext";
import { parse } from "path";
import TransactionInProgressModal from "./TranactionInProgress";
import { set } from "react-hook-form";
import { usePublicClient, useAccount } from "wagmi";
import { CONTRACT_ABI, erc20Abi, gatewayAbi } from "@/app/api/abi";
import { CONTRACT_ADDRESS } from "@/app/api/abi";
import useContractEvents from "@/context/useContractEvents";


interface DepositCryptoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface WalletOption {
    id: string;
    icon: string;
    selected?: boolean;
}

const DepositCryptoModal: React.FC<DepositCryptoModalProps> = ({
    isOpen,
    onClose,
}) => {
    if (!isOpen) return null;

    const { usdcBalance } = useWallet();
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [selectedWallet, setSelectedWallet] = useState<string>("metamask");
    const [selectedToken, setSelectedToken] = useState("USDC");
    const [amount, setAmount] = useState("0.00");
    const [depositFrom, setDepositFrom] = useState("MPESA");
    const [phoneNumber, setPhoneNumber] = useState("0113159363");
    const [reason, setReason] = useState("Transport");
    const [isLoading, setIsLoading] = useState(false);
    const [exchangeRate, setExchangeRate] = useState<number | null>(null);
    const TRANSACTION_FEE_RATE = 0.005;
    const [orderCreatedEvents, setOrderCreatedEvents] = useState<any[]>([]);
    const [orderSettledEvents, setOrderSettledEvents] = useState<any[]>([]);


    const transactionSummary = useMemo(() => {
        if (!exchangeRate) {
            return {
                kesAmount: 0,
                usdcAmount: 0,
                transactionCharge: 0,
                totalUSDC: 0,
                totalKES: 0,
                totalKESBalance: 0,
                walletBalance: 0,
                remainingBalance: 0,
                usdcBalance: 0,
            };
        }

        const kesAmount = parseFloat(amount) * exchangeRate || 0;
        const usdcAmount = parseFloat(amount) || 0;
        const transactionCharge = usdcAmount * TRANSACTION_FEE_RATE;
        const totalUSDC = usdcAmount + transactionCharge;
        const remainingBalance = usdcBalance + totalUSDC;
        const totalKES = usdcBalance * exchangeRate;
        const totalKESBalance = totalKES + kesAmount;
        let intervalId: NodeJS.Timeout;   

        return {
            kesAmount,
            usdcAmount,
            transactionCharge,
            totalUSDC,
            totalKES,
            totalKESBalance: totalKESBalance,
            walletBalance: parseFloat(amount) || 0, // Assuming the amount is in KES
            remainingBalance: Math.max(remainingBalance, 0), // Remaining balance after spending
            usdcBalance: usdcBalance, // ✅ Use fetched USDC balance
        };
    }, [amount, exchangeRate, usdcBalance]);


    const handleClose = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const walletOptions: WalletOption[] = [
        {
            id: "metamask",
            icon: "🦊",
            selected: selectedWallet === "metamask",
        },
        {
            id: "coinbase",
            icon: "©️",
            selected: selectedWallet === "coinbase",
        },
        {
            id: "qr",
            icon: "🔲",
            selected: selectedWallet === "qr",
        },
    ];

    const { contract, contractWithProvider, address } = useContract();


    const MARKUP_PERCENTAGE = 1.5;

    const fetchExchangeRate = async () => {
        try {
            const response = await fetch(
                "https://api.coinbase.com/v2/exchange-rates?currency=USDC"
            );
            const data = await response.json();

            if (data?.data?.rates?.KES) {
                const baseRate = parseFloat(data.data.rates.KES);
                const markupRate = baseRate * (1 - MARKUP_PERCENTAGE / 100);
                console.log("Exchange rate:", markupRate);
                console.log("Base rate:", baseRate);
                setExchangeRate(markupRate);
            } else {
                console.error("KES rate not found");
                setExchangeRate(null);
            }
        } catch (error) {
            console.error("Error fetching exchange rate:", error);
            setExchangeRate(null);
        }
    };

    useContractEvents(
        (order: any) => {
          console.log("Order Created:", order);
          setOrderCreatedEvents((prev) => [...prev, order]);
        },
        (order: any) => {
          console.log("Order Settled:", order);
          setOrderSettledEvents((prev) => [...prev, order]);
        }
      );
    

    useEffect(() => {
        fetchExchangeRate();
    }, [isOpen]);



    const handleConfirmPayment = async () => {
        if (!address) {
            // TODO: Show a modal to connect wallet
            toast.error("Please connect your wallet first.");
            return;
        }

        if (parseFloat(amount) <= 0) {
            toast.error("Amount must be greater than zero.");
            return;
        }

        setIsLoading(true);

        const orderType = depositFrom === "MPESA" ? 0 : 1;
        const usdcTokenAddress = getUSDCAddress() as `0x${string}`;

        const mpesaAmount = parseFloat(amount) * (exchangeRate ?? 1);

        let messageHash = "";
        try {
            messageHash = encryptMessage(phoneNumber, "USD", exchangeRate ?? 0, mpesaAmount);
        } catch (error) {
            toast.error("Encryption failed.");
            setIsLoading(false);
            return;
        }


        try {
            if (!contract) throw new Error("Contract is not initialized.");

            // Call the createOrder function on your contract
            const tx = await contract.createOrder(
                address,
                parseUnits(amount, 6),
                usdcTokenAddress,
                orderType,
                messageHash
            )

            console.log("Transaction submitted. Awaiting confirmation...", tx.hash);
            setIsTransactionModalOpen(true);

            // check if there is a provider 
            
            if ( typeof window !== "undefined" && (window as any).ethereum) {
                const provider = new ethers.BrowserProvider((window as any).ethereum);
                console.log("Provider found", provider);
            } else {
                console.log("Ethereum provider not found");
            }

            if (tx){
                const receipt = await tx;
                console.log("Transaction receipt:", receipt);
                toast.success("Order created successfully!");
            }
            // onClose();
        } catch (error: any) {
            console.error("Error creating order:", error.tx);
            toast.error(error?.message || "Transaction failed.");
        } finally {
            setIsLoading(false);
        }
    };

    const client = usePublicClient();
    const [loading, setLoading] = useState(false);
    const account = useAccount();   

    const handleFetchCreatedOrders = async () => {
        if (!contractWithProvider) {
            console.error("Contract not initialized.");
            return;
        }

        if (!client) {
            console.error("Client not initialized.");
            return;
        }

        try {
            console.log("Fetching all created orders...");
            const currentBlock = await client.getBlockNumber();
            const fromBlock = currentBlock > BigInt(10) ? currentBlock - BigInt(100) : BigInt(0); // Avoid negative block numbers

            console.log(CONTRACT_ADDRESS);
            const logs = await client.getContractEvents({
                // address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`,
                abi: erc20Abi,
                eventName: "Approval",
                // args: {
                //     owner: account?.address as `0x${string}`,
                //     spender: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`,
                // },
                // fromBlock: currentBlock - BigInt(10),
                // toBlock: currentBlock,
            });

            console.log("logs:", logs);
            
            if (logs.length > 0) {
                console.log("Fetched created orders:", logs);
            } else if (!logs) {
                console.error("Failed to fetch events. Logs is undefined.");
            } else {
                console.warn("No created orders found.");
            }
            
        } catch (error) {
            console.error("Error fetching created orders:", error);
        }
    };

    useEffect(() => { 
        handleFetchCreatedOrders();
    }, []);

    
    return (
        <div    
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={handleClose}
        >

            <TransactionInProgressModal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} phone_number={phoneNumber} />

            <div className="bg-white rounded-3xl max-w-4xl w-full">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold text-gray-900">
                            Deposit Crypto
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            type="button"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="grid grid-cols-5 gap-6">
                        {/* Left Column - Form */}
                        <div className="col-span-3 space-y-4">
                            {/* Wallet Selection */}
                            <div>
                                <label className="block text-gray-600 mb-2">
                                    Select wallet to deposit to
                                </label>
                                <div className="flex gap-2">
                                    {walletOptions.map((wallet) => (
                                        <button
                                            key={wallet.id}
                                            onClick={() => setSelectedWallet(wallet.id)}
                                            className={`w-14 h-14 rounded-lg flex items-center justify-center text-2xl border-2 transition-all ${selectedWallet === wallet.id
                                                    ? "border-blue-500 bg-blue-50"
                                                    : "border-gray-200"
                                                }`}
                                            type="button"
                                        >
                                            {wallet.icon}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Token and Amount */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-600 mb-2">Token</label>
                                    <select
                                        value={selectedToken}
                                        onChange={(e) => setSelectedToken(e.target.value)}
                                        className="w-full p-3 bg-gray-50 rounded-lg border-0 text-gray-900"
                                    >
                                        <option value="USDC">USDC</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-600 mb-2">Amount in USDC</label>
                                    <input
                                        type="text"
                                        value={amount}
                                        onChange={(e) => {
                                            if (parseFloat(e.target.value) <= 100) {
                                                setAmount(e.target.value);
                                            } else {
                                                console.log(`amount: ${amount}`);
                                                setAmount(amount);
                                            }
                                        }}
                                        className="w-full p-3 bg-gray-50 rounded-lg border-0 text-gray-900"
                                    />
                                </div>
                            </div>

                            {/* Deposit From and Phone Number */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-600 mb-2">
                                        Deposit from
                                    </label>
                                    <select
                                        value={depositFrom}
                                        onChange={(e) => setDepositFrom(e.target.value)}
                                        className="w-full p-3 bg-gray-50 rounded-lg border-0 text-gray-900"
                                    >
                                        <option value="MPESA">MPESA</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-600 mb-2">
                                        Phone number
                                    </label>
                                    <input
                                        type="text"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        className="w-full p-3 bg-gray-50 rounded-lg border-0 text-gray-900"
                                    />
                                </div>
                            </div>

                            {/* Payment Reason */}
                            <div>
                                <label className="block text-gray-600 mb-2">
                                    Payment reason (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full p-3 bg-gray-50 rounded-lg border-0 text-gray-900"
                                    placeholder="Enter payment reason"
                                />
                            </div>
                        </div>

                        {/* Right Column - Transaction Summary */}
                        <div className="col-span-2 bg-gray-50 p-4 rounded-2xl h-fit">
                            <h3 className="text-xl font-semibold mb-4 text-gray-900">
                                Transaction summary
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">KES Equivalent</span>
                                    <span className="text-gray-900">
                                        KES {transactionSummary.kesAmount.toFixed(1)}0
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Wallet balance</span>
                                    <span className="text-green-600 font-medium">
                                        {/* TODO: Get USDC balance (reference offramp modal)*/}
                                        USDC {transactionSummary.usdcBalance.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Amount to recieve</span>
                                    <span className="text-gray-900">USDC {amount}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Transaction charge</span>
                                    {/* TODO: Decide on the charge */}
                                    <span className="text-orange-600">KE 0.00</span>
                                </div>
                                <div className="border-t pt-3 flex justify-between items-center font-medium">
                                    <span className="text-gray-900">Total:</span>
                                    {/* Update Total calculation */}
                                    <span className="text-gray-900">KE {transactionSummary.kesAmount.toFixed(1)}0</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleConfirmPayment}
                                disabled={isLoading}
                                className={`w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-red-600 text-white rounded-full font-medium hover:opacity-90 transition-opacity ${isLoading ? "opacity-50 cursor-not-allowed" : ""
                                    }`}
                            >
                                {isLoading ? "Processing..." : "Confirm payment"}
                            </button>

                            <div className="mt-4 bg-gray-100 p-3 rounded-lg">
                                <div className="text-gray-500 mb-1">
                                    Crypto Balance after transaction
                                </div>
                                <div className="flex justify-between">
                                    {/* TODO: Calculate balance after transaction for both USDC and KSH equivalent*/}
                                    <span className="text-gray-600">USDC: {transactionSummary.remainingBalance.toFixed(2)}</span>
                                    <span className="text-gray-600">KE {transactionSummary.totalKESBalance.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="mt-3 text-sm text-gray-500">
                                At the moment, ElementsPay only allow users to deposit USDC to
                                the wallet used at registration. However, we will soon allow the
                                deposit of other tokens.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DepositCryptoModal;