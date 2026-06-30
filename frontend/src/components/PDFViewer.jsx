import { useState, useRef, useCallback, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

export default function PDFViewerWithControls({
  resource,
  onProgressChange,
}) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.5);

  const containerRef = useRef(null);
  const pageRefs = useRef({});
  const observerRef = useRef(null);

  function reportProgress(page, total) {
    if (onProgressChange && total) {
      onProgressChange(Math.round((page / total) * 100));
    }
  }

  function onLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
    reportProgress(1, numPages);
  }

  const setPageRef = useCallback(
    (page) => (node) => {
      if (!node) {
        delete pageRefs.current[page];
        return;
      }

      pageRefs.current[page] = node;
      node.dataset.pageNumber = page;

      if (observerRef.current) {
        observerRef.current.observe(node);
      }
    },
    []
  );

  const setContainerRef = useCallback(
    (node) => {
      containerRef.current = node;

      if (!node) return;

      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort(
              (a, b) => b.intersectionRatio - a.intersectionRatio
            )[0];

          if (visible) {
            const page = Number(visible.target.dataset.pageNumber);
            setPageNumber(page);
            reportProgress(page, numPages);
          }
        },
        {
          root: node,
          threshold: 0.5,
        }
      );

      Object.values(pageRefs.current).forEach((el) => {
        observerRef.current.observe(el);
      });
    },
    [numPages]
  );

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  function scrollToPage(page) {
    if (page < 1 || page > numPages) return;

    pageRefs.current[page]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    setPageNumber(page);
    reportProgress(page, numPages);
  }

  function handleDownload() {
    const link = document.createElement("a");
    link.href = resource.url;
    link.download = resource.name || "document.pdf";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  if (!resource?.url) {
    return (
      <div className="flex items-center justify-center h-full">
        No PDF found.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-100">

      {/* PDF Viewer */}
      <div
        ref={setContainerRef}
        className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center gap-6 p-4 pb-28"
      >
        <Document
          file={resource.url}
          onLoadSuccess={onLoadSuccess}
          loading="Loading PDF..."
          error="Unable to load PDF."
        >
          {Array.from({ length: numPages }, (_, i) => i + 1).map((page) => (
            <div
              key={page}
              ref={setPageRef(page)}
              className="bg-white shadow-lg"
            >
              <Page
                pageNumber={page}
                scale={scale}
                renderAnnotationLayer={false}
                renderTextLayer={false}
              />
            </div>
          ))}
        </Document>
      </div>

      {/* Bottom Toolbar */}
      <div className="sticky bottom-0 z-50 bg-white border-t shadow-lg px-6 py-4 flex items-center justify-between">

        {/* Previous */}
        <button
          onClick={() => scrollToPage(pageNumber - 1)}
          disabled={pageNumber === 1}
          className="flex items-center gap-2 px-3 py-2 border rounded-lg disabled:opacity-40 hover:bg-gray-100"
        >
          <ChevronLeftIcon className="w-5 h-5" />
          Previous
        </button>

        {/* Center Controls */}
        <div className="flex items-center gap-6">

          <span className="font-medium">
            Page {pageNumber} / {numPages}
          </span>

          <button
            onClick={() =>
              setScale((s) => Math.max(0.5, s - 0.2))
            }
            className="p-2 rounded hover:bg-gray-100"
          >
            <MagnifyingGlassMinusIcon className="w-6 h-6" />
          </button>

          <span className="font-medium w-12 text-center">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={() =>
              setScale((s) => Math.min(3, s + 0.2))
            }
            className="p-2 rounded hover:bg-gray-100"
          >
            <MagnifyingGlassPlusIcon className="w-6 h-6" />
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Download
          </button>

        </div>

        {/* Next */}
        <button
          onClick={() => scrollToPage(pageNumber + 1)}
          disabled={pageNumber === numPages}
          className="flex items-center gap-2 px-3 py-2 border rounded-lg disabled:opacity-40 hover:bg-gray-100"
        >
          Next
          <ChevronRightIcon className="w-5 h-5" />
        </button>

      </div>
    </div>
  );
}