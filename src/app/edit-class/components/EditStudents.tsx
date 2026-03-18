"use client";

import { useState } from "react";
import { UploadCloud, ArrowLeft, UserPlus, UserMinus } from "lucide-react";
import { StudentRecord } from "@/utils/types";
import { parseAndProcessCSV } from "@/utils/create-class";
import { get_students_info } from "@/utils/edit-class";
import Upload from "@/app/create-class/components/Upload";

interface EditStudentsProps {
  courseCode: string;
  onBack: () => void;
}

interface StudentDiff {
  student: StudentRecord;
  status: "added" | "removed";
}

export default function EditStudents({ courseCode, onBack }: EditStudentsProps) {
  const [diffs, setDiffs] = useState<StudentDiff[]>([]);
  const [hasUploaded, setHasUploaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = async (file: File) => {
    setLoading(true);
    try {
      const [existingStudents, newData] = await Promise.all([
        get_students_info(courseCode),
        parseAndProcessCSV(file),
      ]);

      const newStudents = newData.students;

      // Compute diff
      const existingUtorids = new Set(existingStudents.map((s) => s.utorid));
      const newUtorids = new Set(newStudents.map((s) => s.utorid));

      const computedDiffs: StudentDiff[] = [];

      // Students in new file but not in existing → added
      for (const student of newStudents) {
        if (!existingUtorids.has(student.utorid)) {
          computedDiffs.push({ student, status: "added" });
        }
      }

      // Students in existing but not in new file → removed
      for (const student of existingStudents) {
        if (!newUtorids.has(student.utorid)) {
          computedDiffs.push({ student, status: "removed" });
        }
      }

      setDiffs(computedDiffs);
      setHasUploaded(true);
    } catch (error) {
      console.error("Error processing file:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    console.log("Accepting student changes for course:", courseCode, diffs);
    onBack();
  };

  if (!hasUploaded) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-stone-500 hover:text-stone-700 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to menu
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-stone-100 rounded-lg border border-stone-200">
            <UploadCloud className="w-5 h-5 text-stone-700" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-900 tracking-wide uppercase">
              Edit Students
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Upload a new CSV to compare against the current roster
            </p>
          </div>
        </div>

        {loading ? (
          <div className="border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center border-stone-300 bg-stone-50">
            <p className="text-stone-500 font-medium">Processing file...</p>
          </div>
        ) : (
          <Upload onFileSelect={handleFileSelect} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <button
        onClick={() => {
          setHasUploaded(false);
          setDiffs([]);
        }}
        className="flex items-center gap-2 text-stone-500 hover:text-stone-700 transition-colors text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Upload a different file
      </button>

      {diffs.length === 0 ? (
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-8 text-center">
          <p className="text-stone-600 font-medium">No changes detected</p>
          <p className="text-stone-400 text-sm mt-1">
            The uploaded roster matches the current class roster.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-stone-900 tracking-wide uppercase">
              Roster Changes
            </h3>
            <div className="flex gap-2 text-sm font-semibold text-stone-600">
              <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-md flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5" />
                {diffs.filter((d) => d.status === "added").length} Added
              </div>
              <div className="bg-red-50 text-red-700 px-3 py-1 rounded-md flex items-center gap-1.5">
                <UserMinus className="w-3.5 h-3.5" />
                {diffs.filter((d) => d.status === "removed").length} Removed
              </div>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-stone-500 bg-stone-50 uppercase border-b border-stone-200">
                <tr>
                  <th className="px-6 py-4 font-semibold tracking-wide">Status</th>
                  <th className="px-6 py-4 font-semibold tracking-wide">Given Name</th>
                  <th className="px-6 py-4 font-semibold tracking-wide">Surname</th>
                  <th className="px-6 py-4 font-semibold tracking-wide">UTORid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {diffs.map((diff, idx) => (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      diff.status === "added"
                        ? "bg-emerald-50/50 hover:bg-emerald-50"
                        : "bg-red-50/50 hover:bg-red-50"
                    }`}
                  >
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                          diff.status === "added"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {diff.status === "added" ? (
                          <UserPlus className="w-3 h-3" />
                        ) : (
                          <UserMinus className="w-3 h-3" />
                        )}
                        {diff.status === "added" ? "Added" : "Removed"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-stone-700 font-medium">
                      {diff.student.givenName}
                    </td>
                    <td className="px-6 py-3.5 text-stone-700 font-medium">
                      {diff.student.surname}
                    </td>
                    <td className="px-6 py-3.5 text-stone-500 font-mono text-xs">
                      {diff.student.utorid}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <button
        onClick={handleAccept}
        className="w-full bg-stone-900 text-stone-50 hover:bg-stone-800 transition-colors duration-200 py-3.5 rounded-lg font-semibold tracking-wide uppercase mt-4 shadow-sm border border-stone-800"
      >
        Accept Changes
      </button>
    </div>
  );
}
