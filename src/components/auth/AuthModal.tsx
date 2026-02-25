"use client";

import React, { useCallback, useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthModalStore } from "@/stores/authModalStore";
import { useAuthStore } from "@/stores/authStore";
import EmailStep from "./EmailStep";
import OTPStep from "./OTPStep";
import WalletStep from "./WalletStep";

const STEP_LABELS: Record<string, string> = {
  email: "Email",
  otp: "Verify",
  wallet: "Wallet",
} as const;

const STEPS = ["email", "otp", "wallet"] as const;

const AuthModal = () => {
  const isOpen = useAuthModalStore((s) => s.isOpen);
  const step = useAuthModalStore((s) => s.step);
  const walletConnecting = useAuthModalStore((s) => s.walletConnecting);
  const closeAuthModal = useAuthModalStore((s) => s.closeAuthModal);
  const clearPending = useAuthStore((s) => s.clearPending);

  const handleClose = useCallback(() => {
    closeAuthModal();
    clearPending();
  }, [closeAuthModal, clearPending]);

  // Esc to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, handleClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentIdx = (STEPS as readonly string[]).indexOf(step);

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-150 ${walletConnecting ? 'opacity-0 pointer-events-none' : ''}`}>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="
          relative z-10 w-full max-w-md mx-4
          bg-[var(--landing-card-bg)] rounded-2xl
          border border-[var(--landing-card-border)]
          shadow-2xl overflow-hidden
        "
        role="dialog"
        aria-modal="true"
        aria-label="Authentication"
      >
        {/* Header with close & progress */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          {/* Progress dots */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`
                    w-2 h-2 rounded-full transition-colors
                    ${i <= currentIdx
                      ? "bg-[var(--landing-accent)]"
                      : "bg-[var(--landing-input-border)]"
                    }
                  `}
                />
                {i < STEPS.length - 1 && (
                  <div
                    className={`
                      w-6 h-px transition-colors
                      ${i < currentIdx
                        ? "bg-[var(--landing-accent)]"
                        : "bg-[var(--landing-input-border)]"
                      }
                    `}
                  />
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-[var(--landing-muted)] hover:text-[var(--landing-heading)] hover:bg-[var(--landing-input-bg)] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step label */}
        <div className="px-6 pb-2">
          <p className="text-xs font-medium text-[var(--landing-muted)] uppercase tracking-wider">
            Step {currentIdx + 1} of {STEPS.length} · {STEP_LABELS[step]}
          </p>
        </div>

        {/* Step content */}
        <div className="px-6 pt-4 pb-8">
          <AnimatePresence mode="wait">
            {step === "email" && <EmailStep key="email" />}
            {step === "otp" && <OTPStep key="otp" />}
            {step === "wallet" && <WalletStep key="wallet" />}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthModal;
