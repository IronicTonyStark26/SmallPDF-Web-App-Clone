import {
  ACCEPTED_PDF_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_LABEL,
  PDF_SIGNATURE,
  UNVERIFIED_MIME_TYPES,
} from "@/lib/constants";
import type { FileValidationResult } from "@/types";

/**
 * Validation order is fixed and tested:
 * 1. empty
 * 2. size
 * 3. extension
 * 4. MIME, when the browser supplied a meaningful type
 * 5. leading `%PDF-` signature
 *
 * Extension and MIME are never treated as proof that the file is a PDF.
 */
export async function validatePdfFile(file: File): Promise<FileValidationResult> {
  if (file.size === 0) {
    return {
      valid: false,
      code: "EMPTY_FILE",
      message: "This file is empty. Choose a PDF that contains a document.",
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      code: "FILE_TOO_LARGE",
      message: `This file is larger than ${MAX_FILE_SIZE_LABEL}. Choose a smaller PDF.`,
    };
  }

  if (!hasPdfExtension(file.name)) {
    return {
      valid: false,
      code: "INVALID_EXTENSION",
      message: "Only PDF files are accepted. The file name must end in .pdf.",
    };
  }

  const mime = (file.type ?? "").trim().toLowerCase();
  if (!UNVERIFIED_MIME_TYPES.has(mime) && !ACCEPTED_PDF_MIME_TYPES.has(mime)) {
    return {
      valid: false,
      code: "INVALID_TYPE",
      message: "This file is not reported as a PDF. Choose a .pdf document.",
    };
  }

  const signatureOk = await hasPdfSignature(file);
  if (!signatureOk) {
    return {
      valid: false,
      code: "INVALID_SIGNATURE",
      message: "This file does not look like a PDF. The document header is missing or damaged.",
    };
  }

  return {
    valid: true,
    code: "VALID",
    message: "PDF accepted.",
  };
}

export function hasPdfExtension(fileName: string): boolean {
  const trimmed = fileName.trim().toLowerCase();
  const slash = Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\"));
  const base = slash >= 0 ? trimmed.slice(slash + 1) : trimmed;
  return base.endsWith(".pdf") && base !== ".pdf";
}

async function hasPdfSignature(file: File): Promise<boolean> {
  const length = Math.min(file.size, PDF_SIGNATURE.length);
  const bytes = new Uint8Array(await file.slice(0, length).arrayBuffer());
  let text = "";
  for (const byte of bytes) {
    text += String.fromCharCode(byte);
  }
  return text === PDF_SIGNATURE;
}

/** Stable identity for duplicate detection. Does not read file contents. */
export function fileIdentity(file: File): string {
  return `${file.name}\0${file.size}\0${file.lastModified}`;
}
