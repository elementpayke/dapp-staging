"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";

interface LoadingSpinnerProps {
  onComplete?: () => void;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ onComplete }) => {
  const phrases = useMemo(
    () => [
      "Initializing secure environment...",
      "Fetching latest rates...",
      "Preparing your dashboard...",
    ],
    []
  );

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [hasCompletedOneIteration, setHasCompletedOneIteration] = useState(false);

  const handleComplete = useCallback(() => {
    if (hasCompletedOneIteration && onComplete) {
      onComplete();
    }
  }, [hasCompletedOneIteration, onComplete]);

  // Handle phrases cycle
  useEffect(() => {
    const totalDuration = 2500; // Total time for the loader
    const intervalTime = totalDuration / phrases.length;

    const phraseTimer = setInterval(() => {
      setCurrentPhraseIndex((prev) => {
        if (prev < phrases.length - 1) {
          return prev + 1;
        } else {
          setHasCompletedOneIteration(true);
          handleComplete();
          clearInterval(phraseTimer);
          return prev;
        }
      });
    }, intervalTime);

    // Smooth progress bar animation
    let startTimestamp: number | null = null;
    const animateProgress = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progressTime = timestamp - startTimestamp;
      const currentProgress = Math.min((progressTime / totalDuration) * 100, 100);
      setProgress(currentProgress);

      if (progressTime < totalDuration) {
        requestAnimationFrame(animateProgress);
      }
    };
    requestAnimationFrame(animateProgress);

    return () => {
      clearInterval(phraseTimer);
    };
  }, [phrases.length, handleComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--ep-bg)] backdrop-blur-xl transition-colors duration-500">
      <div className="relative flex flex-col items-center w-full max-w-xs sm:max-w-sm px-6">
        
        {/* Glow Effect / Backdrop Logo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[var(--ep-accent)]/20 rounded-full blur-3xl" />
        
        {/* Logo */}
        <div className="relative mb-5 transform transition-transform duration-700 hover:scale-105">
           <div className="w-14 h-14 rounded-2xl bg-[var(--ep-accent)] flex items-center justify-center shadow-[0_4px_20px_rgba(67,57,202,0.4)] relative overflow-hidden">
               {/* Shine effect */}
               <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]" />
               <div className="w-5 h-5 rounded-md bg-white shadow-sm z-10"></div>
           </div>
        </div>

        {/* Brand Name */}
        <h2 className="text-xl font-bold text-[var(--ep-heading)] tracking-tight mb-8">
          ElementPay
        </h2>

        {/* Sleek Progress Bar Container */}
        <div className="w-full h-1.5 bg-[var(--ep-border)] rounded-full overflow-hidden mb-4 relative drop-shadow-sm">
          {/* Progress fill track */}
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[var(--ep-accent)] to-[#a855f7] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Dynamic Loading Text */}
        <div className="h-6 w-full text-center relative overflow-hidden flex items-center justify-center">
            {phrases.map((phrase, index) => (
              <span
                key={phrase}
                className={`absolute w-full text-sm font-medium transition-all duration-500 transform ${
                  index === currentPhraseIndex
                    ? "opacity-100 translate-y-0 text-[var(--ep-muted)]"
                    : index < currentPhraseIndex
                    ? "opacity-0 -translate-y-4"
                    : "opacity-0 translate-y-4"
                }`}
              >
                {phrase}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
