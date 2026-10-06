"use client";

import { useState } from "react";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  Hospital,
  Dog,
  Wheat,
  ShoppingBag,
  Droplets,
  Building2,
  ArrowLeft,
} from "lucide-react";
import { useDashboardStore, type ViewId } from "@/lib/store";
import type { DepartmentId, Department } from "@/lib/mock-data";

const DEPT_ICONS: Record<DepartmentId, React.ComponentType<{ className?: string }>> = {
  pharma: Hospital,
  livestock: Dog,
  agribusiness: Wheat,
  consumer: ShoppingBag,
  salt: Droplets,
};

const VIEW_LABELS: Record<ViewId, string> = {
  home: "Overview",
  feedbacks: "Feedback Records",
  "field-force": "Field Force Participation",
  products: "Products Mentioned",
  recommendations: "Recommendations",
};

export function Header({
  departments,
  departmentCounts,
}: {
  departments: Department[];
  departmentCounts: Array<{ department: Department; feedbackCount: number }>;
}) {
  const { department, setDepartment, view, goHome } = useDashboardStore();
  const [open, setOpen] = useState(false);

  const current =
    departments.find((d) => d.id === department) ?? departments[0] ?? null;
  const CurrentIcon = current
    ? DEPT_ICONS[current.id] ?? Building2
    : Building2;
  const currentCount = current
    ? departmentCounts.find((d) => d.department.id === current.id)?.feedbackCount ?? 0
    : 0;

  const totalAll = departmentCounts.reduce((s, d) => s + d.feedbackCount, 0);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:py-4">
        {/* Brand + breadcrumb */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-border">
            <Image
              src="/aci-logo.png"
              alt="ACI logo"
              width={40}
              height={40}
              className="h-9 w-9 object-contain"
              priority
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
                ACI Field Feedback Console
              </h1>
              {current?.active ? (
                <Badge
                  variant="outline"
                  className="hidden border-primary/30 bg-primary/5 text-primary sm:inline-flex"
                >
                  Live
                </Badge>
              ) : current ? (
                <Badge
                  variant="outline"
                  className="hidden border-muted-foreground/30 bg-muted text-muted-foreground sm:inline-flex"
                >
                  Onboarding
                </Badge>
              ) : null}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {view !== "home" && (
                <button
                  onClick={goHome}
                  className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 transition-colors hover:bg-muted hover:text-foreground"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Overview
                </button>
              )}
              {view !== "home" && <span className="text-muted-foreground/40">/</span>}
              <span className="font-medium text-foreground/80">
                {VIEW_LABELS[view]}
              </span>
            </div>
          </div>
        </div>

        {/* Department dropdown */}
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between gap-2 border-border bg-card lg:w-auto"
              aria-label="Select department"
            >
              <span className="flex items-center gap-2">
                <CurrentIcon className="h-4 w-4 text-primary" />
                <span className="font-medium">{current?.name ?? "Departments"}</span>
              </span>
              <span className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary"
                >
                  {currentCount}
                </Badge>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-[320px] border-border shadow-lg"
          >
            <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Departments · feedback count
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                setDepartment("all");
                setOpen(false);
              }}
              className="gap-3"
            >
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-1 items-center justify-between">
                <span>All departments</span>
                <Badge variant="outline" className="font-mono">
                  {totalAll}
                </Badge>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {departmentCounts.map(({ department: dept, feedbackCount }) => {
              const Icon = DEPT_ICONS[dept.id] ?? Building2;
              const isActive = dept.id === current.id;
              return (
                <DropdownMenuItem
                  key={dept.id}
                  onSelect={() => {
                    setDepartment(dept.id);
                    setOpen(false);
                  }}
                  className="gap-3"
                >
                  <Icon className="h-4 w-4 text-primary" />
                  <div className="flex flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{dept.name}</span>
                      {dept.active ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {dept.description}
                    </span>
                  </div>
                  <Badge
                    variant={feedbackCount > 0 ? "secondary" : "outline"}
                    className={`font-mono ${
                      feedbackCount > 0
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    {feedbackCount}
                  </Badge>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
