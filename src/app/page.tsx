"use client";
import { User } from "@/utils/types";
import CourseViewer from "./components/CourseViewer";
import ProfCourseViewer from "./components/ProfCourseViewer";
import footer from "./components/footer";
import header from "./components/header";

//sample user
const placeholder_user: User = {
  username: "Hi",
  pfp: "H",
  role: "STUDENT",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col dot-grid relative">
      {header(placeholder_user)}
      <div className="overflow-y-auto flex-1 flex flex-col">
        <div className="flex-1 p-5 pt-32 pb-10 flex flex-col items-center">
          <h1 className="text-4xl font-bold py-4 text-center">Classrooms</h1>
          <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col">
            {placeholder_user.role === "PROFESSOR" ? <ProfCourseViewer /> : <CourseViewer />}
          </div>
        </div>
        {footer()}
      </div>
    </div>
  );
}
