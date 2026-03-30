"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Search } from "lucide-react";

interface Course {
  id: string;
  code: string;
  name: string;
  semester: string;
  createdBy: { name: string; utorid: string };
  _count: { enrollments: number; sessions: number };
}

export default function CoursesTable() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchCourses = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    fetch(`/api/admin/courses?${params}`)
      .then((res) => (res.ok ? res.json() : { courses: [] }))
      .then((data) => setCourses(data.courses ?? []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleDelete = async (courseId: string, code: string) => {
    if (!window.confirm(`Delete course "${code}" and ALL its sessions, questions, and enrollments? This cannot be undone.`))
      return;
    const res = await fetch(`/api/admin/courses/${courseId}`, { method: "DELETE" });
    if (res.ok) fetchCourses();
    else alert("Failed to delete course.");
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <Input
          placeholder="Search by code or name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-md border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-stone-50 text-stone-500">
              <th className="text-left px-4 py-3 font-medium">Code</th>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Semester</th>
              <th className="text-left px-4 py-3 font-medium">Created By</th>
              <th className="text-center px-4 py-3 font-medium">Enrollments</th>
              <th className="text-center px-4 py-3 font-medium">Sessions</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-stone-400">
                  Loading…
                </td>
              </tr>
            ) : courses.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-stone-400">
                  No courses found.
                </td>
              </tr>
            ) : (
              courses.map((course) => (
                <tr key={course.id} className="border-b last:border-0 hover:bg-stone-50">
                  <td className="px-4 py-3 font-mono text-xs">{course.code}</td>
                  <td className="px-4 py-3">{course.name}</td>
                  <td className="px-4 py-3 text-stone-500">{course.semester}</td>
                  <td className="px-4 py-3 text-stone-500">{course.createdBy.name}</td>
                  <td className="px-4 py-3 text-center">{course._count.enrollments}</td>
                  <td className="px-4 py-3 text-center">{course._count.sessions}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(course.id, course.code)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
