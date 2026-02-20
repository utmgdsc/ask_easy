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
    <div className="flex-1 p-4 border-t-1 min-h-screen w-full ">
      <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto text-white text-center">
        {validcourses.map((course, index) => (
          <Link key={index} href="/room" className="block">
            <div className="bg-white py-3 mb-4 min-h-50 rounded-2xl shadow-lg hover:shadow-xl transition duration-300 bg-gradient-to-r from-red-500 to-red-700 overflow-hidden">
              <div className="font-bold text-4xl  px-4 py-2">{course.name}</div>
              <div className=" flex-direction-coulmn items-center mb-4 ">
                <div className="px-4">{course.professor}</div>
                <div className="px-4">{"Begins: " + course.beginDate}</div>
                <div className="px-4 ">{"Ends: " + course.endDate}</div>
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
      <h1 className="text-2xl font-bold text-left py-2 px-4 ">AskEasy</h1>
      <div className="flexflex-col bg-background">
        <div className="h-screen flex flex-col">
          <h1 className="text-4xl py-4 font-bold text-center mb-2">Classrooms</h1>

          <div className="flex-1 px-4 space-y-6">{renderCourseButtons()}</div>
        </div>
      </div>
    </div>
  );
}
