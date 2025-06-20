import React from 'react';

interface PrintLayoutProps {
  formType: 'OUTGOING' | 'INCOMING';
  formNumber?: string; // Barcode or transaction number
  children: React.ReactNode;
  companyName?: string;
  departmentInfo?: string; // e.g., TECHNICAL & FACILITIES SERVICES DIVISION, ART DEPT - WARDROBE
  printDate?: string; // Date of printing, if needed
  statusText?: string; // e.g. COMPLETE / INCOMPLETE for INCOMING
}

const PrintLayout: React.FC<PrintLayoutProps> = ({ 
  formType, 
  formNumber, 
  children,
  companyName = "PT TELEVISI TRANSFORMASI INDONESIA",
  departmentInfo = "TECHNICAL & FACILITIES SERVICES DIVISION\nART DEPT - WARDROBE",
  statusText
}) => {
  return (
    <div className="max-w-4xl mx-auto bg-white p-4 border-2 border-black font-mono text-xs my-5 print-container">
      {/* Header Section */}
      <div className="flex justify-between items-start pb-2 border-b-2 border-black mb-2">
        <div className="w-1/3">
          <h1 className="text-4xl font-bold">TRANSTV</h1> {/* Placeholder for logo */}
        </div>
        <div className="w-1/3 text-center">
          <p className="font-semibold">{companyName}</p>
          {departmentInfo.split('\n').map((line, idx) => (
            <p key={idx} className="text-xxs">{line}</p>
          ))}
        </div>
        <div className="w-1/3 text-right border border-black p-1">
          <p className="font-bold text-sm">{formType} FORM</p>
          <p>NO: {formNumber || 'N/A'}</p>
          {statusText && <p className="font-bold text-sm">{statusText}</p>}
          {/* Barcode placeholder */}
          {/* <div className="h-8 bg-gray-200 mt-1 flex items-center justify-center text-gray-500">BARCODE AREA</div> */}
        </div>
      </div>

      {/* Main Content Area - passed as children */}
      {children}

    </div>
  );
};

// Add styles for printing if needed, or rely on browser print styles
// This is a basic structure, more Tailwind classes can be added for precise styling.
// For example, to hide elements during print, use `print:hidden`.
// To ensure a page break, use `break-after-page` or `break-before-page`.
// Ensure your index.html includes a way for these print specific styles if any.
// e.g. in index.html <style> @media print { .print-container { /* styles */ } } </style>
// However, the prompt specifies Tailwind only, so this relies on Tailwind's print modifiers.

export default PrintLayout;
