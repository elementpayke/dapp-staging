/**
 * Formats a numeric amount with thousands separators and 2 decimal places.
 * e.g. 60000 → "60,000.00"  |  1234.5 → "1,234.50"
 *
 * @param value   - The raw number or numeric string to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string, or "N/A" if the value is invalid
 */
export function formatAmount(
  value: string | number | null | undefined,
  decimals = 2,
): string {
  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  if (value === null || value === undefined || value === "" || isNaN(num)) {
    return "N/A";
  }
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}