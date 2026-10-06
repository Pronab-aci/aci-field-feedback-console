"use client";

import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useDashboardStore } from "@/lib/store";
import { Header } from "@/components/dashboard/header";
import { StatCards } from "@/components/dashboard/stat-cards";
import { FeedbackCalendar } from "@/components/dashboard/feedback-calendar";
import { ChatBox } from "@/components/dashboard/chat-box";
import { Footer } from "@/components/dashboard/footer";
import { FeedbackDetailView } from "@/components/dashboard/detail-views/feedback-detail";
import { FieldForceDetailView } from "@/components/dashboard/detail-views/field-force-detail";
import { ProductsDetailView } from "@/components/dashboard/detail-views/products-detail";
import { RecommendationsDetailView } from "@/components/dashboard/detail-views/recommendations-detail";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

export default function Home() {
  const { data, isLoading, isError } = useDashboardData();
  const { view } = useDashboardStore();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header
        departments={data?.departments ?? []}
        departmentCounts={data?.summary.departmentCounts ?? []}
      />

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 lg:pr-[384px]">
        {isError ? (
          <ErrorState />
        ) : isLoading || !data ? (
          <LoadingSkeleton />
        ) : (
          <div className="space-y-6">
            {view === "home" && (
              <>
                <StatCards summary={data.summary} />
                <FeedbackCalendar feedbacks={data.feedbacks} />
              </>
            )}
            {view === "feedbacks" && (
              <FeedbackDetailView
                feedbacks={data.feedbacks}
                products={data.products}
              />
            )}
            {view === "field-force" && (
              <FieldForceDetailView fieldForces={data.fieldForces} />
            )}
            {view === "products" && (
              <ProductsDetailView products={data.products} />
            )}
            {view === "recommendations" && (
              <RecommendationsDetailView />
            )}
          </div>
        )}
      </main>

      {/*
        Chat sidebar.
        Mobile: in normal flow below the main content, with a fixed usable
        height. Desktop (lg+): position: fixed to the right of the viewport so
        it never scrolls out of view; the main column reserves right padding to
        avoid sitting under it. Bounded between the header and the footer.
      */}
      <aside className="mx-auto w-full max-w-[1600px] px-4 pb-6 sm:px-6 lg:fixed lg:top-[80px] lg:bottom-[56px] lg:right-4 lg:left-auto lg:m-0 lg:max-w-none lg:w-[360px] lg:px-0 lg:pb-0">
        <div className="h-[560px] lg:h-full">
          <ChatBox />
        </div>
      </aside>

      <Footer />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-44 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[560px] rounded-xl" />
    </div>
  );
}

function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 py-20 text-center">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <p className="text-base font-semibold text-foreground">
        Couldn&apos;t load the dashboard
      </p>
      <p className="max-w-md text-sm text-muted-foreground">
        The analytics service is unavailable. Please refresh the page or contact
        ACI IT support if the problem persists.
      </p>
    </div>
  );
}
