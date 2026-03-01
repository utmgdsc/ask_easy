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
  return (
    <div className="flex-1 p-4 py-10  w-full ">
      <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto text-white text-center">
        {validcourses.map((course, index) => (
          <Link
            key={index}
            href="/room"
            className="flex flex-col items-center justify-center
             py-6 px-4 
             transition duration-300 text-black text-center
             rounded-2xl
             bg-white-020
             shadow-xl        
             backdrop-blur-[1.2px]
             border-4 border-blue-50
             "
          >
            <h3 className="font-bold text-4xl mb-2">{course.name}</h3>

            <h3>{course.professor}</h3>
            <h3>{"Begins: " + course.beginDate}</h3>
            <h3>{"Ends: " + course.endDate}</h3>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className=" overflow-y-auto dot-grid">
      <h1
        className="absolute items-center justify-between shadow-md top-6
         left-8 right-8 z-[5] bg-white rounded-lg pw-full 
         text-2xl font-bold text-left py-2 px-4 flex 
         border-2 border-blue-50"
      >
        <span className="text-lg font-bold text-black">AskEasy</span>

        <button className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium hover:bg-stone-100 transition">
          QR Code Login
        </button>
      </h1>

      <div className="flex flex-col py-30 min-h-screen ">
        <div className="h-50 flex flex-col pb-50">
          <h1 className="top-24 text-4xl py-4 text-center  ">Classrooms</h1>
          <div className="flex-1 f-jetbrains-mono  px-4 space-y-6">{renderCourseButtons()}</div>
        </div>
      </div>
    </div>
  );
}
