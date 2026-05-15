"use client";

import { useState, useTransition, useEffect, useRef, useMemo } from "react";
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

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  attorney: "Attorney",
  paralegal: "Paralegal",
  intake: "Intake",
  staff: "Staff",
};

function getAuthorLabel(note: Note) {
  return note.author_name || note.created_by || "Unknown";
}

export default function CaseNotesPanel({
  caseId,
  caseNumber,
  initialNotes,
}: CaseNotesPanelProps) {
  const supabase = useMemo(() => createClient(), []);

  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  // To / CC selector state
  const [toUserId, setToUserId] = useState<string | null>(null);
  const [ccUserIds, setCcUserIds] = useState<string[]>([]);
  const [toOpen, setToOpen] = useState(false);
  const [ccOpen, setCcOpen] = useState(false);
  const [toSearch, setToSearch] = useState("");
  const [ccSearch, setCcSearch] = useState("");

  const toWrapperRef = useRef<HTMLDivElement>(null);
  const ccWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/profiles")
      .then((r) => r.json())
      .then((d) => setProfiles(d.profiles ?? []))
      .catch(() => {});
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (toOpen && toWrapperRef.current && !toWrapperRef.current.contains(e.target as Node)) {
        setToOpen(false);
        setToSearch("");
      }
      if (ccOpen && ccWrapperRef.current && !ccWrapperRef.current.contains(e.target as Node)) {
        setCcOpen(false);
        setCcSearch("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [toOpen, ccOpen]);

  // Realtime subscription — append notes from other users as they arrive
  useEffect(() => {
    let currentUserId: string | null = null;

    supabase.auth.getUser().then(({ data: { user } }) => {
      currentUserId = user?.id ?? null;
    });

    const channel = supabase
      .channel(`case_notes_${caseId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "case_notes",
          filter: `case_id=eq.${caseId}`,
        },
        (payload) => {
          const note = payload.new as Note;
          if (currentUserId && note.created_by === currentUserId) return;
          setNotes((prev) => [note, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [caseId, supabase]);

  const toProfile = profiles.find((p) => p.id === toUserId) ?? null;
  const ccProfiles = profiles.filter((p) => ccUserIds.includes(p.id));

  const toFiltered = profiles.filter((p) => {
    const q = toSearch.toLowerCase();
    return (
      !q ||
      p.full_name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q)
    );
  }).slice(0, 8);

  const ccFiltered = profiles.filter((p) => {
    if (ccUserIds.includes(p.id)) return false;
    const q = ccSearch.toLowerCase();
    return (
      !q ||
      p.full_name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q)
    );
  }).slice(0, 8);

  async function handleAddNote() {
    const trimmed = body.trim();
    if (!trimmed) return;

    setError(null);

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

    // Capture selections before resetting
    const capturedToUserId = toUserId;
    const capturedCcUserIds = [...ccUserIds];

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
      setToUserId(null);
      setCcUserIds([]);

      if (capturedToUserId || capturedCcUserIds.length > 0) {
        fetch("/api/notifications/mention-note", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caseId,
            noteId: (data as Note).id,
            noteBody: trimmed,
            toUserId: capturedToUserId ?? null,
            ccUserIds: capturedCcUserIds,
          }),
        }).catch(() => {});
      }
    });
  }

  return (
    <aside className="w-full max-w-md rounded-xl border border-[#e5e5e5] bg-white p-4">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[#2b2b2b]">Case Notes</h3>
        <p className="mt-1 text-sm text-[#666666]">Internal notes for this case.</p>
      </div>

      <div className="mb-4 space-y-3">
        {/* To selector */}
        <div>
          <label className="mb-1 block text-xs font-medium text-[#6b6b6b]">Notify</label>
          <div className="relative" ref={toWrapperRef}>
            <button
              type="button"
              onClick={() => { setToOpen((v) => !v); setToSearch(""); }}
              className="flex w-full items-center justify-between rounded-lg border border-[#e5e5e5] bg-white px-3 py-2 text-sm text-left hover:border-[#d5d5d5]"
            >
              {toProfile ? (
                <span className="text-[#2b2b2b]">{toProfile.full_name ?? toProfile.email}</span>
              ) : (
                <span className="text-[#9b9b9b]">Select staff member...</span>
              )}
              <span className="ml-2 flex shrink-0 items-center gap-1">
                {toProfile && (
                  <span
                    role="button"
                    tabIndex={0}
                    onMouseDown={(e) => { e.stopPropagation(); setToUserId(null); }}
                    className="flex h-4 w-4 items-center justify-center rounded-full text-[#9b9b9b] hover:bg-[#f0f0f0] hover:text-[#2b2b2b]"
                  >
                    ×
                  </span>
                )}
                <svg className="h-4 w-4 text-[#9b9b9b]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
              </span>
            </button>

            {toOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-[#e5e5e5] bg-white shadow-lg">
                <div className="border-b border-[#f0f0f0] p-2">
                  <input
                    autoFocus
                    value={toSearch}
                    onChange={(e) => setToSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full rounded-md border border-[#e5e5e5] px-2 py-1.5 text-xs outline-none focus:border-[#2b2b2b]"
                  />
                </div>
                <ul className="max-h-48 overflow-y-auto">
                  {toFiltered.length === 0 ? (
                    <li className="px-3 py-2 text-xs text-[#9b9b9b]">No matches</li>
                  ) : (
                    toFiltered.map((p) => (
                      <li
                        key={p.id}
                        onMouseDown={() => { setToUserId(p.id); setToOpen(false); setToSearch(""); }}
                        className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-[#f7f7f7]"
                      >
                        <span className="text-[#2b2b2b]">{p.full_name ?? p.email}</span>
                        {p.role && (
                          <span className="ml-2 shrink-0 text-xs text-[#9b9b9b]">
                            {ROLE_LABELS[p.role] ?? p.role}
                          </span>
                        )}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* CC selector */}
        <div>
          <label className="mb-1 block text-xs font-medium text-[#6b6b6b]">CC</label>
          <div className="relative" ref={ccWrapperRef}>
            <div
              className="flex min-h-[38px] cursor-text flex-wrap items-center gap-1.5 rounded-lg border border-[#e5e5e5] bg-white px-3 py-1.5 hover:border-[#d5d5d5]"
              onMouseDown={(e) => {
                if ((e.target as HTMLElement).closest("button")) return;
                setCcOpen(true);
              }}
            >
              {ccProfiles.map((p) => (
                <span
                  key={p.id}
                  className="flex items-center gap-1 rounded-full bg-[#eef4ff] px-2 py-0.5 text-xs font-medium text-[#1d4f91]"
                >
                  {p.full_name ?? p.email}
                  <button
                    type="button"
                    onMouseDown={(e) => { e.stopPropagation(); setCcUserIds((prev) => prev.filter((id) => id !== p.id)); }}
                    className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-[#1d4f91] hover:bg-[#1d4f91] hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
              {ccProfiles.length === 0 && (
                <span className="text-sm text-[#9b9b9b]">Add others...</span>
              )}
            </div>

            {ccOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-[#e5e5e5] bg-white shadow-lg">
                <div className="border-b border-[#f0f0f0] p-2">
                  <input
                    autoFocus
                    value={ccSearch}
                    onChange={(e) => setCcSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full rounded-md border border-[#e5e5e5] px-2 py-1.5 text-xs outline-none focus:border-[#2b2b2b]"
                  />
                </div>
                <ul className="max-h-48 overflow-y-auto">
                  {ccFiltered.length === 0 ? (
                    <li className="px-3 py-2 text-xs text-[#9b9b9b]">
                      {ccSearch ? "No matches" : "All staff already added"}
                    </li>
                  ) : (
                    ccFiltered.map((p) => (
                      <li
                        key={p.id}
                        onMouseDown={() => {
                          setCcUserIds((prev) => [...prev, p.id]);
                          setCcSearch("");
                        }}
                        className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-[#f7f7f7]"
                      >
                        <span className="text-[#2b2b2b]">{p.full_name ?? p.email}</span>
                        {p.role && (
                          <span className="ml-2 shrink-0 text-xs text-[#9b9b9b]">
                            {ROLE_LABELS[p.role] ?? p.role}
                          </span>
                        )}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Note textarea */}
        <div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a note..."
            className="min-h-[110px] w-full rounded-lg border border-[#e5e5e5] p-3 text-sm outline-none focus:border-[#2b2b2b]"
          />
        </div>

        <button
          type="button"
          onClick={handleAddNote}
          disabled={isPending || !body.trim()}
          className="rounded-lg bg-[#2b2b2b] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Add Note"}
        </button>

        {error && <p className="text-sm text-red-600">{error}</p>}
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
              <p className="whitespace-pre-wrap text-sm text-[#2b2b2b]">{note.body}</p>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
