"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { checkKYCStatus } from "@/services/auth";
import { useAuthStore } from "@/stores/authStore";

type Status = "loading" | "success" | "failed";

export default function KYCCallbackPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const isOtpVerified = useAuthStore((s) => s.isOtpVerified);
  const updateKYCStatus = useAuthStore((s) => s.updateKYCStatus);

  useEffect(() => {
    const verify = async () => {
      try {
        // Session ID from URL params or localStorage
        const sessionId =
          searchParams.get("ref_id") ??
          (typeof window !== "undefined"
            ? localStorage.getItem("elementpay-kyc-ref")
            : null);

        if (!sessionId || !isOtpVerified) {
          setStatus("failed");
          setMessage("Missing session. Please try again.");
          return;
        }

        const res = await checkKYCStatus(sessionId);
        console.log("[KYC Callback] checkKYCStatus response:", JSON.stringify(res, null, 2));
        updateKYCStatus(res.kyc_status);

        // Clean up KYC ref from localStorage
        if (typeof window !== "undefined") {
          localStorage.removeItem("elementpay-kyc-ref");
        }

        const { isAuthenticated } = useAuthStore.getState();

        if (res.kyc_status === "verified" && isAuthenticated) {
          setStatus("success");
          setMessage("Identity verified! Redirecting to your dashboard…");
          setTimeout(() => router.push("/dashboard"), 1500);
        } else if (res.kyc_status === "pending" && isAuthenticated) {
          setStatus("loading");
          setMessage("Verification is still processing. You'll be notified when it's complete.");
          setTimeout(() => router.push("/dashboard"), 3000);
        } else {
          setStatus("failed");
          setMessage("Verification was not successful. You can try again from your dashboard.");
        }
      } catch (err: any) {
        setStatus("failed");
        setMessage(err.message ?? "Something went wrong. Please try again.");
      }
    };

    verify();
  }, [isOtpVerified, searchParams, updateKYCStatus, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--landing-bg)] px-4">
      <div className="w-full max-w-sm bg-[var(--landing-card-bg)] rounded-2xl border border-[var(--landing-card-border)] shadow-lg p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-10 h-10 mx-auto mb-4 text-[var(--landing-accent)] animate-spin" />
            <h2 className="landing-display text-xl font-bold text-[var(--landing-heading)] mb-2">
              Verifying…
            </h2>
            <p className="text-sm text-[var(--landing-muted)]">
              {message || "Checking your verification status…"}
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="w-10 h-10 mx-auto mb-4 text-green-500" />
            <h2 className="landing-display text-xl font-bold text-[var(--landing-heading)] mb-2">
              You&apos;re verified!
            </h2>
            <p className="text-sm text-[var(--landing-muted)]">{message}</p>
          </>
        )}

        {status === "failed" && (
          <>
            <XCircle className="w-10 h-10 mx-auto mb-4 text-red-500" />
            <h2 className="landing-display text-xl font-bold text-[var(--landing-heading)] mb-2">
              Verification issue
            </h2>
            <p className="text-sm text-[var(--landing-muted)] mb-6">{message}</p>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="
                inline-flex items-center justify-center px-6 py-3 rounded-xl
                text-sm font-semibold text-white bg-[var(--landing-accent)]
                hover:bg-[var(--landing-accent-hover)] transition-colors
              "
            >
              Go to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
