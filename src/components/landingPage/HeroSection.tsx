"use client";

import React, { useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import PreviewForm from "./PreviewForm";
import { useAuthModalStore } from "@/stores/authModalStore";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";  

const HERO = {
  eyebrow: "Crypto ? Mobile Money",
  headline: "Pay for anything\nwith crypto, instantly.",
  supporting:
    "Send to M-Pesa, banks, or buy crypto with clean pricing, low fees, and fast settlement across Africa.",
  cta: "Start transacting",
  ctaSecondary: "See how it works",
};

const stagger = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      delay: 0.1 * i,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
};

const HeroSection = () => {
  const formRef = useRef<HTMLDivElement>(null);
  const openAuthModal = useAuthModalStore((s) => s.openAuthModal);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isOtpVerified = useAuthStore((s) => s.isOtpVerified);
  const isWalletRegistered = useAuthStore((s) => s.isWalletRegistered);
  const navigation = useRouter();

  const scrollToForm = useCallback(() => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const handleCTA = () => {
    if (isAuthenticated && isOtpVerified && isWalletRegistered) {
      navigation?.push("/dashboard");
    } else {
      // openAuthModal handles resume logic: OTP verified → wallet-choice
      openAuthModal();
    }
  };

  return (
    <section className="landing-page relative h-fit overflow-x-hidden" aria-label="Hero">
      {/* Background gradient — uses CSS vars so it responds to dark mode */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse 70% 50% at 75% 30%, var(--ep-accent-muted) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 15% 80%, var(--ep-accent-subtle) 0%, transparent 60%),
            linear-gradient(180deg, var(--landing-card-bg) 0%, var(--landing-bg) 100%)
          `,
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-20 pt-20 sm:px-6 lg:px-8 lg:pb-32 lg:pt-28">
        <div className="grid items-center gap-16 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <div className="max-w-[32rem]">
            <motion.p
              custom={0}
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="landing-display mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--landing-accent)]"
            >
              {HERO.eyebrow}
            </motion.p>

            <motion.h1
              custom={1}
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="landing-display mb-6 whitespace-pre-line text-[2.4rem] font-bold leading-[1.14] tracking-[-0.015em] text-[var(--landing-heading)] sm:text-[2.95rem] lg:text-[3.1rem]"
            >
              {HERO.headline}
            </motion.h1>

            <motion.p
              custom={2}
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="mb-10 max-w-md text-[1.04rem] leading-relaxed text-[var(--landing-body)] opacity-90 sm:text-[1.1rem]"
            >
              {HERO.supporting}
            </motion.p>

            <motion.div
              custom={3}
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-4 sm:flex-row sm:items-center"
            >
              <button
                type="button"
                onClick={handleCTA}
                className="
                  inline-flex items-center justify-center rounded-full
                  px-8 py-3.5 text-base font-semibold
                  text-white bg-[var(--landing-accent)] hover:bg-[var(--landing-accent-hover)]
                  shadow-[0_2px_16px_rgba(67,57,202,0.25)] hover:shadow-[0_4px_24px_rgba(67,57,202,0.35)]
                  transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-[var(--landing-accent)]/40
                  focus:ring-offset-2 focus:ring-offset-[var(--landing-bg)]
                "
              >
                {HERO.cta}
              </button>

              <button
                type="button"
                onClick={scrollToForm}
                className="
                  inline-flex items-center justify-center gap-2 rounded-full
                  px-6 py-3.5 text-base font-medium
                  text-[var(--landing-body)] hover:text-[var(--landing-heading)]
                  border border-[var(--landing-card-border)] hover:border-[var(--landing-accent)]/30
                  transition-all duration-200
                "
              >
                {HERO.ctaSecondary}
                <ArrowDown className="h-4 w-4" />
              </button>
            </motion.div>

            <motion.div
              custom={4}
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="mt-10 flex items-center gap-3"
            >
              <div className="flex -space-x-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full border-2 border-[var(--landing-card-bg)] bg-gradient-to-br from-[var(--landing-accent)]/20 to-[var(--landing-accent)]/5"
                  />
                ))}
              </div>
              <p className="text-sm text-[var(--landing-muted)]">
                Trusted by{" "}
                <span className="font-medium text-[var(--landing-heading)]">2,000+</span>{" "}
                users across Kenya
              </p>
            </motion.div>
          </div>

          <motion.div
            ref={formRef}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex justify-center lg:justify-end"
          >
            <div className="w-full min-w-[18rem] max-w-[28rem] sm:max-w-[30rem]">
              <PreviewForm />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
