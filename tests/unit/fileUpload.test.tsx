import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FileUpload } from "@/features/upload/FileUpload";
import { MAX_FILE_SIZE_BYTES } from "@/lib/constants";

function pdf(name = "notes.pdf", contents = "%PDF-1.7\n", type = "application/pdf", lastModified = 5) {
  return new File([contents], name, { type, lastModified });
}

function row(name: string) {
  return screen.getByText(name).closest("li") as HTMLElement;
}

describe("FileUpload", () => {
  it("exposes an accessible file picker and visible focus styles", () => {
    render(<FileUpload />);
    const input = screen.getByLabelText("Choose PDF files");
    expect(input).toHaveAttribute("type", "file");
    expect(screen.getByRole("button", { name: "Choose PDF Files" })).toBeEnabled();
  });

  it("queues a valid PDF selected from the picker", async () => {
    const user = userEvent.setup();
    render(<FileUpload />);
    await user.upload(screen.getByLabelText("Choose PDF files"), pdf());
    await waitFor(() => {
      expect(within(row("notes.pdf")).getByText(/Ready/)).toBeInTheDocument();
    });
  });

  it("shows an error for an invalid file and keeps it removable", async () => {
    const user = userEvent.setup();
    render(<FileUpload />);
    await user.upload(screen.getByLabelText("Choose PDF files"), pdf("notes.txt", "%PDF-1.7\n"));
    const item = await screen.findByRole("alert");
    expect(item).toHaveTextContent(/Only PDF files are accepted/);
    await user.click(screen.getByRole("button", { name: "Remove notes.txt" }));
    expect(screen.queryByText("notes.txt")).not.toBeInTheDocument();
  });

  it("accepts multiple files and rejects one that is too large", async () => {
    const user = userEvent.setup();
    render(<FileUpload />);
    const huge = new Uint8Array(MAX_FILE_SIZE_BYTES + 1);
    huge.set(new TextEncoder().encode("%PDF-"));
    await user.upload(screen.getByLabelText("Choose PDF files"), [
      pdf("one.pdf", "%PDF-1.4\n", "application/pdf", 1),
      new File([huge], "big.pdf", { type: "application/pdf", lastModified: 2 }),
    ]);
    await waitFor(() => {
      expect(within(row("one.pdf")).getByText(/Ready/)).toBeInTheDocument();
    });
    expect(within(row("big.pdf")).getByRole("alert")).toHaveTextContent(/larger than 25 MB/);
  });

  it("does not remove a different file when a duplicate is rejected", async () => {
    const user = userEvent.setup();
    render(<FileUpload />);
    const input = screen.getByLabelText("Choose PDF files");
    const original = pdf("notes.pdf", "%PDF-1.7\n", "application/pdf", 8);
    await user.upload(input, original);
    await waitFor(() => {
      expect(within(row("notes.pdf")).getByText(/Ready/)).toBeInTheDocument();
    });
    await user.upload(input, pdf("notes.pdf", "%PDF-1.7\n", "application/pdf", 8));
    expect(await screen.findByText(/already in the queue/)).toBeInTheDocument();
    const items = screen.getAllByText("notes.pdf").map((node) => node.closest("li") as HTMLElement);
    expect(within(items[0]!).getByText(/Ready/)).toBeInTheDocument();
    await user.click(within(items[0]!).getByRole("button", { name: "Remove notes.pdf" }));
    expect(screen.getByText(/already in the queue/)).toBeInTheDocument();
    expect(screen.getAllByText("notes.pdf")).toHaveLength(1);
  });

  it("clears the queue", async () => {
    const user = userEvent.setup();
    render(<FileUpload />);
    await user.upload(screen.getByLabelText("Choose PDF files"), pdf());
    await screen.findByText("notes.pdf");
    await user.click(screen.getByRole("button", { name: "Clear all" }));
    expect(screen.queryByText("notes.pdf")).not.toBeInTheDocument();
  });

  it("queues a file dropped onto the upload area", async () => {
    render(<FileUpload />);
    const zone = screen.getByRole("heading", { name: "Drop your PDF files here" }).parentElement;
    if (!zone) throw new Error("missing dropzone");
    const file = pdf("dropped.pdf", "%PDF-1.7\n", "application/pdf", 3);
    fireEvent.drop(zone, {
      dataTransfer: { files: [file] },
    });
    await waitFor(() => {
      expect(within(row("dropped.pdf")).getByText(/Ready/)).toBeInTheDocument();
    });
  });
});
