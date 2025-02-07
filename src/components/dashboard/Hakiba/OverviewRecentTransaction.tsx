"use client";

import { ArrowDown, ArrowRight, Layers } from "lucide-react";

export default function OverviewRecentTransaction() {
    const transactions = [
        {
            id: 1,
            title: "Staked ETH",
            date: "Mar 15, 2025",
            type: "Staked",
            amount: "+0.15 ETH",
            currency: "KES 2000",
            icon: <ArrowRight className="text-green-500" size={20} />,
            amountColor: "text-black",
        },
        {
            id: 2,
            title: "Rewards Claimed",
            date: "Mar 14, 2025",
            type: "Rewards",
            amount: "+0.15 ETH",
            currency: "KES 2000",
            icon: <Layers className="text-blue-500" size={20} />,
            amountColor: "text-black",
        },
        {
            id: 3,
            title: "Loan Payment",
            date: "Mar 12, 2025",
            type: "Loan",
            amount: "-0.12 BTC",
            currency: "KES 2000",
            icon: <ArrowDown className="text-orange-500" size={20} />,
            amountColor: "text-red-500",
        },
    ];

    return (
        <div className="w-full p-4 bg-white rounded-xl shadow-sm flex-1">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-gray-600 text-md font-semibold">Recent Transactions</h2>
                <button className="text-blue-600 font-bold text-sm">View All</button>
            </div>

            <div className="space-y-4">
                {transactions.map((transaction, index) => (
                    <div key={transaction.id} className={`flex justify-between items-center py-4 ${index < transactions.length - 1 ? "border-b" : ""} rounded-lg`}>
                        <div className="flex items-center space-x-3">
                            <div className={`p-2 ${transaction.type === "Staked" ? "bg-green-100" : transaction.type === "Rewards" ? "bg-blue-100" : "bg-orange-100"} rounded-lg`}>
                                {transaction.icon}
                            </div>
                            <div>
                                <h3 className="text-sm text-gray-600 font-semibold">{transaction.title}</h3>
                                <p className="text-xs text-gray-500">{transaction.date}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className={`text-sm font-semibold ${transaction.amountColor}`}>{transaction.amount}</p>
                            <p className="text-xs text-gray-500">{transaction.currency}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
