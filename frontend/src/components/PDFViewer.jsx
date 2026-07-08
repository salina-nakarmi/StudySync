import { useState, useRef, useCallback, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";

// Import the worker file cleanly as an absolute file URL path
import workerSrc from "pdfjs-dist/build/pdf.worker.mjs?url";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

// Pass the URL string straight to the PDF library
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

// ... Rest of your component code stays exactly the same
export default function PDFViewerWithControls({ resource, onProgressChange }) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(0.75);

  const containerRef = useRef(null);
  const pageRefs = useRef({});
  const observerRef = useRef(null);

  const debounceTimer = useRef(null);
  const lastSentPercent = useRef(null);
  const requestSeq = useRef(0);

  // Sync volatile states into refs to completely avoid stale closures in effects
  const latestPageNumber = useRef(pageNumber);
  const latestNumPages = useRef(numPages);
  const latestOnProgressChange = useRef(onProgressChange);

  useEffect(() => {
    latestPageNumber.current = pageNumber;
  }, [pageNumber]);

  useEffect(() => {
    latestNumPages.current = numPages;
  }, [numPages]);

  useEffect(() => {
    latestOnProgressChange.current = onProgressChange;
  }, [onProgressChange]);

  // Debounced + ordering-safe progress reporting.
  const reportProgress = useCallback(
    (page, total, { immediate = false } = {}) => {
      if (!latestOnProgressChange.current || !total) return;
      const percent = Math.round((page / total) * 100);

      if (percent === lastSentPercent.current) return;

      clearTimeout(debounceTimer.current);

      const send = () => {
        const mySeq = ++requestSeq.current;
        lastSentPercent.current = percent;
        Promise.resolve(latestOnProgressChange.current(percent, page, mySeq, total)).catch((err) => {
          console.error("[PDFViewer] onProgressChange threw", err);
        });
      };

      if (immediate) {
        send();
      } else {
        debounceTimer.current = setTimeout(send, 600);
      }
    },
    [] 
  );

  // Mark as opened cleanly exactly ONCE when the component mounts
  useEffect(() => {
    if (latestOnProgressChange.current) {
      lastSentPercent.current = 0;
      const mySeq = ++requestSeq.current;
      Promise.resolve(latestOnProgressChange.current(0, 1, mySeq, 0)).catch(() => {});
    }
  }, []); 

  function onLoadSuccess({ numPages: loadedNumPages }) {
    setNumPages(loadedNumPages);
    setPageNumber(1);
    reportProgress(1, loadedNumPages, { immediate: true });
  }

  const setPageRef = useCallback((page) => (node) => {
    if (!node) {
      delete pageRefs.current[page];
      return;
    }
    pageRefs.current[page] = node;
    node.dataset.pageNumber = page;
    observerRef.current?.observe(node);
  }, []);

  const setContainerRef = useCallback(
    (node) => {
      containerRef.current = node;
      if (!node) return;

      observerRef.current?.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

          if (visible) {
            const page = Number(visible.target.dataset.pageNumber);
            setPageNumber(page);
            reportProgress(page, latestNumPages.current);
          }
        },
        { root: node, threshold: 0.5 }
      );

      Object.values(pageRefs.current).forEach((el) => observerRef.current.observe(el));
    },
    [reportProgress]
  );

  // Flush the *current* page coordinates cleanly on absolute unmount
  useEffect(() => {
    return () => {
      clearTimeout(debounceTimer.current);
      observerRef.current?.disconnect();
      
      const total = latestNumPages.current;
      const current = latestPageNumber.current;
      
      if (latestOnProgressChange.current && total) {
        const percent = Math.round((current / total) * 100);
        if (percent !== lastSentPercent.current) {
          const mySeq = ++requestSeq.current;
          Promise.resolve(latestOnProgressChange.current(percent, current, mySeq, total)).catch(() => {});
        }
      }
    };
  }, []);

  function scrollToPage(page) {
    if (page < 1 || page > numPages) return;
    pageRefs.current[page]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setPageNumber(page);
    reportProgress(page, numPages);
  }

  function handleDownload() {
    const link = document.createElement("a");
    link.href = resource.url;
    link.download = resource.name || resource.title || "document.pdf";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  if (!resource?.url) {
    return <div className="flex items-center justify-center h-full">No PDF found.</div>;
  }

  const livePercent = numPages ? Math.round((pageNumber / numPages) * 100) : 0;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-100">
      <div className="h-1.5 bg-gray-200 shrink-0">
        <div
          className="h-full bg-[#2C76BA] transition-all duration-300"
          style={{ width: `${livePercent}%` }}
        />
      </div>

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
            <div key={page} ref={setPageRef(page)} className="bg-white shadow-lg">
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

      <div className="sticky bottom-0 z-50 bg-white border-t shadow-lg px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => scrollToPage(pageNumber - 1)}
          disabled={pageNumber === 1}
          className="flex items-center gap-2 px-3 py-2 border rounded-lg disabled:opacity-40 hover:bg-gray-100"
        >
          <ChevronLeftIcon className="w-5 h-5" />
          Previous
        </button>

        <div className="flex items-center gap-6">
          <span className="font-medium">
            Page {pageNumber} / {numPages}
            <span className="ml-2 text-gray-400">({livePercent}%)</span>
          </span>

          <button onClick={() => setScale((s) => Math.max(0.5, s - 0.05))} className="p-2 rounded hover:bg-gray-100">
            <MagnifyingGlassMinusIcon className="w-6 h-6" />
          </button>

          <span className="font-medium w-12 text-center">{Math.round(scale * 100)}%</span>

          <button onClick={() => setScale((s) => Math.min(3, s + 0.05))} className="p-2 rounded hover:bg-gray-100">
            <MagnifyingGlassPlusIcon className="w-6 h-6" />
          </button>

          <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-100">
            <ArrowDownTrayIcon className="w-5 h-5" />
            Download
          </button>
        </div>

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