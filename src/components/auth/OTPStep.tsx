"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { ShieldCheck, ArrowRight, Loader2, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { verifyOTP } from "@/services/auth";
import { useAuthStore } from "@/stores/authStore";
import { useAuthModalStore } from "@/stores/authModalStore";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

const OTPStep = () => {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const pendingEmail = useAuthStore((s) => s.pendingEmail);
  const setAuth = useAuthStore((s) => s.setAuth);
  const setStep = useAuthModalStore((s) => s.setStep);

  // Countdown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = useCallback(
    (idx: number, value: string) => {
      // Only allow single digit
      const digit = value.replace(/\D/g, "").slice(-1);
      const next = [...digits];
      next[idx] = digit;
      setDigits(next);
      if (error) setError(null);

      // Auto-advance to next input
      if (digit && idx < OTP_LENGTH - 1) {
        inputsRef.current[idx + 1]?.focus();
      }
    },
    [digits, error],
  );

  const handleKeyDown = useCallback(
    (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !digits[idx] && idx > 0) {
        inputsRef.current[idx - 1]?.focus();
      }
    },
    [digits],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
      if (!pasted) return;
      const next = [...digits];
      for (let i = 0; i < pasted.length; i++) {
        next[i] = pasted[i];
      }
      setDigits(next);
      // Focus the next empty or the last
      const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
      inputsRef.current[focusIdx]?.focus();
    },
    [digits],
  );

  const handleContinue = useCallback(async () => {
    const otp = digits.join("");
    if (otp.length !== OTP_LENGTH) {
      setError("Please enter the full 6-digit code");
      return;
    }
    if (!pendingEmail) {
      setError("Email not found. Please go back and try again.");
      return;
    }

    setLoading(true);
    try {
      // Call verify-otp which returns JWT tokens + user data
      const res = await verifyOTP(pendingEmail, otp);
      console.log("[OTPStep] verifyOTP response:", JSON.stringify(res, null, 2));
      console.log("[OTPStep] User KYC status:", res.user?.kyc_status ?? "not returned");
      console.log("[OTPStep] User wallets:", res.user?.wallets ?? "not returned");

      // Store auth — user profile may be incomplete until KYC is done
      // kyc_status defaults to "none" if backend doesn't send it yet
      const user = {
        ...res.user,
        kyc_status: res.user?.kyc_status ?? "none",
      };
      setAuth(res.access_token, user, res.refresh_token);
      
      // Proceed to wallet connection step
      // User will connect their wallet via Privy in the next step
      console.log("[OTPStep] Moving to wallet connection step");
      setStep("wallet");
    } catch (err: any) {
      setError(err.message ?? "Invalid code. Try again.");
    } finally {
      setLoading(false);
    }
  }, [digits, pendingEmail, setAuth, setStep]);

  const handleResend = useCallback(async () => {
    if (cooldown > 0 || !pendingEmail) return;
    try {
      const { requestOTP } = await import("@/services/auth");
      await requestOTP(pendingEmail);
      setCooldown(RESEND_COOLDOWN);
      setDigits(Array(OTP_LENGTH).fill(""));
      inputsRef.current[0]?.focus();
    } catch {
      setError("Failed to resend. Try again.");
    }
  }, [cooldown, pendingEmail]);

  const otp = digits.join("");
  const isComplete = otp.length === OTP_LENGTH;

  return (
    <motion.div
      key="otp-step"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col items-center text-center"
    >
      {/* Icon */}
      <div className="w-14 h-14 rounded-2xl bg-[var(--landing-accent)]/10 flex items-center justify-center mb-6">
        <ShieldCheck className="w-6 h-6 text-[var(--landing-accent)]" />
      </div>

      <h2 className="landing-display text-2xl font-bold text-[var(--landing-heading)] mb-2">
        Check your email
      </h2>
      <p className="text-sm text-[var(--landing-muted)] mb-8 max-w-xs">
        We sent a 6-digit code to{" "}
        <span className="font-medium text-[var(--landing-heading)]">
          {pendingEmail}
        </span>
      </p>

      {/* OTP digit boxes */}
      <div className="flex gap-2.5 mb-4" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputsRef.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={`
              w-12 h-14 rounded-xl border text-center text-xl font-semibold
              bg-[var(--landing-input-bg)] text-[var(--landing-heading)]
              outline-none transition-all
              ${error
                ? "border-red-400"
                : d
                  ? "border-[var(--landing-accent)] ring-2 ring-[var(--landing-accent)]/20"
                  : "border-[var(--landing-input-border)] focus:border-[var(--landing-accent)] focus:ring-2 focus:ring-[var(--landing-accent)]/20"
              }
            `}
            aria-label={`Digit ${i + 1}`}
          />
        ))}
      </div>

      {error && (
        <p className="text-xs text-red-500 mb-4" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleContinue}
        disabled={loading || !isComplete}
        className="
          w-full max-w-sm flex items-center justify-center gap-2
          rounded-xl py-3.5 text-base font-semibold
          text-white bg-[var(--landing-accent)] hover:bg-[var(--landing-accent-hover)]
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--landing-accent)]/40
        "
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            Verify
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Resend */}
      <button
        type="button"
        onClick={handleResend}
        disabled={cooldown > 0}
        className="mt-4 flex items-center gap-1.5 text-sm text-[var(--landing-muted)] hover:text-[var(--landing-accent)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        {cooldown > 0
          ? `Resend code in ${cooldown}s`
          : "Resend code"}
      </button>
    </motion.div>
  );
};

export default OTPStep;
