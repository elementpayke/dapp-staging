import React, { useState, useEffect } from 'react';

const PaymentProcessing = ({ amount, recipient }) => {
  const [timeRemaining, setTimeRemaining] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Processing Payment</h2>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-200 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse delay-150"></div>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse delay-300"></div>
            </div>
          </div>
          <div className="mb-4">
            <p>Sending {amount} to {recipient}</p>
          </div>
          <div className="text-center text-gray-500 mb-4">
            {timeRemaining} seconds remaining
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentProcessing;