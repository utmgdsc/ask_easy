"use client";

import React, { createContext, useContext, useState } from "react";
import { Eye, EyeClosed } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { ArrowBigUp, MessageCircle } from "lucide-react";
import Comment from "@/utils/types";
import PLACEHOLDER_COMMENTS from "@/utils/placeholder";
import { Field, FieldLabel, FieldSet } from "@/components/ui/field";
import useShowSlide from "./room";

function renderAvatar(comment: Comment) {
  if (comment) {
    return (
      <Avatar className="h-8 w-8">
        <AvatarImage src={comment.avatar} alt={comment.user} />
        <AvatarFallback>{comment.user[0]}</AvatarFallback>
      </Avatar>
    );
  }
}
function renderUpvote(comment: Comment) {
  return (
    <div className="flex items-center gap-1 bg-muted/50 rounded-full px-2 py-0.5">
      <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-orange-500">
        <ArrowBigUp className="h-5 w-5" />
      </Button>
      <span className="text-xs font-bold">{comment.votes}</span>
    </div>
  );
}
function renderReplyButton(
  isReplying: boolean,
  setIsReplying: React.Dispatch<React.SetStateAction<boolean>>
) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 px-2 text-xs gap-2 hover:bg-muted"
      onClick={() => setIsReplying(!isReplying)}
    >
      <MessageCircle className="h-4 w-4" />
      Reply
    </Button>
  );
}
function renderReplySection(setIsReplying: React.Dispatch<React.SetStateAction<boolean>>) {
  return (
    <div className="mt-2 pl-2 border-l-2 border-muted">
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
function CommentNode({
  comment,
  isRoot = false,
  commentView,
}: {
  comment: Comment;
  isRoot?: boolean;
  commentView?: string;
}) {
  const [isReplying, setIsReplying] = useState(false);
  const [resolved, setResolved] = useState(comment.isResolved);
  if (commentView === "unresolved" && comment.isResolved) return null;
  if (commentView === "resolved" && !comment.isResolved) return null;

  const render = (
    <div className={`flex gap-3 ${!isRoot ? "mt-4" : ""}`}>
      <div className="flex flex-col items-center gap-1">
        {renderAvatar(comment)}
        <div className="h-full w-px bg-border my-2" />
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{comment.user}</span>
          <span>•</span>
          <span>{comment.timestamp}</span>
        </div>

        <div className="text-sm">{comment.content}</div>

        <div className="flex items-center gap-4 text-muted-foreground">
          {renderUpvote(comment)}

          <label
            className="flex items-center gap-1 text-xs cursor-pointer"
            onClick={() => {
              comment.isResolved = !comment.isResolved;
              setResolved(comment.isResolved);
            }}
          >
            <input type="checkbox" className="hidden peer" />
            <span className="text-red-500 peer-checked:text-green-500">
              {comment.isResolved ? "Resolved" : "Unresolved"}
            </span>
          </label>
          {renderReplyButton(isReplying, setIsReplying)}
        </div>

        {isReplying && renderReplySection(setIsReplying)}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.map((reply) => (
              <CommentNode key={reply.id} comment={reply} commentView={commentView} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (
    commentView === "all" ||
    (commentView === "unresolved" && !comment.isResolved) ||
    (commentView === "resolved" && comment.isResolved)
  ) {
    return render;
  }
  return null;
}

export default function ClassChat() {
  const [commentView, setCommentView] = useState<"all" | "unresolved" | "resolved">("all");

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center justify-between sticky top-0 bg-background z-10">
        <h1 className="text-xl font-bold">CSC209 Class Discussion</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">342 Online</span>
          <Avatar className="h-8 w-8">
            <AvatarFallback>M</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <header className="border-b px-6 py-4 flex items-center justify-left sticky top-0 bg-background gap-2 z-10">
        {useShowSlide() && (
          <Eye
            className="w-5 h-5 cursor-pointer text-foreground hover:text-primary"
            onClick={() => {}}
          />
        )}
        {!useShowSlide() && (
          <EyeClosed
            className="w-5 h-5 cursor-pointer text-foreground hover:text-primary"
            onClick={() => {}}
          />
        )}

        <FieldSet>
          <RadioGroup defaultValue="all" className="flex gap-2">
            <Field orientation="horizontal">
              <FieldLabel onClick={() => setCommentView("all")}>All</FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <FieldLabel onClick={() => setCommentView("unresolved")}>Unresolved</FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <FieldLabel onClick={() => setCommentView("resolved")}>Resolved</FieldLabel>
            </Field>
          </RadioGroup>
        </FieldSet>

        <Input className="h-10 " placeholder="Search comments..." />
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="space-y-6">
            {PLACEHOLDER_COMMENTS.map((comment) => (
              <CommentNode key={comment.id} comment={comment} commentView={commentView} isRoot />
            ))}
          </div>
        </div>
      </div>

      {/* Main Comment Input */}
      <div className="border-t bg-background p-4 relative z-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-4">
            <Textarea placeholder="Add to the discussion..." className="min-h-[60px]" />
            <Button className="h-10 bg-foreground ">Post</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
