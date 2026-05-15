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
  const supabase = useMemo(() => createClient(), []);

  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  // Autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/profiles")
      .then((r) => r.json())
      .then((d) => setProfiles(d.profiles ?? []))
      .catch(() => {});
  }, []);

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
          // Own notes are already optimistically added — skip them
          if (currentUserId && note.created_by === currentUserId) return;
          setNotes((prev) => [note, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [caseId, supabase]);

  const filteredProfiles =
    mentionQuery !== null
      ? profiles
          .filter((p) => {
            const q = mentionQuery.toLowerCase();
            return (
              p.full_name?.toLowerCase().startsWith(q) ||
              p.email?.toLowerCase().startsWith(q)
            );
          })
          .slice(0, 6)
      : [];

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setBody(value);

    const cursor = e.target.selectionStart ?? value.length;
    const textBeforeCursor = value.slice(0, cursor);
    const match = textBeforeCursor.match(/@(\w*)$/);

    if (match) {
      setMentionQuery(match[1]);
      setMentionStart(cursor - match[0].length);
      setActiveIndex(0);
    } else {
      setMentionQuery(null);
    }
  }

  function selectProfile(profile: Profile) {
    const name = profile.full_name ?? profile.email ?? "";
    const cursor = textareaRef.current?.selectionStart ?? body.length;
    const newBody = `${body.slice(0, mentionStart)}@${name} ${body.slice(cursor)}`;
    setBody(newBody);
    setMentionQuery(null);

    // Restore focus and place cursor after the inserted name + space
    setTimeout(() => {
      const ta = textareaRef.current;
      if (ta) {
        const pos = mentionStart + name.length + 2; // @ + name + space
        ta.focus();
        ta.setSelectionRange(pos, pos);
      }
    }, 0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionQuery === null || filteredProfiles.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % filteredProfiles.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + filteredProfiles.length) % filteredProfiles.length);
        break;
      case "Enter":
      case "Tab":
        e.preventDefault();
        selectProfile(filteredProfiles[activeIndex]);
        break;
      case "Escape":
        e.preventDefault();
        setMentionQuery(null);
        break;
    }
  }

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

  const confirmedMentions =
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
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Add a note... Use @Name to mention someone."
            className="min-h-27.5 w-full rounded-lg border border-[#d9d9d9] p-3 text-sm outline-none focus:border-[#2b2b2b]"
          />

          {mentionQuery !== null && filteredProfiles.length > 0 && (
            <ul
              role="listbox"
              className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-[#e5e5e5] bg-white shadow-lg"
            >
              {filteredProfiles.map((profile, i) => (
                <li
                  key={profile.id}
                  role="option"
                  aria-selected={i === activeIndex}
                  onMouseDown={(e) => {
                    // mousedown fires before blur — prevent textarea losing focus
                    e.preventDefault();
                    selectProfile(profile);
                  }}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={[
                    "flex cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg",
                    i === activeIndex
                      ? "bg-[#eef4ff] text-[#1d4f91]"
                      : "text-[#2b2b2b] hover:bg-[#f7f7f7]",
                  ].join(" ")}
                >
                  <span className="font-medium">
                    {profile.full_name ?? profile.email}
                  </span>
                  {profile.role && (
                    <span className="ml-2 shrink-0 text-xs text-[#9b9b9b]">
                      {ROLE_LABELS[profile.role] ?? profile.role}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {confirmedMentions.length > 0 && mentionQuery === null && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {confirmedMentions.map((p) => (
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
