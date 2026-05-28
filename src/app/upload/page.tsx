"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { Upload, FileText, CheckCircle, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadResult {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);

    Papa.parse<Record<string, string>>(f, {
      header: true,
      skipEmptyLines: true,
      preview: 10,
      complete: (res) => {
        setHeaders(res.meta.fields ?? []);
        setPreview(res.data);
      },
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"], "application/vnd.ms-excel": [".csv"] },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
      } else {
        setResult(data);
        setFile(null);
        setPreview([]);
        setHeaders([]);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview([]);
    setHeaders([]);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-white">Upload Contacts</h1>
        <p className="text-white/40 mt-1 text-sm">
          Upload a CSV file with contact details. Duplicate emails will be merged automatically.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 cursor-pointer transition-all duration-200",
          isDragActive
            ? "border-violet-500 bg-violet-500/10"
            : file
            ? "border-emerald-500/40 bg-emerald-500/5"
            : "border-white/20 bg-white/5 hover:border-violet-500/50 hover:bg-violet-500/5"
        )}
      >
        <input {...getInputProps()} />
        {file ? (
          <>
            <FileText className="h-12 w-12 text-emerald-400 mb-3" />
            <p className="text-white font-semibold">{file.name}</p>
            <p className="text-white/40 text-sm mt-1">
              {(file.size / 1024).toFixed(1)} KB · {preview.length} rows previewed
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); clearFile(); }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <div className="h-14 w-14 rounded-2xl bg-violet-500/20 flex items-center justify-center mb-4">
              <Upload className="h-7 w-7 text-violet-400" />
            </div>
            <p className="text-white font-semibold text-lg">
              {isDragActive ? "Drop your CSV here" : "Drag & drop your CSV file"}
            </p>
            <p className="text-white/40 text-sm mt-1">or click to browse</p>
            <p className="text-white/25 text-xs mt-3">
              Expected columns: email, firstName, lastName, company, title
            </p>
          </>
        )}
      </div>

      {/* Preview Table */}
      {preview.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h2 className="text-sm font-semibold text-white/70">
              Preview – first {preview.length} rows
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {headers.map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-white/5 hover:bg-white/5 transition"
                  >
                    {headers.map((h) => (
                      <td key={h} className="px-4 py-3 text-white/70 truncate max-w-[200px]">
                        {row[h] ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Button */}
      {file && !result && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-500/20 transition-all duration-200"
        >
          {uploading ? (
            <>
              <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload Contacts
            </>
          )}
        </button>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-rose-300">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="flex items-start gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
          <CheckCircle className="h-6 w-6 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-300 mb-2">Upload Successful!</p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-white/60">
              <span>Total rows processed:</span>
              <span className="text-white font-medium">{result.total}</span>
              <span>New contacts added:</span>
              <span className="text-emerald-400 font-medium">{result.inserted}</span>
              <span>Existing contacts updated:</span>
              <span className="text-amber-400 font-medium">{result.updated}</span>
              <span>Rows skipped (invalid):</span>
              <span className="text-rose-400 font-medium">{result.skipped}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
