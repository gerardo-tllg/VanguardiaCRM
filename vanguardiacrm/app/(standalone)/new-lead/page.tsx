"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function NewLeadPage() {
  const router = useRouter();

  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [language, setLanguage] = useState("en");
  const [accidentDate, setAccidentDate] = useState("");
  const [accidentType, setAccidentType] = useState("");
  const [location, setLocation] = useState("");
  const [defendant, setDefendant] = useState("");
  const [treatment, setTreatment] = useState("");
  const [injuries, setInjuries] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [source, setSource] = useState("Manual Intake");
  const [campaign, setCampaign] = useState("");
  const [intakeNotes, setIntakeNotes] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_name: clientName,
          phone,
          email,
          accident_date: accidentDate || null,
          accident_type: accidentType,
          injuries,
          ai_summary: null,
          lang: language,
          utm_source: source || "manual",
          utm_campaign: campaign || "manual-entry",

          raw_payload: {
            location,
            defendant,
            treatment,
            priority,
            intake_notes: intakeNotes,
            evidence_files: evidenceFiles
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
            source_type: "manual_entry",
          },
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "Failed to create lead");
      }

      router.push("/leads");
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create lead");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      <div className="mx-auto max-w-4xl p-6">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-[#2b2b2b]">New Lead</h1>
          <p className="mt-2 text-[#6b6b6b]">
            Create a manual intake record for attorney review.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl border border-[#e5e5e5] bg-white p-6"
        >
          <section>
            <h2 className="text-lg font-semibold text-[#2b2b2b]">
              Client Information
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                  Client Name
                </label>
                <input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                  Phone
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                  Preferred Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                </select>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#2b2b2b]">
              Incident Details
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                  Date of Incident
                </label>
                <input
                  type="date"
                  value={accidentDate}
                  onChange={(e) => setAccidentDate(e.target.value)}
                  className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                  Accident Type
                </label>
                <select
                  value={accidentType}
                  onChange={(e) => setAccidentType(e.target.value)}
                  className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                  required
                >
                  <option value="">Select accident type</option>
                  <option value="Motor Vehicle Accident">Motor Vehicle Accident</option>
                  <option value="Premises Liability">Premises Liability</option>
                  <option value="Slip / Fall">Slip / Fall</option>
                  <option value="Work Injury">Work Injury</option>
                  <option value="Dog Bite">Dog Bite</option>
                  <option value="Wrongful Death">Wrongful Death</option>
                  <option value="Other Personal Injury">Other Personal Injury</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                  Location
                </label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                  placeholder="City, property, roadway, etc."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                  Defendant / At-Fault Party
                </label>
                <input
                  value={defendant}
                  onChange={(e) => setDefendant(e.target.value)}
                  className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                  Injuries
                </label>
                <textarea
                  value={injuries}
                  onChange={(e) => setInjuries(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-[#d9d9d9] px-4 py-3"
                  placeholder="Describe the injuries briefly"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                  Treatment Status
                </label>
                <input
                  value={treatment}
                  onChange={(e) => setTreatment(e.target.value)}
                  className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                  placeholder="ER, chiropractor, no treatment yet, ongoing care, etc."
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#2b2b2b]">
              Intake Routing
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                  Priority Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                  Source
                </label>
                <input
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                  placeholder="Manual Intake, Referral, Walk-In, etc."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                  Campaign
                </label>
                <input
                  value={campaign}
                  onChange={(e) => setCampaign(e.target.value)}
                  className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                  Evidence File Names
                </label>
                <input
                  value={evidenceFiles}
                  onChange={(e) => setEvidenceFiles(e.target.value)}
                  className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                  placeholder="photo1.jpg, report.pdf"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                  Internal Intake Notes
                </label>
                <textarea
                  value={intakeNotes}
                  onChange={(e) => setIntakeNotes(e.target.value)}
                  rows={5}
                  className="w-full rounded-md border border-[#d9d9d9] px-4 py-3"
                  placeholder="Any quick notes for the attorney or intake team"
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-[#4b0a06] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#5f0d08] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Create Lead"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}