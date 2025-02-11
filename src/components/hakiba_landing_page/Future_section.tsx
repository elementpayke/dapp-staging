import image_one from "@/assets/image1.png"
import Image2 from "@/assets/image2.png";
import Image3 from "@/assets/image3.png";

export default function FutureSection() {
    return (
        <div className="bg-[#c7c7ff] py-16 md:py-24 min-h-[80vh] flex flex-col items-center justify-center">
            <div className="container mx-auto px-6">
                <h1 className="text-5xl md:text-6xl text-center font-bold text-black py-4">Empower Your Future with Hakiba Crypto Loans</h1>
                <p className="text-gray-700 text-xl md:text-lg text-center py-2">
                    Access secure and trust-backed crypto loans on Hakiba. Build your credit, borrow with confidence, and invest in your future.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
                    {/* Card 1 - Personal Loans */}
                    <div className="max-w-md rounded-2xl overflow-hidden min-h-[400px] p-6 flex flex-col items-center text-center">
                        <img 
                            src={image_one.src}
                            alt="Personal Crypto Loans" 
                            className="w-[220px] h-[220px] object-cover"
                        />
                        <h2 className="text-gray-700 text-2xl font-bold py-3">For Individuals</h2>
                        <p className="text-gray-500">
                            Get crypto-backed loans using digital assets as collateral. Build your trust-based credit profile and unlock new financial opportunities.
                        </p>
                        <button className="bg-[#0514eb] text-white px-6 py-3 rounded-full text-base font-medium hover:opacity-90 transition-all whitespace-nowrap mt-4">
                            Apply Now
                        </button>
                    </div>

                    {/* Card 2 - Business Loans */}
                    <div className="max-w-md rounded-2xl overflow-hidden min-h-[400px] p-6 flex flex-col items-center text-center">
                        <img 
                            src={Image2.src}
                            alt="Crypto Loans for Businesses" 
                            className="w-[220px] h-[220px] object-cover"
                        />
                        <h2 className="text-gray-700 text-2xl font-bold py-3">For Businesses</h2>
                        <p className="text-gray-500">
                            Scale your business with crypto loans. Secure funding without traditional banking restrictions and expand your operations seamlessly.
                        </p>
                        <button className="bg-[#0514eb] text-white px-6 py-3 rounded-full text-base font-medium hover:opacity-90 transition-all whitespace-nowrap mt-4">
                            Get Started
                        </button>
                    </div>

                    {/* Card 3 - Lenders */}
                    <div className="max-w-md rounded-2xl overflow-hidden min-h-[400px] p-6 flex flex-col items-center text-center">
                        <img 
                            src={Image3.src}
                            alt="Crypto Lending" 
                            className="w-[220px] h-[220px] object-cover"
                        />
                        <h2 className="text-gray-700 text-2xl font-bold py-3">For Lenders</h2>
                        <p className="text-gray-500">
                            Earn rewards by providing liquidity to borrowers. Lend securely with blockchain-backed transparency and trust verification.
                        </p>
                        <button className="bg-[#0514eb] text-white px-6 py-3 rounded-full text-base font-medium hover:opacity-90 transition-all whitespace-nowrap mt-4">
                            Start Lending
                        </button>
                    </div>
                </div>
            </div>

            {/* Get Involved Section */}
            <div className="mt-20 container mx-auto px-4">
                <h2 className="text-4xl md:text-5xl text-center font-bold text-black py-4">Get Involved</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                    {/* Deploy Smart Contract */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center text-center">
                        <div className="w-full h-52 md:h-64 flex items-center justify-center overflow-hidden">
                            <img 
                                src="https://files.oaiusercontent.com/file-Cd6SpD3ovidFgKsa6o1nAQ?se=2025-02-11T06%3A55%3A40Z&sp=r&sv=2024-08-04&sr=b&rscc=max-age%3D604800%2C%20immutable%2C%20private&rscd=attachment%3B%20filename%3Dfa45262a-7e2e-46fb-ab70-ee610695c38b.webp&sig=Rjnd3rjDAxX5A7yXzUyosvdmhnLqp8qY1DXheIMxufA%3D" 
                                alt="Deploy Smart Contract" 
                                className="w-full h-full object-cover rounded-lg"
                            />
                        </div>
                        <h3 className="text-gray-700 text-2xl font-bold py-3">Deploy a Smart Contract for Crypto Lending</h3>
                        <button className="bg-[#0514eb] text-white px-6 py-3 rounded-full text-base font-medium hover:opacity-90 transition-all mt-4">
                            Build with Hakiba
                        </button>
                    </div>

                    {/* Governance Participation */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center text-center">
                        <div className="w-full h-52 md:h-64 flex items-center justify-center overflow-hidden">
                            <img 
                                src="https://files.oaiusercontent.com/file-5X4JhHzvjBVB6msuDmssp1?se=2025-02-11T06%3A51%3A54Z&sp=r&sv=2024-08-04&sr=b&rscc=max-age%3D604800%2C%20immutable%2C%20private&rscd=attachment%3B%20filename%3D980d2b89-4af0-4cb2-913e-7ddeb43362c4.webp&sig=xysq09LDo1VZsh2JVjz1Sq2U4g0OrokMPsZrXZmqbMM%3D" 
                                alt="Crypto Governance" 
                                className="w-full h-full object-cover rounded-lg"
                            />
                        </div>
                        <h3 className="text-gray-700 text-2xl font-bold py-3">Vote on Protocol Proposals</h3>
                        <p className="text-gray-500 px-4">
                            Help shape the future of Hakiba by voting on proposals with governance tokens earned through platform participation.
                        </p>
                        <button className="bg-[#0514eb] text-white px-6 py-3 rounded-full text-base font-medium hover:opacity-90 transition-all mt-4">
                            Join Governance
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
}
