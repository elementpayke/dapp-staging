"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

import card1Image from "@/assets/features/card1.png";
import card2Image from "@/assets/features/card2.png";
import card3Image from "@/assets/features/card3.png";

const IMAGES = {
  card1: { src: card1Image, alt: "Pay to mobile number feature", width: 1200, height: 800 },
  card2: { src: card2Image, alt: "Deposit crypto feature", width: 1200, height: 800 },
  card3: { src: card3Image, alt: "Virtual cards feature", width: 1200, height: 800 },
};

const FeaturesSection = () => {
  const [activeCard, setActiveCard] = useState(0);

  const features = [
    {
      title: "Pay to mobile number",
      description:
        "Instantly pay or send money to a mobile number using your crypto. Pay to M-PESA, Pochi La Biashara, or any PayBill.",
      image: IMAGES.card1,
      subFeatures: [
        { text: "Pay to M-PESA, or any bank", active: true },
        { text: "Make instant payments, no delays", active: false },
        { text: "Get real-time receipts", active: false },
      ],
    },
    {
      title: "Deposit crypto to your wallet",
      description:
        "Deposit USDC and tokens to your chosen wallet and keep them secured for future transactions. Watch your funds grow.",
      image: IMAGES.card2,
      subFeatures: [
        { text: "Deposit from M-PESA, Airtel Money or Bank", active: true },
        { text: "Watch your funds appreciate", active: false },
        { text: "Secured wallet", active: false },
      ],
    },
    {
      title: "Go borderless with virtual cards",
      description:
        "Make purchases across borders using a virtual card. Use your crypto to pay for Netflix or buy goods on Google Play.",
      image: IMAGES.card3,
      subFeatures: [
        { text: "Pay to M-PESA, Airtel Money or MTN", active: true },
        { text: "Make instant payments, no delays", active: false },
        { text: "Get real-time receipts", active: false },
      ],
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveCard((current) => (current + 1) % features.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [features.length]);

  return (
    <section id="services" className="bg-[var(--landing-bg)] py-20 md:py-28 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-sm font-medium tracking-widest uppercase text-[var(--landing-accent)] mb-3"
            style={{ fontFamily: "var(--font-landing-body)" }}
          >
            What you can do
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--landing-heading)]"
            style={{ fontFamily: "var(--font-landing-display)" }}
          >
            Everything you need with ElementPay
          </motion.h2>
        </div>

        {/* Progress Indicators */}
        <div className="flex justify-center gap-3 mb-10">
          {features.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveCard(index)}
              className="group cursor-pointer p-2"
              aria-label={`Go to slide ${index + 1}`}
            >
              <div className="h-1 w-16 md:w-24 rounded-full overflow-hidden bg-gray-200">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    index === activeCard
                      ? "w-full bg-[var(--landing-accent)]"
                      : "w-0 group-hover:w-1/2 bg-[var(--landing-accent)]/40"
                  }`}
                />
              </div>
            </button>
          ))}
        </div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12"
        >
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left Column - Content */}
            <div className="flex flex-col justify-center order-2 lg:order-1 relative min-h-[280px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCard}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3
                    className="text-2xl lg:text-3xl font-bold text-[var(--landing-heading)] mb-4"
                    style={{ fontFamily: "var(--font-landing-display)" }}
                  >
                    {features[activeCard].title}
                  </h3>
                  <p
                    className="text-base lg:text-lg text-[var(--landing-muted)] mb-8 leading-relaxed"
                    style={{ fontFamily: "var(--font-landing-body)" }}
                  >
                    {features[activeCard].description}
                  </p>
                  <div className="space-y-3">
                    {features[activeCard].subFeatures.map((sub, subIdx) => (
                      <div
                        key={subIdx}
                        className="flex items-center gap-3 pb-3 border-b border-gray-100"
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            sub.active
                              ? "bg-[var(--landing-accent)]"
                              : "bg-gray-300"
                          }`}
                        />
                        <span
                          className="text-sm lg:text-base text-[var(--landing-body)]"
                          style={{ fontFamily: "var(--font-landing-body)" }}
                        >
                          {sub.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right Column - Image */}
            <div className="relative h-[280px] lg:h-[400px] rounded-2xl bg-[var(--landing-bg)] overflow-hidden order-1 lg:order-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCard}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 flex items-center justify-center p-6"
                >
                  <div className="relative w-full h-full">
                    <Image
                      src={features[activeCard].image.src}
                      alt={features[activeCard].image.alt}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 90vw, 500px"
                      priority={activeCard === 0}
                    />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;