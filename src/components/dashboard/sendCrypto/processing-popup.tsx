"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toPng } from "html-to-image";
import { fetchOrderStatus } from "@/app/api/aggregator";
import generateReceiptHTML from "@/components/generateHtml";
import { useProcessingPopupStore } from "@/lib/processingPopupStore";
import { TransactionDetails } from "@/types/processing-popup";
import { formatErrorMessage, formatReceiverName } from "@/utils/helpers";
import CustomConfetti from "../processing-states/custom-confetti";
import { AnimatedStatusBackground } from "../processing-states/animated-status-background";
import ProgressPopup from "../processing-states/progress-popup";

interface ProcessingPopupProps {
  isVisible: boolean;
  onClose: () => void;
  orderId: string;
  transactionDetails: TransactionDetails;
  branding?: {
    primaryColor: string;
    logo?: string;
    companyName: string;
    footerMessage?: string;
    receiptTitle?: string;
  };
  sendReceiptEmail?: (email: string, receiptData: any) => Promise<boolean>;
}

const ProcessingPopup: React.FC<ProcessingPopupProps> = ({
  isVisible,
  onClose,
  orderId,
  transactionDetails: initialTransactionDetails,
  branding = {
    primaryColor: "#4f46e5",
    companyName: "Element Pay",
    footerMessage: "Thank you for using Element Pay for your transactions.",
    receiptTitle: "Payment Receipt",
  },
  sendReceiptEmail,
}) => {
  const {
    status,
    progress,
    statusMessage,
    showConfetti,
    emailInput,
    transactionDetails,
    fallbackDate,
    showTechnicalDetails,
    popupLocked,
    setStatus,
    setStatusMessage,
    setProgress,
    setShowConfetti,
    setCopied,
    setSendingEmail,
    setEmailSent,
    setTransactionDetails,
    setFallbackDate,
    setShowTechnicalDetails,
    setPopupLocked,
    reset,
  } = useProcessingPopupStore();

  const receiptRef = useRef<HTMLDivElement>(null);
  const [_, forceRerender] = useState(0); // Dummy state for forced rerender

  // Emergency success trigger for debugging - removed mock data
  const triggerSuccessState = () => {
    console.log("🚀 EMERGENCY SUCCESS TRIGGER ACTIVATED - This should not be used in production");
    // This is only for development debugging - real data should come from API
    console.warn("Using emergency trigger - ensure real transaction data is available");
  };

  // Log orderId changes
  useEffect(() => {
    console.log("🔄 OrderId changed to:", orderId);
    if (!orderId) {
      console.log("⚠️ Empty orderId - this might be the issue!");
    }
  }, [orderId]);

  // Prevent popup auto-closing when successful
  useEffect(() => {
    if (status === "success" && isVisible) {
      console.log("SUCCESS STATE - Locking popup to prevent auto-close");
      setPopupLocked(true);
    }
  }, [status, isVisible]);

  // Reset state when popup becomes invisible (but only if not locked)
  useEffect(() => {
    if (!isVisible && !popupLocked) {
      console.log("[RESET] Popup closed, resetting state");
      reset(initialTransactionDetails);
      setPopupLocked(false);
    }
  }, [isVisible, popupLocked]); // Removed initialTransactionDetails and reset from dependencies

  // --- SUCCESS POP-UP LOGIC ---
  // Immediate success on initialization
  useEffect(() => {
    if (!isVisible) return;
    const isAlreadySuccessful = initialTransactionDetails && (
      initialTransactionDetails.transactionHash ||
      initialTransactionDetails.receiptNumber ||
      initialTransactionDetails.status === 1 ||
      initialTransactionDetails.paymentStatus?.toLowerCase() === "settled" ||
      initialTransactionDetails.paymentStatus?.toLowerCase() === "successful" ||
      initialTransactionDetails.paymentStatus?.toLowerCase() === "completed"
    );
    if (isAlreadySuccessful) {
      setStatus("success");
      setStatusMessage("Payment successful!");
      setProgress(100);
      setShowConfetti(true);
      setPopupLocked(true);
      if (initialTransactionDetails) {
        setTransactionDetails(initialTransactionDetails);
      }
      return;
    }
  }, [isVisible, initialTransactionDetails, setStatus, setStatusMessage, setProgress, setShowConfetti, setPopupLocked, setTransactionDetails]);

  // Poll for order status - restart when orderId changes
  useEffect(() => {
    if (!isVisible || status === "success" || status === "failed") return;
    if (!orderId) return;
    if (popupLocked) return;
    let pollInterval = null;
    let isPolling = true;
    let pollAttempts = 0;
    const maxPollAttempts = 120;
    let currentProgress = 40;
    const cleanupOrderId = () => {
      if (orderId) {
        localStorage.removeItem(`order_${orderId}`);
        sessionStorage.removeItem(`order_${orderId}`);
      }
    };
    const fetchStatus = async () => {
      if (!isPolling) return true;
      pollAttempts++;
      currentProgress = Math.min(currentProgress + 1, 95);
      setProgress(currentProgress);
      if (pollAttempts >= maxPollAttempts) {
        setStatus("failed");
        setStatusMessage("Transaction is taking longer than expected. Please check your transaction status manually.");
        setProgress(100);
        cleanupOrderId();
        return true;
      }
      try {
        const response = await fetchOrderStatus(orderId);
        const orderStatus = response.data;
        if (!orderStatus) return false;
        const orderData = orderStatus.data || orderStatus;
        if (!orderData) return false;
        // --- SUCCESS CONDITIONS ---
        const hasSettlementHash = !!orderData.transaction_hashes?.settlement;
        const hasCreationHash = !!orderData.transaction_hashes?.creation;
        const hasReceiptNumber = !!orderData.receipt_number;
        const hasMpesaReceipt = !!orderData.mpesa_receipt_number;
        const hasFileId = !!orderData.file_id;
        let orderStatusValue = orderData.status;
        if (typeof orderStatusValue === "string") orderStatusValue = orderStatusValue.toLowerCase();
        const statusIsSettled = ["settled", "completed", "complete", "success", "successful", "done", "finished"].includes(orderStatusValue);
        const statusIsNumericSuccess = orderData.status === 1 || orderData.status === "1";
        const isSuccessful = (
          hasSettlementHash ||
          hasCreationHash ||
          hasReceiptNumber ||
          hasMpesaReceipt ||
          hasFileId ||
          statusIsNumericSuccess ||
          statusIsSettled ||
          orderStatusValue === "success" ||
          orderStatusValue === "successful" ||
          orderStatusValue === "1" ||
          orderStatusValue === "completed" ||
          orderStatusValue === "done" ||
          orderStatusValue === "finished"
        );
        if (isSuccessful || (pollAttempts > 10 && (hasSettlementHash || hasCreationHash || hasReceiptNumber || hasMpesaReceipt || hasFileId))) {
          setTransactionDetails({
            ...transactionDetails,
            amount: orderData.amount_fiat?.toString() || transactionDetails.amount,
            currency: orderData.currency || transactionDetails.currency,
            recipient: formatReceiverName(orderData.receiver_name) || transactionDetails.recipient,
            paymentMethod: orderData.order_type === "offramp" ? "Mobile Money" : transactionDetails.paymentMethod,
            transactionHash: orderData.transaction_hashes?.settlement || orderData.transaction_hashes?.creation || transactionDetails.transactionHash || "N/A",
            date: orderData.created_at || transactionDetails.date,
            receiptNumber: orderData.receipt_number || orderData.mpesa_receipt_number || orderData.file_id || transactionDetails.receiptNumber || "N/A",
            paymentStatus: "settled",
            status: 1,
          });
          setStatus("success");
          setStatusMessage("Payment successful!");
          setProgress(100);
          setShowConfetti(true);
          setPopupLocked(true);
          cleanupOrderId();
          if (pollInterval) clearInterval(pollInterval);
          return true;
        }
        // Failure
        const isFailed = (
          orderStatusValue === "failed" ||
          orderStatusValue === "rejected" ||
          orderStatusValue === "cancelled" ||
          orderStatusValue === "canceled" ||
          orderData.status === 2 ||
          orderData.status === "2"
        );
        if (isFailed) {
          setStatus("failed");
          setStatusMessage(formatErrorMessage(orderData.failure_reason || "Payment failed"));
          setProgress(100);
          cleanupOrderId();
          if (pollInterval) clearInterval(pollInterval);
          return true;
        }
        // Refunded
        if (orderStatusValue === "refunded" || orderData.status === 3) {
          setStatus("failed");
          setStatusMessage(orderData.failure_reason || "Payment was refunded");
          setProgress(100);
          cleanupOrderId();
          if (pollInterval) clearInterval(pollInterval);
          return true;
        }
        // Still processing
        setStatus("processing");
        setStatusMessage("Processing your payment...");
        setProgress(Math.min(currentProgress + 5, 95));
        return false;
      } catch (error) {
        if (pollAttempts >= maxPollAttempts) {
          setStatus("failed");
          setStatusMessage("Transaction is taking longer than expected. Please check your transaction history or contact support.");
          setProgress(100);
          cleanupOrderId();
          if (pollInterval) clearInterval(pollInterval);
          return true;
        }
        return false;
      }
    };
    fetchStatus().then((shouldStop) => {
      if (!shouldStop && isPolling) {
        pollInterval = setInterval(async () => {
          const shouldStopPolling = await fetchStatus();
          if (shouldStopPolling && pollInterval) {
            clearInterval(pollInterval);
          }
        }, 3000);
      }
    });
    return () => {
      isPolling = false;
      if (pollInterval) clearInterval(pollInterval);
      cleanupOrderId();
    };
  }, [isVisible, orderId, popupLocked, status, setStatus, setStatusMessage, setProgress, setShowConfetti, setTransactionDetails, transactionDetails]);

  // DEBUG: Log status and transactionDetails on every render (commented out to prevent performance issues)
  // useEffect(() => {
  //   console.log("[ProcessingPopup RENDER] status:", status, "transactionDetails:", transactionDetails);
  //   console.log("[ProcessingPopup RENDER] orderId:", orderId, "isVisible:", isVisible);
  //   console.log("[ProcessingPopup RENDER] popupLocked:", popupLocked, "progress:", progress);
  // });

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Send receipt via email
  const sendReceiptViaEmail = async () => {
    if (!emailInput || !sendReceiptEmail) return;

    setSendingEmail(true);
    try {
      const success = await sendReceiptEmail(emailInput, {
        ...transactionDetails,
        orderId,
      });

      if (success) {
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 3000);
      }
    } catch (error) {
      console.error("Error sending email:", error);
    } finally {
      setSendingEmail(false);
    }
  };

  // Download receipt as image
  const downloadReceiptAsImage = async () => {
    if (!receiptRef.current) return;

    try {
      const dataUrl = await toPng(receiptRef.current, { quality: 0.95 });
      const link = document.createElement("a");
      link.download = `Receipt-${
        transactionDetails.receiptNumber || "unknown"
      }.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Error generating receipt image:", error);
    }
  };

  // Print receipt
  const printReceipt = () => {
    if (!receiptRef.current) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print your receipt");
      return;
    }

    const receiptHTML = generateReceiptHTML(
      {
        companyName: branding.companyName,
        primaryColor: branding.primaryColor,
        receiptTitle: branding.receiptTitle,
        footerMessage: branding.footerMessage,
      },
      {
        receiptNumber: transactionDetails.receiptNumber,
        paymentStatus: transactionDetails.paymentStatus,
        date: transactionDetails.date,
        recipient: transactionDetails.recipient,
        customerName: transactionDetails.customerName,
        customerEmail: transactionDetails.customerEmail,
        paymentMethod: transactionDetails.paymentMethod,
        items: transactionDetails.items,
        transactionHash: transactionDetails.transactionHash,
        subtotal: transactionDetails.subtotal,
        tax: transactionDetails.tax,
        amount: transactionDetails.amount,
        currency: transactionDetails.currency,
      }
    );
    printWindow.document.open();
    printWindow.document.write(receiptHTML);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.print();
    };
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2147483647] backdrop-blur-sm"
          style={{ pointerEvents: "auto" }}
          onClick={(e) => {
            // Only allow closing via backdrop click if not processing
            if (status !== "processing") {
              onClose();
            }
          }}
        >
          {isVisible && process.env.NODE_ENV === "development" && (
            <button
              style={{ position: "absolute", top: 10, left: 10, zIndex: 9999, background: "#4f46e5", color: "white", padding: "6px 12px", borderRadius: 6, fontWeight: 600, border: "none", cursor: "pointer" }}
              onClick={() => {
                setStatus("success");
                setStatusMessage("Payment successful! (Debug)");
                setProgress(100);
                setShowConfetti(true);
                setPopupLocked(true);
              }}
            >
              Trigger Success (Debug)
            </button>
          )}
          {/* Custom confetti effect */}
          {showConfetti && <CustomConfetti />}

          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl p-6 max-w-[95vw] w-full md:max-w-lg min-w-[340px] shadow-xl relative overflow-hidden"
            style={{ maxHeight: "90vh", overflowY: "auto", pointerEvents: "auto" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Animated background patterns */}
            <AnimatedStatusBackground
              status={status}
              transactionDetails={transactionDetails}
              showTechnicalDetails={showTechnicalDetails}
              setShowTechnicalDetails={setShowTechnicalDetails}
              onClose={onClose}
            />
            <ProgressPopup
              onClose={onClose}
              copyToClipboard={copyToClipboard}
              printReceipt={printReceipt}
              downloadReceiptAsImage={downloadReceiptAsImage}
              sendReceiptEmail={true}
              sendReceiptViaEmail={sendReceiptViaEmail}
              branding={branding}
              receiptRef={receiptRef}
            />
            
            {/* Debug controls - only in development */}
            {process.env.NODE_ENV === "development" && status === "processing" && (
              <div className="absolute top-2 right-2 space-y-1">
                <div className="text-xs text-gray-500 bg-white/90 p-1 rounded shadow">
                  Order: {orderId || "MISSING!"}
                </div>
                <div className="text-xs text-gray-500 bg-white/90 p-1 rounded shadow">
                  Status: {status}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProcessingPopup;