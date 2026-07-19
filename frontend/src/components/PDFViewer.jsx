import { useState, useRef, useCallback, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { useAuth } from "@clerk/clerk-react";
import { resourceService } from "../services/resource_services";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
const API_BASE = "http://localhost:8000/api";

export default function PDFViewerWithControls({ resource, onProgressChange }) {
  const { getToken } = useAuth();
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(0.75);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  const containerRef = useRef(null);
  const pageRefs = useRef({});
  const observerRef = useRef(null);

  const debounceTimer = useRef(null);
  const lastSentPercent = useRef(null);
  const requestSeq = useRef(0);

  const reportProgress = useCallback(
    (page, total, { immediate = false } = {}) => {
      console.log("[PDFViewer] reportProgress called", { page, total, immediate, hasCallback: !!onProgressChange });
      if (!onProgressChange || !total) return;
      const percent = Math.round((page / total) * 100);

      if (percent === lastSentPercent.current) return;

      clearTimeout(debounceTimer.current);

      const send = () => {
        console.log("[PDFViewer] sending progress update", { page, percent });
        const mySeq = ++requestSeq.current;
        lastSentPercent.current = percent;
        Promise.resolve(onProgressChange(percent, page, mySeq, total)).catch((err) => {
          console.error("[PDFViewer] onProgressChange threw", err);
        });
      };

      if (immediate) {
        send();
      } else {
        debounceTimer.current = setTimeout(send, 600);
      }
    },
    [onProgressChange]
  );

  useEffect(() => {
    if (onProgressChange) {
      lastSentPercent.current = 0;
      const mySeq = ++requestSeq.current;
      Promise.resolve(onProgressChange(0, mySeq)).catch(() => {});
    }
  }, [onProgressChange]);

  function onLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
    reportProgress(1, numPages, { immediate: true });
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
            reportProgress(page, numPages);
          }
        },
        { root: node, threshold: 0.5 }
      );

      Object.values(pageRefs.current).forEach((el) => observerRef.current.observe(el));
    },
    [numPages, reportProgress]
  );

  useEffect(() => {
    return () => {
      clearTimeout(debounceTimer.current);
      observerRef.current?.disconnect();
      if (onProgressChange && numPages) {
        const percent = Math.round((pageNumber / numPages) * 100);
        if (percent !== lastSentPercent.current) {
          const mySeq = ++requestSeq.current;
          Promise.resolve(onProgressChange(percent, mySeq)).catch(() => {});
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

  // ✅ NEW: AI Summarizer Function
  const handleSummarize = async () => {
    try {
      setSummaryLoading(true);
      setSummaryError(null);
      setSummary(null);
      setSummaryOpen(true);

      console.log("🤖 Requesting AI summary for:", resource.title);

      const token = await getToken();

      const data = await resourceService.summarizeResource(
        token,
        resource
      );

      console.log("Summary:", data);

      setSummary(data.summary);
    } catch (error) {
      console.error(error);
      setSummaryError(error.message || "Failed to generate summary.");
    } finally {
      setSummaryLoading(false);
    }
  };

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

      {/* ✅ NEW: Summary Panel */}
      {summaryOpen && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-md h-screen shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-[#2C76BA] to-blue-600">
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-white" />
                <h2 className="text-white font-bold">AI Summary</h2>
              </div>
              <button
                onClick={() => setSummaryOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition"
              >
                <XMarkIcon className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {summaryLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <div className="animate-spin">
                    <SparklesIcon className="w-8 h-8 text-[#2C76BA]" />
                  </div>
                  <p className="text-gray-600 text-sm font-medium">Generating summary...</p>
                  <p className="text-gray-400 text-xs">This may take a moment</p>
                </div>
              ) : summaryError ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <p className="text-red-600 text-sm font-medium">❌ Error</p>
                  <p className="text-gray-600 text-xs text-center">{summaryError}</p>
                  <button
                    onClick={handleSummarize}
                    className="mt-4 px-4 py-2 text-sm font-bold text-white bg-[#2C76BA] rounded-lg hover:bg-blue-700 transition"
                  >
                    Try Again
                  </button>
                </div>
              ) : summary ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs font-bold text-blue-900 mb-2">📄 Document: {resource.title || "PDF Document"}</p>
                    <p className="text-xs text-blue-700">Pages: {numPages}</p>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="font-bold text-gray-900 text-sm">Summary</h3>
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{summary}</p>
                  </div>

                  <div className="pt-4 border-t border-gray-200 space-y-2">
                    <button
                      onClick={handleSummarize}
                      className="w-full px-4 py-2 text-sm font-bold text-white bg-[#2C76BA] rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                    >
                      <SparklesIcon className="w-4 h-4" />
                      Regenerate Summary
                    </button>
                    <button
                      onClick={() => {
                        const element = document.createElement("a");
                        element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(summary));
                        element.setAttribute("download", `${resource.title || "summary"}.txt`);
                        element.style.display = "none";
                        document.body.appendChild(element);
                        element.click();
                        document.body.removeChild(element);
                      }}
                      className="w-full px-4 py-2 text-sm font-bold text-gray-700 rounded-lg hover:bg-gray-100 transition border border-gray-300"
                    >
                      Download Summary
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Controls */}
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

          <button 
            onClick={() => setScale((s) => Math.max(0.5, s - 0.05))} 
            className="p-2 rounded hover:bg-gray-100"
          >
            <MagnifyingGlassMinusIcon className="w-6 h-6" />
          </button>

          <span className="font-medium w-12 text-center">{Math.round(scale * 100)}%</span>

          <button 
            onClick={() => setScale((s) => Math.min(3, s + 0.05))} 
            className="p-2 rounded hover:bg-gray-100"
          >
            <MagnifyingGlassPlusIcon className="w-6 h-6" />
          </button>

          {/* ✅ NEW: Summarize Button */}
          <button 
            onClick={handleSummarize}
            disabled={summaryLoading}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-blue-50 border-blue-300 text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <SparklesIcon className="w-5 h-5" />
            {summaryLoading ? "Summarizing..." : "Summarize"}
          </button>

          <button 
            onClick={handleDownload} 
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
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
