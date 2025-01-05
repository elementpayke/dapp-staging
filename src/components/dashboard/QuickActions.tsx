import { FC } from "react";

const QuickActions: FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-black">Quick Pay</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Button Group with Light Blue Background */}
        <div className="flex bg-blue-50 rounded-full">
          <button className="bg-indigo-600 text-white px-6 py-3 rounded-full font-medium hover:bg-indigo-700 transition-colors">
            Send Crypto
          </button>
          <button className="px-6 py-3 text-gray-700 font-medium hover:bg-blue-100 rounded-full transition-colors">
            Deposit Crypto
          </button>
        </div>

        {/* Fiat Balance Button */}
        <button className="px-6 py-3 text-gray-700 font-medium rounded-full border border-gray-200 hover:bg-gray-50 transition-colors">
          Fiat Balance
        </button>

        {/* Amount Display */}
        <div className="ml-auto flex items-center gap-2 px-6 py-3 rounded-full border border-gray-200">
          <span className="font-medium text-gray-900">KES 89,899.87</span>
          <span className="flex items-center text-green-500 text-sm">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-4 h-4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
            1.28%
          </span>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
