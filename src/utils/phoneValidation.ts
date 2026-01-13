// Phone number validation utilities

export interface PhoneValidationResult {
  isValid: boolean;
  error?: string;
  network?: 'Safaricom' | 'Unknown';
  formattedNumber?: string;
}

/**
 * Validates a Kenyan phone number with comprehensive checks
 */
export const validateKenyanPhoneNumber = (phoneNumber: string): PhoneValidationResult => {
  // Remove any non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, "");
  
  // Check if empty
  if (!digitsOnly) {
    return { isValid: false, error: "Phone number is required" };
  }
  
  // Check length
  if (digitsOnly.length < 9) {
    return { isValid: false, error: "Phone number is too short" };
  }
  
  if (digitsOnly.length > 12) {
    return { isValid: false, error: "Phone number is too long" };
  }
  
  // Check if it's a valid Safaricom number (2547 or 2541)
  const safaricomRegex = /^254[17][0-9]{8}$/;
  if (!safaricomRegex.test(digitsOnly)) {
    return { isValid: false, error: "Invalid phone number format. Only Safaricom numbers (2547XXXXXXXX or 2541XXXXXXXX) are supported" };
  }
  
  // Determine network
  let network: 'Safaricom' | 'Unknown' = 'Unknown';
  if (digitsOnly.startsWith('2547') || digitsOnly.startsWith('2541')) {
    network = 'Safaricom';
  }
  
  // Additional checks for common invalid patterns
  if (digitsOnly === "254000000000" || digitsOnly === "254111111111") {
    return { isValid: false, error: "Invalid phone number", network };
  }
  
  // Check for sequential numbers (likely fake)
  const isSequential = /^254[17](?:0{8}|1{8}|2{8}|3{8}|4{8}|5{8}|6{8}|7{8}|8{8}|9{8})$/.test(digitsOnly);
  if (isSequential) {
    return { isValid: false, error: "Invalid phone number", network };
  }
  
  return { 
    isValid: true, 
    network, 
    formattedNumber: digitsOnly 
  };
};

/**
 * Formats a phone number to the standard Kenyan format
 */
export const formatKenyanPhoneNumber = (phoneNumber: string): string => {
  // Remove any non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, "");

  // If number starts with 0, replace it with 254
  if (digitsOnly.startsWith("0") && digitsOnly.length >= 10) {
    return "254" + digitsOnly.slice(1);
  }

  // If number starts with 254 and is 12 digits, return as is
  if (digitsOnly.startsWith("254") && digitsOnly.length === 12) {
    return digitsOnly;
  }

  // If number doesn't start with either, assume it's a complete number
  return digitsOnly;
};

/**
 * Validates phone number (client-side only)
 */
export const validatePhoneWithAPI = async (
  phoneNumber: string
): Promise<PhoneValidationResult> => {
  // Use only client-side validation since phone validation endpoint is not in API docs
  return validateKenyanPhoneNumber(phoneNumber);
};

/**
 * Common phone number patterns for testing
 */
export const PHONE_PATTERNS = {
  SAFARICOM: /^254[17][0-9]{8}$/,
  KENYAN_MOBILE: /^254[17][0-9]{8}$/,
} as const; 