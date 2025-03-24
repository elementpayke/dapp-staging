"use client"

import { useState } from "react";
import OverviewTopbar from "../Hakiba/OverviewTopBar";
import OverviewMetrics from "../Hakiba/OverviewMetrics";
import OverviewRecentTransaction from "../Hakiba/OverviewRecentTransaction";
import QuickActions from "../Hakiba/QuickActions";
import LoanRequestModal from "../Hakiba/loan_request_modal";
import PayLoanModal from "../Hakiba/pay_loan_modal";

export default function HakibaPage() {
    const [showLoanRequestModal, setShowLoanRequestModal] = useState(false);
    const [ showPayLoanModal, setShowPayLoanModal ] = useState(false)

    return (
        <div className="px-2 sm:p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-64px)]">

            <div className="lg:bg-white w-full h-full py-8 px-2 lg:px-8 rounded- space-y-8">
                <LoanRequestModal show={showLoanRequestModal} onClose={() => setShowLoanRequestModal(false)} />
                <PayLoanModal show={showPayLoanModal} onClose={() => setShowPayLoanModal(false)} />
                <OverviewTopbar onOpen={() => setShowLoanRequestModal(true)} />
                <OverviewMetrics onOpen={() => setShowPayLoanModal(true)}/>
                <QuickActions onOpen={() => setShowLoanRequestModal(true)} />
                <div className="w-full border-b border-gray-200"></div>
                <OverviewRecentTransaction />
            </div>
        </div>
    )
}   

