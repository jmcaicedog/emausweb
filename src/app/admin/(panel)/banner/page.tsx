import { ActionForm, ConfirmSubmit, FormField, SubmitButton } from "@/components/admin/form";
import { ImageInput } from "@/components/admin/image-input";
import { Badge, Card, PageHeader, buttonCls, inputCls } from "@/components/admin/ui";
import { createSlide, deleteSlide, setBannerEnabled, updateSlide } from "@/lib/actions/content";
import { adminSettings, adminSlides } from "@/lib/data/admin";

// Panel privado: render dinámico por petición, sin validación de navegación instantánea.
export const instant = false;

export const metadata = { title: "Banner" };

type Slide = Awaited<ReturnType<typeof adminSlides>>[number];

export default async function BannerPage() {
  const [settings, slides] = await Promise.all([adminSettings(), adminSlides()]);
  const enabled = settings?.bannerEnabled ?? true;
  return (
    <>
      <PageHeader title="Banner rotativo" description="Entre 1 y 3 diapositivas. Imagen de escritorio recomendada: 1920×800 px; móvil (opcional): 900×1125 px." />
      <Card className="mb-6">
        <form action={setBannerEnabled} className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-bold">
              Estado del banner: {enabled ? <Badge tone="green">Activo</Badge> : <Badge>Desactivado</Badge>}
            </p>
            <p className="text-sm text-stone-600">Si se desactiva, la portada muestra el logo y el nombre de la comunidad.</p>
          </div>
          <input type="hidden" name="enabled" value={enabled ? "0" : "1"} />
          <button type="submit" className={enabled ? buttonCls.secondary : buttonCls.primary}>
            {enabled ? "Desactivar banner" : "Activar banner"}
          </button>
        </form>
      </Card>

      <div className="space-y-6">
        {slides.map((slide, i) => (
          <Card key={slide.id} title={`Diapositiva ${i + 1}`} actions={!slide.active && <Badge>Oculta</Badge>}>
            <ActionForm action={updateSlide}>
              <input type="hidden" name="id" value={slide.id} />
              <SlideFields slide={slide} />
              <div className="mt-5 flex justify-end">
                <SubmitButton>Guardar diapositiva</SubmitButton>
              </div>
            </ActionForm>
            <form action={deleteSlide} className="mt-3 flex justify-end border-t border-stone-100 pt-3">
              <input type="hidden" name="id" value={slide.id} />
              <ConfirmSubmit message="¿Eliminar esta diapositiva?">Eliminar</ConfirmSubmit>
            </form>
          </Card>
        ))}

        {slides.length < 3 ? (
          <Card title="Nueva diapositiva">
            <ActionForm action={createSlide} resetOnOk>
              <SlideFields />
              <div className="mt-5 flex justify-end">
                <SubmitButton>Agregar diapositiva</SubmitButton>
              </div>
            </ActionForm>
          </Card>
        ) : (
          <p className="text-sm text-stone-500">Ya tienes el máximo de 3 diapositivas. Elimina una para agregar otra.</p>
        )}
      </div>
    </>
  );
}

function SlideFields({ slide }: { slide?: Slide }) {
  const p = slide ? `s${slide.id}-` : "new-";
  return (
    <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
      <FormField name="image" label="Imagen (escritorio)">
        <ImageInput name="image" defaultUrl={slide?.imageUrl} maxWidth={2400} aspect="aspect-[12/5]" required={!slide} />
      </FormField>
      <FormField name="mobileImage" label="Imagen móvil (opcional)">
        <ImageInput name="mobileImage" defaultUrl={slide?.mobileImageUrl} maxWidth={1200} aspect="aspect-[4/5]" removable={!!slide} />
      </FormField>
      <FormField name="title" htmlFor={p + "title"} label="Título">
        <input id={p + "title"} name="title" maxLength={160} defaultValue={slide?.title ?? ""} className={inputCls} />
      </FormField>
      <FormField name="sortOrder" htmlFor={p + "sortOrder"} label="Orden">
        <input id={p + "sortOrder"} name="sortOrder" type="number" min={0} max={999} defaultValue={slide?.sortOrder ?? 0} className={inputCls} />
      </FormField>
      <FormField name="subtitle" htmlFor={p + "subtitle"} label="Subtítulo" className="md:col-span-2">
        <input id={p + "subtitle"} name="subtitle" maxLength={300} defaultValue={slide?.subtitle ?? ""} className={inputCls} />
      </FormField>
      <FormField name="ctaLabel" htmlFor={p + "ctaLabel"} label="Texto del botón">
        <input id={p + "ctaLabel"} name="ctaLabel" maxLength={60} defaultValue={slide?.ctaLabel ?? ""} className={inputCls} placeholder="Ver eventos" />
      </FormField>
      <FormField name="ctaUrl" htmlFor={p + "ctaUrl"} label="Enlace del botón">
        <input id={p + "ctaUrl"} name="ctaUrl" defaultValue={slide?.ctaUrl ?? ""} className={inputCls} placeholder="/#eventos o https://..." />
      </FormField>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" name="active" defaultChecked={slide?.active ?? true} className="size-4 accent-brand-700" /> Visible
      </label>
    </div>
  );
}
