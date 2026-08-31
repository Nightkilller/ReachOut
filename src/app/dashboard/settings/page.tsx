"use client";

import { useState, useEffect, type ReactNode } from "react";
import {
  User,
  Mail,
  ShieldCheck,
  Sparkles,
  Key,
  Eye,
  EyeOff,
  Loader2,
  Save,
  CheckCircle2,
  Briefcase,
  Globe,
  Link2,
  Code2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function Section({
  title,
  icon,
  description,
  children,
  onSave,
  saving,
}: {
  title: string;
  icon: ReactNode;
  description: string;
  children: ReactNode;
  onSave?: () => void;
  saving?: boolean;
}) {
  return (
    <section className="surface p-8 space-y-6">
      <div className="flex min-w-0 items-center justify-between border-b border-border pb-5">
        <div className="flex items-center gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            {icon}
          </span>
          <div>
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
      </div>

      <div className="space-y-5">{children}</div>

      {onSave && (
        <div className="flex justify-end pt-3">
          <Button
            onClick={onSave}
            disabled={saving}
            className="gradient-accent text-primary-foreground h-12 px-6 text-sm font-bold rounded-2xl hover:opacity-90 shadow-md"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      )}
    </section>
  );
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);

  // SMTP state
  const [smtpEmail, setSmtpEmail] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [hasExistingSmtp, setHasExistingSmtp] = useState(false);
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Profile state
  const [savingProfile, setSavingProfile] = useState(false);
  const [profile, setProfile] = useState({
    fullName: "",
    currentRole: "",
    skills: "",
    bio: "",
    targetRoles: "",
    portfolioUrl: "",
    linkedinUrl: "",
    githubUrl: "",
    defaultGoal: "internship",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [profileRes, smtpRes] = await Promise.all([
          fetch("/api/profile"),
          fetch("/api/smtp"),
        ]);

        if (profileRes.ok) {
          const data = await profileRes.json();
          setProfile({
            fullName: data.fullName || "",
            currentRole: data.currentRole || "",
            skills: data.skills || "",
            bio: data.bio || "",
            targetRoles: data.targetRoles || "",
            portfolioUrl: data.portfolioUrl || "",
            linkedinUrl: data.linkedinUrl || "",
            githubUrl: data.githubUrl || "",
            defaultGoal: data.defaultGoal || "internship",
          });
        }

        if (smtpRes.ok) {
          const sData = await smtpRes.json();
          if (sData.smtpEmail) {
            setSmtpEmail(sData.smtpEmail);
            setHasExistingSmtp(sData.hasPassword);
          }
        }
      } catch {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleTestSmtp = async () => {
    if (!smtpEmail || !smtpPassword) {
      toast.error("Enter both email and App Password to test");
      return;
    }

    setTestingSmtp(true);
    try {
      const res = await fetch("/api/smtp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: smtpEmail, password: smtpPassword }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("✅ Gmail SMTP connection successful!");
      } else {
        toast.error(data.error || "Connection failed — check credentials");
      }
    } catch {
      toast.error("Failed to test connection");
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleSaveSmtp = async () => {
    if (!smtpEmail || !smtpPassword) {
      toast.error("Enter both email and App Password");
      return;
    }

    setSavingSmtp(true);
    try {
      const res = await fetch("/api/smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: smtpEmail, password: smtpPassword }),
      });

      if (res.ok) {
        setHasExistingSmtp(true);
        setSmtpPassword("");
        toast.success("Gmail SMTP credentials encrypted and saved! 🔒");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save SMTP config");
      }
    } catch {
      toast.error("Failed to save SMTP config");
    } finally {
      setSavingSmtp(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (res.ok) {
        toast.success("Profile saved! AI will use this to draft emails.");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save profile");
      }
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet" />
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full max-w-5xl">
      <PageHeader
        title="Settings"
        description="Configure Gmail SMTP sending and your AI personalization profile."
      />

      <div className="grid gap-8">
        {/* Gmail SMTP Configuration */}
        <Section
          title="Gmail SMTP Configuration"
          description="Send emails directly from your Gmail account securely via App Password."
          icon={<Mail className="h-5 w-5" />}
        >
          {hasExistingSmtp && (
            <div className="flex items-center gap-3 rounded-2xl bg-success/10 border border-success/20 p-4 text-sm text-success font-bold">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              <span>Gmail SMTP is connected and ready to send.</span>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="smtp-email" className="text-sm font-bold">Gmail Address</Label>
              <Input
                id="smtp-email"
                type="email"
                placeholder="your.email@gmail.com"
                value={smtpEmail}
                onChange={(e) => setSmtpEmail(e.target.value)}
                className="h-12 text-base rounded-2xl font-medium"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp-pass" className="text-sm font-bold">
                16-Character App Password
                {hasExistingSmtp && (
                  <span className="text-xs text-muted-foreground ml-2 font-normal">
                    (leave blank to keep current)
                  </span>
                )}
              </Label>
              <div className="relative">
                <Input
                  id="smtp-pass"
                  type={showPassword ? "text" : "password"}
                  placeholder={hasExistingSmtp ? "••••••••••••••••" : "abcd efgh ijkl mnop"}
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                  className="pr-12 h-12 text-base rounded-2xl font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestSmtp}
              disabled={testingSmtp || !smtpEmail || !smtpPassword}
              className="h-11 px-5 text-sm font-bold rounded-2xl border-border"
            >
              {testingSmtp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Test Connection
            </Button>
            <Button
              type="button"
              onClick={handleSaveSmtp}
              disabled={savingSmtp || !smtpEmail || !smtpPassword}
              className="gradient-accent text-primary-foreground h-11 px-6 text-sm font-bold rounded-2xl hover:opacity-90 shadow-md"
            >
              {savingSmtp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              Save SMTP Credentials
            </Button>
          </div>

          <div className="rounded-2xl border border-border/80 bg-secondary/30 p-4 text-xs text-muted-foreground space-y-1.5 leading-relaxed">
            <p className="font-bold text-foreground text-sm">💡 How to get a Gmail App Password:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Turn ON <strong>2-Step Verification</strong> on your Google Account.</li>
              <li>Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-violet underline font-semibold">myaccount.google.com/apppasswords</a>.</li>
              <li>Generate an App Password (name it &quot;ReachOut&quot;) and paste the 16 characters above.</li>
            </ol>
          </div>
        </Section>

        {/* Sender Profile */}
        <Section
          title="Sender Profile &amp; Identity"
          description="The AI highlights your specific strengths and background tailored per company."
          icon={<User className="h-5 w-5" />}
          onSave={handleSaveProfile}
          saving={savingProfile}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="p-name" className="text-sm font-bold">Full Name</Label>
              <Input
                id="p-name"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                placeholder="e.g. Aditya Gupta"
                className="h-12 text-base rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-role" className="text-sm font-bold">Current Status / Role</Label>
              <Input
                id="p-role"
                value={profile.currentRole}
                onChange={(e) => setProfile({ ...profile, currentRole: e.target.value })}
                placeholder="e.g. 3rd Year CS Student / Full Stack Developer"
                className="h-12 text-base rounded-2xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="p-target" className="text-sm font-bold">Target Roles</Label>
            <Input
              id="p-target"
              value={profile.targetRoles}
              onChange={(e) => setProfile({ ...profile, targetRoles: e.target.value })}
              placeholder="e.g. Software Development Engineer (SDE) Intern"
              className="h-12 text-base rounded-2xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="p-skills" className="text-sm font-bold">Key Skills &amp; Tech Stack</Label>
            <Input
              id="p-skills"
              value={profile.skills}
              onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
              placeholder="e.g. React, Next.js, Node.js, TypeScript, Python, AWS, Docker"
              className="h-12 text-base rounded-2xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="p-bio" className="text-sm font-bold">Brief Bio / Key Achievements</Label>
            <Textarea
              id="p-bio"
              rows={4}
              className="resize-none text-base p-4 rounded-2xl leading-relaxed"
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="e.g. Built high-traffic fullstack apps, won hackathons, passionate about scalable backend systems."
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-3 pt-2">
            <div className="space-y-2">
              <Label htmlFor="p-portfolio" className="text-sm font-bold flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-muted-foreground" /> Portfolio
              </Label>
              <Input
                id="p-portfolio"
                value={profile.portfolioUrl}
                onChange={(e) => setProfile({ ...profile, portfolioUrl: e.target.value })}
                placeholder="https://yourportfolio.com"
                className="h-12 text-base rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-linkedin" className="text-sm font-bold flex items-center gap-1.5">
                <Link2 className="h-4 w-4 text-muted-foreground" /> LinkedIn
              </Label>
              <Input
                id="p-linkedin"
                value={profile.linkedinUrl}
                onChange={(e) => setProfile({ ...profile, linkedinUrl: e.target.value })}
                placeholder="https://linkedin.com/in/..."
                className="h-12 text-base rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-github" className="text-sm font-bold flex items-center gap-1.5">
                <Code2 className="h-4 w-4 text-muted-foreground" /> GitHub
              </Label>
              <Input
                id="p-github"
                value={profile.githubUrl}
                onChange={(e) => setProfile({ ...profile, githubUrl: e.target.value })}
                placeholder="https://github.com/..."
                className="h-12 text-base rounded-2xl"
              />
            </div>
          </div>
        </Section>

        {/* AI Configuration Info */}
        <Section
          title="AI Generation Engine"
          description="AI generation is powered by Groq (LLaMA 3.3 70B / 120B) or Google Gemini."
          icon={<Key className="h-5 w-5" />}
        >
          <div className="rounded-2xl border border-violet/20 bg-violet/5 p-5 text-sm text-foreground space-y-2">
            <p className="font-bold text-violet">🔑 API Keys Configuration:</p>
            <p className="text-muted-foreground leading-relaxed">
              Ensure <code className="rounded-lg bg-secondary px-2 py-0.5 text-violet font-bold">GROQ_API_KEY</code> or <code className="rounded-lg bg-secondary px-2 py-0.5 text-violet font-bold">GEMINI_API_KEY</code> is configured in your <code className="rounded-lg bg-secondary px-2 py-0.5 font-mono">.env</code> file.
            </p>
          </div>
        </Section>
      </div>
    </div>
  );
}
