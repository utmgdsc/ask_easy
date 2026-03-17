import { CheckCircle2, File as FileIcon, X } from "lucide-react";
import { ProcessedClassData } from "@/utils/types";

interface PreviewClassProps {
  file: File;
  processedData: ProcessedClassData | null;
  onClear: () => void;
  onAddTAs: () => void;
}

export default function PreviewClass({
  file,
  processedData,
  onClear,
  onAddTAs,
}: PreviewClassProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-6 relative">
        <button
          onClick={onClear}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-start gap-4 pr-8">
          <div className="p-3 bg-white rounded-lg border border-stone-200 shrink-0 shadow-sm">
            <FileIcon className="w-8 h-8 text-stone-700" />
          </div>
          <div className="min-w-0">
            <h3 className="text-stone-900 font-semibold truncate text-lg">{file.name}</h3>
            <p className="text-sm text-stone-500 mt-1">
              {(file.size / 1024).toFixed(2)} KB • {processedData?.students?.length || 0} students
              found
            </p>
            <div className="flex items-center gap-1.5 mt-3 text-stone-700 text-sm font-medium bg-stone-200/50 w-fit px-2 py-1 rounded-md">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Ready to align and process</span>
            </div>
          </div>
        </div>
      </div>

      {processedData && processedData.students.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-stone-900 tracking-wide uppercase">
              Class Roster Preview
            </h3>
            <div className="flex gap-2 text-sm font-semibold text-stone-600">
              <div className="bg-stone-100 px-3 py-1 rounded-md">
                Course: {processedData.courseCode}
              </div>
              <div className="bg-stone-100 px-3 py-1 rounded-md">
                Section: {processedData.lectureSection}
              </div>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-stone-500 bg-stone-50 uppercase border-b border-stone-200">
                <tr>
                  <th className="px-6 py-4 font-semibold tracking-wide">Given Name</th>
                  <th className="px-6 py-4 font-semibold tracking-wide">Surname</th>
                  <th className="px-6 py-4 font-semibold tracking-wide">UTORid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {processedData.students.slice(0, 4).map((student, idx) => (
                  <tr key={idx} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-3.5 text-stone-700 font-medium">{student.givenName}</td>
                    <td className="px-6 py-3.5 text-stone-700 font-medium">{student.surname}</td>
                    <td className="px-6 py-3.5 text-stone-500 font-mono text-xs">
                      {student.utorid}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {processedData.students.length > 4 && (
            <p className="text-xs text-stone-500 text-center pt-2 font-medium tracking-wide">
              Showing 4 of {processedData.students.length} students
            </p>
          )}
        </div>
      )}

      <button
        onClick={onAddTAs}
        className="w-full bg-stone-900 text-stone-50 hover:bg-stone-800 transition-colors duration-200 py-3.5 rounded-lg font-semibold tracking-wide uppercase mt-4 shadow-sm border border-stone-800"
      >
        Add TAs
      </button>
    </div>
  );
}
