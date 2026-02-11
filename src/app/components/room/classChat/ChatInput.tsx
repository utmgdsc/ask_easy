"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function ChatInput() {
  return (
    <div className="border-t bg-stone-50 p-4 relative z-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-4">
          <Textarea
            placeholder="Add to the discussion..."
            className="flex-1 min-w-0 min-h-[60px]"
          />
          <Button className="h-10 shrink-0 bg-stone-900 hover:bg-stone-700">Post</Button>
        </div>
      </div>
    </div>
  );
}
