import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FileUpload } from "@/features/upload/FileUpload";

const extractPdfText = vi.hoisted(() => vi.fn());

vi.mock("@/features/extract/extractPdfText", () => ({
  extractPdfText,
}));

function pdf(name: string, lastModified: number) {
  return new File(["%PDF-1.7\n"], name, { type: "application/pdf", lastModified });
}

describe("extraction queue", () => {
  beforeEach(() => {
    extractPdfText.mockReset();
  });

  it("extracts ready files one at a time and can cancel the run", async () => {
    const user = userEvent.setup();
    let releaseFirst: (() => void) | undefined;
    extractPdfText.mockImplementation(
      async (file: File, options: { signal?: AbortSignal; onProgress?: (progress: { page: number; pageCount: number }) => void }) => {
        options.onProgress?.({ page: 1, pageCount: 1 });
        if (file.name === "one.pdf") {
          await new Promise<void>((resolve) => {
            releaseFirst = resolve;
            options.signal?.addEventListener("abort", () => resolve(), { once: true });
          });
          if (options.signal?.aborted) {
            return { ok: false, code: "CANCELLED", message: "Extraction was cancelled." };
          }
        }
        return { ok: true, text: file.name, pageCount: 1, pages: [file.name], kind: "text" };
      },
    );

    render(<FileUpload />);
    await user.upload(screen.getByLabelText("Choose PDF files"), [
      pdf("one.pdf", 1),
      pdf("two.pdf", 2),
    ]);
    await screen.findByText("one.pdf");
    await user.click(screen.getByRole("button", { name: "Extract text" }));
    expect(await screen.findByText(/Page 1 of 1/)).toBeInTheDocument();
    expect(extractPdfText).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Cancel extraction" }));
    await waitFor(() => {
      expect(screen.getByText(/Extraction was cancelled/)).toBeInTheDocument();
    });
    releaseFirst?.();
    expect(extractPdfText).toHaveBeenCalledTimes(1);
    expect(screen.getByText("two.pdf")).toBeInTheDocument();
    expect(screen.queryByText("two.pdf", { selector: "pre" })).not.toBeInTheDocument();
  });
});
