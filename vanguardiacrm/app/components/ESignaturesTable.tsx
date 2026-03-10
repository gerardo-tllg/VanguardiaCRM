const signatures = [
  {
    id: "sig_001",
    contact: "Reyna Vazquez",
    project: "Reyna Vazquez - 01/29/2026",
    template: "2026 PI Contract",
    status: "Signed",
    lastModified: "Completed Today 11:02 AM",
  },
  {
    id: "sig_002",
    contact: "Carlos Cortez",
    project: "Carlos Cortez - 03/05/2026",
    template: "2026 HIPAA Authorization Form",
    status: "Sent",
    lastModified: "Sent Yesterday 2:14 PM",
  },
  {
    id: "sig_003",
    contact: "Angela Flores",
    project: "Angela Flores - 03/01/2026",
    template: "2026 PI Contract",
    status: "Not Started",
    lastModified: "Assigned Mar 8 at 9:10 AM",
  },
];

function getStatusStyles(status: string) {
  switch (status) {
    case "Signed":
      return "bg-[#ecf8f1] text-[#1f7a4d] border border-[#b9e4cf]";
    case "Sent":
      return "bg-[#eef4ff] text-[#1d4f91] border border-[#c9daf7]";
    case "Not Started":
      return "bg-[#fff7e8] text-[#8a5a00] border border-[#f1d9a6]";
    default:
      return "bg-[#f8f8f8] text-[#444444] border border-[#e5e5e5]";
  }
}

export default function ESignaturesTable() {
  return (
    <div className="rounded-xl border border-[#e5e5e5] bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[#f8f8f8] border-b border-[#e5e5e5]">
            <tr className="text-left text-[#2b2b2b]">
              <th className="px-5 py-4 font-semibold">Contact</th>
              <th className="px-5 py-4 font-semibold">Project</th>
              <th className="px-5 py-4 font-semibold">Template</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 font-semibold">Last Modified</th>
              <th className="px-5 py-4 font-semibold"></th>
            </tr>
          </thead>

          <tbody>
            {signatures.map((signature) => (
              <tr
                key={signature.id}
                className="border-b border-[#eeeeee] last:border-b-0 hover:bg-[#fcfaf9]"
              >
                <td className="px-5 py-4">
                  <span className="inline-flex rounded-full bg-[#f1f1f1] px-4 py-2 text-sm text-[#2b2b2b]">
                    {signature.contact}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex rounded-full bg-[#f1f1f1] px-4 py-2 text-sm text-[#2b2b2b]">
                    {signature.project}
                  </span>
                </td>
                <td className="px-5 py-4 text-[#2b2b2b]">{signature.template}</td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getStatusStyles(
                      signature.status
                    )}`}
                  >
                    {signature.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-[#444444]">{signature.lastModified}</td>
                <td className="px-5 py-4 text-right text-[#6b6b6b]">◉</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}