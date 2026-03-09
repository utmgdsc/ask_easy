"use client";

export type Role = "STUDENT" | "TA" | "PROFESSOR";

export interface User {
  id?: string;
  username: string;
  pfp: string;
  courses?: string[];
  courseids?: number[];
  role: Role;
}

interface BasePost {
  id: string;
  user: User | null; // null for anonymous posts
  timestamp: string;
  content: string;
  upvotes: number;
}

export interface Question extends BasePost {
  type: "question";
  replies: (BestAnswer | Comment)[];
  isResolved: boolean;
  visibility?: "PUBLIC" | "INSTRUCTOR_ONLY";
}

export interface BestAnswer extends BasePost {
  type: "bestAnswer";
}

export interface Comment extends BasePost {
  type: "comment";
}

export type Post = Question | BestAnswer | Comment;

export type Course = {
  professor: string;
  beginDate: string;
  endDate: string;
  name: string;
  id: number;
};
