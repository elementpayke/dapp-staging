"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { Loader2, CreditCard, Download, Copy, CheckCheck, Printer, Mail, FileText, QrCode } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toPng } from 'html-to-image'
import QRCode from 'qrcode.react'

// Transaction details interface
interface TransactionDetails {
  amount: string
  currency: string
  recipient: string
  paymentMethod: string
  transactionHash: string
  date: string
  receiptNumber: string
  paymentStatus: string
  customerName?: string
  customerEmail?: string
  items?: {name: string, price: string, quantity: number}[]
  subtotal?: string
  tax?: string
  merchantLogo?: string
  notes?: string
}

// Export options interface
interface ExportOptions {
  format: 'png' | 'pdf' | 'email' | 'print'
}

// Update the interface to accept transaction details and custom API function
interface ProcessingPopupProps {
  isVisible: boolean
  onClose: () => void
  orderId: string
  apiKey: string
  // Add optional custom function for checking order status
  checkOrderStatusFn?: (orderId: string) => Promise<string>
  // Add optional transaction details
  transactionDetails?: TransactionDetails
  // Add branding options
  branding?: {
    primaryColor: string
    logo?: string
    companyName: string
    footerMessage?: string
    receiptTitle?: string
  }
  // Email send function
  sendReceiptEmail?: (email: string, receiptData: any) => Promise<boolean>
}

/**
 * ProcessingPopup - A component that displays the status of a transaction
 * with engaging animations, visual feedback, and transaction details
 */
const ProcessingPopup: React.FC<ProcessingPopupProps> = ({
  isVisible,
  onClose,
  orderId,
  apiKey,
  checkOrderStatusFn,
  transactionDetails = {
    amount: "ksh 100",
    currency: "KES",
    recipient: "James Mwangi",
    paymentMethod: "M-Pesa",
    transactionHash: "0x3a8d7f6e5b4c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8",
    date: new Date().toISOString(),
    receiptNumber: `RCP-${Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0")}`,
    paymentStatus: "Completed",
  },
  branding = {
    primaryColor: "#4f46e5",
    companyName: "Your Company",
    footerMessage: "Thank you for using elementpay for your transactions.",
    receiptTitle: "Payment Receipt",
  },
  sendReceiptEmail,
}) => {
  const [status, setStatus] = useState<"processing" | "success" | "failed">("processing")
  const [statusMessage, setStatusMessage] = useState("Processing your payment...")
  const [progress, setProgress] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [copied, setCopied] = useState(false)
  const [emailInput, setEmailInput] = useState(transactionDetails.customerEmail || "")
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [activeTab, setActiveTab] = useState<"details" | "receipt">("details")
  const receiptRef = useRef<HTMLDivElement>(null)

  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  }

  useEffect(() => {
    if (!isVisible || !orderId) return

    // Reset states when popup becomes visible
    setStatus("processing")
    setStatusMessage("taradhali subiri")
    setProgress(0)
    setShowConfetti(false)
    setCopied(false)
    setEmailSent(false)
    setActiveTab("details")

    // Simulate initial progress with easing
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        // Slow down progress as it approaches 90%
        const increment = Math.max(0.5, (90 - prev) / 20)
        const newProgress = prev + increment
        // Cap progress at 90% until we get confirmation
        return newProgress > 90 ? 90 : newProgress
      })
    }, 300)

    // Update the checkOrderStatus function to use the custom function if provided
    const checkOrderStatus = async () => {
      try {
        // Simulate a delay for checking order status
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Randomly select an order status for testing
        const statuses = ["processing", "success", "failed"];
        const orderStatus = statuses[Math.floor(Math.random() * statuses.length)];

        // Update UI based on simulated order status
        if (orderStatus === "success") {
          setStatus("success");
          setStatusMessage("Payment successful!");
          setProgress(100);
          setShowConfetti(true);
        } else if (orderStatus === "failed") {
          setStatus("failed");
          setStatusMessage("Payment failed. Please try again.");
          setProgress(100);
        } else {
          // If still processing, simulate another check
          setTimeout(checkOrderStatus, 2000);
        }
      } catch (error) {
        console.error("Error checking order status:", error);
        setStatus("failed");
        setStatusMessage("Error checking payment status. Please check your wallet.");
        setProgress(100);
      }
    };

    // Start checking status after a short delay
    const statusCheckTimeout = setTimeout(checkOrderStatus, 1000)

    return () => {
      clearInterval(progressInterval)
      clearTimeout(statusCheckTimeout)
    }
  }, [isVisible, orderId, apiKey, onClose, checkOrderStatusFn])

  // Function to copy transaction hash to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // Function to send receipt via email
  const sendReceiptViaEmail = async () => {
    if (!emailInput || !sendReceiptEmail) return
    
    setSendingEmail(true)
    try {
      const success = await sendReceiptEmail(emailInput, {
        ...transactionDetails,
        orderId
      })
      
      if (success) {
        setEmailSent(true)
        setTimeout(() => setEmailSent(false), 3000)
      }
    } catch (error) {
      console.error("Error sending email:", error)
    } finally {
      setSendingEmail(false)
    }
  }

  // Generate a downloadable image of the receipt
  const downloadReceiptAsImage = async () => {
    if (!receiptRef.current) return
    
    try {
      const dataUrl = await toPng(receiptRef.current, { quality: 0.95 })
      const link = document.createElement('a')
      link.download = `Receipt-${transactionDetails.receiptNumber}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Error generating receipt image:', error)
    }
  }

  // Print receipt
  const printReceipt = () => {
    if (!receiptRef.current) return
    
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Please allow popups to print your receipt')
      return
    }
    
    const receiptHTML = generateReceiptHTML()
    printWindow.document.open()
    printWindow.document.write(receiptHTML)
    printWindow.document.close()
    
    // Automatically trigger print dialog after content loads
    printWindow.onload = () => {
      printWindow.print()
    }
  }

  // Generate receipt HTML for download or print
  const generateReceiptHTML = () => {
    const brandColor = branding?.primaryColor || '#4f46e5'
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt: ${transactionDetails.receiptNumber}</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
          }
          .receipt {
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 40px;
            position: relative;
            overflow: hidden;
          }
          .receipt-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #eee;
          }
          .brand-info {
            display: flex;
            flex-direction: column;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 4px;
            color: ${brandColor};
          }
          .receipt-label {
            color: #777;
            font-size: 14px;
            margin-top: 4px;
          }
          .receipt-number {
            font-size: 16px;
            font-weight: 500;
            color: #555;
          }
          .receipt-title {
            text-align: center;
            font-size: 26px;
            font-weight: bold;
            margin-bottom: 30px;
            color: ${brandColor};
          }
          .receipt-status {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 50px;
            background-color: #e6f7ea;
            color: #18a957;
            font-weight: 500;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .receipt-section {
            margin-bottom: 25px;
          }
          .section-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 12px;
            color: #555;
          }
          .receipt-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 25px;
          }
          .receipt-info-item {
            margin-bottom: 4px;
          }
          .receipt-info-label {
            color: #777;
            font-size: 14px;
            margin-bottom: 4px;
          }
          .receipt-info-value {
            font-weight: 500;
          }
          .payment-method {
            display: flex;
            align-items: center;
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 25px;
          }
          .payment-icon {
            margin-right: 15px;
            width: 32px;
            height: 32px;
            background-color: ${brandColor};
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }
          .payment-details {
            flex: 1;
          }
          .payment-name {
            font-weight: 500;
            margin-bottom: 2px;
          }
          .payment-date {
            font-size: 14px;
            color: #777;
          }
          .amount-section {
            text-align: right;
            padding-top: 20px;
            border-top: 1px solid #eee;
            margin-top: 30px;
          }
          .total-amount {
            font-size: 28px;
            font-weight: bold;
            color: ${brandColor};
            margin-bottom: 5px;
          }
          .receipt-footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #777;
            font-size: 14px;
          }
          .receipt-barcode {
            text-align: center;
            margin-top: 30px;
          }
          .qrcode-container {
            display: inline-block;
            padding: 10px;
            background: white;
            border-radius: 4px;
          }
          .transaction-id {
            font-family: monospace;
            word-break: break-all;
            font-size: 13px;
            color: #555;
            background-color: #f5f5f5;
            padding: 8px 12px;
            border-radius: 6px;
            margin-top: 4px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
          }
          .items-table th {
            text-align: left;
            padding: 10px;
            background-color: #f5f5f5;
            font-weight: 500;
            color: #555;
          }
          .items-table td {
            padding: 10px;
            border-bottom: 1px solid #eee;
          }
          .items-table tr:last-child td {
            border-bottom: none;
          }
          .item-price, .item-total {
            text-align: right;
          }
          .item-quantity {
            text-align: center;
          }
          .receipt-background {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            opacity: 0.02;
            pointer-events: none;
            overflow: hidden;
          }
          .receipt-background::before {
            content: "";
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background-image: repeating-linear-gradient(
              45deg,
              ${brandColor},
              ${brandColor} 10px,
              transparent 10px,
              transparent 20px
            );
            opacity: 0.5;
          }
          @media print {
            body {
              padding: 0;
              background: white;
            }
            .receipt {
              box-shadow: none;
              padding: 20px;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="receipt-background"></div>
          
          <div class="receipt-header">
            <div class="brand-info">
              <div class="company-name">${branding.companyName}</div>
              <div class="receipt-label">Official Payment Receipt</div>
            </div>
            <div>
              <div class="receipt-label">Receipt ID</div>
              <div class="receipt-number">${transactionDetails.receiptNumber}</div>
            </div>
          </div>
          
          <div class="receipt-title">${branding.receiptTitle || 'Payment Receipt'}</div>
          
          <div style="text-align: center; margin-bottom: 30px;">
            <div class="receipt-status">${transactionDetails.paymentStatus}</div>
          </div>
          
          <div class="receipt-section">
            <div class="section-title">Payment Information</div>
            <div class="receipt-grid">
              <div class="receipt-info-item">
                <div class="receipt-info-label">Date</div>
                <div class="receipt-info-value">${transactionDetails.date}</div>
              </div>
              <div class="receipt-info-item">
                <div class="receipt-info-label">Recipient</div>
                <div class="receipt-info-value">${transactionDetails.recipient}</div>
              </div>
              ${transactionDetails.customerName ? `
              <div class="receipt-info-item">
                <div class="receipt-info-label">Customer</div>
                <div class="receipt-info-value">${transactionDetails.customerName}</div>
              </div>` : ''}
              ${transactionDetails.customerEmail ? `
              <div class="receipt-info-item">
                <div class="receipt-info-label">Email</div>
                <div class="receipt-info-value">${transactionDetails.customerEmail}</div>
              </div>` : ''}
            </div>
          </div>
          
          <div class="payment-method">
            <div class="payment-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
            </div>
            <div class="payment-details">
              <div class="payment-name">${transactionDetails.paymentMethod}</div>
              <div class="payment-date">Processed on ${transactionDetails.date}</div>
            </div>
          </div>
          
          ${transactionDetails.items && transactionDetails.items.length > 0 ? `
          <div class="receipt-section">
            <div class="section-title">Items</div>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Price</th>
                  <th class="item-quantity">Qty</th>
                  <th class="item-total">Total</th>
                </tr>
              </thead>
              <tbody>
                ${transactionDetails.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.price}</td>
                  <td class="item-quantity">${item.quantity}</td>
                  <td class="item-total">$${(parseFloat(item.price.replace(/[^0-9.-]+/g, '')) * item.quantity).toFixed(2)}</td>
                </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}
          
          <div class="receipt-section">
            <div class="section-title">Transaction Details</div>
            <div class="receipt-info-item">
              <div class="receipt-info-label">Transaction ID</div>
              <div class="transaction-id">${transactionDetails.transactionHash}</div>
            </div>
          </div>
          
          <div class="amount-section">
            ${transactionDetails.subtotal ? `
            <div style="margin-bottom: 5px;">
              <span style="color: #777; display: inline-block; width: 120px; text-align: right;">Subtotal:</span>
              <span style="font-weight: 500; display: inline-block; width: 100px; text-align: right;">${transactionDetails.subtotal}</span>
            </div>` : ''}
            
            ${transactionDetails.tax ? `
            <div style="margin-bottom: 5px;">
              <span style="color: #777; display: inline-block; width: 120px; text-align: right;">Tax:</span>
              <span style="font-weight: 500; display: inline-block; width: 100px; text-align: right;">${transactionDetails.tax}</span>
            </div>` : ''}
            
            <div class="total-amount">${transactionDetails.amount} ${transactionDetails.currency}</div>
          </div>
          
          <div class="receipt-barcode">
            <div class="qrcode-container">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(transactionDetails.transactionHash)}" width="120" height="120" alt="Transaction QR Code">
            </div>
            <div style="margin-top: 10px; font-size: 12px; color: #777;">Scan to verify transaction</div>
          </div>
          
          <div class="receipt-footer">
            ${branding.footerMessage || 'Thank you for your business!'}
            <div style="margin-top: 5px; font-size: 12px;">
              For questions about this transaction, please contact customer support.
            </div>
          </div>
        </div>
        
        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="
            padding: 8px 16px;
            background-color: ${brandColor};
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
          ">Print Receipt</button>
        </div>
      </body>
      </html>
    `
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm"
        >
          {/* Custom confetti effect */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* More particles for a richer effect */}
              {[...Array(100)].map((_, i) => (
                <motion.div
                  key={i}
                  className={`absolute ${Math.random() > 0.7 ? "w-3 h-8 rounded-full" : "w-2 h-2 rounded-full"}`}
                  initial={{
                    top: "50%",
                    left: "50%",
                    scale: 0,
                    opacity: 1,
                    backgroundColor: [
                      "#FF0000",
                      "#00FF00",
                      "#0000FF",
                      "#FFFF00",
                      "#FF00FF",
                      "#00FFFF",
                      "#FFFFFF",
                      "#FFA500",
                    ][Math.floor(Math.random() * 8)],
                  }}
                  animate={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    scale: [0, 1 + Math.random(), 0.5],
                    opacity: [1, 1, 0],
                    rotate: Math.random() * 360 * (Math.random() > 0.5 ? 1 : -1),
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    ease: "easeOut",
                    delay: Math.random() * 0.5,
                  }}
                />
              ))}

              {/* Add some glowing orbs */}
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={`orb-${i}`}
                  className="absolute rounded-full blur-md"
                  style={{
                    width: `${20 + Math.random() * 30}px`,
                    height: `${20 + Math.random() * 30}px`,
                    background: `radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)`,
                  }}
                  initial={{
                    top: "50%",
                    left: "50%",
                    scale: 0,
                    opacity: 0.7,
                  }}
                  animate={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    scale: [0, 3 + Math.random() * 2, 0],
                    opacity: [0.7, 0.5, 0],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    ease: "easeOut",
                    delay: Math.random() * 0.5,
                  }}
                />
              ))}
            </div>
          )}

          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl relative overflow-hidden ${
              status === "success" ? "md:max-w-lg" : ""
            }`}
            style={{ maxHeight: "90vh", overflowY: "auto" }}
          >
            {/* Animated background patterns */}
            <div className="absolute inset-0 overflow-hidden">
              {status === "processing" && (
                <>
                  {/* Animated gradient background */}
                  <motion.div
                    className="absolute inset-0 opacity-10"
                    style={{
                      background: "linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)",
                    }}
                    animate={{
                      backgroundPosition: ["0% 0%", "100% 100%"],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "reverse",
                    }}
                  />

                  {/* Animated circles */}
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={`circle-${i}`}
                      className="absolute rounded-full bg-blue-500 opacity-5"
                      style={{
                        width: `${100 + i * 50}px`,
                        height: `${100 + i * 50}px`,
                        top: "50%",
                        left: "50%",
                        x: "-50%",
                        y: "-50%",
                      }}
                      animate={{
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 3 + i,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "reverse",
                        ease: "easeInOut",
                        delay: i * 0.2,
                      }}
                    />
                  ))}

                  {/* Animated lines */}
                  <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
                    <motion.path
                      d="M0,100 Q50,50 100,100 T200,100 T300,100 T400,100"
                      stroke="#4299e1"
                      strokeWidth="2"
                      fill="transparent"
                      initial={{ pathLength: 0, pathOffset: 1 }}
                      animate={{ pathLength: 1, pathOffset: 0 }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "loop",
                        ease: "linear",
                      }}
                    />
                    <motion.path
                      d="M0,150 Q50,100 100,150 T200,150 T300,150 T400,150"
                      stroke="#4299e1"
                      strokeWidth="2"
                      fill="transparent"
                      initial={{ pathLength: 0, pathOffset: 1 }}
                      animate={{ pathLength: 1, pathOffset: 0 }}
                      transition={{
                        duration: 2.5,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "loop",
                        ease: "linear",
                        delay: 0.2,
                      }}
                    />
                  </svg>
                </>
              )}

              {status === "success" && (
                <motion.div
                  className="absolute inset-0 opacity-10"
                  style={{
                    background: "linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)",
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.1 }}
                  transition={{ duration: 1 }}
                />
              )}

              {status === "failed" && (
                <motion.div
                  className="absolute inset-0 opacity-10"
                  style={{
                    background: "linear-gradient(120deg, #ff9a9e 0%, #fad0c4 100%)",
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.1 }}
                  transition={{ duration: 1 }}
                />
              )}
            </div>

            <div className="flex flex-col items-center text-center relative z-10">
              <motion.div
                className="w-20 h-20 mb-6 flex items-center justify-center rounded-full"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {status === "processing" && (
                  <div className="relative">
                    {/* Pulsing rings */}
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={`ring-${i}`}
                        className="absolute inset-0 rounded-full border-4 border-blue-500 opacity-0"
                        animate={{
                          scale: [1, 1.5, 2],
                          opacity: [0.3, 0.15, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                          delay: i * 0.4,
                          ease: "easeOut",
                        }}
                      />
                    ))}

                    {/* Glowing background */}
                    <motion.div
                      className="absolute inset-0 rounded-full bg-blue-100 opacity-70"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                    />

                    {/* Spinning loader */}
                    <motion.div
                      animate={{
                        rotate: 360,
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        rotate: { duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                        scale: { duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
                      }}
                    >
                      <Loader2 className="w-12 h-12 text-blue-600" />
                    </motion.div>
                  </div>
                )}

                {status === "success" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                      delay: 0.1,
                    }}
                    className="bg-green-100 rounded-full p-4 relative"
                  >
                    {/* Success animation with drawing effect */}
                    <svg
                      className="w-12 h-12 text-green-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <motion.path
                        d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      />
                      <motion.path
                        d="M22 4L12 14.01l-3-3"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5, delay: 0.7 }}
                      />
                    </svg>

                    {/* Radial glow effect */}
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: "radial-gradient(circle, rgba(74,222,128,0.4) 0%, rgba(74,222,128,0) 70%)",
                      }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1.2 }}
                      transition={{ duration: 0.8, delay: 0.9 }}
                    />
                  </motion.div>
                )}

                {status === "failed" && (
                  <motion.div
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="bg-red-100 rounded-full p-4"
                  >
                    {/* X animation with drawing effect */}
                    <svg
                      className="w-12 h-12 text-red-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <motion.circle
                        cx="12"
                        cy="12"
                        r="10"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5 }}
                      />
                      <motion.line
                        x1="15"
                        y1="9"
                        x2="9"
                        y2="15"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.3, delay: 0.5 }}
                      />
                      <motion.line
                        x1="9"
                        y1="9"
                        x2="15"
                        y2="15"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.3, delay: 0.8 }}
                      />
                    </svg>
                  </motion.div>
                )}
              </motion.div>

              <motion.h3
                className="text-xl font-semibold mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {status === "processing"
                  ? "Processing Payment"
                  : status === "success"
                    ? "Payment Successful"
                    : "Payment Failed"}
              </motion.h3>

              <motion.p
                className="text-gray-600 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {statusMessage}
              </motion.p>

              {/* Progress bar with animated fill */}
              <motion.div
                className="w-full bg-gray-200 rounded-full h-3 mb-6 overflow-hidden"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.2 }}
              >
                <motion.div
                  className={`h-3 rounded-full ${
                    status === "success" ? "bg-green-500" : status === "failed" ? "bg-red-500" : "bg-blue-600"
                  }`}
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{
                    type: "spring",
                    damping: 30,
                    stiffness: 200,
                  }}
                />
              </motion.div>

              {/* Payment method icon animation */}
              {status === "processing" && (
                <motion.div
                  className="mb-4 opacity-70"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 0.7, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <CreditCard className="w-6 h-6 text-gray-500" />
                </motion.div>
              )}

              {/* Transaction details tabs - only show on success */}
              {status === "success" && (
                <motion.div
                  className="w-full"
                  initial="hidden"
                  animate="visible"
                  variants={containerVariants}
                >
                  {/* Tabs for switching between transaction details and receipt */}
                  <div className="flex border-b mb-4">
                    <button
                      className={`px-4 py-2 font-medium text-sm ${
                        activeTab === "details"
                          ? "text-blue-600 border-b-2 border-blue-600"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                      onClick={() => setActiveTab("details")}
                    >
                      Transaction Details
                    </button>
                    <button
                      className={`px-4 py-2 font-medium text-sm ${
                        activeTab === "receipt"
                          ? "text-blue-600 border-b-2 border-blue-600"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                      onClick={() => setActiveTab("receipt")}
                    >
                      Receipt
                    </button>
                  </div>

                  {/* Transaction Details Tab */}
                  {activeTab === "details" && (
                    <motion.div
                      className="text-left mt-2 mb-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <motion.div className="flex justify-between mb-2" variants={itemVariants}>
                          <span className="text-gray-600">Amount:</span>
                          <span className="font-medium">
                            {transactionDetails.amount} {transactionDetails.currency}
                          </span>
                        </motion.div>

                        <motion.div className="flex justify-between mb-2" variants={itemVariants}>
                          <span className="text-gray-600">Recipient:</span>
                          <span className="font-medium">{transactionDetails.recipient}</span>
                        </motion.div>

                        <motion.div className="flex justify-between mb-2" variants={itemVariants}>
                          <span className="text-gray-600">Payment Method:</span>
                          <span className="font-medium">{transactionDetails.paymentMethod}</span>
                        </motion.div>

                        <motion.div className="flex justify-between mb-2" variants={itemVariants}>
                          <span className="text-gray-600">Date:</span>
                          <span className="font-medium">{transactionDetails.date}</span>
                        </motion.div>

                        <motion.div className="flex justify-between items-center" variants={itemVariants}>
                          <span className="text-gray-600">Transaction ID:</span>
                          <div className="flex items-center">
                            <span className="font-medium text-xs truncate max-w-[120px] md:max-w-[180px]">
                              {transactionDetails.transactionHash}
                            </span>
                            <motion.button
                              onClick={() => copyToClipboard(transactionDetails.transactionHash)}
                              className="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {copied ? <CheckCheck size={16} /> : <Copy size={16} />}
                            </motion.button>
                          </div>
                        </motion.div>
                      </div>

                      {/* Download options */}
                      <motion.div className="mt-6 space-y-2" variants={itemVariants}>
                        <div className="text-sm text-gray-600 mb-2">Export Receipt:</div>
                        <div className="flex flex-wrap gap-2 justify-center">
                          <motion.button
                            onClick={printReceipt}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                          >
                            <Printer size={14} />
                            <span>Print</span>
                          </motion.button>

                          <motion.button
                            onClick={downloadReceiptAsImage}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-sm"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                          >
                            <FileText size={14} />
                            <span>Image</span>
                          </motion.button>

                          {sendReceiptEmail && (
                            <motion.div
                              className="flex items-center relative w-full mt-2"
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                            >
                              <input
                                type="email"
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                placeholder="Enter email address"
                                className="w-full px-3 py-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                              />
                              <button
                                onClick={sendReceiptViaEmail}
                                disabled={!emailInput || sendingEmail}
                                className={`flex items-center gap-1 px-3 py-2 ${
                                  emailSent
                                    ? "bg-green-500 text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                } rounded-r-md transition-colors text-sm whitespace-nowrap`}
                              >
                                {sendingEmail ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : emailSent ? (
                                  <CheckCheck size={14} />
                                ) : (
                                  <Mail size={14} />
                                )}
                                <span>{emailSent ? "Sent" : "Email"}</span>
                              </button>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    </motion.div>
                  )}

                  {/* Receipt Tab */}
                  {activeTab === "receipt" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="mt-2 mb-4"
                      ref={receiptRef}
                    >
                      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                        {/* Receipt Header */}
                        <div className="border-b border-gray-100 p-4 flex justify-between items-center">
                          <div>
                            <div className="text-lg font-bold text-gray-800">{branding.companyName}</div>
                            <div className="text-xs text-gray-500">Official Payment Receipt</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Receipt ID</div>
                            <div className="text-sm font-medium">{transactionDetails.receiptNumber}</div>
                          </div>
                        </div>

                        {/* Receipt Title */}
                        <div className="p-4 text-center">
                          <h3 className="text-xl font-bold text-gray-800">{branding.receiptTitle || 'Payment Receipt'}</h3>
                          <div className="mt-2 inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            {transactionDetails.paymentStatus}
                          </div>
                        </div>

                        {/* Payment Information */}
                        <div className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-600 mb-2">Payment Information</div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <div className="text-xs text-gray-500">Date</div>
                              <div className="text-sm">{transactionDetails.date}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Recipient</div>
                              <div className="text-sm">{transactionDetails.recipient}</div>
                            </div>
                            {transactionDetails.customerName && (
                              <div>
                                <div className="text-xs text-gray-500">Customer</div>
                                <div className="text-sm">{transactionDetails.customerName}</div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Payment Method */}
                        <div className="px-4 py-3 bg-gray-50 flex items-center">
                          <div className="w-8 h-8 rounded-md bg-blue-500 flex items-center justify-center text-white mr-3">
                            <CreditCard size={16} />
                          </div>
                          <div>
                            <div className="text-sm font-medium">{transactionDetails.paymentMethod}</div>
                            <div className="text-xs text-gray-500">Processed on {transactionDetails.date}</div>
                          </div>
                        </div>

                        {/* Transaction Details */}
                        <div className="px-4 py-3 border-t border-gray-100">
                          <div className="text-sm font-medium text-gray-600 mb-2">Transaction Details</div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Transaction ID</div>
                            <div className="text-xs font-mono bg-gray-50 p-2 rounded border border-gray-100 break-all">
                              {transactionDetails.transactionHash}
                            </div>
                          </div>
                        </div>

                        {/* Total Amount */}
                        <div className="px-4 py-3 border-t border-gray-100 text-right">
                          <div className="text-xs text-gray-500 mb-1">Total Amount</div>
                          <div className="text-2xl font-bold text-blue-600">
                            {transactionDetails.amount} {transactionDetails.currency}
                          </div>
                        </div>

                        {/* QR Code */}
                        {/* <div className="p-4 border-t border-gray-100 flex flex-col items-center">
                          <QRCode value={transactionDetails.transactionHash} size={100} renderAs="svg" />
                          <div className="text-xs text-gray-500 mt-2">Scan to verify transaction</div>
                        </div> */}

                        {/* Receipt Footer */}
                        <div className="p-4 border-t border-gray-100 text-center">
                          <div className="text-sm text-gray-600">{branding.footerMessage || 'Thank you for your business!'}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            For questions about this transaction, please contact customer support.
                          </div>
                        </div>
                      </div>

                      {/* Download options for receipt view */}
                      <div className="mt-4 flex justify-center gap-2">
                        <motion.button
                          onClick={printReceipt}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <Printer size={14} />
                          <span>Print</span>
                        </motion.button>

                        <motion.button
                          onClick={downloadReceiptAsImage}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-sm"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <Download size={14} />
                          <span>Download</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Close button */}
              {status !== "processing" && (
                <motion.button
                  onClick={onClose}
                  className="px-6 py-2 mt-4 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-800 font-medium transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.05, backgroundColor: "#e5e7eb" }}
                  whileTap={{ scale: 0.95 }}
                >
                  Close
                </motion.button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ProcessingPopup