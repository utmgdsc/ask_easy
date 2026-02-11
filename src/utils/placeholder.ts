import { Post } from "./types";

const PLACEHOLDER_POSTS: Post[] = [
  // Resolved Question: Pointers
  {
    id: 1,
    type: "question",
    user: {
      username: "Hairy Potter",
      pfp: "",
      role: "student",
    },
    timestamp: "09:15",
    content: "What is the specific difference between *p and &p? I keep mixing them up.",
    upvotes: 12,
    isResolved: true,
    replies: [
      {
        id: 2,
        type: "bestAnswer",
        user: {
          username: "Snape Malfoy",
          pfp: "",
          role: "prof",
        },
        timestamp: "09:18",
        content:
          "Think of p as the variable itself, &p as the address in memory, and *p as the value stored at that address.",
        upvotes: 45,
      },
      {
        id: 3,
        type: "comment",
        user: {
          username: "Jack Jones",
          pfp: "",
          role: "ta",
        },
        timestamp: "09:25",
        content: "Just remember: & is Address, * is Value.",
        upvotes: 5,
      },
      {
        id: 4,
        type: "comment",
        user: {
          username: "Johnny Beans",
          pfp: "",
          role: "student",
        },
        timestamp: "09:28",
        content: "That makes sense now. Thanks!",
        upvotes: 2,
      },
    ],
  },

  // Conceptual Question: Stack vs Heap
  {
    id: 5,
    type: "question",
    user: {
      username: "Lily Thompson",
      pfp: "",
      role: "student",
    },
    timestamp: "11:20",
    content: "What is the actual difference between stack and heap memory? They seem similar.",
    upvotes: 8,
    isResolved: false,
    replies: [
      {
        id: 6,
        type: "comment",
        user: {
          username: "Jesse Retger",
          pfp: "",
          role: "prof",
        },
        timestamp: "11:24",
        content: "I think they're the same thing?",
        upvotes: 0,
      },
    ],
  },

  // Discussion: Macro vs Const
  {
    id: 8,
    type: "question",
    user: {
      username: "Birdi McFly",
      pfp: "",
      role: "student",
    },
    timestamp: "14:05",
    content: "Why do we use #define for array sizes instead of const int?",
    upvotes: 7,
    isResolved: false,
    replies: [
      {
        id: 9,
        type: "comment",
        user: {
          username: "Albert Einstein",
          pfp: "",
          role: "student",
        },
        timestamp: "14:10",
        content: "No clue.",
        upvotes: 15,
      },
      {
        id: 10,
        type: "comment",
        user: {
          username: "Kesha Sharma",
          pfp: "",
          role: "prof",
        },
        timestamp: "14:15",
        content:
          "I recommend const for type safety when possible not sure why it just works most of the time, but #define is very common.",
        upvotes: 20,
      },
    ],
  },

  // Resolved Question: Semicolons (New)
  {
    id: 11,
    type: "question",
    user: {
      username: "Jack Anaconda",
      pfp: "",
      role: "student",
    },
    timestamp: "16:20",
    content: "I'm coming from Python. What are the semicolons for? They seem useless.",
    upvotes: 2,
    isResolved: true,
    replies: [
      {
        id: 12,
        type: "bestAnswer",
        user: {
          username: "Snape Malfoy",
          pfp: "",
          role: "prof",
        },
        timestamp: "16:21",
        content:
          "In C, whitespace doesn't matter. The semicolon tells the compiler exactly where the command ends.",
        upvotes: 18,
      },
      {
        id: 13,
        type: "comment",
        user: {
          username: "Jack Anaconda",
          pfp: "",
          role: "student",
        },
        timestamp: "16:25",
        content: "Wait, so I can write code on one line?",
        upvotes: 1,
      },
      {
        id: 14,
        type: "comment",
        user: {
          username: "Joyce Chu",
          pfp: "",
          role: "ta",
        },
        timestamp: "16:26",
        content: "Yes, but please don't.",
        upvotes: 30,
      },
    ],
  },
];

export default PLACEHOLDER_POSTS;
