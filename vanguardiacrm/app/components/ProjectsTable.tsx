import Link from "next/link";

type Project = {
  caseId: string;
  contact: string;
  name: string;
  type: string;
  phase: string;
  team: string;
  phone: string;
  email: string;
  lastLogin: string;
};

const mockProjects: Project[] = [
  {
    caseId: "case0001",
    contact: "Reyna Vazquez",
    name: "Reyna Vazquez - 01/29/2026",
    type: "Slip / Fall",
    phase: "Treatment Phase",
    team: "4 Team Members",
    phone: "+1 (956) 325-3075",
    email: "reynavazquez06@icloud.com",
    lastLogin: "03/09/2026",
  },
  {
    caseId: "case0002",
    contact: "Carlos Cortez",
    name: "Carlos Cortez - 03/05/2026",
    type: "Premises Liability",
    phase: "Welcome!",
    team: "3 Team Members",
    phone: "+1 (956) 684-7014",
    email: "N/A",
    lastLogin: "03/09/2026",
  },
  {
    caseId: "case0003",
    contact: "Angela Flores",
    name: "Angela Flores - 03/01/2026",
    type: "Motor Vehicle Accident",
    phase: "Settlement",
    team: "4 Team Members",
    phone: "+1 (956) 555-8744",
    email: "angelaflores@email.com",
    lastLogin: "03/08/2026",
  },
];

function getPhaseStyles(phase: string) {
  switch (phase) {
    case "Settlement":
      return "bg-[#ecf8f1] text-[#1f7a4d] border border-[#b9e4cf]";
    case "Treatment Phase":
      return "bg-[#f6f1e8] text-[#5a4330] border border-[#e8dccb]";
    case "Welcome!":
      return "bg-[#f3e7e5] text-[#4b0a06] border border-[#e4c9c4]";
    case "Archived":
      return "bg-[#f1f1f1] text-[#6b6b6b] border border-[#dddddd]";
    default:
      return "bg-[#f8f8f8] text-[#444444] border border-[#e5e5e5]";
  }
}

export default function ProjectsTable() {
  return (
    <div className="overflow-hidden rounded-xl border border-[#e5e5e5] bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[#f8f8f8] border-b border-[#e5e5e5]">
            <tr className="text-left text-[#2b2b2b]">
              <th className="px-4 py-4 font-semibold">Contact</th>
              <th className="px-4 py-4 font-semibold">Case Name</th>
              <th className="px-4 py-4 font-semibold">Case Type</th>
              <th className="px-4 py-4 font-semibold">Phase</th>
              <th className="px-4 py-4 font-semibold">Team Members</th>
              <th className="px-4 py-4 font-semibold">Phone</th>
              <th className="px-4 py-4 font-semibold">Email</th>
              <th className="px-4 py-4 font-semibold">Last Login</th>
            </tr>
          </thead>

          <tbody>
            {mockProjects.map((project) => (
              <tr
                key={project.caseId}
                className="border-b border-[#eeeeee] last:border-b-0 hover:bg-[#fcfaf9] transition"
              >
                <td className="px-4 py-4 font-medium text-[#2b2b2b]">
                  {project.contact}
                </td>

                <td className="px-4 py-4">
                  <Link
                    href={`/cases/${project.caseId}/overview`}
                    className="font-medium text-[#4b0a06] underline underline-offset-2 hover:text-[#5f0d08]"
                  >
                    {project.name}
                  </Link>
                </td>

                <td className="px-4 py-4 text-[#555555]">
                  {project.type}
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getPhaseStyles(
                      project.phase
                    )}`}
                  >
                    {project.phase}
                  </span>
                </td>

                <td className="px-4 py-4">
                  <span className="cursor-pointer text-[#4b0a06] underline underline-offset-2 hover:text-[#5f0d08]">
                    {project.team}
                  </span>
                </td>

                <td className="px-4 py-4 text-[#444444]">
                  {project.phone}
                </td>

                <td className="px-4 py-4 text-[#444444]">
                  {project.email}
                </td>

                <td className="px-4 py-4 text-[#6b6b6b]">
                  {project.lastLogin}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}