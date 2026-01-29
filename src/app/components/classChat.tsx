"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowBigUp, MessageCircle } from "lucide-react";

interface Comment {
  id: number;
  user: string;
  avatar: string;
  content: string;
  timestamp: string;
  votes: number;
  replies?: Comment[];
}

const PLACEHOLDER_COMMENTS: Comment[] = [
  {
    id: 1,
    user: "John Doe",
    avatar: "",
    content:
      "I thought I understood recursion until the prof said 'it just calls itself' and moved on like that explained everything.",
    timestamp: "2 hours ago",
    votes: 96,
    replies: [
      {
        id: 11,
        user: "Alice Wonder",
        avatar: "",
        content:
          "The base case makes sense. The recursive step makes sense. Them together? Absolutely not.",
        timestamp: "1 hour ago",
        votes: 54,
        replies: [
          {
            id: 111,
            user: "Bob Builder",
            avatar: "",
            content:
              "My program works without recursion, but the assignment says I *must* use it, so now it doesn't work at all.",
            timestamp: "45 mins ago",
            votes: 31,
          },
        ],
      },
    ],
  },
  {
    id: 2,
    user: "Jane Smith",
    avatar: "",
    content: "If recursion is so powerful, why does my stack overflow every time I try it?",
    timestamp: "1 hour ago",
    votes: 73,
  },
];

const CommentNode: React.FC<{ comment: Comment; isRoot?: boolean }> = ({
  comment,
  isRoot = false,
}) => {
  const [isReplying, setIsReplying] = useState(false);

  return (
    <div className={`flex gap-3 ${!isRoot ? "mt-4" : ""}`}>
      <div className="flex flex-col items-center gap-1">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.avatar} alt={comment.user} />
          <AvatarFallback>{comment.user[0]}</AvatarFallback>
        </Avatar>
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
          <div className="flex items-center gap-1 bg-muted/50 rounded-full px-2 py-0.5">
            <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-orange-500">
              <ArrowBigUp className="h-5 w-5" />
            </Button>
            <span className="text-xs font-bold">{comment.votes}</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs gap-2 hover:bg-muted"
            onClick={() => setIsReplying(!isReplying)}
          >
            <MessageCircle className="h-4 w-4" />
            Reply
          </Button>
        </div>

        {isReplying && (
          <div className="mt-2 pl-2 border-l-2 border-muted">
            <Textarea placeholder="What are your thoughts?" className="min-h-[80px] mb-2" />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsReplying(false)}>
                Cancel
              </Button>
              <Button size="sm">Reply</Button>
            </div>
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.map((reply) => (
              <CommentNode key={reply.id} comment={reply} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ClassChat: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10">
        <h1 className="text-xl font-bold">Class Discussion</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">342 Online</span>
          <Avatar className="h-8 w-8">
            <AvatarFallback>ME</AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Original Post Context (Optional) */}
          <Card className="p-6 mb-8 border-muted bg-muted/20">
            <h2 className="text-2xl font-bold mb-2">CSC148</h2>
            <p className="text-muted-foreground mb-4">Professor X • live</p>
            <p className="">Today we will be discussing Recursion!!</p>
          </Card>

          <div className="space-y-6">
            {PLACEHOLDER_COMMENTS.map((comment) => (
              <CommentNode key={comment.id} comment={comment} isRoot />
            ))}
          </div>
        </div>
      </div>

      {/* Main Comment Input */}
      <div className="border-t bg-background p-4 relative z-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-4">
            <Textarea placeholder="Add to the discussion..." className="min-h-[60px]" />
            <Button className="h-auto">Post</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassChat;
