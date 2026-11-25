import { describe, expect, it } from "vitest";
import { fileIdentity, validatePdfFile } from "@/features/upload/fileValidation";
import { MAX_FILE_SIZE_BYTES } from "@/lib/constants";

function makeFile(
  bytes: Uint8Array | string,
  name: string,
  type = "application/pdf",
  lastModified = 1,
) {
  const payload = typeof bytes === "string" ? new TextEncoder().encode(bytes) : bytes;
  return new File([payload], name, { type, lastModified });
}

describe("validatePdfFile", () => {
  it("accepts a PDF with a valid signature", async () => {
    const result = await validatePdfFile(makeFile("%PDF-1.7\n1 0 obj", "notes.pdf"));
    expect(result).toMatchObject({ valid: true, code: "VALID" });
  });

  it("accepts an uppercase extension", async () => {
    const result = await validatePdfFile(makeFile("%PDF-1.4\n", "Notes.PDF"));
    expect(result.code).toBe("VALID");
  });

  it("rejects a non-pdf extension even when the signature matches", async () => {
    const result = await validatePdfFile(makeFile("%PDF-1.7\n", "notes.txt"));
    expect(result).toMatchObject({ valid: false, code: "INVALID_EXTENSION" });
  });

  it("rejects an invalid signature", async () => {
    const result = await validatePdfFile(makeFile("not a pdf", "notes.pdf"));
    expect(result).toMatchObject({ valid: false, code: "INVALID_SIGNATURE" });
  });

  it("rejects a malformed signature that only starts with %PDF", async () => {
    const result = await validatePdfFile(makeFile("%PDF", "notes.pdf"));
    expect(result.code).toBe("INVALID_SIGNATURE");
  });

  it("rejects an empty file before reading a signature", async () => {
    const result = await validatePdfFile(new File([], "empty.pdf", { type: "application/pdf" }));
    expect(result).toMatchObject({ valid: false, code: "EMPTY_FILE" });
  });

  it("rejects a file larger than 25 MB", async () => {
    const bytes = new Uint8Array(MAX_FILE_SIZE_BYTES + 1);
    bytes.set(new TextEncoder().encode("%PDF-"));
    const result = await validatePdfFile(makeFile(bytes, "large.pdf"));
    expect(result).toMatchObject({ valid: false, code: "FILE_TOO_LARGE" });
  });

  it("rejects an incorrect MIME type even when the signature is valid", async () => {
    const result = await validatePdfFile(makeFile("%PDF-1.7\n", "notes.pdf", "text/plain"));
    expect(result).toMatchObject({ valid: false, code: "INVALID_TYPE" });
  });

  it("accepts a missing MIME type when the signature is valid", async () => {
    const result = await validatePdfFile(makeFile("%PDF-1.7\n", "notes.pdf", ""));
    expect(result.code).toBe("VALID");
  });

  it("accepts application/octet-stream and still checks the signature", async () => {
    const valid = await validatePdfFile(
      makeFile("%PDF-1.7\n", "notes.pdf", "application/octet-stream"),
    );
    const invalid = await validatePdfFile(
      makeFile("hello", "notes.pdf", "application/octet-stream"),
    );
    expect(valid.code).toBe("VALID");
    expect(invalid.code).toBe("INVALID_SIGNATURE");
  });
});

describe("fileIdentity", () => {
  it("treats same name, size, and lastModified as the same file", () => {
    const first = makeFile("%PDF-1.7\n", "notes.pdf", "application/pdf", 10);
    const second = makeFile("%PDF-1.7\n", "notes.pdf", "application/pdf", 10);
    const other = makeFile("%PDF-1.7\n", "notes.pdf", "application/pdf", 11);
    expect(fileIdentity(first)).toBe(fileIdentity(second));
    expect(fileIdentity(first)).not.toBe(fileIdentity(other));
  });
});
