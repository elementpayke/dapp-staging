"use client";
import React, { useState, useEffect } from "react";

interface LoanRequestModalProps {
    show: boolean;
    onClose: () => void;
}

export default function LoanRequestModal({ show, onClose }: LoanRequestModalProps) {
    if (!show) return null;

    const [loanAmount, setLoanAmount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [loanTerm, setLoanTerm] = useState<number>(30); // Default to 30 days
    const [interestRate, setInterestRate] = useState<number>(3.4);
    const loanLimit = 100.0;

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const handleLoanRequest = () => {
        if (loanAmount <= 0 || loanAmount > loanLimit) return;

        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            alert("Loan request submitted successfully!");
        }, 2000);
    };

    const handleLoanAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value) && value >= 0) {
            setLoanAmount(value);
        }
    };

    return (
        <div 
            className="fixed left-0 top-0 inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-3xl w-full max-w-3xl"
                style={{ border: "4px solid #E5E7EB" }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="gap-6 mt-4 w-full flex justify-between">
                    {/* Left - Loan Input Form */}
                    <div className="p-4 w-2/3 space-y-5">
                        <div className="flex justify-between items-center border-b pb-3 mb-3">
                            <h2 className="text-lg font-semibold text-gray-600">Request Loan</h2>
                        </div>

                        <label className="text-gray-500 text-sm">Loan amount (USDC)</label>
                        <div className="relative mt-2">
                            <input
                                value={loanAmount}
                                onChange={(e) => setLoanAmount(Number(e.target.value))}
                                className="w-full border rounded-full text-sm px-4 py-2 text-gray-800 bg-gray-100 hover:border-gray-400 focus:border-gray-400 focus:outline-none"
                            />
                            <span className="absolute right-4 top-2 text-sm text-gray-600">USDC</span>
                        </div>
                        <p className="text-orange-500 text-sm mt-2">Your loan limit is USDC 100.00</p>

                        <div>
                            <label className="text-gray-600 text-sm mt-4 block">Loan term</label>
                            <select 
                                className="w-full border rounded-full px-4 py-2 text-gray-800 text-sm mt-2"
                                value={loanTerm}
                                onChange={(e) => setLoanTerm(Number(e.target.value))}
                            >
                                <option value={30}>30 days</option>
                                <option value={60}>60 days</option>
                                <option value={90}>90 days</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-gray-600 text-sm mt-4 block">Interest rate</label>
                            <div className="w-full border rounded-ful px-4 py-2 text-gray-800 text-sm mt-2">
                                3.4% APR
                            </div>
                        </div>

                        <p className="text-gray-400 py-3">Find out how your interest rates are generated</p>
                    </div>

                    {/* Right - Loan Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg w-[40%]">
                        <h3 className="text-gray-800 font-semibold mb-2">Loan summary</h3>
                        <div className="text-sm text-gray-600 space-y-3">
                            <p className="flex justify-between"><span>Loan amount</span> <span className="text-green-500">{loanAmount.toFixed(2)} USDC</span></p>
                            <p className="flex justify-between"><span>Interest rate</span> <span className="text-orange-500">3.4% APR</span></p>
                            <p className="flex justify-between"><span>Collateral fee</span> <span className="text-blue-500">1.5%</span></p>
                            <p className="flex justify-between"><span>Loan duration</span> <span>{loanTerm}  days</span></p>
                            <hr className="my-2" />
                            <p className="flex justify-between font-semibold"><span>You will get</span> <span>{(loanAmount * 0.985).toFixed(2)} USDC</span></p>
                        </div>

                        <button 
                            className={`w-full bg-gradient-to-r from-blue-600 to-red-500 text-white font-semibold py-2 rounded-full mt-4 flex justify-center items-center ${
                                (loanAmount <= 0 || loanAmount > loanLimit) ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            onClick={handleLoanRequest}
                            disabled={loading || loanAmount <= 0 || loanAmount > loanLimit}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                    </svg>
                                    Processing...
                                </div>
                            ) : (
                                "Request Loan"
                            )}
                        </button>

                        <div className="bg-gray-200 p-3 mt-4 rounded-lg text-sm">
                            <p className="text-gray-700">Your total savings</p>
                            <p className="font-semibold text-gray-800 text-md">USDC 34.12</p>
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
