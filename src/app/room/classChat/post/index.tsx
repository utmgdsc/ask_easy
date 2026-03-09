"use client";

import { Post } from "@/utils/types";
import QuestionPost from "./QuestionPost";
import BestAnswerPost from "./BestAnswerPost";
import CommentPost from "./CommentPost";
import { bestToTop } from "./PostUtils";

interface PostItemProps {
  post: Post;
  commentView?: "all" | "unresolved" | "resolved";
  canAnswer?: boolean;
  onUpvote?: () => void;
  onResolve?: () => void;
  onSubmitAnswer?: (content: string, isAnonymous: boolean) => void;
}

export default function PostItem({
  post,
  commentView,
  canAnswer = true,
  onUpvote,
  onResolve,
  onSubmitAnswer,
}: PostItemProps) {
  switch (post.type) {
    case "question": {
      const sortedReplies = bestToTop(post.replies);
      return (
        <QuestionPost
          post={post}
          commentView={commentView}
          replies={sortedReplies}
          canAnswer={canAnswer}
          onUpvote={onUpvote}
          onResolve={onResolve}
          onSubmitAnswer={onSubmitAnswer}
          renderReply={(reply) => <PostItem key={reply.id} post={reply} />}
        />
      );
    }
    case "bestAnswer":
      return <BestAnswerPost post={post} />;
    case "comment":
      return <CommentPost post={post} />;
    default:
      return null;
  }
}
