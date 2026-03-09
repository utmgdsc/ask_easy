"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const MIN_LENGTH = 5;

interface ChatInputProps {
  onSubmit: (content: string, isAnonymous: boolean) => void;
  disabled?: boolean;
  serverError?: string | null;
  onClearError?: () => void;
}

export default function ChatInput({
  onSubmit,
  disabled = false,
  serverError,
  onClearError,
}: ChatInputProps) {
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const error = serverError ?? localError;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (localError) setLocalError(null);
    if (serverError) onClearError?.();
  };

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (disabled) return;
    if (!trimmed) return;
    if (trimmed.length < MIN_LENGTH) {
      setLocalError(`Question must be at least ${MIN_LENGTH} characters.`);
      return;
    }
    setLocalError(null);
    onSubmit(trimmed, isAnonymous);
    setContent("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-5 pointer-events-none">
      <div className="absolute inset-0 bg-background backdrop-blur-xl [mask-image:linear-gradient(to_top,black,transparent)]" />
      <div className="max-w-4xl mx-auto px-4 pt-20 pb-4 relative">
        <div className="flex items-end gap-4 pointer-events-auto">
          <div className="flex flex-col gap-1.5 flex-1">
            <Textarea
              placeholder="Ask a question... (⌘+Enter to post)"
              value={content}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              className={`resize-none focus-visible:ring-0 focus-visible:border-stone-400 ${
                error ? "border-red-400 bg-red-50" : ""
              }`}
            />
            {error && <p className="text-xs text-red-500 px-1">{error}</p>}
            <label className="flex items-center gap-2 text-xs text-stone-500 cursor-pointer select-none w-fit">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded"
              />
              Post anonymously
            </label>
          </div>
          <Button
            className="h-16 w-16 shrink-0 bg-stone-900 hover:bg-stone-700"
            onClick={handleSubmit}
            disabled={disabled || !content.trim()}
          >
            Post
          </Button>
        </div>
      </div>
    </div>
  );
}
