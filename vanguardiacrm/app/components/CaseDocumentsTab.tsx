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
  | { kind: "folder"; id: string; name: string; folder: DocumentFolder }
  | { kind: "document"; id: string; name: string; document: CaseDocument };

export default function CaseDocumentsTab({ caseId }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [docsRes, foldersRes] = await Promise.all([
        fetch(`/api/cases/${caseId}/documents`).then((r) => r.json()),
        fetch(`/api/cases/${caseId}/folders`).then((r) => r.json()),
      ]);

      setDocuments(docsRes.documents ?? []);
      setFolders(foldersRes.folders ?? []);
    } catch {
      setError("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  function toggleDocumentSelect(id: string) {
    setSelectedDocumentIds((current) =>
      current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id]
    );
  }

  function toggleFolderSelect(id: string) {
    setSelectedFolderIds((current) =>
      current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id]
    );
  }

  async function deleteDocument(id: string) {
    await fetch(`/api/cases/${caseId}/documents/${id}`, {
      method: "DELETE",
    });
  }

  async function deleteFolder(id: string) {
    await fetch(`/api/cases/${caseId}/folders/${id}`, {
      method: "DELETE",
    });
  }

  async function handleBulkDelete() {
    const total =
      selectedDocumentIds.length + selectedFolderIds.length;

    if (!total) return;

    if (!confirm(`Delete ${total} item(s)?`)) return;

    try {
      for (const id of selectedDocumentIds) {
        await deleteDocument(id);
      }

      for (const id of selectedFolderIds) {
        await deleteFolder(id);
      }

      setSelectedDocumentIds([]);
      setSelectedFolderIds([]);

      await loadDocuments();
    } catch {
      setError("Bulk delete failed");
    }
  }

  const rows: GridRow[] = useMemo(() => {
    return [
      ...folders.map((f) => ({
        kind: "folder" as const,
        id: f.id,
        name: f.name,
        folder: f,
      })),
      ...documents.map((d) => ({
        kind: "document" as const,
        id: d.id,
        name: d.original_filename,
        document: d,
      })),
    ];
  }, [documents, folders]);

  const totalSelected =
    selectedDocumentIds.length + selectedFolderIds.length;

  return (
    <div className="w-full rounded-xl border border-[#dadada] bg-white shadow-sm">
      <div className="border-b px-4 py-4 flex justify-between">
        <h2 className="text-xl font-semibold">Documents</h2>

        {totalSelected > 0 && (
          <button
            onClick={handleBulkDelete}
            className="text-red-600"
          >
            Delete Selected
          </button>
        )}
      </div>

      {error && (
        <div className="text-red-500 p-4">{error}</div>
      )}

      <table className="w-full">
        <tbody>
          {loading ? (
            <tr>
              <td className="p-4">Loading...</td>
            </tr>
          ) : (
            rows.map((row) => {
              if (row.kind === "folder") {
                return (
                  <tr key={row.id}>
                    <td className="px-4 py-5">
                      <input
                        type="checkbox"
                        checked={selectedFolderIds.includes(row.id)}
                        onChange={() => toggleFolderSelect(row.id)}
                      />
                    </td>
                    <td>📁 {row.folder.name}</td>
                  </tr>
                );
              }

              return (
                <tr key={row.id}>
                  <td className="px-4 py-5">
                    <input
                      type="checkbox"
                      checked={selectedDocumentIds.includes(row.id)}
                      onChange={() => toggleDocumentSelect(row.id)}
                    />
                  </td>
                  <td>{row.document.original_filename}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}