"use client"

import { useState, useEffect, useCallback } from "react"

type TransactionStatus = "idle" | "processing" | "success" | "failed"

interface UseTransactionStatusProps {
  orderId: string | null
  apiKey: string
  pollingInterval?: number
  maxAttempts?: number
}

/**
 * Custom hook to poll for transaction status
 */
export function useTransactionStatus({
  orderId,
  apiKey,
  pollingInterval = 2000,
  maxAttempts = 30,
}: UseTransactionStatusProps) {
  const [status, setStatus] = useState<TransactionStatus>("idle")
  const [statusMessage, setStatusMessage] = useState<string>("")
  const [attempts, setAttempts] = useState(0)
  const [isPolling, setIsPolling] = useState(false)

  const startPolling = useCallback(() => {
    if (!orderId) return
    setStatus("processing")
    // setStatusMessage("Processing your payment...")
    setStatusMessage("Processing ... Please wait.")
    setAttempts(0)
    setIsPolling(true)
  }, [orderId])

  const stopPolling = useCallback(() => {
    setIsPolling(false)
  }, [])

  useEffect(() => {
    if (!isPolling || !orderId) return

    let timeoutId: NodeJS.Timeout

    const checkStatus = async () => {
      try {
        console.log("***********************************************************************")
        console.log("Checking status for order ID:", orderId)
        console.log("***********************************************************************")
        const response = await fetch(`http://167.71.190.23:8000/orders/${orderId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch order status: ${response.status}`)
        }

        const orderStatus = await response.text()

        if (orderStatus === "completed" || orderStatus === "success") {
          setStatus("success")
          setStatusMessage("Payment successful!")
          setIsPolling(false)
        } else if (orderStatus === "failed" || orderStatus === "rejected") {
          setStatus("failed")
          setStatusMessage("Payment failed. Please try again.")
          setIsPolling(false)
        } else {
          // Still processing
          setAttempts((prev) => {
            const newAttempts = prev + 1
            if (newAttempts >= maxAttempts) {
              setStatus("failed")
              setStatusMessage("Transaction is taking too long. Please check your wallet for status.")
              setIsPolling(false)
              return newAttempts
            }

            // Continue polling
            timeoutId = setTimeout(checkStatus, pollingInterval)
            return newAttempts
          })
        }
      } catch (error) {
        console.error("Error checking transaction status:", error)
        setStatus("failed")
        setStatusMessage("Error checking payment status. Please check your wallet.")
        setIsPolling(false)
      }
    }

    // Start the initial check
    timeoutId = setTimeout(checkStatus, 1000)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [isPolling, orderId, apiKey, pollingInterval, maxAttempts])

  return {
    status,
    statusMessage,
    attempts,
    isPolling,
    startPolling,
    stopPolling,
  }
}
