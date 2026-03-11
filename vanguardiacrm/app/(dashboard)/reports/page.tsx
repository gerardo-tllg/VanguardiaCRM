export default function ReportsPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-[#2b2b2b]">Reports</h1>
        <p className="mt-2 text-[#6b6b6b]">
          View performance metrics, case analytics, and operational reports for the firm.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 hover:border-[#4b0a06] transition">
          <h2 className="text-xl font-semibold text-[#2b2b2b]">Case Pipeline</h2>
          <p className="mt-2 text-sm text-[#6b6b6b]">
            Overview of cases by stage including treatment, demand, litigation, and settlement.
          </p>

          <button className="mt-4 rounded-md bg-[#4b0a06] px-4 py-2 text-sm font-medium text-white hover:bg-[#5f0d08]">
            View Report
          </button>
        </div>

        <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 hover:border-[#4b0a06] transition">
          <h2 className="text-xl font-semibold text-[#2b2b2b]">Lead Conversion</h2>
          <p className="mt-2 text-sm text-[#6b6b6b]">
            Track intake leads, acceptance rate, and case conversion performance.
          </p>

          <button className="mt-4 rounded-md bg-[#4b0a06] px-4 py-2 text-sm font-medium text-white hover:bg-[#5f0d08]">
            View Report
          </button>
        </div>

        <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 hover:border-[#4b0a06] transition">
          <h2 className="text-xl font-semibold text-[#2b2b2b]">Settlement Metrics</h2>
          <p className="mt-2 text-sm text-[#6b6b6b]">
            Analyze settlement amounts, case durations, and recovery trends.
          </p>

          <button className="mt-4 rounded-md bg-[#4b0a06] px-4 py-2 text-sm font-medium text-white hover:bg-[#5f0d08]">
            View Report
          </button>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-[#e5e5e5] bg-white p-6">
        <h2 className="mb-4 text-2xl font-semibold text-[#2b2b2b]">
          Activity Summary
        </h2>

        <div className="space-y-3 text-sm text-[#6b6b6b]">
          <div className="rounded-lg border border-[#eeeeee] bg-[#fafafa] px-4 py-3">
            Reporting dashboards will populate here as analytics are generated.
          </div>
        </div>
      </div>
    </>
  );
}