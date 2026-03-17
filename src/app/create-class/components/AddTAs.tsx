"use client";

import { useState } from "react";
import { Plus, X, UserPlus } from "lucide-react";

interface AddTAsProps {
  tas: string[];
  onAddTA: (utorid: string) => void;
  onRemoveTA: (utorid: string) => void;
  onSubmit: () => void;
}

export default function AddTAs({ tas, onAddTA, onRemoveTA, onSubmit }: AddTAsProps) {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setError("Please enter a UTorID.");
      return;
    }
    if (tas.includes(trimmed)) {
      setError("This UTorID has already been added.");
      return;
    }
    setError(null);
    onAddTA(trimmed);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 bg-stone-100 rounded-lg border border-stone-200">
          <UserPlus className="w-5 h-5 text-stone-700" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-stone-900 tracking-wide uppercase">
            Add Teaching Assistants
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Enter the UTorID of each TA for this class
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Enter UTorID"
          className="flex-1 px-4 py-3 border border-stone-200 rounded-lg text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-stone-400 transition-all"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-3 bg-stone-800 text-stone-50 rounded-lg hover:bg-stone-700 transition-colors flex items-center gap-1.5 font-medium text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {error && <p className="text-sm text-red-600 font-medium -mt-3">{error}</p>}

      {tas.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-stone-500 tracking-wide uppercase">
            Added TAs ({tas.length})
          </h4>
          <div className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm divide-y divide-stone-100">
            {tas.map((utorid) => (
              <div
                key={utorid}
                className="flex items-center justify-between px-5 py-3 hover:bg-stone-50 transition-colors"
              >
                <span className="text-sm font-mono text-stone-700">{utorid}</span>
                <button
                  onClick={() => onRemoveTA(utorid)}
                  className="text-stone-400 hover:text-red-500 transition-colors p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onSubmit}
        className="w-full bg-stone-900 text-stone-50 hover:bg-stone-800 transition-colors duration-200 py-3.5 rounded-lg font-semibold tracking-wide uppercase mt-4 shadow-sm border border-stone-800"
      >
        Confirm & Create Class
      </button>
    </div>
  );
}
