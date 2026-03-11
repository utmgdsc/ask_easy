import { useState } from "react";
import { UploadCloud } from "lucide-react";

interface UploadProps {
  onFileSelect: (file: File) => void;
}

export default function Upload({ onFileSelect }: UploadProps) {
  const [isHovering, setIsHovering] = useState(false);

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
    onFileSelect(uploadedFile);
  };

  return (
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
      <label htmlFor="csv-upload" className="flex flex-col items-center cursor-pointer w-full">
        <div className="p-4 bg-white shadow-sm border border-stone-200 rounded-full mb-6">
          <UploadCloud className="w-8 h-8 text-stone-700" />
        </div>
        <h3 className="text-stone-900 font-semibold tracking-wide uppercase mb-2 text-lg">
          Click to upload or drag and drop
        </h3>
        <p className="text-stone-500">CSV files only</p>
      </label>
    </div>
  );
}
