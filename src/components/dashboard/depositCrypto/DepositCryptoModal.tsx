import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle, X, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import { parseUnits } from "ethers";
import { getUSDCAddress } from "../../../services/tokens";
import { useContract } from "@/services/useContract";
import { encryptMessage } from "@/services/encryption";
import { useWallet } from "@/context/WalletContext";
import { useAccount } from "wagmi";
import { useContractEvents } from "@/context/useContractEvents";
import TransactionInProgressModal from "./TranactionInProgress";
import DepositCryptoReceipt from "./DepositCryptoReciept";
import { fetchOrderStatus } from "@/app/api/aggregator";

// Define the OrderStatus type that was missing
type OrderStatus = "pending" | "processing" | "settled" | "complete" | "completed" | "failed";

interface DepositCryptoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DepositCryptoModal: React.FC<DepositCryptoModalProps> = ({
    isOpen,
    onClose,
}) => {
    const { usdcBalance } = useWallet();
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [selectedToken, setSelectedToken] = useState("USDC");
    const [amount, setAmount] = useState("0.00");
    const [depositFrom, setDepositFrom] = useState("MPESA");
    const [phoneNumber, setPhoneNumber] = useState("0113159363");
    const [reason, setReason] = useState("Transport");
    const [isLoading, setIsLoading] = useState(false);
    const [exchangeRate, setExchangeRate] = useState<number | null>(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const TRANSACTION_FEE_RATE = 0.005;
    const [orderCreatedEvents, setOrderCreatedEvents] = useState<any[]>([]);
    const { contract, address } = useContract();
    const addressOwner = useAccount();
    const [formValidation, setFormValidation] = useState({
        amount: false,
        phoneNumber: false,
    });

    const MARKUP_PERCENTAGE = 0.5;

    const transactionSummary = useMemo(() => {
        if (!exchangeRate)
            return {
                kesAmount: 0,
                usdcAmount: 0,
                transactionCharge: 0,
                totalUSDC: 0,
                totalKES: 0,
                totalKESBalance: 0,
                walletBalance: usdcBalance || 36.07,
                remainingBalance: 0,
                usdcBalance: usdcBalance || 36.07,
            };

        const kesAmount = parseFloat(amount) * exchangeRate || 0;
        const usdcAmount = parseFloat(amount) || 0;
        const transactionCharge = usdcAmount * TRANSACTION_FEE_RATE;
        const totalUSDC = usdcAmount;
        const remainingBalance = (usdcBalance || 36.07) + totalUSDC;
        const totalKES = (usdcBalance || 36.07) * exchangeRate;
        const totalKESBalance = totalKES + kesAmount;

        return {
            kesAmount,
            usdcAmount,
            transactionCharge,
            totalUSDC,
            totalKES,
            totalKESBalance,
            walletBalance: usdcBalance || 36.07,
            remainingBalance: Math.max(remainingBalance, 0),
            usdcBalance: usdcBalance || 36.07,
        };
    }, [amount, exchangeRate, usdcBalance]);

    const [transactionReceipt, setTransactionReceipt] = useState<any | null>({
        amount: amount || "0.00",
        amountUSDC: Number(amount) * (exchangeRate ?? 1) || 0,
        phoneNumber: phoneNumber || "",
        address: addressOwner || "",
        status: "pending",
        reason: "", // Add reason field
        transactionHash: "",
    });

    const handleClose = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const fetchExchangeRate = async () => {
        try {
            const response = await fetch(
                "https://api.coinbase.com/v2/exchange-rates?currency=USDC"
            );
            const data = await response.json();

            if (data?.data?.rates?.KES) {
                const baseRate = parseFloat(data.data.rates.KES);
                const markupRate = baseRate * (1 + MARKUP_PERCENTAGE / 100);
                //add 1.5% markup to the base rate
                const adjustedRate = baseRate + markupRate;
                setExchangeRate(markupRate);
            }
        } catch (error) {
            console.error("Error fetching exchange rate:", error);
            toast.error("Unable to fetch exchange rate");
        }
    }

    const pollOrderStatus = async (orderId: string) => {
        try {
            console.log("Polling order status for orderId:", orderId);
            const response = await fetchOrderStatus(orderId);

            // Handle 404 case - order not found yet
            if (response.status === 404) {
                console.log("Order not found yet, will retry in 3 seconds...");
                setTimeout(() => pollOrderStatus(orderId), 3000);
                return;
            }

            if (response.status === 200 && response.data) {
                const orderData = response.data;
                const status = orderData.data?.status?.toLowerCase() as OrderStatus;
                const failureReason = orderData.data?.failure_reason || "Unknown error";
                
                // Translate technical error messages to user-friendly messages
                const getUserFriendlyError = (reason: string) => {
                    const errorMap: { [key: string]: string } = {
                        "Missing CheckoutRequestID in STK response.": "Invalid phone number. Please check and try again.",
                        // Add more error mappings here as needed
                    };
                    return errorMap[reason] || reason;
                };
                
                // Extract transaction hash correctly based on actual API response structure
                const transactionHash = 
                    orderData.data?.transaction_hashes?.settlement || 
                    orderData.data?.transaction_hash || // Check for alternative keys
                    "";

                setTransactionReceipt((prev: {
                    orderId?: string;
                    status: string;
                    reason: string;
                    amount: number;
                    amountUSDC: number;
                    transactionHash: string;
                }) => ({
                    ...prev,
                    orderId: orderData.data?.order_id,
                    status: status || "pending",
                    reason: status === "failed" ? getUserFriendlyError(failureReason) : prev.reason,
                    amount: orderData.data?.amount_fiat || parseFloat(amount),
                    amountUSDC: (orderData.data?.amount_fiat || parseFloat(amount)) * (exchangeRate ?? 1),
                    transactionHash: status === "failed" ? orderData.data?.transaction_hashes?.creation || "" : transactionHash,
                }));

                // Handle different status cases
                switch (status) {
                    case "settled":
                        if (!transactionHash) {
                            console.log("Status is settled but hash is empty, continuing to poll...");
                            setTimeout(() => pollOrderStatus(orderId), 3000);
                            return;
                        }
                        console.log("Order settled with hash:", transactionHash);
                        setIsTransactionModalOpen(false);
                        setIsReceiptModalOpen(true);
                        break;

                    case "failed":
                        console.log("Order failed with reason:", failureReason);
                        toast.error(getUserFriendlyError(failureReason));
                        setIsTransactionModalOpen(false);
                        setIsReceiptModalOpen(true);
                        break;

                    case "pending":
                    case "processing":
                        setIsTransactionModalOpen(true);
                        setIsReceiptModalOpen(false);
                        setTimeout(() => pollOrderStatus(orderId), 3000);
                        break;

                    default:
                        console.log("Unknown status:", status);
                        setIsTransactionModalOpen(true);
                        setIsReceiptModalOpen(false);
                        break;
                }
            } else {
                console.error("Invalid response format:", response);
                toast.error("Unable to process order status");
                setIsTransactionModalOpen(false);
            }
        } catch (error) {
            console.error("Error fetching order status:", error);
            toast.error("Unable to fetch order status");
        }
    };
    useContractEvents(
        async (order: any) => {
            console.log("Order created event:", order);
            setOrderCreatedEvents((prev) => [...prev, order]);

            pollOrderStatus(order.orderId);
        },
        () => {
            setTransactionReceipt((prev: any) => ({ ...prev, status: "settled" }));
            setIsLoading(false);
            setIsTransactionModalOpen(false);
            setIsReceiptModalOpen(true);
        },
        () => {
            setIsTransactionModalOpen(false);
            setIsLoading(false);
        }
    );

    useEffect(() => {
        fetchExchangeRate();
    }, [isOpen]);

    const handleConfirmPayment = async () => {
        if (!address) return toast.error("Please connect your wallet first.");
        if (parseFloat(amount) <= 0)
            return toast.error("Amount must be greater than zero.");

        setIsLoading(true);
        const orderType = depositFrom === "MPESA" ? 0 : 1;
        const usdcTokenAddress = getUSDCAddress() as `0x${string}`;
        const mpesaAmount = parseFloat(amount) * (exchangeRate ?? 1);

        try {
            const messageHash = encryptMessage(
                phoneNumber,
                "USD",
                exchangeRate ?? 0,
                mpesaAmount
            );
            if (!contract) throw new Error("Contract is not initialized.");
            await contract.createOrder(
                address,
                parseUnits(amount, 6),
                usdcTokenAddress,
                orderType,
                messageHash
            );
            setIsTransactionModalOpen(true);
        } catch (error) {
            console.error("Transaction failed:", error);
            toast.error("Transaction failed.");
        } finally {
            setIsLoading(false);
        }
    };

    const formatPhoneNumber = (number: string) => {
        // Remove any non-digit characters
        const digitsOnly = number.replace(/\D/g, '');
        
        // If number starts with 0, replace it with 254
        if (digitsOnly.startsWith('0')) {
            return '254' + digitsOnly.substring(1);
        }
        
        // If number already starts with 254, return as is
        if (digitsOnly.startsWith('254')) {
            return digitsOnly;
        }
        
        // If number doesn't start with either, assume it's a complete number
        return digitsOnly;
    };

    const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formattedNumber = formatPhoneNumber(e.target.value);
        setPhoneNumber(formattedNumber);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center py-4 md:px-4 z-50"
            onClick={handleClose}
        >
            <TransactionInProgressModal
                isOpen={isTransactionModalOpen}
                onClose={() => setIsTransactionModalOpen(false)}
                phone_number={phoneNumber}
            />
            <DepositCryptoReceipt
                isOpen={isReceiptModalOpen}
                onClose={() => {
                    setIsReceiptModalOpen(false);
                    onClose();
                }}
                transactionReciept={transactionReceipt}
            />
            
            {/* Modal content */}
            <div 
                className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col" 
                onClick={e => e.stopPropagation()}
                style={{maxWidth: "800px"}}
            >
                {/* Header */}
                <div className="flex items-center p-4 border-b">
                    <button 
                        className="mr-3 text-gray-500 hover:text-gray-700"
                        onClick={onClose}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="text-xl font-semibold flex-grow">Deposit Crypto</h2>
                    <button 
                        className="text-gray-500 hover:text-gray-700"
                        onClick={onClose}
                    >
                        <X size={20} />
                    </button>
                </div>
                
                {/* Content */}
                <div className="flex flex-col md:flex-row flex-1">
                    {/* Left form side */}
                    <div className="md:w-1/2 p-6 flex flex-col space-y-4">
                        {/* Token */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Token</label>
                            <div className="relative">
                                <select 
                                    className="w-full p-3 bg-gray-100 rounded-lg focus:outline-none"
                                    value={selectedToken}
                                    onChange={(e) => setSelectedToken(e.target.value)}
                                >
                                    <option value="USDC">USDC</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        
                        {/* Amount */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Amount in USDC</label>
                            <input
                                type="number"
                                className="w-full p-3 bg-gray-100 rounded-lg focus:outline-none"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                        
                        {/* Deposit from */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Deposit from</label>
                            <div className="relative">
                                <select 
                                    className="w-full p-3 bg-gray-100 rounded-lg focus:outline-none"
                                    value={depositFrom}
                                    onChange={(e) => setDepositFrom(e.target.value)}
                                >
                                    <option value="MPESA">MPESA</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        
                        {/* Phone number */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Phone number</label>
                            <input
                                type="tel"
                                className="w-full p-3 bg-gray-100 rounded-lg focus:outline-none"
                                value={phoneNumber}
                                onChange={handlePhoneNumberChange}
                                placeholder="e.g. 0712345678"
                            />
                        </div>
                        
                        {/* Reason */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Payment reason (Optional)</label>
                            <input
                                type="text"
                                className="w-full p-3 bg-gray-100 rounded-lg focus:outline-none"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="e.g. Transport"
                            />
                        </div>
                        
                        {/* Favorite checkbox */}
                        <div className="flex items-center mt-2">
                            <div 
                                className={`flex items-center justify-center w-6 h-6 rounded-full border mr-2 cursor-pointer ${isFavorite ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}
                                onClick={() => setIsFavorite(!isFavorite)}
                            >
                                {isFavorite && <CheckCircle size={16} className="text-white" />}
                            </div>
                            <label className="text-sm text-gray-600 cursor-pointer" onClick={() => setIsFavorite(!isFavorite)}>
                                Favorite this payment details for future transactions
                            </label>
                        </div>
                    </div>
                    
                    {/* Right transaction summary side */}
                    <div className="md:w-1/2 p-6 flex flex-col bg-gray-50 space-y-4">
                        <div>
                            <h3 className="text-xl font-medium mb-4">Transaction summary</h3>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">KES Equivalent</span>
                                    <span className="font-medium">
                                        KES {(parseFloat(amount || "0") * (exchangeRate || 127.3)).toFixed(2)}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Amount to recieve</span>
                                    <span className="font-medium">
                                        USDC {parseFloat(amount || "0").toFixed(2)}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Transaction charge</span>
                                    <span className="font-medium text-orange-500">
                                        KE {(parseFloat(amount || "0") * TRANSACTION_FEE_RATE * (exchangeRate || 127.3)).toFixed(2)}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Wallet balance</span>
                                    <span className="font-medium text-green-500">
                                        USDC {transactionSummary.walletBalance.toFixed(2)}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between pt-3 border-t">
                                    <span className="font-medium">Total:</span>
                                    <span className="font-medium">
                                        KE {(parseFloat(amount || "0") * (exchangeRate || 127.3)).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Confirm payment button */}
                            <button
                                className="w-full mt-6 py-4 rounded-lg text-white font-medium"
                                onClick={handleConfirmPayment}
                                disabled={isLoading || parseFloat(amount) <= 0}
                                style={{
                                    background: "linear-gradient(90deg, rgba(59,130,246,1) 0%, rgba(239,68,68,1) 100%)",
                                    opacity: isLoading || parseFloat(amount) <= 0 ? 0.7 : 1
                                }}
                            >
                                {isLoading ? "Processing..." : "Confirm payment"}
                            </button>
                        </div>
                        
                        {/* Balance after transaction */}
                        <div className="mt-6 bg-gray-100 rounded-lg p-4">
                            <h4 className="text-gray-600 mb-2">Crypto Balance after transaction</h4>
                            <div className="flex justify-between">
                                <span>USDC: {transactionSummary.walletBalance.toFixed(2)}</span>
                                <span>KE {(transactionSummary.walletBalance * (exchangeRate || 127.3)).toFixed(2)}</span>
                            </div>
                        </div>
                        
                        {/* Information text */}
                        <div className="mt-4 text-gray-500 text-sm">
                            At the moment, ElementsPay only allow users to deposit USDC to the wallet used at registration. 
                            However, we will soon allow the deposit of other tokens.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DepositCryptoModal;