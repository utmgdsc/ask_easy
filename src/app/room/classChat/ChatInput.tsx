"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function ChatInput() {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-5 pointer-events-none">
      <div className="absolute inset-0 bg-background backdrop-blur-xl [mask-image:linear-gradient(to_top,black,transparent)]" />
      <div className="max-w-4xl mx-auto px-4 pt-20 pb-4 relative">
        <div className="flex items-end gap-4 pointer-events-auto">
          <Textarea placeholder="Ask a question..." />
          <Button className="h-16 w-16 shrink-0 bg-stone-900 hover:bg-stone-700">Post</Button>
        </div>
      </div>
    </div>
  );
}
