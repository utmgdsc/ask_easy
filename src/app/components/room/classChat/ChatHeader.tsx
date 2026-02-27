"use client";

import { Input } from "@/components/ui/input";
import { useContext } from "react";
import { PanelRightClose } from "lucide-react";
import { SlideUpdateContext } from "../index";
import Link from "next/link";
import { cn } from "@/lib/utils";

function SlideToggle() {
  // toggles slides on and off
  const { isSlidesVisible, rerender } = useContext(SlideUpdateContext);
  const slideIcon: string = isSlidesVisible ? slideIconStyling["open"] : slideIconStyling["closed"];
  return (
    <button
      className="w-10 h-10 flex items-center justify-center text-stone-900/50 hover:text-stone-900 hover:bg-stone-200 rounded-md transition-colors"
      onClick={() => rerender()}
    >
      <PanelRightClose className={cn("w-6 h-6 ", slideIcon)} />
    </button>
  );
}

const slideIconStyling = {
  open: "rotate-270 md:rotate-180",
  closed: "rotate-90 md:rotate-0",
};

export default function ChatHeader() {
  return (
    <div className="flex flex-col border-b bg-background sticky bg-stone-50 top-0 z-10">
      <header className="pl-2 pr-4 py-2 flex items-center justify-between">
        <div className="flex items-center justify-left gap-2 ">
          <SlideToggle />
          <Link href="/">
            <h1 className="text-xl font-bold">CSC209</h1>
          </Link>
        </div>
        <Input className="h-10 w-1/2 max-w-xs bg-stone-200" placeholder="Search" />
      </header>
    </div>
  );
}
