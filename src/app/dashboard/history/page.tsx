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
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, StatusBadge } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CampaignEmail {
  id: string;
  status: string;
  error: string | null;
  sentAt: string | null;
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
        toast.success(`Retry finished: ${data.sentCount} sent, ${data.failedCount} failed`);
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
        <PageHeader title="Campaigns" description="Review every cold email campaign." />
        <div className="surface flex flex-col items-center gap-4 px-8 py-24 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-3xl bg-primary/10 text-primary">
            <Mail className="h-8 w-8" />
          </span>
          <p className="text-lg font-bold text-foreground">No campaigns yet</p>
          <p className="text-sm text-muted-foreground max-w-md">
            Launch your first outreach campaign to track per-recipient delivery statuses here.
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
        description="Click any campaign to inspect delivery status and recipient details."
        action={
          <Button
            variant="outline"
            onClick={() => {
              setLoading(true);
              fetchCampaigns();
            }}
            className="h-11 px-5 text-sm font-bold rounded-2xl border-border"
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
              className="surface gradient-ring animate-fade-up p-7 transition-all"
            >
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

              {open && (
                <div className="mt-5 space-y-4 border-t border-border pt-5">
                  {loadingDetail ? (
                    <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mr-2 text-violet" />
                      Loading recipients...
                    </div>
                  ) : detailCampaign?.emails && detailCampaign.emails.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-foreground">
                          Recipient Delivery Breakdown ({detailCampaign.emails.length})
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

                      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {detailCampaign.emails.map((p) => (
                          <div
                            key={p.id}
                            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-2xl bg-secondary/40 px-4 py-3 text-sm"
                          >
                            <span className="min-w-0">
                              <span className="block truncate font-bold text-foreground">
                                {p.recipient.name || p.recipient.email.split("@")[0]}
                                {p.recipient.company && (
                                  <span className="text-violet font-semibold ml-2 text-xs">
                                    🏢 {p.recipient.company}
                                  </span>
                                )}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground font-mono mt-0.5">
                                {p.recipient.email}
                              </span>
                              {p.error && (
                                <span className="block truncate text-xs text-destructive mt-1 font-medium">
                                  Error: {p.error}
                                </span>
                              )}
                            </span>
                            <StatusBadge status={p.status} />
                          </div>
                        ))}
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
    </div>
  );
}
