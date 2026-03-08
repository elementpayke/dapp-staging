"use client";

import React, { useEffect, useCallback, useRef } from "react";
import { X, Loader2, ExternalLink, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "react-qr-code";
import { initiateKYC } from "@/services/auth";
import { useAuthStore } from "@/stores/authStore";
import { useKYCModalStore } from "@/stores/kycModalStore";
import { useTransactionStore } from "@/stores/transactionStore";

/**
 * KYCRequiredModal — shown when a transaction is rejected by the backend
 * because the user exceeded their transaction limit and needs to complete
 * KYC verification via SmileID.
 *
 * This is a standalone modal, independent of the auth flow modal.
 */
const KYCRequiredModal = () => {
  const isOpen = useKYCModalStore((s) => s.isOpen);
  const kycUrl = useKYCModalStore((s) => s.kycUrl);
  const kycRefId = useKYCModalStore((s) => s.kycRefId);
  const limitSnapshot = useKYCModalStore((s) => s.limitSnapshot);
  const loading = useKYCModalStore((s) => s.loading);
  const error = useKYCModalStore((s) => s.error);
  const closeKYCModal = useKYCModalStore((s) => s.closeKYCModal);
  const setKycLink = useKYCModalStore((s) => s.setKycLink);
  const setLoading = useKYCModalStore((s) => s.setLoading);
  const setError = useKYCModalStore((s) => s.setError);

  const isOtpVerified = useAuthStore((s) => s.isOtpVerified);
  const requestInFlightRef = useRef(false);
  const isLinkFetchPending = loading || (isOpen && !kycUrl && !error);

  const formatKes = useCallback((value: number | null) => {
    if (value === null) return "-";
    return new Intl.NumberFormat("en-KE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  }, []);

  /** Fetch the SmileID KYC link */
  const fetchKYCLink = useCallback(async () => {
    if (requestInFlightRef.current) return;
    if (!isOtpVerified) {
      setError("Not authenticated. Please log in again.");
      return;
    }

    requestInFlightRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const res = await initiateKYC();
      const { url, ref_id } = res.data;
      if (!url || !ref_id) {
        throw new Error("Verification link was not returned. Please retry.");
      }
      setKycLink(url, ref_id);
    } catch (err: any) {
      setError(err.message ?? "Failed to load verification link. Please try again.");
    } finally {
      requestInFlightRef.current = false;
    }
  }, [isOtpVerified, setKycLink, setLoading, setError]);

  // Auto-fetch KYC link when modal opens
  useEffect(() => {
    if (isOpen && !kycUrl && !loading && !error) {
      fetchKYCLink();
    }
  }, [isOpen, kycUrl, loading, error, fetchKYCLink]);

  /** Redirect to SmileID for verification */
  const handleStartVerification = useCallback(() => {
    if (!kycUrl) return;

    if (typeof window !== "undefined") {
      // Persist KYC ref so we can check status on return
      if (kycRefId) {
        localStorage.setItem("elementpay-kyc-ref", kycRefId);
      }

      // Persist the in-flight transaction so it can be restored after KYC
      const txDetails = useTransactionStore.getState().details;
      if (txDetails.amount) {
        const pendingTx = {
          flow: "offramp" as const,
          offRampMethod: txDetails.paymentMethod || "PHONE",
          amount: txDetails.amount,
          amountFiat: txDetails.amountFiat,
          phoneNumber: txDetails.phoneNumber || "",
          paybillNumber: txDetails.paybillNumber || "",
          accountNumber: txDetails.accountNumber || "",
          tillNumber: txDetails.tillNumber || "",
          tokenSymbol: txDetails.token?.symbol ?? null,
          initiatedFromLanding: false,
        };
        localStorage.setItem("elementpay-pending-tx", JSON.stringify(pendingTx));
        console.log("[KYCRequiredModal] Saved pending transaction before SmileID redirect");
      }
    }

    // Redirect to SmileID SmileLinks
    window.location.href = kycUrl;
  }, [kycUrl, kycRefId]);

  // Esc to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeKYCModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeKYCModal]);

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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={closeKYCModal}
        />

        {/* Modal panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="
            relative z-10 w-full max-w-2xl mx-4
            bg-[var(--landing-card-bg)] rounded-2xl
            border border-[var(--landing-card-border)]
            shadow-2xl overflow-hidden
          "
          role="dialog"
          aria-modal="true"
          aria-label="Identity Verification Required"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--landing-input-border)]">
            <div className="inline-flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-semibold tracking-wide uppercase text-amber-600">
                Verification Required
              </span>
            </div>
            <button
              type="button"
              onClick={closeKYCModal}
              className="p-1.5 rounded-lg text-[var(--landing-muted)] hover:text-[var(--landing-heading)] hover:bg-[var(--landing-input-bg)] transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="grid p-4 sm:p-5 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--landing-input-border)]">
            <section className="text-left space-y-3 pb-4 md:pb-0 md:pr-5">
              <div>
                <h2 className="text-lg font-semibold text-[var(--landing-heading)]">
                  Complete quick KYC to continue
                </h2>
                <p className="mt-1 text-sm leading-5 text-[var(--landing-muted)]">
                  Your order is above the unverified limit. Verification is free and takes about 2 minutes.
                </p>
              </div>

              <dl className="text-sm divide-y divide-[var(--landing-input-border)]">
                <div className="flex items-center justify-between py-2 text-[var(--landing-body)]">
                  <dt>Current total</dt>
                  <dd className="font-medium text-[var(--landing-heading)]">
                    KES {formatKes(limitSnapshot?.current_total ?? null)}
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2 text-[var(--landing-body)]">
                  <dt>Order amount</dt>
                  <dd className="font-medium text-[var(--landing-heading)]">
                    KES {formatKes(limitSnapshot?.order_amount ?? null)}
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2 text-[var(--landing-body)]">
                  <dt>Limit</dt>
                  <dd className="font-medium text-[var(--landing-heading)]">
                    KES {formatKes(limitSnapshot?.limit ?? null)}
                  </dd>
                </div>
              </dl>

              {error && (
                <p className="text-xs text-red-500" role="alert">
                  {error}
                </p>
              )}
            </section>

            <section className="pt-4 md:pt-0 md:pl-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--landing-muted)]">
                Open SmileID
              </p>

              <div className="min-h-[120px] flex items-center justify-center mt-2">
                {isLinkFetchPending ? (
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--landing-accent)]" />
                    <p className="text-xs text-[var(--landing-muted)]">Generating secure link...</p>
                  </div>
                ) : kycUrl ? (
                  <div className="bg-white p-1">
                    <QRCode value={kycUrl} size={96} />
                  </div>
                ) : (
                  <p className="text-xs text-[var(--landing-muted)] text-center">
                    Link unavailable.
                  </p>
                )}
              </div>

              <div className="mt-2 space-y-1.5">
                <button
                  type="button"
                  onClick={handleStartVerification}
                  disabled={!kycUrl || isLinkFetchPending}
                  className="
                    w-full flex items-center justify-center gap-2
                    rounded-lg py-2.5 text-sm font-semibold
                    text-white bg-[var(--landing-accent)] hover:bg-[var(--landing-accent-hover)]
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--landing-accent)]/40
                  "
                >
                  {isLinkFetchPending ? "Preparing link..." : "Open Verification Link"}
                  <ExternalLink className="w-4 h-4" />
                </button>

                {!kycUrl && !isLinkFetchPending && (
                  <button
                    type="button"
                    onClick={fetchKYCLink}
                    disabled={isLinkFetchPending}
                    className="
                      w-full text-center py-1.5 text-xs font-medium text-[var(--landing-muted)]
                      hover:text-[var(--landing-heading)]
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-colors
                    "
                  >
                    Retry
                  </button>
                )}
              </div>

              <p className="mt-1 text-[11px] text-[var(--landing-muted)]">
                Scan QR on mobile or use the button.
              </p>
            </section>
          </div>

          <div className="px-5 pb-4 flex items-center justify-between">
            <p className="text-[11px] text-[var(--landing-muted)]">
              Powered by SmileID
            </p>
            <button
              type="button"
              onClick={closeKYCModal}
              className="text-xs text-[var(--landing-muted)] hover:text-[var(--landing-heading)] transition-colors"
            >
              Not now
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default KYCRequiredModal;
