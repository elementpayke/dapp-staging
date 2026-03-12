// src/components/dashboard/pages/WhatsAppPage.tsx
import React from "react";
import { Phone, ArrowRight, MessageCircle } from "lucide-react";
import QRCode from "react-qr-code";

const WhatsAppPage = () => {
  return (
    <div className="min-h-screen bg-[var(--ep-bg)] px-6 py-6 space-y-5">
      {/* Page Title */}
      <h1 className="text-xl font-bold tracking-tight text-[var(--ep-heading)]">
        WhatsApp Support
      </h1>

      {/* QR / Connect Card */}
      <div
        className="
          rounded-2xl
          border border-[var(--ep-border)]
          bg-[var(--ep-bg-card)]
          shadow-[var(--ep-card-shadow)]
          p-5 sm:p-6
        "
      >
        {/* Card Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--ep-accent-muted)] flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-[var(--ep-accent)]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--ep-heading)]">
                Connect WhatsApp
              </h2>
              <p className="text-sm text-[var(--ep-muted)]">
                Scan QR code to join our support group
              </p>
            </div>
          </div>
          {/* Status badge */}
          <span
            className="
              rounded-full px-2.5 py-0.5 text-xs font-medium
              bg-emerald-50 text-emerald-600
              dark:bg-emerald-500/10
            "
          >
            Online
          </span>
        </div>

        {/* QR Block */}
        <div
          className="
            rounded-xl bg-[var(--ep-bg-input)]
            border border-[var(--ep-border)]
            p-8 flex flex-col items-center justify-center
          "
        >
          <div className="bg-[var(--ep-bg-card)] p-4 rounded-xl shadow-[var(--ep-card-shadow)]">
            <QRCode
              value="https://chat.whatsapp.com/JnE9EYgw9uM0XlhaGaBto3"
              size={128}
            />
          </div>
          <p className="mt-4 text-xs text-[var(--ep-muted)]">
            Scan this code with your phone&apos;s camera
          </p>
          <a
            href="https://chat.whatsapp.com/JnE9EYgw9uM0XlhaGaBto3"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 text-sm font-medium text-[var(--ep-accent)] hover:underline transition-colors duration-150"
          >
            Or tap here to join the WhatsApp group
          </a>
        </div>
      </div>

      {/* Direct Support Card */}
      <div
        className="
          rounded-2xl
          border border-[var(--ep-border)]
          bg-[var(--ep-bg-card)]
          shadow-[var(--ep-card-shadow)]
          p-5 sm:p-6
        "
      >
        {/* Card Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[var(--ep-accent-muted)] flex items-center justify-center">
            <Phone className="w-5 h-5 text-[var(--ep-accent)]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--ep-heading)]">
              Direct Support
            </h2>
            <p className="text-sm text-[var(--ep-muted)]">
              Contact our support team directly
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { label: "General Support", number: "+254 110 919 165" },
            { label: "Technical Support", number: "+254 712 531 490" },
            { label: "Business Inquiries", number: "+254 720 752 314" },
          ].map(({ label, number }) => (
            <div
              key={label}
              className="
                flex items-center justify-between
                p-4 rounded-xl
                bg-[var(--ep-bg-input)]
                border border-[var(--ep-border)]
                hover:shadow-[var(--ep-card-shadow-hover)]
                hover:border-[var(--ep-accent)]/20
                transition-all duration-200
                cursor-pointer
              "
            >
              <div>
                <h3 className="text-sm font-medium text-[var(--ep-heading)]">
                  {label}
                </h3>
                <p className="text-xs text-[var(--ep-muted)] mt-0.5">{number}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[var(--ep-muted)]" />
            </div>
          ))}
        </div>
      </div>

      {/* Support Hours Card */}
      <div
        className="
          rounded-2xl
          border border-[var(--ep-border)]
          bg-[var(--ep-bg-card)]
          shadow-[var(--ep-card-shadow)]
          p-5 sm:p-6
        "
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ep-muted)] mb-4">
          Support Hours
        </p>

        <div className="space-y-3">
          {[
            { day: "Monday – Friday", hours: "8:00 AM – 8:00 PM EAT" },
            { day: "Saturday", hours: "9:00 AM – 5:00 PM EAT" },
            { day: "Sunday", hours: "Closed" },
          ].map(({ day, hours }) => (
            <div
              key={day}
              className="flex justify-between items-center py-2 border-b border-[var(--ep-border)] last:border-0"
            >
              <span className="text-sm text-[var(--ep-body)]">{day}</span>
              <span
                className={`text-sm font-medium ${
                  hours === "Closed"
                    ? "text-[var(--ep-muted)]"
                    : "text-[var(--ep-heading)]"
                }`}
              >
                {hours}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppPage;
