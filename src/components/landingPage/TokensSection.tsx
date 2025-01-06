import React from "react";
import Image from "next/image";
import { Check } from "lucide-react";

// Import images directly
import tokensActions from "@/assets/Tokens Section/tokens-action.png";

// Constants for image metadata
const IMAGES = {
  tokensActions: {
    src: tokensActions,
    alt: "Token actions flow diagram",
    width: 600,
    height: 600,
  },
};

const TokensSection = () => {
  return (
    <div className="bg-[#d7d7fc] min-h-screen overflow-hidden">
      <div className="max-w-[1800px] mx-auto px-4 lg:px-8 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left Column - Text Content */}
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-gray-900">
              Your tokens can now do so much more
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-8">
              Your tokens can now pay for anything. What do you need to pay for
              today?
            </p>

            {/* Buttons and KYC text */}
            <div className="flex flex-wrap items-center gap-4">
              <button className="bg-gradient-to-r from-[#0514eb] to-[#de0413] text-white px-6 py-3 rounded-full text-lg font-medium hover:opacity-90 transition-all">
                Create a Wallet
              </button>
              <button className="bg-white text-gray-900 px-6 py-3 rounded-full text-lg font-medium hover:bg-gray-50 transition-all">
                Connect a Wallet
              </button>
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 rounded-full w-5 h-5 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
                <span className="text-gray-700">No KYC required</span>
              </div>
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="relative w-full h-[400px] lg:h-[600px]">
            <Image
              src={IMAGES.tokensActions.src}
              alt={IMAGES.tokensActions.alt}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokensSection;
