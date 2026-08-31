"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Mail,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Paperclip,
  ArrowRight,
  User,
  Send,
  Loader2,
  Sparkles,
} from "lucide-react";

interface ActivityEmail {
  id: string;
  status: string;
  error: string | null;
  sentAt: string | null;
  dateKey: string | null; // "YYYY-MM-DD"
  subject: string;
  body: string;
  attachmentName: string | null;
  recipient: {
    id: string;
    email: string;
    name: string | null;
    company: string | null;
  };
  campaignId: string;
}

export function CalendarActivityDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emails, setEmails] = useState<ActivityEmail[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<ActivityEmail | null>(null);

  // Current viewing month/year in the calendar
  const [currentDate, setCurrentDate] = useState(() => new Date());
  
  // Selected date key "YYYY-MM-DD" (defaults to today)
  const [selectedDateKey, setSelectedDateKey] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/activity");
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails || []);
      }
    } catch (err) {
      console.error("Failed to load activity:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchActivity();
    }
  }, [open, fetchActivity]);

  // Group emails by dateKey ("YYYY-MM-DD")
  const emailsByDate = useMemo(() => {
    const map = new Map<string, ActivityEmail[]>();
    for (const email of emails) {
      if (email.dateKey) {
        const list = map.get(email.dateKey) || [];
        list.push(email);
        map.set(email.dateKey, list);
      }
    }
    return map;
  }, [emails]);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Generate days in month grid
  const calendarGrid = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const cells: {
      dayNumber: number;
      dateKey: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      count: number;
    }[] = [];

    const todayKey = new Date().toISOString().split("T")[0];

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateKey = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cells.push({
        dayNumber: day,
        dateKey,
        isCurrentMonth: false,
        isToday: dateKey === todayKey,
        count: emailsByDate.get(dateKey)?.length || 0,
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cells.push({
        dayNumber: day,
        dateKey,
        isCurrentMonth: true,
        isToday: dateKey === todayKey,
        count: emailsByDate.get(dateKey)?.length || 0,
      });
    }

    // Next month padding days to complete grid
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateKey = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cells.push({
        dayNumber: day,
        dateKey,
        isCurrentMonth: false,
        isToday: dateKey === todayKey,
        count: emailsByDate.get(dateKey)?.length || 0,
      });
    }

    return cells;
  }, [currentYear, currentMonth, emailsByDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDateKey(today.toISOString().split("T")[0]);
  };

  const dayEmails = useMemo(() => {
    const list = emailsByDate.get(selectedDateKey) || [];
    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter((e) => {
      const email = e.recipient?.email?.toLowerCase() || "";
      const name = e.recipient?.name?.toLowerCase() || "";
      const comp = e.recipient?.company?.toLowerCase() || "";
      const subj = e.subject?.toLowerCase() || "";
      return email.includes(q) || name.includes(q) || comp.includes(q) || subj.includes(q);
    });
  }, [emailsByDate, selectedDateKey, searchQuery]);

  const formattedSelectedDate = useMemo(() => {
    if (!selectedDateKey) return "";
    const [y, m, d] = selectedDateKey.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [selectedDateKey]);

  const monthTotalSent = useMemo(() => {
    const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
    let total = 0;
    emailsByDate.forEach((list, key) => {
      if (key.startsWith(prefix)) {
        total += list.length;
      }
    });
    return total;
  }, [currentYear, currentMonth, emailsByDate]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          title="Outreach Activity Calendar"
          className="glass grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition-all hover:text-foreground hover:shadow-[0_8px_20px_-8px_oklch(0.55_0.14_285/45%)] focus:outline-none"
        >
          <CalendarIcon className="h-4 w-4" />
        </button>
      </DialogTrigger>

      <DialogContent className="glass-strong max-w-5xl p-0 text-foreground shadow-2xl sm:rounded-[2rem] overflow-hidden border border-border">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-border bg-card/60 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-accent text-primary-foreground shadow-md">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2.5">
                Outreach Activity Calendar
                <Badge
                  variant="outline"
                  className="border-violet/40 bg-violet/10 text-foreground text-xs font-semibold px-2.5 py-0.5"
                >
                  {monthTotalSent} sent in {monthNames[currentMonth]}
                </Badge>
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                Track which emails were sent to whom by clicking on any date.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleToday}
              className="h-9 px-3.5 border-border bg-card text-xs font-semibold text-foreground hover:bg-secondary rounded-xl"
            >
              Today
            </Button>
            <div className="flex items-center rounded-xl border border-border bg-card p-0.5 shadow-sm">
              <Button
                size="icon"
                variant="ghost"
                onClick={handlePrevMonth}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-3 text-xs font-bold text-foreground min-w-[120px] text-center">
                {monthNames[currentMonth]} {currentYear}
              </span>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleNextMonth}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Body grid: Left Calendar, Right Day details */}
        <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-border max-h-[75vh] overflow-y-auto">
          {/* Left: Interactive Month Grid (7 cols) */}
          <div className="p-6 md:col-span-6 lg:col-span-7 flex flex-col justify-between space-y-4">
            <div>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1.5 text-center mb-2.5">
                {daysOfWeek.map((day) => (
                  <span
                    key={day}
                    className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider py-1"
                  >
                    {day}
                  </span>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-2">
                {calendarGrid.map((cell, idx) => {
                  const isSelected = cell.dateKey === selectedDateKey;
                  const hasActivity = cell.count > 0;

                  return (
                    <button
                      key={`${cell.dateKey}-${idx}`}
                      type="button"
                      onClick={() => {
                        setSelectedDateKey(cell.dateKey);
                        setSelectedEmail(null);
                      }}
                      className={`relative flex flex-col items-center justify-between rounded-2xl p-2.5 h-16 transition-all ${
                        isSelected
                          ? "gradient-accent text-primary-foreground shadow-md font-bold"
                          : cell.isCurrentMonth
                          ? hasActivity
                            ? "border border-violet/40 bg-violet/10 text-foreground hover:bg-violet/20 font-bold"
                            : "border border-border/80 bg-card text-foreground hover:bg-secondary/70"
                          : "text-muted-foreground opacity-35 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`text-xs font-bold ${
                            cell.isToday && !isSelected
                              ? "flex h-5 w-5 items-center justify-center rounded-full bg-violet/20 text-slate-800 font-bold"
                              : ""
                          }`}
                        >
                          {cell.dayNumber}
                        </span>
                        {cell.isToday && !isSelected && (
                          <span className="h-1.5 w-1.5 rounded-full bg-violet" />
                        )}
                      </div>

                      {hasActivity && (
                        <div className="w-full flex justify-center">
                          <span
                            className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                              isSelected
                                ? "bg-card/25 text-primary-foreground"
                                : "bg-success/20 text-success border border-success/30"
                            }`}
                          >
                            {cell.count} mail{cell.count > 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick legend footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-xs text-muted-foreground font-medium">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-success shadow-sm" /> Sent activity
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-violet" /> Selected
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Click any day to view sent recipient logs
              </span>
            </div>
          </div>

          {/* Right: Selected Day's Outreach Activity & Email Inspector */}
          <div className="p-6 md:col-span-6 lg:col-span-5 flex flex-col h-full bg-secondary/30">
            {selectedEmail ? (
              /* Email Inspection View */
              <div className="flex flex-col h-full space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3.5">
                  <button
                    type="button"
                    onClick={() => setSelectedEmail(null)}
                    className="flex items-center gap-1 text-xs text-slate-800 hover:underline font-bold"
                  >
                    <ChevronLeft className="h-4 w-4" /> Back to {formattedSelectedDate}
                  </button>
                  <Badge
                    variant="outline"
                    className="border-success/30 bg-success/15 text-success text-xs font-bold"
                  >
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Delivered
                  </Badge>
                </div>

                <div className="space-y-3.5 overflow-y-auto flex-1 pr-1">
                  {/* Recipient & Company Card */}
                  <div className="rounded-2xl border border-border bg-card p-4 space-y-2.5 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {selectedEmail.recipient.name || "Hiring Team"}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          {selectedEmail.recipient.email}
                        </p>
                      </div>
                      {selectedEmail.recipient.company && (
                        <Badge
                          variant="outline"
                          className="border-violet/30 bg-violet/10 text-slate-800 text-xs font-bold"
                        >
                          <Building2 className="mr-1 h-3 w-3" />
                          {selectedEmail.recipient.company}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground border-t border-border/60 pt-2 font-medium">
                      <Clock className="h-3.5 w-3.5" />
                      Sent at:{" "}
                      {selectedEmail.sentAt
                        ? new Date(selectedEmail.sentAt).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            second: "2-digit",
                          })
                        : "—"}
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-sm">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Subject Line
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {selectedEmail.subject}
                    </p>
                  </div>

                  {/* Body preview */}
                  <div className="rounded-2xl border border-border bg-card p-4 space-y-1.5 shadow-sm">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Email Message
                    </p>
                    <div
                      className="text-sm text-foreground leading-relaxed max-h-60 overflow-y-auto space-y-2 font-mono whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{
                        __html: selectedEmail.body.replace(/\n/g, "<br>"),
                      }}
                    />
                  </div>

                  {selectedEmail.attachmentName && (
                    <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs text-foreground font-semibold">
                      <Paperclip className="h-4 w-4 text-slate-800" />
                      Attachment: {selectedEmail.attachmentName}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Day's Outreach List View */
              <div className="flex flex-col h-full space-y-4">
                {/* Header info */}
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold text-foreground">
                      {formattedSelectedDate}
                    </h4>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {dayEmails.length} email{dayEmails.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Recipients contacted on this day:
                  </p>
                </div>

                {/* Search bar within day */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search recipient, company, or subject..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 pl-9 text-xs border-border bg-card text-foreground placeholder:text-muted-foreground rounded-xl"
                  />
                </div>

                {/* Recipient Cards List */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[280px]">
                  {loading ? (
                    <div className="flex h-56 items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-slate-800" />
                    </div>
                  ) : dayEmails.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-56 text-center p-5 rounded-2xl border border-dashed border-border bg-card/40">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground mb-2.5">
                        <Mail className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-bold text-foreground">
                        No emails sent on this day
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
                        Pick another date on the calendar to see past outreach activity.
                      </p>
                    </div>
                  ) : (
                    dayEmails.map((email) => (
                      <button
                        key={email.id}
                        type="button"
                        onClick={() => setSelectedEmail(email)}
                        className="w-full text-left rounded-2xl border border-border bg-card p-3.5 transition-all hover:border-violet/40 hover:bg-violet/5 group space-y-2 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-xs font-bold text-foreground group-hover:text-slate-800">
                                {email.recipient.name || email.recipient.email.split("@")[0]}
                              </p>
                              {email.recipient.company && (
                                <Badge
                                  variant="outline"
                                  className="border-violet/30 bg-violet/10 text-slate-800 text-[10px] px-2 py-0 shrink-0 font-semibold"
                                >
                                  {email.recipient.company}
                                </Badge>
                              )}
                            </div>
                            <p className="truncate text-[11px] font-mono text-muted-foreground mt-0.5">
                              {email.recipient.email}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {email.status === "sent" ? (
                              <span className="flex items-center text-success text-xs font-semibold">
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                Sent
                              </span>
                            ) : (
                              <span className="flex items-center text-destructive text-xs font-semibold">
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                Failed
                              </span>
                            )}
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-slate-800 ml-1 transition-transform group-hover:translate-x-1" />
                          </div>
                        </div>

                        {/* Subject preview */}
                        <p className="truncate text-xs text-foreground font-medium">
                          {email.subject}
                        </p>

                        {/* Timestamp */}
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t border-border/50">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="h-3 w-3" />
                            {email.sentAt
                              ? new Date(email.sentAt).toLocaleTimeString("en-US", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })
                              : "Recently"}
                          </span>
                          <span className="text-slate-800 font-semibold group-hover:underline">
                            View message →
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
