"use client";

import { ChevronLeft, ChevronRight, ChevronsLeftRight, Presentation } from "lucide-react";
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
import { useState, useEffect, useMemo } from "react";
import { io } from "socket.io-client";

// ==========================================
// TEST CONSTANTS TO CONNECT UI WITH BACKEND
// ==========================================
const TEST_SESSION_ID = "cmlzu9pik000e8afg6uwlqd2k";
const TEST_SLIDESET_ID = "cmlzu9pin000i8afg51133hso";
const TEST_USER_ID = "prof001-test"; // Passed to auth middleware

function SlideUI({
  activeDocumentId,
  slideData,
  isProf = true,
}: {
  activeDocumentId: string | null;
  slideData: { signedUrl?: string; slides?: { id: string; pageNumber: number }[] } | null;
  isProf?: boolean;
}) {
  const [pageIndex, setPageIndex] = useState(0);
  const [isManual, setIsManual] = useState(false);
  const [inputValue, setInputValue] = useState("1");

  const { provides: docManager } = useDocumentManagerCapability();
  const activeDocument = docManager?.getActiveDocument();
  const pageCount = activeDocument?.pageCount || 0;

  const syncSlideState = (newIndex: number) => {
    setPageIndex(newIndex);
    setInputValue(String(newIndex + 1));
  };

  // Socket logic
  useEffect(() => {
    const socket = io({
      auth: { userId: TEST_USER_ID },
    });

    socket.on("connect", () => {
      console.log("Connected to slide socket");
      socket.emit("session:join", { sessionId: TEST_SESSION_ID });
    });

    socket.on("current_state", (data: { slideSetId: string; pageNumber: number }) => {
      if (!isManual && data.slideSetId === TEST_SLIDESET_ID) {
        syncSlideState(data.pageNumber - 1);
      }
    });

    socket.on("slide_changed", (data: { slideSetId: string; pageNumber: number }) => {
      if (!isManual && data.slideSetId === TEST_SLIDESET_ID) {
        syncSlideState(data.pageNumber - 1);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [isManual]);

  const handleSlideChange = (value: string) => {
    if (pageCount === 0) return;

    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1) {
      handlePageIndexChange(0);
    } else {
      const newIndex = (num - 1) % pageCount;
      handlePageIndexChange(newIndex);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSlideChange(inputValue);
      e.currentTarget.blur();
    }
  };

  const handlePageIndexChange = (newIndex: number) => {
    setPageIndex(newIndex);
    setInputValue(String(newIndex + 1));

    // Emit event back to server if prof logic is active
    if (isProf && slideData?.slides) {
      const slideItem = slideData.slides.find(
        (s: { id: string; pageNumber: number }) => s.pageNumber === newIndex + 1
      );
      if (slideItem) {
        fetch(`/api/sessions/${TEST_SESSION_ID}/slides/${TEST_SLIDESET_ID}/navigate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slideId: slideItem.id }),
        }).catch((err) => console.error("Failed to POST navigation", err));
      }
    }
  };

  if (!activeDocumentId) return null;

  return (
    <DocumentContent documentId={activeDocumentId}>
      {({ isLoaded }) => {
        if (!isLoaded) {
          return <div className="text-foreground">Loading slides please wait...</div>;
        }

        return (
          <div className="flex flex-col flex-1 w-full min-h-0">
            <div className="relative flex-1 w-full flex items-center justify-center min-h-0">
              <RenderLayer
                documentId={activeDocumentId}
                pageIndex={pageIndex}
                scale={3}
                className="max-w-full max-h-full object-contain block [&_canvas]:!max-w-full [&_canvas]:!max-h-full [&_canvas]:!object-contain"
              />
            </div>

            <div className="flex items-center justify-center gap-4 p-4">
              <button
                onClick={() => setIsManual(!isManual)}
                className="flex items-center gap-2 px-4 py-2 bg-stone-200 text-foreground rounded-md hover:bg-stone-300 transition-colors font-medium border border-stone-300 hover:border-stone-400"
              >
                {isManual ? (
                  <>
                    <Presentation className="w-5 h-5 text-indigo-600" />
                    Student View
                  </>
                ) : (
                  <>
                    <ChevronsLeftRight className="w-5 h-5" />
                    Presenter View
                  </>
                )}
              </button>

              {isManual && (
                <>
                  <button
                    className="w-10 h-10 flex items-center justify-center bg-stone-900 hover:bg-stone-700 text-stone-50 rounded-md transition-colors"
                    onClick={() =>
                      handlePageIndexChange(pageIndex === 0 ? pageCount - 1 : pageIndex - 1)
                    }
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <div className="flex items-center gap-2 text-sm font-medium text-foreground bg-stone-200 py-1.5 px-3 rounded-md">
                    <span>Target</span>
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onBlur={() => handleSlideChange(inputValue)}
                      onKeyDown={handleKeyDown}
                      className="w-10 h-8 px-1 py-1 text-center bg-white border border-stone-300 rounded shadow-sm focus:ring focus:ring-indigo-300 outline-none"
                    />
                  </div>

                  <button
                    className="w-10 h-10 flex items-center justify-center bg-stone-900 hover:bg-stone-700 text-stone-50 rounded-md transition-colors"
                    onClick={() => handlePageIndexChange((pageIndex + 1) % pageCount)}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          </div>
        );
      }}
    </DocumentContent>
  );
}

export default function SlideViewer() {
  const { engine, isLoading } = usePdfiumEngine();
  const [slideData, setSlideData] = useState<{
    signedUrl?: string;
    slides?: { id: string; pageNumber: number }[];
  } | null>(null);

  useEffect(() => {
    fetch(`/api/sessions/${TEST_SESSION_ID}/slides/${TEST_SLIDESET_ID}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.slideSet) {
          setSlideData(data.slideSet);
        }
      });
  }, []);

  const plugins = useMemo(() => {
    const url = slideData?.signedUrl;
    if (!url) return [];

    return [
      createPluginRegistration(DocumentManagerPluginPackage, {
        initialDocuments: [{ url }],
      }),
      createPluginRegistration(ViewportPluginPackage),
      createPluginRegistration(RenderPluginPackage),
    ];
  }, [slideData?.signedUrl]);

  if (isLoading || !engine || !slideData?.signedUrl) {
    return (
      <div className="p-4 flex h-full items-center justify-center font-medium text-stone-500">
        Loading presentations securely...
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-stone-50/50 flex-1 w-full h-full items-center justify-center overflow-hidden">
      <EmbedPDF engine={engine} plugins={plugins}>
        {({ activeDocumentId }) => (
          <SlideUI activeDocumentId={activeDocumentId} slideData={slideData} isProf={true} />
        )}
      </EmbedPDF>
    </div>
  );
}
