"use client";

import { useState, useEffect } from "react";
import { Plus, X, UserPlus, ArrowLeft } from "lucide-react";
import { get_ta_info } from "@/utils/edit-class";

interface EditTAsProps {
  courseCode: string;
  onBack: () => void;
}

interface TAEntry {
  utorid: string;
  status: "existing" | "new" | "removed";
}

export default function EditTAs({ courseCode, onBack }: EditTAsProps) {
  const [taEntries, setTaEntries] = useState<TAEntry[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTAs = async () => {
      try {
        const existingTAs = await get_ta_info(courseCode);
        setTaEntries(existingTAs.map((utorid) => ({ utorid, status: "existing" })));
      } catch (err) {
        console.error("Error fetching TAs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTAs();
  }, [courseCode]);

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setError("Please enter a UTorID.");
      return;
    }

    const existing = taEntries.find((ta) => ta.utorid === trimmed);
    if (existing) {
      if (existing.status === "removed") {
        // Re-add a previously removed TA
        setTaEntries((prev) =>
          prev.map((ta) => (ta.utorid === trimmed ? { ...ta, status: "existing" } : ta))
        );
        setError(null);
        setInputValue("");
        return;
      }
      setError("This UTorID has already been added.");
      return;
    }

    setError(null);
    setTaEntries((prev) => [...prev, { utorid: trimmed, status: "new" }]);
    setInputValue("");
  };

  const handleRemove = (utorid: string) => {
    const entry = taEntries.find((ta) => ta.utorid === utorid);
    if (!entry) return;

    if (entry.status === "new") {
      // Completely remove newly added TAs
      setTaEntries((prev) => prev.filter((ta) => ta.utorid !== utorid));
    } else {
      // Mark existing TAs as removed
      setTaEntries((prev) =>
        prev.map((ta) => (ta.utorid === utorid ? { ...ta, status: "removed" } : ta))
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleAccept = () => {
    const finalTAs = taEntries.filter((ta) => ta.status !== "removed").map((ta) => ta.utorid);
    const removedTAs = taEntries.filter((ta) => ta.status === "removed").map((ta) => ta.utorid);
    console.log("Accepting TA changes for course:", courseCode);
    console.log("Final TAs:", finalTAs);
    console.log("Removed TAs:", removedTAs);
    onBack();
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center border-stone-300 bg-stone-50">
          <p className="text-stone-500 font-medium">Loading TAs...</p>
        </div>
      </div>
    );
  }

  const activeTAs = taEntries.filter((ta) => ta.status !== "removed");
  const removedTAs = taEntries.filter((ta) => ta.status === "removed");

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
          <UserPlus className="w-5 h-5 text-stone-700" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-stone-900 tracking-wide uppercase">
            Edit Teaching Assistants
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">Add or remove TAs for this class</p>
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

      {activeTAs.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-stone-500 tracking-wide uppercase">
            Active TAs ({activeTAs.length})
          </h4>
          <div className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm divide-y divide-stone-100">
            {activeTAs.map((ta) => (
              <div
                key={ta.utorid}
                className={`flex items-center justify-between px-5 py-3 transition-colors ${
                  ta.status === "new" ? "bg-emerald-50/50 hover:bg-emerald-50" : "hover:bg-stone-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-stone-700">{ta.utorid}</span>
                  {ta.status === "new" && (
                    <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      New
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(ta.utorid)}
                  className="text-stone-400 hover:text-red-500 transition-colors p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {removedTAs.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-red-500 tracking-wide uppercase">
            Removed TAs ({removedTAs.length})
          </h4>
          <div className="bg-white border border-red-200 rounded-lg overflow-hidden shadow-sm divide-y divide-red-100">
            {removedTAs.map((ta) => (
              <div
                key={ta.utorid}
                className="flex items-center justify-between px-5 py-3 bg-red-50/50 hover:bg-red-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-stone-500 line-through">{ta.utorid}</span>
                  <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                    Removed
                  </span>
                </div>
                <button
                  onClick={() =>
                    setTaEntries((prev) =>
                      prev.map((t) => (t.utorid === ta.utorid ? { ...t, status: "existing" } : t))
                    )
                  }
                  className="text-stone-400 hover:text-emerald-500 transition-colors p-1 text-xs font-medium"
                  title="Undo removal"
                >
                  Undo
                </button>
              </div>
            ))}
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
