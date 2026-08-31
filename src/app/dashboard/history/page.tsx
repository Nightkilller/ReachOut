"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Mail,
  RefreshCw,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Paperclip,
  Building2,
  Eye,
  X,
  FileText,
  User,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, StatusBadge } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface CampaignEmail {
  id: string;
  status: string;
  error: string | null;
  sentAt: string | null;
  customSubject: string | null;
  customBody: string | null;
  recipient: {
    email: string;
    name: string | null;
    company: string | null;
  };
}

interface Campaign {
  id: string;
  subject: string;
  body: string;
  status: string;
  totalCount: number;
  sentCount: number;
  failedCount: number;
  attachmentName: string | null;
  createdAt: string;
  emails?: CampaignEmail[];
}

export default function CampaignsHistoryPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailCampaign, setDetailCampaign] = useState<Campaign | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [retrying, setRetrying] = useState<string | null>(null);

  // Inspector modal state
  const [inspectEmail, setInspectEmail] = useState<{
    recipient: { email: string; name: string | null; company: string | null };
    subject: string;
    body: string;
    attachmentName: string | null;
    status: string;
    sentAt: string | null;
    error: string | null;
  } | null>(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch("/api/campaigns");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data);
      }
    } catch {
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(id);
    setLoadingDetail(true);

    try {
      const res = await fetch(`/api/campaigns/${id}`);
      if (res.ok) {
        const data = await res.json();
        setDetailCampaign(data);
      }
    } catch {
      toast.error("Failed to load campaign details");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleRetry = async (campaignId: string) => {
    setRetrying(campaignId);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delaySeconds: 15 }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Retry complete: ${data.sentCount} sent, ${data.failedCount} failed`);
        fetchCampaigns();
        if (expandedId === campaignId) {
          toggleExpand(campaignId);
        }
      } else {
        const err = await res.json();
        toast.error(err.error || "Retry failed");
      }
    } catch {
      toast.error("Retry failed");
    } finally {
      setRetrying(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet" />
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="space-y-8 w-full">
        <PageHeader title="Campaigns &amp; History" description="Review every cold email campaign." />
        <div className="surface flex flex-col items-center gap-4 px-8 py-24 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-3xl bg-primary/10 text-primary">
            <Mail className="h-8 w-8" />
          </span>
          <p className="text-lg font-bold text-foreground">No campaigns yet</p>
          <p className="text-sm text-muted-foreground max-w-md">
            Launch your first outreach campaign to track per-recipient delivery and view exact sent email copies here.
          </p>
          <Button asChild className="gradient-accent text-primary-foreground h-12 px-6 font-bold rounded-2xl hover:opacity-90 mt-3">
            <Link href="/dashboard/compose">Compose your first email</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full">
      <PageHeader
        title="Campaigns &amp; History"
        description="Inspect per-recipient delivery statuses, customized subject lines, and sent copies."
        action={
          <Button
            variant="outline"
            onClick={() => {
              setLoading(true);
              fetchCampaigns();
            }}
            className="h-11 px-5 text-sm font-bold rounded-2xl border-border shadow-sm"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2 w-full">
        {campaigns.map((c, i) => {
          const open = expandedId === c.id;
          return (
            <div
              key={c.id}
              style={{ animationDelay: `${i * 50}ms` }}
              className="surface gradient-ring animate-fade-up p-7 transition-all flex flex-col justify-between"
            >
              <div>
                <button
                  type="button"
                  onClick={() => toggleExpand(c.id)}
                  className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-4 text-left"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-bold text-foreground text-base sm:text-lg">
                      {c.subject}
                    </span>
                    <span className="mt-1.5 block text-sm text-muted-foreground font-medium">
                      {c.totalCount} recipients · {c.sentCount} sent · {c.failedCount} failed ·{" "}
                      {new Date(c.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <StatusBadge status={c.status} />
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 text-muted-foreground transition-transform duration-300",
                        open && "rotate-180",
                      )}
                    />
                  </span>
                </button>
              </div>

              {open && (
                <div className="mt-6 space-y-4 border-t border-border pt-5">
                  {loadingDetail ? (
                    <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mr-2 text-violet" />
                      Loading recipients...
                    </div>
                  ) : detailCampaign?.emails && detailCampaign.emails.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-foreground">
                          Recipient Delivery ({detailCampaign.emails.length})
                        </span>
                        {detailCampaign.emails.some((e) => e.status === "failed") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRetry(c.id)}
                            disabled={retrying === c.id}
                            className="h-8 text-xs font-bold border-destructive/30 text-destructive hover:bg-destructive/10 rounded-xl"
                          >
                            {retrying === c.id ? (
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            Retry Failed
                          </Button>
                        )}
                      </div>

                      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                        {detailCampaign.emails.map((p) => {
                          const emailSubject = p.customSubject || detailCampaign.subject;
                          const emailBody = p.customBody || detailCampaign.body;

                          return (
                            <div
                              key={p.id}
                              className="rounded-2xl border border-border bg-card p-4 text-sm shadow-sm space-y-2.5 hover:border-violet/40 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-foreground truncate">
                                      {p.recipient.name || p.recipient.email.split("@")[0]}
                                    </span>
                                    {p.recipient.company && (
                                      <Badge
                                        variant="outline"
                                        className="border-violet/30 bg-violet/10 text-violet text-[10px] font-bold px-2 py-0"
                                      >
                                        <Building2 className="mr-1 h-3 w-3" />
                                        {p.recipient.company}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                                    {p.recipient.email}
                                  </p>
                                </div>
                                <StatusBadge status={p.status} />
                              </div>

                              {/* Exact Subject Line Sent to this Recipient */}
                              <div className="rounded-xl bg-secondary/50 p-2.5 text-xs space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                                  Subject
                                </span>
                                <p className="font-bold text-foreground truncate">
                                  {emailSubject}
                                </p>
                              </div>

                              {p.error && (
                                <p className="text-xs text-destructive font-medium flex items-center gap-1">
                                  <AlertTriangle className="h-3.5 w-3.5" /> Error: {p.error}
                                </p>
                              )}

                              <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  {p.sentAt
                                    ? new Date(p.sentAt).toLocaleTimeString("en-US", {
                                        hour: "numeric",
                                        minute: "2-digit",
                                      })
                                    : "Pending send"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setInspectEmail({
                                      recipient: p.recipient,
                                      subject: emailSubject,
                                      body: emailBody,
                                      attachmentName: detailCampaign.attachmentName,
                                      status: p.status,
                                      sentAt: p.sentAt,
                                      error: p.error,
                                    })
                                  }
                                  className="text-violet font-bold hover:underline flex items-center gap-1"
                                >
                                  <Eye className="h-3.5 w-3.5" /> View message
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No per-recipient data available.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Email Inspection Modal */}
      {inspectEmail && (
        <Dialog open={!!inspectEmail} onOpenChange={() => setInspectEmail(null)}>
          <DialogContent className="glass-strong sm:max-w-2xl rounded-3xl p-7 border-border">
            <DialogHeader className="border-b border-border pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle className="text-xl font-bold text-foreground">
                    Sent Email Copy
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    To: {inspectEmail.recipient.name} ({inspectEmail.recipient.email})
                  </p>
                </div>
                <StatusBadge status={inspectEmail.status} />
              </div>
            </DialogHeader>

            <div className="space-y-4 py-3">
              {/* Subject */}
              <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-sm">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Subject
                </span>
                <p className="text-base font-bold text-foreground">
                  {inspectEmail.subject}
                </p>
              </div>

              {/* Message Body */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-2 shadow-sm">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Message Content
                </span>
                <div
                  className="text-sm leading-relaxed text-foreground max-h-72 overflow-y-auto font-sans whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: inspectEmail.body.replace(/\n/g, "<br>"),
                  }}
                />
              </div>

              {inspectEmail.attachmentName && (
                <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-3.5 py-2 text-xs font-bold text-foreground">
                  <Paperclip className="h-4 w-4 text-violet" />
                  Attachment: {inspectEmail.attachmentName}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
