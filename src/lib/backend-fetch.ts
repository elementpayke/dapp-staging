import { NextResponse } from "next/server";

const parseConfigInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const DEFAULT_TIMEOUT_MS = parseConfigInt(
  process.env.BACKEND_REQUEST_TIMEOUT_MS,
  10000,
);
const DEFAULT_RETRIES = parseConfigInt(process.env.BACKEND_REQUEST_RETRIES, 1);
const MISSING_BACKEND_URL_ERROR = "BACKEND_URL_NOT_CONFIGURED";

const RETRYABLE_ERROR_CODES = new Set([
  "ENOTFOUND",
  "EAI_AGAIN",
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_HEADERS_TIMEOUT",
]);

type ErrorWithCode = Error & {
  code?: string;
  cause?: {
    code?: string;
  };
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const normalizeBaseUrl = (value: string): string => value.replace(/\/+$/, "");

const getErrorCode = (error: unknown): string | undefined => {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const typedError = error as ErrorWithCode;
  return typedError.cause?.code ?? typedError.code;
};

const isRetryableError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const typedError = error as ErrorWithCode;
  const code = getErrorCode(error);

  if (typedError.name === "AbortError") {
    return true;
  }

  return Boolean(code && RETRYABLE_ERROR_CODES.has(code));
};

const buildErrorBody = (message: string, code?: string) =>
  code ? { success: false, message, code } : { success: false, message };

export const getBackendUrl = (): string => {
  const backendUrl = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL;

  if (!backendUrl) {
    throw new Error(MISSING_BACKEND_URL_ERROR);
  }

  return normalizeBaseUrl(backendUrl);
};

export const fetchBackend = async (
  path: string,
  init: RequestInit,
  options: {
    timeoutMs?: number;
    retries?: number;
  } = {},
): Promise<Response> => {
  const baseUrl = getBackendUrl();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options.retries ?? DEFAULT_RETRIES;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${baseUrl}${normalizedPath}`;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fetch(url, {
        ...init,
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      lastError = error;

      if (attempt === retries || !isRetryableError(error)) {
        throw error;
      }

      const waitMs = Math.min(300 * 2 ** attempt, 2000);
      const reason = getErrorCode(error) ?? (error as Error).name ?? "unknown";

      console.warn(
        `[backend-fetch] Retry ${attempt + 1}/${retries} for ${url} after ${reason}`,
      );
      await sleep(waitMs);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Unexpected backend fetch error");
};

export const createBackendErrorResponse = (
  error: unknown,
  fallbackMessage = "Internal server error",
): NextResponse => {
  const typedError = error as ErrorWithCode;
  const code = getErrorCode(error);

  if (typedError?.message === MISSING_BACKEND_URL_ERROR) {
    return NextResponse.json(
      buildErrorBody("Backend URL is not configured"),
      { status: 500 },
    );
  }

  if (
    typedError?.name === "AbortError" ||
    code === "ETIMEDOUT" ||
    code === "UND_ERR_CONNECT_TIMEOUT" ||
    code === "UND_ERR_HEADERS_TIMEOUT"
  ) {
    return NextResponse.json(buildErrorBody("Backend request timed out", code), {
      status: 504,
    });
  }

  if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
    return NextResponse.json(
      buildErrorBody("Backend hostname could not be resolved", code),
      { status: 502 },
    );
  }

  if (code === "ECONNREFUSED" || code === "ECONNRESET") {
    return NextResponse.json(buildErrorBody("Backend service unavailable", code), {
      status: 502,
    });
  }

  return NextResponse.json(buildErrorBody(fallbackMessage, code), {
    status: 500,
  });
};
