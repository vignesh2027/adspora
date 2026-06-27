import { useState, useRef } from "react";
import API from "@/lib/api";
import { UPLOAD } from "@/constants/testIds";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(ext)) {
      toast.error("Please upload a CSV or Excel file");
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await API.post("/upload/file", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setResult(data);
      if (data.status === "success") toast.success(`Imported ${data.inserted} creatives`);
      else toast.error(data.message || "Import failed");
    } catch (e) {
      const msg = e.response?.data?.detail || "Upload failed";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
      setResult({ status: "error", message: typeof msg === "string" ? msg : "Upload failed" });
    }
    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="p-6 lg:p-8 max-w-[900px]" data-testid={UPLOAD.page}>
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-light text-white tracking-tight font-['Outfit']">Upload Data</h1>
        <p className="text-sm text-[#94A3B8] mt-1">Import your ad performance data from CSV or Excel files</p>
      </div>

      {/* Drop zone */}
      <div
        data-testid={UPLOAD.dropzone}
        className={`upload-zone ${dragActive ? "active" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} data-testid={UPLOAD.fileInput} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#10B981]/10 flex items-center justify-center">
            <Upload size={28} className="text-[#10B981]" />
          </div>
          <div>
            <p className="text-white font-medium mb-1">Drop your file here or click to browse</p>
            <p className="text-sm text-[#475569]">Supports CSV, XLSX, XLS files</p>
          </div>
        </div>
      </div>

      {/* Selected file */}
      {file && (
        <div className="en-card mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet size={20} className="text-[#10B981]" />
              <div>
                <p className="text-white text-sm font-medium">{file.name}</p>
                <p className="text-xs text-[#475569]">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <button data-testid={UPLOAD.importButton} onClick={handleUpload} disabled={uploading} className="btn-primary flex items-center gap-2 disabled:opacity-50">
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              <span>{uploading ? "Importing..." : "Import"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div data-testid={UPLOAD.result} className={`en-card mt-6 ${result.status === "success" ? "border-[#10B981]/30" : "border-red-500/30"}`}>
          <div className="flex items-start gap-3">
            {result.status === "success" ? (
              <CheckCircle size={20} className="text-[#10B981] mt-0.5" />
            ) : (
              <AlertCircle size={20} className="text-red-400 mt-0.5" />
            )}
            <div>
              {result.status === "success" ? (
                <>
                  <p className="text-white font-medium">Import Successful</p>
                  <p className="text-sm text-[#94A3B8] mt-1">Imported {result.inserted} creatives from {result.total_rows} rows</p>
                  {result.columns && <p className="text-xs text-[#475569] mt-2 font-mono">Columns: {result.columns.join(", ")}</p>}
                </>
              ) : (
                <>
                  <p className="text-red-400 font-medium">Import Failed</p>
                  <p className="text-sm text-[#94A3B8] mt-1">{result.message}</p>
                  {result.columns && <p className="text-xs text-[#475569] mt-2 font-mono">Found columns: {result.columns.join(", ")}</p>}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Expected format */}
      <div className="en-card mt-6">
        <h3 className="text-sm font-medium text-white mb-3">Expected Columns</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            { col: "name*", desc: "Creative name" },
            { col: "platform", desc: "Meta, Google, TikTok, Taboola" },
            { col: "campaign", desc: "Campaign name" },
            { col: "spend", desc: "Total spend ($)" },
            { col: "revenue", desc: "Total revenue ($)" },
            { col: "impressions", desc: "Total impressions" },
            { col: "clicks", desc: "Total clicks" },
            { col: "ctr", desc: "Click-through rate (%)" },
            { col: "roas", desc: "Return on ad spend" },
            { col: "age_days", desc: "Days running" },
          ].map((c) => (
            <div key={c.col} className="flex items-start gap-2 p-2 rounded bg-[#131C18]">
              <span className="font-mono text-xs text-[#10B981]">{c.col}</span>
              <span className="text-xs text-[#475569]">{c.desc}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#475569] mt-3">* Required. Other columns are auto-detected. Column names are flexible (e.g., "cost" maps to "spend").</p>
      </div>
    </div>
  );
}
