"use client";

import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, startTransition, use, useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/actions/types";
import { buttonCls, Field } from "./ui";

const FieldErrorsContext = createContext<ActionState["fieldErrors"]>(undefined);
export const useFieldErrors = () => use(FieldErrorsContext) ?? {};
const PendingContext = createContext(false);

export function ActionForm({
  action,
  children,
  className,
  redirectOnOk,
  resetOnOk,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
  redirectOnOk?: string;
  resetOnOk?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!state.ok) return;
    if (resetOnOk) formRef.current?.reset();
    if (redirectOnOk) router.push(redirectOnOk);
  }, [state, redirectOnOk, resetOnOk, router]);
  return (
    <form
      ref={formRef}
      className={className}
      onSubmit={(e) => {
        // Evita el reinicio automático del formulario de React 19 para conservar lo digitado si hay errores.
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => formAction(fd));
      }}
    >
      <PendingContext value={pending}>
        <FieldErrorsContext value={state.fieldErrors}>
          <FormMessage state={state} />
          {children}
        </FieldErrorsContext>
      </PendingContext>
    </form>
  );
}

export function FormMessage({ state }: { state: ActionState }) {
  if (state.error)
    return (
      <p role="alert" className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
        <TriangleAlert className="mt-0.5 size-4 shrink-0" /> {state.error}
      </p>
    );
  if (state.ok && state.message)
    return (
      <p role="status" className="mb-4 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-800">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> {state.message}
      </p>
    );
  return null;
}

export function SubmitButton({ children, variant = "primary", className }: { children: React.ReactNode; variant?: keyof typeof buttonCls; className?: string }) {
  const status = useFormStatus();
  const pending = use(PendingContext) || status.pending;
  return (
    <button type="submit" disabled={pending} className={`${buttonCls[variant]} ${className ?? ""}`}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export function ConfirmSubmit({ children, message, variant = "danger" }: { children: React.ReactNode; message: string; variant?: keyof typeof buttonCls }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={buttonCls[variant]}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {pending && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export function FieldError({ name }: { name: string }) {
  const errors = useFieldErrors();
  const msg = errors[name]?.[0];
  return msg ? <p className="text-xs font-semibold text-red-700">{msg}</p> : null;
}

export function FormField({ name, htmlFor, ...props }: Omit<React.ComponentProps<typeof Field>, "error"> & { name: string }) {
  const errors = useFieldErrors();
  return <Field htmlFor={htmlFor ?? name} error={errors[name]} {...props} />;
}
