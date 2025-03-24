"use client";

export default function CreditScoreOverviewCard() {
    return (
        <div className="flex-1 min-h-full p-6 bg-white rounded-xl border shadow-sm space-y-4 text-center flex flex-col">
            {/* Title and Badge */}
            <div className="flex justify-between items-center">
                <h2 className="text-gray-900 text-xl font-semibold">Credit Score</h2>
                <span className="bg-green-100 text-green-600 text-sm px-3 py-1 rounded-full">A+</span>
            </div>

            {/* Score Circle */}
            <div className="flex justify-center flex-1">
                <div className="relative w-20 h-20 flex items-center justify-center rounded-full border-4 border-green-500">
                    <span className="text-2xl font-bold text-gray-800">785</span>
                </div>
            </div>

            {/* Score Details */}
            <div className="text-gray-600 space-y-4 text-sm">
                <div className="flex justify-between">
                    <span>Score range</span>
                    <span className="text-gray-800 font-medium">300-850</span>
                </div>
                <div className="flex justify-between">
                    <span>Score change</span>
                    <span className="text-green-500 font-medium">+15 ↑</span>
                </div>
                <div className="flex justify-between">
                    <span>Account Age</span>
                    <span className="text-gray-800 font-medium">1.5 years</span>
                </div>
            </div>
        </div>
    );
}
