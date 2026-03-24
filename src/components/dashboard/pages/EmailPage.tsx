import React, { useState } from "react";
import emailjs from "emailjs-com";

const EmailPage = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("idle");

    try {
      await emailjs.send(
        "service_dhiqw4n",
        "template_ee1hpvr",
        {
          from_name: `${formData.firstName} ${formData.lastName}`,
          from_email: formData.email,
          message: formData.message,
          to_email: "elementpay.info@gmail.com",
        },
        "sXplFeRZc_SrSPHUL"
      );

      setStatus("success");
      setFormData({ firstName: "", lastName: "", email: "", message: "" });
    } catch (error) {
      console.error("Failed to send email:", error);
      setStatus("error");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-[var(--ep-bg)] px-6 py-6 space-y-5">
      {/* Page Title */}
      <h1 className="text-xl font-bold tracking-tight text-[var(--ep-heading)]">
        Contact Us
      </h1>

      {/* Card */}
      <div
        className="
          rounded-2xl
          border border-[var(--ep-border)]
          bg-[var(--ep-bg-card)]
          shadow-[var(--ep-card-shadow)]
          p-5 sm:p-6
        "
      >
        {/* Eyebrow */}
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ep-muted)] mb-5">
          Send a message
        </p>

        {/* Status Banners */}
        {status === "success" && (
          <div className="mb-5 flex items-center gap-3 rounded-xl px-4 py-3 bg-emerald-50 dark:bg-emerald-500/10">
            <span className="text-emerald-600 text-sm font-medium">
              ✓ Your message has been sent successfully.
            </span>
          </div>
        )}

        {status === "error" && (
          <div className="mb-5 flex items-center gap-3 rounded-xl px-4 py-3 bg-red-50 dark:bg-red-500/10">
            <span className="text-red-500 text-sm font-medium">
              Failed to send message. Please try again or contact support directly.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="firstName"
                className="block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ep-muted)]"
              >
                First name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="John"
                className="
                  w-full rounded-xl
                  border border-[var(--ep-border)]
                  bg-[var(--ep-bg-input)]
                  px-3 py-2.5 text-sm text-[var(--ep-heading)]
                  placeholder:text-[var(--ep-muted)]
                  focus:outline-none focus:border-[var(--ep-border-focus)]
                  focus:ring-2 focus:ring-[var(--ep-accent)]/10
                  transition-colors duration-150
                "
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="lastName"
                className="block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ep-muted)]"
              >
                Last name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Doe"
                className="
                  w-full rounded-xl
                  border border-[var(--ep-border)]
                  bg-[var(--ep-bg-input)]
                  px-3 py-2.5 text-sm text-[var(--ep-heading)]
                  placeholder:text-[var(--ep-muted)]
                  focus:outline-none focus:border-[var(--ep-border-focus)]
                  focus:ring-2 focus:ring-[var(--ep-accent)]/10
                  transition-colors duration-150
                "
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ep-muted)]"
            >
              Email address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="johndoe@example.com"
              className="
                w-full rounded-xl
                border border-[var(--ep-border)]
                bg-[var(--ep-bg-input)]
                px-3 py-2.5 text-sm text-[var(--ep-heading)]
                placeholder:text-[var(--ep-muted)]
                focus:outline-none focus:border-[var(--ep-border-focus)]
                focus:ring-2 focus:ring-[var(--ep-accent)]/10
                transition-colors duration-150
              "
            />
          </div>

          {/* Message Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="message"
              className="block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ep-muted)]"
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Write your message here"
              rows={6}
              className="
                w-full rounded-xl
                border border-[var(--ep-border)]
                bg-[var(--ep-bg-input)]
                px-3 py-2.5 text-sm text-[var(--ep-heading)]
                placeholder:text-[var(--ep-muted)]
                focus:outline-none focus:border-[var(--ep-border-focus)]
                focus:ring-2 focus:ring-[var(--ep-accent)]/10
                transition-colors duration-150
                resize-none
              "
            />
          </div>

          {/* Submit Button — Primary CTA */}
          <button
            type="submit"
            className="
              w-full rounded-full px-6 py-3 text-sm font-semibold text-white
              bg-[var(--ep-accent)] hover:bg-[var(--ep-accent-hover)]
              shadow-[0_2px_16px_rgba(67,57,202,0.25)]
              hover:shadow-[0_4px_24px_rgba(67,57,202,0.35)]
              transition-all duration-200
              disabled:opacity-50
            "
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmailPage;
