"use client";

interface TransactionInProgressModalProps {
    isOpen: boolean;
    onClose: () => void;
    phone_number: string;   
}

export default function TransactionInProgressModal({ isOpen, phone_number }: TransactionInProgressModalProps) {
    if (!isOpen) return null; // Ensure modal is only rendered when open

    const getPhoneNumberLastAndFirstFourDigits = (phone_number: string) => {
        const lastFourDigits = phone_number.slice(-2);
        const firstFourDigits = phone_number.slice(0, 2);
        return `${firstFourDigits}******${lastFourDigits}`;
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        >
            <div 
                className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-lg border border-[#A3A5C2] max-w-sm"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
            >
                <div className="flex flex-col items-center space-y-4">
                    {/* Preloader */}
                    <div className="w-8 h-8 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
                    <p className="mt-2 text-md text-center text-gray-600">
                        We have sent an STK push to your phone number {getPhoneNumberLastAndFirstFourDigits(phone_number)}. Enter your M-PESA PIN to finish the process.
                    </p>
                </div>
            </div>
        </div>
    );
}
