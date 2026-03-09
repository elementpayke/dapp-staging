"use client";
import { Copy, CheckCircle, XCircle, ExternalLink, X } from 'lucide-react';
import { useState, FC } from 'react';
import { useModalOverlay } from '@/hooks/useModalOverlay';
import { SupportedToken } from '@/constants/supportedTokens';
import { motion, AnimatePresence } from 'framer-motion';

interface DepositCryptoReceiptProps {
    isOpen: boolean;
    onClose: () => void;
    selectedToken: SupportedToken;
    transactionReciept: {
        status: string;
        reason?: string;
        amount: number;
        amountCrypto: number;
        address: string;
        phoneNumber: string;
        transactionHash: string;
    };
}

// ── Detail Row Component ─────────────────────────────────────────────────────
interface DetailRowProps {
    label: string;
    value: string;
    copyable?: boolean;
    fullValue?: string;
    accent?: boolean;
}

const DetailRow: FC<DetailRowProps> = ({ label, value, copyable, fullValue, accent }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(fullValue || value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex items-center justify-between py-1">
            <span className="text-sm font-medium text-[var(--ep-muted)] whitespace-nowrap mr-4">{label}</span>
            <div className="flex items-center gap-2 min-w-0 justify-end">
                <span className={`text-[13px] font-semibold text-right truncate ${accent ? 'text-[var(--ep-accent)]' : 'text-[var(--ep-heading)]'}`}>
                    {value}
                </span>
                {copyable && (
                    <button
                        onClick={handleCopy}
                        className="p-1 hover:bg-[var(--ep-accent-subtle)] rounded transition flex-shrink-0"
                        title="Copy"
                    >
                        {copied ? (
                            <CheckCircle size={14} className="text-green-500" />
                        ) : (
                            <Copy size={14} className="text-[var(--ep-muted)] hover:text-[var(--ep-accent)]" />
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

export default function DepositCryptoReceipt({ isOpen, onClose, selectedToken, transactionReciept }: DepositCryptoReceiptProps) {
    // Hide dropdowns when modal is open
    useModalOverlay(isOpen);
    
    if (!isOpen) return null;

    const isSuccessful = () => {
        const status = transactionReciept?.status;
        return status === "settled" || status === "complete" || status === "completed";
    };

    const displayAddress = (address: string | { address: string } | null | undefined) => {
        if (!address) return '';
        if (typeof address === 'object' && address.address) {
            return `${address.address.slice(0, 10)}...${address.address.slice(-6)}`;
        }
        return `${String(address).slice(0, 10)}...${String(address).slice(-6)}`;
    };

    const fullAddress = (address: string | { address: string } | null | undefined) => {
        if (!address) return '';
        if (typeof address === 'object' && address.address) return address.address;
        return String(address);
    };

    const success = isSuccessful();
    const statusInfo = success
        ? {
            icon: <CheckCircle className="w-6 h-6" />,
            color: "text-green-600 dark:text-green-400",
            bgColor: "bg-green-100 dark:bg-green-500/10",
            borderColor: "border-green-200 dark:border-green-500/20",
            label: "Success",
        }
        : {
            icon: <XCircle className="w-6 h-6" />,
            color: "text-red-600 dark:text-red-400",
            bgColor: "bg-red-100 dark:bg-red-500/10",
            borderColor: "border-red-200 dark:border-red-500/20",
            label: "Failed",
        };

    const explorerName = selectedToken.chain === 'Base' ? 'Basescan' :
        selectedToken.chain === 'Lisk' ? 'Lisk Explorer' :
        selectedToken.chain === 'Scroll' ? 'Scrollscan' :
        selectedToken.chain === 'Arbitrum' ? 'Arbiscan' :
        `${selectedToken.chain} Explorer`;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-overlay flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) onClose();
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 40, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: 40, opacity: 0 }}
                        transition={{ type: "spring", damping: 28, stiffness: 320 }}
                        className="bg-[var(--ep-bg-card)] w-full max-w-[420px] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-[var(--ep-border)] max-h-[92vh] sm:max-h-[85vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Top action bar */}
                        <div className="flex justify-between items-center p-4 pb-0">
                            {selectedToken?.chainLogo ? (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--ep-accent-subtle)] rounded-full shadow-sm border border-[var(--ep-border)]/50">
                                    <img src={selectedToken.chainLogo} alt={selectedToken.chain} className="w-5 h-5 object-contain rounded-full bg-white shadow-sm" />
                                    <span className="text-sm font-semibold text-[var(--ep-heading)]">{selectedToken.chain}</span>
                                </div>
                            ) : (
                                <div />
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 bg-[var(--ep-accent-subtle)] text-[var(--ep-muted)] hover:text-[var(--ep-heading)] rounded-full transition-colors ml-auto"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Receipt Header */}
                        <div className="flex flex-col items-center px-6 pt-2 pb-6">
                            <div className={`p-3 rounded-full mb-3 ${statusInfo.bgColor} ${statusInfo.color}`}>
                                {statusInfo.icon}
                            </div>

                            <div className="text-[var(--ep-muted)] text-sm mb-1 font-medium">
                                {success ? 'Deposit to' : 'Deposit failed'}
                            </div>

                            {transactionReciept?.address && (
                                <div className="text-lg font-bold text-[var(--ep-accent)] text-center tracking-tight leading-tight w-full max-w-[85%] truncate mb-2"
                                    title={fullAddress(transactionReciept.address)}
                                >
                                    {displayAddress(transactionReciept.address)}
                                </div>
                            )}

                            {/* Amount */}
                            <div className="text-3xl font-extrabold text-[var(--ep-heading)] tracking-tight">
                                +KES {transactionReciept.amount.toFixed(2)}
                            </div>
                            <div className="text-sm text-[var(--ep-muted)] mt-1 font-medium">
                                ≈ {selectedToken.symbol} {transactionReciept.amountCrypto.toFixed(6)}
                            </div>

                            <div className={`mt-3 px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full border ${statusInfo.color} ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
                                {statusInfo.label}
                            </div>
                        </div>

                        {/* Receipt divider */}
                        <div className="relative w-full overflow-hidden flex justify-center">
                            <div className="absolute inset-y-1/2 left-0 w-3 h-6 bg-black/60 rounded-r-full sm:hidden -translate-y-1/2" />
                            <div className="w-full mx-6 border-t-[1.5px] border-dashed border-[var(--ep-border)]" />
                            <div className="absolute inset-y-1/2 right-0 w-3 h-6 bg-black/60 rounded-l-full sm:hidden -translate-y-1/2" />
                        </div>

                        {/* Body — detail rows */}
                        <div className="px-6 py-6 pb-4 space-y-0.5 flex-1 overflow-y-auto custom-scrollbar">
                            <div className="flex flex-col gap-3.5">
                                <DetailRow
                                    label="Deposit Address"
                                    value={displayAddress(transactionReciept.address)}
                                    fullValue={fullAddress(transactionReciept.address)}
                                    copyable
                                />

                                <DetailRow
                                    label="From"
                                    value={transactionReciept?.phoneNumber || "Not available"}
                                />

                                <DetailRow
                                    label="Token"
                                    value={`${selectedToken.symbol} (${selectedToken.chain})`}
                                />

                                <DetailRow
                                    label="Crypto Amount"
                                    value={`${transactionReciept.amountCrypto.toFixed(6)} ${selectedToken.symbol}`}
                                />

                                {!success && transactionReciept?.reason && (
                                    <div className="flex flex-col gap-1 py-1">
                                        <span className="text-sm font-medium text-[var(--ep-muted)]">Reason</span>
                                        <span className="text-[13px] font-semibold text-red-500 dark:text-red-400 leading-relaxed">
                                            {transactionReciept.reason}
                                        </span>
                                    </div>
                                )}

                                {transactionReciept?.transactionHash && (
                                    <DetailRow
                                        label="Tx Hash"
                                        value={`${transactionReciept.transactionHash.substring(0, 8)}...${transactionReciept.transactionHash.slice(-8)}`}
                                        fullValue={transactionReciept.transactionHash}
                                        copyable
                                    />
                                )}

                                {!transactionReciept?.transactionHash && (
                                    <DetailRow
                                        label="Tx Hash"
                                        value="Settlement pending"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Footer actions */}
                        <div className="p-4 border-t border-[var(--ep-border)] bg-[var(--ep-bg)] space-y-2.5">
                            {transactionReciept?.transactionHash && (
                                <a
                                    href={`${selectedToken.explorerUrl}/tx/0x${transactionReciept.transactionHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--ep-accent)] text-white rounded-xl hover:opacity-90 transition-opacity font-medium shadow-sm"
                                >
                                    <ExternalLink size={18} />
                                    View on {explorerName}
                                </a>
                            )}
                            <button
                                onClick={onClose}
                                className={`w-full px-4 py-3 text-sm font-medium rounded-xl transition-opacity ${
                                    transactionReciept?.transactionHash
                                        ? 'bg-[var(--ep-bg-input)] text-[var(--ep-heading)] border border-[var(--ep-border)] hover:opacity-80'
                                        : 'bg-[var(--ep-accent)] text-white hover:opacity-90 shadow-sm'
                                }`}
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}