"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type CaseDocument = {
  id: string;
  created_at: string;
  original_filename: string;
  mime_type: string | null;
  size_bytes: number | null;
  document_type: string;
  uploaded_by: string | null;
  notes: string | null;
  folder_id: string | null;
  document_url?: string | null;
};

type DocumentFolder = {
  id: string;
  name: string;
  sort_order: number;
};

type Props = {
  caseNumber: string;
};

const DOCUMENT_TYPES = [
  "general",
  "correspondence",
  "medical",
  "retainer",
  "lor",
  "police-report",
  "photo",
];

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
  const [folders, setFolders] = useState<DocumentFolder[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [savingDocumentId, setSavingDocumentId] = useState<string | null>(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);

  const [documentType, setDocumentType] = useState("general");
  const [notes, setNotes] = useState("");
  const [folderId, setFolderId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string>("all");

  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [editDocumentType, setEditDocumentType] = useState("general");
  const [editNotes, setEditNotes] = useState("");
  const [editFolderId, setEditFolderId] = useState<string>("");

  const loadDocuments = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (mode === "initial") {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(null);

      try {
        const [docsRes, foldersRes] = await Promise.all([
          fetch(`/api/cases/${caseNumber}/documents`, { cache: "no-store" }),
          fetch(`/api/cases/${caseNumber}/folders`, { cache: "no-store" }),
        ]);

        const docsData = await docsRes.json();
        const foldersData = await foldersRes.json();

        if (!docsRes.ok) {
          throw new Error(docsData?.error || "Failed to load documents");
        }

        if (!foldersRes.ok) {
          throw new Error(foldersData?.error || "Failed to load folders");
        }

        setDocuments(docsData.documents ?? []);
        setFolders(foldersData.folders ?? []);
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

  function resetUploadForm() {
    setFile(null);
    setNotes("");
    setDocumentType("general");
    setFolderId("");
    setDragActive(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleFileSelect(nextFile: File | null) {
    if (!nextFile) return;
    setFile(nextFile);
    setError(null);
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
      if (folderId) {
        formData.append("folder_id", folderId);
      }

      const res = await fetch(`/api/cases/${caseNumber}/documents`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Upload failed");
      }

      resetUploadForm();
      await loadDocuments("refresh");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleCreateFolder() {
    const trimmed = newFolderName.trim();
    if (!trimmed) return;

    setCreatingFolder(true);
    setError(null);

    try {
      const res = await fetch(`/api/cases/${caseNumber}/folders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmed,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to create folder");
      }

      setNewFolderName("");
      await loadDocuments("refresh");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create folder");
    } finally {
      setCreatingFolder(false);
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

  async function handlePreview(documentId: string) {
    try {
      const res = await fetch(
        `/api/cases/${caseNumber}/documents/${documentId}/download`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to preview document");
      }

      if (data.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
    }
  }

  function startEditingDocument(doc: CaseDocument) {
    setEditingDocumentId(doc.id);
    setEditDocumentType(doc.document_type || "general");
    setEditNotes(doc.notes || "");
    setEditFolderId(doc.folder_id || "");
  }

  function cancelEditingDocument() {
    setEditingDocumentId(null);
    setEditDocumentType("general");
    setEditNotes("");
    setEditFolderId("");
  }

  async function handleSaveDocument(documentId: string) {
    setSavingDocumentId(documentId);
    setError(null);

    try {
      const res = await fetch(
        `/api/cases/${caseNumber}/documents/${documentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            document_type: editDocumentType,
            notes: editNotes,
            folder_id: editFolderId || null,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to update document");
      }

      cancelEditingDocument();
      await loadDocuments("refresh");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update document");
    } finally {
      setSavingDocumentId(null);
    }
  }

  async function handleDeleteDocument(documentId: string) {
    const confirmed = window.confirm(
      "Delete this document? This will remove the file from the case."
    );
    if (!confirmed) return;

    setDeletingDocumentId(documentId);
    setError(null);

    try {
      const res = await fetch(
        `/api/cases/${caseNumber}/documents/${documentId}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to delete document");
      }

      if (editingDocumentId === documentId) {
        cancelEditingDocument();
      }

      await loadDocuments("refresh");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete document");
    } finally {
      setDeletingDocumentId(null);
    }
  }

  const folderNameById = useMemo(() => {
    const map = new Map<string, string>();
    folders.forEach((folder) => map.set(folder.id, folder.name));
    return map;
  }, [folders]);

  const filteredDocuments = useMemo(() => {
    if (selectedFolderFilter === "all") return documents;
    if (selectedFolderFilter === "unfiled") {
      return documents.filter((doc) => !doc.folder_id);
    }
    return documents.filter((doc) => doc.folder_id === selectedFolderFilter);
  }, [documents, selectedFolderFilter]);

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
          <div>
            <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
              Document Type
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full rounded-md border border-[#d9d9d9] px-4 py-2 text-sm"
            >
              {DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
              Folder
            </label>
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="w-full rounded-md border border-[#d9d9d9] px-4 py-2 text-sm"
            >
              <option value="">No Folder</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>

          <div>
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
                handleFileSelect(e.dataTransfer.files?.[0] ?? null);
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
              onClick={resetUploadForm}
              className="rounded-md border border-[#d9d9d9] bg-white px-4 py-2 text-sm font-medium text-[#2b2b2b] hover:bg-[#f7f7f7]"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-[#e5e5e5] bg-white p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#2b2b2b]">Folders</h2>
            <p className="mt-1 text-sm text-[#6b6b6b]">
              Organize and edit case documents.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="New folder name"
              className="rounded-md border border-[#d9d9d9] px-4 py-2 text-sm"
            />
            <button
              type="button"
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim() || creatingFolder}
              className="rounded-md border border-[#d9d9d9] bg-white px-4 py-2 text-sm font-medium text-[#2b2b2b] hover:bg-[#f7f7f7] disabled:opacity-50"
            >
              {creatingFolder ? "Creating..." : "Create Folder"}
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedFolderFilter("all")}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              selectedFolderFilter === "all"
                ? "border-[#4b0a06] bg-[#fdf6f5] text-[#4b0a06]"
                : "border-[#d9d9d9] bg-white text-[#444444]"
            }`}
          >
            All Documents
          </button>

          <button
            type="button"
            onClick={() => setSelectedFolderFilter("unfiled")}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              selectedFolderFilter === "unfiled"
                ? "border-[#4b0a06] bg-[#fdf6f5] text-[#4b0a06]"
                : "border-[#d9d9d9] bg-white text-[#444444]"
            }`}
          >
            Unfiled
          </button>

          {folders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              onClick={() => setSelectedFolderFilter(folder.id)}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                selectedFolderFilter === folder.id
                  ? "border-[#4b0a06] bg-[#fdf6f5] text-[#4b0a06]"
                  : "border-[#d9d9d9] bg-white text-[#444444]"
              }`}
            >
              {folder.name}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[#e5e5e5] bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-[#2b2b2b]">Documents</h2>
          {!loading && (
            <span className="text-sm text-[#6b6b6b]">
              {filteredDocuments.length} file{filteredDocuments.length === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-[#6b6b6b]">Loading case documents...</p>
        ) : filteredDocuments.length === 0 ? (
          <p className="mt-4 text-sm text-[#6b6b6b]">
            No documents found for this folder.
          </p>
        ) : (
          <div className="mt-5 overflow-hidden rounded-lg border border-[#e5e5e5]">
            <table className="min-w-full text-sm">
              <thead className="border-b border-[#e5e5e5] bg-[#fafafa] text-left text-[#2b2b2b]">
                <tr>
                  <th className="px-4 py-3 font-semibold">File</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Folder</th>
                  <th className="px-4 py-3 font-semibold">Size</th>
                  <th className="px-4 py-3 font-semibold">Uploaded</th>
                  <th className="px-4 py-3 font-semibold">Notes</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => {
                  const isEditing = editingDocumentId === doc.id;

                  return (
                    <tr
                      key={doc.id}
                      className="border-b border-[#eeeeee] last:border-b-0"
                    >
                      <td className="px-4 py-3 text-[#2b2b2b]">
                        {doc.original_filename}
                      </td>

                      <td className="px-4 py-3 text-[#555555]">
                        {isEditing ? (
                          <select
                            value={editDocumentType}
                            onChange={(e) => setEditDocumentType(e.target.value)}
                            className="w-full rounded-md border border-[#d9d9d9] px-3 py-2 text-sm"
                          >
                            {DOCUMENT_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        ) : (
                          doc.document_type
                        )}
                      </td>

                      <td className="px-4 py-3 text-[#555555]">
                        {isEditing ? (
                          <select
                            value={editFolderId}
                            onChange={(e) => setEditFolderId(e.target.value)}
                            className="w-full rounded-md border border-[#d9d9d9] px-3 py-2 text-sm"
                          >
                            <option value="">No Folder</option>
                            {folders.map((folder) => (
                              <option key={folder.id} value={folder.id}>
                                {folder.name}
                              </option>
                            ))}
                          </select>
                        ) : doc.folder_id ? (
                          folderNameById.get(doc.folder_id) || "—"
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="px-4 py-3 text-[#555555]">
                        {formatFileSize(doc.size_bytes)}
                      </td>

                      <td className="px-4 py-3 text-[#555555]">
                        {formatDate(doc.created_at)}
                      </td>

                      <td className="px-4 py-3 text-[#555555]">
                        {isEditing ? (
                          <input
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            className="w-full rounded-md border border-[#d9d9d9] px-3 py-2 text-sm"
                            placeholder="Optional notes"
                          />
                        ) : (
                          doc.notes || "—"
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleSaveDocument(doc.id)}
                                disabled={savingDocumentId === doc.id}
                                className="rounded-md bg-[#4b0a06] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#5f0d08] disabled:opacity-50"
                              >
                                {savingDocumentId === doc.id ? "Saving..." : "Save"}
                              </button>

                              <button
                                type="button"
                                onClick={cancelEditingDocument}
                                className="rounded-md border border-[#d9d9d9] bg-white px-3 py-1.5 text-sm font-medium text-[#2b2b2b] hover:bg-[#f7f7f7]"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handlePreview(doc.id)}
                                className="rounded-md border border-[#d9d9d9] bg-white px-3 py-1.5 text-sm font-medium text-[#2b2b2b] hover:bg-[#f7f7f7]"
                              >
                                Preview
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDownload(doc.id)}
                                className="rounded-md border border-[#d9d9d9] bg-white px-3 py-1.5 text-sm font-medium text-[#2b2b2b] hover:bg-[#f7f7f7]"
                              >
                                Download
                              </button>

                              <button
                                type="button"
                                onClick={() => startEditingDocument(doc)}
                                className="rounded-md border border-[#d9d9d9] bg-white px-3 py-1.5 text-sm font-medium text-[#2b2b2b] hover:bg-[#f7f7f7]"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteDocument(doc.id)}
                                disabled={deletingDocumentId === doc.id}
                                className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                              >
                                {deletingDocumentId === doc.id ? "Deleting..." : "Delete"}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}