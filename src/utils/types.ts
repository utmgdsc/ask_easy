"use client";

export type Role = "STUDENT" | "TA" | "PROFESSOR";

export interface User {
  id?: string;
  utorid?: string;
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
  isAnonymous?: boolean;
}

export interface Question extends BasePost {
  type: "question";
  replies: Comment[];
  isResolved: boolean;
  visibility?: "PUBLIC" | "INSTRUCTOR_ONLY";
}

export interface Comment extends BasePost {
  type: "comment";
}

export type Post = Question | Comment;

export type Course = {
  professor: string;
  beginDate: string;
  endDate: string;
  name: string;
  id: number;
};

export type Lecture = {
  id: number;
  courseId: number;
  section: string;
  professor: string;
};

export interface CSVRow {
  [key: string]: string;
}

export interface StudentRecord {
  givenName: string;
  surname: string;
  preferredName: string;
  displayName: string;
  utorid: string;
  [key: string]: string;
}

export interface ProcessedClassData {
  courseCode: string;
  students: StudentRecord[];
}

/** True when `pfp` looks like an image URL/path (not a placeholder initial). */
export function isLikelyAvatarImageUrl(pfp: string | undefined): boolean {
  if (!pfp) return false;
  return (
    pfp.startsWith("http://") ||
    pfp.startsWith("https://") ||
    pfp.startsWith("data:") ||
    pfp.startsWith("/") ||
    pfp.startsWith("blob:")
  );
}

export function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  const only = parts[0];
  if (only.length >= 2) return only.slice(0, 2).toUpperCase();
  return only[0].toUpperCase();
}
