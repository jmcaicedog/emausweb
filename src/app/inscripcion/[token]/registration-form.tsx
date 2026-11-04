"use client";

import { CheckCircle2, Info, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { lookupSpecialPerson, registerSpecialEvent, type SpecialLookupResult, type SpecialRegistrationState } from "@/lib/actions/special-events";

const input =
  "block w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-ink placeholder:text-stone-400 focus:border-brand-700 focus:ring-2 focus:ring-brand-100 focus:outline-none disabled:bg-stone-100 disabled:text-stone-500";

type Lookup = "idle" | "loading" | "found" | "new" | "registered";

export function SpecialRegistrationForm({ token, pricePerPerson }: { token: string; pricePerPerson: number }) {
  const [state, action, pending] = useActionState<SpecialRegistrationState, FormData>(registerSpecialEvent, {});
  const [doc, setDoc] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [companions, setCompanions] = useState(0);
  const [lookup, setLookup] = useState<Lookup>("idle");
  const [lookupMsg, setLookupMsg] = useState<string | null>(null);
  const lastQueried = useRef("");
  const requestId = useRef(0);

  async function runLookup(value: string) {
    const clean = value.trim();
    if (clean.length < 4 || clean === lastQueried.current) return;
    lastQueried.current = clean;
    const id = ++requestId.current;
    setLookup("loading");
    setLookupMsg(null);
    const result: SpecialLookupResult = await lookupSpecialPerson(token, clean);
    if (id !== requestId.current) return;
    if (result.status === "found") {
      setFullName(result.fullName);
      setPhone(result.phone);
      setBirthDate(result.birthDate);
      setLookup(result.alreadyRegistered ? "registered" : "found");
    } else if (result.status === "new") {
      setLookup("new");
    } else {
      setLookup("idle");
      setLookupMsg(result.message);
      lastQueried.current = "";
    }
  }

  useEffect(() => {
    const clean = doc.trim();
    if (clean.length < 6) return;
    const timeout = setTimeout(() => runLookup(clean), 600);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc]);

  if (state.status === "ok" && state.attendanceToken) {
    const qrUrl = `/qr/inscripcion/${state.attendanceToken}`;
    return (
      <div role="status" className="py-4 text-center">
        <CheckCircle2 className="mx-auto size-14 text-green-600" />
        <p className="mt-4 text-xl font-extrabold">¡Inscripción confirmada{state.name ? `, ${state.name}` : ""}!</p>
        <p className="mt-1 text-stone-600">Valor total: <strong>{formatCurrency(state.amountDue ?? 0)}</strong></p>
        <div className="mx-auto mt-5 w-48 rounded-xl border border-stone-200 bg-white p-3">
          <Image src={qrUrl} alt="Código QR de asistencia del grupo" width={192} height={192} className="h-auto w-full" unoptimized />
        </div>
        <p className="mt-3 text-sm text-stone-600">Guarda este código y preséntalo el día del evento para registrar la asistencia de tu grupo.</p>
        <a href={qrUrl} download="qr-asistencia-evento.png" className="mt-4 inline-block font-semibold text-brand-700 hover:underline">Descargar código QR</a>
        <Link href="/" className="mt-5 block font-semibold text-brand-700 hover:underline">Ir al sitio de Emaús</Link>
      </div>
    );
  }

  const fieldErrors = state.fieldErrors ?? {};
  const blocked = lookup === "registered" || state.status === "duplicate";
  const error = (name: string) => fieldErrors[name]?.[0] && <p className="mt-1 text-sm font-semibold text-red-700">{fieldErrors[name]![0]}</p>;
  const amountDue = pricePerPerson * (companions + 1);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => action(formData));
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
        <label htmlFor="documentNumber" className="mb-1.5 block text-sm font-bold">Número de documento</label>
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
            onChange={(event) => {
              const next = event.target.value.replace(/[^0-9A-Za-z]/g, "");
              setDoc(next);
              lastQueried.current = "";
              requestId.current++;
              setLookup("idle");
              setLookupMsg(null);
              setFullName("");
              setPhone("");
              setBirthDate("");
            }}
            onBlur={() => runLookup(doc)}
            aria-invalid={!!fieldErrors.documentNumber}
            className={input}
          />
          {lookup === "loading" && <Loader2 className="absolute top-1/2 right-3 size-5 -translate-y-1/2 animate-spin text-stone-400" />}
        </div>
        {error("documentNumber")}
        <p aria-live="polite" className="mt-1.5 text-sm text-stone-600">
          {lookup === "found" && <span className="font-semibold text-green-700">Encontramos tus datos. Verifícalos y completa la inscripción.</span>}
          {lookup === "new" && "Primera vez: completa tus datos."}
          {lookupMsg && <span className="font-semibold text-red-700">{lookupMsg}</span>}
          {lookup === "idle" && !lookupMsg && "Si ya te registraste antes, tus datos se cargarán automáticamente."}
        </p>
      </div>

      {blocked ? (
        <p role="status" className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          <Info className="mt-0.5 size-5 shrink-0" />
          {state.status === "duplicate" ? state.message : "Ya existe una inscripción para este documento en el evento."}
        </p>
      ) : (
        <>
          <div>
            <label htmlFor="fullName" className="mb-1.5 block text-sm font-bold">Nombre completo</label>
            <input id="fullName" name="fullName" autoComplete="name" required maxLength={160} value={fullName} onChange={(event) => setFullName(event.target.value)} aria-invalid={!!fieldErrors.fullName} className={input} />
            {error("fullName")}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-bold">Teléfono</label>
              <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={20} value={phone} onChange={(event) => setPhone(event.target.value)} aria-invalid={!!fieldErrors.phone} className={input} />
              {error("phone")}
            </div>
            <div>
              <label htmlFor="birthDate" className="mb-1.5 block text-sm font-bold">Fecha de nacimiento</label>
              <input id="birthDate" name="birthDate" type="date" autoComplete="bday" required min="1900-01-01" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} aria-invalid={!!fieldErrors.birthDate} className={input} />
              {error("birthDate")}
            </div>
          </div>
          <div>
            <label htmlFor="companions" className="mb-1.5 block text-sm font-bold">Asistirán conmigo</label>
            <input
              id="companions"
              name="companions"
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              required
              value={companions}
              onChange={(event) => {
                const value = Number(event.target.value);
                setCompanions(Number.isSafeInteger(value) && value >= 0 ? value : 0);
              }}
              aria-invalid={!!fieldErrors.companions}
              className={input}
            />
            {error("companions")}
            <p className="mt-1 text-xs text-stone-500">Indica solo a tus acompañantes; tú ya estás incluido.</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm">
            <div className="flex justify-between gap-3 text-stone-600">
              <span>{companions + 1} {companions === 0 ? "persona" : "personas"} × {formatCurrency(pricePerPerson)}</span>
              <span className="font-extrabold text-stone-900">{formatCurrency(amountDue)}</span>
            </div>
            <p className="mt-1 text-xs text-stone-500">El pago se registra directamente con un administrador.</p>
          </div>
          <div>
            <label className="flex items-start gap-3 text-sm text-stone-700">
              <input type="checkbox" name="consent" required className="mt-0.5 size-5 shrink-0 accent-brand-700" />
              <span>
                Autorizo el tratamiento de mis datos personales conforme a la{" "}
                <Link href="/privacidad" target="_blank" className="font-semibold text-brand-700 underline">política de privacidad</Link>.
              </span>
            </label>
            {error("consent")}
          </div>
          <button type="submit" disabled={pending || lookup === "loading"} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-6 py-3.5 text-base font-bold text-white shadow-sm hover:bg-brand-800 disabled:opacity-60">
            {pending && <Loader2 className="size-5 animate-spin" />}
            Confirmar inscripción
          </button>
        </>
      )}
    </form>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(amount);
}
