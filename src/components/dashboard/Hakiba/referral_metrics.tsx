"use client";
interface ReferralMetricsProps{
    onOpen: () => void; 
}
export default function ReferralMetrics( { onOpen } : ReferralMetricsProps ){
    return (
        <div className="w-full overflow-x-auto">
            <div className="flex gap-4 lg:gap-8 w-max md:w-full whitespace-nowrap md:whitespace-normal">
                {/* Active Loan Card */}
                <div className="w-72 md:w-1/3 sm:min-w-[280px] p-4 bg-white rounded-xl border shadow-sm space-y-3 lg:space-y-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-gray-600 text-sm lg:text-lg">Your wallet balance</h2>
                        <button className="border border-blue-600 text-blue-600 rounded-lg text-sm px-2 py-1"
                            onClick={onOpen}
                        >
                            Withdraw
                        </button>
                    </div>
                    <p className="text-xl lg:text-2xl font-bold text-gray-800">USDC 45.99</p>
                    <p className="text-gray-500 text-xs lg:text-sm space-x-3">
                        <span>Repayment period</span>
                        <span className="text-orange-500 font-semibold">23 days left</span>
                    </p>
                </div>

                {/* Savings Card 1 */}
                <div className="w-72 md:w-1/3 p-4 bg-white rounded-xl border shadow-sm space-y-5">
                    <h2 className="text-gray-600 text-md">Total Referrals</h2>
                    <p className="text-lg font-bold text-gray-800"> Approved 5</p>
                    <p className="text-blue-500 text-sm font-medium"> 2 pending</p>
                </div>

                {/* Savings Card 2 */}
                <div className="w-72 md:w-1/3 p-4 bg-white rounded-xl border shadow-sm space-y-5">
                    <h2 className="text-gray-600 text-md">Your guarantee</h2>
                    <p className="text-2xl font-bold text-gray-800">USDC 10.21</p>
                    <p className="text-blue-500 text-sm font-medium">APY: 1.5%</p>
                </div>
            </div>
        </div>
    );
}
