"use client";

import { Input } from "@/components/ui/input";

export default function ChatHeader() {
  return (
    <div className="flex flex-col border-b bg-background sticky bg-stone-50 top-0 z-10">
      <header className="px-4 py-2 flex items-center justify-between">
        <h1 className="text-xl font-bold">CSC209</h1>
        <Input className="h-10 w-1/2 max-w-xs bg-stone-200" placeholder="Search" />
      </header>
    </div>
  );
}
