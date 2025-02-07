"use client"

import { useState } from "react";
import LoansTopbar from "../Hakiba/LoanTopBar";
import LoanMetrics from "../Hakiba/LoanMetrics";
import OverviewRecentTransaction from "../Hakiba/OverviewRecentTransaction";
import LoanRequestModal from "../Hakiba/loan_request_modal";

export default function HakibaLoanPage() {
    const [showLoanRequestModal, setShowLoanRequestModal] = useState(false);

    return (
        <div className="px-2 sm:p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-64px)]">
            <div className="lg:bg-white w-full h-full py-8 px-2 lg:px-8 rounded space-y-5">
                <LoanRequestModal show={showLoanRequestModal} onClose={() => setShowLoanRequestModal(false)} />
                <LoansTopbar onOpen={() => setShowLoanRequestModal(true)} />
                <LoanMetrics />
                <div className="w-full border-b border-gray-200"></div>
                <OverviewRecentTransaction />
            </div>
        </div>
    )
}   

