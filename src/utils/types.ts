"use client";

interface Comment {
  id: number;
  user: string;
  avatar: string;
  content: string;
  timestamp: string;
  votes: number;
  replies?: Comment[];
}

export default Comment;
