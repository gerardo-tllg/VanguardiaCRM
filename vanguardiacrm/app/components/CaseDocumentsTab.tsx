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

type GridRow =
  | {
      kind: "folder";
      id: string;
      name: string;
      folder: DocumentFolder;
    }
  | {
      kind: "document";
      id: string;
      name: string;
      document: CaseDocument;
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

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function shortDocId(id: string) {
  return id.slice(0, 8);
}

function formatFolderName(name: string) {
  return name.replace(/[-_]/g, " ");
}

function formatFileSize(size: number | null) {
  if (!size) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

async function parseJsonResponse(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  let data: unknown = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Server returned a non-JSON response (${res.status}).`);
  }

  if (!isRecord(data)) {
    throw new Error(`Server returned an invalid JSON object (${res.status}).`);
  }

  if (!res.ok) {
    const message =
      typeof data.error === "string" && data.error.trim()
        ? data.error
        : `Request failed (${res.status})`;

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
  const [previewingDocumentId, setPreviewingDocumentId] = useState<string | null>(null);
  const [downloadingDocumentId, setDownloadingDocumentId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [bulkMoving, setBulkMoving] = useState(false);

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [moveTargetFolderId, setMoveTargetFolderId] = useState<string>("");

  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [editDocumentType, setEditDocumentType] = useState("general");
  const [editNotes, setEditNotes] = useState("");
  const [editFolderId, setEditFolderId] = useState("");

  const loadDocuments = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (mode === "initial") setLoading(true);
      else setRefreshing(true);

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
        if (mode === "initial") setLoading(false);
        else setRefreshing(false);
      }
    },
    [caseId]
  );

  useEffect(() => {
    void loadDocuments("initial");
  }, [loadDocuments]);

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => documents.some((doc) => doc.id == id)));
  }, [documents]);

  function resetUploadForm() {
    setFile(null);
    setNotes("");
    setDocumentType("general");
    setFolderId("");
    setDragActive(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });

      await parseJsonResponse(res);

      setNewFolderName("");
      setShowFolderPanel(false);
      await loadDocuments("refresh");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create folder");
    } finally {
      setCreatingFolder(false);
    }
  }

  async function handlePreview(documentId: string) {
    setPreviewingDocumentId(documentId);
    setError(null);

    try {
      const res = await fetch(`/api/cases/${caseId}/documents/${documentId}/preview`, {
        cache: "no-store",
      });

      const data = await parseJsonResponse(res);
      const url = getString(data.url);

      if (!url) {
        throw new Error("Missing preview URL");
      }

      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setPreviewingDocumentId(null);
    }
  }

  function triggerBrowserDownload(url: string, filename: string) {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function downloadDocument(documentId: string) {
    const res = await fetch(`/api/cases/${caseId}/documents/${documentId}/download`, {
      cache: "no-store",
    });

    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await parseJsonResponse(res);
      throw new Error(getString(data.error) || "Download failed");
    }

    if (!res.ok) {
      throw new Error(`Download failed (${res.status})`);
    }

    const blob = await res.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const disposition = res.headers.get("content-disposition") || "";
    const match = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i);
    const filename = decodeURIComponent((match?.[1] || match?.[2] || "document").trim());

    triggerBrowserDownload(objectUrl, filename);
    window.URL.revokeObjectURL(objectUrl);
  }

  async function handleDownload(documentId: string) {
    setDownloadingDocumentId(documentId);
    setError(null);

    try {
      await downloadDocument(documentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloadingDocumentId(null);
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

  async function patchDocumentFolder(documentId: string, nextFolderId: string | null) {
    const res = await fetch(`/api/cases/${caseId}/documents/${documentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder_id: nextFolderId }),
    });

    await parseJsonResponse(res);
  }

  async function deleteFolder(folderId: string) {
    const res = await fetch(`/api/cases/${caseId}/folders/${folderId}`, {
      method: "DELETE",
    });

    await parseJsonResponse(res);
  }

  async function handleSaveDocument(documentId: string) {
    setSavingDocumentId(documentId);
    setError(null);

    try {
      const res = await fetch(`/api/cases/${caseId}/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_type: editDocumentType,
          notes: editNotes,
          folder_id: editFolderId || null,
        }),
      });

      await parseJsonResponse(res);
      cancelEditingDocument();
      await loadDocuments("refresh");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update document");
    } finally {
      setSavingDocumentId(null);
    }
  }

  async function deleteDocument(documentId: string) {
    const res = await fetch(`/api/cases/${caseId}/documents/${documentId}`, {
      method: "DELETE",
    });

    await parseJsonResponse(res);
  }

  async function handleDeleteDocument(documentId: string) {
    const confirmed = window.confirm("Delete this document? This will remove the file from the case.");
    if (!confirmed) return;

    setDeletingDocumentId(documentId);
    setError(null);

    try {
      await deleteDocument(documentId);

      if (editingDocumentId === documentId) {
        cancelEditingDocument();
      }

      setSelectedIds((current) => current.filter((id) => id !== documentId));
      await loadDocuments("refresh");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete document");
    } finally {
      setDeletingDocumentId(null);
    }
  }

  function getDocumentIdsForSelectedFolders() {
    const folderDocumentIds = documents
      .filter((doc) => doc.folder_id && selectedFolderIds.includes(doc.folder_id))
      .map((doc) => doc.id);

    return folderDocumentIds;
  }

  async function handleBulkDownload() {
    const folderDocumentIds = getDocumentIdsForSelectedFolders();
    const idsToDownload = Array.from(new Set([...selectedIds, ...folderDocumentIds]));

    if (idsToDownload.length === 0) return;

    setBulkDownloading(true);
    setError(null);

    try {
      for (const id of idsToDownload) {
        await downloadDocument(id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk download failed");
    } finally {
      setBulkDownloading(false);
    }
  }

  async function handleBulkDelete() {
    const totalSelected = selectedIds.length + selectedFolderIds.length;
    if (totalSelected === 0) return;

    const confirmed = window.confirm(
      `Delete ${totalSelected} selected item${totalSelected === 1 ? "" : "s"}? Selected folders will be deleted and any files inside them will be unfiled.`
    );
    if (!confirmed) return;

    setBulkDeleting(true);
    setError(null);

    try {
      for (const id of selectedIds) {
        await deleteDocument(id);
      }

      for (const folderId of selectedFolderIds) {
        await deleteFolder(folderId);
      }

      if (editingDocumentId && selectedIds.includes(editingDocumentId)) {
        cancelEditingDocument();
      }

      if (selectedFolderIds.includes(selectedFolderFilter)) {
        setSelectedFolderFilter("all");
      }

      setSelectedIds([]);
      setSelectedFolderIds([]);
      setMoveTargetFolderId("");
      await loadDocuments("refresh");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk delete failed");
    } finally {
      setBulkDeleting(false);
    }
  }

  async function handleBulkMove() {
    if (selectedIds.length === 0 || !moveTargetFolderId) return;

    setBulkMoving(true);
    setError(null);

    try {
      const nextFolderId = moveTargetFolderId === "__UNFILED__" ? null : moveTargetFolderId;

      for (const documentId of selectedIds) {
        await patchDocumentFolder(documentId, nextFolderId);
      }

      if (editingDocumentId && selectedIds.includes(editingDocumentId)) {
        cancelEditingDocument();
      }

      setSelectedIds([]);
      setMoveTargetFolderId("");
      await loadDocuments("refresh");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk move failed");
    } finally {
      setBulkMoving(false);
    }
  }

  const rows = useMemo<GridRow[]>(() => {
    const folderRows: GridRow[] =
      selectedFolderFilter === "all"
        ? [...folders]
            .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
            .map((folder) => ({
              kind: "folder",
              id: folder.id,
              name: folder.name,
              folder,
            }))
        : [];

    const filteredDocuments =
  selectedFolderFilter === "all"
    ? documents.filter((doc) => !doc.folder_id)
    : selectedFolderFilter === "unfiled"
    ? documents.filter((doc) => !doc.folder_id)
    : documents.filter((doc) => doc.folder_id === selectedFolderFilter);

    const documentRows: GridRow[] = filteredDocuments.map((document) => ({
      kind: "document",
      id: document.id,
      name: document.original_filename,
      document,
    }));

    return [...folderRows, ...documentRows];
  }, [documents, folders, selectedFolderFilter]);

  const allVisibleDocumentIds = useMemo(
    () => rows.filter((row) => row.kind === "document").map((row) => row.id),
    [rows]
  );

  const allVisibleFolderIds = useMemo(
    () => rows.filter((row) => row.kind === "folder").map((row) => row.id),
    [rows]
  );

  const allSelected =
    allVisibleDocumentIds.length + allVisibleFolderIds.length > 0 &&
    allVisibleDocumentIds.every((id) => selectedIds.includes(id)) &&
    allVisibleFolderIds.every((id) => selectedFolderIds.includes(id));

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds((current) => current.filter((id) => !allVisibleDocumentIds.includes(id)));
      setSelectedFolderIds((current) => current.filter((id) => !allVisibleFolderIds.includes(id)));
      return;
    }

    setSelectedIds((current) => Array.from(new Set([...current, ...allVisibleDocumentIds])));
    setSelectedFolderIds((current) => Array.from(new Set([...current, ...allVisibleFolderIds])));
  }

  function toggleSelect(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  }

  function toggleFolderSelect(id: string) {
    setSelectedFolderIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  }

  return (
    <div className="w-full rounded-xl border border-[#dadada] bg-white shadow-sm">
      <div className="border-b border-[#e9e9e9] px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[24px] font-semibold text-[#2f2f2f]">Documents</h2>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void loadDocuments("refresh")}
              disabled={refreshing || loading}
              className="rounded-md border border-[#cfcfcf] bg-white px-4 py-2 text-sm font-medium text-[#2f2f2f] hover:bg-[#f7f7f7] disabled:opacity-50"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowFolderPanel((prev) => !prev);
                setShowUploadPanel(false);
              }}
              className="rounded-md border border-[#cfcfcf] bg-white px-4 py-2 text-sm font-medium text-[#2f2f2f] hover:bg-[#f7f7f7]"
            >
              + Folder
            </button>

            <button
              type="button"
              onClick={() => {
                setShowUploadPanel((prev) => !prev);
                setShowFolderPanel(false);
              }}
              className="rounded-md bg-[#650d02] px-4 py-2 text-sm font-medium text-white hover:bg-[#7a1204]"
            >
              + Add Document
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedFolderFilter("all")}
            className={`rounded-md px-3 py-1.5 text-sm ${
              selectedFolderFilter === "all"
                ? "bg-[#f4ece9] font-medium text-[#650d02]"
                : "text-[#555555] hover:bg-[#f5f5f5]"
            }`}
          >
            All Files
          </button>

          <button
            type="button"
            onClick={() => setSelectedFolderFilter("unfiled")}
            className={`rounded-md px-3 py-1.5 text-sm ${
              selectedFolderFilter === "unfiled"
                ? "bg-[#f4ece9] font-medium text-[#650d02]"
                : "text-[#555555] hover:bg-[#f5f5f5]"
            }`}
          >
            Unfiled
          </button>

          {folders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              onClick={() => setSelectedFolderFilter(folder.id)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                selectedFolderFilter === folder.id
                  ? "bg-[#f4ece9] font-medium text-[#650d02]"
                  : "text-[#555555] hover:bg-[#f5f5f5]"
              }`}
            >
              {formatFolderName(folder.name)}
            </button>
          ))}
        </div>

        {selectedIds.length > 0 || selectedFolderIds.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#ead8d3] bg-[#faf4f2] px-4 py-3">
            <div className="text-sm font-medium text-[#4a2b24]">
              {selectedIds.length + selectedFolderIds.length} selected
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={moveTargetFolderId}
                onChange={(e) => setMoveTargetFolderId(e.target.value)}
                disabled={selectedIds.length === 0 || bulkMoving || bulkDeleting || bulkDownloading}
                className="rounded-md border border-[#d1d1d1] bg-white px-3 py-1.5 text-sm text-[#333333] disabled:opacity-50"
              >
                <option value="">Move to folder...</option>
                <option value="__UNFILED__">Remove from folder</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {formatFolderName(folder.name)}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleBulkMove}
                disabled={!moveTargetFolderId || selectedIds.length === 0 || bulkMoving || bulkDeleting || bulkDownloading}
                className="rounded-md border border-[#d1d1d1] bg-white px-3 py-1.5 text-sm font-medium text-[#333333] hover:bg-[#f7f7f7] disabled:opacity-50"
              >
                {bulkMoving ? "Moving..." : "Move Selected"}
              </button>

              <button
                type="button"
                onClick={handleBulkDownload}
                disabled={selectedIds.length + selectedFolderIds.length === 0 || bulkDownloading || bulkDeleting || bulkMoving}
                className="rounded-md border border-[#d1d1d1] bg-white px-3 py-1.5 text-sm font-medium text-[#333333] hover:bg-[#f7f7f7] disabled:opacity-50"
              >
                {bulkDownloading ? "Downloading..." : "Download Selected"}
              </button>

              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={bulkDeleting || bulkDownloading || bulkMoving}
                className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                {bulkDeleting ? "Deleting..." : "Delete Selected"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedIds([]);
                  setSelectedFolderIds([]);
                  setMoveTargetFolderId("");
                }}
                className="rounded-md border border-[#d1d1d1] bg-white px-3 py-1.5 text-sm font-medium text-[#333333] hover:bg-[#f7f7f7]"
              >
                Clear
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {showFolderPanel ? (
        <div className="border-b border-[#e9e9e9] bg-[#fafafa] px-4 py-4 sm:px-6">
          <div className="max-w-md space-y-3">
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full rounded-md border border-[#d5d5d5] bg-white px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim() || creatingFolder}
                className="rounded-md bg-[#650d02] px-3 py-2 text-sm font-medium text-white hover:bg-[#7a1204] disabled:opacity-50"
              >
                {creatingFolder ? "Creating..." : "Create Folder"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFolderPanel(false);
                  setNewFolderName("");
                }}
                className="rounded-md border border-[#d5d5d5] bg-white px-3 py-2 text-sm font-medium text-[#333333] hover:bg-[#f7f7f7]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showUploadPanel ? (
        <div className="border-b border-[#e9e9e9] bg-[#fafafa] px-4 py-5 sm:px-6">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                Document Type
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full rounded-md border border-[#d5d5d5] bg-white px-3 py-2 text-sm"
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
                className="w-full rounded-md border border-[#d5d5d5] bg-white px-3 py-2 text-sm"
              >
                <option value="">No Folder</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {formatFolderName(folder.name)}
                  </option>
                ))}
              </select>
            </div>

            <div className="xl:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                Notes
              </label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
                className="w-full rounded-md border border-[#d5d5d5] bg-white px-3 py-2 text-sm"
              />
            </div>

            <div className="xl:col-span-4">
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
                className={`rounded-lg border border-dashed p-5 ${
                  dragActive ? "border-[#650d02] bg-[#fff8f6]" : "border-[#d5d5d5] bg-white"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                />

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[#2b2b2b]">
                      Drag and drop a file here
                    </p>
                    <p className="mt-1 text-sm text-[#6b6b6b]">
                      or choose one manually
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-md border border-[#d5d5d5] bg-white px-4 py-2 text-sm font-medium text-[#333333] hover:bg-[#f7f7f7]"
                  >
                    Choose File
                  </button>
                </div>

                {file ? (
                  <div className="mt-4 rounded-md border border-[#e5e5e5] bg-[#fafafa] px-4 py-3 text-sm text-[#444444]">
                    Selected: <span className="font-medium">{file.name}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || uploading}
              className="rounded-md bg-[#650d02] px-4 py-2 text-sm font-medium text-white hover:bg-[#7a1204] disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload Document"}
            </button>

            <button
              type="button"
              onClick={() => {
                resetUploadForm();
                setShowUploadPanel(false);
              }}
              className="rounded-md border border-[#d5d5d5] bg-white px-4 py-2 text-sm font-medium text-[#333333] hover:bg-[#f7f7f7]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:px-6">
          {error}
        </div>
      ) : null}

      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-245 text-sm">
          <thead className="bg-[#efefef] text-left text-[#4a4a4a]">
            <tr>
              <th className="w-12 px-4 py-4">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-[#cfcfcf]"
                />
              </th>
              <th className="w-[34%] px-4 py-4 font-semibold">File Name</th>
              <th className="w-[12%] px-4 py-4 font-semibold">Reviewed By</th>
              <th className="w-[15%] px-4 py-4 font-semibold">Uploaded By</th>
              <th className="w-[10%] px-4 py-4 font-semibold">Doc ID</th>
              <th className="w-[14%] px-4 py-4 font-semibold">Uploaded Date</th>
              <th className="w-[14%] px-4 py-4 font-semibold">Last Modified Date</th>
              <th className="w-[1%] px-4 py-4"></th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-[#6b6b6b]">
                  Loading case documents...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-[#6b6b6b]">
                  No files found.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => {
                const striped = index % 2 === 0 ? "bg-white" : "bg-[#f6f6f6]";

                if (row.kind === "folder") {
                  return (
                    <tr key={`folder-${row.id}`} className={`${striped} border-t border-[#ececec]`}>
                      <td className="px-4 py-5 align-middle">
                        <input
                          type="checkbox"
                          checked={selectedFolderIds.includes(row.id)}
                          onChange={() => toggleFolderSelect(row.id)}
                          className="h-4 w-4 rounded border-[#cfcfcf]"
                        />
                      </td>

                     <td className="px-4 py-5 align-middle text-[#2f2f2f]">
  <div className="flex items-center gap-2">
    <span className="text-[18px]">📁</span>
    <button
      type="button"
      onClick={() => setSelectedFolderFilter(row.folder.id)}
      className="font-medium underline underline-offset-2 hover:text-[#650d02]"
    >
      {formatFolderName(row.folder.name)}
    </button>
  </div>
</td>

                      <td className="px-4 py-5 text-[#666666]">—</td>
                      <td className="px-4 py-5 text-[#666666]">—</td>
                      <td className="px-4 py-5 text-[#666666]">—</td>
                      <td className="px-4 py-5 text-[#666666]">—</td>
                      <td className="px-4 py-5 text-[#666666]">—</td>
                      <td className="px-4 py-5 text-right text-[#666666]">▾</td>
                    </tr>
                  );
                }

                const doc = row.document;
                const isEditing = editingDocumentId === doc.id;

                return (
                  <tr key={doc.id} className={`${striped} border-t border-[#ececec] align-top`}>
                    <td className="px-4 py-5 align-middle">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(doc.id)}
                        onChange={() => toggleSelect(doc.id)}
                        className="h-4 w-4 rounded border-[#cfcfcf]"
                      />
                    </td>

                    <td className="px-4 py-5 text-[#2f2f2f]">
                      <div className="wrap-break-word font-medium underline underline-offset-2">
                        {doc.original_filename}
                      </div>

                      {!isEditing ? (
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#7a7a7a]">
                          <span>
                            Folder:{" "}
                            {doc.folder_id
                              ? formatFolderName(folders.find((f) => f.id === doc.folder_id)?.name || "")
                              : "No folder"}
                          </span>
                          <span>Type: {doc.document_type}</span>
                          <span>Size: {formatFileSize(doc.size_bytes)}</span>
                          <span>Notes: {doc.notes || "—"}</span>
                        </div>
                      ) : (
                        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
                          <select
                            value={editDocumentType}
                            onChange={(e) => setEditDocumentType(e.target.value)}
                            className="w-full rounded-md border border-[#d5d5d5] bg-white px-3 py-2 text-sm"
                          >
                            {DOCUMENT_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>

                          <select
                            value={editFolderId}
                            onChange={(e) => setEditFolderId(e.target.value)}
                            className="w-full rounded-md border border-[#d5d5d5] bg-white px-3 py-2 text-sm"
                          >
                            <option value="">No Folder</option>
                            {folders.map((folder) => (
                              <option key={folder.id} value={folder.id}>
                                {formatFolderName(folder.name)}
                              </option>
                            ))}
                          </select>

                          <input
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            className="w-full rounded-md border border-[#d5d5d5] bg-white px-3 py-2 text-sm"
                            placeholder="Optional notes"
                          />
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-5 text-[#666666]">—</td>
                    <td className="px-4 py-5 text-[#2f2f2f]">{doc.uploaded_by || "—"}</td>
                    <td className="px-4 py-5 text-[#2f2f2f]">{shortDocId(doc.id)}</td>
                    <td className="px-4 py-5 text-[#2f2f2f]">{formatDate(doc.created_at)}</td>
                    <td className="px-4 py-5 text-[#2f2f2f]">{formatDate(doc.created_at)}</td>
                    <td className="px-4 py-5 text-right text-[#666666]">
                      {isEditing ? (
                        <button
                          type="button"
                          onClick={cancelEditingDocument}
                          className="text-sm hover:text-[#333333]"
                        >
                          ×
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditingDocument(doc)}
                          className="text-sm hover:text-[#333333]"
                          aria-label="Edit row"
                        >
                          ▾
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {editingDocumentId ? (
        <div className="border-t border-[#e9e9e9] px-4 py-4 sm:px-6">
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => handleSaveDocument(editingDocumentId)}
              disabled={savingDocumentId === editingDocumentId}
              className="rounded-md bg-[#650d02] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#7a1204] disabled:opacity-50"
            >
              {savingDocumentId === editingDocumentId ? "Saving..." : "Save"}
            </button>

            <button
              type="button"
              onClick={cancelEditingDocument}
              className="rounded-md border border-[#d5d5d5] bg-white px-3 py-1.5 text-sm font-medium text-[#333333] hover:bg-[#f7f7f7]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handlePreview(editingDocumentId)}
              disabled={previewingDocumentId === editingDocumentId}
              className="rounded-md border border-[#d1d1d1] bg-white px-3 py-1.5 text-sm font-medium text-[#333333] hover:bg-[#f7f7f7] disabled:opacity-50"
            >
              {previewingDocumentId === editingDocumentId ? "Opening..." : "Preview"}
            </button>

            <button
              type="button"
              onClick={() => handleDownload(editingDocumentId)}
              disabled={downloadingDocumentId === editingDocumentId}
              className="rounded-md border border-[#d1d1d1] bg-white px-3 py-1.5 text-sm font-medium text-[#333333] hover:bg-[#f7f7f7] disabled:opacity-50"
            >
              {downloadingDocumentId === editingDocumentId ? "Downloading..." : "Download"}
            </button>

            <button
              type="button"
              onClick={() => handleDeleteDocument(editingDocumentId)}
              disabled={deletingDocumentId === editingDocumentId}
              className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              {deletingDocumentId === editingDocumentId ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
