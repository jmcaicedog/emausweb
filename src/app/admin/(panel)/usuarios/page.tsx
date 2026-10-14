import { ActionForm, ConfirmSubmit, FormField, SubmitButton } from "@/components/admin/form";
import { Badge, Card, PageHeader, inputCls } from "@/components/admin/ui";
import { changePassword, createAdminUser, deleteAdminUser } from "@/lib/actions/auth";
import { requireAdmin } from "@/lib/auth/dal";
import { adminUsersList } from "@/lib/data/admin";

// Panel privado: render dinámico por petición, sin validación de navegación instantánea.
export const instant = false;

export const metadata = { title: "Usuarios" };

export default async function UsersPage() {
  const [me, users] = await Promise.all([requireAdmin(), adminUsersList()]);
  return (
    <>
      <PageHeader title="Usuarios administradores" description="Personas con acceso a este panel." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Administradores" className="lg:col-span-2">
          <ul className="divide-y divide-stone-100">
            {users.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {u.name} {u.id === me.id && <Badge tone="green">Tú</Badge>}
                  </p>
                  <p className="truncate text-sm text-stone-500">{u.email}</p>
                </div>
                {u.id !== me.id && users.length > 1 && (
                  <form action={deleteAdminUser}>
                    <input type="hidden" name="id" value={u.id} />
                    <ConfirmSubmit message={`¿Quitar el acceso de ${u.name}?`}>Eliminar</ConfirmSubmit>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Nuevo administrador">
          <ActionForm action={createAdminUser} resetOnOk className="space-y-4">
            <FormField name="name" htmlFor="new-name" label="Nombre">
              <input id="new-name" name="name" required maxLength={120} className={inputCls} />
            </FormField>
            <FormField name="email" htmlFor="new-email" label="Correo electrónico">
              <input id="new-email" name="email" type="email" required autoComplete="off" className={inputCls} />
            </FormField>
            <FormField name="password" htmlFor="new-password" label="Contraseña" hint="Mínimo 10 caracteres.">
              <input id="new-password" name="password" type="password" required minLength={10} autoComplete="new-password" className={inputCls} />
            </FormField>
            <SubmitButton>Crear usuario</SubmitButton>
          </ActionForm>
        </Card>
        <Card title="Cambiar mi contraseña">
          <ActionForm action={changePassword} resetOnOk className="space-y-4">
            <FormField name="current" label="Contraseña actual">
              <input id="current" name="current" type="password" required autoComplete="current-password" className={inputCls} />
            </FormField>
            <FormField name="password" htmlFor="pw-new" label="Nueva contraseña" hint="Mínimo 10 caracteres.">
              <input id="pw-new" name="password" type="password" required minLength={10} autoComplete="new-password" className={inputCls} />
            </FormField>
            <FormField name="confirm" label="Confirmar nueva contraseña">
              <input id="confirm" name="confirm" type="password" required minLength={10} autoComplete="new-password" className={inputCls} />
            </FormField>
            <SubmitButton>Actualizar contraseña</SubmitButton>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
