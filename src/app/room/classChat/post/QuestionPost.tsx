"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, CheckCircle2 } from "lucide-react";
import { Question, Post } from "@/utils/types";
import { UpvoteButton, renderUsername } from "./PostUtils";

// ---------------------------------------------------------------------------
// Reply composer
// ---------------------------------------------------------------------------

interface ReplySectionProps {
  canAnswer: boolean;
  onSubmit: (content: string, isAnonymous: boolean) => void;
  onCancel: () => void;
}

function ReplySection({ canAnswer, onSubmit, onCancel }: ReplySectionProps) {
  const [text, setText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  if (!canAnswer) {
    return (
      <div className="py-2 text-xs text-stone-400 italic">
        Only TAs and professors can answer right now.
      </div>
    );
  }

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed, isAnonymous);
    setText("");
    onCancel();
  };

  return (
    <div className="pt-1 pb-2">
      <Textarea
        placeholder="Write an answer..."
        className="min-h-[72px] mb-2 focus-visible:ring-0 focus-visible:border-stone-400"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
        }}
      />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-stone-500 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="rounded"
          />
          Anonymous
        </label>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={!text.trim()}>
            Post reply
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Thread toggle button (+/-)
// ---------------------------------------------------------------------------

function ThreadToggle({
  label,
  symbol,
  onClick,
}: {
  label: string;
  symbol: "+" | "−";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex items-center justify-center w-4 h-4 rounded-full border border-stone-400 text-stone-400 hover:border-stone-700 hover:text-stone-700 transition-colors leading-none"
    >
      <span className="text-[10px] font-bold select-none">{symbol}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// QuestionPost
// ---------------------------------------------------------------------------

/**
 * Thread states:
 *  "default"  — best answers (professor) visible, other replies hidden
 *  "expanded" — all replies visible
 *  "collapsed"— no replies visible
 */
type ThreadState = "default" | "expanded" | "collapsed";

export default function QuestionPost({
  post,
  commentView,
  replies,
  renderReply,
  canAnswer = true,
  onUpvote,
  onResolve,
  onSubmitAnswer,
  children,
}: {
  post: Question;
  commentView?: string;
  replies?: Post[];
  renderReply?: (reply: Post) => React.ReactNode;
  canAnswer?: boolean;
  onUpvote?: () => void;
  onResolve?: () => void;
  onSubmitAnswer?: (content: string, isAnonymous: boolean) => void;
  children?: React.ReactNode;
}) {
  const [isReplying, setIsReplying] = useState(false);
  const [resolved, setResolved] = useState(post.isResolved);
  const [threadState, setThreadState] = useState<ThreadState>("default");

  // Keep resolved in sync if parent state updates
  if (post.isResolved && !resolved) setResolved(true);

  if (commentView === "unresolved" && resolved) return null;
  if (commentView === "resolved" && !resolved) return null;

  const replyList = replies ?? [];
  const bestAnswers = replyList.filter((r) => r.type === "bestAnswer");
  const otherReplies = replyList.filter((r) => r.type !== "bestAnswer");
  const hasAnyReplies = replyList.length > 0 || !!children || isReplying;

  // What the +/- button should show:
  //  collapsed  → "+" (click → default)
  //  default, has other replies → "+" (click → expanded)
  //  default, no other replies  → "−" (click → collapsed)
  //  expanded   → "−" (click → collapsed)
  const toggleSymbol: "+" | "−" =
    threadState === "collapsed" || (threadState === "default" && otherReplies.length > 0)
      ? "+"
      : "−";

  const handleToggle = () => {
    if (threadState === "collapsed") {
      setThreadState("expanded");
    } else if (threadState === "default") {
      if (otherReplies.length > 0 || isReplying) {
        setThreadState("expanded");
      } else {
        setThreadState("collapsed");
      }
    } else {
      // expanded → collapsed
      setThreadState("collapsed");
    }
  };

  const handleResolve = () => {
    setResolved(true);
    onResolve?.();
  };

  // Which replies to render in the thread
  const visibleReplies =
    threadState === "collapsed"
      ? []
      : threadState === "default"
        ? bestAnswers
        : replyList; // expanded → all

  const showThread =
    threadState !== "collapsed" && (visibleReplies.length > 0 || (isReplying && threadState === "expanded"));

  return (
    <div className="flex flex-col gap-2 bg-stone-100 rounded-xl p-4 border border-stone-200">
      {/* Question body */}
      <div className="font-semibold whitespace-pre-wrap text-stone-900">{post.content}</div>

      {/* Meta row */}
      <div className="flex items-center justify-between text-xs text-stone-500">
        {/* Left: status dot + username + time + toggle */}
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full shrink-0 ${resolved ? "bg-green-500" : "bg-amber-400"}`}
          />
          {renderUsername(post.user)}
          <span>{post.timestamp}</span>

          {hasAnyReplies && (
            <ThreadToggle
              symbol={toggleSymbol}
              label={threadState === "collapsed" ? "Expand replies" : toggleSymbol === "+" ? "Show all replies" : "Collapse replies"}
              onClick={handleToggle}
            />
          )}
        </div>

        {/* Right: upvote + reply + resolve */}
        <div className="flex items-center gap-1">
          <UpvoteButton
            initialVotes={post.upvotes}
            controlledVotes={post.upvotes}
            onUpvote={onUpvote}
          />

          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs gap-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-200/60"
            onClick={() => {
              setIsReplying((v) => !v);
              // Opening reply box should at least be in expanded state
              setThreadState("expanded");
            }}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Reply
          </Button>

          {onResolve && !resolved && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1 text-stone-500 hover:text-green-600 hover:bg-green-50"
              onClick={handleResolve}
              title="Mark as resolved"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Thread */}
      {showThread && (
        <div className="mt-1 pl-4 border-l-2 border-stone-300 space-y-1">
          {isReplying && threadState === "expanded" && (
            <ReplySection
              canAnswer={canAnswer}
              onSubmit={(content, isAnon) => onSubmitAnswer?.(content, isAnon)}
              onCancel={() => setIsReplying(false)}
            />
          )}

          {replies && renderReply
            ? visibleReplies.map((reply) => (
                <div key={reply.id}>{renderReply(reply)}</div>
              ))
            : children}
        </div>
      )}
    </div>
  );
}
