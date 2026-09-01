"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Sparkles,
  X,
  Paperclip,
  Send as SendIcon,
  Building2,
  Loader2,
  Clock,
  Shield,
  Zap,
  Turtle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Users,
  RefreshCw,
  Plus,
  Mail,
  UserCheck,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getCompanyFromEmail, inferNameFromEmail } from "@/lib/company-lookup";

interface Recipient {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
}

interface GeneratedEmail {
  recipientId: string;
  email: string;
  company: string;
  recipientName: string;
  subject: string;
  body: string;
}

interface UserProfile {
  fullName: string | null;
  currentRole: string | null;
  targetRoles: string | null;
  skills: string | null;
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function ComposePage() {
  const [activeMode, setActiveMode] = useState<"ai" | "template">("ai");
  
  // Profile
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Recipients
  const [addressBook, setAddressBook] = useState<Recipient[]>([]);
  const [chips, setChips] = useState<string[]>([]);
  const [draftInput, setDraftInput] = useState("");
  
  // Form fields
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  
  // AI options
  const [goal, setGoal] = useState("internship");
  const [tone, setTone] = useState("confident and concise");
  const [customInstructions, setCustomInstructions] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedEmails, setGeneratedEmails] = useState<GeneratedEmail[]>([]);
  const [activePreviewIdx, setActivePreviewIdx] = useState(0);

  // Resume PDF Attachment
  const [file, setFile] = useState<{ name: string; path: string } | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Send speed / throttling
  const [sendSpeed, setSendSpeed] = useState<"fast" | "safe" | "stealth" | "custom">("safe");
  const [customDelay, setCustomDelay] = useState(45);
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState<{
    total: number;
    sent: number;
    failed: number;
    status: string;
  } | null>(null);

  // Daily limits
  const [dailyLimits, setDailyLimits] = useState<{
    sentToday: number;
    remaining: number;
    safeLimit: number;
  } | null>(null);

  // Load initial data (profile, recipients, daily limits)
  const fetchInitialData = useCallback(async () => {
    try {
      const [recRes, limitRes, profRes] = await Promise.all([
        fetch("/api/recipients"),
        fetch("/api/campaigns/limits"),
        fetch("/api/profile"),
      ]);

      let profData: UserProfile | null = null;
      if (profRes.ok) {
        profData = await profRes.json();
        setProfile(profData);
      }

      if (recRes.ok) {
        const data = await recRes.json();
        setAddressBook(data);
        if (data.length > 0 && chips.length === 0) {
          setChips(data.slice(0, 3).map((r: Recipient) => r.email));
        }
      }

      if (limitRes.ok) {
        const lData = await limitRes.json();
        setDailyLimits(lData);
      }

      // Initial default subject line
      const sender = profData?.fullName || "Aditya Gupta";
      const targetRole = profData?.targetRoles || "Software Engineer Intern";
      setSubject(`${sender} — ${targetRole} Inquiry`);
    } catch {
      toast.error("Failed to load initial settings");
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Detected company for the first active chip
  const detectedCompany = useMemo(() => {
    const activeEmail = chips[0] || (isValidEmail(draftInput) ? draftInput : "");
    if (!activeEmail) return null;
    const company = getCompanyFromEmail(activeEmail);
    return company ? { company, email: activeEmail } : null;
  }, [chips, draftInput]);

  // Delay seconds calculation
  const getDelaySeconds = () => {
    switch (sendSpeed) {
      case "fast": return 15;
      case "safe": return 30;
      case "stealth": return 60;
      case "custom": return customDelay;
    }
  };

  const getEstimatedTime = (count: number) => {
    const totalSecs = count * getDelaySeconds();
    if (totalSecs < 60) return `~${totalSecs}s`;
    const mins = Math.ceil(totalSecs / 60);
    return `~${mins} min${mins > 1 ? "s" : ""}`;
  };

  // Add email chip
  const addChip = (value: string) => {
    const v = value.trim().replace(/,$/, "");
    if (!v) return;
    if (!isValidEmail(v)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (chips.includes(v)) return;
    setChips((prev) => [...prev, v]);
    setDraftInput("");
  };

  const removeChip = (val: string) => {
    setChips((prev) => prev.filter((c) => c !== val));
  };

  const selectAllAddressBook = () => {
    const allEmails = addressBook.map((r) => r.email);
    setChips(Array.from(new Set([...chips, ...allEmails])));
    toast.success(`Selected ${allEmails.length} recipients from address book`);
  };

  // File upload handler
  const handleFileUpload = async (uploaded: File) => {
    if (uploaded.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }
    if (uploaded.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB");
      return;
    }

    setUploadingFile(true);
    const formData = new FormData();
    formData.append("file", uploaded);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        setFile({ name: data.name, path: data.path });
        toast.success(`Attached resume: ${data.name}`);
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploadingFile(false);
    }
  };

  // AI Generation
  const handleGenerateAI = async () => {
    if (chips.length === 0) {
      toast.error("Add at least one recipient email to generate");
      return;
    }

    setGenerating(true);
    try {
      const directRecipients = chips.map((email) => {
        const found = addressBook.find((r) => r.email.toLowerCase() === email.toLowerCase());
        return {
          id: found?.id,
          email,
          name: found?.name || inferNameFromEmail(email),
          company: found?.company || getCompanyFromEmail(email),
        };
      });

      const res = await fetch("/api/generate-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: directRecipients,
          goal,
          tone,
          customInstructions,
        }),
      });

      const data = await res.json();
      if (res.ok && Array.isArray(data.emails) && data.emails.length > 0) {
        setGeneratedEmails(data.emails);
        setActivePreviewIdx(0);
        // Put the first email's tailored subject into the field
        setSubject(data.emails[0].subject);
        setBody(data.emails[0].body);
        toast.success(`Generated ${data.emails.length} personalized emails with tailored subjects!`);
      } else {
        toast.error(data.error || "Failed to generate AI emails");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  // Update active generated email content when editing
  const handleSubjectChange = (val: string) => {
    setSubject(val);
    if (generatedEmails[activePreviewIdx]) {
      setGeneratedEmails((prev) =>
        prev.map((item, idx) => (idx === activePreviewIdx ? { ...item, subject: val } : item))
      );
    }
  };

  const handleBodyChange = (val: string) => {
    setBody(val);
    if (generatedEmails[activePreviewIdx]) {
      setGeneratedEmails((prev) =>
        prev.map((item, idx) => (idx === activePreviewIdx ? { ...item, body: val } : item))
      );
    }
  };

  // Send Campaign
  const handleSend = async () => {
    if (chips.length === 0) {
      toast.error("Add at least one recipient");
      return;
    }

    if (!subject.trim()) {
      toast.error("Please enter a valid subject line");
      return;
    }

    if (!body.trim()) {
      toast.error("Please enter email body content");
      return;
    }

    setSending(true);
    const delay = getDelaySeconds();
    setSendProgress({
      total: chips.length,
      sent: 0,
      failed: 0,
      status: `Initializing campaign (${delay}s gap)...`,
    });

    try {
      // 1. Ensure recipients exist in DB
      const recipientIds: string[] = [];
      const recipientMap = new Map<string, string>(); // email -> recipientId

      for (const email of chips) {
        let existing = addressBook.find((r) => r.email.toLowerCase() === email.toLowerCase());
        if (!existing) {
          const createRes = await fetch("/api/recipients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              name: inferNameFromEmail(email),
              company: getCompanyFromEmail(email),
            }),
          });
          if (createRes.ok) {
            existing = await createRes.json();
          }
        }
        if (existing?.id) {
          recipientIds.push(existing.id);
          recipientMap.set(email.toLowerCase(), existing.id);
        }
      }

      // Map generated emails to recipientIds
      const customEmails = generatedEmails.map((e) => {
        const id = e.recipientId || recipientMap.get(e.email.toLowerCase());
        return {
          recipientId: id!,
          subject: e.subject || subject,
          body: e.body || body,
        };
      }).filter((e) => !!e.recipientId);

      // Determine a clean, professional overall campaign subject title
      const sender = profile?.fullName || "Aditya Gupta";
      const targetRole = profile?.targetRoles || "Software Engineer";
      const campaignTitle =
        subject.trim() ||
        `${sender} — ${targetRole} Outreach (${chips.length} recipient${chips.length > 1 ? "s" : ""})`;

      const payload = {
        subject: campaignTitle,
        body: body || "Email content",
        recipientIds,
        attachmentPath: file?.path,
        attachmentName: file?.name,
        customEmails,
      };

      const campRes = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!campRes.ok) {
        const err = await campRes.json();
        throw new Error(err.error || "Failed to create campaign");
      }

      const campaign = await campRes.json();

      setSendProgress((p) => ({ ...p!, status: `Sending emails via Gmail SMTP (${delay}s gap)...` }));

      const sendRes = await fetch(`/api/campaigns/${campaign.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delaySeconds: delay }),
      });

      const result = await sendRes.json();

      if (sendRes.status === 429 && result.requiresConfirmation) {
        const proceed = window.confirm(`${result.error}\n\nDo you want to send anyway?`);
        if (proceed) {
          const retryRes = await fetch(`/api/campaigns/${campaign.id}/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ delaySeconds: delay, skipLimitCheck: true }),
          });
          const retryResult = await retryRes.json();
          if (!retryRes.ok) throw new Error(retryResult.error || "Send failed");
          Object.assign(result, retryResult);
        } else {
          setSending(false);
          setSendProgress(null);
          return;
        }
      }

      if (sendRes.ok) {
        setSendProgress({
          total: result.totalCount,
          sent: result.sentCount,
          failed: result.failedCount,
          status: result.failedCount === 0 ? "All sent successfully!" : `Sent with ${result.failedCount} failure(s)`,
        });
        toast.success(`🎉 Outreach campaign sent successfully!`);
      } else {
        throw new Error(result.error || "Send failed");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send campaign");
      setSendProgress(null);
    } finally {
      setSending(false);
    }
  };

  const activeEmailForPreview = generatedEmails[activePreviewIdx];

  return (
    <div className="space-y-5 w-full">
      <PageHeader
        title="Compose Outreach"
        description="Write it once, let AI personalize it uniquely per company domain."
      />

      <div className="grid gap-6 lg:grid-cols-12 w-full items-start">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="surface space-y-5 p-6 sm:p-7 lg:col-span-7">
          {/* Mode Switcher Pills */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Campaign Mode
            </Label>
            <div className="flex rounded-2xl bg-secondary/80 p-1.5 border border-border">
              <button
                type="button"
                onClick={() => setActiveMode("ai")}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs sm:text-sm font-bold transition-all ${
                  activeMode === "ai"
                    ? "gradient-accent text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sparkles className="h-4 w-4" />
                AI Smart Outreach
              </button>
              <button
                type="button"
                onClick={() => setActiveMode("template")}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs sm:text-sm font-bold transition-all ${
                  activeMode === "template"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="h-4 w-4" />
                Standard Template
              </button>
            </div>
          </div>

          {/* "To" Recipient Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold">To (Recipients)</Label>
              {addressBook.length > 0 && (
                <button
                  type="button"
                  onClick={selectAllAddressBook}
                  className="flex items-center gap-1.5 text-xs text-slate-800 hover:underline font-bold"
                >
                  <Users className="h-3.5 w-3.5" />
                  Select all ({addressBook.length})
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-input bg-secondary/30 p-2.5 min-h-[52px]">
              {chips.map((c) => {
                const comp = getCompanyFromEmail(c);
                return (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs sm:text-sm font-semibold text-foreground"
                  >
                    <span>{c}</span>
                    {comp && (
                      <span className="rounded-lg bg-violet/20 text-slate-800 px-1.5 py-0.5 text-[11px] font-bold">
                        {comp}
                      </span>
                    )}
                    <button
                      type="button"
                      aria-label={`Remove ${c}`}
                      onClick={() => removeChip(c)}
                      className="hover:text-destructive transition-colors ml-0.5"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                );
              })}
              <input
                value={draftInput}
                onChange={(e) => setDraftInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "," || e.key === " ") {
                    e.preventDefault();
                    addChip(draftInput);
                  }
                  if (e.key === "Backspace" && !draftInput) {
                    setChips((p) => p.slice(0, -1));
                  }
                }}
                onBlur={() => draftInput && addChip(draftInput)}
                placeholder={chips.length === 0 ? "Paste hr@tcs.com, recruiter@google.com..." : "Add more..."}
                className="min-w-[180px] flex-1 bg-transparent px-2 py-1 text-sm sm:text-base outline-none placeholder:text-muted-foreground"
              />
            </div>

            {detectedCompany && (
              <div className="flex items-center gap-2 pt-0.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-semibold text-foreground">
                  <Building2 className="h-3.5 w-3.5 text-slate-800" />
                  Target Company: <strong className="text-slate-800">{detectedCompany.company}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Subject Line Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold">Subject Line</Label>
              {generatedEmails.length > 1 && (
                <span className="text-xs text-slate-800 font-semibold">
                  (Customized for: {generatedEmails[activePreviewIdx]?.company || "Selected recipient"})
                </span>
              )}
            </div>
            {generating ? (
              <div className="shimmer h-11 rounded-2xl" />
            ) : (
              <Input
                value={subject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                placeholder="e.g. Aditya Gupta — SDE Internship Inquiry | TCS"
                className="bg-secondary/20 h-11 text-sm sm:text-base rounded-2xl font-semibold"
              />
            )}
          </div>

          {/* Body Field */}
          <div className="space-y-2">
            <Label className="text-sm font-bold">Email Message Body</Label>
            {generating ? (
              <div className="space-y-2.5 py-3">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="shimmer h-4 rounded-lg" style={{ width: `${92 - i * 8}%` }} />
                ))}
              </div>
            ) : (
              <Textarea
                value={body}
                onChange={(e) => handleBodyChange(e.target.value)}
                rows={10}
                placeholder="Write your email message..."
                className="resize-none font-mono text-sm leading-relaxed p-3.5 rounded-2xl"
              />
            )}
          </div>

          {/* Resume PDF Attachment Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleFileUpload(f);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-4 text-center transition-all ${
              dragging
                ? "border-primary bg-primary/10"
                : "border-border hover:bg-secondary/40"
            }`}
          >
            <Paperclip className="mx-auto mb-1.5 h-4 w-4 text-muted-foreground" />
            {uploadingFile ? (
              <span className="text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading resume...
              </span>
            ) : file ? (
              <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-foreground">
                <span>📎 {file.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="text-destructive hover:underline ml-2 text-xs"
                >
                  Remove
                </button>
              </div>
            ) : (
              <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                Drag &amp; drop your resume (PDF, max 5MB), or click to browse
              </span>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
              }}
            />
          </div>

          {/* Send Speed Throttling Bar */}
          <div className="space-y-3.5 rounded-3xl border border-border bg-secondary/30 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <Label className="text-xs sm:text-sm font-bold flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" /> Send Speed &amp; Throttling
              </Label>
              <span className="text-xs font-semibold text-muted-foreground">
                Est: {getEstimatedTime(chips.length)}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { id: "fast" as const, label: "Fast", desc: "15s gap", icon: Zap },
                { id: "safe" as const, label: "Safe", desc: "30s gap", icon: Shield },
                { id: "stealth" as const, label: "Stealth", desc: "60s gap", icon: Turtle },
                { id: "custom" as const, label: "Custom", desc: `${customDelay}s`, icon: Clock },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSendSpeed(s.id)}
                  className={`flex flex-col items-center gap-0.5 rounded-2xl border p-2.5 text-xs transition-all ${
                    sendSpeed === s.id
                      ? "gradient-accent text-primary-foreground font-bold shadow-md border-transparent"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <s.icon className="h-3.5 w-3.5" />
                  <span className="font-bold text-xs sm:text-sm">{s.label}</span>
                  <span className="text-[10px] opacity-75">{s.desc}</span>
                </button>
              ))}
            </div>

            {sendSpeed === "custom" && (
              <div className="flex items-center gap-3 pt-1">
                <Input
                  type="number"
                  min={10}
                  max={300}
                  value={customDelay}
                  onChange={(e) => setCustomDelay(Math.max(10, Math.min(300, Number(e.target.value))))}
                  className="h-9 w-20 text-xs font-bold"
                />
                <span className="text-xs text-muted-foreground">seconds between each email (10-300)</span>
              </div>
            )}

            {dailyLimits && (
              <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/60 pt-2.5">
                <span className="font-medium">Daily Safe Quota: {dailyLimits.sentToday}/{dailyLimits.safeLimit} used</span>
                <span className="text-success font-bold">{dailyLimits.remaining} remaining</span>
              </div>
            )}
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={sending || chips.length === 0}
            className="w-full gradient-accent text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-90 h-12 text-sm sm:text-base font-bold rounded-2xl"
          >
            {sending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <SendIcon className="mr-2 h-4 w-4" />
            )}
            {sending
              ? "Sending Individual Emails via Gmail SMTP..."
              : `Send Personalized Emails to ${chips.length} Recipient${chips.length !== 1 ? "s" : ""}`}
          </Button>

          {sendProgress && (
            <div className="space-y-2 rounded-2xl border border-border bg-secondary/40 p-3.5 text-xs sm:text-sm">
              <div className="flex justify-between font-bold">
                <span className="text-foreground">{sendProgress.status}</span>
                <span>{sendProgress.sent + sendProgress.failed}/{sendProgress.total}</span>
              </div>
              <Progress value={((sendProgress.sent + sendProgress.failed) / sendProgress.total) * 100} className="h-2 rounded-full" />
            </div>
          )}
        </div>

        {/* Right Column: Live Email Preview + AI Outreach Strategy (5 cols) */}
        <div className="space-y-5 lg:col-span-5 h-fit lg:sticky lg:top-4">
          {/* Live Email Preview Card */}
          <div className="surface p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Live Email Preview
                </p>
                <p className="text-[11px] text-muted-foreground">What your recipient will see in Gmail</p>
              </div>
              {generatedEmails.length > 1 && (
                <Badge variant="outline" className="border-violet/40 bg-violet/10 text-slate-800 font-bold text-xs">
                  {activePreviewIdx + 1} of {generatedEmails.length} drafts
                </Badge>
              )}
            </div>

            {/* Carousel selector if multiple AI drafts */}
            {generatedEmails.length > 1 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Inspect &amp; Edit Recipient:</span>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {generatedEmails.map((em, idx) => (
                    <button
                      key={em.recipientId || idx}
                      type="button"
                      onClick={() => {
                        setActivePreviewIdx(idx);
                        setSubject(em.subject);
                        setBody(em.body);
                      }}
                      className={`shrink-0 rounded-xl px-2.5 py-1 text-xs font-bold transition-all ${
                        activePreviewIdx === idx
                          ? "gradient-accent text-primary-foreground shadow-sm"
                          : "border border-border bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {em.company || em.email.split("@")[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Rendered Email Card */}
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="gradient-accent grid h-8 w-8 place-items-center rounded-xl text-xs font-black text-primary-foreground">
                    {profile?.fullName ? profile.fullName.slice(0, 2).toUpperCase() : "RO"}
                  </span>
                  <div className="text-xs">
                    <p className="font-bold text-foreground">{profile?.fullName || "You"} (via Gmail)</p>
                    <p className="text-muted-foreground truncate max-w-[200px] sm:max-w-[240px] text-[11px] font-mono">
                      To: {chips[activePreviewIdx] || chips[0] || "recipient@company.com"}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">Preview</span>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Subject</p>
                <h3 className="text-xs sm:text-sm font-bold text-foreground leading-snug mt-0.5">
                  {subject || <span className="text-muted-foreground font-normal">Subject line will appear here</span>}
                </h3>
              </div>

              <div className="border-t border-border/60 pt-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Message</p>
                <div className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-foreground max-h-72 overflow-y-auto font-sans">
                  {body || "Your personalized email body will appear here as you type or generate with AI."}
                </div>
              </div>

              {file && (
                <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-3 py-1.5 text-xs font-bold text-foreground shadow-sm">
                  <Paperclip className="h-3.5 w-3.5 text-slate-800" />
                  <span>Attachment: {file.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* AI Outreach Strategy Section (Right Side below Mail Preview) */}
          {activeMode === "ai" && (
            <div className="surface space-y-4 p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> AI Outreach Strategy
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">Groq &amp; Gemini</span>
              </div>

              {/* Goal Pills */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Goal</Label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: "internship", label: "Internship" },
                    { id: "fulltime", label: "Full-Time" },
                    { id: "networking", label: "Coffee Chat" },
                    { id: "sales", label: "Pitch" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setGoal(item.id)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                        goal === item.id
                          ? "gradient-accent text-primary-foreground shadow-sm"
                          : "border border-border bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone Pills */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tone</Label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: "confident and concise", label: "Confident & Concise" },
                    { id: "warm and enthusiastic", label: "Enthusiastic" },
                    { id: "executive and direct", label: "Executive" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTone(item.id)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                        tone === item.id
                          ? "gradient-accent text-primary-foreground shadow-sm"
                          : "border border-border bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-1">
                <Button
                  onClick={handleGenerateAI}
                  disabled={generating || chips.length === 0}
                  className="w-full gradient-accent text-primary-foreground shadow-lg hover:opacity-90 h-11 text-xs sm:text-sm font-bold rounded-2xl"
                >
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  {generating ? "Crafting with AI..." : `Generate Personalized Emails for ${chips.length} Recipient${chips.length !== 1 ? "s" : ""}`}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
