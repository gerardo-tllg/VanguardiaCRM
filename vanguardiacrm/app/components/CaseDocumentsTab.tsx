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
};

type DocumentFolder = {
  id: string;
  name: string;
  sort_order: number;
};

type Props = {
  caseId: string;
};

const DOCUMENT_TYPES = [
  "general",
  "correspondence",
  "medical",
  "retainer",
  "lor",
  "police-report",
  "photo",
] as const;

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCaseDocument(value: unknown): value is CaseDocument {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "string" &&
    typeof value.created_at === "string" &&
    typeof value.original_filename === "string" &&
    (typeof value.mime_type === "string" || value.mime_type === null) &&
    (typeof value.size_bytes === "number" || value.size_bytes === null) &&
    typeof value.document_type === "string" &&
    (typeof value.uploaded_by === "string" || value.uploaded_by === null) &&
    (typeof value.notes === "string" || value.notes === null) &&
    (typeof value.folder_id === "string" || value.folder_id === null)
  );
}

function isDocumentFolder(value: unknown): value is DocumentFolder {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.sort_order === "number"
  );
}

function getCaseDocuments(value: unknown): CaseDocument[] {
  return Array.isArray(value) ? value.filter(isCaseDocument) : [];
}

function getDocumentFolders(value: unknown): DocumentFolder[] {
  return Array.isArray(value) ? value.filter(isDocumentFolder) : [];
}

function getString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

async function parseJsonResponse(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  let data: unknown = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Server returned a non-JSON response. Check the API route.");
  }

  if (!isRecord(data)) {
    throw new Error("Server returned an invalid JSON object.");
  }

  if (!res.ok) {
    const message =
      typeof data.error === "string" && data.error.trim()
        ? data.error
        : "Request failed";

    throw new Error(message);
  }

  return data;
}

export default function CaseDocumentsTab({ caseId }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [savingDocumentId, setSavingDocumentId] = useState<string | null>(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);

  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [showFolderPanel, setShowFolderPanel] = useState(false);

  const [documentType, setDocumentType] = useState<string>("general");
  const [notes, setNotes] = useState("");
  const [folderId, setFolderId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string>("all");

  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [editDocumentType, setEditDocumentType] = useState<string>("general");
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
          fetch(`/api/cases/${caseId}/documents`, { cache: "no-store" }),
          fetch(`/api/cases/${caseId}/folders`, { cache: "no-store" }),
        ]);

        const docsData = await parseJsonResponse(docsRes);
        const foldersData = await parseJsonResponse(foldersRes);

        setDocuments(getCaseDocuments(docsData.documents));
        setFolders(getDocumentFolders(foldersData.folders));
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
    [caseId]
  );

  useEffect(() => {
    void loadDocuments("initial");
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
      if (folderId) formData.append("folder_id", folderId);

      const res = await fetch(`/api/cases/${caseId}/documents`, {
        method: "POST",
        body: formData,
      });

      await parseJsonResponse(res);

      resetUploadForm();
      setShowUploadPanel(false);
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
      const res = await fetch(`/api/cases/${caseId}/folders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: trimmed }),
      });

      const data = await parseJsonResponse(res);
      const folder = isRecord(data.folder) ? data.folder : null;
      const newFolderId = folder && typeof folder.id === "string" ? folder.id : "all";

      setNewFolderName("");
      setShowFolderPanel(false);
      setSelectedFolderFilter(newFolderId);
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
        `/api/cases/${caseId}/documents/${documentId}/download`
      );
      const data = await parseJsonResponse(res);
      const url = getString(data.url);

      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    }
  }

  async function handlePreview(documentId: string) {
    try {
      const res = await fetch(
        `/api/cases/${caseId}/documents/${documentId}/preview`
      );
      const data = await parseJsonResponse(res);
      const url = getString(data.url);

      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
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
        `/api/cases/${caseId}/documents/${documentId}`,
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

      await parseJsonResponse(res);

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
        `/api/cases/${caseId}/documents/${documentId}`,
        {
          method: "DELETE",
        }
      );

      await parseJsonResponse(res);

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
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-3 rounded-xl border border-[#e5e5e5] bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#2b2b2b]">Folders</h2>
          <button
            type="button"
            onClick={() => {
              setShowFolderPanel((prev) => !prev);
              setShowUploadPanel(false);
            }}
            className="rounded-md bg-[#4b0a06] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#5f0d08]"
          >
            + Folder
          </button>
        </div>

        {showFolderPanel ? (
          <div className="mt-4 space-y-3 rounded-lg border border-[#e5e5e5] bg-[#fafafa] p-3">
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full rounded-md border border-[#d9d9d9] px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim() || creatingFolder}
                className="rounded-md bg-[#4b0a06] px-3 py-2 text-sm font-medium text-white hover:bg-[#5f0d08] disabled:opacity-50"
              >
                {creatingFolder ? "Creating..." : "Create"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFolderPanel(false);
                  setNewFolderName("");
                }}
                className="rounded-md border border-[#d9d9d9] bg-white px-3 py-2 text-sm font-medium text-[#2b2b2b] hover:bg-[#f7f7f7]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-4 space-y-1">
          <button
            type="button"
            onClick={() => setSelectedFolderFilter("all")}
            className={`block w-full rounded-md px-3 py-2 text-left text-sm ${
              selectedFolderFilter === "all"
                ? "bg-[#fdf6f5] font-medium text-[#4b0a06]"
                : "text-[#2b2b2b] hover:bg-[#f7f7f7]"
            }`}
          >
            All Documents
          </button>

          <button
            type="button"
            onClick={() => setSelectedFolderFilter("unfiled")}
            className={`block w-full rounded-md px-3 py-2 text-left text-sm ${
              selectedFolderFilter === "unfiled"
                ? "bg-[#fdf6f5] font-medium text-[#4b0a06]"
                : "text-[#2b2b2b] hover:bg-[#f7f7f7]"
            }`}
          >
            Unfiled
          </button>

          {folders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              onClick={() => setSelectedFolderFilter(folder.id)}
              className={`block w-full rounded-md px-3 py-2 text-left text-sm ${
                selectedFolderFilter === folder.id
                  ? "bg-[#fdf6f5] font-medium text-[#4b0a06]"
                  : "text-[#2b2b2b] hover:bg-[#f7f7f7]"
              }`}
            >
              {folder.name}
            </button>
          ))}
        </div>
      </div>

      <div className="col-span-9 space-y-6">
        <div className="rounded-xl border border-[#e5e5e5] bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-[#2b2b2b]">Documents</h2>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => void loadDocuments("refresh")}
                disabled={refreshing || loading}
                className="rounded-md border border-[#d9d9d9] bg-white px-4 py-2 text-sm font-medium text-[#2b2b2b] hover:bg-[#f7f7f7] disabled:opacity-50"
              >
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowUploadPanel((prev) => !prev);
                  setShowFolderPanel(false);
                }}
                className="rounded-md bg-[#4b0a06] px-4 py-2 text-sm font-medium text-white hover:bg-[#5f0d08]"
              >
                + Add Document
              </button>
            </div>
          </div>

          {showUploadPanel ? (
            <div className="mt-5 rounded-xl border border-[#e5e5e5] bg-[#fafafa] p-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                        : "border-[#d9d9d9] bg-white"
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

              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="rounded-md bg-[#4b0a06] px-4 py-2 text-sm font-medium text-white hover:bg-[#5f0d08] disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Upload Document"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    resetUploadForm();
                    setShowUploadPanel(false);
                  }}
                  className="rounded-md border border-[#d9d9d9] bg-white px-4 py-2 text-sm font-medium text-[#2b2b2b] hover:bg-[#f7f7f7]"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

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
    </div>
  );
}