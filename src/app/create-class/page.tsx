"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import header from "../components/header";
import footer from "../components/footer";
import { User } from "@/utils/types";
import { ProcessedClassData, CSVRow, StudentRecord } from "@/utils/types";

import NoPermissions from "./components/NoPermissions";
import Upload from "./components/Upload";
import PreviewClass from "./components/PreviewClass";
import { parseAndProcessCSV } from "@/utils/create-class";

export default function CreateClassPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedClassData | null>(null);

  //sample user
  const placeholder_user: User = {
    username: "Hi",
    pfp: "H",
    role: "PROFESSOR",
  }; // For testing

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    try {
      const processed = await parseAndProcessCSV(selectedFile);
      setProcessedData(processed);
    } catch (error) {
      console.error(error);
    }
  };

  const clearFile = () => {
    setFile(null);
    setProcessedData(null);
  };

  const submitClassCreation = async () => {
    const send_class_to_db = async (data: ProcessedClassData) => {
      console.log("Simulating sending class to DB:", data);
      await new Promise((resolve) => setTimeout(resolve, 500));
    };

    if (processedData) {
      await send_class_to_db(processedData);
      router.push("/");
    }
  };

  if (placeholder_user.role !== "PROFESSOR") {
    return <NoPermissions user={placeholder_user} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-stone-800">
      {header(placeholder_user)}
      <div className="flex-grow flex items-center justify-center pt-32 pb-12 px-6">
        <div className="max-w-3xl w-full bg-white p-8 rounded-lg shadow-sm border border-stone-200 space-y-6 z-10 mx-auto">
          <h1 className="text-2xl font-semibold text-stone-900 tracking-wide uppercase border-b border-stone-300/50 pb-4">
            Create Class
          </h1>

          {!file ? (
            <Upload onFileSelect={handleFileSelect} />
          ) : (
            <PreviewClass
              file={file}
              processedData={processedData}
              onClear={clearFile}
              onSubmit={submitClassCreation}
            />
          )}
        </div>
      </div>
      {footer()}
    </div>
  );
}
