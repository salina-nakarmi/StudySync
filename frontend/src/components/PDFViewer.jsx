import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { resourceService } from '../services/resourceService';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function PDFViewer({ resource, token }) {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);

  // Load existing progress on mount
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const data = await resourceService.getResourceProgress(token, resource.id);
        if (data?.current_page) {
          setCurrentPage(data.current_page);
        }
      } catch (err) {
        console.error('Error loading progress:', err);
      }
    };
    
    loadProgress();
  }, [resource.id, token]);

  // Handle when document loads
  const onDocumentLoadSuccess = ({ numPages }) => {
    console.log(`PDF loaded: ${numPages} pages`);
    setNumPages(numPages);
  };

  // AUTO-TRACK: Send page change to backend
  const handlePageChange = async (newPage) => {
    if (newPage < 1 || newPage > numPages) return;
    
    setCurrentPage(newPage);
    setLoading(true);

    try {
      const updatedProgress = await resourceService.updateResourceProgressPage(
        token,
        resource.id,
        {
          current_page: newPage,
          notes: null
        }
      );
      setProgress(updatedProgress);
      console.log(`Updated to page ${newPage} of ${numPages}`);
    } catch (err) {
      console.error('Failed to update progress:', err);
    } finally {
      setLoading(false);
    }
  };

  const percentage = numPages ? Math.round((currentPage / numPages) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* PDF Viewer Container */}
      <div className="border-2 border-gray-300 rounded-lg overflow-auto bg-gray-100" style={{ height: '600px' }}>
        <Document file={resource.url} onLoadSuccess={onDocumentLoadSuccess} loading="Loading PDF...">
          <Page pageNumber={currentPage} width={500} />
        </Document>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-700">Reading Progress</h3>
          <span className="text-sm font-bold">{percentage}%</span>
        </div>
        
        <div className="w-full bg-gray-300 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Page Navigation Controls */}
      <div className="flex items-center justify-between gap-4 bg-gray-50 p-4 rounded-lg">
        {/* Previous Button */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1 || loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <ChevronLeftIcon className="w-5 h-5" />
          Previous
        </button>

        {/* Page Input */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max={numPages}
            value={currentPage}
            onChange={(e) => handlePageChange(parseInt(e.target.value) || 1)}
            disabled={loading}
            className="w-20 px-3 py-2 border-2 border-gray-300 rounded-lg text-center font-semibold focus:border-blue-500 focus:outline-none"
          />
          <span className="text-gray-600 font-medium">of {numPages}</span>
        </div>

        {/* Next Button */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= numPages || loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Next
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Status Messages */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <div>
          {currentPage === 0 && "📖 Not started"}
          {currentPage > 0 && currentPage < numPages && "📖 Reading..."}
          {currentPage >= numPages && "✅ Completed!"}
        </div>
        {loading && <span className="text-blue-600 animate-pulse">Saving progress...</span>}
      </div>
    </div>
  );
}