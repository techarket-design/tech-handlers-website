import { useMemo, useState } from "react";
import LeadDeliveryMonitor from "@/components/admin/LeadDeliveryMonitor";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Search, Inbox, Mail, Phone, Download } from "lucide-react";
import { useAdminLeads } from "@/hooks/useData";
import { format, formatDistanceToNowStrict } from "date-fns";

const statusColors: Record<string, string> = {
  new: "bg-primary/10 text-primary",
  contacted: "bg-blue-100 text-blue-700",
  qualified: "bg-accent/10 text-accent",
  converted: "bg-green-100 text-green-700",
  lost: "bg-destructive/10 text-destructive",
};

export default function FormSubmissions() {
  const { isAdmin } = useAuth();
  const { data: leads = [], isLoading } = useAdminLeads();
  const [search, setSearch] = useState("");

  const submissions = useMemo(() => {
    const rows = (leads as any[]).filter(
      (l) => ["website", "hero_form", "contact_form", "service_form", "city_page_form"].includes(l.source ?? "website") && !l.is_archived
    );
    const q = search.trim().toLowerCase();
    const filtered = q
      ? rows.filter((l) =>
          [l.name, l.email, l.phone, l.message, l.service_interest]
            .filter(Boolean)
            .some((v: string) => v.toLowerCase().includes(q))
        )
      : rows;
    return filtered.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [leads, search]);

  const exportCsv = () => {
    const headers = ["Date", "Name", "Email", "Phone", "Service", "Message", "Status"];
    const rows = submissions.map((l: any) => [
      new Date(l.created_at).toISOString(),
      l.name || "",
      l.email || "",
      l.phone || "",
      l.service_interest || "",
      (l.message || "").replace(/\n/g, " "),
      l.status || "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `form-submissions-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-lead">Form Submissions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Every lead captured through forms on your website.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, message…"
              className="pl-9 w-64"
            />
          </div>
          <Button variant="outline" onClick={exportCsv} disabled={!submissions.length}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      {isAdmin && <LeadDeliveryMonitor />}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total" value={submissions.length} />
        <StatCard
          label="New"
          value={submissions.filter((l: any) => l.status === "new").length}
        />
        <StatCard
          label="This week"
          value={
            submissions.filter(
              (l: any) =>
                Date.now() - new Date(l.created_at).getTime() < 7 * 864e5
            ).length
          }
        />
        <StatCard
          label="Today"
          value={
            submissions.filter(
              (l: any) =>
                new Date(l.created_at).toDateString() === new Date().toDateString()
            ).length
          }
        />
      </div>

      <div className="rounded-xl border border-border bg-surface-white overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Loading submissions…</div>
        ) : submissions.length === 0 ? (
          <div className="p-10 text-center">
            <Inbox className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No form submissions yet.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Submitted</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Attribution</TableHead><TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((l: any) => (
                <TableRow key={l.id} className="hover:bg-muted/40">
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDistanceToNowStrict(new Date(l.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="font-medium text-lead">{l.name || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5 text-xs">
                      {l.email && (
                        <a href={`mailto:${l.email}`} className="flex items-center gap-1 text-muted-foreground hover:text-primary">
                          <Mail className="h-3 w-3" /> {l.email}
                        </a>
                      )}
                      {l.phone && (
                        <a href={`tel:${l.phone}`} className="flex items-center gap-1 text-muted-foreground hover:text-primary">
                          <Phone className="h-3 w-3" /> {l.phone}
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">{l.service_interest || "—"}</TableCell>
                  <TableCell className="text-xs">{l.attribution?.first_touch?.utm_source || l.attribution?.first_touch?.referrer_origin || "Direct / unavailable"}<br />{l.attribution?.submission_path || l.source}</TableCell>
                  <TableCell className="max-w-sm">
                    <p className="text-xs text-muted-foreground line-clamp-2">{l.message || "—"}</p>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[l.status] || ""} variant="secondary">
                      {l.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/admin/leads/${l.id}`}>
                        <Eye className="h-4 w-4 mr-1" /> Open
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface-white p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-lead">{value}</p>
    </div>
  );
}
