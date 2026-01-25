"use client";

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

                    <div className="flex items-center gap-4 pb-2">
                      <button
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                        disabled={pageIndex === 0}
                      >
                        Previous Slide
                      </button>

                      <span className="text-sm font-medium text-gray-600">
                        Slide {pageIndex + 1}
                      </span>

                      <button
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                        onClick={() => setPageIndex((p) => p + 1)}
                      >
                        Next Slide
                      </button>
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
