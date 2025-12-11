"use client"

import * as React from "react"

import { Calendar } from "@/components/ui/calendar"
import { ru } from "date-fns/locale"

export default function Calendar01() {
  const [date, setDate] = React.useState(new Date())

  return (
    <Calendar
      mode="single"
      defaultMonth={date}
      selected={date}
      onSelect={setDate}
      locale={ru}
      fixedWeeks
      showOutsideDays={false} 
      className="rounded-lg border shadow-sm calendar-remix" />
  );
}
