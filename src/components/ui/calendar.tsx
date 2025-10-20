"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = false,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      animate
      navLayout="around"
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month_caption: "flex justify-center py-3 items-center",
        caption_label: "text-sm font-medium",
        head_row: "grid grid-cols-7 gap-0",
        head_cell:
          "text-muted-foreground rounded-md w-9 h-9 flex items-center justify-center font-normal text-[0.8rem]",
        row: "grid grid-cols-7 gap-0 mt-2",
        weekday:
          "h-8 w-8 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: "h-8 w-8 p-0 font-normal hover:bg-accent hover:text-accent-foreground aria-selected:opacity-100 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background",
        day_range_end: "day-range-end",
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        months_dropdown:
          "outline-none appearance-none bg-transparent text-muted-foreground pr-8 relative",
          // years_dropdown: "font-normal hover:bg-accent hover:text-accent-foreground aria-selected:opacity-100 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background",

        ...classNames,
      }}
      components={{
        PreviousMonthButton: ({ ...props }) => <button {...props}> <ChevronLeft className="h-6 w-6 rounded-sm hover:bg-accent hover:text-accent-foreground" /> </button>,
        NextMonthButton: ({ ...props }) => <button {...props} > <ChevronRight className="h-6 w-6 rounded-sm hover:bg-accent hover:text-accent-foreground" /> </button>
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
