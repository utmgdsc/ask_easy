"use client";
import { User } from "@/utils/types";
import renderCourseButtons from "./components/CourseViewer";
import renderProfCourseButtons from "./components/ProfCourseViewer";
import footer from "./components/footer";
import header from "./components/header";

//sample user
const placeholder_user: User = {
  username: "Hi",
  pfp: "H",
  role: "PROFESSOR",
};

export default function LandingPage() {
  return (
    <div className="max-h-screen flex flex-col dot-grid relative">
      {header(placeholder_user)}
      <div className="overflow-y-auto">
        <div className="flex-1 p-5 pt-32 items-center justify-center pb-10">
          <h1 className="text-4xl font-bold py-4 text-center">Classrooms</h1>
          {placeholder_user.role === "PROFESSOR"
            ? renderProfCourseButtons()
            : renderCourseButtons()}
        </div>
        {footer()}
      </div>
    </div>
  );
}
