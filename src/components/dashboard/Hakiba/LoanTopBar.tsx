import { Plus, ArrowLeftRight } from 'lucide-react';
// topbar component
interface LoansTopbarProps{
    onOpen: () => void; 
}

export default function LoansTopbar({ onOpen }: LoansTopbarProps) {
    return (
        <div className="lg:flex items-center justify-between space-y-7">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">My loans</h1>
                <p className="hidden sm:flex text-sm text-gray-500">Hakiba lets you save in crypto and earn interest, and take loans</p>
            </div>

            <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-400 rounded-lg w-1/2 lg:w-[200px]"
                    onClick={onOpen}
                >
                    <Plus className="w-5 h-5" />
                    Take New Loan
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg w-1/2">
                    <ArrowLeftRight className="w-5 h-5" />
                    Repay Loan
                </button>
            </div>
        </div>
    )
}

