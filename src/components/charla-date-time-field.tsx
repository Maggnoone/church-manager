import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { calendarDateToFormDate } from "@/lib/session-date-time";

type CharlaDateTimeFieldProps = {
  date: string;
  hour: string;
  minute: string;
  period: "AM" | "PM";
  onDateChange: (date: string) => void;
  onHourChange: (hour: string) => void;
  onMinuteChange: (minute: string) => void;
  onPeriodChange: (period: "AM" | "PM") => void;
};

export function CharlaDateTimeField({
  date,
  hour,
  minute,
  period,
  onDateChange,
  onHourChange,
  onMinuteChange,
  onPeriodChange,
}: CharlaDateTimeFieldProps) {
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const selectedDate = date ? new Date(`${date}T00:00:00`) : undefined;

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,2fr)_repeat(3,minmax(2.75rem,1fr))] items-center gap-2">
      <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            aria-label="Fecha"
            className="min-w-0 w-full justify-start overflow-hidden text-left font-normal"
          >
            <CalendarDays className="mr-2 h-4 w-4 shrink-0" />
            <span className="min-w-0 truncate">
              {selectedDate ? selectedDate.toLocaleDateString() : "Elegir fecha"}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="z-[60] w-auto p-0" align="start">
          <Calendar
            mode="single"
            month={selectedDate}
            selected={selectedDate}
            onSelect={(selected) => {
              if (selected) onDateChange(calendarDateToFormDate(selected));
              setDatePickerOpen(false);
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <div data-testid="charla-time-controls" className="contents min-w-0">
        <select
          aria-label="Hora"
          className="h-10 min-w-0 w-full rounded-md border border-input bg-background px-1 text-sm"
          value={hour}
          onChange={(event) => onHourChange(event.target.value)}
        >
          {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
        <select
          aria-label="Minuto"
          className="h-10 min-w-0 w-full rounded-md border border-input bg-background px-1 text-sm"
          value={minute}
          onChange={(event) => onMinuteChange(event.target.value)}
        >
          {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
        <select
          aria-label="AM o PM"
          className="h-10 min-w-0 w-full rounded-md border border-input bg-background px-1 text-sm"
          value={period}
          onChange={(event) => onPeriodChange(event.target.value as "AM" | "PM")}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
}
