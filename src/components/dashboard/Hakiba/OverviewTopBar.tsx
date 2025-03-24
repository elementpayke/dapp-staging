import { Plus, ArrowLeftRight } from 'lucide-react';
// topbar component
interface OverviewTopbarProps{
    onOpen: () => void; 
}

export default function OverviewTopbar( {onOpen} : OverviewTopbarProps){
    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">Hakiba</h1>
                <p className="text-sm text-gray-500">Hakiba lets you save in crypto and earn interest, and take loans</p>
            </div>

            <div className="hidden md:flex items-center gap-4">
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg"
                    onClick={onOpen}
                >
                    <Plus className="w-5 h-5" />
                    Take New Loan
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg">
                    <ArrowLeftRight className="w-5 h-5" />
                    Withdraw Savings
                </button>
            </div>
        </div>
    )
}

