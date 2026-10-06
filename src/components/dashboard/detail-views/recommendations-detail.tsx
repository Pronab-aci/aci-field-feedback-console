"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Lightbulb,
  ArrowRight,
  ShieldCheck,
  Loader2,
  CircleCheck,
  Activity,
  Filter,
  Eye,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import type {
  Recommendation,
  RecommendationStatus,
} from "@/lib/mock-data";

const STATUSES: RecommendationStatus[] = [
  "proposed",
  "reviewing",
  "in-progress",
  "implemented",
  "monitoring",
];

const statusConfig: Record<
  RecommendationStatus,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    class: string;
  }
> = {
  proposed: {
    label: "Proposed",
    icon: Lightbulb,
    class: "border-amber-500/30 bg-amber-500/10 text-amber-700",
  },
  reviewing: {
    label: "Reviewing",
    icon: Eye,
    class: "border-stone-500/30 bg-stone-500/10 text-stone-600",
  },
  "in-progress": {
    label: "In progress",
    icon: Loader2,
    class: "border-primary/30 bg-primary/10 text-primary",
  },
  implemented: {
    label: "Implemented",
    icon: CircleCheck,
    class: "border-emerald-600/30 bg-emerald-600/10 text-emerald-700",
  },
  monitoring: {
    label: "Monitoring",
    icon: Activity,
    class: "border-teal-600/30 bg-teal-600/10 text-teal-700",
  },
};

const impactClass: Record<string, string> = {
  high: "bg-primary text-primary-foreground",
  medium: "bg-primary/15 text-primary",
  low: "bg-muted text-muted-foreground",
};

const effortClass: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-amber-500/10 text-amber-700",
  low: "bg-primary/10 text-primary",
};

export function RecommendationsDetailView() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [generating, setGenerating] = useState(false);

  const generateRecommendations = useCallback(async () => {
    setGenerating(true);
    try {
      const response = await fetch("/api/recommendations", { method: "POST" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Could not generate recommendations.");
      }
      setRecommendations(data.recommendations);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not reach Gemini."
      );
    } finally {
      setGenerating(false);
    }
  }, []);

  const [status, setStatus] = useState<RecommendationStatus | "all">("all");

  const filtered = useMemo(() => {
    if (status === "all") return recommendations;
    return recommendations.filter((r) => r.status === status);
  }, [recommendations, status]);

  const summary = useMemo(() => {
    const byStatus = (s: RecommendationStatus) =>
      recommendations.filter((r) => r.status === s).length;
    const highImpact = recommendations.filter((r) => r.impact === "high").length;
    return {
      total: recommendations.length,
      proposed: byStatus("proposed"),
      inProgress: byStatus("in-progress"),
      implemented: byStatus("implemented"),
      highImpact,
    };
  }, [recommendations]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Lightbulb className="h-5 w-5 text-primary" />
          Recommendations Generated
        </h2>
        <p className="text-sm text-muted-foreground">
          Generate prioritized Gemini actions grounded in field feedback and
          traceable to the supporting submissions.
        </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void generateRecommendations()}
          disabled={generating}
          className="mt-2 gap-2 sm:mt-0"
        >
          <RefreshCw className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
          {generating ? "Generating…" : "Generate with Gemini"}
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total", value: summary.total, icon: Lightbulb, tone: "primary" },
          { label: "Proposed", value: summary.proposed, icon: Lightbulb, tone: "muted" },
          { label: "In progress", value: summary.inProgress, icon: Loader2, tone: "muted" },
          { label: "High impact", value: summary.highImpact, icon: ShieldCheck, tone: "primary" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-border bg-card">
              <CardContent className="flex items-center gap-3 p-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    s.tone === "primary" ? "bg-primary/10" : "bg-muted"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      s.tone === "primary" ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-xl font-semibold text-foreground">
                    {s.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          Filter by status:
        </span>
        {(["all", ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-all ${
              status === s
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary"
            }`}
          >
            {s === "all" ? "All" : statusConfig[s].label}
          </button>
        ))}
      </div>

      {/* Recommendation cards */}
      {generating && recommendations.length === 0 && (
        <Card className="border-border bg-card">
          <CardContent className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating recommendations from field feedback…
          </CardContent>
        </Card>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filtered.map((r, i) => {
          const StatusIcon = statusConfig[r.status].icon;
          return (
            <Card
              key={r.id}
              className="group flex flex-col border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 font-mono text-sm font-semibold text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <Badge
                    variant="outline"
                    className={`gap-1 ${statusConfig[r.status].class}`}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {statusConfig[r.status].label}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      impactClass[r.impact]
                    }`}
                  >
                    {r.impact} impact
                  </span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      effortClass[r.effort]
                    }`}
                  >
                    {r.effort} effort
                  </span>
                </div>
              </div>

              <h3 className="mt-3 text-base font-semibold text-foreground">
                {r.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {r.description}
              </p>

              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-md bg-muted px-2 py-0.5 font-medium text-foreground/80">
                  {r.category}
                </span>
                <span>·</span>
                <span>Owner: {r.owner}</span>
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3">
                <span className="text-xs text-muted-foreground">
                  Source: {r.sourceFeedbackIds.length} feedback
                  {r.sourceFeedbackIds.length === 1 ? "" : "s"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-primary hover:bg-primary/10 hover:text-primary"
                >
                  Trace sources
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card className="col-span-full border-dashed border-border bg-card">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              {generating
                ? "Gemini is analyzing the feedback…"
                : "Generate recommendations with Gemini to see evidence-based actions here."}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
