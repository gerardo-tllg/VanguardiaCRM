"use client";

import { useState, useTransition, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Note = {
  id: string;
  case_id: string;
  body: string;
  created_at: string;
  updated_at?: string | null;
  created_by?: string | null;
  author_name?: string | null;
};

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
};

type CaseNotesPanelProps = {
  caseId: string;
  caseNumber?: string;
  initialNotes: Note[];
};

function getAuthorLabel(note: Note) {
  return note.author_name || note.created_by || "Unknown";
}

function parseMentions(text: string): string[] {
  const matches = text.match(/@([A-Za-z]+(?:\s[A-Za-z]+)?)/g) ?? [];
  return matches.map((m) => m.slice(1).toLowerCase());
}

function resolveMentionedUsers(mentions: string[], profiles: Profile[]): Profile[] {
  return profiles.filter((p) =>
    mentions.some(
      (m) =>
        p.full_name?.toLowerCase().startsWith(m) ||
        p.email?.toLowerCase().startsWith(m)
    )
  );
}

export default function CaseNotesPanel({
  caseId,
  caseNumber,
  initialNotes,
}: CaseNotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    fetch("/api/profiles")
      .then((r) => r.json())
      .then((d) => setProfiles(d.profiles ?? []))
      .catch(() => {});
  }, []);

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

    const authorName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email ||
      "Staff";

    startTransition(async () => {
      const { data, error } = await supabase
        .from("case_notes")
        .insert({
          case_id: caseId,
          body: trimmed,
          created_by: user.id,
          author_name: authorName,
        })
        .select("*")
        .single();

      if (error) {
        setError(error.message);
        return;
      }

      setNotes((prev) => [data as Note, ...prev]);
      setBody("");

      const mentions = parseMentions(trimmed);
      if (mentions.length > 0 && profiles.length > 0) {
        const mentioned = resolveMentionedUsers(mentions, profiles).filter(
          (p) => p.id !== user.id
        );

        if (mentioned.length > 0) {
          fetch("/api/notifications/mention-note", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              case_id: caseId,
              note_id: (data as Note).id,
              mentioned_user_ids: mentioned.map((p) => p.id),
              mentioner_name: authorName,
              case_number: caseNumber ?? null,
            }),
          }).catch(() => {});
        }
      }
    });
  }

  const activeMentions =
    profiles.length > 0
      ? resolveMentionedUsers(parseMentions(body), profiles)
      : [];

  return (
    <aside className="w-full max-w-md rounded-xl border border-[#e5e5e5] bg-white p-4">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[#2b2b2b]">Case Notes</h3>
        <p className="mt-1 text-sm text-[#666666]">
          Internal notes for this case. Use @Name to mention a team member.
        </p>
      </div>

      <div className="mb-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a note... Use @Name to mention someone."
          className="min-h-27.5 w-full rounded-lg border border-[#d9d9d9] p-3 text-sm outline-none focus:border-[#2b2b2b]"
        />

        {activeMentions.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {activeMentions.map((p) => (
              <span
                key={p.id}
                className="rounded-full bg-[#eef4ff] px-2 py-0.5 text-xs font-medium text-[#1d4f91]"
              >
                {p.full_name ?? p.email}
              </span>
            ))}
          </div>
        )}

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
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-[#2b2b2b]">
                  {getAuthorLabel(note)}
                </p>
                <p className="text-xs text-[#777777]">
                  {new Date(note.created_at).toLocaleString()}
                </p>
              </div>

              <p className="whitespace-pre-wrap text-sm text-[#2b2b2b]">
                {note.body}
              </p>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
