"use client";

import * as React from "react";
import {
  Coffee,
  LayoutDashboard,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { CATEGORIES } from "@/lib/schemas";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/components/auth-provider";
import { ScrollArea } from "@/components/ui/scroll-area";

export function AppSidebar() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <Sidebar collapsible="icon" className="border-zinc-800 bg-zinc-950">
      <SidebarHeader className="border-b border-zinc-800 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white">
            <Coffee className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white sidebar-hide">
            Coffee Times
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/"}
                tooltip="Dashboard"
                className="hover:bg-zinc-900 data-[active=true]:bg-zinc-900 data-[active=true]:text-red-500"
              >
                <Link href="/">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-zinc-500">Categories</SidebarGroupLabel>
          <ScrollArea className="h-[calc(100vh-280px)]">
            <SidebarMenu>
              {CATEGORIES.map((cat) => (
                <SidebarMenuItem key={cat.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === `/categories/${cat.id}`}
                    tooltip={cat.label}
                    className="hover:bg-zinc-900 data-[active=true]:bg-zinc-900 data-[active=true]:text-red-500"
                  >
                    <Link href={`/categories/${cat.id}`}>
                      <div className="flex w-full items-center justify-between">
                        <span>{cat.label}</span>
                        {pathname === `/categories/${cat.id}` && (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </ScrollArea>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-zinc-800 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-zinc-900 hover:bg-zinc-900"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || ""} />
                    <AvatarFallback className="rounded-lg bg-zinc-800 text-zinc-400">
                      {user?.email?.[0].toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight sidebar-hide">
                    <span className="truncate font-semibold text-zinc-200">
                      {user?.displayName || "Admin User"}
                    </span>
                    <span className="truncate text-xs text-zinc-500">
                      {user?.email}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg border-zinc-800 bg-zinc-950 text-zinc-400"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:bg-red-500/10 focus:text-red-500">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
