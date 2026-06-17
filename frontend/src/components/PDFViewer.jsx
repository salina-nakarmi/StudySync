import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function PDFViewerWithControls({ resource, onProgressChange }) {
  const containerRef = useRef(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pdfRef = useRef(null);

  // Load PDF from Cloudinary URL
  useEffect(() => {
    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ Load PDF from Cloudinary link
        const cloudinaryUrl = resource.url;
        
        console.log('Loading PDF from:', cloudinaryUrl);

        const pdf = await pdfjsLib.getDocument({
          url: cloudinaryUrl,
          withCredentials: false,
        }).promise;

        pdfRef.current = pdf;
        setTotalPages(pdf.numPages);
        console.log('PDF loaded with', pdf.numPages, 'pages');
        
        // Render first page
        await renderPage(1);
        setLoading(false);
      } catch (error) {
            console.error("================================");
            console.error("PDF LOAD FAILED");
            console.error(error);
            console.error("message:", error?.message);
            console.error("name:", error?.name);
            console.error("================================");

            setError(error?.message || "Failed to load PDF");
            setLoading(false);
        }
    };

    loadPDF();
  }, [resource.url]);

  // Update progress when current page changes
  useEffect(() => {
    if (totalPages > 0) {
      const progress = Math.round((currentPage / totalPages) * 100);
      onProgressChange(progress);
    }
  }, [currentPage, totalPages, onProgressChange]);

  // Render a specific page
  const renderPage = async (pageNum) => {
    if (!pdfRef.current) return;

    try {
      const page = await pdfRef.current.getPage(pageNum);
      
      // Create canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      // Get viewport and scale
      const viewport = page.getViewport({ scale: 1.5 });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Render page to canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      // Display canvas in container
      const container = containerRef.current;
      if (container) {
        container.innerHTML = ''; // Clear previous page
        container.appendChild(canvas);
        
        // Style the canvas
        canvas.style.maxWidth = '100%';
        canvas.style.height = 'auto';
        canvas.style.display = 'block';
        canvas.style.margin = '0 auto';
        canvas.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
      }

      setCurrentPage(pageNum);
    } catch (error) {
      console.error('Error rendering page:', error);
      setError('Failed to render page');
    }
  };

  // Navigation handlers
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      renderPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      renderPage(currentPage - 1);
    }
  };

  const goToPage = (pageNum) => {
    const page = parseInt(pageNum);
    if (page >= 1 && page <= totalPages) {
      renderPage(page);
    }
  };

  const handlePageInputChange = (e) => {
    goToPage(e.target.value);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#2C76BA] mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm font-medium">Loading PDF...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-center p-6">
          <p className="text-red-600 text-sm font-medium mb-2">❌ {error}</p>
          <p className="text-gray-500 text-xs">Please try downloading the PDF instead.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-100">
      {/* PDF Canvas Container */}
      <div 
        ref={containerRef} 
        className="flex-1 overflow-auto p-6 flex items-start justify-center"
        style={{ backgroundColor: '#e5e7eb' }}
      />

      {/* Navigation Controls */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between gap-4">
        {/* Previous Button */}
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          className={`px-4 py-2 text-sm font-bold rounded-lg border transition ${
            currentPage === 1
              ? 'text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed'
              : 'text-gray-700 border-gray-300 bg-white hover:bg-gray-50 active:bg-gray-100'
          }`}
        >
          ← Previous
        </button>

        {/* Page Input */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 font-medium">Page</span>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={currentPage}
            onChange={handlePageInputChange}
            className="w-16 px-3 py-2 text-sm border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-[#2C76BA] font-medium"
          />
          <span className="text-xs text-gray-600 font-medium">of {totalPages}</span>
        </div>

        {/* Next Button */}
        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className={`px-4 py-2 text-sm font-bold rounded-lg border transition ${
            currentPage === totalPages
              ? 'text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed'
              : 'text-gray-700 border-gray-300 bg-white hover:bg-gray-50 active:bg-gray-100'
          }`}
        >
          Next →
        </button>
      </div>
    </div>
  );
}