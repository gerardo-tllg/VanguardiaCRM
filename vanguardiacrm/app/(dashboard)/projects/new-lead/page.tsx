"use client";

import { useState } from "react";
import Link from "next/link";
import Sidebar from "../../../components/Sidebar";
import Topbar from "../../../components/Topbar";

export default function NewLeadPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    source: "Manual Entry",
    caseType: "Personal Injury",
    dateOfIncident: "",
    priority: "Medium",
    notes: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    alert("New lead saved (MVP placeholder)");
  }

  return (
    <main className="min-h-screen bg-[#f5f5f5] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Topbar />

        <div className="p-6 max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-[#2b2b2b]">New Lead</h1>
              <p className="mt-2 text-[#6b6b6b]">
                Manually enter an intake lead into the CRM.
              </p>
            </div>

            <Link
              href="/projects"
              className="rounded-md border border-[#e5e5e5] bg-white px-4 py-2 text-sm text-[#2b2b2b] hover:bg-[#f7f7f7]"
            >
              Back to Projects
            </Link>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-[#e5e5e5] bg-white p-6 space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                  Full Name
                </label>
                <input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full rounded-md border border-[#d9d9d9] px-4 py-2 outline-none focus:border-[#4b0a06]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                  Phone
                </label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full rounded-md border border-[#d9d9d9] px-4 py-2 outline-none focus:border-[#4b0a06]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                  Email
                </label>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-md border border-[#d9d9d9] px-4 py-2 outline-none focus:border-[#4b0a06]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                  Source
                </label>
                <select
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  className="w-full rounded-md border border-[#d9d9d9] px-4 py-2 outline-none focus:border-[#4b0a06]"
                >
                  <option>Manual Entry</option>
                  <option>AI Intake</option>
                  <option>Direct Website</option>
                  <option>Referral</option>
                  <option>Phone Call</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                  Case Type
                </label>
                <select
                  name="caseType"
                  value={formData.caseType}
                  onChange={handleChange}
                  className="w-full rounded-md border border-[#d9d9d9] px-4 py-2 outline-none focus:border-[#4b0a06]"
                >
                  <option>Personal Injury</option>
                  <option>Premises Liability</option>
                  <option>Motor Vehicle Accident</option>
                  <option>Truck Accident</option>
                  <option>Slip and Fall</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full rounded-md border border-[#d9d9d9] px-4 py-2 outline-none focus:border-[#4b0a06]"
                >
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                  Date of Incident
                </label>
                <input
                  type="date"
                  name="dateOfIncident"
                  value={formData.dateOfIncident}
                  onChange={handleChange}
                  className="w-full rounded-md border border-[#d9d9d9] px-4 py-2 outline-none focus:border-[#4b0a06]"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                Intake Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={5}
                className="w-full rounded-md border border-[#d9d9d9] px-4 py-3 outline-none focus:border-[#4b0a06]"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="rounded-md bg-[#4b0a06] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#5f0d08]"
              >
                Save Lead
              </button>

              <Link
                href="/projects"
                className="rounded-md border border-[#e5e5e5] bg-white px-5 py-2.5 text-sm font-medium text-[#2b2b2b] hover:bg-[#f7f7f7]"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}