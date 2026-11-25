import { Upload } from "lucide-react";
import { useId, useRef, type DragEvent } from "react";
import { Button } from "@/components/ui/Button";
import { MAX_FILE_SIZE_LABEL } from "@/lib/constants";

interface FileDropzoneProps {
  onFiles: (files: FileList | File[]) => void;
  disabled?: boolean;
}

export function FileDropzone({ onFiles, disabled = false }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const helpId = useId();

  function openPicker() {
    if (disabled) return;
    inputRef.current?.click();
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (disabled) return;
    if (event.dataTransfer.files.length > 0) {
      onFiles(event.dataTransfer.files);
    }
  }

  return (
    <div
      className="rounded-card border border-dashed border-line bg-canvas-muted px-4 py-10 text-center shadow-sm sm:px-8 sm:py-14"
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-canvas text-accent shadow-sm">
        <Upload aria-hidden="true" size={22} />
      </div>
      <h2 className="mt-5 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
        Drop your PDF files here
      </h2>
      <p id={helpId} className="mx-auto mt-2 max-w-md text-sm text-ink-muted sm:text-base">
        or browse files from your device
      </p>
      <div className="mt-6">
        <Button className="w-full sm:w-auto" disabled={disabled} onClick={openPicker}>
          Choose PDF Files
        </Button>
      </div>
      <input
        ref={inputRef}
        id={inputId}
        className="sr-only"
        type="file"
        accept="application/pdf,.pdf"
        multiple
        aria-label="Choose PDF files"
        aria-describedby={helpId}
        disabled={disabled}
        onChange={(event) => {
          if (event.target.files && event.target.files.length > 0) {
            onFiles(event.target.files);
          }
          event.target.value = "";
        }}
      />
      <p className="mt-4 font-mono text-xs text-ink-muted">
        PDF only · {MAX_FILE_SIZE_LABEL} per file
      </p>
    </div>
  );
}
