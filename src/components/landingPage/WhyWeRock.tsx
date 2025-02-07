import React from "react";
import { Wallet, ShieldCheck, Clock } from "lucide-react";

const WhyWeRock = () => {
  const features = [
    {
      icon: Wallet,
      title: "Connect Multiple Wallets",
      description:
        "Connect multiple wallets to your ElementPay account and send and deposit crypto in any of them instantly.",
    },
    {
      icon: ShieldCheck,
      title: "No KYC needed",
      description:
        "We don't want to know you or what you do with your accounts. We simply enable you to transact seamlessly.",
    },
    {
      icon: Clock,
      title: "Pay for anything. No waiting times",
      description:
        "When you pay, it reflects instantly. And now you can use your tokens to pay for any of your bill.",
    },
  ];

  return (
    <div className="bg-gradient-to-r from-white to-[#c7c7ff] py-16 md:py-24">
      <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Section Title */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex flex-col items-center">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-[#546894] mb-4">
              Why we rock!
            </h2>
            <div className="h-0.5 bg-[#a6a6a6] w-full"></div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex flex-col items-start text-left p-6"
            >
              <div className="mb-4 p-3 bg-[#e6e6e8] rounded-full shadow-sm relative">
                <svg width="32" height="32">
                  <defs>
                    <linearGradient
                      id={`gradient-${index}`}
                      x1="0%"
                      y1="50%"
                      x2="100%"
                      y2="50%"
                    >
                      <stop offset="0%" stopColor="#0514eb" />
                      <stop offset="100%" stopColor="#de0413" />
                    </linearGradient>
                  </defs>
                  <feature.icon
                    size={32}
                    className="w-8 h-8"
                    style={{
                      stroke: `url(#gradient-${index})`,
                      strokeWidth: 2,
                    }}
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WhyWeRock;
