"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DatePicker({ date, setDate, placeholder = "Chọn ngày", className, disabled }: DatePickerProps) {
  const [month, setMonth] = React.useState<Date>(date || new Date());
  
  // Tạo danh sách các năm từ năm hiện tại trở về trước 100 năm và đến tương lai 20 năm
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - 10 + i);

  // Xử lý thay đổi năm
  const handleYearChange = (year: string) => {
    const newDate = new Date(month);
    newDate.setFullYear(parseInt(year));
    setMonth(newDate);
  };

  // Xử lý thay đổi tháng
  const handlePrevMonth = () => {
    const newDate = new Date(month);
    newDate.setMonth(newDate.getMonth() - 1);
    setMonth(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(month);
    newDate.setMonth(newDate.getMonth() + 1);
    setMonth(newDate);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          disabled={disabled}
          className={cn(
            "w-[280px] justify-start text-left font-normal",
            !date && "text-muted-foreground",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="flex items-center justify-between px-3 pt-3">
          <Button
            variant="ghost"
            className="size-7 p-0"
            onClick={handlePrevMonth}
          >
            <ChevronLeft className="size-4" />
          </Button>
          
          <div className="flex items-center space-x-2">
            <div className="text-sm font-medium">
              {format(month, "MMMM")}
            </div>
            <Select
              value={month.getFullYear().toString()}
              onValueChange={handleYearChange}
            >
              <SelectTrigger className="h-8 w-[80px]">
                <SelectValue placeholder={month.getFullYear().toString()} />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button
            variant="ghost"
            className="size-7 p-0"
            onClick={handleNextMonth}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          disabled={disabled}
          month={month}
          onMonthChange={setMonth}
          initialFocus
          captionLayout="buttons"
        />
      </PopoverContent>
    </Popover>
  )
} 