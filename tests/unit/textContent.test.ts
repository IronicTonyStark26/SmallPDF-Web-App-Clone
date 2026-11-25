import { describe, expect, it } from "vitest";
import { joinPages, textFromItems } from "@/features/extract/textContent";

describe("textFromItems", () => {
  it("keeps line breaks and trims trailing spaces", () => {
    const text = textFromItems([
      { str: "Hello", hasEOL: false },
      { str: "world", hasEOL: true },
      { str: "Next", hasEOL: true },
    ]);
    expect(text).toBe("Hello world\nNext");
  });
});

describe("joinPages", () => {
  it("joins pages with a blank line", () => {
    expect(joinPages(["Alpha", "Beta"])).toEqual({ text: "Alpha\n\nBeta", kind: "text" });
  });

  it("treats a document with no text as scanned", () => {
    expect(joinPages(["", "   "])).toEqual({ text: "", kind: "no-text" });
  });
});
