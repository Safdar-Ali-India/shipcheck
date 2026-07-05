"use client";

import { useCallback, useState } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCEPTED_IMAGE_EXT } from "@/lib/constants";
import { validateImageFile } from "@/lib/validation";

interface DropzoneProps {
  label: string;
  value?: File | null;
  preview?: string | null;
  onChange: (file: File, preview: string) => void;
  onClear: () => void;
  disabled?: boolean;
}

export function Dropzone({
  label,
  value,
  preview,
  onChange,
  onClear,
  disabled,
}: DropzoneProps) {
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      const validationError = validateImageFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onload = () => onChange(file, reader.result as string);
      reader.readAsDataURL(file);
    },
    [onChange],
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setDragging(false);
      if (disabled) return;
      const file = event.dataTransfer.files[0];
      if (file) void handleFile(file);
    },
    [disabled, handleFile],
  );

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</p>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "relative flex min-h-[180px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors",
          dragging
            ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
            : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        {preview ? (
          <div className="relative w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt={`${label} preview`}
              className="mx-auto max-h-40 rounded-lg object-contain"
            />
            <button
              type="button"
              onClick={onClear}
              className="absolute -right-2 -top-2 rounded-full bg-zinc-900 p-1 text-white hover:bg-zinc-700"
              aria-label={`Remove ${label}`}
            >
              <X className="h-4 w-4" />
            </button>
            {value && (
              <p className="mt-2 truncate text-center text-xs text-zinc-500">
                {value.name}
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
              <ImageIcon className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Drag & drop an image
            </p>
            <p className="mt-1 text-xs text-zinc-500">PNG, JPEG, or WebP — max 10 MB</p>
            <label className="mt-4 cursor-pointer">
              <span className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500">
                <Upload className="h-4 w-4" />
                Choose file
              </span>
              <input
                type="file"
                accept={ACCEPTED_IMAGE_EXT}
                className="sr-only"
                disabled={disabled}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
                }}
              />
            </label>
          </>
        )}
      </div>
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
    </div>
  );
}
