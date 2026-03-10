"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import header from "../components/header";
import footer from "../components/footer";
import { User } from "@/utils/types";
import { UploadCloud, File as FileIcon, CheckCircle2, X } from "lucide-react";

// Types for CSV Parsing and Processing
interface CSVRow {
  [key: string]: string;
}

interface StudentRecord {
  givenName: string;
  surname: string;
  utorid: string;
  [key: string]: string; // Allow other fields to exist from CSV
}

interface ProcessedClassData {
  courseCode: string;
  lectureSection: string;
  students: StudentRecord[];
}

export default function CreateClassPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedClassData | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  //sample user
  const placeholder_user: User = {
    username: "Hi",
    pfp: "H",
    role: "PROFESSOR",
  }; // For testing

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(true);
  };

  const handleDragLeave = () => setIsHovering(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (uploadedFile: File) => {
    if (uploadedFile.type !== "text/csv" && !uploadedFile.name.endsWith(".csv")) {
      alert("Please upload a CSV file.");
      return;
    }
    setFile(uploadedFile);
    parseAndProcessCSV(uploadedFile);
  };

  // Processing function based on expected CSV headers:
  // Acad_act, ... Prime TM, Prime SNR, ... Surname, Given Name, ... UTORid
  const processRawData = (rawData: CSVRow[]): ProcessedClassData => {
    const processStudent = (row: CSVRow): StudentRecord => ({
      givenName: row["Given Name"] || "Unknown",
      surname: row["Surname"] || "Student",
      utorid: row["UTORid"] || row["Person ID"] || "Missing UTORid",
      ...row,
    });

    const students = rawData
      .map(processStudent)
      .filter((s) => s.givenName !== "Unknown" && s.utorid !== "Missing UTORid");

    // Try to grab the course code and lecture section from the first row
    const firstRowCourseCode = rawData.length > 0 ? rawData[0]["Acad_act"] || "" : "";
    const extractedCourseCode = firstRowCourseCode
      ? firstRowCourseCode.split(",")[0].trim()
      : "Unknown Course";

    // Grabbing Prime TM e.g. "LEC" and Prime SNR e.g. "101"
    const primeTM = rawData.length > 0 ? rawData[0]["Prime TM"] || "" : "";
    const primeSNR = rawData.length > 0 ? rawData[0]["Prime SNR"] || "" : "";

    const extractedLectureSection =
      primeTM && primeSNR ? `${primeTM.trim()} ${primeSNR.trim()}` : "Unknown Section";

    return {
      courseCode: extractedCourseCode,
      lectureSection: extractedLectureSection,
      students:
        students.length > 0
          ? students
          : [
              // Fallback for visual testing if no rows match expected columns
              { givenName: "ERROR", surname: "ERROR", utorid: "ERROR" },
            ],
    };
  };

  const parseAndProcessCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        let lines = text.split("\n").filter((line) => line.trim() !== "");
        // Remove \r from windows
        lines = lines.map((line) => line.replace(/\r/g, ""));

        if (lines.length > 0) {
          const headers = lines[0].split(",");
          const data: CSVRow[] = lines.slice(1).map((line) => {
            const values = line.split(",");
            const row: CSVRow = {};
            headers.forEach((header, index) => {
              row[header.trim()] = values[index]?.trim() || "";
            });
            return row;
          });

          const processed = processRawData(data);
          setProcessedData(processed);
        }
      }
    };
    reader.readAsText(file);
  };

  const clearFile = () => {
    setFile(null);
    setProcessedData(null);
  };

  if (placeholder_user.role !== "PROFESSOR") {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans text-stone-800">
        {header(placeholder_user)}
        <div className="flex-grow flex items-center justify-center pt-32 pb-12 px-6">
          <div className="max-w-md w-full text-center space-y-4">
            <h1 className="text-xl font-semibold text-stone-900 tracking-wide uppercase">
              Access Denied
            </h1>
            <p className="text-stone-600">
              You do not have the Authorization to access the page. Contact support if the error is
              unintended.
            </p>
          </div>
        </div>
        {footer()}
      </div>
    );
  }

  const submitClassCreation = async () => {
    // Placeholder function for database insertion
    const send_class_to_db = async (data: ProcessedClassData) => {
      console.log("Simulating sending class to DB:", data);
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulating network request
    };

    if (processedData) {
      await send_class_to_db(processedData);
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-stone-800">
      {header(placeholder_user)}
      <div className="flex-grow flex items-center justify-center pt-32 pb-12 px-6">
        <div className="max-w-3xl w-full bg-white p-8 rounded-lg shadow-sm border border-stone-200 space-y-6 z-10 mx-auto">
          <h1 className="text-2xl font-semibold text-stone-900 tracking-wide uppercase border-b border-stone-300/50 pb-4">
            Create Class
          </h1>

          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center transition-colors duration-200 cursor-pointer ${
                isHovering
                  ? "border-stone-500 bg-stone-100"
                  : "border-stone-300 bg-stone-50 hover:bg-stone-100"
              }`}
            >
              <input
                type="file"
                accept=".csv"
                className="hidden"
                id="csv-upload"
                onChange={handleFileInput}
              />
              <label
                htmlFor="csv-upload"
                className="flex flex-col items-center cursor-pointer w-full"
              >
                <div className="p-4 bg-white shadow-sm border border-stone-200 rounded-full mb-6">
                  <UploadCloud className="w-8 h-8 text-stone-700" />
                </div>
                <h3 className="text-stone-900 font-semibold tracking-wide uppercase mb-2 text-lg">
                  Click to upload or drag and drop
                </h3>
                <p className="text-stone-500">CSV files only</p>
              </label>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-6 relative">
                <button
                  onClick={clearFile}
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
                      {(file.size / 1024).toFixed(2)} KB • {processedData?.students?.length || 0}{" "}
                      students found
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
                            <td className="px-6 py-3.5 text-stone-700 font-medium">
                              {student.givenName}
                            </td>
                            <td className="px-6 py-3.5 text-stone-700 font-medium">
                              {student.surname}
                            </td>
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
                onClick={submitClassCreation}
                className="w-full bg-stone-900 text-stone-50 hover:bg-stone-800 transition-colors duration-200 py-3.5 rounded-lg font-semibold tracking-wide uppercase mt-4 shadow-sm border border-stone-800"
              >
                Confirm & Create Class
              </button>
            </div>
          )}
        </div>
      </div>
      {footer()}
    </div>
  );
}
