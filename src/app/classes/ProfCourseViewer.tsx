"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Settings, BookOpen, Calendar, PlusCircle, Radio, Users, CheckCircle } from "lucide-react";

import ManageClassModal, { type CourseForModal } from "./ManageClassModal";

interface Course {
  id: string;
  code: string;
  name: string;
  semester: string;
  role: string;
}

interface ActiveSession {
  id: string;
  joinCode: string;
  courseId: string;
}

export default function ProfCourseButtons() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeSessions, setActiveSessions] = useState<Map<string, ActiveSession>>(new Map());
  const [clickedCourseId, setClickedCourseId] = useState("");
  const [goingLive, setGoingLive] = useState<string | null>(null);
  const [liveInfo, setLiveInfo] = useState<{ sessionId: string; joinCode: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [endingSession, setEndingSession] = useState<string | null>(null);
  const [managingCourse, setManagingCourse] = useState<CourseForModal | null>(null);

  useEffect(() => {
    fetch("/api/courses")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.courses) {
          setCourses(data.courses.filter((c: Course) => c.role === "PROFESSOR"));
        }
      })
      .catch(() => null);

    fetch("/api/sessions")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.sessions) {
          const map = new Map<string, ActiveSession>();
          for (const s of data.sessions) {
            map.set(s.courseId, { id: s.id, joinCode: s.joinCode, courseId: s.courseId });
          }
          setActiveSessions(map);
        }
      })
      .catch(() => null);
  }, []);

  function handleCourseClick(courseId: string) {
    if (clickedCourseId === courseId) return; // Don't close when clicking expanded card
    setClickedCourseId(courseId);
    setLiveInfo(null);
    setError(null);
  }

  function handleRejoin(courseId: string, courseName: string) {
    const session = activeSessions.get(courseId);
    if (session) {
      router.push(`/room?sessionId=${session.id}&title=${encodeURIComponent(courseName)}`);
    }
  }

  async function handleGoLive(courseId: string, courseName: string) {
    setGoingLive(courseId);
    setError(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, title: `${courseName} Live Session` }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to start session.");
        return;
      }
      const { session } = data;
      setLiveInfo({ sessionId: session.id, joinCode: session.joinCode });
      setTimeout(() => {
        router.push(`/room?sessionId=${session.id}&title=${encodeURIComponent(courseName)}`);
      }, 1500);
    } catch {
      setError("Failed to start session. Please try again.");
    } finally {
      setGoingLive(null);
    }
  }

  async function handleEndSession(courseId: string, sessionId: string) {
    setEndingSession(courseId);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to end session.");
        return;
      }
      setActiveSessions((prev) => {
        const newMap = new Map(prev);
        newMap.delete(courseId);
        return newMap;
      });
      setLiveInfo(null);
    } catch {
      setError("Failed to end session. Please try again.");
    } finally {
      setEndingSession(null);
    }
  }

  function handleOpenManage(e: React.MouseEvent, course: Course) {
    e.stopPropagation();
    setManagingCourse({
      id: course.id,
      code: course.code,
      name: course.name,
      semester: course.semester,
    });
  }

  function handleRenamed(courseId: string, code: string, semester: string) {
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, code, name: code, semester } : c))
    );
    setManagingCourse((prev) =>
      prev?.id === courseId ? { ...prev, code, name: code, semester } : prev
    );
  }

  function handleDeleted(courseId: string) {
    setCourses((prev) => prev.filter((c) => c.id !== courseId));
    setClickedCourseId("");
  }

  if (courses.length > 0) {
    return (
      <>
        <div className="flex-1 w-full py-8 text-left">
          <div className="max-w-6xl mx-auto w-full mb-10 flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-bold text-stone-900 tracking-tight mb-2">My Lectures</h2>
              <p className="text-lg text-stone-500">
                Manage your lectures and start live sessions.
              </p>
            </div>

            <Link
              href="/create-class"
              className="hidden sm:flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <PlusCircle className="w-5 h-5" />
              Create Lecture
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto relative">
            {courses.map((course) => {
              const isActive = activeSessions.has(course.id);
              const isExpanded = clickedCourseId === course.id;

              return (
                <div
                  key={course.id}
                  onClick={() => handleCourseClick(course.id)}
                  className={`
                    group relative overflow-hidden flex flex-col
                    p-6 sm:p-8 rounded-2xl transition-all duration-300
                    bg-white border-2 shadow-sm
                    ${
                      isExpanded
                        ? "border-green-400 shadow-xl ring-4 ring-green-50 scale-[1.02] z-10"
                        : "border-stone-100 hover:border-green-300 hover:shadow-lg cursor-pointer h-[16rem]"
                    }
                  `}
                >
                  {/* Close button for expanded view (overlay covers entire card top area to allow easily clicking away while inside the card) */}
                  {isExpanded && (
                    <div
                      className="absolute inset-x-0 top-0 h-16 cursor-pointer z-0 opacity-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setClickedCourseId("");
                      }}
                    />
                  )}

                  <div className="flex items-start justify-between w-full mb-6 relative z-10">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shrink-0 ${isExpanded ? "bg-green-500 text-white" : "bg-stone-50 text-stone-600 group-hover:bg-green-50 group-hover:text-green-500 group-hover:scale-110"}`}
                    >
                      <BookOpen className="w-6 h-6" />
                    </div>

                    {/* Active session badge */}
                    {isActive && !isExpanded && (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-md border border-green-200 shadow-sm animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        LIVE
                      </span>
                    )}

                    {isExpanded && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setClickedCourseId("");
                        }}
                        className="text-stone-400 hover:text-stone-700 p-2 rounded-md hover:bg-stone-100 transition-colors"
                      >
                        <span className="sr-only">Close</span>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 mt-auto relative z-10">
                    <h3
                      className={`font-bold tracking-tight transition-colors line-clamp-2 ${isExpanded ? "text-3xl text-stone-900 border-b border-stone-100 pb-4 mb-4" : "text-3xl text-stone-900 group-hover:text-green-600"}`}
                    >
                      {course.name}
                    </h3>
                  </div>

                  {!isExpanded ? (
                    <div className="flex items-center gap-2 mt-6 pt-6 border-t border-stone-100 w-full text-sm font-medium text-stone-400 relative z-10">
                      <Calendar className="w-4 h-4" />
                      {course.semester}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 relative z-10">
                      <p className="text-sm font-medium text-stone-500 flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4" /> {course.semester}
                      </p>

                      {liveInfo ? (
                        <div className="bg-green-50 rounded-xl p-5 border border-green-100 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                          <CheckCircle className="w-8 h-8 text-green-500" />
                          <p className="text-sm font-bold text-green-800">Session started!</p>
                          <p className="text-xs text-green-600 font-medium animate-pulse mt-1">
                            Redirecting to room…
                          </p>
                        </div>
                      ) : error ? (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm font-medium">
                          {error}
                        </div>
                      ) : isActive ? (
                        <div className="bg-green-50/50 rounded-xl p-5 border border-green-200 flex flex-col items-center gap-4">
                          <div className="flex items-center gap-2 text-green-700 font-bold">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            Session in Progress
                          </div>

                          <div className="w-full flex flex-col gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRejoin(course.id, course.name);
                              }}
                              className="w-full py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 font-semibold shadow-sm transition-colors"
                            >
                              Rejoin Session
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEndSession(course.id, activeSessions.get(course.id)!.id);
                              }}
                              disabled={endingSession === course.id}
                              className="w-full py-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 font-semibold shadow-sm transition-colors disabled:opacity-60"
                            >
                              {endingSession === course.id ? "Ending..." : "End Lecture"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGoLive(course.id, course.name);
                            }}
                            disabled={goingLive === course.id}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-stone-900 text-white rounded-xl hover:bg-green-600 font-semibold shadow-sm transition-colors disabled:opacity-60 disabled:hover:bg-stone-900"
                          >
                            <Radio
                              className={`w-5 h-5 ${goingLive === course.id ? "animate-pulse" : ""}`}
                            />
                            {goingLive === course.id ? "Starting Session…" : "Start Live Session"}
                          </button>

                          <button
                            onClick={(e) => handleOpenManage(e, course)}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl transition-colors font-medium text-sm"
                          >
                            <Settings className="w-4 h-4" />
                            Manage Lecture
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="max-w-6xl mx-auto w-full mt-8 sm:hidden">
            <Link
              href="/create-class"
              className="flex items-center justify-center gap-2 w-full py-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-all shadow-sm"
            >
              <PlusCircle className="w-5 h-5" />
              Create New Lecture
            </Link>
          </div>
        </div>

        {managingCourse && (
          <ManageClassModal
            course={managingCourse}
            onClose={() => setManagingCourse(null)}
            onRenamed={handleRenamed}
            onDeleted={handleDeleted}
          />
        )}
      </>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center text-green-500 mb-6">
        <Users className="w-10 h-10" />
      </div>
      <h1 className="font-bold text-3xl text-stone-900 tracking-tight mb-2">No Lectures Yet</h1>
      <p className="text-stone-500 text-lg max-w-md text-center mb-8">
        You haven&apos;t created any lectures. Create your first lecture to get started with
        AskEasy.
      </p>

      <Link
        href="/create-class"
        className="flex items-center gap-2 px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-1 text-lg"
      >
        <PlusCircle className="w-6 h-6" />
        Create a Lecture
      </Link>
    </div>
  );
}
