export default function CreditSection(){
    return (
        <div className="bg-gradient-to-b from-white to-[#c7c7ff] py-16 md:py-24 h-[calc(80vh)] flex flex-col items-center justify-center">
            <div className="container mx-auto">
                <h1 className="text-7xl md:text-5xl text-center font-bold text-black py-2">Give Credit. Get credit</h1>
                <p className="text-gray-700  md:text-lg text-4xl  text-center py-2">Fund what matters with those you trust</p>
                
                <div className="flex space-x-10 w-full justify-center py-10 px-20">
                    <div className="max-w-3xl rounded-2xl overflow-hidden h-[500px]">
                        <img src="https://framerusercontent.com/images/JbgGiPnuJFG7ivxyOjStc9DkaQg.png?scale-down-to=1024" alt="" className="w-full h-2/3" />
                        <div className="bg-white py-4 px-4 rounded-b-xl">
                            <h3 className="text-gray-700 text-xl font-bold pb-3">Your personal credit line</h3>
                            <p className="text-gray-500">Build a personal on-chain credit line with vouches from those who trust you. Draw from that credit line whenever you need</p>
                        </div>
                    </div>

                    <div className="max-w-xl rounded-2xl overflow-hidden h-[500px]">
                        <img src="https://framerusercontent.com/images/5lVnfiqUzFFQO60OXnOT4AflaU.png?scale-down-to=512" alt="" className="w-full  h-2/3" /> 
                        <div className="bg-white py-4 px-4 rounded-b-xl">
                            <h3 className="text-gray-700 text-xl font-bold pb-3">Your personal credit line</h3>
                            <p className="text-gray-500">Build a personal on-chain credit line with vouches from those who trust you. Draw from that credit line whenever you need</p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )       
}