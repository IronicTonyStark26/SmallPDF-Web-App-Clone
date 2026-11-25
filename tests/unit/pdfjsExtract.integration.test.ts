// @vitest-environment node

import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { createPdfEngine, type PdfjsModule } from "@/features/extract/pdfjsEngine";
import { extractPdfText } from "@/features/extract/extractPdfText";

const workerSrc = pathToFileURL(
  "/workspace/node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
).href;
const standardFontDataUrl = pathToFileURL(
  "/workspace/node_modules/pdfjs-dist/standard_fonts/",
).href;
const cMapUrl = pathToFileURL("/workspace/node_modules/pdfjs-dist/cmaps/").href;

async function fixture(name: string) {
  const bytes = await readFile(`/workspace/tests/fixtures/${name}`);
  return new File([bytes], name, { type: "application/pdf" });
}

function nodeEngine(destroyed: { count: number }) {
  return createPdfEngine({
    requireBrowser: false,
    assets: () => ({ workerSrc, standardFontDataUrl, cMapUrl }),
    async load() {
      const pdfjs = (await import("pdfjs-dist/legacy/build/pdf.mjs")) as PdfjsModule;
      const Original = pdfjs.PDFWorker;
      return {
        GlobalWorkerOptions: pdfjs.GlobalWorkerOptions,
        getDocument: pdfjs.getDocument.bind(pdfjs),
        PDFWorker: class extends Original {
          override destroy() {
            destroyed.count += 1;
            super.destroy();
          }
        },
      };
    },
  });
}

describe("PDF.js extraction", () => {
  it("extracts one page and several pages with the local worker", async () => {
    const destroyed = { count: 0 };
    const engine = nodeEngine(destroyed);
    const hello = await extractPdfText(await fixture("hello.pdf"), { engine });
    const multi = await extractPdfText(await fixture("multi.pdf"), { engine });
    expect(hello).toMatchObject({ ok: true, pageCount: 1, text: "Hello from page one", kind: "text" });
    expect(multi).toMatchObject({
      ok: true,
      pageCount: 2,
      text: "Alpha page\n\nBeta page",
      kind: "text",
    });
    expect(destroyed.count).toBeGreaterThanOrEqual(2);
  });

  it("classifies corrupt, password-protected, and scanned PDFs", async () => {
    const destroyed = { count: 0 };
    const engine = nodeEngine(destroyed);
    const corrupt = await extractPdfText(await fixture("corrupt.pdf"), { engine });
    const secret = await extractPdfText(await fixture("secret.pdf"), { engine });
    const scanned = await extractPdfText(await fixture("scanned.pdf"), { engine });
    expect(corrupt).toMatchObject({ ok: false, code: "CORRUPT" });
    expect(secret).toMatchObject({ ok: false, code: "PASSWORD" });
    expect(scanned).toMatchObject({ ok: true, kind: "no-text", pageCount: 1, text: "" });
    expect(destroyed.count).toBeGreaterThanOrEqual(3);
  });
});
