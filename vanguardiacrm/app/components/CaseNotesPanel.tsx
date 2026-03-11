export default function CaseNotesPanel() {
  const notes = [
    {
      id: "note_001",
      author: "Stephanie Salas",
      time: "03/11/2026 11:50 AM",
      body: "Uploaded document LOR.pdf.",
    },
    {
      id: "note_002",
      author: "Stephanie Salas",
      time: "03/11/2026 11:50 AM",
      body: "Reviewed and attached document LOR.pdf.",
    },
    {
      id: "note_003",
      author: "Stephanie Salas",
      time: "03/11/2026 11:47 AM",
      body: "Updated RedPoint County Mutual on treatment status.",
    },
  ];

  return (
    <aside className="w-[340px] shrink-0">
      <div className="space-y-4">
        <div className="rounded-lg border border-[#e5e5e5] bg-white px-5 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#2b2b2b]">Case Tasks</h3>
            <button className="text-2xl font-semibold text-[#4b0a06]">+</button>
          </div>
        </div>

        <div className="rounded-lg border border-[#e5e5e5] bg-white px-5 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#2b2b2b]">Case Notes</h3>
            <button className="text-2xl font-semibold text-[#4b0a06]">+</button>
          </div>

          <div className="mt-4">
            <input
              type="text"
              placeholder="Search"
              className="w-full rounded-md border border-[#d9d9d9] bg-white px-4 py-2 text-sm text-[#2b2b2b] placeholder:text-[#8a8a8a] outline-none focus:border-[#4b0a06]"
            />
          </div>

          <div className="mt-4 rounded-md bg-[#f8f8f8] px-4 py-3 text-sm font-semibold text-[#6b6b6b]">
            Note
          </div>

          <div className="mt-4 space-y-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="rounded-md border border-[#eeeeee] bg-[#fafafa] p-4"
              >
                <div className="font-semibold italic text-[#2b2b2b]">
                  {note.author}
                </div>
                <div className="mt-1 font-semibold italic text-[#2b2b2b]">
                  {note.time}
                </div>
                <div className="mt-2 text-[#444444]">{note.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}