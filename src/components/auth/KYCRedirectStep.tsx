"use client";

import React, { useState, useCallback } from "react";
import { ScanFace, Loader2, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { initiateKYC } from "@/services/auth";
import { useAuthStore } from "@/stores/authStore";
import { useKYCModalStore } from "@/stores/kycModalStore";
import { useOnboardingStore } from "@/stores/onboardingStore";

const KYCRedirectStep = () => {
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOtpVerified = useAuthStore((s) => s.isOtpVerified);
  const kycUrl = useKYCModalStore((s) => s.kycUrl);
  const kycRefId = useKYCModalStore((s) => s.kycRefId);
  const setKycLink = useKYCModalStore((s) => s.setKycLink);
  const onboarding = useOnboardingStore();

  const urlReady = Boolean(kycUrl);

  /** Retry fetching the KYC link if it wasn't obtained during OTP step. */
  const handleRetry =async () => {
    if (!isOtpVerified) return;
    setRetrying(true);
    setError(null);
    try {
      console.log("[KYC Redirect] Retrying to fetch KYC link");
      const res = await initiateKYC();
      const { url, ref_id } = res.data;
      setKycLink(url, ref_id);
    } catch (err: any) {
      setError(err.message ?? "Failed to get verification link. Try again.");
    } finally {
      setRetrying(false);
    }
  }

  /** Persist pending tx data and redirect to SmileID. */
  const handleRedirect = () => {
    if (!kycUrl) return;

    // Persist pending transaction so we can pre-fill on return
    const pendingTx = {
      flow: onboarding.flow,
      offRampMethod: onboarding.offRampMethod,
      amount: onboarding.amount,
      phoneNumber: onboarding.phoneNumber,
      paybillNumber: onboarding.paybillNumber,
      accountNumber: onboarding.accountNumber,
      tillNumber: onboarding.tillNumber,
      tokenSymbol: onboarding.tokenSymbol,
      initiatedFromLanding: true,
    };

    if (typeof window !== "undefined") {
      if (kycRefId) localStorage.setItem("elementpay-kyc-ref", kycRefId);
      localStorage.setItem("elementpay-pending-tx", JSON.stringify(pendingTx));
    }

    // Redirect to SmileID SmileLinks on new tab
    window.open(kycUrl, "_blank");
  }

  return (
    <motion.div
      key="kyc-redirect-step"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col items-center text-center"
    >
      {/* Icon */}
      <div className="w-14 h-14 rounded-2xl bg-[var(--landing-accent)]/10 flex items-center justify-center mb-6">
        <ScanFace className="w-6 h-6 text-[var(--landing-accent)]" />
      </div>

      <h2 className="landing-display text-2xl font-bold text-[var(--landing-heading)] mb-2">
        Verify your identity
      </h2>
      <p className="text-sm text-[var(--landing-muted)] mb-6 max-w-xs">
        One last step — a quick liveness check to secure your account. You&apos;ll be redirected to our verification partner.
      </p>

      {/* What to expect */}
      <div className="w-full max-w-sm bg-[var(--landing-input-bg)] rounded-xl p-4 mb-6 text-left">
        <p className="text-xs font-semibold text-[var(--landing-heading)] uppercase tracking-wider mb-3">
          What to expect
        </p>
        <ul className="space-y-2">
          {[
            "A short selfie / liveness check",
            "Quick ID document scan",
            "Takes less than 2 minutes",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[var(--landing-body)]">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[var(--landing-accent)] shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {urlReady ? (
        <button
          type="button"
          onClick={handleRedirect}
          className="
            w-full max-w-sm flex items-center justify-center gap-2
            rounded-xl py-3.5 text-base font-semibold
            text-white bg-[var(--landing-accent)] hover:bg-[var(--landing-accent-hover)]
            transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--landing-accent)]/40
          "
        >
          Start Verification
          <ExternalLink className="w-4 h-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying}
          className="
            w-full max-w-sm flex items-center justify-center gap-2
            rounded-xl py-3.5 text-base font-semibold
            text-white bg-[var(--landing-accent)] hover:bg-[var(--landing-accent-hover)]
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--landing-accent)]/40
          "
        >
          {retrying ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Retry Loading Link
              <Loader2 className="w-4 h-4" />
            </>
          )}
        </button>
      )}

      {error && (
        <p className="mt-4 text-xs text-red-500" role="alert">
          {error}
        </p>
      )}

      <p className="mt-6 text-xs text-[var(--landing-muted)] max-w-xs">
        Powered by SmileID. Your data is encrypted and handled securely.
      </p>
    </motion.div>
  );
};

export default KYCRedirectStep;
