"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
      // 409 = already enrolled — still let them into the room
      if (res.ok || res.status === 409) {
        router.push(
          `/room?sessionId=${session.id}&title=${encodeURIComponent(session.course.code)}`
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

  // Filter active sessions to only ones from courses the student is enrolled in
  const enrolledCourseIds = new Set(courses.map((c) => c.id));
  const mySessions = activeSessions.filter(
    // Show sessions from enrolled courses OR all active sessions if no course data yet
    (s) =>
      courses.length === 0 ||
      enrolledCourseIds.has(courses.find((c) => c.code === s.course.code)?.id ?? "")
  );

  if (selectedCourseId !== null) {
    const course = courses.find((c) => c.id === selectedCourseId);
    const courseSessions = activeSessions.filter((s) => s.course.code === course?.code);

    return (
      <div className="flex-1 p-4 py-10 w-full">
        <div className="max-w-6xl mx-auto mb-8">
          <button
            onClick={() => {
              setSelectedCourseId(null);
              setJoinError(null);
            }}
            className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors font-medium"
          >
            ← Back to Classes
          </button>
          <h2 className="text-4xl font-bold mt-4">{course?.code} — Active Sessions</h2>
        </div>

        {joinError && <p className="text-sm text-red-600 text-center mb-4">{joinError}</p>}

        {courseSessions.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {courseSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => handleJoin(session)}
                disabled={joining === session.id}
                className="
                  hover:-translate-y-1 hover:shadow-xl relative overflow-hidden text-left
                  flex flex-col items-start justify-center cursor-pointer
                  py-6 px-6 duration-300 rounded-xl
                  shadow-lg backdrop-blur-[1.5px] border-2 border-blue-50 bg-white/50
                  group disabled:opacity-60
                "
              >
                <h3 className="font-bold text-xl text-foreground mb-2">{session.title}</h3>
                <span className="text-sm font-medium text-stone-500 bg-stone-100 px-2 py-1 rounded">
                  {session.course.code}
                </span>
                <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-blue-500 font-medium text-sm">
                    {joining === session.id ? "Joining…" : "Join Room →"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-4 py-10 w-full backdrop-blur-[1.5px] rounded-2xl flex items-center justify-center">
            <h3 className="text-center font-bold text-2xl text-stone-600">No Active Sessions</h3>
          </div>
        )}
      </div>
    );
  }

  // Show enrolled courses, or if none yet, show all active sessions
  if (courses.length > 0) {
    return (
      <div className="flex-1 p-4 py-10 w-full">
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {courses.map((course) => (
            <div
              key={course.id}
              onClick={() => setSelectedCourseId(course.id)}
              className="
                hover:-translate-y-2 hover:shadow-2xl relative overflow-hidden
                flex flex-col items-center justify-center cursor-pointer
                py-6 px-4 duration-300 text-center rounded-2xl
                shadow-xl bg-white border-4 border-blue-50
                h-[15rem] group
              "
            >
              <div className="relative z-10 flex flex-col items-center gap-3">
                <h3 className="font-bold text-3xl text-foreground transition-colors duration-300">
                  {course.code}
                </h3>
                <div className="flex gap-3 mt-2 text-sm text-stone-800 justify-center font-medium">
                  <span className="px-3 py-1 bg-stone-50 rounded-md">{course.semester}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 py-10 w-full backdrop-blur-[1.5px] rounded-2xl flex items-center justify-center h-120">
      <h1 className="text-center font-bold text-2xl">No Classes Available Currently</h1>
    </div>
  );
}
