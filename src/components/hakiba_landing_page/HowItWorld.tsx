export default function HowItWorks() {
    return (
        <div className="bg-gradient-to-r from-white to-[#c7c7ff] py-16 md:py-24 min-h-[calc(80vh)] flex flex-col items-center justify-center">
            <div className="container mx-auto">
                <h1 className="text-7xl text-center font-bold text-black py-2">Borrow & Lend with Confidence</h1>
                <p className="text-gray-700 text-xl text-center py-2">Access secure crypto loans backed by trust and transparency</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full flex justify-center py-10 px-20 mx-auto">
                    {/* Loan Process Steps */}
                    {["Deposit Collateral", "Get Instant Loan", "Manage Loan", "Repay & Unlock"].map((title, index) => (
                        <div key={index} className="max-w-xl rounded-2xl overflow-hidden min-h-[700px] bg-gradient-to-r from-white to-[#c7c7ff] flex flex-col items-center shadow-2xl">
                            <div className="flex justify-center items-center">
                                <video 
                                    src="https://framerusercontent.com/assets/gUzpysBSJUcPBUVtwFKR7VIKw.mp4" 
                                    className="w-full h-2/3 flex-1"
                                    autoPlay
                                    loop
                                    muted                            
                                />
                            </div>
                            <div className="bg-white py-6 px-6 rounded-b-xl w-full">
                                <h3 className="text-gray-900 text-3xl font-bold pb-3">{title}</h3>
                                <p className="text-gray-500 text-2xl">
                                    {index === 0 && "Securely deposit crypto assets as collateral to access loans."}
                                    {index === 1 && "Instantly receive stablecoin loans without intermediaries."}
                                    {index === 2 && "Easily track and manage your loan terms and interest rates."}
                                    {index === 3 && "Repay your loan to reclaim your collateral, hassle-free."}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
