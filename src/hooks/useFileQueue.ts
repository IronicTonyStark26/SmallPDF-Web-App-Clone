import { useCallback, useRef, useState } from "react";
import { extractPdfText } from "@/features/extract/extractPdfText";
import { runSequential } from "@/features/extract/runSequential";
import { fileIdentity, validatePdfFile } from "@/features/upload/fileValidation";
import type { UploadedFile } from "@/types";

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `file-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useFileQueue() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [extracting, setExtracting] = useState(false);
  const identitiesRef = useRef<Map<string, string>>(new Map());
  const filesRef = useRef(files);
  const runAbortRef = useRef<AbortController | null>(null);
  const fileAbortRef = useRef<Map<string, AbortController>>(new Map());
  filesRef.current = files;

  const patch = useCallback((id: string, update: (entry: UploadedFile) => UploadedFile) => {
    setFiles((current) => current.map((entry) => (entry.id === id ? update(entry) : entry)));
  }, []);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const batch = Array.from(incoming);
    if (batch.length === 0) return;

    const staged: UploadedFile[] = batch.map((file) => {
      const id = createId();
      const identity = fileIdentity(file);
      const existingId = identitiesRef.current.get(identity);
      if (existingId) {
        return {
          id,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          status: "failed",
          failureStage: "validation",
          error: "This file is already in the queue and was not added again.",
        };
      }
      identitiesRef.current.set(identity, id);
      return {
        id,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: "validating",
      };
    });

    setFiles((current) => [...current, ...staged]);

    for (const item of staged) {
      if (item.status === "failed") continue;
      void validatePdfFile(item.file).then((result) => {
        setFiles((current) =>
          current.map((entry) => {
            if (entry.id !== item.id) return entry;
            if (result.valid) {
              return { ...entry, status: "queued", error: undefined };
            }
            return {
              ...entry,
              status: "failed",
              failureStage: "validation",
              error: result.message,
            };
          }),
        );
      });
    }
  }, []);

  const removeFile = useCallback((id: string) => {
    fileAbortRef.current.get(id)?.abort();
    fileAbortRef.current.delete(id);
    setFiles((current) => {
      const target = current.find((entry) => entry.id === id);
      if (!target) return current;
      const identity = fileIdentity(target.file);
      if (identitiesRef.current.get(identity) === id) {
        identitiesRef.current.delete(identity);
      }
      return current.filter((entry) => entry.id !== id);
    });
  }, []);

  const cancelExtraction = useCallback(() => {
    runAbortRef.current?.abort();
  }, []);

  const clearAll = useCallback(() => {
    runAbortRef.current?.abort();
    for (const controller of fileAbortRef.current.values()) controller.abort();
    fileAbortRef.current.clear();
    identitiesRef.current.clear();
    setFiles([]);
  }, []);

  const startExtraction = useCallback(() => {
    if (runAbortRef.current) return;
    const pending = filesRef.current.filter((entry) => entry.status === "queued");
    if (pending.length === 0) return;

    const runAbort = new AbortController();
    runAbortRef.current = runAbort;
    setExtracting(true);

    void (async () => {
      try {
        await runSequential(
          pending,
          async (item) => {
            if (runAbort.signal.aborted) return;
            if (!filesRef.current.some((entry) => entry.id === item.id)) return;

            const fileAbort = new AbortController();
            const abortFile = () => fileAbort.abort();
            runAbort.signal.addEventListener("abort", abortFile, { once: true });
            fileAbortRef.current.set(item.id, fileAbort);
            patch(item.id, (entry) => ({
              ...entry,
              status: "processing",
              error: undefined,
              notice: undefined,
              progress: undefined,
              text: undefined,
              pageCount: undefined,
            }));

            const result = await extractPdfText(item.file, {
              signal: fileAbort.signal,
              onProgress: (progress) => {
                patch(item.id, (entry) => ({ ...entry, progress }));
              },
            });

            fileAbortRef.current.delete(item.id);
            runAbort.signal.removeEventListener("abort", abortFile);
            patch(item.id, (entry) => {
              if (!result.ok && result.code === "CANCELLED") {
                return { ...entry, status: "cancelled", progress: undefined, error: result.message };
              }
              if (!result.ok) {
                return {
                  ...entry,
                  status: "failed",
                  failureStage: "extraction",
                  error: result.message,
                  progress: undefined,
                };
              }
              return {
                ...entry,
                status: "completed",
                text: result.text,
                pageCount: result.pageCount,
                notice: result.kind === "no-text" ? result.message : undefined,
                error: undefined,
                progress: { page: result.pageCount, pageCount: result.pageCount },
              };
            });
          },
          { signal: runAbort.signal },
        );
      } finally {
        runAbortRef.current = null;
        fileAbortRef.current.clear();
        setExtracting(false);
      }
    })();
  }, [patch]);

  const queuedCount = files.filter((entry) => entry.status === "queued").length;

  return {
    files,
    addFiles,
    removeFile,
    clearAll,
    startExtraction,
    cancelExtraction,
    extracting,
    queuedCount,
  };
}
