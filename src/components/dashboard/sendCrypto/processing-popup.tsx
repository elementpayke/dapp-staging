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
  disableInternalPolling?: boolean; // Flag to disable ProcessingPopup's own polling
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
  disableInternalPolling = false,
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

  // Monitor transaction details changes for success state
  useEffect(() => {
    if (!isVisible || !initialTransactionDetails) return;
    
    console.log("🔍 ProcessingPopup: Checking transaction details:", JSON.stringify(initialTransactionDetails, null, 2));
    
    // Check if we have real success indicators from SendCryptoModal
    const hasRealReceiptData = (
      (initialTransactionDetails.receiptNumber && initialTransactionDetails.receiptNumber !== "N/A" && initialTransactionDetails.receiptNumber !== "") ||
      (initialTransactionDetails.transactionHash && initialTransactionDetails.transactionHash !== "N/A" && initialTransactionDetails.transactionHash !== "") ||
      (initialTransactionDetails.mpesa_receipt_number && initialTransactionDetails.mpesa_receipt_number !== "")
    );
    
    const isDefinitelySuccessful = hasRealReceiptData && (
      initialTransactionDetails.status === 1 ||
      initialTransactionDetails.paymentStatus?.toLowerCase() === "settled" ||
      initialTransactionDetails.paymentStatus?.toLowerCase() === "successful" ||
      initialTransactionDetails.paymentStatus?.toLowerCase() === "completed"
    );
    
    console.log("🔍 ProcessingPopup: Analysis:", {
      hasRealReceiptData,
      isDefinitelySuccessful,
      receiptNumber: initialTransactionDetails.receiptNumber,
      transactionHash: initialTransactionDetails.transactionHash,
      mpesa_receipt_number: initialTransactionDetails.mpesa_receipt_number,
      status: initialTransactionDetails.status,
      paymentStatus: initialTransactionDetails.paymentStatus
    });
    
    if (isDefinitelySuccessful) {
      console.log("✅ ProcessingPopup: Detected successful transaction, showing success state");
      console.log("🔍 ProcessingPopup: Current transactionDetails:", JSON.stringify(transactionDetails, null, 2));
      console.log("🔍 ProcessingPopup: Initial transactionDetails:", JSON.stringify(initialTransactionDetails, null, 2));
      
      setStatus("success");
      setStatusMessage("Payment successful!");
      setProgress(100);
      setShowConfetti(true);
      setPopupLocked(true);
      
      // Always use the initial transaction details from SendCryptoModal when successful
      // since SendCryptoModal has the most up-to-date API data
      console.log("📝 ProcessingPopup: Using initial transaction details from SendCryptoModal");
      console.log("🔄 ProcessingPopup: Updating store with API data:", {
        currentRecipient: transactionDetails.recipient,
        newRecipient: initialTransactionDetails.recipient,
        currentAmount: transactionDetails.amount,
        newAmount: initialTransactionDetails.amount,
        currentReceiptNumber: transactionDetails.receiptNumber,
        newReceiptNumber: initialTransactionDetails.receiptNumber
      });
      
      setTransactionDetails(initialTransactionDetails);
    }
  }, [isVisible, initialTransactionDetails, setStatus, setStatusMessage, setProgress, setShowConfetti, setPopupLocked, setTransactionDetails]);

  // Log orderId changes - but don't override success state
  useEffect(() => {
    if (!orderId) {
      console.warn("ProcessingPopup: No orderId provided");
    } else if (isVisible && status !== "success") {
      // Only reset to processing if we're not already in success state
      console.log("🔄 ProcessingPopup: New orderId, initializing...");
      setStatus("processing");
      setStatusMessage("Initializing payment...");
      setProgress(20);
      setPopupLocked(false);
      setShowConfetti(false);
    }
  }, [orderId, isVisible, status, setStatus, setStatusMessage, setProgress, setPopupLocked, setShowConfetti]);

  // Prevent popup auto-closing when successful
  useEffect(() => {
    if (status === "success" && isVisible) {
      setPopupLocked(true);
    }
  }, [status, isVisible]);

  // Reset state when popup becomes invisible
  useEffect(() => {
    if (!isVisible) {
      // Always reset when popup closes, regardless of lock state
      reset(initialTransactionDetails);
      setPopupLocked(false);
      setShowConfetti(false);
    }
  }, [isVisible, reset, setPopupLocked, setShowConfetti]);

  // Poll for order status - restart when orderId changes
  useEffect(() => {
    if (!isVisible || status === "success" || status === "failed") return;
    if (!orderId) return;
    if (popupLocked) return;
    if (disableInternalPolling) {
      return;
    }
    let pollInterval: NodeJS.Timeout | null = null;
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
        
        // Debug the complete API response structure
        console.log("🔍 ProcessingPopup: Full API response:", {
          response,
          orderStatus,
          orderData,
          orderDataKeys: Object.keys(orderData),
          receiver_name: orderData.receiver_name,
          phone_number: orderData.phone_number
        });
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
          // Debug logging to understand the recipient data
          console.log("🔍 ProcessingPopup: Processing success state with orderData:", {
            receiver_name: orderData.receiver_name,
            phone_number: orderData.phone_number,
            hasReceiverName: !!orderData.receiver_name,
            hasPhoneNumber: !!orderData.phone_number,
            fullOrderData: orderData
          });

          // Prioritize receiver_name, fallback to phone_number, then to existing recipient
          let recipientName;
          
          // First try receiver_name from API
          if (orderData.receiver_name && orderData.receiver_name.trim() !== '') {
            recipientName = orderData.receiver_name.trim();
            console.log("✅ Using receiver_name from API:", recipientName);
          }
          // Then try phone_number from API  
          else if (orderData.phone_number && orderData.phone_number.trim() !== '') {
            recipientName = orderData.phone_number.trim();
            console.log("📞 Using phone_number from API:", recipientName);
          }
          // Finally fallback to existing recipient
          else {
            recipientName = transactionDetails.recipient || "Unknown";
            console.log("🔄 Using existing recipient:", recipientName);
          }

          console.log("🎯 ProcessingPopup: Final recipient name:", recipientName);

          const newTransactionDetails = {
            ...transactionDetails,
            amount: orderData.amount_fiat?.toString() || transactionDetails.amount,
            currency: orderData.currency || transactionDetails.currency,
            recipient: recipientName,
            paymentMethod: orderData.order_type === "offramp" ? "Mobile Money" : transactionDetails.paymentMethod,
            transactionHash: orderData.transaction_hashes?.settlement || orderData.transaction_hashes?.creation || transactionDetails.transactionHash || "N/A",
            date: orderData.created_at || transactionDetails.date,
            receiptNumber: orderData.receipt_number || orderData.mpesa_receipt_number || orderData.file_id || transactionDetails.receiptNumber || "N/A",
            paymentStatus: "settled",
            status: 1,
          };

          console.log("📤 ProcessingPopup: Setting transaction details:", newTransactionDetails);
          setTransactionDetails(newTransactionDetails);
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProcessingPopup;