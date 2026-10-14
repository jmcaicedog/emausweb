import { ActionForm, ConfirmSubmit, FormField, SubmitButton } from "@/components/admin/form";
import { ImageInput } from "@/components/admin/image-input";
import { Card, PageHeader, inputCls } from "@/components/admin/ui";
import { createGalleryItem, deleteGalleryItem, updateGalleryItem } from "@/lib/actions/content";
import { adminGallery } from "@/lib/data/admin";

// Panel privado: render dinámico por petición, sin validación de navegación instantánea.
export const instant = false;

export const metadata = { title: "Galería de Instagram" };

type Item = Awaited<ReturnType<typeof adminGallery>>[number];

export default async function GalleryPage() {
  const items = await adminGallery();
  return (
    <>
      <PageHeader
        title="Galería de Instagram"
        description="Hasta 5 imágenes verticales (1080×1620 px, proporción 2:3) que se muestran en la sección de Instagram. La URL de la cuenta se edita en Configuración."
      />
      <div className="grid gap-6 md:grid-cols-2">
        {items.map((item, i) => (
          <Card key={item.id} title={`Imagen ${i + 1}`}>
            <ActionForm action={updateGalleryItem}>
              <input type="hidden" name="id" value={item.id} />
              <ItemFields item={item} />
              <div className="mt-4 flex justify-end">
                <SubmitButton>Guardar</SubmitButton>
              </div>
            </ActionForm>
            <form action={deleteGalleryItem} className="mt-3 flex justify-end border-t border-stone-100 pt-3">
              <input type="hidden" name="id" value={item.id} />
              <ConfirmSubmit message="¿Eliminar esta imagen?">Eliminar</ConfirmSubmit>
            </form>
          </Card>
        ))}
        {items.length < 5 ? (
          <Card title="Agregar imagen">
            <ActionForm action={createGalleryItem} resetOnOk>
              <ItemFields />
              <div className="mt-4 flex justify-end">
                <SubmitButton>Agregar</SubmitButton>
              </div>
            </ActionForm>
          </Card>
        ) : (
          <p className="text-sm text-stone-500 md:col-span-2">Ya tienes las 5 imágenes. Elimina una para agregar otra.</p>
        )}
      </div>
    </>
  );
}

function ItemFields({ item }: { item?: Item }) {
  const p = item ? `g${item.id}-` : "new-";
  return (
    <div className="grid gap-4">
      <FormField name="image" label="Imagen">
        <ImageInput name="image" defaultUrl={item?.imageUrl} maxWidth={1080} aspect="aspect-[2/3] max-w-60 mx-auto" required={!item} />
      </FormField>
      <FormField name="alt" htmlFor={p + "alt"} label="Descripción (texto alternativo)" hint="Describe la imagen para accesibilidad y SEO.">
        <input id={p + "alt"} name="alt" maxLength={300} defaultValue={item?.alt ?? ""} className={inputCls} />
      </FormField>
      <div className="grid grid-cols-[1fr_6rem] gap-4">
        <FormField name="postUrl" htmlFor={p + "postUrl"} label="Enlace a la publicación (opcional)">
          <input id={p + "postUrl"} name="postUrl" defaultValue={item?.postUrl ?? ""} className={inputCls} placeholder="https://www.instagram.com/p/..." />
        </FormField>
        <FormField name="sortOrder" htmlFor={p + "sortOrder"} label="Orden">
          <input id={p + "sortOrder"} name="sortOrder" type="number" min={0} max={999} defaultValue={item?.sortOrder ?? 0} className={inputCls} />
        </FormField>
      </div>
    </div>
  );
}
