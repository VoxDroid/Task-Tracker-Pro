"use client"

import * as React from "react"
import type { CSSProperties } from "react"
import { useState, useEffect, useRef } from "react"
import { Calendar, Clock, ChevronLeft, ChevronRight, X } from "lucide-react"

interface DateTimePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export default function DateTimePicker({ value, onChange, placeholder = "Select date and time", className }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [hours, setHours] = useState("12")
  const [minutes, setMinutes] = useState("00")
  const [period, setPeriod] = useState<"AM" | "PM">("AM")
  const [view, setView] = useState<"calendar" | "month" | "year">("calendar")
  const [yearRangeStart, setYearRangeStart] = useState(new Date().getFullYear() - 6)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        setSelectedDate(date)
        setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1))
        let h = date.getHours()
        const m = date.getMinutes()
        const ampm = h >= 12 ? "PM" : "AM"
        h = h % 12
        h = h ? h : 12
        setHours(h.toString().padStart(2, "0"))
        setMinutes(m.toString().padStart(2, "0"))
        setPeriod(ampm)
      }
    }
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = new Date(year, month, 1).getDay()
    
    const days: (number | null)[] = []
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    setSelectedDate(newDate)
    updateValue(newDate, hours, minutes, period)
  }

  const updateValue = (date: Date | null, h: string, m: string, p: "AM" | "PM") => {
    if (!date) return
    
    let hour24 = parseInt(h)
    if (p === "PM" && hour24 !== 12) hour24 += 12
    if (p === "AM" && hour24 === 12) hour24 = 0
    
    const newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour24, parseInt(m))
    const isoString = newDate.toISOString().slice(0, 16)
    onChange(isoString)
  }

  const handleTimeChange = (type: "hours" | "minutes" | "period", val: string) => {
    if (type === "hours") {
      const num = parseInt(val) || 0
      const clamped = Math.min(12, Math.max(1, num)).toString().padStart(2, "0")
      setHours(clamped)
      if (selectedDate) updateValue(selectedDate, clamped, minutes, period)
    } else if (type === "minutes") {
      const num = parseInt(val) || 0
      const clamped = Math.min(59, Math.max(0, num)).toString().padStart(2, "0")
      setMinutes(clamped)
      if (selectedDate) updateValue(selectedDate, hours, clamped, period)
    } else {
      const newPeriod = val as "AM" | "PM"
      setPeriod(newPeriod)
      if (selectedDate) updateValue(selectedDate, hours, minutes, newPeriod)
    }
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const handleMonthSelect = (monthIndex: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), monthIndex, 1))
    setView("calendar")
  }

  const handleYearSelect = (year: number) => {
    setCurrentMonth(new Date(year, currentMonth.getMonth(), 1))
    setView("month")
  }

  const prevYearRange = () => {
    setYearRangeStart(yearRangeStart - 12)
  }

  const nextYearRange = () => {
    setYearRangeStart(yearRangeStart + 12)
  }

  const clearValue = () => {
    setSelectedDate(null)
    setHours("12")
    setMinutes("00")
    setPeriod("AM")
    onChange("")
    setIsOpen(false)
  }

  const formatDisplayValue = () => {
    if (!value) return ""
    const date = new Date(value)
    if (isNaN(date.getTime())) return ""
    
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    })
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    )
  }

  const isSelected = (day: number) => {
    if (!selectedDate) return false
    return (
      day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    )
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input Field */}
      <div
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) setView("calendar")
        }}
        className="w-full px-4 py-3 rounded-xl border-2 border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-background)] cursor-pointer flex items-center justify-between"
        style={{ color: "var(--color-text)" } as CSSProperties}
      >
        <div className="flex items-center space-x-3">
          <Calendar className="w-5 h-5 opacity-60" />
          <span className={value ? "" : "opacity-50"}>
            {formatDisplayValue() || placeholder}
          </span>
        </div>
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              clearValue()
            }}
            className="p-1 rounded-full hover:bg-[var(--color-border)] transition-colors"
          >
            <X className="w-4 h-4 opacity-60" />
          </button>
        )}
      </div>

      {/* Dropdown - pops up above the input */}
      {isOpen && (
        <div
          className="absolute z-50 bottom-full mb-2 p-4 rounded-2xl border-2 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200 overflow-hidden"
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-border)",
            minWidth: "320px"
          } as CSSProperties}
        >
          {/* View Container */}
          <div className="relative">
            {/* Calendar View */}
            <div className={`transition-all duration-300 ease-out transform ${view === "calendar" ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 absolute inset-0 pointer-events-none"}`}>
              {view === "calendar" && (
                <>
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                    onClick={prevMonth}
                    className="p-2 rounded-xl hover:bg-[var(--color-background)] transition-colors"
                    style={{ color: "var(--color-text)" } as CSSProperties}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => setView("month")}
                      className="font-semibold px-2 py-1 rounded-lg hover:bg-[var(--color-background)] transition-colors"
                      style={{ color: "var(--color-text)" } as CSSProperties}
                    >
                      {MONTHS[currentMonth.getMonth()]}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setYearRangeStart(currentMonth.getFullYear() - 6)
                        setView("year")
                      }}
                      className="font-semibold px-2 py-1 rounded-lg hover:bg-[var(--color-background)] transition-colors"
                      style={{ color: "var(--color-text)" } as CSSProperties}
                    >
                      {currentMonth.getFullYear()}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="p-2 rounded-xl hover:bg-[var(--color-background)] transition-colors"
                    style={{ color: "var(--color-text)" } as CSSProperties}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAYS.map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-medium py-2 opacity-60"
                      style={{ color: "var(--color-text)" } as CSSProperties}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {getDaysInMonth(currentMonth).map((day, index) => (
                    <button
                      key={index}
                      type="button"
                      disabled={day === null}
                      onClick={() => day && handleDateSelect(day)}
                      className={`
                        p-2 text-sm rounded-xl transition-all duration-200
                        ${day === null ? "invisible" : "hover:bg-[var(--color-primary)] hover:bg-opacity-20"}
                        ${isSelected(day!) ? "bg-[var(--color-primary)] text-white font-semibold" : ""}
                        ${isToday(day!) && !isSelected(day!) ? "border-2 border-[var(--color-primary)]" : ""}
                      `}
                      style={{ color: isSelected(day!) ? "white" : "var(--color-text)" } as CSSProperties}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Month Selection View */}
          <div className={`transition-all duration-300 ease-out transform ${view === "month" ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 absolute inset-0 pointer-events-none"}`}>
            {view === "month" && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth(), 1))}
                    className="p-2 rounded-xl hover:bg-[var(--color-background)] transition-colors"
                    style={{ color: "var(--color-text)" } as CSSProperties}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setYearRangeStart(currentMonth.getFullYear() - 6)
                      setView("year")
                    }}
                    className="font-semibold px-3 py-1 rounded-lg hover:bg-[var(--color-background)] transition-colors"
                    style={{ color: "var(--color-text)" } as CSSProperties}
                  >
                    {currentMonth.getFullYear()}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth(), 1))}
                    className="p-2 rounded-xl hover:bg-[var(--color-background)] transition-colors"
                    style={{ color: "var(--color-text)" } as CSSProperties}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  {MONTHS.map((month, index) => (
                    <button
                      key={month}
                      type="button"
                      onClick={() => handleMonthSelect(index)}
                      className={`
                        p-3 text-sm rounded-xl transition-all duration-200
                        hover:bg-[var(--color-primary)] hover:bg-opacity-20
                        ${currentMonth.getMonth() === index ? "bg-[var(--color-primary)] text-white font-semibold" : ""}
                      `}
                      style={{ color: currentMonth.getMonth() === index ? "white" : "var(--color-text)" } as CSSProperties}
                    >
                      {month.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Year Selection View */}
          <div className={`transition-all duration-300 ease-out transform ${view === "year" ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 absolute inset-0 pointer-events-none"}`}>
            {view === "year" && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={prevYearRange}
                    className="p-2 rounded-xl hover:bg-[var(--color-background)] transition-colors"
                    style={{ color: "var(--color-text)" } as CSSProperties}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="font-semibold" style={{ color: "var(--color-text)" } as CSSProperties}>
                    {yearRangeStart} - {yearRangeStart + 11}
                  </span>
                  <button
                    type="button"
                    onClick={nextYearRange}
                    className="p-2 rounded-xl hover:bg-[var(--color-background)] transition-colors"
                    style={{ color: "var(--color-text)" } as CSSProperties}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  {Array.from({ length: 12 }, (_, i) => yearRangeStart + i).map((year) => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => handleYearSelect(year)}
                      className={`
                        p-3 text-sm rounded-xl transition-all duration-200
                        hover:bg-[var(--color-primary)] hover:bg-opacity-20
                        ${currentMonth.getFullYear() === year ? "bg-[var(--color-primary)] text-white font-semibold" : ""}
                        ${new Date().getFullYear() === year && currentMonth.getFullYear() !== year ? "border-2 border-[var(--color-primary)]" : ""}
                      `}
                      style={{ color: currentMonth.getFullYear() === year ? "white" : "var(--color-text)" } as CSSProperties}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          </div>

          {/* Divider */}
          <div className="border-t-2 my-4" style={{ borderColor: "var(--color-border)" } as CSSProperties} />

          {/* Time Picker */}
          <div className="flex items-center justify-center space-x-3">
            <Clock className="w-5 h-5 opacity-60" style={{ color: "var(--color-text)" } as CSSProperties} />
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={hours}
                onChange={(e) => handleTimeChange("hours", e.target.value)}
                onBlur={(e) => {
                  const val = parseInt(e.target.value) || 12
                  setHours(Math.min(12, Math.max(1, val)).toString().padStart(2, "0"))
                }}
                className="w-12 px-2 py-2 text-center rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-background)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                style={{ color: "var(--color-text)" } as CSSProperties}
                maxLength={2}
              />
              <span className="text-xl font-bold" style={{ color: "var(--color-text)" } as CSSProperties}>:</span>
              <input
                type="text"
                value={minutes}
                onChange={(e) => handleTimeChange("minutes", e.target.value)}
                onBlur={(e) => {
                  const val = parseInt(e.target.value) || 0
                  setMinutes(Math.min(59, Math.max(0, val)).toString().padStart(2, "0"))
                }}
                className="w-12 px-2 py-2 text-center rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-background)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                style={{ color: "var(--color-text)" } as CSSProperties}
                maxLength={2}
              />
              <div className="flex rounded-xl border-2 border-[var(--color-border)] overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleTimeChange("period", "AM")}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    period === "AM"
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-[var(--color-background)] hover:bg-[var(--color-border)]"
                  }`}
                  style={{ color: period === "AM" ? "white" : "var(--color-text)" } as CSSProperties}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => handleTimeChange("period", "PM")}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    period === "PM"
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-[var(--color-background)] hover:bg-[var(--color-border)]"
                  }`}
                  style={{ color: period === "PM" ? "white" : "var(--color-text)" } as CSSProperties}
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex justify-between mt-4 pt-4 border-t-2" style={{ borderColor: "var(--color-border)" } as CSSProperties}>
            <button
              type="button"
              onClick={() => {
                const now = new Date()
                setSelectedDate(now)
                setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1))
                let h = now.getHours()
                const m = now.getMinutes()
                const ampm = h >= 12 ? "PM" : "AM"
                h = h % 12
                h = h ? h : 12
                setHours(h.toString().padStart(2, "0"))
                setMinutes(m.toString().padStart(2, "0"))
                setPeriod(ampm)
                updateValue(now, h.toString().padStart(2, "0"), m.toString().padStart(2, "0"), ampm)
              }}
              className="px-4 py-2 text-sm font-medium rounded-xl transition-colors hover:bg-[var(--color-background)]"
              style={{ color: "var(--color-primary)" } as CSSProperties}
            >
              Now
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm font-medium rounded-xl bg-[var(--color-primary)] text-white hover:opacity-90 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function formatDateTime(dateString: string | undefined | null): string {
  if (!dateString) return ""
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ""
  
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  })
}

export function formatDateTimeShort(dateString: string | undefined | null): string {
  if (!dateString) return ""
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ""
  
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  })
}
