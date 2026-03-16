"use client";

import React, { useState } from "react";
import { Shield, Sparkles, X, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useDelegation } from "@/hooks/useDelegation";

interface DelegationPromptProps {
  /** Called when the user makes a choice (accept or dismiss). */
  onComplete: () => void;
}

/**
 * One-time delegation prompt shown after an embedded wallet is created.
 * Asks the user to allow backend signing for fully automated transactions.
 */
const DelegationPrompt = ({ onComplete }: DelegationPromptProps) => {
  const { requestDelegation, delegating } = useDelegation();
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    setError(null);
    try {
      await requestDelegation();
      onComplete();
    } catch (err: any) {
      setError(err?.message ?? "Delegation failed. You can try again later in settings.");
    }
  };

  const handleDismiss = () => {
    onComplete();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="
        w-full max-w-sm mx-auto p-5 rounded-2xl
        bg-[var(--landing-card-bg)]
        border border-[var(--landing-card-border)]
        shadow-lg
      "
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[var(--landing-accent)]/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-[var(--landing-accent)]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--landing-heading)]">
            Enable instant transactions?
          </h3>
          <p className="text-xs text-[var(--landing-muted)]">One-time setup</p>
        </div>
      </div>

      <p className="text-xs text-[var(--landing-muted)] mb-4 leading-relaxed">
        Allow us to handle approvals automatically so you never see wallet pop-ups.
        Your wallet stays yours — you can revoke this anytime.
      </p>

      {error && (
        <p className="text-xs text-red-500 mb-3">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleAccept}
          disabled={delegating}
          className="
            flex-1 flex items-center justify-center gap-2
            rounded-lg py-2.5 text-sm font-semibold
            text-white bg-[var(--landing-accent)]
            hover:bg-[var(--landing-accent-hover)]
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          {delegating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Yes, enable
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          disabled={delegating}
          className="
            flex-1 flex items-center justify-center gap-2
            rounded-lg py-2.5 text-sm font-medium
            text-[var(--landing-muted)]
            bg-[var(--landing-input-bg)]
            border border-[var(--landing-input-border)]
            hover:text-[var(--landing-heading)]
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          Not now
        </button>
      </div>
    </motion.div>
  );
};

export default DelegationPrompt;
