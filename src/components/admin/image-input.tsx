"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

const MAX_BYTES = 3.5 * 1024 * 1024;

async function downscale(file: File, maxWidth: number): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  if (bitmap.width <= maxWidth && file.size <= MAX_BYTES) {
    bitmap.close();
    return file;
  }
  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.88));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" });
}

export function ImageInput({
  name,
  defaultUrl,
  maxWidth = 2000,
  aspect = "aspect-video",
  removable = false,
  required = false,
}: {
  name: string;
  defaultUrl?: string | null;
  maxWidth?: number;
  aspect?: string;
  removable?: boolean;
  required?: boolean;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(defaultUrl ?? null);
  const [busy, setBusy] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const file = input.files?.[0];
    setError(null);
    if (!file) return;
    setBusy(true);
    try {
      const processed = await downscale(file, maxWidth);
      if (processed.size > 4 * 1024 * 1024) {
        setError("La imagen es demasiado pesada (máx. 4 MB).");
        input.value = "";
        return;
      }
      if (processed !== file) {
        const dt = new DataTransfer();
        dt.items.add(processed);
        input.files = dt.files;
      }
      setPreview(URL.createObjectURL(processed));
      setRemoved(false);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const onReset = () => {
      setPreview(defaultUrl ?? null);
      setRemoved(false);
      setError(null);
    };
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, [defaultUrl]);

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className={`relative flex ${aspect} w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-stone-300 bg-stone-50 text-stone-500 hover:border-brand-700 hover:text-brand-700`}
      >
        {preview && !removed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Vista previa" className="absolute inset-0 size-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-sm font-semibold">
            <ImagePlus className="size-6" /> Seleccionar imagen
          </span>
        )}
        {busy && (
          <span className="absolute inset-0 grid place-items-center bg-white/70">
            <Loader2 className="size-6 animate-spin" />
          </span>
        )}
      </label>
      <input
        ref={inputRef}
        id={id}
        type="file"
        name={name}
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={onChange}
        required={required && !preview}
        className="block w-full text-xs text-stone-600 file:mr-3 file:rounded-md file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold"
      />
      {removable && preview && !removed && (
        <button
          type="button"
          onClick={() => {
            setRemoved(true);
            if (inputRef.current) inputRef.current.value = "";
          }}
          className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:underline"
        >
          <X className="size-3" /> Quitar imagen
        </button>
      )}
      {removed && <input type="hidden" name={`${name}Remove`} value="1" />}
      {error && <p className="text-xs font-semibold text-red-700">{error}</p>}
    </div>
  );
}
