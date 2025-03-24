import React from "react";

const creditHistory = [
    { date: "Feb 1, 2025", amount: "0.003 ETH", status: "Active", repayment: "Due in 10 days", statusColor: "bg-green-100 text-green-600" },
    { date: "Dec 17, 2024", amount: "0.003 ETF", status: "Default", repayment: "Not repaid", statusColor: "bg-red-100 text-red-600" },
    { date: "Jan 15, 2025", amount: "44 USDC", status: "Repaid", repayment: "Before due date", statusColor: "bg-green-100 text-green-600" },
];

export default function CreditHistoryTable() {
    return (
        <div className="w-full bg-white p-6 rounded-xl border shadow-sm">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Credit History</h2>
                <button className="text-blue-600 text-sm border border-blue-500 px-3 py-1 rounded-full">
                    All time ▼
                </button>
            </div>

            {/* Table (Desktop) */}
            <div className="hidden md:block w-full overflow-x-auto">
                <table className="w-full border-collapse">
                    {/* Table Header */}
                    <thead>
                        <tr className="text-gray-500 text-sm border-b">
                            <th className="text-left pt-4 pb-3">Date</th>
                            <th className="text-left pt-4 pb-3">Amount</th>
                            <th className="text-left pt-4 pb-3">Status</th>
                            <th className="text-left pt-4 pb-3">Repayment</th>
                        </tr>
                    </thead>
                    {/* Table Body */}
                    <tbody>
                        {creditHistory.map((entry, index) => (
                            <tr key={index} className="text-gray-800 text-sm border-b">
                                <td className="py-4">{entry.date}</td>
                                <td className="py-4">{entry.amount}</td>
                                <td className="py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${entry.statusColor}`}>
                                        {entry.status}
                                    </span>
                                </td>
                                <td className="py-3">{entry.repayment}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
                {creditHistory.map((entry, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg shadow-sm">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-gray-700 text-sm">{entry.date}</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${entry.statusColor}`}>
                                {entry.status}
                            </span>
                        </div>
                        <p className="text-gray-900 font-medium">{entry.amount}</p>
                        <p className="text-gray-500 text-sm">Repayment: {entry.repayment}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
