import { ActionForm, FormField, SubmitButton } from "@/components/admin/form";
import { Card, PageHeader, inputCls } from "@/components/admin/ui";
import { saveSettings } from "@/lib/actions/content";
import { adminSettings } from "@/lib/data/admin";
import { DEFAULT_SETTINGS } from "@/lib/data/public";

// Panel privado: render dinámico por petición, sin validación de navegación instantánea.
export const instant = false;

export const metadata = { title: "Configuración" };

export default async function SettingsPage() {
  const s = (await adminSettings()) ?? DEFAULT_SETTINGS;
  return (
    <>
      <PageHeader title="Configuración del sitio" description="WhatsApp, datos de contacto, Instagram y SEO." />
      <ActionForm action={saveSettings} className="space-y-6">
        <Card title="WhatsApp">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField name="whatsappNumber" label="Número de WhatsApp" hint="Con indicativo de país, sin +. Ej: 573001234567. Vacío oculta el botón.">
              <input id="whatsappNumber" name="whatsappNumber" inputMode="tel" defaultValue={s.whatsappNumber} className={inputCls} />
            </FormField>
            <FormField name="whatsappMessage" label="Mensaje predeterminado">
              <input id="whatsappMessage" name="whatsappMessage" defaultValue={s.whatsappMessage} className={inputCls} />
            </FormField>
          </div>
        </Card>
        <Card title="Contacto">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField name="address" label="Dirección" className="sm:col-span-2">
              <input id="address" name="address" defaultValue={s.address} className={inputCls} />
            </FormField>
            <FormField name="mapUrl" label="Enlace de Google Maps">
              <input id="mapUrl" name="mapUrl" type="url" defaultValue={s.mapUrl} className={inputCls} placeholder="https://maps.google.com/..." />
            </FormField>
            <FormField name="phone" label="Teléfono">
              <input id="phone" name="phone" defaultValue={s.phone} className={inputCls} />
            </FormField>
            <FormField name="email" label="Correo electrónico">
              <input id="email" name="email" type="email" defaultValue={s.email} className={inputCls} />
            </FormField>
            <FormField name="instagramUrl" label="Cuenta de Instagram">
              <input id="instagramUrl" name="instagramUrl" type="url" defaultValue={s.instagramUrl} className={inputCls} />
            </FormField>
            <FormField name="groupCoordinator" label="Coordinador del grupo">
              <input id="groupCoordinator" name="groupCoordinator" defaultValue={s.groupCoordinator} className={inputCls} />
            </FormField>
            <FormField name="spiritualCoordinator" label="Coordinador espiritual">
              <input id="spiritualCoordinator" name="spiritualCoordinator" defaultValue={s.spiritualCoordinator} className={inputCls} />
            </FormField>
          </div>
        </Card>
        <Card title="SEO">
          <div className="grid gap-4">
            <FormField name="seoTitle" label="Título del sitio">
              <input id="seoTitle" name="seoTitle" required maxLength={120} defaultValue={s.seoTitle} className={inputCls} />
            </FormField>
            <FormField name="seoDescription" label="Descripción" hint="Entre 120 y 160 caracteres es lo ideal para Google.">
              <textarea id="seoDescription" name="seoDescription" required rows={3} maxLength={300} defaultValue={s.seoDescription} className={inputCls} />
            </FormField>
          </div>
        </Card>
        <div className="flex justify-end">
          <SubmitButton>Guardar cambios</SubmitButton>
        </div>
      </ActionForm>
    </>
  );
}
