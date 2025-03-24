"use client"

import { useState } from "react";
import CreditScoreTopBar from "../Hakiba/CreditScoreTopBar";
import CreditScoreOverviewCard from "../Hakiba/credit_score_overview_card";
import CreditScoreFactors from "../Hakiba/credit_score_factors";
import CreditHistoryTable from "../Hakiba/credit_history_table";

export default function CreditScorePage() {
    return (
        <div className="px-2 sm:p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-64px)]">
            <div className="lg:bg-white w-full h-full py-8 px-2 lg:px-8 rounded- space-y-8">
                <CreditScoreTopBar />

                <div className="w-full flex flex-col md:flex-row flex-wrap space-y-8 md:space-y-0 md:space-x-10 items-stretch">
                    <CreditScoreOverviewCard />
                    <CreditScoreFactors />
                </div>

                <div className="w-full border-b border-gray-200"></div>
                <CreditHistoryTable />
            </div>
        </div>
    )
}   

