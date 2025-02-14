export default function Partnership() {
    return (
        <div className="bg-gradient-to-r from-white to-[#c7c7ff] overflow-x-hidden h-[60vh] flex items-center">
            <div className="container mx-auto">
                {/* Section Title */}
                <div className="text-center mb-12 md:mb-16">
                    <div className="inline-flex flex-col items-center">
                        <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-[#546894] mb-4">
                            Backed By
                        </h2>
                        <div className="h-0.5 bg-[#a6a6a6] w-full"></div>
                    </div>
                </div>

                <div className="flex justify-center items-center space-x-20">
                    <img src="https://cdn.prod.website-files.com/65b25a7c1cf0ffce7d9287f1/65b7b3726a362e8421036e36_Base_Wordmark_Blue.png" alt="" className="w-1/5" />
                    <img src="https://www.cdnlogo.com/logos/l/35/lisk.svg" alt="" className="w-1/5" />
                    <img src="https://framerusercontent.com/images/0KcTAmzsCnfhqwFrs9HHNqOlcCM.png?scale-down-to=512" alt="" className="w-1/5" />
                    <img src="https://framerusercontent.com/images/cVplMHdEnLQX0BZQnSE95ylas.png" alt="" className="w-1/5" />
                </div>

            </div>
        </div >
    );
}

