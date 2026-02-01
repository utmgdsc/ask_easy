"use client";

import Comment from "./types";

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

export default PLACEHOLDER_COMMENTS;
