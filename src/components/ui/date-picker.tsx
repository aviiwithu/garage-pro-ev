"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { SelectSingleEventHandler } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
    value: Date | undefined;
    onChange: (date: Date | undefined) => void;
    placeholder?: string;
    fromYear?: number;
    toYear?: number;
}

export function DatePicker({ value, onChange, placeholder = "Pick a date", fromYear, toYear }: DatePickerProps) {
  
  // The new onSelect handler from react-day-picker passes multiple arguments.
  // We only need the first one (the selected date) for our form.
  const handleSelect: SelectSingleEventHandler = (day) => {
    onChange(day);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleSelect}
          captionLayout="dropdown-years"
          fromYear={fromYear}
          toYear={toYear}
          defaultMonth={value || new Date()}
        />
      </PopoverContent>
    </Popover>
  )
}
