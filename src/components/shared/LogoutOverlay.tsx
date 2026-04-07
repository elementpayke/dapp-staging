"use client";

import { useLogoutOverlayStore } from "@/stores/logoutOverlayStore";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

/**
 * Full-screen overlay shown during logout to prevent layout glitching
 * between dashboard and landing page.
 *
 * Mount once in Providers or root layout.
 */
export default function LogoutOverlay() {
  const isLoggingOut = useLogoutOverlayStore((s) => s.isLoggingOut);

  if (!isLoggingOut) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[var(--ep-bg)]">
      <LoadingSpinner />
    </div>
  );
}
