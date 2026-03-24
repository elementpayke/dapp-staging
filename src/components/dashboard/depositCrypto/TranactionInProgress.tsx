"use client";
import { useEffect, useState } from 'react';
import { useModalOverlay } from '@/hooks/useModalOverlay';
import { X, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
        return mins > 0 ? `${mins}m ${secs.toString().padStart(2, '0')}s` : `${secs}s`;
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
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-overlay flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 40, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: 40, opacity: 0 }}
                        transition={{ type: "spring", damping: 28, stiffness: 320 }}
                        className="bg-[var(--ep-bg-card)] w-full max-w-[420px] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-[var(--ep-border)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Top bar */}
                        <div className="flex justify-between items-center p-4 pb-0">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--ep-accent-subtle)] rounded-full shadow-sm border border-[var(--ep-border)]/50">
                                <Smartphone size={16} className="text-[var(--ep-accent)]" />
                                <span className="text-sm font-semibold text-[var(--ep-heading)]">M-PESA</span>
                            </div>
                            <button
                                onClick={handleCloseClick}
                                className="p-2 bg-[var(--ep-accent-subtle)] text-[var(--ep-muted)] hover:text-[var(--ep-heading)] rounded-full transition-colors"
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <AnimatePresence mode="wait">
                            {showCloseConfirm ? (
                                <motion.div
                                    key="confirm"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex flex-col items-center px-6 py-8 gap-5"
                                >
                                    <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-500/10">
                                        <Smartphone size={28} className="text-orange-500" />
                                    </div>
                                    <p className="text-sm text-center text-[var(--ep-muted)] leading-relaxed max-w-[280px]">
                                        Are you sure you want to close? Your transaction may still be processing.
                                    </p>
                                    <div className="flex gap-3 w-full">
                                        <button
                                            onClick={handleCancelClose}
                                            className="flex-1 px-4 py-3 text-sm font-medium bg-[var(--ep-bg-input)] text-[var(--ep-heading)] rounded-xl hover:opacity-80 transition-opacity border border-[var(--ep-border)]"
                                        >
                                            Keep Waiting
                                        </button>
                                        <button
                                            onClick={handleConfirmClose}
                                            className="flex-1 px-4 py-3 text-sm font-medium bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors shadow-sm"
                                        >
                                            Close Anyway
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="progress"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex flex-col items-center px-6 pt-4 pb-8"
                                >
                                    {/* Spinner */}
                                    <div className="relative w-16 h-16 mb-5">
                                        <div className="absolute inset-0 rounded-full border-[3px] border-[var(--ep-border)]" />
                                        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[var(--ep-accent)] animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Smartphone size={20} className="text-[var(--ep-accent)]" />
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-lg font-bold text-[var(--ep-heading)] mb-1">
                                        Confirm on your phone
                                    </h3>
                                    <p className="text-sm text-[var(--ep-muted)] text-center max-w-[300px] leading-relaxed mb-5">
                                        We&apos;ve sent an STK push to{' '}
                                        <span className="font-semibold text-[var(--ep-heading)]">
                                            {getPhoneNumberLastAndFirstFourDigits(phone_number)}
                                        </span>
                                        . Enter your M-PESA PIN to complete the payment.
                                    </p>

                                    {/* Receipt divider */}
                                    <div className="relative w-full overflow-hidden flex justify-center mb-5">
                                        <div className="absolute inset-y-1/2 left-0 w-3 h-6 bg-black/60 rounded-r-full sm:hidden -translate-y-1/2" />
                                        <div className="w-full border-t-[1.5px] border-dashed border-[var(--ep-border)]" />
                                        <div className="absolute inset-y-1/2 right-0 w-3 h-6 bg-black/60 rounded-l-full sm:hidden -translate-y-1/2" />
                                    </div>

                                    {/* Elapsed time pill */}
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--ep-bg-input)] border border-[var(--ep-border)]">
                                        <div className="w-2 h-2 rounded-full bg-[var(--ep-accent)] animate-pulse" />
                                        <span className="text-sm font-medium text-[var(--ep-muted)]">
                                            Waiting&ensp;
                                        </span>
                                        <span className="text-sm font-bold text-[var(--ep-heading)] tabular-nums">
                                            {formatElapsedTime(elapsedSeconds)}
                                        </span>
                                    </div>

                                    {/* Timeout warning */}
                                    {elapsedSeconds >= 60 && (
                                        <motion.p
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-4 text-xs text-center text-orange-500 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-xl px-4 py-2.5 leading-relaxed"
                                        >
                                            Taking longer than expected. You can close this and check your M-Pesa for confirmation.
                                        </motion.p>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
