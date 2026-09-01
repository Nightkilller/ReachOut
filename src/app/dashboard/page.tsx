import { getDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Send,
  TrendingUp,
  Layers,
  Users,
  AlertTriangle,
  PenLine,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { RecentCampaignsTable } from "@/components/recent-campaigns-table";

export default async function DashboardPage() {
  const user = await getDbUser();

  let hasSmtpConfig = false;
  let recipientCount = 0;
  let campaignCount = 0;
  let totalSent = 0;
  let totalFailed = 0;
  let recentCampaigns: {
    id: string;
    subject: string;
    totalCount: number;
    sentCount: number;
    failedCount: number;
    status: string;
    createdAt: Date;
  }[] = [];

  if (user?.id) {
    const [dbUser, recCount, campaigns] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: { smtpEmail: true, smtpPassword: true },
      }),
      prisma.recipient.count({
        where: { userId: user.id },
      }),
      prisma.campaign.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          subject: true,
          totalCount: true,
          sentCount: true,
          failedCount: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    hasSmtpConfig = !!(dbUser?.smtpEmail && dbUser?.smtpPassword);
    recipientCount = recCount;
    campaignCount = campaigns.length;
    recentCampaigns = campaigns;
    totalSent = campaigns.reduce((sum, c) => sum + c.sentCount, 0);
    totalFailed = campaigns.reduce((sum, c) => sum + c.failedCount, 0);
  }

  const successRate =
    totalSent + totalFailed > 0
      ? `${Math.round((totalSent / (totalSent + totalFailed)) * 100)}%`
      : totalSent > 0
      ? "100%"
      : "100%";

  const STATS = [
    {
      label: "Total Sent",
      value: totalSent.toLocaleString(),
      icon: Send,
      note: totalSent > 0 ? "Emails delivered" : "Ready to send",
      tint: "tint-sky",
    },
    {
      label: "Success Rate",
      value: successRate,
      icon: TrendingUp,
      note: totalFailed === 0 ? "Zero delivery errors" : `${totalFailed} failed`,
      tint: "tint-mint",
    },
    {
      label: "Campaigns",
      value: campaignCount.toString(),
      icon: Layers,
      note: campaignCount > 0 ? "Outreach campaigns" : "No campaigns yet",
      tint: "tint-lilac",
    },
    {
      label: "Recipients",
      value: recipientCount.toString(),
      icon: Users,
      note: `${recipientCount} in address book`,
      tint: "tint-butter",
    },
  ];

  return (
    <div className="space-y-8 w-full">
      <PageHeader
        title={<>Welcome back, {user?.name?.split(" ")[0] || "there"}</>}
        description="Here's how your cold email outreach is performing today."
        action={
          <Button asChild className="gradient-accent text-primary-foreground shadow-lg hover:opacity-90 h-12 px-6 text-base font-bold rounded-2xl">
            <Link href="/dashboard/compose">
              <PenLine className="mr-2.5 h-5 w-5" /> Compose Outreach
            </Link>
          </Button>
        }
      />

      {/* Gmail SMTP Status Alert */}
      {!hasSmtpConfig && (
        <div className="flex items-center justify-between gap-4 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-4">
            <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0" />
            <div>
              <p className="text-base font-bold">Gmail SMTP not configured</p>
              <p className="text-sm opacity-80 mt-0.5">
                Add your Gmail Address &amp; App Password in Settings to send emails directly.
              </p>
            </div>
          </div>
          <Button asChild size="lg" variant="outline" className="shrink-0 border-amber-500/40 hover:bg-amber-500/20 text-sm font-semibold rounded-xl">
            <Link href="/dashboard/settings">Configure Now</Link>
          </Button>
        </div>
      )}

      {/* 4 Large Pastel Stat Cards */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((s, i) => (
          <div
            key={s.label}
            style={{ animationDelay: `${i * 60}ms` }}
            className={`${s.tint} gradient-ring animate-fade-up rounded-[2rem] p-7 shadow-sm flex flex-col justify-between min-h-[180px]`}
          >
            <div className="flex items-start justify-between">
              <span className="text-base font-bold text-foreground/80">{s.label}</span>
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-card/80 text-foreground shadow-sm">
                <s.icon className="h-5 w-5" />
              </span>
            </div>
            <div>
              <p className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">{s.value}</p>
              <p className="mt-2 text-sm font-medium text-foreground/65">{s.note}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Campaigns Section with Delete Action */}
      <RecentCampaignsTable initialCampaigns={recentCampaigns} />
    </div>
  );
}
