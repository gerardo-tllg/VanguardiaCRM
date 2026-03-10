const submissions = [
  {
    id: "sub_001",
    contact: "Stephanie Hernandez",
    project: "Stephanie Hernandez - 03/...",
    form: "Treatment Form",
    status: "Not Started",
    lastModified: "Assigned Yesterday 11:24 PM",
  },
  {
    id: "sub_002",
    contact: "Isabella Pacheco",
    project: "Isabella Pacheco - 02/25/...",
    form: "Treatment Form",
    status: "Completed",
    lastModified: "Completed Wednesday 10:28 AM",
  },
  {
    id: "sub_003",
    contact: "Suleyman Asad",
    project: "Suleyman Asad - 11/12/2025",
    form: "Treatment Form",
    status: "In Progress",
    lastModified: "Last Saved Tuesday 10:28 AM",
  },
  {
    id: "sub_004",
    contact: "Melissa Wilson",
    project: "Melissa Wilson - 02/07/20...",
    form: "Treatment Form",
    status: "Not Started",
    lastModified: "Assigned Feb 28 at 10:15 PM",
  },
];

function getStatusStyles(status: string) {
  switch (status) {
    case "Completed":
      return "bg-[#ecf8f1] text-[#1f7a4d] border border-[#b9e4cf]";
    case "In Progress":
      return "bg-[#eef4ff] text-[#1d4f91] border border-[#c9daf7]";
    case "Not Started":
      return "bg-[#fff7e8] text-[#8a5a00] border border-[#f1d9a6]";
    default:
      return "bg-[#f8f8f8] text-[#444444] border border-[#e5e5e5]";
  }
}

export default function FormsSubmissionsTable() {
  return (
    <div className="rounded-xl border border-[#e5e5e5] bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[#f8f8f8] border-b border-[#e5e5e5]">
            <tr className="text-left text-[#2b2b2b]">
              <th className="px-5 py-4 font-semibold">Contact</th>
              <th className="px-5 py-4 font-semibold">Project</th>
              <th className="px-5 py-4 font-semibold">Form</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 font-semibold">Last Modified</th>
              <th className="px-5 py-4 font-semibold"></th>
            </tr>
          </thead>

          <tbody>
            {submissions.map((submission) => (
              <tr
                key={submission.id}
                className="border-b border-[#eeeeee] last:border-b-0 hover:bg-[#fcfaf9]"
              >
                <td className="px-5 py-4">
                  <span className="inline-flex rounded-full bg-[#f1f1f1] px-4 py-2 text-sm text-[#2b2b2b]">
                    {submission.contact}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex rounded-full bg-[#f1f1f1] px-4 py-2 text-sm text-[#2b2b2b]">
                    {submission.project}
                  </span>
                </td>
                <td className="px-5 py-4 text-[#2b2b2b]">{submission.form}</td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getStatusStyles(
                      submission.status
                    )}`}
                  >
                    {submission.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-[#444444]">{submission.lastModified}</td>
                <td className="px-5 py-4 text-right text-[#6b6b6b]">◉</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
