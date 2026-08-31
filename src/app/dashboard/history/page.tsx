"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Mail,
  Search,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Paperclip,
  RefreshCw,
  Copy,
  Check,
  Send,
  Loader2,
  AlertTriangle,
  ChevronRight,
  User,
  ArrowUpRight,
  Filter,
  Sparkles,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, StatusBadge } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface CampaignEmail {
  id: string;
  status: string;
  error: string | null;
  sentAt: string | null;
  customSubject: string | null;
  customBody: string | null;
  recipient: {
    id: string;
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
  attachmentPath: string | null;
  attachmentName: string | null;
  createdAt: string;
  emails?: CampaignEmail[];
}

interface FlatEmailItem {
  id: string;
  campaignId: string;
  campaignSubject: string;
  recipientName: string;
  recipientEmail: string;
  recipientCompany: string | null;
  subject: string;
  body: string;
  status: string;
  error: string | null;
  sentAt: string | null;
  attachmentName: string | null;
  attachmentPath: string | null;
  createdAt: string;
}

export default function CampaignsHistoryPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "sent" | "failed" | "pending">("all");
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  
  // Selected email ID for the full mail viewer pane
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [retrying, setRetrying] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch("/api/campaigns");
      if (res.ok) {
        const data: Campaign[] = await res.json();
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

  // Flatten all individual sent emails across campaigns for the unified CRM mailbox view
  const allEmailItems = useMemo<FlatEmailItem[]>(() => {
    const list: FlatEmailItem[] = [];

    for (const c of campaigns) {
      if (c.emails && c.emails.length > 0) {
        for (const e of c.emails) {
          list.push({
            id: e.id,
            campaignId: c.id,
            campaignSubject: c.subject,
            recipientName: e.recipient.name || e.recipient.email.split("@")[0],
            recipientEmail: e.recipient.email,
            recipientCompany: e.recipient.company || null,
            subject: e.customSubject || c.subject,
            body: e.customBody || c.body,
            status: e.status,
            error: e.error,
            sentAt: e.sentAt,
            attachmentName: c.attachmentName,
            attachmentPath: c.attachmentPath,
            createdAt: c.createdAt,
          });
        }
      } else {
        // Fallback for campaign without populated emails array
        list.push({
          id: c.id,
          campaignId: c.id,
          campaignSubject: c.subject,
          recipientName: `${c.totalCount} Recipients`,
          recipientEmail: "Batch Campaign",
          recipientCompany: null,
          subject: c.subject,
          body: c.body,
          status: c.status,
          error: null,
          sentAt: c.createdAt,
          attachmentName: c.attachmentName,
          attachmentPath: c.attachmentPath,
          createdAt: c.createdAt,
        });
      }
    }

    return list;
  }, [campaigns]);

  // Set default selected email on load
  useEffect(() => {
    if (!selectedEmailId && allEmailItems.length > 0) {
      setSelectedEmailId(allEmailItems[0].id);
    }
  }, [allEmailItems, selectedEmailId]);

  // Unique companies list for quick filtering pills
  const companiesList = useMemo(() => {
    const set = new Set<string>();
    for (const item of allEmailItems) {
      if (item.recipientCompany) {
        set.add(item.recipientCompany);
      }
    }
    return Array.from(set);
  }, [allEmailItems]);

  // Filtered emails based on search query, company tag, and status filter
  const filteredEmails = useMemo(() => {
    return allEmailItems.filter((item) => {
      // Status filter
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      // Company filter
      if (selectedCompany && item.recipientCompany?.toLowerCase() !== selectedCompany.toLowerCase()) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.recipientName.toLowerCase().includes(q);
        const matchesEmail = item.recipientEmail.toLowerCase().includes(q);
        const matchesCompany = (item.recipientCompany || "").toLowerCase().includes(q);
        const matchesSubject = item.subject.toLowerCase().includes(q);
        const matchesBody = item.body.toLowerCase().includes(q);

        return matchesName || matchesEmail || matchesCompany || matchesSubject || matchesBody;
      }

      return true;
    });
  }, [allEmailItems, statusFilter, selectedCompany, searchQuery]);

  // Selected email object for right pane
  const activeEmail = useMemo(() => {
    return allEmailItems.find((e) => e.id === selectedEmailId) || filteredEmails[0] || null;
  }, [allEmailItems, filteredEmails, selectedEmailId]);

  const handleCopyBody = () => {
    if (!activeEmail) return;
    navigator.clipboard.writeText(activeEmail.body);
    setCopied(true);
    toast.success("Email body copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRetryCampaign = async (campaignId: string) => {
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
    <div className="space-y-6 w-full">
      <PageHeader
        title="Campaigns &amp; Outreach Inbox"
        description="Search, filter, and inspect the exact email copies delivered to each person and company."
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

      {/* CRM Mailbox Container */}
      <div className="surface p-6 sm:p-8 rounded-[2.5rem] shadow-xl border border-border">
        {/* Top Controls: Search Bar & Status Tabs */}
        <div className="flex flex-col gap-4 border-b border-border pb-6">
          <div className="grid gap-4 md:grid-cols-12 items-center">
            {/* Search Input */}
            <div className="relative md:col-span-7 lg:col-span-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by person name, company, email address, or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 pl-12 pr-4 text-base border-border bg-secondary/30 rounded-2xl font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Delivery Status Filter Tabs */}
            <div className="flex items-center justify-end gap-1.5 md:col-span-5 lg:col-span-4 bg-secondary/50 p-1 rounded-2xl border border-border">
              {[
                { id: "all" as const, label: `All (${allEmailItems.length})` },
                { id: "sent" as const, label: `Sent (${allEmailItems.filter((e) => e.status === "sent").length})` },
                { id: "failed" as const, label: `Failed (${allEmailItems.filter((e) => e.status === "failed").length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`flex-1 rounded-xl py-2 px-3 text-xs font-bold transition-all text-center ${
                    statusFilter === tab.id
                      ? "gradient-accent text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Company Filter Badges */}
          {companiesList.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" /> Company:
              </span>
              <button
                type="button"
                onClick={() => setSelectedCompany(null)}
                className={`shrink-0 rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                  selectedCompany === null
                    ? "bg-foreground text-background"
                    : "border border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                All Companies
              </button>
              {companiesList.map((comp) => (
                <button
                  key={comp}
                  type="button"
                  onClick={() => setSelectedCompany(selectedCompany === comp ? null : comp)}
                  className={`shrink-0 rounded-xl px-3 py-1 text-xs font-bold transition-all flex items-center gap-1.5 ${
                    selectedCompany === comp
                      ? "gradient-accent text-primary-foreground shadow-sm"
                      : "border border-violet/30 bg-violet/5 text-foreground hover:bg-violet/15"
                  }`}
                >
                  <span>🏢 {comp}</span>
                  <span className="text-[10px] opacity-75">
                    ({allEmailItems.filter((e) => e.recipientCompany === comp).length})
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2-Column Split Mailbox */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
          {/* Left Column: Master Outreach List (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-3 max-h-[750px] overflow-y-auto pr-2">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Showing {filteredEmails.length} Email{filteredEmails.length !== 1 ? "s" : ""}
              </span>
              {filteredEmails.length > 0 && (
                <span className="text-[11px] text-muted-foreground">Click to inspect email</span>
              )}
            </div>

            {filteredEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-dashed border-border bg-card/40">
                <Inbox className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-base font-bold text-foreground">No outreach matches found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try adjusting your search query or company filter.
                </p>
              </div>
            ) : (
              filteredEmails.map((item) => {
                const isSelected = activeEmail?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedEmailId(item.id)}
                    className={`w-full text-left rounded-2xl p-4 transition-all flex flex-col space-y-2 border ${
                      isSelected
                        ? "border-violet/60 bg-violet/10 shadow-md ring-2 ring-violet/20"
                        : "border-border bg-card hover:border-violet/30 hover:bg-secondary/40 shadow-sm"
                    }`}
                  >
                    {/* Top row: Name, Company, Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-base font-bold text-foreground">
                            {item.recipientName}
                          </p>
                          {item.recipientCompany && (
                            <Badge
                              variant="outline"
                              className="border-violet/30 bg-violet/10 text-violet text-[11px] font-bold px-2 py-0 shrink-0"
                            >
                              <Building2 className="mr-1 h-3 w-3" />
                              {item.recipientCompany}
                            </Badge>
                          )}
                        </div>
                        <p className="truncate text-xs font-mono text-muted-foreground mt-0.5">
                          {item.recipientEmail}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5">
                        <StatusBadge status={item.status} />
                      </div>
                    </div>

                    {/* Subject Line Preview */}
                    <p className="truncate text-sm font-semibold text-foreground leading-snug">
                      {item.subject}
                    </p>

                    {/* Date / Timestamp */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="h-3 w-3" />
                        {item.sentAt
                          ? new Date(item.sentAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })
                          : new Date(item.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                      </span>
                      {item.attachmentName && (
                        <span className="flex items-center gap-1 text-[11px] text-violet font-semibold">
                          <Paperclip className="h-3 w-3" /> Resume
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right Column: Full Proper Mail Layout Viewer (7 cols) */}
          <div className="lg:col-span-7">
            {activeEmail ? (
              <div className="surface p-7 rounded-3xl border border-border bg-card/80 space-y-6 shadow-md h-full flex flex-col justify-between">
                <div className="space-y-6">
                  {/* Mail Header Bar */}
                  <div className="flex flex-col gap-4 border-b border-border pb-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        {/* Avatar */}
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-accent text-primary-foreground font-black text-lg shadow-md">
                          {activeEmail.recipientName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h3 className="text-xl font-bold text-foreground">
                              {activeEmail.recipientName}
                            </h3>
                            {activeEmail.recipientCompany && (
                              <Badge
                                variant="outline"
                                className="border-violet/40 bg-violet/10 text-violet text-xs font-bold px-2.5 py-0.5"
                              >
                                <Building2 className="mr-1 h-3.5 w-3.5" />
                                {activeEmail.recipientCompany}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">
                            To: {activeEmail.recipientEmail}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        <StatusBadge status={activeEmail.status} />
                        <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {activeEmail.sentAt
                            ? new Date(activeEmail.sentAt).toLocaleString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })
                            : new Date(activeEmail.createdAt).toLocaleDateString("en-US")}
                        </span>
                      </div>
                    </div>

                    {/* Sender Details */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground bg-secondary/40 p-2.5 rounded-xl border border-border">
                      <span className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground">From:</span> You via Gmail SMTP (ReachOut)
                      </span>
                      <span className="font-semibold text-success flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Direct Inbox Delivery
                      </span>
                    </div>

                    {activeEmail.error && (
                      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-semibold">
                          <AlertTriangle className="h-4 w-4 shrink-0" /> Error: {activeEmail.error}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRetryCampaign(activeEmail.campaignId)}
                          disabled={retrying === activeEmail.campaignId}
                          className="h-7 text-xs border-destructive/40 text-destructive hover:bg-destructive/20 font-bold rounded-lg"
                        >
                          {retrying === activeEmail.campaignId ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <RefreshCw className="h-3 w-3 mr-1" />
                          )}
                          Retry Delivery
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Subject Line Banner */}
                  <div className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-1 shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Subject Line
                    </span>
                    <h4 className="text-lg font-bold text-foreground leading-snug">
                      {activeEmail.subject}
                    </h4>
                  </div>

                  {/* Email Body Content */}
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Delivered Message Body
                    </span>
                    <div
                      className="text-base text-foreground leading-relaxed font-sans max-h-[360px] overflow-y-auto whitespace-pre-wrap pt-2"
                      dangerouslySetInnerHTML={{
                        __html: activeEmail.body.replace(/\n/g, "<br>"),
                      }}
                    />
                  </div>

                  {/* Attached Resume */}
                  {activeEmail.attachmentName && (
                    <div className="flex items-center justify-between rounded-2xl border border-border bg-secondary/40 p-3.5 shadow-sm">
                      <div className="flex items-center gap-2.5 text-sm font-bold text-foreground">
                        <Paperclip className="h-4 w-4 text-violet" />
                        <span>Attachment: {activeEmail.attachmentName}</span>
                      </div>
                      <Badge variant="outline" className="border-violet/30 bg-violet/10 text-violet text-xs font-semibold">
                        PDF (Delivered)
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Quick Actions Footer Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 mt-6">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyBody}
                      className="h-10 px-4 text-xs font-bold rounded-xl border-border hover:bg-secondary"
                    >
                      {copied ? (
                        <Check className="mr-1.5 h-4 w-4 text-success" />
                      ) : (
                        <Copy className="mr-1.5 h-4 w-4" />
                      )}
                      {copied ? "Copied!" : "Copy Email Body"}
                    </Button>
                  </div>

                  <Button
                    asChild
                    size="sm"
                    className="gradient-accent text-primary-foreground h-10 px-5 text-xs font-bold rounded-xl shadow-md hover:opacity-90"
                  >
                    <Link href={`/dashboard/compose?to=${encodeURIComponent(activeEmail.recipientEmail)}`}>
                      <Send className="mr-1.5 h-3.5 w-3.5" /> Follow Up with {activeEmail.recipientName}
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              /* Empty state if no email is selected */
              <div className="surface flex flex-col items-center justify-center p-16 text-center rounded-3xl border border-border h-full">
                <Mail className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-lg font-bold text-foreground">Select an outreach email</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Click on any recipient from the list on the left to view the full email copy and delivery diagnostics.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
