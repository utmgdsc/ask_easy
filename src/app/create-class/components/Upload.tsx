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
      className={`group border-2 border-dashed rounded-md p-12 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
        isHovering
          ? "border-green-400 bg-green-50 shadow-md scale-[1.02]"
          : "border-stone-300 bg-stone-50 hover:bg-stone-100 hover:border-green-300 hover:shadow-sm"
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
        <div
          className={`p-4 bg-white shadow-sm border-2 rounded-md mb-6 transition-colors ${isHovering ? "border-green-200 text-green-500" : "border-stone-100 text-stone-400 group-hover:text-green-500 group-hover:border-green-200"}`}
        >
          <UploadCloud className="w-8 h-8 text-[inherit]" />
        </div>
        <h3 className="text-stone-900 font-bold tracking-tight mb-2 text-xl">
          Click to upload or drag and drop
        </h3>
        <p className="text-stone-500 font-medium">CSV files only</p>
      </label>
    </div>
  );
}
