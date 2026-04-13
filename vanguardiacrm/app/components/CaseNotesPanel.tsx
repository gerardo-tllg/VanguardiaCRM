"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/admin";

type Note = {
  id: string;
  case_id: string;
  body: string;
  created_at: string;
  updated_at?: string | null;
  created_by?: string | null;
  author_name?: string | null;
};

type CaseNotesPanelProps = {
  caseId: string;
  initialNotes: Note[];
};

export default function CaseNotesPanel({
  caseId,
  initialNotes,
}: CaseNotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleAddNote() {
    const trimmed = body.trim();
    if (!trimmed) return;

    setError(null);

    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("You must be signed in to add a case note.");
      return;
    }

    startTransition(async () => {
      const { data, error } = await supabase
        .from("case_notes")
        .insert({
          case_id: caseId,
          body: trimmed,
          created_by: user.id,
        })
        .select("*")
        .single();

      if (error) {
        setError(error.message);
        return;
      }

      setNotes((prev) => [data as Note, ...prev]);
      setBody("");
    });
  }

  return (
    <aside className="w-full max-w-md rounded-xl border border-[#e5e5e5] bg-white p-4">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[#2b2b2b]">Case Notes</h3>
        <p className="mt-1 text-sm text-[#666666]">
          Internal notes for this case.
        </p>
      </div>

      <div className="mb-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a note..."
          className="min-h-27.5 w-full rounded-lg border border-[#d9d9d9] p-3 text-sm outline-none focus:border-[#2b2b2b]"
        />
        <button
          type="button"
          onClick={handleAddNote}
          disabled={isPending || !body.trim()}
          className="mt-3 rounded-lg bg-[#2b2b2b] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Add Note"}
        </button>

        {error ? (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        ) : null}
      </div>

      <div className="space-y-3">
        {notes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#d9d9d9] p-4 text-sm text-[#666666]">
            No notes yet.
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="rounded-lg border border-[#ececec] bg-[#fafafa] p-3"
            >
              <p className="whitespace-pre-wrap text-sm text-[#2b2b2b]">
                {note.body}
              </p>
              <p className="mt-2 text-xs text-[#777777]">
                {new Date(note.created_at).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}