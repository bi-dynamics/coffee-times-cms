"use client";

import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORIES } from "@/lib/schemas";
import { getListingCounts, type CategoryCounts } from "@/lib/listings";
import { Coffee, ListFilter, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [counts, setCounts] = useState<CategoryCounts | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [countsLoading, setCountsLoading] = useState(true);
  const [countsFailed, setCountsFailed] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    (async () => {
      setCountsLoading(true);
      try {
        const result = await getListingCounts();
        if (cancelled) return;
        setCounts(result.counts);
        setTotal(result.total);
        if (result.failed.length > 0) {
          setCountsFailed(true);
          toast.error(
            `Could not count listings for ${result.failed.length} categor${
              result.failed.length === 1 ? "y" : "ies"
            }. See the console for details.`
          );
        }
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load listing counts:", error);
        setCountsFailed(true);
      } finally {
        if (!cancelled) setCountsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading || !user) {
    return null;
  }

  const totalLabel = countsLoading ? "…" : countsFailed && total === null ? "—" : String(total ?? 0);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-zinc-950 text-zinc-50">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-zinc-800 px-4">
          <SidebarTrigger className="-ml-1 text-zinc-400 hover:text-white" />
          <Separator orientation="vertical" className="mr-2 h-4 bg-zinc-800" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="text-zinc-200">Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-zinc-800 bg-zinc-900 text-zinc-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">Total Categories</CardTitle>
                <ListFilter className="h-4 w-4 text-zinc-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{CATEGORIES.length}</div>
              </CardContent>
            </Card>
            <Card className="border-zinc-800 bg-zinc-900 text-zinc-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">Total Listings</CardTitle>
                <Coffee className="h-4 w-4 text-zinc-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalLabel}</div>
                <p className="text-xs text-zinc-500">
                  {countsLoading
                    ? "Syncing with Firestore…"
                    : countsFailed
                      ? "Some categories could not be counted"
                      : `Across ${CATEGORIES.length} categories`}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <h2 className="mb-4 text-xl font-bold tracking-tight text-white">Quick Access</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat.id}
                  variant="outline"
                  className="group h-24 flex-col justify-center gap-2 border-dashed border-zinc-800 bg-zinc-900/50 text-zinc-400 transition-all hover:bg-zinc-900 hover:text-red-500"
                  onClick={() => router.push(`/categories/${cat.id}`)}
                >
                  <span className="whitespace-normal px-1 text-center text-xs font-semibold uppercase leading-tight tracking-wider">
                    {cat.label}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-normal text-zinc-500">
                    {countsLoading ? "…" : `${counts?.[cat.id] ?? 0} listings`}
                    <ChevronRight className="h-3 w-3" />
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
