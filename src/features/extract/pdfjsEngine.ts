import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { PdfEngine, OpenedPdf } from "@/features/extract/engine";
import { textFromItems, type PdfTextItem } from "@/features/extract/textContent";
import { extractMessages } from "@/features/extract/messages";
import { previewPathPrefix } from "@/lib/preview-path-prefix";

interface PdfjsWorker {
  destroyed: boolean;
  destroy(): void;
}

interface PdfjsPage {
  getTextContent(): Promise<{ items: PdfTextItem[] }>;
  cleanup(): void;
}

interface PdfjsDocument {
  numPages: number;
  getPage(pageNumber: number): Promise<PdfjsPage>;
  destroy(): Promise<void>;
}

interface PdfjsLoadingTask {
  promise: Promise<PdfjsDocument>;
  destroy(): Promise<void>;
}

export interface PdfjsModule {
  GlobalWorkerOptions: { workerSrc: string };
  PDFWorker: new (params?: { name?: string }) => PdfjsWorker;
  getDocument(params: Record<string, unknown>): PdfjsLoadingTask;
}

export interface PdfjsAssetPaths {
  workerSrc: string;
  standardFontDataUrl: string;
  cMapUrl: string;
}

function ssrError(): Error {
  return Object.assign(new Error(extractMessages.SSR), { name: "SsrExtractionError" });
}

/** Vite emits the worker as a same-origin asset. Never a CDN URL. */
export function bundledWorkerUrl(): string {
  return workerUrl;
}

export function resolvePublicUrl(assetUrl: string): string {
  if (/^https?:\/\//i.test(assetUrl)) return assetUrl;
  const prefix =
    typeof window !== "undefined"
      ? (previewPathPrefix(window.location.hostname, window.location.pathname) ?? "")
      : "";
  const path = assetUrl.startsWith("/") ? assetUrl : `/${assetUrl}`;
  return `${prefix}${path}`;
}

export function browserPdfAssets(): PdfjsAssetPaths {
  return {
    workerSrc: resolvePublicUrl(bundledWorkerUrl()),
    standardFontDataUrl: resolvePublicUrl("/pdfjs/standard_fonts/"),
    cMapUrl: resolvePublicUrl("/pdfjs/cmaps/"),
  };
}

function withSlash(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

export function createPdfEngine(options: {
  requireBrowser: boolean;
  load: () => Promise<PdfjsModule>;
  assets: () => PdfjsAssetPaths;
}): PdfEngine {
  return {
    async open(data, signal): Promise<OpenedPdf> {
      if (options.requireBrowser && typeof window === "undefined") {
        throw ssrError();
      }
      if (signal.aborted) {
        throw Object.assign(new Error(extractMessages.CANCELLED), { name: "AbortError" });
      }

      const pdfjs = await options.load();
      const assets = options.assets();
      pdfjs.GlobalWorkerOptions.workerSrc = assets.workerSrc;
      const worker = new pdfjs.PDFWorker({ name: `markdown-converter-${crypto.randomUUID()}` });
      let task: PdfjsLoadingTask | null = null;
      let doc: PdfjsDocument | null = null;
      let released = false;

      const destroy = async () => {
        if (released) return;
        released = true;
        try {
          await doc?.destroy();
        } catch {
          /* document may already be destroyed */
        }
        if (!doc) {
          try {
            await task?.destroy();
          } catch {
            /* loading task may already be settled */
          }
        }
        if (!worker.destroyed) {
          try {
            worker.destroy();
          } catch {
            /* worker may already be terminated by the document */
          }
        }
      };

      const onAbort = () => {
        void task?.destroy();
      };
      signal.addEventListener("abort", onAbort, { once: true });

      try {
        task = pdfjs.getDocument({
          data,
          worker,
          verbosity: 0,
          isEvalSupported: false,
          useSystemFonts: false,
          standardFontDataUrl: withSlash(assets.standardFontDataUrl),
          cMapUrl: withSlash(assets.cMapUrl),
          cMapPacked: true,
        });
        doc = await task.promise;
        if (signal.aborted) {
          await destroy();
          throw Object.assign(new Error(extractMessages.CANCELLED), { name: "AbortError" });
        }
        const document = doc;
        return {
          pageCount: document.numPages,
          async getPageText(pageNumber: number) {
            if (signal.aborted) {
              throw Object.assign(new Error(extractMessages.CANCELLED), { name: "AbortError" });
            }
            const page = await document.getPage(pageNumber);
            try {
              const content = await page.getTextContent();
              return textFromItems(content.items);
            } finally {
              page.cleanup();
            }
          },
          destroy,
        };
      } catch (error) {
        signal.removeEventListener("abort", onAbort);
        await destroy();
        throw error;
      }
    },
  };
}

export function createBrowserPdfEngine(): PdfEngine {
  return createPdfEngine({
    requireBrowser: true,
    load: () => import("pdfjs-dist") as Promise<PdfjsModule>,
    assets: browserPdfAssets,
  });
}
