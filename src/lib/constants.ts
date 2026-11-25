export const PRODUCT_NAME = "Markdown Converter";

/** 25 MB. Compared against `File.size`, which is bytes. */
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export const MAX_FILE_SIZE_LABEL = "25 MB";

export const PDF_SIGNATURE = "%PDF-";

/** MIME values that do not prove or disprove a PDF. Signature still decides. */
export const UNVERIFIED_MIME_TYPES = new Set(["", "application/octet-stream"]);

export const ACCEPTED_PDF_MIME_TYPES = new Set([
  "application/pdf",
  "application/x-pdf",
]);
