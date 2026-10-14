"use client";

import { ActionForm, SubmitButton } from "@/components/admin/form";
import { Field, inputCls } from "@/components/admin/ui";
import { login } from "@/lib/actions/auth";

export function LoginForm({ next }: { next: string }) {
  return (
    <ActionForm action={login} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Correo electrónico" htmlFor="email">
        <input id="email" name="email" type="email" autoComplete="username" required className={inputCls} />
      </Field>
      <Field label="Contraseña" htmlFor="password">
        <input id="password" name="password" type="password" autoComplete="current-password" required className={inputCls} />
      </Field>
      <SubmitButton className="w-full">Ingresar</SubmitButton>
    </ActionForm>
  );
}
