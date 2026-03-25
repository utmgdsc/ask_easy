"use client";

import { ChevronLeft, ChevronRight, Radio, Navigation, Users, Square, Upload } from "lucide-react";
import { createPluginRegistration } from "@embedpdf/core";
import { EmbedPDF } from "@embedpdf/core/react";
import { usePdfiumEngine } from "@embedpdf/engines/react";
import {
  DocumentContent,
  DocumentManagerPluginPackage,
  useDocumentManagerCapability,
} from "@embedpdf/plugin-document-manager/react";
import { RenderLayer, RenderPluginPackage } from "@embedpdf/plugin-render/react";
import { ViewportPluginPackage } from "@embedpdf/plugin-viewport/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useRoom } from "./RoomContext";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SlideViewerProps {
  isProfessor: boolean;
  onEndLecture?: () => void;
}

// ---------------------------------------------------------------------------
// Inner UI — needs to be inside EmbedPDF to access document capabilities
// ---------------------------------------------------------------------------

interface SlideUIProps {
  activeDocumentId: string | null;
  isProfessor: boolean;
  onReplaceSlides?: (file: File) => void;
  onEndLecture?: () => void;
}

function SlideUI({ activeDocumentId, isProfessor, onReplaceSlides, onEndLecture }: SlideUIProps) {
  const { socket, sessionId } = useRoom();
  const router = useRouter();

  const [pageIndex, setPageIndex] = useState(0);
  const [inputValue, setInputValue] = useState("1");
  const [isSynced, setIsSynced] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [ending, setEnding] = useState(false);
  const professorPageRef = useRef(0);

  const { provides: docManager } = useDocumentManagerCapability();
  const activeDocument = docManager?.getActiveDocument();
  const pageCount = activeDocument?.pageCount || 0;

  // -------------------------------------------------------------------------
  // Socket — slide sync + live updates
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!socket) return;

    const requestSync = () => {
      socket.emit("slide:sync", { sessionId });
    };

    if (socket.connected) requestSync();
    socket.on("connect", requestSync);

    const onSyncResponse = ({ pageIndex: idx }: { pageIndex: number }) => {
      professorPageRef.current = idx;
      setPageIndex(idx);
      setInputValue(String(idx + 1));
    };

    socket.on("slide:sync", onSyncResponse);

    const onViewerCount = ({ count }: { count: number }) => {
      setViewerCount(count);
    };

    socket.on("viewer:count", onViewerCount);

    const requestViewerSync = () => {
      socket.emit("viewer:sync", { sessionId });
    };

    if (socket.connected) requestViewerSync();
    socket.on("connect", requestViewerSync);

    return () => {
      socket.off("connect", requestSync);
      socket.off("connect", requestViewerSync);
      socket.off("slide:sync", onSyncResponse);
      socket.off("viewer:count", onViewerCount);
    };
  }, [socket, sessionId]);

  useEffect(() => {
    if (!socket) return;

    const handler = ({ pageIndex: newIndex }: { pageIndex: number }) => {
      professorPageRef.current = newIndex;
      if (isSynced || isProfessor) {
        setPageIndex(newIndex);
        setInputValue(String(newIndex + 1));
      }
    };

    socket.off("slide:changed");
    socket.on("slide:changed", handler);

    return () => {
      socket.off("slide:changed", handler);
    };
  }, [socket, isSynced, isProfessor]);

  // -------------------------------------------------------------------------
  // Navigation helpers
  // -------------------------------------------------------------------------

  const navigateTo = (newIndex: number) => {
    if (pageCount === 0) return;
    const clamped = Math.max(0, Math.min(newIndex, pageCount - 1));
    setPageIndex(clamped);
    setInputValue(String(clamped + 1));

    if (isProfessor && socket) {
      socket.emit("slide:change", { sessionId, pageIndex: clamped });
    }
  };

  const handleInputCommit = (value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1) {
      navigateTo(0);
    } else {
      navigateTo(num - 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleInputCommit(inputValue);
      e.currentTarget.blur();
    }
  };

  // -------------------------------------------------------------------------
  // Student sync toggle
  // -------------------------------------------------------------------------

  const handleToggleSync = () => {
    if (!isSynced) {
      const target = professorPageRef.current;
      setPageIndex(target);
      setInputValue(String(target + 1));
    }
    setIsSynced((prev) => !prev);
  };

  // -------------------------------------------------------------------------
  // End lecture
  // -------------------------------------------------------------------------

  const handleEndLecture = async () => {
    if (!confirmEnd) {
      setConfirmEnd(true);
      return;
    }
    if (onEndLecture) {
      // Delegate to parent — it will show the download modal, then call PATCH.
      setConfirmEnd(false);
      onEndLecture();
      return;
    }
    // Fallback: end session inline (when no parent callback is provided)
    setEnding(true);
    try {
      await fetch(`/api/sessions/${sessionId}`, { method: "PATCH" });
      router.push("/");
    } catch {
      setEnding(false);
      setConfirmEnd(false);
    }
  };

  // -------------------------------------------------------------------------
  // Replace slides (professor only — hidden file input)
  // -------------------------------------------------------------------------

  const replaceInputRef = useRef<HTMLInputElement>(null);

  const handleReplaceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onReplaceSlides) {
      onReplaceSlides(file);
    }
    e.target.value = "";
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex flex-col flex-1 w-full min-h-0">
      {/* Slide canvas */}
      {activeDocumentId ? (
        <DocumentContent documentId={activeDocumentId}>
          {({ isLoaded }) =>
            isLoaded ? (
              <div className="relative flex-1 w-full flex items-center justify-center min-h-0">
                <RenderLayer
                  documentId={activeDocumentId}
                  pageIndex={pageIndex}
                  scale={3}
                  className="max-w-full max-h-full object-contain block [&_canvas]:!max-w-full [&_canvas]:!max-h-full [&_canvas]:!object-contain"
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-foreground">
                Loading slides, please wait...
              </div>
            )
          }
        </DocumentContent>
      ) : (
        <div className="flex-1 flex items-center justify-center text-foreground">
          Loading slides, please wait...
        </div>
      )}

      {/* Controls bar — always rendered */}
      <div className="flex shrink-0 items-center justify-center gap-4 p-4">
        {/* Professor: live indicator + nav */}
        {isProfessor && (
          <>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-md text-sm font-medium">
              <Radio className="w-4 h-4" />
              Presenting Live
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 text-stone-700 rounded-md text-sm font-medium">
              <Users className="w-4 h-4" />
              {viewerCount}
            </div>
            {onReplaceSlides && (
              <>
                <input
                  ref={replaceInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={handleReplaceFile}
                />
                <button
                  onClick={() => replaceInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-md text-sm font-medium transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Replace Slides
                </button>
              </>
            )}
            {confirmEnd ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-stone-600">End lecture?</span>
                <button
                  onClick={handleEndLecture}
                  disabled={ending}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-60"
                >
                  {ending ? "Ending…" : "Yes, end it"}
                </button>
                <button
                  onClick={() => setConfirmEnd(false)}
                  disabled={ending}
                  className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-foreground rounded-md text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={handleEndLecture}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-200 hover:bg-red-100 hover:text-red-700 text-stone-700 rounded-md text-sm font-medium transition-colors"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                End Lecture
              </button>
            )}
            <button
              className="w-10 h-10 flex items-center justify-center bg-stone-900 hover:bg-stone-700 text-stone-50 rounded-md transition-colors"
              onClick={() => navigateTo(pageIndex === 0 ? pageCount - 1 : pageIndex - 1)}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-1 text-sm font-medium text-foreground">
              <span>Slide</span>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={() => handleInputCommit(inputValue)}
                onKeyDown={handleKeyDown}
                className="w-8 h-8 px-1 py-1 text-center bg-white border border-stone-300 rounded"
              />
              {pageCount > 0 && <span className="text-stone-500">/ {pageCount}</span>}
            </div>
            <button
              className="w-10 h-10 flex items-center justify-center bg-stone-900 hover:bg-stone-700 text-stone-50 rounded-md transition-colors"
              onClick={() => navigateTo((pageIndex + 1) % pageCount)}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Student: following mode */}
        {!isProfessor && isSynced && (
          <>
            <div className="flex items-center gap-1.5 px-3 py-2 bg-green-100 text-green-700 rounded-md text-sm font-medium">
              <Navigation className="w-4 h-4" />
              Following Professor
            </div>
            <button
              onClick={handleToggleSync}
              className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-foreground rounded-md text-sm font-medium transition-colors"
            >
              Browse Freely
            </button>
          </>
        )}

        {/* Student: free navigation mode */}
        {!isProfessor && !isSynced && (
          <>
            <button
              className="w-10 h-10 flex items-center justify-center bg-stone-900 hover:bg-stone-700 text-stone-50 rounded-md transition-colors"
              onClick={() => navigateTo(pageIndex === 0 ? pageCount - 1 : pageIndex - 1)}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-1 text-sm font-medium text-foreground">
              <span>Slide</span>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={() => handleInputCommit(inputValue)}
                onKeyDown={handleKeyDown}
                className="w-8 h-8 px-1 py-1 text-center bg-white border border-stone-300 rounded"
              />
              {pageCount > 0 && <span className="text-stone-500">/ {pageCount}</span>}
            </div>
            <button
              className="w-10 h-10 flex items-center justify-center bg-stone-900 hover:bg-stone-700 text-stone-50 rounded-md transition-colors"
              onClick={() => navigateTo((pageIndex + 1) % pageCount)}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <button
              onClick={handleToggleSync}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              <Radio className="w-4 h-4" />
              Back to Live
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Upload zone — shown to professors when no slides exist yet
// ---------------------------------------------------------------------------

interface UploadZoneProps {
  onUpload: (file: File) => void;
  isUploading: boolean;
  uploadError: string | null;
}

function UploadZone({ onUpload, isUploading, uploadError }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) return;
    onUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col flex-1 w-full items-center justify-center p-8">
      <div
        className={`flex flex-col items-center justify-center w-full max-w-md border-2 border-dashed rounded-xl p-10 gap-4 cursor-pointer transition-colors ${
          isDragging
            ? "border-stone-500 bg-stone-100"
            : "border-stone-300 bg-stone-50 hover:border-stone-400 hover:bg-stone-100"
        } ${isUploading ? "pointer-events-none opacity-60" : ""}`}
        onClick={() => !isUploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-stone-200">
          <Upload className="w-6 h-6 text-stone-600" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-stone-800">
            {isUploading ? "Uploading…" : "Upload Slides"}
          </p>
          <p className="text-sm text-stone-500 mt-1">
            {isUploading
              ? "Please wait while your PDF is being processed"
              : "Drag & drop a PDF here, or click to browse"}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleChange}
          disabled={isUploading}
        />
      </div>
      {uploadError && (
        <p className="mt-4 text-sm text-red-600 max-w-md text-center">{uploadError}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

export default function SlideViewer({ isProfessor, onEndLecture }: SlideViewerProps) {
  const { engine, isLoading: engineLoading } = usePdfiumEngine();
  const { sessionId, socket } = useRoom();

  const [slideUrl, setSlideUrl] = useState<string | null>(null);
  const [isLoadingSlides, setIsLoadingSlides] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Fetch existing slide set on mount
  // -------------------------------------------------------------------------

  const loadSlides = useCallback(
    async (slideSetId?: string) => {
      if (slideSetId) {
        setSlideUrl(`/api/sessions/${sessionId}/slides/${slideSetId}/file`);
        setIsLoadingSlides(false);
        return;
      }
      try {
        const res = await fetch(`/api/sessions/${sessionId}/slides`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.slideSets?.length > 0) {
          const latest = data.slideSets[0];
          setSlideUrl(`/api/sessions/${sessionId}/slides/${latest.id}/file`);
        }
      } finally {
        setIsLoadingSlides(false);
      }
    },
    [sessionId]
  );

  useEffect(() => {
    if (sessionId) {
      loadSlides().finally(() => setIsLoadingSlides(false));
    }
  }, [sessionId, loadSlides]);

  // -------------------------------------------------------------------------
  // Socket — listen for slides:available (students get notified after upload)
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!socket) return;

    const onSlidesAvailable = ({ slideSetId }: { slideSetId: string }) => {
      setSlideUrl(`/api/sessions/${sessionId}/slides/${slideSetId}/file`);
    };

    socket.on("slides:available", onSlidesAvailable);
    return () => {
      socket.off("slides:available", onSlidesAvailable);
    };
  }, [socket, sessionId]);

  // -------------------------------------------------------------------------
  // Upload handler
  // -------------------------------------------------------------------------

  const handleUpload = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(`/api/sessions/${sessionId}/slides`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (!res.ok) {
          setUploadError(data.error ?? "Upload failed. Please try again.");
          return;
        }

        const newUrl = `/api/sessions/${sessionId}/slides/${data.slideSetId}/file`;
        setSlideUrl(newUrl);

        if (socket?.connected) {
          socket.emit("slides:uploaded", { sessionId, slideSetId: data.slideSetId });
          socket.emit("slide:change", { sessionId, pageIndex: 0 });
        }
      } catch {
        setUploadError("Upload failed. Please check your connection and try again.");
      } finally {
        setIsUploading(false);
      }
    },
    [sessionId, socket]
  );

  // -------------------------------------------------------------------------
  // Build plugins dynamically so EmbedPDF loads the real URL
  // -------------------------------------------------------------------------

  const plugins = useMemo(() => {
    if (!slideUrl) return null;
    return [
      createPluginRegistration(DocumentManagerPluginPackage, {
        initialDocuments: [{ url: slideUrl }],
      }),
      createPluginRegistration(ViewportPluginPackage),
      createPluginRegistration(RenderPluginPackage),
    ];
  }, [slideUrl]);

  // -------------------------------------------------------------------------
  // Render states
  // -------------------------------------------------------------------------

  if (engineLoading || !engine) {
    return (
      <div className="flex flex-col bg-stone-50 flex-1 w-full h-full items-center justify-center">
        <p className="text-stone-500 text-sm">Loading PDF engine…</p>
      </div>
    );
  }

  if (isLoadingSlides) {
    return (
      <div className="flex flex-col bg-stone-50 flex-1 w-full h-full items-center justify-center">
        <p className="text-stone-500 text-sm">Loading slides, please wait…</p>
      </div>
    );
  }

  // No slides yet
  if (!slideUrl) {
    if (isProfessor) {
      return (
        <div className="flex flex-col bg-stone-50 flex-1 w-full h-full overflow-hidden">
          <UploadZone onUpload={handleUpload} isUploading={isUploading} uploadError={uploadError} />
        </div>
      );
    }

    return (
      <div className="flex flex-col bg-stone-50 flex-1 w-full h-full items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center">
          <Upload className="w-5 h-5 text-stone-400" />
        </div>
        <p className="text-stone-500 text-sm">Waiting for professor to upload slides…</p>
      </div>
    );
  }

  // Slides available — render the viewer
  return (
    <div className="flex flex-col bg-stone-50 flex-1 w-full h-full items-center justify-center overflow-hidden">
      {isUploading && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
          <p className="text-stone-600 text-sm font-medium">Uploading new slides…</p>
        </div>
      )}
      <EmbedPDF key={slideUrl} engine={engine} plugins={plugins!}>
        {({ activeDocumentId }) => (
          <SlideUI
            activeDocumentId={activeDocumentId}
            isProfessor={isProfessor}
            onReplaceSlides={isProfessor ? handleUpload : undefined}
            onEndLecture={isProfessor ? onEndLecture : undefined}
          />
        )}
      </EmbedPDF>
    </div>
  );
}
