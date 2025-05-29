"use client";

import type React from "react";
import { useEffect, useRef } from "react";
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
  apiKey: string;
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
    statusMessage,
    progress,
    showConfetti,
    copied,
    emailInput,
    sendingEmail,
    emailSent,
    activeTab,
    transactionDetails,
    fallbackDate,
    showTechnicalDetails,
    setStatus,
    setStatusMessage,
    setProgress,
    setShowConfetti,
    setCopied,
    setEmailInput,
    setSendingEmail,
    setEmailSent,
    setActiveTab,
    setTransactionDetails,
    setFallbackDate,
    setShowTechnicalDetails,
    reset,
  } = useProcessingPopupStore();

  const receiptRef = useRef<HTMLDivElement>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  // Reset state when popup becomes invisible
  useEffect(() => {
    if (!isVisible) {
      reset(initialTransactionDetails);
    }
  }, [isVisible, initialTransactionDetails, reset]);

  // Set fallback date if not already set
  useEffect(() => {
    if (!fallbackDate) {
      setFallbackDate(new Date().toISOString());
    }
  }, [fallbackDate, setFallbackDate]);

  // Poll for order status
  useEffect(() => {
    if (!isVisible || !orderId) return;

    let pollInterval: NodeJS.Timeout | null = null;
    let isPolling = true;

    const cleanupOrderId = () => {
      if (orderId) {
        localStorage.removeItem(`order_${orderId}`);
        sessionStorage.removeItem(`order_${orderId}`);
      }
    };

    const fetchStatus = async () => {
      if (!isPolling) return false;

      try {
        const response = await fetchOrderStatus(orderId);
        const orderStatus = response.data;

        setTransactionDetails({
          ...transactionDetails,
          amount: orderStatus.data.amount_fiat?.toString() || "N/A",
          currency: orderStatus.data.currency || "N/A",
          recipient: formatReceiverName(orderStatus.data.receiver_name),
          paymentMethod:
            orderStatus.data.order_type === "offramp" ? "Mobile Money" : "N/A",
          transactionHash:
            orderStatus.data.transaction_hashes?.settlement ||
            orderStatus.data.transaction_hashes?.creation ||
            "N/A",
          date: orderStatus.data.created_at || "N/A",
          receiptNumber:
            orderStatus.data.receipt_number ||
            orderStatus.data.mpesa_receipt_number ||
            orderStatus.data.file_id ||
            "N/A",
          paymentStatus:
            orderStatus.data.status === "settled"
              ? "settled"
              : orderStatus.data.status === "failed"
              ? "Failed"
              : orderStatus.data.status === "refunded"
              ? "Refunded"
              : "Processing",
          status: Number(
            orderStatus.data.status === "settled"
              ? 1
              : orderStatus.data.status === "failed"
              ? 2
              : orderStatus.data.status === "refunded"
              ? 3
              : 0
          ),
          failureReason: orderStatus.data.failure_reason || "N/A",
          orderId: orderStatus.data.order_id || "N/A",
          customerName: formatReceiverName(orderStatus.data.receiver_name),
          customerEmail: "N/A",
          items: [
            {
              name: orderStatus.data.token || "N/A",
              price: orderStatus.data.amount_fiat?.toString() || "N/A",
              quantity: 1,
            },
          ],
          subtotal: orderStatus.data.amount_fiat?.toString() || "N/A",
          tax: "N/A",
          merchantLogo: "N/A",
          notes: orderStatus.data.failure_reason || "N/A",
        });

        const orderStatusValue = orderStatus.data.status.toLowerCase();

        switch (orderStatusValue) {
          case "settled":
            setStatus("success");
            setStatusMessage("Payment successful!");
            setProgress(100);
            setShowConfetti(true);
            cleanupOrderId();
            if (pollInterval) clearInterval(pollInterval);
            return true;

          case "failed":
            setStatus("failed");
            setStatusMessage(
              formatErrorMessage(
                orderStatus.data.failure_reason || "Payment failed"
              )
            );
            setProgress(100);
            cleanupOrderId();
            if (pollInterval) clearInterval(pollInterval);
            return true;

          case "refunded":
            setStatus("failed");
            setStatusMessage(
              orderStatus.data.failure_reason || "Payment was refunded"
            );
            setProgress(100);
            cleanupOrderId();
            if (pollInterval) clearInterval(pollInterval);
            return true;

          case "pending":
          case "processing":
            setStatus("processing");
            setStatusMessage("Processing your payment...");
            setProgress(90);
            return false;

          default:
            console.warn(`Unknown order status: ${orderStatusValue}`);
            setStatus("processing");
            setStatusMessage("Processing your payment...");
            setProgress(90);
            return false;
        }
      } catch (error) {
        console.error("Error polling order status:", error);
        return false;
      }
    };

    fetchStatus().then((shouldContinuePolling) => {
      if (!shouldContinuePolling && isPolling) {
        pollInterval = setInterval(async () => {
          const shouldStop = await fetchStatus();
          if (shouldStop && pollInterval) {
            clearInterval(pollInterval);
          }
        }, 5000);
      }
    });

    return () => {
      isPolling = false;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      cleanupOrderId();
    };
  }, [
    isVisible,
    orderId,
    setStatus,
    setStatusMessage,
    setProgress,
    setShowConfetti,
    setTransactionDetails,
    transactionDetails,
  ]);

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
        >
          {/* Custom confetti effect */}
          {showConfetti && <CustomConfetti />}

          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl p-6 max-w-[95vw] w-full md:max-w-lg min-w-[340px] shadow-xl relative overflow-hidden"
            style={{ maxHeight: "90vh", overflowY: "auto" }}
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
              status={status}
              statusMessage={statusMessage}
              progress={progress}
              transactionDetails={transactionDetails}
              onClose={onClose}
              showTechnicalDetails={showTechnicalDetails}
              setShowTechnicalDetails={setShowTechnicalDetails}
              copied={copied}
              copyToClipboard={copyToClipboard}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              printReceipt={printReceipt}
              downloadReceiptAsImage={downloadReceiptAsImage}
              sendReceiptEmail={true}
              emailInput={emailInput}
              setEmailInput={setEmailInput}
              sendingEmail={sendingEmail}
              emailSent={emailSent}
              sendReceiptViaEmail={sendReceiptViaEmail}
              branding={branding}
              fallbackDate="2025-05-29"
              receiptRef={receiptRef}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProcessingPopup;
