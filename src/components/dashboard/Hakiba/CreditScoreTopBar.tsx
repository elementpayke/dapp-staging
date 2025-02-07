import { CloudUpload } from 'lucide-react';

// topbar component
export default function CreditScoreTopBar(){
    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">Credit score</h1>
                <p className="text-sm text-gray-500">Last update jan 15, 2025</p>
            </div>

            <div className="hidden md:flex items-center gap-4">
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg">
                    <CloudUpload className="w-5 h-5" />
                    Upload statement
                </button>
            </div>
        </div>
    )
}

