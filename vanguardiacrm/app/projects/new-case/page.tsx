"use client";

import { useState } from "react";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";

export default function NewCasePage() {
  const [formData, setFormData] = useState({
    clientName: "",
    phone: "",
    email: "",
    caseType: "Personal Injury",
    dateOfIncident: "",
    status: "Welcome!",
    assignedTo: "Admin",
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
    alert("New case saved (MVP placeholder)");
  }

  return (
    <main className="min-h-screen bg-[#f5f5f5] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Topbar />

        <div className="p-6 max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-[#2b2b2b]">New Case</h1>
              <p className="mt-2 text-[#6b6b6b]">
                Manually create a new personal injury case.
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
                  Client Name
                </label>
                <input
                  name="clientName"
                  value={formData.clientName}
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
                  <option>Wrongful Death</option>
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

              <div>
                <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-md border border-[#d9d9d9] px-4 py-2 outline-none focus:border-[#4b0a06]"
                >
                  <option>Welcome!</option>
                  <option>Treatment Phase</option>
                  <option>Settlement</option>
                  <option>Archived</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                Notes
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
                Save Case
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