"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";

import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { X, Loader2, UploadCloud, ImageDown } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { describeStorageError } from "@/lib/firebase-error";
import {
  compressImage,
  shouldOfferCompression,
  formatBytes,
  COMPRESS_THRESHOLD_BYTES,
  MAX_EDGE_PX,
} from "@/lib/image-compression";

// Raised from 10MB so that oversized designer artwork reaches the compression
// dialog instead of being refused outright — that file is exactly what
// compression exists for. The Storage rules allow the same ceiling, so an admin
// who picks "Upload original" is not rejected server-side.
const MAX_FILE_SIZE_MB = 25;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
};

type CompressionChoice = "compress" | "original" | "cancel";

interface ImageUploadProps {
  value: string[];
  onChange: (value: string[]) => void;
  onRemove: (value: string) => void;
  disabled?: boolean;
}

/** Firebase object names are opaque, but keeping them readable helps support. */
function buildStoragePath(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  const base = (dot === -1 ? fileName : fileName.slice(0, dot))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const ext = dot === -1 ? "" : fileName.slice(dot).toLowerCase();
  // Date.now() alone collides when several files start in the same millisecond.
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `listings/${unique}-${base || "image"}${ext}`;
}

export function ImageUpload({ value, onChange, onRemove, disabled }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Files waiting on the admin's decision. Non-null means the dialog is open.
  const [filesAwaitingChoice, setFilesAwaitingChoice] = useState<File[] | null>(null);
  const choiceResolver = useRef<((choice: CompressionChoice) => void) | null>(null);

  // onDrop closes over `value`. Without a ref, a second drop that starts before
  // the first finishes would overwrite the first batch's URLs.
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Never leave onDrop awaiting a promise that can no longer resolve.
      choiceResolver.current?.("cancel");
      choiceResolver.current = null;
    };
  }, []);

  /** Opens the dialog and waits for the admin to choose. */
  const askAboutLargeFiles = useCallback((large: File[]) => {
    setFilesAwaitingChoice(large);
    return new Promise<CompressionChoice>((resolve) => {
      choiceResolver.current = resolve;
    });
  }, []);

  const resolveChoice = useCallback((choice: CompressionChoice) => {
    setFilesAwaitingChoice(null);
    choiceResolver.current?.(choice);
    choiceResolver.current = null;
  }, []);

  const uploadFiles = useCallback(
    async (files: File[]) => {
      setUploading(true);
      setProgress(0);

      // Track every file's bytes so the bar reflects the whole batch rather than
      // whichever upload fired its progress event most recently.
      const transferred = new Array<number>(files.length).fill(0);
      const totalBytes = files.reduce((sum, file) => sum + file.size, 0);

      const uploads = files.map(
        (file, index) =>
          new Promise<string>((resolve, reject) => {
            const task = uploadBytesResumable(ref(storage, buildStoragePath(file.name)), file, {
              contentType: file.type,
            });

            task.on(
              "state_changed",
              (snapshot) => {
                transferred[index] = snapshot.bytesTransferred;
                if (!mountedRef.current || totalBytes === 0) return;
                const sum = transferred.reduce((a, b) => a + b, 0);
                setProgress(Math.min(100, (sum / totalBytes) * 100));
              },
              reject,
              () => {
                getDownloadURL(task.snapshot.ref).then(resolve, reject);
              }
            );
          })
      );

      // allSettled, not all: one rejected upload must not discard the URLs of
      // files that uploaded successfully.
      const results = await Promise.allSettled(uploads);
      if (!mountedRef.current) return;

      const urls = results
        .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
        .map((r) => r.value);
      const failures = results.filter(
        (r): r is PromiseRejectedResult => r.status === "rejected"
      );

      if (urls.length > 0) {
        onChange([...valueRef.current, ...urls]);
      }

      if (failures.length === 0) {
        toast.success(`${urls.length} image${urls.length === 1 ? "" : "s"} uploaded`);
      } else {
        // The old code swallowed this entirely, which is why the reported error
        // was an unactionable "Failed to upload images".
        failures.forEach((f) => console.error("Image upload failed:", f.reason));
        toast.error(describeStorageError(failures[0].reason), {
          description:
            urls.length > 0
              ? `${urls.length} of ${files.length} uploaded; ${failures.length} failed.`
              : undefined,
          duration: 10000,
        });
      }

      setUploading(false);
      setProgress(0);
    },
    [onChange]
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const large = acceptedFiles.filter(shouldOfferCompression);
      let files = acceptedFiles;

      if (large.length > 0) {
        const choice = await askAboutLargeFiles(large);
        if (choice === "cancel" || !mountedRef.current) return;

        if (choice === "compress") {
          setCompressing(true);
          const before = large.reduce((sum, f) => sum + f.size, 0);

          files = await Promise.all(
            acceptedFiles.map((file) => (shouldOfferCompression(file) ? compressImage(file) : file))
          );

          if (!mountedRef.current) return;
          setCompressing(false);

          const after = files
            .filter((_, i) => shouldOfferCompression(acceptedFiles[i]))
            .reduce((sum, f) => sum + f.size, 0);

          if (after < before) {
            const saved = Math.round((1 - after / before) * 100);
            toast.success(
              `Compressed ${formatBytes(before)} down to ${formatBytes(after)} (${saved}% smaller)`
            );
          } else {
            toast.info("These images were already well optimised, so they were left as they are.");
          }
        }
      }

      await uploadFiles(files);
    },
    [askAboutLargeFiles, uploadFiles]
  );

  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    rejections.forEach(({ file, errors }) => {
      const reason = errors
        .map((e) =>
          e.code === "file-too-large"
            ? `it is larger than ${MAX_FILE_SIZE_MB}MB`
            : e.code === "file-invalid-type"
              ? "it is not a supported image type"
              : e.message
        )
        .join(", ");
      toast.error(`"${file.name}" was not uploaded because ${reason}.`);
    });
  }, []);

  const busy = uploading || compressing;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
    disabled: disabled || busy,
  });

  const handleRemove = async (url: string) => {
    onRemove(url);
    try {
      if (url.includes("firebasestorage.googleapis.com")) {
        await deleteObject(ref(storage, url));
      }
    } catch (error) {
      // The URL is already off the listing, so a failed delete only leaves an
      // orphaned object. Log it rather than blocking the admin.
      console.warn("Could not delete image from storage:", url, error);
    }
  };

  const oversizedTotal = (filesAwaitingChoice ?? []).reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {value.map((url) => (
          <div
            key={url}
            className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900"
          >
            <Image
              src={url}
              alt="Listing image"
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              className="object-cover transition-transform group-hover:scale-105"
            />
            <button
              // Without type="button" this submits the surrounding listing form.
              type="button"
              onClick={() => handleRemove(url)}
              aria-label="Remove image"
              className="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-white shadow-lg transition-opacity focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        <div
          {...getRootProps()}
          className={`flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
            isDragActive ? "border-red-500 bg-red-500/10" : "border-zinc-800 bg-zinc-950 hover:bg-zinc-900"
          } ${disabled || busy ? "cursor-not-allowed opacity-60" : ""}`}
        >
          <input {...getInputProps()} />
          {compressing ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-red-500" />
              <span className="text-xs text-zinc-500">Compressing…</span>
            </div>
          ) : uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-red-500" />
              <span className="text-xs text-zinc-500">{Math.round(progress)}%</span>
            </div>
          ) : (
            <div className="flex flex-col items-center p-2 text-center">
              <UploadCloud className="mb-2 h-8 w-8 text-zinc-600" />
              <span className="text-xs font-semibold text-zinc-400">Upload Images</span>
              <span className="mt-1 text-[10px] text-zinc-600">
                Drag &amp; drop or click · max {MAX_FILE_SIZE_MB}MB
              </span>
            </div>
          )}
        </div>
      </div>
      {uploading && (
        <Progress value={progress} className="h-1 bg-zinc-800 [&>*]:bg-red-600" />
      )}

      <AlertDialog
        open={filesAwaitingChoice !== null}
        onOpenChange={(open) => {
          // Covers Escape and overlay clicks, which bypass the footer buttons.
          if (!open) resolveChoice("cancel");
        }}
      >
        <AlertDialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-zinc-900 text-red-500">
              <ImageDown />
            </AlertDialogMedia>
            <AlertDialogTitle>
              {filesAwaitingChoice?.length === 1
                ? "This image is large"
                : `${filesAwaitingChoice?.length ?? 0} images are large`}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left">
                <p>
                  Anything over {formatBytes(COMPRESS_THRESHOLD_BYTES)} is slow to load for readers
                  on mobile data. Compressing resizes the longest edge to {MAX_EDGE_PX}px and keeps
                  quality high, so text stays sharp.
                </p>
                <ul className="space-y-1 rounded-md border border-zinc-800 bg-zinc-900/60 p-3 text-xs">
                  {filesAwaitingChoice?.map((file) => (
                    <li key={file.name} className="flex justify-between gap-4">
                      <span className="truncate text-zinc-300">{file.name}</span>
                      <span className="shrink-0 font-medium text-red-400">
                        {formatBytes(file.size)}
                      </span>
                    </li>
                  ))}
                </ul>
                {(filesAwaitingChoice?.length ?? 0) > 1 && (
                  <p className="text-xs">Total: {formatBytes(oversizedTotal)}</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => resolveChoice("cancel")}
              className="border-zinc-800 text-zinc-300 hover:bg-zinc-900"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="outline"
              onClick={() => resolveChoice("original")}
              className="border-zinc-800 text-zinc-300 hover:bg-zinc-900"
            >
              Upload original
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => resolveChoice("compress")}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Compress &amp; upload
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
