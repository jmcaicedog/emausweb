"use client";

import { Check, Copy, Download, ExternalLink, Share2 } from "lucide-react";
import { useState } from "react";
import { buttonCls } from "./ui";

export function QrPanel({ svg, url, pngHref, fileName, title }: { svg: string; url: string; pngHref: string; fileName: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function share() {
    setShareError(null);
    const text = `Llamado a lista: ${title}`;
    try {
      const res = await fetch(pngHref);
      const file = new File([await res.blob()], fileName, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: text, text: `${text}\n${url}` });
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: text, text, url });
        return;
      }
      await copy();
      setShareError("Tu navegador no permite compartir directamente; copiamos el enlace.");
    } catch (e) {
      if ((e as Error).name !== "AbortError") setShareError("No se pudo compartir.");
    }
  }

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
      <div
        className="mx-auto w-56 shrink-0 rounded-xl border border-stone-200 bg-white p-3 sm:mx-0 [&_svg]:h-auto [&_svg]:w-full"
        role="img"
        aria-label={`Código QR de asistencia para ${title}`}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <div className="min-w-0 flex-1 space-y-4">
        <p className="text-sm text-stone-600">
          Los asistentes escanean este código y diligencian su cédula, nombre, teléfono y fecha de nacimiento. Cada persona puede registrarse una sola vez por evento.
        </p>
        <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 p-2">
          <code className="min-w-0 flex-1 truncate px-1 text-xs">{url}</code>
          <button type="button" onClick={copy} className={buttonCls.ghost} aria-label="Copiar enlace">
            {copied ? <Check className="size-4 text-green-700" /> : <Copy className="size-4" />}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={pngHref} download={fileName} className={buttonCls.primary}>
            <Download className="size-4" /> Descargar PNG
          </a>
          <button type="button" onClick={share} className={buttonCls.secondary}>
            <Share2 className="size-4" /> Compartir
          </button>
          <a href={url} target="_blank" className={buttonCls.secondary}>
            <ExternalLink className="size-4" /> Abrir formulario
          </a>
        </div>
        {shareError && <p className="text-xs text-stone-600">{shareError}</p>}
      </div>
    </div>
  );
}
