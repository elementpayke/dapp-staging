"use client";
import { HandCoinsIcon } from "lucide-react";

export default function CreditScoreFactors() {
    const factors = [
        { title: "Repayment behavior", value: 98, label: "Excellent", color: "bg-green-500", icon: <HandCoinsIcon /> },
        { title: "Credit Utilization", value: 75, label: "Good", color: "bg-green-500", icon: <HandCoinsIcon /> },
        { title: "Credit Age", value: 60, label: "Fair", color: "bg-orange-500", icon: <HandCoinsIcon /> },
    ];

    return (
        <div className="flex-1 min-h-full border rounded-xl border-gray-200 p-4 bg-white shadow-sm flex flex-col space-y-3">
            {factors.map((factor, index) => (
                <div key={index} className="p-4 bg-white rounded-xl border shadow-sm space-y-2 flex-1">
                    {/* Title & Icon */}
                    <div className="flex items-center justify-between">
                        <h3 className="text-gray-800 text-sm font-semibold flex items-center gap-2">
                            {factor.icon}
                            {factor.title}
                        </h3>
                        <span className="text-gray-600 text-sm font-medium">{factor.value}%</span>
                    </div>

                    {/* Label */}
                    <p className="text-gray-500 text-xs">{factor.label}</p>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className={`h-2.5 rounded-full ${factor.color}`} style={{ width: `${factor.value}%` }}></div>
                    </div>
                </div>
            ))}
        </div>
    );
}
