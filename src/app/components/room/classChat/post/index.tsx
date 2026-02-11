"use client";

import { Post } from "@/utils/types";
import QuestionPost from "./QuestionPost";
import BestAnswerPost from "./BestAnswerPost";
import CommentPost from "./CommentPost";
import { bestToTop } from "./PostUtils";

export default function PostItem({
  post,
  commentView,
}: {
  post: Post;
  commentView?: "all" | "unresolved" | "resolved";
}) {
  switch (post.type) {
    case "question":
      const sortedReplies = bestToTop(post.replies);

      return (
        <QuestionPost post={post} commentView={commentView}>
          {sortedReplies.map((reply: Post) => (
            <PostItem key={reply.id} post={reply} />
          ))}
        </QuestionPost>
      );
    case "bestAnswer":
      return <BestAnswerPost post={post} />;
    case "comment":
      return <CommentPost post={post} />;
    default:
      return null;
  }
}
