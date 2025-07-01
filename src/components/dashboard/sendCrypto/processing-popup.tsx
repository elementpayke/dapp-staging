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

  // Emergency success trigger for debugging
  const triggerSuccessState = () => {
    console.log("🚀 EMERGENCY SUCCESS TRIGGER ACTIVATED");
    const mockSuccessDetails = {
      ...transactionDetails,
      amount: "100",
      currency: "KES",
      recipient: "Test User",
      paymentMethod: "Mobile Money",
      transactionHash: "0x123...abc",
      date: new Date().toISOString(),
      receiptNumber: "TEST123456",
      paymentStatus: "settled",
      status: 1,
    };
    
    setTransactionDetails(mockSuccessDetails);
    setStatus("success");
    setStatusMessage("Payment successful!");
    setProgress(100);
    setShowConfetti(true);
    setPopupLocked(true);
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
      reset(initialTransactionDetails);
      setPopupLocked(false);
    }
  }, [isVisible, popupLocked, initialTransactionDetails, reset]);

  // Single initialization effect to prevent conflicts
  useEffect(() => {
    if (!isVisible) return;

    console.log("[INIT] Processing popup opened with orderId:", orderId);
    console.log("[INIT] Initial transaction details:", initialTransactionDetails);
    
    // Get current store status to avoid issues
    const currentStoreStatus = useProcessingPopupStore.getState().status;
    console.log("[INIT] Current store status before any changes:", currentStoreStatus);
    
    // DON'T force reset if we already have a success status
    // This was causing successful transactions to be reset back to processing
    if (currentStoreStatus === "success") {
      console.log("[INIT] Already in success state, not resetting");
      return;
    }
    
    // Only reset if we're starting a new transaction and not already successful
    if (orderId) {
      console.log("[INIT] Resetting state for new transaction");
      reset(initialTransactionDetails);
    }
    
    // Check if transaction is already successful based on initial details
    const isAlreadySuccessful = initialTransactionDetails && (
      initialTransactionDetails.transactionHash ||
      initialTransactionDetails.receiptNumber ||
      initialTransactionDetails.status === 1 ||
      initialTransactionDetails.paymentStatus?.toLowerCase() === "settled" ||
      initialTransactionDetails.paymentStatus?.toLowerCase() === "successful" ||
      initialTransactionDetails.paymentStatus?.toLowerCase() === "completed"
    );

    console.log("[INIT] Is already successful?", isAlreadySuccessful);

    if (isAlreadySuccessful) {
      console.log("[INIT] Transaction already successful, showing success state and locking popup");
      setStatus("success");
      setStatusMessage("Payment successful!");
      setProgress(100);
      setShowConfetti(true);
      setPopupLocked(true); // Lock immediately for successful transactions
      // Ensure transaction details are set
      if (initialTransactionDetails) {
        setTransactionDetails(initialTransactionDetails);
      }
    } else if (orderId) {
      console.log("[INIT] Starting processing state for orderId:", orderId);
      setStatus("processing");
      setStatusMessage("Processing your payment...");
      setProgress(30);
      setPopupLocked(false); // Allow polling for new transactions
    }

    // Set fallback date if not already set
    if (!fallbackDate) {
      setFallbackDate(new Date().toISOString());
    }
  }, [isVisible, orderId, initialTransactionDetails, fallbackDate, setStatus, setStatusMessage, setProgress, setShowConfetti, setTransactionDetails, setFallbackDate, setPopupLocked, reset]);

  // DEBUG: Log status and transactionDetails on every render
  useEffect(() => {
    console.log("[ProcessingPopup RENDER] status:", status, "transactionDetails:", transactionDetails);
    console.log("[ProcessingPopup RENDER] orderId:", orderId, "isVisible:", isVisible);
    console.log("[ProcessingPopup RENDER] popupLocked:", popupLocked, "progress:", progress);
  });

  // Poll for order status - restart when orderId changes
  useEffect(() => {
    // Skip if popup not visible or already in final state
    if (!isVisible || status === "success" || status === "failed") {
      console.log("Skipping polling - popup not visible or already complete. Status:", status);
      return;
    }

    // If no orderId, wait for it to be set but log this prominently
    if (!orderId) {
      console.log("⚠️ WARNING: No orderId provided! Waiting for orderId to be set...");
      console.log("⚠️ This could be why the popup is stuck loading!");
      return;
    }

    // Skip if popup is locked (already successful)
    if (popupLocked) {
      console.log("Skipping polling - popup is locked");
      return;
    }

    console.log("[POLLING] Starting status polling for orderId:", orderId, "Current status:", status);
    console.log("[POLLING] This should start making API calls every 3 seconds...");
    
    let pollInterval: NodeJS.Timeout | null = null;
    let isPolling = true;
    let pollAttempts = 0;
    const maxPollAttempts = 120; // Increased to 10 minutes of polling (120 * 5s = 600s)
    let currentProgress = 40; // Start progress tracking

    const cleanupOrderId = () => {
      console.log("[CLEANUP] Cleaning up orderId from localStorage");
      if (orderId) {
        localStorage.removeItem(`order_${orderId}`);
        sessionStorage.removeItem(`order_${orderId}`);
      }
    };

    const fetchStatus = async (): Promise<boolean> => {
      if (!isPolling) return true;

      pollAttempts++;
      console.log(`[POLLING] Attempt ${pollAttempts}/${maxPollAttempts} - Checking status for orderId: ${orderId}`);
      
      // Gradually increase progress during polling (but cap at 95% until success)
      currentProgress = Math.min(currentProgress + 1, 95);
      console.log(`[POLLING] Setting progress to: ${currentProgress}`);
      setProgress(currentProgress);

      // Check if we've exceeded max attempts
      if (pollAttempts >= maxPollAttempts) {
        console.log("Max poll attempts reached, stopping polling");
        setStatus("failed");
        setStatusMessage("Transaction is taking longer than expected. Please check your transaction status manually.");
        setProgress(100);
        cleanupOrderId();
        return true;
      }

      try {
        console.log(`[POLLING] Fetching order status for orderId: ${orderId}`);
        const response = await fetchOrderStatus(orderId);
        console.log(`[POLLING] Raw API response:`, response);
        console.log(`[POLLING] Response status:`, response.status);
        console.log(`[POLLING] Response data structure:`, response.data);
        
        const orderStatus = response.data;
        
        // Handle different response structures
        if (!orderStatus) {
          console.log("[POLLING] No order status data, continuing...");
          return false;
        }

        // Check if the response has a nested data structure or is flat
        const orderData = orderStatus.data || orderStatus;
        
        if (!orderData) {
          console.log("[POLLING] No order data found, continuing...");
          return false;
        }

        console.log(`[POLLING] Order data:`, orderData);
        console.log(`[POLLING] Order status:`, orderData.status);
        console.log(`[POLLING] Order type:`, orderData.order_type);
        console.log(`[POLLING] Transaction hashes:`, orderData.transaction_hashes);
        console.log(`[POLLING] Receipt number:`, orderData.receipt_number);
        console.log(`[POLLING] MPESA receipt:`, orderData.mpesa_receipt_number);
        console.log(`[POLLING] File ID:`, orderData.file_id);

        // Always use the latest transactionDetails from the store
        setTransactionDetails({
          ...transactionDetails,
          amount: orderData.amount_fiat?.toString() || "N/A",
          currency: orderData.currency || "N/A",
          recipient: formatReceiverName(orderData.receiver_name),
          paymentMethod:
            orderData.order_type === "offramp" ? "Mobile Money" : "N/A",
          transactionHash:
            orderData.transaction_hashes?.settlement ||
            orderData.transaction_hashes?.creation ||
            "N/A",
          date: orderData.created_at || "N/A",
          receiptNumber:
            orderData.receipt_number ||
            orderData.mpesa_receipt_number ||
            orderData.file_id ||
            "N/A",
          paymentStatus:
            orderData.status === "settled"
              ? "settled"
              : orderData.status === "failed"
              ? "Failed"
              : orderData.status === "refunded"
              ? "Refunded"
              : "Processing",
          status: Number(
            orderData.status === "settled"
              ? 1
              : orderData.status === "failed"
              ? 2
              : orderData.status === "refunded"
              ? 3
              : 0
          ),
          failureReason: orderData.failure_reason || "N/A",
          orderId: orderData.order_id || "N/A",
          customerName: formatReceiverName(orderData.receiver_name),
          customerEmail: "N/A",
          items: [
            {
              name: orderData.token || "N/A",
              price: orderData.amount_fiat?.toString() || "N/A",
              quantity: 1,
            },
          ],
          subtotal: orderData.amount_fiat?.toString() || "N/A",
          tax: "N/A",
          merchantLogo: "N/A",
          notes: orderData.failure_reason || "N/A",
        });

        // DEBUG: Log the full API response and all relevant fields
        console.log("[DEBUG] Full orderData:", JSON.stringify(orderData, null, 2));
        console.log("[DEBUG] Checking completion indicators:", {
          settlementHash: orderData.transaction_hashes?.settlement,
          creationHash: orderData.transaction_hashes?.creation,
          receiptNumber: orderData.receipt_number,
          mpesaReceiptNumber: orderData.mpesa_receipt_number,
          fileId: orderData.file_id,
          status: orderData.status,
          statusType: typeof orderData.status,
        });

        // Defensive: handle both string and number status values
        let orderStatusValue = orderData.status;
        if (typeof orderStatusValue === "string") {
          orderStatusValue = orderStatusValue.toLowerCase();
        }
        console.log("Processing order status:", orderStatusValue, "Full response:", orderData);

        // Also check the numeric status for additional validation
        const numericStatus = Number(
          orderData.status === "settled"
            ? 1
            : orderData.status === "failed"
            ? 2
            : orderData.status === "refunded"
            ? 3
            : 0
        );

        console.log("Numeric status:", numericStatus);

        // Enhanced completion detection with better logging
        console.log("[DEBUG] Checking completion conditions:", {
          settlement_hash: orderData.transaction_hashes?.settlement,
          creation_hash: orderData.transaction_hashes?.creation,
          receipt_number: orderData.receipt_number,
          mpesa_receipt: orderData.mpesa_receipt_number,
          file_id: orderData.file_id,
          status_string: orderStatusValue,
          status_numeric: orderData.status,
          raw_status: orderData.status
        });

        // Primary success conditions - if ANY of these are true, transaction is successful
        const hasSettlementHash = !!orderData.transaction_hashes?.settlement;
        const hasCreationHash = !!orderData.transaction_hashes?.creation;
        const hasReceiptNumber = !!orderData.receipt_number;
        const hasMpesaReceipt = !!orderData.mpesa_receipt_number;
        const hasFileId = !!orderData.file_id;
        const statusIsSettled = orderStatusValue === "settled" || orderStatusValue === "completed" || orderStatusValue === "complete";
        const statusIsNumericSuccess = orderData.status === 1 || orderData.status === "1";
        
        console.log("[DEBUG] Success condition checks:", {
          hasSettlementHash,
          hasCreationHash,
          hasReceiptNumber,
          hasMpesaReceipt,
          hasFileId,
          statusIsSettled,
          statusIsNumericSuccess
        });

        // More aggressive success detection - if we have ANY success indicator
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
          // Additional checks for variations
          orderStatusValue === "completed" ||
          orderStatusValue === "done" ||
          orderStatusValue === "finished"
        );

        console.log("[DEBUG] FINAL SUCCESS DECISION:", isSuccessful);
        console.log("[DEBUG] If this should be successful but isn't, check the API response structure above");

        console.log("[DEBUG] Is transaction successful?", isSuccessful);

        if (isSuccessful) {
          console.log("✅ TRANSACTION SUCCESSFUL - Setting success state and locking popup");
          
          // Create a complete transaction details object with the latest data
          const updatedTransactionDetails = {
            ...transactionDetails,
            amount: orderData.amount_fiat?.toString() || transactionDetails.amount,
            currency: orderData.currency || transactionDetails.currency,
            recipient: formatReceiverName(orderData.receiver_name) || transactionDetails.recipient,
            paymentMethod: orderData.order_type === "offramp" ? "Mobile Money" : transactionDetails.paymentMethod,
            transactionHash: orderData.transaction_hashes?.settlement || 
                           orderData.transaction_hashes?.creation || 
                           transactionDetails.transactionHash || "N/A",
            date: orderData.created_at || transactionDetails.date,
            receiptNumber: orderData.receipt_number || 
                          orderData.mpesa_receipt_number || 
                          orderData.file_id || 
                          transactionDetails.receiptNumber || "N/A",
            paymentStatus: "settled",
            status: 1,
            failureReason: orderData.failure_reason || "N/A",
            orderId: orderData.order_id || transactionDetails.orderId || "N/A",
            customerName: formatReceiverName(orderData.receiver_name) || transactionDetails.customerName,
            customerEmail: transactionDetails.customerEmail || "N/A",
            items: [
              {
                name: orderData.token || "N/A",
                price: orderData.amount_fiat?.toString() || "N/A",
                quantity: 1,
              },
            ],
            subtotal: orderData.amount_fiat?.toString() || transactionDetails.amount || "N/A",
            tax: "N/A",
            merchantLogo: "N/A",
            notes: orderData.failure_reason || "N/A",
          };
          
          // Set all success states
          setTransactionDetails(updatedTransactionDetails);
          setStatus("success");
          setStatusMessage("Payment successful!");
          setProgress(100);
          setShowConfetti(true);
          setPopupLocked(true); // Lock the popup to prevent it from closing
          forceRerender((n) => n + 1);
          cleanupOrderId();
          if (pollInterval) clearInterval(pollInterval);
          return true;
        }

        // Check for failure conditions
        const isFailed = (
          orderStatusValue === "failed" ||
          orderStatusValue === "rejected" ||
          orderStatusValue === "cancelled" ||
          orderStatusValue === "canceled" ||
          orderData.status === 2 ||
          orderData.status === "2"
        );

        if (isFailed) {
          console.log("❌ TRANSACTION FAILED");
          setStatus("failed");
          setStatusMessage(
            formatErrorMessage(
              orderData.failure_reason || "Payment failed"
            )
          );
          setProgress(100);
          cleanupOrderId();
          if (pollInterval) clearInterval(pollInterval);
          return true;
        }

        // Check for refunded status
        if (orderStatusValue === "refunded" || orderData.status === 3) {
          console.log("🔄 TRANSACTION REFUNDED");
          setStatus("failed");
          setStatusMessage(
            orderData.failure_reason || "Payment was refunded"
          );
          setProgress(100);
          cleanupOrderId();
          if (pollInterval) clearInterval(pollInterval);
          return true;
        }

        // If we reach here, transaction is still processing
        // BUT: Never override a success status - this is a critical safeguard
        const currentStoreStatus = useProcessingPopupStore.getState().status;
        if (currentStoreStatus === "success") {
          console.log("⚠️ SAFEGUARD: Not overriding success status with processing");
          return true; // Stop polling, transaction is already successful
        }
        
        // Additional safeguard: if we've been polling for a while and there's any settlement hash,
        // consider it successful even if status isn't explicitly set
        if (pollAttempts > 10 && (
          orderData.transaction_hashes?.settlement ||
          orderData.transaction_hashes?.creation ||
          orderData.receipt_number ||
          orderData.mpesa_receipt_number ||
          orderData.file_id
        )) {
          console.log("🔄 FALLBACK SUCCESS: Detected success indicators after extended polling");
          // Trigger success state
          const fallbackTransactionDetails = {
            ...transactionDetails,
            amount: orderData.amount_fiat?.toString() || transactionDetails.amount,
            currency: orderData.currency || transactionDetails.currency,
            recipient: formatReceiverName(orderData.receiver_name) || transactionDetails.recipient,
            paymentMethod: "Mobile Money",
            transactionHash: orderData.transaction_hashes?.settlement || 
                           orderData.transaction_hashes?.creation || 
                           "N/A",
            date: orderData.created_at || transactionDetails.date,
            receiptNumber: orderData.receipt_number || 
                          orderData.mpesa_receipt_number || 
                          orderData.file_id ||
                          "N/A",
            paymentStatus: "settled",
            status: 1,
          };
          
          setTransactionDetails(fallbackTransactionDetails);
          setStatus("success");
          setStatusMessage("Payment successful!");
          setProgress(100);
          setShowConfetti(true);
          setPopupLocked(true);
          cleanupOrderId();
          if (pollInterval) clearInterval(pollInterval);
          return true;
        }
        
        // Even more aggressive fallback - if we have transaction hashes but ambiguous status
        if (pollAttempts > 5 && (
          orderData.transaction_hashes?.settlement ||
          (orderData.transaction_hashes?.creation && orderData.receipt_number)
        )) {
          console.log("🚀 EARLY SUCCESS: Strong success indicators detected");
          const earlySuccessDetails = {
            ...transactionDetails,
            amount: orderData.amount_fiat?.toString() || transactionDetails.amount,
            currency: orderData.currency || transactionDetails.currency,
            recipient: formatReceiverName(orderData.receiver_name) || transactionDetails.recipient,
            paymentMethod: "Mobile Money",
            transactionHash: orderData.transaction_hashes?.settlement || 
                           orderData.transaction_hashes?.creation || 
                           "N/A",
            date: orderData.created_at || transactionDetails.date,
            receiptNumber: orderData.receipt_number || 
                          orderData.mpesa_receipt_number || 
                          orderData.file_id ||
                          "N/A",
            paymentStatus: "settled",
            status: 1,
          };
          
          setTransactionDetails(earlySuccessDetails);
          setStatus("success");
          setStatusMessage("Payment successful!");
          setProgress(100);
          setShowConfetti(true);
          setPopupLocked(true);
          cleanupOrderId();
          if (pollInterval) clearInterval(pollInterval);
          return true;
        }
        
        console.log("⏳ Transaction still processing, status:", orderStatusValue);
        setStatus("processing");
        setStatusMessage("Processing your payment...");
        setProgress(Math.min(currentProgress + 5, 95)); // Use currentProgress instead of state progress
        return false;
      } catch (error) {
        console.error("[ERROR] Error polling order status:", error);
        
        // If we've made too many attempts, stop polling and show timeout message
        if (pollAttempts >= maxPollAttempts) {
          console.log("[TIMEOUT] Max polling attempts reached, stopping");
          setStatus("failed");
          setStatusMessage("Transaction is taking longer than expected. Please check your transaction history or contact support.");
          setProgress(100);
          cleanupOrderId();
          if (pollInterval) clearInterval(pollInterval);
          return true;
        }
        
        // On error, continue polling unless it's a critical error
        if (error instanceof Error && error.message.includes('404')) {
          // Order not found yet, continue polling
          console.log("[INFO] Order not found yet, continuing to poll");
          return false;
        }
        
        // For other errors, continue polling but log the error
        console.warn("[WARN] API error, continuing to poll:", error);
        return false;
      }
    };

    // Initial fetch with proper logging
    console.log("[POLLING] Starting initial status check");
    fetchStatus().then((shouldStop) => {
      console.log("[POLLING] Initial fetch completed, shouldStop:", shouldStop);
      if (!shouldStop && isPolling) {
        // If transaction is not complete, start interval polling
        console.log("[POLLING] Starting interval polling every 3 seconds");
        pollInterval = setInterval(async () => {
          const shouldStopPolling = await fetchStatus();
          if (shouldStopPolling && pollInterval) {
            console.log("[POLLING] Stopping interval polling");
            clearInterval(pollInterval);
          }
        }, 3000); // Reduced to 3 seconds for faster updates
      } else {
        console.log("[POLLING] Transaction already complete, no interval needed");
      }
    }).catch((error) => {
      console.error("[ERROR] Initial fetch failed:", error);
      // Even if initial fetch fails, start polling
      if (isPolling) {
        pollInterval = setInterval(async () => {
          const shouldStopPolling = await fetchStatus();
          if (shouldStopPolling && pollInterval) {
            clearInterval(pollInterval);
          }
        }, 3000); // Use same 3-second interval
      }
    });

    return () => {
      isPolling = false;
      if (pollInterval) {
        console.log("[CLEANUP] Clearing polling interval");
        clearInterval(pollInterval);
      }
      cleanupOrderId();
    };
  }, [
    isVisible,
    orderId, // Add orderId as dependency so polling restarts when orderId is set
    popupLocked,
    status,
    setStatus,
    setStatusMessage,
    setProgress,
    setShowConfetti,
    setTransactionDetails,
    // Remove transactionDetails from deps to avoid closure issues
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
            
            {/* Emergency debug controls - only in development */}
            {process.env.NODE_ENV === "development" && status === "processing" && (
              <div className="absolute top-2 right-2 space-y-2">
                <button
                  onClick={triggerSuccessState}
                  className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                  title="Emergency success trigger for debugging"
                >
                  🚀 Success
                </button>
                <div className="text-xs text-gray-500 bg-white p-1 rounded">
                  Order: {orderId || "MISSING!"}
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