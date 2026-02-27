export const WALLET_OWNERSHIP_CONFLICT_CODE = "WALLET_OWNERSHIP_CONFLICT";
export const WALLET_OWNERSHIP_CONFLICT_MESSAGE =
  "This wallet is already linked to another account. Please log in using the original account.";

const CONFLICT_PATTERNS = [
  /already linked to another account/i,
  /wallet.*already linked/i,
];

type WalletPayload = {
  message?: unknown;
  code?: unknown;
  success?: unknown;
  status?: unknown;
};

const toRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
};

const getPayloadMessage = (payload: unknown): string | null => {
  const rec = toRecord(payload);
  const message = rec?.message;
  return typeof message === "string" && message.trim().length > 0 ? message.trim() : null;
};

const getPayloadCode = (payload: unknown): string | null => {
  const rec = toRecord(payload);
  const code = rec?.code;
  return typeof code === "string" && code.trim().length > 0 ? code.trim() : null;
};

const matchesConflictMessage = (message: string | null): boolean => {
  if (!message) return false;
  return CONFLICT_PATTERNS.some((pattern) => pattern.test(message));
};

const normalizeStatus = (status: number): number =>
  Number.isFinite(status) && status >= 100 ? status : 400;

export interface WalletConnectFailure {
  status: number;
  message: string;
  code?: string;
  shouldClearSession: boolean;
}

export const isWalletOwnershipConflictResponse = (
  status: number,
  payload: unknown,
): boolean => {
  const message = getPayloadMessage(payload);
  const code = getPayloadCode(payload);

  return (
    status === 403 ||
    code === WALLET_OWNERSHIP_CONFLICT_CODE ||
    matchesConflictMessage(message)
  );
};

export const normalizeWalletConnectFailure = (
  status: number,
  payload: unknown,
  fallbackMessage = "Failed to connect wallet",
): WalletConnectFailure => {
  if (isWalletOwnershipConflictResponse(status, payload)) {
    return {
      status: 403,
      code: WALLET_OWNERSHIP_CONFLICT_CODE,
      message: WALLET_OWNERSHIP_CONFLICT_MESSAGE,
      shouldClearSession: true,
    };
  }

  return {
    status: normalizeStatus(status),
    message: getPayloadMessage(payload) ?? fallbackMessage,
    code: getPayloadCode(payload) ?? undefined,
    shouldClearSession: false,
  };
};

export const isWalletOwnershipConflictError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const rec = error as Record<string, unknown>;

  const status = typeof rec.status === "number" ? rec.status : undefined;
  const code = typeof rec.code === "string" ? rec.code : null;
  const message = typeof rec.message === "string" ? rec.message : null;

  return (
    status === 403 ||
    code === WALLET_OWNERSHIP_CONFLICT_CODE ||
    matchesConflictMessage(message)
  );
};
