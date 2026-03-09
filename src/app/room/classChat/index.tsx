"use client";

import { useEffect, useRef, useState } from "react";

import { useRoom } from "../RoomContext";
import PostItem from "./post";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import FilterTabs from "./FilterTabs";
import type { Question, BestAnswer, Comment, Role } from "@/utils/types";

// ---------------------------------------------------------------------------
// API response types (what the REST endpoints return)
// ---------------------------------------------------------------------------

interface APIQuestion {
  id: string;
  content: string;
  visibility: "PUBLIC" | "INSTRUCTOR_ONLY";
  status: "OPEN" | "ANSWERED" | "RESOLVED";
  isAnonymous: boolean;
  upvoteCount: number;
  answerCount: number;
  slideId: string | null;
  createdAt: string;
  author: { id: string; name: string; role: Role } | null;
}

interface APIAnswer {
  id: string;
  questionId: string;
  content: string;
  isAnonymous: boolean;
  /** Nested author object returned by the answers service */
  author: { id: string; name: string; role: Role } | null;
  /** Top-level role mirror returned alongside author — used for role checks */
  authorRole: Role;
  isAccepted: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Conversion helpers
// ---------------------------------------------------------------------------

function fmt(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function apiAnswerToPost(a: APIAnswer): BestAnswer | Comment {
  const role = a.author?.role ?? a.authorRole;
  const user =
    a.isAnonymous || !a.author
      ? null
      : { id: a.author.id, username: a.author.name, pfp: "", role: a.author.role };

  // Professor answers are always treated as best answers
  if (role === "PROFESSOR") {
    return {
      id: a.id,
      type: "bestAnswer",
      user,
      timestamp: fmt(a.createdAt),
      content: a.content,
      upvotes: 0,
    };
  }
  return {
    id: a.id,
    type: "comment",
    user,
    timestamp: fmt(a.createdAt),
    content: a.content,
    upvotes: 0,
  };
}

function apiQuestionToPost(q: APIQuestion, answers: APIAnswer[]): Question {
  const user =
    q.isAnonymous || !q.author
      ? null
      : { id: q.author.id, username: q.author.name, pfp: "", role: q.author.role };

  return {
    id: q.id,
    type: "question",
    user,
    timestamp: fmt(q.createdAt),
    content: q.content,
    upvotes: q.upvoteCount,
    isResolved: q.status === "RESOLVED",
    replies: answers.map(apiAnswerToPost),
    visibility: q.visibility,
  };
}

// ---------------------------------------------------------------------------
// ClassChat
// ---------------------------------------------------------------------------

export default function ClassChat() {
  const { socket, sessionId, userId, role } = useRoom();

  const [commentView, setCommentView] = useState<"all" | "unresolved" | "resolved">("all");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answerMode, setAnswerMode] = useState<"all" | "instructors_only">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // -------------------------------------------------------------------------
  // Initial data fetch
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!sessionId || sessionId === "placeholder-session") {
      setIsLoading(false);
      return;
    }

    async function loadQuestions() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/sessions/${sessionId}/questions`, {
          headers: { "x-user-id": userId },
        });
        if (!res.ok) return;
        const data = await res.json();
        const rawQuestions: APIQuestion[] = data.questions ?? [];

        // Fetch answers in parallel for questions that have any
        const answersMap: Record<string, APIAnswer[]> = {};
        await Promise.all(
          rawQuestions
            .filter((q) => q.answerCount > 0)
            .map(async (q) => {
              const aRes = await fetch(`/api/questions/${q.id}/answers?userId=${userId}`);
              if (aRes.ok) {
                const aData = await aRes.json();
                answersMap[q.id] = aData.answers ?? [];
              }
            })
        );

        // Reverse so oldest questions appear at top, newest at bottom
        const ordered = [...rawQuestions].reverse();
        setQuestions(ordered.map((q) => apiQuestionToPost(q, answersMap[q.id] ?? [])));
      } finally {
        setIsLoading(false);
      }
    }

    loadQuestions();
  }, [sessionId, userId]);

  // -------------------------------------------------------------------------
  // Socket event listeners
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!socket) return;

    const syncAnswerMode = () => socket.emit("answer-mode:sync", { sessionId });
    if (socket.connected) syncAnswerMode();
    socket.on("connect", syncAnswerMode);

    const onQuestionCreated = (payload: {
      id: string;
      content: string;
      visibility: string;
      isAnonymous: boolean;
      slideId: string | null;
      createdAt: Date;
      authorId?: string | null;
      authorName?: string | null;
    }) => {
      const user =
        payload.isAnonymous || !payload.authorName
          ? null
          : {
              id: payload.authorId ?? undefined,
              username: payload.authorName,
              pfp: "",
              role: "STUDENT" as Role,
            };

      const newQuestion: Question = {
        id: payload.id,
        type: "question",
        user,
        timestamp: fmt(new Date(payload.createdAt).toISOString()),
        content: payload.content,
        upvotes: 0,
        isResolved: false,
        replies: [],
        visibility: payload.visibility as "PUBLIC" | "INSTRUCTOR_ONLY",
      };

      setQuestions((prev) => [...prev, newQuestion]);
    };

    const onQuestionUpdated = (payload: { id: string; upvoteCount: number }) => {
      setQuestions((prev) =>
        prev.map((q) => (q.id === payload.id ? { ...q, upvotes: payload.upvoteCount } : q))
      );
    };

    const onQuestionResolved = (payload: { id: string }) => {
      setQuestions((prev) =>
        prev.map((q) => (q.id === payload.id ? { ...q, isResolved: true } : q))
      );
    };

    const onAnswerCreated = (payload: {
      id: string;
      questionId: string;
      content: string;
      isAnonymous: boolean;
      authorId?: string;
      authorName?: string;
      authorRole: Role;
      isAccepted: boolean;
      createdAt: Date;
    }) => {
      const apiAnswer: APIAnswer = {
        id: payload.id,
        questionId: payload.questionId,
        content: payload.content,
        isAnonymous: payload.isAnonymous,
        author:
          payload.isAnonymous || !payload.authorName
            ? null
            : { id: payload.authorId ?? "", name: payload.authorName, role: payload.authorRole },
        authorRole: payload.authorRole,
        isAccepted: payload.isAccepted,
        createdAt: new Date(payload.createdAt).toISOString(),
      };
      const newReply = apiAnswerToPost(apiAnswer);

      setQuestions((prev) =>
        prev.map((q) =>
          q.id === payload.questionId ? { ...q, replies: [...q.replies, newReply] } : q
        )
      );
    };

    const onAnswerModeChanged = (payload: { mode: "all" | "instructors_only" }) => {
      setAnswerMode(payload.mode);
    };

    const onQuestionError = (payload: { message: string }) => {
      console.error("[ClassChat] question:error", payload.message);
      setQuestionError(payload.message);
    };

    socket.on("question:created", onQuestionCreated);
    socket.on("question:updated", onQuestionUpdated);
    socket.on("question:resolved", onQuestionResolved);
    socket.on("answer:created", onAnswerCreated);
    socket.on("answer-mode:changed", onAnswerModeChanged);
    socket.on("question:error", onQuestionError);

    return () => {
      socket.off("connect", syncAnswerMode);
      socket.off("question:created", onQuestionCreated);
      socket.off("question:updated", onQuestionUpdated);
      socket.off("question:resolved", onQuestionResolved);
      socket.off("answer:created", onAnswerCreated);
      socket.off("answer-mode:changed", onAnswerModeChanged);
      socket.off("question:error", onQuestionError);
    };
  }, [socket, sessionId]);

  // Scroll to bottom whenever new questions arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [questions.length]);

  // -------------------------------------------------------------------------
  // Action handlers
  // -------------------------------------------------------------------------

  const canAnswer = role === "TA" || role === "PROFESSOR" || answerMode === "all";
  const isInstructor = role === "TA" || role === "PROFESSOR";

  const handleSubmitQuestion = (content: string, isAnonymous: boolean) => {
    if (!socket) return;
    setQuestionError(null);
    socket.emit("question:create", { sessionId, content, isAnonymous });
  };

  const handleUpvote = (questionId: string) => {
    if (!socket) return;
    socket.emit("question:upvote", { questionId });
  };

  const handleResolve = (questionId: string) => {
    if (!socket) return;
    socket.emit("question:resolve", { questionId });
    // Optimistic update
    setQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, isResolved: true } : q)));
  };

  const handleSubmitAnswer = (questionId: string, content: string, isAnonymous: boolean) => {
    if (!socket) return;
    socket.emit("answer:create", { questionId, content, isAnonymous });
  };

  const handleToggleAnswerMode = () => {
    if (!socket || role !== "PROFESSOR") return;
    const newMode = answerMode === "all" ? "instructors_only" : "all";
    socket.emit("answer-mode:change", { sessionId, mode: newMode });
    setAnswerMode(newMode); // Optimistic update
  };

  // -------------------------------------------------------------------------
  // Search filter
  // -------------------------------------------------------------------------

  const filteredQuestions = (() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return questions;
    const tokens = q.split(/\s+/).filter(Boolean);
    return questions.filter((question) => {
      const haystack = [
        question.content,
        question.user?.username ?? "",
        ...question.replies.map((r) => r.content),
        ...question.replies.map((r) => r.user?.username ?? ""),
      ]
        .join(" ")
        .toLowerCase();
      return tokens.every((token) => haystack.includes(token));
    });
  })();

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex flex-col h-full bg-background text-foreground relative">
      <ChatHeader
        role={role}
        answerMode={answerMode}
        onToggleAnswerMode={handleToggleAnswerMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="flex-1 relative min-h-0">
        <div className="absolute top-0 left-0 right-0 z-[5] h-24 pointer-events-none backdrop-blur-xl bg-background [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="absolute top-0 w-full z-10 flex justify-center py-2 pointer-events-none">
          <div className="w-full max-w-sm px-4 pointer-events-auto">
            <FilterTabs commentView={commentView} setCommentView={setCommentView} />
          </div>
        </div>

        <div className="absolute inset-0 overflow-y-auto px-6 pt-16">
          <div className="max-w-4xl mx-auto space-y-4 pb-36">
            {isLoading ? (
              <div className="text-center text-stone-500 py-8 text-sm">Loading questions...</div>
            ) : questions.length === 0 ? (
              <div className="text-center text-stone-500 py-8 text-sm">
                No questions yet. Be the first to ask!
              </div>
            ) : (
              <>
                {searchQuery.trim() && (
                  <p className="text-xs text-stone-400 pb-1">
                    {filteredQuestions.length === 0
                      ? "No results"
                      : `${filteredQuestions.length} result${filteredQuestions.length === 1 ? "" : "s"}`}
                  </p>
                )}
                <div className="space-y-4">
                  {filteredQuestions.map((q) => (
                    <PostItem
                      key={q.id}
                      post={q}
                      commentView={commentView}
                      onUpvote={() => handleUpvote(q.id)}
                      onResolve={isInstructor ? () => handleResolve(q.id) : undefined}
                      canAnswer={canAnswer}
                      onSubmitAnswer={(content, isAnon) =>
                        handleSubmitAnswer(q.id, content, isAnon)
                      }
                    />
                  ))}
                </div>
              </>
            )}
            <div ref={bottomRef} />
          </div>
        </div>
      </div>

      <ChatInput
        onSubmit={handleSubmitQuestion}
        disabled={!socket}
        serverError={questionError}
        onClearError={() => setQuestionError(null)}
      />
    </div>
  );
}
