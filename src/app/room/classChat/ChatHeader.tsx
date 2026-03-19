"use client";

import { Input } from "@/components/ui/input";
import { useContext } from "react";
import { PanelRightClose, Users, GraduationCap, Search, X } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { SlideUpdateContext } from "../SlideUpdateContext";
import type { Role } from "@/utils/types";

interface ChatHeaderProps {
  role: Role;
  answerMode: "all" | "instructors_only";
  onToggleAnswerMode: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

function SlideToggle() {
  const { isSlidesVisible, rerender } = useContext(SlideUpdateContext);
  const isMDsize = useMediaQuery("(min-width: 1024px)");
  if (!isMDsize) {
    return (
      <button
        className="w-10 h-10 flex items-center justify-center text-stone-900/50 hover:text-stone-900 hover:bg-stone-200 rounded-md transition-colors"
        onClick={() => rerender()}
      >
        {isSlidesVisible ? (
          <PanelRightClose className="w-6 h-6 rotate-270" />
        ) : (
          <PanelRightClose className="w-6 h-6 rotate-90" />
        )}
      </button>
    );
  }
  return (
    <button
      className="w-10 h-10 flex items-center justify-center text-stone-400 hover:text-stone-900 hover:bg-stone-200 rounded-md transition-colors"
      onClick={() => rerender()}
    >
      {isSlidesVisible ? (
        <PanelRightClose className="w-6 h-6 rotate-180" />
      ) : (
        <PanelRightClose className="w-6 h-6" />
      )}
    </button>
  );
}

import Link from "next/link";

import { useRoom } from "../RoomContext";

export default function ChatHeader({
  role,
  answerMode,
  onToggleAnswerMode,
  searchQuery,
  onSearchChange,
}: ChatHeaderProps) {
  const { sessionTitle } = useRoom();

  return (
    <div className="flex flex-col border-b bg-stone-50 sticky top-0 z-10">
      <header className="pl-2 pr-4 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/"
            className="text-lg font-bold border-r pr-2 border-stone-300 hover:opacity-80 transition-opacity"
          >
            AskEasy
          </Link>
          <SlideToggle />
          {sessionTitle && <h1 className="text-xl font-bold">{sessionTitle}</h1>}
        </div>

        {/* Search input */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
          <Input
            className="h-9 pl-8 pr-7 bg-stone-200 focus-visible:ring-0 focus-visible:border-stone-400 text-sm"
            placeholder="Search questions & answers…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Answer mode toggle — professors only */}
        {role === "PROFESSOR" && (
          <button
            onClick={onToggleAnswerMode}
            title={
              answerMode === "all"
                ? "Anyone can answer — click to restrict to TAs/Professors"
                : "TAs/Professors only — click to allow everyone"
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors shrink-0 ${
              answerMode === "all"
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-amber-100 text-amber-700 hover:bg-amber-200"
            }`}
          >
            {answerMode === "all" ? (
              <>
                <Users className="w-3.5 h-3.5" />
                Anyone
              </>
            ) : (
              <>
                <GraduationCap className="w-3.5 h-3.5" />
                TAs only
              </>
            )}
          </button>
        )}
      </header>
    </div>
  );
}
