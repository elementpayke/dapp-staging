"use client";
import React, { useState } from "react";
import { ChevronDown, MessageCircle } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "What are the opening hours?",
    answer:
      "Our co-working space is open 24/7 for all monthly members. Day pass users can access the space from 8:00 AM to 8:00 PM.",
  },
  {
    question: "Is the Wi-Fi free and public?",
    answer:
      "Yes, high-speed Wi-Fi is included free with all memberships and day passes. We provide a secure, private network for our members.",
  },
  {
    question: "What is the minimum amount I have to spend while staying here?",
    answer:
      "There is no minimum spend requirement beyond your membership or day pass fee. All amenities are included in your basic access fee.",
  },
  {
    question:
      "Do I get a refund if I pay for the monthly package and don't finish my time?",
    answer:
      "While we don't offer refunds for unused time, you can pause your membership for up to 30 days or transfer it to another person.",
  },
  {
    question: "Is there a package for startups?",
    answer:
      "Yes! We offer special startup packages that include dedicated desk space, meeting room credits, and networking events. Contact us for details.",
  },
  {
    question: "What are the payment modes if no credit card is required?",
    answer:
      "We accept bank transfers, mobile money payments, and cash. Contact our front desk for more payment options.",
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
            <div key={index} className="border-b border-gray-200">
              <button
                className="w-full text-left py-6 flex items-center justify-between transition-colors duration-200 hover:bg-gray-50"
                onClick={() => toggleAccordion(index)}
              >
                <div className="flex items-center gap-4">
                  <MessageCircle className="w-6 h-6 text-gray-400 flex-shrink-0" />
                  <span className="text-lg text-gray-900">{faq.question}</span>
                </div>
                <ChevronDown
                  className={`w-6 h-6 text-gray-400 transform transition-transform duration-200 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
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
