import React, { useState } from 'react';
import { validateKenyanPhoneNumber, formatKenyanPhoneNumber } from '@/utils/phoneValidation';

const PhoneValidationTest: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);

  const handleTestValidation = () => {
    const result = validateKenyanPhoneNumber(phoneNumber);
    setValidationResult(result);
  };

  const handleFormatNumber = () => {
    const formatted = formatKenyanPhoneNumber(phoneNumber);
    setPhoneNumber(formatted);
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Phone Number Validation Test</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="e.g. 0712345678 or 254712345678"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleFormatNumber}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Format Number
          </button>
          <button
            onClick={handleTestValidation}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Validate
          </button>
        </div>

        {validationResult && (
          <div className={`p-3 rounded-md ${
            validationResult.isValid ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'
          }`}>
            <h3 className="font-medium mb-2">
              Validation Result: {validationResult.isValid ? '✅ Valid' : '❌ Invalid'}
            </h3>
            {validationResult.error && (
              <p className="text-red-700 text-sm">{validationResult.error}</p>
            )}
            {validationResult.network && (
              <p className="text-gray-700 text-sm">Network: {validationResult.network}</p>
            )}
            {validationResult.formattedNumber && (
              <p className="text-gray-700 text-sm">Formatted: {validationResult.formattedNumber}</p>
            )}
          </div>
        )}

        <div className="mt-6">
          <h3 className="font-medium mb-2">Test Cases:</h3>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Valid Safaricom (2547):</strong> 254712345678
            </div>
            <div>
              <strong>Valid Safaricom (2541):</strong> 254112345678
            </div>
            <div>
              <strong>With leading 0:</strong> 0712345678
            </div>
            <div>
              <strong>Invalid Telkom:</strong> 254812345678 (not supported)
            </div>
            <div>
              <strong>Too short:</strong> 2547123456
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneValidationTest; 