"use client";

import { BestAnswer } from "@/utils/types";
import { renderAvatar, UpvoteButton, renderRoleIcon } from "./PostUtils";

export default function BestAnswerPost({ post }: { post: BestAnswer }) {
  return (
    <div className="flex gap-3 mt-4">
      <div className="flex flex-col items-center gap-1">
        {renderAvatar(post)}
        <div className="h-full w-px bg-border my-2" />
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2 text-xs text-stone-900/50">
          <span className="font-semibold flex flex-row gap-1 text-foreground">
            {renderRoleIcon(post.user)}
            {post.user.username}
          </span>
          <span>{post.timestamp}</span>
          <span className="bg-green-100 text-green-800 text-[10px] px-2 py-1 rounded-md font-medium">
            Best Answer
          </span>
        </div>

        <div className="text-sm break-words whitespace-pre-wrap p-3 bg-green-100 rounded-md">
          {post.content}
        </div>

        <div className="flex items-center gap-4 text-muted-foreground">
          <UpvoteButton initialVotes={post.upvotes} />
        </div>
      </div>
    </div>
  );
}
