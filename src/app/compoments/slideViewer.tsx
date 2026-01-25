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

// Register the plugins
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
    return <div className="p-4 text-center">Loading PDF Engine...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] w-full gap-6 p-4 bg-gray-50 rounded-lg">
      <EmbedPDF engine={engine} plugins={plugins}>
        {({ activeDocumentId }) =>
          activeDocumentId && (
            <DocumentContent documentId={activeDocumentId}>
              {({ isLoaded }) => {
                if (!isLoaded) {
                  return <div className="text-gray-500">Loading document...</div>;
                }

                return (
                  <div className="flex flex-col items-center gap-4 w-full max-w-4xl">
                    <div
                      className="relative bg-white shadow-lg border border-gray-200 overflow-hidden"
                      style={{
                        width: "100%",
                        height: "600px", // Fixed height for the viewer window
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div className="w-full h-full">
                        <RenderLayer
                          documentId={activeDocumentId}
                          pageIndex={pageIndex}
                          scale={3}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
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
                    <p className="text-xs text-gray-400 mt-2">
                      Note: PDF must be at{" "}
                      <code className="bg-gray-100 px-1 py-0.5 rounded">
                        public/placeholder/test_lec.pdf
                      </code>
                    </p>
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
