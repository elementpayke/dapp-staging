import React, {useEffect, useMemo, useState, useCallback } from "react";
import { CheckCircle, X, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import { parseUnits } from 'ethers';
import { getUSDCAddress } from '../../../services/tokens';
import { useContract } from "@/services/useContract";
import { encryptMessage } from "@/services/encryption";
import { useWallet } from "@/context/WalletContext";
import { useAccount } from "wagmi";
import { useContractEvents, useContractHandleOrderStatus } from "@/context/useContractEvents";
import TransactionInProgressModal from "./TranactionInProgress";
import DepositCryptoReceipt from "./DepositCryptoReciept";

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
    const [isDepositCryptoReceipt, setDepositCryptoReceipt] = useState(false);
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
    const { handleOrderStatus, isProcessing } = useContractHandleOrderStatus();
    const { contract, address } = useContract();
    const addressOwner = useAccount();
    const [formValidation, setFormValidation] = useState({
        amount: false,
        phoneNumber: false,
    });

    const MARKUP_PERCENTAGE = 1.5;

    const transactionSummary = useMemo(() => {
        if (!exchangeRate) return { kesAmount: 0, usdcAmount: 0, transactionCharge: 0, totalUSDC: 0, totalKES: 0, totalKESBalance: 0, walletBalance: 0, remainingBalance: 0, usdcBalance: 0 };

        const kesAmount = parseFloat(amount) * exchangeRate || 0;
        const usdcAmount = parseFloat(amount) || 0;
        const transactionCharge = usdcAmount * TRANSACTION_FEE_RATE;
        const totalUSDC = usdcAmount;
        const remainingBalance = usdcBalance + totalUSDC;
        const totalKES = usdcBalance * exchangeRate;
        const totalKESBalance = totalKES + kesAmount;

        return {
            kesAmount,
            usdcAmount,
            transactionCharge,
            totalUSDC,
            totalKES,
            totalKESBalance,
            walletBalance: parseFloat(amount) || 0,
            remainingBalance: Math.max(remainingBalance, 0),
            usdcBalance,
        };
    }, [amount, exchangeRate, usdcBalance]);

    const [transactionReceipt, setTransactionReceipt] = useState<any | null>({
        amount: amount || "0.00",
        amountUSDC: Number(amount) * (exchangeRate ?? 1) || 0,
        phoneNumber: phoneNumber || "",
        address: addressOwner || "",
        status: 0,
        transactionHash: "",
    });

    const handleClose = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const walletOptions: WalletOption[] = [
        { id: "metamask", icon: "🦊", selected: selectedWallet === "metamask" },
        { id: "coinbase", icon: "©️", selected: selectedWallet === "coinbase" },
        { id: "qr", icon: "🔲", selected: selectedWallet === "qr" },
    ];

    const fetchExchangeRate = async () => {
        try {
            const response = await fetch("https://api.coinbase.com/v2/exchange-rates?currency=USDC");
            const data = await response.json();

            if (data?.data?.rates?.KES) {
                const baseRate = parseFloat(data.data.rates.KES);
                const markupRate = baseRate * (1 - MARKUP_PERCENTAGE / 100);
                setExchangeRate(markupRate);
            } else {
                setExchangeRate(null);
            }
        } catch {
            setExchangeRate(null);
        }
    };

    useContractEvents(
        (order: any) => setOrderCreatedEvents((prev) => [...prev, order]),
        () => {
            setTransactionReceipt((prev: any) => ({ ...prev, status: 1 }));
            setDepositCryptoReceipt(true);
            setIsLoading(false);
            setIsTransactionModalOpen(false);
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
        if (parseFloat(amount) <= 0) return toast.error("Amount must be greater than zero.");

        setIsLoading(true);
        const orderType = depositFrom === "MPESA" ? 0 : 1;
        const usdcTokenAddress = getUSDCAddress() as `0x${string}`;
        const mpesaAmount = parseFloat(amount) * (exchangeRate ?? 1);

        try {
            const messageHash = encryptMessage(phoneNumber, "USD", exchangeRate ?? 0, mpesaAmount);
            if (!contract) throw new Error("Contract is not initialized.");
            
            await contract.createOrder(
                address, 
                parseUnits(amount, 6), 
                usdcTokenAddress, 
                orderType, 
                messageHash
            );
            setIsTransactionModalOpen(true);
        } catch {
            toast.error("Transaction failed.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmOrderStatus = useCallback(async () => {
        if (orderCreatedEvents.length === 0 || isProcessing) return;
        try {
            await handleOrderStatus(
                orderCreatedEvents[0].orderId, 
                setIsTransactionModalOpen, 
                setDepositCryptoReceipt, 
                transactionReceipt
            );
            setTransactionReceipt((prev: any) => ({ 
                ...prev, 
                amount, 
                amountUSDC: parseFloat(amount) * (exchangeRate ?? 1), 
                phoneNumber 
            }));
        } catch {
            toast.error("Error processing order status");
        }
    }, [orderCreatedEvents, isProcessing, handleOrderStatus, transactionReceipt, amount, exchangeRate, phoneNumber]);

    useEffect(() => {
        if (orderCreatedEvents.length > 0 && !isProcessing) {
            handleConfirmOrderStatus();
        }
    }, [orderCreatedEvents, isProcessing, handleConfirmOrderStatus]);

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
                isOpen={isDepositCryptoReceipt}
                onClose={() => setDepositCryptoReceipt(false)}
                transactionReciept={transactionReceipt} // Corrected the prop name
            />
            <div className="bg-white md:rounded-3xl max-w-4xl md:h-auto h-screen overflow-y-auto">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                       <div className="flex items-center gap-4">
                        <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors block md-hidden"
                                type="button"
                            >
                                <ArrowLeft className="w-6 h-6 text-[#444]" />
                            </button>
                            <h2 className="text-2xl font-semibold text-gray-900">
                                Deposit Crypto
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors hidden md:block "
                            type="button"
                        >
                            <X className="w-6 h-6 text-[#444]" />
                        </button>
                    </div>

                    <div className="grid md:grid-cols-5 gap-6">
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        placeholder="0.00"
                                        onChange={(e) => {
                                            const newAmount = parseFloat(e.target.value);
                                            if (!isNaN(newAmount) && newAmount >= 0 && newAmount <= 1000) {
                                                setAmount(e.target.value);
                                            } else if (e.target.value === "") {
                                                setAmount("");
                                            }
                                        }}
                                        className={`w-full p-3 bg-gray-50 rounded-lg border-0 text-gray-900 ${formValidation.amount ? "border-red-500" : "" }`}
                                    />
                                </div>
                            </div>

                            {/* Deposit From and Phone Number */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                            <p className="text-gray-500 flex gap-2 item-center text-sm md:text-md">
                                <CheckCircle className="w-6 h-6 text-blue-600 inline-block" />
                                <span>Favorite this payment details for future transactions</span>
                            </p>
                        </div>

                        {/* Right Column - Transaction Summary */}
                        <div className="col-span-3 md:col-span-2 bg-gray-50 p-4 rounded-2xl h-fit">
                            <h3 className="text-xl font-semibold mb-4 text-gray-900 hidden md:block hidden md:block">
                                Transaction summary
                            </h3>
                            <div className="space-y-3 hidden md:block">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">KES Equivalent</span>
                                    <span className="text-gray-900">
                                        KES {transactionSummary.kesAmount.toFixed(1)}0
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
                                <div className="flex justify-between items-center border-t pt-3">
                                    <span className="text-gray-600">Wallet balance</span>
                                    <span className="text-green-600 font-medium">
                                        {/* TODO: Get USDC balance (reference offramp modal)*/}
                                        USDC {transactionSummary.usdcBalance.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center font-medium">
                                    <span className="text-gray-900">Total:</span>
                                    {/* Update Total calculation */}
                                    <span className="text-gray-900">KE {transactionSummary.kesAmount.toFixed(1)}0</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    if (Number(amount) > 0) {
                                        handleConfirmPayment();
                                    } else {
                                        setFormValidation({ ...formValidation, amount: true });
                                    }
                                }}
                                disabled={isLoading}
                                className={`w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-red-600 text-white rounded-full font-medium hover:opacity-90 transition-opacity ${isLoading ? "opacity-50 cursor-not-allowed" : ""
                                    }`}
                            >
                                {isLoading ? "Processing..." : "Confirm payment"}
                            </button>

                            <div className="mt-4 bg-gray-100 p-3 rounded-lg hidden md:block">
                                <div className="text-gray-500 mb-1">
                                    Crypto Balance after transaction
                                </div>
                                <div className="flex justify-between">
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