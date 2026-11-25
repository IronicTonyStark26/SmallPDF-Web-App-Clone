// @vitest-environment node

import { describe, expect, it } from "vitest";
import { extractPdfText } from "@/features/extract/extractPdfText";

describe("extractPdfText SSR", () => {
  it("does not start PDF.js when there is no browser", async () => {
    expect(typeof window).toBe("undefined");
    const result = await extractPdfText(new Blob(["%PDF-1.4"], { type: "application/pdf" }));
    expect(result).toMatchObject({ ok: false, code: "SSR" });
  });
});
