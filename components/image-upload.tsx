"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";

import { Progress } from "@/components/ui/progress";
import { X, Loader2, UploadCloud } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

interface ImageUploadProps {
  value: string[];
  onChange: (value: string[]) => void;
  onRemove: (value: string) => void;
}

export function ImageUpload({ value, onChange, onRemove }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    const uploadPromises = acceptedFiles.map(async (file) => {
      const storageRef = ref(storage, `listings/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise<string>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgress(prog);
          },
          (error) => {
            console.error("Upload error:", error);
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          }
        );
      });
    });

    try {
      const urls = await Promise.all(uploadPromises);
      onChange([...value, ...urls]);
      toast.success("Images uploaded successfully");
    } catch {
      toast.error("Failed to upload images");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [value, onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true,
  });

  const handleRemove = async (url: string) => {
    onRemove(url);
    try {
      // Best effort deletion from storage if it matches our pattern
      if (url.includes("firebasestorage.googleapis.com")) {
        const imageRef = ref(storage, url);
        await deleteObject(imageRef);
      }
    } catch (error) {
      console.warn("Could not delete from storage:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {value.map((url) => (
          <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
            <Image
              src={url}
              alt="Listing Image"
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
            <button
              onClick={() => handleRemove(url)}
              className="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 shadow-lg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        <div
          {...getRootProps()}
          className={`flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
            isDragActive ? "border-red-500 bg-red-500/10" : "border-zinc-800 bg-zinc-950 hover:bg-zinc-900"
          }`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-red-500" />
              <span className="text-xs text-zinc-500">{Math.round(progress)}%</span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center p-2">
              <UploadCloud className="mb-2 h-8 w-8 text-zinc-600" />
              <span className="text-xs font-semibold text-zinc-400">Upload Images</span>
              <span className="mt-1 text-[10px] text-zinc-600">Drag & drop or click</span>
            </div>
          )}
        </div>
      </div>
      {uploading && (
        <Progress value={progress} className="h-1 bg-zinc-800 data-[state=checked]:bg-red-600" />
      )}
    </div>
  );
}
