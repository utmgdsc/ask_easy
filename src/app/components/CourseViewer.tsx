"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Calendar, ArrowRight, Video, ChevronLeft, LayoutGrid } from "lucide-react";

interface Course {
  id: string;
  code: string;
  name: string;
  semester: string;
  role: string;
}

interface ActiveSession {
  id: string;
  title: string;
  joinCode: string;
  status: string;
  course: { code: string; name: string };
}

export default function CourseViewer() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [joining, setJoining] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  const fetchSessions = () => {
    fetch("/api/sessions")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.sessions) setActiveSessions(data.sessions);
      })
      .catch(() => null);
  };

  useEffect(() => {
    fetch("/api/courses")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.courses) {
          setCourses(data.courses.filter((c: Course) => c.role === "STUDENT" || c.role === "TA"));
        }
      })
      .catch(() => null);

    fetchSessions();

    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  async function handleJoin(session: ActiveSession) {
    setJoining(session.id);
    setJoinError(null);
    try {
      const res = await fetch(`/api/sessions/join/${session.joinCode}`, {
        method: "POST",
      });
      if (res.ok || res.status === 409) {
        router.push(
          `/room?sessionId=${session.id}&title=${encodeURIComponent(session.course.name)}`
        );
        return;
      }
      const data = await res.json();
      setJoinError(data.error ?? "Failed to join session.");
    } catch {
      setJoinError("Failed to join. Please try again.");
    } finally {
      setJoining(null);
    }
  }

  if (selectedCourseId !== null) {
    const course = courses.find((c) => c.id === selectedCourseId);
    const courseSessions = activeSessions.filter((s) => s.course.name === course?.name);

    return (
      <div className="flex-1 w-full flex flex-col animation-fade-in py-8">
        <div className="max-w-6xl mx-auto w-full mb-10 flex flex-col gap-4">
          <button
            onClick={() => {
              setSelectedCourseId(null);
              setJoinError(null);
            }}
            className="flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors font-medium w-fit group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Lectures
          </button>

          <div className="flex flex-col gap-2">
            <h2 className="text-4xl font-bold text-stone-900 tracking-tight">Active Sessions</h2>
            <p className="text-stone-500 text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {course?.name}
            </p>
          </div>
        </div>

        {joinError && (
          <div className="max-w-6xl mx-auto w-full mb-6">
            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3 font-medium">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              {joinError}
            </div>
          </div>
        )}

        {courseSessions.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto w-full">
            {courseSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => handleJoin(session)}
                disabled={joining === session.id}
                className="
                  group relative overflow-hidden text-left flex flex-col items-start
                  p-6 sm:p-8 rounded-2xl transition-all duration-300
                  bg-white border-2 border-stone-100 hover:border-green-400
                  shadow-sm hover:shadow-xl
                  disabled:opacity-60 disabled:pointer-events-none disabled:hover:border-stone-100 disabled:hover:shadow-sm
                "
              >
                <div className="w-12 h-12 rounded-xl bg-stone-50 text-stone-600 flex items-center justify-center mb-6 group-hover:bg-green-50 group-hover:text-green-500 group-hover:scale-110 transition-all shrink-0">
                  <Video className="w-6 h-6" />
                </div>

                <h3 className="font-bold text-2xl text-stone-900 mb-3 tracking-tight group-hover:text-green-600 transition-colors line-clamp-2">
                  {session.title}
                </h3>

                <div className="flex items-center gap-2 mt-auto pt-8 w-full">
                  <span className="text-sm font-semibold text-stone-500 bg-stone-100 px-3 py-1.5 rounded-lg group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
                    {session.course.name}
                  </span>

                  <div className="ml-auto flex items-center gap-1.5 text-sm font-medium text-stone-400 group-hover:text-green-600 transition-colors">
                    {joining === session.id ? "Joining..." : "Join"}
                    <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col items-center justify-center min-h-[40vh] bg-stone-50/50 rounded-3xl border-2 border-dashed border-stone-200 p-8">
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-4">
              <Video className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-2xl text-stone-700 mb-2">No Active Sessions</h3>
            <p className="text-stone-500 text-center max-w-sm">
              Your professor hasn&apos;t started any live sessions for {course?.name} yet.
            </p>
          </div>
        )}
      </div>
    );
  }

  if (courses.length > 0) {
    return (
      <div className="flex-1 w-full py-8 text-left">
        <div className="max-w-6xl mx-auto w-full mb-10">
          <h2 className="text-4xl font-bold text-stone-900 tracking-tight mb-2">My Lectures</h2>
          <p className="text-lg text-stone-500">Select a lecture to join its active sessions.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {courses.map((course) => (
            <div
              key={course.id}
              onClick={() => setSelectedCourseId(course.id)}
              className="
                group relative overflow-hidden flex flex-col
                p-6 sm:p-8 rounded-2xl transition-all duration-300 cursor-pointer
                bg-white border-2 border-stone-100 hover:border-green-400
                shadow-sm hover:shadow-xl h-[16rem]
              "
            >
              <div className="flex items-start justify-between w-full mb-6">
                <div className="w-12 h-12 rounded-xl bg-stone-50 text-stone-600 flex items-center justify-center group-hover:bg-green-50 group-hover:text-green-500 group-hover:scale-110 transition-all shrink-0">
                  <BookOpen className="w-6 h-6" />
                </div>

                {/* Active sessions badge */}
                {activeSessions.some((s) => s.course.name === course.name) && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200 shadow-sm animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    LIVE
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1 mt-auto">
                <h3 className="font-bold text-3xl text-stone-900 tracking-tight group-hover:text-green-600 transition-colors line-clamp-2">
                  {course.name}
                </h3>
              </div>

              <div className="flex items-center gap-2 mt-6 pt-6 border-t border-stone-100 w-full text-sm font-medium text-stone-400">
                <Calendar className="w-4 h-4" />
                {course.semester}
                <ArrowRight className="w-4 h-4 ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-green-500 transition-all" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-6">
        <LayoutGrid className="w-10 h-10" />
      </div>
      <h1 className="font-bold text-3xl text-stone-900 tracking-tight mb-2">No Lectures Found</h1>
      <p className="text-stone-500 text-lg max-w-md text-center">
        You are not enrolled in any lectures yet.
      </p>
    </div>
  );
}
