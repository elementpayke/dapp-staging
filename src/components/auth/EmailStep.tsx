"use client";

import React, { useState, useCallback } from "react";
import { Mail, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { requestOTP } from "@/services/auth";
import { useAuthStore } from "@/stores/authStore";
import { useAuthModalStore } from "@/stores/authModalStore";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EmailStep = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const setPendingEmail = useAuthStore((s) => s.setPendingEmail);
  const setStep = useAuthModalStore((s) => s.setStep);
  const setModalError = useAuthModalStore((s) => s.setErrorMessage);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setModalError(null);

      const trimmed = email.trim().toLowerCase();
      if (!EMAIL_RE.test(trimmed)) {
        setError("Please enter a valid email address");
        return;
      }

      setLoading(true);
      try {
        await requestOTP(trimmed);
        setPendingEmail(trimmed);
        setStep("otp");
      } catch (err: any) {
        setError(err.message ?? "Something went wrong. Try again.");
      } finally {
        setLoading(false);
      }
    },
    [email, setPendingEmail, setStep, setModalError],
  );

  return (
    <motion.div
      key="email-step"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col items-center text-center"
    >
      {/* Icon */}
      <div className="w-14 h-14 rounded-2xl bg-[var(--landing-accent)]/10 flex items-center justify-center mb-6">
        <Mail className="w-6 h-6 text-[var(--landing-accent)]" />
      </div>

      <h2 className="landing-display text-2xl font-bold text-[var(--landing-heading)] mb-2">
        Welcome to ElementPay
      </h2>
      <p className="text-sm text-[var(--landing-muted)] mb-8 max-w-xs">
        Enter your email to get started. We&apos;ll send you a one-time verification code.
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div>
          <label htmlFor="auth-email" className="sr-only">
            Email address
          </label>
          <input
            id="auth-email"
            type="email"
            autoFocus
            autoComplete="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
              setModalError(null);
            }}
            className={`
              w-full rounded-xl border px-4 py-3.5 text-base
              bg-[var(--landing-input-bg)] text-[var(--landing-heading)]
              placeholder:text-[var(--landing-muted)]
              outline-none transition-shadow
              ${error
                ? "border-red-400 focus:ring-2 focus:ring-red-200"
                : "border-[var(--landing-input-border)] focus:ring-2 focus:ring-[var(--landing-accent)]/30 focus:border-[var(--landing-accent)]"
              }
            `}
          />
          {error && (
            <p className="mt-2 text-xs text-red-500" role="alert">
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="
            w-full flex items-center justify-center gap-2
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
              Continue
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-xs text-[var(--landing-muted)]">
        By continuing you agree to our{" "}
        <a href="/terms-and-conditions" className="underline hover:text-[var(--landing-accent)]">
          Terms
        </a>{" "}
        &{" "}
        <a href="/privacy-policy" className="underline hover:text-[var(--landing-accent)]">
          Privacy Policy
        </a>
      </p>
    </motion.div>
  );
};

export default EmailStep;
