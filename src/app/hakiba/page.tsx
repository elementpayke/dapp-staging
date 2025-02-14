"use client";

import { useState, useEffect } from "react";
import Header from "@/components/hakiba_landing_page/header_section";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import Hero from "@/components/hakiba_landing_page/HeroSection";
import WhyWeRock from "@/components/hakiba_landing_page/WhyWeRock";
import Footer from "@/components/landingPage/Footer";
import Partnership from "@/components/hakiba_landing_page/partnership";
import CreditSection from "@/components/hakiba_landing_page/credit_section";
import HowItWorks from "@/components/hakiba_landing_page/HowItWorld";
import FutureSection from "@/components/hakiba_landing_page/Future_section";

export default function Hakiba() {
    const [isLoading, setIsLoading] = useState(true);
    const [isAppReady, setIsAppReady] = useState(false);
    const [timeLeft, setTimeLeft] = useState(14 * 24 * 60 * 60); // 2 weeks in seconds

    useEffect(() => {
        const checkLoading = () => setIsAppReady(true);
        const timeoutId = setTimeout(checkLoading, 1000);
        return () => clearTimeout(timeoutId);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds) => {
        const days = Math.floor(seconds / (24 * 60 * 60));
        const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((seconds % (60 * 60)) / 60);
        const secs = seconds % 60;
        return `${days}d ${hours}h ${minutes}m ${secs}s`;
    };

    return (
        <main>
            {isLoading ? (
                <LoadingSpinner onComplete={() => setIsLoading(false)} />
            ) : (
                <>
                    <Header />
                    <Hero />
                    <Partnership />
                    <HowItWorks />
                    <FutureSection />
                    <WhyWeRock />
                    
                    {/* Waitlist Section */}
                    <div className="bg-[#c7c7ff] py-16 md:py-24 min-h-[80vh] flex flex-col items-center justify-center">
                        <div className="container mx-auto text-center">
                            <h1 className="text-7xl font-bold text-black py-2">Give Credit. Get Credit</h1>
                            <p className="text-gray-700 text-4xl py-2">Fund what matters with those you trust</p>
                            <p className="text-gray-600 text-2xl mt-4">Launching in: <span className="font-bold text-black">{formatTime(timeLeft)}</span></p>
                            <div className="mt-6">
                                <input type="email" placeholder="Enter your email" className="px-6 py-3 rounded-full text-black text-lg border-2 border-gray-400 focus:outline-none focus:border-[#0514eb]" />
                                <button className="bg-[#0514eb] text-white px-6 py-3 rounded-full text-lg font-medium hover:opacity-90 transition-all ml-3">
                                    Subscribe to Waitlist
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <Footer />
                </>
            )}
        </main>
    );
}
