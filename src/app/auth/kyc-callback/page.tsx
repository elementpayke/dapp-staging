"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { checkKYCStatus } from "@/services/auth";
import { useAuthStore } from "@/stores/authStore";
import { useOnboardingStore } from "@/stores/onboardingStore";

type Status = "loading" | "success" | "failed";

export default function KYCCallbackPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = useAuthStore((s) => s.token);
  const updateKYCStatus = useAuthStore((s) => s.updateKYCStatus);
  const setLandingForm = useOnboardingStore((s) => s.setLandingForm);

  useEffect(() => {
    const verify = async () => {
      try {
        // Session ID from URL params or localStorage
        const sessionId =
          searchParams.get("session_id") ??
          (typeof window !== "undefined"
            ? localStorage.getItem("elementpay-kyc-session")
            : null);

        if (!sessionId || !token) {
          setStatus("failed");
          setMessage("Missing session. Please try again.");
          return;
        }

        const res = await checkKYCStatus(token, sessionId);
        console.log("[KYC Callback] checkKYCStatus response:", JSON.stringify(res, null, 2));
        updateKYCStatus(res.kyc_status);

        // Restore pending transaction data
        if (typeof window !== "undefined") {
          const pendingRaw = localStorage.getItem("elementpay-pending-tx");
          if (pendingRaw) {
            try {
              const pending = JSON.parse(pendingRaw);
              setLandingForm(pending);
              localStorage.removeItem("elementpay-pending-tx");
            } catch {
              /* ignore corrupt data */
            }
          }
          localStorage.removeItem("elementpay-kyc-session");
        }

        if (res.kyc_status === "verified") {
          setStatus("success");
          setMessage("Identity verified! Redirecting to your dashboard…");
          setTimeout(() => router.push("/dashboard"), 1500);
        } else if (res.kyc_status === "pending") {
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
  }, [token, searchParams, updateKYCStatus, setLandingForm, router]);

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
