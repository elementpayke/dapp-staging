"use client";

// progress bar
import { useState } from "react";
import { TrendingUp } from "lucide-react";

export default function LoanMetrics() {
    return (
        <div className="w-full overflow-x-auto">
            <div className="flex gap-4 lg:gap-8 w-max md:w-full whitespace-nowrap md:whitespace-normal">
                {/* Borrowing Card */}
                <div className="w-72 md:w-1/3 sm:min-w-[280px] p-4 bg-white rounded-xl border shadow-sm space-y-3 lg:space-y-5">
                    <h2 className="text-gray-600 text-sm lg:text-lg">Borrowing</h2>

                    <p className="text-md lg:text-lg font-semibold text-gray-700">Your current limit</p>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-orange-400 h-1.5 rounded-full" style={{ width: "60%" }}></div>
                    </div>

                    {/* Borrowing Details */}
                    <div className="flex justify-between text-sm text-gray-500 font-medium">
                        <span className="text-gray-800">KES 3000 used</span>
                        <span>KES 5000</span>
                    </div>
                </div>


                {/* Savings Card 1 */}
                <div className="w-72 md:w-1/3 p-4 bg-white rounded-xl border shadow-sm space-y-3">
                    <h2 className="text-gray-600 text-md">Current active loan</h2>
                    <p className="text-xl lg:text-2xl font-bold text-gray-800">USDC 23.21</p>
                    <p className="text-green-500 text-xs font-medium flex items-center gap-1">
                        <TrendingUp size={15} className="text-green-500" />
                        5.2% from last month
                    </p>
                </div>

                {/* Savings Card 2 */}
                <div className="w-72 md:w-1/3 p-4 bg-white rounded-xl border shadow-sm space-y-3">
                    <h2 className="text-gray-600 text-md">Your savings</h2>
                    <p className="text-xl lg:text-2xl font-bold text-gray-800">USDC 23.21</p>
                    <p className="text-green-500 text-xs font-medium flex items-center gap-1">
                        <TrendingUp size={15} className="text-green-500" />
                        5.2% from last month
                    </p>
                    <button className="text-white bg-gray-400 py-1 px-2 rounded font-semibold text-sm">Withdraw</button>
                </div>
            </div>
        </div>
    );
}
