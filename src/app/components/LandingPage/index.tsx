"use client";
import Room from "../room";
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
    <div className="flex-1 p-4 py-10  min-h-screen w-full ">
      <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto text-white text-center">
        {validcourses.map((course, index) => (
          <Link key={index} href="/room" className="block">
            <div className="bg-black py-3 mb-4 min-h-50 rounded-2xl shadow-lg hover:shadow-xl transition duration-300  overflow-hidden">
              <h3 className="font-bold text-4xl  px-4 py-2">{course.name}</h3>
              <div className=" flex-direction-coulmn items-center mb-4 ">
                <h3 className="px-4">{course.professor}</h3>
                <h3 className="px-4">{"Begins: " + course.beginDate}</h3>
                <h3 className="px-4 ">{"Ends: " + course.endDate}</h3>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className=" overflow-y-auto">
      <h1
        className="absolute items-center justify-between shadow-md top-12 left-8 right-8 z-[5] bg-white rounded-lg pw-full 
        text-2xl font-bold text-left py-2 px-4 flex"
      >
        <span className="text-lg font-bold text-black">AskEasy</span>

        <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition">
          Log in
        </button>
      </h1>

      <div className="flexflex-col py-35 min-h-screen dot-grid bg-background">
        <div className="h-screen flex flex-col">
          <h1 className="top-24 text-4xl py-4 font-bold text-center  ">Classrooms</h1>
          <div className="flex-1 px-4 space-y-6">{renderCourseButtons()}</div>
        </div>
      </div>
    </div>
  );
}

function Navbar() {
  return (
    <div>
      <header className="w-full border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          {/* Left Section */}
          <div className="flex items-center gap-3">
            {/* Brand Name */}
            <span className="text-lg font-semibold text-gray-800">AskEasy</span>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            <button className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition">
              Log in
            </button>
          </div>
        </div>
      </header>
      <div className="flexflex-col bg-background">
        <div className="h-screen flex flex-col">
          <h1 className="text-4xl py-4 font-bold text-center border-b">Classrooms</h1>
          <div className="flex-1 px-4 space-y-6">{renderCourseButtons()}</div>
        </div>
      </div>
    </div>
  );
}
