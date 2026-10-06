"use client";

import { useState, useMemo } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, MessageSquareText, MapPin, Package } from "lucide-react";
import type {
  Feedback,
  FeedbackCategory,
  FeedbackSentiment,
  FeedbackStatus,
  Product,
} from "@/lib/mock-data";

const CATEGORIES: FeedbackCategory[] = [
  "Product Feedback",
  "Product Issues",
  "Experience Feedback",
  "General Feedback",
  "Service Feedback",
  "Process Issues",
  "Service Issues",
];
const SENTIMENTS: FeedbackSentiment[] = ["positive", "neutral", "negative"];
const STATUSES: FeedbackStatus[] = ["new", "reviewing", "actioned", "closed"];

const sentimentClass: Record<FeedbackSentiment, string> = {
  positive: "border-primary/30 bg-primary/10 text-primary",
  neutral: "border-muted-foreground/30 bg-muted text-muted-foreground",
  negative: "border-destructive/30 bg-destructive/10 text-destructive",
};

const statusClass: Record<FeedbackStatus, string> = {
  new: "border-amber-500/30 bg-amber-500/10 text-amber-700",
  reviewing: "border-stone-500/30 bg-stone-500/10 text-stone-600",
  actioned: "border-primary/30 bg-primary/10 text-primary",
  closed: "border-muted-foreground/30 bg-muted text-muted-foreground",
};

export function FeedbackDetailView({
  feedbacks,
  products,
}: {
  feedbacks: Feedback[];
  products: Product[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sentiment, setSentiment] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const productMap = useMemo(() => {
    const m = new Map<string, Product>();
    products.forEach((p) => m.set(p.id, p));
    return m;
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return feedbacks.filter((f) => {
      if (category !== "all" && f.category !== category) return false;
      if (sentiment !== "all" && f.sentiment !== sentiment) return false;
      if (status !== "all" && f.status !== status) return false;
      if (q) {
        const hay = `${f.summary} ${f.detail} ${f.fieldForceName} ${f.region} ${f.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [feedbacks, query, category, sentiment, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <MessageSquareText className="h-5 w-5 text-primary" />
          Feedback Records
        </h2>
        <p className="text-sm text-muted-foreground">
          Every feedback submitted by field forces, with category, sentiment and
          status. Filter or search to drill in.
        </p>
      </div>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">All Feedback</CardTitle>
          <CardDescription>
            {filtered.length} of {feedbacks.length} records shown
          </CardDescription>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search summary, officer, region…"
                className="pl-9"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-card">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sentiment} onValueChange={setSentiment}>
              <SelectTrigger className="bg-card">
                <SelectValue placeholder="Sentiment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sentiments</SelectItem>
                {SENTIMENTS.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(status === s ? "all" : s)}
                className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-all ${
                  status === s
                    ? statusClass[s]
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="custom-scrollbar max-h-[640px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[110px]">Date</TableHead>
                  <TableHead className="min-w-[260px]">Feedback</TableHead>
                  <TableHead className="min-w-[140px]">Field Officer</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Sentiment</TableHead>
                  <TableHead className="capitalize">Status</TableHead>
                  <TableHead className="min-w-[180px]">Products</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((f) => (
                  <TableRow key={f.id} className="align-top">
                    <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                      {f.date.slice(5)}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-foreground">{f.summary}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {f.detail}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-foreground">
                        {f.fieldForceName}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {f.region}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs">{f.category}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`capitalize ${sentimentClass[f.sentiment]}`}
                      >
                        {f.sentiment}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`capitalize ${statusClass[f.status]}`}
                      >
                        {f.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {f.productIds.slice(0, 3).map((pid) => (
                          <span
                            key={pid}
                            className="inline-flex items-center gap-1 rounded-md bg-primary/8 px-1.5 py-0.5 text-[11px] font-medium text-primary"
                          >
                            <Package className="h-3 w-3" />
                            {productMap.get(pid)?.name ?? pid}
                          </span>
                        ))}
                        {f.productIds.length > 3 && (
                          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                            +{f.productIds.length - 3}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No feedback matches the current filters.
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
