import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";

export default function MedicalTreatmentPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f5] flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <div className="p-6">
          <h1 className="text-4xl font-bold text-[#2b2b2b]">
            Medical Treatment
          </h1>
          <p className="mt-2 text-[#6b6b6b]">
            Provider visits, treatment progress, records, bills, and care timeline.
          </p>

          <div className="mt-6 rounded-xl border border-[#e5e5e5] bg-white p-6">
            <p className="text-[#444444]">
              Medical Treatment page placeholder.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}