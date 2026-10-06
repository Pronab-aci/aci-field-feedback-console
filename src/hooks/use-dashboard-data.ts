"use client";

import { useQuery } from "@tanstack/react-query";
import { useDashboardStore } from "@/lib/store";
import type {
  DashboardSummary,
  Department,
  Feedback,
  FieldForce,
  Product,
  Recommendation,
} from "@/lib/mock-data";

export interface DashboardData {
  summary: DashboardSummary;
  departments: Department[];
  fieldForces: FieldForce[];
  products: Product[];
  recommendations: Recommendation[];
  feedbacks: Feedback[];
}

export function useDashboardData() {
  const department = useDashboardStore((s) => s.department);
  return useQuery<DashboardData>({
    queryKey: ["dashboard", department],
    queryFn: async () => {
      const res = await fetch(
        `/api/dashboard?department=${department}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("Failed to load dashboard data");
      return (await res.json()) as DashboardData;
    },
  });
}
