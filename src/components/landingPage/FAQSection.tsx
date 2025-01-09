"use client";
import React, { useState } from "react";
import { ChevronDown, MessageCircle } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "How do I deposit crypto with ElementPay?",
    answer:
      "You can easily deposit crypto using M-Pesa instantly. Simply connect or create your wallet and enjoy the seamless experience.",
  },
  {
    question: "How do I spend my crypto with ElementPay?",
    answer:
      "Spending crypto is simple with ElementPay! Pay directly with Ethereum or stablecoins. If the merchant doesn&apos;t accept crypto, ElementPay converts it to fiat and sends it to their M-Pesa or bank account.",
  },
  {
    question: "What are the fees?",
    answer:
      "ElementPay covers all transaction fees, ensuring you save money while using our services. Enjoy fast, secure, and cost-free transactions.",
  },
  {
    question: "What do I need to sign up?",
    answer:
      "Nothing! There&apos;s no complicated sign-up process. Just go to our website, link your wallet, and start using it immediately.",
  },
  {
    question: "Can I withdraw my crypto back to fiat?",
    answer:
      "Yes! Use our offramp service to convert crypto to fiat and withdraw directly to your M-Pesa or bank account effortlessly.",
  },
  {
    question: "Do I need a specific wallet to use ElementPay?",
    answer:
      "Any Ethereum-compatible wallet, like MetaMask, Trust Wallet, or Coinbase Wallet, works with ElementPay. Just connect and start transacting seamlessly.",
  },
  {
    question: "I have another question.",
    answer:
      "We are always happy to help! Reach out to us via email or connect with us on our social media platforms for any further questions or assistance.",
  },
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white py-16 md:py-24">
      <div className="max-w-[1800px] mx-auto px-4 lg:px-8">
        {/* Section Title */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-semibold text-gray-900 mb-4">
            Got a Question?
          </h2>
          <p className="text-lg text-gray-600">
            <span className="text-blue-600 hover:underline cursor-pointer">
              Contact us
            </span>{" "}
            if your question has not been answered.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`${
                openIndex === index
                  ? "border-b-2 border-gradient"
                  : "border-b border-gray-200"
              }`}
              style={{
                ...(openIndex === index
                  ? {
                      borderImage:
                        "linear-gradient(to right, #0514eb, #de0413) 1",
                    }
                  : {}),
              }}
            >
              <button
                className={`w-full text-left py-6 flex items-center justify-between transition-colors duration-200 hover:bg-gray-50`}
                onClick={() => toggleAccordion(index)}
              >
                <div className="flex items-center gap-4">
                  <MessageCircle
                    className={`w-6 h-6 ${
                      openIndex === index
                        ? "text-transparent bg-clip-text"
                        : "text-gray-400"
                    } flex-shrink-0`}
                    style={{
                      ...(openIndex === index && {
                        background:
                          "linear-gradient(to right, #0514eb, #de0413)",
                        WebkitBackgroundClip: "text",
                      }),
                    }}
                  />
                  <span
                    className={`text-lg ${
                      openIndex === index
                        ? "text-transparent bg-clip-text"
                        : "text-gray-900"
                    }`}
                    style={{
                      ...(openIndex === index && {
                        background:
                          "linear-gradient(to right, #0514eb, #de0413)",
                        WebkitBackgroundClip: "text",
                      }),
                    }}
                  >
                    {faq.question}
                  </span>
                </div>
                <ChevronDown
                  className={`w-6 h-6 ${
                    openIndex === index
                      ? "text-transparent bg-clip-text"
                      : "text-gray-400"
                  } transform transition-transform duration-200 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                  style={{
                    ...(openIndex === index && {
                      background: "linear-gradient(to right, #0514eb, #de0413)",
                      WebkitBackgroundClip: "text",
                    }),
                  }}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  openIndex === index ? "max-h-48 mb-6" : "max-h-0"
                }`}
              >
                <div className="pl-10 pr-4 text-gray-600">{faq.answer}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQSection;
