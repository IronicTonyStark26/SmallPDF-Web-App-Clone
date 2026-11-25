export const extractMessages = {
  SSR: "PDF extraction only runs in the browser. The file was not sent anywhere.",
  PASSWORD:
    "This PDF is password-protected. Remove the password and try again. The file was not uploaded.",
  CORRUPT: "This PDF could not be read. It looks damaged or incomplete.",
  WORKER: "The local PDF worker failed before finishing. The file stayed on this device.",
  CANCELLED: "Extraction was cancelled.",
  NO_TEXT:
    "No extractable text. This PDF may be scanned or image-only. OCR is not included.",
  UNKNOWN: "This PDF could not be extracted.",
} as const;
