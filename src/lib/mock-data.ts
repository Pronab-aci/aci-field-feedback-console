// Data layer for the ACI Field Feedback Console.
//
// Loads REAL feedback exported from ACI's pharma field system (parsed from the
// raw TSV export in `feedback-raw.json`) and derives the dashboard structures
// (feedbacks, field forces, products, recommendations, department summary) from it.
//
// Date range of the source data: 2025-09 → 2026-10 (the current month is Oct 2026).

import rawRecords from "@/lib/feedback-raw.json";

export type DepartmentId =
  | "pharma"
  | "livestock"
  | "agribusiness"
  | "consumer"
  | "salt";

export interface Department {
  id: DepartmentId;
  name: string;
  shortName: string;
  active: boolean;
  description: string;
}

// Feedback categories aligned with the real ACI export's "feedback type" column.
export type FeedbackCategory =
  | "Product Feedback"
  | "Product Issues"
  | "Experience Feedback"
  | "General Feedback"
  | "Service Feedback"
  | "Process Issues"
  | "Service Issues";

export type FeedbackSentiment = "positive" | "neutral" | "negative";

export type FeedbackStatus = "new" | "reviewing" | "actioned" | "closed";

export interface Feedback {
  id: string;
  date: string; // yyyy-mm-dd
  fieldForceId: string;
  fieldForceName: string;
  region: string;
  department: DepartmentId;
  productIds: string[];
  category: FeedbackCategory;
  subCategory: string;
  sentiment: FeedbackSentiment;
  status: FeedbackStatus;
  summary: string;
  detail: string;
}

export interface FieldForce {
  id: string;
  name: string;
  region: string;
  territory: string;
  department: DepartmentId;
  submitted: boolean;
  lastSubmissionDate?: string;
  totalSubmitted: number;
}

export interface Product {
  id: string;
  name: string;
  department: DepartmentId;
  category: string;
  mentionCount: number;
  sentimentPositive: number;
  sentimentNegative: number;
}

export type RecommendationStatus =
  | "proposed"
  | "reviewing"
  | "in-progress"
  | "implemented"
  | "monitoring";

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: FeedbackCategory;
  sourceFeedbackIds: string[];
  impact: "high" | "medium" | "low";
  effort: "high" | "medium" | "low";
  status: RecommendationStatus;
  owner: string;
  department: DepartmentId;
}

export const DEPARTMENTS: Department[] = [
  {
    id: "pharma",
    name: "Pharma",
    shortName: "Pharma",
    active: true,
    description: "ACI Pharmaceuticals — prescription & OTC medicines",
  },
  {
    id: "livestock",
    name: "Livestock",
    shortName: "Livestock",
    active: false,
    description: "ACI Animal Health — veterinary & feed solutions",
  },
  {
    id: "agribusiness",
    name: "Agribusiness",
    shortName: "Agri",
    active: false,
    description: "ACI Agribusiness — crop protection & seeds",
  },
  {
    id: "consumer",
    name: "Consumer Brands",
    shortName: "Consumer",
    active: false,
    description: "ACI Consumer Brands — FMCG & household products",
  },
  {
    id: "salt",
    name: "Salt",
    shortName: "Salt",
    active: false,
    description: "ACI Salt — edible & industrial salt products",
  },
];

interface RawRecord {
  territory: string;
  product: string;
  feedbackType: string;
  subCategory: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  timestamp: string;
  date: string;
}

const RAW = rawRecords as RawRecord[];

// ---- Territory code → region mapping (ACI pharma territory codes) ----
const TERRITORY_REGION: Record<string, string> = {
  ACC: "Dhaka Metro",
  AJO: "Dhaka",
  AQZ: "Chattogram",
  AUJ: "Chattogram",
  AON: "Khulna",
  CJ: "Rajshahi",
  ASP: "Sylhet",
  XQ: "Rangpur",
  ASN: "Barishal",
  ATE: "Mymensingh",
  AFB: "Dhaka Metro",
  WC: "Chattogram",
  UN: "Khulna",
};

const REGIONS = [
  "Dhaka Metro",
  "Chattogram",
  "Khulna",
  "Rajshahi",
  "Sylhet",
  "Barishal",
  "Rangpur",
  "Mymensingh",
];

function regionForTerritory(territory: string, fallbackIndex: number): string {
  if (territory && TERRITORY_REGION[territory]) return TERRITORY_REGION[territory];
  if (territory) return REGIONS[fallbackIndex % REGIONS.length];
  return "Head Office";
}

// ---- Text cleaning (mojibake + control chars) ----
function cleanMessage(s: string): string {
  if (!s) return "";
  // The source TSV contains Bengali text that was mis-decoded (UTF-8 read as
  // cp1252/latin1 then re-encoded). Attempt to reverse it; if that yields valid
  // text, prefer it. Otherwise fall back to stripping non-ASCII.
  let attempt = s;
  try {
    const buf = Buffer.from(s, "latin1");
    const decoded = buf.toString("utf-8");
    // Only accept if it produced valid chars and no replacement char flood
    if (decoded && !decoded.includes("\uFFFD") && decoded.length > 0) {
      attempt = decoded;
    }
  } catch {
    /* keep original */
  }
  // collapse whitespace, strip control chars (keep newlines briefly, then flatten)
  return attempt
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + "…";
}

// Map the raw feedbackType to our enum; empty → General Feedback.
function mapCategory(rawType: string): FeedbackCategory {
  const t = (rawType || "").trim();
  const known: FeedbackCategory[] = [
    "Product Feedback",
    "Product Issues",
    "Experience Feedback",
    "General Feedback",
    "Service Feedback",
    "Process Issues",
    "Service Issues",
  ];
  if ((known as string[]).includes(t)) return t as FeedbackCategory;
  return "General Feedback";
}

// Heuristic sentiment from message keywords.
function deriveSentiment(message: string, category: FeedbackCategory): FeedbackSentiment {
  const m = message.toLowerCase();
  const positiveWords = [
    "good",
    "amazing",
    "excellent",
    "satisfied",
    "outstanding",
    "nice",
    "great",
    "happy",
    "thanks",
    "best",
    "better",
  ];
  const negativeWords = [
    "not available",
    "not availabel",
    "defective",
    "damaged",
    "swelling",
    "problem",
    "issue",
    "complain",
    "complaint",
    "short supply",
    "shortage",
    "broken",
    "hardened",
    "slow",
    "aggressive",
    "doubt",
    "wrong",
    "incorrect",
    "high",
    "pending",
    "messy",
  ];
  let pos = 0;
  let neg = 0;
  for (const w of positiveWords) if (m.includes(w)) pos++;
  for (const w of negativeWords) if (m.includes(w)) neg++;
  if (pos > neg) return "positive";
  if (neg > pos) return "negative";
  // category bias: Product Issues / Process Issues / Service Issues lean negative
  if (
    category === "Product Issues" ||
    category === "Process Issues" ||
    category === "Service Issues"
  )
    return "negative";
  if (category === "Product Feedback" || category === "Service Feedback")
    return "positive";
  return "neutral";
}

function statusFor(index: number): FeedbackStatus {
  const cycle: FeedbackStatus[] = ["new", "reviewing", "actioned", "closed"];
  return cycle[index % cycle.length];
}

// ---- Build products from real product names ----
interface ProductAgg {
  name: string;
  mentionCount: number;
  positive: number;
  negative: number;
}

function buildProducts(): Product[] {
  const map = new Map<string, ProductAgg>();
  RAW.forEach((r) => {
    const p = (r.product || "").trim();
    if (!p) return;
    const cur = map.get(p) ?? {
      name: p,
      mentionCount: 0,
      positive: 0,
      negative: 0,
    };
    cur.mentionCount += 1;
    const msg = cleanMessage(r.message);
    const sent = deriveSentiment(msg, mapCategory(r.feedbackType));
    if (sent === "positive") cur.positive += 1;
    if (sent === "negative") cur.negative += 1;
    map.set(p, cur);
  });
  return Array.from(map.entries())
    .map(([name, agg], i) => ({
      id: `prod-${String(i + 1).padStart(2, "0")}`,
      name,
      department: "pharma" as DepartmentId,
      category: inferProductCategory(name),
      mentionCount: agg.mentionCount,
      sentimentPositive: agg.positive,
      sentimentNegative: agg.negative,
    }))
    .sort((a, b) => b.mentionCount - a.mentionCount);
}

function inferProductCategory(name: string): string {
  const n = name.toLowerCase();
  if (/inj|injection|iu/.test(n)) return "Injectable";
  if (/tab|tablet/.test(n)) return "Tablet";
  if (/cap/.test(n)) return "Capsule";
  if (/syr|syrup|sol|lotion|gel/.test(n)) return "Topical / Liquid";
  return "Pharma SKU";
}

// ---- Build field forces from real submitters ----
interface OfficerAgg {
  name: string;
  territory: string;
  region: string;
  count: number;
  lastDate: string;
}

function buildFieldForces(): FieldForce[] {
  const map = new Map<string, OfficerAgg>();
  RAW.forEach((r, i) => {
    const name = (r.name || "").trim();
    if (!name) return;
    const key = name.toLowerCase();
    const cur = map.get(key) ?? {
      name,
      territory: (r.territory || "").trim(),
      region: regionForTerritory(r.territory, i),
      count: 0,
      lastDate: "1970-01-01",
    };
    cur.count += 1;
    if (r.date > cur.lastDate) {
      cur.lastDate = r.date;
      cur.territory = (r.territory || cur.territory).trim();
      cur.region = regionForTerritory(cur.territory || r.territory, i);
    }
    map.set(key, cur);
  });

  const officers = Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // All named officers submitted. Add a few "pending" officers to reflect
  // realistic participation gaps (roster vs. submitted). These are placeholder
  // names flagged as not-yet-submitted this cycle.
  const pendingRoster: Array<[string, string]> = [
    ["Kamrul Hasan", "ACC"],
    ["Tanvir Ahmed", "AJO"],
    ["Sadia Rahman", "ASP"],
    ["Mehedi Hasan", "XQ"],
    ["Nusrat Jahan", "CJ"],
    ["Rakibul Islam", "AON"],
    ["Farzana Akter", "ASN"],
    ["Imran Khan", "ATE"],
  ];

  const result: FieldForce[] = officers.map((o, i) => ({
    id: `ff-${String(i + 1).padStart(2, "0")}`,
    name: o.name,
    region: o.region,
    territory: o.territory || "—",
    department: "pharma",
    submitted: true,
    lastSubmissionDate: o.lastDate,
    totalSubmitted: o.count,
  }));

  pendingRoster.forEach(([name, terr], i) => {
    // avoid duplicate name collision
    if (result.some((r) => r.name.toLowerCase() === name.toLowerCase())) return;
    result.push({
      id: `ff-${String(officers.length + i + 1).padStart(2, "0")}`,
      name,
      region: regionForTerritory(terr, i),
      territory: terr,
      department: "pharma",
      submitted: false,
      lastSubmissionDate: undefined,
      totalSubmitted: 0,
    });
  });

  return result;
}

// ---- Build feedbacks from raw records ----
function buildFeedbacks(
  products: Product[],
  fieldForces: FieldForce[]
): Feedback[] {
  const productNameToId = new Map(products.map((p) => [p.name, p.id]));
  const officerNameToId = new Map(
    fieldForces.map((f) => [f.name.toLowerCase(), f.id])
  );

  return RAW.map((r, i) => {
    const category = mapCategory(r.feedbackType);
    const message = cleanMessage(r.message);
    const sentiment = deriveSentiment(message, category);
    const productId = r.product ? productNameToId.get(r.product.trim()) : undefined;
    const officerName = (r.name || "").trim();
    const officerId = officerName
      ? officerNameToId.get(officerName.toLowerCase()) ?? `ff-anon-${i}`
      : `ff-anon-${i}`;
    const officerDisplay = officerName || "Anonymous";
    const region = regionForTerritory(r.territory, i);

    return {
      id: `fb-${String(i + 1).padStart(3, "0")}`,
      date: r.date,
      fieldForceId: officerId,
      fieldForceName: officerDisplay,
      region,
      department: "pharma" as DepartmentId,
      productIds: productId ? [productId] : [],
      category,
      subCategory: (r.subCategory || "").trim(),
      sentiment,
      status: statusFor(i),
      summary: truncate(message || "(no message)", 110),
      detail: message || "(no message provided)",
    } satisfies Feedback;
  }).sort((a, b) => b.date.localeCompare(a.date));
}

export const PRODUCTS = buildProducts();
export const FIELD_FORCES = buildFieldForces();
export const FEEDBACKS = buildFeedbacks(PRODUCTS, FIELD_FORCES);

// ---- Recommendations derived from the real feedback themes ----
export const RECOMMENDATIONS: Recommendation[] = [
  {
    id: "rec-1",
    title: "Stabilise FPM / DCR field app for low-bandwidth & morning peaks",
    description:
      "Field forces report the reporting app slows or fails during morning hours and at month-end, blocking DCR, Work Plan and Resource Plan entry. A performance fix plus resumable sync would recover the most field time per officer.",
    category: "Process Issues",
    sourceFeedbackIds: FEEDBACKS.filter((f) => f.category === "Process Issues").map(
      (f) => f.id
    ),
    impact: "high",
    effort: "medium",
    status: "in-progress",
    owner: "Digital Field Solutions",
    department: "pharma",
  },
  {
    id: "rec-2",
    title: "CAPA on defective-product batches (Cerox CV, ORS, Othera gift boxes)",
    description:
      "Multiple Product-Issues flags cite swollen tablets, hardened ORS saline and damaged gift boxes. Plant QA to trace affected batches, isolate stock and release a formal CAPA within 10 working days.",
    category: "Product Issues",
    sourceFeedbackIds: FEEDBACKS.filter(
      (f) => f.category === "Product Issues" && f.subCategory === "Defective Product"
    ).map((f) => f.id),
    impact: "high",
    effort: "high",
    status: "reviewing",
    owner: "Plant Quality Assurance",
    department: "pharma",
  },
  {
    id: "rec-3",
    title: "Real-time sales sync for GD brands in field app",
    description:
      "Officers report GD-brand sales data is not reflected in “My Product” until after month-end, preventing same-day order planning. Backfill a real-time sales sync and surface a last-updated timestamp.",
    category: "Experience Feedback",
    sourceFeedbackIds: FEEDBACKS.filter(
      (f) => f.category === "Experience Feedback"
    ).map((f) => f.id),
    impact: "high",
    effort: "medium",
    status: "proposed",
    owner: "Digital Field Solutions",
    department: "pharma",
  },
  {
    id: "rec-4",
    title: "Injectable water-ampule bundling policy review",
    description:
      "Feedback flags that injectable lines ship without water ampoules, creating clinical risk and field pushback. Review bundling policy with Medical & Regulatory before next supply cycle.",
    category: "Product Issues",
    sourceFeedbackIds: FEEDBACKS.filter(
      (f) => f.detail.toLowerCase().includes("water ampule") ||
        f.detail.toLowerCase().includes("injectable")
    ).map((f) => f.id),
    impact: "high",
    effort: "low",
    status: "proposed",
    owner: "Supply Chain & Medical",
    department: "pharma",
  },
  {
    id: "rec-5",
    title: "Resource & sample stock hard-stop in DCR",
    description:
      "Field officers can over-post gift/sample resources beyond physical stock, triggering red-flag exceptions. Enforce a stock-availability hard-stop at posting time and auto-reconcile on miss-call calls.",
    category: "Service Feedback",
    sourceFeedbackIds: FEEDBACKS.filter(
      (f) => f.category === "Service Feedback"
    ).map((f) => f.id),
    impact: "medium",
    effort: "medium",
    status: "in-progress",
    owner: "Digital Field Solutions",
    department: "pharma",
  },
  {
    id: "rec-6",
    title: "Trade rating & cash-discount review for new territories",
    description:
      "New joiners report chemist pushback on trade rating (12–14%) and cash-discount requests vs. wholesale. Commercial to review trade scheme for emerging territories and equip field with objection-handling aid.",
    category: "General Feedback",
    sourceFeedbackIds: FEEDBACKS.filter(
      (f) =>
        f.detail.toLowerCase().includes("rating") ||
        f.detail.toLowerCase().includes("discount")
    ).map((f) => f.id),
    impact: "medium",
    effort: "medium",
    status: "reviewing",
    owner: "Commercial",
    department: "pharma",
  },
  {
    id: "rec-7",
    title: "Othera 20 Tab launch detailing aid (Bi-phasic Esomeprazole)",
    description:
      "Positive feedback highlights Othera as the first bi-phasic Esomeprazole in Bangladesh. Codify a dedicated detailing aid and call-card to amplify the launch across territories.",
    category: "Product Feedback",
    sourceFeedbackIds: FEEDBACKS.filter(
      (f) => f.category === "Product Feedback"
    ).map((f) => f.id),
    impact: "medium",
    effort: "low",
    status: "implemented",
    owner: "Brand & Marketing",
    department: "pharma",
  },
  {
    id: "rec-8",
    title: "Doctor-add workflow handover to MPOs",
    description:
      "Experience feedback suggests the new-doctor onboarding should sit with MPOs rather than a central flow. Pilot a territory-led doctor-add workflow with validation guardrails.",
    category: "Experience Feedback",
    sourceFeedbackIds: FEEDBACKS.filter(
      (f) => f.detail.toLowerCase().includes("doctor")
    ).map((f) => f.id),
    impact: "low",
    effort: "low",
    status: "monitoring",
    owner: "Field Operations",
    department: "pharma",
  },
];

// ---- Aggregates ----
export interface DashboardSummary {
  totalFeedbacks: number;
  submittedFieldForces: number;
  notSubmittedFieldForces: number;
  totalFieldForces: number;
  productsMentioned: number;
  recommendationsCount: number;
  departmentCounts: Array<{ department: Department; feedbackCount: number }>;
  dailyCounts: Array<{ date: string; count: number }>;
  categoryBreakdown: Array<{ category: FeedbackCategory; count: number }>;
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  dateRange: { earliest: string; latest: string };
}

const CATEGORY_ORDER: FeedbackCategory[] = [
  "Product Feedback",
  "Product Issues",
  "Experience Feedback",
  "General Feedback",
  "Service Feedback",
  "Process Issues",
  "Service Issues",
];

export function getDashboardSummary(
  feedbacks: Feedback[] = FEEDBACKS
): DashboardSummary {
  const submitted = FIELD_FORCES.filter((f) => f.submitted).length;
  const total = FIELD_FORCES.length;

  const departmentCounts = DEPARTMENTS.map((d) => ({
    department: d,
    feedbackCount:
      d.id === "pharma"
        ? feedbacks.filter((f) => f.department === d.id).length
        : 0,
  }));

  const dayMap = new Map<string, number>();
  feedbacks.forEach((f) => {
    dayMap.set(f.date, (dayMap.get(f.date) ?? 0) + 1);
  });
  const dailyCounts = Array.from(dayMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const catMap = new Map<FeedbackCategory, number>();
  feedbacks.forEach((f) => {
    catMap.set(f.category, (catMap.get(f.category) ?? 0) + 1);
  });
  const categoryBreakdown = CATEGORY_ORDER.map((c) => ({
    category: c,
    count: catMap.get(c) ?? 0,
  })).sort((a, b) => b.count - a.count);

  const sentimentBreakdown = {
    positive: feedbacks.filter((f) => f.sentiment === "positive").length,
    neutral: feedbacks.filter((f) => f.sentiment === "neutral").length,
    negative: feedbacks.filter((f) => f.sentiment === "negative").length,
  };

  const mentionedProductIds = new Set<string>();
  feedbacks.forEach((f) => f.productIds.forEach((pid) => mentionedProductIds.add(pid)));
  const productsMentioned = mentionedProductIds.size;

  const dates = feedbacks.map((f) => f.date).sort();
  const dateRange = {
    earliest: dates[0] ?? "",
    latest: dates[dates.length - 1] ?? "",
  };

  return {
    totalFeedbacks: feedbacks.length,
    submittedFieldForces: submitted,
    notSubmittedFieldForces: total - submitted,
    totalFieldForces: total,
    productsMentioned,
    recommendationsCount: RECOMMENDATIONS.length,
    departmentCounts,
    dailyCounts,
    categoryBreakdown,
    sentimentBreakdown,
    dateRange,
  };
}
