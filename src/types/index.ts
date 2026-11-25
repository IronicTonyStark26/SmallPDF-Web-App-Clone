export type ConversionStatus =
  | "idle"
  | "validating"
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: ConversionStatus;
  error?: string;
  /** Set when validation or extraction rejects the file. */
  failureStage?: "validation" | "extraction";
  /** Plain text from PDF.js. Markdown is a later milestone. */
  text?: string;
  pageCount?: number;
  notice?: string;
  progress?: {
    page: number;
    pageCount: number;
  };
}

export interface ConversionResult {
  id: string;
  fileName: string;
  markdown: string;
  pageCount: number;
}

export type FileValidationCode =
  | "INVALID_EXTENSION"
  | "INVALID_TYPE"
  | "FILE_TOO_LARGE"
  | "EMPTY_FILE"
  | "INVALID_SIGNATURE"
  | "VALID";

export interface FileValidationResult {
  valid: boolean;
  code: FileValidationCode;
  message: string;
}
