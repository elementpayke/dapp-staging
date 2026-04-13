"use client";

import { useState, useEffect } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

const PWAInstallPrompt = () => {
  const { shouldShow, isIOS, install, dismiss } = usePWAInstall();
  const [visible, setVisible] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);

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
    <div
      className={`
        fixed z-[9999] bottom-6 right-6
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
      <span className="text-sm font-semibold text-[var(--ep-heading)] whitespace-nowrap">
        Add to Home Screen
      </span>

      {/* Install button */}
      {!isIOS && (
        <button
          onClick={handleInstall}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--ep-accent)] text-white text-sm font-semibold rounded-xl hover:opacity-90 active:scale-95 transition-all whitespace-nowrap"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Install
        </button>
      )}

      {/* iOS: just a close since install is manual */}
      {isIOS && (
        <span className="text-xs text-[var(--ep-muted)] whitespace-nowrap">
          Share → Add to Home Screen
        </span>
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
  );
};

export default PWAInstallPrompt;
