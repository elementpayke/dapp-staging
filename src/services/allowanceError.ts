/**
 * InsufficientAllowanceError — thrown when the backend rejects an order
 * because the ERC-20 allowance on-chain is lower than the required amount.
 *
 * Caught by offramp execution to trigger an automatic re-approval + retry.
 */
export class InsufficientAllowanceError extends Error {
  /** Current on-chain allowance (raw units) as reported by the backend. */
  currentAllowance: string;
  /** Required allowance (raw units) as reported by the backend. */
  requiredAllowance: string;

  constructor(
    message: string,
    currentAllowance = "0",
    requiredAllowance = "0",
  ) {
    super(message);
    this.name = "InsufficientAllowanceError";
    this.currentAllowance = currentAllowance;
    this.requiredAllowance = requiredAllowance;
  }
}

/**
 * Check whether an error message signals an insufficient-allowance rejection.
 * The backend format is:
 *   "Insufficient allowance: current=51357, required=620155"
 */
export const isInsufficientAllowanceMessage = (msg: string): boolean =>
  /insufficient\s*allowance/i.test(msg);

/**
 * Parse the current/required values out of a backend allowance error message.
 */
export const parseAllowanceError = (
  msg: string,
): { current: string; required: string } => {
  const match = msg.match(
    /current\s*=\s*(\d+).*required\s*=\s*(\d+)/i,
  );
  return {
    current: match?.[1] ?? "0",
    required: match?.[2] ?? "0",
  };
};
