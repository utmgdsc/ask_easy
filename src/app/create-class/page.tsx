"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import header from "../components/header";
import footer from "../components/footer";
import { User } from "@/utils/types";

import NoPermissions from "./components/NoPermissions";
import Upload from "./components/Upload";
import PreviewClass from "./components/PreviewClass";
import { parseAndProcessCSV } from "@/utils/create-class";
import type { ProcessedClassData } from "@/utils/types";

export default function CreateClassPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedClassData | null>(null);
  const [tasInput, setTasInput] = useState("");
  const [courseCodeInput, setCourseCodeInput] = useState("");
  const [sectionInput, setSectionInput] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.userId) {
          setUser({
            id: data.userId,
            username: data.name ?? data.utorid,
            pfp: data.name?.[0]?.toUpperCase() ?? "?",
            role: data.role as User["role"],
          });
        }
      })
      .catch(() => null);
  }, []);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setSubmitError(null);
    try {
      const processed = await parseAndProcessCSV(selectedFile);
      setProcessedData(processed);
      setCourseCodeInput(processed.courseCode ?? "");
      setSectionInput(processed.lectureSection ?? "");
    } catch (error) {
      console.error(error);
    }
  };

  const clearFile = () => {
    setFile(null);
    setProcessedData(null);
    setTasInput("");
    setCourseCodeInput("");
    setSectionInput("");
    setSubmitError(null);
  };

  const submitClassCreation = async () => {
    if (!processedData) return;
    setSubmitting(true);
    setSubmitError(null);
    const tas = tasInput
      .split(/[\n,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: courseCodeInput.trim() || processedData.courseCode,
          section: sectionInput.trim() || undefined,
          students: processedData.students,
          ...(tas.length > 0 ? { tas } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Failed to create course.");
        return;
      }
      router.push("/");
    } catch {
      setSubmitError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading state while fetching user
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-stone-400 text-sm">Loading…</span>
      </div>
    );
  }

  if (user.role !== "PROFESSOR") {
    return <NoPermissions user={user} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-stone-800">
      {header(user)}
      <div className="flex-grow flex items-center justify-center pt-32 pb-12 px-6">
        <div className="max-w-3xl w-full bg-white p-8 rounded-lg shadow-sm border border-stone-200 space-y-6 z-10 mx-auto">
          <h1 className="text-2xl font-semibold text-stone-900 tracking-wide uppercase border-b border-stone-300/50 pb-4">
            Create Class
          </h1>

          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-2">
              {submitError}
            </p>
          )}

          {!file ? (
            <Upload onFileSelect={handleFileSelect} />
          ) : (
            <PreviewClass
              file={file}
              processedData={processedData}
              onClear={clearFile}
              onSubmit={submitting ? () => {} : submitClassCreation}
              tasInput={tasInput}
              onTasChange={setTasInput}
              courseCodeInput={courseCodeInput}
              onCourseCodeChange={setCourseCodeInput}
              sectionInput={sectionInput}
              onSectionChange={setSectionInput}
            />
          )}

          {submitting && <p className="text-sm text-stone-500 text-center">Creating class…</p>}
        </div>
      </div>
      {footer()}
    </div>
  );
}
