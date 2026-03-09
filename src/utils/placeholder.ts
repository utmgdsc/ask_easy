import { Post } from "./types";

const PLACEHOLDER_POSTS: Post[] = [
  {
    id: "1",
    type: "question",
    user: { username: "Hairy PotterHairy", pfp: "", role: "STUDENT" },
    timestamp: "09:15",
    content: "What is the specific difference between *p and &p? I keep mixing them up.",
    upvotes: 12,
    isResolved: true,
    replies: [
      {
        id: "2",
        type: "bestAnswer",
        user: { username: "Snape Malfoy", pfp: "", role: "PROFESSOR" },
        timestamp: "09:18",
        content:
          "Think of p as the variable itself, &p as the address in memory, and *p as the value stored at that address.",
        upvotes: 45,
      },
      {
        id: "3",
        type: "comment",
        user: { username: "Jack Jones", pfp: "", role: "TA" },
        timestamp: "09:25",
        content: "Just remember: & is Address, * is Value.",
        upvotes: 5,
      },
      {
        id: "4",
        type: "comment",
        user: { username: "Johnny Beans", pfp: "", role: "STUDENT" },
        timestamp: "09:28",
        content: "That makes sense now. Thanks!",
        upvotes: 2,
      },
    ],
  },
  {
    id: "5",
    type: "question",
    user: { username: "Lily Thompson", pfp: "", role: "STUDENT" },
    timestamp: "09:25",
    content:
      "What is the actual difference between stack and heap memory? They seem similar.",
    upvotes: 8,
    isResolved: false,
    replies: [
      {
        id: "6",
        type: "comment",
        user: { username: "Jesse Retger", pfp: "", role: "STUDENT" },
        timestamp: "11:24",
        content: "I think they're the same thing?",
        upvotes: 0,
      },
    ],
  },
  {
    id: "7",
    type: "question",
    user: null,
    timestamp: "09:40",
    content: "Why do we use #define for array sizes instead of const int?",
    upvotes: 3,
    isResolved: false,
    replies: [],
  },
  {
    id: "8",
    type: "question",
    user: { username: "North East West South", pfp: "", role: "STUDENT" },
    timestamp: "10:02",
    content: "Is there a limit to function nesting?",
    upvotes: 6,
    isResolved: true,
    replies: [
      {
        id: "9",
        type: "bestAnswer",
        user: { username: "Snape Malfoy", pfp: "", role: "PROFESSOR" },
        timestamp: "10:10",
        content:
          "Python has a default recursion limit of about 1000 calls. You can check it with sys.getrecursionlimit().",
        upvotes: 20,
      },
      {
        id: "10",
        type: "comment",
        user: { username: "Jack Jones", pfp: "", role: "TA" },
        timestamp: "10:15",
        content: "Deep recursion can cause stack overflow errors, so always have base cases.",
        upvotes: 7,
      },
      {
        id: "11",
        type: "comment",
        user: { username: "Johnny Beans", pfp: "", role: "STUDENT" },
        timestamp: "10:18",
        content: "Good to know, thanks!",
        upvotes: 1,
      },
    ],
  },
];

export default PLACEHOLDER_POSTS;
