export default function CalendarPage() {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#2b2b2b]">Calendar</h1>
          <p className="mt-2 text-[#6b6b6b]">
            Manage appointments, case deadlines, hearings, and important case
            events.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[#e5e5e5] bg-white p-6">
        <div className="mb-4 text-lg font-semibold text-[#2b2b2b]">
          Upcoming Events
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border border-[#eeeeee] bg-[#fafafa] px-4 py-3 text-sm text-[#444444]">
            No upcoming events scheduled.
          </div>

          <div className="rounded-lg border border-[#eeeeee] bg-[#fafafa] px-4 py-3 text-sm text-[#444444]">
            Case hearings, client appointments, and reminders will appear here.
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-[#e5e5e5] bg-white p-6">
        <div className="mb-4 text-lg font-semibold text-[#2b2b2b]">
          Calendar View
        </div>

        <div className="flex h-100 items-center justify-center rounded-lg border border-dashed border-[#dddddd] text-[#6b6b6b]">
          Calendar interface coming soon.
        </div>
      </div>
    </>
  );
}