import { extractMessages } from "@/features/extract/messages";

export type ExtractErrorCode = "SSR" | "PASSWORD" | "CORRUPT" | "WORKER" | "CANCELLED" | "UNKNOWN";

export function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const name = "name" in error ? String(error.name) : "";
  return name === "AbortError" || name === "AbortException";
}

export function classifyPdfError(error: unknown): { code: ExtractErrorCode; message: string } {
  if (isAbortError(error)) {
    return { code: "CANCELLED", message: extractMessages.CANCELLED };
  }
  const name = error && typeof error === "object" && "name" in error ? String(error.name) : "";
  const message =
    error && typeof error === "object" && "message" in error ? String(error.message) : "";

  if (name === "SsrExtractionError") {
    return { code: "SSR", message: extractMessages.SSR };
  }
  if (name === "PasswordException" || /password/i.test(message)) {
    return { code: "PASSWORD", message: extractMessages.PASSWORD };
  }
  if (name === "InvalidPDFException" || name === "MissingPDFException" || /invalid pdf/i.test(message)) {
    return { code: "CORRUPT", message: extractMessages.CORRUPT };
  }
  if (
    name === "UnknownErrorException" ||
    /worker/i.test(message) ||
    /worker/i.test(name)
  ) {
    return { code: "WORKER", message: extractMessages.WORKER };
  }
  return { code: "UNKNOWN", message: extractMessages.UNKNOWN };
}
