"use client";

import React, { useEffect, useState } from "react";
import { User } from "@/utils/types";
import CourseViewer from "./components/CourseViewer";
import footer from "./components/footer";
import header from "./components/header";
import ProfCourseViewer from "./classes/ProfCourseViewer";

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
    <div className="min-h-screen flex flex-col dot-grid relative">
      {header(user)}
      <div className="overflow-y-auto flex-1 flex flex-col">
        <div className="flex-1 p-5 pt-32 pb-10 flex flex-col items-center">
          <h1 className="text-4xl font-bold py-4 text-center">Lectures</h1>
          <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col">
            {user.role === "PROFESSOR" ? <ProfCourseViewer /> : <CourseViewer />}
          </div>
        </div>
        {footer()}
      </div>
    </div>
  );
}
