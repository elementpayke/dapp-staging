"use client";

import { useState, useEffect } from "react";
import Header from "@/components/landingPage/Header";
import LandingPage from "@/components/LandingPage";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate checking if everything is loaded
    const checkLoading = () => {
      setIsLoading(false);
    };

    // Add a small delay to prevent flash of loading state
    const timeoutId = setTimeout(checkLoading, 1000);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <main>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <Header />
          <LandingPage />
        </>
      )}
    </main>
  );
}
