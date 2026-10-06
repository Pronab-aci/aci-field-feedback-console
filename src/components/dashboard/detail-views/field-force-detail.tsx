"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  CheckCircle2,
  CircleSlash,
  Search,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import type { FieldForce } from "@/lib/mock-data";

export function FieldForceDetailView({
  fieldForces,
}: {
  fieldForces: FieldForce[];
}) {
  const [tab, setTab] = useState<"all" | "submitted" | "pending">("all");
  const [query, setQuery] = useState("");

  const stats = useMemo(() => {
    const submitted = fieldForces.filter((f) => f.submitted).length;
    const pending = fieldForces.length - submitted;
    const rate = fieldForces.length
      ? Math.round((submitted / fieldForces.length) * 100)
      : 0;
    return { submitted, pending, total: fieldForces.length, rate };
  }, [fieldForces]);

  const regionStats = useMemo(() => {
    const map = new Map<string, { total: number; submitted: number }>();
    fieldForces.forEach((f) => {
      const cur = map.get(f.region) ?? { total: 0, submitted: 0 };
      cur.total += 1;
      if (f.submitted) cur.submitted += 1;
      map.set(f.region, cur);
    });
    return Array.from(map.entries())
      .map(([region, s]) => ({ region, ...s }))
      .sort((a, b) => a.region.localeCompare(b.region));
  }, [fieldForces]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return fieldForces.filter((f) => {
      if (tab === "submitted" && !f.submitted) return false;
      if (tab === "pending" && f.submitted) return false;
      if (q && !`${f.name} ${f.region}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [fieldForces, tab, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Users className="h-5 w-5 text-primary" />
          Field Force Participation
        </h2>
        <p className="text-sm text-muted-foreground">
          Who has submitted feedback this cycle, who hasn&apos;t, and where the
          gaps sit by region.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">
                {stats.submitted}
              </p>
              <p className="text-xs text-muted-foreground">Submitted feedback</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
              <CircleSlash className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">
                {stats.pending}
              </p>
              <p className="text-xs text-muted-foreground">Not yet submitted</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">
                {stats.rate}%
              </p>
              <p className="text-xs text-muted-foreground">
                Participation rate · {stats.total} officers
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Region breakdown */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Participation by Region</CardTitle>
          <CardDescription>
            Where the submission gap is concentrated
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {regionStats.map((r) => {
            const pct = r.total ? Math.round((r.submitted / r.total) * 100) : 0;
            return (
              <div key={r.region} className="flex items-center gap-3">
                <div className="w-32 shrink-0 text-sm font-medium text-foreground">
                  {r.region}
                </div>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="w-24 shrink-0 text-right text-xs text-muted-foreground">
                  {r.submitted}/{r.total} · {pct}%
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Officer table */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Field Officer Roster</CardTitle>
              <CardDescription>
                {filtered.length} of {fieldForces.length} officers shown
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search officer or region…"
                  className="h-9 w-full pl-9 sm:w-56"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "submitted", "pending"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-all ${
                  tab === t
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary"
                }`}
              >
                {t === "all" ? "All" : t}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="custom-scrollbar max-h-[560px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="min-w-[180px]">Officer</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead className="text-right">Submissions</TableHead>
                  <TableHead>Last submission</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {f.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{f.name}</p>
                          <p className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-0.5">
                              <Mail className="h-3 w-3" />
                              {f.id}@aci.local
                            </span>
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-sm text-foreground">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        {f.region}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {f.totalSubmitted}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {f.lastSubmissionDate ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {f.submitted ? (
                        <Badge className="bg-primary/10 text-primary">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Submitted
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-amber-500/30 bg-amber-500/10 text-amber-700"
                        >
                          <Phone className="mr-1 h-3 w-3" />
                          Follow up
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No officers match the current filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
