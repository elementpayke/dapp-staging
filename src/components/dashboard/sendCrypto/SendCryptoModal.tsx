import React, { useState, useEffect, useMemo } from "react";
import { X, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import PayToBank from "./PayToBank";
import PayToMobileMoney from "./PayToMobileMoney";
import { parseUnits } from "viem";
import { useAccount, useWriteContract, useWatchContractEvent } from "wagmi";
import { CONTRACT_ABI, erc20Abi } from "@/app/api/abi";
import { getUSDCAddress } from '../../../services/tokens';
import { useContract } from "@/services/useContract";
import { useWallet } from "@/context/WalletContext";
import { encryptMessage } from "@/services/encryption";
import SendCryptoReceipt from "./SendCryptoReciept";
import { useContractEvents } from "@/context/useContractEvents";
import { waitForTransaction, decodeEventLog } from "wagmi/actions"; // Added missing imports
import { keccak256 } from "viem";

interface SendCryptoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface WalletOption {
    id: string;
    icon: string;
    selected?: boolean;
}

const SendCryptoModal: React.FC<SendCryptoModalProps> = ({
    isOpen,
    onClose,
}) => {
    const [isSendCryptoReceipt, setSendCryptoReceipt] = useState(false); // Fixed spelling
    const [paymentType, setPaymentType] = useState<"bank" | "mobile">("bank");
    const [selectedToken, setSelectedToken] = useState("USDC");
    const [amount, setAmount] = useState("");
    const [bank, setBank] = useState("Equity Bank");
    const [accountNumber, setAccountNumber] = useState("1170398667889");
    const [mobileNumber, setMobileNumber] = useState("0703417782");
    const [reason, setReason] = useState("Transport");
    const [favorite, setFavorite] = useState(true);
    const [selectedWallet, setSelectedWallet] = useState<string>("metamask");
    const [isApproving, setIsApproving] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const { usdcBalance } = useWallet();
    const [exchangeRate, setExchangeRate] = useState<number | null>(null);
    const MARKUP_PERCENTAGE = 1.5; // 1.5% markup
    const [transactionReceipt, setTransactionReceipt] = useState<any | null>({ // Fixed spelling
        amount: amount || "0.00",
        amountUSDC: Number(amount) * (exchangeRate ?? 1) || 0,
        phoneNumber: mobileNumber || "",
        address: useAccount().address || "",
        status: 0,
        transactionHash: "",
    });

    // Fetch exchange rate from Coinbase API
    useEffect(() => {
        const fetchExchangeRate = async () => {
            try {
                const response = await fetch(
                    "https://api.coinbase.com/v2/exchange-rates?currency=USDC"
                );
                const data = await response.json();
                if (data?.data?.rates?.KES) {
                    const baseRate = parseFloat(data.data.rates.KES);
                    const markupRate = baseRate * (1 - MARKUP_PERCENTAGE / 100);
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

        fetchExchangeRate();
    }, []);

    const calculateUSDCAmount = () => {
        if (!exchangeRate) return 0; // Prevent errors if exchange rate is unavailable
        const kesAmount = parseFloat(amount) || 0;
        return (kesAmount / exchangeRate).toFixed(6); // Convert KES to USDC
    };

    // Get the USDC amount needed
    calculateUSDCAmount();

    const TRANSACTION_FEE_RATE = 0.005; // 0.5%

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

        const kesAmount = parseFloat(amount) || 0;
        const usdcAmount = kesAmount / exchangeRate;
        const transactionCharge = usdcAmount * TRANSACTION_FEE_RATE;
        const totalUSDC = usdcAmount + transactionCharge;
        const remainingBalance = usdcBalance - totalUSDC;
        const totalKES = usdcBalance * exchangeRate;
        const totalKESBalance = totalKES - kesAmount;
        
        // Update transaction receipt state within useMemo
        setTransactionReceipt((prev: any) => ({
            ...prev,
            amount: usdcAmount.toFixed(6),
            amountUSDC: kesAmount
        }));

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

    const account = useAccount();
    const { writeContractAsync } = useWriteContract();

    const handleClose = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const usdcTokenAddress = getUSDCAddress() as `0x${string}`;
    const { contract, address } = useContract();

   
    useContractEvents(
        (order: any) => console.log("OrderCreated", order),
        (order: any) => {
            setTransactionReceipt((prev: any) => ({ ...prev, status: 1 }));
            setSendCryptoReceipt(true);
            setIsApproving(false);
            setIsApproving(false);

            console.log("OrderSettled", order);
        },
        (orderId: any) => { 
            setTransactionReceipt((prev: any) => ({ ...prev, status: 2 }));
            setIsApproving(false);
            setSendCryptoReceipt(true);
            setIsApproving(false);

            console.log("OrderRefunded", orderId);
        }
    );

    // Moved encryption outside of render to prevent re-computation on each render
    const [messageHash, setMessageHash] = useState("");
    
    useEffect(() => {
        try {
            const hash = encryptMessage(mobileNumber, "KES", exchangeRate ?? 0, transactionSummary.totalUSDC);
            setMessageHash(hash);
        } catch (error) {
            console.error("Error encrypting message:", error);
        }
    }, [mobileNumber, exchangeRate, transactionSummary.totalUSDC]);

    const smartcontractaddress = "0x7db5E675f62956E725685C22D240C8f28855114A";

    // Contract event listeners should be moved to a useEffect or custom hook
    const [orderId, setOrderId] = useState<string | null>(null);
    
    // Fix: Use useContractEvent hook properly inside a useEffect
    useEffect(() => {
        if (!orderId) return;
        
        // For OrderSettled event
        const { unsubscribe: unsubscribeSettled } = useWatchContractEvent({
            address: smartcontractaddress as `0x${string}`,
            abi: CONTRACT_ABI,
            eventName: "OrderSettled",
            onLogs: (logs: any) => {
                const log = logs[0];
                if (log.args.orderId === orderId) {
                    console.log("Order Settled:", log);
                    setTransactionReceipt((prev: any) => ({
                        ...prev,
                        status: 1, // 1 for settled
                        transactionHash: log.transactionHash,
                    }));
                    setIsProcessing(true);
                    setSendCryptoReceipt(true);
                    toast.success("Order has been settled successfully!");
                }
            },
        });
    
        // For OrderRefunded event
        const { unsubscribe: unsubscribeRefunded } = useWatchContractEvent({
            address: smartcontractaddress as `0x${string}`,
            abi: CONTRACT_ABI,
            eventName: "OrderRefunded",
            onLogs: (logs: any) => {
                const log = logs[0];
                if (log.args.orderId === orderId) {
                    console.log("Order Refunded:", log);
                    setTransactionReceipt((prev: any) => ({
                        ...prev,
                        status: 2, // 2 for refunded
                        transactionHash: log.transactionHash,
                    }));
                    setSendCryptoReceipt(true);
                    setIsProcessing(true);
                    toast.info("Order has been refunded.");
                }
            },
        });
        
        // Clean up subscriptions
        return () => {
            unsubscribeSettled();
            unsubscribeRefunded();
        };
    }, [orderId]);

    const handleApproveToken = async () => {
        if (!account.address) {
            toast.error("Please connect your wallet first");
            return;
        }
    
        if (parseFloat(amount) <= 0) {
            toast.error("Amount must be greater than zero");
            return;
        }
    
        try {
            setIsApproving(true);
    
            const tokenAddress = usdcTokenAddress;
            const spenderAddress = smartcontractaddress as `0x${string}`;
            if (!spenderAddress) {
                toast.error("Spender address is not defined");
                return;
            }
            const orderType = 1;
    
            // Approve USDC spending
            await writeContractAsync({
                address: tokenAddress,
                abi: erc20Abi,
                functionName: "approve",
                args: [
                    spenderAddress,
                    parseUnits(transactionSummary.totalUSDC.toString(), 6),
                ],
            });
    
            // Create order
            const tx = await writeContractAsync({
                address: smartcontractaddress as `0x${string}`,
                abi: CONTRACT_ABI,
                functionName: "createOrder",
                args: [
                    address,
                    parseUnits(transactionSummary.totalUSDC.toString(), 6),
                    usdcTokenAddress,
                    orderType,
                    messageHash
                ],
            });
    
            console.log("Transaction hash:", tx);
            // Wait for the transaction to be mined
            const receipt = await waitForTransaction({ hash: tx });
            console.log("Transaction receipt:", receipt);

            if (receipt.status === "success") {
                // Extract the OrderCreated event from the transaction receipt
                const orderCreatedEvent = receipt.logs.find(
                    (log: any) => log.topics[0] === keccak256("OrderCreated(bytes32,address,address,uint256,string,uint256,uint8)")
                );
    
                if (orderCreatedEvent) {
                    const decodedEvent = decodeEventLog({
                        abi: CONTRACT_ABI,
                        data: orderCreatedEvent.data,
                        topics: orderCreatedEvent.topics,
                    });
    
                    const newOrderId = decodedEvent.args.orderId;
                    console.log("Order Created with ID:", newOrderId);
    
                    // Set the orderId state
                    setOrderId(newOrderId);
                    
                    // Set the orderId in the transaction receipt
                    setTransactionReceipt((prev: any) => ({
                        ...prev,
                        orderId: newOrderId,
                        status: 0, // 0 for pending
                        transactionHash: tx,
                    }));

                } else {
                    toast.error("OrderCreated event not found in transaction receipt");
                }
            } else {
                toast.error("Transaction failed");
            }
        } catch (error: any) {
            console.error("Error creating order:", error);
            setTransactionReceipt((prev: any) => ({
                ...prev,
                status: 0
            }));
            toast.error(error?.message || "Transaction failed.");
        } finally {
        }
    };

    const walletOptions: WalletOption[] = [
        { id: "metamask", icon: "🦊", selected: selectedWallet === "metamask" },
        { id: "coinbase", icon: "©️", selected: selectedWallet === "coinbase" },
        { id: "qr", icon: "🔲", selected: selectedWallet === "qr" },
    ];
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-start md:items-center justify-center z-50"
            onClick={handleClose}
        >
            <SendCryptoReceipt 
                isOpen={isSendCryptoReceipt} 
                onClose={() => setSendCryptoReceipt(false)} 
                transactionReciept={transactionReceipt} 
            />
            <div className="bg-white w-full h-full md:h-auto md:rounded-3xl md:max-w-4xl overflow-auto">
                <div className="p-4 md:p-6">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <button onClick={onClose} className="md:hidden p-1" type="button">
                                <ArrowLeft className="w-6 h-6 text-[#444]" />
                            </button>
                            <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                                Spend Crypto
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="hidden md:block p-2 hover:bg-gray-100 rounded-full transition-colors"
                            type="button"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="grid md:grid-cols-5 gap-6">
                        {/* Left Column - Form */}
                        <div className="md:col-span-3 space-y-4">
                            {/* Payment Type Selection */}
                            <div className="flex gap-3">
                                <button
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${paymentType === "bank"
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-100 text-gray-600"
                                        }`}
                                    onClick={() => setPaymentType("bank")}
                                    type="button"
                                >
                                    <div className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center">
                                        {paymentType === "bank" && (
                                            <div className="w-2 h-2 bg-current rounded-full" />
                                        )}
                                    </div>
                                    Pay to Bank
                                </button>
                                <button
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${paymentType === "mobile"
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-100 text-gray-600"
                                        }`}
                                    onClick={() => setPaymentType("mobile")}
                                    type="button"
                                >
                                    <div className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center">
                                        {paymentType === "mobile" && (
                                            <div className="w-2 h-2 bg-current rounded-full" />
                                        )}
                                    </div>
                                    Pay to Mobile Money
                                </button>
                            </div>

                            {/* Wallet Selection */}
                            {paymentType === "bank" && (
                                <div>
                                    <label className="block text-gray-600 mb-2">
                                        Select wallet to pay from
                                    </label>
                                    <div className="flex gap-2">
                                        {walletOptions.map((wallet) => (
                                            <button
                                                key={wallet.id}
                                                onClick={() => setSelectedWallet(wallet.id)}
                                                className={`w-12 h-12 md:w-14 md:h-14 rounded-lg flex items-center justify-center text-2xl border-2 transition-all ${selectedWallet === wallet.id
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
                            )}

                            {/* Payment Form */}
                            {paymentType === "bank" ? (
                                <PayToBank
                                    selectedToken={selectedToken}
                                    setSelectedToken={setSelectedToken}
                                    amount={amount}
                                    setAmount={setAmount}
                                    bank={bank}
                                    setBank={setBank}
                                    accountNumber={accountNumber}
                                    setAccountNumber={setAccountNumber}
                                    reason={reason}
                                    setReason={setReason}
                                />
                            ) : (
                                <PayToMobileMoney
                                    selectedToken={selectedToken}
                                    setSelectedToken={setSelectedToken}
                                    amount={amount}
                                    setAmount={setAmount}
                                    mobileNumber={mobileNumber}
                                    setMobileNumber={setMobileNumber}
                                    reason={reason}
                                    setReason={setReason}
                                    totalKES={transactionSummary.totalKES}
                                />
                            )}

                            {/* Favorite Option */}
                            <div className="flex items-center gap-2">
                                <input
                                    id="favorite"
                                    type="checkbox"
                                    checked={favorite}
                                    onChange={(e) => setFavorite(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                                />
                                <label htmlFor="favorite" className="text-gray-600 text-sm">
                                    Favorite this payment details for future transactions
                                </label>
                            </div>

                            {/* Mobile View Confirm Button */}
                            <button
                                onClick={parseFloat(amount) >= 20 ? handleApproveToken : undefined}
                                disabled={isApproving || transactionSummary.totalUSDC <= 0}
                                type="button"
                                className="w-full md:hidden mt-4 py-3 bg-gradient-to-r from-blue-600 to-red-600 text-white rounded-full font-medium disabled:opacity-50"
                            >
                                {isApproving ? "Approving..." : "Confirm Payment"}
                            </button>
                        </div>

                        {/* Right Column - Transaction Summary (Hidden on Mobile) */}
                        <div className="hidden md:block md:col-span-2 bg-gray-50 p-4 rounded-2xl h-fit">
                            <h3 className="text-xl font-semibold mb-4 text-gray-900">
                                Transaction summary
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Wallet balance</span>
                                    <span className="text-green-600 font-medium">
                                        USDC {transactionSummary.usdcBalance.toFixed(6)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Amount to send</span>
                                    <span className="text-gray-900">KE {transactionSummary.kesAmount.toFixed(2)}</span>
                                </div>
                                {amount && Math.abs(parseFloat(amount) - transactionSummary.totalKES) <= 0.9 && (
                                    <div className="text-red-500 text-sm">
                                        <p className="text-red-500 mt-2 text-sm">
                                            Opt-In to Hakiba to gain credit
                                        </p>
                                    </div>
                                )}
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Transaction charge (0.5%)</span>
                                    <span className="text-orange-600">KE {transactionSummary.transactionCharge.toFixed(2)}</span>
                                </div>
                                <div className="border-t pt-3 flex justify-between items-center font-medium">
                                    <span className="text-gray-900">Total:</span>
                                    <span className="text-gray-900">KE {transactionSummary.kesAmount.toFixed(2)}</span>
                                </div>
                            </div>

                            <button
                                onClick={parseFloat(amount) >= 20 ? handleApproveToken : undefined}
                                disabled={isApproving || transactionSummary.totalUSDC <= 0}
                                type="button"
                                className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-red-600 text-white rounded-full font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {isApproving ? "Approving..." : "Confirm payment"}
                            </button>

                            <div className="mt-4 bg-gray-100 p-3 rounded-lg">
                                <div className="text-gray-500 mb-1">
                                    Balance after transaction
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Remaining Balance</span>
                                    <span className="text-gray-600">KE {transactionSummary.totalKESBalance.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">USDC Balance</span>
                                    <span className="text-gray-600">USDC {transactionSummary.remainingBalance.toFixed(6)}</span>
                                </div>
                            </div>

                            <div className="mt-3 text-sm text-gray-500">
                                We&apos;ll use your available balance when you shop online or
                                send money for goods and services. If you don&apos;t have enough
                                money in your balance, we&apos;ll ask you to pick another wallet
                                at checkout.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SendCryptoModal;