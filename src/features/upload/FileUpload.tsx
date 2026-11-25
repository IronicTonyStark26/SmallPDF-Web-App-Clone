import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FileDropzone } from "@/components/ui/FileDropzone";
import { useFileQueue } from "@/hooks/useFileQueue";
import type { UploadedFile } from "@/types";

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function statusLabel(file: UploadedFile): string {
  if (file.status === "validating") return "Checking";
  if (file.status === "queued") return "Ready";
  if (file.status === "processing") return "Extracting";
  if (file.status === "completed") return "Extracted";
  if (file.status === "cancelled") return "Cancelled";
  if (file.status === "failed" && file.failureStage === "extraction") return "Could not extract";
  if (file.status === "failed") return "Not added";
  return file.status;
}

export function FileUpload() {
  const {
    files,
    addFiles,
    removeFile,
    clearAll,
    startExtraction,
    cancelExtraction,
    extracting,
    queuedCount,
  } = useFileQueue();

  return (
    <div className="flex flex-col gap-4">
      <FileDropzone onFiles={addFiles} disabled={extracting} />
      <ul className="grid gap-3 text-sm text-ink-muted sm:grid-cols-3">
        <li className="rounded-2xl border border-line bg-canvas px-4 py-3">Free to use</li>
        <li className="rounded-2xl border border-line bg-canvas px-4 py-3">No sign-up required</li>
        <li className="rounded-2xl border border-line bg-canvas px-4 py-3">
          Files stay on your device
        </li>
      </ul>

      {files.length > 0 ? (
        <section
          aria-labelledby="queue-heading"
          className="rounded-card border border-line bg-canvas p-4 shadow-sm sm:p-5"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 id="queue-heading" className="text-base font-semibold text-ink">
                Selected files
              </h3>
              <p className="mt-1 text-sm text-ink-muted">
                Text is extracted in this browser, one file at a time. Nothing is uploaded.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {extracting ? (
                <Button variant="danger" onClick={cancelExtraction}>
                  Cancel extraction
                </Button>
              ) : (
                <Button onClick={startExtraction} disabled={queuedCount === 0}>
                  Extract text
                </Button>
              )}
              <Button variant="danger" onClick={clearAll}>
                <Trash2 aria-hidden="true" size={16} />
                Clear all
              </Button>
            </div>
          </div>
          <ul className="mt-4 flex flex-col gap-2">
            {files.map((file) => (
              <li
                key={file.id}
                className="flex flex-col gap-3 rounded-2xl border border-line bg-canvas-muted px-3 py-3"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{file.name}</p>
                    <p className="mt-1 text-xs text-ink-muted">
                      {formatBytes(file.size)} · {statusLabel(file)}
                      {file.pageCount !== undefined ? ` · ${file.pageCount} pages` : ""}
                      {file.status === "processing" && file.progress
                        ? ` · Page ${file.progress.page} of ${file.progress.pageCount}`
                        : ""}
                    </p>
                    {file.error ? (
                      <p role="alert" className="mt-2 text-sm text-danger">
                        {file.error}
                      </p>
                    ) : null}
                    {file.notice ? (
                      <p role="status" className="mt-2 text-sm text-ink">
                        {file.notice}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    variant="ghost"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => removeFile(file.id)}
                  >
                    <X aria-hidden="true" size={16} />
                    Remove
                  </Button>
                </div>
                {file.status === "completed" && file.text ? (
                  <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded-xl border border-line bg-canvas p-3 font-mono text-xs leading-5 text-ink">
                    {file.text}
                  </pre>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
