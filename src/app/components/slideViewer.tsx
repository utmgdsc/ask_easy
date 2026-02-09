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
import { useState } from "react";
import useShowSlide from "./room";
import { ShowSlideContextType } from "./room";

const plugins = [
  createPluginRegistration(DocumentManagerPluginPackage, {
    initialDocuments: [{ url: "/placeholder/test_lec.pdf" }],
  }),
  createPluginRegistration(ViewportPluginPackage),
  createPluginRegistration(RenderPluginPackage),
];

function SlideUI({ activeDocumentId }: { activeDocumentId: string | null }) {
  const [pageIndex, setPageIndex] = useState(0);
  const [isManual, setIsManual] = useState(false);
  const [inputValue, setInputValue] = useState("1");

  const { provides: docManager } = useDocumentManagerCapability();
  const activeDocument = docManager?.getActiveDocument();
  const pageCount = activeDocument?.pageCount || 0;

  if (!activeDocumentId) return null;

  const handleSlideChange = (value: string) => {
    if (pageCount === 0) return;

    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1) {
      setPageIndex(0);
      setInputValue("1");
    } else {
      const newIndex = (num - 1) % pageCount;
      setPageIndex(newIndex);
      setInputValue(String(newIndex + 1));
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
  };

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
                className="flex items-center gap-2 px-4 py-2 bg-stone-200 text-foreground rounded-md hover:bg-stone-300 transition-colors font-medium"
              >
                {isManual ? (
                  <>
                    <Presentation className="w-5 h-5" />
                    Automatic
                  </>
                ) : (
                  <>
                    <ChevronsLeftRight className="w-5 h-5" />
                    Manual
                  </>
                )}
              </button>

              {isManual && (
                <>
                  <button
                    className="w-10 h-10 flex items-center justify-center bg-foreground hover:bg-foreground/80 text-white rounded-md transition-colors"
                    onClick={() =>
                      handlePageIndexChange(pageIndex === 0 ? pageCount - 1 : pageIndex - 1)
                    }
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                    <span>Slide</span>
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onBlur={() => handleSlideChange(inputValue)}
                      onKeyDown={handleKeyDown}
                      className="w-8 h-8 px-1 py-1 text-center bg-white border border-stone-300 rounded"
                    />
                  </div>

                  <button
                    className="w-10 h-10 flex items-center justify-center bg-foreground hover:bg-foreground/80 text-white rounded-md transition-colors"
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
  const val = useShowSlide();
  if (val?.show === false) {
    return null;
  }

  if (isLoading || !engine) {
    return <div className="p-4 text-center">Loading slides please wait...</div>;
  }
  
  return (
    <div className="flex flex-col bg-stone-100 flex-1 w-full h-full items-center justify-center overflow-hidden">
      <EmbedPDF engine={engine} plugins={plugins}>
        {({ activeDocumentId }) => <SlideUI activeDocumentId={activeDocumentId} />}
      </EmbedPDF>
    </div>
  );
}
