"use client";
import { useEffect, useState } from 'react';
import { useModalOverlay } from '@/hooks/useModalOverlay';
import { X } from 'lucide-react';

interface TransactionInProgressModalProps {
    isOpen: boolean;
    onClose: () => void;
    phone_number: string;   
}

export default function TransactionInProgressModal({ isOpen, onClose, phone_number }: TransactionInProgressModalProps) {
    // Hide dropdowns when modal is open
    useModalOverlay(isOpen);
    
    // Track elapsed time
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    
    // Reset timer when modal opens
    useEffect(() => {
        if (isOpen) {
            setElapsedSeconds(0);
            setShowCloseConfirm(false);
        }
    }, [isOpen]);
    
    // Count elapsed time
    useEffect(() => {
        if (!isOpen) return;
        
        const interval = setInterval(() => {
            setElapsedSeconds(prev => prev + 1);
        }, 1000);
        
        return () => clearInterval(interval);
    }, [isOpen]);
    
    if (!isOpen) return null;

    const getPhoneNumberLastAndFirstFourDigits = (phone_number: string) => {
        const lastFourDigits = phone_number.slice(-2);
        const firstFourDigits = phone_number.slice(0, 2);
        return `${firstFourDigits}******${lastFourDigits}`;
    };
    
    const formatElapsedTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };
    
    const handleCloseClick = () => {
        setShowCloseConfirm(true);
    };
    
    const handleConfirmClose = () => {
        setShowCloseConfirm(false);
        onClose();
    };
    
    const handleCancelClose = () => {
        setShowCloseConfirm(false);
    };

    return (
        <div 
            className="fixed inset-0 z-overlay flex items-center justify-center bg-black bg-opacity-50"
        >
            <div 
                className="relative flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-[#A3A5C2] dark:border-gray-700 max-w-sm"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={handleCloseClick}
                    className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    aria-label="Close"
                >
                    <X size={20} />
                </button>
                
                {showCloseConfirm ? (
                    <div className="flex flex-col items-center space-y-4">
                        <p className="text-md text-center text-gray-700 dark:text-gray-300">
                            Are you sure you want to close? Your transaction may still be processing.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleCancelClose}
                                className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Keep Waiting
                            </button>
                            <button
                                onClick={handleConfirmClose}
                                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                                Close Anyway
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center space-y-4">
                        {/* Preloader */}
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-2 text-md text-center text-gray-600 dark:text-gray-300">
                            We have sent an STK push to your phone number {getPhoneNumberLastAndFirstFourDigits(phone_number)}. Enter your M-PESA PIN to finish the process.
                        </p>
                        
                        {/* Elapsed time */}
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                            Waiting: {formatElapsedTime(elapsedSeconds)}
                        </p>
                        
                        {/* Timeout warning */}
                        {elapsedSeconds >= 60 && (
                            <p className="text-sm text-orange-500 text-center">
                                Taking longer than expected. You can close this and check your M-Pesa for confirmation.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
