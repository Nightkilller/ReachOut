"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, PenLine, Trash2, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";

export interface CampaignSummary {
  id: string;
  subject: string;
  totalCount: number;
  sentCount: number;
  failedCount: number;
  status: string;
  createdAt: string | Date;
}

export function RecentCampaignsTable({
  initialCampaigns,
}: {
  initialCampaigns: CampaignSummary[];
}) {
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>(initialCampaigns);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this campaign and its records?")) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setCampaigns((prev) => prev.filter((c) => c.id !== id));
        toast.success("Campaign deleted successfully");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete campaign");
      }
    } catch {
      toast.error("Failed to delete campaign");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="surface overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-8 py-5">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-slate-800 dark:text-slate-200" />
          <h2 className="text-lg font-bold text-foreground">Recent Campaigns</h2>
        </div>
        <Link
          href="/dashboard/history"
          className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-3xl bg-secondary text-muted-foreground mb-4">
            <Mail className="h-8 w-8" />
          </div>
          <p className="text-base font-bold text-foreground">No campaigns yet</p>
          <p className="mt-1 text-sm text-muted-foreground max-w-md">
            Compose your first cold email campaign with AI personalization and send directly from Gmail.
          </p>
          <Button asChild className="gradient-accent mt-5 text-sm font-bold text-primary-foreground hover:opacity-90 h-11 px-6 rounded-xl">
            <Link href="/dashboard/compose">
              <PenLine className="mr-2 h-4 w-4" /> Create Campaign
            </Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-base">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border/50">
                <th className="px-8 py-4 font-bold">Subject</th>
                <th className="px-8 py-4 font-bold">Recipients</th>
                <th className="px-8 py-4 font-bold">Status</th>
                <th className="px-8 py-4 font-bold">Date</th>
                <th className="px-8 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {campaigns.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-secondary/40">
                  <td className="max-w-[320px] truncate px-8 py-5 font-semibold text-foreground">
                    <Link href="/dashboard/history" className="hover:underline">
                      {c.subject}
                    </Link>
                  </td>
                  <td className="px-8 py-5 text-sm text-muted-foreground font-medium">
                    {c.sentCount}/{c.totalCount} sent
                  </td>
                  <td className="px-8 py-5">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-8 py-5 text-sm text-muted-foreground font-medium">
                    {new Date(c.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button
                      type="button"
                      title="Delete Campaign"
                      aria-label="Delete Campaign"
                      disabled={deletingId === c.id}
                      onClick={(e) => handleDelete(c.id, e)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                    >
                      {deletingId === c.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
