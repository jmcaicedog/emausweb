"use client";

import { Dices, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Card, buttonCls } from "@/components/admin/ui";

type Attendee = {
  id: number;
  personId: number;
  fullName: string;
};

export function AttendeeDraw({ attendees }: { attendees: Attendee[] }) {
  const [selected, setSelected] = useState<Attendee[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [rollingName, setRollingName] = useState("");
  const [message, setMessage] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function drawAttendee() {
    if (isDrawing) return;
    const selectedIds = new Set(selected.map((attendee) => attendee.id));
    const eligible = attendees.filter((attendee) => !selectedIds.has(attendee.id));
    if (eligible.length === 0) {
      setMessage("Todos los asistentes ya fueron seleccionados. Puedes quitar a alguien para volver a incluirlo.");
      return;
    }

    setMessage("");
    setIsDrawing(true);
    setRollingName(eligible[Math.floor(Math.random() * eligible.length)].fullName);
    intervalRef.current = setInterval(() => {
      const attendee = eligible[Math.floor(Math.random() * eligible.length)];
      setRollingName(attendee.fullName);
    }, 90);

    timeoutRef.current = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      timeoutRef.current = null;
      const winner = eligible[Math.floor(Math.random() * eligible.length)];
      setRollingName(winner.fullName);
      setSelected((current) => [...current, winner]);
      setIsDrawing(false);
      setMessage(`${winner.fullName} fue agregado a la lista.`);
    }, 3000);
  }

  function removeAttendee(attendee: Attendee) {
    setSelected((current) => current.filter((item) => item.id !== attendee.id));
    setMessage(`${attendee.fullName} fue eliminado de la lista.`);
  }

  const remaining = attendees.length - selected.length;

  return (
    <Card title="Selección aleatoria" className="mb-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <div
            aria-live="polite"
            className={`grid min-h-24 place-items-center rounded-xl border border-dashed px-4 py-5 text-center transition-colors ${
              isDrawing ? "border-brand-300 bg-brand-50 text-brand-800" : "border-stone-200 bg-stone-50 text-stone-700"
            }`}
          >
            {isDrawing ? (
              <p className="animate-pulse text-xl font-extrabold motion-reduce:animate-none">{rollingName}</p>
            ) : (
              <p className="text-sm text-stone-500">
                {selected.length > 0 ? "Último seleccionado" : "Presiona el botón para elegir un asistente al azar."}
                {selected.length > 0 && <span className="mt-1 block text-xl font-extrabold text-stone-800">{rollingName}</span>}
              </p>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="button" onClick={drawAttendee} disabled={isDrawing || remaining === 0} className={buttonCls.primary}>
              <Dices className={`size-4 ${isDrawing ? "animate-spin motion-reduce:animate-none" : ""}`} />
              {isDrawing ? "Seleccionando..." : "Sortear asistente"}
            </button>
            <span className="text-xs text-stone-500">
              {remaining === 0 ? "Todos seleccionados" : `${remaining} ${remaining === 1 ? "asistente disponible" : "asistentes disponibles"}`}
            </span>
          </div>
          {message && <p role="status" className="mt-2 text-sm text-stone-600">{message}</p>}
        </div>

        <section aria-label="Asistentes seleccionados" className="w-full lg:max-w-sm">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold">
            <Sparkles className="size-4 text-brand-700" />
            Seleccionados <span className="text-stone-500">({selected.length})</span>
          </h3>
          {selected.length === 0 ? (
            <p className="rounded-lg bg-stone-50 px-3 py-4 text-sm text-stone-500">Los asistentes elegidos aparecerán aquí.</p>
          ) : (
            <ol className="max-h-56 divide-y divide-stone-100 overflow-y-auto rounded-lg border border-stone-200">
              {selected.map((attendee, index) => (
                <li key={attendee.id} className="flex items-center justify-between gap-3 px-3 py-2">
                  <span className="min-w-0 truncate text-sm">
                    <span className="mr-2 text-xs font-semibold text-stone-400">{index + 1}.</span>
                    <span className="font-semibold">{attendee.fullName}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttendee(attendee)}
                    aria-label={`Quitar a ${attendee.fullName} de los seleccionados`}
                    title="Quitar de la lista"
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-stone-500 hover:bg-red-50 hover:text-red-700"
                  >
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-2 text-xs text-stone-500">Esta lista es temporal y se borra al salir o actualizar la página.</p>
        </section>
      </div>
    </Card>
  );
}
