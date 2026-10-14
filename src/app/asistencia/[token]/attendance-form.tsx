"use client";

import { CheckCircle2, Info, Loader2 } from "lucide-react";
import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { lookupPerson, registerAttendance, type RegisterState } from "@/lib/actions/attendance";

const input =
  "block w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-ink placeholder:text-stone-400 focus:border-brand-700 focus:ring-2 focus:ring-brand-100 focus:outline-none disabled:bg-stone-100 disabled:text-stone-500";

type Lookup = "idle" | "loading" | "found" | "new" | "registered";

export function AttendanceForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<RegisterState, FormData>(registerAttendance, {});
  const [doc, setDoc] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [lookup, setLookup] = useState<Lookup>("idle");
  const [lookupMsg, setLookupMsg] = useState<string | null>(null);
  const lastQueried = useRef("");
  const requestId = useRef(0);

  async function runLookup(value: string) {
    const clean = value.trim();
    if (clean.length < 5 || clean === lastQueried.current) return;
    lastQueried.current = clean;
    const id = ++requestId.current;
    setLookup("loading");
    setLookupMsg(null);
    const res = await lookupPerson(token, clean);
    if (id !== requestId.current) return;
    if (res.status === "found") {
      setFullName(res.fullName);
      setPhone(res.phone);
      setBirthDate(res.birthDate);
      setLookup(res.alreadyRegistered ? "registered" : "found");
    } else if (res.status === "new") {
      setLookup("new");
    } else {
      setLookup("idle");
      setLookupMsg(res.message);
      lastQueried.current = "";
    }
  }

  useEffect(() => {
    const clean = doc.trim();
    if (clean.length < 6) return;
    const t = setTimeout(() => runLookup(clean), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc]);

  if (state.status === "ok" || state.status === "duplicate") {
    const ok = state.status === "ok";
    return (
      <div role="status" className="py-6 text-center">
        <CheckCircle2 className={`mx-auto size-14 ${ok ? "text-green-600" : "text-amber-500"}`} />
        <p className="mt-4 text-xl font-extrabold">{ok ? `¡Gracias${state.name ? `, ${state.name}` : ""}!` : "Ya estabas registrado"}</p>
        <p className="mt-1 text-stone-600">{ok ? "Tu asistencia quedó registrada. ¡Bienvenido!" : "Tu asistencia a este evento ya había quedado registrada."}</p>
        <Link href="/" className="mt-6 inline-block font-semibold text-brand-700 hover:underline">Ir al sitio de Emaús</Link>
      </div>
    );
  }

  const fe = state.fieldErrors ?? {};
  const blocked = lookup === "registered";
  const err = (name: string) =>
    fe[name]?.[0] ? (
      <p id={`${name}-error`} className="mt-1 text-sm font-semibold text-red-700">
        {fe[name]![0]}
      </p>
    ) : null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      className="space-y-5"
    >
      <input type="hidden" name="token" value={token} />
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">No llenar</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {state.status === "error" && state.message && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{state.message}</p>
      )}

      <div>
        <label htmlFor="documentNumber" className="mb-1.5 block text-sm font-bold">Número de cédula</label>
        <div className="relative">
          <input
            id="documentNumber"
            name="documentNumber"
            inputMode="numeric"
            autoComplete="off"
            required
            maxLength={15}
            pattern="[0-9A-Za-z]{4,15}"
            value={doc}
            onChange={(e) => {
              setDoc(e.target.value.replace(/[^0-9A-Za-z]/g, ""));
              if (lookup !== "idle" && lookup !== "loading") setLookup("idle");
            }}
            onBlur={() => runLookup(doc)}
            aria-invalid={!!fe.documentNumber}
            aria-describedby="doc-help"
            className={input}
          />
          {lookup === "loading" && <Loader2 className="absolute top-1/2 right-3 size-5 -translate-y-1/2 animate-spin text-stone-400" />}
        </div>
        {err("documentNumber")}
        <p id="doc-help" aria-live="polite" className="mt-1.5 text-sm text-stone-600">
          {lookup === "found" && <span className="font-semibold text-green-700">Encontramos tus datos. Verifícalos y confirma tu asistencia.</span>}
          {lookup === "new" && "Primera vez: completa tus datos."}
          {lookupMsg && <span className="font-semibold text-red-700">{lookupMsg}</span>}
          {lookup === "idle" && !lookupMsg && "Si ya te registraste antes, tus datos se cargarán automáticamente."}
        </p>
      </div>

      {blocked ? (
        <p role="status" className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          <Info className="mt-0.5 size-5 shrink-0" /> Ya registraste tu asistencia a este evento. Solo se permite un registro por persona.
        </p>
      ) : (
        <>
          <div>
            <label htmlFor="fullName" className="mb-1.5 block text-sm font-bold">Nombre completo</label>
            <input id="fullName" name="fullName" autoComplete="name" required maxLength={160} value={fullName} onChange={(e) => setFullName(e.target.value)} aria-invalid={!!fe.fullName} className={input} />
            {err("fullName")}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-bold">Teléfono</label>
              <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} aria-invalid={!!fe.phone} className={input} />
              {err("phone")}
            </div>
            <div>
              <label htmlFor="birthDate" className="mb-1.5 block text-sm font-bold">Fecha de nacimiento</label>
              <input id="birthDate" name="birthDate" type="date" autoComplete="bday" required min="1900-01-01" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} aria-invalid={!!fe.birthDate} className={input} />
              {err("birthDate")}
            </div>
          </div>
          <div>
            <label className="flex items-start gap-3 text-sm text-stone-700">
              <input type="checkbox" name="consent" required className="mt-0.5 size-5 shrink-0 accent-brand-700" />
              <span>
                Autorizo el tratamiento de mis datos personales conforme a la{" "}
                <Link href="/privacidad" target="_blank" className="font-semibold text-brand-700 underline">política de privacidad</Link>.
              </span>
            </label>
            {err("consent")}
          </div>
          <button
            type="submit"
            disabled={pending || lookup === "loading"}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-6 py-3.5 text-base font-bold text-white shadow-sm hover:bg-brand-800 disabled:opacity-60"
          >
            {pending && <Loader2 className="size-5 animate-spin" />}
            Registrar asistencia
          </button>
        </>
      )}
    </form>
  );
}
