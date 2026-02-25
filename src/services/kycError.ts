/**
 * KYCRequiredError — thrown when the backend rejects an order because
 * the user has exceeded their transaction limit and needs KYC verification.
 *
 * Caught by order-creation UIs to trigger the KYCRequiredModal.
 */
export class KYCRequiredError extends Error {
  /** The error code / flag from the backend response (e.g. "kyc_required"). */
  code: string;
  /** The full backend response data, if any. */
  details?: Record<string, unknown>;

  constructor(
    message: string,
    code = "kyc_required",
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "KYCRequiredError";
    this.code = code;
    this.details = details;
  }
}

export interface KYCLimitSnapshot {
  error: string | null;
  current_total: number | null;
  order_amount: number | null;
  limit: number | null;
}

const toNumberOrNull = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

export const extractKYCLimitSnapshot = (
  details?: Record<string, unknown>,
): KYCLimitSnapshot | null => {
  if (!details || typeof details !== "object") return null;

  const nestedData =
    details.data && typeof details.data === "object"
      ? (details.data as Record<string, unknown>)
      : details;

  const snapshot: KYCLimitSnapshot = {
    error:
      typeof nestedData.error === "string"
        ? nestedData.error
        : typeof details.error === "string"
          ? details.error
          : null,
    current_total: toNumberOrNull(nestedData.current_total),
    order_amount: toNumberOrNull(nestedData.order_amount),
    limit: toNumberOrNull(nestedData.limit),
  };

  if (
    !snapshot.error &&
    snapshot.current_total === null &&
    snapshot.order_amount === null &&
    snapshot.limit === null
  ) {
    return null;
  }

  return snapshot;
};
