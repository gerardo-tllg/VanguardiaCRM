"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type CaseDocument = {
  id: string;
  created_at: string;
  original_filename: string;
  folder_id: string | null;
};

type DocumentFolder = {
  id: string;
  name: string;
};

type Props = {
  caseId: string;
};

type GridRow =
  | { kind: "folder"; id: string; folder: DocumentFolder }
  | { kind: "document"; id: string; document: CaseDocument };

export default function CaseDocumentsTab({ caseId }: Props) {
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [docsRes, foldersRes] = await Promise.all([
        fetch(`/api/cases/${caseId}/documents`).then((r) => r.json()),
        fetch(`/api/cases/${caseId}/folders`).then((r) => r.json()),
      ]);

      setDocuments(docsRes.documents ?? []);
      setFolders(foldersRes.folders ?? []);
    } catch {
      setError("Failed to load");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    load();
  }, [load]);

  function toggleDoc(id: string) {
    setSelectedDocumentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleFolder(id: string) {
    setSelectedFolderIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
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
    const total = selectedDocumentIds.length + selectedFolderIds.length;
    if (!total) return;

    if (!confirm(`Delete ${total} item(s)?`)) return;

    setBulkDeleting(true);

    try {
      for (const id of selectedDocumentIds) {
        await deleteDocument(id);
      }

      for (const id of selectedFolderIds) {
        await deleteFolder(id);
      }

      setSelectedDocumentIds([]);
      setSelectedFolderIds([]);
      await load();
    } finally {
      setBulkDeleting(false);
    }
  }

  const rows: GridRow[] = useMemo(() => {
    return [
      ...folders.map((f) => ({
        kind: "folder" as const,
        id: f.id,
        folder: f,
      })),
      ...documents.map((d) => ({
        kind: "document" as const,
        id: d.id,
        document: d,
      })),
    ];
  }, [documents, folders]);

  const totalSelected =
    selectedDocumentIds.length + selectedFolderIds.length;

  return (
    <div className="bg-white border rounded-xl">
      <div className="p-4 flex justify-between">
        <h2 className="text-xl font-semibold">Documents</h2>

        {totalSelected > 0 && (
          <button
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className="text-red-600"
          >
            {bulkDeleting ? "Deleting..." : "Delete Selected"}
          </button>
        )}
      </div>

      {error && <div className="text-red-500 p-4">{error}</div>}

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
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedFolderIds.includes(row.id)}
                        onChange={() => toggleFolder(row.id)}
                      />
                    </td>
                    <td>📁 {row.folder.name}</td>
                  </tr>
                );
              }

              return (
                <tr key={row.id}>
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedDocumentIds.includes(row.id)}
                      onChange={() => toggleDoc(row.id)}
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