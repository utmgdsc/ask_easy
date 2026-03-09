"use client";

import { BestAnswer } from "@/utils/types";
import { renderAvatar, UpvoteButton, renderUsername } from "./PostUtils";

export default function BestAnswerPost({ post }: { post: BestAnswer }) {
  const isInstructor = post.user?.role === "TA" || post.user?.role === "PROFESSOR";

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
          <span className="bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded-md font-medium">
            Best Answer
          </span>
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
              : "bg-green-50 border border-green-200"
          }`}
        >
          {post.content}
        </div>

        <div className="flex items-center gap-4 text-muted-foreground">
          <UpvoteButton initialVotes={post.upvotes} />
        </div>
      </div>
    </div>
  );
}
