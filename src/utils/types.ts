"use client";

export type Role = "ta" | "prof" | "student";

export interface User {
  username: string;
  pfp: string;
  role: Role;
}

interface BasePost {
  id: number;
  user: User;
  timestamp: string;
  content: string;
  upvotes: number;
}

export interface Question extends BasePost {
  type: "question";
  replies: (BestAnswer | Comment)[];
  isResolved: boolean;
}

export interface BestAnswer extends BasePost {
  type: "bestAnswer";
}

export interface Comment extends BasePost {
  type: "comment";
}

export type Post = Question | BestAnswer | Comment;
