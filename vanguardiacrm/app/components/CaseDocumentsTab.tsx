"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type CaseDocument = {
  id: string;
  created_at: string;
  original_filename: string;
  mime_type: string | null;
  size_bytes: number | null;
  document_type: string;
  uploaded_by: string | null;
  notes: string | null;
};

type Props = {
  caseNumber: string;
};

function formatFileSize(size: number | null) {
  if (!size) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function CaseDocumentsTab({ caseNumber }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documentType, setDocumentType] = useState("general");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const loadDocuments = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (mode === "initial") {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(null);

      try {
        const res = await fetch(`/api/cases/${caseNumber}/documents`, {
          cache: "no-store",
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load documents");
        }

        setDocuments(data.documents ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load documents");
      } finally {
        if (mode === "initial") {
          setLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [caseNumber]
  );

  useEffect(() => {
    loadDocuments("initial");
  }, [loadDocuments]);

  function resetForm() {
    setFile(null);
    setNotes("");
    setDocumentType("general");
    setDragActive(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleUpload() {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", documentType);
      formData.append("notes", notes);

      const res = await fetch(`/api/cases/${caseNumber}/documents`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Upload failed");
      }

      resetForm();
      await loadDocuments("refresh");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(documentId: string) {
    try {
      const res = await fetch(
        `/api/cases/${caseNumber}/documents/${documentId}/download`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to download document");
      }

      if (data.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    }
  }

  function handleFileSelect(nextFile: File | null) {
    if (!nextFile) return;
    setFile(nextFile);
    setError(null);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#e5e5e5] bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-[#2b2b2b]">Upload Document</h2>

          <button
            type="button"
            onClick={() => loadDocuments("refresh")}
            disabled={refreshing || loading}
            className="rounded-md border border-[#d9d9d9] bg-white px-4 py-2 text-sm font-medium text-[#2b2b2b] hover:bg-[#f7f7f7] disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-1">
            <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
              Document Type
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full rounded-md border border-[#d9d9d9] px-4 py-2 text-sm"
            >
              <option value="general">General</option>
              <option value="correspondence">Correspondence</option>
              <option value="medical">Medical</option>
              <option value="retainer">Retainer</option>
              <option value="lor">LOR</option>
              <option value="police-report">Police Report</option>
              <option value="photo">Photo</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
              Notes
            </label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              className="w-full rounded-md border border-[#d9d9d9] px-4 py-2 text-sm"
            />
          </div>

          <div className="md:col-span-3">
            <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
              File
            </label>

            <div
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(false);

                const droppedFile = e.dataTransfer.files?.[0] ?? null;
                handleFileSelect(droppedFile);
              }}
              className={`rounded-xl border-2 border-dashed p-6 text-center transition ${
                dragActive
                  ? "border-[#4b0a06] bg-[#fcf6f5]"
                  : "border-[#d9d9d9] bg-[#fafafa]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
              />

              <p className="text-sm font-medium text-[#2b2b2b]">
                Drag and drop a file here
              </p>
              <p className="mt-1 text-sm text-[#6b6b6b]">
                or choose one manually
              </p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 rounded-md border border-[#d9d9d9] bg-white px-4 py-2 text-sm font-medium text-[#2b2b2b] hover:bg-[#f7f7f7]"
              >
                Choose File
              </button>

              {file ? (
                <div className="mt-4 rounded-md border border-[#e5e5e5] bg-white px-4 py-3 text-sm text-[#444444]">
                  Selected: <span className="font-medium">{file.name}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || uploading}
            className="rounded-md bg-[#4b0a06] px-4 py-2 text-sm font-medium text-white hover:bg-[#5f0d08] disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload Document"}
          </button>

          {file ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-[#d9d9d9] bg-white px-4 py-2 text-sm font-medium text-[#2b2b2b] hover:bg-[#f7f7f7]"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-[#e5e5e5] bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-[#2b2b2b]">Documents</h2>
          {!loading && documents.length > 0 ? (
            <span className="text-sm text-[#6b6b6b]">
              {documents.length} file{documents.length === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-[#6b6b6b]">Loading case documents...</p>
        ) : documents.length === 0 ? (
          <p className="mt-4 text-sm text-[#6b6b6b]">No documents uploaded yet.</p>
        ) : (
          <div className="mt-5 overflow-hidden rounded-lg border border-[#e5e5e5]">
            <table className="min-w-full text-sm">
              <thead className="border-b border-[#e5e5e5] bg-[#fafafa] text-left text-[#2b2b2b]">
                <tr>
                  <th className="px-4 py-3 font-semibold">File</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Size</th>
                  <th className="px-4 py-3 font-semibold">Uploaded</th>
                  <th className="px-4 py-3 font-semibold">Notes</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b border-[#eeeeee] last:border-b-0"
                  >
                    <td className="px-4 py-3 text-[#2b2b2b]">
                      {doc.original_filename}
                    </td>
                    <td className="px-4 py-3 text-[#555555]">
                      {doc.document_type}
                    </td>
                    <td className="px-4 py-3 text-[#555555]">
                      {formatFileSize(doc.size_bytes)}
                    </td>
                    <td className="px-4 py-3 text-[#555555]">
                      {formatDate(doc.created_at)}
                    </td>
                    <td className="px-4 py-3 text-[#555555]">
                      {doc.notes || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleDownload(doc.id)}
                        className="rounded-md border border-[#d9d9d9] bg-white px-3 py-1.5 text-sm font-medium text-[#2b2b2b] hover:bg-[#f7f7f7]"
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}