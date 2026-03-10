import { PLACEHOLDER_USERS } from "@/utils/placeholder";
import { Course, User } from "@/utils/types";
import { PLACEHOLDER_COURSES } from "@/utils/placeholder";
import Link from "next/link";

export default function renderCourseButtons() {
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
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto ">
          {validcourses.map((course, index) => (
            <Link
              key={index}
              href="/room"
              className="
             hover:-translate-y-2  hover:shadow-2xl relative overflow-hidden
             flex flex-col items-center justify-center
             py-6 px-4 duration-300 text-center rounded-2xl
              shadow-xl backdrop-blur-[1.5px] border-4 border-blue-50
              h-[15rem] group"
            >
              <div className="relative z-10 flex flex-col items-center gap-3">
                <h3 className="font-bold text-3xl text-foreground transition-colors duration-300 ">
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
            </Link>
          ))}
        </div>
      </div>
    );
  } else {
    return (
      <div className="p-4 py-10 w-full backdrop-blur-[1.5px] rounded-2xl flex items-center justify-center h-120">
        <h1 className="text-center font-bold text-2xl">No Classes Available Currently </h1>
      </div>
    );
  }
}
