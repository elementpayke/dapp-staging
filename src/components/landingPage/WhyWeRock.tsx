"use client";

import React from "react";
import { Wallet, ShieldCheck, Zap, Coins } from "lucide-react";
import { motion } from "framer-motion";

const WhyWeRock = () => {
  const features = [
    {
      icon: Wallet,
      title: "One Wallet, Every Transaction",
      description:
        "Link all your wallets in one place. Send, receive, and manage crypto seamlessly from your dashboard.",
    },
    {
      icon: Coins,
      title: "Micropayments from KES 10",
      description:
        "No amount is too small. Buy, pay, or tip with just 10 bob. Low fees, instant processing.",
    },
    {
      icon: ShieldCheck,
      title: "Your Privacy. Your Power.",
      description:
        "Privacy-first. No unnecessary data collection. Safe, secure transactions on your terms.",
    },
    {
      icon: Zap,
      title: "Instant Everything",
      description:
        "Pay bills, buy services, or send funds and see it reflect in real-time, every time.",
    },
  ];

  return (
    <section id="blog" className="bg-white py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-14 md:mb-20">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-sm font-medium tracking-widest uppercase text-[var(--landing-accent)] mb-3"
            style={{ fontFamily: "var(--font-landing-body)" }}
          >
            Why ElementPay
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--landing-heading)]"
            style={{ fontFamily: "var(--font-landing-display)" }}
          >
            Built for real life. Powered by you.
          </motion.h2>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="group flex flex-col items-start p-6 bg-[var(--landing-bg)] rounded-2xl border border-transparent hover:border-[var(--landing-accent)]/20 hover:shadow-md transition-all duration-300"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--landing-accent)]/10">
                <feature.icon className="h-6 w-6 text-[var(--landing-accent)]" />
              </div>
              <h3
                className="text-lg font-semibold text-[var(--landing-heading)] mb-2"
                style={{ fontFamily: "var(--font-landing-display)" }}
              >
                {feature.title}
              </h3>
              <p
                className="text-sm text-[var(--landing-muted)] leading-relaxed"
                style={{ fontFamily: "var(--font-landing-body)" }}
              >
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyWeRock;