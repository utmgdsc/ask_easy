"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowBigUp, GraduationCap } from "lucide-react";
import { Post, User } from "@/utils/types";

export function renderAvatar(post: Post) {
  if (post && post.user) {
    return (
      <Avatar className="h-8 w-8">
        <AvatarImage src={post.user.pfp} alt={post.user.username} />
        <AvatarFallback>{post.user.username[0]}</AvatarFallback>
      </Avatar>
    );
  }
  return null;
}

export function UpvoteButton({ initialVotes }: { initialVotes: number }) {
  const [votes, setVotes] = useState(initialVotes);
  const [isUpvoted, setIsUpvoted] = useState(false);

  const handleUpvote = () => {
    if (isUpvoted) {
      setVotes(votes - 1);
    } else {
      setVotes(votes + 1);
    }
    setIsUpvoted(!isUpvoted);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`h-8 px-2 text-xs gap-2 hover:bg-stone-200/50 ${
        isUpvoted ? "text-green-500 hover:text-green-500" : "text-stone-900/50 hover:text-stone-900"
      }`}
      onClick={handleUpvote}
    >
      <ArrowBigUp className={`h-4 w-4 ${isUpvoted ? "fill-current" : ""}`} />
      <span>{Math.max(0, votes)}</span>
    </Button>
  );
}

export function renderRoleIcon(user: User) {
  if (user.role === "ta" || user.role === "prof") {
    return <GraduationCap className="h-4 w-4 text-stone-900" />;
  }
  return null;
}

export const bestToTop = (replies: Post[] | undefined) => {
  if (!replies) return [];

  return [...replies].sort((a, b) => {
    const isABest = a.type === "bestAnswer";
    const isBBest = b.type === "bestAnswer";

    if (isABest && !isBBest) {
      return -1;
    }
    if (!isABest && isBBest) {
      return 1;
    }

    return 0;
  });
};
