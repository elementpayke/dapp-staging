"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Circle } from "lucide-react";

// Import images directly
import card1Image from "@/assets/features/card1.png";
import card2Image from "@/assets/features/card2.png";
import card3Image from "@/assets/features/card3.png";

// Constants for image metadata
const IMAGES = {
  card1: {
    src: card1Image,
    alt: "Pay to mobile number feature",
    width: 1200,
    height: 800,
  },
  card2: {
    src: card2Image,
    alt: "Deposit crypto feature",
    width: 1200,
    height: 800,
  },
  card3: {
    src: card3Image,
    alt: "Virtual cards feature",
    width: 1200,
    height: 800,
  },
};

const FeaturesSection = () => {
  const [activeCard, setActiveCard] = useState(0);

  const features = [
    {
      title: (
        <span className="bg-gradient-to-r from-[#0000FF] to-[#FF0000] bg-clip-text text-transparent">
          Pay to mobile number
        </span>
      ),
      description:
        "With ElementsPay, you can instantly pay or send money to a mobile number, using your crypto tokens in any wallet you own. Pay to a TILL, Pochi La Biashara or any PayBill.",
      image: IMAGES.card1,
      backgroundColor: "#fcf7f7",
      subFeatures: [
        { text: "Pay to M-PESA, or any bank", active: true },
        { text: "Make instant payments, no delays", active: false },
        { text: "Get real-time receipts", active: false },
      ],
    },
    {
      title: (
        <span className="bg-gradient-to-r from-[#0000FF] via-[#800080] to-[#FF0000] bg-clip-text text-transparent">
          Deposit crypto to your chosen wallet
        </span>
      ),
      description:
        "Funds running low on your wallet? Deposit USDC and tokens to your chosen wallet and keep them securely locked for future transactions. You watch your funds grow as the market changes.",
      image: IMAGES.card2,
      backgroundColor: "#f0faf9",
      subFeatures: [
        {
          text: "Deposit to your wallet from MPESA, Airtel Money or Bank",
          active: true,
        },
        { text: "Watch your funds appreciate", active: false },
        { text: "Secured wallet", active: false },
      ],
    },
    {
      title: (
        <span className="bg-gradient-to-r from-[#0000FF] to-[#FF0000] bg-clip-text text-transparent">
          Go borderless with virtual cards
        </span>
      ),
      description:
        "You can make purchases across borders using a virtual card. ElementsPay allows you to create a virtual card, much like a Visa or Mastercard. Use your crypto to pay for Netflix or buy goods on Google Play.",
      image: IMAGES.card3,
      backgroundColor: "#faf0fa",
      subFeatures: [
        { text: "Pay to M-PESA, Airtel Money or MTN", active: true },
        { text: "Make instant payments, no delays", active: false },
        { text: "Get real-time receipts", active: false },
      ],
    },
  ];

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveCard((current) => (current + 1) % features.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [features.length]);

  return (
    <div className="min-h-screen lg:h-screen bg-gradient-to-r from-[#F5F5F5] to-[#E6E6FF] py-4 lg:py-12 overflow-hidden">
      <div className="max-w-[1800px] mx-auto px-4 lg:px-8 h-full flex flex-col relative">
        {/* Section Title */}
        <div className="text-center mb-8 lg:mb-10">
          <div className="inline-flex flex-col items-center">
            <h2 className="text-3xl lg:text-4xl font-semibold text-[#546894] mb-3">
              What you can do with ElementsPay
            </h2>
            <div className="h-0.5 bg-[#a6a6a6] w-full"></div>
          </div>
        </div>

        {/* Navigation Progress Bars */}
        <div className="flex justify-center gap-2 mb-6 lg:mb-8">
          {features.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveCard(index)}
              className="p-4 cursor-pointer group"
              aria-label={`Go to slide ${index + 1}`}
            >
              <div
                className={`h-1 w-24 rounded-full transition-all duration-500 ${
                  index === activeCard
                    ? "bg-gradient-to-r from-[#0000FF] to-[#FF0000]"
                    : "bg-white group-hover:bg-gradient-to-r group-hover:from-[#0000FF] group-hover:to-[#FF0000] group-hover:opacity-50"
                }`}
              />
            </button>
          ))}
        </div>

        {/* Main Card Container */}
        <div className="bg-white rounded-[40px] shadow-lg p-8 lg:p-12 flex-grow">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 h-full overflow-hidden">
            {/* Left Column - Feature Content */}
            <div className="flex flex-col justify-center space-y-8 order-2 lg:order-1">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`transition-all duration-500 transform ${
                    index === activeCard
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 absolute translate-x-4"
                  }`}
                >
                  <h3 className="text-2xl lg:text-4xl font-semibold mb-4 lg:mb-5 leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-base lg:text-xl mb-8 text-[#666666] leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="space-y-4">
                    {feature.subFeatures.map((subFeature, subIndex) => (
                      <div
                        key={subIndex}
                        className="flex items-center gap-3 border-b border-gray-200 pb-3"
                      >
                        <Circle
                          className={`w-2.5 h-2.5 ${
                            subFeature.active
                              ? "fill-[#0000FF]"
                              : "fill-gray-300"
                          }`}
                        />
                        <span className="text-[#444444] text-sm lg:text-lg">
                          {subFeature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column - Image */}
            <div
              className={`relative h-[300px] lg:h-[500px] rounded-[32px] p-4 lg:p-8 order-1 lg:order-2 mb-6 lg:mb-0`}
              style={{ backgroundColor: features[activeCard].backgroundColor }}
            >
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-500 transform ${
                    index === activeCard
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 translate-x-full"
                  }`}
                >
                  <div className="relative w-full h-full flex items-center justify-center">
                    <div className="relative w-full h-full max-w-[90%] max-h-[90%]">
                      <Image
                        src={feature.image.src}
                        alt={feature.image.alt}
                        fill
                        className="object-contain object-center"
                        sizes="(max-width: 768px) 90vw, 600px"
                        priority={index === 0}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection;
