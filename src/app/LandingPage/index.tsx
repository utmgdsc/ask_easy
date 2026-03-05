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
      <div
        className="flex-1 p-4 py-10  w-full backdrop-blur-[1.5px]
             border-4 rounded-2xl border-blue-50 bg-yellow-050"
      >
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto text-center">
          {validcourses.map((course, index) => (
            <Link
              key={index}
              href="/room"
              className="flex flex-col items-center justify-center
             py-6 px-4 transition-all duration-300 ease-in-out text-center rounded-2xl
             bg-white/80 shadow-lg backdrop-blur-md border-2 border-slate-100
             hover:-translate-y-2 hover:shadow-2xl hover:border-green-100 hover:bg-white
             h-[15rem] group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-100/0 via-green-100/0 to-green-100/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
              <div className="relative z-10 flex flex-col items-center gap-3">
                <h3 className="font-bold text-3xl text-slate-800 transition-colors duration-300 group-hover:text-green-500">
                  {course.name}
                </h3>
                <h3 className="text-lg text-slate-600 font-medium">{course.professor}</h3>
                <div className="flex gap-3 mt-2 text-sm text-slate-500 justify-center font-medium">
                  <span className="px-3 py-1 bg-slate-100/80 rounded-full group-hover:bg-green-100 group-hover:text-green-700 transition-colors duration-300">
                    Begins: {course.beginDate}
                  </span>
                  <span className="px-3 py-1 bg-slate-100/80 rounded-full group-hover:bg-green-100 group-hover:text-green-700 transition-colors duration-300">
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
    <div className="overflow-y-auto dot-grid min-h-screen flex flex-col">
      <h1
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
      </h1>

      <div className="flex-1 pt-32 pb-10">
        <h1 className="text-4xl py-4 text-center">Classrooms</h1>
        <div className="flex-1 px-4 py-4">{renderCourseButtons()}</div>
      </div>

      <footer className=" flex text-white justify-center">
        <div className=" flex-1 py-8 gap-5 flex bg-black grid md:grid-cols-2 gap-8 items-center border-blue-50">
          <div className="text-left mx-auto ">
            <h1 className="font-bold py-1 text-xl">Contact Us:</h1>
            <p>support@askeasy.com</p>
          </div>

          <div className="text-left mx-auto">
            <h1 className="font-bold py-1 text-xl">Support:</h1>
            <p>For Professors</p>
            <p>For Students</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
