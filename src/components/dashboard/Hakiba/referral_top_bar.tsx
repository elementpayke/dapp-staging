import { Plus, ArrowLeftRight } from 'lucide-react';
// topbar component
interface ReferralTopBarProps{
    onOpen: () => void; 
}

export default function ReferralTopBar( {onOpen} : ReferralTopBarProps){
    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">Referral</h1>
                <p className="text-sm text-gray-500">Refer your friends or the Element pay user to the hakiba loan facility</p>
            </div>

            <div className="hidden md:flex items-center gap-4">
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg"
                    onClick={onOpen}
                >
                    <Plus className="w-5 h-5" />
                    New Referral
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg">
                    <ArrowLeftRight className="w-5 h-5" />
                    Claim rewards
                </button>
            </div>
        </div>
    )
}

