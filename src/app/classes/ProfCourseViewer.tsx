import { PLACEHOLDER_USERS } from "@/utils/placeholder";
import { Course, User } from "@/utils/types";
import { PLACEHOLDER_COURSES } from "@/utils/placeholder";
import { useState } from "react";
import Link from "next/link";

export default function ProfCourseButtons() {
  const [clickedCourseId, setClickedCourseId] = useState("");
  const user: User = PLACEHOLDER_USERS[1];
  const validcourses: Course[] = [];

  for (let i = 0; i < PLACEHOLDER_COURSES.length; i++) {
    if (user.courseids != null && user.courseids.includes(PLACEHOLDER_COURSES[i].id)) {
      validcourses.push(PLACEHOLDER_COURSES[i]);
    }
  }

  function handleCourseClick(courseId: string) {
    setClickedCourseId(clickedCourseId === courseId ? "" : courseId);
  }
  if (validcourses.length > 0) {
    return (
      <div className="flex-1 p-4 py-10 w-full">
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {validcourses.map((course, index) => (
            <div
              key={index}
              onClick={() => handleCourseClick(course.name)}
              className={`
                hover:-translate-y-2 hover:shadow-2xl relative overflow-hidden
                flex flex-col items-center justify-center
                py-6 px-4 duration-300 text-center rounded-2xl
                shadow-xl backdrop-blur-[1.5px] border-4 border-blue-50
                h-[15rem] group cursor-pointer
                ${clickedCourseId === course.name ? " border-blue-300" : ""}
              `}
            >
              {clickedCourseId === course.name ? (
                // Show buttons when clicked
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <h3 className="font-bold text-3xl text-foreground">{course.name}</h3>
                  <div className="flex gap-4">
                    <Link
                      href={`/room/`}
                      className="px-6 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 font-medium"
                      onClick={(e) => e.stopPropagation()} // Prevent card click when clicking button
                    >
                      Go Live
                    </Link>
                    <Link
                      href={`/edit-class?course=${encodeURIComponent(course.name)}`}
                      className="rounded-lg bg-stone-100 hover:bg-stone-300 px-4 py-2 text-md font-medium text-stone-900 transition-colors"
                      onClick={(e) => e.stopPropagation()} // Prevent card click when clicking button
                    >
                      Edit Class
                    </Link>
                  </div>
                </div>
              ) : (
                // Show course details when not clicked
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <h3 className="font-bold text-3xl text-foreground transition-colors duration-300">
                    {course.name}
                  </h3>
                  <h3 className="text-lg text-stone-800 font-medium">{course.professor}</h3>
                  <div className="flex gap-3 mt-2 text-sm text-stone-800 justify-center font-medium">
                    <span className="px-3 py-1 bg-stone-50 rounded-md transition-colors duration-300">
                      Begins: {course.beginDate}
                    </span>
                    <span className="px-3 py-1 bg-stone-50 rounded-md transition-colors duration-300">
                      Ends: {course.endDate}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  } else {
    return (
      <div className="p-4 py-10 w-full rounded-2xl flex items-center justify-center h-120">
        <Link
          href={"create-class"}
          className="
            hover:-translate-y-2 hover:shadow-2xl relative overflow-hidden
            flex flex-col items-center justify-center
            py-6 px-4 duration-300 text-center rounded-2xl
            shadow-xl backdrop-blur-[1.5px] border-4 border-blue-50
            h-[15rem] group cursor-pointer w-md
          "
        >
          <span className="text-2xl font-bold ">Create a Class</span>
        </Link>
      </div>
    );
  }
}
