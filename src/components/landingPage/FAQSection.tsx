"use client";
import React, { useState } from "react";
import { ChevronDown, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
      "Spending crypto is simple! Pay directly with Ethereum or stablecoins. If the merchant doesn't accept crypto, ElementPay converts it to fiat and sends it to their M-Pesa or bank account.",
  },
  {
    question: "What are the fees?",
    answer:
      "Our fees start as low as just 1 KES! Whether you're buying a coffee, paying for transport, or doing a larger transaction, our low fees ensure you get the most value out of every payment.",
  },
  {
    question: "What do I need to sign up?",
    answer:
      "Just your email and a crypto wallet. Enter your email, verify with a one-time code, connect your wallet, and complete a quick identity check. That's it.",
  },
  {
    question: "Can I withdraw my crypto back to fiat?",
    answer:
      "Yes! Use our offramp service to convert crypto to fiat and withdraw directly to your M-Pesa or bank account effortlessly.",
  },
  {
    question: "Do I need a specific wallet to use ElementPay?",
    answer:
      "Any Ethereum-compatible wallet works, like MetaMask, Trust Wallet, or Coinbase Wallet. Just connect and start transacting.",
  },
  {
    question: "Can I use ElementPay for small payments like KES 10?",
    answer:
      "Absolutely! ElementPay is built for micropayments. Pay as little as KES 1 using your crypto wallet. Perfect for everyday spending.",
  },
  {
    question: "I have another question.",
    answer:
      "We are always happy to help! Reach out to us via email or connect with us on our social media platforms for assistance.",
  },
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faqs" className="bg-white py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-14">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-sm font-medium tracking-widest uppercase text-[var(--landing-accent)] mb-3"
            style={{ fontFamily: "var(--font-landing-body)" }}
          >
            FAQ
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--landing-heading)] mb-3"
            style={{ fontFamily: "var(--font-landing-display)" }}
          >
            Got a question?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="text-[var(--landing-muted)]"
            style={{ fontFamily: "var(--font-landing-body)" }}
          >
            <a
              href="mailto:elementpay.info@gmail.com"
              className="text-[var(--landing-accent)] hover:underline"
            >
              Contact us
            </a>{" "}
            if your question has not been answered.
          </motion.p>
        </div>

        {/* FAQ Items */}
        <div className="divide-y divide-gray-100">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`transition-colors duration-200 ${
                openIndex === index ? "border-l-2 border-l-[var(--landing-accent)] -ml-px pl-px" : ""
              }`}
            >
              <button
                className="w-full text-left py-5 px-1 flex items-center justify-between group"
                onClick={() => toggleAccordion(index)}
              >
                <div className="flex items-center gap-3">
                  <MessageCircle
                    className={`w-5 h-5 flex-shrink-0 transition-colors ${
                      openIndex === index
                        ? "text-[var(--landing-accent)]"
                        : "text-gray-300 group-hover:text-gray-400"
                    }`}
                  />
                  <span
                    className={`text-base font-medium transition-colors ${
                      openIndex === index
                        ? "text-[var(--landing-heading)]"
                        : "text-[var(--landing-body)] group-hover:text-[var(--landing-heading)]"
                    }`}
                    style={{ fontFamily: "var(--font-landing-body)" }}
                  >
                    {faq.question}
                  </span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 flex-shrink-0 transition-all duration-200 ${
                    openIndex === index
                      ? "text-[var(--landing-accent)] rotate-180"
                      : "text-gray-300"
                  }`}
                />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div
                      className="pl-9 pr-4 pb-5 text-sm text-[var(--landing-muted)] leading-relaxed"
                      style={{ fontFamily: "var(--font-landing-body)" }}
                    >
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;