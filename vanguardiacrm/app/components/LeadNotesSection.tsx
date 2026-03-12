"use client";

import { useState } from "react";
import type { LeadNoteRecord } from "@/types/lead-notes";

function formatCentralTime(dateString: string) {
  return new Date(dateString).toLocaleString("en-US", {
    timeZone: "America/Chicago",
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function LeadNotesSection({
  leadId,
  initialNotes,
}: {
  leadId: string;
  initialNotes: LeadNoteRecord[];
}) {
  const [notes, setNotes] = useState<LeadNoteRecord[]>(initialNotes);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();

    const trimmed = body.trim();
    if (!trimmed) return;

    setSaving(true);

    try {
      const res = await fetch(`/api/leads/${leadId}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          body: trimmed,
          author_email: "Staff",
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "Failed to add note");
      }

      setNotes((prev) => [result.note, ...prev]);
      setBody("");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to add note");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-[#e5e5e5] bg-white p-6">
      <h2 className="text-lg font-semibold text-[#2b2b2b]">Notes</h2>

      <form onSubmit={handleAddNote} className="mt-4 space-y-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a note for this lead..."
          rows={4}
          className="w-full rounded-md border border-[#d9d9d9] bg-white px-4 py-3 text-sm text-[#2b2b2b] placeholder:text-[#8a8a8a] outline-none focus:border-[#4b0a06]"
        />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-[#4b0a06] px-4 py-2 text-sm font-medium text-white hover:bg-[#5f0d08] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Add Note"}
          </button>
        </div>
      </form>

      <div className="mt-6 space-y-4">
        {notes.length > 0 ? (
          notes.map((note) => (
            <div
              key={note.id}
              className="rounded-lg border border-[#eeeeee] bg-[#fafafa] p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm font-semibold text-[#2b2b2b]">
                  {note.author_email || "Unknown"}
                </div>
                <div className="text-xs text-[#6b6b6b]">
                  {formatCentralTime(note.created_at)}
                </div>
              </div>

              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#444444]">
                {note.body}
              </p>
            </div>
          ))
        ) : (
          <div className="text-sm text-[#6b6b6b]">No notes yet.</div>
        )}
      </div>
    </div>
  );
}