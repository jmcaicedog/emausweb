import { Cake, ChevronLeft, ChevronRight, Gift } from "lucide-react";
import Link from "next/link";
import { Card, PageHeader } from "@/components/admin/ui";
import { adminBirthdays } from "@/lib/data/admin";
import { bogotaParts } from "@/lib/dates";

export const instant = false;

export const metadata = { title: "Cumpleaños" };

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function isLeapYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function birthdayDayInYear(birthDate: string, year: number) {
  const month = Number(birthDate.slice(5, 7));
  const day = Number(birthDate.slice(8, 10));
  return month === 2 && day === 29 && !isLeapYear(year) ? 28 : day;
}

function dayDifference(from: string, to: string) {
  const fromDate = new Date(`${from}T00:00:00Z`);
  const toDate = new Date(`${to}T00:00:00Z`);
  return Math.round((toDate.getTime() - fromDate.getTime()) / 86_400_000);
}

function formatMonth(year: number, month: number) {
  const label = new Intl.DateTimeFormat("es-CO", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatBirthdayDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function monthHref(year: number, month: number) {
  return `/admin/cumpleanos?month=${year}-${String(month).padStart(2, "0")}`;
}

function shiftMonth(year: number, month: number, offset: number) {
  const value = year * 12 + month - 1 + offset;
  return { year: Math.floor(value / 12), month: (value % 12) + 1 };
}

export default async function BirthdaysPage({ searchParams }: PageProps<"/admin/cumpleanos">) {
  const params = await searchParams;
  const now = new Date();
  const current = bogotaParts(now);
  const currentYear = Number(current.year);
  const currentMonth = Number(current.month);
  const currentDay = Number(current.day);
  const currentDate = `${current.year}-${current.month}-${current.day}`;
  const requestedMonth = typeof params.month === "string" ? /^(\d{4})-(\d{2})$/.exec(params.month) : null;
  const requestedYear = requestedMonth ? Number(requestedMonth[1]) : currentYear;
  const requestedMonthNumber = requestedMonth ? Number(requestedMonth[2]) : currentMonth;
  const validMonth = requestedYear >= 1900 && requestedYear <= 9999 && requestedMonthNumber >= 1 && requestedMonthNumber <= 12;
  const year = validMonth ? requestedYear : currentYear;
  const month = validMonth ? requestedMonthNumber : currentMonth;

  const people = await adminBirthdays();
  const monthBirthdays = people
    .filter((person) => Number(person.birthDate.slice(5, 7)) === month)
    .map((person) => ({
      ...person,
      day: birthdayDayInYear(person.birthDate, year),
    }));

  const upcoming = people
    .map((person) => {
      let birthdayYear = currentYear;
      let day = birthdayDayInYear(person.birthDate, birthdayYear);
      let date = `${birthdayYear}-${person.birthDate.slice(5, 7)}-${String(day).padStart(2, "0")}`;
      if (date < currentDate) {
        birthdayYear += 1;
        day = birthdayDayInYear(person.birthDate, birthdayYear);
        date = `${birthdayYear}-${person.birthDate.slice(5, 7)}-${String(day).padStart(2, "0")}`;
      }
      return { ...person, date, daysUntil: dayDifference(currentDate, date) };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);
  const nextBirthday = upcoming[0]?.daysUntil;
  const nextBirthdays = upcoming.filter((person) => person.daysUntil === nextBirthday);

  const firstDayOffset = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const previousMonth = shiftMonth(year, month, -1);
  const followingMonth = shiftMonth(year, month, 1);
  const birthdaysByDay = new Map<number, typeof monthBirthdays>();
  for (const birthday of monthBirthdays) {
    const sameDay = birthdaysByDay.get(birthday.day) ?? [];
    sameDay.push(birthday);
    birthdaysByDay.set(birthday.day, sameDay);
  }

  return (
    <>
      <PageHeader title="Cumpleaños" description="Celebra y acompaña a las personas de nuestra comunidad." />
      <Card className="mb-6 overflow-hidden border-brand-100 bg-brand-50/50">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-brand-700">
            <Gift className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-brand-800">Próximo cumpleaños</p>
            {nextBirthdays.length === 0 ? (
              <p className="mt-1 text-sm text-stone-600">Aún no hay personas registradas con fecha de nacimiento.</p>
            ) : (
              <>
                <p className="mt-1 text-xl font-extrabold">
                  {nextBirthdays.map((person, index) => (
                    <span key={person.id}>
                      {index > 0 && ", "}
                      <Link href={`/admin/personas/${person.id}`} className="hover:text-brand-700 hover:underline">
                        {person.fullName}
                      </Link>
                    </span>
                  ))}
                </p>
                <p className="mt-1 text-sm text-stone-600">
                  {formatBirthdayDate(nextBirthdays[0].date)}
                  {" · "}
                  {nextBirthday === 0 ? "¡Hoy!" : nextBirthday === 1 ? "Mañana" : `En ${nextBirthday} días`}
                </p>
              </>
            )}
          </div>
          <Cake className="hidden size-10 shrink-0 text-brand-300 sm:block" />
        </div>
      </Card>

      <Card
        title={`Calendario de ${formatMonth(year, month)}`}
        actions={
          <nav aria-label="Cambiar mes" className="flex items-center gap-1">
            {!(year === currentYear && month === currentMonth) && (
              <Link
                href={monthHref(currentYear, currentMonth)}
                className="rounded-lg px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50"
              >
                Este mes
              </Link>
            )}
            <Link
              href={monthHref(previousMonth.year, previousMonth.month)}
              aria-label="Mes anterior"
              className="grid size-8 place-items-center rounded-lg text-stone-600 hover:bg-stone-100"
            >
              <ChevronLeft className="size-4" />
            </Link>
            <Link
              href={monthHref(followingMonth.year, followingMonth.month)}
              aria-label="Mes siguiente"
              className="grid size-8 place-items-center rounded-lg text-stone-600 hover:bg-stone-100"
            >
              <ChevronRight className="size-4" />
            </Link>
          </nav>
        }
      >
        {monthBirthdays.length === 0 ? (
          <p className="mb-4 text-sm text-stone-500">No hay cumpleaños registrados para este mes.</p>
        ) : (
          <p className="mb-4 text-sm text-stone-600">{monthBirthdays.length} cumpleaños este mes.</p>
        )}

        <div className="hidden grid-cols-7 overflow-hidden rounded-lg border border-stone-200 sm:grid">
          {WEEKDAYS.map((day) => (
            <div key={day} className="border-b border-stone-200 bg-stone-50 px-2 py-2 text-center text-xs font-bold text-stone-500">
              {day}
            </div>
          ))}
          {Array.from({ length: firstDayOffset }, (_, index) => (
            <div key={`empty-${index}`} aria-hidden="true" className="min-h-24 border-b border-r border-stone-100 bg-stone-50/50" />
          ))}
          {Array.from({ length: daysInMonth }, (_, index) => {
            const day = index + 1;
            const birthdays = birthdaysByDay.get(day) ?? [];
            const isToday = year === currentYear && month === currentMonth && day === currentDay;
            return (
              <div
                key={day}
                aria-label={`${day} de ${formatMonth(year, month)}${birthdays.length ? `, ${birthdays.length} cumpleaños` : ""}`}
                aria-current={isToday ? "date" : undefined}
                className="min-h-24 border-b border-r border-stone-100 p-2 last:border-r-0"
              >
                <span className={`grid size-6 place-items-center rounded-full text-xs font-semibold ${isToday ? "bg-brand-700 text-white" : "text-stone-600"}`}>
                  {day}
                </span>
                {birthdays.length > 0 && (
                  <ul className="mt-1 space-y-1">
                    {birthdays.slice(0, 2).map((person) => (
                      <li key={person.id} className="truncate text-xs">
                        <Link href={`/admin/personas/${person.id}`} title={person.fullName} className="font-semibold text-brand-800 hover:underline">
                          {person.fullName}
                        </Link>
                      </li>
                    ))}
                    {birthdays.length > 2 && <li className="text-xs text-stone-500">+{birthdays.length - 2} más</li>}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-2 sm:hidden">
          {Array.from({ length: daysInMonth }, (_, index) => {
            const day = index + 1;
            const birthdays = birthdaysByDay.get(day) ?? [];
            if (birthdays.length === 0) return null;
            return (
              <div key={day} className="rounded-lg border border-stone-200 p-3">
                <p className="text-xs font-bold text-stone-500">{day} de {formatMonth(year, month).split(" ")[0]}</p>
                <ul className="mt-1 space-y-1">
                  {birthdays.map((person) => (
                    <li key={person.id}>
                      <Link href={`/admin/personas/${person.id}`} className="text-sm font-semibold text-brand-800 hover:underline">
                        {person.fullName}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}
