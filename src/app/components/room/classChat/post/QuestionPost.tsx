"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle } from "lucide-react";
import { Question, Post } from "@/utils/types";
import { UpvoteButton, renderRoleIcon, ShowMoreLess } from "./PostUtils";

function renderReplyButton(
  isReplying: boolean,
  setIsReplying: React.Dispatch<React.SetStateAction<boolean>>
) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 px-2 text-xs gap-2 text-stone-900/50 hover:text-stone-900 hover:bg-stone-200/50"
      onClick={() => setIsReplying(!isReplying)}
    >
      <MessageCircle className="h-4 w-4" />
    </Button>
  );
}

function renderReplySection(setIsReplying: React.Dispatch<React.SetStateAction<boolean>>) {
  return (
    <div className="mt-2 pl-2">
      <Textarea placeholder="What are your thoughts?" className="min-h-[80px] mb-2" />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setIsReplying(false)}>
          Cancel
        </Button>
        <Button size="sm" onClick={() => setIsReplying(false)}>
          Reply
        </Button>
      </div>
    </div>
  );
}

export default function QuestionPost({
  post,
  commentView,
  replies,
  renderReply,
  children,
}: {
  post: Question;
  commentView?: string;
  replies?: Post[];
  renderReply?: (reply: Post) => React.ReactNode;
  children?: React.ReactNode;
}) {
  const [isReplying, setIsReplying] = useState(false);
  const [resolved, setResolved] = useState(post.isResolved);
  const [visibleCount, setVisibleCount] = useState(2);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (commentView === "unresolved" && resolved) return null;
  if (commentView === "resolved" && !resolved) return null;

  const hasReplies = (replies && replies.length > 0) || (children && true);
  const totalReplies = replies ? replies.length : 0;

  const displayedReplies = isCollapsed ? [] : replies ? replies.slice(0, visibleCount) : [];

  return (
    <div className="flex flex-col gap-2">
      <div className="font-bold whitespace-pre-wrap">{post.content}</div>

      <div className="flex items-center justify-between text-xs text-stone-900/50">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${resolved ? "bg-green-500" : "bg-red-500"}`} />
          <span className="font-semibold flex flex-row gap-1 text-foreground">
            {renderRoleIcon(post.user)}
            {post.user.username}
          </span>
          <span>{post.timestamp}</span>
        </div>
        <div className="flex items-center gap-2">
          <UpvoteButton initialVotes={post.upvotes} />
          {renderReplyButton(isReplying, setIsReplying)}
        </div>
      </div>

      {(isReplying || hasReplies) && (
        <div className="ml-1 pl-4 border-l border-border mt-2 space-y-4">
          {isReplying && renderReplySection(setIsReplying)}

          {replies && renderReply ? (
            <>
              {displayedReplies.map((reply) => (
                <div key={reply.id}>{renderReply(reply)}</div>
              ))}

              <div className="flex justify-center gap-4 pt-2">
                {/* Show More Button */}
                {((totalReplies > 2 && visibleCount < totalReplies && !isCollapsed) ||
                  (isCollapsed && totalReplies > 0)) && (
                  <ShowMoreLess
                    label="Show more"
                    onClick={() => {
                      if (isCollapsed) {
                        setIsCollapsed(false);
                        setVisibleCount(2);
                      } else {
                        setVisibleCount((prev) => prev + 5);
                      }
                    }}
                  />
                )}

                {/* Show Less Button */}
                {!isCollapsed && (totalReplies <= 2 || (totalReplies > 2 && visibleCount > 2)) && (
                  <ShowMoreLess label="Show less" onClick={() => setIsCollapsed(true)} />
                )}
              </div>
            </>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
}
