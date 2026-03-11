import { useState } from "react";
import { useRouter } from "next/navigation";
import { PLACEHOLDER_USERS, PLACEHOLDER_COURSES, PLACEHOLDER_LECTURES } from "@/utils/placeholder";
import { Course, User, Lecture } from "@/utils/types";

export default function CourseViewer() {
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const router = useRouter();

  const user: User = PLACEHOLDER_USERS[1];
  const validcourses: Course[] = [];

  for (let i = 0; i < PLACEHOLDER_COURSES.length; i++) {
    if (user.courseids != null && user.courseids.includes(PLACEHOLDER_COURSES[i].id)) {
      validcourses.push(PLACEHOLDER_COURSES[i]);
    }
  }

  function startRoom() {
    router.push("/room");
  }

  if (selectedCourseId !== null) {
    const course = validcourses.find((c) => c.id === selectedCourseId);
    const courseLectures = PLACEHOLDER_LECTURES.filter((l) => l.courseId === selectedCourseId);

    return (
      <div className="flex-1 p-4 py-10 w-full">
        <div className="max-w-6xl mx-auto mb-8">
          <button
            onClick={() => setSelectedCourseId(null)}
            className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors font-medium"
          >
            ← Back to Classes
          </button>
          <h2 className="text-4xl font-bold mt-4">{course?.name} - Lectures</h2>
        </div>

        {courseLectures.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {courseLectures.map((lecture) => (
              <div
                key={lecture.id}
                onClick={startRoom}
                className="
                 hover:-translate-y-1 hover:shadow-xl relative overflow-hidden
                 flex flex-col items-start justify-center cursor-pointer
                 py-6 px-6 duration-300 rounded-xl
                 shadow-lg backdrop-blur-[1.5px] border-2 border-blue-50 bg-white/50
                 group"
              >
                <h3 className="font-bold text-xl text-foreground mb-2">{lecture.professor}</h3>
                <span className="text-sm font-medium text-stone-500 bg-stone-100 px-2 py-1 rounded">
                  {lecture.section}
                </span>

                {/* Visual indicator for clickable card */}
                <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-blue-500 font-medium text-sm flex items-center gap-1">
                    Join Room →
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 py-10 w-full backdrop-blur-[1.5px] rounded-2xl flex items-center justify-center">
            <h3 className="text-center font-bold text-2xl text-stone-600">No Lectures Available</h3>
          </div>
        )}
      </div>
    );
  }

  if (validcourses.length > 0) {
    return (
      <div className="flex-1 p-4 py-10 w-full">
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto ">
          {validcourses.map((course, index) => (
            <div
              key={index}
              onClick={() => setSelectedCourseId(course.id)}
              className="
             hover:-translate-y-2 hover:shadow-2xl relative overflow-hidden
             flex flex-col items-center justify-center cursor-pointer
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
            </div>
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
