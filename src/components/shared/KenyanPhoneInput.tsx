/**
 * KenyanPhoneInput - Phone number input with +254 prefix for Kenyan numbers
 *
 * Features:
 * - Fixed +254 prefix (non-editable)
 * - Auto-format 07/01 patterns
 * - Real-time validation feedback
 * - Dark theme support
 */

"use client";

import React, { useState, useCallback, useEffect, forwardRef } from "react";
import { Check, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  validateKenyanPhoneNumber,
  type PhoneValidationResult,
} from "@/utils/phoneValidation";

export interface KenyanPhoneInputProps {
  value: string;
  onChange: (value: string, validation: PhoneValidationResult) => void;
  onValidationChange?: (validation: PhoneValidationResult) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  debounceMs?: number;
}

export const KenyanPhoneInput = forwardRef<
  HTMLInputElement,
  KenyanPhoneInputProps
>(function KenyanPhoneInput(
  {
    value,
    onChange,
    onValidationChange,
    disabled = false,
    className,
    placeholder = "7XX XXX XXX",
    autoFocus = false,
    debounceMs = 500,
  },
  ref,
) {
  const [localValue, setLocalValue] = useState(() => {
    // Extract the part after 254 if value starts with it
    if (value.startsWith("254")) {
      return value.slice(3);
    }
    // Handle 07/01 format
    if (value.startsWith("0")) {
      return value.slice(1);
    }
    return value;
  });

  const [validation, setValidation] = useState<PhoneValidationResult>({
    isValid: false,
  });
  const [isValidating, setIsValidating] = useState(false);

  // Validate when localValue changes (debounced)
  useEffect(() => {
    if (!localValue) {
      const result = { isValid: false };
      setValidation(result);
      onValidationChange?.(result);
      return;
    }

    setIsValidating(true);

    const timeoutId = setTimeout(() => {
      const fullNumber = `254${localValue}`;
      const result = validateKenyanPhoneNumber(fullNumber);
      setValidation(result);
      onValidationChange?.(result);
      setIsValidating(false);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [localValue, debounceMs, onValidationChange]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value;

      // Remove any non-digit characters
      inputValue = inputValue.replace(/\D/g, "");

      // Handle if user pastes a full number starting with 254
      if (inputValue.startsWith("254")) {
        inputValue = inputValue.slice(3);
      }

      // Handle if user types 07 or 01 format
      if (inputValue.startsWith("0")) {
        inputValue = inputValue.slice(1);
      }

      // Limit to 9 digits (the part after 254)
      inputValue = inputValue.slice(0, 9);

      setLocalValue(inputValue);

      // Pass the full number (254 + input) to parent
      const fullNumber = inputValue ? `254${inputValue}` : "";
      const currentValidation =
        inputValue.length === 9
          ? validateKenyanPhoneNumber(fullNumber)
          : { isValid: false };

      onChange(fullNumber, currentValidation);
    },
    [onChange],
  );

  // Format display value with spaces for readability
  const formatDisplayValue = (val: string): string => {
    if (!val) return "";
    // Format as 7XX XXX XXX
    if (val.length <= 3) return val;
    if (val.length <= 6) return `${val.slice(0, 3)} ${val.slice(3)}`;
    return `${val.slice(0, 3)} ${val.slice(3, 6)} ${val.slice(6)}`;
  };

  const getStatusIcon = () => {
    if (isValidating) {
      return <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />;
    }
    if (localValue.length === 9) {
      if (validation.isValid) {
        return <Check className="w-4 h-4 text-green-500" />;
      }
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    return null;
  };

  const getBorderColor = () => {
    if (!localValue) return "border-gray-200 dark:border-gray-700";
    if (isValidating) return "border-gray-300 dark:border-gray-600";
    if (localValue.length === 9) {
      return validation.isValid
        ? "border-green-500 dark:border-green-400"
        : "border-red-500 dark:border-red-400";
    }
    return "border-gray-200 dark:border-gray-700";
  };

  return (
    <div className={cn("space-y-1", className)}>
      <div
        className={cn(
          "flex items-center rounded-lg border transition-colors",
          "bg-gray-50 dark:bg-gray-800",
          "focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent",
          getBorderColor(),
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        {/* Fixed +254 prefix */}
        <div className="flex items-center px-3 py-3 bg-gray-100 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600 rounded-l-lg">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300 select-none">
            +254
          </span>
        </div>

        {/* Input field */}
        <input
          ref={ref}
          type="tel"
          inputMode="numeric"
          value={formatDisplayValue(localValue)}
          onChange={handleInputChange}
          disabled={disabled}
          autoFocus={autoFocus}
          placeholder={placeholder}
          className={cn(
            "flex-1 px-3 py-3 bg-transparent",
            "text-gray-900 dark:text-gray-100",
            "placeholder:text-gray-400 dark:placeholder:text-gray-500",
            "focus:outline-none",
            "disabled:cursor-not-allowed",
          )}
        />

        {/* Status icon */}
        <div className="px-3">{getStatusIcon()}</div>
      </div>

      {/* Validation message */}
      {validation.error && localValue.length > 0 && (
        <p className="text-xs text-red-500 dark:text-red-400 px-1">
          {validation.error}
        </p>
      )}

      {/* Network indicator */}
      {validation.isValid && validation.network && (
        <p className="text-xs text-green-600 dark:text-green-400 px-1">
          ✓ {validation.network} number
        </p>
      )}
    </div>
  );
});

export default KenyanPhoneInput;
