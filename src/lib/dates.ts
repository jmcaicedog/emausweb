export const TIME_ZONE = "America/Bogota";
const BOGOTA_OFFSET = "-05:00";

/** Convierte el valor de un input datetime-local (hora de Bogotá) a Date. */
export function parseLocalDateTime(value: string): Date | null {
  if (!value) return null;
  const v = value.length === 16 ? `${value}:00` : value;
  const d = new Date(`${v}${BOGOTA_OFFSET}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Date -> "YYYY-MM-DDTHH:mm" en hora de Bogotá (para inputs datetime-local). */
export function toLocalInputValue(date: Date | null | undefined) {
  if (!date) return "";
  const parts = bogotaParts(date);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function bogotaParts(date: Date) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const p = Object.fromEntries(fmt.formatToParts(date).map((x) => [x.type, x.value]));
  return { year: p.year, month: p.month, day: p.day, hour: p.hour, minute: p.minute };
}

/** Clave de día "YYYY-MM-DD" en hora de Bogotá. */
export function dayKey(date: Date) {
  const p = bogotaParts(date);
  return `${p.year}-${p.month}-${p.day}`;
}

/** ICU difiere entre Node y navegadores en espacios especiales (p. ej. "a. m."); se normalizan para evitar errores de hidratación. */
const WS = /[\u00A0\u202F]/g;

export function formatEventDate(date: Date) {
  const s = new Intl.DateTimeFormat("es-CO", {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date).replace(WS, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "8:00 a. m. – 5:00 p. m." o, si termina otro día, "8:00 a. m. – 26 oct, 5:00 p. m.". */
export function formatTimeRange(start: Date, end?: Date | null) {
  if (!end) return formatTime(start);
  if (dayKey(start) === dayKey(end)) return `${formatTime(start)} – ${formatTime(end)}`;
  const endLabel = new Intl.DateTimeFormat("es-CO", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(end).replace(WS, " ");
  return `${formatTime(start)} – ${endLabel}`;
}

export function formatTime(date: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(date).replace(WS, " ");
}

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date).replace(WS, " ");
}

export function formatShortDate(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CO", { timeZone: "UTC", dateStyle: "medium" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

/** Inicio del mes (hora Bogotá) desplazado `offset` meses. */
export function startOfBogotaMonth(now: Date, offset = 0) {
  const p = bogotaParts(now);
  const y = Number(p.year);
  const m = Number(p.month) - 1 + offset;
  const year = y + Math.floor(m / 12);
  const month = ((m % 12) + 12) % 12;
  return new Date(`${year}-${String(month + 1).padStart(2, "0")}-01T00:00:00${BOGOTA_OFFSET}`);
}
