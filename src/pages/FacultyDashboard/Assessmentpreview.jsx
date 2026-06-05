import { useEffect, useState } from "react";
import { Download, ExternalLink, Loader2, AlertTriangle } from "lucide-react";

/**
 * Detects file type from a URL or filename.
 * Returns: "xlsx" | "docx" | "txt" | "pdf" | "unknown"
 */
function detectFileType(url) {
  if (!url) return "unknown";
  const clean = url.split("?")[0].toLowerCase();
  if (clean.endsWith(".xlsx") || clean.endsWith(".xls")) return "xlsx";
  if (clean.endsWith(".docx") || clean.endsWith(".doc")) return "docx";
  if (clean.endsWith(".txt")) return "txt";
  if (clean.endsWith(".pdf")) return "pdf";
  return "unknown";
}

// ─────────────────────────────────────────────────────────────────────────────
// XlsxPreview — fetches binary, parses with xlsx, renders as HTML table
// ─────────────────────────────────────────────────────────────────────────────
function XlsxPreview({ fileUrl }) {
  const [html, setHtml] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [workbook, setWorkbook] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        // Dynamically import xlsx to avoid bundle bloat when not needed
        const XLSX = await import("xlsx");

        const res = await fetch(fileUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const arrayBuffer = await res.arrayBuffer();
        const wb = XLSX.read(arrayBuffer, { type: "array" });

        if (!cancelled) {
          setWorkbook({ wb, XLSX });
          setSheetNames(wb.SheetNames);
          renderSheet(wb, wb.SheetNames[0], XLSX);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load spreadsheet");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [fileUrl]);

  const renderSheet = (wb, sheetName, XLSX) => {
    const ws = wb.Sheets[sheetName];
    const tableHtml = XLSX.utils.sheet_to_html(ws, { id: "xlsx-table", editable: false });
    setHtml(tableHtml);
  };

  const switchSheet = (idx) => {
    if (!workbook) return;
    setActiveSheet(idx);
    renderSheet(workbook.wb, workbook.wb.SheetNames[idx], workbook.XLSX);
  };

  if (loading) return <PreviewLoader label="Parsing spreadsheet…" />;
  if (error)   return <PreviewErrorInline message={error} />;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[#F8F9FA]">
      {/* Sheet tabs */}
      {sheetNames.length > 1 && (
        <div className="flex items-center gap-1 px-4 py-2 bg-[#1E2D3D] border-b border-[#30363D] flex-shrink-0 overflow-x-auto">
          {sheetNames.map((name, idx) => (
            <button
              key={name}
              onClick={() => switchSheet(idx)}
              className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
                idx === activeSheet
                  ? "bg-[#F4C542] text-black"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto p-1">
        <style>{`
          #xlsx-table {
            border-collapse: collapse;
            width: 100%;
            font-family: 'Menlo', 'Consolas', monospace;
            font-size: 12px;
          }
          #xlsx-table td, #xlsx-table th {
            border: 1px solid #CBD5E1;
            padding: 5px 10px;
            white-space: nowrap;
            background: #fff;
            color: #0F172A;
          }
          #xlsx-table tr:first-child td,
          #xlsx-table tr:first-child th {
            background: #F1F5F9;
            font-weight: 700;
            color: #1E293B;
            position: sticky;
            top: 0;
            z-index: 1;
          }
          #xlsx-table tr:nth-child(even) td {
            background: #F8FAFC;
          }
        `}</style>
        {html && (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DocxPreview — fetches binary, parses with mammoth, renders HTML
// ─────────────────────────────────────────────────────────────────────────────
function DocxPreview({ fileUrl }) {
  const [html, setHtml]     = useState(null);
  const [error, setError]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const mammoth = await import("mammoth");

        const res = await fetch(fileUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const arrayBuffer = await res.arrayBuffer();

        const result = await mammoth.convertToHtml({ arrayBuffer });
        if (!cancelled) setHtml(result.value);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load document");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [fileUrl]);

  if (loading) return <PreviewLoader label="Rendering document…" />;
  if (error)   return <PreviewErrorInline message={error} />;

  return (
    <div className="w-full h-full overflow-auto bg-white p-0">
      <style>{`
        .docx-body {
          max-width: 820px;
          margin: 0 auto;
          padding: 48px 56px;
          font-family: 'Georgia', 'Times New Roman', serif;
          font-size: 14px;
          line-height: 1.8;
          color: #1A1A2E;
        }
        .docx-body h1 { font-size: 22px; font-weight: 800; margin: 24px 0 12px; color: #0F172A; }
        .docx-body h2 { font-size: 18px; font-weight: 700; margin: 20px 0 10px; color: #1E293B; }
        .docx-body h3 { font-size: 15px; font-weight: 700; margin: 16px 0 8px; color: #334155; }
        .docx-body p  { margin: 0 0 12px; }
        .docx-body table {
          border-collapse: collapse;
          width: 100%;
          margin: 16px 0;
        }
        .docx-body td, .docx-body th {
          border: 1px solid #CBD5E1;
          padding: 6px 12px;
          font-size: 13px;
        }
        .docx-body th {
          background: #F1F5F9;
          font-weight: 700;
        }
        .docx-body ul, .docx-body ol {
          padding-left: 24px;
          margin: 0 0 12px;
        }
        .docx-body li { margin-bottom: 4px; }
        .docx-body strong { font-weight: 700; }
        .docx-body em { font-style: italic; }
      `}</style>
      <div
        className="docx-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TxtPreview — fetches raw text, displays in a <pre>
// ─────────────────────────────────────────────────────────────────────────────
function TxtPreview({ fileUrl }) {
  const [text, setText]     = useState(null);
  const [error, setError]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(fileUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((t) => { if (!cancelled) setText(t); })
      .catch((err) => { if (!cancelled) setError(err.message || "Failed to load text file"); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [fileUrl]);

  if (loading) return <PreviewLoader label="Loading text…" />;
  if (error)   return <PreviewErrorInline message={error} />;

  return (
    <div className="w-full h-full overflow-auto bg-[#1A1A2E] p-6">
      <pre className="text-[#E2E8F0] text-sm font-mono leading-relaxed whitespace-pre-wrap break-words">
        {text}
      </pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────
function PreviewLoader({ label }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-[#111827] text-gray-400">
      <Loader2 size={28} className="animate-spin text-[#F4C542]" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

function PreviewErrorInline({ message }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-[#111827] text-gray-400 p-8">
      <AlertTriangle size={28} className="text-red-400" />
      <p className="text-sm font-semibold text-red-400">Preview failed</p>
      <p className="text-xs text-gray-500 text-center max-w-xs">{message}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AssessmentPreviewContent — main export, drop-in replacement for the
// assessment iframe block inside ViewerModal
//
// Usage:
//   <AssessmentPreviewContent
//     item={selectedAssessment}
//     onIframeError={() => setAssessmentError(true)}
//   />
// ─────────────────────────────────────────────────────────────────────────────
export default function AssessmentPreviewContent({ item, onIframeError }) {
  if (!item) return null;

  const fileUrl  = item.file_url || item.embed_url || null;
  const fileType = detectFileType(fileUrl);

  if (fileType === "xlsx") {
    return <XlsxPreview fileUrl={fileUrl} />;
  }

  if (fileType === "docx") {
    return <DocxPreview fileUrl={fileUrl} />;
  }

  if (fileType === "txt") {
    return <TxtPreview fileUrl={fileUrl} />;
  }

  // PDF and unknown → fall back to iframe (existing behaviour)
  if (item.embed_url) {
    return (
      <iframe
        key={item.id}
        src={item.embed_url}
        title={item.title}
        className="w-full h-full bg-white"
        allow="autoplay"
        onError={onIframeError}
        style={{ border: "none" }}
      />
    );
  }

  // No URL at all
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-white bg-[#202020]">
      <p className="text-gray-400 text-sm">No preview URL available.</p>
      {fileUrl && (
        <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
        >
          Open in Browser
        </a>
      )}
    </div>
  );
}