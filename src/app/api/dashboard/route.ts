import { NextResponse } from "next/server";
import {
  FEEDBACKS,
  FIELD_FORCES,
  PRODUCTS,
  RECOMMENDATIONS,
  DEPARTMENTS,
  getDashboardSummary,
  type DepartmentId,
} from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const deptParam = searchParams.get("department") as DepartmentId | "all" | null;

  // Currently only pharma has data; non-pharma returns empty feedbacks but keeps structure.
  const filtered =
    !deptParam || deptParam === "all"
      ? FEEDBACKS
      : deptParam === "pharma"
        ? FEEDBACKS
        : [];

  const summary = getDashboardSummary(filtered);

  return NextResponse.json({
    summary,
    departments: DEPARTMENTS,
    fieldForces: FIELD_FORCES,
    products: PRODUCTS,
    recommendations: RECOMMENDATIONS,
    feedbacks: filtered,
  });
}
