"use client";

import { useParams, useRouter } from "next/navigation";
import { CATEGORIES, Category } from "@/lib/schemas";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ListingForm } from "@/components/listing-form";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditListingPage() {
  const { category: categoryId, id } = useParams();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const category = CATEGORIES.find(c => c.id === categoryId);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const docSnap = await getDoc(doc(db, categoryId as string, id as string));
        if (docSnap.exists()) {
          setListing(docSnap.data());
        } else {
          toast.error("Listing not found");
          router.push(`/categories/${categoryId}`);
        }
      } catch {
        toast.error("Error loading listing");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchListing();
  }, [categoryId, id, router]);

  if (!category) return null;

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
                <BreadcrumbLink href="/" className="text-zinc-400 hover:text-white">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-zinc-600" />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/categories/${categoryId}`} className="text-zinc-400 hover:text-white">{category.label}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-zinc-600" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-zinc-200">Edit Listing</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-5xl">
            <h1 className="text-3xl font-bold tracking-tight text-white mb-8">Edit {listing?.title || "Listing"}</h1>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-40 w-full bg-zinc-900" />
                <Skeleton className="h-80 w-full bg-zinc-900" />
              </div>
            ) : (
              <ListingForm 
                category={categoryId as Category} 
                initialData={listing} 
                id={id as string} 
              />
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
