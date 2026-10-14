import { ActionForm, ConfirmSubmit, FormField, SubmitButton } from "@/components/admin/form";
import { ImageInput } from "@/components/admin/image-input";
import { Badge, Card, PageHeader, inputCls } from "@/components/admin/ui";
import { createTool, deleteTool, updateTool } from "@/lib/actions/content";
import { adminTools } from "@/lib/data/admin";

// Panel privado: render dinámico por petición, sin validación de navegación instantánea.
export const instant = false;

export const metadata = { title: "Herramientas" };

type Tool = Awaited<ReturnType<typeof adminTools>>[number];

export default async function ToolsPage() {
  const items = await adminTools();
  return (
    <>
      <PageHeader title="Herramientas" description="Enlaces a las aplicaciones de la comunidad. El ícono es opcional (cuadrado, PNG/SVG/WebP)." />
      <div className="space-y-6">
        {items.map((tool) => (
          <Card key={tool.id} title={tool.name} actions={!tool.active && <Badge>Oculta</Badge>}>
            <ActionForm action={updateTool}>
              <input type="hidden" name="id" value={tool.id} />
              <ToolFields tool={tool} />
              <div className="mt-4 flex justify-end">
                <SubmitButton>Guardar</SubmitButton>
              </div>
            </ActionForm>
            <form action={deleteTool} className="mt-3 flex justify-end border-t border-stone-100 pt-3">
              <input type="hidden" name="id" value={tool.id} />
              <ConfirmSubmit message={`¿Eliminar "${tool.name}"?`}>Eliminar</ConfirmSubmit>
            </form>
          </Card>
        ))}
        <Card title="Nueva herramienta">
          <ActionForm action={createTool} resetOnOk>
            <ToolFields />
            <div className="mt-4 flex justify-end">
              <SubmitButton>Agregar herramienta</SubmitButton>
            </div>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}

function ToolFields({ tool }: { tool?: Tool }) {
  const p = tool ? `t${tool.id}-` : "new-";
  return (
    <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
      <FormField name="icon" label="Ícono">
        <ImageInput name="icon" defaultUrl={tool?.iconUrl} maxWidth={256} aspect="aspect-square" removable={!!tool} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField name="name" htmlFor={p + "name"} label="Nombre">
          <input id={p + "name"} name="name" required maxLength={120} defaultValue={tool?.name ?? ""} className={inputCls} />
        </FormField>
        <FormField name="url" htmlFor={p + "url"} label="Enlace">
          <input id={p + "url"} name="url" type="url" required defaultValue={tool?.url ?? ""} className={inputCls} placeholder="https://" />
        </FormField>
        <FormField name="description" htmlFor={p + "description"} label="Descripción" className="sm:col-span-2">
          <input id={p + "description"} name="description" maxLength={300} defaultValue={tool?.description ?? ""} className={inputCls} />
        </FormField>
        <FormField name="sortOrder" htmlFor={p + "sortOrder"} label="Orden">
          <input id={p + "sortOrder"} name="sortOrder" type="number" min={0} max={999} defaultValue={tool?.sortOrder ?? 0} className={inputCls} />
        </FormField>
        <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold">
          <input type="checkbox" name="active" defaultChecked={tool?.active ?? true} className="size-4 accent-brand-700" /> Visible
        </label>
      </div>
    </div>
  );
}
