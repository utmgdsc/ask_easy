"use client";
import { PLACEHOLDER_USERS } from "@/utils/placeholder";
import { Course, User } from "@/utils/types";
import { PLACEHOLDER_COURSES } from "@/utils/placeholder";
import Link from "next/link";

function renderCourseButtons() {
  const user: User = PLACEHOLDER_USERS[1];
  const validcourses: Course[] = [];
  for (let i = 0; i < PLACEHOLDER_COURSES.length; i++) {
    if (user.courseids != null && user.courseids.includes(PLACEHOLDER_COURSES[i].id)) {
      validcourses.push(PLACEHOLDER_COURSES[i]);
    }
  }
  if (validcourses.length > 0) {
    return (
      <div className="flex-1 p-4 py-10">
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto text-center">
          {validcourses.map((course, index) => (
            <Link
              key={index}
              href="/room"
              className="flex flex-col items-center justify-center
             py-6 px-4 transition-all duration-300 ease-in-out text-center rounded-md
             bg-stone-100 shadow-lg backdrop-blur-md
             hover:-translate-y-2 hover:bg-stone-200 hover:shadow-2xl
             h-[15rem] group relative overflow-hidden"
            >
              <div className="relative z-10 flex flex-col items-center gap-3">
                <h3 className="font-bold text-3xl text-forground transition-colors duration-300 ">
                  {course.name}
                </h3>
                <h3 className="text-lg text-stone-900/50 font-medium">{course.professor}</h3>
                <div className="flex gap-3 mt-2 text-sm text-stone-900/50 justify-center font-medium">
                  <span className="px-3 py-1 bg-stone-200 rounded-md transition-colors duration-300">
                    Begins: {course.beginDate}
                  </span>
                  <span className="px-3 py-1 bg-stone-200 rounded-md transition-colors duration-300">
                    Ends: {course.endDate}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  } else {
    return (
      <div
        className="flex-1 p-4 py-10 w-full backdrop-blur-[1.5px]
    border-4 rounded-2xl border-blue-50 bg-yellow-050 
    flex items-center justify-center h-120"
      >
        <h1 className="text-center text-2xl">No Classes Available Currently </h1>
      </div>
    );
  }
}

export default function LandingPage() {
  return (
    <div className="overflow-x-hidden dot-grid min-h-[100dvh] flex flex-col w-full relative">
      <div
        className="absolute items-center justify-between shadow-md top-6
     left-7 right-7 z-[5] bg-white rounded-lg 
     text-2xl font-bold text-left py-2 px-3 flex 
     border-3 border-blue-50"
      >
        <span className="text-lg font-bold px-2">AskEasy</span>

        <div className="space-x-3">
          <button className="px-2 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium hover:bg-stone-100 transition">
            Create a Class
          </button>
          <button className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium hover:bg-stone-100 transition">
            Qr Code login
          </button>
        </div>
      </div>

      <div className="flex-1 pt-32 pb-10">
        <h1 className="text-4xl py-4 text-center font-bold">Classrooms</h1>
        <div className="flex-1 px-4 py-4">{renderCourseButtons()}</div>
      </div>

      <footer className="w-full bg-slate-950 text-slate-300 border-t border-slate-800 z-10 relative">
        <div className="max-w-6xl mx-auto px-6 py-12 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 w-full">
            <div className="flex flex-col items-center md:items-start space-y-4">
              <h2 className="text-lg font-semibold text-white tracking-wide uppercase">
                Contact Us
              </h2>
              <a
                href="mailto:[EMAIL_ADDRESS]"
                className="hover:text-blue-400 transition-colors duration-200 flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  ></path>
                </svg>
                [EMAIL_ADDRESS]
              </a>
            </div>

            <div className="flex flex-col items-center md:items-start space-y-4">
              <h2 className="text-lg font-semibold text-white tracking-wide uppercase">Support</h2>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-6">
                <a href="#" className="hover:text-blue-400 transition-colors duration-200">
                  For Professors
                </a>
                <span className="text-slate-700 hidden md:inline">•</span>
                <a href="#" className="hover:text-blue-400 transition-colors duration-200">
                  For Students
                </a>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-800/50 flex flex-col md:flex-row items-center justify-between text-sm text-slate-500 w-full gap-4">
            <p>© {new Date().getFullYear()} AskEasy. All rights reserved.</p>
            <div className="flex flex-wrap justify-center space-x-4"></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
