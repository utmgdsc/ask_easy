"use client";

import { Comment, Post } from "@/utils/types";
import QuestionPost from "./QuestionPost";
import CommentPost from "./CommentPost";
import { bestToTop } from "./PostUtils";

interface PostItemProps {
  post: Post;
  commentView?: "all" | "unresolved" | "resolved";
  canAnswer?: boolean;
  onUpvote?: () => void;
  onResolve?: () => void;
  onUnresolve?: () => void;
  onSubmitAnswer?: (content: string) => void;
  onAnswerUpvote?: (answerId: string) => void;
  /** Called when the professor/TA wants to delete this question. */
  onDeleteQuestion?: () => void;
  /**
   * Given a reply (Comment), returns a delete callback if the current user
   * may delete it, or undefined if they may not.
   */
  onDeleteAnswer?: (reply: Comment) => (() => void) | undefined;
  /** Used internally when PostItem renders a comment — the pre-bound delete fn. */
  onDelete?: () => void;
}

export default function PostItem({
  post,
  commentView,
  canAnswer = true,
  onUpvote,
  onResolve,
  onUnresolve,
  onSubmitAnswer,
  onAnswerUpvote,
  onDeleteQuestion,
  onDeleteAnswer,
  onDelete,
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
          onUnresolve={onUnresolve}
          onSubmitAnswer={onSubmitAnswer}
          onDelete={onDeleteQuestion}
          renderReply={(reply) => (
            <PostItem
              key={reply.id}
              post={reply}
              onAnswerUpvote={onAnswerUpvote}
              onDelete={onDeleteAnswer ? onDeleteAnswer(reply as Comment) : undefined}
            />
          )}
        />
      );
    }
    case "comment":
      return (
        <CommentPost
          post={post}
          onUpvote={onAnswerUpvote ? () => onAnswerUpvote(post.id) : undefined}
          onDelete={onDelete}
        />
      );
    default:
      return null;
  }
}
