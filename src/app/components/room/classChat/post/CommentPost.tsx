"use client";

import { Comment } from "@/utils/types";
import { renderAvatar, UpvoteButton, renderRoleIcon } from "./PostUtils";

export default function CommentPost({ post }: { post: Comment }) {
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
        </div>

        <div className="text-sm break-words whitespace-pre-wrap">{post.content}</div>

        <div className="flex items-center gap-4 text-muted-foreground">
          <UpvoteButton initialVotes={post.upvotes} />
        </div>
      </div>
    </div>
  );
}
