export type LocalDateTimeFields = {
  date: string;
  hour: string;
  minute: string;
  period: "AM" | "PM";
};

const pad = (value: number) => String(value).padStart(2, "0");

export function calendarDateToFormDate(value: Date): string {
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

export function localDateTimeFields(value: Date): LocalDateTimeFields {
  const hours = value.getHours();
  return {
    date: `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`,
    hour: String(hours % 12 || 12),
    minute: pad(value.getMinutes()),
    period: hours < 12 ? "AM" : "PM",
  };
}

export function timestampToLocalDateTimeFields(timestamp: string): LocalDateTimeFields {
  return localDateTimeFields(new Date(timestamp));
}

export function localDateTimeToISOString(fields: LocalDateTimeFields): string {
  const [year, month, day] = fields.date.split("-").map(Number);
  const hour12 = Number(fields.hour);
  const hour24 = (hour12 % 12) + (fields.period === "PM" ? 12 : 0);
  const date = new Date(year, month - 1, day, hour24, Number(fields.minute));
  return date.toISOString();
}
