export interface WeeklyAvailability {
  day_of_week: number;
  start_time: string;
  end_time: string;
}
export interface BusyInterval {
  scheduled_at: string;
  duration_minutes: number;
}
export interface CalendarSlot {
  startsAt: string;
  label: string;
  date: string;
}
const formatters = new Map<string, Intl.DateTimeFormat>();
function parts(date: Date, zone: string) {
  let formatter = formatters.get(zone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    formatters.set(zone, formatter);
  }
  return Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
}
function dateKey(date: Date, zone: string) {
  const p = parts(date, zone);
  return `${p.year}-${p.month}-${p.day}`;
}
export function wallTimeToUtc(
  date: string,
  minutes: number,
  zone: string,
): Date | null {
  const [year, month, day] = date.split("-").map(Number);
  const wall = Date.UTC(
    year,
    month - 1,
    day,
    Math.floor(minutes / 60),
    minutes % 60,
  );
  let guess = wall;
  for (let n = 0; n < 3; n++) {
    const p = parts(new Date(guess), zone);
    const observed = Date.UTC(
      Number(p.year),
      Number(p.month) - 1,
      Number(p.day),
      Number(p.hour),
      Number(p.minute),
      Number(p.second),
    );
    guess += wall - observed;
  }
  const result = new Date(guess);
  const p = parts(result, zone);
  return dateKey(result, zone) === date &&
    Number(p.hour) * 60 + Number(p.minute) === minutes
    ? result
    : null;
}
export function calendarSlots(input: {
  from: Date;
  to: Date;
  now: number;
  duration: number;
  zone: string;
  availability: WeeklyAvailability[];
  blocked: string[];
  busy: BusyInterval[];
}): CalendarSlot[] {
  if (
    !Number.isInteger(input.duration) ||
    input.duration < 1 ||
    input.duration > 480
  )
    return [];
  const from = new Date(`${dateKey(input.from, input.zone)}T00:00:00Z`);
  const end = dateKey(input.to, input.zone);
  const blocked = new Set(input.blocked);
  const slots = new Map<string, CalendarSlot>();
  for (
    let cursor = from;
    cursor.toISOString().slice(0, 10) <= end;
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    const date = cursor.toISOString().slice(0, 10);
    if (blocked.has(date)) continue;
    for (const availability of input.availability.filter(
      (item) => item.day_of_week === cursor.getUTCDay(),
    )) {
      const [startH, startM] = availability.start_time.split(":").map(Number);
      const [endH, endM] = availability.end_time.split(":").map(Number);
      for (
        let minutes = startH * 60 + startM;
        minutes + input.duration <= endH * 60 + endM;
        minutes += input.duration
      ) {
        const start = wallTimeToUtc(date, minutes, input.zone);
        if (
          !start ||
          start.getTime() <= input.now ||
          start < input.from ||
          start > input.to
        )
          continue;
        const finishes = start.getTime() + input.duration * 60_000;
        if (
          input.busy.some(
            (busy) =>
              start.getTime() <
                new Date(busy.scheduled_at).getTime() +
                  busy.duration_minutes * 60_000 &&
              finishes > new Date(busy.scheduled_at).getTime(),
          )
        )
          continue;
        const iso = start.toISOString();
        slots.set(iso, {
          startsAt: iso,
          date,
          label: `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`,
        });
      }
    }
  }
  return [...slots.values()].sort((a, b) =>
    a.startsAt.localeCompare(b.startsAt),
  );
}
