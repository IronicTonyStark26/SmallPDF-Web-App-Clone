export interface OpenedPdf {
  pageCount: number;
  getPageText(pageNumber: number): Promise<string>;
  destroy(): Promise<void>;
}

/** Opens a PDF entirely in memory. Implementations must destroy workers and documents. */
export interface PdfEngine {
  open(data: Uint8Array, signal: AbortSignal): Promise<OpenedPdf>;
}
