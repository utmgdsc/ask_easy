"use client";

import { useEffect, useState } from "react";
import { User } from "@/utils/types";
import renderCourseButtons from "./CourseViewer";
import renderProfCourseButtons from "./ProfCourseViewer";
import footer from "../components/footer";
import header from "../components/header";

export default function LandingPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.userId) {
          setUser({
            id: data.userId,
            username: data.name ?? data.utorid,
            pfp: data.name?.[0]?.toUpperCase() ?? data.utorid?.[0]?.toUpperCase() ?? "?",
            role: data.role as User["role"],
          });
        }
      })
      .catch(() => null);
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-stone-400 text-sm">Loading…</span>
      </div>
    );
  }

  return (
    <div className="max-h-screen flex flex-col dot-grid relative">
      {header(user)}
      <div className="overflow-y-auto">
        <div className="flex-1 p-5 pt-32 items-center justify-center pb-10">
          <h1 className="text-4xl font-bold py-4 text-center">Classrooms</h1>
          {user.role === "PROFESSOR" ? renderProfCourseButtons() : renderCourseButtons()}
        </div>
        {footer()}
      </div>
    </div>
  );
}
