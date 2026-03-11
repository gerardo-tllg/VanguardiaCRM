import Link from "next/link";

export default function AutomationsPage() {
  return (
    <div>

      <div className="mb-6">
        <h1 className="text-4xl font-bold text-[#2b2b2b]">Automations</h1>
        <p className="mt-2 text-[#6b6b6b]">
          Configure automated workflows, triggers, and follow-ups for cases,
          leads, and client communications.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 transition hover:border-[#4b0a06] hover:shadow-sm">
          <h2 className="text-xl font-semibold text-[#2b2b2b]">
            Lead Intake Automation
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#6b6b6b]">
            Automatically process AI intake submissions and route them into the
            CRM lead pipeline for review and conversion.
          </p>

          <button className="mt-4 rounded-md bg-[#4b0a06] px-4 py-2 text-sm font-medium text-white hover:bg-[#5f0d08]">
            Configure
          </button>
        </div>

        <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 transition hover:border-[#4b0a06] hover:shadow-sm">
          <h2 className="text-xl font-semibold text-[#2b2b2b]">
            Client Messaging
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#6b6b6b]">
            Set up automated SMS and email messaging for treatment check-ins,
            case updates, reminders, and follow-up communications.
          </p>

          <button className="mt-4 rounded-md bg-[#4b0a06] px-4 py-2 text-sm font-medium text-white hover:bg-[#5f0d08]">
            Configure
          </button>
        </div>

        <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 transition hover:border-[#4b0a06] hover:shadow-sm">
          <h2 className="text-xl font-semibold text-[#2b2b2b]">
            Document Requests
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#6b6b6b]">
            Automatically send forms, file upload requests, and signature
            packets through the Collect system with fallback delivery options.
          </p>

          <button className="mt-4 rounded-md bg-[#4b0a06] px-4 py-2 text-sm font-medium text-white hover:bg-[#5f0d08]">
            Configure
          </button>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-[#e5e5e5] bg-white p-6">
        <h2 className="mb-4 text-2xl font-semibold text-[#2b2b2b]">
          Automation Activity
        </h2>

        <div className="space-y-3 text-sm text-[#6b6b6b]">
          <div className="rounded-lg border border-[#eeeeee] bg-[#fafafa] px-4 py-3">
            No automation events yet.
          </div>
          <div className="rounded-lg border border-[#eeeeee] bg-[#fafafa] px-4 py-3">
            Execution logs and workflow metrics will appear here.
          </div>
        </div>
      </div>
    </div>
  );
}