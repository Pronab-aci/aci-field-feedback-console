"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquareText,
  Users,
  Package,
  Lightbulb,
  ArrowUpRight,
  CheckCircle2,
  CircleSlash,
} from "lucide-react";
import { useDashboardStore, type ViewId } from "@/lib/store";
import type { DashboardSummary } from "@/lib/mock-data";

interface StatCardsProps {
  summary: DashboardSummary;
}

export function StatCards({ summary }: StatCardsProps) {
  const { setView } = useDashboardStore();

  const submittedPct =
    summary.totalFieldForces > 0
      ? Math.round((summary.submittedFieldForces / summary.totalFieldForces) * 100)
      : 0;

  const cards: Array<{
    id: ViewId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
    value: string;
    sub?: React.ReactNode;
    footer: string;
  }> = [
    {
      id: "feedbacks",
      label: "Submitted Feedbacks",
      icon: MessageSquareText,
      accent: "text-primary",
      value: String(summary.totalFeedbacks),
      sub: (
        <span className="text-xs text-muted-foreground">
          {summary.sentimentBreakdown.positive} positive ·{" "}
          {summary.sentimentBreakdown.neutral} neutral ·{" "}
          {summary.sentimentBreakdown.negative} negative
        </span>
      ),
      footer: "View all feedback records",
    },
    {
      id: "field-force",
      label: "Field Force Participation",
      icon: Users,
      accent: "text-primary",
      value: `${summary.submittedFieldForces}/${summary.totalFieldForces}`,
      sub: (
        <div className="mt-2 w-full">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-primary" />
              {summary.submittedFieldForces} submitted
            </span>
            <span className="inline-flex items-center gap-1">
              <CircleSlash className="h-3 w-3 text-muted-foreground/60" />
              {summary.notSubmittedFieldForces} pending
            </span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${submittedPct}%` }}
            />
          </div>
          <p className="mt-1 text-xs font-medium text-foreground/70">
            {submittedPct}% participation rate
          </p>
        </div>
      ),
      footer: "Break down by field officer",
    },
    {
      id: "products",
      label: "Products Mentioned",
      icon: Package,
      accent: "text-primary",
      value: String(summary.productsMentioned),
      sub: (
        <span className="text-xs text-muted-foreground">
          across {summary.categoryBreakdown.length} issue categories
        </span>
      ),
      footer: "See product mentions & sentiment",
    },
    {
      id: "recommendations",
      label: "Recommendations Generated",
      icon: Lightbulb,
      accent: "text-primary",
      value: String(summary.recommendationsCount),
      sub: (
        <Badge
          variant="outline"
          className="mt-1 border-primary/30 bg-primary/5 text-primary"
        >
          AI-assisted synthesis
        </Badge>
      ),
      footer: "Review proposed actions",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card
            key={c.id}
            role="button"
            tabIndex={0}
            onClick={() => setView(c.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setView(c.id);
              }
            }}
            className="group relative cursor-pointer overflow-hidden border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {/* top accent line */}
            <div className="absolute inset-x-0 top-0 h-1 bg-primary/0 transition-colors group-hover:bg-primary" />
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <Icon className={`h-5 w-5 ${c.accent}`} />
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground">
                {c.label}
              </p>
              <p className="mt-1 font-mono text-3xl font-semibold tracking-tight text-foreground">
                {c.value}
              </p>
              <div className="mt-2 min-h-[2.5rem]">{c.sub}</div>
            </div>
            <div className="mt-3 border-t border-border/60 pt-3">
              <p className="text-xs font-medium text-primary/80 transition-colors group-hover:text-primary">
                {c.footer} →
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
