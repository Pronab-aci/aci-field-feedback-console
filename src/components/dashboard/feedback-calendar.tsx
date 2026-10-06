"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  MessageSquareText,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  parseISO,
  isValid,
} from "date-fns";
import { useDashboardStore } from "@/lib/store";
import type { Feedback } from "@/lib/mock-data";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function safeParse(dateStr: string): Date {
  const d = parseISO(dateStr);
  return isValid(d) ? d : new Date(NaN);
}

function intensityClass(count: number): string {
  if (count === 0) return "";
  if (count <= 2) return "bg-primary/15 text-primary";
  if (count <= 4) return "bg-primary/30 text-primary";
  if (count <= 6) return "bg-primary/55 text-primary-foreground";
  return "bg-primary text-primary-foreground";
}

export function FeedbackCalendar({ feedbacks }: { feedbacks: Feedback[] }) {
  // Default the calendar view to the latest month that contains feedback, so
  // the freshest activity is visible on first load. Falls back to current
  // real-world month if no data is present.
  const [month, setMonth] = useState<Date>(() => {
    if (feedbacks.length === 0) return new Date();
    const latest = feedbacks
      .map((f) => f.date)
      .sort()
      .at(-1);
    if (!latest) return new Date();
    const [y, m] = latest.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, 1);
  });
  const { selectedDate, setSelectedDate, setView } = useDashboardStore();

  const dayCounts = useMemo(() => {
    const map = new Map<string, number>();
    feedbacks.forEach((f) => {
      map.set(f.date, (map.get(f.date) ?? 0) + 1);
    });
    return map;
  }, [feedbacks]);

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const totalThisMonth = useMemo(() => {
    return monthDays
      .filter((d) => isSameMonth(d, month))
      .reduce((sum, d) => sum + (dayCounts.get(format(d, "yyyy-MM-dd")) ?? 0), 0);
  }, [monthDays, month, dayCounts]);

  const selectedFeedbacks = useMemo(() => {
    if (!selectedDate) return [];
    return feedbacks
      .filter((f) => f.date === selectedDate)
      .sort((a, b) => a.fieldForceName.localeCompare(b.fieldForceName));
  }, [feedbacks, selectedDate]);

  const selectedDateObj = selectedDate ? safeParse(selectedDate) : null;

  return (
    <Card className="flex h-full flex-col border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <CalendarDays className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Feedback Activity Calendar
            </h3>
            <p className="text-xs text-muted-foreground">
              Click a date to inspect that day&apos;s feedback
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-border"
            onClick={() => setMonth((m) => addMonths(m, -1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[120px] text-center">
            <p className="text-sm font-semibold text-foreground">
              {format(month, "MMMM yyyy")}
            </p>
            <p className="text-xs text-muted-foreground">
              {totalThisMonth} feedbacks this month
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-border"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {d}
          </div>
        ))}
        {monthDays.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const count = dayCounts.get(dateStr) ?? 0;
          const inMonth = isSameMonth(day, month);
          const isSelected = selectedDateObj
            ? isSameDay(day, selectedDateObj)
            : false;
          const intensity = intensityClass(count);
          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              disabled={!inMonth}
              className={[
                "relative flex aspect-square flex-col items-center justify-center rounded-lg border text-sm transition-all",
                inMonth ? "border-border hover:border-primary/40" : "border-transparent text-muted-foreground/40",
                isSelected ? "ring-2 ring-primary ring-offset-1 ring-offset-card" : "",
                intensity || (inMonth ? "bg-card hover:bg-secondary" : ""),
              ].join(" ")}
              aria-label={`${format(day, "MMM d")}: ${count} feedbacks`}
            >
              <span
                className={`font-medium ${
                  count >= 5 ? "text-primary-foreground" : ""
                }`}
              >
                {format(day, "d")}
              </span>
              {count > 0 && inMonth && (
                <span
                  className={`mt-0.5 rounded-full px-1.5 text-[10px] font-semibold leading-tight ${
                    count >= 5
                      ? "bg-primary-foreground/25 text-primary-foreground"
                      : "bg-card/80 text-primary"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span>Less</span>
        <span className="h-3 w-3 rounded bg-primary/15" />
        <span className="h-3 w-3 rounded bg-primary/30" />
        <span className="h-3 w-3 rounded bg-primary/55" />
        <span className="h-3 w-3 rounded bg-primary" />
        <span>More</span>
        <span className="ml-auto">Number = feedbacks submitted that day</span>
      </div>

      {/* Selected day detail */}
      {selectedDateObj && (
        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">
                {format(selectedDateObj, "EEEE, MMMM d, yyyy")}
              </p>
            </div>
            <Badge className="bg-primary text-primary-foreground">
              {selectedFeedbacks.length} feedback
              {selectedFeedbacks.length === 1 ? "" : "s"}
            </Badge>
          </div>
          {selectedFeedbacks.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              No feedback was submitted on this date.
            </p>
          ) : (
            <ul className="custom-scrollbar mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
              {selectedFeedbacks.map((f) => (
                <li
                  key={f.id}
                  className="rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {f.summary}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {f.fieldForceName} · {f.region} · {f.category}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`shrink-0 capitalize ${
                        f.sentiment === "positive"
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : f.sentiment === "negative"
                            ? "border-destructive/30 bg-destructive/10 text-destructive"
                            : "border-muted-foreground/30 text-muted-foreground"
                      }`}
                    >
                      {f.sentiment}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {selectedFeedbacks.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 h-8 text-primary hover:bg-primary/10 hover:text-primary"
              onClick={() => setView("feedbacks")}
            >
              Open all feedback records →
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
