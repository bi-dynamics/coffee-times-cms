"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";

import { Progress } from "@/components/ui/progress";
import { X, Loader2, UploadCloud } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { describeStorageError } from "@/lib/firebase-error";

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
};

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
  const [progress, setProgress] = useState(0);

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
    };
  }, []);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setUploading(true);
      setProgress(0);

      // Track every file's bytes so the bar reflects the whole batch rather than
      // whichever upload fired its progress event most recently.
      const transferred = new Array<number>(acceptedFiles.length).fill(0);
      const totals = acceptedFiles.map((file) => file.size);
      const totalBytes = totals.reduce((sum, size) => sum + size, 0);

      const uploads = acceptedFiles.map(
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
              ? `${urls.length} of ${acceptedFiles.length} uploaded; ${failures.length} failed.`
              : undefined,
          duration: 10000,
        });
      }

      setUploading(false);
      setProgress(0);
    },
    [onChange]
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
    disabled: disabled || uploading,
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
          } ${disabled || uploading ? "cursor-not-allowed opacity-60" : ""}`}
        >
          <input {...getInputProps()} />
          {uploading ? (
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
    </div>
  );
}
