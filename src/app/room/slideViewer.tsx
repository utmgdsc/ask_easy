"use client";

import { ChevronLeft, ChevronRight, Radio, Navigation } from "lucide-react";
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
import { useEffect, useRef, useState } from "react";

import { useRoom } from "./RoomContext";

// ---------------------------------------------------------------------------
// PDF plugin registrations (module-level — stable reference across renders)
// ---------------------------------------------------------------------------

const plugins = [
  createPluginRegistration(DocumentManagerPluginPackage, {
    initialDocuments: [{ url: "/placeholder/test_lec.pdf" }],
  }),
  createPluginRegistration(ViewportPluginPackage),
  createPluginRegistration(RenderPluginPackage),
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SlideViewerProps {
  isProfessor: boolean;
}

// ---------------------------------------------------------------------------
// Inner UI — needs to be inside EmbedPDF to access document capabilities
// ---------------------------------------------------------------------------

interface SlideUIProps {
  activeDocumentId: string | null;
  isProfessor: boolean;
}

function SlideUI({ activeDocumentId, isProfessor }: SlideUIProps) {
  const { socket, sessionId } = useRoom();

  const [pageIndex, setPageIndex] = useState(0);
  const [inputValue, setInputValue] = useState("1");
  const [isSynced, setIsSynced] = useState(true);
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

    return () => {
      socket.off("connect", requestSync);
      socket.off("slide:sync", onSyncResponse);
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
// Public component
// ---------------------------------------------------------------------------

export default function SlideViewer({ isProfessor }: SlideViewerProps) {
  const { engine, isLoading } = usePdfiumEngine();

  if (isLoading || !engine) {
    return <div className="p-4 text-center">Loading slides, please wait...</div>;
  }

  return (
    <div className="flex flex-col bg-stone-50 flex-1 w-full h-full items-center justify-center overflow-hidden">
      <EmbedPDF engine={engine} plugins={plugins}>
        {({ activeDocumentId }) => (
          <SlideUI activeDocumentId={activeDocumentId} isProfessor={isProfessor} />
        )}
      </EmbedPDF>
    </div>
  );
}
