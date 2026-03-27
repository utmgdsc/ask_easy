"use client";

import { useState } from "react";
import {
  Video,
  BookOpen,
  Calendar,
  ArrowRight,
  Radio,
  Settings,
  Play,
  Square,
  PanelRightClose,
  Users,
  GraduationCap,
  Search,
  Navigation,
  LogOut,
  Unlink,
  Download,
  X,
  Ghost,
  User,
  Send,
} from "lucide-react";

import type { Question, Comment } from "@/utils/types";
import QuestionPost from "@/app/room/classChat/post/QuestionPost";
import CommentPost from "@/app/room/classChat/post/CommentPost";
import FilterTabs from "@/app/room/classChat/FilterTabs";
import ChatInput from "@/app/room/classChat/ChatInput";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_QUESTIONS: Question[] = [
  {
    id: "q1",
    type: "question",
    user: { username: "Sarah Chen", pfp: "", role: "STUDENT" },
    timestamp: "2:14 PM",
    content: "Can you go over that last example one more time? I didn't quite follow the recursion step.",
    upvotes: 12,
    isResolved: false,
    isAnonymous: false,
    replies: [
      {
        id: "a1",
        type: "comment",
        user: { username: "Prof. Williams", pfp: "", role: "PROFESSOR" },
        timestamp: "2:16 PM",
        content:
          "Sure! The key idea is that each recursive call reduces the problem size by half. I'll draw it out on the board in a moment.",
        upvotes: 5,
        isAnonymous: false,
      },
    ],
  },
  {
    id: "q2",
    type: "question",
    user: { username: "Alex Kim", pfp: "", role: "STUDENT" },
    timestamp: "2:18 PM",
    content: "How does binary search handle edge cases like an empty array?",
    upvotes: 24,
    isResolved: true,
    isAnonymous: false,
    replies: [
      {
        id: "a2",
        type: "comment",
        user: { username: "Jordan Lee", pfp: "", role: "TA" },
        timestamp: "2:20 PM",
        content:
          "Great question! When the array is empty, the base case triggers immediately since low > high, and we return -1. This is why checking the base case first is so important.",
        upvotes: 8,
        isAnonymous: false,
      },
    ],
  },
  {
    id: "q3",
    type: "question",
    user: null,
    timestamp: "2:22 PM",
    content: "Is this topic going to be on the midterm?",
    upvotes: 7,
    isResolved: false,
    isAnonymous: true,
    replies: [],
  },
  {
    id: "q4",
    type: "question",
    user: { username: "Marcus Johnson", pfp: "", role: "STUDENT" },
    timestamp: "2:25 PM",
    content: "What's the time complexity of merge sort vs quicksort in the worst case?",
    upvotes: 15,
    isResolved: false,
    isAnonymous: false,
    replies: [
      {
        id: "a3",
        type: "comment",
        user: { username: "Jordan Lee", pfp: "", role: "TA" },
        timestamp: "2:27 PM",
        content:
          "Merge sort is always O(n log n) in the worst case, while quicksort degrades to O(n\u00B2) when the pivot is poorly chosen (e.g. already sorted data with first-element pivot).",
        upvotes: 11,
        isAnonymous: false,
      },
    ],
  },
  {
    id: "q5",
    type: "question",
    user: { username: "Emily Park", pfp: "", role: "STUDENT" },
    timestamp: "2:30 PM",
    content: "Could you show a visual example of how the call stack looks during recursion?",
    upvotes: 9,
    isResolved: false,
    isAnonymous: false,
    replies: [],
  },
];

// ---------------------------------------------------------------------------
// Shared: Chat header (inline — avoids context deps)
// ---------------------------------------------------------------------------

function MockChatHeader({
  title,
  role,
  answerMode,
}: {
  title: string;
  role: "STUDENT" | "PROFESSOR";
  answerMode?: "all" | "instructors_only";
}) {
  const mode = answerMode ?? "instructors_only";
  return (
    <div className="flex flex-col border-b bg-stone-50 sticky top-0 z-10">
      <header className="pl-2 pr-4 py-2 flex items-center justify-between gap-2 min-h-[56px]">
        <div className="flex items-center gap-2 shrink-0">
          <button className="w-9 h-9 flex items-center justify-center text-stone-400 hover:text-stone-900 hover:bg-stone-200/60 rounded-md transition-colors">
            <PanelRightClose className="w-5 h-5 rotate-180" />
          </button>
          <h1 className="text-xl font-bold truncate max-w-[140px] sm:max-w-xs">{title}</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="w-9 h-9 flex items-center justify-center rounded-md transition-colors bg-stone-200 text-stone-600 hover:bg-stone-300">
            <Search className="w-4 h-4" />
          </button>
          {role === "PROFESSOR" && (
            <button
              className={`flex items-center gap-1.5 h-9 px-3 rounded-md text-sm font-medium transition-colors shrink-0 cursor-pointer ${
                mode === "all"
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-amber-100 text-amber-700 hover:bg-amber-200"
              }`}
            >
              {mode === "all" ? (
                <>
                  <Users className="w-3.5 h-3.5" />
                  Anyone
                </>
              ) : (
                <>
                  <GraduationCap className="w-3.5 h-3.5" />
                  TAs only
                </>
              )}
            </button>
          )}
        </div>
      </header>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared: Question list
// ---------------------------------------------------------------------------

function MockQuestionList({
  questions,
  commentView,
  role,
}: {
  questions: Question[];
  commentView: string;
  role: "STUDENT" | "PROFESSOR";
}) {
  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-36">
      {questions
        .filter((q) => {
          if (commentView === "unresolved") return !q.isResolved;
          if (commentView === "resolved") return q.isResolved;
          return true;
        })
        .map((q) => (
          <QuestionPost
            key={q.id}
            post={q}
            commentView={commentView}
            replies={q.replies}
            canAnswer
            onUpvote={() => {}}
            onResolve={role === "PROFESSOR" ? () => {} : undefined}
            onDelete={role === "PROFESSOR" ? () => {} : undefined}
            onSubmitAnswer={() => {}}
            renderReply={(reply) => (
              <CommentPost
                key={reply.id}
                post={reply as Comment}
                onUpvote={() => {}}
                onDelete={role === "PROFESSOR" ? () => {} : undefined}
              />
            )}
          />
        ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared: Mock PDF slide
// ---------------------------------------------------------------------------

function MockSlide() {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="bg-white w-full h-full rounded shadow-md flex flex-col p-10 overflow-hidden">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-stone-900 mb-1">Lecture 5: Recursion &amp; Binary Search</h2>
          <p className="text-sm text-stone-400">CSC108 — Introduction to Computer Science</p>
        </div>
        <div className="flex-1 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-stone-800 mb-3">Binary Search Algorithm</h3>
            <ul className="space-y-2 text-sm text-stone-600 list-disc pl-5">
              <li>Works on <span className="font-semibold text-stone-800">sorted</span> arrays only</li>
              <li>Repeatedly divides the search interval in half</li>
              <li>Compare target with the middle element</li>
              <li>Time complexity: <span className="font-mono bg-stone-100 px-1.5 py-0.5 rounded text-stone-700">O(log n)</span></li>
            </ul>
          </div>
          <div className="bg-stone-50 border border-stone-200 rounded-md p-4 font-mono text-sm leading-relaxed">
            <div className="text-stone-400 text-xs mb-2"># Python</div>
            <div><span className="text-blue-600">def</span> <span className="text-amber-600">binary_search</span>(arr, target):</div>
            <div className="pl-6">low, high = <span className="text-green-700">0</span>, <span className="text-amber-600">len</span>(arr) - <span className="text-green-700">1</span></div>
            <div className="pl-6"><span className="text-blue-600">while</span> low &lt;= high:</div>
            <div className="pl-12">mid = (low + high) // <span className="text-green-700">2</span></div>
            <div className="pl-12"><span className="text-blue-600">if</span> arr[mid] == target:</div>
            <div className="pl-[4.5rem]"><span className="text-blue-600">return</span> mid</div>
            <div className="pl-12"><span className="text-blue-600">elif</span> arr[mid] &lt; target:</div>
            <div className="pl-[4.5rem]">low = mid + <span className="text-green-700">1</span></div>
            <div className="pl-12"><span className="text-blue-600">else</span>:</div>
            <div className="pl-[4.5rem]">high = mid - <span className="text-green-700">1</span></div>
            <div className="pl-6"><span className="text-blue-600">return</span> -<span className="text-green-700">1</span></div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-stone-800 mb-2">Key Insight</h3>
            <p className="text-sm text-stone-600">
              Each recursive call <span className="font-semibold text-stone-800">reduces the problem size by half</span>.
              For an array of 1,000,000 elements, we need at most ~20 comparisons.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-stone-100 mt-4">
          <span className="text-xs text-stone-400">Prof. Williams</span>
          <span className="text-xs text-stone-400">5 / 24</span>
        </div>
      </div>
    </div>
  );
}

// ===================================================================
// SCENE 1: "Welcome to AskEasy" — Student dashboard, 1 live lecture
// ===================================================================

function Scene_JoinClass() {
  const courses = [
    { id: "1", name: "CSC108", semester: "Winter 2026", isActive: true },
    { id: "2", name: "MAT137", semester: "Winter 2026", isActive: false },
    { id: "3", name: "CSC148", semester: "Winter 2026", isActive: false },
  ];

  return (
    <div className="flex-1 w-full py-8 text-left">
      <div className="max-w-6xl mx-auto w-full mb-10 flex flex-col gap-4">
        <div>
          <h2 className="text-4xl font-bold text-stone-900 tracking-tight mb-2">My Lectures</h2>
          <p className="text-lg text-stone-500">
            Select a live lecture to join its session. If the lecture is not live, just wait!
          </p>
        </div>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {courses.map((course) => (
          <div
            key={course.id}
            className={`group relative overflow-hidden flex flex-col p-6 sm:p-8 rounded-md transition-all duration-300 bg-white border-2 h-[16rem] ${
              course.isActive
                ? "border-green-400 shadow-sm hover:shadow-xl cursor-pointer"
                : "border-stone-100 cursor-default"
            }`}
          >
            <div className="flex items-start justify-between w-full mb-6">
              <div className={`w-12 h-12 rounded-md flex items-center justify-center shrink-0 transition-all ${course.isActive ? "bg-green-50 text-green-500 group-hover:scale-110" : "bg-stone-50 text-stone-600"}`}>
                {course.isActive ? <Video className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
              </div>
              {course.isActive && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-md border border-green-200 shadow-sm animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  LIVE
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1 mt-auto">
              <h3 className={`font-bold text-3xl tracking-tight line-clamp-2 transition-colors ${course.isActive ? "text-stone-900 group-hover:text-green-600" : "text-stone-900"}`}>
                {course.name}
              </h3>
            </div>
            <div className="flex items-center gap-2 mt-6 pt-6 border-t border-stone-100 w-full text-sm font-medium text-stone-400">
              <Calendar className="w-4 h-4" />
              {course.semester}
              {course.isActive && (
                <div className="ml-auto flex items-center gap-1.5 text-sm font-medium text-green-500 group-hover:text-green-600 transition-colors">
                  Join
                  <ArrowRight className="w-4 h-4 text-green-400 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===================================================================
// SCENE 2: "Ask & Get Answers Live" — Q&A with questions + TA/prof replies
// ===================================================================

function Scene_AskQuestions() {
  const [commentView, setCommentView] = useState<"all" | "unresolved" | "resolved">("all");
  const [isAnonymous, setIsAnonymous] = useState(false);

  return (
    <div className="flex flex-col h-[700px] bg-background text-foreground relative border rounded-md overflow-hidden">
      <MockChatHeader title="CSC108 Live Session" role="STUDENT" />
      <div className="flex-1 relative min-h-0">
        <div className="absolute top-0 left-0 right-0 z-[5] h-24 pointer-events-none backdrop-blur-xl bg-background [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="absolute top-0 w-full z-10 flex justify-center py-2 pointer-events-none">
          <div className="w-full max-w-sm px-4 pointer-events-auto">
            <FilterTabs commentView={commentView} setCommentView={setCommentView} />
          </div>
        </div>
        <div className="absolute inset-0 overflow-y-auto px-4 pt-16">
          <MockQuestionList
            questions={MOCK_QUESTIONS.slice(0, 3)}
            commentView={commentView}
            role="STUDENT"
          />
        </div>
      </div>
      <ChatInput onSubmit={() => {}} isAnonymous={isAnonymous} onAnonymousChange={setIsAnonymous} />
    </div>
  );
}

// ===================================================================
// SCENE 3: "Upvote & Track Questions" — upvotes, resolved, filters
// ===================================================================

function Scene_Upvote() {
  const [commentView, setCommentView] = useState<"all" | "unresolved" | "resolved">("all");
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Show all 5 questions — mix of resolved and unresolved, various upvote counts
  return (
    <div className="flex flex-col h-[700px] bg-background text-foreground relative border rounded-md overflow-hidden">
      <MockChatHeader title="CSC108 Live Session" role="STUDENT" />
      <div className="flex-1 relative min-h-0">
        <div className="absolute top-0 left-0 right-0 z-[5] h-24 pointer-events-none backdrop-blur-xl bg-background [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="absolute top-0 w-full z-10 flex justify-center py-2 pointer-events-none">
          <div className="w-full max-w-sm px-4 pointer-events-auto">
            <FilterTabs commentView={commentView} setCommentView={setCommentView} />
          </div>
        </div>
        <div className="absolute inset-0 overflow-y-auto px-4 pt-16">
          <MockQuestionList
            questions={MOCK_QUESTIONS}
            commentView={commentView}
            role="STUDENT"
          />
        </div>
      </div>
      <ChatInput onSubmit={() => {}} isAnonymous={isAnonymous} onAnonymousChange={setIsAnonymous} />
    </div>
  );
}

// ===================================================================
// SCENE 4: "Stay Anonymous" — anonymous toggle ON, anonymous question visible
// ===================================================================

function Scene_Anonymous() {
  const [commentView, setCommentView] = useState<"all" | "unresolved" | "resolved">("all");

  // Show the chat input area with anonymous mode ON prominently
  return (
    <div className="flex flex-col h-[700px] bg-background text-foreground relative border rounded-md overflow-hidden">
      <MockChatHeader title="CSC108 Live Session" role="STUDENT" />
      <div className="flex-1 relative min-h-0">
        <div className="absolute top-0 left-0 right-0 z-[5] h-24 pointer-events-none backdrop-blur-xl bg-background [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="absolute top-0 w-full z-10 flex justify-center py-2 pointer-events-none">
          <div className="w-full max-w-sm px-4 pointer-events-auto">
            <FilterTabs commentView={commentView} setCommentView={setCommentView} />
          </div>
        </div>
        <div className="absolute inset-0 overflow-y-auto px-4 pt-16">
          <MockQuestionList
            questions={MOCK_QUESTIONS}
            commentView={commentView}
            role="STUDENT"
          />
        </div>
      </div>
      {/* Anonymous mode ON */}
      <ChatInput onSubmit={() => {}} isAnonymous={true} onAnonymousChange={() => {}} />
    </div>
  );
}

// ===================================================================
// SCENE 5: "Go Live & Share Slides" — Prof dashboard + split view
// ===================================================================

function Scene_GoLive() {
  const courses = [
    { id: "1", name: "CSC108", semester: "Winter 2026", isActive: false },
    { id: "2", name: "CSC148", semester: "Winter 2026", isActive: false },
    { id: "3", name: "CSC236", semester: "Winter 2026", isActive: false },
  ];

  return (
    <div className="flex-1 w-full py-8 text-left">
      <div className="max-w-6xl mx-auto w-full mb-10 flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold text-stone-900 tracking-tight mb-2">My Lectures</h2>
          <p className="text-lg text-stone-500">Manage your lectures and start live sessions.</p>
        </div>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {courses.map((course) => (
          <div
            key={course.id}
            className="group relative overflow-hidden flex flex-col p-6 sm:p-8 rounded-md transition-all duration-300 bg-white border-2 shadow-sm min-h-[16rem] border-stone-100 hover:border-stone-200 cursor-default"
          >
            <div className="flex items-start justify-between w-full mb-6 relative z-10">
              <div className="w-12 h-12 rounded-md flex items-center justify-center transition-all shrink-0 bg-stone-50 text-stone-600">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>
            <div className="flex flex-col gap-1 mt-auto relative z-10">
              <h3 className="font-bold text-3xl tracking-tight transition-colors line-clamp-2 text-stone-900">
                {course.name}
              </h3>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-stone-100 w-full text-sm font-medium text-stone-400 relative z-10 mb-4">
              <Calendar className="w-4 h-4" />
              {course.semester}
            </div>
            <div className="flex flex-col gap-2 relative z-10 w-full mt-auto">
              <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-stone-900 text-white rounded-md hover:!bg-green-600 font-semibold shadow-sm transition-colors text-sm">
                <Radio className="w-4 h-4" />
                Start Live Session
              </button>
              <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-md transition-colors font-medium text-sm">
                <Settings className="w-4 h-4" />
                Manage Lecture
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===================================================================
// SCENE 6: "Engage With Your Class" — Prof chat with answer mode toggle
// ===================================================================

function Scene_Interactive() {
  const [commentView, setCommentView] = useState<"all" | "unresolved" | "resolved">("all");
  const [isAnonymous, setIsAnonymous] = useState(false);

  return (
    <div className="flex h-[700px] border rounded-md overflow-hidden">
      {/* Slide side */}
      <div className="flex-1 flex flex-col bg-stone-100">
        <MockSlide />
        <div className="flex shrink-0 items-center justify-center gap-3 p-4 overflow-x-auto">
          <span className="flex items-center gap-1.5 h-9 px-3 bg-green-100 text-green-700 rounded-md text-sm font-medium">
            <Radio className="w-3.5 h-3.5" />
            Live
          </span>
          <span className="flex items-center gap-1.5 h-9 px-3 bg-stone-100 text-stone-700 rounded-md text-sm font-medium">
            <Users className="w-3.5 h-3.5" />
            47
          </span>
          <div className="w-px h-6 bg-stone-200 mx-1" />
          <button className="w-9 h-9 flex items-center justify-center bg-stone-900 hover:bg-stone-700 text-stone-50 rounded-md text-sm font-medium">
            <span className="sr-only">Previous</span>&larr;
          </button>
          <span className="text-sm text-stone-600 font-medium tabular-nums">5 / 24</span>
          <button className="w-9 h-9 flex items-center justify-center bg-stone-900 hover:bg-stone-700 text-stone-50 rounded-md text-sm font-medium">
            <span className="sr-only">Next</span>&rarr;
          </button>
        </div>
      </div>

      <div className="w-px bg-stone-200" />

      {/* Chat side — professor view with answer mode */}
      <div className="w-[420px] flex flex-col bg-background text-foreground relative">
        <MockChatHeader title="CSC108" role="PROFESSOR" answerMode="instructors_only" />
        <div className="flex-1 relative min-h-0">
          <div className="absolute top-0 left-0 right-0 z-[5] h-24 pointer-events-none backdrop-blur-xl bg-background [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <div className="absolute top-0 w-full z-10 flex justify-center py-2 pointer-events-none">
            <div className="w-full max-w-sm px-4 pointer-events-auto">
              <FilterTabs commentView={commentView} setCommentView={setCommentView} />
            </div>
          </div>
          <div className="absolute inset-0 overflow-y-auto px-4 pt-16">
            <MockQuestionList
              questions={MOCK_QUESTIONS.slice(0, 3)}
              commentView={commentView}
              role="PROFESSOR"
            />
          </div>
        </div>
        <ChatInput onSubmit={() => {}} isAnonymous={isAnonymous} onAnonymousChange={setIsAnonymous} />
      </div>
    </div>
  );
}

// ===================================================================
// SCENE 7: "Manage & Export" — End session modal + chat behind it
// ===================================================================

function Scene_ManageExport() {
  const [commentView, setCommentView] = useState<"all" | "unresolved" | "resolved">("all");
  const [isAnonymous, setIsAnonymous] = useState(false);

  return (
    <div className="relative">
      {/* Chat behind modal (dimmed) */}
      <div className="flex h-[700px] border rounded-md overflow-hidden">
        <div className="flex-1 flex flex-col bg-stone-100">
          <MockSlide />
          <div className="flex shrink-0 items-center justify-center gap-3 p-4 overflow-x-auto">
            <span className="flex items-center gap-1.5 h-9 px-3 bg-green-100 text-green-700 rounded-md text-sm font-medium">
              <Radio className="w-3.5 h-3.5" />
              Live
            </span>
            <span className="flex items-center gap-1.5 h-9 px-3 bg-stone-100 text-stone-700 rounded-md text-sm font-medium">
              <Users className="w-3.5 h-3.5" />
              47
            </span>
            <div className="w-px h-6 bg-stone-200 mx-1" />
            <button className="flex items-center gap-1.5 h-9 px-3 bg-red-100 hover:bg-red-200 text-red-600 rounded-md text-sm font-medium">
              <Square className="w-3.5 h-3.5" />
              End Lecture
            </button>
          </div>
        </div>
        <div className="w-px bg-stone-200" />
        <div className="w-[420px] flex flex-col bg-background text-foreground relative">
          <MockChatHeader title="CSC108" role="PROFESSOR" answerMode="instructors_only" />
          <div className="flex-1 relative min-h-0">
            <div className="absolute top-0 left-0 right-0 z-[5] h-24 pointer-events-none backdrop-blur-xl bg-background [mask-image:linear-gradient(to_bottom,black,transparent)]" />
            <div className="absolute top-0 w-full z-10 flex justify-center py-2 pointer-events-none">
              <div className="w-full max-w-sm px-4 pointer-events-auto">
                <FilterTabs commentView={commentView} setCommentView={setCommentView} />
              </div>
            </div>
            <div className="absolute inset-0 overflow-y-auto px-4 pt-16">
              <MockQuestionList
                questions={MOCK_QUESTIONS.slice(0, 2)}
                commentView={commentView}
                role="PROFESSOR"
              />
            </div>
          </div>
          <ChatInput onSubmit={() => {}} isAnonymous={isAnonymous} onAnonymousChange={setIsAnonymous} />
        </div>
      </div>

      {/* End session modal overlay */}
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 rounded-md">
        <div className="bg-white rounded-md shadow-xl border border-stone-200 w-full max-w-sm mx-4 overflow-hidden">
          <div className="px-6 py-5 border-b border-stone-100">
            <h2 className="text-lg font-bold text-stone-900">End Session</h2>
            <p className="text-sm text-stone-500 mt-1">
              Would you like to download the chat history for{" "}
              <span className="font-medium text-stone-700">CSC108 Live Session</span> before ending?
            </p>
          </div>
          <div className="px-6 py-4 flex flex-col gap-2">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-md text-sm font-medium transition-colors">
              <Download className="w-4 h-4" />
              Download chat history &amp; end
            </button>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-sm font-medium transition-colors">
              <Square className="w-4 h-4 fill-current" />
              End without downloading
            </button>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md text-sm font-medium transition-colors">
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scenes config
// ---------------------------------------------------------------------------

type Scene =
  | "s1-join"
  | "s2-ask"
  | "s3-upvote"
  | "s4-anonymous"
  | "p1-golive"
  | "p2-interactive"
  | "p3-manage";

const SCENES: { key: Scene; label: string; group: string }[] = [
  { key: "s1-join", label: "1. Join Class", group: "Student" },
  { key: "s2-ask", label: "2. Ask & Answer", group: "Student" },
  { key: "s3-upvote", label: "3. Upvote & Track", group: "Student" },
  { key: "s4-anonymous", label: "4. Anonymous", group: "Student" },
  { key: "p1-golive", label: "1. Go Live", group: "Professor" },
  { key: "p2-interactive", label: "2. Engage", group: "Professor" },
  { key: "p3-manage", label: "3. Manage & Export", group: "Professor" },
];

// ---------------------------------------------------------------------------
// Main Demo Page
// ---------------------------------------------------------------------------

export default function DemoPage() {
  const [scene, setScene] = useState<Scene>("s1-join");

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Scene selector bar */}
      <div className="sticky top-0 z-[60] bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 overflow-x-auto">
          <span className="text-xs font-bold text-stone-400 shrink-0 uppercase tracking-wider">Student:</span>
          {SCENES.filter((s) => s.group === "Student").map((s) => (
            <button
              key={s.key}
              onClick={() => setScene(s.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                scene === s.key
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {s.label}
            </button>
          ))}
          <div className="w-px h-6 bg-stone-200 mx-1 shrink-0" />
          <span className="text-xs font-bold text-stone-400 shrink-0 uppercase tracking-wider">Prof:</span>
          {SCENES.filter((s) => s.group === "Professor").map((s) => (
            <button
              key={s.key}
              onClick={() => setScene(s.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                scene === s.key
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scene content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {scene === "s1-join" && <Scene_JoinClass />}
        {scene === "s2-ask" && <Scene_AskQuestions />}
        {scene === "s3-upvote" && <Scene_Upvote />}
        {scene === "s4-anonymous" && <Scene_Anonymous />}
        {scene === "p1-golive" && <Scene_GoLive />}
        {scene === "p2-interactive" && <Scene_Interactive />}
        {scene === "p3-manage" && <Scene_ManageExport />}
      </div>
    </div>
  );
}
