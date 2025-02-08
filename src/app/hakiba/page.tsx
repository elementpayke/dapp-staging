"use client";

import { useState, useEffect } from "react";
import Header from "@/components/hakiba_landing_page/header_section";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import Hero from "@/components/hakiba_landing_page/HeroSection";
import WhyWeRock from "@/components/hakiba_landing_page/WhyWeRock";
import Footer from "@/components/landingPage/Footer";
export default function Hakiba() {
    const [isLoading, setIsLoading] = useState(true);
    const [isAppReady, setIsAppReady] = useState(false);

    useEffect(() => {
        // Simulate checking if everything is loaded
        const checkLoading = () => {
            setIsAppReady(true);
        };

        // Add a small delay to prevent flash of loading state
        const timeoutId = setTimeout(checkLoading, 1000);

        return () => clearTimeout(timeoutId);
    }, []);

    const handleLoadingComplete = () => {
        // Only hide the loading spinner if the app is ready AND the spinner has completed one iteration
        if (isAppReady) {
            setIsLoading(false);
        }
    };

    return (
        <main>
            {isLoading ? (
                <LoadingSpinner onComplete={handleLoadingComplete} />
            ) : (
                <>
                    <Header />
                    <Hero />
                    <WhyWeRock />
                    <Footer />
                </>
            )}
        </main>
    );
}
