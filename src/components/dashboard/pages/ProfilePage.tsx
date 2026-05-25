"use client";
import {
  User,
  Shield,
  Wallet,
  Copy,
  CheckCircle2,
  Clock,
  BadgeCheck,
  AlertCircle,
  ChevronRight,
  Lock,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useWallet } from "@/hooks/useWallet";

// ── Helpers ────────────────────────────────────────────────────────
const getInitials = (email: string | undefined) => {
  if (email) return email[0].toUpperCase();
  return "?";
};

const maskAddress = (addr: string | undefined) => {
  if (!addr) return "—";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

// Returns the full union type so TypeScript doesn't narrow comparisons
// to a single literal. Swap for a real store selector when KYC is available.
const getKYCStatus = (): "verified" | "pending" | "unverified" => "unverified";

// ── Sub-components ─────────────────────────────────────────────────
const SectionCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, children }) => (
  <div className="bg-[var(--ep-bg-card)] border border-[var(--ep-border)] rounded-2xl overflow-hidden">
    <div className="flex items-center gap-2.5 px-6 py-4 border-b border-[var(--ep-border)]">
      <span className="text-[var(--ep-accent)]">{icon}</span>
      <h2 className="text-sm font-semibold text-[var(--ep-heading)] uppercase tracking-wide">
        {title}
      </h2>
    </div>
    <div className="px-6 py-5 space-y-4">{children}</div>
  </div>
);

const InfoRow: React.FC<{
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  action?: React.ReactNode;
}> = ({ label, value, mono, action }) => (
  <div className="flex items-center justify-between gap-4">
    <span className="text-xs font-medium text-[var(--ep-muted)] uppercase tracking-wide min-w-[100px]">
      {label}
    </span>
    <div className="flex items-center gap-2 flex-1 justify-end">
      <span
        className={`text-sm text-[var(--ep-body)] truncate text-right ${
          mono ? "font-mono" : "font-medium"
        }`}
      >
        {value}
      </span>
      {action}
    </div>
  </div>
);

const KYCBadge: React.FC<{ status: "verified" | "pending" | "unverified" }> = ({
  status,
}) => {
  const map = {
    verified: {
      icon: <BadgeCheck size={14} />,
      label: "Verified",
      className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    pending: {
      icon: <Clock size={14} />,
      label: "Pending",
      className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    unverified: {
      icon: <AlertCircle size={14} />,
      label: "Unverified",
      className: "bg-red-500/10 text-red-400 border-red-500/20",
    },
  };
  const { icon, label, className } = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${className}`}
    >
      {icon}
      {label}
    </span>
  );
};

// ── Main Page ──────────────────────────────────────────────────────
export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const { address, isConnected } = useWallet();

  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Derive display values from email only (no firstName on AuthUser)
  const initials = getInitials(user?.email);
  const displayName = user?.email?.split("@")[0] ?? "User";

  // Placeholder KYC — returned via function to preserve union type for comparisons
  const kycStatus = getKYCStatus();

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      {/* ── Page title ──────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-[var(--ep-heading)]">My Profile</h1>
        <p className="text-sm text-[var(--ep-muted)] mt-0.5">
          View your account details and wallet information.
        </p>
      </div>

      {/* ── Hero card ───────────────────────────────────────────── */}
      <div className="bg-[var(--ep-bg-card)] border border-[var(--ep-border)] rounded-2xl px-6 py-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-2xl bg-[var(--ep-accent-muted)] flex items-center justify-center text-[var(--ep-accent)] text-3xl font-bold shadow-[0_0_0_4px_var(--ep-accent-muted)]">
            {initials}
          </div>
          {/* Online dot */}
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[var(--ep-bg-card)]" />
        </div>

        {/* Name + email + KYC */}
        <div className="flex-1 text-center sm:text-left space-y-1.5">
          <h2 className="text-xl font-bold text-[var(--ep-heading)]">{displayName}</h2>
          <p className="text-sm text-[var(--ep-muted)]">{user?.email ?? "—"}</p>
          <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
            <KYCBadge status={kycStatus} />
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-[var(--ep-accent-muted)] text-[var(--ep-accent)] border-[var(--ep-accent)]/20">
              <CheckCircle2 size={14} />
              Active
            </span>
          </div>
        </div>

        {/* Account type pill */}
        <div className="flex-shrink-0 hidden sm:flex items-center gap-2 bg-[var(--ep-accent-muted)] px-3 py-2 rounded-xl">
          <Shield size={15} className="text-[var(--ep-accent)]" />
          <span className="text-xs font-semibold text-[var(--ep-accent)]">
            Standard Account
          </span>
        </div>
      </div>

      {/* ── Account Information ──────────────────────────────────── */}
      <SectionCard title="Account Information" icon={<User size={16} />}>
        <InfoRow label="Display Name" value={displayName} />
        <div className="h-px bg-[var(--ep-border)]" />
        <InfoRow label="Email" value={user?.email ?? "—"} />
        <div className="h-px bg-[var(--ep-border)]" />
        <InfoRow
          label="Account Type"
          value={
            <span className="inline-flex items-center gap-1.5 text-[var(--ep-accent)] text-sm font-semibold">
              <Shield size={14} />
              Standard
            </span>
          }
        />
        <div className="h-px bg-[var(--ep-border)]" />
        <InfoRow
          label="Status"
          value={
            <span className="inline-flex items-center gap-1.5 text-emerald-400 text-sm font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Active
            </span>
          }
        />
      </SectionCard>

      {/* ── Wallet ───────────────────────────────────────────────── */}
      <SectionCard title="Connected Wallet" icon={<Wallet size={16} />}>
        {isConnected && address ? (
          <>
            <InfoRow
              label="Provider"
              value={
                <span className="flex items-center gap-1.5 font-semibold text-[var(--ep-heading)]">
                  <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
                    <path d="M27.3 4L17.5 11.2l1.8-4.3L27.3 4z" fill="#E2761B" stroke="#E2761B" strokeWidth=".3" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4.7 4l9.7 7.3-1.7-4.4L4.7 4z" fill="#E4761B" stroke="#E4761B" strokeWidth=".3" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M23.8 22.2l-2.6 4 5.6 1.5 1.6-5.4-4.6-.1zM3.6 22.3l1.6 5.4 5.6-1.5-2.6-4-4.6.1z" fill="#E4761B" stroke="#E4761B" strokeWidth=".3" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10.5 14.6l-1.6 2.4 5.6.3-.2-6-3.8 3.3zM21.5 14.6l-3.9-3.4-.1 6.1 5.6-.3-1.6-2.4z" fill="#E4761B" stroke="#E4761B" strokeWidth=".3" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10.8 26.2l3.4-1.6-2.9-2.3-.5 3.9zM17.8 24.6l3.4 1.6-.5-3.9-2.9 2.3z" fill="#E4761B" stroke="#E4761B" strokeWidth=".3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  MetaMask
                </span>
              }
            />
            <div className="h-px bg-[var(--ep-border)]" />
            <InfoRow
              label="Address"
              mono
              value={maskAddress(address)}
              action={
                <button
                  onClick={() => handleCopy(address)}
                  className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-[var(--ep-accent-muted)] transition-colors"
                  title="Copy full address"
                >
                  {copied ? (
                    <CheckCircle2 size={14} className="text-emerald-400" />
                  ) : (
                    <Copy size={14} className="text-[var(--ep-muted)]" />
                  )}
                </button>
              }
            />
            <div className="h-px bg-[var(--ep-border)]" />
            <InfoRow
              label="Network"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Base
                </span>
              }
            />
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <Wallet size={32} className="text-[var(--ep-muted)] opacity-40" />
            <p className="text-sm text-[var(--ep-muted)]">No wallet connected</p>
          </div>
        )}
      </SectionCard>

      {/* ── KYC Verification ─────────────────────────────────────── */}
      <SectionCard title="Identity Verification" icon={<BadgeCheck size={16} />}>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[var(--ep-heading)]">KYC Status</p>
            <p className="text-xs text-[var(--ep-muted)]">
              {kycStatus === "verified"
                ? "Your identity has been verified. You have full access."
                : kycStatus === "pending"
                ? "Your documents are under review. This may take up to 24 hours."
                : "Complete identity verification to unlock all features."}
            </p>
          </div>
          <KYCBadge status={kycStatus} />
        </div>

        {kycStatus !== "verified" && (
          <>
            <div className="h-px bg-[var(--ep-border)]" />
            <button className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-[var(--ep-accent)] hover:opacity-90 transition-opacity">
              <span className="text-sm font-semibold text-white">
                {kycStatus === "pending" ? "Check Verification Status" : "Start Verification"}
              </span>
              <ChevronRight size={16} className="text-white/70" />
            </button>
          </>
        )}
      </SectionCard>

      {/* ── Security ─────────────────────────────────────────────── */}
      <SectionCard title="Security" icon={<Lock size={16} />}>
        <InfoRow
          label="Email verified"
          value={
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold text-sm">
              <CheckCircle2 size={14} />
              Yes
            </span>
          }
        />
        <div className="h-px bg-[var(--ep-border)]" />
        <InfoRow
          label="2FA"
          value={
            <span className="inline-flex items-center gap-1.5 text-[var(--ep-muted)] text-sm">
              <AlertCircle size={14} />
              Not enabled
            </span>
          }
        />
        <div className="h-px bg-[var(--ep-border)]" />
        <InfoRow label="Session" value="Active" />
      </SectionCard>

      {/* ── Footer note ──────────────────────────────────────────── */}
      <p className="text-xs text-center text-[var(--ep-muted)] pb-2">
        Profile management is coming soon. Contact{" "}
        <a
          href="mailto:support@elementpay.io"
          className="text-[var(--ep-accent)] hover:underline"
        >
          support@elementpay.io
        </a>{" "}
        to update your details.
      </p>
    </div>
  );
}
