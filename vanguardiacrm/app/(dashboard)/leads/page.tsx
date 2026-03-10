import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import LeadsWorkspace from "../../components/LeadsWorkspace";

export default function LeadsPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f5] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Topbar />

        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-[#2b2b2b]">Leads</h1>
              <p className="mt-2 text-[#6b6b6b]">
                Intake review queue fed by the Vanguardia intake AI through Zapier.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button className="rounded-md bg-[#4b0a06] px-4 py-2 text-sm font-medium text-white hover:bg-[#5f0d08]">
                Sync Leads
              </button>

              <div className="rounded-full border border-[#e4c9c4] bg-[#fdf6f5] px-4 py-2 text-sm text-[#4b0a06]">
                Source: AI Intake → Zapier → CRM
              </div>
            </div>
          </div>

          <LeadsWorkspace />
        </div>
      </div>
    </main>
  );
}