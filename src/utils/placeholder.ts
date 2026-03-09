import { Post, Course, User } from "./types";

export const PLACEHOLDER_POSTS: Post[] = [
  // Resolved Question: Pointers
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
    content: "What is the actual difference between stack and heap memory? They seem similar.",
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

export const PLACEHOLDER_COURSES: Course[] = [
  {
    id: 1,
    name: "Introduction to Physics",
    professor: "Dr. Emily Carter",
    beginDate: "2026-01-10",
    endDate: "2026-04-20",
  },
  {
    id: 2,
    name: "Advanced Calculus",
    professor: "Prof. Michael Nguyen",
    beginDate: "2026-01-12",
    endDate: "2026-04-22",
  },
  {
    id: 3,
    name: "Machine Learning Fundamentals",
    professor: "Dr. Sarah Ahmed",
    beginDate: "2026-01-15",
    endDate: "2026-04-25",
  },
  {
    id: 4,
    name: "Thermodynamics",
    professor: "Dr. James Patel",
    beginDate: "2026-01-11",
    endDate: "2026-04-18",
  },
  {
    id: 5,
    name: "Data Structures and Algorithms",
    professor: "Prof. Laura Chen",
    beginDate: "2026-01-14",
    endDate: "2026-04-24",
  },
];

export const PLACEHOLDER_USERS: User[] = [
  {
    username: "student_alex",
    pfp: "https://i.pravatar.cc/150?img=1",
    courses: ["Introduction to Physics", "Machine Learning Fundamentals"],
    courseids: [1, 2, 3, 4, 5],
    role: "STUDENT",
  },
  {
    username: "student_maya",
    pfp: "https://i.pravatar.cc/150?img=5",
    courses: ["Advanced Calculus", "Thermodynamics"],
    courseids: [5, 2, 1, 4],
    role: "STUDENT",
  },
  {
    username: "prof_carter",
    pfp: "https://i.pravatar.cc/150?img=12",
    courses: ["Introduction to Physics"],
    courseids: [1],
    role: "PROFESSOR",
  },
  {
    username: "prof_nguyen",
    pfp: "https://i.pravatar.cc/150?img=15",
    courses: ["Advanced Calculus"],
    courseids: [2],
    role: "PROFESSOR",
  },
  {
    username: "admin_user",
    pfp: "https://i.pravatar.cc/150?img=20",
    courses: [],
    courseids: [],
    role: "STUDENT",
  },
];
