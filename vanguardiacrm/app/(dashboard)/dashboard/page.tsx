export default function DashboardPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-[#2b2b2b]">Dashboard</h1>
        <p className="mt-2 text-[#6b6b6b]">
          Overview of leads, cases, messages, and firm activity.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-[#e5e5e5] bg-white p-6">
          <div className="text-sm text-[#6b6b6b]">Active Cases</div>
          <div className="mt-2 text-3xl font-bold text-[#2b2b2b]">24</div>
        </div>

        <div className="rounded-xl border border-[#e5e5e5] bg-white p-6">
          <div className="text-sm text-[#6b6b6b]">New Leads</div>
          <div className="mt-2 text-3xl font-bold text-[#2b2b2b]">7</div>
        </div>

        <div className="rounded-xl border border-[#e5e5e5] bg-white p-6">
          <div className="text-sm text-[#6b6b6b]">Unread Messages</div>
          <div className="mt-2 text-3xl font-bold text-[#2b2b2b]">13</div>
        </div>

        <div className="rounded-xl border border-[#e5e5e5] bg-white p-6">
          <div className="text-sm text-[#6b6b6b]">Pending Signatures</div>
          <div className="mt-2 text-3xl font-bold text-[#2b2b2b]">5</div>
        </div>
      </div>
    </>
  );
}