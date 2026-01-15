"use client";

import { useParams, useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/schemas";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
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
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { collection, deleteDoc, doc, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function CategoryPage() {
  const { category: categoryId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const category = CATEGORIES.find((c) => c.id === categoryId);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchListings = async () => {
      if (!categoryId) return;
      setLoading(true);
      try {
        console.log("Starting fetch for category:", categoryId as string);
        const collectionRef = collection(db, categoryId as string);
        console.log("Collection reference created:", collectionRef);
        const q = query(collectionRef);
        console.log("Query created, now calling getDocs...");

        const querySnapshot = await getDocs(q);
        console.log("Total docs found in snapshot:", querySnapshot.size);

        const data = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        console.log("Mapped data:", data);
        setListings(data);
      } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error("Firestore Error:", error);
        console.error("Error message:", error.message);
        console.error("Error code:", error.code);
        toast.error(`Failed to load listings: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [categoryId]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    try {
      await deleteDoc(doc(db, categoryId as string, id));
      setListings((prev) => prev.filter((l) => l.id !== id));
      toast.success("Listing deleted successfully");
    } catch {
      toast.error("Failed to delete listing");
    }
  };

  if (authLoading || !user || !category) {
    return null;
  }

  const filteredListings = listings.filter(
    (l) =>
      l.title?.toLowerCase().includes(search.toLowerCase()) ||
      l.town?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-zinc-950 text-zinc-50">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-800 px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 text-zinc-400 hover:text-white" />
            <Separator
              orientation="vertical"
              className="mr-2 h-4 bg-zinc-800"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href="/"
                    className="text-zinc-400 hover:text-white"
                  >
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-zinc-600" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-zinc-200">
                    {category.label}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white gap-2"
            onClick={() => router.push(`/categories/${categoryId}/new`)}
          >
            <Plus className="h-4 w-4" />
            Add Listing
          </Button>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                placeholder="Search listings..."
                className="pl-10 border-zinc-800 bg-zinc-900 text-zinc-50 focus:border-red-500 focus:ring-red-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-zinc-800 text-zinc-400"
              >
                {filteredListings.length} Listings
              </Badge>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Title</TableHead>
                  <TableHead className="text-zinc-400">Town/Suburb</TableHead>
                  <TableHead className="text-zinc-400">Status</TableHead>
                  <TableHead className="text-zinc-400">Contact</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-zinc-500"
                    >
                      Loading listings...
                    </TableCell>
                  </TableRow>
                ) : filteredListings.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-zinc-500"
                    >
                      No listings found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredListings.map((listing) => (
                    <TableRow
                      key={listing.id}
                      className="border-zinc-800 hover:bg-zinc-800/50"
                    >
                      <TableCell className="font-medium text-zinc-200">
                        {listing.title}
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {listing.town}, {listing.suburb}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            listing.status === "active"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            listing.status === "active"
                              ? "bg-green-600/20 text-green-500 hover:bg-green-600/20"
                              : "bg-zinc-800 text-zinc-400"
                          }
                        >
                          {listing.status || "draft"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        <div className="text-xs">
                          {listing.phone_number && (
                            <div>{listing.phone_number}</div>
                          )}
                          {listing.email_address && (
                            <div className="truncate w-32">
                              {listing.email_address}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="border-zinc-800 bg-zinc-950 text-zinc-400"
                          >
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => {
                                console.log(
                                  "Navigating to edit page for listing:",
                                  listing.id
                                );
                                router.push(
                                  `/categories/${categoryId}/${listing.id}`
                                );
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {listing.website && (
                              <DropdownMenuItem
                                onClick={() =>
                                  window.open(listing.website, "_blank")
                                }
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Visit Website
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator className="bg-zinc-800" />
                            <DropdownMenuItem
                              className="text-red-500 focus:bg-red-500/10 focus:text-red-500"
                              onClick={() => handleDelete(listing.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
