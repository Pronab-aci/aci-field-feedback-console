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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { Package, TrendingUp, TrendingDown, MessageSquareText } from "lucide-react";
import type { Product } from "@/lib/mock-data";

export function ProductsDetailView({ products }: { products: Product[] }) {
  const [sort, setSort] = useState<"mentions" | "positive" | "negative">(
    "mentions"
  );

  const sorted = useMemo(() => {
    const arr = [...products];
    if (sort === "mentions") arr.sort((a, b) => b.mentionCount - a.mentionCount);
    else if (sort === "positive")
      arr.sort((a, b) => b.sentimentPositive - a.sentimentPositive);
    else arr.sort((a, b) => b.sentimentNegative - a.sentimentNegative);
    return arr;
  }, [products, sort]);

  const chartData = useMemo(
    () =>
      [...products]
        .sort((a, b) => b.mentionCount - a.mentionCount)
        .slice(0, 8)
        .map((p) => ({
          name: p.name,
          mentions: p.mentionCount,
          positive: p.sentimentPositive,
          negative: p.sentimentNegative,
        })),
    [products]
  );

  const totals = useMemo(() => {
    const mentions = products.reduce((s, p) => s + p.mentionCount, 0);
    const positive = products.reduce((s, p) => s + p.sentimentPositive, 0);
    const negative = products.reduce((s, p) => s + p.sentimentNegative, 0);
    return { mentions, positive, negative };
  }, [products]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Package className="h-5 w-5 text-primary" />
          Products Mentioned in Feedback
        </h2>
        <p className="text-sm text-muted-foreground">
          Which SKUs surface most often in field feedback, and how the sentiment
          splits around each.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
              <MessageSquareText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">
                {totals.mentions}
              </p>
              <p className="text-xs text-muted-foreground">Total mentions</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">
                {totals.positive}
              </p>
              <p className="text-xs text-muted-foreground">Positive mentions</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10">
              <TrendingDown className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">
                {totals.negative}
              </p>
              <p className="text-xs text-muted-foreground">Negative mentions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Top 8 Mentioned Products</CardTitle>
          <CardDescription>
            Volume of feedback mentions per SKU
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
                />
                <Bar dataKey="mentions" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill="var(--primary)" opacity={1 - i * 0.08} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Product Mention Detail</CardTitle>
              <CardDescription>
                Mentions, sentiment split and category per product
              </CardDescription>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
              {(
                [
                  ["mentions", "Mentions"],
                  ["positive", "Positive"],
                  ["negative", "Negative"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSort(key)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                    sort === key
                      ? "bg-card text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="custom-scrollbar max-h-[520px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="min-w-[180px]">Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Mentions</TableHead>
                  <TableHead className="text-right">Positive</TableHead>
                  <TableHead className="text-right">Negative</TableHead>
                  <TableHead className="min-w-[160px]">Sentiment split</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((p) => {
                  const posPct = p.mentionCount
                    ? Math.round((p.sentimentPositive / p.mentionCount) * 100)
                    : 0;
                  const negPct = p.mentionCount
                    ? Math.round((p.sentimentNegative / p.mentionCount) * 100)
                    : 0;
                  const neuPct = 100 - posPct - negPct;
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                            <Package className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {p.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {p.id}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.category}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-foreground">
                        {p.mentionCount}
                      </TableCell>
                      <TableCell className="text-right font-mono text-primary">
                        {p.sentimentPositive}
                      </TableCell>
                      <TableCell className="text-right font-mono text-destructive">
                        {p.sentimentNegative}
                      </TableCell>
                      <TableCell>
                        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="bg-primary"
                            style={{ width: `${posPct}%` }}
                          />
                          <div
                            className="bg-muted-foreground/40"
                            style={{ width: `${neuPct}%` }}
                          />
                          <div
                            className="bg-destructive/70"
                            style={{ width: `${negPct}%` }}
                          />
                        </div>
                        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                          <span>{posPct}%</span>
                          <span>{negPct}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
