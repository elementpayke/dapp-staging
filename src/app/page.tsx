"use client";

import { useState, useEffect } from "react";
import Header from "@/components/landingPage/Header";
import LandingPage from "@/components/LandingPage";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function Home() {
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
          <LandingPage />
        </>
      )}
    </main>
  );
}
