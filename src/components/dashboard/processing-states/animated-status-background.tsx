import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink } from "lucide-react";
import React from "react";
import { useProcessingPopupStore } from "@/lib/processingPopupStore";

type TransactionDetails = {
  failureReason?: string;
};

type AnimatedStatusBackgroundProps = {
  status: "processing" | "success" | "failed";
  transactionDetails: TransactionDetails;
  showTechnicalDetails: boolean;
  setShowTechnicalDetails: (show: boolean) => void;
  onClose: () => void;
};

export function AnimatedStatusBackground({
  onClose,
}: AnimatedStatusBackgroundProps) {
  const {
    status,
    transactionDetails,
    showTechnicalDetails,
    setShowTechnicalDetails,
  } = useProcessingPopupStore();
  return (
    <div className="absolute inset-0 overflow-hidden">
      {status === "processing" && (
        <>
          <motion.div
            className="absolute inset-0 opacity-10"
            style={{
              background: "linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)",
            }}
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%"],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />

          {[...Array(5)].map((_, i) => (
            <motion.div
              key={`circle-${i}`}
              className="absolute rounded-full bg-blue-500 opacity-5"
              style={{
                width: `${100 + i * 50}px`,
                height: `${100 + i * 50}px`,
                top: "50%",
                left: "50%",
                x: "-50%",
                y: "-50%",
              }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
                delay: i * 0.2,
              }}
            />
          ))}

          <svg
            className="absolute inset-0 w-full h-full opacity-5"
            xmlns="http://www.w3.org/2000/svg"
          >
            <motion.path
              d="M0,100 Q50,50 100,100 T200,100 T300,100 T400,100"
              stroke="#4299e1"
              strokeWidth="2"
              fill="transparent"
              initial={{ pathLength: 0, pathOffset: 1 }}
              animate={{ pathLength: 1, pathOffset: 0 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "loop",
                ease: "linear",
              }}
            />
            <motion.path
              d="M0,150 Q50,100 100,150 T200,150 T300,150 T400,150"
              stroke="#4299e1"
              strokeWidth="2"
              fill="transparent"
              initial={{ pathLength: 0, pathOffset: 1 }}
              animate={{ pathLength: 1, pathOffset: 0 }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                repeatType: "loop",
                ease: "linear",
                delay: 0.2,
              }}
            />
          </svg>
        </>
      )}

      {status === "success" && (
        <motion.div
          className="absolute inset-0 opacity-10"
          style={{
            background: "linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ duration: 1 }}
        />
      )}

      {status === "failed" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden relative"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <X size={20} />
            </button>
            <div className="p-6">
              <div className="flex items-center justify-center mb-5">
                <motion.div
                  className="bg-red-100 rounded-full p-3"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <svg
                    className="w-8 h-8 text-red-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </motion.div>
              </div>

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Unsupported Customer Type
                </h3>
                <p className="text-gray-600 text-base">
                  {transactionDetails.failureReason ||
                    "Your account is registered as a Credit Party customer, which is not compatible with this payment method. Please try a different payment option or contact our support team."}
                </p>
              </div>

              <motion.div
                className="bg-red-50 rounded-lg p-4 mb-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5">
                    <svg
                      className="h-5 w-5 text-red-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-red-700">
                      {transactionDetails.failureReason ||
                        "The payment could not be processed at this time."}
                    </p>
                  </div>
                </div>
              </motion.div>

              <div className="space-y-3 mb-5">
                <button
                  onClick={() =>
                    window.open("mailto:support@elementpay.com", "_blank")
                  }
                  className="w-full px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors font-medium flex items-center justify-center"
                >
                  <ExternalLink size={16} className="mr-2" />
                  Contact Support
                </button>
                <button
                  onClick={onClose}
                  className="w-full px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-colors font-medium"
                >
                  Return to Payment Options
                </button>
              </div>

              <div>
                <button
                  onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-sm text-gray-600">
                    Technical Details
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-500 transform transition-transform ${
                      showTechnicalDetails ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                <AnimatePresence>
                  {showTechnicalDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-2 bg-gray-50 rounded-lg overflow-hidden"
                    >
                      <div className="p-3">
                        <div className="text-xs text-gray-500 mb-1">
                          Error Code: CUST_TYPE_UNSUPPORTED
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
