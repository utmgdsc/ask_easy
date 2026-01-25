"use client";

import { ChevronLeft, ChevronRight, ChevronsLeftRight, Presentation } from "lucide-react";

import { createPluginRegistration } from "@embedpdf/core";
import { EmbedPDF } from "@embedpdf/core/react";
import { usePdfiumEngine } from "@embedpdf/engines/react";
import {
  DocumentContent,
  DocumentManagerPluginPackage,
} from "@embedpdf/plugin-document-manager/react";
import { RenderLayer, RenderPluginPackage } from "@embedpdf/plugin-render/react";
import { ViewportPluginPackage } from "@embedpdf/plugin-viewport/react";
import { useState } from "react";

const plugins = [
  createPluginRegistration(DocumentManagerPluginPackage, {
    initialDocuments: [{ url: "/placeholder/test_lec.pdf" }],
  }),
  createPluginRegistration(ViewportPluginPackage),
  createPluginRegistration(RenderPluginPackage),
];

export default function SlideViewer() {
  const { engine, isLoading } = usePdfiumEngine();
  const [pageIndex, setPageIndex] = useState(0);
  const [isManual, setIsManual] = useState(false);

  if (isLoading || !engine) {
    return <div className="p-4 text-center">Loading slides please wait...</div>;
  }

  return (
    <div className="flex flex-col  bg-stone-100 flex-1 w-full h-full items-center justify-center overflow-hidden">
      <EmbedPDF engine={engine} plugins={plugins}>
        {({ activeDocumentId }) =>
          activeDocumentId && (
            <DocumentContent documentId={activeDocumentId}>
              {({ isLoaded }) => {
                if (!isLoaded) {
                  return <div className="text-gray-500">Loading slides please wait...</div>;
                }

                return (
                  <div className="flex flex-col flex-1 w-full">
                    <div className="relative flex-1 w-full flex items-center justify-center">
                      <RenderLayer
                        documentId={activeDocumentId}
                        pageIndex={pageIndex}
                        scale={3}
                        className="max-w-full max-h-full object-contain block"
                      />
                    </div>

                    <div className="flex items-center justify-center gap-4 pb-2">
                      {/* Manual / Automatic Toggle */}
                      <button
                        onClick={() => setIsManual(!isManual)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors font-medium"
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
                            className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            onClick={() =>
                              setPageIndex((p) => {
                                const total = 100;
                                return p === 0 ? total - 1 : p - 1;
                              })
                            }
                          >
                            <ChevronLeft className="w-6 h-6" />
                          </button>

                          <span className="text-sm font-medium text-gray-600">
                            Slide {pageIndex + 1}
                          </span>

                          <button
                            className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            onClick={() =>
                              setPageIndex((p) => {
                                const total = 100;
                                return (p + 1) % total;
                              })
                            }
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
          )
        }
      </EmbedPDF>
    </div>
  );
}
