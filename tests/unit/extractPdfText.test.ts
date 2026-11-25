import { describe, expect, it } from "vitest";
import type { PdfEngine } from "@/features/extract/engine";
import { extractPdfText } from "@/features/extract/extractPdfText";
import { extractMessages } from "@/features/extract/messages";

function file() {
  return new File(["%PDF-1.4"], "notes.pdf", { type: "application/pdf" });
}

function engine(open: PdfEngine["open"], destroy = async () => {}): PdfEngine {
  return {
    async open(data, signal) {
      const opened = await open(data, signal);
      return {
        ...opened,
        async destroy() {
          await destroy();
          await opened.destroy();
        },
      };
    },
  };
}

describe("extractPdfText", () => {
  it("returns plain text and the page count for a multi-page document", async () => {
    const seen: number[] = [];
    const result = await extractPdfText(file(), {
      onProgress: (progress) => seen.push(progress.page),
      engine: {
        async open() {
          return {
            pageCount: 2,
            async getPageText(page) {
              return page === 1 ? "Alpha" : "Beta";
            },
            async destroy() {},
          };
        },
      },
    });
    expect(result).toMatchObject({
      ok: true,
      text: "Alpha\n\nBeta",
      pageCount: 2,
      kind: "text",
    });
    expect(seen).toEqual([1, 2]);
  });

  it("reports a scanned PDF without treating it as corrupt", async () => {
    const result = await extractPdfText(file(), {
      engine: {
        async open() {
          return {
            pageCount: 1,
            async getPageText() {
              return "  ";
            },
            async destroy() {},
          };
        },
      },
    });
    expect(result).toMatchObject({
      ok: true,
      kind: "no-text",
      pageCount: 1,
      text: "",
      message: extractMessages.NO_TEXT,
    });
  });

  it("reports a password-protected PDF and still cleans up", async () => {
    let destroyed = false;
    const result = await extractPdfText(file(), {
      engine: engine(async () => {
        throw Object.assign(new Error("No password given"), { name: "PasswordException" });
      }, async () => {
        destroyed = true;
      }),
    });
    expect(destroyed).toBe(false);
    expect(result).toMatchObject({ ok: false, code: "PASSWORD" });
  });

  it("reports a corrupt PDF", async () => {
    const result = await extractPdfText(file(), {
      engine: {
        async open() {
          throw Object.assign(new Error("Invalid PDF structure."), { name: "InvalidPDFException" });
        },
      },
    });
    expect(result).toMatchObject({ ok: false, code: "CORRUPT", message: extractMessages.CORRUPT });
  });

  it("reports a worker failure and destroys an opened document", async () => {
    let destroyed = false;
    const result = await extractPdfText(file(), {
      engine: {
        async open() {
          return {
            pageCount: 1,
            async getPageText() {
              throw Object.assign(new Error("Setting up fake worker failed"), {
                name: "UnknownErrorException",
              });
            },
            async destroy() {
              destroyed = true;
            },
          };
        },
      },
    });
    expect(destroyed).toBe(true);
    expect(result).toMatchObject({ ok: false, code: "WORKER" });
  });

  it("cancels before the next page and still destroys the document", async () => {
    const controller = new AbortController();
    let destroyed = false;
    const result = await extractPdfText(file(), {
      signal: controller.signal,
      engine: {
        async open() {
          return {
            pageCount: 2,
            async getPageText(page) {
              if (page === 1) {
                controller.abort();
                return "partial";
              }
              return "should-not-run";
            },
            async destroy() {
              destroyed = true;
            },
          };
        },
      },
    });
    expect(destroyed).toBe(true);
    expect(result).toMatchObject({ ok: false, code: "CANCELLED" });
  });
});
