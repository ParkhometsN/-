"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { ru } from "date-fns/locale"

export function SelectTime({ 
  onDateChange, 
  value, 
  placeholder = "Выберите дату" 
}) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState(value || null)

  // Синхронизация с внешним значением
  React.useEffect(() => {
    setDate(value || null)
  }, [value])

  // Обработка выбора даты
  const handleSelect = (selectedDate) => {
    setDate(selectedDate)
    setOpen(false)
    
    if (onDateChange) {
      onDateChange(selectedDate) // Передаем Date объект или null
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="justify-between font-normal custombuttonselecttime w-full"
          >
            <span>
              {date ? format(date, 'dd.MM.yyyy', { locale: ru }) : placeholder}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M5.75 7.5C5.55109 7.5 5.36032 7.57902 5.21967 7.71967C5.07902 7.86032 5 8.05109 5 8.25C5 8.44891 5.07902 8.63968 5.21967 8.78033C5.36032 8.92098 5.55109 9 5.75 9C5.94891 9 6.13968 8.92098 6.28033 8.78033C6.42098 8.63968 6.5 8.44891 6.5 8.25C6.5 8.05109 6.42098 7.86032 6.28033 7.71967C6.13968 7.57902 5.94891 7.5 5.75 7.5ZM7.25 8.25C7.25 8.05109 7.32902 7.86032 7.46967 7.71967C7.61032 7.57902 7.80109 7.5 8 7.5H10.25C10.4489 7.5 10.6397 7.57902 10.7803 7.71967C10.921 7.86032 11 8.05109 11 8.25C11 8.44891 10.921 8.63968 10.7803 8.78033C10.6397 8.92098 10.4489 9 10.25 9H8C7.80109 9 7.61032 8.92098 7.46967 8.78033C7.32902 8.63968 7.25 8.44891 7.25 8.25ZM5.75 9.5C5.55109 9.5 5.36032 9.57902 5.21967 9.71967C5.07902 9.86032 5 10.0511 5 10.25C5 10.4489 5.07902 10.6397 5.21967 10.7803C5.36032 10.921 5.55109 11 5.75 11H8C8.19891 11 8.38968 10.921 8.53033 10.7803C8.67098 10.6397 8.75 10.4489 8.75 10.25C8.75 10.0511 8.67098 9.86032 8.53033 9.71967C8.38968 9.57902 8.19891 9.5 8 9.5H5.75Z" fill="currentColor"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M4.75 1C4.55109 1 4.36032 1.07902 4.21967 1.21967C4.07902 1.36032 4 1.55109 4 1.75V3C3.46957 3 2.96086 3.21071 2.58579 3.58579C2.21071 3.96086 2 4.46957 2 5V12C2 12.5304 2.21071 13.0391 2.58579 13.4142C2.96086 13.7893 3.46957 14 4 14H12C12.5304 14 13.0391 13.7893 13.4142 13.4142C13.7893 13.0391 14 12.5304 14 12V5C14 4.46957 13.7893 3.96086 13.4142 3.58579C13.0391 3.21071 12.5304 3 12 3V1.75C12 1.55109 11.921 1.36032 11.7803 1.21967C11.6397 1.07902 11.4489 1 11.25 1C11.0511 1 10.8603 1.07902 10.7197 1.21967C10.579 1.36032 10.5 1.55109 10.5 1.75V3H5.5V1.75C5.5 1.55109 5.42098 1.36032 5.28033 1.21967C5.13968 1.07902 4.94891 1 4.75 1ZM3.5 7C3.5 6.73478 3.60536 6.48043 3.79289 6.29289C3.98043 6.10536 4.23478 6 4.5 6H11.5C11.7652 6 12.0196 6.10536 12.2071 6.29289C12.3946 6.48043 12.5 6.73478 12.5 7V11.5C12.5 11.7652 12.3946 12.0196 12.2071 12.2071C12.0196 12.3946 11.7652 12.5 11.5 12.5H4.5C4.23478 12.5 3.98043 12.3946 3.79289 12.2071C3.60536 12.0196 3.5 11.7652 3.5 11.5V7Z" fill="#0051FF"/>
            </svg>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            locale={ru}
            selected={date}
            onSelect={handleSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}