import { describe, expect, it } from "vitest";
import { bundledWorkerUrl, resolvePublicUrl } from "@/features/extract/pdfjsEngine";

describe("bundled PDF.js worker", () => {
  it("points at a local worker asset, not a CDN", () => {
    const url = bundledWorkerUrl();
    expect(url).toMatch(/pdf\.worker/i);
    expect(url).not.toMatch(/unpkg|cdnjs|jsdelivr|googleapis/i);
    expect(resolvePublicUrl("/pdfjs/standard_fonts/")).toBe("/pdfjs/standard_fonts/");
  });
});
