import React, { useState, useEffect, useCallback, useMemo } from "react";

interface LoadingSpinnerProps {
  onComplete?: () => void;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ onComplete }) => {
  const phrases = useMemo(
    () => ["Fast", "Fast, Secure", "Fast, Secure & No KYC Required"],
    []
  );

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [hasCompletedOneIteration, setHasCompletedOneIteration] =
    useState(false);

  const handleComplete = useCallback(() => {
    if (hasCompletedOneIteration && onComplete) {
      onComplete();
    }
  }, [hasCompletedOneIteration, onComplete]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPhraseIndex < phrases.length - 1) {
        setCurrentPhraseIndex((prev) => prev + 1);
      } else {
        setHasCompletedOneIteration(true);
        handleComplete();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [currentPhraseIndex, phrases.length, handleComplete]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-r from-white to-[#C7C7FF] backdrop-blur-sm">
      <div className="relative flex flex-col items-center">
        {/* ElementsPay Logo */}
        <div className="mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
            <div className="w-6 h-6 bg-white rounded-sm"></div>
          </div>
        </div>

        {/* Spinner */}
        <div className="h-16 w-16 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>

        {/* Progressive Sentence with specified gradient colors */}
        <div className="mt-6 min-h-6 text-center">
          <span className="text-lg font-medium bg-gradient-to-r from-[#0514eb] to-[#de0413] bg-clip-text text-transparent transition-all duration-300 ease-in-out">
            {phrases[currentPhraseIndex]}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
