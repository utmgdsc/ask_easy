import { CheckCircle2, File as FileIcon, X } from "lucide-react";
import { ProcessedClassData } from "@/utils/types";

interface PreviewClassProps {
  file: File;
  processedData: ProcessedClassData | null;
  onClear: () => void;
  onSubmit: () => void;
  tasInput: string;
  onTasChange: (value: string) => void;
  courseCodeInput: string;
  onCourseCodeChange: (value: string) => void;
  sectionInput: string;
  onSectionChange: (value: string) => void;
}

export default function PreviewClass({
  file,
  processedData,
  onClear,
  onSubmit,
  tasInput,
  onTasChange,
  courseCodeInput,
  onCourseCodeChange,
  sectionInput,
  onSectionChange,
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
            <div className="flex gap-2 text-sm font-semibold text-stone-600 items-center flex-wrap">
              <div className="flex items-center gap-1.5 bg-stone-100 px-3 py-1 rounded-md">
                <span className="shrink-0">Course:</span>
                <input
                  type="text"
                  value={courseCodeInput}
                  onChange={(e) => onCourseCodeChange(e.target.value)}
                  placeholder="e.g. CSC398H5"
                  className="bg-transparent border-b border-stone-400 focus:border-stone-700 outline-none text-sm font-semibold text-stone-700 w-24 placeholder:font-normal placeholder:text-stone-400"
                />
              </div>
              <div className="flex items-center gap-1.5 bg-stone-100 px-3 py-1 rounded-md">
                <span className="shrink-0">Section:</span>
                <input
                  type="text"
                  value={sectionInput}
                  onChange={(e) => onSectionChange(e.target.value)}
                  placeholder="e.g. LEC0101"
                  className="bg-transparent border-b border-stone-400 focus:border-stone-700 outline-none text-sm font-semibold text-stone-700 w-28 placeholder:font-normal placeholder:text-stone-400"
                />
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

      {/* TA UTORid input */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-stone-900 tracking-wide uppercase">
          Add TAs <span className="text-stone-400 font-normal normal-case">(optional)</span>
        </label>
        <p className="text-xs text-stone-500">
          Enter UTORids separated by commas, spaces, or new lines. TAs can see all questions and answer in restricted mode.
        </p>
        <textarea
          value={tasInput}
          onChange={(e) => onTasChange(e.target.value)}
          placeholder={"tasmith\ndoeta, brownjane"}
          rows={3}
          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:border-blue-400"
        />
      </div>

      <button
        onClick={onSubmit}
        className="w-full bg-stone-900 text-stone-50 hover:bg-stone-800 transition-colors duration-200 py-3.5 rounded-lg font-semibold tracking-wide uppercase mt-4 shadow-sm border border-stone-800"
      >
        Confirm & Create Class
      </button>
    </div>
  );
}
