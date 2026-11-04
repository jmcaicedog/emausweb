import { FormField } from "@/components/admin/form";
import { ImageInput } from "@/components/admin/image-input";
import { inputCls } from "@/components/admin/ui";
import { toLocalInputValue } from "@/lib/dates";

type EventLike = {
  title: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  startsAt: Date;
  endsAt: Date | null;
  location: string;
  mapUrl: string;
  published: boolean;
  isSpecial: boolean;
  pricePerPerson: number;
};

export function EventFields({ event }: { event?: EventLike }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField name="title" label="Título" className="sm:col-span-2">
          <input id="title" name="title" required maxLength={160} defaultValue={event?.title} className={inputCls} />
        </FormField>
        <FormField name="slug" label="URL amigable (opcional)" hint="Se genera a partir del título si se deja vacía." className="sm:col-span-2">
          <div className="flex items-center rounded-lg border border-stone-300 bg-stone-50 text-sm focus-within:ring-2 focus-within:ring-brand-100">
            <span className="pl-3 text-stone-500">/eventos/</span>
            <input id="slug" name="slug" maxLength={150} defaultValue={event?.slug} className="w-full rounded-r-lg bg-white px-2 py-2 outline-none" />
          </div>
        </FormField>
        <FormField name="startsAt" label="Inicio">
          <input id="startsAt" name="startsAt" type="datetime-local" required defaultValue={toLocalInputValue(event?.startsAt)} className={inputCls} />
        </FormField>
        <FormField name="endsAt" label="Fin (opcional)">
          <input id="endsAt" name="endsAt" type="datetime-local" defaultValue={toLocalInputValue(event?.endsAt)} className={inputCls} />
        </FormField>
        <FormField name="location" label="Ubicación">
          <input id="location" name="location" maxLength={300} defaultValue={event?.location} className={inputCls} placeholder="Parroquia Cristo Rey, Cali" />
        </FormField>
        <FormField name="mapUrl" label="Enlace de Google Maps (opcional)">
          <input id="mapUrl" name="mapUrl" type="url" defaultValue={event?.mapUrl} className={inputCls} placeholder="https://maps.app.goo.gl/..." />
        </FormField>
        <FormField name="description" label="Descripción" className="sm:col-span-2">
          <textarea id="description" name="description" rows={7} maxLength={5000} defaultValue={event?.description} className={inputCls} />
        </FormField>
        <label className="flex items-start gap-2 text-sm font-semibold sm:col-span-2">
          <input type="checkbox" name="isSpecial" defaultChecked={event?.isSpecial ?? false} className="mt-0.5 size-4 accent-brand-700" />
          <span>
            Evento especial con inscripción y control de pagos
            <span className="mt-0.5 block text-xs font-normal text-stone-500">Genera un formulario público y un QR de asistencia por inscripción.</span>
          </span>
        </label>
        <FormField name="pricePerPerson" label="Precio por persona (COP)" hint="Solo aplica a eventos especiales; se multiplica por el titular más sus acompañantes." className="sm:col-span-2">
          <input
            id="pricePerPerson"
            name="pricePerPerson"
            type="number"
            min="0"
            max="20000000"
            step="1"
            required
            defaultValue={event?.pricePerPerson ?? 0}
            className={inputCls}
          />
        </FormField>
        <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
          <input type="checkbox" name="published" defaultChecked={event?.published ?? true} className="size-4 accent-brand-700" />
          Publicado (visible en el calendario y con el llamado a lista habilitado)
        </label>
      </div>
      <FormField name="image" label="Imagen del evento">
        <ImageInput name="image" defaultUrl={event?.imageUrl} maxWidth={1600} aspect="aspect-[4/3]" removable={!!event} />
      </FormField>
    </div>
  );
}
