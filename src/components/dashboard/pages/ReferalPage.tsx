"use client"

import { useState } from "react";
import ReferralTopBar from "../Hakiba/referral_top_bar";
import ReferralMetrics from "../Hakiba/referral_metrics";
import ReferralHistoryTable from "../Hakiba/referral_history_table";
import HakibaReferralModal from "../Hakiba/hakiba_referral_modal";

export default function ReferralPage() {
    const [showReferralModal, setShowReferralModal] = useState(false);

    return (
        <div className="px-2 sm:p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-64px)]">

            <div className="lg:bg-white w-full h-full py-8 px-2 lg:px-8 rounded- space-y-8">
                <HakibaReferralModal show={showReferralModal} onClose={() => setShowReferralModal(false)} />
                <ReferralTopBar onOpen={() => setShowReferralModal(true)} />
                <ReferralMetrics onOpen={() => setShowReferralModal(true)}/>
                <div className="w-full border-b border-gray-200"></div>
                <ReferralHistoryTable />
            </div>
        </div>
    )
}   

