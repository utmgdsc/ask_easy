"use client";

import { Input } from "@/components/ui/input";
import { useContext } from "react";
import { PanelRightClose } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { SlideUpdateContext } from "../index";

function SlideToggle() {
  // toggles slides on and off
  const { isHidden, rerender } = useContext(SlideUpdateContext);
  const isMDsize = useMediaQuery("(min-width: 1024px)");
  if (!isMDsize) {
    return (
      <button
        className="w-10 h-10 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-md transition-colors"
        onClick={() => rerender()}
      >
        {isHidden ? (
          <PanelRightClose className="w-6 h-6 rotate-270" />
        ) : (
          <PanelRightClose className="w-6 h-6 rotate-90" />
        )}
      </button>
    );
  } else {
    return (
      <button
        className="w-10 h-10 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-md transition-colors"
        onClick={() => rerender()}
      >
        {isHidden ? (
          <PanelRightClose className="w-6 h-6 rotate-180" />
        ) : (
          <PanelRightClose className="w-6 h-6 " />
        )}
      </button>
    );
  }
}

export default function ChatHeader() {
  return (
    <div className="flex flex-col border-b bg-background sticky bg-stone-50 top-0 z-10">
      <header className="px-4 py-2 flex items-center justify-between">
        <div className="flex items-center justify-left gap-2 ">
          <SlideToggle />
          <h1 className="text-xl font-bold">CSC209</h1>
        </div>
        <Input className="h-10 w-1/2 max-w-xs bg-stone-200" placeholder="Search" />
      </header>
    </div>
  );
}
