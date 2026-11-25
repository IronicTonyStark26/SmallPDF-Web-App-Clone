import { classifyPdfError, isAbortError } from "@/features/extract/errors";
import type { PdfEngine } from "@/features/extract/engine";
import { extractMessages } from "@/features/extract/messages";
import { joinPages } from "@/features/extract/textContent";

export interface ExtractProgress {
  page: number;
  pageCount: number;
}

export type ExtractOutcome =
  | {
      ok: true;
      text: string;
      pageCount: number;
      pages: string[];
      kind: "text" | "no-text";
      message?: string;
    }
  | {
      ok: false;
      code: "SSR" | "PASSWORD" | "CORRUPT" | "WORKER" | "CANCELLED" | "UNKNOWN";
      message: string;
    };

export interface ExtractPdfOptions {
  signal?: AbortSignal;
  onProgress?: (progress: ExtractProgress) => void;
  /** Test double. Production omits this and uses the local PDF.js worker. */
  engine?: PdfEngine;
}

function cancelled(): ExtractOutcome {
  return { ok: false, code: "CANCELLED", message: extractMessages.CANCELLED };
}

/**
 * Reads one PDF in memory and returns plain text plus a page count.
 * Markdown formatting is intentionally not applied here.
 * With no injected engine, this refuses to run outside the browser and does not import PDF.js.
 */
export async function extractPdfText(
  file: Blob,
  options: ExtractPdfOptions = {},
): Promise<ExtractOutcome> {
  if (!options.engine && typeof window === "undefined") {
    return { ok: false, code: "SSR", message: extractMessages.SSR };
  }

  const signal = options.signal ?? new AbortController().signal;
  if (signal.aborted) return cancelled();

  const engine = options.engine ?? (await loadBrowserEngine());
  let opened: Awaited<ReturnType<PdfEngine["open"]>> | null = null;
  try {
    const data = new Uint8Array(await file.arrayBuffer());
    if (signal.aborted) return cancelled();
    opened = await engine.open(data, signal);
    const pages: string[] = [];
    for (let page = 1; page <= opened.pageCount; page += 1) {
      if (signal.aborted) return cancelled();
      options.onProgress?.({ page, pageCount: opened.pageCount });
      pages.push(await opened.getPageText(page));
    }
    if (signal.aborted) return cancelled();
    const joined = joinPages(pages);
    return {
      ok: true,
      text: joined.text,
      pageCount: opened.pageCount,
      pages,
      kind: joined.kind,
      message: joined.kind === "no-text" ? extractMessages.NO_TEXT : undefined,
    };
  } catch (error) {
    if (signal.aborted || isAbortError(error)) return cancelled();
    const classified = classifyPdfError(error);
    return { ok: false, code: classified.code, message: classified.message };
  } finally {
    if (opened) {
      try {
        await opened.destroy();
      } catch {
        /* cleanup must not hide the extraction result */
      }
    }
  }
}

async function loadBrowserEngine(): Promise<PdfEngine> {
  const { createBrowserPdfEngine } = await import("@/features/extract/pdfjsEngine");
  return createBrowserPdfEngine();
}
