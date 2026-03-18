"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import header from "../components/header";
import footer from "../components/footer";
import { User } from "@/utils/types";
import { Users, UserPlus, Trash2 } from "lucide-react";

import EditStudents from "./components/EditStudents";
import EditTAs from "./components/EditTAs";

type Step = "menu" | "editStudents" | "editTAs";

export default function EditClassPage() {
  const searchParams = useSearchParams();
  const courseName = searchParams.get("course") || "Unknown Course";
  const [step, setStep] = useState<Step>("menu");

  const placeholder_user: User = {
    username: "Hi",
    pfp: "H",
    role: "PROFESSOR",
  };

  const handleDeleteClass = () => {
    console.log("Deleting class:", courseName);
    // Placeholder — will be replaced with actual delete logic
  };

  const renderStep = () => {
    switch (step) {
      case "menu":
        return (
          <div className="space-y-4 animate-in fade-in duration-300">
            <p className="text-stone-500 text-sm">Choose an action for this class.</p>
            <div className="grid gap-3">
              <button
                onClick={() => setStep("editStudents")}
                className="flex items-center gap-4 p-5 bg-stone-50 border border-stone-200 rounded-xl hover:bg-stone-100 hover:border-stone-300 transition-all duration-200 text-left group"
              >
                <div className="p-3 bg-white rounded-lg border border-stone-200 shadow-sm group-hover:shadow-md transition-shadow">
                  <Users className="w-6 h-6 text-stone-700" />
                </div>
                <div>
                  <h3 className="text-stone-900 font-semibold text-sm tracking-wide uppercase">
                    Edit Students
                  </h3>
                  <p className="text-stone-500 text-xs mt-0.5">
                    Upload a new roster to add or remove students
                  </p>
                </div>
              </button>

              <button
                onClick={() => setStep("editTAs")}
                className="flex items-center gap-4 p-5 bg-stone-50 border border-stone-200 rounded-xl hover:bg-stone-100 hover:border-stone-300 transition-all duration-200 text-left group"
              >
                <div className="p-3 bg-white rounded-lg border border-stone-200 shadow-sm group-hover:shadow-md transition-shadow">
                  <UserPlus className="w-6 h-6 text-stone-700" />
                </div>
                <div>
                  <h3 className="text-stone-900 font-semibold text-sm tracking-wide uppercase">
                    Edit TAs
                  </h3>
                  <p className="text-stone-500 text-xs mt-0.5">Add or remove teaching assistants</p>
                </div>
              </button>

              <button
                onClick={handleDeleteClass}
                className="flex items-center gap-4 p-5 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 hover:border-red-300 transition-all duration-200 text-left group"
              >
                <div className="p-3 bg-white rounded-lg border border-red-200 shadow-sm group-hover:shadow-md transition-shadow">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-red-800 font-semibold text-sm tracking-wide uppercase">
                    Delete Class
                  </h3>
                  <p className="text-red-500 text-xs mt-0.5">
                    Permanently remove this class and all associated data
                  </p>
                </div>
              </button>
            </div>
          </div>
        );
      case "editStudents":
        return <EditStudents courseCode={courseName} onBack={() => setStep("menu")} />;
      case "editTAs":
        return <EditTAs courseCode={courseName} onBack={() => setStep("menu")} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-stone-800">
      {header(placeholder_user)}
      <div className="flex-grow flex items-center justify-center pt-32 pb-12 px-6">
        <div className="max-w-3xl w-full bg-white p-8 rounded-lg shadow-sm border border-stone-200 space-y-6 z-10 mx-auto">
          <h1 className="text-2xl font-semibold text-stone-900 tracking-wide uppercase border-b border-stone-300/50 pb-4">
            Edit Class — {courseName}
          </h1>

          {renderStep()}
        </div>
      </div>
      {footer()}
    </div>
  );
}
