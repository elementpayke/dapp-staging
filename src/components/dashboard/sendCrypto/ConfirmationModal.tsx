"use client"
import React from "react"
import { createPortal } from "react-dom"

type ModalMode = "confirm" | "error"

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  accountInfo: string
  amountKES: number
  accountNumber?: string // optional
  cashoutType: "PHONE" | "TILL" | "PAYBILL"
  mode: ModalMode
  errorMessage?: string // optional
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  accountInfo,
  amountKES,
  accountNumber,
  cashoutType,
  mode,
  errorMessage,
}) => {
  if (!isOpen) return null

  // Use portal to render outside the Dialog's DOM tree
  const modalContent = (
    <div 
      className="fixed inset-0 z-top bg-black bg-opacity-50 flex justify-center items-center p-4" 
      style={{ zIndex: 9999 }}
      onClick={(e) => {
        // Only close if clicking the backdrop, not the modal content
        if (e.target === e.currentTarget) {
          console.log("🔘 Backdrop clicked in ConfirmationModal");
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl relative"
        onClick={(e) => {
          // Prevent backdrop click when clicking inside modal
          e.stopPropagation();
          console.log("🔘 Modal content clicked in ConfirmationModal");
        }}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {mode === "confirm" ? "Confirm Payment" : "Account Validation Failed"}
        </h2>

        {mode === "confirm" ? (
          <p className="text-sm text-gray-700 mb-4">
            You&apos;re about to send <strong>{amountKES?.toFixed(2)} KES</strong> to{" "}
            <strong>{accountInfo}</strong>
            {cashoutType === "PAYBILL" && accountNumber && (
              <> (Account: <strong>{accountNumber}</strong>)</>
            )}
            . Do you want to proceed?
          </p>
        ) : (
          <p className="text-sm text-red-600 mb-4">
            {errorMessage || "We couldn't validate the account number. Please check and try again."}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("🔘 Close button clicked in ConfirmationModal");
              onClose();
            }}
            className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 text-sm"
          >
            Close
          </button>
          {mode === "confirm" && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("🔘 Proceed button clicked in ConfirmationModal");
                console.log("🔘 onConfirm function:", typeof onConfirm);
                try {
                  onConfirm?.();
                  console.log("🔘 onConfirm executed successfully");
                } catch (error) {
                  console.error("🔘 Error executing onConfirm:", error);
                }
                onClose();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              Proceed
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Render using portal to document.body to escape any parent DOM constraints
  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

export default ConfirmationModal
