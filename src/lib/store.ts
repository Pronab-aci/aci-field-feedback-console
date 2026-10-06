"use client";

import { create } from "zustand";
import type { DepartmentId } from "@/lib/mock-data";

export type ViewId =
  | "home"
  | "feedbacks"
  | "field-force"
  | "products"
  | "recommendations";

interface DashboardState {
  view: ViewId;
  department: DepartmentId | "all";
  selectedDate: string | null; // yyyy-mm-dd
  setView: (view: ViewId) => void;
  setDepartment: (dept: DepartmentId | "all") => void;
  setSelectedDate: (date: string | null) => void;
  goHome: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  view: "home",
  department: "pharma",
  selectedDate: null,
  setView: (view) => set({ view }),
  setDepartment: (department) => set({ department }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  goHome: () => set({ view: "home", selectedDate: null }),
}));
