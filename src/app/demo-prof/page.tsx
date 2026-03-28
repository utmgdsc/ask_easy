"use client";

import { useState } from "react";
import {
  BookOpen,
  Calendar,
  Radio,
  Settings,
  Square,
  PanelRightClose,
  Users,
  GraduationCap,
  Search,
  Download,
  X,
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
    content:
      "Can you go over that last example one more time? I didn't quite follow the recursion step.",
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
          "Great question! When the array is empty, the base case triggers immediately since low > high, and we return -1.",
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
          "Merge sort is always O(n log n), while quicksort degrades to O(n²) when the pivot is poorly chosen.",
        upvotes: 11,
        isAnonymous: false,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Shared: Mock nav bar
// ---------------------------------------------------------------------------

function MockNav() {
  return (
    <div className="bg-white border-b border-stone-200 px-8 h-14 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-6">
        <span className="font-extrabold text-stone-900 text-lg tracking-tight">AskEasy</span>
        <span className="text-sm font-semibold text-stone-900 border-b-2 border-stone-900 pb-0.5">
          My Lectures
        </span>
      </div>
      <div className="w-9 h-9 rounded-full bg-stone-200 flex items-center justify-center text-xs font-bold text-stone-600">
        JW
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared: Chat header
// ---------------------------------------------------------------------------

function MockChatHeader({
  title,
  answerMode,
}: {
  title: string;
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
          <h1 className="text-xl font-bold truncate max-w-xs">{title}</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="w-9 h-9 flex items-center justify-center rounded-md transition-colors bg-stone-200 text-stone-600 hover:bg-stone-300">
            <Search className="w-4 h-4" />
          </button>
          <button
            className={`flex items-center gap-1.5 h-9 px-3 rounded-md text-sm font-medium transition-colors shrink-0 ${
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
}: {
  questions: Question[];
  commentView: string;
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
            onResolve={() => {}}
            onDelete={() => {}}
            onSubmitAnswer={() => {}}
            renderReply={(reply) => (
              <CommentPost
                key={reply.id}
                post={reply as Comment}
                onUpvote={() => {}}
                onDelete={() => {}}
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
    <div className="flex-1 flex items-center justify-center p-4 min-h-0">
      <div className="bg-white w-full h-full rounded shadow-md flex flex-col p-10 overflow-hidden">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-stone-900 mb-1">
            Lecture 5: Recursion &amp; Binary Search
          </h2>
          <p className="text-sm text-stone-400">CSC108 — Introduction to Computer Science</p>
        </div>
        <div className="flex-1 space-y-5 overflow-hidden">
          <div>
            <h3 className="text-lg font-semibold text-stone-800 mb-2">Binary Search Algorithm</h3>
            <ul className="space-y-1.5 text-sm text-stone-600 list-disc pl-5">
              <li>
                Works on <span className="font-semibold text-stone-800">sorted</span> arrays only
              </li>
              <li>Repeatedly divides the search interval in half</li>
              <li>Compare target with the middle element</li>
              <li>
                Time complexity:{" "}
                <span className="font-mono bg-stone-100 px-1.5 py-0.5 rounded text-stone-700">
                  O(log n)
                </span>
              </li>
            </ul>
          </div>
          <div className="bg-stone-50 border border-stone-200 rounded-md p-4 font-mono text-sm leading-relaxed">
            <div className="text-stone-400 text-xs mb-2"># Python</div>
            <div>
              <span className="text-blue-600">def</span>{" "}
              <span className="text-amber-600">binary_search</span>(arr, target):
            </div>
            <div className="pl-6">
              low, high = <span className="text-green-700">0</span>,{" "}
              <span className="text-amber-600">len</span>(arr) -{" "}
              <span className="text-green-700">1</span>
            </div>
            <div className="pl-6">
              <span className="text-blue-600">while</span> low &lt;= high:
            </div>
            <div className="pl-12">
              mid = (low + high) // <span className="text-green-700">2</span>
            </div>
            <div className="pl-12">
              <span className="text-blue-600">if</span> arr[mid] == target:{" "}
              <span className="text-blue-600">return</span> mid
            </div>
            <div className="pl-12">
              <span className="text-blue-600">elif</span> arr[mid] &lt; target: low = mid +{" "}
              <span className="text-green-700">1</span>
            </div>
            <div className="pl-12">
              <span className="text-blue-600">else</span>: high = mid -{" "}
              <span className="text-green-700">1</span>
            </div>
            <div className="pl-6">
              <span className="text-blue-600">return</span> -
              <span className="text-green-700">1</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-stone-100 mt-4 shrink-0">
          <span className="text-xs text-stone-400">Prof. Williams</span>
          <span className="text-xs text-stone-400">5 / 24</span>
        </div>
      </div>
    </div>
  );
}

// ===================================================================
// SCENE 1: "Go Live & Share Slides" — Prof dashboard
// ===================================================================

function Scene_GoLive() {
  const courses = [
    { id: "1", name: "CSC108", full: "Introduction to Computer Science", semester: "Winter 2026" },
    { id: "2", name: "CSC148", full: "Data Structures", semester: "Winter 2026" },
    {
      id: "3",
      name: "CSC236",
      full: "Introduction to the Theory of Computation",
      semester: "Winter 2026",
    },
  ];

  return (
    <div className="flex flex-col min-h-full bg-stone-50">
      <MockNav />
      <div className="flex-1 max-w-6xl mx-auto w-full px-8 py-10">
        <div className="mb-10 flex items-start justify-between">
          <div>
            <h2 className="text-4xl font-extrabold text-stone-900 tracking-tight mb-2">
              My Lectures
            </h2>
            <p className="text-lg text-stone-500">Manage your lectures and start live sessions.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 text-white rounded-md text-sm font-semibold hover:bg-stone-800 transition-colors">
            + Create Lecture
          </button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, i) => (
            <div
              key={course.id}
              className={`group relative overflow-hidden flex flex-col p-6 sm:p-8 rounded-md transition-all duration-300 bg-white border-2 min-h-[20rem] ${
                i === 0
                  ? "border-stone-200 shadow-md hover:border-stone-300"
                  : "border-stone-100 hover:border-stone-200"
              }`}
            >
              <div className="flex items-start justify-between w-full mb-6">
                <div className="w-12 h-12 rounded-md flex items-center justify-center shrink-0 bg-stone-50 text-stone-500">
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>
              <div className="flex flex-col gap-1 mt-auto">
                <h3 className="font-extrabold text-3xl tracking-tight text-stone-900">
                  {course.name}
                </h3>
                <p className="text-sm text-stone-400">{course.full}</p>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-stone-100 text-sm font-medium text-stone-400 mb-4">
                <Calendar className="w-4 h-4" />
                {course.semester}
              </div>
              <div className="flex flex-col gap-2 w-full mt-auto">
                <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-stone-900 hover:bg-green-600 text-white rounded-md font-semibold text-sm transition-colors">
                  <Radio className="w-4 h-4" />
                  Start Live Session
                </button>
                <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-md font-medium text-sm transition-colors">
                  <Settings className="w-4 h-4" />
                  Manage Lecture
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===================================================================
// SCENE 2: "Engage With Your Class" — Live split view
// ===================================================================

function Scene_Interactive() {
  const [commentView, setCommentView] = useState<"all" | "unresolved" | "resolved">("all");
  const [isAnonymous, setIsAnonymous] = useState(false);

  return (
    <div className="flex h-full bg-background text-foreground overflow-hidden">
      {/* Slide panel */}
      <div className="flex-1 flex flex-col bg-stone-100 min-w-0">
        <MockSlide />
        <div className="flex shrink-0 items-center justify-center gap-3 p-4 border-t border-stone-200 bg-stone-50 overflow-x-auto">
          <span className="flex items-center gap-1.5 h-9 px-3 bg-green-100 text-green-700 rounded-md text-sm font-medium">
            <Radio className="w-3.5 h-3.5" />
            Live
          </span>
          <span className="flex items-center gap-1.5 h-9 px-3 bg-stone-100 text-stone-700 rounded-md text-sm font-medium border border-stone-200">
            <Users className="w-3.5 h-3.5" />
            47
          </span>
          <div className="w-px h-6 bg-stone-200 mx-1" />
          <button className="w-9 h-9 flex items-center justify-center bg-stone-900 hover:bg-stone-700 text-stone-50 rounded-md text-sm font-medium">
            &larr;
          </button>
          <span className="text-sm text-stone-600 font-medium tabular-nums">5 / 24</span>
          <button className="w-9 h-9 flex items-center justify-center bg-stone-900 hover:bg-stone-700 text-stone-50 rounded-md text-sm font-medium">
            &rarr;
          </button>
          <div className="w-px h-6 bg-stone-200 mx-1" />
          <button className="flex items-center gap-1.5 h-9 px-3 bg-red-100 hover:bg-red-200 text-red-600 rounded-md text-sm font-medium">
            <Square className="w-3.5 h-3.5" />
            End Lecture
          </button>
        </div>
      </div>

      <div className="w-px bg-stone-200 shrink-0" />

      {/* Chat panel */}
      <div className="w-[440px] shrink-0 flex flex-col bg-background text-foreground relative">
        <MockChatHeader title="CSC108 Live" answerMode="instructors_only" />
        <div className="flex-1 relative min-h-0">
          <div className="absolute top-0 left-0 right-0 z-[5] h-24 pointer-events-none backdrop-blur-xl bg-background [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <div className="absolute top-0 w-full z-10 flex justify-center py-2 pointer-events-none">
            <div className="w-full max-w-sm px-4 pointer-events-auto">
              <FilterTabs commentView={commentView} setCommentView={setCommentView} />
            </div>
          </div>
          <div className="absolute inset-0 overflow-y-auto px-4 pt-16">
            <MockQuestionList questions={MOCK_QUESTIONS} commentView={commentView} />
          </div>
        </div>
        <ChatInput
          onSubmit={() => {}}
          isAnonymous={isAnonymous}
          onAnonymousChange={setIsAnonymous}
        />
      </div>
    </div>
  );
}

// ===================================================================
// SCENE 3: "Manage & Export" — End session modal
// ===================================================================

function Scene_ManageExport() {
  const [commentView, setCommentView] = useState<"all" | "unresolved" | "resolved">("all");
  const [isAnonymous, setIsAnonymous] = useState(false);

  return (
    <div className="relative h-full overflow-hidden">
      {/* Session view behind the modal */}
      <div className="flex h-full bg-background text-foreground">
        <div className="flex-1 flex flex-col bg-stone-100 min-w-0">
          <MockSlide />
          <div className="flex shrink-0 items-center justify-center gap-3 p-4 border-t border-stone-200 bg-stone-50 overflow-x-auto">
            <span className="flex items-center gap-1.5 h-9 px-3 bg-green-100 text-green-700 rounded-md text-sm font-medium">
              <Radio className="w-3.5 h-3.5" />
              Live
            </span>
            <span className="flex items-center gap-1.5 h-9 px-3 bg-stone-100 text-stone-700 rounded-md text-sm font-medium border border-stone-200">
              <Users className="w-3.5 h-3.5" />
              47
            </span>
            <div className="w-px h-6 bg-stone-200 mx-1" />
            <button className="flex items-center gap-1.5 h-9 px-3 bg-red-100 text-red-600 rounded-md text-sm font-medium">
              <Square className="w-3.5 h-3.5" />
              End Lecture
            </button>
          </div>
        </div>
        <div className="w-px bg-stone-200 shrink-0" />
        <div className="w-[440px] shrink-0 flex flex-col bg-background text-foreground relative">
          <MockChatHeader title="CSC108 Live" answerMode="instructors_only" />
          <div className="flex-1 relative min-h-0">
            <div className="absolute top-0 left-0 right-0 z-[5] h-24 pointer-events-none backdrop-blur-xl bg-background [mask-image:linear-gradient(to_bottom,black,transparent)]" />
            <div className="absolute top-0 w-full z-10 flex justify-center py-2 pointer-events-none">
              <div className="w-full max-w-sm px-4 pointer-events-auto">
                <FilterTabs commentView={commentView} setCommentView={setCommentView} />
              </div>
            </div>
            <div className="absolute inset-0 overflow-y-auto px-4 pt-16">
              <MockQuestionList questions={MOCK_QUESTIONS.slice(0, 3)} commentView={commentView} />
            </div>
          </div>
          <ChatInput
            onSubmit={() => {}}
            isAnonymous={isAnonymous}
            onAnonymousChange={setIsAnonymous}
          />
        </div>
      </div>

      {/* Modal overlay */}
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40">
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
// Main page
// ---------------------------------------------------------------------------

type Scene = 1 | 2 | 3;
const SCENE_LABELS: Record<Scene, string> = {
  1: "1. Go Live",
  2: "2. Engage With Your Class",
  3: "3. Manage & Export",
};

export default function DemoProfPage() {
  const [scene, setScene] = useState<Scene>(1);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Minimal scene switcher — hide this before screenshotting */}
      <div className="bg-white border-b border-stone-200 px-4 py-2 flex items-center gap-2 shrink-0 z-[100]">
        <span className="text-xs font-bold text-stone-400 uppercase tracking-wider mr-1">
          Prof Onboarding:
        </span>
        {([1, 2, 3] as Scene[]).map((s) => (
          <button
            key={s}
            onClick={() => setScene(s)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              scene === s
                ? "bg-stone-900 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {SCENE_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Scene — fills remaining height */}
      <div className="flex-1 min-h-0 overflow-auto">
        {scene === 1 && <Scene_GoLive />}
        {scene === 2 && <Scene_Interactive />}
        {scene === 3 && <Scene_ManageExport />}
      </div>
    </div>
  );
}
