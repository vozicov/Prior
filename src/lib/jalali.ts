import jalaali from "jalaali-js";

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export const PERSIAN_MONTH_NAMES = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

export const PERSIAN_WEEKDAY_NAMES = [
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
  "شنبه",
];

const PERSIAN_WEEKDAY_SHORT = ["ی", "د", "س", "چ", "پ", "ج", "ش"];

/** Converts ASCII digits in a string to Persian digits. */
export function toPersianDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

/** Converts Persian/Arabic-Indic digits in a string back to ASCII digits. */
export function toAsciiDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

export interface JalaliYMD {
  jy: number;
  jm: number; // 1-12
  jd: number;
}

/** Today's date in Jalali calendar, as YMD. */
export function todayJalali(): JalaliYMD {
  const now = new Date();
  return jalaali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/** Today's date formatted as "YYYY-MM-DD" (Jalali, ASCII digits — used as the DB key). */
export function todayJalaliString(): string {
  const { jy, jm, jd } = todayJalali();
  return formatJalaliYMD({ jy, jm, jd });
}

export function formatJalaliYMD({ jy, jm, jd }: JalaliYMD): string {
  const mm = String(jm).padStart(2, "0");
  const dd = String(jd).padStart(2, "0");
  return `${jy}-${mm}-${dd}`;
}

export function parseJalaliString(s: string): JalaliYMD {
  const [jy, jm, jd] = s.split("-").map(Number);
  return { jy, jm, jd };
}

/** Convert a Jalali YMD to a JS Date (for weekday math, sorting, etc). */
export function jalaliToDate({ jy, jm, jd }: JalaliYMD): Date {
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm, jd);
  return new Date(gy, gm - 1, gd);
}

export function dateToJalali(d: Date): JalaliYMD {
  return jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

export function addDaysJalali(ymd: JalaliYMD, days: number): JalaliYMD {
  const d = jalaliToDate(ymd);
  d.setDate(d.getDate() + days);
  return dateToJalali(d);
}

export function weekdayIndex(ymd: JalaliYMD): number {
  // JS getDay(): 0=Sunday..6=Saturday, which lines up with PERSIAN_WEEKDAY_NAMES order.
  return jalaliToDate(ymd).getDay();
}

export function weekdayName(ymd: JalaliYMD, short = false): string {
  const idx = weekdayIndex(ymd);
  return short ? PERSIAN_WEEKDAY_SHORT[idx] : PERSIAN_WEEKDAY_NAMES[idx];
}

/** A friendly label like "شنبه، ۲۴ مرداد ۱۴۰۳". */
export function formatJalaliFriendly(s: string): string {
  const ymd = parseJalaliString(s);
  const weekday = weekdayName(ymd);
  const month = PERSIAN_MONTH_NAMES[ymd.jm - 1];
  return `${weekday}، ${toPersianDigits(ymd.jd)} ${month} ${toPersianDigits(ymd.jy)}`;
}

/** Short label like "۲۴ مرداد". */
export function formatJalaliShort(s: string): string {
  const ymd = parseJalaliString(s);
  const month = PERSIAN_MONTH_NAMES[ymd.jm - 1];
  return `${toPersianDigits(ymd.jd)} ${month}`;
}

/** Returns the 7 Jalali dates (Saturday-first week) surrounding `centerDate`. */
export function weekAround(centerDate: JalaliYMD): JalaliYMD[] {
  const centerJS = jalaliToDate(centerDate);
  const dow = centerJS.getDay(); // 0=Sun..6=Sat
  // Persian week starts Saturday (6) -> offset so Saturday is first
  const offsetFromSaturday = (dow + 1) % 7;
  const start = addDaysJalali(centerDate, -offsetFromSaturday);
  return Array.from({ length: 7 }, (_, i) => addDaysJalali(start, i));
}

/** Formats "HH:MM" in Persian digits, e.g. "14:05" -> "۱۴:۰۵". */
export function formatTimePersian(time: string | null): string {
  if (!time) return "";
  return toPersianDigits(time);
}

/** Validates a "HH:MM" 24h time string. */
export function isValidTime(time: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
}

/** Current Tehran local time as "HH:MM". Falls back to system time if Intl data is unavailable. */
export function nowTehranTime(): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Tehran",
    }).format(new Date());
  } catch {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
}
