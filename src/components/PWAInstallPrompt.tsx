"use client";

import { useState, useEffect } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

const PWAInstallPrompt = () => {
  const { shouldShow, isIOS, install, dismiss } = usePWAInstall();
  const [visible, setVisible] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);
  const [showIOSTip, setShowIOSTip] = useState(false);

  useEffect(() => {
    if (shouldShow) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [shouldShow]);

  const handleDismiss = () => {
    setAnimateOut(true);
    setTimeout(() => {
      setVisible(false);
      dismiss();
    }, 300);
  };

  const handleInstall = async () => {
    if (!isIOS) {
      await install();
    }
    setAnimateOut(true);
    setTimeout(() => setVisible(false), 300);
  };

  if (!visible) return null;

  return (
    <>
      {/* iOS instruction tooltip — appears above the pill when "How?" is tapped */}
      {isIOS && showIOSTip && (
        <div
          className={`
            fixed z-[9999] bottom-20 right-4 left-4
            bg-[var(--ep-bg-card)] border border-[var(--ep-border)]
            rounded-2xl shadow-xl px-4 py-3
            transition-all duration-200
          `}
        >
          {/* little pointer arrow pointing down */}
          <div className="absolute -bottom-2 right-8 w-4 h-4 bg-[var(--ep-bg-card)] border-r border-b border-[var(--ep-border)] rotate-45" />

          <p className="text-xs font-semibold text-[var(--ep-heading)] mb-2">
            How to install on iOS:
          </p>
          <ol className="space-y-1.5">
            {[
              "Tap the Share button (□↑) in Safari",
              'Scroll down and tap "Add to Home Screen"',
              'Tap "Add" to confirm',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[var(--ep-body)]">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[var(--ep-accent)] text-white flex items-center justify-center text-[10px] font-bold mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Main pill — identical size on iOS and Android */}
      <div
        className={`
          fixed z-[9999] bottom-6 right-4 left-4
          sm:left-auto sm:right-6 sm:w-auto
          flex items-center gap-3
          bg-[var(--ep-bg-card)] border border-[var(--ep-border)]
          rounded-2xl shadow-lg px-4 py-3
          transition-all duration-300 ease-out
          ${animateOut ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}
        `}
      >
        {/* Purple icon */}
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-[var(--ep-accent)] flex items-center justify-center">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>

        {/* Label */}
        <span className="flex-1 text-sm font-semibold text-[var(--ep-heading)]">
          Add to Home Screen
        </span>

        {/* Android: Install button */}
        {!isIOS && (
          <button
            onClick={handleInstall}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[var(--ep-accent)] text-white text-sm font-semibold rounded-xl hover:opacity-90 active:scale-95 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Install
          </button>
        )}

        {/* iOS: compact "How?" button — no overflowing text */}
        {isIOS && (
          <button
            onClick={() => setShowIOSTip((v) => !v)}
            className="flex-shrink-0 px-3 py-1.5 border border-[var(--ep-accent)]/30 bg-[var(--ep-accent-muted)] text-[var(--ep-accent)] text-sm font-semibold rounded-xl hover:opacity-90 active:scale-95 transition-all"
          >
            How?
          </button>
        )}

        {/* Close */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-[var(--ep-accent-subtle)] text-[var(--ep-muted)] transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </>
  );
};

export default PWAInstallPrompt;
