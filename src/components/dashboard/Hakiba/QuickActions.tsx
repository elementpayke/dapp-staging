"use client";

interface QuickActionsProps {
    onOpen: () => void;
}
export default function QuickActions({ onOpen }: QuickActionsProps) {
    return (
        <div className="lg:hidden rounded-xl shadow-sm space-y-4">
            {/* Fiat Balance Section */}
            <div className="flex justify-between items-center border py-2 px-3 rounded-full shadow-sm">
                <span className="text-gray-500 text-sm">Fiat Balance</span>
                <div className="flex items-center gap-2 ">
                    <span className="text-gray-800 font-semibold">KES 9.87</span>
                    <span className="text-red-500 text-sm font-medium">▼ 21.28%</span>
                </div>
            </div>

            {/* Quick Actions Header */}
            <h2 className="text-gray-700 font-medium text-sm">Quick Actions</h2>

            {/* Action Buttons */}
            <div className="flex items-center w-full p-1 bg-blue-50 rounded-full">
                {/* Request Loan Button */}
                <button className="flex-1 py-3 text-white font-medium text-sm rounded-full bg-gradient-to-r from-blue-800 to-red-600"
                    onClick={onOpen}
                >
                    Request loan
                </button>
                
                {/* Credit Score Button */}
                <button className="flex-1 py-2 text-gray-600 font-medium text-sm rounded-full">
                    Credit score
                </button>
            </div>
        </div>
    );
}
