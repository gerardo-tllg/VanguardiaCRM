import Link from "next/link";
import ProjectsTable from "../../components/ProjectsTable";

export default function ProjectsPage() {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#2b2b2b]">Projects</h1>
          <p className="mt-1 text-sm text-[#6b6b6b]">
            Personal injury matters and portal activity
          </p>
        </div>

        <div className="w-70">
          <input
            type="text"
            placeholder="Search"
            className="w-full rounded-md border border-[#d9d9d9] bg-white px-4 py-2 text-sm text-[#2b2b2b] placeholder:text-[#8a8a8a] outline-none focus:border-[#4b0a06]"
          />
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/projects/new-case"
          className="rounded-md bg-[#4b0a06] px-4 py-2 text-sm font-medium text-white hover:bg-[#5f0d08]"
        >
          New Case
        </Link>

        <Link
          href="/projects/new-lead"
          className="rounded-md border border-[#e5e5e5] bg-white px-4 py-2 text-sm font-medium text-[#2b2b2b] hover:bg-[#f7f7f7]"
        >
          New Lead
        </Link>

        <div className="ml-4 rounded-full border border-[#e4c9c4] bg-[#fdf6f5] px-4 py-2 text-sm text-[#4b0a06]">
          Status is not Complete
        </div>
      </div>

      <ProjectsTable />
    </>
  );
}