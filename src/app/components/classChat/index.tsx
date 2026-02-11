"use client";

import { useState } from "react";
import PLACEHOLDER_QUESTIONS from "@/utils/placeholder";
import CommentNode from "./CommentNode";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import FilterTabs from "./FilterTabs";

export default function ClassChat() {
  const [commentView, setCommentView] = useState<"all" | "unresolved" | "resolved">("all");

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <ChatHeader />
      <div className="flex-1 relative min-h-0">
        <div className="absolute top-0 left-0 right-0 z-[5] h-24 pointer-events-none backdrop-blur-xl bg-background/50 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="absolute top-0 w-full z-10 flex justify-center py-2 pointer-events-none">
          <div className="w-full max-w-sm px-4 pointer-events-auto">
            <FilterTabs commentView={commentView} setCommentView={setCommentView} />
          </div>
        </div>
        <div className="absolute inset-0 overflow-y-auto px-6 pt-16">
          <div className="max-w-4xl mx-auto space-y-6 pb-4">
            <div className="space-y-6">
              {PLACEHOLDER_QUESTIONS.map((question) => (
                <CommentNode key={question.id} post={question} commentView={commentView} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <ChatInput />
    </div>
  );
}
