"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Settings } from "lucide-react";

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
    setClickedCourseId(clickedCourseId === courseId ? "" : courseId);
    setLiveInfo(null);
    setError(null);
  }

  function handleRejoin(courseId: string, courseCode: string) {
    const session = activeSessions.get(courseId);
    if (session) {
      router.push(`/room?sessionId=${session.id}&title=${encodeURIComponent(courseCode)}`);
    }
  }

  async function handleGoLive(courseId: string, courseCode: string) {
    setGoingLive(courseId);
    setError(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, title: `${courseCode} Live Session` }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to start session.");
        return;
      }
      const { session } = data;
      setLiveInfo({ sessionId: session.id, joinCode: session.joinCode });
      setTimeout(() => {
        router.push(`/room?sessionId=${session.id}&title=${encodeURIComponent(courseCode)}`);
      }, 1500);
    } catch {
      setError("Failed to start session. Please try again.");
    } finally {
      setGoingLive(null);
    }
  }

  function handleOpenManage(e: React.MouseEvent, course: Course) {
    e.stopPropagation();
    setManagingCourse({ id: course.id, code: course.code, name: course.name, semester: course.semester });
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
        <div className="flex-1 p-4 py-10 w-full">
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {courses.map((course) => (
              <div
                key={course.id}
                onClick={() => handleCourseClick(course.id)}
                className={`
                  hover:-translate-y-2 hover:shadow-2xl relative overflow-hidden
                  flex flex-col items-center justify-center
                  py-6 px-4 duration-300 text-center rounded-2xl
                  shadow-xl bg-white border-4 border-blue-50
                  h-[15rem] group cursor-pointer
                  ${clickedCourseId === course.id ? "border-blue-300" : ""}
                `}
              >
                {clickedCourseId === course.id ? (
                  <div className="relative z-10 flex flex-col items-center gap-4 w-full px-4">
                    <h3 className="font-bold text-3xl text-foreground">{course.code}</h3>
                    <p className="text-sm text-stone-500">{course.semester}</p>

                    {liveInfo ? (
                      <div className="flex flex-col items-center gap-1">
                        <p className="text-sm font-medium text-green-700">Session started!</p>
                        <p className="text-xs text-stone-600">
                          Join code:{" "}
                          <span className="font-mono font-bold text-stone-900">
                            {liveInfo.joinCode}
                          </span>
                        </p>
                        <p className="text-xs text-stone-400">Redirecting to room…</p>
                      </div>
                    ) : error ? (
                      <p className="text-xs text-red-600">{error}</p>
                    ) : activeSessions.has(course.id) ? (
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-xs text-stone-500">
                          Session in progress &mdash; join code:{" "}
                          <span className="font-mono font-bold text-stone-900">
                            {activeSessions.get(course.id)!.joinCode}
                          </span>
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRejoin(course.id, course.code);
                          }}
                          className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
                        >
                          Rejoin Session
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGoLive(course.id, course.code);
                          }}
                          disabled={goingLive === course.id}
                          className="px-6 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 font-medium disabled:opacity-60"
                        >
                          {goingLive === course.id ? "Starting…" : "Go Live"}
                        </button>
                        <button
                          onClick={(e) => handleOpenManage(e, course)}
                          title="Manage class"
                          className="w-9 h-9 flex items-center justify-center bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <h3 className="font-bold text-3xl text-foreground transition-colors duration-300">
                      {course.code}
                    </h3>
                    <p className="text-lg text-stone-800 font-medium">{course.name}</p>
                    <div className="flex gap-3 mt-2 text-sm text-stone-800 justify-center font-medium">
                      <span className="px-3 py-1 bg-stone-50 rounded-md">{course.semester}</span>
                      {activeSessions.has(course.id) && (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-md flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                          Live
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
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
    <div className="p-4 py-10 w-full rounded-2xl flex items-center justify-center h-120">
      <Link
        href="/create-class"
        className="
          hover:-translate-y-2 hover:shadow-2xl relative overflow-hidden
          flex flex-col items-center justify-center
          py-6 px-4 duration-300 text-center rounded-2xl
          shadow-xl bg-white border-4 border-blue-50
          h-[15rem] group cursor-pointer w-md
        "
      >
        <span className="text-2xl font-bold">Create a Class</span>
      </Link>
    </div>
  );
}
