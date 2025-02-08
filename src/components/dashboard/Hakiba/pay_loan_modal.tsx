"use client";
import React, { useState } from "react";

interface PayLoanModalProps {
    show: boolean;
    onClose: () => void;
}

export default function PayLoanModal({ show, onClose }: PayLoanModalProps) {
    if (!show) return null;

    const [paymentOption, setPaymentOption] = useState("full");
    const [amountOwed, setAmountOwed] = useState(12.98);
    const [usdcBalance, setUsdcBalance] = useState(234.89);
    const [loading, setLoading] = useState(false);

    const handlePayment = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            alert("Payment successful!");
        }, 2000);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4 sm:p-0" onClick={onClose}>
            <div 
                className="bg-white rounded-3xl w-full max-w-md sm:max-w-lg md:max-w-3xl p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Left Section */}
                    <div className="w-full md:w-2/3 space-y-5">
                        <div className="border-b w-full pb-2">
                            <h2 className="text-lg font-semibold text-gray-700">Pay Loan</h2>
                        </div>

                        <div className="flex flex-col items-center justify-center space-y-5 text-gray-600">
                            <p className="text-gray-600">You owe</p>
                            <h1 className="text-3xl text-gray-800">{amountOwed} <span className="text-sm">USDC</span></h1>
                            
                            <div className="flex flex-col sm:flex-row gap-4">
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="radio"
                                        checked={paymentOption === "full"}
                                        onChange={() => setPaymentOption("full")}
                                    />
                                    Pay entire loan
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="radio"
                                        checked={paymentOption === "partial"}
                                        onChange={() => setPaymentOption("partial")}
                                    />
                                    Make partial payments
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="text-gray-600 block mb-1 text-sm">Select your network</label>
                            <select className="w-full border rounded-lg px-4 py-2 text-gray-800 text-sm">
                                <option>Base</option>
                                <option>Ethereum</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-gray-600 block mb-1 text-sm">Select your wallet</label>
                            <select className="w-full border rounded-lg px-4 py-2 text-gray-800 text-sm">
                                <option>Metamask</option>
                                <option>Trust Wallet</option>
                            </select>
                        </div>
                    </div>

                    {/* Right Section - Summary */}
                    <div className="bg-gray-100 px-4 py-4 rounded-lg w-full md:w-[40%] border-l md:border-l md:border-t-0 border-t">
                        <h3 className="text-gray-800 font-semibold mb-2 text-sm sm:text-base">Transaction summary</h3>
                        <div className="text-xs sm:text-sm text-gray-600 space-y-3">
                            <p className="flex justify-between"><span>USDC Balance</span> <span className="text-green-500">{usdcBalance.toFixed(2)} USDC</span></p>
                            <p className="flex justify-between"><span>Amount to send</span> <span className="text-black">{amountOwed.toFixed(2)} USDC</span></p>
                            <hr className="my-2" />
                            <p className="flex justify-between font-semibold"><span>Balance after transaction</span> <span>{(usdcBalance - amountOwed).toFixed(2)} USDC</span></p>
                        </div>

                        <button 
                            className="w-full bg-gradient-to-r from-blue-600 to-red-500 text-white font-semibold py-2 rounded-full mt-4 flex justify-center items-center text-sm"
                            onClick={handlePayment}
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin h-5 w-5 border-t-2 border-white rounded-full"></div>
                                    Processing...
                                </div>
                            ) : (
                                "Confirm Payment"
                            )}
                        </button>

                        <div className="bg-gray-200 p-3 mt-4 rounded-lg text-xs sm:text-sm">
                            <p className="text-gray-700">Crypto Balance after transaction</p>
                            <p className="font-semibold text-gray-800 text-lg">{(usdcBalance - amountOwed).toFixed(2)} USDC</p>
                        </div>

                        <p className="text-xs text-gray-500 mt-3">
                            Your credit score is based on your savings balance and your recent loan repayment history and is not subject to manipulation.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
