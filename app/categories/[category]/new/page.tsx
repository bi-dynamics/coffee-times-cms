"use client";

import { useParams } from "next/navigation";
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

export default function NewListingPage() {
  const { category: categoryId } = useParams();
  const category = CATEGORIES.find(c => c.id === categoryId);

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
                <BreadcrumbPage className="text-zinc-200">New Listing</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-5xl">
            <h1 className="text-3xl font-bold tracking-tight text-white mb-8">Add New {category.label.slice(0, -1)}</h1>
            <ListingForm category={categoryId as Category} />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
