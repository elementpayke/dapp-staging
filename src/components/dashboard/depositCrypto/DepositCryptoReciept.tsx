"use client";
import { CopyIcon, CheckCircle, CircleAlert } from 'lucide-react';
import { useState } from 'react';

interface DepositCryptoReceiptProps {
    isOpen: boolean;
    onClose: () => void;
    transactionReciept: {
        status: string;
        reason?: string;
        amount: number;
        amountUSDC: number;
        address: string;
        phoneNumber: string;
        transactionHash: string;
    };
}

export default function DepositCryptoReceipt({ isOpen, onClose, transactionReciept }: DepositCryptoReceiptProps) {
    if (!isOpen) return null; // Ensure modal is only rendered when open

    console.log("Receipt modal opened with data:", transactionReciept);
    
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const textToCopy = transactionReciept?.transactionHash || "";
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Function to determine if transaction was successful based on status
    const isSuccessful = () => {
        const status = transactionReciept?.status;
        return status === "settled" || status === "complete" || status === "completed";
    };

    // shrink address 
    const displayAddress = (address: string | { address: string } | null | undefined) => {
        if (!address) return '';
        if (typeof address === 'object' && address.address) {
            return `${address.address.slice(0, 10)}...${address.address.slice(-6)}`;
        }
        return `${String(address).slice(0, 10)}...${String(address).slice(-6)}`;
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={(e) => {
                // Only close if clicking the backdrop
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-lg border border-[#A3A5C2] lg:w-[638px] space-y-4"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
            >
                {/* Tick Icon */}
                <div className="flex flex-col items-center space-y-2">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full">
                        {!isSuccessful() ?
                            <CircleAlert className="h-20 w-20 text-red-600" />
                            :
                            <CheckCircle className="h-20 w-20 text-green-600" />
                        }
                    </div>
                    <p className={`text-xl font-semibold ${!isSuccessful() ? "text-red-600" : "text-green-600"}`}
                    >Deposit {!isSuccessful() ? "Failed" : "Successful"}</p>
                </div>

                <div className="flex justify-center items-center py-[30px]">
                    <p className="text-[#02542D] text-md font-bold">{`${transactionReciept?.amount || 0} USD ≈ KES ${transactionReciept?.amountUSDC || 0}`}</p>
                </div>

                <div className="flex w-full justify-between items-center">
                    <p className="text-lg text-[#767676] font-semibold">Deposit address</p>
                    <p className="text-lg text-[#1E1E1E] font-semibold">
                        {displayAddress(transactionReciept?.address)}
                    </p>
                </div>

                <div className="flex w-full justify-between items-center">
                    <p className="text-lg text-[#767676] font-semibold">From</p>
                    <p className="text-lg text-[#1E1E1E] font-semibold"> {transactionReciept?.phoneNumber || "Not available"} </p>
                </div>

                <div className="flex w-full justify-between items-center">
                    <p className="text-lg text-[#767676] font-semibold">Status</p>
                    <p className="text-sm text-[#1E1E1E] font-semibold">
                        <span className={`px-5 py-1 px-2 rounded-full
                            ${!isSuccessful() ? "text-red-700 bg-red-400" : "text-[#077A3D] bg-green-400"}`}>
                            {isSuccessful() ? "Success" : "Failed"}
                        </span>
                    </p>
                </div> 

                {/* Add reason display */}
                {!isSuccessful() && transactionReciept?.reason && (
                    <div className="flex w-full justify-between items-center">
                        <p className="text-lg text-[#767676] font-semibold">Reason</p>
                        <p className="text-sm text-red-600 font-semibold">
                            {transactionReciept.reason}
                        </p>
                    </div>
                )}

                <div className="flex w-full justify-between items-center">
                    <p className="text-lg text-[#767676] font-semibold">Transaction Hash</p>
                    <div className="flex items-center space-x-2">
                        <button onClick={handleCopy} className="flex items-center space-x-1 cursor-pointer">
                            <CopyIcon className="h-4 w-4 text-[#1E1E1E]" />
                        </button>
                        <div className="flex items-center space-x-2">
                            <p className="text-md text-[#1E1E1E] font-semibold truncate max-w-[250px]">
                                {transactionReciept?.transactionHash || "Processing..."}
                            </p>
                            {transactionReciept?.transactionHash && (
                                <a 
                                    href={`https://sepolia.basescan.org/tx/0x${transactionReciept.transactionHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                                >
                                    <span>View on Basescan</span>
                                    <svg 
                                        className="w-4 h-4 ml-1" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth="2" 
                                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                        />
                                    </svg>
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {copied && <p className="text-green-600 text-sm mt-2">Copied to clipboard!</p>}
                
                <button
                    onClick={onClose}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    );
}