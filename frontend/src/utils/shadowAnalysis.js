const JAKARTA_TIME_ZONE = "Asia/Jakarta";
const MINUTES_PER_DAY = 24 * 60;

const jakartaDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: JAKARTA_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const clampMinutes = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(MINUTES_PER_DAY - 1, Math.max(0, Math.round(numeric)));
};

export const getJakartaDateTimeParts = (value = new Date()) => {
  const parts = Object.fromEntries(
    jakartaDateFormatter
      .formatToParts(value)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
};

export const createJakartaShadowDateTime = (date, minutes) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) return null;
  const safeMinutes = clampMinutes(minutes);
  const hours = String(Math.floor(safeMinutes / 60)).padStart(2, "0");
  const minutePart = String(safeMinutes % 60).padStart(2, "0");
  const result = new Date(`${date}T${hours}:${minutePart}:00+07:00`);
  return Number.isNaN(result.getTime()) ? null : result;
};

export const formatShadowMinutes = (minutes) => {
  const safeMinutes = clampMinutes(minutes);
  return `${String(Math.floor(safeMinutes / 60)).padStart(2, "0")}:${String(
    safeMinutes % 60,
  ).padStart(2, "0")}`;
};

export const getShadowDayPeriod = (minutes) => {
  const safeMinutes = clampMinutes(minutes);
  if (safeMinutes < 6 * 60) return "Dini hari";
  if (safeMinutes < 11 * 60) return "Pagi";
  if (safeMinutes < 15 * 60) return "Siang";
  if (safeMinutes < 18 * 60) return "Sore";
  return "Malam";
};

