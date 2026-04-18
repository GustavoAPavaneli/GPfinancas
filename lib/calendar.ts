const PT_MONTHS_SHORT = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
export const PT_MONTHS_FULL  = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const PT_DAYS_SHORT   = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

export interface MonthWeek {
  num: number;
  start: Date;
  end: Date;
  days: number;
  label: string;       // "Sem 1"
  rangeLabel: string;  // "01–06 jan"
}

export interface ISOWeek {
  monday: Date;
  sunday: Date;
  rangeLabel: string;  // "10 ago – 16 ago"
  days: Date[];        // 7 dates Mon→Sun
}

/** Monday of the ISO week containing `d` */
export function getMondayOf(d: Date): Date {
  const date = new Date(d);
  date.setHours(0,0,0,0);
  const dow = date.getDay(); // 0=Sun
  date.setDate(date.getDate() - (dow === 0 ? 6 : dow - 1));
  return date;
}

export function dateToKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

export function formatDateShort(date: Date): string {
  return `${date.getDate()} ${PT_MONTHS_SHORT[date.getMonth()]}`;
}

/** Short label for bar X-axis in diário view: "Seg 10" */
export function getDayLabel(date: Date): string {
  return `${PT_DAYS_SHORT[date.getDay()]} ${date.getDate()}`;
}

/**
 * Weeks within a month — each week runs Mon→Sun, clipped to month boundaries.
 * Week 1 always starts on the 1st of the month (even if mid-week).
 */
export function getWeeksOfMonth(year: number, month: number): MonthWeek[] {
  const PT_M  = PT_MONTHS_SHORT[month - 1];
  const first = new Date(year, month - 1, 1);
  const last  = new Date(year, month,     0);

  const weeks: MonthWeek[] = [];
  let cursor  = new Date(first);
  let weekNum = 1;

  while (cursor <= last) {
    const start = new Date(cursor);

    // End = the coming Sunday or end-of-month, whichever is earlier
    const dow = cursor.getDay(); // 0=Sun
    const daysToSunday = dow === 0 ? 0 : 7 - dow;
    const end = new Date(cursor);
    end.setDate(cursor.getDate() + daysToSunday);
    if (end > last) end.setTime(last.getTime());

    const days       = end.getDate() - start.getDate() + 1;
    const rangeLabel = start.getDate() === end.getDate()
      ? `${start.getDate()} ${PT_M}`
      : `${start.getDate()}–${end.getDate()} ${PT_M}`;

    weeks.push({ num: weekNum, start: new Date(start), end: new Date(end), days, label: `Sem ${weekNum}`, rangeLabel });
    weekNum++;
    cursor = new Date(end);
    cursor.setDate(cursor.getDate() + 1);
  }

  return weeks;
}

/** Full ISO week (Mon→Sun) containing `anyDate` */
export function getISOWeek(anyDate: Date): ISOWeek {
  const monday = getMondayOf(anyDate);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const days: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  return {
    monday: new Date(monday),
    sunday: new Date(sunday),
    rangeLabel: `${formatDateShort(monday)} – ${formatDateShort(sunday)}`,
    days,
  };
}

/** Move to prev (-1) or next (+1) ISO week */
export function navigateISOWeek(current: Date, dir: -1 | 1): Date {
  const d = new Date(current);
  d.setDate(d.getDate() + dir * 7);
  return d;
}
