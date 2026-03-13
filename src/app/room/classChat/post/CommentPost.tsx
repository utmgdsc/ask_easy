"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Comment } from "@/utils/types";
import { renderAvatar, UpvoteButton, renderUsername } from "./PostUtils";

interface CommentPostProps {
  post: Comment;
  onUpvote?: () => void;
  onDelete?: () => void;
}

export default function CommentPost({ post, onUpvote, onDelete }: CommentPostProps) {
  const isInstructor = post.user?.role === "TA" || post.user?.role === "PROFESSOR";
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div className="flex gap-3 mt-4">
      <div className="flex flex-col items-center gap-1">
        {renderAvatar(post)}
        <div className="h-full w-px bg-border my-2" />
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2 text-xs text-stone-900/50">
          {renderUsername(post.user)}
          <span>{post.timestamp}</span>
          {isInstructor && (
            <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-md font-medium">
              Instructor
            </span>
          )}
        </div>

        <div
          className={`text-sm break-words whitespace-pre-wrap p-3 rounded-md ${
            isInstructor
              ? "bg-amber-50 border border-amber-200"
              : "bg-stone-50 border border-stone-200"
          }`}
        >
          {post.content}
        </div>

        <div className="flex items-center gap-4 text-muted-foreground">
          {!confirmingDelete && (
            <UpvoteButton
              initialVotes={post.upvotes}
              controlledVotes={post.upvotes}
              onUpvote={onUpvote}
            />
          )}

          {onDelete && (
            confirmingDelete ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-stone-500">Delete this answer?</span>
                <button
                  onClick={() => { onDelete(); setConfirmingDelete(false); }}
                  className="px-2 py-0.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  className="px-2 py-0.5 text-xs bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-md font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmingDelete(true)}
                title="Delete answer"
                className="flex items-center gap-1 text-xs text-stone-400 hover:text-red-600 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
