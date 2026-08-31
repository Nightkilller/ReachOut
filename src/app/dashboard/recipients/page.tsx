"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Plus,
  Search,
  Upload,
  UserPlus,
  Trash2,
  Building2,
  CheckCircle2,
  Loader2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getCompanyFromEmail, inferNameFromEmail } from "@/lib/company-lookup";

interface Recipient {
  id: string;
  name: string | null;
  email: string;
  company: string | null;
  createdAt: string;
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function RecipientsPage() {
  const [list, setList] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  // Add recipient dialog state
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);

  // CSV file ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchRecipients = useCallback(async () => {
    try {
      const res = await fetch("/api/recipients");
      if (res.ok) {
        const data = await res.json();
        setList(data);
      }
    } catch {
      toast.error("Failed to load recipients");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipients();
  }, [fetchRecipients]);

  const detectedCompany = useMemo(() => {
    if (!email || !isValidEmail(email)) return null;
    return getCompanyFromEmail(email);
  }, [email]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) =>
      [r.name || "", r.email, r.company || ""].some((v) => v.toLowerCase().includes(q)),
    );
  }, [list, query]);

  const handleAdd = async () => {
    if (!isValidEmail(email)) {
      toast.error("Please enter a valid email");
      return;
    }

    setAdding(true);
    try {
      const detected = getCompanyFromEmail(email);
      const res = await fetch("/api/recipients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || inferNameFromEmail(email),
          company: detected || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Recipient added successfully!", {
          description: detected ? `Detected: ${detected}` : undefined,
        });
        setName("");
        setEmail("");
        setOpen(false);
        fetchRecipients();
      } else {
        toast.error(data.error || "Failed to add recipient");
      }
    } catch {
      toast.error("Failed to add recipient");
    } finally {
      setAdding(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    const text = await file.text();
    toast.info(`Importing ${file.name}...`);

    try {
      const res = await fetch("/api/recipients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: text }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Imported ${data.added} recipient(s) from ${file.name}`);
        fetchRecipients();
      } else {
        toast.error(data.error || "Failed to import CSV");
      }
    } catch {
      toast.error("Failed to import CSV");
    }
  };

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    setDeleting(true);

    try {
      const res = await fetch("/api/recipients", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Deleted ${data.deleted} recipient(s)`);
        setSelected(new Set());
        fetchRecipients();
      } else {
        toast.error(data.error || "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete recipients");
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length && filtered.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((r) => r.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  return (
    <div className="space-y-8 w-full">
      <PageHeader
        title="Recipients"
        description="Everyone in your outreach address book with auto-detected companies."
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Large Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or company..."
            className="pl-12 bg-secondary/30 h-12 text-base rounded-2xl font-medium"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {selected.size > 0 && (
            <Button
              variant="destructive"
              onClick={handleDeleteSelected}
              disabled={deleting}
              className="h-12 px-5 text-sm font-bold rounded-2xl"
            >
              {deleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete ({selected.size})
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="h-12 px-5 text-sm font-bold rounded-2xl border-border"
          >
            <Upload className="mr-2 h-4 w-4" /> Import CSV
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileUpload(f);
            }}
          />

          {/* Add Recipient Dialog */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-accent text-primary-foreground h-12 px-6 text-sm font-bold rounded-2xl hover:opacity-90 shadow-md">
                <Plus className="mr-2 h-4 w-4" /> Add Recipient
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong sm:max-w-lg rounded-3xl p-7">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Add Recipient</DialogTitle>
                <DialogDescription className="text-sm">
                  Company is detected automatically from their email domain.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5 py-3">
                <div className="space-y-2">
                  <Label htmlFor="r-name" className="text-sm font-bold">Name (Optional)</Label>
                  <Input
                    id="r-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ananya Rao"
                    className="h-12 text-base rounded-2xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="r-email" className="text-sm font-bold">Email Address</Label>
                  <Input
                    id="r-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hr@tcs.com"
                    className="h-12 text-base rounded-2xl"
                  />
                  {detectedCompany && (
                    <p className="text-sm text-violet font-bold flex items-center gap-2 mt-2">
                      <Building2 className="h-4 w-4" />
                      🏢 Detected: {detectedCompany}
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleAdd}
                  disabled={adding || !email}
                  className="gradient-accent text-primary-foreground h-12 px-6 font-bold rounded-2xl hover:opacity-90"
                >
                  {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Add Recipient
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table Container */}
      <div className="surface overflow-hidden">
        {loading ? (
          <div className="flex h-72 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-violet" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-3xl bg-primary/10 text-primary">
              <UserPlus className="h-8 w-8" />
            </span>
            <p className="text-base font-bold text-foreground">
              {query ? `No recipients match “${query}”` : "No recipients in address book"}
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              Add someone new or import a CSV file to build your outreach list.
            </p>
            <Button
              onClick={() => setOpen(true)}
              className="gradient-accent text-primary-foreground font-bold h-11 px-6 rounded-xl hover:opacity-90 mt-3"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Recipient
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-base">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border/60">
                  <th className="px-6 py-4 w-12">
                    <Checkbox
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-4 font-bold">Name</th>
                  <th className="px-6 py-4 font-bold">Email</th>
                  <th className="px-6 py-4 font-bold">Company</th>
                  <th className="px-6 py-4 font-bold text-right">Date Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-secondary/40">
                    <td className="px-6 py-4">
                      <Checkbox
                        checked={selected.has(r.id)}
                        onCheckedChange={() => toggleSelect(r.id)}
                      />
                    </td>
                    <td className="px-6 py-4 font-bold text-foreground">
                      {r.name || r.email.split("@")[0]}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-mono text-sm">
                      {r.email}
                    </td>
                    <td className="px-6 py-4">
                      {r.company ? (
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-violet/10 border border-violet/20 px-3 py-1 text-sm text-violet font-bold">
                          <Building2 className="h-3.5 w-3.5" />
                          {r.company}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-muted-foreground font-medium">
                      {new Date(r.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
