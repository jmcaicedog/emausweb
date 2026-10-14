import { whatsappLink } from "@/lib/utils";
import { WhatsAppIcon } from "@/components/icons/brand";

export function WhatsAppButton({ number, message }: { number: string; message?: string }) {
  const href = whatsappLink(number, message);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="fixed right-4 bottom-4 z-50 grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition hover:scale-105 hover:bg-[#1ebe5a] sm:right-6 sm:bottom-6"
    >
      <WhatsAppIcon className="size-8" />
    </a>
  );
}
