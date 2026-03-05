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
        className="p-4 py-10 w-full backdrop-blur-[1.5px]
             border-4 rounded-2xl border-blue-50 bg-yellow-050"
      >
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto text-center">
          {validcourses.map((course, index) => (
            <Link
              key={index}
              href="/room"
              className="flex flex-col items-center justify-center
             py-6 px-4 transition duration-300 text-center rounded-2xl
             bg-white-020 shadow-xl backdrop-blur-[1.5px] border-4 border-blue-50
              h-[15rem] group
             "
            >
              <div className="transition duration-300 group">
                <h3 className="font-bold text-3xl ">
                  <span className="group-hover:bg-blue-400 duration-300 ">{course.name}</span>
                </h3>
                <h3>
                  <span className="group-hover:bg-blue-400 duration-300 ">{course.professor}</span>
                </h3>
                <h3 className="px-4">
                  <span className="group-hover:bg-blue-400 duration-300 ">
                    {"Begins: " + course.beginDate}
                  </span>
                </h3>
                <h3 className="px-4">
                  <span className="group-hover:bg-blue-400 duration-300 ">
                    {"Ends: " + course.endDate}
                  </span>
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  } else {
    return (
      <div
        className="p-4 py-10 w-full backdrop-blur-[1.5px]
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
    <div className="h-screen flex flex-col overflow-hidden dot-grid">
      {/* Fixed Header */}
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

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto pt-32 pb-10">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl py-4 text-center">Classrooms</h1>
          {renderCourseButtons()}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-white flex-shrink-0">
        <div className="py-8 gap-5 bg-black grid md:grid-cols-2 gap-8 items-center border-blue-50">
          <div className="text-left mx-auto">
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
