"use client";

import { MainNav } from "@/components/main-nav";
import { UserNav } from "@/components/user-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-indigo-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
      <div className="container flex h-16 items-center">
        <MainNav />
        <div className="flex flex-1 items-center justify-end space-x-2">
          <UserNav />
        </div>
      </div>
    </header>
  );
}
