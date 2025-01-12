import React from "react";

const LoadingSpinner = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-foreground/20 border-t-foreground animate-spin"></div>
        <div className="mt-4 text-center text-foreground/80 text-sm">
          Loading...
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
